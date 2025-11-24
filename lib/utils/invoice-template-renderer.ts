/**
 * Invoice Template Renderer
 * Render invoice using template from database
 */

import { Settings } from "@/lib/settings-context"

interface InvoiceTemplate {
  id: string
  template_name: string
  template_type: string
  header_logo_url?: string
  header_company_name?: string
  header_address?: string
  header_phone?: string
  header_email?: string
  header_tax_id?: string
  footer_text?: string
  footer_bank_accounts?: any
  layout_settings?: {
    primaryColor?: string
    secondaryColor?: string
    fontFamily?: string
    fontSize?: string
    lineHeight?: string
  }
}

interface BillData {
  id: string
  bill_number: string
  month: string
  year?: number
  due_date?: string
  common_fee?: number
  water_fee?: number
  electricity_fee?: number
  parking_fee?: number
  other_fee?: number
  total?: number
  unit_number?: string
  owner_name?: string
}

/**
 * Render invoice HTML using template
 */
export function renderInvoiceWithTemplate(
  template: InvoiceTemplate,
  bill: BillData,
  unitInfo: any,
  settings: Settings,
  language: 'th' | 'en' = 'th'
): string {
  const colors = template.layout_settings || {}
  const primaryColor = colors.primaryColor || '#1e40af'
  const secondaryColor = colors.secondaryColor || '#3b82f6'
  const fontFamily = colors.fontFamily || 'Sarabun, sans-serif'

  // Format currency
  const formatCurrency = (amount: number | null | undefined): string => {
    const num = amount || 0
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num)
  }

  // Format date
  const formatDate = (date: string | undefined): string => {
    if (!date) return '-'
    try {
      return new Date(date).toLocaleDateString('th-TH', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    } catch {
      return date
    }
  }

  const translations = {
    th: {
      invoice: 'ใบแจ้งหนี้',
      forMonth: 'สำหรับเดือน',
      unitNumber: 'เลขที่ห้อง',
      ownerName: 'เจ้าของ',
      billNumber: 'เลขที่บิล',
      documentDate: 'วันที่เอกสาร',
      dueDate: 'วันครบกำหนดชำระ',
      commonFee: 'ค่าส่วนกลาง',
      waterFee: 'ค่าน้ำ',
      electricityFee: 'ค่าไฟฟ้า',
      parkingFee: 'ค่าที่จอดรถ',
      otherFee: 'อื่นๆ',
      total: 'รวมทั้งหมด',
      pleasePay: 'กรุณาชำระเงินภายในวันที่กำหนด',
    },
    en: {
      invoice: 'Invoice',
      forMonth: 'For Month',
      unitNumber: 'Unit Number',
      ownerName: 'Owner',
      billNumber: 'Bill Number',
      documentDate: 'Document Date',
      dueDate: 'Due Date',
      commonFee: 'Common Fee',
      waterFee: 'Water Fee',
      electricityFee: 'Electricity Fee',
      parkingFee: 'Parking Fee',
      otherFee: 'Other',
      total: 'Total',
      pleasePay: 'Please pay within the due date',
    },
  }

  const t = translations[language]

  const html = `
<!DOCTYPE html>
<html lang="${language}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${t.invoice}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;500;600;700&display=swap');
    
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: ${fontFamily};
      line-height: ${colors.lineHeight || '1.6'};
      color: #333;
      background: #fff;
      padding: 20px;
    }
    
    .invoice-container {
      max-width: 800px;
      margin: 0 auto;
      background: white;
      padding: 40px;
      box-shadow: 0 0 10px rgba(0,0,0,0.1);
    }
    
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 30px;
      padding-bottom: 20px;
      border-bottom: 2px solid ${primaryColor};
    }
    
    .header-left {
      flex: 1;
    }
    
    .logo {
      max-height: 80px;
      margin-bottom: 10px;
    }
    
    .company-name {
      font-size: 24px;
      font-weight: bold;
      color: ${primaryColor};
      margin-bottom: 10px;
    }
    
    .company-details {
      font-size: 14px;
      color: #666;
      line-height: 1.8;
    }
    
    .invoice-title {
      text-align: right;
    }
    
    .invoice-title h1 {
      font-size: 32px;
      color: ${primaryColor};
      margin-bottom: 10px;
    }
    
    .invoice-meta {
      font-size: 14px;
      color: #666;
    }
    
    .bill-info {
      background: #f8f9fa;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 30px;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 15px;
    }
    
    .bill-info-item {
      display: flex;
      justify-content: space-between;
    }
    
    .bill-info-label {
      font-weight: 600;
      color: #666;
    }
    
    .items-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 30px;
    }
    
    .items-table thead {
      background: ${secondaryColor};
      color: white;
    }
    
    .items-table th {
      padding: 12px;
      text-align: left;
      font-weight: 600;
    }
    
    .items-table th:last-child {
      text-align: right;
    }
    
    .items-table td {
      padding: 12px;
      border-bottom: 1px solid #e9ecef;
    }
    
    .items-table td:last-child {
      text-align: right;
    }
    
    .items-table tbody tr:hover {
      background: #f8f9fa;
    }
    
    .total-row {
      background: #f3f4f6;
      font-weight: bold;
      font-size: 18px;
    }
    
    .total-row td {
      border-top: 2px solid ${primaryColor};
      color: ${primaryColor};
    }
    
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #e9ecef;
      text-align: center;
      font-size: 12px;
      color: #666;
    }
    
    .footer-text {
      margin-bottom: 10px;
    }
    
    .payment-note {
      background: #fff3cd;
      padding: 15px;
      border-radius: 5px;
      margin-top: 20px;
      text-align: center;
      color: #856404;
    }
    
    @media print {
      body {
        padding: 0;
      }
      
      .invoice-container {
        box-shadow: none;
        padding: 0;
      }
      
      @page {
        margin: 1cm;
      }
    }
  </style>
</head>
<body>
  <div class="invoice-container">
    <!-- Header -->
    <div class="header">
      <div class="header-left">
        ${template.header_logo_url ? `<img src="${template.header_logo_url}" alt="Logo" class="logo" />` : ''}
        ${template.header_company_name ? `<div class="company-name">${template.header_company_name}</div>` : ''}
        <div class="company-details">
          ${template.header_address ? `<div>${template.header_address}</div>` : ''}
          ${template.header_phone || template.header_email ? `
            <div>
              ${template.header_phone ? `📞 ${template.header_phone}` : ''}
              ${template.header_phone && template.header_email ? ' | ' : ''}
              ${template.header_email ? `✉️ ${template.header_email}` : ''}
            </div>
          ` : ''}
          ${template.header_tax_id ? `<div>เลขประจำตัวผู้เสียภาษี: ${template.header_tax_id}</div>` : ''}
        </div>
      </div>
      <div class="invoice-title">
        <h1>${t.invoice}</h1>
        <div class="invoice-meta">
          <div>${t.billNumber}: ${bill.bill_number || '-'}</div>
          <div>${t.documentDate}: ${new Date().toLocaleDateString('th-TH')}</div>
        </div>
      </div>
    </div>

    <!-- Bill Info -->
    <div class="bill-info">
      <div class="bill-info-item">
        <span class="bill-info-label">${t.unitNumber}:</span>
        <span>${unitInfo?.unit_number || bill.unit_number || '-'}</span>
      </div>
      <div class="bill-info-item">
        <span class="bill-info-label">${t.ownerName}:</span>
        <span>${unitInfo?.owner_name || bill.owner_name || '-'}</span>
      </div>
      <div class="bill-info-item">
        <span class="bill-info-label">${t.forMonth}:</span>
        <span>${bill.month || '-'}</span>
      </div>
      <div class="bill-info-item">
        <span class="bill-info-label">${t.dueDate}:</span>
        <span>${formatDate(bill.due_date)}</span>
      </div>
    </div>

    <!-- Items Table -->
    <table class="items-table">
      <thead>
        <tr>
          <th>รายการ</th>
          <th style="text-align: right;">จำนวนเงิน</th>
        </tr>
      </thead>
      <tbody>
        ${bill.common_fee && bill.common_fee > 0 ? `
          <tr>
            <td>${t.commonFee}</td>
            <td>${formatCurrency(bill.common_fee)}</td>
          </tr>
        ` : ''}
        ${bill.water_fee && bill.water_fee > 0 ? `
          <tr>
            <td>${t.waterFee}</td>
            <td>${formatCurrency(bill.water_fee)}</td>
          </tr>
        ` : ''}
        ${bill.electricity_fee && bill.electricity_fee > 0 ? `
          <tr>
            <td>${t.electricityFee}</td>
            <td>${formatCurrency(bill.electricity_fee)}</td>
          </tr>
        ` : ''}
        ${bill.parking_fee && bill.parking_fee > 0 ? `
          <tr>
            <td>${t.parkingFee}</td>
            <td>${formatCurrency(bill.parking_fee)}</td>
          </tr>
        ` : ''}
        ${bill.other_fee && bill.other_fee > 0 ? `
          <tr>
            <td>${t.otherFee}</td>
            <td>${formatCurrency(bill.other_fee)}</td>
          </tr>
        ` : ''}
        <tr class="total-row">
          <td>${t.total}</td>
          <td>${formatCurrency(bill.total)}</td>
        </tr>
      </tbody>
    </table>

    <!-- Payment Note -->
    <div class="payment-note">
      <strong>${t.pleasePay}</strong>
    </div>

    <!-- Footer -->
    ${template.footer_text ? `
      <div class="footer">
        <div class="footer-text">${template.footer_text}</div>
      </div>
    ` : ''}
  </div>
</body>
</html>
  `.trim()

  return html
}

/**
 * Get default template from database
 */
export async function getDefaultInvoiceTemplate(
  supabase: any,
  projectId?: string | null
): Promise<InvoiceTemplate | null> {
  try {
    let query = supabase
      .from('invoice_templates')
      .select('*')
      .eq('is_active', true)
      .order('is_default', { ascending: false })
      .limit(1)

    if (projectId) {
      query = query.or(`project_id.eq.${projectId},project_id.is.null`)
    } else {
      query = query.is('project_id', null)
    }

    const { data, error } = await query.maybeSingle()

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('[Invoice Template] Error:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('[Invoice Template] Error:', error)
    return null
  }
}

