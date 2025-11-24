"use client"

import { useState, useEffect, useCallback } from "react"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  Search, 
  KeyRound, 
  UserPlus, 
  UserMinus, 
  Eye, 
  EyeOff, 
  CheckCircle, 
  XCircle,
  AlertCircle,
  Loader2,
  Mail,
  Phone,
  Home,
  Copy,
  Download,
  QrCode,
  FileSpreadsheet
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useProjectContext } from "@/lib/contexts/project-context"
import { getCurrentUser } from "@/lib/utils/mock-auth"
import { getUnits, getUnitOwners, getUnitTenants, getAllResidentAccounts } from "@/lib/actions/units-actions"
import { generateInvitationCode } from "@/lib/actions/invitation-actions"
import { exportInvitationsAsPDF, exportQRCodesAsZIP, exportInvitationsAsCSV, type InvitationData } from "@/lib/utils/qr-code-export"
import { Unit, Owner, Tenant } from "@/lib/types/permissions"

interface ResidentAccount {
  unit_id: string
  unit_number: string
  owner?: Owner
  tenant?: Tenant
  has_account: boolean
  email?: string
  created_at?: string
  last_sign_in?: string
}

export default function ResidentAccountsPage() {
  const { selectedProjectId, selectedProject } = useProjectContext()
  const currentUser = getCurrentUser()
  const [accounts, setAccounts] = useState<ResidentAccount[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null)
  const [accountType, setAccountType] = useState<'owner' | 'tenant'>('owner')
  const [email, setEmail] = useState("")
  const [invitationCode, setInvitationCode] = useState("")
  const [invitationLink, setInvitationLink] = useState("")
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false)
  const [selectedAccounts, setSelectedAccounts] = useState<Set<string>>(new Set())
  const { toast } = useToast()

  const loadAccounts = useCallback(async () => {
    if (!currentUser?.id) return
    
    setIsLoading(true)
    try {
      // Use optimized single-query function
      const result = await getAllResidentAccounts(currentUser.id, selectedProjectId)
      console.log('[ResidentAccounts] Loaded accounts:', result)
      
      if (result.success) {
        console.log('[ResidentAccounts] Total accounts loaded:', result.accounts.length)
        setAccounts(result.accounts)
      } else {
        console.error('[ResidentAccounts] Failed to get accounts:', result.error)
        toast({
          title: "เกิดข้อผิดพลาด",
          description: result.error || "ไม่สามารถโหลดข้อมูลได้",
          variant: "destructive"
        })
      }
    } catch (error: any) {
      console.error('[ResidentAccounts] Error:', error)
      toast({
        title: "เกิดข้อผิดพลาด",
        description: error.message,
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }, [currentUser.id, selectedProjectId, toast])

  useEffect(() => {
    loadAccounts()
  }, [loadAccounts])

  const handleSendInvitation = async () => {
    if (!selectedUnit) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "กรุณาเลือกห้องชุด",
        variant: "destructive"
      })
      return
    }
    
    try {
      const result = await generateInvitationCode(selectedUnit.id, email)
      
      if (result.success) {
        setInvitationCode(result.invitationCode!)
        setInvitationLink(result.invitationLink!)
        
        toast({
          title: "สร้างรหัสเชิญสำเร็จ",
          description: "สามารถคัดลอกรหัสหรือลิงก์เพื่อส่งให้ลูกบ้าน",
        })
      } else {
        toast({
          title: "เกิดข้อผิดพลาด",
          description: result.error,
          variant: "destructive"
        })
      }
    } catch (error: any) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: error.message,
        variant: "destructive"
      })
    }
  }

  const handleCopyCode = () => {
    navigator.clipboard.writeText(invitationCode)
    toast({
      title: "คัดลอกแล้ว",
      description: "รหัสเชิญถูกคัดลอกแล้ว",
    })
  }

  const handleCopyLink = () => {
    navigator.clipboard.writeText(invitationLink)
    toast({
      title: "คัดลอกแล้ว",
      description: "ลิงก์เชิญถูกคัดลอกแล้ว",
    })
  }

  const resetForm = () => {
    setSelectedUnit(null)
    setAccountType('owner')
    setEmail("")
    setInvitationCode("")
    setInvitationLink("")
  }
  
  // Generate invitations for selected accounts
  const generateInvitationsForAccounts = async (accountIds: string[]) => {
    const invitations: InvitationData[] = []
    
    for (const accountId of accountIds) {
      const account = accounts.find(a => 
        `${a.unit_id}_${a.owner?.id || a.tenant?.id}` === accountId
      )
      
      if (!account || account.has_account) continue
      
      try {
        const result = await generateInvitationCode(account.unit_id, account.email)
        
        if (result.success) {
          invitations.push({
            unit_number: account.unit_number,
            name: account.owner?.name || account.tenant?.name || 'Unknown',
            email: account.email,
            phone: account.owner?.phone || account.tenant?.phone,
            invitationCode: result.invitationCode,
            invitationLink: result.invitationLink,
            type: account.owner ? 'owner' : 'tenant'
          })
        }
      } catch (error) {
        console.error('Error generating invitation for', accountId, error)
      }
    }
    
    return invitations
  }
  
  // Handle export
  const handleExport = async (format: 'pdf' | 'zip' | 'csv') => {
    if (selectedAccounts.size === 0) {
      toast({
        title: "ไม่พบรายการที่เลือก",
        description: "กรุณาเลือกรายการที่ต้องการ Export",
        variant: "destructive",
      })
      return
    }
    
    try {
      const invitations = await generateInvitationsForAccounts(Array.from(selectedAccounts))
      
      if (invitations.length === 0) {
        toast({
          title: "ไม่พบข้อมูล",
          description: "ไม่สามารถสร้าง invitation สำหรับรายการที่เลือกได้",
          variant: "destructive",
        })
        return
      }
      
      switch (format) {
        case 'pdf':
          await exportInvitationsAsPDF(invitations)
          toast({
            title: "Export สำเร็จ",
            description: `Export ${invitations.length} รายการเป็น PDF สำเร็จ`,
          })
          break
        case 'zip':
          await exportQRCodesAsZIP(invitations)
          toast({
            title: "Export สำเร็จ",
            description: `Export ${invitations.length} รายการ QR Code เป็น ZIP สำเร็จ`,
          })
          break
        case 'csv':
          exportInvitationsAsCSV(invitations)
          toast({
            title: "Export สำเร็จ",
            description: `Export ${invitations.length} รายการเป็น CSV สำเร็จ`,
          })
          break
      }
      
      setIsExportDialogOpen(false)
      setSelectedAccounts(new Set())
    } catch (error: any) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const filteredAccounts = accounts.filter(account => {
    const name = account.owner?.name || account.tenant?.name || ""
    const email = account.email || ""
    const unitNumber = account.unit_number || ""
    
    return (
      name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      unitNumber.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })

  return (
    <div className="space-y-6">
      <PageHeader
        title="จัดการบัญชีผู้ใช้ Portal"
        subtitle="สร้างและจัดการบัญชีสำหรับเจ้าของและผู้เช่า"
      />

      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="ค้นหาเจ้าของหรือผู้เช่า..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button 
            variant="outline"
            onClick={() => setIsExportDialogOpen(true)}
            disabled={selectedAccounts.size === 0}
          >
            <QrCode className="w-4 h-4 mr-2" />
            Export QR Codes ({selectedAccounts.size})
          </Button>
          <Button
            onClick={() => {
              resetForm()
              setIsCreateDialogOpen(true)
            }}
          >
            <UserPlus className="w-4 h-4 mr-2" />
            สร้างบัญชีใหม่
          </Button>
        </div>
      </div>

      {/* Accounts Table */}
      <Card>
        <CardHeader>
          <CardTitle>รายการบัญชีผู้ใช้</CardTitle>
          <CardDescription>
            แสดงบัญชีทั้งหมด {filteredAccounts.length} บัญชี
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <input 
                    type="checkbox"
                    className="rounded border-gray-300"
                    checked={selectedAccounts.size === filteredAccounts.filter(a => !a.has_account).length && filteredAccounts.filter(a => !a.has_account).length > 0}
                    onChange={(e) => {
                      if (e.target.checked) {
                        const accountIds = filteredAccounts
                          .filter(a => !a.has_account)
                          .map(a => `${a.unit_id}_${a.owner?.id || a.tenant?.id}`)
                        setSelectedAccounts(new Set(accountIds))
                      } else {
                        setSelectedAccounts(new Set())
                      }
                    }}
                  />
                </TableHead>
                <TableHead>หมายเลขห้อง</TableHead>
                <TableHead>ประเภท</TableHead>
                <TableHead>ชื่อ</TableHead>
                <TableHead>อีเมล</TableHead>
                <TableHead>เบอร์โทรศัพท์</TableHead>
                <TableHead>สถานะบัญชี</TableHead>
                <TableHead>การจัดการ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAccounts.map((account, index) => {
                const accountId = `${account.unit_id}_${account.owner?.id || account.tenant?.id}`
                const isSelected = selectedAccounts.has(accountId)
                const isDisabled = account.has_account
                
                return (
                  <TableRow key={accountId}>
                    <TableCell>
                      <input 
                        type="checkbox"
                        className="rounded border-gray-300"
                        checked={isSelected}
                        disabled={isDisabled}
                        onChange={(e) => {
                          const newSelected = new Set(selectedAccounts)
                          if (e.target.checked) {
                            newSelected.add(accountId)
                          } else {
                            newSelected.delete(accountId)
                          }
                          setSelectedAccounts(newSelected)
                        }}
                      />
                    </TableCell>
                  <TableCell className="font-medium">{account.unit_number}</TableCell>
                  <TableCell>
                    <Badge variant={account.owner ? "default" : "secondary"}>
                      {account.owner ? "เจ้าของ" : "ผู้เช่า"}
                    </Badge>
                  </TableCell>
                  <TableCell>{account.owner?.name || account.tenant?.name}</TableCell>
                  <TableCell>
                    {account.email ? (
                      <div className="flex items-center">
                        <Mail className="w-3 h-3 mr-1" />
                        <span>{account.email}</span>
                      </div>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {account.owner?.phone || account.tenant?.phone ? (
                      <div className="flex items-center">
                        <Phone className="w-3 h-3 mr-1" />
                        <span>{account.owner?.phone || account.tenant?.phone}</span>
                      </div>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {account.has_account ? (
                      <Badge variant="default" className="bg-green-500 hover:bg-green-600">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        มีบัญชี
                      </Badge>
                    ) : (
                      <Badge variant="destructive">
                        <XCircle className="w-3 h-3 mr-1" />
                        ยังไม่มีบัญชี
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      {!account.has_account && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedUnit({
                              id: account.unit_id,
                              unit_number: account.unit_number
                            } as Unit)
                            setAccountType(account.owner ? 'owner' : 'tenant')
                            setEmail(account.email || account.owner?.email || account.tenant?.email || "")
                            setIsCreateDialogOpen(true)
                          }}
                        >
                          <KeyRound className="w-4 h-4 mr-1" />
                          ส่งรหัสเชิญ
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Export QR Codes Dialog */}
      <Dialog open={isExportDialogOpen} onOpenChange={setIsExportDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Export QR Codes</DialogTitle>
            <DialogDescription>
              เลือกรูปแบบการ Export สำหรับ {selectedAccounts.size} รายการที่เลือก
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                ระบบจะสร้าง QR Code สำหรับแต่ละรายการที่เลือก
              </AlertDescription>
            </Alert>
            
            <div className="space-y-3">
              <Button 
                className="w-full justify-start" 
                variant="outline"
                onClick={() => handleExport('pdf')}
              >
                <Download className="w-4 h-4 mr-2" />
                Export เป็น PDF (สำหรับพิมพ์)
              </Button>
              
              <Button 
                className="w-full justify-start" 
                variant="outline"
                onClick={() => handleExport('zip')}
              >
                <QrCode className="w-4 h-4 mr-2" />
                Export QR Codes เป็น ZIP (สำหรับส่ง LINE/Email)
              </Button>
              
              <Button 
                className="w-full justify-start" 
                variant="outline"
                onClick={() => handleExport('csv')}
              >
                <FileSpreadsheet className="w-4 h-4 mr-2" />
                Export เป็น CSV (สำหรับใช้งานในระบบอื่น)
              </Button>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsExportDialogOpen(false)}>
              ยกเลิก
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Send Invitation Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>ส่งรหัสเชิญสำหรับ {accountType === 'owner' ? 'เจ้าของ' : 'ผู้เช่า'}</DialogTitle>
            <DialogDescription>
              สร้างรหัสเชิญสำหรับ {accountType === 'owner' ? 'เจ้าของ' : 'ผู้เช่า'} ของห้อง {selectedUnit?.unit_number}
            </DialogDescription>
          </DialogHeader>
          
          {!invitationCode ? (
            <>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">อีเมล (สำหรับส่งรหัสเชิญ)</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email@example.com"
                  />
                  <p className="text-xs text-gray-500">
                    อีเมลนี้จะใช้ส่งรหัสเชิญเท่านั้น ลูกบ้านจะตั้ง username และ password เอง
                  </p>
                </div>
                
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    ลูกบ้านจะได้รับรหัสเชิญและสามารถสร้าง username/password เองได้
                  </AlertDescription>
                </Alert>
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  ยกเลิก
                </Button>
                <Button onClick={handleSendInvitation}>
                  สร้างรหัสเชิญ
                </Button>
              </DialogFooter>
            </>
          ) : (
            <>
              <div className="space-y-4">
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    สร้างรหัสเชิญสำเร็จแล้ว กรุณาส่งให้ลูกบ้าน
                  </AlertDescription>
                </Alert>
                
                <div className="space-y-2">
                  <Label>รหัสเชิญ</Label>
                  <div className="flex gap-2">
                    <Input value={invitationCode} readOnly />
                    <Button onClick={handleCopyCode} variant="outline">
                      คัดลอก
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>ลิงก์เชิญ</Label>
                  <div className="flex gap-2">
                    <Input value={invitationLink} readOnly className="text-xs" />
                    <Button onClick={handleCopyLink} variant="outline">
                      คัดลอก
                    </Button>
                  </div>
                </div>
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => {
                  setIsCreateDialogOpen(false)
                  resetForm()
                  loadAccounts()
                }}>
                  ปิด
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}