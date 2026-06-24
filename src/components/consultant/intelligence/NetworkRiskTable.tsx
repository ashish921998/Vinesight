'use client'

import { NETWORK_BLOCKS, type RiskLevel } from '@/lib/consultant-intelligence-demo'

// Risk chip palette — low (optimal green) / medium (amber) / high (warm red).
// Color always pairs with the text label, per DESIGN.md.
const RISK_STYLE: Record<RiskLevel, { bg: string; fg: string; label: string }> = {
  low: { bg: '#edf7ef', fg: '#3f7d4c', label: 'Low' },
  medium: { bg: '#fff4e5', fg: '#b54708', label: 'Medium' },
  high: { bg: '#fde7e0', fg: '#c2410c', label: 'High' }
}

function RiskChip({ level, disease }: { level: RiskLevel; disease: string }) {
  const s = RISK_STYLE[level]
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium"
      style={{ backgroundColor: s.bg, color: s.fg }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: s.fg }} />
      {s.label} · {disease}
    </span>
  )
}

/**
 * Block-risk map as a dense worklist table (not a field map — geography isn't
 * the task here). The "Network signal" column is the moat: a block's score is
 * lifted by confirmed cases in adjacent blocks and the shared forecast, so the
 * whole estate's data sharpens each block's early warning.
 */
export function NetworkRiskTable() {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="border-b border-border p-4">
        <h3 className="text-base font-medium">Block-risk map · today</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Current disease risk per block, lifted by confirmed cases nearby — the network effect that
          grows with every farm on the platform.
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/40 text-left text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              <th className="px-4 py-2.5 font-semibold">Block</th>
              <th className="px-4 py-2.5 font-semibold">Variety</th>
              <th className="px-4 py-2.5 text-right font-semibold">Acres</th>
              <th className="px-4 py-2.5 font-semibold">Current risk</th>
              <th className="px-4 py-2.5 font-semibold">Network signal</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {NETWORK_BLOCKS.map((b) => {
              const lifted = b.signal.startsWith('↑')
              return (
                <tr key={b.block} className="hover:bg-muted/50">
                  <td className="px-4 py-3 font-mono text-[13px] font-medium tabular-nums">
                    {b.block}
                  </td>
                  <td className="px-4 py-3 font-serif">{b.variety}</td>
                  <td className="px-4 py-3 text-right font-mono tabular-nums text-muted-foreground">
                    {b.acres.toFixed(1)}
                  </td>
                  <td className="px-4 py-3">
                    <RiskChip level={b.level} disease={b.disease} />
                  </td>
                  <td
                    className={
                      lifted
                        ? 'px-4 py-3 text-[13px] font-medium text-foreground'
                        : 'px-4 py-3 text-[13px] text-muted-foreground'
                    }
                  >
                    {b.signal}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
