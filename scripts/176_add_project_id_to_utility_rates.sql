-- scripts/176_add_project_id_to_utility_rates.sql
-- เพิ่ม project_id column ใน utility_rates table เพื่อรองรับอัตราค่าบริการที่แตกต่างกันตามโครงการ

SELECT '===== ADDING PROJECT_ID TO UTILITY_RATES =====' as debug_info;

-- เพิ่ม project_id column ใน utility_rates ถ้ายังไม่มี
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'utility_rates' 
    AND column_name = 'project_id'
  ) THEN
    ALTER TABLE public.utility_rates 
      ADD COLUMN project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE;
    
    CREATE INDEX IF NOT EXISTS idx_utility_rates_project 
      ON public.utility_rates(project_id);
    
    CREATE INDEX IF NOT EXISTS idx_utility_rates_project_type 
      ON public.utility_rates(project_id, meter_type);
    
    RAISE NOTICE 'Added project_id column to utility_rates';
  ELSE
    RAISE NOTICE 'project_id column already exists in utility_rates';
  END IF;
END $$;

-- อัพเดท function calculate_utility_cost ให้รองรับ project_id
CREATE OR REPLACE FUNCTION calculate_utility_cost(
  p_meter_type VARCHAR(50),
  p_usage_amount NUMERIC,
  p_reading_date DATE,
  p_project_id UUID DEFAULT NULL
) RETURNS NUMERIC AS $$
DECLARE
  v_rate_per_unit NUMERIC;
  v_minimum_charge NUMERIC;
  v_maximum_charge NUMERIC;
  v_calculated_amount NUMERIC;
BEGIN
  -- ดึงอัตราที่ active และตรงกับวันที่อ่าน
  -- ถ้ามี project_id ให้ดึงตาม project_id ด้วย
  SELECT rate_per_unit, minimum_charge, maximum_charge
  INTO v_rate_per_unit, v_minimum_charge, v_maximum_charge
  FROM public.utility_rates
  WHERE meter_type = p_meter_type
    AND is_active = true
    AND effective_date <= p_reading_date
    AND (expiry_date IS NULL OR expiry_date >= p_reading_date)
    AND (p_project_id IS NULL OR project_id = p_project_id)
  ORDER BY 
    -- ถ้ามี project_id ให้เลือกตาม project_id ก่อน
    CASE WHEN project_id = p_project_id THEN 0 ELSE 1 END,
    effective_date DESC
  LIMIT 1;
  
  -- ถ้าไม่มี rate ให้คืนค่า 0
  IF v_rate_per_unit IS NULL THEN
    RETURN 0;
  END IF;
  
  -- คำนวณจำนวนเงิน
  v_calculated_amount := p_usage_amount * v_rate_per_unit;
  
  -- ใช้ minimum charge ถ้าจำนวนเงินต่ำกว่า minimum
  IF v_minimum_charge > 0 AND v_calculated_amount < v_minimum_charge THEN
    v_calculated_amount := v_minimum_charge;
  END IF;
  
  -- ใช้ maximum charge ถ้ามีและจำนวนเงินเกิน
  IF v_maximum_charge IS NOT NULL AND v_maximum_charge > 0 AND v_calculated_amount > v_maximum_charge THEN
    v_calculated_amount := v_maximum_charge;
  END IF;
  
  RETURN v_calculated_amount;
END;
$$ LANGUAGE plpgsql;

SELECT '✅ Added project_id to utility_rates and updated calculate_utility_cost function' as debug_info;

