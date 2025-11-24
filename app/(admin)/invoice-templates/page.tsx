"use client"

import { useState, useEffect } from "react"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@/lib/supabase/client"
import { useProjectContext } from "@/lib/contexts/project-context"
import { getCurrentUser } from "@/lib/utils/mock-auth"
import { Plus, Pencil, Trash2, Eye, Image as ImageIcon, Palette } from "lucide-react"

interface InvoiceTemplate {
  id: string
  project_id?: string
  template_name: string
  template_type: string
  is_default: boolean
  is_active: boolean
  header_logo_url?: string
  header_company_name?: string
  header_address?: string
  header_phone?: string
  header_email?: string
  header_tax_id?: string
  footer_text?: string
  footer_bank_accounts?: any
  layout_settings?: any
  template_html?: string
}

export default function InvoiceTemplatesPage() {
  const { selectedProjectId } = useProjectContext()
  const currentUser = getCurrentUser()
  const { toast } = useToast()
  const supabase = createClient()

  const [loading, setLoading] = useState(false)
  const [templates, setTemplates] = useState<InvoiceTemplate[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<InvoiceTemplate | null>(null)
  const [previewTemplate, setPreviewTemplate] = useState<InvoiceTemplate | null>(null)
  const [formData, setFormData] = useState({
    template_name: "",
    template_type: "invoice",
    header_logo_url: "",
    header_company_name: "",
    header_address: "",
    header_phone: "",
    header_email: "",
    header_tax_id: "",
    footer_text: "",
    primary_color: "#1e40af",
    secondary_color: "#3b82f6",
    font_family: "Sarabun, sans-serif",
    is_active: true,
    is_default: false,
  })

  useEffect(() => {
    loadTemplates()
  }, [selectedProjectId])

  const loadTemplates = async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('invoice_templates')
        .select('*')
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false })

      if (selectedProjectId && currentUser.role !== 'super_admin') {
        query = query.eq('project_id', selectedProjectId)
      }

      const { data, error } = await query

      if (error) throw error
      setTemplates(data || [])
    } catch (error: any) {
      console.error('[Invoice Templates] Error loading:', error)
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถโหลดข้อมูลได้",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleOpenDialog = (template?: InvoiceTemplate) => {
    if (template) {
      setEditingTemplate(template)
      setFormData({
        template_name: template.template_name,
        template_type: template.template_type,
        header_logo_url: template.header_logo_url || "",
        header_company_name: template.header_company_name || "",
        header_address: template.header_address || "",
        header_phone: template.header_phone || "",
        header_email: template.header_email || "",
        header_tax_id: template.header_tax_id || "",
        footer_text: template.footer_text || "",
        primary_color: template.layout_settings?.primaryColor || "#1e40af",
        secondary_color: template.layout_settings?.secondaryColor || "#3b82f6",
        font_family: template.layout_settings?.fontFamily || "Sarabun, sans-serif",
        is_active: template.is_active,
        is_default: template.is_default,
      })
    } else {
      setEditingTemplate(null)
      setFormData({
        template_name: "",
        template_type: "invoice",
        header_logo_url: "",
        header_company_name: "",
        header_address: "",
        header_phone: "",
        header_email: "",
        header_tax_id: "",
        footer_text: "",
        primary_color: "#1e40af",
        secondary_color: "#3b82f6",
        font_family: "Sarabun, sans-serif",
        is_active: true,
        is_default: false,
      })
    }
    setIsDialogOpen(true)
  }

  const handleSave = async () => {
    if (!formData.template_name.trim()) {
      toast({
        title: "กรุณากรอกชื่อ",
        description: "กรุณากรอกชื่อแม่แบบ",
        variant: "destructive",
      })
      return
    }

    try {
      const layoutSettings = {
        primaryColor: formData.primary_color,
        secondaryColor: formData.secondary_color,
        fontFamily: formData.font_family,
      }

      const templateData: any = {
        project_id: selectedProjectId || null,
        template_name: formData.template_name,
        template_type: formData.template_type,
        header_logo_url: formData.header_logo_url || null,
        header_company_name: formData.header_company_name || null,
        header_address: formData.header_address || null,
        header_phone: formData.header_phone || null,
        header_email: formData.header_email || null,
        header_tax_id: formData.header_tax_id || null,
        footer_text: formData.footer_text || null,
        layout_settings: layoutSettings,
        is_active: formData.is_active,
        is_default: formData.is_default,
      }

      // If setting as default, unset other defaults
      if (formData.is_default) {
        await supabase
          .from('invoice_templates')
          .update({ is_default: false })
          .neq('id', editingTemplate?.id || '00000000-0000-0000-0000-000000000000')
      }

      if (editingTemplate) {
        const { error } = await supabase
          .from('invoice_templates')
          .update(templateData)
          .eq('id', editingTemplate.id)

        if (error) throw error

        toast({
          title: "อัพเดทสำเร็จ",
          description: "อัพเดทแม่แบบเรียบร้อยแล้ว",
        })
      } else {
        const { error } = await supabase
          .from('invoice_templates')
          .insert([templateData])

        if (error) throw error

        toast({
          title: "สร้างสำเร็จ",
          description: "สร้างแม่แบบเรียบร้อยแล้ว",
        })
      }

      setIsDialogOpen(false)
      loadTemplates()
    } catch (error: any) {
      console.error('[Invoice Templates] Error saving:', error)
      toast({
        title: "เกิดข้อผิดพลาด",
        description: error.message || "ไม่สามารถบันทึกได้",
        variant: "destructive",
      })
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('คุณแน่ใจหรือไม่ว่าต้องการลบแม่แบบนี้?')) {
      return
    }

    try {
      const { error } = await supabase
        .from('invoice_templates')
        .delete()
        .eq('id', id)

      if (error) throw error

      toast({
        title: "ลบสำเร็จ",
        description: "ลบแม่แบบเรียบร้อยแล้ว",
      })

      loadTemplates()
    } catch (error: any) {
      console.error('[Invoice Templates] Error deleting:', error)
      toast({
        title: "เกิดข้อผิดพลาด",
        description: error.message || "ไม่สามารถลบได้",
        variant: "destructive",
      })
    }
  }

  const handlePreview = (template: InvoiceTemplate) => {
    setPreviewTemplate(template)
    setIsPreviewOpen(true)
  }

  return (
    <div>
      <PageHeader
        title="แม่แบบใบแจ้งหนี้"
        subtitle="จัดการแม่แบบสำหรับใบแจ้งหนี้และใบเสร็จ"
        action={
          <Button onClick={() => handleOpenDialog()} className="bg-blue-600 hover:bg-blue-700" size="sm">
            <Plus className="w-4 h-4 mr-2" />
            เพิ่มแม่แบบ
          </Button>
        }
      />

      <div className="bg-white rounded-lg border border-gray-200 mt-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ชื่อแม่แบบ</TableHead>
              <TableHead>ประเภท</TableHead>
              <TableHead>สถานะ</TableHead>
              <TableHead>ค่าเริ่มต้น</TableHead>
              <TableHead className="text-right">จัดการ</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  กำลังโหลด...
                </TableCell>
              </TableRow>
            ) : templates.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                  ไม่พบข้อมูล
                </TableCell>
              </TableRow>
            ) : (
              templates.map((template) => (
                <TableRow key={template.id}>
                  <TableCell className="font-medium">{template.template_name}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {template.template_type === 'invoice' ? 'ใบแจ้งหนี้' : 
                       template.template_type === 'receipt' ? 'ใบเสร็จ' : 
                       template.template_type === 'quote' ? 'ใบเสนอราคา' : template.template_type}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {template.is_active ? (
                      <Badge className="bg-green-100 text-green-700">ใช้งาน</Badge>
                    ) : (
                      <Badge variant="secondary">ปิดใช้งาน</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {template.is_default ? (
                      <Badge className="bg-blue-100 text-blue-700">ค่าเริ่มต้น</Badge>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handlePreview(template)} title="Preview">
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(template)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(template.id)}>
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Edit/Create Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingTemplate ? 'แก้ไขแม่แบบ' : 'เพิ่มแม่แบบ'}
            </DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="basic">ข้อมูลพื้นฐาน</TabsTrigger>
              <TabsTrigger value="header">Header & Logo</TabsTrigger>
              <TabsTrigger value="layout">Layout & Colors</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4 py-4">
              <div>
                <Label>ชื่อแม่แบบ *</Label>
                <Input
                  value={formData.template_name}
                  onChange={(e) => setFormData({ ...formData, template_name: e.target.value })}
                  placeholder="เช่น Template แบบมาตรฐาน"
                  className="mt-2"
                />
              </div>

              <div>
                <Label>ประเภท</Label>
                <Select value={formData.template_type} onValueChange={(value) => setFormData({ ...formData, template_type: value })}>
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="invoice">ใบแจ้งหนี้</SelectItem>
                    <SelectItem value="receipt">ใบเสร็จ</SelectItem>
                    <SelectItem value="quote">ใบเสนอราคา</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <Label>เปิดใช้งาน</Label>
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label>ตั้งเป็นค่าเริ่มต้น</Label>
                <Switch
                  checked={formData.is_default}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_default: checked })}
                />
              </div>
            </TabsContent>

            <TabsContent value="header" className="space-y-4 py-4">
              <div>
                <Label>Logo URL</Label>
                <Input
                  value={formData.header_logo_url}
                  onChange={(e) => setFormData({ ...formData, header_logo_url: e.target.value })}
                  placeholder="https://example.com/logo.png"
                  className="mt-2"
                />
                {formData.header_logo_url && (
                  <img src={formData.header_logo_url} alt="Logo preview" className="mt-2 max-h-32" onError={(e) => { e.currentTarget.style.display = 'none' }} />
                )}
              </div>

              <div>
                <Label>ชื่อบริษัท</Label>
                <Input
                  value={formData.header_company_name}
                  onChange={(e) => setFormData({ ...formData, header_company_name: e.target.value })}
                  placeholder="ชื่อบริษัท"
                  className="mt-2"
                />
              </div>

              <div>
                <Label>ที่อยู่</Label>
                <Textarea
                  value={formData.header_address}
                  onChange={(e) => setFormData({ ...formData, header_address: e.target.value })}
                  placeholder="ที่อยู่บริษัท"
                  className="mt-2"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>เบอร์โทร</Label>
                  <Input
                    value={formData.header_phone}
                    onChange={(e) => setFormData({ ...formData, header_phone: e.target.value })}
                    placeholder="02-123-4567"
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label>อีเมล</Label>
                  <Input
                    value={formData.header_email}
                    onChange={(e) => setFormData({ ...formData, header_email: e.target.value })}
                    placeholder="info@example.com"
                    className="mt-2"
                  />
                </div>
              </div>

              <div>
                <Label>เลขประจำตัวผู้เสียภาษี</Label>
                <Input
                  value={formData.header_tax_id}
                  onChange={(e) => setFormData({ ...formData, header_tax_id: e.target.value })}
                  placeholder="1234567890123"
                  className="mt-2"
                />
              </div>

              <div>
                <Label>ข้อความ Footer</Label>
                <Textarea
                  value={formData.footer_text}
                  onChange={(e) => setFormData({ ...formData, footer_text: e.target.value })}
                  placeholder="ขอบคุณที่ใช้บริการ"
                  className="mt-2"
                  rows={2}
                />
              </div>
            </TabsContent>

            <TabsContent value="layout" className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>สีหลัก</Label>
                  <div className="flex items-center gap-2 mt-2">
                    <Input
                      type="color"
                      value={formData.primary_color}
                      onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
                      className="w-16 h-10"
                    />
                    <Input
                      value={formData.primary_color}
                      onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
                      placeholder="#1e40af"
                    />
                  </div>
                </div>
                <div>
                  <Label>สีรอง</Label>
                  <div className="flex items-center gap-2 mt-2">
                    <Input
                      type="color"
                      value={formData.secondary_color}
                      onChange={(e) => setFormData({ ...formData, secondary_color: e.target.value })}
                      className="w-16 h-10"
                    />
                    <Input
                      value={formData.secondary_color}
                      onChange={(e) => setFormData({ ...formData, secondary_color: e.target.value })}
                      placeholder="#3b82f6"
                    />
                  </div>
                </div>
              </div>

              <div>
                <Label>ฟอนต์</Label>
                <Select value={formData.font_family} onValueChange={(value) => setFormData({ ...formData, font_family: value })}>
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Sarabun, sans-serif">Sarabun</SelectItem>
                    <SelectItem value="Kanit, sans-serif">Kanit</SelectItem>
                    <SelectItem value="Prompt, sans-serif">Prompt</SelectItem>
                    <SelectItem value="Arial, sans-serif">Arial</SelectItem>
                    <SelectItem value="Helvetica, sans-serif">Helvetica</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              ยกเลิก
            </Button>
            <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">
              {editingTemplate ? 'อัพเดท' : 'สร้าง'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Preview แม่แบบ: {previewTemplate?.template_name}</DialogTitle>
          </DialogHeader>
          {previewTemplate && (
            <div className="py-4">
              <div className="bg-white border-2 border-gray-200 rounded-lg p-8" style={{ fontFamily: previewTemplate.layout_settings?.fontFamily || 'Sarabun, sans-serif' }}>
                {/* Header */}
                <div className="flex items-start justify-between mb-6 pb-6 border-b">
                  <div className="flex-1">
                    {previewTemplate.header_logo_url && (
                      <img src={previewTemplate.header_logo_url} alt="Logo" className="h-16 mb-4" />
                    )}
                    {previewTemplate.header_company_name && (
                      <h2 className="text-2xl font-bold" style={{ color: previewTemplate.layout_settings?.primaryColor }}>
                        {previewTemplate.header_company_name}
                      </h2>
                    )}
                    {previewTemplate.header_address && (
                      <p className="text-sm text-gray-600 mt-2">{previewTemplate.header_address}</p>
                    )}
                    <div className="flex gap-4 mt-2 text-sm text-gray-600">
                      {previewTemplate.header_phone && <span>📞 {previewTemplate.header_phone}</span>}
                      {previewTemplate.header_email && <span>✉️ {previewTemplate.header_email}</span>}
                    </div>
                    {previewTemplate.header_tax_id && (
                      <p className="text-sm text-gray-600 mt-1">เลขประจำตัวผู้เสียภาษี: {previewTemplate.header_tax_id}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <h1 className="text-3xl font-bold" style={{ color: previewTemplate.layout_settings?.primaryColor }}>
                      ใบแจ้งหนี้
                    </h1>
                    <p className="text-sm text-gray-600 mt-2">เลขที่: BILL-2024-001</p>
                    <p className="text-sm text-gray-600">วันที่: {new Date().toLocaleDateString('th-TH')}</p>
                  </div>
                </div>

                {/* Sample Content */}
                <div className="mb-6">
                  <div className="bg-gray-50 p-4 rounded mb-4">
                    <p className="font-semibold">ห้องชุด: 101</p>
                    <p className="text-sm text-gray-600">เดือน: มกราคม 2567</p>
                  </div>
                  <table className="w-full border-collapse">
                    <thead>
                      <tr style={{ backgroundColor: previewTemplate.layout_settings?.secondaryColor, color: 'white' }}>
                        <th className="p-2 text-left">รายการ</th>
                        <th className="p-2 text-right">จำนวนเงิน</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b">
                        <td className="p-2">ค่าส่วนกลาง</td>
                        <td className="p-2 text-right">฿1,500.00</td>
                      </tr>
                      <tr className="border-b">
                        <td className="p-2">ค่าน้ำ</td>
                        <td className="p-2 text-right">฿350.00</td>
                      </tr>
                      <tr className="border-b">
                        <td className="p-2">ค่าไฟฟ้า</td>
                        <td className="p-2 text-right">฿850.00</td>
                      </tr>
                      <tr className="font-bold" style={{ backgroundColor: '#f3f4f6' }}>
                        <td className="p-2">รวมทั้งหมด</td>
                        <td className="p-2 text-right" style={{ color: previewTemplate.layout_settings?.primaryColor }}>
                          ฿2,700.00
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Footer */}
                {previewTemplate.footer_text && (
                  <div className="mt-6 pt-6 border-t text-center text-sm text-gray-600">
                    {previewTemplate.footer_text}
                  </div>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPreviewOpen(false)}>
              ปิด
            </Button>
            <Button onClick={() => window.print()} className="bg-blue-600 hover:bg-blue-700">
              พิมพ์
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

