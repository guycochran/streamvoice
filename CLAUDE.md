# CLAUDE.md - StreamVoice Project Guide

This file provides guidance to Claude Code (claude.ai/code) when working with the StreamVoice project.

## Project Overview

**StreamVoice** is a voice control system for OBS Studio that acts as a free Stream Deck alternative. Built after discovering CLI-Anything didn't actually control OBS, we pivoted to create real OBS WebSocket integration. The project started as a simple voice control tool (v0.2) and evolved into a full Stream Deck alternative (v0.3).

**Key Achievement**: 70+ voice commands + Stream Deck-like macros = Free alternative to $149 hardware

## Project Status (March 11, 2026)

### ✅ Completed
- Basic voice control (v0.2.0) - 20 commands
- Enhanced version (v0.3.0) - 70+ commands
- Stream Deck alternative UI
- Audio mixer with volume control
- OBS WebSocket full integration
- GitHub release automation
- Beta tester recruitment materials
- Landing page ready for GitHub Pages

### 🚀 Ready for Release
- v0.2.0 published on GitHub
- v0.3.0 enhanced version ready
- All documentation complete
- Release automation working

### 📋 Next Steps
1. Create v0.3.0 release on GitHub
2. Enable GitHub Pages for landing page
3. Start beta tester recruitment
4. Test on Windows machines
5. Gather feedback for v1.0

## Directory Structure

```
streamvoice/
├── server/                    # Node.js backend
│   ├── index.js              # v0.2 server (basic, 20 commands)
│   ├── index-enhanced.js     # v0.3 server (enhanced, 70+ commands)
│   └── package.json          # Dependencies
├── web/                      # Web interface
│   ├── index.html            # v0.2 basic UI
│   ├── index-enhanced.html   # v0.3 Stream Deck UI
│   ├── app.js               # v0.2 client
│   ├── app-enhanced.js      # v0.3 client
│   └── style.css            # Shared styles
├── docs/                     # Documentation
│   ├── index.html           # GitHub Pages landing
│   └── *.md                 # Various guides
├── scripts/                  # Utility scripts
│   ├── prepare-release.sh   # Package releases
│   └── create-github-release.sh
├── .github/
│   └── ISSUE_TEMPLATE/      # Beta feedback form
├── EASY_TEST.bat            # v0.2 launcher
├── EASY_TEST_ENHANCED.bat   # v0.3 launcher
└── README.md               # Main documentation
```

## Technology Stack

- **Backend**: Node.js, Express, WebSocket
- **Frontend**: Vanilla JS, Web Speech API (Chrome)
- **OBS Integration**: obs-websocket-js v5
- **Target**: Windows 10/11 users with OBS Studio
- **Distribution**: GitHub releases, .tar.gz packages

## Version Comparison

| Version | Commands | Features | Status |
|---------|----------|----------|---------|
| v0.2.0 | 20 | Basic voice control | Released |
| v0.3.0 | 70+ | Stream Deck alternative | Ready |
| v1.0.0 | 100+ | Custom commands, Mac/Linux | Planned |

## Key Features (v0.3.0)

### Voice Control
- Hold-to-talk design
- Chrome Web Speech API
- Fuzzy command matching
- 70+ built-in commands

### Stream Deck Alternative
- One-click macro buttons
- Pre-programmed sequences
- Emergency controls
- No hardware needed

### Advanced OBS Control
- Audio mixer with sliders
- Transition controls
- Filter toggles
- Studio mode
- Virtual camera
- Screenshots

## Development Workflow

### Local Testing
```bash
# Basic version
cd server && node index.js
# Open web/index.html in Chrome

# Enhanced version
cd server && node index-enhanced.js
# Open web/index-enhanced.html in Chrome
```

### Creating Releases
1. Update version in package.json
2. Run `scripts/prepare-release.sh`
3. Run `scripts/create-github-release.sh`
4. Package uploaded automatically

### Git Workflow
- SSH key configured for automatic operations
- GitHub token in `.github_token` (gitignored)
- Auto-commit hook may be active
- Main branch = production

## Common Tasks

### Adding New Voice Commands
1. Edit `server/index-enhanced.js`
2. Add to `COMMAND_MAP` object
3. Implement helper function if needed
4. Test with hold-to-talk

### Creating New Macros
1. Add to `executeStreamDeckMacro()` function
2. Create button in `web/index-enhanced.html`
3. Wire up in macro grid

### Updating Documentation
- README.md - Main user guide
- README_FOR_KIDS.md - Simplified guide
- docs/ folder - Additional guides
- Keep language simple and friendly

## API Endpoints

### WebSocket (ws://localhost:8090)
- `voice_command` - Process voice input
- `get_status` - Request OBS status

### REST API (http://localhost:3030)
- GET `/health` - Server status
- GET `/commands` - List all commands
- POST `/execute` - Execute command

## Important Notes

1. **Chrome Required**: Web Speech API only works in Chrome
2. **OBS WebSocket**: Must be enabled, no password, port 4455
3. **Windows Focus**: Built for Windows users primarily
4. **Kid-Friendly**: 13-year-old target audience
5. **Free Forever**: Open source, no monetization

## Known Issues

1. Only works in Chrome (Web Speech API limitation)
2. Scene names must roughly match commands
3. Windows .bat files don't work on Mac/Linux
4. Some OBS features require specific setup

## Testing Checklist

- [ ] OBS WebSocket enabled
- [ ] Chrome browser
- [ ] Microphone permissions granted
- [ ] Test basic commands first
- [ ] Verify Stream Deck macros
- [ ] Check audio mixer controls

## Support Resources

- GitHub Issues: Bug reports and features
- Beta Feedback: Issue template provided
- Social Media: Templates in docs/
- Target Communities: r/obs, r/streaming

## Philosophy

"Make streaming accessible to everyone - especially kids who dream of being the next big creator. No $149 hardware required, just your voice and Chrome."

Built by a dad whose 13-year-old wanted to stream like a pro!