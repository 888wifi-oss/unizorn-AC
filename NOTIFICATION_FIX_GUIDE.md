# การแก้ไขปัญหาการแจ้งเตือน

## ปัญหาที่พบ
Error: `PGRST205 - Could not find the table 'public.notifications' in the schema cache`

## สาเหตุ
ตาราง `notifications` ยังไม่มีในฐานข้อมูล Supabase

## วิธีแก้ไข

### ขั้นตอนที่ 1: รัน SQL Script
1. เข้าไปที่ Supabase Dashboard
2. ไปที่ SQL Editor
3. คัดลอกและรันโค้ดจากไฟล์ `scripts/008_create_notifications_table.sql`

### ขั้นตอนที่ 2: ตรวจสอบการติดตั้ง
1. ไปที่หน้า "จัดการการแจ้งเตือน" ใน admin
2. คลิกปุ่ม "ทดสอบฐานข้อมูล"
3. ควรเห็นข้อความ "Units: OK | Notifications: OK"

### ขั้นตอนที่ 3: ทดสอบการสร้างการแจ้งเตือน
1. คลิกปุ่ม "สร้างตัวอย่าง"
2. ควรเห็นข้อความ "สร้างการแจ้งเตือนตัวอย่างเรียบร้อยแล้ว"

## ไฟล์ที่เกี่ยวข้อง
- `scripts/008_create_notifications_table.sql` - SQL script สำหรับสร้างตาราง
- `lib/supabase/test-database.ts` - ฟังก์ชันทดสอบฐานข้อมูล
- `lib/supabase/notification-helpers.ts` - ฟังก์ชันสร้างการแจ้งเตือน
- `app/(admin)/notifications/page.tsx` - หน้า admin สำหรับจัดการการแจ้งเตือน

## หมายเหตุ
หลังจากรัน SQL script แล้ว ระบบการแจ้งเตือนจะทำงานได้ปกติ
