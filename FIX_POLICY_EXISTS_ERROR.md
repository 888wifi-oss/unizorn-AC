# แก้ไข Error: policy already exists

## ปัญหาที่พบ
```
ERROR: 42710: policy "Allow authenticated access to companies" for table "companies" already exists
```

## สาเหตุ
RLS policies ถูกสร้างไว้แล้วจากการรัน script ครั้งก่อน และ SQL script พยายามสร้าง policies ซ้ำ

## วิธีแก้ไข

### **วิธีที่ 1: ใช้ Script ที่แก้ไขแล้ว (แนะนำ)** ⭐

Script ได้ถูกอัปเดตให้ **DROP policies เก่าก่อนสร้างใหม่** แล้ว

```sql
-- รัน script นี้อีกครั้ง
-- scripts/013_multi_tenancy_permissions.sql
```

Script จะ:
- ✅ DROP policies เก่าก่อน (ถ้ามี)
- ✅ สร้าง policies ใหม่
- ✅ ไม่เกิด error แม้รันซ้ำ

### **วิธีที่ 2: ลบ Policies เก่าด้วยตัวเอง**

```sql
-- ลบ policies เก่าทั้งหมด
DROP POLICY IF EXISTS "Allow authenticated access to companies" ON public.companies;
DROP POLICY IF EXISTS "Allow authenticated access to projects" ON public.projects;
DROP POLICY IF EXISTS "Allow authenticated access to roles" ON public.roles;
DROP POLICY IF EXISTS "Allow authenticated access to permissions" ON public.permissions;
DROP POLICY IF EXISTS "Allow authenticated access to role_permissions" ON public.role_permissions;
DROP POLICY IF EXISTS "Allow authenticated access to users" ON public.users;
DROP POLICY IF EXISTS "Allow authenticated access to user_roles" ON public.user_roles;
DROP POLICY IF EXISTS "Allow authenticated access to audit_logs" ON public.audit_logs;

-- จากนั้นรัน script ใหม่
-- scripts/013_multi_tenancy_permissions.sql
```

### **วิธีที่ 3: ลบและสร้างตารางใหม่ (ระวัง: จะลบข้อมูลทั้งหมด)**

```sql
-- ⚠️ WARNING: จะลบข้อมูลทั้งหมดในตารางเหล่านี้!
DROP TABLE IF EXISTS public.audit_logs CASCADE;
DROP TABLE IF EXISTS public.user_roles CASCADE;
DROP TABLE IF EXISTS public.role_permissions CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;
DROP TABLE IF EXISTS public.permissions CASCADE;
DROP TABLE IF EXISTS public.roles CASCADE;
DROP TABLE IF EXISTS public.projects CASCADE;
DROP TABLE IF EXISTS public.companies CASCADE;

-- จากนั้นรัน script ใหม่
-- scripts/013_multi_tenancy_permissions.sql
```

## การตรวจสอบ

### **ตรวจสอบ Policies ที่มีอยู่**
```sql
-- ดู policies ทั้งหมด
SELECT 
  schemaname,
  tablename,
  policyname
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('companies', 'projects', 'users', 'roles')
ORDER BY tablename, policyname;
```

### **ตรวจสอบการติดตั้ง**
```sql
-- ตรวจสอบ tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('companies', 'projects', 'users', 'roles')
ORDER BY table_name;

-- ตรวจสอบ mock users
SELECT id, email, full_name FROM users;

-- ตรวจสอบ demo data
SELECT * FROM companies;
SELECT * FROM projects;
```

## ผลลัพธ์ที่คาดหวัง

### **หลังรัน Script สำเร็จ:**

#### **1. Tables Created**
```
companies
projects
roles
permissions
role_permissions
users
user_roles
audit_logs
```

#### **2. Mock Users Created**
```
ID: 00000000-0000-0000-0000-000000000001
Email: superadmin@unizorn.com
Role: Super Admin

ID: 00000000-0000-0000-0000-000000000002
Email: company@example.com
Role: Company Admin (Demo Company)

ID: 00000000-0000-0000-0000-000000000003
Email: project@example.com
Role: Project Admin (Demo Project)

ID: 00000000-0000-0000-0000-000000000004
Email: staff@example.com
Role: Staff (Demo Project)
```

#### **3. Demo Data Created**
```
Company: Demo Company (ID: 00000000-0000-0000-0000-000000000010)
Project: Demo Project (ID: 00000000-0000-0000-0000-000000000020)
```

#### **4. NOTICE Messages**
```
NOTICE: Units table indexes created
NOTICE: Mock users and demo data created
NOTICE: =================================
NOTICE: Multi-tenancy Permission System installed successfully!
NOTICE: =================================
NOTICE: Roles created: Super Admin, Company Admin, Project Admin, Staff, Engineer, Resident
NOTICE: Permissions assigned to roles
NOTICE: Mock users created for development:
NOTICE:   - superadmin@unizorn.com (Super Admin)
NOTICE:   - company@example.com (Company Admin)
NOTICE:   - project@example.com (Project Admin)
NOTICE:   - staff@example.com (Staff)
NOTICE: Demo Company and Project created
```

## Troubleshooting

### **ปัญหา: ยังเจอ error policy exists**
```sql
-- ดู policies ที่มี
SELECT policyname, tablename 
FROM pg_policies 
WHERE tablename = 'companies';

-- ลบ policy ที่ชนกัน
DROP POLICY "Allow authenticated access to companies" ON public.companies;

-- รัน script อีกครั้ง
```

### **ปัญหา: Table already exists**
```sql
-- ตรวจสอบว่าตารางมีข้อมูลสำคัญหรือไม่
SELECT COUNT(*) FROM companies;
SELECT COUNT(*) FROM projects;
SELECT COUNT(*) FROM users;

-- ถ้าไม่มีข้อมูลสำคัญ สามารถ drop และสร้างใหม่
DROP TABLE IF EXISTS public.companies CASCADE;
-- จากนั้นรัน script ใหม่
```

### **ปัญหา: Foreign key constraint**
```sql
-- ลบตารางตามลำดับ (cascade)
DROP TABLE IF EXISTS public.audit_logs CASCADE;
DROP TABLE IF EXISTS public.user_roles CASCADE;
DROP TABLE IF EXISTS public.role_permissions CASCADE;
DROP TABLE IF EXISTS public.projects CASCADE;
DROP TABLE IF EXISTS public.companies CASCADE;
DROP TABLE IF EXISTS public.permissions CASCADE;
DROP TABLE IF EXISTS public.roles CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;
```

## Best Practices

### **1. การรัน Migration Scripts**
- ✅ Backup ฐานข้อมูลก่อนรัน script
- ✅ ทดสอบใน development ก่อน
- ✅ ใช้ `IF NOT EXISTS` และ `IF EXISTS`
- ✅ ใช้ `DROP ... IF EXISTS` ก่อนสร้าง

### **2. การจัดการ Policies**
- ✅ DROP policies เก่าก่อนสร้างใหม่
- ✅ ตั้งชื่อ policies ให้ชัดเจน
- ✅ Document policies ใน comments

### **3. การทดสอบ**
- ✅ ตรวจสอบ tables ที่สร้าง
- ✅ ตรวจสอบ indexes
- ✅ ตรวจสอบ policies
- ✅ ทดสอบ permissions

## Quick Fix

หากต้องการรัน script ใหม่อย่างรวดเร็ว:

```sql
-- 1. ลบ policies เก่าทั้งหมด
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN (
    SELECT policyname, tablename
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN ('companies', 'projects', 'users', 'roles', 'permissions', 'role_permissions', 'user_roles', 'audit_logs')
  ) LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', r.policyname, r.tablename);
  END LOOP;
END $$;

-- 2. รัน script ใหม่
-- scripts/013_multi_tenancy_permissions.sql
```

## สรุป

✅ **Script ถูกแก้ไขแล้ว** - เพิ่ม `DROP POLICY IF EXISTS`  
✅ **รันซ้ำได้** - ไม่เกิด error แม้รันหลายครั้ง  
✅ **Idempotent** - รันกี่ครั้งก็ได้ผลเหมือนกัน  

ตอนนี้ลองรัน **scripts/013_multi_tenancy_permissions.sql** อีกครั้งครับ! ✨
