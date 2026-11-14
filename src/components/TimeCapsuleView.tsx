import React, { useState } from 'react';
import {
  Archive,
  RotateCcw,
  Plus,
  Loader2,
  Sparkles,
  FolderOpen,
} from 'lucide-react';
import { ZeroTrashAPI, formatBytes } from '../bridge';
import type { AppCapsuleEntry, InstalledApp } from '../types';
import { AppIcon } from './AppIcon';

interface Props {
  capsules: AppCapsuleEntry[];
  apps: InstalledApp[];
  loading: boolean;
  onCreateCapsule: (appName: string, bundleId: string) => void;
  onRestoreCapsule: (capsuleId: string) => void;
}

export function TimeCapsuleView({
  capsules,
  apps,
  loading,
  onCreateCapsule,
  onRestoreCapsule,
}: Props) {
  const [selectedAppId, setSelectedAppId] = useState<string>('');

  const handleSnapshot = () => {
    const chosen = apps.find((a) => a.id === selectedAppId) || apps[0];
    if (chosen) {
      onCreateCapsule(chosen.name, chosen.bundle_id);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-[#141416] overflow-hidden">
      <div className="px-5 py-3.5 border-b border-white/[0.07] bg-[#161618] space-y-3">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2">
              <Archive className="w-4 h-4 text-[#30D158]" />
              <h2 className="text-sm font-semibold text-white">
                App Settings Time-Capsule
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#30D158]/15 text-[#30D158] border border-[#30D158]/30 flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5" />
                ZeroTrash Exclusive
              </span>
            </div>
            <p className="text-xs text-[#8e8e93] mt-0.5">
              Archive an app’s lightweight Preferences & Configs (.tar.gz) before uninstalling it — restore your exact setup months later in 1 click.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedAppId || apps[0]?.id || ''}
            onChange={(e) => setSelectedAppId(e.target.value)}
            className="flex-1 max-w-md px-3 py-2 rounded-xl bg-[#242426] border border-white/10 text-xs text-white outline-none"
          >
            {apps
              .filter((a) => !a.is_system)
              .map((a) => (
                <option key={a.id} value={a.id} className="bg-[#1c1c1e] text-white">
                  {a.name} ({a.bundle_id || 'Local App'})
                </option>
              ))}
          </select>

          <button
            onClick={handleSnapshot}
            disabled={apps.length === 0}
            className="px-4 py-2 rounded-xl bg-[#30D158] hover:bg-[#28b84c] text-black font-semibold text-xs flex items-center gap-1.5 transition-colors shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Settings Capsule</span>
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-2.5">
        {loading ? (
          <div className="h-64 flex flex-col items-center justify-center gap-2 text-xs text-[#8e8e93]">
            <Loader2 className="w-5 h-5 animate-spin text-[#30D158]" />
            <span>Loading saved App Settings Time-Capsules...</span>
          </div>
        ) : capsules.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center gap-2 text-center">
            <Archive className="w-8 h-8 text-[#8e8e93]/40" />
            <div className="text-sm font-medium text-white">
              No Settings Time-Capsules Created Yet
            </div>
            <div className="text-xs text-[#8e8e93] max-w-md">
              Pick any app above and click “Create Settings Capsule” to save a tiny backup of its preferences before deleting the heavy app bundle.
            </div>
          </div>
        ) : (
          capsules.map((cap) => {
            const matchedApp = apps.find(
              (a) => a.name.toLowerCase() === cap.app_name.toLowerCase()
            );
            return (
              <div
                key={cap.id}
                className="p-4 rounded-xl bg-[#1c1c1e] border border-white/[0.08] flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <AppIcon
                    path={matchedApp?.path || ''}
                    name={cap.app_name}
                    size="sm"
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-white">
                        {cap.app_name}
                      </span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-[#30D158]/15 text-[#30D158]">
                        {formatBytes(cap.size_bytes)}
                      </span>
                      <span className="text-[10px] text-[#8e8e93]">
                        {cap.created_at}
                      </span>
                    </div>
                    <div className="text-[10px] font-mono text-[#8e8e93] mt-0.5 truncate">
                      {cap.bundle_id || 'Local Preferences'} · {cap.original_paths.length} config path(s)
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => ZeroTrashAPI.revealInFileManager(cap.archive_path)}
                    className="p-2 rounded-lg bg-white/[0.05] hover:bg-white/[0.12] text-[#8e8e93] hover:text-white"
                    title="Reveal Archive"
                  >
                    <FolderOpen className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onRestoreCapsule(cap.id)}
                    className="px-3.5 py-1.5 rounded-lg bg-[#0A84FF] hover:bg-[#0070E0] text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Restore Settings</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
