"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

// Granular Actions for Portal Performance

export async function getOutstandingBills(unitId: string) {
    const supabase = await createClient();
    if (!unitId) return [];

    const { data, error } = await supabase
        .from('bills')
        .select('*')
        .eq('unit_id', unitId)
        .neq('status', 'paid')
        .neq('status', 'cancelled')
        .order('due_date', { ascending: true });

    if (error) {
        console.error('[getOutstandingBills] Error:', error);
        return [];
    }

    // Check for pending transactions
    const billsWithStatus = await Promise.all((data || []).map(async (bill) => {
        const { data: transactions } = await supabase
            .from('transactions')
            .select('status')
            .eq('bill_id', bill.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        return {
            ...bill,
            latest_transaction_status: transactions?.status
        };
    }));

    return billsWithStatus;
}

export async function getPaymentHistory(unitId: string) {
    const supabase = await createClient();
    if (!unitId) return [];

    // 1. Get bill IDs for the unit
    const { data: bills, error: billsError } = await supabase
        .from('bills')
        .select('id, bill_number, unit_id')
        .eq('unit_id', unitId);

    if (billsError) {
        console.error('[getPaymentHistory] Error fetching bills:', billsError);
        return [];
    }

    if (!bills || bills.length === 0) {
        return [];
    }

    const billIds = bills.map(b => b.id);

    // 2. Get payments for these bills
    const { data: payments, error: paymentsError } = await supabase
        .from('payments')
        .select('*')
        .in('bill_id', billIds)
        .order('payment_date', { ascending: false });

    if (paymentsError) {
        console.error('[getPaymentHistory] Error fetching payments:', paymentsError);
        return [];
    }

    // 3. Map bills back to payments (frontend expects 'bills' object)
    const paymentsWithBills = (payments || []).map(p => ({
        ...p,
        bills: bills.find(b => b.id === p.bill_id)
    }));

    return paymentsWithBills;
}

export async function getPortalAnnouncements(projectId: string) {
    const supabase = await createClient();
    if (!projectId) return [];

    const { data, error } = await supabase
        .from('announcements')
        .select('id, title, content, category, image_urls, attachments, publish_date, is_pinned')
        .eq('project_id', projectId)
        .order('is_pinned', { ascending: false })
        .order('publish_date', { ascending: false })
        .limit(10);

    if (error) {
        console.error('[getPortalAnnouncements] Error:', error);
        return [];
    }

    return data || [];
}

export async function getPortalMaintenanceRequests(unitId: string) {
    const supabase = await createClient();
    if (!unitId) return [];

    const { data, error } = await supabase
        .from('maintenance_requests')
        .select('*')
        .eq('unit_id', unitId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('[getMaintenanceRequests] Error:', error);
        return [];
    }

    return data || [];
}

// Chart of Accounts
export async function getChartOfAccountsFromDB() {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from("chart_of_accounts")
        .select("account_code, account_name")
        .eq('is_active', true)
        .order("account_code")
    if (error) throw error
    return data || []
}

// Units Actions
export async function getUnitsFromDB(projectId?: string | null) {
    const supabase = await createClient()
    try {
        let query = supabase.from("units").select("*").order("unit_number").limit(10000)

        if (projectId) {
            query = query.eq('project_id', projectId)
        }

        const { data, error } = await query
        if (error) {
            console.error('Error fetching units:', error)
            return { success: false, error: error.message, units: [] }
        }
        return { success: true, units: data || [] }
    } catch (error: any) {
        console.error('Exception in getUnitsFromDB:', error)
        return { success: false, error: error.message, units: [] }
    }
}

// Alias for compatibility - returns array directly
export async function getUnits() {
    const supabase = await createClient()
    try {
        const { data, error } = await supabase.from("units").select("*").order("unit_number")
        if (error) {
            console.error('Error fetching units:', error)
            return []
        }
        return data || []
    } catch (error: any) {
        console.error('Exception in getUnits:', error)
        return []
    }
}

export async function saveUnitToDB(unit: any) {
    const supabase = await createClient()

    try {
        const { id, ...unitData } = unit

        console.log('[saveUnitToDB] Saving unit:', { id, unitData })

        if (id && id !== "new") {
            const { data, error } = await supabase.from("units").update(unitData).eq("id", id).select()
            if (error) {
                console.error('[saveUnitToDB] Update error:', error)
                throw error
            }
            console.log('[saveUnitToDB] Updated successfully:', data)
        } else {
            const { data, error } = await supabase.from("units").insert([unitData]).select()
            if (error) {
                console.error('[saveUnitToDB] Insert error:', error)
                throw error
            }
            console.log('[saveUnitToDB] Inserted successfully:', data)
        }

        revalidatePath("/(admin)/units")
        return { success: true }
    } catch (error: any) {
        console.error('[saveUnitToDB] Exception:', error)
        return { success: false, error: error.message }
    }
}

export async function deleteUnitFromDB(id: string) {
    const supabase = await createClient()
    const { error } = await supabase.from("units").delete().eq("id", id)
    if (error) throw error
    revalidatePath("/(admin)/units")
}

// Bills Actions
export async function getBillsFromDB(projectId?: string | null) {
    const supabase = await createClient()
    let query = supabase.from("bills").select(`*, units (unit_number)`).order("created_at", { ascending: false })

    if (projectId) {
        query = query.eq('project_id', projectId)
    }

    const { data, error } = await query
    if (error) throw error
    return (data?.map((bill: any) => ({ ...bill, unitNumber: bill.units?.unit_number || "" })) || [])
}

async function generateBillNumber(supabase: any) {
    const year = new Date().getFullYear()
    const month = new Date().getMonth() + 1
    const { data, error } = await supabase.from("bills").select("bill_number").like("bill_number", `BILL-${year}${String(month).padStart(2, '0')}-%`).order("bill_number", { ascending: false }).limit(1)
    if (error) { console.error("Error fetching last bill number:", error); return `BILL-${year}${String(month).padStart(2, '0')}-001`; }
    let sequence = 1
    if (data && data.length > 0) {
        const lastNum = parseInt(data[0].bill_number.split('-').pop() || '0', 10)
        sequence = lastNum + 1
    }
    return `BILL-${year}${String(month).padStart(2, '0')}-${String(sequence).padStart(3, '0')}`
}

export async function createBatchBills(month: string, commonFeeRate: number, projectId?: string | null) {
    const supabase = await createClient()
    const [year, monthNum] = month.split('-').map(Number)

    console.log('[createBatchBills] Creating bills for project:', projectId)

    // Get units for the specified project
    let unitsQuery = supabase.from('units').select('id, size, project_id')
    if (projectId) {
        unitsQuery = unitsQuery.eq('project_id', projectId)
    }

    const { data: units, error: unitsError } = await unitsQuery
    if (unitsError) throw unitsError

    console.log('[createBatchBills] Found', units?.length || 0, 'units')

    const { data: existingBills, error: billsError } = await supabase.from('bills').select('unit_id').eq('month', month)
    if (billsError) throw billsError
    const billedUnitIds = new Set(existingBills.map(b => b.unit_id))
    const unitsToBill = units.filter(u => !billedUnitIds.has(u.id))

    if (unitsToBill.length === 0) {
        console.log('[createBatchBills] No new units to bill')
        return { count: 0 }
    }

    const newBills = []
    for (const unit of unitsToBill) {
        const billNumber = await generateBillNumber(supabase)
        const commonFee = (unit.size || 0) * commonFeeRate
        newBills.push({
            unit_id: unit.id,
            project_id: unit.project_id || projectId || null,  // ✅ เพิ่ม project_id
            month: month,
            year: year,
            common_fee: commonFee,
            total: commonFee,
            status: 'pending',
            due_date: new Date(year, monthNum, 5).toISOString().split('T')[0],
            bill_number: billNumber
        })
    }

    console.log('[createBatchBills] Creating', newBills.length, 'bills')

    const { data: insertedBills, error } = await supabase.from('bills').insert(newBills).select()
    if (error) throw error

    // Post to General Ledger (Accrual Basis: Dr AR, Cr Revenue)
    const glEntries = []
    for (const bill of insertedBills) {
        glEntries.push({
            transaction_date: bill.created_at, // Or due_date? Usually created_at for invoice date
            account_code: '1201', // Accounts Receivable
            debit: bill.total,
            credit: 0,
            description: `Invoice #${bill.bill_number} for ${month}`,
            reference_type: 'bill',
            reference_id: bill.id,
            project_id: bill.project_id
        })
        glEntries.push({
            transaction_date: bill.created_at,
            account_code: '4101', // Common Fee Income (Assuming 4101)
            debit: 0,
            credit: bill.total,
            description: `Common Fee Income for ${month}`,
            reference_type: 'bill',
            reference_id: bill.id,
            project_id: bill.project_id
        })
    }

    if (glEntries.length > 0) {
        const { error: glError } = await supabase.from('general_ledger').insert(glEntries)
        if (glError) {
            console.error('[createBatchBills] Error posting to GL:', glError)
        }
    }

    revalidatePath('/(admin)/billing')
    return { count: newBills.length }
}

export async function saveBillToDB(bill: any) {
    const supabase = await createClient()
    const { id, unitNumber, ...billData } = bill
    if (id && id !== "new") {
        const { error } = await supabase.from("bills").update(billData).eq("id", id)
        if (error) throw error
    } else {
        billData.bill_number = await generateBillNumber(supabase);
        const [year, month] = billData.month.split('-').map(Number);
        billData.year = year;
        const { data: insertedBill, error } = await supabase.from("bills").insert([billData]).select().single()
        if (error) throw error

        // Post to General Ledger
        if (insertedBill) {
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
            const { error: glError } = await supabase.from('general_ledger').insert(glEntries)
            if (glError) console.error('[saveBillToDB] Error posting to GL:', glError)
        }
    }
    revalidatePath("/(admin)/billing")
}

export async function deleteBillFromDB(id: string) {
    const supabase = await createClient()
    const { error } = await supabase.from("bills").delete().eq("id", id)
    if (error) throw error
    revalidatePath("/(admin)/billing")
}

// Payments Actions
export async function getPaymentsFromDB(projectId?: string | null) {
    const supabase = await createClient()
    let query = supabase.from("payments").select(`*, bills(units(unit_number))`).order("payment_date", { ascending: false })

    if (projectId) {
        // Payments don't always have project_id directly, but they should.
        // If they don't, we might need to filter by bill -> project_id
        // But let's assume they do or we filter by bill.
        // Checking schema... payments usually link to bills.
        // Let's filter by bill's project_id if payment doesn't have it, but supabase filtering on joined table is tricky with simple syntax.
        // Best to assume payments table has project_id or we rely on RLS.
        // But for now, let's try to filter by project_id if it exists, or use !inner join on bills.

        // Using !inner on bills to filter by project_id
        query = supabase.from("payments")
            .select(`*, bills!inner(units(unit_number), project_id)`)
            .eq('bills.project_id', projectId)
            .order("payment_date", { ascending: false })
    }

    const { data, error } = await query
    if (error) throw error
    return (data?.map((p: any) => ({ ...p, unitNumber: p.bills?.units?.unit_number || '' })) || [])
}

export async function savePayment(paymentData: any, billId: string, projectId?: string | null) {
    const supabase = await createClient();

    // 1. Insert Payment
    const { data: payment, error: paymentError } = await supabase.from("payments").insert({
        ...paymentData,
        bill_id: billId,
        project_id: projectId
    }).select().single();

    if (paymentError) throw paymentError;

    // 2. Update Bill Status
    const { error: billError } = await supabase.from("bills").update({ status: "paid" }).eq("id", billId);
    if (billError) {
        console.error("Error updating bill status:", billError);
        // Should probably rollback payment here, but for now just log
    }

    // 3. Post to General Ledger
    // Dr Cash/Bank
    // Cr Accounts Receivable
    const accountCode = paymentData.payment_method === 'cash' ? '1101' : '1102'; // 1101 Cash, 1102 Bank

    const glEntries = [
        {
            transaction_date: paymentData.payment_date,
            account_code: accountCode,
            debit: paymentData.amount,
            credit: 0,
            description: `Payment for Bill #${billId} (${paymentData.payment_method})`,
            reference_type: 'payment',
            reference_id: payment.id,
            project_id: projectId
        },
        {
            transaction_date: paymentData.payment_date,
            account_code: '1201', // Accounts Receivable
            debit: 0,
            credit: paymentData.amount,
            description: `Clear AR for Bill #${billId}`,
            reference_type: 'payment',
            reference_id: payment.id,
            project_id: projectId
        }
    ];

    const { error: glError } = await supabase.from('general_ledger').insert(glEntries);
    if (glError) {
        console.error("Error posting payment to GL:", glError);
    }

    revalidatePath('/(admin)/payments');
    revalidatePath('/(admin)/billing');
    revalidatePath('/(admin)/financial-statements');

    return { success: true, payment };
}

// Expense Actions
export async function getExpensesFromDB(period?: string, projectId?: string | null) {
    const supabase = await createClient()
    let query = supabase.from("expense_journal").select("*").order("journal_date", { ascending: false })

    if (period) {
        const [year, month] = period.split('-')
        const startDate = `${year}-${month}-01`
        const endDate = new Date(parseInt(year), parseInt(month), 0).toISOString().split('T')[0]
        query = query.gte('journal_date', startDate).lte('journal_date', endDate)
    }

    if (projectId) {
        query = query.eq('project_id', projectId)
    }

    const { data, error } = await query
    if (error) throw error
    return data || []
}

export async function saveExpenseToDB(expense: any) {
    const supabase = await createClient();

    // 1. Save to Expense Journal (Source of Truth for Expense Details)
    const { data: savedExpense, error } = await supabase.from('expense_journal').insert([expense]).select().single();
    if (error) throw error;

    // 2. Post to General Ledger (Double Entry)
    // Debit: Expense Account
    // Credit: Cash (1101) - Assuming Cash Payment for now
    const glEntries = [
        {
            transaction_date: expense.journal_date,
            account_code: expense.account_code,
            debit: expense.amount,
            credit: 0,
            description: expense.description,
            reference_type: 'expense',
            reference_id: savedExpense.id,
            project_id: expense.project_id
        },
        {
            transaction_date: expense.journal_date,
            account_code: '1101', // Cash
            debit: 0,
            credit: expense.amount,
            description: `Payment for: ${expense.description}`,
            reference_type: 'expense',
            reference_id: savedExpense.id,
            project_id: expense.project_id
        }
    ];

    const { error: glError } = await supabase.from('general_ledger').insert(glEntries);
    if (glError) {
        console.error("Error posting to GL:", glError);
        // We don't throw here to avoid rolling back the expense save, but we should log it.
        // Ideally we'd use a transaction.
    }

    revalidatePath('/(admin)/expenses');
    revalidatePath('/(admin)/financial-statements');
}

// Revenue Budget Actions
export async function getRevenueAccountsFromDB() {
    const supabase = await createClient();
    const { data, error } = await supabase.from('chart_of_accounts').select('account_code, account_name').like('account_code', '4%').eq('is_active', true).order('account_code');
    if (error) throw error;
    return data || [];
}

export async function getRevenueBudgets(year: number, month: number, projectId?: string | null) {
    const supabase = await createClient()
    let query = supabase.from('revenue_budget').select('*').eq('year', year).eq('month', month)

    if (projectId) {
        query = query.eq('project_id', projectId)
    }

    const { data: budgets, error: budgetError } = await query
    if (budgetError) throw budgetError

    const { data: accounts, error: accountError } = await supabase.from('chart_of_accounts').select('account_code, account_name').like('account_code', '4%').eq('is_active', true)
    if (accountError) throw accountError

    const adYear = year - 543;
    const startDate = `${adYear}-${String(month).padStart(2, '0')}-01`
    const endDate = new Date(adYear, month, 0).toISOString().split('T')[0]

    const budgetsWithActuals = await Promise.all(
        (budgets || []).map(async (budget) => {
            let actualsQuery = supabase.from('revenue_journal').select('amount').eq('account_code', budget.account_code).gte('journal_date', startDate).lte('journal_date', endDate)

            if (projectId) {
                actualsQuery = actualsQuery.eq('project_id', projectId)
            } else if (budget.project_id) {
                actualsQuery = actualsQuery.eq('project_id', budget.project_id)
            }

            const { data: actuals, error: actualsError } = await actualsQuery
            if (actualsError) throw actualsError

            const actualAmount = actuals.reduce((sum, item) => sum + item.amount, 0)
            const budgetAmount = budget.budget_amount || 0;
            const variance = actualAmount - budgetAmount;
            return { ...budget, account_name: accounts?.find(a => a.account_code === budget.account_code)?.account_name || budget.account_code, actual_amount: actualAmount, variance: variance, variance_percent: budgetAmount > 0 ? (actualAmount / budgetAmount) * 100 : 0, }
        })
    )
    return budgetsWithActuals;
}

export async function saveRevenueBudget(budget: any) {
    const supabase = await createClient();
    const { id, ...budgetData } = budget;

    if (id) {
        const { error } = await supabase.from('revenue_budget').update({
            budget_amount: budgetData.budget_amount,
            notes: budgetData.notes,
            project_id: budgetData.project_id
        }).eq('id', id);
        if (error) throw error;
    } else {
        let query = supabase.from('revenue_budget')
            .select('id')
            .eq('account_code', budgetData.account_code)
            .eq('year', budgetData.year)
            .eq('month', budgetData.month);

        if (budgetData.project_id) {
            query = query.eq('project_id', budgetData.project_id);
        } else {
            query = query.is('project_id', null);
        }

        const { data: existing, error: checkError } = await query.single();

        if (checkError && checkError.code !== 'PGRST116') { throw checkError; }
        if (existing) { throw new Error("งบประมาณสำหรับบัญชีนี้ในเดือนที่เลือกมีอยู่แล้ว"); }

        const { error } = await supabase.from('revenue_budget').insert([budgetData]);
        if (error) throw error;
    }
    revalidatePath('/(admin)/revenue-budget');
}

export async function deleteRevenueBudget(id: string) {
    const supabase = await createClient()
    const { error } = await supabase.from('revenue_budget').delete().eq('id', id);
    if (error) throw error;
    revalidatePath('/(admin)/revenue-budget');
}

// Expense Budget Actions
export async function getExpenseBudgets(year: number, month: number, projectId?: string | null) {
    const supabase = await createClient()
    const adYear = year - 543;

    let query = supabase.from('expense_budget').select('*').eq('year', year).eq('month', month)
    if (projectId) {
        query = query.eq('project_id', projectId)
    }

    const { data: budgets, error: budgetError } = await query
    if (budgetError) throw budgetError

    const { data: accounts, error: accountError } = await supabase.from('chart_of_accounts').select('account_code, account_name').like('account_code', '5%').eq('is_active', true)
    if (accountError) throw accountError

    const startDate = `${adYear}-${String(month).padStart(2, '0')}-01`
    const endDate = new Date(adYear, month, 0).toISOString().split('T')[0]

    const budgetsWithActuals = await Promise.all(
        (budgets || []).map(async (budget) => {
            let actualsQuery = supabase.from('expense_journal').select('amount').eq('account_code', budget.account_code).gte('journal_date', startDate).lte('journal_date', endDate)

            if (projectId) {
                actualsQuery = actualsQuery.eq('project_id', projectId)
            } else if (budget.project_id) {
                actualsQuery = actualsQuery.eq('project_id', budget.project_id)
            }

            const { data: actuals, error: actualsError } = await actualsQuery
            if (actualsError) throw actualsError

            const actualAmount = actuals.reduce((sum, item) => sum + item.amount, 0)
            const budgetAmount = budget.budget_amount || 0;
            const variance = budgetAmount - actualAmount;
            return { ...budget, account_name: accounts?.find(a => a.account_code === budget.account_code)?.account_name || budget.account_code, actual_amount: actualAmount, variance: variance, variance_percent: budgetAmount > 0 ? (actualAmount / budgetAmount) * 100 : 0, }
        })
    )
    return budgetsWithActuals;
}

export async function saveExpenseBudget(budget: any) {
    const supabase = await createClient();
    const { id, ...budgetData } = budget;

    if (id) {
        const { error } = await supabase.from('expense_budget').update({
            budget_amount: budgetData.budget_amount,
            notes: budgetData.notes,
            project_id: budgetData.project_id
        }).eq('id', id);
        if (error) throw error;
    } else {
        let query = supabase.from('expense_budget')
            .select('id')
            .eq('account_code', budgetData.account_code)
            .eq('year', budgetData.year)
            .eq('month', budgetData.month);

        if (budgetData.project_id) {
            query = query.eq('project_id', budgetData.project_id);
        } else {
            query = query.is('project_id', null);
        }

        const { data: existing, error: checkError } = await query.single();

        if (checkError && checkError.code !== 'PGRST116') { throw checkError; }
        if (existing) { throw new Error("งบประมาณสำหรับบัญชีนี้ในเดือนที่เลือกมีอยู่แล้ว"); }

        const { error } = await supabase.from('expense_budget').insert([budgetData]);
        if (error) throw error;
    }
    revalidatePath('/(admin)/expense-budget');
}

export async function upsertExpenseBudgets(budgets: any[]) {
    const supabase = await createClient();
    // Note: onConflict needs to match the unique index. 
    // If we updated the index to include project_id, we should use that.
    // However, upsert syntax with onConflict string assumes a constraint name or column list.
    // If we changed the constraint to (account_code, year, month, project_id), we should list them all.
    const { error } = await supabase.from('expense_budget').upsert(budgets, { onConflict: 'account_code, year, month, project_id' });
    if (error) {
        console.error("Upsert Expense Budgets Error:", error);
        throw new Error("ไม่สามารถบันทึกข้อมูลงบประมาณรายจ่ายได้");
    }
    revalidatePath('/(admin)/expense-budget');
}

export async function deleteExpenseBudget(id: string) {
    const supabase = await createClient()
    const { error } = await supabase.from('expense_budget').delete().eq('id', id);
    if (error) throw error;
    revalidatePath('/(admin)/expense-budget');
}

// Report Actions
export async function getIncomeStatementData(startDate: string, endDate: string, projectId?: string | null) {
    const supabase = await createClient();
    const tStart = Date.now();

    // Build query for general ledger
    let query = supabase
        .from('general_ledger_view')
        .select('account_code, account_name, account_type, debit, credit, journal_date')
        .gte('journal_date', startDate)
        .lte('journal_date', endDate)
        .in('account_type', ['revenue', 'expense']);

    if (projectId) {
        query = query.eq('project_id', projectId);
    }

    const { data: transactions, error } = await query;

    if (error) {
        console.error('[getIncomeStatementData] Query error:', error);
        throw error;
    }

    console.log('[perf][income-statement-data] transactions fetch:', {
        count: transactions?.length || 0,
        duration_ms: Date.now() - tStart,
        period: `${startDate} to ${endDate}`,
        projectId
    });

    // Aggregate by account
    const accountMap = new Map<string, {
        account_code: string;
        account_name: string;
        account_type: string;
        balance: number;
    }>();

    for (const txn of transactions || []) {
        const key = txn.account_code;
        if (!accountMap.has(key)) {
            accountMap.set(key, {
                account_code: txn.account_code,
                account_name: txn.account_name,
                account_type: txn.account_type,
                balance: 0
            });
        }

        const account = accountMap.get(key)!;
        // Revenue: credit increases, debit decreases
        // Expense: debit increases, credit decreases
        if (txn.account_type === 'revenue') {
            account.balance += (txn.credit || 0) - (txn.debit || 0);
        } else if (txn.account_type === 'expense') {
            account.balance += (txn.debit || 0) - (txn.credit || 0);
        }
    }

    // Convert to array and separate by type
    const accounts = Array.from(accountMap.values());

    const revenues = accounts
        .filter(a => a.account_type === 'revenue' && a.balance !== 0)
        .map(a => ({ account_code: a.account_code, account_name: a.account_name, total: a.balance }))
        .sort((a, b) => a.account_code.localeCompare(b.account_code));

    const expenses = accounts
        .filter(a => a.account_type === 'expense' && a.balance !== 0)
        .map(a => ({ account_code: a.account_code, account_name: a.account_name, total: a.balance }))
        .sort((a, b) => a.account_code.localeCompare(b.account_code));

    const totalRevenue = revenues.reduce((sum, item) => sum + item.total, 0);
    const totalExpense = expenses.reduce((sum, item) => sum + item.total, 0);
    const netIncome = totalRevenue - totalExpense;

    console.log('[perf][income-statement-data] calculation complete:', {
        revenue: totalRevenue,
        expenses: totalExpense,
        netIncome,
        duration_ms: Date.now() - tStart
    });

    return { revenues, expenses, totalRevenue, totalExpense, netIncome };
}

export async function getBalanceSheetData(date: string, projectId?: string | null) {
    const supabase = await createClient();
    const tStart = Date.now();

    // Build query for general ledger
    let query = supabase
        .from('general_ledger_view')
        .select('account_code, account_name, account_type, debit, credit')
        .lte('journal_date', date)
        .in('account_type', ['asset', 'liability', 'equity']);

    if (projectId) {
        query = query.eq('project_id', projectId);
    }

    const { data: transactions, error } = await query;

    if (error) {
        console.error('[getBalanceSheetData] Query error:', error);
        throw error;
    }

    console.log('[perf][balance-sheet-data] transactions fetch:', {
        count: transactions?.length || 0,
        duration_ms: Date.now() - tStart,
        asOfDate: date,
        projectId
    });

    // Aggregate by account
    const accountMap = new Map<string, {
        account_code: string;
        account_name: string;
        account_type: string;
        balance: number;
    }>();

    for (const txn of transactions || []) {
        const key = txn.account_code;
        if (!accountMap.has(key)) {
            accountMap.set(key, {
                account_code: txn.account_code,
                account_name: txn.account_name,
                account_type: txn.account_type,
                balance: 0
            });
        }

        const account = accountMap.get(key)!;
        // Asset: debit increases, credit decreases
        // Liability & Equity: credit increases, debit decreases
        if (txn.account_type === 'asset') {
            account.balance += (txn.debit || 0) - (txn.credit || 0);
        } else {
            account.balance += (txn.credit || 0) - (txn.debit || 0);
        }
    }

    // Get current year income (revenue - expenses) up to date
    const yearStart = `${date.substring(0, 4)}-01-01`;
    const incomeData = await getIncomeStatementData(yearStart, date, projectId);
    const currentYearIncome = incomeData.netIncome;

    // Convert to arrays and categorize
    const accounts = Array.from(accountMap.values());

    const assets = accounts
        .filter(a => a.account_type === 'asset' && a.balance !== 0)
        .map(a => ({ account_code: a.account_code, account_name: a.account_name, total: a.balance }))
        .sort((a, b) => a.account_code.localeCompare(b.account_code));

    const liabilities = accounts
        .filter(a => a.account_type === 'liability' && a.balance !== 0)
        .map(a => ({ account_code: a.account_code, account_name: a.account_name, total: a.balance }))
        .sort((a, b) => a.account_code.localeCompare(b.account_code));

    const equity = accounts
        .filter(a => a.account_type === 'equity' && a.balance !== 0)
        .map(a => ({ account_code: a.account_code, account_name: a.account_name, total: a.balance }))
        .sort((a, b) => a.account_code.localeCompare(b.account_code));

    // Add current year income to equity
    if (currentYearIncome !== 0) {
        equity.push({
            account_code: '3201',
            account_name: 'กำไร(ขาดทุน)ปีปัจจุบัน',
            total: currentYearIncome
        });
    }

    const totalAssets = assets.reduce((sum, a) => sum + a.total, 0);
    const totalLiabilities = liabilities.reduce((sum, a) => sum + a.total, 0);
    const totalEquity = equity.reduce((sum, a) => sum + a.total, 0);

    console.log('[perf][balance-sheet-data] calculation complete:', {
        assets: totalAssets,
        liabilities: totalLiabilities,
        equity: totalEquity,
        balanced: Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 0.01,
        duration_ms: Date.now() - tStart
    });

    return { assets, liabilities, equity, totalAssets, totalLiabilities, totalEquity };
}

export async function getBudgetVsActualReport(year: number, month: number) {
    const supabase = await createClient();
    const adYear = year - 543;
    const { data: accounts, error: accountError } = await supabase.from('chart_of_accounts').select('account_code, account_name').like('account_code', '5%').eq('is_active', true).order('account_code');
    if (accountError) throw accountError;
    const { data: budgets, error: budgetError } = await supabase.from('expense_budget').select('account_code, budget_amount').eq('year', year).eq('month', month);
    if (budgetError) throw budgetError;
    const budgetMap = new Map(budgets.map(b => [b.account_code, b.budget_amount]));
    const startDate = `${adYear}-${String(month).padStart(2, '0')}-01`;
    const endDate = new Date(adYear, month, 0).toISOString().split('T')[0];
    const { data: actuals, error: actualsError } = await supabase.from('expense_journal').select('account_code, amount').gte('journal_date', startDate).lte('journal_date', endDate);
    if (actualsError) throw actualsError;
    const actualsMap = new Map<string, number>();
    for (const actual of actuals) {
        actualsMap.set(actual.account_code, (actualsMap.get(actual.account_code) || 0) + actual.amount);
    }
    const reportData = accounts.map(acc => {
        const budget_amount = budgetMap.get(acc.account_code) || 0;
        const actual_amount = actualsMap.get(acc.account_code) || 0;
        const variance = budget_amount - actual_amount;
        return { account_code: acc.account_code, account_name: acc.account_name, budget_amount, actual_amount, variance, };
    }).filter(item => item.budget_amount > 0 || item.actual_amount > 0);
    return reportData;
}

// Dashboard Actions
export async function getDashboardData(projectId?: string | null) {
    try {
        const supabase = await createClient();
        console.log('[getDashboardData] Fetching dashboard data for project:', projectId);

        const today = new Date();
        const currentMonth = today.getMonth() + 1;
        const currentYear = today.getFullYear();
        const currentMonthStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;

        // Build query base with project filter
        const buildQuery = (table: string) => {
            let query = supabase.from(table);
            if (projectId) {
                query = query.eq('project_id', projectId);
            }
            return query;
        };

        try {
            // Run all queries in parallel for better performance
            const [
                unitsResult,
                allBillsResult, // Get all bills with month info in one query
                completedPaymentsResult,
                recentBillsResult,
                recentPaymentsResult,
                paymentStatusCounts,
                residentsResult
            ] = await Promise.all([
                // 1. Get units count
                buildQuery('units')
                    .select('*', { count: 'exact', head: true })
                    .neq('status', 'vacant'),

                // 2. Get bills (we'll filter in memory - faster than multiple queries)
                // Get bills from last 12 months to cover monthly revenue calculation
                buildQuery('bills')
                    .select('id, unit_id, total, status, month')
                    .gte('month', `${currentYear - 1}-01`)
                    .order('created_at', { ascending: false })
                    .limit(2000), // Limit to recent bills

                // 3. Get completed payments (use payments table)
                buildQuery('payments')
                    .select('amount, bill_id, payment_date')
                    .eq('status', 'completed')
                    .not('payment_date', 'is', null)
                    .limit(1000), // Limit to prevent huge queries

                // 4. Get recent bills
                buildQuery('bills')
                    .select('id, bill_number, total, status, created_at, units(unit_number)')
                    .order('created_at', { ascending: false })
                    .limit(5),

                // 5. Get recent payments (use payments table)
                buildQuery('payments')
                    .select('id, amount, status, payment_date, reference_number, created_at, bill_id')
                    .order('created_at', { ascending: false })
                    .limit(5),

                // 6. Get payment status counts (use payments table)
                Promise.all([
                    buildQuery('payments').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
                    buildQuery('payments').select('*', { count: 'exact', head: true }).eq('status', 'processing'),
                    buildQuery('payments').select('*', { count: 'exact', head: true }).eq('status', 'completed'),
                    buildQuery('payments').select('*', { count: 'exact', head: true }).eq('status', 'failed')
                ]),

                // 7. Get total residents
                buildQuery('units')
                    .select('residents')
                    .neq('status', 'vacant')
            ]);

            // Extract data from results
            const totalUnitsCount = unitsResult.count || 0;
            const allBills = allBillsResult.data || [];
            const completedPayments = completedPaymentsResult.data || [];
            const recentBills = recentBillsResult.data || [];
            const recentPayments = recentPaymentsResult.data || [];
            const residentsData = residentsResult.data || [];
            const [pendingCount, processingCount, completedCount, failedCount] = paymentStatusCounts;

            // Log errors if any (but continue processing)
            if (unitsResult.error) console.error('[getDashboardData] Units error:', unitsResult.error);
            if (allBillsResult.error) console.error('[getDashboardData] Bills error:', allBillsResult.error);
            if (completedPaymentsResult.error) console.error('[getDashboardData] Payments error:', completedPaymentsResult.error);
            if (recentBillsResult.error) console.error('[getDashboardData] Recent bills error:', recentBillsResult.error);
            if (recentPaymentsResult.error) console.error('[getDashboardData] Recent payments error:', recentPaymentsResult.error);
            if (residentsResult.error) console.error('[getDashboardData] Residents error:', residentsResult.error);

            // Filter bills in memory (much faster than multiple queries)
            const currentMonthBills = allBills.filter((b: any) => b.month === currentMonthStr);
            const outstandingBills = allBills.filter((b: any) => ['pending', 'unpaid'].includes(b.status));

            // Create bills map for payment matching
            const billsMap = new Map(allBills.map((b: any) => [b.id, b]));

            // Calculate metrics
            const totalUnits = totalUnitsCount;

            // Calculate revenue from completed payments in current month
            const currentMonthPayments = completedPayments.filter((p: any) => {
                const bill = billsMap.get(p.bill_id);
                if (bill?.month === currentMonthStr) {
                    return true;
                }
                // Fallback: check paid_at date if bill month not available
                if (p.payment_date) {
                    const paidDate = new Date(p.payment_date);
                    return paidDate.getMonth() + 1 === currentMonth && paidDate.getFullYear() === currentYear;
                }
                return false;
            });

            const totalRevenueThisMonth = currentMonthPayments.reduce(
                (sum: number, p: any) => sum + (parseFloat(p.amount) || 0), 0
            );

            // Calculate paid units this month
            const paidBills = currentMonthBills.filter((b: any) => b.status === 'paid');
            const paidUnitsThisMonth = new Set(paidBills.map((b: any) => b.unit_id)).size;

            // Calculate outstanding amounts
            const totalOutstanding = outstandingBills.reduce(
                (sum: number, b: any) => sum + (parseFloat(b.total) || 0), 0
            );
            const overdueUnits = new Set(outstandingBills.map((b: any) => b.unit_id)).size;

            // Calculate collection rate
            const collectionRate = totalUnits > 0 ? (paidUnitsThisMonth / totalUnits) * 100 : 0;

            // Calculate total residents
            const totalResidents = residentsData.reduce(
                (sum: number, u: any) => sum + (parseInt(u.residents) || 0), 0
            );

            // Monthly revenue for last 6 months
            const monthlyRevenue: Array<{ month: string; revenue: number }> = [];
            for (let i = 5; i >= 0; i--) {
                const d = new Date(currentYear, currentMonth - 1 - i, 1);
                const monthStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

                const monthPayments = completedPayments.filter((p: any) => {
                    const bill = billsMap.get(p.bill_id);
                    if (bill?.month === monthStr) {
                        return true;
                    }
                    // Fallback: check paid_at date if bill month not available
                    if (p.payment_date) {
                        const paidDate = new Date(p.payment_date);
                        return paidDate.getMonth() + 1 === d.getMonth() + 1 && paidDate.getFullYear() === d.getFullYear();
                    }
                    return false;
                });

                const monthRevenue = monthPayments.reduce(
                    (sum: number, p: any) => sum + (parseFloat(p.amount) || 0), 0
                );

                monthlyRevenue.push({
                    month: d.toLocaleDateString('th-TH', { month: 'short', year: 'numeric' }),
                    revenue: monthRevenue
                });
            }

            // Format recent activities
            const recentActivities = [
                ...recentBills.map((b: any) => ({
                    id: b.id,
                    type: 'bill' as const,
                    title: `บิลใหม่: ${b.units?.unit_number || (Array.isArray(b.units) && b.units[0]?.unit_number) || 'N/A'}`,
                    description: `บิลเลขที่ ${b.bill_number}`,
                    amount: parseFloat(b.total) || 0,
                    status: b.status,
                    createdAt: b.created_at
                })),
                ...recentPayments.map((p: any) => ({
                    id: p.id,
                    type: 'payment' as const,
                    title: `ชำระเงิน`,
                    description: `เลขที่อ้างอิง: ${p.reference_number || 'N/A'}`,
                    amount: parseFloat(p.amount) || 0,
                    status: p.status,
                    createdAt: p.payment_date || p.created_at
                }))
            ]
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                .slice(0, 10);

            // Payment status breakdown
            const paymentStatusBreakdown = {
                pending: pendingCount.count || 0,
                processing: processingCount.count || 0,
                completed: completedCount.count || 0,
                failed: failedCount.count || 0,
            };

            console.log('[getDashboardData] Success:', {
                totalRevenueThisMonth,
                totalUnits,
                paidUnitsThisMonth,
                collectionRate,
                totalOutstanding,
                overdueUnits
            });

            return {
                totalRevenueThisMonth,
                totalUnits,
                paidUnitsThisMonth,
                collectionRate,
                totalOutstanding,
                overdueUnits,
                totalResidents,
                monthlyRevenue,
                recentActivities,
                paymentStatusBreakdown
            };
        } catch (queryError: any) {
            console.error('[getDashboardData] Query error:', queryError);
            // Return default values to prevent infinite loading
            return {
                totalRevenueThisMonth: 0,
                totalUnits: 0,
                paidUnitsThisMonth: 0,
                collectionRate: 0,
                totalOutstanding: 0,
                overdueUnits: 0,
                totalResidents: 0,
                monthlyRevenue: [],
                recentActivities: [],
                paymentStatusBreakdown: {
                    pending: 0,
                    processing: 0,
                    completed: 0,
                    failed: 0
                }
            };
        }
    } catch (error: any) {
        console.error('[getDashboardData] Error:', error);
        // Return default values to prevent infinite loading
        return {
            totalRevenueThisMonth: 0,
            totalUnits: 0,
            paidUnitsThisMonth: 0,
            collectionRate: 0,
            totalOutstanding: 0,
            overdueUnits: 0,
            totalResidents: 0,
            monthlyRevenue: [],
            recentActivities: [],
            paymentStatusBreakdown: {
                pending: 0,
                processing: 0,
                completed: 0,
                failed: 0
            }
        };
    }
}

// Vendor Actions
export async function getVendorsFromDB(projectId?: string | null, restrictToProject?: boolean) {
    const supabase = await createClient();
    let query = supabase
        .from("vendors")
        .select("id,name,contact_person,phone,email,address,tax_id,notes,project_id")
        .order("name");

    if (restrictToProject && projectId) {
        query = query.eq('project_id', projectId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
}

export async function saveVendorToDB(vendor: any) {
    const supabase = await createClient();
    const { id, ...vendorData } = vendor;
    if (id && id !== "new") {
        const { error } = await supabase.from("vendors").update(vendorData).eq("id", id);
        if (error) throw error;
    } else {
        const { error } = await supabase.from("vendors").insert([vendorData]);
        if (error) throw error;
    }
    revalidatePath("/(admin)/vendors");
}

export async function deleteVendorFromDB(id: string) {
    const supabase = await createClient();
    const { error } = await supabase.from("vendors").delete().eq("id", id);
    if (error) throw error;
    revalidatePath("/(admin)/vendors");
}

// Accounts Payable Actions
export async function getApInvoices() {
    const supabase = await createClient();
    const { data, error } = await supabase.from('ap_invoices').select('*, vendors(name)').order('due_date', { ascending: true });
    if (error) throw error;
    return data || [];
}

export async function getExpenseAccountsFromDB() {
    const supabase = await createClient();
    const { data, error } = await supabase.from('chart_of_accounts').select('account_code, account_name').like('account_code', '5%').eq('is_active', true).order('account_code');
    if (error) throw error;
    return data || [];
}

export async function saveApInvoice(invoice: any) {
    const supabase = await createClient();
    const { id, ...invoiceData } = invoice;
    if (id) {
        const { error } = await supabase.from('ap_invoices').update(invoiceData).eq("id", id);
        if (error) throw error;
    } else {
        const { error } = await supabase.from('ap_invoices').insert([invoiceData]);
        if (error) throw error;
    }
    revalidatePath('/(admin)/accounts-payable');
}

export async function deleteApInvoice(id: string) {
    const supabase = await createClient();
    const { error } = await supabase.from('ap_invoices').delete().eq('id', id);
    if (error) throw error;
    revalidatePath('/(admin)/accounts-payable');
}

export async function payApInvoice(invoiceId: string, paymentDate: string, expenseAccountCode: string) {
    const supabase = await createClient();
    const { data: invoice, error: fetchError } = await supabase.from('ap_invoices').select('*, vendors(name)').eq('id', invoiceId).single();
    if (fetchError || !invoice) throw new Error("Invoice not found");
    const expenseEntry = { journal_date: paymentDate, account_code: expenseAccountCode, description: `ชำระใบแจ้งหนี้ #${invoice.invoice_number} ให้ ${invoice.vendors?.name}`, amount: invoice.amount, reference_number: invoice.invoice_number, vendor_id: invoice.vendor_id, };
    const { data: newExpense, error: expenseError } = await supabase.from('expense_journal').insert(expenseEntry).select().single();
    if (expenseError) throw expenseError;
    const { error: updateError } = await supabase.from('ap_invoices').update({ status: 'paid', payment_date: paymentDate, expense_journal_id: newExpense.id, }).eq('id', invoiceId);
    if (updateError) throw updateError;
    revalidatePath('/(admin)/accounts-payable');
    revalidatePath('/(admin)/expenses');
}

// General Ledger Actions
export async function getGeneralLedgerData(accountCode: string, startDate: string, endDate: string, projectId?: string | null) {
    const supabase = await createClient();
    const { data: beginningBalanceData } = await supabase.rpc('calculate_beginning_balance', { p_account_code: accountCode, p_start_date: startDate });
    let transactionsQuery = supabase.from('general_ledger_view').select('*').eq('account_code', accountCode).gte('journal_date', startDate).lte('journal_date', endDate)

    if (projectId) {
        transactionsQuery = transactionsQuery.eq('project_id', projectId)
    }

    const { data: transactions } = await transactionsQuery.order('journal_date', { ascending: true }).order('created_at', { ascending: true });
    let currentBalance = beginningBalanceData || 0;
    const entries = (transactions || []).map(tx => {
        if (accountCode.startsWith('1') || accountCode.startsWith('5')) { currentBalance = currentBalance + tx.debit - tx.credit; } else { currentBalance = currentBalance - tx.debit + tx.credit; }
        return { ...tx, balance: currentBalance };
    });
    return { summary: { beginning: beginningBalanceData || 0, totalDebit: entries.reduce((sum, item) => sum + item.debit, 0), totalCredit: entries.reduce((sum, item) => sum + item.credit, 0), ending: currentBalance, }, entries, };
}

// Journal Vouchers Actions
export async function getJournalVouchers(startDate: string, endDate: string, projectId?: string | null) {
    const supabase = await createClient();
    let query = supabase.from('general_ledger_view').select('*').gte('journal_date', startDate).lte('journal_date', endDate)

    if (projectId) {
        query = query.eq('project_id', projectId)
    }

    const { data, error } = await query.order('journal_date', { ascending: false }).order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
}

// Fixed Assets Actions
export async function getFixedAssets(projectId?: string | null, restrictToProject?: boolean) {
    const supabase = await createClient();
    let query = supabase
        .from('fixed_assets')
        .select(
            `id, asset_name, asset_code, description, purchase_date, purchase_cost, lifespan_years,
             salvage_value, status, location, asset_account_code, depreciation_account_code,
             expense_account_code, project_id, created_at, updated_at, last_depreciation_date`
        )
        .order('purchase_date', { ascending: false });

    // Apply project filter when provided or when restricted to selected project
    if ((restrictToProject && projectId) || (projectId && restrictToProject)) {
        query = query.eq('project_id', projectId as string);
    } else if (projectId && !restrictToProject) {
        // If projectId is provided but not strictly restricted (e.g., super_admin selecting a project),
        // still allow filtering to reduce payload when a specific project is selected.
        query = query.eq('project_id', projectId as string);
    }

    const { data, error } = await query;
    if (error) { console.error("Error fetching fixed assets:", error); throw error; }
    return data || [];
}

export async function saveFixedAsset(asset: any) {
    const supabase = await createClient();
    const { id, ...assetData } = asset;
    if (assetData.asset_code === '') { assetData.asset_code = null; }
    if (id) {
        if (assetData.asset_code) {
            const { data: existing, error: checkError } = await supabase.from('fixed_assets').select('id').eq('asset_code', assetData.asset_code).not('id', 'eq', id).single();
            if (checkError && checkError.code !== 'PGRST116') { console.error("Check duplicate asset code error during update:", checkError); throw checkError; }
            if (existing) { throw new Error("รหัสทรัพย์สินนี้ถูกใช้โดยทรัพย์สินอื่นแล้ว"); }
        }
        const { error } = await supabase.from('fixed_assets').update(assetData).eq('id', id);
        if (error) { console.error("Error updating fixed asset:", error); if (error.code === '23505') { throw new Error("รหัสทรัพย์สินซ้ำกับรายการที่มีอยู่"); } throw error; }
    } else {
        if (assetData.asset_code) {
            const { data: existing, error: checkError } = await supabase.from('fixed_assets').select('id').eq('asset_code', assetData.asset_code).single();
            if (checkError && checkError.code !== 'PGRST116') { console.error("Check duplicate asset code error during create:", checkError); throw checkError; }
            if (existing) { throw new Error("รหัสทรัพย์สินนี้มีอยู่ในระบบแล้ว"); }
        }
        const { error } = await supabase.from('fixed_assets').insert([assetData]);
        if (error) { console.error("Error inserting fixed asset:", error); if (error.code === '23505') { throw new Error("รหัสทรัพย์สินซ้ำกับรายการที่มีอยู่"); } throw error; }
    }
    revalidatePath('/(admin)/fixed-assets');
}

export async function deleteFixedAsset(id: string) {
    const supabase = await createClient();
    const { error } = await supabase.from('fixed_assets').delete().eq('id', id);
    if (error) throw error;
    revalidatePath('/(admin)/fixed-assets');
}

// Depreciation Actions
export async function calculateDepreciationPreview(
    calculationMonth: string,
    projectId?: string | null,
    restrictToProject?: boolean
) {
    const supabase = await createClient();
    const [year, month] = calculationMonth.split('-').map(Number);
    // Get the last day of the selected month
    const lastDayOfMonth = new Date(year, month, 0);
    const tStart = typeof performance !== 'undefined' ? performance.now() : Date.now();

    console.log('[depr] Calculation params:', { calculationMonth, year, month, lastDayOfMonth: lastDayOfMonth.toISOString(), projectId });

    let query = supabase
        .from('fixed_assets')
        .select(`
            id, asset_name, asset_code, purchase_date, purchase_cost,
            salvage_value, lifespan_years, last_depreciation_date,
            asset_account_code, depreciation_account_code, expense_account_code,
            project_id, status
        `)
        .eq('status', 'in_use')
        .lte('purchase_date', lastDayOfMonth.toISOString().split('T')[0]);

    // Only filter by project_id if restrictToProject is true AND projectId is provided
    // This allows assets with NULL project_id to be included when not restricting
    if (restrictToProject && projectId) {
        query = query.eq('project_id', projectId as string);
    }

    const { data: assets, error } = await query;
    const tMid = typeof performance !== 'undefined' ? performance.now() : Date.now();
    console.log('[perf][depr] assets fetch:', {
        count: assets?.length || 0,
        duration_ms: Math.round(tMid - tStart),
        filtered: Boolean(restrictToProject && projectId)
    });
    if (error) {
        console.error('[depr] Query error:', error);
        throw error;
    }

    const previewList: any[] = [];
    for (const asset of assets || []) {
        const lastDepDate = asset.last_depreciation_date ? new Date(asset.last_depreciation_date) : new Date(asset.purchase_date);

        // Check if already depreciated for this month or later
        if (lastDepDate.getFullYear() > year || (lastDepDate.getFullYear() === year && lastDepDate.getMonth() + 1 > month)) {
            console.log('[depr] Skip - already depreciated:', asset.asset_name, { lastDepDate: lastDepDate.toISOString(), calculationMonth });
            continue;
        }

        const purchaseDate = new Date(asset.purchase_date);
        const usefulLifeMonths = asset.lifespan_years * 12;
        // Use lastDayOfMonth for calculation instead of calculationDate
        const monthsSincePurchase = (lastDayOfMonth.getFullYear() - purchaseDate.getFullYear()) * 12 + (lastDayOfMonth.getMonth() - purchaseDate.getMonth());

        if (monthsSincePurchase >= usefulLifeMonths) {
            console.log('[depr] Skip - fully depreciated:', asset.asset_name, { monthsSincePurchase, usefulLifeMonths });
            continue;
        }

        const monthlyDepreciation = (asset.purchase_cost - (asset.salvage_value || 0)) / usefulLifeMonths;
        if (monthlyDepreciation > 0) {
            console.log('[depr] Include:', asset.asset_name, { monthlyDepreciation, monthsSincePurchase, usefulLifeMonths });
            previewList.push({
                asset_id: asset.id,
                asset_name: asset.asset_name,
                asset_code: asset.asset_code,
                monthly_depreciation: monthlyDepreciation,
                journal_description: `ค่าเสื่อมราคา - ${asset.asset_name} ประจำเดือน ${calculationMonth}`,
                asset_account_code: asset.asset_account_code,
                depreciation_account_code: asset.depreciation_account_code,
                expense_account_code: asset.expense_account_code,
            });
        }
    }
    const tEnd = typeof performance !== 'undefined' ? performance.now() : Date.now();
    console.log('[perf][depr] preview compute:', {
        count: previewList.length,
        duration_ms: Math.round(tEnd - tMid)
    });
    return previewList;
}

export async function postDepreciationEntries(calculationMonth: string, previews: any[]) {
    const supabase = await createClient();
    const [year, month] = calculationMonth.split('-').map(Number);
    const postDate = new Date(year, month, 0).toISOString().split('T')[0];
    const tStart = typeof performance !== 'undefined' ? performance.now() : Date.now();

    // 1. Insert into Expense Journal (for visibility in Expenses list)
    const journalEntries = previews.map(p => ({
        journal_date: postDate,
        account_code: p.expense_account_code,
        description: p.journal_description,
        amount: p.monthly_depreciation,
        reference_number: `DEP-${calculationMonth}-${p.asset_code}`,
        project_id: p.project_id // Ensure project_id is saved
    }));

    const { data: savedExpenses, error: journalError } = await supabase.from('expense_journal').insert(journalEntries).select();
    if (journalError) { console.error("Error posting depreciation to journal:", journalError); throw new Error("ไม่สามารถบันทึกค่าเสื่อมราคาลงสมุดรายวันได้"); }

    // 2. Insert into General Ledger (Double Entry)
    // Debit: Depreciation Expense
    // Credit: Accumulated Depreciation
    const glEntries: any[] = [];

    previews.forEach((p, index) => {
        const savedId = savedExpenses ? savedExpenses[index].id : null;

        // Debit Entry
        glEntries.push({
            transaction_date: postDate,
            account_code: p.expense_account_code,
            debit: p.monthly_depreciation,
            credit: 0,
            description: p.journal_description,
            reference_type: 'depreciation',
            reference_id: savedId,
            project_id: p.project_id
        });

        // Credit Entry
        glEntries.push({
            transaction_date: postDate,
            account_code: p.depreciation_account_code,
            debit: 0,
            credit: p.monthly_depreciation,
            description: `Accumulated Depreciation for ${p.asset_code}`,
            reference_type: 'depreciation',
            reference_id: savedId,
            project_id: p.project_id
        });
    });

    const { error: glError } = await supabase.from('general_ledger').insert(glEntries);
    if (glError) { console.error("Error posting depreciation to GL:", glError); }

    const updates = previews.map(p => supabase.from('fixed_assets').update({ last_depreciation_date: postDate }).eq('id', p.asset_id));
    const results = await Promise.all(updates);
    const updateErrors = results.filter(res => res.error);
    if (updateErrors.length > 0) { console.error("Error updating assets' last depreciation date:", updateErrors); throw new Error("บันทึกค่าเสื่อมราคาสำเร็จ แต่เกิดปัญหาในการอัปเดตวันที่ของทรัพย์สิน"); }
    const tEnd = typeof performance !== 'undefined' ? performance.now() : Date.now();
    console.log('[perf][depr] post entries:', {
        journal_count: journalEntries.length,
        duration_ms: Math.round(tEnd - tStart)
    });
    revalidatePath('/(admin)/depreciation');
    revalidatePath('/(admin)/expenses');
    revalidatePath('/(admin)/journal-vouchers');
    revalidatePath('/(admin)/general-ledger');
    revalidatePath('/(admin)/financial-statements');
}

// Resident Portal Actions
export async function signInResident(unitNumber: string, pass: string): Promise<{ success: boolean; error?: string; resident?: any }> {
    const supabase = await createClient()
    const { data: unit, error } = await supabase.from("units").select("id, unit_number, owner_name, password").eq("unit_number", unitNumber).single()
    if (error || !unit) { return { success: false, error: "ไม่พบเลขห้องนี้ในระบบ" } }
    if (unit.password !== pass) { return { success: false, error: "รหัสผ่านไม่ถูกต้อง" } }
    const { password, ...residentData } = unit
    return { success: true, resident: residentData }
}

export async function getPortalDataForUnit(unitId: string) {
    const supabase = await createClient();

    try {
        // Validate unitId
        if (!unitId || unitId.trim() === '') {
            console.error('[getPortalDataForUnit] Invalid unitId:', unitId);
            return {
                outstandingBills: [],
                paymentHistory: [],
                totalOutstanding: 0,
                announcements: [],
                maintenanceRequests: [],
                error: 'Unit ID is required',
            };
        }

        // First, get bills
        const billsRes = await supabase
            .from('bills')
            .select('*')
            .eq('unit_id', unitId)
            .order('month', { ascending: false });

        if (billsRes.error) {
            console.error('[getPortalDataForUnit] Bills query error:', billsRes.error);
            throw new Error(`Could not fetch bills: ${billsRes.error.message} (Code: ${billsRes.error.code})`);
        }

        // Fetch payment transactions for all bills (for status display)
        const billIds = (billsRes.data || []).map(b => b.id);
        let paymentTransactions: any[] = [];
        let paymentHistory: any[] = [];

        if (billIds.length > 0) {
            // Get all transactions for status display
            const { data: transactions, error: transactionsError } = await supabase
                .from('payment_transactions')
                .select(`
                    id,
                    bill_id,
                    status,
                    reference_number,
                    created_at,
                    paid_at,
                    amount,
                    currency,
                    bills!inner(
                        id,
                        bill_number,
                        month
                    )
                `)
                .in('bill_id', billIds)
                .order('created_at', { ascending: false });

            if (!transactionsError && transactions) {
                paymentTransactions = transactions;

                // Filter completed transactions for payment history
                paymentHistory = transactions
                    .filter((t: any) => t.status === 'completed' && t.bills)
                    .map((t: any) => ({
                        id: t.id,
                        payment_date: t.paid_at || t.created_at,
                        amount: t.amount,
                        reference_number: t.reference_number || `PAY-${t.id.substring(0, 8)}`,
                        bill_id: t.bill_id,
                        bills: {
                            bill_number: t.bills?.bill_number || '',
                            month: t.bills?.month || '',
                        },
                    }))
                    .sort((a: any, b: any) => {
                        const dateA = new Date(a.payment_date).getTime();
                        const dateB = new Date(b.payment_date).getTime();
                        return dateB - dateA;
                    })
                    .slice(0, 10); // Limit to 10 most recent
            }
        }

        // Map transactions to bills
        const billsWithTransactions = (billsRes.data || []).map(bill => {
            const billTransactions = paymentTransactions.filter(t => t.bill_id === bill.id);
            const latestTransaction = billTransactions[0]; // Most recent transaction
            return {
                ...bill,
                payment_transactions: billTransactions,
                latest_transaction_status: latestTransaction?.status || null,
            };
        });

        const outstandingBills = billsWithTransactions.filter(b => b.status !== 'paid');
        const totalOutstanding = outstandingBills.reduce((sum, bill) => sum + bill.total, 0);

        // For announcements and maintenance - fetch with timeout handling
        let announcements: any[] = [];
        let maintenanceRequests: any[] = [];

        // Try to fetch announcements (non-critical, timeout quickly)
        try {
            const { data: unit } = await supabase
                .from('units')
                .select('project_id')
                .eq('id', unitId)
                .single();

            const projectId = unit?.project_id;

            if (projectId) {
                const { data } = await supabase
                    .from('announcements')
                    .select('id, title, content, category, image_urls, attachments, publish_date, is_pinned')
                    .eq('project_id', projectId)
                    .order('is_pinned', { ascending: false })
                    .order('publish_date', { ascending: false })
                    .limit(5);

                announcements = data || [];
            }
        } catch (error) {
            console.warn('[getPortalDataForUnit] Announcements timeout, skipping:', error);
        }

        // Try to fetch maintenance requests (non-critical, timeout quickly)
        try {
            const { data } = await supabase
                .from('maintenance_requests')
                .select('id, title, description, status, created_at, scheduled_at')
                .eq('unit_id', unitId)
                .order('created_at', { ascending: false })
                .limit(5);

            maintenanceRequests = (data || []).map((req: any) => {
                if (req.image_urls) {
                    try {
                        if (typeof req.image_urls === 'string') {
                            req.image_urls = JSON.parse(req.image_urls);
                        }
                        if (!Array.isArray(req.image_urls)) {
                            req.image_urls = [];
                        }
                    } catch (e) {
                        req.image_urls = [];
                    }
                }
                return req;
            });
        } catch (error) {
            console.warn('[getPortalDataForUnit] Maintenance timeout, skipping:', error);
        }

        return {
            outstandingBills,
            paymentHistory,
            totalOutstanding,
            announcements,
            maintenanceRequests,
        };
    } catch (error: any) {
        console.error('[getPortalDataForUnit] Error:', error);
        console.error('[getPortalDataForUnit] Error stack:', error.stack);
        console.error('[getPortalDataForUnit] Unit ID:', unitId);

        // Return empty data structure instead of throwing to prevent 500 error
        // This allows the UI to still render with empty state
        return {
            outstandingBills: [],
            paymentHistory: [],
            totalOutstanding: 0,
            announcements: [],
            maintenanceRequests: [],
            error: error.message || 'Unknown error loading portal data',
        };
    }
}

export async function getReceiptData(paymentId: string) {
    const supabase = await createClient();
    const { data, error } = await supabase.from('payments').select(`*, bills ( *, units ( * ) )`).eq('id', paymentId).single();
    if (error) { console.error("getReceiptData Error:", error); throw new Error(`ไม่สามารถดึงข้อมูลใบเสร็จได้`); }
    if (!data || !data.bills || !data.bills.units) { throw new Error('ไม่พบข้อมูลที่เกี่ยวข้องกับใบเสร็จ'); }
    return { payment: data, bill: data.bills, unit: data.bills.units, };
}

// Maintenance Request Actions
export async function getMaintenanceRequests(
    projectId?: string | null,
    page: number = 1,
    limit: number = 50,
    status?: string,
    search?: string
) {
    const supabase = await createClient();
    console.log('[getMaintenanceRequests] Fetching requests:', { projectId, page, limit, status, search })

    try {
        // Calculate offset
        const from = (page - 1) * limit
        const to = from + limit - 1

        let query = supabase
            .from('maintenance_requests')
            .select('id, title, description, status, priority, detailed_status, created_at, scheduled_at, unit_id, project_id, units(unit_number, owner_name, display_unit_number)', { count: 'exact' })

        if (projectId) {
            query = query.eq('project_id', projectId)
        }

        if (status && status !== 'all') {
            query = query.eq('status', status)
        }

        if (search) {
            // Search in title, description, or unit number
            // Note: searching in related table (units.unit_number) is tricky with Supabase simple filters
            // We'll search in title/description first. For unit number, we might need a separate approach or use !inner join if critical.
            query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`)
        }

        const { data, error, count } = await query
            .order('created_at', { ascending: false })
            .range(from, to)

        if (error) {
            console.error('[getMaintenanceRequests] Error:', error)
            if (error.code === '42P01') {
                console.warn('[getMaintenanceRequests] Table maintenance_requests does not exist')
                return { requests: [], total: 0 }
            }
            throw error
        }

        // Transform data to match expected interface
        const requests = (data || []).map((req: any) => ({
            ...req,
            units: Array.isArray(req.units) ? req.units[0] : req.units
        }))

        return { requests, total: count || 0 }
    } catch (error: any) {
        console.error('[getMaintenanceRequests] Exception:', error)
        return { requests: [], total: 0 }
    }
}

export async function createMaintenanceRequest(requestData: {
    unit_id: string,
    title: string,
    description: string,
    priority: string,
    location?: string,
    contact_phone?: string,
    reported_by?: string,
    project_id?: string | null,
    request_type?: string,
    has_cost?: boolean,
    estimated_cost?: number,
    image_urls?: string[],
    detailed_status?: string
}) {
    const supabase = await createClient();
    console.log('[createMaintenanceRequest] Creating with data:', requestData)

    const insertData = {
        unit_id: requestData.unit_id,
        title: requestData.title,
        description: requestData.description,
        priority: requestData.priority,
        location: requestData.location || null,
        contact_phone: requestData.contact_phone || null,
        reported_by: requestData.reported_by || 'admin',
        project_id: requestData.project_id || null,
        request_type: requestData.request_type || null,
        has_cost: requestData.has_cost || false,
        estimated_cost: requestData.estimated_cost || null,
        image_urls: requestData.image_urls || [],
        detailed_status: requestData.detailed_status || 'new',
        status: 'new'
    }

    const { error } = await supabase.from('maintenance_requests').insert([insertData]);
    if (error) {
        console.error("Error creating maintenance request:", error);
        throw new Error("ไม่สามารถสร้างใบแจ้งซ่อมได้");
    }
    revalidatePath('/portal/dashboard');
    revalidatePath('/(admin)/maintenance');
}

export async function updateMaintenanceStatus(id: string, status: string) {
    const supabase = await createClient();
    const { error } = await supabase.from('maintenance_requests').update({ status }).eq('id', id);
    if (error) { console.error("Error updating maintenance status:", error); throw new Error("ไม่สามารถอัปเดตสถานะใบแจ้งซ่อมได้"); }
    revalidatePath('/(admin)/maintenance');
    revalidatePath('/portal/dashboard');
}

// Announcement Actions
export async function getAnnouncements() {
    const supabase = await createClient();
    const { data, error } = await supabase.from('announcements').select('*').order('is_pinned', { ascending: false }).order('publish_date', { ascending: false });
    if (error) throw error;
    return data || [];
}

export async function saveAnnouncement(announcement: any) {
    const supabase = await createClient();
    const { id, ...data } = announcement;
    console.log('[saveAnnouncement] Saving with data:', { id, ...data })

    const isNew = !id;

    if (id) {
        const { error } = await supabase.from('announcements').update(data).eq('id', id);
        if (error) {
            console.error('[saveAnnouncement] Update error:', error)
            throw error;
        }
    } else {
        const { error } = await supabase.from('announcements').insert([data]);
        if (error) {
            console.error('[saveAnnouncement] Insert error:', error)
            throw error;
        }
    }

    // Send notifications if this is a new announcement
    if (isNew) {
        try {
            const { createAnnouncementNotification } = await import('@/lib/supabase/notification-helpers');

            // Get all units in this project
            let unitsQuery = supabase.from('units').select('id, unit_number');

            if (data.project_id) {
                unitsQuery = unitsQuery.eq('project_id', data.project_id);
            }

            const { data: units, error: unitsError } = await unitsQuery;

            if (!unitsError && units && units.length > 0) {
                // Send notification to all units in the project
                for (const unit of units) {
                    await createAnnouncementNotification(
                        unit.unit_number,
                        data.title || 'ประกาศใหม่'
                    );
                }

                console.log(`[saveAnnouncement] Sent notifications to ${units.length} units`);
            }
        } catch (notificationError) {
            console.error('[saveAnnouncement] Notification error:', notificationError);
            // Don't fail the announcement save if notification fails
        }
    }

    revalidatePath('/(admin)/announcements');
    revalidatePath('/portal/dashboard');
}

export async function deleteAnnouncement(id: string) {
    const supabase = await createClient();
    const { error } = await supabase.from('announcements').delete().eq('id', id);
    if (error) throw error;
    revalidatePath('/(admin)/announcements');
    revalidatePath('/portal/dashboard');
}

// Financial Reports Actions

/**
 * Get Income Statement data for a given period
 * @param startDate - Start date of the period (YYYY-MM-DD)
 * @param endDate - End date of the period (YYYY-MM-DD)
 * @param projectId - Optional project ID filter
 */
export async function getIncomeStatement(
    startDate: string,
    endDate: string,
    projectId?: string | null
) {
    const supabase = await createClient();
    const tStart = Date.now();

    // Build query for general ledger
    let query = supabase
        .from('general_ledger_view')
        .select('account_code, account_name, account_type, debit, credit, journal_date')
        .gte('journal_date', startDate)
        .lte('journal_date', endDate)
        .in('account_type', ['revenue', 'expense']);

    if (projectId) {
        query = query.eq('project_id', projectId);
    }

    const { data: transactions, error } = await query;

    if (error) {
        console.error('[getIncomeStatement] Query error:', error);
        throw error;
    }

    console.log('[perf][income-statement] transactions fetch:', {
        count: transactions?.length || 0,
        duration_ms: Date.now() - tStart,
        period: `${startDate} to ${endDate}`,
        projectId
    });

    // Aggregate by account
    const accountMap = new Map<string, {
        account_code: string;
        account_name: string;
        account_type: string;
        balance: number;
    }>();

    for (const txn of transactions || []) {
        const key = txn.account_code;
        if (!accountMap.has(key)) {
            accountMap.set(key, {
                account_code: txn.account_code,
                account_name: txn.account_name,
                account_type: txn.account_type,
                balance: 0
            });
        }

        const account = accountMap.get(key)!;
        // Revenue: credit increases, debit decreases
        // Expense: debit increases, credit decreases
        if (txn.account_type === 'revenue') {
            account.balance += (txn.credit || 0) - (txn.debit || 0);
        } else if (txn.account_type === 'expense') {
            account.balance += (txn.debit || 0) - (txn.credit || 0);
        }
    }

    // Group accounts by category
    const accounts = Array.from(accountMap.values());

    const revenue = {
        operating: accounts.filter(a => a.account_type === 'revenue' && a.account_code.startsWith('41')),
        other: accounts.filter(a => a.account_type === 'revenue' && a.account_code.startsWith('42')),
        total: 0
    };
    revenue.total = [...revenue.operating, ...revenue.other].reduce((sum, a) => sum + a.balance, 0);

    const expenses = {
        personnel: accounts.filter(a => a.account_type === 'expense' && a.account_code.startsWith('51')),
        utilities: accounts.filter(a => a.account_type === 'expense' && a.account_code.startsWith('52')),
        maintenance: accounts.filter(a => a.account_type === 'expense' && a.account_code.startsWith('53')),
        cleaning: accounts.filter(a => a.account_type === 'expense' && a.account_code.startsWith('54')),
        security: accounts.filter(a => a.account_type === 'expense' && a.account_code.startsWith('55')),
        office: accounts.filter(a => a.account_type === 'expense' && a.account_code.startsWith('56')),
        insurance: accounts.filter(a => a.account_type === 'expense' && a.account_code.startsWith('57')),
        tax: accounts.filter(a => a.account_type === 'expense' && a.account_code.startsWith('58')),
        other: accounts.filter(a => a.account_type === 'expense' && a.account_code.startsWith('59')),
        total: 0
    };
    expenses.total = Object.values(expenses).flat().filter(a => typeof a === 'object').reduce((sum: number, a: any) => sum + a.balance, 0);

    const netIncome = revenue.total - expenses.total;

    console.log('[perf][income-statement] calculation complete:', {
        revenue: revenue.total,
        expenses: expenses.total,
        netIncome,
        duration_ms: Date.now() - tStart
    });

    return {
        period: { startDate, endDate },
        revenue,
        expenses,
        netIncome
    };
}

/**
 * Get Balance Sheet data as of a specific date
 * @param asOfDate - Date to calculate balances (YYYY-MM-DD)
 * @param projectId - Optional project ID filter
 */
export async function getBalanceSheet(
    asOfDate: string,
    projectId?: string | null
) {
    const supabase = await createClient();
    const tStart = Date.now();

    // Build query for general ledger
    let query = supabase
        .from('general_ledger_view')
        .select('account_code, account_name, account_type, debit, credit')
        .lte('journal_date', asOfDate)
        .in('account_type', ['asset', 'liability', 'equity']);

    if (projectId) {
        query = query.eq('project_id', projectId);
    }

    const { data: transactions, error } = await query;

    if (error) {
        console.error('[getBalanceSheet] Query error:', error);
        throw error;
    }

    console.log('[perf][balance-sheet] transactions fetch:', {
        count: transactions?.length || 0,
        duration_ms: Date.now() - tStart,
        asOfDate,
        projectId
    });

    // Aggregate by account
    const accountMap = new Map<string, {
        account_code: string;
        account_name: string;
        account_type: string;
        balance: number;
    }>();

    for (const txn of transactions || []) {
        const key = txn.account_code;
        if (!accountMap.has(key)) {
            accountMap.set(key, {
                account_code: txn.account_code,
                account_name: txn.account_name,
                account_type: txn.account_type,
                balance: 0
            });
        }

        const account = accountMap.get(key)!;
        // Asset: debit increases, credit decreases
        // Liability & Equity: credit increases, debit decreases
        if (txn.account_type === 'asset') {
            account.balance += (txn.debit || 0) - (txn.credit || 0);
        } else {
            account.balance += (txn.credit || 0) - (txn.debit || 0);
        }
    }

    // Get current year income (revenue - expenses) up to asOfDate
    const yearStart = `${asOfDate.substring(0, 4)}-01-01`;
    const incomeData = await getIncomeStatement(yearStart, asOfDate, projectId);
    const currentYearIncome = incomeData.netIncome;

    // Group accounts by category
    const accounts = Array.from(accountMap.values());

    const assets = {
        current: accounts.filter(a => a.account_type === 'asset' && a.account_code.startsWith('11')),
        fixed: accounts.filter(a => a.account_type === 'asset' && a.account_code.startsWith('12')),
        total: 0
    };
    assets.total = [...assets.current, ...assets.fixed].reduce((sum, a) => sum + a.balance, 0);

    const liabilities = {
        current: accounts.filter(a => a.account_type === 'liability' && a.account_code.startsWith('21')),
        longTerm: accounts.filter(a => a.account_type === 'liability' && a.account_code.startsWith('22')),
        total: 0
    };
    liabilities.total = [...liabilities.current, ...liabilities.longTerm].reduce((sum, a) => sum + a.balance, 0);

    const equity = {
        reserves: accounts.filter(a => a.account_type === 'equity' && a.account_code.startsWith('31')),
        retainedEarnings: accounts.filter(a => a.account_type === 'equity' && a.account_code === '3200').reduce((sum, a) => sum + a.balance, 0),
        currentYearIncome,
        total: 0
    };
    equity.total = equity.reserves.reduce((sum, a) => sum + a.balance, 0) + equity.retainedEarnings + equity.currentYearIncome;

    console.log('[perf][balance-sheet] calculation complete:', {
        assets: assets.total,
        liabilities: liabilities.total,
        equity: equity.total,
        balanced: Math.abs(assets.total - (liabilities.total + equity.total)) < 0.01,
        duration_ms: Date.now() - tStart
    });

    return {
        asOfDate,
        assets,
        liabilities,
        equity
    };
}

/**
 * Get Cash Flow Statement data for a given period
 * @param startDate - Start date of the period (YYYY-MM-DD)
 * @param endDate - End date of the period (YYYY-MM-DD)
 * @param projectId - Optional project ID filter
 */
export async function getCashFlowStatement(
    startDate: string,
    endDate: string,
    projectId?: string | null
) {
    const supabase = await createClient();
    const tStart = Date.now();

    // Cash account codes: 1101-1104
    const cashAccounts = ['1101', '1102', '1103', '1104'];

    // 1. Get beginning cash balance (as of day before startDate)
    const dayBeforeStart = new Date(startDate);
    dayBeforeStart.setDate(dayBeforeStart.getDate() - 1);
    const beginningDate = dayBeforeStart.toISOString().split('T')[0];

    let beginningQuery = supabase
        .from('general_ledger_view')
        .select('account_code, debit, credit')
        .in('account_code', cashAccounts)
        .lte('journal_date', beginningDate);

    if (projectId) {
        beginningQuery = beginningQuery.eq('project_id', projectId);
    }

    const { data: beginningTxns, error: beginningError } = await beginningQuery;

    if (beginningError) {
        console.error('[getCashFlowStatement] Beginning balance error:', beginningError);
        throw beginningError;
    }

    const beginningCash = (beginningTxns || []).reduce((sum, txn) => {
        return sum + (txn.debit || 0) - (txn.credit || 0);
    }, 0);

    // 2. Get all transactions in the period
    let query = supabase
        .from('general_ledger_view')
        .select('account_code, account_name, account_type, debit, credit, description, journal_date')
        .gte('journal_date', startDate)
        .lte('journal_date', endDate);

    if (projectId) {
        query = query.eq('project_id', projectId);
    }

    const { data: transactions, error } = await query;

    if (error) {
        console.error('[getCashFlowStatement] Query error:', error);
        throw error;
    }

    console.log('[perf][cash-flow] transactions fetch:', {
        count: transactions?.length || 0,
        duration_ms: Date.now() - tStart,
        period: `${startDate} to ${endDate}`,
        projectId
    });

    // 3. Categorize cash flows
    const operating = {
        receipts: [] as any[],
        payments: [] as any[],
        net: 0
    };

    const investing = {
        purchases: [] as any[],
        sales: [] as any[],
        net: 0
    };

    const financing = {
        proceeds: [] as any[],
        repayments: [] as any[],
        net: 0
    };

    // Group transactions by account for aggregation
    const accountGroups = new Map<string, {
        account_code: string;
        account_name: string;
        account_type: string;
        cashInflow: number;
        cashOutflow: number;
    }>();

    for (const txn of transactions || []) {
        const isCashAccount = cashAccounts.includes(txn.account_code);

        // We need to find the contra account (the other side of the transaction)
        // For simplicity, we'll categorize based on account type and debit/credit

        if (isCashAccount) {
            // This is a cash account transaction
            const cashChange = (txn.debit || 0) - (txn.credit || 0);

            // Skip if no cash change
            if (cashChange === 0) continue;

            // Determine category based on description or account patterns
            // This is a simplified approach - in reality, you'd need to look at the contra account

            const desc = (txn.description || '').toLowerCase();
            const isCashInflow = cashChange > 0;
            const amount = Math.abs(cashChange);

            // Categorize based on common patterns
            if (desc.includes('ค่าส่วนกลาง') || desc.includes('ค่าน้ำ') || desc.includes('ค่าไฟ') ||
                desc.includes('รายได้') || desc.includes('ค่าใช้จ่าย') || desc.includes('เงินเดือน')) {
                // Operating activity
                if (isCashInflow) {
                    operating.receipts.push({ description: txn.description, amount });
                } else {
                    operating.payments.push({ description: txn.description, amount });
                }
            } else if (desc.includes('ทรัพย์สิน') || desc.includes('อุปกรณ์')) {
                // Investing activity
                if (isCashInflow) {
                    investing.sales.push({ description: txn.description, amount });
                } else {
                    investing.purchases.push({ description: txn.description, amount });
                }
            } else if (desc.includes('กู้') || desc.includes('เงินกู้') || desc.includes('loan')) {
                // Financing activity
                if (isCashInflow) {
                    financing.proceeds.push({ description: txn.description, amount });
                } else {
                    financing.repayments.push({ description: txn.description, amount });
                }
            } else {
                // Default to operating
                if (isCashInflow) {
                    operating.receipts.push({ description: txn.description || 'เงินสดรับอื่นๆ', amount });
                } else {
                    operating.payments.push({ description: txn.description || 'เงินสดจ่ายอื่นๆ', amount });
                }
            }
        }
    }

    // Calculate nets
    operating.net = operating.receipts.reduce((sum, r) => sum + r.amount, 0) -
        operating.payments.reduce((sum, p) => sum + p.amount, 0);

    investing.net = investing.sales.reduce((sum, s) => sum + s.amount, 0) -
        investing.purchases.reduce((sum, p) => sum + p.amount, 0);

    financing.net = financing.proceeds.reduce((sum, p) => sum + p.amount, 0) -
        financing.repayments.reduce((sum, r) => sum + r.amount, 0);

    const netCashFlow = operating.net + investing.net + financing.net;

    // 4. Get ending cash balance
    let endingQuery = supabase
        .from('general_ledger_view')
        .select('account_code, debit, credit')
        .in('account_code', cashAccounts)
        .lte('journal_date', endDate);

    if (projectId) {
        endingQuery = endingQuery.eq('project_id', projectId);
    }

    const { data: endingTxns, error: endingError } = await endingQuery;

    if (endingError) {
        console.error('[getCashFlowStatement] Ending balance error:', endingError);
        throw endingError;
    }

    const endingCash = (endingTxns || []).reduce((sum, txn) => {
        return sum + (txn.debit || 0) - (txn.credit || 0);
    }, 0);

    console.log('[perf][cash-flow] calculation complete:', {
        beginningCash,
        operating: operating.net,
        investing: investing.net,
        financing: financing.net,
        netCashFlow,
        endingCash,
        balanced: Math.abs(endingCash - (beginningCash + netCashFlow)) < 0.01,
        duration_ms: Date.now() - tStart
    });

    return {
        period: { startDate, endDate },
        operating,
        investing,
        financing,
        netCashFlow,
        beginningCash,
        endingCash
    };
}

// Backfill Actions
export async function backfillRevenueGL(projectId?: string | null) {
    const supabase = await createClient()
    console.log('[backfillRevenueGL] Starting backfill...')

    // 1. Get all bills
    let query = supabase.from('bills').select('*')
    if (projectId) {
        query = query.eq('project_id', projectId)
    }
    const { data: bills, error: billsError } = await query
    if (billsError) throw billsError

    if (!bills || bills.length === 0) {
        return { success: true, count: 0, message: 'No bills found' }
    }

    // 2. Get existing GL entries for bills
    const billIds = bills.map(b => b.id)

    // Chunking for fetching existing GL
    const existingBillIds = new Set()
    const fetchChunkSize = 1000
    for (let i = 0; i < billIds.length; i += fetchChunkSize) {
        const chunk = billIds.slice(i, i + fetchChunkSize)
        const { data: existingGL, error: glError } = await supabase
            .from('general_ledger')
            .select('reference_id')
            .eq('reference_type', 'bill')
            .in('reference_id', chunk)

        if (glError) throw glError
        existingGL?.forEach(gl => existingBillIds.add(gl.reference_id))
    }

    const billsToBackfill = bills.filter(b => !existingBillIds.has(b.id))

    console.log(`[backfillRevenueGL] Found ${bills.length} bills, ${existingBillIds.size} already have GL entries. Backfilling ${billsToBackfill.length} bills.`)

    if (billsToBackfill.length === 0) {
        return { success: true, count: 0, message: 'All bills already have GL entries' }
    }

    // 3. Insert GL entries
    const glEntries = []
    for (const bill of billsToBackfill) {
        glEntries.push({
            transaction_date: bill.created_at,
            account_code: '1201', // Accounts Receivable
            debit: bill.total,
            credit: 0,
            description: `Invoice #${bill.bill_number} (Backfill)`,
            reference_type: 'bill',
            reference_id: bill.id,
            project_id: bill.project_id
        })
        glEntries.push({
            transaction_date: bill.created_at,
            account_code: '4101', // Common Fee Income
            debit: 0,
            credit: bill.total,
            description: `Income from Invoice #${bill.bill_number} (Backfill)`,
            reference_type: 'bill',
            reference_id: bill.id,
            project_id: bill.project_id
        })
    }

    // Insert in chunks of 500 (1000 entries)
    const insertChunkSize = 500
    for (let i = 0; i < glEntries.length; i += insertChunkSize) {
        const chunk = glEntries.slice(i, i + insertChunkSize)
        const { error } = await supabase.from('general_ledger').insert(chunk)
        if (error) {
            console.error('[backfillRevenueGL] Error inserting chunk:', error)
            throw error
        }
    }

    revalidatePath('/(admin)/dashboard')
    return { success: true, count: billsToBackfill.length, message: `Backfilled ${billsToBackfill.length} bills` }
}
