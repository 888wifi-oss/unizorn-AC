-- Test Push Notification Function
-- Script: 163_test_push_notification.sql
-- Description: Test script to trigger push notification

-- Get subscription for unit 1004
SELECT 
  unit_number,
  subscription,
  created_at,
  updated_at
FROM push_subscriptions
WHERE unit_number = '1004';

-- If subscription exists, test notification will be sent
-- Expected: Push notification will be sent via Service Worker

