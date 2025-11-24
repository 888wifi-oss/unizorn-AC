"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Pin, MessageSquare, FileText, Download } from "lucide-react"
import { formatDate } from "@/lib/date-formatter"
import { uiTranslations } from "@/lib/portal-translations"
import { PDFLanguage } from "@/lib/pdf-generator-v4"

interface Announcement {
    id: string
    title: string
    content: string
    publish_date: string
    is_pinned: boolean
    category?: string
    image_urls?: string[]
    attachments?: string[]
}

interface AnnouncementsProps {
    announcements: Announcement[]
    settings: any
    language: PDFLanguage
}

export function Announcements({ announcements, settings, language }: AnnouncementsProps) {
    const t = uiTranslations[language]

    return (
        <Card>
            <CardHeader><CardTitle>{t.fromManagement}</CardTitle></CardHeader>
            <CardContent>
                {announcements.length > 0 ? (
                    <Accordion type="single" collapsible className="w-full">
                        {announcements.map(item => (
                            <AccordionItem key={item.id} value={item.id}>
                                <AccordionTrigger className="text-left">
                                    <div className="flex items-center gap-4">
                                        {item.is_pinned && <Pin className="w-4 h-4 text-yellow-500 flex-shrink-0" />}
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <p className="font-semibold">{item.title}</p>
                                                {item.category && (
                                                    <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded">
                                                        {item.category}
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                {t.publishedOn} {formatDate(item.publish_date, 'medium', settings.yearType)}
                                            </p>
                                        </div>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="p-4 bg-gray-50 dark:bg-gray-800 rounded-b-md space-y-3">
                                    <p className="whitespace-pre-wrap">{item.content}</p>
                                    {item.image_urls && item.image_urls.length > 0 && (
                                        <div className="flex flex-wrap gap-2">
                                            {item.image_urls.map((url, idx) => (
                                                <img
                                                    key={idx}
                                                    src={url}
                                                    alt={`Image ${idx + 1}`}
                                                    className="max-w-full h-auto rounded-lg cursor-pointer hover:opacity-80"
                                                />
                                            ))}
                                        </div>
                                    )}
                                    {item.attachments && item.attachments.length > 0 && (
                                        <div className="border-t pt-2">
                                            <p className="text-sm font-semibold mb-2">ไฟล์แนบ:</p>
                                            <div className="space-y-1">
                                                {item.attachments.map((file, idx) => {
                                                    const [fileName, fileData] = file.split('|')
                                                    const isDataUrl = fileData?.startsWith('data:')

                                                    const handleDownload = () => {
                                                        if (isDataUrl && fileData) {
                                                            const link = document.createElement('a')
                                                            link.href = fileData
                                                            link.download = fileName
                                                            document.body.appendChild(link)
                                                            link.click()
                                                            document.body.removeChild(link)
                                                        } else {
                                                            // If it's already a URL, open it
                                                            window.open(fileData, '_blank')
                                                        }
                                                    }

                                                    return (
                                                        <button
                                                            key={idx}
                                                            onClick={handleDownload}
                                                            className="flex items-center gap-2 text-sm text-blue-600 hover:underline w-full text-left p-2 rounded hover:bg-blue-50 dark:hover:bg-blue-950"
                                                        >
                                                            <FileText className="w-4 h-4" />
                                                            <span className="flex-1">{fileName}</span>
                                                            <Download className="w-3 h-3" />
                                                        </button>
                                                    )
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                ) : (
                    <div className="text-center py-16 text-muted-foreground">
                        <MessageSquare className="mx-auto h-12 w-12 text-gray-300" />
                        <p className="mt-4">{t.noAnnouncements}</p>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
