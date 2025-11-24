"use server"

import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { Notification, NotificationType } from "@/lib/types/notification"

// Create notification
export async function createNotification(notification: Omit<Notification, 'id' | 'created_at'>) {
  const supabase = await createClient()

  try {
    const { data, error } = await supabase
      .from('notifications')
      .insert([notification])
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create notification: ${error.message}`)
    }

    return { success: true, notification: data }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// Get notifications for user
export async function getUserNotifications(userId: string, page: number = 1, limit: number = 20) {
  const supabase = await createClient()

  try {
    const from = (page - 1) * limit
    const to = from + limit - 1

    const { data, error, count } = await supabase
      .from('notifications')
      .select('id, type, title, message, created_at, is_read, data, unit_id, project_id', { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(from, to)

    if (error) {
      throw new Error(`Failed to fetch notifications: ${error.message}`)
    }

    return { success: true, notifications: data || [], total: count || 0 }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// Get notifications for unit (for residents)
export async function getUnitNotifications(unitNumber: string, page: number = 1, limit: number = 20) {
  const supabase = await createClient()

  try {
    // First get the unit_id from unit_number
    const { data: unit, error: unitError } = await supabase
      .from('units')
      .select('id')
      .eq('unit_number', unitNumber)
      .single()

    if (unitError || !unit) {
      throw new Error(`Unit ${unitNumber} not found`)
    }

    const from = (page - 1) * limit
    const to = from + limit - 1

    const { data, error, count } = await supabase
      .from('notifications')
      .select('id, type, title, message, created_at, is_read, data, unit_id, project_id', { count: 'exact' })
      .eq('unit_id', unit.id)
      .order('created_at', { ascending: false })
      .range(from, to)

    if (error) {
      throw new Error(`Failed to fetch notifications: ${error.message}`)
    }

    return { success: true, notifications: data || [], total: count || 0 }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// Get notifications for admin (by project_id)
export async function getAdminNotifications(projectId: string | null, page: number = 1, limit: number = 20) {
  const supabase = await createClient()

  try {
    const from = (page - 1) * limit
    const to = from + limit - 1

    let query = supabase
      .from('notifications')
      .select('id, type, title, message, created_at, is_read, data, project_id', { count: 'exact' })
      .is('unit_id', null) // Only admin notifications (no unit_id)
      .order('created_at', { ascending: false })
      .range(from, to)

    // Filter by project_id if provided
    if (projectId) {
      query = query.eq('project_id', projectId)
    }

    const { data, error, count } = await query

    if (error) {
      throw new Error(`Failed to fetch admin notifications: ${error.message}`)
    }

    return { success: true, notifications: data || [], total: count || 0 }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// Get unread notification count for unit
export async function getUnreadUnitNotificationCount(unitNumber: string) {
  const supabase = await createClient()

  try {
    const { data: unit, error: unitError } = await supabase
      .from('units')
      .select('id')
      .eq('unit_number', unitNumber)
      .single()

    if (unitError || !unit) {
      return { success: false, error: `Unit ${unitNumber} not found` }
    }

    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('unit_id', unit.id)
      .eq('is_read', false)

    if (error) {
      throw new Error(`Failed to get unread count: ${error.message}`)
    }

    return { success: true, count: count || 0 }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// Get unread notification count for admin
export async function getUnreadAdminNotificationCount(projectId: string | null) {
  const supabase = await createClient()

  try {
    let query = supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .is('unit_id', null)
      .eq('is_read', false)

    if (projectId) {
      query = query.eq('project_id', projectId)
    }

    const { count, error } = await query

    if (error) {
      throw new Error(`Failed to get unread count: ${error.message}`)
    }

    return { success: true, count: count || 0 }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// Mark notification as read
export async function markNotificationAsRead(notificationId: string) {
  const supabase = await createClient()

  try {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId)

    if (error) {
      throw new Error(`Failed to mark notification as read: ${error.message}`)
    }

    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// Mark all notifications as read for user
export async function markAllNotificationsAsRead(userId: string) {
  const supabase = await createClient()

  try {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false)

    if (error) {
      throw new Error(`Failed to mark all notifications as read: ${error.message}`)
    }

    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// Mark all admin notifications as read (by project_id)
export async function markAllAdminNotificationsAsRead(projectId: string | null) {
  const supabase = await createClient()

  try {
    let query = supabase
      .from('notifications')
      .update({ is_read: true })
      .is('unit_id', null) // Only admin notifications
      .eq('is_read', false)

    // Filter by project_id if provided
    if (projectId) {
      query = query.eq('project_id', projectId)
    }

    const { error } = await query

    if (error) {
      throw new Error(`Failed to mark all admin notifications as read: ${error.message}`)
    }

    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// Delete notification
export async function deleteNotification(notificationId: string) {
  const supabase = await createClient()

  try {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId)

    if (error) {
      throw new Error(`Failed to delete notification: ${error.message}`)
    }

    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// Get unread notification count
export async function getUnreadNotificationCount(userId: string) {
  const supabase = await createClient()

  try {
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false)

    if (error) {
      throw new Error(`Failed to get unread count: ${error.message}`)
    }

    return { success: true, count: count || 0 }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

import { getNotificationTemplate } from "@/lib/utils/notification-templates"

// Helper function to create payment due notifications
export async function createPaymentDueNotifications() {
  const supabase = await createClient()

  try {
    // Get bills that are due in 3 days
    const threeDaysFromNow = new Date()
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3)

    const { data: bills, error } = await supabase
      .from('bills')
      .select(`
        id,
        unit_id,
        month,
        due_date,
        total,
        units!inner(user_id, unit_number, owner_name)
      `)
      .eq('status', 'pending')
      .lte('due_date', threeDaysFromNow.toISOString().split('T')[0])

    if (error) {
      throw new Error(`Failed to fetch bills: ${error.message}`)
    }

    const notifications = []
    for (const bill of bills || []) {
      // Cast units to any to avoid TS error about array vs object
      const unit = bill.units as any
      if (unit?.user_id) {
        const template = getNotificationTemplate('payment_due')
        notifications.push({
          user_id: unit.user_id,
          unit_id: bill.unit_id,
          type: 'payment_due' as NotificationType,
          title: template.title,
          message: template.message
            .replace('{month}', bill.month)
            .replace('{dueDate}', new Date(bill.due_date).toLocaleDateString('th-TH')),
          data: {
            bill_id: bill.id,
            amount: bill.total,
            due_date: bill.due_date
          },
          is_read: false
        })
      }
    }

    if (notifications.length > 0) {
      const { error: insertError } = await supabase
        .from('notifications')
        .insert(notifications)

      if (insertError) {
        throw new Error(`Failed to create notifications: ${insertError.message}`)
      }
    }

    return { success: true, count: notifications.length }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}
