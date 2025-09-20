import {
  Component,
  Input,
  Output,
  EventEmitter,
  NO_ERRORS_SCHEMA,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { NativeScriptCommonModule } from "@nativescript/angular";
import { ActivityIndicator, Button } from "@nativescript/core";

@Component({
  selector: "app-playback-controls",
  standalone: true,
  imports: [NativeScriptCommonModule, CommonModule],
  templateUrl: "./playback-controls.component.html",
  styleUrls: ["./playback-controls.component.css"],
  schemas: [NO_ERRORS_SCHEMA],
})
export class PlaybackControlsComponent {
  @Input() public isLoading: boolean | null = null;
  @Input() public isPlaying: boolean | null = null;
  @Input() public isAudioReady: boolean | null = null;
  @Output() public playTap = new EventEmitter<Button>();

  public onPlayTap(button: Button): void {
    this.animateButtonPress(button);
    this.playTap.emit(button);
  }

  private animateButtonPress(button: Button): void {
    if (!button) return;

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
}
