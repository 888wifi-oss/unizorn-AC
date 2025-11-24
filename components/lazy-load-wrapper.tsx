// components/lazy-load-wrapper.tsx
"use client"

import { Suspense, ComponentType, lazy, ReactNode } from 'react'
import { Loader2 } from 'lucide-react'

interface LazyLoadWrapperProps {
  children: ReactNode
  fallback?: ReactNode
}

/**
 * Wrapper component for lazy loading with suspense
 */
export function LazyLoadWrapper({ children, fallback }: LazyLoadWrapperProps) {
  return (
    <Suspense fallback={fallback || <DefaultLoadingFallback />}>
      {children}
    </Suspense>
  )
}

/**
 * Default loading fallback component
 */
function DefaultLoadingFallback() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="flex items-center space-x-2">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
        <span className="text-sm text-muted-foreground">กำลังโหลด...</span>
      </div>
    </div>
  )
}

/**
 * HOC for lazy loading components
 */
export function withLazyLoad<P extends object>(
  Component: ComponentType<P>,
  fallback?: ReactNode
) {
  return function LazyLoadedComponent(props: P) {
    return (
      <LazyLoadWrapper fallback={fallback}>
        <Component {...props} />
      </LazyLoadWrapper>
    )
  }
}

/**
 * Lazy load a component with retry logic
 */
export function lazyWithRetry<T extends ComponentType<any>>(
  componentImport: () => Promise<{ default: T }>,
  retries = 3,
  interval = 1000
): React.LazyExoticComponent<T> {
  return lazy(() => {
    return new Promise<{ default: T }>((resolve, reject) => {
      const attemptLoad = (attemptsLeft: number) => {
        componentImport()
          .then(resolve)
          .catch((error) => {
            if (attemptsLeft === 0) {
              reject(error)
              return
            }
            
            console.warn(`Component load failed, retrying... (${attemptsLeft} attempts left)`)
            
            setTimeout(() => {
              attemptLoad(attemptsLeft - 1)
            }, interval)
          })
      }
      
      attemptLoad(retries)
    })
  })
}
