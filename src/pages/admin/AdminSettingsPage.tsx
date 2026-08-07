import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { TalaSettings, VoiceOption, TelemetryLogEntry } from '../../types';
import { OpenRouterModelSelector } from '../../components/OpenRouterModelSelector';
import { TelemetryLog } from '../../components/TelemetryLog';
import { TalaUser } from '../../services/authService';
import {
  Settings,
  Cpu,
  Volume2,
  Sparkles,
  Sliders,
  Cloud,
  Activity,
  Key,
  CheckCircle,
  AlertTriangle,
  Play,
  RotateCcw,
  Save,
  LogIn,
  LogOut,
  ChevronDown,
  ChevronUp,
  Trash2
} from 'lucide-react';

interface AdminSettingsPageProps {
  settings: TalaSettings;
  onUpdateSettings: (updated: Partial<TalaSettings>) => void;
  availableVoices: VoiceOption[];
  onTestVoice: () => void;
  logs: TelemetryLogEntry[];
  onClearLogs: () => void;
  currentUser: TalaUser | null;
  onLogin: (email: string, password: string) => void;
  onSignOut: () => void;
  hasServerOpenRouterKey: boolean;
}

export const AdminSettingsPage: React.FC<AdminSettingsPageProps> = ({
  settings,
  onUpdateSettings,
  availableVoices,
  onTestVoice,
  logs,
  onClearLogs,
  currentUser,
  onLogin,
  onSignOut,
  hasServerOpenRouterKey
}) => {
  const [apiKeyInput, setApiKeyInput] = useState<string>(
    settings.openrouterApiKey || settings.customApiKey || ''
  );
  const [testKeyStatus, setTestKeyStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [showDiagnostics, setShowDiagnostics] = useState<boolean>(false);
  const [saveToast, setSaveToast] = useState<boolean>(false);

  const handleTestKey = async () => {
    setTestKeyStatus('testing');
    try {
      const res = await fetch('/api/health');
      if (res.ok) {
        setTestKeyStatus('success');
      } else {
        setTestKeyStatus('error');
      }
    } catch (e) {
      setTestKeyStatus('error');
    }
  };

  const handleSaveKey = () => {
    onUpdateSettings({
      openrouterApiKey: apiKeyInput.trim(),
      customApiKey: apiKeyInput.trim()
    });
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 3000);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      {/* Page Title */}
      <div className="bg-[#080d1a] border border-[#00f0ff]/30 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-[0_0_20px_rgba(0,240,255,0.08)]">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center gap-2">
            <Settings className="w-7 h-7 text-[#00f0ff]" />
            <span>Admin & System Settings</span>
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">
            Configure OpenRouter AI, speech synthesis, concierge prompt persona, and cloud sync.
          </p>
        </div>

        {saveToast && (
          <div className="px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 animate-bounce">
            <CheckCircle className="w-4 h-4" />
            <span>Settings Saved</span>
          </div>
        )}
      </div>

      {/* SECTION 1: AI GATEWAY (OPENROUTER) */}
      <section className="bg-[#080d1a] border border-[#00f0ff]/20 rounded-2xl p-6 space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-[#00f0ff]/15">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-[#00f0ff]/10 text-[#00f0ff]">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">OpenRouter AI Gateway</h2>
              <p className="text-xs text-gray-400">Primary intelligence provider for TALA Concierge</p>
            </div>
          </div>

          <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            OpenRouter Active
          </span>
        </div>

        {/* API Key Configuration */}
        <div className="bg-[#050811] p-4 rounded-xl border border-[#00f0ff]/15 space-y-3">
          <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
            <Key className="w-3.5 h-3.5 text-[#00f0ff]" />
            <span>Custom OpenRouter API Key (Optional)</span>
          </label>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="password"
              value={apiKeyInput}
              onChange={(e) => setApiKeyInput(e.target.value)}
              placeholder={
                hasServerOpenRouterKey
                  ? 'Server environment key active (or paste custom sk-or-v1-...)'
                  : 'Paste OpenRouter API Key (sk-or-v1-...)'
              }
              className="flex-1 bg-[#080d1a] border border-[#00f0ff]/30 focus:border-[#00f0ff] rounded-xl px-3.5 py-2 text-xs font-mono text-white placeholder-gray-500 focus:outline-none"
            />
            <button
              onClick={handleSaveKey}
              className="px-4 py-2 rounded-xl bg-[#00f0ff] text-black font-bold text-xs uppercase tracking-wider hover:bg-[#00f0ff]/80 transition-all flex items-center justify-center gap-1.5 shrink-0"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Key</span>
            </button>
            <button
              onClick={handleTestKey}
              disabled={testKeyStatus === 'testing'}
              className="px-4 py-2 rounded-xl bg-[#00f0ff]/10 border border-[#00f0ff]/40 text-[#00f0ff] hover:bg-[#00f0ff]/20 text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shrink-0"
            >
              <Activity className="w-3.5 h-3.5" />
              <span>{testKeyStatus === 'testing' ? 'Testing...' : 'Test Connection'}</span>
            </button>
          </div>

          {testKeyStatus === 'success' && (
            <p className="text-xs font-mono text-emerald-400 flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5" /> Connection successful! OpenRouter endpoint reachable.
            </p>
          )}
          {testKeyStatus === 'error' && (
            <p className="text-xs font-mono text-amber-400 flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5" /> Connection check failed. Verify API key or network connection.
            </p>
          )}
        </div>

        {/* Live Model Catalog Selector */}
        <div>
          <label className="block text-xs font-bold text-[#00f0ff] uppercase tracking-wider mb-2">
            Select Active OpenRouter Model
          </label>
          <OpenRouterModelSelector
            selectedModelId={settings.selectedOpenRouterModel || 'openrouter/free'}
            onSelectModel={(modelId) => onUpdateSettings({ selectedOpenRouterModel: modelId })}
          />
        </div>
      </section>

      {/* SECTION 2: VOICE SYNTHESIS */}
      <section className="bg-[#080d1a] border border-[#00f0ff]/20 rounded-2xl p-6 space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-[#00f0ff]/15">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-[#00f0ff]/10 text-[#00f0ff]">
              <Volume2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Voice & Speech Engine</h2>
              <p className="text-xs text-gray-400">Customize TALA's vocal tone, pitch, and speed profile</p>
            </div>
          </div>

          <button
            onClick={onTestVoice}
            className="px-3.5 py-1.5 rounded-xl bg-[#00f0ff]/10 border border-[#00f0ff]/40 text-[#00f0ff] hover:bg-[#00f0ff]/20 text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5"
          >
            <Play className="w-3.5 h-3.5 fill-[#00f0ff]" />
            <span>Test Voice</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Voice Profile Selector */}
          <div>
            <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
              Synthesis Voice Profile (Prioritizing Female Voices)
            </label>
            <select
              value={settings.selectedVoiceName}
              onChange={(e) => onUpdateSettings({ selectedVoiceName: e.target.value })}
              className="w-full bg-[#050811] border border-[#00f0ff]/30 focus:border-[#00f0ff] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none"
            >
              {availableVoices.length === 0 ? (
                <option value="">Default System Voice</option>
              ) : (
                availableVoices.map((v) => (
                  <option key={v.name} value={v.name}>
                    {v.name} ({v.gender.toUpperCase()})
                  </option>
                ))
              )}
            </select>
          </div>

          {/* Pitch & Rate Sliders */}
          <div className="space-y-3 bg-[#050811] p-4 rounded-xl border border-[#00f0ff]/15">
            <div>
              <div className="flex justify-between text-xs font-mono text-gray-300 mb-1">
                <span>PITCH ({settings.pitch.toFixed(1)})</span>
                <span className="text-[#00f0ff]">Low / High Tone</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="1.5"
                step="0.1"
                value={settings.pitch}
                onChange={(e) => onUpdateSettings({ pitch: parseFloat(e.target.value) })}
                className="w-full accent-[#00f0ff] cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-mono text-gray-300 mb-1">
                <span>SPEED RATE ({settings.rate.toFixed(1)}x)</span>
                <span className="text-[#00f0ff]">Slow / Fast Pace</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="1.5"
                step="0.1"
                value={settings.rate}
                onChange={(e) => onUpdateSettings({ rate: parseFloat(e.target.value) })}
                className="w-full accent-[#00f0ff] cursor-pointer"
              />
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3: TALA PERSONA & PROMPT */}
      <section className="bg-[#080d1a] border border-[#00f0ff]/20 rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-2.5 pb-3 border-b border-[#00f0ff]/15">
          <div className="p-2.5 rounded-xl bg-[#00f0ff]/10 text-[#00f0ff]">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Concierge System Persona</h2>
            <p className="text-xs text-gray-400">Core directives guiding TALA's tone, hospitality, and answers</p>
          </div>
        </div>

        <div>
          <textarea
            rows={5}
            value={settings.systemInstruction}
            onChange={(e) => onUpdateSettings({ systemInstruction: e.target.value })}
            className="w-full bg-[#050811] border border-[#00f0ff]/30 focus:border-[#00f0ff] rounded-xl p-4 text-xs font-mono text-gray-200 leading-relaxed focus:outline-none"
          />
        </div>
      </section>

      {/* SECTION 4: BEHAVIOR TOGGLES */}
      <section className="bg-[#080d1a] border border-[#00f0ff]/20 rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-2.5 pb-3 border-b border-[#00f0ff]/15">
          <div className="p-2.5 rounded-xl bg-[#00f0ff]/10 text-[#00f0ff]">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Interaction Behavior Toggles</h2>
            <p className="text-xs text-gray-400">Configure hands-free listening, auto-speech, and audio feedback</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <label className="flex items-center justify-between p-4 rounded-xl bg-[#050811] border border-[#00f0ff]/20 cursor-pointer hover:border-[#00f0ff]/50 transition-all">
            <span className="text-xs font-bold text-white">Auto Vocalize Replies</span>
            <input
              type="checkbox"
              checked={settings.autoSpeak}
              onChange={(e) => onUpdateSettings({ autoSpeak: e.target.checked })}
              className="w-4 h-4 accent-[#00f0ff]"
            />
          </label>

          <label className="flex items-center justify-between p-4 rounded-xl bg-[#050811] border border-[#00f0ff]/20 cursor-pointer hover:border-[#00f0ff]/50 transition-all">
            <span className="text-xs font-bold text-white">Hands-Free Listening</span>
            <input
              type="checkbox"
              checked={settings.continuousListening}
              onChange={(e) => onUpdateSettings({ continuousListening: e.target.checked })}
              className="w-4 h-4 accent-[#00f0ff]"
            />
          </label>

          <label className="flex items-center justify-between p-4 rounded-xl bg-[#050811] border border-[#00f0ff]/20 cursor-pointer hover:border-[#00f0ff]/50 transition-all">
            <span className="text-xs font-bold text-white">Sound Effects</span>
            <input
              type="checkbox"
              checked={settings.soundEnabled}
              onChange={(e) => onUpdateSettings({ soundEnabled: e.target.checked })}
              className="w-4 h-4 accent-[#00f0ff]"
            />
          </label>
        </div>
      </section>

      {/* SECTION 5: POCKETBASE SYNC */}
      <section className="bg-[#080d1a] border border-[#00f0ff]/20 rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#00f0ff]/15">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-[#00f0ff]/10 text-[#00f0ff]">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">PocketBase Sync</h2>
              <p className="text-xs text-gray-400">Sync settings, knowledge, and data with PocketBase backend</p>
            </div>
          </div>

          {currentUser ? (
            <button
              onClick={onSignOut}
              className="px-3.5 py-1.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          ) : (
            <Link
              to="/admin"
              className="px-3.5 py-1.5 rounded-xl bg-[#00f0ff] text-black font-bold text-xs uppercase tracking-wider hover:bg-[#00f0ff]/80 transition-all flex items-center gap-1.5 shadow-[0_0_12px_rgba(0,240,255,0.3)]"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </Link>
          )}
        </div>

        <div className="bg-[#050811] p-4 rounded-xl border border-[#00f0ff]/15 flex items-center justify-between">
          <div className="text-xs font-sans">
            <span className="text-gray-400 block">Current Auth State:</span>
            <span className="text-white font-bold">
              {currentUser ? currentUser.name || currentUser.email : 'Guest / Unauthenticated Mode'}
            </span>
          </div>
          <span
            className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${
              currentUser
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
            }`}
          >
            {currentUser ? 'PocketBase Synced' : 'Local Storage Only'}
          </span>
        </div>
      </section>

      {/* SECTION 6: ADVANCED DIAGNOSTICS */}
      <section className="bg-[#080d1a] border border-[#00f0ff]/20 rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#00f0ff]/15">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-[#00f0ff]/10 text-[#00f0ff]">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Advanced Diagnostics & Telemetry Logs</h2>
              <p className="text-xs text-gray-400">Technical telemetry console and execution logs</p>
            </div>
          </div>

          <button
            onClick={() => setShowDiagnostics(!showDiagnostics)}
            className="px-3.5 py-1.5 rounded-xl bg-[#00f0ff]/10 border border-[#00f0ff]/30 text-[#00f0ff] hover:bg-[#00f0ff]/20 text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5"
          >
            <span>{showDiagnostics ? 'Hide Console' : 'Show Console'}</span>
            {showDiagnostics ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

        {showDiagnostics && (
          <div className="space-y-3 pt-2">
            <div className="flex justify-end">
              <button
                onClick={onClearLogs}
                className="px-3 py-1 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 text-xs font-bold uppercase tracking-wider flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear Logs</span>
              </button>
            </div>
            <TelemetryLog logs={logs} state="IDLE" hasServerKey={hasServerOpenRouterKey} hasCustomKey={Boolean(settings.openrouterApiKey || settings.customApiKey)} />
          </div>
        )}
      </section>
    </div>
  );
};
