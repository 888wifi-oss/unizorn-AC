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
const formatCurrencyForPDF = (amount: number, settings: Settings) => {
    const options: Intl.NumberFormatOptions = {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
        style: 'currency',
        currency: settings.currency
    }
    const locale = settings.currency === 'THB' ? 'th-TH' : 'en-US';
    return new Intl.NumberFormat(locale, options).format(amount);
};

// Helper function to create Thai-compatible text
const createThaiCompatibleText = (text: string, language: PDFLanguage) => {
  if (language === "th") {
    // For Thai, we'll use a different approach
    // Convert Thai characters to a readable format
    return text.replace(/[ก-ฮ]/g, (char) => {
      // Use a comprehensive mapping for Thai characters
      const thaiMap: { [key: string]: string } = {
        "ก": "K", "ข": "Kh", "ค": "K", "ฆ": "Kh", "ง": "Ng",
        "จ": "Ch", "ฉ": "Ch", "ช": "Ch", "ซ": "S", "ฌ": "Ch",
        "ญ": "Y", "ฎ": "D", "ฏ": "T", "ฐ": "Th", "ฑ": "Th",
        "ฒ": "Th", "ณ": "N", "ด": "D", "ต": "T", "ถ": "Th",
        "ท": "Th", "ธ": "Th", "น": "N", "บ": "B", "ป": "P",
        "ผ": "Ph", "ฝ": "F", "พ": "Ph", "ฟ": "F", "ภ": "Ph",
        "ม": "M", "ย": "Y", "ร": "R", "ล": "L", "ว": "W",
        "ศ": "S", "ษ": "S", "ส": "S", "ห": "H", "ฬ": "L",
        "อ": "A", "ฮ": "H"
      };
      return thaiMap[char] || "?";
    }).replace(/[ะาิีึืุูเแโใไๆฯ]/g, "");
  }
  return text;
};

// Updated to accept settings and language
export const generateBillPDFV2 = async (bill: any, unitInfo: any, settings: Settings, language: PDFLanguage = "en") => {
  const doc = new jsPDF();
  
  // Use default font to avoid font loading issues
  doc.setFont("helvetica");

  // Get translations for the selected language
  const t = translations[language];

  // Create title
  const title = language === "th" ? createThaiCompatibleText(t.invoice, language) : t.invoice;
  doc.setFontSize(20);
  doc.text(title, 105, 20, { align: "center" });
  
  // Create subtitle
  const subtitle = language === "th" ? createThaiCompatibleText(t.forMonth, language) : t.forMonth;
  doc.setFontSize(12);
  doc.text(`${subtitle}: ${bill.month || 'N/A'}`, 105, 28, { align: "center" });

  // Create document info
  doc.setFontSize(10);
  const unitLabel = language === "th" ? createThaiCompatibleText(t.unitNumber, language) : t.unitNumber;
  const ownerLabel = language === "th" ? createThaiCompatibleText(t.ownerName, language) : t.ownerName;
  const billLabel = language === "th" ? createThaiCompatibleText(t.billNumber, language) : t.billNumber;
  const docLabel = language === "th" ? createThaiCompatibleText(t.documentDate, language) : t.documentDate;
  const dueLabel = language === "th" ? createThaiCompatibleText(t.dueDate, language) : t.dueDate;

  doc.text(`${unitLabel}: ${unitInfo?.unitNumber || 'N/A'}`, 14, 40);
  doc.text(`${ownerLabel}: ${createThaiCompatibleText(unitInfo?.ownerName || 'N/A', language)}`, 14, 46);
  doc.text(`${billLabel}: ${bill.bill_number || 'N/A'}`, 196, 40, { align: "right" });
  doc.text(`${docLabel}: ${formatDate(new Date().toISOString(), 'medium', settings.yearType)}`, 196, 46, { align: "right" });
  doc.text(`${dueLabel}: ${bill.due_date ? formatDate(bill.due_date, 'medium', settings.yearType) : 'N/A'}`, 196, 52, { align: "right" });

  // Create table data
  const tableData = [
    [language === "th" ? createThaiCompatibleText(t.commonFee, language) : t.commonFee, formatCurrencyForPDF(bill.common_fee || 0, settings)],
    [language === "th" ? createThaiCompatibleText(t.waterFee, language) : t.waterFee, formatCurrencyForPDF(bill.water_fee || 0, settings)],
    [language === "th" ? createThaiCompatibleText(t.electricityFee, language) : t.electricityFee, formatCurrencyForPDF(bill.electricity_fee || 0, settings)],
    [language === "th" ? createThaiCompatibleText(t.parkingFee, language) : t.parkingFee, formatCurrencyForPDF(bill.parking_fee || 0, settings)],
    [language === "th" ? createThaiCompatibleText(t.otherFee, language) : t.otherFee, formatCurrencyForPDF(bill.other_fee || 0, settings)],
  ];

  // Dynamic import for autoTable
  const autoTable = (await import("jspdf-autotable")).default;
  autoTable(doc, {
    startY: 60,
    head: language === "th" ? [['รายการ', 'จำนวนเงิน']] : [['Item', 'Amount']],
    body: tableData,
    foot: [[language === "th" ? createThaiCompatibleText(t.totalAmount, language) : t.totalAmount, formatCurrencyForPDF(bill.total, settings)]],
    theme: 'grid',
    headStyles: { fillColor: [22, 163, 74] },
    footStyles: { fontStyle: 'bold', fillColor: [240, 240, 240], textColor: [0,0,0] },
    styles: {},
    didDrawPage: (data: any) => {
        doc.setFontSize(10);
        const pleasePayText = language === "th" ? createThaiCompatibleText(t.pleasePay, language) : t.pleasePay;
        const issuedByText = language === "th" ? createThaiCompatibleText(t.issuedBy, language) : t.issuedBy;
        doc.text(pleasePayText, data.settings.margin.left, doc.internal.pageSize.getHeight() - 10);
        doc.text(`${issuedByText}: Unizorn Accounting`, 196, doc.internal.pageSize.getHeight() - 10, { align: "right" });
    }
  });

  doc.save(`Invoice-${bill.bill_number || bill.month}.pdf`);
};

// Updated to accept settings and language
export const generateReceiptPDFV2 = async (payment: any, bill: any, unit: any, settings: Settings, language: PDFLanguage = "en") => {
    const doc = new jsPDF();
    
    // Use default font to avoid font loading issues
    doc.setFont("helvetica");

    // Get translations for the selected language
    const t = translations[language];

    // Create title
    const title = language === "th" ? createThaiCompatibleText(t.receipt, language) : t.receipt;
    doc.setFontSize(20);
    doc.text(title, 105, 20, { align: "center" });

    // Create document info
    doc.setFontSize(10);
    const unitLabel = language === "th" ? createThaiCompatibleText(t.unitNumber, language) : t.unitNumber;
    const receivedLabel = language === "th" ? createThaiCompatibleText(t.receivedFrom, language) : t.receivedFrom;
    const receiptLabel = language === "th" ? createThaiCompatibleText(t.receiptNumber, language) : t.receiptNumber;
    const paymentLabel = language === "th" ? createThaiCompatibleText(t.paymentDate, language) : t.paymentDate;

    doc.text(`${unitLabel}: ${unit?.unit_number || 'N/A'}`, 14, 40);
    doc.text(`${receivedLabel}: ${createThaiCompatibleText(unit?.owner_name || 'N/A', language)}`, 14, 46);
    
    doc.text(`${receiptLabel}: ${payment?.reference_number || 'N/A'}`, 196, 40, { align: "right" });
    doc.text(`${paymentLabel}: ${payment?.payment_date ? formatDate(payment.payment_date, 'medium', settings.yearType) : 'N/A'}`, 196, 46, { align: "right" });

    // Create table data
    const monthlyFeeText = language === "th" ? createThaiCompatibleText(t.monthlyFee, language) : t.monthlyFee;
    const billNumberText = language === "th" ? createThaiCompatibleText(t.billNumber, language) : t.billNumber;
    const tableData = [
        [`${monthlyFeeText} ${bill?.month || 'N/A'} (${billNumberText} ${bill?.bill_number || 'N/A'})`, 
         formatCurrencyForPDF(payment?.amount || 0, settings)]
    ];

    // Dynamic import for autoTable
    const autoTable = (await import("jspdf-autotable")).default;
    autoTable(doc, {
        startY: 60,
        head: language === "th" ? [['รายการชำระสำหรับใบแจ้งหนี้', 'จำนวนเงิน']] : [['Payment Item', 'Amount']],
        body: tableData,
        foot: [[language === "th" ? createThaiCompatibleText(t.totalPaid, language) : t.totalPaid, formatCurrencyForPDF(payment.amount, settings)]],
        theme: 'grid',
        headStyles: { fillColor: [37, 99, 235] },
        footStyles: { fontStyle: 'bold', fillColor: [240, 240, 240], textColor: [0,0,0] },
        styles: {},
         didDrawPage: (data: any) => {
            doc.setFontSize(10);
            const thankYouText = language === "th" ? createThaiCompatibleText(t.thankYou, language) : t.thankYou;
            const issuedByText = language === "th" ? createThaiCompatibleText(t.issuedBy, language) : t.issuedBy;
            doc.text(thankYouText, data.settings.margin.left, doc.internal.pageSize.getHeight() - 10);
            doc.text(`${issuedByText}: Unizorn Accounting`, 196, doc.internal.pageSize.getHeight() - 10, { align: "right" });
        }
    });

    doc.save(`Receipt-${payment.reference_number}.pdf`);
};
