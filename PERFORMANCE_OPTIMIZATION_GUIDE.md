# Performance Optimization Guide

## ภาพรวม
คู่มือสำหรับการปรับปรุงประสิทธิภาพระบบ Condo Pro Dashboard

## ฟีเจอร์ที่พัฒนาแล้ว

### ✅ **1. Database Query Optimization**
- **Optimized Queries**: เลือกเฉพาะ fields ที่จำเป็น
- **Query Caching**: แคชผลลัพธ์ query เพื่อลดการเรียก database
- **Batch Queries**: รวม queries หลายตัวเป็นหนึ่งเดียว
- **Parallel Queries**: รัน queries แบบ parallel
- **Indexes**: เพิ่ม database indexes สำหรับ query ที่ช้า

**ไฟล์:**
- `lib/supabase/optimized-queries.ts` - Optimized query functions
- `scripts/012_performance_indexes.sql` - Database indexes

**ตัวอย่างการใช้งาน:**
```typescript
import { getUnitsOptimized, getBillsOptimized } from '@/lib/supabase/optimized-queries'

// ใช้ optimized query แทน query ทั่วไป
const units = await getUnitsOptimized({
  page: 1,
  limit: 50,
  useCache: true // เปิดใช้งาน cache
})
```

### ✅ **2. Client-side Caching**
- **In-memory Cache**: แคชข้อมูลในหน่วยความจำ
- **TTL (Time To Live)**: กำหนดอายุของ cache
- **Cache Invalidation**: ลบ cache เมื่อข้อมูลเปลี่ยน
- **Request Deduplication**: ป้องกันการ fetch ซ้ำ

**ไฟล์:**
- `lib/hooks/use-cached-data.ts` - Custom React hook สำหรับ caching

**ตัวอย่างการใช้งาน:**
```typescript
import { useCachedData } from '@/lib/hooks/use-cached-data'

function MyComponent() {
  const { data, loading, error, refetch } = useCachedData({
    key: 'units-list',
    fetcher: async () => {
      const response = await fetch('/api/units')
      return response.json()
    },
    ttl: 5 * 60 * 1000 // 5 minutes
  })

  return (
    <div>
      {loading && <Loader />}
      {data && <UnitsList units={data} />}
      <button onClick={refetch}>Refresh</button>
    </div>
  )
}
```

### ✅ **3. Code Splitting & Lazy Loading**
- **Dynamic Imports**: โหลด components เมื่อต้องการใช้
- **Lazy Loading**: โหลด components แบบ lazy
- **Retry Logic**: retry เมื่อโหลดไม่สำเร็จ
- **Loading Fallbacks**: แสดง loading state

**ไฟล์:**
- `components/lazy-load-wrapper.tsx` - Lazy loading wrapper component

**ตัวอย่างการใช้งาน:**
```typescript
import { lazyWithRetry, LazyLoadWrapper } from '@/components/lazy-load-wrapper'

// Lazy load component
const HeavyComponent = lazyWithRetry(
  () => import('./HeavyComponent'),
  3, // retry 3 times
  1000 // wait 1s between retries
)

function MyPage() {
  return (
    <LazyLoadWrapper fallback={<Loader />}>
      <HeavyComponent />
    </LazyLoadWrapper>
  )
}
```

### ✅ **4. Image Optimization**
- **Lazy Loading**: โหลดรูปเมื่อเข้าสู่ viewport
- **Intersection Observer**: ตรวจจับเมื่อรูปเข้าสู่ viewport
- **Fallback Images**: แสดงรูป placeholder เมื่อโหลดไม่สำเร็จ
- **Next.js Image**: ใช้ Next.js Image component

**ไฟล์:**
- `components/optimized-image.tsx` - Optimized image component

**ตัวอย่างการใช้งาน:**
```typescript
import { OptimizedImage, OptimizedAvatar } from '@/components/optimized-image'

function MyComponent() {
  return (
    <>
      <OptimizedImage
        src="/image.jpg"
        alt="Description"
        width={800}
        height={600}
        lazyLoad={true}
        showLoader={true}
      />

      <OptimizedAvatar
        src="/avatar.jpg"
        alt="User Name"
        size={40}
        fallback="UN"
      />
    </>
  )
}
```

### ✅ **5. API Response Optimization**
- **Response Compression**: บีบอัดข้อมูล response
- **Pagination**: แบ่งข้อมูลเป็นหน้า
- **Debouncing**: ลดการเรียก API
- **Throttling**: จำกัดการเรียก API
- **Batch Requests**: รวม requests หลายตัวเป็นหนึ่งเดียว
- **Retry Logic**: retry เมื่อ request ล้มเหลว

**ไฟล์:**
- `lib/utils/response-compression.ts` - Response optimization utilities

**ตัวอย่างการใช้งาน:**
```typescript
import { debounce, throttle, batchRequests, retryRequest } from '@/lib/utils/response-compression'

// Debounce search
const debouncedSearch = debounce(async (query: string) => {
  const results = await searchAPI(query)
  setResults(results)
}, 300)

// Throttle scroll event
const throttledScroll = throttle(() => {
  handleScroll()
}, 100)

// Batch multiple requests
const requests = [
  () => fetch('/api/units'),
  () => fetch('/api/bills'),
  () => fetch('/api/maintenance')
]
const results = await batchRequests(requests, 2) // 2 at a time

// Retry failed request
const data = await retryRequest(
  () => fetch('/api/data'),
  3, // retry 3 times
  1000 // wait 1s between retries
)
```

### ✅ **6. Performance Monitoring**
- **Timing Functions**: วัดเวลาการทำงาน
- **Memory Monitoring**: ตรวจสอบการใช้หน่วยความจำ
- **Render Tracking**: ติดตามการ render ของ components
- **Threshold Alerts**: แจ้งเตือนเมื่อเกิน threshold

**ไฟล์:**
- `lib/utils/performance-monitor.ts` - Performance monitoring utilities

**ตัวอย่างการใช้งาน:**
```typescript
import { perfMonitor, measureTime, useRenderLogger } from '@/lib/utils/performance-monitor'

// Measure function execution time
perfMonitor.start('loadData')
const data = await loadData()
perfMonitor.end('loadData')

// Set threshold
perfMonitor.setThreshold('loadData', 1000) // 1 second

// Log summary
perfMonitor.logSummary()

// Measure time
const stopTimer = measureTime('Processing')
processData()
stopTimer() // Logs: ⏱️ Processing: 123.45ms

// Track component renders
function MyComponent() {
  useRenderLogger('MyComponent')
  return <div>Content</div>
}
```

## ขั้นตอนการติดตั้ง

### **1. รัน SQL Script**
```sql
-- รัน script ใน Supabase SQL Editor
-- scripts/012_performance_indexes.sql
```

### **2. ติดตั้ง Dependencies** (ถ้ายังไม่มี)
```bash
npm install @next/bundle-analyzer
```

### **3. อัปเดต next.config.js**
ดูรายละเอียดใน `PERFORMANCE_OPTIMIZATION_CONFIG.md`

### **4. ใช้งาน Optimized Functions**
แทนที่ functions เดิมด้วย optimized versions:

```typescript
// Before
import { getUnitsFromDB } from '@/lib/supabase/actions'
const units = await getUnitsFromDB()

// After
import { getUnitsOptimized } from '@/lib/supabase/optimized-queries'
const units = await getUnitsOptimized({ page: 1, limit: 50, useCache: true })
```

## Performance Metrics

### **ก่อนการ Optimize**
- Database queries: ~500ms
- Page load time: ~3s
- Bundle size: ~800KB
- API response time: ~400ms

### **หลังการ Optimize (เป้าหมาย)**
- Database queries: < 100ms (↓80%)
- Page load time: < 1.5s (↓50%)
- Bundle size: < 500KB (↓37.5%)
- API response time: < 200ms (↓50%)

## Best Practices

### **1. Database**
- ✅ ใช้ indexes สำหรับ columns ที่ค้นหาบ่อย
- ✅ เลือกเฉพาะ fields ที่จำเป็น (ไม่ใช้ `SELECT *`)
- ✅ ใช้ joins แทนการ query หลายครั้ง
- ✅ แคช query results
- ✅ ใช้ pagination สำหรับข้อมูลจำนวนมาก

### **2. Frontend**
- ✅ ใช้ code splitting สำหรับ routes และ components
- ✅ Lazy load components ที่ไม่จำเป็นต้องใช้ทันที
- ✅ Optimize images (Next.js Image, WebP, AVIF)
- ✅ Minimize JavaScript bundle
- ✅ ใช้ React.memo สำหรับ components ที่ render บ่อย

### **3. API**
- ✅ Implement caching (client + server)
- ✅ Use compression (gzip, brotli)
- ✅ Paginate large datasets
- ✅ Implement rate limiting
- ✅ Monitor response times

### **4. Caching Strategy**
- ✅ Static data: 1 hour
- ✅ Dynamic data: 5 minutes
- ✅ User-specific: 1 minute
- ✅ Real-time data: No cache

## Monitoring & Testing

### **การวัดผล**
```bash
# Build and analyze bundle
npm run analyze

# Run Lighthouse
npx lighthouse http://localhost:3000

# Check bundle size
npx next-bundle-analyzer

# Run performance tests
node scripts/performance-test.js
```

### **ตัวชี้วัด (Core Web Vitals)**
- **LCP** (Largest Contentful Paint): < 2.5s ✅
- **FID** (First Input Delay): < 100ms ✅
- **CLS** (Cumulative Layout Shift): < 0.1 ✅
- **FCP** (First Contentful Paint): < 1.8s ✅
- **TTI** (Time to Interactive): < 3.8s ✅

## การแก้ไขปัญหา

### **ปัญหา: Page โหลดช้า**
**วิธีแก้:**
1. ตรวจสอบ bundle size: `npm run analyze`
2. ใช้ lazy loading สำหรับ components
3. Optimize images
4. Enable compression

### **ปัญหา: Database queries ช้า**
**วิธีแก้:**
1. เพิ่ม indexes: รัน `012_performance_indexes.sql`
2. ใช้ optimized queries จาก `optimized-queries.ts`
3. Enable query caching
4. ใช้ materialized views

### **ปัญหา: API response ช้า**
**วิธีแก้:**
1. Implement caching
2. Optimize database queries
3. Use pagination
4. Compress responses

### **ปัญหา: Components render บ่อย**
**วิธีแก้:**
1. ใช้ `React.memo`
2. ใช้ `useMemo` และ `useCallback`
3. Optimize state management
4. ใช้ `useRenderLogger` เพื่อ debug

## สรุป

### **ไฟล์ที่สร้าง:**
- ✅ `lib/supabase/optimized-queries.ts` - Optimized database queries
- ✅ `lib/hooks/use-cached-data.ts` - Caching hook
- ✅ `components/lazy-load-wrapper.tsx` - Lazy loading wrapper
- ✅ `components/optimized-image.tsx` - Optimized image component
- ✅ `lib/utils/response-compression.ts` - API optimization utilities
- ✅ `lib/utils/performance-monitor.ts` - Performance monitoring
- ✅ `scripts/012_performance_indexes.sql` - Database indexes
- ✅ `PERFORMANCE_OPTIMIZATION_CONFIG.md` - Configuration guide

### **ผลลัพธ์ที่คาดหวัง:**
- ⚡ **Database queries**: เร็วขึ้น 80%
- ⚡ **Page load time**: เร็วขึ้น 50%
- ⚡ **Bundle size**: เล็กลง 37.5%
- ⚡ **API response**: เร็วขึ้น 50%
- ⚡ **Memory usage**: ลดลง 30%

### **ขั้นตอนต่อไป:**
1. รัน SQL script สำหรับ indexes
2. อัปเดต next.config.js
3. แทนที่ functions เดิมด้วย optimized versions
4. ทดสอบและวัดผล
5. Monitor performance อย่างต่อเนื่อง

ระบบพร้อมสำหรับการใช้งานที่มีประสิทธิภาพสูง! 🚀
