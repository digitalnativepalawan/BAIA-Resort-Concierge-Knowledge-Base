-- =======================================================
-- TALA AI CONCIERGE - SUPABASE INITIAL MIGRATION
-- Migration File: supabase/migrations/0001_init.sql
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

-- 1. MESSAGES POLICIES
-- Guests (public/anon) can INSERT messages into chat
CREATE POLICY "Public insert messages" 
    ON public.messages FOR INSERT 
    WITH CHECK (true);

-- Only authenticated users (Admins) can SELECT message logs
CREATE POLICY "Authenticated select messages" 
    ON public.messages FOR SELECT 
    USING (auth.role() = 'authenticated');

-- 2. KNOWLEDGE DOCUMENTS POLICIES
-- Public can SELECT knowledge docs for concierge client RAG retrieval
CREATE POLICY "Public read knowledge docs" 
    ON public.knowledge_documents FOR SELECT 
    USING (true);

-- Only authenticated users (Admins) can INSERT knowledge docs
CREATE POLICY "Authenticated insert knowledge docs" 
    ON public.knowledge_documents FOR INSERT 
    WITH CHECK (auth.role() = 'authenticated');

-- Only authenticated users (Admins) can UPDATE knowledge docs
CREATE POLICY "Authenticated update knowledge docs" 
    ON public.knowledge_documents FOR UPDATE 
    USING (auth.role() = 'authenticated');

-- Only authenticated users (Admins) can DELETE knowledge docs
CREATE POLICY "Authenticated delete knowledge docs" 
    ON public.knowledge_documents FOR DELETE 
    USING (auth.role() = 'authenticated');

-- 3. GUEST REQUESTS POLICIES
-- Guests (public/anon) can file requests
CREATE POLICY "Public insert guest requests" 
    ON public.guest_requests FOR INSERT 
    WITH CHECK (true);

-- Only authenticated users (Admins) can SELECT guest requests
CREATE POLICY "Authenticated select guest requests" 
    ON public.guest_requests FOR SELECT 
    USING (auth.role() = 'authenticated');

-- Only authenticated users (Admins) can UPDATE guest requests
CREATE POLICY "Authenticated update guest requests" 
    ON public.guest_requests FOR UPDATE 
    USING (auth.role() = 'authenticated');

-- Only authenticated users (Admins) can DELETE guest requests
CREATE POLICY "Authenticated delete guest requests" 
    ON public.guest_requests FOR DELETE 
    USING (auth.role() = 'authenticated');

-- 4. SETTINGS POLICIES
-- Public can SELECT settings needed by the widget client-side
CREATE POLICY "Public read settings" 
    ON public.settings FOR SELECT 
    USING (true);

-- Only authenticated users (Admins) can INSERT settings
CREATE POLICY "Authenticated insert settings" 
    ON public.settings FOR INSERT 
    WITH CHECK (auth.role() = 'authenticated');

-- Only authenticated users (Admins) can UPDATE settings
CREATE POLICY "Authenticated update settings" 
    ON public.settings FOR UPDATE 
    USING (auth.role() = 'authenticated');

-- =======================================================
-- INDEXES
-- =======================================================
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at ASC);
CREATE INDEX IF NOT EXISTS idx_guest_requests_created_at ON public.guest_requests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_knowledge_created_at ON public.knowledge_documents(created_at DESC);
