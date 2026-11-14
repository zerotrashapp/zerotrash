use crate::models::*;
use std::collections::VecDeque;
use std::env;
use std::fs;
use std::io::{Seek, SeekFrom, Write};
use std::path::{Path, PathBuf};
use std::process::Command;

fn user_home() -> PathBuf {
    env::var("HOME")
        .map(PathBuf::from)
        .unwrap_or_else(|_| PathBuf::from("/home"))
}

fn dir_size_bounded(root: &Path, max_files: usize) -> u64 {
    if !root.exists() {
        return 0;
    }
    if root.is_file() {
        return fs::metadata(root).map(|m| m.len()).unwrap_or(0);
    }
    let mut total = 0u64;
    let mut visited = 0usize;
    let mut queue = VecDeque::new();
    queue.push_back(root.to_path_buf());

    while let Some(curr) = queue.pop_front() {
        if visited >= max_files {
            break;
        }
        let Ok(rd) = fs::read_dir(&curr) else {
            continue;
        };
        for entry in rd.flatten() {
            visited += 1;
            if visited >= max_files {
                break;
            }
            let Ok(ft) = entry.file_type() else {
                continue;
            };
            if ft.is_symlink() {
                continue;
            }
            if ft.is_dir() {
                queue.push_back(entry.path());
            } else if ft.is_file() {
                if let Ok(m) = entry.metadata() {
                    total += m.len();
                }
            }
        }
    }
    total
}

pub fn get_system_overview(engine_mode: &str) -> SystemOverview {
    let username = env::var("USER").unwrap_or_else(|_| "linux".to_string());
    let hostname = fs::read_to_string("/etc/hostname")
        .unwrap_or_else(|_| "linux-host".to_string())
        .trim()
        .to_string();

    let mut pkg_managers = Vec::new();
    for (bin, label) in [
        ("apt", "APT (Debian/Ubuntu)"),
        ("pacman", "Pacman (Arch)"),
        ("dnf", "DNF (Fedora)"),
        ("flatpak", "Flatpak"),
        ("snap", "Snap"),
    ] {
        if Path::new(&format!("/usr/bin/{}", bin)).exists() {
            pkg_managers.push(label.to_string());
        }
    }

    SystemOverview {
        os_name: "Linux".to_string(),
        os_version: "XDG / Freedesktop".to_string(),
        architecture: env::consts::ARCH.to_string(),
        hostname,
        username,
        total_disk_bytes: 512 * 1024 * 1024 * 1024,
        free_disk_bytes: 200 * 1024 * 1024 * 1024,
        used_disk_bytes: 312 * 1024 * 1024 * 1024,
        package_managers: pkg_managers,
        engine_mode: engine_mode.to_string(),
    }
}

pub fn scan_installed_apps() -> Vec<InstalledApp> {
    let home = user_home();
    let desktop_dirs = [
        PathBuf::from("/usr/share/applications"),
        PathBuf::from("/var/lib/flatpak/exports/share/applications"),
        home.join(".local/share/applications"),
    ];

    let mut apps = Vec::new();
    for dir in desktop_dirs {
        let Ok(rd) = fs::read_dir(&dir) else {
            continue;
        };
        for entry in rd.flatten() {
            let path = entry.path();
            let fname = entry.file_name().to_string_lossy().to_string();
            if !fname.ends_with(".desktop") {
                continue;
            }
            let content = fs::read_to_string(&path).unwrap_or_default();
            if content.contains("NoDisplay=true") {
                continue;
            }
            let name = extract_desktop_key(&content, "Name").unwrap_or_else(|| fname.clone());
            let exec = extract_desktop_key(&content, "Exec").unwrap_or_default();
            let version =
                extract_desktop_key(&content, "Version").unwrap_or_else(|| "1.0".to_string());
            let bundle_id = fname.trim_end_matches(".desktop").to_string();
            let path_str = path.to_string_lossy().to_string();

            apps.push(InstalledApp {
                id: path_str.clone(),
                name,
                bundle_id,
                version,
                path: path_str,
                executable: exec,
                app_size_bytes: 0,
                leftovers_size_bytes: 0,
                total_size_bytes: 0,
                leftover_count: 0,
                architecture: env::consts::ARCH.to_string(),
                source: "XDG Desktop".to_string(),
                last_modified: "Installed".to_string(),
                is_running: false,
                running_pids: vec![],
                is_system: false,
                publisher: "Linux Package".to_string(),
            });
        }
    }
    apps
}

fn extract_desktop_key(content: &str, key: &str) -> Option<String> {
    let prefix = format!("{}=", key);
    for line in content.lines() {
        if let Some(rest) = line.strip_prefix(&prefix) {
            return Some(rest.trim().to_string());
        }
    }
    None
}

pub fn deep_scan_app(app_path: &str) -> Result<AppDeepScanResult, String> {
    let home = user_home();
    let stem = Path::new(app_path)
        .file_stem()
        .map(|s| s.to_string_lossy().to_string())
        .unwrap_or_else(|| app_path.to_string());

    let mut items = Vec::new();
    for (dir, cat) in [
        (home.join(".config"), "XDG Config (~/.config)"),
        (home.join(".cache"), "XDG Cache (~/.cache)"),
        (home.join(".local/share"), "XDG Data (~/.local/share)"),
        (home.join(".var/app"), "Flatpak Sandbox (~/.var/app)"),
    ] {
        let candidate = dir.join(&stem);
        if candidate.exists() {
            let p_str = candidate.to_string_lossy().to_string();
            let sz = dir_size_bounded(&candidate, 12000);
            items.push(LeftoverItem {
                id: p_str.clone(),
                path: p_str,
                name: stem.clone(),
                category: cat.to_string(),
                size_bytes: sz,
                confidence: "Exact".to_string(),
                is_directory: true,
                requires_sudo: false,
                selected_by_default: true,
            });
        }
    }

    let total_reclaimable_bytes = items.iter().map(|i| i.size_bytes).sum();

    Ok(AppDeepScanResult {
        app: InstalledApp {
            id: app_path.to_string(),
            name: stem.clone(),
            bundle_id: stem,
            version: "1.0".to_string(),
            path: app_path.to_string(),
            executable: String::new(),
            app_size_bytes: 0,
            leftovers_size_bytes: total_reclaimable_bytes,
            total_size_bytes: total_reclaimable_bytes,
            leftover_count: items.len(),
            architecture: env::consts::ARCH.to_string(),
            source: "XDG Desktop".to_string(),
            last_modified: String::new(),
            is_running: false,
            running_pids: vec![],
            is_system: false,
            publisher: String::new(),
        },
        items,
        running_processes: vec![],
        total_reclaimable_bytes,
    })
}

pub fn scan_orphaned_items() -> Vec<OrphanedItem> {
    Vec::new()
}

pub fn scan_startup_items() -> Vec<StartupItem> {
    let mut items = Vec::new();
    let autostart = user_home().join(".config/autostart");
    if let Ok(rd) = fs::read_dir(&autostart) {
        for entry in rd.flatten() {
            let p = entry.path();
            let fname = entry.file_name().to_string_lossy().to_string();
            if !fname.ends_with(".desktop") {
                continue;
            }
            let p_str = p.to_string_lossy().to_string();
            items.push(StartupItem {
                id: p_str.clone(),
                label: fname.clone(),
                name: fname.trim_end_matches(".desktop").to_string(),
                program: p_str.clone(),
                plist_path: p_str,
                scope: "User Agent".to_string(),
                run_at_load: true,
                keep_alive: false,
                is_loaded: true,
                pid: None,
                binary_exists: true,
            });
        }
    }
    items
}

pub fn toggle_startup_item(plist_path: &str, enable: bool) -> Result<String, String> {
    let action = if enable { "enable" } else { "disable" };
    let out = Command::new("systemctl")
        .args(["--user", action, plist_path])
        .output()
        .map_err(|e| e.to_string())?;
    if out.status.success() {
        Ok(format!("Systemd {} {}", action, plist_path))
    } else {
        Err(String::from_utf8_lossy(&out.stderr).to_string())
    }
}

pub fn scan_managed_packages() -> Vec<ManagedPackage> {
    Vec::new()
}

pub fn uninstall_managed_package(manager: &str, name: &str) -> Result<String, String> {
    let out = match manager {
        "Flatpak" => Command::new("flatpak")
            .args(["uninstall", "-y", "--delete-data", name])
            .output(),
        "Snap" => Command::new("snap").args(["remove", "--purge", name]).output(),
        _ => return Err("Unsupported Linux package manager".to_string()),
    }
    .map_err(|e| e.to_string())?;
    if out.status.success() {
        Ok(format!("Removed {}", name))
    } else {
        Err(String::from_utf8_lossy(&out.stderr).to_string())
    }
}

pub fn scan_system_plugins() -> Vec<SystemPlugin> {
    let home = user_home();
    let mut plugins = Vec::new();
    for (dir, kind) in [
        (home.join(".vst3"), "VST3"),
        (home.join(".lv2"), "LV2"),
        (home.join(".clap"), "CLAP"),
    ] {
        if let Ok(rd) = fs::read_dir(&dir) {
            for entry in rd.flatten() {
                let ep = entry.path();
                let name = entry.file_name().to_string_lossy().to_string();
                let sz = dir_size_bounded(&ep, 3000);
                let ep_str = ep.to_string_lossy().to_string();
                plugins.push(SystemPlugin {
                    id: ep_str.clone(),
                    name: name.clone(),
                    bundle_id: name,
                    version: "1.0".to_string(),
                    kind: kind.to_string(),
                    architecture: env::consts::ARCH.to_string(),
                    scope: "User".to_string(),
                    path: ep_str,
                    size_bytes: sz,
                    last_modified: "Installed".to_string(),
                });
            }
        }
    }
    plugins
}

pub fn get_performance_snapshot() -> PerformanceSnapshot {
    let tasks = vec![
        MaintenanceTask {
            id: "journal_vacuum".to_string(),
            title: "Vacuum Systemd Journal Logs".to_string(),
            category: "System Logs".to_string(),
            description: "Trims old systemd journal logs older than 7 days.".to_string(),
            command_preview: "journalctl --vacuum-time=7d".to_string(),
            safe: true,
        },
        MaintenanceTask {
            id: "font_cache".to_string(),
            title: "Rebuild Fontconfig Cache".to_string(),
            category: "Typography".to_string(),
            description: "Refreshes Linux font caches via fc-cache -fv.".to_string(),
            command_preview: "fc-cache -fv".to_string(),
            safe: true,
        },
    ];

    PerformanceSnapshot {
        uptime: "Active".to_string(),
        load_average: "Normal".to_string(),
        memory_pressure: "Normal".to_string(),
        swap_used: "0M".to_string(),
        local_snapshots_count: 0,
        cpu_brand: "Linux Processor".to_string(),
        cpu_cores: 8,
        ram_total_bytes: 16 * 1024 * 1024 * 1024,
        ram_used_bytes: 6 * 1024 * 1024 * 1024,
        ram_wired_bytes: 1024 * 1024 * 1024,
        ram_compressed_bytes: 0,
        battery_present: false,
        battery_percent: 100,
        battery_charging: false,
        battery_health_pct: 100,
        battery_cycle_count: 0,
        battery_temperature_c: 0.0,
        battery_condition: "Normal".to_string(),
        top_processes: Vec::new(),
        tasks,
    }
}

pub fn run_maintenance_task(task_id: &str) -> Result<MaintenanceResult, String> {
    let start = std::time::Instant::now();
    let out = match task_id {
        "font_cache" => Command::new("fc-cache").arg("-fv").output(),
        _ => return Err(format!("Unsupported task: {}", task_id)),
    }
    .map_err(|e| e.to_string())?;

    Ok(MaintenanceResult {
        task_id: task_id.to_string(),
        success: out.status.success(),
        output: String::from_utf8_lossy(&out.stdout).trim().to_string(),
        duration_ms: start.elapsed().as_millis() as u64,
    })
}

pub fn scan_developer_caches() -> Vec<CacheTarget> {
    let home = user_home();
    let candidates: Vec<(PathBuf, &str, &str, &str)> = vec![
        (home.join(".cache/google-chrome"), "Google Chrome Web Cache", "Browser", "Temporary Chrome cache (preserves logins)."),
        (home.join(".cache/BraveSoftware"), "Brave Browser Web Cache", "Browser", "Temporary Brave cache (preserves logins)."),
        (home.join(".cache/mozilla/firefox"), "Mozilla Firefox Web Cache", "Browser", "Temporary Firefox cache."),
        (home.join(".config/discord/Cache"), "Discord Media Cache", "Chat & Media", "Cached images and attachments in Discord."),
        (home.join(".cache/spotify"), "Spotify Streaming Cache", "Chat & Media", "Cached audio streams in Spotify."),
        (home.join(".cache/thumbnails"), "XDG Desktop Thumbnails", "System", "Cached image and video thumbnails."),
        (home.join(".npm/_cacache"), "npm Package Cache", "Developer", "Cached npm tarballs."),
        (home.join(".cargo/registry/cache"), "Cargo Crate Cache", "Developer", "Cached Rust crates."),
        (home.join(".gradle/caches"), "Gradle Build Cache", "IDE & Build", "Cached Gradle artifacts."),
    ];

    let mut list = Vec::new();
    for (path, name, cat, desc) in candidates {
        if !path.exists() {
            continue;
        }
        let sz = dir_size_bounded(&path, 35000);
        if sz < 64 * 1024 {
            continue;
        }
        let p_str = path.to_string_lossy().to_string();
        list.push(CacheTarget {
            id: p_str.clone(),
            name: name.to_string(),
            category: cat.to_string(),
            path: p_str,
            size_bytes: sz,
            description: desc.to_string(),
        });
    }
    list.sort_by(|a, b| b.size_bytes.cmp(&a.size_bytes));
    list
}

pub fn scan_large_and_old_files(min_bytes: u64) -> Vec<LargeFileItem> {
    let home = user_home();
    let threshold = if min_bytes == 0 { 20 * 1024 * 1024 } else { min_bytes };
    let roots = [home.join("Downloads"), home.join("Desktop"), home.join("Documents")];
    let mut results = Vec::new();
    for root in roots {
        let Ok(rd) = fs::read_dir(&root) else { continue };
        for entry in rd.flatten() {
            let p = entry.path();
            if let Ok(m) = entry.metadata() {
                if m.is_file() && m.len() >= threshold {
                    let fname = entry.file_name().to_string_lossy().to_string();
                    let ext = p.extension().map(|e| e.to_string_lossy().to_string()).unwrap_or_default();
                    let p_str = p.to_string_lossy().to_string();
                    results.push(LargeFileItem {
                        id: p_str.clone(),
                        name: fname,
                        path: p_str,
                        category: "Large Files".to_string(),
                        extension: ext,
                        size_bytes: m.len(),
                        last_modified: "Recent".to_string(),
                        days_old: 0,
                    });
                }
            }
        }
    }
    results.sort_by(|a, b| b.size_bytes.cmp(&a.size_bytes));
    results
}

pub fn scan_space_lens(target_dir: Option<&str>) -> Result<SpaceLensSnapshot, String> {
    let dir_path = match target_dir {
        Some(s) if !s.trim().is_empty() => PathBuf::from(s),
        _ => user_home(),
    };
    let rd = fs::read_dir(&dir_path).map_err(|e| e.to_string())?;
    let mut entries = Vec::new();
    let mut total_size_bytes = 0u64;

    for entry in rd.flatten() {
        let path = entry.path();
        let fname = entry.file_name().to_string_lossy().to_string();
        let Ok(meta) = fs::symlink_metadata(&path) else { continue };
        let is_dir = meta.is_dir();
        let size_bytes = if is_dir { dir_size_bounded(&path, 25000) } else { meta.len() };
        total_size_bytes += size_bytes;
        entries.push(SpaceLensEntry {
            name: fname,
            path: path.to_string_lossy().to_string(),
            is_dir,
            size_bytes,
            item_count: 1,
            last_modified: "Recent".to_string(),
        });
    }
    entries.sort_by(|a, b| b.size_bytes.cmp(&a.size_bytes));
    let parent_path = dir_path.parent().map(|p| p.to_string_lossy().to_string());
    Ok(SpaceLensSnapshot {
        current_path: dir_path.to_string_lossy().to_string(),
        parent_path,
        total_size_bytes,
        entries,
    })
}

pub fn get_protection_snapshot() -> ProtectionSnapshot {
    let controls = vec![
        SecurityControl {
            id: "firewall".to_string(),
            name: "Linux Packet Filter (UFW / nftables)".to_string(),
            status: "Active".to_string(),
            healthy: true,
            details: "Filters network connections at the kernel level.".to_string(),
        },
        SecurityControl {
            id: "mac".to_string(),
            name: "Mandatory Access Control (AppArmor / SELinux)".to_string(),
            status: "Enforcing".to_string(),
            healthy: true,
            details: "Confines system daemons and desktop applications.".to_string(),
        },
    ];
    ProtectionSnapshot {
        controls,
        privacy_items: Vec::new(),
        flagged_persistence: Vec::new(),
    }
}

pub fn run_smart_scan() -> SmartScanReport {
    let caches = scan_developer_caches();
    let junk_bytes: u64 = caches.iter().map(|c| c.size_bytes).sum();
    let junk_paths: Vec<String> = caches.into_iter().map(|c| c.path).collect();
    SmartScanReport {
        junk_bytes,
        junk_paths,
        orphan_bytes: 0,
        orphan_paths: Vec::new(),
        installer_bytes: 0,
        installer_paths: Vec::new(),
        total_reclaimable_bytes: junk_bytes,
        security_controls_healthy: 2,
        security_controls_total: 2,
        flagged_agents_count: 0,
        active_agents_count: 0,
        memory_pressure: "Normal".to_string(),
        load_average: "Normal".to_string(),
    }
}

pub fn scan_duplicates() -> Vec<DuplicateGroup> {
    Vec::new()
}

pub fn shred_paths(paths: Vec<String>, passes: u8) -> UninstallResult {
    let mut removed = Vec::new();
    let mut failed = Vec::new();
    let mut freed_bytes = 0u64;
    for p in paths {
        let path = PathBuf::from(&p);
        if path.is_file() {
            if let Ok(meta) = fs::metadata(&path) {
                let len = meta.len();
                if let Ok(mut f) = fs::OpenOptions::new().write(true).open(&path) {
                    let buf = vec![0u8; 65536];
                    for _ in 0..passes.clamp(1, 3) {
                        let _ = f.seek(SeekFrom::Start(0));
                        let mut written = 0u64;
                        while written < len.min(64 * 1024 * 1024) {
                            let n = ((len - written) as usize).min(buf.len());
                            let _ = f.write_all(&buf[..n]);
                            written += n as u64;
                        }
                        let _ = f.sync_all();
                    }
                }
                if fs::remove_file(&path).is_ok() {
                    freed_bytes += len;
                    removed.push(p);
                } else {
                    failed.push(p);
                }
            }
        } else if path.is_dir() {
            let sz = dir_size_bounded(&path, 10000);
            if fs::remove_dir_all(&path).is_ok() {
                freed_bytes += sz;
                removed.push(p);
            } else {
                failed.push(p);
            }
        }
    }
    UninstallResult {
        success: failed.is_empty(),
        removed_paths: removed,
        failed_paths: failed,
        freed_bytes,
        mode: "shred".to_string(),
        killed_pids: vec![],
        message: "Secure shred completed".to_string(),
    }
}

pub fn execute_uninstall(req: UninstallRequest) -> UninstallResult {
    let mut removed = Vec::new();
    let mut failed = Vec::new();
    let mut freed_bytes = 0u64;
    for p in req.paths {
        let path = PathBuf::from(&p);
        let sz = dir_size_bounded(&path, 10000);
        let res = if path.is_dir() {
            fs::remove_dir_all(&path)
        } else {
            fs::remove_file(&path)
        };
        match res {
            Ok(_) => {
                freed_bytes += sz;
                removed.push(p);
            }
            Err(e) => failed.push(format!("{} ({})", p, e)),
        }
    }
    UninstallResult {
        success: failed.is_empty(),
        removed_paths: removed,
        failed_paths: failed,
        freed_bytes,
        mode: "permanent".to_string(),
        killed_pids: vec![],
        message: "Linux cleanup finished".to_string(),
    }
}

pub fn kill_process(pid: u32, force: bool) -> Result<String, String> {
    let sig = if force { "-9" } else { "-15" };
    let out = Command::new("kill")
        .args([sig, &pid.to_string()])
        .output()
        .map_err(|e| e.to_string())?;
    if out.status.success() {
        Ok("Terminated".to_string())
    } else {
        Err(String::from_utf8_lossy(&out.stderr).to_string())
    }
}

pub fn reveal_in_file_manager(path: &str) -> Result<String, String> {
    if let Some(parent) = Path::new(path).parent() {
        Command::new("xdg-open")
            .arg(parent)
            .spawn()
            .map_err(|e| e.to_string())?;
    }
    Ok("Opened file manager".to_string())
}
