import {
  Component,
  OnDestroy,
  computed,
  NO_ERRORS_SCHEMA,
  Input,
  OnInit,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { NativeScriptCommonModule } from "@nativescript/angular";
import { AudioPlayerService } from "./audio-player.service";
import { getDateFormatted } from "../../core/utils/date.utils";
import { formatTime } from "../../core/utils/audio.utils";

// ahred components
import { PlaybackControlsComponent } from "../../shared/components/playback-controls/playback-controls.component";
import { ProgressDisplayComponent } from "../../shared/components/progress-display/progress-display.component";
import { ProgressBarComponent } from "../../shared/components/progress-bar/progress-bar.component";
import { Button } from "@nativescript/core";

@Component({
  selector: "app-audio-player",
  standalone: true,
  imports: [
    NativeScriptCommonModule,
    CommonModule,
    // Agrega los nuevos componentes compartidos a los imports
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
  @Input() public audioUrl: string = "";

  // Public signals from the service
  public isPlaying = this.audioService.isPlaying;
  public audioFileName = this.audioService.audioFileName;
  public isAudioReady = this.audioService.isAudioReady;
  public isLoading = this.audioService.isLoading;
  public progressValue = this.audioService.progressValue;
  public duration = this.audioService.duration;
  public currentTime = this.audioService.currentTime;
  public fileLastModifiedDate = this.audioService.fileLastModifiedDate;

  // Computed signals for formatted display
  public fileDate = computed(() => {
    const date = this.fileLastModifiedDate();
    return date ? getDateFormatted(date) : "No audio...";
  });

  public formattedCurrentTime = computed(() => formatTime(this.currentTime()));
  public formattedDuration = computed(() => formatTime(this.duration()));

  public displayedTime = computed(() => {
    if (this.isPlaying()) {
      return this.formattedCurrentTime();
    } else if (this.currentTime() > 0) {
      return this.formattedCurrentTime();
    } else {
      return this.formattedDuration();
    }
  });

  constructor(private audioService: AudioPlayerService) {}

  ngOnInit() {
    if (this.audioUrl) {
      this.audioService.loadAudio(this.audioUrl);
    }
  }

  // on play button tap event
  onPlayTap(): void {
    this.audioService.togglePlay();
  }

  ngOnDestroy() {
    this.audioService.dispose();
  }
}
