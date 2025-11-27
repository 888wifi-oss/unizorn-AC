"use server"

import { createClient } from "@/lib/supabase/server"
import { saveBillToDB } from "@/lib/supabase/actions"

export interface ARItem {
    unit_number: string
    amount: number
    bill_date: string // YYYY-MM-DD
    due_date: string // YYYY-MM-DD
    bill_type: 'water' | 'electricity' | 'common_fee' | 'fine' | 'other'
    description: string
}

export async function importOtherAR(items: ARItem[], projectId?: string | null) {
    const supabase = await createClient()

    if (!projectId) {
        return { success: false, error: "Project ID is required" }
    }

    let results = {
        success: true,
        imported: 0,
        failed: 0,
        errors: [] as any[]
    }

    // 1. Fetch all units for lookup
    const { data: units, error: unitError } = await supabase
        .from('units')
        .select('id, unit_number')
        .eq('project_id', projectId)

    if (unitError) {
        return { success: false, error: "Failed to fetch units" }
    }

    const unitMap = new Map(units?.map(u => [u.unit_number.toLowerCase().trim(), u.id]))

    for (const item of items) {
        try {
            // Validate required fields
            if (!item.unit_number || !item.amount || !item.bill_date || !item.due_date || !item.bill_type) {
                throw new Error("Missing required fields")
            }

            // Lookup Unit ID
            const unitId = unitMap.get(item.unit_number.toLowerCase().trim())
            if (!unitId) {
                throw new Error(`Unit '${item.unit_number}' not found.`)
            }

            // Create Bill
            // We reuse saveBillToDB which handles bill creation and GL entries
            await saveBillToDB({
                unit_id: unitId,
                bill_type: item.bill_type,
                amount: item.amount,
                bill_date: item.bill_date,
                due_date: item.due_date,
                description: item.description || `Imported ${item.bill_type} bill`,
                status: 'pending',
                project_id: projectId
            })

            results.imported++

        } catch (error: any) {
            console.error(`[importOtherAR] Error processing bill for ${item.unit_number}:`, error)
            results.failed++
            results.errors.push({
                unit: item.unit_number,
                error: error.message
            })
        }
    }

    return results
}
