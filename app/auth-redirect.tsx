"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { getCurrentUser } from "@/lib/utils/mock-auth"

export function AuthRedirect() {
  const router = useRouter()
  const currentUser = getCurrentUser()

  useEffect(() => {
    // If not logged in, redirect to login
    if (!currentUser || currentUser.id === "guest") {
      console.log("[AuthRedirect] No user found, redirecting to login")
      router.replace("/login")
    } else {
      console.log("[AuthRedirect] User found:", currentUser.full_name)
      // Redirect authenticated users to the admin dashboard
      router.replace("/dashboard")
    }
  }, [currentUser, router])

  // Show loading while checking auth
  if (!currentUser || currentUser.id === "guest") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">กำลังโหลด...</p>
        </div>
      </div>
    )
  }

  return null
}
