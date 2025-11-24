// Template for adding project filtering to any module
// Replace [MODULE_NAME] with actual module name

"use client"

import { useState, useEffect } from "react"
// ... other imports
import { useProjectContext } from "@/lib/contexts/project-context"
import { getCurrentUser } from "@/lib/utils/mock-auth"

export default function [MODULE_NAME]Page() {
  const [data, setData] = useState<any[]>([])
  const [allData, setAllData] = useState<any[]>([])  // ✅ เก็บข้อมูลทั้งหมด
  const [loading, setLoading] = useState(true)
  
  // ✅ เพิ่ม Project Context
  const { selectedProjectId, selectedProject } = useProjectContext()
  const currentUser = getCurrentUser()
  
  // ✅ Reload เมื่อเปลี่ยนโครงการ
  useEffect(() => {
    console.log(`[${MODULE_NAME}] useEffect triggered. selectedProjectId:`, selectedProjectId)
    loadData()
  }, [selectedProjectId])  // ✅ Dependency
  
  const loadData = async () => {
    setLoading(true)
    try {
      console.log(`[${MODULE_NAME}] Loading data...`)
      const result = await getData()  // Your existing function
      
      if (result.success) {
        const allItems = result.data || []
        setAllData(allItems)
        console.log(`[${MODULE_NAME}] Total from DB:`, allItems.length)
        
        // ✅ Filter by selected project (for non-Super Admin)
        if (selectedProjectId && currentUser.role !== 'super_admin') {
          const filtered = allItems.filter(item => item.project_id === selectedProjectId)
          console.log(`[${MODULE_NAME}] Filtered:`, allItems.length, '→', filtered.length)
          setData(filtered)
        } else {
          console.log(`[${MODULE_NAME}] No filtering (Super Admin)`)
          setData(allItems)
        }
      }
    } catch (error) {
      console.error(`[${MODULE_NAME}] Load error:`, error)
      // toast error
    } finally {
      setLoading(false)
    }
  }
  
  const handleSave = async () => {
    try {
      console.log(`[${MODULE_NAME}] Saving with project_id:`, selectedProjectId)
      
      // ✅ เพิ่ม project_id เมื่อบันทึก
      await saveData({
        ...formData,
        project_id: selectedProjectId  // ✅ สำคัญ!
      })
      
      await loadData()
      toast({ title: "สำเร็จ" })
    } catch (error) {
      console.error(`[${MODULE_NAME}] Save error:`, error)
      toast({ title: "เกิดข้อผิดพลาด", variant: "destructive" })
    }
  }
  
  return (
    <div>
      <PageHeader 
        title="[MODULE_TITLE]"
        subtitle={selectedProject ? `โครงการ: ${selectedProject.name}` : "[MODULE_SUBTITLE]"}
      />
      {/* ... rest of UI */}
    </div>
  )
}


