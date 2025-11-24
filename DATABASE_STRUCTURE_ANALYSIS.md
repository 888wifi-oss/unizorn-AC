# Database Structure Analysis - Units Table

## 📊 **การวิเคราะห์โครงสร้างฐานข้อมูลตาม ERD**

### **🔍 สถานะปัจจุบัน vs ERD Requirements:**

---

## **1. ตาราง UNITS - การเปรียบเทียบ**

### **✅ ฟิลด์ที่มีอยู่แล้ว:**
- `id` (UUID) - Primary Key
- `unit_number` (TEXT) - หมายเลขห้องชุด
- `floor` (INTEGER) - ชั้น
- `size` (NUMERIC) - ขนาดพื้นที่
- `status` (TEXT) - สถานะห้องชุด
- `created_at` (TIMESTAMPTZ) - วันที่สร้าง
- `updated_at` (TIMESTAMPTZ) - วันที่อัปเดต

### **❌ ฟิลด์ที่ขาดหายไป (ต้องเพิ่ม):**
- `project_id` (UUID) - รหัสโครงการ
- `building_id` (VARCHAR) - รหัสอาคาร
- `unit_type` (VARCHAR) - ประเภทห้องชุด
- `ownership_type` (VARCHAR) - ประเภทการครอบครอง
- `current_owner_id` (UUID) - รหัสเจ้าของปัจจุบัน
- `current_tenant_id` (UUID) - รหัสผู้เช่าปัจจุบัน

### **🆕 ฟิลด์เพิ่มเติมที่แนะนำ:**
- `number_of_bedrooms` (INTEGER) - จำนวนห้องนอน
- `number_of_bathrooms` (INTEGER) - จำนวนห้องน้ำ
- `furnishing_status` (VARCHAR) - สถานะการตกแต่ง
- `view_type` (VARCHAR) - ประเภทวิว
- `parking_space_count` (INTEGER) - จำนวนที่จอดรถ
- `parking_space_number` (VARCHAR) - หมายเลขที่จอดรถ
- `default_rental_price` (NUMERIC) - ราคาเช่าเริ่มต้น
- `sale_price` (NUMERIC) - ราคาขาย
- `notes` (TEXT) - บันทึกเพิ่มเติม
- `description` (TEXT) - คำอธิบาย
- `unit_layout_image_url` (TEXT) - URL รูปแปลนห้อง

---

## **2. ตารางใหม่ที่ต้องสร้าง**

### **🏠 ตาราง OWNERS**
```sql
CREATE TABLE public.owners (
  id UUID PRIMARY KEY,
  unit_id UUID REFERENCES units(id),
  name VARCHAR(255) NOT NULL,
  national_id VARCHAR(20) UNIQUE,
  email VARCHAR(255),
  phone VARCHAR(20),
  address TEXT,
  is_primary BOOLEAN DEFAULT true,
  ownership_percentage DECIMAL(5,2) DEFAULT 100.00,
  start_date DATE DEFAULT CURRENT_DATE,
  end_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### **👥 ตาราง TENANTS**
```sql
CREATE TABLE public.tenants (
  id UUID PRIMARY KEY,
  unit_id UUID REFERENCES units(id),
  owner_id UUID REFERENCES owners(id),
  company_id UUID REFERENCES companies(id),
  name VARCHAR(255) NOT NULL,
  national_id VARCHAR(20),
  gender VARCHAR(10),
  date_of_birth DATE,
  email VARCHAR(255),
  phone VARCHAR(20),
  address TEXT,
  emergency_contact_name VARCHAR(255),
  emergency_contact_phone VARCHAR(20),
  move_in_date DATE,
  move_out_date DATE,
  rental_contract_no VARCHAR(100),
  rental_price NUMERIC DEFAULT 0,
  deposit_amount NUMERIC DEFAULT 0,
  payment_method VARCHAR(50),
  status VARCHAR(50) DEFAULT 'active',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### **📋 ตาราง TENANCY_HISTORY**
```sql
CREATE TABLE public.tenancy_history (
  id UUID PRIMARY KEY,
  unit_id UUID REFERENCES units(id),
  tenant_id UUID REFERENCES tenants(id),
  rental_contract_no VARCHAR(100),
  rental_start_date DATE NOT NULL,
  rental_end_date DATE,
  rental_price NUMERIC DEFAULT 0,
  deposit_amount NUMERIC DEFAULT 0,
  move_in_date DATE,
  move_out_date DATE,
  status VARCHAR(50) DEFAULT 'completed',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### **💰 ตาราง RENTAL_PAYMENTS**
```sql
CREATE TABLE public.rental_payments (
  id UUID PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(id),
  unit_id UUID REFERENCES units(id),
  month VARCHAR(10) NOT NULL,
  year INTEGER NOT NULL,
  amount NUMERIC NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  payment_date DATE,
  payment_method VARCHAR(50),
  reference_number VARCHAR(100),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## **3. ความสัมพันธ์ระหว่างตาราง**

### **🔗 Foreign Key Relationships:**
- `units.project_id` → `projects.id`
- `units.current_owner_id` → `owners.id`
- `units.current_tenant_id` → `tenants.id`
- `owners.unit_id` → `units.id`
- `tenants.unit_id` → `units.id`
- `tenants.owner_id` → `owners.id`
- `tenants.company_id` → `companies.id`
- `tenancy_history.unit_id` → `units.id`
- `tenancy_history.tenant_id` → `tenants.id`
- `rental_payments.tenant_id` → `tenants.id`
- `rental_payments.unit_id` → `units.id`

---

## **4. การปรับปรุงที่แนะนำ**

### **🎯 Priority 1 (สำคัญมาก):**
1. **เพิ่ม `project_id`** - เชื่อมโยงห้องชุดกับโครงการ
2. **เพิ่ม `current_owner_id`** - เชื่อมโยงเจ้าของปัจจุบัน
3. **เพิ่ม `current_tenant_id`** - เชื่อมโยงผู้เช่าปัจจุบัน
4. **เพิ่ม `unit_type`** - ประเภทห้องชุด
5. **เพิ่ม `ownership_type`** - ประเภทการครอบครอง

### **🎯 Priority 2 (สำคัญ):**
1. **เพิ่ม `building_id`** - รหัสอาคาร
2. **เพิ่ม `number_of_bedrooms`** - จำนวนห้องนอน
3. **เพิ่ม `number_of_bathrooms`** - จำนวนห้องน้ำ
4. **เพิ่ม `furnishing_status`** - สถานะการตกแต่ง
5. **เพิ่ม `parking_space_count`** - จำนวนที่จอดรถ

### **🎯 Priority 3 (เพิ่มเติม):**
1. **เพิ่ม `view_type`** - ประเภทวิว
2. **เพิ่ม `parking_space_number`** - หมายเลขที่จอดรถ
3. **เพิ่ม `default_rental_price`** - ราคาเช่าเริ่มต้น
4. **เพิ่ม `sale_price`** - ราคาขาย
5. **เพิ่ม `notes`** - บันทึกเพิ่มเติม
6. **เพิ่ม `description`** - คำอธิบาย
7. **เพิ่ม `unit_layout_image_url`** - URL รูปแปลนห้อง

---

## **5. ประโยชน์ของการปรับปรุง**

### **📈 Business Benefits:**
- **การจัดการที่ครบถ้วน** - ข้อมูลห้องชุดครบถ้วน
- **การติดตามเจ้าของ** - จัดการเจ้าของได้ดีขึ้น
- **การติดตามผู้เช่า** - จัดการผู้เช่าได้ดีขึ้น
- **ประวัติการเช่า** - ติดตามประวัติการเช่า
- **การชำระเงิน** - ติดตามการชำระค่าเช่า

### **🔧 Technical Benefits:**
- **Normalization** - ลดข้อมูลซ้ำซ้อน
- **Referential Integrity** - ความถูกต้องของข้อมูล
- **Performance** - ประสิทธิภาพการค้นหา
- **Scalability** - ขยายระบบได้ง่าย
- **Maintainability** - บำรุงรักษาง่าย

---

## **6. การ Migration**

### **📋 Migration Steps:**
1. **Backup Database** - สำรองข้อมูล
2. **Add New Columns** - เพิ่มคอลัมน์ใหม่
3. **Create New Tables** - สร้างตารางใหม่
4. **Migrate Data** - ย้ายข้อมูล
5. **Update Indexes** - อัปเดต indexes
6. **Update Constraints** - อัปเดต constraints
7. **Test Application** - ทดสอบแอปพลิเคชัน
8. **Update Code** - อัปเดตโค้ด

### **⚠️ Risks & Mitigation:**
- **Data Loss** - สำรองข้อมูลก่อน
- **Downtime** - ใช้ ALTER TABLE IF NOT EXISTS
- **Performance Impact** - เพิ่ม indexes
- **Application Errors** - ทดสอบอย่างละเอียด

---

## **7. สรุป**

### **✅ ความครอบคลุม:**
โครงสร้างปัจจุบัน **ไม่ครอบคลุม** ตาม ERD ที่ต้องการ แต่สามารถปรับปรุงได้โดย:

1. **เพิ่มฟิลด์ที่ขาดหายไป** - เพิ่มคอลัมน์ที่จำเป็น
2. **สร้างตารางใหม่** - สร้างตาราง OWNERS, TENANTS, TENANCY_HISTORY, RENTAL_PAYMENTS
3. **ปรับปรุงความสัมพันธ์** - เพิ่ม Foreign Keys
4. **เพิ่ม Indexes** - เพิ่มประสิทธิภาพ
5. **อัปเดต Application Code** - ปรับโค้ดให้รองรับโครงสร้างใหม่

### **🎯 Recommendation:**
**แนะนำให้ทำการ Migration** เพื่อให้โครงสร้างฐานข้อมูลครอบคลุมตาม ERD และรองรับการใช้งานในอนาคตได้ดีขึ้น

---

## **8. Next Steps**

1. **Run Migration Scripts** - รัน SQL scripts ที่สร้างไว้
2. **Update TypeScript Types** - อัปเดต interfaces
3. **Update Application Code** - ปรับโค้ดให้รองรับโครงสร้างใหม่
4. **Test Thoroughly** - ทดสอบอย่างละเอียด
5. **Document Changes** - บันทึกการเปลี่ยนแปลง

**พร้อมเริ่ม Migration!** 🚀
