# StreamVoice

Desktop voice control for OBS Studio.

## Current Status

StreamVoice is currently in beta stabilization.

Working in packaged Windows builds:
- native voice capture
- local Whisper transcription
- OBS command execution
- scene inventory and scene mapping
- microphone selection and VU metering
- configurable global voice hotkey
- workflow profiles for basic live control and studio-style operation

Current app version in repo:
- `1.1.0-beta.17`

For a concise engineering snapshot, start with [docs/development/CURRENT_STATE.md](docs/development/CURRENT_STATE.md).

## Architecture

Active production path:
- Electron main owns the speech lifecycle
- native Windows recorder sidecar captures `16kHz` mono WAV
- `whisper.cpp` performs local transcription
- transcript is routed into the desktop OBS command executor
- renderer is UI only

## Confirmed Working Voice Examples

- `mute microphone`
- `switch scene to gameplay`
- `start stream`
- `stop stream`

## Setup

1. Open OBS Studio.
2. Enable the OBS WebSocket server.
3. Launch StreamVoice.
4. Select your microphone in Settings if needed.
5. Use push-to-talk, latched mode, or the configured global hotkey.

## Current Priorities

- beta hardening
- command alias coverage
- deterministic scene slots and setup confirmation
- hotkey UX polish
- diagnostics cleanup
- optional wake-word mode later

## License

StreamVoice is MIT licensed. See [LICENSE](LICENSE).
