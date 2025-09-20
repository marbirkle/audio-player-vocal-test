import {
  Component,
  OnDestroy,
  signal,
  effect,
  NO_ERRORS_SCHEMA,
  computed, // Import the computed function
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { NativeScriptCommonModule } from "@nativescript/angular";
import { File, knownFolders, Http, Button } from "@nativescript/core";

import { AudioPlayer } from "@voicethread/nativescript-audio-player";

@Component({
  selector: "app-audio-player",
  standalone: true,
  imports: [NativeScriptCommonModule, CommonModule],
  templateUrl: "./audio-player.component.html",
  styleUrls: ["./audio-player.component.css"],
  schemas: [NO_ERRORS_SCHEMA],
})
export class AudioPlayerComponent implements OnDestroy {
  private player: AudioPlayer | null = null;
  private localFilePath: string = "";
  private intervalId: any = null;
  private lastRoundedPos = -1; // New variable to track the last rounded position

  // Signals for the player state
  isPlaying = signal(false);
  currentTime = signal(0);
  progressValue = signal(0);
  duration = signal(0);
  audioFileName = signal("");
  isAudioReady = signal(false);
  isLoading = signal(true);
  fileDate = signal(this.getTodayFormatted());

  displayedTime = computed(() => {
    if (this.isPlaying()) {
      return this.formattedCurrentTime();
    } else if (this.currentTime() > 0) {
      // Se detuvo: mostrar el valor alcanzado
      return this.formattedCurrentTime();
    } else {
      // Antes de reproducir: mostrar duración total
      return this.formattedDuration();
    }
  });

  // Computed signals for formatted display
  formattedCurrentTime = computed(() => this.formatTime(this.currentTime()));
  formattedDuration = computed(() => this.formatTime(this.duration()));

  constructor() {
    console.log("AUDIO_LOG: Constructor called.");
    this.downloadAndLoadAudio();

    // Effect to stop playback when audio ends
    effect(() => {
      if (this.duration() > 0 && this.currentTime() >= this.duration()) {
        console.log("AUDIO_LOG: Playback completed. Resetting state.");
        this.isPlaying.set(false);
        this.stopProgressUpdater();
      }
    });
  }

  private getTodayFormatted(): string {
    const now = new Date();

    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    const month = months[now.getMonth()];
    const day = now.getDate();
    const year = now.getFullYear();

    let hours = now.getHours();
    const minutes = now.getMinutes().toString().padStart(2, "0");
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12;
    if (hours === 0) hours = 12; // 0 AM/PM → 12
    return `${month} ${day}, ${year}, ${hours}:${minutes} ${ampm}`;
  }

  async downloadAndLoadAudio() {
    try {
      this.isLoading.set(true);
      this.audioFileName.set("Loading audio...");

      const audioUrl =
        "https://www.learningcontainer.com/wp-content/uploads/2020/02/Kalimba.mp3";
      const fileName = audioUrl.split("/").pop() || "audio.mp3";
      const temp = knownFolders.temp();
      const localFile = File.fromPath(`${temp.path}/${fileName}`);
      this.localFilePath = localFile.path;

      await Http.getFile(audioUrl, this.localFilePath);

      // Nombre del archivo
      this.audioFileName.set(localFile.name);

      // Fecha de “creación” = fecha de descarga
      this.fileDate.set(this.getTodayFormatted());

      await this.initPlayer();
    } catch (error) {
      console.error(error);
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
      console.log("AUDIO_LOG: AudioPlayer instance created.");
      await this.player.prepareAudio({
        audioFile: this.localFilePath,
        loop: false,
        completeCallback: () => {
          console.log("AUDIO_LOG: Playback complete callback triggered.");
          this.isPlaying.set(false);
          this.stopProgressUpdater();
        },
        errorCallback: (err) => {
          console.error("AUDIO_LOG: Playback error callback triggered:", err);
          this.isPlaying.set(false);
          this.stopProgressUpdater();
        },
      });

      this.duration.set(Math.floor(this.player.duration / 1000));

      this.isAudioReady.set(true);
      this.isLoading.set(false);
      console.log(`AUDIO_LOG: Audio prepared. Duration: ${this.duration()}s`);
    } catch (error) {
      console.error("AUDIO_LOG: Error initializing player:", error);
    }
  }

  togglePlay() {
    if (!this.isAudioReady() || !this.player) {
      console.warn("AUDIO_LOG: Cannot toggle play. Player not ready.");
      return;
    }

    if (this.isPlaying()) {
      this.pause();
    } else {
      this.play();
    }
  }

  play() {
    if (!this.player) return;
    this.player.play();
    this.isPlaying.set(true);
    this.startProgressUpdater();
    console.log("AUDIO_LOG: Playback started.");
  }

  pause() {
    if (!this.player) return;
    this.player.pause();
    this.isPlaying.set(false);
    this.stopProgressUpdater();
    console.log("AUDIO_LOG: Playback paused.");
  }

  async seekToTime(seconds: number) {
    if (!this.player || seconds < 0 || seconds > this.duration()) {
      console.warn("AUDIO_LOG: Invalid seek time or player not ready.");
      return;
    }
    console.log(`AUDIO_LOG: Seeking to ${seconds} seconds.`);
    await this.player.seekTo(seconds * 1000);
    this.currentTime.set(seconds);
    this.progressValue.set(Math.floor(seconds));
    console.log(
      `AUDIO_LOG: Seek completed. Current time is now ${this.currentTime()}s.`
    );
  }

  private startProgressUpdater() {
    this.stopProgressUpdater();
    console.log("AUDIO_LOG: Starting progress updater interval.");
    this.intervalId = setInterval(() => {
      if (!this.player) return;
      const posInMs = this.player.currentTime;
      const posInSec = posInMs / 1000;
      const roundedPos = Math.round(posInSec);

      // Update the current time signal only if the rounded value has changed.
      if (!isNaN(roundedPos) && roundedPos !== this.lastRoundedPos) {
        this.currentTime.set(roundedPos);
        this.lastRoundedPos = roundedPos;
        console.log(`AUDIO_LOG: Label time updated to: ${roundedPos}`);
      }

      // Update the progress bar signal (using floor).
      const flooredPos = Math.floor(posInSec);
      if (
        !isNaN(flooredPos) &&
        flooredPos >= 0 &&
        flooredPos <= this.duration()
      ) {
        this.progressValue.set(flooredPos);
        console.log(`AUDIO_LOG: Progress bar value updated to: ${flooredPos}`);
      }
    }, 100);
  }

  private stopProgressUpdater() {
    if (this.intervalId) {
      console.log("AUDIO_LOG: Stopping progress updater interval.");
      clearInterval(this.intervalId);
      this.intervalId = null;
      this.lastRoundedPos = -1;
    }
  }

  formatTime(seconds: number): string {
    const min = Math.floor(seconds / 60);
    const sec = Math.floor(seconds % 60);
    return `${min.toString().padStart(2, "0")}:${sec
      .toString()
      .padStart(2, "0")}`;
  }

  onPlayTap(button: Button) {
    this.animateButtonPress(button);
    this.togglePlay();
  }

  animateButtonPress(button: Button) {
    if (!button) return;

    // Animación: se mueve hacia abajo 4px y vuelve
    button
      .animate({
        translate: { x: 0, y: 4 },
        duration: 50,
      })
      .then(() => {
        return button.animate({
          translate: { x: 0, y: 0 },
          duration: 50,
        });
      });
  }

  ngOnDestroy() {
    this.stopProgressUpdater();
    if (this.player) {
      console.log("AUDIO_LOG: Component destroyed. Disposing player.");
      this.player.dispose();
    }
  }
}
