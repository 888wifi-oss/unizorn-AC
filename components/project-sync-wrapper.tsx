"use client"

import { useProjectContext } from "@/lib/contexts/project-context"
import { getCurrentUser } from "@/lib/utils/mock-auth"

/**
 * Wrapper that forces child components to remount when project changes
 * This ensures all data is reloaded with the new project context
 */
export function ProjectSyncWrapper({ children }: { children: React.ReactNode }) {
  const { selectedProjectId } = useProjectContext()
  const currentUser = getCurrentUser()
  
  // Super Admin doesn't need project-based remounting
  if (currentUser.role === 'super_admin') {
    return <>{children}</>
  }
  
  // Use selectedProjectId as key to force remount when it changes
  return (
    <div key={selectedProjectId || 'no-project'}>
      {children}
    </div>
  )
}

