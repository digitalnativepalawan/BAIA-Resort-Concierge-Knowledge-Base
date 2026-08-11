import { useState, useRef, useCallback } from 'react';

export interface RealtimeSessionOptions {
  apiKey?: string;
  voice?: 'alloy' | 'ash' | 'ballad' | 'coral' | 'echo' | 'sage' | 'shimmer' | 'verse';
  instructions?: string;
  onTranscript?: (text: string, isFinal: boolean) => void;
  onResponseAudioDelta?: (delta: ArrayBuffer) => void;
  onToolCall?: (name: string, args: any) => Promise<any>;
  onError?: (error: Error) => void;
}

export type RealtimeConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

export function useRealtimeVoiceSession(options: RealtimeSessionOptions = {}) {
  const [status, setStatus] = useState<RealtimeConnectionStatus>('disconnected');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const dataChannelRef = useRef<RTCDataChannel | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const audioElRef = useRef<HTMLAudioElement | null>(null);

  const connect = useCallback(
    async (ephemeralToken?: string) => {
      try {
        setStatus('connecting');
        setError(null);

        // 1. Initialize Peer Connection
        const pc = new RTCPeerConnection();
        pcRef.current = pc;

        // 2. Set up remote audio playback
        if (!audioElRef.current) {
          const audio = document.createElement('audio');
          audio.autoplay = true;
          audioElRef.current = audio;
        }

        pc.ontrack = (event) => {
          if (audioElRef.current && event.streams[0]) {
            audioElRef.current.srcObject = event.streams[0];
            setIsSpeaking(true);
          }
        };

        // 3. Acquire local microphone stream
        const localStream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });
        localStreamRef.current = localStream;
        localStream.getTracks().forEach((track) => pc.addTrack(track, localStream));
        setIsListening(true);

        // 4. Create Data Channel for Realtime Events
        const dc = pc.createDataChannel('oai-events');
        dataChannelRef.current = dc;

        dc.onopen = () => {
          setStatus('connected');
          // Configure session settings on open
          dc.send(
            JSON.stringify({
              type: 'session.update',
              session: {
                modalities: ['text', 'audio'],
                instructions: options.instructions || 'You are an attentive AI assistant.',
                voice: options.voice || 'alloy',
                input_audio_transcription: {
                  model: 'whisper-1',
                },
              },
            })
          );
        };

        dc.onmessage = async (event) => {
          try {
            const realtimeEvent = JSON.parse(event.data);

            switch (realtimeEvent.type) {
              case 'response.audio.delta':
                setIsSpeaking(true);
                break;
              case 'response.audio.done':
                setIsSpeaking(false);
                break;
              case 'conversation.item.input_audio_transcription.completed':
                if (options.onTranscript && realtimeEvent.transcript) {
                  options.onTranscript(realtimeEvent.transcript, true);
                }
                break;
              case 'response.function_call_arguments.done':
                if (options.onToolCall) {
                  const args = JSON.parse(realtimeEvent.arguments || '{}');
                  const result = await options.onToolCall(realtimeEvent.name, args);
                  dc.send(
                    JSON.stringify({
                      type: 'conversation.item.create',
                      item: {
                        type: 'function_call_output',
                        call_id: realtimeEvent.call_id,
                        output: JSON.stringify(result),
                      },
                    })
                  );
                }
                break;
              default:
                break;
            }
          } catch (err) {
            console.error('Error parsing WebRTC data channel event:', err);
          }
        };

        dc.onerror = (errEvent) => {
          const err = new Error(`DataChannel error: ${JSON.stringify(errEvent)}`);
          setError(err.message);
          if (options.onError) options.onError(err);
        };

        // 5. WebRTC Offer Creation & Handshake
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        const token = ephemeralToken || options.apiKey;
        if (token) {
          const baseUrl = 'https://api.openai.com/v1/realtime';
          const model = 'gpt-4o-realtime-preview-2024-12-17';
          const sdpResponse = await fetch(`${baseUrl}?model=${model}`, {
            method: 'POST',
            body: offer.sdp,
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/sdp',
            },
          });

          if (!sdpResponse.ok) {
            throw new Error(`Realtime SDP offer failed: ${sdpResponse.statusText}`);
          }

          const answerSdp = await sdpResponse.text();
          await pc.setRemoteDescription({
            type: 'answer',
            sdp: answerSdp,
          });
        }
      } catch (err: any) {
        setStatus('error');
        setError(err.message || 'WebRTC connection failed');
        if (options.onError) options.onError(err);
      }
    },
    [options]
  );

  const disconnect = useCallback(() => {
    if (dataChannelRef.current) {
      dataChannelRef.current.close();
      dataChannelRef.current = null;
    }

    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }

    if (audioElRef.current) {
      audioElRef.current.srcObject = null;
    }

    setStatus('disconnected');
    setIsSpeaking(false);
    setIsListening(false);
  }, []);

  const sendTextMessage = useCallback((text: string) => {
    if (dataChannelRef.current && dataChannelRef.current.readyState === 'open') {
      dataChannelRef.current.send(
        JSON.stringify({
          type: 'conversation.item.create',
          item: {
            type: 'message',
            role: 'user',
            content: [{ type: 'input_text', text }],
          },
        })
      );
      dataChannelRef.current.send(JSON.stringify({ type: 'response.create' }));
    }
  }, []);

  return {
    status,
    isSpeaking,
    isListening,
    error,
    connect,
    disconnect,
    sendTextMessage,
  };
}
