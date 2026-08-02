#!/bin/bash
# Serve the production PWA build for testing

# Kill any existing server on port 8080
lsof -ti:8080 | xargs kill -9 2>/dev/null || true

# Navigate to build directory and start server
cd "$(dirname "$0")/build" || exit 1

echo "Starting PWA server on port 8080..."
echo "Access the app at: http://localhost:8080"
echo ""
echo "In GitHub Codespaces, the port should be automatically forwarded."
echo "Check the 'Ports' tab in VS Code to get the public URL for phone access."
echo ""
echo "Press Ctrl+C to stop the server."
echo ""

python3 -m http.server 8080
