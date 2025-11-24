# Unit Number Unique Constraint Fix

## 🐛 ปัญหา

```
Error: duplicate key value violates unique constraint "units_unit_number_key"
```

**สาเหตุ:** `unit_number` เป็น unique ทั้งระบบ แต่จริงๆ ควรเป็น unique แค่ภายในโครงการเดียวกัน

**ตัวอย่าง:**
```
โครงการ ABCD: Unit 101 ✅
โครงการ SVS: Unit 101  ❌ Error! (ควรเป็น ✅)
```

---

## ✅ การแก้ไข

### **1. แก้ Database Constraint**

```sql
-- scripts/018_fix_unit_unique_constraint.sql

-- ลบ constraint เดิม
ALTER TABLE units DROP CONSTRAINT units_unit_number_key;

-- สร้าง composite unique constraint ใหม่
ALTER TABLE units ADD CONSTRAINT units_unit_number_project_unique 
  UNIQUE (unit_number, project_id);
```

**หมายความว่า:**
- ✅ โครงการ A มี Unit 101 ได้
- ✅ โครงการ B มี Unit 101 ได้ (ไม่ซ้ำกัน)
- ❌ โครงการ A มี Unit 101 ซ้ำ (ไม่ได้)

### **2. แก้ Duplicate Check ใน Frontend**

```tsx
// app/(admin)/units/page.tsx

// Before
const isDuplicate = units.some(unit => 
  unit.unit_number === formData.unitNumber  // ❌ เช็คทุก project
)

// After
const isDuplicate = units.some(unit => 
  unit.unit_number === formData.unitNumber && 
  unit.project_id === selectedProjectId  // ✅ เช็คแค่ project เดียวกัน
)
```

### **3. แก้ Error Message**

```tsx
// Before
description: "มีอยู่ในระบบแล้ว"  // ❌ ไม่ชัดเจน

// After  
description: "มีอยู่ในโครงการนี้แล้ว"  // ✅ ชัดเจนว่าซ้ำใน project
```

---

## 📊 ตัวอย่างการทำงาน

### **Before Fix:**

```
โครงการ ABCD:
  - เพิ่ม Unit 101 ✅ Success
  
โครงการ SVS:
  - เพิ่ม Unit 101 ❌ Error: duplicate key
  
ผลลัพธ์: ไม่สามารถมี Unit 101 ใน 2 โครงการได้
```

### **After Fix:**

```
โครงการ ABCD:
  - เพิ่ม Unit 101 ✅ Success
  - เพิ่ม Unit 101 อีก ❌ Error (ซ้ำในโครงการเดียวกัน)
  - เพิ่ม Unit 102 ✅ Success
  
โครงการ SVS:
  - เพิ่ม Unit 101 ✅ Success (ไม่ซ้ำกับ ABCD)
  - เพิ่ม Unit 101 อีก ❌ Error (ซ้ำในโครงการเดียวกัน)
  - เพิ่ม Unit 201 ✅ Success
  
ผลลัพธ์: แต่ละโครงการมี Unit 101 ได้แยกกัน ✅
```

---

## 🗄️ Database Schema

### **Before:**
```sql
CREATE TABLE units (
  id UUID PRIMARY KEY,
  unit_number TEXT UNIQUE,  -- ❌ unique ทั้งระบบ
  ...
);
```

### **After:**
```sql
CREATE TABLE units (
  id UUID PRIMARY KEY,
  unit_number TEXT NOT NULL,
  project_id UUID REFERENCES projects(id),
  ...
  CONSTRAINT units_unit_number_project_unique 
    UNIQUE (unit_number, project_id)  -- ✅ unique ต่อ project
);
```

---

## 🚀 Migration Steps

### **Step 1: Run SQL Script**
```bash
psql -U postgres -d postgres -f scripts\018_fix_unit_unique_constraint.sql
```

**Expected Output:**
```
NOTICE: Dropped old unique constraint: units_unit_number_key
NOTICE: Created composite unique constraint: units_unit_number_project_unique
NOTICE: ====================================
NOTICE: Unit Number Constraint Fixed
NOTICE: Now allows same unit_number in different projects
NOTICE: ====================================
```

### **Step 2: Test**
```bash
1. รีเฟรชเว็บ

2. Login svs@email.com

3. เลือกโครงการ ABCD

4. เพิ่ม Unit 101
   → ✅ บันทึกสำเร็จ

5. เพิ่ม Unit 101 อีก (ในโครงการ ABCD)
   → ❌ Error: "มีอยู่ในโครงการนี้แล้ว"

6. สลับเป็นโครงการ SVS

7. เพิ่ม Unit 101 (ในโครงการ SVS)
   → ✅ บันทึกสำเร็จ! (ไม่ซ้ำกับ ABCD)

8. ✅ Success!
```

---

## 📋 Files

### **New:**
1. `scripts/018_fix_unit_unique_constraint.sql`
   - ลบ `units_unit_number_key`
   - สร้าง `units_unit_number_project_unique`

### **Updated:**
2. `app/(admin)/units/page.tsx`
   - แก้ duplicate check
   - เช็คแค่ภายใน project

3. `lib/supabase/actions.ts`
   - เพิ่ม error handling
   - เพิ่ม debug logs

---

## ✅ Summary

✅ **Unique Constraint แก้แล้ว** - unit_number + project_id  
✅ **Frontend Check แก้แล้ว** - เช็คแค่ใน project  
✅ **Error Message ชัดเจน** - "ในโครงการนี้"  

**ระบบพร้อมใช้งาน:**
- Unit 101 ใน Project A ✅
- Unit 101 ใน Project B ✅
- Unit 101 ซ้ำใน Project A ❌

**รันสคริปต์ 018 แล้วทดสอบครับ! 🚀**
