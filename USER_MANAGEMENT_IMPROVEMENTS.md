# User Management Improvements - สรุปการปรับปรุง

## 🎯 ภาพรวม

ปรับปรุงระบบจัดการผู้ใช้และกลุ่มผู้ใช้งานให้มีความปลอดภัยและใช้งานง่ายขึ้น

---

## ✨ Features ที่เพิ่ม

### **1. เพิ่ม Password Field ในการสร้างผู้ใช้**
✅ กำหนดรหัสผ่านตอนสร้าง User ใหม่  
✅ Required field - ต้องกรอกทุกครั้ง  
✅ แสดงคำแนะนำ "ควรมีความยาวอย่างน้อย 8 ตัวอักษร"  

### **2. Reset Password สำหรับ Admin**
✅ Admin สามารถรีเซ็ตรหัสผ่านให้ผู้ใช้ได้  
✅ ปุ่ม Reset Password ในตารางรายชื่อผู้ใช้  
✅ Dialog สำหรับกรอกรหัสผ่านใหม่  
✅ แสดงคำเตือนก่อนรีเซ็ต  

### **3. กรองรายชื่อผู้ใช้ตาม Scope**
✅ **Super Admin** - เห็นผู้ใช้ทั้งหมด  
✅ **Company Admin** - เห็นเฉพาะผู้ใช้ในบริษัทที่ดูแล  
✅ **Project Admin** - เห็นเฉพาะผู้ใช้ในโครงการที่ดูแล  

### **4. ปรับ UI กลุ่มผู้ใช้งาน**
✅ ย้ายปุ่ม "เพิ่มทั้งหมด" ขึ้นด้านบน  
✅ มองเห็นได้ง่ายโดยไม่ต้องเลื่อนหน้าจอ  
✅ เพิ่ม ScrollArea สูงขึ้น (360px)  

---

## 📋 รายละเอียดการปรับปรุง

### **1. สร้างผู้ใช้ใหม่**

#### **Before:**
```tsx
<Input id="email" ... />
<Input id="full_name" ... />
<Input id="phone" ... />
[สร้างผู้ใช้]
```

#### **After:**
```tsx
<Input id="email" ... />
<Input id="full_name" ... />
<Input id="phone" ... />
<Input id="password" type="password" ... />  ✅ เพิ่มใหม่
<p className="text-xs">รหัสผ่านสำหรับเข้าสู่ระบบ...</p>
[สร้างผู้ใช้]
```

**Validation:**
```typescript
if (!userFormData.email || !userFormData.full_name || !userFormData.password) {
  // Error: ต้องกรอก Email, ชื่อ และรหัสผ่าน
}
```

---

### **2. Reset Password**

#### **UI Changes:**

**ปุ่มในตาราง:**
```tsx
<Button title="รีเซ็ตรหัสผ่าน" onClick={() => openResetDialog(user)}>
  <Edit className="w-4 h-4" />
</Button>
```

**Dialog:**
```
┌────────────────────────────────────┐
│ รีเซ็ตรหัสผ่าน                      │
│ กำหนดรหัสผ่านใหม่สำหรับ นายสมชาย   │
├────────────────────────────────────┤
│ รหัสผ่านใหม่ *                      │
│ [••••••••]                         │
│ ℹ️ ควรมีความยาวอย่างน้อย 8 ตัวฯ    │
│                                    │
│ ⚠️ คำเตือน: ผู้ใช้จะต้องใช้รหัสฯ  │
│    นี้ในการเข้าสู่ระบบครั้งถัดไป    │
│                                    │
│ [รีเซ็ตรหัสผ่าน] [ยกเลิก]          │
└────────────────────────────────────┘
```

#### **Server Action:**
```typescript
// lib/actions/user-role-actions.ts
export async function resetUserPassword(
  adminUserId: string, 
  targetUserId: string, 
  newPassword: string
) {
  // 1. Check admin permission
  const check = await checkPermission(adminUserId, 'users.update')
  
  // 2. Update password
  await supabase
    .from('users')
    .update({ password: newPassword })
    .eq('id', targetUserId)
  
  return { success: true }
}
```

---

### **3. กรองรายชื่อผู้ใช้**

#### **Logic Flow:**

```typescript
export async function getUsers(userId: string) {
  // 1. Check if Super Admin
  const isSuperAdmin = await checkRole(userId, 'super_admin')
  
  if (isSuperAdmin) {
    // Return ALL users
    return await supabase.from('users').select('*')
  }
  
  // 2. Get accessible projects
  const accessibleProjectIds = await getUserAccessibleProjects(userId)
  
  // 3. Get users in those projects
  const userRolesData = await supabase
    .from('user_roles')
    .select('user_id')
    .in('project_id', accessibleProjectIds)
  
  const accessibleUserIds = [...new Set(userRolesData.map(ur => ur.user_id))]
  
  // 4. Return filtered users
  return await supabase
    .from('users')
    .select('*')
    .in('id', accessibleUserIds)
}
```

#### **ตัวอย่าง:**

**Super Admin:**
```
Projects: ALL
Users visible: ทุกคน (100 users)
```

**Company Admin (Company A):**
```
Projects: P1, P2, P3 (ของ Company A)
Users in P1: User1, User2, User3
Users in P2: User2, User4
Users in P3: User5
Users visible: User1, User2, User3, User4, User5 (5 users)
```

**Project Admin (Project P1):**
```
Projects: P1 only
Users in P1: User1, User2, User3
Users visible: User1, User2, User3 (3 users)
```

---

### **4. ปรับ UI กลุ่มผู้ใช้งาน**

#### **Before:**
```
┌────────────────────────────────────┐
│ ผู้ใช้ที่เพิ่มได้                  │
├────────────────────────────────────┤
│ [ค้นหา...]                         │
│                                    │
│ ☐ User 1                           │
│ ☐ User 2                           │
│ ☐ User 3                           │
│ ...                                │
│ ☐ User 20 ← ต้อง scroll ลงมา      │
│                                    │
│ [เพิ่มทั้งหมด (5)] ← มองไม่เห็น!  │
└────────────────────────────────────┘
```

#### **After:**
```
┌────────────────────────────────────┐
│ ผู้ใช้ที่เพิ่มได้  [เพิ่มทั้งหมด] │ ← ย้ายขึ้นบน ✅
├────────────────────────────────────┤
│ [ค้นหา...]                         │
│                                    │
│ ☐ User 1                           │
│ ☐ User 2                           │
│ ☐ User 3                           │
│ ...                                │
│ ☐ User 20                          │
│                                    │
└────────────────────────────────────┘
```

**Code Changes:**
```tsx
// components/group-assignment-dialog.tsx

// Before
<h3>ผู้ใช้ที่เพิ่มได้</h3>
<Input ... />
<ScrollArea h-[320px]>
  {/* users */}
</ScrollArea>
<Button>เพิ่มทั้งหมด</Button>  ← ด้านล่าง

// After
<div className="flex justify-between">
  <h3>ผู้ใช้ที่เพิ่มได้</h3>
  <Button>เพิ่มทั้งหมด</Button>  ← ด้านบน ✅
</div>
<Input ... />
<ScrollArea h-[360px]>  ← เพิ่มความสูง +40px
  {/* users */}
</ScrollArea>
```

---

## 📁 Files Changed

### **New:**
1. `USER_MANAGEMENT_IMPROVEMENTS.md` - เอกสารนี้

### **Updated:**
2. **`lib/actions/user-role-actions.ts`**
   - เพิ่ม `resetUserPassword()` server action
   - แก้ `getUsers()` ให้กรองตาม scope
   - Import `getUserAccessibleProjects`

3. **`app/(admin)/user-management/page.tsx`**
   - เพิ่ม password field ใน Create User form
   - เพิ่ม state สำหรับ Reset Password dialog
   - เพิ่ม `handleResetPassword()` function
   - เพิ่มปุ่ม Reset Password ในตาราง
   - เพิ่ม Reset Password Dialog

4. **`components/group-assignment-dialog.tsx`**
   - ย้ายปุ่ม "เพิ่มทั้งหมด" ขึ้นด้านบน
   - เพิ่ม ScrollArea height เป็น 360px

---

## 🧪 Testing Guide

### **Test 1: Create User with Password**
```
1. เข้า "จัดการผู้ใช้และสิทธิ์"
2. คลิก "เพิ่มผู้ใช้"
3. กรอก:
   - Email: test@test.com
   - ชื่อ: ทดสอบ
   - รหัสผ่าน: test1234
4. คลิก "สร้างผู้ใช้"
5. ✅ สร้างสำเร็จ

6. ไปหน้า Login
7. Login ด้วย test@test.com / test1234
8. ✅ เข้าสู่ระบบสำเร็จ
```

### **Test 2: Reset Password**
```
1. Login as Super Admin
2. เข้า "จัดการผู้ใช้และสิทธิ์"
3. คลิกปุ่ม [✏️] ข้าง User
4. ✅ Dialog "รีเซ็ตรหัสผ่าน" เปิดขึ้น
5. กรอกรหัสผ่านใหม่: newpass123
6. คลิก "รีเซ็ตรหัสผ่าน"
7. ✅ แสดง "รีเซ็ตรหัสผ่านสำเร็จ"

8. Logout
9. Login ด้วยรหัสผ่านเก่า
10. ❌ ล้มเหลว

11. Login ด้วยรหัสผ่านใหม่ (newpass123)
12. ✅ เข้าสู่ระบบสำเร็จ
```

### **Test 3: User Filtering (Super Admin)**
```
1. Login as Super Admin
2. เข้า "จัดการผู้ใช้และสิทธิ์"
3. ✅ เห็นผู้ใช้ทั้งหมด (เช่น 50 users)
4. ดู users จากทุกบริษัท/โครงการ
```

### **Test 4: User Filtering (Company Admin)**
```
1. Login as Company Admin (Company A)
2. เข้า "จัดการผู้ใช้และสิทธิ์"
3. ✅ เห็นเฉพาะ users ในบริษัท A (เช่น 10 users)
4. ❌ ไม่เห็น users จากบริษัท B
```

### **Test 5: User Filtering (Project Admin)**
```
1. Login as Project Admin (Project P1, P3)
2. เข้า "จัดการผู้ใช้และสิทธิ์"
3. ✅ เห็นเฉพาะ users ใน P1 และ P3 (เช่น 5 users)
4. ❌ ไม่เห็น users จาก P2, P4
```

### **Test 6: Add Members Button Position**
```
1. เข้า "กลุ่มผู้ใช้งาน"
2. เลือกโครงการ
3. คลิก [👥] "จัดการสมาชิก" ในกลุ่มใดก็ได้
4. ✅ Dialog เปิดขึ้น
5. ✅ ปุ่ม "เพิ่มทั้งหมด" อยู่ด้านบนขวา
6. ✅ มองเห็นชัดเจนโดยไม่ต้อง scroll
7. เลือก users (checkbox)
8. ✅ ตัวเลขในปุ่มเปลี่ยน เช่น "เพิ่มทั้งหมด (3)"
9. คลิก "เพิ่มทั้งหมด"
10. ✅ เพิ่มสำเร็จ
```

---

## ⚠️ Security Considerations

### **Password Storage**
```
🔴 ปัจจุบัน: Plain Text (สำหรับทดสอบ)
✅ Production: ต้องใช้ bcrypt/argon2

// Production code
import bcrypt from 'bcrypt'

const hashedPassword = await bcrypt.hash(password, 10)
await supabase.from('users').insert({ 
  password: hashedPassword  // เก็บแบบ hashed
})

// Verify
const isValid = await bcrypt.compare(inputPassword, hashedPassword)
```

### **Permission Checks**
```typescript
// ✅ ตรวจสอบก่อนทุก action
const check = await checkPermission(adminUserId, 'users.update')
if (!check.allowed) {
  return { error: 'Access denied' }
}
```

### **Scope Filtering**
```typescript
// ✅ กรองที่ server-side
export async function getUsers(userId: string) {
  // Filter based on user's accessible projects
  const projects = await getUserAccessibleProjects(userId)
  // ...
}

// ❌ ห้ามกรองที่ client-side เพียงอย่างเดียว
```

---

## 🎯 Benefits

### **1. Security**
✅ กรอง Users ตาม scope - ป้องกันการเห็นข้อมูลที่ไม่ควรเห็น  
✅ Permission checks - ตรวจสอบสิทธิ์ทุกครั้ง  
✅ Reset Password - Admin ช่วย users ที่ลืมรหัสผ่านได้  

### **2. User Experience**
✅ Password field ชัดเจน - รู้ว่าต้องกำหนดรหัสผ่าน  
✅ ปุ่มเพิ่มสมาชิกอยู่ด้านบน - ใช้งานสะดวก  
✅ คำแนะนำครบถ้วน - ช่วยลด errors  

### **3. Admin Productivity**
✅ Reset Password ง่าย - ไม่ต้องสร้าง user ใหม่  
✅ เห็นเฉพาะ users ที่เกี่ยวข้อง - ไม่วุ่นวาย  
✅ Multi-project assignment - มอบหมายได้หลายโครงการ  

---

## 🚀 Next Steps (Optional)

### **1. Password Strength Meter**
```tsx
<PasswordInput 
  value={password}
  onChange={setPassword}
  showStrengthMeter
/>
// แสดงความแข็งแรงของรหัสผ่าน
```

### **2. Password History**
```sql
CREATE TABLE password_history (
  user_id UUID,
  password_hash TEXT,
  changed_at TIMESTAMP
);
-- ป้องกันใช้รหัสผ่านเดิม
```

### **3. Force Password Change**
```typescript
user.password_expires_at < Date.now()
// บังคับเปลี่ยนรหัสผ่านหลัง 90 วัน
```

### **4. Audit Log**
```typescript
await logAction({
  userId: adminUserId,
  action: 'reset_password',
  targetUserId: targetUserId,
  timestamp: new Date()
})
// บันทึกการรีเซ็ตรหัสผ่าน
```

---

## ✅ Summary

✅ **เพิ่ม Password Field** - สร้าง user พร้อมรหัสผ่าน  
✅ **Reset Password** - Admin ช่วย users ได้  
✅ **กรอง Users** - ตาม scope ของแต่ละ role  
✅ **ปรับ UI** - ปุ่มเพิ่มสมาชิกอยู่ด้านบน  

**ระบบปลอดภัยและใช้งานง่ายขึ้นแล้ว! 🎊**

