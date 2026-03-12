#!/bin/bash

# Upload additional asset to existing GitHub release

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

# Check if .github_token exists
if [ ! -f ".github_token" ]; then
    echo -e "${RED}❌ Error: .github_token file not found!${NC}"
    exit 1
fi

GITHUB_TOKEN=$(cat .github_token | tr -d '\n')
OWNER="guycochran"
REPO="streamvoice"
TAG="v0.3.0"
ASSET_PATH="StreamVoice-v0.3.0-Windows.zip"

echo "📦 Uploading Windows ZIP to existing release..."

# Get release info
RELEASE_INFO=$(curl -s -H "Authorization: token $GITHUB_TOKEN" \
    https://api.github.com/repos/$OWNER/$REPO/releases/tags/$TAG)

UPLOAD_URL=$(echo $RELEASE_INFO | jq -r '.upload_url' | sed 's/{?name,label}//')

if [ "$UPLOAD_URL" = "null" ]; then
    echo -e "${RED}❌ Release not found!${NC}"
    exit 1
fi

# Upload the Windows ZIP
RESPONSE=$(curl -s -X POST \
    -H "Authorization: token $GITHUB_TOKEN" \
    -H "Content-Type: application/zip" \
    --data-binary @"$ASSET_PATH" \
    "$UPLOAD_URL?name=$(basename $ASSET_PATH)")

DOWNLOAD_URL=$(echo $RESPONSE | jq -r '.browser_download_url')

if [ "$DOWNLOAD_URL" != "null" ]; then
    echo -e "${GREEN}✅ Windows ZIP uploaded successfully!${NC}"
    echo "Download URL: $DOWNLOAD_URL"
else
    echo -e "${RED}❌ Upload failed${NC}"
    echo $RESPONSE | jq -r '.message // .'
fi