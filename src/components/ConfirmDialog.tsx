import { Loader2 } from 'lucide-react';
import { formatBytes } from '../bridge';

export interface ConfirmState {
  open: boolean;
  title: string;
  subtitle: string;
  paths: string[];
  pidsToKill: number[];
  totalBytes: number;
  permanent: boolean;
  onSuccess?: () => void;
}

interface Props {
  state: ConfirmState | null;
  busy: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export function ConfirmDialog({ state, busy, onCancel, onConfirm }: Props) {
  if (!state || !state.open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-lg rounded-2xl bg-[#1c1c1e] border border-white/[0.12] shadow-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-white/[0.08]">
          <h3 className="text-sm font-semibold text-white">{state.title}</h3>
          <p className="text-xs text-[#8e8e93] mt-1">{state.subtitle}</p>
        </div>

        <div className="px-5 py-4 space-y-3">
          {state.pidsToKill.length > 0 && (
            <div className="px-3.5 py-2 rounded-lg bg-[#FF9F0A]/15 border border-[#FF9F0A]/30 text-xs text-[#FF9F0A]">
              Active processes ({state.pidsToKill.map((p) => `PID ${p}`).join(', ')}) will be
              terminated before removal.
            </div>
          )}

          <div className="flex items-center justify-between text-xs text-[#8e8e93]">
            <span>Selected paths ({state.paths.length})</span>
            <span className="font-mono text-white font-semibold tabular-nums">
              {formatBytes(state.totalBytes)}
            </span>
          </div>

          <div className="max-h-48 overflow-y-auto rounded-xl bg-[#141416] border border-white/[0.08] p-3 space-y-1 font-mono text-[11px] text-[#ebebf5]/80">
            {state.paths.map((p) => (
              <div key={p} className="truncate py-0.5">
                {p}
              </div>
            ))}
          </div>
        </div>

        <div className="px-5 py-3 border-t border-white/[0.08] bg-[#161618] flex items-center justify-end gap-2">
          <button
            disabled={busy}
            onClick={onCancel}
            className="px-3.5 py-1.5 rounded-lg bg-[#2c2c2e] hover:bg-[#3a3a3c] border border-white/[0.08] text-xs font-medium text-white transition-colors"
          >
            Cancel
          </button>
          <button
            disabled={busy}
            onClick={onConfirm}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold text-white flex items-center gap-1.5 shadow-sm transition-colors ${
              state.permanent
                ? 'bg-[#FF453A] hover:bg-[#E0352B]'
                : 'bg-[#0A84FF] hover:bg-[#0070E0]'
            }`}
          >
            {busy && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            <span>{state.permanent ? 'Delete Permanently' : 'Move to Trash'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
