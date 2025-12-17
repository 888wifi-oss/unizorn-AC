"use server"

import { createClient } from "@/lib/supabase/server"
import { getUnitsFromDB } from "@/lib/supabase/actions"
import { revalidatePath } from "next/cache"

export interface OutstandingDebtorItem {
    invoice_number?: string
    bill_date: string // YYYY-MM-DD
    due_date: string // YYYY-MM-DD
    unit_number: string
    item_code?: string
    service_name: string
    description?: string
    amount: number // This is the 'Outstanding' amount (Column L)
}

interface ValidationResult {
    isValid: boolean
    errors: string[]
    unmappedUnits: string[]
}

/**
 * Validate all items before import:
 * 1. Check unit mapping
 * 2. Check for duplicates
 */
async function validateBeforeImport(
    items: OutstandingDebtorItem[],
    unitMap: Map<string, string>,
    supabase: any,
    projectId: string
): Promise<ValidationResult> {
    const errors: string[] = []
    const unmappedUnits = new Set<string>()
    const duplicateKeys = new Set<string>()

    // Track seen combinations for duplicate detection
    const seenBills = new Map<string, Set<string>>()

    for (let i = 0; i < items.length; i++) {
        const item = items[i]
        const rowNum = i + 2 // Excel row number (1-indexed, +1 for header)

        // 1. Validate required fields
        if (!item.unit_number || !item.amount || !item.bill_date || !item.due_date) {
            errors.push(`Row ${rowNum}: Missing required fields (Unit Number, Amount, Bill Date, or Due Date)`)
            continue
        }

        // 2. Check unit mapping
        const unitKey = item.unit_number.toLowerCase().trim()
        const unitId = unitMap.get(unitKey)
        if (!unitId) {
            unmappedUnits.add(item.unit_number)
            errors.push(`Row ${rowNum}: Unit '${item.unit_number}' not found in system`)
            continue
        }

        // 3. Check for duplicates in import data
        // Create unique key: invoice_number + unit_id + bill_date OR unit_id + bill_date + service_name + amount
        let duplicateKey: string
        if (item.invoice_number) {
            duplicateKey = `${unitId}:${item.invoice_number}:${item.bill_date}`
        } else {
            duplicateKey = `${unitId}:${item.bill_date}:${item.service_name}:${item.amount}`
        }

        if (seenBills.has(duplicateKey)) {
            const existingRows = seenBills.get(duplicateKey)!
            existingRows.add(rowNum.toString())
            duplicateKeys.add(duplicateKey)
            errors.push(`Row ${rowNum}: Duplicate bill detected (same as row(s) ${Array.from(existingRows).join(', ')})`)
        } else {
            seenBills.set(duplicateKey, new Set([rowNum.toString()]))
        }
    }

    // 4. Check for duplicates in database
    if (unmappedUnits.size === 0 && items.length > 0) {
        // Only check DB duplicates if we have valid units
        const validItems = items.filter((item, idx) => {
            const unitKey = item.unit_number.toLowerCase().trim()
            return unitMap.has(unitKey) && !unmappedUnits.has(item.unit_number)
        })

        if (validItems.length > 0) {
            // Build query to check for existing bills
            const unitIds = Array.from(new Set(
                validItems.map(item => unitMap.get(item.unit_number.toLowerCase().trim())).filter(Boolean)
            ))

            // Check for duplicates by invoice_number + unit_id + issue_date
            const itemsWithInvoice = validItems.filter(item => item.invoice_number)
            if (itemsWithInvoice.length > 0) {
                const invoiceNumbers = itemsWithInvoice.map(item => item.invoice_number).filter(Boolean)
                // Try to select description/notes if available, but don't fail if column doesn't exist
                const { data: existingBills, error: dbError } = await supabase
                    .from('bills')
                    .select('id, unit_id, issue_date, due_date')
                    .in('unit_id', unitIds)
                    .in('project_id', [projectId])

                if (!dbError && existingBills) {
                    for (const item of itemsWithInvoice) {
                        const unitId = unitMap.get(item.unit_number.toLowerCase().trim())
                        if (!unitId) continue

                        // Check for duplicate by unit_id + issue_date (simplified check without description)
                        const matchingBill = existingBills.find((bill: any) => {
                            return bill.unit_id === unitId &&
                                bill.issue_date === item.bill_date
                        })

                        if (matchingBill) {
                            const rowNum = items.indexOf(item) + 2
                            errors.push(`Row ${rowNum}: Bill with Invoice Number '${item.invoice_number}' already exists in database for Unit ${item.unit_number}`)
                        }
                    }
                }
            }

            // Check for duplicates by unit_id + issue_date + amount (for items without invoice_number)
            // Simplified check without description since column may not exist
            const itemsWithoutInvoice = validItems.filter(item => !item.invoice_number)
            if (itemsWithoutInvoice.length > 0) {
                const { data: existingBills, error: dbError } = await supabase
                    .from('bills')
                    .select('id, unit_id, issue_date, due_date, total')
                    .in('unit_id', unitIds)
                    .in('project_id', [projectId])

                if (!dbError && existingBills) {
                    for (const item of itemsWithoutInvoice) {
                        const unitId = unitMap.get(item.unit_number.toLowerCase().trim())
                        if (!unitId) continue

                        // Simplified duplicate check: unit_id + issue_date + amount
                        const matchingBill = existingBills.find((bill: any) => {
                            return bill.unit_id === unitId &&
                                bill.issue_date === item.bill_date &&
                                Math.abs(parseFloat(bill.total) - item.amount) < 0.01 // Allow small floating point differences
                        })

                        if (matchingBill) {
                            const rowNum = items.indexOf(item) + 2
                            errors.push(`Row ${rowNum}: Similar bill already exists in database for Unit ${item.unit_number} (Date: ${item.bill_date}, Amount: ${item.amount})`)
                        }
                    }
                }
            }
        }
    }

    return {
        isValid: errors.length === 0,
        errors,
        unmappedUnits: Array.from(unmappedUnits)
    }
}

export async function importOutstandingDebtors(items: OutstandingDebtorItem[], projectId?: string | null) {
    if (!projectId) {
        return { success: false, error: "Project ID is required" }
    }

    const supabase = await createClient()

    let results = {
        success: true,
        imported: 0,
        failed: 0,
        errors: [] as any[],
        skipped: 0,
        debug: {} as any
    }

    // 1. Fetch all units for lookup
    const unitsResult = await getUnitsFromDB(projectId)

    if (!unitsResult.success) {
        return { success: false, error: "Failed to fetch units: " + unitsResult.error }
    }

    // Create Map for case-insensitive, trimmed lookup
    const unitMap = new Map(unitsResult.units.map((u: any) => [u.unit_number.toLowerCase().trim(), u.id]))

    results.debug = {
        projectId,
        unitsFetched: unitsResult.units.length,
        unitMapSize: unitMap.size,
        totalItems: items.length
    }

    // 2. Validate all items BEFORE starting import
    const validation = await validateBeforeImport(items, unitMap, supabase, projectId)

    if (!validation.isValid) {
        return {
            success: false,
            error: "Validation failed. Please fix errors before importing.",
            validationErrors: validation.errors,
            unmappedUnits: validation.unmappedUnits,
            debug: results.debug
        }
    }

    // 3. Start transaction-like process: Track all created bills and GL entries for rollback
    const createdBills: string[] = []
    const createdGLEntries: string[] = []

    try {
        for (const item of items) {
            try {
                // Validate required fields (double check)
                if (!item.unit_number || !item.amount || !item.bill_date || !item.due_date) {
                    throw new Error("Missing required fields")
                }

                // Lookup Unit ID (should already be validated)
                const unitId = unitMap.get(item.unit_number.toLowerCase().trim())
                if (!unitId) {
                    throw new Error(`Unit '${item.unit_number}' not found.`)
                }

                // Determine Bill Type
                let billType: 'water' | 'electricity' | 'common_fee' | 'fine' | 'insurance' | 'other' = 'other'
                const serviceName = item.service_name?.toLowerCase() || ''

                if (serviceName.includes('ค่าน้ำ') || serviceName.includes('water')) {
                    billType = 'water'
                } else if (serviceName.includes('ค่าส่วนกลาง') || serviceName.includes('common fee') || serviceName.includes('เรียกเก็บ')) {
                    billType = 'common_fee'
                } else if (serviceName.includes('ค่าไฟ') || serviceName.includes('electricity')) {
                    billType = 'electricity'
                } else if (serviceName.includes('ค่าปรับ') || serviceName.includes('เงินเพิ่ม') || serviceName.includes('fine')) {
                    billType = 'fine'
                } else if (serviceName.includes('ประกัน') || serviceName.includes('insurance')) {
                    billType = 'insurance'
                }

                // Construct Description
                let fullDescription = item.description || item.service_name || 'Imported Bill'
                if (item.invoice_number) {
                    fullDescription = `[${item.invoice_number}] ${fullDescription}`
                }
                if (item.item_code) {
                    fullDescription += ` (${item.item_code})`
                }

                // Map insurance to other if needed
                let finalBillType = billType
                if (billType === 'insurance') {
                    finalBillType = 'other'
                    fullDescription = `[Insurance] ${fullDescription}`
                }

                // Derive month from bill_date (YYYY-MM-DD -> YYYY-MM)
                const month = item.bill_date.substring(0, 7)
                const [yearFromDate, monthFromDate] = month.split('-').map(Number)

                // Save bill and track for rollback
                // Note: bill_type and description are optional - only include if columns exist in database
                // Initialize fee columns
                let commonFee = 0
                let waterFee = 0
                let electricityFee = 0
                let otherFee = 0

                // Map amount to specific fee column based on billType
                switch (billType) {
                    case 'water':
                        waterFee = item.amount
                        break
                    case 'electricity':
                        electricityFee = item.amount
                        break
                    case 'common_fee':
                        commonFee = item.amount
                        break
                    default:
                        // fine, insurance, other -> other_fee
                        otherFee = item.amount
                        break
                }

                // Save bill and track for rollback
                const billData: any = {
                    unit_id: unitId,
                    total: item.amount,
                    common_fee: commonFee,
                    water_fee: waterFee,
                    electricity_fee: electricityFee,
                    other_fee: otherFee,
                    // issue_date: item.bill_date, // Field does not exist in DB
                    created_at: item.bill_date, // Use created_at to backdate the bill
                    due_date: item.due_date,
                    month: month,
                    status: 'pending' as const,
                    project_id: projectId,
                    description: item.description,
                    reference_number: item.invoice_number,
                    year: yearFromDate // Add year to billData
                }

                // Generate bill number or use existing from import
                let billNumber = ''

                if (item.invoice_number) {
                    // Use the invoice number from the import file
                    billNumber = item.invoice_number
                } else {
                    // Generate bill number based on bill_date month/year
                    const billMonthStr = `${yearFromDate}${String(monthFromDate).padStart(2, '0')}`
                    const { data: lastBill } = await supabase
                        .from('bills')
                        .select('bill_number')
                        .like('bill_number', `BILL-${billMonthStr}-%`)
                        .order('bill_number', { ascending: false })
                        .limit(1)
                        .maybeSingle() // Use maybeSingle as it might return null

                    let nextSequence = 1
                    if (lastBill) {
                        const parts = lastBill.bill_number.split('-')
                        if (parts.length === 3) {
                            nextSequence = parseInt(parts[2]) + 1
                        }
                    }
                    billNumber = `BILL-${billMonthStr}-${nextSequence.toString().padStart(3, '0')}`
                }

                // Insert bill
                const { data: insertedBill, error: billError } = await supabase
                    .from('bills')
                    .insert([{
                        ...billData,
                        bill_number: billNumber,
                    }])
                    .select()
                    .single()

                if (billError) {
                    throw billError
                }

                if (insertedBill) {
                    createdBills.push(insertedBill.id)

                    // Post to General Ledger
                    const glEntries = [
                        {
                            transaction_date: insertedBill.created_at,
                            account_code: '1201', // Accounts Receivable
                            debit: insertedBill.total,
                            credit: 0,
                            description: `Invoice #${insertedBill.bill_number}`,
                            reference_type: 'bill',
                            reference_id: insertedBill.id,
                            project_id: insertedBill.project_id
                        },
                        {
                            transaction_date: insertedBill.created_at,
                            account_code: '4101', // Common Fee Income
                            debit: 0,
                            credit: insertedBill.total,
                            description: `Income from Invoice #${insertedBill.bill_number}`,
                            reference_type: 'bill',
                            reference_id: insertedBill.id,
                            project_id: insertedBill.project_id
                        }
                    ]

                    const { data: insertedGL, error: glError } = await supabase
                        .from('general_ledger')
                        .insert(glEntries)
                        .select()

                    if (glError) {
                        console.error('[importOutstandingDebtors] Error posting to GL:', glError)
                        // Rollback this bill
                        await supabase.from('bills').delete().eq('id', insertedBill.id)
                        createdBills.pop()
                        throw new Error(`Failed to post to General Ledger: ${glError.message}`)
                    }

                    if (insertedGL) {
                        insertedGL.forEach((gl: any) => createdGLEntries.push(gl.id))
                    }
                }

                results.imported++

            } catch (error: any) {
                console.error(`[importOutstandingDebtors] Error processing bill for ${item.unit_number}:`, error)
                results.failed++

                // If we've created bills but hit an error, rollback everything
                if (createdBills.length > 0) {
                    console.log(`[importOutstandingDebtors] Rolling back ${createdBills.length} bills due to error`)

                    // Delete GL entries first (foreign key constraint)
                    if (createdGLEntries.length > 0) {
                        await supabase
                            .from('general_ledger')
                            .delete()
                            .in('id', createdGLEntries)
                    }

                    // Delete bills
                    await supabase
                        .from('bills')
                        .delete()
                        .in('id', createdBills)

                    results.errors.push({
                        unit: item.unit_number,
                        error: error.message,
                        rolledBack: true,
                        message: `Import stopped and rolled back ${createdBills.length} bills due to error: ${error.message}`
                    })

                    return {
                        ...results,
                        success: false,
                        error: `Import failed and rolled back. ${results.errors[results.errors.length - 1].message}`
                    }
                } else {
                    results.errors.push({
                        unit: item.unit_number,
                        error: error.message
                    })
                }
            }
        }

        // Log import history to audit_logs
        try {
            const { data: { user: authUser } } = await supabase.auth.getUser()
            if (authUser?.id) {
                // Get user ID from users table
                const { data: userData } = await supabase
                    .from('users')
                    .select('id')
                    .eq('email', authUser.email)
                    .single()

                if (userData?.id) {
                    await supabase
                        .from('audit_logs')
                        .insert({
                            user_id: userData.id,
                            action: 'import_outstanding_debtors',
                            entity_type: 'bills',
                            project_id: projectId,
                            new_values: {
                                imported_count: results.imported,
                                failed_count: results.failed,
                                total_items: items.length,
                                errors: results.errors.slice(0, 10) // Store first 10 errors
                            }
                        })
                }
            }
        } catch (auditError: any) {
            // Don't fail the import if audit logging fails
            console.error('[importOutstandingDebtors] Error logging audit:', auditError)
        }

        // Revalidate billing and accounts-receivable paths
        revalidatePath("/(admin)/billing")
        revalidatePath("/(admin)/accounts-receivable")

    } catch (error: any) {
        // Final rollback if something catastrophic happens
        if (createdBills.length > 0) {
            console.error(`[importOutstandingDebtors] Catastrophic error, rolling back ${createdBills.length} bills`)

            if (createdGLEntries.length > 0) {
                await supabase
                    .from('general_ledger')
                    .delete()
                    .in('id', createdGLEntries)
            }

            await supabase
                .from('bills')
                .delete()
                .in('id', createdBills)
        }

        return {
            success: false,
            error: `Import failed: ${error.message}`,
            imported: results.imported,
            failed: results.failed,
            errors: results.errors,
            debug: results.debug
        }
    }

    // If we processed items but imported 0, mark as failed
    if (results.imported === 0 && items.length > 0) {
        return {
            ...results,
            success: false,
            error: "No records were imported. Please check the errors list."
        }
    }

    return results
}
