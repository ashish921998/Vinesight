'use client'

import { motion, useReducedMotion, type HTMLMotionProps } from 'framer-motion'
import { ReactNode } from 'react'

interface RevealProps {
  children: ReactNode
  delay?: number
  y?: number
  className?: string
}

/**
 * Lightweight scroll-reveal. Motivated by hierarchy: draws the reader's eye
 * through section content as it enters the viewport. Collapses to a static
 * render under prefers-reduced-motion (also covered globally by MotionConfig).
 */
export function Reveal({ children, delay = 0, y = 20, className }: RevealProps) {
  const reduce = useReducedMotion()
  const props: HTMLMotionProps<'div'> = {
    className,
    initial: reduce ? false : { opacity: 0, y },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, amount: 0.25 },
    transition: { duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] }
  }

  // When the consumer needs a list item, wrap manually instead of polymorphing.
  return <motion.div {...props}>{children}</motion.div>
}

/**
 * List-item variant for semantic <ol>/<ul> children.
 */
export function RevealItem({ children, delay = 0, y = 20, className }: RevealProps) {
  const reduce = useReducedMotion()
  return (
    <motion.li
      className={className}
      initial={reduce ? false : { opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{ duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.li>
  )
}
