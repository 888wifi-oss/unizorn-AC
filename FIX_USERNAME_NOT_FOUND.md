# 🔧 แก้ไขปัญหา Username ไม่พบในระบบ

## ปัญหาที่พบ
```
Username: sm001
Error: ไม่พบชื่อผู้ใช้นี้ในระบบ
```

## สาเหตุ
- บัญชี `sm001` สร้างแล้วใน Supabase Auth
- แต่ยังไม่ได้สร้าง username mapping ในตาราง `username_mapping`

## วิธีแก้ไข

### ขั้นตอนที่ 1: หาข้อมูลบัญชี
```sql
-- หาข้อมูล unit และ auth user สำหรับ sm001
SELECT 
  u.id as unit_id,
  u.unit_number,
  u.user_id as auth_user_id,
  u.owner_email
FROM units u
WHERE u.unit_number = 'sm001' OR u.owner_email LIKE '%sm001%';
```

### ขั้นตอนที่ 2: สร้าง Username Mapping
```sql
-- สร้าง mapping สำหรับ sm001 (แทนที่ค่าจริง)
INSERT INTO username_mapping (username, auth_user_id, unit_id)
VALUES ('sm001', 'actual-auth-user-id', 'actual-unit-id');
```

### ขั้นตอนที่ 3: ทดสอบ Login
1. ไปที่หน้า login
2. กรอก username: `sm001`
3. กรอก password: `12345678`
4. กดเข้าสู่ระบบ

## ตัวอย่างการใช้งาน

### หาข้อมูลบัญชี:
```sql
-- วิธีที่ 1: หาจาก unit_number
SELECT 
  u.id as unit_id,
  u.unit_number,
  u.user_id as auth_user_id
FROM units u
WHERE u.unit_number = 'sm001';

-- วิธีที่ 2: หาจาก auth.users
SELECT 
  au.id as auth_user_id,
  au.email,
  au.user_metadata
FROM auth.users au
WHERE au.user_metadata->>'username' = 'sm001'
   OR au.email LIKE '%sm001%';
```

### สร้าง Mapping:
```sql
-- แทนที่ค่าจริงจากผลลัพธ์ข้างต้น
INSERT INTO username_mapping (username, auth_user_id, unit_id)
VALUES ('sm001', '090dded3-d5c2-47f0-b5e4-d56d95ba3a43', 'cffcb8be-1625-4d0f-aecc-8f9449dce8bc');
```

## การทำงานของระบบ

### เดิม (ไม่ทำงาน):
```
Username: sm001
→ เช็ค username_mapping
→ ไม่พบ
→ Error: ไม่พบชื่อผู้ใช้นี้ในระบบ
```

### หลังแก้ไข (จะทำงาน):
```
Username: sm001
→ เช็ค username_mapping
→ พบ mapping
→ ดึง auth_user_id
→ ใช้ Supabase Auth
→ Login สำเร็จ
```

## Troubleshooting

### ถ้ายังไม่พบ username:
1. **ตรวจสอบตาราง username_mapping:**
   ```sql
   SELECT * FROM username_mapping WHERE username = 'sm001';
   ```

2. **ตรวจสอบตาราง units:**
   ```sql
   SELECT * FROM units WHERE unit_number = 'sm001';
   ```

3. **ตรวจสอบตาราง auth.users:**
   ```sql
   SELECT * FROM auth.users WHERE email LIKE '%sm001%';
   ```

### ถ้า mapping ซ้ำ:
```sql
-- ลบ mapping เก่า
DELETE FROM username_mapping WHERE username = 'sm001';

-- สร้างใหม่
INSERT INTO username_mapping (username, auth_user_id, unit_id)
VALUES ('sm001', 'auth-user-id', 'unit-id');
```

## สรุป

**ปัญหาหลัก:** ยังไม่ได้สร้าง username mapping สำหรับบัญชีเก่า

**วิธีแก้:**
1. หาข้อมูล unit และ auth user
2. สร้าง username mapping
3. ทดสอบ login

**สำหรับบัญชีใหม่:** จะสร้าง mapping อัตโนมัติ



















