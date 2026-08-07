import React, { useState, useEffect, useRef, useCallback } from 'react';
import { User } from 'firebase/auth';
import {
  subscribeToAuth,
  signInWithGoogle,
  logoutUser,
  testFirestoreConnection,
  saveChatMessage,
  listenChatMessages,
  saveKnowledgeDoc,
  deleteKnowledgeDoc,
  listenKnowledgeDocs,
  saveUserSettings,
  getUserSettings
} from './lib/firebase';
import {
  TalaState,
  TelemetryLogEntry,
  ChatMessage,
  VoiceOption,
  TalaSettings,
  KnowledgeFile
} from './types';
import { ArcReactorHUD } from './components/ArcReactorHUD';
import { TelemetryLog } from './components/TelemetryLog';
import { ConversationStream } from './components/ConversationStream';
import { CommandBar } from './components/CommandBar';
import { SettingsDrawer } from './components/SettingsDrawer';
import { Header } from './components/Header';
import { KnowledgeBaseWidget } from './components/KnowledgeBaseWidget';
import { soundEffects } from './utils/soundEffects';
import { cleanTextForSpeech } from './utils/textUtils';

export default function App() {
  const [state, setState] = useState<TalaState>('IDLE');
  const [speechVolume, setSpeechVolume] = useState<number>(0.5);
  const [interimTranscript, setInterimTranscript] = useState<string>('');
  const [logs, setLogs] = useState<TelemetryLogEntry[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [voices, setVoices] = useState<VoiceOption[]>([]);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [hasServerOpenRouterKey, setHasServerOpenRouterKey] = useState<boolean>(false);
  const [hasServerGeminiKey, setHasServerGeminiKey] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Client-Side Grounding Knowledge Base Files State
  const [knowledgeFiles, setKnowledgeFiles] = useState<KnowledgeFile[]>(() => {
    try {
      const saved = localStorage.getItem('tala_knowledge_files');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  // Persist knowledge files to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem('tala_knowledge_files', JSON.stringify(knowledgeFiles));
    } catch (e) {
      console.warn('Could not persist knowledge files to localStorage:', e);
    }
  }, [knowledgeFiles]);

  // Default Settings with OpenRouter as Primary & Fallback variables
  const [settings, setSettings] = useState<TalaSettings>(() => {
    let openrouterKey = '';
    let googleKey = '';
    let apiProvider: 'openrouter' | 'google' = 'openrouter';
    let selectedOpenRouterModel = 'openrouter/free';
    let selectedGoogleModel = 'gemini-1.5-flash';

    // Fallback key detection
    const fallbackOpenRouterKey =
      localStorage.getItem('openrouter_api_key') ||
      localStorage.getItem('tala_openrouter_api_key') ||
      localStorage.getItem('OPENROUTER_API_KEY') ||
      (typeof window !== 'undefined' && (window as any).OPENROUTER_API_KEY ? (window as any).OPENROUTER_API_KEY : '');

    const fallbackGoogleKey =
      localStorage.getItem('tala_custom_api_key') ||
      localStorage.getItem('google_ai_studio_api_key') ||
      localStorage.getItem('GEMINI_API_KEY') ||
      (typeof window !== 'undefined' && (window as any).GEMINI_API_KEY ? (window as any).GEMINI_API_KEY : '');

    const saved = localStorage.getItem('tala_settings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed) {
          if (parsed.apiProvider) apiProvider = parsed.apiProvider;
          if (parsed.openrouterApiKey) openrouterKey = parsed.openrouterApiKey.trim();
          if (parsed.googleApiKey) googleKey = parsed.googleApiKey.trim();
          if (parsed.selectedOpenRouterModel) selectedOpenRouterModel = parsed.selectedOpenRouterModel;
          if (parsed.selectedGoogleModel) selectedGoogleModel = parsed.selectedGoogleModel;
        }
      } catch (e) {
        // ignore parse error
      }
    }

    if (!openrouterKey && fallbackOpenRouterKey) {
      openrouterKey = String(fallbackOpenRouterKey).trim();
    }

    if (!googleKey && fallbackGoogleKey) {
      googleKey = String(fallbackGoogleKey).trim();
    }

    return {
      pitch: 1.05,
      rate: 1.05,
      selectedVoiceName: '',
      apiProvider: apiProvider,
      openrouterApiKey: openrouterKey,
      googleApiKey: googleKey,
      selectedOpenRouterModel: selectedOpenRouterModel,
      selectedGoogleModel: selectedGoogleModel,
      customApiKey: openrouterKey || googleKey,
      systemInstruction:
        "You are TALA (Tactical Artificial Intelligence Assistant), a highly advanced sci-fi AI interface created to deliver precise, intelligent, concise tactical assessments and answers. Maintain a serene, confident, and professional futuristic persona. Keep responses direct, elegant, and well-structured, formatted for both audio vocalization and HUD screen display. Avoid conversational fluff or robotic repetition.",
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

  // Save settings reliably to LocalStorage
  useEffect(() => {
    localStorage.setItem('tala_settings', JSON.stringify(settings));

    if (settings.openrouterApiKey) {
      localStorage.setItem('openrouter_api_key', settings.openrouterApiKey.trim());
      localStorage.setItem('tala_openrouter_api_key', settings.openrouterApiKey.trim());
    }

    if (settings.googleApiKey) {
      localStorage.setItem('google_ai_studio_api_key', settings.googleApiKey.trim());
      localStorage.setItem('GEMINI_API_KEY', settings.googleApiKey.trim());
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

  // Firebase Auth and Connection Initializer
  useEffect(() => {
    testFirestoreConnection();

    const unsubscribe = subscribeToAuth(async (user) => {
      setCurrentUser(user);
      if (user) {
        addLog(`[ FIREBASE AUTH ]: Authenticated as ${user.displayName || user.email}`, 'success');
        const remoteSettings = await getUserSettings(user.uid);
        if (remoteSettings) {
          setSettings((prev) => ({ ...prev, ...remoteSettings }));
        }
      } else {
        addLog('[ FIREBASE AUTH ]: Guest mode active (Sign in for Cloud Sync)', 'info');
      }
    });

    return () => unsubscribe();
  }, [addLog]);

  // Firestore Real-Time Sync for Chat Messages and Knowledge Base Docs
  useEffect(() => {
    if (!currentUser) return;

    const unsubChat = listenChatMessages(currentUser.uid, (remoteMsgs) => {
      if (remoteMsgs && remoteMsgs.length > 0) {
        setMessages(remoteMsgs);
      }
    });

    const unsubDocs = listenKnowledgeDocs(currentUser.uid, (remoteDocs) => {
      setKnowledgeFiles(remoteDocs);
    });

    return () => {
      unsubChat();
      unsubDocs();
    };
  }, [currentUser]);

  // Sync settings to Firestore on update when logged in
  useEffect(() => {
    if (currentUser) {
      saveUserSettings(currentUser.uid, settings);
    }
  }, [currentUser, settings]);

  const handleSignIn = useCallback(async () => {
    try {
      soundEffects.playProcessingBeep();
      await signInWithGoogle();
      soundEffects.playResponseChime();
    } catch (err: any) {
      addLog(`Firebase Auth error: ${err.message || err}`, 'error');
      soundEffects.playErrorSound();
    }
  }, [addLog]);

  const handleSignOut = useCallback(async () => {
    try {
      await logoutUser();
      addLog('[ FIREBASE AUTH ]: Signed out of Firebase.', 'info');
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
        throw new Error('Non-JSON response from server');
      })
      .then((data) => {
        setHasServerOpenRouterKey(Boolean(data?.hasServerOpenRouterKey));
        setHasServerGeminiKey(Boolean(data?.hasServerGeminiKey));
        addLog(
          `TALA Core Server Online. Primary OpenRouter: ${data?.hasServerOpenRouterKey ? 'READY' : 'LOCAL KEY MODE'}. Backup Google: ${data?.hasServerGeminiKey ? 'READY' : 'LOCAL KEY MODE'}.`,
          'system'
        );
      })
      .catch((err) => {
        addLog('Server health check pending or offline mode.', 'warning');
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

      // Sort: Natural female voices at top, female voices next, then rest
      formatted.sort((a, b) => {
        const aFemale = a.gender === 'female';
        const bFemale = b.gender === 'female';
        const aNeural = /(natural|online|google|neural|apple|enhanced|premium)/i.test(a.name);
        const bNeural = /(natural|online|google|neural|apple|enhanced|premium)/i.test(b.name);

        if (aFemale && aNeural && !(bFemale && bNeural)) return -1;
        if (!(aFemale && aNeural) && bFemale && bNeural) return 1;
        if (aFemale && !bFemale) return -1;
        if (!aFemale && bFemale) return 1;
        return 0;
      });

      setVoices(formatted);

      // Auto-select natural female voice if none selected yet
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

  // Initial Boot Chime & Telemetry
  useEffect(() => {
    addLog('[ TALA ONLINE ] Tactical Interface Initialized', 'system');
    addLog('OpenRouter Primary LLM Engine Active. Audio Synthesizer Ready.', 'info');
    soundEffects.playStartup();
  }, [addLog]);

  // Speech Synthesis Function with Markdown Pre-cleaning
  const speakText = useCallback(
    (text: string) => {
      if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
        addLog('Speech Synthesis not supported on this browser.', 'info');
        return;
      }

      // Pre-clean text to strip markdown formatting, code blocks, URLs, and system brackets
      const cleanedText = cleanTextForSpeech(text);
      if (!cleanedText) return;

      try {
        if (window.speechSynthesis.speaking || window.speechSynthesis.pending) {
          window.speechSynthesis.cancel(); // Stop any active speech
        }
        if (window.speechSynthesis.paused) {
          window.speechSynthesis.resume();
        }
      } catch (cancelErr) {
        // Safe catch for iframe / permission constraints
      }

      const utterance = new SpeechSynthesisUtterance(cleanedText);
      currentUtteranceRef.current = utterance;

      // Set optimal fluid pitch and rate
      utterance.pitch = settings.pitch || 1.05;
      utterance.rate = settings.rate || 1.05;

      // Match chosen voice
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
        // Dynamic volume modulation for HUD pulsing
        const rnd = 0.4 + Math.random() * 0.6;
        setSpeechVolume(rnd);
      };

      utterance.onend = () => {
        setState('IDLE');
        setSpeechVolume(0.2);
        addLog('[ VOCAL COMPLETE ]: Audio output finished', 'info');

        // Auto re-arm microphone for hands-free conversational loop if enabled
        if (settings.continuousListening && startListeningRef.current) {
          setTimeout(() => {
            addLog('[ HANDS-FREE LOOP ]: Re-arming microphone for continuous speech...', 'listening');
            startListeningRef.current?.();
          }, 400);
        }
      };

      utterance.onerror = (e: any) => {
        const errType = e?.error || 'interrupted';
        setState('IDLE');
        setSpeechVolume(0.2);

        // Filter out expected cancellation/interruption events from logging as errors
        if (errType === 'canceled' || errType === 'interrupted') {
          return;
        }

        console.warn('Speech synthesis event notice:', errType);
        if (errType === 'not-allowed') {
          addLog('[ VOCALIZATION ]: Audio playback waiting for user click gesture.', 'info');
        } else {
          addLog(`[ VOCALIZATION ]: Speech engine notice (${errType}). Text response rendered.`, 'info');
        }
      };

      // Wrap speak call with resume guard for browser iframe environments
      setTimeout(() => {
        try {
          if ('speechSynthesis' in window) {
            window.speechSynthesis.resume();
            window.speechSynthesis.speak(utterance);
          }
        } catch (speakErr) {
          console.warn('Speech synthesis invocation handled:', speakErr);
          setState('IDLE');
          setSpeechVolume(0.2);
        }
      }, 30);
    },
    [settings, addLog]
  );

  // Stop Speech
  const stopSpeech = useCallback(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setState('IDLE');
    setSpeechVolume(0.2);
    addLog('Speech output interrupted by user.', 'info');
  }, [addLog]);

  // Test Voice Diagnostic Handler
  const handleTestVoiceDiagnostic = useCallback(() => {
    stopSpeech();
    addLog('[ VOICE DIAGNOSTIC ]: Audio synthesizer test initiated.', 'system');
    soundEffects.playResponseChime();
    speakText("Voice diagnostic check complete. Audio synthesizer and neural sync operational.");
  }, [addLog, speakText, stopSpeech]);

  // Send Prompt to TALA API Endpoint
  const sendPromptToTala = useCallback(
    async (promptText: string) => {
      if (!promptText.trim()) return;

      stopSpeech();

      // Append user message
      const userMsg: ChatMessage = {
        id: Math.random().toString(36).substring(2, 9),
        role: 'user',
        text: promptText,
        timestamp: new Date().toLocaleTimeString('en-US', { hour12: false })
      };

      setMessages((prev) => [...prev, userMsg]);
      if (currentUser) {
        saveChatMessage(currentUser.uid, userMsg);
      }
      addLog(`[USER COMMAND]: "${promptText}"`, 'info');

      // --- LOCAL COMMAND PARSER ---
      // Intercept local trigger commands (e.g. 'TALA, STOP', 'TALA, VOLUME UP', 'TALA, CLEAR LOGS')
      const normalizedCmd = promptText.trim().toLowerCase().replace(/[.,!?;:]/g, '');

      // Command: STOP / QUIET / SILENCE
      if (
        normalizedCmd === 'tala stop' ||
        normalizedCmd === 'stop' ||
        normalizedCmd === 'tala quiet' ||
        normalizedCmd === 'tala silence' ||
        normalizedCmd === 'quiet' ||
        normalizedCmd === 'silence'
      ) {
        stopSpeech();
        setState('IDLE');
        addLog('[ COMMAND PARSER ]: Executed local command "STOP"', 'system');
        soundEffects.playProcessingBeep();
        return;
      }

      // Command: CLEAR LOGS / CLEAR TELEMETRY
      if (
        normalizedCmd === 'tala clear logs' ||
        normalizedCmd === 'clear logs' ||
        normalizedCmd === 'tala clear telemetry' ||
        normalizedCmd === 'clear telemetry' ||
        normalizedCmd === 'reset logs'
      ) {
        stopSpeech();
        setLogs([]);
        setState('IDLE');
        addLog('[ COMMAND PARSER ]: Telemetry logs cleared locally.', 'system');
        soundEffects.playResponseChime();
        if (settings.autoSpeak) {
          speakText('Telemetry logs cleared.');
        }
        return;
      }

      // Command: CLEAR CHAT / CLEAR HISTORY
      if (
        normalizedCmd === 'tala clear chat' ||
        normalizedCmd === 'clear chat' ||
        normalizedCmd === 'tala clear history' ||
        normalizedCmd === 'clear history' ||
        normalizedCmd === 'reset conversation'
      ) {
        stopSpeech();
        setMessages([]);
        setState('IDLE');
        addLog('[ COMMAND PARSER ]: Conversation history cleared locally.', 'system');
        soundEffects.playResponseChime();
        if (settings.autoSpeak) {
          speakText('Conversation stream reset.');
        }
        return;
      }

      // Command: VOLUME UP / LOUDER
      if (
        normalizedCmd === 'tala volume up' ||
        normalizedCmd === 'volume up' ||
        normalizedCmd === 'tala increase volume' ||
        normalizedCmd === 'tala louder' ||
        normalizedCmd === 'louder'
      ) {
        stopSpeech();
        setSpeechVolume((prev) => Math.min(1.0, prev + 0.25));
        setSettings((prev) => ({
          ...prev,
          rate: Math.min(1.5, (prev.rate || 1.05) + 0.05)
        }));
        setState('IDLE');
        addLog('[ COMMAND PARSER ]: Audio volume level increased.', 'system');
        soundEffects.playResponseChime();
        if (settings.autoSpeak) {
          speakText('Volume level increased.');
        }
        return;
      }

      // Command: VOLUME DOWN / QUIETER
      if (
        normalizedCmd === 'tala volume down' ||
        normalizedCmd === 'volume down' ||
        normalizedCmd === 'tala decrease volume' ||
        normalizedCmd === 'tala quieter' ||
        normalizedCmd === 'quieter'
      ) {
        stopSpeech();
        setSpeechVolume((prev) => Math.max(0.2, prev - 0.25));
        setSettings((prev) => ({
          ...prev,
          rate: Math.max(0.8, (prev.rate || 1.05) - 0.05)
        }));
        setState('IDLE');
        addLog('[ COMMAND PARSER ]: Audio volume level decreased.', 'system');
        soundEffects.playResponseChime();
        if (settings.autoSpeak) {
          speakText('Volume level decreased.');
        }
        return;
      }

      // Command: MUTE
      if (
        normalizedCmd === 'tala mute' ||
        normalizedCmd === 'mute' ||
        normalizedCmd === 'mute audio' ||
        normalizedCmd === 'tala quiet mode'
      ) {
        stopSpeech();
        setSettings((prev) => ({ ...prev, autoSpeak: false }));
        setState('IDLE');
        addLog('[ COMMAND PARSER ]: Auto-vocalization muted.', 'system');
        soundEffects.playProcessingBeep();
        return;
      }

      // Command: UNMUTE
      if (
        normalizedCmd === 'tala unmute' ||
        normalizedCmd === 'unmute' ||
        normalizedCmd === 'unmute audio'
      ) {
        stopSpeech();
        setSettings((prev) => ({ ...prev, autoSpeak: true }));
        setState('IDLE');
        addLog('[ COMMAND PARSER ]: Auto-vocalization enabled.', 'system');
        soundEffects.playResponseChime();
        speakText('Auto vocalization restored.');
        return;
      }

      // Command: CONFIG / SETTINGS
      if (
        normalizedCmd === 'tala config' ||
        normalizedCmd === 'config' ||
        normalizedCmd === 'tala settings' ||
        normalizedCmd === 'open config' ||
        normalizedCmd === 'open settings'
      ) {
        stopSpeech();
        setIsSettingsOpen(true);
        setState('IDLE');
        addLog('[ COMMAND PARSER ]: Configuration panel opened.', 'system');
        soundEffects.playResponseChime();
        if (settings.autoSpeak) {
          speakText('Opening configuration panel.');
        }
        return;
      }

      // Command: SYSTEM STATUS
      if (
        normalizedCmd === 'tala status' ||
        normalizedCmd === 'system status' ||
        normalizedCmd === 'status report' ||
        normalizedCmd === 'tala report'
      ) {
        stopSpeech();
        const providerName = settings.apiProvider === 'openrouter' ? 'OpenRouter Primary' : 'Google AI Studio Backup';
        const modelName = settings.apiProvider === 'openrouter' ? settings.selectedOpenRouterModel : settings.selectedGoogleModel;
        const statusMsg = `TALA System Status: Core Online using ${providerName} (${modelName}). ${knowledgeFiles.length} grounded document(s) loaded. Auto-speak is ${settings.autoSpeak ? 'ENABLED' : 'MUTED'}.`;

        const talaMsg: ChatMessage = {
          id: Math.random().toString(36).substring(2, 9),
          role: 'model',
          text: statusMsg,
          timestamp: new Date().toLocaleTimeString('en-US', { hour12: false })
        };

        setMessages((prev) => [...prev, talaMsg]);
        setState('IDLE');
        addLog('[ COMMAND PARSER ]: Local status report generated.', 'success');
        soundEffects.playResponseChime();
        if (settings.autoSpeak) {
          speakText(statusMsg);
        }
        return;
      }

      // --- END LOCAL COMMAND PARSER ---

      setState('PROCESSING');
      soundEffects.playProcessingBeep();
      const activeProviderLabel = settings.apiProvider === 'openrouter' ? 'OpenRouter' : 'Google AI Studio';
      addLog(`[ PROCESSING ]: Contacting ${activeProviderLabel} Core...`, 'processing');

      try {
        const historyForApi = messages.slice(-10).map((m) => ({
          role: m.role,
          text: m.text
        }));

        const activeProvider = settings.apiProvider || 'openrouter';
        const effectiveOpenRouterKey = settings.openrouterApiKey?.trim() || '';
        const effectiveGoogleKey = settings.googleApiKey?.trim() || settings.customApiKey?.trim() || '';

        const hasKeyToUse = activeProvider === 'openrouter'
          ? (Boolean(effectiveOpenRouterKey) || hasServerOpenRouterKey)
          : (Boolean(effectiveGoogleKey) || hasServerGeminiKey);

        if (!hasKeyToUse) {
          const keyLabel = activeProvider === 'openrouter' ? 'OpenRouter' : 'Google AI Studio';
          const noKeyAlert = `⚠️ NO API KEY CONFIG: Please click CONFIG in the top-right header and enter your ${keyLabel} API key.`;
          addLog(noKeyAlert, 'error');
          setState('ERROR');
          soundEffects.playErrorSound();

          setMessages((prev) => [
            ...prev,
            {
              id: Math.random().toString(36).substring(2, 9),
              role: 'model',
              text: `⚠️ CONFIGURATION REQUIRED: No ${keyLabel} API Key was found. Please click CONFIG in the top-right header to enter your API key or select a free OpenRouter model.`,
              timestamp: new Date().toLocaleTimeString('en-US', { hour12: false })
            }
          ]);
          setIsSettingsOpen(true);
          return;
        }

        // Construct grounded system instruction
        let groundedSystemInstruction = settings.systemInstruction;
        if (knowledgeFiles.length > 0) {
          const docsText = knowledgeFiles
            .map((f, idx) => `--- GROUNDED DOCUMENT ${idx + 1}: ${f.name} ---\n${f.content}`)
            .join('\n\n');

          groundedSystemInstruction += `\n\n=== GROUNDING KNOWLEDGE BASE ===\nThe user has attached the following ${knowledgeFiles.length} reference document(s):\n\n${docsText}\n\n=== GROUNDING DIRECTIVES ===\n1. Answer user queries by prioritizing and extracting context from the GROUNDING KNOWLEDGE BASE provided above.\n2. When asked about subjects in these documents, give accurate, direct, structured answers based on the document text.\n3. Format responses concisely for display and clear speech vocalization.`;
        }

        const selectedModel = activeProvider === 'openrouter'
          ? (settings.selectedOpenRouterModel || 'openrouter/free')
          : (settings.selectedGoogleModel || 'gemini-1.5-flash');

        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({
            provider: activeProvider,
            openrouterApiKey: effectiveOpenRouterKey || undefined,
            googleApiKey: effectiveGoogleKey || undefined,
            model: selectedModel,
            prompt: promptText,
            history: historyForApi,
            systemInstruction: groundedSystemInstruction
          })
        });

        const rawResponseBody = await response.text();
        let data: any = {};
        try {
          data = JSON.parse(rawResponseBody);
        } catch (parseErr) {
          console.warn('[TALA] Received non-JSON response from server endpoint:', rawResponseBody.slice(0, 200));
          data = {
            error: response.ok
              ? 'Server returned non-JSON content.'
              : `Server Gateway Error (${response.status} ${response.statusText || 'Error'}).`
          };
        }

        if (!response.ok || data.error) {
          const rawError = data.error || `HTTP Error ${response.status}`;
          throw new Error(rawError);
        }

        const replyText = data.responseText || 'TALA telemetry received empty signal.';

        const talaMsg: ChatMessage = {
          id: Math.random().toString(36).substring(2, 9),
          role: 'model',
          text: replyText,
          timestamp: new Date().toLocaleTimeString('en-US', { hour12: false })
        };

        setMessages((prev) => [...prev, talaMsg]);
        if (currentUser) {
          saveChatMessage(currentUser.uid, talaMsg);
        }
        addLog(`[ TALA RESPONSE RECEIVED via ${data.provider || activeProvider} ]`, 'success');
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
        const errorText = err.message || 'System error communicating with LLM engine.';
        addLog(`[ ERROR ]: ${errorText}`, 'error');

        setMessages((prev) => [
          ...prev,
          {
            id: Math.random().toString(36).substring(2, 9),
            role: 'model',
            text: `⚠️ [TALA SYSTEM ALERT]: ${errorText}`,
            timestamp: new Date().toLocaleTimeString('en-US', { hour12: false })
          }
        ]);
      }
    },
    [messages, settings, addLog, speakText, stopSpeech, knowledgeFiles, hasServerOpenRouterKey, hasServerGeminiKey]
  );

  // Web Speech Recognition Initializer & Trigger
  const startListening = useCallback(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      addLog('Web Speech Recognition is not supported in this browser.', 'error');
      alert('Speech Recognition API is not supported in this browser. Please use Chrome, Edge, or Safari.');
      return;
    }

    if (state === 'LISTENING') {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setState('IDLE');
      soundEffects.playListeningEnd();
      addLog('Voice input cancelled.', 'info');
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
        addLog('[ LISTENING ACTIVE ]: Speak command into microphone', 'listening');
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

        if (currentInterim) {
          setInterimTranscript(currentInterim);
        }

        if (finalScript) {
          setInterimTranscript('');
          addLog(`[ SPEECH RECOGNIZED ]: "${finalScript}"`, 'success');
          sendPromptToTala(finalScript);
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech Recog Error:', event.error);
        if (event.error !== 'no-speech') {
          addLog(`Microphone Error: ${event.error}`, 'error');
          soundEffects.playErrorSound();
        }
        setState('IDLE');
        setInterimTranscript('');
      };

      recognition.onend = () => {
        if (state === 'LISTENING') {
          setState('IDLE');
          setInterimTranscript('');
        }
      };

      recognition.start();
    } catch (e: any) {
      console.error('Failed to start speech recognition:', e);
      addLog(`Mic activation error: ${e.message || e}`, 'error');
      setState('IDLE');
    }
  }, [state, addLog, stopSpeech, sendPromptToTala]);

  // Sync latest startListening function to ref for Hands-Free auto-listen callback
  useEffect(() => {
    startListeningRef.current = startListening;
  }, [startListening]);

  // Seamless Barge-in / Interrupt Mic Handler
  const handleMicToggle = useCallback(() => {
    if (state === 'SPEAKING') {
      stopSpeech();
      addLog('[ BARGE-IN INTERRUPT ]: Interrupted speech vocalization to activate mic', 'listening');
      setTimeout(() => {
        startListening();
      }, 150);
      return;
    }
    startListening();
  }, [state, stopSpeech, startListening, addLog]);

  return (
    <div className="min-h-screen bg-[#050811] text-[#e0e7ff] flex flex-col font-sans selection:bg-[#00f0ff] selection:text-black relative overflow-x-hidden border-[8px] sm:border-[12px] border-[#0a0f1d] shadow-inner">
      
      {/* Sci-Fi Background Scanline Grid Overlay */}
      <div className="fixed inset-0 pointer-events-none z-0 bg-[radial-gradient(#00f0ff_1px,transparent_1px)] [background-size:24px_24px] opacity-10" />
      <div className="fixed inset-0 pointer-events-none z-0 bg-gradient-to-b from-[#00f0ff]/5 via-transparent to-[#ff007f]/5 opacity-30" />

      {/* Top Glassmorphism HUD Header Bar */}
      <Header
        state={state}
        settings={settings}
        setSettings={setSettings}
        onOpenSettings={() => setIsSettingsOpen(true)}
        hasServerOpenRouterKey={hasServerOpenRouterKey}
        hasServerGeminiKey={hasServerGeminiKey}
        currentUser={currentUser}
        onSignIn={handleSignIn}
        onSignOut={handleSignOut}
      />

      {/* Main Layout Grid */}
      <main
        className={`relative z-10 flex-1 w-full max-w-7xl mx-auto p-3 sm:p-6 my-2 sm:my-4 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start bg-[#080d1a]/50 backdrop-blur-md border border-[#00f0ff]/20 rounded-2xl transition-all duration-500 ${
          state === 'IDLE' ? 'animate-breathing' : 'shadow-[0_0_20px_rgba(0,240,255,0.1)]'
        }`}
      >
        
        {/* Left / Top Column: Diagnostics, Arc Reactor HUD & Telemetry Console */}
        <section className="lg:col-span-5 flex flex-col items-center gap-5 w-full">
          
          {/* HUD Side Diagnostics Cards */}
          <div className="w-full grid grid-cols-2 gap-3 font-mono">
            {/* Vocal Analysis Card */}
            <div className="bg-[#0a0f1d] border-l-2 border-[#ff007f] p-3 shadow-lg rounded-r">
              <div className="text-[9px] uppercase text-[#ff007f] font-bold mb-1 tracking-widest flex items-center justify-between">
                <span>Vocal Analysis</span>
                <span className="w-1.5 h-1.5 rounded-full bg-[#ff007f] animate-ping" />
              </div>
              <div className="h-1.5 w-full bg-[#1a2235] relative mb-2 rounded overflow-hidden">
                <div
                  className="absolute inset-y-0 left-0 bg-[#ff007f] transition-all duration-300"
                  style={{ width: `${state === 'SPEAKING' ? speechVolume * 100 : 75}%` }}
                />
              </div>
              <div className="text-[10px] text-[#00f0ff]/90">
                TONE: <span className="text-white font-bold">{state === 'SPEAKING' ? 'VOCALIZING' : 'ANALYTICAL'}</span>
              </div>
            </div>

            {/* Latency Metrics Card */}
            <div className="bg-[#0a0f1d] border-l-2 border-[#00f0ff] p-3 shadow-lg rounded-r">
              <div className="text-[9px] uppercase text-[#00f0ff] font-bold mb-1 tracking-widest flex items-center justify-between">
                <span>Latency Metr.</span>
                <span className="text-[9px] text-[#00f0ff]">12ms</span>
              </div>
              <div className="flex gap-1 h-4 items-end">
                <div className="w-1.5 h-2 bg-[#00f0ff]/40 rounded-t" />
                <div className="w-1.5 h-3.5 bg-[#00f0ff]/60 rounded-t" />
                <div className="w-1.5 h-2.5 bg-[#00f0ff]/40 rounded-t" />
                <div className="w-1.5 h-4 bg-[#00f0ff] rounded-t animate-pulse" />
                <div className="w-1.5 h-3 bg-[#00f0ff]/80 rounded-t" />
                <div className="w-1.5 h-2 bg-[#00f0ff]/40 rounded-t" />
              </div>
            </div>
          </div>

          {/* Arc Reactor Centerpiece */}
          <ArcReactorHUD
            state={state}
            onCoreClick={startListening}
            speechVolume={speechVolume}
            interimTranscript={interimTranscript}
          />

          {/* Telemetry Console */}
          <TelemetryLog
            logs={logs}
            state={state}
            hasServerKey={hasServerOpenRouterKey || hasServerGeminiKey}
            hasCustomKey={Boolean(settings.openrouterApiKey || settings.googleApiKey || settings.customApiKey)}
            activeVoiceName={settings.selectedVoiceName}
            speechVolume={speechVolume}
          />

          {/* Client-Side Grounding Knowledge Base Attachment Widget */}
          <KnowledgeBaseWidget
            knowledgeFiles={knowledgeFiles}
            onAddFiles={(newFiles) => {
              setKnowledgeFiles((prev) => [...prev, ...newFiles]);
              if (currentUser) {
                newFiles.forEach((file) => saveKnowledgeDoc(currentUser.uid, file));
              }
              addLog(`[ KNOWLEDGE BASE ]: Ingested ${newFiles.length} document(s) into grounding memory.`, 'success');
            }}
            onRemoveFile={(id) => {
              setKnowledgeFiles((prev) => prev.filter((f) => f.id !== id));
              if (currentUser) {
                deleteKnowledgeDoc(currentUser.uid, id);
              }
              addLog(`[ KNOWLEDGE BASE ]: Document removed from grounding memory.`, 'info');
            }}
            onClearAll={() => {
              if (currentUser) {
                knowledgeFiles.forEach((file) => deleteKnowledgeDoc(currentUser.uid, file.id));
              }
              setKnowledgeFiles([]);
              addLog(`[ KNOWLEDGE BASE ]: Cleared all grounded document files.`, 'info');
            }}
          />
        </section>

        {/* Right / Bottom Column: Conversation Stream & Command Center */}
        <section className="lg:col-span-7 flex flex-col gap-4 w-full h-full min-h-[520px]">
          {/* Conversation Stream Thread */}
          <ConversationStream
            messages={messages}
            onSpeakText={speakText}
            isSpeakingNow={state === 'SPEAKING'}
          />

          {/* Command Bar with Microphone & Text Input */}
          <CommandBar
            state={state}
            onMicToggle={handleMicToggle}
            onSendPrompt={sendPromptToTala}
            onStopSpeech={stopSpeech}
            continuousListening={settings.continuousListening}
            onToggleContinuousListening={() =>
              setSettings((prev) => ({
                ...prev,
                continuousListening: !prev.continuousListening
              }))
            }
          />
        </section>
      </main>

      {/* Sleek Theme Footer Hardware Stats Bar */}
      <footer className="relative z-20 w-full bg-[#080d1a] border-t border-[#00f0ff]/30 px-4 sm:px-8 py-3 mt-4 grid grid-cols-1 md:grid-cols-12 gap-4 items-center font-mono text-xs">
        {/* Neural Link Auth Status */}
        <div className="md:col-span-4 flex items-center gap-3 bg-[#0a0f1d] px-3.5 py-2 rounded border border-[#00f0ff]/20">
          <div className="w-6 h-6 rounded-full border border-[#00f0ff] flex items-center justify-center bg-[#00f0ff]/10 shrink-0">
            <div className="w-2 h-2 bg-[#00f0ff] rounded-sm shadow-[0_0_8px_#00f0ff]" />
          </div>
          <div className="flex-1 overflow-hidden">
            <div className="text-[8px] uppercase text-[#00f0ff]/60 tracking-wider">Engine Authentication</div>
            <div className="text-[10px] text-[#00f0ff] font-bold truncate uppercase">
              {settings.apiProvider === 'openrouter' ? 'OPENROUTER PRIMARY' : 'GOOGLE BACKUP'}
            </div>
          </div>
        </div>

        {/* Center Tagline */}
        <div className="md:col-span-4 text-center hidden md:block">
          <div className="text-[9px] uppercase tracking-[0.4em] text-[#00f0ff]/50">
            Tactical Artificial Intelligence Assistant
          </div>
        </div>

        {/* Hardware Diagnostics Widgets */}
        <div className="md:col-span-4 flex justify-end gap-3 text-center">
          <div className="w-14 h-10 border border-[#00f0ff]/30 bg-[#0a0f1d] rounded flex flex-col items-center justify-center">
            <div className="text-[8px] text-[#00f0ff]/50 uppercase">CPU</div>
            <div className="text-xs font-bold text-[#00f0ff]">10%</div>
          </div>
          <div className="w-14 h-10 border border-[#00f0ff]/30 bg-[#0a0f1d] rounded flex flex-col items-center justify-center">
            <div className="text-[8px] text-[#00f0ff]/50 uppercase">RAM</div>
            <div className="text-xs font-bold text-[#00f0ff]">3.8G</div>
          </div>
          <div className="w-14 h-10 border border-[#ff007f]/30 bg-[#0a0f1d] rounded flex flex-col items-center justify-center">
            <div className="text-[8px] text-[#ff007f]/60 uppercase">HEAT</div>
            <div className="text-xs font-bold text-[#ff007f]">39°C</div>
          </div>
        </div>
      </footer>

      {/* Settings Drawer Modal */}
      <SettingsDrawer
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onUpdateSettings={(newPartial) => setSettings((prev) => ({ ...prev, ...newPartial }))}
        voices={voices}
        hasServerOpenRouterKey={hasServerOpenRouterKey}
        hasServerGeminiKey={hasServerGeminiKey}
        onTestVoice={handleTestVoiceDiagnostic}
      />
    </div>
  );
}
