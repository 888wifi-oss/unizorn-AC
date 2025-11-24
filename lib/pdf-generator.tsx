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

// Helper function to handle Thai text display
const handleThaiText = (text: string, language: PDFLanguage) => {
  if (language === "th") {
    // For Thai language, we'll use a hybrid approach
    // Keep the structure but use English for problematic characters
    return text.replace(/[ก-ฮ]/g, (char) => {
      // Use a simple mapping for common Thai characters
      const commonThaiMap: { [key: string]: string } = {
        "ก": "K", "ข": "Kh", "ค": "K", "ง": "Ng",
        "จ": "Ch", "ช": "Ch", "ซ": "S", "ญ": "Y",
        "ด": "D", "ต": "T", "ถ": "Th", "ท": "Th",
        "น": "N", "บ": "B", "ป": "P", "พ": "Ph",
        "ม": "M", "ย": "Y", "ร": "R", "ล": "L",
        "ว": "W", "ส": "S", "ห": "H", "อ": "A", "ฮ": "H"
      };
      return commonThaiMap[char] || "?";
    });
  }
  return text;
};

// Helper function to create safe text for PDF
const createSafeText = (text: string, language: PDFLanguage) => {
  if (language === "th") {
    // For Thai, we'll use a better approach
    // Try to preserve Thai characters by using a different method
    return text;
  }
  return text;
};

// Helper function to add Thai font support
const addThaiFontSupport = async (doc: jsPDF) => {
  try {
    // For Thai language, we'll use a hybrid approach
    // Use English labels with Thai data converted to readable format
    
    doc.setFont("helvetica", "normal");
    
    // Override the text method to handle Thai characters
    const originalText = doc.text;
    doc.text = function(text: string | string[], x: number, y: number, options?: any) {
      if (typeof text === 'string') {
        // For Thai text, convert to a readable English format
        const processedText = text.replace(/[ก-ฮ]/g, (char) => {
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
        });
        
        // Remove Thai vowels and tone marks
        const finalText = processedText.replace(/[ะาิีึืุูเแโใไๆฯ]/g, "");
        
        return originalText.call(this, finalText, x, y, options);
      }
      return originalText.call(this, text, x, y, options);
    };
  } catch (error) {
    console.warn("Failed to add Thai font support:", error);
  }
};

// Helper function to format currency within the PDF using the provided settings
const formatCurrencyForPDF = (amount: number, settings: Settings) => {
    const options: Intl.NumberFormatOptions = {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    };
    if (settings.showCurrencySymbol) {
        options.style = 'currency';
        options.currency = settings.currency;
    }
    const locale = settings.currency === 'THB' ? 'th-TH' : 'en-US';
    return new Intl.NumberFormat(locale, options).format(amount);
};

// Updated to accept settings and language
export const generateBillPDF = async (bill: any, unitInfo: any, settings: Settings, language: PDFLanguage = "en") => {
  const doc = new jsPDF();
  
  // Use default font to avoid font loading issues
  doc.setFont("helvetica");

  // Add Thai font support if needed
  if (language === "th") {
    await addThaiFontSupport(doc);
  }

  // Get translations for the selected language
  const t = translations[language];

  doc.setFontSize(20);
  doc.text(t.invoice, 105, 20, { align: "center" });
  doc.setFontSize(12);
  
  doc.text(`${t.forMonth}: ${bill.month || 'N/A'}`, 105, 28, { align: "center" });

  doc.setFontSize(10);
  doc.text(`${t.unitNumber}: ${unitInfo?.unitNumber || 'N/A'}`, 14, 40);
  doc.text(`${t.ownerName}: ${unitInfo?.ownerName || 'N/A'}`, 14, 46);
  doc.text(`${t.billNumber}: ${bill.bill_number || 'N/A'}`, 196, 40, { align: "right" });
  doc.text(`${t.documentDate}: ${formatDate(new Date().toISOString(), 'medium', settings.yearType)}`, 196, 46, { align: "right" });
  doc.text(`${t.dueDate}: ${bill.due_date ? formatDate(bill.due_date, 'medium', settings.yearType) : 'N/A'}`, 196, 52, { align: "right" });

  // Create table data
  const tableData = [
    [t.commonFee, formatCurrencyForPDF(bill.common_fee || 0, settings)],
    [t.waterFee, formatCurrencyForPDF(bill.water_fee || 0, settings)],
    [t.electricityFee, formatCurrencyForPDF(bill.electricity_fee || 0, settings)],
    [t.parkingFee, formatCurrencyForPDF(bill.parking_fee || 0, settings)],
    [t.otherFee, formatCurrencyForPDF(bill.other_fee || 0, settings)],
  ];

  // Dynamic import for autoTable
  const autoTable = (await import("jspdf-autotable")).default;
  autoTable(doc, {
    startY: 60,
    head: language === "th" ? [['รายการ', 'จำนวนเงิน']] : [['Item', 'Amount']],
    body: tableData,
    foot: [[t.totalAmount, formatCurrencyForPDF(bill.total, settings)]],
    theme: 'grid',
    headStyles: { fillColor: [22, 163, 74] },
    footStyles: { fontStyle: 'bold', fillColor: [240, 240, 240], textColor: [0,0,0] },
    styles: {},
    didDrawPage: (data: any) => {
        doc.setFontSize(10);
        doc.text(t.pleasePay, data.settings.margin.left, doc.internal.pageSize.getHeight() - 10);
        doc.text(`${t.issuedBy}: Unizorn Accounting`, 196, doc.internal.pageSize.getHeight() - 10, { align: "right" });
    }
  });

  doc.save(`Invoice-${bill.bill_number || bill.month}.pdf`);
};

// Updated to accept settings and language
export const generateReceiptPDF = async (payment: any, bill: any, unit: any, settings: Settings, language: PDFLanguage = "en") => {
    const doc = new jsPDF();
    
    // Use default font to avoid font loading issues
    doc.setFont("helvetica");

    // Add Thai font support if needed
    if (language === "th") {
        await addThaiFontSupport(doc);
    }

    // Get translations for the selected language
    const t = translations[language];

    doc.setFontSize(20);
    doc.text(t.receipt, 105, 20, { align: "center" });

    doc.setFontSize(10);
    doc.text(`${t.unitNumber}: ${unit?.unit_number || 'N/A'}`, 14, 40);
    doc.text(`${t.receivedFrom}: ${unit?.owner_name || 'N/A'}`, 14, 46);
    
    doc.text(`${t.receiptNumber}: ${payment?.reference_number || 'N/A'}`, 196, 40, { align: "right" });
    doc.text(`${t.paymentDate}: ${payment?.payment_date ? formatDate(payment.payment_date, 'medium', settings.yearType) : 'N/A'}`, 196, 46, { align: "right" });

    // Create table data
    const tableData = [
        [`${t.monthlyFee} ${bill?.month || 'N/A'} (${t.billNumber} ${bill?.bill_number || 'N/A'})`, 
         formatCurrencyForPDF(payment?.amount || 0, settings)]
    ];

    // Dynamic import for autoTable
    const autoTable = (await import("jspdf-autotable")).default;
    autoTable(doc, {
        startY: 60,
        head: language === "th" ? [['รายการชำระสำหรับใบแจ้งหนี้', 'จำนวนเงิน']] : [['Payment Item', 'Amount']],
        body: tableData,
        foot: [[t.totalPaid, formatCurrencyForPDF(payment.amount, settings)]],
        theme: 'grid',
        headStyles: { fillColor: [37, 99, 235] },
        footStyles: { fontStyle: 'bold', fillColor: [240, 240, 240], textColor: [0,0,0] },
        styles: {},
         didDrawPage: (data: any) => {
            doc.setFontSize(10);
            doc.text(t.thankYou, data.settings.margin.left, doc.internal.pageSize.getHeight() - 10);
            doc.text(`${t.issuedBy}: Unizorn Accounting`, 196, doc.internal.pageSize.getHeight() - 10, { align: "right" });
        }
    });

    doc.save(`Receipt-${payment.reference_number}.pdf`);
}

