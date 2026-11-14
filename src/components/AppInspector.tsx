import { useMemo } from 'react';
import { FolderOpen, Square, CheckSquare, Loader2 } from 'lucide-react';
import { ZeroTrashAPI, formatBytes } from '../bridge';
import type { InstalledApp, AppDeepScanResult, LeftoverItem } from '../types';
import { AppIcon } from './AppIcon';

interface Props {
  app: InstalledApp | null;
  scan: AppDeepScanResult | null;
  loading: boolean;
  selectedPaths: Set<string>;
  onTogglePath: (path: string) => void;
  onSetPaths: (paths: Set<string>) => void;
  onKillProcess: (pid: number) => void;
  onRequestUninstall: (permanent: boolean) => void;
  onRequestReset?: () => void;
}

export function AppInspector({
  app,
  scan,
  loading,
  selectedPaths,
  onTogglePath,
  onSetPaths,
  onKillProcess,
  onRequestUninstall,
  onRequestReset,
}: Props) {
  const groupedItems = useMemo(() => {
    if (!scan) return [];
    const groups: Record<string, LeftoverItem[]> = {
      'Application Bundle': [],
      'Caches & Temporary Data': [],
      'Application Support & Containers': [],
      'Preferences, Agents & Receipts': [],
    };
    for (const item of scan.items) {
      if (item.category === 'Application') {
        groups['Application Bundle'].push(item);
      } else if (
        item.category.includes('Cache') ||
        item.category.includes('Log') ||
        item.category.includes('WebKit') ||
        item.category.includes('HTTP') ||
        item.category.includes('Saved State')
      ) {
        groups['Caches & Temporary Data'].push(item);
      } else if (
        item.category.includes('Support') ||
        item.category.includes('Container')
      ) {
        groups['Application Support & Containers'].push(item);
      } else {
        groups['Preferences, Agents & Receipts'].push(item);
      }
    }
    return Object.entries(groups).filter(([, list]) => list.length > 0);
  }, [scan]);

  if (!app) {
    return (
      <div className="flex-1 flex items-center justify-center text-xs text-[#8e8e93] bg-[#141416]">
        Select an application from the list to inspect its bundle and associated files.
      </div>
    );
  }

  const appBytes = scan ? scan.app.app_size_bytes : app.app_size_bytes;
  const supportBytes = scan ? scan.app.leftovers_size_bytes : app.leftovers_size_bytes;
  const totalBytes = Math.max(1, appBytes + supportBytes);
  const appPct = Math.max(4, Math.round((appBytes / totalBytes) * 100));
  const supportPct = Math.max(0, 100 - appPct);

  const selectedBytes = scan
    ? scan.items
        .filter((i) => selectedPaths.has(i.path))
        .reduce((sum, i) => sum + i.size_bytes, 0)
    : 0;

  return (
    <div className="flex-1 flex flex-col bg-[#141416] overflow-hidden relative">
      <div className="flex-1 overflow-y-auto p-4 pb-24 space-y-4">
        {/* Top Apple Sequoia Hero Card */}
        <div className="rounded-xl bg-[#1c1c1e] border border-white/[0.08] p-4 shadow-sm space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3.5 min-w-0">
              <AppIcon path={app.path} name={app.name} size="lg" />
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-base font-semibold text-white truncate">
                    {app.name}
                  </h2>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-[#2c2c2e] text-[#ebebf5]/80">
                    v{app.version}
                  </span>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-[#0A84FF]/15 text-[#0A84FF] border border-[#0A84FF]/30">
                    {app.architecture}
                  </span>
                </div>
                <div className="text-xs font-mono text-[#8e8e93] truncate mt-1">
                  {app.bundle_id}
                </div>
                <div className="text-[11px] text-[#8e8e93]/80 truncate mt-0.5">
                  {app.path}
                </div>
              </div>
            </div>

            <button
              onClick={() => ZeroTrashAPI.revealInFileManager(app.path)}
              className="px-3 py-1.5 rounded-lg bg-[#2c2c2e] hover:bg-[#3a3a3c] border border-white/[0.08] text-xs font-medium text-white flex items-center gap-1.5 shrink-0 transition-colors"
            >
              <FolderOpen className="w-3.5 h-3.5 text-[#0A84FF]" />
              <span>Show in Finder</span>
            </button>
          </div>

          {/* Footprint Distribution Bar */}
          <div className="pt-3 border-t border-white/[0.06] space-y-2">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5 text-[#ebebf5]/90">
                  <span className="w-2 h-2 rounded-full bg-[#0A84FF]" />
                  <span>App Bundle:</span>
                  <span className="font-mono font-medium text-white tabular-nums">
                    {formatBytes(appBytes)}
                  </span>
                </span>
                <span className="flex items-center gap-1.5 text-[#ebebf5]/90">
                  <span className="w-2 h-2 rounded-full bg-[#FF9F0A]" />
                  <span>Library Data:</span>
                  <span className="font-mono font-medium text-white tabular-nums">
                    {formatBytes(supportBytes)}
                  </span>
                </span>
              </div>
              <span className="font-mono text-xs font-semibold text-white tabular-nums">
                Total: {formatBytes(appBytes + supportBytes)}
              </span>
            </div>

            <div className="w-full h-2 bg-[#2c2c2e] rounded-full overflow-hidden flex gap-[1px]">
              <div
                className="h-full bg-[#0A84FF]"
                style={{ width: `${appPct}%` }}
              />
              {supportBytes > 0 && (
                <div
                  className="h-full bg-[#FF9F0A]"
                  style={{ width: `${supportPct}%` }}
                />
              )}
            </div>
          </div>

          {scan && scan.running_processes.length > 0 && (
            <div className="px-3.5 py-2.5 rounded-lg bg-[#FF9F0A]/10 border border-[#FF9F0A]/30 flex items-center justify-between gap-3">
              <div className="text-xs text-[#FF9F0A] flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#FF9F0A] animate-pulse" />
                <span>
                  Active process running (
                  {scan.running_processes.map((p) => `PID ${p.pid}`).join(', ')})
                </span>
              </div>
              <button
                onClick={() => scan.running_processes.forEach((p) => onKillProcess(p.pid))}
                className="px-2.5 py-1 rounded-md bg-[#FF9F0A]/20 hover:bg-[#FF9F0A]/30 text-[11px] text-white font-medium transition-colors"
              >
                Quit Process
              </button>
            </div>
          )}
        </div>

        {/* Grouped File Cards */}
        {loading ? (
          <div className="rounded-xl bg-[#1c1c1e] border border-white/[0.08] h-48 flex items-center justify-center gap-2 text-xs text-[#8e8e93]">
            <Loader2 className="w-4 h-4 animate-spin text-[#0A84FF]" />
            <span>Scanning Library containers, caches, preferences, and receipts...</span>
          </div>
        ) : (
          groupedItems.map(([groupTitle, items]) => {
            const groupBytes = items.reduce((s, i) => s + i.size_bytes, 0);
            return (
              <div key={groupTitle} className="space-y-1.5">
                <div className="px-1 flex items-center justify-between text-[11px] font-medium text-[#8e8e93]">
                  <span>
                    {groupTitle} ({items.length})
                  </span>
                  <span className="font-mono tabular-nums">{formatBytes(groupBytes)}</span>
                </div>

                <div className="rounded-xl bg-[#1c1c1e] border border-white/[0.08] divide-y divide-white/[0.06] overflow-hidden shadow-sm">
                  {items.map((item) => {
                    const isChecked = selectedPaths.has(item.path);
                    return (
                      <div
                        key={item.path}
                        onClick={() => onTogglePath(item.path)}
                        className={`px-3.5 py-2.5 flex items-center justify-between gap-3 cursor-pointer transition-colors ${
                          isChecked
                            ? 'hover:bg-white/[0.04]'
                            : 'opacity-50 hover:opacity-80'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          {isChecked ? (
                            <CheckSquare className="w-4 h-4 text-[#0A84FF] shrink-0" />
                          ) : (
                            <Square className="w-4 h-4 text-[#636366] shrink-0" />
                          )}
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-medium text-white truncate">
                                {item.name}
                              </span>
                              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#2c2c2e] text-[#ebebf5]/70">
                                {item.category}
                              </span>
                            </div>
                            <div className="text-[11px] font-mono text-[#8e8e93] truncate mt-0.5">
                              {item.path}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2.5 shrink-0">
                          <span className="font-mono text-xs text-[#ebebf5] tabular-nums">
                            {formatBytes(item.size_bytes)}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              ZeroTrashAPI.revealInFileManager(item.path);
                            }}
                            className="p-1 rounded-md hover:bg-[#2c2c2e] text-[#8e8e93] hover:text-white transition-colors"
                            title="Reveal in Finder"
                          >
                            <FolderOpen className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Sensei / CleanMyMac Floating Bottom Action Bar */}
      {scan && (
        <div className="absolute bottom-3 left-4 right-4 rounded-2xl bg-[#242426]/95 backdrop-blur-xl border border-white/[0.12] shadow-2xl px-4 py-2.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 text-xs">
            <button
              onClick={() => onSetPaths(new Set(scan.items.map((i) => i.path)))}
              className="text-[#0A84FF] hover:underline font-medium"
            >
              All ({scan.items.length})
            </button>
            <span className="text-[#636366]">·</span>
            <button
              onClick={() => onSetPaths(new Set(scan.items.slice(1).map((i) => i.path)))}
              className="text-[#FF9F0A] hover:underline font-medium"
              title="Keep the .app bundle and remove only caches, preferences, and support files"
            >
              Reset App Data Only
            </button>
            <span className="text-[#636366]">·</span>
            <button
              onClick={() => onSetPaths(new Set())}
              className="text-[#8e8e93] hover:text-white"
            >
              None
            </button>
          </div>

          <div className="flex items-center gap-2">
            {onRequestReset && scan.items.length > 1 && (
              <button
                onClick={onRequestReset}
                className="px-3 py-1.5 rounded-lg bg-[#FF9F0A]/15 hover:bg-[#FF9F0A]/25 border border-[#FF9F0A]/40 text-xs font-semibold text-[#FF9F0A] transition-colors"
                title="Keep the application installed and reset all its caches, settings, and state to factory defaults"
              >
                Reset App ({formatBytes(supportBytes)})
              </button>
            )}
            <button
              disabled={selectedPaths.size === 0}
              onClick={() => onRequestUninstall(true)}
              className="px-3 py-1.5 rounded-lg bg-[#2c2c2e] hover:bg-[#FF453A]/20 hover:text-[#FF453A] hover:border-[#FF453A]/40 disabled:opacity-40 border border-white/[0.08] text-xs font-medium text-[#ebebf5] transition-colors"
            >
              Delete Permanently
            </button>
            <button
              disabled={selectedPaths.size === 0}
              onClick={() => onRequestUninstall(false)}
              className="px-4 py-1.5 rounded-lg bg-[#0A84FF] hover:bg-[#0070E0] disabled:opacity-40 text-xs font-semibold text-white shadow-sm transition-colors"
            >
              Move to Trash ({formatBytes(selectedBytes)})
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
