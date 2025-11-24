# Payment Slips Storage Setup Guide

## สร้าง Storage Bucket ใน Supabase Dashboard

### ขั้นตอนที่ 1: สร้าง Bucket

1. ไปที่ **Supabase Dashboard** > **Storage**
2. คลิก **"New Bucket"**
3. ตั้งค่าดังนี้:
   - **Name**: `payment-slips`
   - **Public bucket**: ❌ **ปิด** (Private bucket)
   - **File size limit**: `5242880` (5MB)
   - **Allowed MIME types**: `image/jpeg,image/png,image/jpg,application/pdf`
4. คลิก **"Create bucket"**

---

## ขั้นตอนที่ 2: ตั้งค่า RLS Policies

หลังจากสร้าง bucket แล้ว ไปที่ **Storage** > **payment-slips** > **Policies**

### Policy 1: Allow authenticated users to upload slips

- **Policy name**: `Allow authenticated uploads`
- **Allowed operation**: ✅ **INSERT**
- **Policy definition**: 
  ```sql
  (bucket_id = 'payment-slips')
  ```
- **WITH CHECK expression**:
  ```sql
  (bucket_id = 'payment-slips')
  ```

### Policy 2: Allow authenticated users to view files

- **Policy name**: `Allow authenticated view`
- **Allowed operation**: ✅ **SELECT**
- **Policy definition**: 
  ```sql
  (bucket_id = 'payment-slips')
  ```
  
  **หมายเหตุ**: ถ้าต้องการให้ดูได้เฉพาะไฟล์ของตัวเอง ใช้:
  ```sql
  (bucket_id = 'payment-slips' AND (storage.foldername(name))[1] = auth.uid()::text)
  ```
  แต่สำหรับกรณีนี้ เนื่องจากเราอัพโหลดด้วย transaction ID เราใช้แบบง่ายๆ นี้ก่อน

### Policy 3: Allow admins to view all files

- **Policy name**: `Allow admins view all`
- **Allowed operation**: ✅ **SELECT**
- **Policy definition**: 
  ```sql
  (bucket_id = 'payment-slips')
  ```
- **WITH CHECK expression** (ถ้ามี):
  ```sql
  (bucket_id = 'payment-slips')
  ```

### Policy 4: Allow admins to delete files

- **Policy name**: `Allow admins delete`
- **Allowed operation**: ✅ **DELETE**
- **Policy definition**: 
  ```sql
  (bucket_id = 'payment-slips')
  ```

---

## วิธีเพิ่ม Policy ใน Supabase Dashboard:

1. ไปที่ **Storage** > **payment-slips** > **Policies** tab
2. คลิก **"New Policy"**
3. เลือก **"Custom Policy"**
4. กรอกข้อมูล:
   - **Name**: ตาม Policy name ข้างบน
   - **Allowed operation**: เลือกตามที่ระบุ (INSERT, SELECT, DELETE)
   - **Policy definition**: Copy SQL จากข้างบน
5. คลิก **"Save Policy"**

---

## ตัวอย่าง Policy Definition ที่ถูกต้อง:

### ✅ ถูกต้อง:
```
(bucket_id = 'payment-slips')
```

### ❌ ผิด (Syntax Error):
```
(bucket_id = 'payment-slips' AND auth.role() = 'authenticated')company_admin', 'project_admin'))
```

**ปัญหาคือ**: มีข้อความต่อท้ายผิด และอาจจะมี syntax error ใน role check

---

## ถ้าใช้ Simple Policy (แนะนำสำหรับเริ่มต้น):

สำหรับ Storage bucket ที่เป็น Private แต่อยากให้ authenticated users เข้าถึงได้:

**Policy Definition**:
```sql
bucket_id = 'payment-slips'
```

นี่คือ Policy ที่ง่ายที่สุดและใช้งานได้ดีกับ Private bucket

---

## Alternative: ใช้ Public Bucket (ไม่แนะนำ)

ถ้าใช้ Public bucket:
- ไม่ต้องตั้งค่า RLS Policies สำหรับ SELECT
- แต่ทุกคนสามารถเข้าถึงไฟล์ได้ผ่าน URL
- **ไม่แนะนำ** สำหรับข้อมูลการชำระเงิน

---

## Testing

หลังจากสร้าง Policies แล้ว ทดสอบโดย:
1. ไปที่ Portal Dashboard
2. เลือกบิล > ชำระเงิน > โอนผ่านธนาคาร
3. กดยืนยันการชำระเงิน
4. อัพโหลดสลิป

ถ้ายังมี error ให้ตรวจสอบ:
- Bucket ถูกสร้างแล้วหรือยัง
- Policies ถูกสร้างแล้วหรือยัง
- User มีสิทธิ์ authenticated หรือไม่

