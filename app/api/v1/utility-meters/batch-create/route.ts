import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      meters, // Array of { unit_id, meter_type, meter_number, meter_location, is_active }
      projectId,
    } = body

    if (!meters || !Array.isArray(meters) || meters.length === 0) {
      return NextResponse.json(
        { error: 'Invalid meters data' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Validate all required fields
    for (const meter of meters) {
      if (!meter.unit_id || !meter.meter_type || !meter.meter_number) {
        return NextResponse.json(
          { error: 'Missing required fields: unit_id, meter_type, and meter_number are required' },
          { status: 400 }
        )
      }
    }

    // Check for existing meters to avoid duplicates
    const unitIds = [...new Set(meters.map((m: any) => m.unit_id))]
    const { data: existingMeters } = await supabase
      .from('utility_meters')
      .select('unit_id, meter_type, meter_number')
      .in('unit_id', unitIds)

    const existingMap = new Map(
      existingMeters?.map((em: any) => 
        [`${em.unit_id}-${em.meter_type}-${em.meter_number}`, true]
      ) || []
    )

    // Filter out duplicates
    const newMeters = meters.filter((meter: any) => {
      const key = `${meter.unit_id}-${meter.meter_type}-${meter.meter_number}`
      return !existingMap.has(key)
    })

    if (newMeters.length === 0) {
      return NextResponse.json({
        count: 0,
        skipped: meters.length,
        message: 'All meters already exist',
      })
    }

    // Prepare meter data with defaults
    const metersToInsert = newMeters.map((meter: any) => ({
      unit_id: meter.unit_id,
      meter_type: meter.meter_type,
      meter_number: meter.meter_number,
      meter_location: meter.meter_location || null,
      is_active: meter.is_active !== undefined ? meter.is_active : true,
    }))

    // Insert meters
    console.log('[Batch Create Meters] Inserting', metersToInsert.length, 'meters')
    
    const { data: insertedMeters, error: insertError } = await supabase
      .from('utility_meters')
      .insert(metersToInsert)
      .select()

    if (insertError) {
      console.error('[Batch Create Meters] Error inserting meters:', insertError)
      throw new Error(`Failed to insert meters: ${insertError.message}`)
    }

    return NextResponse.json({
      count: insertedMeters?.length || 0,
      skipped: meters.length - (insertedMeters?.length || 0),
      meters: insertedMeters,
      duplicates: meters.length - (insertedMeters?.length || 0),
    })
  } catch (error: any) {
    console.error('[Batch Create Meters] Error:', error)
    console.error('[Batch Create Meters] Error stack:', error.stack)
    return NextResponse.json(
      { 
        error: error.message || 'Failed to create meters',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}

