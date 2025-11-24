"use client"

import { useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { getCurrentUser } from "@/lib/utils/mock-auth"

export function AuthCheck({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const currentUser = getCurrentUser()

  useEffect(() => {
    // Skip auth check for login page
    if (pathname === "/login") {
      return
    }

    // If not logged in (guest), redirect to login
    if (!currentUser || currentUser.id === "guest") {
      router.push("/login")
    }
  }, [currentUser, pathname, router])

  // If guest, show nothing (will redirect)
  if (!currentUser || currentUser.id === "guest") {
    return null
  }

  return <>{children}</>
}

