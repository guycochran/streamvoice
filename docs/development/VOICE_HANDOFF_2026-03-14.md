# Voice Handoff - March 14, 2026

## Critical Fix Applied - v1.1.0-alpha.30

### Problem Identified
The speech capture was failing because the audio data (Uint8Array) was not surviving IPC serialization between the hidden capture window and the main process. The `submitAudio` IPC call was failing silently in packaged builds.

### Solution Implemented
1. **Array Conversion for IPC**: Modified speech-capture.html to convert Uint8Array to regular Array before IPC submission
   - Changed `audioBytes` to `Array.from(audioBytes)` for both preview and final submission
   - This ensures the data can be properly serialized across the IPC boundary

2. **Enhanced Error Handling**: Added detailed error catching and reporting
   - Wrapped submitAudio in try-catch with specific error messages
   - Added console.error logging for debugging
   - Report specific IPC submission failures to diagnostics

### Files Modified
- `/electron-app/speech-capture.html` - Fixed audio byte array conversion and error handling
- `/electron-app/package.json` - Version bump to 1.1.0-alpha.30
- `/electron-app/main.js` - Version update in About dialog

### Key Changes in speech-capture.html

```javascript
// Before - IPC serialization was failing silently
await window.speechCaptureAPI.submitAudio({
  audioBytes,  // Uint8Array doesn't serialize properly
  mimeType: 'audio/wav',
  durationMs: Date.now() - startedAt
});

// After - Convert to regular array for IPC
const audioArray = Array.from(audioBytes);
const submitResult = await window.speechCaptureAPI.submitAudio({
  audioBytes: audioArray,  // Regular array serializes correctly
  mimeType: 'audio/wav',
  durationMs: Date.now() - startedAt
});
```

### Expected Behavior After Fix
1. Audio capture chunks will be collected (as before)
2. WAV conversion will complete (as before)
3. IPC submission will now succeed with proper array serialization
4. Main process will receive the audio data
5. Whisper will transcribe the audio
6. Commands will execute

### Testing Instructions for v1.1.0-alpha.30
1. Build and package the application
2. Test on Windows with the packaged build
3. Check diagnostics for:
   - `Capture Phase` should progress beyond "starting"
   - `Last Audio Path` should show a file path (not "none")
   - `Last Whisper Duration` should show a time value
   - `Heard:` should show the transcribed text

### If This Fix Doesn't Work
If alpha.30 still fails with the same symptoms, the next step should be to replace the hidden BrowserWindow MediaRecorder approach entirely with a native audio capture solution in the main process. The IPC boundary is proving to be too fragile for reliable audio data transfer in packaged builds.

### Technical Note
The root cause was that Electron's IPC uses structured cloning for data transfer, and Uint8Array objects were not being properly serialized in the packaged environment. Converting to a regular JavaScript array ensures compatibility with the IPC serialization mechanism.