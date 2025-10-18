'use client'

import { useEffect, useState } from 'react'

let tfPromise: Promise<typeof import('@tensorflow/tfjs')> | null = null

// Singleton lazy loader for TensorFlow.js
export function useTensorFlow() {
  const [tf, setTf] = useState<typeof import('@tensorflow/tfjs') | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!tfPromise) {
      tfPromise = import('@tensorflow/tfjs')
    }

    tfPromise
      .then((module) => {
        setTf(module)
        setLoading(false)
      })
      .catch((err) => {
        setError(err)
        setLoading(false)
      })
  }, [])

  return { tf, loading, error }
}

// Preload TensorFlow.js on idle
export function preloadTensorFlow() {
  if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
    window.requestIdleCallback(() => {
      if (!tfPromise) {
        tfPromise = import('@tensorflow/tfjs')
      }
    })
  }
}
