# 🔧 StreamVoice Troubleshooting Guide

## Problem: Browser Shows "Disconnected"

Based on our testing, the StreamVoice server IS running correctly - the issue is with the browser connection. Here's how to fix it:

### Quick Fix Steps

1. **Hard Refresh Your Browser**
   - Press `Ctrl+Shift+R` (or `Cmd+Shift+R` on Mac)
   - This clears the cache and reloads fresh JavaScript

2. **Try a Different Browser/Window**
   - Open an incognito/private window
   - Try Chrome if you're using another browser
   - Clear site data: F12 → Application → Clear Storage

3. **Check Browser Console**
   - Press F12 to open developer tools
   - Look for any red error messages
   - Check if you see "Connected to StreamVoice server" in the console

### Testing Tools Available

We've created several debugging tools to help:

1. **Debug Tool**: `http://localhost:8888/debug.html`
   - Shows real-time connection status
   - Tests WebSocket and REST API
   - Provides detailed error messages

2. **Quick Test**: `http://localhost:8888/test.html`
   - Simple connection checker
   - Shows troubleshooting steps
   - Auto-refreshes status every 5 seconds

3. **Main Interface**: `http://localhost:8888/index.html`
   - The actual StreamVoice interface
   - Should show "Connected" when working

### What We Know Works

✅ **Server is running correctly** on ports 8090 (WebSocket) and 3030 (REST)
✅ **Playwright browser test shows "Connected"** - proves the code works
✅ **Server logs show client connections** - WebSocket is functioning

### Common Browser Issues

1. **Cached Old JavaScript**
   - Solution: Hard refresh (Ctrl+Shift+R)

2. **Browser Extensions Blocking WebSocket**
   - Solution: Try incognito mode
   - Disable ad blockers temporarily

3. **Corporate Firewall/Proxy**
   - Solution: Try on a personal network

4. **Wrong Browser**
   - Voice recognition requires Chrome/Edge
   - WebSocket should work in all modern browsers

### Advanced Debugging

If the above doesn't work, try:

```bash
# 1. Stop the server (Ctrl+C)

# 2. Restart with verbose logging
cd ~/skunkworks-production-agents/streamvoice/server
DEBUG=* node index.js

# 3. In a new terminal, test the connection
curl http://localhost:3030/health

# 4. Check WebSocket with wscat (if installed)
wscat -c ws://localhost:8090
```

### Browser-Specific Connection Test

Open browser console (F12) and paste:

```javascript
// Test WebSocket connection directly
const ws = new WebSocket('ws://localhost:8090');
ws.onopen = () => console.log('✅ WebSocket Connected!');
ws.onerror = (e) => console.error('❌ WebSocket Error:', e);
ws.onmessage = (e) => console.log('📨 Message:', e.data);
```

### If Nothing Works

The issue is likely browser-specific since:
- Playwright (automated Chrome) connects fine
- Server shows active connections
- Port is correct (8090)

Try:
1. Different computer/device on same network
2. Different user profile in Chrome
3. Disable all browser extensions
4. Check Windows Firewall isn't blocking localhost:8090

### Contact for Help

If you're still stuck:
- Server logs: Check terminal where `npm start` is running
- Browser logs: F12 → Console tab
- Network tab: F12 → Network → WS (WebSocket filter)

The good news: **Your StreamVoice server is working perfectly!** We just need to get your specific browser to connect to it properly.