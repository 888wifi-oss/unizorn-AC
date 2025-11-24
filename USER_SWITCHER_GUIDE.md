# User Switcher - คู่มือการใช้งาน

## ภาพรวม
User Switcher เป็นเครื่องมือสำหรับสลับผู้ใช้ (Role) เพื่อทดสอบระบบ Permission

## ตำแหน่งที่แสดง
User Switcher จะแสดงที่ **มุมขวาบน** ของทุกหน้าใน Admin Panel

## การใช้งาน

### **วิธีสลับผู้ใช้:**

1. **คลิกที่ปุ่ม User Switcher** (มุมขวาบน)
2. **เลือก Role ที่ต้องการทดสอบ:**
   - 🔴 **Super Admin** - เห็นทุกอย่าง (32 โมดูล)
   - 🟠 **Company Admin** - เห็น 29 โมดูล
   - 🔵 **Project Admin** - เห็น 28 โมดูล
   - 🟢 **Staff** - เห็น 14 โมดูล
3. **หน้าจะ reload อัตโนมัติ**
4. **Sidebar จะอัปเดต** แสดงเฉพาะโมดูลที่ role นั้นเข้าถึงได้

## Mock Users ที่มี

| User | Email | Role | Modules | UUID |
|------|-------|------|---------|------|
| **Super Admin** | superadmin@unizorn.com | super_admin | 32 | 00000000-0000-0000-0000-000000000001 |
| **Company Admin** | company@example.com | company_admin | 29 | 00000000-0000-0000-0000-000000000002 |
| **Project Admin** | project@example.com | project_admin | 28 | 00000000-0000-0000-0000-000000000003 |
| **Staff** | staff@example.com | staff | 14 | 00000000-0000-0000-0000-000000000004 |

## การทดสอบ Permissions

### **Scenario 1: ทดสอบ Staff Role**

1. **คลิก User Switcher**
2. **เลือก "Staff User"**
3. **สังเกต Sidebar:**
   - ❌ ไม่มี "ระบบ (System)" menu
   - ❌ ไม่มี "รายจ่าย" menu
   - ❌ ไม่มี "บัญชี" menu
   - ✅ มีเฉพาะ "เมนูหลัก", "รายรับ", "รายงาน" (บางส่วน)
4. **ลองเข้า:**
   - ✅ `/billing` - เข้าได้
   - ✅ `/parcels` - เข้าได้
   - ❌ `/companies` - เข้าไม่ได้ (จะแสดง Access Denied)
   - ❌ `/chart-of-accounts` - เข้าไม่ได้

### **Scenario 2: ทดสอบ Company Admin**

1. **สลับเป็น "Company Admin"**
2. **สังเกต Sidebar:**
   - ✅ มี "ระบบ (System)" (แต่ไม่มี "จัดการบริษัท")
   - ✅ มี "เมนูหลัก" ครบ
   - ✅ มี "รายรับ", "รายจ่าย", "บัญชี", "รายงาน" ครบ
3. **ลองเข้า:**
   - ❌ `/companies` - เข้าไม่ได้ (Super Admin only)
   - ✅ `/projects` - เข้าได้
   - ✅ `/api-management` - เข้าได้

### **Scenario 3: ทดสอบ Engineer**

1. **สลับเป็น "Staff User"** (ไม่มี Engineer ใน mock users)
2. **สังเกต Sidebar:**
   - ✅ มีเฉพาะ "งานแจ้งซ่อม"
   - ❌ ไม่มีโมดูลอื่น
3. **ลองเข้า:**
   - ✅ `/maintenance` - เข้าได้
   - ❌ `/billing` - เข้าไม่ได้
   - ❌ `/parcels` - เข้าไม่ได้

## ฟีเจอร์ของ User Switcher

### **1. แสดงข้อมูล User ปัจจุบัน**
- ✅ ชื่อ
- ✅ อีเมล
- ✅ Role (พร้อม badge สี)
- ✅ Badge "ปัจจุบัน" สำหรับ user ที่เลือกอยู่

### **2. รายการ Users ทั้งหมด**
- ✅ แสดงทุก mock users
- ✅ แสดง role แต่ละคน
- ✅ Highlight user ปัจจุบัน

### **3. Auto Reload**
- ✅ หน้าจะ reload อัตโนมัติหลังสลับ user
- ✅ Sidebar จะอัปเดตทันที

## การใช้งานใน Code

### **วิธีที่ 1: ผ่าน UI (แนะนำ)**
```
1. คลิก User Switcher (มุมขวาบน)
2. เลือก Role
3. หน้า reload
```

### **วิธีที่ 2: ใน Console**
```javascript
// เปิด Browser Console (F12)

// Import function
import { switchUser } from '@/lib/utils/mock-auth'

// สลับเป็น Staff
switchUser('STAFF')

// สลับเป็น Company Admin
switchUser('COMPANY_ADMIN')

// กลับเป็น Super Admin
switchUser('SUPER_ADMIN')
```

### **วิธีที่ 3: ใน Code (สำหรับ testing)**
```typescript
import { switchUser, getCurrentUser } from '@/lib/utils/mock-auth'

// In component
function TestComponent() {
  const handleTestAsStaff = () => {
    switchUser('STAFF')
    // Page will reload
  }
  
  return <Button onClick={handleTestAsStaff}>Test as Staff</Button>
}
```

## ตัวอย่างการทดสอบ

### **Test Case 1: Staff ไม่เห็น Accounting Modules**

```
1. สลับเป็น Staff
2. ไปที่ Sidebar
3. ✅ ควรไม่เห็น "บัญชี" menu
4. ลองเข้า /chart-of-accounts โดยตรง
5. ✅ ควรเห็น "ไม่มีสิทธิ์เข้าถึง" พร้อม redirect
```

### **Test Case 2: Company Admin ไม่เห็น Companies**

```
1. สลับเป็น Company Admin
2. ไปที่ Sidebar
3. ✅ ควรไม่เห็น "จัดการบริษัท" ใน System menu
4. ลองเข้า /companies โดยตรง
5. ✅ ควรเห็น "ไม่มีสิทธิ์เข้าถึง"
```

### **Test Case 3: Project Admin จัดการโครงการได้**

```
1. สลับเป็น Project Admin
2. ไปที่ "จัดการโครงการ"
3. ✅ ควรเห็นรายการโครงการ
4. ✅ ควรมีปุ่ม "แก้ไข"
5. ❌ ไม่ควรมีปุ่ม "ลบ" (เฉพาะ Super Admin)
```

## ข้อมูลที่แสดงใน User Switcher

### **Badge Colors:**
- 🔴 **Red** - Super Admin
- 🟠 **Orange** - Company Admin
- 🔵 **Blue** - Project Admin
- 🟢 **Green** - Staff
- 🟣 **Purple** - Engineer
- ⚪ **Gray** - Resident

### **User Info:**
- ชื่อเต็ม
- อีเมล
- Role (badge)
- "ปัจจุบัน" badge (ถ้าเป็น user ที่เลือกอยู่)

## Production Notes

### **⚠️ สำคัญ: ปิดใน Production**

User Switcher เป็นเครื่องมือสำหรับ **Development เท่านั้น**

**ก่อน Deploy Production:**

```typescript
// app/(admin)/layout.tsx

// Development
import { UserSwitcher } from "@/components/user-switcher"

export default function AdminLayout({ children }) {
  return (
    <>
      <Sidebar />
      {process.env.NODE_ENV === 'development' && <UserSwitcher />}
      <main className="ml-64 min-h-screen">
        <div className="p-8">{children}</div>
      </main>
    </>
  )
}
```

หรือ

```typescript
// Remove UserSwitcher completely in production
import { Sidebar } from "@/components/sidebar"
// import { UserSwitcher } from "@/components/user-switcher" // REMOVED

export default function AdminLayout({ children }) {
  return (
    <>
      <Sidebar />
      {/* <UserSwitcher /> */} {/* REMOVED */}
      <main className="ml-64 min-h-screen">
        <div className="p-8">{children}</div>
      </main>
    </>
  )
}
```

## Keyboard Shortcuts (Optional)

### **เพิ่ม Keyboard Shortcuts:**

```typescript
// Add to user-switcher.tsx
useEffect(() => {
  const handleKeyPress = (e: KeyboardEvent) => {
    if (e.ctrlKey && e.shiftKey) {
      switch(e.key) {
        case '1': switchUser('SUPER_ADMIN'); break
        case '2': switchUser('COMPANY_ADMIN'); break
        case '3': switchUser('PROJECT_ADMIN'); break
        case '4': switchUser('STAFF'); break
      }
    }
  }
  
  window.addEventListener('keydown', handleKeyPress)
  return () => window.removeEventListener('keydown', handleKeyPress)
}, [])
```

**Shortcuts:**
- `Ctrl+Shift+1` - Switch to Super Admin
- `Ctrl+Shift+2` - Switch to Company Admin
- `Ctrl+Shift+3` - Switch to Project Admin
- `Ctrl+Shift+4` - Switch to Staff

## สรุป

### **User Switcher ทำให้คุณ:**
- ✅ สลับ Role ได้ง่าย ๆ ด้วย 1 คลิก
- ✅ ทดสอบ Permissions แต่ละ Role
- ✅ ดู Sidebar ที่แตกต่างกันตาม Role
- ✅ ทดสอบ Access Denied screens
- ✅ ทดสอบ Permission Guards

### **การใช้งาน:**
1. ✅ คลิกปุ่มมุมขวาบน
2. ✅ เลือก Role
3. ✅ หน้า reload
4. ✅ Sidebar อัปเดต
5. ✅ ทดสอบฟีเจอร์ต่าง ๆ

**เครื่องมือทดสอบ Permission พร้อมใช้งาน!** 🎊
