# Debug User Permissions - คู่มือตรวจสอบ

## ปัญหา: เมนูไม่แสดงตามกลุ่มที่กำหนด

### ขั้นตอนการ Debug:

#### 1. ตรวจสอบว่า User อยู่ในกลุ่มหรือยัง

```sql
-- ดู user AAA อยู่ในกลุ่มไหนบ้าง
SELECT 
  u.email,
  u.full_name,
  ug.name as group_name,
  ug.display_name,
  ugm.project_id,
  p.name as project_name,
  ugm.is_active
FROM user_group_members ugm
JOIN users u ON ugm.user_id = u.id
JOIN user_groups ug ON ugm.user_group_id = ug.id
LEFT JOIN projects p ON ugm.project_id = p.id
WHERE u.email = 'AAA@email.com'  -- เปลี่ยนเป็น email ของ user AAA
ORDER BY ug.name;
```

**ควรจะเห็น**: user AAA อยู่ในกลุ่ม "Admin ALL" และมี project_id

#### 2. ตรวจสอบ Permissions ของกลุ่ม

```sql
-- ดู permissions ของกลุ่ม "Admin ALL"
SELECT 
  ug.name as group_name,
  ug.display_name,
  ugp.module,
  ugp.can_access,
  ugp.can_view,
  ugp.can_add,
  ugp.can_edit
FROM user_group_permissions ugp
JOIN user_groups ug ON ugp.user_group_id = ug.id
WHERE ug.name LIKE '%Admin%' OR ug.display_name LIKE '%Admin%'
ORDER BY ugp.module;
```

**ควรจะเห็น**: permissions หลายๆ โมดูล มี `can_access = true` และ `can_view = true`

#### 3. ตรวจสอบ User ID

```sql
-- หา user ID ของ AAA
SELECT id, email, full_name, role
FROM users
WHERE email LIKE '%AAA%' OR full_name LIKE '%AAA%';
```

**ID ที่เห็นจาก log**: `386ac5d5-d486-41ee-875f-5e543f2e6efa`

#### 4. ตรวจสอบ Permissions ทั้งหมดของ User นี้

```sql
-- ดู permissions ทั้งหมดที่ user นี้ควรได้รับ
SELECT 
  ugp.module,
  ugp.can_access,
  ugp.can_view,
  ug.name as group_name,
  ugm.project_id
FROM user_group_members ugm
JOIN user_groups ug ON ugm.user_group_id = ug.id
JOIN user_group_permissions ugp ON ug.id = ugp.user_group_id
WHERE ugm.user_id = '386ac5d5-d486-41ee-875f-5e543f2e6efa'
  AND ugm.is_active = true
ORDER BY ugp.module;
```

---

## สาเหตุที่เป็นไปได้:

### 1. ⚠️ User ยังไม่ได้เลือกโครงการ
**อาการ**: `project: null` ใน console log

**วิธีแก้**: 
- Login แล้วต้องเลือกโครงการก่อน (ถ้าไม่ใช่ Super Admin)
- Project Selector ควรแสดงขึ้นหลัง login

### 2. ⚠️ User ไม่ได้อยู่ในกลุ่มของโครงการที่เลือก
**อาการ**: เลือกโครงการ A แต่ user อยู่ในกลุ่มของโครงการ B

**วิธีแก้**:
- ไปหน้า User Groups
- เพิ่ม user AAA เข้ากลุ่ม "Admin ALL" ของโครงการที่ต้องการ
- หรือสร้างกลุ่มใหม่สำหรับโครงการนั้น

### 3. ⚠️ Permissions ยังไม่ได้ตั้งค่า
**อาการ**: มีการเพิ่ม user เข้ากลุ่ม แต่ยังไม่ได้กำหนด permissions

**วิธีแก้**:
- ไปหน้า User Groups
- คลิกปุ่ม "กำหนดสิทธิ์" ของกลุ่ม "Admin ALL"
- เลือกโมดูลทั้งหมดที่ต้องการ
- เปิด "เข้าถึง" และ "ดู" สำหรับทุกโมดูล
- บันทึก

### 4. ⚠️ `project_id` ใน `user_group_members` เป็น NULL
**อาการ**: ข้อมูลใน database ไม่สมบูรณ์

**วิธีแก้**:
```sql
-- อัปเดต project_id ให้กับ members ที่ยังเป็น NULL
UPDATE user_group_members ugm
SET project_id = ug.project_id
FROM user_groups ug
WHERE ugm.user_group_id = ug.id
  AND ugm.project_id IS NULL;
```

---

## วิธีตรวจสอบใน Browser:

### 1. เปิด Console (F12)

ควรเห็น logs แบบนี้:
```
[ProtectedSidebar] Loading permissions for user: 386ac5d5-... project: <project_id>
[ProtectedSidebar] Skipping group permissions: {...} หรือ
[ProtectedSidebar] User group permissions loaded: X modules
[ProtectedSidebar] Added module from group: companies
[ProtectedSidebar] Added module from group: projects
...
[ProtectedSidebar] Merged modules: { roleModules: X, groupModules: Y, total: Z }
[ProtectedSidebar] Final visible modules: XX [array of module names]
```

### 2. ถ้าเห็น "Skipping group permissions"
ดูที่ object ว่าอันไหนเป็น `false`:
- `hasUserId`: ต้องเป็น `true`
- `isNotGuest`: ต้องเป็น `true`
- `isNotSuperAdmin`: ต้องเป็น `true` (ถ้าไม่ใช่ Super Admin)
- `hasProject`: ต้องเป็น `true` ← **สำคัญ!**

ถ้า `hasProject: false` → **ต้องเลือกโครงการก่อน**

### 3. ถ้าเห็น "User group permissions loaded: 0 modules"
หมายความว่า:
- User ไม่ได้อยู่ในกลุ่มใดๆ ของโครงการนี้ หรือ
- กลุ่มที่ user อยู่ยังไม่ได้ตั้ง permissions

→ ต้องไปหน้า User Groups เพิ่ม user และตั้ง permissions

---

## วิธีแก้ปัญหาแบบครบวงจร:

### ขั้นตอนที่ 1: ตรวจสอบ User ID
1. Login ด้วย user AAA
2. เปิด Console
3. ดู log แรกที่ขึ้น: `Loading permissions for user: <user_id>`
4. Copy user_id นี้

### ขั้นตอนที่ 2: ตรวจสอบใน Database
รัน query:
```sql
SELECT 
  u.id,
  u.email,
  u.full_name,
  u.role,
  ugm.user_group_id,
  ug.name as group_name,
  ugm.project_id,
  p.name as project_name,
  COUNT(ugp.id) as permission_count
FROM users u
LEFT JOIN user_group_members ugm ON u.id = ugm.user_id
LEFT JOIN user_groups ug ON ugm.user_group_id = ug.id
LEFT JOIN projects p ON ugm.project_id = p.id
LEFT JOIN user_group_permissions ugp ON ug.id = ugp.user_group_id
WHERE u.id = '<paste user_id here>'
GROUP BY u.id, u.email, u.full_name, u.role, ugm.user_group_id, ug.name, ugm.project_id, p.name;
```

### ขั้นตอนที่ 3: แก้ไขตามผลที่ได้

#### ถ้าไม่มีข้อมูล (user ไม่อยู่ในกลุ่ม):
1. ไปหน้า User Groups
2. เลือกโครงการที่ต้องการ
3. เลือกกลุ่ม "Admin ALL"
4. คลิก "จัดการสมาชิก"
5. เพิ่ม user AAA
6. บันทึก

#### ถ้ามีข้อมูลแต่ `permission_count = 0`:
1. ไปหน้า User Groups
2. เลือกกลุ่ม "Admin ALL"
3. คลิก "กำหนดสิทธิ์"
4. เลือกโมดูลทั้งหมด
5. เปิด checkbox "เข้าถึง" และ "ดู"
6. บันทึก

#### ถ้ามีข้อมูลและ permissions แต่ `project_id = NULL`:
```sql
-- แก้ไข project_id
UPDATE user_group_members
SET project_id = (
  SELECT project_id 
  FROM user_groups 
  WHERE id = user_group_members.user_group_id
)
WHERE user_id = '<user_id>'
  AND project_id IS NULL;
```

### ขั้นตอนที่ 4: ทดสอบใหม่
1. Logout
2. Login ด้วย user AAA อีกครั้ง
3. เลือกโครงการ
4. ดู Console logs
5. **ควรเห็นเมนูที่กำหนดไว้แล้ว!**

---

## Quick Fix: ถ้าเร่งด่วนมาก

ถ้าต้องการให้ user AAA เห็นเมนูทั้งหมดเลย **ชั่วคราว**:

1. ไปที่ User Management
2. เปลี่ยน Role ของ user AAA เป็น **Super Admin**
3. Save
4. Login ใหม่
5. จะเห็นเมนูทั้งหมด

แต่วิธีนี้ไม่แนะนำสำหรับ production เพราะ Super Admin มีสิทธิ์เต็ม!

---

## สรุป

เมนูจะแสดงเมื่อ:
1. ✅ User มี role ที่เหมาะสม (ไม่ใช่ guest/resident)
2. ✅ User เลือกโครงการแล้ว (สำคัญ!)
3. ✅ User อยู่ในกลุ่มของโครงการนั้น
4. ✅ กลุ่มมี permissions ที่ตั้งค่าไว้
5. ✅ Permissions มี `can_access = true` หรือ `can_view = true`

ลองตรวจสอบตามลำดับนี้นะครับ! 🔍

