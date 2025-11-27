"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export interface VendorItem {
    name: string
    contact_person?: string
    phone?: string
    email?: string
    tax_id?: string
    address?: string
    notes?: string
    project_id?: string
}

export async function importVendors(items: VendorItem[], projectId?: string | null) {
    const supabase = await createClient()
    console.log('[importVendors] Starting import with', items.length, 'items')

    try {
        const results = {
            success: 0,
            failed: 0,
            errors: [] as Array<{ name: string; error: string }>
        }

        const vendorsToInsert = items.map(item => ({
            name: item.name,
            contact_person: item.contact_person,
            phone: item.phone,
            email: item.email,
            tax_id: item.tax_id,
            address: item.address,
            notes: item.notes,
            project_id: projectId || item.project_id
        }))

        if (vendorsToInsert.length === 0) {
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
            .from('vendors')
            .insert(vendorsToInsert)
            .select()

        if (error) {
            console.error('[importVendors] Batch insert error:', error)
            throw error
        }

        results.success = data?.length || 0

        revalidatePath('/(admin)/vendors')

        return {
            success: true,
            imported: results.success,
            failed: results.failed,
            errors: results.errors
        }

    } catch (error: any) {
        console.error('[importVendors] Fatal error:', error)
        return {
            success: false,
            imported: 0,
            failed: 0,
            errors: [],
            error: error.message
        }
    }
}
