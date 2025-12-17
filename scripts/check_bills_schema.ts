
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

async function checkColumns() {
    console.log("--- Checking Bills Table Columns ---")
    // Since we can't query information_schema easily with RLS/permissions sometimes, 
    // we'll try to select a non-existent column and see the error, or just select * limit 1
    const { data, error } = await supabase.from('bills').select('*').limit(1)

    if (error) {
        console.log("Error selecting *:", error.message)
        return
    }

    if (data && data.length > 0) {
        console.log("Columns found in existing row:", Object.keys(data[0]))
    } else {
        // If table is empty, we can't see keys from data. 
        // Trying to insert a dummy with 'description' and see if it fails? 
        // No, better to try to select specific columns that might exist.
        console.log("Table is empty. Testing column existence by selection...")
        const potentialCols = ['description', 'notes', 'remark', 'reference_number', 'external_ref', 'invoice_number']

        for (const col of potentialCols) {
            const { error: colError } = await supabase.from('bills').select(col).limit(1)
            console.log(`Column '${col}': ${colError ? 'Missing (' + colError.message + ')' : 'Exists'}`)
        }
    }
}

checkColumns()
