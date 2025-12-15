"use client"

import { useState } from "react"
import { PageHeader } from "@/components/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowRight, Upload, Users, Zap, FileText, Database, Package, Briefcase, CreditCard, Receipt } from "lucide-react"
import Link from "next/link"
import { DebtImportDialog } from "./debt-import-dialog"
import { VendorsImportDialog } from "./vendors-import-dialog"
import { AssetsImportDialog } from "./assets-import-dialog"
import { COAImportDialog } from "./coa-import-dialog"
import { VehiclesImportDialog } from "./vehicles-import-dialog"
import { ParcelsImportDialog } from "./parcels-import-dialog"
import { StaffImportDialog } from "./staff-import-dialog"
import { APImportDialog } from "./ap-import-dialog"
import { ARImportDialog } from "./ar-import-dialog"

import { OutstandingDebtorsImportDialog } from "./outstanding-debtors-import-dialog"

export default function MigrationPage() {
    const [isDebtImportOpen, setIsDebtImportOpen] = useState(false)
    const [isVendorsImportOpen, setIsVendorsImportOpen] = useState(false)
    const [isAssetsImportOpen, setIsAssetsImportOpen] = useState(false)
    const [isCOAImportOpen, setIsCOAImportOpen] = useState(false)
    const [isVehiclesImportOpen, setIsVehiclesImportOpen] = useState(false)
    const [isParcelsImportOpen, setIsParcelsImportOpen] = useState(false)
    const [isStaffImportOpen, setIsStaffImportOpen] = useState(false)
    const [isAPImportOpen, setIsAPImportOpen] = useState(false)
    const [isARImportOpen, setIsARImportOpen] = useState(false)
    const [isOutstandingImportOpen, setIsOutstandingImportOpen] = useState(false)

    return (
        <div className="space-y-6">
            <PageHeader
                title="Data Migration"
                subtitle="Tools for importing data from legacy systems and managing initial setup."
            />

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {/* Units & Residents */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Users className="h-5 w-5 text-blue-500" />
                            Units & Residents
                        </CardTitle>
                        <CardDescription>
                            Import unit information, owners, and tenants.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground mb-4">
                            Use the bulk import tool in the Units management page to upload your initial resident data.
                        </p>
                        <Button asChild className="w-full" variant="outline">
                            <Link href="/units">
                                Go to Units <ArrowRight className="ml-2 h-4 w-4" />
                            </Link>
                        </Button>
                    </CardContent>
                </Card>

                {/* Outstanding Debtors (New) */}
                <Card className="border-primary bg-primary/5 shadow-md">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Receipt className="h-5 w-5 text-primary" />
                            Outstanding Debtors
                        </CardTitle>
                        <CardDescription>
                            Import outstanding bills from Excel (Specific Format).
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground mb-4">
                            Upload "ลูกหนี้คงค้าง" Excel file to import water, common fee, and other outstanding bills.
                        </p>
                        <Button
                            className="w-full"
                            onClick={() => setIsOutstandingImportOpen(true)}
                        >
                            <Upload className="mr-2 h-4 w-4" />
                            Import Outstanding
                        </Button>
                    </CardContent>
                </Card>

                {/* Staff / Team */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Briefcase className="h-5 w-5 text-indigo-500" />
                            Staff & Team
                        </CardTitle>
                        <CardDescription>
                            Import staff, engineers, and resident accounts.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground mb-4">
                            Upload list of employees and team members.
                        </p>
                        <Button
                            className="w-full"
                            variant="outline"
                            onClick={() => setIsStaffImportOpen(true)}
                        >
                            <Upload className="mr-2 h-4 w-4" />
                            Import Staff
                        </Button>
                    </CardContent>
                </Card>

                {/* Chart of Accounts */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <FileText className="h-5 w-5 text-green-500" />
                            Chart of Accounts
                        </CardTitle>
                        <CardDescription>
                            Import custom account codes and structure.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground mb-4">
                            Upload your chart of accounts structure.
                        </p>
                        <Button
                            className="w-full"
                            variant="outline"
                            onClick={() => setIsCOAImportOpen(true)}
                        >
                            <Upload className="mr-2 h-4 w-4" />
                            Import Accounts
                        </Button>
                    </CardContent>
                </Card>

                {/* Vendors */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Users className="h-5 w-5 text-orange-500" />
                            Vendors
                        </CardTitle>
                        <CardDescription>
                            Import suppliers and service providers.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground mb-4">
                            Upload vendor list with contact details and tax info.
                        </p>
                        <Button
                            className="w-full"
                            variant="outline"
                            onClick={() => setIsVendorsImportOpen(true)}
                        >
                            <Upload className="mr-2 h-4 w-4" />
                            Import Vendors
                        </Button>
                    </CardContent>
                </Card>

                {/* Fixed Assets */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Database className="h-5 w-5 text-purple-500" />
                            Fixed Assets
                        </CardTitle>
                        <CardDescription>
                            Import assets registry and depreciation data.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground mb-4">
                            Upload fixed assets list with purchase cost and lifespan.
                        </p>
                        <Button
                            className="w-full"
                            variant="outline"
                            onClick={() => setIsAssetsImportOpen(true)}
                        >
                            <Upload className="mr-2 h-4 w-4" />
                            Import Assets
                        </Button>
                    </CardContent>
                </Card>

                {/* Utility Meters */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Zap className="h-5 w-5 text-yellow-500" />
                            Utility Meters
                        </CardTitle>
                        <CardDescription>
                            Import meter readings and setup initial meter values.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground mb-4">
                            Configure meters and import initial readings from the Utility Meters page.
                        </p>
                        <Button asChild className="w-full" variant="outline">
                            <Link href="/utility-meters">
                                Go to Meters <ArrowRight className="ml-2 h-4 w-4" />
                            </Link>
                        </Button>
                    </CardContent>
                </Card>

                {/* Vehicles */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Database className="h-5 w-5 text-red-500" />
                            Vehicles
                        </CardTitle>
                        <CardDescription>
                            Import resident vehicles and stickers.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground mb-4">
                            Upload vehicle registration data linked to units.
                        </p>
                        <Button
                            className="w-full"
                            variant="outline"
                            onClick={() => setIsVehiclesImportOpen(true)}
                        >
                            <Upload className="mr-2 h-4 w-4" />
                            Import Vehicles
                        </Button>
                    </CardContent>
                </Card>

                {/* Parcels */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Package className="h-5 w-5 text-amber-600" />
                            Parcels
                        </CardTitle>
                        <CardDescription>
                            Import pending parcels for residents.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground mb-4">
                            Upload list of parcels waiting for collection.
                        </p>
                        <Button
                            className="w-full"
                            variant="outline"
                            onClick={() => setIsParcelsImportOpen(true)}
                        >
                            <Upload className="mr-2 h-4 w-4" />
                            Import Parcels
                        </Button>
                    </CardContent>
                </Card>

                {/* Accounts Payable (AP) */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <CreditCard className="h-5 w-5 text-rose-500" />
                            Accounts Payable
                        </CardTitle>
                        <CardDescription>
                            Import unpaid vendor invoices.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground mb-4">
                            Upload outstanding bills from vendors.
                        </p>
                        <Button
                            className="w-full"
                            variant="outline"
                            onClick={() => setIsAPImportOpen(true)}
                        >
                            <Upload className="mr-2 h-4 w-4" />
                            Import AP
                        </Button>
                    </CardContent>
                </Card>

                {/* Beginning Balances (Legacy) */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <FileText className="h-5 w-5 text-gray-500" />
                            Beginning Balances (Legacy)
                        </CardTitle>
                        <CardDescription>
                            Import outstanding common fee debt (Old format).
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground mb-4">
                            Upload outstanding balances for units.
                        </p>
                        <Button
                            className="w-full"
                            variant="outline"
                            onClick={() => setIsDebtImportOpen(true)}
                        >
                            <Upload className="mr-2 h-4 w-4" />
                            Import Balances
                        </Button>
                    </CardContent>
                </Card>

                {/* Other AR (Legacy) */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Receipt className="h-5 w-5 text-gray-500" />
                            Other AR (Legacy)
                        </CardTitle>
                        <CardDescription>
                            Import other receivables (Old format).
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground mb-4">
                            Upload other outstanding bills.
                        </p>
                        <Button
                            className="w-full"
                            variant="outline"
                            onClick={() => setIsARImportOpen(true)}
                        >
                            <Upload className="mr-2 h-4 w-4" />
                            Import Other AR
                        </Button>
                    </CardContent>
                </Card>
            </div>

            <div className="mt-8">
                <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                    <Database className="h-5 w-5" />
                    Migration Checklist
                </h3>
                <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                        <div className="h-6 w-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold">1</div>
                        <span>Import Units & Owners (Required first)</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                        <div className="h-6 w-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold">2</div>
                        <span className="font-semibold text-primary">Import Outstanding Debtors (New Excel Format)</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                        <div className="h-6 w-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold">3</div>
                        <span>Import Staff & Team</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                        <div className="h-6 w-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-xs font-bold">4</div>
                        <span>Import Chart of Accounts (Optional - if custom)</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                        <div className="h-6 w-6 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center text-xs font-bold">5</div>
                        <span>Import Vendors & Fixed Assets</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                        <div className="h-6 w-6 rounded-full bg-yellow-100 text-yellow-600 flex items-center justify-center text-xs font-bold">6</div>
                        <span>Import Utility Meters & Initial Readings</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                        <div className="h-6 w-6 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-xs font-bold">7</div>
                        <span>Import Vehicles & Parcels</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                        <div className="h-6 w-6 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center text-xs font-bold">8</div>
                        <span>Import Accounts Payable (Unpaid Invoices)</span>
                    </div>
                </div>
            </div>

            <DebtImportDialog
                open={isDebtImportOpen}
                onOpenChange={setIsDebtImportOpen}
            />
            <VendorsImportDialog
                open={isVendorsImportOpen}
                onOpenChange={setIsVendorsImportOpen}
            />
            <AssetsImportDialog
                open={isAssetsImportOpen}
                onOpenChange={setIsAssetsImportOpen}
            />
            <COAImportDialog
                open={isCOAImportOpen}
                onOpenChange={setIsCOAImportOpen}
            />
            <VehiclesImportDialog
                open={isVehiclesImportOpen}
                onOpenChange={setIsVehiclesImportOpen}
            />
            <ParcelsImportDialog
                open={isParcelsImportOpen}
                onOpenChange={setIsParcelsImportOpen}
            />
            <StaffImportDialog
                open={isStaffImportOpen}
                onOpenChange={setIsStaffImportOpen}
            />
            <APImportDialog
                open={isAPImportOpen}
                onOpenChange={setIsAPImportOpen}
            />
            <ARImportDialog
                open={isARImportOpen}
                onOpenChange={setIsARImportOpen}
            />
            <OutstandingDebtorsImportDialog
                open={isOutstandingImportOpen}
                onOpenChange={setIsOutstandingImportOpen}
            />
        </div>
    )
}
