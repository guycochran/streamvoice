#!/bin/bash

# StreamVoice GitHub Release Creator
# This script creates a GitHub release using the API

# Color codes for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 StreamVoice GitHub Release Creator${NC}"
echo ""

# Check if .github_token exists
if [ ! -f ".github_token" ]; then
    echo -e "${RED}❌ Error: .github_token file not found!${NC}"
    echo ""
    echo "To create a GitHub token:"
    echo "1. Go to: https://github.com/settings/tokens/new"
    echo "2. Name: 'StreamVoice Release Creator'"
    echo "3. Expiration: 90 days"
    echo "4. Scopes: Check 'repo'"
    echo "5. Generate token and save it in .github_token file"
    echo ""
    echo "Example:"
    echo "echo 'ghp_YOUR_TOKEN_HERE' > .github_token"
    exit 1
fi

# Read the token
GITHUB_TOKEN=$(cat .github_token | tr -d '\n')

# Check if token looks valid
if [[ ! "$GITHUB_TOKEN" =~ ^ghp_ ]] && [[ ! "$GITHUB_TOKEN" =~ ^github_pat_ ]]; then
    echo -e "${RED}❌ Error: Invalid token format in .github_token${NC}"
    echo "GitHub tokens should start with 'ghp_' or 'github_pat_'"
    exit 1
fi

# Release information
OWNER="guycochran"
REPO="streamvoice"
TAG="v0.3.0"
NAME="StreamVoice v0.3.0 - Stream Deck Alternative! 🎯"
PRERELEASE=true
ASSET_PATH="StreamVoice-v0.3.0.tar.gz"

# Read release notes
if [ ! -f "RELEASE_NOTES_v0.3.0.md" ]; then
    echo -e "${RED}❌ Error: RELEASE_NOTES_v0.3.0.md not found!${NC}"
    exit 1
fi

# Escape the body content for JSON
BODY=$(cat RELEASE_NOTES_v0.3.0.md | jq -Rs .)

echo "Creating release for tag: $TAG"
echo ""

# Create the release
echo -e "${YELLOW}📝 Creating release...${NC}"
RESPONSE=$(curl -s -X POST \
  -H "Authorization: token $GITHUB_TOKEN" \
  -H "Accept: application/vnd.github.v3+json" \
  https://api.github.com/repos/$OWNER/$REPO/releases \
  -d "{
    \"tag_name\": \"$TAG\",
    \"name\": \"$NAME\",
    \"body\": $BODY,
    \"draft\": false,
    \"prerelease\": $PRERELEASE
  }")

# Check if release was created successfully
RELEASE_ID=$(echo $RESPONSE | jq -r '.id')
if [ "$RELEASE_ID" = "null" ]; then
    echo -e "${RED}❌ Error creating release:${NC}"
    echo $RESPONSE | jq -r '.message // .'
    exit 1
fi

UPLOAD_URL=$(echo $RESPONSE | jq -r '.upload_url' | sed 's/{?name,label}//')
HTML_URL=$(echo $RESPONSE | jq -r '.html_url')

echo -e "${GREEN}✅ Release created successfully!${NC}"
echo "Release URL: $HTML_URL"
echo ""

# Upload the asset
if [ -f "$ASSET_PATH" ]; then
    echo -e "${YELLOW}📦 Uploading release asset...${NC}"

    ASSET_RESPONSE=$(curl -s -X POST \
      -H "Authorization: token $GITHUB_TOKEN" \
      -H "Content-Type: application/gzip" \
      --data-binary @"$ASSET_PATH" \
      "$UPLOAD_URL?name=$(basename $ASSET_PATH)")

    ASSET_ID=$(echo $ASSET_RESPONSE | jq -r '.id')
    if [ "$ASSET_ID" = "null" ]; then
        echo -e "${RED}❌ Error uploading asset:${NC}"
        echo $ASSET_RESPONSE | jq -r '.message // .'
    else
        echo -e "${GREEN}✅ Asset uploaded successfully!${NC}"
        DOWNLOAD_URL=$(echo $ASSET_RESPONSE | jq -r '.browser_download_url')
        echo "Download URL: $DOWNLOAD_URL"
    fi
else
    echo -e "${YELLOW}⚠️  Warning: $ASSET_PATH not found, skipping asset upload${NC}"
fi

echo ""
echo -e "${GREEN}🎉 Release published!${NC}"
echo ""
echo "Next steps:"
echo "1. View release: $HTML_URL"
echo "2. Share the release link with beta testers"
echo "3. Post on social media using the templates in docs/SOCIAL_MEDIA_POSTS.md"
echo ""
echo "Beta testers can download from:"
echo "https://github.com/guycochran/streamvoice/releases/download/v0.3.0/StreamVoice-v0.3.0.tar.gz"