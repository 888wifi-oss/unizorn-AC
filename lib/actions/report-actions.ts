'use server'

import { createClient } from "@/lib/supabase/server"

export interface DailyReceipt {
    id: string
    payment_date: string
    receipt_number: string
    bill_number?: string
    unit_number: string
    payer_name: string
    payment_method: string
    amount: number
    notes: string
    created_by: string
}

export interface DailyPayment {
    id: string
    payment_date: string
    document_no: string
    description: string
    account_code: string
    account_name: string
    amount: number
    recipient: string
}

export async function getDailyReceipts(date: string, projectId?: string | null) {
    const supabase = await createClient()

    try {
        // Start of day to end of day
        const startDate = `${date} 00:00:00`
        const endDate = `${date} 23:59:59`

        let query = supabase
            .from('payments')
            .select(`
        id,
        payment_date,
        amount,
        payment_method,
        notes,
        reference_number,
        created_at,
        unit_id,
        units (
          unit_number,
          owner_name
        ),
        bills (
          project_id,
          bill_number
        )
      `)
            .gte('payment_date', startDate)
            .lte('payment_date', endDate)
            .order('payment_date', { ascending: true })

        if (projectId) {
            // We need to filter by project_id on the bills table relation, 
            // but supabase-js filters on relations can be tricky.
            // Often it's better to rely on RLS or ensure the payment itself has project_id if added.
            // Looking at previous files, payments table has project_id column directly (see Reports page code).
            query = query.eq('project_id', projectId)
        }

        const { data, error } = await query

        if (error) throw error

        const receipts: DailyReceipt[] = data.map((item: any) => ({
            id: item.id,
            payment_date: item.payment_date,
            receipt_number: item.reference_number || item.id.substring(0, 8).toUpperCase(),
            bill_number: item.bills?.bill_number || '-',
            unit_number: item.units?.unit_number || 'N/A',
            payer_name: item.units?.owner_name || 'N/A',
            payment_method: item.payment_method,
            amount: Number(item.amount),
            notes: item.notes || '-',
            created_by: 'System' // Placeholder
        }))

        return { success: true, data: receipts }

    } catch (error: any) {
        console.error('Error fetching daily receipts:', error)
        return { success: false, error: error.message }
    }
}

export async function getDailyPayments(date: string, projectId?: string | null) {
    const supabase = await createClient()

    try {
        const startDate = `${date}` // Journal date is usually just YYYY-MM-DD

        // Query General Ledger for Cash Outflows (Credit on Asset accounts 11%)
        let query = supabase
            .from('general_ledger_view')
            .select('*')
            .eq('journal_date', startDate)
            .gt('credit', 0)
            .like('account_code', '11%') // Assuming 11xxxx is Cash/Bank

        if (projectId) {
            query = query.eq('project_id', projectId)
        }

        const { data, error } = await query

        if (error) throw error

        const payments: DailyPayment[] = data.map((item: any) => ({
            id: item.id,
            payment_date: item.journal_date,
            document_no: item.document_no || '-',
            description: item.description || '-',
            account_code: item.account_code,
            account_name: item.account_name,
            amount: Number(item.credit), // Credit side of Cash is money out
            recipient: '-' // GL might not have this, would need AP link
        }))

        return { success: true, data: payments }

    } catch (error: any) {
        console.error('Error fetching daily payments:', error)
        return { success: false, error: error.message }
    }
}
