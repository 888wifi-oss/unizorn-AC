# 🔧 แก้ปัญหา Storage Bucket "payment-slips"

## ❌ ปัญหาที่พบบ่อย

### 1. Error: "Bucket not found"
**สาเหตุ**: Bucket `payment-slips` ยังไม่ได้สร้างใน Supabase Dashboard

**วิธีแก้**:
1. ✅ ตรวจสอบว่า bucket ถูกสร้างแล้วจริงๆ:
   - ไปที่ Supabase Dashboard → Storage
   - ดูว่ามี bucket ชื่อ `payment-slips` หรือไม่
   - **ชื่อต้องตรงทุกตัวอักษร**: `payment-slips` (lowercase, hyphen)

2. ✅ ถ้ายังไม่มี:
   - คลิก "New Bucket"
   - Name: `payment-slips` (ตรวจสอบว่าพิมพ์ถูกต้อง)
   - Public: ❌ **ปิด** (Private)
   - คลิก "Create bucket"

---

### 2. Error: "Permission denied" หรือ "RLS policy violation"
**สาเหตุ**: Bucket มีอยู่แล้ว แต่ Policies ไม่ครบหรือไม่ถูกต้อง

**วิธีแก้**:

#### ขั้นตอนที่ 1: ตรวจสอบ Policies
1. ไปที่ Supabase Dashboard → Storage → `payment-slips` → **Policies** tab
2. ตรวจสอบว่ามี Policies 3 ตัว:
   - [ ] INSERT policy
   - [ ] SELECT policy
   - [ ] DELETE policy

#### ขั้นตอนที่ 2: สร้าง Policies (ถ้ายังไม่มี)

**Policy 1: INSERT**
```
Policy Name: Allow authenticated uploads
Operation: INSERT
Policy Definition: bucket_id = 'payment-slips'
```

**Policy 2: SELECT**
```
Policy Name: Allow authenticated view
Operation: SELECT
Policy Definition: bucket_id = 'payment-slips'
```

**Policy 3: DELETE**
```
Policy Name: Allow admins delete
Operation: DELETE
Policy Definition: bucket_id = 'payment-slips'
```

#### ขั้นตอนที่ 3: ตรวจสอบ Policy Definition
⚠️ **สำคัญ**: Policy Definition ต้องเป็น:
```sql
bucket_id = 'payment-slips'
```

**❌ ผิด**:
- `bucket_id = "payment-slips"` (ใช้ double quotes)
- `bucket_id='payment-slips'` (ไม่มี space)
- `(bucket_id = 'payment-slips')` (มี parentheses ไม่จำเป็น)
- `bucket_id = 'Payment-Slips'` (uppercase)

**✅ ถูก**:
- `bucket_id = 'payment-slips'` (single quotes, lowercase)

---

### 3. Error: "WebSocket connection failed"
**สาเหตุ**: ปัญหา network หรือ browser extension (เช่น LastPass)

**วิธีแก้**:
- ไม่เกี่ยวกับ Storage Bucket
- ปัญหานี้ไม่กระทบการทำงานของระบบ

---

## ✅ Checklist ตรวจสอบ

ทำตามนี้ทีละข้อ:

- [ ] ✅ Bucket `payment-slips` ถูกสร้างแล้วใน Supabase Dashboard
- [ ] ✅ ชื่อ bucket ตรงทุกตัวอักษร: `payment-slips` (lowercase)
- [ ] ✅ Bucket ตั้งเป็น **Private** (ไม่ใช่ Public)
- [ ] ✅ มี Policies 3 ตัว (INSERT, SELECT, DELETE)
- [ ] ✅ Policy Definition ของทั้ง 3 ตัวเป็น: `bucket_id = 'payment-slips'`
- [ ] ✅ Policies ทั้ง 3 ตัวถูก **Save** แล้ว
- [ ] ✅ รอ 10-30 วินาที เพื่อให้ Policies ถูก apply
- [ ] ✅ Refresh หน้า Portal Dashboard
- [ ] ✅ ลองอัพโหลดสลิปอีกครั้ง

---

## 🧪 ทดสอบ Bucket

### วิธีที่ 1: ทดสอบใน Supabase Dashboard
1. ไปที่ Storage → `payment-slips`
2. คลิก "Upload file"
3. เลือกไฟล์ใดๆ (เช่น .txt)
4. ถ้าอัพโหลดได้ = Bucket และ Policies ถูกต้อง ✅
5. ถ้าอัพโหลดไม่ได้ = ตรวจสอบ Policies อีกครั้ง ❌

### วิธีที่ 2: ใช้ Test Script
```bash
npx tsx scripts/test_storage_bucket.ts
```

Script นี้จะ:
- ตรวจสอบว่า bucket มีอยู่หรือไม่
- ทดสอบการเข้าถึง bucket
- ทดสอบการอัพโหลดไฟล์
- แสดง error message ที่ชัดเจน

---

## 🔍 Debug Tips

### ดู Error Details ใน Console
1. เปิด Browser DevTools (F12)
2. ไปที่ Console tab
3. ลองอัพโหลดสลิป
4. ดู error message ที่ละเอียด:
   - `errorCode`: จะบอกว่าปัญหาคืออะไร
     - `BUCKET_NOT_FOUND` = Bucket ยังไม่สร้าง
     - `RLS_POLICY_ERROR` = Policies ไม่ครบหรือไม่ถูกต้อง

### ตรวจสอบใน Supabase Dashboard
1. ไปที่ Storage → `payment-slips` → Policies
2. ดู Policies ทั้งหมด
3. ตรวจสอบว่า:
   - มี 3 Policies (INSERT, SELECT, DELETE)
   - Policy Definition ถูกต้อง
   - Policies ถูก Save แล้ว (ดูที่ timestamp)

---

## 📞 ถ้ายังแก้ไม่ได้

### ตรวจสอบเพิ่มเติม:
1. ✅ Login ด้วย account ที่มีสิทธิ์ Owner/Admin
2. ✅ ตรวจสอบว่า Supabase project ใช้งานได้ปกติ
3. ✅ ลอง refresh Supabase Dashboard
4. ✅ ตรวจสอบ Browser Console สำหรับ error เพิ่มเติม

### ถ้ายังไม่ได้:
1. ลบ bucket `payment-slips` (ถ้ามี)
2. สร้างใหม่ทั้งหมด
3. สร้าง Policies ใหม่ทั้งหมด
4. รอ 30 วินาที
5. ลองอีกครั้ง


