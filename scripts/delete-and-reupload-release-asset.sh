#!/bin/bash

# Delete and re-upload asset to GitHub release

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
ASSET_NAME="StreamVoice-v0.3.0-Windows.zip"
ASSET_PATH="StreamVoice-v0.3.0-Windows.zip"

echo "📦 Updating Windows ZIP on release..."

# Get release info
RELEASE_INFO=$(curl -s -H "Authorization: token $GITHUB_TOKEN" \
    https://api.github.com/repos/$OWNER/$REPO/releases/tags/$TAG)

RELEASE_ID=$(echo $RELEASE_INFO | jq -r '.id')
UPLOAD_URL=$(echo $RELEASE_INFO | jq -r '.upload_url' | sed 's/{?name,label}//')

if [ "$RELEASE_ID" = "null" ]; then
    echo -e "${RED}❌ Release not found!${NC}"
    exit 1
fi

# Get existing assets
ASSETS=$(curl -s -H "Authorization: token $GITHUB_TOKEN" \
    https://api.github.com/repos/$OWNER/$REPO/releases/$RELEASE_ID/assets)

# Find and delete existing Windows ZIP
EXISTING_ID=$(echo $ASSETS | jq -r '.[] | select(.name == "'"$ASSET_NAME"'") | .id')

if [ ! -z "$EXISTING_ID" ] && [ "$EXISTING_ID" != "null" ]; then
    echo "🗑️  Deleting existing asset..."
    curl -s -X DELETE \
        -H "Authorization: token $GITHUB_TOKEN" \
        https://api.github.com/repos/$OWNER/$REPO/releases/assets/$EXISTING_ID
    sleep 2
fi

# Upload the new Windows ZIP
echo "📤 Uploading new version..."
RESPONSE=$(curl -s -X POST \
    -H "Authorization: token $GITHUB_TOKEN" \
    -H "Content-Type: application/zip" \
    --data-binary @"$ASSET_PATH" \
    "$UPLOAD_URL?name=$(basename $ASSET_PATH)")

DOWNLOAD_URL=$(echo $RESPONSE | jq -r '.browser_download_url')

if [ "$DOWNLOAD_URL" != "null" ]; then
    echo -e "${GREEN}✅ Windows ZIP updated successfully!${NC}"
    echo "Download URL: $DOWNLOAD_URL"
else
    echo -e "${RED}❌ Upload failed${NC}"
    echo $RESPONSE | jq -r '.message // .'
fi