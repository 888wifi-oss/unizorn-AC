import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function POST(request: NextRequest) {
  try {
    const { unit_number } = await request.json()

    if (!unit_number) {
      return NextResponse.json(
        { error: 'ข้อมูลไม่ครบถ้วน' },
        { status: 400 }
      )
    }

    // Create Supabase client with service role key
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Delete push subscription from database
    const { error } = await supabase
      .from('push_subscriptions')
      .delete()
      .eq('unit_number', unit_number)

    if (error) {
      console.error('Push unsubscribe error:', error)
      return NextResponse.json(
        { error: 'ไม่สามารถยกเลิกการแจ้งเตือนได้' },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      success: true,
      message: 'ยกเลิกการแจ้งเตือนสำเร็จ'
    })

  } catch (error: any) {
    console.error('Push unsubscribe error:', error)
    return NextResponse.json(
      { error: error.message || 'เกิดข้อผิดพลาด' },
      { status: 500 }
    )
  }
}



















