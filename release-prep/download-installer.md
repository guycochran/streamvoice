# How to Download the Windows Installer

The Windows installer is available as an artifact from our successful GitHub Actions build.

## Option 1: Direct from GitHub Actions (Recommended)
1. Go to: https://github.com/guycochran/streamvoice/actions/runs/23003817878
2. Scroll down to "Artifacts" section
3. Click on "StreamVoice-Windows" (77MB)
4. This will download a ZIP file containing the installer

## Option 2: Using GitHub CLI
If you have GitHub CLI installed:
```bash
gh run download 23003817878 -n StreamVoice-Windows
```

## Option 3: Direct API (Requires Auth)
```bash
# You need a GitHub token for this
curl -L \
  -H "Authorization: Bearer YOUR_GITHUB_TOKEN" \
  -o streamvoice-installer.zip \
  https://api.github.com/repos/guycochran/streamvoice/actions/artifacts/5891125616/zip
```

## After Download
1. Extract the ZIP file
2. You should find: StreamVoice-Setup-1.0.0.exe
3. This is the installer ready for testing!

## Testing Notes
- File size should be around 77MB
- Installer filename: StreamVoice-Setup-1.0.0.exe
- Test on a clean Windows 10/11 machine
- Ensure OBS Studio is installed first
- Chrome browser required for voice control