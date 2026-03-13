# Voice Handoff - March 13, 2026

## Summary

The StreamVoice desktop app is no longer blocked on OBS connectivity.

What works:
- OBS connection in packaged Windows builds
- desktop IPC command execution
- scene inventory now populates in the UI
- scene mapping groundwork exists
- microphone selection works
- microphone VU meter works
- speech mode toggle exists:
  - `PTT`
  - `Latched`

The remaining blocker is voice transcription.

## Current Symptoms

User can:
- select the correct mic
- see the VU meter bounce live
- see OBS connected

But when pressing the mic button:
- UI gets stuck on `Transcribing...`
- `Heard:` never shows a recognized phrase
- no command executes

## Most Important Diagnostic Finding

On `1.1.0-alpha.27` and `1.1.0-alpha.28`, the diagnostics showed:

- `Last Audio Size` had non-zero bytes
- `Capture Chunks` had non-zero chunks
- `Last Audio Path` stayed `none`
- `Last Whisper Duration` stayed `unknown`
- `Last Whisper StdErr` stayed `none`
- `Capture Phase` stayed at `starting`

This strongly suggests:
- audio capture starts
- MediaRecorder collects chunks
- but the final stop/submit path never completes
- Whisper is likely not the first failing step

## Latest Code State

Latest pushed commit when this handoff was written:
- `9689d29` `Add direct fallback control for speech capture window`

Latest build to test:
- `1.1.0-alpha.29`
- `Build Electron App`:
  - https://github.com/guycochran/streamvoice/actions/runs/23059011443
- `Build Windows Installer`:
  - https://github.com/guycochran/streamvoice/actions/runs/23059011492

## What Has Already Been Tried

These paths have already been explored:

1. Browser speech
- failed with generic network-style speech errors

2. Hidden capture window + MediaRecorder
- fixed UI blackout
- enabled real mic selection and VU meter
- still fails on final submit

3. WAV conversion before Whisper
- implemented
- did not fix the main issue because submit path still appears not to complete

4. Partial Whisper preview transcription
- implemented in alpha form
- no useful preview transcript seen in Windows testing

5. Whisper timeout / output hardening
- implemented
- but current telemetry indicates Whisper may not even be reached in the failing path

6. Main-process direct fallback calls into the hidden capture page
- added in `alpha.29`
- intended to bypass unreliable one-way IPC start/stop control

## Files Most Relevant To The Voice Failure

- [main.js](/home/guycochran/skunkworks-production-agents/streamvoice/electron-app/main.js)
- [speech-capture.html](/home/guycochran/skunkworks-production-agents/streamvoice/electron-app/speech-capture.html)
- [speech-capture-preload.js](/home/guycochran/skunkworks-production-agents/streamvoice/electron-app/speech-capture-preload.js)
- [speech-service.js](/home/guycochran/skunkworks-production-agents/streamvoice/electron-app/services/speech-service.js)
- [whisper-runner.js](/home/guycochran/skunkworks-production-agents/streamvoice/electron-app/services/whisper-runner.js)
- [app-enhanced.js](/home/guycochran/skunkworks-production-agents/streamvoice/electron-app/web/app-enhanced.js)

## Exact Findings Worth Preserving

### Good
- scene inventory now populates
- scenes were previously broken because desktop status was not copying `scenes` and `currentScene` into the UI state
- that specific bug is fixed

### Bad
- voice still does not complete the end-to-end path
- diagnostics prove the problem is not:
  - OBS connection
  - mic permissions
  - mic selection
  - basic chunk capture

## My Best Read Of The Root Cause

The likely root cause is still in the capture finalization path, not the OBS path and not necessarily Whisper itself.

Specifically:
- `MediaRecorder` appears to start
- `ondataavailable` fires enough to accumulate chunks
- but `stopCapture()` is not reliably progressing all the way through finalization and submit on Windows packaged builds

Even after fallback stop wiring, if `alpha.29` still shows:
- chunks > 0
- no `Last Audio Path`
- no `Last Whisper Duration`

then the next LLM should stop patching this hidden BrowserWindow media stack and replace it.

## Recommendation To The Next LLM

If `alpha.29` still fails, do not continue minor patching around the same architecture.

Do one of these:

### Best option
- replace the hidden BrowserWindow `MediaRecorder` capture path entirely
- move capture to a different desktop strategy

Good candidate directions:
- native/main-process capture
- ffmpeg-based local capture
- a dedicated audio capture helper process

### If staying on current stack for one last attempt
- instrument every branch in `stopCapture()` visibly in diagnostics:
  - `stop_requested`
  - `stop_event`
  - `stop_timeout`
  - `no_chunks`
  - `final_submit_ready`
  - `final_submit_sent`
  - `final_submit_error`
- verify whether those lifecycle states actually change in the packaged Windows app

But my recommendation is to avoid another long loop on the same approach if `alpha.29` still fails.

## Practical Investor / Demo Advice

If the goal is to show something credible quickly:
- keep the product voice-first in branding and UI
- but demo constrained voice only
- do not promise open-ended noisy-room speech yet

If the capture path still fails after `alpha.29`, consider a narrow demo mode:
- small whitelisted command set
- shorter phrases only
- or temporarily route recognized text through a different capture/transcription implementation

## What To Ask The User For Next

If testing continues, ask for exactly this from the next build:

- version number shown in the footer
- `Capture Phase`
- `Capture Chunks`
- `Last Audio Size`
- `Last Audio Path`
- `Last Whisper Duration`
- `Last Whisper StdErr`
- whether `Heard:` ever changes from `processing your phrase`

That is the minimum high-signal dataset.
