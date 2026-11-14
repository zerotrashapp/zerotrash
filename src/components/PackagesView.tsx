import { Search, Loader2 } from 'lucide-react';
import type { ManagedPackage } from '../types';

interface Props {
  packages: ManagedPackage[];
  loading: boolean;
  managerFilter: string;
  onManagerChange: (m: string) => void;
  search: string;
  onSearchChange: (q: string) => void;
  onUninstall: (pkg: ManagedPackage) => void;
}

const MANAGERS = ['ALL', 'Homebrew Formula', 'Homebrew Cask', 'npm'];

export function PackagesView({
  packages,
  loading,
  managerFilter,
  onManagerChange,
  search,
  onSearchChange,
  onUninstall,
}: Props) {
  const filtered = packages.filter((p) => {
    if (managerFilter !== 'ALL' && p.manager !== managerFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="flex-1 flex flex-col bg-[#141416] overflow-hidden">
      <div className="px-5 py-3.5 border-b border-white/[0.07] bg-[#161618] flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-sm font-semibold text-white">Package Managers</h2>
          <p className="text-xs text-[#8e8e93] mt-0.5">
            Installed packages across Homebrew Cellar, Homebrew Caskroom, and global npm modules.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="relative w-56">
            <Search className="w-3.5 h-3.5 text-[#8e8e93] absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Filter packages..."
              className="w-full bg-[#1c1c1e] border border-white/[0.08] focus:border-[#0A84FF] rounded-lg pl-8 pr-2.5 py-1.5 text-xs text-white placeholder:text-[#8e8e93] outline-none transition-colors"
            />
          </div>

          <div className="flex items-center gap-0.5 bg-[#2c2c2e] p-0.5 rounded-[8px]">
            {MANAGERS.map((m) => (
              <button
                key={m}
                onClick={() => onManagerChange(m)}
                className={`px-2.5 py-1 rounded-[6px] text-[11px] font-medium transition-all ${
                  managerFilter === m
                    ? 'bg-[#48484a] text-white shadow-sm'
                    : 'text-[#8e8e93] hover:text-white'
                }`}
              >
                {m === 'ALL' ? 'All' : m}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="px-5 py-2 border-b border-white/[0.06] bg-[#18181b] grid grid-cols-12 text-[11px] font-medium text-[#8e8e93]">
        <div className="col-span-3">Package</div>
        <div className="col-span-2">Version</div>
        <div className="col-span-2">Manager</div>
        <div className="col-span-3">Command</div>
        <div className="col-span-2 text-right">Action</div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <div className="h-56 flex items-center justify-center gap-2 text-xs text-[#8e8e93]">
            <Loader2 className="w-4 h-4 animate-spin text-[#0A84FF]" />
            <span>Reading package directories...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="h-56 flex items-center justify-center text-xs text-[#8e8e93]">
            No matching packages found.
          </div>
        ) : (
          <div className="rounded-xl bg-[#1c1c1e] border border-white/[0.08] divide-y divide-white/[0.06] overflow-hidden shadow-sm">
            {filtered.map((pkg) => (
              <div
                key={pkg.id}
                className="px-4 py-2.5 grid grid-cols-12 items-center gap-3 hover:bg-white/[0.04] transition-colors"
              >
                <div className="col-span-3 font-mono text-xs font-medium text-white truncate">
                  {pkg.name}
                </div>
                <div className="col-span-2 font-mono text-xs text-[#ebebf5]/80 truncate tabular-nums">
                  {pkg.version}
                </div>
                <div className="col-span-2">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-[#2c2c2e] text-[#ebebf5]/80">
                    {pkg.manager}
                  </span>
                </div>
                <div className="col-span-3 font-mono text-[11px] text-[#8e8e93] truncate">
                  {pkg.uninstall_cmd}
                </div>
                <div className="col-span-2 flex justify-end">
                  <button
                    onClick={() => onUninstall(pkg)}
                    className="px-3 py-1 rounded-md bg-[#2c2c2e] hover:bg-[#FF453A]/20 hover:text-[#FF453A] text-[11px] font-medium text-white transition-colors"
                  >
                    Uninstall
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
