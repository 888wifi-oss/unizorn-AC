# 🚀 ระบบ Username Authentication แบบง่าย

## ✅ สิ่งที่ทำเสร็จแล้ว:

### 1. สร้างระบบใหม่แบบง่าย
- **ไฟล์**: `lib/supabase/simple-username-auth.ts`
- **หลักการ**: เก็บ username ใน `units` table โดยตรง
- **ไม่ต้องใช้**: `username_mapping` table

### 2. อัปเดต Login Page
- **ไฟล์**: `app/portal/login/page.tsx`
- **ใช้**: `signInWithUsernameSimple` แทน `signInWithUsername`

### 3. อัปเดต Registration Process
- **ไฟล์**: `lib/actions/invitation-actions.ts`
- **ใช้**: `createAccountSimple` แทน `createUsernameMapping`

### 4. สร้าง SQL Script
- **ไฟล์**: `scripts/152_add_username_to_units.sql`
- **เพิ่ม**: `username` column ใน `units` table

---

## 🔧 ขั้นตอนการใช้งาน:

### 1. รัน SQL Script
```sql
-- ใน Supabase SQL Editor
-- รัน scripts/152_add_username_to_units.sql
```

### 2. ตั้งค่า Username สำหรับห้องชุด
```sql
-- ตัวอย่างการตั้งค่า username
UPDATE units SET username = 't001' WHERE unit_number = 'T001';
UPDATE units SET username = 'sm001' WHERE unit_number = 'SM001';
UPDATE units SET username = 'ad222' WHERE unit_number = 'AD222';
```

### 3. ทดสอบ Login
- ใช้ username ที่ตั้งค่าไว้
- ระบบจะหา username ใน `units` table
- ถ้ามี `user_id` จะใช้ Supabase Auth
- ถ้าไม่มี `user_id` จะใช้ simple password check

---

## 🎯 ข้อดีของระบบใหม่:

1. **ง่าย**: ไม่ต้องใช้ `username_mapping` table
2. **เร็ว**: Query เพียงครั้งเดียวใน `units` table
3. **ยืดหยุ่น**: รองรับทั้ง Supabase Auth และ simple auth
4. **เข้าใจง่าย**: Logic ตรงไปตรงมา

---

## 📋 การทำงาน:

### Login Process:
1. หา `units` ที่มี `username` ตรงกัน
2. ถ้ามี `user_id` → ใช้ Supabase Auth
3. ถ้าไม่มี `user_id` → ใช้ simple password check

### Registration Process:
1. ตรวจสอบ username ซ้ำใน `units` table
2. สร้าง Supabase Auth user
3. อัปเดต `units` table ด้วย `username` และ `user_id`

---

## 🧪 ทดสอบ:

1. **รัน SQL Script** เพื่อเพิ่ม `username` column
2. **ตั้งค่า username** สำหรับห้องชุดที่มีอยู่
3. **ทดสอบ login** ด้วย username
4. **ทดสอบ registration** ด้วย username ใหม่

**ระบบใหม่นี้ง่ายและใช้งานได้ทันที!** 🚀



















