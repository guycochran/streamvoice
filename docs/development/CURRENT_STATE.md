# Current State

## Product Status

StreamVoice is now in the beta stabilization phase.

Current app version in repo:
- `1.1.0-beta.7`

Core promise now proven in packaged Windows builds:
- native voice capture works
- Whisper transcription works
- OBS command execution works

## Working Architecture

Voice path:
- Electron main owns the speech lifecycle
- native Windows recorder sidecar captures `16kHz` mono WAV
- `whisper.cpp` transcribes the WAV locally
- transcript is normalized and routed into the desktop OBS command executor

OBS path:
- Electron desktop IPC is the primary control path
- OBS scene inventory populates in the UI
- scene switching, streaming, recording, screenshots, and audio commands execute through the desktop command layer

Renderer role:
- UI only
- no browser-based speech capture in the active production path

## Confirmed Working Voice Examples

- `mute microphone`
- `switch scene to gameplay`
- `start stream`
- `stop stream`

## Working User Features

- microphone selection
- microphone VU meter
- push-to-talk
- latched voice mode
- configurable global voice hotkey
- fast command mode with `tiny.en`
- optional balanced mode with `base.en`
- gameplay voice profile
- scene mapping UI

## Current Priorities

1. beta hardening
2. command alias coverage
3. hotkey UX polish
4. diagnostics wording cleanup
5. optional wake-word mode later

## Wake Word Direction

Planned, not yet active:
- optional wake phrase
- default phrase: `Blue 42`
- intended to arm a short command window
- should come after the current voice path is fully hardened

## What To Avoid

- do not reintroduce browser `MediaRecorder` as the active voice path
- do not move OBS control back to the old localhost/browser-dependent execution path
- do not destabilize the native recorder sidecar without a concrete replacement
