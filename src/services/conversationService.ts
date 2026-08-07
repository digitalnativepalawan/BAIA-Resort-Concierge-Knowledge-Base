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

async function ensureGuestConversation(): Promise<string> {
  const existingId = getGuestConversationId();
  if (existingId) return existingId;

  try {
    const record = await pb.collection('conversations').create({
      guest_label: 'Guest',
      room: 'Main Villa',
      status: 'active'
    });
    setGuestConversationId(record.id);
    return record.id;
  } catch (err) {
    console.warn('PocketBase: Failed to create guest conversation, using fallback ID', err);
    const fallbackId = `guest-fallback-${Date.now()}`;
    setGuestConversationId(fallbackId);
    return fallbackId;
  }
}

export const conversationService = {
  saveChatMessage: async (userId: string, message: ChatMessage) => {
    try {
      const conversationId = await ensureGuestConversation();
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

  listenChatMessages: (userId: string, callback: (messages: ChatMessage[]) => void) => {
    let unsubscribe: (() => void) | null = null;
    let currentConversationId: string | null = null;

    const setup = async () => {
      try {
        currentConversationId = getGuestConversationId();

        if (currentConversationId) {
          // Load existing messages
          try {
            const records = await pb.collection('messages').getFullList({
              filter: `conversation="${currentConversationId}"`,
              sort: 'created'
            });

            const messages: ChatMessage[] = records.map((r: any) => ({
              id: r.id,
              role: r.role === 'assistant' ? 'model' : (r.role as 'user' | 'model'),
              text: r.content,
              timestamp: new Date(r.created).toLocaleTimeString('en-US', { hour12: false })
            }));

            if (messages.length > 0) {
              callback(messages);
            }
          } catch (err) {
            console.warn('PocketBase: Failed to load messages:', err);
          }

          // Subscribe to realtime changes
          try {
            await pb.collection('messages').subscribe('*', (event: any) => {
              if (event.action === 'create' && event.record.conversation === currentConversationId) {
                const msg: ChatMessage = {
                  id: event.record.id,
                  role: event.record.role === 'assistant' ? 'model' : event.record.role,
                  text: event.record.content,
                  timestamp: new Date(event.record.created).toLocaleTimeString('en-US', { hour12: false })
                };
                callback([msg]);
              }
            });

            unsubscribe = () => {
              pb.collection('messages').unsubscribe('*');
            };
          } catch (err) {
            console.warn('PocketBase: Failed to subscribe to messages:', err);
          }
        }
      } catch (err) {
        console.warn('PocketBase: listenChatMessages setup failed:', err);
      }
    };

    setup();

    return () => {
      if (unsubscribe) unsubscribe();
    };
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
        id: getGuestConversationId() || 'session-main-guest',
        guestLabel,
        room: 'Villa 101',
        lastMessage: lastMsg.text,
        lastTimestamp: lastMsg.timestamp,
        status: needsStaff ? 'needs_staff' : 'active',
        messageCount: messages.length,
        messages
      }
    ];
  },

  getConversationId: getGuestConversationId
};
