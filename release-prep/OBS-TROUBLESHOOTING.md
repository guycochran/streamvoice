# StreamVoice OBS Connection Troubleshooting

## Issue: "OBS Checking..." Status

If your StreamVoice app shows "OBS Checking..." in the top left corner, it means the app can't connect to OBS WebSocket.

## Quick Fix Steps

### 1. Make Sure OBS Studio is Running
- StreamVoice can only connect when OBS is open
- Start OBS Studio first, then StreamVoice

### 2. Enable OBS WebSocket
1. In OBS Studio, go to **Tools** → **WebSocket Server Settings**
2. Check ✅ **Enable WebSocket Server**
3. Settings should be:
   - **Server Port**: `4455` (default)
   - **Enable Authentication**: ❌ Unchecked (or see password section below)
4. Click **OK** to save

### 3. Check Windows Firewall
- Windows Firewall might block the connection
- When prompted, allow OBS and StreamVoice through the firewall

### 4. Restart Both Apps
1. Close StreamVoice (right-click system tray → Quit)
2. Close OBS Studio
3. Start OBS Studio first
4. Start StreamVoice
5. Wait 5-10 seconds for connection

## Advanced Troubleshooting

### Check if Server is Running
1. Open the app
2. Look in the console (if available)
3. Should see: `StreamVoice API running on http://localhost:3030`

### Test the Connection Manually
1. Open your browser
2. Go to: `http://localhost:3030/api/obs-status`
3. You should see JSON data:
   ```json
   {
     "connected": true,
     "scenes": ["Scene 1", "Scene 2"],
     "currentScene": "Scene 1"
   }
   ```

### If Using OBS Password
If you have authentication enabled in OBS WebSocket:

1. Find the file: `electron-app/server/index-enhanced.js`
2. Look for line 19: `const OBS_PASSWORD = '';`
3. Change it to: `const OBS_PASSWORD = 'your-password';`
4. Save and restart StreamVoice

### Common Error Messages

**"OBS Not Connected"**
- OBS isn't running or WebSocket is disabled

**"Error: ECONNREFUSED"**
- OBS WebSocket server isn't running
- Wrong port number (should be 4455)

**"Authentication Failed"**
- Password is set in OBS but not in StreamVoice

### Still Not Working?

1. **Check OBS Version**
   - StreamVoice requires OBS Studio 27.0 or newer
   - Update OBS if needed

2. **Check Port Conflicts**
   - Another app might be using port 4455
   - Try changing the port in both OBS and StreamVoice

3. **Antivirus Software**
   - Some antivirus may block local connections
   - Add exceptions for OBS and StreamVoice

4. **Run as Administrator**
   - Try running both apps as administrator
   - Right-click → Run as administrator

## Testing Your Setup

Once connected, you should see:
- Status changes from "OBS Checking..." to "OBS: Connected"
- Green dot appears next to the status
- Voice commands and quick actions will work

Test with:
1. Click any Quick Action button (like "Start Recording")
2. Hold the voice button and say "mute mic"
3. Check if OBS responds

## Need More Help?

- GitHub Issues: https://github.com/guycochran/streamvoice/issues
- Discord: [Coming Soon]
- Make sure to include:
  - Your OBS version
  - Your Windows version
  - Any error messages
  - Screenshot of OBS WebSocket settings