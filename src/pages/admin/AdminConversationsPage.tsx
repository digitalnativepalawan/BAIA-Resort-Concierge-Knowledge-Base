import React, { useState } from 'react';
import { ChatMessage, ConversationSession } from '../../types';
import { conversationService } from '../../services/conversationService';
import {
  MessageSquare,
  User as UserIcon,
  Bot,
  Send,
  AlertTriangle,
  CheckCircle,
  Clock,
  Search,
  Filter,
  Trash2,
  Pin,
  PinOff
} from 'lucide-react';

interface AdminConversationsPageProps {
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  onClearConversation?: () => void;
}

export const AdminConversationsPage: React.FC<AdminConversationsPageProps> = ({
  messages,
  onSendMessage,
  onClearConversation
}) => {
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'needs_staff' | 'closed'>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [replyText, setReplyText] = useState<string>('');
  const [showClearModal, setShowClearModal] = useState<boolean>(false);
  const [isClearing, setIsClearing] = useState<boolean>(false);
  const [pinnedMessageIds, setPinnedMessageIds] = useState<string[]>([]);

  const togglePinMessage = (msgId: string) => {
    setPinnedMessageIds((prev) =>
      prev.includes(msgId) ? prev.filter((id) => id !== msgId) : [...prev, msgId]
    );
  };

  const pinnedMessages = messages.filter((m) => pinnedMessageIds.includes(m.id));

  const handleConfirmClear = async () => {
    setIsClearing(true);
    try {
      if (onClearConversation) {
        await onClearConversation();
      } else {
        await conversationService.clearAllMessages();
      }
    } catch (err) {
      console.error('Error clearing conversation messages:', err);
    } finally {
      setIsClearing(false);
      setShowClearModal(false);
    }
  };

  // Format active guest session
  const lastMsg = messages.length > 0 ? messages[messages.length - 1] : null;
  const needsStaff = messages.some(
    (m) =>
      m.text.toLowerCase().includes('staff') ||
      m.text.toLowerCase().includes('reception') ||
      m.text.toLowerCase().includes('help')
  );

  const mainSession: ConversationSession = {
    id: 'session-villa-101',
    guestLabel: 'Sarah Jenkins (Main Villa)',
    room: 'Villa 101',
    lastMessage: lastMsg ? lastMsg.text : 'No messages yet',
    lastTimestamp: lastMsg ? lastMsg.timestamp : 'Just now',
    status: needsStaff ? 'needs_staff' : messages.length > 0 ? 'active' : 'closed',
    messageCount: messages.length,
    messages
  };

  const sessions: ConversationSession[] = messages.length > 0 ? [mainSession] : [];

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    onSendMessage(replyText.trim());
    setReplyText('');
  };

  return (
    <div className="max-w-7xl mx-auto h-[calc(100vh-140px)] flex flex-col space-y-4">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#0a1228] border border-[#00f0ff]/20 rounded-2xl p-4 shrink-0">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-[#00f0ff]" />
            <span>Conversations Inbox</span>
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">
            Monitor real-time guest dialogues, review transcripts, and provide staff assistance.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {(['all', 'active', 'needs_staff', 'closed'] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all whitespace-nowrap ${
                activeFilter === filter
                  ? 'bg-[#00f0ff]/20 text-[#00f0ff] border border-[#00f0ff]'
                  : 'bg-[#070e20] text-gray-400 hover:text-white border border-[#00f0ff]/10'
              }`}
            >
              {filter.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Main Inbox Container */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 min-h-0 overflow-hidden">
        {/* Left List Pane */}
        <div className="lg:col-span-4 bg-[#0a1228] border border-[#00f0ff]/20 rounded-2xl p-3 flex flex-col min-h-0 overflow-hidden">
          {/* Search Box */}
          <div className="relative mb-3 shrink-0">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search guest or room..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#070e20] border border-[#00f0ff]/20 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#00f0ff]"
            />
          </div>

          {/* Session List */}
          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {sessions.length === 0 ? (
              <div className="p-8 text-center text-gray-400 text-xs">
                <MessageSquare className="w-8 h-8 text-gray-600 mx-auto mb-2 opacity-40" />
                No active conversations. When guests interact with TALA, conversations will appear here.
              </div>
            ) : (
              sessions.map((sess) => (
                <div
                  key={sess.id}
                  className="p-3.5 rounded-xl bg-[#070e20] border border-[#00f0ff]/30 shadow-md cursor-pointer hover:border-[#00f0ff] transition-all"
                >
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-bold text-white truncate max-w-[160px]">
                      {sess.guestLabel}
                    </span>
                    <span className="text-[10px] text-gray-400 font-mono">
                      {sess.lastTimestamp}
                    </span>
                  </div>

                  <p className="text-xs text-gray-300 truncate font-sans mb-2">
                    {sess.lastMessage}
                  </p>

                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-gray-400 font-mono">{sess.room}</span>
                    <span
                      className={`px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                        sess.status === 'needs_staff'
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                          : sess.status === 'active'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                          : 'bg-gray-500/20 text-gray-400 border border-gray-500/40'
                      }`}
                    >
                      {sess.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Active Conversation Thread View */}
        <div className="lg:col-span-8 bg-[#0a1228] border border-[#00f0ff]/20 rounded-2xl p-4 flex flex-col min-h-0 overflow-hidden">
          {messages.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-gray-400 text-sm">
              <MessageSquare className="w-12 h-12 text-[#00f0ff]/30 mb-3" />
              <p className="font-bold text-white">No Selected Conversation</p>
              <p className="text-xs text-gray-400 max-w-sm mt-1">
                Select a conversation thread on the left or test the guest view to create message logs.
              </p>
            </div>
          ) : (
            <>
              {/* Active Header Bar */}
              <div className="pb-3 border-b border-[#00f0ff]/15 flex items-center justify-between shrink-0">
                <div>
                  <h2 className="text-sm font-bold text-white flex items-center gap-2">
                    <span>{mainSession.guestLabel}</span>
                    <span className="text-xs font-mono text-[#00f0ff] px-2 py-0.5 rounded bg-[#00f0ff]/10">
                      {mainSession.room}
                    </span>
                  </h2>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    Live Chat Stream • Grounded with BAIA Knowledge Memory
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-bold uppercase tracking-wider">
                    ● Active Thread
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowClearModal(true)}
                    className="px-3 py-1 rounded-lg bg-red-500/15 hover:bg-red-500/25 text-red-400 border border-red-500/40 font-semibold text-xs transition-all flex items-center gap-1.5 active:scale-95 shadow-sm"
                    title="Clear all messages in current session"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Clear Conversation</span>
                  </button>
                </div>
              </div>

              {/* Message Transcript Area */}
              <div className="flex-1 overflow-y-auto py-4 space-y-3 pr-2 my-2 scrollbar-thin scrollbar-thumb-[#00f0ff]/20">
                {/* Pinned Snippets & Critical Guest Requests Top Feed */}
                {pinnedMessages.length > 0 && (
                  <div className="mb-4 p-3 rounded-2xl bg-[#0a1228] border-2 border-amber-500/40 shadow-[0_0_20px_rgba(245,158,11,0.15)] space-y-2">
                    <div className="flex items-center justify-between pb-1.5 border-b border-amber-500/20 text-xs font-mono font-bold text-amber-400">
                      <div className="flex items-center gap-1.5">
                        <Pin className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                        <span>Pinned Critical Requests & Snippets ({pinnedMessages.length})</span>
                      </div>
                      <span className="text-[10px] text-gray-400 font-normal">Kept at top of feed</span>
                    </div>

                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {pinnedMessages.map((pMsg) => (
                        <div
                          key={`pinned-${pMsg.id}`}
                          className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs flex items-start justify-between gap-2"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 text-[10px] font-mono mb-1">
                              <span className="font-bold text-amber-300">
                                {pMsg.role === 'user' ? 'Guest Request' : 'TALA Snippet'}
                              </span>
                              <span className="text-gray-400">• {pMsg.timestamp}</span>
                            </div>
                            <p className="text-gray-200 line-clamp-2 leading-relaxed font-sans">{pMsg.text}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => togglePinMessage(pMsg.id)}
                            className="p-1 rounded-lg hover:bg-amber-500/20 text-amber-400 transition-colors shrink-0"
                            title="Unpin snippet from top"
                          >
                            <PinOff className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {messages.map((msg) => {
                  const isUser = msg.role === 'user';
                  const isPinned = pinnedMessageIds.includes(msg.id);
                  return (
                    <div
                      key={msg.id}
                      className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
                    >
                      {!isUser && (
                        <div className="w-7 h-7 rounded-full bg-[#00f0ff]/20 border border-[#00f0ff] flex items-center justify-center text-[#00f0ff] shrink-0 mt-0.5">
                          <Bot className="w-4 h-4" />
                        </div>
                      )}

                      <div
                        className={`group relative max-w-[80%] rounded-2xl p-3.5 text-xs font-sans leading-relaxed shadow-lg transition-all ${
                          isPinned
                            ? 'bg-[#0f1d3a] text-white border-2 border-amber-400/80 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                            : isUser
                            ? 'bg-[#00f0ff]/15 text-white border border-[#00f0ff]/30 rounded-tr-none'
                            : 'bg-[#070e20] text-gray-200 border border-[#00f0ff]/20 rounded-tl-none'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3 text-[10px] font-mono text-gray-400 mb-1">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-[#00f0ff]">
                              {isUser ? 'Guest' : 'TALA Concierge'}
                            </span>
                            {isPinned && (
                              <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40 text-[9px] flex items-center gap-0.5">
                                <Pin className="w-2.5 h-2.5 fill-amber-300" />
                                Pinned
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            <span>{msg.timestamp}</span>
                            <button
                              type="button"
                              onClick={() => togglePinMessage(msg.id)}
                              className={`p-1 rounded transition-opacity ${
                                isPinned
                                  ? 'opacity-100 text-amber-400 hover:text-amber-300'
                                  : 'opacity-40 group-hover:opacity-100 text-gray-400 hover:text-[#00f0ff]'
                              }`}
                              title={isPinned ? 'Unpin snippet' : 'Pin snippet to top of feed'}
                            >
                              <Pin className={`w-3 h-3 ${isPinned ? 'fill-amber-400' : ''}`} />
                            </button>
                          </div>
                        </div>
                        <p className="whitespace-pre-wrap">{msg.text}</p>
                      </div>

                      {isUser && (
                        <div className="w-7 h-7 rounded-full bg-indigo-500/20 border border-indigo-400 flex items-center justify-center text-indigo-300 shrink-0 mt-0.5">
                          <UserIcon className="w-4 h-4" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Staff Intervention Input Bar */}
              <form
                onSubmit={handleSendReply}
                className="pt-3 border-t border-[#00f0ff]/15 flex items-center gap-2 shrink-0"
              >
                <input
                  type="text"
                  placeholder="Send staff response or test prompt as TALA..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  className="flex-1 bg-[#070e20] border border-[#00f0ff]/30 rounded-xl px-4 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#00f0ff]"
                />
                <button
                  type="submit"
                  className="px-4 py-2.5 rounded-xl bg-[#00f0ff] text-black font-bold text-xs uppercase tracking-wider hover:bg-[#00f0ff]/80 transition-all flex items-center gap-1.5 shrink-0 shadow-[0_0_12px_rgba(0,240,255,0.3)]"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send</span>
                </button>
              </form>
            </>
          )}
        </div>
      </div>

      {/* Confirmation Modal */}
      {showClearModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0a1228] border border-red-500/40 rounded-2xl p-6 max-w-md w-full shadow-[0_0_30px_rgba(239,68,68,0.2)] space-y-4 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center gap-3 text-red-400">
              <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/30">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Clear Conversation</h3>
                <p className="text-xs text-gray-400">Permanent Database Deletion</p>
              </div>
            </div>

            <p className="text-xs text-gray-300 leading-relaxed">
              Are you sure you want to delete all chat messages for this current session? This will execute a Supabase delete query to permanently remove all transcripts from the database.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowClearModal(false)}
                disabled={isClearing}
                className="px-4 py-2 rounded-xl bg-[#070e20] text-gray-300 hover:text-white border border-[#00f0ff]/20 text-xs font-semibold transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmClear}
                disabled={isClearing}
                className="px-4 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-[0_0_15px_rgba(239,68,68,0.4)] disabled:opacity-50"
              >
                {isClearing ? (
                  <span>Deleting...</span>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Clear All Messages</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
