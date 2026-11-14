import {
  Loader2,
  Play,
  ShieldCheck,
  HardDrive,
  Activity,
  ArrowRight,
  AppWindow,
  FileSearch,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { formatBytes } from '../bridge';
import type { SmartScanReport } from '../types';

interface Props {
  report: SmartScanReport | null;
  loading: boolean;
  appsCount?: number;
  orphansCount?: number;
  onRunScan: () => void;
  onCleanAll: (paths: string[], totalBytes: number) => void;
  onNavigate: (section: any) => void;
}

export function SmartScanView({
  report,
  loading,
  appsCount = 0,
  orphansCount = 0,
  onRunScan,
  onCleanAll,
  onNavigate,
}: Props) {
  const allCleanPaths = report
    ? [
        ...report.junk_paths,
        ...report.orphan_paths,
        ...report.installer_paths,
      ]
    : [];

  const unhealthyCount = report
    ? Math.max(0, report.security_controls_total - report.security_controls_healthy)
    : 0;

  return (
    <div className="flex-1 flex flex-col bg-[#141416] overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-white/[0.07] bg-[#161618] flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-white">
              Smart Care & Quick Start
            </h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#30D158]/15 text-[#30D158] border border-[#30D158]/30 flex items-center gap-1">
              <RotateCcw className="w-2.5 h-2.5" />
              100% Undoable via Trash
            </span>
          </div>
          <p className="text-xs text-[#8e8e93] mt-0.5">
            One-click system checkup or jump straight to what you want to clean today.
          </p>
        </div>

        <button
          disabled={loading}
          onClick={onRunScan}
          className="px-4 py-2 rounded-xl bg-[#0A84FF] hover:bg-[#0070E0] text-xs font-semibold text-white flex items-center gap-2 shadow-lg shadow-[#0A84FF]/20 transition-all"
        >
          {loading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
          ) : (
            <Play className="w-3.5 h-3.5 text-white fill-white" />
          )}
          <span>{loading ? 'Scanning System...' : 'Run 1-Click Smart Scan'}</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-5">
        {/* 3 Easy Quick-Start Cards for Everyday Users */}
        <div>
          <div className="text-[11px] font-semibold text-[#8e8e93] uppercase tracking-wider mb-2.5">
            What would you like to do?
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            <button
              onClick={() => onNavigate('apps')}
              className="text-left p-4 rounded-xl bg-[#1c1c1e] hover:bg-[#242426] border border-white/[0.08] hover:border-[#0A84FF]/50 transition-all group flex flex-col justify-between gap-3"
            >
              <div className="flex items-center justify-between">
                <div className="w-9 h-9 rounded-xl bg-[#0A84FF]/15 border border-[#0A84FF]/30 flex items-center justify-center">
                  <AppWindow className="w-4 h-4 text-[#0A84FF]" />
                </div>
                <ArrowRight className="w-4 h-4 text-[#8e8e93] group-hover:text-white group-hover:translate-x-0.5 transition-all" />
              </div>
              <div>
                <div className="text-xs font-semibold text-white">
                  1. Uninstall or Reset an App
                </div>
                <div className="text-[11px] text-[#8e8e93] mt-1 leading-relaxed">
                  Remove any app together with all hidden Library leftovers ({appsCount} apps indexed).
                </div>
              </div>
            </button>

            <button
              onClick={() => onNavigate('large')}
              className="text-left p-4 rounded-xl bg-[#1c1c1e] hover:bg-[#242426] border border-white/[0.08] hover:border-[#FF9F0A]/50 transition-all group flex flex-col justify-between gap-3"
            >
              <div className="flex items-center justify-between">
                <div className="w-9 h-9 rounded-xl bg-[#FF9F0A]/15 border border-[#FF9F0A]/30 flex items-center justify-center">
                  <FileSearch className="w-4 h-4 text-[#FF9F0A]" />
                </div>
                <ArrowRight className="w-4 h-4 text-[#8e8e93] group-hover:text-white group-hover:translate-x-0.5 transition-all" />
              </div>
              <div>
                <div className="text-xs font-semibold text-white">
                  2. Find Large & Duplicate Files
                </div>
                <div className="text-[11px] text-[#8e8e93] mt-1 leading-relaxed">
                  Locate forgotten installers, movies, and identical duplicate files wasting disk space.
                </div>
              </div>
            </button>

            <button
              onClick={() => onNavigate('orphans')}
              className="text-left p-4 rounded-xl bg-[#1c1c1e] hover:bg-[#242426] border border-white/[0.08] hover:border-[#BF5AF2]/50 transition-all group flex flex-col justify-between gap-3"
            >
              <div className="flex items-center justify-between">
                <div className="w-9 h-9 rounded-xl bg-[#BF5AF2]/15 border border-[#BF5AF2]/30 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-[#BF5AF2]" />
                </div>
                <ArrowRight className="w-4 h-4 text-[#8e8e93] group-hover:text-white group-hover:translate-x-0.5 transition-all" />
              </div>
              <div>
                <div className="text-xs font-semibold text-white">
                  3. Clean Leftover Junk ({orphansCount})
                </div>
                <div className="text-[11px] text-[#8e8e93] mt-1 leading-relaxed">
                  Sweep orphaned folders left behind by apps you deleted in the past.
                </div>
              </div>
            </button>
          </div>
        </div>

        {loading || !report ? (
          <div className="h-56 rounded-2xl bg-[#1c1c1e]/60 border border-white/[0.07] flex flex-col items-center justify-center gap-3 text-xs text-[#8e8e93]">
            <Loader2 className="w-6 h-6 animate-spin text-[#0A84FF]" />
            <span>Running Smart Care analysis across storage, security controls, and services...</span>
          </div>
        ) : (
          <>
            {/* Action Banner */}
            <div className="rounded-xl bg-gradient-to-r from-[#0A84FF]/15 via-[#1c1c1e] to-[#1c1c1e] border border-[#0A84FF]/35 p-5 flex items-center justify-between gap-4 shadow-sm">
              <div>
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <span>One-Click System Cleanup Ready</span>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-[#0A84FF]/20 text-[#64D2FF]">
                    {allCleanPaths.length} items found
                  </span>
                </h3>
                <p className="text-xs text-[#8e8e93] mt-1">
                  Safely moves all detected developer caches, orphaned support folders, and unused installer disk images to ~/.Trash (can be restored anytime from Trash & Put Back).
                </p>
              </div>

              <button
                disabled={allCleanPaths.length === 0}
                onClick={() => onCleanAll(allCleanPaths, report.total_reclaimable_bytes)}
                className="px-5 py-2.5 rounded-xl bg-[#0A84FF] hover:bg-[#0070E0] disabled:opacity-40 text-xs font-semibold text-white shrink-0 shadow-lg shadow-[#0A84FF]/25 transition-colors"
              >
                Clean {formatBytes(report.total_reclaimable_bytes)}
              </button>
            </div>

            {/* Three Pillar Cards: Cleanup / Protection / Speed */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* 1. Cleanup */}
              <div className="rounded-xl bg-[#1c1c1e] border border-white/[0.08] p-5 flex flex-col justify-between space-y-4 shadow-sm">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-[#8e8e93] uppercase tracking-wider">
                      Cleanup
                    </span>
                    <HardDrive className="w-4 h-4 text-[#0A84FF]" />
                  </div>
                  <div>
                    <div className="text-2xl font-mono font-semibold text-white tabular-nums">
                      {formatBytes(report.total_reclaimable_bytes)}
                    </div>
                    <div className="text-xs text-[#8e8e93] mt-0.5">
                      Safe to remove across {allCleanPaths.length} locations
                    </div>
                  </div>

                  <div className="pt-3 border-t border-white/[0.06] space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[#8e8e93]">Developer & App Caches</span>
                      <span className="font-mono text-white tabular-nums">
                        {formatBytes(report.junk_bytes)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#8e8e93]">Orphaned App Leftovers</span>
                      <span className="font-mono text-white tabular-nums">
                        {formatBytes(report.orphan_bytes)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#8e8e93]">Unused DMG / PKG Installers</span>
                      <span className="font-mono text-white tabular-nums">
                        {formatBytes(report.installer_bytes)}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => onNavigate('maintenance')}
                  className="text-xs text-[#0A84FF] hover:underline flex items-center gap-1 pt-2 font-medium"
                >
                  <span>Inspect cache breakdown</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>

              {/* 2. Protection */}
              <div className="rounded-xl bg-[#1c1c1e] border border-white/[0.08] p-5 flex flex-col justify-between space-y-4 shadow-sm">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-[#8e8e93] uppercase tracking-wider">
                      Protection & Privacy
                    </span>
                    <ShieldCheck className="w-4 h-4 text-[#30D158]" />
                  </div>
                  <div>
                    <div className="text-2xl font-mono font-semibold text-white tabular-nums">
                      {report.security_controls_healthy} / {report.security_controls_total}
                    </div>
                    <div className="text-xs text-[#8e8e93] mt-0.5">
                      Core OS security controls enabled
                    </div>
                  </div>

                  <div className="pt-3 border-t border-white/[0.06] space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[#8e8e93]">Flagged Startup Items</span>
                      <span
                        className={`font-mono tabular-nums ${
                          report.flagged_agents_count > 0 ? 'text-[#FF9F0A]' : 'text-[#30D158]'
                        }`}
                      >
                        {report.flagged_agents_count}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#8e8e93]">Security Posture</span>
                      <span
                        className={`font-mono ${
                          unhealthyCount === 0 ? 'text-[#30D158]' : 'text-[#FF9F0A]'
                        }`}
                      >
                        {unhealthyCount === 0
                          ? 'All Verified'
                          : `${unhealthyCount} Control Disabled`}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => onNavigate('protection')}
                  className="text-xs text-[#0A84FF] hover:underline flex items-center gap-1 pt-2 font-medium"
                >
                  <span>Open Protection & Privacy</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>

              {/* 3. Performance */}
              <div className="rounded-xl bg-[#1c1c1e] border border-white/[0.08] p-5 flex flex-col justify-between space-y-4 shadow-sm">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-[#8e8e93] uppercase tracking-wider">
                      Performance & Boot
                    </span>
                    <Activity className="w-4 h-4 text-[#FF9F0A]" />
                  </div>
                  <div>
                    <div className="text-2xl font-mono font-semibold text-white tabular-nums">
                      {report.memory_pressure}
                    </div>
                    <div className="text-xs text-[#8e8e93] mt-0.5">
                      System memory availability
                    </div>
                  </div>

                  <div className="pt-3 border-t border-white/[0.06] space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[#8e8e93]">Load Average</span>
                      <span className="font-mono text-white tabular-nums">
                        {report.load_average}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#8e8e93]">Active Startup Services</span>
                      <span className="font-mono text-white tabular-nums">
                        {report.active_agents_count} running
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => onNavigate('startup')}
                  className="text-xs text-[#0A84FF] hover:underline flex items-center gap-1 pt-2 font-medium"
                >
                  <span>Manage startup services</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
