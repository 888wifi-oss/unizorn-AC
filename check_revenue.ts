
import { createClient } from "@/lib/supabase/client"

async function checkRevenue() {
    const supabase = createClient()

    console.log("Checking for revenue entries in general_ledger_view...")

    // Check for any entries with account_code starting with '4'
    const { data: revenueData, error: revenueError } = await supabase
        .from('general_ledger_view')
        .select('*')
        .like('account_code', '4%')
        .limit(10)

    if (revenueError) {
        console.error("Error fetching revenue data:", revenueError)
    } else {
        console.log(`Found ${revenueData?.length} revenue entries:`)
        console.log(JSON.stringify(revenueData, null, 2))
    }

    // Check for any entries with account_code starting with '5' (Expenses) for comparison
    const { data: expenseData, error: expenseError } = await supabase
        .from('general_ledger_view')
        .select('*')
        .like('account_code', '5%')
        .limit(5)

    if (expenseError) {
        console.error("Error fetching expense data:", expenseError)
    } else {
        console.log(`Found ${expenseData?.length} expense entries:`)
        console.log(JSON.stringify(expenseData, null, 2))
    }
}

checkRevenue()
