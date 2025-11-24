# การใช้งาน Module-level Permissions

## ภาพรวม
ระบบ Permission Matrix แบบละเอียดที่ควบคุมการเข้าถึงแต่ละโมดูลตาม Role

## ไฟล์ที่สร้าง

1. **`lib/types/module-permissions.ts`** - Module access configuration
2. **`components/dynamic-sidebar.tsx`** - Dynamic sidebar based on role
3. **`components/permission-guard.tsx`** - Route/component protection
4. **`lib/middleware/route-protection.ts`** - Server-side route protection
5. **`PERMISSION_MATRIX_DETAILED.md`** - Detailed permission matrix

## Module Access Configuration

### **32 โมดูล แบ่งเป็น 6 หมวด:**

#### **1. System (4 โมดูล)**
- จัดการบริษัท - Super Admin only
- จัดการโครงการ - Super Admin, Company Admin, Project Admin
- จัดการผู้ใช้และสิทธิ์ - Super Admin, Company Admin, Project Admin
- จัดการ API - Super Admin, Company Admin

#### **2. Core (9 โมดูล)**
- แดชบอร์ด - Admin + Staff
- ห้องชุด - Admin + Staff
- ประกาศ - Admin + Staff
- งานแจ้งซ่อม - All (แต่สิทธิ์ต่างกัน)
- บัญชีลูกบ้าน - Admin only
- การแจ้งเตือน - Admin only
- พัสดุ - Admin + Staff
- รายงานพัสดุ - Admin + Staff
- เอกสารและไฟล์ - Admin + Staff

#### **3. Billing (4 โมดูล)**
- ออกบิล - Admin + Staff
- การชำระเงิน - Admin + Staff
- บันทึกรายรับ - Admin + Staff
- ลูกหนี้ค้างชำระ - Admin + Staff

#### **4. Accounting (5 โมดูล)**
- ทะเบียนทรัพย์สิน - Admin only
- คำนวณค่าเสื่อมราคา - Admin only
- ผังบัญชี - Admin only
- สมุดรายวันทั่วไป - Admin only
- สมุดบัญชีแยกประเภท - Admin only

#### **5. Reports (6 โมดูล)**
- งบประมาณรายรับ - Admin only
- งบประมาณรายจ่าย - Admin only
- รายงานเปรียบเทียบงบ - Admin only
- รายงานรายรับ - Admin + Staff
- รายงานทางการเงิน - Admin only
- รายงานสรุป - Admin + Staff

#### **6. Advanced (3 โมดูล)**
- การวิเคราะห์ข้อมูล - Admin only
- ระบบอัตโนมัติ - Admin only
- การตั้งค่าธีม - Admin + Staff

---

## การใช้งาน

### **1. ป้องกันหน้าด้วย PermissionGuard**

```typescript
// app/(admin)/billing/page.tsx
"use client"

import { PermissionGuard } from '@/components/permission-guard'

export default function BillingPage() {
  return (
    <PermissionGuard 
      moduleName="billing"
      permission="billing.view"
    >
      {/* Page content */}
      <div>Billing Page Content</div>
    </PermissionGuard>
  )
}
```

### **2. ใช้ HOC สำหรับป้องกันทั้งหน้า**

```typescript
// app/(admin)/companies/page.tsx
"use client"

import { withPermissionGuard } from '@/components/permission-guard'

function CompaniesPage() {
  return <div>Companies Page</div>
}

export default withPermissionGuard(CompaniesPage, {
  moduleName: 'companies',
  permission: 'companies.view',
  redirectTo: '/'
})
```

### **3. Dynamic Sidebar**

```typescript
// app/(admin)/layout.tsx
"use client"

import { DynamicSidebar } from '@/components/dynamic-sidebar'
import { getCurrentUser } from '@/lib/utils/mock-auth'

export default function AdminLayout({ children }) {
  const user = getCurrentUser()
  
  return (
    <div className="flex">
      <DynamicSidebar 
        userRole={user.role}
        userRoleLevel={getUserRoleLevel(user.role)}
      />
      <main className="flex-1 ml-64">
        {children}
      </main>
    </div>
  )
}
```

### **4. ตรวจสอบ Module Access**

```typescript
import { canAccessModule, getAccessibleModules } from '@/lib/types/module-permissions'

// Check single module
const canViewBilling = canAccessModule('staff', 'billing') // true
const canViewAccounting = canAccessModule('staff', 'chart_of_accounts') // false

// Get all accessible modules
const modules = getAccessibleModules('staff')
console.log(modules.length) // 14 modules
```

### **5. Server-side Route Protection**

```typescript
// app/(admin)/companies/layout.tsx
import { protectRoute } from '@/lib/middleware/route-protection'
import { redirect } from 'next/navigation'

export default async function Layout({ children }) {
  const userId = "get-from-session"
  const userRole = "get-from-session"
  
  const { allowed, reason } = await protectRoute(userId, 'companies', userRole)
  
  if (!allowed) {
    redirect('/unauthorized')
  }
  
  return <>{children}</>
}
```

---

## ตัวอย่าง Sidebar ตาม Role

### **Super Admin เห็น:**
```
ระบบ (System)
  - จัดการบริษัท
  - จัดการโครงการ
  - จัดการผู้ใช้และสิทธิ์
  - จัดการ API

เมนูหลัก
  - แดชบอร์ด
  - ห้องชุด
  - ประกาศ
  - งานแจ้งซ่อม
  - ... (ทั้งหมด)

รายรับ
  - ออกบิล
  - การชำระเงิน
  - ... (ทั้งหมด)

รายจ่าย
  - บันทึกรายจ่าย

บัญชี
  - ทะเบียนทรัพย์สิน
  - ... (ทั้งหมด)

รายงาน
  - งบประมาณรายรับ
  - ... (ทั้งหมด)

ขั้นสูง
  - การวิเคราะห์ข้อมูล
  - ระบบอัตโนมัติ
  - การตั้งค่าธีม

Total: 32 โมดูล
```

### **Company Admin เห็น:**
```
ระบบ (System)
  - จัดการโครงการ
  - จัดการผู้ใช้และสิทธิ์
  - จัดการ API

เมนูหลัก
  - แดชบอร์ด
  - ห้องชุด
  - ... (ทั้งหมด)

รายรับ
  - ออกบิล
  - ... (ทั้งหมด)

รายจ่าย
  - บันทึกรายจ่าย

บัญชี
  - ทะเบียนทรัพย์สิน
  - ... (ทั้งหมด)

รายงาน
  - งบประมาณรายรับ
  - ... (ทั้งหมด)

ขั้นสูง
  - การวิเคราะห์ข้อมูล
  - ระบบอัตโนมัติ
  - การตั้งค่าธีม

Total: 29 โมดูล (ไม่มี "จัดการบริษัท")
```

### **Project Admin เห็น:**
```
ระบบ (System)
  - จัดการโครงการ (view/update only)
  - จัดการผู้ใช้และสิทธิ์ (project scope)

เมนูหลัก
  - แดชบอร์ด
  - ห้องชุด
  - ... (ทั้งหมด)

รายรับ
  - ออกบิล
  - ... (ทั้งหมด)

รายจ่าย
  - บันทึกรายจ่าย

บัญชี
  - ทะเบียนทรัพย์สิน
  - ... (ทั้งหมด)

รายงาน
  - งบประมาณรายรับ
  - ... (ทั้งหมด)

ขั้นสูง
  - การวิเคราะห์ข้อมูล
  - ระบบอัตโนมัติ
  - การตั้งค่าธีม

Total: 28 โมดูล (ไม่มี "จัดการบริษัท" และ "จัดการ API")
```

### **Staff เห็น:**
```
เมนูหลัก
  - แดชบอร์ด
  - ห้องชุด (view only)
  - ประกาศ
  - งานแจ้งซ่อม
  - พัสดุ
  - รายงานพัสดุ
  - เอกสารและไฟล์

รายรับ
  - ออกบิล
  - การชำระเงิน
  - บันทึกรายรับ
  - ลูกหนี้ค้างชำระ

รายงาน
  - รายงานรายรับ
  - รายงานสรุป

ขั้นสูง
  - การตั้งค่าธีม

Total: 14 โมดูล
```

### **Engineer เห็น:**
```
เมนูหลัก
  - งานแจ้งซ่อม

Total: 1 โมดูล (เฉพาะงานซ่อม)
```

### **Resident เห็น (Portal):**
```
Portal Menu
  - บิลของฉัน
  - การชำระเงิน
  - แจ้งซ่อม
  - พัสดุของฉัน
  - ประกาศ
  - การแจ้งเตือน
  - เอกสารแชร์

Total: 7 โมดูล (Portal only, ไม่ใช่ Admin)
```

---

## ตัวอย่างการใช้งาน

### **Example 1: Billing Page (Admin + Staff)**

```typescript
"use client"

import { PermissionGuard } from '@/components/permission-guard'
import { Can } from '@/lib/contexts/permission-context'

export default function BillingPage() {
  return (
    <PermissionGuard moduleName="billing" permission="billing.view">
      <div>
        <h1>Billing</h1>
        
        {/* All users with billing.view can see list */}
        <BillList />
        
        {/* Only users with billing.create can create */}
        <Can permission="billing.create">
          <Button>Create Bill</Button>
        </Can>
        
        {/* Only admins can delete */}
        <Can permission="billing.delete">
          <Button variant="destructive">Delete</Button>
        </Can>
      </div>
    </PermissionGuard>
  )
}
```

### **Example 2: Chart of Accounts (Admin Only)**

```typescript
"use client"

import { PermissionGuard } from '@/components/permission-guard'

export default function ChartOfAccountsPage() {
  return (
    <PermissionGuard 
      moduleName="chart_of_accounts"
      permission="chart_of_accounts.view"
      redirectTo="/"
    >
      <div>
        <h1>Chart of Accounts</h1>
        {/* Only Project Admin and above can see this */}
      </div>
    </PermissionGuard>
  )
}
```

### **Example 3: Maintenance (Different permissions per role)**

```typescript
"use client"

import { PermissionGuard } from '@/components/permission-guard'
import { usePermissions, Can } from '@/lib/contexts/permission-context'

export default function MaintenancePage() {
  const { hasRole } = usePermissions()
  
  return (
    <PermissionGuard moduleName="maintenance" permission="maintenance.view">
      <div>
        <h1>Maintenance</h1>
        
        {/* All can view list (but filtered by scope) */}
        <MaintenanceList />
        
        {/* Residents and all can create */}
        <Can permission="maintenance.create">
          <Button>Create Request</Button>
        </Can>
        
        {/* Engineers and admins can update */}
        <Can permission="maintenance.update">
          <Button>Update Status</Button>
        </Can>
        
        {/* Only admins can assign */}
        <Can permission="maintenance.assign">
          <AssignTechnicianDialog />
        </Can>
        
        {/* Only super admin can delete */}
        <Can permission="maintenance.delete">
          <Button variant="destructive">Delete</Button>
        </Can>
      </div>
    </PermissionGuard>
  )
}
```

---

## สรุป Permission Matrix

### **จำนวนโมดูลที่เข้าถึงได้:**

| Role | Total | System | Core | Billing | Accounting | Reports | Advanced |
|------|:-----:|:------:|:----:|:-------:|:----------:|:-------:|:--------:|
| **Super Admin** | 32 | 4 | 9 | 4 | 5 | 6 | 3 |
| **Company Admin** | 29 | 3 | 9 | 4 | 5 | 6 | 3 |
| **Project Admin** | 28 | 2 | 9 | 4 | 5 | 6 | 3 |
| **Staff** | 14 | 0 | 8 | 4 | 0 | 3 | 1 |
| **Engineer** | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| **Resident** | 7 (Portal) | 0 | 5 | 2 | 0 | 0 | 0 |

### **การลดสิทธิ์ตามลำดับชั้น:**

```
Super Admin (32 modules)
  ↓ -3 modules (no companies)
Company Admin (29 modules)
  ↓ -1 module (no api_management)
Project Admin (28 modules)
  ↓ -14 modules (no system, accounting, most reports, advanced)
Staff (14 modules)
  ↓ -13 modules (only maintenance)
Engineer (1 module)

Resident (7 modules, different context - Portal)
```

---

## ขั้นตอนการใช้งาน

### **1. Wrap pages with PermissionGuard**
```typescript
// app/(admin)/[module]/page.tsx
export default function ModulePage() {
  return (
    <PermissionGuard moduleName="module_name" permission="module.view">
      <YourContent />
    </PermissionGuard>
  )
}
```

### **2. Use Dynamic Sidebar**
```typescript
// app/(admin)/layout.tsx
import { DynamicSidebar } from '@/components/dynamic-sidebar'

export default function Layout({ children }) {
  const user = getCurrentUser()
  
  return (
    <div className="flex">
      <DynamicSidebar userRole={user.role} userRoleLevel={user.level} />
      <main className="flex-1 ml-64">{children}</main>
    </div>
  )
}
```

### **3. ตรวจสอบใน Components**
```typescript
import { Can } from '@/lib/contexts/permission-context'

function MyComponent() {
  return (
    <Can permission="module.action">
      <Button>Action</Button>
    </Can>
  )
}
```

---

## Testing

### **ทดสอบแต่ละ Role:**

```typescript
import { switchUser } from '@/lib/utils/mock-auth'

// Test Super Admin
switchUser('SUPER_ADMIN')
// Should see all 32 modules

// Test Company Admin
switchUser('COMPANY_ADMIN')
// Should see 29 modules (no "จัดการบริษัท")

// Test Project Admin
switchUser('PROJECT_ADMIN')
// Should see 28 modules (no "จัดการบริษัท", "จัดการ API")

// Test Staff
switchUser('STAFF')
// Should see 14 modules (main operations only)

// Test Engineer
switchUser('ENGINEER')
// Should see 1 module (maintenance only)
```

---

## สรุป

ระบบ Permission Matrix ได้รับการพัฒนาให้ละเอียดขึ้น:

- ✅ **32 โมดูล** แยกตามหมวดหมู่
- ✅ **6 Roles** แต่ละ role เห็นโมดูลต่างกัน
- ✅ **Module-level Control** - กำหนดว่า role ไหนเข้าโมดูลไหนได้
- ✅ **Permission-level Control** - กำหนดสิทธิ์ละเอียดใน module
- ✅ **Dynamic Sidebar** - แสดงเฉพาะโมดูลที่มีสิทธิ์
- ✅ **Route Protection** - ป้องกันการเข้าถึงที่ไม่ได้รับอนุญาต
- ✅ **Type-safe** - TypeScript configuration

**ระบบควบคุมสิทธิ์แบบละเอียดพร้อมใช้งานแล้ว!** 🎊
