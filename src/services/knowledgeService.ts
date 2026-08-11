import { KnowledgeFile } from '../types';
import { supabase, isSupabaseConfigured, localCache } from '../lib/supabase';

const KNOWLEDGE_TABLE = 'knowledge_documents';

export const knowledgeService = {
  saveDoc: async (file: KnowledgeFile): Promise<void> => {
    // Cache locally
    const existing = localCache.get<KnowledgeFile[]>('knowledge_docs', []);
    const updated = [file, ...existing.filter((f) => f.id !== file.id)];
    localCache.set('knowledge_docs', updated);

    if (isSupabaseConfigured()) {
      try {
        await supabase.from(KNOWLEDGE_TABLE).insert({
          title: file.name,
          category: file.category || 'Other',
          content: file.content,
          created_at: new Date().toISOString(),
        });
      } catch (e) {
        console.warn('Supabase save knowledge notice:', e);
      }
    }
  },

  deleteDoc: async (fileId: string): Promise<void> => {
    const existing = localCache.get<KnowledgeFile[]>('knowledge_docs', []);
    const updated = existing.filter((f) => f.id !== fileId);
    localCache.set('knowledge_docs', updated);

    if (isSupabaseConfigured()) {
      try {
        await supabase.from(KNOWLEDGE_TABLE).delete().eq('id', fileId);
      } catch (e) {
        console.warn('Failed to delete doc in Supabase:', e);
      }
    }
  },

  listenDocs: (callback: (docs: KnowledgeFile[]) => void) => {
    const cached = localCache.get<KnowledgeFile[]>('knowledge_docs', []);
    if (cached.length > 0) {
      callback(cached);
    }

    if (!isSupabaseConfigured()) {
      return () => {};
    }

    const fetchDocs = async () => {
      const { data, error } = await supabase
        .from(KNOWLEDGE_TABLE)
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        const docs: KnowledgeFile[] = data.map((item) => ({
          id: item.id,
          name: item.title || 'Untitled Doc',
          size: item.content?.length || 0,
          type: 'text/plain',
          content: item.content || '',
          uploadedAt: new Date(item.created_at).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          }),
          category: item.category || 'Property',
        }));
        localCache.set('knowledge_docs', docs);
        callback(docs);
      }
    };

    fetchDocs();

    const channel = supabase
      .channel('public:knowledge_documents')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: KNOWLEDGE_TABLE },
        () => {
          fetchDocs();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },

  /**
   * Fast local RAG search index over extensive knowledge base files.
   * Performs sub-millisecond keyword relevance scoring and returns exact snippets
   * so responses can be synthesized cleanly without massive network overhead over weak Wi-Fi.
   */
  searchKnowledge: (query: string, maxSnippets = 3): string => {
    if (!query || !query.trim()) return '';

    let docs: KnowledgeFile[] = localCache.get<KnowledgeFile[]>('knowledge_docs', []);
    if (!docs || docs.length === 0) {
      try {
        const saved = localStorage.getItem('tala_knowledge_files');
        if (saved) docs = JSON.parse(saved);
      } catch (e) {}
    }

    if (!docs || docs.length === 0) return '';

    const queryTerms = query
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .split(/\s+/)
      .filter((t) => t.length > 2);

    if (queryTerms.length === 0) return '';

    interface ScoredSnippet {
      docName: string;
      category: string;
      snippet: string;
      score: number;
    }

    const scoredSnippets: ScoredSnippet[] = [];

    docs.forEach((doc) => {
      if (!doc.content) return;
      // Split document into paragraphs or sections
      const paragraphs = doc.content.split(/\n\n+/);

      paragraphs.forEach((p) => {
        const cleanP = p.trim();
        if (cleanP.length < 10) return;
        const lowerP = cleanP.toLowerCase();

        let score = 0;
        queryTerms.forEach((term) => {
          if (lowerP.includes(term)) {
            score += 3;
            // Bonus if term appears multiple times
            const occurrences = (lowerP.match(new RegExp(term, 'g')) || []).length;
            score += occurrences;
          }
        });

        // Category match bonus
        if (doc.category && query.toLowerCase().includes(doc.category.toLowerCase())) {
          score += 4;
        }

        if (score > 0) {
          scoredSnippets.push({
            docName: doc.name,
            category: doc.category || 'Resort Information',
            snippet: cleanP,
            score,
          });
        }
      });
    });

    // Sort by relevance score descending
    scoredSnippets.sort((a, b) => b.score - a.score);

    const topSnippets = scoredSnippets.slice(0, maxSnippets);
    if (topSnippets.length === 0) return '';

    return topSnippets
      .map((s) => `[Source: ${s.docName} (${s.category})]:\n${s.snippet}`)
      .join('\n\n');
  },
};

