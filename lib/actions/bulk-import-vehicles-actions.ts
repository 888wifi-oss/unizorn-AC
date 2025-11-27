"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export interface VehicleItem {
    unit_number: string
    license_plate: string
    type: string // car, motorcycle, other
    brand?: string
    model?: string
    color?: string
    sticker_number?: string
    owner_name?: string
    project_id?: string
}

export async function importVehicles(items: VehicleItem[], projectId?: string | null) {
    const supabase = await createClient()
    console.log('[importVehicles] Starting import with', items.length, 'items')

    try {
        const results = {
            success: 0,
            failed: 0,
            errors: [] as Array<{ license_plate: string; error: string }>
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
        const vehiclesToInsert = []

        for (const item of items) {
            const unit = unitMap.get(item.unit_number)
            if (!unit) {
                results.failed++
                results.errors.push({ license_plate: item.license_plate, error: `Unit ${item.unit_number} not found` })
                continue
            }

            vehiclesToInsert.push({
                unit_id: unit.id,
                license_plate: item.license_plate,
                type: item.type.toLowerCase(),
                brand: item.brand,
                model: item.model,
                color: item.color,
                sticker_number: item.sticker_number,
                owner_name: item.owner_name,
                status: 'active',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            })
        }

        if (vehiclesToInsert.length === 0) {
            return {
                success: true,
                imported: 0,
                failed: results.failed,
                errors: results.errors,
                message: 'No valid items to import'
            }
        }

        // Batch insert
        const { data, error } = await supabase
            .from('vehicles')
            .insert(vehiclesToInsert)
            .select()

        if (error) {
            console.error('[importVehicles] Batch insert error:', error)
            throw error
        }

        results.success = data?.length || 0

        revalidatePath('/(admin)/units') // Vehicles are usually shown in units page

        return {
            success: true,
            imported: results.success,
            failed: results.failed,
            errors: results.errors
        }

    } catch (error: any) {
        console.error('[importVehicles] Fatal error:', error)
        return {
            success: false,
            imported: 0,
            failed: 0,
            errors: [],
            error: error.message
        }
    }
}
