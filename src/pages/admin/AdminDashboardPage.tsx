import React from 'react';
import { Link } from 'react-router-dom';
import {
  MessageSquare,
  HelpCircle,
  ClipboardList,
  AlertTriangle,
  Cpu,
  BookOpen,
  Volume2,
  Cloud,
  ArrowRight,
  Clock,
  User as UserIcon,
  CheckCircle,
  Activity
} from 'lucide-react';
import { ChatMessage, KnowledgeFile, GuestRequest } from '../../types';

interface AdminDashboardPageProps {
  messages: ChatMessage[];
  knowledgeFiles: KnowledgeFile[];
  guestRequests: GuestRequest[];
  hasServerOpenRouterKey: boolean;
  hasCustomKey: boolean;
}

export const AdminDashboardPage: React.FC<AdminDashboardPageProps> = ({
  messages,
  knowledgeFiles,
  guestRequests,
  hasServerOpenRouterKey,
  hasCustomKey
}) => {
  // Compute metric numbers from actual state
  const totalConversations = messages.length > 0 ? 1 : 0; // Current active guest session
  const questionsAnswered = messages.filter((m) => m.role === 'model').length;
  const totalRequests = guestRequests.length;
  const needsAttention = guestRequests.filter(
    (r) => r.status === 'new' || r.status === 'needs_staff'
  ).length;

  const isAiConnected = hasServerOpenRouterKey || hasCustomKey;

  return (
    <div className="max-w-7xl mx-auto space-y-6 font-inter">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0f1d3a]/80 border border-[#00f0ff]/20 rounded-2xl p-6 backdrop-blur-md shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-medium text-emerald-400 tracking-wide">
              SYSTEM ONLINE
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-medium text-white mt-1 tracking-tight">
            TALA <span className="text-[#00f0ff]">Resort Concierge</span>
          </h1>
          <p className="text-xs sm:text-sm text-gray-300 mt-1 font-normal">
            Real-time overview of guest inquiries, service requests, and AI concierge status.
          </p>
        </div>

        <Link
          to="/admin/settings"
          className="self-start sm:self-auto px-4 py-2.5 rounded-xl bg-[#00f0ff]/10 border border-[#00f0ff]/25 text-[#00f0ff] hover:bg-[#00f0ff]/20 transition-all text-xs font-medium flex items-center gap-2 shrink-0"
        >
          <Activity className="w-4 h-4" />
          <span>Advanced Diagnostics</span>
        </Link>
      </div>

      {/* Summary Metrics Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Guest Conversations */}
        <div className="bg-[#0f1d3a]/80 border border-[#00f0ff]/20 rounded-2xl p-5 backdrop-blur-md shadow-sm hover:border-[#00f0ff]/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-300">
              Guest Conversations
            </span>
            <div className="p-2.5 rounded-xl bg-[#00f0ff]/10 text-[#00f0ff]">
              <MessageSquare className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-medium text-white mt-3">{totalConversations}</div>
          <p className="text-xs text-gray-400 mt-1 flex items-center gap-1 font-normal">
            <Clock className="w-3 h-3 text-[#00f0ff]" /> Active guest session(s)
          </p>
        </div>

        {/* Metric 2: Questions Answered */}
        <div className="bg-[#0f1d3a]/80 border border-[#00f0ff]/20 rounded-2xl p-5 backdrop-blur-md shadow-sm hover:border-[#00f0ff]/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-300">
              Questions Answered
            </span>
            <div className="p-2.5 rounded-xl bg-[#00f0ff]/10 text-[#00f0ff]">
              <HelpCircle className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-medium text-white mt-3">{questionsAnswered}</div>
          <p className="text-xs text-gray-400 mt-1 font-normal">Concierge responses delivered</p>
        </div>

        {/* Metric 3: Guest Requests */}
        <div className="bg-[#0f1d3a]/80 border border-[#00f0ff]/20 rounded-2xl p-5 backdrop-blur-md shadow-sm hover:border-[#00f0ff]/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-300">
              Guest Requests
            </span>
            <div className="p-2.5 rounded-xl bg-[#00f0ff]/10 text-[#00f0ff]">
              <ClipboardList className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-medium text-white mt-3">{totalRequests}</div>
          <p className="text-xs text-gray-400 mt-1 font-normal">Services & tasks logged</p>
        </div>

        {/* Metric 4: Needs Staff Attention */}
        <div className="bg-[#0f1d3a]/80 border border-[#00f0ff]/20 rounded-2xl p-5 backdrop-blur-md shadow-sm hover:border-[#00f0ff]/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-300">
              Needs Staff Attention
            </span>
            <div className="p-2.5 rounded-xl bg-pink-500/15 text-pink-400">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-medium text-pink-400 mt-3">{needsAttention}</div>
          <p className="text-xs text-gray-400 mt-1 font-normal">Pending staff follow-ups</p>
        </div>
      </div>

      {/* Main Grid: Recent Conversations & Guest Requests */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Recent Conversations Card */}
        <div className="lg:col-span-6 bg-[#0a1228] border border-[#00f0ff]/20 rounded-2xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-[#00f0ff]/15">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-[#00f0ff]" />
                  <span>Recent Conversations</span>
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">Latest guest messages with TALA</p>
              </div>
              <Link
                to="/admin/conversations"
                className="text-xs text-[#00f0ff] hover:underline flex items-center gap-1 font-semibold"
              >
                <span>View All</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {messages.length === 0 ? (
              <div className="py-12 text-center text-gray-400 text-sm">
                <MessageSquare className="w-8 h-8 text-gray-600 mx-auto mb-2 opacity-50" />
                No guest conversations yet. Guest messages will appear here when TALA starts receiving interactions.
              </div>
            ) : (
              <div className="divide-y divide-[#00f0ff]/10 my-3">
                <div className="py-3 flex items-start gap-3">
                  <div className="w-9 h-9 rounded-full bg-[#00f0ff]/10 border border-[#00f0ff]/30 flex items-center justify-center shrink-0">
                    <UserIcon className="w-4 h-4 text-[#00f0ff]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-white">Guest (Villa 101)</span>
                      <span className="text-gray-400 font-mono">
                        {messages[messages.length - 1].timestamp}
                      </span>
                    </div>
                    <p className="text-xs text-gray-300 truncate mt-1">
                      {messages[messages.length - 1].text}
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                        ● Active
                      </span>
                      <span className="text-[10px] text-gray-400">
                        {messages.length} message(s) in thread
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Recent Guest Requests Card */}
        <div className="lg:col-span-6 bg-[#0a1228] border border-[#00f0ff]/20 rounded-2xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-[#00f0ff]/15">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <ClipboardList className="w-5 h-5 text-[#00f0ff]" />
                  <span>Recent Guest Requests</span>
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">Resort service orders & action items</p>
              </div>
              <Link
                to="/admin/requests"
                className="text-xs text-[#00f0ff] hover:underline flex items-center gap-1 font-semibold"
              >
                <span>Manage Requests</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {guestRequests.length === 0 ? (
              <div className="py-12 text-center text-gray-400 text-sm">
                <ClipboardList className="w-8 h-8 text-gray-600 mx-auto mb-2 opacity-50" />
                No guest requests yet. Service requests created by guests or staff will appear here.
              </div>
            ) : (
              <div className="divide-y divide-[#00f0ff]/10 my-3">
                {guestRequests.slice(0, 3).map((req) => (
                  <div key={req.id} className="py-3 flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white">{req.title}</span>
                        <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-[#00f0ff]/10 text-[#00f0ff] border border-[#00f0ff]/20">
                          {req.category}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {req.guestLabel || 'Guest'} • {req.room || 'Main Villa'}
                      </p>
                    </div>

                    <span
                      className={`shrink-0 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${
                        req.status === 'completed'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          : req.status === 'in_progress'
                          ? 'bg-[#00f0ff]/10 text-[#00f0ff] border-[#00f0ff]/30'
                          : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                      }`}
                    >
                      {req.status.replace('_', ' ')}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* System Status Section (Human-Readable) */}
      <div className="bg-[#0a1228] border border-[#00f0ff]/20 rounded-2xl p-5">
        <h2 className="text-base font-bold text-white mb-3 flex items-center gap-2">
          <Activity className="w-4 h-4 text-[#00f0ff]" />
          <span>System & Infrastructure Status</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: AI */}
          <div className="bg-[#070e20] border border-[#00f0ff]/15 rounded-xl p-3.5 flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-[#00f0ff]/10 text-[#00f0ff]">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-gray-400 uppercase font-semibold">AI Gateway</div>
              <div className="text-sm font-bold text-white flex items-center gap-1.5 mt-0.5">
                <span className={`w-2 h-2 rounded-full ${isAiConnected ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                {isAiConnected ? 'OpenRouter Connected' : 'Config Required'}
              </div>
            </div>
          </div>

          {/* Card 2: Knowledge Base */}
          <div className="bg-[#070e20] border border-[#00f0ff]/15 rounded-xl p-3.5 flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-[#00f0ff]/10 text-[#00f0ff]">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-gray-400 uppercase font-semibold">Grounding Memory</div>
              <div className="text-sm font-bold text-white flex items-center gap-1.5 mt-0.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                Active ({knowledgeFiles.length} doc{knowledgeFiles.length === 1 ? '' : 's'})
              </div>
            </div>
          </div>

          {/* Card 3: Voice Synthesizer */}
          <div className="bg-[#070e20] border border-[#00f0ff]/15 rounded-xl p-3.5 flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-[#00f0ff]/10 text-[#00f0ff]">
              <Volume2 className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-gray-400 uppercase font-semibold">Voice Engine</div>
              <div className="text-sm font-bold text-white flex items-center gap-1.5 mt-0.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                Ready (Web Speech)
              </div>
            </div>
          </div>

          {/* Card 4: Cloud Sync */}
          <div className="bg-[#070e20] border border-[#00f0ff]/15 rounded-xl p-3.5 flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-[#00f0ff]/10 text-[#00f0ff]">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-gray-400 uppercase font-semibold">Cloud Sync</div>
              <div className="text-sm font-bold text-white flex items-center gap-1.5 mt-0.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                Connected
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
