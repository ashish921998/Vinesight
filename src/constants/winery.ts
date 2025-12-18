import {
  type Barrel,
  type ExportTemplate,
  type FermentationReading,
  type HarvestLot,
  type InventoryItem,
  type Tank,
  type WineLot,
  type WorkOrder
} from '@/types/winery'

export const mockHarvestLots: HarvestLot[] = [
  {
    id: 'HL-24-01',
    vineyardBlock: {
      id: 'VB-101',
      name: 'North Slope A',
      farmName: 'Nashik Estate',
      variety: 'Syrah'
    },
    variety: 'Syrah',
    harvestDate: '2024-09-12',
    weightKg: 8200,
    initialVolumeL: 6200,
    initialChemistry: {
      brix: 24.1,
      temperatureC: 18.4,
      pH: 3.55
    },
    status: 'fermenting',
    linkedWineLotId: 'WL-24-01'
  },
  {
    id: 'HL-24-02',
    vineyardBlock: {
      id: 'VB-103',
      name: 'Benchland B',
      farmName: 'Pune Valley',
      variety: 'Cabernet Sauvignon'
    },
    variety: 'Cabernet Sauvignon',
    harvestDate: '2024-09-18',
    weightKg: 9800,
    initialVolumeL: 7400,
    initialChemistry: {
      brix: 25.3,
      temperatureC: 19.2,
      pH: 3.62
    },
    status: 'harvested'
  },
  {
    id: 'HL-24-03',
    vineyardBlock: {
      id: 'VB-110',
      name: 'River Bend',
      farmName: 'Sangli Hills',
      variety: 'Chenin Blanc'
    },
    variety: 'Chenin Blanc',
    harvestDate: '2024-08-28',
    weightKg: 6400,
    initialVolumeL: 4800,
    status: 'aging',
    linkedWineLotId: 'WL-24-03'
  }
]

export const mockWineLots: WineLot[] = [
  {
    id: 'WL-24-01',
    code: '24SY-01',
    vintage: '2024',
    sourceHarvestLotId: 'HL-24-01',
    name: 'North Slope Syrah',
    status: 'fermenting',
    currentVolumeL: 6100,
    container: {
      type: 'tank',
      id: 'T-05',
      name: 'Tank 5'
    }
  },
  {
    id: 'WL-24-02',
    code: '24CS-01',
    vintage: '2024',
    sourceHarvestLotId: 'HL-24-02',
    name: 'Benchland Cabernet',
    status: 'harvested',
    currentVolumeL: 0
  },
  {
    id: 'WL-24-03',
    code: '24CB-01',
    vintage: '2024',
    sourceHarvestLotId: 'HL-24-03',
    name: 'River Bend Chenin',
    status: 'aging',
    currentVolumeL: 4300,
    container: {
      type: 'barrel',
      id: 'B-12',
      name: 'Barrel 12'
    }
  }
]

export const mockTanks: Tank[] = [
  {
    id: 'T-05',
    name: 'Tank 5',
    capacityL: 8000,
    currentVolumeL: 6100,
    status: 'in_use',
    assignedLotId: 'WL-24-01'
  },
  { id: 'T-07', name: 'Tank 7', capacityL: 10000, currentVolumeL: 0, status: 'empty' },
  { id: 'T-08', name: 'Tank 8', capacityL: 6000, currentVolumeL: 0, status: 'empty' }
]

export const mockBarrels: Barrel[] = [
  { id: 'B-12', name: 'Barrel 12', sizeL: 225, fillStatus: 'full', assignedLotId: 'WL-24-03' },
  { id: 'B-13', name: 'Barrel 13', sizeL: 225, fillStatus: 'partial' },
  { id: 'B-14', name: 'Barrel 14', sizeL: 500, fillStatus: 'empty' }
]

export const mockFermentationReadings: FermentationReading[] = [
  {
    id: 'FR-001',
    wineLotId: 'WL-24-01',
    timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    brix: 14.2,
    temperatureC: 22.4,
    pH: 3.45,
    note: 'Steady drop after inoculation'
  },
  {
    id: 'FR-002',
    wineLotId: 'WL-24-01',
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    brix: 16.1,
    temperatureC: 23.0,
    pH: 3.48
  },
  {
    id: 'FR-003',
    wineLotId: 'WL-24-03',
    timestamp: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
    brix: 2.1,
    temperatureC: 15.2,
    pH: 3.32,
    note: 'Dry, moving to barrel'
  }
]

export const mockWorkOrders: WorkOrder[] = [
  {
    id: 'WO-101',
    type: 'punch_down',
    wineLotId: 'WL-24-01',
    wineLotName: 'North Slope Syrah',
    containerId: 'T-05',
    containerType: 'tank',
    dueDate: new Date().toISOString(),
    assignee: 'Cellar A',
    status: 'pending',
    notes: 'Every 6 hours during peak fermentation'
  },
  {
    id: 'WO-102',
    type: 'so2_addition',
    wineLotId: 'WL-24-03',
    wineLotName: 'River Bend Chenin',
    containerId: 'B-12',
    containerType: 'barrel',
    dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    assignee: 'Priya',
    status: 'pending',
    notes: 'Free SO2 35 ppm'
  },
  {
    id: 'WO-103',
    type: 'racking',
    wineLotId: 'WL-24-03',
    wineLotName: 'River Bend Chenin',
    containerId: 'B-13',
    containerType: 'barrel',
    dueDate: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
    assignee: 'Cellar B',
    status: 'completed'
  }
]

export const mockInventory: InventoryItem[] = [
  { id: 'INV-01', category: 'yeast', name: 'RC212', quantity: 4, unit: 'packs', reorderLevel: 3 },
  {
    id: 'INV-02',
    category: 'chemical',
    name: 'SO2 Powder',
    quantity: 8,
    unit: 'kg',
    reorderLevel: 5
  },
  {
    id: 'INV-03',
    category: 'barrel',
    name: 'French Oak 225L',
    quantity: 12,
    unit: 'units',
    reorderLevel: 6
  },
  {
    id: 'INV-04',
    category: 'bottle',
    name: '750ml Burgundy',
    quantity: 1800,
    unit: 'units',
    reorderLevel: 1500
  }
]

export const exportTemplates: ExportTemplate[] = [
  {
    id: 'export-lot-movements',
    title: 'Lot Movements',
    description: 'Movement history with source/destination containers for audit and TTB prep',
    dataset: 'lot_movements'
  },
  {
    id: 'export-volume-changes',
    title: 'Volume Changes',
    description: 'Volume deltas with timestamps and operator for loss tracking',
    dataset: 'volume_changes'
  },
  {
    id: 'export-production-summary',
    title: 'Production Summary',
    description: 'Vintage-level summary of lots, treatments, and current status',
    dataset: 'production_summary'
  }
]
