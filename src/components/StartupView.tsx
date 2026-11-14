import { FolderOpen, Search, Trash2, Loader2, Zap } from 'lucide-react';
import { ZeroTrashAPI } from '../bridge';
import type { StartupItem } from '../types';

interface Props {
  items: StartupItem[];
  loading: boolean;
  scopeFilter: string;
  onScopeChange: (scope: string) => void;
  search: string;
  onSearchChange: (q: string) => void;
  onToggleItem: (item: StartupItem) => void;
  onDeleteItem: (item: StartupItem) => void;
}

const SCOPES = [
  { id: 'ALL', label: 'All' },
  { id: 'HIGH_IMPACT', label: 'High Impact' },
  { id: 'LOADED', label: 'Active' },
  { id: 'User Agent', label: 'User Agents' },
  { id: 'System Agent', label: 'System Agents' },
  { id: 'System Daemon', label: 'Daemons' },
  { id: 'BROKEN', label: 'Missing Binary' },
];

function getImpactLevel(item: StartupItem): 'High' | 'Medium' | 'Low' {
  if ((item.run_at_load && item.keep_alive) || (item.is_loaded && item.pid)) {
    return 'High';
  }
  if (item.run_at_load || item.is_loaded) {
    return 'Medium';
  }
  return 'Low';
}

export function StartupView({
  items,
  loading,
  scopeFilter,
  onScopeChange,
  search,
  onSearchChange,
  onToggleItem,
  onDeleteItem,
}: Props) {
  const filtered = items.filter((s) => {
    if (scopeFilter === 'BROKEN' && s.binary_exists) return false;
    if (scopeFilter === 'LOADED' && !s.is_loaded) return false;
    if (scopeFilter === 'HIGH_IMPACT' && getImpactLevel(s) !== 'High') return false;
    if (
      scopeFilter !== 'ALL' &&
      scopeFilter !== 'BROKEN' &&
      scopeFilter !== 'LOADED' &&
      scopeFilter !== 'HIGH_IMPACT' &&
      s.scope !== scopeFilter
    ) {
      return false;
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        s.label.toLowerCase().includes(q) ||
        s.name.toLowerCase().includes(q) ||
        s.program.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const highImpactCount = items.filter((i) => getImpactLevel(i) === 'High').length;

  return (
    <div className="flex-1 flex flex-col bg-[#141416] overflow-hidden">
      <div className="px-5 py-3.5 border-b border-white/[0.07] bg-[#161618] flex items-center justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-white">
              Startup & Boot Speed Optimizer
            </h2>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#FF9F0A]/15 text-[#FF9F0A] border border-[#FF9F0A]/30 flex items-center gap-1">
              <Zap className="w-3 h-3" />
              {highImpactCount} High-Impact Boot Items
            </span>
          </div>
          <p className="text-xs text-[#8e8e93] mt-0.5">
            Disable heavy background agents and login services to accelerate startup time and reduce idle RAM usage.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="relative w-52">
            <Search className="w-3.5 h-3.5 text-[#8e8e93] absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Filter service or binary..."
              className="w-full bg-[#1c1c1e] border border-white/[0.08] focus:border-[#0A84FF] rounded-lg pl-8 pr-2.5 py-1.5 text-xs text-white placeholder:text-[#8e8e93] outline-none transition-colors"
            />
          </div>

          <div className="flex items-center gap-0.5 bg-[#2c2c2e] p-0.5 rounded-[8px]">
            {SCOPES.map((s) => (
              <button
                key={s.id}
                onClick={() => onScopeChange(s.id)}
                className={`px-2.5 py-1 rounded-[6px] text-[11px] font-medium transition-all ${
                  scopeFilter === s.id
                    ? 'bg-[#48484a] text-white shadow-sm'
                    : 'text-[#8e8e93] hover:text-white'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="px-5 py-2 border-b border-white/[0.06] bg-[#18181b] grid grid-cols-12 text-[11px] font-medium text-[#8e8e93]">
        <div className="col-span-4">Service / Label</div>
        <div className="col-span-3">Executable Target</div>
        <div className="col-span-2">Boot Impact</div>
        <div className="col-span-1">Status</div>
        <div className="col-span-2 text-right">Actions</div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <div className="h-56 flex items-center justify-center gap-2 text-xs text-[#8e8e93]">
            <Loader2 className="w-4 h-4 animate-spin text-[#0A84FF]" />
            <span>Evaluating startup services and boot impact...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="h-56 flex items-center justify-center text-xs text-[#8e8e93]">
            No matching startup services.
          </div>
        ) : (
          <div className="rounded-xl bg-[#1c1c1e] border border-white/[0.08] divide-y divide-white/[0.06] overflow-hidden shadow-sm">
            {filtered.map((item) => {
              const impact = getImpactLevel(item);
              return (
                <div
                  key={item.plist_path}
                  className="px-4 py-2.5 grid grid-cols-12 items-center gap-3 hover:bg-white/[0.04] transition-colors"
                >
                  <div className="col-span-4 min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-2 h-2 rounded-full shrink-0 ${
                          !item.binary_exists
                            ? 'bg-[#FF453A]'
                            : item.is_loaded
                            ? 'bg-[#30D158]'
                            : 'bg-[#636366]'
                        }`}
                      />
                      <span className="text-xs font-medium text-white truncate">
                        {item.name}
                      </span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#2c2c2e] text-[#8e8e93]">
                        {item.scope}
                      </span>
                    </div>
                    <div className="text-[11px] font-mono text-[#8e8e93] truncate pl-4 mt-0.5">
                      {item.label}
                    </div>
                  </div>

                  <div className="col-span-3 min-w-0">
                    <div className="text-[11px] font-mono text-[#ebebf5]/80 truncate">
                      {item.program}
                    </div>
                    {!item.binary_exists && (
                      <span className="text-[10px] font-mono text-[#FF453A]">
                        Target executable missing on disk
                      </span>
                    )}
                  </div>

                  <div className="col-span-2">
                    {impact === 'High' ? (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-[#FF453A]/15 text-[#FF453A] border border-[#FF453A]/30 font-semibold">
                        High Impact
                      </span>
                    ) : impact === 'Medium' ? (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-[#FF9F0A]/15 text-[#FF9F0A] border border-[#FF9F0A]/30">
                        Medium Impact
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-[#30D158]/15 text-[#30D158]">
                        Low Impact
                      </span>
                    )}
                  </div>

                  <div className="col-span-1">
                    {item.is_loaded ? (
                      <span className="text-[10px] font-mono text-[#30D158] tabular-nums">
                        {item.pid ? `PID ${item.pid}` : 'Active'}
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono text-[#8e8e93]">
                        Idle
                      </span>
                    )}
                  </div>

                  <div className="col-span-2 flex items-center justify-end gap-1.5">
                    <button
                      onClick={() => onToggleItem(item)}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
                        item.is_loaded
                          ? 'bg-[#2c2c2e] hover:bg-[#3a3a3c] text-white'
                          : 'bg-[#0A84FF]/20 hover:bg-[#0A84FF]/30 text-[#64D2FF]'
                      }`}
                    >
                      {item.is_loaded ? 'Disable' : 'Enable'}
                    </button>
                    <button
                      onClick={() => ZeroTrashAPI.revealInFileManager(item.plist_path)}
                      className="p-1.5 rounded-md hover:bg-[#2c2c2e] text-[#8e8e93] hover:text-white transition-colors"
                      title="Show in File Manager"
                    >
                      <FolderOpen className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDeleteItem(item)}
                      className="p-1.5 rounded-md hover:bg-[#FF453A]/20 text-[#8e8e93] hover:text-[#FF453A] transition-colors"
                      title="Remove Startup Entry"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
