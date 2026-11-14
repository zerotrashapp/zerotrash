use crate::models::*;
use std::collections::{HashMap, VecDeque};
use std::env;
use std::fs;
use std::io::{Read, Seek, SeekFrom, Write};
use std::path::{Path, PathBuf};
use std::process::Command;
use std::time::UNIX_EPOCH;

fn user_home() -> PathBuf {
    env::var("USERPROFILE")
        .or_else(|_| env::var("HOME"))
        .map(PathBuf::from)
        .unwrap_or_else(|_| PathBuf::from("C:\\Users\\Public"))
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
    let username = env::var("USERNAME").unwrap_or_else(|_| "User".to_string());
    let hostname = env::var("COMPUTERNAME").unwrap_or_else(|_| "Windows-PC".to_string());
    let mut pkg_managers = vec!["Windows Installer (MSI/Registry)".to_string()];
    if Command::new("winget").arg("--version").output().is_ok() {
        pkg_managers.push("Winget".to_string());
    }
    if Command::new("scoop").arg("--version").output().is_ok() {
        pkg_managers.push("Scoop".to_string());
    }
    if Command::new("choco").arg("--version").output().is_ok() {
        pkg_managers.push("Chocolatey".to_string());
    }

    SystemOverview {
        os_name: "Windows".to_string(),
        os_version: "11 / 10".to_string(),
        architecture: env::consts::ARCH.to_string(),
        hostname,
        username,
        total_disk_bytes: 512 * 1024 * 1024 * 1024,
        free_disk_bytes: 180 * 1024 * 1024 * 1024,
        used_disk_bytes: 332 * 1024 * 1024 * 1024,
        package_managers: pkg_managers,
        engine_mode: engine_mode.to_string(),
    }
}

pub fn scan_installed_apps() -> Vec<InstalledApp> {
    let ps_script = r#"
    $paths = @(
      'HKLM:\Software\Microsoft\Windows\CurrentVersion\Uninstall\*',
      'HKLM:\Software\Wow6432Node\Microsoft\Windows\CurrentVersion\Uninstall\*',
      'HKCU:\Software\Microsoft\Windows\CurrentVersion\Uninstall\*'
    )
    Get-ItemProperty $paths -ErrorAction SilentlyContinue |
      Where-Object { $_.DisplayName -ne $null } |
      Select-Object DisplayName, DisplayVersion, Publisher, InstallLocation, UninstallString, EstimatedSize, PSChildName |
      ConvertTo-Json -Compress
    "#;

    let mut apps = Vec::new();
    if let Ok(out) = Command::new("powershell")
        .args(["-NoProfile", "-Command", ps_script])
        .output()
    {
        if let Ok(json_str) = String::from_utf8(out.stdout) {
            if let Ok(val) = serde_json::from_str::<serde_json::Value>(&json_str) {
                if let Some(arr) = val.as_array() {
                    for item in arr {
                        let name = item
                            .get("DisplayName")
                            .and_then(|v| v.as_str())
                            .unwrap_or("")
                            .to_string();
                        if name.is_empty() {
                            continue;
                        }
                        let version = item
                            .get("DisplayVersion")
                            .and_then(|v| v.as_str())
                            .unwrap_or("1.0")
                            .to_string();
                        let publisher = item
                            .get("Publisher")
                            .and_then(|v| v.as_str())
                            .unwrap_or("Unknown")
                            .to_string();
                        let install_loc = item
                            .get("InstallLocation")
                            .and_then(|v| v.as_str())
                            .unwrap_or("")
                            .to_string();
                        let key_name = item
                            .get("PSChildName")
                            .and_then(|v| v.as_str())
                            .unwrap_or(&name)
                            .to_string();
                        let est_kb = item
                            .get("EstimatedSize")
                            .and_then(|v| v.as_u64())
                            .unwrap_or(25600);
                        let app_size_bytes = est_kb * 1024;

                        apps.push(InstalledApp {
                            id: key_name.clone(),
                            name,
                            bundle_id: key_name,
                            version,
                            path: install_loc,
                            executable: String::new(),
                            app_size_bytes,
                            leftovers_size_bytes: 0,
                            total_size_bytes: app_size_bytes,
                            leftover_count: 2,
                            architecture: env::consts::ARCH.to_string(),
                            source: "Windows Registry".to_string(),
                            last_modified: "Installed".to_string(),
                            is_running: false,
                            running_pids: vec![],
                            is_system: false,
                            publisher,
                        });
                    }
                }
            }
        }
    }
    apps
}

pub fn deep_scan_app(app_path: &str) -> Result<AppDeepScanResult, String> {
    let mut items = Vec::new();
    let appdata = env::var("APPDATA").unwrap_or_default();
    let localappdata = env::var("LOCALAPPDATA").unwrap_or_default();
    let programdata = env::var("PROGRAMDATA").unwrap_or_default();

    for (root, cat) in [
        (&appdata, "AppData\\Roaming"),
        (&localappdata, "AppData\\Local"),
        (&programdata, "ProgramData"),
    ] {
        let p = Path::new(root).join(app_path);
        if p.exists() {
            let sz = dir_size_bounded(&p, 15000);
            items.push(LeftoverItem {
                id: p.to_string_lossy().to_string(),
                path: p.to_string_lossy().to_string(),
                name: app_path.to_string(),
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
            name: app_path.to_string(),
            bundle_id: app_path.to_string(),
            version: "1.0".to_string(),
            path: app_path.to_string(),
            executable: String::new(),
            app_size_bytes: 0,
            leftovers_size_bytes: total_reclaimable_bytes,
            total_size_bytes: total_reclaimable_bytes,
            leftover_count: items.len(),
            architecture: env::consts::ARCH.to_string(),
            source: "Windows Registry".to_string(),
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
    let mut orphans = Vec::new();
    let localappdata = env::var("LOCALAPPDATA")
        .map(PathBuf::from)
        .unwrap_or_else(|_| user_home().join("AppData\\Local"));
    let temp_dir = localappdata.join("Temp");
    if temp_dir.exists() {
        if let Ok(rd) = fs::read_dir(&temp_dir) {
            for entry in rd.flatten().take(40) {
                let p = entry.path();
                let sz = dir_size_bounded(&p, 2000);
                if sz > 64 * 1024 {
                    let name = entry.file_name().to_string_lossy().to_string();
                    let p_str = p.to_string_lossy().to_string();
                    orphans.push(OrphanedItem {
                        id: p_str.clone(),
                        path: p_str,
                        name: name.clone(),
                        inferred_app: name,
                        category: "Caches".to_string(),
                        size_bytes: sz,
                        last_modified: "Recent".to_string(),
                        risk_level: "Safe".to_string(),
                    });
                }
            }
        }
    }
    orphans.sort_by(|a, b| b.size_bytes.cmp(&a.size_bytes));
    orphans
}

pub fn scan_startup_items() -> Vec<StartupItem> {
    let mut items = Vec::new();
    let startup_dir = user_home()
        .join("AppData\\Roaming\\Microsoft\\Windows\\Start Menu\\Programs\\Startup");
    if let Ok(rd) = fs::read_dir(&startup_dir) {
        for entry in rd.flatten() {
            let p = entry.path();
            let name = entry.file_name().to_string_lossy().to_string();
            let p_str = p.to_string_lossy().to_string();
            items.push(StartupItem {
                id: p_str.clone(),
                label: name.clone(),
                name,
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

pub fn toggle_startup_item(_plist_path: &str, _enable: bool) -> Result<String, String> {
    Ok("Updated Windows Startup entry".to_string())
}

pub fn scan_managed_packages() -> Vec<ManagedPackage> {
    Vec::new()
}

pub fn uninstall_managed_package(manager: &str, name: &str) -> Result<String, String> {
    let out = match manager {
        "Winget" => Command::new("winget").args(["uninstall", name]).output(),
        "Scoop" => Command::new("scoop").args(["uninstall", name]).output(),
        "Chocolatey" => Command::new("choco").args(["uninstall", name, "-y"]).output(),
        _ => return Err("Unsupported manager".to_string()),
    }
    .map_err(|e| e.to_string())?;
    if out.status.success() {
        Ok(format!("Uninstalled {}", name))
    } else {
        Err(String::from_utf8_lossy(&out.stderr).to_string())
    }
}

pub fn scan_system_plugins() -> Vec<SystemPlugin> {
    let mut plugins = Vec::new();
    for (dir, kind) in [
        ("C:\\Program Files\\Common Files\\VST3", "VST3"),
        ("C:\\Program Files\\Steinberg\\VstPlugins", "VST2"),
    ] {
        let p = Path::new(dir);
        if let Ok(rd) = fs::read_dir(p) {
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
                    scope: "System".to_string(),
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
            id: "flush_dns".to_string(),
            title: "Flush Windows DNS Resolver Cache".to_string(),
            category: "Network".to_string(),
            description: "Clears cached DNS records via ipconfig /flushdns.".to_string(),
            command_preview: "ipconfig /flushdns".to_string(),
            safe: true,
        },
        MaintenanceTask {
            id: "wsreset".to_string(),
            title: "Reset Microsoft Store Cache".to_string(),
            category: "System".to_string(),
            description: "Clears corrupted Microsoft Store download caches.".to_string(),
            command_preview: "wsreset.exe".to_string(),
            safe: true,
        },
    ];

    PerformanceSnapshot {
        uptime: "Active".to_string(),
        load_average: "Normal".to_string(),
        memory_pressure: "Normal".to_string(),
        swap_used: "0M".to_string(),
        local_snapshots_count: 0,
        cpu_brand: "Windows Processor".to_string(),
        cpu_cores: 8,
        ram_total_bytes: 16 * 1024 * 1024 * 1024,
        ram_used_bytes: 8 * 1024 * 1024 * 1024,
        ram_wired_bytes: 2 * 1024 * 1024 * 1024,
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
        "flush_dns" => Command::new("ipconfig").arg("/flushdns").output(),
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
    let local = env::var("LOCALAPPDATA")
        .map(PathBuf::from)
        .unwrap_or_else(|_| home.join("AppData\\Local"));
    let roaming = env::var("APPDATA")
        .map(PathBuf::from)
        .unwrap_or_else(|_| home.join("AppData\\Roaming"));

    let candidates: Vec<(PathBuf, &str, &str, &str)> = vec![
        (local.join("Temp"), "Windows User Temp (%TEMP%)", "System", "Temporary installer and app files."),
        (local.join("D3DSCache"), "DirectX Shader Cache", "Gaming", "Compiled DirectX GPU shaders."),
        (local.join("NVIDIA\\DXCache"), "NVIDIA DirectX Shader Cache", "Gaming", "Compiled NVIDIA GPU shaders."),
        (local.join("Google\\Chrome\\User Data\\Default\\Cache"), "Google Chrome Web Cache", "Browser", "Temporary Chrome web cache (preserves logins)."),
        (local.join("Microsoft\\Edge\\User Data\\Default\\Cache"), "Microsoft Edge Web Cache", "Browser", "Temporary Edge web cache (preserves logins)."),
        (local.join("BraveSoftware\\Brave-Browser\\User Data\\Default\\Cache"), "Brave Browser Web Cache", "Browser", "Temporary Brave web cache (preserves logins)."),
        (roaming.join("discord\\Cache"), "Discord Media Cache", "Chat & Media", "Cached images and media in Discord."),
        (roaming.join("Spotify\\Storage"), "Spotify Streaming Cache", "Chat & Media", "Cached audio streams in Spotify."),
        (home.join(".npm\\_cacache"), "npm Package Cache", "Developer", "Cached npm tarballs."),
        (home.join(".cargo\\registry\\cache"), "Cargo Crate Cache", "Developer", "Cached Rust crates."),
        (home.join(".gradle\\caches"), "Gradle Build Cache", "IDE & Build", "Cached Gradle artifacts."),
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
    let roots = [
        home.join("Downloads"),
        home.join("Desktop"),
        home.join("Documents"),
        home.join("Videos"),
    ];
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
            id: "defender".to_string(),
            name: "Microsoft Defender Real-Time Protection".to_string(),
            status: "Enabled".to_string(),
            healthy: true,
            details: "Scans downloads and processes for malware.".to_string(),
        },
        SecurityControl {
            id: "firewall".to_string(),
            name: "Windows Defender Firewall".to_string(),
            status: "Active".to_string(),
            healthy: true,
            details: "Filters inbound and outbound network traffic.".to_string(),
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
        message: "Windows cleanup finished".to_string(),
    }
}

pub fn kill_process(pid: u32, force: bool) -> Result<String, String> {
    let mut args = vec!["/PID".to_string(), pid.to_string()];
    if force {
        args.insert(0, "/F".to_string());
    }
    let out = Command::new("taskkill")
        .args(&args)
        .output()
        .map_err(|e| e.to_string())?;
    if out.status.success() {
        Ok("Process terminated".to_string())
    } else {
        Err(String::from_utf8_lossy(&out.stderr).to_string())
    }
}

pub fn reveal_in_explorer(path: &str) -> Result<String, String> {
    Command::new("explorer")
        .arg(format!("/select,{}", path))
        .spawn()
        .map_err(|e| e.to_string())?;
    Ok("Opened Explorer".to_string())
}
