"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
// Checking bulk-import-outstanding-actions.ts, it uses createClient from "@/lib/supabase/server"
// It fetches user via supabase.auth.getUser()

export async function deleteBill(billId: string, projectId: string) {
    if (!billId || !projectId) {
        return { success: false, error: "Missing bill ID or project ID" }
    }

    const supabase = await createClient()

    try {
        // 1. Check if bill exists and is not paid
        const { data: bill, error: fetchError } = await supabase
            .from('bills')
            .select('id, status, bill_number, total')
            .eq('id', billId)
            .eq('project_id', projectId)
            .single()

        if (fetchError || !bill) {
            return { success: false, error: "Bill not found" }
        }

        if (bill.status === 'paid') {
            return { success: false, error: "Cannot delete a paid bill" }
        }

        // 2. Delete related General Ledger entries
        const { error: glError } = await supabase
            .from('general_ledger')
            .delete()
            .eq('reference_id', billId)
            .eq('reference_type', 'bill')
            .eq('project_id', projectId)

        if (glError) {
            console.error("Error deleting GL entries:", glError)
            return { success: false, error: "Failed to delete related ledger entries" }
        }

        // 2.1 Delete related Revenue Journal entries (Fix for foreign key constraint)
        const { error: rjError } = await supabase
            .from('revenue_journal')
            .delete()
            .eq('bill_id', billId)
            .eq('project_id', projectId)

        if (rjError) {
            console.error("Error deleting Revenue Journal entries:", rjError)
            return { success: false, error: "Failed to delete related revenue journal entries" }
        }

        // 3. Delete the bill
        const { error: deleteError } = await supabase
            .from('bills')
            .delete()
            .eq('id', billId)

        if (deleteError) {
            console.error("Error deleting bill:", deleteError)
            return { success: false, error: `Failed to delete bill: ${deleteError.message}` }
        }

        // 4. Log to Audit Logs
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                // Get user ID from users table
                const { data: userData } = await supabase
                    .from('users')
                    .select('id')
                    .eq('email', user.email)
                    .single()

                if (userData) {
                    await supabase.from('audit_logs').insert({
                        user_id: userData.id,
                        action: 'delete_bill',
                        entity_type: 'bills',
                        entity_id: billId,
                        project_id: projectId,
                        details: { bill_number: bill.bill_number, amount: bill.total }
                    })
                }
            }
        } catch (auditError) {
            console.error("Error logging audit:", auditError)
            // Non-critical
        }

        revalidatePath("/(admin)/accounts-receivable")
        revalidatePath("/(admin)/billing")

        return { success: true }

    } catch (error: any) {
        console.error("Delete bill exception:", error)
        return { success: false, error: error.message }
    }
}

export async function bulkDeleteBills(billIds: string[], projectId: string) {
    if (!billIds || billIds.length === 0 || !projectId) {
        return { success: false, error: "No bills selected" }
    }

    const supabase = await createClient()
    const BATCH_SIZE = 50
    let totalDeleted = 0
    let totalSkipped = 0 // Paid bills
    let errors: string[] = []

    // Helper to chunk array
    const chunkArray = <T>(array: T[], size: number): T[][] => {
        const chunks: T[][] = []
        for (let i = 0; i < array.length; i += size) {
            chunks.push(array.slice(i, i + size))
        }
        return chunks
    }

    const batches = chunkArray(billIds, BATCH_SIZE)

    try {
        for (const batchIds of batches) {
            // 1. Fetch bills in this batch to check status
            const { data: bills, error: fetchError } = await supabase
                .from('bills')
                .select('id, status')
                .in('id', batchIds)
                .eq('project_id', projectId)

            if (fetchError) {
                console.error("Bulk delete fetch error:", fetchError)
                errors.push(`Batch fetch failed: ${fetchError.message}`)
                continue // Skip this batch
            }

            if (!bills || bills.length === 0) continue

            // 2. Filter valid bills (not paid)
            const validBillIds = bills.filter(b => b.status !== 'paid').map(b => b.id)
            const paidCount = bills.filter(b => b.status === 'paid').length
            totalSkipped += paidCount

            if (validBillIds.length === 0) continue

            // 3. Delete related GL entries
            const { error: glError } = await supabase
                .from('general_ledger')
                .delete()
                .in('reference_id', validBillIds)
                .eq('reference_type', 'bill')
                .eq('project_id', projectId)

            if (glError) {
                console.error("Bulk delete GL error:", glError)
                errors.push(`Failed to delete GL entries for batch`)
                continue
            }

            // 4. Delete related Revenue Journal entries
            const { error: rjError } = await supabase
                .from('revenue_journal')
                .delete()
                .in('bill_id', validBillIds)
                .eq('project_id', projectId)

            if (rjError) {
                console.error("Bulk delete RJ error:", rjError)
                // Non-blocking but good to log
            }

            // 5. Delete bills
            const { error: deleteError } = await supabase
                .from('bills')
                .delete()
                .in('id', validBillIds)

            if (deleteError) {
                console.error("Bulk delete bills error:", deleteError)
                errors.push(`Failed to delete bills batch: ${deleteError.message}`)
            } else {
                totalDeleted += validBillIds.length
            }
        }

        // 6. Log audit
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                const { data: userData } = await supabase.from('users').select('id').eq('email', user.email).single()
                if (userData) {
                    await supabase.from('audit_logs').insert({
                        user_id: userData.id,
                        action: 'bulk_delete_bills',
                        entity_type: 'bills',
                        entity_id: 'bulk',
                        project_id: projectId,
                        details: {
                            total_requested: billIds.length,
                            deleted: totalDeleted,
                            skipped_paid: totalSkipped,
                            errors: errors.length > 0 ? errors : null
                        }
                    })
                }
            }
        } catch (e) { console.error("Audit log error:", e) }

        revalidatePath("/(admin)/accounts-receivable")
        revalidatePath("/(admin)/billing")

        if (totalDeleted === 0 && errors.length > 0) {
            return { success: false, error: `Failed to delete bills. Errors: ${errors.join(", ")}` }
        }

        let message = `Deleted ${totalDeleted} bills successfully.`
        if (totalSkipped > 0) message += ` (${totalSkipped} paid bills skipped)`
        if (errors.length > 0) message += ` (Some errors occurred)`

        return {
            success: true,
            message: message
        }

    } catch (error: any) {
        console.error("Bulk delete exception:", error)
        return { success: false, error: error.message }
    }
}
