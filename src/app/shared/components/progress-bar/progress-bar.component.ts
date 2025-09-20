import { Component, Input, NO_ERRORS_SCHEMA } from "@angular/core";
import { CommonModule } from "@angular/common";
import { NativeScriptCommonModule } from "@nativescript/angular";

@Component({
  selector: "app-progress-bar",
  standalone: true,
  imports: [NativeScriptCommonModule, CommonModule],
  templateUrl: "./progress-bar.component.html",
  styleUrls: ["./progress-bar.component.css"],
  schemas: [NO_ERRORS_SCHEMA],
})
export class ProgressBarComponent {
  @Input() public value: number | null = null;
  @Input() public maxValue: number | null = null;
}
