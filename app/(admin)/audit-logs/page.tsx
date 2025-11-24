"use client"

import { useEffect, useState } from "react"
import { PageHeader } from "@/components/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { createClient } from "@/lib/supabase/client"
import { useProjectContext } from "@/lib/contexts/project-context"
import { Search } from "lucide-react"

type AuditLog = {
  id: string
  action: string
  entity_type: string
  entity_id: string | null
  user_id: string | null
  project_id: string | null
  ip_address: string | null
  user_agent: string | null
  created_at: string
  old_values: any
  new_values: any
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [search, setSearch] = useState("")
  const { selectedProjectId } = useProjectContext()

  useEffect(() => {
    const supabase = createClient()
    async function load() {
      let q = supabase
        .from('audit_logs')
        .select('id, action, entity_type, entity_id, user_id, project_id, ip_address, user_agent, created_at, old_values, new_values')
        .order('created_at', { ascending: false })
        .limit(200)
      if (selectedProjectId) q = q.eq('project_id', selectedProjectId)
      const { data } = await q
      setLogs((data || []) as AuditLog[])
    }
    load()
  }, [selectedProjectId])

  const filtered = logs.filter(l => {
    const s = search.toLowerCase()
    return (
      l.action?.toLowerCase().includes(s) ||
      l.entity_type?.toLowerCase().includes(s) ||
      (l.entity_id || '').toLowerCase().includes(s) ||
      (l.user_id || '').toLowerCase().includes(s)
    )
  })

  return (
    <div>
      <PageHeader
        title="Audit Log"
        subtitle="ติดตามกิจกรรมและการเปลี่ยนแปลงข้อมูลภายในระบบ"
      />

      <Card className="mb-4">
        <CardHeader>
          <CardTitle>ค้นหา</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input placeholder="ค้นหาตาม action, entity หรือผู้ใช้" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>รายการ Audit ({filtered.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>วันที่/เวลา</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Entity</TableHead>
                <TableHead>ผู้ใช้</TableHead>
                <TableHead>รายละเอียด</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((l) => (
                <TableRow key={l.id}>
                  <TableCell className="whitespace-nowrap">{new Date(l.created_at).toLocaleString()}</TableCell>
                  <TableCell>{l.action}</TableCell>
                  <TableCell>{l.entity_type}{l.entity_id ? `#${l.entity_id}` : ''}</TableCell>
                  <TableCell>{l.user_id || '-'}</TableCell>
                  <TableCell>
                    <div className="text-xs text-gray-600">
                      <div>IP: {l.ip_address || '-'}</div>
                      <div className="truncate max-w-[540px]">New: {JSON.stringify(l.new_values || {})}</div>
                      {l.old_values ? (
                        <div className="truncate max-w-[540px]">Old: {JSON.stringify(l.old_values)}</div>
                      ) : null}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

