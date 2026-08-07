import React, { useState, useEffect } from 'react';
import { ChatMessage, ConversationSession } from '../../types';
import { conversationService } from '../../services/conversationService';
import {
  MessageSquare,
  User as UserIcon,
  Bot,
  Send,
  Search,
  Shield,
  RefreshCw
} from 'lucide-react';

interface AdminConversationsPageProps {
  onStaffReply?: (conversationId: string, message: string) => void;
}

export const AdminConversationsPage: React.FC<AdminConversationsPageProps> = ({
  onStaffReply
}) => {
  const [sessions, setSessions] = useState<ConversationSession[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'needs_staff' | 'closed'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [replyText, setReplyText] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const load = async () => {
      if (!active) return;
      setLoading(true);
      const data = await conversationService.getAllConversations();
      if (active) {
        setSessions(data);
        setLoading(false);
      }
    };

    load();

    // Poll for updates every 10 seconds as fallback
    const interval = setInterval(() => {
      if (active) load();
    }, 10000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  const filteredSessions = sessions.filter((sess) => {
    const matchesFilter = activeFilter === 'all' || sess.status === activeFilter;
    const matchesSearch = searchTerm === '' ||
      sess.guestLabel.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sess.room.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const selectedSession = sessions.find((s) => s.id === selectedSessionId) || null;

  const handleSelectSession = (sessionId: string) => {
    setSelectedSessionId(sessionId);
  };

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedSessionId) return;

    if (onStaffReply) {
      onStaffReply(selectedSessionId, replyText.trim());
    }
    setReplyText('');
  };

  const handleMarkNeedsStaff = async (sessionId: string) => {
    await conversationService.updateConversationStatus(sessionId, 'needs_staff');
    setSessions((prev) =>
      prev.map((s) => (s.id === sessionId ? { ...s, status: 'needs_staff' } : s))
    );
  };

  const handleCloseConversation = async (sessionId: string) => {
    await conversationService.updateConversationStatus(sessionId, 'closed');
    setSessions((prev) =>
      prev.map((s) => (s.id === sessionId ? { ...s, status: 'closed' } : s))
    );
  };

  return (
    <div className="max-w-7xl mx-auto h-[calc(100vh-140px)] flex flex-col space-y-4">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#080d1a] border border-[#00f0ff]/20 rounded-2xl p-4 shrink-0">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-[#00f0ff]" />
            <span>Conversations Inbox</span>
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">
            Real-time guest conversations. Staff can respond directly to assist guests.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.location.reload()}
            className="p-2 rounded-xl bg-[#0a0f1d] border border-[#00f0ff]/30 text-[#00f0ff] hover:bg-[#00f0ff]/20 transition-all"
            title="Refresh conversations"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {(['all', 'active', 'needs_staff', 'closed'] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all whitespace-nowrap ${
                  activeFilter === filter
                    ? 'bg-[#00f0ff]/20 text-[#00f0ff] border border-[#00f0ff]'
                    : 'bg-[#0a0f1d] text-gray-400 hover:text-white border border-[#00f0ff]/10'
                }`}
              >
                {filter.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Inbox Container */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 min-h-0 overflow-hidden">
        {/* Left List Pane */}
        <div className="lg:col-span-4 bg-[#080d1a] border border-[#00f0ff]/20 rounded-2xl p-3 flex flex-col min-h-0 overflow-hidden">
          {/* Search Box */}
          <div className="relative mb-3 shrink-0">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search guest or room..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#050811] border border-[#00f0ff]/20 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#00f0ff]"
            />
          </div>

          {/* Session List */}
          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {loading ? (
              <div className="p-8 text-center text-gray-400 text-xs">
                <RefreshCw className="w-6 h-6 text-[#00f0ff] mx-auto mb-2 animate-spin" />
                Loading conversations...
              </div>
            ) : filteredSessions.length === 0 ? (
              <div className="p-8 text-center text-gray-400 text-xs">
                <MessageSquare className="w-8 h-8 text-gray-600 mx-auto mb-2 opacity-40" />
                {sessions.length === 0
                  ? 'No conversations yet. When guests interact with TALA, conversations will appear here.'
                  : 'No conversations match your filter.'}
              </div>
            ) : (
              filteredSessions.map((sess) => (
                <div
                  key={sess.id}
                  onClick={() => handleSelectSession(sess.id)}
                  className={`p-3.5 rounded-xl cursor-pointer transition-all ${
                    selectedSessionId === sess.id
                      ? 'bg-[#00f0ff]/10 border border-[#00f0ff] shadow-md'
                      : 'bg-[#0a0f1d] border border-[#00f0ff]/15 hover:border-[#00f0ff]/40'
                  }`}
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
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500">{sess.messageCount} msgs</span>
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
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Active Conversation Thread View */}
        <div className="lg:col-span-8 bg-[#080d1a] border border-[#00f0ff]/20 rounded-2xl p-4 flex flex-col min-h-0 overflow-hidden">
          {!selectedSession ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-gray-400 text-sm">
              <MessageSquare className="w-12 h-12 text-[#00f0ff]/30 mb-3" />
              <p className="font-bold text-white">Select a Conversation</p>
              <p className="text-xs text-gray-400 max-w-sm mt-1">
                Choose a guest conversation from the left panel to view messages and respond.
              </p>
            </div>
          ) : (
            <>
              {/* Active Header Bar */}
              <div className="pb-3 border-b border-[#00f0ff]/15 flex items-center justify-between shrink-0">
                <div>
                  <h2 className="text-sm font-bold text-white flex items-center gap-2">
                    <span>{selectedSession.guestLabel}</span>
                    <span className="text-xs font-mono text-[#00f0ff] px-2 py-0.5 rounded bg-[#00f0ff]/10">
                      {selectedSession.room}
                    </span>
                  </h2>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    {selectedSession.messageCount} messages • {selectedSession.status.replace('_', ' ')}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleMarkNeedsStaff(selectedSession.id)}
                    className="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/30 hover:bg-amber-500/20 transition-all flex items-center gap-1"
                  >
                    <Shield className="w-3 h-3" />
                    Mark Needs Staff
                  </button>
                  <button
                    onClick={() => handleCloseConversation(selectedSession.id)}
                    className="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-gray-500/10 text-gray-400 border border-gray-500/30 hover:bg-gray-500/20 transition-all"
                  >
                    Close
                  </button>
                </div>
              </div>

              {/* Message Transcript Area */}
              <div className="flex-1 overflow-y-auto py-4 space-y-3 pr-2 my-2">
                {selectedSession.messages.length === 0 ? (
                  <div className="text-center text-gray-400 text-xs py-8">
                    No messages in this conversation yet.
                  </div>
                ) : (
                  selectedSession.messages.map((msg) => {
                    const isUser = msg.role === 'user';
                    const isStaff = msg.role === 'staff';
                    return (
                      <div
                        key={msg.id}
                        className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
                      >
                        {!isUser && (
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                            isStaff
                              ? 'bg-amber-500/20 border border-amber-400 text-amber-300'
                              : 'bg-[#00f0ff]/20 border border-[#00f0ff] text-[#00f0ff]'
                          }`}>
                            {isStaff ? <Shield className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                          </div>
                        )}

                        <div
                          className={`max-w-[80%] rounded-2xl p-3.5 text-xs font-sans leading-relaxed shadow-lg ${
                            isStaff
                              ? 'bg-amber-500/10 text-white border border-amber-500/30 rounded-tr-none'
                              : isUser
                              ? 'bg-[#00f0ff]/15 text-white border border-[#00f0ff]/30 rounded-tr-none'
                              : 'bg-[#0a0f1d] text-gray-200 border border-[#00f0ff]/20 rounded-tl-none'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-3 text-[10px] font-mono text-gray-400 mb-1">
                            <span className={`font-bold ${
                              isStaff ? 'text-amber-400' : isUser ? 'text-[#00f0ff]' : 'text-[#00f0ff]'
                            }`}>
                              {isStaff ? 'Staff' : isUser ? 'Guest' : 'TALA'}
                            </span>
                            <span>{msg.timestamp}</span>
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
                  })
                )}
              </div>

              {/* Staff Input Bar */}
              <form
                onSubmit={handleSendReply}
                className="pt-3 border-t border-[#00f0ff]/15 flex items-center gap-2 shrink-0"
              >
                <input
                  type="text"
                  placeholder="Send staff response to guest..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  className="flex-1 bg-[#050811] border border-[#00f0ff]/30 rounded-xl px-4 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#00f0ff]"
                />
                <button
                  type="submit"
                  disabled={!replyText.trim()}
                  className="px-4 py-2.5 rounded-xl bg-[#00f0ff] text-black font-bold text-xs uppercase tracking-wider hover:bg-[#00f0ff]/80 transition-all flex items-center gap-1.5 shrink-0 shadow-[0_0_12px_rgba(0,240,255,0.3)] disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send</span>
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
