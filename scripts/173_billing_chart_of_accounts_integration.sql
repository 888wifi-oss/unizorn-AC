-- scripts/173_billing_chart_of_accounts_integration.sql
-- Integration of Billing System with Chart of Accounts
-- สร้างการเชื่อมโยงระบบออกบิลกับผังบัญชี

SELECT '===== BILLING CHART OF ACCOUNTS INTEGRATION =====' as debug_info;

-- เพิ่ม project_id ใน bills table (ถ้ายังไม่มี)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'bills' 
    AND column_name = 'project_id'
  ) THEN
    ALTER TABLE public.bills ADD COLUMN project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL;
    CREATE INDEX IF NOT EXISTS idx_bills_project_id ON public.bills(project_id);
    RAISE NOTICE 'Added project_id column to bills table';
  END IF;
END $$;

-- สร้างฟังก์ชันสำหรับ mapping bill items กับ account codes
CREATE OR REPLACE FUNCTION get_account_code_for_bill_item(
  item_type TEXT
) RETURNS TEXT AS $$
BEGIN
  CASE item_type
    WHEN 'common_fee' THEN RETURN '4101'; -- รายได้ค่าส่วนกลาง
    WHEN 'water_fee' THEN RETURN '4102'; -- รายได้ค่าน้ำ
    WHEN 'electricity_fee' THEN RETURN '4103'; -- รายได้ค่าไฟฟ้า
    WHEN 'parking_fee' THEN RETURN '4104'; -- รายได้ค่าที่จอดรถ
    WHEN 'other_fee' THEN RETURN '4203'; -- รายได้เบ็ดเตล็ด
    ELSE RETURN '4203'; -- Default: รายได้เบ็ดเตล็ด
  END CASE;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- สร้างฟังก์ชันสำหรับสร้าง revenue journal entries จาก bill
CREATE OR REPLACE FUNCTION create_revenue_journal_from_bill(
  p_bill_id UUID
) RETURNS VOID AS $$
DECLARE
  v_bill RECORD;
  v_bill_date DATE;
  journalEntries JSONB := '[]'::JSONB;
BEGIN
  -- ดึงข้อมูลบิล
  SELECT 
    b.*,
    u.project_id
  INTO v_bill
  FROM public.bills b
  LEFT JOIN public.units u ON b.unit_id = u.id
  WHERE b.id = p_bill_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Bill not found: %', p_bill_id;
  END IF;
  
  -- แปลง month เป็น date
  v_bill_date := TO_DATE(v_bill.month || '-01', 'YYYY-MM-DD');
  
  -- สร้าง journal entries สำหรับแต่ละรายการที่มีมูลค่า
  
  -- ค่าส่วนกลาง
  IF v_bill.common_fee > 0 THEN
    INSERT INTO public.revenue_journal (
      journal_date,
      account_code,
      unit_id,
      bill_id,
      description,
      amount,
      reference_number,
      project_id
    ) VALUES (
      v_bill_date,
      get_account_code_for_bill_item('common_fee'),
      v_bill.unit_id,
      v_bill.id,
      'ค่าส่วนกลาง ' || v_bill.month,
      v_bill.common_fee,
      v_bill.bill_number,
      v_bill.project_id
    ) ON CONFLICT DO NOTHING;
  END IF;
  
  -- ค่าน้ำ
  IF v_bill.water_fee > 0 THEN
    INSERT INTO public.revenue_journal (
      journal_date,
      account_code,
      unit_id,
      bill_id,
      description,
      amount,
      reference_number,
      project_id
    ) VALUES (
      v_bill_date,
      get_account_code_for_bill_item('water_fee'),
      v_bill.unit_id,
      v_bill.id,
      'ค่าน้ำ ' || v_bill.month,
      v_bill.water_fee,
      v_bill.bill_number,
      v_bill.project_id
    ) ON CONFLICT DO NOTHING;
  END IF;
  
  -- ค่าไฟ
  IF v_bill.electricity_fee > 0 THEN
    INSERT INTO public.revenue_journal (
      journal_date,
      account_code,
      unit_id,
      bill_id,
      description,
      amount,
      reference_number,
      project_id
    ) VALUES (
      v_bill_date,
      get_account_code_for_bill_item('electricity_fee'),
      v_bill.unit_id,
      v_bill.id,
      'ค่าไฟฟ้า ' || v_bill.month,
      v_bill.electricity_fee,
      v_bill.bill_number,
      v_bill.project_id
    ) ON CONFLICT DO NOTHING;
  END IF;
  
  -- ค่าจอดรถ
  IF v_bill.parking_fee > 0 THEN
    INSERT INTO public.revenue_journal (
      journal_date,
      account_code,
      unit_id,
      bill_id,
      description,
      amount,
      reference_number,
      project_id
    ) VALUES (
      v_bill_date,
      get_account_code_for_bill_item('parking_fee'),
      v_bill.unit_id,
      v_bill.id,
      'ค่าที่จอดรถ ' || v_bill.month,
      v_bill.parking_fee,
      v_bill.bill_number,
      v_bill.project_id
    ) ON CONFLICT DO NOTHING;
  END IF;
  
  -- อื่นๆ
  IF v_bill.other_fee > 0 THEN
    INSERT INTO public.revenue_journal (
      journal_date,
      account_code,
      unit_id,
      bill_id,
      description,
      amount,
      reference_number,
      project_id
    ) VALUES (
      v_bill_date,
      get_account_code_for_bill_item('other_fee'),
      v_bill.unit_id,
      v_bill.id,
      'รายได้อื่นๆ ' || v_bill.month,
      v_bill.other_fee,
      v_bill.bill_number,
      v_bill.project_id
    ) ON CONFLICT DO NOTHING;
  END IF;
  
END;
$$ LANGUAGE plpgsql;

-- สร้าง Trigger สำหรับ auto-create revenue journal เมื่อสร้างบิลใหม่
CREATE OR REPLACE FUNCTION trigger_create_revenue_journal()
RETURNS TRIGGER AS $$
BEGIN
  -- สร้าง revenue journal entries สำหรับบิลใหม่
  IF TG_OP = 'INSERT' THEN
    PERFORM create_revenue_journal_from_bill(NEW.id);
  ELSIF TG_OP = 'UPDATE' THEN
    -- ลบ journal entries เก่าที่เชื่อมโยงกับบิลนี้
    DELETE FROM public.revenue_journal 
    WHERE bill_id = NEW.id;
    
    -- สร้าง journal entries ใหม่
    PERFORM create_revenue_journal_from_bill(NEW.id);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ลบ trigger เก่า (ถ้ามี)
DROP TRIGGER IF EXISTS trg_create_revenue_journal_on_bill ON public.bills;

-- สร้าง trigger ใหม่
CREATE TRIGGER trg_create_revenue_journal_on_bill
  AFTER INSERT OR UPDATE ON public.bills
  FOR EACH ROW
  EXECUTE FUNCTION trigger_create_revenue_journal();

-- เพิ่ม project_id ใน revenue_journal table (ถ้ายังไม่มี)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'revenue_journal' 
    AND column_name = 'project_id'
  ) THEN
    ALTER TABLE public.revenue_journal 
      ADD COLUMN project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL;
    RAISE NOTICE 'Added project_id column to revenue_journal table';
  END IF;
END $$;

-- เพิ่ม index สำหรับ revenue_journal.bill_id (ถ้ายังไม่มี)
CREATE INDEX IF NOT EXISTS idx_revenue_journal_bill_id 
  ON public.revenue_journal(bill_id);

-- เพิ่ม index สำหรับ revenue_journal.project_id (ถ้ายังไม่มี)
CREATE INDEX IF NOT EXISTS idx_revenue_journal_project_id 
  ON public.revenue_journal(project_id);

-- สร้าง View สำหรับดูบิลพร้อม account mapping
-- Drop view ก่อน (ถ้ามีอยู่แล้ว) เพื่อหลีกเลี่ยงปัญหาการเปลี่ยนโครงสร้าง
DROP VIEW IF EXISTS bills_with_accounts CASCADE;

CREATE VIEW bills_with_accounts AS
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
  u.unit_number,
  u.owner_name,
  u.project_id as unit_project_id,
  -- แสดง account codes สำหรับแต่ละรายการ
  get_account_code_for_bill_item('common_fee') as common_fee_account,
  get_account_code_for_bill_item('water_fee') as water_fee_account,
  get_account_code_for_bill_item('electricity_fee') as electricity_fee_account,
  get_account_code_for_bill_item('parking_fee') as parking_fee_account,
  get_account_code_for_bill_item('other_fee') as other_fee_account,
  -- แสดงชื่อบัญชี
  (SELECT account_name FROM chart_of_accounts WHERE account_code = get_account_code_for_bill_item('common_fee')) as common_fee_account_name,
  (SELECT account_name FROM chart_of_accounts WHERE account_code = get_account_code_for_bill_item('water_fee')) as water_fee_account_name,
  (SELECT account_name FROM chart_of_accounts WHERE account_code = get_account_code_for_bill_item('electricity_fee')) as electricity_fee_account_name,
  (SELECT account_name FROM chart_of_accounts WHERE account_code = get_account_code_for_bill_item('parking_fee')) as parking_fee_account_name,
  (SELECT account_name FROM chart_of_accounts WHERE account_code = get_account_code_for_bill_item('other_fee')) as other_fee_account_name
FROM public.bills b
LEFT JOIN public.units u ON b.unit_id = u.id;

-- Grant permissions
GRANT SELECT ON bills_with_accounts TO authenticated;

SELECT '✅ Billing Chart of Accounts Integration Complete!' as debug_info;
SELECT '✅ Functions created: get_account_code_for_bill_item, create_revenue_journal_from_bill' as debug_info;
SELECT '✅ Trigger created: trg_create_revenue_journal_on_bill' as debug_info;
SELECT '✅ View created: bills_with_accounts' as debug_info;

