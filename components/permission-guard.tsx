"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, ShieldAlert } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { canAccessModule } from '@/lib/types/module-permissions'
import { usePermissions } from '@/lib/contexts/permission-context'
import { PermissionName } from '@/lib/types/permissions'

interface PermissionGuardProps {
  children: React.ReactNode
  moduleName?: string
  permission?: PermissionName | PermissionName[]
  requireAll?: boolean
  fallback?: React.ReactNode
  redirectTo?: string
}

/**
 * Component to guard routes/components by permission
 */
export function PermissionGuard({
  children,
  moduleName,
  permission,
  requireAll = false,
  fallback,
  redirectTo = '/'
}: PermissionGuardProps) {
  const router = useRouter()
  const { context, loading, hasPermission, hasAnyPermission, hasAllPermissions } = usePermissions()
  const [checking, setChecking] = useState(true)
  const [allowed, setAllowed] = useState(false)

  useEffect(() => {
    if (loading) return

    if (!context) {
      setAllowed(false)
      setChecking(false)
      return
    }

    let isAllowed = true

    // Check module access
    if (moduleName) {
      const primaryRole = context.roles[0]?.name
      if (!primaryRole || !canAccessModule(primaryRole, moduleName)) {
        isAllowed = false
      }
    }

    // Check permission
    if (isAllowed && permission) {
      if (Array.isArray(permission)) {
        isAllowed = requireAll
          ? hasAllPermissions(permission)
          : hasAnyPermission(permission)
      } else {
        isAllowed = hasPermission(permission)
      }
    }

    setAllowed(isAllowed)
    setChecking(false)

    // Redirect if not allowed
    if (!isAllowed && redirectTo) {
      setTimeout(() => {
        router.push(redirectTo)
      }, 2000)
    }
  }, [loading, context, moduleName, permission, requireAll])

  if (loading || checking) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">กำลังตรวจสอบสิทธิ์...</p>
        </div>
      </div>
    )
  }

  if (!allowed) {
    if (fallback) {
      return <>{fallback}</>
    }

    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <Card className="max-w-md">
          <CardHeader>
            <div className="flex items-center gap-2 text-red-600 mb-2">
              <ShieldAlert className="w-6 h-6" />
              <CardTitle>ไม่มีสิทธิ์เข้าถึง</CardTitle>
            </div>
            <CardDescription>
              คุณไม่มีสิทธิ์เข้าถึงหน้านี้
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              หากคุณคิดว่านี่เป็นข้อผิดพลาด กรุณาติดต่อผู้ดูแลระบบเพื่อขอสิทธิ์การเข้าถึง
            </p>
            <div className="flex gap-2">
              <Button onClick={() => router.push(redirectTo)}>
                กลับหน้าหลัก
              </Button>
              <Button variant="outline" onClick={() => router.back()}>
                ย้อนกลับ
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return <>{children}</>
}

/**
 * HOC to protect pages
 */
export function withPermissionGuard<P extends object>(
  Component: React.ComponentType<P>,
  guardProps: Omit<PermissionGuardProps, 'children'>
) {
  return function ProtectedPage(props: P) {
    return (
      <PermissionGuard {...guardProps}>
        <Component {...props} />
      </PermissionGuard>
    )
  }
}
