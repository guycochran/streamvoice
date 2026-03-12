# 🎮 OBS WebSocket Setup - StreamVoice v0.2

**NOW WITH REAL OBS CONTROL!** 🎉

## Prerequisites

1. **OBS Studio** (v28 or newer)
2. **OBS WebSocket Plugin** v5.x
3. **Node.js** installed
4. **Chrome browser** (for voice recognition)

## Step 1: Install OBS WebSocket Plugin

### For OBS 28+
OBS WebSocket is **built-in**! Just enable it:

1. Open OBS Studio
2. Go to **Tools → obs-websocket Settings**
3. Enable WebSocket server
4. **IMPORTANT**: Leave password BLANK (or update in server code)
5. Default port should be 4455
6. Click "OK"

### For older OBS versions
Download from: https://github.com/obsproject/obs-websocket/releases

## Step 2: Set Up Your Scenes

StreamVoice uses fuzzy matching, but works best with these scene names:
- **Gameplay** (or anything with "game")
- **Just Chatting** (or anything with "chatting")
- **Starting Soon** (or anything with "starting")
- **Be Right Back** (or "BRB")
- **Ending** (or anything with "ending")

## Step 3: Test StreamVoice

1. **Start OBS Studio**
2. **Run the new server:**
   ```bash
   cd streamvoice/server
   node index-new.js
   ```
   You should see:
   ```
   ✨ StreamVoice Server v0.2.0 Ready!
   ⚡ Connecting to OBS WebSocket...
   ✅ Connected to OBS WebSocket
   📺 Current scene: [your scene]
   📋 Available scenes: [list of scenes]
   ```

3. **Open the v2 interface:**
   - Open `web/index-v2.html` in Chrome
   - You should see "✅ OBS Connected (X scenes)"

## Step 4: Test Voice Commands

Hold the mic button and say:

### Scene Commands (ACTUALLY WORK!)
- **"Switch to gameplay"** - Changes to gameplay scene
- **"Switch to just chatting"** - Changes to chat scene
- **"Switch to break"** - Changes to BRB scene

### Recording (ACTUALLY WORKS!)
- **"Start recording"** - Starts OBS recording
- **"Stop recording"** - Stops OBS recording

### Streaming (ACTUALLY WORKS!)
- **"Start streaming"** - Goes live!
- **"Stop streaming"** - Ends stream

### Audio (WORKS IF SOURCES EXIST)
- **"Mute my mic"** - Mutes input named "Mic"
- **"Unmute my mic"** - Unmutes mic

### Sources (WORKS IN CURRENT SCENE)
- **"Show webcam"** - Shows webcam source
- **"Hide webcam"** - Hides webcam source

## What's Different in v0.2?

| Feature | v0.1 (CLI) | v0.2 (WebSocket) |
|---------|------------|------------------|
| Scene switching | ❌ Didn't work | ✅ Instant! |
| Recording control | ❌ Wrong syntax | ✅ Works perfectly |
| Streaming control | ❌ Not supported | ✅ Full control |
| Real-time feedback | ❌ No | ✅ Yes! |
| Scene list | ❌ Manual config | ✅ Auto-detected |
| Audio control | ❌ Limited | ✅ Full mute/unmute |

## Troubleshooting

**"OBS not detected"**
- Make sure OBS is running FIRST
- Check Tools → obs-websocket Settings is enabled
- Default port is 4455 (not 4444)
- Try without password first

**"Scene not found"**
- StreamVoice shows available scenes in the console
- Use fuzzy matching: "gameplay" matches "My Gameplay Scene"

**"Audio source not found"**
- Check your input names in OBS
- Common names: "Mic/Aux", "Microphone", "Mic"

## Advanced Configuration

If you need a password or different port, edit `server/index-new.js`:

```javascript
const OBS_WEBSOCKET_URL = 'ws://localhost:4455';
const OBS_PASSWORD = 'your-password-here';
```

## 🎉 IT ACTUALLY WORKS NOW!

No more "proof of concept" - StreamVoice v0.2 gives you REAL voice control over OBS:
- Instant scene switching
- Recording start/stop
- Stream management
- Audio control
- Source visibility

The dream is real - never alt-tab out of your game again!