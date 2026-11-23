import React, { useId } from 'react';
import { ARTIFACTS } from '../game/data';
import { ArtifactId, ArtifactSlot, RelicId, WeaponId } from '../game/types';

export const TitleEmblemSvg: React.FC<{ className?: string }> = ({ className = 'w-12 h-12' }) => {
  const uid = useId();
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <defs>
        <linearGradient id={`${uid}-gold`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#FDE68A" />
          <stop offset="50%" stopColor="#D97706" />
          <stop offset="100%" stopColor="#78350F" />
        </linearGradient>
        <radialGradient id={`${uid}-eclipse`} cx="50%" cy="46%" r="50%">
          <stop offset="0%" stopColor="#09070F" />
          <stop offset="68%" stopColor="#1E102E" />
          <stop offset="100%" stopColor="#EA580C" />
        </radialGradient>
      </defs>
      {/* Outer iron-gold crest */}
      <polygon
        points="32,3 57,16 57,44 32,61 7,44 7,16"
        fill="#110E18"
        stroke={`url(#${uid}-gold)`}
        strokeWidth="2.4"
      />
      <polygon
        points="32,8 52,19 52,41 32,56 12,41 12,19"
        fill="none"
        stroke="rgba(251,191,36,0.28)"
        strokeWidth="1"
      />
      {/* Solar eclipse corona */}
      <circle cx="32" cy="30" r="14" fill="none" stroke="#F59E0B" strokeWidth="2.2" opacity="0.85" />
      <circle cx="32" cy="30" r="11.5" fill={`url(#${uid}-eclipse)`} />
      <path d="M23 23 A10 10 0 0 1 40 21" stroke="#FDE68A" strokeWidth="1.4" fill="none" opacity="0.7" />
      {/* Crossed blades piercing eclipse */}
      <path d="M17 47 L46 15 L49 14 L48 18 L20 49 Z" fill={`url(#${uid}-gold)`} stroke="#1F1307" strokeWidth="0.9" />
      <path d="M47 47 L18 15 L15 14 L16 18 L44 49 Z" fill="#CBD5E1" stroke="#0F172A" strokeWidth="0.9" />
      {/* Crown gem */}
      <polygon points="32,9 35.5,14 32,18 28.5,14" fill="#E11D48" stroke="#FDE68A" strokeWidth="0.9" />
    </svg>
  );
};

export const TreasureChestSvg: React.FC<{
  golden?: boolean;
  arcane?: boolean;
  className?: string;
}> = ({ golden = false, arcane = false, className = 'w-14 h-14' }) => {
  const uid = useId();
  const trim = arcane ? '#C084FC' : golden ? '#FBBF24' : '#B48844';
  const bodyDark = arcane ? '#1E1033' : golden ? '#3A1E08' : '#261710';
  const bodyLight = arcane ? '#4C1D95' : golden ? '#92400E' : '#4A2B18';
  const glow = arcane ? '#A855F7' : golden ? '#FDE047' : '#F59E0B';

  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <defs>
        <linearGradient id={`${uid}-wood`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={bodyLight} />
          <stop offset="100%" stopColor={bodyDark} />
        </linearGradient>
        <radialGradient id={`${uid}-aura`} cx="50%" cy="40%" r="55%">
          <stop offset="0%" stopColor={glow} stopOpacity="0.65" />
          <stop offset="100%" stopColor={glow} stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse cx="32" cy="30" rx="28" ry="20" fill={`url(#${uid}-aura)`} />
      {/* Base */}
      <path d="M10 30 H54 L51 54 H13 Z" fill={`url(#${uid}-wood)`} stroke={trim} strokeWidth="2.2" />
      <line x1="21" y1="30" x2="22" y2="54" stroke={trim} strokeWidth="2.2" />
      <line x1="43" y1="30" x2="42" y2="54" stroke={trim} strokeWidth="2.2" />
      {/* Open or closed lid */}
      {golden || arcane ? (
        <>
          <path d="M12 18 C16 10, 48 10, 52 18 L54 27 H10 Z" fill={`url(#${uid}-wood)`} stroke={trim} strokeWidth="2" />
          <rect x="13" y="27" width="38" height="4" fill={glow} opacity="0.85" />
        </>
      ) : (
        <path d="M9 28 C12 15, 52 15, 55 28 Z" fill={`url(#${uid}-wood)`} stroke={trim} strokeWidth="2.2" />
      )}
      {/* Ornate lock plate */}
      <polygon points="32,26 38,32 35,41 29,41 26,32" fill={trim} stroke="#140D06" strokeWidth="1.2" />
      <circle cx="32" cy="33" r="2.6" fill={arcane ? '#E9D5FF' : '#FEF3C7'} />
    </svg>
  );
};

export const WeaponIcon: React.FC<{ id: WeaponId; evolved?: boolean; className?: string }> = ({
  id,
  evolved = false,
  className = 'w-7 h-7',
}) => {
  const uid = useId();
  const metal = evolved ? '#FDE047' : '#CBD5E1';
  const accent = evolved ? '#F97316' : '#B48844';

  const renderGlyph = () => {
    switch (id) {
      case 'banana':
        return (
          <>
            <path d="M11 26 C11 12, 24 6, 28 8 C22 14, 21 21, 26 26 C19 29, 13 29, 11 26 Z" fill={evolved ? '#FACC15' : '#EAB308'} stroke="#422006" strokeWidth="1.4" />
            <path d="M15 21 C15 15, 20 11, 24 10" stroke="#FEF9C3" strokeWidth="1.2" fill="none" />
          </>
        );
      case 'axe':
        return (
          <>
            <line x1="8" y1="27" x2="23" y2="8" stroke="#78350F" strokeWidth="2.8" strokeLinecap="round" />
            <path d="M16 9 C24 6, 28 11, 26 19 C22 18, 18 15, 16 9 Z" fill={metal} stroke="#1E293B" strokeWidth="1.2" />
            <path d="M23 9 C26 11, 26 15, 25 18" stroke={evolved ? '#FB7185' : '#F97316'} strokeWidth="1.4" fill="none" />
          </>
        );
      case 'dagger':
        return (
          <>
            <path d="M9 24 L25 6 L27 8 L12 26 Z" fill={evolved ? '#7DD3FC' : metal} stroke="#0F172A" strokeWidth="1.2" />
            <line x1="10" y1="19" x2="15" y2="25" stroke={accent} strokeWidth="2.4" strokeLinecap="round" />
            <circle cx="8.5" cy="25.5" r="2" fill={accent} />
          </>
        );
      case 'katana':
        return (
          <>
            <path d="M7 25 Q18 18 27 6 Q21 19 9 27 Z" fill={evolved ? '#FDA4AF' : '#E2E8F0'} stroke="#0F172A" strokeWidth="1.1" />
            <line x1="8" y1="21" x2="13" y2="26" stroke="#F59E0B" strokeWidth="2.2" />
            <path d="M15 15 Q20 13 24 9" stroke={evolved ? '#F43F5E' : '#FB7185'} strokeWidth="1.5" fill="none" />
          </>
        );
      case 'spear':
        return (
          <>
            <line x1="6" y1="27" x2="21" y2="12" stroke="#92400E" strokeWidth="2.4" strokeLinecap="round" />
            <polygon points="27,5 22,15 18,11" fill={evolved ? '#FDE047' : metal} stroke="#1E293B" strokeWidth="1.2" />
            <circle cx="19" cy="13" r="1.8" fill={accent} />
          </>
        );
      case 'wand':
        return (
          <>
            <line x1="7" y1="26" x2="21" y2="12" stroke="#581C87" strokeWidth="2.8" strokeLinecap="round" />
            <polygon points="23,5 25,10 30,10 26,13 27,18 23,15 19,18 20,13 16,10 21,10" fill={evolved ? '#FDE047' : '#C084FC'} />
          </>
        );
      case 'lightning':
        return (
          <polygon
            points="18,4 9,18 16,18 13,29 25,14 18,14"
            fill={evolved ? '#FDE047' : '#38BDF8'}
            stroke="#082F49"
            strokeWidth="1.3"
          />
        );
      case 'fireorb':
        return (
          <>
            <path d="M16 4 C22 10, 26 16, 24 22 C22 27, 10 27, 8 22 C6 16, 12 11, 16 4 Z" fill={evolved ? '#FB7185' : '#F97316'} />
            <path d="M16 11 C20 15, 21 20, 18 24 C14 24, 12 21, 13 17 Z" fill="#FDE047" />
          </>
        );
      case 'frostnova':
        return (
          <g stroke={evolved ? '#A5F3FC' : '#38BDF8'} strokeWidth="2.1" strokeLinecap="round">
            <line x1="16" y1="5" x2="16" y2="27" />
            <line x1="6.5" y1="10.5" x2="25.5" y2="21.5" />
            <line x1="25.5" y1="10.5" x2="6.5" y2="21.5" />
            <circle cx="16" cy="16" r="3.2" fill="#E0F2FE" stroke="none" />
          </g>
        );
      case 'meteor':
        return (
          <>
            <path d="M18 5 L27 6 L22 15" fill="none" stroke="#F59E0B" strokeWidth="2.4" strokeLinecap="round" />
            <circle cx="13" cy="20" r="7.5" fill="#7C2D12" stroke="#F97316" strokeWidth="2" />
            <circle cx="11" cy="19" r="2.6" fill="#FDE047" />
          </>
        );
      case 'laser':
        return (
          <>
            <circle cx="9" cy="16" r="4.5" fill="#A855F7" stroke="#F0ABFC" strokeWidth="1.5" />
            <line x1="12" y1="16" x2="28" y2="16" stroke={evolved ? '#FDE047' : '#E879F9'} strokeWidth="4" strokeLinecap="round" />
            <line x1="12" y1="16" x2="28" y2="16" stroke="#FFFFFF" strokeWidth="1.4" strokeLinecap="round" />
          </>
        );
      case 'cat':
        return (
          <>
            <polygon points="8,14 10,6 15,11" fill="#EA580C" />
            <polygon points="24,14 22,6 17,11" fill="#EA580C" />
            <circle cx="16" cy="18" r="8" fill="#FB923C" stroke="#431407" strokeWidth="1.4" />
            <circle cx="13" cy="17" r="1.3" fill="#FEF08A" />
            <circle cx="19" cy="17" r="1.3" fill="#FEF08A" />
          </>
        );
      case 'bird':
        return (
          <>
            <path d="M5 17 Q11 8 16 14 Q21 8 27 17 Q21 15 16 24 Q11 15 5 17 Z" fill={evolved ? '#FDE047' : '#38BDF8'} stroke="#0C4A6E" strokeWidth="1.2" />
            <circle cx="16" cy="14" r="2" fill="#E0F2FE" />
          </>
        );
      case 'watergun':
        return (
          <>
            <path d="M16 5 C22 14, 24 20, 16 27 C8 20, 10 14, 16 5 Z" fill="#0EA5E9" stroke="#E0F2FE" strokeWidth="1.3" />
            <path d="M13 18 C13 21, 16 23, 18 22" stroke="#BAE6FD" strokeWidth="1.5" fill="none" strokeLinecap="round" />
          </>
        );
      case 'shield':
        return (
          <>
            <path d="M16 5 L25 9 V17 C25 22, 21 26, 16 28 C11 26, 7 22, 7 17 V9 Z" fill={evolved ? '#065F46' : '#1E293B'} stroke={evolved ? '#FDE047' : '#34D399'} strokeWidth="2" />
            <line x1="16" y1="9" x2="16" y2="24" stroke={evolved ? '#FDE047' : '#6EE7B7'} strokeWidth="1.6" />
          </>
        );
      case 'garlic':
        return (
          <>
            <circle cx="16" cy="16" r="10.5" fill="none" stroke={evolved ? '#FDE047' : '#A3E635'} strokeWidth="1.4" strokeDasharray="3 2" />
            <path d="M16 8 C19 12, 22 15, 21 20 C19 23, 13 23, 11 20 C10 15, 13 12, 16 8 Z" fill="#FEF3C7" stroke="#854D0E" strokeWidth="1.2" />
          </>
        );
      case 'mace':
        return (
          <>
            <line x1="7" y1="26" x2="19" y2="14" stroke="#78350F" strokeWidth="2.6" strokeLinecap="round" />
            <circle cx="21" cy="11" r="6" fill={evolved ? '#E11D48' : '#64748B'} stroke="#F8FAFC" strokeWidth="1.2" />
            <polygon points="21,3 22.5,6 19.5,6" fill={metal} />
            <polygon points="29,11 26,12.5 26,9.5" fill={metal} />
            <polygon points="26,5 25,8 23,6" fill={metal} />
          </>
        );
      case 'chain':
        return (
          <g fill="none" stroke={evolved ? '#FDE047' : '#94A3B8'} strokeWidth="2.4">
            <rect x="7" y="13" width="9" height="6" rx="3" transform="rotate(-35 11.5 16)" />
            <rect x="16" y="13" width="9" height="6" rx="3" transform="rotate(-35 20.5 16)" />
          </g>
        );
      case 'totem':
        return (
          <>
            <polygon points="10,27 12,7 20,7 22,27" fill="#451A03" stroke={evolved ? '#FDE047' : '#F59E0B'} strokeWidth="1.6" />
            <circle cx="16" cy="13" r="2.2" fill="#FDE047" />
            <line x1="13" y1="19" x2="19" y2="19" stroke="#FBBF24" strokeWidth="1.6" />
          </>
        );
    }
  };

  return (
    <svg viewBox="0 0 32 32" className={className} aria-label={id}>
      <defs>
        <radialGradient id={`${uid}-bg`} cx="50%" cy="50%" r="55%">
          <stop offset="0%" stopColor={evolved ? '#57360A' : '#1D1B27'} />
          <stop offset="100%" stopColor="#0A0910" />
        </radialGradient>
      </defs>
      <rect
        x="1.5"
        y="1.5"
        width="29"
        height="29"
        rx="5"
        fill={`url(#${uid}-bg)`}
        stroke={evolved ? '#FBBF24' : 'rgba(180,142,74,0.45)'}
        strokeWidth={evolved ? '1.8' : '1.2'}
      />
      {renderGlyph()}
    </svg>
  );
};

export const RelicIcon: React.FC<{ id: RelicId; className?: string }> = ({
  id,
  className = 'w-6 h-6',
}) => {
  const uid = useId();
  return (
    <svg viewBox="0 0 32 32" className={className} aria-label={id}>
      <rect x="1.5" y="1.5" width="29" height="29" rx="5" fill="#12101A" stroke="rgba(180,142,74,0.45)" strokeWidth="1.2" />
      {id === 'spinach' && (
        <>
          <path d="M16 7 C22 8, 25 14, 21 22 C17 25, 11 23, 10 17 C9 12, 12 8, 16 7 Z" fill="#16A34A" stroke="#DCFCE7" strokeWidth="1.1" />
          <line x1="16" y1="25" x2="16" y2="11" stroke="#BBF7D0" strokeWidth="1.4" />
        </>
      )}
      {id === 'boots' && (
        <path d="M10 8 H17 V18 L24 20 V25 H9 V8 Z" fill="#0284C7" stroke="#BAE6FD" strokeWidth="1.3" />
      )}
      {id === 'armor_plate' && (
        <path d="M16 6 L24 10 V17 C24 22, 20 25, 16 27 C12 25, 8 22, 8 17 V10 Z" fill="#475569" stroke="#CBD5E1" strokeWidth="1.5" />
      )}
      {id === 'chronos' && (
        <>
          <circle cx="16" cy="16" r="9" fill="#1E1B4B" stroke="#A78BFA" strokeWidth="1.6" />
          <polyline points="16,10 16,16 20,18" fill="none" stroke="#FDE68A" strokeWidth="1.8" strokeLinecap="round" />
        </>
      )}
      {id === 'echo_crystal' && (
        <>
          <polygon points="16,5 23,13 18,26 14,26 9,13" fill="#0284C7" stroke="#BAE6FD" strokeWidth="1.3" />
          <polygon points="16,9 19,14 16,22 13,14" fill="#7DD3FC" opacity="0.85" />
        </>
      )}
      {id === 'black_ruby_heart' && (
        <>
          <path d="M16 25 C9 20, 7 14, 10 10 C12.5 8, 15 9.5, 16 12 C17 9.5, 19.5 8, 22 10 C25 14, 23 20, 16 25 Z" fill="#9F1239" stroke="#FDA4AF" strokeWidth="1.3" />
          <circle cx="13" cy="13" r="1.4" fill="#FECDD3" />
        </>
      )}
      {id === 'soul_bell' && (
        <>
          <path d="M10 21 C10 13, 12 9, 16 8 C20 9, 22 13, 22 21 L24 23 H8 Z" fill="#7E22CE" stroke="#E9D5FF" strokeWidth="1.3" />
          <circle cx="16" cy="25" r="2" fill="#FDE047" />
        </>
      )}
      {id === 'lost_compass' && (
        <>
          <circle cx="16" cy="16" r="9" fill="#451A03" stroke="#FBBF24" strokeWidth="1.5" />
          <polygon points="16,9 18.5,16 16,23 13.5,16" fill="#F87171" />
          <polygon points="16,9 18.5,16 13.5,16" fill="#FEF08A" />
        </>
      )}
      {id === 'stride_blades' && (
        <>
          <path d="M8 23 L22 9 L25 12 L12 25 Z" fill="#CBD5E1" stroke="#EA580C" strokeWidth="1.2" />
          <path d="M11 10 L23 22" stroke="#FB923C" strokeWidth="2.2" strokeLinecap="round" />
        </>
      )}
      {id === 'storm_eye' && (
        <>
          <circle cx="16" cy="16" r="9" fill="#1E1B4B" stroke="#818CF8" strokeWidth="1.5" strokeDasharray="4 2" />
          <circle cx="16" cy="16" r="4" fill="#38BDF8" stroke="#E0E7FF" strokeWidth="1.1" />
        </>
      )}
      {id === 'cracked_mirror' && (
        <>
          <polygon points="9,7 23,7 25,25 7,25" fill="#1E293B" stroke="#F472B6" strokeWidth="1.4" />
          <polyline points="14,7 17,14 12,18 19,25" fill="none" stroke="#FBCFE8" strokeWidth="1.3" />
        </>
      )}
      {id === 'spirit_lantern' && (
        <>
          <rect x="11" y="10" width="10" height="14" rx="3" fill="#7C2D12" stroke="#FDBA74" strokeWidth="1.4" />
          <circle cx="16" cy="17" r="3.2" fill="#FACC15" />
          <line x1="13" y1="8" x2="19" y2="8" stroke="#F59E0B" strokeWidth="2" />
        </>
      )}
      {id === 'jester_mask' && (
        <>
          <path d="M7 14 C10 8, 22 8, 25 14 C25 22, 19 25, 16 25 C13 25, 7 22, 7 14 Z" fill="#581C87" stroke="#E9D5FF" strokeWidth="1.3" />
          <circle cx="12.5" cy="15" r="1.6" fill="#FACC15" />
          <circle cx="19.5" cy="15" r="1.6" fill="#38BDF8" />
          <path d="M12 20 Q16 23 20 20" stroke="#FB7185" strokeWidth="1.5" fill="none" />
        </>
      )}
      {id === 'stardust_powder' && (
        <>
          <polygon points="16,6 18.5,13 25,13 19.5,17 21.5,24 16,20 10.5,24 12.5,17 7,13 13.5,13" fill="#67E8F9" stroke="#E0F2FE" strokeWidth="1.1" />
        </>
      )}
      {id === 'devil_dice' && (
        <>
          <rect x="8" y="8" width="16" height="16" rx="3" fill="#991B1B" stroke="#FCA5A5" strokeWidth="1.4" />
          <circle cx="12.5" cy="12.5" r="1.4" fill="#FEF08A" />
          <circle cx="16" cy="16" r="1.4" fill="#FEF08A" />
          <circle cx="19.5" cy="19.5" r="1.4" fill="#FEF08A" />
        </>
      )}
      {id === 'cursed_shackles' && (
        <>
          <circle cx="11" cy="19" r="4.5" fill="none" stroke="#94A3B8" strokeWidth="2.4" />
          <circle cx="21" cy="13" r="4.5" fill="none" stroke="#CBD5E1" strokeWidth="2.4" />
          <line x1="14" y1="16" x2="18" y2="15" stroke="#F43F5E" strokeWidth="2" />
        </>
      )}
      <circle cx="26" cy="6" r="1.2" fill={`url(#${uid}-dot)`} opacity="0" />
    </svg>
  );
};

export const ArtifactSlotEmptyIcon: React.FC<{ slot: ArtifactSlot; className?: string }> = ({
  slot,
  className = 'w-4 h-4',
}) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
    {slot === 'helmet' && (
      <path d="M5 13 C5 7, 19 7, 19 13 V18 H15 V14 H9 V18 H5 Z" />
    )}
    {slot === 'necklace' && (
      <>
        <path d="M6 6 C6 13, 18 13, 18 6" />
        <polygon points="12,13 15,17 12,21 9,17" />
      </>
    )}
    {slot === 'armor' && (
      <path d="M6 6 L10 5 L12 8 L14 5 L18 6 L19 11 L16 12 V19 H8 V12 L5 11 Z" />
    )}
    {slot === 'boots' && (
      <path d="M8 5 H13 V14 L18 16 V19 H7 V5 Z" />
    )}
    {slot === 'ring' && (
      <>
        <circle cx="12" cy="14" r="5" />
        <polygon points="12,5 15,8 12,10 9,8" />
      </>
    )}
  </svg>
);

export const ArtifactIcon: React.FC<{ id: ArtifactId; className?: string }> = ({
  id,
  className = 'w-6 h-6',
}) => {
  const uid = useId();
  const def = ARTIFACTS[id];
  if (def.iconPath) {
    return (
      <span className={`relative inline-flex items-center justify-center rounded-md overflow-hidden ${className}`}>
        <img src={def.iconPath} alt={def.nameTh} className="w-full h-full object-contain pixelated" />
      </span>
    );
  }

  const renderArtifact = () => {
    switch (id) {
      case 'crown_of_fortune':
        return (
          <>
            <polygon points="5,22 7,10 12,15 16,7 20,15 25,10 27,22" fill="#FBBF24" stroke="#78350F" strokeWidth="1.3" />
            <circle cx="16" cy="17" r="2" fill="#E11D48" />
          </>
        );
      case 'assassin_hood':
        return (
          <>
            <path d="M7 24 C7 11, 16 6, 16 6 C16 6, 25 11, 25 24 L20 20 H12 Z" fill="#1E293B" stroke="#F59E0B" strokeWidth="1.5" />
            <path d="M12 15 L15 16 M20 15 L17 16" stroke="#F43F5E" strokeWidth="1.6" strokeLinecap="round" />
          </>
        );
      case 'oracle_helm':
        return (
          <>
            <path d="M8 22 V13 C8 8, 24 8, 24 13 V22 H19 V16 H13 V22 Z" fill="#CA8A04" stroke="#FEF08A" strokeWidth="1.3" />
            <circle cx="16" cy="12" r="2.2" fill="#FEF9C3" />
          </>
        );
      case 'blood_necklace':
        return (
          <>
            <path d="M8 7 C8 14, 24 14, 24 7" fill="none" stroke="#94A3B8" strokeWidth="1.6" />
            <path d="M16 13 C20 18, 20 24, 16 26 C12 24, 12 18, 16 13 Z" fill="#E11D48" stroke="#FDA4AF" strokeWidth="1.2" />
          </>
        );
      case 'magnet_pendant':
        return (
          <>
            <path d="M8 7 C8 14, 24 14, 24 7" fill="none" stroke="#CBD5E1" strokeWidth="1.5" />
            <polygon points="16,12 18,17 23,18 19,21 20,26 16,23 12,26 13,21 9,18 14,17" fill="#38BDF8" stroke="#E0F2FE" strokeWidth="1" />
          </>
        );
      case 'fang_talisman':
        return (
          <>
            <path d="M8 8 C12 13, 20 13, 24 8" fill="none" stroke="#A855F7" strokeWidth="1.6" />
            <path d="M12 12 L14 25 L17 14 Z" fill="#F8FAFC" stroke="#581C87" strokeWidth="1" />
            <path d="M20 12 L18 23 L16 13 Z" fill="#E2E8F0" stroke="#581C87" strokeWidth="1" />
          </>
        );
      case 'seraph_robe':
        return (
          <>
            <path d="M7 10 L12 7 L16 11 L20 7 L25 10 L22 25 H10 Z" fill="#FDE047" stroke="#92400E" strokeWidth="1.3" />
            <path d="M12 14 L16 20 L20 14" fill="none" stroke="#FFFFFF" strokeWidth="1.5" />
          </>
        );
      case 'juggernaut_plate':
        return (
          <>
            <polygon points="7,9 12,7 16,10 20,7 25,9 23,24 9,24" fill="#334155" stroke="#34D399" strokeWidth="1.6" />
            <line x1="16" y1="10" x2="16" y2="23" stroke="#6EE7B7" strokeWidth="1.6" />
          </>
        );
      case 'crimson_shroud':
        return (
          <>
            <path d="M8 9 L16 6 L24 9 L26 24 L16 21 L6 24 Z" fill="#881337" stroke="#FB7185" strokeWidth="1.4" />
            <polygon points="16,11 19,17 16,19 13,17" fill="#FDA4AF" />
          </>
        );
      case 'flash_boots':
        return (
          <>
            <path d="M9 8 H16 V17 L24 20 V25 H8 V8 Z" fill="#DC2626" stroke="#FCA5A5" strokeWidth="1.3" />
            <polygon points="19,8 14,15 18,15 16,21 23,13 19,13" fill="#FDE047" />
          </>
        );
      case 'windwalker_boots':
        return (
          <>
            <path d="M10 9 H17 V18 L24 20 V25 H9 V9 Z" fill="#0369A1" stroke="#7DD3FC" strokeWidth="1.3" />
            <path d="M6 12 Q10 9 12 13" fill="none" stroke="#E0F2FE" strokeWidth="1.6" strokeLinecap="round" />
          </>
        );
      case 'iron_boots':
        return (
          <path d="M9 8 H17 V17 L24 20 V25 H8 V8 Z" fill="#475569" stroke="#CBD5E1" strokeWidth="1.6" />
        );
      case 'power_stone_ring':
        return (
          <>
            <circle cx="16" cy="18" r="6.5" fill="none" stroke="#FBBF24" strokeWidth="2.6" />
            <polygon points="16,7 20,12 16,15 12,12" fill="#F97316" stroke="#FEF08A" strokeWidth="1" />
          </>
        );
      case 'berserker_band':
        return (
          <>
            <circle cx="16" cy="18" r="6.5" fill="none" stroke="#9F1239" strokeWidth="2.6" />
            <polygon points="16,7 21,12 16,16 11,12" fill="#E11D48" stroke="#FDA4AF" strokeWidth="1" />
          </>
        );
      case 'ruby_ring':
        return (
          <>
            <circle cx="16" cy="18" r="6.5" fill="none" stroke="#CBD5E1" strokeWidth="2.4" />
            <circle cx="16" cy="11" r="4" fill="#FB7185" stroke="#FFE4E6" strokeWidth="1.1" />
          </>
        );
      case 'tyrant_crown':
        return (
          <>
            <polygon points="5,23 6,9 11,15 16,5 21,15 26,9 27,23" fill="#FACC15" stroke="#78350F" strokeWidth="1.3" />
            <circle cx="16" cy="16" r="2.6" fill="#DC2626" stroke="#FEF08A" strokeWidth="0.9" />
          </>
        );
      case 'butterfly_pendant':
        return (
          <>
            <path d="M16 16 C11 8, 5 11, 8 18 C6 23, 12 25, 16 19 C20 25, 26 23, 24 18 C27 11, 21 8, 16 16 Z" fill="#A855F7" stroke="#F5D0FE" strokeWidth="1.2" />
            <circle cx="16" cy="16" r="2" fill="#FDE047" />
          </>
        );
      case 'two_faced_tome':
        return (
          <>
            <rect x="7" y="7" width="9" height="18" rx="1.5" fill="#EA580C" stroke="#FED7AA" strokeWidth="1.1" />
            <rect x="16" y="7" width="9" height="18" rx="1.5" fill="#0284C7" stroke="#BAE6FD" strokeWidth="1.1" />
            <line x1="16" y1="7" x2="16" y2="25" stroke="#FDE047" strokeWidth="1.4" />
          </>
        );
      case 'dancer_sash':
        return (
          <>
            <path d="M7 13 Q16 7 25 13 Q19 20 24 26 Q16 21 8 26 Q13 20 7 13 Z" fill="#EC4899" stroke="#FBCFE8" strokeWidth="1.2" />
            <circle cx="16" cy="14" r="2" fill="#FDE047" />
          </>
        );
      case 'sinner_heart':
        return (
          <>
            <path d="M16 26 C8 20, 6 13, 10 9 C13 6.5, 15.5 9, 16 12 C16.5 9, 19 6.5, 22 9 C26 13, 24 20, 16 26 Z" fill="#E11D48" stroke="#FDE047" strokeWidth="1.3" />
            <path d="M13 13 L19 19 M19 13 L13 19" stroke="#FEF08A" strokeWidth="1.3" />
          </>
        );
      case 'greedy_chalice':
        return (
          <>
            <path d="M9 8 H23 L20 17 C19 20, 13 20, 12 17 Z" fill="#F59E0B" stroke="#FEF08A" strokeWidth="1.3" />
            <line x1="16" y1="19" x2="16" y2="24" stroke="#FBBF24" strokeWidth="2.4" />
            <line x1="11" y1="25" x2="21" y2="25" stroke="#FBBF24" strokeWidth="2.2" strokeLinecap="round" />
          </>
        );
    }
  };

  return (
    <svg viewBox="0 0 32 32" className={className} aria-label={def.nameTh}>
      <rect
        x="1.5"
        y="1.5"
        width="29"
        height="29"
        rx="5"
        fill={def.isLegendary ? '#1D1229' : '#12101A'}
        stroke={def.isLegendary ? '#FACC15' : `${def.color}AA`}
        strokeWidth={def.isLegendary ? '1.8' : '1.3'}
      />
      {renderArtifact()}
      <circle cx="28" cy="4" r="1" fill={`url(#${uid}-unused)`} opacity="0" />
    </svg>
  );
};
