"use server"

import { createClient } from "@/lib/supabase/server"
import { MaintenanceTimeline, MaintenanceComment } from "@/lib/types/maintenance"
import { revalidatePath } from "next/cache"
import { createUnitNotification } from "@/lib/supabase/notification-helpers"
import { sendEmailNotification } from "@/lib/email-service"

// Get timeline for a maintenance request
export async function getMaintenanceTimeline(maintenanceRequestId: string) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('maintenance_timeline')
    .select('*')
    .eq('maintenance_request_id', maintenanceRequestId)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('[getMaintenanceTimeline] Error:', error)
    throw error
  }

  return data || []
}

// Get comments for a maintenance request
export async function getMaintenanceComments(maintenanceRequestId: string) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('maintenance_comments')
    .select('*')
    .eq('maintenance_request_id', maintenanceRequestId)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('[getMaintenanceComments] Error:', error)
    throw error
  }

  return data || []
}

// Add comment to maintenance request
export async function addMaintenanceComment(
  maintenanceRequestId: string,
  commentText: string,
  commentBy: string,
  isResident: boolean,
  imageUrls?: string[]
) {
  const supabase = await createClient()
  
  console.log('[addMaintenanceComment] Adding comment:', { maintenanceRequestId, commentText, commentBy, isResident })
  
  const { data, error } = await supabase
    .from('maintenance_comments')
    .insert([{
      maintenance_request_id: maintenanceRequestId,
      comment_by: commentBy,
      comment_text: commentText,
      is_resident: isResident,
      image_urls: imageUrls || []
    }])
    .select()
    .single()

  if (error) {
    console.error('[addMaintenanceComment] Error:', error)
    throw new Error('ไม่สามารถเพิ่มคอมเมนต์ได้')
  }

  // Send notification to the other party
  try {
    const { data: request } = await supabase
      .from('maintenance_requests')
      .select('unit_id, units(unit_number)')
      .eq('id', maintenanceRequestId)
      .single()

    if (request && request.units) {
      const notificationTitle = isResident 
        ? 'คำตอบจากลูกบ้าน' 
        : 'คำตอบจากเจ้าหน้าที่'
      
      const notificationMessage = isResident
        ? `ลูกบ้านได้ตอบกลับสำหรับ: ${commentText.substring(0, 50)}...`
        : `เจ้าหน้าที่ได้ตอบกลับ: ${commentText.substring(0, 50)}...`

      await createUnitNotification(
        request.units.unit_number,
        'maintenance_update',
        notificationTitle,
        notificationMessage,
        { maintenance_request_id: maintenanceRequestId }
      )
    }
  } catch (notifError) {
    console.error('[addMaintenanceComment] Notification error:', notifError)
    // Don't throw - the comment was added successfully
  }

  revalidatePath('/portal/dashboard')
  revalidatePath('/(admin)/maintenance')
  
  return data
}

// Update maintenance status with detailed status
export async function updateMaintenanceStatusDetailed(
  id: string,
  status: string,
  detailedStatus: string,
  updatedBy: string,
  notes?: string
) {
  const supabase = await createClient()
  
  console.log('[updateMaintenanceStatusDetailed] Updating:', { id, status, detailedStatus, updatedBy, notes })
  
  // Get existing request to preserve image_urls
  const { data: existingRequest } = await supabase
    .from('maintenance_requests')
    .select('image_urls')
    .eq('id', id)
    .single()
  
  const { error } = await supabase
    .from('maintenance_requests')
    .update({ 
      status,
      detailed_status: detailedStatus,
      updated_by: updatedBy,
      notes: notes || null,
      // Preserve existing image_urls
      image_urls: existingRequest?.image_urls || []
    })
    .eq('id', id)

  if (error) {
    console.error('[updateMaintenanceStatusDetailed] Error:', error)
    throw new Error('ไม่สามารถอัปเดตสถานะได้')
  }

  // Send notification and email to resident
  try {
    const { data: request } = await supabase
      .from('maintenance_requests')
      .select('id, title, unit_id, units(unit_number, owner_name, owner_email)')
      .eq('id', id)
      .single()

    if (request && request.units) {
      const statusMessages: Record<string, string> = {
        'new': 'ได้รับใบแจ้งซ่อมใหม่',
        'in_progress': 'กำลังดำเนินการ',
        'preparing_materials': 'กำลังเตรียมวัสดุ',
        'waiting_technician': 'รอช่างเข้ารับงาน',
        'fixing': 'กำลังแก้ไข',
        'completed': 'เสร็จสมบูรณ์',
        'cancelled': 'ยกเลิก'
      }

      await createUnitNotification(
        request.units.unit_number,
        'maintenance_update',
        'อัปเดตสถานะการซ่อม',
        statusMessages[detailedStatus] || 'สถานะได้ถูกอัปเดต',
        { maintenance_request_id: id, status: detailedStatus }
      )

      // Send email notification
      if (request.units.owner_email) {
        try {
          const statusDisplay = statusMessages[detailedStatus] || 'สถานะได้ถูกอัปเดต'
          const subject = `อัปเดตสถานะงานซ่อม - ห้อง ${request.units.unit_number}`
          const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="UTF-8">
              <style>
                body { font-family: 'Sarabun', Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: #cce5ff; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
                .content { background: white; padding: 20px; border: 1px solid #e9ecef; border-radius: 8px; }
                .update { background: #e7f3ff; padding: 15px; border-radius: 5px; margin: 15px 0; }
                .footer { margin-top: 20px; padding-top: 20px; border-top: 1px solid #e9ecef; font-size: 12px; color: #6c757d; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>อัปเดตสถานะงานซ่อม</h1>
                  <p>สวัสดีคุณ ${request.units.owner_name}</p>
                </div>
                
                <div class="content">
                  <div class="update">
                    <h2>🔧 สถานะงานซ่อมอัปเดต</h2>
                    <p>งานซ่อมสำหรับห้อง <strong>${request.units.unit_number}</strong> มีการอัปเดตสถานะแล้ว</p>
                  </div>
                  
                  <p><strong>รายละเอียดงานซ่อม:</strong></p>
                  <p>ห้อง: ${request.units.unit_number}</p>
                  <p>เรื่อง: ${request.title}</p>
                  <p>สถานะใหม่: <strong>${statusDisplay}</strong></p>
                  <p>วันที่อัปเดต: ${new Date().toLocaleDateString('th-TH')}</p>
                  
                  <p>หากมีข้อสงสัยเกี่ยวกับงานซ่อม กรุณาติดต่อเจ้าหน้าที่</p>
                </div>
                
                <div class="footer">
                  <p>อีเมลนี้ส่งโดยระบบอัตโนมัติ กรุณาอย่าตอบกลับ</p>
                  <p>© ${new Date().getFullYear()} Condo Management System</p>
                </div>
              </div>
            </body>
            </html>
          `
          
          await sendEmailNotification(
            request.units.owner_email,
            subject,
            htmlContent
          )
          console.log(`[updateMaintenanceStatusDetailed] Email sent to ${request.units.owner_email}`)
        } catch (emailError) {
          console.error('[updateMaintenanceStatusDetailed] Email error:', emailError)
        }
      }
    }
  } catch (notifError) {
    console.error('[updateMaintenanceStatusDetailed] Notification error:', notifError)
  }

  revalidatePath('/portal/dashboard')
  revalidatePath('/(admin)/maintenance')
}

// Send email when appointment is scheduled
export async function sendAppointmentEmail(maintenanceRequestId: string) {
  const supabase = await createClient()
  
  try {
    const { data: request, error } = await supabase
      .from('maintenance_requests')
      .select('id, title, scheduled_at, scheduled_duration, appointment_type, units(unit_number, owner_name, owner_email)')
      .eq('id', maintenanceRequestId)
      .single()

    if (error || !request) {
      console.error('[sendAppointmentEmail] Error fetching maintenance request:', error)
      return
    }

    if (request.units?.owner_email && request.scheduled_at) {
      const scheduledDate = new Date(request.scheduled_at)
      const dateStr = scheduledDate.toLocaleDateString('th-TH', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        weekday: 'long'
      })
      const timeStr = scheduledDate.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })
      
      const appointmentTypeMap: Record<string, string> = {
        'normal': 'ปกติ',
        'urgent': 'ด่วน',
        'emergency': 'ฉุกเฉิน'
      }
      
      const appointmentTypeText = appointmentTypeMap[request.appointment_type] || request.appointment_type

      const subject = `นัดหมายการซ่อม - ห้อง ${request.units.unit_number}`
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { font-family: 'Sarabun', Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #d4edda; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
            .content { background: white; padding: 20px; border: 1px solid #e9ecef; border-radius: 8px; }
            .appointment { background: #fff3cd; padding: 15px; border-radius: 5px; margin: 15px 0; }
            .footer { margin-top: 20px; padding-top: 20px; border-top: 1px solid #e9ecef; font-size: 12px; color: #6c757d; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📅 นัดหมายการซ่อม</h1>
              <p>สวัสดีคุณ ${request.units.owner_name}</p>
            </div>
            
            <div class="content">
              <div class="appointment">
                <h2>✅ มีการนัดหมายการซ่อมใหม่</h2>
                <p>งานซ่อมของคุณได้ถูกนัดหมายแล้ว</p>
              </div>
              
              <p><strong>รายละเอียดงานซ่อม:</strong></p>
              <p>ห้อง: <strong>${request.units.unit_number}</strong></p>
              <p>เรื่อง: <strong>${request.title}</strong></p>
              
              <p><strong>รายละเอียดการนัดหมาย:</strong></p>
              <p>วันที่: <strong>${dateStr}</strong></p>
              <p>เวลา: <strong>${timeStr}</strong></p>
              <p>ระยะเวลา: <strong>${request.scheduled_duration} นาที</strong></p>
              <p>ประเภท: <strong>${appointmentTypeText}</strong></p>
              
              <p style="margin-top: 20px;">กรุณาจำวันและเวลาที่นัดหมายไว้ หากมีเหตุจำเป็นที่ไม่สามารถมาตามนัดได้ กรุณาติดต่อเจ้าหน้าที่ล่วงหน้า</p>
            </div>
            
            <div class="footer">
              <p>อีเมลนี้ส่งโดยระบบอัตโนมัติ กรุณาอย่าตอบกลับ</p>
              <p>© ${new Date().getFullYear()} Condo Management System</p>
            </div>
          </div>
        </body>
        </html>
      `
      
      await sendEmailNotification(
        request.units.owner_email,
        subject,
        htmlContent
      )
      console.log(`[sendAppointmentEmail] Email sent to ${request.units.owner_email}`)
    }
  } catch (emailError) {
    console.error('[sendAppointmentEmail] Email error:', emailError)
  }
}

