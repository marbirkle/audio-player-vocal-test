import { Injectable, signal, effect, WritableSignal } from "@angular/core";
import { AudioPlayer } from "@voicethread/nativescript-audio-player";

/**
 * @description
 * Main service for audio playback management.
 * This service now strictly adheres to the Single Responsibility Principle (SRP),
 * focusing solely on controlling the audio player and its state.
 * It is highly testable as it does not handle file I/O or network requests.
 */
@Injectable()
export class AudioPlayerService {
  private player: AudioPlayer | null = null;
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private lastFlooredPos: number = -1;

  // Constant for the update interval, eliminating "magic numbers"
  private readonly PROGRESS_UPDATE_INTERVAL_MS: number = 100;

  // Signals for the audio player state
  public isPlaying: WritableSignal<boolean> = signal<boolean>(false);
  public currentTime: WritableSignal<number> = signal<number>(0);
  public progressValue: WritableSignal<number> = signal<number>(0);
  public duration: WritableSignal<number> = signal<number>(0);
  public audioFileName: WritableSignal<string> = signal<string>("");
  public isAudioReady: WritableSignal<boolean> = signal<boolean>(false);
  public isLoading: WritableSignal<boolean> = signal<boolean>(true);

  constructor() {
    /**
     * @description
     * Effect that fires when the player's current time
     * reaches or exceeds the duration. It is responsible for stopping
     * playback and the progress updater.
     */
    effect(() => {
      if (this.duration() > 0 && this.currentTime() >= this.duration()) {
        this.onPlaybackEnd();
      }
    });
  }

  /**
   * @description
   * Loads and prepares the audio for playback from a local file path.
   * This method assumes the file is already available locally.
   * @param localFilePath The local path of the audio file.
   */
  async loadAudio(localFilePath: string): Promise<void> {
    this.isLoading.set(true);
    this.isAudioReady.set(false);
    this.audioFileName.set("Loading audio...");

    try {
      if (this.player) {
        this.player.dispose();
      }
      this.player = new AudioPlayer();
      await this.player.prepareAudio({
        audioFile: localFilePath,
        loop: false,
        completeCallback: () => this.onPlaybackEnd(),
        errorCallback: () => this.onPlaybackEnd(),
      });
      this.duration.set(Math.floor(this.player.duration / 1000));
      this.isAudioReady.set(true);
      this.isLoading.set(false);
      this.audioFileName.set(localFilePath.split("/").pop() || "audio.mp3");
    } catch (error: unknown) {
      this.audioFileName.set("Error: Cannot load audio.");
      this.isLoading.set(false);
    }
  }

  /**
   * @description
   * Toggles the playback state (play/pause).
   * Provides a single entry point for playback control.
   */
  public togglePlay(): void {
    if (!this.isAudioReady() || !this.player) {
      return;
    }

    if (this.isPlaying()) {
      this.pause();
    } else {
      this.play();
    }
  }

  /**
   * @description
   * Starts audio playback.
   */
  public play(): void {
    if (!this.player) {
      return;
    }
    this.player.play();
    this.isPlaying.set(true);
    this.startProgressUpdater();
  }

  /**
   * @description
   * Pauses audio playback.
   */
  public pause(): void {
    if (!this.player) {
      return;
    }
    this.player.pause();
    this.isPlaying.set(false);
    this.stopProgressUpdater();
  }

  /**
   * @description
   * Starts a timer to update playback progress.
   */
  private startProgressUpdater(): void {
    this.stopProgressUpdater();
    this.intervalId = setInterval(() => {
      this.updateProgress();
    }, this.PROGRESS_UPDATE_INTERVAL_MS);
  }

  /**
   * @description
   * Private and testable method that updates the progress signals.
   * This improves testability by decoupling the update logic
   * from the `setInterval` dependency.
   */
  private updateProgress(): void {
    if (!this.player) return;
    const posInMs: number = this.player.currentTime;
    const posInSec: number = posInMs / 1000;
    const flooredPos: number = Math.floor(posInSec);
    if (!isNaN(flooredPos) && flooredPos !== this.lastFlooredPos) {
      // Follows the DRY principle: a single update for both signals
      this.currentTime.set(flooredPos);
      this.progressValue.set(flooredPos);
      this.lastFlooredPos = flooredPos;
    }
  }

  /**
   * @description
   * Stops the progress updater and resets the state.
   */
  private stopProgressUpdater(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      this.lastFlooredPos = -1;
    }
  }

  /**
   * @description
   * Centralizes the logic for playback completion and errors.
   * This complies with the DRY (Don't Repeat Yourself) principle.
   */
  private onPlaybackEnd(): void {
    this.isPlaying.set(false);
    this.stopProgressUpdater();
  }

  /**
   * @description
   * Disposes of the audio player's resources when the service is destroyed.
   * This is vital for preventing memory leaks.
   */
  public dispose(): void {
    this.stopProgressUpdater();
    if (this.player) {
      this.player.dispose();
    }
  }
}
