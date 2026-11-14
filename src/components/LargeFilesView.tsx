import { useState } from 'react';
import { FolderOpen, Search, CheckSquare, Square, Loader2 } from 'lucide-react';
import { ZeroTrashAPI, formatBytes } from '../bridge';
import type { LargeFileItem } from '../types';
import { AppIcon } from './AppIcon';

interface Props {
  files: LargeFileItem[];
  loading: boolean;
  selectedPaths: Set<string>;
  onTogglePath: (path: string) => void;
  onSetPaths: (paths: Set<string>) => void;
  onRemoveSelected: () => void;
}

const CATEGORIES = [
  'ALL',
  'Disk Images & Installers',
  'Archives',
  'Video & Audio',
  'Models & Datasets',
  'Documents & Design',
  'Large Files',
];

export function LargeFilesView({
  files,
  loading,
  selectedPaths,
  onTogglePath,
  onSetPaths,
  onRemoveSelected,
}: Props) {
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [ageFilter, setAgeFilter] = useState<'ALL' | '30' | '180'>('ALL');
  const [search, setSearch] = useState('');

  const filtered = files.filter((f) => {
    if (categoryFilter !== 'ALL' && f.category !== categoryFilter) return false;
    if (ageFilter === '30' && f.days_old < 30) return false;
    if (ageFilter === '180' && f.days_old < 180) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return f.name.toLowerCase().includes(q) || f.path.toLowerCase().includes(q);
    }
    return true;
  });

  const selectedBytes = files
    .filter((f) => selectedPaths.has(f.path))
    .reduce((sum, f) => sum + f.size_bytes, 0);

  return (
    <div className="flex-1 flex flex-col bg-[#141416] overflow-hidden">
      <div className="px-5 py-3.5 border-b border-white/[0.07] bg-[#161618] space-y-2.5">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-sm font-semibold text-white">Large & Old Files</h2>
            <p className="text-xs text-[#8e8e93] mt-0.5">
              Files and bundles larger than 20 MB across Downloads, Desktop, Documents, Movies, and Music.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative w-56">
              <Search className="w-3.5 h-3.5 text-[#8e8e93] absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Filter file name or path..."
                className="w-full bg-[#1c1c1e] border border-white/[0.08] focus:border-[#0A84FF] rounded-lg pl-8 pr-2.5 py-1.5 text-xs text-white placeholder:text-[#8e8e93] outline-none transition-colors"
              />
            </div>

            <select
              value={ageFilter}
              onChange={(e) => setAgeFilter(e.target.value as any)}
              className="bg-[#1c1c1e] border border-white/[0.08] rounded-lg px-2.5 py-1.5 text-xs text-[#ebebf5] outline-none"
            >
              <option value="ALL">Age: Any Time</option>
              <option value="30">Older than 30 days</option>
              <option value="180">Older than 6 months</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-0.5 bg-[#2c2c2e] p-0.5 rounded-[8px] w-fit flex-wrap">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-2.5 py-1 rounded-[6px] text-[11px] font-medium transition-all ${
                categoryFilter === cat
                  ? 'bg-[#48484a] text-white shadow-sm'
                  : 'text-[#8e8e93] hover:text-white'
              }`}
            >
              {cat === 'ALL' ? 'All Types' : cat}
            </button>
          ))}
        </div>
      </div>

      <div className="px-5 py-2 border-b border-white/[0.06] bg-[#18181b] grid grid-cols-12 text-[11px] font-medium text-[#8e8e93]">
        <div className="col-span-4">File</div>
        <div className="col-span-2">Category</div>
        <div className="col-span-3">Location</div>
        <div className="col-span-1">Modified</div>
        <div className="col-span-2 text-right">Size</div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <div className="h-56 flex items-center justify-center gap-2 text-xs text-[#8e8e93]">
            <Loader2 className="w-4 h-4 animate-spin text-[#0A84FF]" />
            <span>Scanning user folders for files larger than 20 MB...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="h-56 flex items-center justify-center text-xs text-[#8e8e93]">
            No large files matching current filters.
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
                  <div className="col-span-4 flex items-center gap-2.5 min-w-0">
                    {checked ? (
                      <CheckSquare className="w-4 h-4 text-[#0A84FF] shrink-0" />
                    ) : (
                      <Square className="w-4 h-4 text-[#636366] shrink-0" />
                    )}
                    <AppIcon path={item.path} name={item.name} size="sm" />
                    <div className="min-w-0">
                      <div className="text-xs font-medium text-white truncate">
                        {item.name}
                      </div>
                      <div className="text-[10px] font-mono uppercase text-[#8e8e93]">
                        .{item.extension}
                      </div>
                    </div>
                  </div>

                  <div className="col-span-2">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-[#2c2c2e] text-[#ebebf5]/80">
                      {item.category}
                    </span>
                  </div>

                  <div className="col-span-3 text-[11px] font-mono text-[#8e8e93] truncate">
                    {item.path}
                  </div>

                  <div className="col-span-1 text-[11px] text-[#8e8e93]">
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
            onClick={() => onSetPaths(new Set(filtered.map((f) => f.path)))}
            className="text-[#0A84FF] hover:underline font-medium"
          >
            Select All ({filtered.length})
          </button>
          <span>·</span>
          <button
            onClick={() =>
              onSetPaths(
                new Set(
                  filtered
                    .filter((f) => f.category === 'Disk Images & Installers')
                    .map((f) => f.path)
                )
              )
            }
            className="text-[#FF9F0A] hover:underline font-medium"
          >
            Select Installers Only (.dmg / .pkg)
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
          onClick={onRemoveSelected}
          className="px-4 py-1.5 rounded-lg bg-[#0A84FF] hover:bg-[#0070E0] disabled:opacity-40 text-xs font-semibold text-white shadow-sm transition-colors"
        >
          Move {selectedPaths.size} Files to Trash ({formatBytes(selectedBytes)})
        </button>
      </div>
    </div>
  );
}
