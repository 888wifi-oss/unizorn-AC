#
# สคริปต์ PowerShell สำหรับลบไฟล์ที่ซ้ำซ้อน
#
# วิธีใช้งาน:
# 1. เปิด PowerShell ในโฟลเดอร์ `condo-pro-dashboard`
# 2. (หากจำเป็น) รันคำสั่งนี้เพื่ออนุญาตการรันสคริปต์: Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
# 3. รันสคริปต์นี้: .\cleanup.ps1
#

Write-Host "กำลังเริ่มลบไฟล์ที่ซ้ำซ้อน..." -ForegroundColor Yellow

$filesToDelete = @(
    # ไฟล์ทั่วไป
    ".\middleware - Copy.ts",
    # โฟลเดอร์ lib/
    ".\lib\pdf-generator - Copy (2).tsx",
    ".\lib\pdf-generator - Copy (3).tsx",
    ".\lib\pdf-generator - Copy.tsx",
    ".\lib\sarabun-font - Copy.ts",
    ".\lib\settings-context - Copy (2).tsx",
    ".\lib\settings-context - Copy.tsx",
    # โฟลเดอร์ lib/supabase/
    ".\lib\supabase\actions - Copy (10).ts",
    ".\lib\supabase\actions - Copy (11).ts",
    ".\lib\supabase\actions - Copy (12).ts",
    ".\lib\supabase\actions - Copy (13).ts",
    ".\lib\supabase\actions - Copy (14).ts",
    ".\lib\supabase\actions - Copy (15).ts",
    ".\lib\supabase\actions - Copy (16).ts",
    ".\lib\supabase\actions - Copy (17).ts",
    ".\lib\supabase\actions - Copy (18).ts",
    ".\lib\supabase\actions - Copy (19).ts",
    ".\lib\supabase\actions - Copy (2).ts",
    ".\lib\supabase\actions - Copy (20).ts",
    ".\lib\supabase\actions - Copy (21).ts",
    ".\lib\supabase\actions - Copy (22).ts",
    ".\lib\supabase\actions - Copy (23).ts",
    ".\lib\supabase\actions - Copy (24)-Login Customer.ts",
    ".\lib\supabase\actions - Copy (24).ts",
    ".\lib\supabase\actions - Copy (25).ts",
    ".\lib\supabase\actions - Copy (26).ts",
    ".\lib\supabase\actions - Copy (27).ts",
    ".\lib\supabase\actions - Copy (3).ts",
    ".\lib\supabase\actions - Copy (4).ts",
    ".\lib\supabase\actions - Copy (5).ts",
    ".\lib\supabase\actions - Copy (6).ts",
    ".\lib\supabase\actions - Copy (7)-งบดุล.ts",
    ".\lib\supabase\actions - Copy (7).ts",
    ".\lib\supabase\actions - Copy (8).ts",
    ".\lib\supabase\actions - Copy (9).ts",
    ".\lib\supabase\actions - Copy.ts",
    # โฟลเดอร์ components/
    ".\components\page-header - Copy (2).tsx",
    ".\components\page-header - Copy.tsx",
    ".\components\sidebar - Copy (10).tsx",
    ".\components\sidebar - Copy (11).tsx",
    ".\components\sidebar - Copy (12).tsx",
    ".\components\sidebar - Copy (2).tsx",
    ".\components\sidebar - Copy (3).tsx",
    ".\components\sidebar - Copy (4).tsx",
    ".\components\sidebar - Copy (5).tsx",
    ".\components\sidebar - Copy (6).tsx",
    ".\components\sidebar - Copy (7).tsx",
    ".\components\sidebar - Copy (8).tsx",
    ".\components\sidebar - Copy (9).tsx",
    ".\components\sidebar - Copy.tsx",
    # โฟลเดอร์ app/portal/
    ".\app\portal\layout - Copy (2).tsx",
    ".\app\portal\layout - Copy.tsx",
    ".\app\portal\login\page - Copy.tsx",
    ".\app\portal\dashboard\page - Copy (2).tsx",
    ".\app\portal\dashboard\page - Copy (3)-OK นะมี บิลมีประว้ติ ไม่ต้องการประกาศหรือแจ้งซ่อม.tsx",
    ".\app\portal\dashboard\page - Copy (3).tsx",
    ".\app\portal\dashboard\page - Copy.tsx",
    # โฟลเดอร์ app/(admin)/
    ".\app\(admin)\layout - Copy.tsx",
    ".\app\(admin)\vendors\page - Copy.tsx",
    ".\app\(admin)\units\page - Copy.tsx",
    ".\app\(admin)\settings\page - Copy (2).tsx",
    ".\app\(admin)\settings\page - Copy.tsx",
    ".\app\(admin)\revenue-budget\page - Copy (2).tsx",
    ".\app\(admin)\revenue-budget\page - Copy (3).tsx",
    ".\app\(admin)\revenue-budget\page - Copy.tsx",
    ".\app\(admin)\reports\page - Copy (2).tsx",
    ".\app\(admin)\reports\page - Copy.tsx",
    ".\app\(admin)\payments\page - Copy.tsx",
    ".\app\(admin)\parcels\page.tsx.backup",
    ".\app\(admin)\general-ledger\page - Copy (2).tsx",
    ".\app\(admin)\general-ledger\page - Copy.tsx",
    ".\app\(admin)\fixed-assets\page - Copy.tsx",
    ".\app\(admin)\financial-statements\page - Copy.tsx",
    ".\app\(admin)\expense-budget\page - Copy.tsx",
    ".\app\(admin)\depreciation\loading - Copy.tsx",
    ".\app\(admin)\depreciation\page - Copy.tsx",
    ".\app\(admin)\billing\page - Copy (2).tsx",
    ".\app\(admin)\billing\page - Copy (3).tsx",
    ".\app\(admin)\billing\page - Copy.tsx",
    ".\app\(admin)\accounts-payable\page - Copy (2).tsx",
    ".\app\(admin)\accounts-payable\page - Copy.tsx"
)

foreach ($file in $filesToDelete) {
    if (Test-Path $file) {
        Write-Host "กำลังลบ: $file" -ForegroundColor Red
        Remove-Item $file -Force -ErrorAction SilentlyContinue
    } else {
        Write-Host "ไม่พบไฟล์: $file" -ForegroundColor Gray
    }
}

Write-Host "การลบไฟล์เสร็จสิ้น!" -ForegroundColor Green