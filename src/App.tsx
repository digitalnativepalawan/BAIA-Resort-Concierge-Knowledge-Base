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
  GuestRequestStatus
} from './types';

import { authService, TalaUser } from './services/authService';
import { conversationService } from './services/conversationService';
import { knowledgeService } from './services/knowledgeService';
import { settingsService } from './services/settingsService';
import { requestService } from './services/requestService';

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
  "You are TALA, the AI concierge for BAIA Resort. You help guests with questions about their stay, the property, local transportation, food, activities, San Vicente, and information contained in the BAIA knowledge base. Speak naturally, warmly, clearly, and concisely. Prioritize information from the supplied BAIA knowledge base. Never invent property information when the knowledge base does not contain the answer. When appropriate, tell the guest that staff can assist.";

export default function App() {
  const [state, setState] = useState<TalaState>('IDLE');
  const [speechVolume, setSpeechVolume] = useState<number>(0.5);
  const [interimTranscript, setInterimTranscript] = useState<string>('');
  const [logs, setLogs] = useState<TelemetryLogEntry[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [voices, setVoices] = useState<VoiceOption[]>([]);
  const [hasServerOpenRouterKey, setHasServerOpenRouterKey] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<TalaUser | null>(null);

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

    return {
      pitch: 1.05,
      rate: 1.05,
      selectedVoiceName: '',
      openrouterApiKey: openrouterKey,
      selectedOpenRouterModel: selectedOpenRouterModel,
      customApiKey: openrouterKey,
      systemInstruction: DEFAULT_SYSTEM_INSTRUCTION,
      autoSpeak: true,
      soundEnabled: true,
      continuousListening: false,
      useHybridNeural: true,
    };
  });

  // Speech Recognition & Synthesis references
  const recognitionRef = useRef<any>(null);
  const currentUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const startListeningRef = useRef<(() => void) | null>(null);

  // Persist knowledge files
  useEffect(() => {
    try {
      localStorage.setItem('tala_knowledge_files', JSON.stringify(knowledgeFiles));
    } catch (e) {
      console.warn('Failed to save knowledge files:', e);
    }
  }, [knowledgeFiles]);

  // Persist settings (without API keys)
  useEffect(() => {
    const safeSettings = { ...settings };
    delete safeSettings.openrouterApiKey;
    delete safeSettings.customApiKey;
    localStorage.setItem('tala_settings', JSON.stringify(safeSettings));
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

  // Auth initializer
  useEffect(() => {
    const unsubscribe = authService.subscribeToAuth(async (user) => {
      setCurrentUser(user);
      if (user) {
        addLog(`[ AUTH ]: Authenticated as ${user.name || user.email}`, 'success');
        try {
          const remoteSettings = await settingsService.getSettings(user.id);
          if (remoteSettings) {
            setSettings((prev) => ({ ...prev, ...remoteSettings }));
          }
        } catch {}
      } else {
        addLog('[ AUTH ]: Guest mode active', 'info');
      }
    });

    return () => unsubscribe();
  }, [addLog]);

  // Knowledge and requests listeners (guest mode - no auth required)
  useEffect(() => {
    const unsubDocs = knowledgeService.listenDocs('guest', (remoteDocs) => {
      setKnowledgeFiles(remoteDocs);
    });

    const unsubRequests = requestService.listenRequests((remoteRequests) => {
      setGuestRequests(remoteRequests);
    });

    return () => {
      unsubDocs();
      unsubRequests();
    };
  }, []);

  // Sync settings to PocketBase
  useEffect(() => {
    if (currentUser) {
      settingsService.saveSettings(currentUser.id, settings);
    }
  }, [currentUser, settings]);

  const handleLogin = useCallback(async (email: string, password: string) => {
    try {
      soundEffects.playProcessingBeep();
      await authService.login(email, password);
      soundEffects.playResponseChime();
    } catch (err: any) {
      addLog(`Auth error: ${err.message || err}`, 'error');
      soundEffects.playErrorSound();
    }
  }, [addLog]);

  const handleSignOut = useCallback(async () => {
    try {
      await authService.logoutUser();
      addLog('[ AUTH ]: Signed out.', 'info');
      soundEffects.playProcessingBeep();
    } catch (err: any) {
      addLog(`Logout error: ${err.message || err}`, 'error');
    }
  }, [addLog]);

  // Check Server Health
  useEffect(() => {
    fetch('/api/health')
      .then(async (res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const contentType = res.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          return res.json();
        }
        throw new Error('Non-JSON response');
      })
      .then((data) => {
        setHasServerOpenRouterKey(Boolean(data?.hasServerOpenRouterKey));
        addLog(
          `TALA Core Server Online. OpenRouter Gateway: ${data?.hasServerOpenRouterKey ? 'READY' : 'LOCAL KEY MODE'}.`,
          'system'
        );
      })
      .catch(() => {
        addLog('Server health check pending or offline mode.', 'info');
      });
  }, [addLog]);

  // Web Speech Voices Initializer
  useEffect(() => {
    const populateVoices = () => {
      if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
      const rawVoices = window.speechSynthesis.getVoices();
      if (rawVoices.length === 0) return;

      const femaleRegex = /(samantha|zira|victoria|karen|jenny|aria|eva|monica|serena|siri|female|google.*us.*english|google.*uk.*female|natural.*female|microsoft.*natural|microsoft.*jenny|microsoft.*aria)/i;

      const formatted: VoiceOption[] = rawVoices.map((v) => {
        const isFemale = femaleRegex.test(v.name);
        return {
          name: v.name,
          lang: v.lang,
          default: v.default,
          voiceURI: v.voiceURI,
          gender: isFemale ? 'female' : 'unknown'
        };
      });

      formatted.sort((a, b) => {
        const aFemale = a.gender === 'female';
        const bFemale = b.gender === 'female';
        if (aFemale && !bFemale) return -1;
        if (!aFemale && bFemale) return 1;
        return 0;
      });

      setVoices(formatted);

      if (!settings.selectedVoiceName) {
        const topFemale = formatted.find((v) => v.gender === 'female');
        if (topFemale) {
          setSettings((prev) => ({ ...prev, selectedVoiceName: topFemale.name }));
        } else if (formatted.length > 0) {
          setSettings((prev) => ({ ...prev, selectedVoiceName: formatted[0].name }));
        }
      }
    };

    populateVoices();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = populateVoices;
    }
  }, [settings.selectedVoiceName]);

  // Initial Boot Chime
  useEffect(() => {
    addLog('[ TALA ONLINE ] BAIA Resort AI Concierge Initialized', 'system');
    soundEffects.playStartup();
  }, [addLog]);

  // Speech Synthesis
  const speakText = useCallback(
    (text: string) => {
      if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

      const cleanedText = cleanTextForSpeech(text);
      if (!cleanedText) return;

      try {
        if (window.speechSynthesis.speaking || window.speechSynthesis.pending) {
          window.speechSynthesis.cancel();
        }
        if (window.speechSynthesis.paused) {
          window.speechSynthesis.resume();
        }
      } catch (e) {}

      const utterance = new SpeechSynthesisUtterance(cleanedText);
      currentUtteranceRef.current = utterance;

      utterance.pitch = settings.pitch || 1.05;
      utterance.rate = settings.rate || 1.05;

      if (settings.selectedVoiceName) {
        const selected = window.speechSynthesis
          .getVoices()
          .find((v) => v.name === settings.selectedVoiceName);
        if (selected) utterance.voice = selected;
      }

      utterance.onstart = () => {
        setState('SPEAKING');
        setSpeechVolume(0.8);
        addLog('[ VOCALIZING ]: TALA speech output active', 'speaking');
      };

      utterance.onboundary = () => {
        setSpeechVolume(0.4 + Math.random() * 0.6);
      };

      utterance.onend = () => {
        setState('IDLE');
        setSpeechVolume(0.2);

        if (settings.continuousListening && startListeningRef.current) {
          setTimeout(() => {
            startListeningRef.current?.();
          }, 400);
        }
      };

      utterance.onerror = (e: any) => {
        const errType = e?.error || 'interrupted';
        setState('IDLE');
        setSpeechVolume(0.2);
        if (errType !== 'canceled' && errType !== 'interrupted') {
          addLog(`[ VOCALIZATION NOTICE ]: ${errType}`, 'info');
        }
      };

      setTimeout(() => {
        try {
          if ('speechSynthesis' in window) {
            window.speechSynthesis.resume();
            window.speechSynthesis.speak(utterance);
          }
        } catch (e) {
          setState('IDLE');
          setSpeechVolume(0.2);
        }
      }, 30);
    },
    [settings, addLog]
  );

  const stopSpeech = useCallback(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
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

      // Ensure we have a conversation ID
      let conversationId = conversationService.getConversationId();
      if (!conversationId) {
        try {
          conversationId = await conversationService.ensureGuestConversation();
        } catch (err) {
          console.warn('Failed to create conversation:', err);
        }
      }

      const userMsg: ChatMessage = {
        id: Math.random().toString(36).substring(2, 9),
        role: 'user',
        text: promptText,
        timestamp: new Date().toLocaleTimeString('en-US', { hour12: false })
      };

      setMessages((prev) => [...prev, userMsg]);
      if (conversationId) {
        conversationService.saveChatMessage(conversationId, userMsg);
      }
      addLog(`[GUEST INPUT]: "${promptText}"`, 'info');

      setState('PROCESSING');
      soundEffects.playProcessingBeep();

      try {
        const historyForApi = messages.slice(-10).map((m) => ({
          role: m.role,
          text: m.text
        }));

        const effectiveOpenRouterKey = settings.openrouterApiKey?.trim() || '';

        // Server-side knowledge grounding: the server fetches knowledge docs from PocketBase
        // No client-side grounding needed - pass the base system instruction
        const selectedModel = settings.selectedOpenRouterModel || 'openrouter/free';

        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({
            openrouterApiKey: effectiveOpenRouterKey || undefined,
            model: selectedModel,
            prompt: promptText,
            history: historyForApi,
            systemInstruction: settings.systemInstruction || DEFAULT_SYSTEM_INSTRUCTION
          })
        });

        const rawResponseBody = await response.text();
        let data: any = {};
        try {
          data = JSON.parse(rawResponseBody);
        } catch (e) {
          data = { error: `Server response error (${response.status})` };
        }

        if (!response.ok || data.error) {
          throw new Error(data.error || `HTTP Error ${response.status}`);
        }

        const replyText = data.responseText || 'TALA received an empty response.';

        const talaMsg: ChatMessage = {
          id: Math.random().toString(36).substring(2, 9),
          role: 'model',
          text: replyText,
          timestamp: new Date().toLocaleTimeString('en-US', { hour12: false })
        };

        setMessages((prev) => [...prev, talaMsg]);
        if (conversationId) {
          conversationService.saveChatMessage(conversationId, talaMsg);
        }
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
            text: `[TALA CONCIERGE NOTICE]: ${errorText}`,
            timestamp: new Date().toLocaleTimeString('en-US', { hour12: false })
          }
        ]);
      }
    },
    [messages, settings, addLog, speakText, stopSpeech]
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
          setInterimTranscript('');
          addLog(`[ SPEECH DETECTED ]: "${finalScript}"`, 'success');
          sendPromptToTala(finalScript);
        }
      };

      recognition.onerror = (event: any) => {
        if (event.error !== 'no-speech') {
          addLog(`Microphone Error: ${event.error}`, 'error');
        }
        setState('IDLE');
        setInterimTranscript('');
      };

      recognition.onend = () => {
        setState('IDLE');
        setInterimTranscript('');
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
      knowledgeService.saveDoc(currentUser?.id || 'guest', newDoc);
      addLog(`Added knowledge doc "${file.name}" under ${category}`, 'success');
    };
    reader.readAsText(file);
  }, [currentUser, addLog]);

  const handleDeleteKnowledgeFile = useCallback((id: string) => {
    setKnowledgeFiles((prev) => prev.filter((f) => f.id !== id));
    knowledgeService.deleteDoc(currentUser?.id || 'guest', id);
    addLog(`Deleted knowledge doc ${id}`, 'info');
  }, [currentUser, addLog]);

  // Guest Requests Handlers
  const handleSaveRequest = useCallback(async (req: GuestRequest) => {
    const newReq = await requestService.saveRequest({
      title: req.title,
      description: req.description,
      category: req.category,
      guestLabel: req.guestLabel,
      room: req.room,
      status: req.status
    });
    if (newReq) {
      setGuestRequests((prev) => [newReq, ...prev]);
      addLog(`Logged guest request "${req.title}"`, 'success');
    }
  }, [addLog]);

  const handleUpdateStatus = useCallback(async (id: string, status: GuestRequestStatus) => {
    const success = await requestService.updateRequestStatus(id, status);
    if (success) {
      setGuestRequests((prev) => prev.map((r) => r.id === id ? { ...r, status } : r));
      addLog(`Updated request ${id} status to ${status}`, 'info');
    }
  }, [addLog]);

  const handleDeleteRequest = useCallback(async (id: string) => {
    const success = await requestService.deleteRequest(id);
    if (success) {
      setGuestRequests((prev) => prev.filter((r) => r.id !== id));
      addLog(`Deleted request ${id}`, 'info');
    }
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
              onLogin={handleLogin}
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
              onLogin={handleLogin}
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
            element={<AdminConversationsPage />}
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
                onUpdateSettings={(newPartial) => setSettings((prev) => ({ ...prev, ...newPartial }))}
                availableVoices={voices}
                onTestVoice={handleTestVoiceDiagnostic}
                logs={logs}
                onClearLogs={() => setLogs([])}
                currentUser={currentUser}
                onLogin={handleLogin}
                onSignOut={handleSignOut}
                hasServerOpenRouterKey={hasServerOpenRouterKey}
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
