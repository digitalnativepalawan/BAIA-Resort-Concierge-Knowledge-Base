import React, { useState, useRef } from 'react';
import { TalaSettings, VoiceOption, TelemetryLogEntry, AdminUser, KnowledgeFile, KnowledgeCategory } from '../../types';
import { OpenRouterModelSelector } from '../../components/OpenRouterModelSelector';
import { TelemetryLog } from '../../components/TelemetryLog';
import { speechEngine, VoiceTestSuiteSummary } from '../../lib/speechEngine';
import { isSupabaseConfigured } from '../../lib/supabase';
import { openrouter } from '../../lib/openrouter';
import {
  DEFAULT_KNOWLEDGE_TXT,
  DEFAULT_KNOWLEDGE_MD,
  DEFAULT_KNOWLEDGE_JSON,
  downloadFile,
  downloadKnowledgeZip,
  downloadTalaBrainMd,
  downloadAgenticBrainTemplate
} from '../../data/knowledgeTemplate';
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
  RotateCcw,
  BookOpen,
  FileText,
  FileCode,
  FileJson,
  Download,
  FolderArchive,
  Upload,
  FolderTree,
  Zap
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
  knowledgeFiles?: KnowledgeFile[];
  onUploadKnowledgeFile?: (file: File, category?: KnowledgeCategory) => void;
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
  hasServerOpenRouterKey,
  knowledgeFiles = [],
  onUploadKnowledgeFile
}) => {
  const [apiKeyInput, setApiKeyInput] = useState<string>(
    settings.openrouterApiKey || settings.customApiKey || ''
  );
  const [testKeyStatus, setTestKeyStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [showDiagnostics, setShowDiagnostics] = useState<boolean>(false);
  const [saveToast, setSaveToast] = useState<boolean>(false);
  const [testSuiteSummary, setTestSuiteSummary] = useState<VoiceTestSuiteSummary | null>(null);
  const [runningTestSuite, setRunningTestSuite] = useState<boolean>(false);
  const [knowledgeNotice, setKnowledgeNotice] = useState<string | null>(null);
  const settingsFileInputRef = useRef<HTMLInputElement>(null);
  const settingsFolderInputRef = useRef<HTMLInputElement>(null);

  const handleDownloadMasterBrain = () => {
    let faqs: any[] = [];
    try {
      const saved = localStorage.getItem('tala_guest_faqs');
      if (saved) faqs = JSON.parse(saved);
    } catch (e) {}
    downloadTalaBrainMd(knowledgeFiles, faqs);
    setKnowledgeNotice('Downloaded TALA Agentic Knowledge Brain (tala_knowledge_brain.md)!');
    setTimeout(() => setKnowledgeNotice(null), 4000);
  };

  const handleDownloadFullTxt = () => {
    let text = DEFAULT_KNOWLEDGE_TXT;
    if (knowledgeFiles && knowledgeFiles.length > 0) {
      text = knowledgeFiles
        .map(
          (f) =>
            `====================================================================\nDOCUMENT: ${f.name} (Category: ${f.category || 'General'})\n====================================================================\n${f.content}\n`
        )
        .join('\n\n');
    }
    downloadFile(text, 'knowledge.txt', 'text/plain');
  };

  const handleDownloadFullMd = () => {
    let md = DEFAULT_KNOWLEDGE_MD;
    if (knowledgeFiles && knowledgeFiles.length > 0) {
      md = knowledgeFiles
        .map(
          (f) =>
            `# ${f.name}\n*Category: ${f.category || 'General'}*\n\n${f.content}\n\n---`
        )
        .join('\n\n');
    }
    downloadFile(md, 'knowledge.md', 'text/markdown');
  };

  const handleDownloadFullJson = () => {
    let jsonStr = DEFAULT_KNOWLEDGE_JSON;
    if (knowledgeFiles && knowledgeFiles.length > 0) {
      const list = knowledgeFiles.map((f) => {
        try {
          return { name: f.name, category: f.category || 'General', data: JSON.parse(f.content) };
        } catch {
          return { name: f.name, category: f.category || 'General', content: f.content };
        }
      });
      jsonStr = JSON.stringify(list, null, 2);
    }
    downloadFile(jsonStr, 'knowledge.json', 'application/json');
  };

  const handleDownloadTemplateTxt = () => {
    downloadFile(DEFAULT_KNOWLEDGE_TXT, 'knowledge_template.txt', 'text/plain');
  };

  const handleDownloadTemplateMd = () => {
    downloadFile(DEFAULT_KNOWLEDGE_MD, 'knowledge_template.md', 'text/markdown');
  };

  const handleDownloadTemplateJson = () => {
    downloadFile(DEFAULT_KNOWLEDGE_JSON, 'knowledge_template.json', 'application/json');
  };

  const handleDownloadBulkZip = async () => {
    await downloadKnowledgeZip(knowledgeFiles);
  };

  const handleSaveTemplateToBackend = () => {
    if (onUploadKnowledgeFile) {
      try {
        const txtFile = new File([DEFAULT_KNOWLEDGE_TXT], 'knowledge.txt', { type: 'text/plain' });
        const mdFile = new File([DEFAULT_KNOWLEDGE_MD], 'knowledge.md', { type: 'text/markdown' });
        const jsonFile = new File([DEFAULT_KNOWLEDGE_JSON], 'knowledge.json', { type: 'application/json' });

        onUploadKnowledgeFile(txtFile, 'Property');
        onUploadKnowledgeFile(mdFile, 'Property');
        onUploadKnowledgeFile(jsonFile, 'Property');

        setKnowledgeNotice('Saved knowledge.txt, knowledge.md & knowledge.json templates to backend!');
        setTimeout(() => setKnowledgeNotice(null), 4000);
      } catch (e) {
        setKnowledgeNotice('Saved template knowledge files');
        setTimeout(() => setKnowledgeNotice(null), 4000);
      }
    } else {
      setKnowledgeNotice('Knowledge base service active. Templates downloaded for reference.');
      setTimeout(() => setKnowledgeNotice(null), 4000);
    }
  };

  const handleRunVoiceTestSuite = () => {
    setRunningTestSuite(true);
    setTimeout(() => {
      const summary = speechEngine.runVoiceTestSuite();
      setTestSuiteSummary(summary);
      setRunningTestSuite(false);
    }, 150);
  };

  const handleTestKey = async () => {
    setTestKeyStatus('testing');
    try {
      if (isSupabaseConfigured()) {
        setTestKeyStatus('success');
      } else if (apiKeyInput.trim()) {
        await openrouter.sendChatPrompt({
          openrouterApiKey: apiKeyInput.trim(),
          prompt: 'Ping'
        });
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
      <div className="bg-[#0f1d3a]/80 border border-[#00f0ff]/20 rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 backdrop-blur-md shadow-sm">
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
      <section className="bg-[#0f1d3a]/80 border border-[#00f0ff]/20 rounded-2xl p-6 space-y-6 backdrop-blur-md shadow-sm">
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
        <div className="bg-[#070e20] p-4 rounded-xl border border-[#00f0ff]/15 space-y-3">
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
              className="flex-1 bg-[#0a1228] border border-[#00f0ff]/20 focus:border-[#00f0ff]/50 rounded-xl px-4 py-2.5 text-xs text-white placeholder:text-gray-500 focus:outline-none transition-colors"
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

        {/* Ollama Local Host Configuration */}
        <div className="bg-[#070e20] p-4 rounded-xl border border-[#00f0ff]/15 space-y-3">
          <label className="block text-xs font-medium text-gray-300 flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5 text-[#00f0ff]" />
            <span>Ollama Local Machine Server URL (Optional)</span>
          </label>
          <input
            type="text"
            value={settings.ollamaHost || 'http://localhost:11434'}
            onChange={(e) => onUpdateSettings({ ollamaHost: e.target.value.trim() })}
            placeholder="http://localhost:11434"
            className="w-full bg-[#0a1228] border border-[#00f0ff]/20 focus:border-[#00f0ff]/50 rounded-xl px-4 py-2.5 text-xs text-white placeholder:text-gray-500 focus:outline-none transition-colors font-mono"
          />
          <p className="text-[11px] text-gray-400 font-mono">
            When an Ollama model is selected below (e.g. Ollama Llama 3.2), queries route directly to your local machine.
          </p>
        </div>

        {/* Live Model Catalog Selector */}
        <div className="space-y-2">
          <label className="block text-xs font-medium text-[#00f0ff] tracking-wide">
            Select Active OpenRouter (Free/Paid) or Ollama Local Model
          </label>
          <OpenRouterModelSelector
            selectedModelId={settings.selectedOpenRouterModel || 'openrouter/free'}
            onSelectModel={(modelId) => onUpdateSettings({ selectedOpenRouterModel: modelId })}
          />
        </div>
      </section>

      {/* SECTION 2: VOICE SYNTHESIS */}
      <section className="bg-[#0f1d3a]/80 border border-[#00f0ff]/20 rounded-2xl p-6 space-y-6 backdrop-blur-md shadow-sm">
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

          <div className="flex flex-wrap items-center gap-2">
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
            <button
              onClick={handleRunVoiceTestSuite}
              disabled={runningTestSuite}
              className="px-3.5 py-1.5 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-300 hover:bg-purple-500/25 text-xs font-medium transition-all flex items-center gap-1.5 disabled:opacity-50"
            >
              <Activity className="w-3.5 h-3.5 text-purple-400" />
              <span>{runningTestSuite ? 'Running Test Suite...' : 'Run Voice Mapping & Persistence Test Suite'}</span>
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
                            <optgroup label="TALA Cloud Natural Female Voices (Universal)">
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

        {testSuiteSummary && (
          <div className="p-4 rounded-xl bg-[#050b14]/80 border border-purple-500/30 space-y-3 animate-fadeIn">
            <div className="flex items-center justify-between pb-2 border-b border-purple-500/20">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-semibold text-white uppercase tracking-wider">
                  Voice Profile & Persistence Test Suite Results
                </span>
              </div>
              <div className="flex items-center gap-2 text-[11px]">
                <span className="px-2.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono font-medium">
                  {testSuiteSummary.passCount} / {testSuiteSummary.totalTests} Passed
                </span>
                {testSuiteSummary.failCount > 0 && (
                  <span className="px-2.5 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/20 font-mono font-medium">
                    {testSuiteSummary.failCount} Failed
                  </span>
                )}
                <span className="text-gray-400 font-mono text-[10px]">
                  {new Date(testSuiteSummary.timestamp).toLocaleTimeString()}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              {testSuiteSummary.results.map((res) => (
                <div
                  key={res.testId}
                  className="p-3 rounded-lg bg-[#0d1b2b]/80 border border-[#00f0ff]/10 text-xs flex items-start justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="font-medium text-gray-200 flex items-center gap-2">
                      <span>{res.testName}</span>
                      {res.resolvedVoiceType && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-[#00f0ff]/10 text-[#00f0ff]">
                          {res.resolvedVoiceType}
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-gray-400 leading-relaxed">{res.details}</div>
                  </div>
                  <span
                    className={`shrink-0 px-2 py-0.5 rounded text-[10px] font-mono font-semibold ${
                      res.passed
                        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                        : 'bg-red-500/15 text-red-400 border border-red-500/30'
                    }`}
                  >
                    {res.passed ? 'PASSED' : 'FAILED'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* SECTION 3: TALA PERSONA & PROMPT */}
      <section className="bg-[#0f1d3a]/80 border border-[#00f0ff]/20 rounded-2xl p-6 space-y-4 backdrop-blur-md shadow-sm">
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
            className="w-full bg-[#070e20] border border-[#00f0ff]/20 focus:border-[#00f0ff]/50 rounded-xl p-4 text-xs text-gray-200 leading-relaxed focus:outline-none transition-colors"
          />
        </div>
      </section>

      {/* SECTION 4: GROUNDING KNOWLEDGE BASE & MASTER BRAIN */}
      <section className="bg-[#0f1d3a]/80 border border-[#00f0ff]/20 rounded-2xl p-6 space-y-5 backdrop-blur-md shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#00f0ff]/15">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#00f0ff]/10 text-[#00f0ff]">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-medium text-white flex items-center gap-2">
                <span>Grounding Knowledge Base & Agentic Brain</span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                  <Zap className="w-3 h-3 text-emerald-400" />
                  Live Grounding
                </span>
              </h2>
              <p className="text-xs text-gray-400 font-normal">
                Upload knowledge files or ICM folders to wire directly into TALA's autonomous AI brain.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {/* 1-BUTTON TEMPLATE DOWNLOAD */}
            <button
              type="button"
              onClick={() => {
                downloadAgenticBrainTemplate();
                setKnowledgeNotice('Downloaded Agentic Brain Template (tala_agentic_brain_template.md). Fill it out and upload to feed TALA!');
                setTimeout(() => setKnowledgeNotice(null), 5000);
              }}
              className="px-4 py-2.5 rounded-xl bg-[#070e20] hover:bg-[#13234d] text-[#00f0ff] border border-[#00f0ff]/40 font-bold text-xs uppercase tracking-wider flex items-center gap-2 shrink-0 transition-all cursor-pointer"
              title="Download pre-structured Agentic Knowledge Template to fill and upload"
            >
              <Download className="w-4 h-4 text-[#00f0ff]" />
              <span>Download Brain Template (.md)</span>
            </button>

            {/* PRIMARY BUTTON: UPLOAD TO TALA BRAIN */}
            <button
              type="button"
              onClick={() => settingsFileInputRef.current?.click()}
              className="px-5 py-2.5 rounded-xl bg-[#00f0ff] hover:bg-[#00f0ff]/80 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center gap-2 shrink-0 transition-all shadow-[0_0_20px_rgba(0,240,255,0.35)] cursor-pointer"
              title="Upload knowledge files, folders, or markdown to feed TALA's AI Brain"
            >
              <Upload className="w-4 h-4 text-slate-950" />
              <span>Upload to TALA Brain</span>
            </button>
          </div>
        </div>

        {knowledgeNotice && (
          <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-2 animate-fadeIn">
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{knowledgeNotice}</span>
          </div>
        )}

        {/* DUAL UPLOAD ACTIONS: FOLDER vs FILES */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => settingsFolderInputRef.current?.click()}
            className="p-4 rounded-xl bg-[#070e20] hover:bg-[#0d1838] border border-[#00f0ff]/30 text-left transition-all group cursor-pointer flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-[#00f0ff]/10 text-[#00f0ff] group-hover:bg-[#00f0ff] group-hover:text-slate-950 transition-colors">
                <FolderTree className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-white group-hover:text-[#00f0ff] transition-colors">
                  Upload ICM / Modular Folder
                </h3>
                <p className="text-[11px] text-gray-400">
                  Upload entire folder hierarchy (e.g. <span className="font-mono text-gray-300">01_dining/</span>, <span className="font-mono text-gray-300">02_rooms/</span>)
                </p>
              </div>
            </div>
            <span className="text-[10px] font-mono font-semibold px-2 py-1 rounded bg-[#00f0ff]/10 text-[#00f0ff] border border-[#00f0ff]/20">
              Folder
            </span>
          </button>

          <button
            type="button"
            onClick={() => settingsFileInputRef.current?.click()}
            className="p-4 rounded-xl bg-[#070e20] hover:bg-[#0d1838] border border-gray-700 hover:border-[#00f0ff]/40 text-left transition-all group cursor-pointer flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-400 group-hover:text-slate-950 transition-colors">
                <Upload className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-white group-hover:text-emerald-400 transition-colors">
                  Upload Knowledge Files / ZIP
                </h3>
                <p className="text-[11px] text-gray-400">
                  Supports .icm, .md, .txt, .json, .zip, .pdf, .docx, .csv
                </p>
              </div>
            </div>
            <span className="text-[10px] font-mono font-semibold px-2 py-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Files
            </span>
          </button>
        </div>

        <div className="bg-[#070e20] border-2 border-dashed border-[#00f0ff]/20 rounded-2xl p-5 text-center space-y-2">
          <input
            type="file"
            ref={settingsFileInputRef}
            multiple
            accept=".icm,.md,.markdown,.txt,.png,.jpg,.jpeg,.zip,.pdf,.docx,.doc,.csv"
            onChange={(e) => {
              if (e.target.files && onUploadKnowledgeFile) {
                Array.from(e.target.files).forEach((f) => onUploadKnowledgeFile(f, 'Property'));
                setKnowledgeNotice(`Uploaded ${e.target.files.length} knowledge file(s) into TALA!`);
                setTimeout(() => setKnowledgeNotice(null), 4000);
              }
            }}
            className="hidden"
          />
          <input
            type="file"
            ref={settingsFolderInputRef}
            // @ts-ignore
            webkitdirectory=""
            directory=""
            multiple
            onChange={(e) => {
              if (e.target.files && onUploadKnowledgeFile) {
                Array.from(e.target.files).forEach((f) => onUploadKnowledgeFile(f, 'Property'));
                setKnowledgeNotice(`Uploaded ${e.target.files.length} knowledge file(s) from folder into TALA!`);
                setTimeout(() => setKnowledgeNotice(null), 4000);
              }
            }}
            className="hidden"
          />

          <p className="text-xs font-bold text-[#00f0ff] uppercase tracking-wider">
            Supports: .MD · .ICM · .TXT · .JSON · .ZIP · .PDF · .DOCX · .CSV · FOLDERS
          </p>
          <p className="text-xs text-gray-400">
            {knowledgeFiles.length} active knowledge sources currently wired into TALA's AI brain
          </p>
        </div>
      </section>

      {/* SECTION 4: BEHAVIOR TOGGLES */}
      <section className="bg-[#0f1d3a]/80 border border-[#00f0ff]/20 rounded-2xl p-6 space-y-4 backdrop-blur-md shadow-sm">
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
          <label className="flex items-center justify-between p-4 rounded-xl bg-[#070e20] border border-[#00f0ff]/15 cursor-pointer hover:border-[#00f0ff]/40 transition-all">
            <span className="text-xs font-medium text-white">Auto Vocalize Replies</span>
            <input
              type="checkbox"
              checked={settings.autoSpeak}
              onChange={(e) => onUpdateSettings({ autoSpeak: e.target.checked })}
              className="w-4 h-4 accent-[#00f0ff] rounded cursor-pointer"
            />
          </label>

          <label className="flex items-center justify-between p-4 rounded-xl bg-[#070e20] border border-[#00f0ff]/15 cursor-pointer hover:border-[#00f0ff]/40 transition-all">
            <span className="text-xs font-medium text-white">Hands-Free Listening</span>
            <input
              type="checkbox"
              checked={settings.continuousListening}
              onChange={(e) => onUpdateSettings({ continuousListening: e.target.checked })}
              className="w-4 h-4 accent-[#00f0ff] rounded cursor-pointer"
            />
          </label>

          <label className="flex items-center justify-between p-4 rounded-xl bg-[#070e20] border border-[#00f0ff]/15 cursor-pointer hover:border-[#00f0ff]/40 transition-all">
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
      <section className="bg-[#0f1d3a]/80 border border-[#00f0ff]/20 rounded-2xl p-6 space-y-4 backdrop-blur-md shadow-sm">
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

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-medium text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Database Sync Active</span>
          </div>
        </div>

        <div className="bg-[#070e20] p-4 rounded-xl border border-[#00f0ff]/15 flex items-center justify-between">
          <div className="text-xs">
            <span className="text-gray-400 block font-normal">Database Engine Status:</span>
            <span className="text-white font-medium">
              BAIA Knowledge Engine Active
            </span>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-medium border bg-emerald-500/10 text-emerald-400 border-emerald-500/25">
            Real-Time Storage Connected
          </span>
        </div>
      </section>

      {/* SECTION 6: ADVANCED DIAGNOSTICS */}
      <section className="bg-[#0f1d3a]/80 border border-[#00f0ff]/20 rounded-2xl p-6 space-y-4 backdrop-blur-md shadow-sm">
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
