"use server"

import { createClient } from "@/lib/supabase/server"

export interface APItem {
    vendor_name: string
    invoice_number: string
    invoice_date: string // YYYY-MM-DD
    due_date: string // YYYY-MM-DD
    amount: number
    notes?: string
}

export async function importAPInvoices(items: APItem[], projectId?: string | null) {
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

    // 1. Fetch all vendors for lookup
    const { data: vendors, error: vendorError } = await supabase
        .from('vendors')
        .select('id, name')
        .eq('project_id', projectId)

    if (vendorError) {
        return { success: false, error: "Failed to fetch vendors" }
    }

    const vendorMap = new Map(vendors?.map(v => [v.name.toLowerCase().trim(), v.id]))

    for (const item of items) {
        try {
            // Validate required fields
            if (!item.vendor_name || !item.invoice_number || !item.invoice_date || !item.due_date || !item.amount) {
                throw new Error("Missing required fields")
            }

            // Lookup Vendor ID
            const vendorId = vendorMap.get(item.vendor_name.toLowerCase().trim())
            if (!vendorId) {
                throw new Error(`Vendor '${item.vendor_name}' not found. Please create the vendor first.`)
            }

            // Check for duplicate invoice number for this vendor
            const { data: existingInvoice } = await supabase
                .from('ap_invoices')
                .select('id')
                .eq('vendor_id', vendorId)
                .eq('invoice_number', item.invoice_number)
                .single()

            if (existingInvoice) {
                throw new Error(`Invoice '${item.invoice_number}' already exists for this vendor.`)
            }

            // Insert Invoice
            const { error: insertError } = await supabase
                .from('ap_invoices')
                .insert([{
                    vendor_id: vendorId,
                    invoice_number: item.invoice_number,
                    invoice_date: item.invoice_date,
                    due_date: item.due_date,
                    amount: item.amount,
                    notes: item.notes,
                    status: 'unpaid',
                    project_id: projectId
                }])

            if (insertError) throw insertError

            results.imported++

        } catch (error: any) {
            console.error(`[importAPInvoices] Error processing invoice ${item.invoice_number}:`, error)
            results.failed++
            results.errors.push({
                invoice: `${item.vendor_name} - ${item.invoice_number}`,
                error: error.message
            })
        }
    }

    return results
}
