use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SystemOverview {
    pub os_name: String,
    pub os_version: String,
    pub architecture: String,
    pub hostname: String,
    pub username: String,
    pub total_disk_bytes: u64,
    pub free_disk_bytes: u64,
    pub used_disk_bytes: u64,
    pub package_managers: Vec<String>,
    pub engine_mode: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct InstalledApp {
    pub id: String,
    pub name: String,
    pub bundle_id: String,
    pub version: String,
    pub path: String,
    pub executable: String,
    pub app_size_bytes: u64,
    pub leftovers_size_bytes: u64,
    pub total_size_bytes: u64,
    pub leftover_count: usize,
    pub architecture: String,
    pub source: String,
    pub last_modified: String,
    pub is_running: bool,
    pub running_pids: Vec<u32>,
    pub is_system: bool,
    pub publisher: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LeftoverItem {
    pub id: String,
    pub path: String,
    pub name: String,
    pub category: String,
    pub size_bytes: u64,
    pub confidence: String,
    pub is_directory: bool,
    pub requires_sudo: bool,
    pub selected_by_default: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppDeepScanResult {
    pub app: InstalledApp,
    pub items: Vec<LeftoverItem>,
    pub running_processes: Vec<RunningProcess>,
    pub total_reclaimable_bytes: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OrphanedItem {
    pub id: String,
    pub path: String,
    pub name: String,
    pub inferred_app: String,
    pub category: String,
    pub size_bytes: u64,
    pub last_modified: String,
    pub risk_level: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StartupItem {
    pub id: String,
    pub label: String,
    pub name: String,
    pub program: String,
    pub plist_path: String,
    pub scope: String,
    pub run_at_load: bool,
    pub keep_alive: bool,
    pub is_loaded: bool,
    pub pid: Option<u32>,
    pub binary_exists: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ManagedPackage {
    pub id: String,
    pub name: String,
    pub version: String,
    pub manager: String,
    pub description: String,
    pub uninstall_cmd: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RunningProcess {
    pub pid: u32,
    pub name: String,
    pub command: String,
    pub memory_kb: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SystemPlugin {
    pub id: String,
    pub name: String,
    pub bundle_id: String,
    pub version: String,
    pub kind: String,
    pub architecture: String,
    pub scope: String,
    pub path: String,
    pub size_bytes: u64,
    pub last_modified: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProcessMetric {
    pub pid: u32,
    pub name: String,
    pub command: String,
    pub cpu_pct: f32,
    pub mem_pct: f32,
    pub memory_bytes: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MaintenanceTask {
    pub id: String,
    pub title: String,
    pub category: String,
    pub description: String,
    pub command_preview: String,
    pub safe: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MaintenanceResult {
    pub task_id: String,
    pub success: bool,
    pub output: String,
    pub duration_ms: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CacheTarget {
    pub id: String,
    pub name: String,
    pub category: String,
    pub path: String,
    pub size_bytes: u64,
    pub description: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PerformanceSnapshot {
    pub uptime: String,
    pub load_average: String,
    pub memory_pressure: String,
    pub swap_used: String,
    pub local_snapshots_count: usize,
    pub cpu_brand: String,
    pub cpu_cores: usize,
    pub ram_total_bytes: u64,
    pub ram_used_bytes: u64,
    pub ram_wired_bytes: u64,
    pub ram_compressed_bytes: u64,
    pub battery_present: bool,
    pub battery_percent: u8,
    pub battery_charging: bool,
    pub battery_health_pct: u8,
    pub battery_cycle_count: u32,
    pub battery_temperature_c: f32,
    pub battery_condition: String,
    pub top_processes: Vec<ProcessMetric>,
    pub tasks: Vec<MaintenanceTask>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LargeFileItem {
    pub id: String,
    pub name: String,
    pub path: String,
    pub category: String,
    pub extension: String,
    pub size_bytes: u64,
    pub last_modified: String,
    pub days_old: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SpaceLensEntry {
    pub name: String,
    pub path: String,
    pub is_dir: bool,
    pub size_bytes: u64,
    pub item_count: usize,
    pub last_modified: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SpaceLensSnapshot {
    pub current_path: String,
    pub parent_path: Option<String>,
    pub total_size_bytes: u64,
    pub entries: Vec<SpaceLensEntry>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SecurityControl {
    pub id: String,
    pub name: String,
    pub status: String,
    pub healthy: bool,
    pub details: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PrivacyItem {
    pub id: String,
    pub name: String,
    pub category: String,
    pub path: String,
    pub size_bytes: u64,
    pub description: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProtectionSnapshot {
    pub controls: Vec<SecurityControl>,
    pub privacy_items: Vec<PrivacyItem>,
    pub flagged_persistence: Vec<StartupItem>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SmartScanReport {
    pub junk_bytes: u64,
    pub junk_paths: Vec<String>,
    pub orphan_bytes: u64,
    pub orphan_paths: Vec<String>,
    pub installer_bytes: u64,
    pub installer_paths: Vec<String>,
    pub total_reclaimable_bytes: u64,
    pub security_controls_healthy: usize,
    pub security_controls_total: usize,
    pub flagged_agents_count: usize,
    pub active_agents_count: usize,
    pub memory_pressure: String,
    pub load_average: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UninstallRequest {
    pub paths: Vec<String>,
    pub pids_to_kill: Vec<u32>,
    pub permanent: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UninstallResult {
    pub success: bool,
    pub removed_paths: Vec<String>,
    pub failed_paths: Vec<String>,
    pub freed_bytes: u64,
    pub mode: String,
    pub killed_pids: Vec<u32>,
    pub message: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UniversalAppItem {
    pub id: String,
    pub name: String,
    pub bundle_id: String,
    pub version: String,
    pub app_path: String,
    pub executable_path: String,
    pub total_app_bytes: u64,
    pub fat_binaries_count: usize,
    pub universal_binaries_bytes: u64,
    pub estimated_savings_bytes: u64,
    pub architectures: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SlimResult {
    pub success: bool,
    pub slimmed_apps: usize,
    pub slimmed_binaries: usize,
    pub saved_bytes: u64,
    pub failed_apps: Vec<String>,
    pub message: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TrashHistoryEntry {
    pub id: String,
    pub name: String,
    pub original_path: String,
    pub trash_path: String,
    pub size_bytes: u64,
    pub deleted_at: String,
    pub exists_in_trash: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RestoreResult {
    pub success: bool,
    pub restored_count: usize,
    pub failed_items: Vec<String>,
    pub message: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DuplicateFileEntry {
    pub path: String,
    pub name: String,
    pub parent_dir: String,
    pub last_modified: String,
    pub modified_epoch: u64,
    pub is_newest: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DuplicateGroup {
    pub id: String,
    pub hash: String,
    pub name_hint: String,
    pub extension: String,
    pub category: String,
    pub file_size_bytes: u64,
    pub wasted_bytes: u64,
    pub files: Vec<DuplicateFileEntry>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AiModelEntry {
    pub id: String,
    pub name: String,
    pub provider: String,
    pub kind: String,
    pub path: String,
    pub size_bytes: u64,
    pub last_modified: String,
    pub description: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GhostSpaceEntry {
    pub id: String,
    pub name: String,
    pub category: String,
    pub path: String,
    pub size_bytes: u64,
    pub reclaimable: bool,
    pub action_hint: String,
    pub description: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TelemetryEntry {
    pub id: String,
    pub name: String,
    pub vendor: String,
    pub kind: String,
    pub path: String,
    pub size_bytes: u64,
    pub is_active: bool,
    pub description: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppCapsuleEntry {
    pub id: String,
    pub app_name: String,
    pub bundle_id: String,
    pub archive_path: String,
    pub original_paths: Vec<String>,
    pub size_bytes: u64,
    pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SaveDialogResult {
    pub saved: bool,
    pub path: String,
    pub message: String,
}



