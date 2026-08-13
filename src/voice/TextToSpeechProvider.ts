import { speechEngine } from '../lib/speechEngine';
import { TTSOptions } from './types';

export class TextToSpeechProvider {
  private isSpeaking = false;
  private currentAbortController: AbortController | null = null;

  public async speak(text: string, options: TTSOptions = {}): Promise<void> {
    this.stop();

    this.isSpeaking = true;
    this.currentAbortController = new AbortController();
    const signal = this.currentAbortController.signal;

    if (options.onStart) {
      options.onStart();
    }

    try {
      await speechEngine.speakSentenceChunks(
        text,
        options.voiceName,
        options.pitch ?? 1.0,
        options.rate ?? 1.0,
        () => {
          if (!signal.aborted) {
            this.isSpeaking = false;
            if (options.onEnd) {
              options.onEnd();
            }
          }
        }
      );
    } catch (err) {
      if (!signal.aborted) {
        this.isSpeaking = false;
        if (options.onError) {
          options.onError(err);
        }
      }
    }
  }

  public stop(): void {
    if (this.currentAbortController) {
      this.currentAbortController.abort();
      this.currentAbortController = null;
    }
    this.isSpeaking = false;
    speechEngine.stopSpeech();
  }

  public getIsSpeaking(): boolean {
    return this.isSpeaking;
  }
}
