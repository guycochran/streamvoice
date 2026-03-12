#!/bin/bash

# Update StreamVoice v1.0.1 Release with proper notes
# This script updates the existing release with release notes

set -e

echo "📝 Updating StreamVoice v1.0.1 Release Notes..."

# Configuration
REPO="guycochran/streamvoice"
TAG="v1.0.1"
TITLE="StreamVoice v1.0.1 - OBS Connection Fix 🔧"
RELEASE_NOTES_FILE="./release-prep/RELEASE_NOTES_v1.0.1.md"

# Check if release notes exist
if [ ! -f "$RELEASE_NOTES_FILE" ]; then
    echo "❌ Error: Release notes not found at $RELEASE_NOTES_FILE"
    exit 1
fi

# Read GitHub token
if [ -f ".github_token" ]; then
    GITHUB_TOKEN=$(cat .github_token)
else
    echo "❌ Error: GitHub token not found at .github_token"
    exit 1
fi

echo "📝 Reading release notes..."
RELEASE_NOTES=$(cat "$RELEASE_NOTES_FILE")

# Get the release ID
echo "🔍 Finding release ID..."
RELEASE_ID=$(curl -s https://api.github.com/repos/$REPO/releases/tags/$TAG | jq -r '.id')

if [ "$RELEASE_ID" = "null" ]; then
    echo "❌ Error: Release not found for tag $TAG"
    exit 1
fi

echo "📦 Updating release on GitHub (ID: $RELEASE_ID)..."
RESPONSE=$(curl -s -X PATCH \
    -H "Authorization: Bearer $GITHUB_TOKEN" \
    -H "Accept: application/vnd.github.v3+json" \
    https://api.github.com/repos/$REPO/releases/$RELEASE_ID \
    -d @- <<EOF
{
    "name": "$TITLE",
    "body": $(echo "$RELEASE_NOTES" | jq -Rs .)
}
EOF
)

# Extract the release URL
RELEASE_URL=$(echo "$RESPONSE" | jq -r '.html_url')

if [ "$RELEASE_URL" = "null" ]; then
    echo "❌ Error updating release:"
    echo "$RESPONSE" | jq .
    exit 1
fi

echo "✅ Release updated successfully!"
echo "📎 Release URL: $RELEASE_URL"
echo ""
echo "🎉 Release v1.0.1 notes have been updated!"
echo ""
echo "⏳ GitHub Actions is building the installer..."
echo "Check the Actions tab to monitor the build progress"