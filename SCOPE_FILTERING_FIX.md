# Scope Filtering Fix - แก้ไขการกรองข้อมูลตาม Scope

## 🐛 ปัญหาที่พบ

เมื่อ login ด้วย `svs@email.com` (Company Admin หรือ Project Admin):

1. ❌ **หน้าจัดการผู้ใช้และสิทธิ์** - เห็น users จากบริษัท/โครงการอื่น
2. ❌ **หน้ากลุ่มผู้ใช้งาน** - เห็นโครงการอื่นที่ไม่มีสิทธิ์
3. ❌ **หน้าจัดการโครงการ** - เห็นโครงการอื่นที่ไม่มีสิทธิ์

## ✅ การแก้ไข

### **1. แก้ไข `getCompanies()` - กรองบริษัท**

**Before:**
```typescript
// ไม่มีการกรอง - ดึงทุกบริษัท
export async function getCompanies(userId: string) {
  const { data } = await supabase
    .from('companies')
    .select('*')
  
  return { companies: data }  // ❌ ทุกบริษัท
}
```

**After:**
```typescript
export async function getCompanies(userId: string) {
  // 1. Check if Super Admin
  const isSuperAdmin = await checkRole(userId, 'super_admin')
  
  if (isSuperAdmin) {
    // Return ALL companies
    return { companies: allCompanies }
  }
  
  // 2. Get user's company/project roles
  const { data: userRoles } = await supabase
    .from('user_roles')
    .select('company_id, project:projects(company_id)')
    .eq('user_id', userId)
    .eq('is_active', true)
  
  // 3. Extract unique company IDs
  const companyIds = Array.from(new Set(
    userRoles
      .map(ur => ur.company_id || ur.project?.company_id)
      .filter(Boolean)
  ))
  
  // 4. Return only accessible companies
  const { data } = await supabase
    .from('companies')
    .select('*')
    .in('id', companyIds)  // ✅ เฉพาะบริษัทที่มีสิทธิ์
  
  return { companies: data }
}
```

**Logic:**
- **Super Admin** → เห็นทุกบริษัท
- **Company Admin** → เห็นเฉพาะบริษัทที่ดูแล
- **Project Admin** → เห็นเฉพาะบริษัทที่โครงการของตนสังกัด

---

### **2. แก้ไข `getUsers()` - กรองผู้ใช้**

**Before:**
```typescript
// ดึง users ที่มี role ในโครงการที่เข้าถึงได้
const accessibleProjects = await getUserAccessibleProjects(userId)

const { data: userRoles } = await supabase
  .from('user_roles')
  .select('user_id')
  .in('project_id', accessibleProjects)  // ❌ เฉพาะ project_id

const userIds = userRoles.map(ur => ur.user_id)

return { users: await getUsers(userIds) }
// ปัญหา: ดึง users ที่มี role ใน project เท่านั้น
// แต่ไม่รวม users ที่มี role ใน company level
```

**After:**
```typescript
export async function getUsers(userId: string) {
  // 1. Check if Super Admin
  const isSuperAdmin = await checkRole(userId, 'super_admin')
  
  if (isSuperAdmin) {
    return { users: allUsers }  // ทุกคน
  }
  
  // 2. Get user's accessible companies and projects
  const { data: userRoles } = await supabase
    .from('user_roles')
    .select('company_id, project_id, project:projects(company_id)')
    .eq('user_id', userId)
    .eq('is_active', true)
  
  const userCompanyIds = Array.from(new Set(
    userRoles
      .map(ur => ur.company_id || ur.project?.company_id)
      .filter(Boolean)
  ))
  
  const accessibleProjectIds = await getUserAccessibleProjects(userId)
  
  // 3. Get users who have roles in same companies OR projects
  const { data: targetUserRoles } = await supabase
    .from('user_roles')
    .select('user_id')
    .eq('is_active', true)
    .or(`company_id.in.(${userCompanyIds}),project_id.in.(${accessibleProjectIds})`)
  
  const userIds = Array.from(new Set(
    targetUserRoles.map(ur => ur.user_id)
  ))
  
  // 4. Return filtered users
  const { data } = await supabase
    .from('users')
    .select('*')
    .in('id', userIds)
  
  return { users: data }
}
```

**Logic:**
- **Super Admin** → เห็นทุกคน
- **Company Admin (Company A)** → เห็น users ที่มี role ใน Company A หรือ projects ของ Company A
- **Project Admin (Project P1)** → เห็น users ที่มี role ใน Project P1

---

### **3. `getProjects()` - มีการกรองอยู่แล้ว**

```typescript
export async function getProjects(userId: string) {
  // Already uses getUserAccessibleProjects()
  const accessibleProjectIds = await getUserAccessibleProjects(userId)
  
  const { data } = await supabase
    .from('projects')
    .select('*')
    .in('id', accessibleProjectIds)  // ✅ ถูกต้องแล้ว
  
  return { projects: data }
}
```

---

## 📊 ตัวอย่างการทำงาน

### **Scenario: User `svs@email.com`**

สมมติ `svs@email.com` มี role:
```
- Company Admin ของ Company "ABC Property"
- Projects ใน ABC Property: P1, P2, P3
```

#### **Before Fix:**

**getCompanies():**
```
❌ Company A (ABC Property)
❌ Company B (XYZ Developer)  ← ไม่ควรเห็น!
❌ Company C (Other Corp)     ← ไม่ควรเห็น!
```

**getUsers():**
```
❌ User1 (ใน P1)
❌ User2 (ใน P2)
❌ User3 (ใน ProjectX ของ Company B)  ← ไม่ควรเห็น!
❌ User4 (ใน ProjectY ของ Company C)  ← ไม่ควรเห็น!
```

**getProjects():**
```
✅ P1 (ABC Property)
✅ P2 (ABC Property)
✅ P3 (ABC Property)
❌ ProjectX (Company B)  ← บางครั้งเห็น
```

#### **After Fix:**

**getCompanies():**
```
✅ Company A (ABC Property)  ← เฉพาะนี้!
```

**getUsers():**
```
✅ User1 (มี role ใน Company A หรือ P1/P2/P3)
✅ User2 (มี role ใน Company A หรือ P1/P2/P3)
✅ User5 (มี role ใน Company A level)
```

**getProjects():**
```
✅ P1 (ABC Property)
✅ P2 (ABC Property)
✅ P3 (ABC Property)
```

---

## 🔍 SQL Queries Explained

### **Query 1: Get User's Companies**
```sql
-- Get companies from user's roles
SELECT DISTINCT 
  COALESCE(ur.company_id, p.company_id) as company_id
FROM user_roles ur
LEFT JOIN projects p ON ur.project_id = p.id
WHERE ur.user_id = 'svs-user-id'
  AND ur.is_active = true
  AND (ur.company_id IS NOT NULL OR p.company_id IS NOT NULL)

-- Result: ['company-a-id']
```

### **Query 2: Get Users in Same Scope**
```sql
-- Get all users who have roles in the same companies or projects
SELECT DISTINCT user_id
FROM user_roles
WHERE is_active = true
  AND (
    company_id IN ('company-a-id')  -- Same company
    OR 
    project_id IN ('p1-id', 'p2-id', 'p3-id')  -- Same projects
  )

-- Result: ['user1-id', 'user2-id', 'user5-id']
```

---

## 🧪 Testing Steps

### **Test 1: Company Admin**
```bash
1. Login as svs@email.com
2. เข้า "จัดการผู้ใช้และสิทธิ์"
3. ✅ ต้องเห็นเฉพาะ users ในบริษัทของตน
4. ❌ ต้องไม่เห็น users จากบริษัทอื่น

5. ดู dropdown "บริษัท"
6. ✅ ต้องเห็นเฉพาะบริษัทของตน
7. ❌ ต้องไม่เห็นบริษัทอื่น
```

### **Test 2: Project Admin**
```bash
1. Login as user ที่เป็น Project Admin (Project P1 only)
2. เข้า "จัดการผู้ใช้และสิทธิ์"
3. ✅ ต้องเห็นเฉพาะ users ใน Project P1
4. ❌ ต้องไม่เห็น users จาก P2, P3

5. เข้า "กลุ่มผู้ใช้งาน"
6. ✅ dropdown โครงการต้องมีแค่ P1
7. ❌ ต้องไม่มี P2, P3
```

### **Test 3: Super Admin**
```bash
1. Login as Super Admin
2. เข้าทุกหน้า
3. ✅ ต้องเห็นทุกบริษัท
4. ✅ ต้องเห็นทุกโครงการ
5. ✅ ต้องเห็นทุก users
```

---

## 📁 Files Changed

1. **`lib/actions/company-actions.ts`**
   - แก้ `getCompanies()` ให้กรองตาม scope
   - เพิ่ม Super Admin check
   - กรอง companies ตาม user's roles

2. **`lib/actions/user-role-actions.ts`**
   - แก้ `getUsers()` ให้กรองตาม scope
   - รองรับทั้ง company-level และ project-level roles
   - ใช้ OR query สำหรับกรอง

3. **`SCOPE_FILTERING_FIX.md`** (this file)
   - เอกสารอธิบายการแก้ไข

---

## ⚠️ Important Notes

### **User Role Levels:**
```
Super Admin (Level 6)
  → เห็นทุกอย่าง

Company Admin (Level 5)
  → เห็นทุกอย่างใน Companies ที่ดูแล
  → รวม Projects, Users ในบริษัทนั้น

Project Admin (Level 4)
  → เห็นเฉพาะ Projects ที่ดูแล
  → เห็นเฉพาะ Users ใน Projects นั้น
```

### **การกรองต้องทำที่:**
1. ✅ **Server-side** (ใน server actions)
2. ✅ **Database level** (ใช้ IN clause)
3. ❌ **ห้ามกรองแค่ Client-side**

### **Performance Considerations:**
- ใช้ `Array.from(new Set(...))` เพื่อหา unique IDs
- ใช้ `IN` clause แทน multiple queries
- Cache `getUserAccessibleProjects()` result

---

## ✅ Summary

แก้ไข 3 จุดหลัก:

1. ✅ **getCompanies()** - กรองบริษัทตาม user's roles
2. ✅ **getUsers()** - กรอง users ตาม companies และ projects ที่เข้าถึงได้
3. ✅ **getProjects()** - มีการกรองอยู่แล้ว (ใช้ `getUserAccessibleProjects`)

**ผลลัพธ์:**
- Company Admin เห็นเฉพาะข้อมูลในบริษัทตน
- Project Admin เห็นเฉพาะข้อมูลในโครงการตน
- Super Admin เห็นทุกอย่าง

**ระบบกรองข้อมูลตาม Scope ถูกต้องแล้ว! 🎊**

