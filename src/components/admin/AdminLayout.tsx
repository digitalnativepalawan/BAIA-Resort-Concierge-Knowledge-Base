import React, { useState } from 'react';
import { Outlet, Link } from 'react-router-dom';
import { TalaUser } from '../../services/authService';
import { AdminSidebar } from './AdminSidebar';
import { Menu, LogIn, LogOut, Cloud, User as UserIcon, Sparkles } from 'lucide-react';

interface AdminLayoutProps {
  currentUser: TalaUser | null;
  onLogin: (email: string, password: string) => void;
  onSignOut: () => void;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  currentUser,
  onLogin,
  onSignOut
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [showLoginForm, setShowLoginForm] = useState<boolean>(false);
  const [loginEmail, setLoginEmail] = useState<string>('');
  const [loginPassword, setLoginPassword] = useState<string>('');
  const [loginError, setLoginError] = useState<string>('');

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    try {
      await onLogin(loginEmail, loginPassword);
      setShowLoginForm(false);
      setLoginEmail('');
      setLoginPassword('');
    } catch (err: any) {
      setLoginError(err.message || 'Login failed');
    }
  };

  // If not authenticated, show login screen
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-[#050811] text-[#e0e7ff] flex items-center justify-center font-sans selection:bg-[#00f0ff] selection:text-black">
        <div className="fixed inset-0 pointer-events-none z-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#00f0ff]/15 via-[#080d1a]/80 to-[#050811]" />

        <div className="relative z-10 w-full max-w-md mx-4">
          <div className="bg-[#080d1a] border border-[#00f0ff]/30 rounded-2xl p-8 shadow-[0_0_30px_rgba(0,240,255,0.15)]">
            {/* Brand */}
            <div className="text-center mb-8">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-[#00f0ff] to-[#0088ff] p-0.5 shadow-[0_0_20px_rgba(0,240,255,0.4)] mb-4">
                <div className="w-full h-full bg-[#050811] rounded-[14px] flex items-center justify-center">
                  <Sparkles className="w-8 h-8 text-[#00f0ff]" />
                </div>
              </div>
              <h1 className="text-2xl font-extrabold text-white">
                BAIA <span className="text-[#00f0ff]">TALA</span>
              </h1>
              <p className="text-sm text-gray-400 mt-1">Admin Management Console</p>
            </div>

            {/* Login Form */}
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
                  Email
                </label>
                <input
                  type="email"
                  required
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="admin@baia-resort.com"
                  className="w-full bg-[#050811] border border-[#00f0ff]/30 focus:border-[#00f0ff] rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="Enter password"
                  className="w-full bg-[#050811] border border-[#00f0ff]/30 focus:border-[#00f0ff] rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none"
                />
              </div>

              {loginError && (
                <p className="text-xs text-red-400 font-mono">{loginError}</p>
              )}

              <button
                type="submit"
                className="w-full px-4 py-3 rounded-xl bg-[#00f0ff] text-black font-bold text-sm uppercase tracking-wider hover:bg-[#00f0ff]/80 transition-all flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(0,240,255,0.3)]"
              >
                <LogIn className="w-4 h-4" />
                <span>Sign In</span>
              </button>
            </form>

            {/* Back to Guest View */}
            <div className="mt-6 text-center">
              <Link
                to="/"
                className="text-xs text-[#00f0ff] hover:underline flex items-center justify-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Back to Guest Concierge</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

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

              <div className="flex items-center gap-2 bg-[#0a0f1d] border border-[#10b981]/50 rounded-lg px-3 py-1.5">
                <UserIcon className="w-4 h-4 text-[#10b981]" />
                <div className="hidden sm:flex flex-col text-left font-sans leading-none">
                  <span className="text-xs text-white font-semibold truncate max-w-[110px]">
                    {currentUser.name || currentUser.email?.split('@')[0]}
                  </span>
                  <span className="text-[9px] text-emerald-400 flex items-center gap-0.5 mt-0.5">
                    <Cloud className="w-2.5 h-2.5" /> PocketBase Auth
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
