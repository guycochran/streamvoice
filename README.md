# 🎙️ StreamVoice - Voice Control for OBS

Never alt-tab out of your game again! Control OBS Studio with simple voice commands.

![StreamVoice Demo](https://img.shields.io/badge/status-beta-yellow) ![Platform](https://img.shields.io/badge/platform-windows-blue) ![License](https://img.shields.io/badge/license-MIT-green)

## 🎮 Why StreamVoice?

Every streamer knows the pain:
- 🎯 You're in an intense fight
- 📹 Need to switch scenes
- 💀 Alt-tab = Death
- 😤 Viewers see you die while fumbling with OBS

**StreamVoice solves this with simple voice commands!**

## 🚀 Quick Start (2 minutes)

### Prerequisites
- Windows 10 or later
- [Node.js](https://nodejs.org/) (LTS version)
- Chrome browser (for voice recognition)
- OBS Studio (see [OBS Setup Guide](OBS_SETUP_GUIDE.md) for details)

### Installation

1. **Download the installer**
   - [📥 Download StreamVoice-Installer.bat](https://github.com/guycochran/streamvoice/releases/latest/download/install-windows.bat)

2. **Run the installer**
   - Double-click `install-windows.bat`
   - It will install StreamVoice to `%USERPROFILE%\StreamVoice`
   - Creates a desktop shortcut

3. **Start StreamVoice**
   - Click the StreamVoice desktop shortcut
   - Chrome will open with the StreamVoice interface
   - You should see "Connected" status

## 🎤 Voice Commands

Hold the microphone button and say:

### Scene Control
- **"Switch to gameplay"** - Switch to your gameplay scene
- **"Switch to just chatting"** - Switch to just chatting scene
- **"Switch to starting"** - Switch to starting soon scene
- **"Switch to break"** - Switch to BRB scene
- **"Switch to ending"** - Switch to ending scene

### Recording/Streaming
- **"Start recording"** - Start recording
- **"Stop recording"** - Stop recording
- **"Start streaming"** - Go live
- **"Stop streaming"** - End stream

### Audio Control
- **"Mute my mic"** - Mute microphone
- **"Unmute my mic"** - Unmute microphone
- **"Mute desktop"** - Mute desktop audio
- **"Unmute desktop"** - Unmute desktop audio

### Quick Actions
- **"Emergency privacy"** - Instant privacy screen
- **"Show my screen"** - Show display capture
- **"Hide my screen"** - Hide display capture
- **"Show webcam"** - Show webcam
- **"Hide webcam"** - Hide webcam
- **"Activate sponsor mode"** - Show sponsor overlay

## 🛠️ Manual Installation

If the installer doesn't work:

```bash
# Clone the repository
git clone https://github.com/guycochran/streamvoice.git
cd streamvoice

# Install server dependencies
cd server
npm install

# Start the server
npm start

# In a new terminal, serve the web interface
cd ../web
python -m http.server 8888

# Open Chrome and go to http://localhost:8888
```

## 📹 How It Works

1. **Press & Hold** the microphone button
2. **Say a command** like "Switch to gameplay"
3. **Release** the button
4. StreamVoice sends the command to OBS
5. Your stream updates instantly!

## 🔧 Troubleshooting

**"Disconnected" Status**
- Make sure the server is running (check StreamVoice console window)
- Try refreshing the browser (Ctrl+Shift+R)
- Check Windows Firewall isn't blocking Node.js

**Voice Not Working**
- Must use Chrome browser
- Allow microphone permissions when prompted
- Speak clearly after the beep sound

**Commands Not Working**
- Ensure OBS Studio is running
- Install CLI-Anything for OBS
- Check the StreamVoice console for errors

## 🤝 Beta Testing

We're looking for 10 streamers to test StreamVoice!

**Current Status:** This is a proof-of-concept showing voice control is possible. Not all OBS commands work yet (see [OBS Setup Guide](OBS_SETUP_GUIDE.md)), but you can test:
- ✅ Voice recognition accuracy
- ✅ UI/UX while gaming
- ✅ Connection reliability
- ✅ Overall concept validation

**What you get:**
- ✅ Free access to all features
- ✅ Direct support from the developer
- ✅ Your feature requests prioritized
- ✅ Credit as a founding user

**What we need:**
- 📊 Feedback on the voice control experience
- 💡 Ideas for new commands
- 🐛 Bug reports
- 📹 A clip of you using it on stream (optional)

Join our Discord: [discord.gg/streamvoice](#) (coming soon)

## 🚦 Roadmap

- [x] Basic voice commands
- [x] Web interface
- [ ] OBS WebSocket integration (better than CLI)
- [ ] Custom command creation
- [ ] Twitch chat integration
- [ ] Stream Deck alternative mode
- [ ] Multi-language support
- [ ] Electron app
- [ ] Steam release

## 👨‍💻 Development

Want to contribute or customize?

```bash
# Install dependencies
cd server && npm install

# Run in development mode
npm run dev

# Run tests
npm test
```

### Adding Custom Commands

Edit `server/index.js` and add to the `COMMAND_MAP`:

```javascript
const COMMAND_MAP = {
  'your phrase': 'obs-cli-command',
  // Add your custom commands here
};
```

## 📝 License

MIT License - Use it however you want!

## 💖 Support

If StreamVoice saves you from dying in-game:
- ⭐ Star this repo
- 🐦 Tweet about it
- 💜 Follow on Twitch (coming soon)
- ☕ [Buy me a coffee](https://buymeacoffee.com/streamvoice) (coming soon)

---

**Built with ❤️ for streamers by streamers**

*Never alt-tab again!*