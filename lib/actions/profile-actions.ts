"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

// Update LINE ID for a specific UNIT (since we use Ultra Simple Auth linked to Units)
export async function updateUnitLineId(unitId: string, lineUserId: string) {
    console.log('[updateUnitLineId] Starting update for Unit ID:', unitId, 'with LINE ID:', lineUserId)
    const supabase = await createClient()

    try {
        const { data, error } = await supabase
            .from('units')
            .update({ line_user_id: lineUserId })
            .eq('id', unitId)
            .select()

        if (error) {
            console.error('[updateUnitLineId] Supabase error:', error)
            throw error
        }

        console.log('[updateUnitLineId] Update successful:', data)
        revalidatePath('/portal/profile')
        return { success: true }
    } catch (error: any) {
        console.error('[updateUnitLineId] Exception:', error)
        return { success: false, error: error.message }
    }
}

// Get Profile based on Unit ID (Ultra Simple Auth)
export async function getUnitProfile(unitId: string) {
    const supabase = await createClient()

    try {
        // Fetch unit info directly
        const { data: unit, error } = await supabase
            .from('units')
            .select('id, unit_number, owner_name, owner_email, owner_phone, resident_name, line_user_id')
            .eq('id', unitId)
            .single()

        if (error) throw error

        let displayName = unit.resident_name
        let displayEmail = unit.owner_email
        let displayPhone = unit.owner_phone

        // Force check for Active Tenant first (Same logic as Ultra Simple Auth)
        const { data: tenants } = await supabase
            .from('tenants')
            .select('name, email, phone')
            .eq('unit_id', unit.id)
            .eq('status', 'active')
            .limit(1)

        if (tenants && tenants.length > 0) {
            displayName = tenants[0].name
            // If tenant has specific contact info, we might want to use it or fallback to unit owner
            // For now, let's prefer tenant info if available
            if (tenants[0].email) displayEmail = tenants[0].email
            if (tenants[0].phone) displayPhone = tenants[0].phone
        }

        // Map to a consistent user object structure for frontend
        const userProfile = {
            id: unit.id,
            full_name: displayName || unit.owner_name || `ผู้อาศัยห้อง ${unit.unit_number}`,
            email: displayEmail || '',
            phone: displayPhone || '',
            line_user_id: unit.line_user_id || '',
            unit_number: unit.unit_number
        }

        return { success: true, user: userProfile }
    } catch (error: any) {
        console.error('Error getting unit profile:', error)
        return { success: false, error: error.message }
    }
}

// Deprecated: Kept for compatibility if Admin Portal uses it (but Resident Portal uses getUnitProfile)
export async function updateUserLineId(userId: string, lineUserId: string) {
    return updateUnitLineId(userId, lineUserId) // Fallback: assume userId passed might be unitId in mixed context
}

export async function getUserProfile(userId: string) {
    // Try fetching as unit first (Ultra Simple Auth style)
    const unitResult = await getUnitProfile(userId)
    if (unitResult.success) return unitResult

    // Fallback to original logic (Supabase Auth)
    const supabase = await createClient()
    try {
        const { data, error } = await supabase.from('users').select('*').eq('id', userId).single()
        if (error) throw error
        return { success: true, user: data }
    } catch (e: any) {
        return { success: false, error: e.message }
    }
}
