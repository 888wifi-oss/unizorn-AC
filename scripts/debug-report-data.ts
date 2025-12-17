
import { createClient } from "@supabase/supabase-js"
import * as dotenv from "dotenv"
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase credentials")
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function debugData() {
    console.log("--- Debugging Payments Data ---")
    const { data: payments, error: paymentError } = await supabase
        .from('payments')
        .select('id, payment_date, amount, status, project_id')
        .limit(5)
        .order('created_at', { ascending: false })

    if (paymentError) {
        console.error("Error fetching payments:", paymentError)
    } else {
        console.log(`Found ${payments?.length} recent payments`)
        console.table(payments)
        if (payments?.length > 0) {
            console.log("Sample Payment Date Format:", payments[0].payment_date)
        }
    }

    console.log("\n--- Debugging General Ledger Data ---")
    const { data: gl, error: glError } = await supabase
        .from('general_ledger_view')
        .select('id, journal_date, account_code, debit, credit, project_id')
        .like('account_code', '11%')
        .limit(5)
        .order('journal_date', { ascending: false })

    if (glError) {
        console.error("Error fetching GL:", glError)
    } else {
        console.log(`Found ${gl?.length} recent GL entries (Cash 11%)`)
        console.table(gl)
        if (gl?.length > 0) {
            console.log("Sample GL Date Format:", gl[0].journal_date)
        }
    }

    console.log("\n--- Project IDs ---")
    // Check usually used project IDs
    const { data: projects } = await supabase.from('projects').select('id, name')
    console.table(projects)
}

debugData()
