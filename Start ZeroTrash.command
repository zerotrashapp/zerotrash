#!/bin/zsh
cd "$(dirname "$0")"
export PATH="$HOME/.cargo/bin:/opt/homebrew/bin:/usr/local/bin:$PATH"

echo "Starting ZeroTrash on http://localhost:1420 ..."
(sleep 1 && open "http://localhost:1420") &
npm run dev
