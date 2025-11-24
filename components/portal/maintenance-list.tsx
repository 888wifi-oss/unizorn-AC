"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { formatDate } from "@/lib/date-formatter"
import { uiTranslations } from "@/lib/portal-translations"
import { PDFLanguage } from "@/lib/pdf-generator-v4"
import { useRouter } from "next/navigation"

interface MaintenanceRequest {
    id: string
    title: string
    status: string
    created_at: string
    scheduled_at?: string | null
}

interface MaintenanceListProps {
    requests: MaintenanceRequest[]
    settings: any
    language: PDFLanguage
    onCreateNew: () => void
    isLoading: boolean
}

export function MaintenanceList({ requests, settings, language, onCreateNew, isLoading }: MaintenanceListProps) {
    const t = uiTranslations[language]
    const router = useRouter()

    const getMaintStatusBadge = (status: string) => {
        switch (status) {
            case 'new': return <Badge>{t.new}</Badge>;
            case 'in_progress': return <Badge variant="secondary">{t.inProgress}</Badge>;
            case 'completed': return <Badge className="bg-green-100 text-green-700">{t.completed}</Badge>;
            case 'cancelled': return <Badge variant="destructive">{t.cancelled}</Badge>;
            default: return <Badge variant="outline">{status}</Badge>;
        }
    }

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>{t.maintenanceRequests}</CardTitle>
                    <CardDescription>{t.trackStatus}</CardDescription>
                </div>
                <Button onClick={onCreateNew}><Plus className="mr-2 h-4 w-4" />{t.newRequest}</Button>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader><TableRow><TableHead>{t.requestDate}</TableHead><TableHead>{t.subject}</TableHead><TableHead>{t.status}</TableHead></TableRow></TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow><TableCell colSpan={3} className="text-center py-8">{t.loading}</TableCell></TableRow>
                        ) : requests.length > 0 ? (
                            requests.map(req => (
                                <TableRow key={req.id}>
                                    <TableCell>{formatDate(req.created_at, 'medium', settings.yearType)}</TableCell>
                                    <TableCell className="font-medium">
                                        <div className="space-y-1">
                                            <button
                                                onClick={() => router.push(`/portal/maintenance/${req.id}`)}
                                                className="text-blue-600 hover:underline flex items-center gap-2"
                                            >
                                                {req.title}
                                                {req.scheduled_at && (
                                                    <Badge className="bg-blue-100 text-blue-700 text-xs">
                                                        📅 นัดหมายแล้ว
                                                    </Badge>
                                                )}
                                            </button>
                                            {req.scheduled_at && (
                                                <p className="text-xs text-muted-foreground" suppressHydrationWarning>
                                                    วันที่: {formatDate(req.scheduled_at, settings.dateFormat, settings.yearType)} เวลา: {new Date(req.scheduled_at).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
                                                </p>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>{getMaintStatusBadge(req.status)}</TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground py-8">{t.noMaintenanceRequests}</TableCell></TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    )
}
