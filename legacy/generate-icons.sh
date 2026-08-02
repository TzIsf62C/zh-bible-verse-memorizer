#!/bin/bash

# Script to generate PWA icons from SVG
# This script uses ImageMagick (convert command) or rsvg-convert
# Install with: brew install imagemagick librsvg (on macOS)

cd "$(dirname "$0")/icons"

SIZES=(72 96 128 144 152 192 384 512)

echo "Generating PWA icons..."

# Check if rsvg-convert is available (better quality for SVG)
if command -v rsvg-convert &> /dev/null; then
    echo "Using rsvg-convert for high-quality conversion"
    for size in "${SIZES[@]}"; do
        echo "Generating ${size}x${size} icon..."
        rsvg-convert -w $size -h $size icon.svg -o "icon-${size}x${size}.png"
    done
# Check if ImageMagick is available
elif command -v convert &> /dev/null; then
    echo "Using ImageMagick convert"
    for size in "${SIZES[@]}"; do
        echo "Generating ${size}x${size} icon..."
        convert -background none -resize "${size}x${size}" icon.svg "icon-${size}x${size}.png"
    done
else
    echo "Error: Neither rsvg-convert nor ImageMagick is installed."
    echo "Please install one of them:"
    echo "  macOS: brew install librsvg"
    echo "  or:    brew install imagemagick"
    echo ""
    echo "Alternative: Use an online SVG to PNG converter to manually create the following sizes:"
    for size in "${SIZES[@]}"; do
        echo "  - icon-${size}x${size}.png"
    done
    exit 1
fi

echo "Icon generation complete!"
