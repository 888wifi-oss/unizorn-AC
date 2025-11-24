"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { PageHeader } from "@/components/page-header"
import { 
  Upload, 
  Download, 
  FileText, 
  FolderOpen, 
  Search, 
  Filter, 
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Share,
  Tag,
  Calendar,
  User,
  HardDrive,
  BarChart3,
  RefreshCw,
  Plus,
  File,
  Image,
  Video,
  Music,
  Archive
} from "lucide-react"
import { 
  getFiles, 
  getFileCategories, 
  getFileStats,
  deleteFileRecord,
  createFileCategory
} from "@/lib/supabase/file-management-actions"
import { testFileManagementTables, testFileCategoriesData } from "@/lib/supabase/test-file-management"
import { FileItem, FileCategory, FileStats, FileSearchFilters } from "@/lib/types/file-management"
import { toast } from "@/hooks/use-toast"
import { useProjectContext } from "@/lib/contexts/project-context"
import { getCurrentUser } from "@/lib/utils/mock-auth"

// File type icons
const getFileIcon = (mimeType: string) => {
  if (mimeType.startsWith('image/')) return <Image className="w-4 h-4" />
  if (mimeType.startsWith('video/')) return <Video className="w-4 h-4" />
  if (mimeType.startsWith('audio/')) return <Music className="w-4 h-4" />
  if (mimeType.includes('pdf')) return <FileText className="w-4 h-4" />
  if (mimeType.includes('zip') || mimeType.includes('rar')) return <Archive className="w-4 h-4" />
  return <File className="w-4 h-4" />
}

// Format file size
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export default function FileManagementPage() {
  const { selectedProjectId } = useProjectContext()
  const currentUser = getCurrentUser()
  const [files, setFiles] = useState<FileItem[]>([])
  const [categories, setCategories] = useState<FileCategory[]>([])
  const [stats, setStats] = useState<FileStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filters, setFilters] = useState<FileSearchFilters>({})
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false)
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false)
  const [newCategory, setNewCategory] = useState({ name: "", description: "", icon: "File", color: "blue" })
  const [totalFiles, setTotalFiles] = useState(0)
  const [currentPage, setCurrentPage] = useState(0)
  const [pageSize] = useState(20)

  useEffect(() => {
    console.log('[FileManagement] useEffect triggered. selectedProjectId:', selectedProjectId)
    loadData()
  }, [selectedProjectId, filters, currentPage])

  const loadData = async () => {
    setLoading(true)
    try {
      console.log('[FileManagement] Loading files with project_id:', selectedProjectId)
      const [filesResult, categoriesResult, statsResult] = await Promise.all([
        getFiles(filters, pageSize, currentPage * pageSize, selectedProjectId || undefined),
        getFileCategories(),
        getFileStats(selectedProjectId || undefined)
      ])

      if (filesResult.success) {
        setFiles(filesResult.files || [])
        setTotalFiles(filesResult.total || 0)
      } else {
        console.error('Error loading files:', filesResult.error)
        toast({
          title: "เกิดข้อผิดพลาด",
          description: `ไม่สามารถโหลดไฟล์ได้: ${filesResult.error}`,
          variant: "destructive",
        })
      }

      if (categoriesResult.success) {
        setCategories(categoriesResult.categories || [])
      } else {
        console.error('Error loading categories:', categoriesResult.error)
      }

      if (statsResult.success) {
        setStats(statsResult.stats || null)
      } else {
        console.error('Error loading stats:', statsResult.error)
      }
    } catch (error: any) {
      console.error('Exception loading data:', error)
      toast({
        title: "เกิดข้อผิดพลาด",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [filters, currentPage])

  const handleSearch = () => {
    const newFilters: FileSearchFilters = {
      ...filters,
      ...(searchTerm && { uploaded_by: searchTerm })
    }
    setFilters(newFilters)
    setCurrentPage(0)
  }

  const handleCategoryFilter = (categoryId: string) => {
    setSelectedCategory(categoryId)
    const newFilters: FileSearchFilters = {
      ...filters,
      category_id: categoryId === "all" ? undefined : categoryId
    }
    setFilters(newFilters)
    setCurrentPage(0)
  }

  const handleDeleteFile = async (fileId: string) => {
    try {
      const result = await deleteFileRecord(fileId)
      if (result.success) {
        toast({
          title: "ลบไฟล์สำเร็จ",
          description: "ไฟล์ถูกลบออกจากระบบแล้ว",
        })
        loadData()
      } else {
        toast({
          title: "เกิดข้อผิดพลาด",
          description: result.error || "ไม่สามารถลบไฟล์ได้",
          variant: "destructive",
        })
      }
    } catch (error: any) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const handleCreateCategory = async () => {
    try {
      const result = await createFileCategory(newCategory)
      if (result.success) {
        toast({
          title: "สร้างหมวดหมู่สำเร็จ",
          description: "หมวดหมู่ใหม่ถูกสร้างเรียบร้อยแล้ว",
        })
        setNewCategory({ name: "", description: "", icon: "File", color: "blue" })
        setIsCategoryDialogOpen(false)
        loadData()
      } else {
        toast({
          title: "เกิดข้อผิดพลาด",
          description: result.error || "ไม่สามารถสร้างหมวดหมู่ได้",
          variant: "destructive",
        })
      }
    } catch (error: any) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const handleTestTables = async () => {
    setLoading(true)
    try {
      const result = await testFileManagementTables()
      if (result.success && result.results) {
        const failedTables = Object.entries(result.results)
          .filter(([_, result]) => !result.success)
          .map(([table, result]) => `${table}: ${result.error}`)
        
        if (failedTables.length > 0) {
          toast({
            title: "ตารางที่มีปัญหา",
            description: failedTables.join(', '),
            variant: "destructive",
          })
        } else {
          toast({
            title: "ทดสอบสำเร็จ",
            description: "ตารางทั้งหมดพร้อมใช้งาน",
          })
        }
      } else {
        toast({
          title: "เกิดข้อผิดพลาด",
          description: result.error || "ไม่สามารถทดสอบตารางได้",
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

  const handleTestCategories = async () => {
    setLoading(true)
    try {
      const result = await testFileCategoriesData()
      if (result.success) {
        toast({
          title: "ทดสอบหมวดหมู่สำเร็จ",
          description: `พบหมวดหมู่ ${result.count} รายการ`,
        })
      } else {
        toast({
          title: "เกิดข้อผิดพลาด",
          description: result.error || "ไม่สามารถทดสอบหมวดหมู่ได้",
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

  const totalPages = Math.ceil(totalFiles / pageSize)

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="จัดการเอกสารและไฟล์"
          subtitle="ระบบจัดการเอกสารและไฟล์ของคอนโด"
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
        title="จัดการเอกสารและไฟล์"
        subtitle="ระบบจัดการเอกสารและไฟล์ของคอนโด"
        action={
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleTestTables} disabled={loading}>
              <FolderOpen className="mr-2 h-4 w-4" />
              ทดสอบตาราง
            </Button>
            <Button variant="outline" onClick={handleTestCategories} disabled={loading}>
              <FolderOpen className="mr-2 h-4 w-4" />
              ทดสอบหมวดหมู่
            </Button>
            <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Plus className="mr-2 h-4 w-4" />
                  เพิ่มหมวดหมู่
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>เพิ่มหมวดหมู่ใหม่</DialogTitle>
                  <DialogDescription>
                    สร้างหมวดหมู่ใหม่สำหรับจัดกลุ่มไฟล์
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="category-name">ชื่อหมวดหมู่</Label>
                    <Input
                      id="category-name"
                      value={newCategory.name}
                      onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                      placeholder="ชื่อหมวดหมู่"
                    />
                  </div>
                  <div>
                    <Label htmlFor="category-description">คำอธิบาย</Label>
                    <Textarea
                      id="category-description"
                      value={newCategory.description}
                      onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                      placeholder="คำอธิบายหมวดหมู่"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleCreateCategory}>สร้างหมวดหมู่</Button>
                    <Button variant="outline" onClick={() => setIsCategoryDialogOpen(false)}>ยกเลิก</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            <Button onClick={() => setIsUploadDialogOpen(true)}>
              <Upload className="mr-2 h-4 w-4" />
              อัปโหลดไฟล์
            </Button>
            <Button variant="outline" onClick={loadData}>
              <RefreshCw className="mr-2 h-4 w-4" />
              รีเฟรช
            </Button>
          </div>
        }
      />

      <Tabs defaultValue="files" className="space-y-4">
        <TabsList>
          <TabsTrigger value="files">ไฟล์ทั้งหมด</TabsTrigger>
          <TabsTrigger value="categories">หมวดหมู่</TabsTrigger>
          <TabsTrigger value="stats">สถิติ</TabsTrigger>
        </TabsList>

        <TabsContent value="files" className="space-y-4">
          {/* Search and Filters */}
          <Card>
            <CardHeader>
              <CardTitle>ค้นหาและกรองไฟล์</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 items-end">
                <div className="flex-1">
                  <Label htmlFor="search">ค้นหา</Label>
                  <Input
                    id="search"
                    placeholder="ค้นหาตามชื่อผู้อัปโหลด..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  />
                </div>
                <div className="w-48">
                  <Label htmlFor="category-filter">หมวดหมู่</Label>
                  <Select value={selectedCategory} onValueChange={handleCategoryFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="เลือกหมวดหมู่" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">ทั้งหมด</SelectItem>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleSearch}>
                  <Search className="mr-2 h-4 w-4" />
                  ค้นหา
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Files List */}
          <Card>
            <CardHeader>
              <CardTitle>ไฟล์ทั้งหมด ({totalFiles})</CardTitle>
            </CardHeader>
            <CardContent>
              {files.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>ไม่พบไฟล์</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {files.map((file) => (
                    <div key={file.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        {getFileIcon(file.mime_type)}
                        <div>
                          <h4 className="font-medium">{file.original_filename}</h4>
                          <div className="flex items-center space-x-2 text-sm text-gray-500">
                            <span>{formatFileSize(file.file_size)}</span>
                            <span>•</span>
                            <span>{file.category?.name || 'ไม่ระบุหมวดหมู่'}</span>
                            <span>•</span>
                            <span>{file.uploaded_by}</span>
                            <span>•</span>
                            <span>{new Date(file.created_at).toLocaleDateString('th-TH')}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant={file.is_public ? "default" : "secondary"}>
                          {file.is_public ? "สาธารณะ" : "ส่วนตัว"}
                        </Badge>
                        <Button variant="ghost" size="sm">
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Download className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleDeleteFile(file.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center space-x-2 mt-6">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                    disabled={currentPage === 0}
                  >
                    ก่อนหน้า
                  </Button>
                  <span className="text-sm text-gray-500">
                    หน้า {currentPage + 1} จาก {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
                    disabled={currentPage === totalPages - 1}
                  >
                    ถัดไป
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>หมวดหมู่ไฟล์</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {categories.map((category) => (
                  <div key={category.id} className="p-4 border rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <FolderOpen className="w-5 h-5" />
                      <h4 className="font-medium">{category.name}</h4>
                    </div>
                    <p className="text-sm text-gray-500 mb-2">{category.description}</p>
                    <Badge variant="outline">{category.color}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stats" className="space-y-4">
          {stats && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-2">
                      <FileText className="w-8 h-8 text-blue-600" />
                      <div>
                        <p className="text-sm text-gray-500">ไฟล์ทั้งหมด</p>
                        <p className="text-2xl font-bold">{stats.total_files}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-2">
                      <HardDrive className="w-8 h-8 text-green-600" />
                      <div>
                        <p className="text-sm text-gray-500">ขนาดรวม</p>
                        <p className="text-2xl font-bold">{formatFileSize(stats.total_size)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-2">
                      <BarChart3 className="w-8 h-8 text-purple-600" />
                      <div>
                        <p className="text-sm text-gray-500">หมวดหมู่</p>
                        <p className="text-2xl font-bold">{stats.files_by_category.length}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>ไฟล์ตามหมวดหมู่</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {stats.files_by_category.map((item, index) => (
                        <div key={index} className="flex justify-between items-center">
                          <span className="text-sm">{item.category_name}</span>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-gray-500">{item.count} ไฟล์</span>
                            <span className="text-sm text-gray-500">{formatFileSize(item.total_size)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>ไฟล์ตามประเภท</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {stats.files_by_type.slice(0, 10).map((item, index) => (
                        <div key={index} className="flex justify-between items-center">
                          <span className="text-sm">{item.mime_type}</span>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-gray-500">{item.count} ไฟล์</span>
                            <span className="text-sm text-gray-500">{formatFileSize(item.total_size)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
