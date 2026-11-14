mod models;
mod platform;

use models::UninstallRequest;
use std::env;
use std::fs;
use std::io::{Read, Write};
use std::net::{TcpListener, TcpStream};
use std::path::{Path, PathBuf};
use std::process::Command;
use std::thread;

fn dispatch_command(cmd: &str, payload: &str) -> Result<String, String> {
    match cmd {
        "get_system_overview" | "overview" => {
            let res = platform::get_system_overview("Native Rust Engine");
            Ok(serde_json::to_string(&res).unwrap_or_default())
        }
        "scan_installed_apps" | "apps" => {
            let res = platform::scan_installed_apps();
            Ok(serde_json::to_string(&res).unwrap_or_default())
        }
        "deep_scan_app" => {
            #[derive(serde::Deserialize)]
            struct Args {
                #[serde(rename = "appPath")]
                app_path: Option<String>,
            }
            let parsed: Args = serde_json::from_str(payload).unwrap_or(Args { app_path: None });
            let path = parsed.app_path.unwrap_or_else(|| payload.to_string());
            platform::deep_scan_app(&path)
                .map(|res| serde_json::to_string(&res).unwrap_or_default())
        }
        "scan_orphaned_items" | "orphans" => {
            let res = platform::scan_orphaned_items();
            Ok(serde_json::to_string(&res).unwrap_or_default())
        }
        "scan_startup_items" | "startup" => {
            let res = platform::scan_startup_items();
            Ok(serde_json::to_string(&res).unwrap_or_default())
        }
        "toggle_startup_item" => {
            #[derive(serde::Deserialize)]
            struct Args {
                #[serde(rename = "plistPath")]
                plist_path: String,
                enable: bool,
            }
            let a: Args = serde_json::from_str(payload).map_err(|e| e.to_string())?;
            platform::toggle_startup_item(&a.plist_path, a.enable)
                .map(|msg| serde_json::json!({ "ok": true, "message": msg }).to_string())
        }
        "scan_managed_packages" | "packages" => {
            let res = platform::scan_managed_packages();
            Ok(serde_json::to_string(&res).unwrap_or_default())
        }
        "uninstall_managed_package" => {
            #[derive(serde::Deserialize)]
            struct Args {
                manager: String,
                name: String,
            }
            let a: Args = serde_json::from_str(payload).map_err(|e| e.to_string())?;
            platform::uninstall_managed_package(&a.manager, &a.name)
                .map(|msg| serde_json::json!({ "ok": true, "message": msg }).to_string())
        }
        "scan_system_plugins" | "plugins" => {
            let res = platform::scan_system_plugins();
            Ok(serde_json::to_string(&res).unwrap_or_default())
        }
        "get_performance_snapshot" | "performance" => {
            let res = platform::get_performance_snapshot();
            Ok(serde_json::to_string(&res).unwrap_or_default())
        }
        "run_maintenance_task" => {
            #[derive(serde::Deserialize)]
            struct Args {
                #[serde(rename = "taskId")]
                task_id: String,
            }
            let a: Args = serde_json::from_str(payload).map_err(|e| e.to_string())?;
            platform::run_maintenance_task(&a.task_id)
                .map(|res| serde_json::to_string(&res).unwrap_or_default())
        }
        "scan_developer_caches" | "caches" => {
            let res = platform::scan_developer_caches();
            Ok(serde_json::to_string(&res).unwrap_or_default())
        }
        "scan_large_and_old_files" | "large_files" => {
            #[derive(serde::Deserialize)]
            struct Args {
                #[serde(rename = "minBytes")]
                min_bytes: Option<u64>,
            }
            let parsed: Args = serde_json::from_str(payload).unwrap_or(Args { min_bytes: None });
            let res = platform::scan_large_and_old_files(parsed.min_bytes.unwrap_or(20 * 1024 * 1024));
            Ok(serde_json::to_string(&res).unwrap_or_default())
        }
        "scan_space_lens" | "space_lens" => {
            #[derive(serde::Deserialize)]
            struct Args {
                #[serde(rename = "targetDir")]
                target_dir: Option<String>,
            }
            let parsed: Args = serde_json::from_str(payload).unwrap_or(Args { target_dir: None });
            platform::scan_space_lens(parsed.target_dir.as_deref())
                .map(|res| serde_json::to_string(&res).unwrap_or_default())
        }
        "get_protection_snapshot" | "protection" => {
            let res = platform::get_protection_snapshot();
            Ok(serde_json::to_string(&res).unwrap_or_default())
        }
        "run_smart_scan" | "smart_scan" => {
            let res = platform::run_smart_scan();
            Ok(serde_json::to_string(&res).unwrap_or_default())
        }
        "execute_uninstall" => {
            #[derive(serde::Deserialize)]
            struct Wrapper {
                req: Option<UninstallRequest>,
                paths: Option<Vec<String>>,
                pids_to_kill: Option<Vec<u32>>,
                permanent: Option<bool>,
            }
            let w: Wrapper = serde_json::from_str(payload).map_err(|e| e.to_string())?;
            let req = w.req.unwrap_or_else(|| UninstallRequest {
                paths: w.paths.unwrap_or_default(),
                pids_to_kill: w.pids_to_kill.unwrap_or_default(),
                permanent: w.permanent.unwrap_or(false),
            });
            let res = platform::execute_uninstall(req);
            Ok(serde_json::to_string(&res).unwrap_or_default())
        }
        "kill_process" => {
            #[derive(serde::Deserialize)]
            struct Args {
                pid: u32,
                force: bool,
            }
            let a: Args = serde_json::from_str(payload).map_err(|e| e.to_string())?;
            platform::kill_process(a.pid, a.force)
                .map(|msg| serde_json::json!({ "ok": true, "message": msg }).to_string())
        }
        "reveal_in_file_manager" => {
            #[derive(serde::Deserialize)]
            struct Args {
                path: String,
            }
            let a: Args = serde_json::from_str(payload).map_err(|e| e.to_string())?;
            platform::reveal_in_file_manager(&a.path)
                .map(|msg| serde_json::json!({ "ok": true, "message": msg }).to_string())
        }
        "scan_universal_apps" | "universal" => {
            let res = platform::scan_universal_apps();
            Ok(serde_json::to_string(&res).unwrap_or_default())
        }
        "slim_universal_apps" => {
            #[derive(serde::Deserialize)]
            struct Args {
                #[serde(rename = "appPaths")]
                app_paths: Vec<String>,
            }
            let a: Args = serde_json::from_str(payload).map_err(|e| e.to_string())?;
            let res = platform::slim_universal_apps(a.app_paths);
            Ok(serde_json::to_string(&res).unwrap_or_default())
        }
        "get_trash_history" | "history" => {
            let res = platform::get_trash_history();
            Ok(serde_json::to_string(&res).unwrap_or_default())
        }
        "restore_trash_items" => {
            #[derive(serde::Deserialize)]
            struct Args {
                ids: Vec<String>,
            }
            let a: Args = serde_json::from_str(payload).map_err(|e| e.to_string())?;
            let res = platform::restore_trash_items(a.ids);
            Ok(serde_json::to_string(&res).unwrap_or_default())
        }
        "scan_duplicates" | "duplicates" => {
            let res = platform::scan_duplicates();
            Ok(serde_json::to_string(&res).unwrap_or_default())
        }
        "shred_paths" | "shred" => {
            #[derive(serde::Deserialize)]
            struct Args {
                paths: Vec<String>,
                passes: Option<u8>,
            }
            let a: Args = serde_json::from_str(payload).map_err(|e| e.to_string())?;
            let res = platform::shred_paths(a.paths, a.passes.unwrap_or(1));
            Ok(serde_json::to_string(&res).unwrap_or_default())
        }
        _ => Err(format!("Unknown command: {}", cmd)),
    }
}

fn percent_decode(input: &str) -> String {
    let mut bytes = Vec::with_capacity(input.len());
    let mut chars = input.as_bytes().iter().copied();
    while let Some(b) = chars.next() {
        if b == b'%' {
            let h1 = chars.next();
            let h2 = chars.next();
            if let (Some(c1), Some(c2)) = (h1, h2) {
                let hex = [c1, c2];
                if let Ok(s) = std::str::from_utf8(&hex) {
                    if let Ok(val) = u8::from_str_radix(s, 16) {
                        bytes.push(val);
                        continue;
                    }
                }
            }
            bytes.push(b'%');
        } else if b == b'+' {
            bytes.push(b' ');
        } else {
            bytes.push(b);
        }
    }
    String::from_utf8_lossy(&bytes).to_string()
}

fn simple_hash(s: &str) -> String {
    let mut h: u64 = 0xcbf29ce484222325;
    for b in s.as_bytes() {
        h ^= *b as u64;
        h = h.wrapping_mul(0x100000001b3);
    }
    format!("{:016x}", h)
}

fn mime_for_path(path: &Path) -> &'static str {
    match path.extension().and_then(|e| e.to_str()).unwrap_or("") {
        "html" => "text/html; charset=utf-8",
        "js" | "mjs" => "application/javascript; charset=utf-8",
        "css" => "text/css; charset=utf-8",
        "json" => "application/json; charset=utf-8",
        "png" => "image/png",
        "jpg" | "jpeg" => "image/jpeg",
        "svg" => "image/svg+xml",
        "ico" => "image/x-icon",
        _ => "application/octet-stream",
    }
}

fn handle_http_client(mut stream: TcpStream, dist_dir: PathBuf, icon_bin: PathBuf) {
    let mut buf = [0u8; 65536];
    let n = match stream.read(&mut buf) {
        Ok(n) if n > 0 => n,
        _ => return,
    };

    let req_str = String::from_utf8_lossy(&buf[..n]);
    let header_end = req_str.find("\r\n\r\n").unwrap_or(req_str.len());
    let headers_part = &req_str[..header_end];
    let mut lines = headers_part.lines();
    let first_line = lines.next().unwrap_or("");
    let mut parts = first_line.split_whitespace();
    let method = parts.next().unwrap_or("GET");
    let full_path = parts.next().unwrap_or("/");

    let mut content_length = 0usize;
    for line in lines {
        if let Some(rest) = line.to_ascii_lowercase().strip_prefix("content-length:") {
            content_length = rest.trim().parse::<usize>().unwrap_or(0);
        }
    }

    let body_start = if header_end + 4 <= n { header_end + 4 } else { n };
    let mut body_bytes = buf[body_start..n].to_vec();
    while body_bytes.len() < content_length {
        let mut more = [0u8; 8192];
        match stream.read(&mut more) {
            Ok(r) if r > 0 => body_bytes.extend_from_slice(&more[..r]),
            _ => break,
        }
    }

    if method == "POST" && full_path.starts_with("/api/invoke") {
        #[derive(serde::Deserialize)]
        struct InvokeReq {
            cmd: String,
            args: Option<serde_json::Value>,
        }
        let body_str = String::from_utf8_lossy(&body_bytes);
        if let Ok(inv) = serde_json::from_str::<InvokeReq>(&body_str) {
            let args_str = inv
                .args
                .map(|v| v.to_string())
                .unwrap_or_else(|| "{}".to_string());
            match dispatch_command(&inv.cmd, &args_str) {
                Ok(json_out) => {
                    let resp = format!(
                        "HTTP/1.1 200 OK\r\nContent-Type: application/json\r\nContent-Length: {}\r\nConnection: close\r\n\r\n{}",
                        json_out.len(),
                        json_out
                    );
                    let _ = stream.write_all(resp.as_bytes());
                }
                Err(err_msg) => {
                    let err_json = serde_json::json!({ "error": err_msg }).to_string();
                    let resp = format!(
                        "HTTP/1.1 500 Internal Server Error\r\nContent-Type: application/json\r\nContent-Length: {}\r\nConnection: close\r\n\r\n{}",
                        err_json.len(),
                        err_json
                    );
                    let _ = stream.write_all(resp.as_bytes());
                }
            }
        } else {
            let err_json = r#"{"error":"Invalid JSON"}"#;
            let resp = format!(
                "HTTP/1.1 400 Bad Request\r\nContent-Type: application/json\r\nContent-Length: {}\r\nConnection: close\r\n\r\n{}",
                err_json.len(),
                err_json
            );
            let _ = stream.write_all(resp.as_bytes());
        }
        return;
    }

    if full_path.starts_with("/api/icon") {
        let query = full_path.split('?').nth(1).unwrap_or("");
        let mut target_path = String::new();
        for pair in query.split('&') {
            if let Some(val) = pair.strip_prefix("path=") {
                target_path = percent_decode(val);
            }
        }
        if !target_path.is_empty() && Path::new(&target_path).exists() {
            let cache_dir = env::temp_dir().join("zerotrash-icons");
            let _ = fs::create_dir_all(&cache_dir);
            let cached_png = cache_dir.join(format!("{}.png", simple_hash(&target_path)));
            if !cached_png.exists() && icon_bin.exists() {
                let _ = Command::new(&icon_bin)
                    .arg(&target_path)
                    .arg(&cached_png)
                    .output();
            }
            if let Ok(bytes) = fs::read(&cached_png) {
                let header = format!(
                    "HTTP/1.1 200 OK\r\nContent-Type: image/png\r\nCache-Control: public, max-age=86400\r\nContent-Length: {}\r\nConnection: close\r\n\r\n",
                    bytes.len()
                );
                let _ = stream.write_all(header.as_bytes());
                let _ = stream.write_all(&bytes);
                return;
            }
        }
        let _ = stream.write_all(b"HTTP/1.1 404 Not Found\r\nContent-Length: 0\r\nConnection: close\r\n\r\n");
        return;
    }

    // Serve static files from dist_dir
    let clean_rel = full_path
        .split('?')
        .next()
        .unwrap_or("/")
        .trim_start_matches('/');
    let mut file_path = if clean_rel.is_empty() {
        dist_dir.join("index.html")
    } else {
        dist_dir.join(clean_rel)
    };
    if !file_path.exists() || file_path.is_dir() {
        file_path = dist_dir.join("index.html");
    }

    if let Ok(bytes) = fs::read(&file_path) {
        let mime = mime_for_path(&file_path);
        let header = format!(
            "HTTP/1.1 200 OK\r\nContent-Type: {}\r\nContent-Length: {}\r\nConnection: close\r\n\r\n",
            mime,
            bytes.len()
        );
        let _ = stream.write_all(header.as_bytes());
        let _ = stream.write_all(&bytes);
    } else {
        let _ = stream.write_all(b"HTTP/1.1 404 Not Found\r\nContent-Length: 0\r\nConnection: close\r\n\r\n");
    }
}

fn run_standalone_server(port: u16, dist_dir: PathBuf, icon_bin: PathBuf) {
    let addr = format!("127.0.0.1:{}", port);
    let listener = match TcpListener::bind(&addr) {
        Ok(l) => l,
        Err(e) => {
            eprintln!("Failed to bind {}: {}", addr, e);
            return;
        }
    };
    println!("ZeroTrash Standalone Engine listening on http://{}", addr);
    for stream in listener.incoming().flatten() {
        let d = dist_dir.clone();
        let i = icon_bin.clone();
        thread::spawn(move || {
            handle_http_client(stream, d, i);
        });
    }
}

fn main() {
    let args: Vec<String> = env::args().collect();
    let cmd = args.get(1).map(|s| s.as_str()).unwrap_or("overview");

    if cmd == "serve" {
        let port = args
            .get(2)
            .and_then(|s| s.parse::<u16>().ok())
            .unwrap_or(1420);
        let exe_dir = env::current_exe()
            .ok()
            .and_then(|p| p.parent().map(|d| d.to_path_buf()))
            .unwrap_or_else(|| PathBuf::from("."));
        let dist_dir = args
            .get(3)
            .map(PathBuf::from)
            .unwrap_or_else(|| exe_dir.join("../Resources/dist"));
        let icon_bin = args
            .get(4)
            .map(PathBuf::from)
            .unwrap_or_else(|| exe_dir.join("zerotrash-icon"));
        run_standalone_server(port, dist_dir, icon_bin);
        return;
    }

    let payload = args.get(2).map(|s| s.as_str()).unwrap_or("{}");
    match dispatch_command(cmd, payload) {
        Ok(out) => println!("{}", out),
        Err(e) => {
            eprintln!("{}", e);
            std::process::exit(1);
        }
    }
}
