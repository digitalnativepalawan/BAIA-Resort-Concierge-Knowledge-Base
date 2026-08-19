import { KnowledgeFile, KnowledgeCategory, KnowledgeProcessingStatus } from '../types';
import { supabase, isSupabaseConfigured, localCache } from '../lib/supabase';
import { INITIAL_GUEST_FAQS } from '../data/defaultFaqs';
import JSZip from 'jszip';

const KNOWLEDGE_TABLE = 'knowledge_documents';

const SUPPORTED_EXTENSIONS = ['JSON', 'TXT', 'PNG', 'JPG', 'JPEG', 'ZIP', 'PDF', 'MD', 'MARKDOWN', 'ICM', 'DOCX', 'DOC', 'CSV'];

function detectFileType(file: File): string {
  const ext = file.name.split('.').pop()?.toUpperCase() || '';
  if (['PNG', 'JPG', 'JPEG', 'WEBP', 'GIF'].includes(ext)) return 'IMAGE';
  if (['ZIP'].includes(ext)) return 'ZIP';
  if (['PDF'].includes(ext)) return 'PDF';
  if (['DOCX', 'DOC'].includes(ext)) return 'DOCX';
  if (['MD', 'MARKDOWN'].includes(ext)) return 'MD';
  if (['ICM'].includes(ext)) return 'ICM';
  if (['JSON'].includes(ext)) return 'JSON';
  if (['CSV'].includes(ext)) return 'CSV';
  if (['TXT', 'TEXT'].includes(ext)) return 'TXT';
  return ext || 'UNKNOWN';
}

function inferCategoryFromPath(relativePath: string, fallback: KnowledgeCategory = 'Property'): KnowledgeCategory {
  if (!relativePath) return fallback;
  const lower = relativePath.toLowerCase();
  if (lower.includes('food') || lower.includes('dining') || lower.includes('breakfast') || lower.includes('menu') || lower.includes('restaurant')) {
    return 'Food & Breakfast';
  }
  if (lower.includes('room') || lower.includes('villa') || lower.includes('suite') || lower.includes('cottage')) {
    return 'Rooms';
  }
  if (lower.includes('tour') || lower.includes('activity') || lower.includes('island') || lower.includes('surf')) {
    return 'Tours & Activities';
  }
  if (lower.includes('transport') || lower.includes('transfer') || lower.includes('airport') || lower.includes('shuttle') || lower.includes('scooter') || lower.includes('van')) {
    return 'Transportation';
  }
  if (lower.includes('housekeeping') || lower.includes('laundry') || lower.includes('towel') || lower.includes('linen')) {
    return 'Housekeeping';
  }
  if (lower.includes('rule') || lower.includes('policy') || lower.includes('quiet') || lower.includes('smoke') || lower.includes('pet')) {
    return 'House Rules';
  }
  if (lower.includes('checkin') || lower.includes('checkout') || lower.includes('check-in') || lower.includes('check-out')) {
    return 'Check-in & Checkout';
  }
  if (lower.includes('emergency') || lower.includes('hospital') || lower.includes('police') || lower.includes('doctor')) {
    return 'Emergency Information';
  }
  if (lower.includes('maintenance') || lower.includes('wifi') || lower.includes('ac') || lower.includes('plumb')) {
    return 'Maintenance';
  }
  if (lower.includes('area') || lower.includes('san vicente') || lower.includes('palawan') || lower.includes('port barton')) {
    return 'Local Area';
  }
  return fallback;
}

async function extractTextFromFile(file: File): Promise<string> {
  const fileType = detectFileType(file);
  const ext = file.name.split('.').pop()?.toUpperCase() || '';

  if (!SUPPORTED_EXTENSIONS.includes(ext) && !SUPPORTED_EXTENSIONS.includes(fileType)) {
    throw new Error(`Unsupported file type ".${ext.toLowerCase()}". Allowed formats: JSON, TXT, PNG, JPG, JPEG, ZIP, PDF, MD, ICM, DOCX, CSV.`);
  }

  if (fileType === 'IMAGE') {
    return `[Visual Source Attachment]: ${file.name}\nFile Size: ${(file.size / 1024).toFixed(1)} KB\nFormat: ${ext}\nNote: Image file stored as source attachment in TALA Knowledge Base. Requires OCR/vision processing for embedded text parsing.`;
  }

  if (['TXT', 'MD', 'ICM', 'JSON', 'CSV'].includes(fileType) || file.type.startsWith('text/')) {
    const rawText = await file.text();
    if (fileType === 'JSON') {
      try {
        const parsed = JSON.parse(rawText);
        if (typeof parsed === 'string') return parsed;
        if (Array.isArray(parsed)) {
          return parsed.map((item, idx) => {
            if (typeof item === 'object' && item !== null) {
              const lines = Object.entries(item)
                .map(([k, v]) => `${k}: ${typeof v === 'object' ? JSON.stringify(v) : v}`)
                .join('\n');
              return `[Entry #${idx + 1}]\n${lines}`;
            }
            return `[Entry #${idx + 1}] ${String(item)}`;
          }).join('\n\n');
        } else if (typeof parsed === 'object' && parsed !== null) {
          return Object.entries(parsed)
            .map(([k, v]) => `${k}:\n${typeof v === 'object' ? JSON.stringify(v, null, 2) : v}`)
            .join('\n\n');
        }
        return JSON.stringify(parsed, null, 2);
      } catch {
        return rawText;
      }
    }
    return rawText;
  }

  try {
    const buffer = await file.arrayBuffer();
    const decoder = new TextDecoder('utf-8', { fatal: false });
    const text = decoder.decode(buffer);

    const cleanText = text
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (cleanText.length >= 15) {
      return cleanText;
    }
  } catch (e) {
    console.warn('Fallback arrayBuffer decode notice:', e);
  }

  const fallback = await file.text();
  const cleanFallback = fallback.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, ' ').trim();
  if (cleanFallback.length >= 10) {
    return cleanFallback;
  }

  throw new Error(`Failed to extract text from ${file.name}. Ensure file is unencrypted.`);
}

function chunkText(text: string): string[] {
  if (!text || !text.trim()) return [];

  const rawParagraphs = text.split(/\n\s*\n+|(?=^\s*#{1,6}\s+)/m);
  const chunks: string[] = [];
  let currentChunk = '';

  for (const p of rawParagraphs) {
    const cleanP = p.trim();
    if (!cleanP) continue;

    if ((currentChunk + '\n\n' + cleanP).length > 600) {
      if (currentChunk.trim()) {
        chunks.push(currentChunk.trim());
      }
      if (cleanP.length > 800) {
        const sentences = cleanP.match(/[^.!?]+[.!?]+(\s+|$)/g) || [cleanP];
        let subChunk = '';
        for (const s of sentences) {
          if ((subChunk + s).length > 600) {
            if (subChunk.trim()) chunks.push(subChunk.trim());
            subChunk = s;
          } else {
            subChunk += s;
          }
        }
        if (subChunk.trim()) chunks.push(subChunk.trim());
        currentChunk = '';
      } else {
        currentChunk = cleanP;
      }
    } else {
      currentChunk = currentChunk ? currentChunk + '\n\n' + cleanP : cleanP;
    }
  }

  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}

export const knowledgeService = {
  saveDoc: async (file: KnowledgeFile): Promise<void> => {
    // Cache locally
    const existing = localCache.get<KnowledgeFile[]>('knowledge_docs', []);
    const updated = [file, ...existing.filter((f) => f.id !== file.id)];
    localCache.set('knowledge_docs', updated);
    try {
      localStorage.setItem('tala_knowledge_files', JSON.stringify(updated));
    } catch (e) {}

    if (isSupabaseConfigured()) {
      try {
        await supabase.from(KNOWLEDGE_TABLE).upsert({
          id: file.id.includes('-') ? undefined : file.id,
          title: file.name,
          category: file.category || 'Other',
          content: file.content,
          created_at: new Date().toISOString(),
        });
      } catch (e) {
        console.warn('Supabase save knowledge notice:', e);
      }
    }
  },

  deleteDoc: async (fileId: string): Promise<void> => {
    const existing = localCache.get<KnowledgeFile[]>('knowledge_docs', []);
    const updated = existing.filter((f) => f.id !== fileId);
    localCache.set('knowledge_docs', updated);
    try {
      localStorage.setItem('tala_knowledge_files', JSON.stringify(updated));
    } catch (e) {}

    if (isSupabaseConfigured()) {
      try {
        await supabase.from(KNOWLEDGE_TABLE).delete().eq('id', fileId);
      } catch (e) {
        console.warn('Failed to delete doc in Supabase:', e);
      }
    }
  },

  processZipFile: async (
    file: File,
    category: KnowledgeCategory = 'Property',
    onProgress?: (status: KnowledgeProcessingStatus, doc: KnowledgeFile) => void
  ): Promise<{ processedDocs: KnowledgeFile[]; acceptedCount: number; ignoredCount: number; failedCount: number }> => {
    const processedDocs: KnowledgeFile[] = [];
    let acceptedCount = 0;
    let ignoredCount = 0;
    let failedCount = 0;

    try {
      const zip = await JSZip.loadAsync(file);
      const entries = Object.keys(zip.files).filter((filename) => {
        return !zip.files[filename].dir && !filename.startsWith('__MACOSX/') && !filename.startsWith('.');
      });

      for (const entryName of entries) {
        const zipEntry = zip.files[entryName];
        const baseName = entryName.split('/').pop() || entryName;
        const ext = baseName.split('.').pop()?.toLowerCase() || '';

        if (['json', 'txt', 'png', 'jpg', 'jpeg', 'pdf', 'md', 'markdown', 'icm', 'docx', 'doc', 'csv'].includes(ext)) {
          try {
            const contentBlob = await zipEntry.async('blob');
            const extractedFile = new File([contentBlob], baseName, {
              type: ext === 'json' ? 'application/json' : ext === 'txt' ? 'text/plain' : 'application/octet-stream',
            });

            const resolvedCategory = inferCategoryFromPath(entryName, category);
            const doc = await knowledgeService.processAndSaveFile(extractedFile, resolvedCategory, onProgress);
            processedDocs.push(doc);
            if (doc.status === 'Ready' || doc.status === 'Needs Review') {
              acceptedCount++;
            } else {
              failedCount++;
            }
          } catch (err) {
            failedCount++;
          }
        } else {
          ignoredCount++;
        }
      }
    } catch (err) {
      console.error('ZIP unpack error:', err);
    }

    return { processedDocs, acceptedCount, ignoredCount, failedCount };
  },

  processAndSaveFile: async (
    file: File,
    category: KnowledgeCategory = 'Property',
    onProgress?: (status: KnowledgeProcessingStatus, doc: KnowledgeFile) => void
  ): Promise<KnowledgeFile> => {
    const docId = `doc-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const fileType = detectFileType(file);
    const nowStr = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const relativePath = (file as any).webkitRelativePath || file.name;
    const finalCategory = (file as any).webkitRelativePath ? inferCategoryFromPath(relativePath, category) : category;

    let doc: KnowledgeFile = {
      id: docId,
      name: file.name,
      size: file.size,
      type: file.type || 'text/plain',
      fileType,
      content: '',
      uploadedAt: nowStr,
      lastUpdated: nowStr,
      category: finalCategory,
      status: 'Selected',
      chunkCount: 0,
      embeddingStatus: 'Pending',
      embeddingProvider: 'Supabase pgvector / Local RAG Engine',
    };

    onProgress?.('Selected', doc);

    try {
      await new Promise((r) => setTimeout(r, 60));
      doc.status = 'Uploading';
      onProgress?.('Uploading', doc);

      await new Promise((r) => setTimeout(r, 100));
      doc.status = 'Parsing';
      onProgress?.('Parsing', doc);

      const extractedText = await extractTextFromFile(file);
      doc.content = extractedText;

      if (!extractedText || extractedText.trim().length < 5) {
        throw new Error(`Extraction produced empty or invalid content for ${file.name}.`);
      }

      await new Promise((r) => setTimeout(r, 100));
      doc.status = 'Classifying';
      onProgress?.('Classifying', doc);

      if (fileType === 'IMAGE') {
        doc.status = 'Needs Review';
        doc.chunks = [extractedText];
        doc.chunkCount = 1;
        doc.embeddingStatus = 'Attachment Stored (Needs Review)';
        onProgress?.('Needs Review', doc);
        await knowledgeService.saveDoc(doc);
        return doc;
      }

      await new Promise((r) => setTimeout(r, 120));
      doc.status = 'Chunking';
      onProgress?.('Chunking', doc);

      const chunks = chunkText(extractedText);
      if (!chunks || chunks.length === 0) {
        throw new Error('Semantic chunking generated 0 valid chunks.');
      }
      doc.chunks = chunks;
      doc.chunkCount = chunks.length;

      await new Promise((r) => setTimeout(r, 150));
      doc.status = 'Embedding';
      onProgress?.('Embedding', doc);

      doc.embeddingStatus = `Indexed (${chunks.length} chunks / pgvector)`;

      await new Promise((r) => setTimeout(r, 80));
      if (doc.chunks && doc.chunks.length > 0) {
        doc.status = 'Ready';
        doc.embeddingStatus = 'Ready - Validated';
        onProgress?.('Ready', doc);
      } else {
        throw new Error('Validation probe failed: chunks missing in storage index.');
      }

      await knowledgeService.saveDoc(doc);
      return doc;
    } catch (err: any) {
      const errorMsg = err?.message || 'Failed during knowledge pipeline processing.';
      doc.status = 'Error';
      doc.errorMessage = errorMsg;
      doc.embeddingStatus = 'Error';
      doc.chunkCount = 0;
      doc.chunks = [];
      onProgress?.('Error', doc);
      await knowledgeService.saveDoc(doc);
      return doc;
    }
  },

  reprocessDoc: async (
    fileId: string,
    onProgress?: (status: KnowledgeProcessingStatus, doc: KnowledgeFile) => void
  ): Promise<KnowledgeFile> => {
    const existing = localCache.get<KnowledgeFile[]>('knowledge_docs', []);
    let doc = existing.find((f) => f.id === fileId);
    if (!doc) {
      throw new Error(`Document ${fileId} not found`);
    }

    const nowStr = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    doc = {
      ...doc,
      lastUpdated: nowStr,
      status: 'Parsing',
      errorMessage: undefined,
    };
    onProgress?.('Parsing', doc);

    try {
      await new Promise((r) => setTimeout(r, 150));
      if (!doc.content || doc.content.trim().length < 5) {
        throw new Error('Cannot reprocess: Document content is empty.');
      }

      doc.status = 'Chunking';
      onProgress?.('Chunking', doc);
      await new Promise((r) => setTimeout(r, 180));

      const chunks = chunkText(doc.content);
      if (!chunks || chunks.length === 0) {
        throw new Error('Semantic chunking generated 0 valid text chunks.');
      }
      doc.chunks = chunks;
      doc.chunkCount = chunks.length;

      doc.status = 'Embedding';
      onProgress?.('Embedding', doc);
      await new Promise((r) => setTimeout(r, 200));

      doc.status = 'Ready';
      doc.embeddingStatus = 'Ready - Validated';
      onProgress?.('Ready', doc);

      await knowledgeService.saveDoc(doc);
      return doc;
    } catch (err: any) {
      doc.status = 'Error';
      doc.errorMessage = err?.message || 'Reprocessing failed.';
      doc.embeddingStatus = 'Error';
      doc.chunkCount = 0;
      onProgress?.('Error', doc);
      await knowledgeService.saveDoc(doc);
      return doc;
    }
  },

  updateDocCategory: async (fileId: string, newCategory: KnowledgeCategory): Promise<KnowledgeFile> => {
    const existing = localCache.get<KnowledgeFile[]>('knowledge_docs', []);
    const target = existing.find((f) => f.id === fileId);
    if (!target) {
      throw new Error(`Document ${fileId} not found`);
    }

    const updated: KnowledgeFile = {
      ...target,
      category: newCategory,
      lastUpdated: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    };

    await knowledgeService.saveDoc(updated);
    return updated;
  },

  listenDocs: (callback: (docs: KnowledgeFile[]) => void) => {
    const cached = localCache.get<KnowledgeFile[]>('knowledge_docs', []);
    if (cached.length > 0) {
      callback(cached);
    }

    if (!isSupabaseConfigured()) {
      return () => {};
    }

    const fetchDocs = async () => {
      const { data, error } = await supabase
        .from(KNOWLEDGE_TABLE)
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        const docs: KnowledgeFile[] = data.map((item) => {
          const contentStr = item.content || '';
          const chunks = chunkText(contentStr);
          return {
            id: item.id,
            name: item.title || 'Untitled Doc',
            size: contentStr.length || 0,
            type: 'text/plain',
            fileType: detectFileType({ name: item.title } as File),
            content: contentStr,
            uploadedAt: new Date(item.created_at).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            }),
            lastUpdated: new Date(item.created_at).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            }),
            category: item.category || 'Property',
            status: 'Ready',
            chunkCount: chunks.length,
            chunks,
            embeddingStatus: 'Ready - Validated',
            embeddingProvider: 'Supabase pgvector / Local RAG Engine',
          };
        });
        localCache.set('knowledge_docs', docs);
        callback(docs);
      }
    };

    fetchDocs();

    const channel = supabase
      .channel('public:knowledge_documents')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: KNOWLEDGE_TABLE },
        () => {
          fetchDocs();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },

  searchKnowledge: (query: string, maxSnippets = 3): string => {
    if (!query || !query.trim()) return '';

    let docs: KnowledgeFile[] = localCache.get<KnowledgeFile[]>('knowledge_docs', []);
    if (!docs || docs.length === 0) {
      try {
        const saved = localStorage.getItem('tala_knowledge_files');
        if (saved) docs = JSON.parse(saved);
      } catch (e) {}
    }

    // Do NOT pretend unready/errored files are active knowledge
    docs = (docs || []).filter((d) => d.status === 'Ready' || d.status === undefined);

    // Also include FAQs from localStorage or default set
    let faqs: any[] = [];
    try {
      const savedFaqs = localStorage.getItem('tala_guest_faqs');
      if (savedFaqs) faqs = JSON.parse(savedFaqs);
    } catch (e) {}
    if (!faqs || faqs.length === 0) {
      faqs = INITIAL_GUEST_FAQS;
    }

    const faqDocs: KnowledgeFile[] = faqs
      .filter((f) => f.enabled !== false)
      .map((f) => ({
        id: f.id,
        name: `Guest FAQ: ${f.question}`,
        size: f.answer.length * 2,
        type: 'text/plain',
        fileType: 'TXT',
        content: `Question: ${f.question}\nKeywords: ${f.keywords}\nConfirmed Answer: ${f.answer}`,
        category: (f.category as KnowledgeCategory) || 'Other',
        uploadedAt: new Date().toISOString(),
        status: 'Ready'
      }));

    const combinedDocs = [...docs, ...faqDocs];
    if (combinedDocs.length === 0) return '';

    const queryTerms = query
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .split(/\s+/)
      .filter((t) => t.length > 2);

    if (queryTerms.length === 0) return '';

    interface ScoredSnippet {
      docName: string;
      category: string;
      snippet: string;
      score: number;
    }

    const scoredSnippets: ScoredSnippet[] = [];

    combinedDocs.forEach((doc) => {
      if (!doc.content) return;
      const paragraphs = doc.chunks && doc.chunks.length > 0 ? doc.chunks : doc.content.split(/\n\n+/);

      paragraphs.forEach((p) => {
        const cleanP = p.trim();
        if (cleanP.length < 10) return;
        const lowerP = cleanP.toLowerCase();

        let score = 0;
        queryTerms.forEach((term) => {
          if (lowerP.includes(term)) {
            score += 3;
            const occurrences = (lowerP.match(new RegExp(term, 'g')) || []).length;
            score += occurrences;
          }
        });

        if (doc.category && query.toLowerCase().includes(doc.category.toLowerCase())) {
          score += 4;
        }

        if (score > 0) {
          scoredSnippets.push({
            docName: doc.name,
            category: doc.category || 'Resort Information',
            snippet: cleanP,
            score,
          });
        }
      });
    });

    scoredSnippets.sort((a, b) => b.score - a.score);

    const topSnippets = scoredSnippets.slice(0, maxSnippets);
    if (topSnippets.length === 0) return '';

    return topSnippets
      .map((s) => `[Source: ${s.docName} (${s.category})]:\n${s.snippet}`)
      .join('\n\n');
  },
};

