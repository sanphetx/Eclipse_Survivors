import { sound } from '../sound';
import { DamageType, WeaponId } from '../types';
import {
  addFloatingText,
  applyPlayerHeal,
  isBackstabAngle,
  isPointInPolygon,
  orderPolygonVertices,
  pointToSegmentDistSq,
  polygonCentroid,
  spawnParticles,
  triggerAbilityFlash,
  triggerWeaponHitShake,
} from './combat';
import { ComputedStats, EnemyEntity, KnightSacredBlade, SimState } from './simTypes';
import { spawnVfx } from '../vfxPlayer';

export interface DamageEnemyExtraOpts {
  damageType?: DamageType;
  fromHunterShadowSlash?: boolean;
  isBackstab?: boolean;
  fromWeapon?: boolean;
}

export interface ClassSkillHooks {
  damageEnemy: (
    sim: SimState,
    enemy: EnemyEntity,
    rawDamage: number,
    weaponId: WeaponId | null,
    knockback: number,
    kbDx: number,
    kbDy: number,
    greedMult: number,
    skipWindDeathBurst?: boolean,
    skipComboCount?: boolean,
    skipStatusApply?: boolean,
    extraOpts?: DamageEnemyExtraOpts | DamageType
  ) => void;
  hitWorldTargetsInCircle: (
    sim: SimState,
    cx: number,
    cy: number,
    radius: number,
    dmg: number,
    stats: ComputedStats
  ) => void;
  hitWorldTargetsOnSegment: (
    sim: SimState,
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    halfW: number,
    dmg: number,
    stats: ComputedStats
  ) => void;
}

export const HUNTER_MAX_GAUGE = 100;
export const HUNTER_DASH_RANGE_MULT = 1.7;
export const HUNTER_RECHARGE_SEC = 1.6;
export const KNIGHT_PARRY_ASCEND_REQ = 30;
export const HUNTER_REFUND_ASCEND_REQ = 150;
export const SAINT_SANCTUM_ASCEND_REQ = 3000;

// =========================================================================
// HUNTER (นักฆ่าเงาจันทร์ / Moonshadow Assassin)
// =========================================================================

export function runHunterShadowSlashSegment(
  sim: SimState,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  stats: ComputedStats,
  hooks: ClassSkillHooks,
  color = '#A855F7',
  recordForUlt = true,
  alreadyHitSet?: Set<number>
): void {
  const hitSet = alreadyHitSet ?? sim.dashCutHitIds;
  const cappedLv = Math.min(sim.player.level, 40);
  const slashDmg = (70 + cappedLv * 4) * 0.75 * stats.damageMult * stats.classSkillPower;
  const dxS = x2 - x1;
  const dyS = y2 - y1;

  for (const en of sim.enemies) {
    if (en.hp <= 0 || hitSet.has(en.id)) continue;
    const halfWidth = 35 + en.radius;
    const distSq = pointToSegmentDistSq(en.x, en.y, x1, y1, x2, y2);
    if (distSq <= halfWidth * halfWidth) {
      hitSet.add(en.id);
      const backstab = isBackstabAngle(en.vx, en.vy, en.x, en.y, x1, y1);
      hooks.damageEnemy(sim, en, slashDmg, null, 95, dxS, dyS, stats.greedMult, false, false, false, {
        damageType: 'physical',
        fromHunterShadowSlash: true,
        isBackstab: backstab,
      });
    }
  }

  hooks.hitWorldTargetsOnSegment(sim, x1, y1, x2, y2, 35, slashDmg, stats);

  if (recordForUlt && sim.ultActiveTimer > 0) {
    const last = sim.hunterUltDashHistory[sim.hunterUltDashHistory.length - 1];
    if (!last || Math.hypot(last.x2 - x2, last.y2 - y2) > 8) {
      sim.hunterUltDashHistory.push({ x1, y1, x2, y2 });
    }
  }

  const midX = (x1 + x2) * 0.5;
  const midY = (y1 + y2) * 0.5;
  const rot = Math.atan2(dyS, dxS);
  const segLen = Math.max(96, Math.hypot(dxS, dyS) + 45);
  sim.groundFx.push({
    kind: 'shadow_cut',
    x: x1,
    y: y1,
    x2,
    y2,
    radius: 10,
    maxRadius: 10,
    life: 0.24,
    maxLife: 0.24,
    color,
  });
  sim.groundFx.push({
    kind: 'vfx',
    vfxId: 'shadow_slash',
    x: midX,
    y: midY,
    radius: 40,
    maxRadius: 80,
    dw: segLen,
    dh: 92,
    rotation: rot,
    life: 0.28,
    maxLife: 0.28,
    color,
  });
}

export function onHunterDashStart(
  sim: SimState,
  ndx: number,
  ndy: number,
  dashDist: number,
  stats: ComputedStats,
  hooks: ClassSkillHooks
): void {
  const startX = sim.dashStartX;
  const startY = sim.dashStartY;
  const endX = startX + ndx * dashDist;
  const endY = startY + ndy * dashDist;

  sound.playSlash(false);

  if (sim.ultActiveTimer > 0) {
    sim.hunterUltDashHistory.push({ x1: startX, y1: startY, x2: endX, y2: endY });
    sim.hunterEchoes.push({
      x1: startX,
      y1: startY,
      x2: endX,
      y2: endY,
      delayTimer: 0.4,
      activeTimer: 0.22,
      triggered: false,
    });
  } else if (sim.ultAscended) {
    // Ascended companion Shadow Echo dashes slightly offset along every dash
    const perpX = -ndy * 26;
    const perpY = ndx * 26;
    sim.hunterEchoes.push({
      x1: startX + perpX,
      y1: startY + perpY,
      x2: endX + perpX,
      y2: endY + perpY,
      delayTimer: 0.14,
      activeTimer: 0.22,
      triggered: false,
    });
  }

  // Also ensure immediate segment check at start
  void hooks;
  void stats;
}

export function maybeSpawnCritShadowKnife(
  sim: SimState,
  originX: number,
  originY: number,
  stats: ComputedStats
): void {
  if (sim.raceClass !== 'hunter') return;
  if (Math.random() >= 0.15) return;

  let nearest: EnemyEntity | null = null;
  let bestD2 = 480 * 480;
  for (const en of sim.enemies) {
    if (en.hp <= 0) continue;
    const d2 = (en.x - originX) ** 2 + (en.y - originY) ** 2;
    if (d2 < bestD2) {
      bestD2 = d2;
      nearest = en;
    }
  }
  const ang = nearest
    ? Math.atan2(nearest.y - originY, nearest.x - originX)
    : Math.atan2(sim.player.facingY, sim.player.facingX);
  const cappedLv = Math.min(sim.player.level, 40);
  const baseSlash = (70 + cappedLv * 4) * stats.damageMult * stats.classSkillPower;
  const spd = 640 * stats.projSpeedMult;

  sim.projectiles.push({
    weaponId: 'dagger',
    evolved: true,
    customKind: 'shadow_knife',
    fromClassSkill: true,
    homing: true,
    damageType: 'physical',
    x: originX,
    y: originY,
    vx: Math.cos(ang) * spd,
    vy: Math.sin(ang) * spd,
    radius: 9,
    damage: baseSlash * 0.4,
    knockback: 45,
    pierce: 2,
    life: 0.9,
    maxLife: 0.9,
    hitIds: new Set(),
    rotation: ang,
    color: '#C084FC',
  });
}

export function updateHunterSystem(
  sim: SimState,
  dt: number,
  stats: ComputedStats,
  hooks: ClassSkillHooks
): void {
  if (sim.raceClass !== 'hunter') return;

  const maxCharges = sim.ultAscended ? 4 : 3;
  sim.hunterDashMaxCharges = maxCharges;
  if (sim.hunterDashCharges > maxCharges) sim.hunterDashCharges = maxCharges;

  // Recharge dash charges every 1.1s (unlimited during Ult)
  if (sim.ultActiveTimer > 0) {
    sim.hunterDashCharges = maxCharges;
    sim.hunterDashRechargeTimer = 0;
  } else if (sim.hunterDashCharges < maxCharges) {
    sim.hunterDashRechargeTimer += dt;
    if (sim.hunterDashRechargeTimer >= HUNTER_RECHARGE_SEC) {
      sim.hunterDashRechargeTimer -= HUNTER_RECHARGE_SEC;
      sim.hunterDashCharges = Math.min(maxCharges, sim.hunterDashCharges + 1);
    }
  } else {
    sim.hunterDashRechargeTimer = 0;
  }

  // Shadow Echoes delayed re-dash
  for (let i = sim.hunterEchoes.length - 1; i >= 0; i--) {
    const echo = sim.hunterEchoes[i];
    if (!echo.triggered) {
      echo.delayTimer -= dt;
      if (echo.delayTimer <= 0) {
        echo.triggered = true;
        sound.playSlash(false);
        const echoHits = new Set<number>();
        runHunterShadowSlashSegment(
          sim,
          echo.x1,
          echo.y1,
          echo.x2,
          echo.y2,
          stats,
          hooks,
          '#818CF8',
          false,
          echoHits
        );
      }
    } else {
      echo.activeTimer -= dt;
      if (echo.activeTimer <= 0) {
        sim.hunterEchoes.splice(i, 1);
      }
    }
  }

  // Emerald Arrows: 2 homing arrows every 2.0s that apply 5s Emerald Mark (+15% Shadow Slash crit chance)
  sim.classSkillTimer -= dt;
  if (sim.classSkillTimer <= 0) {
    sim.classSkillTimer = 2.0 * Math.max(0.7, stats.cooldownMult);
    let nearest: EnemyEntity | null = null;
    let bestD2 = 520 * 520;
    for (const en of sim.enemies) {
      if (en.hp <= 0) continue;
      const d2 = (en.x - sim.player.x) ** 2 + (en.y - sim.player.y) ** 2;
      if (d2 < bestD2) {
        bestD2 = d2;
        nearest = en;
      }
    }
    const aim = nearest
      ? Math.atan2(nearest.y - sim.player.y, nearest.x - sim.player.x)
      : Math.atan2(sim.player.facingY, sim.player.facingX);
    const arrowDmg = (44 + Math.min(sim.player.level, 40) * 2.1) * stats.damageMult * stats.classSkillPower;
    const spd = 620 * stats.projSpeedMult;

    for (let k = 0; k < 2; k++) {
      const a = aim + (k === 0 ? -0.1 : 0.1);
      sim.projectiles.push({
        weaponId: 'dagger',
        evolved: true,
        customKind: 'arrow',
        fromClassSkill: true,
        homing: true,
        applyEmeraldMark: true,
        damageType: 'physical',
        x: sim.player.x,
        y: sim.player.y,
        vx: Math.cos(a) * spd,
        vy: Math.sin(a) * spd,
        radius: 12,
        damage: arrowDmg,
        knockback: 65,
        pierce: 3,
        life: 1.35,
        maxLife: 1.35,
        hitIds: new Set(),
        rotation: a,
        color: '#34D399',
      });
    }
  }
}

export function triggerHunterUltFinale(
  sim: SimState,
  stats: ComputedStats,
  hooks: ClassSkillHooks
): void {
  const cappedLv = Math.min(sim.player.level, 40);
  const finDmg = (85 + cappedLv * 4.5) * stats.damageMult * stats.classSkillPower;
  triggerAbilityFlash(sim, 0.24, 0.22);
  sound.playSlash(true);

  const history = sim.hunterUltDashHistory;
  const hitAll = new Set<number>();

  if (history.length > 0) {
    for (const seg of history) {
      sim.groundFx.push({
        kind: 'shadow_cut',
        x: seg.x1,
        y: seg.y1,
        x2: seg.x2,
        y2: seg.y2,
        radius: 12,
        maxRadius: 12,
        life: 0.34,
        maxLife: 0.34,
        color: '#E879F9',
      });
      for (const en of sim.enemies) {
        if (en.hp <= 0 || hitAll.has(en.id)) continue;
        const hw = 45 + en.radius;
        if (pointToSegmentDistSq(en.x, en.y, seg.x1, seg.y1, seg.x2, seg.y2) <= hw * hw) {
          hitAll.add(en.id);
          hooks.damageEnemy(sim, en, finDmg, null, 110, seg.x2 - seg.x1, seg.y2 - seg.y1, stats.greedMult, false, false, false, {
            damageType: 'physical',
            fromHunterShadowSlash: true,
            isBackstab: true,
          });
        }
      }
    }
  } else {
    // Fallback crescent burst if player did not dash during Ult
    for (const en of sim.enemies) {
      if (en.hp > 0 && Math.hypot(en.x - sim.player.x, en.y - sim.player.y) <= 320 + en.radius) {
        hooks.damageEnemy(sim, en, finDmg, null, 120, en.x - sim.player.x, en.y - sim.player.y, stats.greedMult, false, false, false, {
          damageType: 'physical',
          fromHunterShadowSlash: true,
          isBackstab: true,
        });
      }
    }
  }

  sim.groundFx.push({
    kind: 'vfx',
    vfxId: 'moon_eclipse',
    x: sim.player.x,
    y: sim.player.y,
    radius: 120,
    maxRadius: 220,
    dw: 280,
    dh: 250,
    life: 0.55,
    maxLife: 0.55,
    color: '#A855F7',
  });
  sim.hunterUltDashHistory = [];
  addFloatingText(sim, sim.player.x, sim.player.y - 38, 'ปิดฉาก: จันทร์ดับ!', '#C084FC', 1.35);
}

// =========================================================================
// KNIGHT (อัศวินพิทักษ์ศักดิ์สิทธิ์ / Holy Bulwark)
// =========================================================================

export function ensureKnightPermanentBlades(sim: SimState): void {
  if (sim.raceClass !== 'knight') return;
  const targetPerm = sim.ultAscended ? 5 : 3;
  let permCount = sim.knightSacredBlades.filter((b) => b.tempLife < 0).length;
  while (permCount < targetPerm && sim.knightSacredBlades.length < 8) {
    const id = sim.knightNextBladeId++;
    sim.knightSacredBlades.push({
      id,
      x: sim.player.x,
      y: sim.player.y,
      homeAngleOffset: 0,
      state: 'orbit',
      targetId: null,
      targetX: sim.player.x,
      targetY: sim.player.y,
      tempLife: -1,
      slashProgress: 0,
    });
    permCount++;
  }
}

export function triggerKnightBulwarkSpin(
  sim: SimState,
  stats: ComputedStats,
  hooks: ClassSkillHooks
): void {
  const cappedLv = Math.min(sim.player.level, 40);
  const spinDmg =
    (40 + cappedLv * 2 + stats.armor * 3) * 2 * stats.damageMult * stats.classSkillPower;
  const radius = 155 * stats.areaMult;

  sound.playShieldBlock();
  triggerWeaponHitShake(sim, 0.16, 4.5);
  sim.groundFx.push({
    kind: 'vfx',
    vfxId: 'divine_shield',
    x: sim.player.x,
    y: sim.player.y,
    radius: 65,
    maxRadius: radius,
    dw: 170,
    dh: 162,
    life: 0.45,
    maxLife: 0.45,
    color: '#38BDF8',
  });
  sim.groundFx.push({
    kind: 'shockwave',
    x: sim.player.x,
    y: sim.player.y,
    radius: 20,
    maxRadius: radius,
    life: 0.34,
    maxLife: 0.34,
    color: '#FACC15',
  });
  for (const b of sim.knightSacredBlades) {
    b.state = 'striking';
    b.slashProgress = 0;
    b.targetX = sim.player.x + Math.cos(b.homeAngleOffset) * 115;
    b.targetY = sim.player.y + Math.sin(b.homeAngleOffset) * 115;
  }

  for (const en of sim.enemies) {
    if (en.hp <= 0) continue;
    const edx = en.x - sim.player.x;
    const edy = en.y - sim.player.y;
    if (Math.hypot(edx, edy) <= radius + en.radius) {
      const mult = (en.judgementTimer || 0) > 0 ? 1.25 : 1.0;
      hooks.damageEnemy(sim, en, spinDmg * mult, null, 280, edx, edy, stats.greedMult, false, false, false, {
        damageType: 'physical',
      });
    }
  }
  hooks.hitWorldTargetsInCircle(sim, sim.player.x, sim.player.y, radius, spinDmg, stats);
  addFloatingText(sim, sim.player.x, sim.player.y - 36, 'ป้อมปราการศักดิ์สิทธิ์! (กัน 100%)', '#38BDF8', 1.25);
}

export function executeKnightParryV2(
  sim: SimState,
  stats: ComputedStats,
  hooks: ClassSkillHooks
): void {
  if (sim.parryWindowTimer <= 0 || sim.raceClass !== 'knight') return;
  sim.parryWindowTimer = 0;
  sim.knightParryFlash = 0.45;
  sim.hitstopTimer = 0.1;
  sim.player.invulnTimer = Math.max(sim.player.invulnTimer, 0.45);
  sound.playParry();
  triggerAbilityFlash(sim, 0.24, 0.2);

  sim.groundFx.push({
    kind: 'vfx',
    vfxId: 'parry',
    x: sim.player.x,
    y: sim.player.y,
    radius: 55,
    maxRadius: 155,
    dw: 200,
    dh: 112,
    life: 0.34,
    maxLife: 0.34,
    color: '#FACC15',
  });
  sim.groundFx.push({
    kind: 'shockwave',
    x: sim.player.x,
    y: sim.player.y,
    radius: 20,
    maxRadius: 165,
    life: 0.34,
    maxLife: 0.34,
    color: '#FACC15',
  });
  spawnParticles(sim, sim.player.x, sim.player.y, '#FEF08A', 20, 210);
  addFloatingText(sim, sim.player.x, sim.player.y - 36, 'PARRY!', '#FACC15', 1.4);

  const parryReflectDmg =
    (85 + Math.min(sim.player.level, 40) * 4) * stats.damageMult * stats.classSkillPower;
  for (let bi = sim.enemyBullets.length - 1; bi >= 0; bi--) {
    const b = sim.enemyBullets[bi];
    if (Math.hypot(b.x - sim.player.x, b.y - sim.player.y) <= 165) {
      const spd = Math.hypot(b.vx, b.vy) || 260;
      const revAng = Math.atan2(-b.vy, -b.vx);
      sim.projectiles.push({
        weaponId: 'spear',
        evolved: true,
        fromClassSkill: true,
        damageType: 'physical',
        x: b.x,
        y: b.y,
        vx: Math.cos(revAng) * Math.max(360, spd * 1.4),
        vy: Math.sin(revAng) * Math.max(360, spd * 1.4),
        radius: 12,
        damage: parryReflectDmg,
        knockback: 180,
        pierce: 4,
        life: 1.2,
        maxLife: 1.2,
        hitIds: new Set(),
        rotation: revAng,
        color: '#FACC15',
      });
      sim.enemyBullets.splice(bi, 1);
    }
  }

  for (const en of sim.enemies) {
    if (en.hp <= 0) continue;
    if (Math.hypot(en.x - sim.player.x, en.y - sim.player.y) <= 165 + en.radius) {
      en.windupTimer = 0;
      en.freezeTimer = Math.max(en.freezeTimer || 0, 1.5);
      en.hardFreezeTimer = Math.max(en.hardFreezeTimer || 0, en.isBoss ? 0.55 : 1.5);
    }
  }

  sim.knightParryCount += 1;
  if (sim.ultActiveTimer <= 0) {
    sim.classGauge = Math.min(100, sim.classGauge + 15);
  }

  // Grant +1 temporary Sacred Blade (lasts 20s, cap total blades at 8)
  if (sim.knightSacredBlades.length < 8) {
    sim.knightSacredBlades.push({
      id: sim.knightNextBladeId++,
      x: sim.player.x,
      y: sim.player.y,
      homeAngleOffset: 0,
      state: 'orbit',
      targetId: null,
      targetX: sim.player.x,
      targetY: sim.player.y,
      tempLife: 20.0,
      slashProgress: 0,
    });
    sound.playBladeDraw();
  } else {
    // Refresh oldest temporary blade timer if already at 8
    const temp = sim.knightSacredBlades.find((b) => b.tempLife > 0);
    if (temp) temp.tempLife = 20.0;
  }

  // Ascension at 30 Parries: ราชันใจสิงห์
  if (!sim.ultAscended && sim.knightParryCount >= KNIGHT_PARRY_ASCEND_REQ) {
    sim.ultAscended = true;
    ensureKnightPermanentBlades(sim);
    sim.announcement = 'จุติ! ราชันใจสิงห์ (Lionheart King) — ดาบถาวร 5 เล่ม + Parry ปัก Excalibur!';
    sim.announcementTimer = 5.0;
    sound.playHolyBell();
  }

  if (sim.ultAscended) {
    const exX = sim.player.x + sim.player.facingX * 65;
    const exY = sim.player.y + sim.player.facingY * 65;
    sim.plantedExcalibur = { x: exX, y: exY, life: 0.5, maxLife: 0.5 };
    const miniExDmg =
      (110 + Math.min(sim.player.level, 40) * 4.5 + stats.armor * 4) *
      stats.damageMult *
      stats.classSkillPower;
    sim.groundFx.push({
      kind: 'vfx',
      vfxId: 'holy_smite',
      x: exX,
      y: exY,
      radius: 90,
      maxRadius: 165,
      dw: 210,
      dh: 168,
      life: 0.42,
      maxLife: 0.42,
      color: '#FACC15',
    });
    for (const en of sim.enemies) {
      if (en.hp > 0 && Math.hypot(en.x - exX, en.y - exY) <= 165 + en.radius) {
        hooks.damageEnemy(sim, en, miniExDmg, null, 240, en.x - exX, en.y - exY, stats.greedMult, false, false, false, {
          damageType: 'physical',
        });
      }
    }
  }
}

export function updateKnightSystem(
  sim: SimState,
  dt: number,
  stats: ComputedStats,
  hooks: ClassSkillHooks
): void {
  if (sim.raceClass !== 'knight') return;

  ensureKnightPermanentBlades(sim);

  // Expire temporary Sacred Blades
  for (let i = sim.knightSacredBlades.length - 1; i >= 0; i--) {
    const b = sim.knightSacredBlades[i];
    if (b.tempLife > 0) {
      b.tempLife -= dt;
      if (b.tempLife <= 0) {
        sim.knightSacredBlades.splice(i, 1);
      }
    }
  }

  // Periodic Taunt (ยั่วยุ) every 10s
  sim.knightTauntTimer -= dt;
  if (sim.knightTauntTimer <= 0) {
    sim.knightTauntTimer = 10.0;
    const tauntRadius = 300;
    sound.playTauntGong();
    triggerWeaponHitShake(sim, 0.14, 4.0);
    sim.groundFx.push({
      kind: 'vfx',
      vfxId: 'ground_slam',
      x: sim.player.x,
      y: sim.player.y,
      radius: 120,
      maxRadius: tauntRadius,
      dw: 260,
      dh: 185,
      life: 0.45,
      maxLife: 0.45,
      color: '#FACC15',
    });
    sim.groundFx.push({
      kind: 'shockwave',
      x: sim.player.x,
      y: sim.player.y,
      radius: 26,
      maxRadius: tauntRadius,
      life: 0.36,
      maxLife: 0.36,
      color: '#38BDF8',
    });
    let tauntedCount = 0;
    for (const en of sim.enemies) {
      if (en.hp <= 0) continue;
      if (Math.hypot(en.x - sim.player.x, en.y - sim.player.y) <= tauntRadius + en.radius) {
        en.knightTauntTimer = 3.0;
        en.judgementTimer = 3.0;
        tauntedCount++;
      }
    }
    if (tauntedCount > 0) {
      addFloatingText(sim, sim.player.x, sim.player.y - 34, `ยั่วยุ! (${tauntedCount} ตัวถูกพิพากษา)`, '#FACC15', 1.15);
    }
  }

  // Update Sacred Blades positions & attack cadence
  const inUlt = sim.ultActiveTimer > 0;
  const activeBladeCount = inUlt ? 8 : sim.knightSacredBlades.length;
  const backAngle = Math.atan2(-sim.player.facingY, -sim.player.facingX);
  const fanSpread = Math.PI * 0.78;

  // Sync visual blade array during Ult up to 8 giant blades
  const bladesToUpdate: KnightSacredBlade[] = sim.knightSacredBlades;
  const attackInterval = (inUlt ? 0.5 : 1.4) * Math.max(0.65, stats.cooldownMult);
  sim.knightBladeAttackTimer -= dt;
  const triggerStrike = sim.knightBladeAttackTimer <= 0;
  if (triggerStrike) {
    sim.knightBladeAttackTimer = attackInterval;

    // Collect nearest distinct enemies within 320px
    const candidates: Array<{ enemy: EnemyEntity; d2: number }> = [];
    const rangeMaxSq = (inUlt ? 420 : 320) ** 2;
    for (const en of sim.enemies) {
      if (en.hp <= 0) continue;
      const d2 = (en.x - sim.player.x) ** 2 + (en.y - sim.player.y) ** 2;
      if (d2 <= rangeMaxSq) candidates.push({ enemy: en, d2 });
    }
    candidates.sort((a, b) => a.d2 - b.d2);

    const cappedLv = Math.min(sim.player.level, 40);
    const bladeBaseDmg =
      (40 + cappedLv * 2 + stats.armor * 3) *
      (inUlt ? 1.55 : 1.0) *
      stats.damageMult *
      stats.classSkillPower;

    if (candidates.length > 0) {
      sound.playBladeDraw();
      const strikeCount = Math.max(bladesToUpdate.length, inUlt ? 8 : 0);
      for (let idx = 0; idx < strikeCount; idx++) {
        const target = candidates[idx % candidates.length].enemy;
        const b = bladesToUpdate[idx];
        if (b) {
          b.state = 'striking';
          b.targetId = target.id;
          b.targetX = target.x;
          b.targetY = target.y;
          b.slashProgress = 0;
        }
        const preHp = target.hp;
        const judgeMult = (target.judgementTimer || 0) > 0 ? 1.25 : 1.0;
        hooks.damageEnemy(
          sim,
          target,
          bladeBaseDmg * judgeMult,
          null,
          inUlt ? 200 : 140,
          target.x - sim.player.x,
          target.y - sim.player.y,
          stats.greedMult,
          false,
          false,
          false,
          { damageType: 'physical' }
        );
        sim.groundFx.push({
          kind: 'vfx',
          vfxId: 'holy_slash',
          x: target.x,
          y: target.y,
          radius: 42,
          maxRadius: 72,
          dw: inUlt ? 150 : 112,
          dh: inUlt ? 116 : 86,
          rotation: Math.atan2(target.y - sim.player.y, target.x - sim.player.x),
          life: 0.24,
          maxLife: 0.24,
          color: inUlt ? '#FACC15' : '#38BDF8',
        });
        if (sim.vfx) {
          spawnVfx(sim.vfx, 'slash_holy', target.x, target.y, {
            rotation: Math.atan2(target.y - b.y, target.x - b.x),
            scale: inUlt ? 1.35 : 1.05,
          });
        }
        if (preHp > 0 && target.hp <= 0 && sim.ultActiveTimer <= 0) {
          sim.classGauge = Math.min(100, sim.classGauge + 0.5);
        }
      }
      sound.playSlash(inUlt);
    }
  }

  for (let i = 0; i < bladesToUpdate.length; i++) {
    const b = bladesToUpdate[i];
    const t = bladesToUpdate.length <= 1 ? 0.5 : i / (bladesToUpdate.length - 1);
    const fanAngle = backAngle + (t - 0.5) * fanSpread;
    b.homeAngleOffset = fanAngle;
    const homeX = sim.player.x + Math.cos(fanAngle) * 34;
    const homeY = sim.player.y + Math.sin(fanAngle) * 34;

    if (b.state === 'striking') {
      b.slashProgress += dt * 7.5;
      if (b.slashProgress < 1) {
        b.x += (b.targetX - b.x) * Math.min(1, dt * 22);
        b.y += (b.targetY - b.y) * Math.min(1, dt * 22);
      } else {
        b.state = 'returning';
      }
    } else if (b.state === 'returning') {
      b.x += (homeX - b.x) * Math.min(1, dt * 15);
      b.y += (homeY - b.y) * Math.min(1, dt * 15);
      if (Math.hypot(homeX - b.x, homeY - b.y) <= 10) {
        b.state = 'orbit';
      }
    } else {
      b.x += (homeX - b.x) * Math.min(1, dt * 18);
      b.y += (homeY - b.y) * Math.min(1, dt * 18);
    }
  }
  void activeBladeCount;
}

export function triggerKnightUltFinale(
  sim: SimState,
  stats: ComputedStats,
  hooks: ClassSkillHooks
): void {
  const cappedLv = Math.min(sim.player.level, 40);
  const slamDmg =
    (240 + cappedLv * 8 + stats.armor * 6) * stats.damageMult * stats.classSkillPower;
  const slamRadius = 260 * stats.areaMult;

  triggerWeaponHitShake(sim, 0.28, 7.5);
  triggerAbilityFlash(sim, 0.28, 0.25);
  sound.playHolyBell();
  sound.playSlash(true);

  for (let k = 0; k < 8; k++) {
    const a = (k * Math.PI * 2) / 8;
    const sx = sim.player.x + Math.cos(a) * 115;
    const sy = sim.player.y + Math.sin(a) * 115;
    sim.groundFx.push({
      kind: 'vfx',
      vfxId: 'holy_smite',
      x: sx,
      y: sy,
      radius: 80,
      maxRadius: 135,
      dw: 170,
      dh: 134,
      life: 0.45,
      maxLife: 0.45,
      color: '#FACC15',
    });
  }
  sim.groundFx.push({
    kind: 'vfx',
    vfxId: 'ground_slam',
    x: sim.player.x,
    y: sim.player.y,
    radius: 150,
    maxRadius: slamRadius,
    dw: 310,
    dh: 224,
    life: 0.5,
    maxLife: 0.5,
    color: '#FACC15',
  });

  for (const en of sim.enemies) {
    if (en.hp <= 0) continue;
    const edx = en.x - sim.player.x;
    const edy = en.y - sim.player.y;
    if (Math.hypot(edx, edy) <= slamRadius + en.radius) {
      hooks.damageEnemy(sim, en, slamDmg, null, 320, edx, edy, stats.greedMult, false, false, false, {
        damageType: 'physical',
      });
    }
  }
  hooks.hitWorldTargetsInCircle(sim, sim.player.x, sim.player.y, slamRadius, slamDmg, stats);
  addFloatingText(sim, sim.player.x, sim.player.y - 40, 'ปิดฉาก: สวรรค์พิพากษา!', '#FACC15', 1.38);
}

// =========================================================================
// SAINT (นักบุญผู้สร้างแดนศักดิ์สิทธิ์ / Sanctum Saint)
// =========================================================================

export function getSaintSanctumPolygon(sim: SimState): Array<{ x: number; y: number }> | null {
  if (sim.raceClass !== 'saint' || sim.saintSigils.length < 3) return null;
  return orderPolygonVertices(sim.saintSigils);
}

export function getSanctumCenter(sim: SimState): { x: number; y: number } | null {
  const poly = getSaintSanctumPolygon(sim);
  if (!poly) return null;
  return polygonCentroid(poly);
}

export function isPointInSaintSanctum(sim: SimState, x: number, y: number): boolean {
  if (sim.raceClass !== 'saint') return false;
  if (sim.ultActiveTimer > 0) return true; // Ult expands Sanctum full-screen!
  const poly = getSaintSanctumPolygon(sim);
  if (!poly) return false;
  return isPointInPolygon(x, y, poly);
}

export function onSaintDashSigil(sim: SimState): void {
  if (sim.raceClass !== 'saint') return;
  const maxSigils = sim.ultAscended ? 4 : 3;
  while (sim.saintSigils.length >= maxSigils) {
    sim.saintSigils.shift();
  }
  sim.saintSigils.push({
    id: sim.saintNextSigilId++,
    x: sim.dashStartX,
    y: sim.dashStartY,
    life: 20.0,
    maxLife: 20.0,
    beamTimer: 0.45,
    dotTimer: 0.5,
  });
  sim.groundFx.push({
    kind: 'vfx',
    vfxId: 'holy_sigil',
    x: sim.dashStartX,
    y: sim.dashStartY,
    radius: 65,
    maxRadius: 95,
    dw: 130,
    dh: 100,
    life: 0.5,
    maxLife: 0.5,
    color: '#FDE047',
  });
  if (sim.vfx) {
    spawnVfx(sim.vfx, 'magic_circle_gold', sim.dashStartX, sim.dashStartY, {
      scale: 1.3,
      lifetime: 20.0,
      squashY: 0.68,
    });
  }
  if (sim.saintSigils.length >= 3) {
    sound.playHolyBell();
    sim.groundFx.push({
      kind: 'vfx',
      vfxId: 'sanctum_burst',
      x: sim.dashStartX,
      y: sim.dashStartY,
      radius: 90,
      maxRadius: 150,
      dw: 160,
      dh: 160,
      life: 0.42,
      maxLife: 0.42,
      color: '#FACC15',
    });
  }
}

export function updateSaintSystem(
  sim: SimState,
  dt: number,
  stats: ComputedStats,
  hooks: ClassSkillHooks
): void {
  if (sim.raceClass !== 'saint') return;

  const cappedLv = Math.min(sim.player.level, 40);

  // Passive +2 HP every 2s (ALWAYS via applyPlayerHeal, NOT applyLeechHeal!)
  sim.saintRegenTimer -= dt;
  if (sim.saintRegenTimer <= 0) {
    sim.saintRegenTimer = 2.0;
    if (sim.player.hp < sim.player.maxHp) {
      const healed = applyPlayerHeal(sim, 2);
      if (healed > 0) {
        addFloatingText(sim, sim.player.x, sim.player.y - 24, `+${healed}`, '#FDE047', 0.85);
      }
    }
  }

  // Update Holy Sigils (expire after 20s, single-sigil contact DoT, & 1s light beams inside Sanctum)
  const sanctumActive = sim.ultActiveTimer > 0 || sim.saintSigils.length >= 3;
  const sigilRadius = 90 * stats.areaMult;
  const sigilLightDmg = (30 + cappedLv * 1.5) * stats.damageMult * stats.classSkillPower;

  for (let si = sim.saintSigils.length - 1; si >= 0; si--) {
    const sig = sim.saintSigils[si];
    sig.life -= dt;
    if (sig.life <= 0) {
      sim.saintSigils.splice(si, 1);
      continue;
    }

    // Single sigil damage for enemies stepping on it
    sig.dotTimer -= dt;
    if (sig.dotTimer <= 0) {
      sig.dotTimer = 0.5;
      for (const en of sim.enemies) {
        if (en.hp <= 0) continue;
        if (Math.hypot(en.x - sig.x, en.y - sig.y) <= sigilRadius + en.radius) {
          hooks.damageEnemy(sim, en, sigilLightDmg * 0.65, null, 25, en.x - sig.x, en.y - sig.y, stats.greedMult, false, false, false, {
            damageType: 'magic',
          });
        }
      }
    }

    // Each sigil fires a light beam at an enemy inside Sanctum every 1s
    if (sanctumActive) {
      sig.beamTimer -= dt;
      if (sig.beamTimer <= 0) {
        sig.beamTimer = 1.0;
        let beamTarget: EnemyEntity | null = null;
        let bestD2 = 620 * 620;
        for (const en of sim.enemies) {
          if (en.hp <= 0) continue;
          if (!isPointInSaintSanctum(sim, en.x, en.y)) continue;
          const d2 = (en.x - sig.x) ** 2 + (en.y - sig.y) ** 2;
          if (d2 < bestD2) {
            bestD2 = d2;
            beamTarget = en;
          }
        }
        if (beamTarget) {
          sim.groundFx.push({
            kind: 'beam',
            x: sig.x,
            y: sig.y - 12,
            x2: beamTarget.x,
            y2: beamTarget.y,
            radius: 7,
            maxRadius: 7,
            life: 0.22,
            maxLife: 0.22,
            color: '#FDE047',
          });
          hooks.damageEnemy(
            sim,
            beamTarget,
            sigilLightDmg * 1.45,
            null,
            40,
            beamTarget.x - sig.x,
            beamTarget.y - sig.y,
            stats.greedMult,
            false,
            false,
            false,
            { damageType: 'magic' }
          );
        }
      }
    }
  }

  // Sanctum Area Healing (1.5% Max HP/s via applyPlayerHeal) + Enemy Light Damage every 0.5s
  if (sanctumActive) {
    if (isPointInSaintSanctum(sim, sim.player.x, sim.player.y) && sim.player.hp < sim.player.maxHp) {
      sim.saintSanctumHealBuffer += sim.player.maxHp * 0.015 * dt;
      if (sim.saintSanctumHealBuffer >= 1) {
        const whole = Math.floor(sim.saintSanctumHealBuffer);
        sim.saintSanctumHealBuffer -= whole;
        const healed = applyPlayerHeal(sim, whole);
        if (healed > 0) {
          addFloatingText(sim, sim.player.x, sim.player.y - 26, `+${healed}`, '#FDE047', 0.88);
        }
      }
    }

    sim.saintSanctumDamageTimer -= dt;
    if (sim.saintSanctumDamageTimer <= 0) {
      sim.saintSanctumDamageTimer = 0.5;
      for (const en of sim.enemies) {
        if (en.hp <= 0) continue;
        if (isPointInSaintSanctum(sim, en.x, en.y)) {
          hooks.damageEnemy(sim, en, sigilLightDmg, null, 15, 0, 0, stats.greedMult, false, true, false, {
            damageType: 'magic',
          });
        }
      }
    }
  }

  // Guardian Golem AI
  if (sim.golem) {
    const gm = sim.golem;
    if (gm.leapCooldown > 0) gm.leapCooldown = Math.max(0, gm.leapCooldown - dt);
    if (gm.respawnTimer > 0) {
      gm.respawnTimer -= dt;
      if (gm.respawnTimer <= 0) {
        gm.respawnTimer = 0;
        const gMax = Math.round(sim.player.maxHp * 2.5);
        gm.maxHp = gMax;
        gm.hp = gMax;
        gm.x = sim.player.x + 48;
        gm.y = sim.player.y - 12;
        sim.groundFx.push({
          kind: 'warp',
          x: gm.x,
          y: gm.y,
          radius: 16,
          maxRadius: 95,
          life: 0.4,
          maxLife: 0.4,
          color: '#FDE047',
        });
        addFloatingText(sim, gm.x, gm.y - 34, 'โกเล็มคืนชีพ!', '#FDE047', 1.15);
      }
    } else {
      // Regenerate 2% Max HP/s while inside Sanctum
      if (isPointInSaintSanctum(sim, gm.x, gm.y) && gm.hp < gm.maxHp) {
        sim.saintGolemHealBuffer += gm.maxHp * 0.02 * dt;
        if (sim.saintGolemHealBuffer >= 1) {
          const whole = Math.floor(sim.saintGolemHealBuffer);
          sim.saintGolemHealBuffer -= whole;
          gm.hp = Math.min(gm.maxHp, gm.hp + whole);
        }
      }

      // Walk to center of Sanctum (or guard near player if no Sanctum)
      const sanctumCenter = getSanctumCenter(sim);
      const goalX = sanctumCenter
        ? sanctumCenter.x
        : sim.player.x + Math.cos(sim.orbitAngle * 0.45) * 68;
      const goalY = sanctumCenter
        ? sanctumCenter.y
        : sim.player.y + Math.sin(sim.orbitAngle * 0.45) * 68;

      const gdx = goalX - gm.x;
      const gdy = goalY - gm.y;
      const gd = Math.hypot(gdx, gdy);
      if (gd > 20) {
        const gSpd = gd > 450 ? 460 : 225;
        gm.x += (gdx / gd) * gSpd * dt;
        gm.y += (gdy / gd) * gSpd * dt;
        gm.walkCycle += dt * (gd > 450 ? 15 : 9);
      }

      // Periodic AoE Taunt: every 8s normal (every 3s screen-wide during Ult!)
      sim.saintGolemTauntTimer -= dt;
      if (sim.saintGolemTauntTimer <= 0) {
        const inUlt = sim.ultActiveTimer > 0;
        sim.saintGolemTauntTimer = inUlt ? 3.0 : 8.0;
        const tauntR = inUlt ? 950 : 350;
        sound.playTauntGong();
        sim.groundFx.push({
          kind: 'shockwave',
          x: gm.x,
          y: gm.y,
          radius: 26,
          maxRadius: Math.min(420, tauntR),
          life: 0.42,
          maxLife: 0.42,
          color: '#F43F5E',
        });
        for (const en of sim.enemies) {
          if (en.hp <= 0 || en.isBoss) continue;
          if (Math.hypot(en.x - gm.x, en.y - gm.y) <= tauntR + en.radius) {
            en.tauntGolemTimer = 4.0;
          }
        }
      }

      // Golem Slam every 1.2s destroying enemy bullets within 120px + damaging nearby enemies
      if (gm.smashingTimer > 0) gm.smashingTimer -= dt;
      gm.smashCooldown -= dt;
      if (gm.smashCooldown <= 0) {
        gm.smashCooldown = 1.2;
        gm.smashingTimer = 0.32;
        const slamR = 120;
        const smashDmg = (85 + cappedLv * 4.2) * stats.damageMult * stats.classSkillPower;
        let clearedAny = false;
        for (let bi = sim.enemyBullets.length - 1; bi >= 0; bi--) {
          const b = sim.enemyBullets[bi];
          if (Math.hypot(b.x - gm.x, b.y - gm.y) <= slamR) {
            sim.enemyBullets.splice(bi, 1);
            clearedAny = true;
          }
        }
        let hitAny = false;
        for (const en of sim.enemies) {
          if (en.hp <= 0) continue;
          if (Math.hypot(en.x - gm.x, en.y - gm.y) <= slamR + en.radius) {
            hitAny = true;
            en.freezeTimer = Math.max(en.freezeTimer || 0, 0.45);
            hooks.damageEnemy(sim, en, smashDmg, null, 240, en.x - gm.x, en.y - gm.y, stats.greedMult, false, false, false, {
              damageType: 'physical',
            });
          }
        }
        if (clearedAny || hitAny) {
          sound.playGolemSlam();
          sim.groundFx.push({
            kind: 'vfx',
            vfxId: 'ground_slam',
            x: gm.x,
            y: gm.y,
            radius: 60,
            maxRadius: slamR,
            dw: 210,
            dh: 152,
            life: 0.36,
            maxLife: 0.36,
            color: '#FDE047',
          });
        }
      }

      // Seraph Oath Ult (1s) or Ascended Saint (3s): 8-way radiant light spears!
      if (sim.ultActiveTimer > 0 || sim.ultAscended) {
        gm.spearTimer -= dt;
        if (gm.spearTimer <= 0) {
          gm.spearTimer = sim.ultActiveTimer > 0 ? 1.0 : 3.0;
          const spearDmg = (68 + cappedLv * 3.0) * stats.damageMult * stats.classSkillPower;
          const spd = 500 * stats.projSpeedMult;
          for (let k = 0; k < 8; k++) {
            const a = (k * Math.PI * 2) / 8 + sim.orbitAngle * 0.25;
            sim.projectiles.push({
              weaponId: 'spear',
              evolved: true,
              fromClassSkill: true,
              damageType: 'magic',
              x: gm.x,
              y: gm.y,
              vx: Math.cos(a) * spd,
              vy: Math.sin(a) * spd,
              radius: 11 * stats.areaMult,
              damage: spearDmg,
              knockback: 90,
              pierce: 8,
              life: 1.15,
              maxLife: 1.15,
              hitIds: new Set(),
              rotation: a,
              color: '#FDE047',
            });
          }
        }
      }
    }
  }
}

export function triggerSaintUltFinale(
  sim: SimState,
  stats: ComputedStats,
  hooks: ClassSkillHooks
): void {
  const cappedLv = Math.min(sim.player.level, 40);
  const pxG = sim.golem ? sim.golem.x : sim.player.x;
  const pyG = sim.golem ? sim.golem.y : sim.player.y;
  const pRad = 250 * stats.areaMult;
  const pBurst = (180 + cappedLv * 7) * stats.damageMult * stats.classSkillPower;

  sound.playHolyBell();
  triggerAbilityFlash(sim, 0.26, 0.24);

  // Main giant pillar at Golem
  sim.elementalFields.push({
    kind: 'heaven_pillar',
    x: pxG,
    y: pyG,
    vx: 0,
    vy: 0,
    radius: pRad,
    damage: (45 + cappedLv * 2.5) * stats.damageMult * stats.classSkillPower,
    color: '#FDE047',
    life: 1.4,
    maxLife: 1.4,
    tickTimer: 0.15,
    pullStrength: 0,
  });
  sim.groundFx.push({
    kind: 'vfx',
    vfxId: 'holy_pillar',
    x: pxG,
    y: pyG,
    radius: 110,
    maxRadius: pRad,
    dw: 230,
    dh: 280,
    life: 0.65,
    maxLife: 0.65,
    color: '#FDE047',
  });

  for (const en of sim.enemies) {
    if (en.hp > 0 && Math.hypot(en.x - pxG, en.y - pyG) <= pRad + en.radius) {
      en.hardFreezeTimer = Math.max(en.hardFreezeTimer || 0, en.isBoss ? 0.5 : 1.2);
      hooks.damageEnemy(sim, en, pBurst, null, 240, en.x - pxG, en.y - pyG, stats.greedMult, false, false, false, {
        damageType: 'magic',
      });
    }
  }

  // 12 smaller pillars scattered across screen
  const smallDmg = (115 + cappedLv * 4.5) * stats.damageMult * stats.classSkillPower;
  for (let k = 0; k < 12; k++) {
    const ang = (k / 12) * Math.PI * 2 + Math.random() * 0.4;
    const dist = 120 + Math.random() * 290;
    const sx = sim.player.x + Math.cos(ang) * dist;
    const sy = sim.player.y + Math.sin(ang) * dist;
    sim.groundFx.push({
      kind: 'vfx',
      vfxId: 'holy_pillar',
      x: sx,
      y: sy,
      radius: 65,
      maxRadius: 95,
      dw: 135,
      dh: 165,
      life: 0.55,
      maxLife: 0.55,
      color: '#FEF08A',
    });
    for (const en of sim.enemies) {
      if (en.hp > 0 && Math.hypot(en.x - sx, en.y - sy) <= 85 + en.radius) {
        hooks.damageEnemy(sim, en, smallDmg, null, 140, en.x - sx, en.y - sy, stats.greedMult, false, false, false, {
          damageType: 'magic',
        });
      }
    }
  }

  addFloatingText(sim, sim.player.x, sim.player.y - 38, 'ปิดฉาก: เสาพิพากษา!', '#FDE047', 1.35);
}
