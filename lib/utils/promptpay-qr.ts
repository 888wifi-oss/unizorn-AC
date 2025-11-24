/**
 * PromptPay QR Code Generator
 * สร้าง QR Code สำหรับ PromptPay ตามมาตรฐานของไทย
 * 
 * Reference: https://www.blognone.com/node/95133
 */

interface PromptPayConfig {
  phoneNumber?: string // หมายเลขโทรศัพท์ (0812345678)
  taxId?: string // เลขประจำตัวผู้เสียภาษี (13 หลัก)
  ewalletId?: string // e-Wallet ID
  amount?: number // จำนวนเงิน (ถ้ามี)
  editable?: boolean // อนุญาตให้แก้ไขจำนวนเงินได้หรือไม่
}

/**
 * Generate PromptPay QR Code data string
 * รูปแบบ: 00020101021229370016A00000067701011101130066xxxxxxxx5802TH6304
 */
export function generatePromptPayQR(config: PromptPayConfig): string {
  const { phoneNumber, taxId, ewalletId, amount, editable = false } = config

  // Validate that at least one identifier is provided
  if (!phoneNumber && !taxId && !ewalletId) {
    throw new Error('ต้องระบุหมายเลขโทรศัพท์, เลขประจำตัวผู้เสียภาษี, หรือ e-Wallet ID')
  }

  // Determine payload format
  let payloadIdentifier = ''
  let payloadValue = ''

  if (phoneNumber) {
    // Remove dashes and spaces
    const cleanPhone = phoneNumber.replace(/[-\s]/g, '')
    // Add country code if not present
    const phoneWithCode = cleanPhone.startsWith('66') ? cleanPhone : `66${cleanPhone.substring(1)}`
    payloadIdentifier = '01130066' // Phone number identifier
    payloadValue = phoneWithCode
  } else if (taxId) {
    // Tax ID should be 13 digits
    const cleanTaxId = taxId.replace(/[-\s]/g, '')
    if (cleanTaxId.length !== 13) {
      throw new Error('เลขประจำตัวผู้เสียภาษีต้องมี 13 หลัก')
    }
    payloadIdentifier = '01170013' // Tax ID identifier
    payloadValue = cleanTaxId
  } else if (ewalletId) {
    payloadIdentifier = '01120013' // e-Wallet identifier
    payloadValue = ewalletId
  }

  // Build QR Code data
  let qrData = '000201' // Payload Format Indicator
  qrData += '01' + '02' + '12' // Point of Initiation Method (static)
  
  // Merchant Account Information
  qrData += '29' + formatLength(payloadIdentifier + payloadValue) // Merchant Account Information length
  qrData += '00' + formatLength('A000000677010111') // GUID
  qrData += '01' + formatLength(payloadIdentifier + payloadValue) // Account Information
  qrData += '5802TH' // Country Code (TH)
  
  // Amount (if specified)
  if (amount !== undefined && amount > 0) {
    const amountStr = amount.toFixed(2)
    qrData += '54' + formatLength(amountStr) // Transaction Amount
  }
  
  // Currency
  qrData += '5303' + '764' // Currency Code (THB)
  
  // Check Sum
  const checksum = calculateChecksum(qrData + '6304')
  qrData += '6304' + checksum

  return qrData
}

/**
 * Format length in 2-digit hex
 */
function formatLength(value: string): string {
  const length = value.length
  return length.toString().padStart(2, '0')
}

/**
 * Calculate CRC16 checksum
 */
function calculateChecksum(data: string): string {
  // Simplified CRC16-CCITT calculation
  let crc = 0xFFFF
  
  for (let i = 0; i < data.length; i++) {
    crc ^= data.charCodeAt(i) << 8
    for (let j = 0; j < 8; j++) {
      if (crc & 0x8000) {
        crc = (crc << 1) ^ 0x1021
      } else {
        crc <<= 1
      }
    }
  }
  
  const checksum = (crc & 0xFFFF).toString(16).toUpperCase().padStart(4, '0')
  return checksum
}

/**
 * Generate QR Code data URL using qrcode library
 */
export async function generatePromptPayQRCodeImage(config: PromptPayConfig): Promise<string> {
  const QRCode = await import('qrcode')
  const qrData = generatePromptPayQR(config)
  
  try {
    const dataURL = await QRCode.toDataURL(qrData, {
      width: 400,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      errorCorrectionLevel: 'H' // High error correction for better readability
    })
    
    return dataURL
  } catch (error) {
    console.error('Error generating QR code:', error)
    throw error
  }
}

/**
 * Generate PromptPay URL (for fallback)
 */
export function generatePromptPayURL(phoneNumber: string, amount?: number): string {
  const cleanPhone = phoneNumber.replace(/[-\s]/g, '')
  const phoneWithCode = cleanPhone.startsWith('66') ? cleanPhone : `66${cleanPhone.substring(1)}`
  
  if (amount) {
    return `https://promptpay.io/${phoneWithCode}/${amount.toFixed(2)}`
  }
  
  return `https://promptpay.io/${phoneWithCode}`
}

