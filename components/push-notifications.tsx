"use client"

import { useState, useEffect } from "react"
import { Bell, CheckCircle, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"

export function PushNotificationsSetup() {
  const [isSupported, setIsSupported] = useState(false)
  const [isPermissionGranted, setIsPermissionGranted] = useState(false)
  const [subscription, setSubscription] = useState<PushSubscription | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    // Check if browser supports push notifications
    // Disable Push Notifications since Service Worker is removed
    if (false && 'serviceWorker' in navigator && 'PushManager' in window) {
      setIsSupported(true)
      checkPermission()
      loadSubscriptionFromDatabase()
    }
  }, [])

  const loadSubscriptionFromDatabase = async () => {
    try {
      const unitNumber = getUnitNumberFromStorage()
      if (!unitNumber) {
        console.log('[PushNotifications] No unit number found')
        return
      }

      console.log('[PushNotifications] Checking subscription for unit:', unitNumber)
      const response = await fetch('/api/portal/push-check-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ unit_number: unitNumber })
      })

      if (response.ok) {
        const data = await response.json()
        if (data.hasSubscription) {
          console.log('[PushNotifications] Subscription found in database')
          // Create a dummy subscription object to show as enabled
          setSubscription({ endpoint: 'active', keys: { p256dh: '', auth: '' } } as PushSubscription)
          setIsPermissionGranted(true)
        } else {
          console.log('[PushNotifications] No subscription found in database')
        }
      }
    } catch (error) {
      console.error('[PushNotifications] Failed to load subscription:', error)
    }
  }

  const checkPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission()
      setIsPermissionGranted(permission === 'granted')
    }
  }

  const registerServiceWorker = async () => {
    try {
      // Check if sw.js exists first
      const response = await fetch('/sw.js', { method: 'HEAD' })
      if (!response.ok) {
        throw new Error('Service Worker file not found')
      }

      const registration = await navigator.serviceWorker.register('/sw.js')
      console.log('Service Worker registered:', registration)
      return registration
    } catch (error) {
      console.error('Service Worker registration failed:', error)
      toast({
        title: "ไม่สามารถใช้งานได้",
        description: "ไฟล์ Service Worker ถูกถอดออกแล้ว Push Notifications จึงใช้การไม่ได้",
        variant: "destructive"
      })
      return null
    }
  }

  const subscribeToPush = async () => {
    setIsLoading(true)
    try {
      // Check permission first
      if (isPermissionGranted === false) {
        const permission = await Notification.requestPermission()
        setIsPermissionGranted(permission === 'granted')
        
        if (permission !== 'granted') {
          toast({
            title: "ไม่สามารถใช้งานได้",
            description: "กรุณาอนุญาตการแจ้งเตือนจากเบราว์เซอร์",
            variant: "destructive"
          })
          setIsLoading(false)
          return
        }
      }

      // Register service worker
      const registration = await registerServiceWorker()
      if (!registration) {
        setIsLoading(false)
        return
      }

      // Subscribe to push notifications
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '')
      })

      setSubscription(subscription)

      // Send subscription to server
      const response = await fetch('/api/portal/push-subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscription: subscription.toJSON(),
          unit_number: getUnitNumberFromStorage()
        })
      })

      if (response.ok) {
        toast({
          title: "ใช้งาน Push Notifications สำเร็จ",
          description: "ระบบจะแจ้งเตือนคุณเมื่อมีบิล พัสดุ หรือประกาศใหม่"
        })
      } else {
        throw new Error('Failed to save subscription')
      }

    } catch (error: any) {
      console.error('Push subscription failed:', error)
      toast({
        title: "เกิดข้อผิดพลาด",
        description: error.message || "ไม่สามารถใช้งาน Push Notifications ได้",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const unsubscribeFromPush = async () => {
    setIsLoading(true)
    try {
      if (subscription) {
        await subscription.unsubscribe()
      }

      // Delete from server
      const response = await fetch('/api/portal/push-unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          unit_number: getUnitNumberFromStorage()
        })
      })

      if (response.ok) {
        setSubscription(null)
        toast({
          title: "ยกเลิก Push Notifications สำเร็จ",
          description: "คุณจะไม่ได้รับแจ้งเตือนอีกต่อไป"
        })
      } else {
        throw new Error('Failed to unsubscribe')
      }
    } catch (error) {
      console.error('Unsubscribe failed:', error)
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถยกเลิกการแจ้งเตือนได้",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const urlBase64ToUint8Array = (base64String: string) => {
    const padding = '='.repeat((4 - base64String.length % 4) % 4)
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/')

    const rawData = window.atob(base64)
    const outputArray = new Uint8Array(rawData.length)

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i)
    }
    return outputArray
  }

  const getUnitNumberFromStorage = () => {
    if (typeof window !== 'undefined') {
      const residentData = localStorage.getItem('residentData')
      if (residentData) {
        try {
          const data = JSON.parse(residentData)
          return data.unit_number
        } catch (error) {
          return ''
        }
      }
    }
    return ''
  }

  if (!isSupported) {
    return (
      <div className="flex items-center justify-between p-3 border rounded-lg bg-gray-50 dark:bg-gray-800/50">
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-gray-600" />
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Push Notifications ถูกปิดใช้งานแล้ว (Service Worker ถูกลบออก)
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between p-3 border rounded-lg bg-blue-50 dark:bg-blue-900/20">
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          <div>
            <p className="text-sm font-medium text-blue-900 dark:text-blue-200">
              Push Notifications
            </p>
            <p className="text-xs text-blue-700 dark:text-blue-300">
              รับการแจ้งเตือนแม้เมื่อปิดแอป
            </p>
          </div>
        </div>
        {(subscription !== null || isPermissionGranted === true) ? (
          <Button
            size="sm"
            variant="outline"
            onClick={unsubscribeFromPush}
            disabled={isLoading}
            className="bg-white"
          >
            {isLoading ? (
              <>
                <div className="h-4 w-4 mr-1 animate-spin rounded-full border-2 border-current border-t-transparent" />
                กำลังยกเลิก...
              </>
            ) : (
              <>
                <XCircle className="h-4 w-4 mr-1" />
                ปิดการใช้งาน
              </>
            )}
          </Button>
        ) : (
          <Button
            size="sm"
            onClick={subscribeToPush}
            disabled={isLoading}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isLoading ? (
              <>
                <div className="h-4 w-4 mr-1 animate-spin rounded-full border-2 border-white border-t-transparent" />
                กำลังเปิด...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-1" />
                เปิดการใช้งาน
              </>
            )}
          </Button>
        )}
      </div>

      {!isPermissionGranted && (
        <div className="flex items-center gap-2 p-2 border border-orange-300 rounded-lg bg-orange-50 dark:bg-orange-900/20">
          <p className="text-xs text-orange-800 dark:text-orange-300">
            กรุณาอนุญาตการแจ้งเตือนจากเบราว์เซอร์
          </p>
        </div>
      )}
    </div>
  )
}

