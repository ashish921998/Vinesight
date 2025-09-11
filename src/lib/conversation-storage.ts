import { z } from 'zod'
import { createNamespacedStorage, StorageBackends, storageNamespaces } from './storage'

export interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  language?: string;
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
}

const MAX_CONVERSATIONS = 50
const TTL_MS = 30 * 24 * 60 * 60 * 1000 // 30 days

const MessageMetaSchema = z.object({
  id: z.string(),
  role: z.union([z.literal('user'), z.literal('assistant')]),
  timestamp: z.string(),
  excerpt: z.string().max(160)
})

const ConversationMetaSchema = z.object({
  id: z.string(),
  title: z.string(),
  messages: z.array(MessageMetaSchema),
  createdAt: z.string(),
  updatedAt: z.string()
})

const IndexSchema = z.object({ ids: z.array(z.string()) })

const storage = createNamespacedStorage(storageNamespaces.conversations, StorageBackends.local)

class ConversationStorage {
  private indexKey = 'idx'
  private convKey = (id: string) => `conv:${id}`

  private loadIndex(): string[] {
    const idx = storage.get(this.indexKey, IndexSchema) || { ids: [] }
    return Array.from(new Set(idx.ids))
  }

  private saveIndex(ids: string[]) {
    storage.set(this.indexKey, { ids: Array.from(new Set(ids)).slice(0, MAX_CONVERSATIONS) }, { ttlMs: TTL_MS, schema: IndexSchema })
  }

  loadConversations(): Conversation[] {
    try {
      const ids = this.loadIndex()
      const items: Conversation[] = []
      for (const id of ids) {
        const meta = storage.get(this.convKey(id), ConversationMetaSchema)
        if (!meta) continue
        items.push({
          id: meta.id,
          title: meta.title,
          createdAt: new Date(meta.createdAt),
          updatedAt: new Date(meta.updatedAt),
          messages: meta.messages.map(m => ({
            id: m.id,
            role: m.role,
            timestamp: new Date(m.timestamp),
            content: m.excerpt
          }))
        })
      }
      return items.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
    } catch {
      return []
    }
  }

  saveConversation(conversation: Conversation): void {
    const meta = this.toMeta(conversation)
    const ids = this.loadIndex()
    if (!ids.includes(meta.id)) ids.unshift(meta.id)
    // trim and persist
    this.saveIndex(ids)
    storage.set(this.convKey(meta.id), meta, { ttlMs: TTL_MS, schema: ConversationMetaSchema })
  }

  saveConversations(conversations: Conversation[]): void {
    const sorted = [...conversations].sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()).slice(0, MAX_CONVERSATIONS)
    const ids: string[] = []
    for (const conv of sorted) {
      ids.push(conv.id)
      storage.set(this.convKey(conv.id), this.toMeta(conv), { ttlMs: TTL_MS, schema: ConversationMetaSchema })
    }
    this.saveIndex(ids)
  }

  deleteConversation(conversationId: string): void {
    const ids = this.loadIndex().filter(id => id !== conversationId)
    this.saveIndex(ids)
    storage.remove(this.convKey(conversationId))
  }

  getConversation(conversationId: string): Conversation | null {
    const meta = storage.get(this.convKey(conversationId), ConversationMetaSchema)
    if (!meta) return null
    return {
      id: meta.id,
      title: meta.title,
      createdAt: new Date(meta.createdAt),
      updatedAt: new Date(meta.updatedAt),
      messages: meta.messages.map(m => ({ id: m.id, role: m.role, timestamp: new Date(m.timestamp), content: m.excerpt }))
    }
  }

  generateTitle(messages: Message[]): string {
    const firstUserMessage = messages.find(m => m.role === 'user')
    if (!firstUserMessage) return 'New Conversation'
    const title = firstUserMessage.content.replace(/\n/g, ' ').trim().slice(0, 50)
    return title.length === 50 ? title + '...' : title
  }

  clearAllConversations(): void {
    storage.clear()
  }

  exportConversations(): string {
    const items = this.loadConversations()
    return JSON.stringify(items, null, 2)
  }

  importConversations(jsonData: string): void {
    try {
      const conversations = JSON.parse(jsonData) as Conversation[]
      this.saveConversations(conversations)
    } catch (error) {
      throw new Error('Invalid conversation data format')
    }
  }

  private toMeta(conversation: Conversation) {
    return {
      id: conversation.id,
      title: conversation.title || this.generateTitle(conversation.messages),
      createdAt: conversation.createdAt.toISOString(),
      updatedAt: new Date().toISOString(),
      messages: conversation.messages.slice(-20).map(m => ({
        id: m.id,
        role: m.role,
        timestamp: m.timestamp.toISOString(),
        excerpt: (m.content || '').replace(/\s+/g, ' ').trim().slice(0, 160)
      }))
    }
  }
}

export const conversationStorage = new ConversationStorage()
