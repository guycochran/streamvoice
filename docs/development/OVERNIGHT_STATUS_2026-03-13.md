# Overnight Status - March 13, 2026

## Current Product State

StreamVoice is materially improved from the original localhost-fragile desktop build.

Latest tested development line:
- current mainline target is `1.1.0-alpha.22`
- latest commit is `13c7db5`

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
- Voice input mode switch exists:
  - `PTT Mode`
  - `Latched Mode`
- OBS scene inventory is now exposed into the desktop UI.
- Scene mapping settings groundwork is now present for:
  - `starting`
  - `ending`
  - `brb`
  - `raid`
  - `gameplay`

## Current Voice Status

Recent speech milestones:
- Renderer-side mic capture that blacked out the UI has been removed.
- Hidden capture window owns microphone capture.
- Audio is now converted to WAV before running Whisper.
- Recognized phrase now has a dedicated `Heard:` line under the mic control.
- Input mode switch has been added:
  - `PTT Mode`
  - `Latched Mode`
- Partial Whisper preview transcription has been added in alpha form:
  - rolling preview snapshots are transcribed while recording
  - partial text should appear in the `Heard:` line before release
  - final transcription still executes on stop/release

## Latest Open Issue

The main remaining blocker is Whisper transcription reliability.

Observed behavior:
- Valid mic selection works.
- VU meter shows live audio signal.
- OBS remains connected.
- In some builds, transcription can still hang, time out, or fail instead of returning a usable transcript.
- Partial preview transcription has been implemented, but still needs packaged Windows validation.

Recent mitigation:
- Whisper execution is now bounded with a timeout instead of hanging indefinitely.
- Output handling is moving toward a more deterministic file-based transcript path.
- Preview transcription now uses shorter rolling Whisper runs during active capture.

## Best Next Steps

1. Validate `1.1.0-alpha.22` on Windows.
2. Confirm the new voice input mode switch behavior:
   - PTT
   - Latched
3. Confirm the `Heard:` line updates during active recording, not only after release.
4. Confirm scene inventory is visible in the UI:
   - current scene
   - available scenes count
   - scene mapping dropdowns
5. If Whisper still times out or fails:
   - log the exact Whisper CLI args and stderr to the backend log
   - preserve the captured WAV path in diagnostics
   - test `tiny.en` against the same capture to compare latency
   - consider limiting preview inference to latched mode first if CPU churn is too high

## Strong Candidate Next Features

These are now reasonable to tackle after the current speech stability pass:
- push-to-talk hotkey
- scene/source mapping UI from real OBS inventory
- startup health checks
- exportable user profile / mapping format
- better voice UX with lower-latency partial transcript support
- scene/source/action profile import/export

## Architectural Direction

The correct long-term path is still:
- Electron main owns truth
- renderer is UI only
- preload is the contract
- OBS and speech do not depend on localhost browser glue

That refactor direction is proving correct.

## Morning Test Checklist

When resuming, test this exact sequence on the latest installer:

1. Confirm version shows `1.1.0-alpha.22`.
2. Verify OBS is connected.
3. Verify current scene and available scenes are populated.
4. Open `Settings`:
   - confirm the correct mic is selected
   - confirm scene mapping dropdowns populate from OBS
5. Switch to `Latched Mode`.
6. Click mic once, speak a phrase longer than 1-2 seconds, and watch:
   - VU meter movement
   - `Heard:` partial updates while still recording
7. Click mic again to stop and confirm:
   - final transcript appears
   - command executes or returns an explicit error
