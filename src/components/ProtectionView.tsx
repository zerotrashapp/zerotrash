import React from 'react';
import {
  FolderOpen,
  CheckSquare,
  Square,
  Loader2,
  Trash2,
} from 'lucide-react';
import { ZeroTrashAPI, formatBytes } from '../bridge';
import type { ProtectionSnapshot, StartupItem } from '../types';

interface Props {
  snapshot: ProtectionSnapshot | null;
  loading: boolean;
  selectedPrivacy: Set<string>;
  onTogglePrivacy: (path: string) => void;
  onSetPrivacy: (paths: Set<string>) => void;
  onCleanPrivacy: (permanent: boolean) => void;
  onRemoveFlaggedAgent: (item: StartupItem) => void;
}

export function ProtectionView({
  snapshot,
  loading,
  selectedPrivacy,
  onTogglePrivacy,
  onSetPrivacy,
  onCleanPrivacy,
  onRemoveFlaggedAgent,
}: Props) {
  const selectedBytes = snapshot
    ? snapshot.privacy_items
        .filter((i) => selectedPrivacy.has(i.path))
        .reduce((sum, i) => sum + i.size_bytes, 0)
    : 0;

  return (
    <div className="flex-1 flex flex-col bg-[#141416] overflow-hidden">
      <div className="px-5 py-3.5 border-b border-white/[0.07] bg-[#161618]">
        <h2 className="text-sm font-semibold text-white">Protection & Privacy</h2>
        <p className="text-xs text-[#8e8e93] mt-0.5">
          macOS security posture verification, persistence audit, and local privacy trace cleanup.
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-6">
        {loading || !snapshot ? (
          <div className="h-56 flex items-center justify-center gap-2 text-xs text-[#8e8e93]">
            <Loader2 className="w-4 h-4 animate-spin text-[#0A84FF]" />
            <span>Verifying SIP, Gatekeeper, FileVault, XProtect, and privacy traces...</span>
          </div>
        ) : (
          <>
            {/* 1. macOS Security Posture */}
            <div className="space-y-2.5">
              <div className="text-xs font-semibold text-white">
                macOS Security Controls
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {snapshot.controls.map((ctrl) => (
                  <div
                    key={ctrl.id}
                    className="p-4 rounded-xl bg-[#1c1c1e] border border-white/[0.08] space-y-1.5 shadow-sm"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-medium text-white">{ctrl.name}</span>
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded-md border ${
                          ctrl.healthy
                            ? 'bg-[#30D158]/15 text-[#30D158] border-[#30D158]/30'
                            : 'bg-[#FF9F0A]/15 text-[#FF9F0A] border-[#FF9F0A]/30'
                        }`}
                      >
                        {ctrl.status}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#8e8e93] leading-relaxed">
                      {ctrl.details}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* 2. Flagged / Broken Persistence Agents */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-white">
                  Flagged Persistence & Orphaned Launchd Agents ({snapshot.flagged_persistence.length})
                </span>
              </div>

              {snapshot.flagged_persistence.length === 0 ? (
                <div className="p-4 rounded-xl bg-[#1c1c1e] border border-white/[0.08] text-xs text-[#8e8e93]">
                  No suspicious or broken persistence agents found in LaunchAgents or LaunchDaemons.
                </div>
              ) : (
                <div className="rounded-xl bg-[#1c1c1e] border border-white/[0.08] divide-y divide-white/[0.06] overflow-hidden shadow-sm">
                  {snapshot.flagged_persistence.map((agent) => (
                    <div
                      key={agent.plist_path}
                      className="px-4 py-2.5 flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-[#FF9F0A] shrink-0" />
                          <span className="text-xs font-mono font-medium text-white truncate">
                            {agent.label}
                          </span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-[#2c2c2e] text-[#ebebf5]/80">
                            {agent.scope}
                          </span>
                          {!agent.binary_exists && (
                            <span className="text-[10px] font-mono text-[#FF453A]">
                              Missing Target Executable
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] font-mono text-[#8e8e93] truncate mt-0.5">
                          {agent.program} ({agent.plist_path})
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => ZeroTrashAPI.revealInFileManager(agent.plist_path)}
                          className="p-1.5 rounded-md hover:bg-[#2c2c2e] text-[#8e8e93] hover:text-white transition-colors"
                          title="Show in Finder"
                        >
                          <FolderOpen className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onRemoveFlaggedAgent(agent)}
                          className="p-1.5 rounded-md hover:bg-[#FF453A]/20 text-[#8e8e93] hover:text-[#FF453A] transition-colors"
                          title="Remove plist"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 3. Privacy & Trash Traces */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-white">
                  Privacy Traces & Trash Bin
                </span>
                <div className="flex items-center gap-3 text-xs text-[#8e8e93]">
                  <button
                    onClick={() =>
                      onSetPrivacy(new Set(snapshot.privacy_items.map((p) => p.path)))
                    }
                    className="text-[#0A84FF] hover:underline font-medium"
                  >
                    Select All
                  </button>
                  <span>·</span>
                  <button
                    onClick={() => onSetPrivacy(new Set())}
                    className="hover:text-white"
                  >
                    Clear
                  </button>
                </div>
              </div>

              <div className="rounded-xl bg-[#1c1c1e] border border-white/[0.08] divide-y divide-white/[0.06] overflow-hidden shadow-sm">
                {snapshot.privacy_items.map((item) => {
                  const checked = selectedPrivacy.has(item.path);
                  return (
                    <div
                      key={item.path}
                      onClick={() => onTogglePrivacy(item.path)}
                      className={`px-4 py-3 flex items-center justify-between gap-3 cursor-pointer transition-colors ${
                        checked ? 'bg-[#0A84FF]/15' : 'hover:bg-white/[0.04]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {checked ? (
                          <CheckSquare className="w-4 h-4 text-[#0A84FF] shrink-0" />
                        ) : (
                          <Square className="w-4 h-4 text-[#636366] shrink-0" />
                        )}
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-white">
                              {item.name}
                            </span>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-[#2c2c2e] text-[#ebebf5]/80">
                              {item.category}
                            </span>
                          </div>
                          <div className="text-[11px] text-[#8e8e93] truncate mt-0.5">
                            {item.description} ({item.path})
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5 shrink-0">
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
            </div>
          </>
        )}
      </div>

      <div className="px-5 py-3 border-t border-white/[0.07] bg-[#1c1c1e] flex items-center justify-between">
        <div className="text-xs text-[#8e8e93]">
          <span className="font-mono text-white">{selectedPrivacy.size}</span> privacy items selected
        </div>

        <div className="flex items-center gap-2">
          <button
            disabled={selectedPrivacy.size === 0}
            onClick={() => onCleanPrivacy(true)}
            className="px-4 py-1.5 rounded-lg bg-[#FF453A] hover:bg-[#E0352B] disabled:opacity-40 text-xs font-semibold text-white shadow-sm transition-colors"
          >
            Permanently Erase Selected ({formatBytes(selectedBytes)})
          </button>
        </div>
      </div>
    </div>
  );
}
