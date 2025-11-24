import jsPDF from "jspdf";
import { formatDate } from "./date-formatter";
import { Settings } from "./settings-context";

// Language types
export type PDFLanguage = "th" | "en";

// Translation objects
const translations = {
  th: {
    invoice: "ใบแจ้งหนี้",
    receipt: "ใบเสร็จรับเงิน",
    forMonth: "สำหรับเดือน",
    unitNumber: "เลขที่ห้อง",
    ownerName: "เจ้าของร่วม",
    billNumber: "เลขที่ใบแจ้งหนี้",
    documentDate: "วันที่เอกสาร",
    dueDate: "วันครบกำหนดชำระ",
    commonFee: "ค่าส่วนกลาง",
    waterFee: "ค่าน้ำ",
    electricityFee: "ค่าไฟ",
    parkingFee: "ค่าที่จอดรถ",
    otherFee: "ค่าใช้จ่ายอื่นๆ",
    totalAmount: "ยอดรวมทั้งสิ้น",
    pleasePay: "กรุณาชำระเงินภายในวันที่กำหนด",
    issuedBy: "ออกโดย",
    receivedFrom: "ได้รับเงินจาก",
    receiptNumber: "เลขที่ใบเสร็จ",
    paymentDate: "วันที่รับชำระ",
    paymentItem: "รายการชำระสำหรับใบแจ้งหนี้",
    monthlyFee: "ค่าใช้จ่ายประจำเดือน",
    totalPaid: "ยอดรวมที่ชำระ",
    thankYou: "ขอขอบคุณที่ชำระค่าบริการ"
  },
  en: {
    invoice: "Invoice",
    receipt: "Receipt",
    forMonth: "For Month",
    unitNumber: "Unit Number",
    ownerName: "Owner Name",
    billNumber: "Bill Number",
    documentDate: "Document Date",
    dueDate: "Due Date",
    commonFee: "Common Fee",
    waterFee: "Water Fee",
    electricityFee: "Electricity Fee",
    parkingFee: "Parking Fee",
    otherFee: "Other Fees",
    totalAmount: "Total Amount",
    pleasePay: "Please pay within the due date",
    issuedBy: "Issued by",
    receivedFrom: "Received From",
    receiptNumber: "Receipt Number",
    paymentDate: "Payment Date",
    paymentItem: "Payment Item",
    monthlyFee: "Monthly Fee",
    totalPaid: "Total Paid",
    thankYou: "Thank you for your payment"
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

// Helper function to create HTML template for PDF
const createHTMLTemplate = (bill: any, unitInfo: any, settings: Settings, language: PDFLanguage) => {
  const t = translations[language];
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>${t.invoice}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;500;600;700&display=swap');
        body {
          font-family: 'Sarabun', sans-serif;
          margin: 0;
          padding: 20px;
          font-size: 12px;
          line-height: 1.4;
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
        }
        .title {
          font-size: 24px;
          font-weight: 700;
          margin-bottom: 10px;
        }
        .subtitle {
          font-size: 14px;
          margin-bottom: 20px;
        }
        .info-section {
          display: flex;
          justify-content: space-between;
          margin-bottom: 20px;
        }
        .info-left, .info-right {
          width: 48%;
        }
        .info-item {
          margin-bottom: 8px;
        }
        .label {
          font-weight: 600;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin: 20px 0;
        }
        th, td {
          border: 1px solid #ddd;
          padding: 8px;
          text-align: left;
        }
        th {
          background-color: #16a34a;
          color: white;
          font-weight: 600;
        }
        .total-row {
          background-color: #f0f0f0;
          font-weight: 600;
        }
        .footer {
          margin-top: 30px;
          font-size: 10px;
        }
        .footer-left {
          float: left;
        }
        .footer-right {
          float: right;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="title">${t.invoice}</div>
        <div class="subtitle">${t.forMonth}: ${bill.month || 'N/A'}</div>
      </div>
      
      <div class="info-section">
        <div class="info-left">
          <div class="info-item">
            <span class="label">${t.unitNumber}:</span> ${unitInfo?.unitNumber || 'N/A'}
          </div>
          <div class="info-item">
            <span class="label">${t.ownerName}:</span> ${unitInfo?.ownerName || 'N/A'}
          </div>
        </div>
        <div class="info-right">
          <div class="info-item">
            <span class="label">${t.billNumber}:</span> ${bill.bill_number || 'N/A'}
          </div>
          <div class="info-item">
            <span class="label">${t.documentDate}:</span> ${formatDate(new Date().toISOString(), 'medium', settings.yearType)}
          </div>
          <div class="info-item">
            <span class="label">${t.dueDate}:</span> ${bill.due_date ? formatDate(bill.due_date, 'medium', settings.yearType) : 'N/A'}
          </div>
        </div>
      </div>
      
      <table>
        <thead>
          <tr>
            <th>${language === "th" ? "รายการ" : "Item"}</th>
            <th>${language === "th" ? "จำนวนเงิน" : "Amount"}</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>${t.commonFee}</td>
            <td>${formatCurrencyForPDF(bill.common_fee || 0, settings)}</td>
          </tr>
          <tr>
            <td>${t.waterFee}</td>
            <td>${formatCurrencyForPDF(bill.water_fee || 0, settings)}</td>
          </tr>
          <tr>
            <td>${t.electricityFee}</td>
            <td>${formatCurrencyForPDF(bill.electricity_fee || 0, settings)}</td>
          </tr>
          <tr>
            <td>${t.parkingFee}</td>
            <td>${formatCurrencyForPDF(bill.parking_fee || 0, settings)}</td>
          </tr>
          <tr>
            <td>${t.otherFee}</td>
            <td>${formatCurrencyForPDF(bill.other_fee || 0, settings)}</td>
          </tr>
        </tbody>
        <tfoot>
          <tr class="total-row">
            <td>${t.totalAmount}</td>
            <td>${formatCurrencyForPDF(bill.total, settings)}</td>
          </tr>
        </tfoot>
      </table>
      
      <div class="footer">
        <div class="footer-left">${t.pleasePay}</div>
        <div class="footer-right">${t.issuedBy}: Unizorn Accounting</div>
      </div>
    </body>
    </html>
  `;
  
  return html;
};

// Helper function to create HTML template for Receipt
const createReceiptHTMLTemplate = (payment: any, bill: any, unit: any, settings: Settings, language: PDFLanguage) => {
  const t = translations[language];
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>${t.receipt}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;500;600;700&display=swap');
        body {
          font-family: 'Sarabun', sans-serif;
          margin: 0;
          padding: 20px;
          font-size: 12px;
          line-height: 1.4;
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
        }
        .title {
          font-size: 24px;
          font-weight: 700;
          margin-bottom: 10px;
        }
        .info-section {
          display: flex;
          justify-content: space-between;
          margin-bottom: 20px;
        }
        .info-left, .info-right {
          width: 48%;
        }
        .info-item {
          margin-bottom: 8px;
        }
        .label {
          font-weight: 600;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin: 20px 0;
        }
        th, td {
          border: 1px solid #ddd;
          padding: 8px;
          text-align: left;
        }
        th {
          background-color: #2563eb;
          color: white;
          font-weight: 600;
        }
        .total-row {
          background-color: #f0f0f0;
          font-weight: 600;
        }
        .footer {
          margin-top: 30px;
          font-size: 10px;
        }
        .footer-left {
          float: left;
        }
        .footer-right {
          float: right;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="title">${t.receipt}</div>
      </div>
      
      <div class="info-section">
        <div class="info-left">
          <div class="info-item">
            <span class="label">${t.unitNumber}:</span> ${unit?.unit_number || 'N/A'}
          </div>
          <div class="info-item">
            <span class="label">${t.receivedFrom}:</span> ${unit?.owner_name || 'N/A'}
          </div>
        </div>
        <div class="info-right">
          <div class="info-item">
            <span class="label">${t.receiptNumber}:</span> ${payment?.reference_number || 'N/A'}
          </div>
          <div class="info-item">
            <span class="label">${t.paymentDate}:</span> ${payment?.payment_date ? formatDate(payment.payment_date, 'medium', settings.yearType) : 'N/A'}
          </div>
        </div>
      </div>
      
      <table>
        <thead>
          <tr>
            <th>${language === "th" ? "รายการชำระสำหรับใบแจ้งหนี้" : "Payment Item"}</th>
            <th>${language === "th" ? "จำนวนเงิน" : "Amount"}</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>${t.monthlyFee} ${bill?.month || 'N/A'} (${t.billNumber} ${bill?.bill_number || 'N/A'})</td>
            <td>${formatCurrencyForPDF(payment?.amount || 0, settings)}</td>
          </tr>
        </tbody>
        <tfoot>
          <tr class="total-row">
            <td>${t.totalPaid}</td>
            <td>${formatCurrencyForPDF(payment.amount, settings)}</td>
          </tr>
        </tfoot>
      </table>
      
      <div class="footer">
        <div class="footer-left">${t.thankYou}</div>
        <div class="footer-right">${t.issuedBy}: Unizorn Accounting</div>
      </div>
    </body>
    </html>
  `;
  
  return html;
};

// Updated to accept settings and language - using HTML to PDF approach
export const generateBillPDFV4 = async (bill: any, unitInfo: any, settings: Settings, language: PDFLanguage = "en") => {
  try {
    // Create HTML template
    const html = createHTMLTemplate(bill, unitInfo, settings, language);
    
    // Create a new window with the HTML content
    const newWindow = window.open('', '_blank');
    if (newWindow) {
      newWindow.document.write(html);
      newWindow.document.close();
      
      // Wait for fonts to load
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Print the window
      newWindow.print();
      
      // Close the window after printing
      setTimeout(() => {
        newWindow.close();
      }, 1000);
    }
  } catch (error) {
    console.error('Error generating PDF:', error);
    // Fallback to jsPDF
    const doc = new jsPDF();
    doc.setFont("helvetica");
    doc.setFontSize(20);
    doc.text(translations[language].invoice, 105, 20, { align: "center" });
    doc.save(`Invoice-${bill.bill_number || bill.month}.pdf`);
  }
};

// Updated to accept settings and language - using HTML to PDF approach
export const generateReceiptPDFV4 = async (payment: any, bill: any, unit: any, settings: Settings, language: PDFLanguage = "en") => {
  try {
    // Create HTML template
    const html = createReceiptHTMLTemplate(payment, bill, unit, settings, language);
    
    // Create a new window with the HTML content
    const newWindow = window.open('', '_blank');
    if (newWindow) {
      newWindow.document.write(html);
      newWindow.document.close();
      
      // Wait for fonts to load
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Print the window
      newWindow.print();
      
      // Close the window after printing
      setTimeout(() => {
        newWindow.close();
      }, 1000);
    }
  } catch (error) {
    console.error('Error generating PDF:', error);
    // Fallback to jsPDF
    const doc = new jsPDF();
    doc.setFont("helvetica");
    doc.setFontSize(20);
    doc.text(translations[language].receipt, 105, 20, { align: "center" });
    doc.save(`Receipt-${payment.reference_number}.pdf`);
  }
};
