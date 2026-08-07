import { ChatMessage, ConversationSession } from '../types';
import { pb } from '../lib/pocketbase';

const GUEST_CONVERSATION_KEY = 'tala_guest_conversation_id';

function getGuestConversationId(): string | null {
  try {
    return localStorage.getItem(GUEST_CONVERSATION_KEY);
  } catch {
    return null;
  }
}

function setGuestConversationId(id: string) {
  try {
    localStorage.setItem(GUEST_CONVERSATION_KEY, id);
  } catch {}
}

export const conversationService = {
  ensureGuestConversation: async (guestLabel?: string, room?: string): Promise<string> => {
    const existingId = getGuestConversationId();
    if (existingId) {
      try {
        await pb.collection('conversations').getOne(existingId);
        return existingId;
      } catch {
        // Record deleted, create new
        localStorage.removeItem(GUEST_CONVERSATION_KEY);
      }
    }

    try {
      const record = await pb.collection('conversations').create({
        guest_label: guestLabel || 'Guest',
        room: room || 'Main Villa',
        status: 'active'
      });
      setGuestConversationId(record.id);
      return record.id;
    } catch (err) {
      console.warn('PocketBase: Failed to create guest conversation:', err);
      throw err;
    }
  },

  saveChatMessage: async (conversationId: string, message: ChatMessage) => {
    try {
      await pb.collection('messages').create({
        conversation: conversationId,
        role: message.role === 'model' ? 'assistant' : message.role,
        content: message.text,
        agent_id: 'tala-concierge'
      });
    } catch (err) {
      console.warn('PocketBase: Failed to save chat message:', err);
    }
  },

  getConversationMessages: async (conversationId: string): Promise<ChatMessage[]> => {
    try {
      const records = await pb.collection('messages').getFullList({
        filter: `conversation="${conversationId}"`,
        sort: 'created'
      });

      return records.map((r: any) => ({
        id: r.id,
        role: r.role === 'assistant' ? 'model' : (r.role as 'user' | 'model'),
        text: r.content,
        timestamp: new Date(r.created).toLocaleTimeString('en-US', { hour12: false })
      }));
    } catch (err) {
      console.warn('PocketBase: Failed to get conversation messages:', err);
      return [];
    }
  },

  getAllConversations: async (): Promise<ConversationSession[]> => {
    try {
      const records = await pb.collection('conversations').getFullList({
        sort: '-created'
      });

      const sessions: ConversationSession[] = [];
      for (const record of records) {
        let messages: ChatMessage[] = [];
        try {
          const msgRecords = await pb.collection('messages').getFullList({
            filter: `conversation="${record.id}"`,
            sort: 'created'
          });
          messages = msgRecords.map((r: any) => ({
            id: r.id,
            role: r.role === 'assistant' ? 'model' : (r.role as 'user' | 'model'),
            text: r.content,
            timestamp: new Date(r.created).toLocaleTimeString('en-US', { hour12: false })
          }));
        } catch {
          // No messages yet
        }

        const lastMsg = messages.length > 0 ? messages[messages.length - 1] : null;

        sessions.push({
          id: record.id,
          guestLabel: record.guest_label || 'Guest',
          room: record.room || 'Main Villa',
          lastMessage: lastMsg ? lastMsg.text : 'No messages yet',
          lastTimestamp: lastMsg ? lastMsg.timestamp : new Date(record.created).toLocaleTimeString('en-US', { hour12: false }),
          status: record.status || 'active',
          messageCount: messages.length,
          messages
        });
      }

      return sessions;
    } catch (err) {
      console.warn('PocketBase: Failed to get conversations:', err);
      return [];
    }
  },

  updateConversationStatus: async (conversationId: string, status: 'active' | 'needs_staff' | 'closed') => {
    try {
      await pb.collection('conversations').update(conversationId, { status });
    } catch (err) {
      console.warn('PocketBase: Failed to update conversation status:', err);
    }
  },

  subscribeToMessages: (conversationId: string, callback: (message: ChatMessage) => void) => {
    let cancelled = false;

    const setup = async () => {
      try {
        await pb.collection('messages').subscribe('*', (event: any) => {
          if (!cancelled && event.action === 'create' && event.record.conversation === conversationId) {
            const msg: ChatMessage = {
              id: event.record.id,
              role: event.record.role === 'assistant' ? 'model' : event.record.role,
              text: event.record.content,
              timestamp: new Date(event.record.created).toLocaleTimeString('en-US', { hour12: false })
            };
            callback(msg);
          }
        });
      } catch (err) {
        console.warn('PocketBase: Failed to subscribe to messages:', err);
      }
    };

    setup();

    return () => {
      cancelled = true;
      pb.collection('messages').unsubscribe('*');
    };
  },

  getConversationId: getGuestConversationId
};
