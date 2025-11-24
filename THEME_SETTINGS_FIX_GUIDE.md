# การแก้ไข ReferenceError: prev is not defined

## ปัญหาที่พบ
ReferenceError: prev is not defined ในไฟล์ `app/(admin)/theme-settings/page.tsx` บรรทัด 99

## สาเหตุ
ในฟังก์ชัน `useEffect` มีการใช้ `prev` ในการเรียก `applySettings({ ...prev, ...parsed })` แต่ `prev` ไม่ได้อยู่ใน scope ที่ถูกต้อง

## การแก้ไขที่ทำแล้ว

### **ก่อนแก้ไข (มีปัญหา):**
```typescript
useEffect(() => {
  const savedSettings = localStorage.getItem('theme-settings')
  if (savedSettings) {
    try {
      const parsed = JSON.parse(savedSettings)
      setSettings(prev => ({ ...prev, ...parsed }))
      applySettings({ ...prev, ...parsed }) // ❌ prev ไม่ได้อยู่ใน scope
    } catch (error) {
      console.error('Error loading theme settings:', error)
    }
  }
}, [])
```

### **หลังแก้ไข (แก้ไขแล้ว):**
```typescript
useEffect(() => {
  const savedSettings = localStorage.getItem('theme-settings')
  if (savedSettings) {
    try {
      const parsed = JSON.parse(savedSettings)
      const newSettings = { ...settings, ...parsed } // ✅ สร้างตัวแปรใหม่
      setSettings(newSettings)
      applySettings(newSettings) // ✅ ใช้ตัวแปรที่สร้างใหม่
    } catch (error) {
      console.error('Error loading theme settings:', error)
    }
  }
}, [])
```

## ไฟล์ที่แก้ไข
- `app/(admin)/theme-settings/page.tsx` - แก้ไข useEffect ในบรรทัด 56-69

## วิธีทดสอบ

### ขั้นตอนที่ 1: ทดสอบการเข้าถึงหน้า Theme Settings
1. ไปที่เมนู **"การตั้งค่าธีม"**
2. ตรวจสอบว่าโหลดได้โดยไม่มี error
3. ตรวจสอบ Console (F12) ว่าไม่มี ReferenceError

### ขั้นตอนที่ 2: ทดสอบการโหลดการตั้งค่า
1. เปลี่ยนการตั้งค่าต่างๆ (ธีม, สี, ขนาดตัวอักษร)
2. รีเฟรชหน้าเว็บ
3. ตรวจสอบว่าการตั้งค่าถูกโหลดกลับมาได้

### ขั้นตอนที่ 3: ทดสอบการบันทึกการตั้งค่า
1. เปลี่ยนการตั้งค่าใหม่
2. ตรวจสอบว่า localStorage มีข้อมูลการตั้งค่า
3. รีเฟรชหน้าเว็บและตรวจสอบว่าการตั้งค่าไม่หาย

## ผลลัพธ์ที่คาดหวัง
- ✅ ไม่มี ReferenceError ใน Console
- ✅ หน้า Theme Settings โหลดได้ปกติ
- ✅ การตั้งค่าถูกโหลดจาก localStorage ได้
- ✅ การตั้งค่าใหม่ถูกบันทึกลง localStorage ได้
- ✅ การเปลี่ยนธีมทำงานได้ปกติ

## หมายเหตุ
- การแก้ไขนี้แก้ปัญหา ReferenceError เท่านั้น
- ฟังก์ชันการทำงานอื่นๆ ยังคงเหมือนเดิม
- การตั้งค่าจะถูกบันทึกใน localStorage ของเบราว์เซอร์
