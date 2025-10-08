'use client'

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import {
  MessageCircle,
  Mic,
  MicOff,
  Bot,
  User,
  Loader2,
  X,
  Paperclip,
  History,
  Plus,
  Copy,
  Check,
  ArrowRight,
  Trash2
} from 'lucide-react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ImageAnalysisResult } from '@/lib/ai-service'
import { cn } from '@/lib/utils'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { getQuotaStatus, incrementQuestionCount } from '@/lib/quota-service'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Textarea } from '../ui/textarea'
import {
  supabaseConversationStorage,
  type Message,
  type Conversation
} from '@/lib/supabase-conversation-storage'
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth'
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import type { UIMessage, FileUIPart, TextUIPart } from 'ai'

interface AIAssistantProps {
  farmData?: any
  recentAnalysis?: ImageAnalysisResult[]
  isOpen?: boolean
  onToggle?: () => void
  className?: string
  isMobile?: boolean
}

export function AIAssistant({
  farmData,
  recentAnalysis,
  isOpen = false,
  onToggle,
  className,
  isMobile: propIsMobile
}: AIAssistantProps) {
  const { t, i18n } = useTranslation()
  const { user, loading: authLoading } = useSupabaseAuth()
  const transport = useMemo(() => new DefaultChatTransport({ api: '/api/ai/chat' }), [])
  const {
    messages: chatMessages,
    setMessages: setChatMessages,
    sendMessage: sendChatMessage,
    status,
    error: chatError,
    clearError: clearChatError
  } = useChat({
    id: 'vinesight-ai-assistant',
    transport
  })
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isListening, setIsListening] = useState(false)
  const [isMobile, setIsMobile] = useState(propIsMobile || false)
  const [quotaStatus, setQuotaStatus] = useState(() => getQuotaStatus())
  const [showHistory, setShowHistory] = useState(false)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null)
  const currentConversationIdRef = useRef<string | null>(null)
  const savingInProgressRef = useRef<boolean>(false)
  const lastSavedSnapshotRef = useRef<string | null>(null)
  const [pendingAttachments, setPendingAttachments] = useState<
    Array<{ type: 'image'; name: string; url: string; size?: number }>
  >([])
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const recognitionRef = useRef<any>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const handleSendMessageRef = useRef<((message?: string) => Promise<void>) | null>(null)
  const isAssistantProcessing = status === 'submitted' || status === 'streaming'

  const attachmentFromFilePart = useCallback((part: FileUIPart) => {
    const name = part.filename || 'Attachment'
    const url = part.url
    return {
      type: 'image' as const,
      name,
      url
    }
  }, [])

  const uiMessageToAppMessage = useCallback(
    (uiMessage: UIMessage): Message | null => {
      if (uiMessage.role !== 'user' && uiMessage.role !== 'assistant') {
        return null
      }

      const textParts = uiMessage.parts.filter(
        (part): part is TextUIPart => part.type === 'text'
      )
      const content = textParts.map((part) => part.text).join('\n').trim()

      const fileParts = uiMessage.parts.filter(
        (part): part is FileUIPart => part.type === 'file'
      )
      const attachments = fileParts.map(attachmentFromFilePart)

      const metadata = (uiMessage.metadata || {}) as Record<string, any>
      const timestampValue = metadata.timestamp || metadata.createdAt
      const timestamp = timestampValue ? new Date(timestampValue) : new Date()
      const context = metadata.queryType
        ? {
            queryType: metadata.queryType,
            confidence: metadata.confidence
          }
        : undefined

      const effectiveContent =
        content || (attachments.length > 0 && uiMessage.role === 'user' ? 'Shared an image' : content)

      if (!effectiveContent && attachments.length === 0 && uiMessage.role === 'assistant') {
        return null
      }

      return {
        id: uiMessage.id,
        content: effectiveContent,
        role: uiMessage.role,
        timestamp,
        attachments: attachments.length > 0 ? attachments : undefined,
        language: metadata.language || i18n.language,
        context
      }
    },
    [attachmentFromFilePart, i18n.language]
  )

  const messageToUIMessage = useCallback(
    (message: Message): UIMessage => {
      const parts: Array<TextUIPart | FileUIPart> = []

      if (message.content) {
        parts.push({ type: 'text', text: message.content })
      }

      if (message.attachments) {
        message.attachments.forEach((attachment) => {
          const mediaType = attachment.url.startsWith('data:')
            ? attachment.url.slice(5, attachment.url.indexOf(';'))
            : 'image/png'

          parts.push({
            type: 'file',
            url: attachment.url,
            filename: attachment.name,
            mediaType
          })
        })
      }

      return {
        id: message.id,
        role: message.role,
        parts,
        metadata: {
          language: message.language || i18n.language,
          queryType: message.context?.queryType,
          confidence: message.context?.confidence,
          timestamp: (message.timestamp || new Date()).toISOString()
        }
      }
    },
    [i18n.language]
  )

  useEffect(() => {
    const loadConversations = async () => {
      if (authLoading) return

      const stored = await supabaseConversationStorage.loadConversations(user?.id, farmData?.id)
      setConversations(stored)

      if (user && stored.length === 0) {
        try {
          await supabaseConversationStorage.migrateFromLocalStorage(user.id)
          const migratedConversations = await supabaseConversationStorage.loadConversations(
            user?.id,
            farmData?.id
          )
          setConversations(migratedConversations)
        } catch (error) {
          if (process.env.NODE_ENV === 'development') {
            console.error('Migration error:', error)
          }
        }
      }
    }
    loadConversations()
  }, [user, authLoading, farmData?.id])

  useEffect(() => {
    if (!authLoading) {
      setQuotaStatus(getQuotaStatus(user?.id))
    }
  }, [user?.id, authLoading])

  useEffect(() => {
    if (propIsMobile === undefined) {
      const checkMobile = () => {
        setIsMobile(window.innerWidth <= 768)
      }
      checkMobile()
      window.addEventListener('resize', checkMobile)
      return () => window.removeEventListener('resize', checkMobile)
    } else {
      setIsMobile(propIsMobile)
    }
  }, [propIsMobile])

  useEffect(() => {
    if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = window.webkitSpeechRecognition
      const recognition = new SpeechRecognition()

      recognition.continuous = false
      recognition.interimResults = false
      recognition.lang = 'en-IN'

      recognition.onstart = () => setIsListening(true)
      recognition.onend = () => setIsListening(false)
      recognition.onerror = () => setIsListening(false)

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript
        setInputValue(transcript)
        if (handleSendMessageRef.current) {
          handleSendMessageRef.current(transcript)
        }
      }

      recognitionRef.current = recognition

      return () => {
        if (recognitionRef.current) {
          recognitionRef.current.abort()
          recognitionRef.current = null
        }
      }
    }
  }, [])

  useEffect(() => {
    if (recognitionRef.current) {
      recognitionRef.current.lang =
        i18n.language === 'hi' ? 'hi-IN' : i18n.language === 'mr' ? 'mr-IN' : 'en-IN'
    }
  }, [i18n.language])

  useEffect(() => {
    if (!chatError) {
      return
    }

    const message =
      i18n.language === 'hi'
        ? 'क्षमा करें, कुछ गलत हुआ। कृपया फिर से कोशिश करें।'
        : i18n.language === 'mr'
          ? 'माफ करा, काहीतरी चूक झाली. कृपया पुन्हा प्रयत्न करा.'
          : 'Sorry, something went wrong. Please try again.'

    toast.error(message)
    clearChatError()
  }, [chatError, clearChatError, i18n.language])

  const getWelcomeMessage = useCallback(() => {
    switch (i18n.language) {
      case 'hi':
        return 'नमस्ते! मैं आपका AI कृषि सहायक हूं। अंगूर की खेती के बारे में कोई भी प्रश्न पूछें - रोग, सिंचाई, उर्वरक, या कटाई के बारे में।'
      case 'mr':
        return 'नमस्कार! मी तुमचा AI कृषी सहाय्यक आहे. द्राक्ष शेतीबाबत कोणताही प्रश्न विचारा - रोग, सिंचन, खत, किंवा कापणी बद्दल.'
      default:
        return "Hello! I'm your AI farming assistant. Ask me anything about grape farming - diseases, irrigation, fertilization, or harvesting."
    }
  }, [i18n.language])

  const areMessagesEqual = useCallback((a: Message[], b: Message[]) => {
    if (a.length !== b.length) return false
    for (let i = 0; i < a.length; i += 1) {
      const left = a[i]
      const right = b[i]
      if (
        left.id !== right.id ||
        left.role !== right.role ||
        left.content !== right.content ||
        (left.language || '') !== (right.language || '')
      ) {
        return false
      }

      const leftAttachments = left.attachments ?? []
      const rightAttachments = right.attachments ?? []
      if (leftAttachments.length !== rightAttachments.length) {
        return false
      }
      for (let j = 0; j < leftAttachments.length; j += 1) {
        const leftAttachment = leftAttachments[j]
        const rightAttachment = rightAttachments[j]
        if (
          leftAttachment.type !== rightAttachment.type ||
          leftAttachment.url !== rightAttachment.url ||
          leftAttachment.name !== rightAttachment.name
        ) {
          return false
        }
      }
    }
    return true
  }, [])

  useEffect(() => {
    if (chatMessages.length === 0) {
      setMessages((prev) => {
        const welcome: Message = {
          id: 'welcome',
          content: getWelcomeMessage(),
          role: 'assistant',
          timestamp: new Date(),
          language: i18n.language
        }
        if (prev.length === 1 && prev[0].id === 'welcome' && prev[0].language === i18n.language) {
          return prev
        }
        return [welcome]
      })
      return
    }

    const mapped = chatMessages
      .map(uiMessageToAppMessage)
      .filter((msg): msg is Message => msg !== null)

    if (mapped.length === 0) {
      setMessages((prev) => {
        const welcome: Message = {
          id: 'welcome',
          content: getWelcomeMessage(),
          role: 'assistant',
          timestamp: new Date(),
          language: i18n.language
        }
        if (prev.length === 1 && prev[0].id === 'welcome' && prev[0].language === i18n.language) {
          return prev
        }
        return [welcome]
      })
      return
    }

    setMessages((prev) => {
      if (areMessagesEqual(prev, mapped)) {
        return prev
      }
      return mapped
    })
  }, [
    chatMessages,
    uiMessageToAppMessage,
    getWelcomeMessage,
    i18n.language,
    areMessagesEqual
  ])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const analyzeQuery = useCallback((text: string) => {
    const lowerText = text.toLowerCase()
    const queryTypes = [
      {
        type: 'disease',
        keywords: ['disease', 'sick', 'spots', 'fungus', 'mold', 'rot', 'बीमारी', 'रोग', 'आजार']
      },
      {
        type: 'irrigation',
        keywords: ['water', 'irrigation', 'dry', 'drought', 'सिंचाई', 'पानी', 'पाणी']
      },
      {
        type: 'fertilizer',
        keywords: ['fertilizer', 'nutrition', 'feed', 'nutrient', 'उर्वरक', 'खाद', 'खत']
      },
      { type: 'harvest', keywords: ['harvest', 'pick', 'ripe', 'maturity', 'कटाई', 'कापणी'] },
      { type: 'pruning', keywords: ['pruning', 'trim', 'cut', 'canopy', 'छंटाई', 'छाटणी'] },
      { type: 'pest', keywords: ['pest', 'insect', 'bug', 'कीट', 'कीड़े'] },
      { type: 'weather', keywords: ['weather', 'rain', 'temperature', 'मौसम', 'बारिश'] },
      { type: 'soil', keywords: ['soil', 'ph', 'organic', 'मिट्टी', 'माती'] }
    ]

    for (const queryType of queryTypes) {
      const matchCount = queryType.keywords.filter((keyword) => lowerText.includes(keyword)).length
      if (matchCount > 0) {
        return {
          queryType: queryType.type,
          confidence: Math.min(matchCount / queryType.keywords.length + 0.5, 1),
          relatedTopics: queryType.keywords.filter((keyword) => lowerText.includes(keyword))
        }
      }
    }

    return { queryType: 'general', confidence: 0.5, relatedTopics: [] }
  }, [])

  const buildConversationContext = useCallback(
    (currentMessages?: Message[]) => {
      const messagesToUse = (currentMessages || messages).filter((msg) => msg.id !== 'welcome')
      const recentMessages = messagesToUse.slice(-5) // Last 5 messages for context
      const conversationTopics = recentMessages
        .filter((msg) => msg.context?.queryType)
        .map((msg) => msg.context!.queryType)
        .filter((topic): topic is string => topic !== undefined) // Filter out undefined values

      return {
        farmData,
        language: i18n.language as 'en' | 'hi' | 'mr',
        recentAnalysis,
        conversationHistory: recentMessages.map((msg) => ({
          role: msg.role,
          content: msg.content,
          queryType: msg.context?.queryType
        })),
        recentTopics: [...new Set(conversationTopics)]
      }
    },
    [messages, farmData, recentAnalysis, i18n.language]
  )

  const getOrCreateConversationId = useCallback(() => {
    let conversationId = currentConversationIdRef.current
    if (!conversationId) {
      conversationId = Date.now().toString()
      currentConversationIdRef.current = conversationId
      setCurrentConversationId(conversationId)
    }
    return conversationId
  }, [])

  const saveMessageImmediately = useCallback(
    async (allMessages: Message[]) => {
      if (allMessages.length <= 1) return
      if (savingInProgressRef.current) return

      const conversationId = getOrCreateConversationId()

      const title = supabaseConversationStorage.generateTitle(allMessages)

      const conversation: Conversation = {
        id: conversationId,
        title,
        messages: allMessages,
        createdAt: currentConversationId
          ? conversations.find((c) => c.id === conversationId)?.createdAt || new Date()
          : new Date(),
        updatedAt: new Date(),
        farmId: farmData?.id,
        userId: user?.id,
        lastMessageAt: new Date(),
        messageCount: allMessages.length
      }

      try {
        savingInProgressRef.current = true
        const savedConversation = await supabaseConversationStorage.saveConversation(
          conversation,
          user?.id
        )

        if (savedConversation) {
          setConversations((prev) => {
            const existing = prev.find((c) => c.id === conversationId)
            if (existing) {
              return prev.map((c) => (c.id === conversationId ? savedConversation : c))
            }
            return [savedConversation, ...prev]
          })

          if (savedConversation.id !== conversationId) {
            currentConversationIdRef.current = savedConversation.id
            setCurrentConversationId(savedConversation.id)
          }
        }
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error('Error saving message immediately:', error)
        }
      } finally {
        savingInProgressRef.current = false
      }
    },
    [getOrCreateConversationId, conversations, user?.id, farmData?.id]
  )

  useEffect(() => {
    if (status !== 'ready') {
      return
    }

    const filteredMessages = messages.filter((msg) => msg.id !== 'welcome')
    if (filteredMessages.length <= 1) {
      return
    }

    const lastMessage = filteredMessages[filteredMessages.length - 1]
    if (lastMessage.role !== 'assistant' || !lastMessage.content) {
      return
    }

    const signature = `${filteredMessages.length}:${lastMessage.id}:${lastMessage.content.length}`
    if (lastSavedSnapshotRef.current === signature) {
      return
    }

    lastSavedSnapshotRef.current = signature

    void (async () => {
      try {
        await saveMessageImmediately(filteredMessages)
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error('Failed to save assistant message:', error)
        }
      }
    })()
  }, [messages, saveMessageImmediately, status])

  const handleSendMessage = useCallback(
    async (text?: string) => {
      const messageText = text || inputValue.trim()
      if ((!messageText && pendingAttachments.length === 0) || isAssistantProcessing) {
        return
      }

      const queryAnalysis = analyzeQuery(messageText)
      const now = new Date()

      const userMessageForContext: Message = {
        id: `user-${now.getTime()}`,
        content: messageText || 'Shared an image',
        role: 'user',
        timestamp: now,
        attachments: pendingAttachments.length > 0 ? [...pendingAttachments] : undefined,
        language: i18n.language,
        context: queryAnalysis
      }

      const contextMessages = [...messages.filter((msg) => msg.id !== 'welcome'), userMessageForContext]

      const fileParts: FileUIPart[] = pendingAttachments.map((attachment) => {
        const mediaMatch = attachment.url.match(/^data:(.*?);/)
        const mediaType = mediaMatch?.[1] || 'image/png'
        return {
          type: 'file',
          url: attachment.url,
          filename: attachment.name,
          mediaType
        }
      })

      setInputValue('')
      setPendingAttachments([])

      incrementQuestionCount(user?.id)

      try {
        await saveMessageImmediately(contextMessages)
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error('Failed to save user message:', error)
        }
        toast.error('Failed to save your message. Please try again.')
      }

      try {
        await sendChatMessage(
          {
            id: userMessageForContext.id,
            role: 'user',
            parts: [
              { type: 'text', text: messageText },
              ...fileParts
            ],
            metadata: {
              queryType: queryAnalysis.queryType,
              confidence: queryAnalysis.confidence,
              language: i18n.language,
              timestamp: now.toISOString()
            }
          },
          {
            body: {
              context: buildConversationContext(contextMessages)
            }
          }
        )
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error('Chat error:', error)
        }

        const errorMessage =
          i18n.language === 'hi'
            ? 'क्षमा करें, कुछ गलत हुआ। कृपया फिर से कोशिश करें।'
            : i18n.language === 'mr'
              ? 'माफ करा, काहीतरी चूक झाली. कृपया पुन्हा प्रयत्न करा.'
              : 'Sorry, something went wrong. Please try again.'

        toast.error(errorMessage)
      } finally {
        setQuotaStatus(getQuotaStatus(user?.id))
      }
    },
    [
      inputValue,
      pendingAttachments,
      isAssistantProcessing,
      analyzeQuery,
      messages,
      i18n.language,
      buildConversationContext,
      saveMessageImmediately,
      sendChatMessage,
      user?.id
    ]
  )

  useEffect(() => {
    handleSendMessageRef.current = handleSendMessage
  }, [handleSendMessage])

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      recognitionRef.current.start()
    }
  }

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop()
    }
  }

  const handleAttachClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file && file.type.startsWith('image/')) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size must be less than 5MB')
        return
      }

      const reader = new FileReader()
      reader.onload = (e) => {
        const imageUrl = e.target?.result as string
        const attachment = {
          type: 'image' as const,
          name: file.name,
          url: imageUrl,
          size: file.size
        }

        setPendingAttachments((prev) => [...prev, attachment])
      }
      reader.readAsDataURL(file)
    } else if (file) {
      toast.error('Only image files are supported')
    }

    if (event.target) {
      event.target.value = ''
    }
  }

  const copyToClipboard = async (text: string, messageId: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedMessageId(messageId)
      toast.success('Message copied to clipboard')

      setTimeout(() => setCopiedMessageId(null), 2000)
    } catch (err) {
      toast.error('Failed to copy message')
    }
  }

  const removeAttachment = (index: number) => {
    setPendingAttachments((prev) => prev.filter((_, i) => i !== index))
  }

  const startNewConversation = () => {
    setChatMessages([])
    setMessages([])
    setCurrentConversationId(null)
    currentConversationIdRef.current = null
    setShowHistory(false)
    setPendingAttachments([])
    lastSavedSnapshotRef.current = null
  }

  const loadConversation = (conversationId: string) => {
    const conversation = conversations.find((c) => c.id === conversationId)
    if (conversation) {
      setChatMessages(conversation.messages.map(messageToUIMessage))
      setMessages(conversation.messages)
      setCurrentConversationId(conversationId)
      currentConversationIdRef.current = conversationId
      setShowHistory(false)
      lastSavedSnapshotRef.current = null
    }
  }

  const deleteConversation = async (conversationId: string) => {
    await supabaseConversationStorage.deleteConversation(conversationId, user?.id)

    setConversations((prev) => prev.filter((c) => c.id !== conversationId))

    if (currentConversationId === conversationId) {
      startNewConversation()
    }
  }

  const formatMessage = (content: string, isAssistant: boolean = false) => {
    if (isAssistant) {
      return (
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
            ul: ({ children, ...props }) => (
              <ul
                {...props}
                className={cn('list-disc list-outside pl-5 mb-2 space-y-1', props.className)}
              >
                {children}
              </ul>
            ),
            ol: ({ children, ...props }) => (
              <ol
                {...props}
                className={cn('list-decimal list-outside pl-5 mb-2 space-y-1', props.className)}
              >
                {children}
              </ol>
            ),
            li: ({ children, ...props }) => (
              <li {...props} className={cn('leading-relaxed', props.className)}>
                {children}
              </li>
            ),
            code: ({ children, ...props }) => {
              const isInline = !props.className?.includes('language-')
              return isInline ? (
                <code className="bg-gray-200 px-1 py-0.5 rounded text-xs font-mono">
                  {children}
                </code>
              ) : (
                <pre className="bg-gray-100 p-2 rounded text-xs font-mono overflow-x-auto mb-2">
                  <code>{children}</code>
                </pre>
              )
            },
            strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
            em: ({ children }) => <em className="italic">{children}</em>,
            h1: ({ children }) => <h1 className="text-base font-bold mb-2">{children}</h1>,
            h2: ({ children }) => <h2 className="text-sm font-semibold mb-2">{children}</h2>,
            h3: ({ children }) => <h3 className="text-sm font-medium mb-1">{children}</h3>,
            blockquote: ({ children }) => (
              <blockquote className="border-l-2 border-gray-300 pl-3 ml-2 my-2 text-gray-700">
                {children}
              </blockquote>
            )
          }}
        >
          {content}
        </ReactMarkdown>
      )
    } else {
      return content.split('\n').map((line, index) => (
        <p key={index} className="mb-2 last:mb-0">
          {line}
        </p>
      ))
    }
  }

  const quickQuestions = [
    {
      en: 'How to prevent grape diseases?',
      hi: 'अंगूर के रोगों से कैसे बचाव करें?',
      mr: 'द्राक्षाच्या आजारांपासून कसे बचाव करावा?'
    },
    {
      en: 'Harvest time indicators',
      hi: 'कटाई के समय के संकेत',
      mr: 'कापणीच्या वेळेचे संकेत'
    }
  ]

  if (!isOpen && isMobile) {
    return (
      <Button
        onClick={onToggle}
        size="lg"
        className={cn('fixed bottom-4 right-4 z-50 rounded-full w-14 h-14 shadow-lg', className)}
      >
        <MessageCircle className="w-6 h-6" />
      </Button>
    )
  }

  return (
    <Card
      className={cn(
        'flex flex-col rounded-none',
        isMobile ? 'h-screen' : 'h-[calc(100vh)]',
        isMobile && isOpen && 'fixed inset-0 z-50 rounded-none pb-16',
        className
      )}
    >
      <CardHeader className="flex-shrink-0 pb-3 border-b">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bot className="w-5 h-5" />
            <span className="text-base sm:text-lg">{t('ai_assistant', 'AI Assistant')}</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowHistory(!showHistory)}
              className="h-8"
            >
              <History className="w-4 h-4" />
            </Button>

            <Button variant="ghost" size="sm" onClick={startNewConversation} className="h-8">
              <Plus className="w-4 h-4" />
            </Button>

            <div
              className={cn(
                'text-xs px-2 py-1 rounded-full',
                quotaStatus.isExceeded
                  ? 'bg-red-100 text-red-600'
                  : quotaStatus.remaining <= 1
                    ? 'bg-yellow-100 text-yellow-600'
                    : 'bg-green-100 text-green-600'
              )}
            >
              {quotaStatus.remaining}/{quotaStatus.limit}
            </div>
            {isMobile && onToggle && (
              <Button variant="ghost" size="sm" onClick={onToggle}>
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col min-h-0 p-0">
        {showHistory && (
          <div className="flex-shrink-0 border-b bg-gray-50 p-4 max-h-60 overflow-y-auto">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium">Conversation History</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowHistory(false)}
                className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            {conversations.length === 0 ? (
              <p className="text-xs text-gray-500">No saved conversations yet</p>
            ) : (
              <div className="space-y-2">
                {conversations
                  .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
                  .map((conv) => (
                    <div
                      key={conv.id}
                      className={cn(
                        'group flex items-center justify-between p-2 rounded cursor-pointer text-xs hover:bg-gray-200',
                        currentConversationId === conv.id && 'bg-blue-100'
                      )}
                    >
                      <div onClick={() => loadConversation(conv.id)} className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900 truncate">{conv.title}</div>
                        <div className="text-gray-500 text-xs">
                          {conv.updatedAt.toLocaleDateString()} • {conv.messages.length - 1}{' '}
                          messages
                        </div>
                      </div>
                      <Button
                        onClick={(e) => {
                          e.stopPropagation()
                          deleteConversation(conv.id)
                        }}
                        variant="ghost"
                        size="sm"
                        className="opacity-0 group-hover:opacity-100 h-6 w-6 p-0 text-red-400 hover:text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}

        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn('flex gap-3', message.role === 'user' && 'flex-row-reverse')}
              >
                <div
                  className={cn(
                    'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center',
                    message.role === 'user' ? 'bg-blue-500 text-white' : 'bg-green-500 text-white'
                  )}
                >
                  {message.role === 'user' ? (
                    <User className="w-4 h-4" />
                  ) : (
                    <Bot className="w-4 h-4" />
                  )}
                </div>

                <div
                  className={cn(
                    'flex-1 max-w-[85%] space-y-2',
                    message.role === 'user' && 'flex-col items-end'
                  )}
                >
                  <div
                    className={cn(
                      'relative group p-3 rounded-2xl text-sm break-words',
                      message.role === 'user'
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-900'
                    )}
                  >
                    {formatMessage(message.content, message.role === 'assistant')}

                    {message.role === 'assistant' && (
                      <Button
                        onClick={() => copyToClipboard(message.content, message.id)}
                        variant="ghost"
                        size="sm"
                        className={cn(
                          'absolute top-2 right-2 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity',
                          'bg-white/80 hover:bg-white text-gray-600 hover:text-gray-900'
                        )}
                      >
                        {copiedMessageId === message.id ? (
                          <Check className="w-3 h-3" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </Button>
                    )}
                  </div>

                  {message.attachments && message.attachments.length > 0 && (
                    <div className="space-y-2">
                      {message.attachments.map((attachment, index) => (
                        <div
                          key={index}
                          className={cn(
                            'max-w-xs rounded-lg overflow-hidden border',
                            message.role === 'user' ? 'border-blue-200' : 'border-gray-200'
                          )}
                        >
                          {attachment.type === 'image' && (
                            <Image
                              src={attachment.url}
                              alt={attachment.name}
                              width={400}
                              height={256}
                              className="w-full h-auto object-cover max-h-64"
                              loading="lazy"
                            />
                          )}
                          <div className="p-2 bg-gray-50 text-xs text-gray-600 flex items-center justify-between">
                            <span className="truncate">{attachment.name}</span>
                            {attachment.size && (
                              <span className="text-gray-400 ml-2">
                                {(attachment.size / 1024 / 1024).toFixed(1)}MB
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {isAssistantProcessing && (
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="flex-1 max-w-[85%] p-3 rounded-2xl bg-gray-100">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm text-gray-500">
                      {isMobile ? 'Thinking...' : 'AI is thinking...'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {messages.length <= 1 && !isAssistantProcessing && !isMobile && (
            <div className="flex-shrink-0 p-4 border-t border-b">
              <p className="text-xs text-gray-500 mb-2">
                {t('quick_questions', 'Quick questions:')}
              </p>
              <div className="flex flex-wrap gap-2">
                {quickQuestions.map((question, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      handleSendMessage(question[i18n.language as keyof typeof question])
                    }
                    className="text-xs h-8"
                  >
                    {question[i18n.language as keyof typeof question]}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {pendingAttachments.length > 0 && (
            <div className="flex-shrink-0 p-4 border-t bg-gray-50/50">
              <div className="flex flex-wrap gap-2">
                {pendingAttachments.map((attachment, index) => (
                  <div
                    key={index}
                    className="relative max-w-24 rounded-lg overflow-hidden border border-gray-200 bg-white"
                  >
                    <Image
                      src={attachment.url}
                      alt={attachment.name}
                      width={96}
                      height={64}
                      className="w-full h-16 object-cover"
                    />
                    <Button
                      onClick={() => removeAttachment(index)}
                      variant="destructive"
                      size="sm"
                      className="absolute -top-1 -right-1 h-5 w-5 p-0 rounded-full text-xs"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                    <div className="p-1 text-xs text-gray-600 truncate">{attachment.name}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className={cn('flex-shrink-0 p-4 bg-white border-t')}>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />

            <div className="relative w-full max-w-4xl mx-auto">
              {isMobile ? (
                <div className="space-y-3">
                  <div className="relative bg-white border border-gray-300 rounded-xl px-4 py-3 shadow-sm">
                    <Textarea
                      style={{
                        resize: 'none',
                        minHeight: '28px',
                        maxHeight: '120px'
                      }}
                      rows={1}
                      ref={inputRef}
                      value={inputValue}
                      onChange={(e) => {
                        setInputValue(e.target.value)
                        const textarea = e.target
                        textarea.style.height = 'auto'
                        textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px'
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault()
                          handleSendMessage()
                        }
                      }}
                      placeholder={
                        quotaStatus.isExceeded
                          ? i18n.language === 'hi'
                            ? 'दैनिक सीमा समाप्त - कल वापस आएं'
                            : i18n.language === 'mr'
                              ? 'दैनिक मर्यादा संपली - उद्या परत या'
                              : 'Daily limit reached - come back tomorrow'
                          : i18n.language === 'hi'
                            ? 'कुछ भी पूछें...'
                            : i18n.language === 'mr'
                              ? 'काहीही विचारा...'
                              : 'Ask anything'
                      }
                      disabled={isAssistantProcessing || quotaStatus.isExceeded}
                      className={cn(
                        'w-full bg-transparent border-0 resize-none text-base leading-7 p-0',
                        'focus:outline-none placeholder-gray-400 focus-visible:ring-0 focus-visible:ring-offset-0',
                        'scrollbar-thin scrollbar-track-transparent scrollbar-thumb-gray-300'
                      )}
                    />

                    <div className="flex items-center justify-between">
                      <Button
                        onClick={handleAttachClick}
                        disabled={isAssistantProcessing || quotaStatus.isExceeded}
                        variant="ghost"
                        size="sm"
                        className="p-0 h-5 w-6 hover:bg-gray-100 text-gray-500 flex-shrink-0"
                      >
                        <Paperclip className="w-6 h-5" />
                      </Button>

                      <div className="flex items-center gap-4 flex-shrink-0">
                        {recognitionRef.current && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={isListening ? stopListening : startListening}
                            className={cn(
                              'p-0 h-5 w-6',
                              isListening
                                ? 'bg-red-50 text-red-500 hover:bg-red-100'
                                : 'hover:bg-gray-100 text-gray-500'
                            )}
                          >
                            {isListening ? (
                              <MicOff className="w-6 h-5" />
                            ) : (
                              <Mic className="w-6 h-5" />
                            )}
                          </Button>
                        )}

                        <Button
                          onClick={() => handleSendMessage()}
                          disabled={
                            (!inputValue.trim() && pendingAttachments.length === 0) ||
                            isAssistantProcessing ||
                            quotaStatus.isExceeded
                          }
                          size="sm"
                          className={cn(
                            'p-0 h-5 w-8 rounded-lg flex items-center justify-center',
                            (!inputValue.trim() && pendingAttachments.length === 0) ||
                              isAssistantProcessing ||
                              quotaStatus.isExceeded
                              ? 'bg-gray-300 text-gray-400 cursor-not-allowed'
                              : 'bg-primary hover:bg-teal-700 text-white'
                          )}
                        >
                          {isAssistantProcessing ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <ArrowRight className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="relative bg-white border border-gray-300 rounded-xl px-4 py-3 shadow-sm max-w-4xl mx-auto">
                  <Textarea
                    style={{
                      resize: 'none',
                      minHeight: '28px',
                      maxHeight: '120px'
                    }}
                    rows={1}
                    ref={inputRef}
                    value={inputValue}
                    onChange={(e) => {
                      setInputValue(e.target.value)
                      const textarea = e.target
                      textarea.style.height = 'auto'
                      textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px'
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        handleSendMessage()
                      }
                    }}
                    placeholder={
                      quotaStatus.isExceeded
                        ? i18n.language === 'hi'
                          ? 'दैनिक सीमा समाप्त - कल वापस आएं'
                          : i18n.language === 'mr'
                            ? 'दैनिक मर्यादा संपली - उद्या परत या'
                            : 'Daily limit reached - come back tomorrow'
                        : i18n.language === 'hi'
                          ? 'कुछ भी पूछें...'
                          : i18n.language === 'mr'
                            ? 'काहीही विचारा...'
                            : 'Ask anything'
                    }
                    disabled={isAssistantProcessing || quotaStatus.isExceeded}
                    className={cn(
                      'w-full bg-transparent border-0 resize-none text-base leading-7 p-0',
                      'focus:outline-none focus:ring-0 placeholder-gray-400 focus-visible:ring-0 focus-visible:ring-offset-0',
                      'scrollbar-thin scrollbar-track-transparent scrollbar-thumb-gray-300'
                    )}
                  />

                  <div className="flex items-center justify-between pt-3">
                    <Button
                      onClick={handleAttachClick}
                      disabled={isAssistantProcessing || quotaStatus.isExceeded}
                      variant="ghost"
                      size="sm"
                      className="p-0 h-7 w-7 hover:bg-gray-100 text-gray-500 flex-shrink-0"
                    >
                      <Paperclip className="w-5 h-5" />
                    </Button>

                    <div className="flex items-center gap-3 flex-shrink-0">
                      {recognitionRef.current && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={isListening ? stopListening : startListening}
                          className={cn(
                            'p-0 h-7 w-7 hover:bg-gray-100',
                            isListening
                              ? 'bg-red-50 text-red-500 hover:bg-red-100'
                              : 'text-gray-500'
                          )}
                        >
                          {isListening ? (
                            <MicOff className="w-5 h-5" />
                          ) : (
                            <Mic className="w-5 h-5" />
                          )}
                        </Button>
                      )}

                      <Button
                        onClick={() => handleSendMessage()}
                        disabled={
                          (!inputValue.trim() && pendingAttachments.length === 0) ||
                          isAssistantProcessing ||
                          quotaStatus.isExceeded
                        }
                        size="sm"
                        className={cn(
                          'p-0 h-8 w-8 rounded-lg flex items-center justify-center',
                          (!inputValue.trim() && pendingAttachments.length === 0) ||
                            isAssistantProcessing ||
                            quotaStatus.isExceeded
                            ? 'bg-gray-300 text-gray-400 cursor-not-allowed'
                            : 'bg-primary hover:bg-teal-700 text-white'
                        )}
                      >
                        {isAssistantProcessing ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <ArrowRight className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {isListening && (
                <div className="absolute -top-8 left-3 flex items-center gap-2 px-2 py-1 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex space-x-1">
                    <div className="w-1 h-1 bg-red-500 rounded-full animate-pulse"></div>
                    <div className="w-1 h-1 bg-red-500 rounded-full animate-pulse delay-75"></div>
                    <div className="w-1 h-1 bg-red-500 rounded-full animate-pulse delay-150"></div>
                  </div>
                  <span className="text-xs text-red-600 font-medium">
                    {t('listening', 'Listening...')}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

declare global {
  interface Window {
    webkitSpeechRecognition: any
  }
}
