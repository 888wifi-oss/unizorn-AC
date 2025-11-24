"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Search, UserPlus, UserMinus } from "lucide-react"
import { toast } from "@/hooks/use-toast"

interface User {
  id: string
  email: string
  full_name: string
  phone?: string
}

interface GroupAssignmentDialogProps {
  isOpen: boolean
  onClose: () => void
  groupId: string
  groupName: string
  currentMembers: Array<{ user_id: string; user?: { email: string; full_name: string; phone?: string } }>
  availableUsers: User[]
  onAssign: (userIds: string[]) => Promise<void>
  onRemove: (userId: string) => Promise<void>
}

export function GroupAssignmentDialog({
  isOpen,
  onClose,
  groupId,
  groupName,
  currentMembers,
  availableUsers,
  onAssign,
  onRemove
}: GroupAssignmentDialogProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [isAssigning, setIsAssigning] = useState(false)

  const currentMemberIds = currentMembers.map(m => m.user_id)

  const filteredUsers = availableUsers.filter(user => {
    const matchesSearch = !searchTerm ||
      user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
    
    const notCurrentMember = !currentMemberIds.includes(user.id)
    
    return matchesSearch && notCurrentMember
  })

  const handleAssign = async () => {
    if (selectedUsers.length === 0) {
      toast({
        title: "กรุณาเลือกผู้ใช้",
        description: "เลือกอย่างน้อย 1 คนเพื่อเพิ่มเข้ากลุ่ม",
        variant: "destructive"
      })
      return
    }

    setIsAssigning(true)
    try {
      await onAssign(selectedUsers)
      setSelectedUsers([])
      setSearchTerm("")
      toast({
        title: "เพิ่มสำเร็จ",
        description: `เพิ่ม ${selectedUsers.length} คนเข้ากลุ่ม ${groupName}`,
      })
    } catch (error: any) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: error.message,
        variant: "destructive"
      })
    } finally {
      setIsAssigning(false)
    }
  }

  const handleRemove = async (userId: string, userName: string) => {
    if (!confirm(`คุณแน่ใจหรือไม่ที่จะลบ ${userName} ออกจากกลุ่ม?`)) {
      return
    }

    try {
      await onRemove(userId)
      toast({
        title: "ลบสำเร็จ",
        description: `ลบ ${userName} ออกจากกลุ่มแล้ว`,
      })
    } catch (error: any) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: error.message,
        variant: "destructive"
      })
    }
  }

  const toggleUser = (userId: string) => {
    setSelectedUsers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>จัดการสมาชิกกลุ่ม: {groupName}</DialogTitle>
          <DialogDescription>
            เพิ่มหรือลบสมาชิกในกลุ่ม ({currentMembers.length} คน)
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4">
          {/* Current Members */}
          <div className="border rounded-lg p-4">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Badge>{currentMembers.length}</Badge>
              สมาชิกปัจจุบัน
            </h3>
            <ScrollArea className="h-[400px]">
              {currentMembers.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  ยังไม่มีสมาชิกในกลุ่ม
                </div>
              ) : (
                <div className="space-y-2">
                  {currentMembers.map(member => (
                    <div
                      key={member.user_id}
                      className="flex items-center justify-between p-2 border rounded hover:bg-muted"
                    >
                      <div className="flex-1">
                        <div className="font-medium text-sm">{member.user?.full_name || 'N/A'}</div>
                        <div className="text-xs text-muted-foreground">{member.user?.email || 'N/A'}</div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemove(member.user_id, member.user?.full_name || 'User')}
                      >
                        <UserMinus className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>

          {/* Available Users */}
          <div className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold flex items-center gap-2">
                <Badge variant="outline">{filteredUsers.length}</Badge>
                ผู้ใช้ที่เพิ่มได้
              </h3>
              <Button
                onClick={handleAssign}
                disabled={selectedUsers.length === 0 || isAssigning}
                size="sm"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                เพิ่มทั้งหมด ({selectedUsers.length})
              </Button>
            </div>

            <div className="relative mb-3">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="ค้นหาชื่อหรืออีเมล..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>

            <ScrollArea className="h-[360px]">
              {filteredUsers.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  {searchTerm ? "ไม่พบผู้ใช้" : "ผู้ใช้ทั้งหมดอยู่ในกลุ่มแล้ว"}
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredUsers.map(user => (
                    <div
                      key={user.id}
                      className="flex items-center gap-3 p-2 border rounded hover:bg-muted cursor-pointer"
                      onClick={() => toggleUser(user.id)}
                    >
                      <Checkbox
                        checked={selectedUsers.includes(user.id)}
                        onCheckedChange={() => toggleUser(user.id)}
                      />
                      <div className="flex-1">
                        <div className="font-medium text-sm">{user.full_name}</div>
                        <div className="text-xs text-muted-foreground">{user.email}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={onClose}>
            ปิด
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
