import React, { useState } from 'react';
import { GuestRequest, GuestRequestCategory, GuestRequestStatus } from '../../types';
import {
  ClipboardList,
  Plus,
  CheckCircle,
  Clock,
  AlertTriangle,
  Trash2,
  X,
  User as UserIcon,
  Home,
  Utensils,
  Car,
  Wrench,
  Sparkles,
  Filter
} from 'lucide-react';

interface AdminRequestsPageProps {
  requests: GuestRequest[];
  onSaveRequest: (request: GuestRequest) => void;
  onUpdateStatus: (id: string, status: GuestRequestStatus) => void;
  onDeleteRequest: (id: string) => void;
}

const CATEGORY_ICONS: Record<GuestRequestCategory, React.ComponentType<{ className?: string }>> = {
  housekeeping: Home,
  transportation: Car,
  food: Utensils,
  maintenance: Wrench,
  activity: Sparkles,
  general: ClipboardList,
};

export const AdminRequestsPage: React.FC<AdminRequestsPageProps> = ({
  requests,
  onSaveRequest,
  onUpdateStatus,
  onDeleteRequest
}) => {
  const [selectedCategory, setSelectedCategory] = useState<'all' | GuestRequestCategory>('all');
  const [selectedStatus, setSelectedStatus] = useState<'all' | GuestRequestStatus>('all');
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  // New Request Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<GuestRequestCategory>('housekeeping');
  const [guestLabel, setGuestLabel] = useState('Sarah Jenkins');
  const [room, setRoom] = useState('Villa 101');

  const filteredRequests = requests.filter((r) => {
    const matchesCat = selectedCategory === 'all' || r.category === selectedCategory;
    const matchesStat = selectedStatus === 'all' || r.status === selectedStatus;
    return matchesCat && matchesStat;
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const newReq: GuestRequest = {
      id: `req-${Date.now()}`,
      title: title.trim(),
      description: description.trim(),
      category,
      guestLabel: guestLabel.trim() || 'Guest',
      room: room.trim() || 'Main Villa',
      status: 'new',
      createdAt: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    };

    onSaveRequest(newReq);
    setTitle('');
    setDescription('');
    setIsModalOpen(false);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0a1228] border border-[#00f0ff]/30 rounded-2xl p-5 shadow-[0_0_20px_rgba(0,240,255,0.08)]">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center gap-2">
            <ClipboardList className="w-7 h-7 text-[#00f0ff]" />
            <span>Guest Requests & Services</span>
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">
            Track and fulfill guest requests for housekeeping, airport shuttles, dining, and activities.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-[#00f0ff] text-black font-bold text-xs uppercase tracking-wider hover:bg-[#00f0ff]/80 transition-all flex items-center gap-2 shadow-[0_0_15px_rgba(0,240,255,0.3)] shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Create Request</span>
        </button>
      </div>

      {/* Category & Status Filter Bar */}
      <div className="bg-[#0a1228] border border-[#00f0ff]/20 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-thin scrollbar-thumb-[#00f0ff]/20">
          {(['all', 'housekeeping', 'transportation', 'food', 'maintenance', 'activity', 'general'] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-[#00f0ff] text-black font-bold shadow-[0_0_10px_rgba(0,240,255,0.3)]'
                  : 'bg-[#070e20] text-gray-300 hover:text-white border border-[#00f0ff]/15'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Status Dropdown / Filter */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-[#00f0ff]" />
          <span className="text-xs text-gray-400 font-semibold">Status:</span>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value as any)}
            className="bg-[#070e20] border border-[#00f0ff]/30 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#00f0ff]"
          >
            <option value="all">All Statuses</option>
            <option value="new">New</option>
            <option value="in_progress">In Progress</option>
            <option value="needs_staff">Needs Staff</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      </div>

      {/* Request Grid */}
      {filteredRequests.length === 0 ? (
        <div className="bg-[#0a1228] border border-[#00f0ff]/20 rounded-2xl p-12 text-center text-gray-400 space-y-3">
          <ClipboardList className="w-12 h-12 text-[#00f0ff]/30 mx-auto" />
          <h3 className="text-lg font-bold text-white">No Guest Requests Found</h3>
          <p className="text-xs text-gray-400 max-w-md mx-auto">
            {selectedCategory !== 'all' || selectedStatus !== 'all'
              ? 'No requests match your current category or status filter.'
              : 'Requests created by guests via TALA or added by resort staff will appear here.'}
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#00f0ff]/15 text-[#00f0ff] border border-[#00f0ff]/40 text-xs font-bold uppercase tracking-wider hover:bg-[#00f0ff]/25"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Request</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRequests.map((req) => {
            const IconComponent = CATEGORY_ICONS[req.category] || ClipboardList;
            return (
              <div
                key={req.id}
                className="bg-[#0a1228] border border-[#00f0ff]/20 rounded-2xl p-5 flex flex-col justify-between hover:border-[#00f0ff]/50 transition-all shadow-lg relative group"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-xl bg-[#00f0ff]/10 text-[#00f0ff]">
                        <IconComponent className="w-4 h-4" />
                      </div>
                      <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-[#00f0ff]/10 text-[#00f0ff] border border-[#00f0ff]/30">
                        {req.category}
                      </span>
                    </div>

                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${
                        req.status === 'completed'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          : req.status === 'in_progress'
                          ? 'bg-[#00f0ff]/10 text-[#00f0ff] border-[#00f0ff]/30'
                          : req.status === 'needs_staff'
                          ? 'bg-red-500/10 text-red-400 border-red-500/30'
                          : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                      }`}
                    >
                      {req.status.replace('_', ' ')}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-white group-hover:text-[#00f0ff] transition-colors">
                    {req.title}
                  </h3>

                  {req.description && (
                    <p className="text-xs text-gray-300 mt-2 font-sans bg-[#070e20] p-3 rounded-xl border border-[#00f0ff]/10 leading-relaxed">
                      {req.description}
                    </p>
                  )}

                  <div className="mt-3 flex items-center justify-between text-xs text-gray-400 font-sans">
                    <span className="font-semibold text-white flex items-center gap-1">
                      <UserIcon className="w-3.5 h-3.5 text-[#00f0ff]" />
                      {req.guestLabel || 'Guest'} ({req.room || 'Main Villa'})
                    </span>
                    <span className="font-mono text-[10px] text-gray-400">
                      {req.createdAt}
                    </span>
                  </div>
                </div>

                {/* Status Quick Toggle Bar */}
                <div className="mt-4 pt-3 border-t border-[#00f0ff]/10 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1">
                    {(['new', 'in_progress', 'completed'] as const).map((st) => (
                      <button
                        key={st}
                        onClick={() => onUpdateStatus(req.id, st)}
                        className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider transition-all ${
                          req.status === st
                            ? 'bg-[#00f0ff] text-black'
                            : 'bg-[#070e20] text-gray-400 hover:text-white border border-[#00f0ff]/15'
                        }`}
                      >
                        {st === 'in_progress' ? 'Prog' : st}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() => onDeleteRequest(req.id)}
                    title="Delete Request"
                    className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Request Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateSubmit}
            className="bg-[#0a1228] border border-[#00f0ff]/40 rounded-2xl w-full max-w-lg p-6 space-y-4 relative shadow-[0_0_30px_rgba(0,240,255,0.2)]"
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#00f0ff]/20">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-[#00f0ff]" />
                <span>Log New Guest Service Request</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 uppercase mb-1">
                Service Title
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Extra Bath Towels, Airport Transfer, Breakfast Order"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-[#070e20] border border-[#00f0ff]/30 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#00f0ff]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-300 uppercase mb-1">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as GuestRequestCategory)}
                  className="w-full bg-[#070e20] border border-[#00f0ff]/30 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#00f0ff]"
                >
                  <option value="housekeeping">Housekeeping</option>
                  <option value="transportation">Transportation</option>
                  <option value="food">Food & Dining</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="activity">Activities</option>
                  <option value="general">General</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 uppercase mb-1">
                  Room / Suite
                </label>
                <input
                  type="text"
                  placeholder="Villa 101"
                  value={room}
                  onChange={(e) => setRoom(e.target.value)}
                  className="w-full bg-[#070e20] border border-[#00f0ff]/30 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#00f0ff]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 uppercase mb-1">
                Guest Name / Label
              </label>
              <input
                type="text"
                placeholder="Sarah Jenkins"
                value={guestLabel}
                onChange={(e) => setGuestLabel(e.target.value)}
                className="w-full bg-[#070e20] border border-[#00f0ff]/30 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#00f0ff]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 uppercase mb-1">
                Details / Special Instructions
              </label>
              <textarea
                rows={3}
                placeholder="Describe request details, delivery time, or staff notes..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-[#070e20] border border-[#00f0ff]/30 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-[#00f0ff]"
              />
            </div>

            <div className="pt-3 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-gray-800 text-gray-300 text-xs font-bold uppercase tracking-wider hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-[#00f0ff] text-black text-xs font-bold uppercase tracking-wider hover:bg-[#00f0ff]/80 shadow-md"
              >
                Save Request
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
