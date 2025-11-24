/**
 * Optimized query hook with SWR
 * ใช้ SWR สำหรับ caching และลด API calls
 */

import useSWR from 'swr'
import { useCallback } from 'react'
import { useToast } from '@/hooks/use-toast'
import { normalizeError, logError } from '@/lib/utils/error-handler'

interface UseOptimizedQueryOptions<T> {
  key: string | null
  fetcher: () => Promise<T>
  enabled?: boolean
  onSuccess?: (data: T) => void
  onError?: (error: unknown) => void
  revalidateOnMount?: boolean
  revalidateOnFocus?: boolean
}

export function useOptimizedQuery<T>({
  key,
  fetcher,
  enabled = true,
  onSuccess,
  onError,
  revalidateOnMount = true,
  revalidateOnFocus = false,
}: UseOptimizedQueryOptions<T>) {
  const { toast } = useToast()

  const { data, error, isLoading, mutate, isValidating } = useSWR<T>(
    enabled && key ? key : null,
    fetcher,
    {
      revalidateOnMount,
      revalidateOnFocus,
      onSuccess: (data) => {
        onSuccess?.(data)
      },
      onError: (error) => {
        const normalized = normalizeError(error)
        logError(error, key || 'unknown')
        
        toast({
          title: "เกิดข้อผิดพลาด",
          description: normalized.message,
          variant: "destructive",
        })
        
        onError?.(error)
      },
    }
  )

  const refresh = useCallback(() => {
    mutate()
  }, [mutate])

  return {
    data,
    error,
    isLoading,
    isValidating,
    refresh,
    mutate,
  }
}

