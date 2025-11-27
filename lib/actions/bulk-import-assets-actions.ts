"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export interface AssetItem {
    asset_name: string
    asset_code?: string
    purchase_date: string // YYYY-MM-DD
    purchase_cost: number
    lifespan_years: number
    salvage_value?: number
    location?: string
    description?: string
    status?: string
    asset_account_code?: string
    depreciation_account_code?: string
    expense_account_code?: string
    project_id?: string
}

export async function importFixedAssets(items: AssetItem[], projectId?: string | null) {
    const supabase = await createClient()
    console.log('[importFixedAssets] Starting import with', items.length, 'items')

    try {
        const results = {
            success: 0,
            failed: 0,
            errors: [] as Array<{ asset_name: string; error: string }>
        }

        const assetsToInsert = items.map(item => ({
            asset_name: item.asset_name,
            asset_code: item.asset_code,
            purchase_date: item.purchase_date,
            purchase_cost: item.purchase_cost,
            lifespan_years: item.lifespan_years,
            salvage_value: item.salvage_value || 0,
            location: item.location,
            description: item.description,
            status: item.status || 'in_use',
            asset_account_code: item.asset_account_code || '1201',
            depreciation_account_code: item.depreciation_account_code || '1204',
            expense_account_code: item.expense_account_code || '5901',
            project_id: projectId || item.project_id
        }))

        if (assetsToInsert.length === 0) {
            return {
                success: true,
                imported: 0,
                failed: 0,
                errors: [],
                message: 'No valid items to import'
            }
        }

        // Batch insert
        const { data, error } = await supabase
            .from('fixed_assets')
            .insert(assetsToInsert)
            .select()

        if (error) {
            console.error('[importFixedAssets] Batch insert error:', error)
            throw error
        }

        results.success = data?.length || 0

        revalidatePath('/(admin)/fixed-assets')

        return {
            success: true,
            imported: results.success,
            failed: results.failed,
            errors: results.errors
        }

    } catch (error: any) {
        console.error('[importFixedAssets] Fatal error:', error)
        return {
            success: false,
            imported: 0,
            failed: 0,
            errors: [],
            error: error.message
        }
    }
}
