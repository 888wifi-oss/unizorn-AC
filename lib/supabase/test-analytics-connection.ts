"use server"

import { createClient } from "@/lib/supabase/server"

export async function testAnalyticsConnection() {
  try {
    console.log('Testing analytics connection...')
    const supabase = await createClient()
    
    // Test basic connection
    const { data, error } = await supabase
      .from('units')
      .select('count')
      .limit(1)
    
    if (error) {
      console.error('Analytics connection error:', error)
      return { 
        success: false, 
        error: `Connection failed: ${error.message}`,
        details: error
      }
    }
    
    console.log('Analytics connection successful')
    return { 
      success: true, 
      message: 'Connection successful',
      data: data
    }
  } catch (error: any) {
    console.error('Analytics connection exception:', error)
    return { 
      success: false, 
      error: `Exception: ${error.message}`,
      details: error
    }
  }
}
