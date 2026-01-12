// Voice Synthesis API Route
// Uses Google Cloud TTS with fallback to browser TTS

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/auth-utils'
import { globalRateLimiter } from '@/lib/validation'
import type { SupportedLanguage } from '@/types/voice'

// Google Cloud TTS client (lazy loaded)
let googleTTSClient: any = null

/**
 * Get Google Cloud TTS client
 */
async function getGoogleTTSClient() {
  if (googleTTSClient) {
    return googleTTSClient
  }

  const credentialsJson = process.env.GOOGLE_CLOUD_CREDENTIALS

  if (!credentialsJson) {
    return null
  }

  try {
    // Dynamic import to avoid issues if package is not installed
    const textToSpeech = await import('@google-cloud/text-to-speech')
    const client = new textToSpeech.TextToSpeechClient({
      credentials: JSON.parse(credentialsJson)
    })
    googleTTSClient = client
    return client
  } catch (error) {
    console.error('Failed to initialize Google Cloud TTS:', error)
    return null
  }
}

/**
 * Voice mappings for each language
 */
const VOICE_MAPPINGS: Record<SupportedLanguage, { google: string; browser: string[] }> = {
  mr: {
    google: 'mr-IN-Wavenet-A',
    browser: ['mr-IN', 'hi-IN'] // Marathi not always available, fallback to Hindi
  },
  hi: {
    google: 'hi-IN-Wavenet-D',
    browser: ['hi-IN']
  },
  en: {
    google: 'en-IN-Wavenet-A',
    browser: ['en-IN', 'en-US', 'en-GB']
  }
}

export async function POST(request: NextRequest) {
  const startTime = Date.now()

  try {
    // Rate limiting
    const clientIP =
      request.headers.get('x-forwarded-for') ||
      request.headers.get('x-real-ip') ||
      'anonymous'

    const rateLimitResult = globalRateLimiter.checkLimit(`voice-synthesize-${clientIP}`)
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: 'Too many requests. Please try again later.',
          errorType: 'quota-exceeded'
        } as const,
        { status: 429 }
      )
    }

    // Authenticate user (required for TTS)
    const supabase = await createServerSupabaseClient()
    const {
      data: { user },
      error: userError
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json(
        {
          success: false,
          error: 'Authentication required',
          errorType: 'api-error'
        } as const,
        { status: 401 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { text, language = 'en' }: { text: string; language?: SupportedLanguage } = body

    if (!text) {
      return NextResponse.json(
        {
          success: false,
          error: 'Text is required',
          errorType: 'synthesis-failed'
        } as const,
        { status: 400 }
      )
    }

    // Validate language
    if (!['en', 'hi', 'mr'].includes(language)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid language. Supported: en, hi, mr',
          errorType: 'synthesis-failed'
        } as const,
        { status: 400 }
      )
    }

    // Truncate text if too long (Google TTS limit is 5000 chars)
    const maxLength = 5000
    const truncatedText = text.length > maxLength ? text.substring(0, maxLength) : text

    // Try Google Cloud TTS first
    try {
      const client = await getGoogleTTSClient()

      if (client) {
        const voice = VOICE_MAPPINGS[language].google

        const [response] = await client.synthesizeSpeech({
          input: { text: truncatedText },
          voice: {
            languageCode: language === 'mr' ? 'mr-IN' : language === 'hi' ? 'hi-IN' : 'en-IN',
            name: voice,
            ssmlGender: 'FEMALE' as const
          },
          audioConfig: {
            audioEncoding: 'MP3' as const,
            speakingRate: 0.9, // Slightly slower for clarity
            pitch: 0,
            volumeGainDb: 2
          }
        })

        if (response?.audioContent) {
          const audioBase64 = Buffer.from(response.audioContent as Uint8Array).toString('base64')

          return NextResponse.json({
            success: true,
            audioBase64,
            audioFormat: 'mp3',
            provider: 'google',
            processingTime: Date.now() - startTime
          } as const)
        }
      }
    } catch (googleError) {
      console.error('Google Cloud TTS error, using fallback:', googleError)
      // Fall through to browser TTS response
    }

    // Fallback: Return text with browser TTS instructions
    // The client will handle browser-based synthesis
    return NextResponse.json({
      success: true,
      text: truncatedText,
      language,
      useBrowserTTS: true,
      browserVoice: VOICE_MAPPINGS[language].browser[0],
      processingTime: Date.now() - startTime
    } as const)

  } catch (error) {
    // Log error for debugging in development only
    if (process.env.NODE_ENV === 'development') {
      console.error('Synthesis API error:', error)
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to synthesize speech',
        errorType: 'api-error'
      } as const,
      { status: 500 }
    )
  }
}

/**
 * GET endpoint for checking TTS availability
 */
export async function GET() {
  const client = await getGoogleTTSClient()

  return NextResponse.json({
    googleTTSAvailable: !!client,
    supportedLanguages: ['en', 'hi', 'mr']
  })
}

// ============================================================================
// OPTIONS Handler for CORS
// ============================================================================

// Get allowed origins from environment variable
const getAllowedOrigins = (): string[] => {
  const allowedOriginsEnv = process.env.ALLOWED_ORIGINS || ''
  return allowedOriginsEnv.split(',').map(origin => origin.trim()).filter(Boolean)
}

const isOriginAllowed = (origin: string | null): boolean => {
  if (!origin) return false
  const allowedOrigins = getAllowedOrigins()
  if (allowedOrigins.length === 0) {
    return false
  }
  return allowedOrigins.some(allowed => {
    if (allowed === '*') return true
    if (allowed.startsWith('*.')) {
      const domain = allowed.slice(2)
      return origin.endsWith(`.${domain}`) || origin === domain
    }
    return origin === allowed
  })
}

export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('Origin')

  if (!isOriginAllowed(origin)) {
    return new NextResponse(null, {
      status: 403
    })
  }

  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': origin || '',
      'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Credentials': 'true',
      'Vary': 'Origin'
    }
  })
}
