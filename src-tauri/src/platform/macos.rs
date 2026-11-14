use crate::models::*;
use std::collections::{HashMap, HashSet, VecDeque};
use std::env;
use std::fs;
use std::io::{Read, Seek, SeekFrom, Write};
use std::path::{Path, PathBuf};
use std::process::Command;
use std::time::UNIX_EPOCH;

fn home_dir() -> PathBuf {
    env::var("HOME")
        .map(PathBuf::from)
        .unwrap_or_else(|_| PathBuf::from("/Users/Shared"))
}

pub fn get_system_overview(engine_mode: &str) -> SystemOverview {
    let os_version = run_cmd("sw_vers", &["-productVersion"])
        .unwrap_or_else(|| "macOS".to_string())
        .trim()
        .to_string();
    let arch = env::consts::ARCH.to_string();
    let hostname = run_cmd("scutil", &["--get", "LocalHostName"])
        .or_else(|| run_cmd("hostname", &["-s"]))
        .unwrap_or_else(|| "localhost".to_string())
        .trim()
        .to_string();
    let username = env::var("USER").unwrap_or_else(|_| "user".to_string());

    let (total_disk_bytes, free_disk_bytes, used_disk_bytes) = get_disk_space();

    let mut pkg_managers = Vec::new();
    if Path::new("/opt/homebrew/bin/brew").exists() || Path::new("/usr/local/bin/brew").exists() {
        pkg_managers.push("Homebrew".to_string());
    }
    if bin_exists("npm") {
        pkg_managers.push("npm".to_string());
    }
    if home_dir().join(".cargo/bin/cargo").exists() || bin_exists("cargo") {
        pkg_managers.push("Cargo".to_string());
    }
    if bin_exists("pipx") {
        pkg_managers.push("pipx".to_string());
    }

    SystemOverview {
        os_name: "macOS".to_string(),
        os_version,
        architecture: arch,
        hostname,
        username,
        total_disk_bytes,
        free_disk_bytes,
        used_disk_bytes,
        package_managers: pkg_managers,
        engine_mode: engine_mode.to_string(),
    }
}

fn bin_exists(bin: &str) -> bool {
    [
        format!("/opt/homebrew/bin/{}", bin),
        format!("/usr/local/bin/{}", bin),
        format!("/usr/bin/{}", bin),
    ]
    .iter()
    .any(|p| Path::new(p).exists())
}

fn get_disk_space() -> (u64, u64, u64) {
    if let Some(out) = run_cmd("df", &["-k", "/"]) {
        for line in out.lines().skip(1) {
            let parts: Vec<&str> = line.split_whitespace().collect();
            if parts.len() >= 4 {
                let total_kb = parts[1].parse::<u64>().unwrap_or(0);
                let avail_kb = parts[3].parse::<u64>().unwrap_or(0);
                let total = total_kb * 1024;
                let free = avail_kb * 1024;
                return (total, free, total.saturating_sub(free));
            }
        }
    }
    (0, 0, 0)
}

fn run_cmd(program: &str, args: &[&str]) -> Option<String> {
    Command::new(program)
        .args(args)
        .output()
        .ok()
        .and_then(|o| {
            if o.status.success() {
                String::from_utf8(o.stdout).ok()
            } else {
                None
            }
        })
}

pub fn dir_size_bounded(path: &Path, limit: usize) -> u64 {
    let mut total = 0u64;
    let mut count = 0usize;
    let mut queue = VecDeque::new();
    queue.push_back(path.to_path_buf());

    while let Some(curr) = queue.pop_front() {
        if count >= limit {
            break;
        }
        let meta = match fs::symlink_metadata(&curr) {
            Ok(m) => m,
            Err(_) => continue,
        };
        if meta.file_type().is_symlink() {
            continue;
        }
        if meta.is_file() {
            total += meta.len();
            count += 1;
        } else if meta.is_dir() {
            if let Ok(entries) = fs::read_dir(&curr) {
                for entry in entries.flatten() {
                    count += 1;
                    if count > limit {
                        break;
                    }
                    let ft = match entry.file_type() {
                        Ok(t) => t,
                        Err(_) => continue,
                    };
                    if ft.is_symlink() {
                        continue;
                    }
                    if ft.is_file() {
                        if let Ok(m) = entry.metadata() {
                            total += m.len();
                        }
                    } else if ft.is_dir() {
                        queue.push_back(entry.path());
                    }
                }
            }
        }
    }
    total
}

#[derive(Default)]
struct BundleInfo {
    bundle_id: String,
    bundle_name: String,
    display_name: String,
    version: String,
    executable: String,
    copyright: String,
}

fn read_bundle_info(plist_path: &Path) -> BundleInfo {
    let mut info = BundleInfo::default();
    let bytes = match fs::read(plist_path) {
        Ok(b) => b,
        Err(_) => return info,
    };

    let xml = if bytes.starts_with(b"bplist") {
        run_cmd(
            "plutil",
            &[
                "-convert",
                "xml1",
                "-o",
                "-",
                &plist_path.to_string_lossy(),
            ],
        )
        .unwrap_or_default()
    } else {
        String::from_utf8_lossy(&bytes).to_string()
    };

    info.bundle_id = plist_string(&xml, "CFBundleIdentifier");
    info.bundle_name = plist_string(&xml, "CFBundleName");
    info.display_name = plist_string(&xml, "CFBundleDisplayName");
    info.version = plist_string(&xml, "CFBundleShortVersionString");
    if info.version.is_empty() {
        info.version = plist_string(&xml, "CFBundleVersion");
    }
    info.executable = plist_string(&xml, "CFBundleExecutable");
    info.copyright = plist_string(&xml, "NSHumanReadableCopyright");
    info
}

fn plist_string(xml: &str, key: &str) -> String {
    let tag = format!("<key>{}</key>", key);
    if let Some(pos) = xml.find(&tag) {
        let tail = &xml[pos + tag.len()..];
        if let Some(start) = tail.find("<string>") {
            let content = &tail[start + 8..];
            if let Some(end) = content.find("</string>") {
                return content[..end]
                    .trim()
                    .replace("&amp;", "&")
                    .replace("&lt;", "<")
                    .replace("&gt;", ">");
            }
        }
    }
    String::new()
}

fn read_macho_arch(bin_path: &Path) -> String {
    let mut file = match fs::File::open(bin_path) {
        Ok(f) => f,
        Err(_) => return "Universal".to_string(),
    };
    let mut header = [0u8; 8];
    if file.read_exact(&mut header).is_err() {
        return "macOS".to_string();
    }
    match u32::from_be_bytes([header[0], header[1], header[2], header[3]]) {
        0xcafebabe | 0xbebafeca => "Universal".to_string(),
        0xcffaedfe => match u32::from_le_bytes([header[4], header[5], header[6], header[7]]) {
            0x0100000c => "arm64".to_string(),
            0x01000007 => "x86_64".to_string(),
            _ => "64-bit".to_string(),
        },
        _ => "Bundle".to_string(),
    }
}

fn relative_mtime(path: &Path) -> String {
    let Ok(meta) = fs::metadata(path) else {
        return "—".to_string();
    };
    let Ok(modified) = meta.modified() else {
        return "—".to_string();
    };
    let Ok(dur) = modified.duration_since(UNIX_EPOCH) else {
        return "—".to_string();
    };
    let now = std::time::SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_secs())
        .unwrap_or(dur.as_secs());
    let days = now.saturating_sub(dur.as_secs()) / 86400;
    match days {
        0 => "Today".to_string(),
        1 => "Yesterday".to_string(),
        2..=29 => format!("{}d ago", days),
        30..=364 => format!("{}mo ago", days / 30),
        _ => format!("{}y ago", days / 365),
    }
}

pub fn list_processes() -> Vec<RunningProcess> {
    let mut procs = Vec::new();
    if let Some(out) = run_cmd("ps", &["-axo", "pid=,rss=,comm="]) {
        for line in out.lines() {
            let trimmed = line.trim();
            if trimmed.is_empty() {
                continue;
            }
            let tokens: Vec<&str> = trimmed.split_whitespace().collect();
            if tokens.len() >= 3 {
                if let Ok(pid) = tokens[0].parse::<u32>() {
                    let rss = tokens[1].parse::<u64>().unwrap_or(0);
                    let comm = tokens[2..].join(" ");
                    let name = Path::new(&comm)
                        .file_name()
                        .map(|s| s.to_string_lossy().to_string())
                        .unwrap_or_else(|| comm.clone());
                    procs.push(RunningProcess {
                        pid,
                        name,
                        command: comm,
                        memory_kb: rss,
                    });
                }
            }
        }
    }
    procs
}

pub fn scan_installed_apps() -> Vec<InstalledApp> {
    let home = home_dir();
    let procs = list_processes();

    let mut casks = HashSet::new();
    for root in ["/opt/homebrew/Caskroom", "/usr/local/Caskroom"] {
        if let Ok(entries) = fs::read_dir(root) {
            for e in entries.flatten() {
                casks.insert(e.file_name().to_string_lossy().to_lowercase());
            }
        }
    }

    let support_roots = [
        home.join("Library/Application Support"),
        home.join("Library/Caches"),
        home.join("Library/Preferences"),
        home.join("Library/Containers"),
        home.join("Library/Saved Application State"),
        home.join("Library/Logs"),
    ];
    let mut indexed_lib: Vec<(String, PathBuf)> = Vec::new();
    for dir in &support_roots {
        if let Ok(rd) = fs::read_dir(dir) {
            for entry in rd.flatten() {
                indexed_lib.push((
                    entry.file_name().to_string_lossy().to_lowercase(),
                    entry.path(),
                ));
            }
        }
    }

    let roots = [
        (PathBuf::from("/Applications"), "Applications", false),
        (home.join("Applications"), "User", false),
    ];

    let mut apps = Vec::new();

    for (root, source_tag, is_sys) in roots {
        let Ok(entries) = fs::read_dir(&root) else {
            continue;
        };

        for entry in entries.flatten() {
            let path = entry.path();
            let fname = entry.file_name().to_string_lossy().to_string();
            if !fname.ends_with(".app") {
                continue;
            }

            let stem = fname.trim_end_matches(".app").to_string();
            let info = read_bundle_info(&path.join("Contents/Info.plist"));

            let name = if !info.display_name.is_empty() && info.display_name.len() >= stem.len() {
                info.display_name
            } else {
                stem.clone()
            };

            let bundle_id = if !info.bundle_id.is_empty() {
                info.bundle_id
            } else {
                format!("local.app.{}", stem.to_lowercase().replace(' ', "-"))
            };

            let exec = if !info.executable.is_empty() {
                info.executable
            } else {
                stem.clone()
            };

            let arch = read_macho_arch(&path.join("Contents/MacOS").join(&exec));
            let is_mas = path.join("Contents/_MASReceipt/receipt").exists();
            let slug = stem.to_lowercase().replace(' ', "-");
            let source = if is_mas {
                "App Store".to_string()
            } else if casks.contains(&slug) || casks.contains(&stem.to_lowercase()) {
                "Homebrew".to_string()
            } else {
                source_tag.to_string()
            };

            let app_size = dir_size_bounded(&path, 8000);
            let path_str = path.to_string_lossy().to_string();

            let pids: Vec<u32> = procs
                .iter()
                .filter(|p| p.command.contains(&path_str) || p.name == exec)
                .map(|p| p.pid)
                .collect();

            let bid_lc = bundle_id.to_lowercase();
            let stem_lc = stem.to_lowercase();
            let mut leftover_count = 0usize;
            let mut leftovers_size = 0u64;

            for (ename, epath) in &indexed_lib {
                if (!bid_lc.is_empty() && ename.contains(&bid_lc))
                    || (stem_lc.len() >= 4 && ename.contains(&stem_lc))
                {
                    leftover_count += 1;
                    leftovers_size += dir_size_bounded(epath, 600);
                }
            }

            let publisher = if !info.copyright.is_empty() {
                info.copyright
            } else if bundle_id.starts_with("com.apple.") {
                "Apple Inc.".to_string()
            } else {
                vendor_from_id(&bundle_id)
            };

            apps.push(InstalledApp {
                id: path_str.clone(),
                name,
                bundle_id: bundle_id.clone(),
                version: if info.version.is_empty() {
                    "1.0".to_string()
                } else {
                    info.version
                },
                path: path_str,
                executable: exec,
                app_size_bytes: app_size,
                leftovers_size_bytes: leftovers_size,
                total_size_bytes: app_size + leftovers_size,
                leftover_count,
                architecture: arch,
                source,
                last_modified: relative_mtime(&path),
                is_running: !pids.is_empty(),
                running_pids: pids,
                is_system: is_sys || bundle_id.starts_with("com.apple."),
                publisher,
            });
        }
    }

    apps.sort_by(|a, b| b.total_size_bytes.cmp(&a.total_size_bytes));
    apps
}

fn vendor_from_id(bundle_id: &str) -> String {
    let parts: Vec<&str> = bundle_id.split('.').collect();
    if parts.len() >= 2 {
        capitalize(parts[1])
    } else {
        "—".to_string()
    }
}

pub fn deep_scan_app(app_path: &str) -> Result<AppDeepScanResult, String> {
    let path = Path::new(app_path);
    if !path.exists() {
        return Err(format!("Path not found: {}", app_path));
    }

    let fname = path
        .file_name()
        .map(|s| s.to_string_lossy().to_string())
        .unwrap_or_default();
    let stem = fname.trim_end_matches(".app").to_string();
    let info = read_bundle_info(&path.join("Contents/Info.plist"));

    let display_name = if !info.display_name.is_empty() && info.display_name.len() >= stem.len() {
        info.display_name
    } else {
        stem.clone()
    };

    let bundle_id = if !info.bundle_id.is_empty() {
        info.bundle_id
    } else {
        format!("local.app.{}", stem.to_lowercase().replace(' ', "-"))
    };

    let exec = if !info.executable.is_empty() {
        info.executable
    } else {
        stem.clone()
    };

    let arch = read_macho_arch(&path.join("Contents/MacOS").join(&exec));
    let app_size = dir_size_bounded(path, 20000);

    let mut matching_procs = Vec::new();
    let mut running_pids = Vec::new();
    for p in list_processes() {
        if p.command.contains(app_path) || p.name == exec {
            running_pids.push(p.pid);
            matching_procs.push(p);
        }
    }

    let mut items = Vec::new();
    let mut seen = HashSet::new();

    items.push(LeftoverItem {
        id: app_path.to_string(),
        path: app_path.to_string(),
        name: fname,
        category: "Application".to_string(),
        size_bytes: app_size,
        confidence: "Bundle".to_string(),
        is_directory: true,
        requires_sudo: app_path.starts_with("/System") || !parent_writable(path),
        selected_by_default: true,
    });
    seen.insert(app_path.to_string());

    let home = home_dir();
    let locations: Vec<(PathBuf, &str, bool)> = vec![
        (home.join("Library/Application Support"), "Application Support", false),
        (home.join("Library/Caches"), "Caches", false),
        (home.join("Library/Preferences"), "Preferences", false),
        (home.join("Library/Preferences/ByHost"), "Preferences (ByHost)", false),
        (home.join("Library/Saved Application State"), "Saved State", false),
        (home.join("Library/Logs"), "Logs", false),
        (home.join("Library/Containers"), "Containers", false),
        (home.join("Library/Group Containers"), "Group Containers", false),
        (home.join("Library/HTTPStorages"), "HTTP Storage", false),
        (home.join("Library/WebKit"), "WebKit", false),
        (home.join("Library/Cookies"), "Cookies", false),
        (home.join("Library/LaunchAgents"), "LaunchAgents", false),
        (PathBuf::from("/Library/Application Support"), "System Support", true),
        (PathBuf::from("/Library/Preferences"), "System Preferences", true),
        (PathBuf::from("/Library/LaunchAgents"), "System Agents", true),
        (PathBuf::from("/Library/LaunchDaemons"), "System Daemons", true),
        (PathBuf::from("/Library/PrivilegedHelperTools"), "Helper Tools", true),
        (PathBuf::from("/private/var/db/receipts"), "Receipts", true),
    ];

    let bid_lc = bundle_id.to_lowercase();
    let stem_lc = stem.to_lowercase();
    let stem_compact = stem_lc.replace(' ', "");
    let bid_segments: Vec<&str> = bid_lc.split('.').collect();
    let vendor_prefix = if bid_segments.len() >= 2
        && bid_segments[1] != "apple"
        && bid_segments[1].len() >= 4
    {
        Some(format!("{}.{}", bid_segments[0], bid_segments[1]))
    } else {
        None
    };

    for (dir, category, sudo) in locations {
        let Ok(entries) = fs::read_dir(&dir) else {
            continue;
        };

        for entry in entries.flatten() {
            let epath = entry.path();
            let epath_str = epath.to_string_lossy().to_string();
            if seen.contains(&epath_str) {
                continue;
            }
            let ename = entry.file_name().to_string_lossy().to_string();
            let ename_lc = ename.to_lowercase();
            let ename_compact = ename_lc.replace(' ', "");

            let mut match_kind = None;
            if !bid_lc.is_empty() && ename_lc.contains(&bid_lc) {
                match_kind = Some("Exact");
            } else if ename_lc == stem_lc || ename_compact == stem_compact {
                match_kind = Some("Exact");
            } else if let Some(ref vp) = vendor_prefix {
                if ename_lc.contains(vp) {
                    match_kind = Some("Vendor");
                }
            }
            if match_kind.is_none() && stem_compact.len() >= 4 && ename_compact.contains(&stem_compact) {
                match_kind = Some("Name");
            }

            if let Some(confidence) = match_kind {
                let size_bytes = dir_size_bounded(&epath, 12000);
                seen.insert(epath_str.clone());
                items.push(LeftoverItem {
                    id: epath_str.clone(),
                    path: epath_str,
                    name: ename,
                    category: category.to_string(),
                    size_bytes,
                    confidence: confidence.to_string(),
                    is_directory: epath.is_dir(),
                    requires_sudo: sudo,
                    selected_by_default: true,
                });
            }
        }
    }

    let leftovers_size: u64 = items.iter().skip(1).map(|i| i.size_bytes).sum();
    let total_bytes = app_size + leftovers_size;

    let app = InstalledApp {
        id: app_path.to_string(),
        name: display_name,
        bundle_id: bundle_id.clone(),
        version: if info.version.is_empty() {
            "1.0".to_string()
        } else {
            info.version
        },
        path: app_path.to_string(),
        executable: exec,
        app_size_bytes: app_size,
        leftovers_size_bytes: leftovers_size,
        total_size_bytes: total_bytes,
        leftover_count: items.len().saturating_sub(1),
        architecture: arch,
        source: "Applications".to_string(),
        last_modified: relative_mtime(path),
        is_running: !running_pids.is_empty(),
        running_pids,
        is_system: bundle_id.starts_with("com.apple."),
        publisher: vendor_from_id(&bundle_id),
    };

    Ok(AppDeepScanResult {
        app,
        items,
        running_processes: matching_procs,
        total_reclaimable_bytes: total_bytes,
    })
}

fn parent_writable(path: &Path) -> bool {
    path.parent()
        .and_then(|p| fs::metadata(p).ok())
        .map(|m| !m.permissions().readonly())
        .unwrap_or(false)
}

pub fn scan_orphaned_items() -> Vec<OrphanedItem> {
    let home = home_dir();
    let mut known = HashSet::new();

    for root in [PathBuf::from("/Applications"), home.join("Applications")] {
        let Ok(entries) = fs::read_dir(&root) else {
            continue;
        };
        for entry in entries.flatten() {
            let path = entry.path();
            let fname = entry.file_name().to_string_lossy().to_string();
            if !fname.ends_with(".app") {
                continue;
            }
            let stem = fname.trim_end_matches(".app").to_lowercase().replace(' ', "");
            if stem.len() >= 3 {
                known.insert(stem);
            }
            let info = read_bundle_info(&path.join("Contents/Info.plist"));
            let bid = info.bundle_id.to_lowercase();
            if !bid.is_empty() {
                known.insert(bid.clone());
                for seg in bid.split('.') {
                    if seg.len() >= 3 && !["com", "org", "net", "io", "app"].contains(&seg) {
                        known.insert(seg.to_string());
                    }
                }
            }
        }
    }

    for sys in [
        "apple", "icloud", "safari", "finder", "spotlight", "webkit", "llvm", "clang",
        "rust", "cargo", "npm", "node", "python", "pip", "homebrew", "git", "zsh",
        "google", "microsoft", "mozilla", "adobe", "crashreporter", "caches",
        "familycircle", "knowledge", "syncedpreferences", "assistant", "biome",
        "passkit", "cloudkit", "callhistory", "addressbook", "diskimages",
    ] {
        known.insert(sys.to_string());
    }

    let targets = [
        (home.join("Library/Application Support"), "Application Support", "Review"),
        (home.join("Library/Caches"), "Caches", "Safe"),
        (home.join("Library/Saved Application State"), "Saved State", "Safe"),
        (home.join("Library/HTTPStorages"), "HTTP Storage", "Safe"),
        (home.join("Library/Containers"), "Containers", "Review"),
        (home.join("Library/Logs"), "Logs", "Safe"),
        (home.join("Library/Preferences"), "Preferences", "Review"),
    ];

    let mut orphans = Vec::new();

    for (dir, category, risk) in targets {
        let Ok(rd) = fs::read_dir(&dir) else {
            continue;
        };
        for entry in rd.flatten() {
            let epath = entry.path();
            let ename = entry.file_name().to_string_lossy().to_string();
            let ename_lc = ename.to_lowercase();

            if ename_lc.starts_with('.')
                || ename_lc.starts_with("com.apple.")
                || ename_lc.starts_with("group.com.apple.")
                || ename_lc == "byhost"
            {
                continue;
            }

            let compact = ename_lc.replace(' ', "");
            if known.iter().any(|tok| tok.len() >= 4 && compact.contains(tok)) {
                continue;
            }

            let size_bytes = dir_size_bounded(&epath, 4000);
            if size_bytes < 4096 && category == "Preferences" {
                continue;
            }

            let epath_str = epath.to_string_lossy().to_string();
            orphans.push(OrphanedItem {
                id: epath_str.clone(),
                path: epath_str,
                name: ename.clone(),
                inferred_app: format_identifier_label(&ename),
                category: category.to_string(),
                size_bytes,
                last_modified: relative_mtime(&epath),
                risk_level: risk.to_string(),
            });
        }
    }

    orphans.sort_by(|a, b| b.size_bytes.cmp(&a.size_bytes));
    orphans.truncate(120);
    orphans
}

fn format_identifier_label(raw: &str) -> String {
    let cleaned = raw
        .trim_end_matches(".savedState")
        .trim_end_matches(".plist")
        .trim_end_matches(".binarycookies");
    let parts: Vec<&str> = cleaned.split('.').collect();
    if parts.len() >= 3 {
        let mut leaf = *parts.last().unwrap_or(&cleaned);
        if leaf.len() > 24 && parts.len() >= 4 {
            leaf = parts[parts.len() - 2];
        }
        return format!("{} ({})", capitalize(leaf), capitalize(parts[1]));
    }
    cleaned.to_string()
}

fn capitalize(s: &str) -> String {
    let mut chars = s.chars();
    match chars.next() {
        None => String::new(),
        Some(f) => f.to_uppercase().collect::<String>() + chars.as_str(),
    }
}

pub fn scan_startup_items() -> Vec<StartupItem> {
    let home = home_dir();
    let mut active_jobs: HashMap<String, Option<u32>> = HashMap::new();

    if let Some(out) = run_cmd("launchctl", &["list"]) {
        for line in out.lines().skip(1) {
            let cols: Vec<&str> = line.split_whitespace().collect();
            if cols.len() >= 3 {
                active_jobs.insert(cols[2].to_string(), cols[0].parse::<u32>().ok());
            }
        }
    }

    let dirs = [
        (home.join("Library/LaunchAgents"), "User Agent"),
        (PathBuf::from("/Library/LaunchAgents"), "System Agent"),
        (PathBuf::from("/Library/LaunchDaemons"), "System Daemon"),
    ];

    let mut items = Vec::new();

    for (dir, scope) in dirs {
        let Ok(rd) = fs::read_dir(&dir) else {
            continue;
        };
        for entry in rd.flatten() {
            let path = entry.path();
            let fname = entry.file_name().to_string_lossy().to_string();
            if !fname.ends_with(".plist") {
                continue;
            }

            let bytes = fs::read(&path).unwrap_or_default();
            let xml = if bytes.starts_with(b"bplist") {
                run_cmd(
                    "plutil",
                    &["-convert", "xml1", "-o", "-", &path.to_string_lossy()],
                )
                .unwrap_or_default()
            } else {
                String::from_utf8_lossy(&bytes).to_string()
            };

            let mut label = plist_string(&xml, "Label");
            if label.is_empty() {
                label = fname.trim_end_matches(".plist").to_string();
            }

            let mut program = plist_string(&xml, "Program");
            if program.is_empty() {
                program = plist_first_array_item(&xml, "ProgramArguments");
            }

            let run_at_load = plist_bool(&xml, "RunAtLoad");
            let keep_alive = plist_bool(&xml, "KeepAlive");
            let is_loaded = active_jobs.contains_key(&label);
            let pid = active_jobs.get(&label).and_then(|p| *p);
            let binary_exists = program.is_empty() || Path::new(&program).exists();
            let path_str = path.to_string_lossy().to_string();

            items.push(StartupItem {
                id: path_str.clone(),
                name: format_identifier_label(&label),
                label,
                program: if program.is_empty() {
                    "MachService / Bundle".to_string()
                } else {
                    program
                },
                plist_path: path_str,
                scope: scope.to_string(),
                run_at_load,
                keep_alive,
                is_loaded,
                pid,
                binary_exists,
            });
        }
    }

    items.sort_by(|a, b| b.is_loaded.cmp(&a.is_loaded).then(a.label.cmp(&b.label)));
    items
}

fn plist_first_array_item(xml: &str, key: &str) -> String {
    let tag = format!("<key>{}</key>", key);
    if let Some(pos) = xml.find(&tag) {
        let tail = &xml[pos + tag.len()..];
        if let Some(arr_end) = tail.find("</array>") {
            let block = &tail[..arr_end];
            if let Some(start) = block.find("<string>") {
                let rest = &block[start + 8..];
                if let Some(end) = rest.find("</string>") {
                    return rest[..end].trim().to_string();
                }
            }
        }
    }
    String::new()
}

fn plist_bool(xml: &str, key: &str) -> bool {
    let tag = format!("<key>{}</key>", key);
    if let Some(pos) = xml.find(&tag) {
        let snippet: String = xml[pos + tag.len()..].chars().take(60).collect();
        return snippet.contains("<true/>");
    }
    false
}

pub fn toggle_startup_item(plist_path: &str, enable: bool) -> Result<String, String> {
    let cmd = if enable { "load" } else { "unload" };
    let out = Command::new("launchctl")
        .args([cmd, "-w", plist_path])
        .output()
        .map_err(|e| e.to_string())?;

    if out.status.success() {
        Ok(format!("{}ed {}", cmd, plist_path))
    } else {
        Err(String::from_utf8_lossy(&out.stderr).trim().to_string())
    }
}

pub fn scan_managed_packages() -> Vec<ManagedPackage> {
    let mut pkgs = Vec::new();

    for cellar in ["/opt/homebrew/Cellar", "/usr/local/Cellar"] {
        let Ok(rd) = fs::read_dir(cellar) else {
            continue;
        };
        for entry in rd.flatten() {
            let name = entry.file_name().to_string_lossy().to_string();
            if name.starts_with('.') {
                continue;
            }
            let mut version = "installed".to_string();
            if let Ok(vers) = fs::read_dir(entry.path()) {
                for v in vers.flatten() {
                    let vname = v.file_name().to_string_lossy().to_string();
                    if !vname.starts_with('.') {
                        version = vname;
                    }
                }
            }
            pkgs.push(ManagedPackage {
                id: format!("brew:formula:{}", name),
                name: name.clone(),
                version,
                manager: "Homebrew Formula".to_string(),
                description: cellar.to_string(),
                uninstall_cmd: format!("brew uninstall {}", name),
            });
        }
    }

    for caskroom in ["/opt/homebrew/Caskroom", "/usr/local/Caskroom"] {
        let Ok(rd) = fs::read_dir(caskroom) else {
            continue;
        };
        for entry in rd.flatten() {
            let name = entry.file_name().to_string_lossy().to_string();
            if name.starts_with('.') {
                continue;
            }
            let mut version = "installed".to_string();
            if let Ok(vers) = fs::read_dir(entry.path()) {
                for v in vers.flatten() {
                    let vname = v.file_name().to_string_lossy().to_string();
                    if !vname.starts_with('.') {
                        version = vname;
                    }
                }
            }
            pkgs.push(ManagedPackage {
                id: format!("brew:cask:{}", name),
                name: name.clone(),
                version,
                manager: "Homebrew Cask".to_string(),
                description: caskroom.to_string(),
                uninstall_cmd: format!("brew uninstall --cask {}", name),
            });
        }
    }

    for nm in ["/opt/homebrew/lib/node_modules", "/usr/local/lib/node_modules"] {
        let Ok(rd) = fs::read_dir(nm) else {
            continue;
        };
        for entry in rd.flatten() {
            let name = entry.file_name().to_string_lossy().to_string();
            if name.starts_with('.') || name == "npm" || name == "corepack" {
                continue;
            }
            let version = read_package_json_version(&entry.path().join("package.json"));
            pkgs.push(ManagedPackage {
                id: format!("npm:{}", name),
                name: name.clone(),
                version,
                manager: "npm".to_string(),
                description: nm.to_string(),
                uninstall_cmd: format!("npm uninstall -g {}", name),
            });
        }
    }

    pkgs.sort_by(|a, b| a.manager.cmp(&b.manager).then(a.name.cmp(&b.name)));
    pkgs
}

fn read_package_json_version(path: &Path) -> String {
    fs::read_to_string(path)
        .ok()
        .and_then(|s| serde_json::from_str::<serde_json::Value>(&s).ok())
        .and_then(|v| v.get("version").and_then(|ver| ver.as_str()).map(String::from))
        .unwrap_or_else(|| "latest".to_string())
}

pub fn uninstall_managed_package(manager: &str, name: &str) -> Result<String, String> {
    let brew = if Path::new("/opt/homebrew/bin/brew").exists() {
        "/opt/homebrew/bin/brew"
    } else {
        "brew"
    };

    let output = match manager {
        "Homebrew Formula" => Command::new(brew).args(["uninstall", name]).output(),
        "Homebrew Cask" => Command::new(brew).args(["uninstall", "--cask", name]).output(),
        "npm" | "NPM Global" => Command::new("npm").args(["uninstall", "-g", name]).output(),
        _ => return Err(format!("Unsupported package manager: {}", manager)),
    }
    .map_err(|e| e.to_string())?;

    if output.status.success() {
        Ok(format!("Removed {}", name))
    } else {
        Err(String::from_utf8_lossy(&output.stderr).trim().to_string())
    }
}

pub fn kill_process(pid: u32, force: bool) -> Result<String, String> {
    let sig = if force { "-9" } else { "-15" };
    let out = Command::new("kill")
        .args([sig, &pid.to_string()])
        .output()
        .map_err(|e| e.to_string())?;

    if out.status.success() {
        Ok(format!("Terminated PID {}", pid))
    } else {
        Err(String::from_utf8_lossy(&out.stderr).trim().to_string())
    }
}

pub fn reveal_in_finder(path: &str) -> Result<String, String> {
    let out = Command::new("open")
        .args(["-R", path])
        .output()
        .map_err(|e| e.to_string())?;
    if out.status.success() {
        Ok("Revealed in Finder".to_string())
    } else {
        Err(String::from_utf8_lossy(&out.stderr).trim().to_string())
    }
}

pub fn execute_uninstall(req: UninstallRequest) -> UninstallResult {
    let mut killed_pids = Vec::new();
    for pid in &req.pids_to_kill {
        if kill_process(*pid, true).is_ok() {
            killed_pids.push(*pid);
        }
    }

    let trash_dir = home_dir().join(".Trash");
    let mut removed_paths = Vec::new();
    let mut failed_paths = Vec::new();
    let mut freed_bytes = 0u64;

    for raw in &req.paths {
        let p = Path::new(raw);
        if !p.exists() {
            continue;
        }
        if is_protected_system_path(raw) {
            failed_paths.push(format!("{} (protected)", raw));
            continue;
        }

        let size = dir_size_bounded(p, 40000);
        let result = if p == trash_dir {
            empty_directory_contents(&trash_dir)
        } else if req.permanent {
            if p.is_dir() {
                fs::remove_dir_all(p)
            } else {
                fs::remove_file(p)
            }
        } else {
            move_to_trash(p, &trash_dir, size)
        };

        match result {
            Ok(_) => {
                freed_bytes += size;
                removed_paths.push(raw.clone());
            }
            Err(e) => failed_paths.push(format!("{} ({})", raw, e)),
        }
    }

    let mode = if req.permanent { "permanent" } else { "trash" }.to_string();
    let success = failed_paths.is_empty() && !removed_paths.is_empty();
    let message = if success {
        format!(
            "Removed {} items ({})",
            removed_paths.len(),
            if req.permanent { "permanently deleted" } else { "moved to Trash" }
        )
    } else if !removed_paths.is_empty() {
        format!(
            "Removed {} items; {} failed (elevated permissions required)",
            removed_paths.len(),
            failed_paths.len()
        )
    } else {
        "No items were removed.".to_string()
    };

    UninstallResult {
        success,
        removed_paths,
        failed_paths,
        freed_bytes,
        mode,
        killed_pids,
        message,
    }
}

fn is_protected_system_path(raw: &str) -> bool {
    const PROTECTED: [&str; 10] = [
        "/",
        "/Applications",
        "/System",
        "/Library",
        "/Users",
        "/bin",
        "/sbin",
        "/usr",
        "/var",
        "/private",
    ];
    PROTECTED.contains(&raw) || raw.starts_with("/System/")
}

fn empty_directory_contents(dir: &Path) -> std::io::Result<()> {
    if let Ok(rd) = fs::read_dir(dir) {
        for entry in rd.flatten() {
            let p = entry.path();
            if p.is_dir() {
                let _ = fs::remove_dir_all(&p);
            } else {
                let _ = fs::remove_file(&p);
            }
        }
    }
    for item in get_trash_history() {
        let p = Path::new(&item.trash_path);
        if p.exists() {
            if p.is_dir() {
                let _ = fs::remove_dir_all(p);
            } else {
                let _ = fs::remove_file(p);
            }
        }
    }
    let _ = fs::write(history_file_path(), "[]");
    Ok(())
}

fn move_to_trash(src: &Path, trash: &Path, size_bytes: u64) -> std::io::Result<()> {
    let name = src
        .file_name()
        .map(|s| s.to_string_lossy().to_string())
        .unwrap_or_else(|| "item".to_string());
    let ts = std::time::SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_secs())
        .unwrap_or(1);
    let mut dst = trash.join(&name);
    if dst.exists() {
        dst = trash.join(format!("{}_{}", ts, name));
    }
    let moved = match fs::rename(src, &dst) {
        Ok(()) => Ok(()),
        Err(e) => {
            let status = Command::new("mv").args([src, &dst]).status()?;
            if status.success() {
                Ok(())
            } else {
                Err(e)
            }
        }
    };
    if moved.is_ok() {
        let now_str = run_cmd("date", &["+%Y-%m-%d %H:%M:%S"])
            .map(|s| s.trim().to_string())
            .unwrap_or_else(|| "Just now".to_string());
        record_trash_history(TrashHistoryEntry {
            id: format!("{}_{}", ts, name),
            name,
            original_path: src.to_string_lossy().to_string(),
            trash_path: dst.to_string_lossy().to_string(),
            size_bytes,
            deleted_at: now_str,
            exists_in_trash: true,
        });
    }
    moved
}

fn history_file_path() -> PathBuf {
    home_dir().join(".zerotrash_history.json")
}

fn record_trash_history(entry: TrashHistoryEntry) {
    let path = history_file_path();
    let mut list: Vec<TrashHistoryEntry> = fs::read_to_string(&path)
        .ok()
        .and_then(|s| serde_json::from_str(&s).ok())
        .unwrap_or_default();
    list.insert(0, entry);
    list.truncate(200);
    if let Ok(json) = serde_json::to_string_pretty(&list) {
        let _ = fs::write(path, json);
    }
}

pub fn get_trash_history() -> Vec<TrashHistoryEntry> {
    let path = history_file_path();
    let mut list: Vec<TrashHistoryEntry> = fs::read_to_string(&path)
        .ok()
        .and_then(|s| serde_json::from_str(&s).ok())
        .unwrap_or_default();

    for item in &mut list {
        item.exists_in_trash = Path::new(&item.trash_path).exists();
    }

    // Also include any items currently in ~/.Trash that are not in the ledger
    let trash_dir = home_dir().join(".Trash");
    let known_trash: HashSet<String> = list.iter().map(|i| i.trash_path.clone()).collect();
    if let Ok(rd) = fs::read_dir(&trash_dir) {
        for entry in rd.flatten() {
            let p = entry.path();
            let fname = entry.file_name().to_string_lossy().to_string();
            if fname.starts_with('.') {
                continue;
            }
            let p_str = p.to_string_lossy().to_string();
            if known_trash.contains(&p_str) {
                continue;
            }
            let size = dir_size_bounded(&p, 8000);
            list.push(TrashHistoryEntry {
                id: p_str.clone(),
                name: fname.clone(),
                original_path: home_dir().join("Downloads").join(&fname).to_string_lossy().to_string(),
                trash_path: p_str,
                size_bytes: size,
                deleted_at: relative_mtime(&p),
                exists_in_trash: true,
            });
        }
    }

    // Also probe known cache/app targets in ~/.Trash in case read_dir(~/.Trash) is restricted by TCC
    let home = home_dir();
    let known_recoverable: Vec<(&str, PathBuf)> = vec![
        ("_cacache", home.join(".npm/_cacache")),
        ("caches", home.join(".gradle/caches")),
        ("wrapper", home.join(".gradle/wrapper")),
        ("com.spotify.client", home.join("Library/Caches/com.spotify.client")),
        ("Homebrew", home.join("Library/Caches/Homebrew")),
        ("node-gyp", home.join("Library/Caches/node-gyp")),
        (".cache", home.join(".cache")),
        ("ms-playwright", home.join("Library/Caches/ms-playwright")),
        ("dotslash", home.join("Library/Caches/dotslash")),
        ("pip", home.join("Library/Caches/pip")),
        ("DerivedData", home.join("Library/Developer/Xcode/DerivedData")),
    ];

    for (trash_name, orig_path) in known_recoverable {
        let tp = trash_dir.join(trash_name);
        let tp_str = tp.to_string_lossy().to_string();
        if !known_trash.contains(&tp_str) && tp.exists() {
            let size = dir_size_bounded(&tp, 25000);
            list.push(TrashHistoryEntry {
                id: tp_str.clone(),
                name: trash_name.to_string(),
                original_path: orig_path.to_string_lossy().to_string(),
                trash_path: tp_str,
                size_bytes: size,
                deleted_at: relative_mtime(&tp),
                exists_in_trash: true,
            });
        }
    }

    list
}

pub fn restore_trash_items(ids: Vec<String>) -> RestoreResult {
    let path = history_file_path();
    let list: Vec<TrashHistoryEntry> = get_trash_history();
    let id_set: HashSet<String> = ids.into_iter().collect();

    let mut restored_count = 0usize;
    let mut failed_items = Vec::new();
    let mut restored_trash_paths = HashSet::new();

    for entry in &list {
        if !id_set.contains(&entry.id) && !id_set.contains(&entry.trash_path) {
            continue;
        }
        let src = Path::new(&entry.trash_path);
        if !src.exists() {
            failed_items.push(format!("{} (no longer in Trash)", entry.name));
            continue;
        }
        let dst = PathBuf::from(&entry.original_path);
        if let Some(parent) = dst.parent() {
            let _ = fs::create_dir_all(parent);
        }
        let final_dst = if dst.exists() {
            let ts = std::time::SystemTime::now()
                .duration_since(UNIX_EPOCH)
                .map(|d| d.as_secs())
                .unwrap_or(1);
            dst.with_file_name(format!("{}_restored_{}", entry.name, ts))
        } else {
            dst
        };

        let res = match fs::rename(src, &final_dst) {
            Ok(()) => Ok(()),
            Err(e) => {
                let status = Command::new("mv").args([src, &final_dst]).status();
                if status.map(|s| s.success()).unwrap_or(false) {
                    Ok(())
                } else {
                    Err(e)
                }
            }
        };

        match res {
            Ok(()) => {
                restored_count += 1;
                restored_trash_paths.insert(entry.trash_path.clone());
            }
            Err(e) => failed_items.push(format!("{} ({})", entry.name, e)),
        }
    }

    let remaining: Vec<TrashHistoryEntry> = fs::read_to_string(&path)
        .ok()
        .and_then(|s| serde_json::from_str::<Vec<TrashHistoryEntry>>(&s).ok())
        .unwrap_or_default()
        .into_iter()
        .filter(|e| !restored_trash_paths.contains(&e.trash_path))
        .collect();
    if let Ok(json) = serde_json::to_string_pretty(&remaining) {
        let _ = fs::write(&path, json);
    }

    let success = failed_items.is_empty() && restored_count > 0;
    let message = if success {
        format!("Restored {} items to their original locations.", restored_count)
    } else if restored_count > 0 {
        format!(
            "Restored {} items; {} failed.",
            restored_count,
            failed_items.len()
        )
    } else {
        "No items could be restored.".to_string()
    };

    RestoreResult {
        success,
        restored_count,
        failed_items,
        message,
    }
}

pub fn scan_system_plugins() -> Vec<SystemPlugin> {
    let home = home_dir();
    let mut plugins = Vec::new();

    let bundle_dirs: Vec<(PathBuf, &str, &str)> = vec![
        (PathBuf::from("/Library/Audio/Plug-Ins/Components"), "Audio Unit", "System"),
        (home.join("Library/Audio/Plug-Ins/Components"), "Audio Unit", "User"),
        (PathBuf::from("/Library/Audio/Plug-Ins/VST3"), "VST3", "System"),
        (home.join("Library/Audio/Plug-Ins/VST3"), "VST3", "User"),
        (PathBuf::from("/Library/Audio/Plug-Ins/VST"), "VST", "System"),
        (home.join("Library/Audio/Plug-Ins/VST"), "VST", "User"),
        (PathBuf::from("/Library/Audio/Plug-Ins/CLAP"), "CLAP", "System"),
        (home.join("Library/Audio/Plug-Ins/CLAP"), "CLAP", "User"),
        (PathBuf::from("/Library/Audio/Plug-Ins/HAL"), "CoreAudio HAL", "System"),
        (PathBuf::from("/Library/Application Support/Avid/Audio/Plug-Ins"), "AAX", "System"),
        (PathBuf::from("/Library/PreferencePanes"), "PreferencePane", "System"),
        (home.join("Library/PreferencePanes"), "PreferencePane", "User"),
        (PathBuf::from("/Library/QuickLook"), "QuickLook", "System"),
        (home.join("Library/QuickLook"), "QuickLook", "User"),
        (PathBuf::from("/Library/Screen Savers"), "ScreenSaver", "System"),
        (home.join("Library/Screen Savers"), "ScreenSaver", "User"),
        (PathBuf::from("/Library/Spotlight"), "Spotlight", "System"),
        (home.join("Library/Spotlight"), "Spotlight", "User"),
        (PathBuf::from("/Library/Internet Plug-Ins"), "Browser Plug-In", "System"),
        (home.join("Library/Internet Plug-Ins"), "Browser Plug-In", "User"),
        (PathBuf::from("/Library/Input Methods"), "Input Method", "System"),
        (home.join("Library/Input Methods"), "Input Method", "User"),
    ];

    for (dir, kind, scope) in bundle_dirs {
        let Ok(rd) = fs::read_dir(&dir) else {
            continue;
        };
        for entry in rd.flatten() {
            let path = entry.path();
            let fname = entry.file_name().to_string_lossy().to_string();
            if fname.starts_with('.') || fname == "Disabled" {
                continue;
            }
            if !path.is_dir() {
                continue;
            }

            let info = read_bundle_info(&path.join("Contents/Info.plist"));
            let stem = fname
                .split('.')
                .next()
                .unwrap_or(&fname)
                .to_string();
            let name = if !info.display_name.is_empty() {
                info.display_name
            } else if !info.bundle_name.is_empty() {
                info.bundle_name
            } else {
                stem.clone()
            };

            let bundle_id = if !info.bundle_id.is_empty() {
                info.bundle_id
            } else {
                format!("plugin.{}.{}", kind.to_lowercase().replace(' ', ""), stem.to_lowercase())
            };

            let exec = if !info.executable.is_empty() {
                info.executable
            } else {
                stem.clone()
            };

            let arch = read_macho_arch(&path.join("Contents/MacOS").join(&exec));
            let size_bytes = dir_size_bounded(&path, 4000);
            let path_str = path.to_string_lossy().to_string();

            plugins.push(SystemPlugin {
                id: path_str.clone(),
                name,
                bundle_id,
                version: if info.version.is_empty() {
                    "1.0".to_string()
                } else {
                    info.version
                },
                kind: kind.to_string(),
                architecture: arch,
                scope: scope.to_string(),
                path: path_str,
                size_bytes,
                last_modified: relative_mtime(&path),
            });
        }
    }

    let ide_dirs = [
        (home.join(".vscode/extensions"), "VS Code Extension"),
        (home.join(".cursor/extensions"), "Cursor Extension"),
    ];

    for (dir, kind) in ide_dirs {
        let Ok(rd) = fs::read_dir(&dir) else {
            continue;
        };
        for entry in rd.flatten() {
            let path = entry.path();
            let fname = entry.file_name().to_string_lossy().to_string();
            if fname.starts_with('.') || !path.is_dir() {
                continue;
            }

            let pkg_json = path.join("package.json");
            let mut name = fname.clone();
            let mut version = "1.0".to_string();
            let mut bundle_id = fname.clone();

            if let Ok(raw) = fs::read_to_string(&pkg_json) {
                if let Ok(val) = serde_json::from_str::<serde_json::Value>(&raw) {
                    if let Some(v) = val.get("version").and_then(|x| x.as_str()) {
                        version = v.to_string();
                    }
                    let pub_name = val.get("publisher").and_then(|x| x.as_str()).unwrap_or("");
                    let pkg_name = val.get("name").and_then(|x| x.as_str()).unwrap_or("");
                    if !pub_name.is_empty() && !pkg_name.is_empty() {
                        bundle_id = format!("{}.{}", pub_name, pkg_name);
                        name = pkg_name.to_string();
                    }
                }
            }

            let size_bytes = dir_size_bounded(&path, 3000);
            let path_str = path.to_string_lossy().to_string();

            plugins.push(SystemPlugin {
                id: path_str.clone(),
                name,
                bundle_id,
                version,
                kind: kind.to_string(),
                architecture: "Universal".to_string(),
                scope: "User".to_string(),
                path: path_str,
                size_bytes,
                last_modified: relative_mtime(&path),
            });
        }
    }

    plugins.sort_by(|a, b| b.size_bytes.cmp(&a.size_bytes));
    plugins
}

pub fn get_performance_snapshot() -> PerformanceSnapshot {
    let uptime_raw = run_cmd("uptime", &[]).unwrap_or_default();
    let uptime = uptime_raw
        .split("up ")
        .nth(1)
        .and_then(|s| s.split(',').next())
        .map(|s| s.trim().to_string())
        .unwrap_or_else(|| "Active".to_string());

    let load_average = run_cmd("sysctl", &["-n", "vm.loadavg"])
        .map(|s| s.trim().trim_matches(|c| c == '{' || c == '}').trim().to_string())
        .unwrap_or_else(|| "—".to_string());

    let swap_raw = run_cmd("sysctl", &["-n", "vm.swapusage"]).unwrap_or_default();
    let swap_used = swap_raw
        .split("used = ")
        .nth(1)
        .and_then(|s| s.split_whitespace().next())
        .unwrap_or("0.00M")
        .to_string();

    let mem_pressure = run_cmd("memory_pressure", &["-Q"])
        .and_then(|s| {
            s.lines()
                .find(|l| l.contains("System-wide memory free percentage"))
                .map(|l| {
                    let val = l.replace("System-wide memory free percentage:", "").trim().trim_end_matches('%').to_string();
                    format!("{}% free", val)
                })
        })
        .unwrap_or_else(|| "Normal".to_string());

    let snapshots_out = run_cmd("tmutil", &["listlocalsnapshots", "/"]).unwrap_or_default();
    let local_snapshots_count = snapshots_out
        .lines()
        .filter(|l| l.contains("com.apple.TimeMachine"))
        .count();

    let cpu_brand = run_cmd("sysctl", &["-n", "machdep.cpu.brand_string"])
        .map(|s| s.trim().to_string())
        .filter(|s| !s.is_empty())
        .unwrap_or_else(|| "Apple Silicon".to_string());

    let cpu_cores = run_cmd("sysctl", &["-n", "hw.ncpu"])
        .and_then(|s| s.trim().parse::<usize>().ok())
        .unwrap_or(8);

    let ram_total_bytes = run_cmd("sysctl", &["-n", "hw.memsize"])
        .and_then(|s| s.trim().parse::<u64>().ok())
        .unwrap_or(16 * 1024 * 1024 * 1024);

    let mut page_size = 16384u64;
    let mut pages_active = 0u64;
    let mut pages_wired = 0u64;
    let mut pages_compressed = 0u64;
    if let Some(vm) = run_cmd("vm_stat", &[]) {
        for line in vm.lines() {
            if let Some(idx) = line.find("page size of ") {
                let rest = &line[idx + 13..];
                if let Some(end) = rest.find(' ') {
                    page_size = rest[..end].parse::<u64>().unwrap_or(16384);
                }
            } else if line.starts_with("Pages active:") {
                pages_active = parse_vm_stat_val(line);
            } else if line.starts_with("Pages wired down:") {
                pages_wired = parse_vm_stat_val(line);
            } else if line.starts_with("Pages occupied by compressor:") {
                pages_compressed = parse_vm_stat_val(line);
            }
        }
    }
    let ram_wired_bytes = pages_wired * page_size;
    let ram_compressed_bytes = pages_compressed * page_size;
    let ram_used_bytes = (pages_active + pages_wired + pages_compressed)
        .saturating_mul(page_size)
        .min(ram_total_bytes);

    let mut battery_present = false;
    let mut battery_percent = 100u8;
    let mut battery_charging = false;
    let mut battery_cycle_count = 0u32;
    let mut nominal_cap = 0u64;
    let mut design_cap = 0u64;
    let mut voltage_mv = 11800u64;

    if let Some(batt) = run_cmd("ioreg", &["-rw0", "-c", "AppleSmartBattery"]) {
        battery_present = batt.contains("\"BatteryInstalled\" = Yes");
        let mut got_cap = false;
        let mut got_cycle = false;
        let mut got_volt = false;
        for line in batt.lines() {
            let trimmed = line.trim().trim_start_matches('|').trim();
            if !got_cap && trimmed.starts_with("\"CurrentCapacity\" = ") {
                if let Some(v) = trimmed.split("= ").nth(1) {
                    if let Ok(parsed) = v.trim().parse::<u8>() {
                        battery_percent = parsed;
                        got_cap = true;
                    }
                }
            } else if trimmed.starts_with("\"IsCharging\" = ") {
                battery_charging = trimmed.ends_with("Yes");
            } else if !got_cycle && trimmed.starts_with("\"CycleCount\" = ") {
                if let Some(v) = trimmed.split("= ").nth(1) {
                    if let Ok(parsed) = v.trim().parse::<u32>() {
                        battery_cycle_count = parsed;
                        got_cycle = true;
                    }
                }
            } else if !got_volt && trimmed.starts_with("\"Voltage\" = ") {
                if let Some(v) = trimmed.split("= ").nth(1) {
                    if let Ok(parsed) = v.trim().parse::<u64>() {
                        voltage_mv = parsed;
                        got_volt = true;
                    }
                }
            } else if trimmed.contains("\"DesignCapacity\"=") {
                design_cap = extract_inline_num(trimmed, "\"DesignCapacity\"=");
                nominal_cap = extract_inline_num(trimmed, "\"NominalChargeCapacity\"=");
                if nominal_cap == 0 {
                    nominal_cap = extract_inline_num(trimmed, "\"AppleRawMaxCapacity\"=");
                }
            }
        }
    }

    let battery_health_pct = if design_cap > 0 && nominal_cap > 0 {
        ((nominal_cap as f64 / design_cap as f64) * 100.0)
            .round()
            .clamp(50.0, 100.0) as u8
    } else {
        100
    };
    let battery_temperature_c = (voltage_mv as f32) / 1000.0;
    let battery_condition = if battery_health_pct >= 80 {
        "Normal".to_string()
    } else {
        "Service Recommended".to_string()
    };

    let mut top_processes = Vec::new();
    if let Some(out) = run_cmd("ps", &["-Ao", "pid=,pcpu=,pmem=,rss=,comm=", "-r"]) {
        for line in out.lines().take(25) {
            let cols: Vec<&str> = line.split_whitespace().collect();
            if cols.len() >= 5 {
                let Ok(pid) = cols[0].parse::<u32>() else { continue };
                let cpu_pct = cols[1].parse::<f32>().unwrap_or(0.0);
                let mem_pct = cols[2].parse::<f32>().unwrap_or(0.0);
                let rss_kb = cols[3].parse::<u64>().unwrap_or(0);
                let comm = cols[4..].join(" ");
                let name = Path::new(&comm)
                    .file_name()
                    .map(|s| s.to_string_lossy().to_string())
                    .unwrap_or_else(|| comm.clone());

                top_processes.push(ProcessMetric {
                    pid,
                    name,
                    command: comm,
                    cpu_pct,
                    mem_pct,
                    memory_bytes: rss_kb * 1024,
                });
            }
        }
    }

    let tasks = vec![
        MaintenanceTask {
            id: "flush_dns".to_string(),
            title: "Flush DNS Resolver Cache".to_string(),
            category: "Network".to_string(),
            description: "Clears local DNS records and reloads mDNSResponder.".to_string(),
            command_preview: "dscacheutil -flushcache".to_string(),
            safe: true,
        },
        MaintenanceTask {
            id: "reset_quicklook".to_string(),
            title: "Reset QuickLook Server & Thumbnail Cache".to_string(),
            category: "System UI".to_string(),
            description: "Rebuilds Finder icon previews and clears cached QuickLook thumbnails.".to_string(),
            command_preview: "qlmanage -r && qlmanage -r cache".to_string(),
            safe: true,
        },
        MaintenanceTask {
            id: "rebuild_launchservices".to_string(),
            title: "Rebuild LaunchServices Database".to_string(),
            category: "System UI".to_string(),
            description: "Fixes duplicate or missing entries in Finder's 'Open With' menu.".to_string(),
            command_preview: "lsregister -kill -r -domain local -domain user".to_string(),
            safe: true,
        },
        MaintenanceTask {
            id: "clean_font_cache".to_string(),
            title: "Clear User Font Database Cache".to_string(),
            category: "Typography".to_string(),
            description: "Removes corrupted user font caches managed by Apple Type Services.".to_string(),
            command_preview: "atsutil databases -removeUser".to_string(),
            safe: true,
        },
        MaintenanceTask {
            id: "brew_cleanup".to_string(),
            title: "Prune Homebrew Downloads & Old Bottles".to_string(),
            category: "Package Manager".to_string(),
            description: "Removes outdated formula downloads and cached installers from Homebrew.".to_string(),
            command_preview: "brew cleanup --prune=all".to_string(),
            safe: true,
        },
        MaintenanceTask {
            id: "npm_cache_verify".to_string(),
            title: "Verify & Garbage-Collect npm Cache".to_string(),
            category: "Developer".to_string(),
            description: "Verifies integrity and reclaims wasted space in ~/.npm/_cacache.".to_string(),
            command_preview: "npm cache verify".to_string(),
            safe: true,
        },
    ];

    PerformanceSnapshot {
        uptime,
        load_average,
        memory_pressure: mem_pressure,
        swap_used,
        local_snapshots_count,
        cpu_brand,
        cpu_cores,
        ram_total_bytes,
        ram_used_bytes,
        ram_wired_bytes,
        ram_compressed_bytes,
        battery_present,
        battery_percent,
        battery_charging,
        battery_health_pct,
        battery_cycle_count,
        battery_temperature_c,
        battery_condition,
        top_processes,
        tasks,
    }
}

fn parse_vm_stat_val(line: &str) -> u64 {
    line.split(':')
        .nth(1)
        .map(|s| s.trim().trim_end_matches('.'))
        .and_then(|s| s.parse::<u64>().ok())
        .unwrap_or(0)
}

fn extract_inline_num(line: &str, key: &str) -> u64 {
    if let Some(pos) = line.find(key) {
        let rest = &line[pos + key.len()..];
        let digits: String = rest.chars().take_while(|c| c.is_ascii_digit()).collect();
        return digits.parse::<u64>().unwrap_or(0);
    }
    0
}

pub fn run_maintenance_task(task_id: &str) -> Result<MaintenanceResult, String> {
    let start = std::time::Instant::now();
    let brew = if Path::new("/opt/homebrew/bin/brew").exists() {
        "/opt/homebrew/bin/brew"
    } else {
        "brew"
    };

    let output = match task_id {
        "flush_dns" => Command::new("dscacheutil").arg("-flushcache").output(),
        "reset_quicklook" => Command::new("qlmanage").args(["-r", "cache"]).output(),
        "rebuild_launchservices" => Command::new(
            "/System/Library/Frameworks/CoreServices.framework/Frameworks/LaunchServices.framework/Support/lsregister",
        )
        .args(["-kill", "-r", "-domain", "local", "-domain", "user"])
        .output(),
        "clean_font_cache" => Command::new("atsutil").args(["databases", "-removeUser"]).output(),
        "brew_cleanup" => Command::new(brew).args(["cleanup", "--prune=all"]).output(),
        "npm_cache_verify" => Command::new("npm").args(["cache", "verify"]).output(),
        _ => return Err(format!("Unknown task: {}", task_id)),
    }
    .map_err(|e| e.to_string())?;

    let duration_ms = start.elapsed().as_millis() as u64;
    let stdout = String::from_utf8_lossy(&output.stdout).trim().to_string();
    let stderr = String::from_utf8_lossy(&output.stderr).trim().to_string();
    let combined = if !stdout.is_empty() {
        stdout
    } else if !stderr.is_empty() {
        stderr
    } else {
        "Task completed.".to_string()
    };

    Ok(MaintenanceResult {
        task_id: task_id.to_string(),
        success: output.status.success(),
        output: combined,
        duration_ms,
    })
}

pub fn scan_developer_caches() -> Vec<CacheTarget> {
    let home = home_dir();
    let candidates: Vec<(PathBuf, &str, &str, &str)> = vec![
        (
            home.join("Library/Caches/Homebrew"),
            "Homebrew Download Cache",
            "Package Manager",
            "Downloaded bottles, casks, and source tarballs.",
        ),
        (
            home.join(".npm/_cacache"),
            "npm Content-Addressable Cache",
            "Developer",
            "Cached tarballs and HTTP metadata from npm installs.",
        ),
        (
            home.join(".cargo/registry/cache"),
            "Cargo Registry Crate Cache",
            "Developer",
            "Downloaded .crate archives for Rust dependencies.",
        ),
        (
            home.join(".cargo/git/db"),
            "Cargo Git Repositories",
            "Developer",
            "Cloned git dependencies used by Cargo builds.",
        ),
        (
            home.join("Library/Caches/ms-playwright"),
            "Playwright Browser Binaries",
            "Developer",
            "Downloaded Chromium, Firefox, and WebKit test browsers.",
        ),
        (
            home.join("Library/Caches/dotslash"),
            "DotSlash Binary Cache",
            "Developer",
            "Extracted CLI binaries managed by DotSlash.",
        ),
        (
            home.join("Library/Caches/node-gyp"),
            "node-gyp Native Build Cache",
            "Developer",
            "Cached Node.js C/C++ headers and build artifacts.",
        ),
        (
            home.join("Library/Caches/pip"),
            "Python pip Wheel Cache",
            "Developer",
            "Cached Python wheels and source packages.",
        ),
        (
            home.join(".cache"),
            "XDG User Cache (~/.cache)",
            "Developer",
            "CLI tool, AI model, and package caches stored in ~/.cache.",
        ),
        (
            home.join("Library/Developer/Xcode/DerivedData"),
            "Xcode DerivedData",
            "IDE & Build",
            "Intermediate build artifacts and indexes for Xcode projects.",
        ),
        (
            home.join("Library/Developer/CoreSimulator/Caches"),
            "CoreSimulator Caches",
            "IDE & Build",
            "Runtime caches for iOS / watchOS simulators.",
        ),
        (
            home.join(".gradle/caches"),
            "Gradle Build Cache",
            "IDE & Build",
            "Downloaded JARs and compiled task outputs for Gradle.",
        ),
        (
            home.join(".gradle/wrapper"),
            "Gradle Wrapper Distributions",
            "IDE & Build",
            "Downloaded Gradle runtime distributions in ~/.gradle/wrapper.",
        ),
        (
            home.join("Library/Caches/com.spotify.client"),
            "Spotify Streaming Media Cache",
            "Chat & Media",
            "Cached audio streams and album artwork from Spotify (keeps account logged in).",
        ),
        (
            home.join("Library/Application Support/discord/Cache"),
            "Discord Media & Attachment Cache",
            "Chat & Media",
            "Cached images, GIFs, and voice/video buffers from Discord (keeps login).",
        ),
        (
            home.join("Library/Application Support/discord/Code Cache"),
            "Discord V8 & GPU Shader Cache",
            "Chat & Media",
            "Compiled JavaScript bytecode and WebGL caches for Discord.",
        ),
        (
            home.join("Library/Application Support/Slack/Cache"),
            "Slack Workspace Media Cache",
            "Chat & Media",
            "Temporary workspace images and attachment previews (keeps login).",
        ),
        (
            home.join("Library/Application Support/Slack/Service Worker/CacheStorage"),
            "Slack Service Worker Cache",
            "Chat & Media",
            "Offline web worker assets cached by Slack.",
        ),
        (
            home.join("Library/Containers/com.microsoft.teams2/Data/Library/Caches"),
            "Microsoft Teams Cache",
            "Chat & Media",
            "Temporary call and meeting caches for Microsoft Teams.",
        ),
        (
            home.join("Library/Application Support/Steam/appcache"),
            "Steam Client & Shader AppCache",
            "Gaming",
            "Cached store metadata, depot manifests, and shader caches for Steam.",
        ),
        (
            home.join("Library/Caches/Google/Chrome"),
            "Google Chrome Web Cache",
            "Browser",
            "Temporary web assets and media cached by Chrome (preserves passwords & cookies).",
        ),
        (
            home.join("Library/Application Support/Google/Chrome/Default/Service Worker/CacheStorage"),
            "Chrome Service Worker CacheStorage",
            "Browser",
            "Offline PWA and Service Worker storage in Chrome (preserves logins).",
        ),
        (
            home.join("Library/Application Support/Google/Chrome/ShaderCache"),
            "Chrome GPU & WebGL Shader Cache",
            "Browser",
            "Compiled GPU shaders cached by Google Chrome.",
        ),
        (
            home.join("Library/Caches/BraveSoftware/Brave-Browser"),
            "Brave Browser Web Cache",
            "Browser",
            "Temporary web assets cached by Brave (preserves logins & shields).",
        ),
        (
            home.join("Library/Caches/Microsoft Edge"),
            "Microsoft Edge Web Cache",
            "Browser",
            "Temporary web assets cached by Edge (preserves logins).",
        ),
        (
            home.join("Library/Caches/Firefox/Profiles"),
            "Mozilla Firefox Profile Cache",
            "Browser",
            "Temporary disk cache2 buffers for Firefox profiles.",
        ),
        (
            home.join("Library/Caches/com.apple.Safari"),
            "Safari Web Cache",
            "Browser",
            "Temporary web assets cached by Safari.",
        ),
        (
            home.join("Library/Logs/DiagnosticReports"),
            "macOS Crash & Diagnostic Reports",
            "System Logs",
            "Application crash dumps (.ips / .crash) in ~/Library/Logs/DiagnosticReports.",
        ),
        (
            home.join("Library/Logs"),
            "User Application & Diagnostic Logs",
            "System Logs",
            "Log files and diagnostic traces stored in ~/Library/Logs.",
        ),
    ];

    let mut targets = Vec::new();
    for (path, name, category, desc) in candidates {
        if !path.exists() {
            continue;
        }
        let size_bytes = dir_size_bounded(&path, 50000);
        if size_bytes < 1024 * 64 {
            continue;
        }
        let path_str = path.to_string_lossy().to_string();
        targets.push(CacheTarget {
            id: path_str.clone(),
            name: name.to_string(),
            category: category.to_string(),
            path: path_str,
            size_bytes,
            description: desc.to_string(),
        });
    }

    targets.sort_by(|a, b| b.size_bytes.cmp(&a.size_bytes));
    targets
}

pub fn scan_large_and_old_files(min_bytes: u64) -> Vec<LargeFileItem> {
    let home = home_dir();
    let threshold = if min_bytes == 0 {
        20 * 1024 * 1024
    } else {
        min_bytes
    };

    let roots = [
        home.join("Downloads"),
        home.join("Desktop"),
        home.join("Documents"),
        home.join("Movies"),
        home.join("Music"),
        home.join("Public"),
    ];

    let now_secs = std::time::SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_secs())
        .unwrap_or(0);

    let mut results = Vec::new();
    let mut visited = 0usize;

    for root in roots {
        if !root.exists() {
            continue;
        }
        let mut stack = vec![(root, 0usize)];
        while let Some((curr, depth)) = stack.pop() {
            if visited > 25000 || depth > 4 {
                continue;
            }
            let Ok(rd) = fs::read_dir(&curr) else {
                continue;
            };
            for entry in rd.flatten() {
                visited += 1;
                let path = entry.path();
                let fname = entry.file_name().to_string_lossy().to_string();
                if fname.starts_with('.')
                    || fname == "node_modules"
                    || fname == "target"
                    || fname == "dist"
                    || fname == "build"
                {
                    continue;
                }
                let Ok(ft) = entry.file_type() else {
                    continue;
                };
                if ft.is_symlink() {
                    continue;
                }
                if ft.is_dir() {
                    if fname.ends_with(".app") {
                        continue;
                    }
                    let ext = path
                        .extension()
                        .map(|e| e.to_string_lossy().to_lowercase())
                        .unwrap_or_default();
                    if ["pkg", "mpkg", "download", "band", "logicx"].contains(&ext.as_str()) {
                        let size = dir_size_bounded(&path, 8000);
                        if size >= threshold {
                            let category = classify_file_ext(&ext);
                            let mtime_secs = entry
                                .metadata()
                                .ok()
                                .and_then(|m| m.modified().ok())
                                .and_then(|t| t.duration_since(UNIX_EPOCH).ok())
                                .map(|d| d.as_secs())
                                .unwrap_or(now_secs);
                            let days_old = now_secs.saturating_sub(mtime_secs) / 86400;
                            let path_str = path.to_string_lossy().to_string();
                            results.push(LargeFileItem {
                                id: path_str.clone(),
                                name: fname,
                                path: path_str,
                                category: category.to_string(),
                                extension: ext,
                                size_bytes: size,
                                last_modified: relative_mtime(&path),
                                days_old,
                            });
                        }
                        continue;
                    }
                    stack.push((path, depth + 1));
                } else if ft.is_file() {
                    let Ok(meta) = entry.metadata() else {
                        continue;
                    };
                    let size = meta.len();
                    if size < threshold {
                        continue;
                    }
                    let ext = path
                        .extension()
                        .map(|e| e.to_string_lossy().to_lowercase())
                        .unwrap_or_default();
                    let category = classify_file_ext(&ext);
                    let mtime_secs = meta
                        .modified()
                        .ok()
                        .and_then(|t| t.duration_since(UNIX_EPOCH).ok())
                        .map(|d| d.as_secs())
                        .unwrap_or(now_secs);
                    let days_old = now_secs.saturating_sub(mtime_secs) / 86400;
                    let path_str = path.to_string_lossy().to_string();

                    results.push(LargeFileItem {
                        id: path_str.clone(),
                        name: fname,
                        path: path_str,
                        category: category.to_string(),
                        extension: if ext.is_empty() {
                            "file".to_string()
                        } else {
                            ext
                        },
                        size_bytes: size,
                        last_modified: relative_mtime(&path),
                        days_old,
                    });
                }
            }
        }
    }

    results.sort_by(|a, b| b.size_bytes.cmp(&a.size_bytes));
    results.truncate(150);
    results
}

fn classify_file_ext(ext: &str) -> &'static str {
    match ext {
        "dmg" | "pkg" | "iso" | "mpkg" | "appimage" | "exe" | "msi" | "download" | "crdownload" | "part" => {
            "Disk Images & Installers"
        }
        "zip" | "tar" | "gz" | "tgz" | "bz2" | "xz" | "7z" | "rar" => "Archives",
        "mp4" | "mov" | "mkv" | "avi" | "webm" | "m4v" | "wav" | "aiff" | "flac" | "mp3" | "als" | "logicx" | "band" => {
            "Video & Audio"
        }
        "gguf" | "bin" | "safetensors" | "onnx" | "pt" | "pth" | "db" | "sqlite" | "parquet" => {
            "Models & Datasets"
        }
        "pdf" | "psd" | "ai" | "fig" | "sketch" | "pptx" | "xlsx" | "docx" => "Documents & Design",
        _ => "Large Files",
    }
}

pub fn scan_space_lens(target_dir: Option<&str>) -> Result<SpaceLensSnapshot, String> {
    let home = home_dir();
    let dir_path = match target_dir {
        Some(s) if !s.trim().is_empty() => PathBuf::from(s),
        _ => home,
    };

    if !dir_path.exists() || !dir_path.is_dir() {
        return Err(format!("Directory not accessible: {}", dir_path.display()));
    }

    let rd = fs::read_dir(&dir_path).map_err(|e| e.to_string())?;
    let mut entries = Vec::new();
    let mut total_size_bytes = 0u64;

    let important_hidden = [
        ".Trash",
        ".npm",
        ".cargo",
        ".gradle",
        ".android",
        ".rustup",
        ".cache",
        ".gemini",
        ".vscode",
        ".cursor",
        ".local",
    ];

    for entry in rd.flatten() {
        let path = entry.path();
        let fname = entry.file_name().to_string_lossy().to_string();
        if fname.starts_with('.') && !important_hidden.contains(&fname.as_str()) {
            continue;
        }
        let Ok(meta) = fs::symlink_metadata(&path) else {
            continue;
        };
        if meta.file_type().is_symlink() {
            continue;
        }

        let is_dir = meta.is_dir();
        let size_bytes = if is_dir {
            dir_size_bounded(&path, 45000)
        } else {
            meta.len()
        };

        let item_count = if is_dir {
            fs::read_dir(&path).map(|r| r.count()).unwrap_or(0)
        } else {
            1
        };

        total_size_bytes += size_bytes;
        entries.push(SpaceLensEntry {
            name: fname,
            path: path.to_string_lossy().to_string(),
            is_dir,
            size_bytes,
            item_count,
            last_modified: relative_mtime(&path),
        });
    }

    entries.sort_by(|a, b| b.size_bytes.cmp(&a.size_bytes));

    let parent_path = dir_path
        .parent()
        .map(|p| p.to_string_lossy().to_string())
        .filter(|s| !s.is_empty());

    Ok(SpaceLensSnapshot {
        current_path: dir_path.to_string_lossy().to_string(),
        parent_path,
        total_size_bytes,
        entries,
    })
}

pub fn get_protection_snapshot() -> ProtectionSnapshot {
    let mut controls = Vec::new();

    // 1. SIP
    let sip_out = run_cmd("csrutil", &["status"]).unwrap_or_default();
    let sip_ok = sip_out.to_lowercase().contains("enabled");
    controls.push(SecurityControl {
        id: "sip".to_string(),
        name: "System Integrity Protection (SIP)".to_string(),
        status: if sip_ok { "Enabled" } else { "Disabled" }.to_string(),
        healthy: sip_ok,
        details: "Protects system files and kernel extensions from unauthorized modification."
            .to_string(),
    });

    // 2. Gatekeeper
    let gk_out = Command::new("spctl")
        .arg("--status")
        .output()
        .ok()
        .map(|o| {
            format!(
                "{} {}",
                String::from_utf8_lossy(&o.stdout),
                String::from_utf8_lossy(&o.stderr)
            )
        })
        .unwrap_or_default();
    let gk_ok = gk_out.to_lowercase().contains("enabled");
    controls.push(SecurityControl {
        id: "gatekeeper".to_string(),
        name: "Gatekeeper App Verification".to_string(),
        status: if gk_ok { "Enabled" } else { "Disabled" }.to_string(),
        healthy: gk_ok,
        details: "Verifies Apple Developer ID signatures and notarization before launch."
            .to_string(),
    });

    // 3. FileVault
    let fv_out = run_cmd("fdesetup", &["status"]).unwrap_or_default();
    let fv_ok = fv_out.to_lowercase().contains("on");
    controls.push(SecurityControl {
        id: "filevault".to_string(),
        name: "FileVault Full-Disk Encryption".to_string(),
        status: if fv_ok { "Encrypted (On)" } else { "Off" }.to_string(),
        healthy: fv_ok,
        details: "Encrypts the startup volume using XTS-AES-128 with a 256-bit key.".to_string(),
    });

    // 4. XProtect
    let xp_info = read_bundle_info(Path::new(
        "/Library/Apple/System/Library/CoreServices/XProtect.bundle/Contents/Info.plist",
    ));
    let xp_ver = if xp_info.version.is_empty() {
        "Active".to_string()
    } else {
        format!("v{}", xp_info.version)
    };
    controls.push(SecurityControl {
        id: "xprotect".to_string(),
        name: "Apple XProtect Malware Signatures".to_string(),
        status: xp_ver,
        healthy: true,
        details: "Built-in malware and remediation definitions managed by macOS.".to_string(),
    });

    // 5. Application Firewall
    let fw_out = run_cmd(
        "/usr/libexec/ApplicationFirewall/socketfilterfw",
        &["--getglobalstate"],
    )
    .unwrap_or_default();
    let fw_ok = fw_out.to_lowercase().contains("enabled");
    controls.push(SecurityControl {
        id: "firewall".to_string(),
        name: "macOS Application Firewall".to_string(),
        status: if fw_ok { "Enabled" } else { "Disabled" }.to_string(),
        healthy: fw_ok,
        details: "Filters incoming network connections on a per-application basis.".to_string(),
    });

    // Flagged persistence items (missing binary or running from /tmp or hidden path)
    let all_startup = scan_startup_items();
    let flagged_persistence: Vec<StartupItem> = all_startup
        .into_iter()
        .filter(|s| {
            !s.binary_exists
                || s.program.starts_with("/tmp/")
                || s.program.starts_with("/private/tmp/")
                || s.program.contains("/.")
        })
        .collect();

    // Privacy & Local Trace items
    let home = home_dir();
    let privacy_candidates: Vec<(PathBuf, &str, &str, &str)> = vec![
        (
            home.join(".Trash"),
            "macOS Trash Bin (~/.Trash)",
            "Trash",
            "Files previously moved to Trash awaiting permanent deletion.",
        ),
        (
            home.join("Library/Application Support/com.apple.sharedfilelist"),
            "Recent Documents & Server Lists",
            "System Traces",
            "Finder and application recent file histories.",
        ),
        (
            home.join("Library/Saved Application State"),
            "Application Window Saved States",
            "System Traces",
            "Snapshots of open windows and documents across applications.",
        ),
        (
            home.join("Library/Cookies"),
            "System & App Cookie Jar",
            "Browsing & Network",
            "Persistent HTTP and binary cookies stored in ~/Library/Cookies.",
        ),
        (
            home.join(".zsh_sessions"),
            "Terminal Session Restore Data",
            "Shell Activity",
            "Saved terminal session histories in ~/.zsh_sessions.",
        ),
        (
            home.join(".zsh_history"),
            "Zsh Command History",
            "Shell Activity",
            "Recorded shell command history in ~/.zsh_history.",
        ),
        (
            home.join(".node_repl_history"),
            "Node.js REPL History",
            "Shell Activity",
            "Recorded interactive JavaScript commands.",
        ),
    ];

    let mut privacy_items = Vec::new();
    for (path, name, cat, desc) in privacy_candidates {
        if !path.exists() {
            continue;
        }
        let mut size_bytes = dir_size_bounded(&path, 6000);
        if size_bytes == 0 && cat == "Trash" {
            size_bytes = get_trash_history()
                .iter()
                .filter(|e| e.exists_in_trash)
                .map(|e| e.size_bytes)
                .sum();
        }
        if size_bytes == 0 {
            continue;
        }
        let path_str = path.to_string_lossy().to_string();
        privacy_items.push(PrivacyItem {
            id: path_str.clone(),
            name: name.to_string(),
            category: cat.to_string(),
            path: path_str,
            size_bytes,
            description: desc.to_string(),
        });
    }

    privacy_items.sort_by(|a, b| b.size_bytes.cmp(&a.size_bytes));

    ProtectionSnapshot {
        controls,
        privacy_items,
        flagged_persistence,
    }
}

pub fn run_smart_scan() -> SmartScanReport {
    let caches = scan_developer_caches();
    let junk_bytes: u64 = caches.iter().map(|c| c.size_bytes).sum();
    let junk_paths: Vec<String> = caches.into_iter().map(|c| c.path).collect();

    let orphans = scan_orphaned_items();
    let safe_orphans: Vec<OrphanedItem> = orphans
        .into_iter()
        .filter(|o| o.risk_level == "Safe")
        .collect();
    let orphan_bytes: u64 = safe_orphans.iter().map(|o| o.size_bytes).sum();
    let orphan_paths: Vec<String> = safe_orphans.into_iter().map(|o| o.path).collect();

    let large = scan_large_and_old_files(10 * 1024 * 1024);
    let installers: Vec<LargeFileItem> = large
        .into_iter()
        .filter(|f| f.category == "Disk Images & Installers")
        .collect();
    let installer_bytes: u64 = installers.iter().map(|i| i.size_bytes).sum();
    let installer_paths: Vec<String> = installers.into_iter().map(|i| i.path).collect();

    let protection = get_protection_snapshot();
    let security_controls_total = protection.controls.len();
    let security_controls_healthy = protection.controls.iter().filter(|c| c.healthy).count();
    let flagged_agents_count = protection.flagged_persistence.len();

    let startup = scan_startup_items();
    let active_agents_count = startup.iter().filter(|s| s.is_loaded).count();

    let perf = get_performance_snapshot();

    SmartScanReport {
        junk_bytes,
        junk_paths,
        orphan_bytes,
        orphan_paths,
        installer_bytes,
        installer_paths,
        total_reclaimable_bytes: junk_bytes + orphan_bytes + installer_bytes,
        security_controls_healthy,
        security_controls_total,
        flagged_agents_count,
        active_agents_count,
        memory_pressure: perf.memory_pressure,
        load_average: perf.load_average,
    }
}

fn is_fat_macho(path: &Path) -> bool {
    let Ok(mut f) = fs::File::open(path) else {
        return false;
    };
    let mut magic = [0u8; 4];
    if f.read_exact(&mut magic).is_err() {
        return false;
    }
    matches!(u32::from_be_bytes(magic), 0xcafebabe | 0xbebafeca)
}

fn collect_fat_binaries(app_path: &Path) -> Vec<(PathBuf, u64)> {
    let mut fat_bins = Vec::new();
    let subdirs = [
        app_path.join("Contents/MacOS"),
        app_path.join("Contents/Frameworks"),
        app_path.join("Contents/Helpers"),
        app_path.join("Contents/PlugIns"),
    ];
    let mut visited = 0usize;

    for root in subdirs {
        if !root.exists() {
            continue;
        }
        let mut queue = VecDeque::new();
        queue.push_back((root, 0usize));

        while let Some((curr, depth)) = queue.pop_front() {
            if visited > 2500 || depth > 5 {
                break;
            }
            let Ok(rd) = fs::read_dir(&curr) else {
                continue;
            };
            for entry in rd.flatten() {
                visited += 1;
                let p = entry.path();
                let Ok(ft) = entry.file_type() else {
                    continue;
                };
                if ft.is_symlink() {
                    continue;
                }
                if ft.is_dir() {
                    queue.push_back((p, depth + 1));
                } else if ft.is_file() {
                    if let Ok(meta) = entry.metadata() {
                        if meta.len() > 32 * 1024 && is_fat_macho(&p) {
                            fat_bins.push((p, meta.len()));
                        }
                    }
                }
            }
        }
    }
    fat_bins
}

pub fn scan_universal_apps() -> Vec<UniversalAppItem> {
    let home = home_dir();
    let roots = [PathBuf::from("/Applications"), home.join("Applications")];
    let mut results = Vec::new();

    for root in roots {
        let Ok(entries) = fs::read_dir(&root) else {
            continue;
        };
        for entry in entries.flatten() {
            let path = entry.path();
            let fname = entry.file_name().to_string_lossy().to_string();
            if !fname.ends_with(".app") {
                continue;
            }
            let info = read_bundle_info(&path.join("Contents/Info.plist"));
            if info.bundle_id.starts_with("com.apple.") {
                continue;
            }
            let stem = fname.trim_end_matches(".app").to_string();
            let exec = if !info.executable.is_empty() {
                info.executable.clone()
            } else {
                stem.clone()
            };
            let exec_path = path.join("Contents/MacOS").join(&exec);

            let fat_bins = collect_fat_binaries(&path);
            if fat_bins.is_empty() {
                continue;
            }

            let universal_binaries_bytes: u64 = fat_bins.iter().map(|(_, sz)| *sz).sum();
            let estimated_savings_bytes = (universal_binaries_bytes as f64 * 0.48) as u64;
            if estimated_savings_bytes < 512 * 1024 {
                continue;
            }

            let total_app_bytes = dir_size_bounded(&path, 12000);
            let name = if !info.display_name.is_empty() && info.display_name.len() >= stem.len() {
                info.display_name
            } else {
                stem
            };
            let app_path_str = path.to_string_lossy().to_string();

            results.push(UniversalAppItem {
                id: app_path_str.clone(),
                name,
                bundle_id: if info.bundle_id.is_empty() {
                    "universal.bundle".to_string()
                } else {
                    info.bundle_id
                },
                version: if info.version.is_empty() {
                    "1.0".to_string()
                } else {
                    info.version
                },
                app_path: app_path_str,
                executable_path: exec_path.to_string_lossy().to_string(),
                total_app_bytes,
                fat_binaries_count: fat_bins.len(),
                universal_binaries_bytes,
                estimated_savings_bytes,
                architectures: "arm64 + x86_64".to_string(),
            });
        }
    }

    results.sort_by(|a, b| b.estimated_savings_bytes.cmp(&a.estimated_savings_bytes));
    results
}

pub fn slim_universal_apps(app_paths: Vec<String>) -> SlimResult {
    let arch_to_remove = if env::consts::ARCH == "aarch64" {
        "x86_64"
    } else {
        "arm64"
    };

    let mut slimmed_apps = 0usize;
    let mut slimmed_binaries = 0usize;
    let mut saved_bytes = 0u64;
    let mut failed_apps = Vec::new();

    for raw_path in app_paths {
        let app_path = Path::new(&raw_path);
        if !app_path.exists() || raw_path.starts_with("/System") {
            failed_apps.push(format!("{} (protected)", raw_path));
            continue;
        }
        let fat_bins = collect_fat_binaries(app_path);
        if fat_bins.is_empty() {
            continue;
        }

        let mut app_saved = 0u64;
        let mut app_bins_slimmed = 0usize;

        for (bin_path, before_size) in fat_bins {
            let bin_str = bin_path.to_string_lossy().to_string();
            let status = Command::new("lipo")
                .args(["-remove", arch_to_remove, &bin_str, "-output", &bin_str])
                .status();

            if status.map(|s| s.success()).unwrap_or(false) {
                if let Ok(meta) = fs::metadata(&bin_path) {
                    let after_size = meta.len();
                    app_saved += before_size.saturating_sub(after_size);
                    app_bins_slimmed += 1;
                }
            }
        }

        if app_bins_slimmed > 0 {
            let _ = Command::new("codesign")
                .args(["--force", "--deep", "--sign", "-", &raw_path])
                .output();
            slimmed_apps += 1;
            slimmed_binaries += app_bins_slimmed;
            saved_bytes += app_saved;
        } else {
            failed_apps.push(format!("{} (write permission required)", raw_path));
        }
    }

    let success = slimmed_apps > 0 && failed_apps.is_empty();
    let message = if slimmed_apps > 0 {
        format!(
            "Stripped {} architecture from {} binaries across {} apps.",
            arch_to_remove, slimmed_binaries, slimmed_apps
        )
    } else {
        "Could not slim selected applications (check permissions or App Store protection)."
            .to_string()
    };

    SlimResult {
        success,
        slimmed_apps,
        slimmed_binaries,
        saved_bytes,
        failed_apps,
        message,
    }
}

fn fnv1a_update(mut hash: u64, bytes: &[u8]) -> u64 {
    for &b in bytes {
        hash ^= b as u64;
        hash = hash.wrapping_mul(0x100000001b3);
    }
    hash
}

fn partial_file_hash(path: &Path, size: u64) -> Option<u64> {
    let mut f = fs::File::open(path).ok()?;
    let mut h = fnv1a_update(0xcbf29ce484222325, &size.to_le_bytes());
    let mut buf = [0u8; 8192];

    let n1 = f.read(&mut buf).ok()?;
    h = fnv1a_update(h, &buf[..n1]);

    if size > 16384 {
        f.seek(SeekFrom::Start(size / 2)).ok()?;
        let n2 = f.read(&mut buf).ok()?;
        h = fnv1a_update(h, &buf[..n2]);
    }

    if size > 8192 {
        f.seek(SeekFrom::Start(size.saturating_sub(8192))).ok()?;
        let n3 = f.read(&mut buf).ok()?;
        h = fnv1a_update(h, &buf[..n3]);
    }

    Some(h)
}

fn full_file_hash(path: &Path, size: u64) -> Option<u64> {
    let mut f = fs::File::open(path).ok()?;
    let mut h = fnv1a_update(0xcbf29ce484222325, &size.to_le_bytes());
    let mut buf = vec![0u8; 65536];
    let mut total_read = 0u64;
    let max_bytes = 64 * 1024 * 1024; // cap at 64 MB per candidate for instant speed

    loop {
        let n = f.read(&mut buf).ok()?;
        if n == 0 {
            break;
        }
        h = fnv1a_update(h, &buf[..n]);
        total_read += n as u64;
        if total_read >= max_bytes {
            if size > max_bytes {
                f.seek(SeekFrom::Start(size.saturating_sub(65536))).ok()?;
                let tail = f.read(&mut buf).ok()?;
                h = fnv1a_update(h, &buf[..tail]);
            }
            break;
        }
    }
    Some(h)
}

pub fn scan_duplicates() -> Vec<DuplicateGroup> {
    let home = home_dir();
    let roots = [
        home.join("Downloads"),
        home.join("Desktop"),
        home.join("Documents"),
        home.join("Music"),
        home.join("Movies"),
        home.join("Pictures"),
    ];

    let mut by_size: HashMap<u64, Vec<PathBuf>> = HashMap::new();
    let mut visited = 0usize;

    for root in roots {
        if !root.exists() {
            continue;
        }
        let mut queue = VecDeque::new();
        queue.push_back((root, 0usize));

        while let Some((curr, depth)) = queue.pop_front() {
            if visited > 25000 || depth > 4 {
                break;
            }
            let Ok(rd) = fs::read_dir(&curr) else {
                continue;
            };
            for entry in rd.flatten() {
                visited += 1;
                let path = entry.path();
                let fname = entry.file_name().to_string_lossy().to_string();
                if fname.starts_with('.')
                    || fname == "node_modules"
                    || fname == "target"
                    || fname == "dist"
                    || fname == "build"
                {
                    continue;
                }
                let Ok(ft) = entry.file_type() else {
                    continue;
                };
                if ft.is_symlink() {
                    continue;
                }
                if ft.is_dir() {
                    let ext = path
                        .extension()
                        .map(|e| e.to_string_lossy().to_lowercase())
                        .unwrap_or_default();
                    if [
                        "app", "vst", "vst3", "component", "pkg", "mpkg", "band", "logicx",
                        "photoslibrary", "lproj", "db", "framework", "bundle", "xcodeproj",
                        "xcworkspace",
                    ]
                    .contains(&ext.as_str())
                    {
                        continue;
                    }
                    queue.push_back((path, depth + 1));
                } else if ft.is_file() {
                    if let Ok(meta) = entry.metadata() {
                        let len = meta.len();
                        // Skip tiny files < 32 KB
                        if len >= 32 * 1024 {
                            by_size.entry(len).or_default().push(path);
                        }
                    }
                }
            }
        }
    }

    // Stage 2: Partial hash on same-size buckets
    let mut by_partial: HashMap<(u64, u64), Vec<PathBuf>> = HashMap::new();
    for (size, paths) in by_size {
        if paths.len() < 2 {
            continue;
        }
        for p in paths {
            if let Some(ph) = partial_file_hash(&p, size) {
                by_partial.entry((size, ph)).or_default().push(p);
            }
        }
    }

    // Stage 3: Full hash on matching partial buckets
    let mut by_full: HashMap<(u64, u64), Vec<PathBuf>> = HashMap::new();
    for ((size, _), paths) in by_partial {
        if paths.len() < 2 {
            continue;
        }
        for p in paths {
            if let Some(fh) = full_file_hash(&p, size) {
                by_full.entry((size, fh)).or_default().push(p);
            }
        }
    }

    let mut groups = Vec::new();
    for ((file_size, hash_val), paths) in by_full {
        if paths.len() < 2 {
            continue;
        }
        let hash_hex = format!("{:016x}", hash_val);
        let first_path = &paths[0];
        let name_hint = first_path
            .file_name()
            .map(|s| s.to_string_lossy().to_string())
            .unwrap_or_else(|| "Duplicate File".to_string());
        let ext = first_path
            .extension()
            .map(|e| e.to_string_lossy().to_lowercase())
            .unwrap_or_else(|| "file".to_string());
        let category = classify_file_ext(&ext).to_string();

        let mut entries: Vec<DuplicateFileEntry> = paths
            .into_iter()
            .map(|p| {
                let name = p
                    .file_name()
                    .map(|s| s.to_string_lossy().to_string())
                    .unwrap_or_default();
                let parent_dir = p
                    .parent()
                    .map(|d| d.to_string_lossy().to_string())
                    .unwrap_or_default();
                let modified_epoch = fs::metadata(&p)
                    .ok()
                    .and_then(|m| m.modified().ok())
                    .and_then(|t| t.duration_since(UNIX_EPOCH).ok())
                    .map(|d| d.as_secs())
                    .unwrap_or(0);
                let last_modified = relative_mtime(&p);
                DuplicateFileEntry {
                    path: p.to_string_lossy().to_string(),
                    name,
                    parent_dir,
                    last_modified,
                    modified_epoch,
                    is_newest: false,
                }
            })
            .collect();

        entries.sort_by(|a, b| b.modified_epoch.cmp(&a.modified_epoch));
        if let Some(first) = entries.first_mut() {
            first.is_newest = true;
        }

        let wasted_bytes = file_size * (entries.len().saturating_sub(1) as u64);
        groups.push(DuplicateGroup {
            id: format!("dup:{}:{}", file_size, hash_hex),
            hash: hash_hex,
            name_hint,
            extension: if ext.is_empty() {
                "file".to_string()
            } else {
                ext
            },
            category,
            file_size_bytes: file_size,
            wasted_bytes,
            files: entries,
        });
    }

    groups.sort_by(|a, b| b.wasted_bytes.cmp(&a.wasted_bytes));
    groups.truncate(120);
    groups
}

fn shred_single_file(path: &Path, passes: u8) -> std::io::Result<u64> {
    let meta = fs::symlink_metadata(path)?;
    if meta.file_type().is_symlink() {
        fs::remove_file(path)?;
        return Ok(0);
    }
    let len = meta.len();
    if len > 0 {
        if let Ok(mut perm) = fs::metadata(path).map(|m| m.permissions()) {
            if perm.readonly() {
                perm.set_readonly(false);
                let _ = fs::set_permissions(path, perm);
            }
        }
        let mut f = fs::OpenOptions::new().write(true).open(path)?;
        let chunk_size = 65536usize;
        let max_overwrite = len.min(128 * 1024 * 1024); // cap overwrite at 128 MB per file for responsiveness
        let pass_count = passes.clamp(1, 3);

        for pass in 0..pass_count {
            f.seek(SeekFrom::Start(0))?;
            let pattern: u8 = match pass {
                0 => 0x00,
                1 => 0xFF,
                _ => 0xA5,
            };
            let buf = vec![pattern; chunk_size];
            let mut written = 0u64;
            while written < max_overwrite {
                let to_write = ((max_overwrite - written) as usize).min(chunk_size);
                f.write_all(&buf[..to_write])?;
                written += to_write as u64;
            }
            let _ = f.sync_all();
        }
    }
    fs::remove_file(path)?;
    Ok(len)
}

fn shred_path_recursive(path: &Path, passes: u8) -> Result<u64, String> {
    let meta = fs::symlink_metadata(path).map_err(|e| e.to_string())?;
    if meta.file_type().is_symlink() || meta.is_file() {
        return shred_single_file(path, passes).map_err(|e| e.to_string());
    }
    let mut total = 0u64;
    if meta.is_dir() {
        if let Ok(rd) = fs::read_dir(path) {
            for entry in rd.flatten() {
                total += shred_path_recursive(&entry.path(), passes).unwrap_or(0);
            }
        }
        fs::remove_dir_all(path).map_err(|e| e.to_string())?;
    }
    Ok(total)
}

pub fn shred_paths(paths: Vec<String>, passes: u8) -> UninstallResult {
    let mut removed_paths = Vec::new();
    let mut failed_paths = Vec::new();
    let mut freed_bytes = 0u64;

    for raw in paths {
        let p = Path::new(&raw);
        if is_protected_system_path(&raw) {
            failed_paths.push(format!("{} (protected system path)", raw));
            continue;
        }
        if !p.exists() {
            continue;
        }
        match shred_path_recursive(p, passes) {
            Ok(bytes) => {
                freed_bytes += bytes;
                removed_paths.push(raw);
            }
            Err(e) => {
                failed_paths.push(format!("{} ({})", raw, e));
            }
        }
    }

    let success = !removed_paths.is_empty() && failed_paths.is_empty();
    let message = if !removed_paths.is_empty() {
        format!(
            "Securely shredded {} items ({}-pass zero/pattern overwrite).",
            removed_paths.len(),
            passes.clamp(1, 3)
        )
    } else {
        "No files were shredded.".to_string()
    };

    UninstallResult {
        success,
        removed_paths,
        failed_paths,
        freed_bytes,
        mode: format!("shred-{}pass", passes.clamp(1, 3)),
        killed_pids: Vec::new(),
        message,
    }
}



