import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { billIds, format = 'pdf' } = body

    if (!billIds || !Array.isArray(billIds) || billIds.length === 0) {
      return NextResponse.json(
        { error: 'billIds array is required' },
        { status: 400 }
      )
    }

    if (!['pdf', 'csv'].includes(format)) {
      return NextResponse.json(
        { error: 'format must be either "pdf" or "csv"' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Get bills with unit information
    const { data: bills, error: billsError } = await supabase
      .from('bills')
      .select(`
        *,
        units!inner(
          unit_number,
          owner_name,
          owner_email,
          owner_phone
        )
      `)
      .in('id', billIds)

    if (billsError) {
      console.error('[Bulk Export] Error fetching bills:', billsError)
      throw new Error(`Failed to fetch bills: ${billsError.message}`)
    }

    if (!bills || bills.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No bills found',
      }, { status: 404 })
    }

    if (format === 'csv') {
      // Export as single CSV file
      const csvData = bills.map((bill: any) => ({
        'เลขห้อง': bill.units?.unit_number || '',
        'เลขที่บิล': bill.bill_number || '',
        'เดือน': bill.month || '',
        'ค่าส่วนกลาง': bill.common_fee || 0,
        'ค่าน้ำ': bill.water_fee || 0,
        'ค่าไฟฟ้า': bill.electricity_fee || 0,
        'ค่าที่จอดรถ': bill.parking_fee || 0,
        'อื่นๆ': bill.other_fee || 0,
        'รวม': bill.total || 0,
        'กำหนดชำระ': bill.due_date || '',
        'สถานะ': bill.status || '',
        'เจ้าของ': bill.units?.owner_name || '',
        'อีเมล': bill.units?.owner_email || '',
        'เบอร์โทร': bill.units?.owner_phone || '',
      }))

      // Convert to CSV string
      const headers = Object.keys(csvData[0])
      const csvRows = [
        headers.join(','),
        ...csvData.map(row => 
          headers.map(header => {
            const value = row[header]
            return typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value
          }).join(',')
        )
      ]
      const csvString = csvRows.join('\n')

      return new NextResponse(csvString, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="bills_export_${new Date().toISOString().split('T')[0]}.csv"`,
        },
      })
    } else {
      // Export as PDF files in ZIP
      // For PDF export, we'll return a JSON response with bill data
      // The client will handle PDF generation and ZIP creation
      
      // Since PDF generation is client-side, we return the data
      // Client will use generateBillPDFV4 for each bill and create ZIP
      return NextResponse.json({
        success: true,
        count: bills.length,
        bills: bills.map((bill: any) => ({
          id: bill.id,
          bill_number: bill.bill_number,
          month: bill.month,
          unit_number: bill.units?.unit_number,
          owner_name: bill.units?.owner_name,
          common_fee: bill.common_fee,
          water_fee: bill.water_fee,
          electricity_fee: bill.electricity_fee,
          parking_fee: bill.parking_fee,
          other_fee: bill.other_fee,
          total: bill.total,
          due_date: bill.due_date,
          status: bill.status,
        })),
        message: `Export ${bills.length} bills as PDF (client-side generation)`,
      })
    }
  } catch (error: any) {
    console.error('[Bulk Export] Error:', error)
    return NextResponse.json(
      { 
        error: error.message || 'Failed to bulk export bills',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}

