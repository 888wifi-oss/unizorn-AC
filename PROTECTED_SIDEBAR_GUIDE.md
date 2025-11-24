# Protected Sidebar - เมนูที่ซ่อนอัตโนมัติตามสิทธิ์

## ภาพรวม
Protected Sidebar จะแสดงเฉพาะเมนูที่ user มีสิทธิ์เข้าถึง และซ่อนเมนูที่ไม่มีสิทธิ์โดยอัตโนมัติ

## ฟีเจอร์

### ✅ **Auto-hide Menus**
- ซ่อนเมนูที่ไม่มีสิทธิ์อัตโนมัติ
- ซ่อนกลุ่มเมนูถ้าไม่มีรายการที่เข้าถึงได้
- แสดงเฉพาะเมนูที่มี actions ขั้นต่ำที่กำหนด

### ✅ **Role-based Visibility**
- Super Admin เห็นทุกเมนู
- Company Admin ไม่เห็น "จัดการบริษัท"
- Project Admin ไม่เห็น "จัดการบริษัท", "จัดการ API"
- Staff เห็นเฉพาะงานประจำวัน
- Engineer เห็นเฉพาะ "งานแจ้งซ่อม"

### ✅ **Permission Checking**
- ตรวจสอบ module access
- ตรวจสอบ minimum actions required
- Real-time updates เมื่อสลับ user

### ✅ **User Info Display**
- แสดงชื่อ user
- แสดง role
- แสดงจำนวนเมนูที่เข้าถึงได้

---

## การใช้งาน

### **1. Admin Layout ถูกอัปเดตแล้ว**
```typescript
// app/(admin)/layout.tsx
import { ProtectedSidebar } from "@/components/protected-sidebar"
import { UserSwitcher } from "@/components/user-switcher"

export default function AdminLayout({ children }) {
  return (
    <>
      <ProtectedSidebar /> {/* ใช้ Protected Sidebar */}
      <UserSwitcher />
      <main className="ml-64 min-h-screen">
        <div className="p-8">{children}</div>
      </main>
    </>
  )
}
```

### **2. Sidebar จะอัปเดตอัตโนมัติ**
เมื่อสลับ user ด้วย User Switcher, Sidebar จะแสดงเฉพาะเมนูที่มีสิทธิ์

---

## ตัวอย่างการแสดงผลตาม Role

### 🔴 **Super Admin เห็น:**
```
ระบบ (System)
  ├─ จัดการบริษัท
  ├─ จัดการโครงการ
  ├─ จัดการผู้ใช้และสิทธิ์
  └─ จัดการ API

เมนูหลัก
  ├─ แดชบอร์ด
  ├─ ห้องชุด
  ├─ จัดการประกาศ
  ├─ จัดการงานแจ้งซ่อม
  ├─ จัดการบัญชีลูกบ้าน
  ├─ จัดการการแจ้งเตือน
  ├─ จัดการพัสดุ
  ├─ รายงานพัสดุ
  └─ จัดการเอกสารและไฟล์

รายรับ
  ├─ ออกบิล
  ├─ การชำระเงิน
  ├─ บันทึกรายรับ
  └─ ลูกหนี้ค้างชำระ (AR)

รายจ่าย
  └─ บันทึกรายจ่าย

บัญชี
  ├─ ทะเบียนทรัพย์สิน
  ├─ คำนวณค่าเสื่อมราคา
  ├─ ผังบัญชี
  ├─ สมุดรายวันทั่วไป (JV)
  └─ สมุดบัญชีแยกประเภท (GL)

รายงาน
  ├─ งบประมาณรายรับ
  ├─ งบประมาณรายจ่าย
  ├─ รายงานเปรียบเทียบงบ
  ├─ รายงานรายรับ
  ├─ รายงานทางการเงิน
  └─ รายงานสรุป

ขั้นสูง
  ├─ การวิเคราะห์ข้อมูล
  ├─ ระบบอัตโนมัติ
  └─ การตั้งค่าธีม

Footer: ผู้ใช้: Super Admin | Role: super_admin | เมนูที่เข้าถึงได้: 32 เมนู
```

---

### 🟠 **Company Admin เห็น:**
```
ระบบ (System)
  ├─ จัดการโครงการ
  ├─ จัดการผู้ใช้และสิทธิ์
  └─ จัดการ API
  ❌ ไม่มี "จัดการบริษัท"

เมนูหลัก (เหมือน Super Admin)
รายรับ (เหมือน Super Admin)
รายจ่าย (เหมือน Super Admin)
บัญชี (เหมือน Super Admin)
รายงาน (เหมือน Super Admin)
ขั้นสูง (เหมือน Super Admin)

Footer: ผู้ใช้: Company Admin | Role: company_admin | เมนูที่เข้าถึงได้: 29 เมนู
```

---

### 🔵 **Project Admin เห็น:**
```
ระบบ (System)
  ├─ จัดการโครงการ
  └─ จัดการผู้ใช้และสิทธิ์
  ❌ ไม่มี "จัดการบริษัท"
  ❌ ไม่มี "จัดการ API"

เมนูหลัก (เหมือน Super Admin)
รายรับ (เหมือน Super Admin)
รายจ่าย (เหมือน Super Admin)
บัญชี (เหมือน Super Admin)
รายงาน (เหมือน Super Admin)
ขั้นสูง (เหมือน Super Admin)

Footer: ผู้ใช้: Project Admin | Role: project_admin | เมนูที่เข้าถึงได้: 28 เมนู
```

---

### 🟢 **Staff เห็น:**
```
เมนูหลัก
  ├─ แดชบอร์ด
  ├─ ห้องชุด (ดูอย่างเดียว)
  ├─ จัดการประกาศ
  ├─ จัดการงานแจ้งซ่อม
  ├─ จัดการพัสดุ
  ├─ รายงานพัสดุ
  └─ จัดการเอกสารและไฟล์
  ❌ ไม่มี "จัดการบัญชีลูกบ้าน"
  ❌ ไม่มี "จัดการการแจ้งเตือน"

รายรับ
  ├─ ออกบิล
  ├─ การชำระเงิน
  ├─ บันทึกรายรับ
  └─ ลูกหนี้ค้างชำระ (AR)

รายงาน
  ├─ รายงานรายรับ
  └─ รายงานสรุป
  ❌ ไม่มี "งบประมาณ"
  ❌ ไม่มี "รายงานทางการเงิน"

ขั้นสูง
  └─ การตั้งค่าธีม
  ❌ ไม่มี "การวิเคราะห์ข้อมูล"
  ❌ ไม่มี "ระบบอัตโนมัติ"

❌ ไม่มีกลุ่ม "ระบบ (System)"
❌ ไม่มีกลุ่ม "รายจ่าย"
❌ ไม่มีกลุ่ม "บัญชี"

Footer: ผู้ใช้: Staff User | Role: staff | เมนูที่เข้าถึงได้: 14 เมนู
```

---

### 🔵 **Engineer เห็น:**
```
เมนูหลัก
  └─ จัดการงานแจ้งซ่อม

❌ ไม่มีกลุ่มอื่น ๆ ทั้งหมด

Footer: ผู้ใช้: Engineer | Role: engineer | เมนูที่เข้าถึงได้: 1 เมนู
```

---

## การทดสอบ

### **Test 1: สลับเป็น Super Admin**
```
1. คลิก User Switcher (มุมขวาบน)
2. เลือก "Super Admin"
3. ตรวจสอบ Sidebar:
   ✅ มีทุกกลุ่มเมนู (6 กลุ่ม)
   ✅ มีทุกเมนู (32 เมนู)
   ✅ Footer แสดง "32 เมนู"
```

### **Test 2: สลับเป็น Staff**
```
1. คลิก User Switcher
2. เลือก "Staff User"
3. ตรวจสอบ Sidebar:
   ❌ ไม่มี "ระบบ (System)"
   ✅ มี "เมนูหลัก" (บางส่วน)
   ✅ มี "รายรับ" (ทั้งหมด)
   ❌ ไม่มี "รายจ่าย"
   ❌ ไม่มี "บัญชี"
   ✅ มี "รายงาน" (บางส่วน)
   ✅ มี "ขั้นสูง" (เฉพาะ Theme)
   ✅ Footer แสดง "14 เมนู"
```

### **Test 3: สลับเป็น Company Admin**
```
1. สลับเป็น "Company Admin"
2. ตรวจสอบ Sidebar:
   ✅ มี "ระบบ (System)" แต่ไม่มี "จัดการบริษัท"
   ✅ มีเมนูอื่น ๆ เกือบทั้งหมด
   ✅ Footer แสดง "29 เมนู"
```

### **Test 4: ลองเข้าเมนูที่ไม่มีสิทธิ์**
```
1. สลับเป็น Staff
2. พิมพ์ URL: /companies
3. ✅ ควรเห็น "ไม่มีสิทธิ์เข้าถึง"
4. ✅ Sidebar ไม่แสดงเมนู "จัดการบริษัท"
```

---

## ข้อดีของ Protected Sidebar

### **1. Security**
- ✅ ซ่อนเมนูที่ไม่มีสิทธิ์
- ✅ ป้องกัน information disclosure
- ✅ Users ไม่เห็นฟีเจอร์ที่ใช้ไม่ได้

### **2. User Experience**
- ✅ UI สะอาด ไม่ซับซ้อน
- ✅ แสดงเฉพาะสิ่งที่เกี่ยวข้อง
- ✅ ลด cognitive load

### **3. Maintainability**
- ✅ Configuration-based
- ✅ Easy to update permissions
- ✅ Type-safe

### **4. Performance**
- ✅ Client-side rendering
- ✅ Fast permission checks
- ✅ No unnecessary API calls

---

## การทำงานของระบบ

### **Flow:**
```
User Login
  ↓
Get User Role
  ↓
Load Role Permissions (from granular-permissions.ts)
  ↓
Filter Menu Items
  ├─ Check canAccess
  ├─ Check minActions
  └─ Check role level
  ↓
Render Visible Menus Only
  ↓
Hide Groups with No Visible Items
```

### **Permission Check:**
```typescript
// For each menu item:
1. Check if module.canAccess === true
2. Check if user has minimum required actions
3. Check if user role level <= menu group min level
4. If ALL pass → Show menu
5. If ANY fail → Hide menu
```

---

## ตัวอย่างการทำงาน

### **Scenario: Staff เข้าระบบ**

```typescript
// 1. Get user role
const user = getCurrentUser()
// → { role: 'staff', ... }

// 2. Get accessible modules
const modules = getAccessibleModulesForRole('staff')
// → [billing, payments, maintenance, parcels, ...]

// 3. Filter menu groups
// "ระบบ (System)" → minRoleLevel: 1, userLevel: 3
// → userLevel > minRoleLevel → HIDE ❌

// "เมนูหลัก" → minRoleLevel: 3, userLevel: 3
// → userLevel === minRoleLevel → SHOW ✅

// 4. Filter menu items in group
// "ห้องชุด" → module: "units", canAccess: true
// → SHOW ✅

// "จัดการบัญชีลูกบ้าน" → module: "resident_accounts", canAccess: false
// → HIDE ❌

// 5. Render visible menus
// Result: แสดง 14 เมนู (จาก 32 เมนูทั้งหมด)
```

---

## Sidebar Footer Information

### **ข้อมูลที่แสดงเสมอ:**
```
┌─────────────────────────────┐
│ ผู้ใช้: Super Admin         │
│ Role: super_admin           │
│ เมนูที่เข้าถึงได้: 32 เมนู  │
└─────────────────────────────┘
```

**ประโยชน์:**
- ✅ รู้ว่าตอนนี้ใช้ role อะไร
- ✅ เห็นจำนวนเมนูที่เข้าถึงได้
- ✅ ง่ายต่อการ debug permissions

---

## ตารางเปรียบเทียบ Sidebar Visibility

| Menu Group | Super Admin | Company Admin | Project Admin | Staff | Engineer |
|------------|:-----------:|:-------------:|:-------------:|:-----:|:--------:|
| **ระบบ (System)** | ✅ (4 items) | ✅ (3 items) | ✅ (2 items) | ❌ | ❌ |
| **เมนูหลัก** | ✅ (9 items) | ✅ (9 items) | ✅ (9 items) | ✅ (7 items) | ✅ (1 item) |
| **รายรับ** | ✅ (4 items) | ✅ (4 items) | ✅ (4 items) | ✅ (4 items) | ❌ |
| **รายจ่าย** | ✅ (1 item) | ✅ (1 item) | ✅ (1 item) | ❌ | ❌ |
| **บัญชี** | ✅ (5 items) | ✅ (5 items) | ✅ (5 items) | ❌ | ❌ |
| **รายงาน** | ✅ (6 items) | ✅ (6 items) | ✅ (6 items) | ✅ (2 items) | ❌ |
| **ขั้นสูง** | ✅ (3 items) | ✅ (3 items) | ✅ (3 items) | ✅ (1 item) | ❌ |
| **Total** | **32** | **29** | **28** | **14** | **1** |

---

## Individual Menu Items Visibility

### **ระบบ (System) Group:**

| Menu Item | Super Admin | Company Admin | Project Admin | Staff | Engineer |
|-----------|:-----------:|:-------------:|:-------------:|:-----:|:--------:|
| จัดการบริษัท | ✅ | ❌ | ❌ | ❌ | ❌ |
| จัดการโครงการ | ✅ | ✅ | ✅ | ❌ | ❌ |
| จัดการผู้ใช้และสิทธิ์ | ✅ | ✅ | ✅ | ❌ | ❌ |
| จัดการ API | ✅ | ✅ | ❌ | ❌ | ❌ |

### **เมนูหลัก Group:**

| Menu Item | Super Admin | Company Admin | Project Admin | Staff | Engineer |
|-----------|:-----------:|:-------------:|:-------------:|:-----:|:--------:|
| แดชบอร์ด | ✅ | ✅ | ✅ | ✅ | ❌ |
| ห้องชุด | ✅ | ✅ | ✅ | ✅ | ❌ |
| จัดการประกาศ | ✅ | ✅ | ✅ | ✅ | ❌ |
| จัดการงานแจ้งซ่อม | ✅ | ✅ | ✅ | ✅ | ✅ |
| จัดการบัญชีลูกบ้าน | ✅ | ✅ | ✅ | ❌ | ❌ |
| จัดการการแจ้งเตือน | ✅ | ✅ | ✅ | ❌ | ❌ |
| จัดการพัสดุ | ✅ | ✅ | ✅ | ✅ | ❌ |
| รายงานพัสดุ | ✅ | ✅ | ✅ | ✅ | ❌ |
| จัดการเอกสารและไฟล์ | ✅ | ✅ | ✅ | ✅ | ❌ |

---

## Best Practices

### **1. เมนูที่ซ่อน = เข้าไม่ได้**
```typescript
// ถ้าเมนูไม่แสดง = user ไม่มีสิทธิ์
// ถ้า user พิมพ์ URL โดยตรง → จะถูก redirect หรือแสดง Access Denied
```

### **2. Consistent UX**
```typescript
// ❌ Bad: แสดงเมนูแต่กดแล้วแสดง "ไม่มีสิทธิ์"
<MenuItem href="/billing" /> // Shows but errors

// ✅ Good: ซ่อนเมนูที่ไม่มีสิทธิ์
{canAccess && <MenuItem href="/billing" />} // Only show if can access
```

### **3. Security Layers**
```
Layer 1: Sidebar → ซ่อนเมนู
Layer 2: Route → PermissionGuard
Layer 3: Component → Can component
Layer 4: Server Action → checkPermission()
```

---

## สรุป

### **Protected Sidebar Features:**
- ✅ **Auto-hide** menus based on role
- ✅ **Dynamic rendering** based on permissions
- ✅ **Role-based visibility** for menu groups
- ✅ **Action-based filtering** for menu items
- ✅ **Real-time updates** when switching users
- ✅ **User info display** in footer
- ✅ **Clean UX** - no disabled/grayed out menus

### **ผลลัพธ์:**
- Super Admin → 32 เมนู
- Company Admin → 29 เมนู
- Project Admin → 28 เมนู
- Staff → 14 เมนู
- Engineer → 1 เมนู

**Sidebar จะแสดงเฉพาะเมนูที่มีสิทธิ์เท่านั้น!** 🎊

ลอง **สลับ Role ด้วย User Switcher** แล้วดู Sidebar เปลี่ยนแปลงแบบ real-time ครับ! 🚀
