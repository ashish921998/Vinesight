// Voice Transcription API Route
// Uses OpenAI Whisper API for speech-to-text transcription

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/auth-utils'
import { globalRateLimiter } from '@/lib/validation'
import OpenAI from 'openai'
import {
  detectLanguage,
  getTranscriptionPrompt
} from '@/lib/voice-hybrid-service'
import type { SupportedLanguage } from '@/types/voice'

// Maximum audio file size (25 MB for Whisper API)
const MAX_AUDIO_SIZE = 25 * 1024 * 1024

// Initialize OpenAI client
function getOpenAIClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not set')
  }
  return new OpenAI({ apiKey })
}

export async function POST(request: NextRequest) {
  const startTime = Date.now()

  try {
    // Rate limiting
    const clientIP =
      request.headers.get('x-forwarded-for') ||
      request.headers.get('x-real-ip') ||
      'anonymous'

    const rateLimitResult = globalRateLimiter.checkLimit(`voice-transcribe-${clientIP}`)
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

    // Authenticate user
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

    // Check voice quota
    // TODO: Implement quota checking
    // const hasQuota = await checkVoiceQuota(user.id)
    // if (!hasQuota) {
    //   return NextResponse.json(
    //     { success: false, error: 'Daily voice limit exceeded', errorType: 'quota-exceeded' },
    //     { status: 429 }
    //   )
    // }

    // Parse form data with audio file
    const formData = await request.formData()
    const audioFile = formData.get('audio') as File | null
    const languageHint = formData.get('language') as SupportedLanguage | null

    if (!audioFile) {
      return NextResponse.json(
        {
          success: false,
          error: 'No audio file provided',
          errorType: 'transcription-failed'
        } as const,
        { status: 400 }
      )
    }

    // Validate file size
    if (audioFile.size > MAX_AUDIO_SIZE) {
      return NextResponse.json(
        {
          success: false,
          error: `Audio file too large. Maximum size is ${MAX_AUDIO_SIZE / 1024 / 1024}MB`,
          errorType: 'transcription-failed'
        } as const,
        { status: 413 }
      )
    }

    // Validate file type
    const validTypes = [
      'audio/webm',
      'audio/wav',
      'audio/mp3',
      'audio/mpeg',
      'audio/mp4',
      'audio/mpeg3',
      'audio/x-mpeg-3',
      'audio/wave',
      'audio/x-wav'
    ]
    const fileType = audioFile.type || 'audio/webm' // Default to webm for blob recordings
    if (!validTypes.some(t => fileType.includes(t.replace('audio/', '')))) {
      return NextResponse.json(
        {
          success: false,
          error: `Unsupported audio type: ${fileType}`,
          errorType: 'transcription-failed'
        } as const,
        { status: 400 }
      )
    }

    // Get language hint for better transcription
    let language = languageHint || 'en'

    // Transcribe using Whisper API
    let transcription = ''
    let detectedLanguage: SupportedLanguage = 'en'
    let confidence = 0.9

    try {
      const openai = getOpenAIClient()

      // Create a File object from the Blob
      const arrayBuffer = await audioFile.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)

      // Use the appropriate model for the language
      const response = await openai.audio.transcriptions.create({
        file: new File([buffer], 'audio.webm', { type: audioFile.type || 'audio/webm' }),
        model: 'whisper-1',
        language: language === 'mr' ? 'hi' : language, // Whisper uses 'hi' for Hindi/Marathi
        prompt: getTranscriptionPrompt(language),
        temperature: 0.2, // Lower temperature for more accurate transcription
        response_format: 'verbose_json' // Get timestamp and confidence info
      })

      transcription = response.text
      confidence = response.segments?.[0]?.avg_logprob
        ? Math.max(0, Math.min(1, (response.segments[0].avg_logprob + 2) / 4)) // Normalize logprob to 0-1
        : 0.9

      // Detect language from transcript
      if (transcription) {
        detectedLanguage = detectLanguage(transcription)
      }

    } catch (whisperError) {
      console.error('Whisper API error:', whisperError)

      // Handle specific Whisper errors
      if (whisperError instanceof Error) {
        if (whisperError.message.includes('rate limit')) {
          return NextResponse.json(
            {
              success: false,
              error: 'API rate limit exceeded. Please try again later.',
              errorType: 'quota-exceeded'
            } as const,
            { status: 429 }
          )
        }

        if (whisperError.message.includes('invalid')) {
          return NextResponse.json(
            {
              success: false,
              error: 'Invalid audio file. Please try recording again.',
              errorType: 'transcription-failed'
            } as const,
            { status: 400 }
          )
        }
      }

      return NextResponse.json(
        {
          success: false,
          error: 'Failed to transcribe audio. Please try again.',
          errorType: 'transcription-failed'
        } as const,
        { status: 500 }
      )
    }

    // Validate transcription result
    if (!transcription || transcription.trim().length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'No speech detected in audio',
          errorType: 'no-speech'
        } as const,
        { status: 400 }
      )
    }

    // Clean up transcription (remove filler words, normalize)
    const cleanedTranscription = cleanTranscription(transcription, detectedLanguage)

    const transcriptionTime = Date.now() - startTime

    return NextResponse.json({
      success: true,
      text: cleanedTranscription,
      language: detectedLanguage,
      confidence,
      processingTime: transcriptionTime
    } as const)

  } catch (error) {
    // Log error for debugging in development only
    if (process.env.NODE_ENV === 'development') {
      console.error('Transcription API error:', error)
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to process audio. Please try again.',
        errorType: 'api-error'
      } as const,
      { status: 500 }
    )
  }
}

/**
 * Clean up transcription by removing filler words and normalizing text
 */
function cleanTranscription(text: string, language: SupportedLanguage): string {
  let cleaned = text.trim()

  // Remove common filler words
  const fillerWords: Record<SupportedLanguage, string[]> = {
    en: ['um', 'uh', 'er', 'like', 'you know', 'actually'],
    hi: ['उम्मीद', 'अरे', 'मतलब', 'बस'],
    mr: ['अरे', 'म्हणजे', 'बस', 'आहे']
  }

  const fillers = fillerWords[language]
  for (const filler of fillers) {
    const regex = new RegExp(`\\b${filler}\\b`, 'gi')
    cleaned = cleaned.replace(regex, '')
  }

  // Remove repeated words (stuttering)
  cleaned = cleaned.replace(/\b(\w+)\s+\1\b/gi, '$1')

  // Clean up extra whitespace
  cleaned = cleaned.replace(/\s+/g, ' ').trim()

  return cleaned
}

// ============================================================================
// OPTIONS Handler for CORS
// ============================================================================

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  })
}
