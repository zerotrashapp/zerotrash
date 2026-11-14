import React, { useEffect, useState } from 'react';
import {
  Flame,
  Plus,
  CheckSquare,
  Square,
  FolderOpen,
  ShieldAlert,
  Loader2,
} from 'lucide-react';
import { ZeroTrashAPI, formatBytes } from '../bridge';
import type { LargeFileItem, TrashHistoryEntry } from '../types';
import { AppIcon } from './AppIcon';

interface Props {
  largeFiles: LargeFileItem[];
  trashItems: TrashHistoryEntry[];
  busy: boolean;
  externalCustomPaths?: string[];
  onShredPaths: (paths: string[], passes: number) => void;
}

export function ShredderView({
  largeFiles,
  trashItems,
  busy,
  externalCustomPaths = [],
  onShredPaths,
}: Props) {
  const [passes, setPasses] = useState<1 | 3>(1);
  const [customInput, setCustomInput] = useState('');
  const [customPaths, setCustomPaths] = useState<string[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (externalCustomPaths.length > 0) {
      setCustomPaths((prev) => {
        const next = [...prev];
        for (const p of externalCustomPaths) {
          if (!next.includes(p)) next.unshift(p);
        }
        return next;
      });
      setSelected((prev) => {
        const next = new Set(prev);
        for (const p of externalCustomPaths) next.add(p);
        return next;
      });
    }
  }, [externalCustomPaths]);

  function togglePath(path: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  }

  function addCustomPath() {
    const trimmed = customInput.trim();
    if (!trimmed) return;
    if (!customPaths.includes(trimmed)) {
      setCustomPaths((prev) => [trimmed, ...prev]);
    }
    setSelected((prev) => new Set(prev).add(trimmed));
    setCustomInput('');
  }

  const activeTrash = trashItems.filter((t) => t.exists_in_trash);

  return (
    <div className="flex-1 flex flex-col bg-[#141416] overflow-hidden">
      {/* Header */}
      <div className="px-5 py-3.5 border-b border-white/[0.07] bg-[#161618] space-y-3">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-white">
                Secure File Shredder (Zero-Recovery Erase)
              </h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#FF453A]/15 text-[#FF453A] border border-[#FF453A]/30">
                Permanent Overwrite
              </span>
            </div>
            <p className="text-xs text-[#8e8e93] mt-0.5">
              Overwrites file sectors with binary patterns before unlinking so forensic and undelete tools cannot recover them.
            </p>
          </div>

          {/* Overwrite Mode Selector */}
          <div className="flex items-center gap-1 bg-[#2c2c2e] p-0.5 rounded-[8px]">
            <button
              onClick={() => setPasses(1)}
              className={`px-3 py-1 rounded-[6px] text-[11px] font-medium transition-all ${
                passes === 1
                  ? 'bg-[#48484a] text-white shadow-sm'
                  : 'text-[#8e8e93] hover:text-white'
              }`}
            >
              1-Pass Zero-Fill (NVMe SSD Fast)
            </button>
            <button
              onClick={() => setPasses(3)}
              className={`px-3 py-1 rounded-[6px] text-[11px] font-medium transition-all ${
                passes === 3
                  ? 'bg-[#FF453A] text-white shadow-sm'
                  : 'text-[#8e8e93] hover:text-white'
              }`}
            >
              3-Pass DoD 5220.22-M (Max Security)
            </button>
          </div>
        </div>

        {/* Add Custom File / Folder Input */}
        <div className="flex items-center gap-2 pt-2 border-t border-white/[0.06]">
          <input
            type="text"
            value={customInput}
            onChange={(e) => setCustomInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addCustomPath()}
            placeholder="Paste any file or folder path to shred (e.g. /Users/username/Desktop/secret.pdf)..."
            className="flex-1 bg-[#1c1c1e] border border-white/[0.08] focus:border-[#0A84FF] rounded-lg px-3 py-1.5 text-xs font-mono text-white placeholder:text-[#8e8e93] outline-none"
          />
          <button
            onClick={addCustomPath}
            className="px-3 py-1.5 rounded-lg bg-[#2c2c2e] hover:bg-[#3a3a3c] text-xs font-medium text-white flex items-center gap-1.5 shrink-0 transition-colors"
          >
            <Plus className="w-3.5 h-3.5 text-[#0A84FF]" />
            <span>Add Path</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Custom Queued Paths */}
        {customPaths.length > 0 && (
          <div className="space-y-1.5">
            <div className="px-1 text-[11px] font-semibold text-[#8e8e93]">
              Custom Queued Paths ({customPaths.length})
            </div>
            <div className="rounded-xl bg-[#1c1c1e] border border-white/[0.08] divide-y divide-white/[0.06] overflow-hidden">
              {customPaths.map((p) => {
                const checked = selected.has(p);
                return (
                  <div
                    key={p}
                    onClick={() => togglePath(p)}
                    className={`px-4 py-2.5 flex items-center justify-between gap-3 cursor-pointer ${
                      checked ? 'bg-[#FF453A]/15' : 'hover:bg-white/[0.04]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {checked ? (
                        <CheckSquare className="w-4 h-4 text-[#FF453A] shrink-0" />
                      ) : (
                        <Square className="w-4 h-4 text-[#636366] shrink-0" />
                      )}
                      <span className="text-xs font-mono text-white truncate">{p}</span>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#FF453A]/20 text-[#FF453A]">
                      Custom Target
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Section 1: Items Currently in Trash */}
        <div className="space-y-1.5">
          <div className="px-1 flex items-center justify-between text-[11px] font-semibold text-[#8e8e93]">
            <span>Items Currently in System Trash ({activeTrash.length})</span>
            <span>Select to securely overwrite instead of standard empty</span>
          </div>

          {activeTrash.length === 0 ? (
            <div className="rounded-xl bg-[#1c1c1e] border border-white/[0.08] p-4 text-xs text-[#8e8e93]">
              No restorable items currently tracked in Trash.
            </div>
          ) : (
            <div className="rounded-xl bg-[#1c1c1e] border border-white/[0.08] divide-y divide-white/[0.06] overflow-hidden">
              {activeTrash.map((item) => {
                const checked = selected.has(item.trash_path);
                return (
                  <div
                    key={item.trash_path}
                    onClick={() => togglePath(item.trash_path)}
                    className={`px-4 py-2.5 flex items-center justify-between gap-3 cursor-pointer transition-colors ${
                      checked ? 'bg-[#FF453A]/15' : 'hover:bg-white/[0.04]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {checked ? (
                        <CheckSquare className="w-4 h-4 text-[#FF453A] shrink-0" />
                      ) : (
                        <Square className="w-4 h-4 text-[#636366] shrink-0" />
                      )}
                      <AppIcon path={item.trash_path} name={item.name} size="sm" />
                      <div className="min-w-0">
                        <div className="text-xs font-medium text-white truncate">
                          {item.name}
                        </div>
                        <div className="text-[11px] font-mono text-[#8e8e93] truncate">
                          {item.trash_path}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className="font-mono text-xs font-semibold text-white tabular-nums">
                        {formatBytes(item.size_bytes)}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          ZeroTrashAPI.revealInFileManager(item.trash_path);
                        }}
                        className="p-1 rounded-md hover:bg-[#2c2c2e] text-[#8e8e93] hover:text-white"
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

        {/* Section 2: User Files & Archives */}
        <div className="space-y-1.5">
          <div className="px-1 flex items-center justify-between text-[11px] font-semibold text-[#8e8e93]">
            <span>User Archives, Documents & Installers ({largeFiles.length})</span>
            <span>Click any file to add to Shred Queue</span>
          </div>

          {largeFiles.length === 0 ? (
            <div className="rounded-xl bg-[#1c1c1e] border border-white/[0.08] p-4 text-xs text-[#8e8e93]">
              No large user files indexed yet.
            </div>
          ) : (
            <div className="rounded-xl bg-[#1c1c1e] border border-white/[0.08] divide-y divide-white/[0.06] overflow-hidden">
              {largeFiles.slice(0, 30).map((file) => {
                const checked = selected.has(file.path);
                return (
                  <div
                    key={file.path}
                    onClick={() => togglePath(file.path)}
                    className={`px-4 py-2.5 flex items-center justify-between gap-3 cursor-pointer transition-colors ${
                      checked ? 'bg-[#FF453A]/15' : 'hover:bg-white/[0.04]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {checked ? (
                        <CheckSquare className="w-4 h-4 text-[#FF453A] shrink-0" />
                      ) : (
                        <Square className="w-4 h-4 text-[#636366] shrink-0" />
                      )}
                      <AppIcon path={file.path} name={file.name} size="sm" />
                      <div className="min-w-0">
                        <div className="text-xs font-medium text-white truncate">
                          {file.name}
                        </div>
                        <div className="text-[11px] font-mono text-[#8e8e93] truncate">
                          {file.path}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className="font-mono text-xs font-semibold text-white tabular-nums">
                        {formatBytes(file.size_bytes)}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          ZeroTrashAPI.revealInFileManager(file.path);
                        }}
                        className="p-1 rounded-md hover:bg-[#2c2c2e] text-[#8e8e93] hover:text-white"
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
      </div>

      {/* Footer */}
      <div className="px-5 py-3 border-t border-white/[0.07] bg-[#1c1c1e] flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs text-[#8e8e93]">
          <ShieldAlert className="w-4 h-4 text-[#FF453A] shrink-0" />
          <span>
            Shredded files bypass Trash and are overwritten with {passes}-pass binary patterns.
          </span>
        </div>

        <button
          disabled={selected.size === 0 || busy}
          onClick={() => {
            onShredPaths(Array.from(selected), passes);
            setSelected(new Set());
          }}
          className="px-4 py-1.5 rounded-lg bg-[#FF453A] hover:bg-[#D70015] disabled:opacity-40 text-xs font-semibold text-white shadow-sm flex items-center gap-1.5 transition-colors shrink-0"
        >
          {busy ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Flame className="w-3.5 h-3.5" />
          )}
          <span>
            Shred {selected.size} Items Permanently ({passes}-Pass)
          </span>
        </button>
      </div>
    </div>
  );
}
