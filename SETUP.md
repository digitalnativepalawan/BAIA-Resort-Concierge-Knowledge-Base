# TALA AI Concierge — Lovable + Supabase Setup Guide

This repository is fully prepared for drop-in deployment to **Lovable** and **Supabase**. All server endpoints have been converted to Supabase Edge Functions, and database policies are governed by Row Level Security (RLS).

---

## Step 1: Run Database Migration

Apply the initial migration file `supabase/migrations/0001_init.sql` to your Supabase project.

Using the Supabase CLI:
```bash
supabase db push
```
*(Or execute the contents of `supabase/migrations/0001_init.sql` directly inside the Supabase SQL Editor).*

### Table & RLS Policy Summary
1. **`messages`**: Public `INSERT` (guests can send chat messages), Authenticated `SELECT` (admin/staff chat logs).
2. **`knowledge_documents`**: Public `SELECT` (concierge RAG retrieval), Authenticated `INSERT/UPDATE/DELETE` (admin knowledge base management).
3. **`guest_requests`**: Public `INSERT` (guests submit amenity requests), Authenticated `SELECT/UPDATE/DELETE` (admin request management).
4. **`settings`**: Public `SELECT` (widget configuration), Authenticated `INSERT/UPDATE` (admin settings management).

---

## Step 2: Set Supabase Secrets

Store your OpenRouter API Key as a secure secret inside your Supabase Edge Functions environment:

```bash
supabase secrets set OPENROUTER_API_KEY=your_openrouter_api_key_here
```

---

## Step 3: Deploy Supabase Edge Functions

Deploy the two edge functions located in `supabase/functions/`:

```bash
supabase functions deploy tala-chat
supabase functions deploy tala-models
```

---

## Step 4: Configure Lovable Client Environment Variables

In your Lovable project settings (or `.env` file), add the following client environment variables:

```env
VITE_SUPABASE_URL="https://<your-project-ref>.supabase.co"
VITE_SUPABASE_ANON_KEY="<your-supabase-anon-key>"
```

---

## Architecture Summary

- **Frontend**: Vite + React SPA (Speech recognition & browser WebSpeech synthesis enabled).
- **Backend**: Supabase Edge Functions (`tala-chat`, `tala-models`).
- **Database**: PostgreSQL with `pgvector` enabled for knowledge base RAG embeddings.
- **Authentication**: Supabase Auth (Admin/Staff users).
