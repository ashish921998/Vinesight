import * as tf from '@tensorflow/tfjs'
import OpenAI from 'openai'

export interface DiseaseDetectionResult {
  disease: string
  confidence: number
  severity: 'low' | 'medium' | 'high' | 'critical'
  treatment: string[]
  description: string
  preventionTips: string[]
}

export interface ImageAnalysisResult {
  diseaseDetection?: DiseaseDetectionResult
  plantHealth?: {
    overallHealth: number // 0-100
    leafColor: 'healthy' | 'yellowing' | 'brown' | 'spotted'
    leafDamage: number // percentage
  }
  grapeClusterCount?: number
  berrySize?: 'small' | 'medium' | 'large'
  ripeness?: 'unripe' | 'veraison' | 'ripe' | 'overripe'
}

export interface AIRecommendation {
  category: 'irrigation' | 'fertilization' | 'pest_control' | 'pruning' | 'harvest' | 'general'
  priority: 'low' | 'medium' | 'high' | 'critical'
  title: string
  description: string
  actions: string[]
  timing: string
  expectedImpact: string
}

// Disease detection models configuration
export const GRAPE_DISEASES = {
  powdery_mildew: {
    name: 'Powdery Mildew',
    description: 'Fungal disease causing white powdery growth on leaves',
    treatments: [
      'Apply sulfur-based fungicide',
      'Improve air circulation',
      'Remove affected leaves',
      'Apply preventive copper spray',
    ],
    prevention: [
      'Maintain good canopy management',
      'Ensure adequate spacing between vines',
      'Monitor humidity levels',
      'Apply preventive treatments during susceptible periods',
    ],
  },
  downy_mildew: {
    name: 'Downy Mildew',
    description: 'Fungal disease causing yellow spots and white downy growth',
    treatments: [
      'Apply copper-based fungicide',
      'Improve drainage',
      'Remove infected plant material',
      'Use systemic fungicides if severe',
    ],
    prevention: [
      'Ensure good air circulation',
      'Avoid overhead irrigation',
      'Plant resistant varieties',
      'Monitor weather conditions closely',
    ],
  },
  botrytis: {
    name: 'Botrytis Bunch Rot',
    description: 'Fungal disease affecting grape clusters',
    treatments: [
      'Remove affected clusters immediately',
      'Apply specific anti-botrytis fungicide',
      'Improve air circulation around clusters',
      'Reduce humidity in vineyard',
    ],
    prevention: [
      'Manage canopy for good air flow',
      'Avoid wounding berries',
      'Harvest at optimal time',
      'Monitor weather conditions during ripening',
    ],
  },
  black_rot: {
    name: 'Black Rot',
    description: 'Fungal disease causing black spots and mummified berries',
    treatments: [
      'Apply broad-spectrum fungicide',
      'Remove infected berries and leaves',
      'Prune for better air circulation',
      'Apply lime sulfur treatment',
    ],
    prevention: [
      'Remove mummified berries from previous season',
      'Maintain good sanitation practices',
      'Apply preventive fungicide treatments',
      'Monitor during wet weather periods',
    ],
  },
  anthracnose: {
    name: 'Anthracnose',
    description: 'Fungal disease causing dark sunken spots',
    treatments: [
      'Apply copper-based fungicide',
      'Remove infected plant parts',
      'Improve drainage',
      'Use resistant rootstock',
    ],
    prevention: [
      'Plant resistant varieties',
      'Maintain good sanitation',
      'Avoid overhead irrigation',
      'Apply preventive treatments in spring',
    ],
  },
  healthy: {
    name: 'Healthy Plant',
    description: 'Plant appears healthy with no visible disease symptoms',
    treatments: [],
    prevention: [
      'Continue regular monitoring',
      'Maintain good cultural practices',
      'Apply preventive treatments as scheduled',
      'Keep records of plant health status',
    ],
  },
}

export class AIService {
  private static openai: OpenAI | null = null
  private static diseaseModel: tf.LayersModel | null = null

  // Initialize OpenAI client - Use server-side API routes instead
  static async initializeOpenAI() {
    // OpenAI calls should go through server-side API routes
    // Client-side API key exposure is a security vulnerability
    this.openai = null // Removed client-side OpenAI initialization
  }

  // Load pre-trained disease detection model
  static async loadDiseaseModel(): Promise<void> {
    try {
      // In a real implementation, you would load a trained model
      // For now, we'll simulate with a basic model structure

      // Create a simple CNN model for demonstration
      const model = tf.sequential({
        layers: [
          tf.layers.conv2d({
            inputShape: [224, 224, 3],
            filters: 32,
            kernelSize: 3,
            activation: 'relu',
          }),
          tf.layers.maxPooling2d({ poolSize: 2 }),
          tf.layers.conv2d({ filters: 64, kernelSize: 3, activation: 'relu' }),
          tf.layers.maxPooling2d({ poolSize: 2 }),
          tf.layers.flatten(),
          tf.layers.dense({ units: 128, activation: 'relu' }),
          tf.layers.dropout({ rate: 0.5 }),
          tf.layers.dense({ units: Object.keys(GRAPE_DISEASES).length, activation: 'softmax' }),
        ],
      })

      this.diseaseModel = model
    } catch (error) {}
  }

  // Analyze image for disease detection
  static async analyzeImage(
    imageElement: HTMLImageElement | HTMLCanvasElement,
  ): Promise<ImageAnalysisResult> {
    try {
      // Preprocess image for model input
      const tensor = tf.browser
        .fromPixels(imageElement)
        .resizeNearestNeighbor([224, 224])
        .expandDims(0)
        .div(255.0)

      // Simulate disease detection (replace with actual model prediction)
      const predictions = await this.simulateDiseaseDetection(tensor)

      // Clean up tensor
      tensor.dispose()

      return {
        diseaseDetection: predictions.diseaseDetection,
        plantHealth: predictions.plantHealth,
        grapeClusterCount: predictions.grapeClusterCount,
        berrySize: predictions.berrySize,
        ripeness: predictions.ripeness,
      }
    } catch (error) {
      throw new Error('Failed to analyze image')
    }
  }

  // Simulate disease detection (replace with actual model inference)
  private static async simulateDiseaseDetection(tensor: tf.Tensor): Promise<ImageAnalysisResult> {
    // Simulate analysis delay
    await new Promise((resolve) => setTimeout(resolve, 1500))

    // Generate random but realistic results for demo
    const diseases = Object.keys(GRAPE_DISEASES)
    const randomDisease = diseases[Math.floor(Math.random() * diseases.length)]
    const confidence = 0.7 + Math.random() * 0.25 // 70-95% confidence

    const diseaseInfo = GRAPE_DISEASES[randomDisease as keyof typeof GRAPE_DISEASES]

    let severity: 'low' | 'medium' | 'high' | 'critical' = 'low'
    if (confidence > 0.9) severity = 'critical'
    else if (confidence > 0.8) severity = 'high'
    else if (confidence > 0.7) severity = 'medium'

    return {
      diseaseDetection: {
        disease: diseaseInfo.name,
        confidence,
        severity,
        treatment: diseaseInfo.treatments,
        description: diseaseInfo.description,
        preventionTips: diseaseInfo.prevention,
      },
      plantHealth: {
        overallHealth:
          randomDisease === 'healthy' ? 85 + Math.random() * 15 : 40 + Math.random() * 30,
        leafColor:
          randomDisease === 'healthy' ? 'healthy' : Math.random() > 0.5 ? 'yellowing' : 'spotted',
        leafDamage: randomDisease === 'healthy' ? Math.random() * 5 : 10 + Math.random() * 40,
      },
      grapeClusterCount: Math.floor(3 + Math.random() * 8),
      berrySize: ['small', 'medium', 'large'][Math.floor(Math.random() * 3)] as
        | 'small'
        | 'medium'
        | 'large',
      ripeness: ['unripe', 'veraison', 'ripe', 'overripe'][Math.floor(Math.random() * 4)] as
        | 'unripe'
        | 'veraison'
        | 'ripe'
        | 'overripe',
    }
  }

  // Generate AI-powered recommendations
  static async generateRecommendations(
    farmData: any,
    weatherData?: any,
    diseaseData?: DiseaseDetectionResult[],
  ): Promise<AIRecommendation[]> {
    const recommendations: AIRecommendation[] = []

    // Disease-based recommendations
    if (diseaseData && diseaseData.length > 0) {
      diseaseData.forEach((disease) => {
        if (disease.severity !== 'low') {
          recommendations.push({
            category: 'pest_control',
            priority: disease.severity === 'critical' ? 'critical' : 'high',
            title: `Address ${disease.disease}`,
            description: `${disease.disease} detected with ${(disease.confidence * 100).toFixed(1)}% confidence`,
            actions: disease.treatment,
            timing: disease.severity === 'critical' ? 'Immediate' : 'Within 24-48 hours',
            expectedImpact: 'Prevent further crop damage and yield loss',
          })
        }
      })
    }

    // Weather-based irrigation recommendations
    if (weatherData && weatherData.humidity < 40) {
      recommendations.push({
        category: 'irrigation',
        priority: 'medium',
        title: 'Increase Irrigation Frequency',
        description: 'Low humidity detected, plants may need additional water',
        actions: [
          'Increase irrigation frequency by 25%',
          'Monitor soil moisture levels daily',
          'Consider early morning irrigation to reduce evaporation',
        ],
        timing: 'Next irrigation cycle',
        expectedImpact: 'Maintain optimal plant water status',
      })
    }

    // Seasonal recommendations
    const currentMonth = new Date().getMonth()
    if (currentMonth >= 2 && currentMonth <= 4) {
      // Spring months
      recommendations.push({
        category: 'fertilization',
        priority: 'medium',
        title: 'Spring Fertilization Program',
        description: 'Apply balanced fertilizer to support new growth',
        actions: [
          'Apply NPK fertilizer according to soil test results',
          'Monitor new shoot growth',
          'Consider organic matter application',
        ],
        timing: 'Early spring, before bud break',
        expectedImpact: 'Promote healthy vine growth and fruit development',
      })
    }

    return recommendations
  }

  // Get AI-powered chat response with streaming support
  static async getChatResponse(
    message: string,
    context: {
      farmData?: any
      language?: 'en' | 'hi' | 'mr'
      recentAnalysis?: ImageAnalysisResult[]
      conversationHistory?: Array<{ role: string; content: string; queryType?: string }>
      recentTopics?: string[]
    },
    onStreamUpdate?: (chunk: string) => void,
  ): Promise<string> {
    try {
      // Development mode: Use mock streaming for testing mobile UI (always use mock for now)
      if (onStreamUpdate) {
        return await this.getMockStreamingResponse(message, context, onStreamUpdate)
      }

      // Production: Try streaming response first for better UX
      if (onStreamUpdate) {
        return await this.getChatResponseStream(message, context, onStreamUpdate)
      }

      // Fallback to regular response
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          context,
          stream: false,
        }),
      })

      if (!response.ok) {
        throw new Error('Server request failed')
      }

      const data = await response.json()
      return data.response || this.generateFallbackResponse(message, context)
    } catch (error) {
      console.error('AI Chat error:', error)
      return this.generateFallbackResponse(message, context)
    }
  }

  // Streaming chat response for better user experience
  static async getChatResponseStream(
    message: string,
    context: {
      farmData?: any
      language?: 'en' | 'hi' | 'mr'
      recentAnalysis?: ImageAnalysisResult[]
      conversationHistory?: Array<{ role: string; content: string; queryType?: string }>
      recentTopics?: string[]
    },
    onStreamUpdate: (chunk: string) => void,
  ): Promise<string> {
    try {
      // Use the main chat route with streaming enabled
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          context,
          stream: true, // Enable streaming
        }),
      })

      if (!response.ok) {
        throw new Error('Streaming request failed')
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let fullResponse = ''

      if (reader) {
        while (true) {
          const { value, done } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value, { stream: true })

          // Handle streaming text chunks
          const lines = chunk.split('\n')
          for (const line of lines) {
            if (line.startsWith('0:')) {
              // Extract text content from stream format
              const content = line.slice(2).replace(/"/g, '')
              if (content && content !== 'null') {
                fullResponse += content
                onStreamUpdate(content)
              }
            }
          }
        }
      }

      return fullResponse || this.generateFallbackResponse(message, context)
    } catch (error) {
      console.error('Streaming error:', error)
      // Fallback to regular response
      return await this.getChatResponse(message, context)
    }
  }

  // Mock streaming response for testing mobile UI without API costs
  static async getMockStreamingResponse(
    message: string,
    context: {
      farmData?: any
      language?: 'en' | 'hi' | 'mr'
      recentAnalysis?: ImageAnalysisResult[]
      conversationHistory?: Array<{ role: string; content: string; queryType?: string }>
      recentTopics?: string[]
    },
    onStreamUpdate: (chunk: string) => void,
  ): Promise<string> {
    // Generate a contextual response based on the message
    let mockResponse = this.generateFallbackResponse(message, context)

    // Make it more detailed for better streaming testing
    if (message.toLowerCase().includes('stream')) {
      mockResponse =
        'This is a mock streaming response to test the mobile UI. ' +
        mockResponse +
        ' The streaming animation should work smoothly on mobile devices with proper text wrapping and scroll behavior.'
    }

    const words = mockResponse.split(' ')
    let fullResponse = ''

    // Simulate realistic streaming with word-by-word delivery
    for (let i = 0; i < words.length; i++) {
      const word = words[i]
      const chunk = i === 0 ? word : ' ' + word

      fullResponse += chunk
      onStreamUpdate(chunk)

      // Variable delay to simulate realistic streaming
      const delay = Math.random() * 150 + 50 // 50-200ms delay
      await new Promise((resolve) => setTimeout(resolve, delay))
    }

    return fullResponse
  }

  private static buildSystemPrompt(context: any): string {
    const language = context.language || 'en'
    const langInstruction =
      language === 'hi'
        ? 'Respond in Hindi'
        : language === 'mr'
          ? 'Respond in Marathi'
          : 'Respond in English'

    return `You are an expert agricultural assistant specializing in grape farming. ${langInstruction}.
    
    Your knowledge includes:
    - Grape disease identification and treatment
    - Irrigation and water management
    - Fertilization and nutrition
    - Pruning and canopy management
    - Harvest timing and quality optimization
    - Weather impact on grape production
    - Organic and sustainable farming practices
    
    Always provide practical, actionable advice suitable for small to medium-scale grape farmers.
    Be concise but comprehensive, and prioritize safety and sustainability.
    
    ${context.recentAnalysis ? `Recent analysis data: ${JSON.stringify(context.recentAnalysis)}` : ''}
    ${context.farmData ? `Farm context: ${JSON.stringify(context.farmData)}` : ''}`
  }

  private static generateFallbackResponse(message: string, context: any): string {
    const lowerMessage = message.toLowerCase()
    const language = context.language || 'en'
    const recentTopics = context.recentTopics || []
    const conversationHistory = context.conversationHistory || []

    // Check for follow-up questions based on recent conversation context
    if (conversationHistory.length > 0) {
      const lastQuery = conversationHistory[conversationHistory.length - 2] // User's last question
      if (lastQuery && lastQuery.queryType === 'disease') {
        // Handle follow-up questions about disease treatment
        if (
          lowerMessage.includes('often') ||
          lowerMessage.includes('frequency') ||
          lowerMessage.includes('how many') ||
          lowerMessage.includes('schedule')
        ) {
          return this.getDiseaseFollowUpResponse('frequency', context)
        }
        if (
          lowerMessage.includes('prevent') ||
          lowerMessage.includes('avoid') ||
          lowerMessage.includes('stop')
        ) {
          return this.getDiseaseFollowUpResponse('prevention', context)
        }
        if (lowerMessage.includes('organic') || lowerMessage.includes('natural')) {
          return this.getDiseaseFollowUpResponse('organic', context)
        }
      }

      // Handle other follow-up contexts
      if (
        recentTopics.includes('irrigation') &&
        (lowerMessage.includes('when') ||
          lowerMessage.includes('time') ||
          lowerMessage.includes('schedule'))
      ) {
        return this.getIrrigationFollowUpResponse(lowerMessage, context)
      }

      if (
        recentTopics.includes('fertilizer') &&
        (lowerMessage.includes('amount') ||
          lowerMessage.includes('how much') ||
          lowerMessage.includes('quantity'))
      ) {
        return this.getFertilizerFollowUpResponse(lowerMessage, context)
      }
    }

    // Enhanced pattern matching with multiple keywords and context
    const patterns = [
      {
        keywords: [
          'disease',
          'sick',
          'spots',
          'fungus',
          'mold',
          'rot',
          'infection',
          'pathogen',
          'बीमारी',
          'रोग',
          'आजार',
        ],
        responses: {
          en: this.getDiseaseResponse(lowerMessage, context),
          hi: 'बीमारी की समस्या के लिए, मैं प्रभावित पत्तियों या अंगूरों की स्पष्ट तस्वीर लेने की सलाह देता हूं। सामान्य अंगूर रोगों में पाउडरी मिल्ड्यू, डाउनी मिल्ड्यू और बोट्राइटिस शामिल हैं। अच्छी हवा का संचार सुनिश्चित करें और निवारक कवकनाशी का उपयोग करें।',
          mr: 'आजाराच्या समस्येसाठी, मी प्रभावित पाने किंवा द्राक्षांचे स्पष्ट फोटो घेण्याची शिफारस करतो. सामान्य द्राक्ष रोगांमध्ये पावडरी मिल्ड्यू, डाऊनी मिल्ड्यू आणि बॉट्रायटिस समाविष्ट आहेत.',
        },
      },
      {
        keywords: [
          'water',
          'irrigation',
          'dry',
          'drought',
          'moisture',
          'सिंचाई',
          'पानी',
          'सूखा',
          'पाणी',
        ],
        responses: {
          en: this.getIrrigationResponse(lowerMessage, context),
          hi: 'सिंचाई प्रबंधन के लिए, मिट्टी की नमी नियमित रूप से जांचें। अंगूर को निरंतर लेकिन अधिक पानी की आवश्यकता होती है। सुबह जल्दी पानी दें ताकि वाष्पीकरण कम हो और रोग का दबाव कम रहे।',
          mr: 'सिंचनाच्या व्यवस्थापनासाठी, मातीतील ओलावा नियमितपणे तपासा. द्राक्षांना सातत्यपूर्ण पण जास्त पाणी नको असते. लवकर सकाळी पाणी द्या.',
        },
      },
      {
        keywords: [
          'fertilizer',
          'nutrition',
          'feed',
          'nutrient',
          'npk',
          'उर्वरक',
          'खाद',
          'पोषण',
          'खत',
        ],
        responses: {
          en: this.getFertilizerResponse(lowerMessage, context),
          hi: 'मिट्टी परीक्षण के परिणामों के आधार पर उर्वरक की आवश्यकता निर्धारित करने के लिए हमारे न्यूट्रिएंट कैलकुलेटर का उपयोग करें। वसंत में संतुलित NPK लगाएं, कटाई से पहले नाइट्रोजन कम करें।',
          mr: 'मातीच्या चाचणीच्या निकालांवर आधारित खताची गरज ठरवण्यासाठी आमचे न्यूट्रिएंट कॅल्क्युलेटर वापरा. वसंतात संतुलित NPK लावा.',
        },
      },
      {
        keywords: ['harvest', 'pick', 'ripe', 'maturity', 'brix', 'कटाई', 'तुड़ाई', 'पक', 'कापणी'],
        responses: {
          en: this.getHarvestResponse(lowerMessage, context),
          hi: 'कटाई का समय निर्धारित करने के लिए चीनी के स्तर (ब्रिक्स) और अम्लता की निगरानी करें। सर्वोत्तम गुणवत्ता के लिए ठंडे तापमान में सुबह जल्दी कटाई करें।',
          mr: 'कापणीची वेळ ठरवण्यासाठी साखरेची पातळी (ब्रिक्स) आणि आम्लता यांचे निरीक्षण करा. सर्वोत्तम गुणवत्तेसाठी थंड तापमानात लवकर सकाळी कापणी करा.',
        },
      },
      {
        keywords: ['pruning', 'trim', 'cut', 'canopy', 'shoots', 'छंटाई', 'काटना', 'छाँटाई'],
        responses: {
          en: this.getPruningResponse(lowerMessage, context),
          hi: 'छंटाई सर्दियों के दौरान सुप्त अवस्था में करें। पुरानी और रोगग्रस्त लकड़ी हटाएं। अच्छे वायु संचार के लिए कैनोपी का प्रबंधन करें।',
          mr: 'छाटणी हिवाळ्यात निष्क्रिय अवस्थेत करा. जुने आणि आजारी लाकूड काढून टाका.',
        },
      },
      {
        keywords: ['pest', 'insect', 'bug', 'aphid', 'thrips', 'कीट', 'कीड़े', 'किड'],
        responses: {
          en: this.getPestResponse(lowerMessage, context),
          hi: 'कीट नियंत्रण के लिए नियमित निगरानी करें। जैविक नियंत्रण विधियों को प्राथमिकता दें। आवश्यक होने पर ही कीटनाशक का उपयोग करें।',
          mr: 'किडीच्या नियंत्रणासाठी नियमित निरीक्षण करा. जैविक नियंत्रण पद्धतींना प्राधान्य द्या.',
        },
      },
      {
        keywords: ['weather', 'rain', 'temperature', 'humidity', 'wind', 'मौसम', 'बारिश', 'तापमान'],
        responses: {
          en: this.getWeatherResponse(lowerMessage, context),
          hi: 'मौसम की निगरानी करें और तदनुसार खेती की गतिविधियों को समायोजित करें। बारिश से पहले छिड़काव से बचें।',
          mr: 'हवामानाचे निरीक्षण करा आणि त्यानुसार शेतीच्या क्रियाकलापांना जुळवून घ्या.',
        },
      },
      {
        keywords: ['soil', 'ph', 'organic', 'compost', 'मिट्टी', 'भूमि', 'जमीन', 'माती'],
        responses: {
          en: this.getSoilResponse(lowerMessage, context),
          hi: 'मिट्टी के स्वास्थ्य के लिए नियमित मिट्टी परीक्षण कराएं। pH स्तर को 6.0-7.5 के बीच बनाए रखें। जैविक पदार्थों को शामिल करें।',
          mr: 'मातीच्या आरोग्यासाठी नियमित माती चाचणी करा. pH पातळी 6.0-7.5 दरम्यान ठेवा.',
        },
      },
      {
        keywords: ['grape', 'vine', 'vineyard', 'cluster', 'berry', 'अंगूर', 'बेल', 'द्राक्ष'],
        responses: {
          en: this.getGrapeResponse(lowerMessage, context),
          hi: 'अंगूर की खेती के लिए उचित जलवायु, मिट्टी और देखभाल आवश्यक है। नियमित निगरानी और समय पर हस्तक्षेप महत्वपूर्ण है।',
          mr: 'द्राक्ष शेतीसाठी योग्य हवामान, माती आणि काळजी आवश्यक आहे. नियमित निरीक्षण आणि वेळेवर हस्तक्षेप महत्त्वपूर्ण आहे.',
        },
      },
      {
        keywords: [
          'help',
          'support',
          'guide',
          'how',
          'what',
          'when',
          'why',
          'मदद',
          'सहायता',
          'कैसे',
          'क्या',
          'कब',
        ],
        responses: {
          en: this.getHelpResponse(lowerMessage, context),
          hi: 'मैं आपका AI कृषि सहायक हूं। मैं अंगूर की खेती के बारे में सभी प्रश्नों में आपकी मदद कर सकता हूं - रोग, सिंचाई, उर्वरक, छंटाई, कटाई और बहुत कुछ।',
          mr: 'मी तुमचा AI कृषी सहाय्यक आहे. मी द्राक्ष शेतीबाबतच्या सर्व प्रश्नांमध्ये तुम्हाला मदत करू शकतो.',
        },
      },
    ]

    // Find matching pattern
    for (const pattern of patterns) {
      if (pattern.keywords.some((keyword) => lowerMessage.includes(keyword))) {
        return pattern.responses[language as keyof typeof pattern.responses] || pattern.responses.en
      }
    }

    // Default response based on language
    const defaultResponses = {
      en: "I'm here to help with your grape farming questions! You can ask about diseases, irrigation, fertilization, pruning, harvest timing, pest control, soil management, or weather-related concerns. Feel free to take photos of your vines for disease detection too!",
      hi: 'मैं आपके अंगूर की खेती के प्रश्नों में मदद के लिए यहाँ हूँ! आप रोग, सिंचाई, उर्वरक, छंटाई, कटाई का समय, कीट नियंत्रण, मिट्टी प्रबंधन, या मौसम संबंधी चिंताओं के बारे में पूछ सकते हैं।',
      mr: 'मी तुमच्या द्राक्ष शेतीच्या प्रश्नांसाठी मदत करण्यासाठी येथे आहे! तुम्ही रोग, सिंचन, खत, छाटणी, कापणीची वेळ, किडी नियंत्रण, माती व्यवस्थापन किंवा हवामानाशी संबंधित चिंता बद्दल विचारू शकता.',
    }

    return defaultResponses[language as keyof typeof defaultResponses] || defaultResponses.en
  }

  // Specialized response methods
  private static getDiseaseResponse(message: string, context: any): string {
    const recentAnalysis = context.recentAnalysis
    let response =
      'For disease identification, I recommend using our camera feature to take a clear photo of affected leaves or grape clusters. '

    if (recentAnalysis && recentAnalysis.length > 0) {
      const latestAnalysis = recentAnalysis[0]
      if (latestAnalysis.diseaseDetection) {
        response += `Based on your recent analysis, I detected ${latestAnalysis.diseaseDetection.disease} with ${(latestAnalysis.diseaseDetection.confidence * 100).toFixed(0)}% confidence. `
        response += `Treatment: ${latestAnalysis.diseaseDetection.treatment.slice(0, 2).join(', ')}.`
        return response
      }
    }

    if (message.includes('powdery')) {
      response +=
        'Powdery mildew appears as white powdery growth. Apply sulfur-based fungicide and improve air circulation.'
    } else if (message.includes('downy')) {
      response +=
        'Downy mildew causes yellow spots and white downy growth. Use copper-based fungicide and ensure good drainage.'
    } else if (message.includes('black rot')) {
      response +=
        'Black rot causes black spots and mummified berries. Remove infected material and apply broad-spectrum fungicide.'
    } else {
      response +=
        'Common grape diseases include powdery mildew, downy mildew, botrytis, and black rot. Prevention through good canopy management is key.'
    }

    return response
  }

  private static getIrrigationResponse(message: string, context: any): string {
    const season = this.getCurrentSeason()
    let response = 'For optimal grape irrigation: '

    if (message.includes('how much') || message.includes('amount')) {
      response +=
        'Grapes typically need 24-36 inches of water annually. Use our ETc calculator for precise amounts based on your location and weather.'
    } else if (message.includes('when') || message.includes('timing')) {
      response += 'Water early morning (6-8 AM) to reduce evaporation and disease risk. '
      if (season === 'summer') {
        response +=
          'During summer, check soil moisture daily and irrigate when top 6 inches are dry.'
      } else if (season === 'spring') {
        response += 'In spring, maintain consistent moisture for new growth but avoid overwatering.'
      }
    } else {
      response +=
        'Monitor soil moisture at 6-12 inch depth. Maintain consistent moisture but avoid waterlogging. Reduce irrigation 2-3 weeks before harvest to concentrate sugars.'
    }

    return response
  }

  private static getFertilizerResponse(message: string, context: any): string {
    const season = this.getCurrentSeason()
    let response = 'For grape nutrition: '

    if (message.includes('npk') || message.includes('ratio')) {
      response += 'Use 10-10-10 NPK in spring, switch to low-nitrogen (5-10-10) before fruit set. '
    } else if (message.includes('organic')) {
      response +=
        'Compost, aged manure, and cover crops provide slow-release nutrients. Apply 2-4 inches of compost annually.'
    } else if (message.includes('timing') || message.includes('when')) {
      if (season === 'spring') {
        response +=
          'Apply balanced fertilizer in early spring before bud break. Follow up with lighter applications through fruit set.'
      } else {
        response +=
          'Main fertilization in early spring, lighter applications during growing season, avoid late-season nitrogen to promote wood maturation.'
      }
    } else {
      response +=
        'Conduct soil tests to determine specific needs. Generally apply balanced NPK in spring, reduce nitrogen before harvest, and maintain adequate potassium for fruit quality.'
    }

    return response
  }

  private static getHarvestResponse(message: string, context: any): string {
    let response = 'For harvest timing: '

    if (message.includes('brix') || message.includes('sugar')) {
      response +=
        'Target Brix levels: 20-24° for table grapes, 22-26° for wine grapes. Test multiple clusters across the vineyard.'
    } else if (message.includes('color') || message.includes('appearance')) {
      response +=
        'Look for full color development, berry softening, and easy separation from stems. Seeds should be brown, not green.'
    } else if (message.includes('timing') || message.includes('when')) {
      response +=
        'Harvest in cool morning hours (6-10 AM) for best quality. Check sugar, acid levels, and taste regularly in final weeks.'
    } else {
      response +=
        'Monitor Brix levels, taste berries, check seed color (brown indicates maturity), and observe berry texture. Use our yield prediction feature for timing estimates.'
    }

    return response
  }

  private static getPruningResponse(message: string, context: any): string {
    const season = this.getCurrentSeason()
    let response = 'For grape pruning: '

    if (season === 'winter') {
      response +=
        'Winter is ideal for dormant pruning. Remove old, diseased wood and maintain 2-4 buds per spur for balanced production.'
    } else if (season === 'summer') {
      response +=
        'Summer pruning focuses on canopy management. Remove excess shoots, thin clusters if overcrowded, and maintain good air circulation.'
    } else {
      response +=
        'Prune during dormancy (late winter) for structure, and during growing season for canopy management. Remove diseased wood immediately regardless of season.'
    }

    return response
  }

  private static getPestResponse(message: string, context: any): string {
    let response = 'For pest management: '

    if (message.includes('aphid')) {
      response +=
        'Aphids can be controlled with beneficial insects (ladybugs), insecticidal soap, or targeted insecticides if severe.'
    } else if (message.includes('thrips')) {
      response +=
        'Thrips damage young shoots and leaves. Use blue sticky traps and beneficial predators. Avoid broad-spectrum insecticides.'
    } else if (message.includes('mite')) {
      response +=
        'Spider mites thrive in hot, dry conditions. Increase humidity, use predatory mites, or apply miticides if necessary.'
    } else {
      response +=
        'Implement IPM: regular monitoring, beneficial insects, targeted treatments only when needed. Common pests include aphids, thrips, leafhoppers, and spider mites.'
    }

    return response
  }

  private static getWeatherResponse(message: string, context: any): string {
    let response = 'Weather considerations for grapes: '

    if (message.includes('rain') || message.includes('wet')) {
      response +=
        'Excessive rain increases disease risk. Ensure good drainage, avoid spraying before rain, and monitor for fungal diseases closely.'
    } else if (message.includes('hot') || message.includes('heat')) {
      response +=
        'High temperatures stress vines. Increase irrigation frequency, provide shade cloth if extreme, and harvest earlier if needed.'
    } else if (message.includes('wind')) {
      response +=
        'Strong winds can damage vines and increase water stress. Install windbreaks and check trellis systems regularly.'
    } else {
      response +=
        'Monitor weather forecasts for spray timing, irrigation scheduling, and harvest planning. Extreme weather events require protective measures.'
    }

    return response
  }

  private static getSoilResponse(message: string, context: any): string {
    let response = 'For soil management: '

    if (message.includes('ph')) {
      response +=
        'Maintain soil pH between 6.0-7.5 for optimal nutrient availability. Test annually and adjust with lime or sulfur as needed.'
    } else if (message.includes('drainage')) {
      response +=
        'Grapes need well-draining soil. Install drainage systems in heavy clay soils or plant on slopes/raised beds.'
    } else if (message.includes('organic')) {
      response +=
        'Add organic matter (compost, aged manure) to improve soil structure, water retention, and microbial activity.'
    } else {
      response +=
        'Conduct annual soil tests for pH, nutrients, and organic matter. Grapes prefer well-draining, slightly acidic to neutral soils with good organic content.'
    }

    return response
  }

  private static getGrapeResponse(message: string, context: any): string {
    let response = 'Grape cultivation tips: '

    if (message.includes('variety') || message.includes('cultivar')) {
      response +=
        'Choose varieties suited to your climate. Consider disease resistance, market demand, and intended use (table, wine, raisins).'
    } else if (message.includes('planting')) {
      response +=
        'Plant in well-prepared soil with good drainage. Space vines 6-10 feet apart in rows 8-12 feet apart depending on vigor and training system.'
    } else if (message.includes('training') || message.includes('trellis')) {
      response +=
        'Common training systems include VSP (Vertical Shoot Positioning) and GDC (Geneva Double Curtain). Choose based on variety and equipment.'
    } else {
      response +=
        'Successful grape growing requires proper site selection, variety choice, trellising system, regular pruning, disease management, and harvest timing.'
    }

    return response
  }

  private static getHelpResponse(message: string, context: any): string {
    return 'I can help you with all aspects of grape farming including: Disease identification and treatment, Irrigation scheduling and water management, Fertilization and soil health, Pruning and canopy management, Harvest timing and quality, Pest control strategies, Weather-related decisions. You can also use our disease detection feature by taking photos of your vines!'
  }

  private static getCurrentSeason(): string {
    const month = new Date().getMonth()
    if (month >= 2 && month <= 4) return 'spring'
    if (month >= 5 && month <= 7) return 'summer'
    if (month >= 8 && month <= 10) return 'fall'
    return 'winter'
  }

  // Follow-up response methods for contextual conversations
  private static getDiseaseFollowUpResponse(type: string, context: any): string {
    const language = context.language || 'en'

    switch (type) {
      case 'frequency':
        const responses = {
          en: 'For powdery mildew treatment: Apply sulfur-based fungicide every 7-10 days during active disease period. For prevention, spray every 14-21 days starting in early spring. Always follow label instructions and avoid spraying during bloom to protect pollinators.',
          hi: 'पाउडरी मिल्ड्यू के उपचार के लिए: सक्रिय रोग काल के दौरान हर 7-10 दिन में सल्फर आधारित कवकनाशी लगाएं। रोकथाम के लिए, वसंत की शुरुआत से हर 14-21 दिन में छिड़काव करें।',
          mr: 'पावडरी मिल्ड्यूच्या उपचारासाठी: सक्रिय रोगाच्या काळात दर 7-10 दिवसांनी सल्फर आधारित बुरशीनाशक वापरा. प्रतिबंधासाठी, वसंत ऋतूच्या सुरुवातीपासून दर 14-21 दिवसांनी फवारणी करा.',
        }
        return responses[language as keyof typeof responses] || responses.en

      case 'prevention':
        const preventionResponses = {
          en: 'To prevent powdery mildew: Ensure good air circulation through proper pruning, avoid overhead watering, plant resistant varieties, and apply preventive fungicides before symptoms appear. Remove infected leaves promptly.',
          hi: 'पाउडरी मिल्ड्यू से बचाव के लिए: उचित छंटाई के द्वारा अच्छी हवा का संचार सुनिश्चित करें, ऊपर से पानी देने से बचें, प्रतिरोधी किस्में लगाएं।',
          mr: 'पावडरी मिल्ड्यूपासून बचावासाठी: योग्य छाटणीद्वारे चांगली हवेची वळण सुनिश्चित करा, वरून पाणी देणे टाळा, प्रतिरोधक जाती लावा.',
        }
        return (
          preventionResponses[language as keyof typeof preventionResponses] ||
          preventionResponses.en
        )

      case 'organic':
        const organicResponses = {
          en: 'Organic treatments for powdery mildew: Baking soda solution (1 tsp per quart water), neem oil, horticultural oils, or compost tea. Milk solution (1:10 ratio) can also be effective. Apply early morning or evening to avoid leaf burn.',
          hi: 'पाउडरी मिल्ड्यू के लिए जैविक उपचार: बेकिंग सोडा घोल, नीम तेल, बागवानी तेल, या खाद चाय का उपयोग करें। दूध का घोल (1:10 अनुपात) भी प्रभावी हो सकता है।',
          mr: 'पावडरी मिल्ड्यूसाठी सेंद्रिय उपचार: बेकिंग सोडा द्रावण, कडुनिंब तेल, बागायती तेल किंवा खत चहा वापरा. दुधाचे द्रावण (1:10 प्रमाण) देखील प्रभावी असू शकते.',
        }
        return organicResponses[language as keyof typeof organicResponses] || organicResponses.en

      default:
        return this.getDiseaseResponse('', context)
    }
  }

  private static getIrrigationFollowUpResponse(message: string, context: any): string {
    const season = this.getCurrentSeason()
    const language = context.language || 'en'

    const scheduleResponse = {
      en: `For ${season} irrigation schedule: Water deeply 2-3 times per week rather than daily shallow watering. Best times are 6-8 AM or evening after 6 PM. Monitor soil moisture at 6-inch depth - irrigate when dry.`,
      hi: `${season} सिंचाई कार्यक्रम के लिए: दैनिक उथली सिंचाई के बजाय सप्ताह में 2-3 बार गहरी सिंचाई करें। सबसे अच्छा समय सुबह 6-8 बजे या शाम 6 बजे के बाद है।`,
      mr: `${season} सिंचन वेळापत्रकासाठी: दैनंदिन उथळ पाणी देण्याऐवजी आठवड्यातून 2-3 वेळा खोल पाणी द्या. सर्वोत्तम वेळ सकाळी 6-8 किंवा संध्याकाळी 6 नंतर आहे.`,
    }

    return scheduleResponse[language as keyof typeof scheduleResponse] || scheduleResponse.en
  }

  private static getFertilizerFollowUpResponse(message: string, context: any): string {
    const language = context.language || 'en'

    const amountResponse = {
      en: 'Fertilizer application amounts: For mature vines, apply 1-2 lbs of 10-10-10 fertilizer per vine in early spring. Young vines need less - about 0.5-1 lb. Split applications: 60% in early spring, 40% after fruit set. Always water after application.',
      hi: 'उर्वरक लगाने की मात्रा: परिपक्व बेलों के लिए वसंत की शुरुआत में प्रति बेल 1-2 पाउंड 10-10-10 उर्वरक लगाएं। युवा बेलों को कम चाहिए - लगभग 0.5-1 पाउंड।',
      mr: 'खत लावण्याचे प्रमाण: प्रौढ वेलींसाठी वसंत ऋतूच्या सुरुवातीला प्रति वेल 1-2 पौंड 10-10-10 खत लावा. तरुण वेलींना कमी लागते - सुमारे 0.5-1 पौंड.',
    }

    return amountResponse[language as keyof typeof amountResponse] || amountResponse.en
  }

  // Preprocess image for analysis
  static preprocessImage(file: File): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => resolve(img)
      img.onerror = reject
      img.src = URL.createObjectURL(file)
    })
  }

  // Analyze soil data and provide recommendations
  static analyzeSoilData(soilData: {
    ph: number
    nitrogen: number
    phosphorus: number
    potassium: number
    organicMatter: number
  }): AIRecommendation[] {
    const recommendations: AIRecommendation[] = []

    // pH recommendations
    if (soilData.ph < 6.0 || soilData.ph > 7.5) {
      recommendations.push({
        category: 'fertilization',
        priority: 'high',
        title: 'Soil pH Adjustment Required',
        description: `Current pH (${soilData.ph}) is outside optimal range (6.0-7.5)`,
        actions:
          soilData.ph < 6.0
            ? [
                'Apply agricultural lime',
                'Test pH monthly after application',
                'Consider organic matter addition',
              ]
            : [
                'Apply sulfur or acidifying fertilizer',
                'Avoid alkaline fertilizers',
                'Monitor pH regularly',
              ],
        timing: 'Before next growing season',
        expectedImpact: 'Improve nutrient availability and root health',
      })
    }

    // Nutrient recommendations
    if (soilData.nitrogen < 100) {
      recommendations.push({
        category: 'fertilization',
        priority: 'medium',
        title: 'Nitrogen Supplementation Needed',
        description: 'Nitrogen levels below optimal for grape production',
        actions: [
          'Apply nitrogen-rich fertilizer',
          'Consider organic compost application',
          'Monitor leaf color for nitrogen deficiency signs',
        ],
        timing: 'Early spring before bud break',
        expectedImpact: 'Promote healthy vine growth and leaf development',
      })
    }

    return recommendations
  }
}

// Initialize the AI service
if (typeof window !== 'undefined') {
  AIService.loadDiseaseModel()
}
