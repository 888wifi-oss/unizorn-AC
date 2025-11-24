-- Debug Script: Check Fixed Assets and Depreciation Calculation
-- This script helps diagnose why depreciation calculation returns no results

-- 1. Check if fixed_assets table exists and has data
SELECT 
    'Fixed Assets Count' as check_name,
    COUNT(*) as result
FROM fixed_assets;

-- 2. Check assets by status
SELECT 
    'Assets by Status' as check_name,
    status,
    COUNT(*) as count
FROM fixed_assets
GROUP BY status;

-- 3. Check all assets with details
SELECT 
    'All Assets Details' as check_name,
    asset_name,
    asset_code,
    purchase_date,
    purchase_cost,
    lifespan_years,
    status,
    last_depreciation_date,
    project_id
FROM fixed_assets
ORDER BY purchase_date DESC;

-- 4. Check if assets meet depreciation criteria for current month
WITH current_month AS (
    SELECT 
        DATE_TRUNC('month', CURRENT_DATE) as calc_date,
        EXTRACT(YEAR FROM CURRENT_DATE) as calc_year,
        EXTRACT(MONTH FROM CURRENT_DATE) as calc_month
)
SELECT 
    'Depreciation Eligibility' as check_name,
    fa.asset_name,
    fa.purchase_date,
    fa.last_depreciation_date,
    fa.lifespan_years,
    fa.status,
    CASE 
        WHEN fa.status != 'in_use' THEN 'Status not in_use'
        WHEN fa.purchase_date > CURRENT_DATE THEN 'Purchase date in future'
        WHEN fa.last_depreciation_date >= DATE_TRUNC('month', CURRENT_DATE) THEN 'Already depreciated this month'
        WHEN (EXTRACT(YEAR FROM CURRENT_DATE) - EXTRACT(YEAR FROM fa.purchase_date)) * 12 + 
             (EXTRACT(MONTH FROM CURRENT_DATE) - EXTRACT(MONTH FROM fa.purchase_date)) >= fa.lifespan_years * 12 
             THEN 'Fully depreciated'
        ELSE 'ELIGIBLE'
    END as eligibility_status
FROM fixed_assets fa, current_month cm;

-- 5. Calculate expected depreciation for current month
SELECT 
    'Expected Depreciation' as check_name,
    asset_name,
    purchase_cost,
    salvage_value,
    lifespan_years,
    ROUND((purchase_cost - COALESCE(salvage_value, 0)) / (lifespan_years * 12), 2) as monthly_depreciation
FROM fixed_assets
WHERE status = 'in_use'
    AND purchase_date <= CURRENT_DATE
    AND (last_depreciation_date IS NULL OR last_depreciation_date < DATE_TRUNC('month', CURRENT_DATE))
    AND (EXTRACT(YEAR FROM CURRENT_DATE) - EXTRACT(YEAR FROM purchase_date)) * 12 + 
        (EXTRACT(MONTH FROM CURRENT_DATE) - EXTRACT(MONTH FROM purchase_date)) < lifespan_years * 12;
