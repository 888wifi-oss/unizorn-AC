export interface AnalyticsData {
  // Financial Analytics
  financial: {
    totalRevenue: number
    totalExpenses: number
    netProfit: number
    monthlyRevenue: Array<{ month: string; amount: number }>
    monthlyExpenses: Array<{ month: string; amount: number }>
    revenueByUnit: Array<{ unit: string; amount: number }>
    expenseCategories: Array<{ category: string; amount: number }>
  }
  
  // Unit Analytics
  units: {
    totalUnits: number
    occupiedUnits: number
    vacantUnits: number
    maintenanceUnits: number
    occupancyRate: number
    unitsByFloor: Array<{ floor: string; count: number }>
    unitsByStatus: Array<{ status: string; count: number }>
  }
  
  // Parcel Analytics
  parcels: {
    totalParcels: number
    pendingParcels: number
    pickedUpParcels: number
    overdueParcels: number
    parcelsByMonth: Array<{ month: string; count: number }>
    topReceivingUnits: Array<{ unit: string; count: number }>
    topCouriers: Array<{ courier: string; count: number }>
    averagePickupTime: number // in hours
  }
  
  // Maintenance Analytics
  maintenance: {
    totalRequests: number
    pendingRequests: number
    completedRequests: number
    averageResolutionTime: number // in days
    requestsByCategory: Array<{ category: string; count: number }>
    requestsByMonth: Array<{ month: string; count: number }>
  }
  
  // Notification Analytics
  notifications: {
    totalNotifications: number
    unreadNotifications: number
    notificationsByType: Array<{ type: string; count: number }>
    notificationsByMonth: Array<{ month: string; count: number }>
  }
}
