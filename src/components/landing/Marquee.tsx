'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import { useReducedMotion } from 'framer-motion'

/**
 * Dismissible scrolling announcement bar. The track holds two identical copies
 * of the content and translates by exactly -50%, so the loop is seamless.
 * Under prefers-reduced-motion it renders as a single static, centred line.
 */
export function Marquee({ children }: { children: React.ReactNode }) {
  const [dismissed, setDismissed] = useState(false)
  const reduce = useReducedMotion()

  if (dismissed) return null

  return (
    <div className="relative overflow-hidden bg-[#102117] text-[#fdfaef]">
      <div className="flex items-center py-2.5 pr-11">
        {reduce ? (
          <div className="flex w-full justify-center px-4 text-[13px]">{children}</div>
        ) : (
          <div className="flex min-w-full shrink-0 animate-[marquee_38s_linear_infinite] [animation-play-state:running] hover:[animation-play-state:paused] focus-within:[animation-play-state:paused]">
            {/* Two identical copies, and the inter-item gap lives INSIDE each copy
                (gap-16 between spans + pr-16 trailing). That makes the track
                exactly 2x one copy, so the -50% keyframe lands copy two where
                copy one began — seamless, no half-gap jump at the loop point. */}
            {[0, 1].map((copy) => (
              <div key={copy} className="flex shrink-0 gap-16 pr-16">
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className={`whitespace-nowrap text-[13px] ${copy === 0 && i === 0 ? '' : 'pointer-events-none'}`}
                    aria-hidden={copy !== 0 || i !== 0}
                    inert={copy !== 0 || i !== 0}
                  >
                    {children}
                  </span>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
      {/* Fades the scrolling text out before it reaches the close button. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 right-0 w-24"
        style={{ background: 'linear-gradient(to right, rgba(16,33,23,0) 0%, #102117 62%)' }}
      />
      <button
        type="button"
        onClick={() => setDismissed(true)}
        aria-label="Dismiss announcement"
        className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1.5 opacity-60 transition-opacity hover:opacity-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e5ffb2]"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}
