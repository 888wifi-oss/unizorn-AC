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
import { importOtherAR, ARItem } from "@/lib/actions/bulk-import-ar-actions"
import { useProjectContext } from "@/lib/contexts/project-context"

interface ARImportDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess?: () => void
}

export function ARImportDialog({ open, onOpenChange, onSuccess }: ARImportDialogProps) {
    const { toast } = useToast()
    const { selectedProjectId } = useProjectContext()
    const [file, setFile] = useState<File | null>(null)
    const [previewData, setPreviewData] = useState<ARItem[]>([])
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
                const mappedData: ARItem[] = []
                const validationErrors: string[] = []

                data.forEach((row, index) => {
                    const rowNum = index + 2
                    const unitNumber = row['Unit Number']?.toString().trim()
                    const amount = parseFloat(row['Amount'])
                    const billDate = row['Bill Date']
                    const dueDate = row['Due Date']
                    const billType = row['Bill Type']?.toString().trim().toLowerCase()
                    const description = row['Description']?.toString().trim()

                    if (!unitNumber) validationErrors.push(`Row ${rowNum}: Missing Unit Number`)
                    if (isNaN(amount) || amount <= 0) validationErrors.push(`Row ${rowNum}: Invalid Amount`)
                    if (!billDate) validationErrors.push(`Row ${rowNum}: Missing Bill Date`)
                    if (!dueDate) validationErrors.push(`Row ${rowNum}: Missing Due Date`)
                    if (!billType) validationErrors.push(`Row ${rowNum}: Missing Bill Type`)
                    else if (!['water', 'electricity', 'common_fee', 'fine', 'other'].includes(billType)) {
                        validationErrors.push(`Row ${rowNum}: Invalid Bill Type. Must be water, electricity, common_fee, fine, or other.`)
                    }

                    // Helper to parse Excel date
                    const parseDate = (val: any) => {
                        if (!val) return null
                        if (typeof val === 'number') {
                            const date = new Date(Math.round((val - 25569) * 86400 * 1000))
                            return date.toISOString().split('T')[0]
                        }
                        const date = new Date(val)
                        if (!isNaN(date.getTime())) {
                            return date.toISOString().split('T')[0]
                        }
                        return null
                    }

                    const parsedBillDate = parseDate(billDate)
                    const parsedDueDate = parseDate(dueDate)

                    if (!parsedBillDate) validationErrors.push(`Row ${rowNum}: Invalid Bill Date format`)
                    if (!parsedDueDate) validationErrors.push(`Row ${rowNum}: Invalid Due Date format`)

                    if (unitNumber && amount > 0 && parsedBillDate && parsedDueDate && billType && !validationErrors.some(e => e.startsWith(`Row ${rowNum}`))) {
                        mappedData.push({
                            unit_number: unitNumber,
                            amount: amount,
                            bill_date: parsedBillDate!,
                            due_date: parsedDueDate!,
                            bill_type: billType as any,
                            description: description || `Imported ${billType} bill`
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
            const result = await importOtherAR(previewData, selectedProjectId)

            if (result.success) {
                toast({
                    title: "Import Successful",
                    description: `Successfully imported ${result.imported} bills.`,
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
                'Unit Number': 'A101',
                'Amount': 500,
                'Bill Date': '2023-01-01',
                'Due Date': '2023-01-15',
                'Bill Type': 'fine',
                'Description': 'Late payment fine'
            },
            {
                'Unit Number': 'B202',
                'Amount': 1500,
                'Bill Date': '2023-01-01',
                'Due Date': '2023-01-15',
                'Bill Type': 'other',
                'Description': 'Key card replacement'
            }
        ]
        const ws = XLSX.utils.json_to_sheet(template)
        const wb = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(wb, ws, "Template")
        XLSX.writeFile(wb, "other_ar_template.xlsx")
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>Import Other AR (Bills)</DialogTitle>
                    <DialogDescription>
                        Upload an Excel file with columns: Unit Number, Amount, Bill Date, Due Date, Bill Type (water/electricity/fine/other), Description.
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
