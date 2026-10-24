import React, { useState } from 'react';
import { ShieldAlert, ExternalLink, MapPin } from 'lucide-react';
import type { SpeciesIdentity } from '../../types';
import { getAvatarUrl } from '../../utils/avatarHelper';
import { SpeciesCardModal } from '../species/SpeciesCardModal';

interface SpeciesBadgeProps {
  speciesIdentity?: SpeciesIdentity | null;
  username?: string;
  size?: 'sm' | 'md' | 'lg';
  showDetails?: boolean;
  onClick?: () => void;
  className?: string;
}

export default function SpeciesBadge({
  speciesIdentity,
  username,
  size = 'md',
  showDetails = false,
  onClick,
  className = '',
}: SpeciesBadgeProps) {
  const [modalOpen, setModalOpen] = useState(false);

  if (!speciesIdentity && !username) return null;

  const commonName = speciesIdentity?.commonName || 'Endangered Species';
  const speciesNumber = speciesIdentity?.speciesNumber || 1;
  const totalCount = speciesIdentity?.totalCount || 100;
  const category = speciesIdentity?.category || 'CRITICALLY_ENDANGERED';
  const avatarUrl = getAvatarUrl(speciesIdentity?.avatarUrl, speciesIdentity?.slug, username);
  const displayHandle = username ? `@${username}` : `@${speciesIdentity?.slug || 'species'}_${speciesNumber}`;

  const isCriticallyEndangered = category === 'CRITICALLY_ENDANGERED';

  const categoryColor = isCriticallyEndangered
    ? 'bg-[#F4002C] text-white'
    : category === 'ENDANGERED'
    ? 'bg-[#FE4E1A] text-white'
    : 'bg-[#FFDD33] text-[#121316]';

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      setModalOpen(true);
    }
  };

  return (
    <>
      {size === 'sm' ? (
        <span
          onClick={handleClick}
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-white border-2 border-[#121316] shadow-[2px_2px_0_#121316] rounded-md text-[11px] font-headline font-black uppercase text-[#121316] cursor-pointer hover:bg-[#FFDD33] transition-all ${className}`}
        >
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={commonName}
              className="w-4 h-4 rounded-full object-cover border border-[#121316]"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          ) : (
            <ShieldAlert className="w-3.5 h-3.5 text-[#FE4E1A]" />
          )}
          <span className="text-[#0F534A]">
            {commonName} #{speciesNumber}
          </span>
        </span>
      ) : (
        <div
          onClick={handleClick}
          className={`inline-flex flex-col gap-1.5 p-3.5 bg-white border-3 border-[#121316] shadow-[4px_4px_0_#121316] rounded-xl max-w-sm cursor-pointer hover:border-[#FE4E1A] hover:shadow-[5px_5px_0_#FE4E1A] transition-all group ${className}`}
        >
          <div className="flex items-center gap-3">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={commonName}
                className="w-11 h-11 rounded-full object-cover border-2 border-[#121316] shadow-[2px_2px_0_#FE4E1A] flex-shrink-0"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            ) : (
              <div className="w-11 h-11 rounded-full bg-[#FFDD33] border-2 border-[#121316] flex items-center justify-center font-black text-base shadow-[2px_2px_0_#FE4E1A]">
                <ShieldAlert className="w-6 h-6 text-[#FE4E1A]" />
              </div>
            )}

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-headline font-black text-xs text-[#121316] uppercase truncate flex items-center gap-1">
                  {commonName}
                  <ExternalLink className="w-3 h-3 text-[#FE4E1A] opacity-0 group-hover:opacity-100 transition-opacity" />
                </span>
                <span
                  className={`px-1.5 py-0.5 text-[9px] font-headline font-black uppercase border border-[#121316] ${categoryColor}`}
                >
                  #{speciesNumber} OF ~{totalCount}
                </span>
              </div>

              <div className="text-[11px] text-[#0F534A] font-bold tracking-wider truncate">
                {displayHandle}
              </div>
            </div>
          </div>

          {showDetails && speciesIdentity?.habitat && (
            <div className="mt-1 pt-2 border-t-2 border-dashed border-gray-200 text-[10px] text-gray-600 font-medium flex items-center gap-1.5">
              <MapPin className="w-3 h-3 text-[#FE4E1A] flex-shrink-0" />
              <span className="font-headline font-black uppercase text-[#121316]">HABITAT: </span>
              <span className="truncate">{speciesIdentity.habitat}</span>
            </div>
          )}
        </div>
      )}

      {/* Embedded Collectible Card Modal */}
      <SpeciesCardModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        speciesIdentity={speciesIdentity}
        username={username}
      />
    </>
  );
}
