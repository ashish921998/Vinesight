'use client'

import { useMemo } from 'react'
import { Leaf, TestTube } from 'lucide-react'
import type { LabTestRecord } from '@/types/lab-tests'
import { SectionLabel } from './SectionLabel'

export function HistoryTable({
  soilTests,
  petioleTests
}: {
  soilTests: LabTestRecord[]
  petioleTests: LabTestRecord[]
}) {
  const allTests = useMemo(() => {
    return [
      ...soilTests.map((t) => ({ ...t, _type: 'soil' as const })),
      ...petioleTests.map((t) => ({ ...t, _type: 'petiole' as const }))
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }, [soilTests, petioleTests])

  return (
    <div>
      <SectionLabel>Test records</SectionLabel>
      <div className="mt-2 divide-y divide-border rounded-lg border border-border">
        {allTests.map((test) => (
          <div
            key={`${test._type}-${test.id}`}
            className="flex items-center gap-2.5 py-2.5 px-3 hover:bg-muted/20"
          >
            {test._type === 'soil' ? (
              <TestTube className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            ) : (
              <Leaf className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            )}
            <div className="min-w-0">
              <p className="text-sm font-medium capitalize">{test._type} test</p>
              <p className="text-xs text-muted-foreground tabular-nums">
                {new Date(test.date).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                })}
                <span className="mx-1">·</span>
                {Object.keys(test.parameters || {}).length} parameters
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
