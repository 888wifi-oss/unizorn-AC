# Fix: ไม่สามารถบันทึกสิทธิ์กลุ่มได้

## 🐛 ปัญหา:
```
เมื่อกดปุ่ม "💾 บันทึกสิทธิ์" → ระบบไม่บันทึก
```

## 🔍 วิธี Debug:

### **1. เปิด Console (F12)**
```
1. กด F12 → เปิด Developer Tools
2. ไปที่แท็บ "Console"
3. ลองกดปุ่ม "💾 บันทึกสิทธิ์"
4. ดู Log ที่แสดง:

Expected Logs:
  ✅ "Saving permissions for group: <group-id>"
  ✅ "Permissions to save: [...]"
  ✅ "Filtered permissions (can_access=true): [...]"
  ✅ "Save result: { success: true/false, ... }"

ถ้าเห็น Error:
  ❌ ให้คัดลอก error message มาแจ้ง
```

---

## 🧪 ขั้นตอนทดสอบ:

### **Test 1: ตรวจสอบว่ามีกลุ่มหรือไม่**
```
1. เข้า "กลุ่มผู้ใช้งาน"
2. เลือกโครงการ
3. คลิกแท็บ "กลุ่มแนะนำ"
4. คลิก "สร้างกลุ่มนี้" ที่ "เจ้าหน้าที่บัญชี"
5. ✅ ควรเห็นกลุ่มในแท็บ "กลุ่มในโครงการนี้"
```

### **Test 2: เปิด Dialog กำหนดสิทธิ์**
```
1. เลือกกลุ่ม "เจ้าหน้าที่บัญชี"
2. คลิก [🛡] "กำหนดสิทธิ์"
3. ✅ Dialog ควรเปิดเต็มจอ
4. ดู Console → ควรไม่มี error
```

### **Test 3: เลือกโมดูล**
```
1. ขยาย Category "หลัก"
2. เลือก checkbox "เข้า" ที่ "ออกบิล"
3. ✅ Summary ควรอัปเดต: "1 / 30 โมดูล"
4. ดู Console → ไม่มี error
```

### **Test 4: บันทึก**
```
1. คลิกปุ่ม "💾 บันทึกสิทธิ์" (มุมขวาบน)
2. ดู Console ว่ามี Log อะไร:
   - "Saving permissions for group: ..."
   - "Permissions to save: ..."
   - "Filtered permissions: ..."
   - "Save result: ..."
3. ถ้า success → ควรเห็น toast "บันทึกสำเร็จ"
4. ถ้า error → ให้คัดลอก error message
```

---

## 🔧 สาเหตุที่เป็นไปได้:

### **1. ยังไม่รัน SQL Script**
```sql
-- ต้องรัน 2 scripts:
1. scripts/014_user_groups.sql
2. scripts/015_user_groups_multi_project.sql

ตรวจสอบ:
  SELECT * FROM user_groups;
  SELECT * FROM user_group_permissions;
  
ถ้าตารางไม่มี → รัน SQL scripts
```

### **2. Permissions Array รูปแบบไม่ถูกต้อง**
```typescript
// Expected format:
[
  {
    module: 'billing',
    can_access: true,
    can_view: true,
    can_add: true,
    can_edit: true,
    can_delete: false,
    can_print: true,
    can_export: true
  },
  ...
]

// Check in console:
console.log('Permissions to save:', groupPermissions)
```

### **3. Database RLS Policy**
```sql
-- ตรวจสอบว่ามี policy หรือไม่
SELECT * FROM pg_policies 
WHERE tablename = 'user_group_permissions';

ถ้าไม่มี → รัน SQL script อีกครั้ง
```

### **4. Supabase Connection Error**
```typescript
// ตรวจสอบการเชื่อมต่อ Supabase
// ดูใน Console หรือ Network tab

ถ้าเห็น 401/403 → authentication issue
ถ้าเห็น 404 → table not found
ถ้าเห็น 500 → server error
```

---

## 🛠️ วิธีแก้:

### **แก้ที่ 1: รัน SQL Scripts**
```bash
1. ไปที่ Supabase Dashboard
2. SQL Editor
3. รันตามลำดับ:
   a. scripts/014_user_groups.sql
   b. scripts/015_user_groups_multi_project.sql
4. ตรวจสอบว่าไม่มี error
```

### **แก้ที่ 2: ตรวจสอบ Action**
```typescript
// lib/actions/user-group-actions.ts
export async function setUserGroupPermissions(...)

// เพิ่ม console.log:
console.log('Setting permissions:', permissions)
console.log('For group:', groupId)

// ดู error
```

### **แก้ที่ 3: ตรวจสอบ Format**
```typescript
// ใน handleSavePermissions เพิ่ม:
const permissionsToSave = groupPermissions
  .filter(p => p.can_access)
  .map(p => ({
    module: p.module,
    can_access: p.can_access || false,
    can_view: p.can_view || false,
    can_add: p.can_add || false,
    can_edit: p.can_edit || false,
    can_delete: p.can_delete || false,
    can_print: p.can_print || false,
    can_export: p.can_export || false,
    can_approve: p.can_approve || false,
    can_assign: p.can_assign || false
  }))
```

---

## 📋 Checklist:

### **Database:**
- [ ] รัน `scripts/014_user_groups.sql`
- [ ] รัน `scripts/015_user_groups_multi_project.sql`
- [ ] ตรวจสอบว่า table `user_group_permissions` มีอยู่
- [ ] ตรวจสอบว่า RLS policies ถูกสร้าง

### **Code:**
- [ ] เปิด Console (F12)
- [ ] ลองบันทึกสิทธิ์
- [ ] ดู Log messages
- [ ] ดู Error messages (ถ้ามี)

### **Network:**
- [ ] เปิด Network tab
- [ ] ลองบันทึก
- [ ] ดู Request/Response
- [ ] เช็ค Status Code

---

## 💡 Quick Fix:

ลอง**รีเฟรชหน้าเว็บ (Ctrl+R)** แล้วทดสอบอีกครั้ง

ถ้ายังไม่ได้:
1. เปิด Console (F12)
2. ลองบันทึกสิทธิ์
3. **คัดลอก error message ทั้งหมดจาก Console** มาแจ้ง

**ฉันจะช่วยแก้ให้ทันทีครับ! 🚀**


