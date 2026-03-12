#!/bin/bash

# StreamVoice v1.0.1 Release Script
# This script creates a new GitHub release

set -e

echo "🚀 Creating StreamVoice v1.0.1 Release..."

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

# Extract the release URL
RELEASE_URL=$(echo "$RESPONSE" | jq -r '.html_url')

if [ "$RELEASE_URL" = "null" ]; then
    echo "❌ Error creating release:"
    echo "$RESPONSE" | jq .
    exit 1
fi

echo "✅ Release created successfully!"
echo "📎 Release URL: $RELEASE_URL"
echo ""
echo "🎉 Release v1.0.1 is now live!"
echo ""
echo "⏳ GitHub Actions will build and upload the installer automatically"
echo "Check the Actions tab to monitor the build progress"