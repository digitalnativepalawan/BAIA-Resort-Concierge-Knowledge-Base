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
};
