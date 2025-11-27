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
import { importFixedAssets, type AssetItem } from "@/lib/actions/bulk-import-assets-actions"
import { useProjectContext } from "@/lib/contexts/project-context"

interface AssetsImportDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess?: () => void
}

export function AssetsImportDialog({ open, onOpenChange, onSuccess }: AssetsImportDialogProps) {
    const { toast } = useToast()
    const { selectedProjectId } = useProjectContext()
    const [file, setFile] = useState<File | null>(null)
    const [previewData, setPreviewData] = useState<AssetItem[]>([])
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
                const mappedData: AssetItem[] = []
                const validationErrors: string[] = []

                data.forEach((row, index) => {
                    const rowNum = index + 2
                    const name = row['Asset Name']?.toString().trim()
                    const purchaseDate = row['Purchase Date'] // YYYY-MM-DD
                    const cost = parseFloat(row['Cost'])
                    const lifespan = parseInt(row['Lifespan (Years)'])

                    if (!name) validationErrors.push(`Row ${rowNum}: Missing Asset Name`)
                    if (!purchaseDate) validationErrors.push(`Row ${rowNum}: Missing Purchase Date`)
                    if (isNaN(cost)) validationErrors.push(`Row ${rowNum}: Invalid Cost`)
                    if (isNaN(lifespan)) validationErrors.push(`Row ${rowNum}: Invalid Lifespan`)

                    // Date formatting
                    let formattedDate = purchaseDate
                    if (typeof purchaseDate === 'number') {
                        const d = new Date((purchaseDate - (25567 + 2)) * 86400 * 1000)
                        formattedDate = d.toISOString().split('T')[0]
                    }

                    if (name && formattedDate && !isNaN(cost) && !isNaN(lifespan)) {
                        mappedData.push({
                            asset_name: name,
                            asset_code: row['Asset Code']?.toString(),
                            purchase_date: formattedDate,
                            purchase_cost: cost,
                            lifespan_years: lifespan,
                            salvage_value: parseFloat(row['Salvage Value']) || 0,
                            location: row['Location']?.toString(),
                            description: row['Description']?.toString(),
                            status: 'in_use',
                            asset_account_code: row['Asset Account']?.toString(),
                            depreciation_account_code: row['Depreciation Account']?.toString(),
                            expense_account_code: row['Expense Account']?.toString(),
                            project_id: selectedProjectId || undefined
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
            const result = await importFixedAssets(previewData, selectedProjectId)

            if (result.success) {
                toast({
                    title: "Import Successful",
                    description: `Successfully imported ${result.imported} assets.`,
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
                'Asset Name': 'Office Desk',
                'Asset Code': 'FUR-001',
                'Purchase Date': '2024-01-01',
                'Cost': 5000,
                'Lifespan (Years)': 5,
                'Salvage Value': 500,
                'Location': 'Office',
                'Description': 'Wooden Desk',
                'Asset Account': '1201',
                'Depreciation Account': '1204',
                'Expense Account': '5901'
            }
        ]
        const ws = XLSX.utils.json_to_sheet(template)
        const wb = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(wb, ws, "Template")
        XLSX.writeFile(wb, "fixed_assets_template.xlsx")
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>Import Fixed Assets</DialogTitle>
                    <DialogDescription>
                        Upload an Excel file with columns: Asset Name, Asset Code, Purchase Date, Cost, Lifespan (Years), Salvage Value, Location, Description.
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
