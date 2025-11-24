# Login/Logout System Guide

## 🔐 ภาพรวม

ระบบ Login/Logout แบบ Mock Authentication สำหรับการทดสอบระบบ Permission และ Security Features อย่างครบถ้วน

---

## ✨ Features

### **1. หน้า Login ที่สมจริง**
- ✅ UI/UX สวยงาม ดูเหมือนระบบจริง
- ✅ แสดงรายการผู้ใช้ทั้งหมด (6 Roles)
- ✅ เลือก User ได้จาก Card UI
- ✅ แสดงข้อมูล Role, Email, เบอร์โทร
- ✅ Simulation การ Login (มี Loading State)

### **2. Authentication Guard**
- ✅ Redirect ไป `/login` ถ้ายังไม่ Login
- ✅ Redirect ไป `/companies` ถ้า Login แล้ว
- ✅ Protected Routes (ทุกหน้าใน Admin)

### **3. Logout Feature**
- ✅ ปุ่ม "ออกจากระบบ" ใน Sidebar
- ✅ ปุ่ม "ออกจากระบบ" ในหน้า Login
- ✅ Clear session และ redirect ไป Login

### **4. User Switcher (Dev Mode)**
- ✅ ยังมี Dropdown มุมขวาบน (สำหรับ Dev)
- ✅ สลับ User ได้เร็วโดยไม่ต้อง Logout
- ✅ แสดงสถานะ "ปัจจุบัน"

---

## 🎨 หน้า Login

### **Layout**

```
┌────────────────────────────────────────────┐
│          🏢 Condo Pro Dashboard            │
│      ระบบจัดการคอนโดมิเนียมครบวงจร         │
├────────────────────────────────────────────┤
│                                            │
│  [ถ้ายังไม่ Login]                         │
│  เลือกผู้ใช้เพื่อเข้าสู่ระบบ (Demo Mode)  │
│                                            │
│  ┌──────────┐ ┌──────────┐                │
│  │👑 Super │ │👔 Company│                │
│  │  Admin   │ │  Admin   │                │
│  └──────────┘ └──────────┘                │
│  ┌──────────┐ ┌──────────┐                │
│  │🏢 Project│ │👤 Staff  │                │
│  │  Admin   │ │          │                │
│  └──────────┘ └──────────┘                │
│  ┌──────────┐ ┌──────────┐                │
│  │🔧 Engineer│ │🏠 Resident│               │
│  └──────────┘ └──────────┘                │
│                                            │
│  [เข้าสู่ระบบ]                             │
│                                            │
│  ⚠️ โหมดทดสอบ (Demo Mode)                 │
│  • ใช้สำหรับทดสอบระบบเท่านั้น            │
│  • ข้อมูลเป็น Mock Data ไม่ใช่ข้อมูลจริง  │
└────────────────────────────────────────────┘
```

### **Logged In State**

```
┌────────────────────────────────────────────┐
│          🏢 Condo Pro Dashboard            │
│   เข้าสู่ระบบในนาม นายสมชาย ใจดี           │
├────────────────────────────────────────────┤
│  ┌────────────────────────────────────┐   │
│  │ 👤 นายสมชาย ใจดี                   │   │
│  │ 👑 Super Admin                     │   │
│  │ 📧 superadmin@unizorn.com          │   │
│  │ 📱 02-123-4567                     │   │
│  │ [Super Admin]                      │   │
│  └────────────────────────────────────┘   │
│                                            │
│  [เข้าสู่ระบบ] [ออกจากระบบ]               │
│                                            │
│  หรือสลับเป็นผู้ใช้อื่นด้านล่าง           │
│                                            │
│  [User Selection Grid...]                 │
└────────────────────────────────────────────┘
```

---

## 🚀 การใช้งาน

### **1. เข้าสู่ระบบครั้งแรก**

```bash
1. เปิดเว็บ → Redirect ไปหน้า /login อัตโนมัติ
2. เลือก User Card (คลิกที่การ์ดผู้ใช้)
3. คลิกปุ่ม "เข้าสู่ระบบ"
4. Loading... (0.5 วินาที)
5. ✅ เข้าสู่ระบบสำเร็จ
6. Redirect ไป /companies
```

### **2. ออกจากระบบ**

**วิธีที่ 1: จาก Sidebar**
```bash
1. อยู่ในหน้าใดก็ได้
2. Scroll ลงไปที่ Footer ของ Sidebar
3. คลิก "ออกจากระบบ" (ปุ่มสีแดง)
4. ✅ Logout สำเร็จ
5. Redirect ไป /login
```

**วิธีที่ 2: จากหน้า Login**
```bash
1. คลิก "ออกจากระบบ" ในหน้า Login
2. ✅ Logout สำเร็จ
```

### **3. สลับผู้ใช้แบบเร็ว (Dev Mode)**

**วิธีที่ 1: User Switcher (มุมขวาบน)**
```bash
1. คลิกที่ User Badge มุมขวาบน
2. เลือก User ใหม่จาก Dropdown
3. Reload หน้าเว็บอัตโนมัติ
4. ✅ สลับสำเร็จ
```

**วิธีที่ 2: หน้า Login (เมื่อ Login แล้ว)**
```bash
1. ไปที่ /login
2. เลือก User Card ใหม่
3. คลิก "สลับเป็น [ชื่อผู้ใช้]"
4. ✅ สลับสำเร็จ
```

---

## 👥 Mock Users

### **User 1: Super Admin**
```typescript
{
  id: '00000000-0000-0000-0000-000000000001',
  email: 'superadmin@unizorn.com',
  full_name: 'นายสมชาย ใจดี',
  role: 'super_admin',
  roleDisplay: 'Super Admin',
  phone: '02-123-4567'
}
```
**สิทธิ์:** ทุกอย่าง ✅

---

### **User 2: Company Admin**
```typescript
{
  id: '00000000-0000-0000-0000-000000000002',
  email: 'company@example.com',
  full_name: 'นางสาวสมหญิง รักษ์ดี',
  role: 'company_admin',
  roleDisplay: 'Company Admin',
  phone: '081-234-5678'
}
```
**สิทธิ์:** เฉพาะบริษัทที่ดูแล

---

### **User 3: Project Admin**
```typescript
{
  id: '00000000-0000-0000-0000-000000000003',
  email: 'project@example.com',
  full_name: 'นายวิชัย บริหาร',
  role: 'project_admin',
  roleDisplay: 'Project Admin',
  phone: '082-345-6789'
}
```
**สิทธิ์:** เฉพาะโครงการที่ได้รับมอบหมาย

---

### **User 4: Staff**
```typescript
{
  id: '00000000-0000-0000-0000-000000000004',
  email: 'staff@example.com',
  full_name: 'นางสาวกมล ช่วยงาน',
  role: 'staff',
  roleDisplay: 'Staff',
  phone: '083-456-7890'
}
```
**สิทธิ์:** จำกัด (View, Add, Edit บางโมดูล)

---

### **User 5: Engineer**
```typescript
{
  id: '00000000-0000-0000-0000-000000000005',
  email: 'engineer@example.com',
  full_name: 'นายเทคนิค ซ่อมบำรุง',
  role: 'engineer',
  roleDisplay: 'Engineer',
  phone: '084-567-8901'
}
```
**สิทธิ์:** เฉพาะโมดูลงานซ่อมบำรุง

---

### **User 6: Resident**
```typescript
{
  id: '00000000-0000-0000-0000-000000000006',
  email: 'resident@example.com',
  full_name: 'นายสมศักดิ์ เจ้าบ้าน',
  role: 'resident',
  roleDisplay: 'Resident',
  phone: '085-678-9012'
}
```
**สิทธิ์:** น้อยที่สุด (View เท่านั้น)

---

## 🔐 Authentication Flow

### **Login Flow**
```typescript
// 1. User เลือก User จาก Login Page
selectUser(userId) → setSelectedUserId(userId)

// 2. คลิก "เข้าสู่ระบบ"
handleLogin() {
  // Save to localStorage
  switchUser(userId) 
  
  // Redirect
  router.push('/companies')
}

// 3. localStorage จะเก็บ
localStorage.setItem('mock_user_id', userId)
```

### **Auth Check Flow**
```typescript
// ทุก Page ใน (admin)/ จะผ่าน AuthCheck
<AuthCheck>
  {children}
</AuthCheck>

// AuthCheck Component
useEffect(() => {
  const currentUser = getCurrentUser()
  
  if (currentUser.id === 'guest') {
    router.push('/login')  // Redirect to login
  }
}, [])
```

### **Logout Flow**
```typescript
// 1. คลิก "ออกจากระบบ"
handleLogout() {
  // Switch to guest
  switchUser('GUEST')
  
  // Redirect to login
  router.push('/login')
}

// 2. localStorage จะถูก clear
localStorage.setItem('mock_user_id', 'guest')
```

---

## 📁 Files

### **Frontend**
- **`app/login/page.tsx`** - หน้า Login/Logout UI
- **`app/page.tsx`** - Home page (Redirect logic)
- **`app/(admin)/auth-check.tsx`** - Authentication Guard
- **`app/(admin)/layout.tsx`** - Admin Layout with AuthCheck

### **Components**
- **`components/protected-sidebar.tsx`** - Sidebar with Logout button
- **`components/user-switcher.tsx`** - User Switcher (Dev Mode)

### **Utils**
- **`lib/utils/mock-auth.ts`** - Mock Authentication Logic

---

## 🧪 Test Scenarios

### **Test 1: First Login**
```
Given: ไม่มี session (guest)
When: เปิดเว็บ localhost:3000
Then: 
  ✅ Redirect to /login
  ✅ แสดงหน้า Login
  ✅ แสดง User Cards ทั้งหมด
```

### **Test 2: Login Success**
```
Given: อยู่ที่หน้า /login
When: 
  1. เลือก "Super Admin"
  2. คลิก "เข้าสู่ระบบ"
Then:
  ✅ แสดง Loading
  ✅ Toast "เข้าสู่ระบบสำเร็จ"
  ✅ Redirect to /companies
  ✅ Sidebar แสดงชื่อ "นายสมชาย ใจดี"
```

### **Test 3: Logout from Sidebar**
```
Given: Login เป็น Super Admin
When: 
  1. Scroll Sidebar ลงล่าง
  2. คลิก "ออกจากระบบ"
Then:
  ✅ Toast "ออกจากระบบสำเร็จ"
  ✅ Redirect to /login
  ✅ แสดงหน้า Login (ไม่มี User selected)
```

### **Test 4: Protected Route**
```
Given: ไม่ได้ Login (guest)
When: พยายามเข้า /companies โดยตรง
Then:
  ✅ Redirect to /login ทันที
  ❌ ไม่เห็นหน้า /companies
```

### **Test 5: Already Logged In**
```
Given: Login เป็น Company Admin แล้ว
When: ไปที่ /login
Then:
  ✅ แสดงข้อมูล User ปัจจุบัน
  ✅ แสดงปุ่ม "เข้าสู่ระบบ" และ "ออกจากระบบ"
  ✅ สามารถสลับ User ได้
```

### **Test 6: Quick Switch (Dev Mode)**
```
Given: Login เป็น Project Admin
When:
  1. คลิก User Badge มุมขวาบน
  2. เลือก "Staff User"
Then:
  ✅ Reload หน้าเว็บ
  ✅ เปลี่ยนเป็น Staff User
  ✅ Sidebar แสดงเมนูตาม Staff permissions
```

### **Test 7: Role-Based Menu**
```
Test A: Login as Super Admin
  ✅ เห็นเมนูทุกตัว

Test B: Login as Company Admin
  ✅ ไม่เห็น "ระบบ > จัดการผู้ใช้และสิทธิ์"
  ✅ เห็น "ระบบ > กลุ่มผู้ใช้งาน"

Test C: Login as Resident
  ❌ ไม่เห็นเมนู "ระบบ" เลย
  ✅ เห็นเฉพาะเมนูหลักที่มีสิทธิ์
```

---

## ⚙️ Configuration

### **Default User (First Load)**
```typescript
// lib/utils/mock-auth.ts
export function getCurrentUserId(): string {
  // Default to guest (not logged in)
  return 'guest'
}
```

### **Login Redirect Target**
```typescript
// app/login/page.tsx
router.push('/companies')  // เปลี่ยนได้ตามต้องการ
```

### **Logout Redirect Target**
```typescript
// lib/utils/mock-auth.ts
window.location.href = '/login'
```

---

## 🎯 Best Practices

### **1. ทดสอบแต่ละ Role**
```bash
✅ Login เป็น Super Admin → ทดสอบฟีเจอร์ทั้งหมด
✅ Login เป็น Company Admin → ทดสอบ scope บริษัท
✅ Login เป็น Project Admin → ทดสอบ scope โครงการ
✅ Login เป็น Staff → ทดสอบ limited permissions
✅ Login เป็น Resident → ทดสอบ minimal permissions
```

### **2. ทดสอบ Permission ทีละ Module**
```bash
1. Login เป็น Role A
2. เข้าโมดูล X
3. ทดสอบ Actions (View/Add/Edit/Delete)
4. Logout
5. Login เป็น Role B
6. ทดสอบโมดูล X อีกครั้ง
7. เปรียบเทียบผลลัพธ์
```

### **3. ทดสอบ Cross-Company/Project**
```bash
1. Login เป็น Company Admin (Company A)
2. ตรวจสอบว่าเห็นเฉพาะ Project ของ Company A
3. Logout
4. Login เป็น Company Admin (Company B)
5. ต้องไม่เห็น Project ของ Company A
```

---

## 🔮 Future Enhancements

1. **Real Authentication**
   - เชื่อมต่อ Supabase Auth
   - JWT Token Management
   - Refresh Token Logic

2. **Session Management**
   - Session Timeout (Auto Logout)
   - Remember Me
   - Multi-Device Sessions

3. **2FA (Two-Factor Authentication)**
   - OTP via SMS
   - Email Verification
   - Authenticator App

4. **Audit Log**
   - บันทึกการ Login/Logout
   - บันทึก IP Address
   - บันทึกเวลาและ Device

---

## ✅ Summary

✅ **หน้า Login/Logout สมบูรณ์** - UI สวยงาม ใช้งานง่าย  
✅ **Authentication Guard** - ป้องกันการเข้าถึงโดยไม่ได้รับอนุญาต  
✅ **Mock Users ครบ 6 Roles** - ทดสอบ Permission ได้ทุกระดับ  
✅ **Quick Switcher (Dev Mode)** - สลับ User เร็วสำหรับ Dev  
✅ **Logout Feature** - ออกจากระบบได้จาก 2 ที่  

**ระบบพร้อมใช้งานสำหรับการทดสอบแล้ว! 🎊**

