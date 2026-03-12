# 🧪 Quick Test Guide - No OBS Required!

Want to test StreamVoice without setting up OBS? Here's how:

## 1. Install Node.js
- Download from: https://nodejs.org/
- Choose the LTS version
- Run installer with defaults

## 2. Download StreamVoice
- Go to: https://github.com/guycochran/streamvoice
- Click green "Code" button → "Download ZIP"
- Extract to your Desktop

## 3. Start the Server
- Open Command Prompt (Windows key + type "cmd")
- Type these commands:
```
cd Desktop\streamvoice-main\server
npm install
node index.js
```
- You should see: "✨ StreamVoice Server Ready!"

## 4. Open the Interface
- Open Chrome browser
- Go to: file:///C:/Users/YOUR_NAME/Desktop/streamvoice-main/web/index.html
- Or drag the index.html file into Chrome

## 5. Test Voice Commands
- You should see "Connected" status (green)
- Hold the microphone button
- Say: "Switch to gameplay"
- Release button
- You'll see the command recognized!

## What You're Testing

Even without OBS connected, you can validate:
- ✅ **Voice Recognition** - Does it understand you clearly?
- ✅ **Latency** - How fast does it respond?
- ✅ **UI/UX** - Is it easy to use while gaming?
- ✅ **Reliability** - Does it stay connected?

## Try These Commands

Hold the button and say:
- "Switch to gameplay"
- "Start recording"
- "Mute my mic"
- "Emergency privacy"
- "Show webcam"

## What Should Happen

1. Your voice is captured
2. Command appears in transcript
3. Server processes it
4. Success/error message appears
5. Command added to history

The server console will show attempted OBS commands (they won't execute without OBS).

## Feedback We Need

1. **Voice Recognition**
   - Which commands worked perfectly?
   - Which ones did it mishear?
   - Is the "hold to talk" natural?

2. **User Experience**
   - Can you use this while gaming?
   - Is the UI readable on your second monitor?
   - What's missing?

3. **Technical**
   - Did it stay connected?
   - Any lag or delays?
   - Browser compatibility?

## Share Your Results

Let us know:
- Your accent/region (helps improve recognition)
- Your microphone type
- What games you stream
- Features you'd want

This test validates the CORE innovation: hands-free stream control while gaming!

---

*Remember: This is a proof-of-concept. Full OBS integration coming in v0.2.0!*