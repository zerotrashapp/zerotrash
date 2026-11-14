import React, { useEffect, useMemo, useState } from 'react';
import {
  AppWindow,
  Layers,
  Power,
  Package,
  HardDrive,
  Puzzle,
  Activity,
  ShieldCheck,
  FileSearch,
  FolderTree,
  Gauge,
  Search,
  RotateCw,
  CheckSquare,
  Square,
  Loader2,
  Scissors,
  RotateCcw,
  Sun,
  Moon,
  Globe,
  Copy,
  Cpu,
  Flame,
  Download,
  FileText,
  Sparkles,
  UploadCloud,
  Bug,
  ChevronDown,
  ChevronRight,
  Brain,
  Ghost,
  Radar,
  Archive,
} from 'lucide-react';
import { ZeroTrashAPI, formatBytes } from './bridge';
import { LANGUAGES, TRANSLATIONS, Language } from './i18n';
import {
  UpdateModal,
  APP_VERSION,
  DEFAULT_GITHUB_REPO,
  compareVersions,
} from './components/UpdateModal';
import { BugReportModal } from './components/BugReportModal';
import { CommandPaletteModal } from './components/CommandPaletteModal';
import type {
  SystemOverview,
  InstalledApp,
  AppDeepScanResult,
  OrphanedItem,
  StartupItem,
  ManagedPackage,
  SystemPlugin,
  PerformanceSnapshot,
  CacheTarget,
  LargeFileItem,
  SpaceLensSnapshot,
  ProtectionSnapshot,
  SmartScanReport,
  UniversalAppItem,
  TrashHistoryEntry,
  DuplicateGroup,
  AiModelEntry,
  GhostSpaceEntry,
  TelemetryEntry,
  AppCapsuleEntry,
} from './types';
import { AiVaultView } from './components/AiVaultView';
import { GhostSpaceView } from './components/GhostSpaceView';
import { TelemetryView } from './components/TelemetryView';
import { TimeCapsuleView } from './components/TimeCapsuleView';
import { AppInspector } from './components/AppInspector';
import { AppIcon } from './components/AppIcon';
import { StorageMultiBar } from './components/StorageMultiBar';
import { OrphansView } from './components/OrphansView';
import { StartupView } from './components/StartupView';
import { PackagesView } from './components/PackagesView';
import { PluginsView } from './components/PluginsView';
import { MaintenanceView } from './components/MaintenanceView';
import { StorageView } from './components/StorageView';
import { SmartScanView } from './components/SmartScanView';
import { LargeFilesView } from './components/LargeFilesView';
import { SpaceLensView } from './components/SpaceLensView';
import { ProtectionView } from './components/ProtectionView';
import { UniversalSlimmerView } from './components/UniversalSlimmerView';
import { TrashHistoryView } from './components/TrashHistoryView';
import { DuplicatesView } from './components/DuplicatesView';
import { ShredderView } from './components/ShredderView';
import { ConfirmDialog, ConfirmState } from './components/ConfirmDialog';

type Section =
  | 'smart'
  | 'apps'
  | 'universal'
  | 'plugins'
  | 'orphans'
  | 'packages'
  | 'large'
  | 'duplicates'
  | 'lens'
  | 'storage'
  | 'protection'
  | 'shredder'
  | 'maintenance'
  | 'startup'
  | 'history'
  | 'ai_vault'
  | 'ghost_space'
  | 'telemetry'
  | 'time_capsule';

export default function App() {
  const [section, setSection] = useState<Section>('smart');
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [showProTools, setShowProTools] = useState<boolean>(() => {
    try {
      return localStorage.getItem('zerotrash-pro-tools') === 'true';
    } catch {
      return false;
    }
  });
  const [showExclusiveTools, setShowExclusiveTools] = useState<boolean>(() => {
    try {
      return localStorage.getItem('zerotrash-exclusive-tools') === 'true';
    } catch {
      return false;
    }
  });
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem('zerotrash-theme');
    return saved === 'light' ? 'light' : 'dark';
  });
  const [lang, setLang] = useState<Language>(() => {
    const saved = localStorage.getItem('zerotrash-lang') as Language;
    return saved && TRANSLATIONS[saved] ? saved : 'en';
  });

  const t = TRANSLATIONS[lang];

  useEffect(() => {
    localStorage.setItem('zerotrash-theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('zerotrash-lang', lang);
  }, [lang]);

  const [overview, setOverview] = useState<SystemOverview | null>(null);

  const [smartReport, setSmartReport] = useState<SmartScanReport | null>(null);
  const [loadingSmart, setLoadingSmart] = useState(false);

  const [apps, setApps] = useState<InstalledApp[]>([]);
  const [loadingApps, setLoadingApps] = useState(true);
  const [appSearch, setAppSearch] = useState('');
  const [sourceFilter, setSourceFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState<'total' | 'leftovers' | 'name'>('total');

  const [selectedApp, setSelectedApp] = useState<InstalledApp | null>(null);
  const [deepScan, setDeepScan] = useState<AppDeepScanResult | null>(null);
  const [loadingScan, setLoadingScan] = useState(false);
  const [selectedPaths, setSelectedPaths] = useState<Set<string>>(new Set());
  const [bulkPaths, setBulkPaths] = useState<Set<string>>(new Set());

  const [universalApps, setUniversalApps] = useState<UniversalAppItem[]>([]);
  const [loadingUniversal, setLoadingUniversal] = useState(false);
  const [slimBusy, setSlimBusy] = useState(false);

  const [trashHistory, setTrashHistory] = useState<TrashHistoryEntry[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [restoringTrash, setRestoringTrash] = useState(false);

  const [plugins, setPlugins] = useState<SystemPlugin[]>([]);
  const [loadingPlugins, setLoadingPlugins] = useState(false);
  const [pluginKind, setPluginKind] = useState('ALL');
  const [pluginSearch, setPluginSearch] = useState('');
  const [selectedPlugins, setSelectedPlugins] = useState<Set<string>>(new Set());

  const [orphans, setOrphans] = useState<OrphanedItem[]>([]);
  const [loadingOrphans, setLoadingOrphans] = useState(false);
  const [selectedOrphans, setSelectedOrphans] = useState<Set<string>>(new Set());
  const [orphanCategory, setOrphanCategory] = useState('ALL');

  const [startupItems, setStartupItems] = useState<StartupItem[]>([]);
  const [loadingStartup, setLoadingStartup] = useState(false);
  const [startupScope, setStartupScope] = useState('ALL');
  const [startupSearch, setStartupSearch] = useState('');

  const [packages, setPackages] = useState<ManagedPackage[]>([]);
  const [loadingPackages, setLoadingPackages] = useState(false);
  const [pkgManager, setPkgManager] = useState('ALL');
  const [pkgSearch, setPkgSearch] = useState('');

  const [perfSnapshot, setPerfSnapshot] = useState<PerformanceSnapshot | null>(null);
  const [devCaches, setDevCaches] = useState<CacheTarget[]>([]);
  const [loadingMaintenance, setLoadingMaintenance] = useState(false);
  const [selectedCaches, setSelectedCaches] = useState<Set<string>>(new Set());

  const [largeFiles, setLargeFiles] = useState<LargeFileItem[]>([]);
  const [loadingLarge, setLoadingLarge] = useState(false);
  const [selectedLarge, setSelectedLarge] = useState<Set<string>>(new Set());

  const [duplicateGroups, setDuplicateGroups] = useState<DuplicateGroup[]>([]);
  const [loadingDuplicates, setLoadingDuplicates] = useState(false);
  const [selectedDuplicates, setSelectedDuplicates] = useState<Set<string>>(new Set());

  const [spaceLens, setSpaceLens] = useState<SpaceLensSnapshot | null>(null);
  const [loadingLens, setLoadingLens] = useState(false);

  const [protection, setProtection] = useState<ProtectionSnapshot | null>(null);
  const [loadingProtection, setLoadingProtection] = useState(false);
  const [selectedPrivacy, setSelectedPrivacy] = useState<Set<string>>(new Set());
  const [shredBusy, setShredBusy] = useState(false);

  const [aiModels, setAiModels] = useState<AiModelEntry[]>([]);
  const [loadingAi, setLoadingAi] = useState(false);
  const [ghostSpace, setGhostSpace] = useState<GhostSpaceEntry[]>([]);
  const [loadingGhost, setLoadingGhost] = useState(false);
  const [telemetryItems, setTelemetryItems] = useState<TelemetryEntry[]>([]);
  const [loadingTelemetry, setLoadingTelemetry] = useState(false);
  const [capsules, setCapsules] = useState<AppCapsuleEntry[]>([]);
  const [loadingCapsules, setLoadingCapsules] = useState(false);

  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null);
  const [busyUninstall, setBusyUninstall] = useState(false);
  const [sessionFreed, setSessionFreed] = useState(0);
  const [statusMessage, setStatusMessage] = useState<string>('Ready');

  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showBugModal, setShowBugModal] = useState(false);
  const [hasUpdateAvailable, setHasUpdateAvailable] = useState(false);
  const [latestReleaseVersion, setLatestReleaseVersion] = useState(APP_VERSION);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [droppedShredderPaths, setDroppedShredderPaths] = useState<string[]>([]);

  useEffect(() => {
    refreshPrimaryData();
    fetchSmartScan();
    ZeroTrashAPI.scanDeveloperCaches().then(setDevCaches).catch(() => {});
    ZeroTrashAPI.scanSystemPlugins().then(setPlugins).catch(() => {});
    ZeroTrashAPI.scanUniversalApps().then(setUniversalApps).catch(() => {});
    ZeroTrashAPI.getTrashHistory().then(setTrashHistory).catch(() => {});
    ZeroTrashAPI.getPerformanceSnapshot().then(setPerfSnapshot).catch(() => {});
    ZeroTrashAPI.scanOrphanedItems().then((list) => {
      setOrphans(list);
      setSelectedOrphans(new Set(list.filter((o) => o.risk_level === 'Safe').map((o) => o.path)));
    }).catch(() => {});

    // Auto-check GitHub Releases for updates on startup if enabled
    try {
      const autoCheck = localStorage.getItem('zerotrash-autocheck-updates') !== 'false';
      if (autoCheck) {
        const repo = localStorage.getItem('zerotrash-github-repo') || DEFAULT_GITHUB_REPO;
        fetch(`https://api.github.com/repos/${repo}/releases/latest`, {
          headers: { Accept: 'application/vnd.github+json' },
        })
          .then((r) => (r.ok ? r.json() : null))
          .then((data) => {
            if (data?.tag_name && compareVersions(data.tag_name, APP_VERSION) > 0) {
              setHasUpdateAvailable(true);
              setLatestReleaseVersion(data.tag_name.replace(/^v/i, ''));
            }
          })
          .catch(() => {});
      }
    } catch {}
  }, []);

  async function refreshPrimaryData() {
    setLoadingApps(true);
    setStatusMessage('Scanning installed applications...');
    try {
      const [sys, appList] = await Promise.all([
        ZeroTrashAPI.getSystemOverview(),
        ZeroTrashAPI.scanInstalledApps(),
      ]);
      setOverview(sys);
      setApps(appList);
      setStatusMessage(`Indexed ${appList.length} applications`);
      if (appList.length > 0 && !selectedApp) {
        inspectApplication(appList[0]);
      }
    } catch (err: any) {
      setStatusMessage(`Error: ${err.message}`);
    } finally {
      setLoadingApps(false);
    }
  }

  async function inspectApplication(app: InstalledApp) {
    setSelectedApp(app);
    setLoadingScan(true);
    try {
      const res = await ZeroTrashAPI.deepScanApp(app.path);
      setDeepScan(res);
      setSelectedPaths(
        new Set(res.items.filter((i) => i.selected_by_default).map((i) => i.path))
      );
    } catch (err: any) {
      setStatusMessage(`Inspection failed: ${err.message}`);
    } finally {
      setLoadingScan(false);
    }
  }

  async function fetchSmartScan() {
    setLoadingSmart(true);
    setStatusMessage('Running Smart Care analysis...');
    try {
      const res = await ZeroTrashAPI.runSmartScan();
      setSmartReport(res);
      setStatusMessage(
        `Smart Care complete: ${formatBytes(res.total_reclaimable_bytes)} reclaimable`
      );
    } catch (err: any) {
      setStatusMessage(`Error: ${err.message}`);
    } finally {
      setLoadingSmart(false);
    }
  }

  async function fetchUniversalApps() {
    setLoadingUniversal(true);
    setStatusMessage('Scanning Mach-O headers for Universal (arm64 + x86_64) binaries...');
    try {
      const list = await ZeroTrashAPI.scanUniversalApps();
      setUniversalApps(list);
      const totalSave = list.reduce((s, i) => s + i.estimated_savings_bytes, 0);
      setStatusMessage(
        `Found ${list.length} Universal apps (~${formatBytes(totalSave)} Intel code)`
      );
    } catch (err: any) {
      setStatusMessage(`Error: ${err.message}`);
    } finally {
      setLoadingUniversal(false);
    }
  }

  async function handleSlimUniversalApps(appPaths: string[]) {
    setSlimBusy(true);
    setStatusMessage(`Stripping x86_64 slices from ${appPaths.length} applications...`);
    try {
      const res = await ZeroTrashAPI.slimUniversalApps(appPaths);
      if (res.saved_bytes > 0) {
        setSessionFreed((prev) => prev + res.saved_bytes);
      }
      setStatusMessage(`${res.message} (${formatBytes(res.saved_bytes)} saved)`);
      await fetchUniversalApps();
      ZeroTrashAPI.getSystemOverview().then(setOverview).catch(() => {});
    } catch (err: any) {
      setStatusMessage(`Slimming failed: ${err.message}`);
    } finally {
      setSlimBusy(false);
    }
  }

  async function fetchTrashHistory() {
    setLoadingHistory(true);
    try {
      const list = await ZeroTrashAPI.getTrashHistory();
      setTrashHistory(list);
      setStatusMessage(`Loaded ${list.length} Trash history entries`);
    } catch (err: any) {
      setStatusMessage(`Error: ${err.message}`);
    } finally {
      setLoadingHistory(false);
    }
  }

  async function handleRestoreTrashItems(ids: string[]) {
    setRestoringTrash(true);
    setStatusMessage(`Restoring ${ids.length} items from ~/.Trash...`);
    try {
      const res = await ZeroTrashAPI.restoreTrashItems(ids);
      setStatusMessage(res.message);
      await fetchTrashHistory();
      refreshPrimaryData();
    } catch (err: any) {
      setStatusMessage(`Restore failed: ${err.message}`);
    } finally {
      setRestoringTrash(false);
    }
  }

  async function fetchPlugins() {
    setLoadingPlugins(true);
    setStatusMessage('Scanning Audio Units, VSTs, QuickLook, and IDE extensions...');
    try {
      const list = await ZeroTrashAPI.scanSystemPlugins();
      setPlugins(list);
      setSelectedPlugins(new Set());
      setStatusMessage(`Indexed ${list.length} plug-ins and extensions`);
    } catch (err: any) {
      setStatusMessage(`Error: ${err.message}`);
    } finally {
      setLoadingPlugins(false);
    }
  }

  async function fetchOrphans() {
    setLoadingOrphans(true);
    setStatusMessage('Scanning ~/Library for orphaned data...');
    try {
      const list = await ZeroTrashAPI.scanOrphanedItems();
      setOrphans(list);
      setSelectedOrphans(
        new Set(list.filter((o) => o.risk_level === 'Safe').map((o) => o.path))
      );
      setStatusMessage(`Found ${list.length} orphaned items`);
    } catch (err: any) {
      setStatusMessage(`Error: ${err.message}`);
    } finally {
      setLoadingOrphans(false);
    }
  }

  async function fetchStartup() {
    setLoadingStartup(true);
    setStatusMessage('Scanning launchd agents and daemons...');
    try {
      const list = await ZeroTrashAPI.scanStartupItems();
      setStartupItems(list);
      setStatusMessage(`Loaded ${list.length} launchd entries`);
    } catch (err: any) {
      setStatusMessage(`Error: ${err.message}`);
    } finally {
      setLoadingStartup(false);
    }
  }

  async function fetchPackages() {
    setLoadingPackages(true);
    setStatusMessage('Reading package managers...');
    try {
      const list = await ZeroTrashAPI.scanManagedPackages();
      setPackages(list);
      setStatusMessage(`Found ${list.length} managed packages`);
    } catch (err: any) {
      setStatusMessage(`Error: ${err.message}`);
    } finally {
      setLoadingPackages(false);
    }
  }

  async function fetchMaintenance() {
    setLoadingMaintenance(true);
    setStatusMessage('Collecting system metrics and developer cache sizes...');
    try {
      const [snap, caches] = await Promise.all([
        ZeroTrashAPI.getPerformanceSnapshot(),
        ZeroTrashAPI.scanDeveloperCaches(),
      ]);
      setPerfSnapshot(snap);
      setDevCaches(caches);
      setSelectedCaches(new Set(caches.map((c) => c.path)));
      setStatusMessage(`Detected ${caches.length} cache directories`);
    } catch (err: any) {
      setStatusMessage(`Error: ${err.message}`);
    } finally {
      setLoadingMaintenance(false);
    }
  }

  async function fetchLargeFiles() {
    setLoadingLarge(true);
    setStatusMessage('Scanning user folders for files larger than 20 MB...');
    try {
      const list = await ZeroTrashAPI.scanLargeAndOldFiles(20 * 1024 * 1024);
      setLargeFiles(list);
      setSelectedLarge(
        new Set(
          list
            .filter((f) => f.category === 'Disk Images & Installers')
            .map((f) => f.path)
        )
      );
      setStatusMessage(`Found ${list.length} large files`);
    } catch (err: any) {
      setStatusMessage(`Error: ${err.message}`);
    } finally {
      setLoadingLarge(false);
    }
  }

  async function fetchDuplicates() {
    setLoadingDuplicates(true);
    setStatusMessage('Running 3-stage byte-exact duplicate file scan...');
    try {
      const list = await ZeroTrashAPI.scanDuplicates();
      setDuplicateGroups(list);
      const autoPaths = new Set<string>();
      for (const g of list) {
        g.files.forEach((f, idx) => {
          if (idx > 0) autoPaths.add(f.path);
        });
      }
      setSelectedDuplicates(autoPaths);
      const wasted = list.reduce((s, g) => s + g.wasted_bytes, 0);
      setStatusMessage(`Found ${list.length} duplicate groups (${formatBytes(wasted)} wasted)`);
    } catch (err: any) {
      setStatusMessage(`Duplicate scan failed: ${err.message}`);
    } finally {
      setLoadingDuplicates(false);
    }
  }

  async function fetchSpaceLens(targetDir?: string) {
    setLoadingLens(true);
    setStatusMessage(`Mapping directory sizes${targetDir ? ` in ${targetDir}` : ''}...`);
    try {
      const snap = await ZeroTrashAPI.scanSpaceLens(targetDir);
      setSpaceLens(snap);
      setStatusMessage(`Mapped ${snap.entries.length} items in ${snap.current_path}`);
    } catch (err: any) {
      setStatusMessage(`Space Lens error: ${err.message}`);
    } finally {
      setLoadingLens(false);
    }
  }

  async function fetchProtection() {
    setLoadingProtection(true);
    setStatusMessage('Auditing macOS security controls and local privacy traces...');
    try {
      const snap = await ZeroTrashAPI.getProtectionSnapshot();
      setProtection(snap);
      setSelectedPrivacy(new Set());
      setStatusMessage('Security and privacy audit complete');
    } catch (err: any) {
      setStatusMessage(`Protection audit failed: ${err.message}`);
    } finally {
      setLoadingProtection(false);
    }
  }

  async function fetchAiVault() {
    setLoadingAi(true);
    setStatusMessage('Scanning local AI models, HuggingFace weights, and GPU caches...');
    try {
      const list = await ZeroTrashAPI.scanAiModels();
      setAiModels(list);
      setStatusMessage(`Found ${list.length} AI model & cache locations`);
    } catch (err: any) {
      setStatusMessage(`AI Vault scan failed: ${err.message}`);
    } finally {
      setLoadingAi(false);
    }
  }

  async function fetchGhostSpace() {
    setLoadingGhost(true);
    setStatusMessage('Hunting trapped Ghost Space (Docker, iPhone backups, VM disks)...');
    try {
      const list = await ZeroTrashAPI.scanGhostSpace();
      setGhostSpace(list);
      setStatusMessage(`Detected ${list.length} Ghost Space locations`);
    } catch (err: any) {
      setStatusMessage(`Ghost Space scan failed: ${err.message}`);
    } finally {
      setLoadingGhost(false);
    }
  }

  async function fetchTelemetry() {
    setLoadingTelemetry(true);
    setStatusMessage('Auditing Crashpad queues, Sentry dumps, and telemetry logs...');
    try {
      const list = await ZeroTrashAPI.scanTelemetryItems();
      setTelemetryItems(list);
      setStatusMessage(`Found ${list.length} telemetry & crash dump locations`);
    } catch (err: any) {
      setStatusMessage(`Telemetry scan failed: ${err.message}`);
    } finally {
      setLoadingTelemetry(false);
    }
  }

  async function fetchCapsules() {
    setLoadingCapsules(true);
    try {
      const list = await ZeroTrashAPI.listAppCapsules();
      setCapsules(list);
    } catch (err: any) {
      setStatusMessage(`Time-Capsule load failed: ${err.message}`);
    } finally {
      setLoadingCapsules(false);
    }
  }

  async function handleCreateCapsule(appName: string, bundleId: string) {
    setStatusMessage(`Archiving settings capsule for ${appName}...`);
    try {
      const created = await ZeroTrashAPI.createAppCapsule(appName, bundleId);
      setCapsules((prev) => [created, ...prev]);
      setStatusMessage(`Saved settings capsule for ${appName} (${formatBytes(created.size_bytes)})`);
    } catch (err: any) {
      setStatusMessage(`Capsule error: ${err.message}`);
    }
  }

  async function handleRestoreCapsule(capsuleId: string) {
    setStatusMessage('Restoring application settings from Time-Capsule...');
    try {
      const res = await ZeroTrashAPI.restoreAppCapsule(capsuleId);
      setStatusMessage(res.message);
    } catch (err: any) {
      setStatusMessage(`Restore failed: ${err.message}`);
    }
  }

  function refreshActiveSection() {
    refreshPrimaryData();
    if (section === 'smart') fetchSmartScan();
    if (section === 'universal') fetchUniversalApps();
    if (section === 'history') fetchTrashHistory();
    if (section === 'plugins') fetchPlugins();
    if (section === 'orphans') fetchOrphans();
    if (section === 'startup') fetchStartup();
    if (section === 'packages') fetchPackages();
    if (section === 'maintenance') fetchMaintenance();
    if (section === 'large') fetchLargeFiles();
    if (section === 'duplicates') fetchDuplicates();
    if (section === 'lens') fetchSpaceLens(spaceLens?.current_path);
    if (section === 'protection') fetchProtection();
    if (section === 'ai_vault') fetchAiVault();
    if (section === 'ghost_space') fetchGhostSpace();
    if (section === 'telemetry') fetchTelemetry();
    if (section === 'time_capsule') fetchCapsules();
  }

  useEffect(() => {
    if (section === 'smart' && !smartReport && !loadingSmart) {
      fetchSmartScan();
    } else if (section === 'universal' && universalApps.length === 0 && !loadingUniversal) {
      fetchUniversalApps();
    } else if (section === 'history' && !loadingHistory) {
      fetchTrashHistory();
    } else if (section === 'plugins' && plugins.length === 0 && !loadingPlugins) {
      fetchPlugins();
    } else if (section === 'orphans' && orphans.length === 0 && !loadingOrphans) {
      fetchOrphans();
    } else if (section === 'startup' && startupItems.length === 0 && !loadingStartup) {
      fetchStartup();
    } else if (section === 'packages' && packages.length === 0 && !loadingPackages) {
      fetchPackages();
    } else if (section === 'maintenance' && !perfSnapshot && !loadingMaintenance) {
      fetchMaintenance();
    } else if (section === 'large' && largeFiles.length === 0 && !loadingLarge) {
      fetchLargeFiles();
    } else if (section === 'duplicates' && duplicateGroups.length === 0 && !loadingDuplicates) {
      fetchDuplicates();
    } else if (section === 'lens' && !spaceLens && !loadingLens) {
      fetchSpaceLens();
    } else if (section === 'protection' && !protection && !loadingProtection) {
      fetchProtection();
    } else if (section === 'shredder') {
      if (largeFiles.length === 0 && !loadingLarge) fetchLargeFiles();
      if (!loadingHistory) fetchTrashHistory();
    } else if (section === 'ai_vault' && aiModels.length === 0 && !loadingAi) {
      fetchAiVault();
    } else if (section === 'ghost_space' && ghostSpace.length === 0 && !loadingGhost) {
      fetchGhostSpace();
    } else if (section === 'telemetry' && telemetryItems.length === 0 && !loadingTelemetry) {
      fetchTelemetry();
    } else if (section === 'time_capsule' && !loadingCapsules) {
      fetchCapsules();
    }
  }, [section]);

  const visibleApps = useMemo(() => {
    return apps
      .filter((a) => {
        if (a.is_system) return false;
        if (sourceFilter === 'RUNNING' && !a.is_running) return false;
        if (sourceFilter !== 'ALL' && sourceFilter !== 'RUNNING' && a.source !== sourceFilter) {
          return false;
        }
        if (appSearch.trim()) {
          const q = appSearch.toLowerCase();
          return (
            a.name.toLowerCase().includes(q) ||
            a.bundle_id.toLowerCase().includes(q) ||
            a.publisher.toLowerCase().includes(q)
          );
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'total') return b.total_size_bytes - a.total_size_bytes;
        if (sortBy === 'leftovers') return b.leftovers_size_bytes - a.leftovers_size_bytes;
        return a.name.localeCompare(b.name);
      });
  }, [apps, sourceFilter, appSearch, sortBy]);

  const totalAppsBundleBytes = useMemo(
    () => apps.reduce((sum, a) => sum + a.app_size_bytes, 0),
    [apps]
  );

  const totalSupportBytes = useMemo(
    () => apps.reduce((sum, a) => sum + a.leftovers_size_bytes, 0),
    [apps]
  );

  const totalDevCachesBytes = useMemo(
    () => devCaches.reduce((sum, c) => sum + c.size_bytes, 0),
    [devCaches]
  );

  const totalPluginsBytes = useMemo(
    () => plugins.reduce((sum, p) => sum + p.size_bytes, 0),
    [plugins]
  );

  function toggleSelectedPath(path: string) {
    setSelectedPaths((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  }

  function toggleBulkPath(path: string, e: React.MouseEvent) {
    e.stopPropagation();
    setBulkPaths((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  }

  async function initiateBulkUninstall() {
    if (bulkPaths.size === 0) return;
    setLoadingScan(true);
    try {
      const paths: string[] = [];
      const pids: number[] = [];
      let bytes = 0;

      for (const appPath of Array.from(bulkPaths)) {
        const res = await ZeroTrashAPI.deepScanApp(appPath);
        res.items.forEach((i) => {
          paths.push(i.path);
          bytes += i.size_bytes;
        });
        res.running_processes.forEach((p) => pids.push(p.pid));
      }

      setConfirmState({
        open: true,
        title: `Uninstall ${bulkPaths.size} Applications`,
        subtitle: `All selected application bundles and their associated support files (${paths.length} paths) will be moved to the Trash.`,
        paths: Array.from(new Set(paths)),
        pidsToKill: Array.from(new Set(pids)),
        totalBytes: bytes,
        permanent: false,
        onSuccess: () => {
          setBulkPaths(new Set());
          refreshPrimaryData();
        },
      });
    } catch (err: any) {
      setStatusMessage(`Batch scan failed: ${err.message}`);
    } finally {
      setLoadingScan(false);
    }
  }

  async function executeConfirmedUninstall() {
    if (!confirmState) return;
    setBusyUninstall(true);
    try {
      const res = await ZeroTrashAPI.executeUninstall({
        paths: confirmState.paths,
        pids_to_kill: confirmState.pidsToKill,
        permanent: confirmState.permanent,
      });
      setSessionFreed((prev) => prev + res.freed_bytes);
      setStatusMessage(`${res.message} (${formatBytes(res.freed_bytes)} reclaimed)`);
      const cb = confirmState.onSuccess;
      setConfirmState(null);
      ZeroTrashAPI.getSystemOverview().then(setOverview).catch(() => {});
      ZeroTrashAPI.scanDeveloperCaches().then(setDevCaches).catch(() => {});
      ZeroTrashAPI.getTrashHistory().then(setTrashHistory).catch(() => {});
      if (cb) cb();
    } catch (err: any) {
      setStatusMessage(`Uninstall failed: ${err.message}`);
    } finally {
      setBusyUninstall(false);
    }
  }

  async function handleKillProcess(pid: number, force = true) {
    try {
      await ZeroTrashAPI.killProcess(pid, force);
      setStatusMessage(`Terminated process PID ${pid}`);
      if (section === 'apps' && selectedApp) inspectApplication(selectedApp);
      if (section === 'maintenance') fetchMaintenance();
    } catch (err: any) {
      setStatusMessage(`Failed to terminate PID ${pid}: ${err.message}`);
    }
  }

  async function handleToggleStartup(item: StartupItem) {
    try {
      await ZeroTrashAPI.toggleStartupItem(item.plist_path, !item.is_loaded);
      setStatusMessage(`${item.label} ${!item.is_loaded ? 'loaded' : 'unloaded'}`);
      fetchStartup();
    } catch (err: any) {
      setStatusMessage(`launchctl error: ${err.message}`);
    }
  }

  async function handleUninstallPackage(pkg: ManagedPackage) {
    setStatusMessage(`Running: ${pkg.uninstall_cmd}...`);
    try {
      await ZeroTrashAPI.uninstallManagedPackage(pkg.manager, pkg.name);
      setStatusMessage(`Uninstalled ${pkg.name}`);
      fetchPackages();
    } catch (err: any) {
      setStatusMessage(`Package removal failed: ${err.message}`);
    }
  }

  async function handleRunMaintenanceTask(taskId: string) {
    setStatusMessage(`Executing maintenance task: ${taskId}...`);
    try {
      const res = await ZeroTrashAPI.runMaintenanceTask(taskId);
      setStatusMessage(`Completed ${taskId} in ${res.duration_ms} ms`);
      return res;
    } catch (err: any) {
      setStatusMessage(`Task failed: ${err.message}`);
      return null;
    }
  }

  async function handleShredPaths(paths: string[], passes: number) {
    setShredBusy(true);
    setStatusMessage(`Securely overwriting ${paths.length} items (${passes}-pass)...`);
    try {
      const res = await ZeroTrashAPI.shredPaths(paths, passes);
      if (res.freed_bytes > 0) {
        setSessionFreed((prev) => prev + res.freed_bytes);
      }
      setStatusMessage(`${res.message} (${formatBytes(res.freed_bytes)} erased)`);
      fetchTrashHistory();
      fetchLargeFiles();
      ZeroTrashAPI.getSystemOverview().then(setOverview).catch(() => {});
    } catch (err: any) {
      setStatusMessage(`Shred failed: ${err.message}`);
    } finally {
      setShredBusy(false);
    }
  }

  const restorableTrashCount = trashHistory.filter((i) => i.exists_in_trash).length;

  async function handleDroppedPath(rawPath: string) {
    const cleaned = rawPath.replace(/^file:\/\//i, '').replace(/\/+$/, '');
    const decoded = decodeURIComponent(cleaned).trim();
    if (!decoded) return;

    if (decoded.toLowerCase().endsWith('.app')) {
      setSection('apps');
      const existing = apps.find(
        (a) =>
          a.path.toLowerCase() === decoded.toLowerCase() ||
          decoded.toLowerCase().endsWith(`/${a.name.toLowerCase()}.app`)
      );
      if (existing) {
        inspectApplication(existing);
        setStatusMessage(`Deep inspecting dropped app: ${existing.name}`);
      } else {
        const baseName =
          decoded
            .split('/')
            .pop()
            ?.replace(/\.app$/i, '') || 'Application';
        const syntheticApp: InstalledApp = {
          id: decoded,
          name: baseName,
          bundle_id: '',
          version: '1.0',
          path: decoded.startsWith('/') ? decoded : `/Applications/${baseName}.app`,
          executable: baseName,
          app_size_bytes: 0,
          leftovers_size_bytes: 0,
          total_size_bytes: 0,
          leftover_count: 0,
          architecture: 'Universal',
          source: 'Local',
          last_modified: '',
          is_running: false,
          running_pids: [],
          is_system: false,
          publisher: 'Unknown',
        };
        inspectApplication(syntheticApp);
        setStatusMessage(`Deep inspecting dropped app: ${baseName}`);
      }
    } else {
      const targetPath = decoded.startsWith('/') ? decoded : `~/${decoded}`;
      setDroppedShredderPaths((prev) =>
        prev.includes(targetPath) ? prev : [targetPath, ...prev]
      );
      setSection('shredder');
      setStatusMessage(`Added "${targetPath}" to Secure File Shredder queue`);
    }
  }

  useEffect(() => {
    (window as any).openZeroTrashUpdates = () => setShowUpdateModal(true);
    (window as any).openZeroTrashBugReport = () => setShowBugModal(true);
    (window as any).handleZeroTrashDroppedPath = (p: string) => {
      handleDroppedPath(p);
    };
  }, [apps]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setShowCommandPalette((prev) => !prev);
      } else if (e.key === 'Escape') {
        setShowCommandPalette(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  useEffect(() => {
    const proIds: Section[] = [
      'startup',
      'maintenance',
      'protection',
      'lens',
      'storage',
      'shredder',
      'universal',
      'plugins',
      'packages',
    ];
    if (proIds.includes(section) && !showProTools) {
      setShowProTools(true);
    }
    const exclusiveIds: Section[] = [
      'ai_vault',
      'ghost_space',
      'telemetry',
      'time_capsule',
    ];
    if (exclusiveIds.includes(section) && !showExclusiveTools) {
      setShowExclusiveTools(true);
    }
  }, [section]);

  async function exportAuditReport() {
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const topApps = [...apps]
      .sort((a, b) => b.total_size_bytes - a.total_size_bytes)
      .slice(0, 15);
    const totalOrphanBytes = orphans.reduce((s, o) => s + o.size_bytes, 0);
    const totalCacheBytes = devCaches.reduce((s, c) => s + c.size_bytes, 0);

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>ZeroTrash System Audit Report — ${dateStr}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #0f1115; color: #f5f5f7; margin: 0; padding: 36px; }
    .card { background: #1c1c1e; border: 1px solid rgba(255,255,255,0.1); border-radius: 14px; padding: 20px; margin-bottom: 20px; }
    h1 { margin: 0 0 6px 0; font-size: 24px; color: #ffffff; }
    h2 { margin: 0 0 14px 0; font-size: 15px; color: #64D2FF; text-transform: uppercase; letter-spacing: 0.05em; }
    .meta { color: #8e8e93; font-size: 13px; margin-bottom: 24px; }
    .grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-bottom: 20px; }
    .stat { background: #242426; border-radius: 10px; padding: 14px; border: 1px solid rgba(255,255,255,0.07); }
    .stat-label { font-size: 11px; color: #8e8e93; text-transform: uppercase; }
    .stat-value { font-size: 18px; font-weight: 700; margin-top: 4px; color: #fff; font-family: ui-monospace, monospace; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    th, td { text-align: left; padding: 9px 10px; border-bottom: 1px solid rgba(255,255,255,0.07); }
    th { color: #8e8e93; font-weight: 600; font-size: 11px; text-transform: uppercase; }
    .mono { font-family: ui-monospace, monospace; }
    @media print { body { background: #fff; color: #000; } .card, .stat { background: #f9f9fb; border-color: #ddd; } h1, .stat-value { color: #000; } }
  </style>
</head>
<body>
  <h1>ZeroTrash v${APP_VERSION} — System Health & Storage Audit Report</h1>
  <div class="meta">Generated on ${now.toLocaleString()} · Host: ${overview?.hostname || 'Local Machine'} (${overview?.os_name || 'macOS'} ${overview?.os_version || ''} · ${overview?.architecture || ''})</div>

  <div class="grid">
    <div class="stat">
      <div class="stat-label">Processor & Memory</div>
      <div class="stat-value">${perfSnapshot?.cpu_brand || 'Apple Silicon'}</div>
      <div style="font-size:12px;color:#8e8e93;margin-top:4px;">RAM: ${perfSnapshot ? `${formatBytes(perfSnapshot.ram_used_bytes)} / ${formatBytes(perfSnapshot.ram_total_bytes)}` : 'N/A'}</div>
    </div>
    <div class="stat">
      <div class="stat-label">Disk Utilization</div>
      <div class="stat-value">${overview ? formatBytes(overview.used_disk_bytes) : 'N/A'}</div>
      <div style="font-size:12px;color:#30D158;margin-top:4px;">Free: ${overview ? formatBytes(overview.free_disk_bytes) : 'N/A'}</div>
    </div>
    <div class="stat">
      <div class="stat-label">Reclaimable Junk & Orphans</div>
      <div class="stat-value" style="color:#FF9F0A;">${formatBytes(totalSupportBytes + totalCacheBytes + totalOrphanBytes)}</div>
      <div style="font-size:12px;color:#8e8e93;margin-top:4px;">${orphans.length} orphans · ${devCaches.length} cache targets</div>
    </div>
    <div class="stat">
      <div class="stat-label">Battery & Freed Session</div>
      <div class="stat-value" style="color:#30D158;">${perfSnapshot?.battery_present ? `${perfSnapshot.battery_health_pct}% Health (${perfSnapshot.battery_cycle_count} cycles)` : formatBytes(sessionFreed)}</div>
      <div style="font-size:12px;color:#8e8e93;margin-top:4px;">Freed this session: ${formatBytes(sessionFreed)}</div>
    </div>
  </div>

  <div class="card">
    <h2>Top Installed Applications by Total Footprint (${apps.length} total indexed)</h2>
    <table>
      <thead>
        <tr><th>Application</th><th>Bundle ID</th><th>Source</th><th>Binary Size</th><th>Library Data</th><th>Total Footprint</th></tr>
      </thead>
      <tbody>
        ${topApps
          .map(
            (a) =>
              `<tr><td><strong>${a.name}</strong> <span style="color:#8e8e93">v${a.version}</span></td><td class="mono">${a.bundle_id}</td><td>${a.source}</td><td class="mono">${formatBytes(a.app_size_bytes)}</td><td class="mono">${formatBytes(a.leftovers_size_bytes)}</td><td class="mono"><strong>${formatBytes(a.total_size_bytes)}</strong></td></tr>`
          )
          .join('')}
      </tbody>
    </table>
  </div>
</body>
</html>`;

    const defaultFileName = `ZeroTrash-Audit-Report-${dateStr}.html`;
    setStatusMessage('Opening Save As dialog...');
    try {
      const saveRes = await ZeroTrashAPI.saveFileWithDialog(defaultFileName, html);
      if (saveRes.saved) {
        setStatusMessage(`Exported System Audit Report to ${saveRes.path}`);
        return;
      }
      if (saveRes.message.toLowerCase().includes('cancel')) {
        setStatusMessage('Export cancelled.');
        return;
      }
    } catch {}

    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = defaultFileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setStatusMessage(`Exported System Audit Report (${defaultFileName})`);
  }

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!isDraggingOver) setIsDraggingOver(true);
      }}
      onDragLeave={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.currentTarget.contains(e.relatedTarget as Node)) return;
        setIsDraggingOver(false);
      }}
      onDrop={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDraggingOver(false);

        const uriList = e.dataTransfer.getData('text/uri-list') || e.dataTransfer.getData('text/plain');
        if (uriList) {
          const firstLine = uriList.split(/\r?\n/).find((l) => l.trim() && !l.startsWith('#'));
          if (firstLine) {
            handleDroppedPath(firstLine.trim());
            return;
          }
        }

        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
          const file = e.dataTransfer.files[0] as any;
          const droppedPath = file.path || file.name;
          if (droppedPath) {
            handleDroppedPath(droppedPath);
          }
        }
      }}
      className={`relative h-screen w-screen bg-[#141416] text-white flex flex-col overflow-hidden text-[13px] ${
        theme === 'light' ? 'theme-light' : 'theme-dark'
      }`}
    >
      {/* Full-Window Drag-and-Drop Quick Uninstaller / Shredder Overlay */}
      {isDraggingOver && (
        <div className="fixed inset-0 z-50 bg-[#0A84FF]/20 backdrop-blur-md border-2 border-dashed border-[#64D2FF] m-3 rounded-2xl flex flex-col items-center justify-center pointer-events-none">
          <div className="p-6 rounded-2xl bg-[#1c1c1e]/95 border border-white/15 shadow-2xl flex flex-col items-center text-center max-w-md">
            <div className="w-14 h-14 rounded-2xl bg-[#0A84FF]/20 border border-[#0A84FF]/40 flex items-center justify-center mb-3">
              <UploadCloud className="w-8 h-8 text-[#64D2FF] animate-bounce" />
            </div>
            <div className="text-base font-bold text-white">{t.dropOverlayTitle}</div>
            <div className="text-xs text-[#8e8e93] mt-1.5 leading-relaxed">
              {t.dropOverlaySubtitle}
            </div>
          </div>
        </div>
      )}
      {/* Main Split View */}
      <div className="flex-1 flex overflow-hidden">
        {/* Apple macOS Sequoia Translucent Sidebar */}
        <aside className="w-60 border-r border-white/[0.08] bg-[#1c1c1e]/95 backdrop-blur-2xl flex flex-col justify-between p-3 shrink-0 overflow-y-auto">
          <div className="space-y-3.5">
            {/* App Brand Header */}
            <div className="px-2 pt-1 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <img
                  src="/zerotrash-logo.png"
                  alt="ZeroTrash"
                  className="w-7 h-7 rounded-lg shadow-md border border-white/15 object-cover"
                />
                <div>
                  <div className="font-semibold text-sm text-white leading-none">
                    ZeroTrash
                  </div>
                  <div className="text-[10px] text-[#8e8e93] mt-0.5">
                    {overview
                      ? `${overview.os_name} ${overview.os_version}`
                      : 'System Manager'}
                  </div>
                </div>
              </div>

              <button
                onClick={refreshActiveSection}
                className="p-1.5 rounded-lg hover:bg-white/[0.08] text-[#8e8e93] hover:text-white transition-colors"
                title="Refresh Active View"
              >
                <RotateCw
                  className={`w-3.5 h-3.5 ${
                    loadingApps ||
                    loadingUniversal ||
                    loadingHistory ||
                    loadingPlugins ||
                    loadingMaintenance ||
                    loadingSmart ||
                    loadingLarge ||
                    loadingLens ||
                    loadingProtection
                      ? 'animate-spin text-[#0A84FF]'
                      : ''
                  }`}
                />
              </button>
            </div>

            {/* Quick Search / Command Palette Button (⌘K) */}
            <button
              onClick={() => setShowCommandPalette(true)}
              className="w-full px-2.5 py-1.5 rounded-[9px] bg-[#242426] hover:bg-[#2c2c2e] border border-white/[0.08] flex items-center justify-between text-xs text-[#8e8e93] hover:text-white transition-colors"
            >
              <span className="flex items-center gap-2">
                <Search className="w-3.5 h-3.5 text-[#0A84FF]" />
                <span>Quick Search...</span>
              </span>
              <kbd className="px-1.5 py-0.5 rounded bg-black/40 border border-white/10 text-[10px] font-mono text-[#8e8e93]">
                ⌘K
              </kbd>
            </button>

            <nav className="space-y-0.5">
              <div className="px-2.5 pb-1 text-[11px] font-semibold text-[#8e8e93]">
                {t.systemCare}
              </div>

              {[
                {
                  id: 'smart',
                  label: t.smartCare,
                  icon: Gauge,
                  color: 'text-[#0A84FF]',
                  count: null,
                },
                {
                  id: 'apps',
                  label: t.uninstaller,
                  icon: AppWindow,
                  color: 'text-[#64D2FF]',
                  count: apps.length || null,
                },
                {
                  id: 'orphans',
                  label: t.leftoverFiles,
                  icon: Layers,
                  color: 'text-[#FF9F0A]',
                  count: orphans.length || null,
                },
                {
                  id: 'large',
                  label: t.largeOldFiles,
                  icon: FileSearch,
                  color: 'text-[#FF9F0A]',
                  count: largeFiles.length || null,
                },
                {
                  id: 'duplicates',
                  label: t.duplicatesFinder,
                  icon: Copy,
                  color: 'text-[#BF5AF2]',
                  count: duplicateGroups.length || null,
                },
                {
                  id: 'history',
                  label: t.trashHistory,
                  icon: RotateCcw,
                  color: 'text-[#30D158]',
                  count: restorableTrashCount || null,
                },
              ].map((item) => {
                const Icon = item.icon;
                const active = section === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setSection(item.id as Section)}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-[9px] text-xs font-medium transition-all ${
                      active
                        ? 'bg-[#0A84FF] text-white shadow-sm'
                        : 'text-[#ebebf5]/80 hover:bg-white/[0.06] hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Icon
                        className={`w-4 h-4 shrink-0 ${active ? 'text-white' : item.color}`}
                      />
                      <span className="truncate">{item.label}</span>
                    </div>
                    {item.count !== null && (
                      <span
                        className={`font-mono text-[11px] tabular-nums ${
                          active ? 'text-white/90' : 'text-[#8e8e93]'
                        }`}
                      >
                        {item.count}
                      </span>
                    )}
                  </button>
                );
              })}

              {/* Collapsible Pro & Power Tools Drawer */}
              <div className="pt-2">
                <button
                  onClick={() => {
                    const next = !showProTools;
                    setShowProTools(next);
                    try {
                      localStorage.setItem('zerotrash-pro-tools', String(next));
                    } catch {}
                  }}
                  className="w-full px-2.5 py-1.5 rounded-[8px] flex items-center justify-between text-[11px] font-semibold text-[#8e8e93] hover:text-white hover:bg-white/[0.04] transition-colors"
                >
                  <span className="flex items-center gap-1.5">
                    {showProTools ? (
                      <ChevronDown className="w-3.5 h-3.5 text-[#0A84FF]" />
                    ) : (
                      <ChevronRight className="w-3.5 h-3.5 text-[#8e8e93]" />
                    )}
                    <span>Pro & Power Tools</span>
                  </span>
                  <span className="px-1.5 py-0.2 rounded bg-white/[0.06] font-mono text-[10px]">
                    9
                  </span>
                </button>

                {showProTools && (
                  <div className="mt-0.5 space-y-0.5 pl-1 border-l border-white/[0.07] ml-2">
                    {[
                      {
                        id: 'startup',
                        label: t.launchdServices,
                        icon: Power,
                        color: 'text-[#FFD60A]',
                        count: startupItems.length || null,
                      },
                      {
                        id: 'maintenance',
                        label: t.maintenanceCaches,
                        icon: Activity,
                        color: 'text-[#FF9F0A]',
                        count: devCaches.length || null,
                      },
                      {
                        id: 'protection',
                        label: t.protectionPrivacy,
                        icon: ShieldCheck,
                        color: 'text-[#30D158]',
                        count: null,
                      },
                      {
                        id: 'lens',
                        label: t.spaceLens,
                        icon: FolderTree,
                        color: 'text-[#30D158]',
                        count: null,
                      },
                      {
                        id: 'storage',
                        label: t.appFootprint,
                        icon: HardDrive,
                        color: 'text-[#64D2FF]',
                        count: null,
                      },
                      {
                        id: 'shredder',
                        label: t.fileShredder,
                        icon: Flame,
                        color: 'text-[#FF453A]',
                        count: null,
                      },
                      {
                        id: 'universal',
                        label: t.universalSlimmer,
                        icon: Scissors,
                        color: 'text-[#30D158]',
                        count: universalApps.length || null,
                      },
                      {
                        id: 'plugins',
                        label: t.pluginsAudio,
                        icon: Puzzle,
                        color: 'text-[#BF5AF2]',
                        count: plugins.length || null,
                      },
                      {
                        id: 'packages',
                        label: t.packages,
                        icon: Package,
                        color: 'text-[#64D2FF]',
                        count: packages.length || null,
                      },
                    ].map((item) => {
                      const Icon = item.icon;
                      const active = section === item.id;
                      return (
                        <button
                          key={item.id}
                          onClick={() => setSection(item.id as Section)}
                          className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-[9px] text-xs font-medium transition-all ${
                            active
                              ? 'bg-[#0A84FF] text-white shadow-sm'
                              : 'text-[#ebebf5]/80 hover:bg-white/[0.06] hover:text-white'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <Icon
                              className={`w-4 h-4 shrink-0 ${
                                active ? 'text-white' : item.color
                              }`}
                            />
                            <span className="truncate">{item.label}</span>
                          </div>
                          {item.count !== null && (
                            <span
                              className={`font-mono text-[11px] tabular-nums ${
                                active ? 'text-white/90' : 'text-[#8e8e93]'
                              }`}
                            >
                              {item.count}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Separate Collapsible Exclusive Tools Category */}
              <div className="pt-1">
                <button
                  onClick={() => {
                    const next = !showExclusiveTools;
                    setShowExclusiveTools(next);
                    try {
                      localStorage.setItem('zerotrash-exclusive-tools', String(next));
                    } catch {}
                  }}
                  className="w-full px-2.5 py-1.5 rounded-[8px] flex items-center justify-between text-[11px] font-semibold text-[#64D2FF] hover:bg-[#0A84FF]/10 transition-colors"
                >
                  <span className="flex items-center gap-1.5">
                    {showExclusiveTools ? (
                      <ChevronDown className="w-3.5 h-3.5 text-[#64D2FF]" />
                    ) : (
                      <ChevronRight className="w-3.5 h-3.5 text-[#64D2FF]" />
                    )}
                    <Sparkles className="w-3 h-3 text-[#BF5AF2]" />
                    <span>Exclusive Tools</span>
                  </span>
                  <span className="px-1.5 py-0.2 rounded bg-[#BF5AF2]/20 text-[#BF5AF2] font-mono text-[10px]">
                    4
                  </span>
                </button>

                {showExclusiveTools && (
                  <div className="mt-0.5 space-y-0.5 pl-1 border-l border-[#BF5AF2]/30 ml-2">
                    {[
                      {
                        id: 'ai_vault',
                        label: 'AI & LLM Vault',
                        icon: Brain,
                        color: 'text-[#BF5AF2]',
                        count: aiModels.length || null,
                      },
                      {
                        id: 'ghost_space',
                        label: 'Ghost Space Hunter',
                        icon: Ghost,
                        color: 'text-[#64D2FF]',
                        count: ghostSpace.length || null,
                      },
                      {
                        id: 'telemetry',
                        label: 'Telemetry Shield',
                        icon: Radar,
                        color: 'text-[#FF9F0A]',
                        count: telemetryItems.length || null,
                      },
                      {
                        id: 'time_capsule',
                        label: 'Settings Time-Capsule',
                        icon: Archive,
                        color: 'text-[#30D158]',
                        count: capsules.length || null,
                      },
                    ].map((item) => {
                      const Icon = item.icon;
                      const active = section === item.id;
                      return (
                        <button
                          key={item.id}
                          onClick={() => setSection(item.id as Section)}
                          className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-[9px] text-xs font-medium transition-all ${
                            active
                              ? 'bg-[#0A84FF] text-white shadow-sm'
                              : 'text-[#ebebf5]/80 hover:bg-white/[0.06] hover:text-white'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <Icon
                              className={`w-4 h-4 shrink-0 ${
                                active ? 'text-white' : item.color
                              }`}
                            />
                            <span className="truncate">{item.label}</span>
                          </div>
                          {item.count !== null && (
                            <span
                              className={`font-mono text-[11px] tabular-nums ${
                                active ? 'text-white/90' : 'text-[#8e8e93]'
                              }`}
                            >
                              {item.count}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </nav>
          </div>

          {/* Sidebar Bottom Controls: Hardware Pulse + Session Freed + Theme Toggle + Language Switcher */}
          <div className="mt-3 pt-2.5 border-t border-white/[0.07] space-y-2">
            {perfSnapshot && (
              <div
                onClick={() => {
                  setSection('maintenance');
                  fetchMaintenance();
                }}
                className="p-2.5 rounded-xl bg-[#242426] hover:bg-[#2c2c2e] border border-white/[0.07] cursor-pointer transition-colors space-y-1.5"
                title="Click for full Hardware, Battery & Process Monitor"
              >
                <div className="flex items-center justify-between text-[11px]">
                  <span className="flex items-center gap-1.5 font-medium text-white truncate">
                    <Cpu className="w-3.5 h-3.5 text-[#0A84FF] shrink-0" />
                    <span className="truncate">{perfSnapshot.cpu_brand}</span>
                  </span>
                  <span className="font-mono text-[10px] text-[#30D158] shrink-0">
                    {perfSnapshot.memory_pressure}
                  </span>
                </div>

                <div className="w-full h-1.5 bg-[#141416] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#0A84FF] to-[#BF5AF2] rounded-full"
                    style={{
                      width: `${Math.min(
                        100,
                        Math.round(
                          (perfSnapshot.ram_used_bytes /
                            Math.max(1, perfSnapshot.ram_total_bytes)) *
                            100
                        )
                      )}%`,
                    }}
                  />
                </div>

                <div className="flex items-center justify-between text-[10px] font-mono text-[#8e8e93] tabular-nums whitespace-nowrap">
                  <span>
                    RAM {formatBytes(perfSnapshot.ram_used_bytes)} /{' '}
                    {formatBytes(perfSnapshot.ram_total_bytes)}
                  </span>
                </div>
              </div>
            )}

            {sessionFreed > 0 && (
              <div className="p-2 rounded-xl bg-[#30D158]/15 border border-[#30D158]/30 text-xs flex items-center justify-between">
                <span className="text-[#ebebf5]/90 truncate">{t.freedSession}</span>
                <span className="font-mono font-semibold text-[#30D158] tabular-nums">
                  {formatBytes(sessionFreed)}
                </span>
              </div>
            )}

            <div className="flex items-center justify-between gap-2">
              {/* Theme Switcher (Dark / Light) */}
              <div className="flex items-center bg-[#2c2c2e] p-0.5 rounded-[8px] flex-1">
                <button
                  onClick={() => setTheme('dark')}
                  className={`flex-1 py-1 px-2 rounded-[6px] text-[11px] font-medium flex items-center justify-center gap-1 transition-all ${
                    theme === 'dark'
                      ? 'bg-[#48484a] text-white shadow-sm'
                      : 'text-[#8e8e93] hover:text-white'
                  }`}
                >
                  <Moon className="w-3 h-3" />
                  <span>{t.darkMode}</span>
                </button>
                <button
                  onClick={() => setTheme('light')}
                  className={`flex-1 py-1 px-2 rounded-[6px] text-[11px] font-medium flex items-center justify-center gap-1 transition-all ${
                    theme === 'light'
                      ? 'bg-[#48484a] text-white shadow-sm'
                      : 'text-[#8e8e93] hover:text-white'
                  }`}
                >
                  <Sun className="w-3 h-3" />
                  <span>{t.lightMode}</span>
                </button>
              </div>

              {/* Language Selector */}
              <div className="relative flex items-center bg-[#2c2c2e] rounded-[8px] px-2 py-1">
                <Globe className="w-3 h-3 text-[#0A84FF] mr-1 shrink-0" />
                <select
                  value={lang}
                  onChange={(e) => setLang(e.target.value as Language)}
                  className="bg-transparent text-[11px] font-medium text-white outline-none cursor-pointer"
                  title="Select Language"
                >
                  {LANGUAGES.map((l) => (
                    <option key={l.code} value={l.code} className="bg-[#1c1c1e] text-white">
                      {l.flag} {l.code.toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Updates & Audit Report Row */}
            <div className="flex items-center gap-1.5 pt-0.5">
              <button
                onClick={() => setShowUpdateModal(true)}
                className={`flex-1 py-1.5 px-2 rounded-[8px] text-[11px] font-medium flex items-center justify-center gap-1.5 transition-all border ${
                  hasUpdateAvailable
                    ? 'bg-[#0A84FF]/20 border-[#0A84FF]/50 text-[#64D2FF] hover:bg-[#0A84FF]/30'
                    : 'bg-[#2c2c2e] border-white/[0.06] text-[#ebebf5]/90 hover:text-white hover:bg-[#3a3a3c]'
                }`}
                title="Check GitHub Releases for Updates"
              >
                {hasUpdateAvailable ? (
                  <Sparkles className="w-3.5 h-3.5 text-[#64D2FF] shrink-0" />
                ) : (
                  <Download className="w-3.5 h-3.5 text-[#0A84FF] shrink-0" />
                )}
                <span className="truncate">
                  {hasUpdateAvailable ? `Update v${latestReleaseVersion}` : t.checkForUpdates}
                </span>
              </button>

              <button
                onClick={() => setShowBugModal(true)}
                className="py-1.5 px-2.5 rounded-[8px] bg-[#2c2c2e] hover:bg-[#3a3a3c] border border-white/[0.06] text-[#ebebf5]/90 hover:text-white text-[11px] font-medium flex items-center justify-center transition-all shrink-0"
                title={t.reportBug}
              >
                <Bug className="w-3.5 h-3.5 text-[#FF453A]" />
              </button>

              <button
                onClick={exportAuditReport}
                className="py-1.5 px-2.5 rounded-[8px] bg-[#2c2c2e] hover:bg-[#3a3a3c] border border-white/[0.06] text-[#ebebf5]/90 hover:text-white text-[11px] font-medium flex items-center justify-center transition-all shrink-0"
                title={t.exportReport}
              >
                <FileText className="w-3.5 h-3.5 text-[#30D158]" />
              </button>
            </div>
          </div>
        </aside>

        {/* Right Main Content Column */}
        <div className="flex-1 flex flex-col overflow-hidden bg-[#141416]">
          {/* macOS Sequoia Multi-Segment Storage Header Bar */}
          <div className="px-4 pt-3 pb-2 border-b border-white/[0.07] bg-[#161618] shrink-0 space-y-2">
            <StorageMultiBar
              overview={overview}
              appsBytes={totalAppsBundleBytes}
              cachesBytes={totalSupportBytes + totalDevCachesBytes}
              pluginsBytes={totalPluginsBytes}
              onSelectCategory={(sec) => setSection(sec)}
              compact
            />

            {/* Smart Uninstaller Watcher Banner (Auto-detects remnants of deleted apps) */}
            {orphans.length > 0 && section !== 'orphans' && (
              <div className="px-3 py-1.5 rounded-lg bg-[#FF9F0A]/12 border border-[#FF9F0A]/30 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-2 h-2 rounded-full bg-[#FF9F0A] animate-pulse shrink-0" />
                  <span className="text-[#ebebf5] truncate">
                    <strong>Smart Uninstaller Watcher:</strong> Detected{' '}
                    <strong>{orphans.length} orphaned remnants</strong> (
                    {formatBytes(orphans.reduce((s, o) => s + o.size_bytes, 0))}) left behind by previously deleted apps.
                  </span>
                </div>
                <button
                  onClick={() => setSection('orphans')}
                  className="px-2.5 py-0.5 rounded-md bg-[#FF9F0A] hover:bg-[#FF9F0A]/90 text-black font-semibold text-[11px] shrink-0 transition-colors"
                >
                  Review & Clean
                </button>
              </div>
            )}
          </div>

          {/* Active Tool View */}
          <main className="flex-1 flex overflow-hidden">
            {section === 'smart' && (
              <SmartScanView
                report={smartReport}
                loading={loadingSmart}
                appsCount={apps.length}
                orphansCount={orphans.length}
                onRunScan={fetchSmartScan}
                onNavigate={(sec) => setSection(sec)}
                onCleanAll={(paths, totalBytes) => {
                  setConfirmState({
                    open: true,
                    title: 'Smart Care Cleanup',
                    subtitle: `All ${paths.length} detected cache folders, orphaned leftovers, and unused installer images will be moved to ~/.Trash.`,
                    paths,
                    pidsToKill: [],
                    totalBytes,
                    permanent: false,
                    onSuccess: () => fetchSmartScan(),
                  });
                }}
              />
            )}

            {section === 'apps' && (
              <div className="flex-1 flex overflow-hidden">
                {/* Left Pane: Apple Grouped Applications List */}
                <div className="w-[46%] border-r border-white/[0.07] bg-[#141416] flex flex-col overflow-hidden">
                  <div className="p-3 border-b border-white/[0.07] space-y-2.5">
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <Search className="w-3.5 h-3.5 text-[#8e8e93] absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={appSearch}
                          onChange={(e) => setAppSearch(e.target.value)}
                          placeholder={t.searchAppsPlaceholder}
                          className="w-full bg-[#1c1c1e] border border-white/[0.08] focus:border-[#0A84FF] rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder:text-[#8e8e93] outline-none transition-colors"
                        />
                      </div>

                      {bulkPaths.size > 0 && (
                        <button
                          onClick={initiateBulkUninstall}
                          className="px-3 py-1.5 rounded-lg bg-[#0A84FF] hover:bg-[#0070E0] text-xs font-semibold text-white shrink-0 shadow-sm transition-colors"
                        >
                          Uninstall ({bulkPaths.size})
                        </button>
                      )}
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      {/* Apple Segmented Control */}
                      <div className="flex items-center bg-[#2c2c2e] p-0.5 rounded-[8px]">
                        {[
                          { id: 'ALL', label: t.all },
                          { id: 'Applications', label: t.local },
                          { id: 'Homebrew', label: t.brew },
                          { id: 'App Store', label: t.appStore },
                          { id: 'RUNNING', label: t.running },
                        ].map((f) => (
                          <button
                            key={f.id}
                            onClick={() => setSourceFilter(f.id)}
                            className={`px-2 py-1 rounded-[6px] text-[11px] font-medium transition-all ${
                              sourceFilter === f.id
                                ? 'bg-[#48484a] text-white shadow-sm'
                                : 'text-[#8e8e93] hover:text-white'
                            }`}
                          >
                            {f.label}
                          </button>
                        ))}
                      </div>

                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as any)}
                        className="bg-[#1c1c1e] border border-white/[0.08] rounded-lg px-2 py-1 text-[11px] text-[#ebebf5] outline-none"
                      >
                        <option value="total">{t.sortTotal}</option>
                        <option value="leftovers">{t.sortLibrary}</option>
                        <option value="name">{t.sortName}</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto p-3">
                    {loadingApps ? (
                      <div className="h-56 flex items-center justify-center gap-2 text-xs text-[#8e8e93]">
                        <Loader2 className="w-4 h-4 animate-spin text-[#0A84FF]" />
                        <span>Scanning /Applications...</span>
                      </div>
                    ) : visibleApps.length === 0 ? (
                      <div className="h-56 flex items-center justify-center text-xs text-[#8e8e93]">
                        No matching applications.
                      </div>
                    ) : (
                      <div className="rounded-xl bg-[#1c1c1e] border border-white/[0.08] divide-y divide-white/[0.06] overflow-hidden shadow-sm">
                        {visibleApps.map((app) => {
                          const active = selectedApp?.path === app.path;
                          const checked = bulkPaths.has(app.path);
                          return (
                            <div
                              key={app.path}
                              onClick={() => inspectApplication(app)}
                              className={`px-3.5 py-2.5 flex items-center justify-between gap-3 cursor-pointer transition-colors ${
                                active
                                  ? 'bg-[#0A84FF]/20'
                                  : 'hover:bg-white/[0.04]'
                              }`}
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <button
                                  onClick={(e) => toggleBulkPath(app.path, e)}
                                  className="text-[#636366] hover:text-white shrink-0"
                                >
                                  {checked ? (
                                    <CheckSquare className="w-4 h-4 text-[#0A84FF]" />
                                  ) : (
                                    <Square className="w-4 h-4" />
                                  )}
                                </button>

                                <AppIcon path={app.path} name={app.name} size="md" />

                                <div className="min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="text-[13px] font-medium text-white truncate">
                                      {app.name}
                                    </span>
                                    {app.is_running && (
                                      <span
                                        className="w-2 h-2 rounded-full bg-[#30D158] shrink-0"
                                        title="Running"
                                      />
                                    )}
                                  </div>
                                  <div className="text-[11px] font-mono text-[#8e8e93] truncate">
                                    {app.bundle_id}
                                  </div>
                                </div>
                              </div>

                              <div className="text-right shrink-0 tabular-nums">
                                <div className="font-mono text-xs font-semibold text-white">
                                  {formatBytes(app.total_size_bytes)}
                                </div>
                                {app.leftovers_size_bytes > 0 ? (
                                  <div className="text-[10px] font-mono text-[#FF9F0A]">
                                    +{formatBytes(app.leftovers_size_bytes)} data
                                  </div>
                                ) : (
                                  <div className="text-[10px] font-mono text-[#8e8e93]">
                                    {app.architecture}
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Pane: Apple Grouped Deep Inspector */}
                <AppInspector
                  app={selectedApp}
                  scan={deepScan}
                  loading={loadingScan}
                  selectedPaths={selectedPaths}
                  onTogglePath={toggleSelectedPath}
                  onSetPaths={setSelectedPaths}
                  onKillProcess={(pid) => handleKillProcess(pid, true)}
                  onRequestReset={() => {
                    if (!selectedApp || !deepScan) return;
                    const supportItems = deepScan.items.filter(
                      (i) => i.category !== 'Application'
                    );
                    if (supportItems.length === 0) return;
                    const resetPaths = supportItems.map((i) => i.path);
                    const resetBytes = supportItems.reduce((s, i) => s + i.size_bytes, 0);
                    setSelectedPaths(new Set(resetPaths));
                    setConfirmState({
                      open: true,
                      title: `Reset ${selectedApp.name} to Factory Defaults`,
                      subtitle: `The ${selectedApp.name} application bundle will remain installed, while its ${supportItems.length} caches, preferences, and saved state files (${formatBytes(resetBytes)}) will be moved to Trash.`,
                      paths: resetPaths,
                      pidsToKill: deepScan.running_processes.map((p) => p.pid),
                      totalBytes: resetBytes,
                      permanent: false,
                      onSuccess: () => inspectApplication(selectedApp),
                    });
                  }}
                  onRequestUninstall={(permanent) => {
                    if (!selectedApp || !deepScan) return;
                    const bytes = deepScan.items
                      .filter((i) => selectedPaths.has(i.path))
                      .reduce((s, i) => s + i.size_bytes, 0);
                    setConfirmState({
                      open: true,
                      title: `${permanent ? 'Permanently Delete' : 'Uninstall'} ${selectedApp.name}`,
                      subtitle: permanent
                        ? `The selected ${selectedPaths.size} items will be permanently removed from disk.`
                        : `The selected ${selectedPaths.size} items will be moved to ~/.Trash.`,
                      paths: Array.from(selectedPaths),
                      pidsToKill: deepScan.running_processes.map((p) => p.pid),
                      totalBytes: bytes,
                      permanent,
                      onSuccess: () => refreshPrimaryData(),
                    });
                  }}
                />
              </div>
            )}

            {section === 'universal' && (
              <UniversalSlimmerView
                items={universalApps}
                loading={loadingUniversal}
                slimBusy={slimBusy}
                title={t.universalTitle}
                subtitle={t.universalSubtitle}
                actionLabel={t.slimSelected}
                onRefresh={fetchUniversalApps}
                onSlimSelected={handleSlimUniversalApps}
              />
            )}

            {section === 'history' && (
              <TrashHistoryView
                items={trashHistory}
                loading={loadingHistory}
                restoring={restoringTrash}
                title={t.trashHistoryTitle}
                subtitle={t.trashHistorySubtitle}
                actionLabel={t.putBackSelected}
                onRefresh={fetchTrashHistory}
                onRestoreSelected={handleRestoreTrashItems}
                onDeletePermanently={(paths, totalBytes) => {
                  setConfirmState({
                    open: true,
                    title: `Permanently Delete ${paths.length} Items from Trash`,
                    subtitle:
                      'Selected items in ~/.Trash will be permanently erased from your disk.',
                    paths,
                    pidsToKill: [],
                    totalBytes,
                    permanent: true,
                    onSuccess: () => fetchTrashHistory(),
                  });
                }}
              />
            )}

            {section === 'plugins' && (
              <PluginsView
                plugins={plugins}
                loading={loadingPlugins}
                kindFilter={pluginKind}
                onKindChange={setPluginKind}
                search={pluginSearch}
                onSearchChange={setPluginSearch}
                selectedPaths={selectedPlugins}
                onTogglePath={(path) => {
                  setSelectedPlugins((prev) => {
                    const next = new Set(prev);
                    if (next.has(path)) next.delete(path);
                    else next.add(path);
                    return next;
                  });
                }}
                onSetPaths={setSelectedPlugins}
                onRemoveSelected={() => {
                  const bytes = plugins
                    .filter((p) => selectedPlugins.has(p.path))
                    .reduce((s, p) => s + p.size_bytes, 0);
                  setConfirmState({
                    open: true,
                    title: `Remove ${selectedPlugins.size} Plug-Ins`,
                    subtitle:
                      'Selected audio units, plug-in bundles, or extensions will be moved to ~/.Trash.',
                    paths: Array.from(selectedPlugins),
                    pidsToKill: [],
                    totalBytes: bytes,
                    permanent: false,
                    onSuccess: () => fetchPlugins(),
                  });
                }}
              />
            )}

            {section === 'orphans' && (
              <OrphansView
                items={orphans}
                loading={loadingOrphans}
                categoryFilter={orphanCategory}
                onCategoryChange={setOrphanCategory}
                selectedPaths={selectedOrphans}
                onTogglePath={(path) => {
                  setSelectedOrphans((prev) => {
                    const next = new Set(prev);
                    if (next.has(path)) next.delete(path);
                    else next.add(path);
                    return next;
                  });
                }}
                onSetPaths={setSelectedOrphans}
                onCleanSelected={() => {
                  const bytes = orphans
                    .filter((o) => selectedOrphans.has(o.path))
                    .reduce((s, o) => s + o.size_bytes, 0);
                  setConfirmState({
                    open: true,
                    title: `Remove ${selectedOrphans.size} Orphaned Items`,
                    subtitle: 'Selected leftover folders and caches will be moved to the Trash.',
                    paths: Array.from(selectedOrphans),
                    pidsToKill: [],
                    totalBytes: bytes,
                    permanent: false,
                    onSuccess: () => fetchOrphans(),
                  });
                }}
              />
            )}

            {section === 'packages' && (
              <PackagesView
                packages={packages}
                loading={loadingPackages}
                managerFilter={pkgManager}
                onManagerChange={setPkgManager}
                search={pkgSearch}
                onSearchChange={setPkgSearch}
                onUninstall={handleUninstallPackage}
              />
            )}

            {section === 'large' && (
              <LargeFilesView
                files={largeFiles}
                loading={loadingLarge}
                selectedPaths={selectedLarge}
                onTogglePath={(path) => {
                  setSelectedLarge((prev) => {
                    const next = new Set(prev);
                    if (next.has(path)) next.delete(path);
                    else next.add(path);
                    return next;
                  });
                }}
                onSetPaths={setSelectedLarge}
                onRemoveSelected={() => {
                  const bytes = largeFiles
                    .filter((f) => selectedLarge.has(f.path))
                    .reduce((s, f) => s + f.size_bytes, 0);
                  setConfirmState({
                    open: true,
                    title: `Move ${selectedLarge.size} Large Files to Trash`,
                    subtitle: 'Selected files and installers will be moved to ~/.Trash.',
                    paths: Array.from(selectedLarge),
                    pidsToKill: [],
                    totalBytes: bytes,
                    permanent: false,
                    onSuccess: () => fetchLargeFiles(),
                  });
                }}
              />
            )}

            {section === 'duplicates' && (
              <DuplicatesView
                groups={duplicateGroups}
                loading={loadingDuplicates}
                selectedPaths={selectedDuplicates}
                onTogglePath={(path) => {
                  setSelectedDuplicates((prev) => {
                    const next = new Set(prev);
                    if (next.has(path)) next.delete(path);
                    else next.add(path);
                    return next;
                  });
                }}
                onSetPaths={setSelectedDuplicates}
                onCleanSelected={() => {
                  let bytes = 0;
                  for (const g of duplicateGroups) {
                    for (const f of g.files) {
                      if (selectedDuplicates.has(f.path)) {
                        bytes += g.file_size_bytes;
                      }
                    }
                  }
                  setConfirmState({
                    open: true,
                    title: `Move ${selectedDuplicates.size} Duplicate Files to Trash`,
                    subtitle:
                      'Selected duplicate copies will be moved to ~/.Trash while preserving your unselected original files.',
                    paths: Array.from(selectedDuplicates),
                    pidsToKill: [],
                    totalBytes: bytes,
                    permanent: false,
                    onSuccess: () => fetchDuplicates(),
                  });
                }}
              />
            )}

            {section === 'lens' && (
              <SpaceLensView
                snapshot={spaceLens}
                loading={loadingLens}
                onNavigateDir={(dir) => fetchSpaceLens(dir)}
                onRemoveEntry={(entry) => {
                  setConfirmState({
                    open: true,
                    title: `Move ${entry.name} to Trash`,
                    subtitle: `Path: ${entry.path}`,
                    paths: [entry.path],
                    pidsToKill: [],
                    totalBytes: entry.size_bytes,
                    permanent: false,
                    onSuccess: () => fetchSpaceLens(spaceLens?.current_path),
                  });
                }}
              />
            )}

            {section === 'storage' && (
              <StorageView
                apps={apps}
                onInspectApp={(app) => {
                  setSection('apps');
                  inspectApplication(app);
                }}
              />
            )}

            {section === 'protection' && (
              <ProtectionView
                snapshot={protection}
                loading={loadingProtection}
                selectedPrivacy={selectedPrivacy}
                onTogglePrivacy={(path) => {
                  setSelectedPrivacy((prev) => {
                    const next = new Set(prev);
                    if (next.has(path)) next.delete(path);
                    else next.add(path);
                    return next;
                  });
                }}
                onSetPrivacy={setSelectedPrivacy}
                onCleanPrivacy={(permanent) => {
                  if (!protection) return;
                  const bytes = protection.privacy_items
                    .filter((p) => selectedPrivacy.has(p.path))
                    .reduce((s, p) => s + p.size_bytes, 0);
                  setConfirmState({
                    open: true,
                    title: 'Erase Privacy Traces & Trash',
                    subtitle:
                      'Selected local history files, saved states, or Trash contents will be permanently deleted.',
                    paths: Array.from(selectedPrivacy),
                    pidsToKill: [],
                    totalBytes: bytes,
                    permanent,
                    onSuccess: () => fetchProtection(),
                  });
                }}
                onRemoveFlaggedAgent={(agent) => {
                  setConfirmState({
                    open: true,
                    title: `Remove ${agent.label}`,
                    subtitle: `The launchd plist (${agent.plist_path}) will be moved to ~/.Trash.`,
                    paths: [agent.plist_path],
                    pidsToKill: agent.pid ? [agent.pid] : [],
                    totalBytes: 4096,
                    permanent: false,
                    onSuccess: () => fetchProtection(),
                  });
                }}
              />
            )}

            {section === 'shredder' && (
              <ShredderView
                largeFiles={largeFiles}
                trashItems={trashHistory}
                busy={shredBusy}
                externalCustomPaths={droppedShredderPaths}
                onShredPaths={handleShredPaths}
              />
            )}

            {section === 'ai_vault' && (
              <AiVaultView
                items={aiModels}
                loading={loadingAi}
                onCleanPaths={(paths, totalBytes) =>
                  setConfirmState({
                    open: true,
                    title: `Clean ${paths.length} AI Model / Cache Items`,
                    subtitle:
                      'Selected local AI weights and assistant caches will be moved to ~/.Trash (restorable via Trash & Put Back).',
                    paths,
                    pidsToKill: [],
                    totalBytes,
                    permanent: false,
                    onSuccess: () => fetchAiVault(),
                  })
                }
              />
            )}

            {section === 'ghost_space' && (
              <GhostSpaceView
                items={ghostSpace}
                loading={loadingGhost}
                onCleanPaths={(paths, totalBytes) =>
                  setConfirmState({
                    open: true,
                    title: `Reclaim ${paths.length} Ghost Space Targets`,
                    subtitle:
                      'Selected trapped virtual disks, device backups, or Xcode caches will be moved to ~/.Trash.',
                    paths,
                    pidsToKill: [],
                    totalBytes,
                    permanent: false,
                    onSuccess: () => fetchGhostSpace(),
                  })
                }
              />
            )}

            {section === 'telemetry' && (
              <TelemetryView
                items={telemetryItems}
                loading={loadingTelemetry}
                onCleanPaths={(paths, totalBytes) =>
                  setConfirmState({
                    open: true,
                    title: `Purge ${paths.length} Telemetry & Crash Queues`,
                    subtitle:
                      'Selected Crashpad databases, Sentry dumps, and diagnostic reports will be moved to ~/.Trash.',
                    paths,
                    pidsToKill: [],
                    totalBytes,
                    permanent: false,
                    onSuccess: () => fetchTelemetry(),
                  })
                }
              />
            )}

            {section === 'time_capsule' && (
              <TimeCapsuleView
                capsules={capsules}
                apps={apps}
                loading={loadingCapsules}
                onCreateCapsule={handleCreateCapsule}
                onRestoreCapsule={handleRestoreCapsule}
              />
            )}

            {section === 'maintenance' && (
              <MaintenanceView
                snapshot={perfSnapshot}
                caches={devCaches}
                loading={loadingMaintenance}
                selectedCaches={selectedCaches}
                onToggleCache={(path) => {
                  setSelectedCaches((prev) => {
                    const next = new Set(prev);
                    if (next.has(path)) next.delete(path);
                    else next.add(path);
                    return next;
                  });
                }}
                onSetCaches={setSelectedCaches}
                onPurgeCaches={() => {
                  const bytes = devCaches
                    .filter((c) => selectedCaches.has(c.path))
                    .reduce((s, c) => s + c.size_bytes, 0);
                  setConfirmState({
                    open: true,
                    title: `Purge ${selectedCaches.size} Cache Directories`,
                    subtitle:
                      'Selected developer, package manager, and browser caches will be moved to ~/.Trash.',
                    paths: Array.from(selectedCaches),
                    pidsToKill: [],
                    totalBytes: bytes,
                    permanent: false,
                    onSuccess: () => fetchMaintenance(),
                  });
                }}
                onRunTask={handleRunMaintenanceTask}
                onKillProcess={handleKillProcess}
              />
            )}

            {section === 'startup' && (
              <StartupView
                items={startupItems}
                loading={loadingStartup}
                scopeFilter={startupScope}
                onScopeChange={setStartupScope}
                search={startupSearch}
                onSearchChange={setStartupSearch}
                onToggleItem={handleToggleStartup}
                onDeleteItem={(item) =>
                  setConfirmState({
                    open: true,
                    title: `Remove ${item.label}`,
                    subtitle: `The launchd configuration file (${item.plist_path}) will be moved to the Trash.`,
                    paths: [item.plist_path],
                    pidsToKill: item.pid ? [item.pid] : [],
                    totalBytes: 4096,
                    permanent: false,
                    onSuccess: () => fetchStartup(),
                  })
                }
              />
            )}
          </main>
        </div>
      </div>

      {/* Bottom Status Bar */}
      <footer className="h-7 border-t border-white/[0.07] bg-[#1c1c1e] px-4 flex items-center justify-between text-[11px] text-[#8e8e93] shrink-0">
        <div className="flex items-center gap-2 truncate">
          <span className="w-1.5 h-1.5 rounded-full bg-[#30D158]" />
          <span className="truncate">{statusMessage}</span>
        </div>

        <div className="flex items-center gap-4 font-mono tabular-nums shrink-0">
          <span>
            {t.reclaimableCaches}{' '}
            <strong className="text-[#FF9F0A] font-medium">
              {formatBytes(totalSupportBytes + totalDevCachesBytes)}
            </strong>
          </span>
          <span>
            {apps.length} {t.applicationsCount}
          </span>
        </div>
      </footer>

      <ConfirmDialog
        state={confirmState}
        busy={busyUninstall}
        onCancel={() => setConfirmState(null)}
        onConfirm={executeConfirmedUninstall}
      />

      <UpdateModal
        isOpen={showUpdateModal}
        onClose={() => setShowUpdateModal(false)}
        osName={overview ? `${overview.os_name} (${overview.architecture})` : 'macOS'}
        onUpdateStatusChange={(hasUpd, ver) => {
          setHasUpdateAvailable(hasUpd);
          setLatestReleaseVersion(ver);
        }}
      />

      <BugReportModal
        isOpen={showBugModal}
        onClose={() => setShowBugModal(false)}
        overview={overview}
        perfSnapshot={perfSnapshot}
      />

      <CommandPaletteModal
        isOpen={showCommandPalette}
        onClose={() => setShowCommandPalette(false)}
        apps={apps}
        onSelectSection={(sec) => setSection(sec)}
        onInspectApp={(app) => inspectApplication(app)}
      />
    </div>
  );
}
