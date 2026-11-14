#!/bin/sh
# Xcode Cloud clones the repository without generated CocoaPods artifacts.
# Generate PanditTalk.xcworkspace before Xcode selects the build workspace.
set -eu

SCRIPT_DIR="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
MOBILE_DIR="$(CDPATH= cd -- "$SCRIPT_DIR/../.." && pwd)"

cd "$MOBILE_DIR"

# Xcode Cloud images do not guarantee that Node is already on PATH. CocoaPods
# is included with the Xcode Cloud image, but verify both tools before invoking
# them so a missing prerequisite is reported clearly instead of as exit 127.
if ! command -v npm >/dev/null 2>&1; then
  echo "npm is unavailable; installing Node with Homebrew"
  brew install node
fi

if ! command -v pod >/dev/null 2>&1; then
  echo "CocoaPods is unavailable on this Xcode Cloud image" >&2
  exit 1
fi

echo "Node: $(node --version)"
echo "npm: $(npm --version)"
echo "CocoaPods: $(pod --version)"
npm ci --ignore-scripts

cd ios
pod install --repo-update

test -d PanditTalk.xcworkspace
