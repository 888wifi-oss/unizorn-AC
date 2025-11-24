-- scripts/174_backfill_billing_revenue_journal.sql
-- Backfill revenue journal entries for existing bills
-- สร้าง revenue journal entries สำหรับบิลเก่าที่สร้างก่อน migration

SELECT '===== BACKFILL BILLING REVENUE JOURNAL =====' as debug_info;

-- ตรวจสอบบิลที่ยังไม่มี revenue journal entries
SELECT 
  COUNT(*) as total_bills,
  COUNT(DISTINCT b.id) as bills_without_journal
FROM bills b
LEFT JOIN revenue_journal rj ON b.id = rj.bill_id
WHERE rj.id IS NULL;

-- สร้าง revenue journal entries สำหรับบิลที่ยังไม่มี
DO $$
DECLARE
  bill_record RECORD;
  bill_count INTEGER := 0;
BEGIN
  FOR bill_record IN 
    SELECT DISTINCT b.*, u.project_id
    FROM bills b
    LEFT JOIN units u ON b.unit_id = u.id
    LEFT JOIN revenue_journal rj ON b.id = rj.bill_id
    WHERE rj.id IS NULL
    ORDER BY b.created_at
  LOOP
    -- เรียกใช้ฟังก์ชันที่สร้างไว้แล้ว
    BEGIN
      PERFORM create_revenue_journal_from_bill(bill_record.id);
      bill_count := bill_count + 1;
      
      -- Log progress every 100 bills
      IF bill_count % 100 = 0 THEN
        RAISE NOTICE 'Processed % bills...', bill_count;
      END IF;
    EXCEPTION
      WHEN OTHERS THEN
        RAISE WARNING 'Error processing bill %: %', bill_record.id, SQLERRM;
    END;
  END LOOP;
  
  RAISE NOTICE '✅ Backfill complete! Processed % bills.', bill_count;
END $$;

-- ตรวจสอบผลลัพธ์
SELECT 
  'Summary' as report_type,
  (SELECT COUNT(*) FROM bills) as total_bills,
  (SELECT COUNT(DISTINCT bill_id) FROM revenue_journal) as bills_with_journal,
  (SELECT COUNT(*) FROM revenue_journal) as total_journal_entries,
  (SELECT COUNT(*) FROM bills b 
   LEFT JOIN revenue_journal rj ON b.id = rj.bill_id 
   WHERE rj.id IS NULL) as bills_still_missing_journal;

-- แสดงตัวอย่าง revenue journal entries ที่สร้าง
SELECT 
  rj.journal_date,
  rj.account_code,
  coa.account_name,
  rj.description,
  rj.amount,
  b.bill_number,
  u.unit_number
FROM revenue_journal rj
JOIN chart_of_accounts coa ON rj.account_code = coa.account_code
LEFT JOIN bills b ON rj.bill_id = b.id
LEFT JOIN units u ON rj.unit_id = u.id
WHERE rj.bill_id IS NOT NULL
ORDER BY rj.created_at DESC
LIMIT 20;

SELECT '✅ Backfill script completed!' as debug_info;
SELECT '⚠️  Please review the results above to ensure all bills have journal entries' as debug_info;

