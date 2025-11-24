"use server"

import { createClient } from "@/lib/supabase/server"
import { createUnitNotification } from "@/lib/supabase/notification-helpers"
import { ParcelImportData } from "@/lib/utils/parcel-import"

interface BulkImportParcelsRequest {
  parcels: ParcelImportData[]
  project_id?: string
}

export async function bulkImportParcels(request: BulkImportParcelsRequest) {
  const supabase = await createClient()
  
  let results = {
    success: true,
    imported: 0,
    failed: 0,
    errors: [] as any[]
  }
  
  try {
    for (const parcelData of request.parcels) {
      try {
        // Check if unit exists
        const { data: unit, error: unitError } = await supabase
          .from('units')
          .select('id, unit_number')
          .eq('unit_number', parcelData.unit_number)
          .single()
        
        if (unitError || !unit) {
          console.error(`[bulkImportParcels] Unit not found: ${parcelData.unit_number}`)
          results.failed++
          results.errors.push({
            unit_number: parcelData.unit_number,
            error: `ไม่พบเลขห้อง ${parcelData.unit_number} ในระบบ`
          })
          continue
        }
        
        // Insert parcel
        const { data: parcel, error: parcelError } = await supabase
          .from('parcels')
          .insert([{
            unit_number: parcelData.unit_number,
            recipient_name: parcelData.recipient_name,
            courier_company: parcelData.courier_company,
            tracking_number: parcelData.tracking_number || null,
            parcel_description: parcelData.parcel_description || null,
            staff_received_by: parcelData.staff_received_by,
            notes: parcelData.notes || null,
            status: 'pending',
            expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
            project_id: request.project_id || null
          }])
          .select()
          .single()
        
        if (parcelError) {
          console.error('[bulkImportParcels] Parcel insert error:', parcelError)
          results.failed++
          results.errors.push({
            unit_number: parcelData.unit_number,
            error: parcelError.message
          })
          continue
        }
        
        console.log('[bulkImportParcels] Parcel inserted successfully:', parcel)
        results.imported++
        
        // Send notification to resident
        try {
          await createUnitNotification(
            parcelData.unit_number,
            'announcement',
            'พัสดุใหม่ของคุณ',
            `พัสดุของคุณจาก ${parcelData.courier_company} มาถึงแล้ว กรุณารับได้ที่นิติฯ ชั้น 1`,
            { 
              parcel_id: parcel.id, 
              courier_company: parcelData.courier_company,
              tracking_number: parcelData.tracking_number
            }
          )
        } catch (notifError) {
          console.error('[bulkImportParcels] Notification error:', notifError)
          // Don't fail the import if notification fails
        }
        
      } catch (error: any) {
        console.error('[bulkImportParcels] Error processing parcel:', error)
        results.failed++
        results.errors.push({
          unit_number: parcelData.unit_number,
          error: error.message
        })
      }
    }
    
    return {
      success: true,
      imported: results.imported,
      failed: results.failed,
      errors: results.errors
    }
  } catch (error: any) {
    console.error('[bulkImportParcels] Overall error:', error)
    return {
      success: false,
      imported: 0,
      failed: 0,
      error: error.message
    }
  }
}
















