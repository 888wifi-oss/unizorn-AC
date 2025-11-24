"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export interface BulkImportUnitsRequest {
  units: Array<{
    unit_number: string
    type: string
    floor: number
    area: number
    bedroom?: number
    bathroom?: number
    owner_name: string
    owner_email?: string
    tenant_name?: string
    tenant_email?: string
    status: string
    rent_price?: number
    project_id: string
  }>
}

export async function bulkImportUnits(request: BulkImportUnitsRequest) {
  const supabase = await createClient()
  
  console.log('[bulkImportUnits] Starting bulk import with', request.units.length, 'units')
  
  try {
    const results = {
      success: 0,
      failed: 0,
      errors: [] as Array<{ unit_number: string; error: string }>
    }
    
    for (const unitData of request.units) {
        console.log('[bulkImportUnits] Processing unit:', unitData.unit_number)
      try {
        // Map status to database enum
        let dbStatus = 'vacant'
        if (unitData.status === 'มีผู้เช่า') {
          dbStatus = 'occupied'
        } else if (unitData.status === 'เจ้าของอยู่เอง') {
          dbStatus = 'owner_occupied'
        }
        
        console.log('[bulkImportUnits] Inserting unit with data:', {
          unit_number: unitData.unit_number,
          floor: unitData.floor,
          size: unitData.area,
          status: dbStatus,
          project_id: unitData.project_id
        })
        
        // Insert unit
        const { data: unit, error: unitError } = await supabase
          .from('units')
          .insert([{
            unit_number: unitData.unit_number,
            floor: unitData.floor,
            size: unitData.area,
            owner_name: unitData.owner_name,
            owner_email: unitData.owner_email,
            residents: 1,
            status: dbStatus,
            project_id: unitData.project_id,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }])
          .select()
          .single()
        
        if (unitError) {
          console.error('[bulkImportUnits] Unit insert error:', unitError)
          throw unitError
        }
        
        console.log('[bulkImportUnits] Unit inserted successfully:', unit?.id)
        
        let ownerId: string | undefined
        let tenantId: string | undefined
        
        // Insert owner regardless of tenant status
        const { data: owner, error: ownerError } = await supabase
          .from('owners')
          .insert([{
            unit_id: unit.id,
            name: unitData.owner_name,
            email: unitData.owner_email,
            is_primary: true,
            ownership_percentage: 100,
            start_date: new Date().toISOString().split('T')[0]
          }])
          .select()
          .single()
        
        if (ownerError) {
          console.error('[bulkImportUnits] Owner insert error:', ownerError)
        } else {
          ownerId = owner?.id
          console.log('[bulkImportUnits] Owner inserted successfully:', ownerId)
        }
        
        // If there's tenant data, insert tenant
        if (unitData.tenant_name) {
          const { data: tenant, error: tenantError } = await supabase
            .from('tenants')
            .insert([{
              unit_id: unit.id,
              owner_id: ownerId,
              name: unitData.tenant_name,
              email: unitData.tenant_email,
              status: 'active',
              move_in_date: new Date().toISOString().split('T')[0],
              rental_contract_no: '',
              rental_price: unitData.rent_price || 0,
              deposit_amount: 0,
              payment_method: 'bank_transfer'
            }])
            .select()
            .single()
          
          if (tenantError) {
            console.error('[bulkImportUnits] Tenant insert error:', tenantError)
          } else {
            tenantId = tenant?.id
            console.log('[bulkImportUnits] Tenant inserted successfully:', tenantId)
          }
        }
        
        // Update unit with current_owner_id and current_tenant_id
        if (ownerId || tenantId) {
          const updateData: any = {
            updated_at: new Date().toISOString()
          }
          
          if (ownerId) {
            updateData.current_owner_id = ownerId
          }
          
          if (tenantId) {
            updateData.current_tenant_id = tenantId
          }
          
          const { error: updateError } = await supabase
            .from('units')
            .update(updateData)
            .eq('id', unit.id)
          
          if (updateError) {
            console.error('[bulkImportUnits] Update unit error:', updateError)
          } else {
            console.log('[bulkImportUnits] Unit updated with owner and tenant IDs:', updateData)
          }
        }
        
        results.success++
        console.log('[bulkImportUnits] Unit imported successfully. Total success:', results.success)
      } catch (error: any) {
        console.error('[bulkImportUnits] Error importing unit:', error)
        results.failed++
        results.errors.push({
          unit_number: unitData.unit_number,
          error: error.message
        })
      }
    }
    
    console.log('[bulkImportUnits] Import completed. Success:', results.success, 'Failed:', results.failed)
    
    revalidatePath("/(admin)/units")
    
    return {
      success: true,
      imported: results.success,
      failed: results.failed,
      errors: results.errors
    }
  } catch (error: any) {
    console.error('[bulkImportUnits] Fatal error:', error)
    return {
      success: false,
      imported: 0,
      failed: 0,
      errors: [],
      error: error.message
    }
  }
}
