-- Voice Assistant Hybrid - Add conversation tracking and source tracking to log tables
-- This migration adds support for tracking which records were created via voice assistant

-- Add conversation_id to link records with AI conversations
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
