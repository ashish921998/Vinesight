-- Voice Assistant Hybrid - Add conversation tracking and source tracking to log tables
-- This migration adds support for tracking which records were created via voice assistant

-- First, ensure ai_conversations table exists
CREATE TABLE IF NOT EXISTS ai_conversations (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  farm_id INTEGER REFERENCES farms(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  topic_category TEXT,
  summary TEXT,
  context_tags JSONB,
  message_count INTEGER DEFAULT 0,
  last_message_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on ai_conversations
ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for ai_conversations
CREATE POLICY "Users can view their own conversations"
  ON ai_conversations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own conversations"
  ON ai_conversations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own conversations"
  ON ai_conversations FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own conversations"
  ON ai_conversations FOR DELETE
  USING (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_ai_conversations_user_id ON ai_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_farm_id ON ai_conversations(farm_id);

-- Add comment for documentation
COMMENT ON TABLE ai_conversations IS 'Stores voice assistant conversations for context tracking';

-- Create RPC function for atomic message count increment
CREATE OR REPLACE FUNCTION increment_conversation_message_count(conversation_id BIGINT)
RETURNS void AS $$
BEGIN
  UPDATE ai_conversations
  SET
    message_count = message_count + 1,
    last_message_at = NOW(),
    updated_at = NOW()
  WHERE id = conversation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION increment_conversation_message_count(BIGINT) TO authenticated;

-- Now add conversation_id to link records with AI conversations
ALTER TABLE irrigation_records
ADD COLUMN conversation_id INTEGER REFERENCES ai_conversations(id) ON DELETE SET NULL;

ALTER TABLE spray_records
ADD COLUMN conversation_id INTEGER REFERENCES ai_conversations(id) ON DELETE SET NULL;

ALTER TABLE fertigation_records
ADD COLUMN conversation_id INTEGER REFERENCES ai_conversations(id) ON DELETE SET NULL;

ALTER TABLE harvest_records
ADD COLUMN conversation_id INTEGER REFERENCES ai_conversations(id) ON DELETE SET NULL;

-- Add created_via column to track how the record was created
ALTER TABLE irrigation_records
ADD COLUMN created_via VARCHAR(50) DEFAULT 'web' CHECK (created_via IN ('web', 'mobile', 'voice_assistant', 'api'));

ALTER TABLE spray_records
ADD COLUMN created_via VARCHAR(50) DEFAULT 'web' CHECK (created_via IN ('web', 'mobile', 'voice_assistant', 'api'));

ALTER TABLE fertigation_records
ADD COLUMN created_via VARCHAR(50) DEFAULT 'web' CHECK (created_via IN ('web', 'mobile', 'voice_assistant', 'api'));

ALTER TABLE harvest_records
ADD COLUMN created_via VARCHAR(50) DEFAULT 'web' CHECK (created_via IN ('web', 'mobile', 'voice_assistant', 'api'));

-- Add voice_command_transcript for debugging and improvement
ALTER TABLE irrigation_records
ADD COLUMN voice_command_transcript TEXT;

ALTER TABLE spray_records
ADD COLUMN voice_command_transcript TEXT;

ALTER TABLE fertigation_records
ADD COLUMN voice_command_transcript TEXT;

ALTER TABLE harvest_records
ADD COLUMN voice_command_transcript TEXT;

-- Add processing_confidence to track AI confidence in voice recognition
ALTER TABLE irrigation_records
ADD COLUMN processing_confidence DECIMAL(3,2) DEFAULT 1.0 CHECK (processing_confidence >= 0 AND processing_confidence <= 1);

ALTER TABLE spray_records
ADD COLUMN processing_confidence DECIMAL(3,2) DEFAULT 1.0 CHECK (processing_confidence >= 0 AND processing_confidence <= 1);

ALTER TABLE fertigation_records
ADD COLUMN processing_confidence DECIMAL(3,2) DEFAULT 1.0 CHECK (processing_confidence >= 0 AND processing_confidence <= 1);

ALTER TABLE harvest_records
ADD COLUMN processing_confidence DECIMAL(3,2) DEFAULT 1.0 CHECK (processing_confidence >= 0 AND processing_confidence <= 1);

-- Create indexes for better query performance
CREATE INDEX idx_irrigation_records_conversation_id ON irrigation_records(conversation_id);
CREATE INDEX idx_irrigation_records_created_via ON irrigation_records(created_via);

CREATE INDEX idx_spray_records_conversation_id ON spray_records(conversation_id);
CREATE INDEX idx_spray_records_created_via ON spray_records(created_via);

CREATE INDEX idx_fertigation_records_conversation_id ON fertigation_records(conversation_id);
CREATE INDEX idx_fertigation_records_created_via ON fertigation_records(created_via);

CREATE INDEX idx_harvest_records_conversation_id ON harvest_records(conversation_id);
CREATE INDEX idx_harvest_records_created_via ON harvest_records(created_via);

-- Add comment for documentation
COMMENT ON COLUMN irrigation_records.conversation_id IS 'Links to AI conversation if created via voice assistant';
COMMENT ON COLUMN irrigation_records.created_via IS 'How the record was created: web, mobile, voice_assistant, or api';
COMMENT ON COLUMN irrigation_records.voice_command_transcript IS 'Original voice command transcript for debugging';
COMMENT ON COLUMN irrigation_records.processing_confidence IS 'AI confidence score (0-1) for voice recognition accuracy';
