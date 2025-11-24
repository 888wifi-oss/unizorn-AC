# Multi-tenancy Permission System - Complete Guide

## 🎉 ระบบพร้อมใช้งานแล้ว!

### ✅ **สิ่งที่พัฒนาเสร็จทั้งหมด:**

#### **1. Database Schema** ✅
- ✅ `companies` - จัดการบริษัท
- ✅ `projects` - จัดการโครงการ (1 Company → หลาย Projects)
- ✅ `roles` - 6 roles พื้นฐาน
- ✅ `permissions` - 40+ permissions
- ✅ `role_permissions` - mapping roles กับ permissions
- ✅ `users` - ผู้ใช้งาน (enhanced)
- ✅ `user_roles` - mapping users กับ roles (multi-tenancy)
- ✅ `audit_logs` - บันทึกการทำงาน
- ✅ Indexes และ RLS policies

#### **2. Roles & Permissions** ✅
| Role | Level | Permissions |
|------|-------|-------------|
| **Super Admin** | 0 | ทุกอย่าง (60+ permissions) |
| **Company Admin** | 1 | จัดการบริษัท, โครงการ, ผู้ใช้ |
| **Project Admin** | 2 | จัดการโครงการ, ยูนิต, บัญชี, พัสดุ |
| **Staff** | 3 | บันทึกข้อมูลทั่วไป |
| **Engineer** | 3 | งานซ่อมบำรุง |
| **Resident** | 4 | ดูข้อมูล, แจ้งซ่อม |

#### **3. Server Actions** ✅
**Companies:**
- `getCompanies()` - ดึงรายการบริษัท
- `createCompany()` - สร้างบริษัท
- `updateCompany()` - แก้ไขบริษัท
- `deleteCompany()` - ลบบริษัท
- `toggleCompanyStatus()` - เปิด/ปิดใช้งาน

**Projects:**
- `getProjects()` - ดึงรายการโครงการ
- `createProject()` - สร้างโครงการ
- `updateProject()` - แก้ไขโครงการ
- `deleteProject()` - ลบโครงการ

**Users & Roles:**
- `getUsers()` - ดึงรายการผู้ใช้
- `createUser()` - สร้างผู้ใช้
- `updateUser()` - แก้ไขผู้ใช้
- `assignRole()` - มอบหมาย Role
- `removeRole()` - ลบ Role
- `getUserRoles()` - ดู Roles ของผู้ใช้

#### **4. Permission Utilities** ✅
```typescript
// ตรวจสอบสิทธิ์
await checkPermission(userId, 'billing.delete')
await checkAnyPermission(userId, ['billing.update', 'billing.delete'])
await checkAllPermissions(userId, ['units.view', 'units.create'])

// ตรวจสอบ Role
await checkRole(userId, 'super_admin')
await checkMinRoleLevel(userId, RoleLevel.PROJECT_ADMIN)

// ตรวจสอบการเข้าถึง
await canAccessCompany(userId, companyId)
await canAccessProject(userId, projectId)
```

#### **5. React Context & Hooks** ✅
```typescript
// Wrap app
<PermissionProvider userId={userId} companyId={companyId} projectId={projectId}>
  {children}
</PermissionProvider>

// Use in components
const { hasPermission, hasRole, isSuperAdmin } = usePermissions()

// Conditional rendering
<Can permission="billing.create">
  <Button>Create Bill</Button>
</Can>

<HasRole role="super_admin">
  <AdminPanel />
</HasRole>
```

#### **6. Admin UI Pages** ✅
- ✅ **`/companies`** - จัดการบริษัท (Super Admin)
- ✅ **`/projects`** - จัดการโครงการ (Company Admin+)
- ✅ **`/user-management`** - จัดการผู้ใช้และ Roles

---

## 📁 **ไฟล์ทั้งหมดที่สร้าง:**

### **Database**
1. `scripts/013_multi_tenancy_permissions.sql` - Database schema

### **Types**
2. `lib/types/permissions.ts` - TypeScript types

### **Server Actions**
3. `lib/actions/company-actions.ts` - Company CRUD
4. `lib/actions/project-actions.ts` - Project CRUD
5. `lib/actions/user-role-actions.ts` - User & Role management

### **Permission System**
6. `lib/permissions/permission-checker.ts` - Permission utilities
7. `lib/contexts/permission-context.tsx` - React Context Provider

### **UI Pages**
8. `app/(admin)/companies/page.tsx` - Companies management
9. `app/(admin)/projects/page.tsx` - Projects management
10. `app/(admin)/user-management/page.tsx` - Users & Roles management

### **Components**
11. `components/sidebar.tsx` - Updated with System menu

### **Documentation**
12. `MULTI_TENANCY_PERMISSION_GUIDE.md` - คู่มือการใช้งาน

---

## 🚀 **วิธีเริ่มต้นใช้งาน:**

### **Step 1: ติดตั้ง Database**
```sql
-- รัน SQL script ใน Supabase SQL Editor
-- scripts/013_multi_tenancy_permissions.sql
```

### **Step 2: สร้างบริษัทแรก (Super Admin)**
1. ไปที่เมนู **"ระบบ (System)" → "จัดการบริษัท"**
2. กดปุ่ม **"เพิ่มบริษัท"**
3. กรอกข้อมูล:
   - ชื่อบริษัท: "ABC Property Management"
   - Slug: "abc-property"
   - แผนการใช้งาน: "Premium"
   - จำนวนโครงการสูงสุด: 10
4. กด **"สร้างบริษัท"**

### **Step 3: สร้างโครงการ (Company Admin)**
1. ไปที่เมนู **"ระบบ (System)" → "จัดการโครงการ"**
2. กดปุ่ม **"เพิ่มโครงการ"**
3. กรอกข้อมูล:
   - บริษัท: เลือกบริษัทที่สร้างไว้
   - ชื่อโครงการ: "Condo XYZ"
   - Slug: "condo-xyz"
   - จำนวนยูนิต: 100
   - จำนวนชั้น: 10
4. กด **"สร้างโครงการ"**

### **Step 4: สร้างผู้ใช้และมอบหมาย Role**
1. ไปที่เมนู **"ระบบ (System)" → "จัดการผู้ใช้และสิทธิ์"**
2. กดปุ่ม **"เพิ่มผู้ใช้"**
3. กรอกข้อมูล:
   - อีเมล: "admin@abc.com"
   - ชื่อ-นามสกุล: "John Admin"
4. กด **"สร้างผู้ใช้"**
5. กดปุ่ม **"มอบหมาย Role"** (UserPlus icon)
6. เลือก:
   - Role: "Company Admin"
   - บริษัท: เลือกบริษัท
7. กด **"มอบหมาย"**

---

## 🎯 **Workflow ตัวอย่าง:**

### **Scenario: บริษัทใหม่เริ่มใช้งาน**

#### **ขั้นตอนที่ 1: Super Admin สร้างบริษัท**
```
Super Admin → สร้างบริษัท "ABC Property"
           → กำหนดแผน: Premium (10 projects, 1000 units)
```

#### **ขั้นตอนที่ 2: Super Admin สร้าง Company Admin**
```
Super Admin → สร้างผู้ใช้: admin@abc.com
           → มอบหมาย Role: Company Admin (scope: ABC Property)
```

#### **ขั้นตอนที่ 3: Company Admin สร้างโครงการ**
```
Company Admin → สร้างโครงการ "Condo XYZ" ในบริษัท ABC
              → กำหนดข้อมูล: 100 units, 10 floors
```

#### **ขั้นตอนที่ 4: Company Admin สร้าง Project Admin**
```
Company Admin → สร้างผู้ใช้: manager@condoxyz.com
              → มอบหมาย Role: Project Admin (scope: Condo XYZ)
```

#### **ขั้นตอนที่ 5: Project Admin เพิ่มทีมงาน**
```
Project Admin → สร้าง Staff: staff@condoxyz.com
              → สร้าง Engineer: engineer@condoxyz.com
              → สร้าง Residents: resident101@email.com
```

---

## 🔐 **Permission Matrix (ละเอียด):**

### **Super Admin (Level 0)**
✅ **All Permissions** - เข้าถึงทุกอย่างในแพลตฟอร์ม

**สิทธิ์พิเศษ:**
- สร้าง/ลบบริษัท
- สร้าง/ลบโครงการ
- จัดการ Subscription และ Billing
- เข้าถึงข้อมูลทุกบริษัท/โครงการ
- ดู Audit logs ทั้งหมด

### **Company Admin (Level 1)**
✅ **Companies Module**: view, update
✅ **Projects Module**: view, create, update (ไม่มี delete)
✅ **Users Module**: view, create, update, delete
✅ **Reports Module**: view, export
✅ **Settings Module**: view, update

**ข้อจำกัด:**
- ไม่สามารถสร้าง/ลบบริษัทได้
- ไม่สามารถลบโครงการได้
- เข้าถึงเฉพาะบริษัทของตนเอง

### **Project Admin (Level 2)**
✅ **Projects Module**: view, update
✅ **Units Module**: view, create, update, delete
✅ **Billing Module**: view, create, update
✅ **Maintenance Module**: view, create, update, assign
✅ **Parcels Module**: view, create, update
✅ **Announcements Module**: view, create, update, delete
✅ **Users Module**: view, create (Staff/Engineer/Resident only)
✅ **Reports Module**: view, export

**ข้อจำกัด:**
- เข้าถึงเฉพาะโครงการของตนเอง
- ไม่สามารถลบบิลได้
- ไม่สามารถจัดการ Company Admin ได้

### **Staff (Level 3)**
✅ **Units Module**: view
✅ **Billing Module**: view, create, update
✅ **Maintenance Module**: view, create, update
✅ **Parcels Module**: view, create, update
✅ **Announcements Module**: view

**ข้อจำกัด:**
- ไม่สามารถลบข้อมูลได้
- ไม่สามารถจัดการผู้ใช้ได้
- เข้าถึงเฉพาะโครงการที่ได้รับมอบหมาย

### **Engineer (Level 3)**
✅ **Maintenance Module**: view, create, update, delete

**ข้อจำกัด:**
- เข้าถึงเฉพาะงานซ่อมที่ได้รับมอบหมาย
- ไม่สามารถเข้าถึงโมดูลอื่นได้

### **Resident (Level 4)**
✅ **Billing Module**: view (own bills only)
✅ **Maintenance Module**: view (own requests), create
✅ **Parcels Module**: view (own parcels)
✅ **Announcements Module**: view

**ข้อจำกัด:**
- เข้าถึงเฉพาะข้อมูลของตนเอง
- ไม่สามารถจัดการข้อมูลผู้อื่น

---

## 📊 **Use Cases:**

### **Use Case 1: Super Admin ตั้งค่าระบบใหม่**
```typescript
// 1. Create company
const company = await createCompany(superAdminId, {
  name: "ABC Property Management",
  slug: "abc-property",
  subscription_plan: "premium",
  max_projects: 10,
  max_units: 1000
})

// 2. Create company admin
const admin = await createUser(superAdminId, {
  email: "admin@abc.com",
  full_name: "John Admin"
})

// 3. Assign company admin role
await assignRole(superAdminId, admin.id, companyAdminRoleId, company.id)
```

### **Use Case 2: Company Admin สร้างโครงการและทีม**
```typescript
// 1. Create project
const project = await createProject(companyAdminId, {
  company_id: companyId,
  name: "Condo XYZ",
  slug: "condo-xyz",
  total_units: 100,
  total_floors: 10
})

// 2. Create project admin
const projectAdmin = await createUser(companyAdminId, {
  email: "manager@condoxyz.com",
  full_name: "Jane Manager"
})

// 3. Assign role
await assignRole(companyAdminId, projectAdmin.id, projectAdminRoleId, companyId, project.id)
```

### **Use Case 3: Project Admin ใช้งานประจำวัน**
```typescript
// Check permission before action
const canCreateBill = await checkPermission(projectAdminId, 'billing.create', companyId, projectId)

if (canCreateBill.allowed) {
  await createBill(billData)
}

// View only project data
const bills = await getBills(projectAdminId, projectId)
```

### **Use Case 4: Staff บันทึกพัสดุ**
```typescript
// Staff can register parcels
const canRegisterParcel = await checkPermission(staffId, 'parcels.create', companyId, projectId)

if (canRegisterParcel.allowed) {
  await registerParcel(parcelData)
}
```

### **Use Case 5: Resident ใช้งาน Portal**
```typescript
// Resident can view own data
const canViewBills = await checkPermission(residentId, 'billing.view', companyId, projectId)

if (canViewBills.allowed) {
  // Show only own bills (filtered by unit_id in backend)
  const bills = await getMyBills(residentId)
}
```

---

## 🔧 **การใช้งานใน Code:**

### **1. Server Actions (with Permission Check)**
```typescript
"use server"

import { checkPermission } from '@/lib/permissions/permission-checker'

export async function deleteBill(userId: string, billId: string) {
  // Check permission
  const check = await checkPermission(userId, 'billing.delete')
  
  if (!check.allowed) {
    return { success: false, error: check.reason }
  }
  
  // Proceed with deletion
  const supabase = await createClient()
  const { error } = await supabase
    .from('bills')
    .delete()
    .eq('id', billId)
  
  if (error) {
    return { success: false, error: error.message }
  }
  
  // Audit log
  await createAuditLog({
    user_id: userId,
    action: 'delete',
    entity_type: 'bill',
    entity_id: billId
  })
  
  return { success: true }
}
```

### **2. Client Components (with Context)**
```typescript
"use client"

import { usePermissions, Can } from '@/lib/contexts/permission-context'

function BillingPage() {
  const { hasPermission, hasRole, isSuperAdmin } = usePermissions()
  
  return (
    <div>
      <h1>Billing</h1>
      
      {/* Show button only if has permission */}
      <Can permission="billing.create">
        <Button onClick={handleCreate}>Create Bill</Button>
      </Can>
      
      {/* Check in code */}
      {hasPermission('billing.delete') && (
        <Button variant="destructive" onClick={handleDelete}>
          Delete
        </Button>
      )}
      
      {/* Super Admin only */}
      {isSuperAdmin && (
        <AdminSettings />
      )}
      
      {/* Multiple permissions (any) */}
      <Can permission={['billing.update', 'billing.delete']}>
        <EditMenu />
      </Can>
      
      {/* Multiple permissions (all required) */}
      <Can permission={['billing.view', 'billing.create']} requireAll={true}>
        <CreateFromTemplate />
      </Can>
    </div>
  )
}
```

### **3. Route Protection**
```typescript
// app/(admin)/companies/layout.tsx

import { redirect } from 'next/navigation'
import { checkMinRoleLevel } from '@/lib/permissions/permission-checker'
import { RoleLevel } from '@/lib/types/permissions'

export default async function CompaniesLayout({ children }) {
  const userId = "get-from-session"
  
  // Only Super Admin can access
  const canAccess = await checkMinRoleLevel(userId, RoleLevel.SUPER_ADMIN)
  
  if (!canAccess) {
    redirect('/unauthorized')
  }
  
  return <>{children}</>
}
```

---

## 📋 **Checklist การติดตั้ง:**

### **Database Setup**
- [ ] รัน `scripts/013_multi_tenancy_permissions.sql` ใน Supabase
- [ ] ตรวจสอบว่า 6 roles ถูกสร้าง
- [ ] ตรวจสอบว่า 40+ permissions ถูกสร้าง
- [ ] ตรวจสอบ role-permission mappings

### **Application Setup**
- [ ] Wrap app with `PermissionProvider`
- [ ] อัปเดต auth system ให้ support user_id
- [ ] แทนที่ permission checks ที่มีอยู่

### **Testing**
- [ ] สร้าง test users สำหรับแต่ละ role
- [ ] ทดสอบ permission checks
- [ ] ทดสอบ UI visibility
- [ ] ทดสอบ audit logging

---

## 🔍 **SQL Queries สำหรับการตรวจสอบ:**

### **ดู Roles ทั้งหมด**
```sql
SELECT * FROM roles ORDER BY level;
```

### **ดู Permissions ทั้งหมด**
```sql
SELECT module, COUNT(*) as count 
FROM permissions 
GROUP BY module
ORDER BY module;
```

### **ดู Role-Permission Mappings**
```sql
SELECT 
  r.display_name,
  COUNT(rp.id) as permission_count
FROM roles r
LEFT JOIN role_permissions rp ON r.id = rp.role_id
GROUP BY r.id, r.display_name
ORDER BY r.level;
```

### **ดู User Roles**
```sql
SELECT 
  u.full_name,
  u.email,
  r.display_name as role,
  c.name as company,
  p.name as project
FROM user_roles ur
JOIN users u ON ur.user_id = u.id
JOIN roles r ON ur.role_id = r.id
LEFT JOIN companies c ON ur.company_id = c.id
LEFT JOIN projects p ON ur.project_id = p.id
WHERE ur.is_active = true
ORDER BY u.full_name;
```

---

## 🎓 **Best Practices:**

### **1. Permission Checks**
- ✅ ตรวจสอบสิทธิ์ทุกครั้งใน Server Actions
- ✅ ซ่อน UI elements ที่ user ไม่มีสิทธิ์
- ✅ ใช้ `Can` component สำหรับ conditional rendering
- ✅ Handle permission denied gracefully

### **2. Role Assignment**
- ✅ มอบหมาย role ที่เหมาะสมกับหน้าที่
- ✅ ใช้ company/project scope อย่างถูกต้อง
- ✅ Review และ audit role assignments เป็นประจำ

### **3. Audit Logging**
- ✅ บันทึกทุก action ที่สำคัญ
- ✅ เก็บ old_values และ new_values
- ✅ บันทึก IP address และ user agent
- ✅ Review audit logs เป็นประจำ

### **4. Testing**
- ✅ ทดสอบทุก role กับทุก permission
- ✅ ทดสอบ edge cases
- ✅ ทดสอบ multi-tenancy isolation
- ✅ ทดสอบ performance

---

## 🚨 **Troubleshooting:**

### **ปัญหา: User ไม่มีสิทธิ์**
```sql
-- ตรวจสอบ user roles
SELECT * FROM user_roles 
WHERE user_id = 'user-uuid' AND is_active = true;

-- ตรวจสอบ permissions ของ role
SELECT p.name 
FROM role_permissions rp
JOIN permissions p ON rp.permission_id = p.id
WHERE rp.role_id = 'role-uuid';
```

### **ปัญหา: Permission check ไม่ทำงาน**
```typescript
// Debug permission context
const context = await getUserPermissionContext(userId, companyId, projectId)
console.log('Roles:', context?.roles)
console.log('Permissions:', context?.permissions)
```

### **ปัญหา: RLS blocking access**
```sql
-- Temporarily disable RLS for testing
ALTER TABLE companies DISABLE ROW LEVEL SECURITY;

-- Re-enable after fixing
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
```

---

## ✨ **สรุป:**

### **ระบบที่สร้างเสร็จแล้ว:**
✅ **Database Schema** - 8 tables ใหม่  
✅ **6 Roles** - Super Admin → Resident  
✅ **40+ Permissions** - ครอบคลุมทุกโมดูล  
✅ **Permission Checker** - ตรวจสอบสิทธิ์  
✅ **React Context** - ใช้งานใน UI  
✅ **3 Admin Pages** - Companies, Projects, Users  
✅ **Sidebar Menu** - เมนู System ใหม่  

### **พร้อมสำหรับ:**
- 🏢 Multi-company management
- 🏗️ Multi-project management  
- 👥 User & role management
- 🔐 Fine-grained permission control
- 📊 Audit trail logging
- 🔄 Scalable architecture

**ระบบ Multi-tenancy Permission พร้อมใช้งานแล้ว!** 🎊

ต้องการทดสอบระบบ หรือมีอะไรให้ปรับปรุงเพิ่มเติมไหมครับ? 🚀
