#!/bin/bash

# Simple script to start a local web server for testing the PWA
# This will work on macOS without needing to install anything extra

PORT=8000
DIR="$(dirname "$0")"

echo "═══════════════════════════════════════════════════════════"
echo "  ZH Bible Verse Memorizer - PWA Test Server"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "Starting server on port $PORT..."
echo ""

cd "$DIR"

# Check if Python 3 is available
if command -v python3 &> /dev/null; then
    echo "✓ Using Python 3"
    echo ""
    echo "Server is running at:"
    echo "  → http://localhost:$PORT"
    echo "  → http://127.0.0.1:$PORT"
    echo ""
    echo "Open this URL in your browser to test the PWA."
    echo "Press Ctrl+C to stop the server."
    echo ""
    echo "═══════════════════════════════════════════════════════════"
    echo ""
    python3 -m http.server $PORT
elif command -v python &> /dev/null; then
    echo "✓ Using Python 2"
    echo ""
    echo "Server is running at:"
    echo "  → http://localhost:$PORT"
    echo "  → http://127.0.0.1:$PORT"
    echo ""
    echo "Open this URL in your browser to test the PWA."
    echo "Press Ctrl+C to stop the server."
    echo ""
    echo "═══════════════════════════════════════════════════════════"
    echo ""
    python -m SimpleHTTPServer $PORT
else
    echo "✗ Python is not installed or not in PATH"
    echo ""
    echo "Please install Python or use another method to serve the files."
    echo "See README.md for alternative options."
    exit 1
fi
