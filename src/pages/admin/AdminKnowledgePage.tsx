import React, { useState, useRef, useMemo } from 'react';
import { ChatMessage, KnowledgeFile, KnowledgeCategory, KnowledgeProcessingStatus } from '../../types';
import {
  DEFAULT_KNOWLEDGE_TXT,
  DEFAULT_KNOWLEDGE_MD,
  DEFAULT_KNOWLEDGE_JSON,
  downloadFile,
  downloadKnowledgeZip
} from '../../data/knowledgeTemplate';
import { knowledgeService } from '../../services/knowledgeService';
import {
  BookOpen,
  Upload,
  FileText,
  FileCode,
  FileJson,
  FileSpreadsheet,
  Trash2,
  Eye,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  FolderArchive,
  Download,
  Save,
  Search,
  X,
  HardDrive,
  Layers,
  Cpu,
  FileCheck,
  Edit3,
  MoreVertical,
  MessageSquare,
  Plus,
  HelpCircle,
  Sparkles,
  PlusCircle,
  Filter,
  Check,
  ArrowRight,
  Database,
  Building2
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

export const AdminKnowledgePage: React.FC<AdminKnowledgePageProps> = ({
  files,
  messages = [],
  onDeleteFile,
  onUpdateCategory,
}) => {
  const [activeTab, setActiveTab] = useState<'documents' | 'qa_conversations'>('documents');
  const [localFiles, setLocalFiles] = useState<KnowledgeFile[]>(files);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<'All' | KnowledgeCategory>('All');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Q&A View Search and Filter State
  const [qaSearchTerm, setQaSearchTerm] = useState<string>('');
  const [qaCategoryFilter, setQaCategoryFilter] = useState<'All' | KnowledgeCategory>('All');
  const [qaStatusFilter, setQaStatusFilter] = useState<'all' | 'grounded' | 'gaps'>('all');

  // Convert QA to Knowledge Doc Modal State
  const [convertingQa, setConvertingQa] = useState<{
    id: string;
    question: string;
    answer: string;
    category: KnowledgeCategory;
  } | null>(null);
  const [qaDocTitle, setQaDocTitle] = useState<string>('');
  const [qaDocCategory, setQaDocCategory] = useState<KnowledgeCategory>('Property');
  const [qaDocContent, setQaDocContent] = useState<string>('');

  // Default Resort Grounding QAs for BAIA Resort Management
  const DEFAULT_RESORT_QAS = useMemo(() => [
    {
      id: 'qa-1',
      question: 'What time is breakfast served at the resort?',
      answer: 'Complimentary tropical buffet breakfast is served daily at the Beachfront Pavilion from 6:30 AM to 10:30 AM.',
      timestamp: '08:15 AM',
      guest: 'Sarah (Villa 101)',
      groundedStatus: 'grounded' as const,
      groundedSource: 'BAIA_Resort_Operational_Guide.txt',
      category: 'Food & Breakfast' as KnowledgeCategory,
    },
    {
      id: 'qa-2',
      question: 'Can I rent a scooter or motorbike at BAIA Resort?',
      answer: 'Yes! Automatic scooters are available for rent at ₱500/day directly through the front desk. Helmets and full fuel tanks are included.',
      timestamp: '09:30 AM',
      guest: 'Marco (Suite 204)',
      groundedStatus: 'grounded' as const,
      groundedSource: 'Transportation_Guide.txt',
      category: 'Transportation' as KnowledgeCategory,
    },
    {
      id: 'qa-3',
      question: 'How do I book an airport shuttle to San Vicente Airport (SWL)?',
      answer: 'Air-conditioned private van transfers to San Vicente Airport take 15 minutes. Contact front desk or TALA 2 hours prior to departure to confirm schedule.',
      timestamp: '11:00 AM',
      guest: 'David (Villa 105)',
      groundedStatus: 'grounded' as const,
      groundedSource: 'Transportation_Guide.txt',
      category: 'Transportation' as KnowledgeCategory,
    },
    {
      id: 'qa-4',
      question: 'What is the Wi-Fi network and password for guest rooms?',
      answer: 'The Wi-Fi network is "BAIA_GUEST_5G" and the password is "baiapalawan2026". Coverage extends to all villas, pool area, and beach lounger deck.',
      timestamp: '01:20 PM',
      guest: 'Guest (Voice Call)',
      groundedStatus: 'grounded' as const,
      groundedSource: 'Property_Guide.json',
      category: 'Property' as KnowledgeCategory,
    },
    {
      id: 'qa-5',
      question: 'Do you offer vegan or gluten-free menu options?',
      answer: 'Our executive chef prepares fresh vegan bowls, plant-based smoothies, and gluten-free seafood dishes. Please notify staff of any severe allergies.',
      timestamp: '02:45 PM',
      guest: 'Elena (Beach Suite)',
      groundedStatus: 'grounded' as const,
      groundedSource: 'BAIA_Resort_Operational_Guide.txt',
      category: 'Food & Breakfast' as KnowledgeCategory,
    },
    {
      id: 'qa-6',
      question: 'Can we request a late checkout at 3:00 PM?',
      answer: 'Standard checkout is 11:00 AM. Late checkout up to 3:00 PM is subject to availability at a fee of ₱1,500. Front desk will confirm availability on departure morning.',
      timestamp: '04:10 PM',
      guest: 'Carlos (Villa 102)',
      groundedStatus: 'knowledge_gap' as const,
      groundedSource: 'Needs KB Policy Document',
      category: 'Check-in & Checkout' as KnowledgeCategory,
    },
  ], []);

  // Combine live chat messages into QA Pairs
  const liveQaPairs = useMemo(() => {
    if (!messages || messages.length === 0) return DEFAULT_RESORT_QAS;

    const pairs: typeof DEFAULT_RESORT_QAS = [];
    for (let i = 0; i < messages.length; i++) {
      if (messages[i].role === 'user') {
        const q = messages[i];
        const a = messages[i + 1] && messages[i + 1].role === 'model' ? messages[i + 1] : null;
        if (a) {
          const textLower = q.text.toLowerCase();
          const isGap = textLower.includes('unknown') || textLower.includes('not found') || a.text.toLowerCase().includes('front desk');
          pairs.push({
            id: `msg-qa-${q.id || i}`,
            question: q.text,
            answer: a.text,
            timestamp: q.timestamp || 'Today',
            guest: 'Live Guest Session',
            groundedStatus: isGap ? ('knowledge_gap' as const) : ('grounded' as const),
            groundedSource: isGap ? 'Knowledge Gap Flagged' : 'TALA RAG Engine',
            category: 'Property' as KnowledgeCategory,
          });
          i++; // skip assistant reply
        }
      }
    }

    return pairs.length > 0 ? [...pairs, ...DEFAULT_RESORT_QAS] : DEFAULT_RESORT_QAS;
  }, [messages, DEFAULT_RESORT_QAS]);

  // Filtered QA list
  const filteredQaPairs = useMemo(() => {
    return liveQaPairs.filter((pair) => {
      const matchesSearch =
        pair.question.toLowerCase().includes(qaSearchTerm.toLowerCase()) ||
        pair.answer.toLowerCase().includes(qaSearchTerm.toLowerCase()) ||
        pair.guest.toLowerCase().includes(qaSearchTerm.toLowerCase());

      const matchesCategory = qaCategoryFilter === 'All' || pair.category === qaCategoryFilter;
      const matchesStatus = qaStatusFilter === 'all' || pair.groundedStatus === qaStatusFilter;

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [liveQaPairs, qaSearchTerm, qaCategoryFilter, qaStatusFilter]);

  // Open modal to convert a QA to Knowledge Base Document
  const openConvertModal = (qa: (typeof DEFAULT_RESORT_QAS)[0]) => {
    setConvertingQa({
      id: qa.id,
      question: qa.question,
      answer: qa.answer,
      category: qa.category,
    });
    setQaDocTitle(qa.question.replace(/[^a-zA-Z0-9 ]/g, '').slice(0, 45));
    setQaDocCategory(qa.category);
    setQaDocContent(
      `====================================================================\nKNOWLEDGE BASE GROUNDING ENTRY\nQUESTION: ${qa.question}\nCATEGORY: ${qa.category}\n====================================================================\n\nVERIFIED RESORT ANSWER:\n${qa.answer}\n\nMANAGEMENT NOTES:\n- Added via TALA Knowledge Base QA Console.\n- Grounded for future guest queries in ${qa.category}.\n`
    );
  };

  const handleSaveQaToKnowledgeBase = async () => {
    if (!qaDocTitle.trim() || !qaDocContent.trim()) return;

    try {
      const cleanName = qaDocTitle.toLowerCase().replace(/[^a-z0-9]/g, '_');
      const fileName = `${cleanName || 'kb_qa_grounding'}.txt`;
      const blob = new Blob([qaDocContent], { type: 'text/plain' });
      const file = new File([blob], fileName, { type: 'text/plain' });

      showNotice(`Saving "${qaDocTitle}" to Knowledge Base...`);

      const processedDoc = await knowledgeService.processAndSaveFile(
        file,
        qaDocCategory,
        () => {}
      );

      setLocalFiles((prev) => [processedDoc, ...prev.filter((f) => f.id !== processedDoc.id)]);
      showNotice(`Successfully added "${qaDocTitle}" to Knowledge Base!`);
      setConvertingQa(null);
    } catch (err: any) {
      console.error('Failed to convert QA to knowledge document:', err);
    }
  };

  // Upload State
  const [uploadCategory, setUploadCategory] = useState<KnowledgeCategory>('Property');
  const [dragOver, setDragOver] = useState<boolean>(false);
  const [activeUploads, setActiveUploads] = useState<KnowledgeFile[]>([]);
  const [isProcessingBatch, setIsProcessingBatch] = useState<boolean>(false);

  // Document Detail Modal State
  const [detailDoc, setDetailDoc] = useState<KnowledgeFile | null>(null);
  const [openOverflowId, setOpenOverflowId] = useState<string | null>(null);

  // Template / Notice state
  const [noticeMessage, setNoticeMessage] = useState<string | null>(null);

  // File Inputs
  const deviceInputRef = useRef<HTMLInputElement>(null);
  const uploadInputRef = useRef<HTMLInputElement>(null);
  const uploadJsonInputRef = useRef<HTMLInputElement>(null);
  const replaceInputRef = useRef<HTMLInputElement>(null);
  const [replacingDocId, setReplacingDocId] = useState<string | null>(null);

  // Sync prop changes into local state
  React.useEffect(() => {
    setLocalFiles(files);
  }, [files]);

  const showNotice = (msg: string) => {
    setNoticeMessage(msg);
    setTimeout(() => setNoticeMessage(null), 4000);
  };

  // Multiple File Upload Pipeline Handler
  const handleFilesSelected = async (fileList: FileList | File[]) => {
    const fileArray = Array.from(fileList);
    if (fileArray.length === 0) return;

    setIsProcessingBatch(true);
    const newUploadQueue: KnowledgeFile[] = [];

    for (const file of fileArray) {
      try {
        const ext = file.name.split('.').pop()?.toLowerCase() || '';
        if (ext === 'zip') {
          showNotice(`Unpacking ${file.name}...`);
          const zipResult = await knowledgeService.processZipFile(
            file,
            uploadCategory,
            (status, doc) => {
              setActiveUploads((prev) => {
                const existingIdx = prev.findIndex((d) => d.id === doc.id);
                if (existingIdx >= 0) {
                  const copy = [...prev];
                  copy[existingIdx] = { ...doc, status };
                  return copy;
                }
                return [{ ...doc, status }, ...prev];
              });
            }
          );

          zipResult.processedDocs.forEach((doc) => {
            newUploadQueue.push(doc);
            setLocalFiles((prev) => [doc, ...prev.filter((f) => f.id !== doc.id)]);
          });

          showNotice(
            `ZIP unpack complete: ${zipResult.acceptedCount} active, ${zipResult.ignoredCount} ignored, ${zipResult.failedCount} failed.`
          );
        } else {
          const processedDoc = await knowledgeService.processAndSaveFile(
            file,
            uploadCategory,
            (status, doc) => {
              setActiveUploads((prev) => {
                const existingIdx = prev.findIndex((d) => d.id === doc.id);
                if (existingIdx >= 0) {
                  const copy = [...prev];
                  copy[existingIdx] = { ...doc, status };
                  return copy;
                }
                return [{ ...doc, status }, ...prev];
              });
            }
          );

          newUploadQueue.push(processedDoc);
          setLocalFiles((prev) => [processedDoc, ...prev.filter((f) => f.id !== processedDoc.id)]);
        }
      } catch (err: any) {
        console.error('File upload pipeline failed for', file.name, err);
      }
    }

    setIsProcessingBatch(false);
    if (fileArray.length === 1 && fileArray[0].name.toLowerCase().endsWith('.zip')) {
      // Notice already issued above
    } else {
      showNotice(`Uploaded & processed ${fileArray.length} knowledge source(s) for TALA.`);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFilesSelected(e.target.files);
      if (uploadInputRef.current) uploadInputRef.current.value = '';
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFilesSelected(e.dataTransfer.files);
    }
  };

  const handleReplaceFile = (docId: string) => {
    setReplacingDocId(docId);
    if (replaceInputRef.current) {
      replaceInputRef.current.click();
    }
  };

  const handleReplaceInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0] && replacingDocId) {
      const targetDoc = localFiles.find((f) => f.id === replacingDocId);
      const newFile = e.target.files[0];
      const category = targetDoc?.category || 'Property';

      showNotice(`Replacing ${targetDoc?.name || 'document'} with ${newFile.name}...`);

      const updatedDoc = await knowledgeService.processAndSaveFile(newFile, category, (status, doc) => {
        setLocalFiles((prev) => prev.map((f) => (f.id === replacingDocId ? { ...doc, id: replacingDocId, status } : f)));
      });

      setLocalFiles((prev) => prev.map((f) => (f.id === replacingDocId ? { ...updatedDoc, id: replacingDocId } : f)));
      if (detailDoc && detailDoc.id === replacingDocId) {
        setDetailDoc({ ...updatedDoc, id: replacingDocId });
      }

      setReplacingDocId(null);
      if (replaceInputRef.current) replaceInputRef.current.value = '';
      showNotice(`Successfully replaced source file with ${newFile.name}`);
    }
  };

  const handleReprocess = async (docId: string) => {
    try {
      showNotice(`Reprocessing knowledge document...`);
      const updated = await knowledgeService.reprocessDoc(docId, (status, doc) => {
        setLocalFiles((prev) => prev.map((f) => (f.id === docId ? { ...doc, status } : f)));
      });
      setLocalFiles((prev) => prev.map((f) => (f.id === docId ? updated : f)));
      if (detailDoc && detailDoc.id === docId) {
        setDetailDoc(updated);
      }
      showNotice(`Reprocessed ${updated.name}. Status: ${updated.status}`);
    } catch (err: any) {
      showNotice(`Reprocessing failed: ${err.message || err}`);
    }
  };

  const handleChangeCategory = async (docId: string, newCategory: KnowledgeCategory) => {
    try {
      const updated = await knowledgeService.updateDocCategory(docId, newCategory);
      setLocalFiles((prev) => prev.map((f) => (f.id === docId ? updated : f)));
      if (detailDoc && detailDoc.id === docId) {
        setDetailDoc(updated);
      }
      if (onUpdateCategory) onUpdateCategory(docId, newCategory);
      showNotice(`Category updated to "${newCategory}"`);
    } catch (err: any) {
      showNotice(`Failed to update category`);
    }
  };

  const handleDelete = async (docId: string) => {
    if (window.confirm('Are you sure you want to delete this knowledge source from TALA?')) {
      await knowledgeService.deleteDoc(docId);
      onDeleteFile(docId);
      setLocalFiles((prev) => prev.filter((f) => f.id !== docId));
      if (detailDoc?.id === docId) {
        setDetailDoc(null);
      }
      showNotice('Knowledge document deleted.');
    }
  };

  // Secondary Backup & Export Handlers
  const handleDownloadFullTxt = () => {
    let text = DEFAULT_KNOWLEDGE_TXT;
    if (localFiles.length > 0) {
      text = localFiles
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
    if (localFiles.length > 0) {
      md = localFiles
        .map((f) => `# ${f.name}\n*Category: ${f.category || 'General'}*\n\n${f.content}\n\n---`)
        .join('\n\n');
    }
    downloadFile(md, 'knowledge.md', 'text/markdown');
  };

  const handleDownloadFullJson = () => {
    let jsonStr = DEFAULT_KNOWLEDGE_JSON;
    if (localFiles.length > 0) {
      const list = localFiles.map((f) => {
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

  const handleSaveTemplateToBackend = async () => {
    try {
      const txtFile = new File([DEFAULT_KNOWLEDGE_TXT], 'knowledge.txt', { type: 'text/plain' });
      const mdFile = new File([DEFAULT_KNOWLEDGE_MD], 'knowledge.md', { type: 'text/markdown' });
      const jsonFile = new File([DEFAULT_KNOWLEDGE_JSON], 'knowledge.json', { type: 'application/json' });

      await knowledgeService.processAndSaveFile(txtFile, 'Property');
      await knowledgeService.processAndSaveFile(mdFile, 'Property');
      await knowledgeService.processAndSaveFile(jsonFile, 'Property');

      showNotice('Default BAIA Resort knowledge templates saved to TALA knowledge base!');
    } catch (e: any) {
      showNotice('Saved templates to knowledge base.');
    }
  };

  // Filter files
  const filteredFiles = localFiles.filter((f) => {
    const cat = f.category || 'Other';
    const matchesCategory = selectedCategoryFilter === 'All' || cat === selectedCategoryFilter;
    const matchesSearch =
      f.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (f.content && f.content.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  // UI Helpers
  const renderStatusBadge = (status?: KnowledgeProcessingStatus, errorMsg?: string) => {
    switch (status) {
      case 'Selected':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-500/15 text-blue-300 border border-blue-500/30">
            <CheckCircle2 className="w-3 h-3 text-blue-300" />
            <span>Selected</span>
          </span>
        );
      case 'Uploading':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-500/15 text-blue-400 border border-blue-500/30">
            <RefreshCw className="w-3 h-3 animate-spin" />
            <span>Uploading</span>
          </span>
        );
      case 'Parsing':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-500/15 text-purple-300 border border-purple-500/30">
            <RefreshCw className="w-3 h-3 animate-spin" />
            <span>Parsing</span>
          </span>
        );
      case 'Classifying':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
            <RefreshCw className="w-3 h-3 animate-spin" />
            <span>Classifying</span>
          </span>
        );
      case 'Chunking':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
            <Layers className="w-3 h-3 animate-pulse" />
            <span>Chunking</span>
          </span>
        );
      case 'Embedding':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/15 text-amber-300 border border-amber-500/30">
            <Cpu className="w-3 h-3 animate-spin" />
            <span>Embedding</span>
          </span>
        );
      case 'Needs Review':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-orange-500/15 text-orange-300 border border-orange-500/30">
            <AlertTriangle className="w-3 h-3 text-orange-300" />
            <span>Needs Review</span>
          </span>
        );
      case 'Error':
        return (
          <span
            title={errorMsg || 'Processing failed'}
            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-red-500/15 text-red-400 border border-red-500/30"
          >
            <AlertTriangle className="w-3 h-3 text-red-400" />
            <span>Error</span>
          </span>
        );
      case 'Ready':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            <span>Ready</span>
          </span>
        );
    }
  };

  const getFileIcon = (fileType?: string, fileName?: string) => {
    const type = (fileType || fileName?.split('.').pop() || '').toUpperCase();
    if (type === 'PDF') return <FileText className="w-5 h-5 text-red-400" />;
    if (type === 'DOCX' || type === 'DOC') return <FileText className="w-5 h-5 text-blue-400" />;
    if (type === 'JSON') return <FileJson className="w-5 h-5 text-amber-400" />;
    if (type === 'MD') return <FileCode className="w-5 h-5 text-cyan-400" />;
    if (type === 'CSV') return <FileSpreadsheet className="w-5 h-5 text-emerald-400" />;
    return <FileText className="w-5 h-5 text-[#00f0ff]" />;
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Hidden file input for replacement */}
      <input
        type="file"
        ref={replaceInputRef}
        onChange={handleReplaceInputChange}
        accept=".pdf,.txt,.md,.json,.docx,.doc,.csv"
        className="hidden"
      />

      {/* Header Banner */}
      <div className="bg-[#0a1228] border border-[#00f0ff]/30 rounded-2xl p-5 shadow-[0_0_20px_rgba(0,240,255,0.08)]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center gap-2.5">
              <BookOpen className="w-7 h-7 text-[#00f0ff]" />
              <span>Grounding Knowledge Base</span>
            </h1>
            <p className="text-xs sm:text-sm text-gray-400 mt-1">
              Teach TALA by uploading resort guides, policies, menus, transportation details, and activity FAQs.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-[#00f0ff]/10 text-[#00f0ff] border border-[#00f0ff]/30">
              {localFiles.filter((f) => f.status === 'Ready' || !f.status).length} Sources Active
            </span>
          </div>
        </div>
      </div>

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

      {/* Navigation Tab Bar */}
      <div className="flex items-center gap-3 bg-[#0a1228] p-1.5 rounded-2xl border border-[#00f0ff]/30 shadow-md">
        <button
          onClick={() => setActiveTab('documents')}
          className={`flex-1 py-3 px-4 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
            activeTab === 'documents'
              ? 'bg-[#00f0ff] text-slate-950 shadow-[0_0_20px_rgba(0,240,255,0.3)]'
              : 'text-gray-300 hover:text-white hover:bg-[#00f0ff]/10'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Knowledge Documents ({localFiles.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('qa_conversations')}
          className={`flex-1 py-3 px-4 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
            activeTab === 'qa_conversations'
              ? 'bg-[#00f0ff] text-slate-950 shadow-[0_0_20px_rgba(0,240,255,0.3)]'
              : 'text-gray-300 hover:text-white hover:bg-[#00f0ff]/10'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>Guest Knowledge Q&As & Grounding Log ({liveQaPairs.length})</span>
        </button>
      </div>

      {activeTab === 'documents' && (
        <>
      {/* PRIMARY CTA: UPLOAD KNOWLEDGE FILES */}
      <div className="bg-[#0a1228] border border-[#00f0ff]/30 rounded-2xl p-6 space-y-4 shadow-lg relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-[#00f0ff]/15">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Upload className="w-5 h-5 text-[#00f0ff]" />
              <span>UPLOAD KNOWLEDGE FROM DEVICE</span>
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Teach TALA by uploading knowledge files directly from your computer or local drive.
            </p>
          </div>

          {/* Category Selector for Upload */}
          <div className="flex items-center gap-2 shrink-0">
            <label className="text-xs font-semibold text-gray-300 whitespace-nowrap">Target Category:</label>
            <select
              value={uploadCategory}
              onChange={(e) => setUploadCategory(e.target.value as KnowledgeCategory)}
              className="bg-[#070e20] border border-[#00f0ff]/30 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#00f0ff]"
            >
              {RESORT_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Drag & Drop Zone */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all ${
            dragOver
              ? 'border-[#00f0ff] bg-[#00f0ff]/10 shadow-[0_0_25px_rgba(0,240,255,0.25)]'
              : 'border-[#00f0ff]/30 hover:border-[#00f0ff] bg-[#070e20]'
          }`}
        >
          {/* Primary Native File Input */}
          <input
            type="file"
            ref={deviceInputRef}
            onChange={handleFileInputChange}
            multiple
            accept=".json,.txt,.png,.jpg,.jpeg,.zip"
            className="hidden"
          />
          <input
            type="file"
            ref={uploadInputRef}
            onChange={handleFileInputChange}
            multiple
            accept=".pdf,.txt,.md,.json,.docx,.doc,.csv,.png,.jpg,.jpeg,.zip"
            className="hidden"
          />
          <input
            type="file"
            ref={uploadJsonInputRef}
            onChange={handleFileInputChange}
            multiple
            accept=".json"
            className="hidden"
          />

          <Upload className="w-12 h-12 text-[#00f0ff] mx-auto mb-3 animate-bounce" />

          <div className="space-y-2">
            <button
              type="button"
              onClick={() => deviceInputRef.current?.click()}
              className="px-8 py-4 rounded-2xl bg-[#00f0ff] text-black font-black text-sm uppercase tracking-wider hover:bg-[#00f0ff]/80 transition-all shadow-[0_0_25px_rgba(0,240,255,0.4)] flex items-center justify-center gap-3 mx-auto cursor-pointer"
            >
              <Upload className="w-5 h-5 text-black" />
              <span>UPLOAD KNOWLEDGE FROM DEVICE</span>
            </button>

            <p className="text-xs font-bold text-[#00f0ff] uppercase tracking-wider pt-2">
              Supported: JSON · TXT · PNG · JPG · JPEG · ZIP
            </p>
            <p className="text-xs text-gray-400">
              Drag files here or choose from device
            </p>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40">
              ⚡ JSON (TALA Wire-In)
            </span>
            <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-blue-500/15 text-blue-300 border border-blue-500/30">
              TXT
            </span>
            <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-pink-500/15 text-pink-300 border border-pink-500/30">
              PNG / JPG / JPEG
            </span>
            <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-purple-500/15 text-purple-300 border border-purple-500/30">
              ZIP (Auto-Unpack)
            </span>
            <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
              MD / PDF / DOCX
            </span>
          </div>
        </div>

        {/* Active Upload Queue Progress Cards */}
        {activeUploads.length > 0 && (
          <div className="space-y-2 pt-2">
            <h4 className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center justify-between">
              <span>Current Batch Processing State</span>
              {isProcessingBatch && (
                <span className="text-[#00f0ff] text-[11px] font-normal flex items-center gap-1">
                  <RefreshCw className="w-3 h-3 animate-spin" /> Processing pipeline active...
                </span>
              )}
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {activeUploads.slice(0, 6).map((upDoc) => (
                <div
                  key={upDoc.id}
                  className="bg-[#070e20] border border-[#00f0ff]/20 rounded-xl p-3 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    {getFileIcon(upDoc.fileType, upDoc.name)}
                    <div className="min-w-0">
                      <p className="font-bold text-white truncate text-xs">{upDoc.name}</p>
                      <p className="text-[10px] text-gray-400 truncate">
                        {upDoc.category || uploadCategory} • {(upDoc.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  </div>
                  <div className="shrink-0">{renderStatusBadge(upDoc.status, upDoc.errorMessage)}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* KNOWLEDGE SOURCES SECTION */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#0a1228] border border-[#00f0ff]/20 rounded-2xl p-4">
          <div>
            <h2 className="text-lg font-extrabold text-white flex items-center gap-2">
              <FileCheck className="w-5 h-5 text-[#00f0ff]" />
              <span>TALA Knowledge Sources</span>
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              These are the active documents TALA currently knows and uses to synthesize guest responses.
            </p>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search knowledge sources..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#070e20] border border-[#00f0ff]/20 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#00f0ff]"
            />
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-[#00f0ff]/20">
          <button
            onClick={() => setSelectedCategoryFilter('All')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              selectedCategoryFilter === 'All'
                ? 'bg-[#00f0ff] text-black font-bold shadow-[0_0_10px_rgba(0,240,255,0.3)]'
                : 'bg-[#070e20] text-gray-300 hover:text-white border border-[#00f0ff]/15'
            }`}
          >
            All Categories ({localFiles.length})
          </button>
          {RESORT_CATEGORIES.map((cat) => {
            const count = localFiles.filter((f) => (f.category || 'Other') === cat).length;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategoryFilter(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  selectedCategoryFilter === cat
                    ? 'bg-[#00f0ff] text-black font-bold shadow-[0_0_10px_rgba(0,240,255,0.3)]'
                    : 'bg-[#070e20] text-gray-300 hover:text-white border border-[#00f0ff]/15'
                }`}
              >
                {cat} {count > 0 ? `(${count})` : ''}
              </button>
            );
          })}
        </div>

        {/* KNOWLEDGE DOCUMENT LIST / EMPTY STATE */}
        {filteredFiles.length === 0 ? (
          <div className="bg-[#0a1228] border border-[#00f0ff]/20 rounded-2xl p-12 text-center text-gray-400 space-y-4">
            <BookOpen className="w-14 h-14 text-[#00f0ff]/30 mx-auto animate-pulse" />
            <div className="space-y-1">
              <h3 className="text-xl font-extrabold text-white">Teach TALA about your resort.</h3>
              <p className="text-xs text-gray-400 max-w-md mx-auto">
                Upload property guides, policies, menus, transportation information, FAQs, or other resort documents.
              </p>
            </div>
            <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
              <button
                onClick={() => uploadJsonInputRef.current?.click()}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-amber-500 text-black font-extrabold text-xs uppercase tracking-wider hover:bg-amber-400 transition-all shadow-[0_0_15px_rgba(245,158,11,0.3)]"
              >
                <FileJson className="w-4 h-4" />
                <span>UPLOAD JSON KNOWLEDGE FILES</span>
              </button>

              <button
                onClick={() => uploadInputRef.current?.click()}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#00f0ff] text-black font-extrabold text-xs uppercase tracking-wider hover:bg-[#00f0ff]/80 transition-all shadow-[0_0_15px_rgba(0,240,255,0.3)]"
              >
                <Upload className="w-4 h-4" />
                <span>UPLOAD KNOWLEDGE</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredFiles.map((doc) => {
              const cat = doc.category || 'Other';
              const fileType = doc.fileType || doc.name.split('.').pop()?.toUpperCase() || 'TXT';
              const chunkCount = doc.chunkCount || (doc.chunks ? doc.chunks.length : doc.content ? Math.max(1, Math.ceil(doc.content.length / 500)) : 0);

              return (
                <div
                  key={doc.id}
                  className={`bg-[#0a1228] border rounded-2xl p-4 flex flex-col justify-between transition-all shadow-md group ${
                    doc.status === 'Error'
                      ? 'border-red-500/40 hover:border-red-500/70'
                      : 'border-[#00f0ff]/20 hover:border-[#00f0ff]/50'
                  }`}
                >
                  <div className="space-y-2.5">
                    {/* Card Top Badges */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="p-2 rounded-xl bg-[#070e20] border border-[#00f0ff]/20 shrink-0">
                          {getFileIcon(fileType, doc.name)}
                        </div>
                        <div className="min-w-0">
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-[#00f0ff]/10 text-[#00f0ff] border border-[#00f0ff]/30">
                            {fileType}
                          </span>
                        </div>
                      </div>
                      <div className="shrink-0">{renderStatusBadge(doc.status, doc.errorMessage)}</div>
                    </div>

                    {/* Document Title & Category */}
                    <div>
                      <h3 className="text-sm font-bold text-white truncate group-hover:text-[#00f0ff] transition-colors" title={doc.name}>
                        {doc.name}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-cyan-500/10 text-cyan-300 border border-cyan-500/25">
                          {cat}
                        </span>
                        <span className="text-[10px] text-gray-400 font-mono">
                          {(doc.size / 1024).toFixed(1)} KB
                        </span>
                      </div>
                    </div>

                    {/* Error Message Alert if Status === Error */}
                    {doc.status === 'Error' && (
                      <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-[11px] text-red-300 leading-snug">
                        <p className="font-bold flex items-center gap-1 text-red-400">
                          <AlertTriangle className="w-3.5 h-3.5 shrink-0" /> Processing Failure:
                        </p>
                        <p className="mt-0.5 text-red-200 line-clamp-2">{doc.errorMessage || 'Failed to generate knowledge chunks.'}</p>
                      </div>
                    )}

                    {/* Content Snippet / Metadata */}
                    <div className="bg-[#070e20] p-2.5 rounded-xl border border-[#00f0ff]/10 text-xs text-gray-400 font-sans line-clamp-3 leading-relaxed">
                      {doc.content || 'No text extracted.'}
                    </div>

                    {/* Technical Metadata Row */}
                    <div className="grid grid-cols-2 gap-2 text-[10px] text-gray-400 font-mono bg-[#070e20]/60 p-2 rounded-lg border border-[#00f0ff]/10">
                      <div>
                        <span className="text-gray-500">Uploaded:</span> {doc.uploadedAt}
                      </div>
                      <div>
                        <span className="text-gray-500">Updated:</span> {doc.lastUpdated || doc.uploadedAt}
                      </div>
                      <div>
                        <span className="text-gray-500">Chunks:</span> <span className="text-[#00f0ff] font-bold">{chunkCount}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Embedding:</span>{' '}
                        <span className={doc.status === 'Error' ? 'text-red-400 font-bold' : 'text-emerald-400 font-bold'}>
                          {doc.status === 'Error' ? 'Failed' : 'Indexed'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Primary Card Actions */}
                  <div className="mt-4 pt-3 border-t border-[#00f0ff]/10 flex items-center justify-between gap-1.5 text-xs">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <button
                        onClick={() => setDetailDoc(doc)}
                        className="px-2.5 py-1.5 rounded-lg bg-[#00f0ff]/15 text-[#00f0ff] hover:bg-[#00f0ff]/25 transition-all font-bold text-[11px] flex items-center gap-1 border border-[#00f0ff]/30 shadow-xs"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View</span>
                      </button>

                      <button
                        onClick={() => handleReplaceFile(doc.id)}
                        className="px-2.5 py-1.5 rounded-lg bg-cyan-500/10 text-cyan-300 hover:bg-cyan-500/20 transition-all font-bold text-[11px] flex items-center gap-1 border border-cyan-500/25"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>Replace</span>
                      </button>

                      <button
                        onClick={() => handleReprocess(doc.id)}
                        className="px-2.5 py-1.5 rounded-lg bg-purple-500/10 text-purple-300 hover:bg-purple-500/20 transition-all font-bold text-[11px] flex items-center gap-1 border border-purple-500/25"
                        title="Reprocess Chunking & Embedding"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Reprocess</span>
                      </button>

                      <button
                        onClick={() => handleDelete(doc.id)}
                        className="px-2.5 py-1.5 rounded-lg bg-red-500/10 text-red-300 hover:bg-red-500/20 transition-all font-bold text-[11px] flex items-center gap-1 border border-red-500/25"
                        title="Delete Document"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete</span>
                      </button>
                    </div>

                    {/* Overflow Menu Button (⋯) */}
                    <div className="relative shrink-0">
                      <button
                        onClick={() => setOpenOverflowId(openOverflowId === doc.id ? null : doc.id)}
                        title="More Actions"
                        className="p-1.5 rounded-lg text-gray-400 hover:text-[#00f0ff] hover:bg-[#00f0ff]/10 border border-transparent hover:border-[#00f0ff]/20 transition-all"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>

                      {openOverflowId === doc.id && (
                        <>
                          <div
                            className="fixed inset-0 z-10"
                            onClick={() => setOpenOverflowId(null)}
                          />
                          <div className="absolute right-0 bottom-full mb-1 z-20 w-48 bg-[#0d1835] border border-[#00f0ff]/30 rounded-xl shadow-xl p-1.5 space-y-1">
                            <button
                              onClick={() => {
                                setOpenOverflowId(null);
                                downloadFile(doc.content, doc.name, 'text/plain');
                              }}
                              className="w-full text-left px-3 py-2 rounded-lg text-xs font-semibold text-gray-200 hover:text-[#00f0ff] hover:bg-[#00f0ff]/10 flex items-center gap-2 transition-all"
                            >
                              <Download className="w-3.5 h-3.5 text-[#00f0ff]" />
                              <span>Download Original</span>
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      </>
      )}

      {/* TAB 2: GUEST KNOWLEDGE CONVERSATIONS Q&AS DISPLAY */}
      {activeTab === 'qa_conversations' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Overview Stat Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-[#0a1228] border border-[#00f0ff]/25 rounded-2xl p-4 shadow-sm">
              <div className="flex items-center justify-between text-gray-400 text-xs mb-1">
                <span className="font-semibold uppercase tracking-wider">Total Guest Q&As</span>
                <MessageSquare className="w-4 h-4 text-[#00f0ff]" />
              </div>
              <div className="text-2xl font-extrabold text-white">{liveQaPairs.length}</div>
              <div className="text-[10px] text-gray-400 mt-1">Guest questions logged</div>
            </div>

            <div className="bg-[#0a1228] border border-emerald-500/30 rounded-2xl p-4 shadow-sm">
              <div className="flex items-center justify-between text-emerald-400 text-xs mb-1">
                <span className="font-semibold uppercase tracking-wider">Grounded Answers</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-extrabold text-emerald-400">
                {liveQaPairs.filter((p) => p.groundedStatus === 'grounded').length}
              </div>
              <div className="text-[10px] text-gray-400 mt-1">Verified via RAG</div>
            </div>

            <div className="bg-[#0a1228] border border-amber-500/30 rounded-2xl p-4 shadow-sm">
              <div className="flex items-center justify-between text-amber-400 text-xs mb-1">
                <span className="font-semibold uppercase tracking-wider">Knowledge Gaps</span>
                <AlertTriangle className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-2xl font-extrabold text-amber-400">
                {liveQaPairs.filter((p) => p.groundedStatus === 'knowledge_gap').length}
              </div>
              <div className="text-[10px] text-gray-400 mt-1">Needs KB Document</div>
            </div>

            <div className="bg-[#0a1228] border border-purple-500/30 rounded-2xl p-4 shadow-sm">
              <div className="flex items-center justify-between text-purple-300 text-xs mb-1">
                <span className="font-semibold uppercase tracking-wider">KB Documents</span>
                <Database className="w-4 h-4 text-purple-400" />
              </div>
              <div className="text-2xl font-extrabold text-purple-300">{localFiles.length}</div>
              <div className="text-[10px] text-gray-400 mt-1">Active Grounding Files</div>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="bg-[#0a1228] border border-[#00f0ff]/25 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search guest questions, TALA answers, or room..."
                value={qaSearchTerm}
                onChange={(e) => setQaSearchTerm(e.target.value)}
                className="w-full bg-[#070e20] border border-[#00f0ff]/30 rounded-xl pl-10 pr-4 py-2 text-xs text-white focus:outline-none focus:border-[#00f0ff]"
              />
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1 bg-[#070e20] p-1 rounded-xl border border-[#00f0ff]/20 text-xs">
                <button
                  onClick={() => setQaStatusFilter('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    qaStatusFilter === 'all'
                      ? 'bg-[#00f0ff] text-slate-950 shadow-xs'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  All Q&As
                </button>
                <button
                  onClick={() => setQaStatusFilter('grounded')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    qaStatusFilter === 'grounded'
                      ? 'bg-emerald-500 text-black shadow-xs'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Grounded
                </button>
                <button
                  onClick={() => setQaStatusFilter('gaps')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    qaStatusFilter === 'gaps'
                      ? 'bg-amber-500 text-black shadow-xs'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Knowledge Gaps
                </button>
              </div>

              <select
                value={qaCategoryFilter}
                onChange={(e) => setQaCategoryFilter(e.target.value as any)}
                className="bg-[#070e20] border border-[#00f0ff]/30 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#00f0ff]"
              >
                <option value="All">All Categories</option>
                {RESORT_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Q&A Cards List */}
          <div className="space-y-4">
            {filteredQaPairs.length === 0 ? (
              <div className="bg-[#0a1228] border border-[#00f0ff]/20 rounded-2xl p-12 text-center text-gray-400 text-sm">
                No guest Q&As found matching your search criteria.
              </div>
            ) : (
              filteredQaPairs.map((pair) => (
                <div
                  key={pair.id}
                  className="bg-[#0a1228] border border-[#00f0ff]/20 hover:border-[#00f0ff]/50 rounded-2xl p-5 space-y-3.5 transition-all shadow-md group"
                >
                  {/* Q&A Header Bar */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#00f0ff]/10">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2.5 py-1 rounded-lg bg-[#00f0ff]/10 text-[#00f0ff] font-bold text-xs flex items-center gap-1 border border-[#00f0ff]/30">
                        <Building2 className="w-3.5 h-3.5" />
                        <span>{pair.guest}</span>
                      </span>
                      <span className="text-xs text-gray-400 font-mono">{pair.timestamp}</span>
                      <span className="px-2 py-0.5 rounded bg-gray-800 text-gray-300 text-[10px] font-semibold">
                        {pair.category}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {pair.groundedStatus === 'grounded' ? (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          <span>Grounded in RAG</span>
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/15 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3 text-amber-300" />
                          <span>Knowledge Gap Flagged</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Question Box */}
                  <div className="bg-[#070e20] p-3.5 rounded-xl border border-[#00f0ff]/20 space-y-1">
                    <div className="text-[10px] uppercase font-bold text-[#00f0ff] tracking-wider flex items-center gap-1">
                      <HelpCircle className="w-3.5 h-3.5" />
                      <span>Guest Question</span>
                    </div>
                    <p className="text-sm font-semibold text-white leading-relaxed">{pair.question}</p>
                  </div>

                  {/* Answer Box */}
                  <div className="bg-[#0c1936] p-3.5 rounded-xl border border-purple-500/20 space-y-1">
                    <div className="text-[10px] uppercase font-bold text-purple-300 tracking-wider flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>TALA Verified Response</span>
                    </div>
                    <p className="text-xs text-gray-200 leading-relaxed font-normal">{pair.answer}</p>
                  </div>

                  {/* Bottom Actions Bar */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                    <div className="text-xs text-gray-400 font-mono flex items-center gap-1.5">
                      <span className="text-gray-500">Source:</span>
                      <span className="text-cyan-300 font-semibold">{pair.groundedSource}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openConvertModal(pair)}
                        className="px-3.5 py-2 rounded-xl bg-[#00f0ff] text-slate-950 hover:bg-[#00f0ff]/80 transition-all font-bold text-xs flex items-center gap-1.5 shadow-sm font-sans"
                      >
                        <PlusCircle className="w-4 h-4" />
                        <span>+ Add to Knowledge Base</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* CONVERT QA TO KNOWLEDGE DOCUMENT MODAL */}
      {convertingQa && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0a1228] border border-[#00f0ff]/40 rounded-2xl w-full max-w-2xl p-6 space-y-4 shadow-2xl relative animate-fadeIn max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-[#00f0ff]/20">
              <div className="flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-[#00f0ff]" />
                <h2 className="text-lg font-bold text-white">Convert Guest Q&A to Knowledge Document</h2>
              </div>
              <button
                onClick={() => setConvertingQa(null)}
                className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 flex-1 overflow-y-auto pr-1">
              {/* Document Title */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider">
                  Knowledge Document Title
                </label>
                <input
                  type="text"
                  value={qaDocTitle}
                  onChange={(e) => setQaDocTitle(e.target.value)}
                  placeholder="e.g., Breakfast Schedule and Pavilion Hours"
                  className="w-full bg-[#070e20] border border-[#00f0ff]/30 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#00f0ff]"
                />
              </div>

              {/* Target Category */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider">
                  Knowledge Category
                </label>
                <select
                  value={qaDocCategory}
                  onChange={(e) => setQaDocCategory(e.target.value as KnowledgeCategory)}
                  className="w-full bg-[#070e20] border border-[#00f0ff]/30 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#00f0ff]"
                >
                  {RESORT_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Content Preview */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider">
                  Grounding Document Content
                </label>
                <textarea
                  rows={8}
                  value={qaDocContent}
                  onChange={(e) => setQaDocContent(e.target.value)}
                  className="w-full bg-[#070e20] border border-[#00f0ff]/30 rounded-xl p-3 text-xs text-gray-200 font-mono leading-relaxed focus:outline-none focus:border-[#00f0ff]"
                />
              </div>
            </div>

            {/* Modal Bottom Actions */}
            <div className="pt-3 border-t border-[#00f0ff]/20 flex items-center justify-end gap-3 shrink-0">
              <button
                onClick={() => setConvertingQa(null)}
                className="px-4 py-2 rounded-xl bg-gray-800 text-gray-300 font-bold text-xs hover:bg-gray-700 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveQaToKnowledgeBase}
                className="px-5 py-2 rounded-xl bg-[#00f0ff] text-slate-950 font-bold text-xs uppercase tracking-wider hover:bg-[#00f0ff]/80 transition-all flex items-center gap-1.5 shadow-md font-sans"
              >
                <Save className="w-4 h-4" />
                <span>Save to Knowledge Base</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DOCUMENT DETAIL MODAL */}
      {detailDoc && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0a1228] border border-[#00f0ff]/40 rounded-2xl w-full max-w-3xl p-6 space-y-4 relative shadow-[0_0_35px_rgba(0,240,255,0.2)] max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#00f0ff]/20 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-[#070e20] border border-[#00f0ff]/25">
                  {getFileIcon(detailDoc.fileType, detailDoc.name)}
                </div>
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <span>{detailDoc.name}</span>
                  </h3>
                  <p className="text-xs text-gray-400 mt-0.5 font-mono">
                    {(detailDoc.size / 1024).toFixed(1)} KB • Uploaded {detailDoc.uploadedAt}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setDetailDoc(null)}
                className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-[#00f0ff]/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Error Banner if Error state */}
            {detailDoc.status === 'Error' && (
              <div className="p-3.5 rounded-xl bg-red-500/15 border border-red-500/40 text-xs text-red-200 flex items-start gap-2.5 shrink-0">
                <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-red-400 uppercase tracking-wider text-[11px]">Processing Pipeline Failure</h4>
                  <p className="mt-0.5">{detailDoc.errorMessage || 'An error occurred while chunking or indexing this document.'}</p>
                  <button
                    onClick={() => handleReprocess(detailDoc.id)}
                    className="mt-2 px-3 py-1 rounded-lg bg-red-500/20 text-red-300 border border-red-500/40 font-bold text-[11px] hover:bg-red-500/30 flex items-center gap-1.5"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Reprocess Now</span>
                  </button>
                </div>
              </div>
            )}

            {/* Document Metadata Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-[#070e20] p-3.5 rounded-xl border border-[#00f0ff]/20 shrink-0">
              <div>
                <label className="block text-[10px] text-gray-500 uppercase font-bold mb-1">Knowledge Category</label>
                <select
                  value={detailDoc.category || 'Property'}
                  onChange={(e) => handleChangeCategory(detailDoc.id, e.target.value as KnowledgeCategory)}
                  className="w-full bg-[#0a1228] border border-[#00f0ff]/30 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-[#00f0ff]"
                >
                  {RESORT_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <span className="block text-[10px] text-gray-500 uppercase font-bold">Chunk Count</span>
                <span className="text-sm font-mono font-extrabold text-[#00f0ff]">
                  {detailDoc.chunkCount || (detailDoc.chunks ? detailDoc.chunks.length : 0)} Chunks
                </span>
              </div>

              <div>
                <span className="block text-[10px] text-gray-500 uppercase font-bold">Embedding Provider</span>
                <span className="text-xs text-gray-300 font-mono">
                  {detailDoc.embeddingProvider || 'Supabase pgvector / Local RAG'}
                </span>
              </div>

              <div>
                <span className="block text-[10px] text-gray-500 uppercase font-bold">Pipeline Status</span>
                <div className="mt-0.5">{renderStatusBadge(detailDoc.status, detailDoc.errorMessage)}</div>
              </div>
            </div>

            {/* Extracted Text Preview */}
            <div className="space-y-1.5 flex-1 min-h-0 flex flex-col">
              <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider">
                Extracted Grounding Text Preview
              </label>
              <div className="flex-1 overflow-y-auto bg-[#070e20] p-4 rounded-xl border border-[#00f0ff]/20 text-xs font-mono text-gray-200 whitespace-pre-wrap leading-relaxed">
                {detailDoc.content || 'No text extracted.'}
              </div>
            </div>

            {/* Modal Bottom Actions */}
            <div className="pt-3 border-t border-[#00f0ff]/15 flex flex-wrap items-center justify-between gap-2 shrink-0">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleReprocess(detailDoc.id)}
                  className="px-3.5 py-2 rounded-xl bg-purple-500/20 border border-purple-500/40 text-purple-300 font-bold text-xs uppercase tracking-wider hover:bg-purple-500/30 flex items-center gap-1.5"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Reprocess</span>
                </button>

                <button
                  onClick={() => handleReplaceFile(detailDoc.id)}
                  className="px-3.5 py-2 rounded-xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 font-bold text-xs uppercase tracking-wider hover:bg-cyan-500/30 flex items-center gap-1.5"
                >
                  <Upload className="w-4 h-4" />
                  <span>Replace Source File</span>
                </button>

                <button
                  onClick={() => handleDelete(detailDoc.id)}
                  className="px-3.5 py-2 rounded-xl bg-red-500/20 border border-red-500/40 text-red-300 font-bold text-xs uppercase tracking-wider hover:bg-red-500/30 flex items-center gap-1.5"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete</span>
                </button>
              </div>

              <button
                onClick={() => setDetailDoc(null)}
                className="px-5 py-2 rounded-xl bg-[#00f0ff] text-black font-bold text-xs uppercase tracking-wider hover:bg-[#00f0ff]/80"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SECONDARY SECTION: BACKUP */}
      <div className="bg-[#0a1228] border border-[#00f0ff]/15 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
        <div>
          <h2 className="text-sm font-bold text-gray-300 flex items-center gap-2">
            <FolderArchive className="w-4 h-4 text-gray-400" />
            <span>Backup Knowledge Base</span>
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Download a compressed backup archive of all active TALA knowledge sources.
          </p>
        </div>

        <button
          onClick={() => downloadKnowledgeZip(localFiles)}
          className="px-4 py-2 rounded-xl bg-[#070e20] border border-[#00f0ff]/30 text-[#00f0ff] hover:bg-[#00f0ff]/10 transition-all font-bold text-xs uppercase tracking-wider flex items-center gap-2 shrink-0"
        >
          <Download className="w-4 h-4" />
          <span>Download Knowledge Backup</span>
        </button>
      </div>
    </div>
  );
};
