"use client"

import { useState, useRef, useEffect } from "react"
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { importOutstandingDebtors, OutstandingDebtorItem } from "@/lib/actions/bulk-import-outstanding-actions"
import { getUnitsFromDB } from "@/lib/supabase/actions"
import { useProjectContext } from "@/lib/contexts/project-context"

interface OutstandingDebtorsImportDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess?: () => void
}

export function OutstandingDebtorsImportDialog({ open, onOpenChange, onSuccess }: OutstandingDebtorsImportDialogProps) {
    const { toast } = useToast()
    const { selectedProjectId } = useProjectContext()
    const [file, setFile] = useState<File | null>(null)
    const [previewData, setPreviewData] = useState<OutstandingDebtorItem[]>([])
    const [errors, setErrors] = useState<string[]>([])
    const [isUploading, setIsUploading] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [debugLog, setDebugLog] = useState<string[]>([])

    // State for valid units
    const [validUnits, setValidUnits] = useState<Set<string>>(new Set())
    const [isLoadingUnits, setIsLoadingUnits] = useState(false)

    // Progress state
    const [importProgress, setImportProgress] = useState(0)
    const [importStatus, setImportStatus] = useState<'idle' | 'importing' | 'success' | 'error'>('idle')

    // Fetch units when dialog opens
    useEffect(() => {
        if (open && selectedProjectId) {
            fetchUnits()
        }
    }, [open, selectedProjectId])

    const fetchUnits = async () => {
        setIsLoadingUnits(true)
        addLog(`Fetching units for Project ID: ${selectedProjectId}`)
        try {
            const result = await getUnitsFromDB(selectedProjectId)
            if (result.success && result.units) {
                const unitSet = new Set(result.units.map((u: any) => u.unit_number.toLowerCase().trim()))
                setValidUnits(unitSet)
                addLog(`Loaded ${unitSet.size} valid units (Server reported ${result.units.length} items)`)
            } else {
                addLog("Failed to load units", result.error)
            }
        } catch (error: any) {
            addLog("Exception loading units", error.message)
        } finally {
            setIsLoadingUnits(false)
        }
    }

    const addLog = (message: string, data?: any) => {
        const timestamp = new Date().toLocaleTimeString()
        const logEntry = `[${timestamp}] ${message} ${data ? JSON.stringify(data, null, 2) : ''}`
        setDebugLog(prev => [...prev, logEntry])
        console.log(logEntry)
    }

    const handleDownloadTemplate = () => {
        // Create template with proper column structure
        // Column A: (empty), B: Invoice No, C: Issue Date, D: Due Date, E: Unit No, 
        // F: Item Code, G: Service Name, H: Description, I-K: (empty), L: Outstanding Amount
        const templateData = [
            // Header row (row 1)
            ['', 'Invoice No', 'Issue Date', 'Due Date', 'Unit No', 'Item Code', 'Service Name', 'Description', '', '', '', 'Outstanding Amount'],
            // Example row 1 (row 2)
            ['', 'INV-2024-001', '2024-01-15', '2024-02-15', '1001', 'WTR-001', 'ค่าน้ำ', 'ค่าน้ำเดือนมกราคม 2567', '', '', '', 500.00],
            // Example row 2 (row 3)
            ['', 'INV-2024-002', '2024-01-15', '2024-02-15', '1002', 'CF-001', 'ค่าส่วนกลาง', 'ค่าส่วนกลางเดือนมกราคม 2567', '', '', '', 2500.00],
            // Example row 3 (row 4)
            ['', '', '2024-01-20', '2024-02-20', '1003', '', 'ค่าไฟ', 'ค่าไฟฟ้าเดือนมกราคม 2567', '', '', '', 800.00],
        ]

        const ws = XLSX.utils.aoa_to_sheet(templateData)
        const wb = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(wb, ws, 'Outstanding Debtors')

        // Set column widths for better readability
        ws['!cols'] = [
            { wch: 5 },   // Column A
            { wch: 15 },  // Column B - Invoice No
            { wch: 12 },  // Column C - Issue Date
            { wch: 12 },  // Column D - Due Date
            { wch: 10 },  // Column E - Unit No
            { wch: 12 },  // Column F - Item Code
            { wch: 20 },  // Column G - Service Name
            { wch: 30 },  // Column H - Description
            { wch: 5 },   // Column I
            { wch: 5 },   // Column J
            { wch: 5 },   // Column K
            { wch: 18 },  // Column L - Outstanding Amount
        ]

        // Style header row (bold)
        const headerRange = XLSX.utils.decode_range(ws['!ref'] || 'A1:L1')
        for (let col = headerRange.s.c; col <= headerRange.e.c; col++) {
            const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col })
            if (!ws[cellAddress]) ws[cellAddress] = { t: 's', v: '' }
            ws[cellAddress].s = {
                font: { bold: true },
                fill: { fgColor: { rgb: 'E0E0E0' } }
            }
        }

        // Download file
        XLSX.writeFile(wb, 'outstanding_debtors_template.xlsx')
        
        toast({
            title: "Template Downloaded",
            description: "Template file has been downloaded. Please fill in your data.",
        })
    }

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0]
        if (!selectedFile) return

        setFile(selectedFile)
        setErrors([])
        setPreviewData([])
        setDebugLog([])
        addLog(`File selected: ${selectedFile.name}`)

        const reader = new FileReader()
        reader.onload = (event) => {
            try {
                const bstr = event.target?.result
                const wb = XLSX.read(bstr, { type: "binary" })
                const wsname = wb.SheetNames[0]
                const ws = wb.Sheets[wsname]

                addLog(`Sheet found: ${wsname}`)

                // Use header: 1 to get array of arrays, which is safer for column index mapping
                const data = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][]
                addLog(`Total rows found: ${data.length}`)

                // Validate and map data
                const mappedData: OutstandingDebtorItem[] = []
                const validationErrors: string[] = []

                if (data.length > 1) {
                    addLog(`First data row (Row 2):`, data[1])
                }

                // Column Mapping (0-indexed based on Excel A=0, B=1, etc.)
                // B (1): Invoice No
                // C (2): Issue Date
                // D (3): Due Date
                // E (4): Unit No
                // F (5): Item Code
                // G (6): Service Name
                // H (7): Description
                // L (11): Outstanding (Amount)

                // Skip header row
                for (let i = 1; i < data.length; i++) {
                    const row = data[i]
                    if (!row || row.length === 0) continue

                    const rowNum = i + 1

                    // Extract values by index
                    const invoiceNo = row[1]?.toString().trim()
                    const issueDate = row[2]
                    const dueDate = row[3]
                    const unitNumber = row[4]?.toString().trim()
                    const itemCode = row[5]?.toString().trim()
                    const serviceName = row[6]?.toString().trim()
                    const description = row[7]?.toString().trim()
                    // Handle Excel raw numeric values or strings for amount
                    const rawAmount = row[11]
                    const outstandingAmount = typeof rawAmount === 'number' ? rawAmount : parseFloat(rawAmount)

                    // Skip empty rows (check essential fields)
                    if (!unitNumber && !serviceName && !outstandingAmount) continue

                    // Validation
                    if (!unitNumber) validationErrors.push(`Row ${rowNum}: Missing Unit Number (Column E)`)
                    if (isNaN(outstandingAmount)) validationErrors.push(`Row ${rowNum}: Invalid Outstanding Amount (Column L) - Value: ${rawAmount}`)

                    // Check unit mapping
                    if (unitNumber && validUnits.size > 0) {
                        const unitKey = unitNumber.toLowerCase().trim()
                        if (!validUnits.has(unitKey)) {
                            validationErrors.push(`Row ${rowNum}: Unit '${unitNumber}' not found in system`)
                        }
                    }

                    // Date parsing
                    const parseDate = (val: any) => {
                        if (!val) return null
                        if (typeof val === 'number') {
                            // Excel date serial
                            const date = new Date(Math.round((val - 25569) * 86400 * 1000))
                            return date.toISOString().split('T')[0]
                        }
                        // String date (DD/MM/YYYY or YYYY-MM-DD)
                        // Try standard parse first
                        let date = new Date(val)
                        if (!isNaN(date.getTime())) return date.toISOString().split('T')[0]

                        // Try DD/MM/YYYY
                        if (typeof val === 'string' && val.includes('/')) {
                            const parts = val.split('/')
                            if (parts.length === 3) {
                                // Assume DD/MM/YYYY
                                date = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`)
                                if (!isNaN(date.getTime())) return date.toISOString().split('T')[0]
                            }
                        }
                        return null
                    }

                    const parsedIssueDate = parseDate(issueDate)
                    const parsedDueDate = parseDate(dueDate)

                    if (!parsedIssueDate) validationErrors.push(`Row ${rowNum}: Invalid Issue Date (Column C) - Value: ${issueDate}`)
                    if (!parsedDueDate) validationErrors.push(`Row ${rowNum}: Invalid Due Date (Column D) - Value: ${dueDate}`)

                    // Only add to mappedData if all validations pass
                    if (unitNumber && !isNaN(outstandingAmount) && parsedIssueDate && parsedDueDate) {
                        // Double check unit mapping before adding
                        const unitKey = unitNumber.toLowerCase().trim()
                        if (validUnits.size === 0 || validUnits.has(unitKey)) {
                            mappedData.push({
                                invoice_number: invoiceNo,
                                bill_date: parsedIssueDate,
                                due_date: parsedDueDate,
                                unit_number: unitNumber,
                                item_code: itemCode,
                                service_name: serviceName || 'Unknown Service',
                                description: description,
                                amount: outstandingAmount
                            })
                        }
                    }
                }

                addLog(`Mapped records: ${mappedData.length}`)
                addLog(`Validation errors: ${validationErrors.length}`)

                if (validationErrors.length > 0) {
                    setErrors(validationErrors)
                    addLog(`Errors:`, validationErrors.slice(0, 5))
                } else {
                    setPreviewData(mappedData)
                    if (mappedData.length > 0) {
                        addLog(`First mapped item preview:`, mappedData[0])
                    }
                }

            } catch (error: any) {
                console.error("Error parsing Excel:", error)
                setErrors(["Failed to parse Excel file. Please ensure it matches the format."])
                addLog(`Exception during parsing: ${error.message}`)
            }
        }
        reader.readAsBinaryString(selectedFile)
    }

    const handleImport = async () => {
        if (previewData.length === 0) return

        setIsUploading(true)
        setImportStatus('importing')
        setImportProgress(0)
        addLog(`Starting import of ${previewData.length} records...`)
        
        try {
            // Simulate progress updates (since we can't track real-time progress from server action)
            const progressInterval = setInterval(() => {
                setImportProgress(prev => {
                    if (prev >= 90) {
                        clearInterval(progressInterval)
                        return prev
                    }
                    return prev + 10
                })
            }, 200)

            const result = await importOutstandingDebtors(previewData, selectedProjectId)
            
            clearInterval(progressInterval)
            setImportProgress(100)

            addLog(`Import result:`, result)
            if ((result as any).debug) {
                addLog("Server Debug Info:", (result as any).debug)
            }

            // Check for validation errors
            if ((result as any).validationErrors && (result as any).validationErrors.length > 0) {
                const validationErrors = (result as any).validationErrors as string[]
                setErrors(validationErrors)
                addLog(`Validation failed with ${validationErrors.length} errors`)
                
                toast({
                    title: "Validation Failed",
                    description: `Please fix ${validationErrors.length} validation error(s) before importing.`,
                    variant: "destructive",
                })
                return
            }

            if ((result as any).unmappedUnits && (result as any).unmappedUnits.length > 0) {
                const unmappedUnits = (result as any).unmappedUnits as string[]
                const unitErrors = unmappedUnits.map(unit => `Unit '${unit}' not found in system`)
                setErrors([...errors, ...unitErrors])
                
                toast({
                    title: "Unit Mapping Failed",
                    description: `${unmappedUnits.length} unit(s) could not be mapped. Please check unit numbers.`,
                    variant: "destructive",
                })
                return
            }

            if (result.success) {
                setImportStatus('success')
                toast({
                    title: "Import Successful",
                    description: `Successfully imported ${(result as any).imported} records.`,
                })
                if ((result as any).imported > 0) {
                    // Wait a bit to show success status
                    setTimeout(() => {
                        onOpenChange(false)
                        setFile(null)
                        setPreviewData([])
                        setErrors([])
                        setImportProgress(0)
                        setImportStatus('idle')
                        onSuccess?.()
                    }, 1500)
                } else {
                    addLog("Result success but 0 imported??")
                    setImportStatus('error')
                }
            } else {
                setImportStatus('error')
                const errorMessage = (result as any).error || "Unknown error occurred"
                addLog(`Import failed: ${errorMessage}`)
                
                // If there are specific errors, add them to the errors list
                if ((result as any).errors && Array.isArray((result as any).errors)) {
                    const errorList = (result as any).errors.map((e: any) => 
                        e.message || `${e.unit}: ${e.error}`
                    )
                    setErrors(errorList)
                }
                
                toast({
                    title: "Import Failed",
                    description: errorMessage,
                    variant: "destructive",
                })
            }
        } catch (error: any) {
            setImportStatus('error')
            setImportProgress(0)
            addLog(`Import exception: ${error.message}`)
            toast({
                title: "Import Error",
                description: error.message,
                variant: "destructive",
            })
        } finally {
            setIsUploading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[800px] max-h-[90vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Import Outstanding Debtors</DialogTitle>
                    <DialogDescription>
                        Upload Excel file with specific format (Columns B, C, D, E, G, L).
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4 overflow-y-auto">
                    <div className="flex items-center justify-between gap-4">
                        <div className="grid w-full items-center gap-1.5">
                            <Label htmlFor="file">Excel File</Label>
                            <Input
                                ref={fileInputRef}
                                id="file"
                                type="file"
                                accept=".xlsx, .xls"
                                onChange={handleFileChange}
                            />
                        </div>
                        <div className="flex items-end">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleDownloadTemplate}
                                className="whitespace-nowrap"
                            >
                                <Download className="mr-2 h-4 w-4" />
                                Download Template
                            </Button>
                        </div>
                    </div>
                    
                    <Alert variant="default" className="bg-blue-50 border-blue-200">
                        <AlertCircle className="h-4 w-4 text-blue-600" />
                        <AlertTitle className="text-blue-800">Format Guide</AlertTitle>
                        <AlertDescription className="text-blue-700 text-sm">
                            <p className="mb-2">Required columns:</p>
                            <ul className="list-disc pl-5 space-y-1">
                                <li><strong>Column B:</strong> Invoice No (optional)</li>
                                <li><strong>Column C:</strong> Issue Date (YYYY-MM-DD or DD/MM/YYYY)</li>
                                <li><strong>Column D:</strong> Due Date (YYYY-MM-DD or DD/MM/YYYY)</li>
                                <li><strong>Column E:</strong> Unit Number (required)</li>
                                <li><strong>Column G:</strong> Service Name (required)</li>
                                <li><strong>Column L:</strong> Outstanding Amount (required)</li>
                            </ul>
                        </AlertDescription>
                    </Alert>

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
                        <>
                            <Alert variant="default" className="bg-green-50 border-green-200">
                                <CheckCircle2 className="h-4 w-4 text-green-600" />
                                <AlertTitle className="text-green-800">Ready to Import</AlertTitle>
                                <AlertDescription className="text-green-700">
                                    Found {previewData.length} valid records ready to import.
                                </AlertDescription>
                            </Alert>

                            {/* Preview Table */}
                            <div className="space-y-2">
                                <Label className="text-sm font-semibold">Preview Data (showing first 10 records)</Label>
                                <div className="border rounded-lg overflow-hidden">
                                    <ScrollArea className="h-[300px]">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead className="w-[80px]">#</TableHead>
                                                    <TableHead>Unit No</TableHead>
                                                    <TableHead>Invoice No</TableHead>
                                                    <TableHead>Service Name</TableHead>
                                                    <TableHead>Issue Date</TableHead>
                                                    <TableHead>Due Date</TableHead>
                                                    <TableHead className="text-right">Amount</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {previewData.slice(0, 10).map((item, index) => (
                                                    <TableRow key={index}>
                                                        <TableCell className="text-muted-foreground">{index + 1}</TableCell>
                                                        <TableCell className="font-medium">{item.unit_number}</TableCell>
                                                        <TableCell>{item.invoice_number || '-'}</TableCell>
                                                        <TableCell>
                                                            <Badge variant="outline" className="text-xs">
                                                                {item.service_name}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell className="text-sm">{item.bill_date}</TableCell>
                                                        <TableCell className="text-sm">{item.due_date}</TableCell>
                                                        <TableCell className="text-right font-semibold">
                                                            {new Intl.NumberFormat('th-TH', {
                                                                style: 'currency',
                                                                currency: 'THB',
                                                                minimumFractionDigits: 2
                                                            }).format(item.amount)}
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </ScrollArea>
                                </div>
                                {previewData.length > 10 && (
                                    <p className="text-xs text-muted-foreground text-center">
                                        ... and {previewData.length - 10} more records
                                    </p>
                                )}
                            </div>
                        </>
                    )}

                    {/* Progress Bar */}
                    {importStatus !== 'idle' && (
                        <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                                <span className="font-medium">
                                    {importStatus === 'importing' && 'Importing...'}
                                    {importStatus === 'success' && 'Import Completed'}
                                    {importStatus === 'error' && 'Import Failed'}
                                </span>
                                <span className="text-muted-foreground">
                                    {importProgress}%
                                </span>
                            </div>
                            <Progress value={importProgress} className="h-2" />
                            {importStatus === 'importing' && (
                                <p className="text-xs text-muted-foreground">
                                    Processing {previewData.length} records...
                                </p>
                            )}
                        </div>
                    )}

                    {/* Debug Log Section */}
                    <div className="bg-slate-950 text-slate-50 p-4 rounded-md text-xs font-mono h-[200px] overflow-y-auto">
                        <div className="font-bold mb-2 border-b border-slate-700 pb-1">Debug Log</div>
                        {debugLog.length === 0 ? (
                            <div className="text-slate-500 italic">Waiting for file...</div>
                        ) : (
                            debugLog.map((log, i) => (
                                <div key={i} className="whitespace-pre-wrap mb-1">{log}</div>
                            ))
                        )}
                    </div>
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
