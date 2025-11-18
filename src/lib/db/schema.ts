import {
  pgTable,
  serial,
  text,
  integer,
  decimal,
  timestamp,
  uuid,
  real,
  jsonb,
  date,
  boolean
} from 'drizzle-orm/pg-core'

// Farms table
export const farms = pgTable('farms', {
  id: serial('id').primaryKey(),
  userId: uuid('user_id').notNull(),
  name: text('name').notNull(),
  location: text('location'),
  area: real('area'), // in acres
  grapeVariety: text('grape_variety'),
  plantingDate: date('planting_date'),
  dateOfPruning: date('date_of_pruning'),
  systemDischarge: real('system_discharge'), // L/h
  remainingWater: real('remaining_water'), // in liters
  waterCalculationUpdatedAt: timestamp('water_calculation_updated_at', {
    withTimezone: true,
    mode: 'string'
  }),
  soilType: text('soil_type'),
  irrigationSystem: text('irrigation_system'),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow()
})

// Irrigation records table
export const irrigationRecords = pgTable('irrigation_records', {
  id: serial('id').primaryKey(),
  farmId: integer('farm_id')
    .notNull()
    .references(() => farms.id, { onDelete: 'cascade' }),
  date: date('date').notNull(),
  duration: real('duration').notNull(), // hours
  area: real('area').notNull(), // acres
  growthStage: text('growth_stage').notNull(),
  moistureStatus: text('moisture_status').notNull(),
  systemDischarge: real('system_discharge').notNull(), // L/h
  dateOfPruning: date('date_of_pruning'),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow()
})

// Spray records table
export const sprayRecords = pgTable('spray_records', {
  id: serial('id').primaryKey(),
  farmId: integer('farm_id')
    .notNull()
    .references(() => farms.id, { onDelete: 'cascade' }),
  date: date('date').notNull(),
  chemical: text('chemical'),
  dose: text('dose'),
  quantityAmount: real('quantity_amount').notNull(),
  quantityUnit: text('quantity_unit').notNull(), // 'gm/L' | 'ml/L' | 'ppm'
  waterVolume: real('water_volume'), // liters
  chemicals: jsonb('chemicals'), // array of {name, quantity, unit}
  area: real('area').notNull(), // acres
  weather: text('weather').notNull(),
  operator: text('operator').notNull(),
  dateOfPruning: date('date_of_pruning'),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow()
})

// Fertigation records table
export const fertigationRecords = pgTable('fertigation_records', {
  id: serial('id').primaryKey(),
  farmId: integer('farm_id')
    .notNull()
    .references(() => farms.id, { onDelete: 'cascade' }),
  date: date('date').notNull(),
  fertilizers: jsonb('fertilizers'), // array of {name, quantity, unit}
  area: real('area'),
  dateOfPruning: date('date_of_pruning'),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow()
})

// Harvest records table
export const harvestRecords = pgTable('harvest_records', {
  id: serial('id').primaryKey(),
  farmId: integer('farm_id')
    .notNull()
    .references(() => farms.id, { onDelete: 'cascade' }),
  date: date('date').notNull(),
  quantity: real('quantity').notNull(), // kg
  grade: text('grade').notNull(),
  price: real('price'), // per kg
  buyer: text('buyer'),
  dateOfPruning: date('date_of_pruning'),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow()
})

// Expense records table
export const expenseRecords = pgTable('expense_records', {
  id: serial('id').primaryKey(),
  farmId: integer('farm_id')
    .notNull()
    .references(() => farms.id, { onDelete: 'cascade' }),
  date: date('date').notNull(),
  type: text('type').notNull(), // 'labor' | 'materials' | 'equipment' | 'other'
  description: text('description').notNull(),
  cost: decimal('cost', { precision: 10, scale: 2 }).notNull(),
  dateOfPruning: date('date_of_pruning'),
  remarks: text('remarks'),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow()
})

// Daily notes table
export const dailyNotes = pgTable('daily_notes', {
  id: serial('id').primaryKey(),
  farmId: integer('farm_id')
    .notNull()
    .references(() => farms.id, { onDelete: 'cascade' }),
  date: date('date').notNull(),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow()
})

// Calculation history table
export const calculationHistory = pgTable('calculation_history', {
  id: serial('id').primaryKey(),
  farmId: integer('farm_id')
    .notNull()
    .references(() => farms.id, { onDelete: 'cascade' }),
  calculationType: text('calculation_type').notNull(), // 'etc' | 'nutrients' | 'lai' | 'discharge'
  inputs: jsonb('inputs').notNull(),
  outputs: jsonb('outputs').notNull(),
  date: date('date').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow()
})

// Task reminders table
export const taskReminders = pgTable('task_reminders', {
  id: serial('id').primaryKey(),
  farmId: integer('farm_id')
    .notNull()
    .references(() => farms.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  description: text('description'),
  taskType: text('task_type').notNull(), // 'irrigation' | 'spray' | 'fertigation' | etc.
  dependencyLogType: text('dependency_log_type'),
  status: text('status').default('pending'), // 'pending' | 'in_progress' | 'completed' | 'cancelled'
  priority: text('priority').default('medium'), // 'low' | 'medium' | 'high'
  dueDate: date('due_date'),
  estimatedDurationMinutes: integer('estimated_duration_minutes'),
  location: text('location'),
  assignedToUserId: uuid('assigned_to_user_id'),
  createdBy: uuid('created_by'),
  linkedRecordType: text('linked_record_type'),
  linkedRecordId: integer('linked_record_id'),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow(),
  completedAt: timestamp('completed_at', { withTimezone: true, mode: 'string' })
})

// Soil test records table
export const soilTestRecords = pgTable('soil_test_records', {
  id: serial('id').primaryKey(),
  farmId: integer('farm_id')
    .notNull()
    .references(() => farms.id, { onDelete: 'cascade' }),
  date: date('date').notNull(),
  parameters: jsonb('parameters').notNull(), // {pH, N, P, K, etc.}
  dateOfPruning: date('date_of_pruning'),
  recommendations: text('recommendations'),
  notes: text('notes'),
  reportUrl: text('report_url'),
  reportStoragePath: text('report_storage_path'),
  reportFilename: text('report_filename'),
  reportType: text('report_type'),
  extractionStatus: text('extraction_status'), // 'pending' | 'success' | 'failed'
  extractionError: text('extraction_error'),
  parsedParameters: jsonb('parsed_parameters'),
  rawNotes: text('raw_notes'),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow()
})

// Petiole test records table
export const petioleTestRecords = pgTable('petiole_test_records', {
  id: serial('id').primaryKey(),
  farmId: integer('farm_id')
    .notNull()
    .references(() => farms.id, { onDelete: 'cascade' }),
  date: date('date').notNull(),
  sampleId: text('sample_id'),
  dateOfPruning: date('date_of_pruning'),
  parameters: jsonb('parameters'),
  recommendations: text('recommendations'),
  notes: text('notes'),
  reportUrl: text('report_url'),
  reportStoragePath: text('report_storage_path'),
  reportFilename: text('report_filename'),
  reportType: text('report_type'),
  extractionStatus: text('extraction_status'), // 'pending' | 'success' | 'failed'
  extractionError: text('extraction_error'),
  parsedParameters: jsonb('parsed_parameters'),
  rawNotes: text('raw_notes'),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow()
})

// AI Conversations table (for AI chatbot)
export const aiConversations = pgTable('ai_conversations', {
  id: serial('id').primaryKey(),
  userId: uuid('user_id').notNull(),
  farmId: integer('farm_id').references(() => farms.id, { onDelete: 'cascade' }),
  title: text('title'),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow()
})

// AI Messages table
export const aiMessages = pgTable('ai_messages', {
  id: serial('id').primaryKey(),
  conversationId: integer('conversation_id')
    .notNull()
    .references(() => aiConversations.id, { onDelete: 'cascade' }),
  role: text('role').notNull(), // 'user' | 'assistant' | 'system'
  content: text('content').notNull(),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow()
})

// AI Alerts table
export const aiAlerts = pgTable('ai_alerts', {
  id: serial('id').primaryKey(),
  userId: uuid('user_id'),
  farmId: integer('farm_id').references(() => farms.id, { onDelete: 'cascade' }),
  alertType: text('alert_type').notNull(),
  title: text('title').notNull(),
  message: text('message').notNull(),
  severity: text('severity'), // 'low' | 'medium' | 'high' | 'critical'
  actionRequired: text('action_required'),
  deadline: timestamp('deadline', { withTimezone: true, mode: 'string' }),
  acknowledged: boolean('acknowledged').default(false),
  acknowledgedAt: timestamp('acknowledged_at', { withTimezone: true, mode: 'string' }),
  resolved: boolean('resolved').default(false),
  resolvedAt: timestamp('resolved_at', { withTimezone: true, mode: 'string' }),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow()
})

// Type exports for use in application code
export type Farm = typeof farms.$inferSelect
export type NewFarm = typeof farms.$inferInsert
export type IrrigationRecord = typeof irrigationRecords.$inferSelect
export type NewIrrigationRecord = typeof irrigationRecords.$inferInsert
export type SprayRecord = typeof sprayRecords.$inferSelect
export type NewSprayRecord = typeof sprayRecords.$inferInsert
export type FertigationRecord = typeof fertigationRecords.$inferSelect
export type NewFertigationRecord = typeof fertigationRecords.$inferInsert
export type HarvestRecord = typeof harvestRecords.$inferSelect
export type NewHarvestRecord = typeof harvestRecords.$inferInsert
export type ExpenseRecord = typeof expenseRecords.$inferSelect
export type NewExpenseRecord = typeof expenseRecords.$inferInsert
export type DailyNote = typeof dailyNotes.$inferSelect
export type NewDailyNote = typeof dailyNotes.$inferInsert
export type CalculationHistory = typeof calculationHistory.$inferSelect
export type NewCalculationHistory = typeof calculationHistory.$inferInsert
export type TaskReminder = typeof taskReminders.$inferSelect
export type NewTaskReminder = typeof taskReminders.$inferInsert
export type SoilTestRecord = typeof soilTestRecords.$inferSelect
export type NewSoilTestRecord = typeof soilTestRecords.$inferInsert
export type PetioleTestRecord = typeof petioleTestRecords.$inferSelect
export type NewPetioleTestRecord = typeof petioleTestRecords.$inferInsert
