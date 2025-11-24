// lib/utils/project-filter.ts
"use server"

import { createClient } from '@/lib/supabase/server'

/**
 * Filter data by project_id for non-Super Admin users
 * This ensures all data is scoped to the selected project
 */

export async function filterByProject<T extends Record<string, any>>(
  data: T[],
  selectedProjectId: string | null,
  userRole: string,
  projectField: string = 'project_id'
): Promise<T[]> {
  // Super Admin sees everything
  if (userRole === 'super_admin' || !selectedProjectId) {
    return data
  }
  
  // Filter by project_id
  return data.filter(item => item[projectField] === selectedProjectId)
}

/**
 * Get WHERE clause for project filtering
 */
export function getProjectWhereClause(
  selectedProjectId: string | null,
  userRole: string
): any {
  if (userRole === 'super_admin' || !selectedProjectId) {
    return {}
  }
  
  return { project_id: selectedProjectId }
}

/**
 * Add project filter to Supabase query
 */
export function addProjectFilter(
  query: any,
  selectedProjectId: string | null,
  userRole: string,
  columnName: string = 'project_id'
) {
  if (userRole === 'super_admin' || !selectedProjectId) {
    return query
  }
  
  return query.eq(columnName, selectedProjectId)
}

