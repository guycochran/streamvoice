# StreamVoice

Professional voice control for OBS Studio. Control your streams hands-free with natural voice commands.

![Version](https://img.shields.io/badge/version-v1.0.0-brightgreen) ![Platform](https://img.shields.io/badge/platform-windows-blue) ![License](https://img.shields.io/badge/license-MIT-green) ![Status](https://img.shields.io/badge/status-stable-success)

## 🎤 What is StreamVoice?

StreamVoice gives you hands-free control of OBS Studio through natural voice commands. Built as a desktop application, it runs quietly in your system tray and responds instantly when you need it. No more interrupting gameplay to switch scenes or manage your stream.

### ✨ Key Features

- **70+ Voice Commands** - Control scenes, sources, recording, streaming, audio, and more
- **Natural Language** - Say "switch to my game" instead of memorizing exact commands
- **Desktop Application** - Professional Windows app with auto-updates
- **System Tray** - Runs quietly in the background
- **Hold-to-Talk** - Crystal clear voice recognition
- **Zero Configuration** - Works with OBS defaults

## 📥 Download

### Windows Installer (v1.0.0)
**[Download StreamVoice Setup (Windows)](https://github.com/guycochran/streamvoice/releases/download/v1.0.0/StreamVoice-Setup-1.0.0.exe)**

*Requires Windows 10 or later • 76.8 MB*

### Other Platforms
macOS and Linux support coming soon!

## 🚀 Getting Started

### 1. Setup OBS Studio

StreamVoice requires OBS Studio with WebSocket enabled:

1. Open OBS Studio (v27 or later)
2. Go to **Tools** → **WebSocket Server Settings**
3. Check ✅ **Enable WebSocket Server**
4. Leave **Enable Authentication** unchecked (or see troubleshooting if you need a password)
5. Server Port: **4455** (default)
6. Click **OK**

### 2. Install StreamVoice

1. Download the installer above
2. Run `StreamVoice-Setup.exe`
3. Follow the installation wizard
4. StreamVoice will launch automatically

### 3. Connect to OBS

1. StreamVoice will automatically connect when OBS is running
2. Look for green "OBS: Connected" status in the app
3. If it shows "OBS: Checking..." - see troubleshooting below

## 🎤 Voice Commands

Hold the microphone button and speak naturally:

### Scene Control
- "Switch to gameplay"
- "Go to starting soon"
- "Show my webcam scene"
- "Back to desktop"

### Recording & Streaming
- "Start recording"
- "Stop streaming"
- "Pause the recording"

### Audio Control
- "Mute my mic"
- "Increase game audio"
- "Lower desktop sound"

### Quick Actions
- "Take a screenshot"
- "Enable green screen"
- "Hide my webcam"

[View all 70+ commands →](https://github.com/guycochran/streamvoice/wiki/Commands)

## 🛠️ Troubleshooting

### Can't Connect to OBS?
1. Make sure OBS is running
2. Check WebSocket is enabled in OBS settings
3. Verify the password is correct
4. Try restarting both applications

### Voice Commands Not Working?
1. Click "Allow" when Chrome asks for microphone permission
2. Hold the button while speaking
3. Speak clearly and naturally
4. Make sure your mic is working in Windows

### Need Help?
- [Documentation](https://github.com/guycochran/streamvoice/wiki)
- [Report an Issue](https://github.com/guycochran/streamvoice/issues)
- [Discussions](https://github.com/guycochran/streamvoice/discussions)

## 🤝 Contributing

StreamVoice is open source and welcomes contributions!

- Report bugs or request features in [Issues](https://github.com/guycochran/streamvoice/issues)
- Submit improvements via [Pull Requests](https://github.com/guycochran/streamvoice/pulls)
- Share your experience in [Discussions](https://github.com/guycochran/streamvoice/discussions)

## 📄 License

StreamVoice is MIT licensed. See [LICENSE](LICENSE) for details.

## 🙏 Acknowledgments

Special thanks to:
- The OBS Project for WebSocket support
- Early beta testers who provided invaluable feedback
- The streaming community for inspiration

---

**Built with ❤️ for streamers**
