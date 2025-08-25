import { db } from './database';
import type { Farm, IrrigationRecord, SprayRecord, HarvestRecord, TaskReminder, ExpenseRecord, FertigationRecord } from './database';

// Export types for use in other files
export type { Farm, IrrigationRecord, SprayRecord, HarvestRecord, TaskReminder, ExpenseRecord, FertigationRecord } from './database';

export class DatabaseService {
  // Get database instance
  static async getDatabase() {
    return db;
  }

  // Clear all data and reset database (use with caution)
  static async resetDatabase(): Promise<void> {
    try {
      await db.delete();
      console.log('Database reset successfully');
      // Reopen database with new schema
      await db.open();
    } catch (error) {
      console.error('Error resetting database:', error);
    }
  }

  // Farm operations
  static async getAllFarms(): Promise<Farm[]> {
    return await db.farms.orderBy('createdAt').toArray();
  }

  static async getFarmById(id: number): Promise<Farm | undefined> {
    return await db.farms.get(id);
  }

  static async createFarm(farm: Omit<Farm, 'id' | 'createdAt' | 'updatedAt'>): Promise<number> {
    const now = new Date();
    return await db.farms.add({
      ...farm,
      createdAt: now,
      updatedAt: now
    });
  }

  static async updateFarm(id: number, updates: Partial<Farm>): Promise<number> {
    return await db.farms.update(id, {
      ...updates,
      updatedAt: new Date()
    });
  }

  static async deleteFarm(id: number): Promise<void> {
    await db.transaction('rw', [
      db.farms,
      db.irrigationRecords,
      db.sprayRecords,
      db.fertigationRecords,
      db.harvestRecords,
      db.expenseRecords,
      db.calculationHistory,
      db.taskReminders,
      db.soilTestRecords
    ], async () => {
      await db.farms.delete(id);
      await db.irrigationRecords.where('farmId').equals(id).delete();
      await db.sprayRecords.where('farmId').equals(id).delete();
      await db.fertigationRecords.where('farmId').equals(id).delete();
      await db.harvestRecords.where('farmId').equals(id).delete();
      await db.expenseRecords.where('farmId').equals(id).delete();
      await db.calculationHistory.where('farmId').equals(id).delete();
      await db.taskReminders.where('farmId').equals(id).delete();
      await db.soilTestRecords.where('farmId').equals(id).delete();
    });
  }

  // Irrigation operations
  static async getIrrigationRecords(farmId: number): Promise<IrrigationRecord[]> {
    const records = await db.irrigationRecords
      .where('farmId')
      .equals(farmId)
      .toArray();
    return records.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  static async addIrrigationRecord(record: Omit<IrrigationRecord, 'id' | 'createdAt'>): Promise<number> {
    return await db.irrigationRecords.add({
      ...record,
      createdAt: new Date()
    });
  }

  // Spray operations
  static async getSprayRecords(farmId: number): Promise<SprayRecord[]> {
    const records = await db.sprayRecords
      .where('farmId')
      .equals(farmId)
      .toArray();
    return records.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  static async addSprayRecord(record: Omit<SprayRecord, 'id' | 'createdAt'>): Promise<number> {
    return await db.sprayRecords.add({
      ...record,
      createdAt: new Date()
    });
  }

  // Fertigation operations
  static async getFertigationRecords(farmId: number): Promise<FertigationRecord[]> {
    const records = await db.fertigationRecords
      .where('farmId')
      .equals(farmId)
      .toArray();
    return records.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  static async addFertigationRecord(record: Omit<FertigationRecord, 'id' | 'createdAt'>): Promise<number> {
    return await db.fertigationRecords.add({
      ...record,
      createdAt: new Date()
    });
  }

  // Harvest operations
  static async getHarvestRecords(farmId: number): Promise<HarvestRecord[]> {
    const records = await db.harvestRecords
      .where('farmId')
      .equals(farmId)
      .toArray();
    return records.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  static async addHarvestRecord(record: Omit<HarvestRecord, 'id' | 'createdAt'>): Promise<number> {
    return await db.harvestRecords.add({
      ...record,
      createdAt: new Date()
    });
  }

  // Expense operations
  static async getExpenseRecords(farmId: number): Promise<ExpenseRecord[]> {
    const records = await db.expenseRecords
      .where('farmId')
      .equals(farmId)
      .toArray();
    return records.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  static async addExpenseRecord(record: Omit<ExpenseRecord, 'id' | 'createdAt'>): Promise<number> {
    return await db.expenseRecords.add({
      ...record,
      createdAt: new Date()
    });
  }

  // Task and reminder operations
  static async getTaskReminders(farmId: number): Promise<TaskReminder[]> {
    const tasks = await db.taskReminders
      .where('farmId')
      .equals(farmId)
      .toArray();
    
    // Sort by dueDate
    return tasks.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  }

  static async getPendingTasks(farmId: number): Promise<TaskReminder[]> {
    const tasks = await db.taskReminders
      .where('farmId')
      .equals(farmId)
      .and(task => !task.completed)
      .toArray();
    
    // Sort by dueDate
    return tasks.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  }

  static async addTaskReminder(task: Omit<TaskReminder, 'id' | 'createdAt'>): Promise<number> {
    return await db.taskReminders.add({
      ...task,
      createdAt: new Date()
    });
  }

  static async completeTask(id: number): Promise<number> {
    return await db.taskReminders.update(id, {
      completed: true,
      completedAt: new Date()
    });
  }

  // Export data functions
  static async exportFarmData(farmId: number) {
    const farm = await this.getFarmById(farmId);
    const irrigation = await this.getIrrigationRecords(farmId);
    const sprays = await this.getSprayRecords(farmId);
    const harvests = await this.getHarvestRecords(farmId);
    
    return {
      farm,
      irrigation,
      sprays,
      harvests
    };
  }

  // Dashboard summary
  static async getDashboardSummary(farmId: number) {
    const farm = await this.getFarmById(farmId);
    const pendingTasks = await this.getPendingTasks(farmId);
    const allIrrigations = await db.irrigationRecords
      .where('farmId')
      .equals(farmId)
      .toArray();
    
    // Sort by date manually and take the 5 most recent
    const recentIrrigations = allIrrigations
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);
    
    const harvestRecords = await db.harvestRecords
      .where('farmId')
      .equals(farmId)
      .toArray();
    
    const totalHarvest = harvestRecords.reduce((sum, record) => sum + record.quantity, 0);

    return {
      farm,
      pendingTasksCount: pendingTasks.length,
      recentIrrigations,
      totalHarvest,
      pendingTasks: pendingTasks.slice(0, 3) // Show top 3 pending tasks
    };
  }
}

// Seed data for testing
export const seedData = {
  farms: [
    {
      name: "Nashik Vineyard Main",
      region: "Nashik, Maharashtra",
      area: 2.5,
      grapeVariety: "Thompson Seedless",
      plantingDate: "2020-03-15",
      vineSpacing: 3,
      rowSpacing: 9
    },
    {
      name: "Pune Valley Farm",
      region: "Pune, Maharashtra", 
      area: 1.8,
      grapeVariety: "Flame Seedless",
      plantingDate: "2019-11-20",
      vineSpacing: 2.5,
      rowSpacing: 8
    },
    {
      name: "Sangli Export Vineyard",
      region: "Sangli, Maharashtra",
      area: 4.2,
      grapeVariety: "Red Globe",
      plantingDate: "2018-12-10",
      vineSpacing: 3.5,
      rowSpacing: 10
    }
  ],
  
  irrigationRecords: [
    {
      farmId: 1,
      date: "2024-08-20",
      duration: 4,
      area: 2.5,
      growthStage: "Fruit Development",
      moistureStatus: "Dry",
      systemDischarge: 150,
      notes: "Pre-harvest irrigation"
    },
    {
      farmId: 1,
      date: "2024-08-15",
      duration: 3.5,
      area: 2.5,
      growthStage: "Fruit Development",
      moistureStatus: "Moderate",
      systemDischarge: 150,
      notes: "Regular irrigation schedule"
    },
    {
      farmId: 2,
      date: "2024-08-19",
      duration: 3,
      area: 1.8,
      growthStage: "Berry Formation",
      moistureStatus: "Dry",
      systemDischarge: 120,
      notes: "Increased frequency due to heat"
    }
  ],
  
  sprayRecords: [
    {
      farmId: 1,
      date: "2024-08-18",
      pestDisease: "Powdery Mildew",
      chemical: "Sulfur Dust",
      dose: "2kg/acre",
      area: 2.5,
      weather: "Clear, Low humidity",
      operator: "Ramesh Kumar"
    },
    {
      farmId: 1,
      date: "2024-08-10",
      pestDisease: "Downy Mildew",
      chemical: "Copper Oxychloride",
      dose: "2.5g/L",
      area: 2.5,
      weather: "Cloudy, High humidity",
      operator: "Suresh Patil"
    },
    {
      farmId: 2,
      date: "2024-08-17",
      pestDisease: "Thrips",
      chemical: "Fipronil 5% SC",
      dose: "1ml/L",
      area: 1.8,
      weather: "Clear morning",
      operator: "Ganesh More"
    }
  ],

  harvestRecords: [
    {
      farmId: 1,
      date: "2024-02-15",
      quantity: 3200,
      grade: "Export Premium",
      price: 85,
      buyer: "Maharashtra Grape Export Co.",
      notes: "Excellent sugar content 22 Brix"
    },
    {
      farmId: 1,
      date: "2024-02-20",
      quantity: 1800,
      grade: "Local Premium",
      price: 65,
      buyer: "Local Market",
      notes: "Second harvest - good quality"
    },
    {
      farmId: 2,
      date: "2024-02-18",
      quantity: 2100,
      grade: "Export",
      price: 78,
      buyer: "Pune Exporters",
      notes: "Flame variety - good color"
    }
  ],
  
  taskReminders: [
    {
      farmId: 1,
      title: "Pruning - Winter",
      description: "Winter pruning for next season preparation",
      dueDate: "2024-12-15",
      type: "other" as const,
      completed: false,
      priority: "medium" as const
    },
    {
      farmId: 1,
      title: "Soil Testing",
      description: "Annual soil analysis for nutrient management",
      dueDate: "2024-09-30",
      type: "other" as const,
      completed: false,
      priority: "high" as const
    },
    {
      farmId: 2,
      title: "Irrigation System Check",
      description: "Check drippers and clean filters",
      dueDate: "2024-09-05",
      type: "irrigation" as const,
      completed: false,
      priority: "medium" as const
    }
  ]
};

export async function initializeSeedData(): Promise<void> {
  try {
    const farmCount = await db.farms.count();
    
    if (farmCount === 0) {
      // Add farms first
      const farmIds: number[] = [];
      for (const farmData of seedData.farms) {
        const id = await DatabaseService.createFarm(farmData);
        farmIds.push(id);
      }
      
      // Add related records with correct farmIds
      for (const irrigationData of seedData.irrigationRecords) {
        await DatabaseService.addIrrigationRecord({
          ...irrigationData,
          farmId: farmIds[irrigationData.farmId - 1]
        });
      }
      
      for (const sprayData of seedData.sprayRecords) {
        await DatabaseService.addSprayRecord({
          ...sprayData,
          farmId: farmIds[sprayData.farmId - 1]
        });
      }
      
      for (const harvestData of seedData.harvestRecords) {
        await DatabaseService.addHarvestRecord({
          ...harvestData,
          farmId: farmIds[harvestData.farmId - 1]
        });
      }
      
      for (const taskData of seedData.taskReminders) {
        await DatabaseService.addTaskReminder({
          ...taskData,
          farmId: farmIds[taskData.farmId - 1]
        });
      }
      
      console.log('Seed data initialized successfully');
    }
  } catch (error) {
    console.error('Error initializing seed data:', error);
  }
}