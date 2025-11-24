## Payments Report Scheduler Plan

### Objectives
- ส่งออกรายงานการชำระเงินอัตโนมัติทุกวัน (เช้า 08:00 น. ตามเวลาประเทศไทย)
- แจ้งเตือนทีมการเงินผ่านอีเมลพร้อมไฟล์แนบ (CSV, XLSX, PDF)
- เก็บประวัติการรันงานและสถานะสำเร็จ/ล้มเหลวเพื่อการ audit

### ข้อมูลที่ต้องใช้
- ตาราง `payments` (รวมคอลัมน์ reconciliation ใหม่)
- ตาราง `bills` และ `units` สำหรับดึงเลขที่บิล/หมายเลขห้อง
- ตาราง `projects` และ `users` (หากต้องกรองตามโครงการหรือกำหนดผู้รับอีเมลเฉพาะ)

### โครงสร้างงาน (High Level)
1. **Scheduled Job (Supabase Edge Function / CRON job)**
   - Trigger ทุกวัน 01:00 UTC (~08:00 ICT)
   - รับค่า `project_id` (optional) เพื่อรองรับหลายโครงการ
2. **Data Fetch Layer**
   - Query Supabase ด้วย service key (Role: service)
   - รวม payments + bills + units และสรุปยอดตามเงื่อนไข
3. **Report Builder**
   - Reuse logic เดียวกับหน้าจอ (include reconciliation status, payment methods, totals)
   - ใช้ helper ที่มีอยู่: `formatDate`, `formatCurrency` และ export helper ใหม่
   - สร้างไฟล์ 3 รูปแบบ:
     - CSV: ใช้ helper จาก UI (BOM + UTF-8)
     - XLSX: ใช้ `xlsx` (json_to_sheet, autosize columns)
     - PDF: ใช้ `jspdf` + `autotable` + ฟอนต์ Sarabun
   - เก็บไฟล์ชั่วคราวในหน่วยความจำหรืออัปโหลดขึ้น Supabase Storage (`reports/payments/YYYY/MM/DD`)
4. **Notification Layer**
   - ส่งอีเมลผ่าน existing mail service (เช่น `lib/email-service.ts`)
   - แนบลิงก์ดาวน์โหลดหรือไฟล์โดยตรง (ระวังขนาดไฟล์ PDF/XLSX)
   - สำรอง: ส่ง webhook/LINE Notify ถ้าจำเป็น
5. **Job Logging**
   - บันทึกผลลัพธ์ลงตาราง `scheduled_jobs_log`:
     ```sql
     id, job_name, project_id, started_at, finished_at, status, error_message, artifact_urls[]
     ```

### ขั้นตอนการพัฒนา
1. **Shared Export Utilities**
   - แยก helper `buildPaymentsExportRows` และ `paymentsExportColumns` ออกจาก UI (เช่นไฟล์ `lib/exports/payments.ts`)
   - ให้ UI และ scheduled job ใช้ร่วมกัน ลด duplicated logic
2. **Edge Function / Server Action**
   - สร้างไฟล์ `supabase/functions/payments-daily-report/index.ts`
   - ใช้ `cron` ใน Supabase หรือ GitHub Actions/Cloud Scheduler เรียก function นี้
3. **Environment & Secrets**
   - เพิ่มค่า `PAYMENTS_REPORT_RECIPIENTS` (comma-separated emails)
   - ใช้ `SERVICE_ROLE_KEY` สำหรับ query/insert log
4. **Testing Checklist**
   - Run job manually (local simulation) ด้วยวันที่จำลอง
   - ตรวจสอบไฟล์แต่ละรูปแบบ (ภาษาไทยถูกต้อง, ช่องครบ)
   - ทดสอบกรณีไม่มีข้อมูล → ส่งอีเมลแจ้ง “ไม่มีรายการ”
   - ทดสอบกรณี error (เช่น Supabase down) → ส่งคำเตือนไป Slack/Email dev
5. **Monitoring**
   - เพิ่ม alert เมื่อ job status = failed ติดต่อกัน > 1 ครั้ง
   - เก็บไฟล์ย้อนหลังอย่างน้อย 90 วัน (ตั้ง lifecycle policy ใน Storage)

### ทรัพยากรเพิ่มเติม
- **Cron Setup (Supabase)**: https://supabase.com/docs/guides/functions/schedule-functions
- **Email Utility**: ดู `lib/email-service.ts` เพื่อ reuse template พร้อมฟอนต์ Sarabun
- **Font Handling สำหรับ PDF**: ใช้ `lib/sarabun-font.ts` เหมือนใน UI

งานต่อไป: แยก helper export + ตั้งโครงสร้าง Edge Function ตามแผนนี้ แล้วเชื่อมกับ notification pipeline ที่มีอยู่

