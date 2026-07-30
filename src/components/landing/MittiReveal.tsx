'use client'

import {
  motion,
  useScroll,
  useTransform,
  useReducedMotion,
  type HTMLMotionProps,
  type Variants
} from 'framer-motion'
import { useRef, type ReactNode } from 'react'

/* ------------------------------------------------------------------ */
/* Mitti Labs-inspired animation primitives                            */
/* Emil Kowalski-style spring physics + scroll-driven reveals          */
/* ------------------------------------------------------------------ */

const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const
const SPRING_SOFT = { type: 'spring' as const, stiffness: 100, damping: 20, mass: 0.8 }

/* --- Reveal: fade + slide up on scroll into view ------------------ */

interface RevealProps {
  children: ReactNode
  delay?: number
  y?: number
  className?: string
}

export function Reveal({ children, delay = 0, y = 28, className }: RevealProps) {
  const reduce = useReducedMotion()
  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.8, delay, ease: EASE_OUT_EXPO }}
    >
      {children}
    </motion.div>
  )
}

/* --- RevealItem: for list children (<li>) -------------------------- */

export function RevealItem({ children, delay = 0, y = 28, className }: RevealProps) {
  const reduce = useReducedMotion()
  return (
    <motion.li
      className={className}
      initial={reduce ? false : { opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.8, delay, ease: EASE_OUT_EXPO }}
    >
      {children}
    </motion.li>
  )
}

/* --- StaggerGroup + StaggerChild: for grids/lists ------------------ */

const staggerParent: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.1, delayChildren: 0.1 }
  }
}

const staggerChild: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: EASE_OUT_EXPO }
  }
}

export function StaggerGroup({ children, className }: { children: ReactNode; className?: string }) {
  const reduce = useReducedMotion()
  return (
    <motion.div
      className={className}
      variants={reduce ? undefined : staggerParent}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.15 }}
    >
      {children}
    </motion.div>
  )
}

export function StaggerChild({ children, className }: { children: ReactNode; className?: string }) {
  const reduce = useReducedMotion()
  return (
    <motion.div className={className} variants={reduce ? undefined : staggerChild}>
      {children}
    </motion.div>
  )
}

/* --- ParallaxSection: subtle vertical parallax on scroll ----------- */

export function ParallaxWrap({
  children,
  className,
  amount = 50
}: {
  children: ReactNode
  className?: string
  amount?: number
}) {
  const ref = useRef<HTMLDivElement>(null)
  const reduce = useReducedMotion()
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start']
  })
  const y = useTransform(scrollYProgress, [0, 1], [amount, -amount])

  return (
    <div ref={ref} className={className}>
      <motion.div style={reduce ? undefined : { y }}>{children}</motion.div>
    </div>
  )
}

/* --- ScaleIn: scale + fade for hero imagery ------------------------ */

export function ScaleIn({
  children,
  className,
  delay = 0
}: {
  children: ReactNode
  className?: string
  delay?: number
}) {
  const reduce = useReducedMotion()
  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, scale: 1.05 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 1.2, delay, ease: EASE_OUT_EXPO }}
    >
      {children}
    </motion.div>
  )
}

/* --- MagneticButton: magnetic hover + spring press ----------------- */

interface MagneticButtonProps extends HTMLMotionProps<'a'> {
  children: ReactNode
}

export function MagneticButton({ children, className, ...rest }: MagneticButtonProps) {
  const reduce = useReducedMotion()
  return (
    <motion.a
      className={className}
      whileHover={reduce ? undefined : { scale: 1.03 }}
      whileTap={reduce ? undefined : { scale: 0.97 }}
      transition={SPRING_SOFT}
      {...rest}
    >
      {children}
    </motion.a>
  )
}

/* --- WordReveal: word-by-word hero text animation ------------------ */

export function WordReveal({
  text,
  className,
  wordClassName,
  delay = 0
}: {
  text: string
  className?: string
  wordClassName?: string
  delay?: number
}) {
  const reduce = useReducedMotion()
  const words = text.split(' ')

  if (reduce) {
    return <span className={className}>{text}</span>
  }

  return (
    <span className={className}>
      {words.map((word, i) => (
        <span key={i} className="inline-block overflow-hidden align-bottom">
          <motion.span
            className={`inline-block ${wordClassName ?? ''}`}
            initial={{ y: '110%', opacity: 0 }}
            animate={{ y: '0%', opacity: 1 }}
            transition={{
              duration: 0.8,
              delay: delay + i * 0.06,
              ease: EASE_OUT_EXPO
            }}
          >
            {word}
            {i < words.length - 1 ? '\u00A0' : ''}
          </motion.span>
        </span>
      ))}
    </span>
  )
}
