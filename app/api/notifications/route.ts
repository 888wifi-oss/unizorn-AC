import { NextRequest, NextResponse } from "next/server"
import { runScheduledNotifications } from "@/lib/scheduled-notifications"

export async function GET(request: NextRequest) {
  try {
    // Check for authorization header (you can add your own auth logic here)
    const authHeader = request.headers.get('authorization')
    const expectedToken = process.env.CRON_SECRET || 'your-secret-token'
    
    if (authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const result = await runScheduledNotifications()
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Scheduled notifications completed',
        notifications: result.notifications,
        emails: result.emails
      })
    } else {
      return NextResponse.json({
        success: false,
        error: result.error
      }, { status: 500 })
    }
  } catch (error: any) {
    console.error('Error in scheduled notifications API:', error)
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, data } = body

    switch (action) {
      case 'payment_received':
        const { sendPaymentReceivedNotifications } = await import("@/lib/scheduled-notifications")
        const paymentResult = await sendPaymentReceivedNotifications(data.paymentId)
        return NextResponse.json(paymentResult)

      case 'maintenance_update':
        const { sendMaintenanceUpdateNotifications } = await import("@/lib/scheduled-notifications")
        const maintenanceResult = await sendMaintenanceUpdateNotifications(data.maintenanceId, data.status)
        return NextResponse.json(maintenanceResult)

      case 'announcement':
        const { sendAnnouncementNotifications } = await import("@/lib/scheduled-notifications")
        const announcementResult = await sendAnnouncementNotifications(data.announcementId)
        return NextResponse.json(announcementResult)

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error: any) {
    console.error('Error in notifications API:', error)
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}
