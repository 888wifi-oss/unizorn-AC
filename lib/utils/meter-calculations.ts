// lib/utils/meter-calculations.ts
// Helper functions for meter reading calculations

export interface MeterReadingInput {
  meter_id: string
  reading_date: string
  current_reading: number
  reading_type?: 'regular' | 'estimated' | 'corrected'
  reader_name?: string
  notes?: string
}

export interface MeterCalculationResult {
  previous_reading: number
  current_reading: number
  usage_amount: number
  cost: number
  rate_per_unit: number
}

/**
 * Get previous meter reading for a meter
 */
export async function getPreviousMeterReading(
  meterId: string,
  readingDate: string,
  supabase: any
): Promise<number> {
  const { data, error } = await supabase
    .from('meter_readings')
    .select('current_reading')
    .eq('meter_id', meterId)
    .lt('reading_date', readingDate)
    .eq('reading_type', 'regular')
    .order('reading_date', { ascending: false })
    .limit(1)
    .single()

  if (error && error.code !== 'PGRST116') {
    console.error('[Meter] Error fetching previous reading:', error)
    return 0
  }

  return data?.current_reading || 0
}

/**
 * Calculate utility cost from usage
 * @param meterType - Type of meter (water/electricity)
 * @param usageAmount - Amount of usage (cubic meters or kWh)
 * @param readingDate - Date of reading (YYYY-MM-DD)
 * @param supabase - Supabase client
 * @param projectId - Optional project ID to use project-specific rates
 */
export async function calculateUtilityCost(
  meterType: 'water' | 'electricity' | 'gas',
  usageAmount: number,
  readingDate: string,
  supabase: any,
  projectId?: string | null
): Promise<{ cost: number; rate_per_unit: number; minimum_charge?: number; maximum_charge?: number }> {
  let ratesQuery = supabase
    .from('utility_rates')
    .select('rate_per_unit, minimum_charge, maximum_charge')
    .eq('meter_type', meterType)
    .eq('is_active', true)
    .lte('effective_date', readingDate)
    .or(`expiry_date.is.null,expiry_date.gte.${readingDate}`)

  // ถ้ามี project_id ให้ filter ตาม project_id หรือ null (สำหรับอัตราทั่วไป)
  if (projectId) {
    ratesQuery = ratesQuery.or(`project_id.eq.${projectId},project_id.is.null`)
  } else {
    ratesQuery = ratesQuery.is('project_id', null)
  }

  const { data, error } = await ratesQuery
    .order('project_id', { ascending: false, nullsLast: true }) // Project-specific rates first
    .order('effective_date', { ascending: false })
    .limit(1)
    .single()

  if (error || !data) {
    console.error('[Meter] Error fetching utility rate:', error)
    return { cost: 0, rate_per_unit: 0 }
  }

  const ratePerUnit = data.rate_per_unit || 0
  const minimumCharge = data.minimum_charge || 0
  const maximumCharge = data.maximum_charge || null
  const calculatedCost = usageAmount * ratePerUnit

  // ใช้ minimum charge ถ้าคำนวณได้น้อยกว่า
  let finalCost = minimumCharge > 0 && calculatedCost < minimumCharge 
    ? minimumCharge 
    : calculatedCost

  // ใช้ maximum charge ถ้ามีและเกิน
  if (maximumCharge && maximumCharge > 0 && finalCost > maximumCharge) {
    finalCost = maximumCharge
  }

  return { 
    cost: finalCost, 
    rate_per_unit: ratePerUnit,
    minimum_charge: minimumCharge,
    maximum_charge: maximumCharge || undefined
  }
}

/**
 * Create meter reading record
 */
export async function createMeterReading(
  input: MeterReadingInput,
  supabase: any
): Promise<{ id: string; usage_amount: number } | null> {
  // Get previous reading
  const previousReading = await getPreviousMeterReading(
    input.meter_id,
    input.reading_date,
    supabase
  )

  const usageAmount = Math.max(0, input.current_reading - previousReading)

  // Get meter type for cost calculation
  const { data: meterData } = await supabase
    .from('utility_meters')
    .select('meter_type')
    .eq('id', input.meter_id)
    .single()

  if (!meterData) {
    console.error('[Meter] Meter not found:', input.meter_id)
    return null
  }

  // Create meter reading
  const { data, error } = await supabase
    .from('meter_readings')
    .insert([{
      meter_id: input.meter_id,
      reading_date: input.reading_date,
      previous_reading: previousReading,
      current_reading: input.current_reading,
      usage_amount: usageAmount,
      reading_type: input.reading_type || 'regular',
      reader_name: input.reader_name,
      notes: input.notes,
    }])
    .select()
    .single()

  if (error) {
    console.error('[Meter] Error creating meter reading:', error)
    return null
  }

  return { id: data.id, usage_amount: usageAmount }
}

/**
 * Get active meter for a unit
 */
export async function getActiveMeter(
  unitId: string,
  meterType: 'water' | 'electricity',
  supabase: any
): Promise<any | null> {
  const { data, error } = await supabase
    .from('utility_meters')
    .select('*')
    .eq('unit_id', unitId)
    .eq('meter_type', meterType)
    .eq('is_active', true)
    .single()

  if (error && error.code !== 'PGRST116') {
    console.error('[Meter] Error fetching meter:', error)
    return null
  }

  return data
}

/**
 * Get latest meter reading for a meter
 */
export async function getLatestMeterReading(
  meterId: string,
  supabase: any
): Promise<any | null> {
  const { data, error } = await supabase
    .from('meter_readings')
    .select('*')
    .eq('meter_id', meterId)
    .order('reading_date', { ascending: false })
    .limit(1)
    .single()

  if (error && error.code !== 'PGRST116') {
    console.error('[Meter] Error fetching latest reading:', error)
    return null
  }

  return data
}

