"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Eye, EyeOff, Home, User, Key, Mail, AlertCircle, CheckCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { verifyInvitationCode, createAccountFromInvitation } from "@/lib/actions/invitation-actions"

export default function RegisterPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  
  const [code, setCode] = useState("")
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [email, setEmail] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [unitInfo, setUnitInfo] = useState<any>(null)
  
  useEffect(() => {
    const codeParam = searchParams.get('code')
    if (codeParam) {
      setCode(codeParam)
      verifyCode(codeParam)
    }
  }, [searchParams])
  
  const verifyCode = async (invitationCode: string) => {
    setVerifying(true)
    try {
      const result = await verifyInvitationCode(invitationCode)
      if (result.success) {
        setUnitInfo(result.unit)
        setEmail(result.unit.owner_email || "")
      } else {
        toast({
          title: "รหัสเชิญไม่ถูกต้อง",
          description: result.error,
          variant: "destructive"
        })
      }
    } catch (error: any) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: error.message,
        variant: "destructive"
      })
    } finally {
      setVerifying(false)
    }
  }
  
  const handleVerifyCode = async () => {
    if (!code) {
      toast({
        title: "กรุณากรอกรหัสเชิญ",
        variant: "destructive"
      })
      return
    }
    await verifyCode(code)
  }
  
  const handleRegister = async () => {
    if (!username || !password || !confirmPassword) {
      toast({
        title: "กรุณากรอกข้อมูลให้ครบถ้วน",
        variant: "destructive"
      })
      return
    }
    
    if (password !== confirmPassword) {
      toast({
        title: "รหัสผ่านไม่ตรงกัน",
        variant: "destructive"
      })
      return
    }
    
    if (password.length < 6) {
      toast({
        title: "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร",
        variant: "destructive"
      })
      return
    }
    
    setLoading(true)
    try {
      const result = await createAccountFromInvitation(code, username, password, email)
      
      if (result.success) {
        toast({
          title: "สร้างบัญชีสำเร็จ",
          description: "คุณสามารถเข้าสู่ระบบได้ทันที",
        })
        
        // Redirect to login after 2 seconds
        setTimeout(() => {
          router.push('/portal/login')
        }, 2000)
      } else {
        toast({
          title: "เกิดข้อผิดพลาด",
          description: result.error,
          variant: "destructive"
        })
      }
    } catch (error: any) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: error.message,
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <PageHeader
          title="สร้างบัญชีผู้ใช้"
          subtitle="กรุณากรอกรหัสเชิญเพื่อสร้างบัญชีของคุณ"
        />
        
        <Card>
          <CardHeader>
            <CardTitle>ลงทะเบียนเข้าระบบ</CardTitle>
            <CardDescription>
              กรุณากรอกรหัสเชิญที่ได้รับจากผู้ดูแลระบบ
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!unitInfo ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="code">รหัสเชิญ</Label>
                  <div className="flex gap-2">
                    <Input
                      id="code"
                      placeholder="กรุณากรอกรหัสเชิญ"
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      disabled={verifying}
                    />
                    <Button 
                      onClick={handleVerifyCode}
                      disabled={verifying || !code}
                    >
                      {verifying ? "กำลังตรวจสอบ..." : "ตรวจสอบ"}
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <>
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    รหัสเชิญถูกต้อง: ห้องชุด {unitInfo.unit_number}
                  </AlertDescription>
                </Alert>
                
                <div className="space-y-2">
                  <Label htmlFor="unit-info">ข้อมูลห้องชุด</Label>
                  <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-md">
                    <Home className="w-5 h-5 text-gray-500" />
                    <div>
                      <div className="font-medium">{unitInfo.owner_name}</div>
                      <div className="text-sm text-gray-500">ห้อง {unitInfo.unit_number}</div>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="username">ชื่อผู้ใช้ (Username) *</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      id="username"
                      placeholder="ตั้งชื่อผู้ใช้ของคุณ"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">อีเมล (สำหรับรีเซ็ตรหัสผ่าน)</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="email@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <p className="text-xs text-gray-500">
                    อีเมลนี้จะใช้สำหรับรีเซ็ตรหัสผ่านเท่านั้น ไม่ได้ใช้เข้าสู่ระบบ
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password">รหัสผ่าน *</Label>
                  <div className="relative">
                    <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="กรุณากรอกรหัสผ่าน"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">ยืนยันรหัสผ่าน *</Label>
                  <div className="relative">
                    <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="กรุณากรอกรหัสผ่านอีกครั้ง"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="pl-10 pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
                
                <Button 
                  onClick={handleRegister}
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? "กำลังสร้างบัญชี..." : "สร้างบัญชี"}
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}




















