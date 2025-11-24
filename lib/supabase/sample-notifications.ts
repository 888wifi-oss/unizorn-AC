"use server"

import { createNotificationForAllUnits } from "@/lib/supabase/notification-helpers"
import { NotificationType } from "@/lib/types/notification"

// Create sample notifications for testing
export async function createSampleNotifications() {
  try {
    // Create welcome announcement
    const announcementResult = await createNotificationForAllUnits(
      'announcement' as NotificationType,
      'ยินดีต้อนรับสู่ระบบ Resident Portal',
      'ระบบ Resident Portal ใหม่พร้อมใช้งานแล้ว คุณสามารถดูบิล ค่าส่วนกลาง และแจ้งซ่อมได้ผ่านระบบนี้'
    )

    // Create maintenance reminder
    const maintenanceResult = await createNotificationForAllUnits(
      'maintenance_update' as NotificationType,
      'แจ้งเตือนการบำรุงรักษา',
      'กรุณาตรวจสอบระบบไฟฟ้าและประปาในห้องของคุณ หากพบปัญหากรุณาแจ้งซ่อมผ่านระบบ'
    )

    // Create bill reminder
    const billResult = await createNotificationForAllUnits(
      'payment_due' as NotificationType,
      'แจ้งเตือนการชำระค่าส่วนกลาง',
      'บิลค่าส่วนกลางประจำเดือนนี้พร้อมชำระแล้ว กรุณาตรวจสอบและชำระเงินภายในกำหนด'
    )

    return {
      success: true,
      message: "สร้างการแจ้งเตือนตัวอย่างเรียบร้อยแล้ว",
      results: {
        announcement: announcementResult,
        maintenance: maintenanceResult,
        bill: billResult
      }
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message
    }
  }
}
