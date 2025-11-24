import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { calculateUtilityCost } from "@/lib/utils/meter-calculations"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      meterReadingIds, // Array of meter reading IDs
      createNewBill = false, // If true, create new bill for each reading. If false, update existing or find by month
      defaultMonth, // Default month for new bills (YYYY-MM format)
      batchAction = "auto", // "auto", "update_existing", "create_new"
    } = body

    if (!meterReadingIds || !Array.isArray(meterReadingIds) || meterReadingIds.length === 0) {
      return NextResponse.json(
        { error: 'meterReadingIds array is required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    const results = {
      success: [] as any[],
      failed: [] as any[],
      skipped: [] as any[],
    }

    // Process each meter reading
    for (const meterReadingId of meterReadingIds) {
      try {
        // Get meter reading with related data
        const { data: meterReading, error: readingError } = await supabase
          .from('meter_readings')
          .select(`
            *,
            utility_meters!inner(
              id,
              meter_type,
              unit_id,
              units!inner(project_id)
            )
          `)
          .eq('id', meterReadingId)
          .single()

        if (readingError || !meterReading) {
          results.failed.push({
            meterReadingId,
            error: 'Meter reading not found',
          })
          continue
        }

        // Check if already linked to a bill
        if (meterReading.bill_id) {
          results.skipped.push({
            meterReadingId,
            reason: 'Already linked to a bill',
            billId: meterReading.bill_id,
          })
          continue
        }

        const meter = meterReading.utility_meters
        const unitId = meter.unit_id
        const meterType = meter.meter_type
        const projectId = meter.units?.project_id || null

        // Calculate cost using utility rates
        const costResult = await calculateUtilityCost(
          meterType,
          meterReading.usage_amount,
          meterReading.reading_date,
          supabase,
          projectId
        )

        const calculatedFee = costResult.cost || 0

        let targetBill: any = null

        // Determine action based on batchAction
        if (batchAction === "update_existing") {
          // Try to find existing bill by month
          const readingMonth = meterReading.reading_date.substring(0, 7) // YYYY-MM
          const { data: existingBill } = await supabase
            .from('bills')
            .select('*')
            .eq('unit_id', unitId)
            .eq('month', readingMonth)
            .maybeSingle()

          if (existingBill) {
            targetBill = existingBill
          } else {
            results.skipped.push({
              meterReadingId,
              reason: 'No existing bill found for this month',
              month: readingMonth,
            })
            continue
          }
        } else if (batchAction === "create_new") {
          // Will create new bill below
          targetBill = null
        } else {
          // Auto: Try to find existing, otherwise create new
          const readingMonth = meterReading.reading_date.substring(0, 7)
          const { data: existingBill } = await supabase
            .from('bills')
            .select('*')
            .eq('unit_id', unitId)
            .eq('month', readingMonth)
            .maybeSingle()

          if (existingBill) {
            targetBill = existingBill
          }
        }

        if (targetBill) {
          // Update existing bill
          const updateData: any = {
            total: (targetBill.total || 0) - (targetBill[meterType === 'water' ? 'water_fee' : 'electricity_fee'] || 0) + calculatedFee,
          }

          if (meterType === 'water') {
            updateData.water_fee = calculatedFee
            updateData.water_meter_reading_id = meterReadingId
          } else if (meterType === 'electricity') {
            updateData.electricity_fee = calculatedFee
            updateData.electricity_meter_reading_id = meterReadingId
          }

          const { data: updatedBill, error: updateError } = await supabase
            .from('bills')
            .update(updateData)
            .eq('id', targetBill.id)
            .select()
            .single()

          if (updateError) {
            results.failed.push({
              meterReadingId,
              error: `Failed to update bill: ${updateError.message}`,
            })
            continue
          }

          // Update meter_reading with bill_id
          await supabase
            .from('meter_readings')
            .update({ bill_id: updatedBill.id })
            .eq('id', meterReadingId)

          results.success.push({
            meterReadingId,
            action: 'updated',
            billId: updatedBill.id,
            billNumber: updatedBill.bill_number,
            calculatedFee,
          })
        } else {
          // Create new bill
          const month = defaultMonth || meterReading.reading_date.substring(0, 7)
          const [year, monthNum] = month.split('-').map(Number)

          // Generate bill number
          const { data: lastBill } = await supabase
            .from('bills')
            .select('bill_number')
            .like('bill_number', `BILL-${year}${String(monthNum).padStart(2, '0')}-%`)
            .order('bill_number', { ascending: false })
            .limit(1)
            .maybeSingle()

          let sequence = 1
          if (lastBill) {
            const lastNum = parseInt(lastBill.bill_number.split('-').pop() || '0', 10)
            sequence = lastNum + 1
          }

          const billNumber = `BILL-${year}${String(monthNum).padStart(2, '0')}-${String(sequence).padStart(3, '0')}`

          const newBillData: any = {
            unit_id: unitId,
            project_id: projectId,
            month: month,
            year: year,
            bill_number: billNumber,
            status: 'pending',
            due_date: new Date(year, monthNum, 5).toISOString().split('T')[0],
            total: calculatedFee,
          }

          if (meterType === 'water') {
            newBillData.water_fee = calculatedFee
            newBillData.water_meter_reading_id = meterReadingId
          } else if (meterType === 'electricity') {
            newBillData.electricity_fee = calculatedFee
            newBillData.electricity_meter_reading_id = meterReadingId
          }

          const { data: newBill, error: createError } = await supabase
            .from('bills')
            .insert([newBillData])
            .select()
            .single()

          if (createError) {
            results.failed.push({
              meterReadingId,
              error: `Failed to create bill: ${createError.message}`,
            })
            continue
          }

          // Update meter_reading with bill_id
          await supabase
            .from('meter_readings')
            .update({ bill_id: newBill.id })
            .eq('id', meterReadingId)

          results.success.push({
            meterReadingId,
            action: 'created',
            billId: newBill.id,
            billNumber: newBill.bill_number,
            calculatedFee,
          })
        }
      } catch (error: any) {
        results.failed.push({
          meterReadingId,
          error: error.message || 'Unknown error',
        })
      }
    }

    return NextResponse.json({
      success: true,
      summary: {
        total: meterReadingIds.length,
        success: results.success.length,
        failed: results.failed.length,
        skipped: results.skipped.length,
      },
      results,
    })
  } catch (error: any) {
    console.error('[Batch Apply to Bill] Error:', error)
    console.error('[Batch Apply to Bill] Error stack:', error.stack)
    return NextResponse.json(
      { 
        error: error.message || 'Failed to batch apply meter readings to bills',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}

