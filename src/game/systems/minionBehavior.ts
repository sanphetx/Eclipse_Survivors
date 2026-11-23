import { EnemyKind, RaceClassId, WeaponId } from '../types';
import { ComputedStats } from './simTypes';

export const NECRO_MINION_CAP = 28;
export const NECRO_FEALTY_CAP = 10;
export const NECRO_MINION_LIFETIME = 60;
export const NECRO_SOUL_CAP_PCT = 80;
export const NECRO_SOUL_GAIN_NORMAL = 0.03;
export const NECRO_SOUL_GAIN_FEALTY = 0.09;
export const NECRO_SHIELD_MAX = 300;
export const NECRO_SHIELD_DURATION = 120;
export const NECRO_FEALTY_SPEED_PER_MINION = 0.002;

export interface NecroMinionEntity {
  id: number;
  kind: EnemyKind;
  nameTh: string;
  isElite: boolean;
  isMiniBoss: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  hp: number;
  maxHp: number;
  attack: number;
  speed: number;
  armorRatio: number;
  life: number;
  maxLife: number;
  fealtyBuffed: boolean;
  attackCd: number;
  hitFlash: number;
  isRanged: boolean;
}

export interface MinionEnemyLike {
  id: number;
  kind: EnemyKind;
  nameTh?: string;
  isElite?: boolean;
  x: number;
  y: number;
  radius: number;
  hp: number;
  speed: number;
  isBoss: boolean;
  isMajorBoss: boolean;
  isReaper: boolean;
}

export interface MinionProjectileLike {
  weaponId: WeaponId;
  evolved: boolean;
  fromClassSkill?: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  damage: number;
  knockback: number;
  pierce: number;
  life: number;
  maxLife: number;
  hitIds: Set<number>;
  rotation: number;
  color: string;
}

export interface MinionGroundFxLike {
  kind: 'explosion' | 'shockwave';
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  life: number;
  maxLife: number;
  color: string;
}

export interface MinionSimLike<TEnemy extends MinionEnemyLike = MinionEnemyLike> {
  player: {
    x: number;
    y: number;
    maxHp: number;
    level: number;
  };
  raceClass: RaceClassId | null;
  elapsedSeconds: number;
  realmStartSeconds: number;
  realmTier: number;
  ultActiveTimer: number;
  classGauge: number;
  mana: number;
  necroMinions: NecroMinionEntity[];
  necroMinionSeq: number;
  necroSoulsCount: number;
  necroSoulBonusPct: number;
  necroShield: number;
  necroShieldTimer: number;
  enemies: TEnemy[];
  projectiles: MinionProjectileLike[];
}

export interface MinionSoulOrbSpawn {
  x: number;
  y: number;
  color: string;
  glowColor: string;
  fealty: boolean;
  isMiniBoss: boolean;
  count: number;
}

export interface MinionBehaviorHooks<TEnemy extends MinionEnemyLike = MinionEnemyLike> {
  damageEnemy: (
    enemy: TEnemy,
    rawDamage: number,
    knockback: number,
    kbDx: number,
    kbDy: number,
    greedMult: number,
    customDamageColor?: string
  ) => void;
  hitWorldTargetsInCircle?: (cx: number, cy: number, radius: number, dmg: number) => void;
  addGroundFx: (fx: MinionGroundFxLike) => void;
  spawnParticles: (x: number, y: number, color: string, count: number, speed: number) => void;
  addFloatingText: (x: number, y: number, text: string, color: string, scale: number) => void;
  spawnSoulOrb?: (orb: MinionSoulOrbSpawn) => void;
}

export interface NecroMinionHudSummary {
  activeCount: number;
  fealtyCount: number;
  timedCount: number;
  miniBossCount: number;
  soonestExpireSec: number | null;
  fealtySpeedPct: number;
  soulBonusPct: number;
}

const RANGED_MINION_KINDS: ReadonlySet<EnemyKind> = new Set([
  'cultist',
  'archer',
  'flower',
  'miniboss_blossom',
]);

export function computeMinionScaledAttack(
  level: number,
  realmMin: number,
  realmTier: number,
  damageMult: number,
  tierMult = 1.0
): number {
  const baseAtk = (24 + level * 2.8 + realmMin * 2.5 + realmTier * 20) * damageMult;
  return Math.max(12, Math.round(baseAtk * tierMult));
}

/**
 * Passive Necromancer resurrection on enemy kill:
 * 10% + (Level * 1.5%) chance to raise defeated non-major-boss enemies (including mini-bosses)
 * with 33% of player's max HP, scaled attack, and a 60s lifetime.
 */
export function tryResurrectNecroMinion<TEnemy extends MinionEnemyLike>(
  sim: MinionSimLike<TEnemy>,
  enemy: TEnemy,
  stats: ComputedStats,
  fallbackNameTh: string,
  hooks: Pick<MinionBehaviorHooks<TEnemy>, 'spawnParticles' | 'addFloatingText'>
): NecroMinionEntity | null {
  if (sim.raceClass !== 'death_god') return null;

  if (Math.random() < 0.25) {
    sim.mana = Math.min(stats.maxMana, sim.mana + 1);
  }
  if (sim.ultActiveTimer <= 0) {
    sim.classGauge = Math.min(100, sim.classGauge + 0.6);
  }

  if (enemy.isMajorBoss || enemy.isReaper) return null;

  const reviveChance = Math.min(1.0, 0.1 + sim.player.level * 0.015);
  if (Math.random() >= reviveChance) return null;

  const isMiniBoss = Boolean(enemy.isBoss && !enemy.isMajorBoss && !enemy.isReaper);
  let canPlace = sim.necroMinions.length < NECRO_MINION_CAP;
  if (!canPlace && (isMiniBoss || enemy.isElite)) {
    const replaceIdx = sim.necroMinions.findIndex((m) => !m.fealtyBuffed && !m.isMiniBoss);
    if (replaceIdx >= 0) {
      sim.necroMinions.splice(replaceIdx, 1);
      canPlace = true;
    }
  }
  if (!canPlace) return null;

  const killRealmMin = Math.floor(Math.max(0, sim.elapsedSeconds - sim.realmStartSeconds) / 60);
  const atkMult = isMiniBoss ? 2.25 : enemy.isElite ? 1.4 : 1.0;
  const minionHp = Math.max(25, Math.round(sim.player.maxHp * 0.33));
  const minionAtk = computeMinionScaledAttack(
    sim.player.level,
    killRealmMin,
    sim.realmTier,
    stats.damageMult,
    atkMult
  );

  sim.necroMinionSeq += 1;
  const raised: NecroMinionEntity = {
    id: sim.necroMinionSeq,
    kind: enemy.kind,
    nameTh: enemy.nameTh || fallbackNameTh || 'ผู้รับใช้แห่งความตาย',
    isElite: Boolean(enemy.isElite),
    isMiniBoss,
    x: enemy.x,
    y: enemy.y,
    vx: 0,
    vy: 0,
    radius: Math.max(12, Math.min(28, enemy.radius * 0.92)),
    hp: minionHp,
    maxHp: minionHp,
    attack: minionAtk,
    speed: Math.max(135, Math.min(235, enemy.speed * 1.18)),
    armorRatio: isMiniBoss ? 0.35 : enemy.isElite ? 0.2 : 0.1,
    life: NECRO_MINION_LIFETIME,
    maxLife: NECRO_MINION_LIFETIME,
    fealtyBuffed: false,
    attackCd: 0.25,
    hitFlash: 0,
    isRanged: RANGED_MINION_KINDS.has(enemy.kind),
  };

  sim.necroMinions.push(raised);
  if (sim.ultActiveTimer <= 0) {
    sim.classGauge = Math.min(100, sim.classGauge + (isMiniBoss ? 12 : 4));
  }
  hooks.spawnParticles(
    enemy.x,
    enemy.y,
    isMiniBoss ? '#FDE047' : '#34D399',
    isMiniBoss ? 14 : 7,
    115
  );
  hooks.addFloatingText(
    enemy.x,
    enemy.y - 22,
    isMiniBoss ? 'คืนชีพมินิบอส Minion!' : 'ฟื้นคืนชีพ Minion!',
    isMiniBoss ? '#FDE047' : '#34D399',
    isMiniBoss ? 1.15 : 0.92
  );

  return raised;
}

/**
 * Dominion of Eternal Fealty (Necromancer Ultimate):
 * - Ensures at least 3 living minions by summoning spectral guards if needed.
 * - Grants permanent lifetime (no timer expiration; only dies if HP reaches 0),
 *   +20% Max HP, +15% Attack Damage, and +15% Attack Speed.
 * - Grants Soul Shield equal to 25 * buffedAlive (capped at 300) for 2 minutes.
 */
export function castDominionOfEternalFealty<TEnemy extends MinionEnemyLike>(
  sim: MinionSimLike<TEnemy>,
  stats: ComputedStats,
  hooks: Pick<MinionBehaviorHooks<TEnemy>, 'addGroundFx' | 'spawnParticles' | 'addFloatingText'>
): { buffedAlive: number; shieldGain: number } {
  const uMin = Math.floor(Math.max(0, sim.elapsedSeconds - sim.realmStartSeconds) / 60);

  let aliveCount = sim.necroMinions.filter((m) => m.hp > 0).length;
  while (aliveCount < 3 && sim.necroMinions.length < NECRO_MINION_CAP) {
    sim.necroMinionSeq += 1;
    const ang = (aliveCount * Math.PI * 2) / 3 + sim.elapsedSeconds * 0.5;
    const skHp = Math.max(25, Math.round(sim.player.maxHp * 0.33));
    const isRangedSk = aliveCount % 2 === 1;
    sim.necroMinions.push({
      id: sim.necroMinionSeq,
      kind: isRangedSk ? 'cultist' : 'stalker',
      nameTh: isRangedSk ? 'นักบวชโครงกระดูก' : 'อัศวินเงาวิญญาณ',
      isElite: false,
      isMiniBoss: false,
      x: sim.player.x + Math.cos(ang) * 58,
      y: sim.player.y + Math.sin(ang) * 58,
      vx: 0,
      vy: 0,
      radius: 14,
      hp: skHp,
      maxHp: skHp,
      attack: computeMinionScaledAttack(
        sim.player.level,
        uMin,
        sim.realmTier,
        stats.damageMult,
        1.08
      ),
      speed: 175,
      armorRatio: 0.15,
      life: NECRO_MINION_LIFETIME,
      maxLife: NECRO_MINION_LIFETIME,
      fealtyBuffed: false,
      attackCd: 0.15,
      hitFlash: 0,
      isRanged: isRangedSk,
    });
    aliveCount += 1;
  }

  // Heal existing Fealty-buffed minions first, then promote top-priority unbuffed minions up to NECRO_FEALTY_CAP (10)
  let existingFealty = 0;
  const candidates: NecroMinionEntity[] = [];
  for (let mi = 0; mi < sim.necroMinions.length; mi++) {
    const m = sim.necroMinions[mi];
    if (m.hp <= 0) continue;
    if (m.fealtyBuffed) {
      existingFealty += 1;
      m.hp = Math.min(m.maxHp, m.hp + Math.round(m.maxHp * 0.2));
      hooks.spawnParticles(m.x, m.y, '#FDE047', 6, 110);
    } else {
      candidates.push(m);
    }
  }

  // Prioritize Mini-Bosses -> Elites -> highest attack minions
  candidates.sort((a, b) => {
    const tierA = a.isMiniBoss ? 2 : a.isElite ? 1 : 0;
    const tierB = b.isMiniBoss ? 2 : b.isElite ? 1 : 0;
    if (tierB !== tierA) return tierB - tierA;
    return b.attack - a.attack;
  });

  const slotsLeft = Math.max(0, NECRO_FEALTY_CAP - existingFealty);
  let newlyBuffed = 0;
  for (let i = 0; i < candidates.length && newlyBuffed < slotsLeft; i++) {
    const m = candidates[i];
    const oldMax = m.maxHp;
    m.fealtyBuffed = true;
    m.maxHp = Math.round(oldMax * 1.2);
    m.hp = Math.min(m.maxHp, m.hp + Math.round(oldMax * 0.2));
    newlyBuffed += 1;
    hooks.spawnParticles(m.x, m.y, '#FDE047', 8, 120);
  }

  const buffedAlive = Math.min(NECRO_FEALTY_CAP, existingFealty + newlyBuffed);
  const shieldGain = buffedAlive * 25;
  if (shieldGain > 0) {
    sim.necroShield = Math.min(NECRO_SHIELD_MAX, sim.necroShield + shieldGain);
    sim.necroShieldTimer = NECRO_SHIELD_DURATION;
  }

  hooks.addGroundFx({
    kind: 'shockwave',
    x: sim.player.x,
    y: sim.player.y,
    radius: 20,
    maxRadius: 240,
    life: 0.45,
    maxLife: 0.45,
    color: '#A855F7',
  });
  hooks.spawnParticles(sim.player.x, sim.player.y, '#C084FC', 22, 195);
  hooks.addFloatingText(
    sim.player.x,
    sim.player.y - 38,
    shieldGain > 0
      ? `Fealty x${buffedAlive}! โล่ +${shieldGain} (${Math.round(sim.necroShield)}/${NECRO_SHIELD_MAX})`
      : 'Dominion of Eternal Fealty!',
    '#C084FC',
    1.2
  );

  return { buffedAlive, shieldGain };
}

/**
 * Minion Behavior Manager:
 * 1. Decays Dominion Soul Shield duration (2 min).
 * 2. Tracks individual minion lifetimes (60s for standard minions, permanent for Fealty-buffed).
 * 3. Triggers necrotic AoE explosion + Soul harvest (0.03% normal / 0.09% Fealty, cap 80%) and Soul Absorption orbs on death or expiration.
 * 4. Uses flocking steering (neighbor separation, velocity alignment, player core exclusion) + perimeter guard slots + weighted target priority.
 */
export function updateMinionBehavior<TEnemy extends MinionEnemyLike>(
  sim: MinionSimLike<TEnemy>,
  dt: number,
  stats: ComputedStats,
  hooks: MinionBehaviorHooks<TEnemy>
): void {
  if (sim.necroShieldTimer > 0) {
    sim.necroShieldTimer = Math.max(0, sim.necroShieldTimer - dt);
    if (sim.necroShieldTimer <= 0) {
      sim.necroShield = 0;
    }
  }

  if (sim.necroMinions.length === 0) return;

  // Pass 1: Update timers, handle HP=0 / lifetime expiry explosions & spawn Soul Absorption wisps
  for (let mi = sim.necroMinions.length - 1; mi >= 0; mi--) {
    const m = sim.necroMinions[mi];
    if (m.hitFlash > 0) m.hitFlash = Math.max(0, m.hitFlash - dt);
    if (m.attackCd > 0) m.attackCd = Math.max(0, m.attackCd - dt);

    if (!m.fealtyBuffed) {
      m.life -= dt;
    }

    if (m.hp <= 0 || (!m.fealtyBuffed && m.life <= 0)) {
      const blastR = (m.isMiniBoss ? 96 : 68) * Math.max(0.95, Math.min(1.35, stats.areaMult));
      const blastDmg = m.attack * (m.isMiniBoss ? 2.4 : 1.75) * (m.fealtyBuffed ? 1.15 : 1);

      hooks.addGroundFx({
        kind: 'explosion',
        x: m.x,
        y: m.y,
        radius: 10,
        maxRadius: blastR,
        life: 0.34,
        maxLife: 0.34,
        color: m.fealtyBuffed ? '#C084FC' : '#34D399',
      });
      hooks.spawnParticles(
        m.x,
        m.y,
        m.fealtyBuffed ? '#FDE047' : '#34D399',
        m.isMiniBoss ? 16 : 9,
        145
      );

      for (const en of sim.enemies) {
        if (en.hp > 0 && Math.hypot(en.x - m.x, en.y - m.y) <= blastR + en.radius) {
          hooks.damageEnemy(
            en,
            blastDmg,
            75,
            en.x - m.x,
            en.y - m.y,
            stats.greedMult,
            m.fealtyBuffed ? '#C084FC' : '#34D399'
          );
        }
      }
      hooks.hitWorldTargetsInCircle?.(m.x, m.y, blastR, blastDmg);

      const soulGainPct = m.fealtyBuffed ? NECRO_SOUL_GAIN_FEALTY : NECRO_SOUL_GAIN_NORMAL;
      sim.necroSoulsCount += 1;
      if (sim.necroSoulBonusPct < NECRO_SOUL_CAP_PCT) {
        sim.necroSoulBonusPct = Math.min(
          NECRO_SOUL_CAP_PCT,
          Number((sim.necroSoulBonusPct + soulGainPct).toFixed(2))
        );
      }

      hooks.spawnSoulOrb?.({
        x: m.x,
        y: m.y,
        color: m.fealtyBuffed ? '#C084FC' : '#34D399',
        glowColor: m.fealtyBuffed ? '#FDE047' : '#6EE7B7',
        fealty: m.fealtyBuffed,
        isMiniBoss: m.isMiniBoss,
        count: m.isMiniBoss ? 4 : m.fealtyBuffed ? 3 : 2,
      });

      if (m.isMiniBoss || m.fealtyBuffed) {
        hooks.addFloatingText(
          m.x,
          m.y - 16,
          `+${soulGainPct.toFixed(2)}% วิญญาณ`,
          m.fealtyBuffed ? '#C084FC' : '#34D399',
          0.88
        );
      }

      if (sim.raceClass === 'death_god' && sim.ultActiveTimer <= 0) {
        sim.classGauge = Math.min(100, sim.classGauge + 3);
      }
      sim.necroMinions.splice(mi, 1);
    }
  }

  const activeCount = sim.necroMinions.length;
  if (activeCount === 0) return;

  const PLAYER_LEASH_RANGE = 660;
  const PLAYER_CORE_CLEARANCE = 56;
  const TARGET_PLAYER_RADIUS = 560;
  const TARGET_MINION_RADIUS = 450;

  // Track how many minions already lock onto each enemy so minions distribute naturally
  const targetLoad = new Map<number, number>();
  const deltaMoves: Array<{ vx: number; vy: number; nextX: number; nextY: number }> = new Array(activeCount);

  // Pass 2: Compute weighted target priority + boids flocking steering
  for (let mi = 0; mi < activeCount; mi++) {
    const m = sim.necroMinions[mi];
    const spd = m.speed * (m.fealtyBuffed ? 1.15 : 1);

    // Tether check: recall minion cleanly onto the perimeter ring if too far from player
    const toPlayerX = m.x - sim.player.x;
    const toPlayerY = m.y - sim.player.y;
    const pDist = Math.hypot(toPlayerX, toPlayerY);
    if (pDist > PLAYER_LEASH_RANGE) {
      const ang = (mi / activeCount) * Math.PI * 2 + sim.elapsedSeconds * 0.55;
      const recallR = m.isRanged ? 124 : 92;
      deltaMoves[mi] = {
        vx: 0,
        vy: 0,
        nextX: sim.player.x + Math.cos(ang) * recallR,
        nextY: sim.player.y + Math.sin(ang) * recallR,
      };
      continue;
    }

    // Weight-based enemy priority selection:
    // - Threats closest to player perimeter receive urgent priority
    // - Closer enemies to the minion save travel time
    // - Elites/Bosses carry modest priority bias
    // - Crowding penalty prevents all minions from dogpiling a single minor mob
    let targetEn: TEnemy | null = null;
    let bestScore = Infinity;
    for (let ei = 0; ei < sim.enemies.length; ei++) {
      const en = sim.enemies[ei];
      if (en.hp <= 0) continue;
      const distToPlayer = Math.hypot(en.x - sim.player.x, en.y - sim.player.y);
      if (distToPlayer > TARGET_PLAYER_RADIUS) continue;
      const distToMinion = Math.hypot(en.x - m.x, en.y - m.y);
      if (distToMinion > TARGET_MINION_RADIUS && distToPlayer > 300) continue;

      const crowdCount = targetLoad.get(en.id) ?? 0;
      const tierBias = en.isBoss ? -75 : en.isElite ? -35 : 0;
      const crowdPenalty = crowdCount * (en.isBoss ? 26 : 78);
      const rangedBonus = m.isRanged && distToPlayer < 240 ? -22 : 0;
      const score = distToMinion + distToPlayer * 0.65 + tierBias + crowdPenalty + rangedBonus;

      if (score < bestScore) {
        bestScore = score;
        targetEn = en;
      }
    }

    if (targetEn) {
      targetLoad.set(targetEn.id, (targetLoad.get(targetEn.id) ?? 0) + 1);
    }

    // Flocking forces: Separation (avoid minion stacking) + Alignment (smooth group motion)
    let sepX = 0;
    let sepY = 0;
    let alignX = 0;
    let alignY = 0;
    let alignNeighbors = 0;

    for (let oi = 0; oi < activeCount; oi++) {
      if (oi === mi) continue;
      const other = sim.necroMinions[oi];
      const dx = m.x - other.x;
      const dy = m.y - other.y;
      const d = Math.hypot(dx, dy);
      const desiredSep = m.radius + other.radius + 16;

      if (d > 0.001 && d < desiredSep) {
        const pushStrength = ((desiredSep - d) / desiredSep) * spd * 1.55;
        sepX += (dx / d) * pushStrength;
        sepY += (dy / d) * pushStrength;
      } else if (d <= 0.001) {
        const jitterAng = ((mi * 2.39996) % (Math.PI * 2));
        sepX += Math.cos(jitterAng) * spd;
        sepY += Math.sin(jitterAng) * spd;
      }

      if (d < 96) {
        alignX += other.vx;
        alignY += other.vy;
        alignNeighbors += 1;
      }
    }

    if (alignNeighbors > 0) {
      alignX /= alignNeighbors;
      alignY /= alignNeighbors;
    }

    // Player personal-space exclusion force: keeps minions on a guard perimeter, never stacked on top of player
    let playerPushX = 0;
    let playerPushY = 0;
    const minCoreDist = PLAYER_CORE_CLEARANCE + m.radius;
    if (pDist < minCoreDist) {
      const safeDist = pDist > 0.001 ? pDist : 1;
      const dirX = pDist > 0.001 ? toPlayerX / safeDist : Math.cos((mi / activeCount) * Math.PI * 2);
      const dirY = pDist > 0.001 ? toPlayerY / safeDist : Math.sin((mi / activeCount) * Math.PI * 2);
      const repulsion = ((minCoreDist - pDist) / minCoreDist) * spd * 2.35;
      playerPushX = dirX * repulsion;
      playerPushY = dirY * repulsion;
    }

    // Primary goal vector: Engage weighted target OR guard evenly-spaced perimeter ring
    let goalVx = 0;
    let goalVy = 0;

    if (targetEn) {
      const tx = targetEn.x - m.x;
      const ty = targetEn.y - m.y;
      const td = Math.hypot(tx, ty) || 1;
      const engageRange = m.isRanged ? 178 : m.radius + targetEn.radius + 15;

      if (td > engageRange) {
        // Approach enemy, adding a gentle flank tangent if enemy is very close to the player center
        const enPlayerDist = Math.hypot(targetEn.x - sim.player.x, targetEn.y - sim.player.y);
        if (!m.isRanged && enPlayerDist < minCoreDist && pDist < minCoreDist * 1.45) {
          const tangDir = mi % 2 === 0 ? 1 : -1;
          goalVx = ((tx / td) * 0.72 + (-ty / td) * 0.55 * tangDir) * spd;
          goalVy = ((ty / td) * 0.72 + (tx / td) * 0.55 * tangDir) * spd;
        } else {
          goalVx = (tx / td) * spd;
          goalVy = (ty / td) * spd;
        }
      } else {
        // Maintain tactical spacing at engage edge + subtle strafe while attacking
        const idealHold = engageRange * 0.88;
        const radialAdjust = td < idealHold ? -spd * 0.35 : 0;
        const strafeDir = mi % 2 === 0 ? 1 : -1;
        const strafeSpd = m.isRanged ? spd * 0.28 : spd * 0.16;
        goalVx = (tx / td) * radialAdjust + (-ty / td) * strafeSpd * strafeDir;
        goalVy = (ty / td) * radialAdjust + (tx / td) * strafeSpd * strafeDir;

        if (m.attackCd <= 0) {
          const atkSpdMult = m.fealtyBuffed ? 1.15 : 1;
          const baseCd = m.isRanged ? 0.78 : 0.65;
          m.attackCd = baseCd / atkSpdMult;
          const hitDmg = m.attack * (m.fealtyBuffed ? 1.15 : 1);

          if (m.isRanged) {
            const ang = Math.atan2(ty, tx);
            sim.projectiles.push({
              weaponId: 'wand',
              evolved: false,
              fromClassSkill: true,
              x: m.x,
              y: m.y,
              vx: Math.cos(ang) * 410,
              vy: Math.sin(ang) * 410,
              radius: 8,
              damage: hitDmg,
              knockback: 45,
              pierce: m.isMiniBoss ? 3 : 1,
              life: 1.0,
              maxLife: 1.0,
              hitIds: new Set(),
              rotation: ang,
              color: m.fealtyBuffed ? '#FDE047' : '#34D399',
            });
          } else {
            hooks.damageEnemy(
              targetEn,
              hitDmg,
              70,
              tx,
              ty,
              stats.greedMult,
              m.fealtyBuffed ? '#C084FC' : '#34D399'
            );
            if (m.isMiniBoss) {
              for (const other of sim.enemies) {
                if (
                  other !== targetEn &&
                  other.hp > 0 &&
                  Math.hypot(other.x - targetEn.x, other.y - targetEn.y) <= 72 + other.radius
                ) {
                  hooks.damageEnemy(
                    other,
                    hitDmg * 0.65,
                    55,
                    other.x - m.x,
                    other.y - m.y,
                    stats.greedMult,
                    m.fealtyBuffed ? '#C084FC' : '#34D399'
                  );
                }
              }
            }
            hooks.spawnParticles(
              targetEn.x,
              targetEn.y,
              m.fealtyBuffed ? '#C084FC' : '#34D399',
              4,
              90
            );
          }
        }
      }
    } else {
      // Guard the perimeter evenly around the player using active index slots
      const orbitAng = sim.elapsedSeconds * 0.92 + (mi / activeCount) * Math.PI * 2;
      const orbitR = m.isMiniBoss ? 114 : m.isRanged ? 132 : 88 + (mi % 2) * 20;
      const gx = sim.player.x + Math.cos(orbitAng) * orbitR;
      const gy = sim.player.y + Math.sin(orbitAng) * orbitR;
      const gdx = gx - m.x;
      const gdy = gy - m.y;
      const gd = Math.hypot(gdx, gdy);
      if (gd > 6) {
        const pull = Math.min(spd * 1.25, gd * 4.5);
        goalVx = (gdx / gd) * pull;
        goalVy = (gdy / gd) * pull;
      } else {
        // Gentle orbital tangent velocity when seated in guard slot
        goalVx = -Math.sin(orbitAng) * orbitR * 0.92;
        goalVy = Math.cos(orbitAng) * orbitR * 0.92;
      }
    }

    // Blend flocking forces
    let desiredVx = goalVx + sepX * 1.15 + playerPushX + alignX * 0.18;
    let desiredVy = goalVy + sepY * 1.15 + playerPushY + alignY * 0.18;
    const desiredMag = Math.hypot(desiredVx, desiredVy);
    const maxMoveSpd = spd * 1.35;
    if (desiredMag > maxMoveSpd) {
      desiredVx = (desiredVx / desiredMag) * maxMoveSpd;
      desiredVy = (desiredVy / desiredMag) * maxMoveSpd;
    }

    const blend = Math.min(1, dt * 11);
    const nextVx = m.vx + (desiredVx - m.vx) * blend;
    const nextVy = m.vy + (desiredVy - m.vy) * blend;
    let nextX = m.x + nextVx * dt;
    let nextY = m.y + nextVy * dt;

    // Hard safety guard so a minion never collapses directly onto the player's center pixel
    const postDx = nextX - sim.player.x;
    const postDy = nextY - sim.player.y;
    const postDist = Math.hypot(postDx, postDy);
    const hardMinDist = 40 + m.radius * 0.5;
    if (postDist < hardMinDist) {
      const fallbackAng = (mi / activeCount) * Math.PI * 2;
      const ux = postDist > 0.001 ? postDx / postDist : Math.cos(fallbackAng);
      const uy = postDist > 0.001 ? postDy / postDist : Math.sin(fallbackAng);
      nextX = sim.player.x + ux * hardMinDist;
      nextY = sim.player.y + uy * hardMinDist;
    }

    deltaMoves[mi] = { vx: nextVx, vy: nextVy, nextX, nextY };
  }

  // Commit positions after flocking pass so evaluation is symmetric across all minions
  for (let mi = 0; mi < activeCount; mi++) {
    const m = sim.necroMinions[mi];
    const step = deltaMoves[mi];
    m.vx = step.vx;
    m.vy = step.vy;
    m.x = step.nextX;
    m.y = step.nextY;
  }
}

export function getNecroMinionHudSummary(sim: Pick<MinionSimLike, 'necroMinions' | 'necroSoulBonusPct'>): NecroMinionHudSummary {
  let activeCount = 0;
  let fealtyCount = 0;
  let timedCount = 0;
  let miniBossCount = 0;
  let minLife = Infinity;

  for (let mi = 0; mi < sim.necroMinions.length; mi++) {
    const m = sim.necroMinions[mi];
    if (m.hp <= 0) continue;
    activeCount += 1;
    if (m.isMiniBoss) miniBossCount += 1;
    if (m.fealtyBuffed) {
      fealtyCount += 1;
    } else {
      timedCount += 1;
      if (m.life < minLife) minLife = m.life;
    }
  }

  return {
    activeCount,
    fealtyCount,
    timedCount,
    miniBossCount,
    soonestExpireSec: timedCount > 0 && Number.isFinite(minLife) ? Math.max(0, Math.ceil(minLife)) : null,
    fealtySpeedPct: Number((fealtyCount * 0.2).toFixed(1)),
    soulBonusPct: Number(sim.necroSoulBonusPct.toFixed(2)),
  };
}
