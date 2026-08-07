import React, { useState, useEffect } from 'react';
import { X, Key, Sliders, Volume2, Shield, RotateCcw, Check, Sparkles, Cpu, Radio, ShieldCheck, Zap } from 'lucide-react';
import { TalaSettings, VoiceOption, ApiProvider, ModelOption } from '../types';

interface SettingsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  settings: TalaSettings;
  onUpdateSettings: (newSettings: Partial<TalaSettings>) => void;
  voices: VoiceOption[];
  hasServerOpenRouterKey?: boolean;
  hasServerGeminiKey?: boolean;
  onTestVoice?: () => void;
}

const OPENROUTER_MODELS: ModelOption[] = [
  {
    id: 'openrouter/free',
    name: 'Auto Free Router (openrouter/free)',
    tier: 'free',
    provider: 'openrouter',
    description: 'Automatically routes queries to top performing zero-cost models.'
  },
  {
    id: 'meta-llama/llama-3.3-70b-instruct:free',
    name: 'Meta Llama 3.3 70B Instruct (Free)',
    tier: 'free',
    provider: 'openrouter',
    description: 'High intelligence 70B model with zero API charges.'
  },
  {
    id: 'google/gemini-2.5-flash',
    name: 'Google Gemini 2.5 Flash (Paid)',
    tier: 'ultra-fast',
    provider: 'openrouter',
    description: 'Ultra-low latency next-gen multimodal engine.'
  },
  {
    id: 'anthropic/claude-3.5-haiku',
    name: 'Anthropic Claude 3.5 Haiku (Paid)',
    tier: 'paid',
    provider: 'openrouter',
    description: 'Fast, precise, highly intelligent conversational model.'
  },
  {
    id: 'openai/gpt-4o-mini',
    name: 'OpenAI GPT-4o Mini (Paid)',
    tier: 'paid',
    provider: 'openrouter',
    description: 'Lightweight, rapid OpenAI model.'
  }
];

const GOOGLE_MODELS: ModelOption[] = [
  {
    id: 'gemini-1.5-flash',
    name: 'Gemini 1.5 Flash (Default)',
    tier: 'ultra-fast',
    provider: 'google',
    description: 'Fast, balanced Google AI Studio model.'
  },
  {
    id: 'gemini-2.0-flash',
    name: 'Gemini 2.0 Flash (Experimental)',
    tier: 'ultra-fast',
    provider: 'google',
    description: 'Next-gen flash architecture.'
  },
  {
    id: 'gemini-2.5-flash',
    name: 'Gemini 2.5 Flash',
    tier: 'paid',
    provider: 'google',
    description: 'High capacity Google AI model.'
  }
];

export const SettingsDrawer: React.FC<SettingsDrawerProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  voices,
  hasServerOpenRouterKey = false,
  hasServerGeminiKey = false,
  onTestVoice
}) => {
  const [openrouterKeyInput, setOpenrouterKeyInput] = useState(settings.openrouterApiKey || '');
  const [googleKeyInput, setGoogleKeyInput] = useState(settings.googleApiKey || '');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [onlyFemaleFilter, setOnlyFemaleFilter] = useState(true);

  // Sync internal state when settings prop updates externally
  useEffect(() => {
    setOpenrouterKeyInput(settings.openrouterApiKey || '');
    setGoogleKeyInput(settings.googleApiKey || '');
  }, [settings.openrouterApiKey, settings.googleApiKey]);

  if (!isOpen) return null;

  const activeProvider = settings.apiProvider || 'openrouter';

  // Check if current active provider key is ready
  const isKeyActive = activeProvider === 'openrouter'
    ? Boolean(openrouterKeyInput.trim() || settings.customApiKey?.trim() || hasServerOpenRouterKey)
    : Boolean(googleKeyInput.trim() || settings.customApiKey?.trim() || hasServerGeminiKey);

  const handleSaveKeys = () => {
    onUpdateSettings({
      openrouterApiKey: openrouterKeyInput.trim(),
      googleApiKey: googleKeyInput.trim(),
      customApiKey: activeProvider === 'openrouter' ? openrouterKeyInput.trim() : googleKeyInput.trim()
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  const handleClose = () => {
    handleSaveKeys();
    onClose();
  };

  const handleResetDefaults = () => {
    onUpdateSettings({
      pitch: 1.05,
      rate: 1.05,
      apiProvider: 'openrouter',
      openrouterApiKey: '',
      googleApiKey: '',
      selectedOpenRouterModel: 'openrouter/free',
      selectedGoogleModel: 'gemini-1.5-flash',
      customApiKey: '',
      systemInstruction:
        "You are TALA (Tactical Artificial Intelligence Assistant), a highly advanced sci-fi AI interface created to deliver precise, intelligent, concise tactical assessments and answers. Maintain a serene, confident, and professional futuristic persona. Keep responses direct, elegant, and well-structured, formatted for both audio vocalization and HUD screen display. Avoid conversational fluff or robotic repetition.",
      autoSpeak: true,
      soundEnabled: true,
      useHybridNeural: true,
    });
    setOpenrouterKeyInput('');
    setGoogleKeyInput('');
  };

  // Filter voices based on toggle
  const displayedVoices = onlyFemaleFilter
    ? voices.filter((v) => v.gender === 'female' || /(samantha|zira|victoria|karen|jenny|aria|eva|monica|serena|siri|female|google.*us|google.*uk|natural)/i.test(v.name))
    : voices;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/75 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-lg h-full bg-[#080d1a] border-l border-[#00f0ff]/30 p-6 flex flex-col justify-between overflow-y-auto text-gray-200 shadow-[0_0_50px_rgba(0,240,255,0.25)]">
        
        {/* Header */}
        <div>
          <div className="flex items-center justify-between pb-4 mb-6 border-b border-[#00f0ff]/20">
            <div className="flex items-center gap-2.5">
              <Sliders className="w-5 h-5 text-[#00f0ff]" />
              <h2 className="text-sm font-orbitron font-bold text-[#00f0ff] uppercase tracking-wider">
                TALA SYSTEM CONFIGURATION
              </h2>
            </div>
            <button
              onClick={handleClose}
              className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* REAL-TIME SYSTEM STATUS LED BADGE */}
          <div className="mb-6 p-3.5 rounded-xl bg-[#030712] border border-[#00f0ff]/30 flex items-center justify-between shadow-[0_0_15px_rgba(0,240,255,0.1)]">
            <div className="flex items-center gap-3">
              <span
                className={`w-3 h-3 rounded-full ${
                  isKeyActive
                    ? 'bg-[#10b981] shadow-[0_0_12px_#10b981] animate-pulse'
                    : 'bg-[#ef4444] shadow-[0_0_12px_#ef4444] animate-ping'
                }`}
              />
              <div className="flex flex-col">
                <span className="text-[10px] font-mono text-gray-400 uppercase tracking-wider">
                  REAL-TIME API CONNECTION
                </span>
                <span
                  className={`text-xs font-orbitron font-bold tracking-wider ${
                    isKeyActive ? 'text-emerald-400' : 'text-red-400'
                  }`}
                >
                  {isKeyActive ? '[ CONNECTED // READY ]' : '[ OFFLINE // MISSING KEY ]'}
                </span>
              </div>
            </div>
            <span className="text-[10px] font-mono text-cyan-300 bg-[#00f0ff]/10 px-2 py-1 rounded border border-[#00f0ff]/30 uppercase font-semibold">
              {activeProvider === 'openrouter' ? 'OPENROUTER PRIMARY' : 'GOOGLE BACKUP'}
            </span>
          </div>

          <div className="space-y-6">

            {/* 1. API PROVIDER SWITCH */}
            <div className="p-4 rounded-xl bg-[#050811] border border-[#00f0ff]/20 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-mono font-bold text-[#00f0ff] flex items-center gap-1.5 uppercase">
                  <Cpu className="w-4 h-4 text-[#00f0ff]" />
                  <span>LLM API Provider Switch</span>
                </label>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                {/* OpenRouter Button */}
                <button
                  type="button"
                  onClick={() => onUpdateSettings({ apiProvider: 'openrouter' })}
                  className={`p-3 rounded-lg border text-left transition-all flex flex-col justify-between ${
                    activeProvider === 'openrouter'
                      ? 'bg-[#00f0ff]/15 border-[#00f0ff] text-white shadow-[0_0_15px_rgba(0,240,255,0.25)]'
                      : 'bg-[#080d1a] border-[#00f0ff]/20 text-gray-400 hover:border-[#00f0ff]/50'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-xs font-orbitron font-bold text-[#00f0ff]">PRIMARY</span>
                    {activeProvider === 'openrouter' && (
                      <span className="w-2 h-2 rounded-full bg-[#00f0ff] shadow-[0_0_8px_#00f0ff]" />
                    )}
                  </div>
                  <span className="text-sm font-share font-bold text-white mt-1">OpenRouter AI</span>
                  <span className="text-[10px] font-mono text-gray-400 mt-0.5">OpenAI Compatible</span>
                </button>

                {/* Google AI Studio Button */}
                <button
                  type="button"
                  onClick={() => onUpdateSettings({ apiProvider: 'google' })}
                  className={`p-3 rounded-lg border text-left transition-all flex flex-col justify-between ${
                    activeProvider === 'google'
                      ? 'bg-[#ff007f]/15 border-[#ff007f] text-white shadow-[0_0_15px_rgba(255,0,127,0.25)]'
                      : 'bg-[#080d1a] border-[#00f0ff]/20 text-gray-400 hover:border-[#ff007f]/50'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-xs font-orbitron font-bold text-[#ff007f]">BACKUP</span>
                    {activeProvider === 'google' && (
                      <span className="w-2 h-2 rounded-full bg-[#ff007f] shadow-[0_0_8px_#ff007f]" />
                    )}
                  </div>
                  <span className="text-sm font-share font-bold text-white mt-1">Google AI Studio</span>
                  <span className="text-[10px] font-mono text-gray-400 mt-0.5">Gemini Engine</span>
                </button>
              </div>
            </div>

            {/* 2. OPENROUTER KEY & MODEL CONFIGURATION */}
            {activeProvider === 'openrouter' && (
              <div className="p-4 rounded-xl bg-[#050811] border border-[#00f0ff]/30 space-y-4">
                <div className="flex items-center justify-between border-b border-[#00f0ff]/20 pb-2">
                  <label className="text-xs font-mono font-bold text-[#00f0ff] flex items-center gap-1.5 uppercase">
                    <Key className="w-3.5 h-3.5" />
                    <span>OpenRouter API Key</span>
                  </label>
                  {openrouterKeyInput.trim() ? (
                    <span className="text-[10px] font-mono text-cyan-400 font-bold bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/30">
                      KEY ACTIVE
                    </span>
                  ) : hasServerOpenRouterKey ? (
                    <span className="text-[10px] font-mono text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                      SERVER KEY ACTIVE
                    </span>
                  ) : (
                    <span className="text-[10px] font-mono text-red-400 font-bold bg-red-500/10 px-2 py-0.5 rounded border border-red-500/30">
                      NO KEY ENTERED
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="password"
                    value={openrouterKeyInput}
                    onChange={(e) => {
                      setOpenrouterKeyInput(e.target.value);
                      onUpdateSettings({ openrouterApiKey: e.target.value.trim() });
                    }}
                    onBlur={handleSaveKeys}
                    placeholder="sk-or-v1-..."
                    className="flex-1 px-3 py-2 bg-[#080d1a] border border-[#00f0ff]/30 focus:border-[#00f0ff] rounded-lg text-xs font-mono text-white placeholder-gray-600 focus:outline-none"
                  />
                  <button
                    onClick={handleSaveKeys}
                    className="px-3 py-2 bg-[#00f0ff] hover:bg-[#00f0ff]/80 text-slate-950 font-mono font-bold text-xs rounded-lg transition-colors flex items-center gap-1 shrink-0"
                  >
                    {savedSuccess ? <Check className="w-3.5 h-3.5" /> : null}
                    <span>SAVE</span>
                  </button>
                </div>

                {/* OpenRouter Model Selector Dropdown */}
                <div className="space-y-1.5 pt-1">
                  <label className="text-[11px] font-mono font-bold text-cyan-200 flex items-center justify-between">
                    <span>OPENROUTER MODEL SELECTOR</span>
                    <span className="text-[9px] text-gray-400 font-normal">Free & Paid Tiers</span>
                  </label>
                  <select
                    value={settings.selectedOpenRouterModel || 'openrouter/free'}
                    onChange={(e) => onUpdateSettings({ selectedOpenRouterModel: e.target.value })}
                    className="w-full px-3 py-2.5 bg-[#080d1a] border border-[#00f0ff]/40 rounded-lg text-xs font-mono text-white focus:outline-none focus:border-[#00f0ff]"
                  >
                    {OPENROUTER_MODELS.map((m) => (
                      <option key={m.id} value={m.id}>
                        [{m.tier.toUpperCase()}] {m.name}
                      </option>
                    ))}
                  </select>
                  <p className="text-[10px] text-gray-400 font-mono italic">
                    {OPENROUTER_MODELS.find(m => m.id === settings.selectedOpenRouterModel)?.description || 'Selected OpenRouter model endpoint.'}
                  </p>
                </div>
              </div>
            )}

            {/* 3. GOOGLE AI STUDIO BACKUP CONFIGURATION */}
            {activeProvider === 'google' && (
              <div className="p-4 rounded-xl bg-[#050811] border border-[#ff007f]/30 space-y-4">
                <div className="flex items-center justify-between border-b border-[#ff007f]/20 pb-2">
                  <label className="text-xs font-mono font-bold text-[#ff007f] flex items-center gap-1.5 uppercase">
                    <Key className="w-3.5 h-3.5" />
                    <span>Google AI Studio API Key</span>
                  </label>
                  {googleKeyInput.trim() ? (
                    <span className="text-[10px] font-mono text-pink-400 font-bold bg-pink-500/10 px-2 py-0.5 rounded border border-pink-500/30">
                      KEY ACTIVE
                    </span>
                  ) : hasServerGeminiKey ? (
                    <span className="text-[10px] font-mono text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                      SERVER KEY ACTIVE
                    </span>
                  ) : (
                    <span className="text-[10px] font-mono text-red-400 font-bold bg-red-500/10 px-2 py-0.5 rounded border border-red-500/30">
                      NO KEY ENTERED
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="password"
                    value={googleKeyInput}
                    onChange={(e) => {
                      setGoogleKeyInput(e.target.value);
                      onUpdateSettings({ googleApiKey: e.target.value.trim() });
                    }}
                    onBlur={handleSaveKeys}
                    placeholder="AIzaSy..."
                    className="flex-1 px-3 py-2 bg-[#080d1a] border border-[#ff007f]/30 focus:border-[#ff007f] rounded-lg text-xs font-mono text-white placeholder-gray-600 focus:outline-none"
                  />
                  <button
                    onClick={handleSaveKeys}
                    className="px-3 py-2 bg-[#ff007f] hover:bg-[#ff007f]/80 text-white font-mono font-bold text-xs rounded-lg transition-colors flex items-center gap-1 shrink-0"
                  >
                    {savedSuccess ? <Check className="w-3.5 h-3.5" /> : null}
                    <span>SAVE</span>
                  </button>
                </div>

                {/* Google Backup Model Selector */}
                <div className="space-y-1.5 pt-1">
                  <label className="text-[11px] font-mono font-bold text-pink-200">
                    GOOGLE GEMINI MODEL
                  </label>
                  <select
                    value={settings.selectedGoogleModel || 'gemini-1.5-flash'}
                    onChange={(e) => onUpdateSettings({ selectedGoogleModel: e.target.value })}
                    className="w-full px-3 py-2.5 bg-[#080d1a] border border-[#ff007f]/40 rounded-lg text-xs font-mono text-white focus:outline-none focus:border-[#ff007f]"
                  >
                    {GOOGLE_MODELS.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* 4. TEST VOICE DIAGNOSTIC BUTTON */}
            <div className="p-4 rounded-xl bg-[#030712] border border-[#00f0ff]/40 space-y-3 shadow-[0_0_20px_rgba(0,240,255,0.15)]">
              <div className="flex items-center justify-between">
                <label className="text-xs font-mono font-bold text-[#00f0ff] flex items-center gap-1.5 uppercase">
                  <Sparkles className="w-4 h-4 text-[#00f0ff] animate-pulse" />
                  <span>Voice & Neural Diagnostic</span>
                </label>
              </div>

              <p className="text-[11px] text-gray-300 leading-relaxed font-mono">
                Run an immediate local vocalization diagnostic test using the selected female browser voice profile.
              </p>

              <button
                type="button"
                onClick={() => {
                  if (onTestVoice) onTestVoice();
                }}
                className="w-full py-3 bg-gradient-to-r from-[#00f0ff] to-[#00a2ff] text-slate-950 font-orbitron font-bold text-xs rounded-lg shadow-[0_0_20px_rgba(0,240,255,0.4)] hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2 uppercase tracking-wider"
              >
                <Radio className="w-4 h-4 text-slate-950 animate-pulse" />
                <span>TEST VOICE DIAGNOSTIC</span>
              </button>
            </div>

            {/* 5. VOICE PROFILE SELECTOR */}
            <div className="space-y-2.5 p-3 bg-[#050811] border border-[#00f0ff]/20 rounded-xl">
              <div className="flex items-center justify-between">
                <label className="text-xs font-mono font-bold text-[#00f0ff] flex items-center gap-1.5 uppercase">
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>Female Voice Profile</span>
                </label>
                <button
                  onClick={() => setOnlyFemaleFilter(!onlyFemaleFilter)}
                  className="text-[10px] font-mono px-2 py-0.5 rounded border border-[#00f0ff]/30 text-[#00f0ff] bg-[#00f0ff]/10 hover:bg-[#00f0ff]/20 transition-colors"
                >
                  {onlyFemaleFilter ? "SHOW ALL VOICES" : "FILTER FEMALE VOICES"}
                </button>
              </div>

              <select
                value={settings.selectedVoiceName}
                onChange={(e) => onUpdateSettings({ selectedVoiceName: e.target.value })}
                className="w-full px-3 py-2.5 bg-[#080d1a] border border-[#00f0ff]/30 rounded-lg text-xs font-mono text-gray-200 focus:outline-none focus:border-[#00f0ff]"
              >
                {displayedVoices.length === 0 ? (
                  <option value="">Default Browser Voice</option>
                ) : (
                  displayedVoices.map((v) => (
                    <option key={v.voiceURI} value={v.name}>
                      {v.name} ({v.lang}) {v.gender === 'female' ? '★ Natural Female' : ''}
                    </option>
                  ))
                )}
              </select>
            </div>

            {/* 6. PITCH & SPEED SLIDERS */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-gray-400">PITCH:</span>
                  <span className="text-[#00f0ff] font-bold">{settings.pitch.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="1.5"
                  step="0.05"
                  value={settings.pitch}
                  onChange={(e) => onUpdateSettings({ pitch: parseFloat(e.target.value) })}
                  className="w-full accent-[#00f0ff] bg-[#050811] h-1.5 rounded"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-gray-400">SPEED RATE:</span>
                  <span className="text-[#00f0ff] font-bold">{settings.rate.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="0.7"
                  max="1.4"
                  step="0.05"
                  value={settings.rate}
                  onChange={(e) => onUpdateSettings({ rate: parseFloat(e.target.value) })}
                  className="w-full accent-[#00f0ff] bg-[#050811] h-1.5 rounded"
                />
              </div>
            </div>

            {/* 7. SYSTEM PERSONA INSTRUCTIONS */}
            <div className="space-y-2">
              <label className="text-xs font-mono font-bold text-[#00f0ff] flex items-center gap-1.5 uppercase">
                <Shield className="w-3.5 h-3.5" />
                <span>TALA System Persona Instructions</span>
              </label>
              <textarea
                rows={4}
                value={settings.systemInstruction}
                onChange={(e) => onUpdateSettings({ systemInstruction: e.target.value })}
                className="w-full p-3 bg-[#050811] border border-[#00f0ff]/30 rounded-lg text-xs font-mono text-gray-300 focus:outline-none focus:border-[#00f0ff] resize-none"
              />
            </div>

            {/* 8. TOGGLES */}
            <div className="space-y-3 pt-2">
              <label className="flex items-center justify-between text-xs font-mono cursor-pointer select-none p-2 rounded bg-[#050811] border border-[#00f0ff]/20">
                <div className="flex flex-col">
                  <span className="text-gray-200 font-bold">HYBRID NEURAL SYNTHESIS</span>
                  <span className="text-[10px] text-cyan-400/80">Low-latency, natural vocalization tuning</span>
                </div>
                <input
                  type="checkbox"
                  checked={settings.useHybridNeural}
                  onChange={(e) => onUpdateSettings({ useHybridNeural: e.target.checked })}
                  className="w-4 h-4 rounded border-[#00f0ff] text-[#00f0ff] focus:ring-0 bg-[#050811]"
                />
              </label>

              <label className="flex items-center justify-between text-xs font-mono cursor-pointer select-none">
                <span className="text-gray-300">AUTO-VOCALIZE RESPONSES</span>
                <input
                  type="checkbox"
                  checked={settings.autoSpeak}
                  onChange={(e) => onUpdateSettings({ autoSpeak: e.target.checked })}
                  className="w-4 h-4 rounded border-[#00f0ff] text-[#00f0ff] focus:ring-0 bg-[#050811]"
                />
              </label>

              <label className="flex items-center justify-between text-xs font-mono cursor-pointer select-none">
                <span className="text-gray-300">SCI-FI AUDIO CHIMES & SFX</span>
                <input
                  type="checkbox"
                  checked={settings.soundEnabled}
                  onChange={(e) => onUpdateSettings({ soundEnabled: e.target.checked })}
                  className="w-4 h-4 rounded border-[#00f0ff] text-[#00f0ff] focus:ring-0 bg-[#050811]"
                />
              </label>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-6 border-t border-[#00f0ff]/20 flex items-center justify-between">
          <button
            onClick={handleResetDefaults}
            className="flex items-center gap-1 text-xs font-mono text-gray-400 hover:text-white transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>RESET DEFAULTS</span>
          </button>

          <button
            onClick={handleClose}
            className="px-5 py-2.5 bg-gradient-to-r from-[#00f0ff] to-[#00a2ff] text-slate-950 font-orbitron font-bold text-xs rounded-lg shadow-[0_0_15px_rgba(0,240,255,0.3)] transition-transform active:scale-95 uppercase tracking-wider"
          >
            CLOSE SETTINGS
          </button>
        </div>
      </div>
    </div>
  );
};
