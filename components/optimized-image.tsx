// components/optimized-image.tsx
"use client"

import { useState, useEffect, useRef } from 'react'
import Image, { ImageProps } from 'next/image'
import { Loader2 } from 'lucide-react'

interface OptimizedImageProps extends Omit<ImageProps, 'onLoad'> {
  fallbackSrc?: string
  showLoader?: boolean
  lazyLoad?: boolean
}

/**
 * Optimized image component with lazy loading and fallback
 */
export function OptimizedImage({
  src,
  alt,
  fallbackSrc = '/placeholder.png',
  showLoader = true,
  lazyLoad = true,
  ...props
}: OptimizedImageProps) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [currentSrc, setCurrentSrc] = useState(src)
  const imgRef = useRef<HTMLDivElement>(null)
  const [isInView, setIsInView] = useState(!lazyLoad)

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (!lazyLoad || isInView) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true)
            observer.disconnect()
          }
        })
      },
      {
        rootMargin: '50px', // Start loading 50px before image is visible
      }
    )

    if (imgRef.current) {
      observer.observe(imgRef.current)
    }

    return () => {
      observer.disconnect()
    }
  }, [lazyLoad, isInView])

  const handleLoad = () => {
    setLoading(false)
    setError(false)
  }

  const handleError = () => {
    setLoading(false)
    setError(true)
    if (fallbackSrc) {
      setCurrentSrc(fallbackSrc)
    }
  }

  return (
    <div ref={imgRef} className="relative">
      {loading && showLoader && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      )}
      
      {isInView && (
        <Image
          {...props}
          src={error ? fallbackSrc : currentSrc}
          alt={alt}
          onLoad={handleLoad}
          onError={handleError}
          loading={lazyLoad ? 'lazy' : 'eager'}
          placeholder={props.placeholder || 'blur'}
          blurDataURL={props.blurDataURL || 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='}
        />
      )}
    </div>
  )
}

/**
 * Avatar component with optimization
 */
export function OptimizedAvatar({
  src,
  alt,
  size = 40,
  fallback,
}: {
  src?: string
  alt: string
  size?: number
  fallback?: string
}) {
  const [error, setError] = useState(false)

  if (!src || error) {
    return (
      <div
        className="flex items-center justify-center bg-gray-200 rounded-full text-gray-600 font-medium"
        style={{ width: size, height: size, fontSize: size / 2.5 }}
      >
        {fallback || alt.charAt(0).toUpperCase()}
      </div>
    )
  }

  return (
    <div className="relative rounded-full overflow-hidden" style={{ width: size, height: size }}>
      <Image
        src={src}
        alt={alt}
        width={size}
        height={size}
        className="object-cover"
        onError={() => setError(true)}
      />
    </div>
  )
}
