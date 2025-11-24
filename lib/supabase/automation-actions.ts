"use server"

import { createClient } from "@/lib/supabase/client"
import { createUnitNotification } from "@/lib/supabase/notification-helpers"
import { AutomationRule, AutomationExecution } from "@/lib/types/automation"
import { builtInRules } from "@/lib/utils/automation-rules"

export async function getAutomationRules(): Promise<{ success: boolean; rules?: AutomationRule[]; error?: string }> {
  const supabase = await createClient()
  
  try {
    // For now, return built-in rules since we don't have automation_rules table yet
    const rules: AutomationRule[] = builtInRules.map((rule, index) => ({
      ...rule,
      id: `builtin_${index}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }))

    return { success: true, rules }
  } catch (error: any) {
    console.error('Error fetching automation rules:', error)
    return { success: false, error: error.message }
  }
}

export async function executeAutomationRule(ruleId: string): Promise<{ success: boolean; execution?: AutomationExecution; error?: string }> {
  const supabase = await createClient()
  
  try {
    console.log(`Executing automation rule: ${ruleId}`)
    
    const executionId = `exec_${Date.now()}`
    const executedAt = new Date().toISOString()
    const results: AutomationExecution['results'] = []

    // Get the rule
    const rulesResult = await getAutomationRules()
    if (!rulesResult.success || !rulesResult.rules) {
      throw new Error('Failed to fetch automation rules')
    }

    const rule = rulesResult.rules.find(r => r.id === ruleId)
    if (!rule) {
      throw new Error('Rule not found')
    }

    if (!rule.isActive) {
      throw new Error('Rule is not active')
    }

    // Execute based on rule type
    switch (rule.type) {
      case 'payment_due':
        await executePaymentDueRule(rule, results)
        break
      case 'parcel_overdue':
        await executeParcelOverdueRule(rule, results)
        break
      case 'maintenance_reminder':
        await executeMaintenanceReminderRule(rule, results)
        break
      case 'monthly_report':
        await executeMonthlyReportRule(rule, results)
        break
      default:
        throw new Error(`Unsupported rule type: ${rule.type}`)
    }

    const execution: AutomationExecution = {
      id: executionId,
      ruleId,
      status: 'success',
      executedAt,
      results
    }

    console.log(`Automation rule ${ruleId} executed successfully`)
    return { success: true, execution }

  } catch (error: any) {
    console.error(`Error executing automation rule ${ruleId}:`, error)
    
    const execution: AutomationExecution = {
      id: `exec_${Date.now()}`,
      ruleId,
      status: 'failed',
      executedAt: new Date().toISOString(),
      results: [],
      error: error.message
    }

    return { success: false, execution, error: error.message }
  }
}

async function executePaymentDueRule(rule: AutomationRule, results: AutomationExecution['results']) {
  const supabase = await createClient()
  
  try {
    // Get overdue bills
    const { data: bills, error } = await supabase
      .from('bills')
      .select('*')
      .eq('status', 'unpaid')
      .lt('due_date', new Date().toISOString())

    if (error) throw error

    if (!bills || bills.length === 0) {
      results.push({
        action: 'check_overdue_bills',
        success: true,
        message: 'No overdue bills found'
      })
      return
    }

    // Send notifications for each overdue bill
    for (const bill of bills) {
      try {
        await createUnitNotification(
          bill.unitNumber,
          'payment_due',
          'ค่าส่วนกลางค้างชำระ',
          `ค่าส่วนกลางสำหรับเดือน ${bill.month} ค้างชำระเกินกำหนด กรุณาชำระเงินโดยเร็ว`,
          { billId: bill.id, amount: bill.amount }
        )

        results.push({
          action: 'send_notification',
          success: true,
          message: `Notification sent to unit ${bill.unitNumber}`,
          target: bill.unitNumber
        })
      } catch (error: any) {
        results.push({
          action: 'send_notification',
          success: false,
          message: `Failed to send notification to unit ${bill.unitNumber}: ${error.message}`,
          target: bill.unitNumber
        })
      }
    }
  } catch (error: any) {
    results.push({
      action: 'execute_payment_due_rule',
      success: false,
      message: error.message
    })
  }
}

async function executeParcelOverdueRule(rule: AutomationRule, results: AutomationExecution['results']) {
  const supabase = await createClient()
  
  try {
    // Get overdue parcels (more than 3 days old)
    const threeDaysAgo = new Date()
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3)
    
    const { data: parcels, error } = await supabase
      .from('parcels')
      .select('*')
      .eq('status', 'pending')
      .lt('received_at', threeDaysAgo.toISOString())

    if (error) throw error

    if (!parcels || parcels.length === 0) {
      results.push({
        action: 'check_overdue_parcels',
        success: true,
        message: 'No overdue parcels found'
      })
      return
    }

    // Send notifications for each overdue parcel
    for (const parcel of parcels) {
      try {
        await createUnitNotification(
          parcel.unit_number,
          'parcel_overdue',
          'พัสดุเกินกำหนดรับ',
          `มีพัสดุจาก ${parcel.courier_company} รอรับเกินกำหนด กรุณามารับพัสดุที่สำนักงาน`,
          { parcelId: parcel.id, courierCompany: parcel.courier_company }
        )

        results.push({
          action: 'send_notification',
          success: true,
          message: `Notification sent to unit ${parcel.unit_number}`,
          target: parcel.unit_number
        })
      } catch (error: any) {
        results.push({
          action: 'send_notification',
          success: false,
          message: `Failed to send notification to unit ${parcel.unit_number}: ${error.message}`,
          target: parcel.unit_number
        })
      }
    }
  } catch (error: any) {
    results.push({
      action: 'execute_parcel_overdue_rule',
      success: false,
      message: error.message
    })
  }
}

async function executeMaintenanceReminderRule(rule: AutomationRule, results: AutomationExecution['results']) {
  const supabase = await createClient()
  
  try {
    // Get overdue maintenance requests (more than 5 days old)
    const fiveDaysAgo = new Date()
    fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5)
    
    const { data: requests, error } = await supabase
      .from('maintenance_requests')
      .select('*')
      .eq('status', 'pending')
      .lt('created_at', fiveDaysAgo.toISOString())

    if (error) throw error

    if (!requests || requests.length === 0) {
      results.push({
        action: 'check_overdue_maintenance',
        success: true,
        message: 'No overdue maintenance requests found'
      })
      return
    }

    // Send notifications to admin for each overdue request
    for (const request of requests) {
      try {
        // Send to all admin units (assuming unit_number 'ADMIN' exists)
        await createUnitNotification(
          'ADMIN',
          'maintenance_overdue',
          'งานซ่อมบำรุงค้างเกินกำหนด',
          `งานซ่อมบำรุงจากห้อง ${request.unit_number} ค้างเกินกำหนด กรุณาดำเนินการโดยเร็ว`,
          { requestId: request.id, unitNumber: request.unit_number }
        )

        results.push({
          action: 'send_notification',
          success: true,
          message: `Notification sent to admin for unit ${request.unit_number}`,
          target: request.unit_number
        })
      } catch (error: any) {
        results.push({
          action: 'send_notification',
          success: false,
          message: `Failed to send notification for unit ${request.unit_number}: ${error.message}`,
          target: request.unit_number
        })
      }
    }
  } catch (error: any) {
    results.push({
      action: 'execute_maintenance_reminder_rule',
      success: false,
      message: error.message
    })
  }
}

async function executeMonthlyReportRule(rule: AutomationRule, results: AutomationExecution['results']) {
  try {
    // Send monthly report notification to admin
    await createUnitNotification(
      'ADMIN',
      'monthly_report',
      'รายงานประจำเดือนพร้อมแล้ว',
      'รายงานสรุปประจำเดือนพร้อมแล้ว กรุณาตรวจสอบในระบบการวิเคราะห์ข้อมูล',
      { reportType: 'monthly', month: new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'long' }) }
    )

    results.push({
      action: 'send_notification',
      success: true,
      message: 'Monthly report notification sent to admin',
      target: 'ADMIN'
    })
  } catch (error: any) {
    results.push({
      action: 'execute_monthly_report_rule',
      success: false,
      message: error.message
    })
  }
}

export async function executeAllAutomationRules(): Promise<{ success: boolean; executions?: AutomationExecution[]; error?: string }> {
  try {
    const rulesResult = await getAutomationRules()
    if (!rulesResult.success || !rulesResult.rules) {
      throw new Error('Failed to fetch automation rules')
    }

    const activeRules = rulesResult.rules.filter(rule => rule.isActive)
    const executions: AutomationExecution[] = []

    for (const rule of activeRules) {
      const executionResult = await executeAutomationRule(rule.id)
      if (executionResult.execution) {
        executions.push(executionResult.execution)
      }
    }

    return { success: true, executions }
  } catch (error: any) {
    console.error('Error executing all automation rules:', error)
    return { success: false, error: error.message }
  }
}
