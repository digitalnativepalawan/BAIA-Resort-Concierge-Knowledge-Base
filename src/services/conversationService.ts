import { ChatMessage, ConversationSession } from '../types';
import { pb } from '../lib/pocketbase';

const GUEST_CONVERSATION_KEY = 'tala_guest_conversation_id';
const GUEST_SESSION_TOKEN_KEY = 'tala_guest_session_token';

function getGuestConversationId(): string | null {
  try {
    return localStorage.getItem(GUEST_CONVERSATION_KEY);
  } catch {
    return null;
  }
}

function getGuestSessionToken(): string | null {
  try {
    return localStorage.getItem(GUEST_SESSION_TOKEN_KEY);
  } catch {
    return null;
  }
}

function setGuestSession(conversationId: string, sessionToken: string) {
  try {
    localStorage.setItem(GUEST_CONVERSATION_KEY, conversationId);
    localStorage.setItem(GUEST_SESSION_TOKEN_KEY, sessionToken);
  } catch {}
}

function clearGuestSession() {
  try {
    localStorage.removeItem(GUEST_CONVERSATION_KEY);
    localStorage.removeItem(GUEST_SESSION_TOKEN_KEY);
  } catch {}
}

export const conversationService = {
  ensureGuestConversation: async (guestLabel?: string, room?: string): Promise<{ conversationId: string; sessionToken: string }> => {
    const existingId = getGuestConversationId();
    const existingToken = getGuestSessionToken();

    if (existingId && existingToken) {
      // Verify token is still valid by attempting to read messages
      try {
        const res = await fetch(`/api/guest/conversations/${existingId}/messages`, {
          headers: { 'X-TALA-SESSION': existingToken }
        });
        if (res.ok) {
          return { conversationId: existingId, sessionToken: existingToken };
        }
      } catch {}
      // Token invalid, clear and recreate
      clearGuestSession();
    }

    try {
      const res = await fetch('/api/guest/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ guest_label: guestLabel || 'Guest', room: room || 'Main Villa' })
      });

      if (!res.ok) {
        throw new Error('Failed to create conversation');
      }

      const data = await res.json();
      setGuestSession(data.conversation_id, data.session_token);
      return { conversationId: data.conversation_id, sessionToken: data.session_token };
    } catch (err) {
      console.warn('Failed to create guest conversation:', err);
      throw err;
    }
  },

  saveChatMessage: async (conversationId: string, sessionToken: string, message: ChatMessage) => {
    try {
      await fetch('/api/guest/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversation_id: conversationId,
          content: message.text,
          session_token: sessionToken
        })
      });
    } catch (err) {
      console.warn('Failed to save chat message:', err);
    }
  },

  getConversationMessages: async (conversationId: string, sessionToken: string): Promise<ChatMessage[]> => {
    try {
      const res = await fetch(`/api/guest/conversations/${conversationId}/messages`, {
        headers: { 'X-TALA-SESSION': sessionToken }
      });

      if (!res.ok) return [];

      const data = await res.json();
      return (data.messages || []).map((m: any) => ({
        id: m.id,
        role: m.role === 'assistant' ? 'model' : m.role,
        text: m.text,
        timestamp: new Date(m.timestamp).toLocaleTimeString('en-US', { hour12: false })
      }));
    } catch (err) {
      console.warn('Failed to get conversation messages:', err);
      return [];
    }
  },

  // Admin access: uses authenticated PocketBase client directly
  getAllConversations: async (): Promise<ConversationSession[]> => {
    if (!pb.authStore.isValid) return [];

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
            role: r.role === 'assistant' ? 'model' : r.role,
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
      console.warn('Failed to get conversations:', err);
      return [];
    }
  },

  updateConversationStatus: async (conversationId: string, status: 'active' | 'needs_staff' | 'closed') => {
    if (!pb.authStore.isValid) return;
    try {
      await pb.collection('conversations').update(conversationId, { status });
    } catch (err) {
      console.warn('Failed to update conversation status:', err);
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
        console.warn('Failed to subscribe to messages:', err);
      }
    };

    setup();

    return () => {
      cancelled = true;
      pb.collection('messages').unsubscribe('*');
    };
  },

  getConversationId: getGuestConversationId,
  getSessionToken: getGuestSessionToken
};
