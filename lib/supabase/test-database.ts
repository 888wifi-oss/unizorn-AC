"use server"

import { createClient } from "@/lib/supabase/server"

// Test function to check if notifications table exists and is accessible
export async function testNotificationsTable() {
  const supabase = await createClient()
  
  try {
    console.log('Testing notifications table...')
    
    // First, try to check if table exists by querying information_schema
    const { data: tableInfo, error: tableError } = await supabase
      .rpc('check_table_exists', { table_name: 'notifications' })
      .single()

    if (tableError) {
      console.log('RPC function not available, trying direct query...')
    }

    // Try to select from notifications table
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .limit(1)

    if (error) {
      console.error('Notifications table error:', error)
      
      // If table doesn't exist, provide helpful message
      if (error.code === 'PGRST205') {
        return { 
          success: false, 
          error: `ตาราง notifications ยังไม่มีในฐานข้อมูล กรุณารัน SQL script: scripts/008_create_notifications_table.sql`,
          code: error.code,
          needsTableCreation: true
        }
      }
      
      return { 
        success: false, 
        error: `Table access error: ${error.message}`,
        code: error.code,
        details: error.details,
        hint: error.hint
      }
    }

    console.log('Notifications table accessible, found:', data?.length || 0, 'records')
    return { 
      success: true, 
      message: `Table accessible, found ${data?.length || 0} records`,
      data 
    }
  } catch (error: any) {
    console.error('Test error:', error)
    return { success: false, error: error.message }
  }
}

// Test function to check units table
export async function testUnitsTable() {
  const supabase = await createClient()
  
  try {
    console.log('Testing units table...')
    
    const { data, error } = await supabase
      .from('units')
      .select('id, unit_number')
      .limit(5)

    if (error) {
      console.error('Units table error:', error)
      return { success: false, error: `Units error: ${error.message}` }
    }

    console.log('Units table accessible, found:', data?.length || 0, 'units')
    return { 
      success: true, 
      message: `Found ${data?.length || 0} units`,
      data 
    }
  } catch (error: any) {
    console.error('Units test error:', error)
    return { success: false, error: error.message }
  }
}
