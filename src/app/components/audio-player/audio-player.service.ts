import { Injectable, signal, effect } from "@angular/core";
import { File, knownFolders, Http } from "@nativescript/core";
import { AudioPlayer } from "@voicethread/nativescript-audio-player";

@Injectable()
export class AudioPlayerService {
  private player: AudioPlayer | null = null;
  private localFilePath: string = "";
  private intervalId: any = null;
  private lastRoundedPos = -1;

  // Signals for the audio player state
  public isPlaying = signal(false);
  public currentTime = signal(0);
  public progressValue = signal(0);
  public duration = signal(0);
  public audioFileName = signal("");
  public isAudioReady = signal(false);
  public isLoading = signal(true);
  public fileLastModifiedDate = signal<Date | null>(null);

  constructor() {
    console.log("AUDIO_SERVICE_LOG: Service initialized.");

    effect(() => {
      if (this.duration() > 0 && this.currentTime() >= this.duration()) {
        console.log("AUDIO_SERVICE_LOG: Playback completed. Resetting state.");
        this.isPlaying.set(false);
        this.stopProgressUpdater();
      }
    });
  }

  async loadAudio(audioUrl: string) {
    try {
      this.isLoading.set(true);
      this.isAudioReady.set(false);
      this.audioFileName.set("Loading audio...");
      const fileName = audioUrl.split("/").pop() || "audio.mp3";
      const temp = knownFolders.temp();
      const localFile = File.fromPath(`${temp.path}/${fileName}`);
      this.localFilePath = localFile.path;
      console.log("AUDIO_SERVICE_LOG: Starting file download.");
      await Http.getFile(audioUrl, this.localFilePath);
      console.log(
        `AUDIO_SERVICE_LOG: File downloaded to: ${this.localFilePath}`
      );
      this.audioFileName.set(localFile.name);

      // Get the file's last modified date and update the signal
      const file = File.fromPath(this.localFilePath);
      this.fileLastModifiedDate.set(file.lastModified);

      await this.initPlayer();
    } catch (error) {
      console.error(
        "AUDIO_SERVICE_LOG: Error downloading or loading audio:",
        error
      );
      this.audioFileName.set("Error: Cannot load audio.");
      this.isLoading.set(false);
    }
  }

  async initPlayer() {
    try {
      if (this.player) {
        this.player.dispose();
      }
      this.player = new AudioPlayer();
      console.log("AUDIO_SERVICE_LOG: AudioPlayer instance created.");
      await this.player.prepareAudio({
        audioFile: this.localFilePath,
        loop: false,
        completeCallback: () => {
          console.log(
            "AUDIO_SERVICE_LOG: Playback complete callback triggered."
          );
          this.isPlaying.set(false);
          this.stopProgressUpdater();
        },
        errorCallback: (err) => {
          console.error(
            "AUDIO_SERVICE_LOG: Playback error callback triggered:",
            err
          );
          this.isPlaying.set(false);
          this.stopProgressUpdater();
        },
      });

      this.duration.set(Math.floor(this.player.duration / 1000));
      this.isAudioReady.set(true);
      this.isLoading.set(false);
      console.log(
        `AUDIO_SERVICE_LOG: Audio prepared. Duration: ${this.duration()}s`
      );
    } catch (error) {
      console.error("AUDIO_SERVICE_LOG: Error initializing player:", error);
    }
  }

  public togglePlay() {
    if (!this.isAudioReady() || !this.player) {
      console.warn("AUDIO_SERVICE_LOG: Cannot toggle play. Player not ready.");
      return;
    }

    if (this.isPlaying()) {
      this.pause();
    } else {
      this.play();
    }
  }

  public play() {
    if (!this.player) return;
    this.player.play();
    this.isPlaying.set(true);
    this.startProgressUpdater();
    console.log("AUDIO_SERVICE_LOG: Playback started.");
  }

  public pause() {
    if (!this.player) return;
    this.player.pause();
    this.isPlaying.set(false);
    this.stopProgressUpdater();
    console.log("AUDIO_SERVICE_LOG: Playback paused.");
  }

  async seekToTime(seconds: number) {
    if (!this.player || seconds < 0 || seconds > this.duration()) {
      console.warn("AUDIO_SERVICE_LOG: Invalid seek time or player not ready.");
      return;
    }
    console.log(`AUDIO_SERVICE_LOG: Seeking to ${seconds} seconds.`);
    await this.player.seekTo(seconds * 1000);
    this.currentTime.set(seconds);
    this.progressValue.set(Math.floor(seconds));
    console.log(
      `AUDIO_SERVICE_LOG: Seek completed. Current time is now ${this.currentTime()}s.`
    );
  }

  private startProgressUpdater() {
    this.stopProgressUpdater();
    console.log("AUDIO_SERVICE_LOG: Starting progress updater interval.");
    this.intervalId = setInterval(() => {
      if (!this.player) return;
      const posInMs = this.player.currentTime;
      const posInSec = posInMs / 1000;
      const roundedPos = Math.round(posInSec);

      if (!isNaN(roundedPos) && roundedPos !== this.lastRoundedPos) {
        this.currentTime.set(roundedPos);
        this.lastRoundedPos = roundedPos;
      }
      const flooredPos = Math.floor(posInSec);
      if (
        !isNaN(flooredPos) &&
        flooredPos >= 0 &&
        flooredPos <= this.duration()
      ) {
        this.progressValue.set(flooredPos);
      }
    }, 100);
  }

  private stopProgressUpdater() {
    if (this.intervalId) {
      console.log("AUDIO_SERVICE_LOG: Stopping progress updater interval.");
      clearInterval(this.intervalId);
      this.intervalId = null;
      this.lastRoundedPos = -1;
    }
  }

  public dispose() {
    this.stopProgressUpdater();
    if (this.player) {
      console.log("AUDIO_SERVICE_LOG: Disposing player.");
      this.player.dispose();
    }
  }
}
