import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
    return (
        <div>
            <PageHeader title="งบกระแสเงินสด" subtitle="รายงานการไหลเข้า-ออกของเงินสดแยกตามกิจกรรม" />
            <Card className="mb-6">
                <CardHeader>
                    <Skeleton className="h-6 w-1/3" />
                    <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent className="flex items-end gap-4">
                    <div className="grid gap-2">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-10 w-40" />
                    </div>
                    <div className="grid gap-2">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-10 w-40" />
                    </div>
                    <Skeleton className="h-10 w-36" />
                </CardContent>
            </Card>
            <div className="flex justify-center items-center h-64">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-4 text-muted-foreground">กำลังโหลด...</p>
                </div>
            </div>
        </div>
    )
}
