import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX, Settings, Clock, LogIn, LogOut, Database, User as UserIcon } from 'lucide-react';
import { TalaState, TalaSettings, AdminUser } from '../types';

interface HeaderProps {
  state: TalaState;
  settings: TalaSettings;
  setSettings: React.Dispatch<React.SetStateAction<TalaSettings>>;
  onOpenSettings: () => void;
  hasServerOpenRouterKey?: boolean;
  currentUser?: AdminUser | null;
  onSignIn?: () => void;
  onSignOut?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  state,
  settings,
  setSettings,
  onOpenSettings,
  hasServerOpenRouterKey = false,
  currentUser = null,
  onSignIn,
  onSignOut
}) => {
  const [now, setNow] = useState<Date>(new Date());

  // Real-time ticker for dual digital clocks
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Format dynamic UTC Date
  const utcDateString = new Intl.DateTimeFormat('en-US', {
    timeZone: 'UTC',
    weekday: 'short',
    month: 'short',
    day: '2-digit',
    year: 'numeric',
  }).format(now);

  // Clock 1: Manila, PH (PHT)
  const manilaTimeStr = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Manila',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  }).format(now);

  // Clock 2: Houston, TX (CT)
  const houstonTimeStr = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Chicago',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  }).format(now);

  // Check key readiness
  const isKeyActive = Boolean(
    settings.openrouterApiKey?.trim() || settings.customApiKey?.trim() || hasServerOpenRouterKey
  );

  // System status color badge mapping
  const getStatusBadge = () => {
    if (!isKeyActive) {
      return {
        label: 'System Offline // Missing Key',
        dotColor: 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]',
        textColor: 'text-red-400',
      };
    }

    switch (state) {
      case 'LISTENING':
        return {
          label: 'System Status: Listening',
          dotColor: 'bg-[#00f0ff] shadow-[0_0_8px_rgba(0,240,255,0.5)]',
          textColor: 'text-[#00f0ff]',
        };
      case 'PROCESSING':
        return {
          label: 'System Status: Processing',
          dotColor: 'bg-purple-400 shadow-[0_0_8px_rgba(192,132,252,0.5)]',
          textColor: 'text-purple-300',
        };
      case 'SPEAKING':
        return {
          label: 'System Status: Vocalizing',
          dotColor: 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]',
          textColor: 'text-emerald-400',
        };
      case 'ERROR':
        return {
          label: 'System Status: Alert',
          dotColor: 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]',
          textColor: 'text-red-400',
        };
      case 'IDLE':
      default:
        return {
          label: 'Connected // Ready',
          dotColor: 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]',
          textColor: 'text-emerald-400',
        };
    }
  };

  const statusInfo = getStatusBadge();
  const currentModelLabel = settings.selectedOpenRouterModel || 'openrouter/free';

  return (
    <header className="relative z-20 w-full bg-[#0a1228]/80 border-b border-[#00f0ff]/20 px-4 sm:px-8 py-3.5 backdrop-blur-md shadow-[0_4px_25px_rgba(0,0,0,0.5)]">
      <div className="w-full max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
        
        {/* LEFT COLUMN [Branding & Status] */}
        <div className="md:col-span-4 flex flex-col justify-center items-start gap-1">
          {/* Status Badge Indicator */}
          <div className="flex items-center gap-2 font-inter">
            <span className={`w-2 h-2 rounded-full ${statusInfo.dotColor} animate-pulse`} />
            <span className={`text-[11px] font-medium tracking-wide ${statusInfo.textColor}`}>
              {statusInfo.label}
            </span>
          </div>

          {/* App Title & Version Tag */}
          <div className="flex items-center gap-2.5 mt-0.5">
            <h1 className="text-xl sm:text-2xl font-medium tracking-tight text-white">
              TALA<span className="text-[#00f0ff]">.AI</span>
            </h1>
            <span className="font-inter text-[10px] font-normal px-2 py-0.5 border border-[#00f0ff]/20 rounded-md bg-[#00f0ff]/10 text-cyan-200 tracking-wide">
              {currentModelLabel.split('/').pop()}
            </span>
          </div>
        </div>

        {/* CENTER COLUMN [Dual Digital Telemetry Clocks] */}
        <div className="md:col-span-4 flex flex-col items-center justify-center">
          <div className="bg-[#070e20] border border-[#00f0ff]/20 rounded-xl px-4 py-2 backdrop-blur-md shadow-sm flex flex-col items-center gap-1.5 w-full max-w-md">
            {/* Live UTC Date */}
            <div className="flex items-center gap-2 text-[11px] font-normal tracking-wide text-cyan-200/90 border-b border-[#00f0ff]/15 pb-1 w-full justify-center">
              <Clock className="w-3.5 h-3.5 text-[#00f0ff]/80" />
              <span>UTC Date: <strong className="text-white font-medium tracking-wide tabular-nums">{utcDateString}</strong></span>
            </div>

            {/* Dual Timezone Clocks */}
            <div className="grid grid-cols-2 gap-3 w-full pt-0.5 divide-x divide-[#00f0ff]/20">
              {/* Manila Clock */}
              <div className="flex flex-col items-center px-1">
                <span className="text-[10px] font-medium tracking-wide text-cyan-300/80 font-inter">
                  Manila, PH (PHT)
                </span>
                <span className="text-sm sm:text-base font-share font-semibold text-white tracking-widest tabular-nums min-w-[115px] text-center mt-0.5">
                  {manilaTimeStr}
                </span>
              </div>

              {/* Houston Clock */}
              <div className="flex flex-col items-center px-1">
                <span className="text-[10px] font-medium tracking-wide text-cyan-300/80 font-inter">
                  Houston, TX (CT)
                </span>
                <span className="text-sm sm:text-base font-share font-semibold text-white tracking-widest tabular-nums min-w-[115px] text-center mt-0.5">
                  {houstonTimeStr}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN [Controls & Metrics] */}
        <div className="md:col-span-4 flex items-center justify-start md:justify-end gap-2.5 sm:gap-3">
          {/* Live Telemetry Metrics Badges */}
          <div className="hidden lg:flex items-center gap-2 font-inter text-[10px] tracking-wide">
            <div className="flex flex-col items-end px-2.5 py-1 bg-[#0f1d3a]/80 border border-[#00f0ff]/15 rounded-lg">
              <span className="text-gray-400 text-[8px] font-light">Engine</span>
              <span className="text-[#00f0ff] font-medium">OpenRouter</span>
            </div>
            <div className="flex flex-col items-end px-2.5 py-1 bg-[#0f1d3a]/80 border border-[#00f0ff]/15 rounded-lg">
              <span className="text-gray-400 text-[8px] font-light">Latency</span>
              <span className="text-emerald-400 font-medium">12ms</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {/* Supabase Auth Pill */}
            {currentUser ? (
              <div className="flex items-center gap-2 bg-[#0f1d3a]/80 border border-emerald-500/30 rounded-xl px-2.5 py-1.5">
                {currentUser.photoURL ? (
                  <img
                    src={currentUser.photoURL}
                    alt={currentUser.name || 'User'}
                    className="w-5 h-5 rounded-full border border-emerald-400/50"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <UserIcon className="w-4 h-4 text-emerald-400" />
                )}
                <div className="hidden sm:flex flex-col text-left font-inter leading-none">
                  <span className="text-[11px] text-emerald-400 font-medium truncate max-w-[90px]">
                    {currentUser.name || currentUser.email?.split('@')[0] || 'Synced'}
                  </span>
                  <span className="text-[8px] text-emerald-400/70 flex items-center gap-0.5 mt-0.5">
                    <Database className="w-2.5 h-2.5" /> Supabase
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
                title="Sign in to sync session data with Supabase"
                className="px-3 py-1.5 rounded-xl bg-[#00f0ff]/10 border border-[#00f0ff]/25 text-[#00f0ff] hover:bg-[#00f0ff]/20 transition-all flex items-center gap-1.5 font-inter text-xs font-medium"
              >
                <LogIn className="w-3.5 h-3.5 text-[#00f0ff]" />
                <span className="hidden sm:inline">Supabase Login</span>
              </button>
            )}

            {/* Audio FX Toggle Button */}
            <button
              onClick={() => setSettings((prev) => ({ ...prev, soundEnabled: !prev.soundEnabled }))}
              title={settings.soundEnabled ? "Mute Audio FX" : "Enable Audio FX"}
              className="p-2 rounded-xl bg-[#0f1d3a]/80 border border-[#00f0ff]/25 text-[#00f0ff] hover:bg-[#00f0ff]/20 transition-all active:scale-95"
            >
              {settings.soundEnabled ? (
                <Volume2 className="w-4 h-4 text-[#00f0ff]" />
              ) : (
                <VolumeX className="w-4 h-4 text-gray-400" />
              )}
            </button>

            {/* Config Button */}
            <button
              onClick={onOpenSettings}
              title="Open TALA System Settings"
              className="px-3 py-2 rounded-xl bg-[#00f0ff]/10 border border-[#00f0ff]/25 text-[#00f0ff] hover:bg-[#00f0ff]/20 transition-all active:scale-95 flex items-center gap-1.5 font-inter text-xs font-medium"
            >
              <Settings className="w-4 h-4 text-[#00f0ff]" />
              <span>Config</span>
            </button>
          </div>
        </div>

      </div>
    </header>
  );
};

