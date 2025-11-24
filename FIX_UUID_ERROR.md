# แก้ไข Error: invalid input syntax for type uuid

## ปัญหาที่พบ
```
Error getting user permission context: {
  code: '22P02',
  message: 'invalid input syntax for type uuid: "super-admin-user-id"'
}
```

## สาเหตุ
ใช้ string `"super-admin-user-id"` แทน UUID ที่ถูกต้อง ซึ่งทำให้ PostgreSQL ไม่สามารถแปลงเป็น UUID ได้

## วิธีแก้ไข

### **1. รัน SQL Script ที่อัปเดตแล้ว**
```sql
-- รัน script นี้ใน Supabase SQL Editor
-- scripts/013_multi_tenancy_permissions.sql
```

Script นี้จะสร้าง:
- ✅ Mock users ด้วย UUID ที่ถูกต้อง
- ✅ Demo company และ project
- ✅ User-role assignments

**Mock Users ที่สร้าง:**
```
UUID: 00000000-0000-0000-0000-000000000001
Email: superadmin@unizorn.com
Role: Super Admin

UUID: 00000000-0000-0000-0000-000000000002
Email: company@example.com
Role: Company Admin

UUID: 00000000-0000-0000-0000-000000000003
Email: project@example.com
Role: Project Admin

UUID: 00000000-0000-0000-0000-000000000004
Email: staff@example.com
Role: Staff
```

### **2. ใช้ Mock Auth Utility**

ไฟล์ทั้ง 3 หน้าได้ถูกอัปเดตให้ใช้ `getCurrentUserId()` แล้ว:
- ✅ `app/(admin)/companies/page.tsx`
- ✅ `app/(admin)/projects/page.tsx`
- ✅ `app/(admin)/user-management/page.tsx`

```typescript
import { getCurrentUserId } from "@/lib/utils/mock-auth"

// ใช้แทน
const currentUserId = getCurrentUserId() // Returns valid UUID
```

### **3. ตรวจสอบการติดตั้ง**

```sql
-- ตรวจสอบ mock users
SELECT id, email, full_name FROM users;

-- ตรวจสอบ user roles
SELECT 
  u.email,
  r.display_name as role,
  c.name as company,
  p.name as project
FROM user_roles ur
JOIN users u ON ur.user_id = u.id
JOIN roles r ON ur.role_id = r.id
LEFT JOIN companies c ON ur.company_id = c.id
LEFT JOIN projects p ON ur.project_id = p.id
WHERE ur.is_active = true;
```

**ผลลัพธ์ที่คาดหวัง:**
```
superadmin@unizorn.com | Super Admin | null | null
company@example.com | Company Admin | Demo Company | null
project@example.com | Project Admin | Demo Company | Demo Project
staff@example.com | Staff | Demo Company | Demo Project
```

## การใช้งาน Mock Auth

### **ดู Current User**
```typescript
import { getCurrentUser } from "@/lib/utils/mock-auth"

const user = getCurrentUser()
console.log(user.email, user.role)
```

### **สลับ User (สำหรับทดสอบ)**
```typescript
import { switchUser, MOCK_USERS } from "@/lib/utils/mock-auth"

// สลับเป็น Company Admin
switchUser('COMPANY_ADMIN')

// สลับเป็น Project Admin
switchUser('PROJECT_ADMIN')

// สลับเป็น Staff
switchUser('STAFF')

// กลับไปเป็น Super Admin
switchUser('SUPER_ADMIN')
```

### **ตรวจสอบ Role**
```typescript
import { isSuperAdmin } from "@/lib/utils/mock-auth"

if (isSuperAdmin()) {
  // Show admin features
}
```

## ไฟล์ที่อัปเดต/สร้าง

### **ไฟล์ใหม่:**
- `lib/utils/mock-auth.ts` - Mock authentication utilities

### **ไฟล์ที่อัปเดต:**
- `scripts/013_multi_tenancy_permissions.sql` - เพิ่ม mock users และ demo data
- `app/(admin)/companies/page.tsx` - ใช้ `getCurrentUserId()`
- `app/(admin)/projects/page.tsx` - ใช้ `getCurrentUserId()`
- `app/(admin)/user-management/page.tsx` - ใช้ `getCurrentUserId()`

## ขั้นตอนการแก้ไข

### **Step 1: รัน SQL Script**
```bash
# ใน Supabase SQL Editor
# รัน: scripts/013_multi_tenancy_permissions.sql
```

### **Step 2: Refresh หน้า**
```bash
# รีเฟรชเบราว์เซอร์
# หรือกด Ctrl+Shift+R
```

### **Step 3: ทดสอบ**
1. ไปที่ **"จัดการบริษัท"**
2. ลองสร้างบริษัทใหม่
3. ควรเห็น "Demo Company" ที่สร้างไว้

## การทดสอบ Permission System

### **1. ทดสอบ Super Admin**
```typescript
// Current user: Super Admin
const userId = getCurrentUserId() // 00000000-0000-0000-0000-000000000001

// Should pass
await checkPermission(userId, 'companies.create') // ✅
await checkPermission(userId, 'projects.delete') // ✅
```

### **2. สลับเป็น Company Admin**
```typescript
import { switchUser } from "@/lib/utils/mock-auth"

switchUser('COMPANY_ADMIN')
// Now logged in as: 00000000-0000-0000-0000-000000000002

// Should pass
await checkPermission(userId, 'projects.create') // ✅

// Should fail
await checkPermission(userId, 'companies.delete') // ❌
```

### **3. สลับเป็น Project Admin**
```typescript
switchUser('PROJECT_ADMIN')
// Now logged in as: 00000000-0000-0000-0000-000000000003

// Should pass
await checkPermission(userId, 'billing.create') // ✅

// Should fail
await checkPermission(userId, 'projects.delete') // ❌
```

## Production Setup

### **แทนที่ Mock Auth ด้วย Real Auth**

```typescript
// Before (Mock)
import { getCurrentUserId } from "@/lib/utils/mock-auth"
const userId = getCurrentUserId()

// After (Production)
import { getServerSession } from "next-auth"
const session = await getServerSession()
const userId = session?.user?.id
```

## Best Practices

### **1. Development**
- ✅ ใช้ mock users สำหรับพัฒนา
- ✅ สลับ users เพื่อทดสอบ permissions
- ✅ ทดสอบทุก role

### **2. Production**
- ✅ แทนที่ด้วย real authentication
- ✅ ลบ mock users
- ✅ ใช้ proper session management
- ✅ Secure password hashing

## สรุป

✅ **แก้ไขแล้ว**: ใช้ valid UUIDs แทน string IDs  
✅ **Mock Users**: สร้าง 4 mock users ด้วย UUID ที่ถูกต้อง  
✅ **Demo Data**: สร้าง Demo Company และ Project  
✅ **Mock Auth**: สร้าง utility สำหรับจัดการ mock authentication  
✅ **All Pages Updated**: ใช้ `getCurrentUserId()` แล้ว  

ตอนนี้ระบบควรทำงานได้แล้วครับ! 🎉

## ขั้นตอนต่อไป

1. รัน SQL script ที่อัปเดต
2. Refresh เบราว์เซอร์
3. ทดสอบสร้างบริษัทและโครงการ
4. ทดสอบมอบหมาย roles
5. ทดสอบ permission checks
