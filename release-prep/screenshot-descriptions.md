# Screenshot Descriptions for README

## Required Screenshots

### 1. System Tray Menu (screenshot-system-tray.png)
**Description**: Shows StreamVoice running in the Windows system tray
- StreamVoice icon visible in system tray
- Right-click menu open showing options:
  - Open StreamVoice
  - Start at login [✓]
  - About
  - Exit
- Windows 11 taskbar visible
- Time showing in corner
- Clean desktop background

### 2. Main Application Window (screenshot-main-window.png)
**Description**: StreamVoice Electron app main window
- Window title: "StreamVoice - Voice Control for OBS"
- Status indicator showing "✓ Connected to OBS"
- Server status: "Running on port 3030"
- WebSocket status: "Active on port 8090"
- Button to "Open Control Interface"
- Minimize to tray option
- Clean, modern UI with StreamVoice branding

### 3. Voice Control Interface (screenshot-voice-control.png)
**Description**: Chrome browser showing voice control in action
- URL bar showing: localhost:3030
- Large microphone button (pressed/active state)
- Voice transcript showing: "Switch to gameplay"
- Status message: "✓ Scene changed to: Gameplay"
- Command list visible on the right side
- Hold-to-talk instructions at top
- Dark theme with blue accent colors

### 4. Stream Deck Alternative Grid (screenshot-stream-deck.png)
**Description**: Macro button grid interface
- 6x4 grid of colorful action buttons
- Buttons include:
  - Scene switches (Gameplay, Camera, BRB, etc.)
  - Recording controls (Start/Stop)
  - Stream controls (Go Live, End Stream)
  - Audio controls (Mute Mic, Mute Desktop)
  - Special macros (Interview Mode, Emergency)
- Mouse hovering over "Interview Mode" button
- Tooltip showing macro description

### 5. Audio Mixer (screenshot-audio-mixer.png)
**Description**: Audio control panel
- Multiple audio source sliders:
  - Microphone (at 75%)
  - Desktop Audio (at 50%)
  - Game Audio (at 80%)
  - Music (at 20%)
- Each with mute toggle buttons
- Visual level meters beside sliders
- Master volume control at top
- "Reset All" button

### 6. OBS Integration (screenshot-obs-integration.png)
**Description**: Split screen showing StreamVoice and OBS Studio
- Left half: StreamVoice with command being executed
- Right half: OBS Studio showing the scene change
- Arrow or highlight showing the connection
- Both windows clearly visible
- Shows real-time synchronization

### 7. Setup Process (screenshot-setup.png)
**Description**: OBS WebSocket settings dialog
- OBS Studio Tools menu open
- WebSocket Server Settings dialog
- "Enable WebSocket Server" checked
- Port: 4455 (default)
- No password set
- Instructions overlay pointing to key settings

### 8. Command List (screenshot-commands.png)
**Description**: Full command reference panel
- Scrollable list of all 70+ commands
- Categories clearly marked:
  - Scene Control
  - Recording & Streaming
  - Audio Control
  - Filters & Effects
  - Advanced Controls
- Search box at top
- Each command with example phrase

## Screenshot Style Guide

### Visual Consistency
- Clean Windows 11 desktop
- Professional background (subtle gradient or blur)
- Consistent window sizing
- High resolution (at least 1920x1080)
- No personal information visible
- StreamVoice branding consistent

### Annotations
- Use red arrows for important elements
- Add subtle drop shadows to windows
- Number callouts for step-by-step guides
- Highlight boxes for key features
- Professional font for any text overlays

### Color Scheme
- Primary: #2196F3 (StreamVoice Blue)
- Success: #4CAF50 (Green)
- Warning: #FF9800 (Orange)
- Background: #1a1a1a (Dark)
- Text: #FFFFFF (White)

## Tools for Creating Screenshots

### Option 1: Manual Creation
1. Install StreamVoice on Windows
2. Set up OBS Studio
3. Use Windows Snipping Tool or ShareX
4. Edit in Paint.NET or GIMP
5. Add annotations and arrows

### Option 2: Mockup Tools
1. Use Figma or Canva
2. Create realistic window frames
3. Design the interfaces
4. Add professional styling
5. Export as PNG

### Option 3: Automated Screenshots
1. Use Puppeteer or Playwright
2. Script the UI interactions
3. Capture at specific moments
4. Post-process with ImageMagick
5. Add watermarks/branding

## File Specifications
- Format: PNG
- Resolution: 1920x1080 minimum
- File size: Under 500KB each
- Naming: screenshot-[feature].png
- Location: /docs/images/