# Final Scope Security Fix

## 🎯 ปัญหาที่แก้ไข

### **ปัญหาจาก svs@email.com (Company Admin):**

1. ❌ **Company Admin เห็นทุกโครงการในบริษัท** - ควรเห็นเฉพาะที่ถูก assign
2. ❌ **หน้าจัดการบริษัทเข้าได้** - ควรเฉพาะ Super Admin

---

## ✅ การแก้ไขทั้งหมด

### **1. แก้ `getUserAccessibleProjects()` - ให้ถูกต้อง**

#### **Before (ผิด):**
```typescript
// Company Admin ได้ทุกโครงการในบริษัท
if (companyAdminCompanies.length > 0) {
  // Get ALL projects in their companies
  const { data } = await supabase
    .from('projects')
    .select('id')
    .in('company_id', companyAdminCompanies)  // ❌ ทุกโครงการในบริษัท
  
  return projectIds  // ❌ เยอะเกินไป!
}
```

**ตัวอย่าง:**
```
User: Company Admin ของ ABC Property
ABC Property มี: P1, P2, P3, P4, P5 (5 โครงการ)
User ถูก assign แค่: P1, P2

Before: เห็นทุกโครงการ (P1, P2, P3, P4, P5) ❌
```

#### **After (ถูกต้อง):**
```typescript
// Company Admin ต้องถูก assign โครงการเฉพาะเหมือน Project Admin
const { data: userProjects } = await supabase
  .from('user_roles')
  .select('project_id')
  .eq('user_id', userId)
  .eq('is_active', true)
  .not('project_id', 'is', null)  // ✅ เฉพาะที่มี project_id

return projectIds.filter(Boolean)  // ✅ เฉพาะที่ถูก assign
```

**ตัวอย่าง:**
```
User: Company Admin ของ ABC Property
ABC Property มี: P1, P2, P3, P4, P5 (5 โครงการ)
User ถูก assign แค่: P1, P2

After: เห็นเฉพาะ P1, P2 ✅
```

---

### **2. ซ่อนหน้าจัดการบริษัท**

#### **Sidebar - แยกเมนู**

**Before:**
```tsx
{
  label: 'ระบบ (System)',
  minRoleLevel: 4,  // Project Admin ขึ้นไป
  items: [
    { label: "จัดการบริษัท", ... },  // ❌ Project Admin เห็น
    { label: "จัดการโครงการ", ... },
    { label: "จัดการผู้ใช้", ... },
  ]
}
```

**After:**
```tsx
{
  label: 'Super Admin',
  minRoleLevel: 6,  // ✅ เฉพาะ Super Admin
  items: [
    { label: "จัดการบริษัท", ... },  // ✅ เฉพาะ Super Admin
  ]
},
{
  label: 'ระบบ (System)',
  minRoleLevel: 4,  // Project Admin ขึ้นไป
  items: [
    { label: "จัดการโครงการ", ... },
    { label: "จัดการผู้ใช้", ... },
  ]
}
```

#### **Route Protection**

```tsx
// app/(admin)/companies/page.tsx
export default function CompaniesPage() {
  const currentUser = getCurrentUser()
  const router = useRouter()
  
  // ✅ Check on mount
  useEffect(() => {
    if (currentUser.role !== 'super_admin') {
      router.push('/projects')  // Redirect
    }
  }, [])
  
  // ✅ Show access denied UI
  if (currentUser.role !== 'super_admin') {
    return (
      <Card>
        <CardContent>
          <AlertCircle />
          <h3>ไม่มีสิทธิ์เข้าถึง</h3>
          <p>เฉพาะ Super Admin เท่านั้น</p>
          <Button onClick={() => router.push('/projects')}>
            กลับไป
          </Button>
        </CardContent>
      </Card>
    )
  }
  
  // ... rest of page
}
```

---

### **3. Project Context Selector**

#### **Flow:**
```
Login (Company Admin)
  ↓
Load accessible projects
  → getUserAccessibleProjects(userId)
  → Result: [P1, P2] (เฉพาะที่ assign)
  ↓
Show Project Selector Modal
  ┌─────────────────────────┐
  │ เลือกโครงการ            │
  ├─────────────────────────┤
  │ ☐ Project 1             │
  │ ☐ Project 2             │
  └─────────────────────────┘
  ↓
User เลือก P1
  ↓
Save to Context
  → selectedProjectId = P1
  ↓
All data filtered by P1
  → Companies: บริษัทของ P1
  → Projects: P1 only
  → Users: Users in P1
```

---

## 📊 ตัวอย่างการทำงาน

### **Scenario: svs@email.com**

**User Info:**
```
Role: Company Admin
Company: ABC Property
Assigned Projects: P1, P2 (จาก 5 โครงการ)
```

#### **Before Fix:**
```
Login → เข้าระบบ

หน้าจัดการบริษัท:
  ✅ เข้าได้ (ผิด! ❌)
  → เห็นบริษัททั้งหมด

หน้าจัดการโครงการ:
  → เห็นทุกโครงการ P1, P2, P3, P4, P5 (ผิด! ❌)
  
หน้าจัดการผู้ใช้:
  → เห็น users จากทุกโครงการ (ผิด! ❌)
```

#### **After Fix:**
```
Login → Modal เลือกโครงการ

Modal แสดง:
  ☐ Project 1 (P1) ✅
  ☐ Project 2 (P2) ✅
  (เฉพาะ 2 โครงการที่ assign)

เลือก P1 → เข้าระบบ

Sidebar:
  ❌ "จัดการบริษัท" ไม่แสดง (Super Admin only)
  ✅ "จัดการโครงการ" แสดง
  
  โครงการที่เลือก: [Project 1 ▼]
  📊 120 ยูนิต • condo

หน้าจัดการโครงการ:
  → เห็นแค่ P1 ✅
  
หน้าจัดการผู้ใช้:
  → เห็นแค่ users ใน P1 ✅
  → Companies dropdown: ABC Property ✅
  → Projects dropdown: P1 ✅

หน้ากลุ่มผู้ใช้งาน:
  → โครงการ pre-selected: P1 ✅
  → Groups: Groups in P1 ✅

พยายามเข้า /companies:
  → Redirect to /projects ทันที ✅
  → หรือแสดง "ไม่มีสิทธิ์เข้าถึง" ✅
```

---

## 🔐 Security Layers

### **Layer 1: Database (RLS)**
```sql
-- Users can only see assigned projects
CREATE POLICY "users_see_assigned_projects" ON projects
USING (
  id IN (
    SELECT project_id FROM user_roles
    WHERE user_id = auth.uid() AND project_id IS NOT NULL
  )
);
```

### **Layer 2: Server Actions**
```typescript
export async function getUserAccessibleProjects(userId: string) {
  // Only return projects with explicit assignment
  const { data } = await supabase
    .from('user_roles')
    .select('project_id')
    .eq('user_id', userId)
    .not('project_id', 'is', null)  // ✅ Must have project_id
  
  return projectIds
}
```

### **Layer 3: Route Protection**
```typescript
// app/(admin)/companies/page.tsx
if (currentUser.role !== 'super_admin') {
  return <AccessDenied />  // ✅ UI protection
}
```

### **Layer 4: Menu Visibility**
```typescript
// Sidebar
{
  label: 'Super Admin',
  minRoleLevel: 6,  // ✅ Only level 6 (Super Admin)
  items: [...]
}
```

### **Layer 5: Frontend Filtering**
```typescript
// Pages
if (selectedProjectId && role !== 'super_admin') {
  data = data.filter(item => item.project_id === selectedProjectId)
}
```

---

## 📋 Summary of Changes

### **Files Changed:**

1. **`lib/permissions/permission-checker.ts`**
   - ✅ แก้ `getUserAccessibleProjects()` 
   - ลบ logic ที่ให้ Company Admin เห็นทุกโครงการในบริษัท
   - ตอนนี้ทุก role ต้องถูก assign โครงการเฉพาะ

2. **`components/protected-sidebar.tsx`**
   - ✅ แยกเมนู "จัดการบริษัท" เป็น group "Super Admin"
   - ✅ minRoleLevel = 6 (Super Admin only)
   - ✅ เพิ่ม Project Selector ใน Sidebar

3. **`app/(admin)/companies/page.tsx`**
   - ✅ เพิ่ม Route Protection
   - ✅ Redirect non-Super Admin
   - ✅ แสดง Access Denied UI

4. **`lib/contexts/project-context.tsx`** (New)
   - ✅ Context สำหรับเก็บ selectedProjectId

5. **`components/project-selector.tsx`** (New)
   - ✅ Modal เลือกโครงการหลัง Login

6. **`app/(admin)/layout.tsx`**
   - ✅ เพิ่ม ProjectContextProvider
   - ✅ เพิ่ม ProjectSelector

7. **`app/(admin)/user-management/page.tsx`**
   - ✅ กรองด้วย selectedProjectId

8. **`app/(admin)/projects/page.tsx`**
   - ✅ กรองด้วย selectedProjectId

9. **`app/(admin)/user-groups/page.tsx`**
   - ✅ Sync กับ Project Context

---

## 🧪 Testing Guide

### **Test 1: Company Admin - Project Assignment**
```bash
# Setup
1. สร้าง Company "ABC Property"
2. สร้างโครงการ 5 ตัว: P1, P2, P3, P4, P5
3. สร้าง User "svs@email.com" role Company Admin
4. Assign ONLY P1 และ P2 ให้ svs@email.com

# Test
1. Login as svs@email.com
2. ✅ Modal แสดงเฉพาะ P1, P2
3. ❌ ไม่เห็น P3, P4, P5
4. เลือก P1

5. เช็ค Sidebar:
   ✅ มี "จัดการโครงการ"
   ❌ ไม่มี "จัดการบริษัท"
   ✅ Project Selector แสดง "Project 1"

6. เข้า "จัดการโครงการ":
   ✅ เห็นแค่ P1
   ❌ ไม่เห็น P2, P3, P4, P5

7. Sidebar → สลับเป็น P2:
   ✅ ข้อมูลเปลี่ยนเป็น P2
```

### **Test 2: หน้าจัดการบริษัท - Access Denied**
```bash
1. Login as Company Admin
2. พยายามเข้า /companies

Expected:
  ✅ Redirect to /projects
  หรือ
  ✅ แสดง "ไม่มีสิทธิ์เข้าถึง"
  ✅ ปุ่ม "กลับไป"
```

### **Test 3: Super Admin - Full Access**
```bash
1. Login as Super Admin

Expected:
  ✅ ไม่แสดง Project Selector Modal
  ✅ Sidebar ไม่มี Project Dropdown
  ✅ เห็นเมนู "จัดการบริษัท"
  ✅ เข้า /companies ได้
  ✅ เห็นทุกบริษัท
  ✅ เห็นทุกโครงการ
  ✅ เห็นทุก users
```

### **Test 4: Project Admin**
```bash
1. Login as Project Admin (assigned to P1)

Expected:
  ✅ Modal แสดงเฉพาะ P1
  ✅ Auto-select P1 (มีแค่ 1 โครงการ)
  ✅ Modal ปิดทันที
  ❌ ไม่เห็น "จัดการบริษัท"
  ✅ ข้อมูลทั้งหมดกรองตาม P1
```

---

## 🎯 Key Changes

### **Change 1: Project Assignment is Required**

**Old Logic:**
```
Company Admin → เห็นทุกโครงการในบริษัท (Auto)
Project Admin → เห็นเฉพาะที่ assign
```

**New Logic:**
```
Super Admin → เห็นทุกโครงการ
Company Admin → ต้อง assign เฉพาะโครงการ (เหมือน Project Admin)
Project Admin → ต้อง assign เฉพาะโครงการ
```

### **Change 2: Companies Page is Super Admin Only**

**Access Matrix:**
| Role | จัดการบริษัท | จัดการโครงการ |
|------|-------------|---------------|
| Super Admin | ✅ | ✅ |
| Company Admin | ❌ | ✅ (เฉพาะที่ assign) |
| Project Admin | ❌ | ✅ (เฉพาะที่ assign) |

### **Change 3: Project Context Required**

**Workflow:**
```
1. Login
2. Select Project (ถ้าไม่ใช่ Super Admin)
3. All data filtered by selected project
4. Can switch project anytime (Sidebar)
```

---

## ✅ Security Benefits

1. **✅ Least Privilege** - เห็นเฉพาะที่จำเป็น
2. **✅ Explicit Assignment** - ต้อง assign ชัดเจน ไม่ Auto
3. **✅ Clear Scope** - รู้ว่ากำลังทำงานในโครงการไหน
4. **✅ Multi-Layer Protection** - DB + Server + Route + UI
5. **✅ Audit Trail Ready** - รู้ว่า user เข้าโครงการไหน

---

## 🎊 Final Summary

### **ที่แก้ไขทั้งหมด:**

✅ **Company Admin เห็นเฉพาะโครงการที่ assign** (ไม่ใช่ทั้งบริษัท)  
✅ **หน้าจัดการบริษัท เฉพาะ Super Admin**  
✅ **Project Selector Modal** (เลือกโครงการหลัง Login)  
✅ **Project Dropdown ใน Sidebar** (สลับโครงการได้)  
✅ **Auto Filtering** (ทุกหน้ากรองตามโครงการ)  
✅ **Password Management** (สร้าง + Reset)  
✅ **Scope-based User/Company/Project filtering**  

**ระบบปลอดภัยและทำงานถูกต้องแล้ว! 🔐🎊**

