export interface SystemOverview {
  os_name: string;
  os_version: string;
  architecture: string;
  hostname: string;
  username: string;
  total_disk_bytes: number;
  free_disk_bytes: number;
  used_disk_bytes: number;
  package_managers: string[];
  engine_mode: string;
}

export interface InstalledApp {
  id: string;
  name: string;
  bundle_id: string;
  version: string;
  path: string;
  executable: string;
  app_size_bytes: number;
  leftovers_size_bytes: number;
  total_size_bytes: number;
  leftover_count: number;
  architecture: string;
  source: string;
  last_modified: string;
  is_running: boolean;
  running_pids: number[];
  is_system: boolean;
  publisher: string;
}

export interface LeftoverItem {
  id: string;
  path: string;
  name: string;
  category: string;
  size_bytes: number;
  confidence: string;
  is_directory: boolean;
  requires_sudo: boolean;
  selected_by_default: boolean;
}

export interface RunningProcess {
  pid: number;
  name: string;
  command: string;
  memory_kb: number;
}

export interface AppDeepScanResult {
  app: InstalledApp;
  items: LeftoverItem[];
  running_processes: RunningProcess[];
  total_reclaimable_bytes: number;
}

export interface OrphanedItem {
  id: string;
  path: string;
  name: string;
  inferred_app: string;
  category: string;
  size_bytes: number;
  last_modified: string;
  risk_level: string;
}

export interface StartupItem {
  id: string;
  label: string;
  name: string;
  program: string;
  plist_path: string;
  scope: string;
  run_at_load: boolean;
  keep_alive: boolean;
  is_loaded: boolean;
  pid: number | null;
  binary_exists: boolean;
}

export interface ManagedPackage {
  id: string;
  name: string;
  version: string;
  manager: string;
  description: string;
  uninstall_cmd: string;
}

export interface SystemPlugin {
  id: string;
  name: string;
  bundle_id: string;
  version: string;
  kind: string;
  architecture: string;
  scope: string;
  path: string;
  size_bytes: number;
  last_modified: string;
}

export interface ProcessMetric {
  pid: number;
  name: string;
  command: string;
  cpu_pct: number;
  mem_pct: number;
  memory_bytes: number;
}

export interface MaintenanceTask {
  id: string;
  title: string;
  category: string;
  description: string;
  command_preview: string;
  safe: boolean;
}

export interface MaintenanceResult {
  task_id: string;
  success: boolean;
  output: string;
  duration_ms: number;
}

export interface CacheTarget {
  id: string;
  name: string;
  category: string;
  path: string;
  size_bytes: number;
  description: string;
}

export interface PerformanceSnapshot {
  uptime: string;
  load_average: string;
  memory_pressure: string;
  swap_used: string;
  local_snapshots_count: number;
  cpu_brand: string;
  cpu_cores: number;
  ram_total_bytes: number;
  ram_used_bytes: number;
  ram_wired_bytes: number;
  ram_compressed_bytes: number;
  battery_present: boolean;
  battery_percent: number;
  battery_charging: boolean;
  battery_health_pct: number;
  battery_cycle_count: number;
  battery_temperature_c: number;
  battery_condition: string;
  top_processes: ProcessMetric[];
  tasks: MaintenanceTask[];
}

export interface LargeFileItem {
  id: string;
  name: string;
  path: string;
  category: string;
  extension: string;
  size_bytes: number;
  last_modified: string;
  days_old: number;
}

export interface SpaceLensEntry {
  name: string;
  path: string;
  is_dir: boolean;
  size_bytes: number;
  item_count: number;
  last_modified: string;
}

export interface SpaceLensSnapshot {
  current_path: string;
  parent_path: string | null;
  total_size_bytes: number;
  entries: SpaceLensEntry[];
}

export interface SecurityControl {
  id: string;
  name: string;
  status: string;
  healthy: boolean;
  details: string;
}

export interface PrivacyItem {
  id: string;
  name: string;
  category: string;
  path: string;
  size_bytes: number;
  description: string;
}

export interface ProtectionSnapshot {
  controls: SecurityControl[];
  privacy_items: PrivacyItem[];
  flagged_persistence: StartupItem[];
}

export interface SmartScanReport {
  junk_bytes: number;
  junk_paths: string[];
  orphan_bytes: number;
  orphan_paths: string[];
  installer_bytes: number;
  installer_paths: string[];
  total_reclaimable_bytes: number;
  security_controls_healthy: number;
  security_controls_total: number;
  flagged_agents_count: number;
  active_agents_count: number;
  memory_pressure: string;
  load_average: string;
}

export interface UninstallRequest {
  paths: string[];
  pids_to_kill: number[];
  permanent: boolean;
}

export interface UninstallResult {
  success: boolean;
  removed_paths: string[];
  failed_paths: string[];
  freed_bytes: number;
  mode: string;
  killed_pids: number[];
  message: string;
}

export interface UniversalAppItem {
  id: string;
  name: string;
  bundle_id: string;
  version: string;
  app_path: string;
  executable_path: string;
  total_app_bytes: number;
  fat_binaries_count: number;
  universal_binaries_bytes: number;
  estimated_savings_bytes: number;
  architectures: string;
}

export interface SlimResult {
  success: boolean;
  slimmed_apps: number;
  slimmed_binaries: number;
  saved_bytes: number;
  failed_apps: string[];
  message: string;
}

export interface TrashHistoryEntry {
  id: string;
  name: string;
  original_path: string;
  trash_path: string;
  size_bytes: number;
  deleted_at: string;
  exists_in_trash: boolean;
}

export interface RestoreResult {
  success: boolean;
  restored_count: number;
  failed_items: string[];
  message: string;
}

export interface DuplicateFileEntry {
  path: string;
  name: string;
  parent_dir: string;
  last_modified: string;
  modified_epoch: number;
  is_newest: boolean;
}

export interface DuplicateGroup {
  id: string;
  hash: string;
  name_hint: string;
  extension: string;
  category: string;
  file_size_bytes: number;
  wasted_bytes: number;
  files: DuplicateFileEntry[];
}

export interface AiModelEntry {
  id: string;
  name: string;
  provider: string;
  kind: string;
  path: string;
  size_bytes: number;
  last_modified: string;
  description: string;
}

export interface GhostSpaceEntry {
  id: string;
  name: string;
  category: string;
  path: string;
  size_bytes: number;
  reclaimable: boolean;
  action_hint: string;
  description: string;
}

export interface TelemetryEntry {
  id: string;
  name: string;
  vendor: string;
  kind: string;
  path: string;
  size_bytes: number;
  is_active: boolean;
  description: string;
}

export interface AppCapsuleEntry {
  id: string;
  app_name: string;
  bundle_id: string;
  archive_path: string;
  original_paths: string[];
  size_bytes: number;
  created_at: string;
}

export interface SaveDialogResult {
  saved: boolean;
  path: string;
  message: string;
}



