'use client'

import { m, useReducedMotion, type HTMLMotionProps } from 'framer-motion'
import { CSSProperties, ReactNode } from 'react'

interface RevealProps {
  children: ReactNode
  delay?: number
  y?: number
  className?: string
  style?: CSSProperties
}

/**
 * Lightweight scroll-reveal. Motivated by hierarchy: draws the reader's eye
 * through section content as it enters the viewport. Collapses to a static
 * render under prefers-reduced-motion (also covered globally by MotionConfig).
 */
export function Reveal({ children, delay = 0, y = 20, className, style }: RevealProps) {
  const reduce = useReducedMotion()
  const props: HTMLMotionProps<'div'> = {
    className,
    style,
    initial: reduce ? false : { opacity: 0, y },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, amount: 0.25 },
    transition: { duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] }
  }

  return <m.div {...props}>{children}</m.div>
}
