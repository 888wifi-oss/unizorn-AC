
import { createClient } from "@supabase/supabase-js"
import * as dotenv from "dotenv"
import * as fs from "fs"
import * as path from "path"

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase credentials")
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function runMigration() {
    console.log("Running migration 211_add_bill_details.sql...")

    const sqlPath = path.join(process.cwd(), 'scripts', '211_add_bill_details.sql')
    if (!fs.existsSync(sqlPath)) {
        console.error("Migration file not found:", sqlPath)
        return
    }

    const sql = fs.readFileSync(sqlPath, 'utf8')

    // Execute raw SQL using rpc if available, or just try to use pg via some other method?
    // Supabase JS client doesn't support raw SQL execution directly on the public interface usually, 
    // unless there is a specific RPC function set up for it (like 'exec_sql').
    // A common pattern in these projects is to have a helper or just rely on the user running it.
    // However, I see many migration scripts. I will try to use the 'pg' library if I can, but I don't know if it's installed.
    // I will check package.json or just assume standard supabase usage.

    // Wait, I can't execute RAW SQL easily via supabase-js without an RPC. 
    // But I can try to use the `admin` API if available, or just instruct the user.
    // Let me check if there's a database helper in `lib/supabase` or similar.
    // Actually, I can use the 'run_command' tool to run it if I had psql, but I don't know if psql is available.

    // Alternative: I'll assume there is a way or I'll try to find a previously used migration runner.
    // I don't see a standard migration runner in the file list.

    // Strategy: I will rely on the user running it OR I will try to assume the environment has `POSTGRES_URL` and use `postgres` package?
    // I'll skip the automigration script for a second and check if I can 'search' for how migrations are run.

    // actually, I'll just skip the runner script for now and try to adapt `db-types.ts` first, 
    // then tell the user to run the SQL or I'll try to run it via a direct postgres connection if `pg` is installed.
    // I'll write a simple script that TRIES to use `postgres` (pg) and invalidates if module not found.

    // Better yet, I'll just write the file and tell the user I've created it, but since I have `run_command` safe auto run, 
    // I can try `npx ts-node scripts/run_migration.ts` if I check for `pg`.

    try {
        // Attempt to require pg
        const { Client } = require('pg')
        // We need a connection string. Usually in .env.local as DATABASE_URL or POSTGRES_URL
        const dbUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL

        if (!dbUrl) {
            console.error("No DATABASE_URL or POSTGRES_URL found in env.")
            return
        }

        const client = new Client({ connectionString: dbUrl })
        await client.connect()
        await client.query(sql)
        await client.end()
        console.log("Migration executed successfully.")
    } catch (e: any) {
        if (e.code === 'MODULE_NOT_FOUND') {
            console.error("pg module not found. Cannot auto-run migration.")
        } else {
            console.error("Migration failed:", e)
        }
    }
}

runMigration()
