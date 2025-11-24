import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { calculateUtilityCost } from "@/lib/utils/meter-calculations"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      meterReadingId,
      billId, // Optional: if provided, update existing bill. Otherwise create new bill.
      month, // Required if creating new bill
      createNewBill = false, // If true, create new bill. If false, update existing or find by month
    } = body

    if (!meterReadingId) {
      return NextResponse.json(
        { error: 'meterReadingId is required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

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
      console.error('[Apply to Bill] Error fetching meter reading:', readingError)
      return NextResponse.json(
        { error: 'Meter reading not found' },
        { status: 404 }
      )
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

    if (billId) {
      // Update existing bill
      const { data: bill, error: billError } = await supabase
        .from('bills')
        .select('*')
        .eq('id', billId)
        .single()

      if (billError || !bill) {
        return NextResponse.json(
          { error: 'Bill not found' },
          { status: 404 }
        )
      }

      targetBill = bill
    } else if (!createNewBill) {
      // Find bill by month and unit
      const readingMonth = meterReading.reading_date.substring(0, 7) // YYYY-MM
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

      // Update fee field
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
        console.error('[Apply to Bill] Error updating bill:', updateError)
        throw new Error(`Failed to update bill: ${updateError.message}`)
      }

      // Update meter_reading with bill_id
      await supabase
        .from('meter_readings')
        .update({ bill_id: updatedBill.id })
        .eq('id', meterReadingId)

      return NextResponse.json({
        success: true,
        action: 'updated',
        bill: updatedBill,
        calculatedFee,
      })
    } else {
      // Create new bill
      if (!month) {
        // Use month from reading date
        month = meterReading.reading_date.substring(0, 7)
      }

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
        console.error('[Apply to Bill] Error creating bill:', createError)
        throw new Error(`Failed to create bill: ${createError.message}`)
      }

      // Update meter_reading with bill_id
      await supabase
        .from('meter_readings')
        .update({ bill_id: newBill.id })
        .eq('id', meterReadingId)

      return NextResponse.json({
        success: true,
        action: 'created',
        bill: newBill,
        calculatedFee,
      })
    }
  } catch (error: any) {
    console.error('[Apply to Bill] Error:', error)
    console.error('[Apply to Bill] Error stack:', error.stack)
    return NextResponse.json(
      { 
        error: error.message || 'Failed to apply meter reading to bill',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}

