"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Pin, MessageSquare, FileText, Download, Clock } from "lucide-react"
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
        <Card className="border-none shadow-xl bg-white/80 dark:bg-gray-900/60 backdrop-blur-md animate-in fade-in slide-in-from-bottom-4 duration-1000">
            <CardHeader className="border-b border-gray-100 dark:border-gray-800 pb-4">
                <CardTitle className="text-lg md:text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                    {t.fromManagement}
                </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
                {announcements.length > 0 ? (
                    <Accordion type="single" collapsible className="w-full space-y-3">
                        {announcements.map((item, index) => (
                            <AccordionItem
                                key={item.id}
                                value={item.id}
                                className="border border-gray-100 dark:border-gray-800 rounded-lg overflow-hidden bg-white/50 dark:bg-gray-800/50 shadow-sm hover:shadow-md transition-all duration-300 animate-in fade-in slide-in-from-bottom-2 fill-mode-backwards"
                                style={{ animationDelay: `${index * 100}ms` }}
                            >
                                <AccordionTrigger className="px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/80 transition-colors hover:no-underline">
                                    <div className="flex items-center gap-4 text-left w-full">
                                        {item.is_pinned && <Pin className="w-4 h-4 text-yellow-500 flex-shrink-0 animate-pulse" />}
                                        <div className="flex-1">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <p className="font-semibold text-base text-gray-900 dark:text-gray-100">{item.title}</p>
                                                {item.category && (
                                                    <span className="text-[10px] px-2 py-0.5 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 rounded-full font-medium">
                                                        {item.category}
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                {t.publishedOn} {formatDate(item.publish_date, 'medium', settings.yearType)}
                                            </p>
                                        </div>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="px-4 pb-4 bg-gray-50/50 dark:bg-gray-900/30">
                                    <div className="prose dark:prose-invert max-w-none text-sm text-gray-600 dark:text-gray-300 mt-2">
                                        <p className="whitespace-pre-wrap leading-relaxed">{item.content}</p>
                                    </div>

                                    {item.image_urls && item.image_urls.length > 0 && (
                                        <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-2">
                                            {item.image_urls.map((url, idx) => (
                                                <div key={idx} className="relative aspect-video rounded-lg overflow-hidden group">
                                                    <img
                                                        src={url}
                                                        alt={`Image ${idx + 1}`}
                                                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                                    />
                                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {item.attachments && item.attachments.length > 0 && (
                                        <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
                                            <p className="text-xs font-semibold mb-2 text-muted-foreground uppercase tracking-wider">ไฟล์แนบ</p>
                                            <div className="grid gap-2">
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
                                                            window.open(fileData, '_blank')
                                                        }
                                                    }

                                                    return (
                                                        <button
                                                            key={idx}
                                                            onClick={handleDownload}
                                                            className="flex items-center gap-3 text-sm p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-200 dark:hover:border-blue-800 transition-all group"
                                                        >
                                                            <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-md text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
                                                                <FileText className="w-4 h-4" />
                                                            </div>
                                                            <span className="flex-1 text-left font-medium text-gray-700 dark:text-gray-200 group-hover:text-blue-700 dark:group-hover:text-blue-300 truncate">{fileName}</span>
                                                            <Download className="w-4 h-4 text-gray-400 group-hover:text-blue-500" />
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
                    <div className="text-center py-16 text-muted-foreground bg-gray-50/50 dark:bg-gray-900/50 rounded-lg border border-dashed border-gray-200 dark:border-gray-800">
                        <MessageSquare className="mx-auto h-12 w-12 text-gray-300 mb-3" />
                        <p>{t.noAnnouncements}</p>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
