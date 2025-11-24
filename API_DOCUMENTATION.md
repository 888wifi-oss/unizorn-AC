# API Documentation - Condo Pro Dashboard

## ภาพรวม
API สำหรับ Condo Pro Dashboard ที่ให้บริการข้อมูลและจัดการระบบคอนโดมิเนียมผ่าน REST API endpoints

## Base URL
```
https://your-domain.com/api/v1
```

## Authentication
API ใช้ API Key สำหรับการยืนยันตัวตน

### Headers Required
```
X-API-Key: sk_your_api_key_here
Content-Type: application/json
```

## Rate Limiting
- **Default**: 100 requests per hour
- **Auth endpoints**: 10 requests per hour  
- **Upload endpoints**: 20 requests per hour
- **Admin endpoints**: 1000 requests per hour

### Rate Limit Headers
```
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

## Response Format
ทุก API response จะมีรูปแบบเดียวกัน:

```json
{
  "success": true,
  "data": {},
  "message": "Success message",
  "error": null,
  "timestamp": "2024-01-01T00:00:00.000Z",
  "requestId": "uuid-here"
}
```

## Error Codes
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `429` - Rate Limit Exceeded
- `500` - Internal Server Error

## Endpoints

### Units Management

#### GET /units
ดึงรายการห้องชุดทั้งหมด

**Query Parameters:**
- `page` (number, optional): หน้าที่ต้องการ (default: 1)
- `limit` (number, optional): จำนวนรายการต่อหน้า (default: 50, max: 100)
- `search` (string, optional): ค้นหาตามเลขห้องหรือชื่อเจ้าของ
- `status` (string, optional): สถานะห้อง (occupied, vacant, maintenance)
- `sort` (string, optional): เรียงตาม (default: unit_number)
- `order` (string, optional): เรียงลำดับ (asc, desc, default: asc)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "unit_number": "101",
      "floor": 1,
      "size": 45.5,
      "owner_name": "John Doe",
      "owner_phone": "0812345678",
      "owner_email": "john@example.com",
      "residents": 2,
      "status": "occupied",
      "created_at": "2024-01-01T00:00:00.000Z",
      "updated_at": "2024-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 100,
    "totalPages": 2,
    "hasNext": true,
    "hasPrev": false
  }
}
```

#### POST /units
สร้างห้องชุดใหม่

**Request Body:**
```json
{
  "unit_number": "102",
  "floor": 1,
  "size": 45.5,
  "owner_name": "Jane Doe",
  "owner_phone": "0812345679",
  "owner_email": "jane@example.com",
  "residents": 2,
  "status": "occupied"
}
```

**Required Fields:** `unit_number`, `floor`, `size`, `owner_name`

#### GET /units/{id}
ดึงข้อมูลห้องชุดตาม ID

#### PUT /units/{id}
อัปเดตข้อมูลห้องชุด

#### DELETE /units/{id}
ลบห้องชุด

### Bills Management

#### GET /bills
ดึงรายการบิลทั้งหมด

**Query Parameters:**
- `page`, `limit`, `sort`, `order` (same as units)
- `unit_id` (string, optional): กรองตามห้องชุด
- `status` (string, optional): สถานะบิล (pending, paid, overdue)
- `month` (string, optional): เดือน
- `year` (number, optional): ปี

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "unit_id": "uuid",
      "bill_number": "B202401001",
      "month": "January",
      "year": 2024,
      "common_fee": 1500,
      "water_fee": 200,
      "electricity_fee": 800,
      "parking_fee": 500,
      "other_fee": 0,
      "total": 3000,
      "status": "pending",
      "due_date": "2024-01-31",
      "unit": {
        "unit_number": "101",
        "owner_name": "John Doe"
      }
    }
  ]
}
```

#### POST /bills
สร้างบิลใหม่

**Request Body:**
```json
{
  "unit_id": "uuid",
  "bill_number": "B202401002",
  "month": "January",
  "year": 2024,
  "common_fee": 1500,
  "water_fee": 200,
  "electricity_fee": 800,
  "parking_fee": 500,
  "other_fee": 0,
  "due_date": "2024-01-31"
}
```

### File Management

#### GET /files
ดึงรายการไฟล์ทั้งหมด

**Query Parameters:**
- `page`, `limit`, `sort`, `order` (same as units)
- `category_id` (string, optional): กรองตามหมวดหมู่
- `unit_number` (string, optional): กรองตามเลขห้อง
- `mime_type` (string, optional): ประเภทไฟล์
- `is_public` (boolean, optional): ไฟล์สาธารณะ
- `search` (string, optional): ค้นหาตามชื่อไฟล์หรือคำอธิบาย

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "filename": "1640995200_abc123.pdf",
      "original_filename": "contract.pdf",
      "file_path": "https://storage.url/file.pdf",
      "file_size": 1024000,
      "mime_type": "application/pdf",
      "file_extension": "pdf",
      "category": {
        "name": "สัญญา",
        "icon": "FileCheck",
        "color": "green"
      },
      "uploaded_by": "admin",
      "unit_number": "101",
      "description": "สัญญาเช่าห้อง",
      "tags": ["contract", "rental"],
      "is_public": false,
      "download_count": 5,
      "created_at": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

#### POST /files
อัปโหลดไฟล์

**Request:** Multipart form data
- `file` (File): ไฟล์ที่ต้องการอัปโหลด
- `category_id` (string, optional): ID หมวดหมู่
- `unit_number` (string, optional): เลขห้อง
- `description` (string, optional): คำอธิบาย
- `tags` (string, optional): แท็ก (คั่นด้วยจุลภาค)
- `is_public` (boolean, optional): ไฟล์สาธารณะ

### Maintenance Management

#### GET /maintenance
ดึงรายการงานแจ้งซ่อมทั้งหมด

**Query Parameters:**
- `page`, `limit`, `sort`, `order` (same as units)
- `unit_id` (string, optional): กรองตามห้องชุด
- `status` (string, optional): สถานะงาน (pending, in_progress, completed, cancelled)
- `category` (string, optional): หมวดหมู่งาน (plumbing, electrical, air_conditioning, etc.)
- `priority` (string, optional): ความสำคัญ (low, medium, high, urgent)
- `search` (string, optional): ค้นหาตามชื่อหรือคำอธิบาย

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "unit_id": "uuid",
      "request_number": "MR1640995200000",
      "title": "แอร์เสีย",
      "description": "แอร์ในห้องนอนไม่เย็น",
      "category": "air_conditioning",
      "priority": "high",
      "status": "pending",
      "location": "ห้องนอนใหญ่",
      "contact_phone": "0812345678",
      "contact_name": "John Doe",
      "preferred_date": "2024-01-15",
      "preferred_time": "09:00",
      "assigned_to": null,
      "scheduled_date": null,
      "scheduled_time": null,
      "completed_at": null,
      "technician_notes": null,
      "cost": null,
      "images": ["url1", "url2"],
      "created_at": "2024-01-10T00:00:00.000Z",
      "unit": {
        "unit_number": "101",
        "owner_name": "John Doe"
      }
    }
  ]
}
```

#### POST /maintenance
สร้างงานแจ้งซ่อมใหม่

**Request Body:**
```json
{
  "unit_id": "uuid",
  "title": "แอร์เสีย",
  "description": "แอร์ในห้องนอนไม่เย็น",
  "category": "air_conditioning",
  "priority": "high",
  "location": "ห้องนอนใหญ่",
  "contact_phone": "0812345678",
  "contact_name": "John Doe",
  "preferred_date": "2024-01-15",
  "preferred_time": "09:00",
  "images": ["url1", "url2"]
}
```

**Required Fields:** `unit_id`, `title`, `description`, `category`

#### GET /maintenance/{id}
ดึงข้อมูลงานแจ้งซ่อมตาม ID

#### PUT /maintenance/{id}
อัปเดตงานแจ้งซ่อม

#### DELETE /maintenance/{id}
ลบงานแจ้งซ่อม

### Parcels Management

#### GET /parcels
ดึงรายการพัสดุทั้งหมด

**Query Parameters:**
- `page`, `limit`, `sort`, `order` (same as units)
- `unit_number` (string, optional): กรองตามเลขห้อง
- `status` (string, optional): สถานะพัสดุ (pending, picked_up)
- `courier` (string, optional): ชื่อขนส่ง
- `search` (string, optional): ค้นหาตามชื่อผู้รับหรือเลขพัสดุ

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "unit_number": "101",
      "recipient_name": "John Doe",
      "courier": "Kerry Express",
      "tracking_number": "TH1234567890",
      "size": "medium",
      "notes": "Handle with care",
      "photo_url": "https://...",
      "received_by": "Security Guard",
      "received_at": "2024-01-10T10:00:00.000Z",
      "status": "pending",
      "qr_code": "PARCEL_1640995200000_101",
      "picked_up_by": null,
      "picked_up_at": null,
      "picked_up_method": null,
      "staff_delivered_by": null,
      "digital_signature": null,
      "delivery_photo_url": null
    }
  ]
}
```

#### POST /parcels
ลงทะเบียนพัสดุใหม่

**Request Body:**
```json
{
  "unit_number": "101",
  "recipient_name": "John Doe",
  "courier": "Kerry Express",
  "tracking_number": "TH1234567890",
  "size": "medium",
  "notes": "Handle with care",
  "photo_url": "https://...",
  "received_by": "Security Guard"
}
```

**Required Fields:** `unit_number`, `recipient_name`, `courier`

#### GET /parcels/{id}
ดึงข้อมูลพัสดุตาม ID

#### PUT /parcels/{id}
อัปเดตพัสดุ (เช่น มอบพัสดุ)

**Request Body (for pickup):**
```json
{
  "status": "picked_up",
  "picked_up_by": "John Doe",
  "picked_up_method": "qr_code",
  "staff_delivered_by": "Security Guard",
  "digital_signature": "data:image/png;base64,...",
  "delivery_photo_url": "https://...",
  "notes": "Delivered successfully"
}
```

#### DELETE /parcels/{id}
ลบพัสดุ

### API Key Management

#### GET /api-keys
ดึงรายการ API Keys (Admin only)

#### POST /api-keys
สร้าง API Key ใหม่ (Admin only)

**Request Body:**
```json
{
  "name": "My API Key",
  "permissions": ["units:read", "units:write", "bills:read"],
  "expiresAt": "2024-12-31T23:59:59.000Z"
}
```

## Permissions

### Available Permissions
- `units:read` - อ่านข้อมูลห้องชุด
- `units:write` - เขียนข้อมูลห้องชุด
- `units:delete` - ลบข้อมูลห้องชุด
- `bills:read` - อ่านข้อมูลบิล
- `bills:write` - เขียนข้อมูลบิล
- `bills:delete` - ลบข้อมูลบิล
- `files:read` - อ่านข้อมูลไฟล์
- `files:write` - เขียนข้อมูลไฟล์
- `files:delete` - ลบข้อมูลไฟล์
- `maintenance:read` - อ่านข้อมูลงานแจ้งซ่อม
- `maintenance:write` - เขียนข้อมูลงานแจ้งซ่อม
- `maintenance:delete` - ลบข้อมูลงานแจ้งซ่อม
- `parcels:read` - อ่านข้อมูลพัสดุ
- `parcels:write` - เขียนข้อมูลพัสดุ
- `parcels:delete` - ลบข้อมูลพัสดุ
- `admin` - สิทธิ์ผู้ดูแลระบบ

## Examples

### JavaScript/Node.js
```javascript
const API_BASE = 'https://your-domain.com/api/v1';
const API_KEY = 'sk_your_api_key_here';

// Get all units
const response = await fetch(`${API_BASE}/units?page=1&limit=10`, {
  headers: {
    'X-API-Key': API_KEY,
    'Content-Type': 'application/json'
  }
});

const data = await response.json();
console.log(data.data); // Array of units
```

### Python
```python
import requests

API_BASE = 'https://your-domain.com/api/v1'
API_KEY = 'sk_your_api_key_here'

headers = {
    'X-API-Key': API_KEY,
    'Content-Type': 'application/json'
}

# Get all units
response = requests.get(f'{API_BASE}/units', headers=headers)
data = response.json()
print(data['data'])  # Array of units
```

### cURL
```bash
# Get all units
curl -X GET "https://your-domain.com/api/v1/units?page=1&limit=10" \
  -H "X-API-Key: sk_your_api_key_here" \
  -H "Content-Type: application/json"

# Create new unit
curl -X POST "https://your-domain.com/api/v1/units" \
  -H "X-API-Key: sk_your_api_key_here" \
  -H "Content-Type: application/json" \
  -d '{
    "unit_number": "103",
    "floor": 1,
    "size": 45.5,
    "owner_name": "Bob Smith"
  }'
```

## Testing

### Test API Key
สำหรับการทดสอบ สามารถใช้ API Key นี้:
```
sk_test_1234567890abcdef1234567890abcdef
```

**Permissions:** `units:read`, `units:write`, `bills:read`, `bills:write`, `files:read`, `files:write`

### Admin API Key
สำหรับการทดสอบฟีเจอร์ Admin:
```
sk_admin_abcdef1234567890abcdef1234567890
```

**Permissions:** `admin`, `units:read`, `units:write`, `units:delete`, `bills:read`, `bills:write`, `bills:delete`, `files:read`, `files:write`, `files:delete`

## Support
หากมีปัญหาหรือข้อสงสัย กรุณาติดต่อทีมพัฒนา
