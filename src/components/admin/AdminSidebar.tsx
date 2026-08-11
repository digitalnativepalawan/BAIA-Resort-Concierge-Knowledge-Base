import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { KapwaLogo } from '../KapwaLogo';
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
    <aside className="w-64 bg-[#0f1d3a]/90 border-r border-[#00f0ff]/20 flex flex-col h-full select-none shrink-0 text-gray-200 font-inter backdrop-blur-md">
      {/* Brand Header */}
      <div className="p-4 border-b border-[#00f0ff]/15 flex items-center justify-between">
        <KapwaLogo />
        {onMobileClose && (
          <button
            onClick={onMobileClose}
            className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-[#00f0ff]/10 lg:hidden"
            title="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Online Status Pill */}
      <div className="px-5 py-3 border-b border-[#00f0ff]/10 flex items-center gap-2">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
        </span>
        <span className="text-xs font-medium text-emerald-400 tracking-wide">
          TALA • Online
        </span>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
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
                    ? 'bg-[#00f0ff]/15 text-[#00f0ff] border border-[#00f0ff]/30 shadow-sm'
                    : 'text-gray-300 hover:text-white hover:bg-[#00f0ff]/10'
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
      <div className="p-4 border-t border-[#00f0ff]/15 bg-[#0a1228]/60">
        <Link
          to="/"
          onClick={onMobileClose}
          className="w-full flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-[#00f0ff]/10 border border-[#00f0ff]/25 text-[#00f0ff] hover:bg-[#00f0ff]/20 transition-all text-xs font-medium shadow-sm"
        >
          <Sparkles className="w-4 h-4 text-[#00f0ff]" />
          <span>Launch Guest View</span>
        </Link>
      </div>
    </aside>
  );
};
