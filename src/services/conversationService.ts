import { ChatMessage, ConversationSession } from '../types';
import { saveChatMessage, listenChatMessages } from '../lib/firebase';

export const conversationService = {
  saveChatMessage: async (userId: string, message: ChatMessage) => {
    return saveChatMessage(userId, message);
  },
  listenChatMessages: (userId: string, callback: (messages: ChatMessage[]) => void) => {
    return listenChatMessages(userId, callback);
  },
  
  // Transform flat chat messages into conversation session objects
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
