-- Insert Sample Fixed Assets for Testing Depreciation
-- This script adds sample fixed assets to test the depreciation calculation feature

-- Insert sample fixed assets
INSERT INTO fixed_assets (
    asset_name,
    asset_code,
    description,
    purchase_date,
    purchase_cost,
    lifespan_years,
    salvage_value,
    status,
    location,
    asset_account_code,
    depreciation_account_code,
    expense_account_code,
    last_depreciation_date
) VALUES
-- Asset 1: Computer (purchased 6 months ago)
(
    'คอมพิวเตอร์สำนักงาน',
    'COMP-001',
    'คอมพิวเตอร์ Dell OptiPlex สำหรับงานบัญชี',
    CURRENT_DATE - INTERVAL '6 months',
    45000.00,
    5,
    5000.00,
    'in_use',
    'ห้องบัญชี',
    '1202', -- เครื่องใช้สำนักงาน
    '1204', -- ค่าเสื่อมราคาสะสม
    '5901', -- ค่าเสื่อมราคา
    NULL
),
-- Asset 2: Air Conditioner (purchased 1 year ago)
(
    'เครื่องปรับอากาศ',
    'AC-001',
    'แอร์ Daikin 18,000 BTU ห้องประชุม',
    CURRENT_DATE - INTERVAL '12 months',
    35000.00,
    7,
    3000.00,
    'in_use',
    'ห้องประชุม',
    '1201', -- อุปกรณ์และเครื่องมือ
    '1204', -- ค่าเสื่อมราคาสะสม
    '5901', -- ค่าเสื่อมราคา
    NULL
),
-- Asset 3: Office Furniture (purchased 3 months ago)
(
    'ชุดโต๊ะทำงาน',
    'FURN-001',
    'โต๊ะและเก้าอี้สำนักงาน 5 ชุด',
    CURRENT_DATE - INTERVAL '3 months',
    25000.00,
    10,
    2000.00,
    'in_use',
    'ห้องทำงาน',
    '1202', -- เครื่องใช้สำนักงาน
    '1204', -- ค่าเสื่อมราคาสะสม
    '5901', -- ค่าเสื่อมราคา
    NULL
),
-- Asset 4: Printer (purchased 2 years ago, already depreciated some months)
(
    'เครื่องพิมพ์',
    'PRINT-001',
    'เครื่องพิมพ์ HP LaserJet Pro',
    CURRENT_DATE - INTERVAL '24 months',
    18000.00,
    5,
    2000.00,
    'in_use',
    'ห้องบัญชี',
    '1202', -- เครื่องใช้สำนักงาน
    '1204', -- ค่าเสื่อมราคาสะสม
    '5901', -- ค่าเสื่อมราคา
    CURRENT_DATE - INTERVAL '1 month' -- Last depreciated 1 month ago
),
-- Asset 5: Security Camera System (purchased 8 months ago)
(
    'ระบบกล้องวงจรปิด',
    'CCTV-001',
    'ระบบกล้อง CCTV 8 จุด พร้อมเครื่องบันทึก',
    CURRENT_DATE - INTERVAL '8 months',
    120000.00,
    10,
    10000.00,
    'in_use',
    'ทั่วอาคาร',
    '1201', -- อุปกรณ์และเครื่องมือ
    '1204', -- ค่าเสื่อมราคาสะสม
    '5901', -- ค่าเสื่อมราคา
    NULL
)
ON CONFLICT DO NOTHING;

-- Display summary
SELECT 
    COUNT(*) as total_assets,
    SUM(purchase_cost) as total_cost,
    SUM(purchase_cost - salvage_value) as depreciable_amount
FROM fixed_assets
WHERE status = 'in_use';

