"use client"

import { useState, useEffect } from "react"
import { useTheme } from "@/lib/context/theme-context"
import { useSettings } from "@/lib/settings-context"
import { Settings, Bell, Palette } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { ThemeSelector } from "@/components/theme-selector"
import { ProfileAvatar } from "@/components/profile-avatar"
import { ChangePassword } from "@/components/change-password"
import { PushNotificationsSetup } from "@/components/push-notifications"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

export function PortalSettings() {
  const { settings: themeSettings, setProfileAvatar, setWelcomeMessage, setDarkMode } = useTheme()
  const { settings, setSettings } = useSettings()
  const { toast } = useToast()
  const [localSettings, setLocalSettings] = useState({
    widgetBalance: true,
    widgetParcels: true,
    widgetAnnouncements: true,
    notificationParcels: true,
    notificationBills: true,
    notificationAnnouncements: true,
    language: 'th',
    welcomeMessage: themeSettings.welcomeMessage || ''
  })
  
  const translations = {
    th: {
      title: "ตั้งค่า Portal",
      subtitle: "ปรับแต่ง Dashboard ตามความต้องการของคุณ",
      profile: "รูปโปรไฟล์",
      welcomeMessage: "ข้อความต้อนรับ",
      welcomePlaceholder: "เช่น: ยินดีต้อนรับ",
      widgetsTitle: "Widget ที่ต้องการแสดง",
      widgetBalance: "ยอดค้างชำระ",
      widgetBalanceDesc: "แสดงการ์ดยอดค้างชำระ",
      widgetParcels: "พัสดุใหม่",
      widgetParcelsDesc: "แสดงตัวนับพัสดุใหม่",
      widgetAnnouncements: "ประกาศ",
      widgetAnnouncementsDesc: "แสดงการแจ้งเตือนประกาศ",
      notificationsTitle: "การแจ้งเตือน",
      notificationParcels: "พัสดุใหม่",
      notificationParcelsDesc: "รับการแจ้งเตือนเมื่อมีพัสดุใหม่",
      notificationBills: "บิล",
      notificationBillsDesc: "รับการแจ้งเตือนเมื่อมีบิลใหม่",
      notificationAnnouncements: "ประกาศ",
      notificationAnnouncementsDesc: "รับการแจ้งเตือนเมื่อมีประกาศใหม่",
      languageTitle: "ภาษา",
      cancel: "ยกเลิก",
      save: "บันทึก"
    },
    en: {
      title: "Portal Settings",
      subtitle: "Customize your Dashboard according to your needs",
      profile: "Profile Picture",
      welcomeMessage: "Welcome Message",
      welcomePlaceholder: "e.g.: Welcome",
      widgetsTitle: "Widgets to Display",
      widgetBalance: "Outstanding Balance",
      widgetBalanceDesc: "Display outstanding balance card",
      widgetParcels: "New Parcels",
      widgetParcelsDesc: "Display new parcel counter",
      widgetAnnouncements: "Announcements",
      widgetAnnouncementsDesc: "Display announcement notifications",
      notificationsTitle: "Notifications",
      notificationParcels: "New Parcels",
      notificationParcelsDesc: "Receive notifications for new parcels",
      notificationBills: "Bills",
      notificationBillsDesc: "Receive notifications for new bills",
      notificationAnnouncements: "Announcements",
      notificationAnnouncementsDesc: "Receive notifications for new announcements",
      languageTitle: "Language",
      cancel: "Cancel",
      save: "Save"
    }
  }
  
  const [isOpen, setIsOpen] = useState(false)
  const [language, setLanguage] = useState<'th' | 'en'>('th')
  
  useEffect(() => {
    const updateLanguage = () => {
      if (typeof window !== 'undefined') {
        const savedLang = localStorage.getItem('portal-language') || 'th'
        setLanguage(savedLang as 'th' | 'en')
      }
    }
    updateLanguage()
    const interval = setInterval(updateLanguage, 500)
    return () => clearInterval(interval)
  }, [])
  
  const t = translations[language]

  useEffect(() => {
    // Load saved settings
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('portal-user-settings')
      if (saved) {
        setLocalSettings(JSON.parse(saved))
      }
    }
  }, [])

  const handleSave = () => {
    if (typeof window !== 'undefined') {
      // Save portal settings
      localStorage.setItem('portal-user-settings', JSON.stringify(localSettings))
      
      // Set language preference
      if (localSettings.language === 'en') {
        localStorage.setItem('portal-language', 'en')
      } else {
        localStorage.setItem('portal-language', 'th')
      }
      
      // Set welcome message if changed
      if (localSettings.welcomeMessage) {
        setWelcomeMessage(localSettings.welcomeMessage)
      }
      
      // Trigger settings update event for dashboard to refresh
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('settings-updated'))
      }
      
      // Close dialog
      setIsOpen(false)
      
      // Show success toast
      toast({
        title: language === 'th' ? "บันทึกสำเร็จ" : "Saved successfully",
        description: language === 'th' ? "การตั้งค่าถูกบันทึกแล้ว" : "Settings have been saved"
      })
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9">
          <Settings className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t.title}</DialogTitle>
          <DialogDescription>
            {t.subtitle}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Profile Avatar */}
          <div>
            <Label className="text-base font-semibold mb-3 block">{t.profile}</Label>
            <ProfileAvatar />
          </div>

          {/* Welcome Message */}
          <div>
            <Label htmlFor="welcome" className="text-base font-semibold mb-2 block">
              {t.welcomeMessage}
            </Label>
            <Input
              id="welcome"
              value={localSettings.welcomeMessage}
              onChange={(e) => setLocalSettings({...localSettings, welcomeMessage: e.target.value})}
              placeholder={t.welcomePlaceholder}
            />
          </div>

          {/* Widgets */}
          <div>
            <Label className="text-base font-semibold mb-3 block">{t.widgetsTitle}</Label>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="widget-balance">{t.widgetBalance}</Label>
                  <p className="text-sm text-muted-foreground">{t.widgetBalanceDesc}</p>
                </div>
                <Switch
                  id="widget-balance"
                  checked={localSettings.widgetBalance}
                  onCheckedChange={(checked) => setLocalSettings({...localSettings, widgetBalance: checked})}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="widget-parcels">{t.widgetParcels}</Label>
                  <p className="text-sm text-muted-foreground">{t.widgetParcelsDesc}</p>
                </div>
                <Switch
                  id="widget-parcels"
                  checked={localSettings.widgetParcels}
                  onCheckedChange={(checked) => setLocalSettings({...localSettings, widgetParcels: checked})}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="widget-announcements">{t.widgetAnnouncements}</Label>
                  <p className="text-sm text-muted-foreground">{t.widgetAnnouncementsDesc}</p>
                </div>
                <Switch
                  id="widget-announcements"
                  checked={localSettings.widgetAnnouncements}
                  onCheckedChange={(checked) => setLocalSettings({...localSettings, widgetAnnouncements: checked})}
                />
              </div>
            </div>
          </div>

          {/* Notifications */}
          <div>
            <Label className="text-base font-semibold mb-3 block">{t.notificationsTitle}</Label>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="notif-parcels">{t.notificationParcels}</Label>
                  <p className="text-sm text-muted-foreground">{t.notificationParcelsDesc}</p>
                </div>
                <Switch
                  id="notif-parcels"
                  checked={localSettings.notificationParcels}
                  onCheckedChange={(checked) => setLocalSettings({...localSettings, notificationParcels: checked})}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="notif-bills">{t.notificationBills}</Label>
                  <p className="text-sm text-muted-foreground">{t.notificationBillsDesc}</p>
                </div>
                <Switch
                  id="notif-bills"
                  checked={localSettings.notificationBills}
                  onCheckedChange={(checked) => setLocalSettings({...localSettings, notificationBills: checked})}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="notif-announcements">{t.notificationAnnouncements}</Label>
                  <p className="text-sm text-muted-foreground">{t.notificationAnnouncementsDesc}</p>
                </div>
                <Switch
                  id="notif-announcements"
                  checked={localSettings.notificationAnnouncements}
                  onCheckedChange={(checked) => setLocalSettings({...localSettings, notificationAnnouncements: checked})}
                />
              </div>
            </div>
          </div>

          {/* Security */}
          <div>
            <Label className="text-base font-semibold mb-3 block">{language === 'th' ? 'ความปลอดภัย' : 'Security'}</Label>
            <ChangePassword />
          </div>

          {/* Push Notifications */}
          <div>
            <PushNotificationsSetup />
          </div>

          {/* Dark Mode */}
          <div>
            <Label className="text-base font-semibold mb-3 block">{language === 'th' ? 'โหมดมืด' : 'Dark Mode'}</Label>
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="dark-mode">{language === 'th' ? 'เปิดใช้งานโหมดมืด' : 'Enable Dark Mode'}</Label>
                <p className="text-sm text-muted-foreground">{language === 'th' ? 'สลับระหว่างโหมดสว่างและมืด' : 'Switch between light and dark themes'}</p>
              </div>
              <Switch
                id="dark-mode"
                checked={themeSettings.darkMode || false}
                onCheckedChange={(checked) => setDarkMode(checked)}
              />
            </div>
          </div>

          {/* Language */}
          <div>
            <Label className="text-base font-semibold mb-3 block">{t.languageTitle}</Label>
            <RadioGroup
              value={localSettings.language}
              onValueChange={(value) => setLocalSettings({...localSettings, language: value})}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="th" id="lang-th" />
                <Label htmlFor="lang-th">ไทย (Thai)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="en" id="lang-en" />
                <Label htmlFor="lang-en">English</Label>
              </div>
            </RadioGroup>
          </div>

          {/* Actions */}
          <div className="flex gap-2 justify-end pt-4">
            <Button variant="outline" onClick={() => setIsOpen(false)}>{t.cancel}</Button>
            <Button onClick={handleSave}>
              {t.save}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
