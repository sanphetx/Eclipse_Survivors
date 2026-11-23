import { ELEMENTS, RELICS, WEAPONS } from './data';
import { ElementId, WeaponId } from './types';

export type ParticleShape = 'circle' | 'spark' | 'diamond' | 'star' | 'ring';

export interface CombinedVisualPalette {
  colors: string[];
  shapes: ParticleShape[];
  primaryColor: string;
  secondaryColor: string;
}

const ELEMENT_PARTICLE_DATA: Record<
  ElementId,
  { colors: string[]; shape: ParticleShape }
> = {
  fire: { colors: ['#F97316', '#FDBA74', '#EF4444'], shape: 'spark' },
  water: { colors: ['#0EA5E9', '#7DD3FC', '#BAE6FD'], shape: 'circle' },
  wind: { colors: ['#34D399', '#A7F3D0', '#6EE7B7'], shape: 'spark' },
  earth: { colors: ['#CA8A04', '#FDE047', '#D97706'], shape: 'diamond' },
  stone: { colors: ['#94A3B8', '#E2E8F0', '#64748B'], shape: 'diamond' },
  dark: { colors: ['#9333EA', '#D8B4FE', '#6366F1'], shape: 'star' },
  light: { colors: ['#FACC15', '#FEF9C3', '#FDE047'], shape: 'star' },
  blood: { colors: ['#E11D48', '#FDA4AF', '#BE123C'], shape: 'diamond' },
};

const RELIC_ESSENCE: Record<
  string,
  { accentColors: string[]; shapes: ParticleShape[] }
> = {
  spinach: {
    accentColors: ['#EF4444', '#F97316', '#FCA5A5'],
    shapes: ['spark', 'diamond'],
  },
  boots: {
    accentColors: ['#38BDF8', '#7DD3FC', '#34D399'],
    shapes: ['spark', 'star'],
  },
  armor_plate: {
    accentColors: ['#10B981', '#34D399', '#FDE047'],
    shapes: ['diamond', 'ring'],
  },
  chronos: {
    accentColors: ['#A78BFA', '#C4B5FD', '#22D3EE'],
    shapes: ['star', 'ring'],
  },
};

function dedupeStrings(arr: string[]): string[] {
  const out: string[] = [];
  for (const item of arr) {
    if (item && !out.includes(item)) out.push(item);
  }
  return out;
}

function dedupeShapes(arr: ParticleShape[]): ParticleShape[] {
  const out: ParticleShape[] = [];
  for (const item of arr) {
    if (item && !out.includes(item)) out.push(item);
  }
  return out.length > 0 ? out : ['circle'];
}

/**
 * Builds a combined multi-color & shape palette from fused elements (2 base + optional 3rd catalyst).
 */
export function getCombinedElementPalette(
  elements: ElementId[],
  fusionColor?: string
): CombinedVisualPalette {
  const rawColors: string[] = [];
  const rawShapes: ParticleShape[] = [];

  for (const el of elements) {
    const def = ELEMENTS[el];
    const pData = ELEMENT_PARTICLE_DATA[el];
    if (def) {
      rawColors.push(def.color, def.glowColor);
    }
    if (pData) {
      rawShapes.push(pData.shape);
    }
  }

  if (fusionColor) {
    rawColors.unshift(fusionColor);
  }

  const colors = dedupeStrings(rawColors);
  const shapes = dedupeShapes(rawShapes);
  if (colors.length === 0) {
    colors.push('#818CF8', '#E0F2FE');
  }

  return {
    colors,
    shapes,
    primaryColor: colors[0],
    secondaryColor: colors[1] || colors[0],
  };
}

/**
 * Builds a combined multi-color & shape palette for an evolved weapon by blending
 * the weapon's own colors with its paired Relic's elemental affinity.
 */
export function getEvolvedWeaponPalette(weaponId: WeaponId): CombinedVisualPalette {
  const w = WEAPONS[weaponId];
  const relic = RELICS[w.pairedRelic];
  const relicEssence = RELIC_ESSENCE[w.pairedRelic] || {
    accentColors: [relic.color],
    shapes: ['star', 'spark'] as ParticleShape[],
  };

  // Special prismatic override for Rainbow Laser
  if (weaponId === 'laser') {
    const colors = ['#EC4899', '#22D3EE', '#A855F7', '#FACC15'];
    return {
      colors,
      shapes: ['star', 'spark', 'ring'],
      primaryColor: '#22D3EE',
      secondaryColor: '#EC4899',
    };
  }

  const colors = dedupeStrings([
    w.evolvedColor,
    w.color,
    relic.color,
    ...relicEssence.accentColors.slice(0, 2),
  ]);
  const shapes = dedupeShapes([...relicEssence.shapes, 'star']);

  return {
    colors,
    shapes,
    primaryColor: w.evolvedColor,
    secondaryColor: relic.color,
  };
}
