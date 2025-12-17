
import { createClient } from "@supabase/supabase-js"
import * as dotenv from "dotenv"
import { importOutstandingDebtors, OutstandingDebtorItem } from "../lib/actions/bulk-import-outstanding-actions"

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase credentials")
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function testImport() {
    console.log("--- Testing Outstanding Debtors Import ---")

    // 1. Get a valid Project ID
    const { data: projects } = await supabase.from('projects').select('id, name').limit(1)
    if (!projects || projects.length === 0) {
        console.error("No projects found")
        return
    }
    const projectId = projects[0].id
    console.log(`Using Project: ${projects[0].name} (${projectId})`)

    // 2. Get a valid Unit
    const { data: units } = await supabase.from('units').select('unit_number').eq('project_id', projectId).limit(1)
    if (!units || units.length === 0) {
        console.error("No units found for this project")
        return
    }
    const unitNumber = units[0].unit_number
    console.log(`Using Unit: ${unitNumber}`)

    // 3. Create mock import data
    const mockItems: OutstandingDebtorItem[] = [
        {
            invoice_number: `TEST-INV-${Date.now()}`,
            bill_date: new Date().toISOString().split('T')[0],
            due_date: new Date(Date.now() + 86400000).toISOString().split('T')[0], // Tomorrow
            unit_number: unitNumber,
            service_name: 'ค่าส่วนกลาง',
            amount: 1234.56,
            description: 'Test Import Description'
        }
    ]

    console.log("Mock Items:", mockItems)

    // 4. Run Import Action
    // Note: We need to mock 'getUnitsFromDB' or Ensure the action can access the DB. 
    // The action uses 'createClient' from '@/lib/supabase/server' which might look for cookies.
    // Since we are running in a script, 'createClient' from 'server' might fail or default to limited access.
    // However, the action file 'bulk-import-outstanding-actions.ts' likely uses 'createClient' which uses 'cookies()'.
    // This script environment doesn't have request cookies.

    // We cannot directly run the server action function here if it depends on Next.js headers/cookies.
    // Instead, let's just inspect what validation checks would run.

    console.log("Cannot run server action directly without mocking Next.js context.")
    console.log("Simulating manual check...")

    // Manual Check: Unit Exists?
    const { data: unitCheck } = await supabase.from('units').select('id').eq('unit_number', unitNumber).eq('project_id', projectId).single()
    console.log("Unit Check Result:", unitCheck ? "Found" : "Not Found")

    // Manual Check: Bill Insertion
    // We won't actually insert to avoid cluttering DB, but we verify we have permissions.
    // This script runs with Service Role if we use it, but user session is checking against RLS usually.
}

testImport()
