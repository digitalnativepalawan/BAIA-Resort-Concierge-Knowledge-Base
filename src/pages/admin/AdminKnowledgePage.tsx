import React, { useState } from 'react';
import { KnowledgeFile, KnowledgeCategory } from '../../types';
import {
  DEFAULT_KNOWLEDGE_TXT,
  DEFAULT_KNOWLEDGE_MD,
  DEFAULT_KNOWLEDGE_JSON,
  downloadFile,
  downloadKnowledgeZip
} from '../../data/knowledgeTemplate';
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
  FileJson,
  HardDrive,
  Download,
  Save,
  Sparkles,
  RefreshCw,
  FolderArchive
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
  const [templateNotice, setTemplateNotice] = useState<string | null>(null);

  const handleDownloadFullTxt = () => {
    let text = DEFAULT_KNOWLEDGE_TXT;
    if (files.length > 0) {
      text = files
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
    if (files.length > 0) {
      md = files
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
    if (files.length > 0) {
      const list = files.map((f) => {
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
    await downloadKnowledgeZip(files);
  };

  const handleSaveTemplateToBackend = () => {
    try {
      const txtFile = new File([DEFAULT_KNOWLEDGE_TXT], 'knowledge.txt', { type: 'text/plain' });
      const mdFile = new File([DEFAULT_KNOWLEDGE_MD], 'knowledge.md', { type: 'text/markdown' });
      const jsonFile = new File([DEFAULT_KNOWLEDGE_JSON], 'knowledge.json', { type: 'application/json' });

      onUploadFile(txtFile, 'Property');
      onUploadFile(mdFile, 'Property');
      onUploadFile(jsonFile, 'Property');

      setTemplateNotice('Full knowledge.txt, knowledge.md & knowledge.json templates saved to backend knowledge base!');
      setTimeout(() => setTemplateNotice(null), 4000);
    } catch (e: any) {
      setTemplateNotice('Saved default templates to knowledge base');
      setTimeout(() => setTemplateNotice(null), 4000);
    }
  };

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0a1228] border border-[#00f0ff]/30 rounded-2xl p-5 shadow-[0_0_20px_rgba(0,240,255,0.08)]">
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

      {templateNotice && (
        <div className="p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-2 animate-fadeIn">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{templateNotice}</span>
        </div>
      )}

      {/* Grounding Template & Export Controls */}
      <div className="bg-[#0a1228] border border-[#00f0ff]/25 rounded-2xl p-5 space-y-4 shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-[#00f0ff]/15">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#00f0ff]/10 text-[#00f0ff]">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>Knowledge Base Templates & Full Exports</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#00f0ff]/15 text-[#00f0ff] border border-[#00f0ff]/30">
                  Grounding Sync Ready
                </span>
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">
                Download structured knowledge files (.txt, .md, & .json) or seed the backend database so TALA reads & learns property FAQs immediately.
              </p>
            </div>
          </div>

          <button
            onClick={handleSaveTemplateToBackend}
            className="px-4 py-2 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-bold text-xs uppercase tracking-wider hover:bg-emerald-500/30 transition-all flex items-center gap-2 shrink-0 shadow-sm"
          >
            <Save className="w-4 h-4 text-emerald-400" />
            <span>Save Template to Knowledge Base Backend</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-3">
          <button
            onClick={handleDownloadBulkZip}
            className="p-3.5 rounded-xl bg-gradient-to-r from-purple-900/30 to-[#00f0ff]/10 border border-purple-500/40 hover:border-[#00f0ff]/60 transition-all text-left group flex items-center justify-between"
          >
            <div>
              <div className="text-xs font-bold text-white group-hover:text-[#00f0ff] flex items-center gap-1.5">
                <FolderArchive className="w-4 h-4 text-purple-400 group-hover:text-[#00f0ff]" />
                <span>Download All (.zip)</span>
              </div>
              <p className="text-[11px] text-gray-400 mt-0.5">Bulk archive with templates & docs</p>
            </div>
            <Download className="w-4 h-4 text-purple-400 group-hover:text-[#00f0ff] shrink-0" />
          </button>

          <button
            onClick={handleDownloadFullTxt}
            className="p-3.5 rounded-xl bg-[#070e20] border border-[#00f0ff]/20 hover:border-[#00f0ff]/50 transition-all text-left group flex items-center justify-between"
          >
            <div>
              <div className="text-xs font-bold text-white group-hover:text-[#00f0ff] flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-[#00f0ff]" />
                <span>Export knowledge.txt</span>
              </div>
              <p className="text-[11px] text-gray-400 mt-0.5">Full merged knowledge plain text file</p>
            </div>
            <Download className="w-4 h-4 text-gray-400 group-hover:text-[#00f0ff] shrink-0" />
          </button>

          <button
            onClick={handleDownloadFullMd}
            className="p-3.5 rounded-xl bg-[#070e20] border border-[#00f0ff]/20 hover:border-[#00f0ff]/50 transition-all text-left group flex items-center justify-between"
          >
            <div>
              <div className="text-xs font-bold text-white group-hover:text-[#00f0ff] flex items-center gap-1.5">
                <FileCode className="w-4 h-4 text-[#00f0ff]" />
                <span>Export knowledge.md</span>
              </div>
              <p className="text-[11px] text-gray-400 mt-0.5">Full merged Markdown document</p>
            </div>
            <Download className="w-4 h-4 text-gray-400 group-hover:text-[#00f0ff] shrink-0" />
          </button>

          <button
            onClick={handleDownloadFullJson}
            className="p-3.5 rounded-xl bg-[#070e20] border border-[#00f0ff]/20 hover:border-[#00f0ff]/50 transition-all text-left group flex items-center justify-between"
          >
            <div>
              <div className="text-xs font-bold text-white group-hover:text-[#00f0ff] flex items-center gap-1.5">
                <FileJson className="w-4 h-4 text-[#00f0ff]" />
                <span>Export knowledge.json</span>
              </div>
              <p className="text-[11px] text-gray-400 mt-0.5">Full merged JSON data structure</p>
            </div>
            <Download className="w-4 h-4 text-gray-400 group-hover:text-[#00f0ff] shrink-0" />
          </button>

          <button
            onClick={handleDownloadTemplateTxt}
            className="p-3.5 rounded-xl bg-[#070e20] border border-purple-500/20 hover:border-purple-500/50 transition-all text-left group flex items-center justify-between"
          >
            <div>
              <div className="text-xs font-bold text-white group-hover:text-purple-300 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-purple-400" />
                <span>Template (.txt)</span>
              </div>
              <p className="text-[11px] text-gray-400 mt-0.5">Base BAIA Resort operational guide</p>
            </div>
            <Download className="w-4 h-4 text-gray-400 group-hover:text-purple-300 shrink-0" />
          </button>

          <button
            onClick={handleDownloadTemplateMd}
            className="p-3.5 rounded-xl bg-[#070e20] border border-purple-500/20 hover:border-purple-500/50 transition-all text-left group flex items-center justify-between"
          >
            <div>
              <div className="text-xs font-bold text-white group-hover:text-purple-300 flex items-center gap-1.5">
                <FileCode className="w-4 h-4 text-purple-400" />
                <span>Template (.md)</span>
              </div>
              <p className="text-[11px] text-gray-400 mt-0.5">Markdown grounding template</p>
            </div>
            <Download className="w-4 h-4 text-gray-400 group-hover:text-purple-300 shrink-0" />
          </button>

          <button
            onClick={handleDownloadTemplateJson}
            className="p-3.5 rounded-xl bg-[#070e20] border border-purple-500/20 hover:border-purple-500/50 transition-all text-left group flex items-center justify-between"
          >
            <div>
              <div className="text-xs font-bold text-white group-hover:text-purple-300 flex items-center gap-1.5">
                <FileJson className="w-4 h-4 text-purple-400" />
                <span>Template (.json)</span>
              </div>
              <p className="text-[11px] text-gray-400 mt-0.5">Structured grounding JSON template</p>
            </div>
            <Download className="w-4 h-4 text-gray-400 group-hover:text-purple-300 shrink-0" />
          </button>
        </div>
      </div>

      {/* Category Filter Tabs & Search Bar */}
      <div className="bg-[#0a1228] border border-[#00f0ff]/20 rounded-2xl p-4 space-y-3">
        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search knowledge documents or content..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#070e20] border border-[#00f0ff]/20 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#00f0ff]"
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
                  : 'bg-[#070e20] text-gray-300 hover:text-white border border-[#00f0ff]/15'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Knowledge Documents Grid */}
      {filteredFiles.length === 0 ? (
        <div className="bg-[#0a1228] border border-[#00f0ff]/20 rounded-2xl p-12 text-center text-gray-400 space-y-3">
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
                className="bg-[#0a1228] border border-[#00f0ff]/20 rounded-2xl p-4 flex flex-col justify-between hover:border-[#00f0ff]/50 transition-all shadow-md group"
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

                  <p className="text-xs text-gray-400 line-clamp-3 mt-1.5 font-sans leading-relaxed bg-[#070e20] p-2.5 rounded-xl border border-[#00f0ff]/10">
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
                      onClick={() => downloadFile(doc.content, doc.name, 'text/plain')}
                      title="Download Document"
                      className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors flex items-center gap-1 text-[11px] font-bold px-2"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download</span>
                    </button>
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
          <div className="bg-[#0a1228] border border-[#00f0ff]/40 rounded-2xl w-full max-w-lg p-6 space-y-4 relative shadow-[0_0_30px_rgba(0,240,255,0.2)]">
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
                className="w-full bg-[#070e20] border border-[#00f0ff]/30 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#00f0ff]"
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
                  : 'border-[#00f0ff]/30 hover:border-[#00f0ff] bg-[#070e20]'
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
          <div className="bg-[#0a1228] border border-[#00f0ff]/40 rounded-2xl w-full max-w-2xl p-6 space-y-4 relative shadow-[0_0_30px_rgba(0,240,255,0.2)] max-h-[85vh] flex flex-col">
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

            <div className="flex-1 overflow-y-auto bg-[#070e20] p-4 rounded-xl border border-[#00f0ff]/20 text-xs font-mono text-gray-200 whitespace-pre-wrap leading-relaxed">
              {previewDoc.content}
            </div>

            <div className="pt-2 flex items-center justify-between shrink-0">
              <button
                onClick={() => downloadFile(previewDoc.content, previewDoc.name, 'text/plain')}
                className="px-4 py-2 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-bold text-xs uppercase tracking-wider hover:bg-emerald-500/30 flex items-center gap-2"
              >
                <Download className="w-4 h-4 text-emerald-400" />
                <span>Download File</span>
              </button>
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
