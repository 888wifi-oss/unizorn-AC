# Testing Guide: Project Scope Security

## 🧪 คู่มือทดสอบความปลอดภัยระดับโครงการ

---

## 📋 Pre-requisites

### **1. ข้อมูลทดสอบที่ต้องมี**

```sql
-- Companies
Company A (ID: ABC-001)
Company B (ID: XYZ-002)

-- Projects
Company A:
  - Project A1 (ID: P-001)
  - Project A2 (ID: P-002)
  - Project A3 (ID: P-003)

Company B:
  - Project B1 (ID: P-004)
  - Project B2 (ID: P-005)

-- Users
User 1: Super Admin
User 2: Company Admin (Company A)
User 3: Company Admin (Company B)
User 4: Project Admin (Project A1, A3)
User 5: Project Admin (Project B1)
```

---

## 🎯 Test Cases

### **Test Case 1: Super Admin - Full Access**

**Objective:** ตรวจสอบว่า Super Admin เห็นและจัดการได้ทุกโครงการ

**Steps:**
1. Login as User 1 (Super Admin)
2. เข้าหน้า "กลุ่มผู้ใช้งาน"
3. ดูที่ Project Selector dropdown

**Expected Results:**
```
✅ เห็นโครงการทั้งหมด 5 โครงการ:
   - Project A1 (Company A)
   - Project A2 (Company A)
   - Project A3 (Company A)
   - Project B1 (Company B)
   - Project B2 (Company B)

✅ แสดงข้อความ: "🌟 Super Admin: เข้าถึงได้ทุกโครงการ (5 โครงการ)"

✅ ไม่แสดง warning message สีเหลือง

✅ สามารถสลับระหว่างโครงการได้ทั้งหมด

✅ สามารถสร้าง/แก้ไข/ลบ กลุ่มผู้ใช้ได้ในทุกโครงการ
```

**SQL Verification:**
```sql
-- ตรวจสอบว่า query ได้โครงการทั้งหมด
SELECT COUNT(*) FROM projects WHERE is_active = true;
-- Expected: 5 rows
```

---

### **Test Case 2: Company Admin - Company Scope**

**Objective:** ตรวจสอบว่า Company Admin เห็นเฉพาะโครงการในบริษัทตน

**Steps:**
1. Login as User 2 (Company Admin - Company A)
2. เข้าหน้า "กลุ่มผู้ใช้งาน"
3. ดูที่ Project Selector dropdown

**Expected Results:**
```
✅ เห็นเฉพาะโครงการของ Company A (3 โครงการ):
   - Project A1
   - Project A2
   - Project A3

❌ ไม่เห็นโครงการของ Company B:
   - Project B1 (ไม่แสดง)
   - Project B2 (ไม่แสดง)

✅ แสดงข้อความ: "👔 Company Admin: เข้าถึงโครงการในบริษัทที่ดูแล (3 โครงการ)"

✅ แสดง warning: "ⓘ คุณสามารถเห็นเฉพาะโครงการที่ได้รับมอบหมายเท่านั้น"

✅ สามารถจัดการกลุ่มได้เฉพาะโครงการ A1, A2, A3

❌ ไม่สามารถเข้าถึง URL โดยตรงของโครงการ B1, B2
```

**SQL Verification:**
```sql
-- ตรวจสอบว่า User 2 เป็น Company Admin ของ Company A
SELECT * FROM user_roles ur
JOIN roles r ON ur.role_id = r.id
WHERE ur.user_id = 'user-2-id'
AND r.name = 'company_admin'
AND ur.company_id = 'ABC-001';
-- Expected: 1 row

-- ตรวจสอบโครงการที่ User 2 เข้าถึงได้
SELECT * FROM projects 
WHERE company_id = 'ABC-001';
-- Expected: 3 rows (A1, A2, A3)
```

---

### **Test Case 3: Cross-Company Isolation**

**Objective:** ตรวจสอบว่าข้อมูลแยกกันชัดเจนระหว่างบริษัท

**Steps:**
1. Login as User 2 (Company Admin - Company A)
2. เข้าหน้า "กลุ่มผู้ใช้งาน"
3. เลือก Project A1
4. สร้างกลุ่ม "Test Group A"
5. Logout

6. Login as User 3 (Company Admin - Company B)
7. เข้าหน้า "กลุ่มผู้ใช้งาน"
8. ดู Project selector

**Expected Results:**
```
For User 2 (Company A):
✅ เห็นเฉพาะ Project A1, A2, A3
✅ สร้างกลุ่ม "Test Group A" ใน Project A1 สำเร็จ
✅ เห็นกลุ่ม "Test Group A" ใน Project A1

For User 3 (Company B):
✅ เห็นเฉพาะ Project B1, B2
❌ ไม่เห็น Project A1, A2, A3
❌ ไม่เห็นกลุ่ม "Test Group A"
✅ สามารถสร้างกลุ่มใน Project B1 ได้อิสระ
```

**Security Test:**
```bash
# พยายาม access โดยตรงผ่าน URL
GET /api/user-groups?projectId=P-004 (Project B1)
Authorization: Bearer <User 2 Token>

# Expected Response:
{
  "success": false,
  "error": "Access denied"
}
```

---

### **Test Case 4: Project Admin - Specific Projects**

**Objective:** ตรวจสอบว่า Project Admin เห็นเฉพาะโครงการที่ถูก assign

**Steps:**
1. Login as User 4 (Project Admin - P-001, P-003)
2. เข้าหน้า "กลุ่มผู้ใช้งาน"
3. ดูที่ Project Selector

**Expected Results:**
```
✅ เห็นเฉพาะ 2 โครงการที่ถูก assign:
   - Project A1 (P-001)
   - Project A3 (P-003)

❌ ไม่เห็นโครงการอื่น แม้จะอยู่ในบริษัทเดียวกัน:
   - Project A2 (ไม่แสดง)
   - Project B1 (ไม่แสดง)
   - Project B2 (ไม่แสดง)

✅ แสดงข้อความ: "🏢 Project Admin: เข้าถึงโครงการที่ได้รับมอบหมาย (2 โครงการ)"

✅ แสดง warning: "ⓘ คุณสามารถเห็นเฉพาะโครงการที่ได้รับมอบหมายเท่านั้น"

✅ สามารถจัดการกลุ่มได้เฉพาะ P-001 และ P-003

❌ ไม่สามารถจัดการกลุ่มใน P-002 (แม้จะอยู่บริษัทเดียวกัน)
```

**SQL Verification:**
```sql
-- ตรวจสอบโครงการที่ User 4 ถูก assign
SELECT project_id FROM user_roles
WHERE user_id = 'user-4-id'
AND is_active = true
AND project_id IS NOT NULL;
-- Expected: 2 rows (P-001, P-003)
```

---

### **Test Case 5: Project Admin - No Projects**

**Objective:** ตรวจสอบการแสดงผลเมื่อยังไม่มีโครงการ

**Steps:**
1. สร้าง User ใหม่ (User 6) กับ Role "Project Admin"
2. ยังไม่ assign โครงการใดๆ
3. Login as User 6
4. เข้าหน้า "กลุ่มผู้ใช้งาน"

**Expected Results:**
```
❌ Dropdown แสดง: "ไม่มีโครงการที่คุณสามารถเข้าถึงได้"

❌ ไม่สามารถเลือกโครงการได้

❌ ไม่แสดงตาราง/รายการกลุ่มผู้ใช้งาน

✅ แสดงข้อความ: "กรุณาเลือกโครงการเพื่อดูกลุ่มผู้ใช้งาน"

✅ แสดง warning: "ⓘ คุณสามารถเห็นเฉพาะโครงการที่ได้รับมอบหมายเท่านั้น"
```

---

### **Test Case 6: Project Assignment Changes**

**Objective:** ตรวจสอบว่าระบบอัพเดททันทีเมื่อมีการเปลี่ยนแปลงโครงการ

**Steps:**
1. Login as User 4 (Project Admin - P-001, P-003)
2. เข้าหน้า "กลุ่มผู้ใช้งาน"
3. จำโครงการที่เห็น (2 โครงการ)

4. Super Admin assign โครงการ P-002 เพิ่มให้ User 4

5. User 4 รีเฟรชหน้า

**Expected Results:**
```
Before Assignment:
✅ เห็น 2 โครงการ: P-001, P-003

After Assignment:
✅ เห็น 3 โครงการ: P-001, P-002, P-003
✅ ข้อความเปลี่ยนเป็น "(3 โครงการ)"
✅ สามารถจัดการกลุ่มใน P-002 ได้แล้ว
```

**Reverse Test (Remove Assignment):**
```
Super Admin remove assignment P-003 จาก User 4

After Removal:
✅ เห็นเหลือ 2 โครงการ: P-001, P-002
❌ ไม่เห็น P-003 อีกต่อไป
❌ ไม่สามารถจัดการกลุ่มใน P-003 ได้อีก
```

---

### **Test Case 7: URL Direct Access Prevention**

**Objective:** ป้องกันการเข้าถึงโดยตรงผ่าน URL

**Steps:**
1. Login as User 4 (Project Admin - P-001, P-003)
2. พยายามเข้าถึงโดยตรง:

**Test URLs:**
```bash
# Try to access Project A2 (not assigned)
GET /api/user-groups?projectId=P-002
# Expected: { success: false, error: "Access denied" }

# Try to access Project B1 (different company)
GET /api/user-groups?projectId=P-004
# Expected: { success: false, error: "Access denied" }

# Try to create group in unauthorized project
POST /api/user-groups
Body: { projectId: "P-002", name: "Test" }
# Expected: { success: false, error: "Access denied" }

# Try to edit group in unauthorized project
PUT /api/user-groups/group-id
Body: { projectId: "P-002" }
# Expected: { success: false, error: "Access denied" }
```

**Expected Results:**
```
✅ ทุก request ที่พยายามเข้าถึงโครงการที่ไม่มีสิทธิ์ ถูก reject
✅ ไม่มี data leak
✅ Error message ชัดเจน
✅ Log audit trail บันทึกการพยายามเข้าถึง
```

---

### **Test Case 8: Database RLS Verification**

**Objective:** ตรวจสอบว่า Row Level Security ทำงานถูกต้อง

**Steps:**
1. เชื่อมต่อฐานข้อมูลด้วย User 4 credentials
2. Execute queries โดยตรง

**Test Queries:**
```sql
-- Set user context
SET app.current_user_id = 'user-4-id';

-- Try to select all projects
SELECT * FROM projects;
-- Expected: เฉพาะ P-001 และ P-003 (2 rows)

-- Try to select project not assigned
SELECT * FROM projects WHERE id = 'P-002';
-- Expected: 0 rows (blocked by RLS)

-- Try to select user groups from unauthorized project
SELECT * FROM user_groups WHERE project_id = 'P-002';
-- Expected: 0 rows (blocked by RLS)

-- Try to insert group in unauthorized project
INSERT INTO user_groups (name, project_id, ...) 
VALUES ('Test', 'P-002', ...);
-- Expected: ERROR: policy violation
```

---

### **Test Case 9: Performance Test**

**Objective:** ตรวจสอบ performance เมื่อมีโครงการจำนวนมาก

**Scenario:**
```
Super Admin: 1000 โครงการ
Company Admin: 100 โครงการ
Project Admin: 10 โครงการ
```

**Metrics to Check:**
```
✅ Page load time < 2 seconds
✅ Dropdown render time < 500ms
✅ Project filter query time < 200ms
✅ Memory usage < 50MB
```

**Optimization Checks:**
```sql
-- Check query plan
EXPLAIN ANALYZE
SELECT * FROM projects 
WHERE id IN (
  SELECT project_id FROM user_roles 
  WHERE user_id = 'user-id' AND is_active = true
);

-- Verify indexes are used
-- Expected: Index Scan on idx_user_roles_user_project
```

---

## 🎬 Test Execution Steps

### **1. Setup Test Environment**
```bash
# Run SQL scripts
psql -f scripts/013_multi_tenancy_permissions.sql
psql -f scripts/015_user_groups_multi_project.sql
psql -f scripts/test_data.sql

# Start dev server
npm run dev
```

### **2. Execute All Tests**
```bash
# Manual testing
1. Follow each test case step-by-step
2. Document actual vs expected results
3. Take screenshots for deviations

# Automated testing (future)
npm run test:security:project-scope
```

### **3. Report Results**
```markdown
## Test Results Summary

| Test Case | Status | Notes |
|-----------|--------|-------|
| TC1: Super Admin | ✅ PASS | All projects visible |
| TC2: Company Admin | ✅ PASS | Only company projects |
| TC3: Cross-Company | ✅ PASS | Isolation verified |
| TC4: Project Admin | ✅ PASS | Only assigned projects |
| TC5: No Projects | ✅ PASS | Empty state correct |
| TC6: Assignment Change | ✅ PASS | Updates reflected |
| TC7: URL Access | ✅ PASS | All blocked correctly |
| TC8: RLS | ✅ PASS | Policies working |
| TC9: Performance | ⚠️ WARNING | Load time 2.5s |
```

---

## 🐛 Known Issues & Edge Cases

### **Edge Case 1: User with Multiple Roles**
```
User has:
- Company Admin for Company A
- Project Admin for Project B1 (Company B)

Expected Behavior:
✅ See all projects in Company A (from Company Admin)
✅ See Project B1 (from Project Admin)
✅ Total: Company A projects + B1
```

### **Edge Case 2: Deactivated Projects**
```
User assigned to Project P1 (is_active = false)

Expected Behavior:
❌ Should NOT see Project P1
✅ Only active projects (is_active = true)
```

### **Edge Case 3: Deleted Company**
```
User is Company Admin of deleted company

Expected Behavior:
❌ Should NOT see any projects
✅ Message: "ไม่มีโครงการที่คุณสามารถเข้าถึงได้"
```

---

## ✅ Checklist

Before deploying to production:

- [ ] All 9 test cases pass
- [ ] Performance metrics within acceptable range
- [ ] RLS policies verified
- [ ] Audit logs working
- [ ] Error handling tested
- [ ] Empty states handled
- [ ] Cross-company isolation verified
- [ ] URL direct access blocked
- [ ] Database queries optimized
- [ ] Documentation updated

---

## 📚 References

- **Security Documentation:** `PROJECT_SCOPE_SECURITY.md`
- **Permission System:** `PERMISSION_SYSTEM_COMPLETE.md`
- **API Documentation:** `lib/actions/user-group-actions.ts`
- **Database Schema:** `scripts/015_user_groups_multi_project.sql`

---

**ทดสอบให้ครบทุก Test Case เพื่อความมั่นใจในความปลอดภัย! 🔐**

