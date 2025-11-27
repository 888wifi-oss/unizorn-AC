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
import { importVehicles, type VehicleItem } from "@/lib/actions/bulk-import-vehicles-actions"
import { useProjectContext } from "@/lib/contexts/project-context"

interface VehiclesImportDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess?: () => void
}

export function VehiclesImportDialog({ open, onOpenChange, onSuccess }: VehiclesImportDialogProps) {
    const { toast } = useToast()
    const { selectedProjectId } = useProjectContext()
    const [file, setFile] = useState<File | null>(null)
    const [previewData, setPreviewData] = useState<VehicleItem[]>([])
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
                const mappedData: VehicleItem[] = []
                const validationErrors: string[] = []

                data.forEach((row, index) => {
                    const rowNum = index + 2
                    const unitNumber = row['Unit Number']?.toString().trim()
                    const licensePlate = row['License Plate']?.toString().trim()
                    const type = row['Type']?.toString().trim()

                    if (!unitNumber) validationErrors.push(`Row ${rowNum}: Missing Unit Number`)
                    if (!licensePlate) validationErrors.push(`Row ${rowNum}: Missing License Plate`)
                    if (!type) validationErrors.push(`Row ${rowNum}: Missing Type`)

                    if (unitNumber && licensePlate && type) {
                        mappedData.push({
                            unit_number: unitNumber,
                            license_plate: licensePlate,
                            type: type,
                            brand: row['Brand']?.toString(),
                            model: row['Model']?.toString(),
                            color: row['Color']?.toString(),
                            sticker_number: row['Sticker Number']?.toString(),
                            owner_name: row['Owner Name']?.toString(),
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
            const result = await importVehicles(previewData, selectedProjectId)

            if (result.success) {
                toast({
                    title: "Import Successful",
                    description: `Successfully imported ${result.imported} vehicles.`,
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
                'License Plate': '1กข 1234',
                'Type': 'car',
                'Brand': 'Toyota',
                'Model': 'Camry',
                'Color': 'White',
                'Sticker Number': 'S2024-001',
                'Owner Name': 'John Doe'
            }
        ]
        const ws = XLSX.utils.json_to_sheet(template)
        const wb = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(wb, ws, "Template")
        XLSX.writeFile(wb, "vehicles_template.xlsx")
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>Import Vehicles</DialogTitle>
                    <DialogDescription>
                        Upload an Excel file with columns: Unit Number, License Plate, Type (car/motorcycle), Brand, Model, Color, Sticker Number.
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
