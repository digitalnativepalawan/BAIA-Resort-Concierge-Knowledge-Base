import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { TalaUser } from '../services/authService';
import { ArcReactorHUD } from '../components/ArcReactorHUD';
import { ConversationStream } from '../components/ConversationStream';
import { CommandBar } from '../components/CommandBar';
import { TalaState, ChatMessage } from '../types';
import {
  Compass,
  Utensils,
  Car,
  Sparkles,
  Home,
  SlidersHorizontal,
  Volume2,
  VolumeX,
  LogIn,
  LogOut,
  User as UserIcon
} from 'lucide-react';

interface GuestConciergeProps {
  talaState: TalaState;
  onCoreClick: () => void;
  speechVolume: number;
  interimTranscript: string;
  messages: ChatMessage[];
  onSendMessage: (prompt: string) => void;
  onStopSpeech: () => void;
  continuousListening: boolean;
  onToggleContinuousListening: () => void;
  currentUser: TalaUser | null;
  onLogin: (email: string, password: string) => void;
  onSignOut: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

const GUEST_QUICK_CHIPS = [
  { label: 'Getting Around', prompt: 'Tell me about transportation, airport shuttles, and getting around San Vicente.' },
  { label: 'Food & Dining', prompt: 'What food, breakfast, and dining options are available at BAIA Resort?' },
  { label: 'Things To Do', prompt: 'What activities, tours, and places can I explore in San Vicente?' },
  { label: 'About BAIA', prompt: 'Tell me about BAIA Resort amenities, pool, and guest services.' },
];

export const GuestConcierge: React.FC<GuestConciergeProps> = ({
  talaState,
  onCoreClick,
  speechVolume,
  interimTranscript,
  messages,
  onSendMessage,
  onStopSpeech,
  continuousListening,
  onToggleContinuousListening,
  currentUser,
  onLogin,
  onSignOut,
  soundEnabled,
  onToggleSound,
}) => {
  return (
    <div className="min-h-screen bg-[#050811] text-[#e0e7ff] flex flex-col font-sans selection:bg-[#00f0ff] selection:text-black relative overflow-x-hidden">
      {/* Background Radial Glow Accent */}
      <div className="fixed inset-0 pointer-events-none z-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#00f0ff]/15 via-[#080d1a]/80 to-[#050811]" />

      {/* Top Guest Header Bar */}
      <header className="relative z-20 bg-[#080d1a]/80 border-b border-[#00f0ff]/20 px-4 sm:px-6 py-3.5 flex items-center justify-between backdrop-blur-md">
        {/* Brand Identity */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#00f0ff] to-[#0088ff] p-0.5 shadow-[0_0_15px_rgba(0,240,255,0.3)]">
            <div className="w-full h-full bg-[#050811] rounded-[10px] flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-[#00f0ff]" />
            </div>
          </div>
          <div>
            <h1 className="text-lg font-extrabold text-white tracking-wide flex items-center gap-1.5">
              <span>BAIA</span>
              <span className="text-[#00f0ff] font-mono font-bold text-xs px-1.5 py-0.5 bg-[#00f0ff]/10 rounded border border-[#00f0ff]/30">
                TALA
              </span>
            </h1>
            <p className="text-[11px] text-gray-400 font-sans tracking-wide">
              Resort AI Concierge
            </p>
          </div>
        </div>

        {/* Header Right Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Sound Toggle */}
          <button
            onClick={onToggleSound}
            className="p-2 rounded-xl bg-[#0a0f1d] border border-[#00f0ff]/30 text-[#00f0ff] hover:bg-[#00f0ff]/20 transition-all text-xs"
            title={soundEnabled ? 'Mute Sound FX' : 'Enable Sound FX'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-gray-500" />}
          </button>

          {/* Link to Admin Management Console */}
          <Link
            to="/admin"
            className="px-3 py-1.5 rounded-xl bg-[#00f0ff]/10 border border-[#00f0ff]/40 text-[#00f0ff] hover:bg-[#00f0ff]/20 transition-all text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-[0_0_10px_rgba(240,255,0,0.1)]"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Admin Portal</span>
          </Link>

          {/* User Auth / Cloud Sync Status */}
          {currentUser ? (
            <button
              onClick={onSignOut}
              className="p-1.5 rounded-xl bg-[#0a0f1d] border border-emerald-500/40 text-emerald-400 hover:text-red-400 transition-colors"
              title={`Signed in as ${currentUser.name || currentUser.email}. Click to sign out.`}
            >
              <UserIcon className="w-4 h-4" />
            </button>
          ) : (
            <Link
              to="/admin/settings"
              className="p-1.5 rounded-xl bg-[#0a0f1d] border border-[#00f0ff]/30 text-[#00f0ff] hover:bg-[#00f0ff]/20"
              title="Admin Login"
            >
              <LogIn className="w-4 h-4" />
            </Link>
          )}
        </div>
      </header>

      {/* Guest View Main Content Container */}
      <main className="relative z-10 flex-1 max-w-4xl w-full mx-auto px-4 py-6 flex flex-col items-center justify-between space-y-6">
        {/* Welcome Greeting Banner */}
        <div className="text-center space-y-1.5 max-w-lg">
          <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-wide">
            Hi, I'm <span className="text-[#00f0ff]">TALA</span>. How can I help with your stay?
          </h2>
          <p className="text-xs sm:text-sm text-gray-300 font-sans leading-relaxed">
            Ask me about your stay, transportation, food, activities, or San Vicente.
          </p>
        </div>

        {/* Centerpiece Interactive Voice Orb */}
        <div className="w-full flex justify-center my-2">
          <ArcReactorHUD
            state={talaState}
            onCoreClick={onCoreClick}
            speechVolume={speechVolume}
            interimTranscript={interimTranscript}
          />
        </div>

        {/* Quick Hospitality Action Chips */}
        <div className="w-full max-w-md flex flex-wrap items-center justify-center gap-2">
          {GUEST_QUICK_CHIPS.map((chip, idx) => (
            <button
              key={idx}
              onClick={() => onSendMessage(chip.prompt)}
              disabled={talaState === 'PROCESSING'}
              className="px-3.5 py-2 rounded-xl bg-[#080d1a]/90 hover:bg-[#00f0ff]/20 border border-[#00f0ff]/30 text-[#00f0ff] hover:border-[#00f0ff] transition-all text-xs font-semibold shadow-md active:scale-95 disabled:opacity-50"
            >
              {chip.label}
            </button>
          ))}
        </div>

        {/* Conversation Message Stream */}
        <div className="w-full max-w-2xl min-h-[160px] max-h-[320px] overflow-y-auto rounded-2xl bg-[#080d1a]/80 border border-[#00f0ff]/20 p-4 shadow-xl">
          <ConversationStream
            messages={messages}
            onSpeakText={() => {}}
            isSpeakingNow={talaState === 'SPEAKING'}
          />
        </div>

        {/* Bottom Guest Command Composer */}
        <div className="w-full max-w-2xl bg-[#080d1a]/90 border border-[#00f0ff]/30 rounded-2xl p-4 shadow-[0_0_20px_rgba(0,240,255,0.1)]">
          <CommandBar
            state={talaState}
            onMicToggle={onCoreClick}
            onSendPrompt={onSendMessage}
            onStopSpeech={onStopSpeech}
            continuousListening={continuousListening}
            onToggleContinuousListening={onToggleContinuousListening}
          />
        </div>
      </main>

      {/* Guest View Footer */}
      <footer className="relative z-10 py-3 text-center text-[11px] font-mono text-gray-500 border-t border-[#00f0ff]/10">
        BAIA RESORT SAN VICENTE • TALA AI CONCIERGE POWERED BY OPENROUTER
      </footer>
    </div>
  );
};
