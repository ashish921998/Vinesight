/**
 * Server Actions for VineSight
 *
 * This module provides all server actions for the application.
 * Server actions provide a simpler, more direct way to perform
 * server-side operations compared to API routes.
 *
 * Benefits:
 * - Type-safe function calls without fetch()
 * - Automatic CSRF protection
 * - Progressive enhancement support
 * - Built-in revalidation with revalidatePath()
 * - Reduced client bundle size
 */

// Farm operations
export {
  createFarm,
  updateFarm,
  deleteFarm,
  getAllFarms,
  getFarmById
} from './farms'

// Task management
export {
  createTask,
  updateTask,
  deleteTask,
  completeTask,
  getTasksByFarm
} from './tasks'

// Record operations
export {
  // Irrigation
  createIrrigationRecord,
  updateIrrigationRecord,
  deleteIrrigationRecord,
  // Spray
  createSprayRecord,
  updateSprayRecord,
  deleteSprayRecord,
  // Harvest
  createHarvestRecord,
  updateHarvestRecord,
  deleteHarvestRecord,
  // Fertigation
  createFertigationRecord,
  updateFertigationRecord,
  deleteFertigationRecord,
  // Expense
  createExpenseRecord,
  updateExpenseRecord,
  deleteExpenseRecord
} from './records'

// Test records and notes
export {
  // Soil tests
  createSoilTestRecord,
  updateSoilTestRecord,
  deleteSoilTestRecord,
  // Petiole tests
  createPetioleTestRecord,
  updatePetioleTestRecord,
  deletePetioleTestRecord,
  // Daily notes
  createDailyNote,
  updateDailyNote,
  deleteDailyNote
} from './tests-and-notes'

// File uploads
export {
  getSignedUploadUrl,
  uploadTestReport
} from './uploads'

// AI insights
export {
  generateWeatherInsights,
  generateFinancialAnalysis,
  generateGrowthAnalysis
} from './ai-insights'

// Type exports for convenience
export type { WeatherInsightData, FinancialAnalysisData, GrowthAnalysisData } from './ai-insights'
