pub mod models;
pub mod platform;

#[cfg(feature = "desktop")]
use models::*;

#[cfg(feature = "desktop")]
#[tauri::command]
fn get_system_overview() -> SystemOverview {
    platform::get_system_overview("Tauri Native Engine")
}

#[cfg(feature = "desktop")]
#[tauri::command]
fn scan_installed_apps() -> Vec<InstalledApp> {
    platform::scan_installed_apps()
}

#[cfg(feature = "desktop")]
#[tauri::command]
fn deep_scan_app(app_path: String) -> Result<AppDeepScanResult, String> {
    platform::deep_scan_app(&app_path)
}

#[cfg(feature = "desktop")]
#[tauri::command]
fn scan_orphaned_items() -> Vec<OrphanedItem> {
    platform::scan_orphaned_items()
}

#[cfg(feature = "desktop")]
#[tauri::command]
fn scan_startup_items() -> Vec<StartupItem> {
    platform::scan_startup_items()
}

#[cfg(feature = "desktop")]
#[tauri::command]
fn toggle_startup_item(plist_path: String, enable: bool) -> Result<String, String> {
    platform::toggle_startup_item(&plist_path, enable)
}

#[cfg(feature = "desktop")]
#[tauri::command]
fn scan_managed_packages() -> Vec<ManagedPackage> {
    platform::scan_managed_packages()
}

#[cfg(feature = "desktop")]
#[tauri::command]
fn uninstall_managed_package(manager: String, name: String) -> Result<String, String> {
    platform::uninstall_managed_package(&manager, &name)
}

#[cfg(feature = "desktop")]
#[tauri::command]
fn scan_system_plugins() -> Vec<SystemPlugin> {
    platform::scan_system_plugins()
}

#[cfg(feature = "desktop")]
#[tauri::command]
fn get_performance_snapshot() -> PerformanceSnapshot {
    platform::get_performance_snapshot()
}

#[cfg(feature = "desktop")]
#[tauri::command]
fn run_maintenance_task(task_id: String) -> Result<MaintenanceResult, String> {
    platform::run_maintenance_task(&task_id)
}

#[cfg(feature = "desktop")]
#[tauri::command]
fn scan_developer_caches() -> Vec<CacheTarget> {
    platform::scan_developer_caches()
}

#[cfg(feature = "desktop")]
#[tauri::command]
fn scan_large_and_old_files(min_bytes: Option<u64>) -> Vec<LargeFileItem> {
    platform::scan_large_and_old_files(min_bytes.unwrap_or(20 * 1024 * 1024))
}

#[cfg(feature = "desktop")]
#[tauri::command]
fn scan_space_lens(target_dir: Option<String>) -> Result<SpaceLensSnapshot, String> {
    platform::scan_space_lens(target_dir.as_deref())
}

#[cfg(feature = "desktop")]
#[tauri::command]
fn get_protection_snapshot() -> ProtectionSnapshot {
    platform::get_protection_snapshot()
}

#[cfg(feature = "desktop")]
#[tauri::command]
fn run_smart_scan() -> SmartScanReport {
    platform::run_smart_scan()
}

#[cfg(feature = "desktop")]
#[tauri::command]
fn execute_uninstall(req: UninstallRequest) -> UninstallResult {
    platform::execute_uninstall(req)
}

#[cfg(feature = "desktop")]
#[tauri::command]
fn kill_process(pid: u32, force: bool) -> Result<String, String> {
    platform::kill_process(pid, force)
}

#[cfg(feature = "desktop")]
#[tauri::command]
fn reveal_in_file_manager(path: String) -> Result<String, String> {
    platform::reveal_in_file_manager(&path)
}

#[cfg(feature = "desktop")]
#[tauri::command]
fn scan_universal_apps() -> Vec<UniversalAppItem> {
    platform::scan_universal_apps()
}

#[cfg(feature = "desktop")]
#[tauri::command]
fn slim_universal_apps(app_paths: Vec<String>) -> SlimResult {
    platform::slim_universal_apps(app_paths)
}

#[cfg(feature = "desktop")]
#[tauri::command]
fn get_trash_history() -> Vec<TrashHistoryEntry> {
    platform::get_trash_history()
}

#[cfg(feature = "desktop")]
#[tauri::command]
fn restore_trash_items(ids: Vec<String>) -> RestoreResult {
    platform::restore_trash_items(ids)
}

#[cfg(feature = "desktop")]
#[tauri::command]
fn scan_duplicates() -> Vec<DuplicateGroup> {
    platform::scan_duplicates()
}

#[cfg(feature = "desktop")]
#[tauri::command]
fn shred_paths(paths: Vec<String>, passes: Option<u8>) -> UninstallResult {
    platform::shred_paths(paths, passes.unwrap_or(1))
}

#[cfg(feature = "desktop")]
#[tauri::command]
fn save_file_with_dialog(default_name: String, content: String) -> SaveDialogResult {
    platform::save_file_with_dialog(&default_name, &content)
}

#[cfg(feature = "desktop")]
#[tauri::command]
fn scan_ai_models() -> Vec<AiModelEntry> {
    platform::scan_ai_models()
}

#[cfg(feature = "desktop")]
#[tauri::command]
fn scan_ghost_space() -> Vec<GhostSpaceEntry> {
    platform::scan_ghost_space()
}

#[cfg(feature = "desktop")]
#[tauri::command]
fn scan_telemetry_items() -> Vec<TelemetryEntry> {
    platform::scan_telemetry_items()
}

#[cfg(feature = "desktop")]
#[tauri::command]
fn list_app_capsules() -> Vec<AppCapsuleEntry> {
    platform::list_app_capsules()
}

#[cfg(feature = "desktop")]
#[tauri::command]
fn create_app_capsule(app_name: String, bundle_id: Option<String>) -> Result<AppCapsuleEntry, String> {
    platform::create_app_capsule(&app_name, bundle_id.as_deref().unwrap_or(""))
}

#[cfg(feature = "desktop")]
#[tauri::command]
fn restore_app_capsule(capsule_id: String) -> Result<String, String> {
    platform::restore_app_capsule(&capsule_id)
}

#[cfg(feature = "desktop")]
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            get_system_overview,
            scan_installed_apps,
            deep_scan_app,
            scan_orphaned_items,
            scan_startup_items,
            toggle_startup_item,
            scan_managed_packages,
            uninstall_managed_package,
            scan_system_plugins,
            get_performance_snapshot,
            run_maintenance_task,
            scan_developer_caches,
            scan_large_and_old_files,
            scan_space_lens,
            get_protection_snapshot,
            run_smart_scan,
            execute_uninstall,
            kill_process,
            reveal_in_file_manager,
            scan_universal_apps,
            slim_universal_apps,
            get_trash_history,
            restore_trash_items,
            scan_duplicates,
            shred_paths,
            save_file_with_dialog,
            scan_ai_models,
            scan_ghost_space,
            scan_telemetry_items,
            list_app_capsules,
            create_app_capsule,
            restore_app_capsule
        ])
        .run(tauri::generate_context!())
        .expect("error while running ZeroTrash application");
}
