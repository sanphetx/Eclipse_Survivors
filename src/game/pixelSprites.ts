/**
 * High-Craft Procedural Pixel-Art Sprite Sheet Generator
 * Builds crisp 16-bit/32-bit full-body pixel-art animation strips (walk/flap/attack frames)
 * on offscreen canvases using unified full-body pixel grids, indexed color palettes,
 * 1px dark pixel outlines, cel-shading, and specular highlights.
 * Every humanoid, golem, monster, and weapon sprite forms a cohesive, solid silhouette
 * with zero detached/floating body parts.
 */

export type PixelSpriteId =
  | 'orc'
  | 'vampire_noble'
  | 'werewolf'
  | 'knight'
  | 'saint'
  | 'spellblade'
  | 'bat'
  | 'flower'
  | 'miniboss_blossom'
  | 'archer'
  | 'holy_golem'
  | 'frost_golem'
  | 'stone_golem'
  | 'fly_minion'
  | 'px_banana'
  | 'px_axe'
  | 'px_dagger'
  | 'px_spear'
  | 'px_bird'
  | 'px_watergun'
  | 'px_blade'
  | 'px_shield'
  | 'px_chain'
  | 'px_feather'
  | 'px_greatsword'
  | 'px_paladin_sword'
  | 'px_vampire_sword'
  | 'px_hunter_bow';

export interface PixelSpriteSheet {
  canvas: HTMLCanvasElement;
  frameW: number;
  frameH: number;
  frames: number;
  anchorX: number;
  anchorY: number;
}

const cache = new Map<string, PixelSpriteSheet>();
type Palette = Record<string, string>;

function makeStripCanvas(
  frameW: number,
  frameH: number,
  frameCount: number
): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } {
  const canvas = document.createElement('canvas');
  canvas.width = frameW * frameCount;
  canvas.height = frameH;
  const ctx = canvas.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;
  return { canvas, ctx };
}

function drawGridFrame(
  ctx: CanvasRenderingContext2D,
  ox: number,
  oy: number,
  rows: string[],
  palette: Palette
): void {
  for (let y = 0; y < rows.length; y++) {
    const row = rows[y];
    for (let x = 0; x < row.length; x++) {
      const ch = row[x];
      if (ch === '.' || ch === ' ') continue;
      const col = palette[ch];
      if (!col) continue;
      ctx.fillStyle = col;
      ctx.fillRect(ox + x, oy + y, 1, 1);
    }
  }
}

/**
 * Adds a crisp 1px dark outline around all opaque pixels within each frame cell.
 */
function applyPixelOutline(
  ctx: CanvasRenderingContext2D,
  frameW: number,
  frameH: number,
  frameCount: number,
  outlineHex = '#07090F'
): void {
  const w = frameW * frameCount;
  const img = ctx.getImageData(0, 0, w, frameH);
  const d = img.data;
  const r = parseInt(outlineHex.slice(1, 3), 16);
  const g = parseInt(outlineHex.slice(3, 5), 16);
  const b = parseInt(outlineHex.slice(5, 7), 16);
  const toOutline: number[] = [];

  for (let f = 0; f < frameCount; f++) {
    const x0 = f * frameW;
    const x1 = x0 + frameW;
    for (let y = 0; y < frameH; y++) {
      for (let x = x0; x < x1; x++) {
        const idx = (y * w + x) * 4;
        if (d[idx + 3] > 20) continue;
        let hasNeighbor = false;
        if (x > x0 && d[(y * w + (x - 1)) * 4 + 3] > 20) hasNeighbor = true;
        else if (x + 1 < x1 && d[(y * w + (x + 1)) * 4 + 3] > 20) hasNeighbor = true;
        else if (y > 0 && d[((y - 1) * w + x) * 4 + 3] > 20) hasNeighbor = true;
        else if (y + 1 < frameH && d[((y + 1) * w + x) * 4 + 3] > 20) hasNeighbor = true;
        if (hasNeighbor) toOutline.push(idx);
      }
    }
  }
  for (const idx of toOutline) {
    d[idx] = r;
    d[idx + 1] = g;
    d[idx + 2] = b;
    d[idx + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
}

/**
 * Renders a unified full-body 4-frame animated pixel sprite:
 * - `upperBody`: continuous grid from crown/hair down through neck, shoulders, chest, belt, and hips.
 * - `lowerPoses`: 4 continuous leg/boot frames automatically anchored at `bodyY + upperBody.length - 3`
 *   so the waist & hips ALWAYS overlap the upper thighs with zero gap even during stride bob!
 * - `cape`: optional flowing cloak behind torso & upper legs that sways horizontally on walk steps.
 * - `weapon`: optional held weapon anchored into the front hand.
 */
interface FullBodySpec {
  w: number;
  h: number;
  bodyX: number;
  bodyY: number;
  legX: number;
  legOverlapRows?: number;
  capeX?: number;
  capeY?: number;
  weaponX?: number;
  weaponY?: number;
  palette: Palette;
  upperBody: string[];
  lowerPoses: [string[], string[], string[], string[]];
  cape?: string[];
  weapon?: string[];
}

function buildFullBody4Frames(spec: FullBodySpec): PixelSpriteSheet {
  const { w, h, palette } = spec;
  const frames = 4;
  const { canvas, ctx } = makeStripCanvas(w, h, frames);

  const overlap = spec.legOverlapRows ?? 3;
  const legY = spec.bodyY + spec.upperBody.length - overlap;

  // Stride cycle: [bodyBobY, capeSwayX, weaponBobY]
  const stepMeta: Array<[number, number, number]> = [
    [0, 0, 0],
    [-1, -1, -1],
    [0, 0, 0],
    [-1, 1, 0],
  ];

  let maxFootY = 0;
  for (const pose of spec.lowerPoses) {
    for (let ry = 0; ry < pose.length; ry++) {
      if (/[A-Za-z0-9]/.test(pose[ry])) {
        maxFootY = Math.max(maxFootY, legY + ry + 1);
      }
    }
  }

  for (let f = 0; f < frames; f++) {
    const ox = f * w;
    const [bobY, capeSway, wBob] = stepMeta[f];

    // 1. Cape / Fur Mantle behind torso & upper legs
    if (spec.cape) {
      drawGridFrame(
        ctx,
        ox + (spec.capeX ?? spec.bodyX) + capeSway,
        (spec.capeY ?? spec.bodyY + 6) + bobY,
        spec.cape,
        palette
      );
    }

    // 2. Lower body & boots (overlapping waist by >= 2px even at bobY = -1)
    drawGridFrame(ctx, ox + spec.legX, legY, spec.lowerPoses[f], palette);

    // 3. Upper body (head + neck + shoulders + arms + torso + belt in one continuous block)
    drawGridFrame(ctx, ox + spec.bodyX, spec.bodyY + bobY, spec.upperBody, palette);

    // 4. Held Weapon overlapping directly into front hand
    if (spec.weapon) {
      drawGridFrame(
        ctx,
        ox + (spec.weaponX ?? spec.bodyX),
        (spec.weaponY ?? spec.bodyY) + bobY + wBob,
        spec.weapon,
        palette
      );
    }
  }

  applyPixelOutline(ctx, w, h, frames);
  return {
    canvas,
    frameW: w,
    frameH: h,
    frames,
    anchorX: 0.5,
    anchorY: Math.min(0.97, (maxFootY + 1) / h),
  };
}

function buildVampireNobleSheet(): PixelSpriteSheet {
  // Matches Vampire portrait: swept silver-dark hair, pale gaunt face, glowing crimson eyes,
  // upturned dark-silver coat collar, crimson waistcoat, brown leather pauldron & belts,
  // ruby-hilted silver runed broadsword, billowing crimson-lined coat!
  return buildFullBody4Frames({
    w: 32,
    h: 34,
    bodyX: 7,
    bodyY: 3,
    legX: 9,
    legOverlapRows: 3,
    capeX: 8,
    capeY: 11,
    weaponX: 19,
    weaponY: 5,
    palette: {
      H: '#1E293B', // Dark hair
      h: '#94A3B8', // Silver hair sweep
      K: '#E2E8F0', // Pale skin
      k: '#94A3B8', // Jaw shadow
      E: '#EF4444', // Glowing crimson eyes
      C: '#0F172A', // Aristocratic dark coat
      c: '#475569', // Silver coat trim & collar
      R: '#BE123C', // Crimson waistcoat / cape lining
      r: '#7F1D1D', // Deep crimson shadow
      L: '#573B26', // Leather shoulder guard & cross-belt
      l: '#78553A', // Leather highlight
      B: '#1E293B', // Trousers
      b: '#090D16', // Tall gothic boots
      S: '#E2E8F0', // Runed sword blade
      s: '#64748B', // Blade shadow
      G: '#F43F5E', // Ruby hilt
    },
    cape: [
      '..cCCCCCCCCc..',
      '.rRRRRRRRRRRr.',
      '.rRCCCCCCCCRr.',
      'rRRCCCCCCCCRRr',
      'rRRCCCCCCCCRRr',
      'rRRCCCCCCCCRRr',
      'rRrCCCCCCCCrRr',
      '.r.CCCCCCCC.r.',
      '...CC....CC...',
    ],
    upperBody: [
      '....hhHHHHH.......', // 0: Swept silver-dark hair
      '...HhHHHHHHH......', // 1
      '...HHKKKKKKH......', // 2: Pale brow
      '...HKKKEKKEK......', // 3: Glowing crimson eyes
      '...KKKKKKKKk......', // 4: Jaw
      '..cCKkkkkkkCc.....', // 5: High silver-trimmed collar around neck
      '.cLLCCRRRRCCc.....', // 6: Leather pauldron + collar + crimson cravat
      'LLLLCCRRRRCCc.....', // 7: Broad shoulders + coat lapels
      'LLCccCRRRRccCC....', // 8: Chest coat + crimson vest + sleeve
      '.LCCcCRRRRCCCCk...', // 9: Gloved hand reaching to sword hilt
      '..CCcCLLLLCCCGk...', // 10: Crossed leather strap + ruby hand
      '..CCLLLLLLLLCC....', // 11: Waist belt
      '..CCCCrRRrCCCC....', // 12: Upper coat tails
      '..CCCCrRRrCCCC....', // 13: Coat tails overlapping thighs
      '..CCC.rRRr.CCC....', // 14
    ],
    lowerPoses: [
      [
        '..BBBB..BBBB..', // 0: Overlaps coat tails (rows 12..14)
        '..BBBB..BBBB..', // 1
        '..BBBB..BBBB..', // 2
        '..bbbb..bbbb..', // 3: Knee-high boots
        '..bbbb..bbbb..', // 4
        '..bbbb..bbbb..', // 5
        '..bbbbb.bbbbb.', // 6
      ],
      [
        '..BBBB..BBBB..',
        '.BBBB....BBBB.',
        '.BBBB....BBBB.',
        '.bbbb....bbbb.',
        '.bbbb....bbbb.',
        '.bbbbb...bbbb.',
        '.bbbb.........',
      ],
      [
        '..BBBB..BBBB..',
        '..BBBB..BBBB..',
        '..BBBB..BBBB..',
        '..bbbb..bbbb..',
        '..bbbb..bbbb..',
        '..bbbb..bbbb..',
        '..bbbbb.bbbbb.',
      ],
      [
        '..BBBB..BBBB..',
        '..BBBB....BBBB',
        '..BBBB....BBBB',
        '..bbbb....bbbb',
        '..bbbb....bbbb',
        '..bbbb...bbbbb',
        '..........bbbb',
      ],
    ],
    weapon: [
      '..S...', // 0: Connects directly into hand at y=5+9=14 (body row 11)
      '..Ss..',
      '..Ss..',
      '..Ss..',
      '..Ss..',
      '..Ss..',
      '..Ss..',
      '..Ss..',
      '.cGGc.',
      '..GG..',
      '..G...',
    ],
  });
}

function buildOrcSheet(): PixelSpriteSheet {
  // Matches Orc portrait: muscular warlord, dark hair & braided beard,
  // olive skin, glowing amber eyes, ivory tusks, spiked steel shoulder pauldron,
  // wolf-fur mantle, iron breastplate, brass war-belt, heavy double battleaxe!
  return buildFullBody4Frames({
    w: 38,
    h: 36,
    bodyX: 5,
    bodyY: 3,
    legX: 11,
    legOverlapRows: 3,
    capeX: 8,
    capeY: 11,
    weaponX: 23,
    weaponY: 3,
    palette: {
      S: '#566841', // Olive skin
      s: '#3B482C', // Muscle shadow
      H: '#18181B', // Dark hair & braided beard
      h: '#3F3F46', // Hair highlight
      E: '#F59E0B', // Glowing amber eyes
      T: '#FEF3C7', // Ivory tusks
      M: '#CBD5E1', // Spiked steel highlight
      m: '#64748B', // Steel armor
      d: '#334155', // Steel dark
      F: '#57534E', // Wolf fur mantle
      f: '#78716C', // Fur highlight
      B: '#78350F', // Leather & axe haft
      G: '#D97706', // Gold belt buckle
      W: '#F8FAFC', // Axe edge shine
      w: '#94A3B8', // Axe blade
      K: '#292524', // Heavy war-boots
    },
    cape: [
      '..ffFFFFFFff..',
      '.fFFFFFFFFFFf.',
      '.FFFFFFFFFFFF.',
      '.FFFffffffFFF.',
      '..FFFFFFFFFF..',
      '..FFFFFFFFFF..',
      '...FFFFFFFF...',
    ],
    upperBody: [
      '......hHHHHHH........', // 0: Hair
      '.....HHHHHHHHh.......', // 1
      '....HHSSSSSSSHH......', // 2: Heavy brow
      '....HSsESSSESsH......', // 3: Dual glowing amber eyes
      '....HSSSSSSSSSH......', // 4: Broad nose
      '..MMmHTsSSSsTHff.....', // 5: Spiked pauldron tip + ivory tusks + fur
      '.MmMMmHHHHHHHHfff....', // 6: Spiked shoulder + braided beard on chest
      'MMmMMMmdMMMMdmFFFF...', // 7: Broad steel chest & fur mantle
      'mMMMMMmMMMMMMmFFFF...', // 8: Armored chest + muscular arms
      'sSSmMMmMMddMMmmSSs...', // 9: Bare muscular arms + chainmail midriff
      'sSSddBBBBGGBBBBMmSSs.', // 10: War-belt + gold buckle + outstretched axe fist
      '.MMdBBBBBBBBBBBdMM...', // 11: Spiked iron bracers + waist
      '..dddmMMMMMMMMmddd...', // 12: Armored tassets
      '...dddmmmmmmmmddd....', // 13: Hip armor overlapping thighs
    ],
    lowerPoses: [
      [
        '..BBBB..BBBB..',
        '..BBBB..BBBB..',
        '..dddd..dddd..',
        '..dddd..dddd..',
        '..KKKK..KKKK..',
        '.KKKKK..KKKKK.',
        '.KKKKK..KKKKK.',
      ],
      [
        '..BBBB..BBBB..',
        '.BBBB....BBBB.',
        '.dddd....dddd.',
        '.KKKK....dddd.',
        'KKKKK....KKKK.',
        'KKKKK....KKKK.',
        '..............',
      ],
      [
        '..BBBB..BBBB..',
        '..BBBB..BBBB..',
        '..dddd..dddd..',
        '..dddd..dddd..',
        '..KKKK..KKKK..',
        '.KKKKK..KKKKK.',
        '.KKKKK..KKKKK.',
      ],
      [
        '..BBBB..BBBB..',
        '..BBBB....BBBB',
        '..dddd....dddd',
        '..dddd....KKKK',
        '..KKKK...KKKKK',
        '..KKKK...KKKKK',
        '..............',
      ],
    ],
    weapon: [
      '....WWWW..',
      '...WWwwwW.',
      '..BWWwwwW.',
      '..BWWwwww.',
      '..B.wWWw..',
      '..B.......',
      '..B.......',
      '..B.......',
      '..B.......',
      '..B.......',
      '..B.......',
      '..B.......',
      '..B.......',
      '..B.......',
    ],
  });
}

function buildWerewolfSheet(): PixelSpriteSheet {
  return buildFullBody4Frames({
    w: 36,
    h: 34,
    bodyX: 7,
    bodyY: 3,
    legX: 10,
    legOverlapRows: 3,
    capeX: 8,
    capeY: 10,
    weaponX: 25,
    weaponY: 12,
    palette: {
      F: '#991B1B',
      f: '#DC2626',
      d: '#450A0A',
      E: '#FDE047',
      T: '#F8FAFC',
      V: '#1E293B',
      R: '#F97316',
      B: '#334155',
    },
    cape: [
      '..ffFFFFff..',
      '.fFFFFFFFFf.',
      'fFFFFFFFFFFf',
      '.dFFFFFFFFd.',
      '..dFFFFFFd..',
    ],
    upperBody: [
      '..F......F.......',
      '..Ff....fF.......',
      '..fFFFFFFf.......',
      '..FFEFEEFFf......',
      '..FFFFFFFFFff....',
      '...FFTTTTTFff....',
      '.ffFFFFFFFFFFf...',
      'fFFFVVVVVVVFFFf..',
      'FFFFVVRRRVVFFFF..',
      'dFFFVVVVVVVFFFd..',
      'TTd.FFFFFFFF.dTT.',
      '.T..dFFFFFFd..T..',
      '....dBBBBBBd.....',
      '....dBBBBBBd.....',
    ],
    lowerPoses: [
      [
        '..FFFF..FFFF..',
        '..FFFF..FFFF..',
        '.dFFF....FFFd.',
        '.dFF......FFd.',
        '.TTT......TTT.',
      ],
      [
        '..FFFF..FFFF..',
        '.FFFF....FFFF.',
        'dFFF......FFFd',
        'TTT........FFd',
        '...........TTT',
      ],
      [
        '..FFFF..FFFF..',
        '..FFFF..FFFF..',
        '.dFFF....FFFd.',
        '.dFF......FFd.',
        '.TTT......TTT.',
      ],
      [
        '..FFFF..FFFF..',
        '..FFFF....FFFF',
        '.dFFF......FFF',
        '.dFF.......TTT',
        '.TTT..........',
      ],
    ],
  });
}

function buildKnightSheet(): PixelSpriteSheet {
  return buildFullBody4Frames({
    w: 36,
    h: 34,
    bodyX: 8,
    bodyY: 2,
    legX: 11,
    legOverlapRows: 3,
    capeX: 9,
    capeY: 11,
    weaponX: 18,
    weaponY: 4,
    palette: {
      P: '#38BDF8',
      p: '#0284C7',
      M: '#E2E8F0',
      m: '#94A3B8',
      d: '#475569',
      E: '#7DD3FC',
      G: '#FACC15',
      S: '#F8FAFC',
    },
    cape: [
      '.PPPPPPPP.',
      'pPPPPPPPPp',
      'pPPPPPPPPp',
      'pPPPPPPPPp',
      '.pppppppp.',
      '.pppppppp.',
    ],
    upperBody: [
      '...PPPP......',
      '..PPPPPP.....',
      '...MMMMMM....',
      '..MMMMMMMM...',
      '..MdEEEEEM...',
      '..MmmmmmmM...',
      '.GGddddddGG..',
      'MMmGGGGGGmMM.',
      'MmMMMMMMMMmM.',
      'MmMMGGGGMMmM.',
      'mmMMMMMMMMmm.',
      '.ddGGGGGGdd..',
      '.mmddddddmm..',
      '.mmddddddmm..',
    ],
    lowerPoses: [
      [
        '..mmmm..mmmm..',
        '..mmmm..mmmm..',
        '..MMMM..MMMM..',
        '..dddd..dddd..',
        '.MMMMM..MMMMM.',
        '.ddddd..ddddd.',
      ],
      [
        '..mmmm..mmmm..',
        '.mmmm....mmmm.',
        '.MMMM....MMMM.',
        '.dddd....dddd.',
        'MMMMM....MMMM.',
        'ddddd.........',
      ],
      [
        '..mmmm..mmmm..',
        '..mmmm..mmmm..',
        '..MMMM..MMMM..',
        '..dddd..dddd..',
        '.MMMMM..MMMMM.',
        '.ddddd..ddddd.',
      ],
      [
        '..mmmm..mmmm..',
        '..mmmm....mmmm',
        '..MMMM....MMMM',
        '..dddd....dddd',
        '.MMMM.....MMMM',
        '..........dddd',
      ],
    ],
    weapon: [
      '..SS..',
      '..SS..',
      '..SM..',
      '..SM..',
      '..SM..',
      '..SM..',
      '..SM..',
      '.GGGG.',
      '..GG..',
      '..GG..',
    ],
  });
}

function buildSaintSheet(): PixelSpriteSheet {
  return buildFullBody4Frames({
    w: 36,
    h: 36,
    bodyX: 8,
    bodyY: 2,
    legX: 11,
    legOverlapRows: 3,
    capeX: 9,
    capeY: 12,
    weaponX: 19,
    weaponY: 4,
    palette: {
      G: '#FACC15',
      g: '#FEF08A',
      W: '#F8FAFC',
      w: '#CBD5E1',
      S: '#FDE68A',
      E: '#38BDF8',
      B: '#92400E',
    },
    cape: [
      'gWWWWWWWWg',
      'WWWWWWWWWW',
      'WWwWWWWwWW',
      'WWWWWWWWWW',
      '.wwwwwwww.',
    ],
    upperBody: [
      '..gggggggg...', // Halo
      '.............',
      '...WWWWWW....',
      '..WWWWWWWW...',
      '..WSSSSSSW...',
      '..WSSESSEW...',
      '..WWwSSwWW...',
      '.GGWWWWWWGG..',
      '.WWWWGGWWWW..',
      'WWWWGGGGWWWW.',
      'wWWwGGGGwWWw.',
      '.wwGGGGGGww..',
      '.WWWWWWWWWW..',
      '.WWWWWWWWWW..',
    ],
    lowerPoses: [
      [
        '.WWWWWWWWWW.',
        '.WWwWWWWwWW.',
        '.WWWWWWWWWW.',
        '.GGGGGGGGGG.',
        '..GGG..GGG..',
      ],
      [
        '.WWWWWWWWWW.',
        'WWWWWWWWWW..',
        'WWwWWWWwWW..',
        'GGGGGGGGGG..',
        '.GGG...GGG..',
      ],
      [
        '.WWWWWWWWWW.',
        '.WWwWWWWwWW.',
        '.WWWWWWWWWW.',
        '.GGGGGGGGGG.',
        '..GGG..GGG..',
      ],
      [
        '.WWWWWWWWWW.',
        '..WWWWWWWWWW',
        '..WWwWWWWwWW',
        '..GGGGGGGGGG',
        '..GGG...GGG.',
      ],
    ],
    weapon: [
      '.gGg.',
      'gGGGg',
      '.gGg.',
      '..B..',
      '..B..',
      '..B..',
      '..B..',
      '..B..',
      '..B..',
      '..B..',
      '..B..',
      '..B..',
    ],
  });
}

function buildSpellbladeSheet(): PixelSpriteSheet {
  return buildFullBody4Frames({
    w: 36,
    h: 34,
    bodyX: 8,
    bodyY: 3,
    legX: 11,
    legOverlapRows: 3,
    capeX: 9,
    capeY: 11,
    weaponX: 18,
    weaponY: 4,
    palette: {
      H: '#312E81',
      h: '#6366F1',
      G: '#F59E0B',
      K: '#FDE68A',
      E: '#38BDF8',
      C: '#E0F2FE',
      c: '#38BDF8',
      W: '#4C1D95',
      B: '#0F172A',
    },
    cape: [
      '.WWWWWWWW.',
      'WWWWWWWWWW',
      'WWWhhhhWWW',
      '.WWWWWWWW.',
      '.WWWWWWWW.',
    ],
    upperBody: [
      '...HHHHHH....',
      '..HHHHHHHH...',
      '..HhKKKKhH...',
      '..HKKEEKkH...',
      '..HhKKKKhH...',
      '.GGHHHHHHGG..',
      '.HhHHGGHHhH..',
      'HHHHHGGHHHHH.',
      'hHHHHGGHHHHh.',
      'HHHHGGGGHHHH.',
      '.hHHGGGGHHh..',
      '..GGGGGGGG...',
      '..HHHHHHHH...',
      '..HHHHHHHH...',
    ],
    lowerPoses: [
      [
        '..HHHH..HHHH..',
        '..HHHH..HHHH..',
        '..BBBB..BBBB..',
        '..BBBB..BBBB..',
        '.BBBBB..BBBBB.',
      ],
      [
        '..HHHH..HHHH..',
        '.HHHH....HHHH.',
        '.BBBB....BBBB.',
        'BBBBB....BBBB.',
        '..............',
      ],
      [
        '..HHHH..HHHH..',
        '..HHHH..HHHH..',
        '..BBBB..BBBB..',
        '..BBBB..BBBB..',
        '.BBBBB..BBBBB.',
      ],
      [
        '..HHHH..HHHH..',
        '..HHHH....HHHH',
        '..BBBB....BBBB',
        '..BBBB...BBBBB',
        '..............',
      ],
    ],
    weapon: [
      '...C..',
      '..cCc.',
      '..cCc.',
      '..cCc.',
      '..cCc.',
      '..cCc.',
      '..cCc.',
      '..cCc.',
      '.GGGG.',
      '..GG..',
    ],
  });
}

function buildArcherSheet(): PixelSpriteSheet {
  return buildFullBody4Frames({
    w: 32,
    h: 30,
    bodyX: 8,
    bodyY: 2,
    legX: 10,
    legOverlapRows: 3,
    capeX: 9,
    capeY: 10,
    weaponX: 17,
    weaponY: 8,
    palette: {
      H: '#1E293B',
      h: '#475569',
      E: '#4ADE80',
      C: '#065F46',
      c: '#10B981',
      B: '#92400E',
      S: '#E2E8F0',
    },
    cape: [
      '.HHHHHH.',
      'HHHHHHHH',
      'HHHHHHHH',
      '.HHHHHH.',
    ],
    upperBody: [
      '...HHHH....',
      '..HHHHHH...',
      '.HHHHHHHh..',
      '.HHH..HHH..',
      '.HH.EE.HH..',
      '..hHHHHh...',
      '.cCCCCCCc..',
      'CCCCCCCCCC.',
      'cCCCCCCCCc.',
      '.CCCCCCCC..',
      '..BBBBBB...',
      '..CCCCCC...',
      '..CCCCCC...',
    ],
    lowerPoses: [
      [
        '..HHHH..HHHH..',
        '..HHHH..HHHH..',
        '..BBBB..BBBB..',
        '.BBBBB..BBBBB.',
      ],
      [
        '..HHHH..HHHH..',
        '.HHHH....HHHH.',
        '.BBBB....BBBB.',
        'BBBBB.........',
      ],
      [
        '..HHHH..HHHH..',
        '..HHHH..HHHH..',
        '..BBBB..BBBB..',
        '.BBBBB..BBBBB.',
      ],
      [
        '..HHHH..HHHH..',
        '..HHHH....HHHH',
        '..BBBB....BBBB',
        '.........BBBBB',
      ],
    ],
    weapon: [
      '.BB...',
      '...B..',
      'SSSSBS',
      '...B..',
      '.BB...',
    ],
  });
}

function buildGolemSheet(theme: 'holy' | 'frost' | 'stone'): PixelSpriteSheet {
  // Unified massive elemental titan: head embedded into shoulder boulders,
  // stone forearms attached straight to shoulders, pillar legs overlapping waist!
  const w = 44;
  const h = 40;
  const frames = 4;
  const { canvas, ctx } = makeStripCanvas(w, h, frames);
  const pal: Palette =
    theme === 'holy'
      ? {
          R: '#475569',
          r: '#94A3B8',
          d: '#1E293B',
          C: '#FACC15',
          c: '#FEF08A',
          G: '#F59E0B',
        }
      : theme === 'frost'
        ? {
            R: '#164E63',
            r: '#22D3EE',
            d: '#083344',
            C: '#A5F3FC',
            c: '#ECFEFF',
            G: '#06B6D4',
          }
        : {
            R: '#57534E',
            r: '#A8A29E',
            d: '#292524',
            C: '#F59E0B',
            c: '#FDE68A',
            G: '#D97706',
          };

  const bobs = [0, -1, 0, -1];
  for (let f = 0; f < frames; f++) {
    const ox = f * w;
    const b = bobs[f];
    const lLeg = f === 1 ? -1 : 0;
    const rLeg = f === 3 ? -1 : 0;

    // Legs starting at y=18 (overlapping torso rows 17..20!) down to y=33
    ctx.fillStyle = pal.d;
    ctx.fillRect(ox + 14, 18 + lLeg, 6, 15);
    ctx.fillRect(ox + 24, 18 + rLeg, 6, 15);
    ctx.fillStyle = pal.R;
    ctx.fillRect(ox + 15, 21 + lLeg, 4, 9);
    ctx.fillRect(ox + 25, 21 + rLeg, 4, 9);
    ctx.fillStyle = pal.G;
    ctx.fillRect(ox + 14, 31 + lLeg, 6, 2);
    ctx.fillRect(ox + 24, 31 + rLeg, 6, 2);

    const titan = [
      '..........cccccc..........', // 0: y=7
      '.........CCCCCCCC.........', // 1
      '.......rrRRRRRRRRrr.......', // 2
      '......rRRRRccRRccRRr......', // 3: Glowing eyes
      '....rrRRRRRRRRRRRRRRrr....', // 4: Massive shoulders
      '..rrRRRRRRddCCCCddRRRRrr..', // 5: Arms joined cleanly to shoulders
      '.rRRRRRRRRdCCCCCCdRRRRRRr.', // 6: Glowing rune core
      '.rRRRRdRRRdCCccCCdRRRdRRr.', // 7
      '.rRRRRdRRRdCCCCCCdRRRdRRr.', // 8
      '.rRRRRddRRRddCCddRRRddRRr.', // 9
      '.dRRRRddRRRRRRRRRRRRddRRd.', // 10
      '.dRRRRd.dRRRRGGRRRRd.dRRd.', // 11
      '.ddddd...dGGGGGGGGd..dddd.', // 12: y=19 (overlaps legs at y=18!)
      '..........dddddddd........', // 13: y=20
    ];
    drawGridFrame(ctx, ox + 9, 7 + b, titan, pal);
  }
  applyPixelOutline(ctx, w, h, frames);
  return { canvas, frameW: w, frameH: h, frames, anchorX: 0.5, anchorY: 0.88 };
}

function buildBatSheet(): PixelSpriteSheet {
  const w = 32;
  const h = 24;
  const frames = 4;
  const { canvas, ctx } = makeStripCanvas(w, h, frames);
  const pal: Palette = {
    W: '#4C0519',
    w: '#881337',
    B: '#31102F',
    b: '#581C87',
    E: '#F43F5E',
    T: '#F8FAFC',
  };

  const f0 = [
    '..W........................W..',
    '.WWw......................wWW.',
    'WWWWw.......BBBBBB.......wWWWW',
    'WWWWWWw....BbbBBbbB....wWWWWWW',
    '.WWWWWWWw..BBEbbEBB..wWWWWWWW.',
    '..WWWWWWWWwBBTTTTBBwWWWWWWWW..',
    '...WWW......BBBBBB......WWW...',
    '.............BBBB.............',
  ];
  const f1 = [
    '............BBBBBB............',
    '...........BbbBBbbB...........',
    '..WWWWw....BBEbbEBB....wWWWW..',
    '.WWWWWWWw..BBTTTTBB..wWWWWWWW.',
    'WWWWWWWWWWW.BBBBBB.WWWWWWWWWWW',
    '.WWWWWW......BBBB......WWWWWW.',
    '..WW......................WW..',
  ];
  const f2 = [
    '............BBBBBB............',
    '...........BbbBBbbB...........',
    '...........BBEbbEBB...........',
    '....WWWWw..BBTTTTBB..wWWWW....',
    '..WWWWWWWWw.BBBBBB.wWWWWWWWW..',
    '.WWWWWWWW....BBBB....WWWWWWWW.',
    'WWWW..WW..............WW..WWWW',
    '.WW........................WW.',
  ];
  const poses = [f0, f1, f2, f1];
  const yOffs = [4, 7, 9, 7];

  for (let i = 0; i < frames; i++) {
    drawGridFrame(ctx, i * w + 1, yOffs[i], poses[i], pal);
  }
  applyPixelOutline(ctx, w, h, frames);
  return { canvas, frameW: w, frameH: h, frames, anchorX: 0.5, anchorY: 0.65 };
}

function buildFlowerSheet(isMiniBoss: boolean): PixelSpriteSheet {
  const w = 32;
  const h = 34;
  const frames = 4;
  const { canvas, ctx } = makeStripCanvas(w, h, frames);
  const pal: Palette = {
    P: isMiniBoss ? '#9F1239' : '#BE123C',
    p: isMiniBoss ? '#FB7185' : '#F43F5E',
    D: '#4C0519',
    T: '#FEF3C7',
    E: isMiniBoss ? '#FDE047' : '#E879F9',
    G: '#15803D',
    g: '#22C55E',
    d: '#14532D',
  };

  for (let f = 0; f < frames; f++) {
    const ox = f * w;
    const sway = f === 1 ? -1 : f === 3 ? 1 : 0;
    const open = f === 2 ? 1 : 0;

    const stem = [
      '......GG......',
      '.....gGGg.....',
      '......GG......',
      '..gg..GG..gg..',
      '.gGGgGGGGgGGg.',
      '..ddddGGdddd..',
      '.dd........dd.',
    ];
    drawGridFrame(ctx, ox + 9, 13, stem, pal);

    const head = open
      ? [
          '..ppPP....PPpp..',
          '.pPPPPp..pPPPPp.',
          '.PPDDDDDDpDDDPP.',
          '.PPDTDDTDDDDTPP.',
          '..PDDDEEEEDDDP..',
          '..pPDTDDDDTDPp..',
          '...ppPPPPPPpp...',
        ]
      : [
          '...ppPP..PPpp...',
          '..pPPPPppPPPPp..',
          '..PPDDTTTTDDPP..',
          '..PPDDEEEEDDPP..',
          '...pPPDDDDPPp...',
          '....ppPPPPpp....',
        ];
    drawGridFrame(ctx, ox + 8 + sway, 6 + (open ? 0 : 1), head, pal);
  }
  applyPixelOutline(ctx, w, h, frames);
  return { canvas, frameW: w, frameH: h, frames, anchorX: 0.5, anchorY: 0.85 };
}

function buildFlyMinionSheet(): PixelSpriteSheet {
  const w = 16;
  const h = 14;
  const frames = 2;
  const { canvas, ctx } = makeStripCanvas(w, h, frames);
  const pal: Palette = {
    W: '#E2E8F0',
    B: '#A855F7',
    E: '#F43F5E',
  };
  const f0 = [
    '.WW....WW.',
    'WWWW..WWWW',
    '..BBBBBB..',
    '..BEEEEB..',
    '...BBBB...',
  ];
  const f1 = [
    '..BBBBBB..',
    'WWBEEEEBWW',
    '.WWBBBBWW.',
  ];
  drawGridFrame(ctx, 3, 4, f0, pal);
  drawGridFrame(ctx, w + 3, 5, f1, pal);
  applyPixelOutline(ctx, w, h, frames);
  return { canvas, frameW: w, frameH: h, frames, anchorX: 0.5, anchorY: 0.5 };
}

function buildStaticPixelSprite(
  w: number,
  h: number,
  rows: string[],
  palette: Palette,
  anchorX = 0.5,
  anchorY = 0.5
): PixelSpriteSheet {
  const { canvas, ctx } = makeStripCanvas(w, h, 1);
  const ox = Math.floor((w - (rows[0]?.length ?? w)) / 2);
  const oy = Math.floor((h - rows.length) / 2);
  drawGridFrame(ctx, ox, oy, rows, palette);
  applyPixelOutline(ctx, w, h, 1);
  return { canvas, frameW: w, frameH: h, frames: 1, anchorX, anchorY };
}

export function getPixelSpriteSheet(id: PixelSpriteId): PixelSpriteSheet | null {
  if (typeof document === 'undefined') return null;
  const existing = cache.get(id);
  if (existing) return existing;

  let sheet: PixelSpriteSheet;
  switch (id) {
    case 'orc':
      sheet = buildOrcSheet();
      break;
    case 'vampire_noble':
      sheet = buildVampireNobleSheet();
      break;
    case 'werewolf':
      sheet = buildWerewolfSheet();
      break;
    case 'knight':
      sheet = buildKnightSheet();
      break;
    case 'saint':
      sheet = buildSaintSheet();
      break;
    case 'spellblade':
      sheet = buildSpellbladeSheet();
      break;
    case 'bat':
      sheet = buildBatSheet();
      break;
    case 'flower':
      sheet = buildFlowerSheet(false);
      break;
    case 'miniboss_blossom':
      sheet = buildFlowerSheet(true);
      break;
    case 'archer':
      sheet = buildArcherSheet();
      break;
    case 'holy_golem':
      sheet = buildGolemSheet('holy');
      break;
    case 'frost_golem':
      sheet = buildGolemSheet('frost');
      break;
    case 'stone_golem':
      sheet = buildGolemSheet('stone');
      break;
    case 'fly_minion':
      sheet = buildFlyMinionSheet();
      break;
    case 'px_banana':
      sheet = buildStaticPixelSprite(
        18,
        18,
        [
          '........B...',
          '.......YYb..',
          '......YYYY..',
          '.....YYYYy..',
          '....YYYYy...',
          '...YYYYy....',
          '..YYYYy.....',
          '.YYYYy......',
          '.YYy........',
          '..B.........',
        ],
        { Y: '#FACC15', y: '#F59E0B', B: '#78350F', b: '#FDE047' }
      );
      break;
    case 'px_axe':
      sheet = buildStaticPixelSprite(
        20,
        20,
        [
          '.....WWWWWW...',
          '....WWWwwwW...',
          '...BBBWWWWw...',
          '...BBB.www....',
          '...BBB........',
          '...BBB........',
          '...BBB........',
          '...BBB........',
          '...BBB........',
          '....B.........',
        ],
        { W: '#F8FAFC', w: '#94A3B8', B: '#92400E' }
      );
      break;
    case 'px_dagger':
      sheet = buildStaticPixelSprite(
        20,
        12,
        [
          '.......SSSSSSS..',
          '..GGGGGsSSSSSSSs',
          '.BGGGGGGGGSSSSs.',
          '..GGGGGsSSSSSSs.',
          '.......SSSSSSS..',
        ],
        { S: '#F8FAFC', s: '#94A3B8', G: '#F43F5E', B: '#78350F' }
      );
      break;
    case 'px_spear':
      sheet = buildStaticPixelSprite(
        24,
        12,
        [
          '.............SSSS...',
          '.............SSSSSS.',
          'BBBBBBBBBBBBBGSSSSSS',
          '.............SSSSSS.',
          '.............SSSS...',
        ],
        { S: '#E2E8F0', G: '#FACC15', B: '#92400E' }
      );
      break;
    case 'px_bird':
      sheet = buildStaticPixelSprite(
        18,
        16,
        [
          '..WW........',
          '.WWWW.......',
          '..WWWWBBBB..',
          '...BBBbbbBY.',
          '....BBBBbYY.',
          '...WWW..WW..',
        ],
        { B: '#38BDF8', b: '#0284C7', W: '#E0F2FE', Y: '#FACC15' }
      );
      break;
    case 'px_watergun':
      sheet = buildStaticPixelSprite(
        18,
        12,
        [
          '....BBBBBBBB..',
          '..bBBBBWWBBBB.',
          'bBBBBWWWWWWBBB',
          '..bBBBBWWBBBB.',
          '....BBBBBBBB..',
        ],
        { B: '#38BDF8', b: '#0284C7', W: '#E0F2FE' }
      );
      break;
    case 'px_blade':
      sheet = buildStaticPixelSprite(
        22,
        12,
        [
          '......SSSSSSSSS..',
          '..GGGGSSSSSSSSSSs',
          'BGGGGGGGGSSSSSSSS',
          '..GGGGSSSSSSSSSSs',
          '......SSSSSSSSS..',
        ],
        { S: '#E0F2FE', s: '#38BDF8', G: '#FACC15', B: '#78350F' }
      );
      break;
    case 'px_shield':
      sheet = buildStaticPixelSprite(
        18,
        20,
        [
          '.GGGGGGGGGGGG.',
          'GSSSSSSSSSSSSG',
          'GSSGGGGGGGGSSG',
          'GSSGSSBBSSGSSG',
          'GSSGSSBBSSGSSG',
          '.GSGGGGGGGGSG.',
          '.GSSSSSSSSSSG.',
          '..GSSSSSSSSG..',
          '...GSSSSSSG...',
          '....GGGGGG....',
          '......GG......',
        ],
        { G: '#FACC15', S: '#38BDF8', B: '#E0F2FE' }
      );
      break;
    case 'px_chain':
      sheet = buildStaticPixelSprite(
        18,
        18,
        [
          '....S......S....',
          '..SSmMM..MMmSS..',
          '...MMMMmmMMMM...',
          '..MMmmmmmmmmMM..',
          'SMMmMMRRRRMMmMMS',
          '..MMmmmmmmmmMM..',
          '...MMMMmmMMMM...',
          '..SSmMM..MMmSS..',
          '....S......S....',
        ],
        { M: '#94A3B8', m: '#475569', S: '#F8FAFC', R: '#E11D48' }
      );
      break;
    case 'px_feather':
      sheet = buildStaticPixelSprite(
        18,
        10,
        [
          '....PPPPPPpp..',
          '.SSPPPPPPPPPPp',
          '...PPPPPPpp...',
        ],
        { P: '#C084FC', p: '#7E22CE', S: '#F8FAFC' }
      );
      break;
    case 'px_greatsword':
      // Ornate Runed Arcane Greatsword for Spellblade God / Voidless Blade
      sheet = buildStaticPixelSprite(
        30,
        14,
        [
          '.........GG................... ',
          '........GGGg......SSSSSSSSSS..',
          '..BB...GGGGgSSSSSSSSSSSSSSSSSs',
          '.bBBGGGGGGWSSSSSSSSWSSSSSSSSSs',
          '..BB...GGGGgSSSSSSSSSSSSSSSSSs',
          '........GGGg......SSSSSSSSSS..',
          '.........GG................... ',
        ].map((r) => r.trimEnd().padEnd(30, '.')),
        { S: '#F8FAFC', s: '#94A3B8', W: '#38BDF8', G: '#FACC15', g: '#B45309', B: '#312E81', b: '#1E1B4B' }
      );
      break;
    case 'px_paladin_sword':
      // Royal Silver-Gold Paladin Broadsword for Knight
      sheet = buildStaticPixelSprite(
        28,
        12,
        [
          '........GG..................',
          '.......GGGg..SSSSSSSSSSs....',
          '.CB...GGGGgSSSSSSSSSSSSSSs..',
          '.BBGGGGGGCWSSSSSSSSSSSSSSSs.',
          '.CB...GGGGgSSSSSSSSSSSSSSs..',
          '.......GGGg..SSSSSSSSSSs....',
          '........GG..................',
        ],
        { S: '#F1F5F9', s: '#64748B', W: '#7DD3FC', G: '#FACC15', g: '#B45309', B: '#475569', C: '#38BDF8' }
      );
      break;
    case 'px_vampire_sword':
      // Gothic Bloodfang Crimson Blade for Vampire
      sheet = buildStaticPixelSprite(
        28,
        12,
        [
          '.......RR...................',
          '......RRRr...MMMMMMMMMMm....',
          '.DR..RRRRrSSSSSSSSSSSSSSSSm.',
          '.DDDRRRRCRMMMMMMMMMMMMMMMMMm',
          '.DR..RRRRrSSSSSSSSSSSSSSSSm.',
          '......RRRr...MMMMMMMMMMm....',
          '.......RR...................',
        ],
        { S: '#FDA4AF', M: '#E2E8F0', m: '#64748B', R: '#E11D48', r: '#881337', D: '#1E1B2E', C: '#F43F5E' }
      );
      break;
    case 'px_hunter_bow':
      // Emerald Recurve Bow & glowing arrow for Hunter
      sheet = buildStaticPixelSprite(
        16,
        24,
        [
          '..GGGG........',
          '...GGGB.......',
          '....BBBg......',
          '.....BBgS.....',
          '......BgS.....',
          '......BgS.....',
          '..RRRRRGSRRRW.',
          '......BgS.....',
          '......BgS.....',
          '.....BBgS.....',
          '....BBBg......',
          '...GGGB.......',
          '..GGGG........',
        ],
        { G: '#10B981', g: '#047857', B: '#78350F', S: '#E2E8F0', R: '#A7F3D0', W: '#F8FAFC' }
      );
      break;
  }
  cache.set(id, sheet);
  return sheet;
}
