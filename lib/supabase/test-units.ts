"use server"

import { createClient } from "@/lib/supabase/server"

// Test function to check units table
export async function testUnitsTableForParcels() {
  const supabase = await createClient()
  
  try {
    console.log('Testing units table for parcels...')
    
    const { data: units, error } = await supabase
      .from('units')
      .select('id, unit_number, owner_name')
      .order('unit_number')
      .limit(10)

    if (error) {
      console.error('Units table error:', error)
      return { 
        success: false, 
        error: `Units error: ${error.message}`,
        code: error.code,
        details: error.details,
        hint: error.hint
      }
    }

    console.log('Units table accessible, found:', units?.length || 0, 'units')
    return { 
      success: true, 
      message: `Found ${units?.length || 0} units`,
      units: units || []
    }
  } catch (error: any) {
    console.error('Units test error:', error)
    return { success: false, error: error.message }
  }
}
