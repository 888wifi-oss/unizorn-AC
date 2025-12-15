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

    // Check if subscription exists
    const { data, error } = await supabase
      .from('push_subscriptions')
      .select('id')
      .eq('unit_number', unit_number)
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('Check subscription error:', error)
      return NextResponse.json(
        { error: 'เกิดข้อผิดพลาดในการตรวจสอบการแจ้งเตือน' },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      hasSubscription: !!data,
      unit_number
    })

  } catch (error: any) {
    console.error('Push check subscription error:', error)
    return NextResponse.json(
      { error: error.message || 'เกิดข้อผิดพลาด' },
      { status: 500 }
    )
  }
}



















