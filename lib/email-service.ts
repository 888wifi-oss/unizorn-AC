"use server"

import { createClient } from "@/lib/supabase/server"

// Email notification service using Supabase Edge Functions
export async function sendEmailNotification(
  to: string,
  subject: string,
  htmlContent: string,
  textContent?: string
) {
  
  try {
    const supabase = await createClient()
    
    // Call Supabase Edge Function for sending emails
    const { data, error } = await supabase.functions.invoke('send-email', {
      body: {
        to,
        subject,
        html: htmlContent,
        text: textContent || htmlContent.replace(/<[^>]*>/g, '')
      }
    })

    if (error) {
      throw new Error(`Failed to send email: ${error.message}`)
    }

    return { success: true, data }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// Email templates (non-exported)
const emailTemplates = {
  paymentDue: (residentName: string, unitNumber: string, month: string, dueDate: string, amount: number) => ({
    subject: `แจ้งเตือนการชำระเงิน - ห้อง ${unitNumber}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>แจ้งเตือนการชำระเงิน</title>
        <style>
          body { font-family: 'Sarabun', Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
          .content { background: white; padding: 20px; border: 1px solid #e9ecef; border-radius: 8px; }
          .highlight { background: #fff3cd; padding: 15px; border-radius: 5px; margin: 15px 0; }
          .amount { font-size: 24px; font-weight: bold; color: #dc3545; }
          .footer { margin-top: 20px; padding-top: 20px; border-top: 1px solid #e9ecef; font-size: 12px; color: #6c757d; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>แจ้งเตือนการชำระเงิน</h1>
            <p>สวัสดีคุณ ${residentName}</p>
          </div>
          
          <div class="content">
            <p>ขอแจ้งให้ทราบว่าบิลค่าส่วนกลางสำหรับห้อง <strong>${unitNumber}</strong> เดือน <strong>${month}</strong> ครบกำหนดชำระแล้ว</p>
            
            <div class="highlight">
              <p><strong>รายละเอียดบิล:</strong></p>
              <p>ห้อง: ${unitNumber}</p>
              <p>เดือน: ${month}</p>
              <p>กำหนดชำระ: ${dueDate}</p>
              <p>ยอดเงิน: <span class="amount">฿${amount.toLocaleString()}</span></p>
            </div>
            
            <p>กรุณาชำระเงินภายในวันที่กำหนด เพื่อหลีกเลี่ยงค่าปรับ</p>
            
            <p>หากมีข้อสงสัย กรุณาติดต่อเจ้าหน้าที่</p>
          </div>
          
          <div class="footer">
            <p>อีเมลนี้ส่งโดยระบบอัตโนมัติ กรุณาอย่าตอบกลับ</p>
            <p>© ${new Date().getFullYear()} Condo Management System</p>
          </div>
        </div>
      </body>
      </html>
    `
  }),

  paymentReceived: (residentName: string, unitNumber: string, month: string, amount: number) => ({
    subject: `ยืนยันการรับชำระเงิน - ห้อง ${unitNumber}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>ยืนยันการรับชำระเงิน</title>
        <style>
          body { font-family: 'Sarabun', Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #d4edda; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
          .content { background: white; padding: 20px; border: 1px solid #e9ecef; border-radius: 8px; }
          .success { background: #d1ecf1; padding: 15px; border-radius: 5px; margin: 15px 0; }
          .amount { font-size: 24px; font-weight: bold; color: #28a745; }
          .footer { margin-top: 20px; padding-top: 20px; border-top: 1px solid #e9ecef; font-size: 12px; color: #6c757d; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>ยืนยันการรับชำระเงิน</h1>
            <p>สวัสดีคุณ ${residentName}</p>
          </div>
          
          <div class="content">
            <div class="success">
              <h2>✅ การชำระเงินสำเร็จ</h2>
              <p>ได้รับชำระเงินสำหรับห้อง <strong>${unitNumber}</strong> เดือน <strong>${month}</strong> เรียบร้อยแล้ว</p>
            </div>
            
            <p><strong>รายละเอียดการชำระ:</strong></p>
            <p>ห้อง: ${unitNumber}</p>
            <p>เดือน: ${month}</p>
            <p>ยอดชำระ: <span class="amount">฿${amount.toLocaleString()}</span></p>
            <p>วันที่ชำระ: ${new Date().toLocaleDateString('th-TH')}</p>
            
            <p>ขอบคุณที่ชำระเงินตรงเวลา หากมีข้อสงสัย กรุณาติดต่อเจ้าหน้าที่</p>
          </div>
          
          <div class="footer">
            <p>อีเมลนี้ส่งโดยระบบอัตโนมัติ กรุณาอย่าตอบกลับ</p>
            <p>© ${new Date().getFullYear()} Condo Management System</p>
          </div>
        </div>
      </body>
      </html>
    `
  }),

  maintenanceUpdate: (residentName: string, unitNumber: string, title: string, status: string) => ({
    subject: `อัปเดตสถานะงานซ่อม - ห้อง ${unitNumber}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>อัปเดตสถานะงานซ่อม</title>
        <style>
          body { font-family: 'Sarabun', Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #cce5ff; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
          .content { background: white; padding: 20px; border: 1px solid #e9ecef; border-radius: 8px; }
          .update { background: #e7f3ff; padding: 15px; border-radius: 5px; margin: 15px 0; }
          .footer { margin-top: 20px; padding-top: 20px; border-top: 1px solid #e9ecef; font-size: 12px; color: #6c757d; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>อัปเดตสถานะงานซ่อม</h1>
            <p>สวัสดีคุณ ${residentName}</p>
          </div>
          
          <div class="content">
            <div class="update">
              <h2>🔧 สถานะงานซ่อมอัปเดต</h2>
              <p>งานซ่อมสำหรับห้อง <strong>${unitNumber}</strong> มีการอัปเดตสถานะแล้ว</p>
            </div>
            
            <p><strong>รายละเอียดงานซ่อม:</strong></p>
            <p>ห้อง: ${unitNumber}</p>
            <p>เรื่อง: ${title}</p>
            <p>สถานะใหม่: <strong>${status}</strong></p>
            <p>วันที่อัปเดต: ${new Date().toLocaleDateString('th-TH')}</p>
            
            <p>หากมีข้อสงสัยเกี่ยวกับงานซ่อม กรุณาติดต่อเจ้าหน้าที่</p>
          </div>
          
          <div class="footer">
            <p>อีเมลนี้ส่งโดยระบบอัตโนมัติ กรุณาอย่าตอบกลับ</p>
            <p>© ${new Date().getFullYear()} Condo Management System</p>
          </div>
        </div>
      </body>
      </html>
    `
  }),

  announcement: (residentName: string, title: string, content: string) => ({
    subject: `ประกาศใหม่: ${title}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>ประกาศใหม่</title>
        <style>
          body { font-family: 'Sarabun', Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
          .content { background: white; padding: 20px; border: 1px solid #e9ecef; border-radius: 8px; }
          .announcement { background: #fff3cd; padding: 15px; border-radius: 5px; margin: 15px 0; }
          .footer { margin-top: 20px; padding-top: 20px; border-top: 1px solid #e9ecef; font-size: 12px; color: #6c757d; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📢 ประกาศใหม่</h1>
            <p>สวัสดีคุณ ${residentName}</p>
          </div>
          
          <div class="content">
            <div class="announcement">
              <h2>${title}</h2>
            </div>
            
            <div style="white-space: pre-line;">${content}</div>
            
            <p style="margin-top: 20px;">หากมีข้อสงสัย กรุณาติดต่อเจ้าหน้าที่</p>
          </div>
          
          <div class="footer">
            <p>อีเมลนี้ส่งโดยระบบอัตโนมัติ กรุณาอย่าตอบกลับ</p>
            <p>© ${new Date().getFullYear()} Condo Management System</p>
          </div>
        </div>
      </body>
      </html>
    `
  })
}

// Helper functions to send specific types of notifications
export async function sendPaymentDueEmail(residentEmail: string, residentName: string, unitNumber: string, month: string, dueDate: string, amount: number) {
  const template = emailTemplates.paymentDue(residentName, unitNumber, month, dueDate, amount)
  return await sendEmailNotification(residentEmail, template.subject, template.html)
}

export async function sendPaymentReceivedEmail(residentEmail: string, residentName: string, unitNumber: string, month: string, amount: number) {
  const template = emailTemplates.paymentReceived(residentName, unitNumber, month, amount)
  return await sendEmailNotification(residentEmail, template.subject, template.html)
}

export async function sendMaintenanceUpdateEmail(residentEmail: string, residentName: string, unitNumber: string, title: string, status: string) {
  const template = emailTemplates.maintenanceUpdate(residentName, unitNumber, title, status)
  return await sendEmailNotification(residentEmail, template.subject, template.html)
}

export async function sendAnnouncementEmail(residentEmail: string, residentName: string, title: string, content: string) {
  const template = emailTemplates.announcement(residentName, title, content)
  return await sendEmailNotification(residentEmail, template.subject, template.html)
}
