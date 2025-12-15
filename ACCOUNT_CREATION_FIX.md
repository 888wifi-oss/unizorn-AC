# แก้ไขปัญหา: สร้างบัญชีไม่ได้รับอีเมล

## ปัญหาที่พบ
เมื่อสร้างบัญชีผู้ใช้ ไม่ได้รับอีเมลยืนยัน

## สาเหตุ
1. ใช้ `supabase.auth.signUp()` ซึ่งส่งอีเมลยืนยันตามค่าเริ่มต้น
2. ถ้าไม่ได้ตั้งค่า Email Service จะไม่ได้รับอีเมล
3. ผู้ใช้ต้องการเข้าสู่ระบบได้ทันทีโดยไม่ต้องยืนยันอีเมล

## วิธีแก้ไข

### 1. สร้างไฟล์ `lib/supabase/admin.ts`
สร้าง Admin Client ที่ใช้ Service Role Key เพื่อเข้าถึง Supabase Admin API

```typescript
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

  if (!supabaseServiceKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set in environment variables')
  }

  return createSupabaseClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}
```

### 2. อัปเดต `lib/supabase/auth-actions.ts`
เปลี่ยนจาก `signUp()` เป็น `admin.createUser()` พร้อมตั้งค่า `email_confirm: true`

```typescript
// ใช้ Admin API แทน
const { data: authData, error: authError } = await adminSupabase.auth.admin.createUser({
  email,
  password,
  email_confirm: true, // Auto-confirm email (no need for email verification)
  user_metadata: {
    unit_number: unitNumber,
    user_type: 'resident'
  }
})
```

### 3. อัปเดต `app/(admin)/resident-accounts/page.tsx`
เพิ่มการเรียกใช้ฟังก์ชัน `createResidentAccount` จริง

```typescript
const result = await createResidentAccount(username, password, selectedUnit.unit_number)
```

### 4. เพิ่ม Environment Variable
เพิ่ม `SUPABASE_SERVICE_ROLE_KEY` ในไฟล์ `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key  # ← เพิ่มบรรทัดนี้
```

## วิธีหา Service Role Key
1. ไปที่ [Supabase Dashboard](https://app.supabase.com)
2. เลือก Project ของคุณ
3. ไปที่ Settings → API
4. คัดลอก "service_role" key (ไม่ใช่ anon key!)

⚠️ **คำเตือน**: Service Role Key มีสิทธิ์ทั้งหมด! ห้ามใช้ใน Client-side code!

## ผลลัพธ์
- ✅ สร้างบัญชีได้ทันทีโดยไม่ต้องยืนยันอีเมล
- ✅ ผู้ใช้สามารถเข้าสู่ระบบได้ทันที
- ✅ ไม่ต้องตั้งค่า Email Service (ใช้เฉพาะกรณีที่ต้องการส่งอีเมลแจ้งเตือน)

## การทดสอบ
1. ไปที่หน้า "จัดการบัญชีผู้ใช้ Portal"
2. กดปุ่ม "สร้างบัญชีใหม่"
3. เลือกห้องชุดและกรอกอีเมล/รหัสผ่าน
4. กดสร้างบัญชี
5. ✅ บัญชีถูกสร้างและพร้อมใช้งานทันที




















