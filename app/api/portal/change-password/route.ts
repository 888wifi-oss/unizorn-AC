import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function POST(request: NextRequest) {
  try {
    const { unit_number, currentPassword, newPassword } = await request.json()

    if (!unit_number || !currentPassword || !newPassword) {
      return NextResponse.json(
        { error: 'ข้อมูลไม่ครบถ้วน' },
        { status: 400 }
      )
    }

    // Create Supabase client with service role key
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get unit data
    const { data: unitData, error: unitError } = await supabase
      .from('units')
      .select('username, password')
      .eq('unit_number', unit_number)
      .single()

    if (unitError || !unitData) {
      return NextResponse.json(
        { error: 'ไม่พบข้อมูลหน่วย' },
        { status: 404 }
      )
    }

    // Verify current password
    if (unitData.password !== currentPassword) {
      return NextResponse.json(
        { error: 'รหัสผ่านปัจจุบันไม่ถูกต้อง' },
        { status: 401 }
      )
    }

    // Update password
    const { error: updateError } = await supabase
      .from('units')
      .update({ password: newPassword })
      .eq('unit_number', unit_number)

    if (updateError) {
      return NextResponse.json(
        { error: 'ไม่สามารถอัปเดตรหัสผ่านได้' },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      success: true,
      message: 'เปลี่ยนรหัสผ่านสำเร็จ'
    })

  } catch (error: any) {
    console.error('Change password error:', error)
    return NextResponse.json(
      { error: error.message || 'เกิดข้อผิดพลาด' },
      { status: 500 }
    )
  }
}



















