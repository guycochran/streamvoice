#!/bin/bash

# Script to create GitHub release for StreamVoice v1.0.8

set -e

echo "Creating GitHub release for StreamVoice v1.0.8..."

# Navigate to repo root
cd "$(dirname "$0")/.."

# Add all changes
git add -A

# Commit changes
git commit -m "Release v1.0.8 - GitHub Actions build fix

- Moved electron-builder config to separate file
- Fixed automated build failures
- Improved packaging configuration"

# Create and push tag
git tag -a v1.0.8 -m "StreamVoice v1.0.8 - GitHub Actions build fix"
git push origin main --tags

echo "✅ Release v1.0.8 created and pushed!"
echo "GitHub Actions will now build the Windows installer."
echo "Check progress at: https://github.com/guycochran/streamvoice/actions"