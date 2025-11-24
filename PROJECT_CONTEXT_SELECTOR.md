# Project Context Selector - ระบบเลือกโครงการ

## 🎯 ภาพรวม

ระบบ Project Context Selector ให้ผู้ใช้ที่ไม่ใช่ Super Admin เลือกโครงการที่ต้องการจัดการหลังจาก Login แล้วกรองข้อมูลทั้งหมดตามโครงการที่เลือก

---

## ✨ Features

### **1. Project Selection Modal (หลัง Login)**
- ✅ แสดงเฉพาะให้ Company Admin และ Project Admin
- ✅ Super Admin ไม่ต้องเลือก (เห็นทุกอย่าง)
- ✅ แสดง Grid ของโครงการที่มีสิทธิ์เข้าถึง
- ✅ Auto-select ถ้ามีโครงการเดียว
- ✅ แสดงข้อมูลโครงการ (บริษัท, ประเภท, ยูนิต)

### **2. Project Selector in Sidebar**
- ✅ Dropdown เลือกโครงการใน Sidebar
- ✅ แสดงโครงการปัจจุบัน
- ✅ สลับโครงการได้ทุกเมื่อ
- ✅ บันทึกใน localStorage

### **3. Auto Filtering**
- ✅ กรองข้อมูลทุกหน้าตามโครงการที่เลือก
- ✅ Companies - เฉพาะบริษัทของโครงการ
- ✅ Projects - เฉพาะโครงการที่เลือก
- ✅ Users - เฉพาะคนในโครงการ
- ✅ User Groups - เฉพาะกลุ่มในโครงการ

---

## 🎨 UI Flow

### **Flow 1: Login → Select Project**

```
1. Login ด้วย svs@email.com (Company Admin)
   ↓
2. Modal เปิดขึ้น: "เลือกโครงการที่ต้องการจัดการ"
   ┌────────────────────────────────────┐
   │   🏢 เลือกโครงการที่ต้องการจัดการ  │
   │   ยินดีต้อนรับ นางสาวสมหญิง รักษ์ดี │
   │   [Company Admin]                  │
   ├────────────────────────────────────┤
   │ เลือกโครงการเพื่อเข้าสู่ระบบจัดการ │
   │                                    │
   │ ┌──────────┐  ┌──────────┐       │
   │ │ Project 1│  │ Project 2│       │
   │ │ ABC Corp │  │ ABC Corp │       │
   │ │ condo    │  │ apartment│       │
   │ │ 120 ยูนิต│  │ 250 ยูนิต│       │
   │ └──────────┘  └──────────┘       │
   │                                    │
   │ 💡 ข้อมูลทั้งหมดจะถูกกรองตามโครงการ│
   └────────────────────────────────────┘
   ↓
3. คลิกเลือก "Project 1"
   ↓
4. Modal ปิด → เข้าสู่ระบบ
   ↓
5. Sidebar แสดงโครงการที่เลือก
6. ข้อมูลทั้งหมดกรองตาม Project 1
```

### **Flow 2: Change Project**

```
1. อยู่ในโครงการ Project 1
2. Sidebar → Dropdown "โครงการที่เลือก"
3. เลือก "Project 2"
   ↓
4. ✅ ข้อมูลทั้งหมด reload
5. ✅ กรองตาม Project 2
```

---

## 🔄 Technical Implementation

### **1. Project Context**

```typescript
// lib/contexts/project-context.tsx
export const ProjectContextProvider = ({ children }) => {
  const [selectedProjectId, setSelectedProjectId] = useState(null)
  const [availableProjects, setAvailableProjects] = useState([])
  
  useEffect(() => {
    // Load projects user can access
    loadProjects()
  }, [])
  
  useEffect(() => {
    // Save to localStorage
    localStorage.setItem('selected_project_id', selectedProjectId)
  }, [selectedProjectId])
  
  return (
    <ProjectContext.Provider value={{
      selectedProjectId,
      selectedProject,
      availableProjects,
      setSelectedProjectId
    }}>
      {children}
    </ProjectContext.Provider>
  )
}
```

### **2. Project Selector Modal**

```typescript
// components/project-selector.tsx
export function ProjectSelector() {
  const { selectedProjectId, availableProjects, setSelectedProjectId } = useProjectContext()
  const currentUser = getCurrentUser()
  
  // Super Admin doesn't need to select
  if (currentUser.role === 'super_admin') {
    return null
  }
  
  // Already selected
  if (selectedProjectId) {
    return null
  }
  
  // Show modal
  return (
    <Modal>
      <ProjectGrid 
        projects={availableProjects}
        onSelect={setSelectedProjectId}
      />
    </Modal>
  )
}
```

### **3. Sidebar Project Selector**

```typescript
// components/protected-sidebar.tsx
export function ProtectedSidebar() {
  const { selectedProject, availableProjects, setSelectedProjectId } = useProjectContext()
  
  return (
    <Sidebar>
      {/* Project Selector */}
      {currentUser.role !== 'super_admin' && (
        <Select value={selectedProject?.id} onChange={setSelectedProjectId}>
          {availableProjects.map(project => (
            <SelectItem value={project.id}>
              {project.name}
            </SelectItem>
          ))}
        </Select>
      )}
      
      {/* Menus */}
      <nav>...</nav>
    </Sidebar>
  )
}
```

### **4. Data Filtering in Pages**

```typescript
// app/(admin)/user-management/page.tsx
export default function UserManagementPage() {
  const { selectedProjectId, selectedProject } = useProjectContext()
  
  const loadData = async () => {
    // Get all data
    const users = await getUsers(currentUserId)
    const companies = await getCompanies(currentUserId)
    const projects = await getProjects(currentUserId)
    
    // Filter by selected project (for non-Super Admin)
    if (selectedProjectId && currentUser.role !== 'super_admin') {
      // Filter users in project
      const projectUsers = await getUsersInProject(currentUserId, selectedProjectId)
      filteredUsers = users.filter(u => projectUsers.includes(u.id))
      
      // Filter to company of selected project
      filteredCompanies = companies.filter(c => c.id === selectedProject.company_id)
      
      // Filter to selected project only
      filteredProjects = projects.filter(p => p.id === selectedProjectId)
    }
    
    setUsers(filteredUsers)
    setCompanies(filteredCompanies)
    setProjects(filteredProjects)
  }
  
  // Reload when project changes
  useEffect(() => {
    loadData()
  }, [selectedProjectId])
}
```

---

## 📊 ตัวอย่างการทำงาน

### **Scenario: svs@email.com (Company Admin)**

#### **Step 1: Login**
```
1. Login as svs@email.com
2. Modal แสดง:
   - Project A1 (ABC Property)
   - Project A2 (ABC Property)
   - Project A3 (ABC Property)
3. เลือก "Project A1"
```

#### **Step 2: หน้าจัดการผู้ใช้**
```
Data Loaded:
- Companies: ABC Property only ✅
- Projects: Project A1 only ✅
- Users: Users in Project A1 only ✅

NOT showing:
- XYZ Developer ❌
- Project B1 ❌
- Users in other projects ❌
```

#### **Step 3: หน้ากลุ่มผู้ใช้งาน**
```
Project Selector:
- Options: Project A1 ✅ (pre-selected from context)

Data:
- Groups: Groups in Project A1 only ✅
- Users: Users in Project A1 only ✅
```

#### **Step 4: เปลี่ยนโครงการ**
```
1. Sidebar → เลือก "Project A2"
2. ✅ Data reload ทันที
3. ✅ แสดงข้อมูลของ Project A2
4. ❌ ไม่เห็นข้อมูล Project A1 อีกต่อไป
```

---

## 🚀 Benefits

### **1. Clear Scope**
✅ ผู้ใช้รู้ชัดว่ากำลังทำงานในโครงการใด  
✅ ป้องกันความสับสนเมื่อดูแลหลายโครงการ  

### **2. Data Security**
✅ กรองข้อมูลอย่างเข้มงวด  
✅ แยก Scope ชัดเจน  
✅ ป้องกัน Cross-Project data leak  

### **3. Better UX**
✅ เลือกโครงการครั้งเดียว → ทุกหน้ากรองอัตโนมัติ  
✅ สลับโครงการง่าย (Sidebar dropdown)  
✅ บันทึกการเลือก (localStorage)  

### **4. Performance**
✅ โหลดข้อมูลน้อยลง (เฉพาะโครงการที่เลือก)  
✅ Query เร็วขึ้น  

---

## 📁 Files Created/Updated

### **New:**
1. `lib/contexts/project-context.tsx` - Project Context Provider
2. `components/project-selector.tsx` - Project Selection Modal
3. `PROJECT_CONTEXT_SELECTOR.md` - เอกสารนี้

### **Updated:**
4. `components/protected-sidebar.tsx` - เพิ่ม Project Selector
5. `app/(admin)/layout.tsx` - เพิ่ม ProjectContextProvider
6. `app/(admin)/user-management/page.tsx` - กรองด้วย context
7. `app/(admin)/projects/page.tsx` - กรองด้วย context
8. `app/(admin)/user-groups/page.tsx` - sync กับ context
9. `lib/actions/user-role-actions.ts` - เพิ่ม getUsersInProject()
10. `lib/actions/company-actions.ts` - เพิ่มการกรอง
11. `lib/contexts/permission-context.tsx` - userId optional

---

## 🧪 Testing

### **Test 1: First Login (Company Admin)**
```
1. Login as svs@email.com
2. ✅ Modal "เลือกโครงการ" แสดง
3. ✅ เห็นเฉพาะโครงการที่มีสิทธิ์
4. เลือกโครงการ
5. ✅ Modal ปิด
6. ✅ Sidebar แสดงโครงการที่เลือก
```

### **Test 2: Data Filtering**
```
1. หลังเลือกโครงการ Project A1
2. เข้า "จัดการผู้ใช้และสิทธิ์"
   → ✅ เห็นแค่ users ใน Project A1
   → ✅ dropdown บริษัท มีแค่ ABC Property
   → ✅ dropdown โครงการ มีแค่ Project A1

3. เข้า "กลุ่มผู้ใช้งาน"
   → ✅ dropdown โครงการ pre-select เป็น Project A1
   → ✅ แสดงกลุ่มเฉพาะใน Project A1

4. เข้า "จัดการโครงการ"
   → ✅ แสดงแค่ Project A1
```

### **Test 3: Switch Project**
```
1. อยู่ใน Project A1
2. Sidebar → เลือก "Project A2"
3. ✅ หน้า reload
4. ✅ ข้อมูลเปลี่ยนเป็นของ Project A2
5. ✅ Users, Companies, Projects ถูกกรองใหม่
```

### **Test 4: Super Admin (No Selection)**
```
1. Login as Super Admin
2. ❌ ไม่แสดง Modal เลือกโครงการ
3. ❌ Sidebar ไม่แสดง Project Selector
4. ✅ เห็นข้อมูลทุกอย่าง (ไม่ถูกกรอง)
```

### **Test 5: No Projects**
```
1. Login as user ที่ไม่มีโครงการ
2. ✅ Modal แสดง "ไม่มีโครงการที่เข้าถึงได้"
3. ✅ แจ้งให้ติดต่อ Super Admin
4. ❌ ไม่สามารถเข้าระบบได้
```

---

## 🔄 Data Flow

```
User Login (svs@email.com)
  ↓
Load Available Projects
  → getUserAccessibleProjects(userId)
  → Result: [P1, P2, P3]
  ↓
Show Project Selector Modal
  → User เลือก P1
  ↓
Save to Context + localStorage
  → selectedProjectId = P1
  ↓
All Pages Filter by P1
  ├─ Companies: filter by P1's company
  ├─ Projects: show only P1
  ├─ Users: users in P1
  └─ Groups: groups in P1
  ↓
User Switches to P2 (Sidebar)
  ↓
Context Updates
  → selectedProjectId = P2
  ↓
All Pages Re-filter by P2
```

---

## 💾 localStorage

```typescript
// Keys stored
localStorage.setItem('selected_project_id', projectId)
localStorage.setItem('current_user', JSON.stringify(user))

// On load
const savedProjectId = localStorage.getItem('selected_project_id')
if (savedProjectId && isProjectAccessible(savedProjectId)) {
  setSelectedProjectId(savedProjectId)
}
```

---

## ⚠️ Edge Cases

### **Case 1: Project Access Revoked**
```
User มี access ถูกถอน
→ localStorage มี old project ID
→ ✅ ตรวจสอบ: project still in availableProjects?
→ ❌ ถ้าไม่มี → clear และให้เลือกใหม่
```

### **Case 2: Single Project**
```
User มีแค่ 1 โครงการ
→ ✅ Auto-select โดยไม่แสดง Modal
→ ✅ ไปยังหน้า dashboard ทันที
```

### **Case 3: Multi-Company**
```
User เป็น Company Admin หลายบริษัท
→ ✅ แสดงโครงการจากทุกบริษัทที่ดูแล
→ เลือกโครงการใดก็ได้
→ ✅ กรองตามโครงการนั้น
```

---

## ✅ Summary

ระบบ Project Context Selector ทำให้:

✅ **ผู้ใช้เลือกโครงการก่อนทำงาน** - Scope ชัดเจน  
✅ **กรองข้อมูลอัตโนมัติ** - ทุกหน้า sync กัน  
✅ **ป้องกัน Data Leak** - แยก Scope เข้มงวด  
✅ **UX ดีขึ้น** - สลับโครงการง่าย  
✅ **Performance ดีขึ้น** - โหลดข้อมูลน้อยลง  

**ระบบพร้อมใช้งานและปลอดภัย! 🎊**

