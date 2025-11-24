# การแก้ไขปัญหา "use server" file can only export async functions

## ปัญหาที่พบ
Error: `A "use server" file can only export async functions, found object`

## สาเหตุ
ไฟล์ที่มี `"use server"` directive สามารถ export เฉพาะ async functions เท่านั้น ไม่สามารถ export:
- `interface` หรือ `type`
- `const` หรือ `let` variables
- Objects หรือ arrays

## การแก้ไขที่ทำแล้ว

### 1. แก้ไขไฟล์ Analytics
- ✅ สร้าง `lib/types/analytics.ts` - ย้าย `AnalyticsData` interface
- ✅ แก้ไข `lib/supabase/analytics-actions.ts` - ลบ interface และ import จากไฟล์ใหม่
- ✅ แก้ไข `app/(admin)/analytics/page.tsx` - import จากไฟล์ใหม่

### 2. แก้ไขไฟล์ Automation
- ✅ สร้าง `lib/types/automation.ts` - ย้าย `AutomationRule` และ `AutomationExecution` interfaces
- ✅ สร้าง `lib/utils/automation-rules.ts` - ย้าย `builtInRules` constant
- ✅ แก้ไข `lib/supabase/automation-actions.ts` - ลบ interfaces และ constant
- ✅ แก้ไข `app/(admin)/automation/page.tsx` - import จากไฟล์ใหม่

## ไฟล์ที่สร้างใหม่
- `lib/types/analytics.ts` - AnalyticsData interface
- `lib/types/automation.ts` - AutomationRule และ AutomationExecution interfaces
- `lib/utils/automation-rules.ts` - builtInRules constant

## ไฟล์ที่แก้ไข
- `lib/supabase/analytics-actions.ts` - ลบ interface, เพิ่ม import
- `lib/supabase/automation-actions.ts` - ลบ interfaces และ constant, เพิ่ม imports
- `app/(admin)/analytics/page.tsx` - แก้ไข import path
- `app/(admin)/automation/page.tsx` - แก้ไข import path

## กฎสำหรับ "use server" files

### ✅ **อนุญาต**
- `export async function functionName() { ... }`
- `export default async function() { ... }`

### ❌ **ไม่อนุญาต**
- `export interface InterfaceName { ... }`
- `export type TypeName = ...`
- `export const constantName = ...`
- `export let variableName = ...`
- `export const objectName = { ... }`

## วิธีแก้ไขปัญหาในอนาคต

### **ขั้นตอนที่ 1: ตรวจสอบไฟล์ที่มี "use server"**
```bash
grep -r '"use server"' lib/supabase/
```

### **ขั้นตอนที่ 2: ตรวจสอบ exports ที่ไม่ใช่ async functions**
```bash
grep -r "export interface\|export type\|export const" lib/supabase/
```

### **ขั้นตอนที่ 3: ย้าย exports ที่ไม่อนุญาต**
1. **Interfaces/Types** → ย้ายไป `lib/types/`
2. **Constants** → ย้ายไป `lib/utils/`
3. **Objects/Arrays** → ย้ายไป `lib/constants/`

### **ขั้นตอนที่ 4: แก้ไข imports**
```typescript
// เปลี่ยนจาก
import { InterfaceName } from "@/lib/supabase/file-with-use-server"

// เป็น
import { InterfaceName } from "@/lib/types/file-name"
```

## วิธีทดสอบ

### **ขั้นตอนที่ 1: ทดสอบการ Build**
```bash
npm run build
```

### **ขั้นตอนที่ 2: ทดสอบการทำงาน**
1. ไปที่หน้า **"การวิเคราะห์ข้อมูล"**
2. ไปที่หน้า **"ระบบอัตโนมัติ"**
3. ตรวจสอบว่าไม่มี error ใน Console

### **ขั้นตอนที่ 3: ตรวจสอบ Console**
เปิด Developer Tools (F12) และดู Console:
- ไม่ควรมี error เกี่ยวกับ "use server"
- ไม่ควรมี error เกี่ยวกับ exports

## ผลลัพธ์ที่คาดหวัง
- ✅ ไม่มี "use server" error
- ✅ ไฟล์ Analytics และ Automation ทำงานได้ปกติ
- ✅ Build สำเร็จโดยไม่มี error
- ✅ Types และ interfaces ยังใช้งานได้ปกติ

## หมายเหตุ
- การแก้ไขนี้ไม่เปลี่ยนการทำงานของระบบ
- เพียงแค่ย้าย types และ constants ไปยังไฟล์ที่เหมาะสม
- ระบบยังคงทำงานเหมือนเดิม แต่ไม่มี error
