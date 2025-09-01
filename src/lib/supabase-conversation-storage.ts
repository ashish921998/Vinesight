/**
 * Supabase Conversation Storage Service
 * Handles persistent storage of AI Assistant conversations using Supabase database
 */

import { createClient } from './supabase';
import type { Database } from '@/types/database';

// Enhanced interfaces that map to database schema
export interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant' | 'system';
  timestamp: Date;
  language?: string;
  attachments?: Array<{
    type: 'image';
    name: string;
    url: string;
    size?: number;
  }>;
  context?: {
    queryType?: string;
    confidence?: number;
    relatedTopics?: string[];
    farmReferences?: any;
    tokenCount?: number;
    processingTime?: number;
  };
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
  userId?: string;
  farmId?: number;
  topicCategory?: string;
  summary?: string;
  lastMessageAt?: Date;
  messageCount?: number;
  contextTags?: string[];
}

type AIConversation = Database['public']['Tables']['ai_conversations']['Row'];
type AIMessage = Database['public']['Tables']['ai_messages']['Row'];
type ConversationInsert = Database['public']['Tables']['ai_conversations']['Insert'];
type MessageInsert = Database['public']['Tables']['ai_messages']['Insert'];

class SupabaseConversationStorage {
  private supabase = createClient();

  /**
   * Load conversations for a specific user, optionally filtered by farm
   */
  async loadConversations(userId?: string, farmId?: number): Promise<Conversation[]> {
    if (!userId) {
      // Fallback to localStorage if no user (backward compatibility)
      return this.loadFromLocalStorage();
    }

    try {
      let query = this.supabase
        .from('ai_conversations')
        .select(`
          *,
          ai_messages (*)
        `)
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });

      // Filter by farm if specified
      if (farmId) {
        query = query.eq('farm_id', farmId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error loading conversations:', error);
        return [];
      }

      return data?.map(this.mapToConversation) || [];
    } catch (error) {
      console.error('Error loading conversations:', error);
      return [];
    }
  }

  /**
   * Save or update a single conversation
   */
  async saveConversation(conversation: Conversation, userId?: string): Promise<Conversation | null> {
    if (!userId) {
      // Fallback to localStorage if no user
      this.saveToLocalStorage(conversation);
      return conversation;
    }

    try {
      const conversationData: ConversationInsert = {
        title: conversation.title,
        user_id: userId,
        farm_id: conversation.farmId || null,
        topic_category: conversation.topicCategory || null,
        summary: conversation.summary || null,
        last_message_at: conversation.lastMessageAt?.toISOString() || new Date().toISOString(),
        message_count: conversation.messages.length,
        context_tags: conversation.contextTags || null,
        updated_at: new Date().toISOString(),
      };

      // Check if conversation exists (ignore timestamp-based IDs like 1756710035015)
      const existingId = parseInt(conversation.id);
      const isTimestampId = conversation.id.length > 10; // Timestamp IDs are much longer
      let conversationId: number;

      if (!isNaN(existingId) && !isTimestampId) {
        // Update existing conversation
        const { error } = await this.supabase
          .from('ai_conversations')
          .update(conversationData)
          .eq('id', existingId)
          .eq('user_id', userId);

        if (error) throw error;
        conversationId = existingId;
      } else {
        // Insert new conversation (including timestamp-based IDs)
        const { data, error } = await this.supabase
          .from('ai_conversations')
          .insert(conversationData)
          .select('id')
          .single();

        if (error) throw error;
        conversationId = data.id;
      }

      // Save messages
      await this.saveMessages(conversationId, conversation.messages);

      // Return the conversation with the correct database ID
      return {
        ...conversation,
        id: conversationId.toString()
      };

    } catch (error) {
      console.error('Error saving conversation:', error);
      // Fallback to localStorage on error
      this.saveToLocalStorage(conversation);
      return conversation;
    }
  }

  /**
   * Delete a conversation
   */
  async deleteConversation(conversationId: string, userId?: string): Promise<void> {
    if (!userId) {
      // Fallback to localStorage
      return;
    }

    try {
      const id = parseInt(conversationId);
      if (isNaN(id)) return;

      const { error } = await this.supabase
        .from('ai_conversations')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting conversation:', error);
    }
  }

  /**
   * Get a specific conversation by ID
   */
  async getConversation(conversationId: string, userId?: string): Promise<Conversation | null> {
    if (!userId) {
      return null;
    }

    try {
      const id = parseInt(conversationId);
      if (isNaN(id)) return null;

      const { data, error } = await this.supabase
        .from('ai_conversations')
        .select(`
          *,
          ai_messages (*)
        `)
        .eq('id', id)
        .eq('user_id', userId)
        .single();

      if (error || !data) return null;

      return this.mapToConversation(data);
    } catch (error) {
      console.error('Error getting conversation:', error);
      return null;
    }
  }

  /**
   * Create a conversation title from the first user message
   */
  generateTitle(messages: Message[]): string {
    const firstUserMessage = messages.find(m => m.role === 'user');
    if (!firstUserMessage) return 'New Conversation';
    
    const title = firstUserMessage.content
      .replace(/\n/g, ' ')
      .trim()
      .slice(0, 50);
    
    return title.length === 50 ? title + '...' : title;
  }

  /**
   * Export conversations as JSON
   */
  async exportConversations(userId?: string): Promise<string> {
    const conversations = await this.loadConversations(userId);
    return JSON.stringify(conversations, null, 2);
  }

  /**
   * Clear all conversations for a user
   */
  async clearAllConversations(userId?: string): Promise<void> {
    if (!userId) {
      localStorage.removeItem('ai_conversations');
      return;
    }

    try {
      const { error } = await this.supabase
        .from('ai_conversations')
        .delete()
        .eq('user_id', userId);

      if (error) throw error;
    } catch (error) {
      console.error('Error clearing conversations:', error);
    }
  }

  /**
   * Search conversations by content
   */
  async searchConversations(query: string, userId?: string, farmId?: number): Promise<Conversation[]> {
    if (!userId) return [];

    try {
      let dbQuery = this.supabase
        .from('ai_conversations')
        .select(`
          *,
          ai_messages (*)
        `)
        .eq('user_id', userId)
        .or(`title.ilike.%${query}%,summary.ilike.%${query}%`)
        .order('updated_at', { ascending: false });

      if (farmId) {
        dbQuery = dbQuery.eq('farm_id', farmId);
      }

      const { data, error } = await dbQuery;

      if (error) {
        console.error('Error searching conversations:', error);
        return [];
      }

      return data?.map(this.mapToConversation) || [];
    } catch (error) {
      console.error('Error searching conversations:', error);
      return [];
    }
  }

  /**
   * Migrate data from localStorage to Supabase (one-time operation)
   */
  async migrateFromLocalStorage(userId: string): Promise<void> {
    const localConversations = this.loadFromLocalStorage();
    
    if (localConversations.length === 0) return;

    console.log(`Migrating ${localConversations.length} conversations from localStorage to Supabase...`);

    for (const conversation of localConversations) {
      try {
        await this.saveConversation(conversation, userId);
      } catch (error) {
        console.error('Error migrating conversation:', error);
      }
    }

    // Clear localStorage after successful migration
    localStorage.removeItem('ai_conversations');
    console.log('Migration completed successfully');
  }

  // Private helper methods

  private async saveMessages(conversationId: number, messages: Message[]): Promise<void> {
    // Delete existing messages
    await this.supabase
      .from('ai_messages')
      .delete()
      .eq('conversation_id', conversationId);

    // Insert new messages
    const messageInserts: MessageInsert[] = messages.map(msg => ({
      conversation_id: conversationId,
      role: msg.role,
      content: msg.content,
      context_data: {
        language: msg.language,
        attachments: msg.attachments,
        queryType: msg.context?.queryType,
        confidence: msg.context?.confidence,
        relatedTopics: msg.context?.relatedTopics,
      },
      farm_references: msg.context?.farmReferences,
      confidence_score: msg.context?.confidence,
      token_count: msg.context?.tokenCount,
      processing_time: msg.context?.processingTime,
      created_at: msg.timestamp.toISOString(),
    }));

    if (messageInserts.length > 0) {
      const { error } = await this.supabase
        .from('ai_messages')
        .insert(messageInserts);

      if (error) throw error;
    }
  }

  private mapToConversation(data: any): Conversation {
    const messages: Message[] = (data.ai_messages || []).map((msg: any) => ({
      id: msg.id.toString(),
      content: msg.content,
      role: msg.role,
      timestamp: new Date(msg.created_at),
      language: msg.context_data?.language,
      attachments: msg.context_data?.attachments,
      context: {
        queryType: msg.context_data?.queryType,
        confidence: msg.confidence_score,
        relatedTopics: msg.context_data?.relatedTopics,
        farmReferences: msg.farm_references,
        tokenCount: msg.token_count,
        processingTime: msg.processing_time,
      },
    }));

    return {
      id: data.id.toString(),
      title: data.title,
      messages,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
      userId: data.user_id,
      farmId: data.farm_id,
      topicCategory: data.topic_category,
      summary: data.summary,
      lastMessageAt: data.last_message_at ? new Date(data.last_message_at) : undefined,
      messageCount: data.message_count,
      contextTags: data.context_tags,
    };
  }

  private loadFromLocalStorage(): Conversation[] {
    if (typeof window === 'undefined') return [];
    
    try {
      const stored = localStorage.getItem('ai_conversations');
      if (!stored) return [];
      
      const conversations = JSON.parse(stored);
      
      return conversations.map((conv: any) => ({
        ...conv,
        createdAt: new Date(conv.createdAt),
        updatedAt: new Date(conv.updatedAt),
        messages: conv.messages.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }))
      }));
    } catch (error) {
      console.error('Error loading from localStorage:', error);
      return [];
    }
  }

  private saveToLocalStorage(conversation: Conversation): void {
    if (typeof window === 'undefined') return;
    
    try {
      const conversations = this.loadFromLocalStorage();
      const existingIndex = conversations.findIndex(c => c.id === conversation.id);
      
      const updatedConversation = {
        ...conversation,
        updatedAt: new Date()
      };
      
      if (existingIndex >= 0) {
        conversations[existingIndex] = updatedConversation;
      } else {
        conversations.push(updatedConversation);
      }
      
      // Limit to 50 conversations
      const limited = conversations
        .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
        .slice(0, 50);
      
      localStorage.setItem('ai_conversations', JSON.stringify(limited));
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  }
}

export const supabaseConversationStorage = new SupabaseConversationStorage();