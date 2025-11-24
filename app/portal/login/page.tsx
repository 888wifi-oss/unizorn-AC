"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { signInUltraSimple } from "@/lib/supabase/ultra-simple-auth"
import { useToast } from "@/hooks/use-toast"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Loader2, LogIn, Eye, EyeOff, KeyRound } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function PortalLoginPage() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      const result = await signInUltraSimple(username, password)
      if (result.success && result.resident) {
        // Store resident info in localStorage for the portal session
        localStorage.setItem("residentData", JSON.stringify(result.resident))
        toast({
          title: "เข้าสู่ระบบสำเร็จ",
          description: `ยินดีต้อนรับคุณ ${result.resident.resident_name || result.resident.owner_name || `ผู้อาศัยห้อง ${result.resident.unit_number}`}`,
        })
        router.push("/portal/dashboard")
      } else {
        toast({
          title: "เข้าสู่ระบบไม่สำเร็จ",
          description: result.error || "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง",
          variant: "destructive",
        })
      }
    } catch (error: any) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: error.message || "ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }


  return (
    <div className="flex min-h-[70vh] items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto bg-blue-100 dark:bg-blue-900/50 p-3 rounded-full w-fit mb-4">
             <LogIn className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          </div>
          <CardTitle className="text-2xl">Resident Portal</CardTitle>
          <CardDescription>เข้าสู่ระบบสำหรับเจ้าของร่วม/ผู้พักอาศัย</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert className="mb-4">
            <KeyRound className="h-4 w-4" />
            <AlertDescription>
              กรุณาใช้ชื่อผู้ใช้ (Username) และรหัสผ่านที่ตั้งไว้ตอนสร้างบัญชี
            </AlertDescription>
          </Alert>
          
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">ชื่อผู้ใช้ (Username)</Label>
              <Input
                id="username"
                type="text"
                placeholder="เช่น ADD หรือ yourname"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">รหัสผ่าน</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "เข้าสู่ระบบ"}
            </Button>
          </form>
          
          <div className="mt-4 text-center text-sm text-gray-500">
            <p>ยังไม่มีบัญชี? กรุณาติดต่อผู้ดูแลระบบเพื่อขอรหัสเชิญ</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
