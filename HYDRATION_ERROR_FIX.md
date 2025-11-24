# Hydration Error Fix + Project Filtering

## 🐛 ปัญหาที่แก้ไข

### **1. Hydration Error**
```
Uncaught Error: Hydration failed because the server rendered HTML 
didn't match the client.
```

**สาเหตุ:** `ProjectSelector` component render ตอน SSR แต่ใช้ `getCurrentUser()` และ `localStorage` ซึ่งมีค่าต่างกันระหว่าง server และ client

### **2. Project เปลี่ยนหลายครั้ง**
```
[ProjectContext] Changing project to: P1
[ProjectContext] Changing project to: P2  
[ProjectContext] Changing project to: P1  ← ซ้ำ!
```

**สาเหตุ:** 
- Auto-select loop
- Duplicate state (local + context)
- Multiple useEffect ทำงานพร้อมกัน

### **3. ข้อมูลไม่ Reload**
```
เปลี่ยนโครงการ P1 → P2
ข้อมูลยังเป็นของ P1 อยู่
```

**สาเหตุ:** Missing `selectedProjectId` ใน useEffect dependencies

---

## ✅ Solutions

### **Solution 1: Fix Hydration Error**

```tsx
// components/project-selector.tsx

// Before
export function ProjectSelector() {
  const currentUser = getCurrentUser()  // ❌ SSR/Client ค่าต่างกัน
  
  if (currentUser.role === 'super_admin') {
    return null  // ❌ Server return null, Client return <div>
  }
  
  return <div>...</div>
}

// After  
export function ProjectSelector() {
  const [mounted, setMounted] = useState(false)
  
  useEffect(() => {
    setMounted(true)  // ✅ Client-only
  }, [])
  
  if (!mounted) {
    return null  // ✅ Both Server and Client return null initially
  }
  
  const currentUser = getCurrentUser()  // ✅ Client-only
  
  if (currentUser.role === 'super_admin') {
    return null
  }
  
  return <div>...</div>
}
```

### **Solution 2: Fix Duplicate State**

```tsx
// app/(admin)/user-groups/page.tsx

// Before
const [selectedProjectId, setSelectedProjectId] = useState("")  // ❌ Local
const { selectedProjectId: contextProjectId } = useProjectContext()  // ❌ Context

// After
const { selectedProjectId, selectedProject, setSelectedProjectId } = useProjectContext()  // ✅ Context only
```

### **Solution 3: Fix Auto-Select Loop**

```tsx
// lib/contexts/project-context.tsx

// Before
useEffect(() => {
  const saved = localStorage.getItem('selected_project_id')
  if (saved) {
    setSelectedProjectId(saved)  // ❌ Always runs
  }
}, [availableProjects])  // ❌ Triggers every time

// After
useEffect(() => {
  if (!selectedProjectId) {  // ✅ Only if not already selected
    const saved = localStorage.getItem('selected_project_id')
    if (saved) {
      setSelectedProjectId(saved)
    }
  }
}, [availableProjects])  // ✅ Run once when projects load
```

### **Solution 4: Add useEffect Dependencies**

```tsx
// All pages
useEffect(() => {
  console.log('Reload data for project:', selectedProjectId)
  loadData()
}, [selectedProjectId])  // ✅ Reload when changes
```

---

## 📁 Files Fixed

1. **`components/project-selector.tsx`**
   - เพิ่ม `mounted` state
   - Prevent SSR render

2. **`lib/contexts/project-context.tsx`**
   - แก้ auto-select loop
   - เพิ่ม condition `!selectedProjectId`

3. **`app/(admin)/user-groups/page.tsx`**
   - ลบ local `selectedProjectId` state
   - ใช้ context เท่านั้น
   - เพิ่ม useEffect dependencies
   - เปลี่ยน `selectedProject` local → `currentProjectName`

4. **`app/(admin)/user-management/page.tsx`**
   - เพิ่ม debug logs

5. **`app/(admin)/projects/page.tsx`**
   - เพิ่ม debug logs

---

## 🧪 Testing

### **Test 1: No Hydration Error**
```bash
1. รีเฟรช (Ctrl+Shift+R)
2. เปิด Console
3. ✅ ไม่มี "Hydration failed" error
4. ✅ ไม่มี warning สีแดง
```

### **Test 2: Project Changes Only Once**
```bash
1. Login
2. เลือกโครงการ P1
3. Console:
   [ProjectContext] Changing project to: P1-id  ← 1 ครั้งเท่านั้น ✅
   
4. Sidebar → เปลี่ยนเป็น P2
5. Console:
   [ProjectContext] Changing project to: P2-id  ← 1 ครั้งเท่านั้น ✅
```

### **Test 3: Data Reloads**
```bash
1. Login, เลือก P1
2. เข้า "จัดการผู้ใช้"
3. Console:
   [UserManagement] Final users set: 5
   
4. Sidebar → เปลี่ยนเป็น P2
5. Console:
   [UserManagement] useEffect triggered. selectedProjectId: P2-id  ✅
   [UserManagement] Filtering...
   [UserManagement] Final users set: 3  ✅ เปลี่ยน!

6. เข้า "กลุ่มผู้ใช้งาน"
7. Sidebar → เปลี่ยนเป็น P1
8. Console:
   [UserGroups] Selected project changed: P1-id  ✅
   [UserGroups] Loading groups...  ✅
```

---

## ✅ Summary

แก้ไข 4 ปัญหา:

✅ **Hydration Error** - ใช้ `mounted` state  
✅ **Duplicate State** - ใช้ context เท่านั้น  
✅ **Auto-Select Loop** - เพิ่ม condition  
✅ **Data Not Reloading** - เพิ่ม useEffect dependencies  

**ระบบควรทำงานถูกต้องแล้ว! 🎊**

