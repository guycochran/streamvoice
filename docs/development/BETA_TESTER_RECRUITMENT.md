# StreamVoice Beta Tester Notes

## Current Beta Focus

StreamVoice is now in the beta stabilization phase for Windows + OBS users.

The current beta is focused on:
- voice control reliability
- scene switching
- stream start/stop
- recording start/stop
- mute/unmute
- screenshot capture
- microphone setup
- diagnostics clarity

## Current Requirements

- Windows 10 or 11
- OBS Studio with WebSocket enabled
- working microphone
- willingness to report exact failures and confusing behavior

## What Testers Should Try

### Core Voice Commands
- `mute mic`
- `unmute mic`
- `start stream`
- `stop stream`
- `start recording`
- `stop recording`
- `take screenshot`
- `switch to gameplay`
- `switch to break`

### Setup And UX
- microphone selection
- global voice hotkey
- game mode vs balanced mode
- OBS connection test
- diagnostics panel

### Real-World Naming
Ask testers to try their own scene names such as:
- `PiP`
- `Camera 1`
- `Browser`
- `Chat`
- `PowerPoint`

This feedback will help prioritize scene aliases and source toggles.

## What Feedback To Collect

1. Which commands worked reliably?
2. Which commands were misheard?
3. What scene names and overlays do they actually use?
4. Did setup feel easy or confusing?
5. Did diagnostics help them explain failures?
6. Did voice feel fast enough for real gameplay?

## Current Gaps To Watch

- noisy-home transcription misses
- scene alias coverage
- source/browser-source toggles for chat, webcam, and overlays
- replay/clip workflows
- hotkey polish

## Positioning

Do not present this beta as “full streamer automation” yet.

Present it as:
- working voice control for OBS
- fast command execution for common live tasks
- actively improving aliasing, overlays, and streamer-specific mappings
