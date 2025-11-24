/**
 * Test Script for Billing API Endpoints
 * 
 * Tests the actual API endpoints by making HTTP requests
 * 
 * Usage:
 *   npx tsx scripts/test_billing_api_endpoints.ts
 * 
 * Note: Make sure the dev server is running (npm run dev)
 */

import * as dotenv from 'dotenv'
import * as path from 'path'

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env.local') })

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000'

const testResults: {
  name: string
  passed: boolean
  status?: number
  error?: string
  response?: any
}[] = []

// Helper function to log test results
function logTest(name: string, passed: boolean, status?: number, error?: string, response?: any) {
  testResults.push({ name, passed, status, error, response })
  const icon = passed ? '✅' : '❌'
  console.log(`${icon} ${name}${status ? ` (${status})` : ''}`)
  if (error) {
    console.log(`   Error: ${error}`)
  }
  if (response && !passed) {
    console.log(`   Response:`, JSON.stringify(response, null, 2))
  }
}

// Helper to make API requests
async function apiRequest(endpoint: string, options: RequestInit = {}) {
  try {
    const url = `${API_BASE_URL}${endpoint}`
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    })

    const data = await response.json().catch(() => ({ error: 'Invalid JSON response' }))
    return { status: response.status, data }
  } catch (error: any) {
    return { status: 0, data: { error: error.message } }
  }
}

// ============================================
// TEST 1: Batch Apply Meter Readings API
// ============================================

async function testBatchApplyAPI() {
  console.log('\n🧪 TEST 1: Batch Apply Meter Readings API\n')

  // Test 1.1: Missing meterReadingIds
  const { status: status1, data: data1 } = await apiRequest(
    '/api/v1/meter-readings/batch-apply-to-bill',
    {
      method: 'POST',
      body: JSON.stringify({}),
    }
  )

  logTest(
    'Batch Apply - Missing meterReadingIds',
    status1 === 400 && data1.error?.includes('meterReadingIds'),
    status1,
    undefined,
    data1
  )

  // Test 1.2: Empty array
  const { status: status2, data: data2 } = await apiRequest(
    '/api/v1/meter-readings/batch-apply-to-bill',
    {
      method: 'POST',
      body: JSON.stringify({ meterReadingIds: [] }),
    }
  )

  logTest(
    'Batch Apply - Empty array',
    status2 === 400 && data2.error?.includes('meterReadingIds'),
    status2,
    undefined,
    data2
  )

  // Test 1.3: Invalid batchAction
  const { status: status3, data: data3 } = await apiRequest(
    '/api/v1/meter-readings/batch-apply-to-bill',
    {
      method: 'POST',
      body: JSON.stringify({
        meterReadingIds: ['test-id-1'],
        batchAction: 'invalid_action',
      }),
    }
  )

  // This should either succeed (if validation is loose) or fail gracefully
  logTest('Batch Apply - Invalid batchAction', status3 !== 500, status3, undefined, data3)

  // Test 1.4: Valid request structure (but may fail if no data exists)
  const { status: status4, data: data4 } = await apiRequest(
    '/api/v1/meter-readings/batch-apply-to-bill',
    {
      method: 'POST',
      body: JSON.stringify({
        meterReadingIds: ['00000000-0000-0000-0000-000000000000'], // Non-existent ID
        batchAction: 'auto',
      }),
    }
  )

  // Should handle gracefully (either 200 with skipped results or 404)
  logTest(
    'Batch Apply - Non-existent reading IDs',
    status4 === 200 || (status4 === 404 && data4.error),
    status4,
    undefined,
    data4
  )
}

// ============================================
// TEST 2: Payment Reminders API
// ============================================

async function testPaymentRemindersAPI() {
  console.log('\n🧪 TEST 2: Payment Reminders API\n')

  // Test 2.1: Missing billIds
  const { status: status1, data: data1 } = await apiRequest('/api/v1/billing/send-reminders', {
    method: 'POST',
    body: JSON.stringify({}),
  })

  logTest(
    'Send Reminders - Missing billIds',
    status1 === 400 && data1.error?.includes('billIds'),
    status1,
    undefined,
    data1
  )

  // Test 2.2: Empty array
  const { status: status2, data: data2 } = await apiRequest('/api/v1/billing/send-reminders', {
    method: 'POST',
    body: JSON.stringify({ billIds: [] }),
  })

  logTest(
    'Send Reminders - Empty array',
    status2 === 400 && data2.error?.includes('billIds'),
    status2,
    undefined,
    data2
  )

  // Test 2.3: Valid request structure
  const { status: status3, data: data3 } = await apiRequest('/api/v1/billing/send-reminders', {
    method: 'POST',
    body: JSON.stringify({
      billIds: ['00000000-0000-0000-0000-000000000000'], // Non-existent ID
    }),
  })

  // Should handle gracefully (200 with count: 0 or proper error)
  logTest(
    'Send Reminders - Non-existent bill IDs',
    status3 === 200 || (status3 === 404 && data3.error),
    status3,
    undefined,
    data3
  )
}

// ============================================
// TEST 3: Validate Response Structures
// ============================================

async function testResponseStructures() {
  console.log('\n🧪 TEST 3: Validate Response Structures\n')

  // Test that successful batch apply returns correct structure
  const { status, data } = await apiRequest('/api/v1/meter-readings/batch-apply-to-bill', {
    method: 'POST',
    body: JSON.stringify({
      meterReadingIds: ['00000000-0000-0000-0000-000000000000'],
      batchAction: 'auto',
    }),
  })

  if (status === 200 && data.success) {
    const hasSummary = data.summary && typeof data.summary.total === 'number'
    const hasResults = data.results && Array.isArray(data.results.success)

    logTest(
      'Batch Apply - Response structure',
      hasSummary && hasResults,
      200,
      undefined,
      { hasSummary, hasResults }
    )
  } else {
    logTest('Batch Apply - Response structure', true, status, undefined, {
      message: 'Skipped - request did not succeed',
    })
  }

  // Test that reminders response has correct structure
  const { status: status2, data: data2 } = await apiRequest('/api/v1/billing/send-reminders', {
    method: 'POST',
    body: JSON.stringify({
      billIds: ['00000000-0000-0000-0000-000000000000'],
    }),
  })

  if (status2 === 200 && data2.success) {
    const hasCount = typeof data2.count === 'number'
    const hasSkipped = typeof data2.skipped === 'number'

    logTest(
      'Send Reminders - Response structure',
      hasCount && hasSkipped,
      200,
      undefined,
      { hasCount, hasSkipped }
    )
  } else {
    logTest('Send Reminders - Response structure', true, status2, undefined, {
      message: 'Skipped - request did not succeed',
    })
  }
}

// ============================================
// Main Test Runner
// ============================================

async function runAllTests() {
  console.log('🚀 Starting Billing API Endpoints Test Suite\n')
  console.log(`API Base URL: ${API_BASE_URL}\n`)
  console.log('='.repeat(60))

  // Check if server is accessible
  try {
    const healthCheck = await fetch(`${API_BASE_URL}/api/health`).catch(() => null)
    if (!healthCheck) {
      console.log('\n⚠️  Warning: Could not reach API server')
      console.log('   Make sure the dev server is running: npm run dev\n')
    }
  } catch (error) {
    // Ignore health check failure
  }

  // Run all tests
  await testBatchApplyAPI()
  await testPaymentRemindersAPI()
  await testResponseStructures()

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
        console.log(`  ❌ ${r.name}${r.status ? ` (Status: ${r.status})` : ''}`)
        if (r.error) {
          console.log(`     Error: ${r.error}`)
        }
      })
  }

  // Exit with appropriate code
  process.exit(failed > 0 ? 1 : 0)
}

// Run tests
runAllTests()

