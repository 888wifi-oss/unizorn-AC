# 🛡️ คู่มือป้องกันปัญหาประสิทธิภาพ (Performance Protection Guide)

## 📋 สารบัญ
1. [Database Optimization](#database-optimization)
2. [Query Optimization](#query-optimization)
3. [Error Handling](#error-handling)
4. [Monitoring & Debugging](#monitoring--debugging)

---

## 1️⃣ Database Optimization

### ✅ สิ่งที่ควรทำ (Best Practices)

#### 1. สร้าง Indexes ให้ครบ
```sql
-- ตัวอย่าง: เพิ่ม index สำหรับการ query ที่ใช้บ่อย
CREATE INDEX IF NOT EXISTS idx_table_name_column_name ON public.table_name(column_name);

-- Composite index สำหรับ query ที่ซับซ้อน
CREATE INDEX IF NOT EXISTS idx_table_name_multi_column 
ON public.table_name(column1, column2);
```

#### 2. ใช้ Indexes แบบ Conditional
```sql
-- สำหรับ columns ที่มีค่า NULL มาก
CREATE INDEX IF NOT EXISTS idx_table_name_column 
ON public.table_name(column_name) WHERE column_name IS NOT NULL;
```

#### 3. วิเคราะห์และ Update Statistics
```sql
-- Run เพื่อให้ PostgreSQL รู้ข้อมูลใหม่
ANALYZE public.table_name;
```

### ❌ สิ่งที่ควรหลีกเลี่ยง

- ❌ ดึง `*` ทุกครั้ง (ดึงเฉพาะ fields ที่จำเป็น)
- ❌ Join หลายตารางพร้อมกัน (ใช้แยก queries)
- ❌ Query ใน loop (ใช้ batch query)
- ❌ ไม่มี indexes สำหรับ columns ที่ query บ่อย

---

## 2️⃣ Query Optimization

### ✅ Best Practices

#### 1. จำกัดจำนวนข้อมูล
```typescript
// ✅ ดี
.select('id, title, status')
.limit(50)

// ❌ ไม่ดี
.select('*')
```

#### 2. ใช้ Batch Queries
```typescript
// ✅ ดึง fields ที่จำเป็นเท่านั้น
const { data } = await supabase
  .from('table')
  .select('id, title, status, created_at')
  .eq('unit_id', unitId)
  .order('created_at', { ascending: false })
  .limit(100);
```

#### 3. แยก Critical vs Non-Critical Data
```typescript
// Critical data - ต้องแสดงเสมอ
const [billsRes, paymentsRes] = await Promise.all([
  supabase.from('bills').select('*').eq('unit_id', unitId),
  supabase.from('payments').select('*').eq('unit_id', unitId).limit(10)
]);

// Non-critical - timeout ได้
try {
  const announcements = await fetchAnnouncements();
} catch (error) {
  console.warn('Announcements timeout, continuing...');
  // Return empty array
}
```

#### 4. ใช้ Timeout Handling
```typescript
export async function getData() {
  try {
    const { data, error } = await supabase
      .from('table')
      .select('fields')
      .limit(100);
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Query timeout:', error);
    return []; // Return empty array instead of crashing
  }
}
```

---

## 3️⃣ Error Handling

### ✅ หลักการสำคัญ

#### 1. Graceful Degradation
```typescript
// ไม่ throw error ที่ทำให้ page crash
if (announcementsRes.error) {
  console.warn('Announcements failed:', error);
  announcementsRes.data = []; // Return empty array
}
```

#### 2. Timeout Prevention
```typescript
// จัดการ timeout ด้วย try-catch
try {
  const result = await slowQuery();
} catch (error) {
  if (error.code === '57014') {
    // Statement timeout - return empty data
    return [];
  }
  throw error;
}
```

#### 3. Error Logging
```typescript
// Log ผิดพลาดแต่ไม่ทำให้ app crash
try {
  await riskyOperation();
} catch (error) {
  console.error('[ComponentName] Error:', error);
  // Continue execution
}
```

---

## 4️⃣ Monitoring & Debugging

### ✅ Checklist สำหรับตรวจสอบ

#### 1. ✅ Database Indexes
- [ ] ทุก foreign key มี index
- [ ] Columns ที่ใช้ query บ่อยมี index
- [ ] Composite indexes สำหรับ complex queries
- [ ] Run `ANALYZE` หลังเพิ่มข้อมูลใหม่

#### 2. ✅ Query Performance
- [ ] ไม่ใช้ `*` ดึงทุก field
- [ ] ใช้ `.limit()` สำหรับ large tables
- [ ] แยก queries ที่ช้าออก
- [ ] ใช้ batch queries แทน loop

#### 3. ✅ Error Handling
- [ ] Timeout queries มี try-catch
- [ ] Non-critical data สามารถ fail ได้
- [ ] UI ไม่ crash จาก query errors
- [ ] Log errors เพื่อ debugging

### 📊 Performance Monitoring

#### Console Logs ที่ควรมี
```typescript
console.log('[FunctionName] Fetching data...');
console.log('[FunctionName] Fetched', data?.length || 0, 'items');
console.error('[FunctionName] Error:', error);
console.warn('[FunctionName] Timeout, continuing...');
```

---

## 🎯 Action Plan

### สำหรับ Developer

1. **ก่อน Deploy**
   - ตรวจสอบ indexes ทั้งหมด
   - รัน SQL scripts ใหม่ใน Supabase
   - ทดสอบ Performance

2. **เมื่อเจอ Timeout**
   - ตรวจสอบ query ที่ช้า
   - เพิ่ม index ถ้าจำเป็น
   - จำกัดจำนวนข้อมูลที่ดึง
   - แยก critical vs non-critical

3. **Monitoring**
   - ดู Console logs
   - ตรวจสอบ Network tab
   - ใช้ Supabase Dashboard เพื่อดู query performance

### สำหรับ Admin

1. **รัน SQL Scripts**
   - ค้นหา scripts ใน `scripts/` folder
   - Copy content และรันใน Supabase SQL Editor
   - ตรวจสอบว่า indexes ถูกสร้างสำเร็จ

2. **Performance Monitoring**
   - ดู logs ใน Supabase Dashboard
   - ตรวจสอบ query time
   - ถ้ามี timeout ให้แจ้ง developer

---

## 📝 สรุป

### ✅ สิ่งที่ทำให้ระบบเสถียร
1. ✅ Indexes ครบถ้วน
2. ✅ จำกัดจำนวนข้อมูลที่ดึง
3. Error handling ที่ดี
4. Monitoring logs

### ❌ สิ่งที่จะทำให้เกิดปัญหา
1. ❌ Query ใหญ่เกินไป
2. ❌ ไม่มี indexes
3. ❌ Throw error ที่ทำให้ crash
4. ❌ ไม่มี timeout handling

---

**🎯 Goal: ระบบควรทำงานได้เสมอ แม้บางส่วนมีปัญหา**

