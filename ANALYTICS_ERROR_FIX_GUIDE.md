# การแก้ไขปัญหาการวิเคราะห์ข้อมูลขั้นสูง ERROR

## ปัญหาที่พบ
หน้า "การวิเคราะห์ข้อมูลขั้นสูง" ยังมี ERROR:
```
Could not find the table 'public.expenses' in the schema cache
```

## การแก้ไขที่ทำแล้ว

### 1. แก้ไขการเชื่อมต่อฐานข้อมูล
- ✅ เปลี่ยนจาก `createClient` จาก `@/lib/supabase/client` เป็น `@/lib/supabase/server`
- ✅ แก้ไขใน `lib/supabase/analytics-actions.ts`
- ✅ แก้ไขใน `lib/supabase/test-analytics.ts`

### 2. แก้ไขปัญหาตาราง expenses ไม่มีอยู่
- ✅ ลบการเข้าถึงตาราง `expenses` ออกจาก analytics-actions.ts
- ✅ ลบการเข้าถึงตาราง `expenses` ออกจาก test-analytics.ts
- ✅ ปรับปรุงการคำนวณข้อมูลให้ใช้ตารางที่มีอยู่จริง
- ✅ สร้าง `lib/supabase/test-available-tables.ts` - ทดสอบตารางที่มีอยู่จริง

### 3. เพิ่มฟังก์ชันทดสอบ
- ✅ สร้าง `lib/supabase/test-analytics-connection.ts` - ทดสอบการเชื่อมต่อพื้นฐาน
- ✅ เพิ่มฟังก์ชัน `handleTestConnection` ในหน้า Analytics
- ✅ เพิ่มฟังก์ชัน `handleTestAvailableTables` ในหน้า Analytics
- ✅ เพิ่มปุ่ม **"ทดสอบการเชื่อมต่อ"** และ **"ทดสอบตารางที่มีอยู่"** ใน PageHeader

## ไฟล์ที่แก้ไข
- `lib/supabase/analytics-actions.ts` - แก้ไข import createClient และลบการเข้าถึงตาราง expenses
- `lib/supabase/test-analytics.ts` - แก้ไข import createClient และลบการเข้าถึงตาราง expenses
- `lib/supabase/test-analytics-connection.ts` - สร้างใหม่
- `lib/supabase/test-available-tables.ts` - สร้างใหม่
- `app/(admin)/analytics/page.tsx` - เพิ่มฟังก์ชันทดสอบและปุ่ม

## ตารางที่มีอยู่จริงในระบบ
- ✅ `units` - ข้อมูลห้องชุด
- ✅ `bills` - ข้อมูลบิลค่าใช้จ่าย
- ✅ `parcels` - ข้อมูลพัสดุ
- ✅ `maintenance_requests` - ข้อมูลการซ่อมแซม
- ✅ `notifications` - ข้อมูลการแจ้งเตือน
- ✅ `chart_of_accounts` - บัญชีแยกประเภท
- ✅ `revenue_journal` - บันทึกรายรับ
- ✅ `revenue_budget` - งบประมาณรายรับ

## ตารางที่ไม่มีอยู่ (ถูกเอาออก)
- ❌ `expenses` - ไม่มีตารางนี้ในระบบ

## วิธีทดสอบและแก้ไข

### ขั้นตอนที่ 1: ทดสอบการเชื่อมต่อ
1. ไปที่หน้า **"การวิเคราะห์ข้อมูล"**
2. กดปุ่ม **"ทดสอบการเชื่อมต่อ"**
3. ตรวจสอบผลลัพธ์:
   - ✅ **สำเร็จ**: "การเชื่อมต่อฐานข้อมูลทำงานได้ปกติ"
   - ❌ **ล้มเหลว**: แสดง error message

### ขั้นตอนที่ 2: ทดสอบตารางที่มีอยู่จริง
1. กดปุ่ม **"ทดสอบตารางที่มีอยู่"**
2. ตรวจสอบผลลัพธ์:
   - ✅ **สำเร็จ**: แสดงรายการตารางที่พร้อมใช้งาน
   - ❌ **ล้มเหลว**: แสดงรายการตารางที่มีปัญหา

### ขั้นตอนที่ 3: ทดสอบตาราง Analytics
1. กดปุ่ม **"ทดสอบตาราง"**
2. ตรวจสอบผลลัพธ์:
   - ✅ **สำเร็จ**: "ตารางทั้งหมดพร้อมใช้งาน"
   - ❌ **ล้มเหลว**: แสดงรายการตารางที่มีปัญหา

### ขั้นตอนที่ 4: ทดสอบการโหลดข้อมูล
1. กดปุ่ม **"รีเฟรช"**
2. ตรวจสอบว่าข้อมูลโหลดได้หรือไม่

## การแก้ไขปัญหาเฉพาะ

### **ปัญหาการเชื่อมต่อฐานข้อมูล**
หากทดสอบการเชื่อมต่อล้มเหลว:
1. ตรวจสอบการตั้งค่า Supabase
2. ตรวจสอบ environment variables
3. ตรวจสอบ network connection

### **ปัญหาตารางไม่มีอยู่**
หากทดสอบตารางล้มเหลว:
1. ตรวจสอบว่าตารางถูกสร้างในฐานข้อมูลแล้ว
2. รัน SQL scripts ที่เกี่ยวข้อง:
   - `scripts/001_create_tables.sql` สำหรับตารางพื้นฐาน
   - `scripts/004_security_updates.sql` สำหรับตาราง maintenance_requests
   - `scripts/008_create_notifications_table.sql` สำหรับตาราง notifications
   - `scripts/009_create_parcels_table.sql` สำหรับตาราง parcels

### **ปัญหาการเข้าถึงข้อมูล**
หากมี RLS (Row Level Security) error:
1. ตรวจสอบ RLS policies ในตาราง
2. ตรวจสอบสิทธิ์การเข้าถึงของผู้ใช้

## การแก้ไขเพิ่มเติม

### **หากยังมีปัญหา ให้ตรวจสอบ:**

1. **Console Errors**
   - เปิด Developer Tools (F12)
   - ดู Console tab
   - หา error messages ที่เกี่ยวข้อง

2. **Network Tab**
   - ดู Network tab ใน Developer Tools
   - ตรวจสอบ API calls ที่ล้มเหลว

3. **Server Logs**
   - ตรวจสอบ server logs
   - ดู error messages จาก server

## ผลลัพธ์ที่คาดหวัง
- ✅ การเชื่อมต่อฐานข้อมูลทำงานได้ปกติ
- ✅ ตารางทั้งหมดพร้อมใช้งาน
- ✅ การวิเคราะห์ข้อมูลโหลดได้ปกติ
- ✅ ไม่มี error ใน Console
- ✅ ไม่มี error เรื่องตาราง expenses

## การแก้ไขเพิ่มเติม
หากยังมีปัญหา ให้:
1. ตรวจสอบ Console errors
2. ตรวจสอบ Network requests
3. ตรวจสอบ Server logs
4. บอก error message ที่เจอ
