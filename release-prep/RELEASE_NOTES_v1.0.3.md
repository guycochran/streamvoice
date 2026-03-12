# StreamVoice v1.0.3 - Final IPv6 Fix! 🚀

## 🐛 Bug Fixes

### Fixed Web UI Connection Issue
- **Problem**: v1.0.2 fixed the server connections, but the web UI still tried to connect via IPv6
- **Solution**: Applied IPv4 fix to the web UI WebSocket connection (`electron-app/web/app-enhanced.js`)
- **Impact**: StreamVoice now shows "Connected" status and all 67 voice commands work perfectly!

## 📋 What's Changed Since v1.0.2

- Fixed IPv6/IPv4 connection issue in web UI
- StreamVoice now fully connects: UI ➜ Server ➜ OBS
- All Stream Deck-like buttons and voice commands are operational

## 💾 Installation

Download the installer below and run it. This will update your existing installation automatically.

**Requirements**:
- Windows 10 or 11
- OBS Studio 27.0 or newer
- Chrome browser

## 🎉 Finally Working!

This release includes the complete fix for all connection issues. The app now properly shows:
- ✅ "Connected" status in the UI
- ✅ OBS connection status
- ✅ All 67 voice commands available
- ✅ Stream Deck macro buttons functional

## 🙏 Thank You

Third time's the charm! Thanks for your patience as we tracked down all the IPv6/IPv4 issues. StreamVoice is now fully operational and ready to replace your Stream Deck!

---

*StreamVoice - Your FREE Stream Deck alternative with 70+ voice commands for OBS Studio*