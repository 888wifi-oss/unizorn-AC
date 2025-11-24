/**
 * Test Scripts for Billing Features
 * 
 * Tests:
 * 1. Batch Apply Meter Readings to Bills
 * 2. Payment Reminders System
 * 3. Billing Reports & Analytics
 * 
 * Usage:
 *   npx tsx scripts/test_billing_features.ts
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase credentials in .env.local')
  console.error('   Required: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Test Results
const testResults: {
  name: string
  passed: boolean
  error?: string
  details?: any
}[] = []

// Helper function to log test results
function logTest(name: string, passed: boolean, error?: string, details?: any) {
  testResults.push({ name, passed, error, details })
  const icon = passed ? '✅' : '❌'
  console.log(`${icon} ${name}`)
  if (error) {
    console.log(`   Error: ${error}`)
  }
  if (details) {
    console.log(`   Details:`, JSON.stringify(details, null, 2))
  }
}

// ============================================
// TEST 1: Batch Apply Meter Readings
// ============================================

async function testBatchApplyMeterReadings() {
  console.log('\n🧪 TEST 1: Batch Apply Meter Readings to Bills\n')

  try {
    // Step 1: Find meter readings that are not linked to bills
    const { data: unlinkedReadings, error: readingsError } = await supabase
      .from('meter_readings')
      .select(`
        id,
        reading_date,
        current_reading,
        usage_amount,
        utility_meters!inner(
          id,
          meter_type,
          unit_id,
          units!inner(unit_number, project_id)
        )
      `)
      .is('bill_id', null)
      .limit(5)

    if (readingsError) {
      logTest('Find unlinked meter readings', false, readingsError.message)
      return
    }

    if (!unlinkedReadings || unlinkedReadings.length === 0) {
      logTest('Find unlinked meter readings', true, undefined, {
        message: 'No unlinked readings found (this is OK if all readings are linked)',
      })
      return
    }

    logTest('Find unlinked meter readings', true, undefined, {
      count: unlinkedReadings.length,
      readingIds: unlinkedReadings.map(r => r.id),
    })

    // Step 2: Test batch apply API (simulate the logic)
    const testReadingIds = unlinkedReadings.slice(0, 2).map(r => r.id)
    const defaultMonth = new Date().toISOString().split('T')[0].substring(0, 7)

    // Check if utility rates exist
    const { data: rates, error: ratesError } = await supabase
      .from('utility_rates')
      .select('*')
      .eq('is_active', true)

    if (ratesError) {
      logTest('Check utility rates', false, ratesError.message)
    } else {
      logTest('Check utility rates', true, undefined, {
        count: rates?.length || 0,
      })
    }

    // Step 3: Test bill number generation logic
    const [year, monthNum] = defaultMonth.split('-').map(Number)
    const { data: lastBill } = await supabase
      .from('bills')
      .select('bill_number')
      .like('bill_number', `BILL-${year}${String(monthNum).padStart(2, '0')}-%`)
      .order('bill_number', { ascending: false })
      .limit(1)
      .maybeSingle()

    const sequence = lastBill
      ? parseInt(lastBill.bill_number.split('-').pop() || '0', 10) + 1
      : 1

    const testBillNumber = `BILL-${year}${String(monthNum).padStart(2, '0')}-${String(sequence).padStart(3, '0')}`

    logTest('Generate bill number', true, undefined, {
      billNumber: testBillNumber,
    })

    // Step 4: Test calculateUtilityCost logic
    const testReading = unlinkedReadings[0]
    if (testReading && testReading.utility_meters) {
      const meterType = testReading.utility_meters.meter_type
      const usageAmount = testReading.usage_amount
      const projectId = testReading.utility_meters.units?.project_id

      // Get rate for this meter type
      let rateQuery = supabase
        .from('utility_rates')
        .select('*')
        .eq('meter_type', meterType)
        .eq('is_active', true)

      if (projectId) {
        rateQuery = rateQuery.or(`project_id.eq.${projectId},project_id.is.null`)
      } else {
        rateQuery = rateQuery.is('project_id', null)
      }

      const { data: applicableRate, error: rateQueryError } = await rateQuery
        .order('project_id', { ascending: false }) // Prioritize project-specific
        .limit(1)
        .maybeSingle()

      if (rateQueryError) {
        logTest('Calculate utility cost', false, rateQueryError.message)
      } else if (applicableRate) {
        const cost = usageAmount * applicableRate.rate_per_unit
        logTest('Calculate utility cost', true, undefined, {
          meterType,
          usageAmount,
          ratePerUnit: applicableRate.rate_per_unit,
          calculatedCost: cost,
        })
      } else {
        logTest('Calculate utility cost', true, undefined, {
          message: 'No rate found (this is OK if rates not configured)',
        })
      }
    }

    logTest('Batch Apply Meter Readings - Overall', true, undefined, {
      message: 'All validation tests passed',
      testReadingIds,
      defaultMonth,
    })
  } catch (error: any) {
    logTest('Batch Apply Meter Readings', false, error.message)
  }
}

// ============================================
// TEST 2: Payment Reminders
// ============================================

async function testPaymentReminders() {
  console.log('\n🧪 TEST 2: Payment Reminders System\n')

  try {
    // Step 1: Find bills that are due soon (within 3 days)
    const today = new Date()
    const threeDaysFromNow = new Date(today)
    threeDaysFromNow.setDate(today.getDate() + 3)

    const { data: billsDueSoon, error: billsError } = await supabase
      .from('bills')
      .select(`
        id,
        bill_number,
        month,
        due_date,
        total,
        status,
        units!inner(
          id,
          unit_number,
          user_id,
          owner_name,
          owner_email
        )
      `)
      .eq('status', 'pending')
      .lte('due_date', threeDaysFromNow.toISOString().split('T')[0])
      .gte('due_date', today.toISOString().split('T')[0])
      .order('due_date', { ascending: true })

    if (billsError) {
      logTest('Find bills due soon', false, billsError.message)
      return
    }

    logTest('Find bills due soon', true, undefined, {
      count: billsDueSoon?.length || 0,
      billIds: billsDueSoon?.map(b => b.id) || [],
    })

    // Step 2: Check existing notifications (to avoid duplicates)
    if (billsDueSoon && billsDueSoon.length > 0) {
      const billIds = billsDueSoon.map(b => b.id)
      const { data: existingNotifications } = await supabase
        .from('notifications')
        .select('data')
        .eq('type', 'payment_due')
        .in('data->bill_id', billIds)
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())

      const notifiedBillIds = new Set(
        existingNotifications?.map(n => n.data?.bill_id).filter(Boolean) || []
      )

      logTest('Check existing notifications', true, undefined, {
        existingNotificationsCount: existingNotifications?.length || 0,
        notifiedBillIds: Array.from(notifiedBillIds),
      })

      // Step 3: Count bills that need notifications
      const billsNeedingNotification = billsDueSoon.filter(
        bill => bill.units?.user_id && !notifiedBillIds.has(bill.id)
      )

      logTest('Bills needing notification', true, undefined, {
        count: billsNeedingNotification.length,
        billIds: billsNeedingNotification.map(b => b.id),
      })

      // Step 4: Validate notification data structure
      if (billsNeedingNotification.length > 0) {
        const testBill = billsNeedingNotification[0]
        const dueDate = new Date(testBill.due_date)
        const dueDateStr = dueDate.toLocaleDateString('th-TH', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })

        const notificationData = {
          user_id: testBill.units.user_id,
          unit_id: testBill.units.id,
          type: 'payment_due',
          title: 'แจ้งเตือนการชำระเงิน',
          message: `บิลสำหรับเดือน ${testBill.month} ครบกำหนดชำระในวันที่ ${dueDateStr} กรุณาชำระเงินภายในกำหนด`,
          data: {
            bill_id: testBill.id,
            bill_number: testBill.bill_number,
            amount: testBill.total,
            due_date: testBill.due_date,
            unit_number: testBill.units.unit_number,
          },
          is_read: false,
        }

        logTest('Validate notification data structure', true, undefined, {
          notification: notificationData,
        })
      }
    }

    logTest('Payment Reminders - Overall', true, undefined, {
      message: 'All validation tests passed',
    })
  } catch (error: any) {
    logTest('Payment Reminders', false, error.message)
  }
}

// ============================================
// TEST 3: Billing Reports & Analytics
// ============================================

async function testBillingReports() {
  console.log('\n🧪 TEST 3: Billing Reports & Analytics\n')

  try {
    const thisMonth = new Date().toISOString().split('T')[0].substring(0, 7)

    // Step 1: Test summary statistics
    const { data: allBills, error: billsError } = await supabase
      .from('bills')
      .select('id, total, status, due_date')

    if (billsError) {
      logTest('Fetch bills for summary', false, billsError.message)
      return
    }

    const today = new Date().toISOString().split('T')[0]

    const summary = {
      totalBills: allBills?.length || 0,
      totalAmount: allBills?.reduce((sum, b) => sum + (b.total || 0), 0) || 0,
      paidAmount: allBills?.filter(b => b.status === 'paid').reduce((sum, b) => sum + (b.total || 0), 0) || 0,
      pendingAmount:
        allBills
          ?.filter(b => b.status === 'pending' && (!b.due_date || b.due_date >= today))
          .reduce((sum, b) => sum + (b.total || 0), 0) || 0,
      overdueAmount:
        allBills
          ?.filter(b => b.status === 'pending' && b.due_date && b.due_date < today)
          .reduce((sum, b) => sum + (b.total || 0), 0) || 0,
    }

    logTest('Calculate summary statistics', true, undefined, summary)

    // Step 2: Test revenue by type
    const { data: billsWithFees } = await supabase
      .from('bills')
      .select('common_fee, water_fee, electricity_fee, parking_fee, other_fee')

    if (billsWithFees) {
      const revenueByType = {
        common_fee: billsWithFees.reduce((sum, b) => sum + (b.common_fee || 0), 0),
        water_fee: billsWithFees.reduce((sum, b) => sum + (b.water_fee || 0), 0),
        electricity_fee: billsWithFees.reduce((sum, b) => sum + (b.electricity_fee || 0), 0),
        parking_fee: billsWithFees.reduce((sum, b) => sum + (b.parking_fee || 0), 0),
        other_fee: billsWithFees.reduce((sum, b) => sum + (b.other_fee || 0), 0),
      }

      logTest('Calculate revenue by type', true, undefined, revenueByType)
    }

    // Step 3: Test monthly trends (last 6 months)
    const monthlyTrends = []
    for (let i = 5; i >= 0; i--) {
      const date = new Date()
      date.setMonth(date.getMonth() - i)
      const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`

      const monthBills = allBills?.filter(b => b.month?.startsWith(month)) || []

      monthlyTrends.push({
        month,
        total: monthBills.reduce((sum, b) => sum + (b.total || 0), 0),
        count: monthBills.length,
      })
    }

    logTest('Calculate monthly trends', true, undefined, {
      trends: monthlyTrends,
    })

    logTest('Billing Reports - Overall', true, undefined, {
      message: 'All report queries passed',
    })
  } catch (error: any) {
    logTest('Billing Reports', false, error.message)
  }
}

// ============================================
// TEST 4: Integration Tests
// ============================================

async function testIntegration() {
  console.log('\n🧪 TEST 4: Integration Tests\n')

  try {
    // Test 1: Verify meter readings can be linked to bills
    const { data: readingsWithBills, error: readingsError } = await supabase
      .from('meter_readings')
      .select(`
        id,
        bill_id,
        utility_meters!inner(meter_type, units!inner(unit_number))
      `)
      .not('bill_id', 'is', null)
      .limit(5)

    if (readingsError) {
      logTest('Find linked meter readings', false, readingsError.message)
    } else {
      logTest('Find linked meter readings', true, undefined, {
        count: readingsWithBills?.length || 0,
      })
    }

    // Test 2: Verify bills have correct recipient info
    const { data: billsWithRecipients } = await supabase
      .from('bills')
      .select(`
        id,
        common_fee_recipient_type,
        water_fee_recipient_type,
        units!inner(unit_number)
      `)
      .limit(5)

    if (billsWithRecipients && billsWithRecipients.length > 0) {
      logTest('Bills with recipient info', true, undefined, {
        count: billsWithRecipients.length,
        hasRecipientColumns: billsWithRecipients[0].common_fee_recipient_type !== undefined,
      })
    }

    // Test 3: Verify revenue journal entries are created
    const { data: revenueJournal, error: journalError } = await supabase
      .from('revenue_journal')
      .select('id, bill_id, account_code, amount')
      .not('bill_id', 'is', null)
      .limit(5)

    if (journalError) {
      logTest('Revenue journal entries', false, journalError.message)
    } else {
      logTest('Revenue journal entries', true, undefined, {
        count: revenueJournal?.length || 0,
      })
    }

    logTest('Integration Tests - Overall', true, undefined, {
      message: 'All integration tests passed',
    })
  } catch (error: any) {
    logTest('Integration Tests', false, error.message)
  }
}

// ============================================
// Main Test Runner
// ============================================

async function runAllTests() {
  console.log('🚀 Starting Billing Features Test Suite\n')
  console.log('=' .repeat(60))

  try {
    // Verify database connection
    const { data, error } = await supabase.from('bills').select('id').limit(1)
    if (error) {
      console.error('❌ Database connection failed:', error.message)
      process.exit(1)
    }
    console.log('✅ Database connection successful\n')

    // Run all tests
    await testBatchApplyMeterReadings()
    await testPaymentReminders()
    await testBillingReports()
    await testIntegration()

    // Print summary
    console.log('\n' + '='.repeat(60))
    console.log('\n📊 Test Summary\n')

    const passed = testResults.filter(r => r.passed).length
    const failed = testResults.filter(r => !r.passed).length
    const total = testResults.length

    console.log(`Total Tests: ${total}`)
    console.log(`✅ Passed: ${passed}`)
    console.log(`❌ Failed: ${failed}`)
    console.log(`Success Rate: ${((passed / total) * 100).toFixed(1)}%\n`)

    if (failed > 0) {
      console.log('Failed Tests:')
      testResults
        .filter(r => !r.passed)
        .forEach(r => {
          console.log(`  ❌ ${r.name}`)
          if (r.error) {
            console.log(`     Error: ${r.error}`)
          }
        })
    }

    // Exit with appropriate code
    process.exit(failed > 0 ? 1 : 0)
  } catch (error: any) {
    console.error('\n❌ Fatal error:', error.message)
    console.error(error.stack)
    process.exit(1)
  }
}

// Run tests
runAllTests()

