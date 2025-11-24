"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { 
  Moon, 
  Sun, 
  Palette, 
  Monitor, 
  Smartphone, 
  Tablet,
  Eye,
  EyeOff,
  Settings,
  Check,
  X
} from "lucide-react"
import { toast } from "@/hooks/use-toast"

interface ThemeSettings {
  mode: 'light' | 'dark' | 'system'
  primaryColor: string
  fontSize: 'small' | 'medium' | 'large'
  compactMode: boolean
  showAnimations: boolean
  sidebarCollapsed: boolean
}

const colorOptions = [
  { name: 'Blue', value: 'blue', class: 'bg-blue-500' },
  { name: 'Green', value: 'green', class: 'bg-green-500' },
  { name: 'Purple', value: 'purple', class: 'bg-purple-500' },
  { name: 'Orange', value: 'orange', class: 'bg-orange-500' },
  { name: 'Red', value: 'red', class: 'bg-red-500' },
  { name: 'Pink', value: 'pink', class: 'bg-pink-500' },
  { name: 'Indigo', value: 'indigo', class: 'bg-indigo-500' },
  { name: 'Teal', value: 'teal', class: 'bg-teal-500' },
]

export default function ThemeSettingsPage() {
  const [settings, setSettings] = useState<ThemeSettings>({
    mode: 'system',
    primaryColor: 'blue',
    fontSize: 'medium',
    compactMode: false,
    showAnimations: true,
    sidebarCollapsed: false
  })

  const [previewMode, setPreviewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop')

  useEffect(() => {
    // Load saved settings from localStorage
    const savedSettings = localStorage.getItem('theme-settings')
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings)
        const newSettings = { ...settings, ...parsed }
        setSettings(newSettings)
        applySettings(newSettings)
      } catch (error) {
        console.error('Error loading theme settings:', error)
      }
    }
  }, [])

  const applySettings = (newSettings: ThemeSettings) => {
    // Apply theme mode
    const root = document.documentElement
    root.classList.remove('light', 'dark')
    
    if (newSettings.mode === 'dark') {
      root.classList.add('dark')
    } else if (newSettings.mode === 'light') {
      root.classList.add('light')
    } else {
      // System mode
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      root.classList.add(prefersDark ? 'dark' : 'light')
    }

    // Apply primary color
    root.style.setProperty('--primary', `hsl(var(--${newSettings.primaryColor}))`)
    
    // Apply font size
    const fontSizeMap = {
      small: '14px',
      medium: '16px',
      large: '18px'
    }
    root.style.setProperty('--font-size-base', fontSizeMap[newSettings.fontSize])

    // Apply compact mode
    if (newSettings.compactMode) {
      root.classList.add('compact-mode')
    } else {
      root.classList.remove('compact-mode')
    }

    // Apply animations
    if (!newSettings.showAnimations) {
      root.classList.add('no-animations')
    } else {
      root.classList.remove('no-animations')
    }

    // Apply sidebar state
    if (newSettings.sidebarCollapsed) {
      root.classList.add('sidebar-collapsed')
    } else {
      root.classList.remove('sidebar-collapsed')
    }
  }

  const updateSetting = <K extends keyof ThemeSettings>(key: K, value: ThemeSettings[K]) => {
    const newSettings = { ...settings, [key]: value }
    setSettings(newSettings)
    applySettings(newSettings)
    
    // Save to localStorage
    localStorage.setItem('theme-settings', JSON.stringify(newSettings))
    
    toast({
      title: "บันทึกการตั้งค่า",
      description: "การตั้งค่าถูกบันทึกเรียบร้อยแล้ว",
    })
  }

  const resetSettings = () => {
    const defaultSettings: ThemeSettings = {
      mode: 'system',
      primaryColor: 'blue',
      fontSize: 'medium',
      compactMode: false,
      showAnimations: true,
      sidebarCollapsed: false
    }
    
    setSettings(defaultSettings)
    applySettings(defaultSettings)
    localStorage.setItem('theme-settings', JSON.stringify(defaultSettings))
    
    toast({
      title: "รีเซ็ตการตั้งค่า",
      description: "การตั้งค่าถูกรีเซ็ตเป็นค่าเริ่มต้น",
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">การตั้งค่าธีม</h1>
          <p className="text-gray-600">ปรับแต่งรูปลักษณ์และความรู้สึกของระบบ</p>
        </div>
        <Button variant="outline" onClick={resetSettings}>
          รีเซ็ตการตั้งค่า
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Settings Panel */}
        <div className="lg:col-span-2 space-y-6">
          {/* Theme Mode */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Palette className="w-5 h-5 mr-2" />
                โหมดธีม
              </CardTitle>
              <CardDescription>
                เลือกโหมดสีที่ต้องการใช้
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <Button
                  variant={settings.mode === 'light' ? 'default' : 'outline'}
                  onClick={() => updateSetting('mode', 'light')}
                  className="h-20 flex flex-col items-center justify-center"
                >
                  <Sun className="w-6 h-6 mb-2" />
                  <span className="text-sm">สว่าง</span>
                </Button>
                <Button
                  variant={settings.mode === 'dark' ? 'default' : 'outline'}
                  onClick={() => updateSetting('mode', 'dark')}
                  className="h-20 flex flex-col items-center justify-center"
                >
                  <Moon className="w-6 h-6 mb-2" />
                  <span className="text-sm">มืด</span>
                </Button>
                <Button
                  variant={settings.mode === 'system' ? 'default' : 'outline'}
                  onClick={() => updateSetting('mode', 'system')}
                  className="h-20 flex flex-col items-center justify-center"
                >
                  <Monitor className="w-6 h-6 mb-2" />
                  <span className="text-sm">ตามระบบ</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Primary Color */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Palette className="w-5 h-5 mr-2" />
                สีหลัก
              </CardTitle>
              <CardDescription>
                เลือกสีหลักของระบบ
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-3">
                {colorOptions.map((color) => (
                  <Button
                    key={color.value}
                    variant={settings.primaryColor === color.value ? 'default' : 'outline'}
                    onClick={() => updateSetting('primaryColor', color.value)}
                    className="h-12 flex items-center justify-center"
                  >
                    <div className={`w-6 h-6 rounded-full ${color.class} mr-2`} />
                    <span className="text-sm">{color.name}</span>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Font Size */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Settings className="w-5 h-5 mr-2" />
                ขนาดตัวอักษร
              </CardTitle>
              <CardDescription>
                ปรับขนาดตัวอักษรให้เหมาะสมกับการใช้งาน
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <Button
                  variant={settings.fontSize === 'small' ? 'default' : 'outline'}
                  onClick={() => updateSetting('fontSize', 'small')}
                  className="h-16 flex flex-col items-center justify-center"
                >
                  <span className="text-sm">A</span>
                  <span className="text-xs mt-1">เล็ก</span>
                </Button>
                <Button
                  variant={settings.fontSize === 'medium' ? 'default' : 'outline'}
                  onClick={() => updateSetting('fontSize', 'medium')}
                  className="h-16 flex flex-col items-center justify-center"
                >
                  <span className="text-base">A</span>
                  <span className="text-xs mt-1">กลาง</span>
                </Button>
                <Button
                  variant={settings.fontSize === 'large' ? 'default' : 'outline'}
                  onClick={() => updateSetting('fontSize', 'large')}
                  className="h-16 flex flex-col items-center justify-center"
                >
                  <span className="text-lg">A</span>
                  <span className="text-xs mt-1">ใหญ่</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Additional Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Settings className="w-5 h-5 mr-2" />
                การตั้งค่าเพิ่มเติม
              </CardTitle>
              <CardDescription>
                ปรับแต่งการแสดงผลเพิ่มเติม
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">โหมดกะทัดรัด</div>
                  <div className="text-sm text-gray-600">ลดระยะห่างระหว่างองค์ประกอบ</div>
                </div>
                <Switch
                  checked={settings.compactMode}
                  onCheckedChange={(checked) => updateSetting('compactMode', checked)}
                />
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">แสดงแอนิเมชัน</div>
                  <div className="text-sm text-gray-600">เปิด/ปิดการเคลื่อนไหวขององค์ประกอบ</div>
                </div>
                <Switch
                  checked={settings.showAnimations}
                  onCheckedChange={(checked) => updateSetting('showAnimations', checked)}
                />
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">ซ่อนแถบเมนูด้านข้าง</div>
                  <div className="text-sm text-gray-600">ย่อแถบเมนูด้านข้างให้เล็กลง</div>
                </div>
                <Switch
                  checked={settings.sidebarCollapsed}
                  onCheckedChange={(checked) => updateSetting('sidebarCollapsed', checked)}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Preview Panel */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Eye className="w-5 h-5 mr-2" />
                ตัวอย่างการแสดงผล
              </CardTitle>
              <CardDescription>
                ดูตัวอย่างการแสดงผลตามการตั้งค่าปัจจุบัน
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Device Preview Toggle */}
                <div className="flex space-x-2">
                  <Button
                    size="sm"
                    variant={previewMode === 'desktop' ? 'default' : 'outline'}
                    onClick={() => setPreviewMode('desktop')}
                  >
                    <Monitor className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant={previewMode === 'tablet' ? 'default' : 'outline'}
                    onClick={() => setPreviewMode('tablet')}
                  >
                    <Tablet className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant={previewMode === 'mobile' ? 'default' : 'outline'}
                    onClick={() => setPreviewMode('mobile')}
                  >
                    <Smartphone className="w-4 h-4" />
                  </Button>
                </div>

                {/* Preview Container */}
                <div className={`border rounded-lg p-4 bg-gray-50 dark:bg-gray-800 ${
                  previewMode === 'desktop' ? 'w-full' :
                  previewMode === 'tablet' ? 'w-80 mx-auto' :
                  'w-64 mx-auto'
                }`}>
                  <div className="space-y-3">
                    {/* Header Preview */}
                    <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-700 rounded">
                      <div className="flex items-center space-x-2">
                        <div className="w-6 h-6 bg-blue-500 rounded"></div>
                        <span className="font-medium">ระบบจัดการคอนโด</span>
                      </div>
                      <Badge variant="outline">Admin</Badge>
                    </div>

                    {/* Content Preview */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="p-2 bg-white dark:bg-gray-700 rounded text-center">
                        <div className="text-lg font-bold text-blue-600">150</div>
                        <div className="text-xs text-gray-600">ห้องทั้งหมด</div>
                      </div>
                      <div className="p-2 bg-white dark:bg-gray-700 rounded text-center">
                        <div className="text-lg font-bold text-green-600">120</div>
                        <div className="text-xs text-gray-600">ห้องที่อยู่อาศัย</div>
                      </div>
                    </div>

                    {/* Button Preview */}
                    <div className="flex space-x-2">
                      <Button size="sm" className="flex-1">เพิ่มข้อมูล</Button>
                      <Button size="sm" variant="outline">แก้ไข</Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Current Settings Summary */}
          <Card>
            <CardHeader>
              <CardTitle>การตั้งค่าปัจจุบัน</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>โหมดธีม:</span>
                <Badge variant="outline">
                  {settings.mode === 'light' ? 'สว่าง' : 
                   settings.mode === 'dark' ? 'มืด' : 'ตามระบบ'}
                </Badge>
              </div>
              <div className="flex justify-between text-sm">
                <span>สีหลัก:</span>
                <Badge variant="outline">{settings.primaryColor}</Badge>
              </div>
              <div className="flex justify-between text-sm">
                <span>ขนาดตัวอักษร:</span>
                <Badge variant="outline">
                  {settings.fontSize === 'small' ? 'เล็ก' :
                   settings.fontSize === 'medium' ? 'กลาง' : 'ใหญ่'}
                </Badge>
              </div>
              <div className="flex justify-between text-sm">
                <span>โหมดกะทัดรัด:</span>
                <Badge variant={settings.compactMode ? 'default' : 'outline'}>
                  {settings.compactMode ? 'เปิด' : 'ปิด'}
                </Badge>
              </div>
              <div className="flex justify-between text-sm">
                <span>แอนิเมชัน:</span>
                <Badge variant={settings.showAnimations ? 'default' : 'outline'}>
                  {settings.showAnimations ? 'เปิด' : 'ปิด'}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
