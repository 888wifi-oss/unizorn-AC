# ตั้งค่า SUPABASE_SERVICE_ROLE_KEY

## ขั้นตอนที่ 1: หา Service Role Key

1. ไปที่ [Supabase Dashboard](https://app.supabase.com)
2. เลือก Project ของคุณ: `anhxilzznwtbnkijyidd`
3. ไปที่ **Settings** → **API**
4. คัดลอก **"service_role"** key (ไม่ใช่ anon key!)

## ขั้นตอนที่ 2: แก้ไขไฟล์ .env.local

1. เปิดไฟล์ `.env.local` ด้วย text editor
2. หาบรรทัดที่มี:
   ```
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
   ```
3. แทนที่ `your-service-role-key-here` ด้วย Service Role Key ที่คัดลอกมา
4. บันทึกไฟล์

## ขั้นตอนที่ 3: รีสตาร์ท Dev Server

รีสตาร์ท dev server เพื่อโหลด environment variables ใหม่:

```bash
# หยุด dev server (กด Ctrl+C)
# แล้วรันใหม่
npm run dev
```

## ตัวอย่างไฟล์ .env.local ที่ถูกต้อง

```env
NEXT_PUBLIC_SUPABASE_URL="https://anhxilzznwtbnkijyidd.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFuaHhpbHp6bnd0Ym5raWp5aWRkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDEzMzg2NCwiZXhwIjoyMDc1NzA5ODY0fQ..."
```

## ภาพหน้าจอ

เมื่อไปที่ Supabase Dashboard → Settings → API คุณจะเห็น:

```
Project API keys

anon / public
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (ที่คุณมีอยู่แล้ว)

service_role (secret)
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (คัดลอกอันนี้!)
```

## ⚠️ คำเตือนความปลอดภัย

- **ห้าม** commit `.env.local` เข้า git (มันอยู่ใน .gitignore แล้ว)
- **ห้าม** แชร์ Service Role Key กับใคร!
- Service Role Key มีสิทธิ์ทั้งหมดในฐานข้อมูล

## ทดสอบ

หลังจากตั้งค่าแล้ว:
1. รีสตาร์ท dev server
2. ไปที่หน้า "จัดการบัญชีผู้ใช้ Portal"
3. สร้างบัญชีใหม่
4. ✅ ควรทำงานได้โดยไม่มี error!




















