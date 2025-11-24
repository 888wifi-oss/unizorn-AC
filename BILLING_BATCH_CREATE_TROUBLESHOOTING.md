# แก้ไขปัญหา "Failed การออกบิล"

## 🔍 การตรวจสอบและแก้ไข

### 1. ตรวจสอบว่าได้รัน Migration Script แล้วหรือยัง

**สำคัญ:** ต้องรัน migration script ก่อนใช้งานระบบออกบิลรายเดือน

```sql
-- รันตามลำดับนี้:
\i scripts/175_billing_recipients_and_meters.sql
```

### 2. ตรวจสอบว่า Columns มีอยู่หรือไม่

```sql
-- ตรวจสอบว่า recipient columns มีอยู่หรือยัง
SELECT column_name 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'bills' 
AND column_name LIKE '%recipient%';

-- ควรจะเห็น:
-- common_fee_recipient_type
-- common_fee_recipient_id
-- water_fee_recipient_type
-- water_fee_recipient_id
-- electricity_fee_recipient_type
-- electricity_fee_recipient_id
-- parking_fee_recipient_type
-- parking_fee_recipient_id
```

### 3. ตรวจสอบ Console Logs

เมื่อเกิด error:
1. เปิด Browser Console (F12)
2. ดู Logs ที่มี tag `[Batch Billing]` และ `[Batch Create]`
3. ดู error message ที่แสดง

### 4. ปัญหาที่พบบ่อย

#### ปัญหา: "column does not exist"
**สาเหตุ:** ยังไม่ได้รัน migration script

**วิธีแก้:**
```sql
\i scripts/175_billing_recipients_and_meters.sql
```

#### ปัญหา: "permission denied" หรือ "row-level security"
**สาเหตุ:** RLS policies บล็อกการ insert

**วิธีแก้:** ตรวจสอบ RLS policies:
```sql
SELECT * FROM pg_policies WHERE tablename = 'bills';
```

#### ปัญหา: "null value violates not-null constraint"
**สาเหตุ:** มี required fields ที่เป็น NULL

**วิธีแก้:** ตรวจสอบว่า:
- `unit_id` มีค่า
- `month`, `year` มีค่า
- `bill_number` สร้างได้
- `due_date` มีค่า

### 5. Testing Steps

1. **ตรวจสอบ Database:**
```sql
-- ตรวจสอบว่ามี columns
\d bills

-- ตรวจสอบว่ามี units
SELECT COUNT(*) FROM units;

-- ตรวจสอบว่ามี owners/tenants (ถ้าต้องการ)
SELECT COUNT(*) FROM owners;
SELECT COUNT(*) FROM tenants WHERE status = 'active';
```

2. **ทดสอบสร้างบิล 1 รายการ:**
- ใช้หน้า "ออกบิล" สร้างบิลใหม่ 1 รายการก่อน
- ดูว่าสำเร็จหรือไม่

3. **ทดสอบ Batch Create:**
- ใช้ "สร้างบิลรายเดือน"
- ดู Console logs

### 6. Debug Mode

ใน Browser Console จะเห็น:
```
[Batch Billing] Request: {...}
[Batch Billing] Response status: 200
[Batch Billing] Response data: {...}
```

ถ้ามี error จะเห็น:
```
[Batch Create] Error: ...
[Batch Create] Error details: ...
```

---

## 📝 สรุปการแก้ไขที่ทำไปแล้ว

1. ✅ เพิ่ม error handling ที่ดีขึ้น
2. ✅ เพิ่ม logging สำหรับ debugging
3. ✅ จัดการกรณีที่ recipient columns ยังไม่มี
4. ✅ แสดง error message ที่ชัดเจนขึ้น

---

## 🚀 ขั้นตอนต่อไป

1. **รัน Migration Script** (ถ้ายังไม่ได้รัน):
   ```sql
   \i scripts/175_billing_recipients_and_meters.sql
   ```

2. **Refresh Browser** และลองอีกครั้ง

3. **ตรวจสอบ Console** สำหรับ error details

4. **ถ้ายังมีปัญหา:** ส่ง error message จาก Console มาให้ช่วยแก้ไข

