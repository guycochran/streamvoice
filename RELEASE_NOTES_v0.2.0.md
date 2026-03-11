# StreamVoice v0.2.0 - First Beta Release! 🎉

Control OBS Studio with your voice - no more alt-tabbing during streams!

## 🆕 What's New

This is our first public beta release! StreamVoice lets you control OBS using voice commands like:
- "Switch to gameplay"
- "Start recording"
- "Mute my mic"
- And 20+ more commands!

## 🎯 Features

- **Voice Control**: Hold-to-talk design for accurate recognition
- **Real OBS Integration**: Actually controls OBS via WebSocket (v5)
- **Quick Commands**: One-click buttons for common actions
- **Command History**: See what commands were recognized
- **Kid-Friendly**: Simple setup with EASY_TEST.bat
- **Chrome Only**: Uses Web Speech API (Chrome required)

## 📦 Installation

### Super Easy Method (Recommended for Beta Testers)

1. Download `StreamVoice-v0.2.0.tar.gz` from the releases page
2. Extract to your Desktop
3. Run `INSTALL.bat` (one time only)
4. Run `EASY_TEST.bat` to start StreamVoice
5. Chrome will open automatically!

### Manual Method

```bash
git clone https://github.com/guycochran/streamvoice.git
cd streamvoice/server
npm install
cd ..
# Then run EASY_TEST.bat
```

## ⚙️ OBS Setup (Required)

1. In OBS: Tools → obs-websocket Settings
2. Check ✅ "Enable WebSocket server"
3. Leave password empty
4. Port should be 4455 (default)

## 🎤 How to Use

1. Make sure OBS is running
2. Run EASY_TEST.bat
3. Chrome opens → You should see "Connected" in green
4. Hold the microphone button
5. Say a command clearly
6. Release the button
7. Watch OBS react!

## 📝 Available Commands

### Scene Switching
- "Switch to gameplay" / "Go to gameplay"
- "Switch to just chatting" / "Go to chat"
- "Switch to starting" / "Starting soon"
- "Switch to break" / "Be right back"
- "Switch to ending"

### Recording & Streaming
- "Start recording" / "Stop recording"
- "Start streaming" / "Stop streaming"

### Audio Control
- "Mute my mic" / "Unmute my mic"
- "Emergency mute" (instant mute)

### Privacy & Safety
- "Emergency privacy" (switches to safe scene)

## 🐛 Known Issues

- Only works in Chrome (Web Speech API requirement)
- Requires holding button while speaking
- Scene names must roughly match command names
- Windows only for EASY_TEST.bat (manual setup works on Mac/Linux)

## 👥 For Beta Testers

We need your feedback! Please report:
1. What commands worked/didn't work
2. Any connection issues
3. Feature requests
4. Your streaming setup (OBS version, scenes, etc.)

Report issues at: https://github.com/guycochran/streamvoice/issues

## 🎮 Perfect For

- Young streamers who want to feel like Tony Stark
- Streamers tired of alt-tabbing
- Anyone who wants hands-free OBS control
- Content creators looking for smoother production

## 🚀 What's Next

- More commands (suggestions welcome!)
- Mac/Linux installers
- OBS plugin version
- Custom command creation
- Voice feedback/confirmation

## 💖 Special Thanks

To all the young streamers testing this - you're helping make streaming more fun for everyone!

---

**Note**: This is beta software. Always have a backup plan for important streams!

**Download**: [StreamVoice-v0.2.0.tar.gz](https://github.com/guycochran/streamvoice/releases/download/v0.2.0/StreamVoice-v0.2.0.tar.gz)