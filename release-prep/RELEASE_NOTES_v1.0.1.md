# StreamVoice v1.0.1 - OBS Connection Fix 🔧

## 🐛 Bug Fixes

### Fixed OBS WebSocket IPv6 Connection Issue
- **Problem**: App showed "OBS: Checking..." indefinitely when OBS WebSocket bound to IPv6 address
- **Solution**: Changed connection URL from `ws://localhost:4455` to `ws://127.0.0.1:4455` to force IPv4
- **Impact**: StreamVoice now connects reliably to OBS regardless of network configuration

## 📋 What's Changed Since v1.0.0

- Fixed IPv6/IPv4 connection mismatch that prevented OBS connection
- Updated README with clearer setup instructions
- Clarified that OBS WebSocket authentication is optional

## 💾 Installation

Download the installer below and run it. If you have v1.0.0 installed, this will update it automatically.

**Requirements**:
- Windows 10 or 11
- OBS Studio 27.0 or newer
- Chrome browser

## 🙏 Thank You

Thanks to our early adopters who reported the connection issue! Your feedback helps make StreamVoice better for everyone.

---

*StreamVoice - Your FREE Stream Deck alternative with 70+ voice commands for OBS Studio*