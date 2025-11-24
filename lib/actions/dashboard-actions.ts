'use server'

import { createClient } from "@/lib/supabase/client"
import { startOfMonth, endOfMonth, subMonths, format, startOfYear } from "date-fns"
import { th } from "date-fns/locale"

export interface DashboardStats {
    totalRevenueThisMonth: number
    totalUnits: number
    paidUnitsThisMonth: number
    collectionRate: number
    totalOutstanding: number
    overdueUnits: number
    totalResidents: number
    monthlyRevenue: Array<{ month: string; revenue: number }>
    recentActivities: Array<{
        id: string
        type: 'bill' | 'payment'
        title: string
        description: string
        amount: number
        status: string
        createdAt: string
    }>
    paymentStatusBreakdown: {
        pending: number
        processing: number
        completed: number
        failed: number
    }
    // New Financial Metrics
    cashBalance: number
    netProfitYTD: number
    monthlyFinancials: Array<{
        month: string
        revenue: number
        expense: number
        profit: number
    }>
    expenseBreakdown: Array<{
        category: string
        amount: number
        color: string
    }>
}

export async function getDashboardStats(projectId?: string | null): Promise<{ success: boolean; data?: DashboardStats; error?: string }> {
    const supabase = await createClient()

    try {
        const now = new Date()
        const currentMonthStart = startOfMonth(now).toISOString()
        const currentMonthEnd = endOfMonth(now).toISOString()
        const sixMonthsAgo = subMonths(now, 6).toISOString()
        const startOfYearDate = startOfYear(now).toISOString()
        const currentMonthStr = format(now, 'yyyy-MM')

        // Define query promises
        const promises = [
            // 1. Total Units
            (async () => {
                let q = supabase.from('units').select('*', { count: 'exact', head: true }).neq('status', 'vacant')
                if (projectId) q = q.eq('project_id', projectId)
                const { count } = await q
                return count || 0
            })(),

            // 2. Total Residents
            (async () => {
                let q = supabase.from('units').select('residents').neq('status', 'vacant')
                if (projectId) q = q.eq('project_id', projectId)
                const { data } = await q
                return data?.reduce((sum, u) => sum + (parseInt(u.residents) || 0), 0) || 0
            })(),

            // 3. Revenue This Month (From Payments)
            (async () => {
                let q = supabase
                    .from('payments')
                    .select('amount')
                    .eq('status', 'completed')
                    .gte('payment_date', currentMonthStart)
                    .lte('payment_date', currentMonthEnd)

                if (projectId) {
                    q = q.select('amount, bills!inner(project_id)')
                    // @ts-ignore
                    q = q.eq('bills.project_id', projectId)
                }
                const { data } = await q
                return data?.reduce((sum, p) => sum + (Number(p.amount) || 0), 0) || 0
            })(),

            // 4. Paid Units This Month
            (async () => {
                let q = supabase
                    .from('bills')
                    .select('unit_id')
                    .eq('status', 'paid')
                    .eq('month', currentMonthStr)

                if (projectId) q = q.eq('project_id', projectId)
                const { data } = await q
                return new Set(data?.map(b => b.unit_id)).size
            })(),

            // 5. Outstanding & Overdue (Combined)
            (async () => {
                let q = supabase
                    .from('bills')
                    .select('total, unit_id')
                    .in('status', ['pending', 'unpaid'])

                if (projectId) q = q.eq('project_id', projectId)
                const { data } = await q
                const totalOutstanding = data?.reduce((sum, b) => sum + (Number(b.total) || 0), 0) || 0
                const overdueUnits = new Set(data?.map(b => b.unit_id)).size
                return { totalOutstanding, overdueUnits }
            })(),

            // 6. Monthly Revenue (Last 6 Months) - Deprecated in favor of monthlyFinancials but kept for compatibility
            (async () => {
                let q = supabase
                    .from('payments')
                    .select('amount, payment_date')
                    .eq('status', 'completed')
                    .gte('payment_date', sixMonthsAgo)

                if (projectId) {
                    q = q.select('amount, payment_date, bills!inner(project_id)')
                    // @ts-ignore
                    q = q.eq('bills.project_id', projectId)
                }
                const { data } = await q

                const monthlyRevenueMap = new Map<string, number>()
                for (let i = 5; i >= 0; i--) {
                    const d = subMonths(now, i)
                    const key = format(d, 'MMM yyyy', { locale: th })
                    monthlyRevenueMap.set(key, 0)
                }

                data?.forEach(p => {
                    if (p.payment_date) {
                        const d = new Date(p.payment_date)
                        const key = format(d, 'MMM yyyy', { locale: th })
                        if (monthlyRevenueMap.has(key)) {
                            monthlyRevenueMap.set(key, (monthlyRevenueMap.get(key) || 0) + Number(p.amount))
                        }
                    }
                })

                return Array.from(monthlyRevenueMap.entries()).map(([month, revenue]) => ({
                    month,
                    revenue
                }))
            })(),

            // 7. Recent Activities
            (async () => {
                let billsQ = supabase
                    .from('bills')
                    .select('id, bill_number, total, status, created_at, units(unit_number)')
                    .order('created_at', { ascending: false })
                    .limit(5)
                if (projectId) billsQ = billsQ.eq('project_id', projectId)

                let paymentsQ = supabase
                    .from('payments')
                    .select('id, amount, status, payment_date, created_at, reference_number')
                    .order('created_at', { ascending: false })
                    .limit(5)
                if (projectId) {
                    paymentsQ = paymentsQ.select('id, amount, status, payment_date, created_at, reference_number, bills!inner(project_id)')
                    // @ts-ignore
                    paymentsQ = paymentsQ.eq('bills.project_id', projectId)
                }

                const [billsRes, paymentsRes] = await Promise.all([billsQ, paymentsQ])

                return [
                    ...(billsRes.data || []).map((b: any) => ({
                        id: b.id,
                        type: 'bill' as const,
                        title: `บิลใหม่: ${b.units?.unit_number || 'N/A'}`,
                        description: `บิลเลขที่ ${b.bill_number}`,
                        amount: Number(b.total),
                        status: b.status,
                        createdAt: b.created_at
                    })),
                    ...(paymentsRes.data || []).map((p: any) => ({
                        id: p.id,
                        type: 'payment' as const,
                        title: `ชำระเงิน`,
                        description: `เลขที่อ้างอิง: ${p.reference_number || 'N/A'}`,
                        amount: Number(p.amount),
                        status: p.status,
                        createdAt: p.payment_date || p.created_at
                    }))
                ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 10)
            })(),

            // 8. Payment Status Breakdown
            (async () => {
                const getCount = async (status: string) => {
                    let q = supabase.from('payments').select('*', { count: 'exact', head: true }).eq('status', status)
                    if (projectId) {
                        q = q.select('id, bills!inner(project_id)')
                        // @ts-ignore
                        q = q.eq('bills.project_id', projectId)
                    }
                    const { count } = await q
                    return count || 0
                }
                const [pending, processing, completed, failed] = await Promise.all([
                    getCount('pending'),
                    getCount('processing'),
                    getCount('completed'),
                    getCount('failed')
                ])
                return { pending, processing, completed, failed }
            })(),

            // 9. Cash Balance (Assets 1101-1104)
            (async () => {
                let q = supabase
                    .from('general_ledger_view')
                    .select('debit, credit, account_code')
                    .or('account_code.like.1101%,account_code.like.1102%,account_code.like.1103%,account_code.like.1104%')

                if (projectId) q = q.eq('project_id', projectId)

                const { data } = await q

                let balance = 0
                data?.forEach(row => {
                    balance += (Number(row.debit) || 0) - (Number(row.credit) || 0)
                })

                return balance
            })(),

            // 10. Net Profit YTD (Revenue 4xxx - Expense 5xxx)
            (async () => {
                let q = supabase
                    .from('general_ledger_view')
                    .select('debit, credit, account_code')
                    .gte('journal_date', startOfYearDate)
                    .or('account_code.like.4%,account_code.like.5%')

                if (projectId) q = q.eq('project_id', projectId)

                const { data } = await q

                let revenue = 0
                let expense = 0

                data?.forEach(row => {
                    const amount = (Number(row.debit) || 0) - (Number(row.credit) || 0)
                    if (row.account_code.startsWith('4')) {
                        // Revenue: Credit is positive, so we invert the debit-credit
                        revenue += -amount
                    } else if (row.account_code.startsWith('5')) {
                        // Expense: Debit is positive
                        expense += amount
                    }
                })

                return revenue - expense
            })(),

            // 11. Monthly Financials (Revenue vs Expense Last 6 Months)
            (async () => {
                let q = supabase
                    .from('general_ledger_view')
                    .select('debit, credit, account_code, journal_date')
                    .gte('journal_date', sixMonthsAgo)
                    .or('account_code.like.4%,account_code.like.5%')

                if (projectId) q = q.eq('project_id', projectId)

                const { data } = await q

                const monthlyMap = new Map<string, { revenue: number, expense: number }>()

                // Initialize map
                for (let i = 5; i >= 0; i--) {
                    const d = subMonths(now, i)
                    const key = format(d, 'MMM yyyy', { locale: th })
                    monthlyMap.set(key, { revenue: 0, expense: 0 })
                }

                data?.forEach(row => {
                    if (row.journal_date) {
                        const d = new Date(row.journal_date)
                        const key = format(d, 'MMM yyyy', { locale: th })

                        if (monthlyMap.has(key)) {
                            const current = monthlyMap.get(key)!
                            const amount = (Number(row.debit) || 0) - (Number(row.credit) || 0)

                            if (row.account_code.startsWith('4')) {
                                current.revenue += -amount
                            } else if (row.account_code.startsWith('5')) {
                                current.expense += amount
                            }
                        }
                    }
                })

                return Array.from(monthlyMap.entries()).map(([month, val]) => ({
                    month,
                    revenue: val.revenue,
                    expense: val.expense,
                    profit: val.revenue - val.expense
                }))
            })(),

            // 12. Expense Breakdown (Top 5 Categories This Month)
            (async () => {
                let q = supabase
                    .from('general_ledger_view')
                    .select('debit, credit, account_code, account_name')
                    .gte('journal_date', currentMonthStart)
                    .lte('journal_date', currentMonthEnd)
                    .like('account_code', '5%')

                if (projectId) q = q.eq('project_id', projectId)

                const { data } = await q

                const expenseMap = new Map<string, number>()

                data?.forEach(row => {
                    const amount = (Number(row.debit) || 0) - (Number(row.credit) || 0)
                    if (amount > 0) {
                        const category = row.account_name || 'ค่าใช้จ่ายอื่นๆ'
                        expenseMap.set(category, (expenseMap.get(category) || 0) + amount)
                    }
                })

                // Sort by amount desc and take top 5
                const sorted = Array.from(expenseMap.entries())
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 5)

                const colors = ['#EF4444', '#F97316', '#F59E0B', '#84CC16', '#10B981']

                return sorted.map(([category, amount], index) => ({
                    category,
                    amount,
                    color: colors[index % colors.length]
                }))
            })()

        ] as const

        // Execute all queries in parallel
        console.time('[getDashboardStats] Queries Duration')
        const [
            totalUnits,
            totalResidents,
            totalRevenueThisMonth,
            paidUnitsThisMonth,
            outstandingData,
            monthlyRevenue,
            recentActivities,
            paymentStatusBreakdown,
            cashBalance,
            netProfitYTD,
            monthlyFinancials,
            expenseBreakdown
        ] = await Promise.all(promises)
        console.timeEnd('[getDashboardStats] Queries Duration')

        const collectionRate = totalUnits > 0 ? (paidUnitsThisMonth / totalUnits) * 100 : 0

        return {
            success: true,
            data: {
                totalRevenueThisMonth,
                totalUnits,
                paidUnitsThisMonth,
                collectionRate,
                totalOutstanding: outstandingData.totalOutstanding,
                overdueUnits: outstandingData.overdueUnits,
                totalResidents,
                monthlyRevenue,
                recentActivities,
                paymentStatusBreakdown,
                cashBalance,
                netProfitYTD,
                monthlyFinancials,
                expenseBreakdown
            }
        }

    } catch (error: any) {
        console.error('Error in getDashboardStats:', error)
        return { success: false, error: error.message }
    }
}
