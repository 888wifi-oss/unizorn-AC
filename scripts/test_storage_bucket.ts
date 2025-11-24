/**
 * Test script to check if payment-slips bucket exists
 * Run with: npx tsx scripts/test_storage_bucket.ts
 */

import { createClient } from "@supabase/supabase-js"
import * as dotenv from "dotenv"

dotenv.config({ path: ".env.local" })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("❌ Missing Supabase environment variables")
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testStorageBucket() {
  console.log("🔍 Testing payment-slips bucket...\n")

  try {
    // 1. Try to list buckets
    console.log("1️⃣ Checking if bucket exists...")
    const { data: buckets, error: listError } = await supabase.storage.listBuckets()
    
    if (listError) {
      console.error("❌ Error listing buckets:", listError.message)
      console.log("\n💡 This might be a permissions issue")
    } else {
      console.log("✅ Buckets listed successfully")
      const bucketExists = buckets?.some(b => b.name === 'payment-slips')
      console.log(`   Bucket "payment-slips" exists: ${bucketExists ? "✅ YES" : "❌ NO"}`)
      
      if (buckets && buckets.length > 0) {
        console.log("\n   Available buckets:")
        buckets.forEach(b => {
          console.log(`   - ${b.name} (${b.public ? 'Public' : 'Private'})`)
        })
      }
    }

    // 2. Try to list files in the bucket
    console.log("\n2️⃣ Testing bucket access...")
    const { data: files, error: filesError } = await supabase.storage
      .from('payment-slips')
      .list('', { limit: 1 })

    if (filesError) {
      console.error("❌ Error accessing bucket:", filesError.message)
      
      if (filesError.message.includes('not found') || filesError.message.includes('Bucket')) {
        console.log("\n💡 SOLUTION:")
        console.log("   The bucket doesn't exist. Please create it:")
        console.log("   1. Go to Supabase Dashboard > Storage")
        console.log("   2. Click 'New Bucket'")
        console.log("   3. Name: payment-slips (Private)")
        console.log("   4. Click 'Create bucket'")
      } else if (filesError.message.includes('permission') || filesError.message.includes('policy')) {
        console.log("\n💡 SOLUTION:")
        console.log("   The bucket exists but you don't have permission.")
        console.log("   Please check RLS Policies:")
        console.log("   1. Go to bucket 'payment-slips' > Policies")
        console.log("   2. Make sure you have these policies:")
        console.log("      - INSERT: bucket_id = 'payment-slips'")
        console.log("      - SELECT: bucket_id = 'payment-slips'")
        console.log("      - DELETE: bucket_id = 'payment-slips'")
      }
    } else {
      console.log("✅ Bucket access successful")
      console.log(`   Files in bucket: ${files?.length || 0}`)
    }

    // 3. Try to upload a test file
    console.log("\n3️⃣ Testing upload permission...")
    const testFileName = `test-${Date.now()}.txt`
    const testContent = new Blob(['test'], { type: 'text/plain' })
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('payment-slips')
      .upload(testFileName, testContent, {
        contentType: 'text/plain',
        upsert: false,
      })

    if (uploadError) {
      console.error("❌ Upload test failed:", uploadError.message)
      
      if (uploadError.message.includes('policy') || uploadError.message.includes('RLS')) {
        console.log("\n💡 SOLUTION:")
        console.log("   Missing INSERT policy. Add this policy:")
        console.log("   - Policy name: Allow authenticated uploads")
        console.log("   - Operation: INSERT")
        console.log("   - Policy definition: bucket_id = 'payment-slips'")
      }
    } else {
      console.log("✅ Upload test successful")
      console.log(`   Uploaded file: ${uploadData.path}`)
      
      // Clean up - delete test file
      await supabase.storage
        .from('payment-slips')
        .remove([testFileName])
      console.log("   Test file cleaned up")
    }

  } catch (error: any) {
    console.error("\n❌ Unexpected error:", error.message)
    console.error(error)
  }

  console.log("\n✅ Test completed")
}

testStorageBucket()


