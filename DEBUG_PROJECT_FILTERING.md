# Debug: Project Filtering Not Working

## 🐛 ปัญหา

เมื่อเปลี่ยนโครงการใน Sidebar ข้อมูลไม่เปลี่ยนตามโครงการที่เลือก

---

## 🔍 Debug Steps

### **1. เปิด Browser Console**

```bash
F12 → Console Tab
```

### **2. เช็ค Console Logs**

เมื่อเปลี่ยนโครงการ ควรเห็น:

```
[ProjectContext] Changing project to: project-id-xxx
[UserManagement] useEffect triggered. selectedProjectId: project-id-xxx
[UserManagement] Users from DB: 50
[UserManagement] Current role: company_admin
[UserManagement] Selected project: project-id-xxx
[UserManagement] Filtering users for project: project-id-xxx
[UserManagement] Project users result: { success: true, userIds: [...] }
[UserManagement] Filtered: 50 → 5
[UserManagement] Final users set: 5
```

### **3. เช็คปัญหา**

#### **Problem A: useEffect ไม่ trigger**
```
เห็น: [ProjectContext] Changing project to: xxx
ไม่เห็น: [UserManagement] useEffect triggered

สาเหตุ: selectedProjectId ไม่เปลี่ยนใน child component

แก้ไข: เช็คว่า useProjectContext() return ค่าถูกต้องหรือไม่
```

#### **Problem B: selectedProjectId is null**
```
เห็น: [UserManagement] Selected project: null

สาเหตุ: Context ยังไม่ได้ load project

แก้ไข: เช็ค ProjectContextProvider wrap ถูกหรือไม่
```

#### **Problem C: Filter ไม่ทำงาน**
```
เห็น: Filtered: 50 → 50 (ไม่ลด)

สาเหตุ: getUsersInProject ไม่ return userIds

แก้ไข: เช็ค server action
```

---

## ✅ Solutions

### **Solution 1: เช็ค Context Wrapper**

```tsx
// app/(admin)/layout.tsx
export default function AdminLayout({ children }) {
  return (
    <ProjectContextProvider>  {/* ✅ ต้องมี */}
      <ProtectedSidebar />
      {children}
    </ProjectContextProvider>
  )
}
```

### **Solution 2: เช็ค useEffect Dependencies**

```tsx
// ❌ Wrong
useEffect(() => {
  loadData()
}, []) // Missing selectedProjectId

// ✅ Correct  
useEffect(() => {
  loadData()
}, [selectedProjectId]) // ✅ Re-run when changes
```

### **Solution 3: เช็ค Context Hook**

```tsx
// ❌ Wrong
const selectedProjectId = "hardcoded-id"

// ✅ Correct
const { selectedProjectId } = useProjectContext()
```

### **Solution 4: Force Reload**

ถ้ายังไม่ work ใช้ custom event:

```tsx
// In component
useEffect(() => {
  const handleProjectChange = (e: any) => {
    console.log('Project changed event:', e.detail.projectId)
    loadData()
  }
  
  window.addEventListener('projectChanged', handleProjectChange)
  
  return () => {
    window.removeEventListener('projectChanged', handleProjectChange)
  }
}, [])
```

---

## 🧪 Manual Testing

### **Test 1: เช็ค Console**

```bash
1. เปิด Console (F12)
2. Login as Company Admin
3. เลือกโครงการ P1
4. เข้า "จัดการผู้ใช้"
5. ดู Console → ต้องมี logs

Expected:
  [UserManagement] Selected project: P1-id
  [UserManagement] Filtering users for project: P1-id
  [UserManagement] Filtered: 50 → 5

6. Sidebar → เปลี่ยนเป็น P2
7. ดู Console → ต้องมี logs ใหม่

Expected:
  [ProjectContext] Changing project to: P2-id
  [UserManagement] useEffect triggered. selectedProjectId: P2-id
  [UserManagement] Filtering users for project: P2-id
  [UserManagement] Filtered: 5 → 3
```

### **Test 2: เช็ค State**

เพิ่ม temporary button:

```tsx
<Button onClick={() => console.log('Current state:', {
  selectedProjectId,
  users: users.length,
  projects: projects.length
})}>
  Debug State
</Button>
```

คลิกแล้วดู Console

### **Test 3: เช็ค localStorage**

```bash
F12 → Application Tab → Local Storage

ควรเห็น:
  selected_project_id: "project-id-xxx"
  current_user: "{...}"

ถ้าเปลี่ยนโครงการ:
  selected_project_id ต้องเปลี่ยนด้วย
```

---

## 🔧 Quick Fix

ถ้ายังไม่ work ให้ทดลอง:

### **Fix 1: Hard Refresh**
```bash
Ctrl + Shift + R (Windows)
Cmd + Shift + R (Mac)
```

### **Fix 2: Clear localStorage**
```javascript
// Console
localStorage.clear()
location.reload()
```

### **Fix 3: เพิ่ม key prop**
```tsx
<main key={selectedProjectId}>
  {children}
</main>
```

---

## 📋 Debug Checklist

- [ ] Console แสดง logs?
- [ ] `[ProjectContext] Changing project to:` แสดงหรือไม่?
- [ ] `[UserManagement] useEffect triggered` แสดงหรือไม่?
- [ ] `selectedProjectId` เปลี่ยนจริงหรือไม่?
- [ ] `getUsersInProject` return userIds?
- [ ] Filter logic ทำงานหรือไม่?
- [ ] `setUsers()` ถูกเรียกหรือไม่?
- [ ] UI update หรือไม่?

---

## 🎯 Expected Console Output

```javascript
// 1. เปลี่ยนโครงการ
[ProjectContext] Changing project to: abc-123

// 2. useEffect trigger
[UserManagement] useEffect triggered. selectedProjectId: abc-123

// 3. Load data
[UserManagement] Users from DB: 50
[UserManagement] Current role: company_admin
[UserManagement] Selected project: abc-123

// 4. Filter
[UserManagement] Filtering users for project: abc-123
[UserManagement] Project users result: { success: true, userIds: ['u1', 'u2', 'u3'] }
[UserManagement] Filtered: 50 → 3

// 5. Set state
[UserManagement] Final users set: 3
```

---

**ลองเช็ค Console แล้วบอกว่าเห็น logs อะไรบ้างครับ!** 🔍

