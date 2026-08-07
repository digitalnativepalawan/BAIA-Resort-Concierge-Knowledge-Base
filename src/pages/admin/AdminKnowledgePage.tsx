import React, { useState } from 'react';
import { KnowledgeFile, KnowledgeCategory } from '../../types';
import {
  BookOpen,
  Plus,
  Upload,
  FileText,
  Trash2,
  Eye,
  CheckCircle,
  Tag,
  Search,
  X,
  FileCode,
  HardDrive
} from 'lucide-react';

interface AdminKnowledgePageProps {
  files: KnowledgeFile[];
  onUploadFile: (file: File, category?: KnowledgeCategory) => void;
  onDeleteFile: (id: string) => void;
  onUpdateCategory?: (id: string, newCategory: KnowledgeCategory) => void;
}

const CATEGORIES: { label: string; value: 'All' | KnowledgeCategory }[] = [
  { label: 'All Categories', value: 'All' },
  { label: 'Property', value: 'Property' },
  { label: 'Rooms', value: 'Rooms' },
  { label: 'Food & Breakfast', value: 'Food & Breakfast' },
  { label: 'Transportation', value: 'Transportation' },
  { label: 'Activities', value: 'Activities' },
  { label: 'San Vicente', value: 'San Vicente' },
  { label: 'Policies', value: 'Policies' },
  { label: 'Emergency', value: 'Emergency' },
  { label: 'Other', value: 'Other' },
];

export const AdminKnowledgePage: React.FC<AdminKnowledgePageProps> = ({
  files,
  onUploadFile,
  onDeleteFile,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<'All' | KnowledgeCategory>('All');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState<boolean>(false);
  const [previewDoc, setPreviewDoc] = useState<KnowledgeFile | null>(null);

  // Modal upload form state
  const [uploadCategory, setUploadCategory] = useState<KnowledgeCategory>('Property');
  const [dragOver, setDragOver] = useState<boolean>(false);

  // Filter files
  const filteredFiles = files.filter((f) => {
    const fileCategory = f.category || 'Other';
    const matchesCategory = selectedCategory === 'All' || fileCategory === selectedCategory;
    const matchesSearch =
      f.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.content.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onUploadFile(e.target.files[0], uploadCategory);
      setIsUploadModalOpen(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onUploadFile(e.dataTransfer.files[0], uploadCategory);
      setIsUploadModalOpen(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#080d1a] border border-[#00f0ff]/30 rounded-2xl p-5 shadow-[0_0_20px_rgba(0,240,255,0.08)]">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center gap-2">
            <BookOpen className="w-7 h-7 text-[#00f0ff]" />
            <span>Grounding Knowledge Base</span>
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">
            Teach TALA about BAIA property, guest services, menus, and San Vicente recommendations.
          </p>
        </div>

        <button
          onClick={() => setIsUploadModalOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-[#00f0ff] text-black font-bold text-xs uppercase tracking-wider hover:bg-[#00f0ff]/80 transition-all flex items-center gap-2 shadow-[0_0_15px_rgba(0,240,255,0.3)] shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add Knowledge</span>
        </button>
      </div>

      {/* Category Filter Tabs & Search Bar */}
      <div className="bg-[#080d1a] border border-[#00f0ff]/20 rounded-2xl p-4 space-y-3">
        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search knowledge documents or content..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#050811] border border-[#00f0ff]/20 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#00f0ff]"
          />
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-[#00f0ff]/20">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setSelectedCategory(cat.value)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                selectedCategory === cat.value
                  ? 'bg-[#00f0ff] text-black font-bold shadow-[0_0_10px_rgba(0,240,255,0.3)]'
                  : 'bg-[#0a0f1d] text-gray-300 hover:text-white border border-[#00f0ff]/15'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Knowledge Documents Grid */}
      {filteredFiles.length === 0 ? (
        <div className="bg-[#080d1a] border border-[#00f0ff]/20 rounded-2xl p-12 text-center text-gray-400 space-y-3">
          <BookOpen className="w-12 h-12 text-[#00f0ff]/30 mx-auto" />
          <h3 className="text-lg font-bold text-white">No Knowledge Documents Found</h3>
          <p className="text-xs text-gray-400 max-w-md mx-auto">
            {selectedCategory !== 'All' || searchTerm
              ? 'No documents match the current search or category filter.'
              : 'Add BAIA resort information, room guides, or local activity FAQs so TALA can accurately answer guest queries.'}
          </p>
          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#00f0ff]/15 text-[#00f0ff] border border-[#00f0ff]/40 text-xs font-bold uppercase tracking-wider hover:bg-[#00f0ff]/25"
          >
            <Plus className="w-4 h-4" />
            <span>Upload Document Now</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredFiles.map((doc) => {
            const cat = doc.category || 'Other';
            return (
              <div
                key={doc.id}
                className="bg-[#080d1a] border border-[#00f0ff]/20 rounded-2xl p-4 flex flex-col justify-between hover:border-[#00f0ff]/50 transition-all shadow-md group"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="p-2 rounded-xl bg-[#00f0ff]/10 text-[#00f0ff] shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#00f0ff]/10 text-[#00f0ff] border border-[#00f0ff]/30">
                      {cat}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-white truncate group-hover:text-[#00f0ff] transition-colors">
                    {doc.name}
                  </h3>

                  <p className="text-xs text-gray-400 line-clamp-3 mt-1.5 font-sans leading-relaxed bg-[#050811] p-2.5 rounded-xl border border-[#00f0ff]/10">
                    {doc.content || 'Empty document content.'}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-[#00f0ff]/10 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-[10px] text-gray-400 font-mono">
                    <HardDrive className="w-3 h-3 text-[#00f0ff]" />
                    <span>{(doc.size / 1024).toFixed(1)} KB</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setPreviewDoc(doc)}
                      title="Preview Document"
                      className="p-1.5 rounded-lg bg-[#00f0ff]/10 text-[#00f0ff] hover:bg-[#00f0ff]/20 transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDeleteFile(doc.id)}
                      title="Delete Document"
                      className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Upload Modal */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#080d1a] border border-[#00f0ff]/40 rounded-2xl w-full max-w-lg p-6 space-y-4 relative shadow-[0_0_30px_rgba(0,240,255,0.2)]">
            <div className="flex items-center justify-between pb-3 border-b border-[#00f0ff]/20">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Upload className="w-5 h-5 text-[#00f0ff]" />
                <span>Upload Grounding Document</span>
              </h3>
              <button
                onClick={() => setIsUploadModalOpen(false)}
                className="text-gray-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Category Selector */}
            <div>
              <label className="block text-xs font-semibold text-gray-300 uppercase mb-1.5">
                Target Knowledge Category
              </label>
              <select
                value={uploadCategory}
                onChange={(e) => setUploadCategory(e.target.value as KnowledgeCategory)}
                className="w-full bg-[#050811] border border-[#00f0ff]/30 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#00f0ff]"
              >
                {CATEGORIES.filter((c) => c.value !== 'All').map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Drag and Drop Zone */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer ${
                dragOver
                  ? 'border-[#00f0ff] bg-[#00f0ff]/10'
                  : 'border-[#00f0ff]/30 hover:border-[#00f0ff] bg-[#050811]'
              }`}
            >
              <Upload className="w-8 h-8 text-[#00f0ff] mx-auto mb-2 animate-bounce" />
              <p className="text-xs font-bold text-white">Drag & drop knowledge files here</p>
              <p className="text-[11px] text-gray-400 mt-1">Supports .txt, .md, .csv, .json format</p>

              <label className="mt-4 inline-block px-4 py-2 rounded-xl bg-[#00f0ff] text-black font-bold text-xs uppercase tracking-wider cursor-pointer hover:bg-[#00f0ff]/80 transition-all shadow-md">
                Browse Files
                <input
                  type="file"
                  accept=".txt,.md,.csv,.json"
                  onChange={handleFileInputChange}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#080d1a] border border-[#00f0ff]/40 rounded-2xl w-full max-w-2xl p-6 space-y-4 relative shadow-[0_0_30px_rgba(0,240,255,0.2)] max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-[#00f0ff]/20 shrink-0">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <FileText className="w-5 h-5 text-[#00f0ff]" />
                  <span>{previewDoc.name}</span>
                </h3>
                <p className="text-xs text-[#00f0ff] mt-0.5">
                  Category: {previewDoc.category || 'Other'} • {(previewDoc.size / 1024).toFixed(1)} KB
                </p>
              </div>
              <button
                onClick={() => setPreviewDoc(null)}
                className="text-gray-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto bg-[#050811] p-4 rounded-xl border border-[#00f0ff]/20 text-xs font-mono text-gray-200 whitespace-pre-wrap leading-relaxed">
              {previewDoc.content}
            </div>

            <div className="pt-2 flex justify-end shrink-0">
              <button
                onClick={() => setPreviewDoc(null)}
                className="px-4 py-2 rounded-xl bg-[#00f0ff]/20 border border-[#00f0ff] text-[#00f0ff] font-bold text-xs uppercase tracking-wider hover:bg-[#00f0ff]/30"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
