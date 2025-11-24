"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { PageHeader } from "@/components/page-header"
import { 
  Settings, 
  Play, 
  Pause, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  RefreshCw,
  Calendar,
  Bell,
  Mail,
  Wrench,
  Package,
  DollarSign,
  BarChart3
} from "lucide-react"
import { 
  getAutomationRules, 
  executeAutomationRule, 
  executeAllAutomationRules
} from "@/lib/supabase/automation-actions"
import { AutomationRule, AutomationExecution } from "@/lib/types/automation"
import { toast } from "@/hooks/use-toast"

const ruleTypeIcons = {
  payment_due: DollarSign,
  maintenance_reminder: Wrench,
  parcel_overdue: Package,
  monthly_report: BarChart3,
  custom: Settings
}

const ruleTypeLabels = {
  payment_due: "ค่าส่วนกลางค้างชำระ",
  maintenance_reminder: "งานซ่อมบำรุงค้าง",
  parcel_overdue: "พัสดุเกินกำหนด",
  monthly_report: "รายงานประจำเดือน",
  custom: "กำหนดเอง"
}

const actionTypeIcons = {
  send_notification: Bell,
  send_email: Mail,
  create_task: Settings,
  update_status: CheckCircle
}

export default function AutomationPage() {
  const [rules, setRules] = useState<AutomationRule[]>([])
  const [executions, setExecutions] = useState<AutomationExecution[]>([])
  const [loading, setLoading] = useState(true)
  const [executing, setExecuting] = useState<string | null>(null)
  const [executingAll, setExecutingAll] = useState(false)

  const loadRules = async () => {
    setLoading(true)
    try {
      const result = await getAutomationRules()
      if (result.success && result.rules) {
        setRules(result.rules)
      } else {
        toast({
          title: "เกิดข้อผิดพลาด",
          description: result.error || "ไม่สามารถโหลดกฎอัตโนมัติได้",
          variant: "destructive",
        })
      }
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

  const handleExecuteRule = async (ruleId: string) => {
    setExecuting(ruleId)
    try {
      const result = await executeAutomationRule(ruleId)
      if (result.success && result.execution) {
        setExecutions(prev => [result.execution!, ...prev])
        toast({
          title: "สำเร็จ",
          description: "ดำเนินการกฎอัตโนมัติเรียบร้อยแล้ว",
        })
      } else {
        toast({
          title: "เกิดข้อผิดพลาด",
          description: result.error || "ไม่สามารถดำเนินการกฎได้",
          variant: "destructive",
        })
      }
    } catch (error: any) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setExecuting(null)
    }
  }

  const handleExecuteAll = async () => {
    setExecutingAll(true)
    try {
      const result = await executeAllAutomationRules()
      if (result.success && result.executions) {
        setExecutions(prev => [...result.executions!, ...prev])
        toast({
          title: "สำเร็จ",
          description: `ดำเนินการกฎอัตโนมัติ ${result.executions.length} กฎเรียบร้อยแล้ว`,
        })
      } else {
        toast({
          title: "เกิดข้อผิดพลาด",
          description: result.error || "ไม่สามารถดำเนินการกฎได้",
          variant: "destructive",
        })
      }
    } catch (error: any) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setExecutingAll(false)
    }
  }

  useEffect(() => {
    loadRules()
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="ระบบอัตโนมัติ"
          subtitle="จัดการกฎการทำงานอัตโนมัติ"
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
        title="ระบบอัตโนมัติ"
        subtitle="จัดการกฎการทำงานอัตโนมัติ"
        action={
          <div className="flex gap-2">
            <Button 
              onClick={handleExecuteAll} 
              disabled={executingAll}
              className="bg-green-600 hover:bg-green-700"
            >
              <Play className={`mr-2 h-4 w-4 ${executingAll ? 'animate-pulse' : ''}`} />
              {executingAll ? 'กำลังดำเนินการ...' : 'ดำเนินการทั้งหมด'}
            </Button>
            <Button variant="outline" onClick={loadRules}>
              <RefreshCw className="mr-2 h-4 w-4" />
              รีเฟรช
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Automation Rules */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">กฎอัตโนมัติ</h3>
          <div className="space-y-4">
            {rules.map((rule) => {
              const IconComponent = ruleTypeIcons[rule.type] || Settings
              const activeRules = rules.filter(r => r.isActive).length
              
              return (
                <Card key={rule.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <IconComponent className="w-5 h-5 text-blue-600" />
                        <CardTitle className="text-base">{rule.name}</CardTitle>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant={rule.isActive ? "default" : "secondary"}>
                          {rule.isActive ? "เปิดใช้งาน" : "ปิดใช้งาน"}
                        </Badge>
                        <Button
                          size="sm"
                          onClick={() => handleExecuteRule(rule.id)}
                          disabled={executing === rule.id}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          <Play className={`w-3 h-3 mr-1 ${executing === rule.id ? 'animate-pulse' : ''}`} />
                          {executing === rule.id ? 'กำลังดำเนินการ...' : 'ทดสอบ'}
                        </Button>
                      </div>
                    </div>
                    <CardDescription className="text-sm">
                      {rule.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <Badge variant="outline" className="text-xs">
                          {ruleTypeLabels[rule.type]}
                        </Badge>
                        {rule.schedule && (
                          <div className="flex items-center space-x-1">
                            <Clock className="w-3 h-3" />
                            <span>
                              {rule.schedule.type === 'daily' && 'ทุกวัน'}
                              {rule.schedule.type === 'weekly' && 'ทุกสัปดาห์'}
                              {rule.schedule.type === 'monthly' && 'ทุกเดือน'}
                              {rule.schedule.type === 'on_event' && 'เมื่อเกิดเหตุการณ์'}
                              {rule.schedule.time && ` เวลา ${rule.schedule.time}`}
                            </span>
                          </div>
                        )}
                      </div>
                      
                      <div className="text-sm text-gray-600">
                        <div className="font-medium mb-1">เงื่อนไข:</div>
                        {rule.conditions.length > 0 ? (
                          <ul className="list-disc list-inside space-y-1">
                            {rule.conditions.map((condition, index) => (
                              <li key={index} className="text-xs">
                                {condition.field} {condition.operator} {condition.value}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <span className="text-xs text-gray-500">ไม่มีเงื่อนไขเฉพาะ</span>
                        )}
                      </div>

                      <div className="text-sm text-gray-600">
                        <div className="font-medium mb-1">การดำเนินการ:</div>
                        <ul className="list-disc list-inside space-y-1">
                          {rule.actions.map((action, index) => {
                            const ActionIcon = actionTypeIcons[action.type] || Settings
                            return (
                              <li key={index} className="text-xs flex items-center space-x-1">
                                <ActionIcon className="w-3 h-3" />
                                <span>{action.message}</span>
                              </li>
                            )
                          })}
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>

        {/* Execution History */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">ประวัติการดำเนินการ</h3>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {executions.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center">
                  <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">ยังไม่มีการดำเนินการกฎอัตโนมัติ</p>
                </CardContent>
              </Card>
            ) : (
              executions.map((execution) => {
                const rule = rules.find(r => r.id === execution.ruleId)
                const StatusIcon = execution.status === 'success' ? CheckCircle : 
                                 execution.status === 'failed' ? XCircle : AlertCircle
                const statusColor = execution.status === 'success' ? 'text-green-600' : 
                                  execution.status === 'failed' ? 'text-red-600' : 'text-yellow-600'
                
                return (
                  <Card key={execution.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-2">
                          <StatusIcon className={`w-4 h-4 ${statusColor}`} />
                          <div>
                            <div className="font-medium text-sm">
                              {rule?.name || 'Unknown Rule'}
                            </div>
                            <div className="text-xs text-gray-500">
                              {new Date(execution.executedAt).toLocaleString('th-TH')}
                            </div>
                          </div>
                        </div>
                        <Badge 
                          variant={execution.status === 'success' ? 'default' : 
                                  execution.status === 'failed' ? 'destructive' : 'secondary'}
                          className="text-xs"
                        >
                          {execution.status === 'success' ? 'สำเร็จ' : 
                           execution.status === 'failed' ? 'ล้มเหลว' : 'กำลังดำเนินการ'}
                        </Badge>
                      </div>
                      
                      {execution.results.length > 0 && (
                        <div className="mt-3 space-y-1">
                          {execution.results.map((result, index) => (
                            <div key={index} className="flex items-center space-x-2 text-xs">
                              {result.success ? (
                                <CheckCircle className="w-3 h-3 text-green-500" />
                              ) : (
                                <XCircle className="w-3 h-3 text-red-500" />
                              )}
                              <span className="text-gray-600">{result.message}</span>
                              {result.target && (
                                <Badge variant="outline" className="text-xs">
                                  {result.target}
                                </Badge>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {execution.error && (
                        <div className="mt-2 p-2 bg-red-50 rounded text-xs text-red-600">
                          {execution.error}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )
              })
            )}
          </div>
        </div>
      </div>

      {/* Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BarChart3 className="w-5 h-5 mr-2" />
            สถิติระบบอัตโนมัติ
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {rules.length}
              </div>
              <div className="text-sm text-gray-600">กฎทั้งหมด</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {rules.filter(r => r.isActive).length}
              </div>
              <div className="text-sm text-gray-600">กฎที่เปิดใช้งาน</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {executions.length}
              </div>
              <div className="text-sm text-gray-600">การดำเนินการทั้งหมด</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {executions.filter(e => e.status === 'success').length}
              </div>
              <div className="text-sm text-gray-600">การดำเนินการสำเร็จ</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
