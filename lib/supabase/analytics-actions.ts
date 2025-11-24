"use server"

import { createClient } from "@/lib/supabase/server"
import { AnalyticsData } from "@/lib/types/analytics"

export async function getAdvancedAnalytics(projectId?: string | null, restrictToProject?: boolean): Promise<{ success: boolean; data?: AnalyticsData; error?: string }> {
  const supabase = await createClient()

  try {
    const tStart = Date.now()
    console.log('[perf][analytics] Fetching advanced analytics...', { projectId, restrictToProject })

    // Get all data in parallel
    const [
      billsResult,
      unitsResult,
      parcelsResult,
      maintenanceResult,
      notificationsResult,
      expensesResult
    ] = await Promise.all([
      (async () => {
        // Safer query for bills, avoiding strict !inner join if possible, or handling it
        let q = supabase
          .from('bills')
          .select('id, total, created_at, unit_id, month, year, status, units!inner(project_id)')

        if (projectId) {
          q = q.eq('units.project_id', projectId as string)
        }

        const ts = Date.now();
        const res = await q;
        console.log('[perf][analytics] bills fetch:', { count: res.data?.length || 0, duration_ms: Date.now() - ts, filtered: !!projectId })
        return res
      })(),
      (async () => {
        let q = supabase
          .from('units')
          .select('id, unit_number, status, floor, project_id, created_at')
        if (projectId) {
          q = q.eq('project_id', projectId as string)
        }
        const ts = Date.now();
        const res = await q;
        console.log('[perf][analytics] units fetch:', { count: res.data?.length || 0, duration_ms: Date.now() - ts, filtered: !!projectId })
        return res
      })(),
      (async () => {
        try {
          let q = supabase
            .from('parcels')
            .select('id, unit_number, status, received_at, picked_up_at, courier_company, project_id, created_at')
          if (projectId) {
            q = q.eq('project_id', projectId as string)
          }
          const ts = Date.now();
          const res = await q;
          console.log('[perf][analytics] parcels fetch:', { count: res.data?.length || 0, duration_ms: Date.now() - ts, filtered: !!projectId })
          return res
        } catch (e) {
          console.warn('[analytics] parcels table might be missing', e);
          return { data: [], error: null };
        }
      })(),
      (async () => {
        let q = supabase
          .from('maintenance_requests')
          .select('id, status, created_at, completed_at, category, project_id')
        if (projectId) {
          q = q.eq('project_id', projectId as string)
        }
        const ts = Date.now();
        const res = await q;
        console.log('[perf][analytics] maintenance fetch:', { count: res.data?.length || 0, duration_ms: Date.now() - ts, filtered: !!projectId })
        return res
      })(),
      (async () => {
        try {
          const ts = Date.now();
          const res = await supabase
            .from('notifications')
            .select('id, is_read, type, created_at')
          console.log('[perf][analytics] notifications fetch:', { count: res.data?.length || 0, duration_ms: Date.now() - ts })
          return res
        } catch (e) {
          console.warn('[analytics] notifications table might be missing', e);
          return { data: [], error: null };
        }
      })(),
      (async () => {
        try {
          let q = supabase.from('expense_journal').select('id, amount, journal_date, account_code, project_id')
          if (projectId) {
            q = q.eq('project_id', projectId)
          }
          const ts = Date.now();
          const res = await q;
          console.log('[perf][analytics] expenses fetch:', { count: res.data?.length || 0, duration_ms: Date.now() - ts })
          return res
        } catch (e) {
          console.warn('[analytics] expense_journal table might be missing', e);
          return { data: [], error: null };
        }
      })()
    ])

    // Check for critical errors (bills, units)
    const criticalErrors = [billsResult.error, unitsResult.error].filter(Boolean)

    if (criticalErrors.length > 0) {
      console.error('Analytics fetch critical errors:', criticalErrors)
      return { success: false, error: `Failed to fetch core data: ${criticalErrors[0]?.message}` }
    }

    const bills = billsResult.data || []
    const units = unitsResult.data || []
    const parcels = parcelsResult.data || []
    const maintenance = maintenanceResult.data || []
    const notifications = notificationsResult.data || []
    const expenses = expensesResult.data || []

    // Calculate financial analytics
    const totalRevenue = bills.reduce((sum, bill) => sum + (bill.total || 0), 0)
    const totalExpenses = expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0)
    const netProfit = totalRevenue - totalExpenses

    // Monthly revenue (last 12 months)
    const monthlyRevenue = calculateMonthlyData(bills, 'total', 12)
    // Monthly expenses
    const monthlyExpenses = calculateMonthlyData(expenses.map(e => ({ ...e, created_at: e.journal_date })), 'amount', 12)

    // Revenue by unit
    const revenueByUnit = bills.reduce((acc: any[], bill) => {
      const unitNumber = bill.unit_id ? units.find(u => u.id === bill.unit_id)?.unit_number : 'ไม่ระบุ'
      const existing = acc.find(item => item.unit === unitNumber)
      if (existing) {
        existing.amount += bill.total || 0
      } else {
        acc.push({ unit: unitNumber, amount: bill.total || 0 })
      }
      return acc
    }, []).sort((a, b) => b.amount - a.amount).slice(0, 10)

    // Expense categories
    const expenseCategories = expenses.reduce((acc: any[], exp) => {
      const category = exp.account_code || 'ไม่ระบุ'
      const existing = acc.find(item => item.category === category)
      if (existing) {
        existing.amount += exp.amount || 0
      } else {
        acc.push({ category, amount: exp.amount || 0 })
      }
      return acc
    }, []).sort((a, b) => b.amount - a.amount).slice(0, 10)

    // Unit analytics
    const totalUnits = units.length
    const occupiedUnits = units.filter(u => u.status === 'occupied').length
    const vacantUnits = units.filter(u => u.status === 'vacant').length
    const maintenanceUnits = units.filter(u => u.status === 'maintenance').length
    const occupancyRate = totalUnits > 0 ? (occupiedUnits / totalUnits) * 100 : 0

    // Units by floor
    const unitsByFloor = units.reduce((acc: any[], unit) => {
      const floor = unit.floor || 'ไม่ระบุ'
      const existing = acc.find(item => item.floor === floor)
      if (existing) {
        existing.count += 1
      } else {
        acc.push({ floor, count: 1 })
      }
      return acc
    }, []).sort((a, b) => b.count - a.count)

    // Units by status
    const unitsByStatus = [
      { status: 'occupied', count: occupiedUnits },
      { status: 'vacant', count: vacantUnits },
      { status: 'maintenance', count: maintenanceUnits }
    ]

    // Parcel analytics
    const totalParcels = parcels.length
    const pendingParcels = parcels.filter(p => p.status === 'pending').length
    const pickedUpParcels = parcels.filter(p => p.status === 'picked_up').length
    const overdueParcels = parcels.filter(p => {
      const receivedDate = new Date(p.received_at)
      const daysDiff = (Date.now() - receivedDate.getTime()) / (1000 * 60 * 60 * 24)
      return daysDiff > 3 && p.status === 'pending'
    }).length

    const parcelsByMonth = calculateMonthlyData(parcels, 'count', 12)

    // Top receiving units
    const topReceivingUnits = parcels.reduce((acc: any[], parcel) => {
      const existing = acc.find(item => item.unit === parcel.unit_number)
      if (existing) {
        existing.count += 1
      } else {
        acc.push({ unit: parcel.unit_number, count: 1 })
      }
      return acc
    }, []).sort((a, b) => b.count - a.count).slice(0, 10)

    // Top couriers
    const topCouriers = parcels.reduce((acc: any[], parcel) => {
      const courier = parcel.courier_company || 'ไม่ระบุ'
      const existing = acc.find(item => item.courier === courier)
      if (existing) {
        existing.count += 1
      } else {
        acc.push({ courier, count: 1 })
      }
      return acc
    }, []).sort((a, b) => b.count - a.count).slice(0, 10)

    // Average pickup time
    const pickedUpParcelsWithTime = parcels.filter(p => p.status === 'picked_up' && p.picked_up_at)
    const averagePickupTime = pickedUpParcelsWithTime.length > 0
      ? pickedUpParcelsWithTime.reduce((sum, parcel) => {
        const receivedDate = new Date(parcel.received_at)
        const pickedUpDate = new Date(parcel.picked_up_at)
        const hoursDiff = (pickedUpDate.getTime() - receivedDate.getTime()) / (1000 * 60 * 60)
        return sum + hoursDiff
      }, 0) / pickedUpParcelsWithTime.length
      : 0

    // Maintenance analytics
    const totalRequests = maintenance.length
    const pendingRequests = maintenance.filter(m => m.status === 'pending').length
    const completedRequests = maintenance.filter(m => m.status === 'completed').length

    // Average resolution time
    const completedWithTime = maintenance.filter(m => m.status === 'completed' && m.completed_at)
    const averageResolutionTime = completedWithTime.length > 0
      ? completedWithTime.reduce((sum, request) => {
        const createdDate = new Date(request.created_at)
        const completedDate = new Date(request.completed_at)
        const daysDiff = (completedDate.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24)
        return sum + daysDiff
      }, 0) / completedWithTime.length
      : 0

    // Requests by category
    const requestsByCategory = maintenance.reduce((acc: any[], request) => {
      const category = request.category || 'อื่นๆ'
      const existing = acc.find(item => item.category === category)
      if (existing) {
        existing.count += 1
      } else {
        acc.push({ category, count: 1 })
      }
      return acc
    }, []).sort((a, b) => b.count - a.count)

    const requestsByMonth = calculateMonthlyData(maintenance, 'count', 12)

    // Notification analytics
    const totalNotifications = notifications.length
    const unreadNotifications = notifications.filter(n => !n.is_read).length

    const notificationsByType = notifications.reduce((acc: any[], notification) => {
      const type = notification.type || 'อื่นๆ'
      const existing = acc.find(item => item.type === type)
      if (existing) {
        existing.count += 1
      } else {
        acc.push({ type, count: 1 })
      }
      return acc
    }, []).sort((a, b) => b.count - a.count)

    const notificationsByMonth = calculateMonthlyData(notifications, 'count', 12)

    const analyticsData: AnalyticsData = {
      financial: {
        totalRevenue,
        totalExpenses,
        netProfit,
        monthlyRevenue,
        monthlyExpenses,
        revenueByUnit,
        expenseCategories
      },
      units: {
        totalUnits,
        occupiedUnits,
        vacantUnits,
        maintenanceUnits,
        occupancyRate,
        unitsByFloor,
        unitsByStatus
      },
      parcels: {
        totalParcels,
        pendingParcels,
        pickedUpParcels,
        overdueParcels,
        parcelsByMonth,
        topReceivingUnits,
        topCouriers,
        averagePickupTime
      },
      maintenance: {
        totalRequests,
        pendingRequests,
        completedRequests,
        averageResolutionTime,
        requestsByCategory,
        requestsByMonth
      },
      notifications: {
        totalNotifications,
        unreadNotifications,
        notificationsByType,
        notificationsByMonth
      }
    }

    console.log('[perf][analytics] Analytics data calculated successfully')
    console.log('[perf][analytics] total compute time:', { duration_ms: Date.now() - tStart })
    return { success: true, data: analyticsData }

  } catch (error: any) {
    console.error('Error calculating analytics:', error)
    return { success: false, error: error.message }
  }
}

// Helper function to calculate monthly data
function calculateMonthlyData(data: any[], valueField: string, months: number) {
  const monthlyData: Array<{ month: string; amount?: number; count?: number }> = []
  const now = new Date()

  for (let i = months - 1; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const monthKey = date.toLocaleDateString('th-TH', { year: 'numeric', month: 'short' })

    const monthData = data.filter(item => {
      const itemDate = new Date(item.created_at || item.received_at || item.month)
      return itemDate.getFullYear() === date.getFullYear() &&
        itemDate.getMonth() === date.getMonth()
    })

    if (valueField === 'amount') {
      const amount = monthData.reduce((sum, item) => sum + (item[valueField] || 0), 0)
      monthlyData.push({ month: monthKey, amount })
    } else {
      monthlyData.push({ month: monthKey, count: monthData.length })
    }
  }

  return monthlyData
}
