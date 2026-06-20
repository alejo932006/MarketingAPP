#!/bin/bash

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$PROJECT_DIR"

export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"
[ -f "$HOME/.zshrc" ] && source "$HOME/.zshrc"

osascript <<EOF
tell application "Terminal"
    do script "cd '$PROJECT_DIR' && node index.js"
    do script "cd '$PROJECT_DIR/generador-reels' && npm run dev"
    activate
end tell
EOF
