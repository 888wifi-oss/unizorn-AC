import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { 
  getPreviousMeterReading, 
  createMeterReading, 
  getActiveMeter,
  calculateUtilityCost 
} from "@/lib/utils/meter-calculations"

// Helper function to generate unique bill numbers for batch creation
async function generateBillNumbers(supabase: any, count: number, month: string) {
  const [year, monthNum] = month.split('-').map(Number)
  const monthPrefix = `${year}${String(monthNum).padStart(2, '0')}`
  
  // Get the highest existing sequence number for this month
  const { data, error } = await supabase
    .from("bills")
    .select("bill_number")
    .like("bill_number", `BILL-${monthPrefix}-%`)
    .order("bill_number", { ascending: false })
    .limit(1)
  
  let startSequence = 1
  if (!error && data && data.length > 0) {
    const lastNum = parseInt(data[0].bill_number.split('-').pop() || '0', 10)
    startSequence = lastNum + 1
  }
  
  // Generate sequential bill numbers
  const billNumbers: string[] = []
  for (let i = 0; i < count; i++) {
    const sequence = startSequence + i
    billNumbers.push(`BILL-${monthPrefix}-${String(sequence).padStart(3, '0')}`)
  }
  
  return billNumbers
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      month,
      commonFeeRate,
      projectId,
      recipientSettings = {
        common_fee: 'auto',
        water_fee: 'auto',
        electricity_fee: 'auto',
        parking_fee: 'auto',
      },
      meterReadings = { enabled: false },
    } = body

    if (!month || !commonFeeRate) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    const [year, monthNum] = month.split('-').map(Number)
    
    // Get units for the specified project
    let unitsQuery = supabase
      .from('units')
      .select('id, size, project_id, current_owner_id, current_tenant_id')
    
    if (projectId) {
      unitsQuery = unitsQuery.eq('project_id', projectId)
    }
    
    const { data: units, error: unitsError } = await unitsQuery
    if (unitsError) throw unitsError

    // Get existing bills for this month
    const { data: existingBills } = await supabase
      .from('bills')
      .select('unit_id')
      .eq('month', month)
    
    const billedUnitIds = new Set(existingBills?.map(b => b.unit_id) || [])
    const unitsToBill = units?.filter(u => !billedUnitIds.has(u.id)) || []

    if (unitsToBill.length === 0) {
      return NextResponse.json({ count: 0, message: 'No new units to bill' })
    }

    // Load owners and tenants for recipient resolution
    const unitIds = unitsToBill.map(u => u.id)
    const { data: ownersData } = await supabase
      .from('owners')
      .select('id, unit_id, name')
      .in('unit_id', unitIds)
      .eq('is_primary', true)

    const { data: tenantsData } = await supabase
      .from('tenants')
      .select('id, unit_id, name')
      .in('unit_id', unitIds)
      .eq('status', 'active')

    const ownersMap = new Map(ownersData?.map(o => [o.unit_id, o]) || [])
    const tenantsMap = new Map<string, any>()
    tenantsData?.forEach(t => {
      if (!tenantsMap.has(t.unit_id)) {
        tenantsMap.set(t.unit_id, [])
      }
      tenantsMap.get(t.unit_id)!.push(t)
    })

    // Helper function to resolve recipient
    const resolveRecipient = (
      unit: any,
      recipientType: 'auto' | 'owner' | 'tenant',
      feeType: string
    ): { type: 'owner' | 'tenant' | null; id: string | null } => {
      if (recipientType === 'owner') {
        const owner = ownersMap.get(unit.id)
        return { type: 'owner', id: owner?.id || null }
      }
      
      if (recipientType === 'tenant') {
        const tenants = tenantsMap.get(unit.id) || []
        const tenant = tenants[0] // Use first active tenant
        return { type: tenant ? 'tenant' : null, id: tenant?.id || null }
      }

      // Auto: tenant if exists, otherwise owner
      const tenants = tenantsMap.get(unit.id) || []
      if (tenants.length > 0) {
        // For utility fees (water/electricity), prefer tenant
        if (feeType === 'water_fee' || feeType === 'electricity_fee') {
          return { type: 'tenant', id: tenants[0].id }
        }
        // For common fee and parking, check if we should use tenant
        // Default: tenant if exists
        return { type: 'tenant', id: tenants[0].id }
      }

      const owner = ownersMap.get(unit.id)
      return { type: 'owner', id: owner?.id || null }
    }

    // Generate all bill numbers upfront to avoid duplicates
    const billNumbers = await generateBillNumbers(supabase, unitsToBill.length, month)
    
    const newBills = []
    const meterReadingsToCreate: any[] = []

    for (let i = 0; i < unitsToBill.length; i++) {
      const unit = unitsToBill[i]
      const billNumber = billNumbers[i]
      const commonFee = (unit.size || 0) * commonFeeRate
      
      // Resolve recipients
      const commonFeeRecipient = resolveRecipient(unit, recipientSettings.common_fee, 'common_fee')
      const waterFeeRecipient = resolveRecipient(unit, recipientSettings.water_fee, 'water_fee')
      const electricityFeeRecipient = resolveRecipient(unit, recipientSettings.electricity_fee, 'electricity_fee')
      const parkingFeeRecipient = resolveRecipient(unit, recipientSettings.parking_fee, 'parking_fee')

      let waterFee = 0
      let electricityFee = 0
      let waterMeterReadingId: string | null = null
      let electricityMeterReadingId: string | null = null

      // Handle meter readings if enabled
      if (meterReadings.enabled) {
        // Water meter
        const waterMeter = await getActiveMeter(unit.id, 'water', supabase)
        if (waterMeter) {
          const previousReading = await getPreviousMeterReading(
            waterMeter.id,
            meterReadings.reading_date,
            supabase
          )
          
          // For now, we'll create meter reading after bill is created
          // Store for later processing
          meterReadingsToCreate.push({
            unit_id: unit.id,
            meter_id: waterMeter.id,
            meter_type: 'water',
            reading_date: meterReadings.reading_date,
            previous_reading: previousReading,
          })
        }

        // Electricity meter
        const electricityMeter = await getActiveMeter(unit.id, 'electricity', supabase)
        if (electricityMeter) {
          const previousReading = await getPreviousMeterReading(
            electricityMeter.id,
            meterReadings.reading_date,
            supabase
          )
          
          meterReadingsToCreate.push({
            unit_id: unit.id,
            meter_id: electricityMeter.id,
            meter_type: 'electricity',
            reading_date: meterReadings.reading_date,
            previous_reading: previousReading,
          })
        }
      }

      const total = commonFee + waterFee + electricityFee

      const billData: any = {
        unit_id: unit.id,
        project_id: unit.project_id || projectId || null,
        month: month,
        year: year,
        common_fee: commonFee,
        water_fee: waterFee,
        electricity_fee: electricityFee,
        parking_fee: 0,
        other_fee: 0,
        total: total,
        status: 'pending',
        due_date: new Date(year, monthNum, 5).toISOString().split('T')[0],
        bill_number: billNumber,
      }

      // Add recipient columns if they exist (conditional based on migration status)
      if (commonFeeRecipient.type) {
        billData.common_fee_recipient_type = commonFeeRecipient.type
        billData.common_fee_recipient_id = commonFeeRecipient.id
      }
      if (waterFeeRecipient.type) {
        billData.water_fee_recipient_type = waterFeeRecipient.type
        billData.water_fee_recipient_id = waterFeeRecipient.id
      }
      if (electricityFeeRecipient.type) {
        billData.electricity_fee_recipient_type = electricityFeeRecipient.type
        billData.electricity_fee_recipient_id = electricityFeeRecipient.id
      }
      if (parkingFeeRecipient.type) {
        billData.parking_fee_recipient_type = parkingFeeRecipient.type
        billData.parking_fee_recipient_id = parkingFeeRecipient.id
      }

      newBills.push(billData)
    }

    // Insert bills
    console.log('[Batch Create] Inserting', newBills.length, 'bills')
    console.log('[Batch Create] Sample bill data:', JSON.stringify(newBills[0], null, 2))
    
    const { data: insertedBills, error: billsError } = await supabase
      .from('bills')
      .insert(newBills)
      .select()

    if (billsError) {
      console.error('[Batch Create] Error inserting bills:', billsError)
      console.error('[Batch Create] Error details:', JSON.stringify(billsError, null, 2))
      throw new Error(`Failed to insert bills: ${billsError.message}`)
    }

    // Process meter readings for bills that were created
    if (meterReadings.enabled && meterReadingsToCreate.length > 0) {
      // This would need to be implemented based on actual meter reading input
      // For now, we'll create a placeholder structure
      // In production, you'd need to get current readings from user input or another source
    }

    return NextResponse.json({
      count: insertedBills?.length || 0,
      bills: insertedBills,
    })
  } catch (error: any) {
    console.error('[Batch Create] Error:', error)
    console.error('[Batch Create] Error stack:', error.stack)
    return NextResponse.json(
      { 
        error: error.message || 'Failed to create bills',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}

