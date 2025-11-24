// lib/utils/billing-accounts.ts
// Helper functions for mapping billing items to chart of accounts

/**
 * Account Code Mapping สำหรับระบบออกบิล
 * สอดคล้องกับผังบัญชี (Chart of Accounts)
 */
export const BILLING_ACCOUNT_CODES = {
  COMMON_FEE: '4101',      // รายได้ค่าส่วนกลาง
  WATER_FEE: '4102',        // รายได้ค่าน้ำ
  ELECTRICITY_FEE: '4103',  // รายได้ค่าไฟฟ้า
  PARKING_FEE: '4104',     // รายได้ค่าที่จอดรถ
  OTHER_FEE: '4203',       // รายได้เบ็ดเตล็ด
} as const

/**
 * Mapping bill item types to account codes
 */
export function getAccountCodeForBillItem(itemType: string): string {
  switch (itemType) {
    case 'common_fee':
      return BILLING_ACCOUNT_CODES.COMMON_FEE
    case 'water_fee':
      return BILLING_ACCOUNT_CODES.WATER_FEE
    case 'electricity_fee':
      return BILLING_ACCOUNT_CODES.ELECTRICITY_FEE
    case 'parking_fee':
      return BILLING_ACCOUNT_CODES.PARKING_FEE
    case 'other_fee':
      return BILLING_ACCOUNT_CODES.OTHER_FEE
    default:
      return BILLING_ACCOUNT_CODES.OTHER_FEE
  }
}

/**
 * Get account name for a bill item type
 */
export async function getAccountNameForBillItem(
  itemType: string,
  supabase: any
): Promise<string> {
  const accountCode = getAccountCodeForBillItem(itemType)
  const { data } = await supabase
    .from('chart_of_accounts')
    .select('account_name')
    .eq('account_code', accountCode)
    .single()
  
  return data?.account_name || ''
}

/**
 * Create revenue journal entries from bill data
 * สร้างรายการใน revenue_journal จากข้อมูลบิล
 */
export async function createRevenueJournalEntries(
  bill: {
    id: string
    unit_id: string
    bill_number: string
    month: string
    year: number
    common_fee?: number
    water_fee?: number
    electricity_fee?: number
    parking_fee?: number
    other_fee?: number
    project_id?: string | null
  },
  supabase: any
): Promise<void> {
  const billDate = new Date(`${bill.month}-01`)
  const journalDate = billDate.toISOString().split('T')[0]
  
  const entries: any[] = []
  
  // ค่าส่วนกลาง
  if ((bill.common_fee || 0) > 0) {
    entries.push({
      journal_date: journalDate,
      account_code: getAccountCodeForBillItem('common_fee'),
      unit_id: bill.unit_id,
      bill_id: bill.id,
      description: `ค่าส่วนกลาง ${bill.month}`,
      amount: bill.common_fee,
      reference_number: bill.bill_number,
      project_id: bill.project_id || null,
    })
  }
  
  // ค่าน้ำ
  if ((bill.water_fee || 0) > 0) {
    entries.push({
      journal_date: journalDate,
      account_code: getAccountCodeForBillItem('water_fee'),
      unit_id: bill.unit_id,
      bill_id: bill.id,
      description: `ค่าน้ำ ${bill.month}`,
      amount: bill.water_fee,
      reference_number: bill.bill_number,
      project_id: bill.project_id || null,
    })
  }
  
  // ค่าไฟ
  if ((bill.electricity_fee || 0) > 0) {
    entries.push({
      journal_date: journalDate,
      account_code: getAccountCodeForBillItem('electricity_fee'),
      unit_id: bill.unit_id,
      bill_id: bill.id,
      description: `ค่าไฟฟ้า ${bill.month}`,
      amount: bill.electricity_fee,
      reference_number: bill.bill_number,
      project_id: bill.project_id || null,
    })
  }
  
  // ค่าจอดรถ
  if ((bill.parking_fee || 0) > 0) {
    entries.push({
      journal_date: journalDate,
      account_code: getAccountCodeForBillItem('parking_fee'),
      unit_id: bill.unit_id,
      bill_id: bill.id,
      description: `ค่าที่จอดรถ ${bill.month}`,
      amount: bill.parking_fee,
      reference_number: bill.bill_number,
      project_id: bill.project_id || null,
    })
  }
  
  // อื่นๆ
  if ((bill.other_fee || 0) > 0) {
    entries.push({
      journal_date: journalDate,
      account_code: getAccountCodeForBillItem('other_fee'),
      unit_id: bill.unit_id,
      bill_id: bill.id,
      description: `รายได้อื่นๆ ${bill.month}`,
      amount: bill.other_fee,
      reference_number: bill.bill_number,
      project_id: bill.project_id || null,
    })
  }
  
  // บันทึกรายการทั้งหมด (ถ้ามี)
  if (entries.length > 0) {
    // ลบรายการเก่าที่เชื่อมโยงกับบิลนี้ (กรณี update)
    await supabase
      .from('revenue_journal')
      .delete()
      .eq('bill_id', bill.id)
    
    // สร้างรายการใหม่
    const { error } = await supabase
      .from('revenue_journal')
      .insert(entries)
    
    if (error) {
      console.error('[Billing] Error creating revenue journal entries:', error)
      throw error
    }
  }
}

/**
 * Get account code mapping for display
 */
export function getAccountCodeMapping() {
  return {
    common_fee: {
      code: BILLING_ACCOUNT_CODES.COMMON_FEE,
      name: 'รายได้ค่าส่วนกลาง',
    },
    water_fee: {
      code: BILLING_ACCOUNT_CODES.WATER_FEE,
      name: 'รายได้ค่าน้ำ',
    },
    electricity_fee: {
      code: BILLING_ACCOUNT_CODES.ELECTRICITY_FEE,
      name: 'รายได้ค่าไฟฟ้า',
    },
    parking_fee: {
      code: BILLING_ACCOUNT_CODES.PARKING_FEE,
      name: 'รายได้ค่าที่จอดรถ',
    },
    other_fee: {
      code: BILLING_ACCOUNT_CODES.OTHER_FEE,
      name: 'รายได้เบ็ดเตล็ด',
    },
  }
}

