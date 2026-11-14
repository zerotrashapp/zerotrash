import { FolderOpen, Search, CheckSquare, Square, Loader2 } from 'lucide-react';
import { ZeroTrashAPI, formatBytes } from '../bridge';
import type { SystemPlugin } from '../types';
import { AppIcon } from './AppIcon';

interface Props {
  plugins: SystemPlugin[];
  loading: boolean;
  kindFilter: string;
  onKindChange: (kind: string) => void;
  search: string;
  onSearchChange: (q: string) => void;
  selectedPaths: Set<string>;
  onTogglePath: (path: string) => void;
  onSetPaths: (paths: Set<string>) => void;
  onRemoveSelected: () => void;
}

const GROUPS = [
  { id: 'ALL', label: 'All' },
  { id: 'AUDIO', label: 'Audio (AU / VST / HAL)' },
  { id: 'SYSTEM', label: 'System & QuickLook' },
  { id: 'IDE', label: 'IDE Extensions' },
];

function matchesGroup(kind: string, group: string): boolean {
  if (group === 'ALL') return true;
  if (group === 'AUDIO') {
    return ['Audio Unit', 'VST3', 'VST', 'CLAP', 'CoreAudio HAL', 'AAX'].includes(kind);
  }
  if (group === 'SYSTEM') {
    return [
      'PreferencePane',
      'QuickLook',
      'ScreenSaver',
      'Spotlight',
      'Browser Plug-In',
      'Input Method',
    ].includes(kind);
  }
  if (group === 'IDE') {
    return kind.includes('Extension');
  }
  return true;
}

export function PluginsView({
  plugins,
  loading,
  kindFilter,
  onKindChange,
  search,
  onSearchChange,
  selectedPaths,
  onTogglePath,
  onSetPaths,
  onRemoveSelected,
}: Props) {
  const filtered = plugins.filter((p) => {
    if (!matchesGroup(p.kind, kindFilter)) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        p.name.toLowerCase().includes(q) ||
        p.bundle_id.toLowerCase().includes(q) ||
        p.kind.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const selectedBytes = plugins
    .filter((p) => selectedPaths.has(p.path))
    .reduce((sum, p) => sum + p.size_bytes, 0);

  return (
    <div className="flex-1 flex flex-col bg-[#141416] overflow-hidden">
      <div className="px-5 py-3.5 border-b border-white/[0.07] bg-[#161618] flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-sm font-semibold text-white">Plug-Ins & Extensions</h2>
          <p className="text-xs text-[#8e8e93] mt-0.5">
            Audio units (AU, VST3, VST, CoreAudio HAL), macOS preference panes, QuickLook generators, and IDE extensions.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="relative w-56">
            <Search className="w-3.5 h-3.5 text-[#8e8e93] absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Filter plug-ins or bundle ID..."
              className="w-full bg-[#1c1c1e] border border-white/[0.08] focus:border-[#0A84FF] rounded-lg pl-8 pr-2.5 py-1.5 text-xs text-white placeholder:text-[#8e8e93] outline-none transition-colors"
            />
          </div>

          <div className="flex items-center gap-0.5 bg-[#2c2c2e] p-0.5 rounded-[8px]">
            {GROUPS.map((g) => (
              <button
                key={g.id}
                onClick={() => onKindChange(g.id)}
                className={`px-2.5 py-1 rounded-[6px] text-[11px] font-medium transition-all ${
                  kindFilter === g.id
                    ? 'bg-[#48484a] text-white shadow-sm'
                    : 'text-[#8e8e93] hover:text-white'
                }`}
              >
                {g.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="px-5 py-2 border-b border-white/[0.06] bg-[#18181b] grid grid-cols-12 text-[11px] font-medium text-[#8e8e93]">
        <div className="col-span-4">Plug-In / Identifier</div>
        <div className="col-span-2">Type</div>
        <div className="col-span-2">Architecture / Scope</div>
        <div className="col-span-2">Modified</div>
        <div className="col-span-2 text-right">Size</div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <div className="h-56 flex items-center justify-center gap-2 text-xs text-[#8e8e93]">
            <Loader2 className="w-4 h-4 animate-spin text-[#0A84FF]" />
            <span>Scanning Audio Plug-Ins, QuickLook, PreferencePanes, and IDE extensions...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="h-56 flex items-center justify-center text-xs text-[#8e8e93]">
            No plug-ins found matching current filter.
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
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-[#2c2c2e] text-[#ebebf5]/80">
                      {item.kind}
                    </span>
                  </div>

                  <div className="col-span-2 flex items-center gap-1.5 font-mono text-[11px] text-[#ebebf5]/80">
                    <span>{item.architecture}</span>
                    <span className="text-[#636366]">·</span>
                    <span className="text-[#8e8e93]">{item.scope}</span>
                  </div>

                  <div className="col-span-2 text-[11px] text-[#8e8e93]">
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
            onClick={() => onSetPaths(new Set(filtered.map((p) => p.path)))}
            className="text-[#0A84FF] hover:underline font-medium"
          >
            Select All ({filtered.length})
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
          Move {selectedPaths.size} Plug-Ins to Trash ({formatBytes(selectedBytes)})
        </button>
      </div>
    </div>
  );
}
