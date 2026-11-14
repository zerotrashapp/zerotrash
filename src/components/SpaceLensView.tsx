import React from 'react';
import {
  FolderOpen,
  ArrowUp,
  ChevronRight,
  Trash2,
  Loader2,
  Home,
  LayoutGrid,
} from 'lucide-react';
import { ZeroTrashAPI, formatBytes } from '../bridge';
import type { SpaceLensSnapshot, SpaceLensEntry } from '../types';
import { AppIcon } from './AppIcon';

interface Props {
  snapshot: SpaceLensSnapshot | null;
  loading: boolean;
  onNavigateDir: (dirPath?: string) => void;
  onRemoveEntry: (entry: SpaceLensEntry) => void;
}

const TILE_ACCENTS = [
  'from-[#0A84FF]/25 to-[#0A84FF]/10 border-[#0A84FF]/40',
  'from-[#BF5AF2]/25 to-[#BF5AF2]/10 border-[#BF5AF2]/40',
  'from-[#FF9F0A]/25 to-[#FF9F0A]/10 border-[#FF9F0A]/40',
  'from-[#30D158]/25 to-[#30D158]/10 border-[#30D158]/40',
  'from-[#64D2FF]/25 to-[#64D2FF]/10 border-[#64D2FF]/40',
  'from-[#FF375F]/25 to-[#FF375F]/10 border-[#FF375F]/40',
];

export function SpaceLensView({
  snapshot,
  loading,
  onNavigateDir,
  onRemoveEntry,
}: Props) {
  const maxEntryBytes = snapshot?.entries[0]?.size_bytes || 1;
  const totalBytes = Math.max(1, snapshot?.total_size_bytes || 1);
  const parts = snapshot?.current_path.split('/').filter(Boolean) || [];
  const topTiles = (snapshot?.entries || []).filter((e) => e.size_bytes > 0).slice(0, 6);

  return (
    <div className="flex-1 flex flex-col bg-[#141416] overflow-hidden">
      <div className="px-5 py-3.5 border-b border-white/[0.07] bg-[#161618] space-y-2.5">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-white">
                Interactive Space Lens
              </h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#0A84FF]/15 text-[#64D2FF] border border-[#0A84FF]/30">
                Visual Drill-Down Map
              </span>
            </div>
            <p className="text-xs text-[#8e8e93] mt-0.5">
              Click any visual block or folder row to drill down deeper into its subdirectories.
            </p>
          </div>

          <div className="flex items-center gap-1 bg-[#2c2c2e] p-0.5 rounded-[8px]">
            <button
              onClick={() => onNavigateDir(undefined)}
              className="px-2.5 py-1 rounded-[6px] hover:bg-[#48484a] text-[11px] font-medium text-white flex items-center gap-1.5 transition-colors"
            >
              <Home className="w-3 h-3 text-[#0A84FF]" />
              <span>Home</span>
            </button>
            <button
              onClick={() => onNavigateDir('/Applications')}
              className="px-2.5 py-1 rounded-[6px] hover:bg-[#48484a] text-[11px] font-medium text-[#ebebf5] transition-colors"
            >
              /Applications
            </button>
            <button
              onClick={() => onNavigateDir('/Library')}
              className="px-2.5 py-1 rounded-[6px] hover:bg-[#48484a] text-[11px] font-medium text-[#ebebf5] transition-colors"
            >
              /Library
            </button>
          </div>
        </div>

        {/* Breadcrumb Bar */}
        {snapshot && (
          <div className="flex items-center justify-between gap-4 pt-2 border-t border-white/[0.06]">
            <div className="flex items-center gap-1 text-xs font-mono text-[#8e8e93] overflow-x-auto">
              <button
                disabled={!snapshot.parent_path}
                onClick={() => snapshot.parent_path && onNavigateDir(snapshot.parent_path)}
                className="p-1 rounded-md hover:bg-[#2c2c2e] disabled:opacity-30 text-white mr-1"
                title="Up one level"
              >
                <ArrowUp className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => onNavigateDir('/')}
                className="hover:text-white px-1"
              >
                /
              </button>

              {parts.map((seg, idx) => {
                const fullPath = '/' + parts.slice(0, idx + 1).join('/');
                return (
                  <React.Fragment key={fullPath}>
                    <ChevronRight className="w-3 h-3 text-[#636366] shrink-0" />
                    <button
                      onClick={() => onNavigateDir(fullPath)}
                      className={`px-1.5 py-0.5 rounded-md hover:bg-[#2c2c2e] truncate max-w-[180px] ${
                        idx === parts.length - 1
                          ? 'text-white font-semibold bg-[#2c2c2e]'
                          : 'text-[#8e8e93] hover:text-white'
                      }`}
                    >
                      {seg}
                    </button>
                  </React.Fragment>
                );
              })}
            </div>

            <div className="text-xs font-mono text-[#8e8e93] shrink-0 tabular-nums">
              Folder Total:{' '}
              <span className="text-white font-semibold">
                {formatBytes(snapshot.total_size_bytes)}
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {loading ? (
          <div className="h-56 flex items-center justify-center gap-2 text-xs text-[#8e8e93]">
            <Loader2 className="w-4 h-4 animate-spin text-[#0A84FF]" />
            <span>Calculating directory sizes & building visual map...</span>
          </div>
        ) : !snapshot || snapshot.entries.length === 0 ? (
          <div className="h-56 flex items-center justify-center text-xs text-[#8e8e93]">
            Directory is empty.
          </div>
        ) : (
          <>
            {/* Interactive Visual Treemap Blocks */}
            {topTiles.length > 0 && (
              <div className="rounded-xl bg-[#1c1c1e] border border-white/[0.08] p-3.5 space-y-2.5 shadow-sm">
                <div className="flex items-center justify-between text-[11px] text-[#8e8e93]">
                  <div className="flex items-center gap-1.5 font-medium text-white">
                    <LayoutGrid className="w-3.5 h-3.5 text-[#0A84FF]" />
                    <span>Visual Space Map (Top Consumers in Current Folder)</span>
                  </div>
                  <span>Click any folder block to inspect inside</span>
                </div>

                <div className="grid grid-cols-12 gap-2.5">
                  {topTiles.map((tile, idx) => {
                    const sharePct = Math.max(
                      1,
                      Math.round((tile.size_bytes / totalBytes) * 100)
                    );
                    const colSpan =
                      idx === 0
                        ? 'col-span-6'
                        : idx === 1
                        ? 'col-span-6'
                        : 'col-span-3';
                    const accent = TILE_ACCENTS[idx % TILE_ACCENTS.length];
                    return (
                      <div
                        key={tile.path}
                        onClick={() => tile.is_dir && onNavigateDir(tile.path)}
                        className={`${colSpan} p-3 rounded-xl bg-gradient-to-br ${accent} border transition-transform hover:scale-[1.01] ${
                          tile.is_dir ? 'cursor-pointer' : ''
                        } flex flex-col justify-between min-h-[82px]`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <AppIcon path={tile.path} name={tile.name} size="sm" />
                            <span className="text-xs font-semibold text-white truncate">
                              {tile.name}
                            </span>
                          </div>
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-black/30 text-white shrink-0">
                            {sharePct}%
                          </span>
                        </div>

                        <div className="flex items-end justify-between mt-2">
                          <span className="text-[11px] text-[#ebebf5]/75">
                            {tile.is_dir ? `${tile.item_count} items` : 'File'}
                          </span>
                          <span className="font-mono text-xs font-bold text-white tabular-nums">
                            {formatBytes(tile.size_bytes)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Detailed Directory Table */}
            <div className="rounded-xl bg-[#1c1c1e] border border-white/[0.08] overflow-hidden shadow-sm">
              <div className="px-4 py-2 border-b border-white/[0.06] bg-[#18181b] grid grid-cols-12 text-[11px] font-medium text-[#8e8e93]">
                <div className="col-span-4">Name</div>
                <div className="col-span-4">Relative Size</div>
                <div className="col-span-1 text-right">Items</div>
                <div className="col-span-1 text-right">Modified</div>
                <div className="col-span-2 text-right">Size</div>
              </div>

              <div className="divide-y divide-white/[0.06]">
                {snapshot.entries.map((entry) => {
                  const pct = Math.max(
                    1,
                    Math.round((entry.size_bytes / maxEntryBytes) * 100)
                  );
                  return (
                    <div
                      key={entry.path}
                      onClick={() => {
                        if (entry.is_dir) {
                          onNavigateDir(entry.path);
                        }
                      }}
                      className={`px-4 py-2.5 grid grid-cols-12 items-center gap-3 hover:bg-white/[0.04] transition-colors ${
                        entry.is_dir ? 'cursor-pointer' : ''
                      }`}
                    >
                      <div className="col-span-4 flex items-center gap-2.5 min-w-0">
                        <AppIcon path={entry.path} name={entry.name} size="sm" />
                        <div className="min-w-0 flex items-center gap-1.5">
                          <span className="text-xs font-medium text-white truncate">
                            {entry.name}
                          </span>
                          {entry.is_dir && (
                            <ChevronRight className="w-3.5 h-3.5 text-[#8e8e93] shrink-0" />
                          )}
                        </div>
                      </div>

                      <div className="col-span-4">
                        <div className="w-full h-2 bg-[#2c2c2e] rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              entry.is_dir ? 'bg-[#0A84FF]' : 'bg-[#64D2FF]'
                            }`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>

                      <div className="col-span-1 text-right font-mono text-xs text-[#8e8e93] tabular-nums">
                        {entry.is_dir ? entry.item_count : 'file'}
                      </div>

                      <div className="col-span-1 text-right text-[11px] text-[#8e8e93]">
                        {entry.last_modified}
                      </div>

                      <div className="col-span-2 flex items-center justify-end gap-2">
                        <span className="font-mono text-xs font-semibold text-white tabular-nums">
                          {formatBytes(entry.size_bytes)}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            ZeroTrashAPI.revealInFileManager(entry.path);
                          }}
                          className="p-1 rounded-md hover:bg-[#2c2c2e] text-[#8e8e93] hover:text-white transition-colors"
                          title="Show in Finder"
                        >
                          <FolderOpen className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onRemoveEntry(entry);
                          }}
                          className="p-1 rounded-md hover:bg-[#FF453A]/20 text-[#8e8e93] hover:text-[#FF453A] transition-colors"
                          title="Move to Trash"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
