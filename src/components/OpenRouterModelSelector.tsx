import React, { useState, useEffect, useMemo } from 'react';
import { Search, Sparkles, Check, DollarSign, Layers, ArrowUpDown, Filter, ShieldCheck } from 'lucide-react';
import { OpenRouterModel } from '../types';

interface OpenRouterModelSelectorProps {
  selectedModelId: string;
  onSelectModel: (modelId: string) => void;
}

export const OpenRouterModelSelector: React.FC<OpenRouterModelSelectorProps> = ({
  selectedModelId,
  onSelectModel
}) => {
  const [models, setModels] = useState<OpenRouterModel[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters and Search
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [tabFilter, setTabFilter] = useState<'ALL' | 'FREE' | 'PAID'>('ALL');
  const [sortBy, setSortBy] = useState<'name' | 'context' | 'price'>('context');

  useEffect(() => {
    let isMounted = true;
    const fetchModels = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch('/api/models');
        if (!res.ok) throw new Error(`HTTP error ${res.status}`);
        const data = await res.json();
        if (isMounted) {
          setModels(data.models || []);
        }
      } catch (err: any) {
        if (isMounted) {
          console.warn('Failed to load OpenRouter models:', err);
          setError('Unable to refresh live model list. Using cached default catalog.');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchModels();
    return () => { isMounted = false; };
  }, []);

  // Price formatter per 1M tokens
  const formatPrice = (pricePerToken: string | number) => {
    const num = Number(pricePerToken || 0);
    if (num === 0) return 'FREE';
    const numPerMillion = num * 1000000;
    if (numPerMillion < 0.01) {
      return `$${numPerMillion.toFixed(4)} / 1M`;
    }
    return `$${numPerMillion.toFixed(2)} / 1M`;
  };

  const selectedModel = useMemo(() => {
    return models.find((m) => m.id === selectedModelId) || {
      id: selectedModelId || 'openrouter/free',
      name: selectedModelId === 'openrouter/free' ? 'OpenRouter: Free Router' : selectedModelId,
      description: 'OpenRouter dynamic AI routing gateway.',
      context_length: 128000,
      pricing: { prompt: '0', completion: '0' },
      is_free: true
    };
  }, [models, selectedModelId]);

  const filteredModels = useMemo(() => {
    return models
      .filter((m) => {
        // Search query filter
        const query = searchQuery.toLowerCase().trim();
        const matchesSearch =
          !query ||
          m.name.toLowerCase().includes(query) ||
          m.id.toLowerCase().includes(query) ||
          (m.description && m.description.toLowerCase().includes(query));

        // Tab filter
        let matchesTab = true;
        if (tabFilter === 'FREE') matchesTab = m.is_free;
        if (tabFilter === 'PAID') matchesTab = !m.is_free;

        return matchesSearch && matchesTab;
      })
      .sort((a, b) => {
        if (sortBy === 'name') {
          return a.name.localeCompare(b.name);
        }
        if (sortBy === 'context') {
          return (b.context_length || 0) - (a.context_length || 0);
        }
        if (sortBy === 'price') {
          const priceA = Number(a.pricing?.prompt || 0);
          const priceB = Number(b.pricing?.prompt || 0);
          return priceA - priceB;
        }
        return 0;
      });
  }, [models, searchQuery, tabFilter, sortBy]);

  return (
    <div className="space-y-4">
      {/* Selected Model Highlight Card */}
      <div className="p-3.5 rounded-xl bg-[#030712] border border-[#00f0ff]/40 shadow-[0_0_20px_rgba(0,240,255,0.15)] relative overflow-hidden">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold text-[#00f0ff] uppercase tracking-wider">
                CURRENT ACTIVE MODEL
              </span>
              {selectedModel.is_free ? (
                <span className="px-2 py-0.5 text-[9px] font-mono font-bold text-emerald-400 bg-emerald-500/15 border border-emerald-500/40 rounded">
                  FREE
                </span>
              ) : (
                <span className="px-2 py-0.5 text-[9px] font-mono font-bold text-amber-300 bg-amber-500/15 border border-amber-500/40 rounded">
                  PAID
                </span>
              )}
            </div>
            <h4 className="text-sm font-share font-bold text-white mt-1">
              {selectedModel.name}
            </h4>
            <p className="text-[11px] font-mono text-cyan-300/80">
              {selectedModel.id}
            </p>
          </div>
          <ShieldCheck className="w-5 h-5 text-[#00f0ff] shrink-0" />
        </div>

        <div className="mt-3 pt-2 border-t border-[#00f0ff]/20 grid grid-cols-3 gap-2 text-[10px] font-mono">
          <div>
            <span className="text-gray-400 block">CONTEXT:</span>
            <span className="text-gray-200 font-bold">
              {selectedModel.context_length ? `${Math.round(selectedModel.context_length / 1024)}k tokens` : '128k tokens'}
            </span>
          </div>
          <div>
            <span className="text-gray-400 block">INPUT:</span>
            <span className="text-gray-200 font-bold">
              {formatPrice(selectedModel.pricing?.prompt)}
            </span>
          </div>
          <div>
            <span className="text-gray-400 block">OUTPUT:</span>
            <span className="text-gray-200 font-bold">
              {formatPrice(selectedModel.pricing?.completion)}
            </span>
          </div>
        </div>
      </div>

      {/* Search & Tabs Controls */}
      <div className="space-y-2.5">
        <div className="flex items-center gap-2">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search model or provider (e.g. llama, claude, free)..."
              className="w-full pl-8 pr-3 py-2 bg-[#080d1a] border border-[#00f0ff]/30 focus:border-[#00f0ff] rounded-lg text-xs font-mono text-white placeholder-gray-500 focus:outline-none"
            />
          </div>

          {/* Sort Dropdown */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-2.5 py-2 bg-[#080d1a] border border-[#00f0ff]/30 rounded-lg text-xs font-mono text-cyan-300 focus:outline-none focus:border-[#00f0ff]"
          >
            <option value="context">Sort: Context</option>
            <option value="name">Sort: Name</option>
            <option value="price">Sort: Price</option>
          </select>
        </div>

        {/* Tab Filters */}
        <div className="flex items-center justify-between gap-1 bg-[#030712] p-1 rounded-lg border border-[#00f0ff]/20">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setTabFilter('ALL')}
              className={`px-3 py-1 rounded text-xs font-mono font-bold transition-all ${
                tabFilter === 'ALL'
                  ? 'bg-[#00f0ff] text-slate-950 shadow-[0_0_10px_rgba(0,240,255,0.3)]'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              ALL
            </button>
            <button
              type="button"
              onClick={() => setTabFilter('FREE')}
              className={`px-3 py-1 rounded text-xs font-mono font-bold transition-all ${
                tabFilter === 'FREE'
                  ? 'bg-[#10b981] text-slate-950 shadow-[0_0_10px_rgba(16,185,129,0.3)]'
                  : 'text-gray-400 hover:text-emerald-400'
              }`}
            >
              FREE ONLY
            </button>
            <button
              type="button"
              onClick={() => setTabFilter('PAID')}
              className={`px-3 py-1 rounded text-xs font-mono font-bold transition-all ${
                tabFilter === 'PAID'
                  ? 'bg-amber-400 text-slate-950 shadow-[0_0_10px_rgba(251,191,36,0.3)]'
                  : 'text-gray-400 hover:text-amber-300'
              }`}
            >
              PAID ONLY
            </button>
          </div>

          <span className="text-[10px] font-mono text-gray-400 pr-2">
            {filteredModels.length} models
          </span>
        </div>
      </div>

      {/* Model List Catalog Container */}
      <div className="max-h-60 overflow-y-auto space-y-2 pr-1 custom-scrollbar border border-[#00f0ff]/20 rounded-xl p-2 bg-[#050811]">
        {loading ? (
          <div className="py-8 text-center text-xs font-mono text-[#00f0ff] flex items-center justify-center gap-2">
            <Sparkles className="w-4 h-4 animate-spin" />
            <span>Loading live OpenRouter catalog...</span>
          </div>
        ) : filteredModels.length === 0 ? (
          <div className="py-6 text-center text-xs font-mono text-gray-400">
            No models found matching "{searchQuery}"
          </div>
        ) : (
          filteredModels.map((m) => {
            const isSelected = m.id === selectedModelId;
            return (
              <div
                key={m.id}
                onClick={() => onSelectModel(m.id)}
                className={`p-2.5 rounded-lg border text-left cursor-pointer transition-all flex flex-col justify-between ${
                  isSelected
                    ? 'bg-[#00f0ff]/15 border-[#00f0ff] text-white shadow-[0_0_12px_rgba(0,240,255,0.2)]'
                    : 'bg-[#080d1a] border-[#00f0ff]/20 hover:border-[#00f0ff]/50 text-gray-300'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-share font-bold text-white truncate">
                        {m.name}
                      </span>
                      {m.is_free ? (
                        <span className="px-1.5 py-0.2 text-[8px] font-mono font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 rounded shrink-0">
                          FREE
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.2 text-[8px] font-mono font-bold text-amber-300 bg-amber-500/10 border border-amber-500/30 rounded shrink-0">
                          PAID
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] font-mono text-cyan-300/70 block truncate mt-0.5">
                      {m.id}
                    </span>
                  </div>
                  {isSelected && (
                    <div className="w-5 h-5 rounded-full bg-[#00f0ff] text-slate-950 flex items-center justify-center shrink-0">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                  )}
                </div>

                <div className="mt-2 pt-1.5 border-t border-[#00f0ff]/10 flex items-center justify-between text-[9px] font-mono text-gray-400">
                  <span>CTX: {Math.round((m.context_length || 0) / 1024)}k</span>
                  <div className="flex items-center gap-2">
                    <span>In: {formatPrice(m.pricing?.prompt)}</span>
                    <span>Out: {formatPrice(m.pricing?.completion)}</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
      {error && <p className="text-[10px] font-mono text-amber-400">{error}</p>}
    </div>
  );
};
