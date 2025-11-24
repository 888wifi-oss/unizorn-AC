import { AutomationRule } from "@/lib/types/automation"

// Built-in automation rules
export const builtInRules: Omit<AutomationRule, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    name: "แจ้งเตือนค่าส่วนกลางค้างชำระ",
    description: "แจ้งเตือนลูกบ้านที่ค้างชำระค่าส่วนกลางเกิน 7 วัน",
    type: 'payment_due',
    isActive: true,
    conditions: [
      { field: 'days_overdue', operator: 'greater_than', value: 7 },
      { field: 'status', operator: 'equals', value: 'unpaid' }
    ],
    actions: [
      {
        type: 'send_notification',
        target: 'unit',
        message: 'ค่าส่วนกลางค้างชำระเกินกำหนด กรุณาชำระเงินโดยเร็ว'
      }
    ],
    schedule: {
      type: 'daily',
      time: '09:00'
    }
  },
  {
    name: "แจ้งเตือนพัสดุเกินกำหนด",
    description: "แจ้งเตือนลูกบ้านที่มีพัสดุเกินกำหนดรับ 3 วัน",
    type: 'parcel_overdue',
    isActive: true,
    conditions: [
      { field: 'days_since_received', operator: 'greater_than', value: 3 },
      { field: 'status', operator: 'equals', value: 'pending' }
    ],
    actions: [
      {
        type: 'send_notification',
        target: 'unit',
        message: 'มีพัสดุรอรับเกินกำหนด กรุณามารับพัสดุที่สำนักงาน'
      }
    ],
    schedule: {
      type: 'daily',
      time: '10:00'
    }
  },
  {
    name: "แจ้งเตือนงานซ่อมบำรุงค้าง",
    description: "แจ้งเตือนงานซ่อมบำรุงที่ค้างเกิน 5 วัน",
    type: 'maintenance_reminder',
    isActive: true,
    conditions: [
      { field: 'days_since_created', operator: 'greater_than', value: 5 },
      { field: 'status', operator: 'equals', value: 'pending' }
    ],
    actions: [
      {
        type: 'send_notification',
        target: 'admin',
        message: 'มีงานซ่อมบำรุงค้างเกินกำหนด กรุณาดำเนินการโดยเร็ว'
      }
    ],
    schedule: {
      type: 'daily',
      time: '08:00'
    }
  },
  {
    name: "รายงานประจำเดือน",
    description: "ส่งรายงานสรุปประจำเดือนให้ผู้บริหาร",
    type: 'monthly_report',
    isActive: true,
    conditions: [],
    actions: [
      {
        type: 'send_notification',
        target: 'admin',
        message: 'รายงานประจำเดือนพร้อมแล้ว กรุณาตรวจสอบในระบบ'
      }
    ],
    schedule: {
      type: 'monthly',
      day: 1,
      time: '09:00'
    }
  }
]
