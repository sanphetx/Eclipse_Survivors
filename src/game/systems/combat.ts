import { BALANCE } from '../data';
import { CombinedVisualPalette, ParticleShape } from '../fusionVfx';
import { DamageType, EnemyKind } from '../types';
import { EnemyBullet, EnemyEntity, SimState } from './simTypes';

export function computeClassSkillPower(sim: SimState): number {
  const totalWeaponLevels = sim.weapons.reduce((sum, w) => sum + w.level, 0);
  const evolvedCount = sim.weapons.filter((w) => w.evolved).length;
  return Math.min(3.0, 1 + totalWeaponLevels * 0.05 + evolvedCount * 0.25);
}

const ARMORED_KINDS = new Set<EnemyKind>(['golem', 'shielder', 'charger']);
const SPIRIT_KINDS = new Set<EnemyKind>(['trapper', 'cultist', 'zealot']);
const SLIME_FAE_KINDS = new Set<EnemyKind>(['slime', 'flower', 'miniboss_blossom']);

export function getEnemyDamageTypeMult(enemy: EnemyEntity, damageType: DamageType): number {
  if (enemy.isBoss) return 1.0;

  let mult = 1.0;
  if (ARMORED_KINDS.has(enemy.kind)) {
    if (damageType === 'physical') mult = 0.6;
    else if (damageType === 'magic') mult = 1.3;
  } else if (SPIRIT_KINDS.has(enemy.kind)) {
    if (damageType === 'physical') mult = 0.5;
    else if (damageType === 'magic') mult = 1.4;
  } else if (SLIME_FAE_KINDS.has(enemy.kind)) {
    if (damageType === 'elemental') mult = 0.7;
    else if (damageType === 'physical') mult = 1.2;
  }

  if (enemy.isElite && enemy.eliteResistType === damageType) {
    mult *= 0.6;
  }

  return mult;
}

export function pushEnemyBullet(sim: SimState, bullet: EnemyBullet): void {
  sim.enemyBullets.push({
    ...bullet,
    life: bullet.life * 1.15,
  });
}

export function pointToSegmentDistSq(
  px: number,
  py: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number
): number {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len2 = dx * dx + dy * dy;
  if (len2 <= 0.0001) {
    return (px - x1) * (px - x1) + (py - y1) * (py - y1);
  }
  const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / len2));
  const cx = x1 + t * dx;
  const cy = y1 + t * dy;
  return (px - cx) * (px - cx) + (py - cy) * (py - cy);
}

/**
 * Checks if the enemy's velocity vector (vx, vy) points > 100° away from the vector toward the player
 * (i.e. enemy is moving away or facing away, allowing a Hunter Backstab).
 */
export function isBackstabAngle(
  enemyVx: number,
  enemyVy: number,
  enemyX: number,
  enemyY: number,
  playerX: number,
  playerY: number
): boolean {
  const speedSq = enemyVx * enemyVx + enemyVy * enemyVy;
  if (speedSq <= 9) return false;
  const toPlayerX = playerX - enemyX;
  const toPlayerY = playerY - enemyY;
  const distSq = toPlayerX * toPlayerX + toPlayerY * toPlayerY;
  if (distSq <= 1) return false;
  const dot = enemyVx * toPlayerX + enemyVy * toPlayerY;
  const cosAngle = dot / (Math.sqrt(speedSq) * Math.sqrt(distSq));
  // cos(100°) ≈ -0.173648
  return cosAngle < Math.cos((100 * Math.PI) / 180);
}

export function orderPolygonVertices<T extends { x: number; y: number }>(pts: T[]): T[] {
  if (pts.length <= 2) return pts;
  let cx = 0;
  let cy = 0;
  for (const p of pts) {
    cx += p.x;
    cy += p.y;
  }
  cx /= pts.length;
  cy /= pts.length;
  return [...pts].sort((a, b) => Math.atan2(a.y - cy, a.x - cx) - Math.atan2(b.y - cy, b.x - cx));
}

export function polygonCentroid(pts: Array<{ x: number; y: number }>): { x: number; y: number } {
  if (pts.length === 0) return { x: 0, y: 0 };
  let x = 0;
  let y = 0;
  for (const p of pts) {
    x += p.x;
    y += p.y;
  }
  return { x: x / pts.length, y: y / pts.length };
}

export function isPointInPolygon(
  px: number,
  py: number,
  vertices: Array<{ x: number; y: number }>
): boolean {
  if (vertices.length < 3) return false;
  let inside = false;
  for (let i = 0, j = vertices.length - 1; i < vertices.length; j = i++) {
    const xi = vertices[i].x;
    const yi = vertices[i].y;
    const xj = vertices[j].x;
    const yj = vertices[j].y;
    const intersect =
      yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi || 1e-6) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

export function spawnParticles(
  sim: SimState,
  x: number,
  y: number,
  color: string,
  count: number,
  speed = 120
): void {
  if (sim.particles.length > 260) return;
  for (let i = 0; i < count; i++) {
    const a = Math.random() * Math.PI * 2;
    const sp = speed * (0.4 + Math.random() * 0.7);
    const life = 0.35 + Math.random() * 0.35;
    sim.particles.push({
      x,
      y,
      vx: Math.cos(a) * sp,
      vy: Math.sin(a) * sp,
      radius: 2 + Math.random() * 2.5,
      life,
      maxLife: life,
      color,
    });
  }
}

export function spawnPaletteBurst(
  sim: SimState,
  x: number,
  y: number,
  palette: CombinedVisualPalette,
  count: number,
  speed = 155,
  opts?: {
    radius?: number;
    life?: number;
    drag?: number;
    zOffset?: number;
    glow?: boolean;
    force?: boolean;
    ringRatio?: number;
    angleOffset?: number;
  }
): void {
  const maxCap = opts?.force ? 420 : 320;
  if (sim.particles.length > maxCap) return;
  const baseRadius = opts?.radius ?? 3.1;
  const baseLife = opts?.life ?? 0.55;
  const drag = opts?.drag ?? 2.2;
  const zOffset = opts?.zOffset ?? 12;
  const glow = opts?.glow ?? true;
  const ringRatio = opts?.ringRatio ?? 0.1;

  for (let i = 0; i < count; i++) {
    const a =
      (opts?.angleOffset ?? 0) +
      (i / Math.max(1, count)) * Math.PI * 2 +
      (Math.random() - 0.5) * 0.45;
    const sp = speed * (0.45 + Math.random() * 0.72);
    const color = palette.colors[i % palette.colors.length];
    const secondaryColor = palette.colors[(i + 1) % palette.colors.length];
    const useRing = Math.random() < ringRatio;
    const shape: ParticleShape = useRing ? 'ring' : palette.shapes[i % palette.shapes.length];
    const life = baseLife * (0.75 + Math.random() * 0.45);
    sim.particles.push({
      x,
      y,
      vx: Math.cos(a) * sp,
      vy: Math.sin(a) * sp,
      radius: baseRadius * (0.75 + Math.random() * 0.55),
      life,
      maxLife: life,
      color,
      secondaryColor,
      shape,
      angle: a,
      spin: (Math.random() - 0.5) * 8,
      drag,
      zOffset: zOffset + Math.random() * 8,
      glow,
    });
  }
}

export function addFloatingText(
  sim: SimState,
  x: number,
  y: number,
  text: string,
  color: string,
  scale = 1,
  opts?: {
    vx?: number;
    vy?: number;
    gravity?: number;
    life?: number;
    isCrit?: boolean;
    isDamage?: boolean;
  }
): void {
  if (sim.floatingTexts.length > 110) sim.floatingTexts.shift();
  const life = opts?.life ?? (opts?.isDamage ? 0.58 : 0.65);
  sim.floatingTexts.push({
    x: x + (Math.random() - 0.5) * (opts?.isDamage ? 18 : 14),
    y: y - 10 + (opts?.isDamage ? (Math.random() - 0.5) * 8 : 0),
    vx: opts?.vx ?? 0,
    vy: opts?.vy ?? -42,
    gravity: opts?.gravity ?? 0,
    text,
    color,
    life,
    maxLife: life,
    scale,
    isCrit: opts?.isCrit,
    isDamage: opts?.isDamage,
  });
}

export function triggerDamageFlash(sim: SimState, damageTaken: number): void {
  const ratio = damageTaken / Math.max(1, sim.player.maxHp);
  if (ratio < 0.03) return;
  const dur = Math.min(0.45, 0.24 + ratio * 0.6);
  const alpha = Math.min(0.36, 0.18 + ratio * 0.48);
  sim.damageFlashMax = dur;
  sim.damageFlash = dur;
  sim.damageFlashAlpha = Math.max(sim.damageFlashAlpha, alpha);
}

export function triggerAbilityFlash(sim: SimState, duration = 0.2, alpha = 0.2): void {
  sim.abilityFlashMax = Math.max(sim.abilityFlashMax, duration);
  sim.abilityFlash = Math.max(sim.abilityFlash, duration);
  sim.abilityFlashAlpha = Math.max(sim.abilityFlashAlpha, alpha);
}

export function triggerWeaponHitShake(sim: SimState, duration: number, intensity: number): void {
  if (intensity >= sim.shakeIntensity * 0.9 || sim.shakeTime <= 0.02) {
    sim.shakeMaxTime = duration;
    sim.shakeTime = duration;
    sim.shakeIntensity = intensity;
  } else {
    sim.shakeTime = Math.max(sim.shakeTime, duration * 0.85);
    sim.shakeIntensity = Math.max(sim.shakeIntensity, intensity);
  }
}

export function applyPlayerHeal(sim: SimState, rawAmount: number, allowOverflow = 0): number {
  if (rawAmount <= 0) return 0;
  let effective = rawAmount * sim.cachedHealTakenFactor;
  if (sim.mapEvent === 'void_corruption') {
    effective *= 0.45;
  }
  if (sim.inPoisonSwamp) {
    effective *= 0.5;
  }
  const isNightNow =
    (sim.raceClass === 'vampire_lord' && sim.ultActiveTimer > 0) ||
    sim.dayNightElapsed % 90 < 45;
  if (sim.raceClass === 'vampire_lord' && !isNightNow) {
    effective *= 0.5;
  }
  const whole = effective < 1 ? (Math.random() < effective ? 1 : 0) : Math.round(effective);
  if (whole <= 0) return 0;
  const maxAllowed = sim.player.maxHp + allowOverflow;
  const prevHp = sim.player.hp;
  sim.player.hp = Math.min(maxAllowed, sim.player.hp + whole);
  const actualHpGain = Math.max(0, sim.player.hp - prevHp);
  if (sim.raceClass === 'vampire_lord' && whole > actualHpGain && prevHp + whole > sim.player.maxHp) {
    const overheal = prevHp + whole - Math.max(sim.player.maxHp, prevHp);
    const shieldMax = sim.player.maxHp * 0.25;
    sim.vampireBloodShield = Math.min(shieldMax, sim.vampireBloodShield + overheal);
  }
  return actualHpGain;
}

export function applyLeechHeal(sim: SimState, rawAmount: number): number {
  const canOverhealShield = sim.raceClass === 'vampire_lord';
  if (rawAmount <= 0 || (!canOverhealShield && sim.player.hp >= sim.player.maxHp)) return 0;
  const nowSec = performance.now() / 1000;
  if (sim.leechWindowStart === undefined || nowSec - sim.leechWindowStart >= 1) {
    sim.leechWindowStart = nowSec;
    sim.leechWindowHealed = 0;
  }
  let amount = rawAmount;
  if ((sim.woundedTimer || 0) > 0) amount *= BALANCE.woundedHealMult;
  if (sim.inPoisonSwamp) amount *= 0.5;
  let budgetMult = 1;
  if (sim.raceClass === 'vampire_lord') {
    budgetMult = sim.ultActiveTimer > 0 ? 4 : 2;
  }
  const budget = sim.player.maxHp * BALANCE.leechBudgetPctPerSec * budgetMult;
  const left = Math.max(0, budget - (sim.leechWindowHealed || 0));
  amount = Math.min(amount, left);
  if (amount <= 0) return 0;
  const healed = applyPlayerHeal(sim, amount);
  sim.leechWindowHealed =
    (sim.leechWindowHealed || 0) +
    Math.max(healed, canOverhealShield ? Math.min(amount, 1) : 0);
  return healed;
}
