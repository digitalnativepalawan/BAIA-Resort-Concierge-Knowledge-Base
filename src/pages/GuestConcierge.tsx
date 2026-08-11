import React from 'react';
import { Link } from 'react-router-dom';
import { ArcReactorHUD } from '../components/ArcReactorHUD';
import { ConversationStream } from '../components/ConversationStream';
import { CommandBar } from '../components/CommandBar';
import { DualTelemetryClocks } from '../components/DualTelemetryClocks';
import { KapwaLogo } from '../components/KapwaLogo';
import { TalaState, ChatMessage, AdminUser } from '../types';
import {
  Sparkles,
  SlidersHorizontal,
  Volume2,
  VolumeX,
  LogIn,
  LogOut,
  User as UserIcon,
  Utensils,
  Bus,
  Bike,
  Compass,
  Clock
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
  currentUser: AdminUser | null;
  onSignIn: () => void;
  onSignOut: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

const GUEST_QUICK_CHIPS = [
  {
    icon: Utensils,
    label: 'Do you have vegan food?',
    prompt: 'Do you have vegan or vegetarian food options at BAIA Resort?'
  },
  {
    icon: Bus,
    label: 'How to get here from El Nido?',
    prompt: 'How do I get to BAIA Resort from El Nido or Puerto Princesa?'
  },
  {
    icon: Bike,
    label: 'Can I rent a motorbike?',
    prompt: 'Can I rent a motorbike in San Vicente to explore Long Beach?'
  },
  {
    icon: Compass,
    label: 'What island tours do you offer?',
    prompt: 'What island hopping tours and water activities do you offer?'
  },
  {
    icon: Clock,
    label: 'What are check-in times?',
    prompt: 'What are your check-in and checkout times and guest services?'
  },
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
  onSignIn,
  onSignOut,
  soundEnabled,
  onToggleSound,
}) => {
  return (
    <div className="min-h-screen bg-[#0a1228] text-[#e0e7ff] flex flex-col font-inter selection:bg-[#00f0ff] selection:text-black relative overflow-x-hidden">
      {/* Background Subtle Radial Glow Accent */}
      <div className="fixed inset-0 pointer-events-none z-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#00f0ff]/10 via-[#0f1d3a]/90 to-[#0a1228]" />

      {/* Top Guest Header Bar */}
      <header className="relative z-20 bg-[#0f1d3a]/80 border-b border-[#00f0ff]/20 px-4 sm:px-8 py-3 flex items-center justify-between backdrop-blur-md shadow-sm gap-4">
        {/* Brand Identity / Kapwa Logo */}
        <KapwaLogo />

        {/* Dual Telemetry Clocks */}
        <div className="hidden md:flex items-center">
          <DualTelemetryClocks />
        </div>

        {/* Header Right Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Sound FX Toggle */}
          <button
            onClick={onToggleSound}
            className="p-2 rounded-xl bg-[#0a1228]/80 border border-[#00f0ff]/25 text-[#00f0ff] hover:bg-[#00f0ff]/20 transition-all text-xs"
            title={soundEnabled ? 'Mute Sound FX' : 'Enable Sound FX'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-[#00f0ff]" /> : <VolumeX className="w-4 h-4 text-gray-400" />}
          </button>

          {/* Admin Management Portal Link */}
          <Link
            to="/admin"
            className="px-3.5 py-1.5 rounded-xl bg-[#00f0ff]/10 border border-[#00f0ff]/25 text-[#00f0ff] hover:bg-[#00f0ff]/20 transition-all text-xs font-medium flex items-center gap-1.5 shadow-sm"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-[#00f0ff]" />
            <span className="hidden sm:inline">Admin Portal</span>
          </Link>

          {/* User Auth Sync Status */}
          {currentUser ? (
            <button
              onClick={onSignOut}
              className="p-2 rounded-xl bg-[#0a1228]/80 border border-emerald-500/30 text-emerald-400 hover:text-red-400 transition-colors"
              title={`Signed in as ${currentUser.name || currentUser.email}. Click to sign out.`}
            >
              <UserIcon className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={onSignIn}
              className="p-2 rounded-xl bg-[#0a1228]/80 border border-[#00f0ff]/25 text-[#00f0ff] hover:bg-[#00f0ff]/20 transition-all"
              title="Sign in to Supabase"
            >
              <LogIn className="w-4 h-4" />
            </button>
          )}
        </div>
      </header>

      {/* Guest View Main Content Container */}
      <main className="relative z-10 flex-1 max-w-3xl w-full mx-auto px-4 py-8 sm:py-12 flex flex-col items-center justify-between space-y-8 sm:space-y-10">
        {/* Welcome Greeting Banner */}
        <div className="text-center space-y-2 max-w-xl mx-auto">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-medium text-white tracking-tight leading-tight">
            Hi, I'm <span className="text-[#00f0ff] font-medium">TALA</span>. How can I assist with your stay?
          </h2>
          <p className="text-xs sm:text-sm text-gray-300 font-normal leading-relaxed max-w-md mx-auto">
            Ask me about room amenities, local transportation, dining recommendations, or activities in San Vicente.
          </p>
        </div>

        {/* Centerpiece Interactive Arc Reactor HUD */}
        <div className="w-full flex justify-center my-2 sm:my-4">
          <ArcReactorHUD
            state={talaState}
            onCoreClick={onCoreClick}
            speechVolume={speechVolume}
            interimTranscript={interimTranscript}
          />
        </div>

        {/* Quick Hospitality Action Chips */}
        <div className="w-full max-w-lg flex flex-wrap items-center justify-center gap-2.5 pt-2">
          {GUEST_QUICK_CHIPS.map((chip, idx) => {
            const Icon = chip.icon;
            return (
              <button
                key={idx}
                onClick={() => onSendMessage(chip.prompt)}
                disabled={talaState === 'PROCESSING'}
                className="px-4 py-2 rounded-xl bg-[#0f1d3a]/90 hover:bg-[#00f0ff]/20 border border-[#00f0ff]/25 text-cyan-100 hover:text-white hover:border-[#00f0ff]/50 transition-all text-xs font-medium backdrop-blur-md shadow-sm active:scale-95 disabled:opacity-50 flex items-center gap-2 group"
              >
                <Icon className="w-3.5 h-3.5 text-[#00f0ff] group-hover:scale-110 transition-transform shrink-0" />
                <span>{chip.label}</span>
              </button>
            );
          })}
        </div>

        {/* Conversation Message Stream */}
        <div className="w-full max-w-2xl min-h-[160px] max-h-[340px] flex flex-col">
          <ConversationStream
            messages={messages}
            onSpeakText={(text) => onSendMessage(text)}
            isSpeakingNow={talaState === 'SPEAKING'}
          />
        </div>

        {/* Bottom Command Bar */}
        <div className="w-full max-w-2xl bg-[#0f1d3a]/90 border border-[#00f0ff]/25 rounded-2xl p-4 backdrop-blur-lg shadow-[0_10px_30px_rgba(0,0,0,0.4)]">
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
      <footer className="relative z-10 py-4 text-center text-xs font-light text-gray-400 border-t border-[#00f0ff]/10">
        BAIA Resort San Vicente • TALA Voice Assistant
      </footer>
    </div>
  );
};

