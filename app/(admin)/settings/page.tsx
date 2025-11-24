"use client"

import { useState, useEffect } from "react"
import { PageHeader } from "@/components/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Button } from "@/components/ui/button"
import { useSettings, Currency } from "@/lib/settings-context"
import { formatDate } from "@/lib/date-formatter"
import { useToast } from "@/hooks/use-toast"
import { Check } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"

export default function SettingsPage() {
  const { settings, updateSettings } = useSettings()
  const { toast } = useToast()
  // Use a local state to manage changes before saving
  const [localSettings, setLocalSettings] = useState(settings)

  // When the global settings context changes (e.g., on initial load), update the local state
  useEffect(() => {
    setLocalSettings(settings)
  }, [settings])

  const handleSave = () => {
    updateSettings(localSettings)
    toast({
      title: "บันทึกการตั้งค่าสำเร็จ",
      description: "การตั้งค่าของคุณได้รับการบันทึกแล้ว",
    })
  }
  
  // A temporary formatter function for the preview, as useCurrency is not available here.
  const formatCurrencyPreview = (amount: number) => {
    const options: Intl.NumberFormatOptions = {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    };
    if (localSettings.showCurrencySymbol) {
        options.style = 'currency';
        options.currency = localSettings.currency;
    }
    return new Intl.NumberFormat('th-TH', options).format(amount);
  }

  const exampleDate = new Date()
  const exampleAmount = 12345.67

  return (
    <div className="min-h-screen">
      <PageHeader title="ตั้งค่า" subtitle="จัดการการตั้งค่าระบบ" />

      <div className="p-6 max-w-4xl mx-auto">
        <div className="space-y-6">

          {/* Currency Settings */}
          <Card>
            <CardHeader>
              <CardTitle>ตั้งค่าสกุลเงิน</CardTitle>
              <CardDescription>เลือกสกุลเงินและรูปแบบการแสดงผลตัวเลขทางการเงิน</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="space-y-2 flex-1 w-full">
                  <Label>สกุลเงิน</Label>
                   <Select
                    value={localSettings.currency}
                    onValueChange={(value: Currency) =>
                      setLocalSettings({ ...localSettings, currency: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="THB">ไทย (บาท)</SelectItem>
                      <SelectItem value="USD">สหรัฐอเมริกา (ดอลลาร์)</SelectItem>
                      <SelectItem value="EUR">ยุโรป (ยูโร)</SelectItem>
                      <SelectItem value="JPY">ญี่ปุ่น (เยน)</SelectItem>
                      <SelectItem value="GBP">สหราชอาณาจักร (ปอนด์)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center space-x-2 pt-6">
                  <Switch
                    id="show-currency"
                    checked={localSettings.showCurrencySymbol}
                    onCheckedChange={(checked) =>
                      setLocalSettings({ ...localSettings, showCurrencySymbol: checked })
                    }
                  />
                  <Label htmlFor="show-currency">แสดงสัญลักษณ์สกุลเงิน</Label>
                </div>
              </div>
               <div className="text-sm text-gray-500 pt-2 border-t mt-4">
                ตัวอย่างการแสดงผล: <span className="font-semibold">{formatCurrencyPreview(exampleAmount)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Financial Settings */}
          <Card>
            <CardHeader>
              <CardTitle>ตั้งค่าการเงิน</CardTitle>
              <CardDescription>ตั้งค่าพื้นฐานเกี่ยวกับการคำนวณทางการเงิน</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="max-w-xs space-y-2">
                <Label htmlFor="commonFeeRate">อัตราค่าส่วนกลาง (ต่อตารางเมตร)</Label>
                <Input
                  id="commonFeeRate"
                  type="number"
                  value={localSettings.commonFeeRate}
                  onChange={(e) =>
                    setLocalSettings({ ...localSettings, commonFeeRate: Number(e.target.value) || 0 })
                  }
                  placeholder="เช่น 40"
                />
              </div>
            </CardContent>
          </Card>

          {/* Date Format Settings */}
          <Card>
            <CardHeader>
              <CardTitle>รูปแบบการแสดงวันที่</CardTitle>
              <CardDescription>เลือกรูปแบบการแสดงวันที่ในระบบ</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
               <RadioGroup
                  value={localSettings.dateFormat}
                  onValueChange={(value) =>
                    setLocalSettings({ ...localSettings, dateFormat: value as "short" | "medium" | "long" })
                  }
                  className="space-y-2"
                >
                  <Label className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                    <RadioGroupItem value="short" id="short" />
                    <span>แบบสั้น (dd/mm/yyyy) - {formatDate(exampleDate, "short", localSettings.yearType)}</span>
                  </Label>
                   <Label className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                    <RadioGroupItem value="medium" id="medium" />
                    <span>แบบกลาง (d Mon yyyy) - {formatDate(exampleDate, "medium", localSettings.yearType)}</span>
                  </Label>
                   <Label className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                    <RadioGroupItem value="long" id="long" />
                    <span>แบบยาว (d Month yyyy) - {formatDate(exampleDate, "long", localSettings.yearType)}</span>
                  </Label>
                </RadioGroup>
            </CardContent>
          </Card>

          {/* Year Type Settings */}
          <Card>
            <CardHeader>
              <CardTitle>รูปแบบปี</CardTitle>
              <CardDescription>เลือกระบบปีที่ใช้แสดงในระบบ</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
               <RadioGroup
                  value={localSettings.yearType}
                  onValueChange={(value) =>
                    setLocalSettings({ ...localSettings, yearType: value as "buddhist" | "christian" })
                  }
                  className="space-y-2"
                >
                  <Label className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                    <RadioGroupItem value="buddhist" id="buddhist" />
                    <span>พุทธศักราช (พ.ศ.)</span>
                  </Label>
                   <Label className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                    <RadioGroupItem value="christian" id="christian" />
                    <span>คริสต์ศักราช (ค.ศ.)</span>
                  </Label>
                </RadioGroup>
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button onClick={handleSave} size="lg" className="gap-2">
              <Check className="w-4 h-4" />
              บันทึกการตั้งค่า
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

