"use client"

import { useEffect, useState } from "react"
import { MaintenanceTimeline } from "@/lib/types/maintenance"
import { getMaintenanceTimeline } from "@/lib/actions/maintenance-actions"
import { Clock, CheckCircle, AlertCircle, Settings } from "lucide-react"
import { formatDate } from "@/lib/date-formatter"
import { useSettings } from "@/lib/settings-context"

interface MaintenanceTimelineProps {
  maintenanceRequestId: string
}

const statusIcons = {
  'new': <AlertCircle className="h-4 w-4" />,
  'in_progress': <Clock className="h-4 w-4" />,
  'preparing_materials': <Settings className="h-4 w-4" />,
  'waiting_technician': <Clock className="h-4 w-4" />,
  'fixing': <Settings className="h-4 w-4" />,
  'completed': <CheckCircle className="h-4 w-4" />,
  'cancelled': <AlertCircle className="h-4 w-4" />
}

const statusColors = {
  'new': 'text-blue-600 bg-blue-50',
  'in_progress': 'text-yellow-600 bg-yellow-50',
  'preparing_materials': 'text-purple-600 bg-purple-50',
  'waiting_technician': 'text-orange-600 bg-orange-50',
  'fixing': 'text-indigo-600 bg-indigo-50',
  'completed': 'text-green-600 bg-green-50',
  'cancelled': 'text-red-600 bg-red-50'
}

export function MaintenanceTimeline({ maintenanceRequestId }: MaintenanceTimelineProps) {
  const [timeline, setTimeline] = useState<MaintenanceTimeline[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { settings } = useSettings()

  useEffect(() => {
    loadTimeline()
  }, [maintenanceRequestId])

  const loadTimeline = async () => {
    setIsLoading(true)
    try {
      const data = await getMaintenanceTimeline(maintenanceRequestId)
      setTimeline(data)
    } catch (error) {
      console.error('Error loading timeline:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return <div className="flex items-center justify-center py-4"><Clock className="h-4 w-4 animate-spin" /></div>
  }

  if (timeline.length === 0) {
    return <div className="text-center text-sm text-muted-foreground py-4">ยังไม่มีประวัติการอัปเดต</div>
  }

  return (
    <div className="space-y-4">
      {timeline.map((item, index) => (
        <div key={item.id} className="flex gap-3">
          <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${statusColors[item.status as keyof typeof statusColors] || 'text-gray-600 bg-gray-50'}`}>
            {statusIcons[item.status as keyof typeof statusIcons] || <Clock className="h-4 w-4" />}
          </div>
          <div className="flex-1 space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm">{item.status}</span>
              <span className="text-xs text-muted-foreground">
                {formatDate(item.created_at, 'medium', settings.yearType)}
              </span>
            </div>
            {item.updated_by && (
              <p className="text-xs text-muted-foreground">โดย: {item.updated_by}</p>
            )}
            {item.notes && (
              <p className="text-sm text-muted-foreground mt-1">{item.notes}</p>
            )}
          </div>
          {index < timeline.length - 1 && (
            <div className="absolute left-4 top-12 w-px h-8 bg-border" />
          )}
        </div>
      ))}
    </div>
  )
}



















