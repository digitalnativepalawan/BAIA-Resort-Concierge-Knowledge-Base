import { KnowledgeFile } from '../types';
import { saveKnowledgeDoc, deleteKnowledgeDoc, listenKnowledgeDocs } from '../lib/firebase';

export const knowledgeService = {
  saveDoc: async (userId: string, file: KnowledgeFile) => {
    return saveKnowledgeDoc(userId, file);
  },
  deleteDoc: async (userId: string, fileId: string) => {
    return deleteKnowledgeDoc(userId, fileId);
  },
  listenDocs: (userId: string, callback: (docs: KnowledgeFile[]) => void) => {
    return listenKnowledgeDocs(userId, callback);
  }
};
