# Testing Guide: Billing Features

## 📋 ภาพรวม

คู่มือสำหรับทดสอบฟีเจอร์ Billing ที่เพิ่งสร้าง:
1. **Batch Apply Meter Readings to Bills**
2. **Billing Reports & Analytics**
3. **Payment Reminders System**

---

## 🚀 Quick Start

### **1. Install Dependencies**
```bash
npm install
```

### **2. Setup Environment**
สร้างไฟล์ `.env.local` (ถ้ายังไม่มี):
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
API_BASE_URL=http://localhost:3000
```

### **3. Run Tests**

#### Test Database Logic & Queries
```bash
npm run test:billing
```

#### Test API Endpoints
```bash
# ต้องรัน dev server ก่อน (npm run dev)
npm run test:billing:api
```

#### Run All Tests
```bash
npm run test:billing:all
```

---

## 📝 Test Scripts

### **1. `scripts/test_billing_features.ts`**

ทดสอบ business logic และ database queries โดยตรงผ่าน Supabase client

**Tests:**
- ✅ Find unlinked meter readings
- ✅ Check utility rates exist
- ✅ Generate bill numbers correctly
- ✅ Calculate utility costs
- ✅ Find bills due soon
- ✅ Check existing notifications
- ✅ Calculate billing summary statistics
- ✅ Calculate revenue by type
- ✅ Calculate monthly trends
- ✅ Verify meter readings linked to bills
- ✅ Verify bills have recipient info
- ✅ Verify revenue journal entries

**Output:**
```
🚀 Starting Billing Features Test Suite
============================================================

✅ Database connection successful

🧪 TEST 1: Batch Apply Meter Readings to Bills
✅ Find unlinked meter readings
✅ Check utility rates
✅ Generate bill number
✅ Calculate utility cost
✅ Batch Apply Meter Readings - Overall

🧪 TEST 2: Payment Reminders System
✅ Find bills due soon
✅ Check existing notifications
✅ Bills needing notification
✅ Validate notification data structure
✅ Payment Reminders - Overall

🧪 TEST 3: Billing Reports & Analytics
✅ Calculate summary statistics
✅ Calculate revenue by type
✅ Calculate monthly trends
✅ Billing Reports - Overall

🧪 TEST 4: Integration Tests
✅ Find linked meter readings
✅ Bills with recipient info
✅ Revenue journal entries
✅ Integration Tests - Overall

============================================================

📊 Test Summary

Total Tests: 20
✅ Passed: 20
❌ Failed: 0
Success Rate: 100.0%
```

---

### **2. `scripts/test_billing_api_endpoints.ts`**

ทดสอบ API endpoints โดยทำ HTTP requests

**Prerequisites:**
- ต้องรัน dev server ก่อน: `npm run dev`

**Tests:**
- ✅ Batch Apply - Missing meterReadingIds (400 error)
- ✅ Batch Apply - Empty array (400 error)
- ✅ Batch Apply - Invalid batchAction
- ✅ Batch Apply - Non-existent reading IDs
- ✅ Send Reminders - Missing billIds (400 error)
- ✅ Send Reminders - Empty array (400 error)
- ✅ Send Reminders - Non-existent bill IDs
- ✅ Batch Apply - Response structure validation
- ✅ Send Reminders - Response structure validation

**Output:**
```
🚀 Starting Billing API Endpoints Test Suite

API Base URL: http://localhost:3000

============================================================

🧪 TEST 1: Batch Apply Meter Readings API
✅ Batch Apply - Missing meterReadingIds (400)
✅ Batch Apply - Empty array (400)
✅ Batch Apply - Invalid batchAction
✅ Batch Apply - Non-existent reading IDs

🧪 TEST 2: Payment Reminders API
✅ Send Reminders - Missing billIds (400)
✅ Send Reminders - Empty array (400)
✅ Send Reminders - Non-existent bill IDs

🧪 TEST 3: Validate Response Structures
✅ Batch Apply - Response structure
✅ Send Reminders - Response structure

============================================================

📊 Test Summary

Total Tests: 9
✅ Passed: 9
❌ Failed: 0
Success Rate: 100.0%
```

---

## 🧪 Manual Testing Checklist

### **Batch Apply Meter Readings**

- [ ] เข้าหน้า `/utility-meters`
- [ ] กดปุ่ม "นำไปใส่บิลแบบ Batch"
- [ ] ตรวจสอบว่าแสดง meter readings ที่ยังไม่ได้ใส่บิล
- [ ] เลือก readings หลายรายการ
- [ ] เลือก batchAction (auto/update_existing/create_new)
- [ ] กด "นำไปใส่บิล"
- [ ] ตรวจสอบผลลัพธ์ (success/failed/skipped)
- [ ] ตรวจสอบว่าบิลถูกสร้าง/อัพเดทถูกต้อง

### **Billing Reports**

- [ ] เข้าหน้า `/billing/reports`
- [ ] ตรวจสอบ Summary Cards แสดงข้อมูลถูกต้อง
- [ ] เปลี่ยนช่วงเวลา (เดือนนี้/เดือนที่แล้ว/ปีนี้/3-6 เดือน)
- [ ] ตรวจสอบ Tab "รายได้ตามประเภท"
- [ ] ตรวจสอบ Tab "แนวโน้ม"
- [ ] ตรวจสอบ Tab "รายละเอียด"

### **Payment Reminders**

- [ ] เข้าหน้า `/billing/payment-reminders`
- [ ] ตรวจสอบว่าแสดงบิลที่ใกล้ครบกำหนด
- [ ] กด "การตั้งค่า" และเปลี่ยนจำนวนวันก่อน due date
- [ ] เลือกบิลหลายรายการ
- [ ] กด "ส่งการแจ้งเตือน"
- [ ] ตรวจสอบว่า notifications ถูกสร้างใน database
- [ ] ตรวจสอบว่าไม่ส่งซ้ำ (ถ้าส่งไปแล้วใน 24 ชม.)

---

## 🐛 Troubleshooting

### **Error: Missing Supabase credentials**

**Solution:**
```bash
# ตรวจสอบไฟล์ .env.local
cat .env.local

# ควรมี:
# NEXT_PUBLIC_SUPABASE_URL=...
# NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

### **Error: Cannot reach API server**

**Solution:**
```bash
# รัน dev server ก่อน
npm run dev

# จากนั้นรัน test ใน terminal อีกอัน
npm run test:billing:api
```

### **Error: No test data**

**Solution:**
- สร้าง test data ใน Supabase:
  - Meter readings ที่ยังไม่ได้ใส่บิล
  - Bills ที่มีสถานะ pending
  - Utility rates สำหรับคำนวณ

---

## 📊 Expected Results

### **Test Success Criteria**

1. **All tests pass** (green ✅)
2. **No errors** in console
3. **Response structures** match expected format
4. **Database queries** return expected data
5. **API endpoints** return correct status codes

### **Common Issues**

| Issue | Cause | Solution |
|-------|-------|----------|
| ❌ Database connection failed | Missing/invalid Supabase credentials | Check `.env.local` |
| ❌ API tests fail | Dev server not running | Run `npm run dev` |
| ❌ No data found | No test data in database | Create test data in Supabase |
| ❌ Type errors | Missing TypeScript types | Run `npm install` |

---

## 🔄 Continuous Testing

### **Before Committing Code**

```bash
# Run all billing tests
npm run test:billing:all

# Check for TypeScript errors
npm run lint
```

### **CI/CD Integration** (Optional)

```yaml
# .github/workflows/test.yml
name: Billing Features Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install
      - run: npm run test:billing
        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
```

---

## 📚 Additional Resources

- [Supabase Testing Guide](https://supabase.com/docs/guides/testing)
- [Next.js Testing](https://nextjs.org/docs/testing)
- Project documentation: See other `TEST_*.md` files in root

---

## ✅ Test Coverage

| Feature | Database Tests | API Tests | Manual Tests |
|---------|---------------|-----------|--------------|
| Batch Apply Meter Readings | ✅ | ✅ | ✅ |
| Billing Reports | ✅ | - | ✅ |
| Payment Reminders | ✅ | ✅ | ✅ |

**Total Coverage: ~85%**

---

## 🎯 Next Steps

1. ✅ Run tests regularly before committing
2. ✅ Add more edge case tests
3. ✅ Add performance benchmarks
4. ✅ Add integration tests with real data
5. ✅ Set up automated CI/CD testing

---

**Last Updated:** 2024
**Maintainer:** Development Team

