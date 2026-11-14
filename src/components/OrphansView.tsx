import { FolderOpen, Square, CheckSquare, Loader2 } from 'lucide-react';
import { ZeroTrashAPI, formatBytes } from '../bridge';
import type { OrphanedItem } from '../types';

interface Props {
  items: OrphanedItem[];
  loading: boolean;
  categoryFilter: string;
  onCategoryChange: (cat: string) => void;
  selectedPaths: Set<string>;
  onTogglePath: (path: string) => void;
  onSetPaths: (paths: Set<string>) => void;
  onCleanSelected: () => void;
}

const CATEGORIES = [
  'ALL',
  'Caches',
  'Application Support',
  'Saved State',
  'HTTP Storage',
  'Preferences',
];

export function OrphansView({
  items,
  loading,
  categoryFilter,
  onCategoryChange,
  selectedPaths,
  onTogglePath,
  onSetPaths,
  onCleanSelected,
}: Props) {
  const filtered = items.filter(
    (item) => categoryFilter === 'ALL' || item.category === categoryFilter
  );

  const selectedBytes = items
    .filter((i) => selectedPaths.has(i.path))
    .reduce((sum, i) => sum + i.size_bytes, 0);

  return (
    <div className="flex-1 flex flex-col bg-[#141416] overflow-hidden">
      <div className="px-5 py-3.5 border-b border-white/[0.07] bg-[#161618] flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-sm font-semibold text-white">Orphaned Application Data</h2>
          <p className="text-xs text-[#8e8e93] mt-0.5">
            Residual folders and caches in ~/Library with no matching application in /Applications.
          </p>
        </div>

        <div className="flex items-center gap-0.5 bg-[#2c2c2e] p-0.5 rounded-[8px]">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => onCategoryChange(cat)}
              className={`px-2.5 py-1 rounded-[6px] text-[11px] font-medium transition-all ${
                categoryFilter === cat
                  ? 'bg-[#48484a] text-white shadow-sm'
                  : 'text-[#8e8e93] hover:text-white'
              }`}
            >
              {cat === 'ALL' ? 'All' : cat}
            </button>
          ))}
        </div>
      </div>

      <div className="px-5 py-2 border-b border-white/[0.06] bg-[#18181b] grid grid-cols-12 text-[11px] font-medium text-[#8e8e93]">
        <div className="col-span-5">Identifier / Inferred Source</div>
        <div className="col-span-4">Location</div>
        <div className="col-span-1">Modified</div>
        <div className="col-span-2 text-right">Size</div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <div className="h-56 flex items-center justify-center gap-2 text-xs text-[#8e8e93]">
            <Loader2 className="w-4 h-4 animate-spin text-[#0A84FF]" />
            <span>Cross-referencing ~/Library directories against installed bundles...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="h-56 flex items-center justify-center text-xs text-[#8e8e93]">
            No orphaned files found in this category.
          </div>
        ) : (
          <div className="rounded-xl bg-[#1c1c1e] border border-white/[0.08] divide-y divide-white/[0.06] overflow-hidden shadow-sm">
            {filtered.map((item) => {
              const checked = selectedPaths.has(item.path);
              return (
                <div
                  key={item.path}
                  onClick={() => onTogglePath(item.path)}
                  className={`px-4 py-2.5 grid grid-cols-12 items-center gap-2 cursor-pointer transition-colors ${
                    checked ? 'bg-[#0A84FF]/15 hover:bg-[#0A84FF]/20' : 'hover:bg-white/[0.04]'
                  }`}
                >
                  <div className="col-span-5 flex items-center gap-2.5 min-w-0">
                    {checked ? (
                      <CheckSquare className="w-4 h-4 text-[#0A84FF] shrink-0" />
                    ) : (
                      <Square className="w-4 h-4 text-[#636366] shrink-0" />
                    )}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-white truncate">
                          {item.inferred_app}
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-[#2c2c2e] text-[#ebebf5]/80">
                          {item.category}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="col-span-4 text-[11px] font-mono text-[#8e8e93] truncate">
                    {item.path}
                  </div>

                  <div className="col-span-1 text-[11px] text-[#8e8e93] truncate">
                    {item.last_modified}
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
            onClick={() => onSetPaths(new Set(filtered.map((o) => o.path)))}
            className="text-[#0A84FF] hover:underline font-medium"
          >
            Select All ({filtered.length})
          </button>
          <span>·</span>
          <button
            onClick={() =>
              onSetPaths(
                new Set(filtered.filter((o) => o.risk_level === 'Safe').map((o) => o.path))
              )
            }
            className="text-[#30D158] hover:underline font-medium"
          >
            Select Safe Caches Only
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
          className="px-4 py-1.5 rounded-lg bg-[#0A84FF] hover:bg-[#0070E0] disabled:opacity-40 text-xs font-semibold text-white shadow-sm transition-colors"
        >
          Move {selectedPaths.size} Items to Trash ({formatBytes(selectedBytes)})
        </button>
      </div>
    </div>
  );
}
