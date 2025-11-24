# Units, Owners, Tenants Migration Summary

## 🚀 **Migration Status: IN PROGRESS**

### **📋 Migration Checklist:**

- [x] **Analyze current structure** - วิเคราะห์โครงสร้างปัจจุบัน
- [x] **Create migration scripts** - สร้าง SQL scripts สำหรับ migration
- [x] **Update TypeScript interfaces** - อัปเดต interfaces
- [ ] **Run migration scripts** - รัน SQL scripts
- [ ] **Verify data migration** - ตรวจสอบการ migrate ข้อมูล
- [ ] **Test application** - ทดสอบแอปพลิเคชัน
- [ ] **Update application code** - อัปเดตโค้ดแอปพลิเคชัน

---

## **1. สิ่งที่ Migration แล้ว**

### **✅ SQL Scripts ที่สร้างแล้ว:**
1. **`scripts/139_complete_units_migration.sql`** - Migration หลัก
2. **`scripts/140_migrate_existing_data.sql`** - Migrate ข้อมูลเดิม

### **✅ TypeScript Interfaces ที่อัปเดตแล้ว:**
1. **`lib/types/permissions.ts`** - เพิ่ม interfaces ใหม่
2. **`lib/types/units.ts`** - interfaces สำหรับ units (แยกไฟล์)

---

## **2. โครงสร้างใหม่ที่เพิ่ม**

### **🏠 ตาราง UNITS (อัปเกรด)**
```sql
-- ฟิลด์ใหม่ที่เพิ่ม:
- project_id (UUID) - รหัสโครงการ
- building_id (VARCHAR) - รหัสอาคาร
- unit_type (VARCHAR) - ประเภทห้องชุด
- ownership_type (VARCHAR) - ประเภทการครอบครอง
- current_owner_id (UUID) - รหัสเจ้าของปัจจุบัน
- current_tenant_id (UUID) - รหัสผู้เช่าปัจจุบัน
- number_of_bedrooms (INTEGER) - จำนวนห้องนอน
- number_of_bathrooms (INTEGER) - จำนวนห้องน้ำ
- furnishing_status (VARCHAR) - สถานะการตกแต่ง
- view_type (VARCHAR) - ประเภทวิว
- parking_space_count (INTEGER) - จำนวนที่จอดรถ
- parking_space_number (VARCHAR) - หมายเลขที่จอดรถ
- default_rental_price (NUMERIC) - ราคาเช่าเริ่มต้น
- sale_price (NUMERIC) - ราคาขาย
- notes (TEXT) - บันทึกเพิ่มเติม
- description (TEXT) - คำอธิบาย
- unit_layout_image_url (TEXT) - URL รูปแปลนห้อง
```

### **👤 ตาราง OWNERS (ใหม่)**
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

### **🏠 ตาราง TENANTS (ใหม่)**
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

### **📋 ตาราง TENANCY_HISTORY (ใหม่)**
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

### **💰 ตาราง RENTAL_PAYMENTS (ใหม่)**
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

## **3. การ Migrate ข้อมูล**

### **📊 ข้อมูลที่จะ Migrate:**
1. **เจ้าของ** - จาก `units.owner_name`, `units.owner_email`, `units.owner_phone`
2. **ผู้เช่า** - สร้างข้อมูลตัวอย่างสำหรับการทดสอบ
3. **ประวัติการเช่า** - สร้างจากข้อมูลผู้เช่า
4. **การชำระเงิน** - สร้างข้อมูลตัวอย่าง

### **🔄 Migration Process:**
1. **สร้าง Owners** - จากข้อมูลเจ้าของเดิม
2. **อัปเดต Units** - เชื่อมโยงกับ owners
3. **สร้าง Tenants** - ข้อมูลตัวอย่าง
4. **อัปเดต Units** - เชื่อมโยงกับ tenants
5. **สร้าง Tenancy History** - ประวัติการเช่า
6. **สร้าง Rental Payments** - การชำระเงิน

---

## **4. Indexes และ Performance**

### **📈 Indexes ที่สร้าง:**
- `idx_units_project_id` - สำหรับค้นหาตามโครงการ
- `idx_units_building_id` - สำหรับค้นหาตามอาคาร
- `idx_units_unit_type` - สำหรับค้นหาตามประเภทห้อง
- `idx_units_current_owner_id` - สำหรับค้นหาตามเจ้าของ
- `idx_units_current_tenant_id` - สำหรับค้นหาตามผู้เช่า
- `idx_owners_unit_id` - สำหรับค้นหาเจ้าของตามห้อง
- `idx_tenants_unit_id` - สำหรับค้นหาผู้เช่าตามห้อง
- `idx_tenancy_history_unit_id` - สำหรับค้นหาประวัติตามห้อง
- `idx_rental_payments_tenant_id` - สำหรับค้นหาการชำระตามผู้เช่า

---

## **5. Security และ RLS**

### **🔒 Row Level Security (RLS):**
- **Owners** - ผู้ใช้เห็นเจ้าของของห้องตัวเอง
- **Tenants** - ผู้ใช้เห็นผู้เช่าของห้องตัวเอง
- **Tenancy History** - ผู้ใช้เห็นประวัติของห้องตัวเอง
- **Rental Payments** - ผู้ใช้เห็นการชำระของห้องตัวเอง

### **👥 Policies:**
- **Service Role** - จัดการข้อมูลทั้งหมด
- **User Role** - เห็นข้อมูลของตัวเองเท่านั้น

---

## **6. TypeScript Interfaces**

### **📝 Interfaces ที่เพิ่ม:**
```typescript
export interface Unit {
  // Enhanced fields
  project_id?: string
  building_id?: string
  unit_type: 'condo' | 'apartment' | 'office' | 'studio' | 'penthouse'
  ownership_type: 'freehold' | 'leasehold' | 'rental'
  current_owner_id?: string
  current_tenant_id?: string
  number_of_bedrooms: number
  number_of_bathrooms: number
  furnishing_status: 'furnished' | 'unfurnished' | 'semi_furnished'
  view_type?: 'city_view' | 'pool_view' | 'garden_view' | 'mountain_view'
  parking_space_count: number
  parking_space_number?: string
  default_rental_price: number
  sale_price: number
  notes?: string
  description?: string
  unit_layout_image_url?: string
  
  // Joined data
  project?: Project
  current_owner?: Owner
  current_tenant?: Tenant
}

export interface Owner {
  id: string
  unit_id: string
  name: string
  national_id?: string
  email?: string
  phone?: string
  address?: string
  is_primary: boolean
  ownership_percentage: number
  start_date: string
  end_date?: string
  notes?: string
  // ... timestamps and joined data
}

export interface Tenant {
  id: string
  unit_id: string
  owner_id?: string
  company_id?: string
  name: string
  national_id?: string
  gender?: 'male' | 'female' | 'other'
  date_of_birth?: string
  email?: string
  phone?: string
  address?: string
  emergency_contact_name?: string
  emergency_contact_phone?: string
  move_in_date?: string
  move_out_date?: string
  rental_contract_no?: string
  rental_price: number
  deposit_amount: number
  payment_method?: 'cash' | 'bank_transfer' | 'check' | 'credit_card'
  status: 'active' | 'inactive' | 'terminated' | 'pending'
  notes?: string
  // ... timestamps and joined data
}

export interface TenancyHistory {
  id: string
  unit_id: string
  tenant_id: string
  rental_contract_no?: string
  rental_start_date: string
  rental_end_date?: string
  rental_price: number
  deposit_amount: number
  move_in_date?: string
  move_out_date?: string
  status: 'active' | 'completed' | 'terminated' | 'cancelled'
  notes?: string
  // ... timestamps and joined data
}

export interface RentalPayment {
  id: string
  tenant_id: string
  unit_id: string
  month: string
  year: number
  amount: number
  status: 'pending' | 'paid' | 'overdue' | 'cancelled'
  payment_date?: string
  payment_method?: 'cash' | 'bank_transfer' | 'check' | 'credit_card'
  reference_number?: string
  notes?: string
  // ... timestamps and joined data
}
```

---

## **7. Next Steps**

### **🎯 ขั้นตอนต่อไป:**
1. **Run Migration Scripts** - รัน SQL scripts ใน Supabase
2. **Verify Data** - ตรวจสอบข้อมูลที่ migrate
3. **Update Application Code** - อัปเดตโค้ดแอปพลิเคชัน
4. **Test Features** - ทดสอบฟีเจอร์ใหม่
5. **Update UI Components** - อัปเดต UI components

### **⚠️ สิ่งที่ต้องระวัง:**
- **Backup Database** - สำรองข้อมูลก่อน migration
- **Test Thoroughly** - ทดสอบอย่างละเอียด
- **Update Dependencies** - อัปเดต dependencies ที่เกี่ยวข้อง
- **Monitor Performance** - ติดตามประสิทธิภาพ

---

## **8. ประโยชน์หลัง Migration**

### **📈 Business Benefits:**
- **การจัดการที่ครบถ้วน** - จัดการห้อง เจ้าของ ผู้เช่าได้ครบถ้วน
- **ประวัติการเช่า** - ติดตามประวัติการเช่าทั้งหมด
- **การชำระเงิน** - ติดตามการชำระค่าเช่า
- **ข้อมูลเจ้าของ** - จัดการเจ้าของได้ดีขึ้น
- **ข้อมูลผู้เช่า** - จัดการผู้เช่าได้ดีขึ้น

### **🔧 Technical Benefits:**
- **Normalization** - ลดข้อมูลซ้ำซ้อน
- **Referential Integrity** - ความถูกต้องของข้อมูล
- **Performance** - ประสิทธิภาพการค้นหา
- **Scalability** - ขยายระบบได้ง่าย
- **Maintainability** - บำรุงรักษาง่าย

---

## **9. สรุป**

### **✅ สิ่งที่เสร็จแล้ว:**
- [x] วิเคราะห์โครงสร้างปัจจุบัน
- [x] สร้าง SQL migration scripts
- [x] อัปเดต TypeScript interfaces
- [x] สร้าง documentation

### **🔄 สิ่งที่กำลังทำ:**
- [ ] รัน migration scripts
- [ ] ตรวจสอบข้อมูล
- [ ] อัปเดตโค้ดแอปพลิเคชัน

### **🎯 สิ่งที่ต้องทำต่อไป:**
- [ ] ทดสอบระบบ
- [ ] อัปเดต UI
- [ ] สร้างฟีเจอร์ใหม่

**Migration พร้อมเริ่ม!** 🚀
