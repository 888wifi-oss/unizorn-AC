"use client"

import { useState, useEffect } from "react"
import { useProjectContext } from "@/lib/contexts/project-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Building2, AlertCircle, Loader2 } from "lucide-react"
import { getCurrentUser } from "@/lib/utils/mock-auth"

export function ProjectSelector() {
  const [mounted, setMounted] = useState(false)
  
  const { 
    selectedProjectId, 
    selectedProject,
    availableProjects, 
    setSelectedProjectId, 
    loading 
  } = useProjectContext()
  
  const currentUser = getCurrentUser()
  
  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])
  
  if (!mounted) {
    return null
  }

  // Super Admin doesn't need to select project (sees everything)
  if (currentUser.role === 'super_admin') {
    return null
  }

  if (loading) {
    return (
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
            <p className="text-sm text-muted-foreground mt-2">กำลังโหลดโครงการ...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // No projects available
  if (availableProjects.length === 0) {
    return (
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
        <Card className="w-full max-w-md border-amber-200 dark:border-amber-800">
          <CardHeader>
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-amber-100 dark:bg-amber-900 rounded-full">
                <AlertCircle className="h-8 w-8 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
            <CardTitle className="text-center">ไม่มีโครงการที่เข้าถึงได้</CardTitle>
            <CardDescription className="text-center">
              คุณยังไม่ได้รับมอบหมายให้ดูแลโครงการใด กรุณาติดต่อ Super Admin
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  // If project already selected, don't show modal
  if (selectedProjectId) {
    return null
  }

  // Show project selector modal
  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl shadow-2xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-primary/10 rounded-full">
              <Building2 className="h-12 w-12 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl">เลือกโครงการที่ต้องการจัดการ</CardTitle>
          <CardDescription className="text-base mt-2">
            ยินดีต้อนรับ <span className="font-semibold">{currentUser.full_name}</span>
            <br />
            <Badge className="mt-2">{currentUser.roleDisplay}</Badge>
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground mb-3 text-center">
              เลือกโครงการเพื่อเข้าสู่ระบบจัดการ ({availableProjects.length} โครงการ)
            </p>
            
            {/* Project Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[400px] overflow-y-auto p-1">
              {availableProjects.map((project) => (
                <Card
                  key={project.id}
                  className="cursor-pointer transition-all hover:shadow-md hover:border-primary/50"
                  onClick={() => setSelectedProjectId(project.id)}
                >
                  <CardContent className="p-4">
                    <div className="space-y-2">
                      <h3 className="font-semibold text-base">{project.name}</h3>
                      <div className="text-xs text-muted-foreground space-y-1">
                        {project.company?.name && (
                          <p className="flex items-center gap-1">
                            <Building2 className="w-3 h-3" />
                            {project.company.name}
                          </p>
                        )}
                        <p>ประเภท: {project.project_type}</p>
                        <p>จำนวนยูนิต: {project.total_units} ยูนิต</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Info */}
          <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
            <p className="text-xs text-blue-900 dark:text-blue-200">
              💡 <strong>หมายเหตุ:</strong> ข้อมูลทั้งหมดในระบบจะถูกกรองตามโครงการที่คุณเลือก 
              คุณสามารถเปลี่ยนโครงการได้ทุกเมื่อจาก Sidebar ด้านบน
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

