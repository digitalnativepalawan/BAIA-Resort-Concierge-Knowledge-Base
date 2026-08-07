import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX, Settings, Clock, Activity, Radio, Cpu, ShieldCheck, LogIn, LogOut, Cloud, User as UserIcon } from 'lucide-react';
import { TalaState, TalaSettings } from '../types';
import { User } from 'firebase/auth';

interface HeaderProps {
  state: TalaState;
  settings: TalaSettings;
  setSettings: React.Dispatch<React.SetStateAction<TalaSettings>>;
  onOpenSettings: () => void;
  hasServerOpenRouterKey?: boolean;
  currentUser?: User | null;
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
  })
    .format(now)
    .toUpperCase(); // e.g. "FRI, AUG 07, 2026"

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
        label: 'STATUS: OFFLINE // MISSING KEY',
        dotColor: 'bg-[#ef4444] shadow-[0_0_10px_#ef4444]',
        textColor: 'text-[#ef4444]',
      };
    }

    switch (state) {
      case 'LISTENING':
        return {
          label: 'SYSTEM STATUS: LISTENING',
          dotColor: 'bg-[#00f0ff] shadow-[0_0_10px_#00f0ff]',
          textColor: 'text-[#00f0ff]',
        };
      case 'PROCESSING':
        return {
          label: 'SYSTEM STATUS: PROCESSING',
          dotColor: 'bg-[#a855f7] shadow-[0_0_10px_#a855f7]',
          textColor: 'text-[#a855f7]',
        };
      case 'SPEAKING':
        return {
          label: 'SYSTEM STATUS: VOCALIZING',
          dotColor: 'bg-[#10b981] shadow-[0_0_10px_#10b981]',
          textColor: 'text-[#10b981]',
        };
      case 'ERROR':
        return {
          label: 'SYSTEM STATUS: ALERT',
          dotColor: 'bg-[#ef4444] shadow-[0_0_10px_#ef4444]',
          textColor: 'text-[#ef4444]',
        };
      case 'IDLE':
      default:
        return {
          label: 'CONNECTED // READY',
          dotColor: 'bg-[#10b981] shadow-[0_0_10px_#10b981]',
          textColor: 'text-[#10b981]',
        };
    }
  };

  const statusInfo = getStatusBadge();
  const currentModelLabel = settings.selectedOpenRouterModel || 'openrouter/free';

  return (
    <header className="relative z-20 w-full bg-[#080d1a]/85 border-b border-[#00f0ff]/30 px-4 sm:px-8 py-3.5 backdrop-blur-md shadow-[0_4px_25px_rgba(0,0,0,0.8),0_0_15px_rgba(0,240,255,0.15)]">
      <div className="w-full max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
        
        {/* LEFT COLUMN [Branding & Status] */}
        <div className="md:col-span-4 flex flex-col justify-center items-start gap-1">
          {/* Status Badge Indicator */}
          <div className="flex items-center gap-2 font-rajdhani">
            <span className={`w-2.5 h-2.5 rounded-full ${statusInfo.dotColor} animate-pulse`} />
            <span className={`text-[11px] font-share font-semibold tracking-[0.2em] uppercase ${statusInfo.textColor}`}>
              {statusInfo.label}
            </span>
          </div>

          {/* App Title & Version Tag */}
          <div className="flex items-center gap-2.5 mt-0.5">
            <h1 className="text-2xl sm:text-3xl font-orbitron font-extrabold tracking-wider text-white drop-shadow-[0_0_10px_rgba(0,240,255,0.5)]">
              TALA<span className="text-[#00f0ff]">.AI</span>
            </h1>
            <span className="font-share text-[10px] px-2 py-0.5 border border-[#00f0ff]/40 rounded bg-[#00f0ff]/10 text-[#00f0ff] font-semibold tracking-wider uppercase shadow-[0_0_8px_rgba(0,240,255,0.2)]">
              OPENROUTER // {currentModelLabel.split('/').pop()}
            </span>
          </div>
        </div>

        {/* CENTER COLUMN [Dual Digital Telemetry Clocks] */}
        <div className="md:col-span-4 flex flex-col items-center justify-center">
          <div className="bg-[#030712] border border-[#00f0ff]/50 rounded-xl px-4 py-2 shadow-[0_0_15px_rgba(0,240,255,0.15)] flex flex-col items-center gap-1.5 w-full max-w-md">
            {/* Live UTC Date */}
            <div className="flex items-center gap-2 text-xs font-share tracking-[0.15em] text-cyan-200 border-b border-[#00f0ff]/30 pb-1 w-full justify-center">
              <Clock className="w-3.5 h-3.5 text-[#00f0ff] animate-pulse" />
              <span>UTC DATE: <strong className="text-white font-share font-bold tracking-[0.15em] tabular-nums">{utcDateString}</strong></span>
            </div>

            {/* Dual Timezone Clocks */}
            <div className="grid grid-cols-2 gap-3 w-full pt-0.5 divide-x divide-[#00f0ff]/30">
              {/* Manila Clock */}
              <div className="flex flex-col items-center px-1">
                <span className="text-[10px] font-orbitron font-bold tracking-[0.18em] text-cyan-300 uppercase">
                  MANILA, PH (PHT)
                </span>
                <span className="text-sm sm:text-base font-share font-bold text-white tracking-[0.12em] tabular-nums min-w-[115px] text-center drop-shadow-[0_0_10px_rgba(0,240,255,0.8)] mt-0.5">
                  {manilaTimeStr}
                </span>
              </div>

              {/* Houston Clock */}
              <div className="flex flex-col items-center px-1">
                <span className="text-[10px] font-orbitron font-bold tracking-[0.18em] text-cyan-300 uppercase">
                  HOUSTON, TX (CT)
                </span>
                <span className="text-sm sm:text-base font-share font-bold text-white tracking-[0.12em] tabular-nums min-w-[115px] text-center drop-shadow-[0_0_10px_rgba(0,240,255,0.8)] mt-0.5">
                  {houstonTimeStr}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN [Controls & Metrics] */}
        <div className="md:col-span-4 flex items-center justify-start md:justify-end gap-3 sm:gap-4">
          {/* Live Telemetry Metrics Badges */}
          <div className="hidden lg:flex items-center gap-2 font-share text-[10px] uppercase tracking-wider">
            <div className="flex flex-col items-end px-2 py-1 bg-[#0a0f1d]/80 border border-[#00f0ff]/20 rounded">
              <span className="text-gray-400 text-[8px]">ENGINE</span>
              <span className="text-[#00f0ff] font-bold">OPENROUTER</span>
            </div>
            <div className="flex flex-col items-end px-2 py-1 bg-[#0a0f1d]/80 border border-[#00f0ff]/20 rounded">
              <span className="text-gray-400 text-[8px]">LATENCY</span>
              <span className="text-emerald-400 font-bold">12ms</span>
            </div>
          </div>

          {/* Action HUD Buttons */}
          <div className="flex items-center gap-2">
            {/* Cloud Sync Auth Pill */}
            {currentUser ? (
              <div className="flex items-center gap-1.5 bg-[#0a0f1d]/90 border border-[#10b981]/50 rounded-lg px-2.5 py-1.5 shadow-[0_0_10px_rgba(16,185,129,0.2)]">
                {currentUser.photoURL ? (
                  <img
                    src={currentUser.photoURL}
                    alt={currentUser.displayName || 'User'}
                    className="w-5 h-5 rounded-full border border-[#10b981]"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <UserIcon className="w-4 h-4 text-[#10b981]" />
                )}
                <div className="hidden sm:flex flex-col text-left font-share leading-none">
                  <span className="text-[10px] text-[#10b981] font-bold truncate max-w-[90px]">
                    {currentUser.displayName || currentUser.email?.split('@')[0] || 'SYNCED'}
                  </span>
                  <span className="text-[8px] text-emerald-400/80 flex items-center gap-0.5">
                    <Cloud className="w-2.5 h-2.5" /> CLOUD SYNC
                  </span>
                </div>
                <button
                  onClick={onSignOut}
                  title="Sign out of Cloud Sync"
                  className="p-1 hover:text-[#ef4444] text-gray-400 transition-colors ml-1"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={onSignIn}
                title="Sign in to sync session data across devices"
                className="px-2.5 py-1.5 rounded-lg bg-[#00f0ff]/10 border border-[#00f0ff]/50 text-[#00f0ff] hover:bg-[#00f0ff]/20 hover:border-[#00f0ff] transition-all flex items-center gap-1.5 font-share text-xs font-bold uppercase tracking-wider"
              >
                <LogIn className="w-3.5 h-3.5 text-[#00f0ff]" />
                <span className="hidden sm:inline">CLOUD</span> SIGN IN
              </button>
            )}

            {/* Audio FX Toggle Button */}
            <button
              onClick={() => setSettings((prev) => ({ ...prev, soundEnabled: !prev.soundEnabled }))}
              title={settings.soundEnabled ? "Mute Audio FX" : "Enable Audio FX"}
              className="p-2 rounded-lg bg-[#0a0f1d]/90 border border-[#00f0ff]/40 text-[#00f0ff] hover:bg-[#00f0ff]/20 hover:border-[#00f0ff] hover:shadow-[0_0_12px_rgba(0,240,255,0.3)] transition-all active:scale-95"
            >
              {settings.soundEnabled ? (
                <Volume2 className="w-4 h-4 text-[#00f0ff]" />
              ) : (
                <VolumeX className="w-4 h-4 text-gray-400" />
              )}
            </button>

            {/* CONFIG HUD Drawer Button */}
            <button
              onClick={onOpenSettings}
              title="Open TALA System Settings"
              className="px-3 py-2 rounded-lg bg-[#0a0f1d]/90 border border-[#00f0ff]/40 text-[#00f0ff] hover:bg-[#00f0ff]/20 hover:border-[#00f0ff] hover:shadow-[0_0_12px_rgba(0,240,255,0.3)] transition-all active:scale-95 flex items-center gap-1.5 font-share text-xs font-bold uppercase tracking-wider"
            >
              <Settings className="w-4 h-4 text-[#00f0ff]" />
              <span>CONFIG</span>
            </button>
          </div>
        </div>

      </div>
    </header>
  );
};
