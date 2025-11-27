"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Upload, AlertCircle, CheckCircle2, Loader2, Download } from "lucide-react"
import * as XLSX from "xlsx"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { importAPInvoices, APItem } from "@/lib/actions/bulk-import-ap-actions"
import { useProjectContext } from "@/lib/contexts/project-context"

interface APImportDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess?: () => void
}

export function APImportDialog({ open, onOpenChange, onSuccess }: APImportDialogProps) {
    const { toast } = useToast()
    const { selectedProjectId } = useProjectContext()
    const [file, setFile] = useState<File | null>(null)
    const [previewData, setPreviewData] = useState<APItem[]>([])
    const [errors, setErrors] = useState<string[]>([])
    const [isUploading, setIsUploading] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0]
        if (!selectedFile) return

        setFile(selectedFile)
        setErrors([])
        setPreviewData([])

        const reader = new FileReader()
        reader.onload = (event) => {
            try {
                const bstr = event.target?.result
                const wb = XLSX.read(bstr, { type: "binary" })
                const wsname = wb.SheetNames[0]
                const ws = wb.Sheets[wsname]
                const data = XLSX.utils.sheet_to_json(ws) as any[]

                // Validate and map data
                const mappedData: APItem[] = []
                const validationErrors: string[] = []

                data.forEach((row, index) => {
                    const rowNum = index + 2
                    const vendorName = row['Vendor Name']?.toString().trim()
                    const invoiceNumber = row['Invoice Number']?.toString().trim()
                    const invoiceDate = row['Invoice Date'] // Might be date number
                    const dueDate = row['Due Date'] // Might be date number
                    const amount = parseFloat(row['Amount'])

                    if (!vendorName) validationErrors.push(`Row ${rowNum}: Missing Vendor Name`)
                    if (!invoiceNumber) validationErrors.push(`Row ${rowNum}: Missing Invoice Number`)
                    if (!invoiceDate) validationErrors.push(`Row ${rowNum}: Missing Invoice Date`)
                    if (!dueDate) validationErrors.push(`Row ${rowNum}: Missing Due Date`)
                    if (isNaN(amount) || amount <= 0) validationErrors.push(`Row ${rowNum}: Invalid Amount`)

                    // Helper to parse Excel date
                    const parseDate = (val: any) => {
                        if (!val) return null
                        if (typeof val === 'number') {
                            // Excel date serial number
                            const date = new Date(Math.round((val - 25569) * 86400 * 1000))
                            return date.toISOString().split('T')[0]
                        }
                        // Try string parsing (YYYY-MM-DD)
                        const date = new Date(val)
                        if (!isNaN(date.getTime())) {
                            return date.toISOString().split('T')[0]
                        }
                        return null
                    }

                    const parsedInvoiceDate = parseDate(invoiceDate)
                    const parsedDueDate = parseDate(dueDate)

                    if (!parsedInvoiceDate) validationErrors.push(`Row ${rowNum}: Invalid Invoice Date format`)
                    if (!parsedDueDate) validationErrors.push(`Row ${rowNum}: Invalid Due Date format`)

                    if (vendorName && invoiceNumber && parsedInvoiceDate && parsedDueDate && amount > 0) {
                        mappedData.push({
                            vendor_name: vendorName,
                            invoice_number: invoiceNumber,
                            invoice_date: parsedInvoiceDate!,
                            due_date: parsedDueDate!,
                            amount: amount,
                            notes: row['Notes']?.toString()
                        })
                    }
                })

                if (validationErrors.length > 0) {
                    setErrors(validationErrors)
                } else {
                    setPreviewData(mappedData)
                }

            } catch (error) {
                console.error("Error parsing Excel:", error)
                setErrors(["Failed to parse Excel file. Please ensure it matches the template."])
            }
        }
        reader.readAsBinaryString(selectedFile)
    }

    const handleImport = async () => {
        if (previewData.length === 0) return

        setIsUploading(true)
        try {
            const result = await importAPInvoices(previewData, selectedProjectId)

            if (result.success) {
                toast({
                    title: "Import Successful",
                    description: `Successfully imported ${result.imported} invoices.`,
                })
                onOpenChange(false)
                setFile(null)
                setPreviewData([])
                onSuccess?.()
            } else {
                toast({
                    title: "Import Failed",
                    description: (result as any).error || "Unknown error occurred",
                    variant: "destructive",
                })
            }
        } catch (error: any) {
            toast({
                title: "Import Error",
                description: error.message,
                variant: "destructive",
            })
        } finally {
            setIsUploading(false)
        }
    }

    const handleDownloadTemplate = () => {
        const template = [
            {
                'Vendor Name': 'Cleaning Service Co., Ltd.',
                'Invoice Number': 'INV-2023-001',
                'Invoice Date': '2023-01-15',
                'Due Date': '2023-02-15',
                'Amount': 5000,
                'Notes': 'Monthly cleaning fee'
            }
        ]
        const ws = XLSX.utils.json_to_sheet(template)
        const wb = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(wb, ws, "Template")
        XLSX.writeFile(wb, "ap_invoices_template.xlsx")
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>Import Accounts Payable (Invoices)</DialogTitle>
                    <DialogDescription>
                        Upload an Excel file with columns: Vendor Name, Invoice Number, Invoice Date, Due Date, Amount, Notes.
                        <br />
                        <span className="text-xs text-red-500 font-semibold">Note: Vendor Name must match exactly with existing vendors.</span>
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="flex items-center justify-between">
                        <Button variant="outline" onClick={handleDownloadTemplate} size="sm">
                            <Download className="mr-2 h-4 w-4" />
                            Download Template
                        </Button>
                    </div>

                    <div className="grid w-full max-w-sm items-center gap-1.5">
                        <Label htmlFor="file">Excel File</Label>
                        <Input
                            ref={fileInputRef}
                            id="file"
                            type="file"
                            accept=".xlsx, .xls"
                            onChange={handleFileChange}
                        />
                    </div>

                    {errors.length > 0 && (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Validation Errors</AlertTitle>
                            <AlertDescription>
                                <ScrollArea className="h-[100px]">
                                    <ul className="list-disc pl-4 text-sm">
                                        {errors.map((err, i) => (
                                            <li key={i}>{err}</li>
                                        ))}
                                    </ul>
                                </ScrollArea>
                            </AlertDescription>
                        </Alert>
                    )}

                    {previewData.length > 0 && errors.length === 0 && (
                        <Alert variant="default" className="bg-green-50 border-green-200">
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                            <AlertTitle className="text-green-800">Ready to Import</AlertTitle>
                            <AlertDescription className="text-green-700">
                                Found {previewData.length} valid records.
                            </AlertDescription>
                        </Alert>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleImport}
                        disabled={!file || previewData.length === 0 || isUploading || errors.length > 0}
                    >
                        {isUploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Import Records
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
