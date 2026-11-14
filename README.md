# ZeroTrash

Next-generation cross-platform application uninstaller, leftover scanner, system cleaner, and Pro maintenance toolkit built with **Rust** and **React / TypeScript** (with **Tauri v2** & standalone native macOS launcher support).

## Highlights

- **Simple & Pro Modes**: Clean, beginner-friendly sidebar in **Simple Mode** with Quick-Start Smart Care cards, plus a full **Pro Tools** drawer and **`Cmd+K`** (`Ctrl+K`) Command Palette for power users.
- **Application & Bundle Inspector**: Deep-scans installed apps, inspects Mach-O architectures (`arm64`, `x86_64`, `Universal` on macOS), and maps associated leftovers (`Application Support`, `Caches`, `Preferences`, `Containers`, `Group Containers`, `LaunchAgents`, `LaunchDaemons`, `Receipts`).
- **4 Exclusive Pro Tools**:
  - **AI Model Vault**: Scans local LLM/AI weights and caches (Ollama, HuggingFace, LM Studio, Whisper, PyTorch, CoreML) and frees gigabytes safely.
  - **Ghost Space Radar**: Detects hidden disk consumers (macOS APFS snapshots, Time Machine local snapshots, Docker VM disks, Xcode Simulators, `/private/var/vm`) with safe reclamation hints.
  - **Telemetry & Privacy Shield**: Audits diagnostic logs, crash reports, browser tracking caches, and third-party telemetry daemons.
  - **App Time-Capsule**: Creates snapshots of application support & preference state before risky updates or resets, with 1-click restore.
- **System Cleanup & Optimization**:
  - **Orphaned Data & Developer Caches** (Xcode DerivedData, Cargo, npm, Gradle, CocoaPods, pip, Homebrew).
  - **Universal Binary Slimmer** (macOS: strips unused architectures from Universal Mach-O binaries).
  - **Duplicate Finder & Space Lens** (visual storage breakdown & large/old file scanner).
  - **File Shredder** (multi-pass secure deletion) & **Trash History** (macOS).
  - **Export Audit Report** with native **Save As** dialog across macOS, Linux, and Windows.
- **Hardened Local Bridge**: Loopback-only `Host` & `Origin` validation, JSON `Content-Type` enforcement, and canonicalized static asset serving.

## Platform Support

| Feature | macOS | Linux | Windows |
| :--- | :---: | :---: | :---: |
| App Uninstaller & Deep Scan | Full | `.desktop` apps | Registry Uninstall keys |
| Startup Items, Caches, Space Lens, Shredder | Full | Full | Full |
| Exclusive Pro Tools (AI Vault, Ghost Space, Telemetry, Time-Capsule) | Full | Full | Full |
| Native Save As Dialog (`Export Audit Report`) | AppleScript | `zenity` / `kdialog` | PowerShell `SaveFileDialog` |
| Orphaned Data, Package Managers, Duplicates, Trash History, Universal Slimmer | Full | Planned | Planned |

## Development

```bash
# Install frontend dependencies
npm install

# Build the standalone Rust engine CLI
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
npm run build
npm run tauri:build
```

Multi-platform release builds (`.dmg`, `.exe`, `.msi`, `.deb`, `.AppImage`) are also automated via [`.github/workflows/release.yml`](.github/workflows/release.yml).

## License

[MIT](LICENSE)
