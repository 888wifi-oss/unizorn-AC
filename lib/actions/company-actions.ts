// lib/actions/company-actions.ts
"use server"

import { createClient } from '@/lib/supabase/server'
import { checkPermission } from '@/lib/permissions/permission-checker'
import { Company } from '@/lib/types/permissions'
import { revalidatePath } from 'next/cache'

/**
 * Get all companies (filtered by user's scope)
 */
export async function getCompanies(userId: string) {
  const supabase = await createClient()
  
  try {
    // Check permission
    const check = await checkPermission(userId, 'companies.view')
    if (!check.allowed) {
      return { success: false, error: check.reason }
    }
    
    // Check if user is Super Admin
    const { data: adminRoles } = await supabase
      .from('user_roles')
      .select('role:roles(name)')
      .eq('user_id', userId)
      .eq('is_active', true)
    
    const isSuperAdmin = adminRoles?.some((ur: any) => ur.role?.name === 'super_admin')
    
    // If Super Admin, return all companies
    if (isSuperAdmin) {
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return { success: true, companies: data || [] }
    }
    
    // For Company Admin and Project Admin, get companies from their roles
    const { data: userCompanyRoles } = await supabase
      .from('user_roles')
      .select('company_id, project:projects(company_id)')
      .eq('user_id', userId)
      .eq('is_active', true)
    
    if (!userCompanyRoles || userCompanyRoles.length === 0) {
      return { success: true, companies: [] }
    }
    
    // Get unique company IDs
    const companyIds = Array.from(new Set(
      userCompanyRoles
        .map((ur: any) => ur.company_id || ur.project?.company_id)
        .filter(Boolean)
    ))
    
    if (companyIds.length === 0) {
      return { success: true, companies: [] }
    }
    
    // Get companies
    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .in('id', companyIds)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    
    return { success: true, companies: data || [] }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

/**
 * Get company by ID
 */
export async function getCompanyById(userId: string, companyId: string) {
  const supabase = await createClient()
  
  try {
    const check = await checkPermission(userId, 'companies.view')
    if (!check.allowed) {
      return { success: false, error: check.reason }
    }
    
    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .eq('id', companyId)
      .single()
    
    if (error) throw error
    
    return { success: true, company: data }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

/**
 * Create company
 */
export async function createCompany(userId: string, companyData: Partial<Company>) {
  const supabase = await createClient()
  
  try {
    const check = await checkPermission(userId, 'companies.create')
    if (!check.allowed) {
      return { success: false, error: check.reason }
    }
    
    const { data, error } = await supabase
      .from('companies')
      .insert([companyData])
      .select()
      .single()
    
    if (error) throw error
    
    revalidatePath('/companies')
    return { success: true, company: data }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

/**
 * Update company
 */
export async function updateCompany(userId: string, companyId: string, companyData: Partial<Company>) {
  const supabase = await createClient()
  
  try {
    const check = await checkPermission(userId, 'companies.update')
    if (!check.allowed) {
      return { success: false, error: check.reason }
    }
    
    const { data, error } = await supabase
      .from('companies')
      .update(companyData)
      .eq('id', companyId)
      .select()
      .single()
    
    if (error) throw error
    
    revalidatePath('/companies')
    return { success: true, company: data }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

/**
 * Delete company
 */
export async function deleteCompany(userId: string, companyId: string) {
  const supabase = await createClient()
  
  try {
    const check = await checkPermission(userId, 'companies.delete')
    if (!check.allowed) {
      return { success: false, error: check.reason }
    }
    
    const { error } = await supabase
      .from('companies')
      .delete()
      .eq('id', companyId)
    
    if (error) throw error
    
    revalidatePath('/companies')
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

/**
 * Toggle company status
 */
export async function toggleCompanyStatus(userId: string, companyId: string, isActive: boolean) {
  return updateCompany(userId, companyId, { is_active: isActive })
}
