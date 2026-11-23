import {
  drawCanvasStripSprite,
  drawDir3StripSprite,
  drawFrameArraySprite,
  drawGridSeqSprite,
  drawSingleImg,
  drawSpriteRegion,
  drawStaticGridCell,
  drawStripSprite,
  drawVfxSheet,
  FRAMES,
  getBiomeTileCanvas,
  VFX_SHEETS,
  VfxId,
} from './craftpixAssets';
import { MAGE_ANIMS, MageAnimId } from './mageSprites';
import { ELEMENTS, SEVEN_SINS } from './data';
import { ParticleShape } from './fusionVfx';
import {
  BreakableProp,
  hasMapTileProp,
  LANDMARK_META,
  MapLandmark,
  MapObstacle,
  MapTrap,
  SECRET_ROOM_HALF_H,
  SECRET_ROOM_HALF_W,
  SecretRoomKind,
  TerrainZone,
  TrapRuntimeState,
} from './mapObstacles';
import { getPixelSpriteSheet } from './pixelSprites';
import {
  drawPackVfx,
  drawPackVfxTiledBeam,
  PACK_VFX,
  PackVfxKey,
} from './packVfx';
import { orderPolygonVertices } from './systems/combat';
import { KnightSacredBlade, SaintSigil } from './systems/simTypes';
import {
  BiomeDef,
  BossBuffId,
  DamageType,
  ElementId,
  EnemyKind,
  EnemyStatusEntry,
  EnemyStatusId,
  RaceClassId,
  RaceId,
  SinId,
  WeaponId,
  WeatherId,
} from './types';

export const ISO_TILT = 0.68;

export function worldToIsoY(wy: number): number {
  return wy * ISO_TILT;
}

const mageSpriteImages: Partial<Record<MageAnimId, HTMLImageElement>> = {};

export function preloadMageSprites(): void {
  if (typeof Image === 'undefined') return;
  (Object.keys(MAGE_ANIMS) as MageAnimId[]).forEach((id) => {
    if (mageSpriteImages[id]) return;
    const img = new Image();
    img.src = MAGE_ANIMS[id].src;
    mageSpriteImages[id] = img;
  });
}

const ISO_TILE_HW = 92; // Diamond horizontal half-width
const ISO_TILE_HH = ISO_TILE_HW * ISO_TILT; // Diamond vertical half-height

export interface BiomeProp25D {
  id: string;
  x: number;
  y: number;
  style: BiomeDef['themeStyle'];
  variant: number;
  scale: number;
}

export function getVisible25DProps(
  camWorldX: number,
  camScreenY: number,
  w: number,
  h: number,
  themeStyle: BiomeDef['themeStyle'],
  runSeed?: number
): BiomeProp25D[] {
  if (runSeed === -1) return [];
  const props: BiomeProp25D[] = [];
  const corners = [
    { cx: 0, cy: 0 },
    { cx: w, cy: 0 },
    { cx: 0, cy: h },
    { cx: w, cy: h },
  ];
  let minIx = Infinity;
  let maxIx = -Infinity;
  let minIy = Infinity;
  let maxIy = -Infinity;
  for (const c of corners) {
    const ux = (c.cx + camWorldX) / ISO_TILE_HW;
    const vy = (c.cy + camScreenY) / ISO_TILE_HH;
    const ix = (ux + vy) * 0.5;
    const iy = (vy - ux) * 0.5;
    if (ix < minIx) minIx = ix;
    if (ix > maxIx) maxIx = ix;
    if (iy < minIy) minIy = iy;
    if (iy > maxIy) maxIy = iy;
  }
  const sIx = Math.floor(minIx) - 2;
  const eIx = Math.ceil(maxIx) + 2;
  const sIy = Math.floor(minIy) - 2;
  const eIy = Math.ceil(maxIy) + 3;

  for (let ix = sIx; ix <= eIx; ix++) {
    for (let iy = sIy; iy <= eIy; iy++) {
      if (runSeed !== undefined && hasMapTileProp(ix, iy, runSeed, themeStyle)) {
        continue;
      }
      const hash = Math.abs(Math.sin(ix * 23.1407 + iy * 91.7321) * 43758.5453) % 1;
      if (hash > 0.908) {
        const wx = (ix - iy) * ISO_TILE_HW;
        const wy = (ix + iy) * ISO_TILE_HW;
        if (Math.hypot(wx, wy) < 170) continue;
        const variant = Math.floor(((hash * 1000) % 1) * 4);
        const scale = 0.95 + ((hash * 100) % 1) * 0.34;
        props.push({
          id: `${ix}:${iy}`,
          x: wx,
          y: wy,
          style: themeStyle,
          variant,
          scale,
        });
      }
    }
  }
  return props;
}

export function draw25DProp(
  ctx: CanvasRenderingContext2D,
  prop: BiomeProp25D,
  playerX: number,
  playerY: number,
  nowMs: number
): void {
  const sy = prop.y * ISO_TILT;
  const sc = prop.scale;
  const behindFade =
    playerY < prop.y &&
    Math.abs(playerX - prop.x) < 52 * sc &&
    prop.y - playerY < 130 * sc
      ? 0.44
      : 1;

  ctx.save();
  ctx.translate(prop.x, sy);
  ctx.scale(sc, sc);
  ctx.globalAlpha = behindFade;

  // Deep directional 2.5D cast shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.48)';
  ctx.beginPath();
  ctx.ellipse(10, 4, 28, 12, 0.14, 0, Math.PI * 2);
  ctx.fill();

  const v = prop.variant % 4;

  if ((prop.style === 'volcano' || prop.style === 'crypt') && v === 3) {
    // Flickering Iron Fire Brazier with Warm Radial Ground Light
    const flk = 0.28 + Math.sin(nowMs * 0.011 + prop.x) * 0.09;
    const pool = ctx.createRadialGradient(0, -14, 6, 0, -10, 82);
    pool.addColorStop(0, `rgba(251, 146, 60, ${(flk * 1.15).toFixed(2)})`);
    pool.addColorStop(0.5, `rgba(234, 88, 12, ${(flk * 0.42).toFixed(2)})`);
    pool.addColorStop(1, 'rgba(234, 88, 12, 0)');
    ctx.fillStyle = pool;
    ctx.beginPath();
    ctx.ellipse(0, -8, 82, 54, 0, 0, Math.PI * 2);
    ctx.fill();

    // Stone pedestal base
    ctx.fillStyle = '#1E293B';
    ctx.strokeStyle = '#090D16';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-16, 4);
    ctx.lineTo(-11, -12);
    ctx.lineTo(11, -12);
    ctx.lineTo(16, 4);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.imageSmoothingEnabled = false;
    const ok = drawFrameArraySprite(ctx, FRAMES.brazier, 0, -4, 54, 60, nowMs * 0.001, 9, {
      anchorX: 0.5,
      anchorY: 0.88,
    });
    if (!ok) {
      ctx.fillStyle = '#334155';
      ctx.fillRect(-10, -32, 20, 22);
      ctx.fillStyle = '#F97316';
      ctx.beginPath();
      ctx.arc(0, -36, 10, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (prop.style === 'forest') {
    if (v === 3) {
      // Moss-Bound Ancient Rune Monolith
      const glow = 0.35 + Math.sin(nowMs * 0.004 + prop.x) * 0.18;
      const halo = ctx.createRadialGradient(0, -18, 4, 0, -16, 56);
      halo.addColorStop(0, `rgba(52, 211, 153, ${(glow * 0.45).toFixed(2)})`);
      halo.addColorStop(1, 'rgba(16, 185, 129, 0)');
      ctx.fillStyle = halo;
      ctx.beginPath();
      ctx.ellipse(0, -12, 56, 36, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#1E293B';
      ctx.strokeStyle = '#06120B';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(-19, 5);
      ctx.lineTo(-15, -36);
      ctx.lineTo(0, -52);
      ctx.lineTo(16, -34);
      ctx.lineTo(19, 5);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Right shadow plane
      ctx.fillStyle = 'rgba(2, 6, 14, 0.42)';
      ctx.beginPath();
      ctx.moveTo(0, -52);
      ctx.lineTo(16, -34);
      ctx.lineTo(19, 5);
      ctx.lineTo(2, 5);
      ctx.closePath();
      ctx.fill();

      // Moss cap
      ctx.fillStyle = '#15803D';
      ctx.beginPath();
      ctx.ellipse(-5, -32, 11, 5, -0.25, 0, Math.PI * 2);
      ctx.fill();

      // Glowing Druid Rune
      ctx.strokeStyle = `rgba(110, 231, 183, ${glow.toFixed(2)})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-2, -32);
      ctx.lineTo(-2, -10);
      ctx.moveTo(-9, -24);
      ctx.lineTo(5, -18);
      ctx.stroke();
    } else {
      // Ancient Gnarled Darkwood Pine / Twisted Deadwood
      ctx.fillStyle = '#241812';
      ctx.strokeStyle = '#070A0E';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-14, 7);
      ctx.lineTo(-7, -8);
      ctx.lineTo(-6, -46);
      ctx.lineTo(6, -46);
      ctx.lineTo(7, -8);
      ctx.lineTo(14, 7);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      const canopyDark = v === 0 ? '#0A2E1C' : v === 1 ? '#0F3824' : '#083329';
      const canopyMid = v === 0 ? '#14532D' : v === 1 ? '#166534' : '#065F46';
      const rim = v === 2 ? 'rgba(52, 211, 153, 0.32)' : 'rgba(74, 222, 128, 0.25)';

      for (let tier = 0; tier < 3; tier++) {
        const ty = -32 - tier * 19;
        const tw = 34 - tier * 7;
        ctx.fillStyle = canopyDark;
        ctx.beginPath();
        ctx.moveTo(0, ty - 28);
        ctx.lineTo(tw, ty + 6);
        ctx.lineTo(-tw, ty + 6);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Lit left half of canopy
        ctx.fillStyle = canopyMid;
        ctx.beginPath();
        ctx.moveTo(0, ty - 28);
        ctx.lineTo(0, ty + 6);
        ctx.lineTo(-tw, ty + 6);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = rim;
        ctx.lineWidth = 1.3;
        ctx.beginPath();
        ctx.moveTo(-tw + 2, ty + 4);
        ctx.lineTo(0, ty - 26);
        ctx.stroke();
      }
    }
  } else if (prop.style === 'sea') {
    if (v === 0) {
      ctx.imageSmoothingEnabled = false;
      const ok = drawSingleImg(ctx, '/craftpix/fx/barrel/1.png', 0, 6, 46, 46, {
        anchorX: 0.5,
        anchorY: 0.9,
        tintColor: '#0284C7',
        tintAlpha: 0.22,
      });
      if (!ok) {
        ctx.fillStyle = '#0369A1';
        ctx.fillRect(-12, -26, 24, 28);
      }
    } else if (v === 3) {
      // Sunken Ruined Marble Pillar
      ctx.fillStyle = '#0F2942';
      ctx.strokeStyle = '#030B14';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(-14, -56, 28, 58, 3);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#164E63';
      ctx.fillRect(-14, -56, 12, 58);
      ctx.fillStyle = '#06B6D4';
      ctx.fillRect(-16, -2, 32, 6);
    } else {
      // Bioluminescent Abyssal Coral Spire
      const coralCol = v === 1 ? '#EC4899' : '#22D3EE';
      const glow = ctx.createRadialGradient(0, -28, 4, 0, -28, 52);
      glow.addColorStop(0, `${coralCol}44`);
      glow.addColorStop(1, `${coralCol}00`);
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(0, -28, 52, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#091B2C';
      ctx.beginPath();
      ctx.ellipse(0, 2, 18, 7, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = coralCol;
      ctx.lineWidth = 5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(0, 2);
      ctx.quadraticCurveTo(-5, -24, -13, -44);
      ctx.moveTo(0, -10);
      ctx.quadraticCurveTo(9, -28, 13, -48);
      ctx.moveTo(-1, -18);
      ctx.lineTo(1, -58);
      ctx.stroke();
    }
  } else if (prop.style === 'volcano') {
    // Jagged Basalt Magma Spire
    const glow = 0.45 + Math.sin(nowMs * 0.006 + prop.x) * 0.22;
    const halo = ctx.createRadialGradient(0, -18, 4, 0, -18, 60);
    halo.addColorStop(0, `rgba(249, 115, 22, ${(glow * 0.35).toFixed(2)})`);
    halo.addColorStop(1, 'rgba(234, 88, 12, 0)');
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.ellipse(0, -14, 60, 38, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#1C1311';
    ctx.strokeStyle = '#080403';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(-20, 5);
    ctx.lineTo(-12, -52 - v * 6);
    ctx.lineTo(4, -64 - v * 6);
    ctx.lineTo(20, 5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Molten fissure vein
    ctx.strokeStyle = `rgba(251, 146, 60, ${(0.55 + glow * 0.4).toFixed(2)})`;
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(-4, 2);
    ctx.lineTo(-2, -26);
    ctx.lineTo(6, -46);
    ctx.stroke();
  } else if (prop.style === 'crypt') {
    if (v === 2) {
      // Ancient Mossy Abyssal Gate (from user's SHADOW Series assets)
      ctx.imageSmoothingEnabled = false;
      const ok = drawSingleImg(ctx, '/sprites/abyssal_gate.png', 0, 6, 118, 44, {
        anchorX: 0.5,
        anchorY: 0.92,
      });
      if (!ok) {
        ctx.fillStyle = '#1E293B';
        ctx.fillRect(-20, -40, 40, 42);
      }
    } else if (v === 0) {
      // Broken Gothic Cathedral Column with Chiseled Base
      ctx.fillStyle = '#1E293B';
      ctx.strokeStyle = '#060911';
      ctx.lineWidth = 2.2;
      // Plinth
      ctx.beginPath();
      ctx.roundRect(-18, -8, 36, 12, 2);
      ctx.fill();
      ctx.stroke();
      // Fluted shaft
      ctx.fillStyle = '#273246';
      ctx.beginPath();
      ctx.moveTo(-12, -8);
      ctx.lineTo(-12, -58);
      ctx.lineTo(-2, -50);
      ctx.lineTo(5, -64);
      ctx.lineTo(12, -54);
      ctx.lineTo(12, -8);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      // Shadow right side
      ctx.fillStyle = 'rgba(4, 7, 15, 0.42)';
      ctx.beginPath();
      ctx.moveTo(0, -52);
      ctx.lineTo(5, -64);
      ctx.lineTo(12, -54);
      ctx.lineTo(12, -8);
      ctx.lineTo(0, -8);
      ctx.closePath();
      ctx.fill();
      // Fluting lines
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.22)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(-6, -12);
      ctx.lineTo(-6, -53);
      ctx.moveTo(2, -12);
      ctx.lineTo(2, -56);
      ctx.stroke();
    } else {
      // Ancient Gothic Tombstone / Soul Obelisk
      ctx.fillStyle = '#252F42';
      ctx.strokeStyle = '#070A12';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.roundRect(-15, -48 - v * 5, 30, 50 + v * 5, [13, 13, 2, 2]);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = 'rgba(6, 9, 17, 0.36)';
      ctx.fillRect(1, -46 - v * 5, 13, 47 + v * 5);

      const runePulse = 0.45 + Math.sin(nowMs * 0.004 + prop.x) * 0.2;
      ctx.strokeStyle = `rgba(129, 140, 248, ${runePulse.toFixed(2)})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, -37);
      ctx.lineTo(0, -14);
      ctx.moveTo(-8, -28);
      ctx.lineTo(8, -28);
      ctx.stroke();
    }
  } else {
    // Void Floating Obsidian Crystal Monolith
    const floatY = Math.sin(nowMs * 0.004 + prop.x) * 5;
    const halo = ctx.createRadialGradient(0, -34 + floatY, 4, 0, -34 + floatY, 58);
    halo.addColorStop(0, 'rgba(168, 85, 247, 0.36)');
    halo.addColorStop(1, 'rgba(126, 34, 206, 0)');
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(0, -34 + floatY, 58, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#4C1D95';
    ctx.strokeStyle = '#E879F9';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(0, -68 + floatY);
    ctx.lineTo(15, -36 + floatY);
    ctx.lineTo(0, -6 + floatY);
    ctx.lineTo(-15, -36 + floatY);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Faceted crystal left highlight
    ctx.fillStyle = 'rgba(216, 180, 254, 0.28)';
    ctx.beginPath();
    ctx.moveTo(0, -68 + floatY);
    ctx.lineTo(0, -6 + floatY);
    ctx.lineTo(-15, -36 + floatY);
    ctx.closePath();
    ctx.fill();
  }

  ctx.restore();
}

export function drawBiomeBackground(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  camWorldX: number,
  camScreenY: number,
  themeStyle: BiomeDef['themeStyle'],
  floorPrimary: string,
  _floorSecondary: string,
  accentHex: string,
  nowMs: number
): void {
  ctx.fillStyle = floorPrimary;
  ctx.fillRect(0, 0, w, h);

  // 1. Seamless 2.5D Isometric Diamond Flagstone Texture
  const tileCanvas = getBiomeTileCanvas(themeStyle);
  if (tileCanvas) {
    ctx.save();
    ctx.scale(1, ISO_TILT);
    const pat = ctx.createPattern(tileCanvas, 'repeat');
    if (pat) {
      const worldCamY = camScreenY / ISO_TILT;
      const offsetX = -((camWorldX % 512) + 512) % 512;
      const offsetY = -((worldCamY % 512) + 512) % 512;
      ctx.translate(offsetX, offsetY);
      ctx.fillStyle = pat;
      ctx.fillRect(-512, -512, w + 1024, h / ISO_TILT + 1024);
    }
    ctx.restore();
  }

  // 2. Sparse 2.5D Sunken Ruin Medallions & Glowing Arcane Floor Circles
  const macroStep = 460;
  const startMx = Math.floor(camWorldX / macroStep) - 1;
  const endMx = Math.ceil((camWorldX + w) / macroStep) + 1;
  const worldTop = camScreenY / ISO_TILT;
  const worldBot = (camScreenY + h) / ISO_TILT;
  const startMy = Math.floor(worldTop / macroStep) - 1;
  const endMy = Math.ceil(worldBot / macroStep) + 1;

  for (let mx = startMx; mx <= endMx; mx++) {
    for (let my = startMy; my <= endMy; my++) {
      const hVal = Math.abs(Math.sin(mx * 47.17 + my * 83.41) * 43758.5453) % 1;
      if (hVal < 0.52) continue;

      const wx = (mx + 0.5) * macroStep + (hVal - 0.75) * 180;
      const wy = (my + 0.5) * macroStep + (((hVal * 17) % 1) - 0.5) * 180;
      const sx = wx - camWorldX;
      const sy = wy * ISO_TILT - camScreenY;

      ctx.save();
      ctx.translate(sx, sy);
      ctx.scale(1, ISO_TILT);

      if (hVal > 0.78) {
        // Ancient Carved Ritual Arena Circle
        const pulse = 0.22 + Math.sin(nowMs * 0.0028 + mx + my) * 0.08;
        const ringR = 96;
        const rg = ctx.createRadialGradient(0, 0, 12, 0, 0, ringR);
        rg.addColorStop(0, `${accentHex}24`);
        rg.addColorStop(0.7, `${accentHex}0D`);
        rg.addColorStop(1, `${accentHex}00`);
        ctx.fillStyle = rg;
        ctx.beginPath();
        ctx.arc(0, 0, ringR, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = `${accentHex}${Math.round(pulse * 255).toString(16).padStart(2, '0')}`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, ringR * 0.85, 0, Math.PI * 2);
        ctx.stroke();

        ctx.setLineDash([12, 8]);
        ctx.beginPath();
        ctx.arc(0, 0, ringR * 0.6, nowMs * 0.0004, nowMs * 0.0004 + Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
      } else {
        // Sunken Weathered Shadow Pit / Cracked Basin
        const pitR = 72;
        const pg = ctx.createRadialGradient(0, 0, 10, 0, 0, pitR);
        pg.addColorStop(0, 'rgba(3, 5, 10, 0.42)');
        pg.addColorStop(1, 'rgba(3, 5, 10, 0)');
        ctx.fillStyle = pg;
        ctx.beginPath();
        ctx.arc(0, 0, pitR, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }
  }

  // 3. Living Drifting Ambient Spores / Embers / Wisps across the battlefield
  ctx.save();
  const moteCol =
    themeStyle === 'forest'
      ? 'rgba(110, 231, 183,'
      : themeStyle === 'sea'
        ? 'rgba(125, 211, 252,'
        : themeStyle === 'volcano'
          ? 'rgba(251, 146, 60,'
          : themeStyle === 'void'
            ? 'rgba(216, 180, 254,'
            : 'rgba(165, 180, 252,';

  for (let i = 0; i < 26; i++) {
    const driftX = nowMs * (0.014 + (i % 4) * 0.005) * (i % 2 === 0 ? 1 : -0.6);
    const driftY = -nowMs * (0.018 + (i % 3) * 0.007);
    const mx = ((i * 197 + driftX - camWorldX * 0.85) % (w + 120) + (w + 120)) % (w + 120) - 60;
    const my = ((i * 149 + driftY - camScreenY * 0.85) % (h + 120) + (h + 120)) % (h + 120) - 60;
    const alpha = 0.16 + 0.18 * Math.sin(nowMs * 0.004 + i * 1.7);
    if (alpha <= 0.04) continue;
    ctx.fillStyle = `${moteCol} ${alpha.toFixed(2)})`;
    ctx.beginPath();
    ctx.arc(mx, my, 1.5 + (i % 3) * 0.7, 0, Math.PI * 2);
    ctx.fill();
  }

  // 4. Center Hero Atmospheric Lantern / Key-Light Pool & Perimeter Depth Vignette
  const heroLight = ctx.createRadialGradient(w / 2, h / 2, 24, w / 2, h / 2, Math.min(w, h) * 0.48);
  heroLight.addColorStop(0, `${accentHex}12`);
  heroLight.addColorStop(0.55, 'rgba(0, 0, 0, 0)');
  heroLight.addColorStop(1, 'rgba(2, 4, 10, 0.42)');
  ctx.fillStyle = heroLight;
  ctx.fillRect(0, 0, w, h);

  ctx.restore();
}

export function draw25DDrop(
  ctx: CanvasRenderingContext2D,
  kind:
    | 'xp'
    | 'xp_large'
    | 'gold'
    | 'gold_pouch'
    | 'meat'
    | 'magnet'
    | 'chest'
    | 'artifact_chest'
    | 'sealed_chest'
    | 'bomb'
    | 'speed_potion',
  x: number,
  y: number,
  nowMs: number
): void {
  const sy = y * ISO_TILT;
  const isChestLike = kind === 'chest' || kind === 'artifact_chest' || kind === 'sealed_chest';
  const hover = isChestLike ? 0 : 4 + Math.sin(nowMs * 0.007 + x * 0.05) * 2.5;

  ctx.save();
  ctx.translate(x, sy);
  ctx.imageSmoothingEnabled = false;

  ctx.fillStyle = 'rgba(0, 0, 0, 0.42)';
  ctx.beginPath();
  ctx.ellipse(2, 4, isChestLike ? 18 : 8, isChestLike ? 11 : 4.5, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.translate(0, -hover);

  if (kind === 'xp' || kind === 'xp_large') {
    const isLarge = kind === 'xp_large';
    const r = isLarge ? 9.5 : 6.2;
    if (isLarge) {
      ctx.fillStyle = 'rgba(192, 132, 252, 0.34)';
      ctx.beginPath();
      ctx.arc(0, 0, 15, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = isLarge ? '#C084FC' : '#38BDF8';
    ctx.strokeStyle = isLarge ? '#F5D0FE' : '#BAE6FD';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(0, -r);
    ctx.lineTo(r * 0.78, 0);
    ctx.lineTo(0, r);
    ctx.lineTo(-r * 0.78, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else if (kind === 'gold') {
    ctx.fillStyle = '#FACC15';
    ctx.strokeStyle = '#92400E';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.arc(0, 0, 6.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#FEF08A';
    ctx.fillRect(-1.2, -3.5, 2.4, 7);
  } else if (kind === 'gold_pouch') {
    ctx.fillStyle = 'rgba(251, 191, 36, 0.34)';
    ctx.beginPath();
    ctx.arc(0, 0, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#B45309';
    ctx.strokeStyle = '#FDE047';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(0, 2, 9, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#FACC15';
    ctx.fillRect(-4.5, -8, 9, 3);
    ctx.fillStyle = '#FEF08A';
    ctx.beginPath();
    ctx.arc(0, 2, 3, 0, Math.PI * 2);
    ctx.fill();
  } else if (kind === 'meat') {
    ctx.fillStyle = 'rgba(244, 63, 94, 0.28)';
    ctx.beginPath();
    ctx.arc(0, 0, 13, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#E11D48';
    ctx.strokeStyle = '#FECDD3';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.arc(0, 2, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#CBD5E1';
    ctx.fillRect(-2.5, -8, 5, 4);
  } else if (kind === 'magnet') {
    ctx.fillStyle = 'rgba(56, 189, 248, 0.24)';
    ctx.beginPath();
    ctx.arc(0, 0, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#38BDF8';
    ctx.lineWidth = 3.5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(0, -1, 7, Math.PI, 0, false);
    ctx.stroke();
    ctx.fillStyle = '#E2E8F0';
    ctx.fillRect(-8.5, -1, 3.5, 4.5);
    ctx.fillRect(5, -1, 3.5, 4.5);
  } else if (kind === 'bomb') {
    const glow = 0.28 + Math.sin(nowMs * 0.012) * 0.12;
    ctx.fillStyle = `rgba(239, 68, 68, ${glow})`;
    ctx.beginPath();
    ctx.arc(0, 0, 15, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#1E293B';
    ctx.strokeStyle = '#F97316';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.arc(0, 1, 7.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = '#FACC15';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(2, -6);
    ctx.lineTo(6, -11);
    ctx.stroke();
    ctx.fillStyle = '#FEF08A';
    ctx.beginPath();
    ctx.arc(6.5, -11.5, 2.5, 0, Math.PI * 2);
    ctx.fill();
  } else if (kind === 'speed_potion') {
    ctx.fillStyle = 'rgba(52, 211, 153, 0.28)';
    ctx.beginPath();
    ctx.arc(0, 0, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#059669';
    ctx.strokeStyle = '#A7F3D0';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.arc(0, 2, 6.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#E2E8F0';
    ctx.fillRect(-2.5, -8, 5, 4.5);
    ctx.fillStyle = '#F59E0B';
    ctx.fillRect(-3, -10, 6, 2.5);
  } else if (kind === 'chest') {
    const pulse = 1 + Math.sin(nowMs * 0.006) * 0.1;
    const beam = ctx.createLinearGradient(0, -135, 0, 0);
    beam.addColorStop(0, 'rgba(253, 224, 71, 0)');
    beam.addColorStop(1, 'rgba(253, 224, 71, 0.28)');
    ctx.fillStyle = beam;
    ctx.fillRect(-14, -135, 28, 135);

    ctx.fillStyle = 'rgba(245, 158, 11, 0.28)';
    ctx.beginPath();
    ctx.ellipse(0, 2, 26 * pulse, 15 * pulse, 0, 0, Math.PI * 2);
    ctx.fill();

    const ok = drawSingleImg(ctx, '/craftpix/tilesets/chest_closed.png', 0, 4, 40, 40, {
      anchorX: 0.5,
      anchorY: 0.85,
    });
    if (!ok) {
      ctx.fillStyle = '#B45309';
      ctx.strokeStyle = '#FACC15';
      ctx.lineWidth = 2;
      ctx.fillRect(-14, -22, 28, 22);
      ctx.strokeRect(-14, -22, 28, 22);
    }
  } else if (kind === 'artifact_chest') {
    const pulse = 1 + Math.sin(nowMs * 0.007) * 0.12;
    const beam = ctx.createLinearGradient(0, -145, 0, 0);
    beam.addColorStop(0, 'rgba(192, 132, 252, 0)');
    beam.addColorStop(1, 'rgba(168, 85, 247, 0.36)');
    ctx.fillStyle = beam;
    ctx.fillRect(-15, -145, 30, 145);

    ctx.fillStyle = 'rgba(168, 85, 247, 0.32)';
    ctx.beginPath();
    ctx.ellipse(0, 2, 27 * pulse, 15 * pulse, 0, 0, Math.PI * 2);
    ctx.fill();

    const ok = drawSingleImg(ctx, '/craftpix/tilesets/chest_closed.png', 0, 4, 40, 40, {
      anchorX: 0.5,
      anchorY: 0.85,
      tintColor: '#C084FC',
      tintAlpha: 0.45,
    });
    if (!ok) {
      ctx.fillStyle = '#6B21A8';
      ctx.strokeStyle = '#E879F9';
      ctx.lineWidth = 2;
      ctx.fillRect(-14, -22, 28, 22);
      ctx.strokeRect(-14, -22, 28, 22);
    }
  } else if (kind === 'sealed_chest') {
    const pulse = 1 + Math.sin(nowMs * 0.0075) * 0.14;
    const beam = ctx.createLinearGradient(0, -155, 0, 0);
    beam.addColorStop(0, 'rgba(34, 211, 238, 0)');
    beam.addColorStop(1, 'rgba(34, 211, 238, 0.38)');
    ctx.fillStyle = beam;
    ctx.fillRect(-15, -155, 30, 155);

    ctx.fillStyle = 'rgba(34, 211, 238, 0.3)';
    ctx.beginPath();
    ctx.ellipse(0, 2, 26 * pulse, 14 * pulse, 0, 0, Math.PI * 2);
    ctx.fill();

    const ok = drawSingleImg(ctx, '/craftpix/tilesets/chest_closed.png', 0, 4, 38, 38, {
      anchorX: 0.5,
      anchorY: 0.85,
      tintColor: '#22D3EE',
      tintAlpha: 0.55,
    });
    if (!ok) {
      ctx.fillStyle = '#0E7490';
      ctx.strokeStyle = '#67E8F9';
      ctx.lineWidth = 2;
      ctx.fillRect(-13, -21, 26, 20);
      ctx.strokeRect(-13, -21, 26, 20);
    }
    ctx.fillStyle = '#E0F2FE';
    ctx.beginPath();
    ctx.arc(0, -11, 3.2, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

export function draw25DPet(
  ctx: CanvasRenderingContext2D,
  petId: 'bat_pet' | 'fire_hound' | 'mini_ghost',
  x: number,
  y: number,
  nowMs: number,
  shieldReady = true
): void {
  const sy = y * ISO_TILT;
  const bob = Math.sin(nowMs * 0.008) * 3.5;
  ctx.save();
  ctx.translate(x, sy);

  // Shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.36)';
  ctx.beginPath();
  ctx.ellipse(2, 4, 9, 4.5, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.translate(0, -10 + bob);

  if (petId === 'bat_pet') {
    const flap = Math.sin(nowMs * 0.022) * 5;
    ctx.fillStyle = '#7E22CE';
    ctx.strokeStyle = '#E9D5FF';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(-11, -7 + flap, -15, 2 + flap * 0.5);
    ctx.lineTo(-5, 4);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(11, -7 + flap, 15, 2 + flap * 0.5);
    ctx.lineTo(5, 4);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#581C87';
    ctx.beginPath();
    ctx.arc(0, 1, 6.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#FACC15';
    ctx.fillRect(-3, -1, 2, 2);
    ctx.fillRect(1, -1, 2, 2);
  } else if (petId === 'fire_hound') {
    ctx.fillStyle = 'rgba(249, 115, 22, 0.24)';
    ctx.beginPath();
    ctx.arc(0, 0, 13, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#EA580C';
    ctx.strokeStyle = '#FED7AA';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.ellipse(0, 2, 9, 6.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Ears
    ctx.fillStyle = '#9A3412';
    ctx.beginPath();
    ctx.moveTo(-6, -3);
    ctx.lineTo(-8, -10);
    ctx.lineTo(-2, -5);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(6, -3);
    ctx.lineTo(8, -10);
    ctx.lineTo(2, -5);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#FEF08A';
    ctx.fillRect(-3.5, -1, 2, 2.2);
    ctx.fillRect(1.5, -1, 2, 2.2);
  } else {
    ctx.fillStyle = shieldReady ? 'rgba(56, 189, 248, 0.25)' : 'rgba(148, 163, 184, 0.14)';
    ctx.beginPath();
    ctx.arc(0, 0, 13, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = shieldReady ? '#E0F2FE' : '#94A3B8';
    ctx.strokeStyle = shieldReady ? '#38BDF8' : '#64748B';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.arc(0, -2, 7.5, Math.PI, 0);
    ctx.lineTo(7.5, 7);
    ctx.lineTo(2.5, 4);
    ctx.lineTo(-2.5, 7);
    ctx.lineTo(-7.5, 4);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#0F172A';
    ctx.beginPath();
    ctx.arc(-2.5, -2, 1.4, 0, Math.PI * 2);
    ctx.arc(2.5, -2, 1.4, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

export function draw25DTotem(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  evolved: boolean,
  nowMs: number
): void {
  const sy = y * ISO_TILT;
  const pulse = 1 + Math.sin(nowMs * 0.008) * 0.14;
  ctx.save();
  ctx.translate(x, sy);

  ctx.fillStyle = 'rgba(0, 0, 0, 0.46)';
  ctx.beginPath();
  ctx.ellipse(3, 3, 17, 8, 0, 0, Math.PI * 2);
  ctx.fill();

  const animT = nowMs * 0.001;
  const drewPack = drawPackVfx(
    ctx,
    evolved ? 'totem_evo' : 'totem',
    0,
    4,
    animT,
    { scale: evolved ? 2.05 : 1.85 }
  );

  if (!drewPack) {
    // Carved Sacred Totem Pillar fallback
    ctx.fillStyle = evolved ? '#78350F' : '#1E293B';
    ctx.strokeStyle = evolved ? '#F59E0B' : '#94A3B8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(-10, -42, 20, 44, 4);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = evolved ? '#FDE047' : '#38BDF8';
    ctx.fillRect(-5, -31, 10, 4);
    ctx.fillRect(-5, -19, 10, 4);

    ctx.fillStyle = evolved ? '#FEF08A' : '#FDE047';
    ctx.beginPath();
    ctx.arc(0, -50, 5.5 * pulse, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

export interface RenderPlayerParams {
  ctx: CanvasRenderingContext2D;
  raceId: RaceId;
  raceClass?: RaceClassId | null;
  x: number;
  y: number;
  facingX: number;
  facingY: number;
  walkCycle: number;
  isMoving: boolean;
  hitFlash: boolean;
  isNight: boolean;
  snared?: boolean;
  heldElements?: ElementId[];
  fusionCooldown?: number;
  fusionMaxCooldown?: number;
  voidInfusionActive?: boolean;
  mageBarrierTimer?: number;
  spellbladeColor?: string | null;
  spellbladeFusionColors?: string[];
  spellbladeCharge?: number;
  spellbladeSwinging?: boolean;
  voidlessActive?: boolean;
  phaseActive?: boolean;
  isDashing?: boolean;
  batSwarmActive?: boolean;
  orcBerserkActive?: boolean;
  ultActive?: boolean;
  ultAscended?: boolean;
  knightParryFlash?: number;
  knightAegisBonus?: number;
  knightBulwarkStacks?: number;
  knightBulwarkCrackTimer?: number;
  knightTauntWindup?: number;
  knightUltElapsed?: number;
  knightAscendFxTimer?: number;
  knightHitKnockbackX?: number;
  knightHitSparkTimer?: number;
  hunterDashCharges?: number;
  hunterDashMaxCharges?: number;
  saintShieldHits?: number;
  demonCrownActive?: boolean;
  vampireBloodShieldPct?: number;
  vampireBloodlustRatio?: number;
  sinkKind?: 'water' | 'lava' | 'poison' | null;
  castAnimTimer?: number;
  visualFacingAngle?: number;
  moveSpeedRatio?: number;
  accentColor?: string;
  nowMs: number;
}

/**
 * Renders the player hero using the user's animated sprite packs
 * (Wizard Pack, Necromancer, Evil Wizard 2, Blind Huntress, Shadeflit, Satyr)
 * and crisp pixel-art character sheets (Orc, Vampire Noble, Werewolf, Knight, Saint, Spellblade).
 */
export function drawHeroSprite(p: RenderPlayerParams): void {
  const {
    ctx,
    raceId,
    raceClass,
    x,
    y,
    facingX,
    isMoving,
    hitFlash,
    isNight,
    snared,
    heldElements,
    fusionCooldown = 0,
    fusionMaxCooldown = 7,
    voidInfusionActive = false,
    mageBarrierTimer = 0,
    spellbladeColor,
    spellbladeFusionColors,
    spellbladeCharge = 0,
    spellbladeSwinging = false,
    voidlessActive = false,
    phaseActive = false,
    isDashing = false,
    batSwarmActive = false,
    orcBerserkActive = false,
    ultActive = false,
    ultAscended = false,
    knightParryFlash = 0,
    knightAegisBonus = 0,
    knightBulwarkStacks = 0,
    knightBulwarkCrackTimer = 0,
    knightTauntWindup = 0,
    knightUltElapsed = 99,
    knightAscendFxTimer = 0,
    knightHitKnockbackX = 0,
    knightHitSparkTimer = 0,
    hunterDashCharges = 3,
    hunterDashMaxCharges = 3,
    saintShieldHits = 0,
    demonCrownActive = false,
    vampireBloodShieldPct = 0,
    vampireBloodlustRatio = 0,
    sinkKind = null,
    castAnimTimer = 0,
    visualFacingAngle,
    moveSpeedRatio,
    accentColor,
    nowMs,
  } = p;

  const smoothAngle = visualFacingAngle ?? Math.atan2(p.facingY || 0, facingX || 1);
  const flipX = Math.cos(smoothAngle) < -0.12 || (Math.abs(Math.cos(smoothAngle)) <= 0.12 && facingX < -0.15);
  const animT = nowMs * 0.001;
  const moveRatio = Math.max(0, Math.min(1, moveSpeedRatio ?? (isMoving ? 1 : 0)));
  const isKnight = raceClass === 'knight';
  const knightIdleStep = isKnight && moveRatio < 0.08 ? (Math.floor(animT / 0.6) % 2 === 0 ? 0 : 1) : 0;
  const idleBob = isKnight ? knightIdleStep : Math.sin(animT * 2.8) * 1.4 * (1 - moveRatio);
  const strideBob = Math.abs(Math.sin(p.walkCycle * 1.15)) * 3.4 * moveRatio;
  const bob = idleBob + strideBob;
  const moveLean = Math.sin(p.walkCycle * 1.15) * 0.032 * moveRatio + (flipX ? -0.045 : 0.045) * moveRatio;
  const knightStepImpact = isKnight && moveRatio > 0.15 && Math.abs(Math.sin(p.walkCycle * 1.15)) < 0.25 ? -0.04 : 0;
  const strideSquashY = (1 + Math.sin(p.walkCycle * 2.3) * 0.036 * moveRatio) + knightStepImpact;
  const strideStretchX = (1 - Math.sin(p.walkCycle * 2.3) * 0.024 * moveRatio) - knightStepImpact * 0.6;

  const frameAccent =
    accentColor ||
    (raceClass === 'hunter'
      ? '#34D399'
      : raceClass === 'saint'
        ? '#FDE047'
        : raceClass === 'knight'
          ? '#38BDF8'
          : raceClass === 'demon_lord'
            ? '#F97316'
            : raceClass === 'vampire_lord'
              ? '#FB7185'
              : raceClass === 'seven_sins'
                ? '#C084FC'
                : raceClass === 'time_god'
                  ? '#22D3EE'
                  : raceClass === 'death_god'
                    ? '#A855F7'
                    : raceClass === 'spellblade_god'
                      ? '#F59E0B'
                      : raceClass === 'voidless_blade'
                        ? '#E0F2FE'
                        : raceId === 'orc'
                          ? '#F59E0B'
                          : raceId === 'vampire'
                            ? '#FB7185'
                            : raceId === 'mage'
                              ? '#818CF8'
                              : '#38BDF8');

  ctx.save();
  ctx.translate(x + (isKnight ? knightHitKnockbackX : 0), y);

  // 2.5D Isometric Ground Spotlight, Selection Ring & Directional Wedge (Action-RPG style)
  {
    const pulse = 1 + Math.sin(nowMs * 0.0055) * 0.025;
    const rx = 29 * pulse;
    const ry = rx * 0.56;
    ctx.save();
    ctx.translate(0, 15);

    // 1) Soft under-hero radial spotlight for figure-ground separation
    ctx.save();
    ctx.scale(1, 0.56);
    const spot = ctx.createRadialGradient(0, 0, 4, 0, 0, rx * 1.35);
    spot.addColorStop(0, `${frameAccent}36`);
    spot.addColorStop(0.55, `${frameAccent}16`);
    spot.addColorStop(1, `${frameAccent}00`);
    ctx.fillStyle = spot;
    ctx.beginPath();
    ctx.arc(0, 0, rx * 1.35, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 2) Dark contrast backing stroke so the ring reads clearly on snow, lava, or dark grass
    ctx.strokeStyle = 'rgba(2, 6, 17, 0.88)';
    ctx.lineWidth = 4.2;
    ctx.beginPath();
    ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
    ctx.stroke();

    // 3) Crisp glowing outer isometric selection ring
    ctx.strokeStyle = hitFlash ? '#FFFFFF' : frameAccent;
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
    ctx.stroke();

    // 4) Subtle inner segmented tactical ring rotating slowly
    ctx.save();
    ctx.strokeStyle = hitFlash ? 'rgba(255,255,255,0.7)' : `${frameAccent}88`;
    ctx.lineWidth = 1.25;
    const rotBase = animT * 0.65;
    for (let seg = 0; seg < 4; seg++) {
      const a0 = rotBase + (seg * Math.PI) / 2 + 0.22;
      const a1 = rotBase + ((seg + 1) * Math.PI) / 2 - 0.22;
      ctx.beginPath();
      ctx.ellipse(0, 0, rx - 5, ry - 2.8, 0, a0, a1);
      ctx.stroke();
    }
    ctx.restore();

    // 5) Ground-projected directional facing wedge riding smoothly on the outer ellipse
    const dirCos = Math.cos(smoothAngle);
    const dirSin = Math.sin(smoothAngle);
    const arrowX = (rx + 7) * dirCos;
    const arrowY = (ry + 4) * dirSin;
    const visualAng = Math.atan2(dirSin * 0.56, dirCos);

    ctx.save();
    ctx.translate(arrowX, arrowY);
    ctx.rotate(visualAng);
    ctx.fillStyle = hitFlash ? '#FFFFFF' : frameAccent;
    ctx.strokeStyle = 'rgba(2, 6, 17, 0.95)';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(9, 0);
    ctx.lineTo(-3.5, -5.2);
    ctx.lineTo(-1, 0);
    ctx.lineTo(-3.5, 5.2);
    ctx.closePath();
    ctx.stroke();
    ctx.fill();
    ctx.restore();

    ctx.restore();
  }

  if (sinkKind) {
    const rPulse = 18 + Math.sin(nowMs * 0.01) * 3;
    ctx.strokeStyle =
      sinkKind === 'lava'
        ? 'rgba(249, 115, 22, 0.72)'
        : sinkKind === 'poison'
          ? 'rgba(132, 204, 22, 0.7)'
          : 'rgba(56, 189, 248, 0.72)';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.ellipse(0, 12, rPulse, rPulse * 0.45, 0, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Ground Lantern / Class Aura
  if (raceId === 'vampire') {
    if (isNight) {
      const auraR = 34 + Math.sin(nowMs * 0.007) * 3;
      const g = ctx.createRadialGradient(0, 0, 8, 0, 0, auraR);
      g.addColorStop(0, 'rgba(225, 29, 72, 0.28)');
      g.addColorStop(1, 'rgba(225, 29, 72, 0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(0, 0, auraR, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(244, 63, 94, 0.6)';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.arc(0, 4, auraR - 4, 0, Math.PI * 2);
      ctx.stroke();
    } else {
      ctx.strokeStyle = 'rgba(251, 191, 36, 0.36)';
      ctx.lineWidth = 1.4;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.arc(0, 4, 26, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  } else if (raceId === 'orc') {
    const auraR = orcBerserkActive ? 42 + Math.sin(nowMs * 0.016) * 4 : 34;
    const g = ctx.createRadialGradient(0, 2, 8, 0, 2, auraR);
    g.addColorStop(0, orcBerserkActive ? 'rgba(239, 68, 68, 0.42)' : 'rgba(245, 158, 11, 0.22)');
    g.addColorStop(0.55, orcBerserkActive ? 'rgba(249, 115, 22, 0.25)' : 'rgba(245, 158, 11, 0.08)');
    g.addColorStop(1, 'rgba(245, 158, 11, 0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(0, 2, auraR, 0, Math.PI * 2);
    ctx.fill();
    if (orcBerserkActive) {
      ctx.strokeStyle = 'rgba(251, 146, 60, 0.85)';
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.arc(0, 2, auraR - 4, 0, Math.PI * 2);
      ctx.stroke();
    }
  } else if (raceId === 'mage') {
    const auraR = 32 + Math.sin(nowMs * 0.005) * 3;
    const g = ctx.createRadialGradient(0, 2, 6, 0, 2, auraR);
    g.addColorStop(0, voidInfusionActive ? 'rgba(168, 85, 247, 0.36)' : 'rgba(129, 140, 248, 0.28)');
    g.addColorStop(1, 'rgba(129, 140, 248, 0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(0, 2, auraR, 0, Math.PI * 2);
    ctx.fill();

    if (raceClass === 'spellblade_god' || raceClass === 'voidless_blade') {
      const sCol = voidlessActive ? '#E0F2FE' : spellbladeColor || '#F59E0B';
      const ch = Math.max(0, Math.min(1, spellbladeCharge));
      const fullyCharged = ch >= 0.999;

      if (voidlessActive) {
        const vPulse = 1 + Math.sin(nowMs * 0.015) * 0.08;
        const vGrad = ctx.createRadialGradient(0, 0, 10, 0, 0, 48 * vPulse);
        vGrad.addColorStop(0, 'rgba(255, 255, 255, 0.28)');
        vGrad.addColorStop(0.6, 'rgba(56, 189, 248, 0.22)');
        vGrad.addColorStop(1, 'rgba(250, 204, 21, 0)');
        ctx.fillStyle = vGrad;
        ctx.beginPath();
        ctx.arc(0, 0, 48 * vPulse, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
        ctx.lineWidth = 2.4;
        ctx.beginPath();
        ctx.arc(0, 2, 36 * vPulse, 0, Math.PI * 2);
        ctx.stroke();
      }

      ctx.strokeStyle = fullyCharged ? `${sCol}AA` : 'rgba(255, 255, 255, 0.16)';
      ctx.lineWidth = fullyCharged ? 3.2 : 2.2;
      ctx.beginPath();
      ctx.arc(0, 4, 27, 0, Math.PI * 2);
      ctx.stroke();

      if (ch > 0.02) {
        ctx.strokeStyle = fullyCharged ? '#FFFFFF' : sCol;
        ctx.lineWidth = fullyCharged ? 3.8 : 2.6;
        ctx.beginPath();
        ctx.arc(0, 4, 27, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * ch);
        ctx.stroke();
      }

      if (spellbladeFusionColors && spellbladeFusionColors.length > 0 && !hitFlash) {
        const orbCount = Math.min(4, spellbladeFusionColors.length);
        for (let fi = 0; fi < orbCount; fi++) {
          const fa = animT * 2.6 + (fi * Math.PI * 2) / orbCount;
          const fx = Math.cos(fa) * 29;
          const fy = 4 + Math.sin(fa) * 14;
          const fc = spellbladeFusionColors[fi % spellbladeFusionColors.length];
          ctx.fillStyle = `${fc}55`;
          ctx.beginPath();
          ctx.arc(fx, fy, 5.2, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = fc;
          ctx.beginPath();
          ctx.arc(fx, fy, 2.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
  } else {
    const g = ctx.createRadialGradient(0, 2, 6, 0, 2, 30);
    g.addColorStop(0, 'rgba(251, 191, 36, 0.14)');
    g.addColorStop(1, 'rgba(56, 189, 248, 0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(0, 2, 30, 0, Math.PI * 2);
    ctx.fill();
  }

  // Ground Shadow (scaled slightly to match 1.30x hero size)
  ctx.fillStyle = 'rgba(0, 0, 0, 0.56)';
  ctx.beginPath();
  ctx.ellipse(0, 17, raceId === 'orc' ? 24 : 21, 8.5, 0, 0, Math.PI * 2);
  ctx.fill();

  if (phaseActive) {
    const pulse = 1 + Math.sin(nowMs * 0.018) * 0.08;
    ctx.strokeStyle = 'rgba(250, 204, 21, 0.72)';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.ellipse(0, 14, 26 * pulse, 11 * pulse, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  if (snared) {
    ctx.strokeStyle = 'rgba(192, 132, 252, 0.9)';
    ctx.lineWidth = 2.4;
    ctx.setLineDash([5, 4]);
    ctx.beginPath();
    ctx.ellipse(0, 13, 27, 11.5, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // --- SPRITE-SHEET HERO RENDERING (1.30x readable scale + smooth stride lean + silhouette rim-glow) ---
  ctx.save();
  ctx.translate(0, 15 - bob);
  ctx.rotate(moveLean);
  const heroVisScale = (orcBerserkActive ? 1.12 : 1.0) * 1.3;
  ctx.scale(heroVisScale * strideStretchX, heroVisScale * strideSquashY);
  if (batSwarmActive) {
    ctx.globalAlpha = 0.36;
  } else {
    ctx.shadowColor = hitFlash ? '#FFFFFF' : frameAccent;
    ctx.shadowBlur = 8;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
  }
  ctx.imageSmoothingEnabled = false;

  // Voidless Awakening Aura (behind character body)
  if (voidlessActive && !batSwarmActive) {
    drawPackVfx(ctx, 'voidless_aura', 0, -28, animT, { scale: 1.55, alpha: 0.92 });
  }

  // Chronos Time-God rotating rings behind sprite
  if (raceClass === 'time_god') {
    ctx.save();
    ctx.translate(0, -28);
    ctx.strokeStyle = hitFlash ? '#FFFFFF' : 'rgba(34, 211, 238, 0.78)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, 26, animT * 1.6, animT * 1.6 + Math.PI * 1.4);
    ctx.stroke();
    ctx.strokeStyle = hitFlash ? '#FFFFFF' : 'rgba(250, 204, 21, 0.72)';
    ctx.beginPath();
    ctx.arc(0, 0, 20, -animT * 2.2, -animT * 2.2 + Math.PI * 1.1);
    ctx.stroke();
    ctx.restore();
  }

  const drawOpts = {
    hitFlash,
    flipX,
  };

  let heroDrawn = false;

  if (raceId === 'mage') {
    if (raceClass === 'death_god') {
      // User's Necromancer sheet (160x128, 17x7)
      const isCasting = fusionCooldown > fusionMaxCooldown - 0.8;
      const row = isCasting ? 2 : isMoving ? 1 : 0;
      const frames = isCasting ? 13 : 8;
      heroDrawn = drawGridSeqSprite(
        ctx,
        '/sprites/necromancer/sheet.png',
        160,
        128,
        17,
        row,
        frames,
        0,
        0,
        154,
        123,
        animT,
        isCasting ? 14 : 9,
        {
          ...drawOpts,
          anchorX: 0.512,
          anchorY: 0.89,
        }
      );
    } else if (raceClass === 'time_god') {
      // User's Evil Wizard 2 sheet with cyan Chronos infusion
      const isCasting = castAnimTimer > 0 || fusionCooldown > fusionMaxCooldown - 0.8;
      const path = isCasting
        ? '/sprites/evil_wizard/attack1.png'
        : isMoving
          ? '/sprites/evil_wizard/run.png'
          : '/sprites/evil_wizard/idle.png';
      heroDrawn = drawStripSprite(ctx, path, 250, 0, 0, 195, 195, animT, 10, {
        ...drawOpts,
        anchorX: 0.5,
        anchorY: 0.664,
        tintColor: !hitFlash ? '#22D3EE' : undefined,
        tintAlpha: 0.25,
      });
    } else if (raceClass === 'spellblade_god' || raceClass === 'voidless_blade') {
      // Spellblade God / Voidless Blade: User's Shadeflit (277x161) + crafted ornate Runed Greatsword
      const swordCol = voidlessActive ? '#E0F2FE' : spellbladeColor || '#38BDF8';
      const path = isMoving ? '/sprites/shadeflit/run.png' : '/sprites/shadeflit/idle.png';
      heroDrawn = drawStripSprite(ctx, path, 277, 0, 0, 340, 198, animT, isMoving ? 12 : 8, {
        ...drawOpts,
        anchorX: 0.224,
        anchorY: 0.652,
        tintColor: !hitFlash ? swordCol : undefined,
        tintAlpha: voidlessActive ? 0.36 : 0.24,
      });

      // Attach ornate crafted greatsword anchored at hand
      const greatsword = getPixelSpriteSheet('px_greatsword');
      if (greatsword) {
        const handX = flipX ? -12 : 12;
        const handY = -22;
        const swingAngle = spellbladeSwinging
          ? (flipX ? 1 : -1) * (-0.35 + Math.sin(animT * 34) * 0.95)
          : (flipX ? 0.52 : -0.52) + Math.sin(animT * 3.5) * 0.04;

        // Blade elemental aura glow
        if (!hitFlash) {
          const tipX = handX + Math.cos(flipX ? Math.PI - swingAngle : swingAngle) * 28;
          const tipY = handY + Math.sin(flipX ? Math.PI - swingAngle : swingAngle) * 28;
          const bladeGlow = ctx.createRadialGradient(tipX, tipY, 2, tipX, tipY, voidlessActive ? 22 : 15);
          bladeGlow.addColorStop(0, `${swordCol}77`);
          bladeGlow.addColorStop(1, `${swordCol}00`);
          ctx.fillStyle = bladeGlow;
          ctx.beginPath();
          ctx.arc(tipX, tipY, voidlessActive ? 22 : 15, 0, Math.PI * 2);
          ctx.fill();
        }

        drawCanvasStripSprite(ctx, greatsword, handX, handY, 46, 22, animT, 1, {
          ...drawOpts,
          anchorX: 0.16,
          anchorY: 0.5,
          rotation: swingAngle,
          tintColor: !hitFlash ? swordCol : undefined,
          tintAlpha: voidlessActive ? 0.42 : 0.28,
        });
      }

      if (spellbladeSwinging) {
        drawFrameArraySprite(ctx, FRAMES.lightningSlash, flipX ? -22 : 22, -24, 72, 62, animT, 18, {
          anchorX: 0.5,
          anchorY: 0.5,
          flipX,
          tintColor: voidlessActive ? '#FFFFFF' : spellbladeColor || '#F59E0B',
          tintAlpha: 0.48,
        });
      }
    } else {
      // Base Mage: Author's 3-strip Elemental Archmage (64x64: idle 4f@6fps, walk 4f@10fps, swipe 3f@16fps)
      preloadMageSprites();
      const animId: MageAnimId = castAnimTimer > 0 ? 'swipe' : isMoving ? 'walk' : 'idle';
      const mageImg = mageSpriteImages[animId];
      if (mageImg && mageImg.complete && mageImg.naturalWidth > 0) {
        const def = MAGE_ANIMS[animId];
        const frame =
          animId === 'swipe'
            ? Math.min(2, Math.floor(((0.19 - castAnimTimer) / 0.19) * 3))
            : animId === 'walk'
              ? Math.floor(animT * 10) % 4
              : Math.floor(animT * 6) % 4;
        ctx.imageSmoothingEnabled = false;
        drawSpriteRegion(
          ctx,
          mageImg,
          frame * def.frameWidth,
          0,
          def.frameWidth,
          def.frameHeight,
          0,
          0,
          68,
          68,
          {
            ...drawOpts,
            anchorX: 0.5,
            anchorY: 0.97,
            tintColor: !hitFlash && voidInfusionActive ? '#C084FC' : undefined,
            tintAlpha: 0.32,
          }
        );
        heroDrawn = true;
      } else {
        // Fallback while sprite strips finish loading
        const isCasting = fusionCooldown > fusionMaxCooldown - 0.7;
        const path = isCasting
          ? '/sprites/wizard/attack1.png'
          : isMoving
            ? '/sprites/wizard/run.png'
            : '/sprites/wizard/idle.png';
        heroDrawn = drawStripSprite(ctx, path, 231, 0, 0, 152, 125, animT, isMoving || isCasting ? 11 : 7, {
          ...drawOpts,
          anchorX: 0.476,
          anchorY: 0.737,
          tintColor: !hitFlash && voidInfusionActive ? '#C084FC' : undefined,
          tintAlpha: 0.32,
        });
      }
    }
  } else if (raceId === 'human') {
    if (raceClass === 'hunter') {
      // Hunter: User's Crow cloak/quiver sprite (64x64) tinted Emerald + crafted Elven Recurve Bow
      const path = isDashing
        ? '/sprites/crow/crow_attack.png'
        : isMoving
          ? '/sprites/crow/crow_walk.png'
          : '/sprites/crow/crow_idle.png';
      heroDrawn = drawStripSprite(ctx, path, 64, 0, 0, 82, 82, animT, isDashing ? 14 : isMoving ? 10 : 6, {
        ...drawOpts,
        anchorX: 0.47,
        anchorY: 0.74,
        tintColor: !hitFlash ? '#10B981' : undefined,
        tintAlpha: 0.28,
      });
      const bow = getPixelSpriteSheet('px_hunter_bow');
      if (bow) {
        drawCanvasStripSprite(ctx, bow, flipX ? -13 : 13, -22, 22, 32, animT, 1, {
          ...drawOpts,
          anchorX: 0.45,
          anchorY: 0.5,
          rotation: flipX ? 0.08 : -0.08,
        });
      }
    } else if (raceClass === 'knight') {
      ctx.imageSmoothingEnabled = false;
      const inUltActive = ultActive && knightUltElapsed >= 1.2;

      // Section 7: Lionheart Ascension awakening pillar + faint golden roaring lion behind hero (1.0s)
      if (knightAscendFxTimer > 0 && !hitFlash) {
        const ascAlpha = Math.min(1, knightAscendFxTimer * 1.6);
        ctx.save();
        ctx.globalAlpha = ascAlpha * 0.42;
        ctx.fillStyle = '#ffd75e';
        ctx.fillRect(-20, -240, 40, 240);
        ctx.fillStyle = '#fffbe0';
        ctx.fillRect(-8, -240, 16, 240);
        // Faint roaring lion pixel silhouette behind knight
        const lionS = 1 + (1 - knightAscendFxTimer) * 0.35;
        ctx.translate(0, -42);
        ctx.scale(lionS, lionS);
        ctx.globalAlpha = ascAlpha * 0.38;
        ctx.fillStyle = '#ffd75e';
        // Pixel lion mane spikes
        for (let m = 0; m < 8; m++) {
          const ma = (m / 8) * Math.PI * 2;
          ctx.fillRect(Math.round(Math.cos(ma) * 18) - 4, Math.round(Math.sin(ma) * 18) - 4, 8, 8);
        }
        ctx.fillStyle = '#fffbe0';
        ctx.fillRect(-10, -10, 20, 18);
        // Glowing eyes & open roar jaw
        ctx.fillStyle = '#0e2a4a';
        ctx.fillRect(-6, -4, 3, 3);
        ctx.fillRect(3, -4, 3, 3);
        ctx.fillRect(-5, 2, 10, 6);
        ctx.restore();
      }

      // Section 6.2 & 7: Permanent soft golden aura during Ult or Ascension
      if ((inUltActive || ultAscended) && !hitFlash) {
        const auraR = inUltActive ? 34 : 26;
        ctx.save();
        ctx.globalAlpha = inUltActive ? 0.24 + Math.sin(animT * 6) * 0.06 : 0.14 + Math.sin(animT * 4) * 0.04;
        ctx.fillStyle = '#ffd75e';
        ctx.beginPath();
        ctx.arc(0, -24, auraR, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // Section 6.2: Two faint slow-flapping pixel light wings behind cape during Ult active
      if (inUltActive && !hitFlash) {
        const wingFlap = Math.floor(animT * 3) % 2 === 0 ? 0 : 2;
        ctx.save();
        ctx.translate(0, -30);
        for (const side of [-1, 1]) {
          ctx.save();
          ctx.scale(side, 1);
          ctx.globalAlpha = 0.65;
          ctx.fillStyle = '#ffd75e';
          ctx.fillRect(6, -10 + wingFlap, 14, 5);
          ctx.fillRect(14, -14 + wingFlap, 14, 5);
          ctx.fillRect(10, -4 + wingFlap, 12, 4);
          ctx.fillStyle = '#fffbe0';
          ctx.fillRect(8, -9 + wingFlap, 10, 3);
          ctx.fillRect(16, -13 + wingFlap, 10, 3);
          ctx.restore();
        }
        ctx.restore();
      }

      // Section 1 & 7: 2-frame pixel cape flutter (red with #ffd75e gold trim on Ascension)
      const capeFrame = Math.floor(animT / 0.3) % 2;
      const capeDir = flipX ? 1 : -1;
      ctx.save();
      ctx.fillStyle = ultAscended ? '#dc2626' : '#2563eb';
      const capeW = capeFrame === 0 ? 12 : 15;
      const capeShift = capeDir * 5;
      ctx.fillRect(capeDir > 0 ? capeShift - 2 : capeShift - capeW + 2, -32, capeW, 24);
      if (ultAscended) {
        ctx.fillStyle = '#ffd75e';
        ctx.fillRect(capeDir > 0 ? capeShift - 2 : capeShift - capeW + 2, -10, capeW, 3);
      }
      ctx.restore();

      // Knight Paladin: User's Blind Huntress (240x128) in steel-azure plate + crafted Paladin Sword & Royal Shield
      const path = isDashing
        ? '/sprites/huntress/dash_attack.png'
        : isMoving
          ? '/sprites/huntress/run.png'
          : '/sprites/huntress/idle.png';
      heroDrawn = drawStripSprite(ctx, path, 240, 0, 0, 324, 174, animT, isDashing ? 16 : isMoving ? 11 : 8, {
        ...drawOpts,
        anchorX: 0.492,
        anchorY: 0.625,
        tintColor: !hitFlash ? (inUltActive ? '#ffd75e' : '#7DD3FC') : undefined,
        tintAlpha: inUltActive ? 0.34 : 0.3,
      });

      // Shield: raised overhead during Taunt windup (0.2s) with converging light rays
      const shield = getPixelSpriteSheet('px_shield');
      if (knightTauntWindup > 0) {
        if (shield) {
          drawCanvasStripSprite(ctx, shield, 0, -46, 26, 28, animT, 1, {
            ...drawOpts,
            anchorX: 0.5,
            anchorY: 0.5,
            tintColor: '#ffd75e',
            tintAlpha: 0.45,
          });
        }
        ctx.save();
        ctx.strokeStyle = '#fffbe0';
        ctx.lineWidth = 1.5;
        for (let r = 0; r < 6; r++) {
          const ra = (r / 6) * Math.PI * 2 + animT * 4;
          const dist = 10 + (knightTauntWindup / 0.2) * 18;
          ctx.beginPath();
          ctx.moveTo(Math.cos(ra) * dist, -46 + Math.sin(ra) * dist);
          ctx.lineTo(Math.cos(ra) * 6, -46 + Math.sin(ra) * 6);
          ctx.stroke();
        }
        ctx.restore();
      } else if (shield) {
        drawCanvasStripSprite(ctx, shield, flipX ? 11 : -11, -19, 22, 24, animT, 1, {
          ...drawOpts,
          anchorX: 0.5,
          anchorY: 0.5,
        });
      }

      // Section 6.1: Raised hand golden summon flare during Intro 0.35-1.00s
      if (ultActive && knightUltElapsed >= 0.35 && knightUltElapsed < 1.0) {
        ctx.save();
        ctx.fillStyle = '#ffd75e';
        ctx.fillRect((flipX ? -8 : 8) - 3, -52, 6, 14);
        ctx.fillStyle = '#fffbe0';
        ctx.fillRect((flipX ? -8 : 8) - 5, -56, 10, 6);
        ctx.restore();
      }

      // Sword: oversized radiant Excalibur during Ult active (1.2-10s), else Paladin Sword
      if (inUltActive) {
        ctx.save();
        const dirSign = flipX ? -1 : 1;
        ctx.translate(dirSign * 11, -22);
        ctx.rotate(dirSign * (isDashing ? 0.15 : -0.42));
        // Oversized pixel-crisp golden Excalibur (larger than hero body)
        ctx.fillStyle = '#f59e0b';
        ctx.fillRect(-3, -4, 6, 10);
        ctx.fillStyle = '#ffd75e';
        ctx.fillRect(-9, -6, 18, 4);
        ctx.fillStyle = '#fffbe0';
        ctx.fillRect(-4, -56, 8, 50);
        ctx.fillStyle = '#ffd75e';
        ctx.fillRect(-6, -52, 2, 46);
        ctx.fillRect(4, -52, 2, 46);
        ctx.fillStyle = '#fffbe0';
        ctx.fillRect(-2, -62, 4, 6);
        ctx.restore();
      } else {
        const paladinSword = getPixelSpriteSheet('px_paladin_sword');
        if (paladinSword) {
          drawCanvasStripSprite(ctx, paladinSword, flipX ? -9 : 9, -22, 42, 18, animT, 1, {
            ...drawOpts,
            anchorX: 0.18,
            anchorY: 0.5,
            rotation: isDashing ? (flipX ? -0.1 : 0.1) : flipX ? 0.5 : -0.5,
          });
        }
      }
    } else if (raceClass === 'saint') {
      // Saint: User's Wizard Pack (231x190) in radiant Ivory-Gold vestments + Solar Orb flare
      const path = isDashing
        ? '/sprites/wizard/attack2.png'
        : isMoving
          ? '/sprites/wizard/run.png'
          : '/sprites/wizard/idle.png';
      heroDrawn = drawStripSprite(ctx, path, 231, 0, 0, 156, 128, animT, isDashing ? 14 : isMoving ? 10 : 7, {
        ...drawOpts,
        anchorX: 0.476,
        anchorY: 0.737,
        tintColor: !hitFlash ? '#FEF08A' : undefined,
        tintAlpha: 0.36,
      });
      if (!hitFlash) {
        const pulse = 1 + Math.sin(animT * 5) * 0.15;
        const staffX = flipX ? -20 : 20;
        const sunGrad = ctx.createRadialGradient(staffX, -38, 2, staffX, -38, 16 * pulse);
        sunGrad.addColorStop(0, 'rgba(254, 249, 195, 0.92)');
        sunGrad.addColorStop(1, 'rgba(250, 204, 21, 0)');
        ctx.fillStyle = sunGrad;
        ctx.beginPath();
        ctx.arc(staffX, -38, 16 * pulse, 0, Math.PI * 2);
        ctx.fill();
      }
    } else {
      // Base Human: User's Blind Huntress (240x128, bbox x=111..125, y=41..79)
      const path = isDashing
        ? '/sprites/huntress/dash.png'
        : isMoving
          ? '/sprites/huntress/run.png'
          : '/sprites/huntress/idle.png';
      heroDrawn = drawStripSprite(ctx, path, 240, 0, 0, 316, 169, animT, isDashing ? 16 : isMoving ? 11 : 8, {
        ...drawOpts,
        anchorX: 0.492,
        anchorY: 0.625,
      });
    }
  } else if (raceId === 'vampire') {
    if (raceClass === 'demon_lord') {
      // Inferno wings when Gate of Inferno Ultimate or Archfiend Ascension is active
      if ((ultActive || ultAscended) && !hitFlash) {
        const wingFlap = Math.sin(animT * 7.5) * 0.16;
        ctx.save();
        ctx.translate(0, -28);
        for (const side of [-1, 1]) {
          ctx.save();
          ctx.scale(side, 1);
          ctx.rotate(-0.2 + wingFlap);
          ctx.fillStyle = ultActive ? 'rgba(249, 115, 22, 0.85)' : 'rgba(225, 29, 72, 0.72)';
          ctx.strokeStyle = ultActive ? '#FDE047' : '#FB7185';
          ctx.lineWidth = 1.6;
          ctx.beginPath();
          ctx.moveTo(4, 0);
          ctx.quadraticCurveTo(26, -28, 42, -14);
          ctx.lineTo(31, -2);
          ctx.lineTo(37, 8);
          ctx.lineTo(22, 10);
          ctx.lineTo(6, 8);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
          ctx.restore();
        }
        ctx.restore();
      }
      // User's Satyr Demon Lord sheet (32x32 grid 10x11)
      const row = isDashing ? 3 : isMoving ? 1 : 0;
      const frames = isDashing ? 7 : isMoving ? 8 : 6;
      heroDrawn = drawGridSeqSprite(ctx, '/sprites/satyr/sheet.png', 32, 32, 10, row, frames, 0, 0, ultActive ? 86 : 74, ultActive ? 86 : 74, animT, isDashing ? 14 : 10, {
        ...drawOpts,
        anchorX: 0.44,
        anchorY: 0.82,
        tintColor: !hitFlash && ultActive ? '#F97316' : undefined,
        tintAlpha: 0.28,
      });
    } else if (raceClass === 'seven_sins') {
      // Seven Deadly Sins: Evil Wizard Fallen Seraph with 7-sin floating orbit gems + Seraph Wings
      if (!hitFlash) {
        const wingFlap = Math.sin(animT * 5.2) * 0.14;
        ctx.save();
        ctx.translate(0, -30);
        for (const side of [-1, 1]) {
          ctx.save();
          ctx.scale(side, 1);
          ctx.rotate(-0.18 + wingFlap);
          ctx.fillStyle = ultActive ? 'rgba(168, 85, 247, 0.85)' : 'rgba(136, 19, 55, 0.72)';
          ctx.strokeStyle = ultActive ? '#E879F9' : '#FB7185';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(4, 2);
          ctx.quadraticCurveTo(22, -22, 36, -10);
          ctx.lineTo(29, 0);
          ctx.lineTo(34, 8);
          ctx.lineTo(22, 9);
          ctx.lineTo(25, 16);
          ctx.lineTo(6, 10);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
          ctx.restore();
        }
        ctx.restore();
      }
      const path = isDashing
        ? '/sprites/evil_wizard/attack2.png'
        : isMoving
          ? '/sprites/evil_wizard/run.png'
          : '/sprites/evil_wizard/idle.png';
      heroDrawn = drawStripSprite(ctx, path, 250, 0, 0, 198, 198, animT, 10, {
        ...drawOpts,
        anchorX: 0.5,
        anchorY: 0.664,
        tintColor: !hitFlash ? (ultActive ? '#E879F9' : '#C084FC') : undefined,
        tintAlpha: ultActive ? 0.34 : 0.22,
      });
    } else if (raceClass === 'vampire_lord') {
      // Crimson Vampire Lord: Dark crimson cloak + bat wings spread wide during Eternal Crimson Night!
      if (!hitFlash) {
        const spread = ultActive ? 1.32 : 0.88 + vampireBloodlustRatio * 0.25;
        const wingFlap = Math.sin(animT * (ultActive ? 8 : 5)) * 0.14;
        ctx.save();
        ctx.translate(0, -28);
        for (const side of [-1, 1]) {
          ctx.save();
          ctx.scale(side * spread, spread);
          ctx.rotate(-0.16 + wingFlap);
          ctx.fillStyle = ultActive ? 'rgba(190, 18, 60, 0.88)' : 'rgba(127, 29, 29, 0.75)';
          ctx.strokeStyle = '#FB7185';
          ctx.lineWidth = 1.4;
          ctx.beginPath();
          ctx.moveTo(3, 0);
          ctx.lineTo(18, -16);
          ctx.lineTo(34, -9);
          ctx.lineTo(24, 1);
          ctx.lineTo(30, 10);
          ctx.lineTo(16, 8);
          ctx.lineTo(4, 12);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
          ctx.restore();
        }
        ctx.restore();
      }
      const path = isDashing
        ? '/sprites/crow/crow_attack.png'
        : isMoving
          ? '/sprites/crow/crow_walk.png'
          : '/sprites/crow/crow_idle.png';
      heroDrawn = drawStripSprite(ctx, path, 64, 0, 0, ultActive ? 94 : 88, ultActive ? 94 : 88, animT, isMoving ? 11 : 7, {
        ...drawOpts,
        anchorX: 0.47,
        anchorY: 0.74,
        tintColor: !hitFlash ? '#E11D48' : undefined,
        tintAlpha: ultActive ? 0.38 : 0.24 + vampireBloodlustRatio * 0.16,
      });
      const vampSword = getPixelSpriteSheet('px_vampire_sword');
      if (vampSword) {
        drawCanvasStripSprite(ctx, vampSword, flipX ? -11 : 11, -22, 42, 18, animT, 1, {
          ...drawOpts,
          anchorX: 0.18,
          anchorY: 0.5,
          rotation: flipX ? 0.45 : -0.45,
          tintColor: '#FB7185',
          tintAlpha: 0.35,
        });
      }
    } else {
      // Base Vampire / Demonkin: User's Crow Gothic Noble (64x64) + crafted Crimson Bloodfang Sword
      const path = isDashing
        ? '/sprites/crow/crow_attack.png'
        : isMoving
          ? '/sprites/crow/crow_walk.png'
          : '/sprites/crow/crow_idle.png';
      heroDrawn = drawStripSprite(ctx, path, 64, 0, 0, 84, 84, animT, isDashing ? 14 : isMoving ? 10 : 6, {
        ...drawOpts,
        anchorX: 0.47,
        anchorY: 0.74,
        tintColor: !hitFlash ? (isNight ? '#E11D48' : '#FBBF24') : undefined,
        tintAlpha: isNight ? 0.2 : 0.14,
      });
      const vampSword = getPixelSpriteSheet('px_vampire_sword');
      if (vampSword) {
        drawCanvasStripSprite(ctx, vampSword, flipX ? -10 : 10, -21, 40, 17, animT, 1, {
          ...drawOpts,
          anchorX: 0.18,
          anchorY: 0.5,
          rotation: isDashing ? (flipX ? -0.15 : 0.15) : flipX ? 0.48 : -0.48,
        });
      }
    }
    if (isNight && !hitFlash) {
      // Subtle crimson night-empowerment embers rising around Vampire
      for (let m = 0; m < 3; m++) {
        const phase = (animT * 1.4 + m * 0.33) % 1;
        const mx = Math.sin(animT * 3 + m * 2.1) * 18;
        const my = -8 - phase * 38;
        ctx.fillStyle = `rgba(244, 63, 94, ${((1 - phase) * 0.72).toFixed(2)})`;
        ctx.fillRect(mx - 1.5, my - 1.5, 3, 3);
      }
    }
  } else if (raceId === 'orc') {
    const sheet = getPixelSpriteSheet('orc');
    if (sheet) {
      drawCanvasStripSprite(ctx, sheet, 0, 0, 68, 68, animT, isMoving ? 9 : 4, {
        ...drawOpts,
        anchorX: sheet.anchorX,
        anchorY: sheet.anchorY,
      });
      heroDrawn = true;
    }
  }

  if (!heroDrawn) {
    // Fallback minimal shadow silhouette only while PNG is still streaming over network
    ctx.fillStyle = hitFlash ? '#FFFFFF' : '#334155';
    ctx.beginPath();
    ctx.arc(0, -24, 13, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore(); // End sprite hero render

  // Class Evolution Halo / Crown / Shield / Ascension Indicators
  if (raceClass === 'saint') {
    ctx.strokeStyle = '#FEF08A';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.ellipse(0, -58, 14, 4.4, 0, 0, Math.PI * 2);
    ctx.stroke();
    if (saintShieldHits > 0) {
      const drewShield = drawVfxSheet(ctx, 'divine_shield', 0, -16, 78, 74, animT, 24, {
        alpha: 0.86,
      });
      if (!drewShield) {
        ctx.strokeStyle = 'rgba(253, 224, 71, 0.88)';
        ctx.lineWidth = 2.4;
        ctx.beginPath();
        ctx.arc(0, -18, 28, 0, Math.PI * 2);
        ctx.stroke();
      }
      for (let sh = 0; sh < saintShieldHits; sh++) {
        const sa = animT * 2.4 + (sh * Math.PI * 2) / 3;
        ctx.fillStyle = '#FEF08A';
        ctx.beginPath();
        ctx.arc(Math.cos(sa) * 30, -18 + Math.sin(sa) * 28, 4.2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  } else if (raceClass === 'knight') {
    ctx.imageSmoothingEnabled = false;

    // Section 1: Full Aegis rotating translucent blue pixel hexagon ring under feet
    if (knightAegisBonus >= 8 && !hitFlash) {
      ctx.save();
      ctx.translate(0, 15);
      ctx.scale(1, 0.56);
      ctx.rotate(animT * 0.8);
      ctx.strokeStyle = 'rgba(59, 143, 217, 0.72)';
      ctx.fillStyle = 'rgba(59, 143, 217, 0.12)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let hi = 0; hi < 6; hi++) {
        const ha = (hi * Math.PI) / 3;
        const hx = Math.round(Math.cos(ha) * 33);
        const hy = Math.round(Math.sin(ha) * 33);
        if (hi === 0) ctx.moveTo(hx, hy);
        else ctx.lineTo(hx, hy);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }

    // Section 1: On-hit small blue armor sparks (#3b8fd9, never red)
    if (knightHitSparkTimer > 0) {
      ctx.save();
      const sDir = knightHitKnockbackX >= 0 ? -1 : 1;
      ctx.fillStyle = '#3b8fd9';
      for (let sp = 0; sp < 4; sp++) {
        const tSp = 1 - knightHitSparkTimer / 0.14;
        const sx = Math.round(sDir * (8 + tSp * 10) + (sp % 2 === 0 ? -3 : 3));
        const sy = Math.round(-22 + (sp - 1.5) * 6 - tSp * 6);
        ctx.fillRect(sx, sy, 3, 3);
      }
      ctx.fillStyle = '#fffbe0';
      ctx.fillRect(sDir * 10, -24, 3, 3);
      ctx.restore();
    }

    // Section 7: Lionheart radiant pixel crown on Ascension
    if (ultAscended) {
      ctx.fillStyle = '#ffd75e';
      ctx.fillRect(-8, -56, 16, 4);
      ctx.fillRect(-8, -61, 3, 5);
      ctx.fillRect(-2, -64, 4, 8);
      ctx.fillRect(5, -61, 3, 5);
      ctx.fillStyle = '#fffbe0';
      ctx.fillRect(-1, -63, 2, 3);
    }

    // Section 6.2: Small gold knockback-immune shield icon above head during Ult Active
    if (ultActive && knightUltElapsed >= 1.2) {
      const iy = ultAscended ? -72 : -62;
      ctx.fillStyle = '#ffd75e';
      ctx.fillRect(-5, iy - 5, 10, 7);
      ctx.fillRect(-3, iy + 2, 6, 3);
      ctx.fillRect(-1, iy + 5, 2, 2);
      ctx.fillStyle = '#fffbe0';
      ctx.fillRect(-3, iy - 3, 6, 3);
    }

    if (knightParryFlash > 0) {
      ctx.strokeStyle = `rgba(255, 215, 94, ${Math.min(1, knightParryFlash * 2)})`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, -16, 34 + (0.45 - knightParryFlash) * 38, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Section 4: Bulwark 1-5 pixel hexagon scales in semicircle under hero + full translucent blue hex shield
    if (knightBulwarkStacks > 0 || knightBulwarkCrackTimer > 0) {
      if (knightBulwarkStacks >= 5 || knightBulwarkCrackTimer > 0) {
        const hexR = 30;
        const rot = animT * 0.45;
        ctx.save();
        ctx.translate(0, -18);
        ctx.rotate(rot);
        ctx.fillStyle = 'rgba(59, 143, 217, 0.16)';
        ctx.strokeStyle = '#3b8fd9';
        ctx.lineWidth = 2.4;
        ctx.beginPath();
        for (let hi = 0; hi < 6; hi++) {
          const ha = (hi * Math.PI) / 3;
          const hx = Math.round(Math.cos(ha) * hexR);
          const hy = Math.round(Math.sin(ha) * hexR);
          if (hi === 0) ctx.moveTo(hx, hy);
          else ctx.lineTo(hx, hy);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Inner pixel hexagon frame
        ctx.strokeStyle = 'rgba(255, 251, 224, 0.45)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let hi = 0; hi < 6; hi++) {
          const ha = (hi * Math.PI) / 3;
          const hx = Math.round(Math.cos(ha) * (hexR - 4));
          const hy = Math.round(Math.sin(ha) * (hexR - 4));
          if (hi === 0) ctx.moveTo(hx, hy);
          else ctx.lineTo(hx, hy);
        }
        ctx.closePath();
        ctx.stroke();

        // Golden crack lines flashing across shield surface before shatter
        if (knightBulwarkCrackTimer > 0) {
          ctx.strokeStyle = '#ffd75e';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(-18, -14);
          ctx.lineTo(-4, -2);
          ctx.lineTo(8, -18);
          ctx.moveTo(-4, -2);
          ctx.lineTo(14, 12);
          ctx.moveTo(-14, 14);
          ctx.lineTo(2, 4);
          ctx.stroke();
        }
        ctx.restore();
      }

      // 1-5 tiny pixel hexagon shield scales in semicircle under hero
      for (let bs = 0; bs < 5; bs++) {
        const ang = Math.PI * 0.2 + (bs / 4) * Math.PI * 0.6;
        const sx = Math.round(Math.cos(Math.PI - ang) * 20);
        const sy = Math.round(8 + Math.sin(ang) * 9);
        const active = bs < knightBulwarkStacks;
        ctx.fillStyle = active ? '#3b8fd9' : 'rgba(14, 42, 74, 0.65)';
        ctx.strokeStyle = active ? '#fffbe0' : 'rgba(59, 143, 217, 0.38)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let hi = 0; hi < 6; hi++) {
          const ha = (hi * Math.PI) / 3;
          const px = sx + Math.round(Math.cos(ha) * 3.5);
          const py = sy + Math.round(Math.sin(ha) * 3.5);
          if (hi === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }
    }
  } else if (raceClass === 'hunter') {
    const clampedCharges = Math.max(0, Math.min(3, Math.round(hunterDashCharges)));
    const drewCharges = drawPackVfx(ctx, 'hunter_dash_charges', 0, 15, animT, {
      scale: 1.75,
      frameOverride: clampedCharges,
    });
    if (drewCharges && hunterDashMaxCharges > 3) {
      const filled4 = hunterDashCharges >= 4;
      ctx.fillStyle = filled4 ? '#38BDF8' : 'rgba(15, 23, 42, 0.72)';
      ctx.strokeStyle = filled4 ? '#ECFDF5' : 'rgba(167, 139, 250, 0.5)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(26, 11.4);
      ctx.lineTo(29.6, 15);
      ctx.lineTo(26, 18.6);
      ctx.lineTo(22.4, 15);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
    if (!drewCharges) {
      const totalCharges = Math.max(1, hunterDashMaxCharges);
      const gap = 10;
      const startCx = -((totalCharges - 1) * gap) * 0.5;
      const fillCol = ultActive ? '#E879F9' : ultAscended ? '#FB7185' : '#34D399';
      for (let c = 0; c < totalCharges; c++) {
        const cx = startCx + c * gap;
        const cy = 15;
        const filled = c < hunterDashCharges;
        ctx.fillStyle = filled ? fillCol : 'rgba(15, 23, 42, 0.72)';
        ctx.strokeStyle = filled ? '#ECFDF5' : 'rgba(167, 139, 250, 0.45)';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(cx, cy - 3.6);
        ctx.lineTo(cx + 3.6, cy);
        ctx.lineTo(cx, cy + 3.6);
        ctx.lineTo(cx - 3.6, cy);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }
    }
  } else if (raceClass === 'demon_lord' && demonCrownActive) {
    // Crown of the Pit (666+ kills)
    ctx.fillStyle = '#F97316';
    ctx.strokeStyle = '#FDE047';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(-12, -54);
    ctx.lineTo(-9, -65);
    ctx.lineTo(-3, -58);
    ctx.lineTo(0, -69);
    ctx.lineTo(3, -58);
    ctx.lineTo(9, -65);
    ctx.lineTo(12, -54);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else if (raceClass === 'vampire_lord' && vampireBloodShieldPct > 0) {
    ctx.strokeStyle = 'rgba(244, 63, 94, 0.82)';
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    ctx.arc(0, -16, 26, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.min(1, vampireBloodShieldPct));
    ctx.stroke();
  } else if (raceClass === 'seven_sins') {
    const sinColors = ['#C084FC', '#FBBF24', '#10B981', '#EF4444', '#60A5FA', '#84CC16', '#EC4899'];
    for (let s = 0; s < 7; s++) {
      const sa = animT * (ultAscended ? 2.1 : 1.1) + (s * Math.PI * 2) / 7;
      const sx = Math.cos(sa) * 26;
      const sy = -42 + Math.sin(sa) * 7;
      ctx.fillStyle = sinColors[s];
      ctx.beginPath();
      ctx.arc(sx, sy, ultAscended ? 3.4 : 2.3, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (raceClass === 'death_god') {
    ctx.strokeStyle = 'rgba(244, 63, 94, 0.85)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(0, -56, 13, 4.2, 0, 0, Math.PI * 2);
    ctx.stroke();
    for (let w = 0; w < 4; w++) {
      const wa = animT * 2.2 + (w * Math.PI * 2) / 4;
      const wx = Math.cos(wa) * 32;
      const wy = -20 + Math.sin(wa) * 14 + Math.sin(animT * 5 + w) * 3;
      drawPackVfx(ctx, 'death_soul_wisp', wx, wy, animT + w * 0.15, { scale: 1.5, alpha: 0.9 });
    }
  }

  // Spellblade 360° Stand-Still Charge Ring (frames 0..3)
  if ((raceClass === 'spellblade_god' || raceClass === 'voidless_blade') && spellbladeCharge > 0.05) {
    const chargeFrame = Math.min(3, Math.floor(Math.max(0, Math.min(1, spellbladeCharge)) * 3.99));
    drawPackVfx(ctx, 'spellblade_charge_360', 0, -14, animT, {
      scale: 1.4,
      frameOverride: chargeFrame,
      alpha: 0.82,
    });
  }

  // Void Infusion Dark Aura (Mage Space skill)
  if (raceId === 'mage' && voidInfusionActive) {
    const drewVoid = drawPackVfx(ctx, 'mage_void_infusion', 0, -16, animT, {
      scale: 1.7,
      alpha: 0.9,
    });
    if (!drewVoid) {
      const pulse = 1 + Math.sin(nowMs * 0.015) * 0.1;
      ctx.save();
      ctx.strokeStyle = 'rgba(192, 132, 252, 0.85)';
      ctx.lineWidth = 2.2;
      ctx.setLineDash([5, 4]);
      ctx.beginPath();
      ctx.arc(0, -14, 28 * pulse, -nowMs * 0.005, -nowMs * 0.005 + Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
    }
  }

  // Orbiting Held Elemental Orbs + Ritual Cooldown Ring for Mage
  if (raceId === 'mage') {
    if (fusionCooldown > 0.05) {
      const ratio = Math.max(0, Math.min(1, fusionCooldown / Math.max(0.1, fusionMaxCooldown)));
      ctx.save();
      ctx.strokeStyle = 'rgba(129, 140, 248, 0.88)';
      ctx.lineWidth = 2.6;
      ctx.beginPath();
      ctx.arc(0, -14, 32, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * ratio);
      ctx.stroke();
      ctx.restore();
    }

    if (heldElements && heldElements.length > 0) {
      const r = 36;
      for (let i = 0; i < heldElements.length; i++) {
        const elId = heldElements[i];
        const elDef = ELEMENTS[elId];
        const a = nowMs * 0.004 + (i * Math.PI * 2) / heldElements.length;
        const ox = Math.cos(a) * r;
        const oy = -16 + Math.sin(a) * (r * 0.62);
        const drewOrb = drawPackVfx(ctx, `orb_${elId}` as PackVfxKey, ox, oy, animT + i * 0.2, {
          scale: 1.4,
        });
        if (!drewOrb) {
          ctx.fillStyle = elDef.glowColor;
          ctx.beginPath();
          ctx.arc(ox, oy, 6.4, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = elDef.color;
          ctx.beginPath();
          ctx.arc(ox, oy, 4.2, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
  }

  // Mage Wind Barrier Ring
  if (mageBarrierTimer > 0) {
    const drewBarrier = drawPackVfx(ctx, 'mage_wind_barrier', 0, -14, animT, {
      scale: 1.65,
      alpha: 0.9,
    });
    if (!drewBarrier) {
      ctx.save();
      ctx.strokeStyle = 'rgba(52, 211, 153, 0.85)';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.arc(0, -14, 37, 0, Math.PI * 2);
      ctx.stroke();
      for (let k = 0; k < 3; k++) {
        const a = nowMs * 0.008 + (k * Math.PI * 2) / 3;
        ctx.strokeStyle = '#A7F3D0';
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.arc(0, -14, 39, a, a + 0.85);
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  // Vampire Bat Swarm Transformation (Orbiting Crimson Bat Cloud)
  if (batSwarmActive) {
    ctx.save();
    const mistGrad = ctx.createRadialGradient(0, -14, 4, 0, -14, 42);
    mistGrad.addColorStop(0, 'rgba(225, 29, 72, 0.38)');
    mistGrad.addColorStop(1, 'rgba(15, 23, 42, 0)');
    ctx.fillStyle = mistGrad;
    ctx.beginPath();
    ctx.arc(0, -14, 42, 0, Math.PI * 2);
    ctx.fill();

    for (let b = 0; b < 6; b++) {
      const ang = nowMs * 0.011 + (b * Math.PI * 2) / 6;
      const dist = 16 + Math.sin(nowMs * 0.016 + b * 1.9) * 10;
      const bx = Math.cos(ang) * dist;
      const by = -18 + Math.sin(ang) * (dist * 0.65);
      const wing = Math.sin(nowMs * 0.032 + b * 1.3) * 4.5;
      ctx.save();
      ctx.translate(bx, by);
      ctx.fillStyle = b % 2 === 0 ? '#1E1B2E' : '#881337';
      ctx.strokeStyle = '#FB7185';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, -2);
      ctx.quadraticCurveTo(-6, -7 + wing, -10, -1 + wing);
      ctx.lineTo(-3, 2);
      ctx.lineTo(0, 4);
      ctx.lineTo(3, 2);
      ctx.lineTo(10, -1 + wing);
      ctx.quadraticCurveTo(6, -7 + wing, 0, -2);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }
    ctx.restore();
  }

  // Orc Berserk Rage Flames
  if (orcBerserkActive && !hitFlash) {
    ctx.save();
    for (let f = 0; f < 5; f++) {
      const phase = (animT * 2.1 + f * 0.2) % 1;
      const fx = Math.sin(animT * 6 + f * 1.7) * 20;
      const fy = -6 - phase * 44;
      ctx.fillStyle =
        f % 2 === 0
          ? `rgba(249, 115, 22, ${((1 - phase) * 0.85).toFixed(2)})`
          : `rgba(239, 68, 68, ${((1 - phase) * 0.85).toFixed(2)})`;
      ctx.beginPath();
      ctx.arc(fx, fy, 3.2 * (1 - phase * 0.4), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  // Minimal Clean Overhead Player Chevron (floats cleanly above hood/crown without clipping sprite)
  {
    const chevronColor = hitFlash ? '#FFFFFF' : frameAccent;
    const floatY = -78 + Math.sin(animT * 3.8) * 1.6;
    ctx.save();
    ctx.translate(0, floatY);
    ctx.fillStyle = chevronColor;
    ctx.strokeStyle = 'rgba(2, 6, 17, 0.95)';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(0, 5.5);
    ctx.lineTo(5.2, -2.5);
    ctx.lineTo(0, -0.5);
    ctx.lineTo(-5.2, -2.5);
    ctx.closePath();
    ctx.stroke();
    ctx.fill();
    ctx.restore();
  }

  ctx.restore();
}

export function drawHolyGolemSprite(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  _walkCycle: number,
  smashing: boolean,
  nowMs: number,
  hp?: number,
  maxHp?: number,
  seraphMode = false,
  ascended = false
): void {
  const animT = nowMs * 0.001;
  ctx.save();
  ctx.translate(x, y);

  // 1.4x larger Colossus footprint!
  const scale = seraphMode ? 1.52 : 1.4;
  const auraR = (48 + Math.sin(nowMs * 0.006) * 3.5) * (seraphMode ? 1.35 : 1.15);
  const auraGrad = ctx.createRadialGradient(0, 0, 14, 0, 0, auraR);
  auraGrad.addColorStop(
    0,
    seraphMode
      ? 'rgba(254, 240, 138, 0.42)'
      : smashing
        ? 'rgba(250, 204, 21, 0.34)'
        : 'rgba(253, 224, 71, 0.2)'
  );
  auraGrad.addColorStop(1, 'rgba(253, 224, 71, 0)');
  ctx.fillStyle = auraGrad;
  ctx.beginPath();
  ctx.arc(0, 0, auraR, 0, Math.PI * 2);
  ctx.fill();

  const tauntProgress = (nowMs * 0.0012) % 1;
  ctx.strokeStyle = `rgba(250, 204, 21, ${(1 - tauntProgress) * 0.48})`;
  ctx.lineWidth = 2;
  ctx.setLineDash([6, 6]);
  ctx.beginPath();
  ctx.arc(0, 0, 56 + tauntProgress * 84, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  ctx.beginPath();
  ctx.ellipse(0, 28, 36, 12, 0, 0, Math.PI * 2);
  ctx.fill();

  // 4 Radiant Angelic Wings when Seraph Oath Ultimate or Ascended!
  if (seraphMode || ascended) {
    const hoverY = seraphMode ? -10 + Math.sin(animT * 5) * 4 : 0;
    const flap = Math.sin(animT * (seraphMode ? 6.5 : 3.5)) * 0.14;
    ctx.save();
    ctx.translate(0, -34 + hoverY);
    for (const side of [-1, 1]) {
      for (let pair = 0; pair < 2; pair++) {
        ctx.save();
        ctx.scale(side, 1);
        ctx.rotate((pair === 0 ? -0.35 : 0.12) + flap * (pair === 0 ? 1 : -0.8));
        ctx.fillStyle = seraphMode ? 'rgba(254, 240, 138, 0.85)' : 'rgba(250, 204, 21, 0.58)';
        ctx.strokeStyle = '#FEF9C3';
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(10, 0);
        ctx.quadraticCurveTo(44, -26 - pair * 6, 68 - pair * 12, -10);
        ctx.lineTo(48 - pair * 8, 6);
        ctx.lineTo(14, 10);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      }
    }
    ctx.restore();
  }

  const floatOffset = seraphMode ? -10 + Math.sin(animT * 5) * 4 : 0;
  const drewSaintGolem = drawPackVfx(ctx, 'saint_golem', 0, 26 + floatOffset, animT * (smashing ? 1.8 : 1), {
    scale: seraphMode ? 2.55 : 2.35,
    tintColor: seraphMode ? '#FEF9C3' : smashing ? '#FEF08A' : undefined,
    tintAlpha: seraphMode ? 0.25 : 0.22,
  });
  if (!drewSaintGolem) {
    const sheet = getPixelSpriteSheet('holy_golem');
    if (sheet) {
      drawCanvasStripSprite(ctx, sheet, 0, 26 + floatOffset, 92 * scale, 92 * scale, animT, smashing ? 12 : 6, {
        anchorX: sheet.anchorX,
        anchorY: sheet.anchorY,
        tintColor: seraphMode ? '#FEF9C3' : smashing ? '#FEF08A' : undefined,
        tintAlpha: seraphMode ? 0.35 : 0.28,
      });
    }
  }

  // Real HP Bar above Golem's head
  if (hp !== undefined && maxHp !== undefined && maxHp > 0) {
    const bw = 64;
    const barY = -98 + floatOffset;
    const ratio = Math.max(0, Math.min(1, hp / maxHp));
    ctx.fillStyle = 'rgba(0, 0, 0, 0.84)';
    ctx.fillRect(-bw / 2 - 1, barY - 1, bw + 2, 8);
    ctx.fillStyle = seraphMode ? '#FEF08A' : ratio > 0.35 ? '#FACC15' : '#FB7185';
    ctx.fillRect(-bw / 2, barY, bw * ratio, 6);
    ctx.strokeStyle = 'rgba(254, 243, 199, 0.65)';
    ctx.lineWidth = 1;
    ctx.strokeRect(-bw / 2 - 1, barY - 1, bw + 2, 8);
  }

  ctx.restore();
}

export function drawElementalGolemSprite(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  _walkCycle: number,
  smashing: boolean,
  theme: 'frost' | 'stone',
  nowMs: number
): void {
  const isFrost = theme === 'frost';
  const animT = nowMs * 0.001;
  ctx.save();
  ctx.translate(x, y);

  const auraR = 40 + Math.sin(nowMs * 0.006) * 3;
  ctx.strokeStyle = isFrost ? 'rgba(103, 232, 249, 0.55)' : 'rgba(250, 204, 21, 0.45)';
  ctx.lineWidth = smashing ? 3 : 1.8;
  ctx.beginPath();
  ctx.arc(0, 0, auraR, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.beginPath();
  ctx.ellipse(0, 22, 24, 9, 0, 0, Math.PI * 2);
  ctx.fill();

  const drewGolem = drawPackVfx(
    ctx,
    isFrost ? 'spell_water_wind' : 'spell_earth_stone',
    0,
    22,
    animT * (smashing ? 1.8 : 1),
    { scale: 2.35 }
  );
  if (!drewGolem) {
    const sheet = getPixelSpriteSheet(isFrost ? 'frost_golem' : 'stone_golem');
    if (sheet) {
      drawCanvasStripSprite(ctx, sheet, 0, 22, 78, 78, animT, smashing ? 12 : 6, {
        anchorX: sheet.anchorX,
        anchorY: sheet.anchorY,
      });
    }
  }

  ctx.restore();
}

export function drawElementOrbSprite(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  elementId: ElementId,
  nowMs: number
): void {
  const def = ELEMENTS[elementId];
  const pulse = 1 + Math.sin(nowMs * 0.007 + x * 0.05) * 0.12;
  const animT = nowMs * 0.001;
  ctx.save();
  ctx.translate(x, y);

  const g = ctx.createRadialGradient(0, 0, 3, 0, 0, 21 * pulse);
  g.addColorStop(0, `${def.glowColor}88`);
  g.addColorStop(1, `${def.color}00`);
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(0, 0, 21 * pulse, 0, Math.PI * 2);
  ctx.fill();

  const drewOrb = drawPackVfx(ctx, `orb_${elementId}` as PackVfxKey, 0, -2, animT, {
    scale: 1.85,
  });
  if (!drewOrb) {
    ctx.fillStyle = def.color;
    ctx.strokeStyle = def.glowColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, -1, 8.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  ctx.fillStyle = 'rgba(11, 15, 23, 0.9)';
  ctx.beginPath();
  ctx.arc(0, 12, 7.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = def.glowColor;
  ctx.font = '700 8px Anuphan, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(def.shortTh, 0, 12.5);

  ctx.restore();
}

export function drawManaGemSprite(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  nowMs: number
): void {
  const pulse = 1 + Math.sin(nowMs * 0.008 + y * 0.05) * 0.1;
  const animT = nowMs * 0.001;
  ctx.save();
  ctx.translate(x, y);

  ctx.fillStyle = 'rgba(56, 189, 248, 0.28)';
  ctx.beginPath();
  ctx.arc(0, 0, 14 * pulse, 0, Math.PI * 2);
  ctx.fill();

  const drewGem = drawPackVfx(ctx, 'mana_gem', 0, 0, animT, { scale: 1.75 });
  if (!drewGem) {
    ctx.fillStyle = '#2563EB';
    ctx.strokeStyle = '#93C5FD';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(0, -8);
    ctx.lineTo(6.5, 0);
    ctx.lineTo(0, 8);
    ctx.lineTo(-6.5, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  ctx.restore();
}

export function drawSpiritSwordSprite(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  angle: number,
  swingTimer: number,
  hp: number,
  maxHp: number,
  element: ElementId,
  nowMs: number
): void {
  const def = ELEMENTS[element];
  const animT = nowMs * 0.001;
  const hover = Math.sin(nowMs * 0.008 + x * 0.04) * 3;
  const swinging = swingTimer > 0;
  const swingOffset = swinging ? Math.sin((swingTimer / 0.22) * Math.PI) * 1.35 : 0;

  ctx.save();
  ctx.translate(x, y + hover);

  ctx.fillStyle = 'rgba(0, 0, 0, 0.42)';
  ctx.beginPath();
  ctx.ellipse(0, 19 - hover, 13, 5, 0, 0, Math.PI * 2);
  ctx.fill();

  const aura = ctx.createRadialGradient(0, 0, 4, 0, 0, 24);
  aura.addColorStop(0, `${def.glowColor}55`);
  aura.addColorStop(1, `${def.color}00`);
  ctx.fillStyle = aura;
  ctx.beginPath();
  ctx.arc(0, 0, 24, 0, Math.PI * 2);
  ctx.fill();

  if (swinging) {
    drawPackVfx(ctx, 'knight_blade_slash', 0, 0, (0.22 - swingTimer) * 1.1, {
      scale: 1.4,
      angle,
      tintColor: def.color,
      tintAlpha: 0.45,
    });
  }

  const drewSword = drawPackVfx(ctx, 'voidless_spirit_sword', 0, 0, animT, {
    scale: 1.6,
    angle: angle + swingOffset + Math.PI * 0.5,
    tintColor: def.glowColor,
    tintAlpha: 0.32,
  });
  if (!drewSword) {
    ctx.save();
    ctx.rotate(angle + swingOffset);
    ctx.fillStyle = def.glowColor;
    ctx.strokeStyle = def.color;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(16, 0);
    ctx.lineTo(-4, -4.5);
    ctx.lineTo(-10, -2);
    ctx.lineTo(-14, 0);
    ctx.lineTo(-10, 2);
    ctx.lineTo(-4, 4.5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  const bw = 28;
  const ratio = Math.max(0, Math.min(1, hp / Math.max(1, maxHp)));
  ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
  ctx.fillRect(-bw / 2, -29, bw, 4);
  ctx.fillStyle = def.glowColor;
  ctx.fillRect(-bw / 2, -29, bw * ratio, 4);

  ctx.restore();
}

export function drawElementalField(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  color: string,
  kind: 'vortex' | 'pool' | 'black_hole' | 'heaven_pillar',
  lifeRatio: number,
  nowMs: number,
  vfxKey?: PackVfxKey,
  elapsedSec?: number
): void {
  const animT = elapsedSec ?? nowMs * 0.001;
  ctx.save();
  ctx.translate(x, y);
  ctx.globalAlpha = Math.max(0.22, Math.min(0.95, lifeRatio * 1.45));

  if (kind === 'black_hole') {
    // Ground-plane gravity distortion rim
    ctx.save();
    ctx.scale(1, ISO_TILT);
    const rimGrad = ctx.createRadialGradient(0, 0, radius * 0.35, 0, 0, radius);
    rimGrad.addColorStop(0, 'rgba(9, 9, 11, 0.45)');
    rimGrad.addColorStop(0.72, 'rgba(126, 34, 206, 0.24)');
    rimGrad.addColorStop(1, 'rgba(168, 85, 247, 0)');
    ctx.fillStyle = rimGrad;
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(192, 132, 252, 0.55)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.96, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    const meta = VFX_SHEETS.moon_eclipse;
    const bhW = Math.max(135, radius * 2.45);
    const bhH = bhW * (meta.cellH / meta.cellW);
    const drewEclipse = drawVfxSheet(ctx, 'moon_eclipse', 0, -10, bhW, bhH, animT, 28, {
      alpha: 0.96,
    });
    if (!drewEclipse) {
      const bhKey: PackVfxKey = vfxKey ?? 'spell_dark_dark';
      const pMeta = PACK_VFX[bhKey];
      const s = Math.max(1.5, (radius * 2.15) / pMeta.w);
      drawPackVfx(ctx, bhKey, 0, 0, animT, { scale: s });
    }
    ctx.restore();
    return;
  }

  if (kind === 'heaven_pillar') {
    const pulse = 1 + Math.sin(nowMs * 0.018) * 0.08;
    ctx.save();
    ctx.scale(1, ISO_TILT);
    const rg = ctx.createRadialGradient(0, 0, 8, 0, 0, radius * pulse);
    rg.addColorStop(0, 'rgba(254, 240, 138, 0.72)');
    rg.addColorStop(1, 'rgba(250, 204, 21, 0)');
    ctx.fillStyle = rg;
    ctx.beginPath();
    ctx.arc(0, 0, radius * pulse, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#FEF08A';
    ctx.lineWidth = 2.4;
    ctx.stroke();
    ctx.restore();

    const pMeta = VFX_SHEETS.holy_pillar;
    const pW = Math.max(150, radius * 2.45);
    const pH = pW * (pMeta.cellH / pMeta.cellW);
    const drewHolyPillar = drawVfxSheet(ctx, 'holy_pillar', 0, 16, pW, pH, animT, 26, {
      anchorY: 0.85,
      alpha: 0.96,
    });
    if (!drewHolyPillar) {
      const pKey: PackVfxKey = vfxKey ?? 'voidless_heaven_pillar';
      const meta = PACK_VFX[pKey];
      const pScale = Math.max(1.8, (radius * 1.55) / meta.w);
      const drewPillar = drawPackVfx(ctx, pKey, 0, 6, animT, { scale: pScale });
      if (!drewPillar) {
        const colGrad = ctx.createLinearGradient(-radius * 0.45, 0, radius * 0.45, 0);
        colGrad.addColorStop(0, 'rgba(250, 204, 21, 0)');
        colGrad.addColorStop(0.5, 'rgba(254, 249, 195, 0.72)');
        colGrad.addColorStop(1, 'rgba(250, 204, 21, 0)');
        ctx.fillStyle = colGrad;
        ctx.fillRect(-radius * 0.45, -340, radius * 0.9, 340);
      }
    }
    ctx.restore();
    return;
  }

  const g = ctx.createRadialGradient(0, 0, radius * 0.1, 0, 0, radius);
  g.addColorStop(0, `${color}55`);
  g.addColorStop(1, `${color}0A`);
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.fill();

  let drewPack = false;
  if (vfxKey && PACK_VFX[vfxKey]) {
    const meta = PACK_VFX[vfxKey];
    const sx = (radius * 2.15) / meta.w;
    drewPack = drawPackVfx(ctx, vfxKey, 0, 0, animT, {
      scale: sx,
    });
  }

  if (!drewPack) {
    if (kind === 'vortex') {
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.4;
      for (let k = 0; k < 3; k++) {
        const a = nowMs * 0.006 + (k * Math.PI * 2) / 3;
        ctx.beginPath();
        ctx.arc(0, 0, radius * (0.4 + k * 0.22), a, a + Math.PI * 1.15);
        ctx.stroke();
      }
    } else {
      ctx.strokeStyle = `${color}AA`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, radius * 0.94, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
  ctx.restore();
}

export function drawSweepingLaser(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  angle: number,
  length: number,
  width: number,
  color: string,
  lifeRatio: number,
  vfxKey?: PackVfxKey
): void {
  const sy = y * ISO_TILT - 14;
  const x2 = x + Math.cos(angle) * length;
  const sy2 = (y + Math.sin(angle) * length) * ISO_TILT - 14;
  const alpha = Math.max(0.28, Math.min(1, lifeRatio * 1.8));

  ctx.save();
  ctx.globalAlpha = alpha;

  ctx.save();
  ctx.translate(x, y * ISO_TILT);
  ctx.scale(1, ISO_TILT);
  ctx.strokeStyle = `${color}44`;
  ctx.lineWidth = 1.8;
  ctx.setLineDash([8, 8]);
  ctx.beginPath();
  ctx.arc(0, 0, length, angle - 0.85, angle);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();

  const beamKey: PackVfxKey = vfxKey ?? 'spell_stone_light';
  const drewBeam = drawPackVfxTiledBeam(
    ctx,
    beamKey,
    x,
    sy,
    x2,
    sy2,
    performance.now() * 0.001,
    Math.max(22, width * 2.0),
    alpha
  );

  if (!drewBeam) {
    ctx.lineCap = 'round';
    ctx.strokeStyle = `${color}66`;
    ctx.lineWidth = Math.max(12, width * 1.5);
    ctx.beginPath();
    ctx.moveTo(x, sy);
    ctx.lineTo(x2, sy2);
    ctx.stroke();

    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = Math.max(4, width * 0.45);
    ctx.beginPath();
    ctx.moveTo(x, sy);
    ctx.lineTo(x2, sy2);
    ctx.stroke();
  }

  ctx.restore();
}

export interface RenderEnemyParams {
  ctx: CanvasRenderingContext2D;
  kind: EnemyKind;
  x: number;
  y: number;
  radius: number;
  hp: number;
  maxHp: number;
  hitFlash: boolean;
  frozen: boolean;
  hardFrozen?: boolean;
  chronoFrozen?: boolean;
  burning?: boolean;
  windMarked?: boolean;
  isBoss: boolean;
  isMajorBoss: boolean;
  isReaper: boolean;
  buffs?: BossBuffId[];
  berserkActive?: boolean;
  staggered?: boolean;
  stagger?: number;
  maxStagger?: number;
  windupTimer: number;
  phaseAngle: number;
  nowMs: number;
  vx?: number;
  vy?: number;
  id?: number;
  huntMarks?: number;
  hellfireStacks?: number;
  bleedStacks?: number;
  charmed?: boolean;
  confused?: boolean;
  eliteResistType?: DamageType;
  judgementActive?: boolean;
  knightParryHint?: boolean;
  parriedStunTimer?: number;
  knightTauntBangTimer?: number;
  emeraldMarked?: boolean;
  statuses?: Partial<Record<EnemyStatusId, EnemyStatusEntry>>;
  sinkKind?: 'water' | 'lava' | 'poison' | null;
  hitReactProgress?: number;
  hitStrength?: number;
  recoilX?: number;
  recoilY?: number;
}

export function drawEnemySprite(e: RenderEnemyParams): void {
  const {
    ctx,
    kind,
    x,
    y,
    radius,
    hp,
    maxHp,
    hitFlash,
    frozen,
    hardFrozen,
    chronoFrozen = false,
    burning,
    windMarked,
    isBoss,
    buffs,
    berserkActive,
    staggered,
    stagger = 0,
    maxStagger = 0,
    windupTimer,
    phaseAngle,
    nowMs,
    vx = 1,
    vy = 0,
    id = 0,
    huntMarks = 0,
    hellfireStacks = 0,
    bleedStacks = 0,
    charmed = false,
    confused = false,
    eliteResistType,
    judgementActive = false,
    knightParryHint = false,
    parriedStunTimer = 0,
    knightTauntBangTimer = 0,
    emeraldMarked = false,
    statuses,
    sinkKind = null,
    hitReactProgress = 0,
    hitStrength = 1,
    recoilX = 0,
    recoilY = 0,
  } = e;

  ctx.save();
  ctx.translate(x + recoilX, y + recoilY);

  if (sinkKind) {
    const rPulse = Math.max(12, radius * 0.85) + Math.sin(nowMs * 0.009 + id) * 2;
    ctx.strokeStyle =
      sinkKind === 'lava'
        ? 'rgba(251, 146, 60, 0.6)'
        : sinkKind === 'poison'
          ? 'rgba(163, 230, 53, 0.55)'
          : 'rgba(125, 211, 252, 0.6)';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.ellipse(0, radius * 0.45, rPulse, rPulse * 0.42, 0, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Boss Buff Auras
  if (isBoss && buffs && buffs.length > 0) {
    const pulse = 1 + Math.sin(nowMs * 0.008) * 0.06;
    if (berserkActive) {
      ctx.strokeStyle = 'rgba(249, 115, 22, 0.85)';
      ctx.lineWidth = 3.2;
      ctx.beginPath();
      ctx.arc(0, 0, (radius + 14) * pulse, 0, Math.PI * 2);
      ctx.stroke();
    } else if (buffs.includes('frenzy') || buffs.includes('blinker')) {
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.55)';
      ctx.lineWidth = 2;
      ctx.setLineDash([7, 5]);
      ctx.beginPath();
      ctx.arc(0, 0, (radius + 11) * pulse, nowMs * 0.002, nowMs * 0.002 + Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    } else if (buffs.includes('vampiric') || buffs.includes('barrage')) {
      ctx.strokeStyle = 'rgba(244, 63, 94, 0.55)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, (radius + 10) * pulse, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  // Boss Stagger (Armor Break!) Visual Halo
  if (isBoss && staggered) {
    const sp = 1 + Math.sin(nowMs * 0.018) * 0.08;
    ctx.strokeStyle = 'rgba(250, 204, 21, 0.92)';
    ctx.lineWidth = 3;
    ctx.setLineDash([8, 5]);
    ctx.beginPath();
    ctx.arc(0, 0, (radius + 14) * sp, nowMs * 0.004, nowMs * 0.004 + Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // Windup Telegraph Ring (or pulsing thin gold ring when Knight can Parry!)
  if (windupTimer > 0 && !staggered) {
    if (knightParryHint) {
      const gPulse = 0.55 + Math.sin(nowMs * 0.028) * 0.45;
      ctx.strokeStyle = `rgba(255, 215, 94, ${gPulse.toFixed(2)})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, radius + 9 + (gPulse * 3), 0, Math.PI * 2);
      ctx.stroke();
    } else {
      ctx.strokeStyle = 'rgba(244, 63, 94, 0.85)';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(0, 0, radius + 8 + (1 - windupTimer) * 10, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  // Shadow (scaled slightly to match enlarged enemy sprites)
  const enemyVisScale = isBoss ? 1.16 : 1.24;
  ctx.fillStyle = 'rgba(0,0,0,0.48)';
  ctx.beginPath();
  ctx.ellipse(0, radius * 0.92, radius * 0.96, radius * 0.4, 0, 0, Math.PI * 2);
  ctx.fill();

  const flash = hitFlash;
  const animT = chronoFrozen ? phaseAngle * 0.4 : nowMs * 0.001 + phaseAngle * 0.4;
  const faceX = Math.abs(vx) > 0.5 ? vx : Math.cos(phaseAngle) || 1;
  const faceY = vy;
  const flipX = faceX < 0;
  const baseOpts = {
    hitFlash: flash,
    tintColor: !flash ? (chronoFrozen ? '#94A3B8' : frozen ? '#67E8F9' : undefined) : undefined,
    tintAlpha: chronoFrozen ? 0.58 : 0.48,
    anchorX: 0.5,
    anchorY: 0.88,
    flipX,
  };

  // Hit-reaction squash & stretch + recoil tilt + smooth stride cadence
  const imp = Math.max(0, Math.min(1, hitReactProgress));
  const str = Math.max(0.5, Math.min(1.8, hitStrength));
  const squashWave = imp > 0 ? Math.sin(imp * Math.PI * 1.45) * imp : 0;
  const hitScaleX = 1 + squashWave * 0.28 * str;
  const hitScaleY = Math.max(0.62, 1 - squashWave * 0.24 * str);
  const knockdownTilt = parriedStunTimer > 0 ? (flipX ? -0.42 : 0.42) : 0;
  const hitTilt = knockdownTilt + (imp > 0 ? Math.sin(imp * Math.PI) * 0.16 * (recoilX >= 0 ? 1 : -1) * str : 0);
  const speedMag = Math.hypot(vx, vy);
  const smoothStrideBob = chronoFrozen || speedMag < 4 ? 0 : Math.abs(Math.sin(animT * 7.2 + id)) * 1.8;

  ctx.save();
  ctx.translate(0, radius * 0.9 + (parriedStunTimer > 0 ? 4 : 0));
  ctx.rotate(hitTilt);
  ctx.scale(enemyVisScale * hitScaleX, enemyVisScale * hitScaleY);
  ctx.translate(0, -radius * 0.9 - smoothStrideBob);

  ctx.imageSmoothingEnabled = false;
  let enemyDrawn = false;

  if (kind === 'cultist') {
    const action = windupTimer > 0 ? 'Attack.png' : 'Fly.png';
    enemyDrawn = drawDir3StripSprite(
      ctx,
      '/craftpix/enemies/td_enemy3',
      action,
      96,
      -1,
      faceX,
      faceY,
      0,
      radius * 0.9,
      radius * 3.8,
      radius * 3.8,
      animT,
      8,
      baseOpts
    );
  } else if (kind === 'charger') {
    const action = windupTimer > 0 ? 'Special.png' : 'Run.png';
    enemyDrawn = drawDir3StripSprite(
      ctx,
      '/craftpix/enemies/td_enemy2',
      action,
      96,
      -1,
      faceX,
      faceY,
      0,
      radius * 0.9,
      radius * 4.0,
      radius * 4.0,
      animT,
      10,
      baseOpts
    );
  } else if (kind === 'stalker') {
    enemyDrawn = drawDir3StripSprite(
      ctx,
      '/craftpix/enemies/td_enemy1',
      'Run.png',
      96,
      -1,
      faceX,
      faceY,
      0,
      radius * 0.9,
      radius * 3.7,
      radius * 3.7,
      animT,
      11,
      baseOpts
    );
  } else if (kind === 'boss_wyrm') {
    const arr = windupTimer > 0 ? FRAMES.dragonAttack : FRAMES.dragonWalk;
    enemyDrawn = drawFrameArraySprite(ctx, arr, 0, radius * 0.92, radius * 4.6, radius * 4.6, animT, 8, {
      ...baseOpts,
      anchorY: 0.72,
    });
  } else if (kind === 'reaper') {
    // User's Undead Executioner with huge scythe!
    const pulse = 1 + Math.sin(nowMs * 0.01) * 0.08;
    ctx.strokeStyle = 'rgba(244, 63, 94, 0.84)';
    ctx.lineWidth = 3.2;
    ctx.beginPath();
    ctx.arc(0, 0, radius * 1.18 * pulse, 0, Math.PI * 2);
    ctx.stroke();

    const isSkill = windupTimer > 0.35;
    const isAttacking = windupTimer > 0 && !isSkill;
    enemyDrawn = drawGridSeqSprite(
      ctx,
      isSkill
        ? '/sprites/executioner/skill1.png'
        : isAttacking
          ? '/sprites/executioner/attacking.png'
          : '/sprites/executioner/idle2.png',
      100,
      100,
      isSkill || isAttacking ? 6 : 4,
      0,
      isSkill ? 12 : isAttacking ? 13 : 8,
      0,
      radius * 0.92,
      radius * 3.8,
      radius * 3.8,
      animT,
      isSkill || isAttacking ? 14 : 9,
      {
        ...baseOpts,
        anchorX: 0.52,
        anchorY: 0.82,
      }
    );
  } else if (kind === 'boss_colossus') {
    // User's Shadowed Wetlands Boss (247x87)
    const isAtk = windupTimer > 0;
    const scaleH = radius * 2.75 / 59;
    enemyDrawn = drawStripSprite(
      ctx,
      isAtk ? '/sprites/wetlands_boss/attack1.png' : '/sprites/wetlands_boss/walk.png',
      247,
      0,
      radius * 0.92,
      247 * scaleH,
      87 * scaleH,
      animT,
      isAtk ? 12 : 10,
      {
        ...baseOpts,
        anchorX: 0.344,
        anchorY: 0.988,
      }
    );
  } else if (kind === 'boss_lich') {
    // User's Necromancer sheet (160x128, 17x7)
    const isAtk = windupTimer > 0;
    enemyDrawn = drawGridSeqSprite(
      ctx,
      '/sprites/necromancer/sheet.png',
      160,
      128,
      17,
      isAtk ? 4 : 1,
      isAtk ? 17 : 8,
      0,
      radius * 0.92,
      radius * 4.4,
      radius * 3.52,
      animT,
      isAtk ? 14 : 9,
      {
        ...baseOpts,
        anchorX: 0.512,
        anchorY: 0.89,
      }
    );
  } else if (kind === 'boss_cerberus') {
    // User's Satyr Demon Lord sheet (32x32, 10x11)
    const isAtk = windupTimer > 0;
    enemyDrawn = drawGridSeqSprite(
      ctx,
      '/sprites/satyr/sheet.png',
      32,
      32,
      10,
      isAtk ? 3 : 1,
      isAtk ? 7 : 8,
      0,
      radius * 0.9,
      radius * 3.8,
      radius * 3.8,
      animT,
      isAtk ? 12 : 10,
      {
        ...baseOpts,
        anchorX: 0.44,
        anchorY: 0.82,
        tintColor: !flash && !frozen ? '#F97316' : baseOpts.tintColor,
        tintAlpha: !flash && !frozen ? 0.22 : 0.48,
      }
    );
  } else if (kind === 'boss_judgement' || kind === 'boss_lucifer') {
    // User's Evil Wizard 2 (250x250)
    if (kind === 'boss_lucifer') {
      ctx.save();
      ctx.scale(1, 0.52);
      ctx.strokeStyle = windupTimer > 0 ? 'rgba(251, 113, 133, 0.9)' : 'rgba(220, 38, 38, 0.65)';
      ctx.lineWidth = 2.4;
      const rot = animT * 0.9;
      const rr = radius * 1.18;
      ctx.beginPath();
      ctx.arc(0, radius * 1.45, rr, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      for (let i = 0; i < 5; i++) {
        const a1 = rot + (i * Math.PI * 4) / 5;
        const a2 = rot + ((i + 1) * Math.PI * 4) / 5;
        const x1 = Math.cos(a1) * rr * 0.88;
        const y1 = radius * 1.45 + Math.sin(a1) * rr * 0.88;
        const x2 = Math.cos(a2) * rr * 0.88;
        const y2 = radius * 1.45 + Math.sin(a2) * rr * 0.88;
        if (i === 0) ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
      }
      ctx.stroke();
      ctx.restore();
    }
    const path =
      windupTimer > 0
        ? kind === 'boss_judgement'
          ? '/sprites/evil_wizard/attack2.png'
          : '/sprites/evil_wizard/attack1.png'
        : '/sprites/evil_wizard/run.png';
    enemyDrawn = drawStripSprite(ctx, path, 250, 0, radius * 0.92, radius * 5.2, radius * 5.2, animT, 10, {
      ...baseOpts,
      anchorX: 0.5,
      anchorY: 0.664,
      tintColor:
        !flash && !frozen
          ? kind === 'boss_lucifer'
            ? '#E11D48'
            : '#A855F7'
          : baseOpts.tintColor,
      tintAlpha: !flash && !frozen ? 0.2 : 0.48,
    });
  } else if (kind === 'boss_bat_king') {
    const arr = windupTimer > 0 ? FRAMES.demonAttack : FRAMES.demonWalk;
    enemyDrawn = drawFrameArraySprite(ctx, arr, 0, radius * 0.92, radius * 4.6, radius * 4.6, animT, 9, {
      ...baseOpts,
      anchorY: 0.68,
      tintColor: !flash && !frozen ? '#9F1239' : baseOpts.tintColor,
      tintAlpha: !flash && !frozen ? 0.25 : 0.48,
    });
  } else if (kind === 'boss_beelzebub') {
    // 64-Monsters Row 7 Col 7 Eldritch Abomination + Orbiting Pixel Flies
    const pulse = 1 + Math.sin(animT * 7) * 0.05;
    enemyDrawn = drawStaticGridCell(
      ctx,
      '/sprites/monsters64/sheet.png',
      32,
      32,
      7,
      7,
      0,
      radius * 0.92,
      radius * 2.55 * pulse,
      radius * 2.55 / pulse,
      baseOpts
    );
    const flySheet = getPixelSpriteSheet('fly_minion');
    if (flySheet && !flash) {
      for (let f = 0; f < 3; f++) {
        const a = animT * 3.6 + (f * Math.PI * 2) / 3;
        const fx = Math.cos(a) * (radius + 12);
        const fy = -radius * 0.35 + Math.sin(a) * (radius * 0.55);
        drawCanvasStripSprite(ctx, flySheet, fx, fy, 18, 16, animT + f * 0.2, 14, {
          anchorX: 0.5,
          anchorY: 0.5,
        });
      }
    }
  } else if (kind === 'miniboss_warden') {
    // User's Hallokin Pumpkin Fire Spirit (192x128, bbox x=49..63, y=56..79)
    const isAtk = windupTimer > 0;
    const scaleH = (radius * 2.5) / 23;
    enemyDrawn = drawStripSprite(
      ctx,
      isAtk ? '/sprites/hallokin/attack.png' : '/sprites/hallokin/run.png',
      192,
      0,
      radius * 0.9,
      192 * scaleH,
      128 * scaleH,
      animT,
      isAtk ? 12 : 8,
      {
        ...baseOpts,
        anchorX: 0.292,
        anchorY: 0.617,
      }
    );
  } else if (kind === 'zealot') {
    // 64-Monsters Row 7 Col 4 Crimson Abyssal Cultist (keeps Crow exclusive to player heroes)
    const hover = Math.sin(animT * 6.5 + id) * 3;
    const tilt = Math.sin(animT * 6.5 + id) * 0.08;
    enemyDrawn = drawStaticGridCell(
      ctx,
      '/sprites/monsters64/sheet.png',
      32,
      32,
      4,
      7,
      0,
      radius * 0.88 - hover,
      radius * 2.7,
      radius * 2.7,
      {
        ...baseOpts,
        rotation: tilt,
        tintColor: windupTimer > 0 && !flash ? '#FB7185' : baseOpts.tintColor,
        tintAlpha: windupTimer > 0 && !flash ? 0.4 : baseOpts.tintAlpha,
      }
    );
  } else if (kind === 'trapper') {
    // User's Executioner Summon Wisp (50x50, 4 frames)
    enemyDrawn = drawStripSprite(
      ctx,
      '/sprites/executioner/summonIdle.png',
      50,
      0,
      radius * 0.78,
      radius * 4.2,
      radius * 4.2,
      animT,
      8,
      {
        ...baseOpts,
        anchorX: 0.5,
        anchorY: 0.76,
        tintColor: !flash && !frozen ? '#C084FC' : baseOpts.tintColor,
        tintAlpha: !flash && !frozen ? 0.35 : 0.48,
      }
    );
  } else if (kind === 'slime') {
    // 64-Monsters Row 5 Cols 2..5 (Slimes & Bio-Oozes) with lively bounce
    const bounce = Math.abs(Math.sin(animT * 6.5 + id));
    const col = 2 + (id % 4);
    enemyDrawn = drawStaticGridCell(
      ctx,
      '/sprites/monsters64/sheet.png',
      32,
      32,
      col,
      5,
      0,
      radius * 0.88 - bounce * 4,
      radius * (2.35 - bounce * 0.16),
      radius * (2.15 + bounce * 0.22),
      baseOpts
    );
  } else if (kind === 'goblin') {
    // 64-Monsters Row 1 Cols 0..3 with lively stride tilt & hop
    const hop = Math.abs(Math.sin(animT * 10 + id)) * 3.5;
    const tilt = Math.sin(animT * 10 + id) * 0.1;
    const col = id % 4;
    enemyDrawn = drawStaticGridCell(
      ctx,
      '/sprites/monsters64/sheet.png',
      32,
      32,
      col,
      1,
      0,
      radius * 0.9 - hop,
      radius * 2.5,
      radius * 2.5,
      { ...baseOpts, rotation: tilt }
    );
  } else if (kind === 'golem') {
    // 64-Monsters Row 0 Heavy Armored Golems
    const cols = [1, 4, 6];
    const stomp = Math.abs(Math.sin(animT * 5.5 + id)) * 2.5;
    const tilt = Math.sin(animT * 5.5 + id) * 0.05;
    enemyDrawn = drawStaticGridCell(
      ctx,
      '/sprites/monsters64/sheet.png',
      32,
      32,
      cols[id % cols.length],
      0,
      0,
      radius * 0.92 - stomp,
      radius * 2.5,
      radius * 2.5,
      { ...baseOpts, rotation: tilt }
    );
  } else if (kind === 'shielder') {
    // 64-Monsters Row 0 Heavy Shield-Mechs
    const cols = [0, 3, 5];
    const stomp = Math.abs(Math.sin(animT * 5 + id)) * 2;
    enemyDrawn = drawStaticGridCell(
      ctx,
      '/sprites/monsters64/sheet.png',
      32,
      32,
      cols[id % cols.length],
      0,
      0,
      radius * 0.92 - stomp,
      radius * 2.6,
      radius * 2.6,
      baseOpts
    );
  } else if (kind === 'bomber') {
    // 64-Monsters Row 7 Volatile Brimstone Mutants
    const cols = [0, 1, 5];
    const pulse = 1 + Math.sin(animT * (windupTimer > 0 ? 24 : 9) + id) * 0.1;
    enemyDrawn = drawStaticGridCell(
      ctx,
      '/sprites/monsters64/sheet.png',
      32,
      32,
      cols[id % cols.length],
      7,
      0,
      radius * 0.9,
      radius * 2.5 * pulse,
      radius * 2.5 * pulse,
      {
        ...baseOpts,
        tintColor: windupTimer > 0 && !flash ? '#FDE047' : baseOpts.tintColor,
        tintAlpha: windupTimer > 0 && !flash ? 0.5 : baseOpts.tintAlpha,
      }
    );
  } else if (kind === 'bat') {
    const sheet = getPixelSpriteSheet('bat');
    if (sheet) {
      drawCanvasStripSprite(ctx, sheet, 0, radius * 0.3, radius * 2.9, radius * 2.2, animT, 12, {
        ...baseOpts,
        anchorX: sheet.anchorX,
        anchorY: sheet.anchorY,
      });
      enemyDrawn = true;
    }
  } else if (kind === 'flower' || kind === 'miniboss_blossom') {
    const sheet = getPixelSpriteSheet(kind === 'miniboss_blossom' ? 'miniboss_blossom' : 'flower');
    if (sheet) {
      drawCanvasStripSprite(ctx, sheet, 0, radius * 0.92, radius * 2.5, radius * 2.65, animT, 6, {
        ...baseOpts,
        anchorX: sheet.anchorX,
        anchorY: sheet.anchorY,
      });
      enemyDrawn = true;
    }
  } else if (kind === 'archer') {
    const sheet = getPixelSpriteSheet('archer');
    if (sheet) {
      drawCanvasStripSprite(ctx, sheet, 0, radius * 0.92, radius * 2.75, radius * 2.9, animT, 7, {
        ...baseOpts,
        anchorX: sheet.anchorX,
        anchorY: sheet.anchorY,
      });
      enemyDrawn = true;
    }
  }

  // Fallback monster silhouette only while external sprite sheet loads
  if (!enemyDrawn) {
    ctx.fillStyle = flash ? '#FFFFFF' : frozen ? '#67E8F9' : isBoss ? '#E11D48' : '#F97316';
    ctx.strokeStyle = '#070A12';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  ctx.restore(); // End scaled + squash-stretched enemy sprite transform

  // Burning % HP Flame Aura
  if (burning && !flash) {
    const fl = 0.65 + Math.sin(nowMs * 0.025 + phaseAngle) * 0.3;
    ctx.strokeStyle = `rgba(249, 115, 22, ${fl.toFixed(2)})`;
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.arc(0, 0, radius + 4, 0, Math.PI * 2);
    ctx.stroke();
    ctx.imageSmoothingEnabled = false;
    drawFrameArraySprite(ctx, FRAMES.expFlame, 0, 2, radius * 2.1, radius * 2.1, animT, 12, {
      anchorX: 0.5,
      anchorY: 0.65,
      alpha: 0.55,
    });
  }

  // Wind-Mark Gale Ring
  if (windMarked && !flash) {
    ctx.strokeStyle = 'rgba(52, 211, 153, 0.85)';
    ctx.lineWidth = 1.8;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.arc(0, 0, radius + 6, nowMs * 0.008, nowMs * 0.008 + Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // Frozen ice crystal sheen OR Deep Solid Ice Prison
  if (hardFrozen && !flash) {
    ctx.fillStyle = 'rgba(103, 232, 249, 0.34)';
    ctx.strokeStyle = '#ECFEFF';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(0, -radius - 6);
    ctx.lineTo(radius + 5, -radius * 0.2);
    ctx.lineTo(radius + 3, radius + 4);
    ctx.lineTo(-radius - 3, radius + 4);
    ctx.lineTo(-radius - 5, -radius * 0.2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else if (frozen && !flash) {
    ctx.strokeStyle = 'rgba(103, 232, 249, 0.8)';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.arc(0, 0, radius + 2, 0, Math.PI * 2);
    ctx.stroke();
  }

  if (chronoFrozen && !flash) {
    ctx.strokeStyle = 'rgba(103, 232, 249, 0.78)';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.ellipse(0, radius * 0.6, radius + 4, (radius + 4) * 0.45, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Small frozen clock sigil above enemy
    const cy = -radius - 10;
    ctx.fillStyle = 'rgba(8, 22, 36, 0.78)';
    ctx.strokeStyle = '#67E8F9';
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.arc(0, cy, 5.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = '#FDE047';
    ctx.beginPath();
    ctx.moveTo(0, cy);
    ctx.lineTo(0, cy - 3.6);
    ctx.moveTo(0, cy);
    ctx.lineTo(3, cy);
    ctx.stroke();
  }

  // Hellfire (Demon Lord orange-black abyssal burn)
  if (hellfireStacks > 0 && !flash) {
    const fl = 0.65 + Math.sin(nowMs * 0.028 + phaseAngle) * 0.25;
    ctx.strokeStyle = `rgba(249, 115, 22, ${fl.toFixed(2)})`;
    ctx.lineWidth = 2.8;
    ctx.beginPath();
    ctx.arc(0, 0, radius + 5, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.arc(0, 0, radius + 7, nowMs * 0.005, nowMs * 0.005 + Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    // Rising black-orange cinders
    for (let k = 0; k < Math.min(3, hellfireStacks); k++) {
      const ph = ((nowMs * 0.003 + k * 0.33 + phaseAngle) % 1);
      ctx.fillStyle = k % 2 === 0 ? '#FB923C' : '#09090B';
      ctx.fillRect((k - 1) * 7, -radius * 0.5 - ph * 16, 3.5, 4.5);
    }
  }

  // Vampire Bleed stacks (dripping crimson blood marks)
  if (bleedStacks > 0 && !flash) {
    for (let bl = 0; bl < Math.min(3, bleedStacks); bl++) {
      const bx = (bl - (Math.min(3, bleedStacks) - 1) * 0.5) * 6.5;
      const drop = ((nowMs * 0.004 + bl * 0.4) % 1) * 9;
      ctx.fillStyle = '#E11D48';
      ctx.beginPath();
      ctx.arc(bx, -radius * 0.2 + drop, 2.3, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Lust Charmed Aura (pink/violet ring + floating heart)
  if (charmed && !flash) {
    ctx.strokeStyle = 'rgba(236, 72, 153, 0.9)';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.arc(0, 0, radius + 6, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = '#F472B6';
    const hy = -radius - 12 + Math.sin(nowMs * 0.008) * 2.5;
    ctx.beginPath();
    ctx.arc(-2.5, hy, 2.6, 0, Math.PI * 2);
    ctx.arc(2.5, hy, 2.6, 0, Math.PI * 2);
    ctx.lineTo(0, hy + 5.5);
    ctx.closePath();
    ctx.fill();
  }

  // Wet / Shock / Confused Auras
  if (statuses?.wet && statuses.wet.timer > 0 && !flash) {
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.78)';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.arc(0, 0, radius + 3, 0, Math.PI * 2);
    ctx.stroke();
  }
  if (statuses?.shock && statuses.shock.timer > 0 && !flash) {
    ctx.strokeStyle = '#FACC15';
    ctx.lineWidth = 2;
    const j = Math.sin(nowMs * 0.04 + id) * 3;
    ctx.beginPath();
    ctx.moveTo(-radius - 2, -4 + j);
    ctx.lineTo(-radius * 0.4, -radius - 4);
    ctx.lineTo(radius * 0.3, -radius + 2 - j);
    ctx.lineTo(radius + 3, -3 + j);
    ctx.stroke();
  }
  if (confused && !flash) {
    ctx.strokeStyle = '#C084FC';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.arc(0, -radius - 6, 5.5, nowMs * 0.01, nowMs * 0.01 + Math.PI * 1.45);
    ctx.stroke();
  }

  // Moonshadow Hunter Hunt Marks (1..5 emerald ticks above head)
  if (huntMarks > 0) {
    const marks = Math.min(5, Math.floor(huntMarks));
    const totalW = marks * 5 - 1.5;
    const markY = -radius * 1.45 - 8;
    for (let m = 0; m < marks; m++) {
      const mx = -totalW / 2 + m * 5;
      ctx.fillStyle = marks >= 3 ? '#34D399' : '#6EE7B7';
      ctx.strokeStyle = '#064E3B';
      ctx.lineWidth = 1;
      ctx.fillRect(mx, markY, 3.5, 9);
      ctx.strokeRect(mx, markY, 3.5, 9);
    }
  }

  // Unified Part-1 Status Icons Row above enemy sprite (below boss bar if boss)
  if (statuses) {
    const activeStatuses: { id: EnemyStatusId; color: string; label: string; stacks: number }[] = [];
    if (statuses.burn && statuses.burn.timer > 0) activeStatuses.push({ id: 'burn', color: '#F97316', label: '🔥', stacks: statuses.burn.stacks });
    if (statuses.wet && statuses.wet.timer > 0) activeStatuses.push({ id: 'wet', color: '#38BDF8', label: '💧', stacks: statuses.wet.stacks });
    if (statuses.frozen && statuses.frozen.timer > 0) activeStatuses.push({ id: 'frozen', color: '#67E8F9', label: '❄', stacks: statuses.frozen.stacks });
    if (statuses.shock && statuses.shock.timer > 0) activeStatuses.push({ id: 'shock', color: '#FACC15', label: '⚡', stacks: statuses.shock.stacks });
    if (statuses.bleed && statuses.bleed.timer > 0) activeStatuses.push({ id: 'bleed', color: '#E11D48', label: '🩸', stacks: statuses.bleed.stacks });
    if (statuses.mark && statuses.mark.timer > 0) activeStatuses.push({ id: 'mark', color: '#34D399', label: '🎯', stacks: statuses.mark.stacks });

    if (activeStatuses.length > 0) {
      const iconGap = 11;
      const startX = -((activeStatuses.length - 1) * iconGap) * 0.5;
      const statusY = isBoss ? -radius * 1.95 - 24 : -radius - 11 - (huntMarks > 0 ? 11 : 0);
      for (let s = 0; s < activeStatuses.length; s++) {
        const st = activeStatuses[s];
        const sx = startX + s * iconGap;
        ctx.fillStyle = 'rgba(7, 10, 18, 0.85)';
        ctx.strokeStyle = st.color;
        ctx.lineWidth = 1.3;
        ctx.beginPath();
        ctx.arc(sx, statusY, 4.6, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = st.color;
        ctx.beginPath();
        ctx.arc(sx, statusY, 2.2, 0, Math.PI * 2);
        ctx.fill();

        if (st.stacks > 1) {
          ctx.font = '700 7px monospace';
          ctx.textAlign = 'center';
          ctx.fillStyle = '#FFFFFF';
          ctx.fillText(String(st.stacks), sx, statusY - 6);
        }
      }
    }
  }

  // Hunter v2 Emerald Mark reticle (when marked even without statuses.mark)
  if (emeraldMarked) {
    const pulse = 1 + Math.sin(nowMs * 0.014) * 0.12;
    ctx.strokeStyle = '#34D399';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, -radius - 19 * pulse);
    ctx.lineTo(4.5, -radius - 14.5);
    ctx.lineTo(0, -radius - 10);
    ctx.lineTo(-4.5, -radius - 14.5);
    ctx.closePath();
    ctx.stroke();
  }

  // Knight Parried knockdown spinning golden pixel stars overhead
  if (parriedStunTimer > 0) {
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    for (let ps = 0; ps < 3; ps++) {
      const pa = nowMs * 0.011 + (ps * Math.PI * 2) / 3;
      const sx = Math.round(Math.cos(pa) * (radius * 0.65));
      const sy = Math.round(-radius - 11 + Math.sin(pa) * 3.5);
      ctx.fillStyle = '#ffd75e';
      ctx.fillRect(sx - 2, sy - 2, 4, 4);
      ctx.fillStyle = '#fffbe0';
      ctx.fillRect(sx - 1, sy - 1, 2, 2);
    }
    ctx.restore();
  }

  // Knight Taunt bouncy red "!" (0.5s) & faint golden Judgement cross ("ถูกพิพากษา")
  if (knightTauntBangTimer > 0) {
    const bangProg = Math.max(0, Math.min(1, 1 - knightTauntBangTimer / 0.5));
    const bounceY = Math.round(-Math.abs(Math.sin(bangProg * Math.PI * 2.5)) * 7);
    const by = -radius - 26 + bounceY;
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = '#09090B';
    ctx.fillRect(-3, by - 1, 6, 10);
    ctx.fillRect(-3, by + 11, 6, 5);
    ctx.fillStyle = '#EF4444';
    ctx.fillRect(-2, by, 4, 8);
    ctx.fillRect(-2, by + 12, 4, 3);
    ctx.restore();
  }

  if (judgementActive) {
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    ctx.globalAlpha = 0.68;
    const cy = -radius - 16;
    ctx.fillStyle = '#ffd75e';
    ctx.fillRect(-1, cy - 6, 2, 12);
    ctx.fillRect(-4, cy - 3, 8, 2);
    ctx.fillStyle = '#fffbe0';
    ctx.fillRect(-1, cy - 3, 2, 2);
    ctx.restore();
  }

  // Elite Damage-Type Resistance Shield Badge
  if (eliteResistType && !isBoss) {
    const badgeColor =
      eliteResistType === 'physical'
        ? '#F8FAFC'
        : eliteResistType === 'magic'
          ? '#93C5FD'
          : '#FDBA74';
    const by = -radius - 18;
    ctx.fillStyle = 'rgba(9, 9, 11, 0.85)';
    ctx.strokeStyle = badgeColor;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(-5, by - 5);
    ctx.lineTo(5, by - 5);
    ctx.lineTo(5, by + 1);
    ctx.lineTo(0, by + 6);
    ctx.lineTo(-5, by + 1);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  // Boss HP & Stagger Bars above sprite
  if (isBoss) {
    const bw = radius * 2.2;
    const barY = -radius * 1.95 - 12;
    const ratio = Math.max(0, hp / maxHp);
    ctx.fillStyle = 'rgba(0,0,0,0.82)';
    ctx.fillRect(-bw / 2, barY, bw, 6);
    ctx.fillStyle = e.isReaper ? '#F43F5E' : '#F59E0B';
    ctx.fillRect(-bw / 2, barY, bw * ratio, 6);

    if (maxStagger > 0) {
      const stagRatio = staggered ? 1 : Math.max(0, Math.min(1, stagger / maxStagger));
      ctx.fillStyle = 'rgba(0,0,0,0.75)';
      ctx.fillRect(-bw / 2, barY + 7, bw, 3.5);
      ctx.fillStyle = staggered ? '#FEF08A' : '#FBBF24';
      ctx.fillRect(-bw / 2, barY + 7, bw * stagRatio, 3.5);
    }

    if (staggered) {
      for (let s = 0; s < 3; s++) {
        const sa = nowMs * 0.008 + (s * Math.PI * 2) / 3;
        const sx = Math.cos(sa) * (radius * 0.65);
        const sy = barY - 8 + Math.sin(sa) * 4;
        ctx.fillStyle = '#FDE047';
        ctx.beginPath();
        ctx.arc(sx, sy, 3.2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  ctx.restore();
}

export function drawProjectileSprite(
  ctx: CanvasRenderingContext2D,
  weaponId: WeaponId,
  x: number,
  y: number,
  radius: number,
  rotation: number,
  evolved: boolean,
  color: string,
  customKind?: 'arrow' | 'claw' | 'feather' | 'sword_wave' | 'fire_skull' | 'mini_banana' | 'prism_beam' | 'ice_shard' | 'canned_fish' | 'shadow_knife',
  vfxKey?: PackVfxKey,
  vfxTint?: string,
  elapsedSec?: number
): void {
  const animT = performance.now() * 0.001;
  const projTime = elapsedSec ?? animT;
  ctx.save();
  ctx.translate(x, y);
  ctx.imageSmoothingEnabled = false;

  if (evolved && color) {
    ctx.fillStyle = `${color}38`;
    ctx.beginPath();
    ctx.arc(0, 0, radius * 1.45, 0, Math.PI * 2);
    ctx.fill();
  }

  // Explicit custom VFX pack key (Mage fusion projectiles, Spellblade waves, etc.)
  if (vfxKey && PACK_VFX[vfxKey]) {
    const meta = PACK_VFX[vfxKey];
    const isBoulderSpin =
      vfxKey === 'spell_stone_dark' || vfxKey === 'spell_stone_blood' || vfxKey === 'spell_stone_stone';
    const isBatFlip = vfxKey === 'spell_dark_blood';
    const angle = isBoulderSpin
      ? animT * 8
      : meta.rotateToVelocity
        ? rotation
        : 0;
    const baseScale = Math.max(1.15, (radius * 2.5) / Math.min(meta.w, meta.h));
    const clampedScale = customKind === 'sword_wave' ? Math.max(1.25, (radius * 2.4) / meta.w) : Math.min(2.6, baseScale);
    const drewExplicit = drawPackVfx(ctx, vfxKey, 0, 0, projTime, {
      scale: clampedScale,
      angle,
      flipX: isBatFlip ? Math.cos(rotation) < 0 : false,
      tintColor: vfxTint,
      tintAlpha: vfxTint ? 0.52 : undefined,
    });
    if (drewExplicit) {
      ctx.restore();
      return;
    }
  }

  if (customKind === 'shadow_knife') {
    const drewKnife = drawPackVfx(ctx, 'hunter_shadow_dagger', 0, 0, projTime, {
      scale: Math.max(1.8, (radius * 2.2) / 16),
      angle: rotation,
    });
    if (!drewKnife) {
      ctx.rotate(rotation);
      const bladeGrad = ctx.createLinearGradient(-radius * 1.8, 0, radius * 1.8, 0);
      bladeGrad.addColorStop(0, '#6B21A8');
      bladeGrad.addColorStop(0.55, '#C084FC');
      bladeGrad.addColorStop(1, '#F8FAFC');
      ctx.fillStyle = bladeGrad;
      ctx.strokeStyle = '#E879F9';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(radius * 1.9, 0);
      ctx.lineTo(-radius * 0.3, -radius * 0.55);
      ctx.lineTo(-radius * 1.4, 0);
      ctx.lineTo(-radius * 0.3, radius * 0.55);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
  } else if (customKind === 'sword_wave') {
    const ok = drawFrameArraySprite(ctx, FRAMES.poisonSlash, 0, 0, radius * 3.0, radius * 2.4, animT, 18, {
      anchorX: 0.5,
      anchorY: 0.5,
      rotation,
      tintColor: color,
      tintAlpha: 0.45,
    });
    if (!ok) {
      ctx.rotate(rotation);
      ctx.strokeStyle = color;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(0, 0, radius, -0.9, 0.9);
      ctx.stroke();
    }
  } else if (customKind === 'arrow') {
    // Glowing Emerald Moonshadow Arrow with radiant tail
    ctx.save();
    ctx.rotate(rotation);
    const trailGrad = ctx.createLinearGradient(-radius * 2.6, 0, radius, 0);
    trailGrad.addColorStop(0, 'rgba(16, 185, 129, 0)');
    trailGrad.addColorStop(1, 'rgba(110, 231, 183, 0.72)');
    ctx.fillStyle = trailGrad;
    ctx.beginPath();
    ctx.moveTo(-radius * 2.6, 0);
    ctx.lineTo(radius * 0.6, -radius * 0.45);
    ctx.lineTo(radius * 0.6, radius * 0.45);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    const ok = drawSingleImg(ctx, '/craftpix/fx/arrows/10.png', 0, 0, radius * 3.4, radius * 1.65, {
      anchorX: 0.5,
      anchorY: 0.5,
      rotation,
      tintColor: '#34D399',
      tintAlpha: 0.45,
    });
    if (!ok) {
      ctx.rotate(rotation);
      ctx.strokeStyle = '#6EE7B7';
      ctx.lineWidth = 3.6;
      ctx.beginPath();
      ctx.moveTo(-radius * 1.4, 0);
      ctx.lineTo(radius * 1.2, 0);
      ctx.stroke();
    }
  } else if (customKind === 'claw') {
    drawFrameArraySprite(ctx, FRAMES.fireSlash, 0, 0, radius * 2.8, radius * 2.2, animT, 20, {
      anchorX: 0.5,
      anchorY: 0.5,
      rotation,
      tintColor: '#FB923C',
      tintAlpha: 0.38,
    });
  } else if (customKind === 'feather') {
    const sheet = getPixelSpriteSheet('px_feather');
    if (sheet) {
      drawCanvasStripSprite(ctx, sheet, 0, 0, radius * 2.4, radius * 1.4, animT, 1, {
        anchorX: 0.5,
        anchorY: 0.5,
        rotation,
      });
    }
  } else if (customKind === 'fire_skull') {
    ctx.fillStyle = '#F97316';
    ctx.strokeStyle = '#FEF08A';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.95, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#0F172A';
    ctx.beginPath();
    ctx.arc(-radius * 0.3, -radius * 0.1, radius * 0.22, 0, Math.PI * 2);
    ctx.arc(radius * 0.3, -radius * 0.1, radius * 0.22, 0, Math.PI * 2);
    ctx.fill();
  } else if (customKind === 'mini_banana') {
    const drewMini = drawPackVfx(ctx, 'banana', 0, 0, projTime, {
      scale: Math.max(1.2, (radius * 2) / 24),
      angle: rotation,
    });
    if (!drewMini) {
      ctx.rotate(rotation);
      ctx.fillStyle = '#FACC15';
      ctx.strokeStyle = '#92400E';
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      ctx.arc(0, 0, radius * 0.9, -0.4, Math.PI + 0.4);
      ctx.fill();
      ctx.stroke();
    }
  } else if (customKind === 'prism_beam') {
    ctx.rotate(rotation);
    ctx.fillStyle = color;
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 1.4;
    ctx.fillRect(-radius * 1.5, -radius * 0.35, radius * 3.0, radius * 0.7);
    ctx.strokeRect(-radius * 1.5, -radius * 0.35, radius * 3.0, radius * 0.7);
  } else if (customKind === 'ice_shard') {
    const drewIce = drawPackVfx(ctx, 'frost_flake', 0, 0, projTime, {
      scale: Math.max(1.5, (radius * 2.2) / 16),
      angle: rotation,
    });
    if (!drewIce) {
      ctx.rotate(rotation);
      ctx.fillStyle = '#67E8F9';
      ctx.strokeStyle = '#ECFEFF';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(radius * 1.2, 0);
      ctx.lineTo(-radius * 0.6, -radius * 0.5);
      ctx.lineTo(-radius * 1.0, 0);
      ctx.lineTo(-radius * 0.6, radius * 0.5);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
  } else if (customKind === 'canned_fish') {
    ctx.rotate(rotation);
    ctx.fillStyle = '#F59E0B';
    ctx.strokeStyle = '#FEF3C7';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.roundRect(-radius * 0.8, -radius * 0.55, radius * 1.6, radius * 1.1, 3);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#38BDF8';
    ctx.fillRect(-radius * 0.5, -radius * 0.2, radius, radius * 0.4);
  } else if (weaponId === 'banana') {
    const drew = drawPackVfx(ctx, evolved ? 'banana_evo' : 'banana', 0, 0, projTime, {
      scale: Math.max(1.6, (radius * 2.4) / 24),
      angle: rotation,
    });
    if (!drew) {
      const sheet = getPixelSpriteSheet('px_banana');
      if (sheet) {
        drawCanvasStripSprite(ctx, sheet, 0, 0, radius * 2.3, radius * 2.3, animT, 1, {
          anchorX: 0.5,
          anchorY: 0.5,
          rotation,
          tintColor: evolved ? '#F97316' : undefined,
          tintAlpha: 0.35,
        });
      }
    }
  } else if (weaponId === 'axe') {
    const key: PackVfxKey = evolved ? 'axe_evo' : 'axe';
    const drew = drawPackVfx(ctx, key, 0, 0, projTime, {
      scale: Math.max(1.4, (radius * 2.4) / PACK_VFX[key].w),
      angle: rotation,
    });
    if (!drew) {
      const sheet = getPixelSpriteSheet('px_axe');
      if (sheet) {
        drawCanvasStripSprite(ctx, sheet, 0, 0, radius * 2.5, radius * 2.5, animT, 1, {
          anchorX: 0.5,
          anchorY: 0.5,
          rotation,
          tintColor: evolved ? '#F43F5E' : undefined,
          tintAlpha: 0.42,
        });
      }
    }
  } else if (weaponId === 'dagger') {
    const key: PackVfxKey = evolved ? 'dagger_evo' : 'dagger';
    const drew = drawPackVfx(ctx, key, 0, 0, projTime, {
      scale: Math.max(1.5, (radius * 2.8) / PACK_VFX[key].w),
      angle: rotation,
    });
    if (!drew) {
      const sheet = getPixelSpriteSheet('px_dagger');
      if (sheet) {
        drawCanvasStripSprite(ctx, sheet, 0, 0, radius * 2.6, radius * 1.5, animT, 1, {
          anchorX: 0.5,
          anchorY: 0.5,
          rotation,
          tintColor: evolved ? '#38BDF8' : undefined,
          tintAlpha: 0.35,
        });
      }
    }
  } else if (weaponId === 'katana') {
    const key: PackVfxKey = evolved ? 'katana_evo' : 'katana';
    const drew = drawPackVfx(ctx, key, 0, 0, projTime, {
      scale: Math.max(1.2, (radius * 2.5) / 64),
      angle: rotation,
    });
    if (!drew) {
      drawFrameArraySprite(
        ctx,
        evolved ? FRAMES.fireSlash : FRAMES.lightningSlash,
        0,
        0,
        radius * 2.8,
        radius * 2.2,
        animT,
        18,
        {
          anchorX: 0.5,
          anchorY: 0.5,
          rotation,
          tintColor: evolved ? '#F43F5E' : '#38BDF8',
          tintAlpha: 0.35,
        }
      );
    }
  } else if (weaponId === 'spear') {
    const key: PackVfxKey = evolved ? 'spear_evo' : 'spear';
    const drew = drawPackVfx(ctx, key, 0, 0, projTime, {
      scale: Math.max(1.3, (radius * 4.2) / PACK_VFX[key].w),
      angle: rotation,
    });
    if (!drew) {
      const sheet = getPixelSpriteSheet('px_spear');
      if (sheet) {
        drawCanvasStripSprite(ctx, sheet, 0, 0, radius * 3.0, radius * 1.5, animT, 1, {
          anchorX: 0.5,
          anchorY: 0.5,
          rotation,
          tintColor: evolved ? '#FACC15' : undefined,
          tintAlpha: 0.35,
        });
      }
    }
  } else if (weaponId === 'frostnova') {
    const key: PackVfxKey = evolved ? 'frost_flake_evo' : 'frost_flake';
    const drew = drawPackVfx(ctx, key, 0, 0, projTime, {
      scale: Math.max(1.5, (radius * 2.3) / PACK_VFX[key].w),
      angle: rotation + animT * 4,
    });
    if (!drew) {
      drawFrameArraySprite(ctx, FRAMES.expBlue, 0, 0, radius * 2.4, radius * 2.4, animT, 12, {
        anchorX: 0.5,
        anchorY: 0.5,
        rotation,
        tintColor: '#67E8F9',
        tintAlpha: 0.55,
      });
    }
  } else if (weaponId === 'meteor') {
    const key: PackVfxKey = evolved ? 'meteor_evo' : 'meteor';
    const drew = drawPackVfx(ctx, key, 0, 0, projTime, {
      scale: Math.max(1.5, (radius * 2.6) / PACK_VFX[key].w),
    });
    if (!drew) {
      drawFrameArraySprite(ctx, FRAMES.expFlame, 0, 0, radius * 2.6, radius * 2.6, animT, 12, {
        anchorX: 0.5,
        anchorY: 0.5,
        rotation,
      });
    }
  } else if (weaponId === 'cat') {
    const drew = drawPackVfx(ctx, evolved ? 'cat_evo' : 'cat', 0, 0, projTime, {
      scale: Math.max(1.6, (radius * 2.6) / 24),
      flipX: Math.cos(rotation) < 0,
    });
    if (!drew) {
      drawDir3StripSprite(
        ctx,
        '/craftpix/enemies/td_enemy1',
        'Run.png',
        96,
        -1,
        Math.cos(rotation),
        Math.sin(rotation),
        0,
        0,
        radius * 3.4,
        radius * 3.4,
        animT,
        14,
        {
          anchorX: 0.5,
          anchorY: 0.65,
          tintColor: evolved ? '#F59E0B' : '#FB923C',
          tintAlpha: 0.38,
        }
      );
    }
  } else if (weaponId === 'bird') {
    const drew = drawPackVfx(ctx, evolved ? 'bird_evo' : 'bird', 0, 0, projTime, {
      scale: Math.max(1.6, (radius * 2.6) / 24),
      angle: rotation,
    });
    if (!drew) {
      const sheet = getPixelSpriteSheet('px_bird');
      if (sheet) {
        drawCanvasStripSprite(ctx, sheet, 0, 0, radius * 2.3, radius * 2.0, animT, 1, {
          anchorX: 0.5,
          anchorY: 0.5,
          rotation,
          tintColor: evolved ? '#FACC15' : undefined,
          tintAlpha: 0.35,
        });
      }
    }
  } else if (weaponId === 'watergun') {
    const key: PackVfxKey = evolved ? 'water_bolt_evo' : 'water_bolt';
    const drew = drawPackVfx(ctx, key, 0, 0, projTime, {
      scale: Math.max(1.6, (radius * 2.8) / PACK_VFX[key].w),
      angle: rotation,
    });
    if (!drew) {
      const sheet = getPixelSpriteSheet('px_watergun');
      if (sheet) {
        drawCanvasStripSprite(ctx, sheet, 0, 0, radius * 2.4, radius * 1.6, animT, 1, {
          anchorX: 0.5,
          anchorY: 0.5,
          rotation,
          tintColor: evolved ? '#22D3EE' : undefined,
          tintAlpha: 0.3,
        });
      }
    }
  } else if (weaponId === 'wand') {
    const key: PackVfxKey = evolved ? 'wand_missile_evo' : 'wand_missile';
    const drew = drawPackVfx(ctx, key, 0, 0, projTime, {
      scale: Math.max(1.4, (radius * 2.6) / PACK_VFX[key].w),
      angle: rotation,
    });
    if (!drew) {
      drawFrameArraySprite(ctx, FRAMES.expFlame, 0, 0, radius * 2.1, radius * 2.1, animT, 14, {
        anchorX: 0.5,
        anchorY: 0.5,
        rotation,
        tintColor: color,
        tintAlpha: 0.55,
      });
    }
  } else {
    drawFrameArraySprite(ctx, FRAMES.expFlame, 0, 0, radius * 2.1, radius * 2.1, animT, 14, {
      anchorX: 0.5,
      anchorY: 0.5,
      rotation,
      tintColor: color,
      tintAlpha: 0.55,
    });
  }

  ctx.restore();
}

export function drawGroundFxSprite(
  ctx: CanvasRenderingContext2D,
  kind: 'lightning' | 'shockwave' | 'explosion' | 'warp' | 'beam' | 'slash_arc' | 'grand_slash' | 'vfx',
  x: number,
  y: number,
  radius: number,
  maxRadius: number,
  progress: number,
  color: string,
  x2?: number,
  y2?: number,
  angle?: number,
  vfxId?: VfxId,
  dw?: number,
  dh?: number,
  vfxKey?: PackVfxKey,
  loopFps = 0,
  elapsedSec?: number
): void {
  const alpha = Math.max(0, 1 - progress);
  ctx.save();
  ctx.imageSmoothingEnabled = false;

  if (kind === 'vfx' && vfxId) {
    const meta = VFX_SHEETS[vfxId];
    const baseW = dw ?? Math.max(64, maxRadius * 2.1);
    const w = baseW;
    const h = dh ?? Math.round(baseW * (meta.cellH / meta.cellW));
    const anchorY =
      vfxId === 'holy_pillar'
        ? 0.84
        : vfxId === 'holy_smite'
          ? 0.74
          : vfxId === 'ground_slam'
            ? 0.62
            : 0.5;
    const animArg = loopFps > 0 ? (elapsedSec ?? progress) : progress;
    const fadeAlpha =
      loopFps > 0
        ? Math.min(1, alpha * 2.4)
        : vfxId === 'holy_sigil'
          ? Math.min(1, alpha * 1.75)
          : Math.min(1, alpha * 1.45);
    drawVfxSheet(ctx, vfxId, x, y, w, h, animArg, loopFps, {
      rotation: angle ?? 0,
      anchorY,
      alpha: fadeAlpha,
      smooth: true,
    });
  } else if (kind === 'beam' && x2 !== undefined && y2 !== undefined) {
    const beamElapsed = progress * 0.45;
    const drewTiled = vfxKey
      ? drawPackVfxTiledBeam(ctx, vfxKey, x, y, x2, y2, beamElapsed, Math.max(16, radius * 1.25), alpha)
      : false;
    if (!drewTiled) {
      ctx.globalAlpha = alpha;
      ctx.lineCap = 'round';
      ctx.strokeStyle = `${color}55`;
      ctx.lineWidth = Math.max(12, radius * 2.2);
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x2, y2);
      ctx.stroke();

      ctx.strokeStyle = color;
      ctx.lineWidth = Math.max(6, radius * 1.25);
      ctx.stroke();

      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = Math.max(2, radius * 0.45);
      ctx.stroke();

      drawFrameArraySprite(ctx, FRAMES.expBlue, x2, y2, Math.max(24, radius * 3.5), Math.max(24, radius * 3.5), progress, 0, {
        anchorX: 0.5,
        anchorY: 0.5,
        tintColor: color,
        tintAlpha: 0.45,
      });
    }
  } else if (kind === 'slash_arc' && angle !== undefined) {
    const isShadow =
      color === '#C084FC' || color === '#A855F7' || color === '#818CF8' || color === '#9333EA';
    const isHoly =
      color === '#FDE047' || color === '#E0F2FE' || color === '#FFFFFF' || color === '#ffd75e';
    if (isHoly || isShadow) {
      const slashVfx: VfxId = isShadow ? 'shadow_slash' : 'holy_slash';
      const meta = VFX_SHEETS[slashVfx];
      const sw = Math.max(88, maxRadius * 2.35);
      const sh = sw * (meta.cellH / meta.cellW);
      drawVfxSheet(ctx, slashVfx, x, y, sw, sh, progress, 0, {
        rotation: angle,
        alpha: Math.min(1, alpha * 1.3),
        smooth: true,
      });
    } else {
      ctx.globalAlpha = alpha * 0.95;
      drawFrameArraySprite(
        ctx,
        FRAMES.lightningSlash,
        x,
        y,
        maxRadius * 2.2,
        maxRadius * 1.8,
        progress,
        0,
        {
          anchorX: 0.5,
          anchorY: 0.5,
          rotation: angle,
          tintColor: color,
          tintAlpha: 0.42,
        }
      );
    }
  } else if (kind === 'grand_slash') {
    const isVoidless = color === '#FFFFFF' || color === '#E0F2FE';
    const slashFrames = isVoidless
      ? FRAMES.fireSlash
      : color === '#FB7185' || color === '#F97316'
        ? FRAMES.fireSlash
        : FRAMES.lightningSlash;
    ctx.globalAlpha = alpha * 0.96;
    drawFrameArraySprite(
      ctx,
      slashFrames,
      x,
      y,
      maxRadius * 2.35,
      maxRadius * 2.1,
      progress,
      0,
      {
        anchorX: 0.5,
        anchorY: 0.5,
        rotation: angle ?? progress * Math.PI * 1.5,
        tintColor: color,
        tintAlpha: 0.3,
      }
    );
  } else if (kind === 'explosion') {
    ctx.globalAlpha = alpha;
    drawFrameArraySprite(ctx, FRAMES.expFire, x, y, maxRadius * 2.2, maxRadius * 2.2, progress, 0, {
      anchorX: 0.5,
      anchorY: 0.5,
    });
    drawFrameArraySprite(ctx, FRAMES.expCircle, x, y, maxRadius * 1.8, maxRadius * 1.8, progress, 0, {
      anchorX: 0.5,
      anchorY: 0.5,
      alpha: 0.65,
    });
  } else if (kind === 'warp') {
    ctx.globalAlpha = alpha;
    drawFrameArraySprite(ctx, FRAMES.expBlue, x, y, maxRadius * 2.1, maxRadius * 2.1, progress, 0, {
      anchorX: 0.5,
      anchorY: 0.5,
      tintColor: color,
      tintAlpha: 0.35,
    });
  } else if (kind === 'lightning') {
    const sy = y * ISO_TILT;
    ctx.globalAlpha = alpha;
    ctx.save();
    ctx.translate(x, sy);
    ctx.scale(1, ISO_TILT);
    drawFrameArraySprite(ctx, FRAMES.expBlue, 0, 0, maxRadius * 2.1, maxRadius * 2.1, progress, 0, {
      anchorX: 0.5,
      anchorY: 0.5,
      tintColor: color,
      tintAlpha: 0.4,
    });
    ctx.restore();
    drawFrameArraySprite(ctx, FRAMES.lightningSlash, x, sy - 20, maxRadius * 1.7, maxRadius * 2.3, progress, 0, {
      anchorX: 0.5,
      anchorY: 0.7,
      rotation: Math.PI / 2,
      tintColor: color,
      tintAlpha: 0.45,
    });
    ctx.strokeStyle = color;
    ctx.lineWidth = 4.5;
    ctx.beginPath();
    ctx.moveTo(x - 14, sy - 220);
    ctx.lineTo(x + 10, sy - 140);
    ctx.lineTo(x - 12, sy - 75);
    ctx.lineTo(x, sy);
    ctx.stroke();
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 1.8;
    ctx.stroke();
  } else {
    ctx.globalAlpha = alpha * 0.92;
    drawFrameArraySprite(ctx, FRAMES.expTwoColor, x, y, maxRadius * 2.1, maxRadius * 2.1, progress, 0, {
      anchorX: 0.5,
      anchorY: 0.5,
      tintColor: color,
      tintAlpha: 0.42,
    });
  }

  ctx.restore();
}

export function drawChronoWell(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  lifeRatio: number,
  nowMs: number,
  frozenCount: number,
  globalStopped = false
): void {
  const sy = y * ISO_TILT;
  const pulse = 1 + Math.sin(nowMs * 0.005) * 0.02;
  const fade = Math.min(1, Math.max(0.2, lifeRatio * 3.5));
  const spin = globalStopped ? 0 : nowMs * 0.001;

  ctx.save();
  ctx.translate(x, sy);
  ctx.scale(1, ISO_TILT);

  // 1. Deep temporal clock-face base disc on the ground
  const grad = ctx.createRadialGradient(0, 0, radius * 0.08, 0, 0, radius * pulse);
  grad.addColorStop(0, `rgba(14, 34, 62, ${(0.42 * fade).toFixed(3)})`);
  grad.addColorStop(0.58, `rgba(22, 78, 99, ${(0.24 * fade).toFixed(3)})`);
  grad.addColorStop(0.88, `rgba(34, 211, 238, ${(0.2 * fade).toFixed(3)})`);
  grad.addColorStop(0.96, `rgba(253, 224, 71, ${(0.28 * fade).toFixed(3)})`);
  grad.addColorStop(1, 'rgba(34, 211, 238, 0)');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(0, 0, radius * pulse, 0, Math.PI * 2);
  ctx.fill();

  // 2. Sweeping chronometer radar wedge behind the second hand
  const secAngle = -Math.PI / 2 + spin * 2.1;
  const sweepSpan = 0.62;
  const sweepGrad = ctx.createRadialGradient(0, 0, radius * 0.1, 0, 0, radius * 0.94);
  sweepGrad.addColorStop(0, `rgba(103, 232, 249, ${(0.05 * fade).toFixed(3)})`);
  sweepGrad.addColorStop(0.75, `rgba(34, 211, 238, ${(0.18 * fade).toFixed(3)})`);
  sweepGrad.addColorStop(1, `rgba(253, 224, 71, ${(0.12 * fade).toFixed(3)})`);
  ctx.fillStyle = sweepGrad;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.arc(0, 0, radius * 0.94, secAngle - sweepSpan, secAngle);
  ctx.closePath();
  ctx.fill();

  // 3. Counter-rotating inner astrolabe gear rings
  ctx.save();
  ctx.rotate(spin * 0.42);
  ctx.strokeStyle = `rgba(253, 224, 71, ${(0.48 * fade).toFixed(2)})`;
  ctx.lineWidth = 2.0;
  ctx.setLineDash([10, 7]);
  ctx.beginPath();
  ctx.arc(0, 0, radius * 0.78, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  ctx.save();
  ctx.rotate(-spin * 0.72);
  ctx.strokeStyle = `rgba(103, 232, 249, ${(0.55 * fade).toFixed(2)})`;
  ctx.lineWidth = 1.6;
  ctx.setLineDash([5, 5]);
  ctx.beginPath();
  ctx.arc(0, 0, radius * 0.56, 0, Math.PI * 2);
  ctx.stroke();
  // Inner gear spokes (4 cardinal astrolabe bridges)
  ctx.setLineDash([]);
  ctx.strokeStyle = `rgba(165, 243, 252, ${(0.28 * fade).toFixed(2)})`;
  ctx.lineWidth = 1.2;
  for (let k = 0; k < 4; k++) {
    const ka = (k * Math.PI) / 2;
    ctx.beginPath();
    ctx.moveTo(Math.cos(ka) * radius * 0.2, Math.sin(ka) * radius * 0.2);
    ctx.lineTo(Math.cos(ka) * radius * 0.54, Math.sin(ka) * radius * 0.54);
    ctx.stroke();
  }
  ctx.restore();

  // 4. Inner center clock dial ring
  ctx.strokeStyle = `rgba(253, 224, 71, ${(0.55 * fade).toFixed(2)})`;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.arc(0, 0, radius * 0.22, 0, Math.PI * 2);
  ctx.stroke();

  // 5. Outer bezel & remaining duration arc
  ctx.strokeStyle = globalStopped
    ? `rgba(253, 224, 71, ${(0.92 * fade).toFixed(2)})`
    : `rgba(103, 232, 249, ${(0.72 * fade).toFixed(2)})`;
  ctx.lineWidth = 2.6;
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.stroke();

  if (lifeRatio > 0.02) {
    ctx.strokeStyle = `rgba(253, 224, 71, ${(0.9 * fade).toFixed(2)})`;
    ctx.lineWidth = 3.2;
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.985, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * lifeRatio);
    ctx.stroke();
  }

  // 6. 60 Fine minute ticks + 12 ornate hour markers
  for (let m = 0; m < 60; m++) {
    const a = (m / 60) * Math.PI * 2 - Math.PI / 2;
    const isMajor = m % 5 === 0;
    const isCardinal = m % 15 === 0;
    if (isMajor) {
      const inner = isCardinal ? radius * 0.77 : radius * 0.84;
      const outer = radius * 0.96;
      ctx.strokeStyle = isCardinal
        ? `rgba(253, 224, 71, ${(0.95 * fade).toFixed(2)})`
        : `rgba(165, 243, 252, ${(0.75 * fade).toFixed(2)})`;
      ctx.lineWidth = isCardinal ? 3.0 : 1.8;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * inner, Math.sin(a) * inner);
      ctx.lineTo(Math.cos(a) * outer, Math.sin(a) * outer);
      ctx.stroke();
    } else {
      ctx.strokeStyle = `rgba(165, 243, 252, ${(0.32 * fade).toFixed(2)})`;
      ctx.lineWidth = 1.0;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * radius * 0.91, Math.sin(a) * radius * 0.91);
      ctx.lineTo(Math.cos(a) * radius * 0.955, Math.sin(a) * radius * 0.955);
      ctx.stroke();
    }
  }

  // 7. Three animated clock hands (Hour, Minute, Sweeping Second)
  const hourAngle = -Math.PI / 2 + spin * 0.28;
  const minAngle = -Math.PI / 2 + spin * 0.95;

  // Hour hand (ornate gold)
  ctx.strokeStyle = `rgba(253, 224, 71, ${(0.92 * fade).toFixed(2)})`;
  ctx.lineWidth = 3.6;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-Math.cos(hourAngle) * radius * 0.08, -Math.sin(hourAngle) * radius * 0.08);
  ctx.lineTo(Math.cos(hourAngle) * radius * 0.45, Math.sin(hourAngle) * radius * 0.45);
  ctx.stroke();

  // Minute hand (bright cyan)
  ctx.strokeStyle = `rgba(103, 232, 249, ${(0.95 * fade).toFixed(2)})`;
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.moveTo(-Math.cos(minAngle) * radius * 0.1, -Math.sin(minAngle) * radius * 0.1);
  ctx.lineTo(Math.cos(minAngle) * radius * 0.7, Math.sin(minAngle) * radius * 0.7);
  ctx.stroke();

  // Second hand (sharp luminous needle)
  ctx.strokeStyle = `rgba(254, 249, 195, ${(0.92 * fade).toFixed(2)})`;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(-Math.cos(secAngle) * radius * 0.14, -Math.sin(secAngle) * radius * 0.14);
  ctx.lineTo(Math.cos(secAngle) * radius * 0.88, Math.sin(secAngle) * radius * 0.88);
  ctx.stroke();

  // Center jewel pinion
  ctx.fillStyle = '#FDE047';
  ctx.beginPath();
  ctx.arc(0, 0, 5.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#ECFEFF';
  ctx.lineWidth = 1.3;
  ctx.stroke();

  // Orbiting rim sparkles
  const sparkleCount = Math.min(10, 6 + Math.floor(frozenCount / 6));
  for (let s = 0; s < sparkleCount; s++) {
    const a = (s / sparkleCount) * Math.PI * 2 + nowMs * 0.0012;
    const sx = Math.cos(a) * radius;
    const syRim = Math.sin(a) * radius;
    ctx.fillStyle = s % 2 === 0 ? '#67E8F9' : '#FDE047';
    ctx.beginPath();
    ctx.arc(sx, syRim, 2.2 + Math.sin(nowMs * 0.01 + s) * 0.9, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

export function drawChronoDomeShell(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  lifeRatio: number,
  nowMs: number,
  globalStopped: boolean
): void {
  const sy = y * ISO_TILT;
  const fade = Math.min(1, Math.max(0.18, lifeRatio * 3.5));
  const domeH = radius * 0.86;
  const groundRy = radius * ISO_TILT;
  const spin = globalStopped ? 0 : nowMs * 0.00055;

  const traceDomeSilhouette = () => {
    ctx.beginPath();
    ctx.ellipse(0, 0, radius, domeH, 0, Math.PI, Math.PI * 2);
    ctx.ellipse(0, 0, radius, groundRy, 0, 0, Math.PI);
    ctx.closePath();
  };

  ctx.save();
  ctx.translate(x, sy);

  // 1. Translucent Fresnel dome body (clear center so entities inside stay crisp, glowing cyan edges)
  traceDomeSilhouette();
  const domeGrad = ctx.createRadialGradient(0, -domeH * 0.25, radius * 0.18, 0, -domeH * 0.15, radius * 1.06);
  domeGrad.addColorStop(0, `rgba(103, 232, 249, ${(0.03 * fade).toFixed(3)})`);
  domeGrad.addColorStop(0.65, `rgba(34, 211, 238, ${(0.08 * fade).toFixed(3)})`);
  domeGrad.addColorStop(0.9, `rgba(125, 211, 252, ${(0.22 * fade).toFixed(3)})`);
  domeGrad.addColorStop(1, `rgba(253, 224, 71, ${(0.18 * fade).toFixed(3)})`);
  ctx.fillStyle = domeGrad;
  ctx.fill();

  // 2. Clipped 3D meridian ribs, latitude ring & specular glass sheen inside the dome
  ctx.save();
  traceDomeSilhouette();
  ctx.clip();

  // 3 rotating longitudinal dome ribs
  ctx.lineWidth = 1.3;
  for (let i = 0; i < 3; i++) {
    const phase = spin + (i * Math.PI) / 3;
    const rx = Math.max(4, Math.abs(Math.cos(phase)) * radius);
    ctx.strokeStyle =
      i === 0
        ? `rgba(253, 224, 71, ${(0.26 * fade).toFixed(2)})`
        : `rgba(103, 232, 249, ${(0.24 * fade).toFixed(2)})`;
    ctx.beginPath();
    ctx.ellipse(0, 0, rx, domeH, 0, Math.PI, Math.PI * 2);
    ctx.stroke();
  }

  // Horizontal latitude ring across mid-dome
  const latY = -domeH * 0.44;
  const latScale = Math.sqrt(Math.max(0.1, 1 - 0.44 * 0.44));
  ctx.strokeStyle = `rgba(165, 243, 252, ${(0.28 * fade).toFixed(2)})`;
  ctx.lineWidth = 1.4;
  ctx.setLineDash([7, 6]);
  ctx.beginPath();
  ctx.ellipse(0, latY, radius * latScale, groundRy * latScale * 0.72, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);

  // Specular glass highlight crescent along upper-left dome curve
  ctx.strokeStyle = `rgba(224, 242, 254, ${(0.28 * fade).toFixed(2)})`;
  ctx.lineWidth = 3.2;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.ellipse(0, 0, radius * 0.88, domeH * 0.88, 0, Math.PI * 1.12, Math.PI * 1.42);
  ctx.stroke();

  ctx.restore();

  // 3. Outer glowing dome arch & front ground energy seal
  ctx.strokeStyle = globalStopped
    ? `rgba(253, 224, 71, ${(0.78 * fade).toFixed(2)})`
    : `rgba(103, 232, 249, ${(0.66 * fade).toFixed(2)})`;
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.ellipse(0, 0, radius, domeH, 0, Math.PI, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = `rgba(165, 243, 252, ${(0.55 * fade).toFixed(2)})`;
  ctx.lineWidth = 2.0;
  ctx.beginPath();
  ctx.ellipse(0, 0, radius, groundRy, 0, 0, Math.PI);
  ctx.stroke();

  // 4. Dome apex golden chronos keystone star
  const apexPulse = 1 + Math.sin(nowMs * 0.008) * 0.18;
  ctx.fillStyle = `rgba(253, 224, 71, ${(0.85 * fade).toFixed(2)})`;
  ctx.beginPath();
  ctx.arc(0, -domeH, 3.8 * apexPulse, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = `rgba(224, 242, 254, ${(0.95 * fade).toFixed(2)})`;
  ctx.beginPath();
  ctx.arc(0, -domeH, 1.8 * apexPulse, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

export function drawTimeDebtClockFx(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  progress: number,
  nowMs: number
): void {
  const sy = y * ISO_TILT - 18 - progress * 16;
  const alpha = Math.max(0, 1 - progress);
  const r = Math.max(14, radius * (0.9 + progress * 0.45));

  ctx.save();
  ctx.translate(x, sy);
  ctx.globalAlpha = alpha;

  // Cracked cyan-gold clock face
  ctx.fillStyle = 'rgba(12, 24, 42, 0.72)';
  ctx.strokeStyle = '#67E8F9';
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Crack zigzags
  ctx.strokeStyle = '#FDE047';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(-r * 0.65, -r * 0.35);
  ctx.lineTo(-r * 0.1, -r * 0.05);
  ctx.lineTo(r * 0.2, r * 0.25);
  ctx.lineTo(r * 0.7, r * 0.45);
  ctx.moveTo(r * 0.3, -r * 0.6);
  ctx.lineTo(0, 0);
  ctx.lineTo(-r * 0.4, r * 0.55);
  ctx.stroke();

  // Reverse-spinning hands
  const rev = -nowMs * 0.025;
  ctx.strokeStyle = '#FDE047';
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(Math.cos(rev) * r * 0.7, Math.sin(rev) * r * 0.7);
  ctx.moveTo(0, 0);
  ctx.lineTo(Math.cos(rev * 2.1) * r * 0.48, Math.sin(rev * 2.1) * r * 0.48);
  ctx.stroke();

  ctx.restore();
}

export function drawOrbitWeaponSprite(
  ctx: CanvasRenderingContext2D,
  kind: 'blade' | 'shield' | 'fireorb' | 'chain',
  x: number,
  y: number,
  size: number,
  rotation: number,
  evolved: boolean,
  color: string,
  alpha = 1,
  vfxKey?: PackVfxKey
): void {
  const animT = performance.now() * 0.001;
  ctx.save();
  ctx.translate(x, y);
  ctx.globalAlpha = alpha;
  ctx.imageSmoothingEnabled = false;

  if (vfxKey && PACK_VFX[vfxKey]) {
    const meta = PACK_VFX[vfxKey];
    const drewCustom = drawPackVfx(ctx, vfxKey, 0, 0, animT, {
      scale: Math.max(1.2, (size * 3.2) / meta.w),
    });
    if (drewCustom) {
      ctx.restore();
      return;
    }
  }

  if (kind === 'blade') {
    const sheet = getPixelSpriteSheet('px_blade');
    if (sheet) {
      drawCanvasStripSprite(ctx, sheet, 0, 0, size * 2.6, size * 1.5, animT, 1, {
        anchorX: 0.5,
        anchorY: 0.5,
        rotation,
        tintColor: color,
        tintAlpha: 0.35,
      });
    }
  } else if (kind === 'shield') {
    const drewShield = drawPackVfx(ctx, evolved ? 'shield_evo' : 'shield', 0, 0, animT, {
      scale: Math.max(1.5, (size * 2.4) / 24),
    });
    if (!drewShield) {
      const sheet = getPixelSpriteSheet('px_shield');
      if (sheet) {
        drawCanvasStripSprite(ctx, sheet, 0, 0, size * 2.0, size * 2.2, animT, 1, {
          anchorX: 0.5,
          anchorY: 0.5,
          tintColor: evolved ? '#10B981' : undefined,
          tintAlpha: 0.35,
        });
      }
    }
  } else if (kind === 'fireorb') {
    const key: PackVfxKey = evolved ? 'fireorb_evo' : 'fireorb';
    const drewFire = drawPackVfx(ctx, key, 0, 0, animT, {
      scale: Math.max(1.4, (size * 2.5) / PACK_VFX[key].w),
    });
    if (!drewFire) {
      drawFrameArraySprite(ctx, FRAMES.expFlame, 0, 0, size * 2.3, size * 2.3, animT, 14, {
        anchorX: 0.5,
        anchorY: 0.5,
        rotation,
      });
    }
  } else {
    const drewChain = drawPackVfx(ctx, evolved ? 'chain_ball_evo' : 'chain_ball', 0, 0, animT, {
      scale: Math.max(1.5, (size * 2.3) / 24),
      angle: rotation,
    });
    if (!drewChain) {
      const sheet = getPixelSpriteSheet('px_chain');
      if (sheet) {
        drawCanvasStripSprite(ctx, sheet, 0, 0, size * 2.1, size * 2.1, animT, 1, {
          anchorX: 0.5,
          anchorY: 0.5,
          rotation,
          tintColor: evolved ? '#E11D48' : undefined,
          tintAlpha: 0.38,
        });
      }
    }
  }

  ctx.restore();
}

export function drawEnemyBulletSprite(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  color: string,
  isSnare?: boolean
): void {
  ctx.save();
  ctx.translate(x, y);
  const pulse = 1 + Math.sin(performance.now() * 0.015) * 0.12;
  if (isSnare) {
    ctx.strokeStyle = '#2DD4BF';
    ctx.fillStyle = 'rgba(192, 132, 252, 0.68)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, radius * 1.15 * pulse, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  } else {
    const g = ctx.createRadialGradient(0, 0, 1, 0, 0, radius * 1.45);
    g.addColorStop(0, '#FFFFFF');
    g.addColorStop(0.5, color);
    g.addColorStop(1, `${color}00`);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(0, 0, radius * 1.45, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

export interface WeaponGroundZoneRender {
  kind:
    | 'banana_peel'
    | 'stuck_dagger'
    | 'lava_pool'
    | 'water_puddle'
    | 'steam_cloud'
    | 'dimension_slit'
    | 'holy_trail'
    | 'earthquake_crack'
    | 'electric_field'
    | 'telegraph_ring';
  x: number;
  y: number;
  x2?: number;
  y2?: number;
  radius: number;
  life: number;
  maxLife: number;
  color: string;
}

export function drawWeaponGroundZone(
  ctx: CanvasRenderingContext2D,
  z: WeaponGroundZoneRender,
  nowMs: number
): void {
  const sy = z.y * ISO_TILT;
  const ratio = Math.max(0, Math.min(1, z.life / Math.max(0.01, z.maxLife)));
  ctx.save();
  if (z.kind === 'telegraph_ring') {
    const prog = 1 - ratio;
    ctx.translate(z.x, sy);
    ctx.scale(1, ISO_TILT);
    ctx.strokeStyle = z.color;
    ctx.fillStyle = `${z.color}22`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, z.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, 0, z.radius * Math.max(0.08, prog), 0, Math.PI * 2);
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 1.6;
    ctx.stroke();
  } else if (z.kind === 'banana_peel') {
    ctx.globalAlpha = Math.min(1, ratio * 2);
    ctx.translate(z.x, sy);
    ctx.fillStyle = '#FACC15';
    ctx.strokeStyle = '#854D0E';
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.ellipse(-4, 2, 6, 2.5, -0.4, 0, Math.PI * 2);
    ctx.ellipse(4, 2, 6, 2.5, 0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  } else if (z.kind === 'stuck_dagger') {
    ctx.globalAlpha = Math.min(1, ratio * 2);
    ctx.translate(z.x, sy);
    ctx.fillStyle = '#E2E8F0';
    ctx.strokeStyle = '#E11D48';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(0, -14);
    ctx.lineTo(3.5, 0);
    ctx.lineTo(-3.5, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else if (z.kind === 'dimension_slit' && z.x2 !== undefined && z.y2 !== undefined) {
    ctx.globalAlpha = Math.min(1, ratio * 1.8);
    const sy2 = z.y2 * ISO_TILT;
    ctx.strokeStyle = '#F43F5E';
    ctx.lineWidth = 7;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(z.x, sy);
    ctx.lineTo(z.x2, sy2);
    ctx.stroke();
    ctx.strokeStyle = '#FEF08A';
    ctx.lineWidth = 2.4;
    ctx.stroke();
  } else if (z.kind === 'earthquake_crack' && z.x2 !== undefined && z.y2 !== undefined) {
    ctx.globalAlpha = Math.min(1, ratio * 1.8);
    const sy2 = z.y2 * ISO_TILT;
    ctx.strokeStyle = '#F59E0B';
    ctx.lineWidth = 10;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(z.x, sy);
    ctx.lineTo(z.x2, sy2);
    ctx.stroke();
    ctx.strokeStyle = '#451A03';
    ctx.lineWidth = 4;
    ctx.stroke();
  } else if (z.kind === 'lava_pool' || z.kind === 'water_puddle' || z.kind === 'steam_cloud' || z.kind === 'holy_trail' || z.kind === 'electric_field') {
    ctx.globalAlpha = Math.min(0.82, ratio * 1.4);
    ctx.translate(z.x, sy);
    ctx.scale(1, ISO_TILT);
    const pulse = 1 + Math.sin(nowMs * 0.008 + z.x * 0.03) * 0.05;
    const g = ctx.createRadialGradient(0, 0, z.radius * 0.15, 0, 0, z.radius * pulse);
    if (z.kind === 'lava_pool') {
      g.addColorStop(0, 'rgba(251, 146, 60, 0.72)');
      g.addColorStop(1, 'rgba(220, 38, 38, 0.12)');
    } else if (z.kind === 'water_puddle') {
      g.addColorStop(0, 'rgba(56, 189, 248, 0.55)');
      g.addColorStop(1, 'rgba(14, 165, 233, 0.12)');
    } else if (z.kind === 'steam_cloud') {
      g.addColorStop(0, 'rgba(226, 232, 240, 0.58)');
      g.addColorStop(1, 'rgba(148, 163, 184, 0.08)');
    } else if (z.kind === 'holy_trail') {
      g.addColorStop(0, 'rgba(254, 240, 138, 0.45)');
      g.addColorStop(1, 'rgba(244, 63, 94, 0.1)');
    } else {
      g.addColorStop(0, 'rgba(167, 139, 250, 0.55)');
      g.addColorStop(1, 'rgba(56, 189, 248, 0.12)');
    }
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(0, 0, z.radius * pulse, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = z.color;
    ctx.lineWidth = 1.6;
    ctx.stroke();
  }
  ctx.restore();
}

export function drawGhostKnightSprite(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  nowMs: number,
  alpha = 0.86
): void {
  const hover = Math.sin(nowMs * 0.008) * 4;
  ctx.save();
  ctx.translate(x, y * ISO_TILT - 10 + hover);
  ctx.globalAlpha = alpha;
  ctx.fillStyle = 'rgba(129, 140, 248, 0.25)';
  ctx.beginPath();
  ctx.arc(0, 0, 22, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#4F46E5';
  ctx.strokeStyle = '#C7D2FE';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.moveTo(0, -18);
  ctx.lineTo(12, -5);
  ctx.lineTo(9, 14);
  ctx.lineTo(-9, 14);
  ctx.lineTo(-12, -5);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#FEF08A';
  ctx.fillRect(-4, -8, 3, 3);
  ctx.fillRect(1, -8, 3, 3);

  // Spectral Greatsword
  ctx.strokeStyle = '#E0E7FF';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(11, 6);
  ctx.lineTo(22, -14);
  ctx.stroke();
  ctx.restore();
}

export function drawShadowDecoySprite(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  nowMs: number
): void {
  const pulse = 1 + Math.sin(nowMs * 0.018) * 0.08;
  ctx.save();
  ctx.translate(x, y * ISO_TILT);
  ctx.globalAlpha = 0.72;
  ctx.fillStyle = 'rgba(99, 102, 241, 0.35)';
  ctx.strokeStyle = '#A5B4FC';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.ellipse(0, 0, 16 * pulse, 10 * pulse, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#312E81';
  ctx.beginPath();
  ctx.arc(0, -14, 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

export function drawTyrantAimReticle(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  nowMs: number
): void {
  const sy = y * ISO_TILT;
  const r = 13 + Math.sin(nowMs * 0.012) * 2;
  ctx.save();
  ctx.translate(x, sy);
  ctx.strokeStyle = '#FACC15';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-r - 5, 0);
  ctx.lineTo(-r + 4, 0);
  ctx.moveTo(r - 4, 0);
  ctx.lineTo(r + 5, 0);
  ctx.moveTo(0, -r - 5);
  ctx.lineTo(0, -r + 4);
  ctx.moveTo(0, r - 4);
  ctx.lineTo(0, r + 5);
  ctx.stroke();
  ctx.fillStyle = '#FACC15';
  ctx.beginPath();
  ctx.arc(0, 0, 2.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

export interface WeatherHazardRender {
  kind: 'sand_vortex' | 'lightning_zone' | 'ice_patch' | 'acid_pool';
  x: number;
  y: number;
  radius: number;
  life: number;
  maxLife: number;
}

export function drawWeatherHazard(
  ctx: CanvasRenderingContext2D,
  hz: WeatherHazardRender,
  nowMs: number
): void {
  const fade = Math.min(1, hz.life / 0.5) * Math.min(1, (hz.maxLife - hz.life) * 2.5 + 0.15);
  ctx.save();
  ctx.translate(hz.x, hz.y);
  ctx.globalAlpha = Math.max(0.18, fade);

  if (hz.kind === 'sand_vortex') {
    const g = ctx.createRadialGradient(0, 0, 4, 0, 0, hz.radius);
    g.addColorStop(0, 'rgba(245, 158, 11, 0.45)');
    g.addColorStop(1, 'rgba(180, 83, 9, 0.05)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(0, 0, hz.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(253, 224, 71, 0.72)';
    ctx.lineWidth = 2;
    for (let k = 0; k < 3; k++) {
      const a = nowMs * 0.008 + (k * Math.PI * 2) / 3;
      ctx.beginPath();
      ctx.arc(0, 0, hz.radius * (0.35 + k * 0.25), a, a + Math.PI * 0.9);
      ctx.stroke();
    }
  } else if (hz.kind === 'lightning_zone') {
    const progress = 1 - Math.max(0, Math.min(1, hz.life / hz.maxLife));
    ctx.globalAlpha = 1;
    ctx.fillStyle = `rgba(56, 189, 248, ${(0.12 + progress * 0.2).toFixed(2)})`;
    ctx.beginPath();
    ctx.arc(0, 0, hz.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(125, 211, 252, 0.85)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, hz.radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = '#E0F2FE';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(0, 0, Math.max(4, hz.radius * (1 - progress)), 0, Math.PI * 2);
    ctx.stroke();
  } else if (hz.kind === 'ice_patch') {
    ctx.fillStyle = 'rgba(103, 232, 249, 0.26)';
    ctx.strokeStyle = 'rgba(186, 230, 253, 0.75)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, hz.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = 'rgba(224, 242, 254, 0.5)';
    ctx.lineWidth = 1.4;
    for (let s = 0; s < 3; s++) {
      const a = (s * Math.PI) / 3;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * -hz.radius * 0.65, Math.sin(a) * -hz.radius * 0.65);
      ctx.lineTo(Math.cos(a) * hz.radius * 0.65, Math.sin(a) * hz.radius * 0.65);
      ctx.stroke();
    }
  } else if (hz.kind === 'acid_pool') {
    const pulse = 1 + Math.sin(nowMs * 0.008 + hz.x) * 0.06;
    const g = ctx.createRadialGradient(0, 0, 6, 0, 0, hz.radius * pulse);
    g.addColorStop(0, 'rgba(163, 230, 53, 0.48)');
    g.addColorStop(0.75, 'rgba(101, 163, 13, 0.28)');
    g.addColorStop(1, 'rgba(77, 124, 15, 0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(0, 0, hz.radius * pulse, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = 'rgba(190, 242, 100, 0.72)';
    ctx.lineWidth = 1.8;
    ctx.setLineDash([6, 5]);
    ctx.beginPath();
    ctx.arc(0, 0, hz.radius * 0.92, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = 'rgba(217, 249, 157, 0.75)';
    for (let b = 0; b < 4; b++) {
      const phase = ((nowMs * 0.0018 + b * 0.27) % 1);
      const bx = Math.cos(b * 2.1 + hz.x) * hz.radius * 0.45;
      const by = Math.sin(b * 1.7 + hz.y) * hz.radius * 0.45 - phase * 10;
      ctx.beginPath();
      ctx.arc(bx, by, 2.5 + (1 - phase) * 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.restore();
}

export function drawWeatherOverlay(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  weather: WeatherId,
  lightningFlash: number,
  camX: number,
  camY: number,
  nowMs: number
): void {
  if (weather === 'clear') return;

  ctx.save();

  if (weather === 'fog') {
    const cx = w / 2;
    const cy = h / 2;
    const clearR = Math.min(w, h) * 0.2;
    const outerR = Math.min(w, h) * 0.44;
    const fogGrad = ctx.createRadialGradient(cx, cy, clearR, cx, cy, outerR);
    fogGrad.addColorStop(0, 'rgba(148, 163, 184, 0)');
    fogGrad.addColorStop(0.55, 'rgba(30, 41, 59, 0.62)');
    fogGrad.addColorStop(1, 'rgba(15, 23, 42, 0.92)');
    ctx.fillStyle = fogGrad;
    ctx.fillRect(0, 0, w, h);

    for (let i = 0; i < 12; i++) {
      const seedX = ((i * 317 + nowMs * 0.032 - camX * 0.35) % (w + 360) + (w + 360)) % (w + 360) - 180;
      const seedY = ((i * 211 + Math.sin(nowMs * 0.001 + i) * 35 - camY * 0.35) % (h + 280) + (h + 280)) % (h + 280) - 140;
      const r = 130 + (i % 4) * 35;
      const mist = ctx.createRadialGradient(seedX, seedY, 10, seedX, seedY, r);
      mist.addColorStop(0, 'rgba(203, 213, 225, 0.14)');
      mist.addColorStop(1, 'rgba(203, 213, 225, 0)');
      ctx.fillStyle = mist;
      ctx.beginPath();
      ctx.arc(seedX, seedY, r, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (weather === 'mist') {
    const mistGrad = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.18, w / 2, h / 2, Math.max(w, h) * 0.68);
    mistGrad.addColorStop(0, 'rgba(203, 213, 225, 0.06)');
    mistGrad.addColorStop(1, 'rgba(71, 85, 105, 0.42)');
    ctx.fillStyle = mistGrad;
    ctx.fillRect(0, 0, w, h);

    for (let i = 0; i < 16; i++) {
      const seedX = ((i * 271 + nowMs * 0.045 - camX * 0.42) % (w + 420) + (w + 420)) % (w + 420) - 210;
      const seedY = ((i * 187 + Math.sin(nowMs * 0.0014 + i) * 40 - camY * 0.42) % (h + 320) + (h + 320)) % (h + 320) - 160;
      const r = 150 + (i % 5) * 38;
      const bank = ctx.createRadialGradient(seedX, seedY, 12, seedX, seedY, r);
      bank.addColorStop(0, 'rgba(226, 232, 240, 0.18)');
      bank.addColorStop(1, 'rgba(148, 163, 184, 0)');
      ctx.fillStyle = bank;
      ctx.beginPath();
      ctx.arc(seedX, seedY, r, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (weather === 'acid_rain') {
    ctx.fillStyle = 'rgba(54, 83, 20, 0.18)';
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = 'rgba(163, 230, 53, 0.56)';
    ctx.lineWidth = 1.6;
    for (let i = 0; i < 58; i++) {
      const sx = ((i * 167 - (nowMs * 0.001) * 260) % (w + 120) + (w + 120)) % (w + 120) - 60;
      const sy = ((i * 127 + (nowMs * 0.001) * 920) % (h + 120) + (h + 120)) % (h + 120) - 60;
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(sx - 7, sy + 24);
      ctx.stroke();
    }
  } else if (weather === 'sandstorm') {
    ctx.fillStyle = 'rgba(180, 118, 42, 0.16)';
    ctx.fillRect(0, 0, w, h);

    const edgeFog = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.25, w / 2, h / 2, Math.max(w, h) * 0.72);
    edgeFog.addColorStop(0, 'rgba(180, 118, 42, 0)');
    edgeFog.addColorStop(1, 'rgba(120, 68, 18, 0.45)');
    ctx.fillStyle = edgeFog;
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = 'rgba(253, 230, 138, 0.34)';
    ctx.lineWidth = 1.6;
    for (let i = 0; i < 42; i++) {
      const speed = 780 + (i % 5) * 140;
      const sx = ((i * 193 + (nowMs * 0.001) * speed - camX * 0.6) % (w + 160) + (w + 160)) % (w + 160) - 80;
      const sy = ((i * 97 + (nowMs * 0.001) * 180 - camY * 0.6) % (h + 120) + (h + 120)) % (h + 120) - 60;
      const len = 18 + (i % 4) * 10;
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(sx + len, sy + len * 0.24);
      ctx.stroke();
    }
  } else if (weather === 'thunderstorm') {
    ctx.fillStyle = 'rgba(14, 30, 56, 0.22)';
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = 'rgba(125, 211, 252, 0.42)';
    ctx.lineWidth = 1.4;
    for (let i = 0; i < 55; i++) {
      const sx = ((i * 173 - (nowMs * 0.001) * 320) % (w + 120) + (w + 120)) % (w + 120) - 60;
      const sy = ((i * 131 + (nowMs * 0.001) * 980) % (h + 120) + (h + 120)) % (h + 120) - 60;
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(sx - 9, sy + 26);
      ctx.stroke();
    }

    if (lightningFlash > 0) {
      ctx.fillStyle = `rgba(224, 242, 254, ${Math.min(0.45, lightningFlash * 0.85).toFixed(2)})`;
      ctx.fillRect(0, 0, w, h);
    }
  } else if (weather === 'blizzard') {
    const frostVig = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.3, w / 2, h / 2, Math.max(w, h) * 0.72);
    frostVig.addColorStop(0, 'rgba(186, 230, 253, 0)');
    frostVig.addColorStop(1, 'rgba(125, 211, 252, 0.26)');
    ctx.fillStyle = frostVig;
    ctx.fillRect(0, 0, w, h);

    ctx.fillStyle = 'rgba(240, 249, 255, 0.72)';
    for (let i = 0; i < 48; i++) {
      const sway = Math.sin(nowMs * 0.003 + i) * 28;
      const sx = ((i * 157 + (nowMs * 0.001) * 110 + sway - camX * 0.4) % (w + 80) + (w + 80)) % (w + 80) - 40;
      const sy = ((i * 113 + (nowMs * 0.001) * 195 - camY * 0.4) % (h + 80) + (h + 80)) % (h + 80) - 40;
      const r = 1.6 + (i % 3) * 0.9;
      ctx.beginPath();
      ctx.arc(sx, sy, r, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (weather === 'blood_rain') {
    ctx.fillStyle = 'rgba(136, 19, 55, 0.16)';
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = 'rgba(251, 113, 133, 0.48)';
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 50; i++) {
      const sx = ((i * 181 - (nowMs * 0.001) * 240) % (w + 120) + (w + 120)) % (w + 120) - 60;
      const sy = ((i * 139 + (nowMs * 0.001) * 860) % (h + 120) + (h + 120)) % (h + 120) - 60;
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(sx - 6, sy + 22);
      ctx.stroke();
    }
  }

  ctx.restore();
}

/**
 * Renders subtle temporal environmental shifts over elapsed time:
 * - Smooth Day -> Dusk -> Night -> Dawn atmospheric lighting curve
 * - Breathing & shifting low-lying fog banks whose density evolves with time of day and run progression
 * - Gentle wind-carried falling leaves / ash / embers / mist flecks in parallax world space
 */
export function drawTemporalAtmosphereOverlay(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  themeStyle: BiomeDef['themeStyle'],
  elapsedSeconds: number,
  camWorldX: number,
  camScreenY: number,
  nowMs: number
): void {
  const t = nowMs * 0.001;
  // 90s cycle: 0..45s Night, 45..90s Day, with 7s smooth dusk/dawn transitions
  const cyclePos = ((elapsedSeconds % 90) + 90) % 90;
  let nightFactor = 1;
  if (cyclePos >= 45) {
    // Day phase (45..90): fade from 1 -> 0 over 45..52, stay 0, fade 0 -> 1 over 83..90
    if (cyclePos < 52) {
      nightFactor = 0.5 + 0.5 * Math.cos(((cyclePos - 45) / 7) * Math.PI);
    } else if (cyclePos > 83) {
      nightFactor = 0.5 - 0.5 * Math.cos(((cyclePos - 83) / 7) * Math.PI);
    } else {
      nightFactor = 0;
    }
  } else {
    // Night phase (0..45): mostly dark, easing gently right at edges
    if (cyclePos < 3) {
      nightFactor = 0.85 + 0.15 * Math.sin((cyclePos / 3) * (Math.PI / 2));
    } else if (cyclePos > 42) {
      nightFactor = 0.85 + 0.15 * Math.cos(((cyclePos - 42) / 3) * (Math.PI / 2));
    } else {
      nightFactor = 1;
    }
  }

  // Dawn (~42..53s) and Dusk (~82..90s & 0..5s) twilight warmth
  const twilightFactor = Math.sin(nightFactor * Math.PI);
  // Gradual dread/darkness escalation over the first 8 minutes
  const runEscalation = Math.min(1, elapsedSeconds / 480);

  ctx.save();

  // 1. Smooth Day / Twilight / Night Color Wash & Perimeter Vignette
  const dayWarmAlpha = (1 - nightFactor) * 0.042;
  if (dayWarmAlpha > 0.004) {
    ctx.fillStyle = `rgba(251, 191, 36, ${dayWarmAlpha.toFixed(3)})`;
    ctx.fillRect(0, 0, w, h);
  }
  if (twilightFactor > 0.02) {
    const duskGrad = ctx.createLinearGradient(0, 0, 0, h);
    duskGrad.addColorStop(0, `rgba(190, 24, 93, ${(twilightFactor * 0.09).toFixed(3)})`);
    duskGrad.addColorStop(0.5, `rgba(249, 115, 22, ${(twilightFactor * 0.03).toFixed(3)})`);
    duskGrad.addColorStop(1, `rgba(30, 27, 75, ${(twilightFactor * 0.08).toFixed(3)})`);
    ctx.fillStyle = duskGrad;
    ctx.fillRect(0, 0, w, h);
  }

  const vigEdgeAlpha = 0.12 + nightFactor * 0.3 + runEscalation * 0.08;
  const vig = ctx.createRadialGradient(
    w * 0.5,
    h * 0.5,
    Math.min(w, h) * 0.32,
    w * 0.5,
    h * 0.5,
    Math.max(w, h) * 0.74
  );
  vig.addColorStop(0, 'rgba(2, 6, 17, 0)');
  vig.addColorStop(1, `rgba(3, 6, 14, ${vigEdgeAlpha.toFixed(3)})`);
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, w, h);

  // 2. Subtle Changing Ground Fog Intensity Over Time (thicker at dawn/night & deeper waves)
  const fogCycle = 0.5 + 0.5 * Math.sin(elapsedSeconds * 0.085);
  const fogStrength =
    0.045 + nightFactor * 0.065 + twilightFactor * 0.03 + fogCycle * 0.045 + runEscalation * 0.035;

  const fogRgb =
    themeStyle === 'forest'
      ? '148, 196, 172'
      : themeStyle === 'sea'
        ? '125, 190, 224'
        : themeStyle === 'volcano'
          ? '186, 134, 112'
          : themeStyle === 'void'
            ? '168, 140, 214'
            : '148, 163, 184';

  // Soft perimeter fog banks drifting smoothly across the battlefield edges
  const windShift = Math.sin(elapsedSeconds * 0.12) * 18;
  for (let i = 0; i < 8; i++) {
    const driftSpeed = 14 + (i % 3) * 7;
    const fx =
      (((i * 347 + t * (driftSpeed + windShift * 0.4) - camWorldX * 0.42) % (w + 460)) + (w + 460)) %
        (w + 460) -
      230;
    const fy =
      (((i * 239 + Math.sin(t * 0.45 + i * 1.3) * 32 - camScreenY * 0.42) % (h + 360)) + (h + 360)) %
        (h + 360) -
      180;
    const distNorm = Math.hypot(fx - w * 0.5, fy - h * 0.5) / (Math.max(w, h) * 0.55);
    // Keep center visibility crystal clear; fog thickens softly toward edges
    const edgeMask = Math.min(1, Math.max(0.22, distNorm * 0.9));
    const r = 165 + (i % 4) * 42;
    const a = fogStrength * edgeMask;
    const mist = ctx.createRadialGradient(fx, fy, 12, fx, fy, r);
    mist.addColorStop(0, `rgba(${fogRgb}, ${a.toFixed(3)})`);
    mist.addColorStop(0.6, `rgba(${fogRgb}, ${(a * 0.42).toFixed(3)})`);
    mist.addColorStop(1, `rgba(${fogRgb}, 0)`);
    ctx.fillStyle = mist;
    ctx.beginPath();
    ctx.arc(fx, fy, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // 3. Subtle Wind-Driven Falling Leaves / Ash / Petals / Sea Mist Reflecting Passage of Time
  const gust = 18 + Math.sin(elapsedSeconds * 0.17) * 14 + Math.cos(elapsedSeconds * 0.07) * 8;
  const particleCount = themeStyle === 'forest' ? 24 : 20;

  for (let i = 0; i < particleCount; i++) {
    const seed = i * 13.37;
    const speedY = themeStyle === 'sea' ? -(22 + (i % 4) * 7) : 28 + (i % 5) * 9;
    const flutter = Math.sin(t * (1.8 + (i % 3) * 0.5) + seed) * (16 + (i % 3) * 6);
    const px =
      (((i * 199 + t * (gust + (i % 4) * 6) + flutter - camWorldX * 0.65) % (w + 120)) + (w + 120)) %
        (w + 120) -
      60;
    const py =
      (((i * 157 + t * speedY - camScreenY * 0.65) % (h + 120)) + (h + 120)) % (h + 120) - 60;
    const fade = (0.34 + 0.22 * Math.sin(t * 1.4 + seed)) * (1 - 0.18 * (1 - nightFactor));

    if (themeStyle === 'forest') {
      // Falling forest leaves shifting gently between moss-green and withered amber/crimson as time passes
      const rot = t * (1.2 + (i % 3) * 0.5) + seed;
      const leafPalette =
        nightFactor > 0.55 || runEscalation > 0.5
          ? i % 3 === 0
            ? '#D97706'
            : i % 3 === 1
              ? '#B45309'
              : '#34D399'
          : i % 3 === 0
            ? '#4ADE80'
            : i % 3 === 1
              ? '#84CC16'
              : '#D97706';
      ctx.save();
      ctx.translate(px, py);
      ctx.rotate(rot);
      ctx.globalAlpha = fade;
      ctx.fillStyle = leafPalette;
      ctx.beginPath();
      ctx.ellipse(0, 0, 4.6 + (i % 2) * 1.3, 2.1, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    } else if (themeStyle === 'volcano') {
      // Drifting volcanic ash flakes & rising tiny cinders
      const isEmber = i % 3 === 0;
      ctx.globalAlpha = fade * (isEmber ? 1.15 : 0.75);
      ctx.fillStyle = isEmber ? '#FB923C' : '#94A3B8';
      ctx.save();
      ctx.translate(px, isEmber ? h - py : py);
      ctx.rotate(t * 1.5 + seed);
      ctx.fillRect(-2, -1.2, isEmber ? 2.6 : 4, isEmber ? 2.6 : 2);
      ctx.restore();
    } else if (themeStyle === 'sea') {
      // Rising abyssal mist droplets / bubbles
      ctx.globalAlpha = fade * 0.8;
      ctx.strokeStyle = i % 2 === 0 ? '#7DD3FC' : '#5EEAD4';
      ctx.lineWidth = 1.1;
      ctx.beginPath();
      ctx.arc(px, py, 2 + (i % 3) * 0.8, 0, Math.PI * 2);
      ctx.stroke();
    } else if (themeStyle === 'void') {
      // Tumbling twilight shards & violet petals
      ctx.save();
      ctx.translate(px, py);
      ctx.rotate(t * 1.4 + seed);
      ctx.globalAlpha = fade * 0.85;
      ctx.fillStyle = i % 2 === 0 ? '#C084FC' : '#F472B6';
      ctx.beginPath();
      ctx.moveTo(0, -3.5);
      ctx.lineTo(2.5, 0);
      ctx.lineTo(0, 3.5);
      ctx.lineTo(-2.5, 0);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    } else {
      // Crypt / Blood Sanctum: sinking pale graveyard ash & crimson dusk motes
      ctx.save();
      ctx.translate(px, py);
      ctx.rotate(t * 0.9 + seed);
      ctx.globalAlpha = fade * 0.8;
      ctx.fillStyle = i % 4 === 0 ? '#FDA4AF' : '#CBD5E1';
      ctx.fillRect(-2, -1, 3.6, 1.8);
      ctx.restore();
    }
  }

  ctx.restore();
}

// =========================================================================
// REDESIGNED CLASS VISUALS & ULTIMATE CUT-IN RENDERERS
// =========================================================================

export function drawPaladinSwordSlash(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  angle: number,
  radius: number,
  progress: number,
  isExcalibur: boolean
): void {
  const alpha = Math.max(0, 1 - progress);
  const startA = angle - (Math.PI * 70) / 180;
  const endA = angle + (Math.PI * 70) / 180;
  const sweepA = startA + (endA - startA) * Math.min(1, progress * 1.5);

  ctx.save();
  ctx.translate(x, y);
  ctx.globalAlpha = alpha;

  // Crescent slash ribbon
  const primary = isExcalibur ? '#FACC15' : '#38BDF8';
  const secondary = isExcalibur ? '#FEF08A' : '#E0F2FE';
  ctx.lineCap = 'round';
  ctx.strokeStyle = isExcalibur ? 'rgba(250, 204, 21, 0.38)' : 'rgba(56, 189, 248, 0.36)';
  ctx.lineWidth = Math.max(16, radius * 0.22);
  ctx.beginPath();
  ctx.arc(0, 0, radius * 0.88, startA, endA);
  ctx.stroke();

  ctx.strokeStyle = primary;
  ctx.lineWidth = Math.max(8, radius * 0.11);
  ctx.beginPath();
  ctx.arc(0, 0, radius * 0.92, startA, endA);
  ctx.stroke();

  ctx.strokeStyle = secondary;
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  ctx.arc(0, 0, radius * 0.96, startA, endA);
  ctx.stroke();

  // Physical Spirit Sword / Excalibur blade sweeping cleanly along the arc!
  ctx.save();
  ctx.rotate(sweepA);
  // Hilt & Crossguard
  ctx.fillStyle = '#F59E0B';
  ctx.fillRect(10, -10, 5, 20);
  ctx.fillStyle = '#B45309';
  ctx.fillRect(2, -3, 10, 6);
  // Broad glowing blade reaching out to `radius`
  const bladeGrad = ctx.createLinearGradient(15, 0, radius, 0);
  bladeGrad.addColorStop(0, secondary);
  bladeGrad.addColorStop(0.55, primary);
  bladeGrad.addColorStop(1, '#FFFFFF');
  ctx.fillStyle = bladeGrad;
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(15, -7.5);
  ctx.lineTo(radius * 0.88, -5.5);
  ctx.lineTo(radius * 1.03, 0);
  ctx.lineTo(radius * 0.88, 5.5);
  ctx.lineTo(15, 7.5);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  ctx.restore();
}

export function drawExcaliburPlanted(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  lifeRatio: number,
  nowMs: number
): void {
  const pulse = 1 + Math.sin(nowMs * 0.015) * 0.06;
  ctx.save();
  ctx.translate(x, y);
  ctx.globalAlpha = Math.min(1, lifeRatio * 2.5);

  // Radiant holy pillar fading upward
  const grad = ctx.createLinearGradient(0, -240, 0, 12);
  grad.addColorStop(0, 'rgba(250, 204, 21, 0)');
  grad.addColorStop(0.6, 'rgba(250, 204, 21, 0.32)');
  grad.addColorStop(1, 'rgba(254, 249, 195, 0.72)');
  ctx.fillStyle = grad;
  ctx.fillRect(-34 * pulse, -240, 68 * pulse, 250);

  const drewEx = drawPackVfx(ctx, 'knight_excalibur', 0, 6, (1 - lifeRatio) * 0.57, {
    scale: 1.85,
  });
  if (!drewEx) {
    // Giant golden Excalibur planted vertically fallback
    ctx.fillStyle = '#FEF08A';
    ctx.strokeStyle = '#F59E0B';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(-11, -135);
    ctx.lineTo(11, -135);
    ctx.lineTo(8, -14);
    ctx.lineTo(0, 4);
    ctx.lineTo(-8, -14);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Golden crossguard & pommel
    ctx.fillStyle = '#F59E0B';
    ctx.fillRect(-26, -142, 52, 9);
    ctx.fillRect(-5, -168, 10, 26);
    ctx.beginPath();
    ctx.arc(0, -172, 7, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

export function drawShadowCutSlash(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  progress: number,
  color = '#34D399'
): void {
  const alpha = Math.max(0, 1 - progress);
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.lineCap = 'round';

  // 4 Ghost Shadow Afterimages staggered along dash line (frames 0..3)
  for (let a = 0; a < 4; a++) {
    const t = 0.16 + a * 0.22;
    const ax = x1 + (x2 - x1) * t;
    const ay = y1 + (y2 - y1) * t;
    const drewAfter = drawPackVfx(ctx, 'hunter_afterimage', ax, ay - 12, 0, {
      scale: 1.75,
      frameOverride: a,
      flipX: x2 < x1,
      alpha: Math.max(0.25, 0.9 - a * 0.18),
    });
    if (!drewAfter && a < 3) {
      ctx.fillStyle = `rgba(16, 185, 129, ${(0.45 - a * 0.1).toFixed(2)})`;
      ctx.beginPath();
      ctx.ellipse(ax, ay - 14, 13, 22, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  const midX = (x1 + x2) * 0.5;
  const midY = (y1 + y2) * 0.5 - 8;
  const segLen = Math.max(48, Math.hypot(x2 - x1, y2 - y1));
  const ang = Math.atan2(y2 - y1, x2 - x1);
  const drewSlash = drawPackVfx(ctx, 'hunter_shadow_slash', midX, midY, progress * 0.3, {
    scaleX: segLen / 96,
    scaleY: 1.75,
    angle: ang,
  });

  if (!drewSlash) {
    // Glowing emerald-white cut ribbon fallback
    ctx.strokeStyle = `${color}66`;
    ctx.lineWidth = 18 * (1 - progress * 0.5);
    ctx.beginPath();
    ctx.moveTo(x1, y1 - 8);
    ctx.lineTo(x2, y2 - 8);
    ctx.stroke();

    ctx.strokeStyle = color;
    ctx.lineWidth = 7 * (1 - progress * 0.4);
    ctx.beginPath();
    ctx.moveTo(x1, y1 - 8);
    ctx.lineTo(x2, y2 - 8);
    ctx.stroke();

    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    ctx.moveTo(x1, y1 - 8);
    ctx.lineTo(x2, y2 - 8);
    ctx.stroke();
  }
  ctx.restore();
}

export function drawDemonImpSprite(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  vx: number,
  nowMs: number
): void {
  const hop = Math.abs(Math.sin(nowMs * 0.018 + x * 0.1)) * 4;
  ctx.save();
  ctx.translate(x, y - hop);
  if (vx < 0) ctx.scale(-1, 1);

  ctx.fillStyle = '#F97316';
  ctx.strokeStyle = '#7C2D12';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(0, -6, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Devil horns
  ctx.fillStyle = '#18181B';
  ctx.beginPath();
  ctx.moveTo(-4, -12);
  ctx.lineTo(-8, -20);
  ctx.lineTo(-1, -13);
  ctx.moveTo(4, -12);
  ctx.lineTo(8, -20);
  ctx.lineTo(1, -13);
  ctx.fill();

  // Glowing eyes
  ctx.fillStyle = '#FEF08A';
  ctx.fillRect(2, -9, 2.5, 2.5);
  ctx.fillRect(-3, -9, 2.5, 2.5);
  ctx.restore();
}

export function drawSevenSinsRitualCircle(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  progress: number,
  nowMs: number
): void {
  const rot = nowMs * 0.0014;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.globalAlpha = Math.min(0.85, progress * 1.4);

  ctx.strokeStyle = '#E879F9';
  ctx.lineWidth = 2.6;
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(0, 0, radius * 0.84, 0, Math.PI * 2);
  ctx.stroke();

  // 7-pointed star
  ctx.strokeStyle = 'rgba(244, 114, 182, 0.78)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let i = 0; i <= 7; i++) {
    const idx = (i * 3) % 7;
    const ang = (idx * Math.PI * 2) / 7;
    const px = Math.cos(ang) * radius * 0.84;
    const py = Math.sin(ang) * radius * 0.84;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.stroke();

  // 7 sin color sigils on points
  const colors = ['#C084FC', '#FBBF24', '#10B981', '#EF4444', '#60A5FA', '#84CC16', '#EC4899'];
  for (let i = 0; i < 7; i++) {
    const ang = (i * Math.PI * 2) / 7;
    const sx = Math.cos(ang) * radius * 0.92;
    const sy = Math.sin(ang) * radius * 0.92;
    ctx.fillStyle = colors[i];
    ctx.beginPath();
    ctx.arc(sx, sy, 5.5, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

export function drawSinEntitySprite(
  ctx: CanvasRenderingContext2D,
  sinId: SinId,
  x: number,
  y: number,
  hp: number,
  maxHp: number,
  level: number,
  slothAwake: boolean,
  wrathStacks: number,
  nowMs: number
): void {
  const def = SEVEN_SINS[sinId];
  const animT = nowMs * 0.001;
  const hover = Math.sin(animT * 3.5 + x * 0.02) * 3.5;

  ctx.save();
  ctx.translate(x, y);

  // Sloth 260px Slow Dome visual when awake
  if (sinId === 'sloth' && slothAwake) {
    ctx.save();
    ctx.scale(1, 0.68);
    const g = ctx.createRadialGradient(0, 0, 20, 0, 0, 260);
    g.addColorStop(0, 'rgba(96, 165, 250, 0.08)');
    g.addColorStop(0.8, 'rgba(96, 165, 250, 0.22)');
    g.addColorStop(1, 'rgba(59, 130, 246, 0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(0, 0, 260, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(147, 197, 253, 0.6)';
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 6]);
    ctx.beginPath();
    ctx.arc(0, 0, 260, animT, animT + Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  }

  // Ground shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
  ctx.beginPath();
  ctx.ellipse(0, 12, 18, 7, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.save();
  ctx.translate(0, -14 + hover);

  if (sinId === 'pride') {
    // Lucifer: fallen dark wings & radiant violet-gold halo
    for (const side of [-1, 1]) {
      ctx.fillStyle = 'rgba(88, 28, 135, 0.85)';
      ctx.strokeStyle = '#C084FC';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(side * 26, -16);
      ctx.lineTo(side * 22, 4);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
    ctx.fillStyle = '#581C87';
    ctx.strokeStyle = '#E9D5FF';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.arc(0, 0, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = '#FACC15';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.ellipse(0, -18, 10, 3.5, 0, 0, Math.PI * 2);
    ctx.stroke();
  } else if (sinId === 'greed') {
    // Mammon: Fanged Golden Mimic Chest
    const bite = Math.abs(Math.sin(animT * 6)) * 4;
    ctx.fillStyle = '#B45309';
    ctx.strokeStyle = '#FDE047';
    ctx.lineWidth = 2;
    ctx.fillRect(-13, -8, 26, 18);
    ctx.strokeRect(-13, -8, 26, 18);
    // Lid & teeth
    ctx.fillStyle = '#D97706';
    ctx.fillRect(-14, -14 - bite, 28, 8);
    ctx.strokeRect(-14, -14 - bite, 28, 8);
    ctx.fillStyle = '#FFFFFF';
    for (let t = -9; t <= 9; t += 6) {
      ctx.fillRect(t - 1.5, -9, 3, 4);
    }
  } else if (sinId === 'envy') {
    // Leviathan: Emerald coiling serpent
    ctx.fillStyle = '#059669';
    ctx.strokeStyle = '#6EE7B7';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(Math.sin(animT * 5) * 4, 5, 9, 0, Math.PI * 2);
    ctx.arc(0, -5, 11, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#FEF08A';
    ctx.fillRect(-5, -8, 3, 3);
    ctx.fillRect(2, -8, 3, 3);
  } else if (sinId === 'wrath') {
    // Satan: Horned crimson brute with flaming vengeance aura
    const size = 14 + Math.min(6, wrathStacks * 0.6);
    if (wrathStacks > 0) {
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.8)';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(0, 0, size + 6, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.fillStyle = '#991B1B';
    ctx.strokeStyle = '#FCA5A5';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, size, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#FACC15';
    ctx.beginPath();
    ctx.moveTo(-7, -size + 2);
    ctx.lineTo(-14, -size - 11);
    ctx.lineTo(-2, -size);
    ctx.moveTo(7, -size + 2);
    ctx.lineTo(14, -size - 11);
    ctx.lineTo(2, -size);
    ctx.fill();
  } else if (sinId === 'sloth') {
    // Belphegor: Massive sleepy colossus
    ctx.fillStyle = slothAwake ? '#1D4ED8' : '#334155';
    ctx.strokeStyle = '#93C5FD';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.arc(0, 0, 17, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    if (!slothAwake) {
      ctx.fillStyle = '#BFDBFE';
      ctx.font = 'bold 10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('Zzz', 10, -18 + Math.sin(animT * 2) * 3);
    }
  } else if (sinId === 'gluttony') {
    // Beelzebub: Giant toxic maw + orbiting flies
    ctx.fillStyle = '#3F6212';
    ctx.strokeStyle = '#A3E635';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, 13, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#09090B';
    ctx.beginPath();
    ctx.arc(0, 2, 7, 0, Math.PI * 2);
    ctx.fill();
    for (let f = 0; f < 4; f++) {
      const fa = animT * 5 + (f * Math.PI * 2) / 4;
      ctx.fillStyle = '#D9F99D';
      ctx.fillRect(Math.cos(fa) * 19, Math.sin(fa) * 12, 3, 3);
    }
  } else {
    // Asmodeus (Lust): Winged violet-pink enchantress
    for (const side of [-1, 1]) {
      ctx.fillStyle = 'rgba(219, 39, 119, 0.78)';
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(side * 22, -16, side * 18, 6);
      ctx.closePath();
      ctx.fill();
    }
    ctx.fillStyle = '#9D174D';
    ctx.strokeStyle = '#F9A8D4';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.arc(0, 0, 11, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }
  ctx.restore();

  // HP Bar + Level tag above Sin
  const bw = 40;
  const barY = -38;
  ctx.fillStyle = 'rgba(0,0,0,0.8)';
  ctx.fillRect(-bw / 2 - 1, barY - 1, bw + 2, 6);
  ctx.fillStyle = def.color;
  ctx.fillRect(-bw / 2, barY, bw * Math.max(0, Math.min(1, hp / Math.max(1, maxHp))), 4);
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 9px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(`Lv.${level}`, 0, barY - 4);

  ctx.restore();
}

export function drawUltimateBackdropMoon(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  color: string,
  bloodMoon: boolean,
  alpha = 0.28
): void {
  ctx.save();
  const cx = w * 0.5;
  const cy = h * 0.28;
  const r = Math.min(w, h) * 0.19;

  ctx.globalAlpha = alpha;
  if (bloodMoon) {
    const g = ctx.createRadialGradient(cx, cy, r * 0.2, cx, cy, r * 1.45);
    g.addColorStop(0, '#FB7185');
    g.addColorStop(0.65, '#BE123C');
    g.addColorStop(1, 'rgba(190, 18, 60, 0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(cx, cy, r * 1.45, 0, Math.PI * 2);
    ctx.fill();
  } else {
    const drewMoon = drawPackVfx(ctx, 'hunter_ult_moon', cx, cy, performance.now() * 0.001, {
      scale: (r * 2.5) / 96,
      alpha,
    });
    if (!drewMoon) {
      // Crescent moon fallback
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalCompositeOperation = 'destination-out';
      ctx.beginPath();
      ctx.arc(cx + r * 0.36, cy - r * 0.14, r * 0.86, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalCompositeOperation = 'source-over';
    }
  }
  ctx.restore();
}

export function drawUltimateCutinOverlay(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  titleTh: string,
  titleEn: string,
  color: string,
  progress: number // 0..1
): void {
  const fade = progress < 0.14 ? progress / 0.14 : progress > 0.72 ? Math.max(0, (1 - progress) / 0.28) : 1;
  ctx.save();

  // Knight Excalibur Descent (Section 6.1): 40% dark screen + diagonal gold banner
  if (titleEn.toUpperCase() === 'EXCALIBUR DESCENT') {
    ctx.fillStyle = `rgba(0, 0, 0, ${(0.4 * fade).toFixed(3)})`;
    ctx.fillRect(0, 0, w, h);

    const slideX = progress < 0.2 ? (1 - progress / 0.2) * w * 0.45 : 0;
    ctx.save();
    ctx.translate(w * 0.5 - slideX, h * 0.28);
    ctx.rotate(-0.14);
    ctx.globalAlpha = fade;

    const bandW = Math.hypot(w, h) * 1.15;
    const bandH = 66;
    ctx.fillStyle = 'rgba(14, 42, 74, 0.92)';
    ctx.fillRect(-bandW * 0.5, -bandH * 0.5, bandW, bandH);
    ctx.fillStyle = '#ffd75e';
    ctx.fillRect(-bandW * 0.5, -bandH * 0.5, bandW, 4);
    ctx.fillRect(-bandW * 0.5, bandH * 0.5 - 4, bandW, 4);

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.strokeStyle = '#0e2a4a';
    ctx.lineWidth = 4;
    ctx.font = `800 ${Math.round(Math.max(18, Math.min(26, w * 0.025)))}px 'Cinzel', 'Sarabun', sans-serif`;
    ctx.strokeText(titleTh, 0, -9);
    ctx.fillStyle = '#ffd75e';
    ctx.fillText(titleTh, 0, -9);

    ctx.font = `700 ${Math.round(Math.max(11, Math.min(14, w * 0.013)))}px 'Cinzel', sans-serif`;
    ctx.fillStyle = '#fffbe0';
    ctx.fillText(titleEn, 0, 14);
    ctx.restore();
    ctx.restore();
    return;
  }

  // Subtle perimeter glow frame only (zero center-screen darkening so hero & arena stay 100% clear)
  ctx.globalAlpha = fade * 0.45;
  ctx.strokeStyle = color;
  ctx.lineWidth = 4;
  ctx.strokeRect(2, 2, w - 4, h - 4);

  // Sleek slim top-edge announcement ribbon (never covers center player)
  const slideX = progress < 0.18 ? (1 - progress / 0.18) * w * 0.28 : 0;
  const bandH = 42;
  const bandY = 58;
  ctx.save();
  ctx.translate(w * 0.5 - slideX, bandY);
  const grad = ctx.createLinearGradient(-w * 0.45, 0, w * 0.45, 0);
  grad.addColorStop(0, 'rgba(0,0,0,0)');
  grad.addColorStop(0.2, `${color}B8`);
  grad.addColorStop(0.5, 'rgba(9, 11, 20, 0.94)');
  grad.addColorStop(0.8, `${color}B8`);
  grad.addColorStop(1, 'rgba(0,0,0,0)');

  ctx.globalAlpha = fade;
  ctx.fillStyle = grad;
  ctx.fillRect(-w * 0.45, -bandH * 0.5, w * 0.9, bandH);

  ctx.fillStyle = color;
  ctx.fillRect(-w * 0.42, -bandH * 0.5, w * 0.84, 1.5);
  ctx.fillRect(-w * 0.42, bandH * 0.5 - 1.5, w * 0.84, 1.5);

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.92)';
  ctx.lineWidth = 4;
  ctx.font = `800 ${Math.round(Math.max(15, Math.min(20, w * 0.018)))}px 'Cinzel', 'Sarabun', sans-serif`;
  ctx.strokeText(`${titleTh} · ${titleEn.toUpperCase()}`, 0, 0);
  ctx.fillStyle = '#FFFFFF';
  ctx.fillText(`${titleTh} · ${titleEn.toUpperCase()}`, 0, 0);

  ctx.restore();
  ctx.restore();
}

export interface StyledParticleRender {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  life: number;
  maxLife: number;
  color: string;
  secondaryColor?: string;
  shape?: ParticleShape;
  angle?: number;
  zOffset?: number;
  glow?: boolean;
}

export function drawStyledParticle(
  ctx: CanvasRenderingContext2D,
  pt: StyledParticleRender
): void {
  const lifeRatio = Math.max(0, Math.min(1, pt.life / Math.max(0.001, pt.maxLife)));
  const sx = pt.x;
  const sy = pt.y * ISO_TILT - (pt.zOffset ?? 10);
  const shape = pt.shape ?? 'circle';
  const r = Math.max(0.8, pt.radius * (shape === 'ring' ? 1 + (1 - lifeRatio) * 1.35 : 0.45 + 0.55 * lifeRatio));

  ctx.save();
  ctx.translate(sx, sy);

  if (pt.glow) {
    ctx.globalAlpha = lifeRatio * 0.28;
    ctx.fillStyle = pt.secondaryColor || pt.color;
    ctx.beginPath();
    ctx.arc(0, 0, r * 2.1, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.globalAlpha = lifeRatio;

  if (shape === 'spark') {
    const ang = pt.angle ?? Math.atan2(pt.vy * ISO_TILT, pt.vx);
    ctx.rotate(ang);
    const len = r * 2.6;
    const wid = Math.max(1.1, r * 0.72);
    if (pt.secondaryColor) {
      ctx.fillStyle = pt.secondaryColor;
      ctx.beginPath();
      ctx.ellipse(-len * 0.18, 0, len * 1.15, wid * 1.2, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = pt.color;
    ctx.beginPath();
    ctx.moveTo(len, 0);
    ctx.lineTo(0, -wid);
    ctx.lineTo(-len * 0.85, 0);
    ctx.lineTo(0, wid);
    ctx.closePath();
    ctx.fill();
  } else if (shape === 'diamond') {
    if (pt.angle) ctx.rotate(pt.angle);
    ctx.fillStyle = pt.color;
    ctx.beginPath();
    ctx.moveTo(0, -r * 1.35);
    ctx.lineTo(r * 0.95, 0);
    ctx.lineTo(0, r * 1.35);
    ctx.lineTo(-r * 0.95, 0);
    ctx.closePath();
    ctx.fill();
    if (pt.secondaryColor) {
      ctx.strokeStyle = pt.secondaryColor;
      ctx.lineWidth = 1.1;
      ctx.stroke();
    }
  } else if (shape === 'star') {
    if (pt.angle) ctx.rotate(pt.angle);
    const outer = r * 1.55;
    const inner = r * 0.45;
    ctx.fillStyle = pt.color;
    ctx.beginPath();
    for (let i = 0; i < 8; i++) {
      const rad = i % 2 === 0 ? outer : inner;
      const a = (i * Math.PI) / 4;
      const px = Math.cos(a) * rad;
      const py = Math.sin(a) * rad;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = pt.secondaryColor || '#FFFFFF';
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.42, 0, Math.PI * 2);
    ctx.fill();
  } else if (shape === 'ring') {
    ctx.strokeStyle = pt.color;
    ctx.lineWidth = Math.max(1.1, 2.2 * lifeRatio);
    ctx.beginPath();
    ctx.arc(0, 0, r * 1.35, 0, Math.PI * 2);
    ctx.stroke();
    if (pt.secondaryColor) {
      ctx.strokeStyle = pt.secondaryColor;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.8, 0, Math.PI * 2);
      ctx.stroke();
    }
  } else {
    ctx.fillStyle = pt.color;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();
    if (pt.secondaryColor) {
      ctx.fillStyle = pt.secondaryColor;
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.48, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.restore();
}

// =========================================================================
// M1 - M8 MAP SYSTEM 2.5D RENDERING HELPERS
// =========================================================================

export function drawTerrainZoneGround(
  ctx: CanvasRenderingContext2D,
  z: TerrainZone,
  nowMs: number
): void {
  const sy = z.y * ISO_TILT;
  const rx = z.rx;
  const ry = z.ry * ISO_TILT;

  ctx.save();
  if (z.kind === 'high_ground') {
    const elev = 18;
    // Drop shadow around cliff base
    ctx.fillStyle = 'rgba(0,0,0,0.42)';
    ctx.beginPath();
    ctx.ellipse(z.x, sy + 10, rx + 10, ry + 8, 0, 0, Math.PI * 2);
    ctx.fill();

    // 2.5D cliff skirt / stone wall
    const wallGrad = ctx.createLinearGradient(z.x, sy - elev, z.x, sy + ry);
    wallGrad.addColorStop(0, '#475569');
    wallGrad.addColorStop(0.6, '#334155');
    wallGrad.addColorStop(1, '#1E293B');
    ctx.fillStyle = wallGrad;
    ctx.beginPath();
    ctx.ellipse(z.x, sy, rx, ry, 0, 0, Math.PI);
    ctx.lineTo(z.x - rx, sy - elev);
    ctx.ellipse(z.x, sy - elev, rx, ry, 0, Math.PI, 0, true);
    ctx.closePath();
    ctx.fill();

    // Elevated top plateau
    const topGrad = ctx.createRadialGradient(
      z.x - rx * 0.2,
      sy - elev - ry * 0.2,
      20,
      z.x,
      sy - elev,
      rx
    );
    topGrad.addColorStop(0, '#64748B');
    topGrad.addColorStop(0.75, '#475569');
    topGrad.addColorStop(1, '#334155');
    ctx.fillStyle = topGrad;
    ctx.beginPath();
    ctx.ellipse(z.x, sy - elev, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();

    // Rim highlight + carved rune edge
    ctx.strokeStyle = 'rgba(226, 232, 240, 0.45)';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.ellipse(z.x, sy - elev, rx - 1, ry - 1, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
    return;
  }

  if (z.kind === 'water_puddle') {
    ctx.fillStyle = 'rgba(15, 23, 42, 0.45)';
    ctx.beginPath();
    ctx.ellipse(z.x, sy + 2, rx + 5, ry + 4, 0, 0, Math.PI * 2);
    ctx.fill();

    const g = ctx.createRadialGradient(z.x, sy, 12, z.x, sy, rx);
    g.addColorStop(0, 'rgba(14, 165, 233, 0.56)');
    g.addColorStop(0.7, 'rgba(2, 132, 199, 0.44)');
    g.addColorStop(1, 'rgba(12, 74, 110, 0.16)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(z.x, sy, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();

    const wave = (Math.sin(nowMs * 0.003 + z.seed * 20) + 1) * 0.5;
    ctx.strokeStyle = `rgba(186, 230, 253, ${0.22 + wave * 0.2})`;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.ellipse(z.x, sy, rx * (0.45 + wave * 0.25), ry * (0.45 + wave * 0.25), 0, 0, Math.PI * 2);
    ctx.stroke();
  } else if (z.kind === 'lava_pool') {
    ctx.fillStyle = 'rgba(24, 12, 8, 0.72)';
    ctx.beginPath();
    ctx.ellipse(z.x, sy, rx + 7, ry + 5, 0, 0, Math.PI * 2);
    ctx.fill();

    const pulse = 0.88 + Math.sin(nowMs * 0.005 + z.seed * 12) * 0.12;
    const g = ctx.createRadialGradient(z.x, sy, 10, z.x, sy, rx * pulse);
    g.addColorStop(0, 'rgba(253, 224, 71, 0.78)');
    g.addColorStop(0.42, 'rgba(249, 115, 22, 0.72)');
    g.addColorStop(0.85, 'rgba(185, 28, 28, 0.52)');
    g.addColorStop(1, 'rgba(69, 10, 10, 0.15)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(z.x, sy, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
  } else if (z.kind === 'poison_swamp') {
    const g = ctx.createRadialGradient(z.x, sy, 12, z.x, sy, rx);
    g.addColorStop(0, 'rgba(132, 204, 22, 0.45)');
    g.addColorStop(0.65, 'rgba(77, 124, 15, 0.48)');
    g.addColorStop(1, 'rgba(20, 83, 45, 0.12)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(z.x, sy, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();

    for (let i = 0; i < 4; i++) {
      const bt = (nowMs * 0.0008 + z.seed * (i + 1) * 3.1) % 1;
      const bx = z.x + Math.sin(i * 2.1 + z.seed * 10) * rx * 0.5;
      const by = sy + Math.cos(i * 1.7 + z.seed * 7) * ry * 0.45;
      ctx.strokeStyle = `rgba(190, 242, 100, ${(1 - bt) * 0.55})`;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.arc(bx, by, 4 + bt * 11, 0, Math.PI * 2);
      ctx.stroke();
    }
  } else {
    const g = ctx.createRadialGradient(z.x, sy, 14, z.x, sy, rx);
    g.addColorStop(0, 'rgba(52, 211, 153, 0.34)');
    g.addColorStop(0.7, 'rgba(16, 185, 129, 0.24)');
    g.addColorStop(1, 'rgba(6, 95, 70, 0.04)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(z.x, sy, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();

    for (let i = 0; i < 12; i++) {
      const a = i * 2.399 + z.seed * 12;
      const dist = ((i + 0.5) / 12) * 0.78;
      const fx = z.x + Math.cos(a) * rx * dist;
      const fy = sy + Math.sin(a) * ry * dist;
      ctx.fillStyle = i % 3 === 0 ? '#F9A8D4' : i % 3 === 1 ? '#FDE047' : '#A7F3D0';
      ctx.beginPath();
      ctx.arc(fx, fy, 3.2, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

export function drawMapObstacle(
  ctx: CanvasRenderingContext2D,
  o: MapObstacle,
  themeStyle: BiomeDef['themeStyle'],
  playerX: number,
  playerY: number,
  nowMs: number,
  graveHandTriggered: boolean
): void {
  const sy = o.y * ISO_TILT;
  const sc = o.scale;
  const behindFade =
    playerY < o.y &&
    Math.abs(playerX - o.x) < o.r + 34 &&
    o.y - playerY < 130 * sc
      ? 0.44
      : 1;

  ctx.save();
  ctx.translate(o.x, sy);
  ctx.globalAlpha = behindFade;

  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  ctx.beginPath();
  ctx.ellipse(0, 4, o.r * 1.02, o.r * ISO_TILT * 0.96, 0, 0, Math.PI * 2);
  ctx.fill();

  const stoneBase =
    themeStyle === 'volcano'
      ? '#44403C'
      : themeStyle === 'crypt'
        ? '#475569'
        : themeStyle === 'sea'
          ? '#64748B'
          : themeStyle === 'void'
            ? '#3B0764'
            : '#57534E';
  const stoneLight =
    themeStyle === 'volcano'
      ? '#78716C'
      : themeStyle === 'crypt'
        ? '#94A3B8'
        : themeStyle === 'void'
          ? '#6B21A8'
          : '#A8A29E';

  if (o.kind === 'rock') {
    const r = o.r;
    const g = ctx.createLinearGradient(0, -r * 1.4, 0, r * 0.3);
    g.addColorStop(0, stoneLight);
    g.addColorStop(1, stoneBase);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(-r * 0.92, 4);
    ctx.lineTo(-r * 0.75, -r * 0.9);
    ctx.lineTo(-r * 0.1, -r * 1.35);
    ctx.lineTo(r * 0.65, -r * 1.0);
    ctx.lineTo(r * 0.95, 2);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(15,23,42,0.55)';
    ctx.lineWidth = 2;
    ctx.stroke();

    if (themeStyle === 'volcano') {
      ctx.strokeStyle = 'rgba(249, 115, 22, 0.72)';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(-r * 0.35, -r * 0.65);
      ctx.lineTo(0, -r * 0.25);
      ctx.lineTo(r * 0.35, -r * 0.55);
      ctx.stroke();
    }
  } else if (o.kind === 'pillar') {
    const r = o.r;
    const h = 76 * sc;
    ctx.fillStyle = stoneBase;
    ctx.fillRect(-r * 0.85, -h, r * 1.7, h + 4);
    ctx.fillStyle = stoneLight;
    ctx.fillRect(-r * 0.98, -h - 8, r * 1.96, 12);
    ctx.fillRect(-r * 0.98, -4, r * 1.96, 10);
    ctx.strokeStyle = themeStyle === 'void' ? 'rgba(192, 132, 252, 0.75)' : 'rgba(226, 232, 240, 0.25)';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(-r * 0.85, -h, r * 1.7, h + 4);
  } else if (o.kind === 'bigTree') {
    const r = o.r;
    ctx.fillStyle = themeStyle === 'crypt' ? '#27272A' : '#451A03';
    ctx.fillRect(-r * 0.32, -38 * sc, r * 0.64, 42 * sc);

    const leafCol =
      themeStyle === 'volcano'
        ? '#7F1D1D'
        : themeStyle === 'crypt'
          ? '#1E293B'
          : themeStyle === 'void'
            ? '#4C1D95'
            : themeStyle === 'sea'
              ? '#0F766E'
              : '#14532D';
    const leafTop =
      themeStyle === 'volcano'
        ? '#B91C1C'
        : themeStyle === 'crypt'
          ? '#334155'
          : themeStyle === 'void'
            ? '#7E22CE'
            : themeStyle === 'sea'
              ? '#14B8A6'
              : '#16A34A';

    ctx.fillStyle = leafCol;
    ctx.beginPath();
    ctx.arc(0, -56 * sc, r * 1.25, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = leafTop;
    ctx.beginPath();
    ctx.arc(-6, -66 * sc, r * 0.95, 0, Math.PI * 2);
    ctx.fill();

    if (o.hasGlowingEyes) {
      const blink = 0.7 + Math.sin(nowMs * 0.008) * 0.3;
      ctx.fillStyle = `rgba(239, 68, 68, ${blink})`;
      ctx.beginPath();
      ctx.ellipse(-7, -36 * sc, 3.6, 2.2, 0.15, 0, Math.PI * 2);
      ctx.ellipse(7, -36 * sc, 3.6, 2.2, -0.15, 0, Math.PI * 2);
      ctx.fill();
    }
  } else {
    const r = o.r;
    ctx.fillStyle = stoneBase;
    ctx.fillRect(-r * 0.85, -52 * sc, r * 0.55, 56 * sc);
    ctx.fillRect(r * 0.3, -40 * sc, r * 0.55, 44 * sc);
    ctx.fillStyle = stoneLight;
    ctx.fillRect(-r * 0.92, -56 * sc, r * 1.3, 12);
    ctx.strokeStyle = 'rgba(15, 23, 42, 0.6)';
    ctx.lineWidth = 1.8;
    ctx.strokeRect(-r * 0.92, -56 * sc, r * 1.3, 12);
  }

  if (o.hasGraveHand) {
    const pulse = Math.sin(nowMs * 0.007) * 0.5 + 0.5;
    if (graveHandTriggered) {
      ctx.strokeStyle = 'rgba(226, 232, 240, 0.92)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(o.r * 0.45, 6);
      ctx.lineTo(o.r * 0.75, -18);
      ctx.lineTo(o.r * 0.62, -26);
      ctx.moveTo(o.r * 0.75, -18);
      ctx.lineTo(o.r * 0.88, -24);
      ctx.stroke();
    } else {
      ctx.strokeStyle = `rgba(148, 163, 184, ${0.22 + pulse * 0.25})`;
      ctx.lineWidth = 1.4;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.ellipse(0, 4, o.r + 22, (o.r + 22) * ISO_TILT, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }

  ctx.restore();
}

export function drawBreakableProp(
  ctx: CanvasRenderingContext2D,
  b: BreakableProp,
  hits: number,
  maxHits: number,
  nowMs: number,
  fogGlow: boolean
): void {
  const sy = b.y * ISO_TILT;
  ctx.save();
  ctx.translate(b.x, sy);

  if (fogGlow) {
    ctx.strokeStyle = `rgba(250, 204, 21, ${0.45 + Math.sin(nowMs * 0.008) * 0.25})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(0, 2, 24, 17, 0, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.beginPath();
  ctx.ellipse(0, 4, 17, 11, 0, 0, Math.PI * 2);
  ctx.fill();

  if (b.kind === 'barrel') {
    ctx.fillStyle = '#78350F';
    ctx.fillRect(-13, -24, 26, 26);
    ctx.fillStyle = '#92400E';
    ctx.beginPath();
    ctx.ellipse(0, -24, 13, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#64748B';
    ctx.fillRect(-13, -18, 26, 3);
    ctx.fillRect(-13, -8, 26, 3);
  } else if (b.kind === 'coffin') {
    ctx.fillStyle = '#334155';
    ctx.beginPath();
    ctx.moveTo(-11, -30);
    ctx.lineTo(11, -30);
    ctx.lineTo(14, -14);
    ctx.lineTo(9, 4);
    ctx.lineTo(-9, 4);
    ctx.lineTo(-14, -14);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#94A3B8';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  } else if (b.kind === 'crystal') {
    const g = ctx.createLinearGradient(0, -34, 0, 4);
    g.addColorStop(0, '#38BDF8');
    g.addColorStop(1, '#1D4ED8');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(0, -34);
    ctx.lineTo(13, -12);
    ctx.lineTo(7, 4);
    ctx.lineTo(-9, 4);
    ctx.lineTo(-14, -14);
    ctx.closePath();
    ctx.fill();
  } else {
    ctx.fillStyle = '#B45309';
    ctx.beginPath();
    ctx.ellipse(0, -10, 12, 13, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#D97706';
    ctx.fillRect(-6, -25, 12, 6);
  }

  if (hits > 0 && hits < maxHits) {
    ctx.strokeStyle = '#FEF08A';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(-5, -20);
    ctx.lineTo(2, -12);
    ctx.lineTo(-3, -4);
    ctx.stroke();
  }
  ctx.restore();
}

export function drawMapTrap(
  ctx: CanvasRenderingContext2D,
  t: MapTrap,
  state: TrapRuntimeState | undefined,
  nowMs: number
): void {
  const sy = t.y * ISO_TILT;
  const used = Boolean(state?.used);
  const cd = state?.cooldown ?? 0;
  const active = (state?.activeTimer ?? 0) > 0;
  const pulse = 0.55 + Math.sin(nowMs * 0.008) * 0.35;

  ctx.save();
  ctx.translate(t.x, sy);

  if (t.kind === 'bomb_barrel') {
    if (used) {
      ctx.fillStyle = 'rgba(24, 24, 27, 0.55)';
      ctx.beginPath();
      ctx.ellipse(0, 2, 16, 11, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      return;
    }
    ctx.strokeStyle = `rgba(239, 68, 68, ${0.18 + pulse * 0.22})`;
    ctx.lineWidth = 1.4;
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    ctx.ellipse(0, 0, 140, 140 * ISO_TILT, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = '#991B1B';
    ctx.fillRect(-13, -25, 26, 26);
    ctx.fillStyle = '#EF4444';
    ctx.beginPath();
    ctx.ellipse(0, -25, 13, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#FACC15';
    ctx.fillRect(-4, -18, 8, 10);
  } else if (t.kind === 'spike_trap') {
    ctx.fillStyle = '#334155';
    ctx.beginPath();
    ctx.ellipse(0, 0, 26, 18, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = active ? '#EF4444' : 'rgba(148,163,184,0.45)';
    ctx.lineWidth = 1.6;
    ctx.stroke();
    ctx.fillStyle = active ? '#FCA5A5' : '#94A3B8';
    for (let i = -2; i <= 2; i++) {
      const sx = i * 9;
      ctx.beginPath();
      ctx.moveTo(sx - 3, 2);
      ctx.lineTo(sx, active ? -16 : -7);
      ctx.lineTo(sx + 3, 2);
      ctx.closePath();
      ctx.fill();
    }
  } else if (t.kind === 'lightning_pillar') {
    if (active) {
      ctx.strokeStyle = `rgba(56, 189, 248, ${0.4 + pulse * 0.4})`;
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.ellipse(0, 0, 200, 200 * ISO_TILT, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.fillStyle = cd > 0 && !active ? '#334155' : '#0EA5E9';
    ctx.fillRect(-9, -46, 18, 48);
    ctx.fillStyle = cd > 0 && !active ? '#64748B' : '#BAE6FD';
    ctx.beginPath();
    ctx.arc(0, -50, 9, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.fillStyle = '#292524';
    ctx.fillRect(-12, -22, 24, 24);
    if (!used || active) {
      ctx.fillStyle = `rgba(249, 115, 22, ${0.7 + pulse * 0.3})`;
      ctx.beginPath();
      ctx.arc(0, -26, 11, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#FDE047';
      ctx.beginPath();
      ctx.arc(0, -27, 6, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.restore();
}

export function drawRitualFireLine(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  life: number,
  nowMs: number
): void {
  ctx.save();
  const alpha = Math.min(1, life * 1.2);
  ctx.lineCap = 'round';
  ctx.strokeStyle = `rgba(249, 115, 22, ${0.55 * alpha})`;
  ctx.lineWidth = 38 + Math.sin(nowMs * 0.02) * 5;
  ctx.beginPath();
  ctx.moveTo(x1, y1 * ISO_TILT);
  ctx.lineTo(x2, y2 * ISO_TILT);
  ctx.stroke();

  ctx.strokeStyle = `rgba(253, 224, 71, ${0.78 * alpha})`;
  ctx.lineWidth = 14;
  ctx.beginPath();
  ctx.moveTo(x1, y1 * ISO_TILT);
  ctx.lineTo(x2, y2 * ISO_TILT);
  ctx.stroke();
  ctx.restore();
}

export function drawLandmark25D(
  ctx: CanvasRenderingContext2D,
  lm: MapLandmark,
  nowMs: number
): void {
  const sy = lm.y * ISO_TILT;
  const meta = LANDMARK_META[lm.kind];
  const color = lm.used ? '#64748B' : meta.color;
  const pulse = 0.7 + Math.sin(nowMs * 0.005) * 0.28;

  ctx.save();
  ctx.translate(lm.x, sy);

  if (!lm.used) {
    const beamGrad = ctx.createLinearGradient(0, -260, 0, 0);
    beamGrad.addColorStop(0, 'rgba(0,0,0,0)');
    beamGrad.addColorStop(1, `${color}55`);
    ctx.fillStyle = beamGrad;
    ctx.fillRect(-18, -260, 36, 260);
  }

  ctx.strokeStyle = lm.used ? 'rgba(100,116,139,0.4)' : color;
  ctx.lineWidth = lm.active ? 3 : 2;
  ctx.setLineDash([7, 5]);
  ctx.beginPath();
  ctx.ellipse(0, 0, lm.radius, lm.radius * ISO_TILT, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);

  if (!lm.used && lm.maxProgress > 0 && lm.progress > 0) {
    const ratio = Math.min(1, lm.progress / lm.maxProgress);
    ctx.strokeStyle = '#FACC15';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.ellipse(
      0,
      0,
      lm.radius - 4,
      (lm.radius - 4) * ISO_TILT,
      0,
      -Math.PI / 2,
      -Math.PI / 2 + Math.PI * 2 * ratio
    );
    ctx.stroke();
  }

  if (lm.kind === 'abandoned_tower') {
    ctx.fillStyle = lm.used ? '#475569' : '#334155';
    ctx.fillRect(-20, -96, 40, 96);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(-26, -96);
    ctx.lineTo(0, -130);
    ctx.lineTo(26, -96);
    ctx.closePath();
    ctx.fill();
  } else if (lm.kind === 'monster_nest') {
    ctx.fillStyle = lm.used ? '#3F3F46' : lm.hitFlash > 0 ? '#FCA5A5' : '#881337';
    ctx.beginPath();
    ctx.ellipse(0, -14, 34, 24, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#18181B';
    ctx.beginPath();
    ctx.ellipse(0, -12, 16, 10, 0, 0, Math.PI * 2);
    ctx.fill();
    if (!lm.used && lm.maxHp > 0) {
      const ratio = Math.max(0, lm.hp / lm.maxHp);
      ctx.fillStyle = 'rgba(0,0,0,0.75)';
      ctx.fillRect(-28, -48, 56, 7);
      ctx.fillStyle = '#F43F5E';
      ctx.fillRect(-28, -48, 56 * ratio, 7);
    }
  } else if (lm.kind === 'cursed_statue') {
    ctx.fillStyle = '#475569';
    ctx.fillRect(-18, -16, 36, 18);
    ctx.fillStyle = lm.used ? '#64748B' : '#9333EA';
    ctx.fillRect(-11, -76, 22, 60);
    ctx.beginPath();
    ctx.arc(0, -84, 12, 0, Math.PI * 2);
    ctx.fill();
  } else if (lm.kind === 'sealed_chest') {
    ctx.fillStyle = '#78350F';
    ctx.fillRect(-22, -26, 44, 26);
    ctx.fillStyle = lm.used ? '#64748B' : '#F59E0B';
    ctx.fillRect(-24, -30, 48, 8);
  } else if (lm.kind === 'stone_circle') {
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      const px = Math.cos(a) * 44;
      const py = Math.sin(a) * 44 * ISO_TILT;
      ctx.fillStyle = lm.used ? '#475569' : '#10B981';
      ctx.fillRect(px - 6, py - 24, 12, 24);
    }
  } else if (lm.kind === 'merchant') {
    ctx.fillStyle = '#92400E';
    ctx.fillRect(-26, -34, 52, 34);
    ctx.fillStyle = lm.used ? '#64748B' : '#F59E0B';
    ctx.beginPath();
    ctx.moveTo(-32, -34);
    ctx.lineTo(0, -56);
    ctx.lineTo(32, -34);
    ctx.closePath();
    ctx.fill();
  } else {
    ctx.fillStyle = '#3F3F46';
    ctx.fillRect(-18, -22, 36, 22);
    ctx.fillStyle = lm.used ? '#64748B' : `rgba(225, 29, 72, ${pulse})`;
    ctx.beginPath();
    ctx.arc(0, -34, 13, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.font = '700 12px "Noto Sans Thai", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = lm.used ? '#94A3B8' : '#F8FAFC';
  ctx.fillText(lm.used ? `${meta.nameTh} (ใช้แล้ว)` : meta.nameTh, 0, -102);

  ctx.restore();
}

export function drawDimensionPortal25D(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  remaining: number,
  nowMs: number,
  isReturnPortal: boolean
): void {
  const sy = y * ISO_TILT;
  const spin = nowMs * 0.004;
  ctx.save();
  ctx.translate(x, sy);

  const r = 42 + Math.sin(nowMs * 0.006) * 4;
  const g = ctx.createRadialGradient(0, -28, 6, 0, -28, r);
  g.addColorStop(0, isReturnPortal ? 'rgba(52, 211, 153, 0.9)' : 'rgba(192, 132, 252, 0.92)');
  g.addColorStop(0.55, isReturnPortal ? 'rgba(16, 185, 129, 0.45)' : 'rgba(126, 34, 206, 0.5)');
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.ellipse(0, -28, r * 0.78, r * 1.15, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = isReturnPortal ? '#6EE7B7' : '#E879F9';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.ellipse(0, -28, 26, 40, 0, spin, spin + Math.PI * 1.65);
  ctx.stroke();

  ctx.font = '700 12px "Noto Sans Thai", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = '#F8FAFC';
  ctx.fillText(
    isReturnPortal ? 'ประตูกลับแผนที่หลัก' : `ประตูมิติลับ (${Math.ceil(remaining)}ว)`,
    0,
    -78
  );
  ctx.restore();
}

export function drawTreasureCart25D(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  hp: number,
  maxHp: number,
  facingX: number,
  nowMs: number
): void {
  const sy = y * ISO_TILT;
  const bounce = Math.abs(Math.sin(nowMs * 0.015)) * 3;
  ctx.save();
  ctx.translate(x, sy - bounce);

  ctx.fillStyle = 'rgba(0,0,0,0.42)';
  ctx.beginPath();
  ctx.ellipse(0, 8 + bounce, 30, 18, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#92400E';
  ctx.fillRect(-26, -24, 52, 24);
  ctx.fillStyle = '#FACC15';
  ctx.beginPath();
  ctx.arc(-8, -26, 11, 0, Math.PI * 2);
  ctx.arc(8, -25, 10, 0, Math.PI * 2);
  ctx.arc(0, -32, 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#1E293B';
  ctx.beginPath();
  ctx.arc(-16, 2, 8, 0, Math.PI * 2);
  ctx.arc(16, 2, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#16A34A';
  ctx.beginPath();
  ctx.arc(facingX >= 0 ? 18 : -18, -32, 8, 0, Math.PI * 2);
  ctx.fill();

  const ratio = Math.max(0, hp / Math.max(1, maxHp));
  ctx.fillStyle = 'rgba(0,0,0,0.8)';
  ctx.fillRect(-28, -52, 56, 7);
  ctx.fillStyle = '#FBBF24';
  ctx.fillRect(-28, -52, 56 * ratio, 7);
  ctx.restore();
}

export function drawSecretRoomPerimeter(
  ctx: CanvasRenderingContext2D,
  kind: SecretRoomKind,
  nowMs: number
): void {
  const hw = SECRET_ROOM_HALF_W;
  const hh = SECRET_ROOM_HALF_H * ISO_TILT;
  const accent =
    kind === 'treasure'
      ? '#FBBF24'
      : kind === 'elite_arena'
        ? '#F43F5E'
        : kind === 'secret_shop'
          ? '#A855F7'
          : kind === 'cursed_horde'
            ? '#DC2626'
            : '#38BDF8';

  ctx.save();
  ctx.fillStyle = '#0F0D18';
  ctx.fillRect(-hw - 600, -hh - 600, (hw + 600) * 2, (hh + 600) * 2);

  ctx.fillStyle = '#1C1629';
  ctx.fillRect(-hw, -hh, hw * 2, hh * 2);

  ctx.strokeStyle = 'rgba(148, 163, 184, 0.14)';
  ctx.lineWidth = 1;
  for (let gx = -hw; gx <= hw; gx += 60) {
    ctx.beginPath();
    ctx.moveTo(gx, -hh);
    ctx.lineTo(gx, hh);
    ctx.stroke();
  }
  for (let gy = -hh; gy <= hh; gy += 60 * ISO_TILT) {
    ctx.beginPath();
    ctx.moveTo(-hw, gy);
    ctx.lineTo(hw, gy);
    ctx.stroke();
  }

  ctx.strokeStyle = accent;
  ctx.globalAlpha = 0.55 + Math.sin(nowMs * 0.004) * 0.2;
  ctx.lineWidth = 4;
  ctx.strokeRect(-hw, -hh, hw * 2, hh * 2);
  ctx.restore();
}

export function drawShrinkingRingOverlay(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  nowMs: number
): void {
  const sy = cy * ISO_TILT;
  const ry = radius * ISO_TILT;
  ctx.save();
  ctx.fillStyle = 'rgba(220, 38, 38, 0.22)';
  ctx.beginPath();
  ctx.rect(cx - 2500, sy - 2500, 5000, 5000);
  ctx.ellipse(cx, sy, radius, ry, 0, 0, Math.PI * 2, true);
  ctx.fill();

  ctx.strokeStyle = `rgba(248, 113, 113, ${0.75 + Math.sin(nowMs * 0.012) * 0.25})`;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.ellipse(cx, sy, radius, ry, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

export function drawMeteorTelegraph(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  progress: number,
  isLavaRock: boolean
): void {
  const sy = y * ISO_TILT;
  const ry = radius * ISO_TILT;
  ctx.save();
  ctx.fillStyle = isLavaRock ? 'rgba(249, 115, 22, 0.22)' : 'rgba(239, 68, 68, 0.22)';
  ctx.beginPath();
  ctx.ellipse(x, sy, radius, ry, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = isLavaRock ? '#FB923C' : '#F87171';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.ellipse(x, sy, radius, ry, 0, 0, Math.PI * 2);
  ctx.stroke();

  const inner = Math.max(0.05, progress);
  ctx.fillStyle = isLavaRock ? 'rgba(251, 146, 60, 0.42)' : 'rgba(239, 68, 68, 0.42)';
  ctx.beginPath();
  ctx.ellipse(x, sy, radius * inner, ry * inner, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

export function drawEarthSplitFissure(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  angle: number,
  length: number,
  active: boolean,
  nowMs: number
): void {
  const dx = Math.cos(angle) * (length * 0.5);
  const dy = Math.sin(angle) * (length * 0.5);
  ctx.save();
  ctx.lineCap = 'round';
  ctx.strokeStyle = active
    ? `rgba(239, 68, 68, ${0.65 + Math.sin(nowMs * 0.015) * 0.25})`
    : 'rgba(245, 158, 11, 0.45)';
  ctx.lineWidth = active ? 34 : 20;
  ctx.beginPath();
  ctx.moveTo(x - dx, (y - dy) * ISO_TILT);
  ctx.lineTo(x + dx, (y + dy) * ISO_TILT);
  ctx.stroke();

  if (active) {
    ctx.strokeStyle = '#FDE047';
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.moveTo(x - dx, (y - dy) * ISO_TILT);
    ctx.lineTo(x + dx, (y + dy) * ISO_TILT);
    ctx.stroke();
  }
  ctx.restore();
}

export function drawNightFogOverlay(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  playerScreenX: number,
  playerScreenY: number,
  beacons: { x: number; y: number; color: string }[]
): void {
  ctx.save();
  const visionR = 350;
  const g = ctx.createRadialGradient(
    playerScreenX,
    playerScreenY,
    visionR * 0.52,
    playerScreenX,
    playerScreenY,
    visionR
  );
  g.addColorStop(0, 'rgba(3, 5, 16, 0)');
  g.addColorStop(0.7, 'rgba(3, 5, 16, 0.72)');
  g.addColorStop(1, 'rgba(3, 5, 16, 0.92)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);

  for (const b of beacons) {
    if (b.x < -30 || b.x > w + 30 || b.y < -30 || b.y > h + 30) continue;
    ctx.fillStyle = b.color;
    ctx.beginPath();
    ctx.arc(b.x, b.y, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }
  ctx.restore();
}

export function drawOffscreenArrow(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  camWorldX: number,
  camScreenY: number,
  targetWorldX: number,
  targetWorldY: number,
  labelTh: string,
  distMeters: number,
  color: string,
  nowMs: number
): void {
  const sx = targetWorldX - camWorldX;
  const sy = targetWorldY * ISO_TILT - camScreenY;
  const margin = 44;
  if (sx >= margin && sx <= w - margin && sy >= margin + 40 && sy <= h - margin - 40) {
    return;
  }

  const cx = w * 0.5;
  const cy = h * 0.5;
  const angle = Math.atan2(sy - cy, sx - cx);
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const maxX = w * 0.5 - margin;
  const maxY = h * 0.5 - margin - 42;
  const tx = Math.abs(cos) > 0.001 ? maxX / Math.abs(cos) : Infinity;
  const ty = Math.abs(sin) > 0.001 ? maxY / Math.abs(sin) : Infinity;
  const t = Math.min(tx, ty);
  const ax = cx + cos * t;
  const ay = cy + sin * t;

  ctx.save();
  ctx.translate(ax, ay);

  const pulse = 1 + Math.sin(nowMs * 0.008) * 0.08;
  ctx.save();
  ctx.rotate(angle);
  ctx.scale(pulse, pulse);
  ctx.fillStyle = color;
  ctx.strokeStyle = '#09090B';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(14, 0);
  ctx.lineTo(-9, -9);
  ctx.lineTo(-5, 0);
  ctx.lineTo(-9, 9);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  ctx.font = '700 11px "Noto Sans Thai", sans-serif';
  ctx.textAlign = 'center';
  const text = `${labelTh} ${distMeters}m`;
  const tw = ctx.measureText(text).width + 10;
  ctx.fillStyle = 'rgba(9, 9, 11, 0.82)';
  ctx.fillRect(-tw * 0.5, 14, tw, 17);
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  ctx.strokeRect(-tw * 0.5, 14, tw, 17);
  ctx.fillStyle = '#F8FAFC';
  ctx.fillText(text, 0, 26);
  ctx.restore();
}

export function drawSaintSanctumArea(
  ctx: CanvasRenderingContext2D,
  sigils: SaintSigil[],
  areaMult: number,
  inUlt: boolean,
  nowMs: number,
  camX: number,
  camY: number,
  viewW: number,
  viewH: number
): void {
  ctx.save();
  const animT = nowMs * 0.001;

  // Full-screen radiant Sanctum overlay during Ult (ปฏิญาณแห่งสวรรค์)
  if (inUlt) {
    ctx.fillStyle = `rgba(253, 224, 71, ${0.06 + Math.sin(animT * 5) * 0.025})`;
    ctx.fillRect(camX - viewW * 0.6, (camY - viewH * 0.6) * ISO_TILT, viewW * 1.2, viewH * 1.2);
  }

  // Polygon Sanctum formed by 3+ Sigils
  if (sigils.length >= 3) {
    const poly = orderPolygonVertices(sigils);
    ctx.save();
    ctx.fillStyle = `rgba(253, 224, 71, ${0.13 + Math.sin(animT * 4) * 0.035})`;
    ctx.strokeStyle = 'rgba(254, 240, 138, 0.85)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    poly.forEach((pt, idx) => {
      const sy = worldToIsoY(pt.y);
      if (idx === 0) ctx.moveTo(pt.x, sy);
      else ctx.lineTo(pt.x, sy);
    });
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Inner holy perimeter glow
    ctx.setLineDash([12, 8]);
    ctx.lineDashOffset = -nowMs * 0.04;
    ctx.strokeStyle = 'rgba(250, 204, 21, 0.65)';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();

    // Draw sanctum aura at polygon centroid
    let cx = 0;
    let cy = 0;
    let maxSpan = 128;
    for (const pt of poly) {
      cx += pt.x;
      cy += pt.y;
    }
    cx /= poly.length;
    cy /= poly.length;
    for (const pt of poly) {
      maxSpan = Math.max(maxSpan, Math.hypot(pt.x - cx, pt.y - cy) * 2);
    }
    drawPackVfx(ctx, 'saint_sanctum', cx, worldToIsoY(cy), animT, {
      scale: Math.min(3.4, maxSpan / 128),
      squashY: ISO_TILT,
      alpha: 0.72,
    });
  }

  // Individual Holy Sigil ground circles (90px * areaMult)
  const sigilR = 90 * areaMult;
  for (const sig of sigils) {
    const sx = sig.x;
    const sy = worldToIsoY(sig.y);
    const ratio = Math.max(0, Math.min(1, sig.life / Math.max(1, sig.maxLife)));

    ctx.save();
    ctx.translate(sx, sy);
    ctx.scale(1, ISO_TILT);

    // Subtle pulsing gold aura
    const grad = ctx.createRadialGradient(0, 0, 8, 0, 0, sigilR);
    grad.addColorStop(0, 'rgba(254, 240, 138, 0.28)');
    grad.addColorStop(0.7, 'rgba(250, 204, 21, 0.14)');
    grad.addColorStop(1, 'rgba(250, 204, 21, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(0, 0, sigilR, 0, Math.PI * 2);
    ctx.fill();

    const drewSigil = drawPackVfx(ctx, 'saint_sigil', 0, 0, animT, {
      scale: (sigilR * 1.9) / 48,
      alpha: Math.max(0.45, ratio),
    });

    if (!drewSigil) {
      // Outer rune ring + duration arc fallback
      ctx.strokeStyle = 'rgba(253, 224, 71, 0.45)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, sigilR * 0.72, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = '#FEF08A';
      ctx.lineWidth = 3.2;
      ctx.beginPath();
      ctx.arc(0, 0, 26, -Math.PI * 0.5, -Math.PI * 0.5 + Math.PI * 2 * ratio);
      ctx.stroke();

      // Cross glyph
      ctx.strokeStyle = '#FACC15';
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.moveTo(0, -14);
      ctx.lineTo(0, 14);
      ctx.moveTo(-10, -4);
      ctx.lineTo(10, -4);
      ctx.stroke();
    }

    ctx.restore();
  }

  ctx.restore();
}

export function drawKnightSacredBladesWorld(
  ctx: CanvasRenderingContext2D,
  blades: KnightSacredBlade[],
  inUlt: boolean,
  nowMs: number,
  finaleProgress = -1
): void {
  if (blades.length === 0) return;
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  const animT = nowMs * 0.001;

  for (let i = 0; i < blades.length; i++) {
    const b = blades[i];
    const bobOffset = b.state === 'orbit' ? Math.sin((animT - i * 0.1) * 4.5) * 4 : 0;
    const sx = b.x;
    const sy = worldToIsoY(b.y) - 24 + bobOffset;

    // 6-frame golden trail during striking
    if (b.trail && b.trail.length > 1) {
      for (let ti = 0; ti < b.trail.length; ti++) {
        const tp = b.trail[ti];
        const ratio = (ti + 1) / b.trail.length;
        ctx.save();
        ctx.globalAlpha = ratio * 0.45;
        ctx.fillStyle = '#ffd75e';
        const tx = tp.x;
        const ty = worldToIsoY(tp.y) - 24;
        ctx.fillRect(Math.round(tx - 3 * ratio), Math.round(ty - 8 * ratio), Math.max(2, Math.round(6 * ratio)), Math.max(4, Math.round(16 * ratio)));
        ctx.restore();
      }
    }

    let angle = 0; // Upright in fan rest (Section 2: "หันปลายขึ้น")
    if (b.state === 'striking' || b.state === 'windup') {
      const targetAng = Math.atan2(worldToIsoY(b.targetY) - sy, b.targetX - sx) + Math.PI * 0.5;
      if (b.state === 'windup') {
        const windT = Math.max(0, Math.min(1, 1 - (b.stateTimer ?? 0) / 0.12));
        angle = targetAng * windT;
      } else {
        angle = targetAng;
      }
    } else if (b.state === 'returning') {
      const retT = Math.max(0, Math.min(1, (b.stateTimer ?? 0) / 0.3));
      const targetAng = Math.atan2(worldToIsoY(b.targetY) - sy, b.targetX - sx) + Math.PI * 0.5;
      angle = targetAng * retT;
    } else if (b.state === 'spawning') {
      const spT = Math.max(0, Math.min(1, (b.spawnTimer ?? 0) / 0.45));
      angle = (1 - spT) * Math.PI * 2;
    } else if (b.state === 'finale_up' || b.state === 'finale_planted') {
      angle = b.state === 'finale_planted' ? Math.PI : 0;
    } else if (finaleProgress >= 0) {
      angle = finaleProgress >= 0.55 ? Math.PI : 0;
    }

    const scale = inUlt ? 1.6 : b.tempLife > 0 ? 1.05 : 1.0;

    ctx.save();
    ctx.translate(sx, sy);
    ctx.scale(scale, scale);

    // Spawning overhead light flare
    if (b.state === 'spawning') {
      ctx.fillStyle = 'rgba(255, 251, 224, 0.55)';
      ctx.fillRect(-3, -38, 6, 40);
    }

    // Aura glow
    ctx.fillStyle = inUlt || b.state === 'striking' || b.state === 'windup' ? 'rgba(255, 215, 94, 0.28)' : 'rgba(59, 143, 217, 0.2)';
    ctx.beginPath();
    ctx.ellipse(0, 0, 14, 14, 0, 0, Math.PI * 2);
    ctx.fill();

    const whiteFlash = (b.whiteFlash || 0) > 0;
    const drewBlade = drawPackVfx(ctx, 'knight_sacred_blade', 0, 0, animT + i * 0.12, {
      scale: 1.5,
      angle,
      alpha: whiteFlash ? 1 : 0.96,
    });
    if (!drewBlade || whiteFlash) {
      ctx.rotate(angle);
      ctx.fillStyle = whiteFlash ? '#ffffff' : inUlt ? '#fffbe0' : '#ffd75e';
      ctx.fillRect(-3, -18, 6, 26);
      ctx.fillStyle = whiteFlash ? '#ffffff' : '#3b8fd9';
      ctx.fillRect(-6, 6, 12, 3);
      ctx.fillRect(-2, 9, 4, 6);
    }

    ctx.restore();
  }

  ctx.restore();
}

export function drawTauntTethers(
  ctx: CanvasRenderingContext2D,
  lines: Array<{ x1: number; y1: number; x2: number; y2: number; color: string }>,
  nowMs: number
): void {
  if (lines.length === 0) return;
  ctx.save();
  ctx.lineWidth = 1.6;
  ctx.setLineDash([6, 6]);
  ctx.lineDashOffset = -nowMs * 0.05;
  for (const ln of lines) {
    ctx.strokeStyle = ln.color;
    ctx.beginPath();
    ctx.moveTo(ln.x1, worldToIsoY(ln.y1) - 10);
    ctx.lineTo(ln.x2, worldToIsoY(ln.y2) - 12);
    ctx.stroke();
  }
  ctx.setLineDash([]);
  ctx.restore();
}

export function drawReaperSweepTelegraph(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  angle: number,
  arcRad: number,
  radius: number,
  progress: number,
  isExecuting: boolean,
  nowMs: number
): void {
  ctx.save();
  const halfArc = arcRad * 0.5;
  const startA = angle - halfArc;
  const endA = angle + halfArc;

  if (!isExecuting) {
    const clamped = Math.max(0, Math.min(1, progress));
    const pulse = 0.75 + Math.sin(nowMs * 0.018) * 0.25;

    // Outer danger sector
    ctx.fillStyle = `rgba(225, 29, 72, ${(0.14 + clamped * 0.14).toFixed(3)})`;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.arc(x, y, radius, startA, endA);
    ctx.closePath();
    ctx.fill();

    // Expanding inner cast fill showing exact timing
    ctx.fillStyle = `rgba(244, 63, 94, ${(0.18 + clamped * 0.24).toFixed(3)})`;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.arc(x, y, Math.max(12, radius * clamped), startA, endA);
    ctx.closePath();
    ctx.fill();

    // Outer & edge border
    ctx.strokeStyle = `rgba(251, 113, 133, ${(0.65 + 0.3 * pulse).toFixed(3)})`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.arc(x, y, radius, startA, endA);
    ctx.closePath();
    ctx.stroke();

    // Sweeping scythe preview ray
    const sweepPos = startA + arcRad * clamped;
    ctx.strokeStyle = 'rgba(254, 205, 211, 0.9)';
    ctx.lineWidth = 2.4;
    ctx.setLineDash([7, 5]);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + Math.cos(sweepPos) * radius, y + Math.sin(sweepPos) * radius);
    ctx.stroke();
    ctx.setLineDash([]);

    // Caster rune ring under Reaper
    ctx.strokeStyle = '#FB7185';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.arc(x, y, 54 + Math.sin(nowMs * 0.02) * 4, 0, Math.PI * 2);
    ctx.stroke();
  } else {
    const fade = Math.max(0, Math.min(1, 1 - progress));
    ctx.fillStyle = `rgba(244, 63, 94, ${(0.42 * fade).toFixed(3)})`;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.arc(x, y, radius, startA, endA);
    ctx.closePath();
    ctx.fill();

    // Crescent slash highlight wave
    const slashR = radius * (0.55 + progress * 0.45);
    ctx.strokeStyle = `rgba(255, 228, 230, ${(0.95 * fade).toFixed(3)})`;
    ctx.lineWidth = Math.max(4, 20 * fade);
    ctx.beginPath();
    ctx.arc(x, y, slashR, startA, endA);
    ctx.stroke();

    ctx.strokeStyle = `rgba(225, 29, 72, ${(0.9 * fade).toFixed(3)})`;
    ctx.lineWidth = Math.max(6, 32 * fade);
    ctx.beginPath();
    ctx.arc(x, y, slashR * 0.92, startA, endA);
    ctx.stroke();
  }

  ctx.restore();
}

export interface RenderNecroMinionParams {
  id: number;
  kind: EnemyKind;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  hp: number;
  maxHp: number;
  life: number;
  maxLife: number;
  fealtyBuffed: boolean;
  isMiniBoss: boolean;
  hitFlash: boolean;
  nowMs: number;
}

export function drawNecroMinionSprite(
  ctx: CanvasRenderingContext2D,
  m: RenderNecroMinionParams
): void {
  const isoY = worldToIsoY(m.y);
  ctx.save();

  // Necrotic ground ring (emerald-teal for normal Minion, royal violet+gold for Fealty)
  const ringR = m.radius + (m.isMiniBoss ? 8 : 5);
  ctx.save();
  ctx.translate(m.x, isoY + m.radius * 0.45);
  ctx.scale(1, 0.5);
  ctx.strokeStyle = m.fealtyBuffed ? '#FDE047' : '#34D399';
  ctx.fillStyle = m.fealtyBuffed ? 'rgba(168, 85, 247, 0.24)' : 'rgba(16, 185, 129, 0.16)';
  ctx.lineWidth = m.fealtyBuffed ? 2.4 : 1.7;
  ctx.beginPath();
  ctx.arc(0, 0, ringR, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  if (m.fealtyBuffed) {
    ctx.strokeStyle = 'rgba(192, 132, 252, 0.85)';
    ctx.lineWidth = 1.6;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.arc(0, 0, ringR + 5, m.nowMs * 0.004, m.nowMs * 0.004 + Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }
  ctx.restore();

  // Draw the resurrected monster sprite cleanly as a spectral ally
  ctx.save();
  ctx.globalAlpha = m.fealtyBuffed ? 0.96 : 0.84;
  drawEnemySprite({
    ctx,
    kind: m.kind,
    x: m.x,
    y: isoY,
    radius: m.radius,
    hp: m.hp,
    maxHp: m.maxHp,
    hitFlash: m.hitFlash,
    frozen: false,
    isBoss: false,
    isMajorBoss: false,
    isReaper: false,
    windupTimer: 0,
    phaseAngle: m.id,
    nowMs: m.nowMs,
    vx: m.vx,
    vy: m.vy,
    id: m.id,
  });
  ctx.restore();

  // Compact Allied Minion HP bar + Timer/Fealty Crown above sprite
  const bw = Math.max(24, m.radius * 1.8);
  const barY = isoY - m.radius * 1.45 - 8;
  const hpRatio = Math.max(0, Math.min(1, m.hp / Math.max(1, m.maxHp)));
  ctx.fillStyle = 'rgba(7, 8, 13, 0.82)';
  ctx.fillRect(m.x - bw / 2, barY, bw, 4);
  ctx.fillStyle = m.fealtyBuffed ? '#C084FC' : '#34D399';
  ctx.fillRect(m.x - bw / 2, barY, bw * hpRatio, 4);

  if (m.fealtyBuffed) {
    // Golden Eternal Fealty Crown sigil
    const cy = barY - 6;
    ctx.fillStyle = '#FDE047';
    ctx.strokeStyle = '#581C87';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(m.x - 5, cy + 3);
    ctx.lineTo(m.x - 5, cy - 2);
    ctx.lineTo(m.x - 2, cy);
    ctx.lineTo(m.x, cy - 4);
    ctx.lineTo(m.x + 2, cy);
    ctx.lineTo(m.x + 5, cy - 2);
    ctx.lineTo(m.x + 5, cy + 3);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else {
    // Remaining 60s lifetime thin bar
    const lifeRatio = Math.max(0, Math.min(1, m.life / Math.max(1, m.maxLife)));
    ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
    ctx.fillRect(m.x - bw / 2, barY + 4.5, bw, 2);
    ctx.fillStyle = '#67E8F9';
    ctx.fillRect(m.x - bw / 2, barY + 4.5, bw * lifeRatio, 2);
  }

  ctx.restore();
}

export function drawKnightTauntGroundFx(
  ctx: CanvasRenderingContext2D,
  cracks: Array<{ x: number; y: number; life: number; maxLife: number }>
): void {
  if (cracks.length === 0) return;
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  for (const c of cracks) {
    const ratio = Math.max(0, Math.min(1, c.life / Math.max(0.01, c.maxLife)));
    const sy = worldToIsoY(c.y);
    ctx.save();
    ctx.translate(c.x, sy);
    ctx.globalAlpha = ratio;
    // 6 short pixel crack lines radiating outward
    for (let k = 0; k < 6; k++) {
      const a = (k * Math.PI * 2) / 6 + 0.25;
      const r0 = 16;
      const r1 = 44;
      ctx.strokeStyle = '#0e2a4a';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(Math.round(Math.cos(a) * r0), Math.round(Math.sin(a) * r0 * ISO_TILT));
      ctx.lineTo(Math.round(Math.cos(a) * r1), Math.round(Math.sin(a) * r1 * ISO_TILT));
      ctx.stroke();
      ctx.strokeStyle = '#ffd75e';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
    ctx.restore();
  }
  ctx.restore();
}

export function drawKnightExcaliburIntroOverlay(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  camWorldX: number,
  camScreenY: number,
  exX: number,
  exY: number,
  elapsed: number
): void {
  if (elapsed < 0.35 || elapsed > 1.25) return;
  const sx = exX - camWorldX;
  const sy = exY * ISO_TILT - camScreenY;
  ctx.save();
  ctx.imageSmoothingEnabled = false;

  // 0.35s - 0.85s: Narrow target sky warning beam
  if (elapsed >= 0.35 && elapsed <= 0.88) {
    const beamAlpha = elapsed < 0.7 ? 0.55 : Math.max(0, 1 - (elapsed - 0.7) / 0.18);
    ctx.fillStyle = `rgba(255, 215, 94, ${(beamAlpha * 0.42).toFixed(3)})`;
    ctx.fillRect(Math.round(sx - 6), 0, 12, Math.round(sy));
    ctx.fillStyle = `rgba(255, 251, 224, ${(beamAlpha * 0.75).toFixed(3)})`;
    ctx.fillRect(Math.round(sx - 2), 0, 4, Math.round(sy));
    ctx.strokeStyle = `rgba(255, 215, 94, ${beamAlpha.toFixed(3)})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(sx, sy, 28, 16, 0, 0, Math.PI * 2);
    ctx.stroke();
  }

  // 0.35s - 0.70s: Cloud parting golden ring at top edge + falling light feathers
  if (elapsed >= 0.35 && elapsed <= 0.78) {
    const tCloud = Math.min(1, (elapsed - 0.35) / 0.35);
    const ringW = 40 + tCloud * 130;
    ctx.strokeStyle = `rgba(255, 215, 94, ${(0.85 * (1 - tCloud * 0.3)).toFixed(3)})`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(sx, 14, ringW, 18, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Falling pixel light feathers from parted clouds
    for (let f = 0; f < 10; f++) {
      const fx = sx + Math.sin(f * 2.7) * 90;
      const fy = 16 + tCloud * (h * 0.42) + (f % 4) * 26;
      ctx.fillStyle = f % 2 === 0 ? '#fffbe0' : '#ffd75e';
      ctx.fillRect(Math.round(fx - 2), Math.round(fy), 4, 2);
      ctx.fillRect(Math.round(fx - 1), Math.round(fy + 2), 3, 2);
    }
  }

  // 0.70s - 0.85s: Giant knight_excalibur rapid drop (frames 0-3)
  if (elapsed >= 0.7 && elapsed <= 0.88) {
    const dropT = Math.max(0, Math.min(1, (elapsed - 0.7) / 0.15));
    const curY = -40 + (sy + 40) * Math.pow(dropT, 1.8);
    const frameOverride = Math.min(3, Math.floor(dropT * 4));
    const drewEx = drawPackVfx(ctx, 'knight_excalibur', sx, curY, dropT * 0.3, {
      scale: 2.35,
      frameOverride,
    });
    if (!drewEx) {
      ctx.fillStyle = '#fffbe0';
      ctx.fillRect(Math.round(sx - 8), Math.round(curY - 140), 16, 130);
      ctx.fillStyle = '#ffd75e';
      ctx.fillRect(Math.round(sx - 24), Math.round(curY - 148), 48, 10);
    }
  }

  // 0.85s - 1.20s: Ground oval golden shockwave + Excalibur planted until pulled
  if (elapsed >= 0.85 && elapsed <= 1.2) {
    const impT = (elapsed - 0.85) / 0.35;
    const rx = 30 + impT * 210;
    const ry = rx * ISO_TILT;
    ctx.strokeStyle = `rgba(255, 215, 94, ${(1 - impT).toFixed(3)})`;
    ctx.lineWidth = Math.max(2, 6 * (1 - impT));
    ctx.beginPath();
    ctx.ellipse(sx, sy, rx, ry, 0, 0, Math.PI * 2);
    ctx.stroke();

    if (elapsed < 1.05) {
      drawPackVfx(ctx, 'knight_excalibur', sx, sy + 4, 0.35, {
        scale: 2.2,
        frameOverride: 6,
      });
    }
  }

  ctx.restore();
}

export function drawKnightUltBgPillars(
  ctx: CanvasRenderingContext2D,
  pillars: Array<{ x: number; width: number; alpha: number; life: number; maxLife: number }>
): void {
  if (pillars.length === 0) return;
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  for (const p of pillars) {
    const t = Math.max(0, Math.min(1, p.life / Math.max(0.01, p.maxLife)));
    const a = p.alpha * Math.sin(t * Math.PI);
    ctx.fillStyle = `rgba(255, 215, 94, ${a.toFixed(3)})`;
    ctx.fillRect(Math.round(p.x - p.width * 0.5), 0, p.width, 900);
    ctx.fillStyle = `rgba(255, 251, 224, ${(a * 0.8).toFixed(3)})`;
    ctx.fillRect(Math.round(p.x - 1), 0, 2, 900);
  }
  ctx.restore();
}

export function drawKnightSwordCrescentWave(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  angle: number,
  len: number,
  progress: number
): void {
  const alpha = Math.max(0, 1 - progress);
  const sy = worldToIsoY(y);
  ctx.save();
  ctx.translate(x, sy);
  ctx.rotate(angle);
  ctx.globalAlpha = alpha;

  // Lingering 0.3s golden ground light streak
  ctx.fillStyle = 'rgba(255, 215, 94, 0.48)';
  ctx.fillRect(0, -6, Math.round(len), 12);
  ctx.fillStyle = '#fffbe0';
  ctx.fillRect(0, -2, Math.round(len), 4);

  // Traveling 600px golden crescent wave head
  const waveX = Math.min(len, len * Math.min(1, progress * 1.9));
  ctx.strokeStyle = '#ffd75e';
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.arc(waveX - 24, 0, 34, -1.1, 1.1);
  ctx.stroke();
  ctx.strokeStyle = '#fffbe0';
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.restore();
}

export function drawKnightUltFinaleFx(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  camWorldX: number,
  camScreenY: number,
  centerX: number,
  centerY: number,
  progress: number, // 0..1 across 1.0s ("สวรรค์พิพากษา")
  nowMs: number
): void {
  const cx = centerX - camWorldX;
  const cy = centerY * ISO_TILT - camScreenY;
  const ringR = 135;
  ctx.save();
  ctx.imageSmoothingEnabled = false;

  // Points of the 8 surrounding swords in octagon
  const pts: Array<{ x: number; y: number }> = [];
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI * 2) / 8;
    pts.push({
      x: cx + Math.cos(a) * ringR,
      y: cy + Math.sin(a) * ringR * ISO_TILT,
    });
  }

  // 0.00s - 0.30s: 8 blades shooting upward off top of screen
  if (progress < 0.35) {
    const upT = Math.min(1, progress / 0.3);
    for (let i = 0; i < 8; i++) {
      const bx = pts[i].x;
      const by = pts[i].y - upT * (h * 0.78);
      drawPackVfx(ctx, 'knight_sacred_blade', bx, by, nowMs * 0.001, { scale: 2.0, angle: 0 });
    }
  }

  // 0.30s - 0.70s: 8 ground magic circles light up around Knight
  if (progress >= 0.3 && progress <= 0.85) {
    const cAlpha = progress < 0.45 ? (progress - 0.3) / 0.15 : Math.max(0, 1 - (progress - 0.55) / 0.3);
    for (let i = 0; i < 8; i++) {
      ctx.save();
      ctx.translate(pts[i].x, pts[i].y);
      ctx.scale(1, ISO_TILT);
      ctx.strokeStyle = `rgba(255, 215, 94, ${(cAlpha * 0.92).toFixed(3)})`;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(0, 0, 26, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = `rgba(255, 251, 224, ${(cAlpha * 0.85).toFixed(3)})`;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(-14, -14, 28, 28);
      ctx.restore();
    }
  }

  // 0.55s - 0.98s: All 8 swords slam down & remain planted with short light pillars
  if (progress >= 0.52 && progress <= 0.96) {
    const slamAlpha = progress > 0.85 ? Math.max(0, 1 - (progress - 0.85) / 0.11) : 1;
    const dropFrac = Math.min(1, Math.max(0, (progress - 0.5) / 0.08));
    for (let i = 0; i < 8; i++) {
      const px = pts[i].x;
      const py = pts[i].y - (1 - dropFrac) * 260;
      ctx.save();
      ctx.globalAlpha = slamAlpha;
      // Short sky light pillar at each sword point
      if (dropFrac >= 0.95) {
        ctx.fillStyle = 'rgba(255, 215, 94, 0.35)';
        ctx.fillRect(Math.round(px - 10), Math.round(py - 120), 20, 120);
        ctx.fillStyle = 'rgba(255, 251, 224, 0.65)';
        ctx.fillRect(Math.round(px - 3), Math.round(py - 120), 6, 120);
      }
      drawPackVfx(ctx, 'knight_sacred_blade', px, py - 18, nowMs * 0.001 + i * 0.1, {
        scale: 2.2,
        angle: Math.PI,
      });
      ctx.restore();
    }
  }

  // 0.70s - 1.00s: Connecting light beams form an octagon -> burst across screen
  if (progress >= 0.7) {
    const burstT = (progress - 0.7) / 0.3;
    const lineAlpha = Math.max(0, 1 - burstT * 1.2);
    ctx.save();
    ctx.strokeStyle = `rgba(255, 251, 224, ${lineAlpha.toFixed(3)})`;
    ctx.lineWidth = 4;
    ctx.beginPath();
    for (let i = 0; i < 8; i++) {
      if (i === 0) ctx.moveTo(pts[i].x, pts[i].y);
      else ctx.lineTo(pts[i].x, pts[i].y);
    }
    ctx.closePath();
    ctx.stroke();

    // Expanding octagon screen-wide gold light burst
    const burstScale = 1 + burstT * 7.5;
    ctx.translate(cx, cy);
    ctx.scale(burstScale, burstScale * ISO_TILT);
    ctx.strokeStyle = `rgba(255, 215, 94, ${(Math.max(0, 1 - burstT) * 0.85).toFixed(3)})`;
    ctx.lineWidth = 5;
    ctx.beginPath();
    for (let i = 0; i < 8; i++) {
      const a = (i * Math.PI * 2) / 8;
      const ox = Math.cos(a) * ringR;
      const oy = Math.sin(a) * ringR;
      if (i === 0) ctx.moveTo(ox, oy);
      else ctx.lineTo(ox, oy);
    }
    ctx.closePath();
    ctx.stroke();
    ctx.restore();

    // Subtle full-screen golden flash at 0.70-0.82s
    if (burstT < 0.45) {
      ctx.fillStyle = `rgba(255, 251, 224, ${((1 - burstT / 0.45) * 0.28).toFixed(3)})`;
      ctx.fillRect(0, 0, w, h);
    }
  }

  ctx.restore();
}




