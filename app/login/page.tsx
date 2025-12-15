"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getCurrentUser, loginUser as saveLoginUser, logoutUser } from "@/lib/utils/mock-auth"
import { getLoginUsers, loginUser as dbLoginUser } from "@/lib/actions/auth-actions"
import { LogIn, User, Building2, Eye, EyeOff, Loader2 } from "lucide-react"
import { toast } from "@/hooks/use-toast"

export default function LoginPage() {
  const router = useRouter()
  const [users, setUsers] = useState<any[]>([])
  const [selectedUserId, setSelectedUserId] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [loadingUsers, setLoadingUsers] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentUser, setCurrentUser] = useState<any>(null)

  useEffect(() => {
    setCurrentUser(getCurrentUser())
  }, [])

  const isLoggedIn = currentUser && currentUser.id !== "guest"

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    setLoadingUsers(true)
    setError(null)
    const result = await getLoginUsers()
    if (result.success) {
      setUsers(result.users || [])
    } else {
      setError(result.error || "Failed to load users")
    }
    setLoadingUsers(false)
  }

  // Login with email/password
  const handleLoginWithPassword = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email || !password) {
      toast({
        title: "กรุณากรอกข้อมูล",
        description: "โปรดกรอก Email และรหัสผ่าน",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    const result = await dbLoginUser(email, password)

    if (result.success && result.user) {
      toast({
        title: "เข้าสู่ระบบสำเร็จ",
        description: `ยินดีต้อนรับ ${result.user.full_name}`,
      })

      // Save user และ redirect
      saveLoginUser(result.user)

      // ✅ Redirect ทันทีหลัง login
      setTimeout(() => {
        router.push('/dashboard')
        router.refresh()
      }, 500)
    } else {
      toast({
        title: "เข้าสู่ระบบไม่สำเร็จ",
        description: result.error || "กรุณาตรวจสอบ Email และรหัสผ่าน",
        variant: "destructive",
      })
      setLoading(false)
    }
  }

  // Quick login
  const handleQuickLogin = () => {
    if (!selectedUserId) {
      toast({
        title: "กรุณาเลือกผู้ใช้",
        description: "โปรดเลือกผู้ใช้ที่ต้องการเข้าสู่ระบบ",
        variant: "destructive",
      })
      return
    }

    const user = users.find(u => u.id === selectedUserId)
    if (!user) return

    toast({
      title: "เข้าสู่ระบบสำเร็จ",
      description: `ยินดีต้อนรับ ${user.full_name}`,
    })

    saveLoginUser(user)

    // ✅ Redirect ทันทีหลัง quick login
    setTimeout(() => {
      router.push('/dashboard')
      router.refresh()
    }, 500)
  }

  const handleLogout = () => {
    logoutUser()
  }

  const getRoleIcon = (role: string) => {
    const icons: Record<string, string> = {
      super_admin: '👑',
      company_admin: '👔',
      project_admin: '🏢',
      staff: '👤',
      engineer: '🔧',
      resident: '🏠'
    }
    return icons[role] || '👤'
  }

  const getRoleColor = (role: string) => {
    const colors: Record<string, string> = {
      super_admin: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      company_admin: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      project_admin: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      staff: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      engineer: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
      resident: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    }
    return colors[role] || colors.resident
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <Card className="w-full max-w-lg shadow-2xl">
        <CardHeader className="text-center pb-6">
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-primary/10 rounded-full">
              <Building2 className="h-12 w-12 text-primary" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold">Unizorn</CardTitle>
          <CardDescription className="text-base mt-2">
            {isLoggedIn ? (
              <>เข้าสู่ระบบในนาม <span className="font-semibold">{currentUser.full_name}</span></>
            ) : (
              'Smart Living Management'
            )}
          </CardDescription>
        </CardHeader>

        <CardContent>
          {isLoggedIn ? (
            // Logged In State
            <div className="space-y-4">
              <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-700 rounded-lg border-2 border-blue-200 dark:border-gray-600">
                <div className="flex items-start space-x-3">
                  <div className="text-3xl">{getRoleIcon(currentUser.role)}</div>
                  <div className="flex-1">
                    <h3 className="font-semibold mb-1">{currentUser.full_name}</h3>
                    <p className="text-xs text-muted-foreground mb-2">📧 {currentUser.email}</p>
                    <Badge className={getRoleColor(currentUser.role)}>
                      {currentUser.roleDisplay}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={() => router.push('/companies')} className="flex-1">
                  เข้าสู่ระบบ
                </Button>
                <Button onClick={handleLogout} variant="outline" className="flex-1">
                  ออกจากระบบ
                </Button>
              </div>
            </div>
          ) : (
            // Login Form
            <Tabs defaultValue="password" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="password">Login</TabsTrigger>
                <TabsTrigger value="quick">Quick Select (Dev)</TabsTrigger>
              </TabsList>

              {/* Login with Password */}
              <TabsContent value="password" className="space-y-4">
                <form onSubmit={handleLoginWithPassword} className="space-y-4">
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="your@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={loading}
                    />
                  </div>

                  <div>
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={loading}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>

                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        กำลังเข้าสู่ระบบ...
                      </>
                    ) : (
                      <>
                        <LogIn className="mr-2 h-4 w-4" />
                        เข้าสู่ระบบ
                      </>
                    )}
                  </Button>
                </form>

                <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <p className="text-xs text-blue-900 dark:text-blue-200">
                    💡 <strong>ทดสอบระบบ:</strong> ใช้ Email ของผู้ใช้ในระบบและรหัสผ่านที่กำหนดไว้
                  </p>
                </div>
              </TabsContent>

              {/* Quick Select (Dev Mode) */}
              <TabsContent value="quick" className="space-y-4">
                {loadingUsers ? (
                  <div className="text-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                    <p className="text-sm text-muted-foreground mt-2">กำลังโหลดผู้ใช้...</p>
                  </div>
                ) : error ? (
                  <div className="p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg text-center">
                    <p className="text-sm text-red-800 dark:text-red-200 font-medium mb-2">เกิดข้อผิดพลาดในการโหลดข้อมูล</p>
                    <p className="text-xs text-red-600 dark:text-red-300">{error}</p>
                    <Button variant="outline" size="sm" onClick={loadUsers} className="mt-3">
                      ลองใหม่
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="max-h-[400px] overflow-y-auto space-y-2">
                      {users.map((user) => (
                        <Card
                          key={user.id}
                          className={`cursor-pointer transition-all hover:shadow-md ${selectedUserId === user.id ? 'ring-2 ring-primary bg-primary/5' : ''
                            }`}
                          onClick={() => setSelectedUserId(user.id)}
                        >
                          <CardContent className="p-3">
                            <div className="flex items-start space-x-3">
                              <div className="text-2xl">{getRoleIcon(user.role)}</div>
                              <div className="flex-1 min-w-0">
                                <h4 className="font-semibold text-sm truncate">{user.full_name}</h4>
                                <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                                <Badge className={`${getRoleColor(user.role)} text-xs mt-1`}>
                                  {user.roleDisplay}
                                </Badge>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>

                    <Button onClick={handleQuickLogin} disabled={!selectedUserId} className="w-full">
                      <User className="mr-2 h-4 w-4" />
                      เข้าสู่ระบบด่วน
                    </Button>

                    <div className="p-3 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg">
                      <p className="text-xs text-amber-900 dark:text-amber-200">
                        ⚠️ <strong>โหมด Dev:</strong> สำหรับทดสอบเท่านั้น ข้ามการตรวจสอบรหัสผ่าน
                      </p>
                    </div>
                  </>
                )}
              </TabsContent>
            </Tabs>
          )}
        </CardContent>

        {/* Footer */}
        {!isLoggedIn && (
          <div className="px-6 pb-6">
            <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
              <p className="text-xs text-blue-900 dark:text-blue-200">
                🔒 <strong>ระบบ Authentication:</strong> ใช้ Email/Password จากฐานข้อมูล (ยังไม่เข้ารหัส)
              </p>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}
