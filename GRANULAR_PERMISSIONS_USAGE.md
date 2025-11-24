# Granular Permissions - คู่มือการใช้งาน

## ภาพรวม
ระบบ Granular Permissions ที่ควบคุมสิทธิ์แบบละเอียดถึงระดับ Action (View, Add, Edit, Delete, Print, Export)

## Actions ที่รองรับ

| Action | Description | Example |
|--------|-------------|---------|
| **view** | ดูข้อมูล | ดูรายการบิล |
| **add** | เพิ่มข้อมูล | สร้างบิลใหม่ |
| **edit** | แก้ไขข้อมูล | แก้ไขบิล |
| **delete** | ลบข้อมูล | ลบบิล |
| **print** | พิมพ์เอกสาร | พิมพ์บิล PDF |
| **export** | ส่งออกข้อมูล | ส่งออก CSV |
| **approve** | อนุมัติ (เฉพาะบางโมดูล) | อนุมัติรายจ่าย |
| **assign** | มอบหมาย (เฉพาะบางโมดูล) | มอบหมายงานซ่อม |

---

## การใช้งานใน Components

### **1. ใช้ useModulePermissions Hook**

```typescript
"use client"

import { useModulePermissions } from '@/lib/hooks/use-module-permissions'
import { Button } from '@/components/ui/button'

export default function BillingPage() {
  const {
    canAccess,
    canView,
    canAdd,
    canEdit,
    canDelete,
    canPrint,
    canExport,
    loading,
    role
  } = useModulePermissions('billing')
  
  if (loading) return <div>Loading...</div>
  
  if (!canAccess) {
    return <div>คุณไม่มีสิทธิ์เข้าถึงหน้านี้</div>
  }
  
  return (
    <div>
      <h1>Billing</h1>
      
      {/* Show buttons based on permissions */}
      {canAdd && (
        <Button onClick={handleCreate}>
          เพิ่มบิล
        </Button>
      )}
      
      {canEdit && (
        <Button onClick={handleEdit}>
          แก้ไข
        </Button>
      )}
      
      {canDelete && (
        <Button variant="destructive" onClick={handleDelete}>
          ลบ
        </Button>
      )}
      
      {canPrint && (
        <Button variant="outline" onClick={handlePrint}>
          พิมพ์
        </Button>
      )}
      
      {canExport && (
        <Button variant="outline" onClick={handleExport}>
          ส่งออก CSV
        </Button>
      )}
      
      {/* Table with conditional edit/delete buttons */}
      <Table>
        {bills.map(bill => (
          <TableRow key={bill.id}>
            <TableCell>{bill.bill_number}</TableCell>
            <TableCell>
              {canEdit && <EditButton bill={bill} />}
              {canDelete && <DeleteButton bill={bill} />}
            </TableCell>
          </TableRow>
        ))}
      </Table>
    </div>
  )
}
```

### **2. ตรวจสอบ Action เดียว**

```typescript
import { useCanPerformAction } from '@/lib/hooks/use-module-permissions'

function DeleteButton({ bill }) {
  const canDelete = useCanPerformAction('billing', 'delete')
  
  if (!canDelete) return null
  
  return (
    <Button variant="destructive" onClick={() => handleDelete(bill.id)}>
      ลบ
    </Button>
  )
}
```

### **3. ตรวจสอบหลาย Actions**

```typescript
import { useModuleActions } from '@/lib/hooks/use-module-permissions'

function BillingToolbar() {
  const { actions, isReadOnly } = useModuleActions('billing')
  
  if (isReadOnly) {
    return <div className="text-muted-foreground">โหมดดูอย่างเดียว</div>
  }
  
  return (
    <div className="flex gap-2">
      {actions.includes('add') && <AddButton />}
      {actions.includes('edit') && <EditButton />}
      {actions.includes('delete') && <DeleteButton />}
      {actions.includes('print') && <PrintButton />}
      {actions.includes('export') && <ExportButton />}
    </div>
  )
}
```

---

## ตัวอย่างการใช้งานในแต่ละโมดูล

### **Billing Page**

```typescript
"use client"

import { useModulePermissions } from '@/lib/hooks/use-module-permissions'

export default function BillingPage() {
  const { canAdd, canEdit, canDelete, canPrint, canExport } = useModulePermissions('billing')
  
  return (
    <div>
      <PageHeader
        title="ออกบิล"
        action={
          <div className="flex gap-2">
            {canAdd && <Button>เพิ่มบิล</Button>}
            {canPrint && <Button variant="outline">พิมพ์</Button>}
            {canExport && <Button variant="outline">ส่งออก CSV</Button>}
          </div>
        }
      />
      
      <Table>
        {bills.map(bill => (
          <TableRow key={bill.id}>
            <TableCell>{bill.bill_number}</TableCell>
            <TableCell className="text-right">
              {canEdit && <Button size="sm">แก้ไข</Button>}
              {canDelete && <Button size="sm" variant="destructive">ลบ</Button>}
            </TableCell>
          </TableRow>
        ))}
      </Table>
    </div>
  )
}
```

### **Maintenance Page (with Assign)**

```typescript
"use client"

import { useModulePermissions } from '@/lib/hooks/use-module-permissions'

export default function MaintenancePage() {
  const { canAdd, canEdit, canDelete, canAssign, role } = useModulePermissions('maintenance')
  
  return (
    <div>
      <PageHeader
        title="งานแจ้งซ่อม"
        action={
          canAdd && <Button>แจ้งซ่อมใหม่</Button>
        }
      />
      
      <Table>
        {requests.map(request => (
          <TableRow key={request.id}>
            <TableCell>{request.title}</TableCell>
            <TableCell className="text-right">
              {canEdit && <Button size="sm">อัปเดตสถานะ</Button>}
              {canAssign && <Button size="sm">มอบหมาย</Button>}
              {canDelete && <Button size="sm" variant="destructive">ลบ</Button>}
            </TableCell>
          </TableRow>
        ))}
      </Table>
      
      {/* Engineer sees different UI */}
      {role === 'engineer' && (
        <div className="text-sm text-muted-foreground">
          แสดงเฉพาะงานที่ได้รับมอบหมาย
        </div>
      )}
    </div>
  )
}
```

### **Chart of Accounts (Admin Only)**

```typescript
"use client"

import { useModulePermissions } from '@/lib/hooks/use-module-permissions'

export default function ChartOfAccountsPage() {
  const { canAccess, canAdd, canEdit, canDelete } = useModulePermissions('chart_of_accounts')
  
  if (!canAccess) {
    return (
      <div className="p-8">
        <h1>ไม่มีสิทธิ์เข้าถึง</h1>
        <p>เฉพาะ Admin เท่านั้นที่สามารถเข้าถึงผังบัญชี</p>
      </div>
    )
  }
  
  return (
    <div>
      <PageHeader
        title="ผังบัญชี"
        action={
          canAdd && <Button>เพิ่มบัญชี</Button>
        }
      />
      
      <Table>
        {accounts.map(account => (
          <TableRow key={account.id}>
            <TableCell>{account.code} - {account.name}</TableCell>
            <TableCell className="text-right">
              {canEdit && <Button size="sm">แก้ไข</Button>}
              {canDelete && <Button size="sm" variant="destructive">ลบ</Button>}
            </TableCell>
          </TableRow>
        ))}
      </Table>
    </div>
  )
}
```

---

## Permission Matrix สำหรับ UI Elements

### **ปุ่มที่แสดงตาม Role (Billing Module)**

| Button | Super Admin | Company Admin | Project Admin | Staff | Engineer | Resident |
|--------|:-----------:|:-------------:|:-------------:|:-----:|:--------:|:--------:|
| เพิ่มบิล | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| แก้ไข | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| ลบ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| พิมพ์ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ |
| ส่งออก CSV | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |

### **ปุ่มที่แสดงตาม Role (Maintenance Module)**

| Button | Super Admin | Company Admin | Project Admin | Staff | Engineer | Resident |
|--------|:-----------:|:-------------:|:-------------:|:-----:|:--------:|:--------:|
| แจ้งซ่อมใหม่ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| อัปเดตสถานะ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| มอบหมาย | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| ลบ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| พิมพ์ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| ส่งออก CSV | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |

---

## การทดสอบ

### **Test Case 1: Staff ใน Billing Page**

```typescript
// สลับเป็น Staff
switchUser('STAFF')

// ใน Billing Page
const permissions = useModulePermissions('billing')

// ผลลัพธ์ที่คาดหวัง:
console.log(permissions.canAccess)  // true
console.log(permissions.canView)    // true
console.log(permissions.canAdd)     // true
console.log(permissions.canEdit)    // true
console.log(permissions.canDelete)  // false ❌
console.log(permissions.canPrint)   // true
console.log(permissions.canExport)  // true

// UI ที่แสดง:
// ✅ ปุ่ม "เพิ่มบิล"
// ✅ ปุ่ม "แก้ไข"
// ❌ ไม่มีปุ่ม "ลบ"
// ✅ ปุ่ม "พิมพ์"
// ✅ ปุ่ม "ส่งออก CSV"
```

### **Test Case 2: Engineer ใน Maintenance Page**

```typescript
// สลับเป็น Engineer (ถ้ามี mock user)
// หรือสร้าง user ใหม่ด้วย engineer role

const permissions = useModulePermissions('maintenance')

// ผลลัพธ์:
console.log(permissions.canAccess)  // true
console.log(permissions.canView)    // true
console.log(permissions.canAdd)     // true
console.log(permissions.canEdit)    // true
console.log(permissions.canDelete)  // false ❌
console.log(permissions.canAssign)  // false ❌
console.log(permissions.canPrint)   // true
console.log(permissions.canExport)  // false ❌

// UI ที่แสดง:
// ✅ ปุ่ม "แจ้งซ่อมใหม่"
// ✅ ปุ่ม "อัปเดตสถานะ"
// ❌ ไม่มีปุ่ม "มอบหมาย"
// ❌ ไม่มีปุ่ม "ลบ"
// ✅ ปุ่ม "พิมพ์"
// ❌ ไม่มีปุ่ม "ส่งออก CSV"
```

### **Test Case 3: Staff พยายามเข้า Chart of Accounts**

```typescript
// สลับเป็น Staff
switchUser('STAFF')

// พยายามเข้า /chart-of-accounts
const permissions = useModulePermissions('chart_of_accounts')

// ผลลัพธ์:
console.log(permissions.canAccess)  // false ❌
console.log(permissions.canView)    // false
// ... ทุก permission จะเป็น false

// UI ที่แสดง:
// ❌ "คุณไม่มีสิทธิ์เข้าถึงหน้านี้"
// ❌ Sidebar ไม่แสดงเมนู "ผังบัญชี"
```

---

## ตัวอย่าง UI ที่แสดงผลต่างกันตาม Role

### **Billing Page**

#### **Super Admin เห็น:**
```
╔══════════════════════════════════════╗
║ Billing                    [เพิ่มบิล] [พิมพ์] [ส่งออก CSV] ║
╠══════════════════════════════════════╣
║ B001 | 101 | 3,000 | [แก้ไข] [ลบ]   ║
║ B002 | 102 | 3,000 | [แก้ไข] [ลบ]   ║
╚══════════════════════════════════════╝
```

#### **Project Admin เห็น:**
```
╔══════════════════════════════════════╗
║ Billing                    [เพิ่มบิล] [พิมพ์] [ส่งออก CSV] ║
╠══════════════════════════════════════╣
║ B001 | 101 | 3,000 | [แก้ไข]         ║
║ B002 | 102 | 3,000 | [แก้ไข]         ║
╚══════════════════════════════════════╝
(ไม่มีปุ่ม "ลบ")
```

#### **Staff เห็น:**
```
╔══════════════════════════════════════╗
║ Billing                    [เพิ่มบิล] [พิมพ์] [ส่งออก CSV] ║
╠══════════════════════════════════════╣
║ B001 | 101 | 3,000 | [แก้ไข]         ║
║ B002 | 102 | 3,000 | [แก้ไข]         ║
╚══════════════════════════════════════╝
(ไม่มีปุ่ม "ลบ")
```

#### **Resident เห็น (Portal):**
```
╔══════════════════════════════════════╗
║ บิลของฉัน                          [พิมพ์] ║
╠══════════════════════════════════════╣
║ B001 | มกราคม 2024 | 3,000 | [พิมพ์] ║
║ B002 | กุมภาพันธ์ 2024 | 3,000 | [พิมพ์] ║
╚══════════════════════════════════════╝
(ดู+พิมพ์เท่านั้น)
```

---

## Complete Example: Billing Page with All Actions

```typescript
"use client"

import { useState, useEffect } from "react"
import { useModulePermissions } from "@/lib/hooks/use-module-permissions"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Edit, Trash2, Printer, Download } from "lucide-react"
import { toast } from "@/hooks/use-toast"

export default function BillingPage() {
  const [bills, setBills] = useState([])
  const [loading, setLoading] = useState(true)
  
  // Get permissions for billing module
  const {
    canAccess,
    canView,
    canAdd,
    canEdit,
    canDelete,
    canPrint,
    canExport,
    role,
    loading: permLoading
  } = useModulePermissions('billing')
  
  // Check access first
  if (permLoading) {
    return <div>Loading permissions...</div>
  }
  
  if (!canAccess) {
    return (
      <div className="p-8">
        <h1>ไม่มีสิทธิ์เข้าถึง</h1>
        <p>คุณไม่มีสิทธิ์เข้าถึงโมดูล "ออกบิล"</p>
        <Button onClick={() => router.push('/')}>กลับหน้าหลัก</Button>
      </div>
    )
  }
  
  const handleCreate = () => {
    if (!canAdd) {
      toast({
        title: "ไม่มีสิทธิ์",
        description: "คุณไม่สามารถเพิ่มบิลได้",
        variant: "destructive"
      })
      return
    }
    // Create logic...
  }
  
  const handleEdit = (billId: string) => {
    if (!canEdit) {
      toast({
        title: "ไม่มีสิทธิ์",
        description: "คุณไม่สามารถแก้ไขบิลได้",
        variant: "destructive"
      })
      return
    }
    // Edit logic...
  }
  
  const handleDelete = (billId: string) => {
    if (!canDelete) {
      toast({
        title: "ไม่มีสิทธิ์",
        description: "คุณไม่สามารถลบบิลได้",
        variant: "destructive"
      })
      return
    }
    // Delete logic...
  }
  
  const handlePrint = () => {
    if (!canPrint) {
      toast({
        title: "ไม่มีสิทธิ์",
        description: "คุณไม่สามารถพิมพ์บิลได้",
        variant: "destructive"
      })
      return
    }
    // Print logic...
  }
  
  const handleExport = () => {
    if (!canExport) {
      toast({
        title: "ไม่มีสิทธิ์",
        description: "คุณไม่สามารถส่งออกข้อมูลได้",
        variant: "destructive"
      })
      return
    }
    // Export logic...
  }
  
  return (
    <div className="space-y-6">
      <PageHeader
        title="ออกบิล"
        subtitle={`Role: ${role} - สิทธิ์: ${canView ? 'ดู' : ''}${canAdd ? '+เพิ่ม' : ''}${canEdit ? '+แก้ไข' : ''}${canDelete ? '+ลบ' : ''}${canPrint ? '+พิมพ์' : ''}${canExport ? '+ส่งออก' : ''}`}
        action={
          <div className="flex gap-2">
            {canAdd && (
              <Button onClick={handleCreate}>
                <Plus className="mr-2 h-4 w-4" />
                เพิ่มบิล
              </Button>
            )}
            {canPrint && (
              <Button variant="outline" onClick={handlePrint}>
                <Printer className="mr-2 h-4 w-4" />
                พิมพ์
              </Button>
            )}
            {canExport && (
              <Button variant="outline" onClick={handleExport}>
                <Download className="mr-2 h-4 w-4" />
                ส่งออก CSV
              </Button>
            )}
          </div>
        }
      />
      
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>เลขที่บิล</TableHead>
            <TableHead>ห้อง</TableHead>
            <TableHead>ยอดเงิน</TableHead>
            {(canEdit || canDelete) && <TableHead className="text-right">จัดการ</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {bills.map((bill) => (
            <TableRow key={bill.id}>
              <TableCell>{bill.bill_number}</TableCell>
              <TableCell>{bill.unit_number}</TableCell>
              <TableCell>{bill.total}</TableCell>
              {(canEdit || canDelete) && (
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    {canEdit && (
                      <Button size="sm" variant="ghost" onClick={() => handleEdit(bill.id)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                    )}
                    {canDelete && (
                      <Button size="sm" variant="ghost" onClick={() => handleDelete(bill.id)}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
```

---

## สรุป Granular Permissions

### **ระดับการควบคุม:**
1. **Module Level** - เข้าเมนูได้/ไม่ได้
2. **Action Level** - ทำอะไรได้บ้างในเมนู (View/Add/Edit/Delete/Print/Export)
3. **Data Level** - เห็นข้อมูลอะไรบ้าง (own data vs all data)

### **ไฟล์ที่สร้าง:**
- ✅ `lib/types/granular-permissions.ts` - Permission configuration (13 modules x 6 roles)
- ✅ `lib/hooks/use-module-permissions.ts` - React hooks
- ✅ `GRANULAR_PERMISSIONS_MATRIX.md` - ตารางสิทธิ์ละเอียด
- ✅ `GRANULAR_PERMISSIONS_USAGE.md` - คู่มือการใช้งาน

### **การใช้งาน:**
```typescript
// Check module access
const { canAccess } = useModulePermissions('billing')

// Check specific action
const canDelete = useCanPerformAction('billing', 'delete')

// Get all allowed actions
const { actions, isReadOnly } = useModuleActions('billing')
```

**ระบบ Permission ละเอียดที่สุดพร้อมใช้งาน!** 🎊
