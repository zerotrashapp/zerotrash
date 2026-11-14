import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Search,
  ArrowRight,
  Gauge,
  AppWindow,
  Layers,
  FileSearch,
  Copy,
  RotateCcw,
  Power,
  Activity,
  ShieldCheck,
  FolderTree,
  HardDrive,
  Flame,
  Scissors,
  Puzzle,
  Package,
  Brain,
  Ghost,
  Radar,
  Archive,
} from 'lucide-react';
import { formatBytes } from '../bridge';
import type { InstalledApp } from '../types';
import { AppIcon } from './AppIcon';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  apps: InstalledApp[];
  onSelectSection: (section: any) => void;
  onInspectApp: (app: InstalledApp) => void;
}

const TOOL_ITEMS = [
  {
    id: 'smart',
    title: 'Smart Care (1-Click System Checkup)',
    keywords: 'smart scan clean junk overview checkup καθαρισμος ελεγχος',
    icon: Gauge,
    color: 'text-[#0A84FF]',
  },
  {
    id: 'apps',
    title: 'Application Uninstaller & Reset',
    keywords: 'uninstall apps remove delete reset εφαρμογες απεγκατασταση',
    icon: AppWindow,
    color: 'text-[#64D2FF]',
  },
  {
    id: 'orphans',
    title: 'Leftover Orphaned Files',
    keywords: 'leftovers orphans library plist cache υπολειμματα',
    icon: Layers,
    color: 'text-[#BF5AF2]',
  },
  {
    id: 'large',
    title: 'Large & Old Files (>20 MB)',
    keywords: 'large big old files dmg video zip μεγαλα αρχεια',
    icon: FileSearch,
    color: 'text-[#FF9F0A]',
  },
  {
    id: 'duplicates',
    title: 'Duplicate File Finder',
    keywords: 'duplicates identical copies διπλοτυπα αντιγραφα',
    icon: Copy,
    color: 'text-[#BF5AF2]',
  },
  {
    id: 'history',
    title: 'Trash & Put Back (Undo)',
    keywords: 'trash undo restore put back καδος επαναφορα',
    icon: RotateCcw,
    color: 'text-[#30D158]',
  },
  {
    id: 'startup',
    title: 'Startup & Boot Speed Optimizer',
    keywords: 'startup boot launchd agents daemons εκκινηση ταχυτητα',
    icon: Power,
    color: 'text-[#FFD60A]',
  },
  {
    id: 'maintenance',
    title: 'Maintenance, Caches, DNS & Battery',
    keywords: 'maintenance dns ram spotlight battery caches συντηρηση μπαταρια',
    icon: Activity,
    color: 'text-[#FF9F0A]',
  },
  {
    id: 'protection',
    title: 'Protection, Security & Privacy',
    keywords: 'protection security privacy gatekeeper filevault προστασια απορρητο',
    icon: ShieldCheck,
    color: 'text-[#30D158]',
  },
  {
    id: 'lens',
    title: 'Space Lens (Visual Folder Map)',
    keywords: 'space lens treemap folders storage φακελοι χωρος',
    icon: FolderTree,
    color: 'text-[#30D158]',
  },
  {
    id: 'storage',
    title: 'Application Storage Footprint',
    keywords: 'footprint disk usage size storage αποτυπωμα',
    icon: HardDrive,
    color: 'text-[#64D2FF]',
  },
  {
    id: 'shredder',
    title: 'Secure File Shredder (DoD 5220.22-M)',
    keywords: 'shredder permanent delete overwrite erase καταστροφεας οριστικη διαγραφη',
    icon: Flame,
    color: 'text-[#FF453A]',
  },
  {
    id: 'universal',
    title: 'Universal Binary Slimmer (Apple Silicon)',
    keywords: 'universal slimmer intel x86_64 arm64 lipo',
    icon: Scissors,
    color: 'text-[#BF5AF2]',
  },
  {
    id: 'plugins',
    title: 'Plug-Ins & Audio Extensions (VST/AU)',
    keywords: 'plugins audio vst au quicklook extensions ηχος',
    icon: Puzzle,
    color: 'text-[#5E5CE6]',
  },
  {
    id: 'packages',
    title: 'Developer Packages (Homebrew / npm / pip)',
    keywords: 'packages homebrew brew npm pip cargo πακετα',
    icon: Package,
    color: 'text-[#30D158]',
  },
  {
    id: 'ai_vault',
    title: 'AI, LLM & GPU Cache Vault',
    keywords: 'ai llm ollama huggingface lmstudio pytorch whisper claude chatgpt cursor',
    icon: Brain,
    color: 'text-[#BF5AF2]',
  },
  {
    id: 'ghost_space',
    title: 'Ghost Space Hunter (Docker / iPhone Backups / VM)',
    keywords: 'ghost space docker iphone backup mobilesync xcode purgeable',
    icon: Ghost,
    color: 'text-[#64D2FF]',
  },
  {
    id: 'telemetry',
    title: 'Telemetry & Crash-Reporter Shield',
    keywords: 'telemetry crashpad sentry keystone diagnostic reports',
    icon: Radar,
    color: 'text-[#FF9F0A]',
  },
  {
    id: 'time_capsule',
    title: 'App Settings Time-Capsule',
    keywords: 'time capsule settings backup preferences archive restore',
    icon: Archive,
    color: 'text-[#30D158]',
  },
];

export const CommandPaletteModal: React.FC<Props> = ({
  isOpen,
  onClose,
  apps,
  onSelectSection,
  onInspectApp,
}) => {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setTimeout(() => inputRef.current?.focus(), 40);
    }
  }, [isOpen]);

  const filteredTools = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return TOOL_ITEMS.slice(0, 6);
    return TOOL_ITEMS.filter(
      (t) =>
        t.title.toLowerCase().includes(q) || t.keywords.toLowerCase().includes(q)
    );
  }, [query]);

  const filteredApps = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return apps.slice(0, 5);
    return apps
      .filter(
        (a) =>
          a.name.toLowerCase().includes(q) ||
          a.bundle_id.toLowerCase().includes(q)
      )
      .slice(0, 8);
  }, [query, apps]);

  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/65 backdrop-blur-md flex items-start justify-center pt-20 p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xl rounded-2xl bg-[#1c1c1e] border border-white/15 shadow-2xl overflow-hidden text-white"
      >
        {/* Search Input Bar */}
        <div className="px-4 py-3.5 border-b border-white/10 flex items-center gap-3 bg-white/[0.02]">
          <Search className="w-4 h-4 text-[#0A84FF] shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search any tool (e.g. Duplicates, DNS, Shredder) or app name..."
            className="flex-1 bg-transparent text-xs text-white placeholder-[#8e8e93] outline-none"
          />
          <button
            onClick={onClose}
            className="px-1.5 py-0.5 rounded bg-white/10 text-[10px] text-[#8e8e93] hover:text-white font-mono"
          >
            ESC
          </button>
        </div>

        {/* Results */}
        <div className="max-h-96 overflow-y-auto p-3 space-y-4">
          {filteredTools.length > 0 && (
            <div>
              <div className="px-2 pb-1.5 text-[10px] font-semibold text-[#8e8e93] uppercase tracking-wider">
                Tools & Actions
              </div>
              <div className="space-y-1">
                {filteredTools.map((tool) => {
                  const Icon = tool.icon;
                  return (
                    <button
                      key={tool.id}
                      onClick={() => {
                        onSelectSection(tool.id);
                        onClose();
                      }}
                      className="w-full px-3 py-2 rounded-xl hover:bg-[#0A84FF] text-left flex items-center justify-between group transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon
                          className={`w-4 h-4 ${tool.color} group-hover:text-white`}
                        />
                        <span className="text-xs font-medium text-white">
                          {tool.title}
                        </span>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-[#8e8e93] group-hover:text-white" />
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {filteredApps.length > 0 && (
            <div>
              <div className="px-2 pb-1.5 text-[10px] font-semibold text-[#8e8e93] uppercase tracking-wider">
                Installed Applications (Click to Deep Inspect & Uninstall)
              </div>
              <div className="space-y-1">
                {filteredApps.map((app) => (
                  <button
                    key={app.id}
                    onClick={() => {
                      onSelectSection('apps');
                      onInspectApp(app);
                      onClose();
                    }}
                    className="w-full px-3 py-2 rounded-xl hover:bg-white/[0.08] text-left flex items-center justify-between transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <AppIcon
                        path={app.path}
                        name={app.name}
                        size="sm"
                      />
                      <div className="min-w-0">
                        <div className="text-xs font-medium text-white truncate">
                          {app.name}
                        </div>
                        <div className="text-[10px] text-[#8e8e93] font-mono truncate">
                          {app.bundle_id}
                        </div>
                      </div>
                    </div>
                    <span className="text-xs font-mono text-[#64D2FF] shrink-0 ml-3">
                      {formatBytes(app.total_size_bytes)}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
