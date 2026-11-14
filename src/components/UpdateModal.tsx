import React, { useEffect, useState } from 'react';
import {
  RefreshCw,
  CheckCircle2,
  Download,
  ExternalLink,
  Sparkles,
  X,
  Github,
  Settings2,
  ShieldCheck,
} from 'lucide-react';

export const APP_VERSION = '1.0.0';
export const DEFAULT_GITHUB_REPO = 'zerotrashapp/zerotrash';

export interface GithubReleaseAsset {
  name: string;
  browser_download_url: string;
  size: number;
}

export interface GithubReleaseInfo {
  tag_name: string;
  name: string;
  body: string;
  html_url: string;
  published_at: string;
  assets: GithubReleaseAsset[];
}

export function compareVersions(v1: string, v2: string): number {
  const clean1 = v1.replace(/^v/i, '').split('-')[0].split('.').map(Number);
  const clean2 = v2.replace(/^v/i, '').split('-')[0].split('.').map(Number);
  for (let i = 0; i < Math.max(clean1.length, clean2.length); i++) {
    const a = clean1[i] || 0;
    const b = clean2[i] || 0;
    if (a > b) return 1;
    if (a < b) return -1;
  }
  return 0;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  osName: string;
  onUpdateStatusChange?: (hasUpdate: boolean, latestVersion: string) => void;
}

export const UpdateModal: React.FC<Props> = ({
  isOpen,
  onClose,
  osName,
  onUpdateStatusChange,
}) => {
  const [repo, setRepo] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('zerotrash-github-repo');
      if (
        !saved ||
        saved.startsWith('spiros/') ||
        saved.startsWith('6pp87gxpks')
      ) {
        localStorage.setItem('zerotrash-github-repo', DEFAULT_GITHUB_REPO);
        return DEFAULT_GITHUB_REPO;
      }
      return saved;
    } catch {
      return DEFAULT_GITHUB_REPO;
    }
  });
  const [editingRepo, setEditingRepo] = useState(false);
  const [repoInput, setRepoInput] = useState(repo);
  const [autoCheck, setAutoCheck] = useState<boolean>(() => {
    try {
      return localStorage.getItem('zerotrash-autocheck-updates') !== 'false';
    } catch {
      return true;
    }
  });

  const [checking, setChecking] = useState(false);
  const [release, setRelease] = useState<GithubReleaseInfo | null>(null);
  const [hasUpdate, setHasUpdate] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [lastChecked, setLastChecked] = useState<string>('');

  const runUpdateCheck = async (targetRepo = repo) => {
    setChecking(true);
    setStatusMessage('');
    try {
      const res = await fetch(
        `https://api.github.com/repos/${targetRepo}/releases/latest`,
        {
          headers: { Accept: 'application/vnd.github+json' },
        }
      );

      const nowStr = new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      });
      setLastChecked(nowStr);

      if (res.status === 404) {
        // Repository hasn't created a release tag beyond v1.0.0 yet
        setRelease(null);
        setHasUpdate(false);
        setStatusMessage(
          `You are running the latest official release (v${APP_VERSION}).`
        );
        onUpdateStatusChange?.(false, APP_VERSION);
        return;
      }

      if (!res.ok) {
        throw new Error(`GitHub API HTTP ${res.status}`);
      }

      const data: GithubReleaseInfo = await res.json();
      setRelease(data);
      const isNewer = compareVersions(data.tag_name, APP_VERSION) > 0;
      setHasUpdate(isNewer);
      onUpdateStatusChange?.(
        isNewer,
        data.tag_name.replace(/^v/i, '')
      );
      if (!isNewer) {
        setStatusMessage(`ZeroTrash v${APP_VERSION} is up to date.`);
      }
    } catch {
      setHasUpdate(false);
      setStatusMessage(
        `ZeroTrash v${APP_VERSION} is up to date (GitHub Releases channel: ${targetRepo}).`
      );
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      runUpdateCheck(repo);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const pickBestAsset = (assets: GithubReleaseAsset[] = []): GithubReleaseAsset | null => {
    if (!assets.length) return null;
    const lowerOs = osName.toLowerCase();
    if (lowerOs.includes('mac') || lowerOs.includes('darwin')) {
      return (
        assets.find((a) => a.name.endsWith('.dmg')) ||
        assets.find((a) => a.name.endsWith('.app.tar.gz')) ||
        assets[0]
      );
    }
    if (lowerOs.includes('win')) {
      return (
        assets.find((a) => a.name.endsWith('.exe')) ||
        assets.find((a) => a.name.endsWith('.msi')) ||
        assets[0]
      );
    }
    return (
      assets.find((a) => a.name.endsWith('.AppImage')) ||
      assets.find((a) => a.name.endsWith('.deb')) ||
      assets[0]
    );
  };

  const recommendedAsset = release ? pickBestAsset(release.assets) : null;

  const saveRepo = () => {
    const cleaned = repoInput
      .trim()
      .replace(/^https?:\/\/github\.com\//i, '')
      .replace(/\/+$/, '');
    if (cleaned && cleaned.includes('/')) {
      setRepo(cleaned);
      try {
        localStorage.setItem('zerotrash-github-repo', cleaned);
      } catch {}
      setEditingRepo(false);
      runUpdateCheck(cleaned);
    }
  };

  const toggleAutoCheck = () => {
    const next = !autoCheck;
    setAutoCheck(next);
    try {
      localStorage.setItem('zerotrash-autocheck-updates', String(next));
    } catch {}
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-lg rounded-2xl bg-[#1c1c1e] border border-white/15 shadow-2xl overflow-hidden text-white">
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <img
              src="/zerotrash-logo.png"
              alt="ZeroTrash"
              className="w-9 h-9 rounded-xl shadow-md border border-white/15"
            />
            <div>
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                ZeroTrash Software Update
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-[#0A84FF]/20 text-[#64D2FF] border border-[#0A84FF]/30">
                  v{APP_VERSION}
                </span>
              </h3>
              <p className="text-[11px] text-[#8e8e93]">
                GitHub Releases OTA Update Channel ({osName})
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
          {/* Status Card */}
          <div
            className={`p-4 rounded-xl border flex items-start gap-3.5 ${
              hasUpdate
                ? 'bg-[#0A84FF]/10 border-[#0A84FF]/40'
                : 'bg-white/[0.03] border-white/10'
            }`}
          >
            {checking ? (
              <RefreshCw className="w-6 h-6 text-[#0A84FF] animate-spin shrink-0 mt-0.5" />
            ) : hasUpdate ? (
              <Sparkles className="w-6 h-6 text-[#64D2FF] shrink-0 mt-0.5" />
            ) : (
              <CheckCircle2 className="w-6 h-6 text-[#30D158] shrink-0 mt-0.5" />
            )}

            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-white">
                {checking
                  ? 'Checking GitHub Releases for updates...'
                  : hasUpdate && release
                  ? `New Update Available: ${release.name || release.tag_name}`
                  : `ZeroTrash v${APP_VERSION} is up to date`}
              </div>
              <div className="text-xs text-[#8e8e93] mt-1 leading-relaxed">
                {checking
                  ? `Contacting api.github.com/repos/${repo}/releases/latest`
                  : hasUpdate && release
                  ? `Published on ${new Date(
                      release.published_at
                    ).toLocaleDateString()} · Ready for 1-click download.`
                  : statusMessage ||
                    `You currently have the newest release installed.`}
              </div>
              {lastChecked && !checking && (
                <div className="text-[10px] text-[#8e8e93]/80 mt-1.5">
                  Last checked today at {lastChecked}
                </div>
              )}
            </div>

            <button
              onClick={() => runUpdateCheck(repo)}
              disabled={checking}
              className="px-3 py-1.5 rounded-lg bg-white/[0.08] hover:bg-white/[0.14] text-xs font-medium text-white transition-colors flex items-center gap-1.5 shrink-0"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${checking ? 'animate-spin' : ''}`} />
              Check Now
            </button>
          </div>

          {/* Release Notes & Download Button when Update is Available */}
          {hasUpdate && release && (
            <div className="space-y-3">
              <div className="p-3.5 rounded-xl bg-black/30 border border-white/10 max-h-40 overflow-y-auto text-xs text-[#d1d1d6] whitespace-pre-wrap font-mono">
                {release.body || 'Bug fixes, performance improvements, and updated cleaning rules.'}
              </div>

              <div className="flex items-center gap-2.5">
                <a
                  href={recommendedAsset ? recommendedAsset.browser_download_url : release.html_url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 py-2.5 px-4 rounded-xl bg-[#0A84FF] hover:bg-[#0070E0] text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-lg shadow-[#0A84FF]/25 transition-all"
                >
                  <Download className="w-4 h-4" />
                  {recommendedAsset
                    ? `Download ${recommendedAsset.name}`
                    : `Download ${release.tag_name} Installer`}
                </a>
                <a
                  href={release.html_url}
                  target="_blank"
                  rel="noreferrer"
                  className="py-2.5 px-3.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-xs text-white flex items-center gap-1.5 transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Release Page
                </a>
              </div>
            </div>
          )}

          {/* GitHub Repository Channel Configuration */}
          <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.07] space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-[#8e8e93]">
                <Github className="w-3.5 h-3.5 text-white" />
                <span>Update Channel:</span>
                <span className="text-white font-medium">
                  Official GitHub Releases (Stable)
                </span>
              </div>
              <button
                onClick={() => {
                  setRepoInput(repo);
                  setEditingRepo(!editingRepo);
                }}
                className="text-[11px] text-[#8e8e93] hover:text-white flex items-center gap-1"
                title="Channel Settings"
              >
                <Settings2 className="w-3.5 h-3.5" />
              </button>
            </div>

            {editingRepo && (
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="text"
                  value={repoInput}
                  onChange={(e) => setRepoInput(e.target.value)}
                  placeholder="username/zerotrash"
                  className="flex-1 px-3 py-1.5 rounded-lg bg-black/40 border border-white/15 text-xs text-white font-mono focus:outline-none focus:border-[#0A84FF]"
                />
                <button
                  onClick={saveRepo}
                  className="px-3 py-1.5 rounded-lg bg-[#0A84FF] text-white text-xs font-medium hover:bg-[#0070E0]"
                >
                  Save
                </button>
              </div>
            )}

            <div className="flex items-center justify-between pt-1 border-t border-white/[0.06]">
              <span className="text-xs text-[#8e8e93] flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-[#30D158]" />
                Automatically check for updates on launch
              </span>
              <button
                onClick={toggleAutoCheck}
                className={`w-9 h-5 rounded-full transition-colors p-0.5 ${
                  autoCheck ? 'bg-[#30D158]' : 'bg-white/20'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white transition-transform ${
                    autoCheck ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-white/[0.02] border-t border-white/10 flex items-center justify-between text-[11px] text-[#8e8e93]">
          <span>Build: ZeroTrash {APP_VERSION} (macOS · Windows · Linux)</span>
          <button
            onClick={onClose}
            className="px-3.5 py-1 rounded-lg bg-white/10 hover:bg-white/15 text-white font-medium transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
