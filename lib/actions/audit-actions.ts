"use server"

import { createClient } from "@/lib/supabase/server"
import { AuditLog } from "@/lib/types/permissions"

/**
 * Log an action to the audit_logs table
 */
export async function logAudit(
    userId: string,
    action: string,
    resourceType: string,
    resourceId?: string,
    details?: Record<string, any>,
    companyId?: string,
    projectId?: string
) {
    try {
        const supabase = await createClient()

        // We can optionally get IP and User Agent from headers() here if needed
        // but for now we'll keep it simple

        const { error } = await supabase
            .from('audit_logs')
            .insert({
                user_id: userId,
                action,
                resource_type: resourceType,
                resource_id: resourceId,
                details,
                // company_id: companyId, // If we add these columns later
                // project_id: projectId
            })

        if (error) {
            console.error('[logAudit] Error inserting log:', error)
            // We don't throw here to prevent breaking the main action
        }
    } catch (error) {
        console.error('[logAudit] Exception:', error)
    }
}

/**
 * Get audit logs with filtering
 */
export async function getAuditLogs(
    filters?: {
        userId?: string
        action?: string
        resourceType?: string
        dateFrom?: string
        dateTo?: string
        limit?: number
        offset?: number
    }
): Promise<{ success: boolean; data?: AuditLog[]; count?: number; error?: string }> {
    try {
        const supabase = await createClient()

        let query = supabase
            .from('audit_logs')
            .select('*', { count: 'exact' })
            .order('created_at', { ascending: false })

        if (filters?.userId) {
            query = query.eq('user_id', filters.userId)
        }

        if (filters?.action) {
            query = query.eq('action', filters.action)
        }

        if (filters?.resourceType) {
            query = query.eq('resource_type', filters.resourceType)
        }

        if (filters?.dateFrom) {
            query = query.gte('created_at', filters.dateFrom)
        }

        if (filters?.dateTo) {
            query = query.lte('created_at', filters.dateTo)
        }

        if (filters?.limit) {
            query = query.limit(filters.limit)
        }

        if (filters?.offset) {
            query = query.range(filters.offset, filters.offset + (filters.limit || 20) - 1)
        }

        const { data, error, count } = await query

        if (error) {
            console.error('[getAuditLogs] Error:', error)
            return { success: false, error: error.message }
        }

        return { success: true, data: data as AuditLog[], count: count || 0 }
    } catch (error: any) {
        console.error('[getAuditLogs] Exception:', error)
        return { success: false, error: error.message }
    }
}
