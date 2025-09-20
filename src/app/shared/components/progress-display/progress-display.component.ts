import { Component, Input, NO_ERRORS_SCHEMA } from "@angular/core";
import { CommonModule } from "@angular/common";
import { NativeScriptCommonModule } from "@nativescript/angular";

@Component({
  selector: "app-progress-display",
  standalone: true,
  imports: [NativeScriptCommonModule, CommonModule],
  templateUrl: "./progress-display.component.html",
  styleUrls: ["./progress-display.component.css"],
  schemas: [NO_ERRORS_SCHEMA],
})
export class ProgressDisplayComponent {
  @Input() public fileDate: string | null = null;
  @Input() public displayedTime: string | null = null;
}
