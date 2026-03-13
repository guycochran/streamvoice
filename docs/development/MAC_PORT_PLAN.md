# Mac Port Plan

## Goal

Add a macOS build without changing the working StreamVoice architecture.

The Windows voice path is now correct:
- Electron main owns the speech lifecycle
- native sidecar records `16kHz` mono WAV
- `whisper.cpp` transcribes locally
- transcript routes into the desktop OBS command executor

The macOS port should preserve that same contract.

## What Ports Cleanly

- Electron UI
- OBS desktop IPC/control path
- scene mapping
- command normalization and aliases
- diagnostics UI
- Whisper invocation
- settings persistence

## What Must Change

Windows capture depends on:
- `StreamVoiceRecorder.exe`
- `.NET` + `NAudio`

macOS needs a separate native recorder sidecar.

Recommended implementation:
- small Swift CLI
- use `AVFoundation`
- write `16kHz` mono WAV directly to disk
- accept the same lifecycle contract as Windows:
  - start recorder process
  - recorder prints `READY`
  - app sends `STOP` on stdin
  - recorder exits after flushing WAV cleanly

## Proposed File Layout

```text
electron-app/
├── native-recorder/
│   ├── StreamVoiceRecorder.csproj
│   └── Program.cs
├── native-recorder-mac/
│   ├── Package.swift
│   └── Sources/
│       └── StreamVoiceRecorderMac/
│           └── main.swift
└── services/
    └── native-speech-capture-service.js
```

## Recorder Contract

Both sidecars should support:

- `--output <path>`
- optional device selection
  - Windows: `--device-id`, `--device-label`
  - macOS: same flags if practical
- stdout:
  - print `READY` when capture is armed
- stdin:
  - `STOP` ends recording and finalizes the WAV

Required output:
- PCM WAV
- mono
- `16000 Hz`
- stable file write before process exit

## Existing Cross-Platform Seam

The active abstraction is:
- [native-speech-capture-service.js](/home/guycochran/skunkworks-production-agents/streamvoice/electron-app/services/native-speech-capture-service.js)

It now resolves recorder adapters by platform:
- Windows recorder path
- macOS recorder path

That means the next step is to add the macOS sidecar binary, not redesign speech flow.

## Packaging Plan

### Windows
- continue bundling `vendor/native-recorder/StreamVoiceRecorder.exe`

### macOS
- bundle `vendor/native-recorder/StreamVoiceRecorderMac`
- include it as an extra resource in the Electron build
- ensure executable permissions survive packaging

## macOS Risks

- microphone permission prompts
- device enumeration differences
- code signing and notarization
- global shortcut behavior validation
- app sandbox restrictions if distribution model changes later

## Recommended Delivery Sequence

1. Build the Swift recorder sidecar.
2. Validate raw WAV output independently.
3. Bundle the macOS recorder into the Electron app.
4. Verify push-to-talk end-to-end on macOS.
5. Verify hotkey path.
6. Verify OBS scene switching / streaming commands.

## Definition Of Success

A packaged macOS build should:
- start voice capture
- produce a real WAV on disk
- run `whisper.cpp`
- show transcript in the UI
- execute `mute mic`, `start stream`, and `switch to <scene>` successfully

## What Not To Do

- do not move speech capture back into browser APIs
- do not add a second command execution path
- do not fork the UI for macOS unnecessarily
