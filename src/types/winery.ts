export type LotStatus = 'harvested' | 'fermenting' | 'aging' | 'bottled'
export type ContainerType = 'tank' | 'barrel'
export type WorkOrderStatus = 'pending' | 'completed'
export type WorkOrderType =
  | 'crush'
  | 'punch_down'
  | 'pump_over'
  | 'racking'
  | 'so2_addition'
  | 'blending'
  | 'bottling'
export type InventoryCategory = 'yeast' | 'chemical' | 'barrel' | 'bottle'

export interface VineyardBlockRef {
  id: string
  name: string
  farmName?: string
  variety?: string
}

export interface HarvestLot {
  id: string
  vineyardBlock: VineyardBlockRef
  variety: string
  harvestDate: string
  weightKg: number
  initialVolumeL?: number
  initialChemistry?: {
    brix?: number
    temperatureC?: number
    pH?: number
  }
  status: LotStatus
  linkedWineLotId?: string
}

export interface WineLot {
  id: string
  code: string
  vintage: string
  sourceHarvestLotId: string
  name: string
  status: LotStatus
  currentVolumeL: number
  container?: {
    type: ContainerType
    id: string
    name: string
  }
}

export interface Tank {
  id: string
  name: string
  capacityL: number
  currentVolumeL: number
  status: 'empty' | 'in_use'
  assignedLotId?: string
}

export interface Barrel {
  id: string
  name: string
  sizeL: number
  fillStatus: 'empty' | 'partial' | 'full'
  assignedLotId?: string
}

export interface FermentationReading {
  id: string
  wineLotId: string
  timestamp: string
  brix?: number
  temperatureC?: number
  pH?: number
  note?: string
}

export interface FermentationAlert {
  id: string
  wineLotId: string
  lotName: string
  message: string
  severity: 'info' | 'warning' | 'critical'
}

export interface WorkOrder {
  id: string
  type: WorkOrderType
  wineLotId: string
  wineLotName: string
  containerId?: string
  containerType?: ContainerType
  dueDate: string
  assignee: string
  status: WorkOrderStatus
  notes?: string
}

export interface InventoryItem {
  id: string
  category: InventoryCategory
  name: string
  quantity: number
  unit: string
  reorderLevel?: number
  lowStockThreshold?: number
  notes?: string
}

export interface ExportTemplate {
  id: string
  title: string
  description: string
  dataset: 'lot_movements' | 'volume_changes' | 'production_summary'
}
