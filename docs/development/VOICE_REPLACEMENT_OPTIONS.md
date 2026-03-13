# Voice Replacement Options for StreamVoice

## Current Repo Reality

The browser-based speech capture path has failed repeatedly in packaged Windows builds.

What is already known:
- OBS desktop IPC works
- scene inventory works
- mic selection works
- VU metering works
- Whisper binary/model bundling works
- browser/hidden-window `MediaRecorder` capture does **not** complete reliably

Current primary implementation direction in the repo:
- Windows native recorder sidecar using `NAudio`
- Electron main owns recording lifecycle
- recorded WAV is handed to `whisper.cpp`

Recent relevant commit:
- `8401e36` `Replace ffmpeg plan with NAudio recorder sidecar`

## Recommended Path Now

### Option 1: Windows Native Recorder Sidecar with `NAudio` (PRIMARY)

This is the current preferred direction.

Why:
- cleaner licensing story than bundling `ffmpeg`
- keeps recording out of the renderer
- easier to reason about in Electron than browser capture
- straightforward WAV output for Whisper
- good commercial/distribution fit

Current repo pieces:
- [native-speech-capture-service.js](/home/guycochran/skunkworks-production-agents/streamvoice/electron-app/services/native-speech-capture-service.js)
- [StreamVoiceRecorder.csproj](/home/guycochran/skunkworks-production-agents/streamvoice/electron-app/native-recorder/StreamVoiceRecorder.csproj)
- [Program.cs](/home/guycochran/skunkworks-production-agents/streamvoice/electron-app/native-recorder/Program.cs)

Target shape:
- renderer only starts/stops PTT
- Electron main spawns recorder sidecar
- recorder writes `16kHz` mono WAV
- Electron main runs Whisper on that file
- transcript routes into the existing desktop OBS command executor

This should remain the primary recovery plan unless it fails quickly for concrete reasons.

## Fallback Options

### Option 2: `@kutalia/whisper-node-addon`

GitHub:
- https://github.com/Kutalia/whisper-node-addon

Why it is interesting:
- Electron-focused
- direct PCM pipeline
- avoids some file-based plumbing
- may eventually support more real-time speech UX

Why it is not the primary path right now:
- it introduces another native addon dependency
- it is a larger platform/integration gamble than the sidecar recorder
- the repo already has `whisper.cpp` working well enough on the transcription side

Use this if:
- the `NAudio` sidecar proves unworkable
- or the sidecar path becomes too awkward to maintain

### Option 3: Other Native Audio Libraries (`PortAudio`, `miniaudio`)

These are valid longer-term directions, especially for a deeper native capture stack.

Why not first:
- more implementation work right now
- more custom plumbing than the `NAudio` sidecar

Good longer-term if you want:
- one tighter native module
- broader cross-platform capture strategy

## Explicitly Deprecated

Do not keep iterating these approaches:

- hidden BrowserWindow `MediaRecorder`
- visible renderer `MediaRecorder`
- large IPC audio payload submission
- chunked browser-capture uploads as the core architecture
- Web Speech API as the main desktop speech path

Those paths have already consumed too much time and did not produce a shippable result.

## What Should Be Removed Over Time

Once native capture is working, strip these from the active path:

- [speech-capture.html](/home/guycochran/skunkworks-production-agents/streamvoice/electron-app/speech-capture.html)
- [speech-capture-preload.js](/home/guycochran/skunkworks-production-agents/streamvoice/electron-app/speech-capture-preload.js)
- `speech-begin-audio-upload`
- `speech-append-audio-upload-chunk`
- `speech-complete-audio-upload`

Those can remain temporarily during migration, but they should not remain the production voice path.

## Practical Recommendation

1. Finish the `NAudio` sidecar path first.
2. Verify in packaged Windows:
   - WAV file is created
   - Whisper runs
   - transcript appears
   - `mute mic` executes in OBS
3. Only if that fails for concrete reasons, evaluate `@kutalia/whisper-node-addon`.

## Future Requirement

After native push-to-talk works:
- add configurable hotkey
- then add optional wake-word arming mode
- starting default phrase: `Blue 42`

Wake word should not be the first recovery milestone. Native PTT must work first.
