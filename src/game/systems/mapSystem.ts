import { ActiveBiomeInfo, MAP_EVENTS, pickNextMapEvent, pickNextWeather, RACES, WaveDefinition, WEATHERS } from '../data';
import {
  getBreakablesNear,
  getObstaclesNear,
  getSecretRoomWallObstacles,
  getTerrainZoneAt,
  getTerrainZonesNear,
  getTrapsNear,
  LANDMARK_META,
  LandmarkKind,
} from '../mapObstacles';
import { sound } from '../sound';
import {
  DamageType,
  EnemyKind,
  MapInteractionPrompt,
  RaceId,
  WeaponId,
} from '../types';
import { addFloatingText, applyPlayerHeal, spawnParticles, triggerDamageFlash } from './combat';
import { ComputedStats, DropEntity, EnemyEntity, SimState } from './simTypes';

const WEATHER_INTERVAL_SECONDS = 300;

export interface MapSystemContext {
  sim: SimState;
  dt: number;
  clockDt: number;
  raceId: RaceId;
  biome: ActiveBiomeInfo;
  waveDef: WaveDefinition;
  currentMinute: number;
  stats: ComputedStats;
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
    damageType?: DamageType
  ) => void;
  absorbPlayerShield: (sim: SimState, rawDmg: number) => number;
  breakCombo: (sim: SimState) => void;
  createEnemy: (
    sim: SimState,
    kind: EnemyKind,
    x: number,
    y: number,
    realmMinute: number,
    biomeHpMult: number,
    biomeSpeedMult?: number,
    isElite?: boolean
  ) => EnemyEntity;
  pushOutOfObstacles: (sim: SimState, obj: { x: number; y: number }, radius: number) => void;
  spawnDrop: (sim: SimState, drop: DropEntity) => void;
  spawnLandmarkAt: (sim: SimState, kind: LandmarkKind, x: number, y: number) => void;
  grantInstantLevelUp: (sim: SimState, announcementText?: string) => void;
  enterSecretRoom: (sim: SimState) => void;
  exitSecretRoom: (sim: SimState) => void;
  triggerWetLightningChain: (
    sim: SimState,
    x: number,
    y: number,
    baseDmg: number,
    stats: ComputedStats,
    alreadyHit?: Set<number>
  ) => void;
  onMapInteractionPrompt: (prompt: MapInteractionPrompt) => void;
}

/**
 * Updates M1-M8 Terrain Zones, Traps, Landmarks, Portals, Weather & Global Map Events.
 * Returns `true` if a modal interaction paused simulation this frame.
 */
export function updateMapTerrainAndEvents(ctx: MapSystemContext): boolean {
  const {
    sim,
    dt,
    clockDt,
    raceId,
    biome,
    waveDef,
    currentMinute,
    stats,
    damageEnemy,
    absorbPlayerShield,
    breakCombo,
    createEnemy,
    pushOutOfObstacles,
    spawnDrop,
    spawnLandmarkAt,
    grantInstantLevelUp,
    enterSecretRoom,
    exitSecretRoom,
    triggerWetLightningChain,
    onMapInteractionPrompt,
  } = ctx;

  const px = sim.player.x;
  const py = sim.player.y;

  // Terrain Zone & Spatial Queries
  if (sim.inSecretRoom) {
    sim.frameObstacles = getSecretRoomWallObstacles();
    sim.frameBreakables = sim.secretRoomBreakables;
    sim.frameTraps = [];
    sim.frameZones = [];
    sim.onHighGround = false;
    sim.inWaterPuddle = false;
    sim.inPoisonSwamp = false;
    sim.inLavaPool = false;
    sim.inFlowerMeadow = false;
    sim.activeTerrainTh = null;
    sim.activeTerrainColor = null;
    sim.playerSinkKind = null;
    sim.playerElevZ += (0 - sim.playerElevZ) * Math.min(1, dt * 8);
  } else {
    sim.frameObstacles = getObstaclesNear(px, py, 920, sim.mapSeed, biome.themeStyle);
    sim.frameBreakables = getBreakablesNear(px, py, 850, sim.mapSeed, sim.brokenTiles, biome.themeStyle);
    sim.frameTraps = getTrapsNear(px, py, 850, sim.mapSeed, biome.themeStyle);
    sim.frameZones = getTerrainZonesNear(px, py, 950, sim.mapSeed, biome.themeStyle);

    const pZone = getTerrainZoneAt(px, py, sim.frameZones);
    sim.onHighGround = pZone?.kind === 'high_ground';
    sim.inWaterPuddle = pZone?.kind === 'water_puddle';
    sim.inPoisonSwamp = pZone?.kind === 'poison_swamp';
    sim.inLavaPool = pZone?.kind === 'lava_pool';
    sim.inFlowerMeadow = pZone?.kind === 'flower_meadow';
    sim.playerSinkKind =
      pZone?.kind === 'water_puddle'
        ? 'water'
        : pZone?.kind === 'lava_pool'
          ? 'lava'
          : pZone?.kind === 'poison_swamp'
            ? 'poison'
            : null;
    sim.activeTerrainTh =
      pZone?.kind === 'high_ground'
        ? 'ที่สูง (+15% Area · +10% DMG)'
        : pZone?.kind === 'water_puddle'
          ? 'แอ่งน้ำ (ช้า 10% · สื่อไฟฟ้า)'
          : pZone?.kind === 'lava_pool'
            ? 'บ่อลาวา (เผาไหม้ -2% HP/วิ)'
            : pZone?.kind === 'poison_swamp'
              ? 'หนองพิษ (ฮีลลด 50%)'
              : pZone?.kind === 'flower_meadow'
                ? 'ทุ่งดอกไม้ (+0.5% HP/วิ)'
                : null;
    sim.activeTerrainColor =
      pZone?.kind === 'high_ground'
        ? '#D97706'
        : pZone?.kind === 'water_puddle'
          ? '#38BDF8'
          : pZone?.kind === 'lava_pool'
            ? '#F97316'
            : pZone?.kind === 'poison_swamp'
              ? '#84CC16'
              : pZone?.kind === 'flower_meadow'
                ? '#34D399'
                : null;
    if (sim.inWaterPuddle) sim.playerWetTimer = 3.0;
    const targetElevZ = sim.onHighGround ? 18 : 0;
    sim.playerElevZ += (targetElevZ - sim.playerElevZ) * Math.min(1, dt * 8);

    if (sim.inLavaPool) {
      sim.lavaPoolTickTimer -= dt;
      if (sim.lavaPoolTickTimer <= 0) {
        sim.lavaPoolTickTimer = 1.0;
        if (sim.player.invulnTimer <= 0 && sim.mageBarrierTimer <= 0) {
          const lavaDmg = Math.max(1, Math.round(sim.player.maxHp * 0.02));
          const taken = absorbPlayerShield(sim, lavaDmg);
          if (taken > 0) {
            sim.player.hp = Math.max(0, sim.player.hp - taken);
            sim.lastDamageSourceTh = 'บ่อลาวาเดือด';
            triggerDamageFlash(sim, taken);
            addFloatingText(sim, px, py - 24, `-${taken} (ลาวา)`, '#FB923C', 0.95);
          }
        }
      }
    }
    if (sim.inFlowerMeadow && sim.player.hp < sim.player.maxHp) {
      sim.meadowRegenBuffer += sim.player.maxHp * 0.005 * dt;
      if (sim.meadowRegenBuffer >= 1) {
        const whole = Math.floor(sim.meadowRegenBuffer);
        sim.meadowRegenBuffer -= whole;
        const healed = applyPlayerHeal(sim, whole);
        if (healed > 0) addFloatingText(sim, px, py - 26, `+${healed}`, '#34D399', 0.85);
      }
    }

    if (biome.themeStyle === 'crypt') {
      for (const o of sim.frameObstacles) {
        if (!o.hasGraveHand) continue;
        if ((sim.graveHandCooldowns[o.id] ?? 0) <= 0 && Math.hypot(px - o.x, py - o.y) <= o.r + 36) {
          sim.graveHandCooldowns[o.id] = 6.0;
          sim.graveSlowTimer = 1.0;
          addFloatingText(sim, px, py - 28, 'มือผีสุสานจับขา! (ช้า 1 วิ)', '#CBD5E1', 1.05);
          break;
        }
      }
    }
  }

  // Main Map Systems (Weather, Global Map Events, Traps, Landmarks, Portals, Volcano Eruption)
  if (!sim.inSecretRoom) {
    sim.weatherTimer -= clockDt;
    if (sim.weatherTimer <= 0) {
      const nextWeather = pickNextWeather(sim.weather);
      sim.weather = nextWeather;
      sim.weatherTimer = WEATHER_INTERVAL_SECONDS;
      sim.weatherHazardTimer = 1.1;
      sim.weatherHazards = [];
      const wDef = WEATHERS[nextWeather];
      sim.announcement = `สภาพอากาศเปลี่ยน: ${wDef.nameTh} — ${wDef.effectTh}`;
      sim.announcementTimer = 5.0;
    }

    if (sim.mapEvent) {
      sim.mapEventTimer -= dt;
      if (sim.mapEvent === 'ambush_swarm') {
        sim.ambushSpawnTimer -= dt;
        if (sim.ambushSpawnTimer <= 0 && sim.enemies.length < 155) {
          sim.ambushSpawnTimer = 2.8;
          const ambushKinds: EnemyKind[] = ['archer', 'zealot', 'archer', 'zealot'];
          for (let k = 0; k < ambushKinds.length; k++) {
            const a = Math.random() * Math.PI * 2;
            const d = 320 + Math.random() * 90;
            const ax = px + Math.cos(a) * d;
            const ay = py + Math.sin(a) * d;
            const mob = createEnemy(sim, ambushKinds[k], ax, ay, currentMinute, biome.hpMult, biome.speedMult);
            pushOutOfObstacles(sim, mob, mob.radius);
            sim.enemies.push(mob);
            sim.groundFx.push({
              kind: 'warp',
              x: mob.x,
              y: mob.y,
              radius: 8,
              maxRadius: 38,
              life: 0.32,
              maxLife: 0.32,
              color: '#F43F5E',
            });
          }
        }
      } else if (sim.mapEvent === 'shrinking_ring' && sim.shrinkingRing) {
        sim.shrinkingRing.radius = Math.max(195, sim.shrinkingRing.radius - 18 * dt);
        const dRing = Math.hypot(px - sim.shrinkingRing.cx, py - sim.shrinkingRing.cy);
        if (dRing > sim.shrinkingRing.radius) {
          sim.shrinkingRing.tickTimer -= dt;
          if (sim.shrinkingRing.tickTimer <= 0) {
            sim.shrinkingRing.tickTimer = 0.5;
            const ringDmg = Math.max(1, Math.round(sim.player.maxHp * 0.04));
            const taken = absorbPlayerShield(sim, ringDmg);
            if (taken > 0) {
              sim.player.hp = Math.max(0, sim.player.hp - taken);
              sim.lastDamageSourceTh = 'วงเวทย์บีบอัด';
              triggerDamageFlash(sim, taken);
              addFloatingText(sim, px, py - 24, `-${taken} (นอกวง!)`, '#F43F5E', 1.0);
            }
          }
        }
      } else if (sim.mapEvent === 'treasure_cart' && sim.treasureCart) {
        const tc = sim.treasureCart;
        if (tc.hitFlash > 0) tc.hitFlash = Math.max(0, tc.hitFlash - dt);
        const awayAng = Math.atan2(tc.y - py, tc.x - px);
        const cartSpd = 128;
        tc.x += Math.cos(awayAng) * cartSpd * dt;
        tc.y += Math.sin(awayAng) * cartSpd * dt;
        tc.facingX = Math.cos(awayAng);
        pushOutOfObstacles(sim, tc, 30);
      } else if (sim.mapEvent === 'meteor_shower') {
        sim.meteorSpawnTimer -= dt;
        if (sim.meteorSpawnTimer <= 0) {
          sim.meteorSpawnTimer = 0.65;
          const ang = Math.random() * Math.PI * 2;
          const dist = 60 + Math.random() * 260;
          sim.meteorTelegraphs.push({
            x: px + Math.cos(ang) * dist,
            y: py + Math.sin(ang) * dist,
            radius: 68,
            timer: 1.0,
            maxTimer: 1.0,
            isLavaRock: false,
          });
        }
      } else if (sim.mapEvent === 'earth_split') {
        const hasBossAlive = sim.enemies.some((en) => en.isBoss && en.hp > 0);
        if (!hasBossAlive) {
          sim.mapEventTimer = Math.min(sim.mapEventTimer, 0.05);
        } else {
          sim.earthSplitSpawnTimer -= dt;
          if (sim.earthSplitSpawnTimer <= 0 && sim.earthSplits.length < 4) {
            sim.earthSplitSpawnTimer = 4.2;
            const ang = Math.random() * Math.PI;
            sim.earthSplits.push({
              x: px + (Math.random() - 0.5) * 220,
              y: py + (Math.random() - 0.5) * 220,
              angle: ang,
              length: 360,
              warnTimer: 1.3,
              activeTimer: 4.5,
              tickTimer: 0.25,
            });
          }
        }
      }

      if (sim.mapEventTimer <= 0) {
        const ended = MAP_EVENTS[sim.mapEvent];
        if (sim.mapEvent === 'shrinking_ring' && sim.shrinkingRing) {
          if (Math.hypot(px - sim.shrinkingRing.cx, py - sim.shrinkingRing.cy) <= sim.shrinkingRing.radius) {
            sim.goldEarned += 100;
            sim.goldBreakdown.quests += 100;
            spawnDrop(sim, { kind: 'chest', x: px, y: py - 32, value: 1, magnetized: false });
            addFloatingText(sim, px, py - 38, 'รอดวงเวทย์! +100 ทอง & หีบ!', '#FACC15', 1.25);
          }
          sim.shrinkingRing = null;
        }
        if (sim.mapEvent === 'treasure_cart') {
          sim.treasureCart = null;
        }
        sim.mapEvent = null;
        sim.nextMapEventTimer = 18 + Math.random() * 10;
        addFloatingText(sim, px, py - 34, `สิ้นสุด${ended.nameTh}`, '#CBD5E1', 0.95);
      }
    } else {
      sim.nextMapEventTimer -= dt;
      if (sim.nextMapEventTimer <= 0) {
        const hasBossNow = sim.enemies.some((en) => en.isBoss && en.hp > 0);
        const ev = pickNextMapEvent(sim.lastMapEvent, { isNight: stats.isNight, hasBoss: hasBossNow });
        sim.mapEvent = ev.id;
        sim.lastMapEvent = ev.id;
        sim.mapEventTimer = ev.duration;
        sim.ambushSpawnTimer = 0.6;
        sim.activeMapEventBanner = {
          nameTh: ev.nameTh,
          effectTh: ev.effectTh,
          kind: ev.kind,
          color: ev.color,
        };
        sim.mapEventBannerTimer = 1.5;
        sim.announcement = `${ev.kind === 'blessing' ? 'พรแผนที่' : 'วิกฤตแผนที่'}: ${ev.nameTh} — ${ev.effectTh}`;
        sim.announcementTimer = 4.6;

        if (ev.id === 'shrinking_ring') {
          sim.shrinkingRing = { cx: px, cy: py, radius: 560, tickTimer: 0.4, survived: false };
        } else if (ev.id === 'treasure_cart') {
          const ang = Math.random() * Math.PI * 2;
          const pos = { x: px + Math.cos(ang) * 340, y: py + Math.sin(ang) * 340 };
          pushOutOfObstacles(sim, pos, 32);
          sim.treasureCart = {
            x: pos.x,
            y: pos.y,
            hp: 320 + sim.player.level * 50,
            maxHp: 320 + sim.player.level * 50,
            facingX: 1,
            hitFlash: 0,
          };
        } else if (ev.id === 'meteor_shower') {
          sim.meteorSpawnTimer = 0.4;
        } else if (ev.id === 'earth_split') {
          sim.earthSplitSpawnTimer = 0.5;
        } else if (ev.id === 'golden_swarm') {
          for (let gi = 0; gi < 20; gi++) {
            const a = (gi / 20) * Math.PI * 2;
            const bx = px + Math.cos(a) * (420 + (gi % 3) * 30);
            const by = py + Math.sin(a) * (420 + (gi % 3) * 30);
            const bat = createEnemy(sim, 'bat', bx, by, currentMinute, biome.hpMult * 0.7, biome.speedMult * 1.15);
            bat.isGoldenBat = true;
            bat.nameTh = 'ค้างคาวทองคำ';
            const flyAng = Math.atan2(py - by, px - bx);
            bat.swoopVx = Math.cos(flyAng) * bat.speed;
            bat.swoopVy = Math.sin(flyAng) * bat.speed;
            sim.enemies.push(bat);
          }
        }

        if (ev.kind === 'blessing') {
          sound.playLevelUp();
          addFloatingText(sim, px, py - 38, ev.nameTh, ev.color, 1.2);
        } else {
          sound.playBossWarning();
          addFloatingText(sim, px, py - 38, ev.nameTh, ev.color, 1.2);
        }
      }
    }

    // M8 Volcano Biome Periodic Eruption
    if (biome.themeStyle === 'volcano') {
      if (sim.volcanoEruptionActive > 0) {
        sim.volcanoEruptionActive -= dt;
        sim.volcanoRockTimer -= dt;
        if (sim.volcanoRockTimer <= 0) {
          sim.volcanoRockTimer = 0.55;
          const a = Math.random() * Math.PI * 2;
          const d = 40 + Math.random() * 240;
          sim.meteorTelegraphs.push({
            x: px + Math.cos(a) * d,
            y: py + Math.sin(a) * d,
            radius: 62,
            timer: 1.05,
            maxTimer: 1.05,
            isLavaRock: true,
          });
        }
      } else {
        sim.volcanoEruptionTimer -= dt;
        if (sim.volcanoEruptionTimer <= 0) {
          sim.volcanoEruptionTimer = 120;
          sim.volcanoEruptionActive = 10;
          sim.volcanoRockTimer = 0.25;
          sim.announcement = 'ภูเขาไฟปะทุ! หินลาวากำลังตกลงมาจากฟ้า 10 วินาที!';
          sim.announcementTimer = 4.0;
          sound.playBossWarning();
        }
      }
    }

    // Update Falling Meteors / Magma Rocks
    for (let mi = sim.meteorTelegraphs.length - 1; mi >= 0; mi--) {
      const mt = sim.meteorTelegraphs[mi];
      mt.timer -= dt;
      if (mt.timer <= 0) {
        sim.meteorTelegraphs.splice(mi, 1);
        sim.groundFx.push({
          kind: 'explosion',
          x: mt.x,
          y: mt.y,
          radius: 14,
          maxRadius: mt.radius,
          life: 0.38,
          maxLife: 0.38,
          color: mt.isLavaRock ? '#F97316' : '#EF4444',
        });
        spawnParticles(sim, mt.x, mt.y, '#FB923C', 14, 170);
        const mobDmg = (58 + sim.player.level * 5) * stats.damageMult;
        for (const en of sim.enemies) {
          if (en.hp > 0 && Math.hypot(en.x - mt.x, en.y - mt.y) <= mt.radius + en.radius) {
            damageEnemy(sim, en, mobDmg, null, 95, en.x - mt.x, en.y - mt.y, stats.greedMult, false, false, false, 'elemental');
          }
        }
        if (
          Math.hypot(px - mt.x, py - mt.y) <= mt.radius &&
          sim.player.invulnTimer <= 0 &&
          sim.mageBarrierTimer <= 0
        ) {
          const rawM = Math.max(1, Math.round(sim.player.maxHp * (mt.isLavaRock ? 0.1 : 0.12)));
          const taken = absorbPlayerShield(sim, rawM);
          if (taken > 0) {
            sim.player.hp = Math.max(0, sim.player.hp - taken);
            sim.lastDamageSourceTh = mt.isLavaRock ? 'หินลาวาภูเขาไฟ' : 'ฝนอุกกาบาต';
            triggerDamageFlash(sim, taken);
            sim.player.invulnTimer = 0.4;
            sound.playPlayerHit();
            addFloatingText(sim, px, py - 24, `-${taken}`, '#FB7185', 1.1);
          }
        }
      }
    }

    // Update Earth Split Fissures
    for (let ei = sim.earthSplits.length - 1; ei >= 0; ei--) {
      const es = sim.earthSplits[ei];
      if (es.warnTimer > 0) {
        es.warnTimer -= dt;
      } else {
        es.activeTimer -= dt;
        es.tickTimer -= dt;
        if (es.tickTimer <= 0) {
          es.tickTimer = 0.45;
          const dxS = Math.cos(es.angle) * (es.length * 0.5);
          const dyS = Math.sin(es.angle) * (es.length * 0.5);
          const x1 = es.x - dxS;
          const y1 = es.y - dyS;
          const x2 = es.x + dxS;
          const y2 = es.y + dyS;
          const len2 = (x2 - x1) ** 2 + (y2 - y1) ** 2 || 1;
          const tProj = Math.max(0, Math.min(1, ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / len2));
          const cx = x1 + tProj * (x2 - x1);
          const cy = y1 + tProj * (y2 - y1);
          if (Math.hypot(px - cx, py - cy) <= 26 && sim.player.invulnTimer <= 0 && sim.mageBarrierTimer <= 0) {
            const splitDmg = Math.max(1, Math.round(sim.player.maxHp * 0.05));
            const taken = absorbPlayerShield(sim, splitDmg);
            if (taken > 0) {
              sim.player.hp = Math.max(0, sim.player.hp - taken);
              sim.lastDamageSourceTh = 'รอยแยกแมกมา';
              triggerDamageFlash(sim, taken);
              addFloatingText(sim, px, py - 22, `-${taken}`, '#F97316', 1.0);
            }
          }
        }
        if (es.activeTimer <= 0) sim.earthSplits.splice(ei, 1);
      }
    }

    // M3 Trap Runtime Updates
    for (const key of Object.keys(sim.trapStates)) {
      const st = sim.trapStates[key];
      if (st.cooldown > 0) st.cooldown = Math.max(0, st.cooldown - dt);
      if (st.hitCooldown > 0) st.hitCooldown = Math.max(0, st.hitCooldown - dt);
      if (st.activeTimer > 0) {
        st.activeTimer = Math.max(0, st.activeTimer - dt);
        if (key.startsWith('trap:')) {
          const trap = sim.frameTraps.find((t) => t.id === key);
          if (trap && trap.kind === 'lightning_pillar') {
            st.shockTickTimer -= dt;
            if (st.shockTickTimer <= 0) {
              st.shockTickTimer = 0.5;
              const pillarDmg = (42 + sim.player.level * 4) * stats.damageMult;
              const hitSet = new Set<number>();
              for (const en of sim.enemies) {
                if (en.hp <= 0) continue;
                if (Math.hypot(en.x - trap.x, en.y - trap.y) <= 200 + en.radius) {
                  hitSet.add(en.id);
                  sim.groundFx.push({
                    kind: 'beam',
                    x: trap.x,
                    y: trap.y - 24,
                    x2: en.x,
                    y2: en.y,
                    radius: 5,
                    maxRadius: 5,
                    life: 0.18,
                    maxLife: 0.18,
                    color: '#38BDF8',
                  });
                  damageEnemy(sim, en, pillarDmg, 'lightning', 25, en.x - trap.x, en.y - trap.y, stats.greedMult);
                  if (en.wetTimer && en.wetTimer > 0) {
                    triggerWetLightningChain(sim, en.x, en.y, pillarDmg, stats, hitSet);
                  }
                }
              }
            }
          }
        }
      }
    }

    for (let fi = sim.ritualFireLines.length - 1; fi >= 0; fi--) {
      const fl = sim.ritualFireLines[fi];
      fl.life -= dt;
      if (fl.life <= 0) {
        sim.ritualFireLines.splice(fi, 1);
        continue;
      }
      fl.tickTimer -= dt;
      if (fl.tickTimer <= 0) {
        fl.tickTimer = 0.35;
        const dxF = fl.x2 - fl.x1;
        const dyF = fl.y2 - fl.y1;
        const len2 = dxF * dxF + dyF * dyF || 1;
        const fireDmg = (36 + sim.player.level * 3.5) * stats.damageMult;
        for (const en of sim.enemies) {
          if (en.hp <= 0) continue;
          const tProj = Math.max(0, Math.min(1, ((en.x - fl.x1) * dxF + (en.y - fl.y1) * dyF) / len2));
          const cx = fl.x1 + tProj * dxF;
          const cy = fl.y1 + tProj * dyF;
          if (Math.hypot(en.x - cx, en.y - cy) <= 26 + en.radius) {
            en.burnTimer = Math.max(en.burnTimer || 0, 2.5);
            en.burnPct = Math.max(en.burnPct || 0, 0.03);
            damageEnemy(sim, en, fireDmg, null, 20, en.x - cx, en.y - cy, stats.greedMult, false, false, false, 'elemental');
          }
        }
      }
    }

    // M5 Landmarks Spawner & Proximity Logic
    sim.nextLandmarkTimer -= dt;
    if (sim.nextLandmarkTimer <= 0) {
      sim.nextLandmarkTimer = 300;
      const kinds: LandmarkKind[] = [
        'abandoned_tower',
        'monster_nest',
        'cursed_statue',
        'sealed_chest',
        'stone_circle',
        'merchant',
        'blood_shrine',
      ];
      const k = kinds[Math.floor(Math.random() * kinds.length)];
      const a = Math.random() * Math.PI * 2;
      const d = 850 + Math.random() * 550;
      spawnLandmarkAt(sim, k, px + Math.cos(a) * d, py + Math.sin(a) * d);
      addFloatingText(sim, px, py - 42, `จุดสำคัญใหม่ปรากฏ: ${LANDMARK_META[k].nameTh}`, LANDMARK_META[k].color, 1.1);
    }

    for (const lm of sim.landmarks) {
      if (lm.hitFlash > 0) lm.hitFlash = Math.max(0, lm.hitFlash - dt);
      if (lm.hitCooldown > 0) lm.hitCooldown = Math.max(0, lm.hitCooldown - dt);
      if (lm.used) continue;

      const dLm = Math.hypot(px - lm.x, py - lm.y);
      if (lm.kind === 'monster_nest') {
        if (dLm <= 720) {
          lm.spawnTimer -= dt;
          if (lm.spawnTimer <= 0 && sim.enemies.length < 155) {
            lm.spawnTimer = 3.0;
            for (let si = 0; si < 2; si++) {
              const sa = Math.random() * Math.PI * 2;
              const kind = waveDef.kinds[Math.floor(Math.random() * waveDef.kinds.length)];
              const m = createEnemy(
                sim,
                kind,
                lm.x + Math.cos(sa) * 44,
                lm.y + Math.sin(sa) * 44,
                currentMinute,
                biome.hpMult,
                biome.speedMult
              );
              pushOutOfObstacles(sim, m, m.radius);
              sim.enemies.push(m);
            }
          }
        }
        continue;
      }

      if (dLm <= lm.radius + sim.player.radius) {
        lm.active = true;
        if (lm.kind === 'abandoned_tower') {
          lm.progress += dt;
          if (lm.progress >= lm.maxProgress) {
            lm.used = true;
            sim.landmarkRevealActive = true;
            for (const other of sim.landmarks) {
              if (!other.used && Math.hypot(other.x - px, other.y - py) <= 2000) {
                other.revealed = true;
              }
            }
            const chestAng = Math.random() * Math.PI * 2;
            spawnDrop(sim, {
              kind: 'chest',
              x: px + Math.cos(chestAng) * 780,
              y: py + Math.sin(chestAng) * 780,
              value: 1,
              magnetized: false,
            });
            sound.playLevelUp();
            addFloatingText(sim, lm.x, lm.y - 44, 'หอคอยเปิดเผยจุดสำคัญ & หีบ 2,000px!', '#38BDF8', 1.25);
          }
        } else if (lm.kind === 'cursed_statue') {
          lm.progress += dt;
          if (lm.progress >= lm.maxProgress) {
            lm.progress = lm.maxProgress;
            onMapInteractionPrompt({
              kind: 'cursed_statue',
              landmarkId: lm.id,
            });
            return true;
          }
        } else if (lm.kind === 'sealed_chest') {
          lm.progress += dt;
          if (lm.progress >= lm.maxProgress) {
            lm.used = true;
            spawnDrop(sim, {
              kind: 'sealed_chest',
              x: lm.x,
              y: lm.y + 18,
              value: 1,
              magnetized: false,
            });
            sound.playBossChest();
            addFloatingText(sim, lm.x, lm.y - 40, 'คลายผนึกสำเร็จ! รับหีบปิดผนึก!', '#F59E0B', 1.25);
          }
        } else if (lm.kind === 'stone_circle') {
          lm.progress += dt;
          if (lm.progress >= lm.maxProgress) {
            lm.used = true;
            grantInstantLevelUp(sim, 'วงแหวนหินโบราณ: +1 เลเวล!');
            return true;
          }
        } else if (lm.kind === 'merchant' && sim.merchantCooldown <= 0) {
          sim.merchantCooldown = 1.5;
          onMapInteractionPrompt({
            kind: 'merchant',
            landmarkId: lm.id,
            gold: sim.goldEarned,
            hasUpgradeableWeapon: sim.weapons.some((w) => w.level < 6),
            usesElements: Boolean(RACES[raceId].usesElements),
          });
          return true;
        } else if (lm.kind === 'blood_shrine' && sim.bloodShrineCooldown <= 0) {
          sim.bloodShrineCooldown = 1.5;
          onMapInteractionPrompt({
            kind: 'blood_shrine',
            landmarkId: lm.id,
            hpCost: Math.max(1, Math.round(sim.player.hp * 0.3)),
            currentHp: Math.round(sim.player.hp),
            usesElements: Boolean(RACES[raceId].usesElements),
          });
          return true;
        }
      } else {
        lm.active = false;
        if (lm.kind === 'abandoned_tower' || lm.kind === 'cursed_statue') {
          lm.progress = Math.max(0, lm.progress - dt * 0.5);
        }
      }
    }

    // M6 Secret Dimension Portal Spawner
    if (sim.secretPortal) {
      sim.secretPortal.remaining -= dt;
      if (Math.hypot(px - sim.secretPortal.x, py - sim.secretPortal.y) <= 44) {
        enterSecretRoom(sim);
        return true;
      }
      if (sim.secretPortal.remaining <= 0) {
        sim.secretPortal = null;
        sim.nextSecretPortalTimer = 240 + Math.random() * 120;
      }
    } else {
      sim.nextSecretPortalTimer -= dt;
      if (sim.nextSecretPortalTimer <= 0) {
        sim.nextSecretPortalTimer = 240 + Math.random() * 120;
        const ang = Math.random() * Math.PI * 2;
        const d = 600 + Math.random() * 300;
        const pos = { x: px + Math.cos(ang) * d, y: py + Math.sin(ang) * d };
        pushOutOfObstacles(sim, pos, 48);
        sim.secretPortal = { x: pos.x, y: pos.y, remaining: 30 };
        sound.playBossWarning();
        sim.announcement = 'ประตูมิติลับเปิดออกแล้ว! เดินเข้าภายใน 30 วินาที!';
        sim.announcementTimer = 4.5;
        addFloatingText(sim, px, py - 42, 'ประตูมิติลับเปิดออก!', '#E879F9', 1.25);
      }
    }
  } else {
    // Inside Secret Dimension Room
    sim.secretRoomTimer -= dt;
    if (sim.secretRoomTimer <= 0) {
      exitSecretRoom(sim);
      return true;
    }
    if (sim.secretRoomKind === 'elite_arena' && !sim.secretRoomCleared) {
      const alive = sim.enemies.some((en) => en.hp > 0);
      if (!alive) {
        sim.secretRoomCleared = true;
        spawnDrop(sim, { kind: 'chest', x: -45, y: -40, value: 1, magnetized: false });
        spawnDrop(sim, { kind: 'artifact_chest', x: 45, y: -40, value: 1, magnetized: false });
        sound.playBossChest();
        addFloatingText(sim, px, py - 34, 'เคลียร์ลานประลอง! ประตูออกเปิดแล้ว!', '#FACC15', 1.25);
      }
    } else if (sim.secretRoomKind === 'cursed_horde') {
      if (sim.secretRoomTimer > 15) {
        sim.spawnTimer -= dt;
        if (sim.spawnTimer <= 0 && sim.enemies.length < 48) {
          sim.spawnTimer = 0.85;
          for (let si = 0; si < 3; si++) {
            const sa = Math.random() * Math.PI * 2;
            const rx = Math.max(-520, Math.min(520, Math.cos(sa) * 340));
            const ry = Math.max(-380, Math.min(380, Math.sin(sa) * 280));
            const kind = waveDef.kinds[Math.floor(Math.random() * waveDef.kinds.length)];
            sim.enemies.push(createEnemy(sim, kind, rx, ry, currentMinute, biome.hpMult, biome.speedMult));
          }
        }
      } else if (!sim.secretRoomCleared) {
        sim.secretRoomCleared = true;
        const bonusXp = Math.max(45, sim.secretRoomExpAccum * 3);
        sim.player.xp += bonusXp;
        addFloatingText(sim, px, py - 36, `รอดครบ 45 วิ! +${bonusXp} EXP (×3)!`, '#38BDF8', 1.3);
        if (sim.player.xp >= sim.player.xpToNext) {
          grantInstantLevelUp(sim);
          return true;
        }
      }
    } else if (sim.secretRoomKind === 'secret_shop' && !sim.secretRoomShopOpened) {
      sim.secretRoomShopOpened = true;
      onMapInteractionPrompt({
        kind: 'secret_shop',
        gold: sim.goldEarned,
        offers: sim.secretRoomShopOffers,
      });
      return true;
    } else if (sim.secretRoomKind === 'god_blessing' && !sim.secretRoomShopOpened) {
      sim.secretRoomShopOpened = true;
      onMapInteractionPrompt({
        kind: 'god_blessing',
      });
      return true;
    }

    if (sim.secretRoomCleared && Math.hypot(px, py + 340) <= 46) {
      exitSecretRoom(sim);
      return true;
    }
  }

  // Dynamic Weather Hazards Spawner
  if (
    sim.weather === 'sandstorm' ||
    sim.weather === 'thunderstorm' ||
    sim.weather === 'blizzard' ||
    sim.weather === 'acid_rain'
  ) {
    sim.weatherHazardTimer -= dt;
    if (sim.weatherHazardTimer <= 0) {
      if (sim.weather === 'sandstorm') {
        sim.weatherHazardTimer = 2.2;
        if (sim.weatherHazards.length < 5) {
          const a = Math.random() * Math.PI * 2;
          const d = 150 + Math.random() * 210;
          const driftA =
            Math.atan2(py - (py + Math.sin(a) * d), px - (px + Math.cos(a) * d)) + (Math.random() - 0.5) * 0.9;
          sim.weatherHazards.push({
            kind: 'sand_vortex',
            x: px + Math.cos(a) * d,
            y: py + Math.sin(a) * d,
            vx: Math.cos(driftA) * 58,
            vy: Math.sin(driftA) * 58,
            radius: 62,
            life: 7.5,
            maxLife: 7.5,
            tickTimer: 0.25,
          });
        }
      } else if (sim.weather === 'thunderstorm') {
        sim.weatherHazardTimer = 2.3;
        if (sim.weatherHazards.length < 3) {
          const onPlayer = Math.random() < 0.55;
          const a = Math.random() * Math.PI * 2;
          const d = onPlayer ? 40 + Math.random() * 95 : 130 + Math.random() * 190;
          sim.weatherHazards.push({
            kind: 'lightning_zone',
            x: px + Math.cos(a) * d,
            y: py + Math.sin(a) * d,
            vx: 0,
            vy: 0,
            radius: 68,
            life: 1.25,
            maxLife: 1.25,
            tickTimer: 0,
          });
        }
      } else if (sim.weather === 'blizzard') {
        sim.weatherHazardTimer = 2.4;
        if (sim.weatherHazards.length < 6) {
          const a = Math.random() * Math.PI * 2;
          const d = 100 + Math.random() * 220;
          sim.weatherHazards.push({
            kind: 'ice_patch',
            x: px + Math.cos(a) * d,
            y: py + Math.sin(a) * d,
            vx: 0,
            vy: 0,
            radius: 68,
            life: 8.5,
            maxLife: 8.5,
            tickTimer: 0,
          });
        }
      } else if (sim.weather === 'acid_rain') {
        sim.weatherHazardTimer = 2.5;
        if (sim.weatherHazards.length < 5) {
          const a = Math.random() * Math.PI * 2;
          const d = 105 + Math.random() * 185;
          sim.weatherHazards.push({
            kind: 'acid_pool',
            x: px + Math.cos(a) * d,
            y: py + Math.sin(a) * d,
            vx: 0,
            vy: 0,
            radius: 64,
            life: 8.0,
            maxLife: 8.0,
            tickTimer: 0.25,
          });
        }
      }
    }
  }

  // Update active Weather Hazards
  for (let i = sim.weatherHazards.length - 1; i >= 0; i--) {
    const hz = sim.weatherHazards[i];
    hz.life -= dt;
    hz.x += hz.vx * dt;
    hz.y += hz.vy * dt;

    if (hz.kind === 'sand_vortex') {
      const pDist = Math.hypot(px - hz.x, py - hz.y);
      if (pDist <= hz.radius + sim.player.radius) {
        sim.sandSlowTimer = Math.max(sim.sandSlowTimer, 0.55 * sim.cachedSlowDebuffFactor);
        if (sim.dashTimer <= 0) {
          const tang = Math.atan2(py - hz.y, px - hz.x) + Math.PI * 0.42;
          sim.player.x += Math.cos(tang) * 52 * dt;
          sim.player.y += Math.sin(tang) * 52 * dt;
        }
        if (sim.weatherTextCooldown <= 0) {
          sim.weatherTextCooldown = 1.15;
          addFloatingText(sim, px, py - 30, 'โดนพายุทราย! เดินช้าลง', '#FBBF24', 0.95);
        }
        hz.tickTimer -= dt;
        if (hz.tickTimer <= 0 && sim.player.invulnTimer <= 0 && sim.mageBarrierTimer <= 0) {
          hz.tickTimer = 0.9;
          const voidlessDmgMult = sim.voidlessTimer > 0 ? 0.5 : 1;
          const eventDmgMult = sim.mapEvent === 'void_corruption' ? 1.3 : 1;
          const preShieldSandDmg = Math.max(
            1,
            Math.round(
              (3 - Math.floor(stats.armor * 0.5)) *
                eventDmgMult *
                voidlessDmgMult *
                stats.bulletDamageTakenMult
            )
          );
          const sandDmg = absorbPlayerShield(sim, preShieldSandDmg);
          if (sandDmg > 0) {
            sim.player.hp -= sandDmg;
            sim.lastDamageFromReaper = false;
            sim.noDamageTimer = 0;
            sim.lastDamageSourceTh = 'พายุทรายกลืนชีวิต';
            sim.player.hitFlash = 0.08;
            addFloatingText(sim, px, py - 16, `-${sandDmg}`, '#F59E0B', 0.9);
          }
        }
      }
      if (hz.life <= 0) sim.weatherHazards.splice(i, 1);
    } else if (hz.kind === 'lightning_zone') {
      if (hz.life <= 0) {
        sim.weatherLightningFlash = 0.42;
        sound.playLightning();
        sim.groundFx.push({
          kind: 'lightning',
          x: hz.x,
          y: hz.y,
          radius: 14,
          maxRadius: hz.radius,
          life: 0.34,
          maxLife: 0.34,
          color: '#38BDF8',
        });
        spawnParticles(sim, hz.x, hz.y, '#7DD3FC', 12, 160);
        const shockDmg = (55 + sim.player.level * 4) * stats.damageMult;
        for (const en of sim.enemies) {
          if (en.hp <= 0) continue;
          if (Math.hypot(en.x - hz.x, en.y - hz.y) <= hz.radius + en.radius) {
            damageEnemy(sim, en, shockDmg, null, 70, en.x - hz.x, en.y - hz.y, stats.greedMult, false, false, false, 'elemental');
          }
        }
        if (
          Math.hypot(px - hz.x, py - hz.y) <= hz.radius &&
          sim.player.invulnTimer <= 0 &&
          sim.mageBarrierTimer <= 0
        ) {
          const voidlessDmgMult = sim.voidlessTimer > 0 ? 0.5 : 1;
          const eventDmgMult = sim.mapEvent === 'void_corruption' ? 1.3 : 1;
          const preShieldBoltDmg = Math.max(
            2,
            Math.round(
              (15 + sim.realmTier * 5 - stats.armor) *
                eventDmgMult *
                voidlessDmgMult *
                stats.bulletDamageTakenMult
            )
          );
          const boltDmg = absorbPlayerShield(sim, preShieldBoltDmg);
          if (boltDmg > 0) {
            sim.player.hp -= boltDmg;
            sim.lastDamageFromReaper = false;
            sim.noDamageTimer = 0;
            sim.lastDamageSourceTh = 'ฟ้าผ่าจากพายุ';
            breakCombo(sim);
            triggerDamageFlash(sim, boltDmg);
            sim.player.invulnTimer = 0.45 + sim.cachedExtraInvulnOnHit;
            sim.player.hitFlash = 0.16;
            sim.shakeTime = 0.16;
            sim.shakeIntensity = 6;
            sound.playPlayerHit();
            addFloatingText(sim, px, py - 24, `ฟ้าผ่า! -${boltDmg}`, '#38BDF8', 1.15);
          } else {
            sim.player.invulnTimer = 0.25;
          }
        }
        sim.weatherHazards.splice(i, 1);
      }
    } else if (hz.kind === 'ice_patch') {
      if (Math.hypot(px - hz.x, py - hz.y) <= hz.radius + sim.player.radius * 0.6) {
        sim.iceSlowTimer = Math.max(sim.iceSlowTimer, 0.25 * sim.cachedSlowDebuffFactor);
      }
      if (hz.life <= 0) sim.weatherHazards.splice(i, 1);
    } else if (hz.kind === 'acid_pool') {
      if (Math.hypot(px - hz.x, py - hz.y) <= hz.radius + sim.player.radius * 0.4) {
        hz.tickTimer -= dt;
        if (hz.tickTimer <= 0 && sim.player.invulnTimer <= 0 && sim.mageBarrierTimer <= 0) {
          hz.tickTimer = 0.85;
          const voidlessDmgMult = sim.voidlessTimer > 0 ? 0.5 : 1;
          const eventDmgMult = sim.mapEvent === 'void_corruption' ? 1.3 : 1;
          const preShieldAcidDmg = Math.max(
            2,
            Math.round(
              (5 + sim.realmTier * 2 - Math.floor(stats.armor * 0.35)) *
                eventDmgMult *
                voidlessDmgMult *
                stats.bulletDamageTakenMult
            )
          );
          const acidDmg = absorbPlayerShield(sim, preShieldAcidDmg);
          if (acidDmg > 0) {
            sim.player.hp -= acidDmg;
            sim.lastDamageFromReaper = false;
            sim.noDamageTimer = 0;
            sim.lastDamageSourceTh = 'บ่อฝนกรด';
            sim.player.hitFlash = 0.1;
            addFloatingText(sim, px, py - 20, `กรดกัด! -${acidDmg}`, '#A3E635', 0.95);
          }
        }
      }
      if (hz.life <= 0) sim.weatherHazards.splice(i, 1);
    }
  }

  return false;
}
