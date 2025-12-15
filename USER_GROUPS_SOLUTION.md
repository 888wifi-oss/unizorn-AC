# 🔧 แก้ไขปัญหา User Groups - Project Scoping

## 🎯 ปัญหาที่พบ

จาก SQL Query ที่รัน:
```sql
SELECT u.email, u.full_name, ug.name as group_name, ugm.project_id, p.name as project_name
FROM user_group_members ugm
JOIN users u ON ugm.user_id = u.id  
JOIN user_groups ug ON ugm.user_group_id = ug.id
LEFT JOIN projects p ON ugm.project_id = p.id
WHERE u.id = '386ac5d5-d486-41ee-875f-5e543f2e6efa';
```

**ผลลัพธ์:**
- User `aaa2@email.com` อยู่ใน 2 กลุ่ม:
  - กลุ่ม `accountant` ในโครงการ `ABCD` 
  - กลุ่ม `admin_all` ในโครงการ `APSH`

**ปัญหา:**
- เมื่อเลือกโครงการ `ABCD` → เห็นเฉพาะ permissions ของกลุ่ม `accountant`
- เมื่อเลือกโครงการ `APSH` → เห็นเฉพาะ permissions ของกลุ่ม `admin_all`
- **ไม่สามารถเห็นเมนูครบตามที่ต้องการ**

---

## 💡 แนวทางการแก้ไข

### แนวทางที่ 1: Global Groups (แนะนำ) 🌟

**เปลี่ยนจาก Project-Scoped เป็น Global Groups**

#### โครงสร้างใหม่:
```sql
-- user_groups (ไม่มี project_id)
CREATE TABLE user_groups (
  id UUID PRIMARY KEY,
  name VARCHAR(50),
  display_name VARCHAR(100),
  -- ไม่มี project_id
);

-- user_group_permissions (มี project_id)
CREATE TABLE user_group_permissions (
  id UUID PRIMARY KEY,
  user_group_id UUID REFERENCES user_groups(id),
  project_id UUID REFERENCES projects(id), -- ย้ายมาที่นี่
  module VARCHAR(50),
  can_access BOOLEAN,
  can_view BOOLEAN,
  -- ... other permissions
  UNIQUE(user_group_id, project_id, module)
);

-- user_group_members (ไม่มี project_id)
CREATE TABLE user_group_members (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  user_group_id UUID REFERENCES user_groups(id),
  -- ไม่มี project_id
  UNIQUE(user_id, user_group_id)
);
```

#### ข้อดี:
- ✅ User อยู่ในกลุ่มเดียว แต่มี permissions หลายโครงการ
- ✅ จัดการง่ายกว่า
- ✅ เหมาะกับระบบที่มีหลายโครงการ
- ✅ ไม่ซับซ้อนเกินไป

#### ข้อเสีย:
- ⚠️ ต้อง migrate ข้อมูลเดิม

---

### แนวทางที่ 2: Multi-Project Groups (ซับซ้อน)

**ให้กลุ่มหนึ่งสามารถมี permissions หลายโครงการ**

#### โครงสร้าง:
```sql
-- เพิ่มตารางใหม่
CREATE TABLE user_group_project_permissions (
  id UUID PRIMARY KEY,
  user_group_id UUID REFERENCES user_groups(id),
  project_id UUID REFERENCES projects(id),
  module VARCHAR(50),
  can_access BOOLEAN,
  -- ... other permissions
  UNIQUE(user_group_id, project_id, module)
);
```

#### ข้อดี:
- ✅ ยืดหยุ่นสูง
- ✅ สามารถกำหนด permissions แยกตามโครงการ

#### ข้อเสีย:
- ❌ ซับซ้อนมาก
- ❌ UI ยากต่อการใช้งาน
- ❌ ต้องแก้ไขโค้ดเยอะ

---

### แนวทางที่ 3: Project Inheritance (สมดุล) ⚖️

**ให้กลุ่มมี "Default Permissions" และสามารถ Override ตามโครงการ**

#### โครงสร้าง:
```sql
-- Default permissions (ไม่มี project_id)
CREATE TABLE user_group_permissions (
  user_group_id UUID,
  module VARCHAR(50),
  can_access BOOLEAN,
  -- ... default permissions
  UNIQUE(user_group_id, module)
);

-- Project overrides
CREATE TABLE user_group_project_overrides (
  user_group_id UUID,
  project_id UUID,
  module VARCHAR(50),
  can_access BOOLEAN,
  -- ... override permissions
  UNIQUE(user_group_id, project_id, module)
);
```

#### ข้อดี:
- ✅ มี default permissions
- ✅ สามารถ customize ตามโครงการได้
- ✅ ไม่ซับซ้อนเกินไป

#### ข้อเสีย:
- ⚠️ ต้องจัดการ 2 ตาราง
- ⚠️ Logic ซับซ้อนขึ้น

---

## 🚀 แนะนำ: แนวทางที่ 1 (Global Groups)

### Migration Script

สร้างไฟล์ `scripts/020_convert_to_global_groups.sql` แล้ว:

```sql
-- Step 1: Backup existing data
CREATE TABLE user_group_members_backup AS SELECT * FROM user_group_members;
CREATE TABLE user_group_permissions_backup AS SELECT * FROM user_group_permissions;

-- Step 2: Add project_id to user_group_permissions
ALTER TABLE user_group_permissions ADD COLUMN project_id UUID REFERENCES projects(id);

-- Step 3: Migrate data
INSERT INTO user_group_permissions (user_group_id, project_id, module, can_access, ...)
SELECT ugp.user_group_id, ug.project_id, ugp.module, ugp.can_access, ...
FROM user_group_permissions_backup ugp
JOIN user_groups ug ON ugp.user_group_id = ug.id
WHERE ug.project_id IS NOT NULL;

-- Step 4: Remove old columns
ALTER TABLE user_groups DROP COLUMN project_id;
ALTER TABLE user_group_members DROP COLUMN project_id;

-- Step 5: Update constraints and policies
-- ... (ดูในไฟล์เต็ม)
```

### การใช้งานหลัง Migration

#### 1. สร้างกลุ่ม Global:
```sql
INSERT INTO user_groups (name, display_name) VALUES 
('admin_all', 'Admin ALL'),
('accountant', 'เจ้าหน้าที่บัญชี'),
('staff', 'เจ้าหน้าที่ทั่วไป');
```

#### 2. เพิ่มสมาชิกกลุ่ม:
```sql
INSERT INTO user_group_members (user_id, user_group_id) VALUES 
('386ac5d5-d486-41ee-875f-5e543f2e6efa', 'group_admin_all_id'),
('386ac5d5-d486-41ee-875f-5e543f2e6efa', 'group_accountant_id');
```

#### 3. กำหนด Permissions ตามโครงการ:
```sql
-- Permissions สำหรับโครงการ ABCD
INSERT INTO user_group_permissions (user_group_id, project_id, module, can_access, can_view) VALUES 
('group_admin_all_id', 'abcd_project_id', 'companies', true, true),
('group_admin_all_id', 'abcd_project_id', 'projects', true, true),
-- ... other modules

-- Permissions สำหรับโครงการ APSH  
INSERT INTO user_group_permissions (user_group_id, project_id, module, can_access, can_view) VALUES 
('group_admin_all_id', 'apsh_project_id', 'companies', true, true),
('group_admin_all_id', 'apsh_project_id', 'projects', true, true),
-- ... other modules
```

---

## 🎯 ผลลัพธ์ที่คาดหวัง

### ก่อนแก้ไข:
- User AAA เลือกโครงการ ABCD → เห็นเฉพาะเมนูของกลุ่ม `accountant`
- User AAA เลือกโครงการ APSH → เห็นเฉพาะเมนูของกลุ่ม `admin_all`

### หลังแก้ไข:
- User AAA เลือกโครงการ ABCD → เห็นเมนูของทั้ง 2 กลุ่ม (`accountant` + `admin_all`)
- User AAA เลือกโครงการ APSH → เห็นเมนูของทั้ง 2 กลุ่ม (`accountant` + `admin_all`)

---

## 📋 ขั้นตอนการดำเนินการ

### Phase 1: Migration (1-2 ชั่วโมง)
1. ✅ Backup ข้อมูลเดิม
2. ✅ รัน migration script
3. ✅ ทดสอบโครงสร้างใหม่
4. ✅ อัปเดต server actions

### Phase 2: UI Updates (2-3 ชั่วโมง)
1. 🔄 อัปเดต User Groups page
2. 🔄 อัปเดต Permission Matrix
3. 🔄 อัปเดต Member Management
4. 🔄 ทดสอบ UI

### Phase 3: Testing (1 ชั่วโมง)
1. 🔄 ทดสอบ login/logout
2. 🔄 ทดสอบการเปลี่ยนโครงการ
3. 🔄 ทดสอบการแสดงเมนู
4. 🔄 ทดสอบ permissions

---

## ⚠️ ข้อควรระวัง

### 1. Backup ข้อมูล
```sql
-- สำคัญ! รันก่อน migration
CREATE TABLE user_group_members_backup AS SELECT * FROM user_group_members;
CREATE TABLE user_group_permissions_backup AS SELECT * FROM user_group_permissions;
```

### 2. ทดสอบใน Development ก่อน
- อย่ารัน migration ใน production ทันที
- ทดสอบใน development environment ก่อน

### 3. Rollback Plan
```sql
-- ถ้าต้องการ rollback
DROP TABLE user_group_permissions;
CREATE TABLE user_group_permissions AS SELECT * FROM user_group_permissions_backup;
ALTER TABLE user_groups ADD COLUMN project_id UUID REFERENCES projects(id);
ALTER TABLE user_group_members ADD COLUMN project_id UUID REFERENCES projects(id);
-- ... restore data
```

---

## 🎉 สรุป

**แนวทางที่ 1 (Global Groups) เป็นทางเลือกที่ดีที่สุด** เพราะ:

1. ✅ **แก้ปัญหาได้ตรงจุด** - User อยู่ในกลุ่มเดียว แต่มี permissions หลายโครงการ
2. ✅ **ใช้งานง่าย** - ไม่ซับซ้อนเกินไป
3. ✅ **ยืดหยุ่น** - สามารถเพิ่ม/ลด permissions ตามโครงการได้
4. ✅ **เหมาะกับระบบ** - เหมาะกับระบบที่มีหลายโครงการ

**พร้อมรัน migration หรือไม่?** 🚀





















