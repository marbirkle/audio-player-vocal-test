import {
  Component,
  OnDestroy,
  signal,
  effect,
  NO_ERRORS_SCHEMA,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { NativeScriptCommonModule } from "@nativescript/angular";
import { File, knownFolders } from "@nativescript/core";
import { Http } from "@nativescript/core";
import { TNSPlayer } from "@nativescript-community/audio";

@Component({
  selector: "app-audio-player",
  standalone: true,
  imports: [CommonModule, NativeScriptCommonModule],
  templateUrl: "./audio-player.component.html",
  styleUrls: ["./audio-player.component.css"],
  schemas: [NO_ERRORS_SCHEMA],
})
export class AudioPlayerComponent implements OnDestroy {
  private player: TNSPlayer = new TNSPlayer();
  private localFilePath: string = "";

  isPlaying = signal(false);
  currentTime = signal(0);
  duration = signal(0);
  audioFileName = signal("");
  isAudioReady = signal(false);
  isLoading = signal(true);

  private rafId: number | null = null;

  constructor() {
    this.downloadAndLoadAudio();
    effect(() => {
      if (this.duration() > 0 && this.currentTime() >= this.duration()) {
        this.isPlaying.set(false);
        this.stopProgressUpdater();
      }
    });
  }

  async downloadAndLoadAudio() {
    try {
      this.isLoading.set(true);
      this.audioFileName.set("Loading audio...");
      const audioUrl =
        "https://www.learningcontainer.com/wp-content/uploads/2020/02/Kalimba.mp3";
      const temp = knownFolders.temp();
      const localFile = File.fromPath(`${temp.path}/Kalimba.mp3`);
      this.localFilePath = localFile.path;

      await Http.getFile(audioUrl, this.localFilePath);
      this.audioFileName.set(localFile.name);

      await this.initPlayer();
    } catch (error) {
      console.error("AUDIO_LOG: Error descargando o cargando audio:", error);
      this.audioFileName.set("Error: Cannot load audio.");
      this.isLoading.set(false);
    }
  }

  async initPlayer() {
    if (this.player) {
      this.player.dispose();
    }
    this.player = new TNSPlayer();

    await this.player.initFromFile({
      audioFile: this.localFilePath,
      loop: false,
      completeCallback: () => {
        this.isPlaying.set(false);
        this.stopProgressUpdater();
      },
      errorCallback: (err) => {
        console.error("AUDIO_LOG: Playback error (errorCallback):", err);
        this.isPlaying.set(false);
        this.stopProgressUpdater();
      },
    });

    // Correcting duration from milliseconds to seconds
    const durationInSeconds = this.player.duration / 1000;
    this.duration.set(durationInSeconds);

    this.isAudioReady.set(true);
    this.isLoading.set(false);
    console.log(`AUDIO_LOG: Audio loaded. Duration: ${this.duration()}s`);
  }

  togglePlay() {
    if (!this.isAudioReady()) return;
    this.isPlaying() ? this.pause() : this.play();
  }

  async play() {
    try {
      await this.player.play();
      this.isPlaying.set(true);
      this.startProgressUpdater();
    } catch (err) {
      console.error("AUDIO_LOG: Play error:", err);
    }
  }

  pause() {
    this.player.pause();
    this.isPlaying.set(false);
    this.stopProgressUpdater();
  }

  async seekToTime(seconds: number) {
    if (!this.player || seconds < 0 || seconds > this.duration()) {
      return;
    }
    // The seekTo method expects a value in seconds, so we pass the value directly
    await this.player.seekTo(seconds);
    this.currentTime.set(seconds);
  }

  private startProgressUpdater() {
    this.stopProgressUpdater();
    const update = () => {
      // Correcting currentTime from milliseconds to seconds
      const pos = this.player.currentTime / 1000;
      if (!isNaN(pos) && pos >= 0 && pos <= this.duration()) {
        this.currentTime.set(pos);
        if (this.isPlaying()) {
          this.rafId = requestAnimationFrame(update);
        }
      }
    };
    this.rafId = requestAnimationFrame(update);
  }

  private stopProgressUpdater() {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  formatTime(seconds: number): string {
    const min = Math.floor(seconds / 60);
    const sec = Math.floor(seconds % 60);
    return `${min.toString().padStart(2, "0")}:${sec
      .toString()
      .padStart(2, "0")}`;
  }

  ngOnDestroy() {
    this.stopProgressUpdater();
    this.player.dispose();
  }
}
