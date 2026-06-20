import { FlaskConical, Leaf } from 'lucide-react'

export function NoReportState({
  soilTestsCount,
  petioleTestsCount
}: {
  soilTestsCount: number
  petioleTestsCount: number
}) {
  return (
    <div className="rounded-lg border border-dashed border-border p-12 flex flex-col items-center justify-center text-center">
      <div className="flex items-center gap-2 mb-3">
        <FlaskConical className="h-6 w-6 text-muted-foreground/40" />
        <Leaf className="h-6 w-6 text-muted-foreground/40" />
      </div>
      <h2 className="text-base font-semibold">No petiole report to review</h2>
      <p className="mt-1 text-sm text-muted-foreground max-w-md">
        When the farmer uploads a petiole report, it will appear here for review.
        {soilTestsCount > 0 || petioleTestsCount > 0
          ? ` There ${soilTestsCount + petioleTestsCount === 1 ? 'is' : 'are'} ${
              soilTestsCount + petioleTestsCount
            } existing test${soilTestsCount + petioleTestsCount === 1 ? '' : 's'} on record.`
          : ''}
      </p>
    </div>
  )
}
