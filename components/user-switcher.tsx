"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { UserCircle, ChevronDown } from "lucide-react"
import { getCurrentUser, switchUser } from "@/lib/utils/mock-auth"
import { getLoginUsers } from "@/lib/actions/auth-actions"
import { AdminNotificationBell } from "@/components/admin-notification-bell"

export function UserSwitcher() {
  const [currentUser, setCurrentUser] = useState(getCurrentUser())
  const [users, setUsers] = useState<any[]>([])

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    const result = await getLoginUsers()
    if (result.success) {
      setUsers(result.users || [])
    }
  }

  const handleSwitchUser = (user: any) => {
    switchUser(user)
    setCurrentUser(getCurrentUser())
    // Page will reload after switch
  }

  const getRoleBadgeColor = (role: string) => {
    const colors: Record<string, string> = {
      super_admin: 'bg-red-100 text-red-800',
      company_admin: 'bg-orange-100 text-orange-800',
      project_admin: 'bg-blue-100 text-blue-800',
      staff: 'bg-green-100 text-green-800',
      engineer: 'bg-purple-100 text-purple-800',
      resident: 'bg-gray-100 text-gray-800'
    }
    return colors[role] || colors.resident
  }

  return (
    <div className="fixed top-4 right-4 z-50 flex items-center gap-2">
      <AdminNotificationBell />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="gap-2 bg-white shadow-lg">
            <UserCircle className="w-4 h-4" />
            <div className="flex flex-col items-start">
              <span className="text-sm font-medium">{currentUser.full_name}</span>
              <Badge className={`text-xs ${getRoleBadgeColor(currentUser.role)}`}>
                {currentUser.role}
              </Badge>
            </div>
            <ChevronDown className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          <DropdownMenuLabel>สลับผู้ใช้ (Dev Mode)</DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          {users.map((user) => (
            <DropdownMenuItem
              key={user.id}
              onClick={() => handleSwitchUser(user)}
              className={currentUser.id === user.id ? 'bg-blue-50' : ''}
            >
              <div className="flex flex-col w-full">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{user.full_name}</span>
                  {currentUser.id === user.id && (
                    <Badge variant="outline" className="text-xs">ปัจจุบัน</Badge>
                  )}
                </div>
                <span className="text-xs text-muted-foreground">{user.email}</span>
                <Badge className={`text-xs mt-1 w-fit ${getRoleBadgeColor(user.role)}`}>
                  {user.roleDisplay}
                </Badge>
              </div>
            </DropdownMenuItem>
          ))}
          
          <DropdownMenuSeparator />
          <DropdownMenuItem disabled className="text-xs text-muted-foreground">
            💡 หน้าจะ reload หลังสลับผู้ใช้
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
