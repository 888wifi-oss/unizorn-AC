"use server"

import { createClient } from "@/lib/supabase/server"
import { ParcelReport } from "@/lib/types/parcel"

// Get parcel reports for a specific date range
export async function getParcelReports(startDate: string, endDate: string) {
  const supabase = await createClient()
  
  try {
    // Get parcels in date range
    const { data: parcels, error } = await supabase
      .from('parcels')
      .select('*')
      .gte('received_at', startDate)
      .lte('received_at', endDate)
      .order('received_at', { ascending: false })

    if (error) {
      throw new Error(`Failed to fetch parcels: ${error.message}`)
    }

    // Calculate statistics
    const totalParcels = parcels?.length || 0
    const pendingParcels = parcels?.filter(p => p.status === 'pending').length || 0
    const deliveredParcels = parcels?.filter(p => p.status === 'delivered').length || 0
    const pickedUpParcels = parcels?.filter(p => p.status === 'picked_up').length || 0
    const expiredParcels = parcels?.filter(p => p.status === 'expired').length || 0

    // Get top courier companies
    const courierStats = parcels?.reduce((acc: any, parcel) => {
      const company = parcel.courier_company
      acc[company] = (acc[company] || 0) + 1
      return acc
    }, {}) || {}

    const topCourierCompanies = Object.entries(courierStats)
      .map(([company, count]) => ({ company, count: count as number }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)

    // Get top units
    const unitStats = parcels?.reduce((acc: any, parcel) => {
      const unit = parcel.unit_number
      acc[unit] = (acc[unit] || 0) + 1
      return acc
    }, {}) || {}

    const topUnits = Object.entries(unitStats)
      .map(([unit_number, count]) => ({ unit_number, count: count as number }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    const report: ParcelReport = {
      date: `${startDate} - ${endDate}`,
      total_parcels: totalParcels,
      pending_parcels: pendingParcels,
      delivered_parcels: deliveredParcels,
      picked_up_parcels: pickedUpParcels,
      expired_parcels: expiredParcels,
      top_courier_companies: topCourierCompanies,
      top_units: topUnits
    }

    return { success: true, report }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// Get daily parcel statistics
export async function getDailyParcelStats(days: number = 30) {
  const supabase = await createClient()
  
  try {
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const { data: parcels, error } = await supabase
      .from('parcels')
      .select('received_at, status')
      .gte('received_at', startDate.toISOString())
      .lte('received_at', endDate.toISOString())

    if (error) {
      throw new Error(`Failed to fetch parcels: ${error.message}`)
    }

    // Group by date
    const dailyStats = parcels?.reduce((acc: any, parcel) => {
      const date = new Date(parcel.received_at).toISOString().split('T')[0]
      if (!acc[date]) {
        acc[date] = {
          date,
          total: 0,
          pending: 0,
          delivered: 0,
          picked_up: 0,
          expired: 0
        }
      }
      acc[date].total++
      acc[date][parcel.status]++
      return acc
    }, {}) || {}

    const dailyArray = Object.values(dailyStats).sort((a: any, b: any) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    )

    return { success: true, dailyStats: dailyArray }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// Get overdue parcels (more than 7 days)
export async function getOverdueParcels() {
  const supabase = await createClient()
  
  try {
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const { data: parcels, error } = await supabase
      .from('parcels')
      .select('*')
      .eq('status', 'pending')
      .lt('received_at', sevenDaysAgo.toISOString())
      .order('received_at', { ascending: true })

    if (error) {
      throw new Error(`Failed to fetch overdue parcels: ${error.message}`)
    }

    return { success: true, parcels: parcels || [] }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// Get parcel efficiency metrics
export async function getParcelEfficiencyMetrics() {
  const supabase = await createClient()
  
  try {
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const { data: parcels, error } = await supabase
      .from('parcels')
      .select('received_at, picked_up_at, status')
      .gte('received_at', thirtyDaysAgo.toISOString())

    if (error) {
      throw new Error(`Failed to fetch parcels: ${error.message}`)
    }

    const totalParcels = parcels?.length || 0
    const pickedUpParcels = parcels?.filter(p => p.status === 'picked_up').length || 0
    const expiredParcels = parcels?.filter(p => p.status === 'expired').length || 0

    // Calculate average pickup time
    const pickupTimes = parcels
      ?.filter(p => p.picked_up_at)
      .map(p => {
        const received = new Date(p.received_at)
        const pickedUp = new Date(p.picked_up_at!)
        return (pickedUp.getTime() - received.getTime()) / (1000 * 60 * 60 * 24) // days
      }) || []

    const avgPickupTime = pickupTimes.length > 0 
      ? pickupTimes.reduce((sum, time) => sum + time, 0) / pickupTimes.length 
      : 0

    const pickupRate = totalParcels > 0 ? (pickedUpParcels / totalParcels) * 100 : 0
    const expiryRate = totalParcels > 0 ? (expiredParcels / totalParcels) * 100 : 0

    return {
      success: true,
      metrics: {
        total_parcels: totalParcels,
        pickup_rate: Math.round(pickupRate * 100) / 100,
        expiry_rate: Math.round(expiryRate * 100) / 100,
        avg_pickup_time_days: Math.round(avgPickupTime * 100) / 100,
        overdue_count: parcels?.filter(p => {
          const received = new Date(p.received_at)
          const daysSinceReceived = (Date.now() - received.getTime()) / (1000 * 60 * 60 * 24)
          return p.status === 'pending' && daysSinceReceived > 7
        }).length || 0
      }
    }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}
