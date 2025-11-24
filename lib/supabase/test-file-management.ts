"use server"

import { createClient } from "@/lib/supabase/server"

export async function testFileManagementTables() {
  const supabase = await createClient()
  
  try {
    console.log('Testing file management tables...')
    
    const tables = [
      'file_categories',
      'files', 
      'file_permissions',
      'file_downloads'
    ]
    
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
    
    console.log('File management tables test results:', results)
    return { success: true, results }
  } catch (error: any) {
    console.error('Error testing file management tables:', error)
    return { success: false, error: error.message }
  }
}

export async function testFileCategoriesData() {
  const supabase = await createClient()
  
  try {
    console.log('Testing file categories data...')
    
    const { data, error } = await supabase
      .from('file_categories')
      .select('*')
      .eq('is_active', true)
    
    if (error) {
      console.error('Error fetching file categories:', error)
      return { 
        success: false, 
        error: error.message,
        details: error
      }
    }
    
    console.log('File categories data:', data)
    return { 
      success: true, 
      categories: data || [],
      count: data?.length || 0
    }
  } catch (error: any) {
    console.error('Exception in testFileCategoriesData:', error)
    return { 
      success: false, 
      error: error.message,
      details: error
    }
  }
}
