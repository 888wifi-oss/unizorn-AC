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
        <Card>
            <CardHeader>
                <CardTitle className="text-sm md:text-base">{t.outstandingBills}</CardTitle>
            </CardHeader>
            <CardContent>
                {/* Desktop Table */}
                <div className="hidden md:block">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>{t.month}</TableHead>
                                <TableHead>{t.dueDate}</TableHead>
                                <TableHead className="text-right">{t.amount}</TableHead>
                                <TableHead>{t.status}</TableHead>
                                <TableHead className="text-right">{t.actions}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {bills.length > 0 ? (
                                bills.map((bill) => (
                                    <TableRow key={bill.id}>
                                        <TableCell>{formatDate(bill.month, settings.dateFormat, settings.yearType, { month: "long", year: "numeric" })}</TableCell>
                                        <TableCell>{formatDate(bill.due_date, settings.dateFormat, settings.yearType)}</TableCell>
                                        <TableCell className="text-right font-semibold">{formatCurrency(bill.total)}</TableCell>
                                        <TableCell>{getStatusBadge(bill)}</TableCell>
                                        <TableCell className="text-right space-x-2">
                                            {bill.latest_transaction_status === 'pending' || bill.latest_transaction_status === 'processing' ? (
                                                <Button size="sm" variant="outline" disabled>
                                                    {bill.latest_transaction_status === 'processing' ? t.processing : t.pendingReview}
                                                </Button>
                                            ) : (
                                                <Button size="sm" onClick={() => onPay(bill)}>{t.payNow}</Button>
                                            )}
                                            <Button variant="ghost" size="sm" onClick={() => onPrint(bill)}><Download className="mr-1 h-4 w-4" />{t.invoice}</Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">{t.noOutstanding}</TableCell></TableRow>}
                        </TableBody>
                    </Table>
                </div>

                {/* Mobile Cards */}
                <div className="md:hidden space-y-3">
                    {bills.length > 0 ? (
                        bills.map((bill) => (
                            <Card key={bill.id} className="p-4">
                                <div className="space-y-3">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="font-semibold text-sm">{formatDate(bill.month, settings.dateFormat, settings.yearType, { month: "long", year: "numeric" })}</p>
                                            <p className="text-xs text-muted-foreground">{t.dueDate}: {formatDate(bill.due_date, settings.dateFormat, settings.yearType)}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-lg">{formatCurrency(bill.total)}</p>
                                            {getStatusBadge(bill)}
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        {bill.latest_transaction_status === 'pending' || bill.latest_transaction_status === 'processing' ? (
                                            <Button size="sm" className="flex-1" variant="outline" disabled>
                                                {bill.latest_transaction_status === 'processing' ? t.processing : t.pendingReview}
                                            </Button>
                                        ) : (
                                            <Button size="sm" className="flex-1" onClick={() => onPay(bill)}>
                                                {t.payNow}
                                            </Button>
                                        )}
                                        <Button variant="outline" size="sm" onClick={() => onPrint(bill)}>
                                            <Download className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </Card>
                        ))
                    ) : (
                        <div className="text-center text-muted-foreground py-8">{t.noOutstanding}</div>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
