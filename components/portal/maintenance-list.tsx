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
        <Card className="border-none shadow-xl bg-white/80 dark:bg-gray-900/60 backdrop-blur-md animate-in fade-in slide-in-from-bottom-4 duration-1000">
            <CardHeader className="flex flex-row items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-4">
                <div>
                    <CardTitle className="text-lg md:text-xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                        {t.maintenanceRequests}
                    </CardTitle>
                    <CardDescription className="text-xs md:text-sm mt-1">{t.trackStatus}</CardDescription>
                </div>
                <Button onClick={onCreateNew} className="shadow-md hover:shadow-lg transition-all active:scale-95 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 border-none">
                    <Plus className="mr-2 h-4 w-4" />{t.newRequest}
                </Button>
            </CardHeader>
            <CardContent className="pt-6">
                {/* Desktop Table */}
                <div className="hidden md:block overflow-hidden rounded-lg border border-gray-100 dark:border-gray-800">
                    <Table>
                        <TableHeader className="bg-gray-50/50 dark:bg-gray-900/50">
                            <TableRow>
                                <TableHead className="font-semibold">{t.requestDate}</TableHead>
                                <TableHead className="font-semibold">{t.subject}</TableHead>
                                <TableHead className="font-semibold">{t.status}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow><TableCell colSpan={3} className="text-center py-12"><div className="animate-pulse">{t.loading}</div></TableCell></TableRow>
                            ) : requests.length > 0 ? (
                                requests.map((req, index) => (
                                    <TableRow
                                        key={req.id}
                                        className="hover:bg-orange-50/50 dark:hover:bg-orange-900/20 transition-colors duration-200 cursor-pointer"
                                        onClick={() => router.push(`/portal/maintenance/${req.id}`)}
                                        style={{ animationDelay: `${index * 50}ms` }}
                                    >
                                        <TableCell className="font-medium">{formatDate(req.created_at, 'medium', settings.yearType)}</TableCell>
                                        <TableCell>
                                            <div className="space-y-1">
                                                <div className="font-medium text-blue-600 dark:text-blue-400 flex items-center gap-2">
                                                    {req.title}
                                                    {req.scheduled_at && (
                                                        <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 text-[10px] border-none">
                                                            📅 นัดหมายแล้ว
                                                        </Badge>
                                                    )}
                                                </div>
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
                                <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground py-12">{t.noMaintenanceRequests}</TableCell></TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>

                {/* Mobile List View */}
                <div className="md:hidden space-y-3">
                    {isLoading ? (
                        <div className="text-center py-8 animate-pulse text-muted-foreground">{t.loading}</div>
                    ) : requests.length > 0 ? (
                        requests.map((req, index) => (
                            <div
                                key={req.id}
                                onClick={() => router.push(`/portal/maintenance/${req.id}`)}
                                className="p-4 rounded-lg border border-gray-100 dark:border-gray-800 bg-white/50 dark:bg-gray-800/50 shadow-sm active:scale-[0.98] transition-all duration-200 animate-in fade-in slide-in-from-bottom-2 fill-mode-backwards"
                                style={{ animationDelay: `${index * 100}ms` }}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <span className="text-xs text-muted-foreground">{formatDate(req.created_at, 'medium', settings.yearType)}</span>
                                    {getMaintStatusBadge(req.status)}
                                </div>
                                <h3 className="font-semibold text-base mb-1 text-blue-600 dark:text-blue-400">{req.title}</h3>
                                {req.scheduled_at && (
                                    <div className="mt-2 text-xs bg-blue-50 dark:bg-blue-900/20 p-2 rounded text-blue-700 dark:text-blue-300 flex items-center gap-2">
                                        <span>📅</span>
                                        <span>
                                            นัดหมาย: {formatDate(req.scheduled_at, settings.dateFormat, settings.yearType)} {new Date(req.scheduled_at).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                )}
                            </div>
                        ))
                    ) : (
                        <div className="text-center text-muted-foreground py-12 bg-gray-50/50 dark:bg-gray-900/50 rounded-lg border border-dashed border-gray-200 dark:border-gray-800">
                            <p>{t.noMaintenanceRequests}</p>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
