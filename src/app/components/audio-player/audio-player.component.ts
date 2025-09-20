import {
  Component,
  OnDestroy,
  signal,
  effect,
  NO_ERRORS_SCHEMA,
} from "@angular/core";
import { TNSPlayer } from "nativescript-audio";
import { CommonModule } from "@angular/common";
import { NativeScriptCommonModule } from "@nativescript/angular";

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

  // Signals (estado reactivo)
  isPlaying = signal(false);
  currentTime = signal(0);
  duration = signal(0);

  private intervalId: any;

  constructor() {
    this.loadAudio();

    // Revisa si el audio ha terminado
    effect(() => {
      if (this.duration() > 0 && this.currentTime() >= this.duration()) {
        this.isPlaying.set(false);
        this.stopProgressTimer();
      }
    });
  }

  async loadAudio() {
    await this.player.initFromUrl({
      audioFile:
        "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
      loop: false,
    });
    const durationStr = await this.player.getAudioTrackDuration();
    this.duration.set(parseFloat(durationStr));
  }

  togglePlay() {
    if (this.isPlaying()) {
      this.pause();
    } else {
      this.play();
    }
  }

  async play() {
    await this.player.play();
    this.isPlaying.set(true);
    this.startProgressTimer();
  }

  pause() {
    this.player.pause();
    this.isPlaying.set(false);
    this.stopProgressTimer();
  }

  private startProgressTimer() {
    this.stopProgressTimer();
    this.intervalId = setInterval(() => {
      const time = this.player.currentTime;
      this.currentTime.set(Math.floor(time));
    }, 500);
  }

  private stopProgressTimer() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  formatTime(seconds: number): string {
    const min = Math.floor(seconds / 60);
    const sec = Math.floor(seconds % 60);
    return `${min}:${sec.toString().padStart(2, "0")}`;
  }

  ngOnDestroy() {
    this.stopProgressTimer();
    this.player.dispose();
  }
}
