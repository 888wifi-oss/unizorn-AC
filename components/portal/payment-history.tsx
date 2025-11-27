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
        <Card className="border-none shadow-xl bg-white/80 dark:bg-gray-900/60 backdrop-blur-md animate-in fade-in slide-in-from-bottom-4 duration-700">
            <CardHeader className="border-b border-gray-100 dark:border-gray-800 pb-4">
                <CardTitle className="text-lg md:text-xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                    {t.paymentHistory}
                </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
                {/* Desktop Table */}
                <div className="hidden md:block overflow-hidden rounded-lg border border-gray-100 dark:border-gray-800">
                    <Table>
                        <TableHeader className="bg-gray-50/50 dark:bg-gray-900/50">
                            <TableRow>
                                <TableHead className="font-semibold">{t.paymentDate}</TableHead>
                                <TableHead className="font-semibold">{t.receiptNumber}</TableHead>
                                <TableHead className="font-semibold">{t.forBill}</TableHead>
                                <TableHead className="text-right font-semibold">{t.paidAmount}</TableHead>
                                <TableHead className="text-right font-semibold">{t.actions}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {payments.length > 0 ? (
                                payments.map((payment, index) => (
                                    <TableRow
                                        key={payment.id}
                                        className="hover:bg-green-50/50 dark:hover:bg-green-900/20 transition-colors duration-200"
                                        style={{ animationDelay: `${index * 50}ms` }}
                                    >
                                        <TableCell className="font-medium">{formatDate(payment.payment_date, settings.dateFormat, settings.yearType)}</TableCell>
                                        <TableCell className="font-mono text-xs text-muted-foreground">{payment.reference_number}</TableCell>
                                        <TableCell className="text-muted-foreground">{payment.bills?.bill_number || "-"}</TableCell>
                                        <TableCell className="text-right font-bold text-green-600 dark:text-green-400">{formatCurrency(payment.amount)}</TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="sm" onClick={() => onPrint(payment.id)} className="hover:bg-gray-100 dark:hover:bg-gray-800">
                                                <Download className="mr-1 h-4 w-4" />{t.receipt}
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-12">{t.noPaymentHistory}</TableCell></TableRow>}
                        </TableBody>
                    </Table>
                </div>

                {/* Mobile Cards */}
                <div className="md:hidden space-y-4">
                    {payments.length > 0 ? (
                        payments.map((payment, index) => (
                            <Card
                                key={payment.id}
                                className="p-4 border-l-4 border-l-green-500 shadow-sm hover:shadow-md transition-all duration-300 animate-in fade-in slide-in-from-bottom-2 fill-mode-backwards"
                                style={{ animationDelay: `${index * 100}ms` }}
                            >
                                <div className="space-y-3">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="font-bold text-base text-gray-900 dark:text-gray-100">{formatDate(payment.payment_date, settings.dateFormat, settings.yearType)}</p>
                                            <p className="text-xs text-muted-foreground font-mono mt-1">{payment.reference_number}</p>
                                            <p className="text-xs text-muted-foreground mt-1">{t.forBill}: {payment.bills?.bill_number || "-"}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-xl text-green-600 dark:text-green-400">{formatCurrency(payment.amount)}</p>
                                        </div>
                                    </div>
                                    <Button variant="outline" size="sm" className="w-full mt-2" onClick={() => onPrint(payment.id)}>
                                        <Download className="mr-2 h-4 w-4" />
                                        {t.receipt}
                                    </Button>
                                </div>
                            </Card>
                        ))
                    ) : (
                        <div className="text-center text-muted-foreground py-12 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-dashed border-gray-200 dark:border-gray-800">
                            <p>{t.noPaymentHistory}</p>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
