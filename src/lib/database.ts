import Dexie, { Table } from 'dexie';

export interface Farm {
  id?: number;
  name: string;
  region: string;
  area: number; // in hectares
  grapeVariety: string;
  plantingDate: string;
  vineSpacing: number; // in meters
  rowSpacing: number; // in meters
  createdAt: Date;
  updatedAt: Date;
}

export interface IrrigationRecord {
  id?: number;
  farmId: number;
  date: string;
  duration: number; // in hours
  area: number; // area irrigated in hectares
  growthStage: string;
  moistureStatus: string;
  systemDischarge: number; // in liters per hour
  notes?: string;
  createdAt: Date;
}

export interface SprayRecord {
  id?: number;
  farmId: number;
  date: string;
  pestDisease: string;
  chemical: string;
  dose: string;
  area: number; // in hectares
  weather: string;
  operator: string;
  notes?: string;
  createdAt: Date;
}

export interface FertigationRecord {
  id?: number;
  farmId: number;
  date: string;
  fertilizer: string;
  dose: string;
  purpose: string;
  area: number; // in hectares
  notes?: string;
  createdAt: Date;
}

export interface HarvestRecord {
  id?: number;
  farmId: number;
  date: string;
  quantity: number; // in kg
  grade: string;
  price?: number; // per kg
  buyer?: string;
  notes?: string;
  createdAt: Date;
}

export interface ExpenseRecord {
  id?: number;
  farmId: number;
  date: string;
  type: 'labor' | 'materials' | 'equipment' | 'other';
  description: string;
  cost: number;
  remarks?: string;
  createdAt: Date;
}

export interface CalculationHistory {
  id?: number;
  farmId: number;
  calculationType: 'etc' | 'nutrients' | 'lai' | 'discharge';
  inputs: Record<string, any>;
  outputs: Record<string, any>;
  date: string;
  createdAt: Date;
}

export interface TaskReminder {
  id?: number;
  farmId: number;
  title: string;
  description?: string;
  dueDate: string;
  type: 'irrigation' | 'spray' | 'fertigation' | 'training' | 'harvest' | 'other';
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  createdAt: Date;
  completedAt?: Date;
}

export interface SoilTestRecord {
  id?: number;
  farmId: number;
  date: string;
  parameters: Record<string, number>; // pH, N, P, K, etc.
  recommendations?: string;
  notes?: string;
  createdAt: Date;
}

export interface OfflineAction {
  id?: number;
  type: 'CREATE' | 'UPDATE' | 'DELETE';
  tableName: string;
  data: any;
  localId?: string;
  serverId?: string;
  timestamp: Date;
  synced: boolean;
  retryCount: number;
}

export class VineSightDatabase extends Dexie {
  farms!: Table<Farm>;
  irrigationRecords!: Table<IrrigationRecord>;
  sprayRecords!: Table<SprayRecord>;
  fertigationRecords!: Table<FertigationRecord>;
  harvestRecords!: Table<HarvestRecord>;
  expenseRecords!: Table<ExpenseRecord>;
  calculationHistory!: Table<CalculationHistory>;
  taskReminders!: Table<TaskReminder>;
  soilTestRecords!: Table<SoilTestRecord>;
  offline_actions!: Table<OfflineAction>;

  constructor() {
    super('VineSightDatabase');
    
    // Version 1 - Original schema
    this.version(1).stores({
      farms: '++id, name, region, grapeVariety, createdAt',
      irrigationRecords: '++id, farmId, date, createdAt',
      sprayRecords: '++id, farmId, date, createdAt',
      fertigationRecords: '++id, farmId, date, createdAt',
      harvestRecords: '++id, farmId, date, createdAt',
      expenseRecords: '++id, farmId, date, type, createdAt',
      calculationHistory: '++id, farmId, calculationType, date, createdAt',
      taskReminders: '++id, farmId, dueDate, type, completed, createdAt',
      soilTestRecords: '++id, farmId, date, createdAt'
    });

    // Version 2 - Add offline actions table
    this.version(2).stores({
      farms: '++id, name, region, grapeVariety, createdAt',
      irrigationRecords: '++id, farmId, date, createdAt',
      sprayRecords: '++id, farmId, date, createdAt',
      fertigationRecords: '++id, farmId, date, createdAt',
      harvestRecords: '++id, farmId, date, createdAt',
      expenseRecords: '++id, farmId, date, type, createdAt',
      calculationHistory: '++id, farmId, calculationType, date, createdAt',
      taskReminders: '++id, farmId, dueDate, type, completed, createdAt',
      soilTestRecords: '++id, farmId, date, createdAt',
      offline_actions: '++id, type, tableName, timestamp, synced, retryCount'
    });
  }
}

export const db = new VineSightDatabase();