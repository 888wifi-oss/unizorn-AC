# 📦 สร้าง Payment Slips Storage Bucket

## ⚠️ สิ่งสำคัญ

**การสร้าง Storage Bucket ต้องทำผ่าน Supabase Dashboard เท่านั้น**  
ไม่สามารถสร้างอัตโนมัติผ่าน API เนื่องจากมี RLS Policy บังคับ

---

## 📋 ขั้นตอนการสร้าง Bucket

### 1️⃣ เปิด Supabase Dashboard

ไปที่: **https://app.supabase.com** → Login → เลือกโปรเจคของคุณ

### 2️⃣ ไปที่ Storage

- คลิกเมนู **"Storage"** ใน sidebar ซ้าย
- หรือ URL: `https://app.supabase.com/project/[project-id]/storage/buckets`

### 3️⃣ สร้าง Bucket ใหม่

1. คลิกปุ่ม **"New Bucket"** (มุมขวาบน)
2. กรอกข้อมูล:
   ```
   Name: payment-slips
   Public bucket: ❌ ปิด (เลือก Private)
   ```
3. คลิก **"Create bucket"**

### 4️⃣ ตั้งค่า Policies (สำคัญ!)

หลังจากสร้าง bucket แล้ว:

1. เปิด bucket **`payment-slips`** ที่เพิ่งสร้าง
2. ไปที่ tab **"Policies"**
3. สร้าง 3 Policies ตามนี้:

---

#### 🔹 Policy 1: Allow Uploads

- **Policy name**: `Allow authenticated uploads`
- **Allowed operation**: ✅ **INSERT**
- **Policy definition** (ในช่อง Policy):
  ```sql
  bucket_id = 'payment-slips'
  ```
- คลิก **"Save Policy"**

#### 🔹 Policy 2: Allow View

- **Policy name**: `Allow authenticated view`
- **Allowed operation**: ✅ **SELECT**
- **Policy definition**:
  ```sql
  bucket_id = 'payment-slips'
  ```
- คลิก **"Save Policy"**

#### 🔹 Policy 3: Allow Delete (Admin)

- **Policy name**: `Allow admins delete`
- **Allowed operation**: ✅ **DELETE**
- **Policy definition**:
  ```sql
  bucket_id = 'payment-slips'
  ```
- คลิก **"Save Policy"**

---

## ✅ ตรวจสอบว่าสร้างสำเร็จ

1. กลับไปที่ Portal Dashboard
2. ลองอัพโหลดสลิปอีกครั้ง
3. ถ้าสำเร็จจะไม่มี error message

---

## 🆘 ถ้ายังมีปัญหา

### Error: "Bucket not found"
→ ตรวจสอบว่าสร้าง bucket ชื่อ `payment-slips` แล้วหรือยัง

### Error: "Permission denied"
→ ตรวจสอบว่า Policies ถูกสร้างครบทั้ง 3 ตัว (INSERT, SELECT, DELETE)

### Error: "RLS policy violation"
→ ตรวจสอบว่า Policies มี Policy definition เป็น `bucket_id = 'payment-slips'`

---

## 📝 หมายเหตุ

- Bucket ควรเป็น **Private** เพื่อความปลอดภัย
- Policies ที่สร้างจะอนุญาตให้ authenticated users อัพโหลดและดูไฟล์
- Admin สามารถลบไฟล์ได้

