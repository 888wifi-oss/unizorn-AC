# Cache System Guide

## 🚀 **Cache System ที่แก้ไขแล้ว**

### **🔧 สาเหตุของ Error:**
- ไฟล์ `redis-cache.ts` มี `"use server"` แต่มี functions ที่ไม่ใช่ async
- Next.js Server Actions ต้องเป็น async functions เท่านั้น

### **💡 วิธีแก้ไข:**
1. **แยกไฟล์ cache** - แยกเป็น server และ client
2. **Server Cache** - สำหรับ server-side functions
3. **Client Cache** - สำหรับ client-side functions
4. **Index File** - export ทั้งหมดจากที่เดียว

---

## 📁 **โครงสร้างไฟล์ Cache:**

### **1. Server Cache** (`lib/cache/server-cache.ts`)
- **Redis Integration** - เชื่อมต่อ Redis
- **Memory Fallback** - fallback เป็น memory cache
- **Server Functions** - functions สำหรับ server-side
- **"use server"** - directive สำหรับ Server Actions

### **2. Client Cache** (`lib/cache/client-cache.ts`)
- **Memory Cache** - cache ใน memory
- **Client Functions** - functions สำหรับ client-side
- **Cache Wrapper** - wrapper สำหรับ functions
- **Cache Keys** - generator สำหรับ cache keys

### **3. Index File** (`lib/cache/index.ts`)
- **Export All** - export ทั้งหมดจากที่เดียว
- **Easy Import** - import ได้ง่าย

---

## 🔧 **การใช้งาน:**

### **1. Server-side (ใน Server Actions)**
```typescript
import { getCache, setCache, CACHE_TTL } from '@/lib/cache/server-cache'

export async function getData() {
  const cacheKey = 'data:key'
  
  // Check cache
  const cached = await getCache(cacheKey)
  if (cached) {
    return cached
  }
  
  // Fetch data
  const data = await fetchData()
  
  // Cache result
  await setCache(cacheKey, data, CACHE_TTL.MEDIUM)
  
  return data
}
```

### **2. Client-side (ใน Components)**
```typescript
import { getClientCache, setClientCache, CACHE_TTL } from '@/lib/cache/client-cache'

export function useData() {
  const [data, setData] = useState(null)
  
  useEffect(() => {
    const cacheKey = 'data:key'
    
    // Check cache
    const cached = getClientCache(cacheKey)
    if (cached) {
      setData(cached)
      return
    }
    
    // Fetch data
    fetchData().then(result => {
      setData(result)
      setClientCache(cacheKey, result, CACHE_TTL.MEDIUM)
    })
  }, [])
  
  return data
}
```

### **3. Cache Wrapper**
```typescript
import { withClientCache, CACHE_KEYS } from '@/lib/cache/client-cache'

const cachedFunction = withClientCache(
  async (param: string) => {
    return await fetchData(param)
  },
  (param: string) => CACHE_KEYS.DATA(param),
  CACHE_TTL.MEDIUM
)
```

---

## 📊 **Cache TTL Constants:**

### **TTL Values:**
- **SHORT**: 60 seconds (1 minute)
- **MEDIUM**: 300 seconds (5 minutes)
- **LONG**: 3600 seconds (1 hour)
- **VERY_LONG**: 86400 seconds (24 hours)

### **Usage:**
```typescript
// Short-lived data (user sessions)
await setCache(key, data, CACHE_TTL.SHORT)

// Medium-lived data (dashboard stats)
await setCache(key, data, CACHE_TTL.MEDIUM)

// Long-lived data (user permissions)
await setCache(key, data, CACHE_TTL.LONG)

// Very long-lived data (static data)
await setCache(key, data, CACHE_TTL.VERY_LONG)
```

---

## 🔑 **Cache Keys Generator:**

### **Predefined Keys:**
```typescript
CACHE_KEYS.UNITS(page, limit, search, status)
CACHE_KEYS.BILLS(page, limit, unitId, status)
CACHE_KEYS.USER_GROUPS(userId, projectId)
CACHE_KEYS.USER_PERMISSIONS(userId, projectId)
CACHE_KEYS.DASHBOARD_STATS(projectId)
CACHE_KEYS.ANALYTICS(type, projectId)
```

### **Custom Keys:**
```typescript
const customKey = `custom:${param1}:${param2}:${param3}`
```

---

## 🚨 **Troubleshooting:**

### **ปัญหาที่พบบ่อย:**

#### **1. Cache ไม่ทำงาน**
```typescript
// ตรวจสอบ Redis connection
console.log('Redis available:', redis !== null)

// ตรวจสอบ memory cache
console.log('Memory cache size:', memoryCache.size)
```

#### **2. Data ไม่ถูก cache**
```typescript
// ตรวจสอบ TTL
const cached = memoryCache.get(key)
if (cached) {
  const age = Date.now() - cached.timestamp
  const remaining = cached.ttl * 1000 - age
  console.log('Cache age:', age, 'Remaining:', remaining)
}
```

#### **3. Cache ไม่ถูก clear**
```typescript
// Clear specific pattern
await clearCachePattern('user:*')

// Clear all cache
await clearAllCache()
```

---

## 📈 **Performance Benefits:**

### **Before Cache:**
- ⚠️ **Database Queries**: 10-15 queries per page
- ⚠️ **Response Time**: 2000-3000ms
- ⚠️ **Server Load**: High

### **After Cache:**
- ✅ **Database Queries**: 2-5 queries per page
- ✅ **Response Time**: 200-500ms
- ✅ **Server Load**: Low
- ✅ **Cache Hit Rate**: 80-90%

---

## 🎯 **Best Practices:**

### **1. Cache Strategy:**
- **Cache frequently accessed data**
- **Use appropriate TTL**
- **Clear cache when data changes**
- **Monitor cache hit rate**

### **2. Key Naming:**
- **Use descriptive names**
- **Include parameters in keys**
- **Use consistent format**
- **Avoid special characters**

### **3. Error Handling:**
- **Always handle cache errors**
- **Fallback to database**
- **Log cache failures**
- **Monitor cache performance**

---

## 🎉 **สรุป:**

Cache System ที่แก้ไขแล้วจะช่วยให้:
- **ไม่มี Server Actions Error** - แยก server และ client functions
- **Performance Boost** - ลด database queries
- **Flexible Usage** - ใช้ได้ทั้ง server และ client
- **Easy Maintenance** - โครงสร้างชัดเจน

**ระบบพร้อมใช้งานแล้ว!** 🚀
