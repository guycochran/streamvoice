# Beta 1 Handoff

## Candidate

- version: `1.1.0-beta.1`

## Why This Matters

This is the first build line that should be treated as a beta candidate rather than a voice architecture experiment.

The core promise is now proven:
- speak command
- see transcript
- execute action in OBS

## Confirmed Working Voice Examples

- `switch scene to gameplay`
- `start stream`
- `stop stream`
- `mute microphone`

## What To Validate Next

1. common voice command coverage
2. diagnostics wording
3. setup UX for microphone and OBS
4. command aliases for natural spoken phrases
5. stability of repeated voice use over a longer session

## What Not To Do

- do not reintroduce browser `MediaRecorder` as the active speech path
- do not destabilize the native recorder sidecar
- do not switch Whisper stacks unless a concrete blocker appears

## Follow-On Features

- configurable push-to-talk hotkey
- optional wake-word arming mode
- default wake phrase: `Blue 42`
