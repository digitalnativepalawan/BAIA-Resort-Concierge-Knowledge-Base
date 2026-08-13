export interface VADConfig {
  speechThreshold?: number; // Volume threshold 0-100 to trigger speech onset (default 18)
  silenceThreshold?: number; // Volume threshold below which is silence (default 10)
  silenceDurationMs?: number; // Duration of silence to trigger speech offset (default 600ms)
  gracePeriodMs?: number; // Grace period before detecting barge-in (default 300ms)
}

export class VoiceActivityDetector {
  private audioCtx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private stream: MediaStream | null = null;
  private animFrameId: number | null = null;
  private isAnalyzing = false;
  private isSpeechActive = false;
  private lastSpeechTime = 0;
  private silenceTimer: NodeJS.Timeout | null = null;

  private onSpeechOnsetCb?: () => void;
  private onSpeechOffsetCb?: () => void;
  private onVolumeCb?: (volume: number) => void;

  private config: Required<VADConfig>;

  constructor(config?: VADConfig) {
    this.config = {
      speechThreshold: config?.speechThreshold ?? 18,
      silenceThreshold: config?.silenceThreshold ?? 10,
      silenceDurationMs: config?.silenceDurationMs ?? 600,
      gracePeriodMs: config?.gracePeriodMs ?? 300,
    };
  }

  public async start(
    stream: MediaStream,
    callbacks: {
      onSpeechOnset?: () => void;
      onSpeechOffset?: () => void;
      onVolume?: (vol: number) => void;
    }
  ): Promise<void> {
    this.stop();

    this.stream = stream;
    this.onSpeechOnsetCb = callbacks.onSpeechOnset;
    this.onSpeechOffsetCb = callbacks.onSpeechOffset;
    this.onVolumeCb = callbacks.onVolume;

    const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtxClass) return;

    try {
      this.audioCtx = new AudioCtxClass();
      const source = this.audioCtx.createMediaStreamSource(stream);
      this.analyser = this.audioCtx.createAnalyser();
      this.analyser.fftSize = 256;
      this.analyser.smoothingTimeConstant = 0.5;

      source.connect(this.analyser);
      this.isAnalyzing = true;

      const startTime = performance.now();

      const loop = () => {
        if (!this.isAnalyzing || !this.analyser) return;

        const buffer = new Uint8Array(this.analyser.frequencyBinCount);
        this.analyser.getByteFrequencyData(buffer);

        let sum = 0;
        for (let i = 0; i < buffer.length; i++) {
          sum += buffer[i];
        }
        const avgVol = sum / buffer.length;

        if (this.onVolumeCb) {
          this.onVolumeCb(Math.min(100, Math.round((avgVol / 128) * 100)));
        }

        const now = performance.now();
        const isInGracePeriod = now - startTime < this.config.gracePeriodMs;

        if (!isInGracePeriod) {
          if (avgVol > this.config.speechThreshold) {
            if (!this.isSpeechActive) {
              this.isSpeechActive = true;
              if (this.onSpeechOnsetCb) {
                this.onSpeechOnsetCb();
              }
            }
            this.lastSpeechTime = now;
            if (this.silenceTimer) {
              clearTimeout(this.silenceTimer);
              this.silenceTimer = null;
            }
          } else if (avgVol < this.config.silenceThreshold && this.isSpeechActive) {
            if (!this.silenceTimer) {
              this.silenceTimer = setTimeout(() => {
                this.isSpeechActive = false;
                this.silenceTimer = null;
                if (this.onSpeechOffsetCb) {
                  this.onSpeechOffsetCb();
                }
              }, this.config.silenceDurationMs);
            }
          }
        }

        this.animFrameId = requestAnimationFrame(loop);
      };

      loop();
    } catch (err) {
      console.warn('VAD init warning:', err);
    }
  }

  public stop(): void {
    this.isAnalyzing = false;
    this.isSpeechActive = false;

    if (this.silenceTimer) {
      clearTimeout(this.silenceTimer);
      this.silenceTimer = null;
    }
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    if (this.audioCtx) {
      this.audioCtx.close().catch(() => {});
      this.audioCtx = null;
    }
    this.analyser = null;
    this.stream = null;
  }
}
