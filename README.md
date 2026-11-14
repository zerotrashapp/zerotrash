# ZeroTrash

Cross-platform application uninstaller, leftover scanner, and startup service manager built with **Tauri v2 (Rust)** and **React / TypeScript**.

## Features

- **Application & Bundle Inspector**: Scans `/Applications` and `~/Applications`, inspects Mach-O headers (`arm64`, `x86_64`, `Universal`), and maps associated files across 18 system and user `Library` directories (`Application Support`, `Caches`, `Preferences`, `Containers`, `Group Containers`, `Saved Application State`, `HTTPStorages`, `WebKit`, `LaunchAgents`, `LaunchDaemons`, `PrivilegedHelperTools`, and `/private/var/db/receipts`).
- **Orphaned Data Detection**: Cross-references `~/Library` directories against currently installed application bundle identifiers to surface residual folders left behind by previously deleted apps.
- **Launchd Service Manager**: Lists user and system `LaunchAgents` and `LaunchDaemons`, correlates active PIDs from `launchctl list`, flags missing target binaries, and supports loading/unloading services.
- **Package Manager Integration**: Inspects and removes packages from Homebrew Formulae, Homebrew Casks, global `npm`, `winget`/`scoop`/`choco` (Windows), and `flatpak`/`snap` (Linux).
- **Safe Removal & App Reset**: Supports moving files to `~/.Trash`, permanent deletion, or removing only support/cache files to reset an application to a clean state.

## Development

```bash
# Build the standalone Rust CLI engine
cd src-tauri
cargo build --release --bin zerotrash-cli --no-default-features

# Start the development server
cd ..
npm run dev

# Launch the native Tauri desktop window
npm run tauri:dev
```

## Production Build

```bash
npm run tauri:build
```
