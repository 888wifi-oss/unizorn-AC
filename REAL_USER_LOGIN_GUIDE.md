# Real User Login System Guide

## 🔐 ภาพรวม

เปลี่ยนจากระบบ Mock Authentication เป็นระบบที่ใช้ข้อมูล Users จริงจากฐานข้อมูล พร้อม Email/Password Authentication (แบบง่าย ยังไม่เข้ารหัส)

---

## ✨ Features

### **1. Login with Email/Password**
- ✅ ใช้ Email และ Password จากฐานข้อมูล
- ✅ ตรวจสอบข้อมูลจากตาราง `users`
- ✅ แสดง Error message ชัดเจน
- ✅ รองรับการ Show/Hide Password

### **2. Quick Select (Dev Mode)**
- ✅ แสดงรายการ Users จากฐานข้อมูล
- ✅ เลือก User ได้โดยไม่ต้องใส่รหัสผ่าน
- ✅ สำหรับ Developer ในการทดสอบเท่านั้น

### **3. Real User Data**
- ✅ ดึงข้อมูลจาก `users` table
- ✅ แสดง Role จาก `user_roles`
- ✅ กรองเฉพาะ User ที่ `is_active = true`

---

## 🎨 UI Features

### **Tab 1: Login (Email/Password)**
```
┌────────────────────────────────────┐
│ Email                              │
│ ┌────────────────────────────────┐ │
│ │ your@email.com                 │ │
│ └────────────────────────────────┘ │
│                                    │
│ Password                           │
│ ┌────────────────────────────────┐ │
│ │ ••••••••              [👁]     │ │
│ └────────────────────────────────┘ │
│                                    │
│ [เข้าสู่ระบบ]                      │
│                                    │
│ 💡 ทดสอบระบบ: ใช้ Email ของผู้ใช้  │
│    ในระบบและรหัสผ่านที่กำหนดไว้    │
└────────────────────────────────────┘
```

### **Tab 2: Quick Select (Dev Mode)**
```
┌────────────────────────────────────┐
│ ┌────────────────────────────────┐ │
│ │ 👑 นายสมชาย ใจดี               │ │
│ │ superadmin@unizorn.com         │ │
│ │ [Super Admin]                  │ │
│ └────────────────────────────────┘ │
│                                    │
│ ┌────────────────────────────────┐ │
│ │ 👔 นางสาวสมหญิง รักษ์ดี        │ │
│ │ company@example.com            │ │
│ │ [Company Admin]                │ │
│ └────────────────────────────────┘ │
│                                    │
│ [เข้าสู่ระบบด่วน]                  │
│                                    │
│ ⚠️ โหมด Dev: สำหรับทดสอบเท่านั้น │
└────────────────────────────────────┘
```

---

## 🚀 การใช้งาน

### **วิธีที่ 1: Login ด้วย Email/Password**

```bash
1. เปิดเว็บ → Redirect to /login
2. อยู่ที่ Tab "Login"
3. กรอก Email: superadmin@unizorn.com
4. กรอก Password: admin123
5. คลิก "เข้าสู่ระบบ"
6. ✅ Login สำเร็จ
7. Redirect to /companies
```

### **วิธีที่ 2: Quick Select (Dev Mode)**

```bash
1. อยู่ที่หน้า /login
2. คลิกที่ Tab "Quick Select (Dev)"
3. คลิกเลือก User Card
4. คลิก "เข้าสู่ระบบด่วน"
5. ✅ Login สำเร็จ (ข้าม Password)
6. Redirect to /companies
```

---

## 🗄️ Database Schema

### **Users Table (Updated)**

```sql
ALTER TABLE users ADD COLUMN password TEXT;

-- Default passwords for testing
UPDATE users SET password = 'password' WHERE password IS NULL;

-- Specific passwords for demo users
UPDATE users SET password = 'admin123' WHERE email = 'superadmin@unizorn.com';
UPDATE users SET password = 'company123' WHERE email = 'company@example.com';
UPDATE users SET password = 'project123' WHERE email = 'project@example.com';
UPDATE users SET password = 'staff123' WHERE email = 'staff@example.com';
```

---

## 🔑 Default Passwords

### **Demo Users:**

| Email | Password | Role |
|-------|----------|------|
| superadmin@unizorn.com | `admin123` | Super Admin |
| company@example.com | `company123` | Company Admin |
| project@example.com | `project123` | Project Admin |
| staff@example.com | `staff123` | Staff |
| อื่นๆ | `password` | ตาม Role ที่กำหนด |

---

## 📡 Server Actions

### **1. getLoginUsers()**

ดึงรายการ Users ทั้งหมดที่ active สำหรับ Quick Select

```typescript
// lib/actions/auth-actions.ts
export async function getLoginUsers() {
  const { data, error } = await supabase
    .from('users')
    .select(`
      id, email, full_name, phone,
      user_roles!inner(
        role:roles(id, name, display_name, level)
      )
    `)
    .eq('is_active', true)
    .order('full_name')
  
  return { success: true, users }
}
```

### **2. loginUser(email, password)**

ตรวจสอบ Email/Password และ Return user data

```typescript
export async function loginUser(email: string, password: string) {
  // Get user by email
  const { data: users } = await supabase
    .from('users')
    .select(`
      id, email, full_name, phone, password,
      user_roles!inner(role:roles(*))
    `)
    .eq('email', email)
    .eq('is_active', true)
    .limit(1)
  
  if (!users || users.length === 0) {
    return { success: false, error: 'ไม่พบผู้ใช้นี้ในระบบ' }
  }
  
  const user = users[0]
  
  // Simple password check (no encryption yet)
  if (user.password !== password) {
    return { success: false, error: 'รหัสผ่านไม่ถูกต้อง' }
  }
  
  return { success: true, user: {...} }
}
```

### **3. getUserById(userId)**

ดึงข้อมูล User จาก ID (สำหรับ getCurrentUser)

```typescript
export async function getUserById(userId: string) {
  const { data: users } = await supabase
    .from('users')
    .select(`
      id, email, full_name, phone,
      user_roles!inner(role:roles(*))
    `)
    .eq('id', userId)
    .eq('is_active', true)
    .limit(1)
  
  return { success: true, user }
}
```

---

## 🔄 Authentication Flow

### **Login Flow (Email/Password)**

```typescript
// 1. User กรอก Email/Password
handleLoginWithPassword() {
  // Validate input
  if (!email || !password) {
    return error
  }
  
  // Call server action
  const result = await dbLoginUser(email, password)
  
  // Check result
  if (result.success) {
    // Save to localStorage
    saveLoginUser(result.user)
    
    // Redirect to /companies
    window.location.href = '/companies'
  } else {
    // Show error
    toast(result.error)
  }
}
```

### **Quick Login Flow (Dev Mode)**

```typescript
// 1. User เลือก User Card
handleQuickLogin() {
  const user = users.find(u => u.id === selectedUserId)
  
  // Save to localStorage (ข้าม password check)
  saveLoginUser(user)
  
  // Redirect
  window.location.href = '/companies'
}
```

### **Storage (localStorage)**

```typescript
// Save user data
localStorage.setItem('current_user', JSON.stringify(user))
localStorage.setItem('mock_user_id', user.id)

// Get user data
const userData = localStorage.getItem('current_user')
const user = JSON.parse(userData)
```

---

## 🧪 Testing

### **Test 1: Login with Correct Password**
```
Given: Email: superadmin@unizorn.com, Password: admin123
When: คลิก "เข้าสู่ระบบ"
Then:
  ✅ แสดง "เข้าสู่ระบบสำเร็จ"
  ✅ Redirect to /companies
  ✅ Sidebar แสดงชื่อ "Super Admin"
```

### **Test 2: Login with Wrong Password**
```
Given: Email: superadmin@unizorn.com, Password: wrong123
When: คลิก "เข้าสู่ระบบ"
Then:
  ❌ แสดง "รหัสผ่านไม่ถูกต้อง"
  ❌ ไม่ redirect
  ❌ ยังอยู่ที่หน้า login
```

### **Test 3: Login with Non-existent Email**
```
Given: Email: notexist@test.com, Password: any
When: คลิก "เข้าสู่ระบบ"
Then:
  ❌ แสดง "ไม่พบผู้ใช้นี้ในระบบ"
  ❌ ไม่ redirect
```

### **Test 4: Quick Select (Dev Mode)**
```
Given: อยู่ที่ Tab "Quick Select"
When: เลือก User และคลิก "เข้าสู่ระบบด่วน"
Then:
  ✅ Login สำเร็จโดยไม่ต้องใส่ password
  ✅ Redirect to /companies
```

### **Test 5: Real Users from Database**
```
Given: เพิ่ม User ใหม่ในฐานข้อมูล
When: เปิดหน้า login ใหม่
Then:
  ✅ เห็น User ใหม่ใน Quick Select
  ✅ สามารถ login ด้วย email/password ได้
```

---

## ⚠️ Security Notes

### **⚠️ For Testing Only**

```
🔴 รหัสผ่านเก็บแบบ Plain Text (ไม่ได้เข้ารหัส)
🔴 ไม่มี Rate Limiting (ป้องกัน Brute Force)
🔴 ไม่มี CSRF Protection
🔴 ไม่มี Session Management
🔴 ไม่มี Password Reset
```

### **✅ For Production**

จะต้องเพิ่ม:

1. **Password Hashing**
   ```typescript
   import bcrypt from 'bcrypt'
   
   // Hash password
   const hashedPassword = await bcrypt.hash(password, 10)
   
   // Verify password
   const isValid = await bcrypt.compare(password, hashedPassword)
   ```

2. **JWT Tokens**
   ```typescript
   import jwt from 'jsonwebtoken'
   
   // Generate token
   const token = jwt.sign({ userId: user.id }, SECRET_KEY, { expiresIn: '1d' })
   
   // Verify token
   const decoded = jwt.verify(token, SECRET_KEY)
   ```

3. **Rate Limiting**
   ```typescript
   // Limit login attempts
   if (failedAttempts > 5) {
     return { error: 'Too many failed attempts. Try again later.' }
   }
   ```

4. **Session Management**
   ```typescript
   // Use Supabase Auth or NextAuth.js
   import { supabaseAuth } from '@/lib/supabase/client'
   
   const { data, error } = await supabaseAuth.signInWithPassword({
     email,
     password
   })
   ```

---

## 📁 Files

### **New Files:**
- `lib/actions/auth-actions.ts` - Server actions for authentication
- `scripts/016_add_password_field.sql` - Add password column

### **Updated Files:**
- `app/login/page.tsx` - Login UI with Email/Password + Quick Select
- `lib/utils/mock-auth.ts` - Updated to use real user data
- `components/user-switcher.tsx` - Load users from database

---

## 🎯 Migration Steps

### **1. Run SQL Script**
```bash
# Add password field to users table
psql -U postgres -d your_database -f scripts/016_add_password_field.sql
```

### **2. Test Login**
```bash
# Method 1: Email/Password
Email: superadmin@unizorn.com
Password: admin123

# Method 2: Quick Select
เลือก User จาก list
```

### **3. Add More Users**
```sql
INSERT INTO users (email, full_name, phone, password, is_active)
VALUES ('newuser@test.com', 'นายใหม่ ทดสอบ', '099-999-9999', 'password123', true);

-- Assign role
INSERT INTO user_roles (user_id, role_id, is_active)
VALUES ('user-id', 'role-id', true);
```

---

## ✅ Summary

ระบบใหม่:
✅ **ใช้ข้อมูลจริงจากฐานข้อมูล**  
✅ **Login ด้วย Email/Password**  
✅ **ยังมี Quick Select สำหรับ Dev**  
✅ **แสดง Users ที่ active เท่านั้น**  
✅ **รองรับการเพิ่ม User ใหม่ได้ทันที**  

**พร้อมทดสอบและพัฒนาต่อได้เลย! 🚀**

⚠️ **Remember:** ยังไม่เหมาะสำหรับ Production ต้องเพิ่ม Security Features ก่อน!

