import QRCode from 'qrcode'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import { saveAs } from 'file-saver'

export interface InvitationData {
  unit_number: string
  name: string
  email?: string
  phone?: string
  invitationCode: string
  invitationLink: string
  type: 'owner' | 'tenant'
}

// Helper function to create invitation card HTML
function createInvitationCardHTML(invitation: InvitationData, qrDataURL: string): string {
  // Escape HTML to prevent XSS
  const escapeHtml = (text: string) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
  
  return `
    <div style="width: 180mm; height: 60mm; border: 1px solid #000000; padding: 10mm; background-color: #ffffff; color: #000000; font-family: 'Segoe UI', Arial, sans-serif; box-sizing: border-box;">
      <div style="display: flex; gap: 15mm; height: 100%;">
        <div style="flex: 0 0 40mm; display: flex; align-items: center;">
          <img src="${qrDataURL}" style="width: 40mm; height: 40mm;" alt="QR Code" />
        </div>
        <div style="flex: 1;">
          <h2 style="margin: 0; font-size: 16pt; font-weight: bold; margin-bottom: 8mm; color: #000000;">Unizorn Resident Portal</h2>
          <div style="font-size: 10pt; line-height: 1.8; color: #000000;">
            <div><strong style="font-weight: bold;">ห้อง:</strong> ${escapeHtml(invitation.unit_number)}</div>
            <div><strong style="font-weight: bold;">ชื่อ:</strong> ${escapeHtml(invitation.name)}</div>
            <div><strong style="font-weight: bold;">รหัสเชิญ:</strong> ${escapeHtml(invitation.invitationCode)}</div>
            ${invitation.email ? `<div><strong style="font-weight: bold;">อีเมล:</strong> ${escapeHtml(invitation.email)}</div>` : ''}
            ${invitation.phone ? `<div><strong style="font-weight: bold;">เบอร์โทร:</strong> ${escapeHtml(invitation.phone)}</div>` : ''}
          </div>
        </div>
      </div>
    </div>
  `
}

/**
 * Generate QR Code as data URL
 */
export async function generateQRCodeDataURL(url: string): Promise<string> {
  try {
    const qrCodeDataURL = await QRCode.toDataURL(url, {
      width: 200,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    })
    return qrCodeDataURL
  } catch (error) {
    console.error('Error generating QR code:', error)
    throw error
  }
}

/**
 * Export invitations as PDF using html2canvas for Thai text support
 */
export async function exportInvitationsAsPDF(invitations: InvitationData[]) {
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  })

  const cardsPerPage = 3

  for (let i = 0; i < invitations.length; i += cardsPerPage) {
    const pageInvitations = invitations.slice(i, i + cardsPerPage)
    
    // Create a temporary container for cards on this page (OFF-SCREEN)
    const container = document.createElement('div')
    container.style.position = 'absolute'
    container.style.left = '-99999px'
    container.style.top = '0px'
    container.style.width = '210mm'
    container.style.backgroundColor = '#ffffff'
    container.style.color = '#000000'
    
    // Inject style to prevent oklch issues
    container.innerHTML = '<style>* {color: rgb(0, 0, 0) !important; background-color: rgb(255, 255, 255) !important; border-color: rgb(0, 0, 0) !important;}</style>'
    
    document.body.appendChild(container)

    // Add cards
    for (const invitation of pageInvitations) {
      const qrDataURL = await generateQRCodeDataURL(invitation.invitationLink)
      const cardHTML = createInvitationCardHTML(invitation, qrDataURL)
      const cardDiv = document.createElement('div')
      cardDiv.innerHTML = cardHTML
      const cardElement = cardDiv.firstElementChild as HTMLElement
      if (cardElement) {
        container.appendChild(cardElement)
      }
    }

    // Convert to canvas
    try {
      // Wait a bit for styles to apply
      await new Promise(resolve => setTimeout(resolve, 100))
      
      const canvas = await html2canvas(container, {
        scale: 2,
        backgroundColor: '#ffffff',
        logging: false,
        useCORS: true,
        ignoreElements: (element) => {
          // Ignore elements that might cause oklch issues
          const styles = window.getComputedStyle(element)
          const color = styles.color
          return color && color.includes('oklch')
        }
      })

      // Add new page except for first page
      if (i > 0) {
        pdf.addPage()
      }

      // Add canvas to PDF
      const imgData = canvas.toDataURL('image/png')
      const imgWidth = 210
      const imgHeight = (canvas.height * imgWidth) / canvas.width
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight)
    } catch (error) {
      console.error('Error with html2canvas:', error)
    } finally {
      // Clean up
      document.body.removeChild(container)
    }
  }

  // Save PDF
  pdf.save('invitation_codes.pdf')
}

/**
 * Export QR Codes as separate images in ZIP
 */
export async function exportQRCodesAsZIP(invitations: InvitationData[]): Promise<void> {
  const JSZip = (await import('jszip')).default
  
  const zip = new JSZip()
  
  for (const invitation of invitations) {
    try {
      const qrDataURL = await generateQRCodeDataURL(invitation.invitationLink)
      
      // Convert data URL to blob
      const response = await fetch(qrDataURL)
      const blob = await response.blob()
      
      // Add to zip
      const filename = `${invitation.unit_number}_${invitation.name.replace(/\s+/g, '_')}.png`
      zip.file(filename, blob)
      
    } catch (error) {
      console.error('Error generating QR code for', invitation.unit_number, error)
    }
  }
  
  // Generate ZIP file
  const zipBlob = await zip.generateAsync({ type: 'blob' })
  
  // Download ZIP
  saveAs(zipBlob, 'qr_codes.zip')
}

/**
 * Export invitations as CSV
 */
export function exportInvitationsAsCSV(invitations: InvitationData[]) {
  const headers = ['หมายเลขห้อง', 'ชื่อ', 'อีเมล', 'เบอร์โทร', 'ประเภท', 'รหัสเชิญ', 'URL']
  const rows = invitations.map(inv => [
    inv.unit_number,
    inv.name,
    inv.email || '',
    inv.phone || '',
    inv.type === 'owner' ? 'เจ้าของ' : 'ผู้เช่า',
    inv.invitationCode,
    inv.invitationLink
  ])
  
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n')
  
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
  saveAs(blob, 'invitations.csv')
}
