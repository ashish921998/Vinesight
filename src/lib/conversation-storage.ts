/**
 * Conversation Storage Service
 * Handles persistent storage of AI Assistant conversations using localStorage
 */

export interface Message {
  id: string
  content: string
  role: 'user' | 'assistant'
  timestamp: Date
  language?: string
  attachments?: Array<{
    type: 'image'
    name: string
    url: string
    size?: number
  }>
  context?: {
    queryType?: string
    confidence?: number
    relatedTopics?: string[]
  }
}

export interface Conversation {
  id: string
  title: string
  messages: Message[]
  createdAt: Date
  updatedAt: Date
}

const STORAGE_KEY = 'ai_conversations'
const MAX_CONVERSATIONS = 50 // Limit to prevent localStorage bloat

class ConversationStorage {
  /**
   * Load all conversations from localStorage
   */
  loadConversations(): Conversation[] {
    if (typeof window === 'undefined') return []

    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (!stored) return []

      const conversations = JSON.parse(stored)

      // Convert date strings back to Date objects
      return conversations.map((conv: any) => ({
        ...conv,
        createdAt: new Date(conv.createdAt),
        updatedAt: new Date(conv.updatedAt),
        messages: conv.messages.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }))
      }))
    } catch (error) {
      console.error('Error loading conversations:', error)
      return []
    }
  }

  /**
   * Save conversations to localStorage
   */
  saveConversations(conversations: Conversation[]): void {
    if (typeof window === 'undefined') return

    try {
      // Limit the number of conversations to prevent storage bloat
      const limited = conversations
        .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
        .slice(0, MAX_CONVERSATIONS)

      localStorage.setItem(STORAGE_KEY, JSON.stringify(limited))
    } catch (error) {
      console.error('Error saving conversations:', error)
      // If storage is full, try to clear old conversations
      if (error instanceof Error && error.name === 'QuotaExceededError') {
        this.clearOldConversations(conversations)
      }
    }
  }

  /**
   * Save or update a single conversation
   */
  saveConversation(conversation: Conversation): void {
    const conversations = this.loadConversations()
    const existingIndex = conversations.findIndex((c) => c.id === conversation.id)

    const updatedConversation = {
      ...conversation,
      updatedAt: new Date()
    }

    if (existingIndex >= 0) {
      conversations[existingIndex] = updatedConversation
    } else {
      conversations.push(updatedConversation)
    }

    this.saveConversations(conversations)
  }

  /**
   * Delete a conversation
   */
  deleteConversation(conversationId: string): void {
    const conversations = this.loadConversations()
    const filtered = conversations.filter((c) => c.id !== conversationId)
    this.saveConversations(filtered)
  }

  /**
   * Get a specific conversation by ID
   */
  getConversation(conversationId: string): Conversation | null {
    const conversations = this.loadConversations()
    return conversations.find((c) => c.id === conversationId) || null
  }

  /**
   * Create a conversation title from the first user message
   */
  generateTitle(messages: Message[]): string {
    const firstUserMessage = messages.find((m) => m.role === 'user')
    if (!firstUserMessage) return 'New Conversation'

    // Clean and truncate the message for the title
    const title = firstUserMessage.content.replace(/\n/g, ' ').trim().slice(0, 50)

    return title.length === 50 ? title + '...' : title
  }

  /**
   * Clear old conversations to free up space
   */
  private clearOldConversations(conversations: Conversation[]): void {
    try {
      // Keep only the most recent 20 conversations
      const recent = conversations
        .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
        .slice(0, 20)

      localStorage.setItem(STORAGE_KEY, JSON.stringify(recent))
    } catch (error) {
      console.error('Error clearing old conversations:', error)
      // Last resort: clear all conversations
      localStorage.removeItem(STORAGE_KEY)
    }
  }

  /**
   * Clear all conversations
   */
  clearAllConversations(): void {
    if (typeof window === 'undefined') return
    localStorage.removeItem(STORAGE_KEY)
  }

  /**
   * Export conversations as JSON
   */
  exportConversations(): string {
    const conversations = this.loadConversations()
    return JSON.stringify(conversations, null, 2)
  }

  /**
   * Import conversations from JSON
   */
  importConversations(jsonData: string): void {
    try {
      const conversations = JSON.parse(jsonData)
      this.saveConversations(conversations)
    } catch (error) {
      console.error('Error importing conversations:', error)
      throw new Error('Invalid conversation data format')
    }
  }
}

export const conversationStorage = new ConversationStorage()
