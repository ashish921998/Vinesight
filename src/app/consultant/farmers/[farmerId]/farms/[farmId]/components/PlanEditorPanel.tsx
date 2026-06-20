'use client'

import { useEffect, useRef, useState } from 'react'
import { Loader2, Plus, Send, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell
} from '@/components/ui/table'
import { SectionLabel } from './SectionLabel'
import { type DraftItem, PLAN_ITEM_UNIT_OPTIONS } from './farm-config'
import { formatParamKey } from './farm-helpers'

export function PlanEditorPanel({
  note,
  onNoteChange,
  items,
  onUpdateItem,
  onAddItem,
  onRemoveItem,
  onSave,
  saving,
  hasExistingPlan,
  abnormalCount
}: {
  note: string
  onNoteChange: (v: string) => void
  items: DraftItem[]
  onUpdateItem: (id: string, patch: Partial<DraftItem>) => void
  onAddItem: () => void
  onRemoveItem: (id: string) => void
  onSave: () => void
  saving: boolean
  hasExistingPlan: boolean
  abnormalCount: number
}) {
  const addressedCount = items.filter((item) => item.nutrient).length
  const allAddressed = abnormalCount > 0 && addressedCount === abnormalCount

  return (
    <div className="space-y-3">
      <div className="flex items-baseline justify-between">
        <SectionLabel>
          {hasExistingPlan ? 'Edit fertilizer plan' : 'New fertilizer plan'}
        </SectionLabel>
        {abnormalCount > 0 && (
          <span
            className={`text-[11px] font-medium ${
              allAddressed ? 'text-emerald-600' : 'text-amber-700'
            }`}
          >
            Addresses {addressedCount} of {abnormalCount} flagged
          </span>
        )}
      </div>

      <div className="rounded-lg border border-border bg-card overflow-hidden">
        {/* Items table - full width */}
        <div className="px-4 pt-3 pb-1 flex items-center justify-between">
          <Label className="text-xs">Fertilizer items</Label>
          <span className="text-[11px] text-muted-foreground/70 tabular-nums">
            {items.length} {items.length === 1 ? 'item' : 'items'}
          </span>
        </div>
        <Table className="text-sm">
          <TableHeader>
            <TableRow className="border-b border-border hover:bg-transparent">
              <TableHead className="h-auto py-2 px-2 text-center w-8 text-[11px] font-medium text-muted-foreground">
                #
              </TableHead>
              <TableHead className="h-auto py-2 px-2 text-left text-[11px] font-medium text-muted-foreground">
                Fertilizer
              </TableHead>
              <TableHead className="h-auto py-2 px-2 text-right w-24 text-[11px] font-medium text-muted-foreground">
                Qty
              </TableHead>
              <TableHead className="h-auto py-2 px-1.5 text-left w-24 text-[11px] font-medium text-muted-foreground">
                Unit
              </TableHead>
              <TableHead className="h-auto py-2 px-2 text-center w-12 text-[11px] font-medium text-muted-foreground">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item, idx) => (
              <PlanItemRow
                key={item.id}
                item={item}
                index={idx}
                onUpdate={(patch) => onUpdateItem(item.id, patch)}
                onRemove={() => onRemoveItem(item.id)}
              />
            ))}
          </TableBody>
        </Table>
        <div className="p-4 pt-2">
          <Button variant="outline" size="sm" onClick={onAddItem} className="w-full border-dashed">
            <Plus className="h-3.5 w-3.5" />
            Add item
          </Button>
        </div>

        {/* Message to farmer */}
        <div className="px-4 pb-3 space-y-1.5">
          <Label htmlFor="plan-note" className="text-xs">
            Message to farmer
          </Label>
          <Input
            id="plan-note"
            value={note}
            onChange={(e) => onNoteChange(e.target.value)}
            placeholder="Short note the farmer will see with this plan"
            className="h-9"
          />
        </div>

        {/* Action footer */}
        <div className="px-4 pb-4 pt-1 flex flex-col gap-1.5 border-t border-border/60 mt-1">
          <Button onClick={onSave} disabled={saving} className="w-full h-10">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            {hasExistingPlan ? 'Save changes' : 'Send plan'}
          </Button>
          <p className="text-[11px] text-muted-foreground text-center">
            {hasExistingPlan
              ? 'Changes are sent to the farmer immediately after saving.'
              : 'The farmer will see this plan as soon as you send it.'}
          </p>
        </div>
      </div>
    </div>
  )
}

function PlanItemRow({
  item,
  index,
  onUpdate,
  onRemove
}: {
  item: DraftItem
  index: number
  onUpdate: (patch: Partial<DraftItem>) => void
  onRemove: () => void
}) {
  const [confirmRemove, setConfirmRemove] = useState(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  const handleRemove = () => {
    if (!confirmRemove) {
      setConfirmRemove(true)
      timeoutRef.current = setTimeout(() => setConfirmRemove(false), 3000)
      return
    }
    onRemove()
  }

  return (
    <TableRow className="border-b border-border/50 last:border-0 hover:bg-muted/30">
      <TableCell className="p-0 py-2 px-2 text-center align-middle">
        <span className="text-[11px] text-muted-foreground tabular-nums">{index + 1}</span>
      </TableCell>
      <TableCell className="p-0 py-1.5 px-2 align-middle">
        <div className="flex flex-col gap-1">
          {item.nutrient && (
            <span className="inline-flex w-fit items-center rounded bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-semibold px-1.5 py-0.5">
              {formatParamKey(item.nutrient)}
            </span>
          )}
          <Input
            value={item.fertilizer_name}
            onChange={(e) => onUpdate({ fertilizer_name: e.target.value })}
            placeholder="Fertilizer name"
            className="h-8 text-sm px-2"
          />
        </div>
      </TableCell>
      <TableCell className="p-0 py-1.5 px-2 align-middle">
        <Input
          type="number"
          value={item.quantity}
          onChange={(e) => onUpdate({ quantity: e.target.value })}
          placeholder="0"
          className="h-8 text-sm tabular-nums text-right px-2"
        />
      </TableCell>
      <TableCell className="p-0 py-1.5 px-1.5 align-middle">
        <Select value={item.unit} onValueChange={(v) => onUpdate({ unit: v })}>
          <SelectTrigger size="sm" className="text-sm px-2">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PLAN_ITEM_UNIT_OPTIONS.map((u) => (
              <SelectItem key={u} value={u}>
                {u}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </TableCell>
      <TableCell className="p-0 py-1.5 px-2 align-middle">
        <div className="flex items-center justify-center">
          <Button
            variant="ghost"
            size="icon"
            className={`h-7 w-7 ${
              confirmRemove
                ? 'text-destructive hover:bg-destructive/10'
                : 'text-muted-foreground hover:text-destructive'
            }`}
            onClick={handleRemove}
            title={confirmRemove ? 'Click again to remove' : 'Remove item'}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  )
}
