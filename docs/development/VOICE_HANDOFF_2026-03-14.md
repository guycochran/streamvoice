# Voice Handoff - March 14, 2026

## Current State

Voice now works in packaged Windows builds.

Confirmed working path:
- native Windows recorder sidecar using `NAudio`
- Electron main owns the recording lifecycle
- recorded WAV is passed to `whisper.cpp`
- transcript is routed into the desktop OBS command executor

Confirmed working behavior from packaged Windows testing:
- transcript appears in the UI
- `mute microphone` works
- `switch scene to gameplay` works
- `start stream` works
- `stop stream` works

Latest successful tested line:
- app version `1.1.0-alpha.37`
- next promoted candidate in repo: `1.1.0-beta.1`

## What Changed

Recent important commits:
- `8401e36` `Replace ffmpeg plan with NAudio recorder sidecar`
- `c43ff58` `Add stop stream and microphone voice aliases`

The major breakthrough was replacing the unstable browser capture path with a Windows native recorder sidecar.

## What Diagnostics Prove Now

In working packaged builds, diagnostics now show real values for:
- `Last Audio Path`
- `Last Audio Size`
- `Last Audio Type: audio/wav`
- `Last Whisper Duration`
- `Last Transcript`

That means the critical voice pipeline is now real end-to-end:
- capture
- WAV file creation
- Whisper transcription
- command execution

## Current Supported Voice Commands

These are the safest commands to treat as working now:
- `mute mic`
- `mute microphone`
- `unmute mic`
- `unmute microphone`
- `start stream`
- `stop stream`
- `start recording`
- `stop recording`
- `take screenshot`
- `switch to <scene>`
- `switch scene to <scene>`
- `stream starting setup`
- `stream ending setup`
- `raid mode`

## What Should Happen Next

Do not destabilize the working native voice path.

Next priorities:
1. remove obsolete browser-capture code from the active production path
2. tighten the supported voice command set and aliases
3. improve diagnostics wording and user-facing setup
4. add configurable push-to-talk hotkey
5. add optional wake-word arming mode after hotkey support

## Wake Word Requirement

Planned follow-on:
- default optional wake phrase: `Blue 42`
- should arm a short command window
- should remain optional
- should come after stable hotkey support

The target environment includes noisy gameplay and kids yelling over headsets, so wake word must be constrained and configurable.

## Blunt Recommendation

Treat the native recorder + Whisper path as the production voice architecture unless a concrete failure is discovered.
