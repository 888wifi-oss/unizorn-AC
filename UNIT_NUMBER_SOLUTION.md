# Unit Number Solution - แก้ปัญหา Unique Constraint

## 🐛 ปัญหา

```
Error: duplicate key value violates unique constraint "units_unit_number_key"

ไม่สามารถลบ constraint ได้เพราะมีตารางอื่น depend:
- parcels_unit_number_fkey
- parcel_authorizations_authorized_by_unit_number_fkey  
- files_unit_number_fkey
- file_permissions_unit_number_fkey
- file_downloads_unit_number_fkey
```

**ความต้องการ:** เลขห้องซ้ำได้ในต่างโครงการ

---

## ✅ วิธีแก้ (Workaround)

เนื่องจากลบ constraint เดิมไม่ได้ จึงใช้วิธี **Prefix unit_number ด้วย Project Code**

### **Schema:**
```sql
-- เพิ่ม column ใหม่
ALTER TABLE units ADD COLUMN display_unit_number TEXT;

-- unit_number: เก็บแบบ unique (มี prefix)
-- display_unit_number: เก็บเลขเดิมสำหรับแสดงผล
```

### **ตัวอย่าง:**

| Project | Input | unit_number (DB) | display_unit_number | แสดงให้ผู้ใช้เห็น |
|---------|-------|------------------|---------------------|-------------------|
| ABCD | 101 | ABCD-101 | 101 | 101 |
| SVS | 101 | SVS-101 | 101 | 101 |
| ABCD | 102 | ABCD-102 | 102 | 102 |

**ผลลัพธ์:**
- ✅ `unit_number` unique ทั้งระบบ (ABCD-101 ≠ SVS-101)
- ✅ `display_unit_number` ซ้ำได้ (101 = 101)
- ✅ ผู้ใช้เห็นแค่เลขห้องจริง (101)

---

## 📝 Implementation

### **1. Database Migration**

```sql
-- scripts/017_add_project_id_to_tables.sql (updated)

-- เพิ่ม project_id
ALTER TABLE units ADD COLUMN project_id UUID REFERENCES projects(id);

-- เพิ่ม display_unit_number
ALTER TABLE units ADD COLUMN display_unit_number TEXT;
```

### **2. Frontend - Save Logic**

```tsx
// app/(admin)/units/page.tsx

const handleSave = async () => {
  // สร้าง unique unit_number โดย prefix ด้วย project code
  const projectCode = selectedProject?.code || selectedProject?.slug || 'PROJ'
  const uniqueUnitNumber = editingUnit?.unit_number || `${projectCode}-${formData.unitNumber}`
  
  const unit = {
    unit_number: uniqueUnitNumber,           // ABCD-101 (unique)
    display_unit_number: formData.unitNumber, // 101 (for display)
    project_id: selectedProjectId,
    ...otherFields
  }
  
  await saveUnitToDB(unit)
}
```

### **3. Frontend - Display Logic**

```tsx
// แสดงในตาราง
<TableCell>
  {unit.display_unit_number || unit.unit_number}
</TableCell>

// แสดงใน form (edit)
setFormData({
  unitNumber: unit.display_unit_number || unit.unit_number
})

// ค้นหา
const filteredUnits = units.filter(unit =>
  (unit.display_unit_number || unit.unit_number).includes(searchTerm)
)

// Export
exportData = units.map(unit => ({
  เลขห้อง: unit.display_unit_number || unit.unit_number
}))
```

---

## 🔄 Data Flow

### **Create Unit:**
```
User Input: 101
  ↓
Frontend: 
  projectCode = "ABCD"
  uniqueUnitNumber = "ABCD-101"
  ↓
Database:
  unit_number = "ABCD-101"  ← unique ทั้งระบบ ✅
  display_unit_number = "101"  ← เก็บเลขเดิม
  project_id = "ABCD-project-id"
  ↓
Display:
  Show: "101"  ← แสดงเลขเดิม
```

### **Different Projects:**
```
Project ABCD:
  Input: 101
  DB: unit_number = "ABCD-101" ✅
  Display: "101"

Project SVS:
  Input: 101
  DB: unit_number = "SVS-101" ✅ (ไม่ซ้ำกับ ABCD-101)
  Display: "101"
```

---

## 🧪 Testing

### **Test 1: สร้างห้องซ้ำในต่างโครงการ**
```bash
1. รันสคริปต์:
   psql -f scripts\017_add_project_id_to_tables.sql

2. Login svs@email.com

3. เลือกโครงการ ABCD

4. เพิ่ม Unit 101
   Console:
   [Units] Unique unit_number: ABCD-101
   → ✅ บันทึกสำเร็จ

5. สลับเป็นโครงการ SVS

6. เพิ่ม Unit 101
   Console:
   [Units] Unique unit_number: SVS-101
   → ✅ บันทึกสำเร็จ! (ไม่ error)

7. ตารางแสดง:
   เลขห้อง: 101  ← แสดงเลขเดิม
   (ไม่แสดง SVS-101)
```

### **Test 2: เช็คห้องซ้ำในโครงการเดียวกัน**
```bash
1. อยู่ในโครงการ ABCD

2. เพิ่ม Unit 102 ✅

3. เพิ่ม Unit 102 อีก
   → ❌ "มีอยู่ในโครงการนี้แล้ว"

4. ✅ ทำงานถูกต้อง
```

### **Test 3: Edit Unit**
```bash
1. มี Unit ABCD-101 (display: 101)

2. คลิก Edit
   → Form แสดง: 101  ✅ (ไม่แสดง ABCD-101)

3. แก้เป็น 102
   → unit_number ยังเป็น ABCD-101
   → display_unit_number = 102
   → แสดง: 102 ✅
```

---

## 📁 Files

### **Updated:**
1. `scripts/017_add_project_id_to_tables.sql`
   - เพิ่ม `display_unit_number` column

2. `scripts/018_fix_unit_unique_constraint.sql`
   - แสดง warning เกี่ยวกับ constraint

3. `app/(admin)/units/page.tsx`
   - สร้าง unique unit_number ด้วย prefix
   - เก็บเลขเดิมใน display_unit_number
   - แสดง display_unit_number ให้ผู้ใช้

4. `UNIT_NUMBER_SOLUTION.md` (this file)

---

## ⚠️ Future Improvements

### **Option 1: Migrate Foreign Keys (Recommended)**
```sql
-- Change from unit_number to unit_id
ALTER TABLE parcels DROP CONSTRAINT parcels_unit_number_fkey;
ALTER TABLE parcels ADD COLUMN unit_id UUID REFERENCES units(id);

-- Migrate data
UPDATE parcels p SET unit_id = u.id 
FROM units u WHERE p.unit_number = u.unit_number;

-- Drop old column
ALTER TABLE parcels DROP COLUMN unit_number;
```

### **Option 2: Use Composite Foreign Keys**
```sql
ALTER TABLE parcels ADD CONSTRAINT parcels_unit_fkey 
  FOREIGN KEY (unit_number, project_id) 
  REFERENCES units(unit_number, project_id);
```

---

## ✅ Summary

**Current Solution:**
✅ ใช้ Prefix (project_code-unit_number) ทำให้ unique  
✅ เก็บเลขเดิมใน display_unit_number  
✅ แสดงเลขเดิมให้ผู้ใช้  
✅ เลขห้องซ้ำได้ในต่างโครงการ  

**Tradeoffs:**
- ⚠️ unit_number ใน DB ยาวขึ้น (ABCD-101 แทน 101)
- ⚠️ ต้องแสดง display_unit_number แทน unit_number
- ✅ แต่ใช้งานได้ทันที ไม่ต้อง migrate foreign keys

**รันสคริปต์แล้วทดสอบครับ! 🚀**


