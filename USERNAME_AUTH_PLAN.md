# 🔐 ระบบ Authentication แบบใหม่ - รองรับ Username

## 🎯 เป้าหมาย
สร้างระบบที่ให้ผู้ใช้ login ด้วย **Username** ได้จริงๆ โดยไม่ต้องจำ email format

## 🔧 วิธีแก้ไข

### วิธีที่ 1: Custom Authentication Table
สร้างตาราง `resident_auth` เพื่อเก็บ username/password แยกจาก Supabase Auth

### วิธีที่ 2: Username Mapping
สร้างตาราง `username_mapping` เพื่อ map username กับ Supabase user

### วิธีที่ 3: Custom Login Function
สร้างฟังก์ชัน login ที่เช็ค username ก่อน แล้วค่อยใช้ Supabase Auth

## 🚀 Implementation Plan

### ขั้นตอนที่ 1: สร้างตาราง Username Mapping
```sql
CREATE TABLE username_mapping (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  auth_user_id UUID REFERENCES auth.users(id),
  unit_id UUID REFERENCES units(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### ขั้นตอนที่ 2: สร้างฟังก์ชัน Login ใหม่
```typescript
export async function signInWithUsername(username: string, password: string) {
  // 1. เช็ค username mapping
  // 2. ดึง auth_user_id
  // 3. ใช้ Supabase Auth ด้วย auth_user_id
  // 4. Return user data
}
```

### ขั้นตอนที่ 3: อัปเดต Registration Process
```typescript
export async function createAccountWithUsername(
  invitationCode: string,
  username: string,
  password: string
) {
  // 1. สร้าง Supabase Auth user
  // 2. สร้าง username mapping
  // 3. อัปเดต invitation status
}
```

## 📊 Database Schema

### ตาราง username_mapping
```sql
username_mapping:
├── id (UUID, PK)
├── username (VARCHAR, UNIQUE)
├── auth_user_id (UUID, FK → auth.users)
├── unit_id (UUID, FK → units)
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP)
```

### ตาราง invitations (existing)
```sql
invitations:
├── id (UUID, PK)
├── unit_id (UUID, FK)
├── code (VARCHAR)
├── email (VARCHAR)
├── status (VARCHAR)
├── expires_at (TIMESTAMP)
├── used_at (TIMESTAMP)
└── created_at (TIMESTAMP)
```

## 🔄 Login Flow

### เดิม (ไม่ทำงาน)
```
Username: ADD2
→ ลอง ADD2@unizorn.local
→ ลอง ADD2@gmail.com
→ ลอง ADD2@hotmail.com
→ ลอง ADD2@yahoo.com
→ ล้มเหลวทั้งหมด
```

### ใหม่ (จะทำงาน)
```
Username: ADD2
→ เช็ค username_mapping
→ หา auth_user_id
→ ใช้ Supabase Auth ด้วย auth_user_id
→ Login สำเร็จ
```

## 🛠️ Implementation Steps

### Step 1: สร้าง SQL Script
```sql
-- scripts/151_create_username_mapping.sql
CREATE TABLE username_mapping (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  auth_user_id UUID REFERENCES auth.users(id),
  unit_id UUID REFERENCES units(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_username_mapping_username ON username_mapping(username);
CREATE INDEX idx_username_mapping_auth_user_id ON username_mapping(auth_user_id);
```

### Step 2: สร้าง Auth Functions
```typescript
// lib/supabase/username-auth-actions.ts
export async function signInWithUsername(username: string, password: string) {
  // Implementation here
}

export async function createUsernameMapping(username: string, authUserId: string, unitId: string) {
  // Implementation here
}
```

### Step 3: อัปเดต Login Page
```typescript
// app/portal/login/page.tsx
import { signInWithUsername } from "@/lib/supabase/username-auth-actions"

const handleLogin = async (e: React.FormEvent) => {
  const result = await signInWithUsername(username, password)
  // Handle result
}
```

### Step 4: อัปเดต Registration
```typescript
// lib/actions/invitation-actions.ts
export async function createAccountFromInvitation(
  code: string,
  username: string,
  password: string
) {
  // 1. Create Supabase Auth user
  // 2. Create username mapping
  // 3. Update invitation status
}
```

## 🎯 ข้อดี

✅ **User-Friendly** - Login ด้วย username ได้จริงๆ
✅ **Flexible** - รองรับ username หลายรูปแบบ
✅ **Secure** - ยังใช้ Supabase Auth
✅ **Scalable** - ขยายได้ง่าย

## 🚨 ข้อควรระวัง

⚠️ **Username Uniqueness** - ต้อง unique ทั้งระบบ
⚠️ **Password Sync** - ต้อง sync กับ Supabase Auth
⚠️ **Migration** - ต้อง migrate ข้อมูลเก่า

## 📝 Next Steps

1. **สร้าง SQL Script** สำหรับ username_mapping
2. **สร้าง Auth Functions** ใหม่
3. **อัปเดต Login Page** ให้ใช้ฟังก์ชันใหม่
4. **อัปเดต Registration** ให้สร้าง mapping
5. **ทดสอบ** ระบบใหม่

## 🤔 คำถาม

**ต้องการให้ดำเนินการตามแผนนี้หรือไม่?**

- ✅ สร้างระบบ Username Authentication ใหม่
- ❌ ใช้วิธีอื่น (เช่น ใช้ email เต็ม)

**ถ้าต้องการ ให้เริ่มจากขั้นตอนไหน?**
1. สร้าง SQL Script
2. สร้าง Auth Functions
3. อัปเดต Login Page
4. อัปเดต Registration
