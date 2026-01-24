'use client'

// Voice Assistant Hybrid Component
// A floating voice assistant for Indian farmers to log farming activities

import React, { useState, useRef, useCallback, useEffect } from 'react'
import { Mic, MicOff, X, Loader2, CheckCircle2, AlertCircle, Volume2, VolumeX } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter
} from '@/components/ui/sheet'
import { useToast } from '@/hooks/use-toast'
import {
  VOICE_ERROR_MESSAGES,
  type SupportedLanguage,
  type VoiceAssistantState,
  type VoiceErrorType
} from '@/types/voice'

// ============================================================================
// Types
// ============================================================================

interface VoiceConversationMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface TranscriptionResponse {
  success: boolean
  text?: string
  language?: SupportedLanguage
  confidence?: number
  error?: string
  errorType?: VoiceErrorType
}

interface ProcessResponse {
  success: boolean
  intent?: string
  data?: Record<string, unknown>
  followUpQuestion?: string
  clarificationField?: string
  responseText?: string
  confidence?: number
  conversationId?: string
  error?: string
  errorType?: VoiceErrorType
}

interface SynthesisResponse {
  success: boolean
  audioBase64?: string
  audioFormat?: string
  text?: string
  useBrowserTTS?: boolean
  browserVoice?: string
  error?: string
}

interface VoiceAssistantHybridProps {
  language?: SupportedLanguage
  onSaveSuccess?: (intent: string, recordId: number) => void
  className?: string
}

// ============================================================================
// Component
// ============================================================================

export function VoiceAssistantHybrid({
  language = 'en',
  onSaveSuccess,
  className = ''
}: VoiceAssistantHybridProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [state, setState] = useState<VoiceAssistantState>('idle')
  const [transcript, setTranscript] = useState('')
  const [responseText, setResponseText] = useState('')
  const [error, setError] = useState<string>('')
  const [errorType, setErrorType] = useState<VoiceErrorType | null>(null)
  const [conversationHistory, setConversationHistory] = useState<VoiceConversationMessage[]>([])
  const [conversationId, setConversationId] = useState<string>()
  const [pendingData, setPendingData] = useState<Record<string, unknown> | null>(null)
  const [pendingIntent, setPendingIntent] = useState<string | null>(null)
  const [audioLevel, setAudioLevel] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const analyserRef = useRef<AnalyserNode | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const animationFrameRef = useRef<number>()
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const { toast } = useToast()

  // ============================================================================
  // Cleanup
  // ============================================================================

  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
      if (audioContextRef.current) {
        audioContextRef.current.close()
      }
    }
  }, [])

  // ============================================================================
  // Audio Recording
  // ============================================================================

  const startRecording = useCallback(async () => {
    try {
      setState('requesting_permission')
      setError('')
      setErrorType(null)

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })

      // Set up audio context for visualization
      const audioContext = new AudioContext()
      const analyser = audioContext.createAnalyser()
      const source = audioContext.createMediaStreamSource(stream)
      source.connect(analyser)
      analyser.fftSize = 256
      analyserRef.current = analyser
      audioContextRef.current = audioContext

      // Set up media recorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm'
      })

      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        await processAudio(audioBlob)

        // Stop all tracks
        stream.getTracks().forEach(track => track.stop())
        if (audioContextRef.current) {
          await audioContextRef.current.close()
          audioContextRef.current = null
        }
      }

      mediaRecorder.start(100) // Collect data every 100ms
      setState('recording')

      // Start audio level visualization
      visualizeAudio()

    } catch (err) {
      console.error('Error starting recording:', err)

      // Determine error type locally to avoid reading stale state
      let newErrorType: VoiceErrorType = 'no-speech'
      if (err instanceof Error) {
        if (err.name === 'NotAllowedError') {
          newErrorType = 'mic-permission'
        }
      }

      setErrorType(newErrorType)
      setError(VOICE_ERROR_MESSAGES[newErrorType][language])
      setState('error')
      toast({
        title: 'Microphone Error',
        description: VOICE_ERROR_MESSAGES[newErrorType][language],
        variant: 'destructive'
      })
    }
  }, [language, toast])

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
      setState('processing')

      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
      setAudioLevel(0)
    }
  }, [])

  const visualizeAudio = useCallback(() => {
    if (!analyserRef.current) return

    const analyser = analyserRef.current
    const bufferLength = analyser.frequencyBinCount
    const dataArray = new Uint8Array(bufferLength)

    const draw = () => {
      animationFrameRef.current = requestAnimationFrame(draw)
      analyser.getByteFrequencyData(dataArray)

      const average = dataArray.reduce((a, b) => a + b) / bufferLength
      setAudioLevel(average / 255) // Normalize to 0-1
    }

    draw()
  }, [])

  // ============================================================================
  // Audio Processing Pipeline
  // ============================================================================

  const processAudio = async (audioBlob: Blob) => {
    try {
      // Step 1: Transcribe
      setState('processing')
      const transcriptionResult = await transcribeAudio(audioBlob)

      if (!transcriptionResult.success || !transcriptionResult.text) {
        handleTranscriptionError(transcriptionResult)
        return
      }

      setTranscript(transcriptionResult.text)
      addMessage('user', transcriptionResult.text)

      // Step 2: Process with GPT-4
      const processResult = await processTranscript(
        transcriptionResult.text,
        transcriptionResult.language || language
      )

      if (!processResult.success) {
        handleProcessError(processResult)
        return
      }

      // Step 3: Handle response
      await handleProcessResponse(processResult)

    } catch (err) {
      console.error('Error processing audio:', err)
      setError(VOICE_ERROR_MESSAGES['api-error'][language])
      setState('error')
    }
  }

  const transcribeAudio = async (audioBlob: Blob): Promise<TranscriptionResponse> => {
    const formData = new FormData()
    formData.append('audio', audioBlob, 'audio.webm')
    formData.append('language', language)

    const response = await fetch('/api/voice/transcribe', {
      method: 'POST',
      body: formData
    })

    if (!response.ok) {
      return { success: false, error: 'Failed to transcribe' }
    }

    return await response.json()
  }

  const processTranscript = async (
    text: string,
    detectedLanguage: SupportedLanguage
  ): Promise<ProcessResponse> => {
    const response = await fetch('/api/voice/process', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        transcript: text,
        language: detectedLanguage,
        conversationId,
        conversationHistory: conversationHistory.map(m => ({
          role: m.role,
          content: m.content
        }))
      })
    })

    if (!response.ok) {
      return { success: false, error: 'Failed to process' }
    }

    return await response.json()
  }

  const handleProcessResponse = async (result: ProcessResponse) => {
    if (result.responseText) {
      setResponseText(result.responseText)
      addMessage('assistant', result.responseText)

      // Speak the response
      await speakResponse(result.responseText, result.conversationId)
    }

    if (result.conversationId) {
      setConversationId(result.conversationId)
    }

    // If we have extracted data, save it
    if (result.data && result.intent && !result.followUpQuestion) {
      setPendingData(result.data)
      setPendingIntent(result.intent)
    }

    // If there's a follow-up question, wait for user input
    if (result.followUpQuestion) {
      setState('idle')
    } else if (result.data && result.intent) {
      // Auto-save the data
      await saveLog(result.intent, result.data)
    } else {
      setState('idle')
    }
  }

  const handleTranscriptionError = (result: TranscriptionResponse) => {
    if (result.error) {
      setError(result.error)
      setErrorType(result.errorType || 'transcription-failed')
      setState('error')
      toast({
        title: 'Transcription Failed',
        description: result.error,
        variant: 'destructive'
      })
    } else {
      setState('idle')
    }
  }

  const handleProcessError = (result: ProcessResponse) => {
    if (result.error) {
      setError(result.error)
      setErrorType(result.errorType || 'processing-failed')
      setState('error')
      toast({
        title: 'Processing Failed',
        description: result.error,
        variant: 'destructive'
      })
    } else {
      setState('idle')
    }
  }

  // ============================================================================
  // Text-to-Speech
  // ============================================================================

  const speakResponse = async (text: string, newConversationId?: string) => {
    try {
      const response = await fetch('/api/voice/synthesize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, language })
      })

      if (!response.ok) {
        return // Silently fail for TTS
      }

      const result: SynthesisResponse = await response.json()

      if (result.success) {
        if (result.audioBase64) {
          // Play Google TTS audio
          playAudioBase64(result.audioBase64, result.audioFormat || 'mp3')
        } else if (result.useBrowserTTS && result.text) {
          // Use browser TTS
          speakWithBrowser(result.text, result.browserVoice)
        }

        if (newConversationId) {
          setConversationId(newConversationId)
        }
      }
    } catch (err) {
      console.error('TTS error:', err)
      // Silently fail - transcription is more important
    }
  }

  const playAudioBase64 = (base64: string, format: string) => {
    try {
      const audioUrl = `data:audio/${format};base64,${base64}`

      if (audioRef.current) {
        audioRef.current.src = audioUrl
        audioRef.current.onplay = () => setIsPlaying(true)
        audioRef.current.onended = () => setIsPlaying(false)
        audioRef.current.onerror = () => setIsPlaying(false)
        audioRef.current.play().catch(() => {
          setIsPlaying(false)
        })
      } else {
        const audio = new Audio(audioUrl)
        audioRef.current = audio
        audio.onplay = () => setIsPlaying(true)
        audio.onended = () => setIsPlaying(false)
        audio.onerror = () => setIsPlaying(false)
        audio.play().catch(() => {
          setIsPlaying(false)
        })
      }
    } catch (err) {
      console.error('Error playing audio:', err)
    }
  }

  const speakWithBrowser = (text: string, voice?: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text)
      // Fix operator precedence: parentheses ensure ternary is evaluated before ||
      utterance.lang = voice || (language === 'mr' ? 'mr-IN' : language === 'hi' ? 'hi-IN' : 'en-IN')
      utterance.onstart = () => setIsPlaying(true)
      utterance.onend = () => setIsPlaying(false)
      utterance.onerror = () => setIsPlaying(false)

      // Try to find a matching voice
      const voices = speechSynthesis.getVoices()
      const matchingVoice = voices.find(v =>
        v.lang.startsWith(language === 'mr' ? 'mr' : language)
      )
      if (matchingVoice) {
        utterance.voice = matchingVoice
      }

      speechSynthesis.speak(utterance)
    }
  }

  const stopSpeaking = () => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
    }
    if ('speechSynthesis' in window) {
      speechSynthesis.cancel()
    }
    setIsPlaying(false)
  }

  // ============================================================================
  // Save Log
  // ============================================================================

  const saveLog = async (intent: string, data: Record<string, unknown>) => {
    try {
      const response = await fetch('/api/voice-logs/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          intent,
          data,
          conversationId,
          transcript,
          confidence: 1.0
        })
      })

      const result = await response.json()

      if (result.success) {
        setState('success')
        setPendingData(null)
        setPendingIntent(null)

        if (onSaveSuccess && result.recordId) {
          onSaveSuccess(intent, result.recordId)
        }

        toast({
          title: 'Log Saved Successfully',
          description: getSuccessMessage(intent, language),
          variant: 'default'
        })

        // Reset after a delay
        setTimeout(() => {
          setState('idle')
        }, 2000)
      } else {
        throw new Error(result.error || 'Failed to save')
      }

    } catch (err) {
      console.error('Error saving log:', err)
      setError('Failed to save log. Please try again.')
      setState('error')
    }
  }

  // ============================================================================
  // Helper Functions
  // ============================================================================

  const addMessage = (role: 'user' | 'assistant', content: string) => {
    const message: VoiceConversationMessage = {
      role,
      content,
      timestamp: new Date()
    }
    setConversationHistory(prev => [...prev, message])
  }

  const getSuccessMessage = (intent: string, lang: SupportedLanguage): string => {
    const messages: Record<string, Record<SupportedLanguage, string>> = {
      irrigation: { en: 'Irrigation log saved!', hi: 'सिंचाई लॉग सहेजा गया!', mr: 'सिंचन नोंद जमा झाली!' },
      spray: { en: 'Spray log saved!', hi: 'स्प्रे लॉग सहेजा गया!', mr: 'फवारणी नोंद जमा झाली!' },
      fertigation: { en: 'Fertigation log saved!', hi: 'फर्टीगेशन लॉग सहेजा गया!', mr: 'खत देण्याची नोंद जमा झाली!' },
      harvest: { en: 'Harvest log saved!', hi: 'फसल कटाई लॉग सहेजा गया!', mr: 'कापणी नोंद जमा झाली!' }
    }
    return messages[intent]?.[lang] || messages[intent]?.en || 'Log saved successfully!'
  }

  const resetConversation = () => {
    setConversationHistory([])
    setTranscript('')
    setResponseText('')
    setError('')
    setErrorType(null)
    setConversationId(undefined)
    setPendingData(null)
    setPendingIntent(null)
    setState('idle')
  }

  // ============================================================================
  // Render
  // ============================================================================

  const isRecording = state === 'recording'
  const isProcessing = state === 'processing'
  const hasError = state === 'error'
  const isSuccess = state === 'success'

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          className={`fixed bottom-24 right-4 z-50 rounded-full w-14 h-14 shadow-lg ${className}`}
          size="icon"
          variant={isRecording ? 'destructive' : 'default'}
        >
          {isRecording ? (
            <Mic className="h-6 w-6 animate-pulse" />
          ) : isSuccess ? (
            <CheckCircle2 className="h-6 w-6" />
          ) : hasError ? (
            <AlertCircle className="h-6 w-6" />
          ) : (
            <Mic className="h-6 w-6" />
          )}
        </Button>
      </SheetTrigger>

      <SheetContent
        side="bottom"
        className="h-[80vh] rounded-t-3xl border-t-4 border-t-primary"
      >
        <SheetHeader className="text-left mb-4">
          <SheetTitle>Voice Assistant</SheetTitle>
          <SheetDescription>
            Speak to log your farming activities. Supports English, Hindi, and Marathi.
          </SheetDescription>
        </SheetHeader>

        {/* Conversation Messages */}
        <div className="flex-1 overflow-y-auto mb-4 space-y-4">
          {conversationHistory.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <Mic className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Tap the microphone and start speaking.</p>
              <p className="text-sm mt-2">
                Try saying: "मी आज 2 तास सिंचन केलं" or "I irrigated for 2 hours today"
              </p>
            </div>
          ) : (
            conversationHistory.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                    msg.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  }`}
                >
                  <p className="text-sm">{msg.content}</p>
                  <span className="text-xs opacity-60 mt-1 block">
                    {msg.timestamp.toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
              </div>
            ))
          )}

          {/* Loading indicator */}
          {isProcessing && (
            <div className="flex justify-start">
              <div className="bg-muted rounded-2xl px-4 py-3 flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">Processing...</span>
              </div>
            </div>
          )}
        </div>

        {/* Audio Level Visualization */}
        {isRecording && (
          <div className="h-12 bg-muted rounded-lg mb-4 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary to-primary/50 transition-all duration-100 ease-out"
              style={{ width: `${audioLevel * 100}%` }}
            />
          </div>
        )}

        {/* Error Display */}
        {hasError && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 mb-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-destructive">Error</p>
                <p className="text-sm text-muted-foreground mt-1">{error}</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="shrink-0"
                onClick={() => setState('idle')}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Audio Controls */}
        {isPlaying && (
          <div className="flex items-center justify-center gap-4 mb-4">
            <Button
              variant="outline"
              size="icon"
              onClick={stopSpeaking}
            >
              <VolumeX className="h-4 w-4" />
            </Button>
            <span className="text-sm text-muted-foreground">Playing response...</span>
          </div>
        )}

        {/* Controls */}
        <SheetFooter className="gap-2">
          <Button
            variant="outline"
            onClick={resetConversation}
            disabled={conversationHistory.length === 0}
          >
            Reset
          </Button>

          {isRecording ? (
            <Button
              variant="destructive"
              onClick={stopRecording}
              className="flex-1"
            >
              <MicOff className="h-4 w-4 mr-2" />
              Stop Recording
            </Button>
          ) : (
            <Button
              onClick={startRecording}
              disabled={isProcessing}
              className="flex-1"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Mic className="h-4 w-4 mr-2" />
                  {state === 'idle' ? 'Start Recording' : 'Try Again'}
                </>
              )}
            </Button>
          )}
        </SheetFooter>
      </SheetContent>

      {/* Hidden audio element for TTS playback */}
      <audio ref={audioRef} className="hidden" />
    </Sheet>
  )
}

// ============================================================================
// Export Default
// ============================================================================

export default VoiceAssistantHybrid
