"use server"

import { createClient } from "@/lib/supabase/server"
import { getNotificationTemplate } from "@/lib/utils/notification-templates"
import { NotificationType } from "@/lib/types/notification"

// Create notification for a specific unit
export async function createUnitNotification(
  unitNumber: string, 
  type: NotificationType, 
  title: string, 
  message: string,
  data?: any,
  projectId?: string | null
) {
  const supabase = await createClient()
  
  try {
    console.log(`Creating notification for unit: ${unitNumber}`)
    
    // Get unit_id and project_id from unit_number
    const { data: unit, error: unitError } = await supabase
      .from('units')
      .select('id, project_id')
      .eq('unit_number', unitNumber)
      .single()

    if (unitError) {
      console.error('Unit error:', unitError)
      throw new Error(`Unit ${unitNumber} not found: ${unitError.message}`)
    }

    if (!unit) {
      throw new Error(`Unit ${unitNumber} not found`)
    }

    console.log(`Found unit with id: ${unit.id}, project_id: ${unit.project_id}`)

    const notificationData: any = {
      unit_id: unit.id,
      type,
      title,
      message,
      data: data || null,
      is_read: false
    }

    // Add project_id if available (from unit or parameter)
    if (projectId || unit.project_id) {
      notificationData.project_id = projectId || unit.project_id
    }

    console.log('Notification data:', notificationData)

    const { data: notification, error } = await supabase
      .from('notifications')
      .insert([notificationData])
      .select()
      .single()

    if (error) {
      console.error('Insert error:', error)
      throw new Error(`Failed to create notification: ${error.message}`)
    }

    console.log('Notification created successfully:', notification)
    return { success: true, notification }
  } catch (error: any) {
    console.error('Create notification error:', error)
    return { success: false, error: error.message }
  }
}

// Create notification for all units
export async function createNotificationForAllUnits(
  type: NotificationType,
  title: string,
  message: string,
  data?: any,
  projectId?: string | null
) {
  const supabase = await createClient()
  
  try {
    console.log('Creating notification for all units', projectId ? `for project: ${projectId}` : '')
    
    // Get all units (filter by project if specified)
    let unitsQuery = supabase
      .from('units')
      .select('id, unit_number, project_id')
    
    if (projectId) {
      unitsQuery = unitsQuery.eq('project_id', projectId)
    }

    const { data: units, error: unitsError } = await unitsQuery

    if (unitsError) {
      console.error('Units error:', unitsError)
      throw new Error(`Failed to fetch units: ${unitsError.message}`)
    }

    if (!units || units.length === 0) {
      return { success: true, message: "No units found to send notifications" }
    }

    console.log(`Found ${units.length} units`)

    // Create notifications for all units
    const notifications = units.map(unit => ({
      unit_id: unit.id,
      type,
      title,
      message,
      data: data || null,
      is_read: false,
      project_id: unit.project_id || projectId || null
    }))

    console.log('Notifications to insert:', notifications.length)

    const { data: createdNotifications, error } = await supabase
      .from('notifications')
      .insert(notifications)
      .select()

    if (error) {
      console.error('Insert error:', error)
      throw new Error(`Failed to create notifications: ${error.message}`)
    }

    console.log('Notifications created successfully:', createdNotifications?.length)
    return { success: true, notifications: createdNotifications }
  } catch (error: any) {
    console.error('Create notifications error:', error)
    return { success: false, error: error.message }
  }
}

// Create bill due notification
export async function createBillDueNotification(unitNumber: string, billMonth: string, dueDate: string, amount: number) {
  const template = getNotificationTemplate('payment_due')
  const message = template.message
    .replace('{month}', billMonth)
    .replace('{dueDate}', new Date(dueDate).toLocaleDateString('th-TH'))
  
  return await createUnitNotification(
    unitNumber,
    'payment_due',
    template.title,
    message,
    { billMonth, dueDate, amount }
  )
}

// Create payment received notification
export async function createPaymentReceivedNotification(unitNumber: string, billMonth: string, amount: number) {
  const template = getNotificationTemplate('payment_received')
  const message = template.message
    .replace('{month}', billMonth)
    .replace('{amount}', amount.toLocaleString('th-TH'))
  
  return await createUnitNotification(
    unitNumber,
    'payment_received',
    template.title,
    message,
    { billMonth, amount }
  )
}

// Create maintenance update notification
export async function createMaintenanceUpdateNotification(unitNumber: string, title: string, status: string) {
  const template = getNotificationTemplate('maintenance_update')
  const message = template.message
    .replace('{title}', title)
    .replace('{status}', status)
  
  return await createUnitNotification(
    unitNumber,
    'maintenance_update',
    template.title,
    message,
    { title, status }
  )
}

// Create announcement notification
export async function createAnnouncementNotification(unitNumber: string, announcementTitle: string) {
  const template = getNotificationTemplate('announcement')
  const message = template.message.replace('{title}', announcementTitle)
  
  return await createUnitNotification(
    unitNumber,
    'announcement',
    template.title,
    message,
    { announcementTitle }
  )
}

// Create bill generated notification
export async function createBillGeneratedNotification(unitNumber: string, billMonth: string) {
  const template = getNotificationTemplate('bill_generated')
  const message = template.message.replace('{month}', billMonth)
  
  return await createUnitNotification(
    unitNumber,
    'bill_generated',
    template.title,
    message,
    { billMonth }
  )
}

// Create payment uploaded notification (for residents)
export async function createPaymentUploadedNotification(
  unitNumber: string, 
  referenceNumber: string, 
  amount: number,
  billNumber?: string
) {
  return await createUnitNotification(
    unitNumber,
    'payment_uploaded',
    'อัพโหลดสลิปชำระเงินเรียบร้อย',
    `สลิปชำระเงินของคุณ (${referenceNumber}) จำนวน ${amount.toLocaleString('th-TH')} บาท ถูกอัพโหลดเรียบร้อยแล้ว กำลังรอการตรวจสอบ`,
    { referenceNumber, amount, billNumber }
  )
}

// Create payment confirmed notification (for residents)
export async function createPaymentConfirmedNotification(
  unitNumber: string,
  referenceNumber: string,
  amount: number,
  billNumber?: string
) {
  return await createUnitNotification(
    unitNumber,
    'payment_confirmed',
    'ยืนยันการชำระเงินสำเร็จ',
    `การชำระเงินของคุณ (${referenceNumber}) จำนวน ${amount.toLocaleString('th-TH')} บาท ได้รับการยืนยันเรียบร้อยแล้ว`,
    { referenceNumber, amount, billNumber }
  )
}

// Create payment rejected notification (for residents)
export async function createPaymentRejectedNotification(
  unitNumber: string,
  referenceNumber: string,
  amount: number,
  reason?: string
) {
  return await createUnitNotification(
    unitNumber,
    'payment_rejected',
    'การชำระเงินไม่ได้รับการยืนยัน',
    `การชำระเงินของคุณ (${referenceNumber}) จำนวน ${amount.toLocaleString('th-TH')} บาท ไม่ได้รับการยืนยัน${reason ? `: ${reason}` : ''} กรุณาติดต่อเจ้าหน้าที่`,
    { referenceNumber, amount, reason }
  )
}

// Create payment pending review notification (for admins)
export async function createPaymentPendingReviewNotification(
  projectId: string | null,
  unitNumber: string,
  referenceNumber: string,
  amount: number,
  billNumber?: string
) {
  const supabase = await createClient()
  
  try {
    const notificationData: any = {
      type: 'payment_pending_review',
      title: 'มีสลิปชำระเงินรอตรวจสอบ',
      message: `ห้อง ${unitNumber} อัพโหลดสลิปชำระเงิน (${referenceNumber}) จำนวน ${amount.toLocaleString('th-TH')} บาท${billNumber ? ` สำหรับบิล ${billNumber}` : ''} รอการตรวจสอบ`,
      data: { unitNumber, referenceNumber, amount, billNumber },
      is_read: false,
    }

    if (projectId) {
      notificationData.project_id = projectId
    }

    const { data: notification, error } = await supabase
      .from('notifications')
      .insert([notificationData])
      .select()
      .single()

    if (error) {
      console.error('[Payment Notification] Error creating admin notification:', error)
      throw new Error(`Failed to create notification: ${error.message}`)
    }

    return { success: true, notification }
  } catch (error: any) {
    console.error('[Payment Notification] Error:', error)
    return { success: false, error: error.message }
  }
}