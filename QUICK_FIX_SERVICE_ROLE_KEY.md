# แก้ไข Error: Invalid API key

## ปัญหา
Error: `Authentication error: Invalid API key` เมื่อสร้างบัญชี

## สาเหตุ
`SUPABASE_SERVICE_ROLE_KEY` ในไฟล์ `.env.local` ยังเป็น placeholder

## วิธีแก้ไข

### ขั้นตอนที่ 1: หา Service Role Key

1. ไปที่ https://app.supabase.com/project/anhxilzznwtbnkijyidd/settings/api
2. หาส่วน **"Project API keys"**
3. คัดลอก **"service_role"** key (ไม่ใช่ anon key!)
   - จะเป็น token ยาวๆ เริ่มต้นด้วย `eyJhbGciOi...`

### ขั้นตอนที่ 2: แก้ไขไฟล์ .env.local

**วิธีที่ 1: แก้ไขด้วย Text Editor**

1. เปิดไฟล์ `.env.local` ด้วย Notepad หรือ VS Code
2. หาบรรทัด:
   ```
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
   ```
3. แทนที่ `your-service-role-key-here` ด้วย Service Role Key ที่คัดลอกมา
4. บันทึกไฟล์

**วิธีที่ 2: ใช้ PowerShell**

```powershell
# แทนที่ <YOUR-SERVICE-ROLE-KEY> ด้วย key ที่คัดลอกมา
(Get-Content .env.local) -replace 'your-service-role-key-here', 'eyJhbGciOi...' | Set-Content .env.local
```

### ขั้นตอนที่ 3: รีสตาร์ท Dev Server

```bash
# หยุด dev server (Ctrl+C)
# แล้วรันใหม่
npm run dev
```

### ขั้นตอนที่ 4: ทดสอบ

1. ไปที่หน้า Register (หรือลิงก์ invitation)
2. สร้างบัญชีใหม่
3. ✅ ควรทำงานได้แล้ว!

## ตัวอย่างไฟล์ .env.local ที่ถูกต้อง

```env
NEXT_PUBLIC_SUPABASE_URL="https://anhxilzznwtbnkijyidd.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFuaHhpbHp6bnd0Ym5raWp5aWRkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDEzMzg2NCwiZXhwIjoyMDc1NzA5ODY0fQ..."
```

## ตรวจสอบว่าแก้ไขถูกต้อง

```powershell
# รันคำสั่งนี้เพื่อดูว่า key ถูกแก้ไขแล้วหรือยัง
type .env.local | Select-String "SUPABASE_SERVICE_ROLE_KEY"
```

ถ้ายังเห็น `your-service-role-key-here` แสดงว่ายังแก้ไขไม่สำเร็จ

## ⚠️ คำเตือน

- **ห้าม** commit `.env.local` เข้า git
- **ห้าม** แชร์ Service Role Key กับใคร!
- Service Role Key มีสิทธิ์ทั้งหมดในฐานข้อมูล


















