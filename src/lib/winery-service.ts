import {
  mockBarrels,
  mockFermentationReadings,
  mockHarvestLots,
  mockInventory,
  mockTanks,
  mockWineLots,
  mockWorkOrders
} from '@/constants/winery'
import {
  type Barrel,
  type FermentationReading,
  type HarvestLot,
  type InventoryItem,
  type Tank,
  type WineLot,
  type WorkOrder
} from '@/types/winery'

interface WinerySeedData {
  harvestLots: HarvestLot[]
  wineLots: WineLot[]
  tanks: Tank[]
  barrels: Barrel[]
  fermentationReadings: FermentationReading[]
  workOrders: WorkOrder[]
  inventory: InventoryItem[]
}

const LOCAL_KEY = 'vinesight-winery-local-seed'

const readLocalSeed = (): Partial<WinerySeedData> => {
  if (typeof window === 'undefined') return {}
  try {
    const raw = window.localStorage.getItem(LOCAL_KEY)
    return raw ? (JSON.parse(raw) as Partial<WinerySeedData>) : {}
  } catch {
    return {}
  }
}

const writeLocalSeed = (data: Partial<WinerySeedData>) => {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(LOCAL_KEY, JSON.stringify(data))
}

export class WineryService {
  // Placeholder for future Supabase-backed calls
  static async getSeedData(): Promise<WinerySeedData> {
    const localSeed = readLocalSeed()
    return {
      harvestLots: [
        ...structuredClone(mockHarvestLots),
        ...(structuredClone(localSeed.harvestLots) || [])
      ],
      wineLots: [...structuredClone(mockWineLots), ...(structuredClone(localSeed.wineLots) || [])],
      tanks: structuredClone(mockTanks),
      barrels: structuredClone(mockBarrels),
      fermentationReadings: [
        ...structuredClone(mockFermentationReadings),
        ...(structuredClone(localSeed.fermentationReadings) || [])
      ],
      workOrders: [
        ...structuredClone(mockWorkOrders),
        ...(structuredClone(localSeed.workOrders) || [])
      ],
      inventory: [
        ...structuredClone(mockInventory),
        ...(structuredClone(localSeed.inventory) || [])
      ]
    }
  }

  static addHarvestConversion(harvestLot: HarvestLot, wineLot: WineLot) {
    const localSeed = readLocalSeed()
    const harvestLots = [...(localSeed.harvestLots || []), harvestLot]
    const wineLots = [...(localSeed.wineLots || []), wineLot]
    writeLocalSeed({ ...localSeed, harvestLots, wineLots })
    return { harvestLot, wineLot }
  }

  static addFermentationReading(reading: FermentationReading) {
    const localSeed = readLocalSeed()
    const fermentationReadings = [...(localSeed.fermentationReadings || []), reading]
    writeLocalSeed({ ...localSeed, fermentationReadings })
    return reading
  }
}
