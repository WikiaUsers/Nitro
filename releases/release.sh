#!/bin/sh
cd "${0%/*}"
set -e
echo "Deleting old files..."
rm -rf fandom-nitro-*
rm -rf *.zip
# Generate all builds.
echo "Generating new builds..."
electron-packager .. --all --electron-version=6.0.2
# Windows.
echo "Packaging Windows builds..."
zip -qr win32-ia32 fandom-nitro-win32-ia32
zip -qr win32-x64 fandom-nitro-win32-x64
# Linux.
echo "Packaging Linux builds..."
zip -qr linux-x64 fandom-nitro-linux-x64
zip -qr linux-arm64 fandom-nitro-linux-arm64
zip -qr linux-armv7l fandom-nitro-linux-armv7l
# Mac.
echo "Packaging macOS builds..."
# zip -qr mas-x64 fandom-nitro-mas-x64
zip -qr darwin-x64 fandom-nitro-darwin-x64

echo "Done."
