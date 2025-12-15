import * as XLSX from 'xlsx'

// Excel import utility for parcels
export interface ParcelImportData {
  unit_number: string
  recipient_name: string
  courier_company: string
  tracking_number?: string
  parcel_description?: string
  staff_received_by: string
  notes?: string
  errors?: string[]
}

export interface ParcelImportResult {
  success: boolean
  imported: number
  failed: number
  errors: ParcelImportData[]
}

export function parseExcelToParcels(file: File): Promise<ParcelImportData[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer)
        const workbook = XLSX.read(data, { type: 'array' })
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
        const jsonData = XLSX.utils.sheet_to_json(firstSheet)
        
        // Transform Excel data to parcels format
        const parcels: ParcelImportData[] = jsonData.map((row: any, index: number) => {
          const parcel: ParcelImportData = {
            unit_number: row['เลขห้อง'] || row['unit_number'] || '',
            recipient_name: row['ชื่อผู้รับ'] || row['recipient_name'] || '',
            courier_company: row['บริษัทขนส่ง'] || row['courier_company'] || '',
            tracking_number: row['หมายเลขติดตาม'] || row['tracking_number'] || undefined,
            parcel_description: row['รายละเอียด'] || row['parcel_description'] || undefined,
            staff_received_by: row['เจ้าหน้าที่รับ'] || row['staff_received_by'] || '',
            notes: row['หมายเหตุ'] || row['notes'] || undefined
          }
          
          // Collect validation errors
          const errors: string[] = []
          
          if (!parcel.unit_number) {
            errors.push(`บรรทัด ${index + 2}: เลขห้องไม่สามารถว่างได้`)
          }
          
          if (!parcel.recipient_name) {
            errors.push(`บรรทัด ${index + 2}: ชื่อผู้รับไม่สามารถว่างได้`)
          }
          
          if (!parcel.courier_company) {
            errors.push(`บรรทัด ${index + 2}: บริษัทขนส่งไม่สามารถว่างได้`)
          }
          
          if (!parcel.staff_received_by) {
            errors.push(`บรรทัด ${index + 2}: เจ้าหน้าที่รับไม่สามารถว่างได้`)
          }
          
          if (parcel.tracking_number && parcel.tracking_number.length > 100) {
            errors.push(`บรรทัด ${index + 2}: หมายเลขติดตามยาวเกินไป`)
          }
          
          if (errors.length > 0) {
            parcel.errors = errors
          }
          
          return parcel
        })
        
        resolve(parcels)
      } catch (error) {
        reject(new Error('ไม่สามารถอ่านไฟล์ Excel ได้: ' + (error as Error).message))
      }
    }
    
    reader.onerror = () => {
      reject(new Error('เกิดข้อผิดพลาดในการอ่านไฟล์'))
    }
    
    reader.readAsArrayBuffer(file)
  })
}

export function validateParcels(
  parcels: ParcelImportData[],
  existingUnitNumbers: string[]
): ParcelImportData[] {
  return parcels.map((parcel) => {
    const errors: string[] = parcel.errors || []
    
    // Check for duplicate unit numbers in the import
    const sameUnitParcels = parcels.filter(p => p.unit_number === parcel.unit_number)
    if (sameUnitParcels.length > 1) {
      errors.push('พบเลขห้องซ้ำในการนำเข้าครั้งนี้')
    }
    
    // Note: We don't block if unit doesn't exist yet (might be valid)
    // But we warn about it
    
    if (errors.length > 0) {
      parcel.errors = errors
    }
    
    return parcel
  })
}

export function generateExcelTemplate() {
  const data = [
    ['เลขห้อง', 'ชื่อผู้รับ', 'บริษัทขนส่ง', 'หมายเลขติดตาม', 'รายละเอียด', 'เจ้าหน้าที่รับ', 'หมายเหตุ']
  ]
  
  const ws = XLSX.utils.aoa_to_sheet(data)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'พัสดุ')
  
  // Set column widths
  ws['!cols'] = [
    { wch: 12 },  // เลขห้อง
    { wch: 20 },  // ชื่อผู้รับ
    { wch: 15 },  // บริษัทขนส่ง
    { wch: 20 },  // หมายเลขติดตาม
    { wch: 30 },  // รายละเอียด
    { wch: 15 },  // เจ้าหน้าที่รับ
    { wch: 30 }   // หมายเหตุ
  ]
  
  XLSX.writeFile(wb, 'parcel_import_template.xlsx')
}


















