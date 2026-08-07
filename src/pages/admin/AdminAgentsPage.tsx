import React, { useState, useEffect, useCallback } from 'react';
import { agentService, Agent } from '../../services/agentService';
import {
  Bot,
  Plus,
  Trash2,
  Edit3,
  Power,
  PowerOff,
  CheckCircle,
  AlertTriangle,
  X,
  Save,
  RefreshCw,
  Brain,
  Mic,
  Shield,
  Loader2,
} from 'lucide-react';

const SKILL_OPTIONS = [
  { id: 'knowledge.search', label: 'Knowledge Search', description: 'Search and retrieve information from the knowledge base' },
  { id: 'guest_request.create', label: 'Guest Request Create', description: 'Create guest service requests' },
  { id: 'conversation.reply', label: 'Conversation Reply', description: 'Reply to guest conversations' },
  { id: 'system.status', label: 'System Status', description: 'Check system health and operational status' },
];

const PERMISSION_OPTIONS = [
  { id: 'knowledge.read', label: 'Read Knowledge', level: 'read' as const },
  { id: 'guest_requests.create', label: 'Create Guest Requests', level: 'write' as const },
  { id: 'guest_requests.read', label: 'Read Guest Requests', level: 'read' as const },
  { id: 'guest_requests.update', label: 'Update Guest Requests', level: 'write' as const },
  { id: 'conversations.read', label: 'Read Conversations', level: 'read' as const },
  { id: 'conversations.reply', label: 'Reply to Conversations', level: 'write' as const },
  { id: 'settings.read', label: 'Read Settings', level: 'read' as const },
  { id: 'settings.update', label: 'Update Settings', level: 'admin' as const },
  { id: 'agents.read', label: 'Read Agents', level: 'read' as const },
  { id: 'agents.update', label: 'Update Agents', level: 'admin' as const },
  { id: 'system.status.read', label: 'Read System Status', level: 'read' as const },
  { id: 'tools.execute', label: 'Execute Tools', level: 'admin' as const },
];

const KNOWLEDGE_CATEGORIES = [
  'Property', 'Rooms', 'Food & Breakfast', 'Transportation',
  'Activities', 'San Vicente', 'Policies', 'Emergency', 'Other',
];

const STATUS_OPTIONS: Agent['status'][] = ['online', 'offline', 'disabled'];

export const AdminAgentsPage: React.FC = () => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [testResults, setTestResults] = useState<Record<string, { ok: boolean; issues: string[] }>>({});
  const [testingId, setTestingId] = useState<string | null>(null);
  const [saveToast, setSaveToast] = useState<string | null>(null);

  const loadAgents = useCallback(async () => {
    setLoading(true);
    try {
      const list = await agentService.getAgents();
      setAgents(list);
    } catch (err) {
      console.error('Failed to load agents:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadAgents(); }, [loadAgents]);

  const handleTestAgent = async (agent: Agent) => {
    setTestingId(agent.id);
    try {
      const baseUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:3002';
      const res = await fetch(`${baseUrl}/api/agents/${agent.slug}/test`);
      const data = await res.json();
      setTestResults((prev) => ({ ...prev, [agent.id]: { ok: data.ok, issues: data.issues || [] } }));
    } catch {
      setTestResults((prev) => ({ ...prev, [agent.id]: { ok: false, issues: ['Test request failed'] } }));
    } finally {
      setTestingId(null);
    }
  };

  const handleToggleStatus = async (agent: Agent) => {
    const newStatus: Agent['status'] = agent.status === 'online' ? 'offline' : 'online';
    await agentService.setAgentStatus(agent.id, newStatus);
    setAgents((prev) => prev.map((a) => a.id === agent.id ? { ...a, status: newStatus } : a));
  };

  const handleDelete = async (agent: Agent) => {
    if (!confirm(`Delete agent "${agent.name}"? This cannot be undone.`)) return;
    await agentService.deleteAgent(agent.id);
    setAgents((prev) => prev.filter((a) => a.id !== agent.id));
    showToast('Agent deleted');
  };

  const handleSave = async (agentData: Partial<Agent>) => {
    if (editingAgent) {
      const updated = await agentService.updateAgent(editingAgent.id, agentData);
      if (updated) {
        setAgents((prev) => prev.map((a) => a.id === editingAgent.id ? updated : a));
        showToast('Agent updated');
      }
    } else {
      const created = await agentService.createAgent(agentData);
      if (created) {
        setAgents((prev) => [created, ...prev]);
        showToast('Agent created');
      }
    }
    setShowEditor(false);
    setEditingAgent(null);
  };

  const showToast = (msg: string) => {
    setSaveToast(msg);
    setTimeout(() => setSaveToast(null), 3000);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Bot className="w-6 h-6 text-[#00f0ff]" />
            Agent Management
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Configure AI concierge agents, skills, and permissions
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={loadAgents}
            className="p-2 rounded-lg bg-[#0a0f1d] border border-[#00f0ff]/30 text-gray-300 hover:text-[#00f0ff] hover:border-[#00f0ff] transition-all"
            title="Refresh agents"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => { setEditingAgent(null); setShowEditor(true); }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#00f0ff] text-black font-semibold text-sm hover:bg-[#00f0ff]/80 transition-all shadow-[0_0_12px_rgba(0,240,255,0.3)]"
          >
            <Plus className="w-4 h-4" />
            New Agent
          </button>
        </div>
      </div>

      {/* Agent Cards */}
      {loading ? (
        <div className="flex items-center justify-center py-12 text-gray-400">
          <Loader2 className="w-6 h-6 animate-spin mr-2" />
          Loading agents...
        </div>
      ) : agents.length === 0 ? (
        <div className="text-center py-12 bg-[#080d1a] border border-[#00f0ff]/20 rounded-2xl">
          <Bot className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400">No agents configured yet</p>
          <button
            onClick={() => { setEditingAgent(null); setShowEditor(true); }}
            className="mt-4 px-4 py-2 rounded-xl bg-[#00f0ff]/10 border border-[#00f0ff]/40 text-[#00f0ff] text-sm hover:bg-[#00f0ff]/20 transition-all"
          >
            Create your first agent
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {agents.map((agent) => {
            const testResult = testResults[agent.id];
            return (
              <div
                key={agent.id}
                className={`bg-[#080d1a] border rounded-2xl p-5 transition-all ${
                  agent.status === 'online'
                    ? 'border-[#00f0ff]/30 shadow-[0_0_15px_rgba(0,240,255,0.08)]'
                    : 'border-gray-700/40'
                }`}
              >
                {/* Agent Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      agent.status === 'online'
                        ? 'bg-[#00f0ff]/15'
                        : 'bg-gray-700/30'
                    }`}>
                      <Bot className={`w-5 h-5 ${
                        agent.status === 'online'
                          ? 'text-[#00f0ff]'
                          : 'text-gray-500'
                      }`} />
                    </div>
                    <div>
                      <h3 className="font-bold text-white">{agent.name}</h3>
                      <p className="text-xs text-gray-400 font-mono">{agent.slug}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                    agent.status === 'online'
                      ? 'bg-[#10b981]/20 text-[#10b981] border border-[#10b981]/40'
                      : 'bg-gray-700/30 text-gray-400 border border-gray-600/40'
                  }`}>
                    {agent.status}
                  </span>
                </div>

                {/* Agent Description */}
                <p className="text-sm text-gray-300 mb-3 line-clamp-2">
                  {agent.description || 'No description'}
                </p>

                {/* Agent Meta */}
                <div className="flex flex-wrap gap-2 mb-4 text-xs">
                  <span className="px-2 py-1 rounded-lg bg-[#0a0f1d] border border-[#00f0ff]/20 text-gray-300">
                    <Brain className="w-3 h-3 inline mr-1" />
                    {agent.model_id || 'default'}
                  </span>
                  <span className="px-2 py-1 rounded-lg bg-[#0a0f1d] border border-[#00f0ff]/20 text-gray-300">
                    <Mic className="w-3 h-3 inline mr-1" />
                    Voice {agent.voice_enabled ? 'ON' : 'OFF'}
                  </span>
                  {agent.skills && agent.skills.length > 0 && (
                    <span className="px-2 py-1 rounded-lg bg-[#0a0f1d] border border-[#00f0ff]/20 text-gray-300">
                      <Shield className="w-3 h-3 inline mr-1" />
                      {agent.skills.length} skill{agent.skills.length !== 1 ? 's' : ''}
                    </span>
                  )}
                  {agent.guest_facing && (
                    <span className="px-2 py-1 rounded-lg bg-[#10b981]/10 border border-[#10b981]/30 text-[#10b981]">
                      Guest-facing
                    </span>
                  )}
                </div>

                {/* Test Result */}
                {testResult && (
                  <div className={`mb-3 px-3 py-2 rounded-lg text-xs ${
                    testResult.ok
                      ? 'bg-[#10b981]/10 border border-[#10b981]/30 text-[#10b981]'
                      : 'bg-red-500/10 border border-red-500/30 text-red-400'
                  }`}>
                    {testResult.ok ? (
                      <span className="flex items-center gap-1"><CheckCircle className="w-3 h-3" /> All checks passed</span>
                    ) : (
                      <span className="flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> {testResult.issues.join('; ')}</span>
                    )}
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => { setEditingAgent(agent); setShowEditor(true); }}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-[#0a0f1d] border border-[#00f0ff]/30 text-gray-300 hover:text-[#00f0ff] hover:border-[#00f0ff] transition-all text-xs font-medium"
                  >
                    <Edit3 className="w-3 h-3" /> Edit
                  </button>
                  <button
                    onClick={() => handleTestAgent(agent)}
                    disabled={testingId === agent.id}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-[#0a0f1d] border border-[#00f0ff]/30 text-gray-300 hover:text-[#00f0ff] hover:border-[#00f0ff] transition-all text-xs font-medium disabled:opacity-50"
                  >
                    {testingId === agent.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />}
                    Test
                  </button>
                  <button
                    onClick={() => handleToggleStatus(agent)}
                    className={`p-2 rounded-lg border transition-all text-xs ${
                      agent.status === 'online'
                        ? 'bg-[#10b981]/10 border-[#10b981]/40 text-[#10b981] hover:bg-[#10b981]/20'
                        : 'bg-gray-700/30 border-gray-600/40 text-gray-400 hover:bg-gray-700/50'
                    }`}
                    title={agent.status === 'online' ? 'Set offline' : 'Set online'}
                  >
                    {agent.status === 'online' ? <Power className="w-3 h-3" /> : <PowerOff className="w-3 h-3" />}
                  </button>
                  <button
                    onClick={() => handleDelete(agent)}
                    className="p-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 transition-all text-xs"
                    title="Delete agent"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Agent Editor Modal */}
      {showEditor && (
        <AgentEditorModal
          agent={editingAgent}
          onSave={handleSave}
          onClose={() => { setShowEditor(false); setEditingAgent(null); }}
        />
      )}

      {/* Toast */}
      {saveToast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl bg-[#10b981] text-black font-semibold text-sm shadow-[0_0_20px_rgba(16,185,129,0.4)]">
          <CheckCircle className="w-4 h-4" />
          {saveToast}
        </div>
      )}
    </div>
  );
};

// ── Agent Editor Modal ──────────────────────────────────────────────────────
interface AgentEditorModalProps {
  agent: Agent | null;
  onSave: (data: Partial<Agent>) => void;
  onClose: () => void;
}

const AgentEditorModal: React.FC<AgentEditorModalProps> = ({ agent, onSave, onClose }) => {
  const [form, setForm] = useState<Partial<Agent>>(() => ({
    name: agent?.name || '',
    slug: agent?.slug || '',
    role: agent?.role || '',
    description: agent?.description || '',
    system_prompt: agent?.system_prompt || '',
    model_id: agent?.model_id || 'openrouter/free',
    temperature: agent?.temperature ?? 0.7,
    voice_enabled: agent?.voice_enabled ?? true,
    voice_language: agent?.voice_language || 'en-US',
    voice_name: agent?.voice_name || '',
    voice_rate: agent?.voice_rate ?? 1.0,
    skills: agent?.skills || [],
    permissions: agent?.permissions || [],
    status: agent?.status || 'online',
    guest_facing: agent?.guest_facing ?? false,
    knowledge_enabled: agent?.knowledge_enabled ?? true,
    knowledge_categories: agent?.knowledge_categories || KNOWLEDGE_CATEGORIES,
  }));

  const [activeTab, setActiveTab] = useState<'identity' | 'model' | 'voice' | 'knowledge' | 'skills' | 'permissions'>('identity');

  const updateField = (field: string, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const toggleArrayItem = (field: 'skills' | 'permissions' | 'knowledge_categories', item: string) => {
    setForm((prev) => {
      const arr = (prev[field] as string[]) || [];
      const next = arr.includes(item) ? arr.filter((i) => i !== item) : [...arr, item];
      return { ...prev, [field]: next };
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(form);
  };

  const tabs = [
    { id: 'identity' as const, label: 'Identity', icon: Bot },
    { id: 'model' as const, label: 'Model', icon: Brain },
    { id: 'voice' as const, label: 'Voice', icon: Mic },
    { id: 'knowledge' as const, label: 'Knowledge', icon: Shield },
    { id: 'skills' as const, label: 'Skills', icon: Shield },
    { id: 'permissions' as const, label: 'Permissions', icon: Shield },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={onClose}>
      <div
        className="w-full max-w-3xl max-h-[90vh] bg-[#080d1a] border border-[#00f0ff]/30 rounded-2xl shadow-[0_0_40px_rgba(0,240,255,0.15)] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#00f0ff]/20">
          <h2 className="text-lg font-bold text-white">
            {agent ? `Edit Agent: ${agent.name}` : 'Create New Agent'}
          </h2>
          <button onClick={onClose} className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-[#00f0ff]/10 transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-6 pt-4 border-b border-[#00f0ff]/10">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-t-lg transition-all ${
                  activeTab === tab.id
                    ? 'bg-[#00f0ff]/10 text-[#00f0ff] border-b-2 border-[#00f0ff]'
                    : 'text-gray-400 hover:text-white hover:bg-[#0a0f1d]'
                }`}
              >
                <Icon className="w-3 h-3" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* Identity Tab */}
          {activeTab === 'identity' && (
            <>
              <Field label="Agent Name" required>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => updateField('name', e.target.value)}
                  placeholder="e.g., TALA Concierge"
                  className="w-full bg-[#050811] border border-[#00f0ff]/30 focus:border-[#00f0ff] rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none"
                />
              </Field>
              <Field label="Slug" required>
                <input
                  type="text"
                  required
                  value={form.slug}
                  onChange={(e) => updateField('slug', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
                  placeholder="e.g., tala-concierge"
                  className="w-full bg-[#050811] border border-[#00f0ff]/30 focus:border-[#00f0ff] rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none font-mono"
                />
              </Field>
              <Field label="Role">
                <input
                  type="text"
                  value={form.role}
                  onChange={(e) => updateField('role', e.target.value)}
                  placeholder="e.g., AI Concierge Assistant"
                  className="w-full bg-[#050811] border border-[#00f0ff]/30 focus:border-[#00f0ff] rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none"
                />
              </Field>
              <Field label="Description">
                <textarea
                  value={form.description}
                  onChange={(e) => updateField('description', e.target.value)}
                  placeholder="Brief description of this agent's purpose"
                  rows={3}
                  className="w-full bg-[#050811] border border-[#00f0ff]/30 focus:border-[#00f0ff] rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none resize-none"
                />
              </Field>
              <Field label="System Prompt" required>
                <textarea
                  value={form.system_prompt}
                  onChange={(e) => updateField('system_prompt', e.target.value)}
                  placeholder="Instructions for how this agent should behave..."
                  rows={6}
                  className="w-full bg-[#050811] border border-[#00f0ff]/30 focus:border-[#00f0ff] rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none resize-none font-mono text-xs leading-relaxed"
                />
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Status">
                  <select
                    value={form.status}
                    onChange={(e) => updateField('status', e.target.value)}
                    className="w-full bg-[#050811] border border-[#00f0ff]/30 focus:border-[#00f0ff] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none"
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Guest Facing">
                  <label className="flex items-center gap-3 px-4 py-2.5 bg-[#050811] border border-[#00f0ff]/30 rounded-xl cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.guest_facing}
                      onChange={(e) => updateField('guest_facing', e.target.checked)}
                      className="rounded border-[#00f0ff]/40"
                    />
                    <span className="text-sm text-gray-300">Available to guests</span>
                  </label>
                </Field>
              </div>
            </>
          )}

          {/* Model Tab */}
          {activeTab === 'model' && (
            <>
              <Field label="Model ID">
                <input
                  type="text"
                  value={form.model_id}
                  onChange={(e) => updateField('model_id', e.target.value)}
                  placeholder="e.g., openrouter/free"
                  className="w-full bg-[#050811] border border-[#00f0ff]/30 focus:border-[#00f0ff] rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none font-mono"
                />
                <p className="text-[10px] text-gray-500 mt-1">OpenRouter model ID (e.g., openrouter/free, anthropic/claude-3.5-haiku)</p>
              </Field>
              <Field label={`Temperature: ${form.temperature}`}>
                <input
                  type="range"
                  min="0"
                  max="2"
                  step="0.1"
                  value={form.temperature}
                  onChange={(e) => updateField('temperature', parseFloat(e.target.value))}
                  className="w-full accent-[#00f0ff]"
                />
                <div className="flex justify-between text-[10px] text-gray-500 mt-1">
                  <span>Precise (0)</span>
                  <span>Balanced (1)</span>
                  <span>Creative (2)</span>
                </div>
              </Field>
            </>
          )}

          {/* Voice Tab */}
          {activeTab === 'voice' && (
            <>
              <Field label="Voice Enabled">
                <label className="flex items-center gap-3 px-4 py-2.5 bg-[#050811] border border-[#00f0ff]/30 rounded-xl cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.voice_enabled}
                    onChange={(e) => updateField('voice_enabled', e.target.checked)}
                    className="rounded border-[#00f0ff]/40"
                  />
                  <span className="text-sm text-gray-300">Enable text-to-speech for this agent</span>
                </label>
              </Field>
              <Field label="Voice Language">
                <input
                  type="text"
                  value={form.voice_language}
                  onChange={(e) => updateField('voice_language', e.target.value)}
                  placeholder="e.g., en-US"
                  className="w-full bg-[#050811] border border-[#00f0ff]/30 focus:border-[#00f0ff] rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none"
                />
              </Field>
              <Field label="Voice Name">
                <input
                  type="text"
                  value={form.voice_name}
                  onChange={(e) => updateField('voice_name', e.target.value)}
                  placeholder="e.g., nova, alloy, shimmer"
                  className="w-full bg-[#050811] border border-[#00f0ff]/30 focus:border-[#00f0ff] rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none"
                />
              </Field>
              <Field label={`Speech Rate: ${form.voice_rate}`}>
                <input
                  type="range"
                  min="0.5"
                  max="2"
                  step="0.1"
                  value={form.voice_rate}
                  onChange={(e) => updateField('voice_rate', parseFloat(e.target.value))}
                  className="w-full accent-[#00f0ff]"
                />
              </Field>
            </>
          )}

          {/* Knowledge Tab */}
          {activeTab === 'knowledge' && (
            <>
              <Field label="Knowledge Enabled">
                <label className="flex items-center gap-3 px-4 py-2.5 bg-[#050811] border border-[#00f0ff]/30 rounded-xl cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.knowledge_enabled}
                    onChange={(e) => updateField('knowledge_enabled', e.target.checked)}
                    className="rounded border-[#00f0ff]/40"
                  />
                  <span className="text-sm text-gray-300">Enable knowledge base access for this agent</span>
                </label>
              </Field>
              <Field label="Knowledge Categories">
                <div className="grid grid-cols-3 gap-2">
                  {KNOWLEDGE_CATEGORIES.map((cat) => (
                    <label
                      key={cat}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-all text-xs ${
                        (form.knowledge_categories || []).includes(cat)
                          ? 'bg-[#00f0ff]/10 border-[#00f0ff]/40 text-[#00f0ff]'
                          : 'bg-[#050811] border-[#00f0ff]/15 text-gray-400 hover:border-[#00f0ff]/30'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={(form.knowledge_categories || []).includes(cat)}
                        onChange={() => toggleArrayItem('knowledge_categories', cat)}
                        className="sr-only"
                      />
                      {cat}
                    </label>
                  ))}
                </div>
              </Field>
            </>
          )}

          {/* Skills Tab */}
          {activeTab === 'skills' && (
            <Field label="Assigned Skills">
              <div className="space-y-2">
                {SKILL_OPTIONS.map((skill) => (
                  <label
                    key={skill.id}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl border cursor-pointer transition-all ${
                      (form.skills || []).includes(skill.id)
                        ? 'bg-[#00f0ff]/10 border-[#00f0ff]/40'
                        : 'bg-[#050811] border-[#00f0ff]/15 hover:border-[#00f0ff]/30'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={(form.skills || []).includes(skill.id)}
                      onChange={() => toggleArrayItem('skills', skill.id)}
                      className="rounded border-[#00f0ff]/40"
                    />
                    <div>
                      <span className="text-sm text-white font-medium">{skill.label}</span>
                      <p className="text-[10px] text-gray-400">{skill.description}</p>
                    </div>
                  </label>
                ))}
              </div>
            </Field>
          )}

          {/* Permissions Tab */}
          {activeTab === 'permissions' && (
            <Field label="Assigned Permissions">
              <div className="space-y-2">
                {PERMISSION_OPTIONS.map((perm) => (
                  <label
                    key={perm.id}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl border cursor-pointer transition-all ${
                      (form.permissions || []).includes(perm.id)
                        ? 'bg-[#00f0ff]/10 border-[#00f0ff]/40'
                        : 'bg-[#050811] border-[#00f0ff]/15 hover:border-[#00f0ff]/30'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={(form.permissions || []).includes(perm.id)}
                      onChange={() => toggleArrayItem('permissions', perm.id)}
                      className="rounded border-[#00f0ff]/40"
                    />
                    <div className="flex-1">
                      <span className="text-sm text-white font-medium">{perm.label}</span>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                      perm.level === 'admin'
                        ? 'bg-red-500/20 text-red-400'
                        : perm.level === 'write'
                        ? 'bg-yellow-500/20 text-yellow-400'
                        : 'bg-gray-600/30 text-gray-400'
                    }`}>
                      {perm.level}
                    </span>
                  </label>
                ))}
              </div>
            </Field>
          )}
        </form>

        {/* Modal Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[#00f0ff]/20">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-[#0a0f1d] border border-gray-600/40 text-gray-300 hover:text-white hover:border-gray-500 transition-all text-sm"
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-[#00f0ff] text-black font-bold text-sm hover:bg-[#00f0ff]/80 transition-all shadow-[0_0_12px_rgba(0,240,255,0.3)]"
          >
            <Save className="w-4 h-4" />
            {agent ? 'Update Agent' : 'Create Agent'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Reusable field wrapper ──────────────────────────────────────────────────
const Field: React.FC<{ label: string; required?: boolean; children: React.ReactNode }> = ({
  label,
  required,
  children,
}) => (
  <div>
    <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
      {label}
      {required && <span className="text-[#00f0ff] ml-1">*</span>}
    </label>
    {children}
  </div>
);

export default AdminAgentsPage;
