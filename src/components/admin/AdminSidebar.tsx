import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import {
  LayoutDashboard,
  MessageSquare,
  BookOpen,
  ClipboardList,
  Settings,
  Sparkles,
  X
} from 'lucide-react';

interface AdminSidebarProps {
  onMobileClose?: () => void;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({ onMobileClose }) => {
  const navItems = [
    { label: 'Dashboard', path: '/admin', icon: LayoutDashboard, end: true },
    { label: 'Conversations', path: '/admin/conversations', icon: MessageSquare },
    { label: 'Knowledge', path: '/admin/knowledge', icon: BookOpen },
    { label: 'Guest Requests', path: '/admin/requests', icon: ClipboardList },
    { label: 'Settings', path: '/admin/settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-[#080d1a] border-r border-[#00f0ff]/20 flex flex-col h-full select-none shrink-0 text-gray-200">
      {/* Brand Header */}
      <div className="p-5 border-b border-[#00f0ff]/20 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-orbitron font-extrabold tracking-wider text-white">
              TALA<span className="text-[#00f0ff]">.AI</span>
            </h1>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#00f0ff]/10 text-[#00f0ff] border border-[#00f0ff]/30">
              ADMIN
            </span>
          </div>
          <p className="text-xs text-gray-400 font-sans mt-0.5 tracking-wide">
            BAIA Resort Concierge
          </p>
        </div>
        {onMobileClose && (
          <button
            onClick={onMobileClose}
            className="p-1 rounded text-gray-400 hover:text-white hover:bg-[#00f0ff]/10 lg:hidden"
            title="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Online Status Pill */}
      <div className="px-5 py-3 border-b border-[#00f0ff]/10 flex items-center gap-2">
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#10b981] opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#10b981]"></span>
        </span>
        <span className="text-xs font-medium text-emerald-400 font-sans tracking-wide">
          TALA ● Online
        </span>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.end}
              onClick={onMobileClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-[#00f0ff]/15 text-[#00f0ff] border border-[#00f0ff]/40 shadow-[0_0_12px_rgba(0,240,255,0.15)]'
                    : 'text-gray-300 hover:text-white hover:bg-[#0a0f1d] hover:border hover:border-[#00f0ff]/20'
                }`
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Bottom Switch to Guest View */}
      <div className="p-4 border-t border-[#00f0ff]/20 bg-[#050811]/60">
        <Link
          to="/"
          onClick={onMobileClose}
          className="w-full flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-[#00f0ff]/10 border border-[#00f0ff]/30 text-[#00f0ff] hover:bg-[#00f0ff]/20 hover:border-[#00f0ff] transition-all text-xs font-semibold uppercase tracking-wider shadow-[0_0_10px_rgba(0,240,255,0.1)]"
        >
          <Sparkles className="w-4 h-4" />
          <span>Launch Guest View</span>
        </Link>
      </div>
    </aside>
  );
};
