import { useState } from 'react';
import {
  RotateCcw,
  FolderOpen,
  CheckSquare,
  Square,
  Loader2,
  History,
  Trash2,
} from 'lucide-react';
import { ZeroTrashAPI, formatBytes } from '../bridge';
import type { TrashHistoryEntry } from '../types';
import { AppIcon } from './AppIcon';

interface Props {
  items: TrashHistoryEntry[];
  loading: boolean;
  restoring: boolean;
  title: string;
  subtitle: string;
  actionLabel: string;
  onRefresh: () => void;
  onRestoreSelected: (ids: string[]) => void;
  onDeletePermanently: (trashPaths: string[], totalBytes: number) => void;
}

export function TrashHistoryView({
  items,
  loading,
  restoring,
  title,
  subtitle,
  actionLabel,
  onRefresh,
  onRestoreSelected,
  onDeletePermanently,
}: Props) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const restorableItems = items.filter((i) => i.exists_in_trash);

  const selectedItems = items.filter((i) => selectedIds.has(i.id));
  const selectedBytes = selectedItems.reduce((s, i) => s + i.size_bytes, 0);

  function toggleId(id: string, canRestore: boolean) {
    if (!canRestore) return;
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div className="flex-1 flex flex-col bg-[#141416] overflow-hidden">
      <div className="px-5 py-3.5 border-b border-white/[0.07] bg-[#161618] flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-sm font-semibold text-white">{title}</h2>
          <p className="text-xs text-[#8e8e93] mt-0.5">{subtitle}</p>
        </div>

        <button
          onClick={onRefresh}
          disabled={loading || restoring}
          className="px-3 py-1.5 rounded-lg bg-[#2c2c2e] hover:bg-[#3a3a3c] border border-white/[0.08] text-xs font-medium text-white transition-colors"
        >
          Refresh Trash Log
        </button>
      </div>

      <div className="px-5 py-2 border-b border-white/[0.06] bg-[#18181b] grid grid-cols-12 text-[11px] font-medium text-[#8e8e93]">
        <div className="col-span-3">Item Name</div>
        <div className="col-span-4">Original Location (Put Back Target)</div>
        <div className="col-span-2">Removed At</div>
        <div className="col-span-1">Status</div>
        <div className="col-span-2 text-right">Size / Action</div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <div className="h-56 flex items-center justify-center gap-2 text-xs text-[#8e8e93]">
            <Loader2 className="w-4 h-4 animate-spin text-[#0A84FF]" />
            <span>Reading ~/.Trash and ZeroTrash activity ledger...</span>
          </div>
        ) : items.length === 0 ? (
          <div className="h-56 flex flex-col items-center justify-center gap-2 text-xs text-[#8e8e93]">
            <History className="w-5 h-5 text-[#8e8e93]" />
            <span>
              No items in Trash history yet. Anything moved to Trash via ZeroTrash will appear here for instant Put Back recovery.
            </span>
          </div>
        ) : (
          <div className="rounded-xl bg-[#1c1c1e] border border-white/[0.08] divide-y divide-white/[0.06] overflow-hidden shadow-sm">
            {items.map((item) => {
              const checked = selectedIds.has(item.id);
              return (
                <div
                  key={item.id}
                  onClick={() => toggleId(item.id, item.exists_in_trash)}
                  className={`px-4 py-2.5 grid grid-cols-12 items-center gap-2 transition-colors ${
                    !item.exists_in_trash
                      ? 'opacity-45'
                      : checked
                      ? 'bg-[#0A84FF]/15 hover:bg-[#0A84FF]/20 cursor-pointer'
                      : 'hover:bg-white/[0.04] cursor-pointer'
                  }`}
                >
                  <div className="col-span-3 flex items-center gap-2.5 min-w-0">
                    {checked ? (
                      <CheckSquare className="w-4 h-4 text-[#0A84FF] shrink-0" />
                    ) : (
                      <Square className="w-4 h-4 text-[#636366] shrink-0" />
                    )}
                    <AppIcon path={item.trash_path} name={item.name} size="sm" />
                    <span className="text-xs font-medium text-white truncate">
                      {item.name}
                    </span>
                  </div>

                  <div className="col-span-4 text-[11px] font-mono text-[#8e8e93] truncate">
                    {item.original_path}
                  </div>

                  <div className="col-span-2 text-[11px] font-mono text-[#8e8e93] truncate">
                    {item.deleted_at}
                  </div>

                  <div className="col-span-1">
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded-md ${
                        item.exists_in_trash
                          ? 'bg-[#30D158]/15 text-[#30D158]'
                          : 'bg-[#2c2c2e] text-[#8e8e93]'
                      }`}
                    >
                      {item.exists_in_trash ? 'In Trash' : 'Purged'}
                    </span>
                  </div>

                  <div className="col-span-2 flex items-center justify-end gap-2">
                    <span className="font-mono text-xs font-semibold text-white tabular-nums">
                      {formatBytes(item.size_bytes)}
                    </span>
                    {item.exists_in_trash && (
                      <>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onRestoreSelected([item.id]);
                          }}
                          className="px-2 py-1 rounded-md bg-[#30D158]/15 hover:bg-[#30D158]/25 text-[#30D158] text-[11px] font-medium flex items-center gap-1 transition-colors"
                          title="Put Back to Original Location"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>Put Back</span>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            ZeroTrashAPI.revealInFileManager(item.trash_path);
                          }}
                          className="p-1 rounded-md hover:bg-[#2c2c2e] text-[#8e8e93] hover:text-white transition-colors"
                          title="Show in Trash"
                        >
                          <FolderOpen className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
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
            onClick={() =>
              setSelectedIds(new Set(restorableItems.map((i) => i.id)))
            }
            className="text-[#0A84FF] hover:underline font-medium"
          >
            Select All Restorable ({restorableItems.length})
          </button>
          <span>·</span>
          <button
            onClick={() => setSelectedIds(new Set())}
            className="hover:text-white transition-colors"
          >
            Clear Selection
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            disabled={selectedIds.size === 0 || restoring}
            onClick={() => {
              const paths = selectedItems.map((i) => i.trash_path);
              setSelectedIds(new Set());
              onDeletePermanently(paths, selectedBytes);
            }}
            className="px-3.5 py-1.5 rounded-lg bg-[#2c2c2e] hover:bg-[#FF453A]/20 hover:text-[#FF453A] disabled:opacity-40 border border-white/[0.08] text-xs font-medium text-white flex items-center gap-1.5 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete Permanently ({formatBytes(selectedBytes)})</span>
          </button>

          <button
            disabled={selectedIds.size === 0 || restoring}
            onClick={() => {
              const ids = Array.from(selectedIds);
              setSelectedIds(new Set());
              onRestoreSelected(ids);
            }}
            className="px-4 py-1.5 rounded-lg bg-[#30D158] hover:bg-[#28B84C] disabled:opacity-40 text-xs font-semibold text-white flex items-center gap-1.5 shadow-sm transition-colors"
          >
            {restoring ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <RotateCcw className="w-3.5 h-3.5" />
            )}
            <span>
              {actionLabel} ({selectedIds.size}) — {formatBytes(selectedBytes)}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
