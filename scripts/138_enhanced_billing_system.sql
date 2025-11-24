-- scripts/138_enhanced_billing_system.sql
-- Enhanced Billing System for Common Fees, Water, Electricity, etc.

SELECT 
  '===== ENHANCED BILLING SYSTEM =====' as debug_info;

-- 1. Create BILL_CATEGORIES table for different types of fees
CREATE TABLE IF NOT EXISTS public.bill_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  display_name VARCHAR(100) NOT NULL,
  description TEXT,
  icon VARCHAR(50),
  color VARCHAR(20),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create BILL_ITEMS table for individual fee items
CREATE TABLE IF NOT EXISTS public.bill_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bill_id UUID NOT NULL REFERENCES public.bills(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.bill_categories(id) ON DELETE SET NULL,
  item_name VARCHAR(255) NOT NULL,
  description TEXT,
  quantity NUMERIC DEFAULT 1,
  unit_price NUMERIC NOT NULL DEFAULT 0,
  amount NUMERIC NOT NULL DEFAULT 0,
  is_taxable BOOLEAN DEFAULT false,
  tax_rate NUMERIC DEFAULT 0,
  tax_amount NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create UTILITY_METERS table for tracking meter readings
CREATE TABLE IF NOT EXISTS public.utility_meters (
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

-- 4. Create METER_READINGS table for tracking meter readings
CREATE TABLE IF NOT EXISTS public.meter_readings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meter_id UUID NOT NULL REFERENCES public.utility_meters(id) ON DELETE CASCADE,
  reading_date DATE NOT NULL,
  previous_reading NUMERIC NOT NULL DEFAULT 0,
  current_reading NUMERIC NOT NULL DEFAULT 0,
  usage_amount NUMERIC NOT NULL DEFAULT 0,
  unit_of_measure VARCHAR(20) DEFAULT 'unit', -- 'cubic_meter', 'kwh', 'liter'
  reading_type VARCHAR(50) DEFAULT 'regular', -- 'regular', 'estimated', 'corrected'
  reader_name VARCHAR(255),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Create UTILITY_RATES table for different utility rates
CREATE TABLE IF NOT EXISTS public.utility_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meter_type VARCHAR(50) NOT NULL,
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

-- 6. Enhance BILLS table with additional fields
ALTER TABLE public.bills 
ADD COLUMN IF NOT EXISTS bill_type VARCHAR(50) DEFAULT 'monthly';

ALTER TABLE public.bills 
ADD COLUMN IF NOT EXISTS billing_period_start DATE;

ALTER TABLE public.bills 
ADD COLUMN IF NOT EXISTS billing_period_end DATE;

ALTER TABLE public.bills 
ADD COLUMN IF NOT EXISTS issue_date DATE DEFAULT CURRENT_DATE;

ALTER TABLE public.bills 
ADD COLUMN IF NOT EXISTS tax_rate NUMERIC DEFAULT 0;

ALTER TABLE public.bills 
ADD COLUMN IF NOT EXISTS tax_amount NUMERIC DEFAULT 0;

ALTER TABLE public.bills 
ADD COLUMN IF NOT EXISTS discount_amount NUMERIC DEFAULT 0;

ALTER TABLE public.bills 
ADD COLUMN IF NOT EXISTS late_fee NUMERIC DEFAULT 0;

ALTER TABLE public.bills 
ADD COLUMN IF NOT EXISTS previous_balance NUMERIC DEFAULT 0;

ALTER TABLE public.bills 
ADD COLUMN IF NOT EXISTS final_amount NUMERIC DEFAULT 0;

ALTER TABLE public.bills 
ADD COLUMN IF NOT EXISTS payment_terms INTEGER DEFAULT 15;

ALTER TABLE public.bills 
ADD COLUMN IF NOT EXISTS notes TEXT;

-- 7. Create PAYMENT_SCHEDULES table for installment payments
CREATE TABLE IF NOT EXISTS public.payment_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bill_id UUID NOT NULL REFERENCES public.bills(id) ON DELETE CASCADE,
  installment_number INTEGER NOT NULL,
  due_date DATE NOT NULL,
  amount NUMERIC NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  paid_date DATE,
  paid_amount NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Create PAYMENT_METHODS table for different payment methods
CREATE TABLE IF NOT EXISTS public.payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  display_name VARCHAR(100) NOT NULL,
  description TEXT,
  icon VARCHAR(50),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Enhance PAYMENTS table with additional fields
ALTER TABLE public.payments 
ADD COLUMN IF NOT EXISTS payment_method_id UUID REFERENCES public.payment_methods(id);

ALTER TABLE public.payments 
ADD COLUMN IF NOT EXISTS bank_name VARCHAR(100);

ALTER TABLE public.payments 
ADD COLUMN IF NOT EXISTS account_number VARCHAR(50);

ALTER TABLE public.payments 
ADD COLUMN IF NOT EXISTS transaction_id VARCHAR(100);

ALTER TABLE public.payments 
ADD COLUMN IF NOT EXISTS receipt_url TEXT;

ALTER TABLE public.payments 
ADD COLUMN IF NOT EXISTS processed_by VARCHAR(255);

ALTER TABLE public.payments 
ADD COLUMN IF NOT EXISTS processed_at TIMESTAMPTZ;

-- 10. Create BILL_TEMPLATES table for recurring bills
CREATE TABLE IF NOT EXISTS public.bill_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  bill_type VARCHAR(50) NOT NULL,
  template_data JSONB NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. Create BILL_NOTIFICATIONS table for bill notifications
CREATE TABLE IF NOT EXISTS public.bill_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bill_id UUID NOT NULL REFERENCES public.bills(id) ON DELETE CASCADE,
  notification_type VARCHAR(50) NOT NULL, -- 'due_soon', 'overdue', 'payment_received'
  notification_date DATE NOT NULL,
  notification_method VARCHAR(50) NOT NULL, -- 'email', 'sms', 'line'
  recipient_email VARCHAR(255),
  recipient_phone VARCHAR(20),
  message TEXT NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. Insert default bill categories
INSERT INTO public.bill_categories (name, display_name, description, icon, color) VALUES
('common_fee', 'ค่าส่วนกลาง', 'ค่าบริการส่วนกลางของอาคาร', 'Building', 'blue'),
('water_fee', 'ค่าน้ำ', 'ค่าน้ำประปา', 'Droplets', 'cyan'),
('electricity_fee', 'ค่าไฟ', 'ค่าไฟฟ้า', 'Zap', 'yellow'),
('parking_fee', 'ค่าจอดรถ', 'ค่าบริการที่จอดรถ', 'Car', 'green'),
('internet_fee', 'ค่าเน็ต', 'ค่าบริการอินเทอร์เน็ต', 'Wifi', 'purple'),
('cable_fee', 'ค่าทีวี', 'ค่าบริการเคเบิลทีวี', 'Tv', 'red'),
('maintenance_fee', 'ค่าซ่อมบำรุง', 'ค่าซ่อมบำรุงส่วนกลาง', 'Wrench', 'orange'),
('security_fee', 'ค่าความปลอดภัย', 'ค่าบริการรักษาความปลอดภัย', 'Shield', 'indigo'),
('cleaning_fee', 'ค่าทำความสะอาด', 'ค่าบริการทำความสะอาด', 'Sparkles', 'pink'),
('other_fee', 'ค่าอื่นๆ', 'ค่าบริการอื่นๆ', 'MoreHorizontal', 'gray')
ON CONFLICT (name) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description,
  icon = EXCLUDED.icon,
  color = EXCLUDED.color;

-- 13. Insert default payment methods
INSERT INTO public.payment_methods (name, display_name, description, icon) VALUES
('cash', 'เงินสด', 'ชำระด้วยเงินสด', 'Banknote'),
('bank_transfer', 'โอนเงิน', 'โอนเงินผ่านธนาคาร', 'CreditCard'),
('check', 'เช็ค', 'ชำระด้วยเช็ค', 'FileText'),
('credit_card', 'บัตรเครดิต', 'ชำระด้วยบัตรเครดิต', 'CreditCard'),
('qr_code', 'QR Code', 'ชำระผ่าน QR Code', 'QrCode'),
('mobile_banking', 'Mobile Banking', 'ชำระผ่าน Mobile Banking', 'Smartphone')
ON CONFLICT (name) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description,
  icon = EXCLUDED.icon;

-- 14. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_bill_items_bill_id ON public.bill_items(bill_id);
CREATE INDEX IF NOT EXISTS idx_bill_items_category_id ON public.bill_items(category_id);
CREATE INDEX IF NOT EXISTS idx_utility_meters_unit_id ON public.utility_meters(unit_id);
CREATE INDEX IF NOT EXISTS idx_utility_meters_meter_type ON public.utility_meters(meter_type);
CREATE INDEX IF NOT EXISTS idx_meter_readings_meter_id ON public.meter_readings(meter_id);
CREATE INDEX IF NOT EXISTS idx_meter_readings_reading_date ON public.meter_readings(reading_date);
CREATE INDEX IF NOT EXISTS idx_utility_rates_meter_type ON public.utility_rates(meter_type);
CREATE INDEX IF NOT EXISTS idx_utility_rates_effective_date ON public.utility_rates(effective_date);
CREATE INDEX IF NOT EXISTS idx_payment_schedules_bill_id ON public.payment_schedules(bill_id);
CREATE INDEX IF NOT EXISTS idx_payment_schedules_due_date ON public.payment_schedules(due_date);
CREATE INDEX IF NOT EXISTS idx_bill_notifications_bill_id ON public.bill_notifications(bill_id);
CREATE INDEX IF NOT EXISTS idx_bill_notifications_notification_date ON public.bill_notifications(notification_date);

-- 15. Enable Row Level Security
ALTER TABLE public.bill_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bill_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.utility_meters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meter_readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.utility_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bill_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bill_notifications ENABLE ROW LEVEL SECURITY;

-- 16. Create RLS policies
-- Bill categories policies
CREATE POLICY "Service role can manage bill categories" ON public.bill_categories 
  FOR ALL USING (auth.role() = 'service_role');

-- Bill items policies
CREATE POLICY "Users can view bill items of their units" ON public.bill_items 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.bills b
      JOIN public.units u ON b.unit_id = u.id
      WHERE b.id = bill_items.bill_id 
      AND u.user_id = auth.uid()
    ) OR auth.role() = 'service_role'
  );

CREATE POLICY "Service role can manage bill items" ON public.bill_items 
  FOR ALL USING (auth.role() = 'service_role');

-- Utility meters policies
CREATE POLICY "Users can view meters of their units" ON public.utility_meters 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.units 
      WHERE units.id = utility_meters.unit_id 
      AND units.user_id = auth.uid()
    ) OR auth.role() = 'service_role'
  );

CREATE POLICY "Service role can manage utility meters" ON public.utility_meters 
  FOR ALL USING (auth.role() = 'service_role');

-- Meter readings policies
CREATE POLICY "Users can view meter readings of their units" ON public.meter_readings 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.utility_meters um
      JOIN public.units u ON um.unit_id = u.id
      WHERE um.id = meter_readings.meter_id 
      AND u.user_id = auth.uid()
    ) OR auth.role() = 'service_role'
  );

CREATE POLICY "Service role can manage meter readings" ON public.meter_readings 
  FOR ALL USING (auth.role() = 'service_role');

-- Utility rates policies
CREATE POLICY "Service role can manage utility rates" ON public.utility_rates 
  FOR ALL USING (auth.role() = 'service_role');

-- Payment schedules policies
CREATE POLICY "Users can view payment schedules of their units" ON public.payment_schedules 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.bills b
      JOIN public.units u ON b.unit_id = u.id
      WHERE b.id = payment_schedules.bill_id 
      AND u.user_id = auth.uid()
    ) OR auth.role() = 'service_role'
  );

CREATE POLICY "Service role can manage payment schedules" ON public.payment_schedules 
  FOR ALL USING (auth.role() = 'service_role');

-- Payment methods policies
CREATE POLICY "Service role can manage payment methods" ON public.payment_methods 
  FOR ALL USING (auth.role() = 'service_role');

-- Bill templates policies
CREATE POLICY "Service role can manage bill templates" ON public.bill_templates 
  FOR ALL USING (auth.role() = 'service_role');

-- Bill notifications policies
CREATE POLICY "Users can view notifications of their units" ON public.bill_notifications 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.bills b
      JOIN public.units u ON b.unit_id = u.id
      WHERE b.id = bill_notifications.bill_id 
      AND u.user_id = auth.uid()
    ) OR auth.role() = 'service_role'
  );

CREATE POLICY "Service role can manage bill notifications" ON public.bill_notifications 
  FOR ALL USING (auth.role() = 'service_role');

-- 17. Verify table creation
SELECT 
  'Enhanced Billing System Tables' as check_type,
  table_name,
  table_type
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
    'bill_categories', 'bill_items', 'utility_meters', 'meter_readings',
    'utility_rates', 'payment_schedules', 'payment_methods', 
    'bill_templates', 'bill_notifications'
  )
ORDER BY table_name;
