"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export interface BeginningBalanceItem {
    unit_number: string
    amount: number
    date: string // YYYY-MM-DD
    description?: string
    project_id?: string
}

export async function importBeginningBalances(items: BeginningBalanceItem[], projectId?: string | null) {
    const supabase = await createClient()
    console.log('[importBeginningBalances] Starting import with', items.length, 'items')

    try {
        const results = {
            success: 0,
            failed: 0,
            errors: [] as Array<{ unit_number: string; error: string }>
        }

        // 1. Get all units to map unit_number -> id
        let unitsQuery = supabase.from('units').select('id, unit_number, project_id')
        if (projectId) {
            unitsQuery = unitsQuery.eq('project_id', projectId)
        }
        const { data: units, error: unitsError } = await unitsQuery

        if (unitsError) throw unitsError

        const unitMap = new Map(units?.map(u => [u.unit_number, u]))

        // 2. Process items
        const billsToInsert = []
        const glEntries = []

        for (const item of items) {
            const unit = unitMap.get(item.unit_number)
            if (!unit) {
                results.failed++
                results.errors.push({ unit_number: item.unit_number, error: 'Unit not found' })
                continue
            }

            // Prepare Bill
            const billNumber = `OPENING-${item.unit_number}-${item.date.replace(/-/g, '')}`
            const [year, month] = item.date.split('-').map(Number)

            const bill = {
                unit_id: unit.id,
                project_id: unit.project_id || projectId,
                bill_number: billNumber,
                month: `${year}-${String(month).padStart(2, '0')}`,
                year: year,
                total: item.amount,
                common_fee: item.amount,
                status: 'pending',
                due_date: item.date,
                created_at: new Date(item.date).toISOString(),
                type: 'beginning_balance'
            }

            billsToInsert.push(bill)
            results.success++
        }

        if (billsToInsert.length === 0) {
            return {
                success: true,
                imported: 0,
                failed: results.failed,
                errors: results.errors,
                message: 'No valid items to import'
            }
        }

        // 3. Batch Insert Bills
        const { data: insertedBills, error: insertError } = await supabase
            .from('bills')
            .insert(billsToInsert)
            .select()

        if (insertError) {
            console.error('[importBeginningBalances] Batch insert error:', insertError)
            throw insertError
        }

        // 4. Create GL Entries
        for (const bill of insertedBills) {
            glEntries.push({
                transaction_date: bill.created_at,
                account_code: '1201', // AR
                debit: bill.total,
                credit: 0,
                description: `Beginning Balance - Unit ${unitMap.get(bill.unit_id)?.unit_number || ''}`,
                reference_type: 'bill',
                reference_id: bill.id,
                project_id: bill.project_id
            })
            glEntries.push({
                transaction_date: bill.created_at,
                account_code: '4101', // Revenue
                debit: 0,
                credit: bill.total,
                description: `Beginning Balance - Unit ${unitMap.get(bill.unit_id)?.unit_number || ''}`,
                reference_type: 'bill',
                reference_id: bill.id,
                project_id: bill.project_id
            })
        }

        if (glEntries.length > 0) {
            const { error: glError } = await supabase.from('general_ledger').insert(glEntries)
            if (glError) console.error('[importBeginningBalances] GL insert error:', glError)
        }

        revalidatePath('/(admin)/billing')
        revalidatePath('/(admin)/dashboard')

        return {
            success: true,
            imported: results.success,
            failed: results.failed,
            errors: results.errors
        }

    } catch (error: any) {
        console.error('[importBeginningBalances] Fatal error:', error)
        return {
            success: false,
            imported: 0,
            failed: 0,
            errors: [],
            error: error.message
        }
    }
}
