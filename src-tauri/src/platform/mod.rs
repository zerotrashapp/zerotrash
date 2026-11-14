#[cfg(target_os = "linux")]
pub mod linux;
#[cfg(target_os = "macos")]
pub mod macos;
#[cfg(target_os = "windows")]
pub mod windows;

use crate::models::*;

pub fn get_system_overview(engine_mode: &str) -> SystemOverview {
    #[cfg(target_os = "macos")]
    return macos::get_system_overview(engine_mode);

    #[cfg(target_os = "windows")]
    return windows::get_system_overview(engine_mode);

    #[cfg(target_os = "linux")]
    return linux::get_system_overview(engine_mode);

    #[cfg(not(any(target_os = "macos", target_os = "windows", target_os = "linux")))]
    macos::get_system_overview(engine_mode)
}

pub fn scan_installed_apps() -> Vec<InstalledApp> {
    #[cfg(target_os = "macos")]
    return macos::scan_installed_apps();

    #[cfg(target_os = "windows")]
    return windows::scan_installed_apps();

    #[cfg(target_os = "linux")]
    return linux::scan_installed_apps();

    #[cfg(not(any(target_os = "macos", target_os = "windows", target_os = "linux")))]
    Vec::new()
}

pub fn deep_scan_app(app_path: &str) -> Result<AppDeepScanResult, String> {
    #[cfg(target_os = "macos")]
    return macos::deep_scan_app(app_path);

    #[cfg(target_os = "windows")]
    return windows::deep_scan_app(app_path);

    #[cfg(target_os = "linux")]
    return linux::deep_scan_app(app_path);

    #[cfg(not(any(target_os = "macos", target_os = "windows", target_os = "linux")))]
    Err("Unsupported OS".to_string())
}

pub fn scan_orphaned_items() -> Vec<OrphanedItem> {
    #[cfg(target_os = "macos")]
    return macos::scan_orphaned_items();

    #[cfg(target_os = "windows")]
    return windows::scan_orphaned_items();

    #[cfg(target_os = "linux")]
    return linux::scan_orphaned_items();

    #[cfg(not(any(target_os = "macos", target_os = "windows", target_os = "linux")))]
    Vec::new()
}

pub fn scan_startup_items() -> Vec<StartupItem> {
    #[cfg(target_os = "macos")]
    return macos::scan_startup_items();

    #[cfg(target_os = "windows")]
    return windows::scan_startup_items();

    #[cfg(target_os = "linux")]
    return linux::scan_startup_items();

    #[cfg(not(any(target_os = "macos", target_os = "windows", target_os = "linux")))]
    Vec::new()
}

pub fn toggle_startup_item(plist_path: &str, enable: bool) -> Result<String, String> {
    #[cfg(target_os = "macos")]
    return macos::toggle_startup_item(plist_path, enable);

    #[cfg(target_os = "windows")]
    return windows::toggle_startup_item(plist_path, enable);

    #[cfg(target_os = "linux")]
    return linux::toggle_startup_item(plist_path, enable);

    #[cfg(not(any(target_os = "macos", target_os = "windows", target_os = "linux")))]
    Err("Unsupported OS".to_string())
}

pub fn scan_managed_packages() -> Vec<ManagedPackage> {
    #[cfg(target_os = "macos")]
    return macos::scan_managed_packages();

    #[cfg(target_os = "windows")]
    return windows::scan_managed_packages();

    #[cfg(target_os = "linux")]
    return linux::scan_managed_packages();

    #[cfg(not(any(target_os = "macos", target_os = "windows", target_os = "linux")))]
    Vec::new()
}

pub fn uninstall_managed_package(manager: &str, name: &str) -> Result<String, String> {
    #[cfg(target_os = "macos")]
    return macos::uninstall_managed_package(manager, name);

    #[cfg(target_os = "windows")]
    return windows::uninstall_managed_package(manager, name);

    #[cfg(target_os = "linux")]
    return linux::uninstall_managed_package(manager, name);

    #[cfg(not(any(target_os = "macos", target_os = "windows", target_os = "linux")))]
    Err("Unsupported OS".to_string())
}

pub fn scan_system_plugins() -> Vec<SystemPlugin> {
    #[cfg(target_os = "macos")]
    return macos::scan_system_plugins();

    #[cfg(target_os = "windows")]
    return windows::scan_system_plugins();

    #[cfg(target_os = "linux")]
    return linux::scan_system_plugins();

    #[cfg(not(any(target_os = "macos", target_os = "windows", target_os = "linux")))]
    Vec::new()
}

pub fn get_performance_snapshot() -> PerformanceSnapshot {
    #[cfg(target_os = "macos")]
    return macos::get_performance_snapshot();

    #[cfg(target_os = "windows")]
    return windows::get_performance_snapshot();

    #[cfg(target_os = "linux")]
    return linux::get_performance_snapshot();

    #[cfg(not(any(target_os = "macos", target_os = "windows", target_os = "linux")))]
    PerformanceSnapshot {
        uptime: "Active".to_string(),
        load_average: "0.00".to_string(),
        memory_pressure: "Normal".to_string(),
        swap_used: "0M".to_string(),
        local_snapshots_count: 0,
        cpu_brand: "CPU".to_string(),
        cpu_cores: 4,
        ram_total_bytes: 8 * 1024 * 1024 * 1024,
        ram_used_bytes: 4 * 1024 * 1024 * 1024,
        ram_wired_bytes: 0,
        ram_compressed_bytes: 0,
        battery_present: false,
        battery_percent: 100,
        battery_charging: false,
        battery_health_pct: 100,
        battery_cycle_count: 0,
        battery_temperature_c: 0.0,
        battery_condition: "Normal".to_string(),
        top_processes: Vec::new(),
        tasks: Vec::new(),
    }
}

pub fn run_maintenance_task(task_id: &str) -> Result<MaintenanceResult, String> {
    #[cfg(target_os = "macos")]
    return macos::run_maintenance_task(task_id);

    #[cfg(target_os = "windows")]
    return windows::run_maintenance_task(task_id);

    #[cfg(target_os = "linux")]
    return linux::run_maintenance_task(task_id);

    #[cfg(not(any(target_os = "macos", target_os = "windows", target_os = "linux")))]
    Err("Unsupported OS".to_string())
}

pub fn scan_developer_caches() -> Vec<CacheTarget> {
    #[cfg(target_os = "macos")]
    return macos::scan_developer_caches();

    #[cfg(target_os = "windows")]
    return windows::scan_developer_caches();

    #[cfg(target_os = "linux")]
    return linux::scan_developer_caches();

    #[cfg(not(any(target_os = "macos", target_os = "windows", target_os = "linux")))]
    Vec::new()
}

pub fn scan_large_and_old_files(min_bytes: u64) -> Vec<LargeFileItem> {
    #[cfg(target_os = "macos")]
    return macos::scan_large_and_old_files(min_bytes);

    #[cfg(target_os = "windows")]
    return windows::scan_large_and_old_files(min_bytes);

    #[cfg(target_os = "linux")]
    return linux::scan_large_and_old_files(min_bytes);

    #[cfg(not(any(target_os = "macos", target_os = "windows", target_os = "linux")))]
    Vec::new()
}

pub fn scan_space_lens(target_dir: Option<&str>) -> Result<SpaceLensSnapshot, String> {
    #[cfg(target_os = "macos")]
    return macos::scan_space_lens(target_dir);

    #[cfg(target_os = "windows")]
    return windows::scan_space_lens(target_dir);

    #[cfg(target_os = "linux")]
    return linux::scan_space_lens(target_dir);

    #[cfg(not(any(target_os = "macos", target_os = "windows", target_os = "linux")))]
    Err("Unsupported OS".to_string())
}

pub fn get_protection_snapshot() -> ProtectionSnapshot {
    #[cfg(target_os = "macos")]
    return macos::get_protection_snapshot();

    #[cfg(target_os = "windows")]
    return windows::get_protection_snapshot();

    #[cfg(target_os = "linux")]
    return linux::get_protection_snapshot();

    #[cfg(not(any(target_os = "macos", target_os = "windows", target_os = "linux")))]
    ProtectionSnapshot {
        controls: Vec::new(),
        privacy_items: Vec::new(),
        flagged_persistence: Vec::new(),
    }
}

pub fn run_smart_scan() -> SmartScanReport {
    #[cfg(target_os = "macos")]
    return macos::run_smart_scan();

    #[cfg(target_os = "windows")]
    return windows::run_smart_scan();

    #[cfg(target_os = "linux")]
    return linux::run_smart_scan();

    #[cfg(not(any(target_os = "macos", target_os = "windows", target_os = "linux")))]
    SmartScanReport {
        junk_bytes: 0,
        junk_paths: Vec::new(),
        orphan_bytes: 0,
        orphan_paths: Vec::new(),
        installer_bytes: 0,
        installer_paths: Vec::new(),
        total_reclaimable_bytes: 0,
        security_controls_healthy: 0,
        security_controls_total: 0,
        flagged_agents_count: 0,
        active_agents_count: 0,
        memory_pressure: "Normal".to_string(),
        load_average: "0.00".to_string(),
    }
}

pub fn execute_uninstall(req: UninstallRequest) -> UninstallResult {
    #[cfg(target_os = "macos")]
    return macos::execute_uninstall(req);

    #[cfg(target_os = "windows")]
    return windows::execute_uninstall(req);

    #[cfg(target_os = "linux")]
    return linux::execute_uninstall(req);

    #[cfg(not(any(target_os = "macos", target_os = "windows", target_os = "linux")))]
    UninstallResult {
        success: false,
        removed_paths: vec![],
        failed_paths: req.paths,
        freed_bytes: 0,
        mode: "unsupported".to_string(),
        killed_pids: vec![],
        message: "Unsupported OS".to_string(),
    }
}

pub fn kill_process(pid: u32, force: bool) -> Result<String, String> {
    #[cfg(target_os = "macos")]
    return macos::kill_process(pid, force);

    #[cfg(target_os = "windows")]
    return windows::kill_process(pid, force);

    #[cfg(target_os = "linux")]
    return linux::kill_process(pid, force);

    #[cfg(not(any(target_os = "macos", target_os = "windows", target_os = "linux")))]
    Err("Unsupported OS".to_string())
}

pub fn reveal_in_file_manager(path: &str) -> Result<String, String> {
    #[cfg(target_os = "macos")]
    return macos::reveal_in_finder(path);

    #[cfg(target_os = "windows")]
    return windows::reveal_in_explorer(path);

    #[cfg(target_os = "linux")]
    return linux::reveal_in_file_manager(path);

    #[cfg(not(any(target_os = "macos", target_os = "windows", target_os = "linux")))]
    Err("Unsupported OS".to_string())
}

pub fn scan_universal_apps() -> Vec<UniversalAppItem> {
    #[cfg(target_os = "macos")]
    return macos::scan_universal_apps();

    #[cfg(not(target_os = "macos"))]
    Vec::new()
}

pub fn slim_universal_apps(app_paths: Vec<String>) -> SlimResult {
    #[cfg(target_os = "macos")]
    return macos::slim_universal_apps(app_paths);

    #[cfg(not(target_os = "macos"))]
    SlimResult {
        success: false,
        slimmed_apps: 0,
        slimmed_binaries: 0,
        saved_bytes: 0,
        failed_apps: app_paths,
        message: "Universal Binary slimmer is only supported on macOS.".to_string(),
    }
}

pub fn get_trash_history() -> Vec<TrashHistoryEntry> {
    #[cfg(target_os = "macos")]
    return macos::get_trash_history();

    #[cfg(not(target_os = "macos"))]
    Vec::new()
}

pub fn restore_trash_items(ids: Vec<String>) -> RestoreResult {
    #[cfg(target_os = "macos")]
    return macos::restore_trash_items(ids);

    #[cfg(not(target_os = "macos"))]
    RestoreResult {
        success: false,
        restored_count: 0,
        failed_items: ids,
        message: "Unsupported OS".to_string(),
    }
}

pub fn scan_duplicates() -> Vec<DuplicateGroup> {
    #[cfg(target_os = "macos")]
    return macos::scan_duplicates();

    #[cfg(target_os = "windows")]
    return windows::scan_duplicates();

    #[cfg(target_os = "linux")]
    return linux::scan_duplicates();

    #[cfg(not(any(target_os = "macos", target_os = "windows", target_os = "linux")))]
    Vec::new()
}

pub fn shred_paths(paths: Vec<String>, passes: u8) -> UninstallResult {
    #[cfg(target_os = "macos")]
    return macos::shred_paths(paths, passes);

    #[cfg(target_os = "windows")]
    return windows::shred_paths(paths, passes);

    #[cfg(target_os = "linux")]
    return linux::shred_paths(paths, passes);

    #[cfg(not(any(target_os = "macos", target_os = "windows", target_os = "linux")))]
    UninstallResult {
        success: false,
        removed_paths: vec![],
        failed_paths: paths,
        freed_bytes: 0,
        mode: "unsupported".to_string(),
        killed_pids: vec![],
        message: "Unsupported OS".to_string(),
    }
}

fn user_home() -> std::path::PathBuf {
    std::env::var("HOME")
        .or_else(|_| std::env::var("USERPROFILE"))
        .map(std::path::PathBuf::from)
        .unwrap_or_else(|_| std::path::PathBuf::from("/tmp"))
}

fn dir_size_bounded(path: &std::path::Path, max_depth: usize) -> u64 {
    if !path.exists() {
        return 0;
    }
    if path.is_file() {
        return path.metadata().map(|m| m.len()).unwrap_or(0);
    }
    let mut total = 0u64;
    if max_depth == 0 {
        return 0;
    }
    if let Ok(entries) = std::fs::read_dir(path) {
        for entry in entries.flatten() {
            let p = entry.path();
            if let Ok(meta) = entry.metadata() {
                if meta.is_file() {
                    total += meta.len();
                } else if meta.is_dir() && !meta.file_type().is_symlink() {
                    total += dir_size_bounded(&p, max_depth - 1);
                }
            }
        }
    }
    total
}

fn modified_label(path: &std::path::Path) -> String {
    if let Ok(meta) = path.metadata() {
        if let Ok(m) = meta.modified() {
            if let Ok(elapsed) = m.elapsed() {
                let days = elapsed.as_secs() / 86400;
                if days == 0 {
                    return "Today".to_string();
                } else if days == 1 {
                    return "Yesterday".to_string();
                } else {
                    return format!("{} days ago", days);
                }
            }
        }
    }
    "Recent".to_string()
}

pub fn save_file_with_dialog(default_name: &str, content: &str) -> SaveDialogResult {
    #[cfg(target_os = "macos")]
    {
        let safe_name = default_name.replace('"', "");
        let script = format!(
            "POSIX path of (choose file name with prompt \"Save ZeroTrash File As:\" default name \"{}\")",
            safe_name
        );
        if let Ok(out) = std::process::Command::new("osascript")
            .arg("-e")
            .arg(&script)
            .output()
        {
            if out.status.success() {
                let chosen = String::from_utf8_lossy(&out.stdout).trim().to_string();
                if !chosen.is_empty() {
                    match std::fs::write(&chosen, content.as_bytes()) {
                        Ok(_) => {
                            return SaveDialogResult {
                                saved: true,
                                path: chosen.clone(),
                                message: format!("Saved to {}", chosen),
                            };
                        }
                        Err(e) => {
                            return SaveDialogResult {
                                saved: false,
                                path: String::new(),
                                message: format!("Failed to write file: {}", e),
                            };
                        }
                    }
                }
            } else {
                return SaveDialogResult {
                    saved: false,
                    path: String::new(),
                    message: "Save cancelled by user.".to_string(),
                };
            }
        }
    }

    #[cfg(target_os = "windows")]
    {
        let safe_name = default_name.replace('\'', "");
        let ps = format!(
            "Add-Type -AssemblyName System.Windows.Forms; $f = New-Object System.Windows.Forms.SaveFileDialog; $f.FileName = '{}'; if ($f.ShowDialog() -eq 'OK') {{ Write-Output $f.FileName }}",
            safe_name
        );
        if let Ok(out) = std::process::Command::new("powershell")
            .args(["-NoProfile", "-Command", &ps])
            .output()
        {
            let chosen = String::from_utf8_lossy(&out.stdout).trim().to_string();
            if !chosen.is_empty() && std::fs::write(&chosen, content.as_bytes()).is_ok() {
                return SaveDialogResult {
                    saved: true,
                    path: chosen.clone(),
                    message: format!("Saved to {}", chosen),
                };
            }
        }
    }

    #[cfg(target_os = "linux")]
    {
        if let Ok(out) = std::process::Command::new("zenity")
            .args([
                "--file-selection",
                "--save",
                "--confirm-overwrite",
                &format!("--filename={}", default_name),
            ])
            .output()
        {
            if out.status.success() {
                let chosen = String::from_utf8_lossy(&out.stdout).trim().to_string();
                if !chosen.is_empty() && std::fs::write(&chosen, content.as_bytes()).is_ok() {
                    return SaveDialogResult {
                        saved: true,
                        path: chosen.clone(),
                        message: format!("Saved to {}", chosen),
                    };
                }
            }
        }
    }

    // Fallback to Desktop if dialog unavailable
    let fallback = user_home().join("Desktop").join(default_name);
    match std::fs::write(&fallback, content.as_bytes()) {
        Ok(_) => SaveDialogResult {
            saved: true,
            path: fallback.to_string_lossy().to_string(),
            message: format!("Saved to {}", fallback.to_string_lossy()),
        },
        Err(e) => SaveDialogResult {
            saved: false,
            path: String::new(),
            message: format!("Save failed: {}", e),
        },
    }
}

pub fn scan_ai_models() -> Vec<AiModelEntry> {
    let home = user_home();
    let mut items = Vec::new();

    let candidates: Vec<(std::path::PathBuf, &str, &str, &str, &str)> = vec![
        (
            home.join(".ollama/models"),
            "Ollama Local LLM Models",
            "Ollama",
            "LLM Weights",
            "Downloaded GGUF model blobs & manifests for local Ollama LLMs.",
        ),
        (
            home.join(".cache/huggingface/hub"),
            "HuggingFace Hub Models",
            "HuggingFace",
            "Model Hub",
            "Cached Transformers, Safetensors & Diffusion weights from HuggingFace.",
        ),
        (
            home.join(".cache/huggingface/datasets"),
            "HuggingFace Datasets Cache",
            "HuggingFace",
            "Datasets",
            "Cached Arrow/Parquet datasets downloaded by HuggingFace datasets.",
        ),
        (
            home.join(".lmstudio/models"),
            "LM Studio Local Models",
            "LM Studio",
            "LLM Weights",
            "Local GGUF/MLX language models managed by LM Studio.",
        ),
        (
            home.join(".cache/lm-studio"),
            "LM Studio Runtime Cache",
            "LM Studio",
            "Runtime Cache",
            "Temporary inference cache and index files for LM Studio.",
        ),
        (
            home.join(".cache/torch"),
            "PyTorch & TorchHub Checkpoints",
            "PyTorch",
            "Checkpoints",
            "Pretrained PyTorch vision, audio, and LLM checkpoints.",
        ),
        (
            home.join(".cache/whisper"),
            "OpenAI Whisper Speech Models",
            "OpenAI",
            "Audio AI",
            "Local Whisper speech-to-text model weights (.pt).",
        ),
        (
            home.join("Library/Application Support/Claude/Cache"),
            "Claude Desktop Cache",
            "Anthropic",
            "AI Assistant Cache",
            "Cached web assets and media buffers from Claude Desktop app.",
        ),
        (
            home.join("Library/Application Support/Claude/Code Cache"),
            "Claude V8 & GPU Code Cache",
            "Anthropic",
            "AI Assistant Cache",
            "Compiled V8 bytecode and shader cache for Claude Desktop.",
        ),
        (
            home.join("Library/Caches/com.anthropic.claudefordesktop"),
            "Claude System Cache",
            "Anthropic",
            "AI Assistant Cache",
            "macOS URLSession & updater cache for Claude Desktop.",
        ),
        (
            home.join("Library/Caches/com.openai.chat"),
            "ChatGPT Desktop Cache",
            "OpenAI",
            "AI Assistant Cache",
            "Cached network responses and assets for ChatGPT macOS app.",
        ),
        (
            home.join("Library/Application Support/Cursor/Cache"),
            "Cursor AI IDE Cache",
            "Cursor",
            "AI Code Editor",
            "Cached indexing and webview buffers for Cursor AI IDE.",
        ),
        (
            home.join("Library/Application Support/Cursor/CachedData"),
            "Cursor Compiled V8 Cache",
            "Cursor",
            "AI Code Editor",
            "Cached V8 bytecode & extension build artifacts for Cursor.",
        ),
        (
            home.join(".codeium"),
            "Windsurf / Codeium AI Cache",
            "Codeium",
            "AI Code Editor",
            "Language server indexes and local AI completion caches.",
        ),
        (
            home.join("Library/Caches/com.apple.CoreML"),
            "Apple CoreML Compiled Models",
            "Apple Neural Engine",
            "On-Device AI",
            "Compiled CoreML neural network plans cached on disk.",
        ),
    ];

    for (path, name, provider, kind, desc) in candidates {
        if path.exists() {
            let size = dir_size_bounded(&path, 5);
            if size > 0 {
                let p_str = path.to_string_lossy().to_string();
                items.push(AiModelEntry {
                    id: p_str.clone(),
                    name: name.to_string(),
                    provider: provider.to_string(),
                    kind: kind.to_string(),
                    path: p_str,
                    size_bytes: size,
                    last_modified: modified_label(&path),
                    description: desc.to_string(),
                });
            }
        }
    }

    // Also enumerate individual HuggingFace model folders if present
    let hf_hub = home.join(".cache/huggingface/hub");
    if let Ok(entries) = std::fs::read_dir(&hf_hub) {
        for entry in entries.flatten() {
            let p = entry.path();
            if p.is_dir() {
                let folder_name = entry.file_name().to_string_lossy().to_string();
                if folder_name.starts_with("models--") {
                    let clean_model = folder_name.replacen("models--", "", 1).replace("--", "/");
                    let size = dir_size_bounded(&p, 5);
                    if size > 1024 * 1024 {
                        let p_str = p.to_string_lossy().to_string();
                        items.push(AiModelEntry {
                            id: p_str.clone(),
                            name: format!("HF Model: {}", clean_model),
                            provider: "HuggingFace".to_string(),
                            kind: "Individual Model".to_string(),
                            path: p_str,
                            size_bytes: size,
                            last_modified: modified_label(&p),
                            description: format!("Cached HuggingFace repository weights for {}.", clean_model),
                        });
                    }
                }
            }
        }
    }

    items.sort_by(|a, b| b.size_bytes.cmp(&a.size_bytes));
    items
}

pub fn scan_ghost_space() -> Vec<GhostSpaceEntry> {
    let home = user_home();
    let mut list = Vec::new();

    let candidates: Vec<(std::path::PathBuf, &str, &str, bool, &str, &str)> = vec![
        (
            home.join(".Trash"),
            "User Trash Bin (~/.Trash)",
            "Unemptied Trash",
            false,
            "Empty via Protection & Privacy → Trash",
            "Files moved to Trash still occupy 100% of their disk space until permanently emptied.",
        ),
        (
            home.join("Library/Containers/com.docker.docker/Data/vms/0/data"),
            "Docker Desktop Virtual Disk (Docker.raw)",
            "Virtual Machine & Containers",
            false,
            "Run: docker system prune -a",
            "Docker Desktop pre-allocates a giant virtual disk that does not shrink automatically. Prune unused images/volumes from Docker instead of deleting the disk.",
        ),
        (
            home.join("OrbStack"),
            "OrbStack Linux & Container Volumes",
            "Virtual Machine & Containers",
            false,
            "Inspect in Space Lens / Finder",
            "Hidden Linux machines and container images stored by OrbStack.",
        ),
        (
            home.join("Library/Application Support/MobileSync/Backup"),
            "iPhone & iPad Local Backups (MobileSync)",
            "Device Backups",
            true,
            "Move old device backups to Trash",
            "Full iOS/iPadOS device backups created by Finder/iTunes that often consume 20–100 GB.",
        ),
        (
            home.join("Library/Developer/Xcode/iOS DeviceSupport"),
            "Xcode iOS DeviceSupport Symbols",
            "Developer Ghost Space",
            true,
            "Safe to clean (re-downloaded if device connected)",
            "Debug symbols generated for every iOS version ever plugged into your Mac.",
        ),
        (
            home.join("Library/Developer/Xcode/Archives"),
            "Xcode Old App Release Archives (.xcarchive)",
            "Developer Ghost Space",
            true,
            "Move old build archives to Trash",
            "Historical release builds and dSYMs kept indefinitely by Xcode.",
        ),
        (
            home.join("Library/Developer/CoreSimulator/Devices"),
            "iOS & watchOS Simulator Virtual Disks",
            "Developer Ghost Space",
            false,
            "Run: xcrun simctl delete unavailable",
            "Full virtualized iOS filesystems for Xcode Simulator devices. Remove unused simulators via simctl to keep Xcode consistent.",
        ),
        (
            home.join("Library/Caches/GeoServices"),
            "macOS Maps & GeoServices Offline Cache",
            "System Purgeable",
            true,
            "Safe to purge",
            "Offline vector map tiles and navigation telemetry cached by macOS.",
        ),
        (
            std::path::PathBuf::from("/private/var/vm"),
            "macOS Virtual Memory Swap & Sleepimage",
            "Kernel VM & Swap",
            false,
            "Reclaimed automatically on reboot",
            "Kernel swapfiles and RAM hibernation image managed by macOS virtual memory.",
        ),
        (
            std::path::PathBuf::from("/Library/Updates"),
            "macOS Downloaded Software Updates",
            "System Updates",
            false,
            "Inspect in Finder",
            "Staged macOS installer packages and delta updates in /Library/Updates.",
        ),
    ];

    for (path, name, cat, reclaimable, hint, desc) in candidates {
        if path.exists() {
            let size = dir_size_bounded(&path, 4);
            if size > 512 * 1024 {
                let p_str = path.to_string_lossy().to_string();
                list.push(GhostSpaceEntry {
                    id: p_str.clone(),
                    name: name.to_string(),
                    category: cat.to_string(),
                    path: p_str,
                    size_bytes: size,
                    reclaimable,
                    action_hint: hint.to_string(),
                    description: desc.to_string(),
                });
            }
        }
    }

    list.sort_by(|a, b| b.size_bytes.cmp(&a.size_bytes));
    list
}

pub fn scan_telemetry_items() -> Vec<TelemetryEntry> {
    let home = user_home();
    let mut list = Vec::new();

    let fixed_targets: Vec<(std::path::PathBuf, &str, &str, &str, &str)> = vec![
        (
            home.join("Library/Logs/DiagnosticReports"),
            "macOS User Crash & Spin Reports",
            "Apple Diagnostics",
            "Crash Dumps",
            "Detailed crash logs (.ips / .crash) generated when applications crash or hang.",
        ),
        (
            std::path::PathBuf::from("/Library/Logs/DiagnosticReports"),
            "System-Wide Daemon Crash Reports",
            "Apple Diagnostics",
            "Crash Dumps",
            "System-level diagnostic reports and kernel panic logs.",
        ),
        (
            home.join("Library/Application Support/CrashReporter"),
            "Application CrashReporter History",
            "Apple Diagnostics",
            "Telemetry Plists",
            "Historical crash signatures and submission records per application.",
        ),
        (
            home.join("Library/Google/GoogleSoftwareUpdate"),
            "Google Keystone Background Updater & Telemetry",
            "Google",
            "Updater Agent",
            "Background updater and telemetry engine installed by Chrome / Google Earth.",
        ),
        (
            home.join("Library/Application Support/Google/Chrome/Crashpad"),
            "Google Chrome Crashpad Database",
            "Google",
            "Crashpad Queue",
            "Minidump crash reports queued by Google Chrome's Crashpad handler.",
        ),
        (
            home.join("Library/Logs/Adobe"),
            "Adobe Creative Cloud Telemetry & Logs",
            "Adobe",
            "Telemetry Logs",
            "Background diagnostic and licensing telemetry logs from Adobe services.",
        ),
    ];

    for (path, name, vendor, kind, desc) in fixed_targets {
        if path.exists() {
            let size = dir_size_bounded(&path, 3);
            if size > 0 {
                let p_str = path.to_string_lossy().to_string();
                list.push(TelemetryEntry {
                    id: p_str.clone(),
                    name: name.to_string(),
                    vendor: vendor.to_string(),
                    kind: kind.to_string(),
                    path: p_str,
                    size_bytes: size,
                    is_active: true,
                    description: desc.to_string(),
                });
            }
        }
    }

    // Dynamically scan ~/Library/Application Support/*/Crashpad and */sentry
    let app_support = home.join("Library/Application Support");
    if let Ok(entries) = std::fs::read_dir(&app_support) {
        for entry in entries.flatten() {
            let p = entry.path();
            if p.is_dir() {
                let app_name = entry.file_name().to_string_lossy().to_string();
                for sub in ["Crashpad", "sentry", "Crash Reports", "Telemetry"] {
                    let sub_path = p.join(sub);
                    if sub_path.exists() && sub_path.is_dir() {
                        let size = dir_size_bounded(&sub_path, 3);
                        if size > 4096 {
                            let p_str = sub_path.to_string_lossy().to_string();
                            if !list.iter().any(|x| x.path == p_str) {
                                list.push(TelemetryEntry {
                                    id: p_str.clone(),
                                    name: format!("{} — {} Queue", app_name, sub),
                                    vendor: app_name.clone(),
                                    kind: sub.to_string(),
                                    path: p_str,
                                    size_bytes: size,
                                    is_active: true,
                                    description: format!(
                                        "Local {} telemetry and crash minidump queue for {}.",
                                        sub, app_name
                                    ),
                                });
                            }
                        }
                    }
                }
            }
        }
    }

    list.sort_by(|a, b| b.size_bytes.cmp(&a.size_bytes));
    list
}

fn capsules_dir() -> std::path::PathBuf {
    let dir = user_home().join(".zerotrash_capsules");
    let _ = std::fs::create_dir_all(&dir);
    dir
}

pub fn list_app_capsules() -> Vec<AppCapsuleEntry> {
    let index_file = capsules_dir().join("index.json");
    if let Ok(raw) = std::fs::read_to_string(&index_file) {
        if let Ok(mut list) = serde_json::from_str::<Vec<AppCapsuleEntry>>(&raw) {
            list.retain(|c| std::path::Path::new(&c.archive_path).exists());
            return list;
        }
    }
    Vec::new()
}

pub fn create_app_capsule(app_name: &str, bundle_id: &str) -> Result<AppCapsuleEntry, String> {
    let home = user_home();
    let mut found_paths: Vec<std::path::PathBuf> = Vec::new();

    let prefs_dir = home.join("Library/Preferences");
    if !bundle_id.is_empty() {
        let exact_plist = prefs_dir.join(format!("{}.plist", bundle_id));
        if exact_plist.exists() {
            found_paths.push(exact_plist);
        }
    }

    let app_support_dir = home.join("Library/Application Support").join(app_name);
    if app_support_dir.exists() {
        // Include lightweight config files (< 15 MB) or Preferences plist
        let sz = dir_size_bounded(&app_support_dir, 2);
        if sz > 0 && sz <= 25 * 1024 * 1024 {
            found_paths.push(app_support_dir);
        }
    }

    if found_paths.is_empty() {
        // Fallback: search Preferences for matching prefix
        if let Ok(entries) = std::fs::read_dir(&prefs_dir) {
            let needle = app_name.to_lowercase().replace(' ', "");
            for entry in entries.flatten() {
                let fname = entry.file_name().to_string_lossy().to_lowercase();
                if (!bundle_id.is_empty() && fname.contains(&bundle_id.to_lowercase()))
                    || (!needle.is_empty() && fname.contains(&needle))
                {
                    found_paths.push(entry.path());
                }
            }
        }
    }

    let cap_dir = capsules_dir();
    let ts = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map(|d| d.as_secs())
        .unwrap_or(0);
    let safe_slug = app_name
        .chars()
        .map(|c| if c.is_alphanumeric() { c } else { '_' })
        .collect::<String>();
    let archive_path = cap_dir.join(format!("{}_{}.tar.gz", safe_slug, ts));

    if found_paths.is_empty() {
        // Create a marker settings snapshot so the user still gets a valid capsule
        let marker = cap_dir.join(format!("{}_profile.json", safe_slug));
        let meta_json = serde_json::json!({
            "app_name": app_name,
            "bundle_id": bundle_id,
            "captured_at": ts
        });
        let _ = std::fs::write(&marker, meta_json.to_string());
        found_paths.push(marker);
    }

    let mut cmd = std::process::Command::new("tar");
    cmd.arg("-czf").arg(&archive_path);
    for p in &found_paths {
        cmd.arg(p);
    }
    let out = cmd.output().map_err(|e| e.to_string())?;
    if !out.status.success() && !archive_path.exists() {
        return Err("Failed to create tar.gz settings capsule".to_string());
    }

    let size_bytes = archive_path.metadata().map(|m| m.len()).unwrap_or(1024);
    let entry = AppCapsuleEntry {
        id: format!("cap_{}", ts),
        app_name: app_name.to_string(),
        bundle_id: bundle_id.to_string(),
        archive_path: archive_path.to_string_lossy().to_string(),
        original_paths: found_paths
            .iter()
            .map(|p| p.to_string_lossy().to_string())
            .collect(),
        size_bytes,
        created_at: "Just now".to_string(),
    };

    let mut current = list_app_capsules();
    current.insert(0, entry.clone());
    if let Ok(json) = serde_json::to_string_pretty(&current) {
        let _ = std::fs::write(cap_dir.join("index.json"), json);
    }

    Ok(entry)
}

pub fn restore_app_capsule(capsule_id: &str) -> Result<String, String> {
    let list = list_app_capsules();
    let item = list
        .iter()
        .find(|c| c.id == capsule_id)
        .ok_or_else(|| "Capsule not found".to_string())?;

    let out = std::process::Command::new("tar")
        .arg("-xzf")
        .arg(&item.archive_path)
        .arg("-C")
        .arg("/")
        .output()
        .map_err(|e| e.to_string())?;

    if out.status.success() {
        Ok(format!(
            "Restored settings capsule for {} ({} paths)",
            item.app_name,
            item.original_paths.len()
        ))
    } else {
        Err(String::from_utf8_lossy(&out.stderr).to_string())
    }
}




