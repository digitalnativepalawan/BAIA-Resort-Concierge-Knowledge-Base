import { soundEffects } from '../utils/soundEffects';

export class AudioPlaybackManager {
  private isMuted = false;
  private soundEnabled = true;

  public setMuted(muted: boolean): void {
    this.isMuted = muted;
  }

  public setSoundEnabled(enabled: boolean): void {
    this.soundEnabled = enabled;
    soundEffects.setEnabled(enabled);
  }

  public playStartup(): void {
    if (this.soundEnabled) soundEffects.playStartup();
  }

  public playListeningStart(): void {
    if (this.soundEnabled) soundEffects.playListeningStart();
  }

  public playListeningEnd(): void {
    if (this.soundEnabled) soundEffects.playListeningEnd();
  }

  public playProcessingBeep(): void {
    if (this.soundEnabled) soundEffects.playProcessingBeep();
  }

  public playResponseChime(): void {
    if (this.soundEnabled) soundEffects.playResponseChime();
  }

  public playErrorSound(): void {
    if (this.soundEnabled) soundEffects.playErrorSound();
  }
}
