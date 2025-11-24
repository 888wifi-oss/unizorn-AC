"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { PageHeader } from "@/components/page-header"
import { 
  Key, 
  Plus, 
  Eye, 
  EyeOff, 
  Copy, 
  Trash2, 
  RefreshCw,
  Activity,
  Clock,
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle
} from "lucide-react"
import { toast } from "@/hooks/use-toast"

interface ApiKey {
  id: string
  name: string
  key: string
  permissions: string[]
  expires_at?: string
  is_active: boolean
  created_at: string
  last_used_at?: string
}

interface ApiUsage {
  endpoint: string
  method: string
  requests: number
  avgResponseTime: number
  errorRate: number
}

export default function ApiManagementPage() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([])
  const [usage, setUsage] = useState<ApiUsage[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [newApiKey, setNewApiKey] = useState({
    name: "",
    permissions: [] as string[],
    expiresAt: ""
  })
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set())

  const availablePermissions = [
    { id: "units:read", label: "อ่านข้อมูลห้องชุด", category: "Units" },
    { id: "units:write", label: "เขียนข้อมูลห้องชุด", category: "Units" },
    { id: "units:delete", label: "ลบข้อมูลห้องชุด", category: "Units" },
    { id: "bills:read", label: "อ่านข้อมูลบิล", category: "Bills" },
    { id: "bills:write", label: "เขียนข้อมูลบิล", category: "Bills" },
    { id: "bills:delete", label: "ลบข้อมูลบิล", category: "Bills" },
    { id: "files:read", label: "อ่านข้อมูลไฟล์", category: "Files" },
    { id: "files:write", label: "เขียนข้อมูลไฟล์", category: "Files" },
    { id: "files:delete", label: "ลบข้อมูลไฟล์", category: "Files" },
    { id: "maintenance:read", label: "อ่านข้อมูลงานแจ้งซ่อม", category: "Maintenance" },
    { id: "maintenance:write", label: "เขียนข้อมูลงานแจ้งซ่อม", category: "Maintenance" },
    { id: "maintenance:delete", label: "ลบข้อมูลงานแจ้งซ่อม", category: "Maintenance" },
    { id: "parcels:read", label: "อ่านข้อมูลพัสดุ", category: "Parcels" },
    { id: "parcels:write", label: "เขียนข้อมูลพัสดุ", category: "Parcels" },
    { id: "parcels:delete", label: "ลบข้อมูลพัสดุ", category: "Parcels" },
    { id: "admin", label: "สิทธิ์ผู้ดูแลระบบ", category: "Admin" }
  ]

  const loadApiKeys = async () => {
    setLoading(true)
    try {
      // Mock data for now - replace with actual API call
      const mockApiKeys: ApiKey[] = [
        {
          id: "1",
          name: "Test API Key",
          key: "sk_test_1234567890abcdef1234567890abcdef",
          permissions: ["units:read", "units:write", "bills:read", "bills:write"],
          is_active: true,
          created_at: "2024-01-01T00:00:00.000Z",
          last_used_at: "2024-01-15T10:30:00.000Z"
        },
        {
          id: "2",
          name: "Admin API Key",
          key: "sk_admin_abcdef1234567890abcdef1234567890",
          permissions: ["admin"],
          is_active: true,
          created_at: "2024-01-01T00:00:00.000Z",
          last_used_at: "2024-01-15T12:45:00.000Z"
        }
      ]
      setApiKeys(mockApiKeys)
    } catch (error: any) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const loadUsage = async () => {
    try {
      // Mock data for now - replace with actual API call
      const mockUsage: ApiUsage[] = [
        {
          endpoint: "/api/v1/units",
          method: "GET",
          requests: 1250,
          avgResponseTime: 45,
          errorRate: 0.02
        },
        {
          endpoint: "/api/v1/bills",
          method: "GET",
          requests: 890,
          avgResponseTime: 52,
          errorRate: 0.01
        },
        {
          endpoint: "/api/v1/files",
          method: "POST",
          requests: 156,
          avgResponseTime: 1200,
          errorRate: 0.05
        }
      ]
      setUsage(mockUsage)
    } catch (error: any) {
      console.error("Error loading usage:", error)
    }
  }

  useEffect(() => {
    loadApiKeys()
    loadUsage()
  }, [])

  const handleCreateApiKey = async () => {
    try {
      if (!newApiKey.name || newApiKey.permissions.length === 0) {
        toast({
          title: "ข้อมูลไม่ครบถ้วน",
          description: "กรุณากรอกชื่อและเลือกสิทธิ์",
          variant: "destructive",
        })
        return
      }

      // Mock API call - replace with actual implementation
      const newKey: ApiKey = {
        id: Date.now().toString(),
        name: newApiKey.name,
        key: `sk_${crypto.randomUUID().replace(/-/g, '')}`,
        permissions: newApiKey.permissions,
        expires_at: newApiKey.expiresAt || undefined,
        is_active: true,
        created_at: new Date().toISOString()
      }

      setApiKeys([...apiKeys, newKey])
      setNewApiKey({ name: "", permissions: [], expiresAt: "" })
      setIsCreateDialogOpen(false)

      toast({
        title: "สร้าง API Key สำเร็จ",
        description: "API Key ใหม่ถูกสร้างเรียบร้อยแล้ว",
      })
    } catch (error: any) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const handleTogglePermission = (permissionId: string) => {
    setNewApiKey(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permissionId)
        ? prev.permissions.filter(p => p !== permissionId)
        : [...prev.permissions, permissionId]
    }))
  }

  const handleCopyKey = (key: string) => {
    navigator.clipboard.writeText(key)
    toast({
      title: "คัดลอกสำเร็จ",
      description: "API Key ถูกคัดลอกไปยังคลิปบอร์ดแล้ว",
    })
  }

  const handleToggleVisibility = (keyId: string) => {
    setVisibleKeys(prev => {
      const newSet = new Set(prev)
      if (newSet.has(keyId)) {
        newSet.delete(keyId)
      } else {
        newSet.add(keyId)
      }
      return newSet
    })
  }

  const formatKey = (key: string, isVisible: boolean) => {
    if (isVisible) {
      return key
    }
    return `${key.substring(0, 8)}...${key.substring(key.length - 8)}`
  }

  const getPermissionBadgeColor = (permission: string) => {
    if (permission.includes('admin')) return 'bg-red-100 text-red-800'
    if (permission.includes('delete')) return 'bg-orange-100 text-orange-800'
    if (permission.includes('write')) return 'bg-blue-100 text-blue-800'
    return 'bg-green-100 text-green-800'
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="จัดการ API"
          subtitle="ระบบจัดการ API Keys และการใช้งาน"
        />
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center space-x-2">
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span>กำลังโหลดข้อมูล...</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="จัดการ API"
        subtitle="ระบบจัดการ API Keys และการใช้งาน"
        action={
          <div className="flex gap-2">
            <Button variant="outline" onClick={loadApiKeys}>
              <RefreshCw className="mr-2 h-4 w-4" />
              รีเฟรช
            </Button>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  สร้าง API Key
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>สร้าง API Key ใหม่</DialogTitle>
                  <DialogDescription>
                    สร้าง API Key สำหรับการเข้าถึง API
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="key-name">ชื่อ API Key</Label>
                    <Input
                      id="key-name"
                      value={newApiKey.name}
                      onChange={(e) => setNewApiKey({ ...newApiKey, name: e.target.value })}
                      placeholder="ชื่อ API Key"
                    />
                  </div>
                  
                  <div>
                    <Label>สิทธิ์การเข้าถึง</Label>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {availablePermissions.map((permission) => (
                        <div key={permission.id} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id={permission.id}
                            checked={newApiKey.permissions.includes(permission.id)}
                            onChange={() => handleTogglePermission(permission.id)}
                            className="rounded"
                          />
                          <label htmlFor={permission.id} className="text-sm">
                            {permission.label}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="expires-at">วันหมดอายุ (ไม่บังคับ)</Label>
                    <Input
                      id="expires-at"
                      type="datetime-local"
                      value={newApiKey.expiresAt}
                      onChange={(e) => setNewApiKey({ ...newApiKey, expiresAt: e.target.value })}
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button onClick={handleCreateApiKey}>สร้าง API Key</Button>
                    <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>ยกเลิก</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        }
      />

      <Tabs defaultValue="keys" className="space-y-4">
        <TabsList>
          <TabsTrigger value="keys">API Keys</TabsTrigger>
          <TabsTrigger value="usage">การใช้งาน</TabsTrigger>
          <TabsTrigger value="documentation">เอกสาร API</TabsTrigger>
        </TabsList>

        <TabsContent value="keys" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>API Keys</CardTitle>
              <CardDescription>
                จัดการ API Keys สำหรับการเข้าถึง API
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {apiKeys.map((apiKey) => (
                  <div key={apiKey.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <Key className="w-5 h-5" />
                        <h4 className="font-medium">{apiKey.name}</h4>
                        <Badge variant={apiKey.is_active ? "default" : "secondary"}>
                          {apiKey.is_active ? "ใช้งาน" : "ไม่ใช้งาน"}
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleVisibility(apiKey.id)}
                        >
                          {visibleKeys.has(apiKey.id) ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCopyKey(apiKey.key)}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="mb-2">
                      <code className="bg-gray-100 px-2 py-1 rounded text-sm">
                        {formatKey(apiKey.key, visibleKeys.has(apiKey.id))}
                      </code>
                    </div>

                    <div className="mb-2">
                      <div className="flex flex-wrap gap-1">
                        {apiKey.permissions.map((permission) => (
                          <Badge key={permission} className={getPermissionBadgeColor(permission)}>
                            {permission}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="text-sm text-gray-500">
                      <div>สร้างเมื่อ: {new Date(apiKey.created_at).toLocaleDateString('th-TH')}</div>
                      {apiKey.last_used_at && (
                        <div>ใช้งานล่าสุด: {new Date(apiKey.last_used_at).toLocaleDateString('th-TH')}</div>
                      )}
                      {apiKey.expires_at && (
                        <div>หมดอายุ: {new Date(apiKey.expires_at).toLocaleDateString('th-TH')}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="usage" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>สถิติการใช้งาน API</CardTitle>
              <CardDescription>
                ข้อมูลการใช้งาน API endpoints
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {usage.map((item, index) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <Activity className="w-5 h-5" />
                        <code className="text-sm">{item.method} {item.endpoint}</code>
                      </div>
                      <Badge variant={item.errorRate < 0.05 ? "default" : "destructive"}>
                        {item.errorRate < 0.05 ? "ปกติ" : "มีปัญหา"}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <div className="text-gray-500">จำนวนคำขอ</div>
                        <div className="font-medium">{item.requests.toLocaleString()}</div>
                      </div>
                      <div>
                        <div className="text-gray-500">เวลาตอบสนองเฉลี่ย</div>
                        <div className="font-medium">{item.avgResponseTime}ms</div>
                      </div>
                      <div>
                        <div className="text-gray-500">อัตราข้อผิดพลาด</div>
                        <div className="font-medium">{(item.errorRate * 100).toFixed(2)}%</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documentation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>เอกสาร API</CardTitle>
              <CardDescription>
                คู่มือการใช้งาน API
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-medium mb-2">Base URL</h4>
                  <code className="text-sm">https://your-domain.com/api/v1</code>
                </div>

                <div className="p-4 bg-green-50 rounded-lg">
                  <h4 className="font-medium mb-2">Authentication</h4>
                  <p className="text-sm mb-2">ใช้ API Key ใน header:</p>
                  <code className="text-sm">X-API-Key: sk_your_api_key_here</code>
                </div>

                <div className="p-4 bg-yellow-50 rounded-lg">
                  <h4 className="font-medium mb-2">Rate Limiting</h4>
                  <ul className="text-sm space-y-1">
                    <li>• Default: 100 requests per hour</li>
                    <li>• Auth endpoints: 10 requests per hour</li>
                    <li>• Upload endpoints: 20 requests per hour</li>
                    <li>• Admin endpoints: 1000 requests per hour</li>
                  </ul>
                </div>

                <div className="p-4 bg-purple-50 rounded-lg">
                  <h4 className="font-medium mb-2">ตัวอย่างการใช้งาน</h4>
                  <pre className="text-sm bg-white p-2 rounded border overflow-x-auto">
{`// Get all units
fetch('/api/v1/units?page=1&limit=10', {
  headers: {
    'X-API-Key': 'sk_your_api_key_here',
    'Content-Type': 'application/json'
  }
})`}
                  </pre>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline">
                    <Shield className="mr-2 h-4 w-4" />
                    ดูเอกสารเต็ม
                  </Button>
                  <Button variant="outline">
                    <Copy className="mr-2 h-4 w-4" />
                    คัดลอกตัวอย่าง
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
