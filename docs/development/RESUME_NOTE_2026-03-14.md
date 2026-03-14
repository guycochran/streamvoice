# Resume Note 2026-03-14

## Current Build To Resume From

- version: `1.1.0-beta.15`
- commit: `b1f3760`
- build: <https://github.com/guycochran/streamvoice/actions/runs/23081788514>

## What Changed In Beta.15

- added a real Whisper runtime adapter:
  - `cli`
  - `addon`
  - `addon-kutalia`
  - `addon-fugood`
- added automatic CLI fallback if an addon is:
  - not installed
  - installed but not loadable
  - installed but throws at runtime
- added `Speech Runtime` in Settings so runtime testing can be done intentionally
- added diagnostics for:
  - requested runtime
  - actual runtime used
  - runtime note
  - fallback reason

## Important Spike Finding

- `@kutalia/whisper-node-addon` is installed in the Electron app now
- it installed cleanly
- on the Linux development environment it did not load because it expected `libwhisper.so.1`
- because of that, StreamVoice now treats:
  - `installed`
  - `loadable`
  as different states

This is important because the runtime spike should not lie. Diagnostics now reflect that difference.

## Exact Next Test

When `beta.15` finishes building:

1. install `1.1.0-beta.15`
2. confirm the footer/version shows `1.1.0-beta.15`
3. go to `Settings`
4. set `Speech Runtime` to `Experimental Addon Auto-detect`
5. save settings
6. test these commands:
   - `mute mic`
   - `unmute mic`
   - `start stream`
   - `switch to camera 1`

## What To Send Back After Testing

Send these diagnostics lines:

- `Speech Runtime`
- `Speech Runtime Requested`
- `Speech Runtime Note`
- `Last Whisper Runtime`
- `Last Whisper Binary`
- `Last Whisper Fallback`
- `Last Whisper Fallback Reason`

Also send whether the commands actually executed in OBS.

## Decision We Are Trying To Make

We are not blindly migrating to an addon runtime.

We are trying to answer:

1. does the addon actually load on Windows
2. does it transcribe correctly
3. does it reduce latency or improve control
4. does it package cleanly enough to justify adoption

If not, keep the current CLI runtime and continue hardening the command layer.

## Files Most Relevant On Resume

- [whisper-runtime.js](/home/guycochran/skunkworks-production-agents/streamvoice/electron-app/services/whisper-runtime.js)
- [main.js](/home/guycochran/skunkworks-production-agents/streamvoice/electron-app/main.js)
- [speech-service.js](/home/guycochran/skunkworks-production-agents/streamvoice/electron-app/services/speech-service.js)
- [index-enhanced.html](/home/guycochran/skunkworks-production-agents/streamvoice/electron-app/web/index-enhanced.html)
- [app-enhanced.js](/home/guycochran/skunkworks-production-agents/streamvoice/electron-app/web/app-enhanced.js)
- [WHISPER_NODE_ADDON_SPIKE.md](/home/guycochran/skunkworks-production-agents/streamvoice/docs/development/WHISPER_NODE_ADDON_SPIKE.md)
- [CURRENT_STATE.md](/home/guycochran/skunkworks-production-agents/streamvoice/docs/development/CURRENT_STATE.md)

## Keep In Mind

- the core voice path already works in Windows packaged builds
- do not destabilize the native recorder sidecar
- do not reintroduce browser capture
- do not assume addon presence means addon readiness
