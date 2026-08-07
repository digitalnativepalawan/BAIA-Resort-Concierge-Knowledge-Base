import React, { useState, useRef } from 'react';
import { FileText, Upload, Trash2, Eye, ShieldCheck, Database, FileCode, CheckCircle2, AlertCircle, X } from 'lucide-react';
import { KnowledgeFile } from '../types';

interface KnowledgeBaseWidgetProps {
  knowledgeFiles: KnowledgeFile[];
  onAddFiles: (newFiles: KnowledgeFile[]) => void;
  onRemoveFile: (fileId: string) => void;
  onClearAll: () => void;
}

export const KnowledgeBaseWidget: React.FC<KnowledgeBaseWidgetProps> = ({
  knowledgeFiles,
  onAddFiles,
  onRemoveFile,
  onClearAll
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedPreviewFile, setSelectedPreviewFile] = useState<KnowledgeFile | null>(null);
  const [uploadStatusMsg, setUploadStatusMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const processFiles = (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    if (fileArray.length === 0) return;

    const loadedKnowledgeFiles: KnowledgeFile[] = [];
    let pendingCount = fileArray.length;

    fileArray.forEach((file) => {
      // Accept text, markdown, csv, json, log, code files
      const reader = new FileReader();
      reader.onload = (e) => {
        const textContent = e.target?.result as string || '';
        if (textContent.trim()) {
          loadedKnowledgeFiles.push({
            id: Math.random().toString(36).substring(2, 9),
            name: file.name,
            size: file.size,
            type: file.type || 'text/plain',
            content: textContent,
            uploadedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          });
        }

        pendingCount--;
        if (pendingCount === 0) {
          if (loadedKnowledgeFiles.length > 0) {
            onAddFiles(loadedKnowledgeFiles);
            setUploadStatusMsg(`Successfully ingested ${loadedKnowledgeFiles.length} file(s) into TALA Knowledge Base.`);
            setTimeout(() => setUploadStatusMsg(null), 4000);
          } else {
            setUploadStatusMsg('Could not extract text from selected file(s). Please upload plain text or markdown files.');
            setTimeout(() => setUploadStatusMsg(null), 4000);
          }
        }
      };

      reader.onerror = () => {
        pendingCount--;
        console.error('Error reading file:', file.name);
      };

      reader.readAsText(file);
    });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const totalChars = knowledgeFiles.reduce((sum, f) => sum + f.content.length, 0);

  return (
    <div className="w-full bg-[#080d1a]/90 border border-[#00f0ff]/30 rounded-xl p-3 sm:p-4 shadow-[0_0_25px_rgba(0,0,0,0.6)] backdrop-blur-md flex flex-col gap-3 font-mono">
      {/* Widget Header */}
      <div className="flex items-center justify-between pb-2 border-b border-[#00f0ff]/20">
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4 text-[#00f0ff] animate-pulse" />
          <span className="text-xs font-bold text-[#00f0ff] tracking-wider uppercase">
            GROUNDING KNOWLEDGE BASE
          </span>
        </div>
        {knowledgeFiles.length > 0 ? (
          <span className="text-[10px] px-2 py-0.5 rounded bg-[#00f0ff]/20 text-[#00f0ff] border border-[#00f0ff]/40 flex items-center gap-1">
            <ShieldCheck className="w-3 h-3" />
            <span>GROUNDING ACTIVE ({knowledgeFiles.length})</span>
          </span>
        ) : (
          <span className="text-[10px] text-gray-500 uppercase">NO DOCUMENTS ATTACHED</span>
        )}
      </div>

      {/* Drag & Drop Upload Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative cursor-pointer rounded-xl border-2 border-dashed p-4 flex flex-col items-center justify-center text-center transition-all ${
          isDragging
            ? 'border-[#00f0ff] bg-[#00f0ff]/15 shadow-[0_0_20px_#00f0ff]'
            : 'border-[#00f0ff]/30 bg-[#050811]/80 hover:border-[#00f0ff]/60 hover:bg-[#00f0ff]/5'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".txt,.md,.csv,.json,.log,.js,.ts,.html,.css,text/*"
          onChange={handleFileChange}
          className="hidden"
        />

        <Upload className="w-6 h-6 text-[#00f0ff] mb-1.5 animate-bounce" />
        <p className="text-xs font-bold text-gray-200">
          Drop Document Knowledge Base Files Here
        </p>
        <p className="text-[10px] text-gray-400 mt-0.5">
          Supports .txt, .md, .csv, .json or plain text logs
        </p>
      </div>

      {/* Status Feedback Notification */}
      {uploadStatusMsg && (
        <div className="p-2 rounded bg-[#00f0ff]/10 border border-[#00f0ff]/40 text-[#00f0ff] text-[11px] flex items-center gap-1.5 animate-fadeIn">
          <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
          <span>{uploadStatusMsg}</span>
        </div>
      )}

      {/* Uploaded Documents List */}
      {knowledgeFiles.length > 0 && (
        <div className="space-y-2 mt-1">
          <div className="flex items-center justify-between text-[10px] text-gray-400 px-1">
            <span>GROUNDED DOCUMENTS ({knowledgeFiles.length}) • ~{totalChars.toLocaleString()} CHARS</span>
            <button
              onClick={onClearAll}
              className="text-red-400 hover:text-red-300 hover:underline flex items-center gap-1 transition-colors"
            >
              <Trash2 className="w-3 h-3" />
              <span>CLEAR ALL</span>
            </button>
          </div>

          <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1 scrollbar-thin scrollbar-thumb-[#00f0ff]/30">
            {knowledgeFiles.map((file) => (
              <div
                key={file.id}
                className="flex items-center justify-between bg-[#050811] border border-[#00f0ff]/20 rounded-lg p-2 hover:border-[#00f0ff]/50 transition-colors"
              >
                <div className="flex items-center gap-2 overflow-hidden mr-2">
                  <FileText className="w-4 h-4 text-[#00f0ff] shrink-0" />
                  <div className="flex flex-col overflow-hidden">
                    <span className="text-xs text-gray-200 font-bold truncate">{file.name}</span>
                    <span className="text-[10px] text-gray-400">
                      {formatFileSize(file.size)} • {file.content.length.toLocaleString()} chars • {file.uploadedAt}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => setSelectedPreviewFile(file)}
                    title="Preview Document Content"
                    className="p-1 rounded hover:bg-[#00f0ff]/20 text-[#00f0ff] transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onRemoveFile(file.id)}
                    title="Remove File from Grounding Base"
                    className="p-1 rounded hover:bg-red-500/20 text-red-400 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Document Content Preview Modal */}
      {selectedPreviewFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-2xl bg-[#080d1a] border border-[#00f0ff]/40 rounded-2xl p-4 sm:p-6 shadow-[0_0_50px_rgba(0,240,255,0.3)] flex flex-col gap-4 max-h-[85vh]">
            <div className="flex items-center justify-between pb-3 border-b border-[#00f0ff]/20">
              <div className="flex items-center gap-2 text-[#00f0ff]">
                <FileCode className="w-5 h-5" />
                <h3 className="text-sm font-bold tracking-wider uppercase text-white truncate max-w-md">
                  {selectedPreviewFile.name}
                </h3>
              </div>
              <button
                onClick={() => setSelectedPreviewFile(null)}
                className="p-1.5 rounded-lg bg-[#050811] border border-[#00f0ff]/30 text-gray-400 hover:text-white hover:border-[#00f0ff]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto bg-[#030611] p-3 border border-[#00f0ff]/20 rounded-xl font-mono text-xs text-gray-300 leading-relaxed whitespace-pre-wrap select-text scrollbar-thin scrollbar-thumb-[#00f0ff]/30">
              {selectedPreviewFile.content}
            </div>

            <div className="flex items-center justify-between text-[11px] text-gray-400 pt-2 border-t border-[#00f0ff]/20">
              <span>Size: {formatFileSize(selectedPreviewFile.size)} • Total Chars: {selectedPreviewFile.content.length.toLocaleString()}</span>
              <button
                onClick={() => setSelectedPreviewFile(null)}
                className="px-4 py-1.5 bg-[#00f0ff]/10 border border-[#00f0ff]/40 hover:bg-[#00f0ff]/20 text-[#00f0ff] font-bold rounded-lg transition-colors"
              >
                CLOSE PREVIEW
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
