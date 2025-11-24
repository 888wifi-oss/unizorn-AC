// lib/actions/project-actions.ts
"use server"

import { createClient } from '@/lib/supabase/server'
import { checkPermission, getUserAccessibleProjects, canManageProject } from '@/lib/permissions/permission-checker'
import { Project } from '@/lib/types/permissions'
import { revalidatePath } from 'next/cache'

/**
 * Get all projects
 */
export async function getProjects(userId: string, companyId?: string) {
  const supabase = await createClient()
  
  try {
    const check = await checkPermission(userId, 'projects.view', companyId)
    if (!check.allowed) {
      return { success: false, error: check.reason }
    }
    
    // Get user's accessible projects
    const accessibleProjectIds = await getUserAccessibleProjects(userId)
    
    let query = supabase
      .from('projects')
      .select(`
        *,
        company:companies(id, name, slug)
      `)
      .order('created_at', { ascending: false })
    
    // Filter by accessible projects (unless Super Admin has all)
    if (accessibleProjectIds.length > 0) {
      query = query.in('id', accessibleProjectIds)
    }
    
    if (companyId) {
      query = query.eq('company_id', companyId)
    }
    
    const { data, error } = await query
    
    if (error) throw error
    
    return { success: true, projects: data || [] }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

/**
 * Get project by ID
 */
export async function getProjectById(userId: string, projectId: string) {
  const supabase = await createClient()
  
  try {
    const { data, error } = await supabase
      .from('projects')
      .select(`
        *,
        company:companies(*)
      `)
      .eq('id', projectId)
      .single()
    
    if (error) throw error
    
    const check = await checkPermission(userId, 'projects.view', data.company_id)
    if (!check.allowed) {
      return { success: false, error: check.reason }
    }
    
    return { success: true, project: data }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

/**
 * Create project
 */
export async function createProject(userId: string, projectData: Partial<Project>) {
  const supabase = await createClient()
  
  try {
    const check = await checkPermission(userId, 'projects.create', projectData.company_id)
    if (!check.allowed) {
      return { success: false, error: check.reason }
    }
    
    const { data, error } = await supabase
      .from('projects')
      .insert([projectData])
      .select()
      .single()
    
    if (error) throw error
    
    revalidatePath('/projects')
    return { success: true, project: data }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

/**
 * Update project
 */
export async function updateProject(userId: string, projectId: string, projectData: Partial<Project>) {
  const supabase = await createClient()
  
  try {
    // Get project's company
    const { data: project } = await supabase
      .from('projects')
      .select('company_id')
      .eq('id', projectId)
      .single()
    
    if (!project) {
      return { success: false, error: 'Project not found' }
    }
    
    const check = await checkPermission(userId, 'projects.update', project.company_id)
    if (!check.allowed) {
      return { success: false, error: check.reason }
    }
    
    const { data, error } = await supabase
      .from('projects')
      .update(projectData)
      .eq('id', projectId)
      .select()
      .single()
    
    if (error) throw error
    
    revalidatePath('/projects')
    return { success: true, project: data }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

/**
 * Delete project
 */
export async function deleteProject(userId: string, projectId: string) {
  const supabase = await createClient()
  
  try {
    // Get project's company
    const { data: project } = await supabase
      .from('projects')
      .select('company_id')
      .eq('id', projectId)
      .single()
    
    if (!project) {
      return { success: false, error: 'Project not found' }
    }
    
    const check = await checkPermission(userId, 'projects.delete', project.company_id)
    if (!check.allowed) {
      return { success: false, error: check.reason }
    }
    
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', projectId)
    
    if (error) throw error
    
    revalidatePath('/projects')
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}
