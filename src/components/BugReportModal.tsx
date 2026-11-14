import React, { useState } from 'react';
import {
  Bug,
  X,
  ExternalLink,
  Copy,
  Check,
  Cpu,
} from 'lucide-react';
import { APP_VERSION, DEFAULT_GITHUB_REPO } from './UpdateModal';
import { formatBytes } from '../bridge';
import type { SystemOverview, PerformanceSnapshot } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  overview: SystemOverview | null;
  perfSnapshot: PerformanceSnapshot | null;
}

export const BugReportModal: React.FC<Props> = ({
  isOpen,
  onClose,
  overview,
  perfSnapshot,
}) => {
  const [category, setCategory] = useState<string>('Bug / Crash');
  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [includeDiagnostics, setIncludeDiagnostics] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);

  if (!isOpen) return null;

  const repo = (() => {
    try {
      const saved = localStorage.getItem('zerotrash-github-repo');
      if (saved && saved.includes('/')) {
        return saved;
      }
      return DEFAULT_GITHUB_REPO;
    } catch {
      return DEFAULT_GITHUB_REPO;
    }
  })();

  const diagnosticsBlock = [
    `### System Diagnostics`,
    `- **ZeroTrash Version**: v${APP_VERSION}`,
    `- **OS**: ${overview ? `${overview.os_name} ${overview.os_version}` : 'macOS'}`,
    `- **Architecture**: ${overview?.architecture || 'arm64'}`,
    `- **CPU**: ${perfSnapshot?.cpu_brand || 'Apple Silicon'} (${perfSnapshot?.cpu_cores || 8} cores)`,
    `- **RAM**: ${
      perfSnapshot
        ? `${formatBytes(perfSnapshot.ram_used_bytes)} / ${formatBytes(perfSnapshot.ram_total_bytes)}`
        : 'N/A'
    }`,
    `- **Engine Mode**: ${overview?.engine_mode || 'Native Rust Engine'}`,
  ].join('\n');

  const fullMarkdownBody = [
    `### Category`,
    `${category}`,
    ``,
    `### Description & Steps to Reproduce`,
    description.trim() || '_Describe what happened and how to reproduce the issue..._',
    ``,
    includeDiagnostics ? diagnosticsBlock : '',
  ]
    .filter(Boolean)
    .join('\n');

  const issueTitle = title.trim()
    ? `[${category}] ${title.trim()}`
    : `[${category}] Issue in ZeroTrash v${APP_VERSION}`;

  const githubIssueUrl = `https://github.com/${repo}/issues/new?title=${encodeURIComponent(
    issueTitle
  )}&body=${encodeURIComponent(fullMarkdownBody)}`;

  const handleCopyReport = () => {
    navigator.clipboard.writeText(`${issueTitle}\n\n${fullMarkdownBody}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-lg rounded-2xl bg-[#1c1c1e] border border-white/15 shadow-2xl overflow-hidden text-white">
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#FF453A]/15 border border-[#FF453A]/30 flex items-center justify-center">
              <Bug className="w-5 h-5 text-[#FF453A]" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">
                Report a Bug or Feedback
              </h3>
              <p className="text-[11px] text-[#8e8e93]">
                Submit directly to github.com/{repo}/issues
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#8e8e93] hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {/* Category Pills */}
          <div>
            <label className="block text-[11px] font-semibold text-[#8e8e93] uppercase tracking-wider mb-1.5">
              Issue Category
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              {[
                'Bug / Crash',
                'Missed Leftover File',
                'UI / Display Issue',
                'Feature Request',
              ].map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`py-1.5 px-3 rounded-lg text-xs font-medium border text-left transition-all ${
                    category === cat
                      ? 'bg-[#0A84FF]/20 border-[#0A84FF] text-white'
                      : 'bg-white/[0.03] border-white/10 text-[#8e8e93] hover:text-white'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-[11px] font-semibold text-[#8e8e93] uppercase tracking-wider mb-1.5">
              Short Summary
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Leftover folder not detected for Adobe Creative Cloud"
              className="w-full px-3.5 py-2 rounded-xl bg-black/40 border border-white/15 text-xs text-white placeholder-[#8e8e93]/60 focus:outline-none focus:border-[#0A84FF]"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-[11px] font-semibold text-[#8e8e93] uppercase tracking-wider mb-1.5">
              Steps to Reproduce / Details
            </label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="1. Go to Uninstaller tab&#10;2. Select application...&#10;3. Describe what happened..."
              className="w-full px-3.5 py-2 rounded-xl bg-black/40 border border-white/15 text-xs text-white placeholder-[#8e8e93]/60 focus:outline-none focus:border-[#0A84FF] resize-none"
            />
          </div>

          {/* Attached Diagnostics Toggle */}
          <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-white flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-[#0A84FF]" />
                Include anonymized system specs (OS, CPU, RAM)
              </span>
              <input
                type="checkbox"
                checked={includeDiagnostics}
                onChange={(e) => setIncludeDiagnostics(e.target.checked)}
                className="rounded accent-[#0A84FF] cursor-pointer"
              />
            </div>
            {includeDiagnostics && (
              <div className="text-[10px] font-mono text-[#8e8e93] bg-black/30 p-2 rounded-lg border border-white/[0.06]">
                ZeroTrash v{APP_VERSION} · {overview?.os_name || 'macOS'}{' '}
                {overview?.os_version || ''} ({overview?.architecture || 'arm64'}) ·{' '}
                {perfSnapshot?.cpu_brand || 'Apple Silicon'}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2.5 pt-1">
            <a
              href={githubIssueUrl}
              target="_blank"
              rel="noreferrer"
              className="flex-1 py-2.5 px-4 rounded-xl bg-[#0A84FF] hover:bg-[#0070E0] text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-lg shadow-[#0A84FF]/25 transition-all"
            >
              <ExternalLink className="w-4 h-4" />
              Submit Issue on GitHub ({repo})
            </a>
            <button
              type="button"
              onClick={handleCopyReport}
              className="py-2.5 px-3.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] text-xs font-medium text-white flex items-center gap-1.5 transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-[#30D158]" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  Copy Report
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
