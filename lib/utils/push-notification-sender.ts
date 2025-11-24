/**
 * Push Notification Sender
 * ฟังก์ชันสำหรับส่ง Push Notifications ไปยังผู้ใช้
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Initialize web-push dynamically
let webpush: any = null

async function getWebPush() {
  if (!webpush) {
    const webPushModule = await import('web-push')
    webpush = webPushModule.default
    
    if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
      webpush.setVapidDetails(
        'mailto:support@unizorn.com',
        process.env.VAPID_PUBLIC_KEY!,
        process.env.VAPID_PRIVATE_KEY!
      )
    }
  }
  return webpush
}

export interface PushNotificationData {
  title: string
  body: string
  icon?: string
  badge?: string
  tag?: string
  requireInteraction?: boolean
  url?: string
  type: 'bill' | 'parcel' | 'announcement' | 'maintenance'
}

/**
 * Send push notification to a specific unit
 */
export async function sendPushNotificationToUnit(
  unitNumber: string,
  data: PushNotificationData
): Promise<boolean> {
  console.log('[PushNotification] Starting for unit:', unitNumber)
  
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get subscription from database
    console.log('[PushNotification] Fetching subscription from database...')
    const { data: subscriptionData, error } = await supabase
      .from('push_subscriptions')
      .select('subscription')
      .eq('unit_number', unitNumber)
      .single()

    if (error || !subscriptionData) {
      console.error('[PushNotification] No subscription found for unit:', unitNumber, 'Error:', error)
      return false
    }
    
    console.log('[PushNotification] Subscription found for unit:', unitNumber)

    // Parse subscription
    const subscription = JSON.parse(subscriptionData.subscription)

    // Prepare notification payload
    const payload = JSON.stringify({
      title: data.title,
      body: data.body,
      icon: data.icon || '/icon-192x192.png',
      badge: data.badge || '/icon-192x192.png',
      tag: data.tag || data.type,
      requireInteraction: data.requireInteraction || false,
      url: data.url || `/portal/dashboard`
    })

    // Get webpush instance
    console.log('[PushNotification] Getting webpush instance...')
    const webpush = await getWebPush()
    
    console.log('[PushNotification] Sending notification with payload:', payload)

    // Send push notification
    await webpush.sendNotification(subscription, payload)

    console.log(`[PushNotification] ✅ Push notification sent successfully to unit: ${unitNumber}`)
    return true

  } catch (error: any) {
    console.error('Error sending push notification:', error)
    
    // If subscription is invalid, delete it from database
    if (error.statusCode === 410) {
      await deletePushSubscription(unitNumber)
      console.log(`Invalid subscription deleted for unit: ${unitNumber}`)
    }
    
    return false
  }
}

/**
 * Send push notification to multiple units
 */
export async function sendPushNotificationToUnits(
  unitNumbers: string[],
  data: PushNotificationData
): Promise<{ success: number; failed: number }> {
  let success = 0
  let failed = 0

  for (const unitNumber of unitNumbers) {
    const result = await sendPushNotificationToUnit(unitNumber, data)
    if (result) {
      success++
    } else {
      failed++
    }
  }

  return { success, failed }
}

/**
 * Send push notification to all subscribers
 */
export async function sendPushNotificationToAll(
  data: PushNotificationData
): Promise<{ success: number; failed: number }> {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get all subscriptions
    const { data: subscriptions, error } = await supabase
      .from('push_subscriptions')
      .select('unit_number')

    if (error || !subscriptions) {
      console.error('Error getting subscriptions:', error)
      return { success: 0, failed: 0 }
    }

    const unitNumbers = subscriptions.map(s => s.unit_number)
    return await sendPushNotificationToUnits(unitNumbers, data)

  } catch (error) {
    console.error('Error sending push notifications to all:', error)
    return { success: 0, failed: 0 }
  }
}

/**
 * Delete invalid push subscription
 */
async function deletePushSubscription(unitNumber: string): Promise<void> {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    await supabase
      .from('push_subscriptions')
      .delete()
      .eq('unit_number', unitNumber)
  } catch (error) {
    console.error('Error deleting subscription:', error)
  }
}

