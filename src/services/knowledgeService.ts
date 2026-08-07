import { KnowledgeFile } from '../types';
import { pb } from '../lib/pocketbase';

export const knowledgeService = {
  saveDoc: async (userId: string, file: KnowledgeFile) => {
    try {
      await pb.collection('knowledge_documents').create({
        title: file.name,
        category: file.category || 'Other',
        content: file.content,
        source_type: 'file',
        active: true
      });
    } catch (err) {
      console.warn('PocketBase: Failed to save knowledge doc:', err);
    }
  },

  deleteDoc: async (userId: string, fileId: string) => {
    try {
      await pb.collection('knowledge_documents').delete(fileId);
    } catch (err) {
      console.warn('PocketBase: Failed to delete knowledge doc:', err);
    }
  },

  listDocs: async (): Promise<KnowledgeFile[]> => {
    try {
      const records = await pb.collection('knowledge_documents').getFullList({
        sort: '-created'
      });
      return records.map((r: any) => ({
        id: r.id,
        name: r.title || 'Untitled',
        size: (r.content || '').length,
        content: r.content || '',
        type: r.source_type || 'text',
        uploadedAt: new Date(r.created).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        category: r.category || 'Other'
      }));
    } catch (err) {
      console.warn('PocketBase: Failed to list knowledge docs:', err);
      return [];
    }
  },

  listenDocs: (userId: string, callback: (docs: KnowledgeFile[]) => void) => {
    let active = true;

    const load = async () => {
      if (!active) return;
      try {
        const docs = await knowledgeService.listDocs();
        if (active) callback(docs);
      } catch (err) {
        console.warn('PocketBase: listenDocs load failed:', err);
      }
    };

    load();

    const setupSubscription = async () => {
      try {
        await pb.collection('knowledge_documents').subscribe('*', (event: any) => {
          if (active) load();
        });
      } catch (err) {
        console.warn('PocketBase: listenDocs subscription failed:', err);
      }
    };

    setupSubscription();

    return () => {
      active = false;
      pb.collection('knowledge_documents').unsubscribe('*');
    };
  }
};
