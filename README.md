# 🎧 Vocal Image Test Audio App

This is a **NativeScript + Angular** mobile application developed as part of a **technical test assignment**.
The app implements a simple yet functional **audio player** using **Angular Signals** for state management.

---

## ✨ Features

- 📂 **Loads a sample audio file**
- ▶️⏸ **Play / Pause button** to control playback
- ⏱ **Time tracking**: shows current time and total duration (minutes:seconds format)
- 📊 **Progress bar** that updates while the audio plays
- 📝 **Displays the audio file name**

---

## 🛠 Tech Stack

- [NativeScript](https://nativescript.org/) (cross-platform mobile framework)
- [Angular](https://angular.dev/) (with standalone components & Angular Signals)
- [@nativescript/audio](https://docs.nativescript.org/plugins/audio) (NativeScript audio plugin)

---

## 🚀 Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/marbirkle/audio-player-vocal-test.git
cd audio-player-vocal-test

npm install

Android
ns run android

IOS
ns run ios

##  How It Works


The AudioPlayerComponent loads a local MP3 file (sample.mp3).

User can press the Play button to start playback.

Button text updates dynamically (▶️ Play ↔ ⏸ Pause).

The progress bar updates every half-second to reflect current playback time.

Labels show elapsed time and total duration in mm:ss format.

When playback finishes, the button returns to the Play state.


## 👤 Author

Marcos

Built as part of a technical evaluation assignment.
```
