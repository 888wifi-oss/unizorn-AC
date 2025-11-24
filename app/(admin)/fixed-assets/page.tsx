"use client"

import { useState, useEffect } from "react"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Edit, Trash2, Search } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useSettings } from "@/lib/settings-context"
import { formatDate } from "@/lib/date-formatter"
import { useCurrency } from "@/lib/currency-formatter"
import {
  getFixedAssets,
  saveFixedAsset,
  deleteFixedAsset,
  getChartOfAccountsFromDB,
} from "@/lib/supabase/actions"

interface FixedAsset {
  id: string
  asset_name: string
  asset_code?: string
  purchase_date: string
  purchase_cost: number
  lifespan_years: number
  status: string
  salvage_value?: number
}

interface ChartOfAccount {
  account_code: string
  account_name: string
}

export default function FixedAssetsPage() {
  const [assets, setAssets] = useState<FixedAsset[]>([])
  const [accounts, setAccounts] = useState<ChartOfAccount[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const { toast } = useToast()
  const { settings } = useSettings()
  const { formatCurrency } = useCurrency()

  const [formData, setFormData] = useState({
    asset_name: "",
    asset_code: "",
    description: "",
    purchase_date: new Date().toISOString().split("T")[0],
    purchase_cost: "",
    lifespan_years: "",
    salvage_value: "0",
    status: "in_use",
    location: "",
    asset_account_code: "",
    depreciation_account_code: "",
    expense_account_code: "",
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    if (isLoading) {
      // ป้องกันการโหลดซ้อน
      // แต่ยังคงตั้งค่าต่อไปหากถูกเรียกครั้งแรก
    }
    setIsLoading(true)
    const tStart = Date.now()
    try {
      const projectId = (settings as any)?.selectedProjectId || null
      const restrictToProject = (settings as any)?.role !== 'super_admin'

      const [assetsData, accountsData] = await Promise.all([
        (async () => {
          const ts = Date.now()
          const data = await getFixedAssets(projectId, restrictToProject)
          console.log('[perf][fixed-assets] assets fetch:', { count: data?.length || 0, duration_ms: Date.now() - ts, projectId, restrictToProject })
          return data
        })(),
        (async () => {
          const ts = Date.now()
          const data = await getChartOfAccountsFromDB()
          console.log('[perf][fixed-assets] accounts fetch:', { count: data?.length || 0, duration_ms: Date.now() - ts })
          return data
        })(),
      ])

      setAssets(assetsData)
      setAccounts(accountsData)
    } catch (error) {
      console.error('[fixed-assets] load error:', error)
      toast({ title: "เกิดข้อผิดพลาด", description: "ไม่สามารถโหลดข้อมูลทรัพย์สินได้", variant: "destructive" })
    } finally {
      console.log('[perf][fixed-assets] total load:', { duration_ms: Date.now() - tStart })
      setIsLoading(false)
    }
  }

  const handleOpenDialog = (asset?: FixedAsset) => {
    if (asset) {
      const fullAssetData = assets.find(a => a.id === asset.id) as any; // Cast to access all fields
      setEditingId(asset.id)
      setFormData({
        asset_name: fullAssetData.asset_name,
        asset_code: fullAssetData.asset_code || "",
        description: fullAssetData.description || "",
        purchase_date: fullAssetData.purchase_date,
        purchase_cost: String(fullAssetData.purchase_cost),
        lifespan_years: String(fullAssetData.lifespan_years),
        salvage_value: String(fullAssetData.salvage_value || 0),
        status: fullAssetData.status,
        location: fullAssetData.location || "",
        asset_account_code: fullAssetData.asset_account_code || "1201",
        depreciation_account_code: fullAssetData.depreciation_account_code || "1204",
        expense_account_code: fullAssetData.expense_account_code || "5901",
      })
    } else {
      setEditingId(null)
      setFormData({
        asset_name: "",
        asset_code: "",
        description: "",
        purchase_date: new Date().toISOString().split("T")[0],
        purchase_cost: "",
        lifespan_years: "",
        salvage_value: "0",
        status: "in_use",
        location: "",
        asset_account_code: "1201", // Default asset account
        depreciation_account_code: "1204", // Default accumulated dep.
        expense_account_code: "5901", // Default dep. expense
      })
    }
    setIsDialogOpen(true)
  }

  const handleSave = async () => {
    if (!formData.asset_name || !formData.purchase_date || !formData.purchase_cost || !formData.lifespan_years) {
      toast({ title: "ข้อมูลไม่ครบถ้วน", description: "กรุณากรอกข้อมูลที่จำเป็น (*)", variant: "destructive" })
      return
    }

    // Client-side duplicate check for asset_code
    if (formData.asset_code) {
      const isDuplicate = assets.some(
        (asset) => asset.asset_code === formData.asset_code && asset.id !== editingId
      );
      if (isDuplicate) {
        toast({
          title: "รหัสทรัพย์สินซ้ำ",
          description: `รหัสทรัพย์สิน "${formData.asset_code}" มีอยู่แล้วในระบบ กรุณาใช้รหัสอื่น`,
          variant: "destructive",
        });
        return; // Stop execution
      }
    }

    setIsLoading(true)
    try {
      await saveFixedAsset({
        id: editingId,
        ...formData,
        project_id: (settings as any)?.selectedProjectId || null,
        purchase_cost: parseFloat(formData.purchase_cost) || 0,
        lifespan_years: parseInt(formData.lifespan_years) || 0,
        salvage_value: parseFloat(formData.salvage_value) || 0,
      })
      await loadData()
      setIsDialogOpen(false)
      toast({ title: "สำเร็จ", description: "บันทึกข้อมูลทรัพย์สินเรียบร้อยแล้ว" })
    } catch (error: any) {
      console.error("Error saving asset:", error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: error.message || "ไม่สามารถบันทึกข้อมูลได้",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("คุณต้องการลบทรัพย์สินนี้ใช่หรือไม่?")) return
    setIsLoading(true)
    try {
      await deleteFixedAsset(id)
      await loadData()
      toast({ title: "สำเร็จ", description: "ลบทรัพย์สินเรียบร้อยแล้ว" })
    } catch (error: any) {
      toast({ title: "เกิดข้อผิดพลาด", description: error.message, variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }

  const filteredAssets = assets.filter(
    (asset) =>
      asset.asset_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (asset.asset_code || "").toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getBookValue = (asset: FixedAsset) => {
    const purchaseDate = new Date(asset.purchase_date);
    const today = new Date();
    const monthsElapsed = Math.max(0, (today.getFullYear() - purchaseDate.getFullYear()) * 12 + (today.getMonth() - purchaseDate.getMonth()));
    const usefulLifeMonths = asset.lifespan_years * 12;

    if (monthsElapsed === 0 || usefulLifeMonths === 0) {
      return asset.purchase_cost;
    }

    const depreciableCost = asset.purchase_cost - (asset.salvage_value || 0);
    const monthlyDepreciation = depreciableCost / usefulLifeMonths;
    const accumulatedDepreciation = Math.min(monthlyDepreciation * monthsElapsed, depreciableCost);

    return asset.purchase_cost - accumulatedDepreciation;
  };


  return (
    <div>
      <PageHeader
        title="ทะเบียนทรัพย์สิน"
        subtitle="จัดการข้อมูลทรัพย์สินส่วนกลางและค่าเสื่อมราคา"
        action={
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="w-4 h-4 mr-2" />
            เพิ่มทรัพย์สิน
          </Button>
        }
      />
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>รายการทรัพย์สิน</CardTitle>
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="ค้นหาชื่อหรือรหัสทรัพย์สิน..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>รหัสทรัพย์สิน</TableHead>
                <TableHead>ชื่อทรัพย์สิน</TableHead>
                <TableHead>วันที่ซื้อ</TableHead>
                <TableHead className="text-right">ราคาทุน</TableHead>
                <TableHead className="text-right">มูลค่าปัจจุบัน (โดยประมาณ)</TableHead>
                <TableHead>สถานะ</TableHead>
                <TableHead className="text-right">จัดการ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8">กำลังโหลด...</TableCell></TableRow>
              ) : filteredAssets.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">ไม่พบข้อมูล</TableCell></TableRow>
              ) : (
                filteredAssets.map((asset) => (
                  <TableRow key={asset.id}>
                    <TableCell className="font-mono">{asset.asset_code || "-"}</TableCell>
                    <TableCell className="font-medium">{asset.asset_name}</TableCell>
                    <TableCell>{formatDate(asset.purchase_date, "short", settings.yearType)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(asset.purchase_cost)}</TableCell>
                    <TableCell className="text-right font-semibold">{formatCurrency(getBookValue(asset))}</TableCell>
                    <TableCell>{asset.status}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(asset)}><Edit className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(asset.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader><DialogTitle>{editingId ? "แก้ไขทรัพย์สิน" : "เพิ่มทรัพย์สินใหม่"}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="col-span-2 space-y-2">
              <Label htmlFor="asset_name">ชื่อทรัพย์สิน *</Label>
              <Input id="asset_name" value={formData.asset_name} onChange={(e) => setFormData({ ...formData, asset_name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="asset_code">รหัสทรัพย์สิน</Label>
              <Input id="asset_code" value={formData.asset_code} onChange={(e) => setFormData({ ...formData, asset_code: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="purchase_date">วันที่ซื้อ *</Label>
              <Input id="purchase_date" type="date" value={formData.purchase_date} onChange={(e) => setFormData({ ...formData, purchase_date: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="purchase_cost">ราคาทุน *</Label>
              <Input id="purchase_cost" type="number" value={formData.purchase_cost} onChange={(e) => setFormData({ ...formData, purchase_cost: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lifespan_years">อายุการใช้งาน (ปี) *</Label>
              <Input id="lifespan_years" type="number" value={formData.lifespan_years} onChange={(e) => setFormData({ ...formData, lifespan_years: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="salvage_value">มูลค่าซาก</Label>
              <Input id="salvage_value" type="number" value={formData.salvage_value} onChange={(e) => setFormData({ ...formData, salvage_value: e.target.value })} />
            </div>
            <div className="col-span-2 space-y-2">
              <Label htmlFor="description">รายละเอียด</Label>
              <Textarea id="description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
            </div>
            <div className="col-span-2 border-t pt-4 mt-2 space-y-4">
              <div className="space-y-2">
                <Label>บัญชีทรัพย์สิน</Label>
                <Select value={formData.asset_account_code} onValueChange={v => setFormData({ ...formData, asset_account_code: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{accounts.filter(a => a.account_code.startsWith('1')).map(a => <SelectItem key={a.account_code} value={a.account_code}>{a.account_code} - {a.account_name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>บัญชีค่าเสื่อมราคาสะสม</Label>
                <Select value={formData.depreciation_account_code} onValueChange={v => setFormData({ ...formData, depreciation_account_code: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{accounts.filter(a => a.account_code.startsWith('1')).map(a => <SelectItem key={a.account_code} value={a.account_code}>{a.account_code} - {a.account_name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>บัญชีค่าเสื่อมราคา (ค่าใช้จ่าย)</Label>
                <Select value={formData.expense_account_code} onValueChange={v => setFormData({ ...formData, expense_account_code: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{accounts.filter(a => a.account_code.startsWith('5')).map(a => <SelectItem key={a.account_code} value={a.account_code}>{a.account_code} - {a.account_name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>ยกเลิก</Button>
            <Button onClick={handleSave} disabled={isLoading}>{isLoading ? "กำลังบันทึก..." : "บันทึก"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

