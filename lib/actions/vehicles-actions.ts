"use server"

import { createClient } from '@/lib/supabase/server'
import { checkPermission } from '@/lib/permissions/permission-checker'
import { revalidatePath } from 'next/cache'

export type Vehicle = {
    id: string
    unit_id: string
    type: 'car' | 'motorcycle' | 'other'
    license_plate: string
    brand?: string
    model?: string
    color?: string
    owner_name?: string
    sticker_number?: string
    status: 'active' | 'inactive'
    created_at?: string
    updated_at?: string
}

/**
 * Get vehicles for a unit
 */
export async function getUnitVehicles(userId: string, unitId: string) {
    const supabase = await createClient()

    try {
        const check = await checkPermission(userId, 'units.view')
        if (!check.allowed) {
            return { success: false, error: check.reason }
        }

        const { data, error } = await supabase
            .from('vehicles')
            .select('*')
            .eq('unit_id', unitId)
            .order('created_at', { ascending: false })

        if (error) throw error

        return { success: true, vehicles: data || [] }
    } catch (error: any) {
        console.error('[getUnitVehicles] Error:', error)
        return { success: false, error: error.message, vehicles: [] }
    }
}

/**
 * Create vehicle
 */
export async function createVehicle(
    userId: string,
    vehicleData: Omit<Vehicle, 'id' | 'created_at' | 'updated_at'>
) {
    const supabase = await createClient()

    try {
        const check = await checkPermission(userId, 'units.update')
        if (!check.allowed) {
            return { success: false, error: check.reason }
        }

        const { data, error } = await supabase
            .from('vehicles')
            .insert([vehicleData])
            .select()
            .single()

        if (error) throw error

        revalidatePath('/units')
        return { success: true, vehicle: data }
    } catch (error: any) {
        console.error('[createVehicle] Error:', error)
        return { success: false, error: error.message }
    }
}

/**
 * Update vehicle
 */
export async function updateVehicle(
    userId: string,
    vehicleId: string,
    vehicleData: Partial<Vehicle>
) {
    const supabase = await createClient()

    try {
        const check = await checkPermission(userId, 'units.update')
        if (!check.allowed) {
            return { success: false, error: check.reason }
        }

        const { data, error } = await supabase
            .from('vehicles')
            .update({
                ...vehicleData,
                updated_at: new Date().toISOString()
            })
            .eq('id', vehicleId)
            .select()
            .single()

        if (error) throw error

        revalidatePath('/units')
        return { success: true, vehicle: data }
    } catch (error: any) {
        console.error('[updateVehicle] Error:', error)
        return { success: false, error: error.message }
    }
}

/**
 * Delete vehicle
 */
export async function deleteVehicle(userId: string, vehicleId: string) {
    const supabase = await createClient()

    try {
        const check = await checkPermission(userId, 'units.update')
        if (!check.allowed) {
            return { success: false, error: check.reason }
        }

        const { error } = await supabase
            .from('vehicles')
            .delete()
            .eq('id', vehicleId)

        if (error) throw error

        revalidatePath('/units')
        return { success: true }
    } catch (error: any) {
        console.error('[deleteVehicle] Error:', error)
        return { success: false, error: error.message }
    }
}
