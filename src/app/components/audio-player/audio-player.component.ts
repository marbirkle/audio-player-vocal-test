import {
  Component,
  OnDestroy,
  computed,
  NO_ERRORS_SCHEMA,
  Input,
  OnInit,
  inject,
  Signal,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { NativeScriptCommonModule } from "@nativescript/angular";
// Services
import { AudioPlayerService } from "@components/audio-player/audio-player.service";
import { FileHandlerService } from "@services/file-handler/file-handler.service";
// Utils
import { getDateFormatted } from "@utils/date.utils";
import { formatTime } from "@utils/audio.utils";
// Shared components
import { PlaybackControlsComponent } from "@shared-components/playback-controls/playback-controls.component";
import { ProgressDisplayComponent } from "@shared-components/progress-display/progress-display.component";
import { ProgressBarComponent } from "@shared-components/progress-bar/progress-bar.component";

/**
 * @description
 * Main component for the audio player. It acts as the orchestrator,
 * using both the FileHandlerService and AudioPlayerService to
 * manage the entire audio playback lifecycle from file download to
 * UI state management.
 */
@Component({
  selector: "app-audio-player",
  standalone: true,
  imports: [
    NativeScriptCommonModule,
    CommonModule,
    PlaybackControlsComponent,
    ProgressDisplayComponent,
    ProgressBarComponent,
  ],
  templateUrl: "./audio-player.component.html",
  styleUrls: ["./audio-player.component.css"],
  schemas: [NO_ERRORS_SCHEMA],
  providers: [AudioPlayerService],
})
export class AudioPlayerComponent implements OnInit, OnDestroy {
  /**
   * @description The URL of the audio file to be played. This is an input property.
   */
  @Input() public audioUrl: string = "";

  // Private service instances, explicitly typed and injected.
  private audioPlayerService: AudioPlayerService = inject(AudioPlayerService);
  private fileHandlerService: FileHandlerService = inject(FileHandlerService);

  // Public signals from the service, accessed via the private service instance.
  // These are explicitly typed to ensure code clarity and maintainability.
  public isPlaying: Signal<boolean> = this.audioPlayerService.isPlaying;
  public audioFileName: Signal<string> = this.audioPlayerService.audioFileName;
  public isAudioReady: Signal<boolean> = this.audioPlayerService.isAudioReady;
  public isLoading: Signal<boolean> = this.audioPlayerService.isLoading;
  public progressValue: Signal<number> = this.audioPlayerService.progressValue;
  public duration: Signal<number> = this.audioPlayerService.duration;
  public currentTime: Signal<number> = this.audioPlayerService.currentTime;

  /**
   * @description A computed signal that formats the last modified date of the audio file.
   * This logic is encapsulated here to keep the template clean.
   * @returns The formatted date string or a default message.
   */
  public fileDate: Signal<string> = computed(() => {
    const date: Date | null = this.fileHandlerService.fileLastModifiedDate();
    return date ? getDateFormatted(date) : "No audio...";
  });

  /**
   * @description A computed signal that formats the current playback time into a `mm:ss` string.
   * @returns The formatted time string.
   */
  public formattedCurrentTime: Signal<string> = computed(() =>
    formatTime(this.currentTime())
  );

  /**
   * @description A computed signal that formats the total audio duration into a `mm:ss` string.
   * @returns The formatted duration string.
   */
  public formattedDuration: Signal<string> = computed(() =>
    formatTime(this.duration())
  );

  /**
   * @description A computed signal that determines which time to display based on player state.
   * It shows current time during playback or the total duration when paused or stopped.
   * @returns The formatted time string to display.
   */
  public displayedTime: Signal<string> = computed(() => {
    const isPlaying: boolean = this.isPlaying();
    const currentTime: number = this.currentTime();
    if (isPlaying) {
      return this.formattedCurrentTime();
    } else if (currentTime > 0) {
      return this.formattedCurrentTime();
    } else {
      return this.formattedDuration();
    }
  });

  /**
   * @description Lifecycle hook called after component initialization.
   * It initiates the audio file loading process if a URL is provided.
   */
  ngOnInit() {
    if (this.audioUrl) {
      this.loadAudioFile();
    }
  }

  /**
   * @description Event handler for the play/pause button tap.
   * It delegates the control to the AudioPlayerService.
   */
  onPlayTap(): void {
    this.audioPlayerService.togglePlay();
  }

  /**
   * @description Asynchronous method to load the audio file.
   * It uses the FileHandlerService to get the local file path and then
   * uses the AudioPlayerService to load and prepare the audio.
   */
  private async loadAudioFile(): Promise<void> {
    try {
      const localFilePath: string =
        await this.fileHandlerService.getLocalFilePath(this.audioUrl);
      this.audioPlayerService.loadAudio(localFilePath);
    } catch (error) {
      console.error("COMPONENT_LOG: Failed to load audio file:", error);
      this.audioPlayerService.audioFileName.set("Error: Cannot load audio.");
      this.audioPlayerService.isLoading.set(false);
    }
  }

  /**
   * @description Lifecycle hook called when the component is destroyed.
   * It disposes of the audio player to release resources and prevent memory leaks.
   */
  ngOnDestroy() {
    this.audioPlayerService.dispose();
  }
}
