# Voice Handoff - March 14, 2026

## Current State

Voice is still not working in packaged Windows builds.

What does work:
- OBS desktop IPC path works
- OBS scene inventory populates
- mic selection works
- VU metering works
- Whisper binary/model bundle is present and detected
- the app can show real speech diagnostics

What does not work:
- press-to-talk does not complete end-to-end reliably
- transcripts do not appear
- commands are not being executed from speech

## Latest Important Commits

- `ba165b4` `Fix audio IPC serialization in speech capture - v1.1.0-alpha.30`
- `84b3056` `Replace voice capture path in renderer`
- `117ac12` `Rollback unstable renderer voice capture`

`84b3056` was an attempted replacement of the hidden capture-window path with direct renderer capture. It caused the UI to go black on mic release and was rolled back by `117ac12`.

Current safe recovery point is:
- `117ac12`
- app version `1.1.0-alpha.32`

## What We Learned

### Confirmed Good

- OBS connection is not the blocker
- Whisper installation/runtime detection is not the blocker
- microphone selection and input monitoring are not the blocker

### Confirmed Bad

- browser/renderer capture experiments are not stable enough
- the hidden BrowserWindow capture path is fragile
- the direct visible-renderer capture replacement was worse and regressed the UI

### Strongest Diagnostic Evidence

Before the rollback, diagnostics consistently showed:
- live VU movement
- selected mic label populated correctly
- `Last Audio Size` non-zero
- `Capture Chunks` non-zero

But also:
- `Last Audio Path: none`
- `Last Whisper Duration: unknown`
- `Last Transcript: none`

That means the failure is in the capture finalization / submission path before successful Whisper transcription completes.

## Do Not Waste More Time On

- patching Web Speech API
- more hidden BrowserWindow `MediaRecorder` tweaks
- more visible-renderer `MediaRecorder` tweaks
- more IPC payload-shape experiments by themselves

The codebase has already spent too many cycles there.

## Recommended Next Step

Replace the current capture mechanism with a native/main-process audio capture path.

Target architecture:
- Electron main owns speech state
- Electron main owns audio capture
- Electron main writes the captured WAV file directly
- Electron main invokes Whisper directly on that file
- renderer only shows:
  - listening
  - transcribing
  - heard transcript
  - command result

Do not put the main app UI renderer in the critical recording path.

## Follow-On Requirement

After native push-to-talk works, add an optional wake-word mode.

Initial target:
- default wake phrase: `Blue 42`
- configurable on/off
- configurable phrase later
- use wake word to arm a short command window, not permanently open listening

Recommended order:
1. native push-to-talk works
2. configurable hotkey works
3. optional wake-word arming mode

This matters because the target environment can include loud gameplay and kids yelling over headsets. Wake word should be optional and constrained, not the primary first recovery milestone.

## Files To Read First

- [main.js](/home/guycochran/skunkworks-production-agents/streamvoice/electron-app/main.js)
- [speech-service.js](/home/guycochran/skunkworks-production-agents/streamvoice/electron-app/services/speech-service.js)
- [whisper-runner.js](/home/guycochran/skunkworks-production-agents/streamvoice/electron-app/services/whisper-runner.js)
- [speech-capture.html](/home/guycochran/skunkworks-production-agents/streamvoice/electron-app/speech-capture.html)
- [app-enhanced.js](/home/guycochran/skunkworks-production-agents/streamvoice/electron-app/web/app-enhanced.js)

## Practical Success Definition

The next LLM should consider the task complete only when all of these are true in a packaged Windows build:

- pressing the mic button does not blank the UI
- mic capture completes
- `Last Audio Path` becomes a real file path
- `Last Whisper Duration` gets a real value
- a transcript appears under `Heard:`
- a short command like `mute mic` executes in OBS

## Blunt Recommendation

Treat native/main-process capture as the primary plan, not the fallback plan.
