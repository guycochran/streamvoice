# Whisper Node Addon Spike

## Purpose

Evaluate whether `@kutalia/whisper-node-addon` should replace or augment the current `whisper.cpp` CLI execution path in StreamVoice.

This is a focused technical spike, not a commitment to migrate.

## Why This Spike Exists

Current StreamVoice speech architecture is working, but the Whisper runtime layer is still a CLI wrapper:
- native recorder sidecar captures WAV
- Electron main shells out to `whisper-cli`
- transcript is read back from the process output/text file

That works, but it leaves possible gains on the table in:
- latency
- buffer/control granularity
- VAD/endpointing
- streaming partial support
- packaging ergonomics

## Current Reference Point

Current active runtime:
- [whisper-runner.js](/home/guycochran/skunkworks-production-agents/streamvoice/electron-app/services/whisper-runner.js)

Current strengths:
- bundled locally
- offline
- stable enough to use in beta
- known Windows packaging path

Current concerns:
- process spawn overhead
- text-file output handoff
- weaker control over chunk/PCM-oriented future features
- harder path toward richer partials/VAD

## Primary Candidates

### Candidate A

- `@kutalia/whisper-node-addon`
- GitHub: <https://github.com/Kutalia/whisper-node-addon>
- npm: <https://www.npmjs.com/package/@kutalia/whisper-node-addon>

Why it is interesting:
- Electron-oriented positioning
- PCM/chunk support
- VAD support
- prebuilt binaries

### Candidate B

- `@fugood/whisper.node`
- GitHub: <https://github.com/mybigday/whisper.node>
- npm: <https://www.npmjs.com/package/@fugood/whisper.node>

Why it is interesting:
- direct file and raw data transcription APIs
- explicit context lifecycle
- VAD support
- multiple runtime variants
- appears more explicit about supported platforms and invocation model

## What Makes These Candidates Interesting

Potential benefits:
- tighter Node/Electron integration
- direct PCM/chunk processing
- VAD support
- less process-spawn overhead than CLI wrapping
- better path toward future partial/streaming transcript support
- possible improvement in packaging and runtime control

Potential risks:
- native addon complexity
- Windows packaging friction
- binary compatibility issues
- dependency churn outside our direct control
- migration cost if quality gains are minor

## Spike Questions

1. Does it reduce end-to-end latency for short command phrases?
2. Does it improve recognition quality or only runtime ergonomics?
3. Does it make future partial transcription and VAD easier?
4. Does it create packaging pain that outweighs the benefits?
5. Is it stable enough for a paid desktop product?

## Success Criteria

The addon is worth adopting only if it wins meaningfully in at least two of these:
- lower median command latency
- cleaner Windows packaging story
- easier future partial/VAD support
- simpler runtime diagnostics/control
- equal or better transcript quality on our known command set

If it is only “interesting” but not materially better, do not adopt it.

## Test Matrix

Run the same short command set through:
- current CLI path
- addon path

Command set:
- `mute mic`
- `unmute mic`
- `start stream`
- `stop stream`
- `switch to camera 1`
- `switch to break`
- `go to powerpoint`

Scenarios:
- quiet room
- normal home background noise
- slightly rushed speech
- short clipped phrases

Measure:
- capture duration
- transcription duration
- end-to-end command completion time
- transcript accuracy
- command extraction success
- packaging/build complexity notes

## Suggested Integration Approach

Do not replace the current runtime blindly.

Phase 1:
- add a parallel experimental runtime adapter
- keep the current CLI path as the default
- gate addon usage behind a local setting/flag
- do not assume which addon wins before the spike

Status:
- completed
- [whisper-runtime.js](/home/guycochran/skunkworks-production-agents/streamvoice/electron-app/services/whisper-runtime.js) now supports:
  - `cli`
  - experimental `addon` auto-detect
  - explicit `addon-kutalia`
  - explicit `addon-fugood`
- if no addon is installed, or if the addon path throws, the runtime falls back to CLI instead of breaking the app

Initial findings:
- `@kutalia/whisper-node-addon` installs cleanly into the Electron app
- on this Linux development environment it does not load successfully because the native package expects `libwhisper.so.1`
- that means package presence alone is not a good readiness signal; runtime loadability must be checked explicitly
- StreamVoice now treats `installed` and `loadable` as different states and exposes the fallback reason in diagnostics

Phase 2:
- compare both paths on the same machine and command set
- record structured notes

Phase 3:
- adopt only if results are materially better

## Recommendation Right Now

Proceed with a spike.

Do not switch the main product path until the addon proves:
- equal or better quality
- lower latency or better control
- acceptable packaging stability

Current recommendation:
- evaluate both `@kutalia/whisper-node-addon` and `@fugood/whisper.node`
- prefer the one that is easier to package and gives cleaner programmatic control

## Decision Rule

Adopt if:
- packaging is acceptable
- quality is not worse
- latency/control is noticeably better

Reject if:
- packaging is fragile
- quality is equal but not better
- the migration cost outweighs the gains
