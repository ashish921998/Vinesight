'use client'

import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface FloatingActionButtonProps {
  onClick: () => void
  label?: string
}

export function FloatingActionButton({ onClick, label = 'Add Logs' }: FloatingActionButtonProps) {
  return (
    <div className="fixed bottom-20 right-4 z-40 md:bottom-6">
      <Button
        onClick={onClick}
        size="lg"
        className="h-14 w-14 rounded-full shadow-lg bg-gradient-to-br from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white border-0 transition-all hover:scale-110 active:scale-95"
      >
        <Plus className="h-6 w-6" />
        <span className="sr-only">{label}</span>
      </Button>
    </div>
  )
}
