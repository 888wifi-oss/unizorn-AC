"use server"

import { createClient } from "@/lib/supabase/client"

export async function testParcelsTable() {
  const supabase = await createClient()
  
  try {
    console.log('Testing parcels table...')
    
    // Test if table exists
    const { data, error } = await supabase
      .from('parcels')
      .select('id, unit_number, status')
      .limit(1)
    
    if (error) {
      console.error('Parcels table error:', error)
      if (error.code === 'PGRST205') {
        return {
          success: false,
          error: 'ตาราง parcels ยังไม่ได้สร้าง กรุณารัน SQL script 009_create_parcels_table.sql',
          details: error
        }
      }
      return {
        success: false,
        error: `Error accessing parcels table: ${error.message}`,
        details: error
      }
    }
    
    console.log('Parcels table test successful:', data)
    return {
      success: true,
      message: 'ตาราง parcels พร้อมใช้งาน',
      count: data?.length || 0
    }
  } catch (error: any) {
    console.error('Exception testing parcels table:', error)
    return {
      success: false,
      error: `Exception: ${error.message}`,
      details: error
    }
  }
}
