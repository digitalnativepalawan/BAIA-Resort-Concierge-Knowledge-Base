import { useEffect } from 'react';
import { conversationService } from '../services/conversationService';
import { knowledgeService } from '../services/knowledgeService';
import { requestService } from '../services/requestService';
import { ChatMessage, KnowledgeFile, GuestRequest } from '../types';

interface RealtimeOptions {
  onMessagesUpdate?: (messages: ChatMessage[]) => void;
  onDocsUpdate?: (docs: KnowledgeFile[]) => void;
  onRequestsUpdate?: (requests: GuestRequest[]) => void;
}

export function useSupabaseRealtime({
  onMessagesUpdate,
  onDocsUpdate,
  onRequestsUpdate,
}: RealtimeOptions) {
  useEffect(() => {
    let unsubChat: (() => void) | undefined;
    let unsubDocs: (() => void) | undefined;
    let unsubRequests: (() => void) | undefined;

    if (onMessagesUpdate) {
      unsubChat = conversationService.listenChatMessages((msgs) => {
        if (msgs && msgs.length > 0) onMessagesUpdate(msgs);
      });
    }

    if (onDocsUpdate) {
      unsubDocs = knowledgeService.listenDocs((docs) => {
        if (docs && docs.length > 0) onDocsUpdate(docs);
      });
    }

    if (onRequestsUpdate) {
      unsubRequests = requestService.listenRequests((reqs) => {
        if (reqs && reqs.length > 0) onRequestsUpdate(reqs);
      });
    }

    return () => {
      if (unsubChat) unsubChat();
      if (unsubDocs) unsubDocs();
      if (unsubRequests) unsubRequests();
    };
  }, [onMessagesUpdate, onDocsUpdate, onRequestsUpdate]);
}
