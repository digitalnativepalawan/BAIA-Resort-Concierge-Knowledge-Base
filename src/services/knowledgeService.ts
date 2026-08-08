import { KnowledgeFile } from '../types';
import { pb } from '../lib/pocketbase';

const KNOWLEDGE_COLLECTION = 'knowledge_documents';

export const knowledgeService = {
  saveDoc: async (file: KnowledgeFile): Promise<void> => {
    try {
      if (pb.authStore.isValid || true) {
        try {
          await pb.collection(KNOWLEDGE_COLLECTION).create({
            title: file.name,
            category: file.category || 'Other',
            content: file.content,
            source_type: file.type || 'text',
            active: true
          });
        } catch (e) {
          console.warn('PocketBase save knowledge notice:', e);
        }
      }
    } catch (e) {
      console.warn('Failed to save doc to PocketBase:', e);
    }
  },

  deleteDoc: async (fileId: string): Promise<void> => {
    try {
      if (pb.authStore.isValid) {
        await pb.collection(KNOWLEDGE_COLLECTION).delete(fileId);
      }
    } catch (e) {
      console.warn('Failed to delete doc in PocketBase:', e);
    }
  },

  listenDocs: (callback: (docs: KnowledgeFile[]) => void) => {
    try {
      pb.collection(KNOWLEDGE_COLLECTION)
        .getList(1, 50, { sort: '-created' })
        .then((res) => {
          if (res.items.length > 0) {
            const docs: KnowledgeFile[] = res.items.map((item) => ({
              id: item.id,
              name: item.title || 'Untitled Doc',
              size: item.content?.length || 0,
              type: item.source_type || 'text/plain',
              content: item.content || '',
              uploadedAt: new Date(item.created).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
              category: item.category || 'Property'
            }));
            callback(docs);
          }
        })
        .catch(() => {});

      let unsubscribeFn: (() => void) | null = null;
      pb.collection(KNOWLEDGE_COLLECTION)
        .subscribe('*', () => {
          pb.collection(KNOWLEDGE_COLLECTION)
            .getList(1, 50, { sort: '-created' })
            .then((res) => {
              const docs: KnowledgeFile[] = res.items.map((item) => ({
                id: item.id,
                name: item.title || 'Untitled Doc',
                size: item.content?.length || 0,
                type: item.source_type || 'text/plain',
                content: item.content || '',
                uploadedAt: new Date(item.created).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
                category: item.category || 'Property'
              }));
              callback(docs);
            })
            .catch(() => {});
        })
        .then((unsub) => {
          unsubscribeFn = unsub;
        })
        .catch(() => {});

      return () => {
        if (unsubscribeFn) unsubscribeFn();
        pb.collection(KNOWLEDGE_COLLECTION).unsubscribe('*').catch(() => {});
      };
    } catch (e) {
      return () => {};
    }
  }
};
