import { z } from 'zod'

// Common validation patterns
export const sanitizeString = (str: string): string => {
  return str.trim().replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
}

// Farm validation schema
export const FarmSchema = z.object({
  name: z.string()
    .min(1, "Farm name is required")
    .max(100, "Farm name must be less than 100 characters")
    .refine(val => val.trim().length > 0, "Farm name cannot be empty"),
  region: z.string()
    .min(1, "Region is required")
    .max(100, "Region must be less than 100 characters"),
  area: z.number()
    .min(0.01, "Area must be greater than 0")
    .max(10000, "Area must be less than 10,000 hectares"),
  grape_variety: z.string()
    .min(1, "Grape variety is required")
    .max(100, "Grape variety must be less than 100 characters"),
  planting_date: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format")
    .refine(val => new Date(val) <= new Date(), "Planting date cannot be in the future"),
  vine_spacing: z.number()
    .min(0.5, "Vine spacing must be at least 0.5 meters")
    .max(10, "Vine spacing must be less than 10 meters"),
  row_spacing: z.number()
    .min(1, "Row spacing must be at least 1 meter")
    .max(20, "Row spacing must be less than 20 meters")
})

// Irrigation record validation
export const IrrigationSchema = z.object({
  farm_id: z.number().int().positive("Invalid farm ID"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
  duration: z.number()
    .min(0.1, "Duration must be at least 0.1 hours")
    .max(24, "Duration cannot exceed 24 hours"),
  area: z.number()
    .min(0.01, "Area must be greater than 0")
    .max(10000, "Area too large"),
  growth_stage: z.enum(['dormant', 'budbreak', 'flowering', 'fruit_set', 'veraison', 'harvest', 'post_harvest']),
  moisture_status: z.string().min(1, "Moisture status is required").max(50),
  system_discharge: z.number()
    .min(1, "System discharge must be at least 1 L/h")
    .max(10000, "System discharge too high"),
  notes: z.string().max(500, "Notes too long").optional()
})

// Spray record validation
export const SpraySchema = z.object({
  farm_id: z.number().int().positive("Invalid farm ID"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
  pest_disease: z.string()
    .min(1, "Pest/disease is required")
    .max(100, "Pest/disease name too long"),
  chemical: z.string()
    .min(1, "Chemical is required")
    .max(100, "Chemical name too long"),
  dose: z.string()
    .min(1, "Dose is required")
    .max(50, "Dose description too long"),
  area: z.number()
    .min(0.01, "Area must be greater than 0")
    .max(10000, "Area too large"),
  weather: z.string()
    .min(1, "Weather conditions required")
    .max(100, "Weather description too long"),
  operator: z.string()
    .min(1, "Operator name required")
    .max(100, "Operator name too long"),
  notes: z.string().max(500, "Notes too long").optional()
})

// Harvest record validation
export const HarvestSchema = z.object({
  farm_id: z.number().int().positive("Invalid farm ID"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
  quantity: z.number()
    .min(0.1, "Quantity must be greater than 0")
    .max(1000000, "Quantity too large"),
  grade: z.string()
    .min(1, "Grade is required")
    .max(50, "Grade name too long"),
  price: z.number()
    .min(0, "Price cannot be negative")
    .max(10000, "Price too high")
    .optional(),
  buyer: z.string().max(100, "Buyer name too long").optional(),
  notes: z.string().max(500, "Notes too long").optional()
})

// Task reminder validation
export const TaskReminderSchema = z.object({
  farm_id: z.number().int().positive("Invalid farm ID"),
  title: z.string()
    .min(1, "Title is required")
    .max(200, "Title too long"),
  description: z.string().max(1000, "Description too long").optional(),
  due_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
  type: z.enum(['irrigation', 'spray', 'fertigation', 'training', 'harvest', 'other']),
  priority: z.enum(['low', 'medium', 'high']),
  completed: z.boolean()
})

// Expense record validation
export const ExpenseSchema = z.object({
  farm_id: z.number().int().positive("Invalid farm ID"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
  type: z.enum(['labor', 'materials', 'equipment', 'other']),
  description: z.string()
    .min(1, "Description is required")
    .max(200, "Description too long"),
  cost: z.number()
    .min(0, "Cost cannot be negative")
    .max(10000000, "Cost too high"),
  remarks: z.string().max(500, "Remarks too long").optional()
})

// ETc Calculator input validation
export const ETcInputSchema = z.object({
  temperatureMax: z.number()
    .min(-10, "Temperature too low")
    .max(60, "Temperature too high"),
  temperatureMin: z.number()
    .min(-20, "Temperature too low")
    .max(50, "Temperature too high"),
  humidity: z.number()
    .min(0, "Humidity cannot be negative")
    .max(100, "Humidity cannot exceed 100%"),
  windSpeed: z.number()
    .min(0, "Wind speed cannot be negative")
    .max(50, "Wind speed too high"),
  rainfall: z.number()
    .min(0, "Rainfall cannot be negative")
    .max(1000, "Rainfall too high")
    .optional()
})

// Validation helper functions
export function validateAndSanitize<T>(
  schema: z.ZodSchema<T>, 
  data: unknown
): { success: true; data: T } | { success: false; errors: string[] } {
  try {
    // Sanitize string fields if present
    const sanitizedData = typeof data === 'object' && data !== null 
      ? sanitizeObjectStrings(data as Record<string, any>)
      : data

    const result = schema.parse(sanitizedData)
    return { success: true, data: result }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { 
        success: false, 
        errors: error.issues.map((err: any) => `${err.path.join('.')}: ${err.message}`)
      }
    }
    return { success: false, errors: ['Validation failed'] }
  }
}

function sanitizeObjectStrings(obj: Record<string, any>): Record<string, any> {
  const sanitized: Record<string, any> = {}
  
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeString(value)
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeObjectStrings(value)
    } else {
      sanitized[key] = value
    }
  }
  
  return sanitized
}

// Rate limiting helper (basic implementation)
export class RateLimiter {
  private requests: Map<string, number[]> = new Map()
  
  constructor(
    private maxRequests: number = 100,
    private windowMs: number = 60 * 1000 // 1 minute
  ) {}
  
  checkLimit(identifier: string): boolean {
    const now = Date.now()
    const requests = this.requests.get(identifier) || []
    
    // Remove old requests outside the window
    const validRequests = requests.filter(time => now - time < this.windowMs)
    
    if (validRequests.length >= this.maxRequests) {
      return false // Rate limit exceeded
    }
    
    // Add current request
    validRequests.push(now)
    this.requests.set(identifier, validRequests)
    
    return true // Request allowed
  }
}

export const globalRateLimiter = new RateLimiter()