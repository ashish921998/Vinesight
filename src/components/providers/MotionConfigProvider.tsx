'use client'

import { MotionConfig } from 'framer-motion'
import { ReactNode } from 'react'

/**
 * Honors the user's OS-level "reduce motion" preference (WCAG 2.3.3).
 *
 * `reducedMotion="user"` tells framer-motion to automatically disable transform
 * and layout animations (while keeping opacity changes) when the user has
 * `prefers-reduced-motion: reduce` enabled. CSS-driven animations/transitions
 * are handled separately by the media query in globals.css.
 */
export function MotionConfigProvider({ children }: { children: ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>
}
