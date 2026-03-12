#!/bin/bash

# StreamVoice v1.0.0 Release Script
# This script creates a new GitHub release and uploads the installer

set -e

echo "🚀 Creating StreamVoice v1.0.0 Release..."

# Configuration
REPO="guycochran/streamvoice"
TAG="v1.0.0"
TITLE="StreamVoice v1.0.0 - First Official Release! 🎉"
INSTALLER_PATH="./StreamVoice-Setup-1.0.0.exe"
RELEASE_NOTES_FILE="./RELEASE_NOTES_v1.0.0.md"

# Check if installer exists
if [ ! -f "$INSTALLER_PATH" ]; then
    echo "❌ Error: Installer not found at $INSTALLER_PATH"
    exit 1
fi

# Check if release notes exist
if [ ! -f "$RELEASE_NOTES_FILE" ]; then
    echo "❌ Error: Release notes not found at $RELEASE_NOTES_FILE"
    exit 1
fi

# Read GitHub token
if [ -f "../.github_token" ]; then
    GITHUB_TOKEN=$(cat ../.github_token)
else
    echo "❌ Error: GitHub token not found at ../.github_token"
    exit 1
fi

echo "📝 Reading release notes..."
RELEASE_NOTES=$(cat "$RELEASE_NOTES_FILE")

# Create the release
echo "📦 Creating release on GitHub..."
RESPONSE=$(curl -s -X POST \
    -H "Authorization: Bearer $GITHUB_TOKEN" \
    -H "Accept: application/vnd.github.v3+json" \
    https://api.github.com/repos/$REPO/releases \
    -d @- <<EOF
{
    "tag_name": "$TAG",
    "target_commitish": "main",
    "name": "$TITLE",
    "body": $(echo "$RELEASE_NOTES" | jq -Rs .),
    "draft": false,
    "prerelease": false
}
EOF
)

# Extract the upload URL
UPLOAD_URL=$(echo "$RESPONSE" | jq -r '.upload_url' | sed 's/{?name,label}//')
RELEASE_URL=$(echo "$RESPONSE" | jq -r '.html_url')

if [ "$UPLOAD_URL" = "null" ]; then
    echo "❌ Error creating release:"
    echo "$RESPONSE" | jq .
    exit 1
fi

echo "✅ Release created successfully!"
echo "📎 Release URL: $RELEASE_URL"

# Upload the installer
echo "📤 Uploading installer..."
UPLOAD_RESPONSE=$(curl -s -X POST \
    -H "Authorization: Bearer $GITHUB_TOKEN" \
    -H "Content-Type: application/octet-stream" \
    --data-binary "@$INSTALLER_PATH" \
    "$UPLOAD_URL?name=StreamVoice-Setup-1.0.0.exe&label=Windows%20Installer")

DOWNLOAD_URL=$(echo "$UPLOAD_RESPONSE" | jq -r '.browser_download_url')

if [ "$DOWNLOAD_URL" = "null" ]; then
    echo "❌ Error uploading installer:"
    echo "$UPLOAD_RESPONSE" | jq .
    exit 1
fi

echo "✅ Installer uploaded successfully!"
echo "💾 Download URL: $DOWNLOAD_URL"
echo ""
echo "🎉 Release v1.0.0 is now live!"
echo ""
echo "Next steps:"
echo "1. Visit: $RELEASE_URL"
echo "2. Verify the installer download works"
echo "3. Share on social media"
echo "4. Post to Reddit communities"
echo "5. Set up Discord server"

# Update README.md with download link
echo ""
echo "📝 Don't forget to update the README.md with the new download link:"
echo "[Download StreamVoice v1.0.0]($DOWNLOAD_URL)"