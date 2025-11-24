# Units Page Fix - แก้ไขหน้าห้องชุด

## 🐛 ปัญหาที่พบ

**User:** svs@email.com (Company Admin)  
**Scenario:**
1. เพิ่มห้องชุดในโครงการ ABCD
2. สลับไปโครงการ SVS
3. ❌ ยังเห็นห้องชุดของโครงการ ABCD (ไม่ถูกต้อง)

---

## ✅ การแก้ไข

### **1. เพิ่ม Project Context**
```tsx
import { useProjectContext } from "@/lib/contexts/project-context"
import { getCurrentUser } from "@/lib/utils/mock-auth"

const { selectedProjectId, selectedProject } = useProjectContext()
const currentUser = getCurrentUser()
```

### **2. กรองข้อมูลตามโครงการ**
```tsx
const loadUnits = async () => {
  const result = await getUnitsFromDB()
  
  if (result.success) {
    const allUnitsData = result.units || []
    
    // Filter by selected project (for non-Super Admin)
    if (selectedProjectId && currentUser.role !== 'super_admin') {
      const filteredUnits = allUnitsData.filter(unit => 
        unit.project_id === selectedProjectId  // ✅ กรอง
      )
      setUnits(filteredUnits)
    } else {
      setUnits(allUnitsData)  // Super Admin เห็นทุกอย่าง
    }
  }
}
```

### **3. Reload เมื่อเปลี่ยนโครงการ**
```tsx
useEffect(() => {
  console.log('[Units] selectedProjectId changed:', selectedProjectId)
  loadUnits()
}, [selectedProjectId])  // ✅ Dependency
```

### **4. เพิ่ม project_id เมื่อบันทึก**
```tsx
const handleSave = async () => {
  const unit = {
    ...formData,
    project_id: selectedProjectId  // ✅ เพิ่ม project_id
  }
  
  await saveUnitToDB(unit)
}
```

---

## 🗄️ Database Migration

### **Run Script:**
```bash
psql -U postgres -d condo_pro -f scripts/017_add_project_id_to_tables.sql
```

### **What it does:**
```sql
-- Add project_id column to units table
ALTER TABLE units ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES projects(id);

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_units_project_id ON units(project_id);

-- Also adds to 16 other tables:
- announcements
- maintenance_tickets
- billing
- payments
- resident_accounts
- documents
- parcels
- notifications
- income_expenses
- common_fees
- funds
- budgets
- contracts
- parking
- facilities
- visitors
```

---

## 📊 ตัวอย่างการทำงาน

### **Before Fix:**
```
Login as svs@email.com (Company Admin)
Selected Project: ABCD

หน้าห้องชุด:
- Unit 101 (Project ABCD) ✅
- Unit 102 (Project ABCD) ✅
- Unit 201 (Project SVS) ✅ ← ไม่ควรเห็น!
- Unit 202 (Project XYZ) ✅ ← ไม่ควรเห็น!

สลับเป็น Project SVS:
- Unit 101 (Project ABCD) ✅ ← ยังเห็น! (ผิด)
- Unit 102 (Project ABCD) ✅ ← ยังเห็น! (ผิด)
- Unit 201 (Project SVS) ✅
- Unit 202 (Project XYZ) ✅ ← ไม่ควรเห็น!
```

### **After Fix:**
```
Login as svs@email.com
Selected Project: ABCD

หน้าห้องชุด:
- Unit 101 (Project ABCD) ✅
- Unit 102 (Project ABCD) ✅

สลับเป็น Project SVS:
Console:
  [ProjectContext] Changing project to: SVS-id
  [Units] useEffect triggered. selectedProjectId: SVS-id
  [Units] Loading units...
  [Units] Total units from DB: 10
  [Units] Filtered by project: 10 → 2
  
หน้าห้องชุด:
- Unit 201 (Project SVS) ✅
- Unit 202 (Project SVS) ✅
(เฉพาะโครงการ SVS)
```

---

## 🎨 UI Changes

### **PageHeader แสดงโครงการ:**
```tsx
<PageHeader 
  title="ห้องชุด"
  subtitle={selectedProject ? `โครงการ: ${selectedProject.name}` : "จัดการห้องชุด"}
/>
```

### **Debug Info:**
Console logs แสดง:
```
[Units] useEffect triggered. selectedProjectId: xxx
[Units] Loading units...
[Units] Total units from DB: 50
[Units] Filtered by project: 50 → 5
```

---

## 📁 Files Changed

1. **`app/(admin)/units/page.tsx`**
   - เพิ่ม useProjectContext
   - เพิ่ม getCurrentUser
   - กรองข้อมูลตาม selectedProjectId
   - เพิ่ม project_id เมื่อบันทึก
   - เพิ่ม debug logs

2. **`scripts/017_add_project_id_to_tables.sql`** (NEW)
   - เพิ่ม project_id ให้ 17 ตาราง
   - เพิ่ม indexes

3. **`components/project-sync-wrapper.tsx`** (NEW)
   - Force remount when project changes

4. **`app/(admin)/layout.tsx`**
   - Wrap with ProjectSyncWrapper

---

## 🚀 Next Steps

ต้องแก้ไขโมดูลอื่นๆ ด้วยวิธีเดียวกัน:

### **ยังไม่แก้ (20+ โมดูล):**
- [ ] จัดการประกาศ (announcements)
- [ ] จัดการงานแจ้งซ่อม (maintenance)
- [ ] บิลค่าส่วนกลาง (billing)
- [ ] การชำระเงิน (payments)
- [ ] บัญชีลูกบ้าน (resident-accounts)
- [ ] จัดการพัสดุ (parcels)
- [ ] การแจ้งเตือน (notifications)
- [ ] รายรับ-รายจ่าย (income-expenses)
- [ ] ค่าใช้จ่ายส่วนกลาง (common-fees)
- [ ] เงินกองทุน (funds)
- [ ] งบประมาณ (budgets)
- [ ] เอกสาร (documents)
- [ ] สัญญา (contracts)
- [ ] จอดรถ (parking)
- [ ] อุปกรณ์ส่วนกลาง (facilities)
- [ ] ผู้เข้าเยี่ยม (visitors)
- [ ] รายงานต่างๆ (reports)

### **Pattern ในการแก้:**
```tsx
// 1. Import
import { useProjectContext } from "@/lib/contexts/project-context"
import { getCurrentUser } from "@/lib/utils/mock-auth"

// 2. Use context
const { selectedProjectId, selectedProject } = useProjectContext()
const currentUser = getCurrentUser()

// 3. Filter data
if (selectedProjectId && currentUser.role !== 'super_admin') {
  filteredData = allData.filter(item => item.project_id === selectedProjectId)
}

// 4. Reload on change
useEffect(() => {
  loadData()
}, [selectedProjectId])

// 5. Add project_id when saving
await saveData({
  ...formData,
  project_id: selectedProjectId
})
```

---

## ✅ Summary

แก้ไขหน้าห้องชุดแล้ว:

✅ **กรองข้อมูล** - เห็นเฉพาะห้องในโครงการที่เลือก  
✅ **Reload เมื่อสลับ** - useEffect trigger  
✅ **บันทึก project_id** - ห้องใหม่มี project_id  
✅ **Debug logs** - ตรวจสอบได้  

**ลองทดสอบใหม่:**
1. รีเฟรช
2. Login svs@email.com
3. เลือก ABCD → เห็นห้องของ ABCD
4. สลับเป็น SVS → เห็นห้องของ SVS เท่านั้น ✅

**โมดูลอื่นๆ ยังต้องแก้ไขเพิ่มเติม!** 🚀

