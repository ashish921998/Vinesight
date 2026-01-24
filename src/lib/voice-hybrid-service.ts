// Voice Assistant Hybrid - Core Service Utilities
// Language detection, context management, and helper functions

import type {
  SupportedLanguage,
  ConversationMessage,
  VoiceIntent,
  FollowUpTemplates,
  FertilizerEntry,
  ChemicalEntry
} from '@/types/voice'
import {
  FOLLOW_UP_TEMPLATES,
  FARMING_VOCABULARY
} from '@/types/voice'

// ============================================================================
// Language Detection
// ============================================================================

/**
 * Detect language from text using script detection and keyword matching
 */
export function detectLanguage(text: string): SupportedLanguage {
  const lowerText = text.toLowerCase()

  // Marathi-specific words (distinct from Hindi)
  const marathiKeywords = /\b(शेत|पाणी|द्राक्ष|फवारणी|बुरणा|एकर|उद्या|काल|तास|किलो|लिटर|आज|मी|तुम्ही|करतो|केलं)\b/
  if (marathiKeywords.test(lowerText)) {
    return 'mr'
  }

  // Hindi-specific words
  const hindiKeywords = /\b(खेत|पानी|अंगूर|छिड़काव|बुरणा|एकड़|कल|घंटा|किलो|लीटर|आज|मैं|आप|करता|किया)\b/
  if (hindiKeywords.test(lowerText)) {
    return 'hi'
  }

  // Check for Devanagari script (shared by Hindi and Marathi)
  const devanagariPattern = /[\u0900-\u097F]/
  if (devanagariPattern.test(text)) {
    // Use character patterns to distinguish
    // Marathi uses some conjuncts more frequently
    const marathiConjuncts = /[क्षज्ञ्त्रश्र]/
    if (marathiConjuncts.test(text)) {
      return 'mr'
    }
    return 'hi'
  }

  return 'en'
}

/**
 * Get the context prompt for Whisper API with farming vocabulary
 */
export function getTranscriptionPrompt(language: SupportedLanguage): string {
  const vocabulary = FARMING_VOCABULARY[language].join(', ')
  return `Farming vocabulary: ${vocabulary}. The speaker is a grape farmer talking about irrigation, spraying, fertilization, or harvesting.`
}

// ============================================================================
// Date Parsing
// ============================================================================

/**
 * Parse relative date terms to YYYY-MM-DD format
 */
export function parseRelativeDate(dateStr: string, timezone?: string): string {
  const normalized = dateStr.toLowerCase().trim()
  const now = new Date()

  // Apply timezone offset if provided
  if (timezone) {
    try {
      const tzDate = new Date(now.toLocaleString('en-US', { timeZone: timezone }))
      now.setTime(tzDate.getTime())
    } catch {
      // Invalid timezone, use local time
    }
  }

  // Today
  if (/^(आज|today|aj)\b/.test(normalized)) {
    return now.toISOString().split('T')[0]
  }

  // Yesterday / काल
  if (/^(काल|yesterday|kal)\b/.test(normalized)) {
    now.setDate(now.getDate() - 1)
    return now.toISOString().split('T')[0]
  }

  // Tomorrow / उद्या
  if (/^(उद्या|tomorrow|udya)\b/.test(normalized)) {
    now.setDate(now.getDate() + 1)
    return now.toISOString().split('T')[0]
  }

  // Day before yesterday / परसों
  if (/^(परसों|day before yesterday)\b/.test(normalized)) {
    now.setDate(now.getDate() - 2)
    return now.toISOString().split('T')[0]
  }

  // Day after tomorrow / परसों (Hindi) / उद्यापर्यंत (Marathi)
  if (/^(उद्यानंतर|उद्यापर्यंत|day after tomorrow)\b/.test(normalized)) {
    now.setDate(now.getDate() + 2)
    return now.toISOString().split('T')[0]
  }

  // X days ago
  const daysAgoMatch = normalized.match(/(\d+)\s*(दिवसांपूर्वी|दिन पहले|days? ago)/i)
  if (daysAgoMatch) {
    const days = parseInt(daysAgoMatch[1], 10)
    now.setDate(now.getDate() - days)
    return now.toISOString().split('T')[0]
  }

  // Try parsing as YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return dateStr
  }

  // Try parsing as DD/MM/YYYY or DD-MM-YYYY
  const slashMatch = dateStr.match(/(\d{1,2})[/-](\d{1,2})[/-](\d{4})/)
  if (slashMatch) {
    const [, day, month, year] = slashMatch
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
  }

  // Default to today if unparseable
  return new Date().toISOString().split('T')[0]
}

/**
 * Format date for display based on language
 */
export function formatDateForDisplay(dateStr: string, language: SupportedLanguage): string {
  const date = new Date(dateStr)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  // Reset time portions for comparison
  const resetTime = (d: Date) => d.setHours(0, 0, 0, 0)
  resetTime(date)
  resetTime(today)
  resetTime(yesterday)

  if (date.getTime() === today.getTime()) {
    return language === 'mr' ? 'आज' : language === 'hi' ? 'आज' : 'today'
  }

  if (date.getTime() === yesterday.getTime()) {
    return language === 'mr' ? 'काल' : language === 'hi' ? 'कल' : 'yesterday'
  }

  return date.toLocaleDateString(language === 'en' ? 'en-IN' : language === 'hi' ? 'hi-IN' : 'mr-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

// ============================================================================
// Number Parsing (Multi-language)
// ============================================================================

/**
 * Parse numbers from Indian language text
 */
export function parseNumber(text: string): number | null {
  // Hindi/Devanagari numerals to Arabic
  const devanagariToArabic: Record<string, string> = {
    '०': '0', '१': '1', '२': '2', '३': '3', '४': '4',
    '५': '5', '६': '6', '७': '7', '८': '8', '९': '9'
  }

  let normalized = text
  for (const [devanagari, arabic] of Object.entries(devanagariToArabic)) {
    normalized = normalized.replace(new RegExp(devanagari, 'g'), arabic)
  }

  // Extract first number found
  const match = normalized.match(/(\d+(?:\.\d+)?)/)
  if (match) {
    return parseFloat(match[1])
  }

  // Parse Indian number words - language-specific maps to avoid duplicate keys
  const numberWordsEnglish: Record<string, number> = {
    'zero': 0, 'one': 1, 'two': 2, 'three': 3, 'four': 4,
    'five': 5, 'six': 6, 'seven': 7, 'eight': 8, 'nine': 9,
    'ten': 10, 'half': 0.5, 'quarter': 0.25
  }

  const numberWordsHindi: Record<string, number> = {
    'शून्य': 0, 'एक': 1, 'दो': 2, 'तीन': 3, 'चार': 4,
    'पांच': 5, 'छह': 6, 'सात': 7, 'आठ': 8, 'नौ': 9,
    'दस': 10, 'आधा': 0.5, 'चौथाई': 0.25
  }

  const numberWordsMarathi: Record<string, number> = {
    'शून्य': 0, 'एक': 1, 'दोन': 2, 'तीन': 3, 'चार': 4,
    'पाच': 5, 'सहा': 6, 'सात': 7, 'आठ': 8, 'नऊ': 9,
    'दहा': 10, 'अर्धा': 0.5, 'चतुर्थांश': 0.25
  }

  // Combine maps with priority for language-specific lookups
  const numberWordsByLanguage: Record<string, Record<string, number>> = {
    en: numberWordsEnglish,
    hi: { ...numberWordsEnglish, ...numberWordsHindi }, // Hindi can use English numbers too
    mr: { ...numberWordsEnglish, ...numberWordsMarathi } // Marathi can use English numbers too
  }

  const lowerText = text.toLowerCase()

  // Try to detect which language's number words to use
  // Check Marathi-specific words first (they have unique characters)
  for (const [word, value] of Object.entries(numberWordsMarathi)) {
    if (lowerText.includes(word)) {
      return value
    }
  }

  // Then check Hindi-specific words (but avoid Marathi overlaps)
  for (const [word, value] of Object.entries(numberWordsHindi)) {
    // Skip words that are also in Marathi (already checked)
    if (word in numberWordsMarathi) continue
    if (lowerText.includes(word)) {
      return value
    }
  }

  // Finally check English words
  for (const [word, value] of Object.entries(numberWordsEnglish)) {
    if (lowerText.includes(word)) {
      return value
    }
  }

  return null
}

/**
 * Parse quantity with unit (e.g., "50 kg", "2 liters")
 */
export function parseQuantityWithUnit(text: string): { quantity: number; unit: string } | null {
  const patterns = [
    /(\d+(?:\.\d+)?)\s*(kg|kilogram|किलो|किग्रा)/i,
    /(\d+(?:\.\d+)?)\s*(l|liter|litre|लिटर)/i,
    /(\d+(?:\.\d+)?)\s*(ml|milliliter|मिली)/i,
    /(\d+(?:\.\d+)?)\s*(g|gram|ग्राम)/i,
    /(\d+(?:\.\d+)?)\s*(acre|एकर|hectare|हेक्टर)/i,
    /(\d+(?:\.\d+)?)\s*(hour|hr|तास|घंटा)/i
  ]

  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match) {
      return {
        quantity: parseFloat(match[1]),
        unit: match[2].toLowerCase()
      }
    }
  }

  return null
}

// ============================================================================
// Intent Detection
// ============================================================================

/**
 * Detect farming intent from transcript
 */
export function detectIntent(transcript: string): VoiceIntent {
  const lowerText = transcript.toLowerCase()

  // Irrigation keywords
  const irrigationKeywords = [
    /पाणी|सिंचन|irrigation|water|दिलले|चाललले|sprinkler|drip/i
  ]
  if (irrigationKeywords.some(p => p.test(lowerText))) {
    return 'irrigation'
  }

  // Spray keywords
  const sprayKeywords = [
    /फवारणी|स्प्रे|spray|फवारलं|छिड़काव|किटकनाशक|pesticide|रसायण/i
  ]
  if (sprayKeywords.some(p => p.test(lowerText))) {
    return 'spray'
  }

  // Fertigation keywords
  const fertigationKeywords = [
    /खत|खाद|fertilizer|fertigation|उर्वरक|घातलं|डाले|मिश्रण/i
  ]
  if (fertigationKeywords.some(p => p.test(lowerText))) {
    return 'fertigation'
  }

  // Harvest keywords
  const harvestKeywords = [
    /कापणी|गोळा|harvest|काढली|तोड़|उत्पादन|crop/i
  ]
  if (harvestKeywords.some(p => p.test(lowerText))) {
    return 'harvest'
  }

  return 'unknown'
}

// ============================================================================
// Follow-up Question Generation
// ============================================================================

/**
 * Generate appropriate follow-up question based on missing data
 */
export function generateFollowUpQuestion(
  missingField: string,
  language: SupportedLanguage,
  context?: Record<string, unknown>
): string {
  const templateKey = `missing_${missingField}` as keyof FollowUpTemplates

  if (templateKey in FOLLOW_UP_TEMPLATES) {
    let template = FOLLOW_UP_TEMPLATES[templateKey]?.[language] ||
                   FOLLOW_UP_TEMPLATES[templateKey]?.en || ''

    // Replace placeholders if context is provided
    if (context) {
      template = template.replace('{summary}', generateSummary(context, language))
    }

    return template
  }

  // Default fallback
  return language === 'mr'
    ? 'कृपया अधिक माहिती द्या.'
    : language === 'hi'
      ? 'कृपया अधिक जानकारी दें।'
      : 'Please provide more details.'
}

/**
 * Generate a natural language summary of extracted data
 */
export function generateSummary(data: Record<string, unknown>, language: SupportedLanguage): string {
  const parts: string[] = []

  // Farm name
  if (data.farmName) {
    parts.push(String(data.farmName))
  }

  // Date
  if (data.date) {
    parts.push(formatDateForDisplay(String(data.date), language))
  }

  // Duration (for irrigation)
  if (data.duration) {
    const durationText = language === 'mr'
      ? `${data.duration} तास`
      : language === 'hi'
        ? `${data.duration} घंटे`
        : `${data.duration} hours`
    parts.push(durationText)
  }

  // Area
  if (data.area) {
    const areaText = language === 'mr'
      ? `${data.area} हेक्टर`
      : language === 'hi'
        ? `${data.area} हेक्टेयर`
        : `${data.area} hectares`
    parts.push(areaText)
  }

  // Quantity
  if (data.quantity) {
    const quantityText = language === 'mr'
      ? `${data.quantity} किलो`
      : language === 'hi'
        ? `${data.quantity} किलो`
        : `${data.quantity} kg`
    parts.push(quantityText)
  }

  // Chemicals/Fertilizers
  if (data.chemicals && Array.isArray(data.chemicals)) {
    const chemicals = data.chemicals as ChemicalEntry[]
    const chemNames = chemicals.map(c => c.name).join(', ')
    parts.push(chemNames)
  }

  if (data.fertilizers && Array.isArray(data.fertilizers)) {
    const fertilizers = data.fertilizers as FertilizerEntry[]
    const fertNames = fertilizers.map(f => f.name).join(', ')
    parts.push(fertNames)
  }

  if (parts.length === 0) {
    return language === 'mr' ? 'माहिती' : language === 'hi' ? 'जानकारी' : 'information'
  }

  // Join with appropriate separator
  const lastSeparator = language === 'en' ? ' and ' : ' आणि '
  if (parts.length === 1) return parts[0]
  if (parts.length === 2) return parts.join(lastSeparator)

  return parts.slice(0, -1).join(', ') + lastSeparator + parts[parts.length - 1]
}

// ============================================================================
// Conversation Management
// ============================================================================

/**
 * Build conversation context for GPT-4
 */
export function buildConversationContext(
  messages: ConversationMessage[],
  systemPrompt: string
): Array<{ role: string; content: string }> {
  const context: Array<{ role: string; content: string }> = [
    { role: 'system', content: systemPrompt }
  ]

  for (const msg of messages) {
    context.push({
      role: msg.role,
      content: msg.content
    })
  }

  return context
}

/**
 * Generate conversation ID for tracking
 */
export function generateConversationId(): string {
  return `voice_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`
}

// ============================================================================
// Farm Name Matching
// ============================================================================

/**
 * Find best matching farm from list
 */
export function matchFarmName(
  spokenName: string,
  availableFarms: Array<{ id: number; name: string }>,
  language: SupportedLanguage
): number | null {
  const normalizedSpoken = spokenName.toLowerCase().trim()

  // Try exact match first
  const exactMatch = availableFarms.find(
    farm => farm.name.toLowerCase() === normalizedSpoken
  )
  if (exactMatch) {
    return exactMatch.id
  }

  // Try partial match
  const partialMatch = availableFarms.find(
    farm => normalizedSpoken.includes(farm.name.toLowerCase()) ||
           farm.name.toLowerCase().includes(normalizedSpoken)
  )
  if (partialMatch) {
    return partialMatch.id
  }

  // Try numeric farm references (शेत 1, Farm 1, etc.)
  const numericMatch = normalizedSpoken.match(/(?:farm|शेत|खेत)\s*(\d+)/i)
  if (numericMatch) {
    const farmNum = parseInt(numericMatch[1], 10)
    const indexedFarm = availableFarms[farmNum - 1] // 1-indexed
    if (indexedFarm) {
      return indexedFarm.id
    }
  }

  return null
}

// ============================================================================
// Validation Utilities
// ============================================================================

/**
 * Validate irrigation log data
 */
export function validateIrrigationData(data: Record<string, unknown>): {
  valid: boolean
  missing?: string[]
  errors?: string[]
} {
  const required = ['farmName', 'date', 'duration', 'area']
  const missing: string[] = []
  const errors: string[] = []

  for (const field of required) {
    if (!data[field]) {
      missing.push(field)
    }
  }

  // Validate duration is positive
  if (data.duration && typeof data.duration === 'number' && data.duration <= 0) {
    errors.push('Duration must be positive')
  }

  // Validate area is positive
  if (data.area && typeof data.area === 'number' && data.area <= 0) {
    errors.push('Area must be positive')
  }

  return {
    valid: missing.length === 0 && errors.length === 0,
    missing: missing.length > 0 ? missing : undefined,
    errors: errors.length > 0 ? errors : undefined
  }
}

/**
 * Validate spray log data
 */
export function validateSprayData(data: Record<string, unknown>): {
  valid: boolean
  missing?: string[]
  errors?: string[]
} {
  const required = ['farmName', 'date', 'chemicals', 'area', 'operator', 'weather']
  const missing: string[] = []
  const errors: string[] = []

  for (const field of required) {
    if (!data[field]) {
      missing.push(field)
    }
  }

  if (data.chemicals && !Array.isArray(data.chemicals)) {
    errors.push('Chemicals must be an array')
  }

  return {
    valid: missing.length === 0 && errors.length === 0,
    missing: missing.length > 0 ? missing : undefined,
    errors: errors.length > 0 ? errors : undefined
  }
}

/**
 * Validate fertigation log data
 */
export function validateFertigationData(data: Record<string, unknown>): {
  valid: boolean
  missing?: string[]
  errors?: string[]
} {
  const required = ['farmName', 'date', 'fertilizers', 'area']
  const missing: string[] = []
  const errors: string[] = []

  for (const field of required) {
    if (!data[field]) {
      missing.push(field)
    }
  }

  if (data.fertilizers && !Array.isArray(data.fertilizers)) {
    errors.push('Fertilizers must be an array')
  }

  return {
    valid: missing.length === 0 && errors.length === 0,
    missing: missing.length > 0 ? missing : undefined,
    errors: errors.length > 0 ? errors : undefined
  }
}

/**
 * Validate harvest log data
 */
export function validateHarvestData(data: Record<string, unknown>): {
  valid: boolean
  missing?: string[]
  errors?: string[]
} {
  const required = ['farmName', 'date', 'quantity', 'grade']
  const missing: string[] = []
  const errors: string[] = []

  for (const field of required) {
    if (!data[field]) {
      missing.push(field)
    }
  }

  if (data.quantity && typeof data.quantity === 'number' && data.quantity <= 0) {
    errors.push('Quantity must be positive')
  }

  return {
    valid: missing.length === 0 && errors.length === 0,
    missing: missing.length > 0 ? missing : undefined,
    errors: errors.length > 0 ? errors : undefined
  }
}

// ============================================================================
// Text Normalization for Indian Languages
// ============================================================================

/**
 * Normalize regional variations to standard forms
 */
export function normalizeDialectText(text: string, language: SupportedLanguage): string {
  let normalized = text

  if (language === 'mr' || language === 'hi') {
    // Common variations
    const replacements: Record<string, string> = {
      'पान्या': 'पाणी',
      'पानि': 'पानी',
      'शेता': 'शेत',
      'शेतात': 'शेत',
      'फवारा': 'फवारणी',
      'फवारून': 'फवारणी'
    }

    for (const [variant, standard] of Object.entries(replacements)) {
      normalized = normalized.replace(new RegExp(variant, 'g'), standard)
    }
  }

  return normalized
}

// ============================================================================
// Voice Metrics Tracking
// ============================================================================

interface VoiceMetrics {
  conversationId: string
  userId: string
  language: SupportedLanguage
  intent?: VoiceIntent
  transcriptionTime: number
  processingTime: number
  synthesisTime?: number
  totalTime: number
  turns: number
  success: boolean
  error?: string
  timestamp: string
}

/**
 * Create voice metrics entry for tracking
 */
export function createVoiceMetrics(
  conversationId: string,
  userId: string,
  language: SupportedLanguage,
  transcriptionTime: number,
  processingTime: number,
  success: boolean,
  error?: string,
  intent?: VoiceIntent,
  synthesisTime?: number
): VoiceMetrics {
  return {
    conversationId,
    userId,
    language,
    intent,
    transcriptionTime,
    processingTime,
    synthesisTime,
    totalTime: transcriptionTime + processingTime + (synthesisTime || 0),
    turns: 1,
    success,
    error,
    timestamp: new Date().toISOString()
  }
}

// ============================================================================
// Quota Management
// ============================================================================

const DAILY_VOICE_LIMIT = 50 // Requests per user per day

/**
 * Check if user has exceeded daily voice quota
 */
export async function checkVoiceQuota(userId: string): Promise<boolean> {
  // This would integrate with your existing quota service
  // For now, return true (within quota)
  // TODO: Implement actual quota checking with Redis/Database
  return true
}

/**
 * Increment voice quota usage
 */
export async function incrementVoiceQuota(userId: string): Promise<void> {
  // TODO: Implement actual quota increment
}

/**
 * Get remaining voice quota for user
 */
export async function getRemainingVoiceQuota(userId: string): Promise<number> {
  // TODO: Implement actual remaining quota calculation
  return DAILY_VOICE_LIMIT
}
