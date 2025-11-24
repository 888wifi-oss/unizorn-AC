import { NotificationType } from "@/lib/types/notification"

// Helper function to get notification templates
export function getNotificationTemplate(type: NotificationType) {
  const templates = {
    payment_due: {
      title: "แจ้งเตือนการชำระเงิน",
      message: "บิลสำหรับเดือน {month} ครบกำหนดชำระในวันที่ {dueDate} กรุณาชำระเงินภายในกำหนด"
    },
    payment_received: {
      title: "ยืนยันการรับชำระเงิน",
      message: "ได้รับชำระเงินสำหรับบิลเดือน {month} จำนวน {amount} แล้ว ขอบคุณครับ"
    },
    maintenance_update: {
      title: "อัปเดตสถานะงานซ่อม",
      message: "งานซ่อมเรื่อง '{title}' มีการอัปเดตสถานะเป็น '{status}'"
    },
    announcement: {
      title: "ประกาศใหม่",
      message: "มีประกาศใหม่: {title}"
    },
    bill_generated: {
      title: "บิลใหม่",
      message: "บิลสำหรับเดือน {month} ได้ถูกสร้างแล้ว กรุณาตรวจสอบและชำระเงิน"
    }
  }
  return templates[type]
}
