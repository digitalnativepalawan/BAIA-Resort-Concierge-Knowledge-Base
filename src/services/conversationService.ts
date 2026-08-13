import { ChatMessage, ConversationSession } from '../types';
import { supabase, isSupabaseConfigured, localCache } from '../lib/supabase';

const MESSAGES_TABLE = 'messages';

export const conversationService = {
  saveChatMessage: async (message: ChatMessage, userId?: string): Promise<void> => {
    // Save to local cache first
    const existing = localCache.get<ChatMessage[]>('messages', []);
    const updated = [...existing.filter((m) => m.id !== message.id), message];
    localCache.set('messages', updated);

    if (isSupabaseConfigured()) {
      try {
        await supabase.from(MESSAGES_TABLE).insert({
          id: message.id && message.id.length > 10 ? message.id : undefined,
          content: message.text,
          role: message.role,
          user_id: userId || null,
          created_at: new Date().toISOString(),
        });
      } catch (err) {
        console.warn('Supabase save message notice:', err);
      }
    }
  },

  listenChatMessages: (callback: (messages: ChatMessage[]) => void) => {
    // Deliver local cached messages immediately
    const cached = localCache.get<ChatMessage[]>('messages', []);
    callback(cached);

    if (!isSupabaseConfigured()) {
      return () => {};
    }

    // Fetch initial list from Supabase
    supabase
      .from(MESSAGES_TABLE)
      .select('*')
      .order('created_at', { ascending: true })
      .limit(100)
      .then(({ data, error }) => {
        if (!error && data) {
          const formatted: ChatMessage[] = data.map((item) => ({
            id: item.id,
            role: item.role as 'user' | 'model',
            text: item.content,
            timestamp: new Date(item.created_at).toLocaleTimeString('en-US', { hour12: false }),
          }));
          localCache.set('messages', formatted);
          callback(formatted);
        }
      });

    // Subscribe to real-time additions via Supabase Channel
    const channel = supabase
      .channel('public:messages')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: MESSAGES_TABLE },
        (payload) => {
          const item = payload.new;
          if (item) {
            const newMsg: ChatMessage = {
              id: item.id,
              role: item.role as 'user' | 'model',
              text: item.content,
              timestamp: new Date(item.created_at).toLocaleTimeString('en-US', { hour12: false }),
            };
            const currentCache = localCache.get<ChatMessage[]>('messages', []);
            if (!currentCache.some((m) => m.id === newMsg.id)) {
              const nextCache = [...currentCache, newMsg];
              localCache.set('messages', nextCache);
              callback(nextCache);
            }
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: MESSAGES_TABLE },
        () => {
          localCache.set('messages', []);
          callback([]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },

  clearAllMessages: async (): Promise<void> => {
    localCache.set('messages', []);
    try {
      localStorage.removeItem('tala_cache_messages');
      localStorage.removeItem('pinned_items');
    } catch (e) {}

    if (isSupabaseConfigured()) {
      try {
        await supabase.from(MESSAGES_TABLE).delete().neq('id', '00000000-0000-0000-0000-000000000000');
      } catch (err) {
        console.warn('Supabase delete messages error:', err);
      }
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
        messages,
      },
    ];
  },
};
