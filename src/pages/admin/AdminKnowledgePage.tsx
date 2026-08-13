import React, { useState, useRef, useMemo, useEffect } from 'react';
import { ChatMessage, KnowledgeFile, KnowledgeCategory, KnowledgeProcessingStatus, TalaSettings } from '../../types';
import { INITIAL_GUEST_FAQS, FaqItem } from '../../data/defaultFaqs';
import { knowledgeService } from '../../services/knowledgeService';
import { settingsService } from '../../services/settingsService';
import {
  BookOpen,
  Upload,
  FileText,
  Trash2,
  Eye,
  EyeOff,
  CheckCircle2,
  RefreshCw,
  Download,
  Save,
  Search,
  X,
  MessageSquare,
  Plus,
  Edit3,
  Filter,
  Check,
  Cpu,
  Settings,
  ToggleLeft,
  ToggleRight,
  Sliders,
  FileUp,
  Type,
  FileJson,
  Sparkles,
  HelpCircle,
  Database
} from 'lucide-react';

interface AdminKnowledgePageProps {
  files: KnowledgeFile[];
  messages?: ChatMessage[];
  onUploadFile?: (file: File, category?: KnowledgeCategory) => void;
  onDeleteFile: (id: string) => void;
  onUpdateCategory?: (id: string, newCategory: KnowledgeCategory) => void;
  onRefreshFiles?: () => void;
}

const RESORT_CATEGORIES: KnowledgeCategory[] = [
  'Property',
  'Rooms',
  'Amenities',
  'Food & Breakfast',
  'House Rules',
  'Check-in & Checkout',
  'Transportation',
  'Tours & Activities',
  'Local Area',
  'Housekeeping',
  'Maintenance',
  'Policies',
  'Emergency Information',
  'Other',
];

const AVAILABLE_MODELS = [
  { id: 'cohere/command-r-plus:free', name: 'Cohere: North Mind Code (free) [FREE] [256k]', free: true },
  { id: 'google/gemini-2.5-flash:free', name: 'Google: Gemini 2.5 Flash (free) [FREE] [1M]', free: true },
  { id: 'google/gemini-2.0-flash-001', name: 'Google: Gemini 2.0 Flash [1M]', free: false },
  { id: 'meta-llama/llama-3.3-70b-instruct:free', name: 'Meta: Llama 3.3 70B Instruct (free) [FREE] [128k]', free: true },
  { id: 'anthropic/claude-3.5-sonnet', name: 'Anthropic: Claude 3.5 Sonnet [200k]', free: false },
  { id: 'deepseek/deepseek-r1:free', name: 'DeepSeek: DeepSeek R1 (free) [FREE] [128k]', free: true },
  { id: 'openai/gpt-4o-mini', name: 'OpenAI: GPT-4o Mini [128k]', free: false },
];

export const AdminKnowledgePage: React.FC<AdminKnowledgePageProps> = ({
  files,
  onDeleteFile,
  onUpdateCategory,
  onRefreshFiles
}) => {
  const [activeTab, setActiveTab] = useState<'faq_memory' | 'documents' | 'quick_type'>('faq_memory');
  const [localFiles, setLocalFiles] = useState<KnowledgeFile[]>(files);
  const [noticeMessage, setNoticeMessage] = useState<string | null>(null);

  // Agent Settings State
  const [showSettings, setShowSettings] = useState<boolean>(true);
  const [aiProvider, setAiProvider] = useState<'openrouter' | 'ollama'>('openrouter');
  const [apiKey, setApiKey] = useState<string>(() => {
    return localStorage.getItem('openrouter_api_key') || localStorage.getItem('tala_openrouter_api_key') || '********aF75';
  });
  const [showApiKey, setShowApiKey] = useState<boolean>(false);
  const [selectedModel, setSelectedModel] = useState<string>('cohere/command-r-plus:free');
  const [showFreeOnly, setShowFreeOnly] = useState<boolean>(true);
  const [temperature, setTemperature] = useState<number>(0.2);
  const [maxTokens, setMaxTokens] = useState<number>(500);
  const [isSavingSettings, setIsSavingSettings] = useState<boolean>(false);

  // Guest FAQ Memory State
  const [faqs, setFaqs] = useState<FaqItem[]>(() => {
    try {
      const saved = localStorage.getItem('tala_guest_faqs');
      if (saved) {
        const parsed: FaqItem[] = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const existingQuestions = new Set(parsed.map(f => f.question.toLowerCase().trim()));
          const missingDefaults = INITIAL_GUEST_FAQS.filter(
            f => !existingQuestions.has(f.question.toLowerCase().trim())
          );
          if (missingDefaults.length > 0) {
            return [...parsed, ...missingDefaults];
          }
          return parsed;
        }
      }
    } catch (e) {}
    return INITIAL_GUEST_FAQS;
  });

  // Save FAQs to localStorage whenever updated
  useEffect(() => {
    try {
      localStorage.setItem('tala_guest_faqs', JSON.stringify(faqs));
    } catch (e) {}
  }, [faqs]);

  // Sync files prop
  useEffect(() => {
    setLocalFiles(files);
  }, [files]);

  // Quick Add Answer Form State
  const [newQuestion, setNewQuestion] = useState<string>('');
  const [newKeywords, setNewKeywords] = useState<string>('');
  const [newAnswer, setNewAnswer] = useState<string>('');
  const [newCategory, setNewCategory] = useState<KnowledgeCategory>('Food & Breakfast');

  // Search and Filter State
  const [faqSearch, setFaqSearch] = useState<string>('');
  const [faqCategoryFilter, setFaqCategoryFilter] = useState<'All' | KnowledgeCategory>('All');

  // Inline Edit State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editQuestion, setEditQuestion] = useState<string>('');
  const [editKeywords, setEditKeywords] = useState<string>('');
  const [editAnswer, setEditAnswer] = useState<string>('');

  // Quick Type Raw Knowledge State
  const [typeTitle, setTypeTitle] = useState<string>('');
  const [typeCategory, setTypeCategory] = useState<KnowledgeCategory>('Property');
  const [typeContent, setTypeContent] = useState<string>('');
  const [isSavingTypedKnowledge, setIsSavingTypedKnowledge] = useState<boolean>(false);

  // File Upload State
  const [uploadCategory, setUploadCategory] = useState<KnowledgeCategory>('Property');
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [uploadNotice, setUploadNotice] = useState<string | null>(null);
  const [docSearch, setDocSearch] = useState<string>('');
  const [docCategoryFilter, setDocCategoryFilter] = useState<'All' | KnowledgeCategory>('All');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const importInputRef = useRef<HTMLInputElement>(null);

  // Filtered FAQs
  const filteredFaqs = useMemo(() => {
    return faqs.filter((item) => {
      const matchesSearch =
        item.question.toLowerCase().includes(faqSearch.toLowerCase()) ||
        item.answer.toLowerCase().includes(faqSearch.toLowerCase()) ||
        item.keywords.toLowerCase().includes(faqSearch.toLowerCase());
      const matchesCat = faqCategoryFilter === 'All' || item.category === faqCategoryFilter;
      return matchesSearch && matchesCat;
    });
  }, [faqs, faqSearch, faqCategoryFilter]);

  // Active Count
  const activeCount = useMemo(() => {
    return faqs.filter((f) => f.enabled).length;
  }, [faqs]);

  // Filtered Documents
  const filteredDocs = useMemo(() => {
    return localFiles.filter((doc) => {
      const matchesSearch = doc.name.toLowerCase().includes(docSearch.toLowerCase()) || doc.content.toLowerCase().includes(docSearch.toLowerCase());
      const matchesCat = docCategoryFilter === 'All' || doc.category === docCategoryFilter;
      return matchesSearch && matchesCat;
    });
  }, [localFiles, docSearch, docCategoryFilter]);

  // Agent Settings Handlers
  const handleSaveSettings = async () => {
    setIsSavingSettings(true);
    try {
      localStorage.setItem('openrouter_api_key', apiKey);
      localStorage.setItem('tala_openrouter_api_key', apiKey);
      localStorage.setItem('tala_selected_model', selectedModel);
      localStorage.setItem('tala_temperature', String(temperature));
      localStorage.setItem('tala_max_tokens', String(maxTokens));

      const updatedSettings: TalaSettings = {
        pitch: 1.0,
        rate: 1.0,
        selectedVoiceName: '',
        openrouterApiKey: apiKey,
        selectedOpenRouterModel: selectedModel,
        systemInstruction: '',
        autoSpeak: true,
        soundEnabled: true,
        continuousListening: false,
        useHybridNeural: true
      };
      await settingsService.saveSettings(updatedSettings);

      setNoticeMessage('Agent settings saved successfully! Model behavior updated.');
      setTimeout(() => setNoticeMessage(null), 4000);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSavingSettings(false);
    }
  };

  // Add Answer Handler
  const handleAddAnswer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuestion.trim() || !newAnswer.trim()) {
      alert('Please fill in both the guest question and confirmed answer.');
      return;
    }

    const newItem: FaqItem = {
      id: `faq-${Date.now()}`,
      question: newQuestion.trim(),
      keywords: newKeywords.trim() || newQuestion.toLowerCase().split(' ').slice(0, 3).join(', '),
      answer: newAnswer.trim(),
      enabled: true,
      category: newCategory,
      updatedAt: new Date().toISOString()
    };

    setFaqs((prev) => [newItem, ...prev]);

    // Create a matching knowledge document so TALA's RAG picks it up
    const kbDoc: KnowledgeFile = {
      id: `kb-faq-${newItem.id}`,
      name: `FAQ: ${newItem.question.slice(0, 40)}`,
      size: newItem.answer.length * 2,
      content: `Question: ${newItem.question}\nKeywords: ${newItem.keywords}\nConfirmed Answer: ${newItem.answer}`,
      type: 'text/plain',
      fileType: 'TXT',
      uploadedAt: new Date().toISOString(),
      category: newCategory,
      status: 'Ready'
    };
    knowledgeService.saveDoc(kbDoc);

    setNewQuestion('');
    setNewKeywords('');
    setNewAnswer('');
    setNoticeMessage(`Added new confirmed answer for "${newItem.question.slice(0, 30)}..." to TALA Memory!`);
    setTimeout(() => setNoticeMessage(null), 4000);
  };

  // Toggle FAQ Active State
  const handleToggleFaq = (id: string) => {
    setFaqs((prev) =>
      prev.map((item) => (item.id === id ? { ...item, enabled: !item.enabled } : item))
    );
  };

  // Start Edit
  const handleStartEdit = (item: FaqItem) => {
    setEditingId(item.id);
    setEditQuestion(item.question);
    setEditKeywords(item.keywords);
    setEditAnswer(item.answer);
  };

  // Save Edit
  const handleSaveEdit = (id: string) => {
    setFaqs((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              question: editQuestion.trim() || item.question,
              keywords: editKeywords.trim() || item.keywords,
              answer: editAnswer.trim() || item.answer,
              updatedAt: new Date().toISOString()
            }
          : item
      )
    );
    setEditingId(null);
    setNoticeMessage('Updated answer in Guest FAQ Memory!');
    setTimeout(() => setNoticeMessage(null), 3000);
  };

  // Delete FAQ
  const handleDeleteFaq = (id: string) => {
    if (confirm('Are you sure you want to delete this FAQ entry from TALA Memory?')) {
      setFaqs((prev) => prev.filter((item) => item.id !== id));
      setNoticeMessage('Deleted answer from Guest FAQ Memory.');
      setTimeout(() => setNoticeMessage(null), 3000);
    }
  };

  // Refresh / Reset FAQs
  const handleRefreshFaqs = () => {
    if (confirm('Reset FAQ memory to the complete 50+ BAIA & San Vicente reference set?')) {
      setFaqs(INITIAL_GUEST_FAQS);
      localStorage.setItem('tala_guest_faqs', JSON.stringify(INITIAL_GUEST_FAQS));
      setNoticeMessage('Refreshed Guest FAQ Memory with 50+ official answers!');
      setTimeout(() => setNoticeMessage(null), 4000);
      if (onRefreshFiles) onRefreshFiles();
    }
  };

  // Download FAQs
  const handleDownloadFaqs = () => {
    const jsonStr = JSON.stringify(faqs, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `guest_faq_memory_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Import FAQs JSON
  const handleImportFaqs = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);
        if (Array.isArray(parsed)) {
          const formatted: FaqItem[] = parsed.map((item, idx) => ({
            id: item.id || `imported-${Date.now()}-${idx}`,
            question: item.question || item.title || 'Question',
            keywords: item.keywords || '',
            answer: item.answer || item.content || '',
            enabled: item.enabled !== false,
            category: item.category || 'Property'
          }));
          setFaqs((prev) => [...formatted, ...prev]);
          setNoticeMessage(`Successfully imported ${formatted.length} Q&A entries!`);
          setTimeout(() => setNoticeMessage(null), 4000);
        } else {
          alert('Invalid JSON format. Expected an array of Q&A objects.');
        }
      } catch (err) {
        alert('Failed to parse JSON file.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Handle Save Quick Typed Knowledge
  const handleSaveTypedKnowledge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!typeTitle.trim() || !typeContent.trim()) {
      alert('Please provide both a document title and knowledge content.');
      return;
    }

    setIsSavingTypedKnowledge(true);
    try {
      const newDoc: KnowledgeFile = {
        id: `typed-kb-${Date.now()}`,
        name: typeTitle.trim().endsWith('.txt') ? typeTitle.trim() : `${typeTitle.trim()}.txt`,
        size: typeContent.length * 2,
        content: typeContent.trim(),
        type: 'text/plain',
        fileType: 'TXT',
        uploadedAt: new Date().toISOString(),
        category: typeCategory,
        status: 'Ready'
      };

      await knowledgeService.saveDoc(newDoc);
      setLocalFiles((prev) => [newDoc, ...prev]);

      setTypeTitle('');
      setTypeContent('');
      setNoticeMessage(`Successfully saved "${newDoc.name}" directly into TALA Knowledge Base!`);
      setTimeout(() => setNoticeMessage(null), 4000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSavingTypedKnowledge(false);
    }
  };

  // Handle File Upload
  const handleFilesUpload = async (uploadFiles: FileList | File[]) => {
    setUploadNotice('Parsing & embedding knowledge files...');
    const fileList = Array.from(uploadFiles);

    for (const file of fileList) {
      try {
        const text = await file.text();
        const ext = file.name.split('.').pop()?.toUpperCase() || 'TXT';

        const newDoc: KnowledgeFile = {
          id: `file-kb-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          name: file.name,
          size: file.size,
          content: text || `[Embedded Source Attachment: ${file.name}]`,
          type: file.type || 'text/plain',
          fileType: ext,
          uploadedAt: new Date().toISOString(),
          category: uploadCategory,
          status: 'Ready'
        };

        await knowledgeService.saveDoc(newDoc);
        setLocalFiles((prev) => [newDoc, ...prev]);
      } catch (err) {
        console.error('Error uploading file:', err);
      }
    }

    setUploadNotice(null);
    setNoticeMessage(`Successfully uploaded and indexed ${fileList.length} file(s)!`);
    setTimeout(() => setNoticeMessage(null), 4000);
  };

  const visibleModels = useMemo(() => {
    if (showFreeOnly) return AVAILABLE_MODELS.filter((m) => m.free);
    return AVAILABLE_MODELS;
  }, [showFreeOnly]);

  return (
    <div className="space-y-6 pb-20 text-gray-100 font-sans">
      {/* PAGE HEADER */}
      <div className="bg-[#0b1329] border border-[#00f0ff]/30 rounded-2xl p-5 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-[#00f0ff]/10 text-[#00f0ff] border border-[#00f0ff]/30">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                  <span>Guest Knowledge Base & Agent Settings</span>
                </h1>
                <p className="text-xs text-gray-400">
                  Manage TALA's AI brain model behavior, Guest FAQ memory, and grounded resort documentation.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className={`px-3.5 py-2 rounded-xl font-semibold text-xs flex items-center gap-2 border transition-all ${
                showSettings
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : 'bg-[#152347] text-gray-300 border-gray-700 hover:text-white'
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>{showSettings ? 'Hide Agent Settings' : 'Agent Settings'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* NOTICE BANNER */}
      {noticeMessage && (
        <div className="p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center justify-between gap-2 animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{noticeMessage}</span>
          </div>
          <button onClick={() => setNoticeMessage(null)} className="text-emerald-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* TOP AGENT SETTINGS CARD (Match Image 1:1) */}
      {showSettings && (
        <div className="bg-[#0b1329] border border-amber-500/30 rounded-2xl p-6 space-y-5 shadow-2xl relative overflow-hidden">
          <div className="flex items-center justify-between border-b border-gray-800 pb-3">
            <div className="flex items-center gap-2">
              <Sliders className="w-5 h-5 text-amber-400" />
              <h2 className="text-base font-bold text-white tracking-wide uppercase">Agent Settings</h2>
            </div>
            <span className="text-xs text-gray-400">Configure the AI model powering resort operations and guest concierge.</span>
          </div>

          {/* AI PROVIDER SWITCH */}
          <div>
            <label className="text-xs font-bold text-gray-300 uppercase tracking-wider block mb-2">AI Provider</label>
            <p className="text-[11px] text-gray-400 mb-2">Choose where the agent runs its AI models.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-xl">
              <button
                type="button"
                onClick={() => setAiProvider('ollama')}
                className={`p-3 rounded-xl border text-left flex flex-col transition-all ${
                  aiProvider === 'ollama'
                    ? 'bg-amber-500/10 border-amber-500 text-amber-300 shadow-md'
                    : 'bg-[#121c38] border-gray-800 text-gray-400 hover:border-gray-700'
                }`}
              >
                <span className="font-bold text-xs text-white">Ollama (Local)</span>
                <span className="text-[10px] text-gray-400">Runs on your machine</span>
              </button>

              <button
                type="button"
                onClick={() => setAiProvider('openrouter')}
                className={`p-3 rounded-xl border text-left flex flex-col transition-all ${
                  aiProvider === 'openrouter'
                    ? 'bg-amber-500/10 border-amber-500 text-amber-300 shadow-md'
                    : 'bg-[#121c38] border-gray-800 text-gray-400 hover:border-gray-700'
                }`}
              >
                <span className="font-bold text-xs text-white">OpenRouter (Cloud)</span>
                <span className="text-[10px] text-gray-400">Many models, some free</span>
              </button>
            </div>
          </div>

          {/* OPENROUTER API KEY & MODEL SELECTOR */}
          {aiProvider === 'openrouter' && (
            <div className="space-y-4 pt-2 border-t border-gray-800/80">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* API KEY INPUT */}
                <div>
                  <label className="text-xs font-semibold text-gray-300 block mb-1">OpenRouter (Cloud) API Key</label>
                  <div className="relative">
                    <input
                      type={showApiKey ? 'text' : 'password'}
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      placeholder="sk-or-v1-..."
                      className="w-full bg-[#121c38] border border-gray-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-400 pr-10 font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="absolute right-3 top-2.5 text-gray-400 hover:text-white"
                    >
                      {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <span className="text-[10px] text-gray-500 mt-1 block">Current: {apiKey ? `••••••••${apiKey.slice(-4)}` : 'Not configured'}</span>
                </div>

                {/* MODEL SELECTOR DROPDOWN */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-gray-300 block">Model</label>
                    <button
                      type="button"
                      onClick={() => setShowFreeOnly(!showFreeOnly)}
                      className="text-[11px] font-bold text-amber-400 hover:underline"
                    >
                      {showFreeOnly ? 'Show All' : 'Show Free'}
                    </button>
                  </div>
                  <select
                    value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value)}
                    className="w-full bg-[#121c38] border border-gray-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
                  >
                    {visibleModels.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                  <span className="text-[10px] text-gray-500 mt-1 block">{visibleModels.length} models shown</span>
                </div>
              </div>

              {/* MODEL BEHAVIOR SLIDERS */}
              <div className="pt-3 border-t border-gray-800/80">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-3">Model Behavior</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Temperature */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-gray-300">Temperature ({temperature})</span>
                      <span className="text-gray-400 text-[10px]">{temperature < 0.5 ? 'Precise' : 'Creative'}</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={temperature}
                      onChange={(e) => setTemperature(parseFloat(e.target.value))}
                      className="w-full accent-amber-400 cursor-pointer h-1.5 bg-gray-800 rounded-lg"
                    />
                    <div className="flex justify-between text-[10px] text-gray-500">
                      <span>Precise</span>
                      <span>Creative</span>
                    </div>
                  </div>

                  {/* Max Reply Tokens */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-gray-300">Max Reply Tokens</span>
                      <span className="text-amber-400 font-mono">{maxTokens}</span>
                    </div>
                    <input
                      type="range"
                      min="100"
                      max="4000"
                      step="100"
                      value={maxTokens}
                      onChange={(e) => setMaxTokens(parseInt(e.target.value))}
                      className="w-full accent-amber-400 cursor-pointer h-1.5 bg-gray-800 rounded-lg"
                    />
                  </div>
                </div>
              </div>

              {/* SAVE SETTINGS BUTTON */}
              <div className="pt-2 flex justify-center">
                <button
                  type="button"
                  onClick={handleSaveSettings}
                  disabled={isSavingSettings}
                  className="w-full sm:w-auto px-8 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSavingSettings ? 'Saving Settings...' : 'Save Agent Settings'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* NAVIGATION TAB BAR */}
      <div className="flex items-center gap-2 bg-[#0b1329] p-1.5 rounded-2xl border border-[#00f0ff]/30 shadow-md">
        <button
          onClick={() => setActiveTab('faq_memory')}
          className={`flex-1 py-3 px-4 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
            activeTab === 'faq_memory'
              ? 'bg-[#00f0ff] text-slate-950 shadow-[0_0_20px_rgba(0,240,255,0.3)]'
              : 'text-gray-300 hover:text-white hover:bg-[#00f0ff]/10'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>Guest FAQ Memory ({faqs.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('quick_type')}
          className={`flex-1 py-3 px-4 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
            activeTab === 'quick_type'
              ? 'bg-[#00f0ff] text-slate-950 shadow-[0_0_20px_rgba(0,240,255,0.3)]'
              : 'text-gray-300 hover:text-white hover:bg-[#00f0ff]/10'
          }`}
        >
          <Type className="w-4 h-4" />
          <span>Type More Knowledge</span>
        </button>

        <button
          onClick={() => setActiveTab('documents')}
          className={`flex-1 py-3 px-4 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
            activeTab === 'documents'
              ? 'bg-[#00f0ff] text-slate-950 shadow-[0_0_20px_rgba(0,240,255,0.3)]'
              : 'text-gray-300 hover:text-white hover:bg-[#00f0ff]/10'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Knowledge Files ({localFiles.length})</span>
        </button>
      </div>

      {/* TAB 1: GUEST FAQ MEMORY (Matching screenshot 1:1) */}
      {activeTab === 'faq_memory' && (
        <div className="space-y-6">
          {/* HEADER & TOP ACTIONS */}
          <div className="bg-[#0b1329] border border-[#00f0ff]/30 rounded-2xl p-5 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-bold text-white tracking-wide">Guest FAQ Memory</h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold bg-[#00f0ff]/10 text-[#00f0ff] border border-[#00f0ff]/30">
                  {activeCount} active shared answers
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-1">
                Directly view, add, or edit confirmed resort Q&As that TALA uses when answering guest inquiries.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handleRefreshFaqs}
                className="px-3 py-2 rounded-xl bg-[#121d3b] hover:bg-[#1a2a54] text-xs font-semibold text-gray-200 border border-gray-700 flex items-center gap-1.5 transition-all"
                title="Refresh FAQs to default reference set"
              >
                <RefreshCw className="w-3.5 h-3.5 text-[#00f0ff]" />
                <span>Refresh</span>
              </button>

              <button
                onClick={handleDownloadFaqs}
                className="px-3 py-2 rounded-xl bg-[#121d3b] hover:bg-[#1a2a54] text-xs font-semibold text-gray-200 border border-gray-700 flex items-center gap-1.5 transition-all"
                title="Download FAQs as JSON"
              >
                <Download className="w-3.5 h-3.5 text-emerald-400" />
                <span>Download</span>
              </button>

              <button
                onClick={() => importInputRef.current?.click()}
                className="px-3 py-2 rounded-xl bg-[#121d3b] hover:bg-[#1a2a54] text-xs font-semibold text-gray-200 border border-gray-700 flex items-center gap-1.5 transition-all"
                title="Import Q&A JSON"
              >
                <FileUp className="w-3.5 h-3.5 text-amber-400" />
                <span>Import</span>
              </button>
              <input
                type="file"
                ref={importInputRef}
                onChange={handleImportFaqs}
                accept=".json,.csv"
                className="hidden"
              />
            </div>
          </div>

          {/* ADD ANSWER FORM BOX (Match screenshot top card) */}
          <div className="bg-[#0b1329] border border-[#00f0ff]/30 rounded-2xl p-6 shadow-xl space-y-4 relative">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#00f0ff] flex items-center gap-2">
              <Plus className="w-4 h-4" />
              <span>Add Confirmed Answer to TALA Memory</span>
            </h3>

            <form onSubmit={handleAddAnswer} className="space-y-3">
              <div>
                <input
                  type="text"
                  value={newQuestion}
                  onChange={(e) => setNewQuestion(e.target.value)}
                  placeholder="Guest question, e.g. What time is breakfast?"
                  className="w-full bg-[#121c38] border border-gray-700 rounded-xl px-4 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#00f0ff]"
                />
              </div>

              <div>
                <input
                  type="text"
                  value={newKeywords}
                  onChange={(e) => setNewKeywords(e.target.value)}
                  placeholder="Keywords, comma separated: breakfast, morning meal"
                  className="w-full bg-[#121c38] border border-gray-700 rounded-xl px-4 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#00f0ff]"
                />
              </div>

              <div>
                <textarea
                  rows={3}
                  value={newAnswer}
                  onChange={(e) => setNewAnswer(e.target.value)}
                  placeholder="Confirmed answer shown to guests"
                  className="w-full bg-[#121c38] border border-gray-700 rounded-xl px-4 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#00f0ff]"
                />
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <span className="text-xs text-gray-400">Category:</span>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as KnowledgeCategory)}
                    className="bg-[#121c38] border border-gray-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#00f0ff]"
                  >
                    {RESORT_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="submit"
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Answer</span>
                </button>
              </div>
            </form>
          </div>

          {/* SEARCH & CATEGORY FILTER BAR */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#0b1329] p-3 rounded-2xl border border-gray-800">
            <div className="relative w-full sm:w-96">
              <Search className="w-4 h-4 absolute left-3 top-3 text-gray-500" />
              <input
                type="text"
                value={faqSearch}
                onChange={(e) => setFaqSearch(e.target.value)}
                placeholder="Search questions, keywords, or answers..."
                className="w-full bg-[#121c38] border border-gray-700 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#00f0ff]"
              />
              {faqSearch && (
                <button onClick={() => setFaqSearch('')} className="absolute right-3 top-2.5 text-gray-400 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <Filter className="w-4 h-4 text-gray-400" />
              <select
                value={faqCategoryFilter}
                onChange={(e) => setFaqCategoryFilter(e.target.value as any)}
                className="bg-[#121c38] border border-gray-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#00f0ff]"
              >
                <option value="All">All Categories ({faqs.length})</option>
                {RESORT_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* FAQ CARDS LIST (Matching screenshot 1:1) */}
          <div className="space-y-3">
            {filteredFaqs.length === 0 ? (
              <div className="p-8 text-center bg-[#0b1329] border border-gray-800 rounded-2xl text-gray-400 text-xs">
                No matching answers found in Guest FAQ Memory.
              </div>
            ) : (
              filteredFaqs.map((item) => (
                <div
                  key={item.id}
                  className={`p-4 rounded-2xl border transition-all ${
                    item.enabled
                      ? 'bg-[#0c1630] border-gray-800 hover:border-[#00f0ff]/40 shadow-md'
                      : 'bg-[#090f21] border-gray-900 opacity-60'
                  }`}
                >
                  {editingId === item.id ? (
                    /* EDIT MODE */
                    <div className="space-y-3">
                      <div>
                        <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Question</label>
                        <input
                          type="text"
                          value={editQuestion}
                          onChange={(e) => setEditQuestion(e.target.value)}
                          className="w-full bg-[#121c38] border border-gray-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#00f0ff]"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Keywords</label>
                        <input
                          type="text"
                          value={editKeywords}
                          onChange={(e) => setEditKeywords(e.target.value)}
                          className="w-full bg-[#121c38] border border-gray-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#00f0ff]"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Confirmed Answer</label>
                        <textarea
                          rows={3}
                          value={editAnswer}
                          onChange={(e) => setEditAnswer(e.target.value)}
                          className="w-full bg-[#121c38] border border-gray-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#00f0ff]"
                        />
                      </div>
                      <div className="flex justify-end gap-2 pt-1">
                        <button
                          onClick={() => setEditingId(null)}
                          className="px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-xs text-gray-300"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleSaveEdit(item.id)}
                          className="px-4 py-1.5 rounded-lg bg-[#00f0ff] hover:bg-[#00f0ff]/80 text-slate-950 font-bold text-xs flex items-center gap-1"
                        >
                          <Save className="w-3.5 h-3.5" />
                          <span>Save Changes</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* DISPLAY MODE */
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-sm font-bold text-white tracking-wide">{item.question}</h4>
                          {item.category && (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-[#00f0ff]/10 text-[#00f0ff] border border-[#00f0ff]/20">
                              {item.category}
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-gray-300 leading-relaxed">{item.answer}</p>

                        {item.keywords && (
                          <div className="text-[10px] text-gray-500 pt-1">
                            <span className="text-gray-400 font-semibold">Keywords: </span>
                            <span>{item.keywords}</span>
                          </div>
                        )}
                      </div>

                      {/* RIGHT ACTION CONTROLS */}
                      <div className="flex items-center gap-3 shrink-0 pt-0.5">
                        {/* TOGGLE SWITCH */}
                        <button
                          onClick={() => handleToggleFaq(item.id)}
                          className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                            item.enabled ? 'bg-amber-400' : 'bg-gray-700'
                          }`}
                          title={item.enabled ? 'Enabled' : 'Disabled'}
                        >
                          <span
                            className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-slate-950 shadow ring-0 transition duration-200 ease-in-out ${
                              item.enabled ? 'translate-x-4' : 'translate-x-0'
                            }`}
                          />
                        </button>

                        {/* EDIT BUTTON */}
                        <button
                          onClick={() => handleStartEdit(item)}
                          className="p-1.5 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white transition-colors"
                          title="Edit answer"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>

                        {/* DELETE BUTTON */}
                        <button
                          onClick={() => handleDeleteFaq(item.id)}
                          className="p-1.5 rounded-lg hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition-colors"
                          title="Delete entry"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 2: TYPE MORE KNOWLEDGE DIRECTLY */}
      {activeTab === 'quick_type' && (
        <div className="bg-[#0b1329] border border-[#00f0ff]/30 rounded-2xl p-6 shadow-xl space-y-5">
          <div className="flex items-center gap-2 border-b border-gray-800 pb-3">
            <Type className="w-5 h-5 text-[#00f0ff]" />
            <div>
              <h2 className="text-base font-bold text-white tracking-wide">Type & Build TALA Knowledge Directly</h2>
              <p className="text-xs text-gray-400">
                Easily type or paste resort policies, menus, room rules, or transport details to build TALA's brain without uploading files.
              </p>
            </div>
          </div>

          <form onSubmit={handleSaveTypedKnowledge} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-gray-300 block mb-1">Document Title</label>
                <input
                  type="text"
                  value={typeTitle}
                  onChange={(e) => setTypeTitle(e.target.value)}
                  placeholder="e.g., Resort Pool & Gym Rules, Sunset Bar Menu 2026"
                  className="w-full bg-[#121c38] border border-gray-700 rounded-xl px-4 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#00f0ff]"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-300 block mb-1">Knowledge Category</label>
                <select
                  value={typeCategory}
                  onChange={(e) => setTypeCategory(e.target.value as KnowledgeCategory)}
                  className="w-full bg-[#121c38] border border-gray-700 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#00f0ff]"
                >
                  {RESORT_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-300 block mb-1">Knowledge Content (Guides, Rules, Menus, FAQ)</label>
              <textarea
                rows={10}
                value={typeContent}
                onChange={(e) => setTypeContent(e.target.value)}
                placeholder="Type or paste operational details here...\n\nExample:\n- Swimming Pool Hours: 6:00 AM to 10:00 PM\n- Beach Towels: Free at pool deck counter\n- Happy Hour: 5:00 PM - 7:00 PM at Sunset Bar (50% off craft cocktails)"
                className="w-full bg-[#121c38] border border-gray-700 rounded-xl px-4 py-3 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#00f0ff] font-mono leading-relaxed"
              />
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isSavingTypedKnowledge}
                className="px-8 py-3 rounded-xl bg-[#00f0ff] hover:bg-[#00f0ff]/80 text-slate-950 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-[#00f0ff]/20 transition-all"
              >
                <Save className="w-4 h-4" />
                <span>{isSavingTypedKnowledge ? 'Saving Knowledge...' : 'Save Knowledge Document'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 3: KNOWLEDGE FILES & UPLOAD */}
      {activeTab === 'documents' && (
        <div className="space-y-6">
          {/* FILE UPLOAD BOX */}
          <div className="bg-[#0b1329] border border-[#00f0ff]/30 rounded-2xl p-6 space-y-4 shadow-xl">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-gray-800">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Upload className="w-5 h-5 text-[#00f0ff]" />
                  <span>Upload Knowledge Files</span>
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  Upload resort guides, PDFs, TXT, JSON, MD, or CSV files to index into TALA's grounded vector memory.
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <label className="text-xs font-semibold text-gray-300">Target Category:</label>
                <select
                  value={uploadCategory}
                  onChange={(e) => setUploadCategory(e.target.value as KnowledgeCategory)}
                  className="bg-[#121c38] border border-gray-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#00f0ff]"
                >
                  {RESORT_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* DRAG & DROP ZONE */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragActive(true);
              }}
              onDragLeave={() => setDragActive(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragActive(false);
                if (e.dataTransfer.files) handleFilesUpload(e.dataTransfer.files);
              }}
              className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer ${
                dragActive ? 'border-[#00f0ff] bg-[#00f0ff]/10' : 'border-gray-800 bg-[#0d1633] hover:border-gray-700'
              }`}
              onClick={() => fileInputRef.current?.click()}
            >
              <FileUp className="w-10 h-10 text-[#00f0ff] mx-auto mb-3" />
              <p className="text-xs font-bold text-white">
                Drag & Drop files here, or <span className="text-[#00f0ff] underline">browse computer</span>
              </p>
              <p className="text-[11px] text-gray-400 mt-1">
                Supports PDF, TXT, MD, JSON, DOCX, CSV (Max 25MB per file)
              </p>
              <input
                type="file"
                ref={fileInputRef}
                onChange={(e) => e.target.files && handleFilesUpload(e.target.files)}
                multiple
                className="hidden"
              />
            </div>

            {uploadNotice && (
              <div className="p-3 rounded-xl bg-[#00f0ff]/10 border border-[#00f0ff]/30 text-[#00f0ff] text-xs font-semibold flex items-center gap-2 animate-pulse">
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>{uploadNotice}</span>
              </div>
            )}
          </div>

          {/* SEARCH & FILTER FOR DOCUMENTS */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#0b1329] p-3 rounded-2xl border border-gray-800">
            <div className="relative w-full sm:w-96">
              <Search className="w-4 h-4 absolute left-3 top-3 text-gray-500" />
              <input
                type="text"
                value={docSearch}
                onChange={(e) => setDocSearch(e.target.value)}
                placeholder="Search knowledge documents..."
                className="w-full bg-[#121c38] border border-gray-700 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#00f0ff]"
              />
            </div>

            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <select
                value={docCategoryFilter}
                onChange={(e) => setDocCategoryFilter(e.target.value as any)}
                className="bg-[#121c38] border border-gray-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#00f0ff]"
              >
                <option value="All">All Categories ({localFiles.length})</option>
                {RESORT_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* KNOWLEDGE DOCUMENTS TABLE / LIST */}
          <div className="space-y-3">
            {filteredDocs.length === 0 ? (
              <div className="p-8 text-center bg-[#0b1329] border border-gray-800 rounded-2xl text-gray-400 text-xs">
                No knowledge documents uploaded yet.
              </div>
            ) : (
              filteredDocs.map((doc) => (
                <div key={doc.id} className="p-4 rounded-2xl bg-[#0c1630] border border-gray-800 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-[#00f0ff]/10 text-[#00f0ff] border border-[#00f0ff]/30">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white">{doc.name}</h4>
                      <div className="flex items-center gap-2 mt-0.5 text-[10px] text-gray-400">
                        <span>{doc.category || 'Property'}</span>
                        <span>•</span>
                        <span>{(doc.size / 1024).toFixed(1)} KB</span>
                        <span>•</span>
                        <span className="text-emerald-400 font-semibold">{doc.status || 'Ready'}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      onDeleteFile(doc.id);
                      setLocalFiles((prev) => prev.filter((f) => f.id !== doc.id));
                    }}
                    className="p-2 rounded-lg hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition-colors"
                    title="Delete document"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
