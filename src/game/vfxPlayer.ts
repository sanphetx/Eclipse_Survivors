// Eclipse Survivors — pixel VFX player (canvas 2D).
// Works with VFX_SHEETS from vfxAtlas.ts (embedded PNGs), or with PNGs placed in public/vfx/.
import { VFX_SHEETS, VfxId } from './vfxAtlas';

const images: Partial<Record<VfxId, HTMLImageElement>> = {};

/** Call once at game start. Safe to call again. */
export function preloadVfx(): void {
  (Object.keys(VFX_SHEETS) as VfxId[]).forEach((id) => {
    if (images[id]) return;
    const img = new Image();
    img.src = VFX_SHEETS[id].src;
    images[id] = img;
  });
}

export interface VfxInstance {
  id: VfxId;
  x: number; // world x
  y: number; // world y (before ISO tilt — the caller's draw transform handles tilt)
  age: number; // seconds since spawn
  scale: number;
  rotation: number; // radians (slashes: point along swing/dash direction)
  squashY: number; // 1 = upright; ISO_TILT (0.68) for flat ground decals like magic circles
  lifetime: number; // seconds; looping effects live this long, one-shots end with their last frame
  tint?: number; // optional alpha multiplier 0..1
}

const MAX_ACTIVE = 120; // hard cap so heavy fights never tank FPS

export function spawnVfx(
  list: VfxInstance[],
  id: VfxId,
  x: number,
  y: number,
  opts: Partial<Pick<VfxInstance, 'scale' | 'rotation' | 'squashY' | 'lifetime' | 'tint'>> = {}
): void {
  if (list.length >= MAX_ACTIVE) list.shift(); // drop the oldest
  const def = VFX_SHEETS[id];
  list.push({
    id,
    x,
    y,
    age: 0,
    scale: opts.scale ?? 1,
    rotation: opts.rotation ?? 0,
    squashY: opts.squashY ?? 1,
    lifetime: opts.lifetime ?? (def.loop ? 2 : def.frames / def.fps),
    tint: opts.tint,
  });
}

export function updateVfx(list: VfxInstance[], dt: number): void {
  for (let i = list.length - 1; i >= 0; i--) {
    list[i].age += dt;
    if (list[i].age >= list[i].lifetime) list.splice(i, 1);
  }
}

/** Draw inside the same transform you use for world-space sprites. */
export function drawVfx(ctx: CanvasRenderingContext2D, v: VfxInstance): void {
  const def = VFX_SHEETS[v.id];
  const img = images[v.id];
  if (!img || !img.complete) return;
  let frame = Math.floor(v.age * def.fps);
  frame = def.loop ? frame % def.frames : Math.min(frame, def.frames - 1);
  const w = def.frameWidth * v.scale;
  const h = def.frameHeight * v.scale;

  // looping effects fade out over their last 0.25 s
  let alpha = v.tint ?? 1;
  if (def.loop) alpha *= Math.min(1, (v.lifetime - v.age) / 0.25);

  ctx.save();
  ctx.imageSmoothingEnabled = false; // keep pixels crisp
  ctx.globalAlpha = alpha;
  ctx.globalCompositeOperation = def.blend;
  ctx.translate(v.x, v.y);
  if (v.rotation) ctx.rotate(v.rotation);
  if (v.squashY !== 1) ctx.scale(1, v.squashY);
  ctx.drawImage(
    img,
    frame * def.frameWidth,
    0,
    def.frameWidth,
    def.frameHeight,
    -w * def.anchor[0],
    -h * def.anchor[1],
    w,
    h
  );
  ctx.restore();
}
