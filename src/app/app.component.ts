import { Component, NO_ERRORS_SCHEMA } from "@angular/core";

import { AudioPlayerComponent } from "./components/audio-player/audio-player.component";
import { NativeScriptCommonModule } from "@nativescript/angular";

@Component({
  selector: "ns-app",
  templateUrl: "./app.component.html",
  imports: [NativeScriptCommonModule, AudioPlayerComponent],
  schemas: [NO_ERRORS_SCHEMA],
})
export class AppComponent {}
