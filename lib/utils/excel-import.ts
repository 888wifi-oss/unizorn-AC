import * as XLSX from 'xlsx'

// Excel import utility for units
export interface UnitImportData {
  unit_number: string
  type: string
  floor: number
  area: number
  bedroom?: number
  bathroom?: number
  owner_name: string
  owner_email?: string
  tenant_name?: string
  tenant_email?: string
  status: string
  rent_price?: number
  errors?: string[]
}

export interface ImportResult {
  success: boolean
  imported: number
  failed: number
  errors: UnitImportData[]
}

export function parseExcelToUnits(file: File): Promise<UnitImportData[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer)
        const workbook = XLSX.read(data, { type: 'array' })
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
        const jsonData = XLSX.utils.sheet_to_json(firstSheet)
        
        // Transform Excel data to units format
        const units: UnitImportData[] = jsonData.map((row: any, index: number) => {
          const unit: UnitImportData = {
            unit_number: row['หมายเลขห้อง'] || row['unit_number'] || '',
            type: row['ประเภท'] || row['type'] || 'คอนโด',
            floor: parseInt(row['ชั้น'] || row['floor'] || '0'),
            area: parseFloat(row['ขนาด (ตร.ม.)'] || row['area'] || '0'),
            bedroom: row['ห้องนอน'] || row['bedroom'] ? parseInt(row['ห้องนอน'] || row['bedroom']) : undefined,
            bathroom: row['ห้องน้ำ'] || row['bathroom'] ? parseInt(row['ห้องน้ำ'] || row['bathroom']) : undefined,
            owner_name: row['เจ้าของ'] || row['owner_name'] || '',
            owner_email: row['อีเมลเจ้าของ'] || row['owner_email'] || undefined,
            tenant_name: row['ผู้เช่า'] || row['tenant_name'] || undefined,
            tenant_email: row['อีเมลผู้เช่า'] || row['tenant_email'] || undefined,
            status: row['สถานะ'] || row['status'] || 'ว่าง',
            rent_price: row['ราคาเช่า'] || row['rent_price'] ? parseFloat(row['ราคาเช่า'] || row['rent_price']) : undefined
          }
          
          // Collect validation errors
          const errors: string[] = []
          
          if (!unit.unit_number) {
            errors.push(`บรรทัด ${index + 2}: หมายเลขห้องไม่สามารถว่างได้`)
          }
          
          if (!unit.type) {
            errors.push(`บรรทัด ${index + 2}: ประเภทไม่สามารถว่างได้`)
          } else if (!['คอนโด', 'บ้าน', 'อาคาร', 'อื่นๆ'].includes(unit.type)) {
            errors.push(`บรรทัด ${index + 2}: ประเภทต้องเป็น คอนโด, บ้าน, อาคาร, หรือ อื่นๆ`)
          }
          
          if (unit.floor <= 0) {
            errors.push(`บรรทัด ${index + 2}: ชั้นต้องเป็นตัวเลขที่มากกว่า 0`)
          }
          
          if (unit.area <= 0) {
            errors.push(`บรรทัด ${index + 2}: ขนาด (ตร.ม.) ต้องเป็นตัวเลขที่มากกว่า 0`)
          }
          
          if (!unit.owner_name) {
            errors.push(`บรรทัด ${index + 2}: ชื่อเจ้าของไม่สามารถว่างได้`)
          }
          
          if (unit.owner_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(unit.owner_email)) {
            errors.push(`บรรทัด ${index + 2}: อีเมลเจ้าของไม่ถูกต้อง`)
          }
          
          if (unit.tenant_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(unit.tenant_email)) {
            errors.push(`บรรทัด ${index + 2}: อีเมลผู้เช่าไม่ถูกต้อง`)
          }
          
          if (!['มีผู้เช่า', 'เจ้าของอยู่เอง', 'ว่าง'].includes(unit.status)) {
            errors.push(`บรรทัด ${index + 2}: สถานะต้องเป็น มีผู้เช่า, เจ้าของอยู่เอง, หรือ ว่าง`)
          }
          
          if (errors.length > 0) {
            unit.errors = errors
          }
          
          return unit
        })
        
        resolve(units)
      } catch (error) {
        reject(error)
      }
    }
    
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsArrayBuffer(file)
  })
}

export function validateUnits(units: UnitImportData[], existingUnits: string[]): UnitImportData[] {
  return units.map(unit => {
    const errors: string[] = unit.errors || []
    
    // Check for duplicate unit numbers
    if (existingUnits.includes(unit.unit_number)) {
      errors.push(`หมายเลขห้อง ${unit.unit_number} ซ้ำกับข้อมูลที่มีอยู่แล้ว`)
    }
    
    // Check for duplicate in import batch
    const duplicateCount = units.filter(u => u.unit_number === unit.unit_number).length
    if (duplicateCount > 1) {
      errors.push(`หมายเลขห้อง ${unit.unit_number} ซ้ำในไฟล์ที่นำเข้า`)
    }
    
    if (errors.length > 0) {
      unit.errors = errors
    }
    
    return unit
  })
}

// Generate Excel template
export function generateExcelTemplate(): Blob {
  const ws = XLSX.utils.aoa_to_sheet([
    ['หมายเลขห้อง', 'ประเภท', 'ชั้น', 'ขนาด (ตร.ม.)', 'ห้องนอน', 'ห้องน้ำ', 'เจ้าของ', 'อีเมลเจ้าของ', 'ผู้เช่า', 'อีเมลผู้เช่า', 'สถานะ', 'ราคาเช่า'],
    ['1001', 'คอนโด', '10', '45.5', '2', '1', 'สมชาย ใจดี', 'somchai@email.com', 'ผู้เช่า 1', 'tenant1@email.com', 'มีผู้เช่า', '15000'],
    ['1002', 'คอนโด', '10', '50.0', '2', '2', 'สมหญิง รักดี', '', '', '', 'ว่าง', '20000'],
  ])
  
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Units')
  
  return new Blob([XLSX.write(wb, { bookType: 'xlsx', type: 'array' })], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  })
}