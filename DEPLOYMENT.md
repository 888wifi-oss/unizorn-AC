# คู่มือการ Deploy Condo Pro Dashboard ไปยัง Vercel (ฟรี)

สำหรับการทดสอบและใช้งานจริง แนะนำให้ใช้ **Vercel** ซึ่งเป็นแพลตฟอร์มที่สร้างโดยผู้พัฒนา Next.js เอง มีความเสถียรสูง ใช้งานง่าย และมี Free Tier ที่เพียงพอสำหรับการทดสอบ

## สิ่งที่ต้องเตรียม (Prerequisites)

1.  **GitHub Account**: สำหรับเก็บ Source Code
2.  **Vercel Account**: สมัครได้ฟรีที่ [vercel.com](https://vercel.com) (แนะนำให้ Login ด้วย GitHub)
3.  **Supabase Project**: มีอยู่แล้ว (ต้องใช้ URL และ Key)

## ขั้นตอนการ Deploy

### 1. นำโค้ดขึ้น GitHub
หากยังไม่ได้นำโค้ดขึ้น GitHub ให้ทำดังนี้:
1.  สร้าง Repository ใหม่ใน GitHub
2.  รันคำสั่งใน Terminal ของ VS Code:
    ```bash
    git init
    git add .
    git commit -m "Initial commit"
    git branch -M main
    git remote add origin <YOUR_GITHUB_REPO_URL>
    git push -u origin main
    ```

### 2. เชื่อมต่อ Vercel กับ GitHub
1.  ไปที่ Dashboard ของ Vercel
2.  คลิกปุ่ม **"Add New..."** -> **"Project"**
3.  ในหน้า Import Git Repository ให้เลือกโปรเจกต์ `condo-pro-dashboard` ที่เพิ่งอัปโหลดไป
4.  คลิก **"Import"**

### 3. ตั้งค่า Environment Variables
ในหน้า Configure Project ให้เลื่อนลงมาที่ส่วน **Environment Variables** และใส่ค่าต่างๆ ดังนี้ (ดูค่าได้จากไฟล์ `.env.local` ของคุณ):

**ค่าที่จำเป็นต้องใส่ (Required):**
*   `NEXT_PUBLIC_SUPABASE_URL`: URL ของ Supabase Project
*   `NEXT_PUBLIC_SUPABASE_ANON_KEY`: API Key (anon/public) ของ Supabase
*   `SUPABASE_SERVICE_ROLE_KEY`: Service Role Key (secret) ของ Supabase (สำหรับ API Admin)
*   `NEXT_PUBLIC_SITE_URL`: URL ของเว็บหลังจาก Deploy (เช่น `https://your-project.vercel.app`) *ใส่ค่าชั่วคราวไปก่อนได้ หรือปล่อยว่างไว้แล้วมาแก้ทีหลัง*

**ค่าสำหรับระบบชำระเงิน (ถ้าจะทดสอบ):**
*   `TWOC2P_MERCHANT_ID`
*   `TWOC2P_SECRET_KEY`
*   `OMISE_PUBLIC_KEY`
*   `OMISE_SECRET_KEY`

**ค่าสำหรับ Push Notification (ถ้าจะทดสอบ):**
*   `NEXT_PUBLIC_VAPID_PUBLIC_KEY`
*   `VAPID_PRIVATE_KEY`

### 4. กด Deploy
1.  หลังจากใส่ค่า Environment Variables ครบแล้ว ให้กดปุ่ม **"Deploy"**
2.  รอสักครู่ (ประมาณ 1-2 นาที) ระบบจะทำการ Build และ Deploy
3.  เมื่อเสร็จสิ้น หน้าจอจะแสดงความยินดี และให้ลิงก์สำหรับเข้าใช้งาน (Domain)

## การตั้งค่าเพิ่มเติมใน Supabase (สำคัญ!)

เมื่อได้ Domain จาก Vercel แล้ว (เช่น `https://condo-pro-dashboard.vercel.app`) ต้องกลับไปตั้งค่าใน Supabase ด้วย:

1.  ไปที่ **Supabase Dashboard** -> **Authentication** -> **URL Configuration**
2.  ในช่อง **Site URL** ให้ใส่ Domain ที่ได้จาก Vercel
3.  ในส่วน **Redirect URLs** ให้เพิ่ม URL ที่จำเป็น เช่น:
    *   `https://<YOUR-DOMAIN>/auth/callback`
    *   `https://<YOUR-DOMAIN>/portal/reset-password`

## การอัปเดตโค้ด (Continuous Deployment)
หลังจากเชื่อมต่อเสร็จแล้ว ทุกครั้งที่คุณแก้ไขโค้ดและสั่ง `git push` ขึ้น GitHub ทาง Vercel จะทำการ Deploy เวอร์ชันใหม่ให้โดยอัตโนมัติ
