import React, { useMemo, useState } from 'react';
import {
  Copy,
  CheckSquare,
  Square,
  FolderOpen,
  Sparkles,
  Loader2,
  Trash2,
  Search,
} from 'lucide-react';
import { ZeroTrashAPI, formatBytes } from '../bridge';
import type { DuplicateGroup } from '../types';
import { AppIcon } from './AppIcon';

interface Props {
  groups: DuplicateGroup[];
  loading: boolean;
  selectedPaths: Set<string>;
  onTogglePath: (path: string) => void;
  onSetPaths: (paths: Set<string>) => void;
  onCleanSelected: () => void;
}

const CATEGORIES = [
  'ALL',
  'Video & Audio',
  'Archives',
  'Disk Images & Installers',
  'Documents & Design',
  'Large Files',
];

export function DuplicatesView({
  groups,
  loading,
  selectedPaths,
  onTogglePath,
  onSetPaths,
  onCleanSelected,
}: Props) {
  const [category, setCategory] = useState('ALL');
  const [query, setQuery] = useState('');

  const filteredGroups = useMemo(() => {
    return groups.filter((g) => {
      if (category !== 'ALL' && g.category !== category) return false;
      if (query.trim()) {
        const q = query.toLowerCase();
        return (
          g.name_hint.toLowerCase().includes(q) ||
          g.files.some((f) => f.path.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [groups, category, query]);

  const totalWastedBytes = useMemo(
    () => groups.reduce((sum, g) => sum + g.wasted_bytes, 0),
    [groups]
  );

  const selectedBytes = useMemo(() => {
    let total = 0;
    for (const g of groups) {
      for (const f of g.files) {
        if (selectedPaths.has(f.path)) {
          total += g.file_size_bytes;
        }
      }
    }
    return total;
  }, [groups, selectedPaths]);

  function autoSelectKeepNewest() {
    const next = new Set<string>();
    for (const g of filteredGroups) {
      g.files.forEach((f, idx) => {
        if (idx > 0) next.add(f.path);
      });
    }
    onSetPaths(next);
  }

  function autoSelectKeepOldest() {
    const next = new Set<string>();
    for (const g of filteredGroups) {
      g.files.forEach((f, idx) => {
        if (idx < g.files.length - 1) next.add(f.path);
      });
    }
    onSetPaths(next);
  }

  return (
    <div className="flex-1 flex flex-col bg-[#141416] overflow-hidden">
      {/* Header */}
      <div className="px-5 py-3.5 border-b border-white/[0.07] bg-[#161618] space-y-3">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-white">
                Ultra-Fast Duplicate File Finder
              </h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#BF5AF2]/15 text-[#BF5AF2] border border-[#BF5AF2]/30">
                3-Stage Byte-Exact Hash
              </span>
            </div>
            <p className="text-xs text-[#8e8e93] mt-0.5">
              Finds 100% byte-identical files across Downloads, Documents, Desktop, Music, and Movies even when renamed.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-3 py-1.5 rounded-lg bg-[#1c1c1e] border border-white/[0.07] text-right">
              <div className="text-[10px] text-[#8e8e93] uppercase tracking-wider">
                Duplicate Groups
              </div>
              <div className="font-mono text-xs font-semibold text-white tabular-nums">
                {groups.length} groups
              </div>
            </div>
            <div className="px-3 py-1.5 rounded-lg bg-[#1c1c1e] border border-white/[0.07] text-right">
              <div className="text-[10px] text-[#8e8e93] uppercase tracking-wider">
                Wasted Disk Space
              </div>
              <div className="font-mono text-xs font-semibold text-[#FF9F0A] tabular-nums">
                {formatBytes(totalWastedBytes)}
              </div>
            </div>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex items-center justify-between gap-3 flex-wrap pt-2 border-t border-white/[0.06]">
          <div className="flex items-center gap-0.5 bg-[#2c2c2e] p-0.5 rounded-[8px]">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`px-2.5 py-1 rounded-[6px] text-[11px] font-medium transition-all ${
                  category === cat
                    ? 'bg-[#48484a] text-white shadow-sm'
                    : 'text-[#8e8e93] hover:text-white'
                }`}
              >
                {cat === 'ALL' ? 'All Categories' : cat}
              </button>
            ))}
          </div>

          <div className="relative w-64">
            <Search className="w-3.5 h-3.5 text-[#8e8e93] absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search duplicate filename or path..."
              className="w-full pl-8 pr-3 py-1 rounded-[7px] bg-[#2c2c2e] border border-white/[0.08] text-xs text-white placeholder-[#8e8e93] focus:outline-none focus:border-[#0A84FF]"
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {loading ? (
          <div className="h-56 flex items-center justify-center gap-2 text-xs text-[#8e8e93]">
            <Loader2 className="w-4 h-4 animate-spin text-[#0A84FF]" />
            <span>Comparing file sizes, partial signatures, and full content hashes...</span>
          </div>
        ) : filteredGroups.length === 0 ? (
          <div className="h-56 flex flex-col items-center justify-center gap-2 text-xs text-[#8e8e93]">
            <Copy className="w-6 h-6 text-[#636366]" />
            <span>No duplicate files found in this category.</span>
          </div>
        ) : (
          filteredGroups.map((group) => (
            <div
              key={group.id}
              className="rounded-xl bg-[#1c1c1e] border border-white/[0.08] overflow-hidden shadow-sm"
            >
              {/* Group Header */}
              <div className="px-4 py-2.5 bg-[#242426] border-b border-white/[0.06] flex items-center justify-between gap-4">
                <div className="flex items-center gap-2.5 min-w-0">
                  <AppIcon
                    path={group.files[0]?.path || ''}
                    name={group.name_hint}
                    size="sm"
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-white truncate">
                        {group.name_hint}
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-[#2c2c2e] text-[#ebebf5]/80">
                        {group.files.length} identical copies
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-[#0A84FF]/15 text-[#64D2FF]">
                        {group.category}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 shrink-0 text-xs font-mono tabular-nums">
                  <span className="text-[#8e8e93]">
                    Each: <strong className="text-white">{formatBytes(group.file_size_bytes)}</strong>
                  </span>
                  <span className="text-[#FF9F0A] font-semibold">
                    Wasted: {formatBytes(group.wasted_bytes)}
                  </span>
                </div>
              </div>

              {/* Files in Group */}
              <div className="divide-y divide-white/[0.05]">
                {group.files.map((file, idx) => {
                  const checked = selectedPaths.has(file.path);
                  return (
                    <div
                      key={file.path}
                      onClick={() => onTogglePath(file.path)}
                      className={`px-4 py-2.5 flex items-center justify-between gap-3 cursor-pointer transition-colors ${
                        checked
                          ? 'bg-[#0A84FF]/15 hover:bg-[#0A84FF]/20'
                          : 'hover:bg-white/[0.04]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {checked ? (
                          <CheckSquare className="w-4 h-4 text-[#0A84FF] shrink-0" />
                        ) : (
                          <Square className="w-4 h-4 text-[#636366] shrink-0" />
                        )}
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-white truncate">
                              {file.name}
                            </span>
                            {idx === 0 && !checked && (
                              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#30D158]/15 text-[#30D158] border border-[#30D158]/30">
                                Keep (Original)
                              </span>
                            )}
                            {checked && (
                              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#FF453A]/15 text-[#FF453A]">
                                Marked for Removal
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] font-mono text-[#8e8e93] truncate mt-0.5">
                            {file.path}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-[11px] text-[#8e8e93]">
                          {file.last_modified}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            ZeroTrashAPI.revealInFileManager(file.path);
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
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="px-5 py-3 border-t border-white/[0.07] bg-[#1c1c1e] flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3 text-xs text-[#8e8e93]">
          <button
            onClick={autoSelectKeepNewest}
            className="text-[#30D158] hover:underline font-medium flex items-center gap-1"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Smart Select Duplicates (Keep Newest)</span>
          </button>
          <span>·</span>
          <button
            onClick={autoSelectKeepOldest}
            className="text-[#0A84FF] hover:underline font-medium"
          >
            Smart Select (Keep Oldest)
          </button>
          <span>·</span>
          <button
            onClick={() => onSetPaths(new Set())}
            className="hover:text-white transition-colors"
          >
            Clear Selection
          </button>
        </div>

        <button
          disabled={selectedPaths.size === 0}
          onClick={onCleanSelected}
          className="px-4 py-1.5 rounded-lg bg-[#0A84FF] hover:bg-[#0070E0] disabled:opacity-40 text-xs font-semibold text-white shadow-sm flex items-center gap-1.5 transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>
            Move {selectedPaths.size} Duplicates to Trash ({formatBytes(selectedBytes)})
          </span>
        </button>
      </div>
    </div>
  );
}
