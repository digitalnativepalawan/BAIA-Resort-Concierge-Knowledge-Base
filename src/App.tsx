import React, { useState, useEffect, useRef, useCallback } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import {
  TalaState,
  TelemetryLogEntry,
  ChatMessage,
  VoiceOption,
  TalaSettings,
  KnowledgeFile,
  KnowledgeCategory,
  GuestRequest,
  GuestRequestStatus,
  AdminUser
} from './types';

import { authService } from './services/authService';
import { conversationService } from './services/conversationService';
import { knowledgeService } from './services/knowledgeService';
import { settingsService } from './services/settingsService';
import { requestService } from './services/requestService';
import { isSupabaseConfigured } from './lib/supabase';
import { openrouter } from './lib/openrouter';
import {
  isFemaleVoiceName,
  isNaturalVoiceName,
  getBestFemaleVoice,
  speechEngine
} from './lib/speechEngine';

import { GuestConcierge } from './pages/GuestConcierge';
import { AdminLayout } from './components/admin/AdminLayout';
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { AdminConversationsPage } from './pages/admin/AdminConversationsPage';
import { AdminKnowledgePage } from './pages/admin/AdminKnowledgePage';
import { AdminRequestsPage } from './pages/admin/AdminRequestsPage';
import { AdminSettingsPage } from './pages/admin/AdminSettingsPage';

import { soundEffects } from './utils/soundEffects';
import { cleanTextForSpeech } from './utils/textUtils';

const DEFAULT_SYSTEM_INSTRUCTION =
  "You are TALA, the warm, helpful AI concierge for BAIA Resort in San Vicente, Palawan. Engage with guests in a friendly, conversational, and hospitable manner. Answer guest queries concisely (2 to 4 sentences) and accurately using the BAIA knowledge base (such as vegan & dining options, transportation from El Nido/Puerto Princesa, motorbike rentals, island hopping tours, check-in, and resort amenities). Never repeat robotic disclaimers or canned phrases; speak naturally like an attentive front-desk host.";

export default function App() {
  const [state, setState] = useState<TalaState>('IDLE');
  const [speechVolume, setSpeechVolume] = useState<number>(0.5);
  const [interimTranscript, setInterimTranscript] = useState<string>('');
  const [logs, setLogs] = useState<TelemetryLogEntry[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [voices, setVoices] = useState<VoiceOption[]>([]);
  const [hasServerOpenRouterKey, setHasServerOpenRouterKey] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<AdminUser | null>(null);

  // Knowledge Files State
  const [knowledgeFiles, setKnowledgeFiles] = useState<KnowledgeFile[]>(() => {
    try {
      const saved = localStorage.getItem('tala_knowledge_files');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  // Guest Requests State
  const [guestRequests, setGuestRequests] = useState<GuestRequest[]>(() => {
    return requestService.getLocalRequests();
  });

  // Settings State
  const [settings, setSettings] = useState<TalaSettings>(() => {
    let openrouterKey = '';
    let selectedOpenRouterModel = 'openrouter/free';

    const fallbackOpenRouterKey =
      localStorage.getItem('openrouter_api_key') ||
      localStorage.getItem('tala_openrouter_api_key') ||
      localStorage.getItem('OPENROUTER_API_KEY') ||
      (typeof window !== 'undefined' && (window as any).OPENROUTER_API_KEY ? (window as any).OPENROUTER_API_KEY : '');

    const saved = localStorage.getItem('tala_settings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed) {
          if (parsed.openrouterApiKey) openrouterKey = parsed.openrouterApiKey.trim();
          if (parsed.selectedOpenRouterModel) selectedOpenRouterModel = parsed.selectedOpenRouterModel;
        }
      } catch (e) {}
    }

    if (!openrouterKey && fallbackOpenRouterKey) {
      openrouterKey = String(fallbackOpenRouterKey).trim();
    }

    return {
      pitch: 1.0,
      rate: 1.0,
      selectedVoiceName: '',
      openrouterApiKey: openrouterKey,
      selectedOpenRouterModel: selectedOpenRouterModel,
      customApiKey: openrouterKey,
      systemInstruction: DEFAULT_SYSTEM_INSTRUCTION,
      autoSpeak: true,
      soundEnabled: true,
      continuousListening: true,
      useHybridNeural: true,
    };
  });

  // Speech Recognition & Synthesis references
  const recognitionRef = useRef<any>(null);
  const currentUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const startListeningRef = useRef<(() => void) | null>(null);
  const silenceCountRef = useRef<number>(0);

  // Persist knowledge files
  useEffect(() => {
    try {
      localStorage.setItem('tala_knowledge_files', JSON.stringify(knowledgeFiles));
    } catch (e) {
      console.warn('Failed to save knowledge files:', e);
    }
  }, [knowledgeFiles]);

  // Persist settings
  useEffect(() => {
    localStorage.setItem('tala_settings', JSON.stringify(settings));
    if (settings.openrouterApiKey) {
      localStorage.setItem('openrouter_api_key', settings.openrouterApiKey.trim());
      localStorage.setItem('tala_openrouter_api_key', settings.openrouterApiKey.trim());
    }
    soundEffects.setEnabled(settings.soundEnabled);
  }, [settings]);

  // Helper to add telemetry log
  const addLog = useCallback((message: string, type: TelemetryLogEntry['type'] = 'info') => {
    const timeStr = new Date().toLocaleTimeString('en-US', { hour12: false });
    const newEntry: TelemetryLogEntry = {
      id: Math.random().toString(36).substring(2, 9),
      timestamp: timeStr,
      message,
      type
    };
    setLogs((prev) => [...prev.slice(-40), newEntry]);
  }, []);

  // Supabase Auth Initializer
  useEffect(() => {
    const unsubscribe = authService.subscribeToAuth(async (user) => {
      setCurrentUser(user);
      if (user) {
        addLog(`[ SUPABASE ]: Authenticated as ${user.name || user.email}`, 'success');
        const remoteSettings = await settingsService.getSettings();
        if (remoteSettings) {
          setSettings((prev) => ({ ...prev, ...remoteSettings }));
        }
      } else {
        addLog('[ SUPABASE ]: Supabase client active', 'info');
      }
    });

    return () => unsubscribe();
  }, [addLog]);

  // Real-Time Sync for Chat, Knowledge Docs, and Guest Requests
  useEffect(() => {
    const unsubChat = conversationService.listenChatMessages((remoteMsgs) => {
      if (remoteMsgs && remoteMsgs.length > 0) {
        setMessages(remoteMsgs);
      }
    });

    const unsubDocs = knowledgeService.listenDocs((remoteDocs) => {
      if (remoteDocs && remoteDocs.length > 0) {
        setKnowledgeFiles(remoteDocs);
      }
    });

    const unsubRequests = requestService.listenRequests((remoteRequests) => {
      if (remoteRequests && remoteRequests.length > 0) {
        setGuestRequests(remoteRequests);
      }
    });

    return () => {
      unsubChat();
      unsubDocs();
      unsubRequests();
    };
  }, []);

  // Sync settings to Supabase
  useEffect(() => {
    if (currentUser) {
      settingsService.saveSettings(settings);
    }
  }, [currentUser, settings]);

  const handleSignIn = useCallback(async () => {
    try {
      soundEffects.playProcessingBeep();
      const email = window.prompt('Enter Supabase Admin/Staff Email:', 'admin@baiaresort.com');
      if (!email) return;
      const pass = window.prompt('Enter Supabase Password:');
      if (!pass) return;

      const user = await authService.login(email, pass);
      setCurrentUser(user);
      addLog(`[ SUPABASE ]: Logged in as ${user.email}`, 'success');
      soundEffects.playResponseChime();
    } catch (err: any) {
      addLog(`Supabase Auth error: ${err.message || err}`, 'error');
      soundEffects.playErrorSound();
    }
  }, [addLog]);

  const handleSignOut = useCallback(async () => {
    try {
      await authService.logoutUser();
      setCurrentUser(null);
      addLog('[ SUPABASE ]: Logged out.', 'info');
      soundEffects.playProcessingBeep();
    } catch (err: any) {
      addLog(`Logout error: ${err.message || err}`, 'error');
    }
  }, [addLog]);

  // Check Supabase & Engine Connectivity
  useEffect(() => {
    const configured = isSupabaseConfigured();
    setHasServerOpenRouterKey(configured);
    if (configured) {
      addLog('TALA Engine Active via Supabase Edge Functions (tala-chat).', 'system');
    } else {
      addLog('Supabase Edge Functions pending. Set VITE_SUPABASE_URL in Lovable settings.', 'warning');
    }
  }, [addLog]);

  // Web & Cloud Speech Voices Initializer
  useEffect(() => {
    const populateVoices = () => {
      const available = speechEngine.getAvailableVoices();
      setVoices(available);

      setSettings((prev) => {
        // Never reset an existing user-selected voice
        if (prev.selectedVoiceName) {
          return prev;
        }
        const defaultVoice = available[0]?.name || 'TALA - Natural Neural Female (US)';
        return { ...prev, selectedVoiceName: defaultVoice, pitch: 1.0, rate: 1.0 };
      });
    };

    populateVoices();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = populateVoices;
    }
  }, []);

  // Initial Boot Chime
  useEffect(() => {
    addLog('[ TALA ONLINE ] BAIA Resort AI Concierge Initialized', 'system');
    soundEffects.playStartup();
  }, [addLog]);

  // Speech Synthesis
  const speakText = useCallback(
    (text: string) => {
      const cleanedText = cleanTextForSpeech(text);
      if (!cleanedText) return;

      setState('SPEAKING');
      setSpeechVolume(0.8);
      addLog('[ VOCALIZING ]: TALA speech output active', 'speaking');

      const selectedVoice = settings.selectedVoiceName || 'TALA - Natural Neural Female (US)';
      const pitch = settings.pitch || 1.0;
      const rate = settings.rate || 1.0;

      speechEngine.speakText(
        cleanedText,
        selectedVoice,
        pitch,
        rate,
        () => {
          setState('IDLE');
          setSpeechVolume(0.2);

          // Resume hands-free voice loop if enabled
          if (settings.continuousListening) {
            setTimeout(() => {
              if (startListeningRef.current) {
                startListeningRef.current();
              }
            }, 600);
          }
        }
      );
    },
    [settings.selectedVoiceName, settings.pitch, settings.rate, settings.continuousListening, addLog]
  );

  const stopSpeech = useCallback(() => {
    speechEngine.stopSpeech();
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
      recognitionRef.current = null;
    }
    setState('IDLE');
    setSpeechVolume(0.2);
  }, []);

  const handleTestVoiceDiagnostic = useCallback(() => {
    stopSpeech();
    addLog('[ VOICE TEST ]: Testing vocal output...', 'system');
    soundEffects.playResponseChime();
    speakText('Welcome to BAIA Resort. I am TALA, your AI concierge.');
  }, [addLog, speakText, stopSpeech]);

  // Send Prompt to TALA API Endpoint
  const sendPromptToTala = useCallback(
    async (promptText: string) => {
      if (!promptText.trim()) return;

      stopSpeech();

      const userMsg: ChatMessage = {
        id: Math.random().toString(36).substring(2, 9),
        role: 'user',
        text: promptText,
        timestamp: new Date().toLocaleTimeString('en-US', { hour12: false })
      };

      setMessages((prev) => [...prev, userMsg]);
      conversationService.saveChatMessage(userMsg);
      addLog(`[GUEST INPUT]: "${promptText}"`, 'info');

      setState('PROCESSING');
      soundEffects.playProcessingBeep();

      try {
        const historyForApi = messages.slice(-10).map((m) => ({
          role: m.role,
          text: m.text
        }));

        const effectiveOpenRouterKey = settings.openrouterApiKey?.trim() || '';

        // Construct grounded system instruction
        let groundedSystemInstruction = settings.systemInstruction || DEFAULT_SYSTEM_INSTRUCTION;
        if (knowledgeFiles.length > 0) {
          const docsText = knowledgeFiles
            .map((f, idx) => `--- GROUNDED DOCUMENT ${idx + 1} (${f.category || 'General'}): ${f.name} ---\n${f.content}`)
            .join('\n\n');

          groundedSystemInstruction += `\n\n=== BAIA GROUNDING KNOWLEDGE BASE ===\nThe administrator has supplied the following reference documents:\n\n${docsText}\n\n=== CONCIERGE DIRECTIVES ===\n1. Answer guest queries by prioritizing context from the BAIA GROUNDING KNOWLEDGE BASE provided above.\n2. When asked about property information, San Vicente, transportation, amenities, food, or activities contained in these documents, give accurate, direct, warm, structured answers based on document text.\n3. Never invent property details not present in the knowledge base. When appropriate, state that resort staff can assist.`;
        }

        const selectedModel = settings.selectedOpenRouterModel || 'openrouter/free';

        const data = await openrouter.sendChatPrompt({
          openrouterApiKey: effectiveOpenRouterKey || undefined,
          model: selectedModel,
          prompt: promptText,
          history: historyForApi,
          systemInstruction: groundedSystemInstruction
        });

        const replyText = data.responseText || 'TALA received an empty response.';

        const talaMsg: ChatMessage = {
          id: Math.random().toString(36).substring(2, 9),
          role: 'model',
          text: replyText,
          timestamp: new Date().toLocaleTimeString('en-US', { hour12: false })
        };

        setMessages((prev) => [...prev, talaMsg]);
        conversationService.saveChatMessage(talaMsg);
        addLog(`[ TALA RESPONSE DELIVERED ]`, 'success');
        soundEffects.playResponseChime();

        if (settings.autoSpeak) {
          speakText(replyText);
        } else {
          setState('IDLE');
        }
      } catch (err: any) {
        console.error('TALA Error:', err);
        setState('ERROR');
        soundEffects.playErrorSound();
        const errorText = err.message || 'Error communicating with OpenRouter engine.';
        addLog(`[ ERROR ]: ${errorText}`, 'error');

        setMessages((prev) => [
          ...prev,
          {
            id: Math.random().toString(36).substring(2, 9),
            role: 'model',
            text: `⚠️ [TALA CONCIERGE NOTICE]: ${errorText}`,
            timestamp: new Date().toLocaleTimeString('en-US', { hour12: false })
          }
        ]);
      }
    },
    [messages, settings, addLog, speakText, stopSpeech, knowledgeFiles, currentUser]
  );

  // Web Speech Recognition
  const startListening = useCallback(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert('Speech Recognition is not supported in this browser.');
      return;
    }

    if (state === 'LISTENING') {
      if (recognitionRef.current) recognitionRef.current.stop();
      setState('IDLE');
      soundEffects.playListeningEnd();
      return;
    }

    stopSpeech();

    try {
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setState('LISTENING');
        setInterimTranscript('');
        soundEffects.playListeningStart();
        addLog('[ LISTENING ]: Listening for guest speech...', 'listening');
      };

      recognition.onresult = (event: any) => {
        let currentInterim = '';
        let finalScript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalScript += event.results[i][0].transcript;
          } else {
            currentInterim += event.results[i][0].transcript;
          }
        }

        if (currentInterim) setInterimTranscript(currentInterim);

        if (finalScript) {
          silenceCountRef.current = 0;
          setInterimTranscript('');
          addLog(`[ SPEECH DETECTED ]: "${finalScript}"`, 'success');
          try {
            recognition.stop();
          } catch (e) {}
          recognitionRef.current = null;

          // Wake phrase check
          const lower = finalScript.trim().toLowerCase();
          if (lower === 'wake up tala' || lower === 'wake up' || lower === 'hey tala' || lower === 'tala') {
            speakText("Hello! I'm awake and ready to help. What can I do for you today at BAIA Resort?");
          } else {
            // Strip leading wake phrase if present
            const cleanPrompt = finalScript.replace(/^(wake up tala|hey tala|tala)[,!\s]*/i, '');
            sendPromptToTala(cleanPrompt.trim() || finalScript.trim());
          }
        }
      };

      const handleSilenceEnd = () => {
        setState('IDLE');
        setInterimTranscript('');

        if (settings.continuousListening) {
          silenceCountRef.current += 1;
          if (silenceCountRef.current === 1) {
            addLog('[ SILENCE DETECTED ]: TALA asking if guest needs anything else...', 'info');
            speakText('Is that all I can help you with today?');
          } else {
            addLog('[ STANDBY ]: TALA on standby. Say or tap "Wake up TALA" to activate.', 'system');
            silenceCountRef.current = 0;
          }
        }
      };

      recognition.onerror = (event: any) => {
        if (event.error !== 'no-speech') {
          addLog(`Microphone Error: ${event.error}`, 'error');
        }
        handleSilenceEnd();
      };

      recognition.onend = () => {
        if (state === 'LISTENING') {
          handleSilenceEnd();
        }
      };

      recognition.start();
    } catch (e: any) {
      addLog(`Mic activation error: ${e.message || e}`, 'error');
      setState('IDLE');
    }
  }, [state, addLog, stopSpeech, sendPromptToTala]);

  useEffect(() => {
    startListeningRef.current = startListening;
  }, [startListening]);

  // Knowledge File Upload Handler
  const handleUploadKnowledgeFile = useCallback((file: File, category: KnowledgeCategory = 'Property') => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const textContent = (e.target?.result as string) || '';
      const newDoc: KnowledgeFile = {
        id: `doc-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        name: file.name,
        size: file.size,
        type: file.type || 'text/plain',
        content: textContent,
        uploadedAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        category
      };
      setKnowledgeFiles((prev) => [newDoc, ...prev]);
      knowledgeService.saveDoc(newDoc);
      addLog(`Added knowledge doc "${file.name}" under ${category}`, 'success');
    };
    reader.readAsText(file);
  }, [addLog]);

  const handleDeleteKnowledgeFile = useCallback((id: string) => {
    setKnowledgeFiles((prev) => prev.filter((f) => f.id !== id));
    knowledgeService.deleteDoc(id);
    addLog(`Deleted knowledge doc ${id}`, 'info');
  }, [addLog]);

  // Guest Requests Handlers
  const handleSaveRequest = useCallback(async (req: GuestRequest) => {
    const updated = await requestService.saveRequest(req);
    setGuestRequests(updated);
    addLog(`Logged guest request "${req.title}"`, 'success');
  }, [addLog]);

  const handleUpdateStatus = useCallback(async (id: string, status: GuestRequestStatus) => {
    const updated = await requestService.updateRequestStatus(id, status);
    setGuestRequests(updated);
    addLog(`Updated request ${id} status to ${status}`, 'info');
  }, [addLog]);

  const handleUpdateSettings = useCallback((newPartial: Partial<TalaSettings>) => {
    if (newPartial.selectedVoiceName) {
      speechEngine.logAndValidateVoiceSelection(newPartial.selectedVoiceName, 'voice-profile-change');
    }
    setSettings((prev) => {
      const updated = { ...prev, ...newPartial };
      try {
        localStorage.setItem('tala_settings', JSON.stringify(updated));
        settingsService.saveSettings(updated);
      } catch (e) {
        console.warn('Failed to save settings:', e);
      }
      return updated;
    });
  }, []);

  const handleDeleteRequest = useCallback(async (id: string) => {
    const updated = await requestService.deleteRequest(id);
    setGuestRequests(updated);
    addLog(`Deleted request ${id}`, 'info');
  }, [addLog]);

  return (
    <BrowserRouter>
      <Routes>
        {/* Guest Concierge View */}
        <Route
          path="/"
          element={
            <GuestConcierge
              talaState={state}
              onCoreClick={startListening}
              speechVolume={speechVolume}
              interimTranscript={interimTranscript}
              messages={messages}
              onSendMessage={sendPromptToTala}
              onStopSpeech={stopSpeech}
              continuousListening={settings.continuousListening}
              onToggleContinuousListening={() =>
                setSettings((prev) => ({ ...prev, continuousListening: !prev.continuousListening }))
              }
              currentUser={currentUser}
              onSignIn={handleSignIn}
              onSignOut={handleSignOut}
              soundEnabled={settings.soundEnabled}
              onToggleSound={() => setSettings((prev) => ({ ...prev, soundEnabled: !prev.soundEnabled }))}
            />
          }
        />

        {/* Admin Application Routes */}
        <Route
          path="/admin"
          element={
            <AdminLayout
              currentUser={currentUser}
              onSignIn={handleSignIn}
              onSignOut={handleSignOut}
            />
          }
        >
          {/* Admin Dashboard */}
          <Route
            index
            element={
              <AdminDashboardPage
                messages={messages}
                knowledgeFiles={knowledgeFiles}
                guestRequests={guestRequests}
                hasServerOpenRouterKey={hasServerOpenRouterKey}
                hasCustomKey={Boolean(settings.openrouterApiKey || settings.customApiKey)}
              />
            }
          />

          {/* Admin Conversations Inbox */}
          <Route
            path="conversations"
            element={
              <AdminConversationsPage
                messages={messages}
                onSendMessage={sendPromptToTala}
              />
            }
          />

          {/* Admin Knowledge Base Manager */}
          <Route
            path="knowledge"
            element={
              <AdminKnowledgePage
                files={knowledgeFiles}
                onUploadFile={handleUploadKnowledgeFile}
                onDeleteFile={handleDeleteKnowledgeFile}
              />
            }
          />

          {/* Admin Guest Requests Manager */}
          <Route
            path="requests"
            element={
              <AdminRequestsPage
                requests={guestRequests}
                onSaveRequest={handleSaveRequest}
                onUpdateStatus={handleUpdateStatus}
                onDeleteRequest={handleDeleteRequest}
              />
            }
          />

          {/* Admin Settings & Diagnostics */}
          <Route
            path="settings"
            element={
              <AdminSettingsPage
                settings={settings}
                onUpdateSettings={handleUpdateSettings}
                availableVoices={voices}
                onTestVoice={handleTestVoiceDiagnostic}
                logs={logs}
                onClearLogs={() => setLogs([])}
                currentUser={currentUser}
                onSignIn={handleSignIn}
                onSignOut={handleSignOut}
                hasServerOpenRouterKey={hasServerOpenRouterKey}
                knowledgeFiles={knowledgeFiles}
                onUploadKnowledgeFile={handleUploadKnowledgeFile}
              />
            }
          />

          {/* Fallback for unrecognized subroutes under /admin */}
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Route>

        {/* Global Fallback to Guest View */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
