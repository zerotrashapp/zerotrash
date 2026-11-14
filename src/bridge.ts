import { invoke } from '@tauri-apps/api/core';
import type {
  SystemOverview,
  InstalledApp,
  AppDeepScanResult,
  OrphanedItem,
  StartupItem,
  ManagedPackage,
  SystemPlugin,
  PerformanceSnapshot,
  MaintenanceResult,
  CacheTarget,
  LargeFileItem,
  SpaceLensSnapshot,
  ProtectionSnapshot,
  SmartScanReport,
  UninstallRequest,
  UninstallResult,
  UniversalAppItem,
  SlimResult,
  TrashHistoryEntry,
  RestoreResult,
  DuplicateGroup,
  AiModelEntry,
  GhostSpaceEntry,
  TelemetryEntry,
  AppCapsuleEntry,
  SaveDialogResult,
} from './types';

function isTauriEnvironment(): boolean {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
}

async function callRustEngine<T>(cmd: string, args: Record<string, any> = {}): Promise<T> {
  if (isTauriEnvironment()) {
    return invoke<T>(cmd, args);
  }
  const resp = await fetch('/api/invoke', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cmd, args }),
  });
  if (!resp.ok) {
    const errData = await resp.json().catch(() => ({ error: resp.statusText }));
    throw new Error(errData.error || `Engine error (${resp.status})`);
  }
  return resp.json();
}

export const ZeroTrashAPI = {
  getSystemOverview: () => callRustEngine<SystemOverview>('get_system_overview'),
  scanInstalledApps: () => callRustEngine<InstalledApp[]>('scan_installed_apps'),
  deepScanApp: (appPath: string) =>
    callRustEngine<AppDeepScanResult>('deep_scan_app', { appPath }),
  scanOrphanedItems: () => callRustEngine<OrphanedItem[]>('scan_orphaned_items'),
  scanStartupItems: () => callRustEngine<StartupItem[]>('scan_startup_items'),
  toggleStartupItem: (plistPath: string, enable: boolean) =>
    callRustEngine<any>('toggle_startup_item', { plistPath, enable }),
  scanManagedPackages: () => callRustEngine<ManagedPackage[]>('scan_managed_packages'),
  uninstallManagedPackage: (manager: string, name: string) =>
    callRustEngine<any>('uninstall_managed_package', { manager, name }),
  scanSystemPlugins: () => callRustEngine<SystemPlugin[]>('scan_system_plugins'),
  getPerformanceSnapshot: () =>
    callRustEngine<PerformanceSnapshot>('get_performance_snapshot'),
  runMaintenanceTask: (taskId: string) =>
    callRustEngine<MaintenanceResult>('run_maintenance_task', { taskId }),
  scanDeveloperCaches: () => callRustEngine<CacheTarget[]>('scan_developer_caches'),
  scanLargeAndOldFiles: (minBytes?: number) =>
    callRustEngine<LargeFileItem[]>('scan_large_and_old_files', { minBytes }),
  scanSpaceLens: (targetDir?: string) =>
    callRustEngine<SpaceLensSnapshot>('scan_space_lens', { targetDir }),
  getProtectionSnapshot: () =>
    callRustEngine<ProtectionSnapshot>('get_protection_snapshot'),
  runSmartScan: () => callRustEngine<SmartScanReport>('run_smart_scan'),
  executeUninstall: (req: UninstallRequest) =>
    callRustEngine<UninstallResult>('execute_uninstall', { req }),
  killProcess: (pid: number, force: boolean) =>
    callRustEngine<any>('kill_process', { pid, force }),
  revealInFileManager: (path: string) =>
    callRustEngine<any>('reveal_in_file_manager', { path }),
  scanUniversalApps: () =>
    callRustEngine<UniversalAppItem[]>('scan_universal_apps'),
  slimUniversalApps: (appPaths: string[]) =>
    callRustEngine<SlimResult>('slim_universal_apps', { appPaths }),
  getTrashHistory: () =>
    callRustEngine<TrashHistoryEntry[]>('get_trash_history'),
  restoreTrashItems: (ids: string[]) =>
    callRustEngine<RestoreResult>('restore_trash_items', { ids }),
  scanDuplicates: () =>
    callRustEngine<DuplicateGroup[]>('scan_duplicates'),
  shredPaths: (paths: string[], passes = 1) =>
    callRustEngine<UninstallResult>('shred_paths', { paths, passes }),
  saveFileWithDialog: (defaultName: string, content: string) =>
    callRustEngine<SaveDialogResult>('save_file_with_dialog', { defaultName, content }),
  scanAiModels: () => callRustEngine<AiModelEntry[]>('scan_ai_models'),
  scanGhostSpace: () => callRustEngine<GhostSpaceEntry[]>('scan_ghost_space'),
  scanTelemetryItems: () => callRustEngine<TelemetryEntry[]>('scan_telemetry_items'),
  listAppCapsules: () => callRustEngine<AppCapsuleEntry[]>('list_app_capsules'),
  createAppCapsule: (appName: string, bundleId: string) =>
    callRustEngine<AppCapsuleEntry>('create_app_capsule', { appName, bundleId }),
  restoreAppCapsule: (capsuleId: string) =>
    callRustEngine<{ ok: boolean; message: string }>('restore_app_capsule', { capsuleId }),
};

export function formatBytes(bytes: number): string {
  if (!bytes || bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const value = bytes / Math.pow(k, i);
  return `${value.toFixed(i >= 2 ? 2 : 0)} ${units[i]}`;
}
