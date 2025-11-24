"use server"

import { createClient } from "@/lib/supabase/server"

export async function testAnalyticsTables() {
  const supabase = await createClient()
  
  try {
    console.log('Testing analytics tables...')
    
    const tables = ['bills', 'units', 'parcels', 'maintenance_requests', 'notifications']
    const results: { [key: string]: { success: boolean; error?: string; count?: number } } = {}
    
    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1)
        
        if (error) {
          results[table] = { success: false, error: error.message }
        } else {
          results[table] = { success: true, count: data?.length || 0 }
        }
      } catch (err: any) {
        results[table] = { success: false, error: err.message }
      }
    }
    
    console.log('Analytics tables test results:', results)
    return { success: true, results }
  } catch (error: any) {
    console.error('Error testing analytics tables:', error)
    return { success: false, error: error.message }
  }
}
