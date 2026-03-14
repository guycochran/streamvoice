# Current State

## Product Status

StreamVoice is now in the beta stabilization phase.

Current app version in repo:
- `1.1.0-beta.15`

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
- experimental Whisper runtime adapter with safe CLI fallback
- workflow profiles:
  - `Basic Live Control`
  - `Studio Workflow`
- scene mapping UI
- expanded natural command coverage for scene switching and audio actions

## Current Priorities

1. beta hardening
2. command alias coverage
3. deterministic scene slot mapping and setup confirmation
4. hotkey UX polish
5. diagnostics wording cleanup
6. beta tester readiness
7. macOS recorder sidecar
8. optional wake-word mode later

Related design note:
- see `VOICE_PRIOR_ART_NOTES.md` for reusable ideas from local vMix voice projects
- see `WHISPER_NODE_ADDON_SPIKE.md` for the current runtime-upgrade evaluation path

## Beta Tester Readiness

Before widening beta access, the app should feel solid in these areas:
- short voice commands under normal home noise
- stable command feedback for start/stop stream, mute/unmute, scene switch, screenshot
- clearer diagnostics with fewer placeholder states
- reliable microphone selection and hotkey setup
- confirmed scene slot mappings for scenes like `PiP`, `Camera 1`, `Browser`, `Chat`, and `PowerPoint`
- no trust-breaking camera-number drift between mapped scenes

Current recommendation:
- invite a small closed beta now
- keep it guided and feedback-heavy
- prioritize testers who can report on:
  - noisy-home voice use
  - multi-camera switching
  - setup clarity
  - operator trust

## Next Trust Layer

The next major reliability step is replacing long-term fuzzy scene guessing with:
- explicit scene slots
- guided setup confirmation
- user-editable slot aliases
- stricter confidence rules for numbered and high-risk scene commands

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
