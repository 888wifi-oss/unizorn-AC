"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export interface COAItem {
    account_code: string
    account_name: string
    account_type: string // asset, liability, equity, revenue, expense
    level: number
    parent_code?: string
    description?: string
}

export async function importChartOfAccounts(items: COAItem[]) {
    const supabase = await createClient()
    console.log('[importChartOfAccounts] Starting import with', items.length, 'items')

    try {
        const results = {
            success: 0,
            failed: 0,
            errors: [] as Array<{ account_code: string; error: string }>
        }

        const coaToInsert = items.map(item => ({
            account_code: item.account_code,
            account_name: item.account_name,
            account_type: item.account_type.toLowerCase(),
            level: item.level,
            parent_code: item.parent_code,
            description: item.description,
            is_active: true
        }))

        if (coaToInsert.length === 0) {
            return {
                success: true,
                imported: 0,
                failed: 0,
                errors: [],
                message: 'No valid items to import'
            }
        }

        // Batch insert
        // Note: COA usually requires unique account_code. Upsert might be better or ignore duplicates.
        // For simplicity, we try insert and let it fail on duplicates or handle errors.
        // But bulk insert will fail entire batch if one fails.
        // So we might need to do one by one or use upsert.
        // Let's use upsert to update existing names/types if code matches.

        const { data, error } = await supabase
            .from('chart_of_accounts')
            .upsert(coaToInsert, { onConflict: 'account_code' })
            .select()

        if (error) {
            console.error('[importChartOfAccounts] Batch upsert error:', error)
            throw error
        }

        results.success = data?.length || 0

        revalidatePath('/(admin)/chart-of-accounts')

        return {
            success: true,
            imported: results.success,
            failed: results.failed,
            errors: results.errors
        }

    } catch (error: any) {
        console.error('[importChartOfAccounts] Fatal error:', error)
        return {
            success: false,
            imported: 0,
            failed: 0,
            errors: [],
            error: error.message
        }
    }
}
