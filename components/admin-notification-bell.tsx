"use client"

import { useState, useEffect } from "react"
import { Bell, Check, X, AlertCircle, Info, CheckCircle, Wrench, Megaphone, Upload, FileCheck, XCircle, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { getAdminNotifications, markNotificationAsRead, markAllAdminNotificationsAsRead, deleteNotification } from "@/lib/supabase/notification-actions"
import { useToast } from "@/hooks/use-toast"
import { formatDate } from "@/lib/date-formatter"
import type { Notification, NotificationType } from "@/lib/types/notification"
import { useProjectContext } from "@/lib/contexts/project-context"

interface AdminNotificationBellProps {
  className?: string
}

const notificationIcons: Partial<Record<NotificationType, React.ComponentType<{ className?: string }>>> = {
  payment_due: AlertCircle,
  payment_received: CheckCircle,
  payment_uploaded: Upload,
  payment_confirmed: FileCheck,
  payment_rejected: XCircle,
  payment_pending_review: Clock,
  maintenance_update: Wrench,
  announcement: Megaphone,
  bill_generated: Info
}

const notificationColors: Partial<Record<NotificationType, string>> = {
  payment_due: "text-red-500",
  payment_received: "text-green-500",
  payment_uploaded: "text-blue-500",
  payment_confirmed: "text-green-600",
  payment_rejected: "text-red-600",
  payment_pending_review: "text-yellow-500",
  maintenance_update: "text-blue-500",
  announcement: "text-purple-500",
  bill_generated: "text-orange-500"
}

export function AdminNotificationBell({ className }: AdminNotificationBellProps) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const { toast } = useToast()
  const { selectedProjectId } = useProjectContext()

  const loadUnreadCount = async () => {
    try {
      const { getUnreadAdminNotificationCount } = await import("@/lib/supabase/notification-actions")
      const result = await getUnreadAdminNotificationCount(selectedProjectId)
      if (result.success && typeof result.count === 'number') {
        setUnreadCount(result.count)
      }
    } catch (error) {
      console.error("Error loading unread count:", error)
    }
  }

  const loadNotifications = async (pageNum: number = 1, append: boolean = false) => {
    if (isLoading) return
    setIsLoading(true)
    try {
      const t0 = typeof performance !== 'undefined' ? performance.now() : Date.now()
      const result = await getAdminNotifications(selectedProjectId, pageNum, 20)

      if (result.success && result.notifications) {
        const newNotifications = result.notifications || []
        if (append) {
          setNotifications(prev => [...prev, ...newNotifications])
        } else {
          setNotifications(newNotifications)
        }

        // Check if we have more
        setHasMore(newNotifications.length === 20)

        const t1 = typeof performance !== 'undefined' ? performance.now() : Date.now()
        console.log(`[perf] AdminNotificationBell fetch (page ${pageNum}, ${newNotifications.length} items) in ${Math.round(t1 - t0)}ms`)
      } else {
        console.error("[Admin Notification] Error loading:", result.error)
      }
    } catch (error) {
      console.error("[perf] AdminNotificationBell error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadUnreadCount()
    loadNotifications(1, false)

    // Refresh every 60 seconds (reduced frequency)
    const interval = setInterval(() => {
      if (!isLoading && !isOpen) {
        loadUnreadCount()
        // Only refresh list if we are on page 1
        if (page === 1) {
          loadNotifications(1, false)
        }
      }
    }, 60000)
    return () => clearInterval(interval)
  }, [selectedProjectId])

  const handleLoadMore = () => {
    if (!isLoading && hasMore) {
      const nextPage = page + 1
      setPage(nextPage)
      loadNotifications(nextPage, true)
    }
  }

  const handleMarkAsRead = async (notificationId: string) => {
    // Optimistic update
    const previousNotifications = [...notifications]
    const previousUnreadCount = unreadCount

    setNotifications(prev =>
      prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
    )
    setUnreadCount(prev => Math.max(0, prev - 1))

    try {
      const result = await markNotificationAsRead(notificationId)
      if (!result.success) {
        // Revert on failure
        setNotifications(previousNotifications)
        setUnreadCount(previousUnreadCount)
        console.error("Failed to mark as read:", result.error)
      }
    } catch (error) {
      // Revert on error
      setNotifications(previousNotifications)
      setUnreadCount(previousUnreadCount)
      console.error("Error marking notification as read:", error)
    }
  }

  const handleMarkAllAsRead = async () => {
    // Optimistic update
    const previousNotifications = [...notifications]
    const previousUnreadCount = unreadCount

    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
    setUnreadCount(0)
    toast({
      title: "สำเร็จ",
      description: "ทำเครื่องหมายการแจ้งเตือนทั้งหมดเป็นอ่านแล้ว"
    })

    try {
      const result = await markAllAdminNotificationsAsRead(selectedProjectId)
      if (!result.success) {
        // Revert on failure
        setNotifications(previousNotifications)
        setUnreadCount(previousUnreadCount)
        toast({
          title: "เกิดข้อผิดพลาด",
          description: "ไม่สามารถทำรายการได้",
          variant: "destructive"
        })
      }
    } catch (error) {
      // Revert on error
      setNotifications(previousNotifications)
      setUnreadCount(previousUnreadCount)
      console.error("Error marking all notifications as read:", error)
    }
  }

  const handleDeleteNotification = async (notificationId: string) => {
    // Optimistic update
    const previousNotifications = [...notifications]
    const previousUnreadCount = unreadCount
    const notificationToDelete = notifications.find(n => n.id === notificationId)

    setNotifications(prev => prev.filter(n => n.id !== notificationId))
    if (notificationToDelete && !notificationToDelete.is_read) {
      setUnreadCount(prev => Math.max(0, prev - 1))
    }

    try {
      const result = await deleteNotification(notificationId)
      if (!result.success) {
        // Revert on failure
        setNotifications(previousNotifications)
        setUnreadCount(previousUnreadCount)
        console.error("Failed to delete notification:", result.error)
      }
    } catch (error) {
      // Revert on error
      setNotifications(previousNotifications)
      setUnreadCount(previousUnreadCount)
      console.error("Error deleting notification:", error)
    }
  }

  const getNotificationIcon = (type: NotificationType) => {
    const IconComponent = notificationIcons[type]
    if (!IconComponent) {
      return <Info className={`h-4 w-4 ${notificationColors[type] || 'text-gray-500'}`} />
    }
    return <IconComponent className={`h-4 w-4 ${notificationColors[type] || 'text-gray-500'}`} />
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className={`relative ${className}`}>
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-80 p-0">
        <Card className="border-0 shadow-none">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">การแจ้งเตือน</CardTitle>
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleMarkAllAsRead}
                  className="h-6 px-2 text-xs"
                >
                  <Check className="h-3 w-3 mr-1" />
                  อ่านทั้งหมด
                </Button>
              )}
            </div>
          </CardHeader>

          <Separator />

          <CardContent className="p-0">
            <ScrollArea className="h-80">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                </div>
              ) : notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                  <Bell className="h-8 w-8 mb-2" />
                  <p className="text-sm">ไม่มีการแจ้งเตือน</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-3 hover:bg-muted/50 transition-colors ${!notification.is_read ? 'bg-blue-50/50 border-l-2 border-l-blue-500' : ''
                        }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5">
                          {getNotificationIcon(notification.type)}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <p className={`text-sm font-medium ${!notification.is_read ? 'font-semibold' : ''}`}>
                                {notification.title}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                {notification.message}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {formatDate(notification.created_at, 'short', 'christian')}
                              </p>
                            </div>

                            <div className="flex items-center gap-1">
                              {!notification.is_read && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleMarkAsRead(notification.id)}
                                  className="h-6 w-6 p-0"
                                >
                                  <Check className="h-3 w-3" />
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteNotification(notification.id)}
                                className="h-6 w-6 p-0"
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

                  {hasMore && (
                    <div className="p-2 text-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleLoadMore}
                        disabled={isLoading}
                        className="w-full text-xs text-muted-foreground"
                      >
                        {isLoading ? "กำลังโหลด..." : "โหลดเพิ่มเติม"}
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
