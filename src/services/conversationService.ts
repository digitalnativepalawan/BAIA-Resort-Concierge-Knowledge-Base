import { ChatMessage, ConversationSession } from '../types';
import { pb } from '../lib/pocketbase';

const MESSAGES_COLLECTION = 'messages';
const CONVERSATIONS_COLLECTION = 'conversations';

export const conversationService = {
  saveChatMessage: async (message: ChatMessage, conversationId = 'default_guest_session'): Promise<void> => {
    try {
      if (pb.authStore.isValid || true) { // Allow guest saves if collection rules permit or via backend
        try {
          await pb.collection(MESSAGES_COLLECTION).create({
            role: message.role,
            content: message.text,
            agent_id: 'tala-concierge',
            timestamp: message.timestamp,
            conversation: conversationId
          });
        } catch (err) {
          console.warn('PocketBase save message notice:', err);
        }
      }
    } catch (e) {
      console.warn('Failed to save message to PocketBase:', e);
    }
  },

  listenChatMessages: (callback: (messages: ChatMessage[]) => void, conversationId = 'default_guest_session') => {
    try {
      // Fetch initial list
      pb.collection(MESSAGES_COLLECTION)
        .getList(1, 100, {
          sort: 'created',
          filter: `conversation = "${conversationId}"`
        })
        .then((res) => {
          if (res.items.length > 0) {
            const formatted: ChatMessage[] = res.items.map((item) => ({
              id: item.id,
              role: item.role as 'user' | 'model',
              text: item.content,
              timestamp: item.timestamp || new Date(item.created).toLocaleTimeString('en-US', { hour12: false })
            }));
            callback(formatted);
          }
        })
        .catch(() => {});

      // Subscribe to real-time additions
      let unsubscribeFn: (() => void) | null = null;
      pb.collection(MESSAGES_COLLECTION)
        .subscribe('*', (e) => {
          if (e.action === 'create') {
            const newMsg: ChatMessage = {
              id: e.record.id,
              role: e.record.role as 'user' | 'model',
              text: e.record.content,
              timestamp: e.record.timestamp || new Date(e.record.created).toLocaleTimeString('en-US', { hour12: false })
            };
            callback([newMsg]);
          }
        })
        .then((unsub) => {
          unsubscribeFn = unsub;
        })
        .catch(() => {});

      return () => {
        if (unsubscribeFn) unsubscribeFn();
        pb.collection(MESSAGES_COLLECTION).unsubscribe('*').catch(() => {});
      };
    } catch (e) {
      return () => {};
    }
  },

  formatMessagesToSessions: (messages: ChatMessage[], guestLabel = 'Guest (Main Villa)'): ConversationSession[] => {
    if (!messages || messages.length === 0) return [];

    const lastMsg = messages[messages.length - 1];
    const needsStaff = messages.some(
      (m) =>
        m.text.toLowerCase().includes('staff') ||
        m.text.toLowerCase().includes('reception') ||
        m.text.toLowerCase().includes('manager') ||
        m.text.toLowerCase().includes('help')
    );

    return [
      {
        id: 'session-main-guest',
        guestLabel,
        room: 'Villa 101',
        lastMessage: lastMsg.text,
        lastTimestamp: lastMsg.timestamp,
        status: needsStaff ? 'needs_staff' : 'active',
        messageCount: messages.length,
        messages
      }
    ];
  }
};
