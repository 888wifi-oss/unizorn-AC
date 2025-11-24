"use client"

import { useTheme, AVAILABLE_THEMES, ThemeColor } from "@/lib/context/theme-context"
import { Palette } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function ThemeSelector() {
  const { theme, setTheme } = useTheme()

  const themeColors = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    purple: 'bg-purple-500',
    orange: 'bg-orange-500',
    pink: 'bg-pink-500',
    dark: 'bg-gray-700'
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9">
          <Palette className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>เลือกสีธีม</DialogTitle>
          <DialogDescription>
            เลือกสีที่คุณชื่นชอบสำหรับ Dashboard
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-3 gap-4 py-4">
          {AVAILABLE_THEMES.map((themeOption) => (
            <button
              key={themeOption.color}
              onClick={() => setTheme(themeOption.color)}
              className={cn(
                "p-4 rounded-lg border-2 transition-all hover:scale-105",
                theme === themeOption.color
                  ? "border-blue-600 ring-2 ring-blue-200"
                  : "border-gray-200 hover:border-gray-300"
              )}
            >
              <div className={cn(
                "w-16 h-16 rounded-full mx-auto mb-2",
                themeColors[themeOption.color]
              )} />
              <p className="text-sm font-medium">{themeOption.name}</p>
              {themeOption.icon && (
                <p className="text-2xl mt-1">{themeOption.icon}</p>
              )}
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
















