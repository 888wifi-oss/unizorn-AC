-- scripts/175_billing_recipients_and_meters.sql
-- Enhanced Billing System: Bill Recipients & Meter Reading Integration
-- ระบบออกบิลรายเดือนพร้อมเลือกผู้รับบิลและระบบมิเตอร์

SELECT '===== BILLING RECIPIENTS & METERS INTEGRATION =====' as debug_info;

-- ==========================================
-- 1. BILL RECIPIENTS SYSTEM
-- ==========================================

-- เพิ่ม columns ใน bills table สำหรับระบุผู้รับบิลแต่ละรายการ
DO $$
BEGIN
  -- ผู้รับบิลค่าส่วนกลาง (owner หรือ tenant)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'bills' 
    AND column_name = 'common_fee_recipient_type'
  ) THEN
    ALTER TABLE public.bills 
      ADD COLUMN common_fee_recipient_type VARCHAR(20) DEFAULT 'owner'; -- 'owner' or 'tenant'
    RAISE NOTICE 'Added common_fee_recipient_type column';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'bills' 
    AND column_name = 'common_fee_recipient_id'
  ) THEN
    ALTER TABLE public.bills 
      ADD COLUMN common_fee_recipient_id UUID; -- owner_id or tenant_id
    RAISE NOTICE 'Added common_fee_recipient_id column';
  END IF;
  
  -- ผู้รับบิลค่าน้ำ
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'bills' 
    AND column_name = 'water_fee_recipient_type'
  ) THEN
    ALTER TABLE public.bills 
      ADD COLUMN water_fee_recipient_type VARCHAR(20) DEFAULT 'tenant'; -- 'owner' or 'tenant'
    RAISE NOTICE 'Added water_fee_recipient_type column';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'bills' 
    AND column_name = 'water_fee_recipient_id'
  ) THEN
    ALTER TABLE public.bills 
      ADD COLUMN water_fee_recipient_id UUID; -- owner_id or tenant_id
    RAISE NOTICE 'Added water_fee_recipient_id column';
  END IF;
  
  -- ผู้รับบิลค่าไฟ
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'bills' 
    AND column_name = 'electricity_fee_recipient_type'
  ) THEN
    ALTER TABLE public.bills 
      ADD COLUMN electricity_fee_recipient_type VARCHAR(20) DEFAULT 'tenant'; -- 'owner' or 'tenant'
    RAISE NOTICE 'Added electricity_fee_recipient_type column';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'bills' 
    AND column_name = 'electricity_fee_recipient_id'
  ) THEN
    ALTER TABLE public.bills 
      ADD COLUMN electricity_fee_recipient_id UUID; -- owner_id or tenant_id
    RAISE NOTICE 'Added electricity_fee_recipient_id column';
  END IF;
  
  -- ผู้รับบิลค่าจอดรถ
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'bills' 
    AND column_name = 'parking_fee_recipient_type'
  ) THEN
    ALTER TABLE public.bills 
      ADD COLUMN parking_fee_recipient_type VARCHAR(20) DEFAULT 'owner'; -- 'owner' or 'tenant'
    RAISE NOTICE 'Added parking_fee_recipient_type column';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'bills' 
    AND column_name = 'parking_fee_recipient_id'
  ) THEN
    ALTER TABLE public.bills 
      ADD COLUMN parking_fee_recipient_id UUID; -- owner_id or tenant_id
    RAISE NOTICE 'Added parking_fee_recipient_id column';
  END IF;
  
END $$;

-- เพิ่ม indexes สำหรับ recipients (ตรวจสอบว่า columns มีอยู่ก่อน)
DO $$
BEGIN
  -- Index สำหรับ common_fee_recipient
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'bills' 
    AND column_name = 'common_fee_recipient_type'
  ) AND NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'idx_bills_common_fee_recipient'
  ) THEN
    CREATE INDEX idx_bills_common_fee_recipient 
      ON public.bills(common_fee_recipient_type, common_fee_recipient_id);
    RAISE NOTICE 'Created index idx_bills_common_fee_recipient';
  END IF;
  
  -- Index สำหรับ water_fee_recipient
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'bills' 
    AND column_name = 'water_fee_recipient_type'
  ) AND NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'idx_bills_water_fee_recipient'
  ) THEN
    CREATE INDEX idx_bills_water_fee_recipient 
      ON public.bills(water_fee_recipient_type, water_fee_recipient_id);
    RAISE NOTICE 'Created index idx_bills_water_fee_recipient';
  END IF;
  
  -- Index สำหรับ electricity_fee_recipient
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'bills' 
    AND column_name = 'electricity_fee_recipient_type'
  ) AND NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'idx_bills_electricity_fee_recipient'
  ) THEN
    CREATE INDEX idx_bills_electricity_fee_recipient 
      ON public.bills(electricity_fee_recipient_type, electricity_fee_recipient_id);
    RAISE NOTICE 'Created index idx_bills_electricity_fee_recipient';
  END IF;
END $$;

-- ==========================================
-- 2. METER READING SYSTEM
-- ==========================================

-- ตรวจสอบว่า utility_meters และ meter_readings tables มีอยู่แล้วหรือยัง
DO $$
BEGIN
  -- สร้าง utility_meters table ถ้ายังไม่มี
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'utility_meters'
  ) THEN
    CREATE TABLE public.utility_meters (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      unit_id UUID NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
      meter_type VARCHAR(50) NOT NULL, -- 'water', 'electricity', 'gas'
      meter_number VARCHAR(100) NOT NULL,
      meter_location VARCHAR(255),
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(unit_id, meter_type, meter_number)
    );
    
    CREATE INDEX idx_utility_meters_unit ON public.utility_meters(unit_id);
    CREATE INDEX idx_utility_meters_type ON public.utility_meters(meter_type);
    
    RAISE NOTICE 'Created utility_meters table';
  END IF;
  
  -- สร้าง meter_readings table ถ้ายังไม่มี
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'meter_readings'
  ) THEN
    CREATE TABLE public.meter_readings (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      meter_id UUID NOT NULL REFERENCES public.utility_meters(id) ON DELETE CASCADE,
      reading_date DATE NOT NULL,
      previous_reading NUMERIC NOT NULL DEFAULT 0,
      current_reading NUMERIC NOT NULL DEFAULT 0,
      usage_amount NUMERIC NOT NULL DEFAULT 0, -- calculated: current - previous
      unit_of_measure VARCHAR(20) DEFAULT 'unit', -- 'cubic_meter', 'kwh', 'liter'
      reading_type VARCHAR(50) DEFAULT 'regular', -- 'regular', 'estimated', 'corrected'
      reader_name VARCHAR(255),
      bill_id UUID REFERENCES public.bills(id) ON DELETE SET NULL, -- เชื่อมโยงกับบิล
      notes TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
    
    CREATE INDEX idx_meter_readings_meter ON public.meter_readings(meter_id);
    CREATE INDEX idx_meter_readings_date ON public.meter_readings(reading_date);
    CREATE INDEX idx_meter_readings_bill ON public.meter_readings(bill_id);
    
    RAISE NOTICE 'Created meter_readings table';
  ELSE
    -- ถ้ามี table แล้ว ให้เพิ่ม bill_id column ถ้ายังไม่มี
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'meter_readings' 
      AND column_name = 'bill_id'
    ) THEN
      ALTER TABLE public.meter_readings 
        ADD COLUMN bill_id UUID REFERENCES public.bills(id) ON DELETE SET NULL;
      CREATE INDEX IF NOT EXISTS idx_meter_readings_bill 
        ON public.meter_readings(bill_id);
      RAISE NOTICE 'Added bill_id to meter_readings';
    END IF;
  END IF;
END $$;

-- เพิ่ม utility_rates table ถ้ายังไม่มี
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'utility_rates'
  ) THEN
    CREATE TABLE public.utility_rates (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      meter_type VARCHAR(50) NOT NULL, -- 'water', 'electricity'
      rate_name VARCHAR(100) NOT NULL,
      rate_per_unit NUMERIC NOT NULL DEFAULT 0,
      minimum_charge NUMERIC DEFAULT 0,
      maximum_charge NUMERIC,
      effective_date DATE NOT NULL,
      expiry_date DATE,
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
    
    CREATE INDEX idx_utility_rates_type ON public.utility_rates(meter_type);
    CREATE INDEX idx_utility_rates_dates ON public.utility_rates(effective_date, expiry_date);
    
    RAISE NOTICE 'Created utility_rates table';
  END IF;
END $$;

-- เพิ่ม bill_id column ใน bills table สำหรับเชื่อมโยงกับ meter readings
DO $$
BEGIN
  -- เพิ่ม columns สำหรับ meter readings (ถ้ายังไม่มี)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'bills' 
    AND column_name = 'water_meter_reading_id'
  ) THEN
    ALTER TABLE public.bills 
      ADD COLUMN water_meter_reading_id UUID REFERENCES public.meter_readings(id) ON DELETE SET NULL;
    ALTER TABLE public.bills 
      ADD COLUMN electricity_meter_reading_id UUID REFERENCES public.meter_readings(id) ON DELETE SET NULL;
    
    RAISE NOTICE 'Added meter_reading_id columns to bills';
  END IF;
END $$;

-- ==========================================
-- 3. HELPER FUNCTIONS
-- ==========================================

-- ฟังก์ชันสำหรับดึง previous meter reading
CREATE OR REPLACE FUNCTION get_previous_meter_reading(
  p_meter_id UUID,
  p_reading_date DATE
) RETURNS NUMERIC AS $$
DECLARE
  v_previous_reading NUMERIC;
BEGIN
  SELECT current_reading INTO v_previous_reading
  FROM public.meter_readings
  WHERE meter_id = p_meter_id
    AND reading_date < p_reading_date
    AND reading_type = 'regular'
  ORDER BY reading_date DESC
  LIMIT 1;
  
  RETURN COALESCE(v_previous_reading, 0);
END;
$$ LANGUAGE plpgsql;

-- ฟังก์ชันสำหรับคำนวณค่าใช้จ่ายจากมิเตอร์
CREATE OR REPLACE FUNCTION calculate_utility_cost(
  p_meter_type VARCHAR(50),
  p_usage_amount NUMERIC,
  p_reading_date DATE
) RETURNS NUMERIC AS $$
DECLARE
  v_rate_per_unit NUMERIC;
  v_minimum_charge NUMERIC;
  v_calculated_amount NUMERIC;
BEGIN
  -- ดึง rate ที่มีผลในวันที่กำหนด
  SELECT rate_per_unit, minimum_charge
  INTO v_rate_per_unit, v_minimum_charge
  FROM public.utility_rates
  WHERE meter_type = p_meter_type
    AND is_active = true
    AND effective_date <= p_reading_date
    AND (expiry_date IS NULL OR expiry_date >= p_reading_date)
  ORDER BY effective_date DESC
  LIMIT 1;
  
  -- ถ้าไม่มี rate ให้คืนค่า 0
  IF v_rate_per_unit IS NULL THEN
    RETURN 0;
  END IF;
  
  -- คำนวณ: usage * rate
  v_calculated_amount := p_usage_amount * v_rate_per_unit;
  
  -- ใช้ minimum charge ถ้าคำนวณได้น้อยกว่า
  IF v_minimum_charge > 0 AND v_calculated_amount < v_minimum_charge THEN
    RETURN v_minimum_charge;
  END IF;
  
  RETURN v_calculated_amount;
END;
$$ LANGUAGE plpgsql;

-- ฟังก์ชันสำหรับดึงข้อมูล owner/tenant ที่เป็นผู้รับบิล
CREATE OR REPLACE FUNCTION get_bill_recipient_info(
  p_recipient_type VARCHAR(20),
  p_recipient_id UUID
) RETURNS TABLE (
  recipient_name TEXT,
  recipient_email TEXT,
  recipient_phone TEXT
) AS $$
BEGIN
  IF p_recipient_type = 'owner' THEN
    RETURN QUERY
    SELECT 
      o.name::TEXT,
      o.email::TEXT,
      o.phone::TEXT
    FROM public.owners o
    WHERE o.id = p_recipient_id;
  ELSIF p_recipient_type = 'tenant' THEN
    RETURN QUERY
    SELECT 
      t.name::TEXT,
      t.email::TEXT,
      t.phone::TEXT
    FROM public.tenants t
    WHERE t.id = p_recipient_id;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- 4. VIEWS
-- ==========================================

-- View สำหรับดูบิลพร้อมข้อมูลผู้รับบิล (ตรวจสอบว่า columns มีอยู่ก่อน)
DO $$
BEGIN
  -- ตรวจสอบว่า columns ที่จำเป็นมีอยู่ทั้งหมด
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'bills' 
    AND column_name IN ('common_fee_recipient_type', 'water_fee_recipient_type', 'electricity_fee_recipient_type')
  ) THEN
    -- Drop view ถ้ามีอยู่แล้ว
    DROP VIEW IF EXISTS bills_with_recipients;
    
    -- สร้าง view ใหม่ (ไม่ใช้ b.* เพื่อหลีกเลี่ยง duplicate columns)
    EXECUTE '
    CREATE VIEW bills_with_recipients AS
    SELECT 
      b.id,
      b.unit_id,
      b.bill_number,
      b.month,
      b.year,
      b.common_fee,
      b.water_fee,
      b.electricity_fee,
      b.parking_fee,
      b.other_fee,
      b.total,
      b.status,
      b.due_date,
      b.created_at,
      b.updated_at,
      b.project_id,
      -- Recipient columns from bills
      b.common_fee_recipient_type,
      b.common_fee_recipient_id,
      b.water_fee_recipient_type,
      b.water_fee_recipient_id,
      b.electricity_fee_recipient_type,
      b.electricity_fee_recipient_id,
      b.parking_fee_recipient_type,
      b.parking_fee_recipient_id,
      b.water_meter_reading_id,
      b.electricity_meter_reading_id,
      u.unit_number,
      -- Common Fee Recipient Name
      CASE 
        WHEN b.common_fee_recipient_type = ''owner'' THEN o1.name
        WHEN b.common_fee_recipient_type = ''tenant'' THEN t1.name
        ELSE NULL
      END as common_fee_recipient_name,
      -- Water Fee Recipient Name
      CASE 
        WHEN b.water_fee_recipient_type = ''owner'' THEN o2.name
        WHEN b.water_fee_recipient_type = ''tenant'' THEN t2.name
        ELSE NULL
      END as water_fee_recipient_name,
      -- Electricity Fee Recipient Name
      CASE 
        WHEN b.electricity_fee_recipient_type = ''owner'' THEN o3.name
        WHEN b.electricity_fee_recipient_type = ''tenant'' THEN t3.name
        ELSE NULL
      END as electricity_fee_recipient_name,
      -- Meter Readings
      mr_water.usage_amount as water_usage,
      mr_water.current_reading as water_meter_reading,
      mr_electricity.usage_amount as electricity_usage,
      mr_electricity.current_reading as electricity_meter_reading
    FROM public.bills b
    LEFT JOIN public.units u ON b.unit_id = u.id
    LEFT JOIN public.owners o1 ON b.common_fee_recipient_type = ''owner'' AND b.common_fee_recipient_id = o1.id
    LEFT JOIN public.tenants t1 ON b.common_fee_recipient_type = ''tenant'' AND b.common_fee_recipient_id = t1.id
    LEFT JOIN public.owners o2 ON b.water_fee_recipient_type = ''owner'' AND b.water_fee_recipient_id = o2.id
    LEFT JOIN public.tenants t2 ON b.water_fee_recipient_type = ''tenant'' AND b.water_fee_recipient_id = t2.id
    LEFT JOIN public.owners o3 ON b.electricity_fee_recipient_type = ''owner'' AND b.electricity_fee_recipient_id = o3.id
    LEFT JOIN public.tenants t3 ON b.electricity_fee_recipient_type = ''tenant'' AND b.electricity_fee_recipient_id = t3.id
    LEFT JOIN public.meter_readings mr_water ON b.water_meter_reading_id = mr_water.id
    LEFT JOIN public.meter_readings mr_electricity ON b.electricity_meter_reading_id = mr_electricity.id';
    
    RAISE NOTICE 'Created view bills_with_recipients';
  ELSE
    RAISE NOTICE 'Skipping view creation - required columns not found';
  END IF;
END $$;

-- Grant permissions on view (ถ้ามีอยู่)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.views 
    WHERE table_schema = 'public' 
    AND table_name = 'bills_with_recipients'
  ) THEN
    GRANT SELECT ON bills_with_recipients TO authenticated;
    RAISE NOTICE 'Granted permissions on bills_with_recipients view';
  END IF;
END $$;


SELECT '✅ Billing Recipients & Meters Integration Complete!' as debug_info;
SELECT '✅ Added recipient columns to bills table' as debug_info;
SELECT '✅ Created/Updated utility_meters and meter_readings tables' as debug_info;
SELECT '✅ Created helper functions for meter calculations' as debug_info;
SELECT '✅ Created bills_with_recipients view' as debug_info;

