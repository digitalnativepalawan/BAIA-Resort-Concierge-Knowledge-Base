-- =======================================================
-- TALA AI CONCIERGE - SUPABASE DATABASE & RAG SCHEMA MIGRATION
-- Paste this script directly into the Supabase SQL Editor.
-- =======================================================

-- Enable pgvector extension for RAG knowledge embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- 1. MESSAGES TABLE
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content TEXT NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'model', 'assistant', 'system')),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 2. KNOWLEDGE DOCUMENTS TABLE (RAG Enabled)
CREATE TABLE IF NOT EXISTS public.knowledge_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    category VARCHAR(100) DEFAULT 'Property',
    content TEXT NOT NULL,
    embedding VECTOR(1536), -- Vector representation for RAG retrieval
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 3. GUEST REQUESTS TABLE
CREATE TABLE IF NOT EXISTS public.guest_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    guest_name VARCHAR(255) NOT NULL,
    room_number VARCHAR(50) DEFAULT 'Villa 101',
    request_type VARCHAR(100) NOT NULL,
    status VARCHAR(50) DEFAULT 'new' CHECK (status IN ('new', 'in_progress', 'needs_staff', 'completed')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 4. SETTINGS TABLE
CREATE TABLE IF NOT EXISTS public.settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key VARCHAR(100) UNIQUE NOT NULL,
    value JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- =======================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =======================================================

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guest_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- Allow public read and write access for Concierge guest features & admin sync
CREATE POLICY "Public Read Messages" ON public.messages FOR SELECT USING (true);
CREATE POLICY "Public Insert Messages" ON public.messages FOR INSERT WITH CHECK (true);

CREATE POLICY "Public Read Knowledge Docs" ON public.knowledge_documents FOR SELECT USING (true);
CREATE POLICY "Public Insert Knowledge Docs" ON public.knowledge_documents FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Delete Knowledge Docs" ON public.knowledge_documents FOR DELETE USING (true);

CREATE POLICY "Public Read Guest Requests" ON public.guest_requests FOR SELECT USING (true);
CREATE POLICY "Public Insert Guest Requests" ON public.guest_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Update Guest Requests" ON public.guest_requests FOR UPDATE USING (true);
CREATE POLICY "Public Delete Guest Requests" ON public.guest_requests FOR DELETE USING (true);

CREATE POLICY "Public Read Settings" ON public.settings FOR SELECT USING (true);
CREATE POLICY "Public Insert Settings" ON public.settings FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Update Settings" ON public.settings FOR UPDATE USING (true);

-- Indexes for rapid time-series and query lookups
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at ASC);
CREATE INDEX IF NOT EXISTS idx_guest_requests_created_at ON public.guest_requests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_knowledge_created_at ON public.knowledge_documents(created_at DESC);
