# 🔧 SQL Script สำหรับแก้ไขปัญหา Username ไม่พบ

## ขั้นตอนที่ 1: หาข้อมูลบัญชี sm001

```sql
-- หาข้อมูล unit และ auth user สำหรับ sm001
SELECT 
  u.id as unit_id,
  u.unit_number,
  u.user_id as auth_user_id,
  u.owner_email
FROM units u
WHERE u.unit_number = 'sm001' 
   OR u.owner_email LIKE '%sm001%'
   OR u.owner_name LIKE '%sm001%';
```

## ขั้นตอนที่ 2: หาข้อมูลจาก auth.users

```sql
-- หาจาก auth.users table
SELECT 
  au.id as auth_user_id,
  au.email,
  au.user_metadata
FROM auth.users au
WHERE au.user_metadata->>'username' = 'sm001'
   OR au.email LIKE '%sm001%'
   OR au.email LIKE '%sm001@%';
```

## ขั้นตอนที่ 3: สร้าง Username Mapping

```sql
-- สร้าง mapping สำหรับ sm001
-- แทนที่ค่าจริงจากผลลัพธ์ข้างต้น
INSERT INTO username_mapping (username, auth_user_id, unit_id)
VALUES ('sm001', 'actual-auth-user-id', 'actual-unit-id');
```

## ขั้นตอนที่ 4: ตรวจสอบ Mapping

```sql
-- ตรวจสอบว่า mapping สร้างแล้ว
SELECT * FROM username_mapping WHERE username = 'sm001';
```

## ตัวอย่างการใช้งาน

### ถ้าพบข้อมูล unit:
```sql
-- ผลลัพธ์จากขั้นตอนที่ 1
-- unit_id: cffcb8be-1625-4d0f-aecc-8f9449dce8bc
-- auth_user_id: 090dded3-d5c2-47f0-b5e4-d56d95ba3a43

-- สร้าง mapping
INSERT INTO username_mapping (username, auth_user_id, unit_id)
VALUES ('sm001', '090dded3-d5c2-47f0-b5e4-d56d95ba3a43', 'cffcb8be-1625-4d0f-aecc-8f9449dce8bc');
```

### ถ้าไม่พบข้อมูล unit:
```sql
-- หาจาก auth.users
SELECT 
  au.id as auth_user_id,
  au.email
FROM auth.users au
WHERE au.email LIKE '%sm001%';

-- หา unit ที่เกี่ยวข้อง
SELECT 
  u.id as unit_id,
  u.unit_number,
  u.owner_email
FROM units u
WHERE u.user_id = 'auth-user-id-from-above';
```

## Troubleshooting

### ถ้า mapping ซ้ำ:
```sql
-- ลบ mapping เก่า
DELETE FROM username_mapping WHERE username = 'sm001';

-- สร้างใหม่
INSERT INTO username_mapping (username, auth_user_id, unit_id)
VALUES ('sm001', 'auth-user-id', 'unit-id');
```

### ถ้าไม่พบข้อมูลเลย:
```sql
-- ตรวจสอบว่ามีบัญชี sm001 หรือไม่
SELECT * FROM auth.users WHERE email LIKE '%sm001%';
SELECT * FROM units WHERE unit_number LIKE '%sm001%';
```

## สรุป

**ปัญหาหลัก:** ยังไม่ได้สร้าง username mapping สำหรับบัญชีเก่า

**วิธีแก้:**
1. หาข้อมูล unit และ auth user ด้วย SQL
2. สร้าง username mapping ด้วย INSERT
3. ทดสอบ login

**สำหรับบัญชีใหม่:** จะสร้าง mapping อัตโนมัติ
