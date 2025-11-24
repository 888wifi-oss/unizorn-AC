-- scripts/140_migrate_existing_data.sql
-- Migrate existing data from old structure to new structure

SELECT 
  '===== MIGRATING EXISTING DATA =====' as debug_info;

-- Step 1: Create owners from existing unit data
INSERT INTO public.owners (
  unit_id,
  name,
  email,
  phone,
  is_primary,
  ownership_percentage,
  start_date,
  notes
)
SELECT 
  u.id as unit_id,
  u.owner_name as name,
  u.owner_email as email,
  u.owner_phone as phone,
  true as is_primary,
  100.00 as ownership_percentage,
  u.created_at::date as start_date,
  'Migrated from existing unit data' as notes
FROM public.units u
WHERE u.owner_name IS NOT NULL
  AND u.owner_name != ''
  AND NOT EXISTS (
    SELECT 1 FROM public.owners o 
    WHERE o.unit_id = u.id
  );

-- Step 2: Update units table with current_owner_id
UPDATE public.units 
SET current_owner_id = o.id
FROM public.owners o
WHERE units.id = o.unit_id
  AND units.current_owner_id IS NULL;

-- Step 3: Create sample tenants (if no existing tenant data)
-- This is optional - you can skip this if you don't want sample data
INSERT INTO public.tenants (
  unit_id,
  owner_id,
  name,
  email,
  phone,
  move_in_date,
  rental_price,
  deposit_amount,
  payment_method,
  status,
  notes
)
SELECT 
  u.id as unit_id,
  u.current_owner_id as owner_id,
  'ผู้เช่าตัวอย่าง' as name,
  'tenant@example.com' as email,
  '081-000-0000' as phone,
  CURRENT_DATE - INTERVAL '30 days' as move_in_date,
  u.default_rental_price as rental_price,
  20000 as deposit_amount,
  'bank_transfer' as payment_method,
  'active' as status,
  'ข้อมูลตัวอย่างสำหรับการทดสอบ' as notes
FROM public.units u
WHERE u.current_owner_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.tenants t 
    WHERE t.unit_id = u.id
  )
LIMIT 5; -- Only create 5 sample tenants

-- Step 4: Update units table with current_tenant_id
UPDATE public.units 
SET current_tenant_id = t.id
FROM public.tenants t
WHERE units.id = t.unit_id
  AND units.current_tenant_id IS NULL;

-- Step 5: Create sample tenancy history
INSERT INTO public.tenancy_history (
  unit_id,
  tenant_id,
  rental_start_date,
  rental_price,
  deposit_amount,
  move_in_date,
  status,
  notes
)
SELECT 
  t.unit_id,
  t.id as tenant_id,
  t.move_in_date as rental_start_date,
  t.rental_price,
  t.deposit_amount,
  t.move_in_date,
  'completed' as status,
  'ประวัติการเช่าจากการ migration' as notes
FROM public.tenants t
WHERE t.move_in_date IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.tenancy_history th 
    WHERE th.tenant_id = t.id
  );

-- Step 6: Create sample rental payments
INSERT INTO public.rental_payments (
  tenant_id,
  unit_id,
  month,
  year,
  amount,
  status,
  payment_date,
  payment_method,
  reference_number,
  notes
)
SELECT 
  t.id as tenant_id,
  t.unit_id,
  TO_CHAR(CURRENT_DATE - INTERVAL '1 month', 'MM') as month,
  EXTRACT(YEAR FROM CURRENT_DATE - INTERVAL '1 month') as year,
  t.rental_price as amount,
  'paid' as status,
  CURRENT_DATE - INTERVAL '15 days' as payment_date,
  t.payment_method,
  'PAY-' || TO_CHAR(CURRENT_DATE - INTERVAL '15 days', 'YYYYMMDD') || '-' || LPAD(ROW_NUMBER() OVER ()::TEXT, 4, '0') as reference_number,
  'การชำระเงินตัวอย่าง' as notes
FROM public.tenants t
WHERE t.rental_price > 0
  AND NOT EXISTS (
    SELECT 1 FROM public.rental_payments rp 
    WHERE rp.tenant_id = t.id
  )
LIMIT 3; -- Only create 3 sample payments

-- Step 7: Verify data migration
SELECT 
  'Data Migration Verification - Units with Owners' as check_type,
  COUNT(*) as total_units,
  COUNT(current_owner_id) as units_with_owners,
  COUNT(current_tenant_id) as units_with_tenants
FROM public.units;

-- Step 8: Check owners data
SELECT 
  'Data Migration Verification - Owners' as check_type,
  COUNT(*) as total_owners,
  COUNT(CASE WHEN is_primary = true THEN 1 END) as primary_owners,
  COUNT(CASE WHEN email IS NOT NULL THEN 1 END) as owners_with_email,
  COUNT(CASE WHEN phone IS NOT NULL THEN 1 END) as owners_with_phone
FROM public.owners;

-- Step 9: Check tenants data
SELECT 
  'Data Migration Verification - Tenants' as check_type,
  COUNT(*) as total_tenants,
  COUNT(CASE WHEN status = 'active' THEN 1 END) as active_tenants,
  COUNT(CASE WHEN rental_price > 0 THEN 1 END) as tenants_with_rent,
  COUNT(CASE WHEN move_in_date IS NOT NULL THEN 1 END) as tenants_with_move_in_date
FROM public.tenants;

-- Step 10: Check tenancy history data
SELECT 
  'Data Migration Verification - Tenancy History' as check_type,
  COUNT(*) as total_history_records,
  COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_tenancies,
  COUNT(CASE WHEN rental_price > 0 THEN 1 END) as history_with_rent
FROM public.tenancy_history;

-- Step 11: Check rental payments data
SELECT 
  'Data Migration Verification - Rental Payments' as check_type,
  COUNT(*) as total_payments,
  COUNT(CASE WHEN status = 'paid' THEN 1 END) as paid_payments,
  COUNT(CASE WHEN payment_date IS NOT NULL THEN 1 END) as payments_with_date,
  SUM(amount) as total_amount
FROM public.rental_payments;

-- Step 12: Sample data verification
SELECT 
  'Sample Data - Units with Complete Info' as check_type,
  u.unit_number,
  u.unit_type,
  u.ownership_type,
  o.name as owner_name,
  t.name as tenant_name,
  t.rental_price,
  t.status as tenant_status
FROM public.units u
LEFT JOIN public.owners o ON u.current_owner_id = o.id
LEFT JOIN public.tenants t ON u.current_tenant_id = t.id
WHERE u.current_owner_id IS NOT NULL
ORDER BY u.unit_number
LIMIT 5;

SELECT 
  '===== DATA MIGRATION COMPLETED =====' as debug_info;
