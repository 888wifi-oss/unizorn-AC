"use client"

import { CheckCircle } from "lucide-react"
import { useEffect, useState } from "react"

interface SuccessAnimationProps {
  message?: string
  onComplete?: () => void
}

export function SuccessAnimation({ message, onComplete }: SuccessAnimationProps) {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false)
      onComplete?.()
    }, 3000)

    return () => clearTimeout(timer)
  }, [onComplete])

  if (!isVisible) return null

  return (
    <div className="fixed bottom-4 right-4 bg-green-500 text-white px-6 py-4 rounded-lg shadow-lg flex items-center gap-3 animate-slide-in">
      <CheckCircle className="h-6 w-6" />
      <p className="font-medium">{message || "ดำเนินการสำเร็จ"}</p>
    </div>
  )
}

// Inline success badge
export function SuccessBadge({ text }: { text: string }) {
  return (
    <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-100 text-green-700 rounded-full animate-fade-in">
      <CheckCircle className="h-4 w-4" />
      <span className="text-sm font-medium">{text}</span>
    </div>
  )
}



















