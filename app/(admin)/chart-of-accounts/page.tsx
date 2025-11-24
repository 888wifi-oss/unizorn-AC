"use client"

import { useState, useEffect } from "react"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Pencil, Trash2, Search, FileDown } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { Checkbox } from "@/components/ui/checkbox"

interface ChartOfAccount {
  id: string
  account_code: string
  account_name: string
  account_type: "asset" | "liability" | "equity" | "revenue" | "expense"
  parent_code?: string
  level: number
  is_active: boolean
  description?: string
  created_at: string
  updated_at: string
}

const accountTypeLabels = {
  asset: "สินทรัพย์",
  liability: "หนี้สิน",
  equity: "ทุน/กองทุน",
  revenue: "รายได้",
  expense: "ค่าใช้จ่าย",
}

const accountTypeColors = {
  asset: "text-blue-600 bg-blue-50",
  liability: "text-red-600 bg-red-50",
  equity: "text-purple-600 bg-purple-50",
  revenue: "text-green-600 bg-green-50",
  expense: "text-orange-600 bg-orange-50",
}

export default function ChartOfAccountsPage() {
  const [accounts, setAccounts] = useState<ChartOfAccount[]>([])
  const [filteredAccounts, setFilteredAccounts] = useState<ChartOfAccount[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState<string>("all")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingAccount, setEditingAccount] = useState<ChartOfAccount | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    account_code: "",
    account_name: "",
    account_type: "expense" as ChartOfAccount["account_type"],
    parent_code: "",
    level: 3,
    is_active: true,
    description: "",
  })

  const supabase = createClient()

  useEffect(() => {
    fetchAccounts()
  }, [])

  useEffect(() => {
    filterAccounts()
  }, [accounts, searchTerm, filterType])

  const fetchAccounts = async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from("chart_of_accounts")
        .select("*")
        .order("account_code", { ascending: true })

      if (error) throw error
      setAccounts(data || [])
    } catch (error) {
      console.error("Error fetching accounts:", error)
      toast({
        variant: "destructive",
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถโหลดข้อมูลผังบัญชีได้",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const filterAccounts = () => {
    let filtered = accounts

    if (filterType !== "all") {
      filtered = filtered.filter((acc) => acc.account_type === filterType)
    }

    if (searchTerm) {
      filtered = filtered.filter(
        (acc) =>
          acc.account_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
          acc.account_name.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    setFilteredAccounts(filtered)
  }

  const handleOpenDialog = (account?: ChartOfAccount) => {
    if (account) {
      setEditingAccount(account)
      setFormData({
        account_code: account.account_code,
        account_name: account.account_name,
        account_type: account.account_type,
        parent_code: account.parent_code || "",
        level: account.level,
        is_active: account.is_active,
        description: account.description || "",
      })
    } else {
      setEditingAccount(null)
      setFormData({
        account_code: "",
        account_name: "",
        account_type: "expense",
        parent_code: "",
        level: 3,
        is_active: true,
        description: "",
      })
    }
    setIsDialogOpen(true)
  }

  const handleSave = async () => {
    // Validation
    if (!formData.account_code || !formData.account_name) {
      toast({
        variant: "destructive",
        title: "กรุณากรอกข้อมูลให้ครบถ้วน",
        description: "รหัสบัญชีและชื่อบัญชีเป็นข้อมูลที่จำเป็น",
      })
      return
    }

    try {
      if (editingAccount) {
        // Update
        const { error } = await supabase
          .from("chart_of_accounts")
          .update({
            account_name: formData.account_name,
            account_type: formData.account_type,
            parent_code: formData.parent_code || null,
            level: formData.level,
            is_active: formData.is_active,
            description: formData.description || null,
          })
          .eq("id", editingAccount.id)

        if (error) throw error

        toast({
          title: "บันทึกสำเร็จ",
          description: "แก้ไขข้อมูลผังบัญชีเรียบร้อยแล้ว",
        })
      } else {
        // Check duplicate account code
        const { data: existing } = await supabase
          .from("chart_of_accounts")
          .select("account_code")
          .eq("account_code", formData.account_code)
          .single()

        if (existing) {
          toast({
            variant: "destructive",
            title: "รหัสบัญชีซ้ำ",
            description: "รหัสบัญชีนี้มีอยู่ในระบบแล้ว",
          })
          return
        }

        // Insert
        const { error } = await supabase.from("chart_of_accounts").insert({
          account_code: formData.account_code,
          account_name: formData.account_name,
          account_type: formData.account_type,
          parent_code: formData.parent_code || null,
          level: formData.level,
          is_active: formData.is_active,
          description: formData.description || null,
        })

        if (error) throw error

        toast({
          title: "บันทึกสำเร็จ",
          description: "เพิ่มผังบัญชีใหม่เรียบร้อยแล้ว",
        })
      }

      setIsDialogOpen(false)
      fetchAccounts()
    } catch (error) {
      console.error("Error saving account:", error)
      toast({
        variant: "destructive",
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถบันทึกข้อมูลได้",
      })
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("คุณต้องการลบผังบัญชีนี้ใช่หรือไม่?")) return

    try {
      const { error } = await supabase.from("chart_of_accounts").delete().eq("id", id)

      if (error) throw error

      toast({
        title: "ลบสำเร็จ",
        description: "ลบผังบัญชีเรียบร้อยแล้ว",
      })
      fetchAccounts()
    } catch (error) {
      console.error("Error deleting account:", error)
      toast({
        variant: "destructive",
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถลบข้อมูลได้",
      })
    }
  }

  const exportToCSV = () => {
    const headers = ["รหัสบัญชี", "ชื่อบัญชี", "ประเภท", "ระดับ", "สถานะ", "คำอธิบาย"]
    const rows = filteredAccounts.map((acc) => [
      acc.account_code,
      acc.account_name,
      accountTypeLabels[acc.account_type],
      acc.level.toString(),
      acc.is_active ? "ใช้งาน" : "ไม่ใช้งาน",
      acc.description || "",
    ])

    const csvContent = [headers.join(","), ...rows.map((row) => row.map((cell) => `"${cell}"`).join(","))].join("\n")

    const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.download = `ผังบัญชี_${new Date().toISOString().split("T")[0]}.csv`
    link.click()
  }

  return (
    <div className="flex-1 space-y-6 p-8">
      <PageHeader title="ผังบัญชี" description="จัดการผังบัญชีและรหัสบัญชีสำหรับระบบบัญชี" />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="ค้นหารหัสหรือชื่อบัญชี..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="ประเภทบัญชี" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">ทั้งหมด</SelectItem>
              <SelectItem value="asset">สินทรัพย์</SelectItem>
              <SelectItem value="liability">หนี้สิน</SelectItem>
              <SelectItem value="equity">ทุน/กองทุน</SelectItem>
              <SelectItem value="revenue">รายได้</SelectItem>
              <SelectItem value="expense">ค่าใช้จ่าย</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportToCSV}>
            <FileDown className="mr-2 h-4 w-4" />
            ส่งออก CSV
          </Button>
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="mr-2 h-4 w-4" />
            เพิ่มบัญชี
          </Button>
        </div>
      </div>

      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[120px]">รหัสบัญชี</TableHead>
              <TableHead>ชื่อบัญชี</TableHead>
              <TableHead className="w-[150px]">ประเภท</TableHead>
              <TableHead className="w-[80px] text-center">ระดับ</TableHead>
              <TableHead className="w-[100px] text-center">สถานะ</TableHead>
              <TableHead className="w-[100px] text-right">จัดการ</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  กำลังโหลดข้อมูล...
                </TableCell>
              </TableRow>
            ) : filteredAccounts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  ไม่พบข้อมูล
                </TableCell>
              </TableRow>
            ) : (
              filteredAccounts.map((account) => (
                <TableRow key={account.id}>
                  <TableCell className="font-mono font-medium">{account.account_code}</TableCell>
                  <TableCell>
                    <div className="font-medium" style={{ paddingLeft: `${(account.level - 1) * 20}px` }}>
                      {account.account_name}
                    </div>
                    {account.description && <div className="text-sm text-muted-foreground">{account.description}</div>}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        accountTypeColors[account.account_type]
                      }`}
                    >
                      {accountTypeLabels[account.account_type]}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">{account.level}</TableCell>
                  <TableCell className="text-center">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        account.is_active ? "bg-green-50 text-green-700" : "bg-gray-50 text-gray-700"
                      }`}
                    >
                      {account.is_active ? "ใช้งาน" : "ไม่ใช้งาน"}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(account)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(account.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingAccount ? "แก้ไขผังบัญชี" : "เพิ่มผังบัญชีใหม่"}</DialogTitle>
            <DialogDescription>กรอกข้อมูลผังบัญชีให้ครบถ้วน</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="account_code">
                  รหัสบัญชี <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="account_code"
                  value={formData.account_code}
                  onChange={(e) => setFormData({ ...formData, account_code: e.target.value })}
                  disabled={!!editingAccount}
                  placeholder="เช่น 5101"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="account_type">
                  ประเภทบัญชี <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.account_type}
                  onValueChange={(value: ChartOfAccount["account_type"]) =>
                    setFormData({ ...formData, account_type: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="asset">สินทรัพย์</SelectItem>
                    <SelectItem value="liability">หนี้สิน</SelectItem>
                    <SelectItem value="equity">ทุน/กองทุน</SelectItem>
                    <SelectItem value="revenue">รายได้</SelectItem>
                    <SelectItem value="expense">ค่าใช้จ่าย</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="account_name">
                ชื่อบัญชี <span className="text-red-500">*</span>
              </Label>
              <Input
                id="account_name"
                value={formData.account_name}
                onChange={(e) => setFormData({ ...formData, account_name: e.target.value })}
                placeholder="เช่น เงินเดือนพนักงาน"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="parent_code">รหัสบัญชีหลัก</Label>
                <Input
                  id="parent_code"
                  value={formData.parent_code}
                  onChange={(e) => setFormData({ ...formData, parent_code: e.target.value })}
                  placeholder="เช่น 5100"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="level">ระดับ</Label>
                <Input
                  id="level"
                  type="number"
                  min="1"
                  max="5"
                  value={formData.level}
                  onChange={(e) => setFormData({ ...formData, level: Number.parseInt(e.target.value) })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">คำอธิบาย</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="คำอธิบายเพิ่มเติม"
                rows={3}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked as boolean })}
              />
              <Label htmlFor="is_active" className="cursor-pointer">
                ใช้งาน
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              ยกเลิก
            </Button>
            <Button onClick={handleSave}>บันทึก</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
