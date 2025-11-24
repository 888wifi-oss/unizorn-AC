"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@/lib/supabase/client"
import { generatePromptPayQRCodeImage, generatePromptPayURL } from "@/lib/utils/promptpay-qr"
import { QrCode, Building2, CreditCard, Copy, CheckCircle2 } from "lucide-react"
import { useCurrency } from "@/lib/currency-formatter"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface PaymentMethod {
  id: string
  method_type: string
  method_name: string
  account_number?: string
  account_name?: string
  bank_name?: string
  bank_branch?: string
  qr_code_config?: any
}

interface PaymentMethodsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  billId: string
  amount: number
  onPaymentComplete?: () => void
  onTransactionCreated?: (transactionId: string, methodType: string) => void
}

export function PaymentMethodsDialog({
  open,
  onOpenChange,
  billId,
  amount,
  onPaymentComplete,
  onTransactionCreated,
}: PaymentMethodsDialogProps) {
  const { toast } = useToast()
  const { formatCurrency } = useCurrency()
  const supabase = createClient()

  const [loading, setLoading] = useState(false)
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null)
  const [qrCodeImage, setQrCodeImage] = useState<string>("")
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (open) {
      loadPaymentMethods()
    }
  }, [open])

  useEffect(() => {
    if (selectedMethod && selectedMethod.method_type === 'promptpay') {
      generateQRCode()
    }
  }, [selectedMethod, amount])

  const loadPaymentMethods = async () => {
    try {
      const { data, error } = await supabase
        .from('payment_methods')
        .select('*')
        .eq('is_active', true)
        .order('is_default', { ascending: false })
        .order('display_order', { ascending: true })

      if (error) throw error

      setPaymentMethods(data || [])
      if (data && data.length > 0) {
        // Set default method
        const defaultMethod = data.find(m => m.is_default) || data[0]
        setSelectedMethod(defaultMethod)
      }
    } catch (error: any) {
      console.error('[Payment Methods] Error loading:', error)
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถโหลดวิธีการชำระเงินได้",
        variant: "destructive",
      })
    }
  }

  const generateQRCode = async () => {
    if (!selectedMethod || selectedMethod.method_type !== 'promptpay') return

    try {
      const config: any = {}
      if (selectedMethod.qr_code_config?.phone) {
        config.phoneNumber = selectedMethod.qr_code_config.phone
      }
      if (selectedMethod.qr_code_config?.tax_id) {
        config.taxId = selectedMethod.qr_code_config.tax_id
      }
      if (selectedMethod.qr_code_config?.ewallet_id) {
        config.ewalletId = selectedMethod.qr_code_config.ewallet_id
      }
      config.amount = amount

      const qrImage = await generatePromptPayQRCodeImage(config)
      setQrCodeImage(qrImage)
    } catch (error: any) {
      console.error('[Payment Methods] Error generating QR:', error)
      // Fallback to URL
      if (selectedMethod.qr_code_config?.phone) {
        const url = generatePromptPayURL(selectedMethod.qr_code_config.phone, amount)
        setQrCodeImage(`https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(url)}`)
      }
    }
  }

  const handleCopyAccountNumber = () => {
    if (selectedMethod?.account_number) {
      navigator.clipboard.writeText(selectedMethod.account_number)
      setCopied(true)
      toast({
        title: "คัดลอกแล้ว",
        description: "คัดลอกเลขบัญชีเรียบร้อยแล้ว",
      })
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleConfirmPayment = async () => {
    if (!selectedMethod) return

    // If payment gateway, redirect to gateway
    if (selectedMethod.method_type === 'payment_gateway') {
      setLoading(true)
      try {
        // Check for existing pending/processing transactions for this bill
        const { data: existingTransactions, error: checkError } = await supabase
          .from('payment_transactions')
          .select('id, status, reference_number')
          .eq('bill_id', billId)
          .in('status', ['pending', 'processing'])

        if (checkError) {
          console.warn('[Payment Gateway] Error checking existing transactions:', checkError)
        }

        if (existingTransactions && existingTransactions.length > 0) {
          const existingRef = existingTransactions[0].reference_number
          const existingStatus = existingTransactions[0].status === 'processing' ? 'กำลังตรวจสอบ' : 'รอดำเนินการ'
          toast({
            title: "มีรายการชำระเงินอยู่แล้ว",
            description: `บิลนี้มีรายการชำระเงินอยู่แล้ว (${existingRef}) สถานะ: ${existingStatus} กรุณารอการตรวจสอบ`,
            variant: "destructive",
          })
          setLoading(false)
          return
        }

        // Create payment transaction first
        const { data: transaction, error: transactionError } = await supabase
          .from('payment_transactions')
          .insert({
            bill_id: billId,
            payment_method_id: selectedMethod.id,
            amount: amount,
            currency: 'THB',
            status: 'pending',
            transaction_type: 'payment',
          })
          .select()
          .single()

        if (transactionError) throw transactionError

        // Get gateway config and redirect
        const gatewayConfig = selectedMethod.gateway_config || {}
        const gatewayType = gatewayConfig.type || 'omise' // default to omise

        // Create charge via API
        const response = await fetch('/api/v1/payment-gateway/create-charge', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            transactionId: transaction.id,
            amount: amount * 100, // Convert to satang/cents
            currency: 'THB',
            gateway: gatewayType,
            returnUrl: `${window.location.origin}/payments/transactions?transaction=${transaction.id}`,
          }),
        })

        const chargeData = await response.json()

        if (!response.ok) {
          throw new Error(chargeData.error || 'Failed to create charge')
        }

        // Redirect to payment gateway
        if (chargeData.redirectUrl) {
          window.location.href = chargeData.redirectUrl
        } else {
          throw new Error('No redirect URL received')
        }

        onPaymentComplete?.()
      } catch (error: any) {
        console.error('[Payment Gateway] Error:', error)
        toast({
          title: "เกิดข้อผิดพลาด",
          description: error.message || "ไม่สามารถเชื่อมต่อกับ Payment Gateway ได้",
          variant: "destructive",
        })
        setLoading(false)
      }
      return
    }

    // For other payment methods (PromptPay, Bank Transfer)
    setLoading(true)
    try {
      // Get bill to get project_id
      const { data: bill, error: billError } = await supabase
        .from('bills')
        .select('project_id')
        .eq('id', billId)
        .single()

      if (billError) {
        console.error('[Payment] Error fetching bill:', billError)
      }

      // Check for existing pending/processing transactions for this bill
      const { data: existingTransactions, error: checkError } = await supabase
        .from('payment_transactions')
        .select('id, status, reference_number')
        .eq('bill_id', billId)
        .in('status', ['pending', 'processing'])

      if (checkError) {
        console.warn('[Payment] Error checking existing transactions:', checkError)
      }

      if (existingTransactions && existingTransactions.length > 0) {
        const existingRef = existingTransactions[0].reference_number
        const existingStatus = existingTransactions[0].status === 'processing' ? 'กำลังตรวจสอบ' : 'รอดำเนินการ'
        toast({
          title: "มีรายการชำระเงินอยู่แล้ว",
          description: `บิลนี้มีรายการชำระเงินอยู่แล้ว (${existingRef}) สถานะ: ${existingStatus} กรุณารอการตรวจสอบ`,
          variant: "destructive",
        })
        setLoading(false)
        return
      }

      // Create payment transaction
      const { data: transaction, error: transactionError } = await supabase
        .from('payment_transactions')
        .insert({
          bill_id: billId,
          payment_method_id: selectedMethod.id,
          amount: amount,
          currency: 'THB',
          status: 'pending',
          transaction_type: 'payment',
          reference_number: `PAY-${Date.now()}`,
          project_id: bill?.project_id || null,
        })
        .select()
        .single()

      if (transactionError) throw transactionError

      // If bank transfer, trigger slip upload dialog
      if (selectedMethod.method_type === 'bank_transfer' && transaction.id) {
        onTransactionCreated?.(transaction.id, selectedMethod.method_type)
        toast({
          title: "สร้างรายการชำระเงินแล้ว",
          description: "กรุณาอัพโหลดสลิปการชำระเงิน",
        })
        onOpenChange(false)
        return
      }

      // For PromptPay, just close and show message
      toast({
        title: "สร้างรายการชำระเงินแล้ว",
        description: selectedMethod.method_type === 'promptpay' 
          ? "กรุณาสแกน QR Code เพื่อชำระเงิน" 
          : "กรุณาชำระเงินและอัพโหลดสลิปเพื่อยืนยัน",
      })

      onPaymentComplete?.()
      onOpenChange(false)
    } catch (error: any) {
      console.error('[Payment] Error creating transaction:', error)
      toast({
        title: "เกิดข้อผิดพลาด",
        description: error.message || "ไม่สามารถสร้างรายการชำระเงินได้",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const promptPayMethod = paymentMethods.find(m => m.method_type === 'promptpay')
  const bankTransferMethods = paymentMethods.filter(m => m.method_type === 'bank_transfer')
  const gatewayMethods = paymentMethods.filter(m => m.method_type === 'payment_gateway')

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>เลือกวิธีการชำระเงิน</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">ยอดที่ต้องชำระ</span>
              <span className="text-2xl font-bold text-blue-600">{formatCurrency(amount)}</span>
            </div>
          </div>

          <Tabs defaultValue={promptPayMethod ? "promptpay" : "bank"} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              {promptPayMethod && <TabsTrigger value="promptpay">PromptPay</TabsTrigger>}
              {bankTransferMethods.length > 0 && <TabsTrigger value="bank">โอนผ่านธนาคาร</TabsTrigger>}
              {gatewayMethods.length > 0 && <TabsTrigger value="gateway">ชำระออนไลน์</TabsTrigger>}
            </TabsList>

            {promptPayMethod && (
              <TabsContent value="promptpay" className="space-y-4">
                <div className="text-center">
                  <div className="flex justify-center p-4 bg-white rounded-lg border">
                    {qrCodeImage ? (
                      <img src={qrCodeImage} alt="PromptPay QR Code" className="w-64 h-64" />
                    ) : (
                      <div className="w-64 h-64 flex items-center justify-center">
                        <QrCode className="w-32 h-32 text-gray-300" />
                      </div>
                    )}
                  </div>
                  <p className="mt-4 text-sm text-gray-600">
                    สแกน QR Code เพื่อชำระเงินผ่านแอปธนาคาร
                  </p>
                  <p className="mt-2 text-lg font-semibold">
                    {formatCurrency(amount)}
                  </p>
                </div>
              </TabsContent>
            )}

            {bankTransferMethods.length > 0 && (
              <TabsContent value="bank" className="space-y-4">
                <Select
                  value={selectedMethod?.id || ""}
                  onValueChange={(value) => {
                    const method = bankTransferMethods.find(m => m.id === value)
                    setSelectedMethod(method || null)
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="เลือกธนาคาร" />
                  </SelectTrigger>
                  <SelectContent>
                    {bankTransferMethods.map((method) => (
                      <SelectItem key={method.id} value={method.id}>
                        {method.bank_name} - {method.method_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {selectedMethod && selectedMethod.method_type === 'bank_transfer' && (
                  <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                    <div>
                      <Label className="text-sm text-gray-600">ชื่อธนาคาร</Label>
                      <p className="font-semibold">{selectedMethod.bank_name}</p>
                    </div>
                    <div>
                      <Label className="text-sm text-gray-600">เลขบัญชี</Label>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold font-mono">{selectedMethod.account_number}</p>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={handleCopyAccountNumber}
                          className="h-8 w-8"
                        >
                          {copied ? (
                            <CheckCircle2 className="w-4 h-4 text-green-600" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm text-gray-600">ชื่อบัญชี</Label>
                      <p className="font-semibold">{selectedMethod.account_name}</p>
                    </div>
                    {selectedMethod.bank_branch && (
                      <div>
                        <Label className="text-sm text-gray-600">สาขา</Label>
                        <p className="font-semibold">{selectedMethod.bank_branch}</p>
                      </div>
                    )}
                    <div className="mt-4 p-3 bg-blue-50 rounded border border-blue-200">
                      <p className="text-sm text-blue-800 mb-2">
                        💡 หลังจากโอนเงินแล้ว กรุณากดปุ่ม "ยืนยันการชำระเงิน" เพื่ออัพโหลดสลิป
                      </p>
                      <p className="text-xs text-blue-600">
                        โอนเงินตามจำนวน <span className="font-bold">{formatCurrency(amount)}</span>
                      </p>
                    </div>
                  </div>
                )}
              </TabsContent>
            )}

            {gatewayMethods.length > 0 && (
              <TabsContent value="gateway" className="space-y-4">
                <Select
                  value={selectedMethod?.id || ""}
                  onValueChange={(value) => {
                    const method = gatewayMethods.find(m => m.id === value)
                    setSelectedMethod(method || null)
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="เลือก Payment Gateway" />
                  </SelectTrigger>
                  <SelectContent>
                    {gatewayMethods.map((method) => (
                      <SelectItem key={method.id} value={method.id}>
                        {method.method_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {selectedMethod && selectedMethod.method_type === 'payment_gateway' && (
                  <div className="bg-blue-50 rounded-lg p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-5 h-5 text-blue-600" />
                      <p className="font-semibold text-blue-900">{selectedMethod.method_name}</p>
                    </div>
                    <p className="text-sm text-blue-700">
                      กดยืนยันการชำระเงินเพื่อไปยังหน้าชำระเงินของ {selectedMethod.method_name}
                    </p>
                    <div className="mt-4 p-3 bg-yellow-50 rounded border border-yellow-200">
                      <p className="text-sm text-yellow-800">
                        ⚠️ หลังจากชำระเงินเสร็จแล้ว กรุณาอัพโหลดสลิปเพื่อยืนยันการชำระเงิน
                      </p>
                    </div>
                  </div>
                )}
              </TabsContent>
            )}
          </Tabs>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            ยกเลิก
          </Button>
          <Button
            onClick={handleConfirmPayment}
            className="bg-green-600 hover:bg-green-700"
            disabled={loading || !selectedMethod}
          >
            {loading ? "กำลังสร้างรายการ..." : "ยืนยันการชำระเงิน"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

