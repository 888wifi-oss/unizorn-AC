"use client"

import { useState } from "react"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calculator, Check, Info } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useCurrency } from "@/lib/currency-formatter"
import { calculateDepreciationPreview, postDepreciationEntries } from "@/lib/supabase/actions"
import { useProjectContext } from "@/lib/contexts/project-context"
import { useSettings } from "@/lib/settings-context"
import { getCurrentUser } from "@/lib/utils/mock-auth"

interface DepreciationPreview {
  asset_id: string
  asset_name: string
  asset_code?: string
  monthly_depreciation: number
  journal_description: string
}

export default function DepreciationPage() {
  const [previews, setPreviews] = useState<DepreciationPreview[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [calculationMonth, setCalculationMonth] = useState(new Date().toISOString().slice(0, 7))
  const [hasCalculated, setHasCalculated] = useState(false)
  const { toast } = useToast()
  const { formatCurrency } = useCurrency()
  const { selectedProjectId } = useProjectContext()
  const { settings } = useSettings()
  const currentUser = getCurrentUser()

  const handleCalculate = async () => {
    setIsLoading(true)
    setHasCalculated(false)
    try {
      const tStart = typeof performance !== 'undefined' ? performance.now() : Date.now()
      const data = await calculateDepreciationPreview(calculationMonth, selectedProjectId || null)
      setPreviews(data)
      setHasCalculated(true)
      const tEnd = typeof performance !== 'undefined' ? performance.now() : Date.now()
      console.log('[perf][depr] page calculate success:', {
        count: data.length,
        duration_ms: Math.round(tEnd - tStart),
        filtered: Boolean(selectedProjectId)
      })
      if (data.length === 0) {
        toast({ title: "ไม่พบรายการ", description: "ไม่มีค่าเสื่อมราคาให้บันทึกในเดือนที่เลือก" })
      }
    } catch (error: any) {
      toast({ title: "เกิดข้อผิดพลาด", description: error.message, variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }

  const handlePost = async () => {
    if (previews.length === 0) {
      toast({ title: "ไม่มีข้อมูล", description: "ไม่มีรายการค่าเสื่อมราคาที่จะบันทึก", variant: "destructive" })
      return
    }
    if (!confirm(`คุณต้องการบันทึกค่าเสื่อมราคาจำนวน ${previews.length} รายการ สำหรับเดือน ${calculationMonth} ใช่หรือไม่?`)) return

    setIsLoading(true)
    try {
      const tStart = typeof performance !== 'undefined' ? performance.now() : Date.now()
      await postDepreciationEntries(calculationMonth, previews)
      const tEnd = typeof performance !== 'undefined' ? performance.now() : Date.now()
      console.log('[perf][depr] page post success:', {
        count: previews.length,
        duration_ms: Math.round(tEnd - tStart)
      })
      toast({ title: "สำเร็จ", description: "บันทึกค่าเสื่อมราคาลงในสมุดรายวันเรียบร้อยแล้ว" })
      setPreviews([]) // Clear after posting
      setHasCalculated(false)
    } catch (error: any) {
      toast({ title: "เกิดข้อผิดพลาด", description: error.message, variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }
  
  const totalDepreciation = previews.reduce((sum, item) => sum + item.monthly_depreciation, 0);

  return (
    <div>
      <PageHeader
        title="คำนวณค่าเสื่อมราคา"
        subtitle="คำนวณและบันทึกค่าเสื่อมราคาทรัพย์สินประจำเดือน"
      />
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>เลือกเดือนที่ต้องการคำนวณ</CardTitle>
        </CardHeader>
        <CardContent className="flex items-end gap-4">
          <div className="space-y-2">
            <Label htmlFor="calculationMonth">เดือน-ปี</Label>
            <Input
              id="calculationMonth"
              type="month"
              value={calculationMonth}
              onChange={(e) => setCalculationMonth(e.target.value)}
              className="w-48"
            />
          </div>
          <Button onClick={handleCalculate} disabled={isLoading}>
            <Calculator className="w-4 h-4 mr-2" />
            {isLoading ? "กำลังคำนวณ..." : "คำนวณ"}
          </Button>
        </CardContent>
      </Card>

      {hasCalculated && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>รายการค่าเสื่อมราคาประจำเดือน {calculationMonth}</CardTitle>
                <p className="text-muted-foreground text-sm mt-1">
                  พบ {previews.length} รายการ รวมเป็นเงิน {formatCurrency(totalDepreciation)}
                </p>
              </div>
              <Button onClick={handlePost} disabled={isLoading || previews.length === 0} className="bg-green-600 hover:bg-green-700">
                <Check className="w-4 h-4 mr-2" />
                {isLoading ? "กำลังบันทึก..." : "ยืนยันและบันทึกรายการ"}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {previews.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground border rounded-lg bg-gray-50">
                    <Info className="mx-auto w-10 h-10 text-gray-400"/>
                    <p className="mt-2">ไม่พบรายการค่าเสื่อมราคาที่ต้องบันทึกสำหรับเดือนนี้</p>
                    <p className="text-xs">อาจเนื่องมาจากได้บันทึกไปแล้ว หรือทรัพย์สินยังไม่ถึงรอบการคำนวณ</p>
                </div>
            ) : (
                <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead>รหัสทรัพย์สิน</TableHead>
                    <TableHead>ชื่อทรัพย์สิน</TableHead>
                    <TableHead>รายละเอียดการบันทึก</TableHead>
                    <TableHead className="text-right">ค่าเสื่อมราคารายเดือน</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {previews.map((item) => (
                    <TableRow key={item.asset_id}>
                        <TableCell className="font-mono">{item.asset_code || "-"}</TableCell>
                        <TableCell className="font-medium">{item.asset_name}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{item.journal_description}</TableCell>
                        <TableCell className="text-right font-semibold">{formatCurrency(item.monthly_depreciation)}</TableCell>
                    </TableRow>
                    ))}
                </TableBody>
                </Table>
            )}
          </CardContent>
        </Card>
      )}

      {!hasCalculated && (
         <Card className="mt-6 flex flex-col items-center justify-center h-64 border-dashed">
            <Calculator className="w-12 h-12 text-muted-foreground" />
            <p className="mt-4 text-muted-foreground">กรุณาเลือกเดือนและกด "คำนวณ" เพื่อดูรายการค่าเสื่อมราคา</p>
        </Card>
      )}
    </div>
  )
}
