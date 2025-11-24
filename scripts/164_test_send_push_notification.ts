/**
 * Test script to send push notification manually
 * Run with: npx tsx scripts/164_test_send_push_notification.ts
 */

import { sendPushNotificationToUnit } from '../lib/utils/push-notification-sender'

async function testPushNotification() {
  console.log('Testing push notification for unit 1004...')
  
  try {
    const result = await sendPushNotificationToUnit('1004', {
      title: 'ทดสอบการแจ้งเตือน',
      body: 'นี่คือการทดสอบ Push Notification จากระบบ',
      type: 'parcel',
      url: '/portal/dashboard?tab=parcels'
    })
    
    if (result) {
      console.log('✅ Push notification sent successfully!')
    } else {
      console.log('❌ Failed to send push notification')
    }
  } catch (error) {
    console.error('❌ Error:', error)
  }
}

// Run the test
testPushNotification()

















