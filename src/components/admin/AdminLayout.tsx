import React, { useState } from 'react';
import { Outlet, Link } from 'react-router-dom';
import { AdminUser } from '../../types';
import { AdminSidebar } from './AdminSidebar';
import { DualTelemetryClocks } from '../DualTelemetryClocks';
import { Menu, LogIn, LogOut, Database, User as UserIcon, Sparkles } from 'lucide-react';

interface AdminLayoutProps {
  currentUser: AdminUser | null;
  onSignIn: () => void;
  onSignOut: () => void;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  currentUser,
  onSignIn,
  onSignOut
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

  return (
    <div className="min-h-screen bg-[#0a1228] text-[#e0e7ff] flex flex-col font-inter selection:bg-[#00f0ff] selection:text-black relative overflow-x-hidden">
      {/* Background Grid Accent */}
      <div className="fixed inset-0 pointer-events-none z-0 bg-[radial-gradient(#00f0ff_1px,transparent_1px)] [background-size:24px_24px] opacity-10" />

      {/* Main Layout Shell */}
      <div className="relative z-10 flex-1 flex h-screen overflow-hidden">
        {/* Desktop Sidebar */}
        <div className="hidden lg:block h-full">
          <AdminSidebar />
        </div>

        {/* Mobile Slide-Out Drawer Overlay */}
        {isMobileMenuOpen && (
          <div
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm lg:hidden flex"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <div
              className="relative w-64 max-w-[80vw] h-full"
              onClick={(e) => e.stopPropagation()}
            >
              <AdminSidebar onMobileClose={() => setIsMobileMenuOpen(false)} />
            </div>
          </div>
        )}

        {/* Content Column */}
        <div className="flex-1 flex flex-col h-full overflow-hidden">
          {/* Top Admin Header Bar */}
          <header className="bg-[#0f1d3a]/80 border-b border-[#00f0ff]/20 px-4 sm:px-6 py-2.5 flex items-center justify-between shrink-0 backdrop-blur-md z-20 gap-4">
            {/* Mobile Menu Button + Title */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="p-2 rounded-xl bg-[#0a1228] border border-[#00f0ff]/30 text-[#00f0ff] lg:hidden hover:bg-[#00f0ff]/20"
                title="Toggle menu"
              >
                <Menu className="w-5 h-5" />
              </button>
              <div className="flex flex-col">
                <span className="text-[11px] font-medium text-[#00f0ff] tracking-wide hidden sm:inline">
                  BAIA Resort Concierge
                </span>
                <span className="text-base sm:text-lg font-medium text-white tracking-tight">
                  Management Console
                </span>
              </div>
            </div>

            {/* Dual Telemetry Clocks */}
            <div className="hidden md:block">
              <DualTelemetryClocks />
            </div>

            {/* Right Action Controls (Auth / Guest Link) */}
            <div className="flex items-center gap-3">
              <Link
                to="/"
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#00f0ff]/10 border border-[#00f0ff]/25 text-[#00f0ff] hover:bg-[#00f0ff]/20 transition-all text-xs font-medium shadow-sm"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Guest Concierge</span>
              </Link>

              {currentUser ? (
                <div className="flex items-center gap-2 bg-[#0a1228]/80 border border-emerald-500/30 rounded-xl px-3 py-1.5">
                  {currentUser.photoURL ? (
                    <img
                      src={currentUser.photoURL}
                      alt={currentUser.name || 'Operator'}
                      className="w-5 h-5 rounded-full border border-emerald-400/50"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <UserIcon className="w-4 h-4 text-emerald-400" />
                  )}
                  <div className="hidden sm:flex flex-col text-left font-inter leading-none">
                    <span className="text-xs text-white font-medium truncate max-w-[110px]">
                      {currentUser.name || currentUser.email?.split('@')[0]}
                    </span>
                    <span className="text-[9px] text-emerald-400 flex items-center gap-0.5 mt-0.5 font-normal">
                      <Database className="w-2.5 h-2.5" /> Supabase Sync
                    </span>
                  </div>
                  <button
                    onClick={onSignOut}
                    title="Sign out"
                    className="p-1 hover:text-red-400 text-gray-400 transition-colors ml-1"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={onSignIn}
                  className="px-3 py-1.5 rounded-xl bg-[#00f0ff]/10 border border-[#00f0ff]/25 text-[#00f0ff] hover:bg-[#00f0ff]/20 text-xs font-medium flex items-center gap-1.5"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Supabase Login</span>
                </button>
              )}
            </div>
          </header>

          {/* Router Main Content View */}
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-[#0a1228]/95 scrollbar-thin scrollbar-thumb-[#00f0ff]/20 font-inter">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
};
