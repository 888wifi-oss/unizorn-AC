# Multi-tenancy Permission System Guide

## ภาพรวม
ระบบจัดการสิทธิ์แบบ Multi-tenancy สำหรับ Condo Pro Dashboard

## โครงสร้างระบบ

### 📊 **Hierarchy**
```
Company (บริษัทบริหารอาคาร)
  ├── Project 1 (อาคาร/คอนโด A)
  │   ├── Unit 101
  │   ├── Unit 102
  │   └── Users (Project Admin, Staff, Residents)
  ├── Project 2 (อาคาร/คอนโด B)
  │   ├── Unit 201
  │   └── Users
  └── Company Admin
```

### 🎭 **User Roles**

| Role | Level | Description |
|------|-------|-------------|
| **Super Admin** | 0 | ผู้ดูแลระบบสูงสุด - เข้าถึงทุกอย่าง |
| **Company Admin** | 1 | ผู้ดูแลบริษัท - จัดการโครงการและผู้ใช้ |
| **Project Admin** | 2 | ผู้จัดการโครงการ - จัดการนิติบุคคล |
| **Staff** | 3 | เจ้าหน้าที่ - บันทึกข้อมูลทั่วไป |
| **Engineer** | 3 | ช่างซ่อม - รับงานและอัปเดตสถานะ |
| **Resident** | 4 | ลูกบ้าน - ใช้งานพื้นฐาน |

## ติดตั้งระบบ

### **1. รัน SQL Script**
```sql
-- ใน Supabase SQL Editor
-- scripts/013_multi_tenancy_permissions.sql
```

สคริปต์นี้จะสร้าง:
- ✅ Companies table
- ✅ Projects table
- ✅ Roles table (6 roles)
- ✅ Permissions table (40+ permissions)
- ✅ Role_permissions table
- ✅ Users table (enhanced)
- ✅ User_roles table
- ✅ Audit_logs table
- ✅ Indexes และ RLS policies

### **2. ตรวจสอบการติดตั้ง**
```sql
-- ตรวจสอบ Roles
SELECT * FROM roles ORDER BY level;

-- ตรวจสอบ Permissions
SELECT module, COUNT(*) as count 
FROM permissions 
GROUP BY module;

-- ตรวจสอบ Role-Permission mappings
SELECT r.display_name, COUNT(rp.id) as permission_count
FROM roles r
LEFT JOIN role_permissions rp ON r.id = rp.role_id
GROUP BY r.id, r.display_name
ORDER BY r.level;
```

## การใช้งาน

### **1. ตรวจสอบสิทธิ์ใน Server Actions**

```typescript
import { checkPermission, checkRole } from '@/lib/permissions/permission-checker'

export async function deleteBill(billId: string) {
  const userId = "user-uuid" // Get from session
  
  // Check permission
  const check = await checkPermission(userId, 'billing.delete')
  
  if (!check.allowed) {
    throw new Error(check.reason)
  }
  
  // Proceed with deletion
  // ...
}
```

### **2. ใช้ Permission Context ใน Client Components**

```typescript
"use client"

import { usePermissions, Can } from '@/lib/contexts/permission-context'

function BillingPage() {
  const { hasPermission, isSuperAdmin, loading } = usePermissions()
  
  if (loading) return <div>Loading...</div>
  
  return (
    <div>
      <h1>Billing</h1>
      
      {/* Show button only if has permission */}
      <Can permission="billing.create">
        <Button>Create Bill</Button>
      </Can>
      
      {/* Check multiple permissions */}
      <Can permission={['billing.update', 'billing.delete']} requireAll={false}>
        <Button>Edit</Button>
      </Can>
      
      {/* Check in code */}
      {hasPermission('billing.delete') && (
        <Button variant="destructive">Delete</Button>
      )}
      
      {/* Super Admin only */}
      {isSuperAdmin && (
        <Button>Admin Settings</Button>
      )}
    </div>
  )
}
```

### **3. Wrap App with PermissionProvider**

```typescript
// app/layout.tsx หรือ app/(admin)/layout.tsx

import { PermissionProvider } from '@/lib/contexts/permission-context'

export default function Layout({ children }) {
  const userId = "get-from-session" // Get from your auth system
  const companyId = "current-company-id"
  const projectId = "current-project-id"
  
  return (
    <PermissionProvider 
      userId={userId} 
      companyId={companyId}
      projectId={projectId}
    >
      {children}
    </PermissionProvider>
  )
}
```

### **4. Protect Routes/Components with HOC**

```typescript
import { withPermission } from '@/lib/contexts/permission-context'

function BillingSettings() {
  return <div>Billing Settings</div>
}

// Protect with permission
export default withPermission(
  BillingSettings,
  'billing.manage',
  <div>Access Denied: You need billing.manage permission</div>
)
```

### **5. ตรวจสอบ Role**

```typescript
import { HasRole } from '@/lib/contexts/permission-context'

function AdminPanel() {
  return (
    <div>
      <HasRole role="super_admin">
        <SuperAdminTools />
      </HasRole>
      
      <HasRole role={['company_admin', 'project_admin']}>
        <ManagementTools />
      </HasRole>
    </div>
  )
}
```

## Permissions List

### **Companies Module**
- `companies.view` - ดูข้อมูลบริษัท
- `companies.create` - สร้างบริษัทใหม่
- `companies.update` - แก้ไขข้อมูลบริษัท
- `companies.delete` - ลบบริษัท
- `companies.manage` - จัดการบริษัททั้งหมด

### **Projects Module**
- `projects.view` - ดูข้อมูลโครงการ
- `projects.create` - สร้างโครงการใหม่
- `projects.update` - แก้ไขข้อมูลโครงการ
- `projects.delete` - ลบโครงการ
- `projects.manage` - จัดการโครงการทั้งหมด

### **Users Module**
- `users.view` - ดูข้อมูลผู้ใช้
- `users.create` - สร้างผู้ใช้ใหม่
- `users.update` - แก้ไขข้อมูลผู้ใช้
- `users.delete` - ลบผู้ใช้
- `users.manage` - จัดการผู้ใช้ทั้งหมด

### **Units Module**
- `units.view` - ดูข้อมูลยูนิต
- `units.create` - สร้างยูนิตใหม่
- `units.update` - แก้ไขข้อมูลยูนิต
- `units.delete` - ลบยูนิต

### **Billing Module**
- `billing.view` - ดูข้อมูลบัญชี
- `billing.create` - สร้างบิล
- `billing.update` - แก้ไขบิล
- `billing.delete` - ลบบิล
- `billing.manage` - จัดการบัญชีทั้งหมด

### **Maintenance Module**
- `maintenance.view` - ดูงานแจ้งซ่อม
- `maintenance.create` - สร้างงานแจ้งซ่อม
- `maintenance.update` - อัปเดตงานแจ้งซ่อม
- `maintenance.delete` - ลบงานแจ้งซ่อม
- `maintenance.assign` - มอบหมายงานซ่อม

### **Parcels Module**
- `parcels.view` - ดูข้อมูลพัสดุ
- `parcels.create` - ลงทะเบียนพัสดุ
- `parcels.update` - อัปเดตพัสดุ
- `parcels.delete` - ลบพัสดุ

## Role Permissions Matrix

| Permission | Super Admin | Company Admin | Project Admin | Staff | Engineer | Resident |
|-----------|:-----------:|:-------------:|:-------------:|:-----:|:--------:|:--------:|
| companies.* | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| projects.* | ✅ | ✅ (no delete) | ✅ (no delete) | ❌ | ❌ | ❌ |
| users.manage | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| billing.* | ✅ | ✅ | ✅ (no delete) | ✅ (view/create/update) | ❌ | ✅ (view only) |
| maintenance.* | ✅ | ✅ | ✅ (no delete) | ✅ (view/create/update) | ✅ | ✅ (view/create) |
| parcels.* | ✅ | ✅ | ✅ (no delete) | ✅ (view/create/update) | ❌ | ✅ (view only) |

## ตัวอย่าง Use Cases

### **Use Case 1: Super Admin สร้างบริษัทใหม่**

```typescript
// 1. Create company
const company = await createCompany({
  name: "ABC Property Management",
  slug: "abc-property",
  subscription_plan: "premium",
  max_projects: 10
})

// 2. Create company admin
const admin = await createUser({
  email: "admin@abc.com",
  full_name: "John Admin"
})

// 3. Assign company admin role
await assignRole(admin.id, 'company_admin', company.id)
```

### **Use Case 2: Company Admin สร้างโครงการ**

```typescript
// 1. Create project
const project = await createProject({
  company_id: companyId,
  name: "Condo XYZ",
  slug: "condo-xyz",
  total_units: 100,
  total_floors: 10
})

// 2. Create project admin
const projectAdmin = await createUser({
  email: "manager@condoxyz.com",
  full_name: "Jane Manager"
})

// 3. Assign project admin role
await assignRole(projectAdmin.id, 'project_admin', companyId, project.id)
```

### **Use Case 3: Project Admin เพิ่ม Staff**

```typescript
// 1. Create staff user
const staff = await createUser({
  email: "staff@condoxyz.com",
  full_name: "Bob Staff"
})

// 2. Assign staff role
await assignRole(staff.id, 'staff', companyId, projectId)
```

## Best Practices

### **1. ตรวจสอบสิทธิ์ทุกครั้ง**
```typescript
// ❌ Bad
export async function deleteBill(billId: string) {
  // No permission check
  await db.delete(billId)
}

// ✅ Good
export async function deleteBill(billId: string, userId: string) {
  const check = await checkPermission(userId, 'billing.delete')
  if (!check.allowed) throw new Error('Access denied')
  
  await db.delete(billId)
}
```

### **2. ใช้ Context ใน UI**
```typescript
// ❌ Bad
function BillingPage() {
  return (
    <>
      <Button>Delete</Button> {/* Everyone sees this */}
    </>
  )
}

// ✅ Good
function BillingPage() {
  return (
    <>
      <Can permission="billing.delete">
        <Button>Delete</Button>
      </Can>
    </>
  )
}
```

### **3. Audit ทุก Action**
```typescript
async function deleteBill(billId: string, userId: string) {
  const check = await checkPermission(userId, 'billing.delete')
  if (!check.allowed) throw new Error('Access denied')
  
  const bill = await getBill(billId)
  
  // Delete
  await db.delete(billId)
  
  // Audit log
  await createAuditLog({
    user_id: userId,
    action: 'delete',
    entity_type: 'bill',
    entity_id: billId,
    old_values: bill
  })
}
```

## Troubleshooting

### **ปัญหา: User ไม่มีสิทธิ์**
```sql
-- ตรวจสอบ roles ของ user
SELECT ur.*, r.display_name, r.level
FROM user_roles ur
JOIN roles r ON ur.role_id = r.id
WHERE ur.user_id = 'user-uuid' AND ur.is_active = true;

-- ตรวจสอบ permissions ของ role
SELECT p.name, p.display_name, p.module
FROM role_permissions rp
JOIN permissions p ON rp.permission_id = p.id
WHERE rp.role_id = 'role-uuid';
```

### **ปัญหา: Permission context ไม่โหลด**
```typescript
// Check in component
const { context, loading } = usePermissions()

console.log('Loading:', loading)
console.log('Context:', context)
console.log('Roles:', context?.roles)
console.log('Permissions:', context?.permissions)
```

## ไฟล์ที่สร้าง

1. `scripts/013_multi_tenancy_permissions.sql` - Database schema
2. `lib/types/permissions.ts` - TypeScript types
3. `lib/permissions/permission-checker.ts` - Permission utilities
4. `lib/contexts/permission-context.tsx` - React Context Provider

## ขั้นตอนต่อไป

1. ✅ รัน SQL script
2. ⏳ สร้าง UI สำหรับจัดการ Companies
3. ⏳ สร้าง UI สำหรับจัดการ Projects
4. ⏳ สร้าง UI สำหรับจัดการ Users & Roles
5. ⏳ อัปเดต existing pages ให้ใช้ permission system
6. ⏳ ทดสอบ permission checks
7. ⏳ เพิ่ม audit logging

ระบบ Multi-tenancy Permission พร้อมใช้งานแล้ว! 🎉
