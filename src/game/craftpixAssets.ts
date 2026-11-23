import { BiomeDef } from './types';

const imageCache = new Map<string, HTMLImageElement>();
let preloadStarted = false;

export function getCraftpixImg(path: string): HTMLImageElement | null {
  let img = imageCache.get(path);
  if (!img) {
    img = new Image();
    img.src = path;
    imageCache.set(path, img);
  }
  if (img.complete && img.naturalWidth > 0) {
    return img;
  }
  return null;
}

// Reusable scratch offscreen canvas for hit-flash & frozen/burn tinting
let scratchCanvas: HTMLCanvasElement | null = null;
let scratchCtx: CanvasRenderingContext2D | null = null;

function getScratch(w: number, h: number): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } | null {
  if (typeof document === 'undefined') return null;
  if (!scratchCanvas) {
    scratchCanvas = document.createElement('canvas');
    scratchCtx = scratchCanvas.getContext('2d');
  }
  if (!scratchCanvas || !scratchCtx) return null;
  const cw = Math.max(1, Math.ceil(w));
  const ch = Math.max(1, Math.ceil(h));
  if (scratchCanvas.width < cw) scratchCanvas.width = cw;
  if (scratchCanvas.height < ch) scratchCanvas.height = ch;
  scratchCtx.imageSmoothingEnabled = false;
  return { canvas: scratchCanvas, ctx: scratchCtx };
}

export interface SpriteDrawOptions {
  anchorX?: number; // 0..1 (default 0.5 center X)
  anchorY?: number; // 0..1 (default 0.85 near feet)
  flipX?: boolean;
  rotation?: number;
  alpha?: number;
  hitFlash?: boolean;
  tintColor?: string;
  tintAlpha?: number;
  smooth?: boolean;
  blend?: GlobalCompositeOperation;
}

export function drawSpriteRegion(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  sx: number,
  sy: number,
  sw: number,
  sh: number,
  x: number,
  y: number,
  dw: number,
  dh: number,
  opts: SpriteDrawOptions = {}
): void {
  const {
    anchorX = 0.5,
    anchorY = 0.85,
    flipX = false,
    rotation = 0,
    alpha = 1,
    hitFlash = false,
    tintColor,
    tintAlpha = 0.45,
    smooth = false,
    blend,
  } = opts;

  ctx.save();
  ctx.imageSmoothingEnabled = smooth;
  if (blend) ctx.globalCompositeOperation = blend;
  ctx.translate(x, y);
  if (rotation !== 0) ctx.rotate(rotation);
  if (flipX) ctx.scale(-1, 1);
  if (alpha < 1) ctx.globalAlpha *= alpha;

  const dx = -dw * anchorX;
  const dy = -dh * anchorY;

  if (hitFlash || tintColor) {
    const scratch = getScratch(sw, sh);
    if (scratch) {
      const { canvas: sc, ctx: sctx } = scratch;
      sctx.clearRect(0, 0, sw, sh);
      sctx.globalCompositeOperation = 'source-over';
      sctx.globalAlpha = 1;
      sctx.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);

      sctx.globalCompositeOperation = 'source-atop';
      if (hitFlash) {
        sctx.fillStyle = 'rgba(255, 255, 255, 0.88)';
        sctx.fillRect(0, 0, sw, sh);
      } else if (tintColor) {
        sctx.globalAlpha = tintAlpha;
        sctx.fillStyle = tintColor;
        sctx.fillRect(0, 0, sw, sh);
      }
      sctx.globalCompositeOperation = 'source-over';
      sctx.globalAlpha = 1;

      ctx.drawImage(sc, 0, 0, sw, sh, dx, dy, dw, dh);
      ctx.restore();
      return;
    }
  }

  ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh);
  ctx.restore();
}

export function drawSingleImg(
  ctx: CanvasRenderingContext2D,
  path: string,
  x: number,
  y: number,
  dw: number,
  dh: number,
  opts?: SpriteDrawOptions
): boolean {
  const img = getCraftpixImg(path);
  if (!img) return false;
  drawSpriteRegion(ctx, img, 0, 0, img.naturalWidth, img.naturalHeight, x, y, dw, dh, opts);
  return true;
}

/**
 * Draws a 4-direction RPG spritesheet where rows are:
 * Row 0 = Down, Row 1 = Up, Row 2 = Left, Row 3 = Right
 */
export function drawGrid4DirSprite(
  ctx: CanvasRenderingContext2D,
  path: string,
  cellSize: number,
  dirX: number,
  dirY: number,
  x: number,
  y: number,
  dw: number,
  dh: number,
  animTimeSec: number,
  fps: number,
  opts?: SpriteDrawOptions
): boolean {
  const img = getCraftpixImg(path);
  if (!img) return false;
  const cols = Math.max(1, Math.floor(img.naturalWidth / cellSize));
  const frame = Math.floor(animTimeSec * fps) % cols;
  let row = 0;
  if (Math.abs(dirY) > Math.abs(dirX) * 1.15) {
    row = dirY >= 0 ? 0 : 1;
  } else {
    row = dirX < 0 ? 2 : 3;
  }
  const rows = Math.max(1, Math.floor(img.naturalHeight / cellSize));
  row = Math.min(row, rows - 1);
  drawSpriteRegion(
    ctx,
    img,
    frame * cellSize,
    row * cellSize,
    cellSize,
    cellSize,
    x,
    y,
    dw,
    dh,
    opts
  );
  return true;
}

/**
 * Draws a horizontal strip sprite sheet where frames are arranged left-to-right.
 */
export function drawStripSprite(
  ctx: CanvasRenderingContext2D,
  path: string,
  frameSize: number,
  x: number,
  y: number,
  dw: number,
  dh: number,
  animProgressOrTime: number,
  fpsOrNormalized: number,
  opts?: SpriteDrawOptions
): boolean {
  const img = getCraftpixImg(path);
  if (!img) return false;
  const fw = frameSize > 0 ? frameSize : img.naturalHeight;
  const fh = img.naturalHeight;
  const cols = Math.max(1, Math.floor(img.naturalWidth / Math.max(1, fw)));
  let frame = 0;
  if (fpsOrNormalized <= 0) {
    frame = Math.min(cols - 1, Math.max(0, Math.floor(animProgressOrTime * cols)));
  } else {
    frame = Math.floor(animProgressOrTime * fpsOrNormalized) % cols;
  }
  drawSpriteRegion(ctx, img, frame * fw, 0, fw, fh, x, y, dw, dh, opts);
  return true;
}

/**
 * Draws a 3-direction strip set (`D_...`, `S_...`, `U_...`).
 */
export function drawDir3StripSprite(
  ctx: CanvasRenderingContext2D,
  basePath: string,
  actionSuffix: string,
  frameSize: number,
  baseSideFacing: 1 | -1,
  dirX: number,
  dirY: number,
  x: number,
  y: number,
  dw: number,
  dh: number,
  animTimeSec: number,
  fps: number,
  opts?: SpriteDrawOptions
): boolean {
  let prefix: 'D' | 'S' | 'U' = 'S';
  let flipX = false;
  if (Math.abs(dirY) > Math.abs(dirX) * 1.2) {
    prefix = dirY >= 0 ? 'D' : 'U';
  } else {
    prefix = 'S';
    const want = dirX < 0 ? -1 : 1;
    flipX = want !== baseSideFacing;
  }
  const path = `${basePath}/${prefix}_${actionSuffix}`;
  return drawStripSprite(ctx, path, frameSize, x, y, dw, dh, animTimeSec, fps, {
    ...opts,
    flipX,
  });
}

/**
 * Draws an animation made of numbered PNG frame paths.
 */
export function drawFrameArraySprite(
  ctx: CanvasRenderingContext2D,
  paths: readonly string[],
  x: number,
  y: number,
  dw: number,
  dh: number,
  animTimeOrProgress: number,
  fpsOrNormalized: number,
  opts?: SpriteDrawOptions
): boolean {
  if (paths.length === 0) return false;
  let idx = 0;
  if (fpsOrNormalized <= 0) {
    idx = Math.min(paths.length - 1, Math.max(0, Math.floor(animTimeOrProgress * paths.length)));
  } else {
    idx = Math.floor(animTimeOrProgress * fpsOrNormalized) % paths.length;
  }
  return drawSingleImg(ctx, paths[idx], x, y, dw, dh, opts);
}

/**
 * Draws an animation from a grid sprite sheet (e.g. Necromancer 17x7, Satyr 10x11,
 * Executioner 4x2 / 6x3) over a specific row or flattened frame range.
 */
export function drawGridSeqSprite(
  ctx: CanvasRenderingContext2D,
  path: string,
  cellW: number,
  cellH: number,
  cols: number,
  startRow: number,
  frameCount: number,
  x: number,
  y: number,
  dw: number,
  dh: number,
  animTimeSec: number,
  fps: number,
  opts?: SpriteDrawOptions
): boolean {
  const img = getCraftpixImg(path);
  if (!img) return false;
  const f = Math.floor(animTimeSec * fps) % Math.max(1, frameCount);
  const col = f % cols;
  const row = startRow + Math.floor(f / cols);
  drawSpriteRegion(ctx, img, col * cellW, row * cellH, cellW, cellH, x, y, dw, dh, opts);
  return true;
}

/**
 * Draws a single static cell (col, row) from an icon/monster grid sheet (e.g. 64-monsters 8x8).
 */
export function drawStaticGridCell(
  ctx: CanvasRenderingContext2D,
  path: string,
  cellW: number,
  cellH: number,
  col: number,
  row: number,
  x: number,
  y: number,
  dw: number,
  dh: number,
  opts?: SpriteDrawOptions
): boolean {
  const img = getCraftpixImg(path);
  if (!img) return false;
  drawSpriteRegion(ctx, img, col * cellW, row * cellH, cellW, cellH, x, y, dw, dh, opts);
  return true;
}

/**
 * Draws an animated horizontal strip from an offscreen HTMLCanvasElement (pixelSprites.ts).
 */
export function drawCanvasStripSprite(
  ctx: CanvasRenderingContext2D,
  sheet: { canvas: HTMLCanvasElement; frameW: number; frameH: number; frames: number },
  x: number,
  y: number,
  dw: number,
  dh: number,
  animTimeSec: number,
  fps: number,
  opts: SpriteDrawOptions = {}
): void {
  const {
    anchorX = 0.5,
    anchorY = 0.85,
    flipX = false,
    rotation = 0,
    alpha = 1,
    hitFlash = false,
    tintColor,
    tintAlpha = 0.45,
  } = opts;

  const frame = Math.floor(animTimeSec * fps) % Math.max(1, sheet.frames);
  const sx = frame * sheet.frameW;
  const sw = sheet.frameW;
  const sh = sheet.frameH;

  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.translate(x, y);
  if (rotation !== 0) ctx.rotate(rotation);
  if (flipX) ctx.scale(-1, 1);
  if (alpha < 1) ctx.globalAlpha *= alpha;

  const dx = -dw * anchorX;
  const dy = -dh * anchorY;

  if (hitFlash || tintColor) {
    const scratch = getScratch(sw, sh);
    if (scratch) {
      const { canvas: sc, ctx: sctx } = scratch;
      sctx.clearRect(0, 0, sw, sh);
      sctx.globalCompositeOperation = 'source-over';
      sctx.globalAlpha = 1;
      sctx.drawImage(sheet.canvas, sx, 0, sw, sh, 0, 0, sw, sh);

      sctx.globalCompositeOperation = 'source-atop';
      if (hitFlash) {
        sctx.fillStyle = 'rgba(255, 255, 255, 0.88)';
        sctx.fillRect(0, 0, sw, sh);
      } else if (tintColor) {
        sctx.globalAlpha = tintAlpha;
        sctx.fillStyle = tintColor;
        sctx.fillRect(0, 0, sw, sh);
      }
      sctx.globalCompositeOperation = 'source-over';
      sctx.globalAlpha = 1;

      ctx.drawImage(sc, 0, 0, sw, sh, dx, dy, dw, dh);
      ctx.restore();
      return;
    }
  }

  ctx.drawImage(sheet.canvas, sx, 0, sw, sh, dx, dy, dw, dh);
  ctx.restore();
}

// Frame path helpers
export function seqPaths(prefix: string, count: number, suffix = '.png', padDigits = 0): string[] {
  const out: string[] = [];
  for (let i = 1; i <= count; i++) {
    const num = padDigits > 0 ? String(i).padStart(padDigits, '0') : String(i);
    out.push(`${prefix}${num}${suffix}`);
  }
  return out;
}

// Cached frame arrays (all verified to exist in public/craftpix/)
export const FRAMES = {
  demonWalk: seqPaths('/craftpix/enemies/monster_demon/Walk', 6),
  demonAttack: seqPaths('/craftpix/enemies/monster_demon/Attack', 4),

  dragonWalk: seqPaths('/craftpix/enemies/monster_dragon/Walk', 5),
  dragonAttack: seqPaths('/craftpix/enemies/monster_dragon/Attack', 4),

  brazier: seqPaths('/craftpix/tilesets/brazier_', 4),

  // Elemental slashes (800x600) — mapped strictly to existing frames
  fireSlash: seqPaths('/craftpix/fx/elemental/fire_slash/Fire Slash_Frame_', 12, '.png', 2),
  waterSlash: seqPaths('/craftpix/fx/elemental/poison_slashes/Poisonous Slashes_Frame_', 9, '.png', 2),
  lightningSlash: seqPaths('/craftpix/fx/elemental/lightning_slash/Lightning Slash_Frame_', 12, '.png', 2),
  windSlash: seqPaths('/craftpix/fx/elemental/lightning_slash/Lightning Slash_Frame_', 12, '.png', 2),
  poisonSlash: seqPaths('/craftpix/fx/elemental/poison_slashes/Poisonous Slashes_Frame_', 9, '.png', 2),
  ultimateSlash: seqPaths('/craftpix/fx/elemental/fire_slash/Fire Slash_Frame_', 12, '.png', 2),

  // Explosions (256x256 or 128x128)
  expFire: seqPaths('/craftpix/fx/explosions/Explosion/Explosion', 10),
  expCircle: seqPaths('/craftpix/fx/explosions/Circle_explosion/Circle_explosion', 10),
  expBlue: seqPaths('/craftpix/fx/explosions/Explosion_blue_circle/Explosion_blue_circle', 10),
  expGas: seqPaths('/craftpix/fx/explosions/Explosion_gas_circle/Explosion_gas_circle', 10),
  expTwoColor: seqPaths('/craftpix/fx/explosions/Explosion_two_colors/Explosion_two_colors', 10),
  expFlame: seqPaths('/craftpix/fx/explosions/Fire/Fire', 5),
  expSmoke: seqPaths('/craftpix/fx/explosions/Explosion_gas_circle/Explosion_gas_circle', 10),
  lightningBolt: seqPaths('/craftpix/fx/elemental/lightning_slash/Lightning Slash_Frame_', 12, '.png', 2),
} as const;

export type VfxId =
  | 'crit_hit'
  | 'divine_shield'
  | 'ground_slam'
  | 'holy_pillar'
  | 'holy_sigil'
  | 'holy_slash'
  | 'holy_smite'
  | 'moon_eclipse'
  | 'parry'
  | 'sanctum_burst'
  | 'shadow_slash';

export interface VfxSheetMeta {
  path: string;
  cols: number;
  rows: number;
  cellW: number;
  cellH: number;
  startFrame: number;
  endFrame: number;
}

export const VFX_SHEETS: Record<VfxId, VfxSheetMeta> = {
  crit_hit: {
    path: '/vfx/crit_hit.png',
    cols: 5,
    rows: 6,
    cellW: 216,
    cellH: 136,
    startFrame: 0,
    endFrame: 24,
  },
  divine_shield: {
    path: '/vfx/divine_shield.png',
    cols: 9,
    rows: 8,
    cellW: 88,
    cellH: 84,
    startFrame: 0,
    endFrame: 71,
  },
  ground_slam: {
    path: '/vfx/ground_slam.png',
    cols: 9,
    rows: 11,
    cellW: 288,
    cellH: 208,
    startFrame: 0,
    endFrame: 89,
  },
  holy_pillar: {
    path: '/vfx/holy_pillar.png',
    cols: 12,
    rows: 9,
    cellW: 192,
    cellH: 232,
    startFrame: 1,
    endFrame: 101,
  },
  holy_sigil: {
    path: '/vfx/holy_sigil.png',
    cols: 10,
    rows: 13,
    cellW: 168,
    cellH: 128,
    startFrame: 4,
    endFrame: 116,
  },
  holy_slash: {
    path: '/vfx/holy_slash.png',
    cols: 5,
    rows: 5,
    cellW: 136,
    cellH: 104,
    startFrame: 0,
    endFrame: 17,
  },
  holy_smite: {
    path: '/vfx/holy_smite.png',
    cols: 9,
    rows: 10,
    cellW: 224,
    cellH: 176,
    startFrame: 0,
    endFrame: 76,
  },
  moon_eclipse: {
    path: '/vfx/moon_eclipse.png',
    cols: 11,
    rows: 11,
    cellW: 160,
    cellH: 144,
    startFrame: 0,
    endFrame: 119,
  },
  parry: {
    path: '/vfx/parry.png',
    cols: 5,
    rows: 7,
    cellW: 200,
    cellH: 112,
    startFrame: 0,
    endFrame: 25,
  },
  sanctum_burst: {
    path: '/vfx/sanctum_burst.png',
    cols: 11,
    rows: 11,
    cellW: 128,
    cellH: 128,
    startFrame: 0,
    endFrame: 119,
  },
  shadow_slash: {
    path: '/vfx/shadow_slash.png',
    cols: 5,
    rows: 5,
    cellW: 164,
    cellH: 108,
    startFrame: 1,
    endFrame: 20,
  },
};

export function drawVfxSheet(
  ctx: CanvasRenderingContext2D,
  vfxId: VfxId,
  x: number,
  y: number,
  dw: number,
  dh: number,
  progressOrTime: number,
  loopFps = 0,
  opts: SpriteDrawOptions = {}
): boolean {
  const meta = VFX_SHEETS[vfxId];
  const img = getCraftpixImg(meta.path);
  if (!img) return false;
  const totalFrames = Math.max(1, meta.endFrame - meta.startFrame + 1);
  let frameOffset = 0;
  if (loopFps > 0) {
    frameOffset = Math.floor(Math.max(0, progressOrTime) * loopFps) % totalFrames;
  } else {
    const p = Math.max(0, Math.min(0.9999, progressOrTime));
    frameOffset = Math.floor(p * totalFrames);
  }
  const frameIdx = meta.startFrame + frameOffset;
  const col = frameIdx % meta.cols;
  const row = Math.floor(frameIdx / meta.cols);
  drawSpriteRegion(
    ctx,
    img,
    col * meta.cellW,
    row * meta.cellH,
    meta.cellW,
    meta.cellH,
    x,
    y,
    dw,
    dh,
    {
      anchorX: 0.5,
      anchorY: 0.5,
      smooth: true,
      ...opts,
    }
  );
  return true;
}

// High-Craft Seamless 2.5D Isometric Diamond Stone & Terrain Cache
const biomeTileCache = new Map<string, HTMLCanvasElement>();

interface BiomeTilePalette {
  baseBg: string;
  stoneShades: string[];
  highlightBevel: string;
  shadowBevel: string;
  mortar: string;
  seamAccent: string;
  mossOrVein: string;
  speckLight: string;
  speckDark: string;
}

const BIOME_TILE_PALETTES: Record<BiomeDef['themeStyle'], BiomeTilePalette> = {
  crypt: {
    baseBg: '#090D16',
    stoneShades: ['#141A29', '#182032', '#111724', '#1B2336', '#161D2C'],
    highlightBevel: 'rgba(148, 163, 184, 0.16)',
    shadowBevel: 'rgba(2, 4, 9, 0.58)',
    mortar: '#060911',
    seamAccent: 'rgba(129, 140, 248, 0.09)',
    mossOrVein: 'rgba(100, 116, 139, 0.14)',
    speckLight: 'rgba(203, 213, 225, 0.06)',
    speckDark: 'rgba(2, 6, 14, 0.35)',
  },
  forest: {
    baseBg: '#06140D',
    stoneShades: ['#0D2318', '#112B1E', '#0A1C13', '#143022', '#0E261A'],
    highlightBevel: 'rgba(110, 231, 183, 0.12)',
    shadowBevel: 'rgba(2, 10, 6, 0.60)',
    mortar: '#040D08',
    seamAccent: 'rgba(52, 211, 153, 0.14)',
    mossOrVein: 'rgba(21, 128, 61, 0.28)',
    speckLight: 'rgba(167, 243, 208, 0.06)',
    speckDark: 'rgba(3, 12, 7, 0.38)',
  },
  sea: {
    baseBg: '#05121F',
    stoneShades: ['#0A2136', '#0E2942', '#081B2D', '#10304C', '#0C253B'],
    highlightBevel: 'rgba(125, 211, 252, 0.15)',
    shadowBevel: 'rgba(2, 9, 18, 0.62)',
    mortar: '#030B14',
    seamAccent: 'rgba(56, 189, 248, 0.15)',
    mossOrVein: 'rgba(14, 116, 144, 0.26)',
    speckLight: 'rgba(186, 230, 253, 0.07)',
    speckDark: 'rgba(2, 8, 16, 0.38)',
  },
  volcano: {
    baseBg: '#120806',
    stoneShades: ['#1F1210', '#261512', '#190E0D', '#2A1814', '#211311'],
    highlightBevel: 'rgba(251, 146, 60, 0.14)',
    shadowBevel: 'rgba(8, 2, 1, 0.68)',
    mortar: '#0A0403',
    seamAccent: 'rgba(249, 115, 22, 0.24)',
    mossOrVein: 'rgba(234, 88, 12, 0.18)',
    speckLight: 'rgba(253, 186, 116, 0.06)',
    speckDark: 'rgba(6, 2, 1, 0.42)',
  },
  void: {
    baseBg: '#0B0617',
    stoneShades: ['#160E2B', '#1C1236', '#120B23', '#20153D', '#18102E'],
    highlightBevel: 'rgba(192, 132, 252, 0.16)',
    shadowBevel: 'rgba(4, 1, 12, 0.66)',
    mortar: '#06030E',
    seamAccent: 'rgba(168, 85, 247, 0.20)',
    mossOrVein: 'rgba(126, 34, 206, 0.22)',
    speckLight: 'rgba(233, 213, 255, 0.07)',
    speckDark: 'rgba(4, 1, 10, 0.42)',
  },
};

function tileHash(a: number, b: number): number {
  const n = Math.sin(a * 127.1 + b * 311.7) * 43758.5453123;
  return n - Math.floor(n);
}

/**
 * Generates a seamless isometric diamond flagstone tile pattern in world-space coordinates
 * (which gets foreshortened by ISO_TILT when drawn in drawBiomeBackground).
 * Because a 512x512 square wraps identically on X and Y, 45-degree diamond paving tiles
 * repeat seamlessly across infinite space without visible seams or flat brick walls!
 */
export function getBiomeTileCanvas(themeStyle: BiomeDef['themeStyle']): HTMLCanvasElement | null {
  if (typeof document === 'undefined') return null;

  const existing = biomeTileCache.get(themeStyle);
  if (existing) return existing;

  const size = 512;
  const c = document.createElement('canvas');
  c.width = size;
  c.height = size;
  const g = c.getContext('2d');
  if (!g) return null;

  const pal = BIOME_TILE_PALETTES[themeStyle] || BIOME_TILE_PALETTES.crypt;
  g.fillStyle = pal.baseBg;
  g.fillRect(0, 0, size, size);

  // Isometric diamond lattice in world-plane (before ISO_TILT squash -> 2:1 diamonds on screen!)
  const hw = 64; // 512 / 64 = 8 exact half-widths -> seamless wrap
  const hh = 64;

  // Helper to wrap lattice indices mod 4 along diagonal axes so edge tiles match seamlessly
  const cols = size / hw; // 8
  const rows = size / hh; // 8

  for (let gx = -2; gx <= cols + 2; gx++) {
    for (let gy = -2; gy <= rows + 2; gy++) {
      // Staggered diamond centers on checkerboard parity
      if (((gx + gy) & 1) !== 0) continue;

      const wrapX = ((gx % cols) + cols) % cols;
      const wrapY = ((gy % rows) + rows) % rows;
      const h = tileHash(wrapX, wrapY);
      const h2 = tileHash(wrapX + 19, wrapY + 41);

      const cx = gx * hw;
      const cy = gy * hh;

      const shade = pal.stoneShades[Math.floor(h * pal.stoneShades.length) % pal.stoneShades.length];

      // Inset slightly so dark mortar grooves show cleanly between beveled slabs
      const inset = 3.2;
      const dw = hw - inset;
      const dh = hh - inset;

      // Base flagstone diamond
      g.fillStyle = shade;
      g.beginPath();
      g.moveTo(cx, cy - dh);
      g.lineTo(cx + dw, cy);
      g.lineTo(cx, cy + dh);
      g.lineTo(cx - dw, cy);
      g.closePath();
      g.fill();

      // Subtle inner surface bevel / patina gradient
      const innerGrad = g.createLinearGradient(cx - dw * 0.6, cy - dh * 0.6, cx + dw * 0.6, cy + dh * 0.6);
      innerGrad.addColorStop(0, pal.highlightBevel);
      innerGrad.addColorStop(0.55, 'rgba(0,0,0,0)');
      innerGrad.addColorStop(1, pal.shadowBevel);
      g.fillStyle = innerGrad;
      g.fill();

      // Top-left crisp chisel edge highlight (2.5D bevel catchlight)
      g.strokeStyle = pal.highlightBevel;
      g.lineWidth = 1.6;
      g.beginPath();
      g.moveTo(cx - dw + 1, cy);
      g.lineTo(cx, cy - dh + 1);
      g.lineTo(cx + dw - 1, cy);
      g.stroke();

      // Bottom-right deep bevel shadow
      g.strokeStyle = pal.shadowBevel;
      g.lineWidth = 2.0;
      g.beginPath();
      g.moveTo(cx + dw - 1, cy);
      g.lineTo(cx, cy + dh - 1);
      g.lineTo(cx - dw + 1, cy);
      g.stroke();

      // Weathering cracks on some flagstones
      if (h2 > 0.56) {
        g.strokeStyle = pal.mortar;
        g.lineWidth = 1.4;
        g.beginPath();
        g.moveTo(cx + (h - 0.5) * 18, cy - dh * 0.45);
        g.lineTo(cx + (h2 - 0.5) * 14, cy + 2);
        g.lineTo(cx + (h - 0.5) * 26, cy + dh * 0.36);
        g.stroke();

        // Glowing magma/arcane/moss seam accent inside deep cracks
        if (h2 > 0.78) {
          g.strokeStyle = pal.seamAccent;
          g.lineWidth = 1.2;
          g.stroke();
        }
      }

      // Moss, rune inlay, or corroded stone patches
      if (h > 0.68) {
        g.fillStyle = pal.mossOrVein;
        g.beginPath();
        g.ellipse(
          cx + (h2 - 0.5) * 24,
          cy + (h - 0.8) * 32,
          12 + h2 * 12,
          7 + h * 7,
          h * Math.PI,
          0,
          Math.PI * 2
        );
        g.fill();
      }

      // Carved inner square/diamond sigil on rare flagstones
      if (h > 0.84) {
        g.strokeStyle = pal.seamAccent;
        g.lineWidth = 1.3;
        g.beginPath();
        g.moveTo(cx, cy - dh * 0.48);
        g.lineTo(cx + dw * 0.48, cy);
        g.lineTo(cx, cy + dh * 0.48);
        g.lineTo(cx - dw * 0.48, cy);
        g.closePath();
        g.stroke();
      }
    }
  }

  // Organic weathered grain flecks across the 512x512 texture
  for (let i = 0; i < 160; i++) {
    const px = tileHash(i, 3.1) * size;
    const py = tileHash(i, 9.7) * size;
    const sz = 1.5 + tileHash(i, 5.4) * 3.5;
    g.fillStyle = i % 2 === 0 ? pal.speckDark : pal.speckLight;
    g.beginPath();
    g.arc(px, py, sz, 0, Math.PI * 2);
    g.fill();
  }

  biomeTileCache.set(themeStyle, c);
  return c;
}

export function preloadCraftpixAssets(): void {
  if (preloadStarted) return;
  preloadStarted = true;

  const paths: string[] = [
    // Interactive chests, braziers & props
    '/craftpix/tilesets/chest_closed.png',
    '/craftpix/tilesets/chest_open.png',
    ...FRAMES.brazier,

    // Verified non-cartoon 2.5D enemy sprites + dragon + demon
    '/craftpix/enemies/td_enemy1/D_Run.png',
    '/craftpix/enemies/td_enemy1/S_Run.png',
    '/craftpix/enemies/td_enemy1/U_Run.png',
    '/craftpix/enemies/td_enemy2/D_Run.png',
    '/craftpix/enemies/td_enemy2/S_Run.png',
    '/craftpix/enemies/td_enemy2/U_Run.png',
    '/craftpix/enemies/td_enemy2/D_Special.png',
    '/craftpix/enemies/td_enemy2/S_Special.png',
    '/craftpix/enemies/td_enemy2/U_Special.png',
    '/craftpix/enemies/td_enemy3/D_Fly.png',
    '/craftpix/enemies/td_enemy3/S_Fly.png',
    '/craftpix/enemies/td_enemy3/U_Fly.png',
    '/craftpix/enemies/td_enemy3/D_Attack.png',
    '/craftpix/enemies/td_enemy3/S_Attack.png',
    '/craftpix/enemies/td_enemy3/U_Attack.png',
    ...FRAMES.demonWalk,
    ...FRAMES.demonAttack,
    ...FRAMES.dragonWalk,
    ...FRAMES.dragonAttack,

    // FX & Projectiles
    '/craftpix/fx/arrows/10.png',
    '/craftpix/fx/barrel/1.png',
    ...FRAMES.fireSlash,
    ...FRAMES.lightningSlash,
    ...FRAMES.poisonSlash,
    ...FRAMES.expFire,
    ...FRAMES.expCircle,
    ...FRAMES.expBlue,
    ...FRAMES.expGas,
    ...FRAMES.expTwoColor,
    ...FRAMES.expFlame,

    // User-provided sprite sheets (/sprites/ copied from /other/)
    '/sprites/wizard/idle.png',
    '/sprites/wizard/run.png',
    '/sprites/wizard/attack1.png',
    '/sprites/wizard/attack2.png',
    '/sprites/evil_wizard/idle.png',
    '/sprites/evil_wizard/run.png',
    '/sprites/evil_wizard/attack1.png',
    '/sprites/evil_wizard/attack2.png',
    '/sprites/necromancer/sheet.png',
    '/sprites/huntress/idle.png',
    '/sprites/huntress/run.png',
    '/sprites/huntress/dash.png',
    '/sprites/huntress/dash_attack.png',
    '/sprites/huntress/attack1.png',
    '/sprites/huntress/attack_slash.png',
    '/sprites/shadeflit/idle.png',
    '/sprites/shadeflit/run.png',
    '/sprites/hallokin/idle.png',
    '/sprites/hallokin/run.png',
    '/sprites/hallokin/attack.png',
    '/sprites/wetlands_boss/idle.png',
    '/sprites/wetlands_boss/walk.png',
    '/sprites/wetlands_boss/attack1.png',
    '/sprites/wetlands_boss/attack2.png',
    '/sprites/executioner/idle2.png',
    '/sprites/executioner/attacking.png',
    '/sprites/executioner/skill1.png',
    '/sprites/executioner/summonIdle.png',
    '/sprites/crow/crow_idle.png',
    '/sprites/crow/crow_walk.png',
    '/sprites/crow/crow_attack.png',
    '/sprites/satyr/sheet.png',
    '/sprites/monsters64/sheet.png',
    '/sprites/abyssal_gate.png',

    // Custom VFX sprite sheets (/public/vfx/)
    ...Object.values(VFX_SHEETS).map((v) => v.path),
  ];

  for (const p of paths) {
    getCraftpixImg(p);
  }
}
