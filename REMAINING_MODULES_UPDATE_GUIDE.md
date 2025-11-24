# คู่มือปรับปรุงโมดูลที่เหลือสำหรับ Multi-Project Support

## โมดูลที่ยังต้องปรับ (7 โมดูล):

### 1. ✅ Revenue - เสร็จแล้ว
### 2. ⏳ Vendors (ผู้ขาย)
### 3. ⏳ File Management (จัดการไฟล์)
### 4. ⏳ Fixed Assets (สินทรัพย์ถาวร)
### 5. ⏳ Notifications (แจ้งเตือน)
### 6. ⏳ Analytics (วิเคราะห์)
### 7. ⏳ Reports (รายงาน)
### 8. ⏳ Automation (ระบบอัตโนมัติ)

---

## Template สำหรับแก้ไขแต่ละโมดูล

### ขั้นตอนที่ 1: เพิ่ม imports

```typescript
import { useProjectContext } from "@/lib/contexts/project-context"
import { getCurrentUser } from "@/lib/utils/mock-auth"
```

### ขั้นตอนที่ 2: เพิ่ม `project_id` ใน interface

```typescript
interface YourDataType {
  // ... existing fields
  project_id?: string  // ✅ เพิ่มบรรทัดนี้
}
```

### ขั้นตอนที่ 3: เพิ่ม states และ context

```typescript
export default function YourPage() {
  const { selectedProjectId, selectedProject } = useProjectContext()
  const currentUser = getCurrentUser()
  
  const [data, setData] = useState<YourDataType[]>([])
  const [allData, setAllData] = useState<YourDataType[]>([])  // ✅ เพิ่ม
  // ... existing states
```

### ขั้นตอนที่ 4: อัปเดต useEffect

```typescript
useEffect(() => {
  console.log('[ModuleName] useEffect triggered. selectedProjectId:', selectedProjectId)
  loadData()
}, [selectedProjectId])  // ✅ เพิ่ม dependency
```

### ขั้นตอนที่ 5: อัปเดต loadData function

```typescript
const loadData = async () => {
  setIsLoading(true)
  try {
    const data = await getDataFromDB()  // หรือ query จาก Supabase
    
    // Store all data
    setAllData(data)
    console.log('[ModuleName] Total data from DB:', data.length)
    
    // Filter by selected project (for non-Super Admin)
    let filtered = data
    if (selectedProjectId && currentUser.role !== 'super_admin') {
      filtered = data.filter((item: any) => item.project_id === selectedProjectId)
      console.log('[ModuleName] Filtered data:', data.length, '→', filtered.length)
    } else {
      console.log('[ModuleName] No filtering (Super Admin)')
    }
    
    setData(filtered)
    // calculateSummary(filtered) // ถ้ามี
    
  } catch (error) {
    // ... error handling
  } finally {
    setIsLoading(false)
  }
}
```

### ขั้นตอนที่ 6: อัปเดต save/create function

```typescript
const handleSave = async () => {
  // ... validation
  
  try {
    console.log('[ModuleName] Saving with project_id:', selectedProjectId)
    
    await saveDataToDB({
      ...formData,
      project_id: selectedProjectId || null  // ✅ เพิ่มบรรทัดนี้
    })
    
    await loadData()  // ✅ Reload data
    // ... success handling
  } catch (error) {
    // ... error handling
  }
}
```

---

## โมดูลเฉพาะ - คำแนะนำเพิ่มเติม

### Vendors (app/(admin)/vendors/page.tsx)
- กรอง vendors ตาม `project_id`
- เมื่อสร้าง vendor ใหม่ ผูกกับ `selectedProjectId`

### File Management (app/(admin)/file-management/page.tsx)
- กรองไฟล์ตาม `project_id`
- อัปโหลดไฟล์ผูกกับ `selectedProjectId`
- ตรวจสอบ permissions ตาม project

### Fixed Assets (app/(admin)/fixed-assets/page.tsx)
- กรอง assets ตาม `project_id`
- คำนวณค่าเสื่อมเฉพาะ assets ของโครงการ

### Notifications (app/(admin)/notifications/page.tsx)
- กรองการแจ้งเตือนตาม `project_id`
- ส่งการแจ้งเตือนเฉพาะผู้ใช้ในโครงการ

### Analytics (app/(admin)/analytics/page.tsx)
- วิเคราะห์ข้อมูลเฉพาะโครงการที่เลือก
- Dashboard แสดงสถิติตาม `selectedProjectId`

### Reports (app/(admin)/reports/page.tsx)
- สร้างรายงานเฉพาะโครงการที่เลือก
- Export ข้อมูลกรองตาม `project_id`

### Automation (app/(admin)/automation/page.tsx)
- กฎอัตโนมัติทำงานเฉพาะโครงการที่กำหนด
- กรองกฎตาม `project_id`

---

## การตรวจสอบหลังแก้ไข

### Checklist:
- [ ] เพิ่ม `useProjectContext` และ `getCurrentUser`
- [ ] เพิ่ม `project_id` ใน interface
- [ ] เพิ่ม `allData` state
- [ ] อัปเดต `useEffect` dependencies
- [ ] กรองข้อมูลใน `loadData`
- [ ] เพิ่ม `project_id` ตอนบันทึก
- [ ] เพิ่ม `await loadData()` หลังบันทึกสำเร็จ
- [ ] เพิ่ม console.log สำหรับ debug
- [ ] ทดสอบกับ Super Admin (เห็นทุกโครงการ)
- [ ] ทดสอบกับ Company/Project Admin (เห็นเฉพาะโครงการตัวเอง)
- [ ] ทดสอบการสลับโครงการ (ข้อมูลอัปเดทถูกต้อง)

---

## ตัวอย่างโค้ดสมบูรณ์ (Vendors)

```typescript
"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
// ... other imports
import { useProjectContext } from "@/lib/contexts/project-context"
import { getCurrentUser } from "@/lib/utils/mock-auth"

interface Vendor {
  id: string
  name: string
  contact: string
  phone: string
  email: string
  project_id?: string  // ✅ เพิ่ม
}

export default function VendorsPage() {
  const { selectedProjectId } = useProjectContext()
  const currentUser = getCurrentUser()
  
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [allVendors, setAllVendors] = useState<Vendor[]>([])  // ✅ เพิ่ม
  const [isLoading, setIsLoading] = useState(true)
  
  useEffect(() => {
    console.log('[Vendors] useEffect triggered. selectedProjectId:', selectedProjectId)
    loadVendors()
  }, [selectedProjectId])  // ✅ เพิ่ม dependency
  
  const loadVendors = async () => {
    setIsLoading(true)
    const supabase = createClient()
    
    try {
      const { data } = await supabase
        .from('vendors')
        .select('*')
        .order('name')
      
      setAllVendors(data || [])
      console.log('[Vendors] Total vendors from DB:', data?.length || 0)
      
      // Filter by selected project
      let filtered = data || []
      if (selectedProjectId && currentUser.role !== 'super_admin') {
        filtered = (data || []).filter((vendor: any) => vendor.project_id === selectedProjectId)
        console.log('[Vendors] Filtered vendors:', data?.length || 0, '→', filtered.length)
      } else {
        console.log('[Vendors] No filtering (Super Admin)')
      }
      
      setVendors(filtered)
    } catch (error) {
      console.error('[Vendors] Load error:', error)
    } finally {
      setIsLoading(false)
    }
  }
  
  const handleSave = async (formData: any) => {
    const supabase = createClient()
    
    try {
      console.log('[Vendors] Saving vendor with project_id:', selectedProjectId)
      
      const { error } = await supabase
        .from('vendors')
        .insert([{
          ...formData,
          project_id: selectedProjectId || null  // ✅ เพิ่ม
        }])
      
      if (error) throw error
      
      await loadVendors()  // ✅ Reload
      // ... success toast
    } catch (error) {
      // ... error handling
    }
  }
  
  // ... rest of component
}
```

---

## หมายเหตุสำคัญ

1. **Super Admin** เห็นข้อมูลทุกโครงการ (ไม่มีการกรอง)
2. **Company/Project Admin** เห็นเฉพาะโครงการที่มีสิทธิ์
3. **Stats/Summary** ต้องคำนวณจากข้อมูลที่กรองแล้ว
4. **Reload data** หลังบันทึก/แก้ไข/ลบ เสมอ
5. **Console.log** ช่วย debug ว่าข้อมูลถูกกรองถูกต้อง

---

## SQL Scripts ที่อาจต้องใช้

หากตารางยังไม่มี `project_id`:

```sql
-- เพิ่ม project_id ให้ตาราง
ALTER TABLE table_name 
ADD COLUMN project_id UUID REFERENCES projects(id) ON DELETE CASCADE;

-- เพิ่ม index
CREATE INDEX idx_table_name_project_id ON table_name(project_id);
```

Script `017_add_project_id_to_tables.sql` มีฟังก์ชัน `add_project_id_column()` 
ที่สามารถใช้เพิ่ม `project_id` ให้ตารางใหม่ได้

---

## สรุป

ทุกโมดูลต้องมี:
1. ✅ กรองข้อมูลตาม `selectedProjectId`
2. ✅ บันทึกพร้อม `project_id`
3. ✅ Reload data หลังแก้ไข
4. ✅ คำนวณ Stats จากข้อมูลที่กรองแล้ว
5. ✅ Console.log เพื่อ debug

**ความสำเร็จของระบบ Multi-Project อยู่ที่ความสม่ำเสมอของการใช้ pattern เดียวกันทุกโมดูล! 🎯**




















