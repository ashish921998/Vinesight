import { z } from 'zod'

// Common validation patterns with comprehensive XSS protection
export const sanitizeString = (str: string): string => {
  // Sanitize first 10001 characters (for edge cases), then truncate to 10000
  const toSanitize = str.substring(0, 10001)
  
  const sanitized = (
    toSanitize
      .trim()
      // Remove all HTML tags and potentially dangerous content
      .replace(/<[^>]*>/g, '')
      // Remove javascript: and data: URIs
      .replace(/javascript:/gi, '')
      .replace(/data:/gi, '')
      .replace(/vbscript:/gi, '')
      // Remove event handlers
      .replace(/on\w+\s*=/gi, '')
      // Remove SQL injection attempts
      .replace(/(\b(ALTER|CREATE|DELETE|DROP|EXEC(UTE)?|INSERT|SELECT|UNION|UPDATE)\b)/gi, '')
  )
  
  // Return sanitized result truncated to 10000 characters
  return sanitized.substring(0, 10000)
}

// Additional security for database queries
export const sanitizeForSQL = (str: string): string => {
  return (
    sanitizeString(str)
      // Escape single quotes
      .replace(/'/g, "''")
      // Remove or escape other SQL metacharacters
      .replace(/;/g, '')
      .replace(/--/g, '')
      .replace(/\/\*/g, '')
      .replace(/\*\//g, '')
  )
}

// Enhanced HTML entity encoding for display
export const encodeForHTML = (str: string): string => {
  return sanitizeString(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
}

// Farm validation schema with enhanced security
export const FarmSchema = z.object({
  name: z
    .string()
    .min(1, 'Farm name is required')
    .max(50, 'Farm name must be less than 50 characters') // Reduced limit
    .regex(/^[a-zA-Z0-9\s\-._]+$/, 'Farm name contains invalid characters')
    .transform(sanitizeString)
    .refine((val) => val.trim().length > 0, 'Farm name cannot be empty'),
  region: z
    .string()
    .min(1, 'Region is required')
    .max(50, 'Region must be less than 50 characters')
    .regex(/^[a-zA-Z0-9\s\-.,]+$/, 'Region contains invalid characters')
    .transform(sanitizeString),
  area: z
    .number()
    .min(0.01, 'Area must be greater than 0')
    .max(25000, 'Area must be less than 25,000 acres')
    .finite('Area must be a valid number'),
  grape_variety: z
    .string()
    .min(1, 'Grape variety is required')
    .max(50, 'Grape variety must be less than 50 characters')
    .regex(/^[a-zA-Z0-9\s\-]+$/, 'Grape variety contains invalid characters')
    .transform(sanitizeString),
  planting_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD required)')
    .refine((val) => {
      const date = new Date(val)
      const now = new Date()
      const hundredYearsAgo = new Date(now.getFullYear() - 100, now.getMonth(), now.getDate())
      return date <= now && date >= hundredYearsAgo
    }, 'Planting date must be within the last 100 years and not in the future'),
  vine_spacing: z
    .number()
    .min(0.5, 'Vine spacing must be at least 0.5 meters')
    .max(10, 'Vine spacing must be less than 10 meters')
    .finite('Vine spacing must be a valid number'),
  row_spacing: z
    .number()
    .min(1, 'Row spacing must be at least 1 meter')
    .max(20, 'Row spacing must be less than 20 meters')
    .finite('Row spacing must be a valid number')
})

// Irrigation record validation
export const IrrigationSchema = z.object({
  farm_id: z.number().int().positive('Invalid farm ID'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
  duration: z
    .number()
    .min(0.1, 'Duration must be at least 0.1 hours')
    .max(24, 'Duration cannot exceed 24 hours'),
  area: z.number().min(0.01, 'Area must be greater than 0').max(25000, 'Area too large'),
  growth_stage: z.enum([
    'dormant',
    'budbreak',
    'flowering',
    'fruit_set',
    'veraison',
    'harvest',
    'post_harvest'
  ]),
  moisture_status: z.string().min(1, 'Moisture status is required').max(50),
  system_discharge: z
    .number()
    .min(1, 'System discharge must be at least 1 L/h')
    .max(10000, 'System discharge too high'),
  notes: z.string().max(500, 'Notes too long').optional()
})

// Spray record validation
export const SpraySchema = z.object({
  farm_id: z.number().int().positive('Invalid farm ID'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
  pest_disease: z
    .string()
    .min(1, 'Pest/disease is required')
    .max(100, 'Pest/disease name too long'),
  chemical: z.string().min(1, 'Chemical is required').max(100, 'Chemical name too long'),
  dose: z.string().min(1, 'Dose is required').max(50, 'Dose description too long'),
  area: z.number().min(0.01, 'Area must be greater than 0').max(25000, 'Area too large'),
  weather: z
    .string()
    .min(1, 'Weather conditions required')
    .max(100, 'Weather description too long'),
  operator: z.string().min(1, 'Operator name required').max(100, 'Operator name too long'),
  notes: z.string().max(500, 'Notes too long').optional()
})

// Harvest record validation
export const HarvestSchema = z.object({
  farm_id: z.number().int().positive('Invalid farm ID'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
  quantity: z
    .number()
    .min(0.1, 'Quantity must be greater than 0')
    .max(1000000, 'Quantity too large'),
  grade: z.string().min(1, 'Grade is required').max(50, 'Grade name too long'),
  price: z.number().min(0, 'Price cannot be negative').max(10000, 'Price too high').optional(),
  buyer: z.string().max(100, 'Buyer name too long').optional(),
  notes: z.string().max(500, 'Notes too long').optional()
})

// Task reminder validation
export const TaskReminderSchema = z.object({
  farm_id: z.number().int().positive('Invalid farm ID'),
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  description: z.string().max(1000, 'Description too long').optional(),
  due_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
  type: z.enum(['irrigation', 'spray', 'fertigation', 'training', 'harvest', 'other']),
  priority: z.enum(['low', 'medium', 'high']),
  completed: z.boolean()
})

// Expense record validation
export const ExpenseSchema = z.object({
  farm_id: z.number().int().positive('Invalid farm ID'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
  type: z.enum(['labor', 'materials', 'equipment', 'other']),
  description: z.string().min(1, 'Description is required').max(200, 'Description too long'),
  cost: z.number().min(0, 'Cost cannot be negative').max(10000000, 'Cost too high'),
  remarks: z.string().max(500, 'Remarks too long').optional()
})

// ETc Calculator input validation
export const ETcInputSchema = z.object({
  temperatureMax: z.number().min(-10, 'Temperature too low').max(60, 'Temperature too high'),
  temperatureMin: z.number().min(-20, 'Temperature too low').max(50, 'Temperature too high'),
  humidity: z
    .number()
    .min(0, 'Humidity cannot be negative')
    .max(100, 'Humidity cannot exceed 100%'),
  windSpeed: z.number().min(0, 'Wind speed cannot be negative').max(50, 'Wind speed too high'),
  rainfall: z
    .number()
    .min(0, 'Rainfall cannot be negative')
    .max(1000, 'Rainfall too high')
    .optional()
})

// Validation helper functions
export function validateAndSanitize<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: string[] } {
  try {
    // Sanitize string fields if present
    const sanitizedData =
      typeof data === 'object' && data !== null
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

// Enhanced rate limiting with security features
export class SecurityRateLimiter {
  private requests: Map<string, number[]> = new Map()
  private blockedIPs: Set<string> = new Set()
  private suspiciousActivity: Map<string, number> = new Map()

  constructor(
    private maxRequests: number = 50, // Reduced from 100
    private windowMs: number = 60 * 1000, // 1 minute
    private blockDurationMs: number = 15 * 60 * 1000, // 15 minutes
    private maxSuspiciousActivity: number = 3
  ) {}

  checkLimit(
    identifier: string,
    isAuthenticated: boolean = false
  ): { allowed: boolean; reason?: string } {
    const now = Date.now()

    // Check if IP is temporarily blocked
    if (this.blockedIPs.has(identifier)) {
      return { allowed: false, reason: 'IP temporarily blocked due to suspicious activity' }
    }

    // Authenticated users get higher limits
    const effectiveMaxRequests = isAuthenticated ? this.maxRequests * 2 : this.maxRequests

    const requests = this.requests.get(identifier) || []

    // Remove old requests outside the window
    const validRequests = requests.filter((time) => now - time < this.windowMs)

    if (validRequests.length >= effectiveMaxRequests) {
      // Track suspicious activity
      const suspiciousCount = (this.suspiciousActivity.get(identifier) || 0) + 1
      this.suspiciousActivity.set(identifier, suspiciousCount)

      // Block IP after repeated violations
      if (suspiciousCount >= this.maxSuspiciousActivity) {
        this.blockedIPs.add(identifier)
        // Auto-unblock after duration
        setTimeout(() => {
          this.blockedIPs.delete(identifier)
          this.suspiciousActivity.delete(identifier)
        }, this.blockDurationMs)
      }

      return { allowed: false, reason: 'Rate limit exceeded' }
    }

    // Add current request
    validRequests.push(now)
    this.requests.set(identifier, validRequests)

    return { allowed: true }
  }

  // Method to clear expired data periodically
  cleanup(): void {
    const now = Date.now()
    for (const [identifier, requests] of this.requests.entries()) {
      const validRequests = requests.filter((time) => now - time < this.windowMs)
      if (validRequests.length === 0) {
        this.requests.delete(identifier)
      } else {
        this.requests.set(identifier, validRequests)
      }
    }
  }
}

export const globalRateLimiter = new SecurityRateLimiter()

// CSRF protection helper
export const generateCSRFToken = (): string => {
  const array = new Uint8Array(32)
  if (typeof window !== 'undefined' && window.crypto) {
    window.crypto.getRandomValues(array)
  } else {
    // Fallback for server-side
    for (let i = 0; i < array.length; i++) {
      array[i] = Math.floor(Math.random() * 256)
    }
  }
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('')
}

// Content validation to prevent dangerous file uploads
export const validateFileContent = (
  fileName: string,
  fileSize: number
): { valid: boolean; reason?: string } => {
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.pdf', '.csv', '.xlsx']
  const maxFileSize = 10 * 1024 * 1024 // 10MB

  const extension = fileName.toLowerCase().substring(fileName.lastIndexOf('.'))

  if (!allowedExtensions.includes(extension)) {
    return { valid: false, reason: 'File type not allowed' }
  }

  if (fileSize > maxFileSize) {
    return { valid: false, reason: 'File size too large (max 10MB)' }
  }

  return { valid: true }
}
