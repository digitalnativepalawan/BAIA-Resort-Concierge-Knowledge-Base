import { STTCallbacks } from './types';

export class SpeechToTextProvider {
  private recognition: any = null;
  private isListening = false;
  private callbacks: STTCallbacks = {};

  public isSupported(): boolean {
    if (typeof window === 'undefined') return false;
    return Boolean((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);
  }

  public start(callbacks: STTCallbacks, options?: { continuous?: boolean; lang?: string }): boolean {
    if (!this.isSupported()) {
      if (callbacks.onError) {
        callbacks.onError('Speech recognition is not supported in this browser.');
      }
      return false;
    }

    this.stop();
    this.callbacks = callbacks;

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    try {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = options?.continuous ?? false;
      this.recognition.interimResults = true;
      this.recognition.lang = options?.lang || 'en-US';

      this.recognition.onstart = () => {
        this.isListening = true;
        if (this.callbacks.onStart) {
          this.callbacks.onStart();
        }
      };

      this.recognition.onspeechstart = () => {
        if (this.callbacks.onSpeechStart) {
          this.callbacks.onSpeechStart();
        }
      };

      this.recognition.onresult = (event: any) => {
        let interim = '';
        let finalScript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalScript += event.results[i][0].transcript;
          } else {
            interim += event.results[i][0].transcript;
          }
        }

        if (interim && this.callbacks.onInterimResult) {
          this.callbacks.onInterimResult(interim);
        }

        if (finalScript && this.callbacks.onFinalResult) {
          this.callbacks.onFinalResult(finalScript);
        }
      };

      this.recognition.onerror = (event: any) => {
        if (event.error !== 'no-speech' && this.callbacks.onError) {
          this.callbacks.onError(event.error);
        }
      };

      this.recognition.onend = () => {
        this.isListening = false;
        if (this.callbacks.onEnd) {
          this.callbacks.onEnd();
        }
      };

      this.recognition.start();
      return true;
    } catch (err: any) {
      this.isListening = false;
      if (this.callbacks.onError) {
        this.callbacks.onError(err.message || 'Failed to start speech recognition.');
      }
      return false;
    }
  }

  public stop(): void {
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch (e) {}
      this.recognition = null;
    }
    this.isListening = false;
  }

  public getIsListening(): boolean {
    return this.isListening;
  }
}
