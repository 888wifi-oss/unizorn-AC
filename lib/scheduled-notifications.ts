"use server"

import { createClient } from "@/lib/supabase/server"
import { createPaymentDueNotifications } from "@/lib/supabase/notification-actions"
import { sendPaymentDueEmail } from "@/lib/email-service"

// Scheduled notification service
export async function runScheduledNotifications() {
  
  try {
    console.log("Starting scheduled notifications...")
    
    // 1. Create payment due notifications
    const notificationResult = await createPaymentDueNotifications()
    if (notificationResult.success) {
      console.log(`Created ${notificationResult.count} payment due notifications`)
    } else {
      console.error("Failed to create payment due notifications:", notificationResult.error)
    }
    
    // 2. Send email notifications for payment due
    const supabase = await createClient()
    
    // Get bills that are due in 3 days
    const threeDaysFromNow = new Date()
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3)
    
    const { data: bills, error } = await supabase
      .from('bills')
      .select(`
        id,
        unit_id,
        month,
        due_date,
        total,
        units!inner(user_id, unit_number, owner_name, owner_email)
      `)
      .eq('status', 'pending')
      .lte('due_date', threeDaysFromNow.toISOString().split('T')[0])

    if (error) {
      console.error("Failed to fetch bills for email notifications:", error)
      return { success: false, error: error.message }
    }

    let emailCount = 0
    for (const bill of bills || []) {
      if (bill.units?.owner_email && bill.units?.user_id) {
        try {
          const emailResult = await sendPaymentDueEmail(
            bill.units.owner_email,
            bill.units.owner_name,
            bill.units.unit_number,
            bill.month,
            new Date(bill.due_date).toLocaleDateString('th-TH'),
            bill.total
          )
          
          if (emailResult.success) {
            emailCount++
            console.log(`Sent payment due email to ${bill.units.owner_email}`)
          } else {
            console.error(`Failed to send email to ${bill.units.owner_email}:`, emailResult.error)
          }
        } catch (error) {
          console.error(`Error sending email to ${bill.units.owner_email}:`, error)
        }
      }
    }
    
    console.log(`Sent ${emailCount} payment due emails`)
    
    // 3. Clean up expired notifications
    const { error: cleanupError } = await supabase
      .from('notifications')
      .delete()
      .not('expires_at', 'is', null)
      .lt('expires_at', new Date().toISOString())

    if (cleanupError) {
      console.error("Failed to cleanup expired notifications:", cleanupError)
    } else {
      console.log("Cleaned up expired notifications")
    }
    
    return { 
      success: true, 
      notifications: notificationResult.count || 0,
      emails: emailCount
    }
  } catch (error: any) {
    console.error("Error in scheduled notifications:", error)
    return { success: false, error: error.message }
  }
}

// Function to send payment received notifications
export async function sendPaymentReceivedNotifications(paymentId: string) {
  
  try {
    const supabase = await createClient()
    
    // Get payment details with unit and bill information
    const { data: payment, error } = await supabase
      .from('payments')
      .select(`
        id,
        amount,
        payment_date,
        units!inner(user_id, unit_number, owner_name, owner_email),
        bills!inner(month)
      `)
      .eq('id', paymentId)
      .single()

    if (error || !payment) {
      throw new Error(`Failed to fetch payment details: ${error?.message}`)
    }

    // Create in-app notification
    const { createNotification } = await import("@/lib/supabase/notification-actions")
    
    if (payment.units?.user_id) {
      await createNotification({
        user_id: payment.units.user_id,
        unit_id: payment.units.id,
        type: 'payment_received',
        title: 'ยืนยันการรับชำระเงิน',
        message: `ได้รับชำระเงินสำหรับบิลเดือน ${payment.bills.month} จำนวน ${payment.amount.toLocaleString()} บาทแล้ว ขอบคุณครับ`,
        data: {
          payment_id: payment.id,
          amount: payment.amount,
          month: payment.bills.month
        },
        is_read: false
      })
    }

    // Send email notification
    if (payment.units?.owner_email) {
      const { sendPaymentReceivedEmail } = await import("@/lib/email-service")
      
      await sendPaymentReceivedEmail(
        payment.units.owner_email,
        payment.units.owner_name,
        payment.units.unit_number,
        payment.bills.month,
        payment.amount
      )
    }

    return { success: true }
  } catch (error: any) {
    console.error("Error sending payment received notifications:", error)
    return { success: false, error: error.message }
  }
}

// Function to send maintenance update notifications
export async function sendMaintenanceUpdateNotifications(maintenanceId: string, newStatus: string) {
  
  try {
    const supabase = await createClient()
    
    // Get maintenance request details
    const { data: maintenance, error } = await supabase
      .from('maintenance_requests')
      .select(`
        id,
        title,
        status,
        units!inner(user_id, unit_number, owner_name, owner_email)
      `)
      .eq('id', maintenanceId)
      .single()

    if (error || !maintenance) {
      throw new Error(`Failed to fetch maintenance details: ${error?.message}`)
    }

    // Create in-app notification
    const { createNotification } = await import("@/lib/supabase/notification-actions")
    
    if (maintenance.units?.user_id) {
      await createNotification({
        user_id: maintenance.units.user_id,
        unit_id: maintenance.units.id,
        type: 'maintenance_update',
        title: 'อัปเดตสถานะงานซ่อม',
        message: `งานซ่อมเรื่อง '${maintenance.title}' มีการอัปเดตสถานะเป็น '${newStatus}'`,
        data: {
          maintenance_id: maintenance.id,
          title: maintenance.title,
          status: newStatus
        },
        is_read: false
      })
    }

    // Send email notification
    if (maintenance.units?.owner_email) {
      const { sendMaintenanceUpdateEmail } = await import("@/lib/email-service")
      
      await sendMaintenanceUpdateEmail(
        maintenance.units.owner_email,
        maintenance.units.owner_name,
        maintenance.units.unit_number,
        maintenance.title,
        newStatus
      )
    }

    return { success: true }
  } catch (error: any) {
    console.error("Error sending maintenance update notifications:", error)
    return { success: false, error: error.message }
  }
}

// Function to send announcement notifications
export async function sendAnnouncementNotifications(announcementId: string) {
  
  try {
    const supabase = await createClient()
    
    // Get announcement details
    const { data: announcement, error } = await supabase
      .from('announcements')
      .select('id, title, content')
      .eq('id', announcementId)
      .single()

    if (error || !announcement) {
      throw new Error(`Failed to fetch announcement details: ${error?.message}`)
    }

    // Get all units with user_id
    const { data: units, error: unitsError } = await supabase
      .from('units')
      .select('id, user_id, unit_number, owner_name, owner_email')
      .not('user_id', 'is', null)

    if (unitsError) {
      throw new Error(`Failed to fetch units: ${unitsError.message}`)
    }

    // Create in-app notifications
    const { createNotification } = await import("@/lib/supabase/notification-actions")
    
    for (const unit of units || []) {
      if (unit.user_id) {
        await createNotification({
          user_id: unit.user_id,
          unit_id: unit.id,
          type: 'announcement',
          title: 'ประกาศใหม่',
          message: `มีประกาศใหม่: ${announcement.title}`,
          data: {
            announcement_id: announcement.id,
            title: announcement.title,
            content: announcement.content
          },
          is_read: false
        })
      }
    }

    // Send email notifications
    const { sendAnnouncementEmail } = await import("@/lib/email-service")
    
    for (const unit of units || []) {
      if (unit.owner_email) {
        try {
          await sendAnnouncementEmail(
            unit.owner_email,
            unit.owner_name,
            announcement.title,
            announcement.content
          )
        } catch (error) {
          console.error(`Failed to send announcement email to ${unit.owner_email}:`, error)
        }
      }
    }

    return { success: true, count: units?.length || 0 }
  } catch (error: any) {
    console.error("Error sending announcement notifications:", error)
    return { success: false, error: error.message }
  }
}
