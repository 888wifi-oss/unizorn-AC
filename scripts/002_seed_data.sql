-- Insert sample units
INSERT INTO public.units (unit_number, floor, size, owner_name, owner_phone, owner_email, residents, status) VALUES
('A-101', 1, 45.5, 'สมชาย ใจดี', '081-234-5678', 'somchai@email.com', 2, 'occupied'),
('A-102', 1, 45.5, 'สมหญิง รักดี', '082-345-6789', 'somying@email.com', 3, 'occupied'),
('A-201', 2, 50.0, 'วิชัย มั่งมี', '083-456-7890', 'wichai@email.com', 1, 'occupied'),
('A-202', 2, 50.0, 'สุดา สวยงาม', '084-567-8901', 'suda@email.com', 2, 'occupied'),
('A-301', 3, 55.0, 'ประยุทธ์ รวยมาก', '085-678-9012', 'prayut@email.com', 4, 'occupied'),
('B-101', 1, 48.0, 'นิภา เก่งกาจ', '086-789-0123', 'nipa@email.com', 2, 'occupied'),
('B-102', 1, 48.0, 'ธนา ฉลาด', '087-890-1234', 'tana@email.com', 1, 'occupied'),
('B-201', 2, 52.0, 'วรรณา สุขใจ', '088-901-2345', 'wanna@email.com', 3, 'occupied'),
('B-502', 5, 60.0, 'ชาญชัย ดีเลิศ', '089-012-3456', 'chanchai@email.com', 2, 'occupied'),
('C-204', 2, 45.0, 'อรุณ เช้าตรู่', '090-123-4567', 'arun@email.com', 1, 'occupied')
ON CONFLICT (unit_number) DO NOTHING;

-- Insert sample bills
INSERT INTO public.bills (unit_id, bill_number, month, year, common_fee, water_fee, electricity_fee, parking_fee, other_fee, total, status, due_date)
SELECT 
  u.id,
  'INV-' || TO_CHAR(NOW(), 'YYYYMM') || '-' || LPAD(ROW_NUMBER() OVER ()::TEXT, 4, '0'),
  'ตุลาคม',
  2568,
  3000,
  500,
  CASE 
    WHEN u.unit_number = 'A-301' THEN 3500
    WHEN u.unit_number = 'B-502' THEN 450
    WHEN u.unit_number = 'C-204' THEN 4200
    ELSE 800
  END,
  500,
  0,
  CASE 
    WHEN u.unit_number = 'A-301' THEN 7500
    WHEN u.unit_number = 'B-502' THEN 4450
    WHEN u.unit_number = 'C-204' THEN 8200
    ELSE 4800
  END,
  CASE 
    WHEN u.unit_number IN ('A-301', 'B-502') THEN 'paid'
    WHEN u.unit_number = 'C-204' THEN 'overdue'
    ELSE 'pending'
  END,
  CURRENT_DATE + INTERVAL '15 days'
FROM public.units u
ON CONFLICT (bill_number) DO NOTHING;

-- Insert sample payments for paid bills
INSERT INTO public.payments (bill_id, unit_id, amount, payment_date, payment_method, reference_number)
SELECT 
  b.id,
  b.unit_id,
  b.total,
  CURRENT_DATE - INTERVAL '2 days',
  'โอนเงิน',
  'PAY-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(ROW_NUMBER() OVER ()::TEXT, 4, '0')
FROM public.bills b
WHERE b.status = 'paid'
ON CONFLICT DO NOTHING;
