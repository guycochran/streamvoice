# 🎬 OBS Setup Guide for StreamVoice

## Current Status: CLI-Anything Integration

StreamVoice currently uses CLI-Anything to control OBS. However, there are some limitations with the current CLI commands. Here's what you need to know:

### ⚠️ Important Note

**The CLI-Anything OBS integration has limited functionality.** Many commands in our interface won't work yet because:
- The CLI tool is more for configuration than control
- Commands like "start recording" need different syntax
- Scene switching requires exact scene names

### What Works Now

With the current setup, you can:
1. **Test the voice recognition** - See your commands being captured
2. **Test the WebSocket connection** - Verify server communication
3. **Use the interface** - Experience the UI/UX

### 🚀 Future: OBS WebSocket (Recommended)

For full functionality, StreamVoice needs OBS WebSocket integration. Here's the plan:

#### Option 1: OBS WebSocket Plugin (Best)
1. Install OBS WebSocket plugin: https://github.com/obsproject/obs-websocket/releases
2. Configure password in OBS → Tools → WebSocket Server Settings
3. StreamVoice connects directly to OBS (no CLI needed)

Benefits:
- ✅ All commands work instantly
- ✅ Real-time scene/source info
- ✅ No CLI installation needed
- ✅ Works with any OBS setup

#### Option 2: Direct OBS API
- Use OBS Studio's built-in HTTP server
- Requires OBS 28.0+
- More limited than WebSocket

### 🔧 Testing StreamVoice Without OBS

You can still test StreamVoice to see how it works:

1. **Voice Recognition Test**
   - Hold microphone button
   - Say any command
   - See it captured in the interface

2. **Connection Test**
   - Verify "Connected" status
   - Try quick command buttons
   - Watch the command history

3. **Server Logs**
   - Keep the server window open
   - See commands being processed
   - Check for any errors

### 📝 For Developers: Adding OBS WebSocket

If you want to implement OBS WebSocket support:

```javascript
// Install obs-websocket-js
npm install obs-websocket-js

// In server/index.js, add:
const OBSWebSocket = require('obs-websocket-js');
const obs = new OBSWebSocket();

// Connect to OBS
await obs.connect({
  address: 'localhost:4444',
  password: 'your-password'
});

// Now commands can work directly:
obs.send('SetCurrentScene', { 'scene-name': 'Gameplay' });
obs.send('StartRecording');
```

### 🎯 What This Means for Beta Testing

When testing StreamVoice:
1. **Focus on the voice control experience** - Is it intuitive?
2. **Test the UI/UX** - Is it easy to use while gaming?
3. **Suggest commands** - What else would you want to control?
4. **Report what works/doesn't** - Help prioritize development

The core innovation is hands-free control while gaming. Even without full OBS integration yet, you can validate if this solves your alt-tab problem!

### 🛠️ Manual Scene Names Setup

If you want to try making some commands work:

1. In OBS, rename your scenes to match exactly:
   - "Gameplay"
   - "Just Chatting"
   - "Starting Soon"
   - "Be Right Back"
   - "Ending Screen"

2. The commands might work with CLI-Anything (depends on version)

### 📅 Roadmap

1. **v0.1.0 (Current)** - Proof of concept with CLI
2. **v0.2.0 (Next)** - OBS WebSocket integration
3. **v0.3.0** - Custom commands
4. **v1.0.0** - Full release with installer

---

**Bottom line:** StreamVoice is a proof-of-concept showing that voice control for streaming is possible and desirable. The full OBS integration is coming soon!