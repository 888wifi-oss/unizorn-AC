import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { checkPaymentSlipsBucket } from "@/lib/utils/storage-setup"
import { 
  createPaymentUploadedNotification,
  createPaymentPendingReviewNotification 
} from "@/lib/supabase/notification-helpers"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const transactionId = formData.get('transactionId') as string
    const file = formData.get('file') as File

    if (!transactionId || !file) {
      return NextResponse.json(
        { error: 'transactionId and file are required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Skip bucket check and try upload directly - will fail with clearer error if bucket doesn't exist
    // This is faster and gives better error messages

    // Upload file to Supabase Storage
    const fileExt = file.name.split('.').pop()
    const fileName = `${transactionId}-${Date.now()}.${fileExt}`
    const filePath = fileName // Store directly in bucket root, not in subfolder

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('payment-slips')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type,
      })

    if (uploadError) {
      console.error('[Upload Slip] Error uploading file:', uploadError)
      console.error('[Upload Slip] Error details:', JSON.stringify(uploadError, null, 2))
      
      // More specific error messages
      if (uploadError.message.includes('not found') || uploadError.message.includes('Bucket') || uploadError.statusCode === '404') {
        return NextResponse.json(
          { 
            error: 'Storage bucket "payment-slips" not found',
            errorCode: 'BUCKET_NOT_FOUND',
            requiresManualSetup: true,
            instructions: [
              '❌ Bucket ยังไม่ได้ถูกสร้าง',
              '',
              '📋 วิธีแก้ไข:',
              '1. ไปที่ Supabase Dashboard → Storage',
              '2. คลิก "New Bucket"',
              '3. ชื่อ: payment-slips (พิมพ์ให้ถูกต้องทุกตัวอักษร)',
              '4. Public bucket: ❌ ปิด (ไม่ติ๊ก)',
              '5. คลิก "Create bucket"',
              '',
              '🔐 หลังจากสร้าง bucket แล้ว:',
              '6. เปิด bucket payment-slips → Policies tab',
              '7. สร้าง 3 Policies:',
              '   - INSERT: bucket_id = \'payment-slips\'',
              '   - SELECT: bucket_id = \'payment-slips\'',
              '   - DELETE: bucket_id = \'payment-slips\''
            ].join('\n')
          },
          { status: 500 }
        )
      }
      
      // Check for RLS/policy errors
      if (uploadError.message.includes('policy') || uploadError.message.includes('RLS') || uploadError.message.includes('permission') || uploadError.statusCode === '403') {
        return NextResponse.json(
          { 
            error: 'Permission denied - RLS Policy issue',
            errorCode: 'RLS_POLICY_ERROR',
            requiresManualSetup: true,
            instructions: [
              '❌ Bucket มีอยู่แล้ว แต่ไม่มี Policies ที่ถูกต้อง',
              '',
              '📋 วิธีแก้ไข:',
              '1. ไปที่ Supabase Dashboard → Storage → payment-slips → Policies',
              '2. ตรวจสอบว่ามี Policies 3 ตัว:',
              '   ✅ INSERT policy',
              '   ✅ SELECT policy',
              '   ✅ DELETE policy',
              '',
              '3. ถ้ายังไม่มี ให้สร้างใหม่:',
              '   - Policy Name: Allow authenticated uploads',
              '   - Operation: INSERT',
              '   - Policy Definition: bucket_id = \'payment-slips\'',
              '',
              '   - Policy Name: Allow authenticated view',
              '   - Operation: SELECT',
              '   - Policy Definition: bucket_id = \'payment-slips\'',
              '',
              '   - Policy Name: Allow admins delete',
              '   - Operation: DELETE',
              '   - Policy Definition: bucket_id = \'payment-slips\''
            ].join('\n')
          },
          { status: 500 }
        )
      }
      
      throw new Error(`Failed to upload file: ${uploadError.message}`)
    }

    // Get signed URL (for private bucket) or public URL
    let fileUrl: string
    if (uploadData.path) {
      // Try to get signed URL first (for private buckets)
      const { data: signedData, error: signedError } = await supabase.storage
        .from('payment-slips')
        .createSignedUrl(filePath, 31536000) // 1 year expiry
      
      if (signedError) {
        // Fallback to public URL
        const { data: { publicUrl } } = supabase.storage
          .from('payment-slips')
          .getPublicUrl(filePath)
        fileUrl = publicUrl
      } else {
        fileUrl = signedData?.signedUrl || ''
      }
    } else {
      throw new Error('Upload path not returned')
    }

    // Get transaction with bill and unit info
    const { data: transaction } = await supabase
      .from('payment_transactions')
      .select(`
        *,
        bills!inner(
          id,
          unit_id,
          bill_number,
          units!inner(unit_number, project_id)
        )
      `)
      .eq('id', transactionId)
      .single()

    if (!transaction) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      )
    }

    // Create payment confirmation
    const { data: confirmation, error: confirmationError } = await supabase
      .from('payment_confirmations')
      .insert({
        payment_transaction_id: transactionId,
        bill_id: transaction.bill_id,
        confirmation_type: 'slip_upload',
        confirmation_data: {
          file_url: fileUrl,
          file_name: fileName,
          file_path: filePath,
          uploaded_at: new Date().toISOString(),
        },
      })
      .select()
      .single()

    if (confirmationError) {
      console.error('[Upload Slip] Error creating confirmation:', confirmationError)
      throw new Error(`Failed to create confirmation: ${confirmationError.message}`)
    }

    // Update transaction status to processing (waiting for admin confirmation)
    await supabase
      .from('payment_transactions')
      .update({
        status: 'processing',
        notes: 'Slip uploaded, waiting for confirmation',
      })
      .eq('id', transactionId)

    // Get unit and bill info from transaction relation
    const unitNumber = transaction.bills?.units?.unit_number
    const billNumber = transaction.bills?.bill_number
    const projectId = transaction.bills?.units?.project_id

    // Create notifications (non-blocking)
    if (unitNumber) {
      // Notify resident
      createPaymentUploadedNotification(
        unitNumber,
        transaction.reference_number || `PAY-${transactionId.substring(0, 8)}`,
        transaction.amount,
        billNumber
      ).catch(err => console.error('[Upload Slip] Error creating resident notification:', err))

      // Notify admin
      createPaymentPendingReviewNotification(
        projectId || null,
        unitNumber,
        transaction.reference_number || `PAY-${transactionId.substring(0, 8)}`,
        transaction.amount,
        billNumber
      ).catch(err => console.error('[Upload Slip] Error creating admin notification:', err))
    }

    return NextResponse.json({
      success: true,
      confirmationId: confirmation.id,
      fileUrl: fileUrl,
      message: 'Slip uploaded successfully',
    })
  } catch (error: any) {
    console.error('[Upload Slip] Error:', error)
    return NextResponse.json(
      { 
        error: error.message || 'Failed to upload slip',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}

