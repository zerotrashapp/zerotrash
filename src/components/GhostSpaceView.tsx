import React, { useState } from 'react';
import {
  Ghost,
  Trash2,
  FolderOpen,
  CheckSquare,
  Square,
  Loader2,
  Sparkles,
  Info,
} from 'lucide-react';
import { ZeroTrashAPI, formatBytes } from '../bridge';
import type { GhostSpaceEntry } from '../types';

interface Props {
  items: GhostSpaceEntry[];
  loading: boolean;
  onCleanPaths: (paths: string[], totalBytes: number) => void;
}

export function GhostSpaceView({ items, loading, onCleanPaths }: Props) {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const totalBytes = items.reduce((s, i) => s + i.size_bytes, 0);
  const selectedBytes = items
    .filter((i) => selected.has(i.path))
    .reduce((s, i) => s + i.size_bytes, 0);

  function toggle(item: GhostSpaceEntry) {
    if (!item.reclaimable) return;
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(item.path)) next.delete(item.path);
      else next.add(item.path);
      return next;
    });
  }

  return (
    <div className="flex-1 flex flex-col bg-[#141416] overflow-hidden">
      <div className="px-5 py-3.5 border-b border-white/[0.07] bg-[#161618] flex items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Ghost className="w-4 h-4 text-[#64D2FF]" />
            <h2 className="text-sm font-semibold text-white">
              Ghost Space Hunter (Trapped Disk Space)
            </h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#64D2FF]/15 text-[#64D2FF] border border-[#64D2FF]/30 flex items-center gap-1">
              <Sparkles className="w-2.5 h-2.5" />
              ZeroTrash Exclusive
            </span>
          </div>
          <p className="text-xs text-[#8e8e93] mt-0.5">
            Finds invisible trapped space: Docker.raw virtual disks, iPhone MobileSync backups, Xcode DeviceSupport, CoreSimulator & VM swap ({formatBytes(totalBytes)} detected).
          </p>
        </div>

        <button
          disabled={selected.size === 0}
          onClick={() => onCleanPaths(Array.from(selected), selectedBytes)}
          className="px-4 py-2 rounded-xl bg-[#0A84FF] hover:bg-[#0070E0] disabled:opacity-40 text-xs font-semibold text-white flex items-center gap-2 shrink-0 transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>
            Reclaim ({selected.size}) · {formatBytes(selectedBytes)}
          </span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-2.5">
        {loading ? (
          <div className="h-64 flex flex-col items-center justify-center gap-2 text-xs text-[#8e8e93]">
            <Loader2 className="w-5 h-5 animate-spin text-[#64D2FF]" />
            <span>Hunting hidden VM disks, device backups, and purgeable snapshots...</span>
          </div>
        ) : items.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center gap-2 text-center">
            <Ghost className="w-8 h-8 text-[#30D158]/60" />
            <div className="text-sm font-medium text-white">
              No Trapped Ghost Space Detected
            </div>
            <div className="text-xs text-[#8e8e93]">
              Your system has no oversized Docker disks, old iPhone backups, or Xcode simulator leftovers.
            </div>
          </div>
        ) : (
          items.map((item) => {
            const isSelected = selected.has(item.path);
            return (
              <div
                key={item.id}
                onClick={() => toggle(item)}
                className={`p-4 rounded-xl border flex items-center justify-between gap-4 transition-all ${
                  item.reclaimable ? 'cursor-pointer' : 'opacity-85'
                } ${
                  isSelected
                    ? 'bg-[#0A84FF]/10 border-[#0A84FF]/40'
                    : 'bg-[#1c1c1e] border-white/[0.07] hover:border-white/15'
                }`}
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className="mt-0.5">
                    {item.reclaimable ? (
                      isSelected ? (
                        <CheckSquare className="w-4 h-4 text-[#0A84FF]" />
                      ) : (
                        <Square className="w-4 h-4 text-[#8e8e93]" />
                      )
                    ) : (
                      <Info className="w-4 h-4 text-[#FF9F0A]" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-semibold text-white">
                        {item.name}
                      </span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] bg-[#64D2FF]/15 text-[#64D2FF]">
                        {item.category}
                      </span>
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                          item.reclaimable
                            ? 'bg-[#30D158]/15 text-[#30D158]'
                            : 'bg-[#FF9F0A]/15 text-[#FF9F0A]'
                        }`}
                      >
                        {item.action_hint}
                      </span>
                    </div>
                    <div className="text-[11px] text-[#8e8e93] mt-1">
                      {item.description}
                    </div>
                    <div className="text-[10px] font-mono text-[#8e8e93]/80 mt-1 truncate">
                      {item.path}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-sm font-mono font-semibold text-white tabular-nums">
                    {formatBytes(item.size_bytes)}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      ZeroTrashAPI.revealInFileManager(item.path);
                    }}
                    className="p-1.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.12] text-[#8e8e93] hover:text-white"
                    title="Reveal in Finder"
                  >
                    <FolderOpen className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
