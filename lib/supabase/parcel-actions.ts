"use server"

import { createClient } from "@/lib/supabase/server"
import { Parcel, ParcelFormData, ParcelPickupData, ParcelStats, ParcelReport, ParcelAuthorization } from "@/lib/types/parcel"
import { createUnitNotification } from "@/lib/supabase/notification-helpers"

// Create a new parcel
export async function createParcel(formData: ParcelFormData, parcelImageUrl?: string) {
  const supabase = await createClient()

  try {
    console.log('Creating parcel:', formData)

    const parcelData = {
      unit_number: formData.unit_number,
      recipient_name: formData.recipient_name,
      courier_company: formData.courier_company,
      tracking_number: formData.tracking_number || null,
      parcel_image_url: parcelImageUrl || null,
      parcel_description: formData.parcel_description || null,
      staff_received_by: formData.staff_received_by,
      notes: formData.notes || null,
      status: 'pending' as const,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
      project_id: formData.project_id || null  // ✅ เพิ่ม project_id
    }

    const { data: parcel, error } = await supabase
      .from('parcels')
      .insert([parcelData])
      .select()
      .single()

    if (error) {
      console.error('Create parcel error:', error)
      throw new Error(`Failed to create parcel: ${error.message}`)
    }

    console.log('Parcel created successfully:', parcel)

    // Send notification to resident
    await createUnitNotification(
      formData.unit_number,
      'announcement',
      'พัสดุใหม่ของคุณ',
      `พัสดุของคุณจาก ${formData.courier_company} มาถึงแล้ว กรุณารับได้ที่นิติฯ ชั้น 1`,
      { parcel_id: parcel.id, courier_company: formData.courier_company }
    )

    // Send push notification
    console.log('[Parcel] Attempting to send push notification for unit:', formData.unit_number)
    try {
      const { sendPushNotificationToUnit } = await import('@/lib/utils/push-notification-sender')
      const result = await sendPushNotificationToUnit(formData.unit_number, {
        title: 'พัสดุใหม่ของคุณ',
        body: `พัสดุของคุณจาก ${formData.courier_company} มาถึงแล้ว`,
        type: 'parcel',
        url: '/portal/dashboard?tab=parcels'
      })
      console.log('[Parcel] Push notification result:', result)
      if (result) {
        console.log('[Parcel] ✅ Push notification sent successfully!')
      } else {
        console.log('[Parcel] ❌ Push notification failed - no subscription found')
      }
    } catch (error) {
      console.error('[Parcel] ❌ Failed to send push notification:', error)
    }

    return { success: true, parcel }
  } catch (error: any) {
    console.error('Create parcel error:', error)
    return { success: false, error: error.message }
  }
}

// Get parcels for a specific unit
export async function getParcelsForUnit(unitNumber: string) {
  const supabase = await createClient()

  try {
    const { data: parcels, error } = await supabase
      .from('parcels')
      .select('*')
      .eq('unit_number', unitNumber)
      .order('received_at', { ascending: false })

    if (error) {
      throw new Error(`Failed to fetch parcels: ${error.message}`)
    }

    return { success: true, parcels: parcels || [] }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// Get all parcels (for staff)
export async function getAllParcels(status?: string, projectId?: string, limit: number = 50) {
  const supabase = await createClient()

  try {
    let query = supabase
      .from('parcels')
      .select(
        `id,
         unit_number,
         recipient_name,
         courier_company,
         tracking_number,
         status,
         received_at,
         picked_up_at,
         picked_up_by,
         picked_up_method,
         staff_received_by,
         staff_delivered_by,
         parcel_description,
         parcel_image_url,
         notes,
         expires_at,
         project_id,
         created_at`
      )
      .order('received_at', { ascending: false })
      .limit(limit)

    if (status) {
      query = query.eq('status', status)
    }

    if (projectId) {
      query = query.eq('project_id', projectId)
    }

    const { data: parcels, error } = await query

    if (error) {
      throw new Error(`Failed to fetch parcels: ${error.message}`)
    }

    return { success: true, parcels: parcels || [] }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// Update parcel status to picked up
export async function pickupParcel(pickupData: ParcelPickupData) {
  const supabase = await createClient()

  try {
    console.log('Picking up parcel:', pickupData)

    // First check if parcel exists
    const { data: existingParcel, error: checkError } = await supabase
      .from('parcels')
      .select('id, unit_number, status')
      .eq('id', pickupData.parcel_id)
      .single()

    if (checkError) {
      console.error('Error checking parcel:', checkError)
      throw new Error(`ไม่พบพัสดุ: ${checkError.message}`)
    }

    if (!existingParcel) {
      throw new Error('ไม่พบพัสดุในระบบ')
    }

    console.log('Found parcel:', existingParcel)

    const updateData = {
      status: 'picked_up' as const,
      picked_up_at: new Date().toISOString(),
      picked_up_by: pickupData.picked_up_by,
      picked_up_method: pickupData.picked_up_method,
      staff_delivered_by: pickupData.staff_delivered_by,
      digital_signature: pickupData.digital_signature || null,
      delivery_photo_url: pickupData.delivery_photo_url || null,
      notes: pickupData.notes || null
    }

    console.log('Update data:', updateData)

    const { data: parcel, error } = await supabase
      .from('parcels')
      .update(updateData)
      .eq('id', pickupData.parcel_id)
      .select()
      .single()

    if (error) {
      console.error('Pickup parcel error:', error)
      throw new Error(`Failed to pickup parcel: ${error.message}`)
    }

    console.log('Parcel picked up successfully:', parcel)

    // Send confirmation notification
    await createUnitNotification(
      parcel.unit_number,
      'payment_received', // Using existing type for confirmation
      'ยืนยันการรับพัสดุ',
      `พัสดุของคุณจาก ${parcel.courier_company} ได้รับแล้ว ขอบคุณครับ`,
      { parcel_id: parcel.id, courier_company: parcel.courier_company }
    )

    return { success: true, parcel }
  } catch (error: any) {
    console.error('Pickup parcel error:', error)
    return { success: false, error: error.message }
  }
}

// Get parcel statistics
export async function getParcelStats(projectId?: string) {
  const supabase = await createClient()

  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const thisMonth = new Date()
    thisMonth.setDate(1)
    thisMonth.setHours(0, 0, 0, 0)

    // Get total counts
    let totalQuery = supabase
      .from('parcels')
      .select('status')
    if (projectId) {
      totalQuery = totalQuery.eq('project_id', projectId)
    }
    const { data: totalData, error: totalError } = await totalQuery

    if (totalError) throw totalError

    // Get today's parcels
    let todayQuery = supabase
      .from('parcels')
      .select('status')
      .gte('received_at', today.toISOString())
      .lt('received_at', tomorrow.toISOString())
    if (projectId) {
      todayQuery = todayQuery.eq('project_id', projectId)
    }
    const { data: todayData, error: todayError } = await todayQuery

    if (todayError) throw todayError

    // Get this month's parcels
    let monthQuery = supabase
      .from('parcels')
      .select('status')
      .gte('received_at', thisMonth.toISOString())
    if (projectId) {
      monthQuery = monthQuery.eq('project_id', projectId)
    }
    const { data: monthData, error: monthError } = await monthQuery

    if (monthError) throw monthError

    // Calculate stats
    const stats: ParcelStats = {
      total_parcels: totalData?.length || 0,
      pending_parcels: totalData?.filter(p => p.status === 'pending').length || 0,
      delivered_parcels: totalData?.filter(p => p.status === 'delivered').length || 0,
      picked_up_parcels: totalData?.filter(p => p.status === 'picked_up').length || 0,
      expired_parcels: totalData?.filter(p => p.status === 'expired').length || 0,
      today_parcels: todayData?.length || 0,
      this_month_parcels: monthData?.length || 0
    }

    return { success: true, stats }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// Create authorization for proxy pickup
export async function createParcelAuthorization(parcelId: string, unitNumber: string, authorizedPerson: {
  name: string
  phone?: string
  idCard?: string
}) {
  const supabase = await createClient()

  try {
    // Generate random 6-digit code
    const authorizationCode = Math.floor(100000 + Math.random() * 900000).toString()

    const authData = {
      parcel_id: parcelId,
      authorized_by_unit_number: unitNumber,
      authorized_person_name: authorizedPerson.name,
      authorized_person_phone: authorizedPerson.phone || null,
      authorized_person_id_card: authorizedPerson.idCard || null,
      authorization_code: authorizationCode,
      expires_at: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString() // 3 days from now
    }

    const { data: authorization, error } = await supabase
      .from('parcel_authorizations')
      .insert([authData])
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create authorization: ${error.message}`)
    }

    return { success: true, authorization }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// Use authorization code for pickup
export async function useAuthorizationCode(authorizationCode: string, parcelId: string) {
  const supabase = await createClient()

  try {
    const { data: authorization, error } = await supabase
      .from('parcel_authorizations')
      .select('*')
      .eq('authorization_code', authorizationCode)
      .eq('parcel_id', parcelId)
      .eq('is_used', false)
      .single()

    if (error || !authorization) {
      throw new Error('รหัสยืนยันไม่ถูกต้องหรือหมดอายุแล้ว')
    }

    // Mark as used
    const { error: updateError } = await supabase
      .from('parcel_authorizations')
      .update({ is_used: true, used_at: new Date().toISOString() })
      .eq('id', authorization.id)

    if (updateError) {
      throw new Error(`Failed to update authorization: ${updateError.message}`)
    }

    return { success: true, authorization }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// Search parcels
export async function searchParcels(query: string, projectId?: string) {
  const supabase = await createClient()

  try {
    let dbQuery = supabase
      .from('parcels')
      .select('*')
      .or(`unit_number.ilike.%${query}%,recipient_name.ilike.%${query}%,courier_company.ilike.%${query}%,tracking_number.ilike.%${query}%`)
      .order('received_at', { ascending: false })
      .limit(20)

    if (projectId) {
      dbQuery = dbQuery.eq('project_id', projectId)
    }

    const { data: parcels, error } = await dbQuery

    if (error) {
      throw new Error(`Failed to search parcels: ${error.message}`)
    }

    return { success: true, parcels: parcels || [] }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}
