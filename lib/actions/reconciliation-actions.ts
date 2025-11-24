// lib/actions/reconciliation-actions.ts
"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { checkPermission } from "@/lib/permissions/permission-checker"

export type ReconciliationStatus = 'pending' | 'matched' | 'reviewed' | 'rejected'

export type BankReconciliationMatch = {
    id: string
    project_id: string | null
    bank_date: string
    bank_description: string | null
    bank_amount: number
    bank_reference: string | null
    bank_account: string | null
    payment_id: string | null
    match_confidence: number
    status: ReconciliationStatus
    notes: string | null
    matched_by_user_id: string | null
    reviewed_by_user_id: string | null
    reviewed_at: string | null
    created_at: string
    updated_at: string
}

export type ReconciliationSummary = {
    total_transactions: number
    matched_count: number
    pending_count: number
    reviewed_count: number
    rejected_count: number
    unmatched_count: number
    total_matched_amount: number
    total_pending_amount: number
}

/**
 * Get bank reconciliation matches with optional filters
 */
export async function getBankReconciliationMatches(
    projectId: string | null,
    filters?: {
        status?: ReconciliationStatus
        dateFrom?: string
        dateTo?: string
        minConfidence?: number
    },
    userId?: string
) {
    try {
        const supabase = await createClient()
        const { data: { user: supabaseUser } } = await supabase.auth.getUser()

        const effectiveUserId = supabaseUser?.id || userId

        if (!effectiveUserId) {
            return { success: false, error: 'Unauthorized' }
        }

        // Check permission
        const { allowed, reason } = await checkPermission(effectiveUserId, 'payments.view')
        if (!allowed) {
            return { success: false, error: reason || 'Insufficient permissions' }
        }

        let query = supabase
            .from('bank_reconciliation_matches')
            .select(`
        *,
        payment:payments(
          id,
          amount,
          payment_date,
          reference_number,
          unit_id,
          bill_id
        )
      `)
            .order('bank_date', { ascending: false })

        if (projectId) {
            query = query.eq('project_id', projectId)
        }

        if (filters?.status) {
            query = query.eq('status', filters.status)
        }

        if (filters?.dateFrom) {
            query = query.gte('bank_date', filters.dateFrom)
        }

        if (filters?.dateTo) {
            query = query.lte('bank_date', filters.dateTo)
        }

        if (filters?.minConfidence !== undefined) {
            query = query.gte('match_confidence', filters.minConfidence)
        }

        const { data, error } = await query

        if (error) {
            console.error('[getBankReconciliationMatches] Error:', error)
            return { success: false, error: error.message }
        }

        return { success: true, data: data as BankReconciliationMatch[] }
    } catch (error: any) {
        console.error('[getBankReconciliationMatches] Exception:', error)
        return { success: false, error: error.message }
    }
}

/**
 * Create a new reconciliation match
 */
export async function createReconciliationMatch(
    projectId: string | null,
    bankData: {
        bank_date: string
        bank_description: string
        bank_amount: number
        bank_reference?: string
        bank_account?: string
    },
    paymentId: string | null,
    matchConfidence: number,
    userId: string
) {
    try {
        const supabase = await createClient()
        const { data: { user: supabaseUser } } = await supabase.auth.getUser()

        const effectiveUserId = supabaseUser?.id || userId

        if (!effectiveUserId) {
            return { success: false, error: 'Unauthorized' }
        }

        // Check permission
        const { allowed, reason } = await checkPermission(effectiveUserId, 'payments.create')
        if (!allowed) {
            return { success: false, error: reason || 'Insufficient permissions' }
        }

        const { data, error } = await supabase
            .from('bank_reconciliation_matches')
            .insert({
                project_id: projectId,
                bank_date: bankData.bank_date,
                bank_description: bankData.bank_description,
                bank_amount: bankData.bank_amount,
                bank_reference: bankData.bank_reference || null,
                bank_account: bankData.bank_account || null,
                payment_id: paymentId,
                match_confidence: matchConfidence,
                status: paymentId ? 'matched' : 'pending',
                matched_by_user_id: userId,
            })
            .select()
            .single()

        if (error) {
            console.error('[createReconciliationMatch] Error:', error)
            return { success: false, error: error.message }
        }

        // If matched with a payment, update the payment record
        if (paymentId) {
            await supabase
                .from('payments')
                .update({
                    reconciled: true,
                    reconciliation_date: bankData.bank_date,
                })
                .eq('id', paymentId)
        }

        revalidatePath('/payments/bank-reconciliation')
        return { success: true, data }
    } catch (error: any) {
        console.error('[createReconciliationMatch] Exception:', error)
        return { success: false, error: error.message }
    }
}

/**
 * Update reconciliation match status
 */
export async function updateReconciliationStatus(
    matchId: string,
    status: ReconciliationStatus,
    notes?: string,
    userId?: string
) {
    try {
        const supabase = await createClient()
        const { data: { user: supabaseUser } } = await supabase.auth.getUser()

        const effectiveUserId = supabaseUser?.id || userId

        if (!effectiveUserId) {
            return { success: false, error: 'Unauthorized' }
        }

        // Check permission
        const { allowed, reason } = await checkPermission(effectiveUserId, 'payments.update')
        if (!allowed) {
            return { success: false, error: reason || 'Insufficient permissions' }
        }

        const updateData: any = {
            status,
            notes: notes || null,
        }

        // If status is reviewed or rejected, record the reviewer
        if ((status === 'reviewed' || status === 'rejected') && userId) {
            updateData.reviewed_by_user_id = userId
            updateData.reviewed_at = new Date().toISOString()
        }

        const { data, error } = await supabase
            .from('bank_reconciliation_matches')
            .update(updateData)
            .eq('id', matchId)
            .select()
            .single()

        if (error) {
            console.error('[updateReconciliationStatus] Error:', error)
            return { success: false, error: error.message }
        }

        revalidatePath('/payments/bank-reconciliation')
        return { success: true, data }
    } catch (error: any) {
        console.error('[updateReconciliationStatus] Exception:', error)
        return { success: false, error: error.message }
    }
}

/**
 * Delete a reconciliation match
 */
export async function deleteReconciliationMatch(matchId: string, userId?: string) {
    try {
        const supabase = await createClient()
        const { data: { user: supabaseUser } } = await supabase.auth.getUser()

        const effectiveUserId = supabaseUser?.id || userId

        if (!effectiveUserId) {
            return { success: false, error: 'Unauthorized' }
        }

        // Check permission
        const { allowed, reason } = await checkPermission(effectiveUserId, 'payments.delete')
        if (!allowed) {
            return { success: false, error: reason || 'Insufficient permissions' }
        }

        // Get the match first to check if we need to update the payment
        const { data: match } = await supabase
            .from('bank_reconciliation_matches')
            .select('payment_id')
            .eq('id', matchId)
            .single()

        const { error } = await supabase
            .from('bank_reconciliation_matches')
            .delete()
            .eq('id', matchId)

        if (error) {
            console.error('[deleteReconciliationMatch] Error:', error)
            return { success: false, error: error.message }
        }

        // If this match was linked to a payment, unmark it as reconciled
        if (match?.payment_id) {
            await supabase
                .from('payments')
                .update({
                    reconciled: false,
                    reconciliation_date: null,
                })
                .eq('id', match.payment_id)
        }

        revalidatePath('/payments/bank-reconciliation')
        return { success: true }
    } catch (error: any) {
        console.error('[deleteReconciliationMatch] Exception:', error)
        return { success: false, error: error.message }
    }
}

/**
 * Get reconciliation summary statistics
 */
export async function getReconciliationSummary(
    projectId: string | null,
    dateFrom?: string,
    dateTo?: string,
    userId?: string
): Promise<{ success: boolean; data?: ReconciliationSummary; error?: string }> {
    try {
        const supabase = await createClient()
        const { data: { user: supabaseUser } } = await supabase.auth.getUser()

        const effectiveUserId = supabaseUser?.id || userId

        if (!effectiveUserId) {
            return { success: false, error: 'Unauthorized' }
        }

        // Check permission
        const { allowed, reason } = await checkPermission(effectiveUserId, 'payments.view')
        if (!allowed) {
            return { success: false, error: reason || 'Insufficient permissions' }
        }

        let query = supabase
            .from('bank_reconciliation_matches')
            .select('status, bank_amount, payment_id')

        if (projectId) {
            query = query.eq('project_id', projectId)
        }

        if (dateFrom) {
            query = query.gte('bank_date', dateFrom)
        }

        if (dateTo) {
            query = query.lte('bank_date', dateTo)
        }

        const { data, error } = await query

        if (error) {
            console.error('[getReconciliationSummary] Error:', error)
            return { success: false, error: error.message }
        }

        const summary: ReconciliationSummary = {
            total_transactions: data.length,
            matched_count: data.filter(r => r.status === 'matched').length,
            pending_count: data.filter(r => r.status === 'pending').length,
            reviewed_count: data.filter(r => r.status === 'reviewed').length,
            rejected_count: data.filter(r => r.status === 'rejected').length,
            unmatched_count: data.filter(r => !r.payment_id).length,
            total_matched_amount: data
                .filter(r => r.status === 'matched')
                .reduce((sum, r) => sum + Number(r.bank_amount), 0),
            total_pending_amount: data
                .filter(r => r.status === 'pending')
                .reduce((sum, r) => sum + Number(r.bank_amount), 0),
        }

        return { success: true, data: summary }
    } catch (error: any) {
        console.error('[getReconciliationSummary] Exception:', error)
        return { success: false, error: error.message }
    }
}

/**
 * Bulk update reconciliation matches
 */
export async function bulkUpdateReconciliationStatus(
    matchIds: string[],
    status: ReconciliationStatus,
    userId?: string
) {
    try {
        const supabase = await createClient()
        const { data: { user: supabaseUser } } = await supabase.auth.getUser()

        const effectiveUserId = supabaseUser?.id || userId

        if (!effectiveUserId) {
            return { success: false, error: 'Unauthorized' }
        }

        // Check permission
        const { allowed, reason } = await checkPermission(effectiveUserId, 'payments.update')
        if (!allowed) {
            return { success: false, error: reason || 'Insufficient permissions' }
        }

        const updateData: any = { status }

        if ((status === 'reviewed' || status === 'rejected') && userId) {
            updateData.reviewed_by_user_id = userId
            updateData.reviewed_at = new Date().toISOString()
        }

        const { error } = await supabase
            .from('bank_reconciliation_matches')
            .update(updateData)
            .in('id', matchIds)

        if (error) {
            console.error('[bulkUpdateReconciliationStatus] Error:', error)
            return { success: false, error: error.message }
        }

        revalidatePath('/payments/bank-reconciliation')
        return { success: true }
    } catch (error: any) {
        console.error('[bulkUpdateReconciliationStatus] Exception:', error)
        return { success: false, error: error.message }
    }
}

/**
 * Export reconciliation report
 */
export async function exportReconciliationReport(
    projectId: string | null,
    filters?: {
        status?: ReconciliationStatus
        dateFrom?: string
        dateTo?: string
    },
    userId?: string
) {
    try {
        const supabase = await createClient()
        const { data: { user: supabaseUser } } = await supabase.auth.getUser()

        const effectiveUserId = supabaseUser?.id || userId

        if (!effectiveUserId) {
            return { success: false, error: 'Unauthorized' }
        }

        // Check permission
        const { allowed, reason } = await checkPermission(effectiveUserId, 'reports.export')
        if (!allowed) {
            return { success: false, error: reason || 'Insufficient permissions' }
        }

        let query = supabase
            .from('bank_reconciliation_matches')
            .select(`
                *,
                payment:payments(
                    reference_number,
                    payment_date,
                    amount
                )
            `)
            .order('bank_date', { ascending: false })

        if (projectId) {
            query = query.eq('project_id', projectId)
        }

        if (filters?.status) {
            query = query.eq('status', filters.status)
        }

        if (filters?.dateFrom) {
            query = query.gte('bank_date', filters.dateFrom)
        }

        if (filters?.dateTo) {
            query = query.lte('bank_date', filters.dateTo)
        }

        const { data, error } = await query

        if (error) {
            console.error('[exportReconciliationReport] Error:', error)
            return { success: false, error: error.message }
        }

        // Convert to CSV
        const headers = [
            'Bank Date',
            'Bank Description',
            'Bank Amount',
            'Bank Reference',
            'Status',
            'Match Confidence',
            'Payment Reference',
            'Payment Date',
            'Payment Amount',
            'Notes',
            'Reviewed At'
        ].join(',')

        const rows = (data || []).map((row: any) => {
            return [
                row.bank_date,
                `"${(row.bank_description || '').replace(/"/g, '""')}"`,
                row.bank_amount,
                `"${(row.bank_reference || '').replace(/"/g, '""')}"`,
                row.status,
                `${row.match_confidence}%`,
                `"${(row.payment?.reference_number || '').replace(/"/g, '""')}"`,
                row.payment?.payment_date || '',
                row.payment?.amount || '',
                `"${(row.notes || '').replace(/"/g, '""')}"`,
                row.reviewed_at || ''
            ].join(',')
        })

        const csv = [headers, ...rows].join('\n')

        return { success: true, data: csv }
    } catch (error: any) {
        console.error('[exportReconciliationReport] Exception:', error)
        return { success: false, error: error.message }
    }
}
