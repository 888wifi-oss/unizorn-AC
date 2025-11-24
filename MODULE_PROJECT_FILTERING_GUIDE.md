# Module Project Filtering Guide

## 🎯 ภาพรวม

คู่มือสำหรับการแก้ไขทุกโมดูล (30 โมดูล) ให้กรองข้อมูลตาม `selectedProjectId` สำหรับ non-Super Admin

---

## 📋 โมดูลทั้งหมดที่ต้องแก้ไข

### **✅ แก้เสร็จแล้ว (5 โมดูล):**
1. ✅ จัดการบริษัท (`/companies`) - Super Admin only
2. ✅ จัดการโครงการ (`/projects`) - Filter by selectedProjectId
3. ✅ จัดการผู้ใช้และสิทธิ์ (`/user-management`) - Filter users/companies/projects
4. ✅ กลุ่มผู้ใช้งาน (`/user-groups`) - Filter users in group assignment
5. ✅ จัดการทีมงาน (`/team-management`) - (ถ้ามี)

### **⚠️ ต้องแก้ไข (25+ โมดูล):**

#### **เมนูหลัก:**
- [ ] แดชบอร์ด (`/dashboard`)
- [ ] ห้องชุด (`/units`)
- [ ] จัดการประกาศ (`/announcements`)
- [ ] จัดการงานแจ้งซ่อม (`/maintenance`)
- [ ] จัดการบัญชีลูกบ้าน (`/resident-accounts`)
- [ ] จัดการการแจ้งเตือน (`/notifications`)
- [ ] จัดการพัสดุ (`/parcels`)
- [ ] รายงานพัสดุ (`/parcels/reports`)

#### **บัญชีและการเงิน:**
- [ ] รายรับ-รายจ่าย (`/income-expenses`)
- [ ] ค่าใช้จ่ายส่วนกลาง (`/common-fees`)
- [ ] บิลค่าส่วนกลาง (`/billing`)
- [ ] การชำระเงิน (`/payments`)
- [ ] เงินกองทุน (`/funds`)
- [ ] งบประมาณ (`/budgets`)
- [ ] บัญชีเจ้าหนี้ (`/accounts-payable`)
- [ ] บัญชีลูกหนี้ (`/accounts-receivable`)

#### **รายงาน:**
- [ ] รายงานการเงิน (`/financial-reports`)
- [ ] รายงานห้องชุด (`/unit-reports`)
- [ ] รายงานการชำระเงิน (`/payment-reports`)
- [ ] รายงานการแจ้งซ่อม (`/maintenance-reports`)

#### **อื่นๆ:**
- [ ] จัดการเอกสาร (`/documents`)
- [ ] จัดการสัญญา (`/contracts`)
- [ ] จัดการจอดรถ (`/parking`)
- [ ] จัดการอุปกรณ์ส่วนกลาง (`/facilities`)
- [ ] จัดการผู้เข้าเยี่ยม (`/visitors`)

---

## 🔧 Template สำหรับแก้ไขแต่ละโมดูล

### **Step 1: Import Project Context**

```tsx
// app/(admin)/[module]/page.tsx
import { useProjectContext } from "@/lib/contexts/project-context"

export default function ModulePage() {
  const { selectedProjectId, selectedProject } = useProjectContext()
  const currentUser = getCurrentUser()
  
  // ... rest of code
}
```

### **Step 2: Filter Data on Load**

```tsx
const loadData = async () => {
  const result = await getModuleData(currentUserId)
  
  if (result.success) {
    let filteredData = result.data || []
    
    // Filter by selected project (for non-Super Admin)
    if (selectedProjectId && currentUser.role !== 'super_admin') {
      filteredData = filteredData.filter(item => 
        item.project_id === selectedProjectId
      )
    }
    
    setData(filteredData)
  }
}
```

### **Step 3: Reload on Project Change**

```tsx
useEffect(() => {
  loadData()
}, [selectedProjectId])  // ✅ Add dependency
```

### **Step 4: Filter on Create/Update**

```tsx
const handleCreate = async () => {
  const result = await createItem(currentUserId, {
    ...formData,
    project_id: selectedProjectId  // ✅ Add project_id
  })
}
```

---

## 📝 ตัวอย่างการแก้ไข

### **ตัวอย่าง 1: หน้าห้องชุด (Units)**

```tsx
// app/(admin)/units/page.tsx
"use client"

import { useState, useEffect } from "react"
import { useProjectContext } from "@/lib/contexts/project-context"
import { getCurrentUser } from "@/lib/utils/mock-auth"
import { getUnits } from "@/lib/actions/unit-actions"

export default function UnitsPage() {
  const [units, setUnits] = useState([])
  const currentUser = getCurrentUser()
  const { selectedProjectId } = useProjectContext()
  
  const loadData = async () => {
    const result = await getUnits(currentUserId, selectedProjectId)  // ✅ Pass projectId
    
    if (result.success) {
      setUnits(result.units || [])
    }
  }
  
  useEffect(() => {
    loadData()
  }, [selectedProjectId])  // ✅ Reload on change
  
  return (
    <div>
      <h1>ห้องชุดในโครงการ: {selectedProject?.name}</h1>
      {/* ... */}
    </div>
  )
}
```

### **ตัวอย่าง 2: หน้าแจ้งซ่อม (Maintenance)**

```tsx
// app/(admin)/maintenance/page.tsx
"use client"

import { useProjectContext } from "@/lib/contexts/project-context"

export default function MaintenancePage() {
  const [tickets, setTickets] = useState([])
  const { selectedProjectId } = useProjectContext()
  const currentUser = getCurrentUser()
  
  const loadData = async () => {
    const result = await getMaintenanceTickets(currentUserId)
    
    if (result.success) {
      let filteredTickets = result.tickets || []
      
      // Filter by project
      if (selectedProjectId && currentUser.role !== 'super_admin') {
        filteredTickets = filteredTickets.filter(ticket => 
          ticket.project_id === selectedProjectId
        )
      }
      
      setTickets(filteredTickets)
    }
  }
  
  useEffect(() => {
    loadData()
  }, [selectedProjectId])
  
  return <div>{/* ... */}</div>
}
```

---

## 🗄️ Database Schema Requirement

ทุกตารางต้องมี `project_id`:

```sql
-- Example: units table
ALTER TABLE units ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES projects(id);

-- Example: maintenance_tickets table
ALTER TABLE maintenance_tickets ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES projects(id);

-- Example: announcements table
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES projects(id);

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_units_project_id ON units(project_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_project_id ON maintenance_tickets(project_id);
CREATE INDEX IF NOT EXISTS idx_announcements_project_id ON announcements(project_id);
```

---

## 🔐 Server Actions Pattern

### **Before (ไม่มีการกรอง):**
```typescript
export async function getUnits(userId: string) {
  const { data } = await supabase
    .from('units')
    .select('*')
  
  return { units: data }  // ❌ ทุกห้อง
}
```

### **After (กรองตามโครงการ):**
```typescript
export async function getUnits(userId: string, projectId?: string) {
  let query = supabase
    .from('units')
    .select('*')
  
  // Filter by project (if not Super Admin)
  if (projectId) {
    query = query.eq('project_id', projectId)
  }
  
  const { data } = await query
  
  return { units: data }  // ✅ เฉพาะโครงการที่เลือก
}
```

---

## 📊 Priority List

### **High Priority (ใช้บ่อย):**
1. 🔥 ห้องชุด (Units)
2. 🔥 จัดการงานแจ้งซ่อม (Maintenance)
3. 🔥 บิลค่าส่วนกลาง (Billing)
4. 🔥 การชำระเงิน (Payments)
5. 🔥 จัดการประกาศ (Announcements)

### **Medium Priority:**
6. 📊 รายรับ-รายจ่าย (Income/Expenses)
7. 📊 บัญชีลูกบ้าน (Resident Accounts)
8. 📊 จัดการพัสดุ (Parcels)
9. 📊 รายงานต่างๆ (Reports)

### **Low Priority:**
10. 📄 เอกสาร (Documents)
11. 📄 สัญญา (Contracts)
12. 🚗 จอดรถ (Parking)
13. 🏊 อุปกรณ์ส่วนกลาง (Facilities)

---

## ⚡ Quick Fix Script

สร้าง script สำหรับแก้ไขทุกโมดูลอัตโนมัติ:

```typescript
// scripts/add-project-filtering.ts
import { readdirSync, readFileSync, writeFileSync } from 'fs'
import { join } from 'path'

const PAGES_DIR = 'app/(admin)'
const MODULES = [
  'units', 'maintenance', 'announcements', 'resident-accounts',
  'notifications', 'parcels', 'income-expenses', 'common-fees',
  'billing', 'payments', 'funds', 'budgets', 'accounts-payable',
  'accounts-receivable', 'financial-reports', 'unit-reports',
  'payment-reports', 'maintenance-reports', 'documents',
  'contracts', 'parking', 'facilities', 'visitors'
]

function addProjectFiltering(modulePath: string) {
  const filePath = join(PAGES_DIR, modulePath, 'page.tsx')
  let content = readFileSync(filePath, 'utf-8')
  
  // 1. Add import
  if (!content.includes('useProjectContext')) {
    content = content.replace(
      'import { getCurrentUser }',
      'import { getCurrentUser }\nimport { useProjectContext } from "@/lib/contexts/project-context"'
    )
  }
  
  // 2. Add hook
  if (!content.includes('useProjectContext()')) {
    content = content.replace(
      'const currentUser = getCurrentUser()',
      'const currentUser = getCurrentUser()\n  const { selectedProjectId, selectedProject } = useProjectContext()'
    )
  }
  
  // 3. Add filtering logic
  // ... (pattern matching for filter insertion)
  
  writeFileSync(filePath, content)
}

// Run for all modules
MODULES.forEach(module => addProjectFiltering(module))
```

---

## 🎯 เป้าหมาย

เมื่อแก้ไขครบทุกโมดูล:

✅ **Company Admin/Project Admin:**
- เห็นข้อมูลเฉพาะโครงการที่เลือก
- เปลี่ยนโครงการ → ข้อมูลเปลี่ยนทันที
- ไม่เห็นข้อมูลโครงการอื่น

✅ **Super Admin:**
- เห็นทุกข้อมูล (ไม่ถูกกรอง)
- ไม่ต้องเลือกโครงการ

✅ **Security:**
- ข้อมูลแยกกันชัดเจนระหว่างโครงการ
- ไม่มี data leak
- Audit trail ชัดเจน

---

## 🚀 Next Steps

### **Phase 1: Core Modules (แก้ก่อน)**
```bash
1. ห้องชุด (Units)
2. งานแจ้งซ่อม (Maintenance)
3. บิลค่าส่วนกลาง (Billing)
4. การชำระเงิน (Payments)
```

### **Phase 2: Financial Modules**
```bash
5. รายรับ-รายจ่าย
6. ค่าใช้จ่ายส่วนกลาง
7. เงินกองทุน
8. งบประมาณ
```

### **Phase 3: Reports & Others**
```bash
9. รายงานทั้งหมด
10. โมดูลอื่นๆ
```

---

## 📚 Example Implementation

### **Pattern A: Client-side Filtering**

```tsx
const loadData = async () => {
  const result = await getModuleData(currentUserId)
  
  if (result.success) {
    let data = result.data || []
    
    // Filter by project
    if (selectedProjectId && currentUser.role !== 'super_admin') {
      data = data.filter(item => item.project_id === selectedProjectId)
    }
    
    setData(data)
  }
}

useEffect(() => {
  loadData()
}, [selectedProjectId])
```

### **Pattern B: Server-side Filtering (แนะนำ)**

```typescript
// Server Action
export async function getModuleData(userId: string, projectId?: string) {
  let query = supabase.from('table').select('*')
  
  // Add project filter
  if (projectId) {
    query = query.eq('project_id', projectId)
  }
  
  const { data } = await query
  return { data }
}

// Page
const loadData = async () => {
  const result = await getModuleData(
    currentUserId, 
    selectedProjectId  // ✅ Pass to server
  )
  setData(result.data)
}
```

---

## ✅ Checklist ต่อโมดูล

เมื่อแก้ไขแต่ละโมดูล ต้องทำ:

- [ ] Import `useProjectContext`
- [ ] ใช้ `selectedProjectId` และ `selectedProject`
- [ ] กรองข้อมูลตาม `selectedProjectId`
- [ ] Reload เมื่อ `selectedProjectId` เปลี่ยน
- [ ] เพิ่ม `project_id` เมื่อสร้างข้อมูลใหม่
- [ ] เช็คว่า database มี column `project_id`
- [ ] เพิ่ม index `idx_[table]_project_id`
- [ ] ทดสอบกับ Super Admin (เห็นทุกอย่าง)
- [ ] ทดสอบกับ Company Admin (เห็นแค่โครงการที่เลือก)
- [ ] ทดสอบกับ Project Admin (เห็นแค่โครงการที่เลือก)

---

## 🎊 Expected Result

หลังแก้ไขครบทุกโมดูล:

```
Login as Company Admin (assigned to P1, P2)
  ↓
Select Project P1
  ↓
Dashboard: ข้อมูลของ P1
Units: ห้องของ P1
Maintenance: งานซ่อมของ P1
Billing: บิลของ P1
Payments: การชำระของ P1
... (ทุกโมดูลกรองตาม P1)
  ↓
Switch to P2 (Sidebar)
  ↓
ทุกโมดูลเปลี่ยนเป็นข้อมูลของ P2 ทันที ✅
```

**ระบบจะปลอดภัยและใช้งานได้ถูกต้อง! 🔐**

