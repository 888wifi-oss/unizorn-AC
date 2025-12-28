"use client"

import { useState, useEffect } from "react"
import { useSettings } from "@/lib/settings-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { FileText, Save, RefreshCw, Printer } from "lucide-react"
import { toast } from "sonner"
// @ts-ignore
import { HexColorPicker } from "react-colorful"

// Mock data for preview
const MOCK_BILL = {
  bill_number: "6812000068",
  month: "12/2568",
  common_fee: 2500,
  water_fee: 350,
  electricity_fee: 1200,
  parking_fee: 0,
  other_fee: 100,
  total: 4150,
  due_date: new Date().toISOString()
}

const MOCK_UNIT = {
  unit_number: "71/55",
  owner_name: "คุณ สุชาดา ชัยสุข",
  ratio: "71/056"
}

export default function InvoiceTemplatesPage() {
  const { settings, updateSettings } = useSettings()
  const [activeTab, setActiveTab] = useState("general")
  const [localSettings, setLocalSettings] = useState(settings.invoice)
  const [isClient, setIsClient] = useState(false)

  // Sync with global settings on load
  useEffect(() => {
    setIsClient(true)
    if (settings.invoice) {
      setLocalSettings(settings.invoice)
    }
  }, [settings.invoice])

  const handleSave = () => {
    updateSettings({
      invoice: localSettings
    })
    toast.success("บันทึกการตั้งค่าเรียบร้อยแล้ว")
  }

  const handleReset = () => {
    if (settings.invoice) {
      setLocalSettings(settings.invoice)
      toast.info("รีเซ็ตค่าเป็นปัจจุบัน")
    }
  }

  if (!isClient) return null

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">แม่แบบใบแจ้งหนี้/ใบเสร็จ</h1>
          <p className="text-muted-foreground">ปรับแต่งรูปแบบเอกสารให้ตรงกับความต้องการขององค์กร</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleReset}>
            <RefreshCw className="mr-2 h-4 w-4" />
            คืนค่า
          </Button>
          <Button onClick={handleSave}>
            <Save className="mr-2 h-4 w-4" />
            บันทึก
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Editor Panel */}
        <div className="lg:col-span-4 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>ตั้งค่าเอกสาร</CardTitle>
              <CardDescription>ปรับแต่งข้อมูลและรูปแบบ</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="general">ข้อมูลทั่วไป</TabsTrigger>
                  <TabsTrigger value="design">ดีไซน์</TabsTrigger>
                </TabsList>

                <TabsContent value="general" className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label>ชื่อนิติบุคคล/บริษัท</Label>
                    <Input
                      value={localSettings.companyName}
                      onChange={(e) => setLocalSettings({ ...localSettings, companyName: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>ที่อยู่</Label>
                    <Textarea
                      className="h-20"
                      value={localSettings.address}
                      onChange={(e) => setLocalSettings({ ...localSettings, address: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>เลขประจำตัวผู้เสียภาษี</Label>
                    <Input
                      value={localSettings.taxId}
                      onChange={(e) => setLocalSettings({ ...localSettings, taxId: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>หมายเหตุท้ายเอกสาร</Label>
                    <Textarea
                      value={localSettings.note}
                      onChange={(e) => setLocalSettings({ ...localSettings, note: e.target.value })}
                      placeholder="เช่น การชำระเงินล่าช้ามีค่าปรับ..."
                    />
                  </div>
                </TabsContent>

                <TabsContent value="design" className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label>จำนวนต้นฉบับ/สำเนา</Label>
                    <div className="flex items-center gap-4 border p-4 rounded-md">
                      <Label className="flex-1">
                        {localSettings.copyCount === 1 ? 'ฉบับเดียว (เต็ม A4)' : '2 ฉบับ (ต้นฉบับ + สำเนา)'}
                      </Label>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">1</span>
                        <Switch
                          checked={localSettings.copyCount === 2}
                          onCheckedChange={(checked) => setLocalSettings({ ...localSettings, copyCount: checked ? 2 : 1 })}
                        />
                        <span className="text-sm text-muted-foreground">2</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>สีหัวข้อ (Accent Color)</Label>
                    <div className="flex gap-4">
                      <div
                        className="w-10 h-10 rounded-full border shadow-sm"
                        style={{ backgroundColor: localSettings.accentColor }}
                      />
                      <Input
                        value={localSettings.accentColor}
                        onChange={(e) => setLocalSettings({ ...localSettings, accentColor: e.target.value })}
                        className="font-mono"
                      />
                    </div>
                    {/* Simple color presets */}
                    <div className="flex gap-2 mt-2">
                      {['#000000', '#2563eb', '#16a34a', '#dc2626', '#d97706', '#7c3aed'].map(color => (
                        <button
                          key={color}
                          className="w-6 h-6 rounded-full border border-gray-200 hover:scale-110 transition-transform"
                          style={{ backgroundColor: color }}
                          onClick={() => setLocalSettings({ ...localSettings, accentColor: color })}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2 pt-4">
                    <Label>หัวเอกสาร (ไทย/อังกฤษ)</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        value={localSettings.headerText.invoice.th}
                        onChange={(e) => setLocalSettings({
                          ...localSettings,
                          headerText: {
                            ...localSettings.headerText,
                            invoice: { ...localSettings.headerText.invoice, th: e.target.value }
                          }
                        })}
                        placeholder="ใบแจ้งหนี้"
                      />
                      <Input
                        value={localSettings.headerText.invoice.en}
                        onChange={(e) => setLocalSettings({
                          ...localSettings,
                          headerText: {
                            ...localSettings.headerText,
                            invoice: { ...localSettings.headerText.invoice, en: e.target.value }
                          }
                        })}
                        placeholder="Invoice"
                      />
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Preview Panel */}
        <div className="lg:col-span-8">
          <Card className="h-full flex flex-col">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle>ตัวอย่างเอกสาร</CardTitle>
                <Badge variant="outline" className="font-normal">A4</Badge>
              </div>
            </CardHeader>
            <CardContent className="flex-1 bg-gray-100 p-8 overflow-auto min-h-[600px] flex justify-center items-start">
              <InvoicePreview settings={localSettings} bill={MOCK_BILL} unit={MOCK_UNIT} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

function InvoicePreview({ settings, bill, unit }: { settings: any, bill: any, unit: any }) {
  // This component replicates the structure of generateBillPDFV4 but in React/HTML
  // Uses inline styles to approximate the PDF output

  const isDouble = settings.copyCount === 2;

  const SingleInvoice = ({ isCopy = false }) => (
    <div
      className="bg-white p-8 text-[12px] relative flex flex-col"
      style={{
        width: isDouble ? '148mm' : '210mm', // A5 width if double, A4 if single (minus margins approx)
        height: isDouble ? '190mm' : '270mm', // Adjust as needed
        fontFamily: 'Sarabun, sans-serif'
      }}
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div className="w-[60%]">
          <h2 className="font-bold text-lg mb-1">{settings.companyName}</h2>
          <p className="whitespace-pre-wrap text-gray-600">{settings.address}</p>
          <p className="mt-1">เลขประจำตัวผู้เสียภาษี {settings.taxId}</p>
        </div>
        <div className="text-right">
          <div className="border border-black px-4 py-1 mb-2 inline-block font-bold">
            {settings.headerText.invoice.th} {isCopy ? '(สำเนา)' : '(ต้นฉบับ)'}
          </div>
          <div className="text-sm">เลขที่: {bill.bill_number}</div>
        </div>
      </div>

      {/* Customer Info */}
      <div className="border flex mb-4">
        <div className="w-[60%] border-r p-2">
          <div className="grid grid-cols-[80px_1fr] gap-1">
            <span className="font-bold">ได้รับเงินจาก:</span>
            <span>{unit.owner_name}</span>
            <span className="font-bold">ที่อยู่:</span>
            <span>{settings.address}</span>
            {/* Note: In real app, customer address might be different, but using company address as placeholder relative to unit */}
          </div>
        </div>
        <div className="w-[40%] p-2">
          <div className="grid grid-cols-[100px_1fr] gap-1 text-right md:text-left">
            <span className="font-bold">วันที่:</span>
            <span>16/12/2568</span>
            <span className="font-bold">บ้านเลขที่:</span>
            <span>{unit.unit_number}</span>
            <span className="font-bold">หมายเลขห้องชุด:</span>
            <span>{unit.ratio}</span>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1">
        <table className="w-full border-collapse border">
          <thead>
            <tr>
              <th className="border p-1 w-10 text-center">ลำดับ</th>
              <th className="border p-1 w-24 text-center">ใบแจ้งหนี้</th>
              <th className="border p-1 text-center">รายการ</th>
              <th className="border p-1 w-20 text-right">ราคา</th>
              <th className="border p-1 w-20 text-right">จำนวนเงิน</th>
            </tr>
          </thead>
          <tbody>
            <tr className="align-top h-8">
              <td className="border-x p-1 text-center">1</td>
              <td className="border-x p-1 text-center">{bill.bill_number}</td>
              <td className="border-x p-1">
                ค่าใช้จ่ายส่วนกลาง ({bill.month})
              </td>
              <td className="border-x p-1 text-right">{bill.common_fee.toFixed(2)}</td>
              <td className="border-x p-1 text-right">{bill.common_fee.toFixed(2)}</td>
            </tr>
            <tr className="align-top h-8">
              <td className="border-x p-1 text-center"></td>
              <td className="border-x p-1 text-center"></td>
              <td className="border-x p-1">
                ค่าน้ำ ({bill.month})
              </td>
              <td className="border-x p-1 text-right">{bill.water_fee.toFixed(2)}</td>
              <td className="border-x p-1 text-right">{bill.water_fee.toFixed(2)}</td>
            </tr>
            {/* Fill empty rows to make it look like a full page/half page form */}
            {[...Array(5)].map((_, i) => (
              <tr key={i} className="h-8">
                <td className="border-x"></td>
                <td className="border-x"></td>
                <td className="border-x"></td>
                <td className="border-x"></td>
                <td className="border-x"></td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={3} className="border p-1 font-bold">ตัวอักษร: สี่พันหนึ่งร้อยห้าสิบบาทถ้วน</td>
              <td className="border p-1 font-bold text-right">รวม</td>
              <td className="border p-1 font-bold text-right">{bill.total.toFixed(2)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Footer / Payment Info */}
      <div className="mt-4 border p-2 text-sm">
        <div className="font-bold mb-1">ชำระโดย:</div>
        <div>เงินโอน ธนาคาร SCB CA 9094 วันที่ ...</div>
        <div className="font-bold mt-2">หมายเหตุ:</div>
        <div className="text-xs text-gray-500">{settings.note}</div>
      </div>

      {/* Signatures */}
      <div className="mt-8 flex justify-between text-center px-4">
        <div className="w-40">
          <div className="border-b border-black mb-2 h-8"></div>
          <div className="text-xs">ผู้รับเงิน</div>
        </div>
        <div className="w-40">
          <div className="border-b border-black mb-2 h-8"></div>
          <div className="text-xs">ผู้จัดการ</div>
        </div>
      </div>

      <div className="mt-4 text-[10px] text-gray-400 text-right">
        เอกสารฉบับนี้พิมพ์ ณ วันที่ {new Date().toLocaleDateString('th-TH')}
      </div>
    </div>
  );

  return (
    <div className="shadow-lg bg-white" style={{ display: 'flex' }}>
      <SingleInvoice isCopy={false} />
      {isDouble && (
        <>
          <div className="border-l border-dashed border-gray-300 mx-2"></div>
          <SingleInvoice isCopy={true} />
        </>
      )}
    </div>
  )
}

function Badge({ children, variant, className }: any) {
  return <span className={`px-2 py-1 rounded-full text-xs ${className} ${variant === 'outline' ? 'border' : 'bg-primary text-white'}`}>{children}</span>
}
