import React, { useState } from 'react';
import { Outlet, Link } from 'react-router-dom';
import { AdminUser } from '../../types';
import { AdminSidebar } from './AdminSidebar';
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
    <div className="min-h-screen bg-[#050811] text-[#e0e7ff] flex flex-col font-sans selection:bg-[#00f0ff] selection:text-black relative overflow-x-hidden">
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
          <header className="bg-[#080d1a]/90 border-b border-[#00f0ff]/20 px-4 sm:px-6 py-3 flex items-center justify-between shrink-0 backdrop-blur-md z-20">
            {/* Mobile Menu Button + Title */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="p-2 rounded-lg bg-[#0a0f1d] border border-[#00f0ff]/30 text-[#00f0ff] lg:hidden hover:bg-[#00f0ff]/20"
                title="Toggle menu"
              >
                <Menu className="w-5 h-5" />
              </button>
              <div className="flex flex-col">
                <span className="text-xs font-mono text-[#00f0ff] uppercase tracking-widest hidden sm:inline">
                  BAIA RESORT CONCIERGE
                </span>
                <span className="text-base sm:text-lg font-bold text-white tracking-wide">
                  Management Console
                </span>
              </div>
            </div>

            {/* Right Action Controls (Auth / Guest Link) */}
            <div className="flex items-center gap-3">
              <Link
                to="/"
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#00f0ff]/10 border border-[#00f0ff]/40 text-[#00f0ff] hover:bg-[#00f0ff]/20 transition-all text-xs font-semibold"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Guest Concierge</span>
              </Link>

              {currentUser ? (
                <div className="flex items-center gap-2 bg-[#0a0f1d] border border-[#10b981]/50 rounded-lg px-3 py-1.5">
                  {currentUser.photoURL ? (
                    <img
                      src={currentUser.photoURL}
                      alt={currentUser.name || 'Operator'}
                      className="w-5 h-5 rounded-full border border-[#10b981]"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <UserIcon className="w-4 h-4 text-[#10b981]" />
                  )}
                  <div className="hidden sm:flex flex-col text-left font-sans leading-none">
                    <span className="text-xs text-white font-semibold truncate max-w-[110px]">
                      {currentUser.name || currentUser.email?.split('@')[0]}
                    </span>
                    <span className="text-[9px] text-emerald-400 flex items-center gap-0.5 mt-0.5 font-mono">
                      <Database className="w-2.5 h-2.5" /> PocketBase Sync
                    </span>
                  </div>
                  <button
                    onClick={onSignOut}
                    title="Sign out"
                    className="p-1 hover:text-[#ef4444] text-gray-400 transition-colors ml-1"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={onSignIn}
                  className="px-3 py-1.5 rounded-lg bg-[#00f0ff]/10 border border-[#00f0ff]/50 text-[#00f0ff] hover:bg-[#00f0ff]/20 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>PocketBase Login</span>
                </button>
              )}
            </div>
          </header>

          {/* Router Main Content View */}
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-[#050811]/90 scrollbar-thin scrollbar-thumb-[#00f0ff]/20">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
};
