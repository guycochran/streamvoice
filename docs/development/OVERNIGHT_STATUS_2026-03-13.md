# Status Update - March 13, 2026

## Current Product State

StreamVoice has crossed the main technical threshold:
- packaged Windows voice control is working
- OBS command execution through desktop IPC is working
- native speech capture is working

Latest promoted candidate in repo:
- `1.1.0-beta.1`

Latest proven working voice line from packaged Windows testing:
- `1.1.0-alpha.37`

## Confirmed Working

- OBS desktop IPC connection
- scene inventory population
- in-app microphone selection
- microphone VU metering
- native WAV capture
- Whisper transcription
- transcript display in UI
- command execution in OBS

Confirmed successful voice examples:
- `switch scene to gameplay`
- `start stream`
- `stop stream`
- `mute microphone`

## Current Architecture

Production voice direction:
- Electron main owns the critical speech path
- native Windows recorder sidecar captures mic audio
- `whisper.cpp` transcribes the recorded WAV
- renderer is UI, not the active recording engine

This is the architecture to protect going forward.

## Current Risks

The main risk is no longer “can voice work?”

The main risks now are:
- command coverage / alias completeness
- cleanup of obsolete browser-capture code
- making setup and diagnostics clearer for non-technical users

## Recommended Next Steps

1. keep the working native voice path stable
2. remove obsolete browser-capture code from the active path
3. expand and polish the supported spoken command set
4. add configurable push-to-talk hotkey
5. add optional wake-word arming mode later

## Wake Word Direction

Planned optional feature:
- default phrase `Blue 42`
- wake word arms a short command window
- wake word remains optional
- implement after hotkey support

## Release Direction

This should now be treated as a beta stabilization phase, not an experimental alpha phase.
