"use client"

import { useState, useEffect, useCallback, useMemo, memo } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import {
  getPortalDataForUnit,
  getReceiptData,
  createMaintenanceRequest,
  getOutstandingBills,
  getPaymentHistory,
  getPortalAnnouncements,
  getPortalMaintenanceRequests
} from "@/lib/supabase/actions"
import { getParcelsForUnit } from "@/lib/supabase/parcel-actions"
import { createClient } from "@/lib/supabase/client"
import { useSettings } from "@/lib/settings-context"
import { formatDate } from "@/lib/date-formatter"
import { useToast } from "@/hooks/use-toast"
import { useCurrency } from "@/lib/currency-formatter"
import { generateBillPDFV4, generateReceiptPDFV4, PDFLanguage } from "@/lib/pdf-generator-v4"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { DollarSign, Loader2, LogOut } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { NotificationBell } from "@/components/notification-bell"
import { ThemeSelector } from "@/components/theme-selector"
import { ProfileAvatar } from "@/components/profile-avatar"
import { PortalSettings } from "@/components/portal-settings"
import { useTheme, getThemeClasses } from "@/lib/context/theme-context"
import { PaymentMethodsDialog } from "@/app/(admin)/payments/payment-methods-dialog"
import { SlipUploadDialog } from "@/app/(admin)/payments/slip-upload-dialog"
import dynamic from 'next/dynamic'
import { OutstandingBills } from "@/components/portal/outstanding-bills"
import { PaymentHistory } from "@/components/portal/payment-history"
import { Announcements } from "@/components/portal/announcements"
import { MaintenanceList } from "@/components/portal/maintenance-list"
import { DashboardOverview } from "@/components/portal/dashboard-overview"
import { uiTranslations } from "@/lib/portal-translations"
import useSWR, { mutate } from 'swr'

const ParcelView = dynamic(() => import('@/components/parcel-view'), {
  loading: () => <div className="flex items-center justify-center py-8"><Loader2 className="h-8 w-8 animate-spin" /></div>
})

// Translation objects for UI
// Translation objects moved to @/lib/portal-translations

// Interfaces
interface ResidentInfo { id: string; unit_number: string; owner_name: string; resident_name?: string; project_id?: string; }
interface Bill { id: string; month: string; total: number; due_date: string; status: string; common_fee: number; water_fee: number; electricity_fee: number; parking_fee: number; other_fee: number; unitNumber: string; }
interface Payment { id: string; bill_id: string; amount: number; payment_date: string; reference_number: string; bills: { bill_number: string } }
interface Announcement { id: string; title: string; content: string; publish_date: string; is_pinned: boolean; category?: string; image_urls?: string[]; attachments?: string[]; }
interface MaintenanceRequest { id: string; title: string; status: string; created_at: string; scheduled_at?: string | null; }

export default function PortalDashboardPage() {
  const [residentInfo, setResidentInfo] = useState<ResidentInfo | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)
  const [isPaymentMethodsDialogOpen, setIsPaymentMethodsDialogOpen] = useState(false)
  const [isSlipUploadDialogOpen, setIsSlipUploadDialogOpen] = useState(false)
  const [isMaintenanceModalOpen, setIsMaintenanceModalOpen] = useState(false)
  const [selectedBillForPayment, setSelectedBillForPayment] = useState<Bill | null>(null)
  const [selectedPaymentTransactionId, setSelectedPaymentTransactionId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<string>("outstanding")
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const { settings } = useSettings()
  const { formatCurrency } = useCurrency()
  const { theme, settings: themeSettings } = useTheme()

  const [displayLanguage, setDisplayLanguage] = useState<PDFLanguage>("th")
  const [maintenanceForm, setMaintenanceForm] = useState({ title: "", description: "", priority: "medium" });
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);

  // Load language preference from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedLang = localStorage.getItem('portal-language')
      if (savedLang && (savedLang === 'en' || savedLang === 'th')) {
        setDisplayLanguage(savedLang as PDFLanguage)
      }
    }
  }, [])

  // Listen for settings updates without reloading
  useEffect(() => {
    const handleSettingsUpdate = () => {
      // Force re-render to update language, welcome message, etc.
      setDisplayLanguage(prev => {
        const newLang = localStorage.getItem('portal-language') || 'th'
        return newLang as PDFLanguage
      })
    }

    window.addEventListener('settings-updated', handleSettingsUpdate)
    return () => window.removeEventListener('settings-updated', handleSettingsUpdate)
  }, [])

  // Monitor URL changes using useSearchParams
  useEffect(() => {
    const tabParam = searchParams.get('tab')
    console.log('[Dashboard] Tab param from searchParams:', tabParam)
    console.log('[Dashboard] Current activeTab:', activeTab)

    if (tabParam) {
      const tabMapping: Record<string, string> = {
        'bills': 'billing',
        'parcels': 'parcels',
        'announcements': 'announcements',
        'maintenance': 'maintenance'
      }
      if (tabMapping[tabParam]) {
        console.log('[Dashboard] Setting active tab to:', tabMapping[tabParam])
        setActiveTab(tabMapping[tabParam])
      }
    } else {
      console.log('[Dashboard] No tab param, keeping current tab or defaulting to outstanding')
      if (activeTab !== 'outstanding') {
        setActiveTab('outstanding')
      }
    }
  }, [searchParams])

  // Step 1: Get resident info from localStorage on initial mount
  useEffect(() => {
    const loadResidentInfo = async () => {
      const residentDataString = localStorage.getItem("residentData");
      if (!residentDataString) {
        router.push("/portal/login");
        return;
      }
      try {
        const info: ResidentInfo = JSON.parse(residentDataString);

        // If id is missing but we have unit_number, try to fetch it
        if (!info.id && info.unit_number) {
          console.log('[Portal Dashboard] Missing id, fetching from unit_number:', info.unit_number);
          try {
            const supabase = createClient();
            const { data: unit, error } = await supabase
              .from('units')
              .select('id')
              .eq('unit_number', info.unit_number)
              .single();

            if (error || !unit) {
              console.error('[Portal Dashboard] Could not fetch unit ID:', error);
              toast({
                title: "เกิดข้อผิดพลาด",
                description: "ไม่สามารถโหลดข้อมูลห้องชุดได้ กรุณาเข้าสู่ระบบอีกครั้ง",
                variant: "destructive",
              });
              localStorage.removeItem("residentData");
              router.push("/portal/login");
              return;
            }

            // Update info with the fetched id
            info.id = unit.id;
            // Update localStorage with complete data
            localStorage.setItem("residentData", JSON.stringify(info));
            console.log('[Portal Dashboard] Fetched and saved unit ID:', unit.id);
          } catch (fetchError) {
            console.error('[Portal Dashboard] Error fetching unit ID:', fetchError);
            toast({
              title: "เกิดข้อผิดพลาด",
              description: "ไม่สามารถโหลดข้อมูลได้ กรุณาเข้าสู่ระบบอีกครั้ง",
              variant: "destructive",
            });
            router.push("/portal/login");
            return;
          }
        }

        // Final validation
        if (!info.id) {
          console.error('[Portal Dashboard] Missing id after all attempts:', info);
          toast({
            title: "ข้อมูลไม่ครบถ้วน",
            description: "กรุณาเข้าสู่ระบบอีกครั้ง",
            variant: "destructive",
          });
          localStorage.removeItem("residentData");
          router.push("/portal/login");
          return;
        }

        console.log('[Portal Dashboard] Resident info loaded:', {
          id: info.id,
          unit_number: info.unit_number,
          owner_name: info.owner_name
        });

        setResidentInfo(info);
      } catch (error) {
        console.error("Failed to parse resident data:", error);
        localStorage.removeItem("residentData");
        router.push("/portal/login");
      }
    };

    loadResidentInfo();
  }, [router, toast]);

  // SWR Hooks for Granular Data Fetching
  const { data: outstandingBills, mutate: mutateBills, isLoading: isLoadingBills } = useSWR(
    residentInfo?.id ? ['outstanding-bills', residentInfo.id] : null,
    ([_, id]) => getOutstandingBills(id)
  )

  const { data: paymentHistory, mutate: mutateHistory, isLoading: isLoadingHistory } = useSWR(
    residentInfo?.id ? ['payment-history', residentInfo.id] : null,
    ([_, id]) => getPaymentHistory(id)
  )

  const { data: announcements, isLoading: isLoadingAnnouncements } = useSWR(
    residentInfo?.project_id ? ['announcements', residentInfo.project_id] : null,
    ([_, id]) => getPortalAnnouncements(id)
  )

  const { data: maintenanceRequests, mutate: mutateMaintenance, isLoading: isLoadingMaintenance } = useSWR(
    residentInfo?.id ? ['maintenance-requests', residentInfo.id] : null,
    ([_, id]) => getPortalMaintenanceRequests(id)
  )

  const { data: parcels, isLoading: isLoadingParcels } = useSWR(
    residentInfo?.unit_number ? ['parcels', residentInfo.unit_number] : null,
    ([_, unitNumber]) => getParcelsForUnit(unitNumber).then(res => res.success ? res.parcels : [])
  )

  const totalOutstanding = (outstandingBills || []).reduce((sum: number, bill: any) => sum + (bill.total || 0), 0)

  const isLoading = !residentInfo || (isLoadingBills && isLoadingHistory && isLoadingAnnouncements && isLoadingMaintenance && isLoadingParcels)

  const handleMaintenanceSubmit = async () => {
    const t = uiTranslations[displayLanguage];
    if (!residentInfo || !maintenanceForm.title) {
      toast({ title: "ข้อมูลไม่ครบถ้วน", description: "กรุณากรอกเรื่องที่ต้องการแจ้ง", variant: "destructive" });
      return;
    }
    // setIsLoading(true); // SWR handles loading state
    try {
      await createMaintenanceRequest({
        ...maintenanceForm,
        unit_id: residentInfo.id,
        reported_by: residentInfo.owner_name,
        project_id: residentInfo.project_id || null,
        image_urls: uploadedImages.length > 0 ? uploadedImages : undefined,
        detailed_status: 'new'
      });
      toast({ title: "สำเร็จ", description: "ส่งใบแจ้งซ่อมของคุณเรียบร้อยแล้ว" });
      setIsMaintenanceModalOpen(false);
      setMaintenanceForm({ title: "", description: "", priority: "medium" });
      setUploadedImages([]);
      mutateMaintenance(); // Refresh data
    } catch (error: any) {
      toast({ title: "เกิดข้อผิดพลาด", description: error.message, variant: "destructive" });
    } finally {
      // setIsLoading(false);
    }
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    Array.from(files).forEach(file => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader()
        reader.onload = (event) => {
          const result = event.target?.result as string
          setUploadedImages(prev => [...prev, result])
        }
        reader.readAsDataURL(file)
      }
    })
  }

  const removeImage = (index: number) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== index))
  }

  const handleLogout = () => {
    localStorage.removeItem("residentData")
    toast({ title: "ออกจากระบบสำเร็จ" })
    router.push("/portal/login")
  }

  const handlePrintInvoice = async (bill: Bill) => {
    if (residentInfo) {
      await generateBillPDFV4({ ...bill, unitNumber: residentInfo.unit_number }, { ownerName: residentInfo.owner_name }, settings, displayLanguage);
    }
  }

  const handlePrintReceipt = async (paymentId: string) => {
    try {
      const receiptData = await getReceiptData(paymentId);
      if (receiptData) {
        await generateReceiptPDFV4(receiptData.payment, receiptData.bill, receiptData.unit, settings, displayLanguage);
      }
    } catch (error: any) {
      toast({ title: "เกิดข้อผิดพลาด", description: error.message, variant: "destructive" });
    }
  }

  const openPaymentModal = (bill: Bill) => {
    setSelectedBillForPayment(bill);
    setIsPaymentMethodsDialogOpen(true);
  }

  const handlePaymentComplete = () => {
    // Reload financial data after payment
    if (residentInfo && residentInfo.id) {
      console.log('[Portal Dashboard] Reloading data after payment completion');
      mutateBills();
      mutateHistory();
    } else {
      console.warn('[Portal Dashboard] Cannot reload: residentInfo missing or no id');
    }
  }

  const handleOpenSlipUpload = (transactionId: string) => {
    setSelectedPaymentTransactionId(transactionId)
    setIsSlipUploadDialogOpen(true)
  }



  if (isLoading || !residentInfo) {
    return (
      <div className="space-y-4 p-4">
        {/* Skeleton Loading for Mobile */}
        <div className="md:hidden space-y-4">
          {/* Welcome Skeleton */}
          <div className="h-32 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse" />

          {/* Tabs Skeleton */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-10 w-20 bg-gray-200 dark:bg-gray-800 rounded animate-pulse flex-shrink-0" />
            ))}
          </div>

          {/* Content Skeleton */}
          <div className="space-y-3">
            <div className="h-20 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
            <div className="h-20 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
            <div className="h-20 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
          </div>
        </div>

        {/* Desktop Loading */}
        <div className="hidden md:flex items-center justify-center min-h-[70vh]">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
        </div>
      </div>
    )
  }
  const t = uiTranslations[displayLanguage];

  return (
    <>
      <div className="space-y-3 md:space-y-6">
        {/* Desktop Header */}
        <header className="hidden md:flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
          <div className="flex items-center gap-4 flex-1">
            <ProfileAvatar />
            <div>
              <h1 className="text-xl md:text-2xl font-bold">{themeSettings.welcomeMessage || t.welcome}, {residentInfo?.resident_name || residentInfo?.owner_name || `ผู้อาศัยห้อง ${residentInfo?.unit_number}`}</h1>
              <p className="text-sm md:text-base text-muted-foreground">{t.unit} {residentInfo?.unit_number}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ThemeSelector />
            <PortalSettings />
            <NotificationBell unitNumber={residentInfo?.unit_number || ""} />
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="mr-1 md:mr-2 h-4 w-4" />
              <span className="hidden md:inline">{t.logout}</span>
            </Button>
          </div>
        </header>

        <main>
          {/* Compact Welcome Header for Mobile */}
          <div className="md:hidden mb-4 flex items-center gap-3">
            <ProfileAvatar />
            <div>
              <h1 className="text-xl font-bold">{themeSettings.welcomeMessage || t.welcome}, {residentInfo?.resident_name || residentInfo?.owner_name || `ผู้อาศัยห้อง ${residentInfo?.unit_number}`}</h1>
              <p className="text-sm text-muted-foreground">{t.unit} {residentInfo?.unit_number}</p>
            </div>
          </div>

          <DashboardOverview
            bills={outstandingBills || []}
            announcements={announcements || []}
            parcels={parcels || []}
            maintenanceRequests={maintenanceRequests || []}
            isLoading={isLoading}
          />

          {/* Compact Outstanding Card for Mobile */}
          <Card className="mb-4 md:mb-6 bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800/50">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-red-800 dark:text-red-300 flex items-center gap-1">
                    <DollarSign className="h-4 w-4" />
                    <span className="md:hidden">{t.totalOutstanding}</span>
                    <span className="hidden md:inline">{t.totalOutstanding}</span>
                  </p>
                  <p className="text-2xl md:text-4xl font-bold text-red-600 dark:text-red-400 mt-1">
                    {formatCurrency(totalOutstanding)}
                  </p>
                </div>
                {/* Quick Actions for Mobile */}
                <div className="md:hidden flex gap-2">
                  {totalOutstanding > 0 && (() => {
                    const { primary, primaryHover } = getThemeClasses(theme)
                    return (
                      <Button size="sm" className={`${primary} ${primaryHover} text-white`}>
                        จ่ายเลย
                      </Button>
                    )
                  })()}
                </div>
              </div>
            </CardContent>
          </Card>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            {/* Hide Tabs on Mobile, Show on Desktop */}
            <TabsList className="hidden md:grid w-full grid-cols-5 h-auto">
              <TabsTrigger value="outstanding" className="text-xs md:text-sm py-2">
                <span className="hidden md:inline">{t.outstandingBills}</span>
                <span className="md:hidden">บิลค้าง</span>
                <span className="ml-1">({(outstandingBills || []).length})</span>
              </TabsTrigger>
              <TabsTrigger value="history" className="text-xs md:text-sm py-2">
                <span className="hidden md:inline">{t.paymentHistory}</span>
                <span className="md:hidden">ประวัติ</span>
              </TabsTrigger>
              <TabsTrigger value="announcements" className="text-xs md:text-sm py-2">
                <span className="hidden md:inline">{t.announcements}</span>
                <span className="md:hidden">ประกาศ</span>
              </TabsTrigger>
              <TabsTrigger value="parcels" className="text-xs md:text-sm py-2">
                <span className="hidden md:inline">{t.parcels}</span>
                <span className="md:hidden">พัสดุ</span>
              </TabsTrigger>
              <TabsTrigger value="maintenance" className="text-xs md:text-sm py-2">
                <span className="hidden md:inline">{t.maintenance}</span>
                <span className="md:hidden">ซ่อม</span>
                <span className="ml-1">({(maintenanceRequests || []).length})</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="outstanding">
              <OutstandingBills
                bills={outstandingBills || []}
                settings={settings}
                language={displayLanguage}
                onPay={openPaymentModal}
                onPrint={handlePrintInvoice}
              />
            </TabsContent>
            <TabsContent value="history">
              <PaymentHistory
                payments={paymentHistory || []}
                settings={settings}
                language={displayLanguage}
                onPrint={handlePrintReceipt}
              />
            </TabsContent>

            {/* Billing View for Mobile - Combines Outstanding and History */}
            <TabsContent value="billing">
              <Tabs defaultValue="outstanding-sub" className="w-full">
                <div className="flex justify-center mb-4">
                  <TabsList className="grid w-full max-w-md grid-cols-2">
                    <TabsTrigger value="outstanding-sub">{t.outstandingBills}</TabsTrigger>
                    <TabsTrigger value="history-sub">{t.paymentHistory}</TabsTrigger>
                  </TabsList>
                </div>

                <TabsContent value="outstanding-sub" className="mt-0">
                  <OutstandingBills
                    bills={outstandingBills || []}
                    settings={settings}
                    language={displayLanguage}
                    onPay={openPaymentModal}
                    onPrint={handlePrintInvoice}
                  />
                </TabsContent>

                <TabsContent value="history-sub" className="mt-0">
                  <PaymentHistory
                    payments={paymentHistory || []}
                    settings={settings}
                    language={displayLanguage}
                    onPrint={handlePrintReceipt}
                  />
                </TabsContent>
              </Tabs>
            </TabsContent>

            <TabsContent value="announcements">
              <Announcements
                announcements={announcements || []}
                settings={settings}
                language={displayLanguage}
              />
            </TabsContent>

            <TabsContent value="parcels">
              <ParcelView unitNumber={residentInfo?.unit_number || ""} />
            </TabsContent>

            <TabsContent value="maintenance">
              <MaintenanceList
                requests={maintenanceRequests || []}
                settings={settings}
                language={displayLanguage}
                onCreateNew={() => setIsMaintenanceModalOpen(true)}
                isLoading={isLoadingMaintenance}
              />
            </TabsContent>
          </Tabs>
        </main>
      </div>

      {/* Payment Methods Dialog */}
      {selectedBillForPayment && (
        <PaymentMethodsDialog
          open={isPaymentMethodsDialogOpen}
          onOpenChange={setIsPaymentMethodsDialogOpen}
          billId={selectedBillForPayment.id}
          amount={selectedBillForPayment.total || 0}
          onPaymentComplete={handlePaymentComplete}
          onTransactionCreated={(transactionId, methodType) => {
            if (methodType === 'bank_transfer') {
              setSelectedPaymentTransactionId(transactionId)
              setIsSlipUploadDialogOpen(true)
            }
          }}
        />
      )}

      {/* Slip Upload Dialog */}
      {selectedPaymentTransactionId && (
        <SlipUploadDialog
          open={isSlipUploadDialogOpen}
          onOpenChange={setIsSlipUploadDialogOpen}
          transactionId={selectedPaymentTransactionId}
          onSuccess={() => {
            handlePaymentComplete()
            setIsSlipUploadDialogOpen(false)
            setSelectedPaymentTransactionId(null)
          }}
        />
      )}

      <Dialog open={isMaintenanceModalOpen} onOpenChange={setIsMaintenanceModalOpen}>
        <DialogContent className="w-[95vw] max-w-md md:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-sm md:text-base">{t.createMaintenance}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="maint-title" className="text-xs md:text-sm">{t.subjectRequired}</Label>
              <Input
                id="maint-title"
                value={maintenanceForm.title}
                onChange={e => setMaintenanceForm({ ...maintenanceForm, title: e.target.value })}
                placeholder={t.subjectPlaceholder}
                className="text-sm"
              />
            </div>
            <div>
              <Label htmlFor="maint-desc" className="text-xs md:text-sm">{t.additionalDetails}</Label>
              <Textarea
                id="maint-desc"
                value={maintenanceForm.description}
                onChange={e => setMaintenanceForm({ ...maintenanceForm, description: e.target.value })}
                placeholder={t.detailsPlaceholder}
                className="text-sm min-h-[80px]"
              />
            </div>
            <div>
              <Label htmlFor="maint-priority" className="text-xs md:text-sm">{t.priority}</Label>
              <Select value={maintenanceForm.priority} onValueChange={(v) => setMaintenanceForm({ ...maintenanceForm, priority: v })}>
                <SelectTrigger className="text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">{t.low}</SelectItem>
                  <SelectItem value="medium">{t.medium}</SelectItem>
                  <SelectItem value="high">{t.high}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs md:text-sm">แนบรูปภาพ</Label>
              <div className="mt-2 space-y-2">
                {uploadedImages.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {uploadedImages.map((url, index) => (
                      <div key={index} className="relative w-20 h-20">
                        <img src={url} alt={`Preview ${index + 1}`} className="w-full h-full object-cover rounded" />
                        <button
                          onClick={() => removeImage(index)}
                          className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full text-xs"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <Input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  className="text-xs"
                />
              </div>
            </div>
          </div>
          <DialogFooter className="flex-col md:flex-row gap-2">
            <Button variant="outline" onClick={() => setIsMaintenanceModalOpen(false)} className="w-full md:w-auto">
              {t.cancel}
            </Button>
            <Button onClick={handleMaintenanceSubmit} disabled={isLoading} className="w-full md:w-auto">
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : t.submit}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

