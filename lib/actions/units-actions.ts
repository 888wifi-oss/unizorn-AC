// lib/actions/units-actions.ts
"use server"

import { createClient } from '@/lib/supabase/server'
import { checkPermission } from '@/lib/permissions/permission-checker'
import { Unit, Owner, Tenant, TenancyHistory, RentalPayment } from '@/lib/types/permissions'
import { revalidatePath } from 'next/cache'

/**
 * Get all units with enhanced data
 */
export async function getUnits(userId: string, projectId?: string, companyId?: string) {
  const supabase = await createClient()

  try {
    const check = await checkPermission(userId, 'units.view', companyId, projectId)
    if (!check.allowed) {
      return { success: false, error: check.reason }
    }

    let query = supabase
      .from('units')
      .select(`
        *,
        project:projects(id, name, slug),
        current_owner:owners!current_owner_id(
          id,
          name,
          email,
          phone,
          national_id,
          is_primary,
          ownership_percentage,
          owner_occupies
        ),
        current_tenant:tenants!current_tenant_id(
          id,
          name,
          email,
          phone,
          status,
          rental_price,
          move_in_date
        )
      `)
      .order('unit_number', { ascending: true })

    if (projectId) {
      query = query.eq('project_id', projectId)
    }

    const { data, error } = await query

    if (error) throw error

    return { success: true, units: data || [] }
  } catch (error: any) {
    console.error('[getUnits] Error:', error)
    return { success: false, error: error.message, units: [] }
  }
}

/**
 * Get unit by ID with full details
 */
export async function getUnitById(userId: string, unitId: string) {
  const supabase = await createClient()

  try {
    const check = await checkPermission(userId, 'units.view')
    if (!check.allowed) {
      return { success: false, error: check.reason }
    }

    const { data: unit, error } = await supabase
      .from('units')
      .select(`
        *,
        project:projects(id, name, slug),
        current_owner:owners!current_owner_id(*),
        current_tenant:tenants!current_tenant_id(*)
      `)
      .eq('id', unitId)
      .single()

    if (error) throw error

    return { success: true, unit }
  } catch (error: any) {
    console.error('[getUnitById] Error:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Create new unit
 */
export async function createUnit(
  userId: string,
  unitData: {
    unit_number: string
    project_id: string
    building_id?: string
    floor: number
    size: number
    unit_type: string
    ownership_type: string
    number_of_bedrooms: number
    number_of_bathrooms: number
    furnishing_status: string
    view_type?: string
    parking_space_count: number
    parking_space_number?: string
    default_rental_price: number
    sale_price: number
    notes?: string
    description?: string
  }
) {
  const supabase = await createClient()

  try {
    const check = await checkPermission(userId, 'units.create')
    if (!check.allowed) {
      return { success: false, error: check.reason }
    }

    const { data, error } = await supabase
      .from('units')
      .insert([{
        ...unitData,
        status: 'vacant'
      }])
      .select()
      .single()

    if (error) throw error

    revalidatePath('/units')
    return { success: true, unit: data }
  } catch (error: any) {
    console.error('[createUnit] Error:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Update unit
 */
export async function updateUnit(
  userId: string,
  unitId: string,
  unitData: Partial<Unit>
) {
  const supabase = await createClient()

  try {
    const check = await checkPermission(userId, 'units.update')
    if (!check.allowed) {
      return { success: false, error: check.reason }
    }

    const { data, error } = await supabase
      .from('units')
      .update({
        ...unitData,
        updated_at: new Date().toISOString()
      })
      .eq('id', unitId)
      .select()
      .single()

    if (error) throw error

    revalidatePath('/units')
    return { success: true, unit: data }
  } catch (error: any) {
    console.error('[updateUnit] Error:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Delete unit
 */
export async function deleteUnit(userId: string, unitId: string) {
  const supabase = await createClient()

  try {
    const check = await checkPermission(userId, 'units.delete')
    if (!check.allowed) {
      return { success: false, error: check.reason }
    }

    const { error } = await supabase
      .from('units')
      .delete()
      .eq('id', unitId)

    if (error) throw error

    revalidatePath('/units')
    return { success: true }
  } catch (error: any) {
    console.error('[deleteUnit] Error:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Get owners for a unit
 */
export async function getUnitOwners(userId: string, unitId: string) {
  const supabase = await createClient()

  try {
    const check = await checkPermission(userId, 'units.view')
    if (!check.allowed) {
      return { success: false, error: check.reason }
    }

    const { data, error } = await supabase
      .from('owners')
      .select('*')
      .eq('unit_id', unitId)
      .order('is_primary', { ascending: false })

    if (error) throw error

    return { success: true, owners: data || [] }
  } catch (error: any) {
    console.error('[getUnitOwners] Error:', error)
    return { success: false, error: error.message, owners: [] }
  }
}

/**
 * Create owner for a unit
 */
export async function createOwner(
  userId: string,
  ownerData: {
    unit_id: string
    name: string
    national_id?: string
    email?: string
    phone?: string
    address?: string
    is_primary: boolean
    ownership_percentage: number
    owner_occupies: boolean
    start_date: string
    end_date?: string
    notes?: string
  }
) {
  const supabase = await createClient()

  try {
    const check = await checkPermission(userId, 'units.update')
    if (!check.allowed) {
      return { success: false, error: check.reason }
    }

    // Clean up date fields - convert empty strings to null
    const cleanedOwnerData = {
      ...ownerData,
      start_date: ownerData.start_date || new Date().toISOString().split('T')[0],
      end_date: ownerData.end_date && ownerData.end_date.trim() !== '' ? ownerData.end_date : null,
      // Convert empty national_id to null to avoid unique constraint violation
      national_id: ownerData.national_id && ownerData.national_id.trim() !== '' ? ownerData.national_id : null,
      // Convert empty email to null
      email: ownerData.email && ownerData.email.trim() !== '' ? ownerData.email : null,
      // Convert empty phone to null
      phone: ownerData.phone && ownerData.phone.trim() !== '' ? ownerData.phone : null,
      // Convert empty address to null
      address: ownerData.address && ownerData.address.trim() !== '' ? ownerData.address : null
    }

    const { data, error } = await supabase
      .from('owners')
      .insert([cleanedOwnerData])
      .select()
      .single()

    if (error) throw error

    // Update unit's current_owner_id if this is the primary owner
    if (ownerData.is_primary) {
      await supabase
        .from('units')
        .update({ current_owner_id: data.id })
        .eq('id', ownerData.unit_id)
    }

    revalidatePath('/units')
    return { success: true, owner: data }
  } catch (error: any) {
    console.error('[createOwner] Error:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Update owner
 */
export async function updateOwner(
  userId: string,
  ownerId: string,
  ownerData: Partial<{
    name: string
    national_id: string
    email: string
    phone: string
    address: string
    is_primary: boolean
    ownership_percentage: number
    owner_occupies: boolean
    start_date: string
    end_date: string
    notes: string
  }>
) {
  const supabase = await createClient()

  try {
    const check = await checkPermission(userId, 'units.update')
    if (!check.allowed) {
      return { success: false, error: check.reason }
    }

    // Clean up date fields and empty strings
    const cleanedOwnerData = {
      ...ownerData,
      end_date: ownerData.end_date && ownerData.end_date.trim() !== '' ? ownerData.end_date : null,
      // Convert empty national_id to null to avoid unique constraint violation
      national_id: ownerData.national_id && ownerData.national_id.trim() !== '' ? ownerData.national_id : null,
      // Convert empty email to null
      email: ownerData.email && ownerData.email.trim() !== '' ? ownerData.email : null,
      // Convert empty phone to null
      phone: ownerData.phone && ownerData.phone.trim() !== '' ? ownerData.phone : null,
      // Convert empty address to null
      address: ownerData.address && ownerData.address.trim() !== '' ? ownerData.address : null,
      updated_at: new Date().toISOString()
    }

    const { data, error } = await supabase
      .from('owners')
      .update(cleanedOwnerData)
      .eq('id', ownerId)
      .select()
      .single()

    if (error) throw error

    revalidatePath('/units')
    return { success: true, owner: data }
  } catch (error: any) {
    console.error('[updateOwner] Error:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Delete owner
 */
export async function deleteOwner(userId: string, ownerId: string) {
  const supabase = await createClient()

  try {
    const check = await checkPermission(userId, 'units.update')
    if (!check.allowed) {
      return { success: false, error: check.reason }
    }

    const { error } = await supabase
      .from('owners')
      .delete()
      .eq('id', ownerId)

    if (error) throw error

    revalidatePath('/units')
    return { success: true }
  } catch (error: any) {
    console.error('[deleteOwner] Error:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Get tenants for a unit
 */
export async function getUnitTenants(userId: string, unitId: string) {
  const supabase = await createClient()

  try {
    const check = await checkPermission(userId, 'units.view')
    if (!check.allowed) {
      return { success: false, error: check.reason }
    }

    const { data, error } = await supabase
      .from('tenants')
      .select(`
        *,
        owner:owners(name, email, phone)
      `)
      .eq('unit_id', unitId)
      .order('created_at', { ascending: false })

    if (error) throw error

    return { success: true, tenants: data || [] }
  } catch (error: any) {
    console.error('[getUnitTenants] Error:', error)
    return { success: false, error: error.message, tenants: [] }
  }
}

/**
 * Get owners and tenants for a unit by unit_number
 */
export async function getUnitResidents(unitNumber: string) {
  const supabase = await createClient()

  try {
    // First, find the unit by unit_number
    const { data: unit, error: unitError } = await supabase
      .from('units')
      .select('id, unit_number')
      .eq('unit_number', unitNumber)
      .single()

    if (unitError) throw unitError

    if (!unit) {
      return { success: false, error: 'Unit not found', residents: [] }
    }

    // Get owners
    const { data: owners, error: ownersError } = await supabase
      .from('owners')
      .select('id, name, email, phone, is_primary')
      .eq('unit_id', unit.id)
      .order('is_primary', { ascending: false })

    if (ownersError) {
      console.error('[getUnitResidents] Owners error:', ownersError)
    }

    // Get active tenants
    const { data: tenants, error: tenantsError } = await supabase
      .from('tenants')
      .select('id, name, email, phone, status')
      .eq('unit_id', unit.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false })

    if (tenantsError) {
      console.error('[getUnitResidents] Tenants error:', tenantsError)
    }

    const residents = [
      ...(owners || []).map(owner => ({
        id: owner.id,
        name: owner.name,
        email: owner.email,
        phone: owner.phone,
        type: 'owner' as const,
        is_primary: owner.is_primary
      })),
      ...(tenants || []).map(tenant => ({
        id: tenant.id,
        name: tenant.name,
        email: tenant.email,
        phone: tenant.phone,
        type: 'tenant' as const,
        is_primary: false
      }))
    ]

    return { success: true, residents }
  } catch (error: any) {
    console.error('[getUnitResidents] Error:', error)
    return { success: false, error: error.message, residents: [] }
  }
}

/**
 * Create tenant for a unit
 */
export async function createTenant(
  userId: string,
  tenantData: {
    unit_id: string
    owner_id?: string
    company_id?: string
    name: string
    national_id?: string
    gender?: string
    date_of_birth?: string
    email?: string
    phone?: string
    address?: string
    emergency_contact_name?: string
    emergency_contact_phone?: string
    move_in_date?: string
    move_out_date?: string
    rental_contract_no?: string
    rental_price: number
    deposit_amount: number
    payment_method?: string
    status: string
    notes?: string
  }
) {
  const supabase = await createClient()

  try {
    const check = await checkPermission(userId, 'units.update')
    if (!check.allowed) {
      return { success: false, error: check.reason }
    }

    // Clean up date fields - convert empty strings to null
    const cleanedTenantData = {
      ...tenantData,
      date_of_birth: tenantData.date_of_birth && tenantData.date_of_birth.trim() !== '' ? tenantData.date_of_birth : null,
      move_in_date: tenantData.move_in_date && tenantData.move_in_date.trim() !== '' ? tenantData.move_in_date : null,
      move_out_date: tenantData.move_out_date && tenantData.move_out_date.trim() !== '' ? tenantData.move_out_date : null
    }

    const { data, error } = await supabase
      .from('tenants')
      .insert([cleanedTenantData])
      .select()
      .single()

    if (error) throw error

    // Update unit's current_tenant_id
    await supabase
      .from('units')
      .update({ current_tenant_id: data.id })
      .eq('id', tenantData.unit_id)

    // Create tenancy history record
    await supabase
      .from('tenancy_history')
      .insert([{
        unit_id: tenantData.unit_id,
        tenant_id: data.id,
        rental_contract_no: tenantData.rental_contract_no,
        rental_start_date: tenantData.move_in_date || new Date().toISOString().split('T')[0],
        rental_price: tenantData.rental_price,
        deposit_amount: tenantData.deposit_amount,
        move_in_date: tenantData.move_in_date,
        status: 'active'
      }])

    revalidatePath('/units')
    return { success: true, tenant: data }
  } catch (error: any) {
    console.error('[createTenant] Error:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Update tenant
 */
export async function updateTenant(
  userId: string,
  tenantId: string,
  tenantData: Partial<{
    name: string
    national_id: string
    gender: string
    date_of_birth: string
    email: string
    phone: string
    address: string
    emergency_contact_name: string
    emergency_contact_phone: string
    move_in_date: string
    move_out_date: string
    rental_contract_no: string
    rental_price: number
    deposit_amount: number
    payment_method: string
    status: string
    notes: string
  }>
) {
  const supabase = await createClient()

  try {
    const check = await checkPermission(userId, 'units.update')
    if (!check.allowed) {
      return { success: false, error: check.reason }
    }

    // Clean up date fields
    const cleanedTenantData = {
      ...tenantData,
      date_of_birth: tenantData.date_of_birth && tenantData.date_of_birth.trim() !== '' ? tenantData.date_of_birth : null,
      move_in_date: tenantData.move_in_date && tenantData.move_in_date.trim() !== '' ? tenantData.move_in_date : null,
      move_out_date: tenantData.move_out_date && tenantData.move_out_date.trim() !== '' ? tenantData.move_out_date : null,
      updated_at: new Date().toISOString()
    }

    const { data, error } = await supabase
      .from('tenants')
      .update(cleanedTenantData)
      .eq('id', tenantId)
      .select()
      .single()

    if (error) throw error

    revalidatePath('/units')
    return { success: true, tenant: data }
  } catch (error: any) {
    console.error('[updateTenant] Error:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Delete tenant
 */
export async function deleteTenant(userId: string, tenantId: string) {
  const supabase = await createClient()

  try {
    const check = await checkPermission(userId, 'units.update')
    if (!check.allowed) {
      return { success: false, error: check.reason }
    }

    const { error } = await supabase
      .from('tenants')
      .delete()
      .eq('id', tenantId)

    if (error) throw error

    revalidatePath('/units')
    return { success: true }
  } catch (error: any) {
    console.error('[deleteTenant] Error:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Get tenancy history for a unit
 */
export async function getUnitTenancyHistory(userId: string, unitId: string) {
  const supabase = await createClient()

  try {
    const check = await checkPermission(userId, 'units.view')
    if (!check.allowed) {
      return { success: false, error: check.reason }
    }

    const { data, error } = await supabase
      .from('tenancy_history')
      .select(`
        *,
        tenant:tenants(name, email, phone)
      `)
      .eq('unit_id', unitId)
      .order('rental_start_date', { ascending: false })

    if (error) throw error

    return { success: true, history: data || [] }
  } catch (error: any) {
    console.error('[getUnitTenancyHistory] Error:', error)
    return { success: false, error: error.message, history: [] }
  }
}

/**
 * Get units with all owners and tenants pre-loaded (optimized batch query)
 * This prevents N+1 query problem when loading units with their owners/tenants
 */
export async function getUnitsWithResidents(userId: string, projectId?: string | null) {
  const supabase = await createClient()

  try {
    console.log('[getUnitsWithResidents] Checking permission for userId:', userId, 'projectId:', projectId)
    const check = await checkPermission(userId, 'units.view')
    console.log('[getUnitsWithResidents] Permission check result:', check)

    if (!check.allowed) {
      console.error('[getUnitsWithResidents] Permission denied:', check.reason)
      return { success: false, error: check.reason, units: [] }
    }

    // Get all units with all necessary fields for display
    let unitsQuery = supabase
      .from('units')
      .select('*')
      .order('unit_number')

    if (projectId) {
      unitsQuery = unitsQuery.eq('project_id', projectId)
    }

    const { data: units, error: unitsError } = await unitsQuery

    if (unitsError) throw unitsError
    if (!units || units.length === 0) {
      return { success: true, units: [] }
    }

    // Get all owners and tenants in parallel
    const unitIds = units.map(u => u.id)

    const [ownersResult, tenantsResult] = await Promise.all([
      supabase.from('owners').select('*').in('unit_id', unitIds),
      supabase.from('tenants').select('*').in('unit_id', unitIds).eq('status', 'active')
    ])

    if (ownersResult.error) throw ownersResult.error
    if (tenantsResult.error) throw tenantsResult.error

    // Build map for quick lookup
    const ownersMap = new Map<string, any[]>()
    const tenantsMap = new Map<string, any[]>()

    if (ownersResult.data) {
      for (const owner of ownersResult.data) {
        if (!ownersMap.has(owner.unit_id)) {
          ownersMap.set(owner.unit_id, [])
        }
        ownersMap.get(owner.unit_id)!.push(owner)
      }
    }

    if (tenantsResult.data) {
      for (const tenant of tenantsResult.data) {
        if (!tenantsMap.has(tenant.unit_id)) {
          tenantsMap.set(tenant.unit_id, [])
        }
        tenantsMap.get(tenant.unit_id)!.push(tenant)
      }
    }

    // Combine data
    const unitsWithResidents = units.map(unit => ({
      ...unit,
      owners: ownersMap.get(unit.id) || [],
      tenants: tenantsMap.get(unit.id) || []
    }))

    return { success: true, units: unitsWithResidents }
  } catch (error: any) {
    console.error('[getUnitsWithResidents] Error:', error)
    return { success: false, error: error.message, units: [] }
  }
}

/**
 * Get all resident accounts for a project (optimized - single query)
 * This fetches all owners and tenants in one go to avoid multiple requests
 */
export async function getAllResidentAccounts(userId: string, projectId?: string | null) {
  const supabase = await createClient()

  try {
    const check = await checkPermission(userId, 'units.view')
    if (!check.allowed) {
      return { success: false, error: check.reason, accounts: [] }
    }

    // Build query with filters
    let unitsQuery = supabase
      .from('units')
      .select('id, unit_number, username, password, project_id')
      .order('unit_number')

    // Apply project filter at database level if specified
    if (projectId) {
      unitsQuery = unitsQuery.eq('project_id', projectId)
    }

    const { data: units, error: unitsError } = await unitsQuery

    if (unitsError) throw unitsError

    if (!units || units.length === 0) {
      return { success: true, accounts: [] }
    }

    // Get all owners and tenants in parallel batch queries
    const unitIds = units.map(u => u.id)

    const [ownersResult, tenantsResult] = await Promise.all([
      supabase
        .from('owners')
        .select('*')
        .in('unit_id', unitIds),
      supabase
        .from('tenants')
        .select('*')
        .in('unit_id', unitIds)
        .eq('status', 'active')
    ])

    if (ownersResult.error) throw ownersResult.error
    if (tenantsResult.error) throw tenantsResult.error

    // Create unit lookup map for O(1) access
    const unitMap = new Map(units.map(u => [u.id, u]))

    // Build accounts array efficiently
    const accounts: any[] = []

    // Process owners
    if (ownersResult.data) {
      for (const owner of ownersResult.data) {
        const unit = unitMap.get(owner.unit_id)
        if (unit) {
          accounts.push({
            unit_id: unit.id,
            unit_number: unit.unit_number,
            owner: owner,
            has_account: !!(unit.username && unit.password),
            email: owner.email || undefined,
            created_at: owner.created_at,
            last_sign_in: undefined // Can be added later if tracking is needed
          })
        }
      }
    }

    // Process tenants
    if (tenantsResult.data) {
      for (const tenant of tenantsResult.data) {
        const unit = unitMap.get(tenant.unit_id)
        if (unit) {
          accounts.push({
            unit_id: unit.id,
            unit_number: unit.unit_number,
            tenant: tenant,
            has_account: !!(unit.username && unit.password),
            email: tenant.email || undefined,
            created_at: tenant.created_at,
            last_sign_in: undefined
          })
        }
      }
    }

    console.log('[getAllResidentAccounts] Loaded', accounts.length, 'accounts')
    return { success: true, accounts }
  } catch (error: any) {
    console.error('[getAllResidentAccounts] Error:', error)
    return { success: false, error: error.message, accounts: [] }
  }
}

/**
 * Get rental payments for a unit
 */
export async function getUnitRentalPayments(userId: string, unitId: string) {
  const supabase = await createClient()

  try {
    const check = await checkPermission(userId, 'units.view')
    if (!check.allowed) {
      return { success: false, error: check.reason }
    }

    const { data, error } = await supabase
      .from('rental_payments')
      .select(`
        *,
        tenant:tenants(name, email, phone)
      `)
      .eq('unit_id', unitId)
      .order('year', { ascending: false })
      .order('month', { ascending: false })

    if (error) throw error

    return { success: true, payments: data || [] }
  } catch (error: any) {
    console.error('[getUnitRentalPayments] Error:', error)
    return { success: false, error: error.message, payments: [] }
  }
}

/**
 * Create rental payment
 */
export async function createRentalPayment(
  userId: string,
  paymentData: {
    tenant_id: string
    unit_id: string
    month: string
    year: number
    amount: number
    status: string
    payment_date?: string
    payment_method?: string
    reference_number?: string
    notes?: string
  }
) {
  const supabase = await createClient()

  try {
    const check = await checkPermission(userId, 'billing.create')
    if (!check.allowed) {
      return { success: false, error: check.reason }
    }

    // Clean up date fields - convert empty strings to null
    const cleanedPaymentData = {
      ...paymentData,
      payment_date: paymentData.payment_date && paymentData.payment_date.trim() !== '' ? paymentData.payment_date : null
    }

    const { data, error } = await supabase
      .from('rental_payments')
      .insert([cleanedPaymentData])
      .select()
      .single()

    if (error) throw error

    revalidatePath('/units')
    return { success: true, payment: data }
  } catch (error: any) {
    console.error('[createRentalPayment] Error:', error)
    return { success: false, error: error.message }
  }
}
