"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Download, CheckCircle, Clock } from "lucide-react"
import { formatDate } from "@/lib/date-formatter"
import { useCurrency } from "@/lib/currency-formatter"
import { uiTranslations } from "@/lib/portal-translations"
import { PDFLanguage } from "@/lib/pdf-generator-v4"

interface Bill {
    id: string
    month: string
    total: number
    due_date: string
    status: string
    latest_transaction_status?: string
    common_fee?: number
    water_fee?: number
    electricity_fee?: number
    parking_fee?: number
    other_fee?: number
    unitNumber?: string
}

interface OutstandingBillsProps {
    bills: Bill[]
    settings: any
    language: PDFLanguage
    onPay: (bill: Bill) => void
    onPrint: (bill: Bill) => void
}

export function OutstandingBills({ bills, settings, language, onPay, onPrint }: OutstandingBillsProps) {
    const { formatCurrency } = useCurrency()
    const t = uiTranslations[language]
    const today = new Date().toISOString().split('T')[0]

    const getStatusBadge = (bill: Bill) => {
        const dueDate = bill.due_date || ''

        // Check if bill is paid
        if (bill.status === "paid") {
            return <Badge className="bg-green-100 text-green-700"><CheckCircle className="mr-1 h-3 w-3" />{t.paid}</Badge>
        }

        // Check transaction status if available
        const transactionStatus = bill.latest_transaction_status
        if (transactionStatus === 'processing') {
            return <Badge className="bg-blue-100 text-blue-700"><Clock className="mr-1 h-3 w-3" />{t.processing}</Badge>
        }
        if (transactionStatus === 'pending') {
            return <Badge className="bg-yellow-100 text-yellow-700"><Clock className="mr-1 h-3 w-3" />{t.pendingReview}</Badge>
        }

        // Check if overdue
        if (dueDate && dueDate < today) {
            return <Badge variant="destructive"><Clock className="mr-1 h-3 w-3" />{t.overdue}</Badge>
        }

        // Default: pending payment
        return <Badge variant="secondary"><Clock className="mr-1 h-3 w-3" />{t.pending}</Badge>
    }

    return (
        <Card className="border-none shadow-xl bg-white/80 dark:bg-gray-900/60 backdrop-blur-md animate-in fade-in slide-in-from-bottom-4 duration-700">
            <CardHeader className="border-b border-gray-100 dark:border-gray-800 pb-4">
                <CardTitle className="text-lg md:text-xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                    {t.outstandingBills}
                </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
                {/* Desktop Table */}
                <div className="hidden md:block overflow-hidden rounded-lg border border-gray-100 dark:border-gray-800">
                    <Table>
                        <TableHeader className="bg-gray-50/50 dark:bg-gray-900/50">
                            <TableRow>
                                <TableHead className="font-semibold">{t.month}</TableHead>
                                <TableHead className="font-semibold">{t.dueDate}</TableHead>
                                <TableHead className="text-right font-semibold">{t.amount}</TableHead>
                                <TableHead className="font-semibold">{t.status}</TableHead>
                                <TableHead className="text-right font-semibold">{t.actions}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {bills.length > 0 ? (
                                bills.map((bill, index) => (
                                    <TableRow
                                        key={bill.id}
                                        className="hover:bg-blue-50/50 dark:hover:bg-blue-900/20 transition-colors duration-200"
                                        style={{ animationDelay: `${index * 100}ms` }}
                                    >
                                        <TableCell className="font-medium">{formatDate(bill.month, settings.dateFormat, settings.yearType, { month: "long", year: "numeric" })}</TableCell>
                                        <TableCell>{formatDate(bill.due_date, settings.dateFormat, settings.yearType)}</TableCell>
                                        <TableCell className="text-right font-bold text-primary">{formatCurrency(bill.total)}</TableCell>
                                        <TableCell>{getStatusBadge(bill)}</TableCell>
                                        <TableCell className="text-right space-x-2">
                                            {bill.latest_transaction_status === 'pending' || bill.latest_transaction_status === 'processing' ? (
                                                <Button size="sm" variant="outline" disabled className="opacity-80">
                                                    {bill.latest_transaction_status === 'processing' ? t.processing : t.pendingReview}
                                                </Button>
                                            ) : (
                                                <Button size="sm" onClick={() => onPay(bill)} className="shadow-sm hover:shadow-md transition-all">{t.payNow}</Button>
                                            )}
                                            <Button variant="ghost" size="sm" onClick={() => onPrint(bill)} className="hover:bg-gray-100 dark:hover:bg-gray-800"><Download className="mr-1 h-4 w-4" />{t.invoice}</Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-12">{t.noOutstanding}</TableCell></TableRow>}
                        </TableBody>
                    </Table>
                </div>

                {/* Mobile Cards */}
                <div className="md:hidden space-y-4">
                    {bills.length > 0 ? (
                        bills.map((bill, index) => (
                            <Card
                                key={bill.id}
                                className="p-4 border-l-4 border-l-primary shadow-sm hover:shadow-md transition-all duration-300 animate-in fade-in slide-in-from-bottom-2 fill-mode-backwards"
                                style={{ animationDelay: `${index * 100}ms` }}
                            >
                                <div className="space-y-3">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="font-bold text-base text-gray-900 dark:text-gray-100">{formatDate(bill.month, settings.dateFormat, settings.yearType, { month: "long", year: "numeric" })}</p>
                                            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                                                <Clock className="h-3 w-3" />
                                                {t.dueDate}: {formatDate(bill.due_date, settings.dateFormat, settings.yearType)}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-xl text-primary">{formatCurrency(bill.total)}</p>
                                            <div className="mt-1">{getStatusBadge(bill)}</div>
                                        </div>
                                    </div>
                                    <div className="pt-2 flex gap-3">
                                        {bill.latest_transaction_status === 'pending' || bill.latest_transaction_status === 'processing' ? (
                                            <Button size="sm" className="flex-1 bg-gray-100 text-gray-500 dark:bg-gray-800" variant="outline" disabled>
                                                {bill.latest_transaction_status === 'processing' ? t.processing : t.pendingReview}
                                            </Button>
                                        ) : (
                                            <Button size="sm" className="flex-1 shadow-md active:scale-95 transition-transform" onClick={() => onPay(bill)}>
                                                {t.payNow}
                                            </Button>
                                        )}
                                        <Button variant="outline" size="sm" onClick={() => onPrint(bill)} className="px-3">
                                            <Download className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </Card>
                        ))
                    ) : (
                        <div className="text-center text-muted-foreground py-12 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-dashed border-gray-200 dark:border-gray-800">
                            <CheckCircle className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                            <p>{t.noOutstanding}</p>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
