"use client"

import { useState, useEffect } from "react"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { getUnitProfile, updateUnitLineId } from "@/lib/actions/profile-actions"
import { MessageSquare, Save, Loader2 } from "lucide-react"

export default function ProfilePage() {
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [lineUserId, setLineUserId] = useState("")
    const [user, setUser] = useState<any>(null)
    const { toast } = useToast()
    const [liffError, setLiffError] = useState<string | null>(null)
    const [isLiffReady, setIsLiffReady] = useState(false)

    // Load resident data from local storage (same as Dashboard)
    useEffect(() => {
        const loadResidentData = async () => {
            const residentDataString = localStorage.getItem("residentData")
            if (!residentDataString) {
                // Not logged in properly
                setLoading(false)
                return
            }

            try {
                const residentInfo = JSON.parse(residentDataString)
                const unitId = residentInfo.id // In Ultra Simple Auth, this is the Unit ID

                if (unitId) {
                    const { success, user, error } = await getUnitProfile(unitId)
                    if (success && user) {
                        setUser(user)
                        setLineUserId(user.line_user_id || "")
                    } else {
                        console.error("Failed to load unit profile:", error)
                        toast({
                            title: "เกิดข้อผิดพลาด",
                            description: "ไม่สามารถโหลดข้อมูลโปรไฟล์ได้",
                            variant: "destructive"
                        })
                    }
                }
            } catch (error) {
                console.error("Error parsing resident data:", error)
            } finally {
                setLoading(false)
            }
        }
        loadResidentData()
    }, [toast])

    // Initialize LINE LIFF
    useEffect(() => {
        const initLiff = async () => {
            try {
                const liff = (await import('@line/liff')).default
                await liff.init({ liffId: process.env.NEXT_PUBLIC_LINE_LIFF_ID || '' })
                setIsLiffReady(true)

                if (liff.isLoggedIn()) {
                    const profile = await liff.getProfile()
                    console.log("LIFF Profile:", profile)
                    // If user is logged in via LIFF, we can auto-fill or suggest the ID
                    if (profile.userId) {
                        // Optional: Check if we should auto-fill only if empty, or distinct UI
                        // For now, let's toast or show in UI
                    }
                }
            } catch (error: any) {
                console.error("LIFF Init Error:", error)
                setLiffError(error.message)
            }
        }

        // Only run on client-side and if ID is present
        if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_LINE_LIFF_ID) {
            initLiff()
        }
    }, [])

    const handleLinkWithLine = async () => {
        try {
            const liff = (await import('@line/liff')).default
            if (!liff.isLoggedIn()) {
                liff.login()
                return
            }

            const profile = await liff.getProfile()
            if (profile.userId) {
                setLineUserId(profile.userId)
                toast({
                    title: "ดึงข้อมูลสำเร็จ",
                    description: `ได้รับ LINE User ID: ${profile.userId}`,
                })
            }
        } catch (error: any) {
            console.error("LIFF Login Error:", error)
            toast({
                title: "เกิดข้อผิดพลาด",
                description: `ไม่สามารถเชื่อมต่อกับ LINE ได้: ${error.message || error}`,
                variant: "destructive"
            })
        }
    }

    const handleSaveLineId = async () => {
        if (!user || !user.id) return

        setSaving(true)
        try {
            // Use updateUnitLineId instead of updateUserLineId
            const { success, error } = await updateUnitLineId(user.id, lineUserId)

            if (success) {
                toast({
                    title: "บันทึกสำเร็จ",
                    description: "บันทึก LINE User ID เรียบร้อยแล้ว",
                })
            } else {
                toast({
                    title: "เกิดข้อผิดพลาด",
                    description: error,
                    variant: "destructive"
                })
            }
        } catch (error) {
            toast({
                title: "เกิดข้อผิดพลาด",
                description: "ไม่สามารถบันทึกข้อมูลได้",
                variant: "destructive"
            })
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return <div className="flex justify-center py-10"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>
    }

    if (!user) {
        return <div className="text-center py-10">กรุณาเข้าสู่ระบบ</div>
    }

    return (
        <div className="space-y-6">
            <PageHeader
                title="โปรไฟล์ของฉัน"
                subtitle="จัดการข้อมูลส่วนตัวและการเชื่อมต่อ"
            />

            <div className="grid gap-6 md:grid-cols-2">
                {/* User Info Card */}
                <Card>
                    <CardHeader>
                        <CardTitle>ข้อมูลส่วนตัว</CardTitle>
                        <CardDescription>ข้อมูลบัญชีผู้ใช้ของคุณ</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>ชื่อ-นามสกุล</Label>
                            <Input value={user.full_name} disabled />
                        </div>
                        <div className="space-y-2">
                            <Label>อีเมล</Label>
                            <Input value={user.email} disabled />
                        </div>
                        <div className="space-y-2">
                            <Label>เบอร์โทรศัพท์</Label>
                            <Input value={user.phone || "-"} disabled />
                        </div>
                    </CardContent>
                </Card>

                {/* LINE Integration Card */}
                <Card className="border-green-200 bg-green-50/30">
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <MessageSquare className="w-6 h-6 text-green-600" />
                            <CardTitle className="text-green-800">การเชื่อมต่อ LINE</CardTitle>
                        </div>
                        <CardDescription>
                            รับการแจ้งเตือนบิล, พัสดุ, และประกาศผ่าน LINE
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* LIFF Auto Link Section */}
                        <div className="bg-white p-4 rounded-lg border border-green-100 space-y-3">
                            <h4 className="font-medium text-sm text-green-900">เชื่อมต่ออัตโนมัติ (แนะนำ)</h4>
                            <p className="text-sm text-gray-500">กดปุ่มด้านล่างเพื่อดึงข้อมูล LINE ID ของคุณโดยอัตโนมัติ</p>
                            <Button
                                onClick={handleLinkWithLine}
                                className="w-full bg-[#06C755] hover:bg-[#05b34c] text-white"
                                variant="outline"
                            >
                                <MessageSquare className="w-4 h-4 mr-2" />
                                เชื่อมต่อด้วย LINE
                            </Button>
                            {!process.env.NEXT_PUBLIC_LINE_LIFF_ID && (
                                <p className="text-xs text-red-500 mt-1">
                                    * ยังไม่ได้ตั้งค่า LIFF ID ในระบบ
                                </p>
                            )}
                        </div>

                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t border-green-200" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-green-50 px-2 text-green-600">หรือ กรอกเอง</span>
                            </div>
                        </div>

                        <div className="bg-white/50 p-4 rounded-lg border border-green-100 space-y-2">
                            <h4 className="font-medium text-sm text-green-900">วิธีค้นหา LINE User ID (แบบ Manual)</h4>
                            <ol className="list-decimal list-inside text-sm text-gray-600 space-y-1">
                                <li>เพิ่มเพื่อน <strong>@829yfgfj</strong></li>
                                <li>พิมพ์ข้อความว่า <strong>"myid"</strong> แล้วส่งไป</li>
                                <li>บอทจะตอบกลับพร้อมรหัส User ID ของคุณ</li>
                                <li>นำรหัสมากรอกในช่องด้านล่าง</li>
                            </ol>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="line-id">LINE User ID</Label>
                            <div className="flex gap-2">
                                <Input
                                    id="line-id"
                                    placeholder="Uxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                                    value={lineUserId}
                                    onChange={(e) => setLineUserId(e.target.value)}
                                    className="font-mono bg-white"
                                />
                            </div>
                            <p className="text-xs text-muted-foreground">
                                รหัสจะขึ้นต้นด้วยตัว U ตามด้วยตัวเลขและตัวอักษร 32 ตัว
                            </p>
                        </div>

                        <Button
                            onClick={handleSaveLineId}
                            disabled={saving}
                            className="w-full bg-green-600 hover:bg-green-700"
                        >
                            {saving ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    กำลังบันทึก...
                                </>
                            ) : (
                                <>
                                    <Save className="w-4 h-4 mr-2" />
                                    บันทึก LINE ID
                                </>
                            )}
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
