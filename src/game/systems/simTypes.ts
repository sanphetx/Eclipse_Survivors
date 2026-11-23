import {
  ActiveInRunQuest,
  ArtifactId,
  BossBuffId,
  DamageType,
  ElementFusionDef,
  ElementId,
  EnemyKind,
  EquippedArtifacts,
  EquippedRelic,
  EquippedWeapon,
  FusionResonance,
  GoldBreakdown,
  MagePerkId,
  MapEventId,
  MapInteractionArtifactOffer,
  PotionId,
  RaceClassId,
  SinId,
  WeaponId,
  WeatherId,
} from '../types';
import { ParticleShape } from '../fusionVfx';
import {
  BreakableProp,
  MapLandmark,
  MapObstacle,
  MapTrap,
  SecretRoomKind,
  TerrainZone,
  TrapRuntimeState,
} from '../mapObstacles';
import { VfxId } from '../craftpixAssets';
import { VfxInstance } from '../vfxPlayer';

export interface EnemyEntity {
  id: number;
  kind: EnemyKind;
  nameTh?: string;
  isElite?: boolean;
  eliteResistType?: DamageType;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  hp: number;
  maxHp: number;
  speed: number;
  damage: number;
  armorRatio: number; // 0..0.75
  knockbackResist: number;
  kbVx: number;
  kbVy: number;
  hitFlash: number;
  isBoss: boolean;
  isMajorBoss: boolean;
  isReaper: boolean;
  dpsCapWindowStart?: number;
  dpsCapWindowDmg?: number;
  buffs: BossBuffId[];
  buffTimer: number;
  buffCycle: number;
  berserkActive: boolean;
  xpValue: number;
  goldChance: number;
  aiTimer: number;
  windupTimer: number;
  phaseAngle: number;
  behaviorMode:
    | 'chase'
    | 'swoop'
    | 'constrict'
    | 'ranged'
    | 'sniper'
    | 'zealot'
    | 'charger'
    | 'trapper'
    | 'shielder'
    | 'bomber'
    | 'boss';
  swoopVx?: number;
  swoopVy?: number;
  dashDirX?: number;
  dashDirY?: number;
  dashActiveTimer?: number;
  ringAngle?: number;
  ringDist?: number;
  freezeTimer?: number;
  hardFreezeTimer?: number;
  frostStacks?: number;
  burnTimer?: number;
  burnTickTimer?: number;
  burnPct?: number;
  windMarkTimer?: number;
  windMarkDamage?: number;
  huntMarks?: number;
  hellfireStacks?: number;
  hellfireTimer?: number;
  hellfireTickTimer?: number;
  bleedStacks?: number;
  bleedTimer?: number;
  bleedTickTimer?: number;
  charmTimer?: number;
  charmAttackCd?: number;
  tauntTarget?: 'player' | 'golem' | 'sin';
  tauntCheckedGolem?: boolean;
  stagger?: number;
  maxStagger?: number;
  staggerTimer?: number;
  staggerImmuneTimer?: number;
  rootTimer?: number;
  wetTimer?: number;
  elevZ?: number;
  isGoldenBat?: boolean;
  // Human Rework v2 statuses
  emeraldMarkTimer?: number;
  judgementTimer?: number;
  knightTauntTimer?: number;
  tauntGolemTimer?: number;
}

export interface TotemEntity {
  x: number;
  y: number;
  life: number;
  maxLife: number;
  pulseTimer: number;
  evolved: boolean;
  damage: number;
  radius: number;
}

export interface PlayerProjectile {
  weaponId: WeaponId;
  evolved: boolean;
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
  homing?: boolean;
  boomerang?: boolean;
  returnSpeed?: number;
  explosive?: boolean;
  soakSlow?: boolean;
  applyBurnPct?: number;
  applyDeepFreeze?: boolean;
  applyWindMark?: boolean;
  applyEmeraldMark?: boolean;
  damageType?: DamageType;
  customKind?: 'arrow' | 'claw' | 'feather' | 'sword_wave' | 'shadow_knife';
  fromClassSkill?: boolean;
  color: string;
  trailColors?: string[];
  particleShapes?: ParticleShape[];
  trailTimer?: number;
}

export interface EnemyBullet {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  damage: number;
  life: number;
  isSnare?: boolean;
  color: string;
}

export interface GroundFx {
  kind:
    | 'lightning'
    | 'shockwave'
    | 'explosion'
    | 'warp'
    | 'beam'
    | 'slash_arc'
    | 'grand_slash'
    | 'paladin_sword'
    | 'shadow_cut'
    | 'judgement_rift'
    | 'vfx';
  x: number;
  y: number;
  x2?: number;
  y2?: number;
  angle?: number;
  isExcalibur?: boolean;
  radius: number;
  maxRadius: number;
  life: number;
  maxLife: number;
  color: string;
  vfxId?: VfxId;
  dw?: number;
  dh?: number;
  rotation?: number;
}

export interface SinEntity {
  sinId: SinId;
  level: number;
  active: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  hp: number;
  maxHp: number;
  respawnTimer: number;
  aiTimer: number;
  wrathStacks: number;
  wrathFrenzyTimer: number;
  greedGoldBuffer: number;
  slothAwake: boolean;
  tempSummonTimer: number;
}

export interface DemonImpEntity {
  x: number;
  y: number;
  vx: number;
  vy: number;
  hp: number;
  life: number;
  damage: number;
}

export interface SanctuaryZoneEntity {
  x: number;
  y: number;
  radius: number;
  life: number;
  maxLife: number;
  tickTimer: number;
}

export interface SweepingLaserEntity {
  angle: number;
  angularSpeed: number;
  length: number;
  width: number;
  damage: number;
  color: string;
  trailColors?: string[];
  particleShapes?: ParticleShape[];
  trailTimer?: number;
  life: number;
  maxLife: number;
  tickCooldowns: Record<number, number>;
}

export interface OrbitingBladeEntity {
  angle: number;
  angularSpeed: number;
  orbitRadius: number;
  radius: number;
  damage: number;
  color: string;
  trailColors?: string[];
  particleShapes?: ParticleShape[];
  trailTimer?: number;
  life: number;
  maxLife: number;
  hitCooldowns: Record<number, number>;
}

export interface WeatherHazard {
  kind: 'sand_vortex' | 'lightning_zone' | 'ice_patch' | 'acid_pool';
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  life: number;
  maxLife: number;
  tickTimer: number;
}

export interface DropEntity {
  kind:
    | 'xp'
    | 'xp_large'
    | 'gold'
    | 'gold_pouch'
    | 'sealed_chest'
    | 'meat'
    | 'magnet'
    | 'chest'
    | 'artifact_chest'
    | 'bomb'
    | 'speed_potion'
    | 'element_orb'
    | 'mana_gem';
  x: number;
  y: number;
  value: number;
  elementId?: ElementId;
  magnetized: boolean;
}

export interface ActiveFusedSpell {
  def: ElementFusionDef;
  catalyst: ElementId;
  resonance: FusionResonance;
  voidInfused?: boolean;
  remaining: number;
  maxDuration: number;
  cooldownTimer: number;
}

export interface ElementalFieldEntity {
  kind: 'vortex' | 'pool' | 'black_hole' | 'heaven_pillar';
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  damage: number;
  color: string;
  life: number;
  maxLife: number;
  tickTimer: number;
  pullStrength: number;
  slowTargets?: boolean;
  leechHp?: boolean;
  pullNonBossAll?: boolean;
  exitSlowSec?: number;
  trailColors?: string[];
  particleShapes?: ParticleShape[];
  trailTimer?: number;
}

export interface SpiritSwordEntity {
  id: number;
  element: ElementId;
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  hp: number;
  maxHp: number;
  damage: number;
  slashCooldown: number;
  swingTimer: number;
  invulnTimer: number;
  hitCooldowns: Record<number, number>;
}

export interface Particle {
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
  spin?: number;
  drag?: number;
  zOffset?: number;
  glow?: boolean;
}

export interface FloatingText {
  x: number;
  y: number;
  vx?: number;
  vy: number;
  gravity?: number;
  text: string;
  color: string;
  life: number;
  maxLife: number;
  scale: number;
  isCrit?: boolean;
  isDamage?: boolean;
}

// Human Rework v2 Sub-entities
export interface HunterShadowEcho {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  delayTimer: number;
  activeTimer: number;
  triggered: boolean;
}

export interface HunterDashHistorySeg {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface KnightSacredBlade {
  id: number;
  x: number;
  y: number;
  homeAngleOffset: number;
  state: 'orbit' | 'windup' | 'striking' | 'returning' | 'spawning' | 'finale_up' | 'finale_planted';
  targetId: number | null;
  targetX: number;
  targetY: number;
  tempLife: number; // -1 for permanent, >0 for temporary (20s)
  slashProgress: number;
  stateTimer?: number;
  startX?: number;
  startY?: number;
  trail?: Array<{ x: number; y: number }>;
  whiteFlash?: number;
  spawnTimer?: number;
  heavyHit?: boolean;
}

export interface SaintSigil {
  id: number;
  x: number;
  y: number;
  life: number;
  maxLife: number;
  beamTimer: number;
  dotTimer: number;
}

export interface SimState {
  player: {
    x: number;
    y: number;
    vx: number;
    vy: number;
    facingX: number;
    facingY: number;
    radius: number;
    hp: number;
    maxHp: number;
    xp: number;
    xpToNext: number;
    level: number;
    invulnTimer: number;
    hitFlash: number;
    walkCycle: number;
  };
  weapons: EquippedWeapon[];
  relics: EquippedRelic[];
  enemies: EnemyEntity[];
  projectiles: PlayerProjectile[];
  enemyBullets: EnemyBullet[];
  groundFx: GroundFx[];
  drops: DropEntity[];
  totems: TotemEntity[];
  particles: Particle[];
  floatingTexts: FloatingText[];
  elapsedSeconds: number;
  realmStartSeconds: number;
  realmTier: number;
  balanceDmgAccum?: number;
  balanceLastLoggedMinute?: number;
  combo?: number;
  comboBest?: number;
  comboMilestone?: number;
  comboMilestoneId?: number;
  comboBreakId?: number;
  comboBrokenAt?: number;
  biomeShiftCount: number;
  reaperSlainCount: number;
  reaperCurseStacks?: number;
  lastMinuteAnnounced: number;
  spawnedBossMinutes: Set<number>;
  spawnTimer: number;
  eliteSpawnTimer: number;
  flowerRingTimer: number;
  goldEarned: number;
  soulEssenceEarned: number;
  goldBreakdown: GoldBreakdown;
  pendingSealedChests: number;
  elitesKilled: number;
  kills: number;
  bossesKilled: number;
  nextEnemyId: number;
  orbitAngle: number;
  orbitParticleTimer?: number;
  garlicTimer: number;
  shakeTime: number;
  shakeMaxTime: number;
  shakeIntensity: number;
  hitShakeCooldown: number;
  hitstopTimer: number;
  announcement: string | null;
  announcementTimer: number;
  garlicHealCounter: number;
  dashTimer: number;
  dashCooldown: number;
  dashVx: number;
  dashVy: number;
  snareTimer: number;
  weather: WeatherId;
  weatherTimer: number;
  weatherHazardTimer: number;
  weatherHazards: WeatherHazard[];
  sandSlowTimer: number;
  iceSlowTimer: number;
  weatherLightningFlash: number;
  damageFlash: number;
  damageFlashMax: number;
  damageFlashAlpha: number;
  abilityFlash: number;
  abilityFlashMax: number;
  abilityFlashAlpha: number;
  weatherTextCooldown: number;
  orcLevelHpBonus: number;
  vampireKillCounter: number;
  raceClass: RaceClassId | null;
  classPrompted: boolean;
  classSkillTimer: number;
  saintRegenTimer: number;
  reviveCooldown: number;
  leechWindowStart?: number;
  leechWindowHealed?: number;
  woundedTimer?: number;
  dayNightElapsed: number;
  classGauge: number;
  ultActiveTimer: number;
  ultActiveMax: number;
  ultCount: number;
  ultCutinTimer: number;
  ultCutinMax: number;
  ultCutinTitleTh: string;
  ultCutinTitleEn: string;
  ultCutinColor: string;
  ultSlowTimer: number;
  ultZoomTimer: number;
  ultZoomMax: number;
  ultAscended: boolean;
  spaceDown: boolean;
  spaceHoldTime: number;
  spaceTriggeredUlt: boolean;
  mobileHoldActive: boolean;
  mobileHoldTime: number;
  mobileTriggeredUlt: boolean;
  // Hunter (Rework v2)
  dashStartX: number;
  dashStartY: number;
  dashCutHitIds: Set<number>;
  shadowCloneTimer: number;
  hunterDashCharges: number;
  hunterDashMaxCharges: number;
  hunterDashRechargeTimer: number;
  hunterKillRefunds: number;
  hunterDashGaugeEarned?: number;
  hunterShadowSlashKills?: number;
  hunterEchoes: HunterShadowEcho[];
  hunterUltDashHistory: HunterDashHistorySeg[];
  // Saint (Rework v2)
  golem: {
    x: number;
    y: number;
    walkCycle: number;
    smashCooldown: number;
    smashingTimer: number;
    hp: number;
    maxHp: number;
    respawnTimer: number;
    leapCooldown: number;
    spearTimer: number;
    lostHpTrack: number;
  } | null;
  saintShieldHits: number;
  saintHealExplosionCd: number;
  sanctuaryZones: SanctuaryZoneEntity[];
  saintSigils: SaintSigil[];
  saintNextSigilId: number;
  saintSanctumKills: number;
  saintSanctumDamageTimer: number;
  saintSanctumHealBuffer: number;
  saintGolemHealBuffer: number;
  saintGolemTauntTimer: number;
  // Knight (Rework v2)
  knightSwingCount: number;
  knightParryCount: number;
  knightAegisBonus: number;
  parryWindowTimer: number;
  knightParryFlash: number;
  plantedExcalibur: { x: number; y: number; life: number; maxLife: number } | null;
  knightSacredBlades: KnightSacredBlade[];
  knightNextBladeId: number;
  knightBulwarkStacks: number;
  knightTauntTimer: number;
  knightBladeAttackTimer: number;
  // Demon Lord
  demonSoulKills: number;
  demonFlameTrailTimer: number;
  demonRainTimer: number;
  demonImps: DemonImpEntity[];
  // Vampire Lord
  vampireBloodShield: number;
  vampireLowHpTime: number;
  vampireLastRiteCd: number;
  vampireUltPulseTimer: number;
  vampireUltSpearTimer: number;
  // Seven Sins
  sins: SinEntity[];
  standStillTimer: number;
  nextSinContractLevel: number;
  eighthSinTimer: number;
  mana: number;
  maxMana: number;
  manaRegen: number;
  lowManaTimer: number;
  heldElements: ElementId[];
  activeFusions: ActiveFusedSpell[];
  magePerks: Partial<Record<MagePerkId, number>>;
  mageSparkTimer: number;
  mageOrbSpawnTimer: number;
  mageFusionCount: number;
  fusionCooldown: number;
  fusionMaxCooldown: number;
  voidInfusionActive: boolean;
  mageBarrierTimer: number;
  mageBarrierPulseTimer: number;
  lastSpellbladeFusion: {
    def: ElementFusionDef;
    catalyst: ElementId;
    resonance: FusionResonance;
    voidInfused?: boolean;
    colors?: string[];
    shapes?: ParticleShape[];
  } | null;
  mapEvent: MapEventId | null;
  mapEventTimer: number;
  nextMapEventTimer: number;
  lastMapEvent: MapEventId | null;
  ambushSpawnTimer: number;
  elementalFields: ElementalFieldEntity[];
  sweepingLasers: SweepingLaserEntity[];
  orbitingBlades: OrbitingBladeEntity[];
  elementalGolem: {
    theme: 'frost' | 'stone';
    x: number;
    y: number;
    life: number;
    maxLife: number;
    walkCycle: number;
    smashCooldown: number;
    smashingTimer: number;
  } | null;
  timeStopTimer: number;
  timeStopCooldown: number;
  lastDamageFromReaper?: boolean;
  deathStacks: number;
  deathNovaCounter: number;
  spellbladeSlashCounter: number;
  spellbladeCharge: number;
  spellbladeChargeCooldown: number;
  spellbladeChargeMaxCooldown: number;
  spellbladeStandTime: number;
  spellbladeChargeNotified: boolean;
  spellbladeSwingTimer: number;
  spellbladeInfusionName: string | null;
  spellbladeInfusionColor: string | null;
  spellbladeActiveElement: ElementId | null;
  spellbladeHitHealCooldown: number;
  spellbladeFusionCount: number;
  spellbladeLightHealTimer: number;
  voidlessTimer: number;
  voidlessCooldown: number;
  voidlessKills: number;
  voidlessPillarTimer: number;
  spiritSwords: SpiritSwordEntity[];
  artifacts: EquippedArtifacts;
  nextArtifactLevel: number;
  artifactRegenTimer: number;
  artifactRegenBuffer: number;
  artifactLifestealBuffer: number;
  artifactHealTextCooldown: number;
  ironRamCooldown: number;
  cachedCritChance: number;
  cachedCritDamageMult: number;
  cachedLifestealPct: number;
  cachedHealTakenFactor: number;
  cachedSlowDebuffFactor: number;
  cachedDashCooldownFactor: number;
  cachedThornBurstOnHit: boolean;
  cachedExtraInvulnOnHit: number;
  cachedRawDmgIncrease: number;
  cachedBaseDamageMult: number;
  cachedCurseLevel: number;
  cachedHourglassFreeze: boolean;
  cachedLightningCrownChance: number;
  cachedShadowRing: boolean;
  rerollsLeft: number;
  banishesLeft: number;
  skipsLeft: number;
  banishedKeys: Set<string>;
  metaRevivesLeft: number;
  activePotion: PotionId | null;
  potionUsed: boolean;
  goldDoubleTimer: number;
  xpDoubleTimer: number;
  fatePowderActive: boolean;
  altarHitShieldCd: number;
  altarEmergencyUsed: boolean;
  hourglassFreezeTimer: number;
  shadowBombs: Array<{ x: number; y: number; timer: number; damage: number }>;
  petX: number;
  petY: number;
  petActionTimer: number;
  petShieldCooldown: number;
  inRunQuests: ActiveInRunQuest[];
  noDamageTimer: number;
  lastDamageSourceTh: string;
  runKillsByKind: Partial<Record<EnemyKind, number>>;
  runBananaKills: number;
  runFireBurnKills: number;
  runDefeatedBossKinds: string[];
  bloodGauge: number;
  batSwarmTimer: number;
  batSwarmCooldown: number;
  batSwarmTickTimer: number;
  orcRage: number;
  orcBerserkTimer: number;
  orcBerserkCooldown: number;
  warCryCooldown: number;
  orcRageHitCooldown: number;
  activeSkillHintCooldown: number;
  runEnded: boolean;
  // M1-M8 Map System State
  mapSeed: number;
  frameObstacles: MapObstacle[];
  frameBreakables: BreakableProp[];
  frameTraps: MapTrap[];
  frameZones: TerrainZone[];
  brokenTiles: Set<string>;
  breakableHits: Record<string, number>;
  trapStates: Record<string, TrapRuntimeState>;
  ritualFireLines: Array<{ x1: number; y1: number; x2: number; y2: number; life: number; tickTimer: number }>;
  propHitCooldowns: Record<string, number>;
  awakenedTrees: Set<string>;
  graveHandCooldowns: Record<string, number>;
  graveSlowTimer: number;
  speedPotionTimer: number;
  playerElevZ: number;
  playerSinkKind: 'water' | 'lava' | 'poison' | null;
  playerWetTimer: number;
  onHighGround: boolean;
  inWaterPuddle: boolean;
  inPoisonSwamp: boolean;
  inLavaPool: boolean;
  inFlowerMeadow: boolean;
  activeTerrainTh: string | null;
  activeTerrainColor: string | null;
  lavaPoolTickTimer: number;
  meadowRegenBuffer: number;
  landmarks: MapLandmark[];
  nextLandmarkTimer: number;
  landmarkRevealActive: boolean;
  statueEffect: { kind: 'blessing' | 'curse'; remaining: number } | null;
  merchantCooldown: number;
  bloodShrineCooldown: number;
  secretPortal: { x: number; y: number; remaining: number } | null;
  nextSecretPortalTimer: number;
  inSecretRoom: boolean;
  secretRoomKind: SecretRoomKind | null;
  secretRoomTimer: number;
  secretRoomBreakables: BreakableProp[];
  secretRoomExpAccum: number;
  secretRoomShopOffers: MapInteractionArtifactOffer[];
  secretRoomShopOpened: boolean;
  secretRoomCleared: boolean;
  savedMainWorld: {
    playerX: number;
    playerY: number;
    enemies: EnemyEntity[];
    enemyBullets: EnemyBullet[];
    drops: DropEntity[];
    projectiles: PlayerProjectile[];
    groundFx: GroundFx[];
    totems: TotemEntity[];
  } | null;
  godBlessings: {
    reactionBonus: number;
    areaBonus: number;
    cdrBonus: number;
  };
  reactionCount: number;
  shrinkingRing: { cx: number; cy: number; radius: number; tickTimer: number; survived: boolean } | null;
  treasureCart: { x: number; y: number; hp: number; maxHp: number; facingX: number; hitFlash: number } | null;
  meteorTelegraphs: Array<{ x: number; y: number; radius: number; timer: number; maxTimer: number; isLavaRock: boolean }>;
  meteorSpawnTimer: number;
  earthSplits: Array<{ x: number; y: number; angle: number; length: number; warnTimer: number; activeTimer: number; tickTimer: number }>;
  earthSplitSpawnTimer: number;
  volcanoEruptionTimer: number;
  volcanoEruptionActive: number;
  volcanoRockTimer: number;
  mapEventBannerTimer: number;
  activeMapEventBanner: { nameTh: string; effectTh: string; kind: 'blessing' | 'threat'; color: string } | null;
  vfx: VfxInstance[];
  castAnimTimer: number;
  castAnimCooldown: number;
  castFacingX: number;
  healSparkleTimer: number;
}

export interface ComputedStats {
  isNight: boolean;
  dayNightProgress: number;
  spellbladeBuffs: {
    elements: ElementId[];
    dmgBonus: number;
    reachBonus: number;
    chargeRateBonus: number;
    speedBonus: number;
    armorBonus: number;
    kbMult: number;
    freezeSec: number;
    manaLeech: number;
    hpLeech: number;
    fireBlast: boolean;
  };
  damageMult: number;
  moveSpeed: number;
  armor: number;
  cooldownMult: number;
  areaMult: number;
  projSpeedMult: number;
  magnetRadius: number;
  greedMult: number;
  maxMana: number;
  manaRegen: number;
  manaCostMult: number;
  orbManaGain: number;
  fusionDurationBonus: number;
  fusionMaxCooldown: number;
  critChance: number;
  critDamageMult: number;
  xpGainMult: number;
  doubleLootLuckChance: number;
  lifestealPct: number;
  regenPctPer2Sec: number;
  damageTakenMult: number;
  bulletDamageTakenMult: number;
  slowDebuffFactor: number;
  dashCooldownFactor: number;
  phaseSmallMonsters: boolean;
  classSkillPower: number;
}
