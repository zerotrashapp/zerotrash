import React, { useEffect, useState } from 'react';

interface Props {
  path: string;
  name: string;
  size?: 'sm' | 'md' | 'lg';
}

export function AppIcon({ path, name, size = 'md' }: Props) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [path]);

  const dimClass =
    size === 'lg'
      ? 'w-14 h-14 rounded-2xl'
      : size === 'md'
      ? 'w-9 h-9 rounded-xl'
      : 'w-7 h-7 rounded-lg';

  const textClass =
    size === 'lg' ? 'text-base' : size === 'md' ? 'text-xs' : 'text-[10px]';

  if (failed || !path) {
    return (
      <div
        className={`${dimClass} bg-[#2c2c2e] border border-white/10 flex items-center justify-center ${textClass} font-semibold text-zinc-200 shrink-0 shadow-sm`}
      >
        {name.slice(0, 2).toUpperCase()}
      </div>
    );
  }

  const iconUrl = `/api/icon?path=${encodeURIComponent(path)}`;

  return (
    <img
      src={iconUrl}
      alt={name}
      loading="lazy"
      onError={() => setFailed(true)}
      className={`${dimClass} object-contain shrink-0 select-none drop-shadow-[0_2px_5px_rgba(0,0,0,0.45)]`}
    />
  );
}
