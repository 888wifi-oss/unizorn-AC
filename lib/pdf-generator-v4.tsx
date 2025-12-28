import jsPDF from "jspdf";
import { formatDate } from "./date-formatter";
import { Settings } from "./settings-context";

// Language types
export type PDFLanguage = "th" | "en";

// Translation objects (Fallback if settings not present)
const defaultTranslations = {
  th: {
    invoice: "ใบแจ้งหนี้",
    receipt: "ใบเสร็จรับเงิน",
    forMonth: "สำหรับเดือน",
    unitNumber: "เลขที่ห้อง",
    ownerName: "ได้รับเงินจาก",
    billNumber: "เลขที่",
    documentDate: "วันที่",
    dueDate: "วันครบกำหนดชำระ",
    commonFee: "ค่าส่วนกลาง",
    waterFee: "ค่าน้ำ",
    electricityFee: "ค่าไฟ",
    parkingFee: "ค่าที่จอดรถ",
    otherFee: "ค่าใช้จ่ายอื่นๆ",
    totalAmount: "ยอดรวมทั้งสิ้น",
    pleasePay: "กรุณาชำระเงินภายในวันที่กำหนด",
    issuedBy: "ผู้รับเงิน",
    authorizedBy: "ผู้จัดการ",
    receivedFrom: "ได้รับเงินจาก",
    receiptNumber: "เลขที่",
    paymentDate: "วันที่",
    paymentItem: "รายการชำระสำหรับใบแจ้งหนี้",
    monthlyFee: "ค่าใช้จ่ายประจำเดือน",
    totalPaid: "ยอดรวมที่ชำระ",
    thankYou: "ขอขอบคุณที่ชำระค่าบริการ",
    original: "(ต้นฉบับ)",
    copy: "(สำเนา)",
    bahtText: "บาทถ้วน"
  },
  en: {
    invoice: "Invoice",
    receipt: "Receipt",
    forMonth: "For Month",
    unitNumber: "Unit Number",
    ownerName: "Received From",
    billNumber: "No.",
    documentDate: "Date",
    dueDate: "Due Date",
    commonFee: "Common Fee",
    waterFee: "Water Fee",
    electricityFee: "Electricity Fee",
    parkingFee: "Parking Fee",
    otherFee: "Other Fees",
    totalAmount: "Total Amount",
    pleasePay: "Please pay within the due date",
    issuedBy: "Receiver",
    authorizedBy: "Manager",
    receivedFrom: "Received From",
    receiptNumber: "No.",
    paymentDate: "Date",
    paymentItem: "Payment Item",
    monthlyFee: "Monthly Fee",
    totalPaid: "Total Paid",
    thankYou: "Thank you for your payment",
    original: "(Original)",
    copy: "(Copy)",
    bahtText: "Baht Only"
  }
};

// Helper function to format currency within the PDF using the provided settings
const formatCurrencyForPDF = (amount: number | string | null | undefined, settings: Settings) => {
  // Convert to number and handle null/undefined
  const numAmount = typeof amount === 'string' ? parseFloat(amount) || 0 : (amount || 0);

  const options: Intl.NumberFormatOptions = {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    style: 'currency',
    currency: settings.currency || 'THB'
  }
  const locale = (settings.currency === 'THB' || !settings.currency) ? 'th-TH' : 'en-US';
  return new Intl.NumberFormat(locale, options).format(numAmount);
};

// Helper to get invoice settings with safe defaults
const getInvoiceSettings = (settings: Settings) => {
  return settings.invoice || {
    companyName: "นิติบุคคลอาคารชุด",
    address: "",
    taxId: "",
    logoUrl: "",
    accentColor: "#000000",
    copyCount: 1,
    headerText: {
      invoice: { th: "ใบแจ้งหนี้", en: "Invoice" },
      receipt: { th: "ใบเสร็จรับเงิน", en: "Receipt" }
    },
    note: ""
  }
}

// Generate the HTML for a SINGLE Receipt/Invoice block
const createSingleDocHTML = (
  data: any,
  type: 'invoice' | 'receipt',
  isCopy: boolean,
  settings: Settings,
  language: PDFLanguage,
  t: any
) => {
  const invSettings = getInvoiceSettings(settings);

  // Data mapping based on type
  const docNumber = type === 'invoice' ? data.bill.bill_number : data.payment.reference_number;
  const docDate = type === 'invoice'
    ? formatDate(new Date().toISOString(), 'medium', settings.yearType)
    : (data.payment.payment_date ? formatDate(data.payment.payment_date, 'medium', settings.yearType) : 'N/A');

  const docTitle = type === 'invoice'
    ? invSettings.headerText?.invoice?.[language] || t.invoice
    : invSettings.headerText?.receipt?.[language] || t.receipt;

  const copyLabel = isCopy ? t.copy : t.original;

  // Items rows HTML
  let itemsRows = '';
  let totalAmount = 0;

  if (type === 'invoice') {
    const bill = data.bill;
    totalAmount = bill.total;
    if (bill.common_fee > 0) itemsRows += `<tr><td class="center">1</td><td class="center">${bill.bill_number}</td><td>${t.commonFee} (${bill.month})</td><td class="right">${formatCurrencyForPDF(bill.common_fee, settings)}</td><td class="right">${formatCurrencyForPDF(bill.common_fee, settings)}</td></tr>`;
    if (bill.water_fee > 0) itemsRows += `<tr><td class="center"></td><td class="center"></td><td>${t.waterFee}</td><td class="right">${formatCurrencyForPDF(bill.water_fee, settings)}</td><td class="right">${formatCurrencyForPDF(bill.water_fee, settings)}</td></tr>`;
    if (bill.electricity_fee > 0) itemsRows += `<tr><td class="center"></td><td class="center"></td><td>${t.electricityFee}</td><td class="right">${formatCurrencyForPDF(bill.electricity_fee, settings)}</td><td class="right">${formatCurrencyForPDF(bill.electricity_fee, settings)}</td></tr>`;
    if (bill.parking_fee > 0) itemsRows += `<tr><td class="center"></td><td class="center"></td><td>${t.parkingFee}</td><td class="right">${formatCurrencyForPDF(bill.parking_fee, settings)}</td><td class="right">${formatCurrencyForPDF(bill.parking_fee, settings)}</td></tr>`;
    if (bill.other_fee > 0) itemsRows += `<tr><td class="center"></td><td class="center"></td><td>${t.otherFee}</td><td class="right">${formatCurrencyForPDF(bill.other_fee, settings)}</td><td class="right">${formatCurrencyForPDF(bill.other_fee, settings)}</td></tr>`;
  } else {
    const payment = data.payment;
    const bill = data.bill;
    totalAmount = payment.amount;
    itemsRows += `<tr><td class="center">1</td><td class="center">${bill?.bill_number || '-'}</td><td>${t.monthlyFee} ${bill?.month || ''}</td><td class="right">${formatCurrencyForPDF(payment.amount, settings)}</td><td class="right">${formatCurrencyForPDF(payment.amount, settings)}</td></tr>`;
  }

  // Fill empty rows to maintain height
  const minRows = 8; // Adjust based on paper size
  // simplified logic - just adding a spacer row that takes remaining height could work, but fixed rows is easier for PDF consistency
  for (let i = 0; i < 4; i++) {
    itemsRows += `<tr style="height: 24px;"><td class="border-x"></td><td class="border-x"></td><td class="border-x"></td><td class="border-x"></td><td class="border-x"></td></tr>`;
  }

  return `
     <div class="doc-container ${isCopy ? 'copy-version' : ''}" style="border-right: ${isCopy ? 'none' : '1px dashed #ccc'}">
        <!-- Header -->
        <div class="header-row">
            <div class="company-info">
                ${invSettings.logoUrl ? `<img src="${invSettings.logoUrl}" class="logo" />` : ''}
                <div class="company-name" style="color: ${invSettings.accentColor}">${invSettings.companyName}</div>
                <div class="company-address">${invSettings.address}</div>
                <div class="tax-id">เลขประจำตัวผู้เสียภาษี ${invSettings.taxId}</div>
            </div>
            <div class="doc-meta">
                <div class="doc-title-box" style="border-color: ${invSettings.accentColor}">
                    ${docTitle} <span class="doc-type-label">${copyLabel}</span>
                </div>
                <div class="meta-row"><span class="label">${type === 'invoice' ? t.billNumber : t.receiptNumber}:</span> ${docNumber}</div>
            </div>
        </div>

        <!-- Customer Info -->
        <div class="customer-section">
            <div class="customer-left">
                <div class="info-row"><span class="label">${t.receivedFrom}:</span> ${data.unit?.owner_name || '-'}</div>
                <div class="info-row"><span class="label">ที่อยู่:</span> ${invSettings.address}</div> 
            </div>
            <div class="customer-right">
                 <div class="info-row"><span class="label">${t.documentDate}:</span> ${docDate}</div>
                 <div class="info-row"><span class="label">บ้านเลขที่:</span> ${data.unit?.unit_number || '-'}</div>
                 <div class="info-row"><span class="label">หมายเลขห้องชุด:</span> ${data.unitInfo?.ratio || data.unit?.unit_number || '-'}</div>
            </div>
        </div>

        <!-- Table -->
        <table class="items-table">
            <thead>
                <tr>
                    <th style="width: 40px;" class="center">ลำดับ</th>
                    <th style="width: 100px;" class="center">ใบแจ้งหนี้</th>
                    <th class="left">รายการ</th>
                    <th style="width: 80px;" class="right">ราคา</th>
                    <th style="width: 80px;" class="right">จำนวนเงิน</th>
                </tr>
            </thead>
            <tbody>
                ${itemsRows}
            </tbody>
            <tfoot>
                <tr class="total-row">
                    <td colspan="3" class="text-baht left">(${t.totalAmount} ${t.bahtText})</td>
                    <td class="right label">รวม</td>
                    <td class="right">${formatCurrencyForPDF(totalAmount, settings)}</td>
                </tr>
            </tfoot>
        </table>

        <!-- Footer -->
        <div class="footer-section">
            <div class="payment-info">
                <div class="info-row"><span class="label">ชำระโดย:</span> เงินโอน/เงินสด</div>
                <div class="info-row note-row"><span class="label">หมายเหตุ:</span> ${invSettings.note || '-'}</div>
            </div>
        </div>

        <!-- Signatures -->
        <div class="signatures">
            <div class="sign-box">
                <div class="sign-line"></div>
                <div>${t.issuedBy}</div>
                <div class="sign-name">(${invSettings.companyName})</div>
            </div>
            <div class="sign-box">
                <div class="sign-line"></div>
                <div>${t.authorizedBy}</div>
                <div class="sign-name">(.......................................................)</div>
            </div>
        </div>

        <div class="timestamp">
            เอกสารฉบับนี้พิมพ์ ณ วันที่ ${new Date().toLocaleDateString('th-TH')} เวลา ${new Date().toLocaleTimeString('th-TH')}
        </div>
     </div>
   `;
}

const createFullPageHTML = (data: any, type: 'invoice' | 'receipt', settings: Settings, language: PDFLanguage) => {
  const t = defaultTranslations[language];
  const invSettings = getInvoiceSettings(settings);
  const isDouble = invSettings.copyCount === 2;

  const originalHTML = createSingleDocHTML(data, type, false, settings, language, t);
  const copyHTML = isDouble ? createSingleDocHTML(data, type, true, settings, language, t) : '';

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>${type === 'invoice' ? t.invoice : t.receipt}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;500;600;700&display=swap');
        
        @page {
            size: ${isDouble ? 'A4 landscape' : 'A4 portrait'};
            margin: 0;
        }

        body {
          font-family: 'Sarabun', sans-serif;
          margin: 0;
          padding: 20px;
          box-sizing: border-box;
          background: white;
          width: ${isDouble ? '297mm' : '210mm'};
          height: ${isDouble ? '210mm' : '297mm'};
        }

        .page-container {
            display: flex;
            width: 100%;
            height: 100%;
        }

        .doc-container {
            flex: 1;
            padding: 20px;
            display: flex;
            flex-direction: column;
            max-width: ${isDouble ? '50%' : '100%'};
        }

        .copy-version {
            padding-left: 40px; /* Add some spacing for the gutter if needed */
        }
        
        .header-row { margin-bottom: 15px; display: flex; justify-content: space-between; align-items: flex-start; }
        .company-name { font-size: 16px; font-weight: bold; margin-bottom: 4px; }
        .company-address { font-size: 12px; color: #444; width: 80%; line-height: 1.3; }
        .tax-id { font-size: 12px; margin-top: 4px; }
        
        .doc-title-box { 
            border: 1px solid black; 
            padding: 5px 15px; 
            font-weight: bold; 
            font-size: 16px; 
            margin-bottom: 5px; 
            display: inline-block;
            text-align: center;
        }
        .doc-type-label { font-size: 12px; font-weight: normal; }
        
        .customer-section { 
            border: 1px solid #ccc; 
            display: flex; 
            font-size: 12px;
            margin-bottom: 15px;
        }
        .customer-left { width: 60%; padding: 8px; border-right: 1px solid #ccc; }
        .customer-right { width: 40%; padding: 8px; }
        .info-row { margin-bottom: 4px; display: flex; }
        .info-row .label { font-weight: bold; width: 100px; display: inline-block; }
        
        table.items-table { width: 100%; border-collapse: collapse; font-size: 12px; margin-bottom: 15px; }
        table.items-table th { border: 1px solid #000; padding: 5px; background: #f0f0f0; }
        table.items-table td { border-left: 1px solid #000; border-right: 1px solid #000; padding: 5px; vertical-align: top; }
        table.items-table td.border-x { border-left: 1px solid #000; border-right: 1px solid #000; border-bottom: none; border-top: none; }
        
        .total-row td { border: 1px solid #000; font-weight: bold; }
        
        .center { text-align: center; }
        .right { text-align: right; }
        .left { text-align: left; }
        
        .footer-section { font-size: 12px; border: 1px solid #ccc; padding: 8px; margin-bottom: 20px; }
        .note-row { margin-top: 5px; color: #666; }
        
        .signatures { display: flex; justify-content: space-around; margin-top: 20px; text-align: center; font-size: 12px; }
        .sign-box { width: 40%; }
        .sign-line { border-bottom: 1px solid #000; height: 30px; margin-bottom: 5px; }
        .sign-name { margin-top: 2px; font-size: 10px; color: #666; }
        
        .timestamp { font-size: 9px; color: #999; text-align: right; margin-top: auto; }

        @media print {
             @page {
                size: ${isDouble ? 'A4 landscape' : 'A4 portrait'};
                margin: 0;
            }
        }
      </style>
    </head>
    <body onload="window.print()">
      <div class="page-container">
        ${originalHTML}
        ${copyHTML}
      </div>
    </body>
    </html>
    `;
};


export const generateBillPDFV4 = async (bill: any, unitInfo: any, settings: Settings, language: PDFLanguage = "en") => {
  // Combine data
  const data = { bill, unitInfo, unit: unitInfo }; // unitInfo typically has unit details
  const html = createFullPageHTML(data, 'invoice', settings, language);

  // Open in new window
  const newWindow = window.open('', '_blank');
  if (newWindow) {
    newWindow.document.write(html);
    newWindow.document.close();
  }
}

export const generateReceiptPDFV4 = async (payment: any, bill: any, unit: any, settings: Settings, language: PDFLanguage = "en") => {
  // Combine data
  const data = { payment, bill, unit, unitInfo: unit };
  const html = createFullPageHTML(data, 'receipt', settings, language);

  // Open in new window
  const newWindow = window.open('', '_blank');
  if (newWindow) {
    newWindow.document.write(html);
    newWindow.document.close();
  }
}
