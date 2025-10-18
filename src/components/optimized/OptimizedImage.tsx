'use client'

import Image, { ImageProps } from 'next/image'
import { useState } from 'react'

interface OptimizedImageProps extends Omit<ImageProps, 'onLoad'> {
  fallbackSrc?: string
}

/**
 * Optimized image component with better loading states and error handling
 */
export function OptimizedImage({ fallbackSrc, alt, ...props }: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  if (hasError && fallbackSrc) {
    return (
      <Image
        {...props}
        src={fallbackSrc}
        alt={alt}
        onLoad={() => setIsLoading(false)}
        className={`${props.className || ''} ${isLoading ? 'blur-sm' : 'blur-0'} transition-all duration-300`}
      />
    )
  }

  return (
    <Image
      {...props}
      alt={alt}
      onLoad={() => setIsLoading(false)}
      onError={() => setHasError(true)}
      className={`${props.className || ''} ${isLoading ? 'blur-sm' : 'blur-0'} transition-all duration-300`}
      loading={props.loading || 'lazy'}
      quality={props.quality || 85}
    />
  )
}
