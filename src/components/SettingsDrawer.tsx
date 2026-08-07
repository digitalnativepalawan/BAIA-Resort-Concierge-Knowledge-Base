import React, { useState, useEffect } from 'react';
import { X, Key, Sliders, Volume2, Shield, RotateCcw, Check, Sparkles, Cpu, Radio, ShieldCheck, Zap, Info, Play } from 'lucide-react';
import { TalaSettings, VoiceOption } from '../types';
import { OpenRouterModelSelector } from './OpenRouterModelSelector';

interface SettingsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  settings: TalaSettings;
  onUpdateSettings: (newSettings: Partial<TalaSettings>) => void;
  voices: VoiceOption[];
  hasServerOpenRouterKey?: boolean;
  onTestVoice?: () => void;
}

const DEFAULT_SYSTEM_INSTRUCTION =
  "You are TALA, the AI concierge for BAIA. You help guests with questions about their stay, the property, local transportation, food, activities, San Vicente, and information contained in the BAIA knowledge base. Speak naturally, warmly, clearly, and concisely. Prioritize information from the supplied BAIA knowledge base. Never invent property information when the knowledge base does not contain the answer. When appropriate, tell the guest that staff can assist.";

export const SettingsDrawer: React.FC<SettingsDrawerProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  voices,
  hasServerOpenRouterKey = false,
  onTestVoice
}) => {
  const [openrouterKeyInput, setOpenrouterKeyInput] = useState(settings.openrouterApiKey || '');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; msg: string } | null>(null);
  const [onlyFemaleFilter, setOnlyFemaleFilter] = useState(true);

  // Sync internal state when settings prop updates externally
  useEffect(() => {
    setOpenrouterKeyInput(settings.openrouterApiKey || '');
  }, [settings.openrouterApiKey]);

  if (!isOpen) return null;

  const isKeyActive = Boolean(
    openrouterKeyInput.trim() || settings.customApiKey?.trim() || hasServerOpenRouterKey
  );

  const handleSaveKeys = () => {
    onUpdateSettings({
      openrouterApiKey: openrouterKeyInput.trim(),
      customApiKey: openrouterKeyInput.trim()
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  const handleTestConnection = async () => {
    setTestingConnection(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          openrouterApiKey: openrouterKeyInput.trim(),
          model: settings.selectedOpenRouterModel || 'openrouter/free',
          prompt: 'Connection test string. Respond with single word "ONLINE".',
          systemInstruction: 'Respond with "ONLINE".'
        })
      });
      const data = await res.json();
      if (res.ok && data.responseText) {
        setTestResult({ success: true, msg: `Connection verified (${data.model || 'OpenRouter'}).` });
      } else {
        setTestResult({ success: false, msg: data.error || 'Connection failed.' });
      }
    } catch (err: any) {
      setTestResult({ success: false, msg: err.message || 'Network test failed.' });
    } finally {
      setTestingConnection(false);
    }
  };

  const handleClose = () => {
    handleSaveKeys();
    onClose();
  };

  const handleResetDefaults = () => {
    onUpdateSettings({
      pitch: 1.05,
      rate: 1.05,
      openrouterApiKey: '',
      selectedOpenRouterModel: 'openrouter/free',
      customApiKey: '',
      systemInstruction: DEFAULT_SYSTEM_INSTRUCTION,
      autoSpeak: true,
      soundEnabled: true,
      useHybridNeural: true,
      continuousListening: false,
    });
    setOpenrouterKeyInput('');
    setTestResult(null);
  };

  // Filter voices
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

          {/* REAL-TIME SYSTEM STATUS BADGE */}
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
                  AI CONNECTION
                </span>
                <span
                  className={`text-xs font-orbitron font-bold tracking-wider ${
                    isKeyActive ? 'text-emerald-400' : 'text-red-400'
                  }`}
                >
                  {isKeyActive ? '● CONNECTED' : '● DISCONNECTED'}
                </span>
              </div>
            </div>
            <span className="text-[10px] font-mono text-cyan-300 bg-[#00f0ff]/10 px-2.5 py-1 rounded border border-[#00f0ff]/30 uppercase font-semibold">
              OpenRouter AI
            </span>
          </div>

          <div className="space-y-6">

            {/* 1. OPENROUTER API KEY CONFIGURATION */}
            <div className="p-4 rounded-xl bg-[#050811] border border-[#00f0ff]/30 space-y-3">
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
                  type="button"
                  onClick={handleSaveKeys}
                  className="px-3 py-2 bg-[#00f0ff] hover:bg-[#00f0ff]/80 text-slate-950 font-mono font-bold text-xs rounded-lg transition-colors flex items-center gap-1 shrink-0"
                >
                  {savedSuccess ? <Check className="w-3.5 h-3.5" /> : null}
                  <span>SAVE</span>
                </button>
              </div>

              <div className="pt-1 flex items-center justify-between">
                <p className="text-[10px] text-gray-400 font-mono">
                  {hasServerOpenRouterKey
                    ? 'Using server-configured environment key by default.'
                    : 'Enter your personal key or rely on server deployment.'}
                </p>
                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={testingConnection}
                  className="px-2.5 py-1 bg-[#00f0ff]/10 hover:bg-[#00f0ff]/20 border border-[#00f0ff]/40 text-[#00f0ff] text-[10px] font-mono font-bold rounded transition-colors flex items-center gap-1 shrink-0"
                >
                  {testingConnection ? (
                    <Sparkles className="w-3 h-3 animate-spin text-[#00f0ff]" />
                  ) : (
                    <Zap className="w-3 h-3 text-[#00f0ff]" />
                  )}
                  <span>TEST CONNECTION</span>
                </button>
              </div>

              {testResult && (
                <div
                  className={`p-2 rounded text-[10px] font-mono border ${
                    testResult.success
                      ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
                      : 'bg-red-500/10 border-red-500/40 text-red-300'
                  }`}
                >
                  {testResult.msg}
                </div>
              )}
            </div>

            {/* 2. LIVE OPENROUTER MODEL SELECTOR */}
            <div className="space-y-2">
              <label className="text-xs font-mono font-bold text-[#00f0ff] flex items-center gap-1.5 uppercase">
                <Cpu className="w-4 h-4 text-[#00f0ff]" />
                <span>OpenRouter Model Catalog</span>
              </label>

              <OpenRouterModelSelector
                selectedModelId={settings.selectedOpenRouterModel || 'openrouter/free'}
                onSelectModel={(modelId) => onUpdateSettings({ selectedOpenRouterModel: modelId })}
              />
            </div>

            {/* 3. VOICE DIAGNOSTIC & PROFILE */}
            <div className="p-4 rounded-xl bg-[#030712] border border-[#00f0ff]/40 space-y-3 shadow-[0_0_20px_rgba(0,240,255,0.15)]">
              <div className="flex items-center justify-between">
                <label className="text-xs font-mono font-bold text-[#00f0ff] flex items-center gap-1.5 uppercase">
                  <Sparkles className="w-4 h-4 text-[#00f0ff] animate-pulse" />
                  <span>Voice & Neural Diagnostic</span>
                </label>
              </div>

              <p className="text-[11px] text-gray-300 leading-relaxed font-mono">
                Run a vocalization test using the selected female browser voice profile.
              </p>

              <button
                type="button"
                onClick={() => {
                  if (onTestVoice) onTestVoice();
                }}
                className="w-full py-2.5 bg-gradient-to-r from-[#00f0ff] to-[#00a2ff] text-slate-950 font-orbitron font-bold text-xs rounded-lg shadow-[0_0_20px_rgba(0,240,255,0.4)] hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2 uppercase tracking-wider"
              >
                <Radio className="w-4 h-4 text-slate-950 animate-pulse" />
                <span>TEST VOICE DIAGNOSTIC</span>
              </button>
            </div>

            {/* VOICE SELECTOR */}
            <div className="space-y-2.5 p-3 bg-[#050811] border border-[#00f0ff]/20 rounded-xl">
              <div className="flex items-center justify-between">
                <label className="text-xs font-mono font-bold text-[#00f0ff] flex items-center gap-1.5 uppercase">
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>Female Voice Profile</span>
                </label>
                <button
                  type="button"
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

            {/* PITCH & SPEED SLIDERS */}
            <div className="grid grid-cols-2 gap-4 p-3 bg-[#050811] border border-[#00f0ff]/20 rounded-xl">
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
                  className="w-full accent-[#00f0ff] bg-[#050811] h-1.5 rounded cursor-pointer"
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
                  className="w-full accent-[#00f0ff] bg-[#050811] h-1.5 rounded cursor-pointer"
                />
              </div>
            </div>

            {/* 4. TALA PERSONA INSTRUCTIONS */}
            <div className="space-y-2">
              <label className="text-xs font-mono font-bold text-[#00f0ff] flex items-center justify-between uppercase">
                <span className="flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5" />
                  <span>TALA System Persona Instructions</span>
                </span>
                <button
                  type="button"
                  onClick={() => onUpdateSettings({ systemInstruction: DEFAULT_SYSTEM_INSTRUCTION })}
                  className="text-[9px] font-mono text-cyan-400 underline hover:text-white"
                >
                  RESET TO BAIA DEFAULT
                </button>
              </label>
              <textarea
                rows={4}
                value={settings.systemInstruction}
                onChange={(e) => onUpdateSettings({ systemInstruction: e.target.value })}
                className="w-full p-3 bg-[#050811] border border-[#00f0ff]/30 rounded-lg text-xs font-mono text-gray-300 focus:outline-none focus:border-[#00f0ff] resize-none"
              />
            </div>

            {/* 5. BEHAVIOR TOGGLES */}
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

              <label className="flex items-center justify-between text-xs font-mono cursor-pointer select-none p-2 rounded bg-[#050811] border border-[#00f0ff]/20">
                <span className="text-gray-300 font-bold">AUTO-VOCALIZE RESPONSES</span>
                <input
                  type="checkbox"
                  checked={settings.autoSpeak}
                  onChange={(e) => onUpdateSettings({ autoSpeak: e.target.checked })}
                  className="w-4 h-4 rounded border-[#00f0ff] text-[#00f0ff] focus:ring-0 bg-[#050811]"
                />
              </label>

              <label className="flex items-center justify-between text-xs font-mono cursor-pointer select-none p-2 rounded bg-[#050811] border border-[#00f0ff]/20">
                <span className="text-gray-300 font-bold">SCI-FI AUDIO CHIMES & SFX</span>
                <input
                  type="checkbox"
                  checked={settings.soundEnabled}
                  onChange={(e) => onUpdateSettings({ soundEnabled: e.target.checked })}
                  className="w-4 h-4 rounded border-[#00f0ff] text-[#00f0ff] focus:ring-0 bg-[#050811]"
                />
              </label>
            </div>

            {/* 6. ADVANCED DIAGNOSTICS */}
            <div className="p-3 rounded-xl bg-[#030712] border border-[#00f0ff]/20 space-y-2">
              <label className="text-[10px] font-mono font-bold text-gray-400 flex items-center gap-1 uppercase">
                <Info className="w-3.5 h-3.5 text-[#00f0ff]" />
                <span>ADVANCED DIAGNOSTICS</span>
              </label>
              <div className="text-[10px] font-mono text-gray-400 space-y-1">
                <p>Engine: OpenRouter Unified Gateway</p>
                <p>Selected Model ID: {settings.selectedOpenRouterModel || 'openrouter/free'}</p>
                <p>Web Speech API: Available</p>
                <p>Cloud Storage: Enabled</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-6 border-t border-[#00f0ff]/20 flex items-center justify-between">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="flex items-center gap-1 text-xs font-mono text-gray-400 hover:text-white transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>RESET DEFAULTS</span>
          </button>

          <button
            type="button"
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
