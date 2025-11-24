import { ProtectedSidebar } from "@/components/protected-sidebar"
import { UserSwitcher } from "@/components/user-switcher"
import { PermissionProvider } from "@/lib/contexts/permission-context"
import { ProjectContextProvider } from "@/lib/contexts/project-context"
import { ProjectSelector } from "@/components/project-selector"
import { ProjectSyncWrapper } from "@/components/project-sync-wrapper"
import { AuthCheck } from "./auth-check"
import { ErrorBoundary } from "@/components/error-boundary"
import { SWRProvider } from "@/lib/providers/swr-provider"
import type React from "react"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // This layout is for all admin pages and includes the Protected Sidebar.
  // Sidebar automatically hides menus based on user role and permissions.
  return (
    <ErrorBoundary>
      <SWRProvider>
        <AuthCheck>
          <PermissionProvider>
            <ProjectContextProvider>
              <ProjectSelector />
              <ProtectedSidebar />
              <UserSwitcher />
              <ProjectSyncWrapper>
                <main className="ml-64 min-h-screen">
                  <div className="p-8">{children}</div>
                </main>
              </ProjectSyncWrapper>
            </ProjectContextProvider>
          </PermissionProvider>
        </AuthCheck>
      </SWRProvider>
    </ErrorBoundary>
  )
}

