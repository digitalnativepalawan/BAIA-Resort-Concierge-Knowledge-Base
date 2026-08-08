import React, { useState } from 'react';
import { TalaSettings, VoiceOption, TelemetryLogEntry, AdminUser } from '../../types';
import { OpenRouterModelSelector } from '../../components/OpenRouterModelSelector';
import { TelemetryLog } from '../../components/TelemetryLog';
import {
  Settings,
  Cpu,
  Volume2,
  Sparkles,
  Sliders,
  Database,
  Activity,
  Key,
  CheckCircle,
  AlertTriangle,
  Play,
  Save,
  LogIn,
  LogOut,
  ChevronDown,
  ChevronUp,
  Trash2,
  RotateCcw
} from 'lucide-react';

interface AdminSettingsPageProps {
  settings: TalaSettings;
  onUpdateSettings: (updated: Partial<TalaSettings>) => void;
  availableVoices: VoiceOption[];
  onTestVoice: () => void;
  logs: TelemetryLogEntry[];
  onClearLogs: () => void;
  currentUser: AdminUser | null;
  onSignIn: () => void;
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
  onSignIn,
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
    <div className="max-w-5xl mx-auto space-y-8 pb-12 font-inter">
      {/* Page Header */}
      <div className="bg-[#0d1b2b]/60 border border-[#00f0ff]/20 rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 backdrop-blur-md shadow-sm">
        <div>
          <h1 className="text-2xl sm:text-3xl font-medium text-white flex items-center gap-2.5 tracking-tight">
            <Settings className="w-6 h-6 sm:w-7 sm:h-7 text-[#00f0ff]" />
            <span>Admin & System Settings</span>
          </h1>
          <p className="text-xs sm:text-sm text-gray-300 font-normal mt-1">
            Configure OpenRouter AI, speech synthesis parameters, concierge persona, and cloud synchronization.
          </p>
        </div>

        {saveToast && (
          <div className="px-3.5 py-2 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-xs font-medium flex items-center gap-1.5 animate-bounce shrink-0">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <span>Settings Saved</span>
          </div>
        )}
      </div>

      {/* SECTION 1: AI GATEWAY (OPENROUTER) */}
      <section className="bg-[#0d1b2b]/60 border border-[#00f0ff]/20 rounded-2xl p-6 space-y-6 backdrop-blur-md shadow-sm">
        <div className="flex items-center justify-between pb-4 border-b border-[#00f0ff]/15">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#00f0ff]/10 text-[#00f0ff]">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-medium text-white">OpenRouter AI Gateway</h2>
              <p className="text-xs text-gray-400 font-normal">Primary intelligence provider for TALA Concierge</p>
            </div>
          </div>

          <span className="px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            OpenRouter Active
          </span>
        </div>

        {/* API Key Configuration */}
        <div className="bg-[#050b14]/70 p-4 rounded-xl border border-[#00f0ff]/15 space-y-3">
          <label className="block text-xs font-medium text-gray-300 flex items-center gap-1.5">
            <Key className="w-3.5 h-3.5 text-[#00f0ff]" />
            <span>Custom OpenRouter API Key (Optional)</span>
          </label>
          <div className="flex flex-col sm:flex-row gap-2.5">
            <input
              type="password"
              value={apiKeyInput}
              onChange={(e) => setApiKeyInput(e.target.value)}
              placeholder={
                hasServerOpenRouterKey
                  ? 'Server environment key active (or paste custom sk-or-v1-...)'
                  : 'Paste OpenRouter API Key (sk-or-v1-...)'
              }
              className="flex-1 bg-[#080d1a] border border-[#00f0ff]/20 focus:border-[#00f0ff]/50 rounded-xl px-4 py-2.5 text-xs text-white placeholder:text-gray-500 focus:outline-none transition-colors"
            />
            <button
              onClick={handleSaveKey}
              className="px-4 py-2.5 rounded-xl bg-[#00f0ff] text-slate-950 font-medium text-xs hover:bg-[#00f0ff]/80 transition-all flex items-center justify-center gap-1.5 shrink-0"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Key</span>
            </button>
            <button
              onClick={handleTestKey}
              disabled={testKeyStatus === 'testing'}
              className="px-4 py-2.5 rounded-xl bg-[#00f0ff]/10 border border-[#00f0ff]/25 text-[#00f0ff] hover:bg-[#00f0ff]/20 text-xs font-medium transition-all flex items-center justify-center gap-1.5 shrink-0"
            >
              <Activity className="w-3.5 h-3.5" />
              <span>{testKeyStatus === 'testing' ? 'Testing...' : 'Test Connection'}</span>
            </button>
          </div>

          {testKeyStatus === 'success' && (
            <p className="text-xs text-emerald-400 font-normal flex items-center gap-1.5 pt-1">
              <CheckCircle className="w-3.5 h-3.5" /> Connection successful! OpenRouter endpoint reachable.
            </p>
          )}
          {testKeyStatus === 'error' && (
            <p className="text-xs text-amber-400 font-normal flex items-center gap-1.5 pt-1">
              <AlertTriangle className="w-3.5 h-3.5" /> Connection check failed. Verify API key or network connection.
            </p>
          )}
        </div>

        {/* Live Model Catalog Selector */}
        <div className="space-y-2">
          <label className="block text-xs font-medium text-[#00f0ff] tracking-wide">
            Select Active OpenRouter Model
          </label>
          <OpenRouterModelSelector
            selectedModelId={settings.selectedOpenRouterModel || 'openrouter/free'}
            onSelectModel={(modelId) => onUpdateSettings({ selectedOpenRouterModel: modelId })}
          />
        </div>
      </section>

      {/* SECTION 2: VOICE SYNTHESIS */}
      <section className="bg-[#0d1b2b]/60 border border-[#00f0ff]/20 rounded-2xl p-6 space-y-6 backdrop-blur-md shadow-sm">
        <div className="flex items-center justify-between pb-4 border-b border-[#00f0ff]/15">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#00f0ff]/10 text-[#00f0ff]">
              <Volume2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-medium text-white">Voice & Speech Engine</h2>
              <p className="text-xs text-gray-400 font-normal">Customize TALA's vocal tone, pitch, and speed profile</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onUpdateSettings({ pitch: 1.0, rate: 1.0 })}
              className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 hover:bg-emerald-500/20 text-xs font-medium transition-all flex items-center gap-1.5"
              title="Reset Pitch (1.0) & Speed Rate (1.0) to natural human conversational baseline"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Natural Pitch/Speed (1.0)</span>
            </button>
            <button
              onClick={onTestVoice}
              className="px-3.5 py-1.5 rounded-xl bg-[#00f0ff]/10 border border-[#00f0ff]/25 text-[#00f0ff] hover:bg-[#00f0ff]/20 text-xs font-medium transition-all flex items-center gap-1.5"
            >
              <Play className="w-3.5 h-3.5 fill-[#00f0ff]" />
              <span>Test Voice</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Voice Profile Selector */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-300 mb-2 flex items-center justify-between">
                <span>Synthesis Voice Profile</span>
                <span className="text-[11px] text-[#00f0ff] font-normal">
                  {availableVoices.length} voices available
                </span>
              </label>

              {(() => {
                const cloudVoices = availableVoices.filter((v) => v.voiceURI?.startsWith('cloud-') || v.name.startsWith('TALA -'));
                const naturalFemale = availableVoices.filter((v) => !v.voiceURI?.startsWith('cloud-') && !v.name.startsWith('TALA -') && v.isNatural && v.gender === 'female');
                const standardFemale = availableVoices.filter((v) => !v.voiceURI?.startsWith('cloud-') && !v.name.startsWith('TALA -') && !v.isNatural && v.gender === 'female');
                const maleVoices = availableVoices.filter((v) => !v.voiceURI?.startsWith('cloud-') && !v.name.startsWith('TALA -') && v.gender === 'male');
                const otherVoices = availableVoices.filter((v) => !v.voiceURI?.startsWith('cloud-') && !v.name.startsWith('TALA -') && v.gender === 'unknown');

                const selectedVoice = availableVoices.find((v) => v.name === settings.selectedVoiceName);

                return (
                  <div className="space-y-3">
                    <select
                      value={settings.selectedVoiceName}
                      onChange={(e) => onUpdateSettings({ selectedVoiceName: e.target.value })}
                      className="w-full bg-[#050b14]/80 border border-[#00f0ff]/20 focus:border-[#00f0ff]/50 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none transition-colors"
                    >
                      {availableVoices.length === 0 ? (
                        <option value="">Default System Voice</option>
                      ) : (
                        <>
                          {cloudVoices.length > 0 && (
                            <optgroup label="🌟 TALA Cloud Natural Female Voices (Universal)">
                              {cloudVoices.map((v) => (
                                <option key={v.name} value={v.name}>
                                  {v.name} ({v.lang})
                                </option>
                              ))}
                            </optgroup>
                          )}
                          {naturalFemale.length > 0 && (
                            <optgroup label="Natural & Neural Female Voices (Browser)">
                              {naturalFemale.map((v) => (
                                <option key={v.name} value={v.name}>
                                  {v.name} ({v.lang})
                                </option>
                              ))}
                            </optgroup>
                          )}
                          {standardFemale.length > 0 && (
                            <optgroup label="Standard Female Voices (Browser)">
                              {standardFemale.map((v) => (
                                <option key={v.name} value={v.name}>
                                  {v.name} ({v.lang})
                                </option>
                              ))}
                            </optgroup>
                          )}
                          {maleVoices.length > 0 && (
                            <optgroup label="Male Voices (Browser)">
                              {maleVoices.map((v) => (
                                <option key={v.name} value={v.name}>
                                  {v.name} ({v.lang})
                                </option>
                              ))}
                            </optgroup>
                          )}
                          {otherVoices.length > 0 && (
                            <optgroup label="Other Voices">
                              {otherVoices.map((v) => (
                                <option key={v.name} value={v.name}>
                                  {v.name} ({v.lang})
                                </option>
                              ))}
                            </optgroup>
                          )}
                        </>
                      )}
                    </select>

                    {/* Active Voice Information Card */}
                    <div className="p-3.5 bg-[#050b14]/70 rounded-xl border border-[#00f0ff]/15 flex items-center justify-between gap-3 text-xs">
                      <div className="space-y-1 min-w-0">
                        <div className="text-gray-400 text-[10px] font-normal uppercase tracking-wider">Active Selection</div>
                        <div className="font-medium text-white truncate">
                          {settings.selectedVoiceName || 'Default System Voice'}
                        </div>
                        <div className="flex items-center gap-1.5 pt-0.5">
                          {selectedVoice?.isNatural && (
                            <span className="px-2 py-0.5 rounded-md bg-[#00f0ff]/10 border border-[#00f0ff]/25 text-[#00f0ff] text-[10px] font-medium">
                              Natural
                            </span>
                          )}
                          {selectedVoice?.gender === 'female' && (
                            <span className="px-2 py-0.5 rounded-md bg-pink-500/10 border border-pink-500/25 text-pink-300 text-[10px] font-medium">
                              Female
                            </span>
                          )}
                          <span className="text-[10px] text-gray-400 font-mono">
                            {selectedVoice?.lang || 'en-US'}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={onTestVoice}
                        className="px-3 py-1.5 rounded-lg bg-[#00f0ff] text-slate-950 font-medium text-xs hover:bg-[#00f0ff]/80 transition-all flex items-center gap-1 shrink-0"
                      >
                        <Play className="w-3 h-3 fill-slate-950" />
                        <span>Test</span>
                      </button>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>

          {/* Pitch & Rate Sliders */}
          <div className="space-y-4 bg-[#050b14]/70 p-4 rounded-xl border border-[#00f0ff]/15">
            <div>
              <div className="flex justify-between text-xs text-gray-300 mb-1.5 font-medium">
                <span>PITCH ({settings.pitch.toFixed(1)})</span>
                <span className="text-[#00f0ff]/90 font-normal">Low / High Tone</span>
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
              <div className="flex justify-between text-xs text-gray-300 mb-1.5 font-medium">
                <span>SPEED RATE ({settings.rate.toFixed(1)}x)</span>
                <span className="text-[#00f0ff]/90 font-normal">Slow / Fast Pace</span>
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
      <section className="bg-[#0d1b2b]/60 border border-[#00f0ff]/20 rounded-2xl p-6 space-y-4 backdrop-blur-md shadow-sm">
        <div className="flex items-center gap-3 pb-4 border-b border-[#00f0ff]/15">
          <div className="p-2.5 rounded-xl bg-[#00f0ff]/10 text-[#00f0ff]">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-medium text-white">Concierge System Persona</h2>
            <p className="text-xs text-gray-400 font-normal">Core directives guiding TALA's tone, hospitality, and answers</p>
          </div>
        </div>

        <div>
          <textarea
            rows={5}
            value={settings.systemInstruction}
            onChange={(e) => onUpdateSettings({ systemInstruction: e.target.value })}
            className="w-full bg-[#050b14]/80 border border-[#00f0ff]/20 focus:border-[#00f0ff]/50 rounded-xl p-4 text-xs text-gray-200 leading-relaxed focus:outline-none transition-colors"
          />
        </div>
      </section>

      {/* SECTION 4: BEHAVIOR TOGGLES */}
      <section className="bg-[#0d1b2b]/60 border border-[#00f0ff]/20 rounded-2xl p-6 space-y-4 backdrop-blur-md shadow-sm">
        <div className="flex items-center gap-3 pb-4 border-b border-[#00f0ff]/15">
          <div className="p-2.5 rounded-xl bg-[#00f0ff]/10 text-[#00f0ff]">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-medium text-white">Interaction Behavior Toggles</h2>
            <p className="text-xs text-gray-400 font-normal">Configure hands-free listening, auto-speech, and audio feedback</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <label className="flex items-center justify-between p-4 rounded-xl bg-[#050b14]/70 border border-[#00f0ff]/15 cursor-pointer hover:border-[#00f0ff]/40 transition-all">
            <span className="text-xs font-medium text-white">Auto Vocalize Replies</span>
            <input
              type="checkbox"
              checked={settings.autoSpeak}
              onChange={(e) => onUpdateSettings({ autoSpeak: e.target.checked })}
              className="w-4 h-4 accent-[#00f0ff] rounded cursor-pointer"
            />
          </label>

          <label className="flex items-center justify-between p-4 rounded-xl bg-[#050b14]/70 border border-[#00f0ff]/15 cursor-pointer hover:border-[#00f0ff]/40 transition-all">
            <span className="text-xs font-medium text-white">Hands-Free Listening</span>
            <input
              type="checkbox"
              checked={settings.continuousListening}
              onChange={(e) => onUpdateSettings({ continuousListening: e.target.checked })}
              className="w-4 h-4 accent-[#00f0ff] rounded cursor-pointer"
            />
          </label>

          <label className="flex items-center justify-between p-4 rounded-xl bg-[#050b14]/70 border border-[#00f0ff]/15 cursor-pointer hover:border-[#00f0ff]/40 transition-all">
            <span className="text-xs font-medium text-white">Sound Effects</span>
            <input
              type="checkbox"
              checked={settings.soundEnabled}
              onChange={(e) => onUpdateSettings({ soundEnabled: e.target.checked })}
              className="w-4 h-4 accent-[#00f0ff] rounded cursor-pointer"
            />
          </label>
        </div>
      </section>

      {/* SECTION 5: SUPABASE SYNC */}
      <section className="bg-[#0d1b2b]/60 border border-[#00f0ff]/20 rounded-2xl p-6 space-y-4 backdrop-blur-md shadow-sm">
        <div className="flex items-center justify-between pb-4 border-b border-[#00f0ff]/15">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#00f0ff]/10 text-[#00f0ff]">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-medium text-white">Supabase Cloud Sync</h2>
              <p className="text-xs text-gray-400 font-normal">Sync settings, messages, requests, and RAG knowledge base with Supabase</p>
            </div>
          </div>

          {currentUser ? (
            <button
              onClick={onSignOut}
              className="px-3.5 py-1.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 text-xs font-medium transition-all flex items-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Log Out</span>
            </button>
          ) : (
            <button
              onClick={onSignIn}
              className="px-3.5 py-1.5 rounded-xl bg-[#00f0ff] text-slate-950 font-medium text-xs hover:bg-[#00f0ff]/80 transition-all flex items-center gap-1.5 shadow-sm"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Supabase Login</span>
            </button>
          )}
        </div>

        <div className="bg-[#050b14]/70 p-4 rounded-xl border border-[#00f0ff]/15 flex items-center justify-between">
          <div className="text-xs">
            <span className="text-gray-400 block font-normal">Current Auth State:</span>
            <span className="text-white font-medium">
              {currentUser ? currentUser.name || currentUser.email : 'Supabase Real-Time Client Active'}
            </span>
          </div>
          <span
            className={`px-3 py-1 rounded-full text-xs font-medium border ${
              currentUser
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25'
                : 'bg-amber-500/10 text-amber-400 border-amber-500/25'
            }`}
          >
            {currentUser ? 'Cloud Synced' : 'Local Storage Only'}
          </span>
        </div>
      </section>

      {/* SECTION 6: ADVANCED DIAGNOSTICS */}
      <section className="bg-[#0d1b2b]/60 border border-[#00f0ff]/20 rounded-2xl p-6 space-y-4 backdrop-blur-md shadow-sm">
        <div className="flex items-center justify-between pb-4 border-b border-[#00f0ff]/15">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#00f0ff]/10 text-[#00f0ff]">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-medium text-white">Advanced Diagnostics & Telemetry Logs</h2>
              <p className="text-xs text-gray-400 font-normal">Technical telemetry console and execution logs</p>
            </div>
          </div>

          <button
            onClick={() => setShowDiagnostics(!showDiagnostics)}
            className="px-3.5 py-1.5 rounded-xl bg-[#00f0ff]/10 border border-[#00f0ff]/25 text-[#00f0ff] hover:bg-[#00f0ff]/20 text-xs font-medium transition-all flex items-center gap-1.5"
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
                className="px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 text-xs font-medium flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear Logs</span>
              </button>
            </div>
            <TelemetryLog logs={logs} />
          </div>
        )}
      </section>
    </div>
  );
};
