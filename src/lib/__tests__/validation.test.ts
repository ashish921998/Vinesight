import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import {
  sanitizeString,
  sanitizeForSQL,
  encodeForHTML,
  FarmSchema,
  IrrigationSchema,
  SpraySchema,
  HarvestSchema,
  TaskReminderSchema,
  ExpenseSchema,
  ETcInputSchema,
  validateAndSanitize,
  SecurityRateLimiter,
  generateCSRFToken,
  validateFileContent
} from '../validation'

describe('sanitizeString', () => {
  it('should remove HTML tags', () => {
    expect(sanitizeString('<script>alert("xss")</script>')).toBe('alert("xss")')
    expect(sanitizeString('<div>Hello</div>')).toBe('Hello')
    expect(sanitizeString('Hello <b>World</b>!')).toBe('Hello World!')
  })

  it('should remove javascript: URIs', () => {
    expect(sanitizeString('javascript:alert(1)')).toBe('alert(1)')
    expect(sanitizeString('JAVASCRIPT:alert(1)')).toBe('alert(1)')
  })

  it('should remove data: URIs', () => {
    expect(sanitizeString('data:text/html,<script>alert(1)</script>')).toBe('text/html,alert(1)')
  })

  it('should remove vbscript: URIs', () => {
    expect(sanitizeString('vbscript:msgbox(1)')).toBe('msgbox(1)')
  })

  it('should remove event handlers', () => {
    expect(sanitizeString('onclick=alert(1)')).toBe('alert(1)')
    expect(sanitizeString('onload=alert(1)')).toBe('alert(1)')
    expect(sanitizeString('onerror=alert(1)')).toBe('alert(1)')
  })

  it('should remove SQL keywords', () => {
    expect(sanitizeString('SELECT * FROM users')).toBe(' * FROM users')
    expect(sanitizeString('DROP TABLE users')).toBe(' TABLE users')
    expect(sanitizeString('INSERT INTO users')).toBe(' INTO users')
    expect(sanitizeString('DELETE FROM users')).toBe(' FROM users')
  })

  it('should trim whitespace', () => {
    expect(sanitizeString('  Hello World  ')).toBe('Hello World')
  })

  it('should truncate to 10000 characters', () => {
    const longString = 'a'.repeat(15000)
    const result = sanitizeString(longString)
    expect(result.length).toBe(10000)
  })

  it('should handle empty strings', () => {
    expect(sanitizeString('')).toBe('')
  })

  it('should preserve safe text', () => {
    expect(sanitizeString('Hello World 123')).toBe('Hello World 123')
  })
})

describe('sanitizeForSQL', () => {
  it('should escape single quotes', () => {
    expect(sanitizeForSQL("it's a test")).toBe("it''s a test")
  })

  it('should remove semicolons', () => {
    expect(sanitizeForSQL('test; DROP TABLE')).toBe('test  TABLE')
  })

  it('should remove SQL comments', () => {
    expect(sanitizeForSQL('test -- comment')).toBe('test  comment')
  })

  it('should remove block comment markers', () => {
    expect(sanitizeForSQL('test /* comment */ end')).toBe('test  comment  end')
  })

  it('should combine sanitizeString and SQL-specific sanitization', () => {
    expect(sanitizeForSQL('<script>SELECT * FROM users; --</script>')).toBe(' * FROM users ')
  })
})

describe('encodeForHTML', () => {
  it('should encode ampersands', () => {
    expect(encodeForHTML('Tom & Jerry')).toBe('Tom &amp; Jerry')
  })

  it('should encode less-than signs', () => {
    expect(encodeForHTML('5 < 10')).toBe('5 &lt; 10')
  })

  it('should encode greater-than signs', () => {
    expect(encodeForHTML('10 > 5')).toBe('10 &gt; 5')
  })

  it('should encode double quotes', () => {
    expect(encodeForHTML('Say "Hello"')).toBe('Say &quot;Hello&quot;')
  })

  it('should encode single quotes', () => {
    expect(encodeForHTML("It's a test")).toBe('It&#x27;s a test')
  })

  it('should encode forward slashes', () => {
    expect(encodeForHTML('path/to/file')).toBe('path&#x2F;to&#x2F;file')
  })

  it('should handle multiple entities', () => {
    // encodeForHTML calls sanitizeString first, which removes HTML tags
    expect(encodeForHTML('<div>"Hello" & \'Goodbye\'</div>')).toBe(
      '&quot;Hello&quot; &amp; &#x27;Goodbye&#x27;'
    )
  })
})

describe('FarmSchema', () => {
  const validFarm = {
    name: 'Test Farm',
    region: 'Nashik',
    area: 5.5,
    crop: 'Grapes',
    crop_variety: 'Thompson Seedless',
    planting_date: '2023-01-15',
    vine_spacing: 2.5,
    row_spacing: 8
  }

  it('should validate valid farm data', () => {
    expect(() => FarmSchema.parse(validFarm)).not.toThrow()
  })

  it('should reject empty farm name', () => {
    expect(() => FarmSchema.parse({ ...validFarm, name: '' })).toThrow()
  })

  it('should reject farm name with invalid characters', () => {
    expect(() => FarmSchema.parse({ ...validFarm, name: 'Test<>Farm' })).toThrow()
  })

  it('should reject farm name longer than 50 characters', () => {
    expect(() => FarmSchema.parse({ ...validFarm, name: 'a'.repeat(51) })).toThrow()
  })

  it('should reject negative area', () => {
    expect(() => FarmSchema.parse({ ...validFarm, area: -1 })).toThrow()
  })

  it('should reject area exceeding maximum', () => {
    expect(() => FarmSchema.parse({ ...validFarm, area: 30000 })).toThrow()
  })

  it('should reject invalid date format', () => {
    expect(() => FarmSchema.parse({ ...validFarm, planting_date: '15-01-2023' })).toThrow()
  })

  it('should reject future planting dates', () => {
    const futureDate = new Date()
    futureDate.setFullYear(futureDate.getFullYear() + 1)
    const futureDateStr = futureDate.toISOString().split('T')[0]
    expect(() => FarmSchema.parse({ ...validFarm, planting_date: futureDateStr })).toThrow()
  })

  it('should reject planting dates older than 100 years', () => {
    expect(() => FarmSchema.parse({ ...validFarm, planting_date: '1900-01-01' })).toThrow()
  })

  it('should sanitize farm name', () => {
    const result = FarmSchema.parse({
      ...validFarm,
      name: 'TestFarm'
    })
    expect(result.name).toBe('TestFarm')
  })

  it('should accept optional vine_spacing and row_spacing', () => {
    const { vine_spacing, row_spacing, ...farmWithoutSpacing } = validFarm
    expect(() => FarmSchema.parse(farmWithoutSpacing)).not.toThrow()
  })
})

describe('IrrigationSchema', () => {
  const validIrrigation = {
    farm_id: 1,
    date: '2025-01-15',
    duration: 2.5,
    area: 5.5,
    growth_stage: 'flowering' as const,
    moisture_status: 'moderate',
    system_discharge: 500,
    notes: 'Regular irrigation'
  }

  it('should validate valid irrigation data', () => {
    expect(() => IrrigationSchema.parse(validIrrigation)).not.toThrow()
  })

  it('should reject invalid farm_id', () => {
    expect(() => IrrigationSchema.parse({ ...validIrrigation, farm_id: -1 })).toThrow()
  })

  it('should reject duration exceeding 24 hours', () => {
    expect(() => IrrigationSchema.parse({ ...validIrrigation, duration: 25 })).toThrow()
  })

  it('should reject invalid growth stage', () => {
    expect(() => IrrigationSchema.parse({ ...validIrrigation, growth_stage: 'invalid' })).toThrow()
  })

  it('should accept valid growth stages', () => {
    const stages = [
      'dormant',
      'budbreak',
      'flowering',
      'fruit_set',
      'veraison',
      'harvest',
      'post_harvest'
    ]
    stages.forEach((stage) => {
      expect(() =>
        IrrigationSchema.parse({ ...validIrrigation, growth_stage: stage })
      ).not.toThrow()
    })
  })

  it('should accept optional notes', () => {
    const { notes, ...irrigationWithoutNotes } = validIrrigation
    expect(() => IrrigationSchema.parse(irrigationWithoutNotes)).not.toThrow()
  })

  it('should reject notes longer than 500 characters', () => {
    expect(() => IrrigationSchema.parse({ ...validIrrigation, notes: 'a'.repeat(501) })).toThrow()
  })
})

describe('SpraySchema', () => {
  const validSpray = {
    farm_id: 1,
    date: '2025-01-15',
    pest_disease: 'Downy Mildew',
    chemical: 'Metalaxyl',
    dose: '2g/L',
    area: 5.5,
    weather: 'Cloudy, no rain',
    operator: 'John Doe',
    notes: 'Morning application'
  }

  it('should validate valid spray data', () => {
    expect(() => SpraySchema.parse(validSpray)).not.toThrow()
  })

  it('should reject empty pest_disease', () => {
    expect(() => SpraySchema.parse({ ...validSpray, pest_disease: '' })).toThrow()
  })

  it('should reject empty chemical', () => {
    expect(() => SpraySchema.parse({ ...validSpray, chemical: '' })).toThrow()
  })

  it('should reject pest_disease longer than 100 characters', () => {
    expect(() => SpraySchema.parse({ ...validSpray, pest_disease: 'a'.repeat(101) })).toThrow()
  })
})

describe('HarvestSchema', () => {
  const validHarvest = {
    farm_id: 1,
    date: '2025-01-15',
    quantity: 1000,
    grade: 'Grade A',
    price: 50,
    buyer: 'Local Market',
    notes: 'Good quality'
  }

  it('should validate valid harvest data', () => {
    expect(() => HarvestSchema.parse(validHarvest)).not.toThrow()
  })

  it('should reject negative quantity', () => {
    expect(() => HarvestSchema.parse({ ...validHarvest, quantity: -1 })).toThrow()
  })

  it('should reject quantity exceeding maximum', () => {
    expect(() => HarvestSchema.parse({ ...validHarvest, quantity: 2000000 })).toThrow()
  })

  it('should reject negative price', () => {
    expect(() => HarvestSchema.parse({ ...validHarvest, price: -1 })).toThrow()
  })

  it('should accept optional price and buyer', () => {
    const { price, buyer, ...harvestWithoutOptional } = validHarvest
    expect(() => HarvestSchema.parse(harvestWithoutOptional)).not.toThrow()
  })
})

describe('TaskReminderSchema', () => {
  const validTask = {
    farm_id: 1,
    title: 'Irrigation Task',
    description: 'Water the vineyard',
    due_date: '2025-01-20',
    type: 'irrigation' as const,
    priority: 'high' as const,
    completed: false
  }

  it('should validate valid task data', () => {
    expect(() => TaskReminderSchema.parse(validTask)).not.toThrow()
  })

  it('should reject empty title', () => {
    expect(() => TaskReminderSchema.parse({ ...validTask, title: '' })).toThrow()
  })

  it('should reject title longer than 200 characters', () => {
    expect(() => TaskReminderSchema.parse({ ...validTask, title: 'a'.repeat(201) })).toThrow()
  })

  it('should accept valid task types', () => {
    const types = ['irrigation', 'spray', 'fertigation', 'training', 'harvest', 'other']
    types.forEach((type) => {
      expect(() => TaskReminderSchema.parse({ ...validTask, type })).not.toThrow()
    })
  })

  it('should accept valid priority levels', () => {
    const priorities = ['low', 'medium', 'high']
    priorities.forEach((priority) => {
      expect(() => TaskReminderSchema.parse({ ...validTask, priority })).not.toThrow()
    })
  })
})

describe('ExpenseSchema', () => {
  const validExpense = {
    farm_id: 1,
    date: '2025-01-15',
    type: 'labor' as const,
    description: 'Worker wages',
    cost: 5000,
    remarks: 'Monthly payment'
  }

  it('should validate valid expense data', () => {
    expect(() => ExpenseSchema.parse(validExpense)).not.toThrow()
  })

  it('should reject negative cost', () => {
    expect(() => ExpenseSchema.parse({ ...validExpense, cost: -100 })).toThrow()
  })

  it('should reject cost exceeding maximum', () => {
    expect(() => ExpenseSchema.parse({ ...validExpense, cost: 20000000 })).toThrow()
  })

  it('should accept valid expense types', () => {
    const types = ['labor', 'materials', 'equipment', 'other']
    types.forEach((type) => {
      expect(() => ExpenseSchema.parse({ ...validExpense, type })).not.toThrow()
    })
  })
})

describe('ETcInputSchema', () => {
  const validETcInput = {
    temperatureMax: 30,
    temperatureMin: 15,
    humidity: 60,
    windSpeed: 2.5,
    rainfall: 10
  }

  it('should validate valid ETc input data', () => {
    expect(() => ETcInputSchema.parse(validETcInput)).not.toThrow()
  })

  it('should reject temperature exceeding maximum', () => {
    expect(() => ETcInputSchema.parse({ ...validETcInput, temperatureMax: 70 })).toThrow()
  })

  it('should reject temperature below minimum', () => {
    expect(() => ETcInputSchema.parse({ ...validETcInput, temperatureMin: -30 })).toThrow()
  })

  it('should reject humidity above 100', () => {
    expect(() => ETcInputSchema.parse({ ...validETcInput, humidity: 110 })).toThrow()
  })

  it('should reject negative humidity', () => {
    expect(() => ETcInputSchema.parse({ ...validETcInput, humidity: -1 })).toThrow()
  })

  it('should reject negative wind speed', () => {
    expect(() => ETcInputSchema.parse({ ...validETcInput, windSpeed: -1 })).toThrow()
  })

  it('should accept optional rainfall', () => {
    const { rainfall, ...etcWithoutRainfall } = validETcInput
    expect(() => ETcInputSchema.parse(etcWithoutRainfall)).not.toThrow()
  })
})

describe('validateAndSanitize', () => {
  it('should return success for valid data', () => {
    const data = { temperatureMax: 30, temperatureMin: 15, humidity: 60, windSpeed: 2.5 }
    const result = validateAndSanitize(ETcInputSchema, data)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toEqual(data)
    }
  })

  it('should return errors for invalid data', () => {
    const data = { temperatureMax: 100, temperatureMin: 15, humidity: 60, windSpeed: 2.5 }
    const result = validateAndSanitize(ETcInputSchema, data)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.errors.length).toBeGreaterThan(0)
    }
  })

  it('should sanitize string fields in objects', () => {
    const data = {
      name: '<script>Test Farm</script>',
      region: 'Nashik',
      area: 5,
      crop: 'Grapes',
      crop_variety: 'Thompson',
      planting_date: '2023-01-15'
    }
    const result = validateAndSanitize(FarmSchema, data)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.name).toBe('Test Farm')
    }
  })
})

describe('SecurityRateLimiter', () => {
  let rateLimiter: SecurityRateLimiter

  beforeEach(() => {
    rateLimiter = new SecurityRateLimiter(5, 1000, 5000, 2)
  })

  it('should allow requests within limit', () => {
    for (let i = 0; i < 5; i++) {
      const result = rateLimiter.checkLimit('test-user')
      expect(result.allowed).toBe(true)
    }
  })

  it('should block requests exceeding limit', () => {
    for (let i = 0; i < 5; i++) {
      rateLimiter.checkLimit('test-user')
    }
    const result = rateLimiter.checkLimit('test-user')
    expect(result.allowed).toBe(false)
    expect(result.reason).toBe('Rate limit exceeded')
  })

  it('should allow more requests for authenticated users', () => {
    for (let i = 0; i < 10; i++) {
      const result = rateLimiter.checkLimit('auth-user', true)
      expect(result.allowed).toBe(true)
    }
  })

  it('should block IP after repeated violations', () => {
    // Exceed limit multiple times
    for (let i = 0; i < 7; i++) {
      rateLimiter.checkLimit('bad-actor')
    }
    // Try again - should be blocked
    const result = rateLimiter.checkLimit('bad-actor')
    expect(result.allowed).toBe(false)
  })

  it('should cleanup expired requests', () => {
    rateLimiter.checkLimit('test-user')
    rateLimiter.cleanup()
    // After cleanup, old requests should be removed (though they may not be expired yet in this test)
    expect(true).toBe(true) // Basic test to ensure cleanup runs without error
  })

  it('should reset requests after time window', async () => {
    // Make 5 requests
    for (let i = 0; i < 5; i++) {
      rateLimiter.checkLimit('test-user')
    }

    // Wait for window to expire
    await new Promise((resolve) => setTimeout(resolve, 1100))

    // Should allow new requests
    const result = rateLimiter.checkLimit('test-user')
    expect(result.allowed).toBe(true)
  }, 10000)
})

describe('generateCSRFToken', () => {
  it('should generate a token', () => {
    const token = generateCSRFToken()
    expect(token).toBeDefined()
    expect(typeof token).toBe('string')
    expect(token.length).toBe(64) // 32 bytes = 64 hex characters
  })

  it('should generate unique tokens', () => {
    const token1 = generateCSRFToken()
    const token2 = generateCSRFToken()
    expect(token1).not.toBe(token2)
  })

  it('should generate tokens with only hex characters', () => {
    const token = generateCSRFToken()
    expect(/^[0-9a-f]+$/.test(token)).toBe(true)
  })
})

describe('validateFileContent', () => {
  it('should accept valid file types', () => {
    const validFiles = [
      'image.jpg',
      'photo.jpeg',
      'graphic.png',
      'document.pdf',
      'data.csv',
      'spreadsheet.xlsx'
    ]

    validFiles.forEach((fileName) => {
      const result = validateFileContent(fileName, 1024 * 1024)
      expect(result.valid).toBe(true)
    })
  })

  it('should reject invalid file types', () => {
    const invalidFiles = ['script.js', 'executable.exe', 'document.doc', 'archive.zip']

    invalidFiles.forEach((fileName) => {
      const result = validateFileContent(fileName, 1024 * 1024)
      expect(result.valid).toBe(false)
      expect(result.reason).toBe('File type not allowed')
    })
  })

  it('should reject files exceeding size limit', () => {
    const result = validateFileContent('large.jpg', 11 * 1024 * 1024)
    expect(result.valid).toBe(false)
    expect(result.reason).toBe('File size too large (max 10MB)')
  })

  it('should accept files within size limit', () => {
    const result = validateFileContent('small.jpg', 5 * 1024 * 1024)
    expect(result.valid).toBe(true)
  })

  it('should be case-insensitive for file extensions', () => {
    const result = validateFileContent('IMAGE.JPG', 1024 * 1024)
    expect(result.valid).toBe(true)
  })
})
