-- สร้างตารางสำหรับระบบจัดการรายรับ

-- ตารางบันทึกรายรับ (Revenue Journal)
CREATE TABLE IF NOT EXISTS revenue_journal (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  journal_date DATE NOT NULL,
  account_code TEXT NOT NULL REFERENCES chart_of_accounts(account_code),
  unit_id UUID REFERENCES units(id),
  bill_id UUID REFERENCES bills(id),
  description TEXT NOT NULL,
  amount NUMERIC(12,2) NOT NULL CHECK (amount >= 0),
  reference_number TEXT,
  created_by TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ตารางงบประมาณรายรับ (Revenue Budget)
CREATE TABLE IF NOT EXISTS revenue_budget (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_code TEXT NOT NULL REFERENCES chart_of_accounts(account_code),
  year INTEGER NOT NULL,
  month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
  budget_amount NUMERIC(12,2) NOT NULL CHECK (budget_amount >= 0),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(account_code, year, month)
);

-- ตารางวิเคราะห์อายุลูกหนี้ (Aging Analysis)
CREATE TABLE IF NOT EXISTS ar_aging_snapshot (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_date DATE NOT NULL,
  unit_id UUID NOT NULL REFERENCES units(id),
  current_amount NUMERIC(12,2) DEFAULT 0,
  days_30 NUMERIC(12,2) DEFAULT 0,
  days_60 NUMERIC(12,2) DEFAULT 0,
  days_90 NUMERIC(12,2) DEFAULT 0,
  days_over_90 NUMERIC(12,2) DEFAULT 0,
  total_amount NUMERIC(12,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- สร้าง indexes
CREATE INDEX IF NOT EXISTS idx_revenue_journal_date ON revenue_journal(journal_date);
CREATE INDEX IF NOT EXISTS idx_revenue_journal_account ON revenue_journal(account_code);
CREATE INDEX IF NOT EXISTS idx_revenue_journal_unit ON revenue_journal(unit_id);
CREATE INDEX IF NOT EXISTS idx_revenue_budget_period ON revenue_budget(year, month);
CREATE INDEX IF NOT EXISTS idx_ar_aging_date ON ar_aging_snapshot(snapshot_date);

-- สร้าง trigger สำหรับ updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_revenue_journal_updated_at
  BEFORE UPDATE ON revenue_journal
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_revenue_budget_updated_at
  BEFORE UPDATE ON revenue_budget
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ข้อมูลตัวอย่างงบประมาณรายรับ (2568)
INSERT INTO revenue_budget (account_code, year, month, budget_amount, notes) VALUES
-- ค่าส่วนกลาง
('4101', 2568, 1, 1200000, 'งบประมาณค่าส่วนกลางเดือนมกราคม'),
('4101', 2568, 2, 1200000, 'งบประมาณค่าส่วนกลางเดือนกุมภาพันธ์'),
('4101', 2568, 3, 1200000, 'งบประมาณค่าส่วนกลางเดือนมีนาคม'),
-- ค่าน้ำ
('4201', 2568, 1, 150000, 'งบประมาณค่าน้ำเดือนมกราคม'),
('4201', 2568, 2, 150000, 'งบประมาณค่าน้ำเดือนกุมภาพันธ์'),
('4201', 2568, 3, 150000, 'งบประมาณค่าน้ำเดือนมีนาคม'),
-- ค่าไฟฟ้า
('4202', 2568, 1, 200000, 'งบประมาณค่าไฟฟ้าเดือนมกราคม'),
('4202', 2568, 2, 200000, 'งบประมาณค่าไฟฟ้าเดือนกุมภาพันธ์'),
('4202', 2568, 3, 200000, 'งบประมาณค่าไฟฟ้าเดือนมีนาคม')
ON CONFLICT (account_code, year, month) DO NOTHING;
