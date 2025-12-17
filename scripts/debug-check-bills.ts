
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkBills() {
    const { data: bills, error } = await supabase
        .from('bills')
        .select('*')
        .in('bill_number', ['IV-202512201-2', 'IV-2025092117-2', 'BILL-202512-133'])

    if (error) {
        console.error('Error fetching bills:', error)
        return
    }

    console.log('Found Bills:', JSON.stringify(bills, null, 2))
}

checkBills()
