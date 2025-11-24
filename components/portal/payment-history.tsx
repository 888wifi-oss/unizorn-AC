"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"
import { formatDate } from "@/lib/date-formatter"
import { useCurrency } from "@/lib/currency-formatter"
import { uiTranslations } from "@/lib/portal-translations"
import { PDFLanguage } from "@/lib/pdf-generator-v4"

interface Payment {
    id: string
    bill_id: string
    amount: number
    payment_date: string
    reference_number: string
    bills: { bill_number: string }
}

interface PaymentHistoryProps {
    payments: Payment[]
    settings: any
    language: PDFLanguage
    onPrint: (paymentId: string) => void
}

export function PaymentHistory({ payments, settings, language, onPrint }: PaymentHistoryProps) {
    const { formatCurrency } = useCurrency()
    const t = uiTranslations[language]

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-sm md:text-base">{t.paymentHistory}</CardTitle>
            </CardHeader>
            <CardContent>
                {/* Desktop Table */}
                <div className="hidden md:block">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>{t.paymentDate}</TableHead>
                                <TableHead>{t.receiptNumber}</TableHead>
                                <TableHead>{t.forBill}</TableHead>
                                <TableHead className="text-right">{t.paidAmount}</TableHead>
                                <TableHead className="text-right">{t.actions}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {payments.length > 0 ? (
                                payments.map((payment) => (
                                    <TableRow key={payment.id}>
                                        <TableCell>{formatDate(payment.payment_date, settings.dateFormat, settings.yearType)}</TableCell>
                                        <TableCell className="font-mono">{payment.reference_number}</TableCell>
                                        <TableCell className="text-muted-foreground">{payment.bills?.bill_number || "-"}</TableCell>
                                        <TableCell className="text-right font-semibold text-green-600">{formatCurrency(payment.amount)}</TableCell>
                                        <TableCell className="text-right"><Button variant="ghost" size="sm" onClick={() => onPrint(payment.id)}><Download className="mr-1 h-4 w-4" />{t.receipt}</Button></TableCell>
                                    </TableRow>
                                ))
                            ) : <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">{t.noPaymentHistory}</TableCell></TableRow>}
                        </TableBody>
                    </Table>
                </div>

                {/* Mobile Cards */}
                <div className="md:hidden space-y-3">
                    {payments.length > 0 ? (
                        payments.map((payment) => (
                            <Card key={payment.id} className="p-4">
                                <div className="space-y-3">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="font-semibold text-sm">{formatDate(payment.payment_date, settings.dateFormat, settings.yearType)}</p>
                                            <p className="text-xs text-muted-foreground font-mono">{payment.reference_number}</p>
                                            <p className="text-xs text-muted-foreground">{t.forBill}: {payment.bills?.bill_number || "-"}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-lg text-green-600">{formatCurrency(payment.amount)}</p>
                                        </div>
                                    </div>
                                    <Button variant="outline" size="sm" className="w-full" onClick={() => onPrint(payment.id)}>
                                        <Download className="mr-2 h-4 w-4" />
                                        {t.receipt}
                                    </Button>
                                </div>
                            </Card>
                        ))
                    ) : (
                        <div className="text-center text-muted-foreground py-8">{t.noPaymentHistory}</div>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
