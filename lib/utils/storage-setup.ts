import { createClient } from "@/lib/supabase/server"

/**
 * Check if payment-slips bucket exists
 * Note: Bucket creation must be done manually in Supabase Dashboard
 * due to RLS restrictions
 */
export async function checkPaymentSlipsBucket() {
  const supabase = await createClient()
  
  try {
    // Try to list buckets to check if payment-slips exists
    const { data: buckets, error: listError } = await supabase.storage.listBuckets()
    
    if (listError) {
      console.error('[Storage Setup] Error listing buckets:', listError)
      // If we can't list, try to check by attempting to list files in the bucket
      const { error: testError } = await supabase.storage
        .from('payment-slips')
        .list('', { limit: 1 })
      
      if (testError) {
        if (testError.message.includes('not found') || testError.message.includes('Bucket')) {
          return { 
            success: false, 
            bucketExists: false,
            requiresManualSetup: true,
            error: 'Bucket "payment-slips" not found'
          }
        }
      } else {
        // If we can list files, bucket exists
        return { success: true, bucketExists: true }
      }
      
      return { 
        success: false, 
        error: listError.message,
        requiresManualSetup: true 
      }
    }

    const bucketExists = buckets?.some(b => b.name === 'payment-slips')
    
    if (!bucketExists) {
      return { 
        success: false, 
        bucketExists: false,
        requiresManualSetup: true,
        error: 'Bucket "payment-slips" not found. Please create it in Supabase Dashboard.'
      }
    }

    return { success: true, bucketExists: true }
  } catch (error: any) {
    console.error('[Storage Setup] Error:', error)
    return { 
      success: false, 
      bucketExists: false,
      error: error.message,
      requiresManualSetup: true 
    }
  }
}

