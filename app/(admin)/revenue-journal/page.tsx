"use client"

import { useState, useEffect } from "react"
import { PageHeader } from "@/components/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import {
  TrendingUp,
  Plus,
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  Download,
  Upload,
  Calendar,
  DollarSign
} from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { useProjectContext } from "@/lib/contexts/project-context"
import { getCurrentUser } from "@/lib/utils/mock-auth"
import { createClient } from "@/lib/supabase/client"

interface RevenueJournal {
  id: string
  journal_number: string
  date: string
  description: string
  amount: number
  account_code: string
  account_name: string
  reference: string
  created_by: string
  created_at: string
}

export default function RevenueJournalPage() {
  const { selectedProjectId } = useProjectContext()
  const currentUser = getCurrentUser()
  const [journals, setJournals] = useState<RevenueJournal[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedJournal, setSelectedJournal] = useState<RevenueJournal | null>(null)
  const [editingJournal, setEditingJournal] = useState<RevenueJournal | null>(null)

  useEffect(() => {
    console.log('[RevenueJournal] useEffect triggered. selectedProjectId:', selectedProjectId)
    loadJournals()
  }, [selectedProjectId])

  const loadJournals = async () => {
    setLoading(true)
    const supabase = createClient()
    try {
      console.log('[RevenueJournal] Loading journals with project_id:', selectedProjectId)

      // Query from revenue_journal with project filtering
      let query = supabase
        .from('revenue_journal')
        .select(`
          id,
          journal_date,
          account_code,
          description,
          amount,
          reference_number,
          created_at,
          chart_of_accounts(account_name)
        `)
        .order('journal_date', { ascending: false })
        .order('created_at', { ascending: false })

      if (selectedProjectId && currentUser.role !== 'super_admin') {
        query = query.eq('project_id', selectedProjectId)
      }

      const { data: revenueData, error } = await query

      if (error) throw error

      const journalsData: RevenueJournal[] = (revenueData || []).map((item: any, index: number) => ({
        id: item.id,
        journal_number: `RJ${String(index + 1).padStart(3, '0')}`,
        date: item.journal_date,
        description: item.description,
        amount: item.amount,
        account_code: item.account_code,
        account_name: item.chart_of_accounts?.account_name || item.account_code,
        reference: item.reference_number || '-',
        created_by: currentUser.name || 'System',
        created_at: item.created_at
      }))

      setJournals(journalsData)
    } catch (error) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถโหลดข้อมูลได้",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCreateJournal = async (formData: any) => {
    try {
      // Mock creation - replace with actual API call
      const newJournal: RevenueJournal = {
        id: Date.now().toString(),
        journal_number: `RJ${String(journals.length + 1).padStart(3, '0')}`,
        date: formData.date,
        description: formData.description,
        amount: formData.amount,
        account_code: formData.account_code,
        account_name: formData.account_name,
        reference: formData.reference,
        created_by: "ผู้ใช้ปัจจุบัน",
        created_at: new Date().toISOString()
      }

      setJournals(prev => [newJournal, ...prev])
      setIsCreateDialogOpen(false)

      toast({
        title: "สร้างสำเร็จ",
        description: "บันทึกรายรับเรียบร้อยแล้ว",
      })
    } catch (error) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถสร้างได้",
        variant: "destructive",
      })
    }
  }

  const handleEdit = (journal: RevenueJournal) => {
    setEditingJournal(journal)
    setIsEditDialogOpen(true)
  }

  const handleUpdateJournal = async (formData: any) => {
    if (!editingJournal) return

    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('revenue_journal')
        .update({
          journal_date: formData.date,
          description: formData.description,
          amount: formData.amount,
          account_code: formData.account_code,
          reference_number: formData.reference
        })
        .eq('id', editingJournal.id)

      if (error) throw error

      await loadJournals()
      setIsEditDialogOpen(false)
      setEditingJournal(null)

      toast({
        title: "อัปเดตสำเร็จ",
        description: "แก้ไขบันทึกรายรับเรียบร้อยแล้ว",
      })
    } catch (error) {
      console.error('Error updating journal:', error)
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถแก้ไขได้",
        variant: "destructive",
      })
    }
  }

  const handleDownload = (journal: RevenueJournal) => {
    // Create CSV content
    const csvContent = [
      ['เลขที่บันทึก', 'วันที่', 'รายละเอียด', 'จำนวนเงิน', 'รหัสบัญชี', 'ชื่อบัญชี', 'อ้างอิง', 'ผู้สร้าง'],
      [
        journal.journal_number,
        new Date(journal.date).toLocaleDateString('th-TH'),
        journal.description,
        journal.amount.toString(),
        journal.account_code,
        journal.account_name,
        journal.reference,
        journal.created_by
      ]
    ].map(row => row.join(',')).join('\n')

    // Create blob and download
    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `revenue_journal_${journal.journal_number}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    toast({
      title: "ดาวน์โหลดสำเร็จ",
      description: `ดาวน์โหลดไฟล์ ${journal.journal_number}.csv เรียบร้อยแล้ว`,
    })
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="บันทึกรายรับ"
        subtitle="จัดการการบันทึกรายรับต่างๆ"
      />

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>รายการบันทึกรายรับ</CardTitle>
              <CardDescription>รายการบันทึกรายรับทั้งหมด</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Search className="w-4 h-4 mr-2" />
                ค้นหา
              </Button>
              <Button variant="outline" size="sm">
                <Filter className="w-4 h-4 mr-2" />
                กรอง
              </Button>
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    บันทึกรายรับ
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>บันทึกรายรับใหม่</DialogTitle>
                    <DialogDescription>กรอกข้อมูลรายรับที่ต้องการบันทึก</DialogDescription>
                  </DialogHeader>
                  <form onSubmit={(e) => {
                    e.preventDefault()
                    const formData = new FormData(e.currentTarget)
                    handleCreateJournal({
                      date: formData.get('date'),
                      description: formData.get('description'),
                      amount: Number(formData.get('amount')),
                      account_code: formData.get('account_code'),
                      account_name: formData.get('account_name'),
                      reference: formData.get('reference')
                    })
                  }}>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="date">วันที่</Label>
                        <Input id="date" name="date" type="date" required />
                      </div>
                      <div>
                        <Label htmlFor="journal_number">เลขที่บันทึก</Label>
                        <Input id="journal_number" value={`RJ${String(journals.length + 1).padStart(3, '0')}`} disabled />
                      </div>
                      <div className="col-span-2">
                        <Label htmlFor="description">รายละเอียด</Label>
                        <Textarea id="description" name="description" required />
                      </div>
                      <div>
                        <Label htmlFor="amount">จำนวนเงิน</Label>
                        <Input id="amount" name="amount" type="number" required />
                      </div>
                      <div>
                        <Label htmlFor="account_code">รหัสบัญชี</Label>
                        <Input id="account_code" name="account_code" required />
                      </div>
                      <div>
                        <Label htmlFor="account_name">ชื่อบัญชี</Label>
                        <Input id="account_name" name="account_name" required />
                      </div>
                      <div>
                        <Label htmlFor="reference">อ้างอิง</Label>
                        <Input id="reference" name="reference" />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2 mt-4">
                      <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                        ยกเลิก
                      </Button>
                      <Button type="submit">
                        บันทึก
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>เลขที่บันทึก</TableHead>
                <TableHead>วันที่</TableHead>
                <TableHead>รายละเอียด</TableHead>
                <TableHead>จำนวนเงิน</TableHead>
                <TableHead>รหัสบัญชี</TableHead>
                <TableHead>ชื่อบัญชี</TableHead>
                <TableHead>อ้างอิง</TableHead>
                <TableHead>ผู้สร้าง</TableHead>
                <TableHead>การดำเนินการ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {journals.map((journal) => (
                <TableRow key={journal.id}>
                  <TableCell className="font-medium">{journal.journal_number}</TableCell>
                  <TableCell>{new Date(journal.date).toLocaleDateString('th-TH')}</TableCell>
                  <TableCell>{journal.description}</TableCell>
                  <TableCell className="text-green-600 font-medium">฿{journal.amount.toLocaleString()}</TableCell>
                  <TableCell>{journal.account_code}</TableCell>
                  <TableCell>{journal.account_name}</TableCell>
                  <TableCell>{journal.reference}</TableCell>
                  <TableCell>{journal.created_by}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedJournal(journal)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(journal)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownload(journal)}
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* View Journal Dialog */}
      <Dialog open={!!selectedJournal} onOpenChange={(open) => !open && setSelectedJournal(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>รายละเอียดบันทึกรายรับ</DialogTitle>
            <DialogDescription>
              เลขที่: {selectedJournal?.journal_number}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">วันที่</Label>
              <div className="col-span-3">
                {selectedJournal?.date && new Date(selectedJournal.date).toLocaleDateString('th-TH')}
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">รายละเอียด</Label>
              <div className="col-span-3">{selectedJournal?.description}</div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">จำนวนเงิน</Label>
              <div className="col-span-3 font-medium text-green-600">
                ฿{selectedJournal?.amount.toLocaleString()}
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">รหัสบัญชี</Label>
              <div className="col-span-3">{selectedJournal?.account_code}</div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">ชื่อบัญชี</Label>
              <div className="col-span-3">{selectedJournal?.account_name}</div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">อ้างอิง</Label>
              <div className="col-span-3">{selectedJournal?.reference}</div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">ผู้สร้าง</Label>
              <div className="col-span-3">{selectedJournal?.created_by}</div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Journal Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>แก้ไขบันทึกรายรับ</DialogTitle>
            <DialogDescription>แก้ไขข้อมูลรายรับ</DialogDescription>
          </DialogHeader>
          <form onSubmit={(e) => {
            e.preventDefault()
            const formData = new FormData(e.currentTarget)
            handleUpdateJournal({
              date: formData.get('date'),
              description: formData.get('description'),
              amount: Number(formData.get('amount')),
              account_code: formData.get('account_code'),
              reference: formData.get('reference')
            })
          }}>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit_date">วันที่</Label>
                <Input
                  id="edit_date"
                  name="date"
                  type="date"
                  defaultValue={editingJournal?.date}
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit_journal_number">เลขที่บันทึก</Label>
                <Input
                  id="edit_journal_number"
                  value={editingJournal?.journal_number || ''}
                  disabled
                />
              </div>
              <div className="col-span-2">
                <Label htmlFor="edit_description">รายละเอียด</Label>
                <Textarea
                  id="edit_description"
                  name="description"
                  defaultValue={editingJournal?.description}
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit_amount">จำนวนเงิน</Label>
                <Input
                  id="edit_amount"
                  name="amount"
                  type="number"
                  defaultValue={editingJournal?.amount}
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit_account_code">รหัสบัญชี</Label>
                <Input
                  id="edit_account_code"
                  name="account_code"
                  defaultValue={editingJournal?.account_code}
                  required
                />
              </div>
              <div className="col-span-2">
                <Label htmlFor="edit_reference">อ้างอิง</Label>
                <Input
                  id="edit_reference"
                  name="reference"
                  defaultValue={editingJournal?.reference}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                ยกเลิก
              </Button>
              <Button type="submit">
                บันทึก
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
