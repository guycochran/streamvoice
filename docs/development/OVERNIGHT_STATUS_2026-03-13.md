# Overnight Status - March 13, 2026

## Current Product State

StreamVoice is materially improved from the original localhost-fragile desktop build.

Working now:
- Desktop IPC is the source of truth for OBS connection state.
- OBS status and command execution work from the packaged app.
- Common commands are working:
  - `start stream`
  - `end stream`
  - `emergency mute`
  - `raid mode`
  - screenshots
  - mic volume
  - desktop volume
- Whisper is bundled and detected in packaged Windows builds.
- Microphone selection now works in-app.
- Live microphone VU metering now works in the main UI.

## Current Voice Status

Recent speech milestones:
- Renderer-side mic capture that blacked out the UI has been removed.
- Hidden capture window owns microphone capture.
- Audio is now converted to WAV before running Whisper.
- Recognized phrase now has a dedicated `Heard:` line under the mic control.
- Input mode switch has been added:
  - `PTT Mode`
  - `Latched Mode`

## Latest Open Issue

The main remaining blocker is Whisper transcription reliability.

Observed behavior:
- Valid mic selection works.
- VU meter shows live audio signal.
- OBS remains connected.
- In some builds, transcription can still hang or fail instead of returning a usable transcript.

Recent mitigation:
- Whisper execution is now bounded with a timeout instead of hanging indefinitely.
- Output handling is moving toward a more deterministic file-based transcript path.

## Best Next Steps

1. Validate `1.1.0-alpha.20` on Windows.
2. Confirm the new voice input mode switch behavior:
   - PTT
   - Latched
3. Confirm the `Heard:` line updates after release.
4. If Whisper still times out or fails:
   - log the exact Whisper CLI args and stderr to the backend log
   - preserve the captured WAV path in diagnostics
   - test `tiny.en` against the same capture to compare latency

## Strong Candidate Next Features

These are now reasonable to tackle after the current speech stability pass:
- push-to-talk hotkey
- scene/source mapping UI from real OBS inventory
- startup health checks
- exportable user profile / mapping format
- better voice UX with partial transcript support

## Architectural Direction

The correct long-term path is still:
- Electron main owns truth
- renderer is UI only
- preload is the contract
- OBS and speech do not depend on localhost browser glue

That refactor direction is proving correct.
