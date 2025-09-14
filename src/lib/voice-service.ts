export interface VoiceRecognitionResult {
  transcript: string
  confidence: number
  isFinal: boolean
  language: string
}

export interface VoiceSynthesisOptions {
  text: string
  language: 'en' | 'hi' | 'mr'
  rate?: number // 0.5 to 2
  pitch?: number // 0 to 2
  volume?: number // 0 to 1
}

export class VoiceService {
  private static recognition: any = null
  private static synthesis: SpeechSynthesis | null = null
  private static isListening = false
  private static voices: SpeechSynthesisVoice[] = []

  // Initialize voice services
  static initialize() {
    if (typeof window === 'undefined') return

    // Initialize speech recognition
    if ('webkitSpeechRecognition' in window) {
      this.recognition = new (window as any).webkitSpeechRecognition()
      this.setupRecognition()
    } else if ('SpeechRecognition' in window) {
      this.recognition = new (window as any).SpeechRecognition()
      this.setupRecognition()
    }

    // Initialize speech synthesis
    if ('speechSynthesis' in window) {
      this.synthesis = window.speechSynthesis
      this.loadVoices()
    }
  }

  private static setupRecognition() {
    if (!this.recognition) return

    this.recognition.continuous = false
    this.recognition.interimResults = false
    this.recognition.maxAlternatives = 1
  }

  private static loadVoices() {
    if (!this.synthesis) return

    const loadVoicesAsync = () => {
      this.voices = this.synthesis!.getVoices()
      if (this.voices.length === 0) {
        // Some browsers load voices asynchronously
        setTimeout(loadVoicesAsync, 100)
      }
    }

    loadVoicesAsync()

    // Handle voice changes
    this.synthesis.onvoiceschanged = () => {
      this.voices = this.synthesis!.getVoices()
    }
  }

  // Start voice recognition
  static startRecognition(
    language: 'en' | 'hi' | 'mr' = 'en',
    onResult?: (result: VoiceRecognitionResult) => void,
    onError?: (error: string) => void,
    onEnd?: () => void,
  ): boolean {
    if (!this.recognition || this.isListening) return false

    // Set language
    const languageMap = {
      en: 'en-IN',
      hi: 'hi-IN',
      mr: 'mr-IN',
    }
    this.recognition.lang = languageMap[language]

    // Set up event handlers
    this.recognition.onstart = () => {
      this.isListening = true
    }

    this.recognition.onresult = (event: any) => {
      const result = event.results[0]
      if (result && onResult) {
        onResult({
          transcript: result[0].transcript,
          confidence: result[0].confidence,
          isFinal: result.isFinal,
          language,
        })
      }
    }

    this.recognition.onerror = (event: any) => {
      this.isListening = false
      if (onError) {
        onError(this.getErrorMessage(event.error, language))
      }
    }

    this.recognition.onend = () => {
      this.isListening = false
      if (onEnd) onEnd()
    }

    try {
      this.recognition.start()
      return true
    } catch (error) {
      this.isListening = false
      if (onError) {
        onError(this.getErrorMessage('not-allowed', language))
      }
      return false
    }
  }

  // Stop voice recognition
  static stopRecognition() {
    if (this.recognition && this.isListening) {
      this.recognition.stop()
    }
  }

  // Text-to-speech synthesis
  static speak(options: VoiceSynthesisOptions): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.synthesis) {
        reject(new Error('Speech synthesis not supported'))
        return
      }

      // Cancel any ongoing speech
      this.synthesis.cancel()

      const utterance = new SpeechSynthesisUtterance(options.text)

      // Find appropriate voice
      const voice = this.findBestVoice(options.language)
      if (voice) utterance.voice = voice

      // Set options
      utterance.rate = options.rate || 1
      utterance.pitch = options.pitch || 1
      utterance.volume = options.volume || 1

      // Set event handlers
      utterance.onend = () => resolve()
      utterance.onerror = (event) => reject(new Error(`Speech synthesis error: ${event.error}`))

      // Start speaking
      this.synthesis.speak(utterance)
    })
  }

  // Stop speech synthesis
  static stopSpeaking() {
    if (this.synthesis) {
      this.synthesis.cancel()
    }
  }

  // Check if voice recognition is supported
  static isRecognitionSupported(): boolean {
    return 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window
  }

  // Check if speech synthesis is supported
  static isSynthesisSupported(): boolean {
    return 'speechSynthesis' in window
  }

  // Check if currently listening
  static getIsListening(): boolean {
    return this.isListening
  }

  // Get available voices for a language
  static getVoicesForLanguage(language: 'en' | 'hi' | 'mr'): SpeechSynthesisVoice[] {
    const languageMap = {
      en: ['en-IN', 'en-US', 'en-GB', 'en'],
      hi: ['hi-IN', 'hi'],
      mr: ['mr-IN', 'mr'],
    }

    return this.voices.filter((voice) =>
      languageMap[language].some((lang) => voice.lang.toLowerCase().startsWith(lang.toLowerCase())),
    )
  }

  private static findBestVoice(language: 'en' | 'hi' | 'mr'): SpeechSynthesisVoice | null {
    const availableVoices = this.getVoicesForLanguage(language)

    if (availableVoices.length === 0) return null

    // Prefer local voices
    const localVoices = availableVoices.filter((voice) => voice.localService)
    if (localVoices.length > 0) return localVoices[0]

    // Prefer Indian English for English
    if (language === 'en') {
      const indianVoice = availableVoices.find((voice) => voice.lang.toLowerCase().includes('in'))
      if (indianVoice) return indianVoice
    }

    // Return first available voice
    return availableVoices[0]
  }

  private static getErrorMessage(errorCode: string, language: 'en' | 'hi' | 'mr'): string {
    const messages = {
      'no-speech': {
        en: 'No speech detected. Please try speaking clearly.',
        hi: 'कोई आवाज़ नहीं सुनाई दी। कृपया स्पष्ट रूप से बोलें।',
        mr: 'कोणतीही आवाज ऐकू आली नाही. कृपया स्पष्टपणे बोला.',
      },
      'audio-capture': {
        en: 'Audio capture failed. Please check your microphone.',
        hi: 'ऑडियो कैप्चर असफल। कृपया अपना माइक्रोफोन जांचें।',
        mr: 'ऑडिओ कॅप्चर अयशस्वी. कृपया तुमचा मायक्रोफोन तपासा.',
      },
      'not-allowed': {
        en: 'Microphone access denied. Please allow microphone permissions.',
        hi: 'माइक्रोफोन का उपयोग नकारा गया। कृपया माइक्रोफोन की अनुमति दें।',
        mr: 'मायक्रोफोनचा वापर नाकारला. कृपया मायक्रोफोनची परवानगी द्या.',
      },
      network: {
        en: 'Network error. Please check your internet connection.',
        hi: 'नेटवर्क त्रुटि। कृपया अपना इंटरनेट कनेक्शन जांचें।',
        mr: 'नेटवर्क त्रुटी. कृपया तुमचे इंटरनेट कनेक्शन तपासा.',
      },
    }

    return messages[errorCode as keyof typeof messages]?.[language] || messages['network'][language]
  }

  // Voice command processing for farming
  static processFarmingCommand(
    transcript: string,
    language: 'en' | 'hi' | 'mr',
  ): { intent: string; entities: any; confidence: number } {
    const lowerTranscript = transcript.toLowerCase()

    // Define command patterns for different languages
    const patterns = {
      en: {
        irrigation: /water|irrigat|spray water/i,
        fertilization: /fertil|nutrition|feed|compost/i,
        disease: /disease|infection|sick|spots|fungus/i,
        harvest: /harvest|pick|collect|cut/i,
        weather: /weather|rain|temperature|climate/i,
        calculation: /calculat|compute|measure/i,
        record: /record|log|note|save/i,
      },
      hi: {
        irrigation: /पानी|सिंचाई|स्प्रे/i,
        fertilization: /उर्वरक|खाद|पोषण/i,
        disease: /बीमारी|संक्रमण|रोग/i,
        harvest: /फसल|कटाई/i,
        weather: /मौसम|बारिश|तापमान/i,
        calculation: /गणना|हिसाब/i,
        record: /रिकॉर्ड|लिख/i,
      },
      mr: {
        irrigation: /पाणी|सिंचन|फवारणी/i,
        fertilization: /खत|पोषण|खाद्य/i,
        disease: /आजार|रोग|संक्रमण/i,
        harvest: /कापणी|पिक/i,
        weather: /हवामान|पाऊस|तापमान/i,
        calculation: /गणना|हिशेब/i,
        record: /नोंद|लिहा/i,
      },
    }

    const langPatterns = patterns[language]
    let intent = 'general'
    let confidence = 0.5

    // Find matching intent
    for (const [intentName, pattern] of Object.entries(langPatterns)) {
      if (pattern.test(lowerTranscript)) {
        intent = intentName
        confidence = 0.8
        break
      }
    }

    // Extract entities (numbers, dates, etc.)
    const entities = this.extractEntities(transcript, language)

    return { intent, entities, confidence }
  }

  private static extractEntities(transcript: string, language: 'en' | 'hi' | 'mr') {
    const entities: any = {}

    // Extract numbers
    const numberMatches = transcript.match(/\d+(?:\.\d+)?/g)
    if (numberMatches) {
      entities.numbers = numberMatches.map(Number)
    }

    // Extract time references
    const timePatterns = {
      en: /today|tomorrow|yesterday|morning|evening|afternoon/i,
      hi: /आज|कल|कुल|सुबह|शाम|दोपहर/i,
      mr: /आज|उद्या|काल|सकाळ|संध्याकाळ|दुपार/i,
    }

    const timeMatch = transcript.match(timePatterns[language])
    if (timeMatch) {
      entities.time = timeMatch[0]
    }

    return entities
  }

  // Convert speech to farming actions
  static speechToAction(
    transcript: string,
    language: 'en' | 'hi' | 'mr',
  ): { action: string; params: any } | null {
    const command = this.processFarmingCommand(transcript, language)

    switch (command.intent) {
      case 'irrigation':
        return {
          action: 'navigate',
          params: { route: '/calculators', section: 'irrigation' },
        }

      case 'disease':
        return {
          action: 'navigate',
          params: { route: '/ai-assistant', section: 'detection' },
        }

      case 'calculation':
        return {
          action: 'navigate',
          params: { route: '/calculators' },
        }

      case 'record':
        return {
          action: 'navigate',
          params: { route: '/journal' },
        }

      case 'weather':
        return {
          action: 'navigate',
          params: { route: '/weather' },
        }

      case 'harvest':
        return {
          action: 'navigate',
          params: { route: '/journal', section: 'harvest' },
        }

      default:
        return {
          action: 'chat',
          params: { message: transcript },
        }
    }
  }
}

// Initialize voice service when module loads
if (typeof window !== 'undefined') {
  VoiceService.initialize()
}
