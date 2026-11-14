import { HardDrive } from 'lucide-react';
import { formatBytes } from '../bridge';
import type { SystemOverview } from '../types';

interface Props {
  overview: SystemOverview | null;
  appsBytes: number;
  cachesBytes: number;
  pluginsBytes: number;
  onSelectCategory?: (section: any) => void;
  compact?: boolean;
}

export function StorageMultiBar({
  overview,
  appsBytes,
  cachesBytes,
  pluginsBytes,
  onSelectCategory,
  compact = false,
}: Props) {
  if (!overview || !overview.total_disk_bytes) return null;

  const total = overview.total_disk_bytes;
  const used = overview.used_disk_bytes;
  const free = overview.free_disk_bytes;

  const appsPct = Math.max(1.5, Math.min(60, (appsBytes / total) * 100));
  const cachesPct = Math.max(1.2, Math.min(35, (cachesBytes / total) * 100));
  const pluginsPct = pluginsBytes > 0 ? Math.max(0.8, Math.min(15, (pluginsBytes / total) * 100)) : 0;
  const usedTotalPct = Math.min(98, (used / total) * 100);
  const systemOtherPct = Math.max(2, usedTotalPct - appsPct - cachesPct - pluginsPct);
  const systemOtherBytes = Math.max(0, used - appsBytes - cachesBytes - pluginsBytes);

  return (
    <div
      className={`rounded-xl bg-[#1c1c1e] border border-white/[0.08] ${
        compact ? 'px-4 py-3' : 'p-4'
      } shadow-sm`}
    >
      <div className="flex items-center justify-between text-xs mb-2">
        <div className="flex items-center gap-2">
          <HardDrive className="w-3.5 h-3.5 text-[#8e8e93]" />
          <span className="font-semibold text-white">{overview.hostname}</span>
          <span className="text-[#8e8e93] font-mono text-[11px]">APFS Volume</span>
        </div>
        <div className="text-[12px] text-[#ebebf5]/70 font-mono tabular-nums">
          <span className="text-white font-medium">{formatBytes(used)}</span> of{' '}
          {formatBytes(total)} used ·{' '}
          <span className="text-[#30D158] font-medium">{formatBytes(free)} available</span>
        </div>
      </div>

      {/* Multi-segment macOS Sequoia Storage Bar */}
      <div className="w-full h-3 bg-[#2c2c2e] rounded-full overflow-hidden flex gap-[1.5px] p-[1.5px]">
        <div
          onClick={() => onSelectCategory?.('apps')}
          style={{ width: `${appsPct}%` }}
          className="h-full bg-[#0A84FF] first:rounded-l-full hover:brightness-110 cursor-pointer transition-all"
          title={`Applications: ${formatBytes(appsBytes)}`}
        />
        <div
          onClick={() => onSelectCategory?.('maintenance')}
          style={{ width: `${cachesPct}%` }}
          className="h-full bg-[#FF9F0A] hover:brightness-110 cursor-pointer transition-all"
          title={`Caches & App Data: ${formatBytes(cachesBytes)}`}
        />
        {pluginsPct > 0 && (
          <div
            onClick={() => onSelectCategory?.('plugins')}
            style={{ width: `${pluginsPct}%` }}
            className="h-full bg-[#BF5AF2] hover:brightness-110 cursor-pointer transition-all"
            title={`Plug-Ins & Audio: ${formatBytes(pluginsBytes)}`}
          />
        )}
        <div
          onClick={() => onSelectCategory?.('lens')}
          style={{ width: `${systemOtherPct}%` }}
          className="h-full bg-[#636366] rounded-r-sm hover:brightness-110 cursor-pointer transition-all"
          title={`macOS & User Files: ${formatBytes(systemOtherBytes)}`}
        />
      </div>

      {/* Legend */}
      <div className="flex items-center justify-between flex-wrap gap-3 mt-2.5 text-[11px]">
        <div className="flex items-center gap-4 flex-wrap">
          <button
            onClick={() => onSelectCategory?.('apps')}
            className="flex items-center gap-1.5 text-[#ebebf5]/80 hover:text-white transition-colors"
          >
            <span className="w-2 h-2 rounded-full bg-[#0A84FF]" />
            <span>Applications</span>
            <span className="font-mono text-[#8e8e93] tabular-nums">
              {formatBytes(appsBytes)}
            </span>
          </button>

          <button
            onClick={() => onSelectCategory?.('maintenance')}
            className="flex items-center gap-1.5 text-[#ebebf5]/80 hover:text-white transition-colors"
          >
            <span className="w-2 h-2 rounded-full bg-[#FF9F0A]" />
            <span>Caches & Support</span>
            <span className="font-mono text-[#8e8e93] tabular-nums">
              {formatBytes(cachesBytes)}
            </span>
          </button>

          {pluginsBytes > 0 && (
            <button
              onClick={() => onSelectCategory?.('plugins')}
              className="flex items-center gap-1.5 text-[#ebebf5]/80 hover:text-white transition-colors"
            >
              <span className="w-2 h-2 rounded-full bg-[#BF5AF2]" />
              <span>Plug-Ins</span>
              <span className="font-mono text-[#8e8e93] tabular-nums">
                {formatBytes(pluginsBytes)}
              </span>
            </button>
          )}

          <button
            onClick={() => onSelectCategory?.('lens')}
            className="flex items-center gap-1.5 text-[#ebebf5]/80 hover:text-white transition-colors"
          >
            <span className="w-2 h-2 rounded-full bg-[#636366]" />
            <span>macOS & User Data</span>
            <span className="font-mono text-[#8e8e93] tabular-nums">
              {formatBytes(systemOtherBytes)}
            </span>
          </button>
        </div>

        <div className="flex items-center gap-1.5 text-[#8e8e93]">
          <span className="w-2 h-2 rounded-full bg-[#2c2c2e] border border-white/15" />
          <span>Available</span>
          <span className="font-mono text-[#ebebf5] tabular-nums">{formatBytes(free)}</span>
        </div>
      </div>
    </div>
  );
}
