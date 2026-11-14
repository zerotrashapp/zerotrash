import React, { useState } from 'react';
import {
  Cpu,
  FolderOpen,
  Search,
  CheckSquare,
  Square,
  Loader2,
  Scissors,
} from 'lucide-react';
import { ZeroTrashAPI, formatBytes } from '../bridge';
import type { UniversalAppItem } from '../types';
import { AppIcon } from './AppIcon';

interface Props {
  items: UniversalAppItem[];
  loading: boolean;
  slimBusy: boolean;
  title: string;
  subtitle: string;
  actionLabel: string;
  onRefresh: () => void;
  onSlimSelected: (paths: string[]) => void;
}

export function UniversalSlimmerView({
  items,
  loading,
  slimBusy,
  title,
  subtitle,
  actionLabel,
  onRefresh,
  onSlimSelected,
}: Props) {
  const [search, setSearch] = useState('');
  const [selectedPaths, setSelectedPaths] = useState<Set<string>>(new Set());

  const filtered = items.filter((item) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      item.name.toLowerCase().includes(q) ||
      item.bundle_id.toLowerCase().includes(q)
    );
  });

  const totalPotentialSavings = items.reduce(
    (sum, i) => sum + i.estimated_savings_bytes,
    0
  );

  const selectedSavings = items
    .filter((i) => selectedPaths.has(i.app_path))
    .reduce((sum, i) => sum + i.estimated_savings_bytes, 0);

  function togglePath(path: string) {
    setSelectedPaths((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  }

  return (
    <div className="flex-1 flex flex-col bg-[#141416] overflow-hidden">
      <div className="px-5 py-3.5 border-b border-white/[0.07] bg-[#161618] space-y-3">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-white">{title}</h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-[#0A84FF]/15 text-[#0A84FF] border border-[#0A84FF]/30">
                lipo -remove x86_64
              </span>
            </div>
            <p className="text-xs text-[#8e8e93] mt-0.5">{subtitle}</p>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="relative w-56">
              <Search className="w-3.5 h-3.5 text-[#8e8e93] absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Filter Universal apps..."
                className="w-full bg-[#1c1c1e] border border-white/[0.08] focus:border-[#0A84FF] rounded-lg pl-8 pr-2.5 py-1.5 text-xs text-white placeholder:text-[#8e8e93] outline-none transition-colors"
              />
            </div>

            <button
              onClick={onRefresh}
              disabled={loading || slimBusy}
              className="px-3 py-1.5 rounded-lg bg-[#2c2c2e] hover:bg-[#3a3a3c] border border-white/[0.08] text-xs font-medium text-white transition-colors"
            >
              Rescan
            </button>
          </div>
        </div>

        {/* Summary Banner */}
        <div className="grid grid-cols-3 gap-3 pt-2 border-t border-white/[0.06] text-xs">
          <div className="p-2.5 rounded-lg bg-[#1c1c1e] border border-white/[0.06]">
            <div className="text-[10px] text-[#8e8e93] uppercase tracking-wider">
              Universal Apps Detected
            </div>
            <div className="font-mono text-white font-semibold mt-0.5 tabular-nums">
              {items.length} applications
            </div>
          </div>
          <div className="p-2.5 rounded-lg bg-[#1c1c1e] border border-white/[0.06]">
            <div className="text-[10px] text-[#8e8e93] uppercase tracking-wider">
              Total Fat Mach-O Binaries
            </div>
            <div className="font-mono text-white font-semibold mt-0.5 tabular-nums">
              {items.reduce((s, i) => s + i.fat_binaries_count, 0)} binaries
            </div>
          </div>
          <div className="p-2.5 rounded-lg bg-[#1c1c1e] border border-white/[0.06]">
            <div className="text-[10px] text-[#8e8e93] uppercase tracking-wider">
              Estimated Intel (x86_64) Savings
            </div>
            <div className="font-mono text-[#30D158] font-semibold mt-0.5 tabular-nums">
              ~{formatBytes(totalPotentialSavings)}
            </div>
          </div>
        </div>
      </div>

      <div className="px-5 py-2 border-b border-white/[0.06] bg-[#18181b] grid grid-cols-12 text-[11px] font-medium text-[#8e8e93]">
        <div className="col-span-4">Application</div>
        <div className="col-span-2">Architectures</div>
        <div className="col-span-2 text-right">Fat Binaries</div>
        <div className="col-span-2 text-right">Total App Size</div>
        <div className="col-span-2 text-right">Est. Intel Savings</div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <div className="h-56 flex items-center justify-center gap-2 text-xs text-[#8e8e93]">
            <Loader2 className="w-4 h-4 animate-spin text-[#0A84FF]" />
            <span>Inspecting Mach-O headers (0xcafebabe) across /Applications...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="h-56 flex flex-col items-center justify-center gap-1.5 text-xs text-[#8e8e93]">
            <Cpu className="w-5 h-5 text-[#8e8e93]" />
            <span>No Universal (arm64 + x86_64) applications matching filter.</span>
          </div>
        ) : (
          <div className="rounded-xl bg-[#1c1c1e] border border-white/[0.08] divide-y divide-white/[0.06] overflow-hidden shadow-sm">
            {filtered.map((item) => {
              const checked = selectedPaths.has(item.app_path);
              return (
                <div
                  key={item.app_path}
                  onClick={() => togglePath(item.app_path)}
                  className={`px-4 py-2.5 grid grid-cols-12 items-center gap-2 cursor-pointer transition-colors ${
                    checked ? 'bg-[#0A84FF]/15 hover:bg-[#0A84FF]/20' : 'hover:bg-white/[0.04]'
                  }`}
                >
                  <div className="col-span-4 flex items-center gap-2.5 min-w-0">
                    {checked ? (
                      <CheckSquare className="w-4 h-4 text-[#0A84FF] shrink-0" />
                    ) : (
                      <Square className="w-4 h-4 text-[#636366] shrink-0" />
                    )}
                    <AppIcon path={item.app_path} name={item.name} size="sm" />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-white truncate">
                          {item.name}
                        </span>
                        <span className="text-[11px] font-mono text-[#8e8e93]">
                          v{item.version}
                        </span>
                      </div>
                      <div className="text-[11px] font-mono text-[#8e8e93] truncate">
                        {item.bundle_id}
                      </div>
                    </div>
                  </div>

                  <div className="col-span-2">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-[#2c2c2e] text-[#ebebf5]/90">
                      {item.architectures}
                    </span>
                  </div>

                  <div className="col-span-2 text-right font-mono text-xs text-[#ebebf5] tabular-nums">
                    {item.fat_binaries_count} files ({formatBytes(item.universal_binaries_bytes)})
                  </div>

                  <div className="col-span-2 text-right font-mono text-xs text-[#8e8e93] tabular-nums">
                    {formatBytes(item.total_app_bytes)}
                  </div>

                  <div className="col-span-2 flex items-center justify-end gap-2">
                    <span className="font-mono text-xs font-semibold text-[#30D158] tabular-nums">
                      ~{formatBytes(item.estimated_savings_bytes)}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        ZeroTrashAPI.revealInFileManager(item.app_path);
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
            onClick={() => setSelectedPaths(new Set(filtered.map((f) => f.app_path)))}
            className="text-[#0A84FF] hover:underline font-medium"
          >
            Select All ({filtered.length})
          </button>
          <span>·</span>
          <button
            onClick={() => setSelectedPaths(new Set())}
            className="hover:text-white transition-colors"
          >
            Clear Selection
          </button>
        </div>

        <button
          disabled={selectedPaths.size === 0 || slimBusy}
          onClick={() => onSlimSelected(Array.from(selectedPaths))}
          className="px-4 py-1.5 rounded-lg bg-[#0A84FF] hover:bg-[#0070E0] disabled:opacity-40 text-xs font-semibold text-white flex items-center gap-1.5 shadow-sm transition-colors"
        >
          {slimBusy ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Scissors className="w-3.5 h-3.5" />
          )}
          <span>
            {actionLabel} ({selectedPaths.size}) — Save ~{formatBytes(selectedSavings)}
          </span>
        </button>
      </div>
    </div>
  );
}
