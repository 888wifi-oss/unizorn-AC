# API Update: เพิ่ม Maintenance และ Parcels Endpoints

## สรุปการอัปเดต

เพิ่ม API endpoints สำหรับ **Maintenance (งานแจ้งซ่อม)** และ **Parcels (พัสดุ)** เข้าสู่ระบบ API แล้ว

## API Endpoints ใหม่

### 🔧 **Maintenance API**

#### **GET /api/v1/maintenance**
ดึงรายการงานแจ้งซ่อมทั้งหมด

**Query Parameters:**
- `page` - หน้าที่ต้องการ
- `limit` - จำนวนรายการต่อหน้า
- `unit_id` - กรองตามห้องชุด
- `status` - สถานะงาน (pending, in_progress, completed, cancelled)
- `category` - หมวดหมู่งาน (plumbing, electrical, air_conditioning, etc.)
- `priority` - ความสำคัญ (low, medium, high, urgent)
- `search` - ค้นหาตามชื่อหรือคำอธิบาย

**Example Request:**
```bash
curl -X GET "https://your-domain.com/api/v1/maintenance?status=pending&priority=high" \
  -H "X-API-Key: sk_your_api_key_here"
```

#### **POST /api/v1/maintenance**
สร้างงานแจ้งซ่อมใหม่

**Required Fields:** `unit_id`, `title`, `description`, `category`

**Example Request:**
```bash
curl -X POST "https://your-domain.com/api/v1/maintenance" \
  -H "X-API-Key: sk_your_api_key_here" \
  -H "Content-Type: application/json" \
  -d '{
    "unit_id": "uuid",
    "title": "แอร์เสีย",
    "description": "แอร์ในห้องนอนไม่เย็น",
    "category": "air_conditioning",
    "priority": "high"
  }'
```

#### **GET /api/v1/maintenance/{id}**
ดึงข้อมูลงานแจ้งซ่อมตาม ID

#### **PUT /api/v1/maintenance/{id}**
อัปเดตงานแจ้งซ่อม

**Example Request (Update Status):**
```bash
curl -X PUT "https://your-domain.com/api/v1/maintenance/{id}" \
  -H "X-API-Key: sk_your_api_key_here" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "completed",
    "technician_notes": "แก้ไขเรียบร้อยแล้ว",
    "cost": 1500
  }'
```

#### **DELETE /api/v1/maintenance/{id}**
ลบงานแจ้งซ่อม

---

### 📦 **Parcels API**

#### **GET /api/v1/parcels**
ดึงรายการพัสดุทั้งหมด

**Query Parameters:**
- `page` - หน้าที่ต้องการ
- `limit` - จำนวนรายการต่อหน้า
- `unit_number` - กรองตามเลขห้อง
- `status` - สถานะพัสดุ (pending, picked_up)
- `courier` - ชื่อขนส่ง
- `search` - ค้นหาตามชื่อผู้รับหรือเลขพัสดุ

**Example Request:**
```bash
curl -X GET "https://your-domain.com/api/v1/parcels?unit_number=101&status=pending" \
  -H "X-API-Key: sk_your_api_key_here"
```

#### **POST /api/v1/parcels**
ลงทะเบียนพัสดุใหม่

**Required Fields:** `unit_number`, `recipient_name`, `courier`

**Example Request:**
```bash
curl -X POST "https://your-domain.com/api/v1/parcels" \
  -H "X-API-Key: sk_your_api_key_here" \
  -H "Content-Type: application/json" \
  -d '{
    "unit_number": "101",
    "recipient_name": "John Doe",
    "courier": "Kerry Express",
    "tracking_number": "TH1234567890",
    "size": "medium"
  }'
```

#### **GET /api/v1/parcels/{id}**
ดึงข้อมูลพัสดุตาม ID

#### **PUT /api/v1/parcels/{id}**
อัปเดตพัสดุ (เช่น มอบพัสดุ)

**Example Request (Mark as Picked Up):**
```bash
curl -X PUT "https://your-domain.com/api/v1/parcels/{id}" \
  -H "X-API-Key: sk_your_api_key_here" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "picked_up",
    "picked_up_by": "John Doe",
    "picked_up_method": "qr_code",
    "staff_delivered_by": "Security Guard"
  }'
```

#### **DELETE /api/v1/parcels/{id}**
ลบพัสดุ

---

## Permissions ใหม่

เพิ่ม permissions สำหรับ Maintenance และ Parcels:

### **Maintenance Permissions**
- `maintenance:read` - อ่านข้อมูลงานแจ้งซ่อม
- `maintenance:write` - เขียนข้อมูลงานแจ้งซ่อม
- `maintenance:delete` - ลบข้อมูลงานแจ้งซ่อม

### **Parcels Permissions**
- `parcels:read` - อ่านข้อมูลพัสดุ
- `parcels:write` - เขียนข้อมูลพัสดุ
- `parcels:delete` - ลบข้อมูลพัสดุ

## ไฟล์ที่สร้าง/อัปเดต

### **ไฟล์ใหม่:**
- `app/api/v1/maintenance/route.ts` - Maintenance API endpoints
- `app/api/v1/maintenance/[id]/route.ts` - Maintenance by ID endpoints
- `app/api/v1/parcels/route.ts` - Parcels API endpoints
- `app/api/v1/parcels/[id]/route.ts` - Parcels by ID endpoints

### **ไฟล์ที่อัปเดต:**
- `scripts/011_create_api_keys_table.sql` - เพิ่ม permissions ใหม่
- `API_DOCUMENTATION.md` - เพิ่มเอกสาร API
- `app/(admin)/api-management/page.tsx` - เพิ่ม permissions ในหน้า UI

## Test API Keys (Updated)

### **Test Key**
```
sk_test_1234567890abcdef1234567890abcdef
```

**Permissions:**
- `units:read`, `units:write`
- `bills:read`, `bills:write`
- `files:read`, `files:write`
- `maintenance:read`, `maintenance:write`
- `parcels:read`, `parcels:write`

### **Admin Key**
```
sk_admin_abcdef1234567890abcdef1234567890
```

**Permissions:** All permissions including `admin`, `maintenance:delete`, `parcels:delete`

## การทดสอบ

### **1. ทดสอบ Maintenance API**

```javascript
// Get all maintenance requests
const response = await fetch('/api/v1/maintenance?status=pending', {
  headers: {
    'X-API-Key': 'sk_test_1234567890abcdef1234567890abcdef'
  }
});

// Create maintenance request
const createResponse = await fetch('/api/v1/maintenance', {
  method: 'POST',
  headers: {
    'X-API-Key': 'sk_test_1234567890abcdef1234567890abcdef',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    unit_id: 'uuid',
    title: 'แอร์เสีย',
    description: 'แอร์ในห้องนอนไม่เย็น',
    category: 'air_conditioning',
    priority: 'high'
  })
});
```

### **2. ทดสอบ Parcels API**

```javascript
// Get all parcels
const response = await fetch('/api/v1/parcels?unit_number=101', {
  headers: {
    'X-API-Key': 'sk_test_1234567890abcdef1234567890abcdef'
  }
});

// Register new parcel
const createResponse = await fetch('/api/v1/parcels', {
  method: 'POST',
  headers: {
    'X-API-Key': 'sk_test_1234567890abcdef1234567890abcdef',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    unit_number: '101',
    recipient_name: 'John Doe',
    courier: 'Kerry Express',
    tracking_number: 'TH1234567890'
  })
});
```

## Use Cases

### **Maintenance API Use Cases**
1. **Mobile App Integration**: แอปพลิเคชันสำหรับลูกบ้านสามารถแจ้งซ่อมผ่าน API
2. **Third-party Service**: บริษัทซ่อมบำรุงภายนอกสามารถเข้าถึงงานซ่อมผ่าน API
3. **Automated Notifications**: ส่งการแจ้งเตือนอัตโนมัติเมื่อมีงานแจ้งซ่อมใหม่
4. **Reporting**: สร้างรายงานสถิติการแจ้งซ่อมผ่าน API

### **Parcels API Use Cases**
1. **Locker Integration**: เชื่อมต่อกับตู้พัสดุอัจฉริยะ
2. **Courier Integration**: เชื่อมต่อกับระบบของบริษัทขนส่ง
3. **Mobile App**: แอปพลิเคชันสำหรับดูสถานะพัสดุ
4. **QR Code Scanning**: สแกน QR code เพื่อมอบพัสดุ

## Next Steps

### **การพัฒนาต่อ:**
1. เพิ่ม Webhooks สำหรับ real-time notifications
2. เพิ่ม API สำหรับอัปโหลดรูปภาพ
3. เพิ่ม API สำหรับ Notifications
4. เพิ่ม API สำหรับ Announcements

### **การปรับปรุง:**
1. เพิ่ม field validation ที่ละเอียดขึ้น
2. เพิ่ม pagination metadata
3. เพิ่ม rate limiting แยกตาม endpoint
4. เพิ่ม API versioning

## สรุป

✅ เพิ่ม **Maintenance API** ครบทุก CRUD operations
✅ เพิ่ม **Parcels API** ครบทุก CRUD operations
✅ อัปเดต **Permissions** สำหรับ Maintenance และ Parcels
✅ อัปเดต **Documentation** ครบถ้วน
✅ อัปเดต **Test API Keys** ให้รวม permissions ใหม่
✅ อัปเดต **UI** ในหน้า API Management

ระบบ API ตอนนี้รองรับ:
- Units (ห้องชุด)
- Bills (บิล)
- Files (ไฟล์)
- Maintenance (งานแจ้งซ่อม) ✨ NEW
- Parcels (พัสดุ) ✨ NEW
- API Keys (จัดการ API Keys)
