# คู่มือการใช้งาน API Development

## ภาพรวม
ระบบ API Development สำหรับ Condo Pro Dashboard ที่ให้บริการ REST API endpoints สำหรับการ integration กับระบบภายนอก

## ฟีเจอร์ที่พัฒนาแล้ว

### ✅ **1. REST API Endpoints**
- **Units API**: `/api/v1/units` - จัดการข้อมูลห้องชุด
- **Bills API**: `/api/v1/bills` - จัดการข้อมูลบิล
- **Files API**: `/api/v1/files` - จัดการไฟล์และเอกสาร
- **API Keys API**: `/api/v1/api-keys` - จัดการ API Keys

### ✅ **2. Authentication & Authorization**
- **API Key Authentication**: ใช้ `X-API-Key` header
- **Permission-based Access**: ระบบสิทธิ์แบบละเอียด
- **Key Expiration**: รองรับการหมดอายุของ API Key

### ✅ **3. Rate Limiting**
- **Default**: 100 requests per hour
- **Auth endpoints**: 10 requests per hour
- **Upload endpoints**: 20 requests per hour
- **Admin endpoints**: 1000 requests per hour

### ✅ **4. API Documentation**
- **Complete API Reference**: เอกสาร API ครบถ้วน
- **Request/Response Examples**: ตัวอย่างการใช้งาน
- **Error Codes**: รายการ error codes
- **Integration Examples**: ตัวอย่างการ integration

### ✅ **5. Integration Examples**
- **JavaScript/Node.js**: ตัวอย่างการใช้งานใน JavaScript
- **Python**: ตัวอย่างการใช้งานใน Python
- **PHP**: ตัวอย่างการใช้งานใน PHP
- **cURL**: ตัวอย่างการใช้งานด้วย cURL
- **React**: ตัวอย่างการใช้งานใน React

### ✅ **6. API Management UI**
- **API Key Management**: จัดการ API Keys
- **Usage Statistics**: สถิติการใช้งาน
- **Permission Management**: จัดการสิทธิ์
- **Documentation Viewer**: ดูเอกสาร API

## ไฟล์ที่สร้างแล้ว

### **API Core Files**
- `lib/api/types.ts` - TypeScript types สำหรับ API
- `lib/api/middleware.ts` - Middleware สำหรับ authentication และ rate limiting

### **API Endpoints**
- `app/api/v1/units/route.ts` - Units API endpoints
- `app/api/v1/units/[id]/route.ts` - Unit by ID endpoints
- `app/api/v1/bills/route.ts` - Bills API endpoints
- `app/api/v1/files/route.ts` - Files API endpoints
- `app/api/v1/api-keys/route.ts` - API Keys management endpoints

### **Database Schema**
- `scripts/011_create_api_keys_table.sql` - SQL script สำหรับสร้างตาราง API Keys

### **UI Components**
- `app/(admin)/api-management/page.tsx` - หน้า API Management
- `components/sidebar.tsx` - เพิ่มเมนู API Management

### **Documentation**
- `API_DOCUMENTATION.md` - เอกสาร API ครบถ้วน
- `INTEGRATION_EXAMPLES.md` - ตัวอย่างการ integration

## วิธีใช้งาน

### **1. ติดตั้ง Database Schema**
```sql
-- รัน SQL script ใน Supabase
-- scripts/011_create_api_keys_table.sql
```

### **2. เข้าถึง API Management**
1. เข้าสู่ระบบ Admin
2. ไปที่เมนู **"จัดการ API"**
3. ดู API Keys ที่มีอยู่
4. สร้าง API Key ใหม่

### **3. สร้าง API Key**
1. กดปุ่ม **"สร้าง API Key"**
2. กรอกชื่อ API Key
3. เลือกสิทธิ์การเข้าถึง
4. กำหนดวันหมดอายุ (ไม่บังคับ)
5. กด **"สร้าง API Key"**

### **4. ใช้งาน API**
```javascript
// ตัวอย่างการใช้งาน
const API_BASE = 'https://your-domain.com/api/v1';
const API_KEY = 'sk_your_api_key_here';

// ดึงข้อมูลห้องชุด
const response = await fetch(`${API_BASE}/units`, {
  headers: {
    'X-API-Key': API_KEY,
    'Content-Type': 'application/json'
  }
});

const data = await response.json();
console.log(data.data); // Array of units
```

## API Endpoints ที่มี

### **Units Management**
- `GET /api/v1/units` - ดึงรายการห้องชุด
- `POST /api/v1/units` - สร้างห้องชุดใหม่
- `GET /api/v1/units/{id}` - ดึงข้อมูลห้องชุดตาม ID
- `PUT /api/v1/units/{id}` - อัปเดตข้อมูลห้องชุด
- `DELETE /api/v1/units/{id}` - ลบห้องชุด

### **Bills Management**
- `GET /api/v1/bills` - ดึงรายการบิล
- `POST /api/v1/bills` - สร้างบิลใหม่

### **Files Management**
- `GET /api/v1/files` - ดึงรายการไฟล์
- `POST /api/v1/files` - อัปโหลดไฟล์

### **API Keys Management**
- `GET /api/v1/api-keys` - ดึงรายการ API Keys (Admin only)
- `POST /api/v1/api-keys` - สร้าง API Key ใหม่ (Admin only)

## สิทธิ์การเข้าถึง

### **Available Permissions**
- `units:read` - อ่านข้อมูลห้องชุด
- `units:write` - เขียนข้อมูลห้องชุด
- `units:delete` - ลบข้อมูลห้องชุด
- `bills:read` - อ่านข้อมูลบิล
- `bills:write` - เขียนข้อมูลบิล
- `bills:delete` - ลบข้อมูลบิล
- `files:read` - อ่านข้อมูลไฟล์
- `files:write` - เขียนข้อมูลไฟล์
- `files:delete` - ลบข้อมูลไฟล์
- `admin` - สิทธิ์ผู้ดูแลระบบ

## Rate Limiting

### **Rate Limits**
- **Default**: 100 requests per hour
- **Auth endpoints**: 10 requests per hour
- **Upload endpoints**: 20 requests per hour
- **Admin endpoints**: 1000 requests per hour

### **Rate Limit Headers**
```
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

## Error Handling

### **HTTP Status Codes**
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `429` - Rate Limit Exceeded
- `500` - Internal Server Error

### **Error Response Format**
```json
{
  "success": false,
  "error": "Error message",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "requestId": "uuid-here"
}
```

## การทดสอบ

### **Test API Keys**
```
Test Key: sk_test_1234567890abcdef1234567890abcdef
Admin Key: sk_admin_abcdef1234567890abcdef1234567890
```

### **Testing with cURL**
```bash
# Test API connection
curl -X GET "https://your-domain.com/api/v1/units" \
  -H "X-API-Key: sk_test_1234567890abcdef1234567890abcdef" \
  -H "Content-Type: application/json"
```

## Best Practices

### **1. Security**
- เก็บ API Key ใน environment variables
- ใช้ HTTPS เสมอ
- หมุนเวียน API Key เป็นประจำ
- ใช้สิทธิ์ที่จำเป็นเท่านั้น

### **2. Performance**
- ใช้ pagination สำหรับข้อมูลจำนวนมาก
- Cache ข้อมูลที่เปลี่ยนแปลงไม่บ่อย
- Monitor API response time
- ใช้ parallel requests เมื่อเป็นไปได้

### **3. Error Handling**
- ตรวจสอบ HTTP status code
- จัดการ rate limiting
- Log errors สำหรับ debugging
- แสดง error message ที่เข้าใจง่าย

## การพัฒนาต่อ

### **ฟีเจอร์ที่สามารถเพิ่มได้**
- **Webhooks**: ส่ง notification เมื่อมีข้อมูลเปลี่ยนแปลง
- **API Versioning**: รองรับหลายเวอร์ชันของ API
- **GraphQL**: เพิ่ม GraphQL endpoint
- **Real-time**: WebSocket สำหรับ real-time updates
- **Analytics**: API usage analytics และ reporting
- **SDKs**: สร้าง SDK สำหรับภาษาต่างๆ

### **การปรับปรุง**
- **Caching**: เพิ่ม Redis caching
- **Load Balancing**: รองรับ load balancing
- **Monitoring**: เพิ่ม monitoring และ alerting
- **Documentation**: สร้าง interactive API documentation

## การแก้ไขปัญหา

### **ปัญหาที่พบบ่อย**

#### **1. API Key ไม่ทำงาน**
- ตรวจสอบ API Key ว่าถูกต้อง
- ตรวจสอบสิทธิ์การเข้าถึง
- ตรวจสอบวันหมดอายุ

#### **2. Rate Limit Exceeded**
- ตรวจสอบ rate limit headers
- ลดความถี่ในการเรียก API
- ใช้ caching เพื่อลดการเรียก API

#### **3. Permission Denied**
- ตรวจสอบสิทธิ์การเข้าถึง
- สร้าง API Key ใหม่ที่มีสิทธิ์ที่จำเป็น
- ติดต่อ Admin เพื่อขอสิทธิ์เพิ่ม

### **การ Debug**
1. ตรวจสอบ Console logs
2. ตรวจสอบ Network tab ใน Developer Tools
3. ตรวจสอบ API response headers
4. ใช้ Postman หรือ cURL เพื่อทดสอบ

## สรุป

ระบบ API Development ได้ถูกพัฒนาครบถ้วนแล้วพร้อมใช้งาน:

- ✅ **REST API Endpoints** สำหรับ Units, Bills, Files
- ✅ **Authentication & Authorization** ด้วย API Keys
- ✅ **Rate Limiting** เพื่อป้องกันการใช้งานเกินขีดจำกัด
- ✅ **API Documentation** ครบถ้วน
- ✅ **Integration Examples** สำหรับหลายภาษา
- ✅ **API Management UI** สำหรับ Admin

ระบบพร้อมสำหรับการ integration กับระบบภายนอกและสามารถขยายได้ตามความต้องการในอนาคต
