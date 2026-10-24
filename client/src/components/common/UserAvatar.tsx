import React, { useState } from 'react';
import { getAvatarUrl } from '../../utils/avatarHelper';

export interface UserAvatarProps {
  user?: {
    name?: string | null;
    fullName?: string | null;
    profilePicture?: string | null;
    avatar?: string | null;
    speciesIdentity?: {
      avatarUrl?: string | null;
      slug?: string | null;
      commonName?: string | null;
    } | null;
    username?: string | null;
  } | null;
  src?: string | null;
  avatarUrl?: string | null;
  name?: string | null;
  username?: string | null;
  speciesSlug?: string | null;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | string;
  shape?: 'circle' | 'square' | 'neo';
  className?: string;
  borderClassName?: string;
  alt?: string;
  badge?: React.ReactNode;
}

const SIZE_STYLES: Record<string, { box: string; text: string }> = {
  xs: { box: 'w-6 h-6', text: 'text-[10px]' },
  sm: { box: 'w-8 h-8', text: 'text-xs' },
  md: { box: 'w-10 h-10', text: 'text-sm' },
  lg: { box: 'w-12 h-12', text: 'text-base' },
  xl: { box: 'w-16 h-16', text: 'text-xl' },
  '2xl': { box: 'w-24 h-24', text: 'text-3xl' },
};

export default function UserAvatar({
  user,
  src,
  avatarUrl,
  name,
  username,
  speciesSlug,
  size = 'md',
  shape = 'circle',
  className = '',
  borderClassName,
  alt,
  badge,
}: UserAvatarProps) {
  const [hasError, setHasError] = useState(false);

  const displayName = name || user?.fullName || user?.name || user?.username || 'User';
  const rawUsername = username || user?.username || null;
  const rawSpeciesSlug = speciesSlug || user?.speciesIdentity?.slug || null;
  const rawUrl = src || avatarUrl || user?.profilePicture || user?.avatar || user?.speciesIdentity?.avatarUrl || null;

  const resolvedUrl = getAvatarUrl(rawUrl, rawSpeciesSlug, rawUsername);

  const sizeStyle = SIZE_STYLES[size] || { box: size, text: 'text-sm' };

  let shapeClasses = 'rounded-full overflow-hidden';
  let defaultBorder = 'border-2 border-[#121316]';

  if (shape === 'square') {
    shapeClasses = 'rounded-none overflow-hidden';
    defaultBorder = 'border-2 border-[#121316] shadow-[1px_1px_0_#121316]';
  } else if (shape === 'neo') {
    shapeClasses = 'rounded-none overflow-hidden';
    defaultBorder = 'border-3 border-[#121316] shadow-[3px_3px_0_#121316]';
  }

  const initial = displayName
    .trim()
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'U';

  const finalBorder = borderClassName !== undefined ? borderClassName : defaultBorder;

  return (
    <div className={`relative inline-block flex-shrink-0 ${className}`}>
      <div
        className={`${sizeStyle.box} ${shapeClasses} ${finalBorder} bg-[#FFDD33] text-[#121316] flex items-center justify-center font-headline font-black ${sizeStyle.text} select-none transition-transform`}
      >
        {resolvedUrl && !hasError ? (
          <img
            src={resolvedUrl}
            alt={alt || displayName}
            onError={() => setHasError(true)}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <span>{initial}</span>
        )}
      </div>

      {badge && <div className="absolute -bottom-1 -right-1 z-10">{badge}</div>}
    </div>
  );
}
