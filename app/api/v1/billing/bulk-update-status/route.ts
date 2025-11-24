import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { billIds, status } = body

    if (!billIds || !Array.isArray(billIds) || billIds.length === 0) {
      return NextResponse.json(
        { error: 'billIds array is required' },
        { status: 400 }
      )
    }

    if (!status) {
      return NextResponse.json(
        { error: 'status is required' },
        { status: 400 }
      )
    }

    const validStatuses = ['pending', 'paid', 'overdue', 'cancelled']
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    const { data: updatedBills, error: updateError } = await supabase
      .from('bills')
      .update({ 
        status,
        updated_at: new Date().toISOString(),
      })
      .in('id', billIds)
      .select('id')

    if (updateError) {
      console.error('[Bulk Update Status] Error:', updateError)
      throw new Error(`Failed to update bills: ${updateError.message}`)
    }

    return NextResponse.json({
      success: true,
      count: updatedBills?.length || 0,
      message: `อัพเดทสถานะ ${updatedBills?.length || 0} บิลเป็น "${status}" แล้ว`,
    })
  } catch (error: any) {
    console.error('[Bulk Update Status] Error:', error)
    return NextResponse.json(
      { 
        error: error.message || 'Failed to bulk update bill status',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}

