import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { NaturalAgentOrb } from '../components/NaturalAgentOrb';
import { AudioControlsHUD } from '../components/AudioControlsHUD';
import { ConversationStream } from '../components/ConversationStream';
import { CommandBar } from '../components/CommandBar';
import { KapwaLogo } from '../components/KapwaLogo';
import { ThemeSelectorModal } from '../components/ThemeSelectorModal';
import { RESORT_THEMES, ResortTheme, ResortThemeId } from '../data/themes';
import { TalaState, ChatMessage, AdminUser } from '../types';
import {
  Sparkles,
  Palette,
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
  Clock,
  Waves,
  Sun,
  ShieldCheck
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
  latencyMs?: number | null;
  audioStream?: MediaStream | null;
  volume?: number;
  onVolumeChange?: (volume: number) => void;
  speechRate?: number;
  onSpeechRateChange?: (rate: number) => void;
  onTestVoice?: () => void;
}

const GUEST_QUICK_CHIPS = [
  {
    icon: Utensils,
    label: 'Vegan & Dining Options',
    prompt: 'Do you have vegan, vegetarian, or local dining options at BAIA Ocean Table?'
  },
  {
    icon: Compass,
    label: 'Island Hopping & Tours',
    prompt: 'What island hopping tours, snorkeling, and water activities do you recommend in San Vicente?'
  },
  {
    icon: Bike,
    label: 'Motorbike & Long Beach',
    prompt: 'Can I rent a motorbike in San Vicente to explore the 14km Long Beach?'
  },
  {
    icon: Bus,
    label: 'Transfers & Shuttles',
    prompt: 'How do I arrange a shuttle transfer to El Nido, San Vicente Airport, or Puerto Princesa?'
  },
  {
    icon: Clock,
    label: 'Check-in & Villa Care',
    prompt: 'What are your check-in and checkout times, and how do I request fresh towels or housekeeping?'
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
  latencyMs,
  audioStream,
  volume = 1.0,
  onVolumeChange,
  speechRate = 1.0,
  onSpeechRateChange,
  onTestVoice
}) => {
  // Theme of the Day & Custom Wallpaper State
  const [selectedThemeId, setSelectedThemeId] = useState<ResortThemeId>(() => {
    const saved = localStorage.getItem('tala_resort_theme');
    if (saved && RESORT_THEMES.some((t) => t.id === saved)) {
      return saved as ResortThemeId;
    }
    return 'palawan_twilight';
  });

  const [customBgImage, setCustomBgImage] = useState<string | null>(() => {
    return localStorage.getItem('tala_custom_bg_image') || null;
  });

  const [bgDimLevel, setBgDimLevel] = useState<number>(() => {
    const saved = localStorage.getItem('tala_bg_dim_level');
    return saved ? parseFloat(saved) : 0.55;
  });

  const [isThemeModalOpen, setIsThemeModalOpen] = useState<boolean>(false);

  const activeTheme: ResortTheme =
    RESORT_THEMES.find((t) => t.id === selectedThemeId) || RESORT_THEMES[0];

  const handleSelectTheme = (themeId: ResortThemeId) => {
    setSelectedThemeId(themeId);
    localStorage.setItem('tala_resort_theme', themeId);
  };

  const handleUploadCustomBg = (base64Image: string) => {
    setCustomBgImage(base64Image);
    try {
      localStorage.setItem('tala_custom_bg_image', base64Image);
    } catch (e) {
      console.warn('Custom background exceeded localStorage limit, stored in memory.');
    }
  };

  const handleRemoveCustomBg = () => {
    setCustomBgImage(null);
    localStorage.removeItem('tala_custom_bg_image');
  };

  const handleChangeBgDim = (level: number) => {
    setBgDimLevel(level);
    localStorage.setItem('tala_bg_dim_level', level.toString());
  };

  // Find the latest speaking subtitle text
  const currentSubtitles =
    interimTranscript ||
    (talaState === 'SPEAKING' && messages.length > 0
      ? messages[messages.length - 1].content
      : undefined);

  return (
    <div
      className="min-h-screen text-[#f1f5f9] flex flex-col font-sans relative overflow-x-hidden transition-all duration-700 select-none"
      style={{
        background: customBgImage ? '#000000' : activeTheme.bgGradient,
      }}
    >
      {/* Custom Uploaded Background Photo Wallpaper */}
      {customBgImage && (
        <div
          className="fixed inset-0 pointer-events-none z-0 transition-opacity duration-1000"
          style={{
            backgroundImage: `url(${customBgImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: 'blur(0px)',
          }}
        >
          {/* Adjustable Dimming Overlay Tint for High Readability */}
          <div
            className="absolute inset-0 transition-colors duration-300"
            style={{ backgroundColor: `rgba(0, 0, 0, ${bgDimLevel})` }}
          />
        </div>
      )}

      {/* Subtle Bioluminescent Ambient Bloom Vignette */}
      <div
        className="fixed inset-0 pointer-events-none z-0 transition-opacity duration-700 opacity-60"
        style={{
          background: `radial-gradient(ellipse at 50% 30%, ${activeTheme.orbGlow} 0%, rgba(0,0,0,0) 70%)`,
        }}
      />

      {/* Top Resort Header Bar */}
      <header className="relative z-20 px-4 sm:px-8 py-3.5 flex items-center justify-between backdrop-blur-md border-b border-white/10 bg-black/20">
        {/* Brand Identity / Kapwa Logo */}
        <div className="flex items-center gap-3">
          <KapwaLogo />
          <div className="hidden lg:flex items-center gap-2 px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-gray-300">
            <span
              className="w-2 h-2 rounded-full animate-pulse"
              style={{ backgroundColor: activeTheme.accentColor }}
            />
            <span className="font-light tracking-wide">San Vicente, Palawan</span>
          </div>
        </div>

        {/* Header Right Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Theme & Wallpaper Selector Trigger */}
          <button
            onClick={() => setIsThemeModalOpen(true)}
            className="px-3 py-1.5 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/15 text-white transition-all text-xs font-medium flex items-center gap-2 backdrop-blur-lg shadow-sm group active:scale-95"
            title="Choose Theme of the Day or upload custom photo wallpaper"
          >
            <Palette className="w-3.5 h-3.5 group-hover:rotate-12 transition-transform" style={{ color: activeTheme.accentColor }} />
            <span className="hidden sm:inline font-normal">{customBgImage ? 'Custom Wallpaper' : activeTheme.name}</span>
            <span className="sm:hidden">Theme</span>
          </button>

          {/* Sound FX Toggle */}
          <button
            onClick={onToggleSound}
            className="p-2 rounded-2xl bg-white/5 hover:bg-white/15 border border-white/10 text-white/80 hover:text-white transition-all text-xs"
            title={soundEnabled ? 'Mute Interface Chimes' : 'Enable Interface Chimes'}
          >
            {soundEnabled ? (
              <Volume2 className="w-4 h-4" style={{ color: activeTheme.accentColor }} />
            ) : (
              <VolumeX className="w-4 h-4 text-gray-400" />
            )}
          </button>

          {/* Admin Management Portal Link */}
          <Link
            to="/admin"
            className="px-3 py-1.5 rounded-2xl bg-white/5 hover:bg-white/15 border border-white/10 text-gray-300 hover:text-white transition-all text-xs font-medium flex items-center gap-1.5"
            title="Open Admin Management & Brain Knowledge Portal"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-gray-400" />
            <span className="hidden md:inline">Admin</span>
          </Link>

          {/* User Auth Sync Status */}
          {currentUser ? (
            <button
              onClick={onSignOut}
              className="p-2 rounded-2xl bg-white/5 hover:bg-white/15 border border-emerald-500/30 text-emerald-400 hover:text-rose-400 transition-colors"
              title={`Signed in as ${currentUser.name || currentUser.email}. Click to sign out.`}
            >
              <UserIcon className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={onSignIn}
              className="p-2 rounded-2xl bg-white/5 hover:bg-white/15 border border-white/10 text-white/80 hover:text-white transition-all"
              title="Sign in to Admin / Staff Portal"
            >
              <LogIn className="w-4 h-4" />
            </button>
          )}
        </div>
      </header>

      {/* Guest View Main Sanctuary Container */}
      <main className="relative z-10 flex-1 max-w-3xl w-full mx-auto px-4 py-6 sm:py-10 flex flex-col items-center justify-between space-y-6 sm:space-y-8">
        
        {/* Warm Natural Greeting Banner */}
        <div className="text-center space-y-2 max-w-xl mx-auto animate-fadeIn">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-xs text-white/90 backdrop-blur-md mb-1 shadow-sm">
            <Sparkles className="w-3.5 h-3.5" style={{ color: activeTheme.accentColor }} />
            <span>AI Voice Concierge • BAIA Resort</span>
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-normal text-white tracking-tight leading-snug">
            Mabuhay! I'm <span className="font-semibold" style={{ color: activeTheme.accentColor }}>TALA</span>
          </h1>
          <p className="text-xs sm:text-sm text-gray-300 font-light leading-relaxed max-w-md mx-auto">
            Your personal resort companion. Speak freely with me for island dining, beach adventures, or villa amenities.
          </p>
        </div>

        {/* Centerpiece Natural Living Agent Orb */}
        <div className="w-full flex justify-center py-2">
          <NaturalAgentOrb
            state={talaState}
            onCoreClick={onCoreClick}
            speechVolume={speechVolume}
            isMicActive={talaState === 'LISTENING' || talaState === 'SPEAKING' || talaState === 'PROCESSING' || continuousListening}
            audioStream={audioStream}
            theme={activeTheme}
            subtitles={currentSubtitles}
          />
        </div>

        {/* Compact Real-Time Audio & Speech Rate Controller */}
        <div className="w-full flex justify-center">
          <AudioControlsHUD
            volume={volume}
            onVolumeChange={onVolumeChange}
            speechRate={speechRate}
            onSpeechRateChange={onSpeechRateChange}
            onTestVoice={onTestVoice}
            isSpeaking={talaState === 'SPEAKING'}
            theme={activeTheme}
          />
        </div>

        {/* Friendly Hospitality Recommendation Chips */}
        <div className="w-full max-w-xl flex flex-wrap items-center justify-center gap-2 pt-1">
          {GUEST_QUICK_CHIPS.map((chip, idx) => {
            const Icon = chip.icon;
            return (
              <button
                key={idx}
                onClick={() => onSendMessage(chip.prompt)}
                disabled={talaState === 'PROCESSING'}
                className="px-3.5 py-1.5 rounded-full bg-white/5 hover:bg-white/15 border border-white/10 text-white/90 hover:text-white transition-all text-xs font-normal backdrop-blur-md shadow-sm active:scale-95 disabled:opacity-40 flex items-center gap-2 group"
              >
                <Icon className="w-3.5 h-3.5 group-hover:scale-110 transition-transform shrink-0" style={{ color: activeTheme.accentColor }} />
                <span>{chip.label}</span>
              </button>
            );
          })}
        </div>

        {/* Conversation Dialogue Stream */}
        <div className="w-full max-w-2xl min-h-[140px] max-h-[300px] flex flex-col">
          <ConversationStream
            messages={messages}
            onSpeakText={(text) => onSendMessage(text)}
            isSpeakingNow={talaState === 'SPEAKING'}
          />
        </div>

        {/* Bottom Organic Command Bar */}
        <div className="w-full max-w-2xl bg-black/40 border border-white/10 rounded-3xl p-3.5 sm:p-4 backdrop-blur-xl shadow-2xl">
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

      {/* Theme and Custom Photo Wallpaper Modal */}
      <ThemeSelectorModal
        isOpen={isThemeModalOpen}
        onClose={() => setIsThemeModalOpen(false)}
        selectedThemeId={selectedThemeId}
        onSelectTheme={handleSelectTheme}
        customBgImage={customBgImage}
        onUploadCustomBg={handleUploadCustomBg}
        onRemoveCustomBg={handleRemoveCustomBg}
        bgDimLevel={bgDimLevel}
        onChangeBgDimLevel={handleChangeBgDim}
      />

      {/* Guest View Minimal Footer */}
      <footer className="relative z-10 py-4 text-center text-xs font-light text-gray-400 border-t border-white/5">
        BAIA Resort San Vicente, Palawan • TALA Natural Voice Concierge
      </footer>
    </div>
  );
};

