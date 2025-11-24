"use server"

import { createClient } from '@/lib/supabase/server'
import { checkPermission } from '@/lib/permissions/permission-checker'
import { revalidatePath } from 'next/cache'

export type Pet = {
    id: string
    unit_id: string
    type: 'dog' | 'cat' | 'other'
    name: string
    breed?: string
    color?: string
    weight?: number
    vaccination_status: boolean
    notes?: string
    created_at?: string
    updated_at?: string
}

/**
 * Get pets for a unit
 */
export async function getUnitPets(userId: string, unitId: string) {
    const supabase = await createClient()

    try {
        const check = await checkPermission(userId, 'units.view')
        if (!check.allowed) {
            return { success: false, error: check.reason }
        }

        const { data, error } = await supabase
            .from('pets')
            .select('*')
            .eq('unit_id', unitId)
            .order('created_at', { ascending: false })

        if (error) throw error

        return { success: true, pets: data || [] }
    } catch (error: any) {
        console.error('[getUnitPets] Error:', error)
        return { success: false, error: error.message, pets: [] }
    }
}

/**
 * Create pet
 */
export async function createPet(
    userId: string,
    petData: Omit<Pet, 'id' | 'created_at' | 'updated_at'>
) {
    const supabase = await createClient()

    try {
        const check = await checkPermission(userId, 'units.update')
        if (!check.allowed) {
            return { success: false, error: check.reason }
        }

        const { data, error } = await supabase
            .from('pets')
            .insert([petData])
            .select()
            .single()

        if (error) throw error

        revalidatePath('/units')
        return { success: true, pet: data }
    } catch (error: any) {
        console.error('[createPet] Error:', error)
        return { success: false, error: error.message }
    }
}

/**
 * Update pet
 */
export async function updatePet(
    userId: string,
    petId: string,
    petData: Partial<Pet>
) {
    const supabase = await createClient()

    try {
        const check = await checkPermission(userId, 'units.update')
        if (!check.allowed) {
            return { success: false, error: check.reason }
        }

        const { data, error } = await supabase
            .from('pets')
            .update({
                ...petData,
                updated_at: new Date().toISOString()
            })
            .eq('id', petId)
            .select()
            .single()

        if (error) throw error

        revalidatePath('/units')
        return { success: true, pet: data }
    } catch (error: any) {
        console.error('[updatePet] Error:', error)
        return { success: false, error: error.message }
    }
}

/**
 * Delete pet
 */
export async function deletePet(userId: string, petId: string) {
    const supabase = await createClient()

    try {
        const check = await checkPermission(userId, 'units.update')
        if (!check.allowed) {
            return { success: false, error: check.reason }
        }

        const { error } = await supabase
            .from('pets')
            .delete()
            .eq('id', petId)

        if (error) throw error

        revalidatePath('/units')
        return { success: true }
    } catch (error: any) {
        console.error('[deletePet] Error:', error)
        return { success: false, error: error.message }
    }
}
