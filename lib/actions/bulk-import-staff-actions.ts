"use server"

import { createClient } from "@/lib/supabase/server"
import { addTeamMember } from "@/lib/actions/team-actions"

export interface StaffItem {
    email: string
    full_name: string
    phone?: string
    role: 'staff' | 'engineer' | 'resident'
    unit_number?: string
}

export async function importStaff(items: StaffItem[], projectId?: string | null) {
    const supabase = await createClient()

    // Get current user for permission check (addTeamMember handles this, but we need the ID)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return { success: false, error: "Unauthorized" }
    }

    if (!projectId) {
        return { success: false, error: "Project ID is required" }
    }

    // Get company ID from project
    const { data: project } = await supabase
        .from('projects')
        .select('company_id')
        .eq('id', projectId)
        .single()

    if (!project) {
        return { success: false, error: "Project not found" }
    }

    let results = {
        success: true,
        imported: 0,
        failed: 0,
        errors: [] as any[]
    }

    for (const item of items) {
        try {
            // Validate required fields
            if (!item.email || !item.full_name || !item.role) {
                throw new Error("Missing required fields: email, full_name, or role")
            }

            if (item.role === 'resident' && !item.unit_number) {
                throw new Error("Unit number is required for residents")
            }

            // Call existing action to add team member
            // This handles user creation, role assignment, and duplicate checks
            const result = await addTeamMember(
                user.id,
                projectId,
                project.company_id,
                {
                    email: item.email,
                    full_name: item.full_name,
                    phone: item.phone,
                    role: item.role,
                    unit_number: item.unit_number
                }
            )

            if (result.success) {
                results.imported++
            } else {
                throw new Error(result.error || "Failed to add member")
            }

        } catch (error: any) {
            console.error(`[importStaff] Error processing ${item.email}:`, error)
            results.failed++
            results.errors.push({
                email: item.email,
                error: error.message
            })
        }
    }

    return results
}
