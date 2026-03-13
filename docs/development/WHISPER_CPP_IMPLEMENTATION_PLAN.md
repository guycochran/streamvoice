# Whisper.cpp Implementation Plan

## Goal

Replace Chromium Web Speech with a desktop-native speech pipeline based on `whisper.cpp`.

## Why

- OBS control now works through Electron main and IPC.
- The remaining blocker is voice recognition.
- Packaged Electron currently fails with `speech error: network`, which makes Web Speech unreliable for production use.

## Architecture

- Electron main owns the speech subsystem.
- Renderer only controls push-to-talk UI and displays transcript / command results.
- Preload exposes a narrow speech API.
- `whisper.cpp` runs in a child process or worker process.

## Stages

### Stage 1

- Add `SpeechService` abstraction in Electron main.
- Expose IPC methods:
  - `speechGetState`
  - `speechStartPushToTalk`
  - `speechStopPushToTalk`
  - `speechOnStateChanged`
- Stop treating Web Speech as the source of truth.

### Stage 2

- Capture push-to-talk microphone audio as PCM/WAV.
- Save utterance audio to a temp file.
- Emit UI updates for:
  - recording
  - transcribing
  - error

### Stage 3

- Integrate `whisper.cpp`.
- Start with CPU inference and `base.en`.
- Return transcript into main process command execution.

### Stage 4

- Improve UX:
  - live recording indicator
  - transcript preview
  - explicit recognized command
  - explicit command result

## Acceptance Criteria

- Hold mic button records locally.
- Release mic button triggers local transcription.
- Transcript appears in UI.
- Transcript routes to desktop OBS command execution.
- No dependency on Chromium Web Speech for production voice control.
