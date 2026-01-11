// Voice Assistant Hybrid - Type Definitions

export type SupportedLanguage = 'en' | 'hi' | 'mr'

export type VoiceIntent =
  | 'irrigation'
  | 'spray'
  | 'fertigation'
  | 'harvest'
  | 'unknown'
  | 'clarification_needed'

export type VoiceErrorType =
  | 'no-speech'
  | 'mic-permission'
  | 'network-error'
  | 'transcription-failed'
  | 'processing-failed'
  | 'synthesis-failed'
  | 'quota-exceeded'
  | 'api-error'

// ============================================================================
// Request/Response Types
// ============================================================================

export interface VoiceTranscriptionRequest {
  audioBlob: Blob
  languageHint?: SupportedLanguage
}

export interface VoiceTranscriptionResponse {
  success: boolean
  text?: string
  language?: SupportedLanguage
  confidence?: number
  error?: string
  errorType?: VoiceErrorType
}

export interface ConversationMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp?: Date
}

export interface VoiceProcessRequest {
  transcript: string
  language: SupportedLanguage
  conversationId?: string
  conversationHistory?: ConversationMessage[]
  userId: string
}

export interface VoiceProcessResponse {
  success: boolean
  intent?: VoiceIntent
  data?: IrrigationLogData | SprayLogData | FertigationLogData | HarvestLogData
  followUpQuestion?: string
  clarificationField?: string
  responseText?: string
  confidence?: number
  conversationId?: string
  error?: string
  errorType?: VoiceErrorType
}

export interface VoiceSynthesisRequest {
  text: string
  language: SupportedLanguage
}

export interface VoiceSynthesisResponse {
  success: boolean
  audioBase64?: string
  audioFormat?: string
  error?: string
  errorType?: VoiceErrorType
}

export interface VoiceLogRequest {
  intent: VoiceIntent
  data: Record<string, unknown>
  conversationId?: string
  transcript?: string
  userId: string
  confidence?: number
}

export interface VoiceLogResponse {
  success: boolean
  recordId?: number
  error?: string
}

// ============================================================================
// Log Data Types (Function Calling Output)
// ============================================================================

export interface IrrigationLogData {
  farmName: string
  farmId?: number
  date: string // YYYY-MM-DD format or relative like "today", "tomorrow"
  duration: number // in hours
  area: number // in hectares
  growthStage: GrowthStage
  moistureStatus: MoistureStatus
  systemDischarge?: number // in LPH
  notes?: string
}

export interface SprayLogData {
  farmName: string
  farmId?: number
  date: string
  chemicals: Array<{
    name: string
    dose?: string
    quantity: number
    unit: string
  }>
  area: number // in hectares
  operator: string
  weather: string
  waterVolume?: number // in liters
  notes?: string
}

export interface FertigationLogData {
  farmName: string
  farmId?: number
  date: string
  fertilizers: Array<{
    name: string
    unit: string // 'kg/acre' or 'liter/acre'
    quantity: number
  }>
  area: number // in hectares
  notes?: string
}

export interface HarvestLogData {
  farmName: string
  farmId?: number
  date: string
  quantity: number // in kg
  grade: string
  price?: number // per kg
  buyer?: string
  notes?: string
}

// ============================================================================
// Enums
// ============================================================================

export type GrowthStage =
  | 'dormant'
  | 'bud_break'
  | 'flowering'
  | 'fruit_set'
  | 'veraison'
  | 'harvest'
  | 'unknown'

export type MoistureStatus = 'dry' | 'moist' | 'wet' | 'saturated' | 'unknown'

// ============================================================================
// Chemical and Fertilizer Entry Types
// ============================================================================

export interface ChemicalEntry {
  name: string
  dose?: string
  quantity: number
  unit: string
}

export interface FertilizerEntry {
  name: string
  unit: string // 'kg/acre', 'liter/acre', 'kg/hectare', 'liter/hectare'
  quantity: number
}

export type CreatedVia = 'web' | 'mobile' | 'voice_assistant' | 'api'

// ============================================================================
// UI State Types
// ============================================================================

export type VoiceAssistantState =
  | 'idle'
  | 'requesting_permission'
  | 'recording'
  | 'processing'
  | 'speaking'
  | 'error'
  | 'success'

export interface VoiceAssistantUIState {
  state: VoiceAssistantState
  transcript?: string
  responseText?: string
  error?: string
  errorType?: VoiceErrorType
  language: SupportedLanguage
  isListening: boolean
  isSpeaking: boolean
  audioLevel?: number // 0-1 for visualization
}

// ============================================================================
// Error Messages (Multi-language)
// ============================================================================

export interface VoiceErrorMessages {
  'no-speech': Record<SupportedLanguage, string>
  'mic-permission': Record<SupportedLanguage, string>
  'network-error': Record<SupportedLanguage, string>
  'transcription-failed': Record<SupportedLanguage, string>
  'processing-failed': Record<SupportedLanguage, string>
  'synthesis-failed': Record<SupportedLanguage, string>
  'quota-exceeded': Record<SupportedLanguage, string>
  'api-error': Record<SupportedLanguage, string>
}

export const VOICE_ERROR_MESSAGES: VoiceErrorMessages = {
  'no-speech': {
    en: 'No speech detected. Please try speaking clearly.',
    hi: 'कोई आवाज़ नहीं सुनाई दी। कृपया स्पष्ट रूप से बोलें।',
    mr: 'कोणतीही आवाज ऐकू आली नाही. कृपया स्पष्टपणे बोला.'
  },
  'mic-permission': {
    en: 'Microphone permission is required. Please enable it in your browser settings.',
    hi: 'माइक्रोफोन की अनुमति आवश्यक है। कृपया इसे अपने ब्राउज़र सेटिंग्स में सक्षम करें।',
    mr: 'मायक्रोफोनची परवानगी आवश्यक आहे. कृपया ती आपल्या ब्राउझर सेटिंग्जमध्ये सक्षम करा.'
  },
  'network-error': {
    en: 'Network error. Please check your internet connection.',
    hi: 'नेटवर्क त्रुटि। कृपया अपना इंटरनेट कनेक्शन जांचें।',
    mr: 'नेटवर्क त्रुटी. कृपया तुमचे इंटरनेट कनेक्शन तपासा.'
  },
  'transcription-failed': {
    en: 'Failed to transcribe audio. Please try again.',
    hi: 'ऑडियो ट्रांसक्राइब करने में विफल। कृपया पुनः प्रयास करें।',
    mr: 'ऑडिओ ट्रान्स्क्राइब करण्यात अयशी. कृपया पुन्हा प्रयत्न करा.'
  },
  'processing-failed': {
    en: 'Failed to process your request. Please try again.',
    hi: 'आपकी अनुरोध प्रक्रिया करने में विफल। कृपया पुनः प्रयास करें।',
    mr: 'तुमची विनंती प्रक्रिया करण्यात अयशी. कृपया पुन्हा प्रयत्न करा.'
  },
  'synthesis-failed': {
    en: 'Voice response failed. Please try again.',
    hi: 'आवाज़ प्रतिक्रिया विफल। कृपया पुनः प्रयास करें।',
    mr: 'आवाज प्रतिसाद अयशी. कृपया पुन्हा प्रयत्न करा.'
  },
  'quota-exceeded': {
    en: 'Daily voice assistant limit exceeded. Please try again tomorrow.',
    hi: 'दैनिक वॉयस असिस्टेंट सीमा समाप्त। कृपया कल पुनः प्रयास करें।',
    mr: 'दैनिक व्हॉईस असिस्टंट मर्यादा ओलांडली. कृपया उद्या पुन्हा प्रयत्न करा.'
  },
  'api-error': {
    en: 'Service error. Please try again later.',
    hi: 'सेवा त्रुटि। कृपया बाद में पुनः प्रयास करें।',
    mr: 'सेवा त्रुटी. कृपया नंतर पुन्हा प्रयत्न करा.'
  }
}

// ============================================================================
// Follow-up Question Templates
// ============================================================================

export interface FollowUpTemplates {
  missing_farm: Record<SupportedLanguage, string>
  missing_date: Record<SupportedLanguage, string>
  missing_duration: Record<SupportedLanguage, string>
  missing_area: Record<SupportedLanguage, string>
  missing_chemicals: Record<SupportedLanguage, string>
  missing_fertilizers: Record<SupportedLanguage, string>
  missing_quantity: Record<SupportedLanguage, string>
  missing_grade: Record<SupportedLanguage, string>
  confirmation: Record<SupportedLanguage, string>
}

export const FOLLOW_UP_TEMPLATES: FollowUpTemplates = {
  missing_farm: {
    en: 'Which farm did you work on?',
    hi: 'आपने किस खेत पर काम किया?',
    mr: 'तुम्ही कोणत्या शेतावर काम केलं?'
  },
  missing_date: {
    en: 'When did you do this? (today, yesterday, or specific date)',
    hi: 'आपने यह कब किया? (आज, कल, या विशिष्ट तारीख)',
    mr: 'तुम्ही हे केव्हा केलं? (आज, काल, किंवा विशिष्ट तारीख)'
  },
  missing_duration: {
    en: 'For how many hours did you run the irrigation?',
    hi: 'आपने सिंचाई कितने घंटे चलाई?',
    mr: 'तुम्ही सिंचन किती तास चालवलं?'
  },
  missing_area: {
    en: 'How many hectares did you cover?',
    hi: 'आपने कितने हेक्टेयर कवर किए?',
    mr: 'तुम्ही किती हेक्टर क्षेत्र कव्हर केलं?'
  },
  missing_chemicals: {
    en: 'Which chemicals did you spray?',
    hi: 'आपने कौन से रसायन छिड़के?',
    mr: 'तुम्ही कोणते रसायण फवारलं?'
  },
  missing_fertilizers: {
    en: 'Which fertilizers did you apply?',
    hi: 'आपने कौन से उर्वरक डाले?',
    mr: 'तुम्ही कोणते खत घातलं?'
  },
  missing_quantity: {
    en: 'How much did you harvest (in kg)?',
    hi: 'आपने कितनी फसल काटी (किलो में)?',
    mr: 'तुम्ही किती उत्पादन गोळा केलं (किलोमध्ये)?'
  },
  missing_grade: {
    en: 'What is the grade of the harvest?',
    hi: 'फसल की ग्रेड क्या है?',
    mr: 'उत्पादनाची ग्रेड काय आहे?'
  },
  confirmation: {
    en: 'I understood: {summary}. Is this correct?',
    hi: 'मैंने समझा: {summary}. क्या यह सही है?',
    mr: 'मी समजलं: {summary}. हे बरोबर आहे का?'
  }
}

// ============================================================================
// GPT Function Calling Schemas
// ============================================================================

export const GPT_FUNCTION_SCHEMAS = {
  save_irrigation_log: {
    name: 'save_irrigation_log',
    description: 'Save an irrigation/fertigation log entry when the farmer mentions watering, irrigation, or similar activities',
    parameters: {
      type: 'object' as const,
      properties: {
        farmName: {
          type: 'string',
          description: 'Farm name or identifier (e.g., "main farm", "Farm A", "शेत 1")'
        },
        date: {
          type: 'string',
          description: 'Date in YYYY-MM-DD format or relative terms like "today", "yesterday", "काल", "आज"'
        },
        duration: {
          type: 'number',
          description: 'Duration of irrigation in hours (e.g., 2 for 2 hours, 1.5 for 1.5 hours)'
        },
        area: {
          type: 'number',
          description: 'Area irrigated in hectares (e.g., 1 for 1 hectare, 0.5 for half hectare)'
        },
        growthStage: {
          type: 'string',
          enum: ['dormant', 'bud_break', 'flowering', 'fruit_set', 'veraison', 'harvest', 'unknown'],
          description: 'Growth stage of the crop'
        },
        moistureStatus: {
          type: 'string',
          enum: ['dry', 'moist', 'wet', 'saturated', 'unknown'],
          description: 'Soil moisture status before irrigation'
        },
        systemDischarge: {
          type: 'number',
          description: 'System discharge in liters per hour (LPH)'
        }
      },
      required: ['farmName', 'date', 'duration', 'area']
    }
  },
  save_spray_log: {
    name: 'save_spray_log',
    description: 'Save a spray log entry when the farmer mentions spraying, applying chemicals, or pest control',
    parameters: {
      type: 'object' as const,
      properties: {
        farmName: {
          type: 'string',
          description: 'Farm name or identifier'
        },
        date: {
          type: 'string',
          description: 'Date in YYYY-MM-DD format or relative terms like "today", "yesterday"'
        },
        chemicals: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string', description: 'Name of the chemical' },
              dose: { type: 'string', description: 'Dosage information if specified' },
              quantity: { type: 'number', description: 'Quantity used' },
              unit: { type: 'string', description: 'Unit of measurement (ml, liter, gram, kg)' }
            },
            required: ['name', 'quantity', 'unit']
          },
          description: 'List of chemicals sprayed with quantities'
        },
        area: {
          type: 'number',
          description: 'Area sprayed in hectares'
        },
        operator: {
          type: 'string',
          description: 'Name of the person who operated the sprayer'
        },
        weather: {
          type: 'string',
          description: 'Weather conditions during spraying (e.g., "sunny", "cloudy", "windy")'
        },
        waterVolume: {
          type: 'number',
          description: 'Total water volume used in liters'
        }
      },
      required: ['farmName', 'date', 'chemicals', 'area', 'operator', 'weather']
    }
  },
  save_fertigation_log: {
    name: 'save_fertigation_log',
    description: 'Save a fertigation log entry when the farmer mentions applying fertilizers through irrigation system',
    parameters: {
      type: 'object' as const,
      properties: {
        farmName: {
          type: 'string',
          description: 'Farm name or identifier'
        },
        date: {
          type: 'string',
          description: 'Date in YYYY-MM-DD format or relative terms'
        },
        fertilizers: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string', description: 'Name of the fertilizer' },
              unit: {
                type: 'string',
                enum: ['kg/acre', 'liter/acre', 'kg/hectare', 'liter/hectare'],
                description: 'Unit of measurement'
              },
              quantity: { type: 'number', description: 'Quantity applied' }
            },
            required: ['name', 'unit', 'quantity']
          },
          description: 'List of fertilizers applied'
        },
        area: {
          type: 'number',
          description: 'Area covered in hectares'
        }
      },
      required: ['farmName', 'date', 'fertilizers', 'area']
    }
  },
  save_harvest_log: {
    name: 'save_harvest_log',
    description: 'Save a harvest log entry when the farmer mentions harvesting, picking, or cutting grapes/crops',
    parameters: {
      type: 'object' as const,
      properties: {
        farmName: {
          type: 'string',
          description: 'Farm name or identifier'
        },
        date: {
          type: 'string',
          description: 'Date in YYYY-MM-DD format or relative terms'
        },
        quantity: {
          type: 'number',
          description: 'Quantity harvested in kilograms'
        },
        grade: {
          type: 'string',
          description: 'Grade of the produce (e.g., "A", "B", "Premium", "Standard")'
        },
        price: {
          type: 'number',
          description: 'Price per kg in rupees'
        },
        buyer: {
          type: 'string',
          description: 'Name of the buyer if sold'
        }
      },
      required: ['farmName', 'date', 'quantity', 'grade']
    }
  }
} as const

export type GPTFunctionName = keyof typeof GPT_FUNCTION_SCHEMAS

// ============================================================================
// Farming Vocabulary for Context Prompt
// ============================================================================

export const FARMING_VOCABULARY = {
  mr: [
    'द्राक्ष', // grapes
    'शेत', // farm
    'पाणी', // water
    'सिंचन', // irrigation
    'फवारणी', // spraying
    'किटकनाशक', // pesticide
    'खत', // fertilizer
    'कापणी', // harvest
    'टॉम्पसन', // Thompson
    'शरद सीडलेस', // Sharad Seedless
    'डाउनी', // Downy
    'पावडरी', // Powdery
    'बुरणा', // mildew
    'एकर', // acre
    'हेक्टर', // hectare
    'तास', // hour
    'किलो', // kg
    'लिटर', // liter
    'आज', // today
    'काल', // yesterday
    'उद्या' // tomorrow
  ],
  hi: [
    'अंगूर', // grapes
    'खेत', // farm
    'पानी', // water
    'सिंचाई', // irrigation
    'छिड़काव', // spraying
    'कीटनाशक', // pesticide
    'खाद', // fertilizer
    'कटाई', // harvest
    'टॉम्पसन',
    'शरद सीडलेस',
    'डाउनी',
    'पाउडरी',
    'बुरणा',
    'एकड़',
    'हेक्टेयर',
    'घंटा',
    'किलो',
    'लीटर',
    'आज',
    'कल',
    'कल'
  ],
  en: [
    'grape',
    'vineyard',
    'farm',
    'irrigation',
    'drip',
    'spray',
    'pesticide',
    'fertilizer',
    'harvest',
    'Thompson',
    'Sharad Seedless',
    'Downy',
    'Powdery',
    'mildew',
    'acre',
    'hectare',
    'hour',
    'kg',
    'liter',
    'ETc',
    'MAD'
  ]
} as const
