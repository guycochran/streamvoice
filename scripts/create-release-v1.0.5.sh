#!/bin/bash

# StreamVoice v1.0.5 Release Script

# Check if we have the GitHub token
if [ -f .github_token ]; then
    GITHUB_TOKEN=$(cat .github_token)
elif [ -f ~/.github_token ]; then
    GITHUB_TOKEN=$(cat ~/.github_token)
else
    echo "❌ GitHub token not found at .github_token or ~/.github_token"
    exit 1
fi
REPO="guycochran/streamvoice"
TAG="v1.0.5"
RELEASE_TITLE="StreamVoice v1.0.5 - The Reliability Update"

# Read the release notes
RELEASE_NOTES=$(cat RELEASE_NOTES_v1.0.5.md)

echo "📦 Creating StreamVoice v1.0.5 Release..."

# Create the release on GitHub
# This will trigger the GitHub Actions workflow to build the .exe
curl -X POST \
  -H "Accept: application/vnd.github+json" \
  -H "Authorization: Bearer $GITHUB_TOKEN" \
  -H "X-GitHub-Api-Version: 2022-11-28" \
  https://api.github.com/repos/$REPO/releases \
  -d @- << EOF
{
  "tag_name": "$TAG",
  "target_commitish": "main",
  "name": "$RELEASE_TITLE",
  "body": $(echo "$RELEASE_NOTES" | jq -Rs .),
  "draft": false,
  "prerelease": false,
  "generate_release_notes": false
}
EOF

echo -e "\n\n✅ Release created! The GitHub Action will now build the Windows installer."
echo "📍 Check the build progress at: https://github.com/$REPO/actions"
echo "🎯 Once complete, the .exe will be attached to: https://github.com/$REPO/releases/tag/$TAG"