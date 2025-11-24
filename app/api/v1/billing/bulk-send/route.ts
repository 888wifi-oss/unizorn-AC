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
        total,
        units!inner(
          id,
          unit_number,
          owner_name,
          owner_email,
          owner_phone,
          user_id
        )
      `)
      .in('id', billIds)

    if (billsError) {
      console.error('[Bulk Send] Error fetching bills:', billsError)
      throw new Error(`Failed to fetch bills: ${billsError.message}`)
    }

    if (!bills || bills.length === 0) {
      return NextResponse.json({
        success: true,
        count: 0,
        message: 'No bills found',
      })
    }

    let successCount = 0
    const failed: any[] = []

    // Send each bill (simulate - in production, integrate with email/SMS service)
    for (const bill of bills) {
      try {
        // Check if unit has contact info
        if (!bill.units?.owner_email && !bill.units?.owner_phone) {
          failed.push({
            billId: bill.id,
            billNumber: bill.bill_number,
            reason: 'No contact information (email/phone)',
          })
          continue
        }

        // TODO: In production, send actual email/SMS here
        // Example:
        // await sendEmail({
        //   to: bill.units.owner_email,
        //   subject: `บิลสำหรับเดือน ${bill.month}`,
        //   body: `...`,
        // })

        // For now, create a notification
        if (bill.units.user_id) {
          await supabase
            .from('notifications')
            .insert({
              user_id: bill.units.user_id,
              unit_id: bill.units.id,
              type: 'bill_issued',
              title: 'บิลใหม่',
              message: `บิลสำหรับเดือน ${bill.month} จำนวน ${bill.total.toLocaleString()} บาท`,
              data: {
                bill_id: bill.id,
                bill_number: bill.bill_number,
                amount: bill.total,
              },
              is_read: false,
            })
        }

        successCount++
      } catch (error: any) {
        failed.push({
          billId: bill.id,
          billNumber: bill.bill_number,
          error: error.message,
        })
      }
    }

    return NextResponse.json({
      success: true,
      count: successCount,
      failed: failed.length,
      message: `ส่งบิล ${successCount} ใบแล้ว${failed.length > 0 ? ` (ล้มเหลว ${failed.length} ใบ)` : ''}`,
      failedDetails: failed.length > 0 ? failed : undefined,
    })
  } catch (error: any) {
    console.error('[Bulk Send] Error:', error)
    return NextResponse.json(
      { 
        error: error.message || 'Failed to bulk send bills',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}

