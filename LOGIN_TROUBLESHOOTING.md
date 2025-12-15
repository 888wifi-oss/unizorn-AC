# 🔍 วิธีแก้ปัญหา Login ไม่ได้

## ปัญหาที่พบ
Error: "Authentication failed: Invalid login credentials"

## สาเหตุที่เป็นไปได้

### 1. ยังไม่ได้สร้างบัญชี
- ต้องสร้างบัญชีด้วยรหัสเชิญก่อน
- ไม่สามารถใช้ username/password ที่ยังไม่ได้สร้าง

### 2. Username/Password ไม่ถูกต้อง
- Username ต้องตรงกับที่ตั้งไว้ตอนสร้างบัญชี
- Password ต้องตรงกับที่ตั้งไว้ตอนสร้างบัญชี

## วิธีแก้ไข

### ขั้นตอนที่ 1: ตรวจสอบว่ามีบัญชีหรือไม่

1. **ไปที่ Supabase Dashboard:**
   - https://app.supabase.com/project/anhxilzznwtbnkijyidd/auth/users

2. **ค้นหาผู้ใช้:**
   - หา email ที่ขึ้นต้นด้วย `ADD2@unizorn.local`
   - หรือ email อื่นที่เกี่ยวข้อง

3. **ถ้าไม่พบผู้ใช้:**
   - หมายความว่ายังไม่ได้สร้างบัญชี
   - ต้องสร้างบัญชีด้วยรหัสเชิญก่อน

### ขั้นตอนที่ 2: สร้างบัญชีด้วยรหัสเชิญ

1. **สร้างรหัสเชิญ:**
   - ไปที่หน้า "จัดการบัญชีผู้ใช้ Portal"
   - เลือกห้องที่ต้องการ
   - กด "ส่งรหัสเชิญ"

2. **สร้างบัญชี:**
   - ไปที่ `http://localhost:3000/portal/register?code=<รหัสเชิญ>`
   - กรอก username: `ADD2`
   - กรอก password: `12345678`
   - กด "สร้างบัญชี"

3. **ทดสอบ login:**
   - กลับมาหน้า login
   - กรอก username: `ADD2`
   - กรอก password: `12345678`
   - กด "เข้าสู่ระบบ"

## การทำงานของระบบ

### Email Format ที่ใช้:
```
Username: ADD2
→ Email: ADD2@unizorn.local
```

### Database Structure:
```
auth.users (Supabase Auth)
├── email: "ADD2@unizorn.local"
├── encrypted_password: "hashed_password"
└── user_metadata:
    ├── username: "ADD2"
    ├── unit_number: "ADD2"
    └── user_type: "resident"

public.units
├── unit_number: "ADD2"
├── user_id: "uuid_from_auth_users"
└── owner_email: "ADD2@unizorn.local"
```

## Troubleshooting

### ถ้ายัง login ไม่ได้:

1. **ตรวจสอบ Console Log:**
   - กด F12 → Console
   - ดู error message ที่ชัดเจน

2. **ตรวจสอบใน Supabase:**
   - ไปที่ Authentication → Users
   - หา user ที่สร้างไว้
   - ตรวจสอบ email และ metadata

3. **ลองสร้างบัญชีใหม่:**
   - สร้างรหัสเชิญใหม่
   - สร้างบัญชีใหม่ด้วย username/password ที่จำได้ง่าย

## ตัวอย่างการใช้งาน

### สร้างบัญชี:
```
1. สร้างรหัสเชิญสำหรับห้อง ADD2
2. ไปที่ /portal/register?code=abc123
3. กรอก:
   - Username: ADD2
   - Password: 12345678
4. กดสร้างบัญชี
```

### Login:
```
1. ไปที่ /portal/login
2. กรอก:
   - Username: ADD2
   - Password: 12345678
3. กดเข้าสู่ระบบ
```

## สรุป

**ปัญหาหลัก:** ยังไม่ได้สร้างบัญชีด้วยรหัสเชิญ

**วิธีแก้:** สร้างบัญชีด้วยรหัสเชิญก่อน แล้วค่อย login

**ขั้นตอน:**
1. สร้างรหัสเชิญ
2. สร้างบัญชีด้วยรหัสเชิญ
3. Login ด้วย username/password ที่ตั้งไว้



















