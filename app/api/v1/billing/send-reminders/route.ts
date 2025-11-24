import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { billIds } = body

    if (!billIds || !Array.isArray(billIds) || billIds.length === 0) {
      return NextResponse.json(
        { error: 'billIds array is required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Get bills with unit information
    const { data: bills, error: billsError } = await supabase
      .from('bills')
      .select(`
        id,
        bill_number,
        month,
        due_date,
        total,
        unit_id,
        units!inner(
          id,
          unit_number,
          user_id,
          owner_name,
          owner_email
        )
      `)
      .in('id', billIds)
      .eq('status', 'pending')

    if (billsError) {
      console.error('[Send Reminders] Error fetching bills:', billsError)
      throw new Error(`Failed to fetch bills: ${billsError.message}`)
    }

    if (!bills || bills.length === 0) {
      return NextResponse.json({
        success: true,
        count: 0,
        message: 'No bills found',
      })
    }

    // Check for existing notifications (last 24 hours) to avoid duplicates
    const { data: existingNotifications } = await supabase
      .from('notifications')
      .select('data')
      .eq('type', 'payment_due')
      .in('data->bill_id', billIds)
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())

    const notifiedBillIds = new Set(
      existingNotifications?.map(n => n.data?.bill_id).filter(Boolean) || []
    )

    const notifications = []
    const skipped = []

    for (const bill of bills) {
      // Skip if already notified in last 24 hours
      if (notifiedBillIds.has(bill.id)) {
        skipped.push({ billId: bill.id, reason: 'Already notified' })
        continue
      }

      // Skip if no user_id
      if (!bill.units?.user_id) {
        skipped.push({ billId: bill.id, reason: 'No user_id associated with unit' })
        continue
      }

      const dueDate = new Date(bill.due_date)
      const dueDateStr = dueDate.toLocaleDateString('th-TH', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })

      notifications.push({
        user_id: bill.units.user_id,
        unit_id: bill.unit_id,
        type: 'payment_due',
        title: 'แจ้งเตือนการชำระเงิน',
        message: `บิลสำหรับเดือน ${bill.month} ครบกำหนดชำระในวันที่ ${dueDateStr} กรุณาชำระเงินภายในกำหนด`,
        data: {
          bill_id: bill.id,
          bill_number: bill.bill_number,
          amount: bill.total,
          due_date: bill.due_date,
          unit_number: bill.units.unit_number,
        },
        is_read: false,
      })
    }

    if (notifications.length > 0) {
      const { error: insertError } = await supabase
        .from('notifications')
        .insert(notifications)

      if (insertError) {
        console.error('[Send Reminders] Error inserting notifications:', insertError)
        throw new Error(`Failed to create notifications: ${insertError.message}`)
      }
    }

    return NextResponse.json({
      success: true,
      count: notifications.length,
      skipped: skipped.length,
      skippedDetails: skipped,
    })
  } catch (error: any) {
    console.error('[Send Reminders] Error:', error)
    console.error('[Send Reminders] Error stack:', error.stack)
    return NextResponse.json(
      { 
        error: error.message || 'Failed to send payment reminders',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}

