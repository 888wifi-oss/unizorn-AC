"use client"

import { SWRConfig } from "swr"
import { ReactNode } from "react"

interface SWRProviderProps {
  children: ReactNode
}

export function SWRProvider({ children }: SWRProviderProps) {
  return (
    <SWRConfig
      value={{
        // Global configuration
        revalidateOnFocus: false, // ไม่ revalidate เมื่อ focus กลับมา
        revalidateOnReconnect: true, // revalidate เมื่อ reconnect
        dedupingInterval: 2000, // Cache duplicate requests 2 seconds
        errorRetryCount: 3, // Retry 3 ครั้งเมื่อ error
        errorRetryInterval: 5000, // Retry ทุก 5 วินาที
        shouldRetryOnError: (error) => {
          // ไม่ retry สำหรับ 4xx errors (client errors)
          if (error?.status >= 400 && error?.status < 500) {
            return false
          }
          return true
        },
        onError: (error, key) => {
          // Log errors (TODO: Send to error logging service)
          console.error('[SWR] Error fetching:', key, error)
        },
        // Fetcher function
        fetcher: async (url: string) => {
          const res = await fetch(url)
          if (!res.ok) {
            const error: any = new Error('An error occurred while fetching the data.')
            error.status = res.status
            error.info = await res.json().catch(() => ({}))
            throw error
          }
          return res.json()
        },
      }}
    >
      {children}
    </SWRConfig>
  )
}
