import { ChatMessage, TalaSettings } from '../types';
import { PersistentSession, VoiceSessionState, NetworkTelemetry } from './types';
import { SpeechToTextProvider } from './SpeechToTextProvider';
import { TextToSpeechProvider } from './TextToSpeechProvider';
import { VoiceActivityDetector } from './VoiceActivityDetector';
import { AudioPlaybackManager } from './AudioPlaybackManager';
import { TALA_PERSONA } from '../data/talaPersona';
import { openrouter } from '../lib/openrouter';
import { knowledgeService } from '../services/knowledgeService';
import { conversationService } from '../services/conversationService';
import { executeToolCall } from '../services/toolRegistry';

export class VoiceSessionManager {
  private session: PersistentSession;
  private state: VoiceSessionState = 'idle';
  private stt: SpeechToTextProvider;
  private tts: TextToSpeechProvider;
  private vad: VoiceActivityDetector;
  private audioManager: AudioPlaybackManager;

  private settings: TalaSettings;
  private inactivityTimer: NodeJS.Timeout | null = null;
  private INACTIVITY_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes sensible inactivity timeout

  private onStateChangeCb?: (state: VoiceSessionState) => void;
  private onSessionUpdateCb?: (session: PersistentSession) => void;
  private onTranscriptCb?: (text: string, isFinal: boolean) => void;
  private onTelemetryCb?: (telemetry: NetworkTelemetry) => void;
  private onErrorCb?: (error: string) => void;

  private currentStream: MediaStream | null = null;

  constructor(initialSettings: TalaSettings) {
    this.settings = initialSettings;
    this.stt = new SpeechToTextProvider();
    this.tts = new TextToSpeechProvider();
    this.vad = new VoiceActivityDetector();
    this.audioManager = new AudioPlaybackManager();

    const now = new Date().toISOString();
    this.session = {
      sessionId: `tala-session-${Date.now()}`,
      conversationId: `conv-${Date.now()}`,
      guestLabel: 'Guest',
      room: 'Villa 101',
      activeResort: 'BAIA Resort San Vicente',
      messages: [],
      pendingToolActions: [],
      sessionStartedTime: now,
      lastActivityTime: now,
      connectionState: 'idle'
    };
  }

  public updateSettings(newSettings: TalaSettings): void {
    this.settings = newSettings;
    this.audioManager.setSoundEnabled(newSettings.soundEnabled);
  }

  public getSession(): PersistentSession {
    return { ...this.session };
  }

  public getState(): VoiceSessionState {
    return this.state;
  }

  private setState(newState: VoiceSessionState) {
    this.state = newState;
    if (this.onStateChangeCb) {
      this.onStateChangeCb(newState);
    }
  }

  private updateLastActivity() {
    this.session.lastActivityTime = new Date().toISOString();
    if (this.inactivityTimer) {
      clearTimeout(this.inactivityTimer);
    }
    this.inactivityTimer = setTimeout(() => {
      this.handleInactivityTimeout();
    }, this.INACTIVITY_TIMEOUT_MS);
  }

  private handleInactivityTimeout() {
    console.log('[TALA SESSION]: Inactivity timeout reached. Transitioning session to idle.');
    this.stopListening();
    this.session.connectionState = 'idle';
    this.setState('idle');
  }

  public setCallbacks(listeners: {
    onStateChange?: (state: VoiceSessionState) => void;
    onSessionUpdate?: (session: PersistentSession) => void;
    onTranscript?: (text: string, isFinal: boolean) => void;
    onTelemetry?: (telemetry: NetworkTelemetry) => void;
    onError?: (error: string) => void;
  }) {
    this.onStateChangeCb = listeners.onStateChange;
    this.onSessionUpdateCb = listeners.onSessionUpdate;
    this.onTranscriptCb = listeners.onTranscript;
    this.onTelemetryCb = listeners.onTelemetry;
    this.onErrorCb = listeners.onError;
  }

  public async startSession(guestLabel = 'Guest', room = 'Villa 101'): Promise<void> {
    this.session.guestLabel = guestLabel;
    this.session.room = room;
    this.session.connectionState = 'active';
    this.updateLastActivity();

    this.setState('connecting');
    this.audioManager.playStartup();

    // Acquire microphone media stream
    try {
      if (typeof navigator !== 'undefined' && navigator.mediaDevices?.getUserMedia) {
        this.currentStream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          }
        });

        // Initialize VAD on the audio stream for barge-in detection
        this.vad.start(this.currentStream, {
          onSpeechOnset: () => {
            // BARGE-IN INTERRUPTION: If TALA is currently speaking when guest speaks
            if (this.tts.getIsSpeaking()) {
              console.log('[TALA BARGE-IN]: Speech onset detected. Interrupting TALA speech immediately.');
              this.tts.stop();
              this.setState('listening');
              this.audioManager.playListeningStart();
            }
          }
        });
      }
    } catch (err: any) {
      console.warn('Microphone access notice:', err);
    }

    this.setState('idle');
    if (this.onSessionUpdateCb) {
      this.onSessionUpdateCb(this.getSession());
    }
  }

  public endSession(): void {
    if (this.inactivityTimer) {
      clearTimeout(this.inactivityTimer);
      this.inactivityTimer = null;
    }
    this.tts.stop();
    this.stt.stop();
    this.vad.stop();

    if (this.currentStream) {
      this.currentStream.getTracks().forEach((t) => t.stop());
      this.currentStream = null;
    }

    this.session.connectionState = 'ended';
    this.setState('idle');
    if (this.onSessionUpdateCb) {
      this.onSessionUpdateCb(this.getSession());
    }
  }

  public startListening(): void {
    if (this.state === 'listening' && this.stt.getIsListening()) return;

    this.tts.stop();
    this.updateLastActivity();
    this.setState('listening');
    this.audioManager.playListeningStart();

    let isProcessingUtterance = false;
    let interimDebounce: NodeJS.Timeout | null = null;

    const processUtterance = (text: string) => {
      if (isProcessingUtterance) return;
      const clean = text.trim();
      if (!clean) return;
      isProcessingUtterance = true;
      if (interimDebounce) {
        clearTimeout(interimDebounce);
        interimDebounce = null;
      }
      this.handleUserUtterance(clean);
    };

    this.stt.start({
      onStart: () => {
        this.setState('listening');
      },
      onSpeechStart: () => {
        // Barge-in check
        if (this.tts.getIsSpeaking()) {
          this.tts.stop();
        }
      },
      onInterimResult: (text) => {
        if (this.onTranscriptCb) {
          this.onTranscriptCb(text, false);
        }
        if (interimDebounce) clearTimeout(interimDebounce);
        if (text.trim().length > 3) {
          interimDebounce = setTimeout(() => {
            processUtterance(text);
          }, 800);
        }
      },
      onFinalResult: (text) => {
        if (this.onTranscriptCb) {
          this.onTranscriptCb(text, true);
        }
        processUtterance(text);
      },
      onError: (err) => {
        console.warn('STT error:', err);
      },
      onEnd: () => {
        if (
          this.session.connectionState === 'active' &&
          this.settings.continuousListening &&
          !this.tts.getIsSpeaking() &&
          this.state !== 'thinking' &&
          this.state !== 'speaking'
        ) {
          // Auto-restart STT to maintain continuous listening across turns and browser timeouts
          setTimeout(() => {
            if (
              this.session.connectionState === 'active' &&
              this.settings.continuousListening &&
              !this.tts.getIsSpeaking() &&
              this.state !== 'thinking' &&
              this.state !== 'speaking'
            ) {
              this.startListening();
            }
          }, 150);
        } else if (this.state === 'listening') {
          this.setState('idle');
        }
      }
    }, { continuous: true });
  }

  public stopListening(): void {
    this.stt.stop();
    if (this.state === 'listening') {
      this.setState('idle');
      this.audioManager.playListeningEnd();
    }
  }

  public async handleUserUtterance(userText: string): Promise<void> {
    const cleanText = userText.trim();
    if (!cleanText) return;

    this.stt.stop();
    this.updateLastActivity();

    // 1. Append User Message
    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      role: 'user',
      text: cleanText,
      timestamp: new Date().toLocaleTimeString('en-US', { hour12: false })
    };

    this.session.messages.push(userMsg);
    this.session.lastUserIntent = cleanText;
    conversationService.saveChatMessage(userMsg);

    if (this.onSessionUpdateCb) {
      this.onSessionUpdateCb(this.getSession());
    }

    this.setState('thinking');
    this.audioManager.playProcessingBeep();

    try {
      // 2. Check for Agentic Tool Execution (e.g., towel, transfer, breakfast, housekeeping requests)
      const lowerText = cleanText.toLowerCase();
      let toolExecutedNotice = '';

      if (
        lowerText.includes('towel') ||
        lowerText.includes('transfer') ||
        lowerText.includes('shuttle') ||
        lowerText.includes('motorbike') ||
        lowerText.includes('scooter') ||
        lowerText.includes('breakfast') ||
        lowerText.includes('housekeeping') ||
        lowerText.includes('laundry') ||
        lowerText.includes('clean') ||
        lowerText.includes('maintenance')
      ) {
        let category = 'general';
        if (lowerText.includes('towel') || lowerText.includes('housekeeping') || lowerText.includes('laundry') || lowerText.includes('clean')) {
          category = 'housekeeping';
        } else if (lowerText.includes('transfer') || lowerText.includes('shuttle') || lowerText.includes('motorbike')) {
          category = 'transportation';
        } else if (lowerText.includes('breakfast')) {
          category = 'food';
        } else if (lowerText.includes('maintenance')) {
          category = 'maintenance';
        }

        const toolResult = await executeToolCall('create_guest_request', {
          title: cleanText,
          description: `Logged via TALA Persistent Session: "${cleanText}"`,
          category,
          guestLabel: this.session.guestLabel,
          room: this.session.room
        }, { room: this.session.room, guestLabel: this.session.guestLabel });

        if (toolResult?.success) {
          this.session.pendingToolActions.push(toolResult);
          toolExecutedNotice = `\n[INTERNAL AGENT SYSTEM NOTICE]: Successfully created guest service request #${toolResult.requestId} (${category}) for ${this.session.room}. Tell the guest warmly that you've registered the request with the resort staff team.`;
        }
      }

      // 3. Perform Grounded Knowledge Base Search (RAG)
      const knowledgeExcerpt = knowledgeService.searchKnowledge(cleanText, 3);
      const groundedSystemInstruction = TALA_PERSONA.buildGroundedSystemInstruction(
        (knowledgeExcerpt || '') + toolExecutedNotice,
        this.settings.systemInstruction
      );

      // 4. Send Chat Prompt to Agent Brain (OpenRouter / Ollama)
      const historyForApi = this.session.messages.slice(-10).map((m) => ({
        role: m.role === 'model' ? 'assistant' : 'user',
        text: m.text
      }));

      const modelResult = await openrouter.sendChatPrompt({
        openrouterApiKey: this.settings.openrouterApiKey || undefined,
        model: this.settings.selectedOpenRouterModel || 'openrouter/free',
        ollamaHost: this.settings.ollamaHost,
        prompt: cleanText,
        history: historyForApi,
        systemInstruction: groundedSystemInstruction
      });

      const responseText = modelResult.responseText || 'TALA received an empty response.';

      // 5. Append Model Response
      const talaMsg: ChatMessage = {
        id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        role: 'model',
        text: responseText,
        timestamp: new Date().toLocaleTimeString('en-US', { hour12: false })
      };

      this.session.messages.push(talaMsg);
      conversationService.saveChatMessage(talaMsg);

      if (this.onSessionUpdateCb) {
        this.onSessionUpdateCb(this.getSession());
      }

      this.audioManager.playResponseChime();

      // 6. Vocalize Response
      if (this.settings.autoSpeak) {
        this.setState('speaking');
        await this.tts.speak(responseText, {
          voiceName: this.settings.selectedVoiceName,
          pitch: this.settings.pitch,
          rate: this.settings.rate,
          onStart: () => {
            this.setState('speaking');
          },
          onEnd: () => {
            this.setState('idle');
            if (this.settings.continuousListening && this.session.connectionState === 'active') {
              setTimeout(() => {
                this.startListening();
              }, 150);
            }
          },
          onError: () => {
            this.setState('idle');
          }
        });
      } else {
        this.setState('idle');
      }
    } catch (err: any) {
      console.error('TALA Session Error:', err);
      this.setState('error');
      this.audioManager.playErrorSound();
      const errMsg = err.message || 'Error processing request.';
      if (this.onErrorCb) {
        this.onErrorCb(errMsg);
      }
    }
  }

  public stopSpeech(): void {
    this.tts.stop();
    this.setState('idle');
  }
}
