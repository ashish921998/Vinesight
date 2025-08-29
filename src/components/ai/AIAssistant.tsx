'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { MessageCircle, Send, Mic, MicOff, Bot, User, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ImageAnalysisResult } from '@/types/ai';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  language?: string;
  context?: {
    queryType?: string;
    confidence?: number;
    relatedTopics?: string[];
  };
}

interface AIAssistantProps {
  farmData?: any;
  recentAnalysis?: ImageAnalysisResult[];
  isOpen?: boolean;
  onToggle?: () => void;
  className?: string;
}

export function AIAssistant({ 
  farmData, 
  recentAnalysis, 
  isOpen = false, 
  onToggle, 
  className 
}: AIAssistantProps) {
  const { t, i18n } = useTranslation();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Check if device is mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Initialize speech recognition (once on mount)
  useEffect(() => {
    if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-IN'; // Default language, will be updated by separate effect
      
      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onerror = () => setIsListening(false);
      
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputValue(transcript);
        // Use a timeout to avoid stale closure issues
        setTimeout(() => {
          const currentHandleSendMessage = (window as any).currentHandleSendMessage;
          if (currentHandleSendMessage) {
            currentHandleSendMessage(transcript);
          }
        }, 0);
      };
      
      recognitionRef.current = recognition;

      // Cleanup function
      return () => {
        if (recognitionRef.current) {
          recognitionRef.current.abort();
          recognitionRef.current = null;
        }
      };
    }
  }, []); // Only run once on mount

  // Update speech recognition language when language changes
  useEffect(() => {
    if (recognitionRef.current) {
      recognitionRef.current.lang = i18n.language === 'hi' ? 'hi-IN' : 
                                   i18n.language === 'mr' ? 'mr-IN' : 'en-IN';
    }
  }, [i18n.language]);

  const getWelcomeMessage = useCallback(() => {
    switch (i18n.language) {
      case 'hi':
        return 'नमस्ते! मैं आपका AI कृषि सहायक हूं। अंगूर की खेती के बारे में कोई भी प्रश्न पूछें - रोग, सिंचाई, उर्वरक, या कटाई के बारे में।';
      case 'mr':
        return 'नमस्कार! मी तुमचा AI कृषी सहाय्यक आहे. द्राक्ष शेतीबाबत कोणताही प्रश्न विचारा - रोग, सिंचन, खत, किंवा कापणी बद्दल.';
      default:
        return 'Hello! I\'m your AI farming assistant. Ask me anything about grape farming - diseases, irrigation, fertilization, or harvesting.';
    }
  }, [i18n.language]);

  // Handle welcome message
  useEffect(() => {
    if (messages.length === 0) {
      const welcomeMessage: Message = {
        id: Date.now().toString(),
        content: getWelcomeMessage(),
        role: 'assistant',
        timestamp: new Date(),
        language: i18n.language
      };
      setMessages([welcomeMessage]);
    } else if (messages.length === 1 && messages[0].role === 'assistant' && messages[0].language !== i18n.language) {
      // Update welcome message language if it's the only message and language changed
      const updatedWelcomeMessage: Message = {
        ...messages[0],
        content: getWelcomeMessage(),
        language: i18n.language
      };
      setMessages([updatedWelcomeMessage]);
    }
  }, [i18n.language, getWelcomeMessage]); // Remove messages to prevent loops

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const analyzeQuery = (text: string) => {
    const lowerText = text.toLowerCase();
    const queryTypes = [
      { type: 'disease', keywords: ['disease', 'sick', 'spots', 'fungus', 'mold', 'rot', 'बीमारी', 'रोग', 'आजार'] },
      { type: 'irrigation', keywords: ['water', 'irrigation', 'dry', 'drought', 'सिंचाई', 'पानी', 'पाणी'] },
      { type: 'fertilizer', keywords: ['fertilizer', 'nutrition', 'feed', 'nutrient', 'उर्वरक', 'खाद', 'खत'] },
      { type: 'harvest', keywords: ['harvest', 'pick', 'ripe', 'maturity', 'कटाई', 'कापणी'] },
      { type: 'pruning', keywords: ['pruning', 'trim', 'cut', 'canopy', 'छंटाई', 'छाटणी'] },
      { type: 'pest', keywords: ['pest', 'insect', 'bug', 'कीट', 'कीड़े'] },
      { type: 'weather', keywords: ['weather', 'rain', 'temperature', 'मौसम', 'बारिश'] },
      { type: 'soil', keywords: ['soil', 'ph', 'organic', 'मिट्टी', 'माती'] }
    ];

    for (const queryType of queryTypes) {
      const matchCount = queryType.keywords.filter(keyword => lowerText.includes(keyword)).length;
      if (matchCount > 0) {
        return {
          queryType: queryType.type,
          confidence: Math.min(matchCount / queryType.keywords.length + 0.5, 1),
          relatedTopics: queryType.keywords.filter(keyword => lowerText.includes(keyword))
        };
      }
    }

    return { queryType: 'general', confidence: 0.5, relatedTopics: [] };
  };

  const buildConversationContext = useCallback((currentMessages?: Message[]) => {
    const messagesToUse = currentMessages || messages;
    const recentMessages = messagesToUse.slice(-5); // Last 5 messages for context
    const conversationTopics = recentMessages
      .filter(msg => msg.context?.queryType)
      .map(msg => msg.context!.queryType)
      .filter((topic): topic is string => topic !== undefined); // Filter out undefined values
    
    return {
      farmData,
      language: i18n.language as 'en' | 'hi' | 'mr',
      recentAnalysis,
      conversationHistory: recentMessages.map(msg => ({
        role: msg.role,
        content: msg.content,
        queryType: msg.context?.queryType
      })),
      recentTopics: [...new Set(conversationTopics)]
    };
  }, [messages, farmData, recentAnalysis, i18n.language]);

  const handleSendMessage = useCallback(async (text?: string) => {
    const messageText = text || inputValue.trim();
    if (!messageText || isLoading) return;

    // Analyze the query
    const queryAnalysis = analyzeQuery(messageText);

    // Add user message with context
    const userMessage: Message = {
      id: Date.now().toString(),
      content: messageText,
      role: 'user',
      timestamp: new Date(),
      context: queryAnalysis
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInputValue('');
    setIsLoading(true);

    // Create streaming assistant message
    const assistantMessageId = (Date.now() + 1).toString();
    const streamingMessage: Message = {
      id: assistantMessageId,
      content: '',
      role: 'assistant',
      timestamp: new Date(),
      language: i18n.language,
      context: {
        queryType: queryAnalysis.queryType,
        confidence: queryAnalysis.confidence
      }
    };

    setMessages(prev => [...prev, streamingMessage]);

    try {
      // Build enhanced context for AI response with updated messages
      const conversationContext = buildConversationContext(updatedMessages);
      
      // Call the AI chat API directly
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: messageText,
          context: conversationContext,
          stream: true
        }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          // Handle authentication error
          const errorData = await response.json().catch(() => ({}));
          if (errorData.code === 'UNAUTHORIZED') {
            throw new Error('AUTHENTICATION_REQUIRED');
          }
        }
        throw new Error(`Failed to get AI response: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body');
      }

      const decoder = new TextDecoder();
      let done = false;
      let fullResponse = '';

      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        
        if (value) {
          const chunk = decoder.decode(value);
          fullResponse += chunk;
          
          // Update the streaming message in real-time
          setMessages(prev => prev.map(msg => 
            msg.id === assistantMessageId 
              ? { ...msg, content: fullResponse }
              : msg
          ));
        }
      }

    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Chat error:', error);
      }
      
      let errorContent = '';
      if (error instanceof Error && error.message === 'AUTHENTICATION_REQUIRED') {
        errorContent = i18n.language === 'hi' ? 'कृपया AI सहायक का उपयोग करने के लिए साइन इन करें।' :
                       i18n.language === 'mr' ? 'कृपया AI सहाय्यक वापरण्यासाठी साइन इन करा.' :
                       'Please sign in to use the AI Assistant.';
      } else {
        errorContent = i18n.language === 'hi' ? 'क्षमा करें, कुछ गलत हुआ। कृपया फिर से कोशिश करें।' :
                       i18n.language === 'mr' ? 'माफ करा, काहीतरी चूक झाली. कृपया पुन्हा प्रयत्न करा.' :
                       'Sorry, something went wrong. Please try again.';
      }
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: errorContent,
        role: 'assistant',
        timestamp: new Date()
      };
      
      // Replace the streaming message with error
      setMessages(prev => prev.map(msg => 
        msg.id === assistantMessageId ? errorMessage : msg
      ));
    } finally {
      setIsLoading(false);
    }
  }, [inputValue, isLoading, messages, i18n.language, buildConversationContext]);

  // Store current handleSendMessage in window for speech recognition
  useEffect(() => {
    (window as any).currentHandleSendMessage = handleSendMessage;
    return () => {
      delete (window as any).currentHandleSendMessage;
    };
  }, [handleSendMessage]);

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      recognitionRef.current.start();
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
  };

  const formatMessage = (content: string) => {
    // Simple formatting for better readability
    return content.split('\n').map((line, index) => (
      <p key={index} className="mb-2 last:mb-0">
        {line}
      </p>
    ));
  };

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
  ];

  // Mobile floating chat button
  if (!isOpen && isMobile) {
    return (
      <Button
        onClick={onToggle}
        size="lg"
        className={cn(
          "fixed bottom-4 right-4 z-50 rounded-full w-14 h-14 shadow-lg",
          className
        )}
      >
        <MessageCircle className="w-6 h-6" />
      </Button>
    );
  }


  return (
    <Card className={cn(
      "flex flex-col h-full bg-white",
      isMobile && isOpen && "fixed inset-0 z-50 rounded-none bg-white pb-safe",
      className
    )}>
      <CardHeader className="flex-shrink-0 pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bot className="w-5 h-5" />
            <span className="text-base sm:text-lg">
              {t('ai_assistant', 'AI Assistant')}
            </span>
          </div>
          {isMobile && onToggle && (
            <Button variant="ghost" size="sm" onClick={onToggle}>
              <X className="w-4 h-4" />
            </Button>
          )}
        </CardTitle>
      </CardHeader>

      <CardContent className={cn(
        "flex-1 flex flex-col min-h-0 p-0 bg-white",
        isMobile && isOpen && "pb-20"
      )}>
        {/* Messages */}
        <div className={cn(
          "flex-1 overflow-y-auto p-4 space-y-4 bg-white",
          isMobile && isOpen && "pb-32"
        )}>
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "flex gap-3 max-w-full",
                message.role === 'user' && "flex-row-reverse"
              )}
            >
              <div className={cn(
                "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
                message.role === 'user' 
                  ? "bg-blue-500 text-white" 
                  : "bg-green-500 text-white"
              )}>
                {message.role === 'user' ? (
                  <User className="w-4 h-4" />
                ) : (
                  <Bot className="w-4 h-4" />
                )}
              </div>
              
              <div className={cn(
                "flex-1 min-w-0 p-3 rounded-2xl text-sm",
                message.role === 'user'
                  ? "bg-blue-500 text-white ml-12"
                  : "bg-gray-100 text-gray-900 mr-12"
              )}>
                {formatMessage(message.content)}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center">
                <Bot className="w-4 h-4" />
              </div>
              <div className="flex-1 p-3 rounded-2xl bg-gray-100 mr-12">
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

        {/* Quick Questions */}
        {messages.length <= 1 && !isLoading && (
          <div className="p-4 border-t">
            <p className="text-xs text-gray-500 mb-2">
              {t('quick_questions', 'Quick questions:')}
            </p>
            <div className="flex flex-wrap gap-2">
              {quickQuestions.map((question, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => handleSendMessage(question[i18n.language as keyof typeof question])}
                  className="text-xs h-8"
                >
                  {question[i18n.language as keyof typeof question]}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Input Area */}
        <div className={cn(
          "flex-shrink-0 p-4 border-t bg-white/95 backdrop-blur-sm",
          isMobile && isOpen && "fixed bottom-20 left-0 right-0 z-[60] bg-white border-t-2 shadow-lg"
        )}>
          <div className="flex gap-2 items-center">
            <div className="flex-1 relative border-transparent">
              <Input
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder={
                  i18n.language === 'hi' ? 'अपना प्रश्न पूछें...' :
                  i18n.language === 'mr' ? 'तुमचा प्रश्न विचारा...' :
                  'Ask your question...'
                }
                disabled={isLoading}
                className="pr-10 border-gray-300 focus-visible:border-blue-500 hover:border-gray-400 focus:border-blue-500"
              />
              {recognitionRef.current && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={isListening ? stopListening : startListening}
                  className={cn(
                    "absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 p-0",
                    isListening && "text-red-500"
                  )}
                >
                  {isListening ? (
                    <MicOff className="w-4 h-4" />
                  ) : (
                    <Mic className="w-4 h-4" />
                  )}
                </Button>
              )}
            </div>
            <Button
              onClick={() => handleSendMessage()}
              disabled={!inputValue.trim() || isLoading}
              size="sm"
              className="flex-shrink-0"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
          
          {isListening && (
            <div className="flex items-center gap-2 mt-2">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse delay-75"></div>
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse delay-150"></div>
              </div>
              <span className="text-xs text-red-500">
                {t('listening', 'Listening...')}
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Declare global type for WebKit Speech Recognition
declare global {
  interface Window {
    webkitSpeechRecognition: any;
  }
}