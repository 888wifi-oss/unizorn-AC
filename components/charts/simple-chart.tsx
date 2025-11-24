// components/charts/simple-chart.tsx
"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { RefreshCw, Download, TrendingUp, TrendingDown } from "lucide-react"

interface ChartData {
  label: string
  value: number
  [key: string]: any
}

interface SimpleChartProps {
  title: string
  description: string
  data: ChartData[]
  loading?: boolean
  error?: string
  chartType?: 'line' | 'bar' | 'doughnut' | 'pie'
  onRefresh?: () => void
  onExport?: () => void
}

export function SimpleChart({
  title,
  description,
  data,
  loading = false,
  error,
  chartType = 'bar',
  onRefresh,
  onExport
}: SimpleChartProps) {
  const getChartHeight = () => {
    switch (chartType) {
      case 'line':
        return 300
      case 'bar':
        return 300
      case 'doughnut':
        return 250
      case 'pie':
        return 250
      default:
        return 300
    }
  }

  const renderLineChart = () => {
    if (!data.length) return <div className="text-center text-muted-foreground">ไม่มีข้อมูล</div>
    
    const maxValue = Math.max(...data.map(d => d.value))
    const minValue = Math.min(...data.map(d => d.value))
    const range = maxValue - minValue
    
    return (
      <div className="w-full h-full flex items-end justify-between px-4 py-4">
        {data.map((item, index) => {
          const height = range > 0 ? ((item.value - minValue) / range) * 200 : 100
          return (
            <div key={index} className="flex flex-col items-center gap-2">
              <div className="w-8 bg-blue-500 rounded-t" style={{ height: `${height}px` }} />
              <div className="text-xs text-muted-foreground">{item.label}</div>
              <div className="text-xs font-medium">{item.value.toLocaleString()}</div>
            </div>
          )
        })}
      </div>
    )
  }

  const renderBarChart = () => {
    if (!data.length) return <div className="text-center text-muted-foreground">ไม่มีข้อมูล</div>
    
    const maxValue = Math.max(...data.map(d => d.value))
    
    return (
      <div className="w-full h-full flex items-end justify-between px-4 py-4">
        {data.map((item, index) => {
          const height = maxValue > 0 ? (item.value / maxValue) * 200 : 0
          return (
            <div key={index} className="flex flex-col items-center gap-2">
              <div className="w-8 bg-green-500 rounded-t" style={{ height: `${height}px` }} />
              <div className="text-xs text-muted-foreground">{item.label}</div>
              <div className="text-xs font-medium">{item.value.toLocaleString()}</div>
            </div>
          )
        })}
      </div>
    )
  }

  const renderDoughnutChart = () => {
    if (!data.length) return <div className="text-center text-muted-foreground">ไม่มีข้อมูล</div>
    
    const total = data.reduce((sum, item) => sum + item.value, 0)
    const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6']
    
    let currentAngle = 0
    
    return (
      <div className="flex items-center justify-center h-full">
        <div className="relative w-48 h-48">
          <svg width="192" height="192" className="transform -rotate-90">
            {data.map((item, index) => {
              const percentage = (item.value / total) * 100
              const angle = (percentage / 100) * 360
              const radius = 80
              const circumference = 2 * Math.PI * radius
              const strokeDasharray = `${(angle / 360) * circumference} ${circumference}`
              
              const startAngle = currentAngle
              currentAngle += angle
              
              return (
                <circle
                  key={index}
                  cx="96"
                  cy="96"
                  r={radius}
                  fill="none"
                  stroke={colors[index % colors.length]}
                  strokeWidth="20"
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={-((startAngle / 360) * circumference)}
                />
              )
            })}
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-2xl font-bold">{total.toLocaleString()}</div>
              <div className="text-sm text-muted-foreground">ทั้งหมด</div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const renderPieChart = () => {
    return renderDoughnutChart() // Same as doughnut for simplicity
  }

  const renderChart = () => {
    switch (chartType) {
      case 'line':
        return renderLineChart()
      case 'bar':
        return renderBarChart()
      case 'doughnut':
        return renderDoughnutChart()
      case 'pie':
        return renderPieChart()
      default:
        return renderBarChart()
    }
  }

  const renderLegend = () => {
    if (chartType === 'doughnut' || chartType === 'pie') {
      const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6']
      const total = data.reduce((sum, item) => sum + item.value, 0)
      
      return (
        <div className="flex flex-wrap gap-2 justify-center mt-4">
          {data.map((item, index) => {
            const percentage = ((item.value / total) * 100).toFixed(1)
            return (
              <div key={index} className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: colors[index % colors.length] }}
                />
                <span className="text-sm">{item.label}: {percentage}%</span>
              </div>
            )
          })}
        </div>
      )
    }
    return null
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              {chartType === 'line' && <TrendingUp className="w-5 h-5" />}
              {chartType === 'bar' && <TrendingDown className="w-5 h-5" />}
              {chartType === 'doughnut' && <TrendingUp className="w-5 h-5" />}
              {chartType === 'pie' && <TrendingUp className="w-5 h-5" />}
              {title}
            </CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {onRefresh && (
              <Button
                variant="outline"
                size="sm"
                onClick={onRefresh}
                disabled={loading}
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            )}
            {onExport && (
              <Button
                variant="outline"
                size="sm"
                onClick={onExport}
              >
                <Download className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>กำลังโหลดข้อมูล...</span>
            </div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="text-red-500 mb-2">เกิดข้อผิดพลาด</div>
              <div className="text-sm text-muted-foreground">{error}</div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div style={{ height: `${getChartHeight()}px` }}>
              {renderChart()}
            </div>
            {renderLegend()}
            {data.length > 0 && (
              <div className="text-center text-sm text-muted-foreground">
                ข้อมูลทั้งหมด: {data.length} รายการ
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}