# StreamVoice Professional - Electron Edition 🚀

## What's New

This is the **PROFESSIONAL** version of StreamVoice - a real Windows application that your users will love!

### Features
- ✅ **One-click installer** - StreamVoice-Setup.exe
- ✅ **Zero dependencies** - No Node.js, no Chrome required
- ✅ **System tray** - Always running, instant access
- ✅ **Auto-updates** - Push fixes without user intervention
- ✅ **Native UI** - Professional dark theme
- ✅ **Start with Windows** - Optional auto-start
- ✅ **Code signed** - No security warnings (with certificate)

## For Users

### Installation
1. Download `StreamVoice-Setup-1.0.0.exe`
2. Double-click to install
3. StreamVoice appears in your system tray
4. Click the tray icon to open

### Usage
- **Voice Control**: Hold the big microphone button and speak
- **Quick Actions**: One-click buttons for common commands
- **System Tray**: Right-click for options
- **Auto-Updates**: Notifies when updates are available

## For Developers

### Project Structure
```
electron-app/
├── main.js              # Main process (Electron)
├── preload.js           # Preload script (security)
├── renderer/            # UI (HTML/CSS/JS)
│   ├── index.html      # Main window
│   ├── style.css       # Professional dark theme
│   └── renderer.js     # UI logic
├── server/             # Backend (Express + OBS WebSocket)
├── web/                # Original web UI (embedded)
├── assets/             # Icons and images
└── dist/               # Built installers
```

### Building

#### Prerequisites
- Node.js 18+
- Windows (for building Windows installer)

#### Build Commands
```bash
# Install dependencies
npm install

# Run in development
npm start

# Build Windows installer
npm run build-win
# or
node build-windows.js

# Output: dist/StreamVoice-Setup-1.0.0.exe
```

### Code Signing (Production)

For distribution without security warnings:

1. Get a code signing certificate (~$200/year)
2. Set environment variables:
   ```
   export CSC_LINK=path/to/certificate.pfx
   export CSC_KEY_PASSWORD=your_password
   ```
3. Build normally - electron-builder will sign automatically

### Auto-Updates

The app checks GitHub Releases for updates:
- Uses `electron-updater`
- Compares version in package.json
- Downloads in background
- Prompts user to restart

### Testing
1. Build the installer
2. Install on a clean Windows machine
3. Verify:
   - Installs without warnings
   - Appears in Start Menu
   - System tray works
   - Voice control functions
   - Can minimize/restore
   - Updates work

## Deployment

### GitHub Release
1. Update version in package.json
2. Build installer: `npm run build-win`
3. Create GitHub release
4. Upload `StreamVoice-Setup-x.x.x.exe`
5. Users get auto-update notification

### Landing Page Update
Update the download link to point to the .exe installer instead of .zip

## Why Electron?

- **Discord** uses it - 350M users
- **VS Code** uses it - Most popular editor
- **Slack** uses it - Enterprise approved
- **Spotify** uses it - Performance proven

This is what "professional" looks like in 2024.

## The Competition

| Feature | Stream Deck | Touch Portal | StreamVoice |
|---------|-------------|--------------|-------------|
| Price | $149 | $13.99 | FREE |
| Voice Control | ❌ | ❌ | ✅ |
| One-Click Install | ✅ | ❌ | ✅ |
| Auto-Updates | ✅ | ✅ | ✅ |
| System Tray | N/A | ✅ | ✅ |
| Commands | 15-32 | Unlimited | 70+ |

## Support

- GitHub Issues: Bug reports
- Discord: Coming soon
- Email: support@streamvoice.app (todo)

---

Built with ❤️ for streamers who deserve professional tools without the price tag.