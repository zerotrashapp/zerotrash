import { useState } from 'react';
import { formatBytes } from '../bridge';
import type { InstalledApp } from '../types';
import { AppIcon } from './AppIcon';

interface Props {
  apps: InstalledApp[];
  onInspectApp: (app: InstalledApp) => void;
}

export function StorageView({ apps, onInspectApp }: Props) {
  const [sortKey, setSortKey] = useState<'total' | 'library'>('total');

  const sorted = [...apps]
    .filter((a) => !a.is_system)
    .sort((a, b) =>
      sortKey === 'total'
        ? b.total_size_bytes - a.total_size_bytes
        : b.leftovers_size_bytes - a.leftovers_size_bytes
    );

  const maxBytes = sorted[0]?.total_size_bytes || 1;

  return (
    <div className="flex-1 flex flex-col bg-[#141416] overflow-hidden">
      <div className="px-5 py-3.5 border-b border-white/[0.07] bg-[#161618] flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-sm font-semibold text-white">Application Footprint Breakdown</h2>
          <p className="text-xs text-[#8e8e93] mt-0.5">
            Comparison of application bundle size against associated ~/Library caches and support data.
          </p>
        </div>

        <div className="flex items-center gap-4 text-xs text-[#8e8e93]">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#0A84FF]" />
            <span>App Bundle</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#FF9F0A]" />
            <span>Library Data</span>
          </div>

          <div className="flex items-center gap-0.5 bg-[#2c2c2e] p-0.5 rounded-[8px]">
            <button
              onClick={() => setSortKey('total')}
              className={`px-2.5 py-1 rounded-[6px] text-[11px] font-medium transition-all ${
                sortKey === 'total'
                  ? 'bg-[#48484a] text-white shadow-sm'
                  : 'text-[#8e8e93] hover:text-white'
              }`}
            >
              By Total Size
            </button>
            <button
              onClick={() => setSortKey('library')}
              className={`px-2.5 py-1 rounded-[6px] text-[11px] font-medium transition-all ${
                sortKey === 'library'
                  ? 'bg-[#48484a] text-white shadow-sm'
                  : 'text-[#8e8e93] hover:text-white'
              }`}
            >
              By Library Data
            </button>
          </div>
        </div>
      </div>

      <div className="px-5 py-2 border-b border-white/[0.06] bg-[#18181b] grid grid-cols-12 text-[11px] font-medium text-[#8e8e93]">
        <div className="col-span-3">Application</div>
        <div className="col-span-5">Footprint Distribution</div>
        <div className="col-span-2 text-right">Library Data</div>
        <div className="col-span-2 text-right">Total Size</div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="rounded-xl bg-[#1c1c1e] border border-white/[0.08] divide-y divide-white/[0.06] overflow-hidden shadow-sm">
          {sorted.slice(0, 40).map((app) => {
            const totalPct = Math.max(2, (app.total_size_bytes / maxBytes) * 100);
            const libShare =
              app.total_size_bytes > 0
                ? (app.leftovers_size_bytes / app.total_size_bytes) * 100
                : 0;
            const appWidth = (totalPct * (100 - libShare)) / 100;
            const libWidth = (totalPct * libShare) / 100;

            return (
              <div
                key={app.path}
                onClick={() => onInspectApp(app)}
                className="px-4 py-2.5 grid grid-cols-12 items-center gap-3 hover:bg-white/[0.04] cursor-pointer transition-colors"
              >
                <div className="col-span-3 flex items-center gap-2.5 min-w-0">
                  <AppIcon path={app.path} name={app.name} size="sm" />
                  <div className="min-w-0">
                    <div className="text-xs font-medium text-white truncate">{app.name}</div>
                    <div className="text-[11px] font-mono text-[#8e8e93] truncate">
                      {app.bundle_id}
                    </div>
                  </div>
                </div>

                <div className="col-span-5">
                  <div className="w-full h-2 bg-[#2c2c2e] rounded-full overflow-hidden flex gap-[1px]">
                    <div
                      className="h-full bg-[#0A84FF]"
                      style={{ width: `${Math.max(1, appWidth)}%` }}
                    />
                    {app.leftovers_size_bytes > 0 && (
                      <div
                        className="h-full bg-[#FF9F0A]"
                        style={{ width: `${Math.max(1, libWidth)}%` }}
                      />
                    )}
                  </div>
                </div>

                <div className="col-span-2 text-right font-mono text-xs text-[#FF9F0A] tabular-nums">
                  {app.leftovers_size_bytes > 0 ? formatBytes(app.leftovers_size_bytes) : '—'}
                </div>

                <div className="col-span-2 text-right font-mono text-xs font-semibold text-white tabular-nums">
                  {formatBytes(app.total_size_bytes)}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
