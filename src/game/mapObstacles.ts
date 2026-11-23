import { BiomeDef } from './types';

export const MAP_TILE_HW = 92;
export const OBSTACLE_DENSITY = 0.06;
export const BREAKABLE_DENSITY = 0.03;
export const TRAP_DENSITY = 0.01;
export const SPAWN_CLEAR_RADIUS = 260;
export const ZONE_CLEAR_RADIUS = 400;
export const MACRO_CELL_SIZE = 1472; // 8 x 8 isometric tiles (~1,472px)

export const SECRET_ROOM_HALF_W = 600; // 1200 x 900 closed room
export const SECRET_ROOM_HALF_H = 450;

export type ObstacleKind = 'rock' | 'pillar' | 'bigTree' | 'ruin';

export interface MapObstacle {
  id: string;
  x: number;
  y: number;
  r: number;
  kind: ObstacleKind;
  variant: number;
  scale: number;
  hasGlowingEyes?: boolean;
  hasGraveHand?: boolean;
}

export type BreakableKind = 'barrel' | 'coffin' | 'crystal' | 'vase';

export interface BreakableProp {
  id: string;
  x: number;
  y: number;
  r: number;
  kind: BreakableKind;
  variant: number;
}

export type TrapKind =
  | 'bomb_barrel'
  | 'spike_trap'
  | 'lightning_pillar'
  | 'ritual_brazier';

export interface MapTrap {
  id: string;
  x: number;
  y: number;
  r: number;
  kind: TrapKind;
}

export interface TrapRuntimeState {
  used: boolean;
  cooldown: number;
  activeTimer: number;
  shockTickTimer: number;
  hitCooldown: number;
}

export type TerrainZoneKind =
  | 'high_ground'
  | 'water_puddle'
  | 'lava_pool'
  | 'poison_swamp'
  | 'flower_meadow';

export interface TerrainZone {
  id: string;
  x: number;
  y: number;
  rx: number;
  ry: number;
  kind: TerrainZoneKind;
  elevation: number; // +18 for high ground, -10 for puddles/pools
  seed: number;
}

export type LandmarkKind =
  | 'abandoned_tower'
  | 'monster_nest'
  | 'cursed_statue'
  | 'sealed_chest'
  | 'stone_circle'
  | 'merchant'
  | 'blood_shrine';

export interface MapLandmark {
  id: string;
  kind: LandmarkKind;
  x: number;
  y: number;
  radius: number;
  used: boolean;
  active: boolean;
  progress: number;
  maxProgress: number;
  hp: number;
  maxHp: number;
  spawnTimer: number;
  hitFlash: number;
  hitCooldown: number;
  revealed: boolean;
}

export type SecretRoomKind =
  | 'treasure'
  | 'elite_arena'
  | 'secret_shop'
  | 'cursed_horde'
  | 'god_blessing';

export function tileHash(ix: number, iy: number, seed: number): number {
  return (
    Math.abs(Math.sin(ix * 12.9898 + iy * 78.233 + seed * 37.719) * 43758.5453) %
    1
  );
}

export function getObstacleAtTile(
  ix: number,
  iy: number,
  runSeed: number,
  themeStyle: BiomeDef['themeStyle'] = 'forest'
): MapObstacle | null {
  const h = tileHash(ix, iy, runSeed);
  if (h > OBSTACLE_DENSITY) return null;
  const x = (ix - iy) * MAP_TILE_HW;
  const y = (ix + iy) * MAP_TILE_HW;
  if (Math.hypot(x, y) < SPAWN_CLEAR_RADIUS) return null;

  const k = Math.floor((h / OBSTACLE_DENSITY) * 4);
  const kind = (['rock', 'pillar', 'bigTree', 'ruin'] as const)[Math.min(3, k)];
  const scale = 0.9 + ((h * 1000) % 1) * 0.45;
  const baseR =
    kind === 'pillar' ? 22 : kind === 'bigTree' ? 30 : kind === 'ruin' ? 38 : 32;
  const variant = Math.floor((h * 7919) % 4);

  const subHash = (h * 3571) % 1;
  const hasGlowingEyes =
    themeStyle === 'forest' && kind === 'bigTree' && subHash < 0.24;
  const hasGraveHand =
    themeStyle === 'crypt' && (kind === 'rock' || kind === 'ruin') && subHash < 0.26;

  return {
    id: `${ix}:${iy}`,
    x,
    y,
    r: baseR * scale,
    kind,
    variant,
    scale,
    hasGlowingEyes,
    hasGraveHand,
  };
}

export function getObstaclesNear(
  x: number,
  y: number,
  range: number,
  runSeed: number,
  themeStyle: BiomeDef['themeStyle'] = 'forest'
): MapObstacle[] {
  const out: MapObstacle[] = [];
  const cIx = (x + y) / (2 * MAP_TILE_HW);
  const cIy = (y - x) / (2 * MAP_TILE_HW);
  const span = Math.ceil(range / MAP_TILE_HW) + 1;
  for (let ix = Math.floor(cIx) - span; ix <= Math.ceil(cIx) + span; ix++) {
    for (let iy = Math.floor(cIy) - span; iy <= Math.ceil(cIy) + span; iy++) {
      const o = getObstacleAtTile(ix, iy, runSeed, themeStyle);
      if (o && Math.hypot(o.x - x, o.y - y) < range + o.r) {
        out.push(o);
      }
    }
  }
  return out;
}

export function resolveCircleVsObstacles(
  ent: { x: number; y: number },
  entR: number,
  obstacles: MapObstacle[],
  slideBias = 0.35
): boolean {
  let hit = false;
  for (let i = 0; i < obstacles.length; i++) {
    const o = obstacles[i];
    const dx = ent.x - o.x;
    const dy = ent.y - o.y;
    const minD = o.r + entR;
    const d2 = dx * dx + dy * dy;
    if (d2 < minD * minD) {
      const d = Math.sqrt(d2) || 0.0001;
      const nx = dx / d;
      const ny = dy / d;
      const push = minD - d;
      ent.x += nx * push;
      ent.y += ny * push;
      ent.x += -ny * push * slideBias;
      ent.y += nx * push * slideBias;
      hit = true;
    }
  }
  return hit;
}

export function getBreakableAtTile(
  ix: number,
  iy: number,
  runSeed: number,
  themeStyle: BiomeDef['themeStyle']
): BreakableProp | null {
  if (getObstacleAtTile(ix, iy, runSeed, themeStyle)) return null;
  const h = tileHash(ix, iy, runSeed + 1337);
  if (h > BREAKABLE_DENSITY) return null;
  const x = (ix - iy) * MAP_TILE_HW;
  const y = (ix + iy) * MAP_TILE_HW;
  if (Math.hypot(x, y) < SPAWN_CLEAR_RADIUS) return null;

  const sub = (h / BREAKABLE_DENSITY) % 1;
  let kind: BreakableKind = 'barrel';
  if (themeStyle === 'crypt') {
    kind = sub < 0.62 ? 'coffin' : 'vase';
  } else if (themeStyle === 'volcano' || themeStyle === 'void') {
    kind = sub < 0.6 ? 'crystal' : 'barrel';
  } else if (themeStyle === 'sea') {
    kind = sub < 0.5 ? 'barrel' : sub < 0.8 ? 'crystal' : 'vase';
  } else {
    kind = sub < 0.68 ? 'barrel' : 'vase';
  }

  return {
    id: `brk:${ix}:${iy}`,
    x,
    y,
    r: 18,
    kind,
    variant: Math.floor((h * 4999) % 3),
  };
}

export function getBreakablesNear(
  x: number,
  y: number,
  range: number,
  runSeed: number,
  brokenTiles: Set<string>,
  themeStyle: BiomeDef['themeStyle']
): BreakableProp[] {
  const out: BreakableProp[] = [];
  const cIx = (x + y) / (2 * MAP_TILE_HW);
  const cIy = (y - x) / (2 * MAP_TILE_HW);
  const span = Math.ceil(range / MAP_TILE_HW) + 1;
  for (let ix = Math.floor(cIx) - span; ix <= Math.ceil(cIx) + span; ix++) {
    for (let iy = Math.floor(cIy) - span; iy <= Math.ceil(cIy) + span; iy++) {
      if (brokenTiles.has(`brk:${ix}:${iy}`)) continue;
      const b = getBreakableAtTile(ix, iy, runSeed, themeStyle);
      if (b && Math.hypot(b.x - x, b.y - y) < range + b.r) {
        out.push(b);
      }
    }
  }
  return out;
}

export function getTrapAtTile(
  ix: number,
  iy: number,
  runSeed: number,
  themeStyle: BiomeDef['themeStyle']
): MapTrap | null {
  if (getObstacleAtTile(ix, iy, runSeed, themeStyle)) return null;
  if (getBreakableAtTile(ix, iy, runSeed, themeStyle)) return null;
  const h = tileHash(ix, iy, runSeed + 2771);
  if (h > TRAP_DENSITY) return null;
  const x = (ix - iy) * MAP_TILE_HW;
  const y = (ix + iy) * MAP_TILE_HW;
  if (Math.hypot(x, y) < SPAWN_CLEAR_RADIUS + 40) return null;

  const k = Math.floor((h / TRAP_DENSITY) * 4);
  const kind = (
    ['bomb_barrel', 'spike_trap', 'lightning_pillar', 'ritual_brazier'] as const
  )[Math.min(3, k)];

  return {
    id: `trap:${ix}:${iy}`,
    x,
    y,
    r: kind === 'spike_trap' ? 28 : 22,
    kind,
  };
}

export function getTrapsNear(
  x: number,
  y: number,
  range: number,
  runSeed: number,
  themeStyle: BiomeDef['themeStyle']
): MapTrap[] {
  const out: MapTrap[] = [];
  const cIx = (x + y) / (2 * MAP_TILE_HW);
  const cIy = (y - x) / (2 * MAP_TILE_HW);
  const span = Math.ceil(range / MAP_TILE_HW) + 1;
  for (let ix = Math.floor(cIx) - span; ix <= Math.ceil(cIx) + span; ix++) {
    for (let iy = Math.floor(cIy) - span; iy <= Math.ceil(cIy) + span; iy++) {
      const t = getTrapAtTile(ix, iy, runSeed, themeStyle);
      if (t && Math.hypot(t.x - x, t.y - y) < range + t.r) {
        out.push(t);
      }
    }
  }
  return out;
}

export function hasMapTileProp(
  ix: number,
  iy: number,
  runSeed: number,
  themeStyle: BiomeDef['themeStyle']
): boolean {
  return Boolean(
    getObstacleAtTile(ix, iy, runSeed, themeStyle) ||
      getBreakableAtTile(ix, iy, runSeed, themeStyle) ||
      getTrapAtTile(ix, iy, runSeed, themeStyle)
  );
}

function pickTerrainKind(
  sub: number,
  themeStyle: BiomeDef['themeStyle']
): TerrainZoneKind {
  if (themeStyle === 'volcano') {
    if (sub < 0.4) return 'lava_pool';
    if (sub < 0.72) return 'high_ground';
    return 'water_puddle';
  }
  if (themeStyle === 'crypt') {
    if (sub < 0.4) return 'poison_swamp';
    if (sub < 0.72) return 'high_ground';
    return 'water_puddle';
  }
  if (themeStyle === 'forest') {
    if (sub < 0.38) return 'flower_meadow';
    if (sub < 0.7) return 'high_ground';
    return 'water_puddle';
  }
  if (themeStyle === 'sea') {
    if (sub < 0.5) return 'water_puddle';
    if (sub < 0.85) return 'high_ground';
    return 'flower_meadow';
  }
  // void
  if (sub < 0.35) return 'high_ground';
  if (sub < 0.65) return 'poison_swamp';
  if (sub < 0.85) return 'lava_pool';
  return 'water_puddle';
}

export function getTerrainZonesNear(
  x: number,
  y: number,
  range: number,
  runSeed: number,
  themeStyle: BiomeDef['themeStyle']
): TerrainZone[] {
  const out: TerrainZone[] = [];
  const minCx = Math.floor((x - range - 360) / MACRO_CELL_SIZE);
  const maxCx = Math.floor((x + range + 360) / MACRO_CELL_SIZE);
  const minCy = Math.floor((y - range - 360) / MACRO_CELL_SIZE);
  const maxCy = Math.floor((y + range + 360) / MACRO_CELL_SIZE);

  for (let cx = minCx; cx <= maxCx; cx++) {
    for (let cy = minCy; cy <= maxCy; cy++) {
      const h = tileHash(cx, cy, runSeed + 4919);
      if (h > 0.35) continue;

      const ox = (tileHash(cx + 11, cy - 7, runSeed + 4931) - 0.5) * 440;
      const oy = (tileHash(cx - 5, cy + 17, runSeed + 4957) - 0.5) * 440;
      const zx = (cx + 0.5) * MACRO_CELL_SIZE + ox;
      const zy = (cy + 0.5) * MACRO_CELL_SIZE + oy;
      const rx = 180 + tileHash(cx * 3, cy * 5, runSeed + 4999) * 140; // 180..320
      const ry = rx * (0.74 + tileHash(cx * 7, cy * 2, runSeed + 5011) * 0.2);

      if (Math.hypot(zx, zy) < ZONE_CLEAR_RADIUS + rx) continue;
      if (Math.hypot(zx - x, zy - y) > range + rx + 40) continue;

      const sub = (h / 0.35) % 1;
      const kind = pickTerrainKind(sub, themeStyle);
      const elevation = kind === 'high_ground' ? 18 : kind === 'flower_meadow' ? 0 : -10;

      out.push({
        id: `zone:${cx}:${cy}`,
        x: zx,
        y: zy,
        rx,
        ry,
        kind,
        elevation,
        seed: h,
      });
    }
  }
  return out;
}

export function isPointInTerrainZone(
  px: number,
  py: number,
  z: TerrainZone
): boolean {
  const dx = (px - z.x) / z.rx;
  const dy = (py - z.y) / z.ry;
  return dx * dx + dy * dy <= 1;
}

export function getTerrainZoneAt(
  px: number,
  py: number,
  zones: TerrainZone[]
): TerrainZone | null {
  for (let i = 0; i < zones.length; i++) {
    if (isPointInTerrainZone(px, py, zones[i])) return zones[i];
  }
  return null;
}

// Closed 1200 x 900 secret chamber perimeter wall obstacles
let cachedSecretRoomWalls: MapObstacle[] | null = null;
export function getSecretRoomWallObstacles(): MapObstacle[] {
  if (cachedSecretRoomWalls) return cachedSecretRoomWalls;
  const walls: MapObstacle[] = [];
  const step = 64;
  let idx = 0;
  for (let wx = -SECRET_ROOM_HALF_W; wx <= SECRET_ROOM_HALF_W; wx += step) {
    walls.push({
      id: `sr_top_${idx++}`,
      x: wx,
      y: -SECRET_ROOM_HALF_H,
      r: 34,
      kind: 'pillar',
      variant: idx % 4,
      scale: 1.1,
    });
    walls.push({
      id: `sr_bot_${idx++}`,
      x: wx,
      y: SECRET_ROOM_HALF_H,
      r: 34,
      kind: 'pillar',
      variant: idx % 4,
      scale: 1.1,
    });
  }
  for (let wy = -SECRET_ROOM_HALF_H + step; wy <= SECRET_ROOM_HALF_H - step; wy += step) {
    walls.push({
      id: `sr_left_${idx++}`,
      x: -SECRET_ROOM_HALF_W,
      y: wy,
      r: 34,
      kind: 'pillar',
      variant: idx % 4,
      scale: 1.1,
    });
    walls.push({
      id: `sr_right_${idx++}`,
      x: SECRET_ROOM_HALF_W,
      y: wy,
      r: 34,
      kind: 'pillar',
      variant: idx % 4,
      scale: 1.1,
    });
  }
  cachedSecretRoomWalls = walls;
  return walls;
}

export const LANDMARK_META: Record<
  LandmarkKind,
  { nameTh: string; shortTh: string; color: string; hintTh: string }
> = {
  abandoned_tower: {
    nameTh: 'หอคอยร้าง',
    shortTh: 'หอคอย',
    color: '#38BDF8',
    hintTh: 'ยืนบนฐาน 3 วิ เปิดแผนที่จุดสำคัญและหีบ 2,000px',
  },
  monster_nest: {
    nameTh: 'รังมอนสเตอร์',
    shortTh: 'รังมอน',
    color: '#F43F5E',
    hintTh: 'ทำลายรังเพื่อรับหีบสมบัติ + 80 ทอง',
  },
  cursed_statue: {
    nameTh: 'รูปปั้นเทพต้องสาป',
    shortTh: 'รูปปั้นเทพ',
    color: '#A855F7',
    hintTh: 'ยืนข้างรูปปั้น 2 วิ เพื่อเลือกพรหรือคำสาป',
  },
  sealed_chest: {
    nameTh: 'แท่นหีบผนึก',
    shortTh: 'หีบผนึก',
    color: '#F59E0B',
    hintTh: 'ยืนป้องกันหีบ 30 วิ รับหีบอุปกรณ์ถาวร',
  },
  stone_circle: {
    nameTh: 'วงแหวนหินโบราณ',
    shortTh: 'วงแหวน',
    color: '#34D399',
    hintTh: 'ยืนในวง 10 วิ อัปเลเวลทันที +1',
  },
  merchant: {
    nameTh: 'ร้านค้าเร่ร่อน',
    shortTh: 'ร้านค้า',
    color: '#FBBF24',
    hintTh: 'เดินเข้าใกล้เพื่อซื้อของด้วยทองในรอบ',
  },
  blood_shrine: {
    nameTh: 'ศาลเจ้าแลกเลือด',
    shortTh: 'ศาลเลือด',
    color: '#E11D48',
    hintTh: 'จ่าย HP 30% เพื่ออัปเกรดอาวุธ/พรสุ่ม +1',
  },
};

export const SECRET_ROOM_NAMES_TH: Record<SecretRoomKind, string> = {
  treasure: 'ห้องสมบัติโบราณ',
  elite_arena: 'ลานประลองอีลิท',
  secret_shop: 'ร้านค้าลับแห่งเงามืด',
  cursed_horde: 'ห้องคำสาปมรณะ (EXP ×3)',
  god_blessing: 'วิหารพรแห่งทวยเทพ',
};
