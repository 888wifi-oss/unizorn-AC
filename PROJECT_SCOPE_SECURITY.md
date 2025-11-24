# Project Scope Security - กลุ่มผู้ใช้งาน

## 🔐 ภาพรวม

ระบบรักษาความปลอดภัยระดับโครงการในหน้า "กลุ่มผู้ใช้งาน" โดยจำกัดการเข้าถึงและการจัดการให้เห็นเฉพาะโครงการที่ผู้ใช้มีสิทธิ์เท่านั้น

---

## 🎯 หลักการทำงาน

### **1. Super Admin (ระดับ 1)**
```
✅ เห็นทุกโครงการในระบบ
✅ จัดการกลุ่มผู้ใช้ได้ในทุกโครงการ
✅ กำหนดสิทธิ์ได้ทุกโมดูล
```

**ตัวอย่าง:**
```sql
SELECT * FROM projects WHERE is_active = true
-- ผลลัพธ์: ทุกโครงการในระบบ
```

---

### **2. Company Admin (ระดับ 2)**
```
✅ เห็นเฉพาะโครงการในบริษัทที่ดูแล
✅ จัดการกลุ่มผู้ใช้ได้เฉพาะโครงการในบริษัทของตน
❌ ไม่เห็นโครงการของบริษัทอื่น
```

**ตัวอย่าง:**
```sql
-- Company Admin ดูแล company_id = "ABC-001"
SELECT * FROM projects 
WHERE company_id = 'ABC-001' AND is_active = true
-- ผลลัพธ์: เฉพาะโครงการของบริษัท ABC เท่านั้น
```

---

### **3. Project Admin (ระดับ 3)**
```
✅ เห็นเฉพาะโครงการที่ถูก assign ให้ดูแล
✅ จัดการกลุ่มผู้ใช้ได้เฉพาะโครงการที่ตนรับผิดชอบ
❌ ไม่เห็นโครงการอื่นๆ แม้จะอยู่ในบริษัทเดียวกัน
```

**ตัวอย่าง:**
```sql
-- Project Admin ถูก assign ให้ดูแล project_id = "P001", "P002"
SELECT * FROM projects 
WHERE id IN ('P001', 'P002') AND is_active = true
-- ผลลัพธ์: เฉพาะ 2 โครงการที่ได้รับมอบหมาย
```

---

## 🛡️ Security Implementation

### **Backend: `getUserAccessibleProjects()`**

```typescript
// lib/permissions/permission-checker.ts

export async function getUserAccessibleProjects(userId: string): Promise<string[]> {
  // 1. Check if Super Admin
  if (isSuperAdmin) {
    return getAllProjects()  // ทุกโครงการ
  }
  
  // 2. Check if Company Admin
  const companyAdminCompanies = getUserCompanies(userId, 'company_admin')
  if (companyAdminCompanies.length > 0) {
    return getProjectsByCompanies(companyAdminCompanies)  // โครงการในบริษัทที่ดูแล
  }
  
  // 3. Otherwise, get specific assigned projects
  return getUserAssignedProjects(userId)  // โครงการที่ถูก assign
}
```

### **Frontend: Project Selector Filter**

```typescript
// app/(admin)/user-groups/page.tsx

const loadData = async () => {
  // ดึงเฉพาะโครงการที่ user มีสิทธิ์
  const projectsResult = await getProjects(currentUserId)
  
  if (projectsResult.success) {
    setProjects(projectsResult.projects || [])  // Auto-filtered โดย backend
  }
}
```

---

## 🎨 UI/UX Features

### **1. Warning Message**
```tsx
{currentUser.role !== 'super_admin' && (
  <span className="text-amber-600">
    ⓘ คุณสามารถเห็นเฉพาะโครงการที่ได้รับมอบหมายเท่านั้น
  </span>
)}
```

### **2. Empty State**
```tsx
{projects.length === 0 && (
  <div>ไม่มีโครงการที่คุณสามารถเข้าถึงได้</div>
)}
```

### **3. Project Info Display**
```tsx
<SelectItem value={project.id}>
  {project.name}
  <span className="text-xs text-muted-foreground">
    ({project.company.name})
  </span>
</SelectItem>
```

### **4. Role Badge**
```tsx
{currentUser.role === 'super_admin' && (
  <>🌟 Super Admin: เข้าถึงได้ทุกโครงการ (5 โครงการ)</>
)}
{currentUser.role === 'company_admin' && (
  <>👔 Company Admin: เข้าถึงโครงการในบริษัทที่ดูแล (3 โครงการ)</>
)}
{currentUser.role === 'project_admin' && (
  <>🏢 Project Admin: เข้าถึงโครงการที่ได้รับมอบหมาย (2 โครงการ)</>
)}
```

---

## 📊 Test Scenarios

### **Test 1: Super Admin**
```
Given: User is Super Admin
When: เข้าหน้า "กลุ่มผู้ใช้งาน"
Then: 
  ✅ เห็นโครงการทั้งหมดในระบบ
  ✅ แสดงข้อความ "🌟 Super Admin: เข้าถึงได้ทุกโครงการ (X โครงการ)"
  ✅ ไม่เห็น warning message
```

### **Test 2: Company Admin**
```
Given: User is Company Admin ของบริษัท "ABC Property"
  - ABC Property มีโครงการ: P1, P2, P3
  - บริษัทอื่น (XYZ) มีโครงการ: P4, P5
When: เข้าหน้า "กลุ่มผู้ใช้งาน"
Then: 
  ✅ เห็นเฉพาะโครงการ P1, P2, P3 (3 โครงการ)
  ❌ ไม่เห็น P4, P5
  ✅ แสดงข้อความ "👔 Company Admin: เข้าถึงโครงการในบริษัทที่ดูแล (3 โครงการ)"
  ✅ เห็น warning "คุณสามารถเห็นเฉพาะโครงการที่ได้รับมอบหมายเท่านั้น"
```

### **Test 3: Project Admin**
```
Given: User is Project Admin ถูก assign ให้ดูแล P1, P3
  - บริษัทมีโครงการ: P1, P2, P3, P4
When: เข้าหน้า "กลุ่มผู้ใช้งาน"
Then: 
  ✅ เห็นเฉพาะโครงการ P1, P3 (2 โครงการ)
  ❌ ไม่เห็น P2, P4 (แม้จะอยู่ในบริษัทเดียวกัน)
  ✅ แสดงข้อความ "🏢 Project Admin: เข้าถึงโครงการที่ได้รับมอบหมาย (2 โครงการ)"
  ✅ เห็น warning "คุณสามารถเห็นเฉพาะโครงการที่ได้รับมอบหมายเท่านั้น"
```

### **Test 4: Project Admin - ไม่มีโครงการ**
```
Given: User is Project Admin แต่ยังไม่ถูก assign โครงการใดๆ
When: เข้าหน้า "กลุ่มผู้ใช้งาน"
Then: 
  ❌ Dropdown แสดง "ไม่มีโครงการที่คุณสามารถเข้าถึงได้"
  ✅ ไม่สามารถเลือกโครงการได้
  ✅ ไม่แสดงกลุ่มผู้ใช้งานใดๆ
```

### **Test 5: Cross-Company Access Prevention**
```
Given: 
  - User A is Company Admin ของ Company X
  - User B is Company Admin ของ Company Y
  - Company X มีโครงการ P1
  - Company Y มีโครงการ P2
When: User A เข้าหน้า "กลุ่มผู้ใช้งาน"
Then: 
  ✅ User A เห็นเฉพาะ P1
  ❌ User A ไม่เห็น P2
  
When: User B เข้าหน้า "กลุ่มผู้ใช้งาน"
Then: 
  ✅ User B เห็นเฉพาะ P2
  ❌ User B ไม่เห็น P1
```

---

## 🔍 Database RLS (Row Level Security)

### **Projects Table Policy**
```sql
-- Policy: User can only see accessible projects
CREATE POLICY "users_can_view_accessible_projects"
ON projects FOR SELECT
USING (
  -- Super Admin sees all
  EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = auth.uid()
    AND r.name = 'super_admin'
    AND ur.is_active = true
  )
  OR
  -- Company Admin sees projects in their companies
  company_id IN (
    SELECT ur.company_id FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = auth.uid()
    AND r.name = 'company_admin'
    AND ur.is_active = true
  )
  OR
  -- Others see only assigned projects
  id IN (
    SELECT ur.project_id FROM user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.is_active = true
    AND ur.project_id IS NOT NULL
  )
);
```

### **User Groups Policy**
```sql
-- Policy: User can only manage groups in accessible projects
CREATE POLICY "users_can_manage_groups_in_accessible_projects"
ON user_groups FOR ALL
USING (
  project_id IN (
    SELECT * FROM get_user_accessible_projects(auth.uid())
  )
);
```

---

## 📈 Performance Considerations

### **1. Caching Strategy**
```typescript
// Cache user's accessible projects
const [accessibleProjects, setAccessibleProjects] = useState<string[]>([])

useEffect(() => {
  // Load once and cache
  getUserAccessibleProjects(userId).then(setAccessibleProjects)
}, [userId])
```

### **2. Query Optimization**
```sql
-- Use indexes for fast filtering
CREATE INDEX idx_projects_company_id ON projects(company_id);
CREATE INDEX idx_user_roles_user_project ON user_roles(user_id, project_id);
CREATE INDEX idx_user_roles_user_company ON user_roles(user_id, company_id);
```

### **3. Batch Loading**
```typescript
// Load projects with company info in single query
const { data } = await supabase
  .from('projects')
  .select(`*, company:companies(id, name)`)
  .in('id', accessibleProjectIds)
```

---

## ⚠️ Security Best Practices

### **1. Never Trust Frontend**
```typescript
// ❌ Bad: Filter on client only
const filteredProjects = allProjects.filter(p => userProjectIds.includes(p.id))

// ✅ Good: Filter on server with RLS
const projects = await getProjects(userId)  // Already filtered by backend
```

### **2. Double-Check on Backend**
```typescript
// Always verify project access before operations
export async function createUserGroup(userId: string, data: any) {
  // Check if user can manage this project
  const canManage = await canManageProject(userId, data.project_id)
  if (!canManage) {
    return { success: false, error: 'Access denied' }
  }
  
  // Proceed with creation
  // ...
}
```

### **3. Audit Trail**
```typescript
// Log all project access attempts
await logAccess({
  userId,
  action: 'view_user_groups',
  projectId,
  timestamp: new Date(),
  allowed: canAccess
})
```

---

## 🚀 Future Enhancements

1. **Project Groups/Portfolios**
   - จัดกลุ่มโครงการให้ง่ายต่อการจัดการ
   - User สามารถเข้าถึงได้ทั้ง Portfolio

2. **Temporary Project Access**
   - มอบหมายสิทธิ์ชั่วคราว (มีวันหมดอายุ)
   - Auto-revoke เมื่อครบกำหนด

3. **Delegation**
   - Project Admin สามารถมอบสิทธิ์ชั่วคราวให้คนอื่นได้
   - ต้องได้รับอนุมัติจาก Company Admin

4. **Access Request**
   - User สามารถขอเข้าถึงโครงการเพิ่มได้
   - มี Approval workflow

---

## 📚 Related Files

### **Backend Security**
- `lib/permissions/permission-checker.ts` - `getUserAccessibleProjects()`
- `lib/actions/project-actions.ts` - `getProjects()` with filtering
- `lib/actions/user-group-actions.ts` - Group actions with project checks

### **Frontend**
- `app/(admin)/user-groups/page.tsx` - Project selector UI
- `components/permission-matrix.tsx` - Permission UI

### **Database**
- `scripts/013_multi_tenancy_permissions.sql` - RLS Policies
- `scripts/015_user_groups_multi_project.sql` - User Groups schema

---

## ✅ Security Checklist

เมื่อพัฒนาฟีเจอร์ใหม่ที่เกี่ยวกับโครงการ:

- [ ] ใช้ `getUserAccessibleProjects()` ในการกรองโครงการ
- [ ] เช็ค `canManageProject()` ก่อนทำการแก้ไข/ลบ
- [ ] ใช้ RLS Policies ในฐานข้อมูล
- [ ] แสดง warning message สำหรับ non-Super Admin
- [ ] Handle empty state (ไม่มีโครงการ)
- [ ] แสดงข้อมูลบริษัทพร้อมกับชื่อโครงการ
- [ ] Test กับทุก role level
- [ ] Test cross-company access prevention
- [ ] Log audit trail

---

## 🎊 Summary

การรักษาความปลอดภัยระดับโครงการทำให้:

✅ **User เห็นเฉพาะโครงการที่มีสิทธิ์** - ป้องกันการเข้าถึงข้อมูลที่ไม่ได้รับอนุญาต  
✅ **Company Admin จัดการได้เฉพาะบริษัทตน** - แยกข้อมูลระหว่างบริษัท  
✅ **Project Admin จัดการได้เฉพาะโครงการที่รับผิดชอบ** - Least Privilege Principle  
✅ **Super Admin มีสิทธิ์เต็ม** - จัดการทั้งระบบได้  

**ระบบปลอดภัยและพร้อมใช้งานแล้ว! 🔐**
