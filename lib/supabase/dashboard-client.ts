import { createClient } from "@/lib/supabase/client"

export interface DashboardData {
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
}

export async function getDashboardDataClient(projectId?: string | null): Promise<DashboardData> {
  try {
    const supabase = createClient()
    const tAllStart = Date.now()

    const today = new Date()
    const currentMonth = today.getMonth() + 1
    const currentYear = today.getFullYear()
    const currentMonthStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}`

    // Helper: apply project filter AFTER select to avoid calling eq() on PostgrestQueryBuilder
    const applyProjectFilter = <T>(query: any): any => {
      if (projectId) {
        return query.eq('project_id', projectId)
      }
      return query
    }

    const qStart = Date.now()
    const [
      unitsResult,
      allBillsResult,
      recentBillsResult,
      residentsResult,
      revenueJournalResult
    ] = await Promise.all([
      applyProjectFilter(supabase.from('units').select('*', { count: 'exact', head: true })).neq('status', 'vacant'),
      applyProjectFilter(
        supabase
          .from('bills')
          .select('id, unit_id, total, status, month')
          .gte('month', `${currentYear - 1}-01`)
          .order('created_at', { ascending: false })
          .limit(2000)
      ),
      applyProjectFilter(
        supabase
          .from('bills')
          .select('id, bill_number, total, status, created_at, units(unit_number)')
          .order('created_at', { ascending: false })
          .limit(5)
      ),
      applyProjectFilter(supabase.from('units').select('residents')).neq('status', 'vacant'),
      applyProjectFilter(
        supabase
          .from('revenue_journal')
          .select('journal_date, amount')
          .gte('journal_date', `${currentYear}-${String(Math.max(1, currentMonth - 6)).padStart(2,'0')}-01`)
          .order('journal_date', { ascending: false })
      )
    ])
    console.log(`[perf] Dashboard parallel queries: ${Date.now() - qStart}ms`)

    const totalUnitsCount = unitsResult.count || 0
    const allBills = allBillsResult.data || []
    const recentBills = recentBillsResult.data || []
    const residentsData = residentsResult.data || []
    
    const billIds: string[] = allBills.map((b: any) => b.id)
    let paymentsForBills: any[] = []
    if (billIds.length > 0) {
      const pStart = Date.now()
      const paymentsRes = await supabase
        .from('payments')
        .select('id, amount, status, payment_date, reference_number, created_at, bill_id')
        .in('bill_id', billIds)
        .order('created_at', { ascending: false })
        .limit(2000)
      paymentsForBills = paymentsRes.data || []
      console.log(`[perf] Payments query (${billIds.length} bills -> ${paymentsForBills.length} payments): ${Date.now() - pStart}ms`)
    }

    const currentMonthBills = allBills.filter((b: any) => b.month === currentMonthStr)
    const outstandingBills = allBills.filter((b: any) => ['pending', 'unpaid'].includes(b.status))
    const billsMap = new Map(allBills.map((b: any) => [b.id, b]))

    const totalUnits = totalUnitsCount

    // Prefer revenue from revenue_journal if available; otherwise fallback to payments
    const revenueJournal = revenueJournalResult.data || []
    const totalRevenueThisMonth = revenueJournal.length > 0
      ? revenueJournal
          .filter((r: any) => {
            const d = new Date(r.journal_date)
            return d.getMonth() + 1 === currentMonth && d.getFullYear() === currentYear
          })
          .reduce((sum: number, r: any) => sum + (parseFloat(r.amount) || 0), 0)
      : paymentsForBills
          .filter((p: any) => p.status === 'completed')
          .filter((p: any) => {
            const bill = billsMap.get(p.bill_id)
            if (bill?.month === currentMonthStr) return true
            if (p.payment_date) {
              const paidDate = new Date(p.payment_date)
              return paidDate.getMonth() + 1 === currentMonth && paidDate.getFullYear() === currentYear
            }
            return false
          })
          .reduce((sum: number, p: any) => sum + (parseFloat(p.amount) || 0), 0)

    const paidBills = currentMonthBills.filter((b: any) => b.status === 'paid')
    const paidUnitsThisMonth = new Set(paidBills.map((b: any) => b.unit_id)).size

    const totalOutstanding = outstandingBills.reduce((sum: number, b: any) => sum + (parseFloat(b.total) || 0), 0)
    const overdueUnits = new Set(outstandingBills.map((b: any) => b.unit_id)).size

    const collectionRate = totalUnits > 0 ? (paidUnitsThisMonth / totalUnits) * 100 : 0

    const totalResidents = residentsData.reduce((sum: number, u: any) => sum + (parseInt(u.residents) || 0), 0)

    const monthlyRevenue: Array<{ month: string; revenue: number }> = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date(currentYear, currentMonth - 1 - i, 1)
      const monthStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      let monthRevenue = 0
      if (revenueJournal.length > 0) {
        const rMonthRevenue = revenueJournal
          .filter((r: any) => {
            const rd = new Date(r.journal_date)
            return rd.getMonth() + 1 === d.getMonth() + 1 && rd.getFullYear() === d.getFullYear()
          })
          .reduce((sum: number, r: any) => sum + (parseFloat(r.amount) || 0), 0)
        monthRevenue = rMonthRevenue
      } else {
        const monthPayments = paymentsForBills
          .filter((p: any) => p.status === 'completed')
          .filter((p: any) => {
            const bill = billsMap.get(p.bill_id)
            if (bill?.month === monthStr) return true
            if (p.payment_date) {
              const paidDate = new Date(p.payment_date)
              return paidDate.getMonth() + 1 === d.getMonth() + 1 && paidDate.getFullYear() === d.getFullYear()
            }
            return false
          })
        monthRevenue = monthPayments.reduce((sum: number, p: any) => sum + (parseFloat(p.amount) || 0), 0)
      }
      monthlyRevenue.push({
        month: d.toLocaleDateString('th-TH', { month: 'short', year: 'numeric' }),
        revenue: monthRevenue
      })
    }

    const recentPayments = paymentsForBills
      .slice(0, 5)

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
      .slice(0, 10)

    const paymentStatusBreakdown = {
      pending: paymentsForBills.filter((p: any) => p.status === 'pending').length,
      processing: paymentsForBills.filter((p: any) => p.status === 'processing').length,
      completed: paymentsForBills.filter((p: any) => p.status === 'completed').length,
      failed: paymentsForBills.filter((p: any) => p.status === 'failed').length,
    }

    console.log('[perf] Dashboard data sizes:', {
      unitsCount: totalUnitsCount,
      billsCount: allBills.length,
      paymentsCount: paymentsForBills.length,
      revenueJournalCount: (revenueJournalResult.data || []).length
    })
    console.log(`[perf] Dashboard total compute time: ${Date.now() - tAllStart}ms`)

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
      paymentStatusBreakdown,
    }
  } catch (error) {
    console.error('[getDashboardDataClient] Error:', error)
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
        failed: 0,
      },
    }
  }
}
