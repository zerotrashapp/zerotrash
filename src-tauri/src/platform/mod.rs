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



