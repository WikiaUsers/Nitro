#!/bin/sh
cd "${0%/*}"
set -e
echo "Deleting old files..."
rm -rf wikia-nitro-*
rm -rf *.zip
# Generate all builds.
echo "Generating new builds..."
electron-packager .. --all --electron-version=6.0.2
# Windows.
echo "Packaging Windows builds..."
zip -qr win32-ia32 wikia-nitro-win32-ia32
zip -qr win32-x64 wikia-nitro-win32-x64
# Linux.
echo "Packaging Linux builds..."
zip -qr linux-x64 wikia-nitro-linux-x64
zip -qr linux-arm64 wikia-nitro-linux-arm64
zip -qr linux-armv7l wikia-nitro-linux-armv7l
# Mac.
echo "Packaging macOS builds..."
# zip -qr mas-x64 wikia-nitro-mas-x64
zip -qr darwin-x64 wikia-nitro-darwin-x64

echo "Done."
