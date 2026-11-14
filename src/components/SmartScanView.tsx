import React from 'react';
import { Loader2, Play, ShieldCheck, HardDrive, Activity, ArrowRight } from 'lucide-react';
import { formatBytes } from '../bridge';
import type { SmartScanReport } from '../types';

interface Props {
  report: SmartScanReport | null;
  loading: boolean;
  onRunScan: () => void;
  onCleanAll: (paths: string[], totalBytes: number) => void;
  onNavigate: (section: any) => void;
}

export function SmartScanView({
  report,
  loading,
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
      <div className="px-6 py-4 border-b border-white/[0.07] bg-[#161618] flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-white">Smart Care Overview</h2>
          <p className="text-xs text-[#8e8e93] mt-0.5">
            Unified diagnostic across system caches, orphaned files, unused installers, security controls, and launchd services.
          </p>
        </div>

        <button
          disabled={loading}
          onClick={onRunScan}
          className="px-3.5 py-1.5 rounded-lg bg-[#2c2c2e] hover:bg-[#3a3a3c] border border-white/[0.08] text-xs font-medium text-white flex items-center gap-1.5 transition-colors"
        >
          {loading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin text-[#0A84FF]" />
          ) : (
            <Play className="w-3 h-3 text-[#0A84FF]" />
          )}
          <span>{loading ? 'Scanning System...' : 'Rescan System'}</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-5">
        {loading || !report ? (
          <div className="h-72 flex flex-col items-center justify-center gap-2.5 text-xs text-[#8e8e93]">
            <Loader2 className="w-5 h-5 animate-spin text-[#0A84FF]" />
            <span>Running Smart Care analysis across storage, security controls, and services...</span>
          </div>
        ) : (
          <>
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
                      Core macOS security controls enabled
                    </div>
                  </div>

                  <div className="pt-3 border-t border-white/[0.06] space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[#8e8e93]">Flagged Launchd Items</span>
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
                      Performance
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
                      <span className="text-[#8e8e93]">Active Launchd Services</span>
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
                  <span>Manage background services</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Action Banner */}
            <div className="rounded-xl bg-[#1c1c1e] border border-white/[0.08] p-5 flex items-center justify-between gap-4 shadow-sm">
              <div>
                <h3 className="text-sm font-semibold text-white">
                  One-Click System Cleanup
                </h3>
                <p className="text-xs text-[#8e8e93] mt-0.5">
                  Moves all detected developer caches, orphaned support folders, and unused installer disk images ({allCleanPaths.length} items) to ~/.Trash.
                </p>
              </div>

              <button
                disabled={allCleanPaths.length === 0}
                onClick={() => onCleanAll(allCleanPaths, report.total_reclaimable_bytes)}
                className="px-4 py-2 rounded-lg bg-[#0A84FF] hover:bg-[#0070E0] disabled:opacity-40 text-xs font-semibold text-white shrink-0 shadow-sm transition-colors"
              >
                Clean {formatBytes(report.total_reclaimable_bytes)}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
