import { useState } from 'react';
import {
  Play,
  FolderOpen,
  CheckSquare,
  Square,
  Loader2,
  Check,
} from 'lucide-react';
import { ZeroTrashAPI, formatBytes } from '../bridge';
import type {
  PerformanceSnapshot,
  CacheTarget,
  MaintenanceResult,
} from '../types';

interface Props {
  snapshot: PerformanceSnapshot | null;
  caches: CacheTarget[];
  loading: boolean;
  selectedCaches: Set<string>;
  onToggleCache: (path: string) => void;
  onSetCaches: (paths: Set<string>) => void;
  onPurgeCaches: () => void;
  onRunTask: (taskId: string) => Promise<MaintenanceResult | null>;
  onKillProcess: (pid: number, force: boolean) => void;
}

type SubView = 'caches' | 'tasks' | 'processes';

export function MaintenanceView({
  snapshot,
  caches,
  loading,
  selectedCaches,
  onToggleCache,
  onSetCaches,
  onPurgeCaches,
  onRunTask,
  onKillProcess,
}: Props) {
  const [subView, setSubView] = useState<SubView>('caches');
  const [runningTaskId, setRunningTaskId] = useState<string | null>(null);
  const [taskOutputs, setTaskOutputs] = useState<Record<string, MaintenanceResult>>({});

  const selectedCacheBytes = caches
    .filter((c) => selectedCaches.has(c.path))
    .reduce((sum, c) => sum + c.size_bytes, 0);

  const totalCacheBytes = caches.reduce((sum, c) => sum + c.size_bytes, 0);

  async function handleExecuteTask(id: string) {
    setRunningTaskId(id);
    try {
      const res = await onRunTask(id);
      if (res) {
        setTaskOutputs((prev) => ({ ...prev, [id]: res }));
      }
    } finally {
      setRunningTaskId(null);
    }
  }

  return (
    <div className="flex-1 flex flex-col bg-[#141416] overflow-hidden">
      {/* Top Telemetry Strip */}
      <div className="px-5 py-3.5 border-b border-white/[0.07] bg-[#161618] space-y-3">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-sm font-semibold text-white">
              Performance & System Maintenance
            </h2>
            <p className="text-xs text-[#8e8e93] mt-0.5">
              Developer cache scrubber, macOS system maintenance routines, and live process monitor.
            </p>
          </div>

          <div className="flex items-center gap-0.5 bg-[#2c2c2e] p-0.5 rounded-[8px]">
            {[
              { id: 'caches', label: `Developer & App Caches (${formatBytes(totalCacheBytes)})` },
              { id: 'tasks', label: 'Maintenance Tasks' },
              { id: 'processes', label: 'Resource Monitor' },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setSubView(t.id as SubView)}
                className={`px-2.5 py-1 rounded-[6px] text-[11px] font-medium transition-all ${
                  subView === t.id
                    ? 'bg-[#48484a] text-white shadow-sm'
                    : 'text-[#8e8e93] hover:text-white'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {snapshot && (
          <div className="space-y-2.5 pt-2.5 border-t border-white/[0.06] text-xs">
            <div className="grid grid-cols-5 gap-3">
              <div className="p-2.5 rounded-lg bg-[#1c1c1e] border border-white/[0.06]">
                <div className="text-[10px] text-[#8e8e93] uppercase tracking-wider">
                  Processor ({snapshot.cpu_cores} Cores)
                </div>
                <div className="font-mono text-white font-medium mt-0.5 truncate">
                  {snapshot.cpu_brand} · Load {snapshot.load_average}
                </div>
              </div>
              <div className="p-2.5 rounded-lg bg-[#1c1c1e] border border-white/[0.06]">
                <div className="text-[10px] text-[#8e8e93] uppercase tracking-wider">
                  Unified Memory (RAM)
                </div>
                <div className="font-mono text-white font-medium tabular-nums mt-0.5">
                  {formatBytes(snapshot.ram_used_bytes)} / {formatBytes(snapshot.ram_total_bytes)}
                </div>
                <div className="text-[10px] text-[#8e8e93] mt-0.5">
                  Wired: {formatBytes(snapshot.ram_wired_bytes)} · Comp: {formatBytes(snapshot.ram_compressed_bytes)}
                </div>
              </div>
              <div className="p-2.5 rounded-lg bg-[#1c1c1e] border border-white/[0.06]">
                <div className="text-[10px] text-[#8e8e93] uppercase tracking-wider">
                  Memory Pressure & Swap
                </div>
                <div className="font-mono text-[#30D158] font-medium mt-0.5">
                  {snapshot.memory_pressure} · Swap {snapshot.swap_used}
                </div>
              </div>
              <div className="p-2.5 rounded-lg bg-[#1c1c1e] border border-white/[0.06]">
                <div className="text-[10px] text-[#8e8e93] uppercase tracking-wider">
                  Battery Charge & Cycles
                </div>
                <div className="font-mono text-white font-medium tabular-nums mt-0.5">
                  {snapshot.battery_present
                    ? `${snapshot.battery_percent}% (${snapshot.battery_charging ? 'Charging' : 'On Battery'}) · ${snapshot.battery_cycle_count} cycles`
                    : 'AC Power (Desktop)'}
                </div>
              </div>
              <div className="p-2.5 rounded-lg bg-[#1c1c1e] border border-white/[0.06]">
                <div className="text-[10px] text-[#8e8e93] uppercase tracking-wider">
                  Battery Health & Voltage
                </div>
                <div className="font-mono text-[#30D158] font-medium tabular-nums mt-0.5">
                  {snapshot.battery_present
                    ? `${snapshot.battery_health_pct}% Max (${snapshot.battery_condition}) · ${snapshot.battery_temperature_c.toFixed(1)}V`
                    : `Uptime ${snapshot.uptime}`}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Subview 1: Developer & System Caches */}
      {subView === 'caches' && (
        <>
          <div className="px-5 py-2 border-b border-white/[0.06] bg-[#18181b] grid grid-cols-12 text-[11px] font-medium text-[#8e8e93]">
            <div className="col-span-4">Cache Target</div>
            <div className="col-span-2">Category</div>
            <div className="col-span-4">Location</div>
            <div className="col-span-2 text-right">Reclaimable Size</div>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {loading ? (
              <div className="h-56 flex items-center justify-center gap-2 text-xs text-[#8e8e93]">
                <Loader2 className="w-4 h-4 animate-spin text-[#0A84FF]" />
                <span>Measuring toolchain, package manager, and browser caches...</span>
              </div>
            ) : caches.length === 0 ? (
              <div className="h-56 flex items-center justify-center text-xs text-[#8e8e93]">
                No large cache directories detected.
              </div>
            ) : (
              <div className="rounded-xl bg-[#1c1c1e] border border-white/[0.08] divide-y divide-white/[0.06] overflow-hidden shadow-sm">
                {caches.map((item) => {
                  const checked = selectedCaches.has(item.path);
                  return (
                    <div
                      key={item.path}
                      onClick={() => onToggleCache(item.path)}
                      className={`px-4 py-3 grid grid-cols-12 items-center gap-2 cursor-pointer transition-colors ${
                        checked ? 'bg-[#0A84FF]/15 hover:bg-[#0A84FF]/20' : 'hover:bg-white/[0.04]'
                      }`}
                    >
                      <div className="col-span-4 flex items-center gap-2.5 min-w-0">
                        {checked ? (
                          <CheckSquare className="w-4 h-4 text-[#0A84FF] shrink-0" />
                        ) : (
                          <Square className="w-4 h-4 text-[#636366] shrink-0" />
                        )}
                        <div className="min-w-0">
                          <div className="text-xs font-medium text-white truncate">
                            {item.name}
                          </div>
                          <div className="text-[11px] text-[#8e8e93] truncate">
                            {item.description}
                          </div>
                        </div>
                      </div>

                      <div className="col-span-2">
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-[#2c2c2e] text-[#ebebf5]/80">
                          {item.category}
                        </span>
                      </div>

                      <div className="col-span-4 text-[11px] font-mono text-[#8e8e93] truncate">
                        {item.path}
                      </div>

                      <div className="col-span-2 flex items-center justify-end gap-2.5">
                        <span className="font-mono text-xs font-semibold text-white tabular-nums">
                          {formatBytes(item.size_bytes)}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            ZeroTrashAPI.revealInFileManager(item.path);
                          }}
                          className="p-1 rounded-md hover:bg-[#2c2c2e] text-[#8e8e93] hover:text-white transition-colors"
                          title="Show in Finder"
                        >
                          <FolderOpen className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="px-5 py-3 border-t border-white/[0.07] bg-[#1c1c1e] flex items-center justify-between">
            <div className="flex items-center gap-3 text-xs text-[#8e8e93]">
              <button
                onClick={() => onSetCaches(new Set(caches.map((c) => c.path)))}
                className="text-[#0A84FF] hover:underline font-medium"
              >
                Select All ({caches.length})
              </button>
              <span>·</span>
              <button
                onClick={() => onSetCaches(new Set())}
                className="hover:text-white transition-colors"
              >
                Clear Selection
              </button>
            </div>

            <button
              disabled={selectedCaches.size === 0}
              onClick={onPurgeCaches}
              className="px-4 py-1.5 rounded-lg bg-[#0A84FF] hover:bg-[#0070E0] disabled:opacity-40 text-xs font-semibold text-white shadow-sm transition-colors"
            >
              Move {selectedCaches.size} Caches to Trash ({formatBytes(selectedCacheBytes)})
            </button>
          </div>
        </>
      )}

      {/* Subview 2: OS Maintenance Tasks */}
      {subView === 'tasks' && (
        <div className="flex-1 overflow-y-auto p-4">
          <div className="rounded-xl bg-[#1c1c1e] border border-white/[0.08] divide-y divide-white/[0.06] overflow-hidden shadow-sm">
            {snapshot?.tasks.map((task) => {
              const isRunning = runningTaskId === task.id;
              const result = taskOutputs[task.id];
              return (
                <div
                  key={task.id}
                  className="px-4 py-3.5 flex items-center justify-between gap-4 hover:bg-white/[0.04] transition-colors"
                >
                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-white">{task.title}</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-[#2c2c2e] text-[#ebebf5]/80">
                        {task.category}
                      </span>
                    </div>
                    <p className="text-xs text-[#8e8e93]">{task.description}</p>
                    <div className="text-[11px] font-mono text-[#64D2FF]/90">
                      $ {task.command_preview}
                    </div>
                    {result && (
                      <div className="mt-1.5 px-3 py-1.5 rounded-lg bg-[#141416] border border-white/[0.08] font-mono text-[11px] text-[#ebebf5] flex items-center justify-between gap-4">
                        <span className="truncate">{result.output}</span>
                        <span className="text-[#8e8e93] shrink-0 tabular-nums">
                          {result.duration_ms} ms
                        </span>
                      </div>
                    )}
                  </div>

                  <button
                    disabled={isRunning}
                    onClick={() => handleExecuteTask(task.id)}
                    className="px-3.5 py-1.5 rounded-lg bg-[#2c2c2e] hover:bg-[#3a3a3c] border border-white/[0.08] text-xs font-medium text-white flex items-center gap-1.5 shrink-0 transition-colors"
                  >
                    {isRunning ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-[#0A84FF]" />
                    ) : result?.success ? (
                      <Check className="w-3.5 h-3.5 text-[#30D158]" />
                    ) : (
                      <Play className="w-3 h-3 text-[#0A84FF]" />
                    )}
                    <span>{isRunning ? 'Running...' : 'Run Task'}</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Subview 3: Live Process Monitor */}
      {subView === 'processes' && (
        <>
          <div className="px-5 py-2 border-b border-white/[0.06] bg-[#18181b] grid grid-cols-12 text-[11px] font-medium text-[#8e8e93]">
            <div className="col-span-1">PID</div>
            <div className="col-span-3">Process</div>
            <div className="col-span-4">Executable Path</div>
            <div className="col-span-1 text-right">CPU %</div>
            <div className="col-span-1 text-right">Memory</div>
            <div className="col-span-2 text-right">Action</div>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            <div className="rounded-xl bg-[#1c1c1e] border border-white/[0.08] divide-y divide-white/[0.06] overflow-hidden shadow-sm">
              {snapshot?.top_processes.map((proc) => (
                <div
                  key={proc.pid}
                  className="px-4 py-2.5 grid grid-cols-12 items-center gap-2 hover:bg-white/[0.04] transition-colors"
                >
                  <div className="col-span-1 font-mono text-xs text-[#8e8e93] tabular-nums">
                    {proc.pid}
                  </div>
                  <div className="col-span-3 text-xs font-medium text-white truncate">
                    {proc.name}
                  </div>
                  <div className="col-span-4 font-mono text-[11px] text-[#8e8e93] truncate">
                    {proc.command}
                  </div>
                  <div className="col-span-1 text-right font-mono text-xs text-[#ebebf5] tabular-nums">
                    {proc.cpu_pct.toFixed(1)}%
                  </div>
                  <div className="col-span-1 text-right font-mono text-xs text-white font-medium tabular-nums">
                    {formatBytes(proc.memory_bytes)}
                  </div>
                  <div className="col-span-2 flex items-center justify-end gap-1.5">
                    <button
                      onClick={() => onKillProcess(proc.pid, false)}
                      className="px-2.5 py-1 rounded-md bg-[#2c2c2e] hover:bg-[#3a3a3c] text-[11px] text-white transition-colors"
                    >
                      Quit
                    </button>
                    <button
                      onClick={() => onKillProcess(proc.pid, true)}
                      className="px-2.5 py-1 rounded-md bg-[#2c2c2e] hover:bg-[#FF453A]/20 hover:text-[#FF453A] text-[11px] text-[#ebebf5] transition-colors"
                    >
                      Force Kill
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
