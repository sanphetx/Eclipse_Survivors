import React, { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import {
  ARTIFACTS,
  BALANCE,
  BOSS_BUFFS,
  ELEMENT_CATALYSTS,
  ELEMENT_IDS,
  ELEMENTS,
  getActiveBiome,
  getClassesForRace,
  getElementFusion,
  getWaveForMinute,
  MAGE_PERKS,
  MAP_EVENTS,
  pickBossBuffs,
  pickNextMapEvent,
  pickNextWeather,
  RACE_CLASSES,
  RACES,
  RELICS,
  SCHEDULED_BOSSES,
  SEVEN_SINS,
  SIN_ORDER,
  STAGES,
  WEAPONS,
  WEATHERS,
} from '../game/data';
import {
  BossChestOptions,
  DraftOptions,
  generateArtifactDraft,
  generateBossChestReward,
  generateLevelUpDraft,
  getDraftChoiceKey,
} from '../game/draft';
import { preloadCraftpixAssets, VFX_SHEETS, VfxId as CraftpixVfxId } from '../game/craftpixAssets';
import {
  CombinedVisualPalette,
  getCombinedElementPalette,
  getEvolvedWeaponPalette,
  ParticleShape,
} from '../game/fusionVfx';
import {
  draw25DDrop,
  draw25DPet,
  draw25DProp,
  draw25DTotem,
  drawBiomeBackground,
  drawBreakableProp,
  drawChronoDomeShell,
  drawChronoWell,
  drawDemonImpSprite,
  drawDimensionPortal25D,
  drawEarthSplitFissure,
  drawElementalField,
  drawElementalGolemSprite,
  drawElementOrbSprite,
  drawEnemyBulletSprite,
  drawEnemySprite,
  drawExcaliburPlanted,
  drawGroundFxSprite,
  drawHeroSprite,
  drawHolyGolemSprite,
  drawKnightExcaliburIntroOverlay,
  drawKnightSacredBladesWorld,
  drawKnightSwordCrescentWave,
  drawKnightTauntGroundFx,
  drawKnightUltBgPillars,
  drawKnightUltFinaleFx,
  drawLandmark25D,
  drawManaGemSprite,
  drawMapObstacle,
  drawMapTrap,
  drawMeteorTelegraph,
  drawNecroMinionSprite,
  drawNightFogOverlay,
  drawOffscreenArrow,
  drawOrbitWeaponSprite,
  drawPaladinSwordSlash,
  drawProjectileSprite,
  drawReaperSweepTelegraph,
  drawRitualFireLine,
  drawSecretRoomPerimeter,
  drawSevenSinsRitualCircle,
  drawShadowCutSlash,
  drawShrinkingRingOverlay,
  drawSinEntitySprite,
  drawSpiritSwordSprite,
  drawStyledParticle,
  drawSweepingLaser,
  drawTemporalAtmosphereOverlay,
  drawTerrainZoneGround,
  drawTimeDebtClockFx,
  drawTreasureCart25D,
  drawUltimateBackdropMoon,
  drawUltimateCutinOverlay,
  drawWeatherHazard,
  drawWeatherOverlay,
  getVisible25DProps,
  ISO_TILT,
  preloadMageSprites,
} from '../game/renderer';
import {
  drawVfx,
  preloadVfx,
  spawnVfx,
  updateVfx,
  VfxInstance,
} from '../game/vfxPlayer';
import {
  drawPackVfx,
  drawPackVfxLayer,
  getMageSpellVfxKey,
  getSpellbladeWaveKey,
  PACK_VFX,
  PackVfxInstance,
  PackVfxKey,
  preloadPackVfx,
  spawnPackVfx,
  updatePackVfx,
} from '../game/packVfx';
import {
  BreakableProp,
  getBreakablesNear,
  getObstaclesNear,
  getSecretRoomWallObstacles,
  getTerrainZoneAt,
  getTerrainZonesNear,
  getTrapsNear,
  LANDMARK_META,
  LandmarkKind,
  MapLandmark,
  MapObstacle,
  MapTrap,
  resolveCircleVsObstacles,
  SECRET_ROOM_HALF_H,
  SECRET_ROOM_HALF_W,
  SECRET_ROOM_NAMES_TH,
  SecretRoomKind,
  TerrainZone,
  TrapRuntimeState,
} from '../game/mapObstacles';
import {
  BESTIARY_BY_KIND,
  computeCurseLevel,
  CURSES,
  getBestiaryDamageBonus,
  getGearItemEffectiveValue,
  PERMANENT_GEAR_CATALOG,
  PETS,
  POTIONS,
  RACE_SKINS,
  rollGearRarity,
  rollInRunQuests,
  rollRandomGearDefId,
} from '../game/metaData';
import { sound } from '../game/sound';
import {
  ActiveInRunQuest,
  ArtifactId,
  BossBuffId,
  BossChestReward,
  BotMode,
  DraftChoice,
  ElementFusionDef,
  ElementId,
  EnemyKind,
  EquippedArtifacts,
  EquippedRelic,
  EquippedWeapon,
  ExtractedGearPreview,
  FusionResonance,
  GameScreenState,
  GoldBreakdown,
  HudSnapshot,
  MagePerkId,
  MapEventId,
  MapInteractionArtifactOffer,
  MapInteractionPrompt,
  MapInteractionResult,
  PotionId,
  RaceClassId,
  RaceId,
  RelicId,
  RunPace,
  RunSummary,
  SaveData,
  SinContractChoice,
  SinId,
  StageId,
  WeaponId,
  WeatherId,
} from '../game/types';
import {
  NECRO_FEALTY_CAP,
  NECRO_MINION_CAP,
  NECRO_SHIELD_MAX,
  NECRO_SOUL_CAP_PCT,
  NecroMinionEntity,
  castDominionOfEternalFealty,
  getNecroMinionHudSummary,
  tryResurrectNecroMinion,
  updateMinionBehavior,
} from '../game/systems/minionBehavior';
import { isBackstabAngle } from '../game/systems/combat';
import { HUNTER_DASH_RANGE_MULT, HUNTER_RECHARGE_SEC } from '../game/systems/classSkills';
import type { KnightSacredBlade } from '../game/systems/simTypes';

export interface GameCanvasHandle {
  applyDraftChoice: (choice: DraftChoice) => void;
  applyBossChest: (reward: BossChestReward) => void;
  applyArtifactChoice: (artifactId: ArtifactId | null) => void;
  applyRaceClass: (classId: RaceClassId) => void;
  applySinContract: (sinId: SinId, banishSinId?: SinId) => void;
  resolveMapInteraction: (result: MapInteractionResult) => void;
  rerollDraft: () => void;
  banishDraft: (choice: DraftChoice) => void;
  skipDraft: () => void;
  triggerPotion: () => void;
  finishRunAsQuit: () => void;
  triggerDash: () => void;
  triggerVoidInfusion: () => void;
  triggerActiveSkill: () => void;
  startHoldActiveSkill: () => void;
  releaseHoldActiveSkill: () => void;
}

interface GameCanvasProps {
  runId: number;
  screenState: GameScreenState;
  raceId: RaceId;
  stageId: StageId;
  starterWeapon: WeaponId;
  runPace: RunPace;
  simSpeed: number;
  botMode: BotMode;
  botTargetClass?: RaceClassId | 'auto';
  isDailyChallenge?: boolean;
  saveData: SaveData;
  onHudUpdate: (hud: HudSnapshot) => void;
  onLevelUpDraft: (choices: DraftChoice[]) => void;
  onBossChestOpen: (reward: BossChestReward) => void;
  onArtifactChestOpen: (choices: ArtifactId[]) => void;
  onClassEvolutionPrompt: (raceId: RaceId) => void;
  onSinContractOpen: (choices: SinContractChoice[]) => void;
  onMapInteractionPrompt: (prompt: MapInteractionPrompt) => void;
  onDiscoverFusion: (fusionKey: string) => void;
  onConsumePotion?: (potionId: PotionId) => void;
  onRunEnd: (summary: RunSummary) => void;
}

interface EnemyEntity {
  id: number;
  kind: EnemyKind;
  nameTh?: string;
  isElite?: boolean;
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
  hitReactTimer?: number;
  hitReactMax?: number;
  hitStrength?: number;
  recoilX?: number;
  recoilY?: number;
  isBoss: boolean;
  isMajorBoss: boolean;
  isReaper: boolean;
  // BALANCE: หน้าต่างจำกัดดาเมจต่อวินาทีของบอส (เวลาจริง)
  dpsCapWindowStart?: number;
  dpsCapWindowDmg?: number;
  buffs: BossBuffId[];
  buffTimer: number;
  buffCycle: number;
  berserkActive: boolean;
  xpValue: number;
  goldChance: number;
  aiTimer: number;
  windupTimer: number; // > 0 means telegraphing bullet/dash
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
  // Redesigned class enemy statuses
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
  chronoDebtSeconds?: number;
  chronoWellFrozenTime?: number;
  chronoLastWellId?: number;
  chronoLastWellExitAt?: number;
  chronoFrozenThisFrame?: boolean;
  chronoSlowedThisFrame?: boolean;
  reaperSweepCooldown?: number;
  reaperSweepCastTimer?: number;
  reaperSweepCastMax?: number;
  reaperSweepAngle?: number;
  reaperSweepArc?: number;
  reaperSweepRadius?: number;
  reaperSweepPostTimer?: number;
  parriedStunTimer?: number;
  knightTauntTimer?: number;
  judgementTimer?: number;
  knightTauntBangTimer?: number;
}

interface TotemEntity {
  x: number;
  y: number;
  life: number;
  maxLife: number;
  pulseTimer: number;
  evolved: boolean;
  damage: number;
  radius: number;
}

interface PlayerProjectile {
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
  customKind?: 'arrow' | 'claw' | 'feather' | 'sword_wave' | 'shadow_knife';
  fromClassSkill?: boolean;
  vfxKey?: PackVfxKey;
  vfxTint?: string;
  color: string;
  trailColors?: string[];
  particleShapes?: ParticleShape[];
  trailTimer?: number;
}

interface EnemyBullet {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  damage: number;
  life: number;
  isSnare?: boolean;
  color: string;
  frozenByWellId?: number;
  fromReaper?: boolean;
}

interface ChronoWellEntity {
  id: number;
  x: number;
  y: number;
  radius: number;
  life: number;
  maxLife: number;
  frozenIds: Set<number>;
  stopCdReduced: number;
}

interface ChronoHudMote {
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  life: number;
  maxLife: number;
}

interface NecroSoulOrb {
  x: number;
  y: number;
  vx: number;
  vy: number;
  zOffset: number;
  life: number;
  maxLife: number;
  age: number;
  color: string;
  glowColor: string;
  radius: number;
  fealty: boolean;
  trail: Array<{ x: number; y: number; z: number }>;
}

interface GroundFx {
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
    | 'time_debt_clock'
    | 'knight_crescent_wave'
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
  vfxKey?: PackVfxKey;
  vfxId?: CraftpixVfxId;
  dw?: number;
  dh?: number;
  loopFps?: number;
  upright?: boolean;
  zOffset?: number;
}

interface SinEntity {
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

interface DemonImpEntity {
  x: number;
  y: number;
  vx: number;
  vy: number;
  hp: number;
  life: number;
  damage: number;
}

interface SanctuaryZoneEntity {
  x: number;
  y: number;
  radius: number;
  life: number;
  maxLife: number;
  tickTimer: number;
}

interface SweepingLaserEntity {
  angle: number;
  angularSpeed: number;
  length: number;
  width: number;
  damage: number;
  color: string;
  vfxKey?: PackVfxKey;
  trailColors?: string[];
  particleShapes?: ParticleShape[];
  trailTimer?: number;
  life: number;
  maxLife: number;
  tickCooldowns: Record<number, number>;
}

interface OrbitingBladeEntity {
  angle: number;
  angularSpeed: number;
  orbitRadius: number;
  radius: number;
  damage: number;
  color: string;
  vfxKey?: PackVfxKey;
  trailColors?: string[];
  particleShapes?: ParticleShape[];
  trailTimer?: number;
  life: number;
  maxLife: number;
  hitCooldowns: Record<number, number>;
}

const WEATHER_INTERVAL_SECONDS = 300; // Dynamic weather shifts every 5 minutes in a run
const MIST_DETECT_RANGE = 230; // Reduced monster detection range during Mist

interface WeatherHazard {
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

interface DropEntity {
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

interface ActiveFusedSpell {
  def: ElementFusionDef;
  catalyst: ElementId;
  resonance: FusionResonance;
  voidInfused?: boolean;
  remaining: number;
  maxDuration: number;
  cooldownTimer: number;
}

interface ElementalFieldEntity {
  kind: 'vortex' | 'pool' | 'black_hole' | 'heaven_pillar';
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  damage: number;
  color: string;
  vfxKey?: PackVfxKey;
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

interface SpiritSwordEntity {
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

interface Particle {
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
  tag?: 'knight';
  isUpward?: boolean;
}

interface FloatingText {
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
  bounceOutline?: boolean;
}

interface SimState {
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
    visualFacingAngle: number;
    moveSpeedRatio: number;
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
  reaperCurseStacks: number;
  reaperApproachingAnnouncedRealm: number;
  reaperArrivedBannerTimer: number;
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
  critVfxCooldown: number;
  hitstopTimer: number;
  announcement: string | null;
  announcementTimer: number;
  announcementQueue: string[];
  lastAnnouncementObserved: string | null;
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
  // Day/Night clock decoupled for Vampire Ult freeze
  dayNightElapsed: number;
  // Shared Class Gauge + Ultimate + Cut-in + Ascension + Hold Space
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
  // Hunter
  dashStartX: number;
  dashStartY: number;
  dashCutHitIds: Set<number>;
  shadowCloneTimer: number;
  hunterDashCharges: number;
  hunterDashMaxCharges: number;
  hunterDashRechargeTimer: number;
  hunterKillRefunds: number;
  hunterEchoes: Array<{
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    delayTimer: number;
    activeTimer: number;
    triggered: boolean;
  }>;
  hunterUltDashHistory: Array<{ x1: number; y1: number; x2: number; y2: number }>;
  hunterCritGaugeCd: number;
  hunterShadowKnifeCd: number;
  hunterRefundCd: number;
  hunterDashGaugeEarned: number;
  hunterShadowSlashKills: number;
  // Saint
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
  // Knight
  knightSwingCount: number;
  knightParryCount: number;
  knightAegisBonus: number;
  parryWindowTimer: number;
  knightParryFlash: number;
  plantedExcalibur: { x: number; y: number; life: number; maxLife: number } | null;
  knightSacredBlades: KnightSacredBlade[];
  knightNextBladeId: number;
  knightBulwarkStacks: number;
  knightBulwarkCrackTimer: number;
  knightTauntTimer: number;
  knightTauntWindup: number;
  knightTauntCracks: Array<{ x: number; y: number; life: number; maxLife: number }>;
  knightParryOverlayTimer: number;
  knightParryCounterDelayTimer: number;
  knightParryTargetIds: Set<number>;
  knightParryBulletSnap: Array<{ x: number; y: number; vx: number; vy: number; radius: number; damage: number }>;
  knightUltIntroX: number;
  knightUltIntroY: number;
  knightUltIntroPhase: number;
  knightUltBgPillars: Array<{ x: number; width: number; alpha: number; life: number; maxLife: number }>;
  knightUltBgPillarCd: number;
  knightUltFinaleTimer: number;
  knightUltFinaleStage: number;
  knightUltFinaleX: number;
  knightUltFinaleY: number;
  knightAscendFxTimer: number;
  knightIdleMoteTimer: number;
  knightStepDustAccum: number;
  knightHitKnockbackX: number;
  knightHitSparkTimer: number;
  knightFullScreenFlashTimer: number;
  knightLastHitWasCrit: boolean;
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
  timeStopMaxCooldown: number;
  timeStopDurationMax: number;
  timeStopCycleReduced: number;
  lastCooldownMult: number;
  timeStopTickTimer: number;
  timeStopCount: number;
  timeStopTotalSeconds: number;
  timeGodSelectedAt: number;
  chronoWellCooldown: number;
  chronoWellSeq: number;
  chronoWells: ChronoWellEntity[];
  expiredChronoWellCaps: Array<{ id: number; stopCdReduced: number; expireAt: number }>;
  chronoWellKills: number;
  timeDebtDamageTotal: number;
  chronoLastLogMinute: number;
  rewindReady: boolean;
  rewindUsedCount: number;
  rewindChargeKills: number;
  rewindChargeTarget: number;
  rewindLockTimer: number;
  rewindVisualTimer: number;
  playerPosHistory: Array<{ t: number; x: number; y: number }>;
  playerPosSampleTimer: number;
  lastDamageFromReaper: boolean;
  chronoHudMotes: ChronoHudMote[];
  deathStacks: number;
  deathNovaCounter: number;
  necroMinions: NecroMinionEntity[];
  necroMinionSeq: number;
  necroSoulsCount: number;
  necroSoulBonusPct: number;
  necroShield: number;
  necroShieldTimer: number;
  necroSoulOrbs: NecroSoulOrb[];
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
  phoenixAvailable: boolean;
  phoenixHealPct: number;
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
  packVfx: PackVfxInstance[];
  castAnimTimer: number;
  castAnimCooldown: number;
  castFacingX: number;
  healSparkleTimer: number;
}

const TARGET_SECONDS = 30 * 60; // 30:00 full clock
const DASH_DURATION = 0.22;
const DASH_COOLDOWN = 2.4;
const DASH_SPEED = 600;
const VOID_INFUSION_COST = 24;
const VAMPIRE_BLOOD_MAX = 100;
const BAT_SWARM_DURATION = 1.5;
const BAT_SWARM_COOLDOWN = 6.5;
const ORC_RAGE_MAX = 100;
const ORC_WAR_CRY_COOLDOWN = 8.0;
const ORC_BERSERK_DURATION = 5.0;
const ORC_BERSERK_COOLDOWN = 20.0;
const SPELLBLADE_VOIDLESS_REQ = 5;
const VOIDLESS_KILLS_REQ = 100;
const VOIDLESS_DURATION = 10.0;
const VOIDLESS_COOLDOWN = 15.0;
const SPELLBLADE_CHARGE_TIME = 2.0;
const SPELLBLADE_CHARGE_COOLDOWN = 6.0; // 3s Focus Cooldown after discharge
const MAX_ELEMENT_ORBS_ON_MAP = 8;

const isSpellbladeClass = (cls: RaceClassId | null) =>
  cls === 'spellblade_god' || cls === 'voidless_blade';

interface SpellbladeSwordProfile {
  swingInterval: number;
  slashReach: number;
  arcHalfAngle: number;
  waveSpeed: number;
  waveLife: number;
  waveRadius: number;
  waveCount: number;
  waveSpread: number;
  damageMult: number;
  pierce: number;
  knockback: number;
}

const getSpellbladeSwordProfile = (el: ElementId | null): SpellbladeSwordProfile => {
  switch (el) {
    case 'fire':
      // Long-range twin flame waves, slower swing
      return {
        swingInterval: 1.18,
        slashReach: 90,
        arcHalfAngle: Math.PI * 0.36,
        waveSpeed: 510,
        waveLife: 1.38,
        waveRadius: 21,
        waveCount: 2,
        waveSpread: 0.2,
        damageMult: 0.92,
        pierce: 6,
        knockback: 75,
      };
    case 'water':
      // Wide medium-short frost crescent sweep
      return {
        swingInterval: 1.1,
        slashReach: 98,
        arcHalfAngle: Math.PI * 0.48,
        waveSpeed: 400,
        waveLife: 0.82,
        waveRadius: 24,
        waveCount: 2,
        waveSpread: 0.24,
        damageMult: 0.86,
        pierce: 5,
        knockback: 70,
      };
    case 'wind':
      // Rapid short cyclone slash
      return {
        swingInterval: 0.72,
        slashReach: 84,
        arcHalfAngle: Math.PI * 0.42,
        waveSpeed: 580,
        waveLife: 0.54,
        waveRadius: 15,
        waveCount: 1,
        waveSpread: 0,
        damageMult: 0.68,
        pierce: 4,
        knockback: 185,
      };
    case 'light':
      // Slow narrow ultra-long piercing light lance
      return {
        swingInterval: 1.26,
        slashReach: 114,
        arcHalfAngle: Math.PI * 0.28,
        waveSpeed: 640,
        waveLife: 1.25,
        waveRadius: 14,
        waveCount: 1,
        waveSpread: 0,
        damageMult: 0.95,
        pierce: 9,
        knockback: 65,
      };
    case 'dark':
      // Heavy slow gravity cleave
      return {
        swingInterval: 1.38,
        slashReach: 92,
        arcHalfAngle: Math.PI * 0.44,
        waveSpeed: 360,
        waveLife: 0.72,
        waveRadius: 21,
        waveCount: 1,
        waveSpread: 0,
        damageMult: 1.05,
        pierce: 5,
        knockback: 60,
      };
    case 'earth':
      // Short heavy tremor cleave
      return {
        swingInterval: 1.24,
        slashReach: 86,
        arcHalfAngle: Math.PI * 0.46,
        waveSpeed: 380,
        waveLife: 0.6,
        waveRadius: 25,
        waveCount: 1,
        waveSpread: 0,
        damageMult: 0.96,
        pierce: 5,
        knockback: 135,
      };
    case 'stone':
      // Thick high-pierce slab wave
      return {
        swingInterval: 1.32,
        slashReach: 92,
        arcHalfAngle: Math.PI * 0.4,
        waveSpeed: 420,
        waveLife: 0.88,
        waveRadius: 24,
        waveCount: 1,
        waveSpread: 0,
        damageMult: 1.02,
        pierce: 8,
        knockback: 120,
      };
    case 'blood':
      // Medium-fast crimson slash
      return {
        swingInterval: 0.92,
        slashReach: 94,
        arcHalfAngle: Math.PI * 0.44,
        waveSpeed: 460,
        waveLife: 0.76,
        waveRadius: 19,
        waveCount: 1,
        waveSpread: 0,
        damageMult: 0.84,
        pierce: 5,
        knockback: 70,
      };
    default:
      return {
        swingInterval: 1.05,
        slashReach: 92,
        arcHalfAngle: Math.PI * 0.4,
        waveSpeed: 440,
        waveLife: 0.75,
        waveRadius: 18,
        waveCount: 1,
        waveSpread: 0,
        damageMult: 0.8,
        pierce: 4,
        knockback: 75,
      };
  }
};

const applyPlayerHeal = (sim: SimState, rawAmount: number, allowOverflow = 0): number => {
  if (rawAmount <= 0) return 0;
  let effective = rawAmount * sim.cachedHealTakenFactor;
  if (sim.mapEvent === 'void_corruption') {
    effective *= 0.45;
  }
  if (sim.inPoisonSwamp) {
    effective *= 0.5;
  }
  // Vampire Lord: Daytime scorching sun halves healing from all sources
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
  // Vampire Lord Blood Shield: Overheal beyond Max HP converts to Blood Shield (max 25% Max HP)
  if (sim.raceClass === 'vampire_lord' && whole > actualHpGain && prevHp + whole > sim.player.maxHp) {
    const overheal = prevHp + whole - Math.max(sim.player.maxHp, prevHp);
    const shieldMax = sim.player.maxHp * 0.25;
    sim.vampireBloodShield = Math.min(shieldMax, sim.vampireBloodShield + overheal);
  }
  return actualHpGain;
};

// ฮีลประเภท "ดูดเลือด / ฮีลจากการฆ่า / ฮีลจากการตีโดน" ต้องผ่านฟังก์ชันนี้เท่านั้น
// รวมกันได้ไม่เกิน leechBudgetPctPerSec ของ Max HP ต่อวินาที (เวลาจริง)
const applyLeechHeal = (sim: SimState, rawAmount: number): number => {
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
  sim.leechWindowHealed = (sim.leechWindowHealed || 0) + Math.max(healed, canOverhealShield ? Math.min(amount, 1) : 0);
  return healed;
};

const spawnPaletteBurst = (
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
) => {
  const maxCap = opts?.force ? 420 : 320;
  if (sim.particles.length > maxCap) return;
  const baseRadius = opts?.radius ?? 3.1;
  const baseLife = opts?.life ?? 0.55;
  const drag = opts?.drag ?? 2.2;
  const zOffset = opts?.zOffset ?? 12;
  const glow = opts?.glow ?? true;
  const ringRatio = opts?.ringRatio ?? 0.1;

  for (let i = 0; i < count; i++) {
    const a = (opts?.angleOffset ?? 0) + (i / Math.max(1, count)) * Math.PI * 2 + (Math.random() - 0.5) * 0.45;
    const sp = speed * (0.45 + Math.random() * 0.72);
    const color = palette.colors[i % palette.colors.length];
    const secondaryColor = palette.colors[(i + 1) % palette.colors.length];
    const useRing = Math.random() < ringRatio;
    const shape: ParticleShape = useRing
      ? 'ring'
      : palette.shapes[i % palette.shapes.length];
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
};

const triggerWeaponEvolutionFeedback = (sim: SimState, weaponId: WeaponId) => {
  const wDef = WEAPONS[weaponId];
  const palette = getEvolvedWeaponPalette(weaponId);
  const px = sim.player.x;
  const py = sim.player.y;

  sim.groundFx.push({
    kind: 'shockwave',
    x: px,
    y: py,
    radius: 16,
    maxRadius: 155,
    life: 0.45,
    maxLife: 0.45,
    color: palette.primaryColor,
  });
  sim.groundFx.push({
    kind: 'warp',
    x: px,
    y: py,
    radius: 14,
    maxRadius: 120,
    life: 0.5,
    maxLife: 0.5,
    color: palette.secondaryColor,
  });

  spawnPaletteBurst(sim, px, py, palette, 34, 240, {
    radius: 4.2,
    life: 0.72,
    drag: 2.6,
    zOffset: 16,
    glow: true,
    force: true,
    ringRatio: 0.18,
  });

  sim.abilityFlashMax = Math.max(sim.abilityFlashMax, 0.24);
  sim.abilityFlash = Math.max(sim.abilityFlash, 0.24);
  sim.abilityFlashAlpha = Math.max(sim.abilityFlashAlpha, 0.24);
  sim.shakeMaxTime = Math.max(sim.shakeMaxTime, 0.18);
  sim.shakeTime = Math.max(sim.shakeTime, 0.18);
  sim.shakeIntensity = Math.max(sim.shakeIntensity, 4.8);

  sim.floatingTexts.push({
    x: px,
    y: py - 38,
    vy: -44,
    text: `ผสานร่าง! ${wDef.evolvedNameTh}!`,
    color: palette.primaryColor,
    life: 1.5,
    maxLife: 1.5,
    scale: 1.25,
  });

  sim.announcement = `ผสานร่างสำเร็จ! ${wDef.evolvedNameTh}`;
  sim.announcementTimer = 4;
  sound.playEvolution();
};

const triggerElementFusionFeedback = (
  sim: SimState,
  elements: ElementId[],
  fusionColor: string,
  isGrand = false
) => {
  const palette = getCombinedElementPalette(elements, fusionColor);
  const px = sim.player.x;
  const py = sim.player.y;
  const catalystColor = ELEMENTS[elements[elements.length - 1]]?.glowColor || palette.secondaryColor;

  sim.groundFx.push({
    kind: 'shockwave',
    x: px,
    y: py,
    radius: 16,
    maxRadius: isGrand ? 170 : 120,
    life: isGrand ? 0.42 : 0.34,
    maxLife: isGrand ? 0.42 : 0.34,
    color: fusionColor,
  });
  sim.groundFx.push({
    kind: 'warp',
    x: px,
    y: py,
    radius: 12,
    maxRadius: isGrand ? 130 : 92,
    life: 0.38,
    maxLife: 0.38,
    color: catalystColor,
  });

  spawnPaletteBurst(sim, px, py, palette, isGrand ? 36 : 26, isGrand ? 245 : 195, {
    radius: isGrand ? 4.3 : 3.5,
    life: isGrand ? 0.72 : 0.6,
    drag: 2.5,
    zOffset: 14,
    glow: true,
    force: true,
    ringRatio: 0.18,
  });
  sound.playEvolution();
};

const getClassGaugeMax = (cls: RaceClassId | null): number => {
  switch (cls) {
    case 'hunter':
      return 100;
    case 'saint':
    case 'knight':
    case 'vampire_lord':
    case 'seven_sins':
    case 'death_god':
      return 100;
    case 'demon_lord':
      return 150;
    default:
      return 0;
  }
};

const getClassGaugeMeta = (
  cls: RaceClassId | null
): { labelTh: string; color: string; ultTitleTh: string } => {
  switch (cls) {
    case 'hunter':
      return { labelTh: 'เจตนาสังหาร', color: '#34D399', ultTitleTh: 'ราตรีพันเงา' };
    case 'saint':
      return { labelTh: 'ศรัทธา', color: '#FDE047', ultTitleTh: 'ปฏิญาณแห่งสวรรค์' };
    case 'knight':
      return { labelTh: 'เกียรติยศ', color: '#38BDF8', ultTitleTh: 'เอ็กซ์แคลิเบอร์ลงทัณฑ์' };
    case 'demon_lord':
      return { labelTh: 'อเวจี', color: '#F97316', ultTitleTh: 'ประตูนรกเปิด' };
    case 'vampire_lord':
      return { labelTh: 'โลหิต (HP <50%)', color: '#FB7185', ultTitleTh: 'ราตรีโลหิตนิรันดร์' };
    case 'seven_sins':
      return { labelTh: 'พลังบาป', color: '#C084FC', ultTitleTh: 'พิธีบาปทั้งเจ็ด' };
    case 'death_god':
      return { labelTh: 'อำนาจเนโครแมนเซอร์', color: '#A855F7', ultTitleTh: 'Dominion of Eternal Fealty' };
    default:
      return { labelTh: '', color: '#FBBF24', ultTitleTh: '' };
  }
};

const getSinMaxSlots = (sim: SimState): number => (sim.ultAscended ? 4 : 3);

const buildSinEntity = (sim: SimState, sinId: SinId, level = 1, active = true): SinEntity => {
  const hpMult = sinId === 'greed' ? 0.6 : sinId === 'sloth' ? 2.0 : 1.2;
  const mHp = Math.max(40, Math.round(sim.player.maxHp * hpMult));
  const idx = SIN_ORDER.indexOf(sinId);
  const ang = (idx * Math.PI * 2) / 7;
  return {
    sinId,
    level,
    active,
    x: sim.player.x + Math.cos(ang) * 78,
    y: sim.player.y + Math.sin(ang) * 78,
    vx: 0,
    vy: 0,
    hp: mHp,
    maxHp: mHp,
    respawnTimer: 0,
    aiTimer: 0.4,
    wrathStacks: 0,
    wrathFrenzyTimer: 0,
    greedGoldBuffer: 0,
    slothAwake: false,
    tempSummonTimer: 0,
  };
};

const generateSinChoices = (sim: SimState, count: number): SinContractChoice[] => {
  const existingMap = new Map<SinId, SinEntity>();
  for (const s of sim.sins) existingMap.set(s.sinId, s);
  const pool: SinContractChoice[] = [];
  for (const id of SIN_ORDER) {
    const ex = existingMap.get(id);
    if (!ex) {
      pool.push({ sinId: id, nextLevel: 1, isNew: true });
    } else if (!ex.active) {
      // Returned sin can be re-summoned or upgraded
      pool.push({
        sinId: id,
        nextLevel: Math.min(3, ex.level + 1),
        isNew: false,
      });
    } else if (ex.level < 3) {
      pool.push({
        sinId: id,
        nextLevel: ex.level + 1,
        isNew: false,
      });
    }
  }
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, count);
};

const countAndPruneElementOrbs = (sim: SimState): number => {
  let count = 0;
  const px = sim.player.x;
  const py = sim.player.y;
  for (let i = sim.drops.length - 1; i >= 0; i--) {
    const d = sim.drops[i];
    if (d.kind === 'element_orb') {
      if (Math.hypot(d.x - px, d.y - py) > 920) {
        sim.drops.splice(i, 1);
      } else {
        count++;
      }
    }
  }
  return count;
};

export const GameCanvas = forwardRef<GameCanvasHandle, GameCanvasProps>(
  (
    {
      runId,
      screenState,
      raceId,
      stageId,
      starterWeapon,
      runPace,
      simSpeed,
      botMode,
      botTargetClass = 'auto',
      isDailyChallenge = false,
      saveData,
      onHudUpdate,
      onLevelUpDraft,
      onBossChestOpen,
      onArtifactChestOpen,
      onClassEvolutionPrompt,
      onSinContractOpen,
      onDiscoverFusion,
      onConsumePotion,
      onMapInteractionPrompt,
      onRunEnd,
    },
    ref
  ) => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const simRef = useRef<SimState | null>(null);

    const screenStateRef = useRef(screenState);
    const simSpeedRef = useRef(simSpeed);
    const botModeRef = useRef<BotMode>(botMode);
    const botTargetClassRef = useRef<RaceClassId | 'auto'>(botTargetClass);
    const runPaceRef = useRef(runPace);
    const isDailyChallengeRef = useRef(isDailyChallenge);
    const saveRef = useRef(saveData);

    screenStateRef.current = screenState;
    simSpeedRef.current = simSpeed;
    botModeRef.current = botMode;
    botTargetClassRef.current = botTargetClass;
    runPaceRef.current = runPace;
    isDailyChallengeRef.current = isDailyChallenge;
    saveRef.current = saveData;

    const callbacksRef = useRef({
      onHudUpdate,
      onLevelUpDraft,
      onBossChestOpen,
      onArtifactChestOpen,
      onClassEvolutionPrompt,
      onSinContractOpen,
      onDiscoverFusion,
      onConsumePotion,
      onMapInteractionPrompt,
      onRunEnd,
    });
    callbacksRef.current = {
      onHudUpdate,
      onLevelUpDraft,
      onBossChestOpen,
      onArtifactChestOpen,
      onClassEvolutionPrompt,
      onSinContractOpen,
      onDiscoverFusion,
      onConsumePotion,
      onMapInteractionPrompt,
      onRunEnd,
    };

    const keysRef = useRef<Set<string>>(new Set());
    const chargeReleaseQueuedRef = useRef<boolean>(false);
    const pointerDragRef = useRef<{
      active: boolean;
      startX: number;
      startY: number;
      currX: number;
      currY: number;
    }>({
      active: false,
      startX: 0,
      startY: 0,
      currX: 0,
      currY: 0,
    });
    const activeSkillRef = useRef<() => void>(() => {});

    const buildDraftOptions = (sim: SimState): DraftOptions => ({
      banishedKeys: sim.banishedKeys,
      fourthChoiceChance: (saveRef.current.upgrades.luck || 0) * 0.05,
      raceClass: sim.raceClass,
    });

    const computeTimeGodStopTiming = (cooldownMult: number) => {
      const cdr = Math.max(0, 1 - cooldownMult);
      // The World keeps a high base cooldown (32s, mild floor 25s) so Stasis Dome kills drive its acceleration
      let stopCooldown = Math.max(25, 32 * (1 - cdr * 0.4));
      const stopDuration = Math.min(4.2, 3.0 * (1 + cdr * 0.55));
      if (stopDuration / stopCooldown > 0.25) {
        stopCooldown = stopDuration / 0.25;
      }
      return { stopCooldown, stopDuration };
    };

    const buildBossChestOptions = (sim: SimState, greedMult: number): BossChestOptions => {
      const t = saveRef.current.talents;
      const fatePowder = sim.fatePowderActive;
      sim.fatePowderActive = false;
      const lateGoldMult = sim.elapsedSeconds > 1800 ? 0.5 : 1;
      return {
        extraItems: (t.row3?.branch === 'A' && t.row3.rank > 0 ? 1 : 0) + (fatePowder ? 2 : 0),
        bonusGoldMult: greedMult * (t.row3?.branch === 'A' && t.row3.rank >= 2 ? 1.4 : 1) * lateGoldMult,
        allowNoRelicEvolve: t.row6?.branch === 'A' && t.row6.rank > 0,
        allowEarlyEvolve: t.row6?.branch === 'B' && t.row6.rank > 0,
        elapsedMinutes: sim.elapsedSeconds / 60,
      };
    };

    const finalizeAndEmitRunEnd = (sim: SimState, victoryOverride?: boolean) => {
      if (sim.runEnded) return;
      sim.runEnded = true;
      sound.setTimeStopMuffled(false);
      const victory =
        victoryOverride !== undefined
          ? victoryOverride
          : sim.reaperSlainCount > 0 || sim.elapsedSeconds >= TARGET_SECONDS;
      const survivalGold =
        Math.floor(Math.min(1800, sim.elapsedSeconds) / 60) * 10 +
        Math.floor(Math.max(0, sim.elapsedSeconds - 1800) / 60) * 5;
      if (survivalGold > 0) {
        sim.goldEarned += survivalGold;
        sim.goldBreakdown.survival += survivalGold;
      }

      const extractedGear: ExtractedGearPreview[] = [];
      let lostChestsCount = 0;
      if (sim.pendingSealedChests > 0) {
        if (victory) {
          for (let c = 0; c < sim.pendingSealedChests; c++) {
            const defId = rollRandomGearDefId();
            const rarity = rollGearRarity(sim.cachedCurseLevel, sim.reaperSlainCount > 0);
            extractedGear.push({ defId, rarity, isDuplicate: false });
          }
        } else {
          lostChestsCount = sim.pendingSealedChests;
        }
      }

      const finalBiome = getActiveBiome(stageId, sim.realmTier, sim.biomeShiftCount);
      callbacksRef.current.onRunEnd({
        victory,
        reaperSlain: sim.reaperSlainCount > 0,
        reaperSlainCount: sim.reaperSlainCount,
        realmTier: sim.realmTier + 1,
        biomeNameTh: finalBiome.nameTh,
        raceId,
        raceClass: sim.raceClass,
        stageId,
        elapsedSeconds: sim.elapsedSeconds,
        level: sim.player.level,
        kills: sim.kills,
        bossesKilled: sim.bossesKilled,
        elitesKilled: sim.elitesKilled,
        goldEarned: sim.goldEarned,
        soulEssenceEarned: sim.soulEssenceEarned,
        sealMarksEarned: 0,
        goldBreakdown: { ...sim.goldBreakdown },
        pendingChestsCount: sim.pendingSealedChests,
        extractedGear,
        lostChestsCount,
        completedInRunQuests: sim.inRunQuests.map((q) => ({ ...q })),
        maxCombo: sim.comboBest || 0,
        curseLevel: sim.cachedCurseLevel,
        deathCauseTh: victory ? 'พิชิตสมรภูมิสำเร็จ' : sim.lastDamageSourceTh || 'ฝูงอสูร',
        isDailyChallenge: isDailyChallengeRef.current,
        dailyChallengeWon: isDailyChallengeRef.current && victory && sim.cachedCurseLevel >= 3,
        runKillsByKind: { ...sim.runKillsByKind },
        runBananaKills: sim.runBananaKills,
        runFireBurnKills: sim.runFireBurnKills,
        runKnightParries: sim.knightParryCount,
        runDefeatedBossKinds: [...sim.runDefeatedBossKinds],
        mageFusionCount: sim.mageFusionCount,
        weapons: sim.weapons.map((wp) => ({ ...wp })),
        relics: sim.relics.map((rl) => ({ ...rl })),
        artifacts: { ...sim.artifacts },
      });
    };

    const computeStats = (sim: SimState) => {
      const race = RACES[raceId];
      const upg = saveRef.current.upgrades;

      // Day/Night cycle: 45s Night, 45s Day (freezes at Night during Vampire Lord Ultimate!)
      const cyclePos = sim.dayNightElapsed % 90;
      const isNight =
        (sim.raceClass === 'vampire_lord' && sim.ultActiveTimer > 0) || cyclePos < 45;
      const dayNightProgress =
        sim.raceClass === 'vampire_lord' && sim.ultActiveTimer > 0 ? 0.5 : (cyclePos % 45) / 45;

      let speedMult = 1 + upg.speed * 0.04;
      // ตัวคูณแท้ (เผ่า/Voidless) ยังคูณกันตามเดิม
      let damageMult = race.baseDamageMult;
      // โบนัส % ทั่วไปทั้งหมด บวกรวมกันในกลุ่มเดียว แล้วค่อยผ่าน diminishing returns ตอนท้าย
      let dmgIncrease = upg.might * 0.04;
      let armor = race.baseArmor + upg.armor;
      let cooldownMult = Math.max(0.45, 1 - upg.cooldown * 0.03);
      let areaMult = 1;
      let projSpeedMult = 1;
      let maxHpBonus = upg.maxHp * 10 + sim.orcLevelHpBonus;

      if (race.dayNightSensitive) {
        if (isNight) {
          speedMult *= 1.35;
          damageMult *= 1.45;
        } else {
          speedMult *= 0.75;
          damageMult *= 0.7;
        }
      }

      if (sim.raceClass === 'hunter') {
        speedMult *= 1.2;
      } else if (sim.raceClass === 'saint') {
        maxHpBonus += 45;
        areaMult *= 1.15;
      } else if (sim.raceClass === 'knight') {
        armor += 7 + sim.knightAegisBonus;
        if (sim.ultActiveTimer > 0) armor += 10;
        maxHpBonus += 90;
        dmgIncrease += 0.25;
      } else if (sim.raceClass === 'demon_lord') {
        dmgIncrease += 0.22;
        maxHpBonus += 35;
      } else if (sim.raceClass === 'vampire_lord') {
        speedMult *= 1.15;
        const missingRatio = Math.max(
          0,
          (sim.player.maxHp - sim.player.hp) / Math.max(1, sim.player.maxHp)
        );
        const rawSteps = Math.floor(missingRatio / 0.1) + (sim.ultAscended ? 1 : 0);
        const dayBloodlustMult = isNight ? 1.0 : 1.5;
        dmgIncrease += rawSteps * 0.05 * dayBloodlustMult;
        speedMult *= 1 + rawSteps * 0.03 * dayBloodlustMult;
      } else if (sim.raceClass === 'seven_sins') {
        maxHpBonus += 30;
        const slothActive = sim.sins.some(
          (s) => s.sinId === 'sloth' && (s.active || s.tempSummonTimer > 0 || sim.ultActiveTimer > 0) && s.hp > 0
        );
        if (slothActive) speedMult *= 0.95;
        const wrathEnt = sim.sins.find(
          (s) => s.sinId === 'wrath' && (s.active || s.tempSummonTimer > 0 || sim.ultActiveTimer > 0)
        );
        if (wrathEnt && wrathEnt.wrathStacks > 0) {
          dmgIncrease += wrathEnt.wrathStacks * 0.08;
        }
      } else if (sim.raceClass === 'time_god') {
        cooldownMult *= 0.9;
        maxHpBonus -= Math.round(race.baseHp * 0.1);
        if (sim.timeStopTimer > 0) dmgIncrease += 0.15;
      } else if (sim.raceClass === 'death_god') {
        maxHpBonus -= Math.round(race.baseHp * 0.15);
        dmgIncrease += Math.min(NECRO_SOUL_CAP_PCT / 100, sim.necroSoulBonusPct / 100);
        let fealtyAliveCount = 0;
        for (let mi = 0; mi < sim.necroMinions.length; mi++) {
          const m = sim.necroMinions[mi];
          if (m.hp > 0 && m.fealtyBuffed) fealtyAliveCount += 1;
        }
        if (fealtyAliveCount > 0) {
          speedMult *= 1 + fealtyAliveCount * 0.002;
        }
      } else if (sim.raceClass === 'spellblade_god') {
        armor += 4;
        maxHpBonus += 30;
        speedMult *= 1.14;
      } else if (sim.raceClass === 'voidless_blade') {
        armor += 6;
        maxHpBonus += 55;
        speedMult *= 1.16;
        dmgIncrease += 0.08;
      }

      if (sim.voidlessTimer > 0) {
        damageMult *= 1.55;
        speedMult *= 1.15;
        cooldownMult *= 0.8;
      }

      // Spellblade God & Voidless Blade: Normal mode wields ONE active sword element at a time;
      // Voidless Ascension mode awakens all 5 core elements together!
      const spellbladeElements: ElementId[] = [];
      if (isSpellbladeClass(sim.raceClass)) {
        if (sim.voidlessTimer > 0) {
          spellbladeElements.push('fire', 'water', 'light', 'dark', 'wind');
        } else {
          const singleEl =
            sim.spellbladeActiveElement ||
            (sim.heldElements.length > 0 ? sim.heldElements[sim.heldElements.length - 1] : null) ||
            (sim.activeFusions.length > 0
              ? sim.activeFusions[sim.activeFusions.length - 1].catalyst
              : null);
          if (singleEl) {
            spellbladeElements.push(singleEl);
          }
        }
      }

      const spellbladeBuffs = {
        elements: spellbladeElements,
        dmgBonus: 0,
        reachBonus: 0,
        chargeRateBonus: 0,
        speedBonus: 0,
        armorBonus: 0,
        kbMult: 1,
        freezeSec: 0,
        manaLeech: 0,
        hpLeech: 0,
        fireBlast: false,
      };
      if (isSpellbladeClass(sim.raceClass)) {
        if (sim.voidlessTimer > 0) {
          // Balanced non-stacking Voidless Ascension bonus
          spellbladeBuffs.dmgBonus = 0.14;
          spellbladeBuffs.reachBonus = 0.1;
          spellbladeBuffs.speedBonus = 0.06;
          spellbladeBuffs.armorBonus = 2;
          spellbladeBuffs.kbMult = 1.3;
          spellbladeBuffs.freezeSec = 1.6;
          spellbladeBuffs.manaLeech = 2;
          spellbladeBuffs.hpLeech = 1;
          spellbladeBuffs.fireBlast = true;
        } else if (spellbladeElements.length === 1) {
          const el = spellbladeElements[0];
          if (el === 'fire' || el === 'light') {
            spellbladeBuffs.dmgBonus += 0.1;
            spellbladeBuffs.reachBonus += 0.06;
            if (el === 'fire') spellbladeBuffs.fireBlast = true;
          } else if (el === 'wind') {
            spellbladeBuffs.chargeRateBonus += 0.15;
            spellbladeBuffs.speedBonus += 0.06;
            spellbladeBuffs.kbMult += 0.45;
          } else if (el === 'water') {
            spellbladeBuffs.freezeSec = 1.6;
            spellbladeBuffs.manaLeech += 1;
          } else if (el === 'earth' || el === 'stone') {
            spellbladeBuffs.armorBonus += 2;
            spellbladeBuffs.kbMult += 0.25;
          } else if (el === 'dark' || el === 'blood') {
            spellbladeBuffs.hpLeech += 1;
            spellbladeBuffs.dmgBonus += 0.08;
          }
        }
        dmgIncrease += spellbladeBuffs.dmgBonus;
        speedMult *= 1 + spellbladeBuffs.speedBonus;
        armor += spellbladeBuffs.armorBonus;
        areaMult *= 1 + spellbladeBuffs.reachBonus;
      }

      if (sim.weather === 'blood_rain') {
        dmgIncrease += 0.15;
      }

      // Mage Arcane Perks scaling (nerfed for balanced glass-cannon pacing)
      const mpPool = sim.magePerks.mana_pool || 0;
      const mpFlow = sim.magePerks.mana_flow || 0;
      const mpMight = sim.magePerks.element_might || 0;
      const mpArea = sim.magePerks.spell_area || 0;
      const mpOrb = sim.magePerks.orb_magnet || 0;
      const mpBarrier = sim.magePerks.mana_barrier || 0;

      if (race.usesElements) {
        dmgIncrease += Math.min(mpMight, BALANCE.magePerkMightMaxRanks) * 0.14;
        cooldownMult *= Math.max(0.62, 1 - mpFlow * 0.07);
        areaMult *= 1 + mpArea * 0.1;
        maxHpBonus += mpBarrier * 14;
        armor += mpBarrier * 1;
      }

      for (const r of sim.relics) {
        if (r.id === 'spinach') dmgIncrease += r.level * 0.15;
        if (r.id === 'boots') {
          speedMult *= 1 + r.level * 0.12;
          projSpeedMult *= 1 + r.level * 0.15;
        }
        if (r.id === 'armor_plate') {
          armor += r.level * 2;
          maxHpBonus += r.level * 25;
        }
        if (r.id === 'chronos') {
          cooldownMult *= Math.max(0.55, 1 - r.level * 0.1);
          areaMult *= 1 + r.level * 0.12;
        }
      }

      // Universal Global Map Event Hero Modifiers (applies to ALL races!)
      if (sim.mapEvent === 'swift_winds') {
        speedMult *= 1.18;
        cooldownMult *= 0.82;
      } else if (sim.mapEvent === 'gravity_well') {
        speedMult *= 0.84;
      }

      // M2-M6 Map System Modifiers (High Ground, Water Puddle, Speed Potion, Statue, God Blessings, Grave Hand)
      if (sim.onHighGround) {
        dmgIncrease += 0.1;
        areaMult *= 1.15;
      }
      if (sim.inWaterPuddle) {
        speedMult *= 0.9;
      }
      if (sim.speedPotionTimer > 0) {
        speedMult *= 1.35;
      }
      if (sim.graveSlowTimer > 0) {
        speedMult *= 0.55;
      }
      if (sim.statueEffect && sim.statueEffect.kind === 'blessing' && sim.statueEffect.remaining > 0) {
        dmgIncrease += 0.2;
      }
      if (sim.godBlessings.areaBonus > 0) {
        areaMult *= 1 + sim.godBlessings.areaBonus;
      }
      if (sim.godBlessings.cdrBonus > 0) {
        cooldownMult *= Math.max(0.55, 1 - sim.godBlessings.cdrBonus);
      }

      // 5-Slot Artifact Modifiers & Trade-Offs
      let critChance = 0.05 + (sim.raceClass === 'hunter' ? 0.2 : 0);
      let critDamageMult = 1.6 + (sim.raceClass === 'hunter' ? 0.5 : 0);
      let xpGainMult = 1.0;
      let goldGainBonus = 0;
      let doubleLootLuckChance = 0;
      let artDamageMult = 1.0;
      let artCooldownFactor = 1.0;
      let maxHpFactor = sim.raceClass === 'hunter' ? 0.8 : 1.0;
      let lifestealPct = 0;
      let regenPctPer2Sec = 0;
      let healTakenFactor = 1.0;
      let magnetArtifactMult = 1.0;
      let manaMaxBonus = 0;
      let manaRegenMult = 1.0;
      let damageTakenMult = 1.0;
      let bulletDamageTakenMult = 1.0;
      let slowDebuffFactor = 1.0;
      let dashCooldownFactor = 1.0;
      let phaseSmallMonsters = false;
      let thornBurstOnHit = false;
      let extraInvulnOnHit = 0;
      let ramKnockbackOnMove = false;

      for (const artId of Object.values(sim.artifacts)) {
        if (!artId) continue;
        const art = ARTIFACTS[artId];
        if (!art) continue;
        if (art.critChanceBonus) critChance += art.critChanceBonus;
        if (art.critDamageBonus) critDamageMult += art.critDamageBonus;
        if (art.xpGainBonus) xpGainMult += art.xpGainBonus;
        if (art.goldGainBonus) goldGainBonus += art.goldGainBonus;
        if (art.doubleLootLuckChance) doubleLootLuckChance += art.doubleLootLuckChance;
        if (art.damageMultBonus) artDamageMult += art.damageMultBonus;
        if (art.damagePerLevelBonus)
          artDamageMult += Math.min(
            BALANCE.damagePerLevelCap,
            art.damagePerLevelBonus * sim.player.level
          );
        if (art.lowHpDamageBonus && sim.player.hp <= sim.player.maxHp * 0.5) {
          artDamageMult += art.lowHpDamageBonus;
        }
        if (art.cooldownMultFactor) artCooldownFactor *= art.cooldownMultFactor;
        if (art.areaMultBonus) areaMult += art.areaMultBonus;
        if (art.projSpeedBonus) projSpeedMult += art.projSpeedBonus;
        if (art.speedMultBonus) speedMult += art.speedMultBonus;
        if (art.dashCooldownFactor) dashCooldownFactor *= art.dashCooldownFactor;
        if (art.maxHpMultFactor) maxHpFactor *= art.maxHpMultFactor;
        if (art.armorBonus) armor += art.armorBonus;
        if (art.lifestealPerLevel) lifestealPct += art.lifestealPerLevel * sim.player.level;
        if (art.regenPctPer2Sec) regenPctPer2Sec += art.regenPctPer2Sec;
        if (art.healTakenFactor) healTakenFactor *= art.healTakenFactor;
        if (art.magnetBonusPct) magnetArtifactMult += art.magnetBonusPct;
        if (art.manaMaxBonus) manaMaxBonus += art.manaMaxBonus;
        if (art.manaRegenMultBonus) manaRegenMult += art.manaRegenMultBonus;
        if (art.damageTakenMult) damageTakenMult *= art.damageTakenMult;
        if (art.bulletDamageTakenMult) bulletDamageTakenMult *= art.bulletDamageTakenMult;
        if (art.slowDebuffFactor) slowDebuffFactor *= art.slowDebuffFactor;
        if (art.phaseSmallMonsters) phaseSmallMonsters = true;
        if (art.thornBurstOnHit) thornBurstOnHit = true;
        if (art.extraInvulnOnHit) extraInvulnOnHit += art.extraInvulnOnHit;
        if (art.ramKnockbackOnMove) ramKnockbackOnMove = true;
      }

      if (sim.batSwarmTimer > 0) {
        speedMult *= 1.4;
        phaseSmallMonsters = true;
      }

      if (sim.orcBerserkTimer > 0) {
        speedMult *= 1.25;
        cooldownMult *= 0.85;
      }

      if (sim.weather === 'acid_rain') {
        armor = Math.max(0, armor - 4);
      }

      // Seven Sins Drawbacks: Pride (+10% dmg taken), Gluttony (-20% non-Sin healing)
      if (sim.raceClass === 'seven_sins') {
        const prideActive = sim.sins.some(
          (s) => s.sinId === 'pride' && (s.active || s.tempSummonTimer > 0 || sim.ultActiveTimer > 0) && s.hp > 0
        );
        if (prideActive) damageTakenMult *= 1.1;
        const gluttonyActive = sim.sins.some(
          (s) => s.sinId === 'gluttony' && (s.active || s.tempSummonTimer > 0 || sim.ultActiveTimer > 0) && s.hp > 0
        );
        if (gluttonyActive) healTakenFactor *= 0.8;
      }

      // Saint Sanctuary Zone: inside circle gets -20% weapon CD & faster regen
      for (const sz of sim.sanctuaryZones) {
        if (Math.hypot(sim.player.x - sz.x, sim.player.y - sz.y) <= sz.radius) {
          cooldownMult *= 0.8;
          regenPctPer2Sec += 0.012;
          break;
        }
      }

      let hourglassFreeze = false;
      let lightningCrownChance = 0;
      let shadowRing = false;

      // Apply Equipped Permanent Gear from Blacksmith
      const eqGear = saveRef.current.equippedGear;
      const gearInv = saveRef.current.gearInventory;
      for (const uid of Object.values(eqGear)) {
        if (!uid) continue;
        const gItem = gearInv.find((it) => it.uid === uid);
        if (!gItem) continue;
        const gDef = PERMANENT_GEAR_CATALOG[gItem.defId];
        if (!gDef) continue;
        const gVal = getGearItemEffectiveValue(gItem);
        switch (gDef.effectKind) {
          case 'fury_fang':
            dmgIncrease += gVal / 100;
            cooldownMult *= Math.max(0.72, 1 - (gVal / 100) * 0.7);
            break;
          case 'eclipse_crown':
            dmgIncrease += gVal / 100;
            areaMult += gVal / 100;
            break;
          case 'greedy_blade':
            maxHpFactor *= 0.9;
            break;
          case 'vampiric_edge':
            lifestealPct += gVal / 100;
            break;
          case 'thorn_reflect':
            thornBurstOnHit = true;
            break;
          case 'vital_plate':
            maxHpBonus += Math.round(gVal);
            armor += 1 + Math.floor(gItem.enhanceLevel / 3);
            break;
          case 'frost_mantle':
            damageTakenMult *= Math.max(0.65, 1 - gVal / 100);
            break;
          case 'guardian_ward':
            armor += Math.round(gVal);
            extraInvulnOnHit += 0.22;
            break;
          case 'swift_signet':
            speedMult += gVal / 100;
            critChance += 0.04 + gItem.enhanceLevel * 0.006;
            break;
          case 'gold_ring':
            goldGainBonus += gVal / 100;
            magnetArtifactMult += 0.15;
            break;
          case 'luck_clover':
            doubleLootLuckChance += gVal / 100;
            critChance += gVal / 100;
            break;
          case 'mana_sigil':
            manaRegenMult += gVal / 100;
            cooldownMult *= 0.96;
            break;
          case 'soul_charm':
            xpGainMult += gVal / 100;
            break;
          case 'shadow_dash_bomb':
            shadowRing = true;
            break;
          case 'hourglass_freeze':
            hourglassFreeze = true;
            break;
          case 'lightning_crit':
            lightningCrownChance += gVal / 100;
            break;
          default:
            break;
        }
      }

      // Dark Moon Altar Talents + Curse Gate Modifiers
      const t = saveRef.current.talents;
      if (t.row2?.branch === 'B' && t.row2.rank > 0) {
        dashCooldownFactor *= Math.max(0.7, 1 - t.row2.rank * 0.1);
      }
      if (t.row3?.branch === 'B' && t.row3.rank > 0) {
        magnetArtifactMult *= t.row3.rank >= 2 ? 1.5 : 1.3;
      }
      const curseLevel = computeCurseLevel(saveRef.current.activeCurses);
      const cursedHealRank = saveRef.current.activeCurses.cursed_heal || 0;
      if (cursedHealRank > 0) {
        healTakenFactor *= Math.max(0.25, 1 - cursedHealRank * 0.15);
      }
      const curseGoldBonusMult =
        curseLevel > 0 && t.row5?.branch === 'A' && t.row5.rank > 0 ? 1 + t.row5.rank * 0.1 : 1;

      if (sim.xpDoubleTimer > 0) {
        xpGainMult *= 2;
      }

      const critChanceCap = sim.raceClass === 'hunter' ? 0.75 : BALANCE.critChanceCap;
      const critDamageCap =
        sim.raceClass === 'hunter'
          ? Math.max(2.8, BALANCE.critDamageCap + 0.3)
          : BALANCE.critDamageCap;
      critChance = Math.max(0, Math.min(critChanceCap, critChance));
      critDamageMult = Math.max(1.2, Math.min(critDamageCap, critDamageMult));
      lifestealPct = Math.min(BALANCE.lifestealCap, lifestealPct);
      xpGainMult = Math.max(0.25, xpGainMult);
      speedMult = Math.max(0.45, speedMult);
      areaMult = Math.max(0.55, areaMult);
      // รวมโบนัส % ทั้งหมดเข้ากลุ่มบวก แล้วใส่ diminishing returns: X*K/(X+K)
      const rawDmgIncrease = dmgIncrease + (artDamageMult - 1);
      const K = BALANCE.dmgIncreaseSoftCapK;
      const effDmgIncrease =
        rawDmgIncrease > 0 ? (rawDmgIncrease * K) / (rawDmgIncrease + K) : rawDmgIncrease;
      const baseDamageMult = damageMult;
      damageMult = Math.max(0.25, baseDamageMult * Math.max(0.25, 1 + effDmgIncrease));
      cooldownMult = Math.max(BALANCE.cooldownFloor, cooldownMult * artCooldownFactor);

      sim.cachedCritChance = critChance;
      sim.cachedCritDamageMult = critDamageMult;
      sim.cachedLifestealPct = lifestealPct;
      sim.cachedHealTakenFactor = healTakenFactor;
      sim.cachedSlowDebuffFactor = slowDebuffFactor;
      sim.cachedDashCooldownFactor = dashCooldownFactor;
      sim.cachedThornBurstOnHit = thornBurstOnHit;
      sim.cachedExtraInvulnOnHit = extraInvulnOnHit;
      sim.cachedRawDmgIncrease = rawDmgIncrease;
      sim.cachedBaseDamageMult = baseDamageMult;
      sim.cachedCurseLevel = curseLevel;
      sim.cachedHourglassFreeze = hourglassFreeze;
      sim.cachedLightningCrownChance = lightningCrownChance;
      sim.cachedShadowRing = shadowRing;

      const baseTargetMaxHp = Math.max(25, Math.round((race.baseHp + maxHpBonus) * maxHpFactor));
      const reaperCurseMult =
        sim.reaperCurseStacks > 0 ? Math.max(0.1, 1 - sim.reaperCurseStacks * 0.01) : 1;
      const targetMaxHp = Math.max(1, Math.round(baseTargetMaxHp * reaperCurseMult));
      if (sim.player.maxHp !== targetMaxHp) {
        const diff = targetMaxHp - sim.player.maxHp;
        sim.player.maxHp = targetMaxHp;
        if (diff > 0) sim.player.hp = Math.min(targetMaxHp, sim.player.hp + diff);
        else sim.player.hp = Math.min(targetMaxHp, sim.player.hp);
      }

      const maxMana = Math.max(40, Math.round(100 + (sim.player.level - 1) * 3 + mpPool * 16 + manaMaxBonus));
      sim.maxMana = maxMana;
      sim.mana = Math.min(maxMana, sim.mana);
      const deathManaBonus =
        sim.raceClass === 'death_god' ? Math.min(2.4, 0.4 + sim.necroSoulBonusPct * 0.025) : 0;
      const timeManaBonus = sim.raceClass === 'time_god' ? 1.0 : 0;
      const manaRegen = (3.6 + mpPool * 0.8 + timeManaBonus + deathManaBonus) * manaRegenMult;
      sim.manaRegen = manaRegen;
      const manaCostMult =
        Math.max(0.56, 1 - mpFlow * 0.08) * (isSpellbladeClass(sim.raceClass) ? 0.85 : 1);
      const orbManaGain = 7 + mpOrb * 3;
      const fusionDurationBonus = mpArea * 1.8;
      const fusionMaxCooldown = Math.max(
        2.6,
        (isSpellbladeClass(sim.raceClass) ? 4.2 : 4.8) * Math.max(0.52, cooldownMult)
      );

      const moveSpeed = race.baseSpeed * speedMult;
      const magnetRadius =
        (race.baseMagnet +
          upg.magnet * 20 +
          mpOrb * 28 +
          (isSpellbladeClass(sim.raceClass) ? 28 : 0)) *
        magnetArtifactMult *
        (sim.mapEvent === 'gold_fever' ? 1.45 : 1);
      const greedMult =
        (1 + upg.greed * 0.08 + goldGainBonus) *
        STAGES[stageId].goldMult *
        (1 + curseLevel * 0.1) *
        curseGoldBonusMult *
        (sim.goldDoubleTimer > 0 ? 2 : 1) *
        (sim.statueEffect && sim.statueEffect.kind === 'curse' && sim.statueEffect.remaining > 0 ? 2 : 1) *
        (sim.mapEvent === 'gold_fever'
          ? 2.0
          : sim.mapEvent === 'void_corruption'
            ? 1.35
            : sim.mapEvent === 'blood_curse'
              ? 1.3
              : 1);

      return {
        isNight,
        dayNightProgress,
        spellbladeBuffs,
        damageMult,
        moveSpeed,
        armor,
        cooldownMult,
        areaMult,
        projSpeedMult,
        magnetRadius,
        greedMult,
        maxMana,
        manaRegen,
        manaCostMult,
        orbManaGain,
        fusionDurationBonus,
        fusionMaxCooldown,
        critChance,
        critDamageMult,
        xpGainMult,
        doubleLootLuckChance,
        lifestealPct,
        regenPctPer2Sec,
        damageTakenMult,
        bulletDamageTakenMult,
        slowDebuffFactor,
        dashCooldownFactor,
        phaseSmallMonsters,
        ramKnockbackOnMove,
        classSkillPower: 1,
      };
    };

    // Shared modal / choice application helpers (used by both manual UI and Full Bot)
    const applyDraftChoiceToSim = (sim: SimState, choice: DraftChoice) => {
      if (choice.kind === 'weapon') {
        const existing = sim.weapons.find((w) => w.id === choice.weaponId);
        if (existing) {
          existing.level = choice.nextLevel;
          if (choice.isEvolve) existing.evolved = true;
        } else {
          sim.weapons.push({
            id: choice.weaponId,
            level: 1,
            evolved: false,
            cooldownTimer: 0,
            totalDamage: 0,
          });
        }
        if (choice.isEvolve) {
          triggerWeaponEvolutionFeedback(sim, choice.weaponId);
        }
      } else if (choice.kind === 'relic') {
        const existing = sim.relics.find((r) => r.id === choice.relicId);
        if (existing) {
          existing.level = choice.nextLevel;
        } else {
          sim.relics.push({ id: choice.relicId, level: 1 });
        }
      } else if (choice.kind === 'mage_perk') {
        sim.magePerks[choice.perkId] = choice.nextRank;
        if (choice.perkId === 'mana_pool') {
          sim.mana = Math.min(sim.maxMana + 16, sim.mana + 16);
        } else if (choice.perkId === 'mana_barrier') {
          applyPlayerHeal(sim, 12, 14);
        }
      } else if (choice.kind === 'consumable') {
        const lateGoldMult = sim.elapsedSeconds > 1800 ? 0.5 : 1;
        sim.goldEarned += Math.max(1, Math.round(choice.goldAmount * lateGoldMult));
        applyPlayerHeal(sim, choice.healAmount);
      }

      computeStats(sim);
    };

    const applyBossChestToSim = (sim: SimState, reward: BossChestReward) => {
      sim.goldEarned += reward.bonusGold;
      const evolvedIds: WeaponId[] = [];

      for (const choice of reward.items) {
        if (choice.kind === 'weapon') {
          const existing = sim.weapons.find((w) => w.id === choice.weaponId);
          if (existing) {
            existing.level = choice.nextLevel;
            if (choice.isEvolve) {
              existing.evolved = true;
              evolvedIds.push(choice.weaponId);
            }
          } else {
            sim.weapons.push({
              id: choice.weaponId,
              level: 1,
              evolved: false,
              cooldownTimer: 0,
              totalDamage: 0,
            });
          }
        } else if (choice.kind === 'relic') {
          const existing = sim.relics.find((r) => r.id === choice.relicId);
          if (existing) {
            existing.level = choice.nextLevel;
          } else {
            sim.relics.push({ id: choice.relicId, level: 1 });
          }
        } else if (choice.kind === 'mage_perk') {
          sim.magePerks[choice.perkId] = choice.nextRank;
        } else if (choice.kind === 'consumable') {
          const lateGoldMult = sim.elapsedSeconds > 1800 ? 0.5 : 1;
          sim.goldEarned += Math.max(1, Math.round(choice.goldAmount * lateGoldMult));
          applyPlayerHeal(sim, choice.healAmount);
        }
      }

      for (const evId of evolvedIds) {
        triggerWeaponEvolutionFeedback(sim, evId);
      }

      if (RACES[raceId].usesElements) {
        computeStats(sim);
        sim.mana = sim.maxMana;
      } else {
        computeStats(sim);
      }
    };

    const applyArtifactChoiceToSim = (sim: SimState, artifactId: ArtifactId | null) => {
      if (!artifactId) {
        const skipGold = sim.elapsedSeconds > 1800 ? 23 : 45;
        sim.goldEarned += skipGold;
        const healed = applyPlayerHeal(sim, 25);
        sim.floatingTexts.push({
          x: sim.player.x,
          y: sim.player.y - 26,
          vy: -42,
          text: `+${skipGold} ทอง · +${healed} HP`,
          color: '#FBBF24',
          life: 0.9,
          maxLife: 0.9,
          scale: 1.05,
        });
        return;
      }
      const def = ARTIFACTS[artifactId];
      if (!def) return;
      const prevId = sim.artifacts[def.slot];
      sim.artifacts = { ...sim.artifacts, [def.slot]: artifactId };
      computeStats(sim);
      sound.playLevelUp();
      sim.floatingTexts.push({
        x: sim.player.x,
        y: sim.player.y - 30,
        vy: -42,
        text: `สวมใส่ ${def.nameTh}!`,
        color: def.color,
        life: 1.0,
        maxLife: 1.0,
        scale: 1.15,
      });
      sim.announcement = prevId
        ? `เปลี่ยน Artifact [${def.slot === 'helmet' ? 'หมวก' : def.slot === 'necklace' ? 'สร้อย' : def.slot === 'armor' ? 'ชุด' : def.slot === 'boots' ? 'รองเท้า' : 'แหวน'}]: ${ARTIFACTS[prevId].nameTh} → ${def.nameTh}`
        : `สวมใส่ Artifact ใหม่: ${def.nameTh}`;
      sim.announcementTimer = 3.8;
    };

    const applySinContractToSim = (sim: SimState, sinId: SinId, banishSinId?: SinId) => {
      if (banishSinId) {
        const old = sim.sins.find((s) => s.sinId === banishSinId);
        if (old) old.active = false;
      }
      const existing = sim.sins.find((s) => s.sinId === sinId);
      if (existing) {
        existing.active = true;
        existing.level = Math.min(3, existing.level + 1);
        existing.respawnTimer = 0;
        const hpMult = sinId === 'greed' ? 0.6 : sinId === 'sloth' ? 2.0 : 1.2;
        existing.maxHp = Math.max(40, Math.round(sim.player.maxHp * hpMult));
        existing.hp = existing.maxHp;
        existing.x = sim.player.x + 56;
        existing.y = sim.player.y;
      } else {
        sim.sins.push(buildSinEntity(sim, sinId, 1, true));
      }
      const sinDef = SEVEN_SINS[sinId];
      sim.groundFx.push({
        kind: 'warp',
        x: sim.player.x,
        y: sim.player.y,
        radius: 16,
        maxRadius: 110,
        life: 0.45,
        maxLife: 0.45,
        color: sinDef.color,
      });
      sim.announcement = `ทำสัญญาบาป: ${sinDef.sinNameTh} — ${sinDef.demonNameTh}`;
      sim.announcementTimer = 3.8;
      sound.playLevelUp();
      // Check Ascension: Sovereign of the Eighth Sin when all 7 Sins have been contracted in run
      if (!sim.ultAscended && sim.sins.length >= 7) {
        sim.ultAscended = true;
        sim.announcement = 'จุติ! ราชาแห่งบาปที่แปด (Sovereign of the Eighth Sin) — สัญญาสูงสุด 4 ตน!';
        sim.announcementTimer = 5.0;
        sound.playBossChest();
      }
      computeStats(sim);
    };

    const resolveMapInteractionToSim = (sim: SimState, result: MapInteractionResult) => {
      const grantRandomUpgrade = (): string => {
        if (RACES[raceId].usesElements) {
          const perkIds: MagePerkId[] = [
            'mana_pool',
            'mana_flow',
            'element_might',
            'spell_area',
            'orb_magnet',
            'mana_barrier',
          ];
          const pid = perkIds[Math.floor(Math.random() * perkIds.length)];
          sim.magePerks[pid] = (sim.magePerks[pid] || 0) + 1;
          return `${MAGE_PERKS[pid].nameTh} +1`;
        }
        if (sim.weapons.length > 0) {
          const pool = sim.weapons.filter((w) => w.level < 6);
          const target = (pool.length > 0 ? pool : sim.weapons)[
            Math.floor(Math.random() * (pool.length > 0 ? pool.length : sim.weapons.length))
          ];
          target.level = Math.min(8, target.level + 1);
          return `${WEAPONS[target.id].nameTh} Lv.${target.level}`;
        }
        return 'พลังโจมตี +1';
      };

      if (result.kind === 'cursed_statue') {
        const lm = sim.landmarks.find((l) => l.id === result.landmarkId);
        const sx = lm?.x ?? sim.player.x;
        const sy = lm?.y ?? sim.player.y;
        if (result.choice === 'blessing') {
          if (lm) lm.used = true;
          sim.statueEffect = { kind: 'blessing', remaining: 180 };
          sim.groundFx.push({
            kind: 'vfx',
            vfxId: 'holy_sigil',
            x: sx,
            y: sy,
            radius: 85,
            maxRadius: 85,
            dw: 185,
            dh: Math.round(185 * (VFX_SHEETS.holy_sigil.cellH / VFX_SHEETS.holy_sigil.cellW)),
            life: 1.6,
            maxLife: 1.6,
            color: '#FDE047',
            upright: false,
          });
          sound.playLevelUp();
          sim.floatingTexts.push({
            x: sim.player.x,
            y: sim.player.y - 32,
            vy: -42,
            text: 'พรรูปปั้นเทพ: +20% DMG (3 นาที)',
            color: '#FDE047',
            life: 1.4,
            maxLife: 1.4,
            scale: 1.15,
          });
        } else if (result.choice === 'curse') {
          if (lm) lm.used = true;
          sim.statueEffect = { kind: 'curse', remaining: 180 };
          spawnVfx(sim.vfx, 'magic_circle_crimson', sx, sy, { scale: 1.6, lifetime: 3.0, squashY: ISO_TILT });
          sound.playBossWarning();
          sim.floatingTexts.push({
            x: sim.player.x,
            y: sim.player.y - 32,
            vy: -42,
            text: 'คำสาปเทพ: ทอง x2 · มอนตีแรง +25% (3 นาที)',
            color: '#C084FC',
            life: 1.4,
            maxLife: 1.4,
            scale: 1.15,
          });
        } else if (lm) {
          lm.progress = 0;
        }
        computeStats(sim);
        return;
      }

      if (result.kind === 'merchant') {
        const lm = sim.landmarks.find((l) => l.id === result.landmarkId);
        if (result.action === 'close') {
          sim.merchantCooldown = 4.0;
          return;
        }
        if (result.action === 'meat' && sim.goldEarned >= 30) {
          sim.goldEarned -= 30;
          const healed = applyPlayerHeal(sim, Math.round(sim.player.maxHp * 0.5));
          sound.playCoinPickup();
          sim.floatingTexts.push({
            x: sim.player.x,
            y: sim.player.y - 28,
            vy: -42,
            text: `ซื้อเนื้อย่าง +${healed} HP (-30g)`,
            color: '#34D399',
            life: 1.1,
            maxLife: 1.1,
            scale: 1.1,
          });
          sim.merchantCooldown = 4.0;
        } else if (result.action === 'reroll' && sim.goldEarned >= 50) {
          sim.goldEarned -= 50;
          sim.rerollsLeft += 2;
          sound.playCoinPickup();
          sim.floatingTexts.push({
            x: sim.player.x,
            y: sim.player.y - 28,
            vy: -42,
            text: 'ซื้อลูกเต๋า +2 รีโรล (-50g)',
            color: '#38BDF8',
            life: 1.1,
            maxLife: 1.1,
            scale: 1.1,
          });
          sim.merchantCooldown = 4.0;
        } else if (result.action === 'upgrade_weapon' && sim.goldEarned >= 120) {
          sim.goldEarned -= 120;
          const label = grantRandomUpgrade();
          if (lm) lm.used = true;
          sound.playLevelUp();
          sim.floatingTexts.push({
            x: sim.player.x,
            y: sim.player.y - 32,
            vy: -42,
            text: `อัปเกรด: ${label}! (-120g)`,
            color: '#FBBF24',
            life: 1.3,
            maxLife: 1.3,
            scale: 1.18,
          });
        }
        computeStats(sim);
        return;
      }

      if (result.kind === 'blood_shrine') {
        const lm = sim.landmarks.find((l) => l.id === result.landmarkId);
        if (!result.accept) {
          sim.bloodShrineCooldown = 4.0;
          return;
        }
        const hpCost = Math.max(1, Math.round(sim.player.hp * 0.3));
        sim.player.hp = Math.max(1, sim.player.hp - hpCost);
        if (lm) lm.used = true;
        spawnVfx(sim.vfx, 'magic_circle_crimson', lm?.x ?? sim.player.x, lm?.y ?? sim.player.y, {
          scale: 1.6,
          lifetime: 2.5,
          squashY: ISO_TILT,
        });
        const label = grantRandomUpgrade();
        sound.playBossChest();
        sim.floatingTexts.push({
          x: sim.player.x,
          y: sim.player.y - 34,
          vy: -42,
          text: `สังเวย -${hpCost} HP → ${label}!`,
          color: '#FB7185',
          life: 1.35,
          maxLife: 1.35,
          scale: 1.18,
        });
        computeStats(sim);
        return;
      }

      if (result.kind === 'secret_shop') {
        if (result.buyArtifactId) {
          const offer = sim.secretRoomShopOffers.find((o) => o.id === result.buyArtifactId);
          const art = ARTIFACTS[result.buyArtifactId];
          if (offer && art && !offer.owned && sim.goldEarned >= offer.price) {
            sim.goldEarned -= offer.price;
            sim.artifacts = { ...sim.artifacts, [art.slot]: art.id };
            offer.owned = true;
            sound.playBossChest();
            sim.floatingTexts.push({
              x: sim.player.x,
              y: sim.player.y - 34,
              vy: -42,
              text: `ซื้อ ${art.nameTh}! (-${offer.price}g)`,
              color: art.color,
              life: 1.4,
              maxLife: 1.4,
              scale: 1.2,
            });
            computeStats(sim);
          }
        }
        return;
      }

      if (result.kind === 'god_blessing') {
        if (result.choice === 'reaction') {
          sim.godBlessings.reactionBonus += 0.25;
          sim.floatingTexts.push({
            x: sim.player.x,
            y: sim.player.y - 32,
            vy: -42,
            text: 'พรแห่งเทพ: ปฏิกิริยาธาตุ +25%!',
            color: '#38BDF8',
            life: 1.4,
            maxLife: 1.4,
            scale: 1.2,
          });
        } else if (result.choice === 'area') {
          sim.godBlessings.areaBonus += 0.18;
          sim.floatingTexts.push({
            x: sim.player.x,
            y: sim.player.y - 32,
            vy: -42,
            text: 'พรแห่งเทพ: พื้นที่โจมตี +18%!',
            color: '#FBBF24',
            life: 1.4,
            maxLife: 1.4,
            scale: 1.2,
          });
        } else {
          sim.godBlessings.cdrBonus += 0.12;
          sim.floatingTexts.push({
            x: sim.player.x,
            y: sim.player.y - 32,
            vy: -42,
            text: 'พรแห่งเทพ: ลดคูลดาวน์ -12%!',
            color: '#34D399',
            life: 1.4,
            maxLife: 1.4,
            scale: 1.2,
          });
        }
        sound.playBossChest();
        computeStats(sim);
      }
    };

    // ===== Full Bot Smart Choice Evaluators =====
    const pickBotDraftChoice = (sim: SimState, choices: DraftChoice[]): DraftChoice => {
      const ownedRelics = new Set(sim.relics.map((r) => r.id));
      const desiredRelics = new Set(sim.weapons.map((w) => WEAPONS[w.id].pairedRelic));
      const relicPriority: Partial<Record<RelicId, number>> = {
        chronos: 45,
        spinach: 42,
        echo_crystal: 38,
        storm_eye: 34,
        black_ruby_heart: 30,
        armor_plate: 28,
        cracked_mirror: 26,
        stride_blades: 24,
        devil_dice: 22,
        boots: 20,
        soul_bell: 16,
      };
      const perkPriority: Record<MagePerkId, number> = {
        element_might: 220,
        spell_area: 195,
        mana_flow: 180,
        mana_pool: 160,
        mana_barrier: 155,
        orb_magnet: 130,
      };

      let best = choices[0];
      let bestScore = -Infinity;
      for (const c of choices) {
        let score = 0;
        if (c.kind === 'weapon') {
          const paired = ownedRelics.has(WEAPONS[c.weaponId].pairedRelic);
          if (c.isEvolve) {
            score = 1000;
          } else if (!c.isNew) {
            score = 320 + c.nextLevel * 28 + (paired ? 55 : 0);
          } else {
            score = 220 + (paired ? 45 : 0);
          }
        } else if (c.kind === 'relic') {
          const unlocksEvolve = desiredRelics.has(c.relicId);
          const timeGodChronosBonus = sim.raceClass === 'time_god' && c.relicId === 'chronos' ? 110 : 0;
          score =
            (c.isNew ? 160 : 210 + c.nextLevel * 18) +
            (unlocksEvolve ? 185 : 0) +
            (relicPriority[c.relicId] || 10) +
            timeGodChronosBonus;
        } else if (c.kind === 'mage_perk') {
          const timeGodManaFlowBonus = sim.raceClass === 'time_god' && c.perkId === 'mana_flow' ? 90 : 0;
          score = (perkPriority[c.perkId] || 150) + timeGodManaFlowBonus;
        } else {
          const lowHp = sim.player.hp < sim.player.maxHp * 0.5;
          score = lowHp ? 120 : 40;
        }
        if (score > bestScore) {
          bestScore = score;
          best = c;
        }
      }
      return best;
    };

    const pickBotArtifactChoice = (sim: SimState, choices: ArtifactId[]): ArtifactId | null => {
      if (choices.length === 0) return null;
      const preferredByClass: Partial<Record<RaceClassId, ArtifactId[]>> = {
        hunter: ['dancer_sash', 'assassin_hood', 'windwalker_boots', 'tyrant_crown'],
        saint: ['seraph_robe', 'juggernaut_plate', 'crown_of_fortune', 'power_stone_ring'],
        knight: ['juggernaut_plate', 'iron_boots', 'seraph_robe', 'tyrant_crown'],
        demon_lord: ['sinner_heart', 'tyrant_crown', 'ruby_ring', 'greedy_chalice'],
        vampire_lord: ['blood_necklace', 'crimson_shroud', 'fang_talisman', 'berserker_band'],
        seven_sins: ['sinner_heart', 'tyrant_crown', 'butterfly_pendant', 'greedy_chalice'],
        time_god: ['oracle_helm', 'fang_talisman', 'butterfly_pendant', 'windwalker_boots', 'tyrant_crown'],
        death_god: ['oracle_helm', 'assassin_hood', 'tyrant_crown', 'greedy_chalice'],
        spellblade_god: ['two_faced_tome', 'flash_boots', 'power_stone_ring', 'juggernaut_plate'],
        voidless_blade: ['two_faced_tome', 'tyrant_crown', 'flash_boots', 'juggernaut_plate'],
      };
      const clsPref = sim.raceClass ? preferredByClass[sim.raceClass] || [] : [];

      let best = choices[0];
      let bestScore = -Infinity;
      for (const id of choices) {
        const def = ARTIFACTS[id];
        if (!def) continue;
        let score = 100;
        if (!sim.artifacts[def.slot]) score += 400; // strongly prefer filling empty slot
        if (def.isLegendary) score += 160;
        if (clsPref.includes(id)) score += 130;
        const currentInSlot = sim.artifacts[def.slot];
        if (currentInSlot && ARTIFACTS[currentInSlot]?.isLegendary && !def.isLegendary) {
          score -= 180;
        }
        if (score > bestScore) {
          bestScore = score;
          best = id;
        }
      }
      return best;
    };

    const pickBotSinContract = (
      sim: SimState,
      choices: SinContractChoice[]
    ): { sinId: SinId; banishSinId?: SinId } => {
      const sinPriority: Record<SinId, number> = {
        wrath: 95,
        envy: 90,
        pride: 85,
        gluttony: 78,
        lust: 72,
        greed: 65,
        sloth: 55,
      };
      const activeSins = sim.sins.filter((s) => s.active);
      const activeIds = new Set(activeSins.map((s) => s.sinId));

      let picked = choices[0];
      let bestScore = -Infinity;
      for (const c of choices) {
        let score = sinPriority[c.sinId] || 50;
        if (activeIds.has(c.sinId)) score += 120; // upgrade active sin
        if (score > bestScore) {
          bestScore = score;
          picked = c;
        }
      }

      let banishSinId: SinId | undefined;
      if (!activeIds.has(picked.sinId) && activeSins.length >= getSinMaxSlots(sim)) {
        const sortedActive = [...activeSins].sort(
          (a, b) => a.level * 100 + (sinPriority[a.sinId] || 0) - (b.level * 100 + (sinPriority[b.sinId] || 0))
        );
        banishSinId = sortedActive[0]?.sinId;
      }
      return { sinId: picked.sinId, banishSinId };
    };

    const pickBotRaceClass = (): RaceClassId => {
      const target = botTargetClassRef.current;
      const raceOptions = getClassesForRace(raceId);
      if (target && target !== 'auto') {
        const matched = raceOptions.find((c) => c.id === target);
        if (matched) return matched.id;
      }
      const chosen = raceOptions[Math.floor(Math.random() * raceOptions.length)];
      return chosen ? chosen.id : 'hunter';
    };

    const getDraftChoiceLabelTh = (c: DraftChoice): string => {
      if (c.kind === 'weapon') {
        const def = WEAPONS[c.weaponId];
        return c.isEvolve ? `${def.evolvedNameTh} (EVO)` : `${def.nameTh} Lv.${c.nextLevel}`;
      }
      if (c.kind === 'relic') return `${RELICS[c.relicId].nameTh} Lv.${c.nextLevel}`;
      if (c.kind === 'mage_perk') return `${MAGE_PERKS[c.perkId].nameTh} +1`;
      return `+${c.goldAmount}g / +${c.healAmount}HP`;
    };

    const presentLevelUpDraft = (sim: SimState, choices: DraftChoice[]) => {
      if (choices.length === 0) return;
      if (botModeRef.current === 'full') {
        const picked = pickBotDraftChoice(sim, choices);
        applyDraftChoiceToSim(sim, picked);
        sim.floatingTexts.push({
          x: sim.player.x,
          y: sim.player.y - 38,
          vy: -40,
          text: `🤖 ${getDraftChoiceLabelTh(picked)}`,
          color: '#C4B5FD',
          life: 1.05,
          maxLife: 1.05,
          scale: 0.95,
        });
        return;
      }
      callbacksRef.current.onLevelUpDraft(choices);
    };

    const presentBossChest = (sim: SimState, reward: BossChestReward) => {
      if (botModeRef.current === 'full') {
        applyBossChestToSim(sim, reward);
        sim.floatingTexts.push({
          x: sim.player.x,
          y: sim.player.y - 38,
          vy: -42,
          text: `🤖 เปิดหีบบอส (+${reward.bonusGold}g)`,
          color: '#FBBF24',
          life: 1.15,
          maxLife: 1.15,
          scale: 1.0,
        });
        return;
      }
      callbacksRef.current.onBossChestOpen(reward);
    };

    const presentArtifactChest = (sim: SimState, choices: ArtifactId[]) => {
      if (choices.length === 0) return;
      if (botModeRef.current === 'full') {
        const picked = pickBotArtifactChoice(sim, choices);
        applyArtifactChoiceToSim(sim, picked);
        return;
      }
      callbacksRef.current.onArtifactChestOpen(choices);
    };

    const presentSinContract = (sim: SimState, choices: SinContractChoice[]) => {
      if (choices.length === 0) return;
      if (botModeRef.current === 'full') {
        const { sinId, banishSinId } = pickBotSinContract(sim, choices);
        applySinContractToSim(sim, sinId, banishSinId);
        return;
      }
      callbacksRef.current.onSinContractOpen(choices);
    };

    const presentMapInteraction = (sim: SimState, prompt: MapInteractionPrompt) => {
      if (botModeRef.current === 'full') {
        if (prompt.kind === 'cursed_statue') {
          resolveMapInteractionToSim(sim, {
            kind: 'cursed_statue',
            landmarkId: prompt.landmarkId,
            choice: 'blessing',
          });
        } else if (prompt.kind === 'merchant') {
          if (sim.player.hp < sim.player.maxHp * 0.55 && sim.goldEarned >= 30) {
            resolveMapInteractionToSim(sim, {
              kind: 'merchant',
              landmarkId: prompt.landmarkId,
              action: 'meat',
            });
          } else if ((prompt.hasUpgradeableWeapon || prompt.usesElements) && sim.goldEarned >= 120) {
            resolveMapInteractionToSim(sim, {
              kind: 'merchant',
              landmarkId: prompt.landmarkId,
              action: 'upgrade_weapon',
            });
          } else {
            resolveMapInteractionToSim(sim, {
              kind: 'merchant',
              landmarkId: prompt.landmarkId,
              action: 'close',
            });
          }
        } else if (prompt.kind === 'blood_shrine') {
          resolveMapInteractionToSim(sim, {
            kind: 'blood_shrine',
            landmarkId: prompt.landmarkId,
            accept: sim.player.hp > sim.player.maxHp * 0.65,
          });
        } else if (prompt.kind === 'secret_shop') {
          const affordable = prompt.offers
            .filter((o) => !o.owned && sim.goldEarned >= o.price)
            .sort((a, b) => {
              const aEmpty = sim.artifacts[ARTIFACTS[a.id].slot] ? 0 : 1;
              const bEmpty = sim.artifacts[ARTIFACTS[b.id].slot] ? 0 : 1;
              return bEmpty - aEmpty || b.price - a.price;
            });
          for (const offer of affordable) {
            if (!offer.owned && sim.goldEarned >= offer.price && !sim.artifacts[ARTIFACTS[offer.id].slot]) {
              resolveMapInteractionToSim(sim, { kind: 'secret_shop', buyArtifactId: offer.id });
            }
          }
        } else if (prompt.kind === 'god_blessing') {
          const choice: 'reaction' | 'area' | 'cdr' = RACES[raceId].usesElements
            ? isSpellbladeClass(sim.raceClass)
              ? 'area'
              : 'reaction'
            : sim.raceClass === 'saint' || sim.raceClass === 'knight'
              ? 'area'
              : 'cdr';
          resolveMapInteractionToSim(sim, { kind: 'god_blessing', choice });
        }
        return;
      }
      callbacksRef.current.onMapInteractionPrompt(prompt);
    };

    const applyRaceClassToSim = (sim: SimState, rawClassId: RaceClassId) => {
      const legacyMap: Record<string, RaceClassId> = {
        werewolf: 'vampire_lord',
        lucifer: 'seven_sins',
      };
      const classId = legacyMap[rawClassId] || rawClassId;
      sim.raceClass = classId;
      sim.classPrompted = true;
      sim.classSkillTimer = 0.25;
      sim.saintRegenTimer = 2.0;
      sim.classGauge = 0;
      sim.ultActiveTimer = 0;
      sim.ultActiveMax = 0;
      sim.ultCount = 0;
      sim.ultAscended = false;
      computeStats(sim);
      sim.player.hp = Math.min(
        sim.player.maxHp,
        sim.player.hp + Math.round(sim.player.maxHp * 0.25)
      );
      if (classId === 'hunter') {
        sim.hunterDashMaxCharges = 3;
        sim.hunterDashCharges = 3;
        sim.hunterDashRechargeTimer = 0;
        sim.hunterKillRefunds = 0;
        sim.hunterEchoes = [];
        sim.hunterUltDashHistory = [];
        sim.hunterCritGaugeCd = 0;
        sim.hunterShadowKnifeCd = 0;
        sim.hunterRefundCd = 0;
        sim.hunterDashGaugeEarned = 0;
        sim.hunterShadowSlashKills = 0;
        sim.classSkillTimer = 0.15;
      } else if (classId === 'saint') {
        const gMax = Math.round(sim.player.maxHp * 2.5);
        sim.golem = {
          x: sim.player.x + 42,
          y: sim.player.y - 10,
          walkCycle: 0,
          smashCooldown: 0.4,
          smashingTimer: 0,
          hp: gMax,
          maxHp: gMax,
          respawnTimer: 0,
          leapCooldown: 0,
          spearTimer: 1.0,
          lostHpTrack: 0,
        };
      } else if (classId === 'knight') {
        sim.knightSacredBlades = [];
        sim.knightNextBladeId = 1;
        for (let bi = 0; bi < 3; bi++) {
          sim.knightSacredBlades.push({
            id: sim.knightNextBladeId++,
            x: sim.player.x,
            y: sim.player.y,
            homeAngleOffset: 0,
            state: 'orbit',
            targetId: null,
            targetX: sim.player.x,
            targetY: sim.player.y,
            tempLife: -1,
            slashProgress: 0,
            trail: [],
          });
        }
        sim.knightBulwarkStacks = 0;
        sim.knightBulwarkCrackTimer = 0;
        sim.knightTauntTimer = 3.0;
        sim.knightTauntWindup = 0;
        sim.knightTauntCracks = [];
        sim.knightParryOverlayTimer = 0;
        sim.knightParryCounterDelayTimer = 0;
        sim.knightParryTargetIds.clear();
        sim.knightParryBulletSnap = [];
        sim.knightUltFinaleTimer = 0;
        sim.knightUltFinaleStage = 0;
        sim.knightUltBgPillars = [];
        sim.knightAscendFxTimer = 0;
      } else if (classId === 'seven_sins') {
        sim.sins = [];
        sim.nextSinContractLevel = Math.max(25, Math.ceil((sim.player.level + 1) / 5) * 5);
        const initialChoices = generateSinChoices(sim, 3);
        if (initialChoices.length > 0) {
          presentSinContract(sim, initialChoices);
        }
      } else if (classId === 'time_god') {
        const postStats = computeStats(sim);
        sim.lastCooldownMult = postStats.cooldownMult;
        const timing = computeTimeGodStopTiming(postStats.cooldownMult);
        sim.timeStopMaxCooldown = timing.stopCooldown;
        sim.timeStopDurationMax = timing.stopDuration;
        sim.timeStopCooldown = 12.0;
        sim.timeStopCycleReduced = 0;
        sim.timeStopTimer = 0;
        sim.timeStopTickTimer = 0;
        sim.timeStopCount = 0;
        sim.timeStopTotalSeconds = 0;
        sim.timeGodSelectedAt = sim.elapsedSeconds;
        sim.chronoWellCooldown = 1.5;
        sim.chronoWells = [];
        sim.expiredChronoWellCaps = [];
        sim.chronoWellKills = 0;
        sim.timeDebtDamageTotal = 0;
        sim.chronoLastLogMinute = Math.floor(sim.elapsedSeconds / 60);
        sim.rewindReady = true;
        sim.rewindUsedCount = 0;
        sim.rewindChargeKills = 0;
        sim.rewindChargeTarget = 250;
        sim.rewindLockTimer = 0;
        sim.rewindVisualTimer = 0;
        sim.chronoHudMotes = [];
      } else if (classId === 'death_god') {
        sim.necroMinions = [];
        sim.necroMinionSeq = 1;
        sim.necroSoulsCount = 0;
        sim.necroSoulBonusPct = 0;
        sim.necroShield = 0;
        sim.necroShieldTimer = 0;
        sim.necroSoulOrbs = [];
      } else if (classId === 'spellblade_god' || classId === 'voidless_blade') {
        sim.elementalFields = [];
        sim.sweepingLasers = [];
        sim.orbitingBlades = [];
        sim.elementalGolem = null;
        sim.spellbladeCharge = 0;
        sim.spellbladeChargeCooldown = 0;
        sim.spellbladeChargeMaxCooldown = SPELLBLADE_CHARGE_COOLDOWN;
        sim.spellbladeStandTime = 0;
        sim.spellbladeChargeNotified = false;
        sim.spellbladeHitHealCooldown = 0;
        sim.voidlessKills = 0;
        sim.voidlessTimer = 0;
        sim.voidlessCooldown = 0;
        sim.voidlessPillarTimer = 0;
        sim.spiritSwords = [];
        chargeReleaseQueuedRef.current = false;
        for (const f of sim.activeFusions) {
          f.remaining = 16;
          f.maxDuration = 16;
        }
        if (sim.heldElements.length > 0) {
          sim.spellbladeActiveElement = sim.heldElements[sim.heldElements.length - 1];
        } else if (sim.activeFusions.length > 0) {
          const latest = sim.activeFusions[sim.activeFusions.length - 1];
          sim.spellbladeInfusionName = latest.def.nameTh;
          sim.spellbladeInfusionColor = latest.def.color;
          sim.spellbladeActiveElement = latest.catalyst;
        } else {
          sim.spellbladeActiveElement = null;
        }
      }
      const def = RACE_CLASSES[classId];
      sim.groundFx.push({
        kind: 'warp',
        x: sim.player.x,
        y: sim.player.y,
        radius: 14,
        maxRadius: 120,
        life: 0.5,
        maxLife: 0.5,
        color: def.color,
      });
      sim.announcement = `วิวัฒนาการสายอาชีพสำเร็จ! ${def.nameTh} (${def.roleTh})`;
      sim.announcementTimer = 4.5;
      sound.playLevelUp();
    };

    const presentClassEvolution = (sim: SimState) => {
      if (botModeRef.current === 'full') {
        const picked = pickBotRaceClass();
        applyRaceClassToSim(sim, picked);
        return;
      }
      callbacksRef.current.onClassEvolutionPrompt(raceId);
    };

    const activatePotionInSim = (sim: SimState) => {
      if (sim.runEnded || !sim.activePotion || sim.potionUsed) return;
      const pid = sim.activePotion;
      const pDef = POTIONS[pid];
      if (!pDef) return;
      sim.potionUsed = true;
      callbacksRef.current.onConsumePotion?.(pid);
      sound.playLevelUp();
      if (pid === 'blood_flask') {
        const healAmt = Math.max(25, Math.round(sim.player.maxHp * 0.5));
        sim.player.hp = Math.min(sim.player.maxHp, sim.player.hp + healAmt);
        sim.floatingTexts.push({
          x: sim.player.x,
          y: sim.player.y - 32,
          vy: -42,
          text: `ยาฟื้นโลหิต +${healAmt} HP!`,
          color: pDef.color,
          life: 1.1,
          maxLife: 1.1,
          scale: 1.15,
        });
      } else if (pid === 'holy_water') {
        sim.player.invulnTimer = Math.max(sim.player.invulnTimer, 2.0);
        sim.enemyBullets = [];
        const pushR = 260;
        for (const en of sim.enemies) {
          if (en.hp <= 0) continue;
          const dx = en.x - sim.player.x;
          const dy = en.y - sim.player.y;
          const d = Math.hypot(dx, dy) || 1;
          if (d <= pushR && en.knockbackResist < 1) {
            en.kbVx += (dx / d) * 420 * (1 - en.knockbackResist);
            en.kbVy += (dy / d) * 420 * (1 - en.knockbackResist);
          }
        }
        sim.groundFx.push({
          kind: 'shockwave',
          x: sim.player.x,
          y: sim.player.y,
          radius: 20,
          maxRadius: pushR,
          life: 0.4,
          maxLife: 0.4,
          color: pDef.color,
        });
      } else if (pid === 'greed_elixir') {
        sim.goldDoubleTimer = 60;
      } else if (pid === 'wisdom_draught') {
        sim.xpDoubleTimer = 45;
      } else if (pid === 'fate_powder') {
        sim.fatePowderActive = true;
      }
      sim.announcement = `ดื่ม ${pDef.nameTh}: ${pDef.descTh}`;
      sim.announcementTimer = 3.2;
    };

    // Apply choices from Level Up or Boss Chest
    useImperativeHandle(ref, () => ({
      applyDraftChoice: (choice: DraftChoice) => {
        const sim = simRef.current;
        if (!sim) return;
        applyDraftChoiceToSim(sim, choice);
      },
      applyBossChest: (reward: BossChestReward) => {
        const sim = simRef.current;
        if (!sim) return;
        applyBossChestToSim(sim, reward);
      },
      applyArtifactChoice: (artifactId: ArtifactId | null) => {
        const sim = simRef.current;
        if (!sim) return;
        applyArtifactChoiceToSim(sim, artifactId);
      },
      applyRaceClass: (rawClassId: RaceClassId) => {
        const sim = simRef.current;
        if (!sim) return;
        applyRaceClassToSim(sim, rawClassId);
      },
      applySinContract: (sinId: SinId, banishSinId?: SinId) => {
        const sim = simRef.current;
        if (!sim) return;
        applySinContractToSim(sim, sinId, banishSinId);
      },
      resolveMapInteraction: (result: MapInteractionResult) => {
        const sim = simRef.current;
        if (!sim) return;
        resolveMapInteractionToSim(sim, result);
      },
      rerollDraft: () => {
        const sim = simRef.current;
        if (!sim || sim.rerollsLeft <= 0) return;
        sim.rerollsLeft -= 1;
        sound.playLevelUp();
        const choices = generateLevelUpDraft(
          raceId,
          sim.weapons,
          sim.relics,
          sim.magePerks,
          buildDraftOptions(sim)
        );
        callbacksRef.current.onLevelUpDraft(choices);
      },
      banishDraft: (choice: DraftChoice) => {
        const sim = simRef.current;
        if (!sim || sim.banishesLeft <= 0) return;
        sim.banishesLeft -= 1;
        sim.banishedKeys.add(getDraftChoiceKey(choice));
        sound.playLevelUp();
        const choices = generateLevelUpDraft(
          raceId,
          sim.weapons,
          sim.relics,
          sim.magePerks,
          buildDraftOptions(sim)
        );
        callbacksRef.current.onLevelUpDraft(choices);
      },
      skipDraft: () => {
        const sim = simRef.current;
        if (!sim || sim.skipsLeft <= 0) return;
        sim.skipsLeft -= 1;
        const skipGold = sim.elapsedSeconds > 1800 ? 8 : 15;
        sim.goldEarned += skipGold;
        sim.goldBreakdown.drops += skipGold;
        sound.playCoinPickup();
      },
      triggerPotion: () => {
        const sim = simRef.current;
        if (!sim) return;
        activatePotionInSim(sim);
      },
      finishRunAsQuit: () => {
        const sim = simRef.current;
        if (!sim || sim.runEnded) return;
        finalizeAndEmitRunEnd(sim);
      },
      triggerDash: () => {
        activeSkillRef.current();
      },
      triggerVoidInfusion: () => {
        const sim = simRef.current;
        if (!sim || !RACES[raceId].usesElements || sim.voidInfusionActive) return;
        if (sim.mana < VOID_INFUSION_COST) {
          sim.lowManaTimer = 0.7;
          sim.floatingTexts.push({
            x: sim.player.x,
            y: sim.player.y - 28,
            vy: -42,
            text: `มานาไม่พอ (${VOID_INFUSION_COST} MP)`,
            color: '#F43F5E',
            life: 0.7,
            maxLife: 0.7,
            scale: 1,
          });
          return;
        }
        sim.mana -= VOID_INFUSION_COST;
        sim.voidInfusionActive = true;
        const abDur = 0.18;
        sim.abilityFlashMax = abDur >= sim.abilityFlash ? abDur : sim.abilityFlashMax;
        sim.abilityFlash = Math.max(sim.abilityFlash, abDur);
        sim.abilityFlashAlpha = Math.max(sim.abilityFlashAlpha, 0.18);
        sim.groundFx.push({
          kind: 'shockwave',
          x: sim.player.x,
          y: sim.player.y,
          radius: 12,
          maxRadius: 95,
          life: 0.35,
          maxLife: 0.35,
          color: '#A855F7',
        });
        sim.floatingTexts.push({
          x: sim.player.x,
          y: sim.player.y - 32,
          vy: -42,
          text: 'Void Infusion! (+65% ดาเมจ · CD x2)',
          color: '#C084FC',
          life: 0.85,
          maxLife: 0.85,
          scale: 1.1,
        });
        sound.playMagicCast();
      },
      triggerActiveSkill: () => {
        activeSkillRef.current();
      },
      startHoldActiveSkill: () => {
        const sim = simRef.current;
        if (!sim) return;
        sim.mobileHoldActive = true;
        sim.mobileHoldTime = 0;
        sim.mobileTriggeredUlt = false;
      },
      releaseHoldActiveSkill: () => {
        const sim = simRef.current;
        if (!sim) return;
        if (sim.mobileHoldActive && !sim.mobileTriggeredUlt) {
          activeSkillRef.current();
        }
        sim.mobileHoldActive = false;
        sim.mobileHoldTime = 0;
        sim.mobileTriggeredUlt = false;
      },
    }));

    // Initialize new run whenever runId changes
    useEffect(() => {
      preloadCraftpixAssets();
      preloadMageSprites();
      preloadVfx();
      preloadPackVfx();
      const race = RACES[raceId];
      const upg = saveRef.current.upgrades;
      const t = saveRef.current.talents;
      const noTricks = (saveRef.current.activeCurses.no_draft_tricks || 0) > 0;
      const startHp = Math.round(race.baseHp + upg.maxHp * 10);

      // Ensure Orc never starts with a magic weapon
      const validStarter =
        !race.canUseMagic && WEAPONS[starterWeapon].category === 'magic'
          ? race.defaultWeapon
          : starterWeapon;

      let startGold = (saveRef.current.buildings.training || 0) >= 3 ? 50 : 0;
      let hasPhoenixFeather = false;
      let phoenixHealPct = 0.3;
      for (const uid of Object.values(saveRef.current.equippedGear)) {
        if (!uid) continue;
        const gItem = saveRef.current.gearInventory.find((it) => it.uid === uid);
        if (!gItem) continue;
        const gDef = PERMANENT_GEAR_CATALOG[gItem.defId];
        if (!gDef) continue;
        if (gDef.effectKind === 'greedy_blade') {
          startGold += Math.round(getGearItemEffectiveValue(gItem));
        } else if (gDef.effectKind === 'phoenix_feather') {
          hasPhoenixFeather = true;
          phoenixHealPct = Math.max(0.3, Math.min(0.85, getGearItemEffectiveValue(gItem) / 100));
        }
      }

      const initialWeaponLv = !race.usesElements && t.row1?.branch === 'A' && t.row1.rank > 0 ? 2 : 1;
      const initialPerks: Partial<Record<MagePerkId, number>> = {};
      if (race.usesElements && t.row1?.branch === 'A' && t.row1.rank > 0) {
        const perkPool: MagePerkId[] = ['mana_pool', 'mana_flow', 'element_might', 'spell_area'];
        const chosen = perkPool[Math.floor(Math.random() * perkPool.length)];
        initialPerks[chosen] = 1;
      }
      const selectedPot =
        saveRef.current.selectedPotion && (saveRef.current.ownedPotions[saveRef.current.selectedPotion] || 0) > 0
          ? saveRef.current.selectedPotion
          : null;

      const initialSim: SimState = {
        player: {
          x: 0,
          y: 0,
          vx: 0,
          vy: 0,
          facingX: 1,
          facingY: 0,
          radius: 15,
          hp: startHp,
          maxHp: startHp,
          xp: 0,
          xpToNext: 22,
          level: 1,
          invulnTimer: 0,
          hitFlash: 0,
          walkCycle: 0,
          visualFacingAngle: 0,
          moveSpeedRatio: 0,
        },
        weapons: race.usesElements
          ? []
          : [
              {
                id: validStarter,
                level: initialWeaponLv,
                evolved: false,
                cooldownTimer: 0.1,
                totalDamage: 0,
              },
            ],
        relics: [],
        enemies: [],
        projectiles: [],
        enemyBullets: [],
        groundFx: [],
        drops: race.usesElements
          ? Array.from({ length: 3 }, (_, idx) => {
              const ang = (idx * Math.PI * 2) / 3 + 0.4;
              const el = ELEMENT_IDS[Math.floor(Math.random() * ELEMENT_IDS.length)];
              return {
                kind: 'element_orb' as const,
                x: Math.cos(ang) * 135,
                y: Math.sin(ang) * 135,
                value: 1,
                elementId: el,
                magnetized: false,
              };
            })
          : [],
        totems: [],
        particles: [],
        floatingTexts: [],
        elapsedSeconds: 0,
        realmStartSeconds: 0,
        realmTier: 0,
        biomeShiftCount: 0,
        reaperSlainCount: 0,
        reaperCurseStacks: 0,
        reaperApproachingAnnouncedRealm: -1,
        reaperArrivedBannerTimer: 0,
        lastMinuteAnnounced: -1,
        spawnedBossMinutes: new Set(),
        spawnTimer: 0.25,
        eliteSpawnTimer: 45,
        flowerRingTimer: 12,
        goldEarned: startGold,
        soulEssenceEarned: 0,
        goldBreakdown: {
          drops: startGold,
          pouches: 0,
          elites: 0,
          bosses: 0,
          survival: 0,
          quests: 0,
          curseBonus: 0,
        },
        pendingSealedChests: 0,
        elitesKilled: 0,
        kills: 0,
        bossesKilled: 0,
        nextEnemyId: 1,
        orbitAngle: 0,
        garlicTimer: 0,
        shakeTime: 0,
        shakeMaxTime: 0,
        shakeIntensity: 0,
        hitShakeCooldown: 0,
        critVfxCooldown: 0,
        hitstopTimer: 0,
        announcement: getWaveForMinute(0, 0).titleTh,
        announcementTimer: 2.6,
        announcementQueue: [],
        lastAnnouncementObserved: getWaveForMinute(0, 0).titleTh,
        garlicHealCounter: 0,
        dashTimer: 0,
        dashCooldown: 0,
        dashVx: 0,
        dashVy: 0,
        snareTimer: 0,
        weather: 'clear',
        weatherTimer: WEATHER_INTERVAL_SECONDS,
        weatherHazardTimer: 1.5,
        weatherHazards: [],
        sandSlowTimer: 0,
        iceSlowTimer: 0,
        weatherLightningFlash: 0,
        damageFlash: 0,
        damageFlashMax: 0.28,
        damageFlashAlpha: 0,
        abilityFlash: 0,
        abilityFlashMax: 0.2,
        abilityFlashAlpha: 0,
        weatherTextCooldown: 0,
        orcLevelHpBonus: 0,
        vampireKillCounter: 0,
        raceClass: null,
        classPrompted: false,
        classSkillTimer: 0.6,
        saintRegenTimer: 2.0,
        reviveCooldown: 0,
        leechWindowStart: undefined,
        leechWindowHealed: 0,
        woundedTimer: 0,
        dayNightElapsed: 0,
        classGauge: 0,
        ultActiveTimer: 0,
        ultActiveMax: 0,
        ultCount: 0,
        ultCutinTimer: 0,
        ultCutinMax: 0.68,
        ultCutinTitleTh: '',
        ultCutinTitleEn: '',
        ultCutinColor: '#FBBF24',
        ultSlowTimer: 0,
        ultZoomTimer: 0,
        ultZoomMax: 0.55,
        ultAscended: false,
        spaceDown: false,
        spaceHoldTime: 0,
        spaceTriggeredUlt: false,
        mobileHoldActive: false,
        mobileHoldTime: 0,
        mobileTriggeredUlt: false,
        dashStartX: 0,
        dashStartY: 0,
        dashCutHitIds: new Set(),
        shadowCloneTimer: 0,
        hunterDashCharges: 3,
        hunterDashMaxCharges: 3,
        hunterDashRechargeTimer: 0,
        hunterKillRefunds: 0,
        hunterEchoes: [],
        hunterUltDashHistory: [],
        hunterCritGaugeCd: 0,
        hunterShadowKnifeCd: 0,
        hunterRefundCd: 0,
        hunterDashGaugeEarned: 0,
        hunterShadowSlashKills: 0,
        golem: null,
        saintShieldHits: 0,
        saintHealExplosionCd: 0,
        sanctuaryZones: [],
        knightSwingCount: 0,
        knightParryCount: 0,
        knightAegisBonus: 0,
        parryWindowTimer: 0,
        knightParryFlash: 0,
        plantedExcalibur: null,
        knightSacredBlades: [],
        knightNextBladeId: 1,
        knightBulwarkStacks: 0,
        knightBulwarkCrackTimer: 0,
        knightTauntTimer: 10.0,
        knightTauntWindup: 0,
        knightTauntCracks: [],
        knightParryOverlayTimer: 0,
        knightParryCounterDelayTimer: 0,
        knightParryTargetIds: new Set(),
        knightParryBulletSnap: [],
        knightUltIntroX: 0,
        knightUltIntroY: 0,
        knightUltIntroPhase: 0,
        knightUltBgPillars: [],
        knightUltBgPillarCd: 0,
        knightUltFinaleTimer: 0,
        knightUltFinaleStage: 0,
        knightUltFinaleX: 0,
        knightUltFinaleY: 0,
        knightAscendFxTimer: 0,
        knightIdleMoteTimer: 0.8,
        knightStepDustAccum: 0,
        knightHitKnockbackX: 0,
        knightHitSparkTimer: 0,
        knightFullScreenFlashTimer: 0,
        knightLastHitWasCrit: false,
        demonSoulKills: 0,
        demonFlameTrailTimer: 0,
        demonRainTimer: 0,
        demonImps: [],
        vampireBloodShield: 0,
        vampireLowHpTime: 0,
        vampireLastRiteCd: 0,
        vampireUltPulseTimer: 0,
        vampireUltSpearTimer: 0,
        sins: [],
        standStillTimer: 0,
        nextSinContractLevel: 25,
        eighthSinTimer: 10.0,
        mana: 100,
        maxMana: 100,
        manaRegen: 3.6,
        lowManaTimer: 0,
        heldElements: [],
        activeFusions: [],
        magePerks: initialPerks,
        mageSparkTimer: 0.35,
        mageOrbSpawnTimer: 5.0,
        mageFusionCount: 0,
        fusionCooldown: 0,
        fusionMaxCooldown: 4.8,
        voidInfusionActive: false,
        mageBarrierTimer: 0,
        mageBarrierPulseTimer: 0,
        lastSpellbladeFusion: null,
        mapEvent: null,
        mapEventTimer: 0,
        nextMapEventTimer: 16,
        lastMapEvent: null,
        ambushSpawnTimer: 0,
        elementalFields: [],
        sweepingLasers: [],
        orbitingBlades: [],
        elementalGolem: null,
        timeStopTimer: 0,
        timeStopCooldown: 32,
        timeStopMaxCooldown: 32,
        timeStopDurationMax: 3.0,
        timeStopCycleReduced: 0,
        lastCooldownMult: 1,
        timeStopTickTimer: 0,
        timeStopCount: 0,
        timeStopTotalSeconds: 0,
        timeGodSelectedAt: 0,
        chronoWellCooldown: 1.5,
        chronoWellSeq: 1,
        chronoWells: [],
        expiredChronoWellCaps: [],
        chronoWellKills: 0,
        timeDebtDamageTotal: 0,
        chronoLastLogMinute: 0,
        rewindReady: false,
        rewindUsedCount: 0,
        rewindChargeKills: 0,
        rewindChargeTarget: 250,
        rewindLockTimer: 0,
        rewindVisualTimer: 0,
        playerPosHistory: [],
        playerPosSampleTimer: 0,
        lastDamageFromReaper: false,
        chronoHudMotes: [],
        deathStacks: 0,
        deathNovaCounter: 0,
        necroMinions: [],
        necroMinionSeq: 1,
        necroSoulsCount: 0,
        necroSoulBonusPct: 0,
        necroShield: 0,
        necroShieldTimer: 0,
        necroSoulOrbs: [],
        spellbladeSlashCounter: 0,
        spellbladeCharge: 0,
        spellbladeChargeCooldown: 0,
        spellbladeChargeMaxCooldown: SPELLBLADE_CHARGE_COOLDOWN,
        spellbladeStandTime: 0,
        spellbladeChargeNotified: false,
        spellbladeSwingTimer: 0,
        spellbladeInfusionName: null,
        spellbladeInfusionColor: null,
        spellbladeActiveElement: null,
        spellbladeHitHealCooldown: 0,
        spellbladeFusionCount: 0,
        spellbladeLightHealTimer: 1.15,
        voidlessTimer: 0,
        voidlessCooldown: 0,
        voidlessKills: 0,
        voidlessPillarTimer: 0,
        spiritSwords: [],
        artifacts: {},
        nextArtifactLevel: 3,
        artifactRegenTimer: 2.0,
        artifactRegenBuffer: 0,
        artifactLifestealBuffer: 0,
        artifactHealTextCooldown: 0,
        ironRamCooldown: 0,
        cachedCritChance: 0.05,
        cachedCritDamageMult: 1.6,
        cachedLifestealPct: 0,
        cachedHealTakenFactor: 1.0,
        cachedSlowDebuffFactor: 1.0,
        cachedDashCooldownFactor: 1.0,
        cachedThornBurstOnHit: false,
        cachedExtraInvulnOnHit: 0,
        cachedRawDmgIncrease: 0,
        cachedBaseDamageMult: 1,
        cachedCurseLevel: 0,
        cachedHourglassFreeze: false,
        cachedLightningCrownChance: 0,
        cachedShadowRing: false,
        rerollsLeft: noTricks ? 0 : (upg.reroll || 0) + (t.row1?.branch === 'B' && t.row1.rank > 0 ? 2 : 0),
        banishesLeft: noTricks ? 0 : upg.banish || 0,
        skipsLeft: noTricks ? 0 : upg.skip || 0,
        banishedKeys: new Set(),
        metaRevivesLeft: upg.revive || 0,
        phoenixAvailable: hasPhoenixFeather,
        phoenixHealPct,
        activePotion: selectedPot,
        potionUsed: false,
        goldDoubleTimer: 0,
        xpDoubleTimer: 0,
        fatePowderActive: false,
        altarHitShieldCd: 0,
        altarEmergencyUsed: false,
        hourglassFreezeTimer: 45,
        shadowBombs: [],
        petX: 44,
        petY: -18,
        petActionTimer: 1.5,
        petShieldCooldown: 0,
        inRunQuests: rollInRunQuests().map((qt) => ({
          id: qt.id,
          titleTh: qt.titleTh,
          progress: 0,
          target: qt.target,
          rewardGold: qt.rewardGold,
          completed: false,
        })),
        noDamageTimer: 0,
        lastDamageSourceTh: 'ฝูงอสูร',
        runKillsByKind: {},
        runBananaKills: 0,
        runFireBurnKills: 0,
        runDefeatedBossKinds: [],
        bloodGauge: 50,
        batSwarmTimer: 0,
        batSwarmCooldown: 0,
        batSwarmTickTimer: 0,
        orcRage: 0,
        orcBerserkTimer: 0,
        orcBerserkCooldown: 0,
        warCryCooldown: 0,
        orcRageHitCooldown: 0,
        activeSkillHintCooldown: 0,
        runEnded: false,
        mapSeed: Math.floor(Math.random() * 100000),
        frameObstacles: [],
        frameBreakables: [],
        frameTraps: [],
        frameZones: [],
        brokenTiles: new Set(),
        breakableHits: {},
        trapStates: {},
        ritualFireLines: [],
        propHitCooldowns: {},
        awakenedTrees: new Set(),
        graveHandCooldowns: {},
        graveSlowTimer: 0,
        speedPotionTimer: 0,
        playerElevZ: 0,
        playerSinkKind: null,
        playerWetTimer: 0,
        onHighGround: false,
        inWaterPuddle: false,
        inPoisonSwamp: false,
        inLavaPool: false,
        inFlowerMeadow: false,
        activeTerrainTh: null,
        activeTerrainColor: null,
        lavaPoolTickTimer: 0,
        meadowRegenBuffer: 0,
        landmarks: (() => {
          const kinds: LandmarkKind[] = [
            'abandoned_tower',
            'monster_nest',
            'cursed_statue',
            'sealed_chest',
            'stone_circle',
            'merchant',
            'blood_shrine',
          ];
          const shuffled = [...kinds].sort(() => Math.random() - 0.5);
          const list: MapLandmark[] = [];
          for (let i = 0; i < 5; i++) {
            const k = shuffled[i];
            const ang = (i / 5) * Math.PI * 2 + (Math.random() - 0.5) * 0.45;
            const d = 1500 + Math.random() * 2500;
            list.push({
              id: `lm_init_${i}_${k}`,
              kind: k,
              x: Math.cos(ang) * d,
              y: Math.sin(ang) * d,
              radius: k === 'stone_circle' ? 85 : 78,
              used: false,
              active: false,
              progress: 0,
              maxProgress:
                k === 'abandoned_tower'
                  ? 3
                  : k === 'cursed_statue'
                    ? 2
                    : k === 'sealed_chest'
                      ? 30
                      : k === 'stone_circle'
                        ? 10
                        : 0,
              hp: k === 'monster_nest' ? 380 : 0,
              maxHp: k === 'monster_nest' ? 380 : 0,
              spawnTimer: 1.5,
              hitFlash: 0,
              hitCooldown: 0,
              revealed: false,
            });
          }
          return list;
        })(),
        nextLandmarkTimer: 300,
        landmarkRevealActive: false,
        statueEffect: null,
        merchantCooldown: 0,
        bloodShrineCooldown: 0,
        secretPortal: null,
        nextSecretPortalTimer: 240 + Math.random() * 120,
        inSecretRoom: false,
        secretRoomKind: null,
        secretRoomTimer: 0,
        secretRoomBreakables: [],
        secretRoomExpAccum: 0,
        secretRoomShopOffers: [],
        secretRoomShopOpened: false,
        secretRoomCleared: false,
        savedMainWorld: null,
        godBlessings: {
          reactionBonus: 0,
          areaBonus: 0,
          cdrBonus: 0,
        },
        reactionCount: 0,
        shrinkingRing: null,
        treasureCart: null,
        meteorTelegraphs: [],
        meteorSpawnTimer: 0.7,
        earthSplits: [],
        earthSplitSpawnTimer: 1.0,
        volcanoEruptionTimer: 120,
        volcanoEruptionActive: 0,
        volcanoRockTimer: 0,
        mapEventBannerTimer: 0,
        activeMapEventBanner: null,
        vfx: [],
        packVfx: [],
        castAnimTimer: 0,
        castAnimCooldown: 0,
        castFacingX: 1,
        healSparkleTimer: 0,
      };

      // Push initial Mage orbs & Landmarks out of any procedural obstacles
      const initBiome = getActiveBiome(stageId, 0, 0);
      for (const orb of initialSim.drops) {
        const nearObs = getObstaclesNear(orb.x, orb.y, 120, initialSim.mapSeed, initBiome.themeStyle);
        resolveCircleVsObstacles(orb, 16, nearObs, 0.35);
      }
      for (const lm of initialSim.landmarks) {
        const nearObs = getObstaclesNear(lm.x, lm.y, 160, initialSim.mapSeed, initBiome.themeStyle);
        resolveCircleVsObstacles(lm, lm.radius + 10, nearObs, 0.35);
      }

      simRef.current = initialSim;
    }, [runId, raceId, stageId, starterWeapon]);

    // Input listeners + main 60fps loop
    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const resize = () => {
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = Math.floor(window.innerWidth * dpr);
        canvas.height = Math.floor(window.innerHeight * dpr);
        canvas.style.width = `${window.innerWidth}px`;
        canvas.style.height = `${window.innerHeight}px`;
      };
      resize();
      window.addEventListener('resize', resize);

      const onKeyDown = (e: KeyboardEvent) => {
        const key = e.key.toLowerCase();
        keysRef.current.add(key);
        if (key === 'q' && !e.repeat && screenStateRef.current === 'PLAYING') {
          const sim = simRef.current;
          if (sim && sim.activePotion && !sim.potionUsed) {
            // Trigger active potion via Q key
            const pid = sim.activePotion;
            const pDef = POTIONS[pid];
            if (pDef) {
              sim.potionUsed = true;
              callbacksRef.current.onConsumePotion?.(pid);
              sound.playLevelUp();
              if (pid === 'blood_flask') {
                const healAmt = Math.max(25, Math.round(sim.player.maxHp * 0.5));
                sim.player.hp = Math.min(sim.player.maxHp, sim.player.hp + healAmt);
                sim.floatingTexts.push({
                  x: sim.player.x,
                  y: sim.player.y - 32,
                  vy: -42,
                  text: `ยาฟื้นโลหิต +${healAmt} HP!`,
                  color: pDef.color,
                  life: 1.1,
                  maxLife: 1.1,
                  scale: 1.15,
                });
              } else if (pid === 'holy_water') {
                sim.player.invulnTimer = Math.max(sim.player.invulnTimer, 2.0);
                sim.enemyBullets = [];
                for (const en of sim.enemies) {
                  if (en.hp <= 0 || en.knockbackResist >= 1) continue;
                  const dx = en.x - sim.player.x;
                  const dy = en.y - sim.player.y;
                  const d = Math.hypot(dx, dy) || 1;
                  if (d <= 260) {
                    en.kbVx += (dx / d) * 420 * (1 - en.knockbackResist);
                    en.kbVy += (dy / d) * 420 * (1 - en.knockbackResist);
                  }
                }
                sim.groundFx.push({
                  kind: 'shockwave',
                  x: sim.player.x,
                  y: sim.player.y,
                  radius: 20,
                  maxRadius: 260,
                  life: 0.4,
                  maxLife: 0.4,
                  color: pDef.color,
                });
              } else if (pid === 'greed_elixir') {
                sim.goldDoubleTimer = 60;
              } else if (pid === 'wisdom_draught') {
                sim.xpDoubleTimer = 45;
              } else if (pid === 'fate_powder') {
                sim.fatePowderActive = true;
              }
              sim.announcement = `ดื่ม ${pDef.nameTh}: ${pDef.descTh}`;
              sim.announcementTimer = 3.2;
            }
          }
        }
        if (key === ' ' || e.code === 'Space') {
          if (screenStateRef.current === 'PLAYING') {
            e.preventDefault();
          }
          if (!e.repeat) {
            const sim = simRef.current;
            if (sim) {
              sim.spaceDown = true;
              sim.spaceHoldTime = 0;
              sim.spaceTriggeredUlt = false;
            }
          }
        }
      };
      const onKeyUp = (e: KeyboardEvent) => {
        const key = e.key.toLowerCase();
        keysRef.current.delete(key);
        const sim = simRef.current;
        if ((key === ' ' || e.code === 'Space') && sim) {
          if (sim.spaceDown && !sim.spaceTriggeredUlt) {
            activeSkillRef.current();
          }
          sim.spaceDown = false;
          sim.spaceHoldTime = 0;
          sim.spaceTriggeredUlt = false;
        }
        if (sim && isSpellbladeClass(sim.raceClass) && sim.spellbladeCharge >= 1) {
          chargeReleaseQueuedRef.current = true;
        }
      };
      const onBlur = () => {
        keysRef.current.clear();
        pointerDragRef.current.active = false;
        chargeReleaseQueuedRef.current = false;
        const sim = simRef.current;
        if (sim) {
          sim.spaceDown = false;
          sim.spaceHoldTime = 0;
          sim.spaceTriggeredUlt = false;
          sim.mobileHoldActive = false;
          sim.mobileHoldTime = 0;
          sim.mobileTriggeredUlt = false;
        }
      };

      window.addEventListener('keydown', onKeyDown);
      window.addEventListener('keyup', onKeyUp);
      window.addEventListener('blur', onBlur);

      const onPointerDown = (e: PointerEvent) => {
        if (screenStateRef.current !== 'PLAYING') return;
        pointerDragRef.current = {
          active: true,
          startX: e.clientX,
          startY: e.clientY,
          currX: e.clientX,
          currY: e.clientY,
        };
      };
      const onPointerMove = (e: PointerEvent) => {
        if (!pointerDragRef.current.active) return;
        pointerDragRef.current.currX = e.clientX;
        pointerDragRef.current.currY = e.clientY;
      };
      const onPointerUp = () => {
        pointerDragRef.current.active = false;
        const sim = simRef.current;
        if (sim && isSpellbladeClass(sim.raceClass) && sim.spellbladeCharge >= 1) {
          chargeReleaseQueuedRef.current = true;
        }
      };

      canvas.addEventListener('pointerdown', onPointerDown);
      window.addEventListener('pointermove', onPointerMove);
      window.addEventListener('pointerup', onPointerUp);

      let rafId = 0;
      let lastTime = performance.now();
      let hudEmitAccum = 0;
      let musicSyncAccum = 0;

      const spawnParticles = (
        sim: SimState,
        x: number,
        y: number,
        color: string,
        count: number,
        speed = 110
      ) => {
        if (sim.particles.length > 260) return;
        for (let i = 0; i < count; i++) {
          const a = Math.random() * Math.PI * 2;
          const sp = speed * (0.35 + Math.random() * 0.8);
          sim.particles.push({
            x,
            y,
            vx: Math.cos(a) * sp,
            vy: Math.sin(a) * sp,
            radius: 2 + Math.random() * 2.5,
            life: 0.35 + Math.random() * 0.25,
            maxLife: 0.6,
            color,
          });
        }
      };

      const spawnKnightParticles = (
        sim: SimState,
        x: number,
        y: number,
        color: string,
        count: number,
        speed = 120,
        opts?: {
          isUpward?: boolean;
          shape?: ParticleShape;
          secondaryColor?: string;
          radius?: number;
          life?: number;
          zOffset?: number;
          glow?: boolean;
          vyBias?: number;
        }
      ) => {
        let knightCount = 0;
        for (let i = 0; i < sim.particles.length; i++) {
          if (sim.particles[i].tag === 'knight') knightCount++;
        }
        const room = Math.max(0, 150 - knightCount);
        const spawnCount = Math.min(count, room);
        if (spawnCount <= 0) return;
        for (let i = 0; i < spawnCount; i++) {
          const isUp = Boolean(opts?.isUpward);
          const a = isUp ? -Math.PI * 0.5 + (Math.random() - 0.5) * 0.9 : Math.random() * Math.PI * 2;
          const sp = speed * (0.45 + Math.random() * 0.65);
          const life = opts?.life ?? (0.38 + Math.random() * 0.28);
          sim.particles.push({
            x,
            y,
            vx: Math.cos(a) * sp,
            vy: isUp ? -Math.abs(Math.sin(a) * sp) + (opts?.vyBias ?? -18) : Math.sin(a) * sp + (opts?.vyBias ?? 0),
            radius: opts?.radius ?? (2 + Math.random() * 2),
            life,
            maxLife: life,
            color,
            secondaryColor: opts?.secondaryColor,
            shape: opts?.shape,
            angle: a,
            spin: opts?.shape === 'diamond' ? (Math.random() - 0.5) * 14 : 0,
            zOffset: opts?.zOffset ?? 10,
            glow: opts?.glow,
            tag: 'knight',
            isUpward: isUp,
          });
        }
      };

      const applyKnightHitVisual = (sim: SimState, sourceX = sim.player.x) => {
        if (sim.raceClass !== 'knight') return;
        sim.player.hitFlash = 0.06;
        sim.knightHitKnockbackX = sim.player.x >= sourceX ? 4 : -4;
        sim.knightHitSparkTimer = 0.14;
        spawnKnightParticles(sim, sim.player.x, sim.player.y, '#3b8fd9', 6, 130, {
          shape: 'spark',
          secondaryColor: '#fffbe0',
          radius: 2.2,
          life: 0.2,
          zOffset: 14,
          glow: true,
        });
      };

      const triggerWeaponHitShake = (sim: SimState, duration: number, intensity: number) => {
        if (duration >= sim.shakeTime) sim.shakeMaxTime = duration;
        sim.shakeTime = Math.max(sim.shakeTime, duration);
        sim.shakeIntensity = Math.max(sim.shakeIntensity, intensity);
      };

      const triggerDamageFlash = (sim: SimState, dmgTaken: number) => {
        const hpRatio = dmgTaken / Math.max(1, sim.player.maxHp);
        // Trigger red warning flash when taking significant damage (>= 6% Max HP or >= 8 flat damage)
        if (hpRatio < 0.06 && dmgTaken < 8) return;
        const dur = Math.min(0.36, 0.24 + hpRatio * 0.35);
        const peakAlpha = Math.min(0.42, 0.2 + hpRatio * 0.55);
        if (dur >= sim.damageFlash) sim.damageFlashMax = dur;
        sim.damageFlash = Math.max(sim.damageFlash, dur);
        sim.damageFlashAlpha = Math.max(sim.damageFlashAlpha, peakAlpha);
      };

      const triggerAbilityFlash = (sim: SimState, peakAlpha = 0.2, duration = 0.2) => {
        if (duration >= sim.abilityFlash) sim.abilityFlashMax = duration;
        sim.abilityFlash = Math.max(sim.abilityFlash, duration);
        sim.abilityFlashAlpha = Math.max(sim.abilityFlashAlpha, peakAlpha);
      };

      const triggerCastAnim = (sim: SimState, dirDx?: number) => {
        if (sim.castAnimTimer <= 0 && sim.castAnimCooldown <= 0) {
          sim.castAnimTimer = 0.19;
          sim.castAnimCooldown = 0.4;
          if (dirDx !== undefined && Math.abs(dirDx) > 0.01) {
            sim.castFacingX = dirDx >= 0 ? 1 : -1;
            sim.player.facingX = sim.castFacingX;
          } else {
            sim.castFacingX = sim.player.facingX < 0 ? -1 : 1;
          }
        }
      };

      const triggerUltimateCutin = (
        sim: SimState,
        titleTh: string,
        titleEn: string,
        color: string
      ) => {
        sim.ultSlowTimer = 0.25;
        sim.ultCutinMax = 0.72;
        sim.ultCutinTimer = 0.72;
        sim.ultCutinTitleTh = titleTh;
        sim.ultCutinTitleEn = titleEn;
        sim.ultCutinColor = color;
        sim.ultZoomMax = 0;
        sim.ultZoomTimer = 0;
        triggerWeaponHitShake(sim, 0.22, 5.2);
        triggerAbilityFlash(sim, 0.2, 0.16);
        sound.playUltimateCutin();
      };

      const spawnSheetVfx = (
        sim: SimState,
        vfxId: CraftpixVfxId,
        x: number,
        y: number,
        opts?: {
          size?: number;
          dw?: number;
          dh?: number;
          life?: number;
          angle?: number;
          color?: string;
          loopFps?: number;
          upright?: boolean;
          zOffset?: number;
        }
      ) => {
        if (sim.groundFx.length >= 145) return;
        const meta = VFX_SHEETS[vfxId];
        const size = opts?.size ?? Math.max(96, meta.cellW * 0.72);
        const dw = opts?.dw ?? size;
        const dh = opts?.dh ?? Math.round(dw * (meta.cellH / meta.cellW));
        const life = opts?.life ?? 0.45;
        sim.groundFx.push({
          kind: 'vfx',
          vfxId,
          x,
          y,
          angle: opts?.angle,
          radius: dw * 0.5,
          maxRadius: dw * 0.5,
          dw,
          dh,
          life,
          maxLife: life,
          color: opts?.color ?? '#FDE047',
          loopFps: opts?.loopFps,
          upright: opts?.upright ?? true,
          zOffset: opts?.zOffset ?? 0,
        });
      };

      const absorbPlayerShield = (sim: SimState, rawDmg: number): number => {
        // Dark Moon Altar Row 2A: First hit every 18s (12s Lv2) takes -50% damage
        let adjustedDmg = rawDmg;
        const t = saveRef.current.talents;
        if (t.row2?.branch === 'A' && t.row2.rank > 0 && sim.altarHitShieldCd <= 0) {
          sim.altarHitShieldCd = t.row2.rank >= 3 ? 18 : t.row2.rank === 2 ? 24 : 30;
          adjustedDmg = Math.max(1, Math.round(rawDmg * 0.5));
          sim.floatingTexts.push({
            x: sim.player.x,
            y: sim.player.y - 34,
            vy: -36,
            text: 'เกราะเงาจันทรา -50%',
            color: '#93C5FD',
            life: 0.75,
            maxLife: 0.75,
            scale: 0.95,
          });
        }
        // Knight Bulwark 5-Stack Shield blocks 100% every 5th hit!
        if (sim.raceClass === 'knight' && adjustedDmg > 0) {
          if (sim.knightBulwarkStacks >= 5) {
            sim.knightBulwarkStacks = 0;
            sim.knightBulwarkCrackTimer = 0.14;
            sim.knightFullScreenFlashTimer = 0.03;
            triggerWeaponHitShake(sim, 0.22, 6.2);
            spawnPackVfx(sim.packVfx, 'knight_bulwark_spin', sim.player.x, sim.player.y, { scale: 2.3 });
            spawnSheetVfx(sim, 'divine_shield', sim.player.x, sim.player.y, {
              size: 122,
              life: 0.48,
              zOffset: 16,
            });
            spawnKnightParticles(sim, sim.player.x, sim.player.y, '#3b8fd9', 12, 220, {
              shape: 'diamond',
              secondaryColor: '#ffd75e',
              radius: 3.4,
              life: 0.42,
              zOffset: 16,
              glow: true,
            });
            sound.playKnightBulwarkShatter();
            for (const b of sim.knightSacredBlades) {
              b.state = 'striking';
              b.stateTimer = 0.15;
              b.slashProgress = 0;
              b.targetX = sim.player.x + Math.cos(b.homeAngleOffset) * 115;
              b.targetY = sim.player.y + Math.sin(b.homeAngleOffset) * 115;
            }
            sim.floatingTexts.push({
              x: sim.player.x,
              y: sim.player.y - 34,
              vy: -42,
              text: 'ป้อมปราการศักดิ์สิทธิ์! (กัน 100%)',
              color: '#3b8fd9',
              life: 0.95,
              maxLife: 0.95,
              scale: 1.12,
            });
            return 0;
          } else {
            sim.knightBulwarkStacks = Math.min(5, sim.knightBulwarkStacks + 1);
            if (sim.knightBulwarkStacks === 5) {
              sound.playKnightBulwarkReady();
            }
          }
        }
        // Saint Ultimate 3-hit Shield Ring blocks entire hit
        if (sim.raceClass === 'saint' && sim.saintShieldHits > 0) {
          sim.saintShieldHits -= 1;
          spawnSheetVfx(sim, 'divine_shield', sim.player.x, sim.player.y, {
            size: 112,
            life: 0.44,
            zOffset: 16,
          });
          spawnParticles(sim, sim.player.x, sim.player.y, '#FDE047', 12, 140);
          sim.floatingTexts.push({
            x: sim.player.x,
            y: sim.player.y - 26,
            vy: -42,
            text: `โล่สวรรค์ป้องกัน! (เหลือ ${sim.saintShieldHits})`,
            color: '#FDE047',
            life: 0.85,
            maxLife: 0.85,
            scale: 1.05,
          });
          return 0;
        }
        // Vampire Lord Blood Shield absorbs HP damage first
        if (sim.raceClass === 'vampire_lord' && sim.vampireBloodShield > 0) {
          const absorbed = Math.min(sim.vampireBloodShield, adjustedDmg);
          sim.vampireBloodShield -= absorbed;
          const remaining = Math.max(0, Math.round(adjustedDmg - absorbed));
          if (absorbed > 0 && remaining === 0) {
            sim.floatingTexts.push({
              x: sim.player.x,
              y: sim.player.y - 24,
              vy: -38,
              text: `โล่โลหิตรับ ${Math.round(absorbed)}`,
              color: '#FDA4AF',
              life: 0.65,
              maxLife: 0.65,
              scale: 0.95,
            });
          }
          return remaining;
        }
        // Necromancer Dominion Soul Shield absorbs HP damage first
        if (sim.raceClass === 'death_god' && sim.necroShield > 0 && sim.necroShieldTimer > 0) {
          const absorbed = Math.min(sim.necroShield, adjustedDmg);
          sim.necroShield -= absorbed;
          if (sim.necroShield <= 0) {
            sim.necroShield = 0;
            sim.necroShieldTimer = 0;
          }
          const remaining = Math.max(0, Math.round(adjustedDmg - absorbed));
          if (absorbed > 0 && remaining === 0) {
            sim.floatingTexts.push({
              x: sim.player.x,
              y: sim.player.y - 24,
              vy: -38,
              text: `โล่วิญญาณรับ ${Math.round(absorbed)}`,
              color: '#C084FC',
              life: 0.65,
              maxLife: 0.65,
              scale: 0.95,
            });
          }
          return remaining;
        }
        return adjustedDmg;
      };

      const addFloatingText = (
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
          bounceOutline?: boolean;
        }
      ) => {
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
          bounceOutline: opts?.bounceOutline,
        });
      };

      const FLYING_ENEMY_KINDS = new Set<EnemyKind>([
        'bat',
        'boss_bat_king',
        'boss_lich',
        'boss_wyrm',
        'reaper',
      ]);

      const pushOutOfObstacles = (
        sim: SimState,
        ent: { x: number; y: number },
        radius: number
      ) => {
        if (sim.inSecretRoom) {
          ent.x = Math.max(-SECRET_ROOM_HALF_W + 46, Math.min(SECRET_ROOM_HALF_W - 46, ent.x));
          ent.y = Math.max(-SECRET_ROOM_HALF_H + 46, Math.min(SECRET_ROOM_HALF_H - 46, ent.y));
          resolveCircleVsObstacles(ent, radius, getSecretRoomWallObstacles(), 0.25);
          return;
        }
        const nearPlayer =
          Math.abs(ent.x - sim.player.x) <= 850 && Math.abs(ent.y - sim.player.y) <= 850;
        const obsList = nearPlayer
          ? sim.frameObstacles
          : getObstaclesNear(
              ent.x,
              ent.y,
              Math.max(90, radius + 48),
              sim.mapSeed,
              getActiveBiome(stageId, sim.realmTier, sim.biomeShiftCount).themeStyle
            );
        if (obsList.length > 0) {
          resolveCircleVsObstacles(ent, radius, obsList, 0.25);
        }
      };

      const spawnDrop = (sim: SimState, drop: DropEntity) => {
        pushOutOfObstacles(sim, drop, 16);
        sim.drops.push(drop);
      };

      const spawnLandmarkAt = (
        sim: SimState,
        kind: LandmarkKind,
        x: number,
        y: number
      ): MapLandmark => {
        const pos = { x, y };
        pushOutOfObstacles(sim, pos, 54);
        const lm: MapLandmark = {
          id: `lm_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          kind,
          x: pos.x,
          y: pos.y,
          radius: kind === 'stone_circle' || kind === 'sealed_chest' ? 68 : 54,
          used: false,
          active: false,
          progress: 0,
          maxProgress:
            kind === 'abandoned_tower'
              ? 3
              : kind === 'cursed_statue'
                ? 2
                : kind === 'sealed_chest'
                  ? 30
                  : kind === 'stone_circle'
                    ? 10
                    : 0,
          hp: kind === 'monster_nest' ? 420 + sim.player.level * 48 : 0,
          maxHp: kind === 'monster_nest' ? 420 + sim.player.level * 48 : 0,
          spawnTimer: 1.5,
          hitFlash: 0,
          hitCooldown: 0,
          revealed: false,
        };
        sim.landmarks.push(lm);
        return lm;
      };

      const breakBreakableProp = (sim: SimState, b: BreakableProp) => {
        if (sim.inSecretRoom) {
          const idx = sim.secretRoomBreakables.findIndex((item) => item.id === b.id);
          if (idx === -1) return;
          sim.secretRoomBreakables.splice(idx, 1);
        } else {
          if (sim.brokenTiles.has(b.id)) return;
          sim.brokenTiles.add(b.id);
        }
        delete sim.breakableHits[b.id];
        sound.playBreakProp(b.kind === 'crystal' ? 'crystal' : 'wood');

        const debrisCol =
          b.kind === 'crystal'
            ? '#38BDF8'
            : b.kind === 'coffin'
              ? '#94A3B8'
              : b.kind === 'vase'
                ? '#F59E0B'
                : '#B45309';
        for (let di = 0; di < 8; di++) {
          const ang = (di * Math.PI * 2) / 8 + (Math.random() - 0.5) * 0.45;
          const spd = 75 + Math.random() * 95;
          sim.particles.push({
            x: b.x,
            y: b.y,
            vx: Math.cos(ang) * spd,
            vy: Math.sin(ang) * spd - 35,
            radius: 3.2 + Math.random() * 1.4,
            life: 0.42 + Math.random() * 0.16,
            maxLife: 0.58,
            color: debrisCol,
            secondaryColor: '#FDE047',
            shape: b.kind === 'crystal' ? 'diamond' : 'spark',
            angle: ang,
            spin: (Math.random() - 0.5) * 10,
            drag: 3.2,
            zOffset: 10,
          });
        }

        const roll = Math.random();
        if (roll < 0.4) {
          spawnDrop(sim, {
            kind: 'gold',
            x: b.x,
            y: b.y,
            value: 5 + Math.floor(Math.random() * 11),
            magnetized: false,
          });
        } else if (roll < 0.6) {
          spawnDrop(sim, {
            kind: 'meat',
            x: b.x,
            y: b.y,
            value: Math.max(12, Math.round(sim.player.maxHp * 0.15)),
            magnetized: false,
          });
        } else if (roll < 0.68) {
          spawnDrop(sim, {
            kind: 'magnet',
            x: b.x,
            y: b.y,
            value: 1,
            magnetized: false,
          });
        } else if (roll < 0.71) {
          spawnDrop(sim, {
            kind: 'bomb',
            x: b.x,
            y: b.y,
            value: 1,
            magnetized: false,
          });
        } else if (roll < 0.8) {
          spawnDrop(sim, {
            kind: 'speed_potion',
            x: b.x,
            y: b.y,
            value: 10,
            magnetized: false,
          });
        } else {
          spawnParticles(sim, b.x, b.y, '#CBD5E1', 6, 65);
        }
      };

      const enterSecretRoom = (sim: SimState) => {
        if (sim.inSecretRoom) return;
        const kinds: SecretRoomKind[] = [
          'treasure',
          'elite_arena',
          'secret_shop',
          'cursed_horde',
          'god_blessing',
        ];
        const roomKind = kinds[Math.floor(Math.random() * kinds.length)];
        sim.savedMainWorld = {
          playerX: sim.player.x,
          playerY: sim.player.y,
          enemies: sim.enemies,
          enemyBullets: sim.enemyBullets,
          drops: sim.drops,
          projectiles: sim.projectiles,
          groundFx: sim.groundFx,
          totems: sim.totems,
        };
        sim.inSecretRoom = true;
        sim.secretRoomKind = roomKind;
        sim.secretRoomTimer = 60;
        sim.secretRoomExpAccum = 0;
        sim.secretRoomCleared = false;
        sim.secretRoomShopOpened = false;
        sim.secretRoomBreakables = [];
        sim.secretRoomShopOffers = [];
        sim.secretPortal = null;
        sim.enemies = [];
        sim.enemyBullets = [];
        sim.drops = [];
        sim.projectiles = [];
        sim.groundFx = [];
        sim.chronoWells = [];
        sim.expiredChronoWellCaps = [];
        sim.playerPosHistory = [];
        sim.vfx = [];
        sim.totems = [];
        sim.player.x = 0;
        sim.player.y = 240;
        sim.player.invulnTimer = 1.2;
        sound.playPortalEnter();

        const biome = getActiveBiome(stageId, sim.realmTier, sim.biomeShiftCount);
        const realmMinute = Math.floor(Math.max(0, sim.elapsedSeconds - sim.realmStartSeconds) / 60);

        if (roomKind === 'treasure') {
          sim.drops.push(
            { kind: 'chest', x: -120, y: -40, value: 1, magnetized: false },
            { kind: 'chest', x: 120, y: -40, value: 1, magnetized: false },
            { kind: 'artifact_chest', x: 0, y: -110, value: 1, magnetized: false }
          );
          for (let i = 0; i < 14; i++) {
            const ang = (i * Math.PI * 2) / 14;
            const dist = 210 + (i % 3) * 85;
            sim.secretRoomBreakables.push({
              id: `sr_brk_${i}`,
              x: Math.cos(ang) * dist,
              y: Math.sin(ang) * (dist * 0.72),
              r: 18,
              kind: i % 3 === 0 ? 'crystal' : i % 2 === 0 ? 'barrel' : 'vase',
              variant: i % 3,
            });
          }
          sim.secretRoomCleared = true;
        } else if (roomKind === 'elite_arena') {
          const eliteKinds: EnemyKind[] = ['golem', 'charger', 'cultist'];
          for (let i = 0; i < 3; i++) {
            const ang = -Math.PI / 2 + (i - 1) * 1.1;
            const ex = Math.cos(ang) * 230;
            const ey = Math.sin(ang) * 180 - 60;
            sim.enemies.push(
              createEnemy(sim, eliteKinds[i], ex, ey, realmMinute, biome.hpMult, biome.speedMult, true)
            );
          }
        } else if (roomKind === 'secret_shop') {
          const allArtIds = Object.keys(ARTIFACTS) as ArtifactId[];
          const pool = allArtIds.filter((id) => !Object.values(sim.artifacts).includes(id));
          const picks = (pool.length >= 3 ? pool : allArtIds)
            .slice()
            .sort(() => Math.random() - 0.5)
            .slice(0, 3);
          sim.secretRoomShopOffers = picks.map((id, idx) => {
            const art = ARTIFACTS[id];
            return {
              id,
              nameTh: art.nameTh,
              descTh: `${art.prosTh} (${art.consTh})`,
              color: art.color,
              price: 160 + idx * 40,
              owned: Object.values(sim.artifacts).includes(id),
            };
          });
          sim.secretRoomCleared = true;
        } else if (roomKind === 'cursed_horde') {
          sim.announcement = 'ห้องคำสาปมรณะ: เอาชีวิตรอด 45 วิ รับโบนัส EXP ×3!';
          sim.announcementTimer = 4.5;
        } else if (roomKind === 'god_blessing') {
          sim.secretRoomCleared = true;
        }
        addFloatingText(sim, 0, 175, SECRET_ROOM_NAMES_TH[roomKind], '#E879F9', 1.3);
      };

      const exitSecretRoom = (sim: SimState) => {
        if (!sim.inSecretRoom) return;
        const saved = sim.savedMainWorld;
        sim.inSecretRoom = false;
        sim.secretRoomKind = null;
        sim.secretRoomBreakables = [];
        sim.secretRoomShopOffers = [];
        sim.secretRoomShopOpened = false;
        if (saved) {
          sim.player.x = saved.playerX;
          sim.player.y = saved.playerY;
          sim.enemies = saved.enemies;
          sim.enemyBullets = saved.enemyBullets;
          sim.drops = saved.drops;
          sim.projectiles = saved.projectiles;
          sim.groundFx = saved.groundFx;
          sim.totems = saved.totems;
        }
        sim.savedMainWorld = null;
        sim.chronoWells = [];
        sim.expiredChronoWellCaps = [];
        sim.playerPosHistory = [];
        sim.vfx = [];
        sim.player.invulnTimer = 1.6;
        sound.playPortalEnter();
        addFloatingText(sim, sim.player.x, sim.player.y - 32, 'กลับสู่แผนที่หลัก!', '#34D399', 1.25);
      };

      const grantInstantLevelUp = (sim: SimState, reasonText?: string) => {
        sim.player.level += 1;
        sim.player.xp = 0;
        sim.player.xpToNext = Math.round(
          22 + sim.player.level * 14 + Math.pow(sim.player.level, 1.55) * 3.8
        );
        if (sim.player.level >= sim.nextArtifactLevel) {
          sim.nextArtifactLevel += sim.player.level < 12 ? 4 : sim.player.level < 22 ? 5 : 6;
          const ang = Math.random() * Math.PI * 2;
          spawnDrop(sim, {
            kind: 'artifact_chest',
            x: sim.player.x + Math.cos(ang) * 62,
            y: sim.player.y + Math.sin(ang) * 62,
            value: 1,
            magnetized: false,
          });
        }
        if (raceId === 'orc') {
          sim.orcLevelHpBonus += 15;
          computeStats(sim);
          applyPlayerHeal(sim, 20);
        }
        if (reasonText) {
          addFloatingText(sim, sim.player.x, sim.player.y - 36, reasonText, '#34D399', 1.2);
        }
        sound.playLevelUp();
        const choices = generateLevelUpDraft(
          raceId,
          sim.weapons,
          sim.relics,
          sim.magePerks,
          buildDraftOptions(sim)
        );
        presentLevelUpDraft(sim, choices);
      };

      const triggerBombBarrelExplosion = (
        sim: SimState,
        trap: MapTrap,
        stats: ReturnType<typeof computeStats>
      ) => {
        const existing = sim.trapStates[trap.id];
        if (existing?.used) return;
        sim.trapStates[trap.id] = {
          used: true,
          cooldown: 0,
          activeTimer: 0,
          shockTickTimer: 0,
          hitCooldown: 0.4,
        };
        const blastR = 140;
        sim.groundFx.push({
          kind: 'explosion',
          x: trap.x,
          y: trap.y,
          radius: 18,
          maxRadius: blastR,
          life: 0.42,
          maxLife: 0.42,
          color: '#EF4444',
        });
        spawnVfx(sim.vfx, 'explosion_fire', trap.x, trap.y, { scale: blastR / 40 });
        spawnParticles(sim, trap.x, trap.y, '#F97316', 20, 210);
        sim.shakeTime = Math.max(sim.shakeTime, 0.22);
        sim.shakeIntensity = Math.max(sim.shakeIntensity, 7);
        sound.playEnemyKill(false);
        for (const e of sim.enemies) {
          if (e.hp <= 0) continue;
          if (Math.hypot(e.x - trap.x, e.y - trap.y) <= blastR + e.radius) {
            const barrelDmg = e.isBoss
              ? Math.max(120, Math.round(e.maxHp * 0.12))
              : Math.max(80, Math.round(e.maxHp * 5));
            damageEnemy(sim, e, barrelDmg, null, 220, e.x - trap.x, e.y - trap.y, stats.greedMult);
          }
        }
        if (
          Math.hypot(sim.player.x - trap.x, sim.player.y - trap.y) <= blastR &&
          sim.player.invulnTimer <= 0 &&
          sim.mageBarrierTimer <= 0
        ) {
          const rawSelfDmg = Math.max(1, Math.round(sim.player.maxHp * 0.15));
          const dmgTaken = absorbPlayerShield(sim, rawSelfDmg);
          if (dmgTaken > 0) {
            sim.player.hp -= dmgTaken;
            sim.lastDamageFromReaper = false;
            sim.noDamageTimer = 0;
            sim.lastDamageSourceTh = 'แรงระเบิดถังดินปืน';
            breakCombo(sim);
            triggerDamageFlash(sim, dmgTaken);
            sim.player.invulnTimer = 0.45;
            sim.player.hitFlash = 0.16;
            applyKnightHitVisual(sim, trap.x);
            sound.playPlayerHit();
            addFloatingText(sim, sim.player.x, sim.player.y - 20, `-${dmgTaken}`, '#FB7185', 1.15);
          }
        }
      };

      const triggerWetLightningChain = (
        sim: SimState,
        originX: number,
        originY: number,
        dmg: number,
        stats: ReturnType<typeof computeStats>,
        alreadyHit: Set<number>,
        depth = 0
      ) => {
        if (depth >= 2) return;
        let chains = 0;
        for (const en of sim.enemies) {
          if (chains >= 4) break;
          if (en.hp <= 0 || alreadyHit.has(en.id) || !(en.wetTimer && en.wetTimer > 0)) continue;
          if (Math.hypot(en.x - originX, en.y - originY) <= 185 + en.radius) {
            alreadyHit.add(en.id);
            chains += 1;
            sim.groundFx.push({
              kind: 'beam',
              x: originX,
              y: originY,
              x2: en.x,
              y2: en.y,
              radius: 6,
              maxRadius: 6,
              life: 0.2,
              maxLife: 0.2,
              color: '#38BDF8',
            });
            spawnSheetVfx(sim, 'holy_smite', en.x, en.y, { size: 118, life: 0.36 });
            damageEnemy(sim, en, dmg * 0.75, 'lightning', 20, en.x - originX, en.y - originY, stats.greedMult);
            triggerWetLightningChain(sim, en.x, en.y, dmg * 0.75, stats, alreadyHit, depth + 1);
          }
        }
      };

      const hitWorldTargetsInCircle = (
        sim: SimState,
        cx: number,
        cy: number,
        radius: number,
        dmg: number,
        stats: ReturnType<typeof computeStats>,
        allowTriggerTraps = true
      ) => {
        const breakables = sim.inSecretRoom ? sim.secretRoomBreakables : sim.frameBreakables;
        for (let bi = breakables.length - 1; bi >= 0; bi--) {
          const b = breakables[bi];
          if ((sim.propHitCooldowns[b.id] ?? 0) > 0) continue;
          if (Math.hypot(b.x - cx, b.y - cy) <= radius + b.r) {
            sim.propHitCooldowns[b.id] = 0.12;
            const hits = (sim.breakableHits[b.id] || 0) + 1;
            sim.breakableHits[b.id] = hits;
            spawnParticles(sim, b.x, b.y, '#FDE047', 4, 70);
            if (hits >= 3) {
              breakBreakableProp(sim, b);
            }
          }
        }

        if (!sim.inSecretRoom && allowTriggerTraps) {
          for (const t of sim.frameTraps) {
            const st = sim.trapStates[t.id];
            if (Math.hypot(t.x - cx, t.y - cy) > radius + t.r) continue;
            if (t.kind === 'bomb_barrel' && !st?.used) {
              triggerBombBarrelExplosion(sim, t, stats);
            } else if (t.kind === 'lightning_pillar' && (!st || (st.cooldown <= 0 && st.activeTimer <= 0))) {
              sim.trapStates[t.id] = {
                used: false,
                cooldown: 30,
                activeTimer: 5.0,
                shockTickTimer: 0,
                hitCooldown: 0.2,
              };
              sound.playLightning();
              addFloatingText(sim, t.x, t.y - 36, 'เสาสายฟ้าทำงาน! (5 วิ)', '#38BDF8', 1.05);
            } else if (t.kind === 'ritual_brazier' && !st?.used) {
              sim.trapStates[t.id] = {
                used: true,
                cooldown: 0,
                activeTimer: 4.0,
                shockTickTimer: 0,
                hitCooldown: 0.2,
              };
              const ang = Math.atan2(t.y - sim.player.y, t.x - sim.player.x);
              sim.ritualFireLines.push({
                x1: t.x,
                y1: t.y,
                x2: t.x + Math.cos(ang) * 300,
                y2: t.y + Math.sin(ang) * 300,
                life: 4.0,
                tickTimer: 0.15,
              });
              sound.playMagicCast();
              addFloatingText(sim, t.x, t.y - 30, 'เพลิงพิธีกรรม 300px!', '#FB923C', 1.05);
            }
          }

          for (const lm of sim.landmarks) {
            if (lm.kind !== 'monster_nest' || lm.used || lm.hitCooldown > 0) continue;
            if (Math.hypot(lm.x - cx, lm.y - cy) <= radius + lm.radius) {
              lm.hitCooldown = 0.12;
              lm.hitFlash = 0.14;
              lm.hp = Math.max(0, lm.hp - Math.max(10, dmg));
              spawnParticles(sim, lm.x, lm.y, '#F43F5E', 5, 95);
              if (lm.hp <= 0) {
                lm.used = true;
                const nestGold = sim.elapsedSeconds > 1800 ? 40 : 80;
                sim.goldEarned += nestGold;
                sim.goldBreakdown.quests += nestGold;
                spawnDrop(sim, { kind: 'chest', x: lm.x, y: lm.y, value: 1, magnetized: false });
                sound.playBossChest();
                addFloatingText(sim, lm.x, lm.y - 34, `ทำลายรังมอน! +${nestGold} ทอง & หีบ!`, '#FBBF24', 1.2);
              }
            }
          }

          const biome = getActiveBiome(stageId, sim.realmTier, sim.biomeShiftCount);
          const realmMinute = Math.floor(Math.max(0, sim.elapsedSeconds - sim.realmStartSeconds) / 60);
          for (const o of sim.frameObstacles) {
            if (!o.hasGlowingEyes || sim.awakenedTrees.has(o.id)) continue;
            if (Math.hypot(o.x - cx, o.y - cy) <= radius + o.r) {
              sim.awakenedTrees.add(o.id);
              const treeMob = createEnemy(sim, 'golem', o.x, o.y + o.r + 24, realmMinute, biome.hpMult, biome.speedMult, true);
              treeMob.nameTh = 'วิญญาณต้นไม้โบราณ';
              pushOutOfObstacles(sim, treeMob, treeMob.radius);
              sim.enemies.push(treeMob);
              sim.groundFx.push({
                kind: 'warp',
                x: treeMob.x,
                y: treeMob.y,
                radius: 12,
                maxRadius: 56,
                life: 0.4,
                maxLife: 0.4,
                color: '#EF4444',
              });
              addFloatingText(sim, o.x, o.y - 44, 'ต้นไม้ปีศาจตื่นขึ้น!', '#FB7185', 1.15);
            }
          }

          if (sim.treasureCart && sim.treasureCart.hp > 0 && sim.treasureCart.hitFlash <= 0) {
            const tc = sim.treasureCart;
            if (Math.hypot(tc.x - cx, tc.y - cy) <= radius + 34) {
              tc.hitFlash = 0.1;
              tc.hp = Math.max(0, tc.hp - Math.max(12, dmg));
              spawnParticles(sim, tc.x, tc.y, '#FACC15', 5, 110);
              if (Math.random() < 0.45) {
                spawnDrop(sim, { kind: 'gold', x: tc.x, y: tc.y, value: 8, magnetized: false });
              }
              if (tc.hp <= 0) {
                spawnDrop(sim, { kind: 'gold_pouch', x: tc.x, y: tc.y, value: 120, magnetized: false });
                spawnDrop(sim, { kind: 'chest', x: tc.x + 24, y: tc.y, value: 1, magnetized: false });
                sound.playBossChest();
                addFloatingText(sim, tc.x, tc.y - 34, 'ปล้นเกวียนสมบัติสำเร็จ!', '#FDE047', 1.25);
                sim.treasureCart = null;
                if (sim.mapEvent === 'treasure_cart') {
                  sim.mapEvent = null;
                  sim.nextMapEventTimer = 18 + Math.random() * 10;
                }
              }
            }
          }
        }
      };

      const hitWorldTargetsOnSegment = (
        sim: SimState,
        x1: number,
        y1: number,
        x2: number,
        y2: number,
        halfW: number,
        dmg: number,
        stats: ReturnType<typeof computeStats>
      ) => {
        const steps = 4;
        for (let s = 1; s <= steps; s++) {
          const t = s / steps;
          hitWorldTargetsInCircle(sim, x1 + (x2 - x1) * t, y1 + (y2 - y1) * t, halfW + 24, dmg, stats);
        }
      };

      const createEnemy = (
        sim: SimState,
        kind: EnemyKind,
        x: number,
        y: number,
        realmMinute: number,
        biomeHpMult: number,
        biomeSpeedMult = 1,
        isElite = false
      ): EnemyEntity => {
        const id = sim.nextEnemyId++;
        const levelPressure = Math.max(0, sim.player.level - 10) * 0.045;
        // นาทีสำหรับคำนวณความแกร่ง: นับต่อเนื่องข้าม realm (หลังฆ่ายมทูตจะไม่รีเซ็ตกลับไปอ่อน)
        const scaleMinute = realmMinute + sim.realmTier * BALANCE.realmMinuteCarry;
        const lateMinutes = Math.max(0, scaleMinute - BALANCE.growthStartMinute);
        const curses = saveRef.current.activeCurses;
        const curseHpMult = 1 + (curses.enemy_hp || 0) * 0.15;
        const curseDmgMult = 1 + (curses.enemy_dmg || 0) * 0.12;
        const curseSpdMult = 1 + (curses.enemy_speed || 0) * 0.08;

        const scale =
          (1 + scaleMinute * 0.42 + Math.pow(scaleMinute, 1.38) * 0.095 + levelPressure) *
          Math.pow(BALANCE.enemyHpGrowthPerMin, lateMinutes) *
          biomeHpMult *
          curseHpMult;
        const enemyDmgScale = Math.pow(BALANCE.enemyDmgGrowthPerMin, lateMinutes) * curseDmgMult;

        const buildEnemy = (base: Omit<EnemyEntity, 'buffs' | 'buffTimer' | 'buffCycle' | 'berserkActive'>): EnemyEntity => {
          const buffs = base.isBoss
            ? pickBossBuffs(realmMinute, sim.realmTier, base.isMajorBoss, base.isReaper)
            : [];
          if (base.isBoss && (curses.frenzy_boss || 0) > 0 && !buffs.includes('frenzy')) {
            buffs.push('frenzy');
          }
          const lateSpeedMult = 1 + Math.min(0.28, realmMinute * 0.012);
          let speed = base.speed * biomeSpeedMult * lateSpeedMult * curseSpdMult;
          let armorRatio = base.armorRatio;
          // Late-game knockback resistance scaling so mobs hold formation later in runs
          const lateKbBonus = Math.min(0.72, realmMinute * 0.024 + sim.realmTier * 0.14);
          const knockbackResist =
            base.knockbackResist >= 1
              ? 1
              : Math.min(0.96, base.knockbackResist + (1 - base.knockbackResist) * lateKbBonus);
          if (buffs.includes('frenzy')) speed *= 1.3;
          if (buffs.includes('iron_skin')) armorRatio = Math.min(0.76, armorRatio + 0.16);

          const eliteApplied = isElite && !base.isBoss;
          const hp = eliteApplied ? base.hp * 3.2 : base.hp;
          const maxHp = eliteApplied ? base.maxHp * 3.2 : base.maxHp;
          const radius = eliteApplied ? Math.round(base.radius * 1.28) : base.radius;
          if (eliteApplied) speed *= 1.25;
          const damage = base.damage * enemyDmgScale * (eliteApplied ? 1.35 : 1);
          const xpValue = eliteApplied ? base.xpValue * 4 : base.xpValue;
          const nameTh = eliteApplied
            ? `อีลิท: ${BESTIARY_BY_KIND[base.kind]?.nameTh || base.kind}`
            : base.nameTh;

          const bossMaxStagger = base.isBoss
            ? Math.max(240, Math.round(maxHp * (base.isReaper ? 0.14 : base.isMajorBoss ? 0.22 : 0.26)))
            : undefined;
          return {
            ...base,
            nameTh,
            isElite: eliteApplied,
            hp,
            maxHp,
            radius,
            xpValue,
            damage,
            speed,
            armorRatio,
            knockbackResist,
            buffs,
            buffTimer: 2.0,
            buffCycle: 0,
            berserkActive: false,
            ...(base.isBoss
              ? {
                  stagger: 0,
                  maxStagger: bossMaxStagger,
                  staggerTimer: 0,
                  staggerImmuneTimer: 0,
                  dpsCapWindowStart: undefined,
                  dpsCapWindowDmg: 0,
                }
              : {}),
          };
        };

        switch (kind) {
          case 'slime':
            return buildEnemy({
              id,
              kind,
              x,
              y,
              vx: 0,
              vy: 0,
              radius: 13,
              hp: 18 * scale,
              maxHp: 18 * scale,
              speed: 78 + realmMinute * 1.4,
              damage: 8 + realmMinute * 0.8 + sim.realmTier * 4,
              armorRatio: 0,
              knockbackResist: 0.1,
              kbVx: 0,
              kbVy: 0,
              hitFlash: 0,
              isBoss: false,
              isMajorBoss: false,
              isReaper: false,
              xpValue: 2,
              goldChance: 0.14,
              aiTimer: 0,
              windupTimer: 0,
              phaseAngle: Math.random() * Math.PI * 2,
              behaviorMode: 'chase',
            });
          case 'goblin':
            return buildEnemy({
              id,
              kind,
              x,
              y,
              vx: 0,
              vy: 0,
              radius: 14,
              hp: 26 * scale,
              maxHp: 26 * scale,
              speed: 102 + realmMinute * 1.6,
              damage: 11 + realmMinute * 0.9 + sim.realmTier * 5,
              armorRatio: 0,
              knockbackResist: 0.15,
              kbVx: 0,
              kbVy: 0,
              hitFlash: 0,
              isBoss: false,
              isMajorBoss: false,
              isReaper: false,
              xpValue: 3,
              goldChance: 0.18,
              aiTimer: 0,
              windupTimer: 0,
              phaseAngle: 0,
              behaviorMode: 'chase',
            });
          case 'bat':
            return buildEnemy({
              id,
              kind,
              x,
              y,
              vx: 0,
              vy: 0,
              radius: 12,
              hp: 15 * scale,
              maxHp: 15 * scale,
              speed: 155 + realmMinute * 1.5,
              damage: 9 + realmMinute * 0.7 + sim.realmTier * 4,
              armorRatio: 0,
              knockbackResist: 0,
              kbVx: 0,
              kbVy: 0,
              hitFlash: 0,
              isBoss: false,
              isMajorBoss: false,
              isReaper: false,
              xpValue: 2,
              goldChance: 0.15,
              aiTimer: 0,
              windupTimer: 0,
              phaseAngle: Math.random() * 6,
              behaviorMode: 'swoop',
            });
          case 'flower':
            return buildEnemy({
              id,
              kind,
              x,
              y,
              vx: 0,
              vy: 0,
              radius: 15,
              hp: 34 * scale,
              maxHp: 34 * scale,
              speed: 58,
              damage: 13 + realmMinute * 1.0 + sim.realmTier * 5,
              armorRatio: 0,
              knockbackResist: 0.45,
              kbVx: 0,
              kbVy: 0,
              hitFlash: 0,
              isBoss: false,
              isMajorBoss: false,
              isReaper: false,
              xpValue: 4,
              goldChance: 0.22,
              aiTimer: 0,
              windupTimer: 0,
              phaseAngle: 0,
              behaviorMode: 'constrict',
            });
          case 'golem':
            return buildEnemy({
              id,
              kind,
              x,
              y,
              vx: 0,
              vy: 0,
              radius: 22,
              hp: 95 * scale,
              maxHp: 95 * scale,
              speed: 52 + realmMinute * 0.7,
              damage: 18 + realmMinute * 1.3 + sim.realmTier * 7,
              armorRatio: 0.2,
              knockbackResist: 0.75,
              kbVx: 0,
              kbVy: 0,
              hitFlash: 0,
              isBoss: false,
              isMajorBoss: false,
              isReaper: false,
              xpValue: 7,
              goldChance: 0.35,
              aiTimer: 0,
              windupTimer: 0,
              phaseAngle: 0,
              behaviorMode: 'chase',
            });
          case 'cultist':
            return buildEnemy({
              id,
              kind,
              x,
              y,
              vx: 0,
              vy: 0,
              radius: 15,
              hp: 40 * scale,
              maxHp: 40 * scale,
              speed: 74,
              damage: 12 + realmMinute * 1.1 + sim.realmTier * 5,
              armorRatio: 0,
              knockbackResist: 0.2,
              kbVx: 0,
              kbVy: 0,
              hitFlash: 0,
              isBoss: false,
              isMajorBoss: false,
              isReaper: false,
              xpValue: 5,
              goldChance: 0.28,
              aiTimer: 1.5 + Math.random() * 1.5,
              windupTimer: 0,
              phaseAngle: 0,
              behaviorMode: 'ranged',
            });
          case 'stalker':
            return buildEnemy({
              id,
              kind,
              x,
              y,
              vx: 0,
              vy: 0,
              radius: 14,
              hp: 48 * scale,
              maxHp: 48 * scale,
              speed: 138 + realmMinute * 1.5,
              damage: 16 + realmMinute * 1.2 + sim.realmTier * 6,
              armorRatio: 0.05,
              knockbackResist: 0.25,
              kbVx: 0,
              kbVy: 0,
              hitFlash: 0,
              isBoss: false,
              isMajorBoss: false,
              isReaper: false,
              xpValue: 6,
              goldChance: 0.3,
              aiTimer: 0,
              windupTimer: 0,
              phaseAngle: 0,
              behaviorMode: 'chase',
            });
          case 'archer':
            return buildEnemy({
              id,
              kind,
              x,
              y,
              vx: 0,
              vy: 0,
              radius: 14,
              hp: 25 * scale,
              maxHp: 25 * scale,
              speed: 84 + realmMinute * 0.8,
              damage: 13 + realmMinute * 1.0 + sim.realmTier * 5,
              armorRatio: 0,
              knockbackResist: 0.15,
              kbVx: 0,
              kbVy: 0,
              hitFlash: 0,
              isBoss: false,
              isMajorBoss: false,
              isReaper: false,
              xpValue: 4,
              goldChance: 0.24,
              aiTimer: 1.3 + Math.random() * 1.1,
              windupTimer: 0,
              phaseAngle: Math.random() * Math.PI * 2,
              behaviorMode: 'sniper',
            });
          case 'zealot':
            return buildEnemy({
              id,
              kind,
              x,
              y,
              vx: 0,
              vy: 0,
              radius: 15,
              hp: 30 * scale,
              maxHp: 30 * scale,
              speed: 148 + realmMinute * 1.4,
              damage: 24 + realmMinute * 1.4 + sim.realmTier * 7,
              armorRatio: 0.05,
              knockbackResist: 1.0, // Completely immune to skill knockback!
              kbVx: 0,
              kbVy: 0,
              hitFlash: 0,
              isBoss: false,
              isMajorBoss: false,
              isReaper: false,
              xpValue: 5,
              goldChance: 0.26,
              aiTimer: 0,
              windupTimer: 0,
              phaseAngle: Math.random() * 6,
              behaviorMode: 'zealot',
            });
          case 'charger':
            return buildEnemy({
              id,
              kind,
              x,
              y,
              vx: 0,
              vy: 0,
              radius: 18,
              hp: 62 * scale,
              maxHp: 62 * scale,
              speed: 80 + realmMinute * 0.9,
              damage: 19 + realmMinute * 1.2 + sim.realmTier * 6,
              armorRatio: 0.24,
              knockbackResist: 0.65,
              kbVx: 0,
              kbVy: 0,
              hitFlash: 0,
              isBoss: false,
              isMajorBoss: false,
              isReaper: false,
              xpValue: 6,
              goldChance: 0.3,
              aiTimer: 2.0 + Math.random() * 1.2,
              windupTimer: 0,
              phaseAngle: 0,
              behaviorMode: 'charger',
            });
          case 'trapper':
            return buildEnemy({
              id,
              kind,
              x,
              y,
              vx: 0,
              vy: 0,
              radius: 15,
              hp: 42 * scale,
              maxHp: 42 * scale,
              speed: 112 + realmMinute * 1.2,
              damage: 11 + realmMinute * 0.9 + sim.realmTier * 5,
              armorRatio: 0.05,
              knockbackResist: 0.3,
              kbVx: 0,
              kbVy: 0,
              hitFlash: 0,
              isBoss: false,
              isMajorBoss: false,
              isReaper: false,
              xpValue: 6,
              goldChance: 0.32,
              aiTimer: 1.8 + Math.random() * 1.2,
              windupTimer: 0,
              phaseAngle: Math.random() * 6,
              behaviorMode: 'trapper',
            });
          case 'shielder':
            return buildEnemy({
              id,
              kind,
              x,
              y,
              vx: 0,
              vy: 0,
              radius: 19,
              hp: 84 * scale,
              maxHp: 84 * scale,
              speed: 68 + realmMinute * 0.8,
              damage: 15 + realmMinute * 1.1 + sim.realmTier * 6,
              armorRatio: 0.45,
              knockbackResist: 0.78,
              kbVx: 0,
              kbVy: 0,
              hitFlash: 0,
              isBoss: false,
              isMajorBoss: false,
              isReaper: false,
              xpValue: 7,
              goldChance: 0.34,
              aiTimer: 0,
              windupTimer: 0,
              phaseAngle: 0,
              behaviorMode: 'shielder',
            });
          case 'bomber':
            return buildEnemy({
              id,
              kind,
              x,
              y,
              vx: 0,
              vy: 0,
              radius: 14,
              hp: 24 * scale,
              maxHp: 24 * scale,
              speed: 142 + realmMinute * 1.4,
              damage: 22 + realmMinute * 1.4 + sim.realmTier * 7,
              armorRatio: 0,
              knockbackResist: 0.22,
              kbVx: 0,
              kbVy: 0,
              hitFlash: 0,
              isBoss: false,
              isMajorBoss: false,
              isReaper: false,
              xpValue: 5,
              goldChance: 0.25,
              aiTimer: 0,
              windupTimer: 0,
              phaseAngle: Math.random() * 6,
              behaviorMode: 'bomber',
            });
          case 'miniboss_warden':
          case 'miniboss_blossom':
            return buildEnemy({
              id,
              kind,
              nameTh: kind === 'miniboss_warden' ? 'มินิบอส: อัศวินโครงกระดูก' : 'มินิบอส: ดอกไม้นรกยักษ์',
              x,
              y,
              vx: 0,
              vy: 0,
              radius: 29,
              hp: 850 * scale,
              maxHp: 850 * scale,
              speed: 96,
              damage: 24 + realmMinute * 1.4 + sim.realmTier * 9,
              armorRatio: 0.18,
              knockbackResist: 0.92,
              kbVx: 0,
              kbVy: 0,
              hitFlash: 0,
              isBoss: true,
              isMajorBoss: false,
              isReaper: false,
              xpValue: 45,
              goldChance: 1,
              aiTimer: 2.8,
              windupTimer: 0,
              phaseAngle: 0,
              behaviorMode: 'boss',
            });
          case 'boss_cerberus':
            return buildEnemy({
              id,
              kind,
              nameTh: 'มินิบอสแฝดสาม: เซอร์เบอรัส',
              x,
              y,
              vx: 0,
              vy: 0,
              radius: 26,
              hp: 460 * scale,
              maxHp: 460 * scale,
              speed: 132,
              damage: 25 + realmMinute * 1.4 + sim.realmTier * 9,
              armorRatio: 0.16,
              knockbackResist: 0.9,
              kbVx: 0,
              kbVy: 0,
              hitFlash: 0,
              isBoss: true,
              isMajorBoss: false,
              isReaper: false,
              xpValue: 35,
              goldChance: 1,
              aiTimer: 2.0 + Math.random() * 0.6,
              windupTimer: 0,
              phaseAngle: Math.random() * 6,
              behaviorMode: 'boss',
            });
          case 'boss_bat_king':
          case 'boss_colossus':
          case 'boss_lich':
          case 'boss_wyrm':
          case 'boss_judgement':
          case 'boss_beelzebub':
          case 'boss_lucifer': {
            const bossNames: Record<string, string> = {
              boss_bat_king: 'บอส: ราชาค้างคาวรัตติกาล',
              boss_judgement: 'บอส: ผู้พิพากษาสูงสุด จัสเมนต์',
              boss_colossus: 'บอส: โกเลมศิลาโบราณ',
              boss_beelzebub: 'บอส: ราชินีแมลงวันอเวจี บีลเซบับ',
              boss_lich: 'บอส: จอมเวทย์เนโครแมนเซอร์',
              boss_wyrm: 'บอส: มังกรอเวจี',
              boss_lucifer: 'มหาบอส: ราชินีแห่งนรก ลูซิเฟอร์',
            };
            const bossHp =
              kind === 'boss_lucifer'
                ? 3600 * scale
                : kind === 'boss_beelzebub'
                  ? 2800 * scale
                  : kind === 'boss_judgement'
                    ? 2350 * scale
                    : 2600 * scale;
            const bossSpeed =
              kind === 'boss_colossus'
                ? 85
                : kind === 'boss_lucifer'
                  ? 124
                  : kind === 'boss_judgement'
                    ? 120
                    : 115;
            const bossArmor =
              kind === 'boss_colossus'
                ? 0.35
                : kind === 'boss_lucifer'
                  ? 0.28
                  : kind === 'boss_judgement'
                    ? 0.24
                    : 0.22;
            return buildEnemy({
              id,
              kind,
              nameTh: bossNames[kind],
              x,
              y,
              vx: 0,
              vy: 0,
              radius: kind === 'boss_lucifer' ? 40 : 38,
              hp: bossHp,
              maxHp: bossHp,
              speed: bossSpeed,
              damage:
                (kind === 'boss_lucifer' ? 40 : kind === 'boss_judgement' ? 35 : 32) +
                realmMinute * 1.65 +
                sim.realmTier * 12,
              armorRatio: bossArmor,
              knockbackResist: 0.96,
              kbVx: 0,
              kbVy: 0,
              hitFlash: 0,
              isBoss: true,
              isMajorBoss: true,
              isReaper: false,
              xpValue: kind === 'boss_lucifer' ? 190 : 125,
              goldChance: 1,
              aiTimer: kind === 'boss_lucifer' ? 1.9 : 2.3,
              windupTimer: 0,
              phaseAngle: 0,
              behaviorMode: 'boss',
            });
          }
          case 'reaper':
          default:
            return buildEnemy({
              id,
              kind: 'reaper',
              nameTh:
                sim.realmTier > 0
                  ? `The Reaper · จอมยมทูตระดับ ${sim.realmTier + 1}`
                  : 'The Reaper · มัจจุราชยมทูต',
              x,
              y,
              vx: 0,
              vy: 0,
              radius: 44,
              hp: 45000 * biomeHpMult,
              maxHp: 45000 * biomeHpMult,
              speed: 192,
              damage: 65 + sim.realmTier * 18,
              armorRatio: 0.65,
              knockbackResist: 0.99,
              kbVx: 0,
              kbVy: 0,
              hitFlash: 0,
              isBoss: true,
              isMajorBoss: true,
              isReaper: true,
              xpValue: 500,
              goldChance: 1,
              aiTimer: 1.6,
              windupTimer: 0,
              phaseAngle: 0,
              behaviorMode: 'boss',
            });
        }
      };

      // ===== Combo: ตีโดนติดต่อกันโดยไม่โดนดาเมจ =====
      const registerComboHit = (sim: SimState) => {
        const combo = (sim.combo || 0) + 1;
        sim.combo = combo;
        if (combo > (sim.comboBest || 0)) sim.comboBest = combo;
        const milestones = BALANCE.comboMilestones;
        let reached = 0;
        let tier = 0;
        for (let i = 0; i < milestones.length; i++) {
          if (combo >= milestones[i]) {
            reached = milestones[i];
            tier = i + 1;
          }
        }
        if (reached > (sim.comboMilestone || 0)) {
          sim.comboMilestone = reached;
          sim.comboMilestoneId = (sim.comboMilestoneId || 0) + 1;
          const primaryCol =
            tier >= 5
              ? '#22D3EE'
              : tier === 4
                ? '#E879F9'
                : tier === 3
                  ? '#F43F5E'
                  : tier === 2
                    ? '#FB923C'
                    : '#FBBF24';
          const secondaryCol =
            tier >= 5
              ? '#FFFFFF'
              : tier === 4
                ? '#F5D0FE'
                : tier === 3
                  ? '#FDA4AF'
                  : tier === 2
                    ? '#FDE68A'
                    : '#FEF08A';

          addFloatingText(
            sim,
            sim.player.x,
            sim.player.y - 46,
            `COMBO ${reached}x!`,
            primaryCol,
            1.35 + Math.min(0.6, tier * 0.1)
          );

          // Combo Milestone Visual Burst: shockwave + magic circle + starburst particles + flash/shake
          const px = sim.player.x;
          const py = sim.player.y;
          sim.groundFx.push({
            kind: 'shockwave',
            x: px,
            y: py,
            radius: 16,
            maxRadius: 115 + Math.min(120, tier * 20),
            life: 0.48,
            maxLife: 0.48,
            color: primaryCol,
          });
          if (tier >= 3) {
            sim.groundFx.push({
              kind: 'warp',
              x: px,
              y: py,
              radius: 22,
              maxRadius: 155 + Math.min(120, tier * 24),
              life: 0.56,
              maxLife: 0.56,
              color: secondaryCol,
            });
          }

          if (tier === 3 || tier === 4) {
            spawnVfx(sim.vfx, 'magic_circle_crimson', px, py, {
              scale: 1.05 + Math.min(0.65, tier * 0.1),
              lifetime: 0.72,
              squashY: ISO_TILT,
            });
          } else {
            spawnSheetVfx(sim, 'holy_sigil', px, py, {
              size: 165 + Math.min(85, tier * 16),
              life: 0.88,
              upright: false,
            });
          }
          spawnSheetVfx(sim, 'sanctum_burst', px, py, {
            size: 140 + Math.min(60, tier * 12),
            life: 0.56,
            zOffset: 12,
          });
          if (tier >= 2) {
            spawnSheetVfx(sim, 'crit_hit', px, py, {
              size: 125 + Math.min(45, tier * 10),
              life: 0.36,
              zOffset: 16,
            });
          }

          if (sim.particles.length < 320) {
            sim.particles.push({
              x: px,
              y: py,
              vx: 0,
              vy: 0,
              radius: 18 + tier * 2,
              life: 0.36,
              maxLife: 0.36,
              color: primaryCol,
              secondaryColor: secondaryCol,
              shape: 'ring',
              angle: 0,
              spin: 0,
              drag: 0,
              zOffset: 10,
              glow: true,
            });
            const burstCount = 16 + Math.min(18, tier * 3);
            const shapes: ParticleShape[] = ['star', 'spark', 'diamond'];
            for (let pi = 0; pi < burstCount; pi++) {
              const ang = (pi / burstCount) * Math.PI * 2 + (Math.random() - 0.5) * 0.25;
              const spd = (145 + Math.random() * 145) * (1 + tier * 0.06);
              const life = 0.48 + Math.random() * 0.28;
              sim.particles.push({
                x: px,
                y: py,
                vx: Math.cos(ang) * spd,
                vy: Math.sin(ang) * spd - 24,
                radius: 3.4 + Math.random() * 2.1 + Math.min(1.5, tier * 0.2),
                life,
                maxLife: life,
                color: pi % 2 === 0 ? primaryCol : secondaryCol,
                secondaryColor: pi % 2 === 0 ? secondaryCol : primaryCol,
                shape: shapes[pi % shapes.length],
                angle: ang,
                spin: (Math.random() - 0.5) * 11,
                drag: 3.1,
                zOffset: 14 + Math.random() * 10,
                glow: true,
              });
            }
          }

          triggerAbilityFlash(sim, Math.min(0.28, 0.12 + tier * 0.025), 0.24);
          triggerWeaponHitShake(sim, 0.12 + Math.min(0.14, tier * 0.02), Math.min(6.5, 2.2 + tier * 0.7));
          sound.playComboMilestone(tier);
        }
      };

      const breakCombo = (sim: SimState) => {
        sim.woundedTimer = BALANCE.woundedDuration;
        // Knight Aegis Stance: +3 Honor when hit with Aegis armor
        if (sim.raceClass === 'knight' && sim.knightAegisBonus > 0 && sim.ultActiveTimer <= 0) {
          sim.classGauge = Math.min(100, sim.classGauge + 3);
        }
        // Seven Sins: Wrath (Satan) gains +1 vengeance stack (up to 10) & charges Sin gauge
        if (sim.raceClass === 'seven_sins') {
          const wrath = sim.sins.find(
            (s) => s.sinId === 'wrath' && (s.active || s.tempSummonTimer > 0 || sim.ultActiveTimer > 0)
          );
          if (wrath) {
            wrath.wrathStacks = Math.min(10, wrath.wrathStacks + 1);
            if (wrath.level >= 3 && wrath.wrathStacks >= 10) {
              wrath.wrathFrenzyTimer = 5.0;
            }
            if (sim.ultActiveTimer <= 0) sim.classGauge = Math.min(100, sim.classGauge + 5);
          }
        }
        const combo = sim.combo || 0;
        if (combo <= 0) return;
        if (combo >= BALANCE.comboMilestones[0]) {
          sim.comboBreakId = (sim.comboBreakId || 0) + 1;
          sim.comboBrokenAt = combo;
          sound.playComboBreak();
        }
        sim.combo = 0;
        sim.comboMilestone = 0;
      };

      const damageEnemy = (
        sim: SimState,
        enemy: EnemyEntity,
        rawDamage: number,
        weaponId: WeaponId | null,
        knockback: number,
        kbDx: number,
        kbDy: number,
        greedMult: number,
        skipWindDeathBurst = false,
        skipComboCount = false,
        skipStatusApply = false,
        noCrit = false,
        customDamageColor?: string,
        hunterOpts?: {
          forceCrit?: boolean;
          bonusCritChance?: number;
          isShadowSlash?: boolean;
          isBackstab?: boolean;
        }
      ) => {
        if (enemy.hp <= 0) return;
        let shieldAuraMult = 1;
        if (!enemy.isBoss && enemy.kind !== 'shielder') {
          for (const other of sim.enemies) {
            if (other.kind === 'shielder' && other.hp > 0) {
              if (Math.hypot(other.x - enemy.x, other.y - enemy.y) <= 115) {
                shieldAuraMult = 0.72;
                break;
              }
            }
          }
        }
        const isBerserkCrit = raceId === 'orc' && sim.orcBerserkTimer > 0;
        const critChanceCap = sim.raceClass === 'hunter' ? 0.75 : BALANCE.critChanceCap;
        const critDamageCap =
          sim.raceClass === 'hunter'
            ? Math.max(2.8, BALANCE.critDamageCap + 0.3)
            : BALANCE.critDamageCap;
        const effectiveCritChance = Math.min(
          critChanceCap,
          sim.cachedCritChance + (hunterOpts?.bonusCritChance || 0)
        );
        const rolledCrit = noCrit
          ? false
          : Boolean(hunterOpts?.forceCrit) || isBerserkCrit || Math.random() < effectiveCritChance;
        const critBonusMult = rolledCrit ? Math.min(critDamageCap, sim.cachedCritDamageMult) : 1;
        const isStaggeredBoss = enemy.isBoss && Boolean(enemy.staggerTimer && enemy.staggerTimer > 0);
        const staggerBonusMult = isStaggeredBoss ? 1.35 : 1;

        // Bestiary additive damage bonus: added inside rawDmgIncrease BEFORE BALANCE.dmgIncreaseSoftCapK
        let bestiaryScale = 1;
        const bBonus = getBestiaryDamageBonus(saveRef.current.bestiaryKills, enemy.kind);
        if (bBonus > 0) {
          const K = BALANCE.dmgIncreaseSoftCapK;
          const r0 = sim.cachedRawDmgIncrease;
          const r1 = r0 + bBonus;
          const e0 = r0 > 0 ? (r0 * K) / (r0 + K) : r0;
          const e1 = r1 > 0 ? (r1 * K) / (r1 + K) : r1;
          bestiaryScale = Math.max(1, (1 + e1) / Math.max(0.25, 1 + e0));
        }

        let effective = Math.max(
          1,
          Math.round(
            rawDamage *
              bestiaryScale *
              critBonusMult *
              (1 - enemy.armorRatio) *
              shieldAuraMult *
              staggerBonusMult
          )
        );

        // BALANCE: บอสรับดาเมจได้ไม่เกิน X% ของ maxHP ต่อวินาที (เวลาจริง) และคูณ 2 ตอนบอสเกราะแตก (Stagger)
        if (enemy.isBoss) {
          const nowSec = performance.now() / 1000;
          if (
            enemy.dpsCapWindowStart === undefined ||
            nowSec - enemy.dpsCapWindowStart >= 1
          ) {
            enemy.dpsCapWindowStart = nowSec;
            enemy.dpsCapWindowDmg = 0;
          }
          const capPct =
            (enemy.isReaper ? BALANCE.reaperMaxHpPctPerSec : BALANCE.bossMaxHpPctPerSec) *
            (isStaggeredBoss ? 2.0 : 1.0);
          const capLeft = Math.max(0, enemy.maxHp * capPct - (enemy.dpsCapWindowDmg || 0));
          effective = Math.min(effective, Math.floor(capLeft));
          enemy.dpsCapWindowDmg = (enemy.dpsCapWindowDmg || 0) + effective;

          // Stagger accumulation when Boss is not staggered or temporarily stagger-immune
          if (effective > 0 && !isStaggeredBoss && (enemy.staggerImmuneTimer || 0) <= 0 && enemy.maxStagger) {
            const heavyWeapon =
              weaponId === null ||
              weaponId === 'mace' ||
              weaponId === 'axe' ||
              weaponId === 'shield' ||
              weaponId === 'chain' ||
              weaponId === 'totem' ||
              weaponId === 'watergun';
            const staggerGain = effective * (heavyWeapon ? 1.55 : 0.9);
            enemy.stagger = (enemy.stagger || 0) + staggerGain;
            if (enemy.stagger >= enemy.maxStagger) {
              enemy.stagger = 0;
              enemy.staggerTimer = 3.2;
              enemy.windupTimer = 0;
              triggerWeaponHitShake(sim, 0.2, 5.5);
              sim.groundFx.push({
                kind: 'shockwave',
                x: enemy.x,
                y: enemy.y,
                radius: enemy.radius * 0.6,
                maxRadius: enemy.radius + 145,
                life: 0.42,
                maxLife: 0.42,
                color: '#FACC15',
              });
              spawnSheetVfx(sim, 'ground_slam', enemy.x, enemy.y, {
                size: Math.max(185, (enemy.radius + 145) * 1.45),
                life: 0.52,
                upright: false,
              });
              spawnParticles(sim, enemy.x, enemy.y, '#FDE047', 20, 210);
              addFloatingText(
                sim,
                enemy.x,
                enemy.y - enemy.radius - 26,
                'BREAK! เกราะแตก (เพดาน x2)',
                '#FDE047',
                1.3
              );
              sound.playBossChest();
            }
          }
        }

        if (effective <= 0) {
          if (enemy.hitFlash <= 0) {
            addFloatingText(
              sim,
              enemy.x + (Math.random() - 0.5) * 16,
              enemy.y - enemy.radius * 0.6,
              'ต้านทาน',
              '#9CA3AF',
              0.86,
              {
                vx: (Math.random() - 0.5) * 20,
                vy: -48,
                gravity: 110,
                life: 0.45,
              }
            );
          }
          enemy.hitFlash = Math.max(enemy.hitFlash, 0.04);
          return;
        }

        enemy.hp -= effective;
        if (rolledCrit && sim.raceClass === 'knight') {
          sim.knightLastHitWasCrit = true;
        }
        sim.balanceDmgAccum = (sim.balanceDmgAccum || 0) + effective;
        if (effective > 0 && !skipComboCount) registerComboHit(sim);
        if (effective > 0) {
          if (rolledCrit) {
            if ((sim.critVfxCooldown || 0) <= 0) {
              sim.critVfxCooldown = 0.055;
              spawnSheetVfx(sim, 'crit_hit', enemy.x, enemy.y, {
                size: enemy.isBoss ? 128 : 96,
                life: 0.3,
                angle: (Math.random() - 0.5) * 0.5,
                zOffset: 12,
              });
            }
            if (sim.raceClass === 'hunter') {
              spawnPackVfx(sim.packVfx, 'hunter_crit_spark', enemy.x, enemy.y, {
                scale: 1.9,
                zOffset: 10,
              });
              if (!skipStatusApply && sim.ultActiveTimer <= 0 && sim.hunterCritGaugeCd <= 0) {
                sim.hunterCritGaugeCd = 0.16;
                sim.classGauge = Math.min(100, sim.classGauge + 0.25);
              }
              if (
                !noCrit &&
                !skipStatusApply &&
                sim.hunterShadowKnifeCd <= 0 &&
                sim.projectiles.length < 180 &&
                Math.random() < (sim.ultActiveTimer > 0 ? 0.35 : 0.22)
              ) {
                sim.hunterShadowKnifeCd = 0.14;
                let knifeTarget: EnemyEntity | null = null;
                let bestKD2 = 440 * 440;
                for (const other of sim.enemies) {
                  if (other.hp <= 0 || other.id === enemy.id) continue;
                  const d2 = (other.x - enemy.x) ** 2 + (other.y - enemy.y) ** 2;
                  if (d2 < bestKD2) {
                    bestKD2 = d2;
                    knifeTarget = other;
                  }
                }
                const kAng = knifeTarget
                  ? Math.atan2(knifeTarget.y - enemy.y, knifeTarget.x - enemy.x)
                  : Math.atan2(sim.player.facingY, sim.player.facingX);
                const kSpd = 640;
                const cappedLvK = Math.min(sim.player.level, 40);
                const kDmg = Math.max(18, (48 + cappedLvK * 2.4) * Math.max(1, sim.cachedBaseDamageMult));
                sim.projectiles.push({
                  weaponId: 'dagger',
                  evolved: true,
                  customKind: 'shadow_knife',
                  fromClassSkill: true,
                  vfxKey: 'hunter_shadow_dagger',
                  homing: true,
                  x: enemy.x,
                  y: enemy.y,
                  vx: Math.cos(kAng) * kSpd,
                  vy: Math.sin(kAng) * kSpd,
                  radius: 10,
                  damage: kDmg,
                  knockback: 45,
                  pierce: 2,
                  life: 0.85,
                  maxLife: 0.85,
                  hitIds: new Set([enemy.id]),
                  rotation: kAng,
                  color: '#C084FC',
                });
              }
            }
          } else if (Math.random() < 0.3) {
            spawnVfx(sim.vfx, 'hit_spark', enemy.x, enemy.y, { scale: 0.7 });
          }
        }
        enemy.hitFlash = 0.11;

        // Visceral Squash & Stretch + Directional Recoil impulse on hit
        if (effective > 0) {
          const isHeavyHit = rolledCrit || knockback >= 150 || effective >= 55;
          const reactDur = rolledCrit ? 0.24 : isHeavyHit ? 0.2 : 0.16;
          enemy.hitReactMax = reactDur;
          enemy.hitReactTimer = reactDur;
          enemy.hitStrength = rolledCrit ? 1.55 : isHeavyHit ? 1.25 : 0.95;

          const rLen = Math.hypot(kbDx, kbDy);
          if (rLen > 0.001 && (weaponId !== null || knockback > 0)) {
            const rMag = (rolledCrit ? 12.5 : isHeavyHit ? 9.5 : 6.5) * (enemy.isBoss ? 0.52 : 1);
            enemy.recoilX = Math.max(-16, Math.min(16, (enemy.recoilX || 0) + (kbDx / rLen) * rMag));
            enemy.recoilY = Math.max(-14, Math.min(14, (enemy.recoilY || 0) + (kbDy / rLen) * rMag));
            if (sim.particles.length < 245 && (rolledCrit || Math.random() < 0.45)) {
              const sparkCount = rolledCrit ? 3 : 2;
              const baseAng = Math.atan2(kbDy, kbDx);
              for (let sp = 0; sp < sparkCount; sp++) {
                const a = baseAng + (Math.random() - 0.5) * 0.85;
                const spd = (rolledCrit ? 190 : 140) + Math.random() * 80;
                sim.particles.push({
                  x: enemy.x,
                  y: enemy.y,
                  vx: Math.cos(a) * spd,
                  vy: Math.sin(a) * spd,
                  radius: rolledCrit ? 3.2 : 2.3,
                  life: 0.22,
                  maxLife: 0.22,
                  color: customDamageColor || (rolledCrit ? '#FDE047' : '#FCA5A5'),
                  shape: 'spark',
                  angle: a,
                  drag: 0.04,
                  zOffset: 12,
                  glow: true,
                });
              }
            }
          }
        }

        // Redesigned Demonkin & Hunter Hit Status Application
        if (!skipStatusApply && effective > 0) {
          if (sim.raceClass === 'demon_lord') {
            enemy.hellfireStacks = Math.min(5, (enemy.hellfireStacks || 0) + 1);
            enemy.hellfireTimer = 3.0;
            if (enemy.hellfireTickTimer === undefined) enemy.hellfireTickTimer = 0.5;
          } else if (sim.raceClass === 'vampire_lord') {
            enemy.bleedStacks = Math.min(3, (enemy.bleedStacks || 0) + 1);
            enemy.bleedTimer = 3.0;
            if (enemy.bleedTickTimer === undefined) enemy.bleedTickTimer = 0.5;
          } else if (sim.raceClass === 'hunter' && sim.ultActiveTimer > 0) {
            // During Night of a Thousand Shadows, every hit applies max 5 Hunt Marks!
            enemy.huntMarks = 5;
          }
        }

        // Phase 2: Orc builds Rage when landing hits
        if (raceId === 'orc' && sim.orcBerserkTimer <= 0 && sim.orcRageHitCooldown <= 0) {
          sim.orcRageHitCooldown = 0.22;
          sim.orcRage = Math.min(ORC_RAGE_MAX, sim.orcRage + 5);
        }

        if (sim.cachedLifestealPct > 0 && (sim.player.hp < sim.player.maxHp || sim.raceClass === 'vampire_lord')) {
          sim.artifactLifestealBuffer += effective * sim.cachedLifestealPct;
          if (sim.artifactLifestealBuffer >= 1) {
            const leechWhole = Math.floor(sim.artifactLifestealBuffer);
            sim.artifactLifestealBuffer -= leechWhole;
            const healed = applyLeechHeal(sim, leechWhole);
            if (healed > 0 && sim.artifactHealTextCooldown <= 0) {
              sim.artifactHealTextCooldown = 0.55;
              addFloatingText(sim, sim.player.x, sim.player.y - 26, `+${healed}`, '#FB7185', 0.85);
            }
          }
        }

        if (weaponId) {
          const w = sim.weapons.find((it) => it.id === weaponId);
          if (w) w.totalDamage += effective;
        }

        const effectiveKbResist =
          enemy.knockbackResist >= 1
            ? 1
            : Math.min(0.98, enemy.knockbackResist + (sim.mapEvent === 'gravity_well' ? 0.35 : 0));
        const kbFactor = knockback * (1 - effectiveKbResist);
        if (kbFactor > 1) {
          const len = Math.hypot(kbDx, kbDy) || 1;
          enemy.kbVx += (kbDx / len) * kbFactor;
          enemy.kbVy += (kbDy / len) * kbFactor;
        }

        const isKill = enemy.hp <= 0;
        const isBigOrCrit = rolledCrit || effective >= 55 || isKill;

        sound.playSkillHit({
          isCrit: rolledCrit,
          isKill,
          isBoss: enemy.isBoss,
          weaponId,
          damage: effective,
          combo: sim.combo || 0,
        });

        // Subtle screen-shake when player weapons / skills strike enemies (throttled for smooth feel)
        if ((weaponId !== null || isBigOrCrit) && sim.hitShakeCooldown <= 0) {
          const shakeDur = rolledCrit || enemy.isBoss ? 0.095 : isKill || effective >= 55 ? 0.075 : 0.06;
          const shakeAmp = rolledCrit ? 3.1 : enemy.isBoss ? 2.6 : isKill || effective >= 55 ? 2.1 : 1.45;
          triggerWeaponHitShake(sim, shakeDur, shakeAmp);
          sim.hitShakeCooldown = 0.055;
        }

        // Bouncy damage pop-up number
        addFloatingText(
          sim,
          enemy.x,
          enemy.y - enemy.radius * 0.55,
          rolledCrit ? `${effective}!` : String(effective),
          customDamageColor || (rolledCrit ? '#FBBF24' : isKill ? '#FDA4AF' : effective >= 55 ? '#FDE047' : '#FFFFFF'),
          rolledCrit ? 1.28 : effective >= 55 || isKill ? 1.12 : 0.96,
          {
            vx: (Math.random() - 0.5) * 38,
            vy: rolledCrit ? -96 : -76 - Math.random() * 14,
            gravity: 195,
            life: rolledCrit ? 0.66 : 0.54,
            isCrit: rolledCrit,
            isDamage: true,
          }
        );

        // Lightning Crown Amulet: Critical strikes chance to arc lightning to nearby enemy
        if (
          rolledCrit &&
          !skipStatusApply &&
          sim.cachedLightningCrownChance > 0 &&
          Math.random() < sim.cachedLightningCrownChance
        ) {
          const arcTarget = sim.enemies.find(
            (o) => o.id !== enemy.id && o.hp > 0 && Math.hypot(o.x - enemy.x, o.y - enemy.y) <= 175
          );
          if (arcTarget) {
            sim.groundFx.push({
              kind: 'beam',
              x: enemy.x,
              y: enemy.y,
              x2: arcTarget.x,
              y2: arcTarget.y,
              radius: 5,
              maxRadius: 5,
              life: 0.18,
              maxLife: 0.18,
              color: '#38BDF8',
            });
            spawnSheetVfx(sim, 'holy_smite', arcTarget.x, arcTarget.y, { size: 118, life: 0.36 });
            damageEnemy(
              sim,
              arcTarget,
              Math.max(8, effective * 0.55),
              null,
              30,
              arcTarget.x - enemy.x,
              arcTarget.y - enemy.y,
              greedMult,
              true,
              true,
              true
            );
          }
        }

        if (enemy.hp <= 0) {
          sim.kills += 1;
          sim.runKillsByKind[enemy.kind] = (sim.runKillsByKind[enemy.kind] || 0) + 1;
          if (weaponId === 'banana') sim.runBananaKills += 1;
          if ((enemy.burnTimer || 0) > 0 || (enemy.hellfireTimer || 0) > 0) {
            sim.runFireBurnKills += 1;
          }
          if (enemy.isBoss) {
            sim.bossesKilled += 1;
            if (!sim.runDefeatedBossKinds.includes(enemy.kind)) {
              sim.runDefeatedBossKinds.push(enemy.kind);
            }
          } else if (enemy.isElite) {
            sim.elitesKilled += 1;
          }

          // Hunter: Build Kill-Intent Gauge & refund +1 Dash Charge on Shadow Slash kill
          if (sim.raceClass === 'hunter') {
            if (hunterOpts?.isShadowSlash) {
              sim.hunterShadowSlashKills += 1;
              if (!sim.ultAscended && sim.ultCount >= 3 && sim.hunterShadowSlashKills >= 150) {
                sim.ultAscended = true;
                sim.hunterDashMaxCharges = 4;
                sim.hunterDashCharges = Math.min(4, sim.hunterDashCharges + 1);
                sim.announcement =
                  'จุติ! วิญญาณจันทร์ดับ (Moonless Phantom) — 4 ชาร์จ + เงาถาวร + ท่าไม้ตาย 10 วิ!';
                sim.announcementTimer = 5.0;
                sound.playBossChest();
              }
            }
            if (sim.ultActiveTimer <= 0) {
              const gGain = enemy.isBoss
                ? 8
                : enemy.isElite
                  ? 3
                  : hunterOpts?.isShadowSlash
                    ? 1.3
                    : rolledCrit
                      ? 1.0
                      : 0.7;
              if (hunterOpts?.isShadowSlash) {
                const room = Math.max(0, 5 - sim.hunterDashGaugeEarned);
                const addG = Math.min(room, gGain);
                if (addG > 0) {
                  sim.hunterDashGaugeEarned += addG;
                  sim.classGauge = Math.min(100, sim.classGauge + addG);
                }
              } else {
                sim.classGauge = Math.min(100, sim.classGauge + gGain);
              }
            }
            if (hunterOpts?.isShadowSlash && sim.ultActiveTimer <= 0 && sim.hunterRefundCd <= 0) {
              if (sim.hunterDashCharges < sim.hunterDashMaxCharges) {
                sim.hunterDashCharges = Math.min(sim.hunterDashMaxCharges, sim.hunterDashCharges + 1);
                sim.hunterRefundCd = 1.5;
                sim.hunterKillRefunds += 1;
                if (sim.activeSkillHintCooldown <= 0) {
                  sim.activeSkillHintCooldown = 0.55;
                  addFloatingText(sim, sim.player.x, sim.player.y - 34, '+1 ชาร์จแดช!', '#34D399', 1.05);
                }
              }
            }
          }

          // Voidless Blade kill counter toward Voidless Mode (every 100 kills when not in mode & cooldown ready)
          if (sim.raceClass === 'voidless_blade' && sim.voidlessTimer <= 0) {
            sim.voidlessKills = Math.min(VOIDLESS_KILLS_REQ, sim.voidlessKills + 1);
          }

          // Chronos Archon (time_god): Chrono Well kill accelerates Global Time Stop & charges Rewind Revive
          if (sim.raceClass === 'time_god') {
            const inWell = sim.chronoWells.find(
              (w) => Math.hypot(enemy.x - w.x, enemy.y - w.y) <= w.radius + enemy.radius
            );
            const recentlyInWell =
              enemy.chronoLastWellExitAt !== undefined &&
              sim.elapsedSeconds - enemy.chronoLastWellExitAt <= 0.2;
            if (inWell || recentlyInWell) {
              sim.chronoWellKills += 1;
              const cdr = Math.max(0, 1 - sim.lastCooldownMult);
              const cdrMultiplier = 1 + cdr * 1.5;
              const killWeight = enemy.isBoss ? 8 : enemy.isElite ? 3 : 1;
              const reduceStep = 0.15 * killWeight * cdrMultiplier;
              const wellCapRef =
                inWell ||
                (enemy.chronoLastWellId !== undefined
                  ? sim.chronoWells.find((w) => w.id === enemy.chronoLastWellId) ||
                    sim.expiredChronoWellCaps.find((c) => c.id === enemy.chronoLastWellId)
                  : undefined);
              let appliedReduce = 0;
              if (wellCapRef) {
                const leftCap = Math.max(0, 5.0 - wellCapRef.stopCdReduced);
                appliedReduce = Math.min(leftCap, reduceStep);
              } else {
                appliedReduce = reduceStep;
              }
              const maxCycleReduce = Math.min(12, sim.timeStopMaxCooldown * 0.42);
              const cycleLeft = Math.max(0, maxCycleReduce - sim.timeStopCycleReduced);
              appliedReduce = Math.min(appliedReduce, cycleLeft);
              if (wellCapRef && appliedReduce > 0) {
                wellCapRef.stopCdReduced += appliedReduce;
              }
              if (appliedReduce > 0 && sim.timeStopTimer <= 0 && sim.timeStopCooldown > 0) {
                sim.timeStopCooldown = Math.max(0, sim.timeStopCooldown - appliedReduce);
                sim.timeStopCycleReduced += appliedReduce;
              }
              if (sim.chronoHudMotes.length < 28) {
                const cw = canvasRef.current?.clientWidth || 1280;
                const sx = enemy.x - sim.player.x + cw * 0.5;
                const sy = (enemy.y - sim.player.y) * ISO_TILT + (canvasRef.current?.clientHeight || 720) * 0.5;
                sim.chronoHudMotes.push({
                  x: sx,
                  y: sy,
                  targetX: cw * 0.45,
                  targetY: 74,
                  life: 0.48,
                  maxLife: 0.48,
                });
              }

              // Rewind Revive charge: only when not ready, < 3 uses, outside 45s lock, and frozen >= 1.0s
              if (
                !sim.rewindReady &&
                sim.rewindUsedCount < 3 &&
                sim.rewindLockTimer <= 0 &&
                (enemy.chronoWellFrozenTime || 0) >= 1.0
              ) {
                const pts = enemy.isBoss ? 40 : enemy.isElite ? 10 : 1;
                sim.rewindChargeKills += pts;
                if (sim.rewindChargeKills >= sim.rewindChargeTarget) {
                  sim.rewindReady = true;
                  sim.rewindChargeKills = sim.rewindChargeTarget;
                  addFloatingText(sim, sim.player.x, sim.player.y - 44, 'ย้อนกาลพร้อมใช้!', '#67E8F9', 1.3);
                  sim.announcement = 'ย้อนกาลชาร์จเต็มแล้ว! พร้อมคืนชีพเมื่อถึงฆาต';
                  sim.announcementTimer = 3.5;
                  sound.playHolyBell();
                }
              }
            }
          }

          // Wind Blade Mark Death Explosion: dying enemy explodes around itself damaging & knocking back nearby enemies!
          if (!skipWindDeathBurst && enemy.windMarkTimer && enemy.windMarkTimer > 0) {
            const windR = 96;
            const windDmg = Math.max(18, enemy.windMarkDamage || effective * 0.85);
            sim.groundFx.push({
              kind: 'shockwave',
              x: enemy.x,
              y: enemy.y,
              radius: 12,
              maxRadius: windR,
              life: 0.28,
              maxLife: 0.28,
              color: '#34D399',
            });
            spawnParticles(sim, enemy.x, enemy.y, '#6EE7B7', 12, 165);
            for (const other of sim.enemies) {
              if (other.id === enemy.id || other.hp <= 0) continue;
              const odx = other.x - enemy.x;
              const ody = other.y - enemy.y;
              if (Math.hypot(odx, ody) <= windR + other.radius) {
                damageEnemy(sim, other, windDmg, null, 240, odx, ody, greedMult, true);
              }
            }
          }

          // Demonkin Blood Gauge + Passive Leech (removed for Vampire Lord, who drinks Bleed stacks via Bat Swarm)
          const race = RACES[raceId];
          if (race.id === 'vampire') {
            const isNight =
              (sim.raceClass === 'vampire_lord' && sim.ultActiveTimer > 0) ||
              sim.dayNightElapsed % 90 < 45;
            if (sim.batSwarmTimer <= 0) {
              const bloodGain = enemy.isBoss ? 35 : isNight ? 12 : 8;
              sim.bloodGauge = Math.min(VAMPIRE_BLOOD_MAX, sim.bloodGauge + bloodGain);
            }
            if (sim.raceClass !== 'vampire_lord') {
              sim.vampireKillCounter += 1;
              const threshold = isNight ? 2 : 4;
              if (sim.vampireKillCounter >= threshold) {
                sim.vampireKillCounter = 0;
                const heal = isNight ? 2 : 1;
                if (sim.player.hp < sim.player.maxHp) {
                  const healed = applyLeechHeal(sim, heal);
                  if (healed > 0) {
                    addFloatingText(sim, sim.player.x, sim.player.y - 24, `+${healed}`, '#FB7185', 0.85);
                  }
                }
              }
            }
          }

          // Demon Lord: Soul Ledger, Pit Gauge (+1), Soul Explosion (90px / 135px at 666+), Gate of Inferno Imps
          if (sim.raceClass === 'demon_lord') {
            sim.demonSoulKills += 1;
            if (sim.demonSoulKills === 100) {
              sim.announcement = 'บัญชีวิญญาณ 100 ศพ! ปลดล็อก "รอยเพลิง" (เดินทิ้งบ่อเพลิง)';
              sim.announcementTimer = 4.2;
              sound.playLevelUp();
            } else if (sim.demonSoulKills === 300) {
              sim.announcement = 'บัญชีวิญญาณ 300 ศพ! ปลดล็อก "ฝนเพลิงนรก" (เสาไฟทุก 4 วิ)';
              sim.announcementTimer = 4.2;
              sound.playLevelUp();
            } else if (sim.demonSoulKills === 666) {
              sim.announcement = 'บัญชีวิญญาณ 666 ศพ! ปลดล็อก "มงกุฎอเวจี" (ระเบิดวิญญาณ +50% · แพร่ไฟ 3 ชั้น)';
              sim.announcementTimer = 4.8;
              sound.playBossChest();
            } else if (!sim.ultAscended && sim.demonSoulKills >= 2000) {
              sim.ultAscended = true;
              sim.announcement = 'จุติ! มหาจอมมารแห่งอเวจีที่เจ็ด (Archfiend of the Seventh Hell)!';
              sim.announcementTimer = 5.2;
              sound.playBossChest();
            }

            if ((enemy.hellfireStacks || 0) > 0) {
              if (sim.ultActiveTimer <= 0) {
                sim.classGauge = Math.min(150, sim.classGauge + 1);
              }
              const crownUnlocked = sim.demonSoulKills >= 666;
              const expR = 90 * (crownUnlocked ? 1.5 : 1);
              const spreadStacks = crownUnlocked ? 3 : 2;
              const cappedLv = Math.min(sim.player.level, 40);
              const expDmg = (26 + cappedLv * 1.9) * computeStats(sim).damageMult;
              sim.groundFx.push({
                kind: 'explosion',
                x: enemy.x,
                y: enemy.y,
                radius: 12,
                maxRadius: expR,
                life: 0.28,
                maxLife: 0.28,
                color: '#EA580C',
              });
              spawnVfx(sim.vfx, 'explosion_hellfire', enemy.x, enemy.y, {
                scale: crownUnlocked ? 1.25 : 0.9,
              });
              spawnParticles(sim, enemy.x, enemy.y, '#F97316', 10, 150);
              for (const other of sim.enemies) {
                if (other.id === enemy.id || other.hp <= 0) continue;
                const odx = other.x - enemy.x;
                const ody = other.y - enemy.y;
                if (Math.hypot(odx, ody) <= expR + other.radius) {
                  other.hellfireStacks = Math.min(5, (other.hellfireStacks || 0) + spreadStacks);
                  other.hellfireTimer = 3.0;
                  if (other.hellfireTickTimer === undefined) other.hellfireTickTimer = 0.5;
                  damageEnemy(sim, other, expDmg, null, 70, odx, ody, greedMult, true, false, true);
                }
              }
              if (
                (sim.ultActiveTimer > 0 || (sim.ultAscended && Math.random() < 0.1)) &&
                sim.demonImps.length < 12
              ) {
                sim.demonImps.push({
                  x: enemy.x,
                  y: enemy.y,
                  vx: 0,
                  vy: 0,
                  hp: 1,
                  life: 4.5,
                  damage: (42 + cappedLv * 2.4) * computeStats(sim).damageMult,
                });
              }
            }
          }

          // Seven Sins: Lust (Asmodeus) Lv3 Heart Explosion when charmed enemy dies!
          if (sim.raceClass === 'seven_sins' && (enemy.charmTimer || 0) > 0) {
            const lustSin = sim.sins.find((s) => s.sinId === 'lust');
            if (lustSin && lustSin.level >= 3) {
              const heartDmg = (48 + Math.min(sim.player.level, 40) * 2.5) * computeStats(sim).damageMult;
              sim.groundFx.push({
                kind: 'explosion',
                x: enemy.x,
                y: enemy.y,
                radius: 12,
                maxRadius: 110,
                life: 0.34,
                maxLife: 0.34,
                color: '#EC4899',
              });
              spawnParticles(sim, enemy.x, enemy.y, '#F472B6', 14, 175);
              for (const other of sim.enemies) {
                if (other.id !== enemy.id && other.hp > 0 && Math.hypot(other.x - enemy.x, other.y - enemy.y) <= 110 + other.radius) {
                  damageEnemy(sim, other, heartDmg, null, 110, other.x - enemy.x, other.y - enemy.y, greedMult, true, true, true);
                }
              }
            }
          }

          // Mage Necromancer (death_god): passive Minion resurrection on kill (10% + Lv * 1.5%, including mini-bosses!)
          if (sim.raceClass === 'death_god') {
            const curStats = computeStats(sim);
            tryResurrectNecroMinion(
              sim,
              enemy,
              curStats,
              BESTIARY_BY_KIND[enemy.kind]?.nameTh || 'ผู้รับใช้แห่งความตาย',
              {
                spawnParticles: (x, y, color, count, speed) =>
                  spawnParticles(sim, x, y, color, count, speed),
                addFloatingText: (x, y, text, color, scale) =>
                  addFloatingText(sim, x, y, text, color, scale),
              }
            );
          }

          sound.playEnemyKill(enemy.isBoss);
          spawnParticles(
            sim,
            enemy.x,
            enemy.y,
            enemy.isReaper ? '#F43F5E' : enemy.isBoss ? '#F59E0B' : '#94A3B8',
            enemy.isBoss ? 24 : 7,
            enemy.isBoss ? 190 : 100
          );

          if (enemy.isGoldenBat) {
            const batGold = sim.elapsedSeconds > 1800 ? 3 : 5;
            sim.goldEarned += batGold;
            sim.goldBreakdown.drops += batGold;
            sound.playCoinPickup();
            addFloatingText(sim, enemy.x, enemy.y - 20, `+${batGold} ทอง`, '#FDE047', 1.05);
          }

          if (enemy.isBoss) {
            const otherCerberusAlive =
              enemy.kind === 'boss_cerberus' &&
              sim.enemies.some((o) => o !== enemy && o.kind === 'boss_cerberus' && o.hp > 0);
            if (!otherCerberusAlive) {
              sim.hitstopTimer = 0.055;
              sim.shakeTime = 0.28;
              sim.shakeIntensity = 9;
              spawnDrop(sim, {
                kind: 'chest',
                x: enemy.x,
                y: enemy.y,
                value: 1,
                magnetized: false,
              });
              spawnDrop(sim, {
                kind: 'artifact_chest',
                x: enemy.x - 28,
                y: enemy.y + 8,
                value: 1,
                magnetized: false,
              });
              spawnDrop(sim, {
                kind: 'meat',
                x: enemy.x + 24,
                y: enemy.y,
                value: 25,
                magnetized: false,
              });
            } else {
              spawnDrop(sim, {
                kind: 'gold',
                x: enemy.x,
                y: enemy.y,
                value: 25,
                magnetized: false,
              });
            }

            if (enemy.isReaper) {
              // Pinnacle Boss defeated -> Ascend Realm & Change Biome endlessly!
              sim.reaperSlainCount += 1;
              sim.realmTier += 1;
              sim.realmStartSeconds = sim.elapsedSeconds;
              sim.spawnedBossMinutes.clear();
              sim.lastMinuteAnnounced = -1;
              sim.enemyBullets = [];

              const lateGoldMult = sim.elapsedSeconds > 1800 ? 0.5 : 1;
              const bonus = Math.max(1, Math.round(500 * greedMult * (1 + sim.realmTier * 0.45) * lateGoldMult));
              sim.goldEarned += bonus;
              sim.goldBreakdown.bosses += bonus;
              sim.soulEssenceEarned += 20;
              if (sim.pendingSealedChests < 5) {
                spawnDrop(sim, {
                  kind: 'sealed_chest',
                  x: enemy.x + 18,
                  y: enemy.y - 16,
                  value: 1,
                  magnetized: false,
                });
              }
              const healAmt = Math.round(sim.player.maxHp * 0.35);
              applyPlayerHeal(sim, healAmt);

              const nextBiome = getActiveBiome(stageId, sim.realmTier, sim.biomeShiftCount);
              sim.groundFx.push({
                kind: 'warp',
                x: sim.player.x,
                y: sim.player.y,
                radius: 20,
                maxRadius: 360,
                life: 0.75,
                maxLife: 0.75,
                color: nextBiome.accentHex,
              });
              spawnParticles(sim, sim.player.x, sim.player.y, nextBiome.accentHex, 28, 220);
              sound.playLevelUp();

              sim.announcement = `พิชิตยมทูตสำเร็จ! วาร์ปสู่ ${nextBiome.nameTh} (ระดับ ${sim.realmTier + 1}) · +${bonus} ทอง · +20 Soul`;
              sim.announcementTimer = 6;
            } else {
              // Regular Boss defeated -> +5 Soul Essence + Altar 4B Heal + Shift Biome!
              if (!otherCerberusAlive) {
                sim.soulEssenceEarned += 5;
                if (saveRef.current.talents.row4?.branch === 'B' && saveRef.current.talents.row4.rank > 0) {
                  applyPlayerHeal(sim, Math.round(sim.player.maxHp * 0.3));
                }
              }
              sim.biomeShiftCount += 1;
              const nextBiome = getActiveBiome(stageId, sim.realmTier, sim.biomeShiftCount);
              sim.groundFx.push({
                kind: 'warp',
                x: sim.player.x,
                y: sim.player.y,
                radius: 24,
                maxRadius: 320,
                life: 0.65,
                maxLife: 0.65,
                color: nextBiome.accentHex,
              });
              spawnParticles(sim, sim.player.x, sim.player.y, nextBiome.accentHex, 22, 200);
              sim.announcement = `โค่น${enemy.nameTh || 'บอส'}! ฉากแปรเปลี่ยนสู่: ${nextBiome.nameTh}`;
              sim.announcementTimer = 5;
            }
          } else {
            const curBiome = getActiveBiome(stageId, sim.realmTier, sim.biomeShiftCount);
            const xpMult = 1 + (curBiome.rewardMult - 1) * 0.45;
            const isGodBlessing = sim.mapEvent === 'god_blessing';
            const isLargeSurge =
              (sim.mapEvent === 'exp_surge' && Math.random() < 0.35) ||
              (isGodBlessing && Math.random() < 0.32);
            const dropXpVal = Math.max(
              1,
              Math.round(enemy.xpValue * (isLargeSurge ? 1.35 : 1) * STAGES[stageId].xpMult * xpMult)
            );
            spawnDrop(sim, {
              kind: enemy.xpValue >= 7 || isLargeSurge ? 'xp_large' : 'xp',
              x: enemy.x,
              y: enemy.y,
              value: dropXpVal,
              magnetized: false,
            });
            if (isGodBlessing && Math.random() < 0.45) {
              spawnDrop(sim, {
                kind: Math.random() < 0.35 ? 'xp_large' : 'xp',
                x: enemy.x + (Math.random() - 0.5) * 22,
                y: enemy.y + (Math.random() - 0.5) * 22,
                value: Math.max(1, Math.round(dropXpVal * 0.85)),
                magnetized: false,
              });
            }
            if (enemy.isElite) {
              // Elite Rewards: 15-30g + Soul Essence + 25% Sealed Chest
              const lateGoldMult = sim.elapsedSeconds > 1800 ? 0.5 : 1;
              const eliteGold = Math.max(1, Math.round((15 + Math.random() * 15) * greedMult * lateGoldMult));
              sim.goldEarned += eliteGold;
              sim.goldBreakdown.elites += eliteGold;
              const t = saveRef.current.talents;
              let seGain = t.row5?.branch === 'B' && t.row5.rank >= 1 ? 2 : 1;
              if (t.row5?.branch === 'B' && t.row5.rank >= 2 && Math.random() < 0.5) seGain += 1;
              sim.soulEssenceEarned += seGain;
              addFloatingText(
                sim,
                enemy.x,
                enemy.y - 26,
                `+${eliteGold}g · +${seGain} Soul`,
                '#C084FC',
                1.1
              );
              if (sim.pendingSealedChests < 5 && Math.random() < 0.25) {
                spawnDrop(sim, {
                  kind: 'sealed_chest',
                  x: enemy.x,
                  y: enemy.y - 8,
                  value: 1,
                  magnetized: false,
                });
                addFloatingText(sim, enemy.x, enemy.y - 44, 'หีบปิดผนึกตก!', '#F59E0B', 1.18);
              }
            } else {
              const roll = Math.random();
              if (roll < enemy.goldChance) {
                spawnDrop(sim, {
                  kind: 'gold',
                  x: enemy.x + (Math.random() - 0.5) * 18,
                  y: enemy.y + (Math.random() - 0.5) * 18,
                  value: Math.max(1, Math.round((2 + Math.floor(sim.elapsedSeconds / 180)) * greedMult)),
                  magnetized: false,
                });
              } else if (Math.random() < 0.005) {
                // Rare Gold Pouch (0.5% chance on normal mob, 25-40g)
                spawnDrop(sim, {
                  kind: 'gold_pouch',
                  x: enemy.x,
                  y: enemy.y,
                  value: Math.round((25 + Math.random() * 15) * greedMult),
                  magnetized: false,
                });
              }
            }
            // Nerfed Health Potion drops (1.3% chance, +20 HP) so HP management matters!
            const dropRoll = Math.random();
            if (dropRoll < 0.013) {
              spawnDrop(sim, { kind: 'meat', x: enemy.x, y: enemy.y, value: 20, magnetized: false });
            } else if (dropRoll < 0.024) {
              spawnDrop(sim, { kind: 'magnet', x: enemy.x, y: enemy.y, value: 1, magnetized: false });
            }

            // Exclusive Elemental Orbs & Mana Crystals for Mage (throttled & capped so orbs never flood the map)
            if (RACES[raceId].usesElements) {
              const mageRoll = Math.random();
              if (mageRoll < 0.06 && countAndPruneElementOrbs(sim) < MAX_ELEMENT_ORBS_ON_MAP) {
                const el = ELEMENT_IDS[Math.floor(Math.random() * ELEMENT_IDS.length)];
                spawnDrop(sim, {
                  kind: 'element_orb',
                  x: enemy.x + (Math.random() - 0.5) * 20,
                  y: enemy.y + (Math.random() - 0.5) * 20,
                  value: 1,
                  elementId: el,
                  magnetized: false,
                });
              } else if (mageRoll < 0.125) {
                spawnDrop(sim, {
                  kind: 'mana_gem',
                  x: enemy.x + (Math.random() - 0.5) * 16,
                  y: enemy.y + (Math.random() - 0.5) * 16,
                  value: 22,
                  magnetized: false,
                });
              }
            }
          }
        }
      };

      const triggerElementalSwordTechniques = (
        sim: SimState,
        stats: ReturnType<typeof computeStats>,
        activeElements: ElementId[],
        aim: number,
        isGrand360: boolean,
        powerScale = 1
      ) => {
        const px = sim.player.x;
        const py = sim.player.y;
        const baseWaveDmg = (17 + sim.player.level * 1.15) * stats.damageMult * powerScale;
        const inVoidless = sim.voidlessTimer > 0;
        const fusionWavePalette =
          inVoidless
            ? getCombinedElementPalette(['fire', 'water', 'light', 'dark', 'wind'], '#E0F2FE')
            : sim.lastSpellbladeFusion
              ? getCombinedElementPalette(
                  [
                    sim.lastSpellbladeFusion.def.a,
                    sim.lastSpellbladeFusion.def.b,
                    sim.lastSpellbladeFusion.catalyst,
                  ],
                  sim.lastSpellbladeFusion.def.color
                )
              : activeElements.length > 0
                ? getCombinedElementPalette(activeElements)
                : null;
        const hasFire = activeElements.includes('fire');
        const hasWater = activeElements.includes('water');
        const hasLight = activeElements.includes('light');
        const hasDark = activeElements.includes('dark');
        const hasWind = activeElements.includes('wind');
        const hasEarth = activeElements.includes('earth');
        const hasStone = activeElements.includes('stone');
        const hasBlood = activeElements.includes('blood');

        // 1. Fire Sword: Long-Range Multi-Wave Flame Crescents + % Burn
        if (hasFire) {
          const prof = getSpellbladeSwordProfile('fire');
          const fireWaveVisual = getSpellbladeWaveKey('fire');
          const waveCount = isGrand360 ? 6 : prof.waveCount;
          const waveSpd = prof.waveSpeed * stats.projSpeedMult;
          for (let i = 0; i < waveCount; i++) {
            const ang = isGrand360
              ? (i * Math.PI * 2) / waveCount + sim.elapsedSeconds * 0.5
              : aim + (i - (waveCount - 1) / 2) * prof.waveSpread;
            const leadDist = isGrand360 ? 18 : i * 18;
            sim.projectiles.push({
              weaponId: 'katana',
              evolved: true,
              customKind: 'sword_wave',
              fromClassSkill: true,
              vfxKey: fireWaveVisual.key,
              vfxTint: fireWaveVisual.tint,
              x: px + Math.cos(ang) * leadDist,
              y: py + Math.sin(ang) * leadDist,
              vx: Math.cos(ang) * waveSpd,
              vy: Math.sin(ang) * waveSpd,
              radius: (isGrand360 ? 24 : prof.waveRadius) * stats.areaMult,
              damage: baseWaveDmg * prof.damageMult * (isGrand360 ? 1.18 : 1.0),
              knockback: prof.knockback,
              pierce: isGrand360 ? 9 : prof.pierce,
              life: prof.waveLife,
              maxLife: prof.waveLife,
              hitIds: new Set(),
              rotation: ang,
              applyBurnPct: 0.025,
              color: '#F97316',
              trailColors: fusionWavePalette?.colors,
              particleShapes: fusionWavePalette?.shapes,
            });
          }
        }

        // 2. Water / Ice Sword: Wide Medium-Short Frost Waves (slow + stack toward freeze)
        if (hasWater) {
          const prof = getSpellbladeSwordProfile('water');
          const waterWaveVisual = getSpellbladeWaveKey('water');
          const waveCount = isGrand360 ? 5 : prof.waveCount;
          const iceSpd = prof.waveSpeed * stats.projSpeedMult;
          for (let i = 0; i < waveCount; i++) {
            const ang = isGrand360
              ? (i * Math.PI * 2) / waveCount
              : aim + (i - (waveCount - 1) / 2) * prof.waveSpread;
            sim.projectiles.push({
              weaponId: 'katana',
              evolved: true,
              customKind: 'sword_wave',
              fromClassSkill: true,
              vfxKey: waterWaveVisual.key,
              vfxTint: waterWaveVisual.tint,
              x: px,
              y: py,
              vx: Math.cos(ang) * iceSpd,
              vy: Math.sin(ang) * iceSpd,
              radius: (isGrand360 ? 25 : prof.waveRadius) * stats.areaMult,
              damage: baseWaveDmg * prof.damageMult,
              knockback: prof.knockback,
              pierce: prof.pierce,
              life: prof.waveLife,
              maxLife: prof.waveLife,
              hitIds: new Set(),
              rotation: ang,
              soakSlow: true,
              applyDeepFreeze: true,
              color: '#38BDF8',
              trailColors: fusionWavePalette?.colors,
              particleShapes: fusionWavePalette?.shapes,
            });
          }
          if (isGrand360) {
            const frostR = 185 * stats.areaMult;
            sim.groundFx.push({
              kind: 'shockwave',
              x: px,
              y: py,
              radius: 20,
              maxRadius: frostR,
              life: 0.35,
              maxLife: 0.35,
              color: '#67E8F9',
            });
            spawnVfx(sim.vfx, 'ice_nova', px, py, { scale: frostR / 48 });
            for (const en of sim.enemies) {
              if (en.hp <= 0) continue;
              if (Math.hypot(en.x - px, en.y - py) <= frostR + en.radius) {
                en.freezeTimer = Math.max(en.freezeTimer || 0, 2.0);
                en.hardFreezeTimer = Math.max(en.hardFreezeTimer || 0, en.isBoss ? 0.5 : 1.0);
              }
            }
          }
        }

        // 3. Light Sword:
        //    - Normal Mode: Narrow, fast, ultra-long piercing Light Lance wave (NO sky beams!)
        //    - Voidless Ascension Mode ONLY: Descends Heavenly Light Pillars from the sky!
        if (hasLight) {
          const prof = getSpellbladeSwordProfile('light');
          const lightWaveVisual = getSpellbladeWaveKey('light');
          const waveCount = isGrand360 ? 6 : prof.waveCount;
          const lightSpd = prof.waveSpeed * stats.projSpeedMult;
          for (let i = 0; i < waveCount; i++) {
            const ang = isGrand360 ? (i * Math.PI * 2) / waveCount : aim;
            sim.projectiles.push({
              weaponId: 'katana',
              evolved: true,
              customKind: 'sword_wave',
              fromClassSkill: true,
              vfxKey: lightWaveVisual.key,
              vfxTint: lightWaveVisual.tint,
              x: px,
              y: py,
              vx: Math.cos(ang) * lightSpd,
              vy: Math.sin(ang) * lightSpd,
              radius: (isGrand360 ? 18 : prof.waveRadius) * stats.areaMult,
              damage: baseWaveDmg * prof.damageMult,
              knockback: prof.knockback,
              pierce: prof.pierce,
              life: prof.waveLife,
              maxLife: prof.waveLife,
              hitIds: new Set(),
              rotation: ang,
              color: '#FDE047',
              trailColors: fusionWavePalette?.colors,
              particleShapes: fusionWavePalette?.shapes,
            });
          }

          if (inVoidless) {
            const pillarCount = isGrand360 ? 3 : 1;
            const activePillars = sim.elementalFields.filter((f) => f.kind === 'heaven_pillar').length;
            if (activePillars < 4) {
              const onScreen = sim.enemies.filter(
                (e) => e.hp > 0 && Math.hypot(e.x - px, e.y - py) <= 440
              );
              for (let k = 0; k < pillarCount; k++) {
                if (activePillars + k >= 4) break;
                const target =
                  onScreen.length > 0 && Math.random() < 0.8
                    ? onScreen[Math.floor(Math.random() * onScreen.length)]
                    : null;
                const ang = Math.random() * Math.PI * 2;
                const d = 80 + Math.random() * 240;
                const tx = target ? target.x + (Math.random() - 0.5) * 40 : px + Math.cos(ang) * d;
                const ty = target ? target.y + (Math.random() - 0.5) * 40 : py + Math.sin(ang) * d;
                sim.elementalFields.push({
                  kind: 'heaven_pillar',
                  vfxKey: 'voidless_heaven_pillar',
                  x: tx,
                  y: ty,
                  vx: 0,
                  vy: 0,
                  radius: 74 * stats.areaMult,
                  damage: baseWaveDmg * 0.68,
                  color: '#FDE047',
                  life: isGrand360 ? 2.8 : 2.1,
                  maxLife: isGrand360 ? 2.8 : 2.1,
                  tickTimer: 0.1,
                  pullStrength: 0,
                });
                spawnSheetVfx(sim, 'holy_pillar', tx, ty, { size: 165, life: 0.55 });
              }
            }
          }
        }

        // 4. Dark Sword: Compact Black Hole Vortex + Heavy Short Dark Cleave
        if (hasDark) {
          const prof = getSpellbladeSwordProfile('dark');
          const darkWaveVisual = getSpellbladeWaveKey('dark');
          const waveCount = isGrand360 ? 4 : prof.waveCount;
          const darkSpd = prof.waveSpeed * stats.projSpeedMult;
          for (let i = 0; i < waveCount; i++) {
            const ang = isGrand360 ? (i * Math.PI * 2) / waveCount : aim;
            sim.projectiles.push({
              weaponId: 'katana',
              evolved: true,
              customKind: 'sword_wave',
              fromClassSkill: true,
              vfxKey: darkWaveVisual.key,
              vfxTint: darkWaveVisual.tint,
              x: px,
              y: py,
              vx: Math.cos(ang) * darkSpd,
              vy: Math.sin(ang) * darkSpd,
              radius: (isGrand360 ? 24 : prof.waveRadius) * stats.areaMult,
              damage: baseWaveDmg * prof.damageMult,
              knockback: prof.knockback,
              pierce: prof.pierce,
              life: prof.waveLife,
              maxLife: prof.waveLife,
              hitIds: new Set(),
              rotation: ang,
              color: '#A855F7',
              trailColors: fusionWavePalette?.colors,
              particleShapes: fusionWavePalette?.shapes,
            });
          }
          const blackHoleCount = sim.elementalFields.filter((f) => f.kind === 'black_hole').length;
          const maxBlackHoles = isGrand360 ? 2 : 1;
          if (blackHoleCount < maxBlackHoles) {
            const spawns = isGrand360 && maxBlackHoles > 1 ? 2 : 1;
            for (let b = 0; b < spawns; b++) {
              if (blackHoleCount + b >= maxBlackHoles) break;
              const ang = isGrand360 ? aim + (b === 0 ? 0 : Math.PI) : aim;
              const dist = isGrand360 ? 165 : 140;
              const bhX = px + Math.cos(ang) * dist;
              const bhY = py + Math.sin(ang) * dist;
              const bhR = (isGrand360 ? 115 : 92) * stats.areaMult;
              const bhLife = isGrand360 ? 2.5 : 2.0;
              sim.elementalFields.push({
                kind: 'black_hole',
                vfxKey: 'spell_dark_dark',
                pullNonBossAll: true,
                exitSlowSec: 1.5,
                x: bhX,
                y: bhY,
                vx: 0,
                vy: 0,
                radius: bhR,
                damage: baseWaveDmg * 0.42,
                color: '#9333EA',
                life: bhLife,
                maxLife: bhLife,
                tickTimer: 0.16,
                pullStrength: 125,
                slowTargets: true,
              });
              spawnSheetVfx(sim, 'moon_eclipse', bhX, bhY, {
                size: Math.max(135, bhR * 2.25),
                life: 0.65,
              });
            }
          }
        }

        // 5. Wind Sword: Fast Short Cyclone Blade + Wind Death Mark
        if (hasWind) {
          const prof = getSpellbladeSwordProfile('wind');
          const windWaveVisual = getSpellbladeWaveKey('wind');
          const waveCount = isGrand360 ? 6 : prof.waveCount;
          const windSpd = prof.waveSpeed * stats.projSpeedMult;
          for (let i = 0; i < waveCount; i++) {
            const ang = isGrand360
              ? (i * Math.PI * 2) / waveCount + 0.25
              : aim;
            sim.projectiles.push({
              weaponId: 'katana',
              evolved: true,
              customKind: 'sword_wave',
              fromClassSkill: true,
              vfxKey: windWaveVisual.key,
              vfxTint: windWaveVisual.tint,
              x: px,
              y: py,
              vx: Math.cos(ang) * windSpd,
              vy: Math.sin(ang) * windSpd,
              radius: (isGrand360 ? 20 : prof.waveRadius) * stats.areaMult,
              damage: baseWaveDmg * prof.damageMult,
              knockback: prof.knockback,
              pierce: prof.pierce,
              life: prof.waveLife,
              maxLife: prof.waveLife,
              hitIds: new Set(),
              rotation: ang,
              applyWindMark: true,
              color: '#34D399',
              trailColors: fusionWavePalette?.colors,
              particleShapes: fusionWavePalette?.shapes,
            });
          }
        }

        // 6. Earth / Stone / Blood distinct waves
        if (hasEarth || hasStone || hasBlood) {
          const elKey: ElementId = hasEarth ? 'earth' : hasStone ? 'stone' : 'blood';
          const prof = getSpellbladeSwordProfile(elKey);
          const elWaveVisual = getSpellbladeWaveKey(elKey);
          const cnt = isGrand360 ? 4 : prof.waveCount;
          const spd = prof.waveSpeed * stats.projSpeedMult;
          for (let i = 0; i < cnt; i++) {
            const ang = isGrand360 ? (i * Math.PI * 2) / cnt : aim;
            sim.projectiles.push({
              weaponId: 'katana',
              evolved: true,
              customKind: 'sword_wave',
              fromClassSkill: true,
              vfxKey: elWaveVisual.key,
              vfxTint: elWaveVisual.tint,
              x: px,
              y: py,
              vx: Math.cos(ang) * spd,
              vy: Math.sin(ang) * spd,
              radius: prof.waveRadius * stats.areaMult,
              damage: baseWaveDmg * prof.damageMult,
              knockback: prof.knockback,
              pierce: prof.pierce,
              life: prof.waveLife,
              maxLife: prof.waveLife,
              hitIds: new Set(),
              rotation: ang,
              color: ELEMENTS[elKey].color,
              trailColors: fusionWavePalette?.colors,
              particleShapes: fusionWavePalette?.shapes,
            });
          }
        }

        // Neutral base blade fallback (before picking an element orb)
        if (!hasFire && !hasWater && !hasLight && !hasDark && !hasWind && !hasEarth && !hasStone && !hasBlood) {
          const prof = getSpellbladeSwordProfile(null);
          const neutralWaveVisual = getSpellbladeWaveKey(null);
          const cnt = isGrand360 ? 5 : 1;
          const spd = prof.waveSpeed * stats.projSpeedMult;
          for (let i = 0; i < cnt; i++) {
            const ang = isGrand360 ? (i * Math.PI * 2) / cnt : aim;
            sim.projectiles.push({
              weaponId: 'katana',
              evolved: true,
              customKind: 'sword_wave',
              fromClassSkill: true,
              vfxKey: neutralWaveVisual.key,
              vfxTint: neutralWaveVisual.tint,
              x: px,
              y: py,
              vx: Math.cos(ang) * spd,
              vy: Math.sin(ang) * spd,
              radius: prof.waveRadius * stats.areaMult,
              damage: baseWaveDmg * prof.damageMult,
              knockback: prof.knockback,
              pierce: prof.pierce,
              life: prof.waveLife,
              maxLife: prof.waveLife,
              hitIds: new Set(),
              rotation: ang,
              color: sim.spellbladeInfusionColor || '#F59E0B',
              trailColors: fusionWavePalette?.colors,
              particleShapes: fusionWavePalette?.shapes,
            });
          }
        }
      };

      const activateVoidlessMode = (
        sim: SimState,
        rawStats: ReturnType<typeof computeStats>
      ) => {
        sim.voidlessTimer = VOIDLESS_DURATION;
        sim.voidlessKills = 0;
        sim.voidlessPillarTimer = 2.4;
        const stats = computeStats(sim);
        const px = sim.player.x;
        const py = sim.player.y;
        const aim = Math.atan2(sim.player.facingY, sim.player.facingX);

        applyPlayerHeal(sim, 16);
        sim.mana = Math.min(stats.maxMana, sim.mana + 18);

        // Cast ALL 5 elemental sword techniques + Heaven Pillars ONCE upon entering Voidless Mode!
        triggerElementalSwordTechniques(
          sim,
          stats,
          ['fire', 'water', 'light', 'dark', 'wind'],
          aim,
          true,
          0.95
        );

        // Grand Voidless Activation Ring + Clear enemy bullets nearby
        const burstR = 260 * rawStats.areaMult;
        spawnPackVfx(sim.packVfx, 'voidless_awaken_burst', px, py, { scale: 2.8 });
        sim.groundFx.push({
          kind: 'grand_slash',
          x: px,
          y: py,
          radius: burstR * 0.35,
          maxRadius: burstR,
          life: 0.48,
          maxLife: 0.48,
          color: '#E0F2FE',
        });
        for (let bi = sim.enemyBullets.length - 1; bi >= 0; bi--) {
          if (Math.hypot(sim.enemyBullets[bi].x - px, sim.enemyBullets[bi].y - py) <= burstR) {
            sim.enemyBullets.splice(bi, 1);
          }
        }
        spawnParticles(sim, px, py, '#FFFFFF', 30, 260);
        sim.shakeTime = 0.25;
        sim.shakeIntensity = 7;
        triggerAbilityFlash(sim, 0.28, 0.26);

        // Summon 5 Autonomous Sentient Elemental Spirit Swords (HP = 60% of Hero Max HP!)
        const spiritElements: ElementId[] = ['fire', 'water', 'light', 'dark', 'wind'];
        const swordHp = Math.max(1, Math.round(sim.player.maxHp * 0.6));
        const swordDmg = (22 + sim.player.level * 1.4) * stats.damageMult;
        sim.spiritSwords = spiritElements.map((el, idx) => {
          const ang = (idx * Math.PI * 2) / spiritElements.length;
          return {
            id: idx + 1,
            element: el,
            x: px + Math.cos(ang) * 58,
            y: py + Math.sin(ang) * 58,
            vx: 0,
            vy: 0,
            angle: ang,
            hp: swordHp,
            maxHp: swordHp,
            damage: swordDmg,
            slashCooldown: 0.15 + idx * 0.1,
            swingTimer: 0,
            invulnTimer: 0.5,
            hitCooldowns: {},
          };
        });

        addFloatingText(sim, px, py - 40, 'เข้าสู่โหมดจุติไร้ธาตุ! ดาบธาตุ 5 เล่ม!', '#E0F2FE', 1.3);
        sim.announcement =
          'เข้าสู่โหมดจุติไร้ธาตุ (10 วิ)! เสาแสงสวรรค์ + ท่าดาบทั้ง 5 ธาตุ + ดาเมจ +55% + ลดดาเมจที่ได้รับ 50%';
        sim.announcementTimer = 4.5;
        sound.playLevelUp();
      };

      const castElementalFusion = (
        sim: SimState,
        def: ElementFusionDef,
        rawStats: ReturnType<typeof computeStats>,
        catalyst?: ElementId,
        resonance: FusionResonance = 'paired',
        powerScale = 1,
        areaScale = 1
      ) => {
        const px = sim.player.x;
        const py = sim.player.y;
        const resDmgMult = resonance === 'triple' ? 1.45 : resonance === 'harmony' ? 1.2 : 1.08;
        const resAreaMult = resonance === 'triple' ? 1.25 : resonance === 'harmony' ? 1.1 : 1.0;
        const catDmgMult = catalyst === 'fire' ? 1.18 : catalyst === 'dark' ? 1.15 : 1.0;
        const catAreaMult = catalyst === 'stone' ? 1.18 : 1.0;
        const stats = {
          ...rawStats,
          damageMult: rawStats.damageMult * resDmgMult * catDmgMult * powerScale,
          areaMult: rawStats.areaMult * resAreaMult * catAreaMult * areaScale,
        };
        const baseDmg = (22 + sim.player.level * 2.65) * stats.damageMult * (1 + sim.godBlessings.reactionBonus);
        sim.reactionCount += 1;
        const spellKey = getMageSpellVfxKey(def.a, def.b);
        const fusionPalette = getCombinedElementPalette(
          catalyst ? [def.a, def.b, catalyst] : [def.a, def.b],
          def.color
        );

        // 3rd-element Catalyst secondary tactical pulse
        if (catalyst && powerScale >= 0.8) {
          const catR = 135 * stats.areaMult;
          if (catalyst === 'light') {
            for (let bi = sim.enemyBullets.length - 1; bi >= 0; bi--) {
              if (Math.hypot(sim.enemyBullets[bi].x - px, sim.enemyBullets[bi].y - py) <= catR) {
                sim.enemyBullets.splice(bi, 1);
              }
            }
            sim.groundFx.push({
              kind: 'shockwave',
              x: px,
              y: py,
              radius: 14,
              maxRadius: catR,
              life: 0.25,
              maxLife: 0.25,
              color: '#FACC15',
            });
          } else if (catalyst === 'water') {
            sim.mana = Math.min(stats.maxMana, sim.mana + 3);
            for (const e of sim.enemies) {
              if (e.hp > 0 && Math.hypot(e.x - px, e.y - py) <= catR + e.radius) {
                e.freezeTimer = Math.max(e.freezeTimer || 0, 1.35);
              }
            }
          } else if (catalyst === 'fire') {
            for (const e of sim.enemies) {
              if (e.hp > 0 && Math.hypot(e.x - px, e.y - py) <= catR * 0.85 + e.radius) {
                damageEnemy(sim, e, baseDmg * 0.32, null, 35, e.x - px, e.y - py, stats.greedMult);
              }
            }
          } else if (catalyst === 'earth') {
            for (const e of sim.enemies) {
              if (e.hp <= 0 || e.knockbackResist >= 1) continue;
              const d = Math.hypot(e.x - px, e.y - py);
              if (d <= catR + e.radius && d > 1) {
                const effKb = Math.min(0.98, e.knockbackResist + (sim.mapEvent === 'gravity_well' ? 0.35 : 0));
                const push = (1 - effKb) * 165;
                e.kbVx += ((e.x - px) / d) * push;
                e.kbVy += ((e.y - py) / d) * push;
              }
            }
          } else if (catalyst === 'dark') {
            for (const e of sim.enemies) {
              if (e.hp <= 0 || e.knockbackResist >= 1) continue;
              const d = Math.hypot(e.x - px, e.y - py);
              if (d <= catR * 1.4 && d > 42) {
                const effKb = Math.min(0.98, e.knockbackResist + (sim.mapEvent === 'gravity_well' ? 0.35 : 0));
                const pull = (1 - effKb) * 95;
                e.kbVx -= ((e.x - px) / d) * pull;
                e.kbVy -= ((e.y - py) / d) * pull;
              }
            }
          } else if (catalyst === 'blood') {
            const hasTarget = sim.enemies.some((e) => e.hp > 0 && Math.hypot(e.x - px, e.y - py) <= catR * 1.5);
            if (hasTarget) {
              const heal = resonance === 'triple' ? 2 : 1;
              applyLeechHeal(sim, heal);
            }
          }
        }

        const findNearest = (range = 520): EnemyEntity | null => {
          let best: EnemyEntity | null = null;
          let bestD2 = range * range;
          for (const e of sim.enemies) {
            if (e.hp <= 0) continue;
            const d2 = (e.x - px) ** 2 + (e.y - py) ** 2;
            if (d2 < bestD2) {
              bestD2 = d2;
              best = e;
            }
          }
          return best;
        };

        const b = def.behavior;

        if (b === 'frost_golem' || b === 'stone_golem') {
          const isFrost = b === 'frost_golem';
          sim.elementalGolem = {
            theme: isFrost ? 'frost' : 'stone',
            x: px + (Math.random() - 0.5) * 48,
            y: py + (Math.random() - 0.5) * 48,
            life: 11,
            maxLife: 11,
            walkCycle: 0,
            smashCooldown: 0.35,
            smashingTimer: 0,
          };
          const burstR = (isFrost ? 130 : 115) * stats.areaMult;
          sim.groundFx.push({
            kind: 'shockwave',
            x: px,
            y: py,
            radius: 16,
            maxRadius: burstR,
            life: 0.38,
            maxLife: 0.38,
            color: def.color,
          });
          if (isFrost) {
            spawnVfx(sim.vfx, 'ice_nova', px, py, { scale: burstR / 48 });
          }
          spawnPaletteBurst(sim, px, py, fusionPalette, 16, 175, { radius: 3.6, life: 0.55 });
          for (const e of sim.enemies) {
            if (e.hp <= 0) continue;
            if (Math.hypot(e.x - px, e.y - py) <= burstR + e.radius) {
              if (isFrost) e.freezeTimer = Math.max(e.freezeTimer || 0, 1.6);
              damageEnemy(sim, e, baseDmg * 1.0, null, 120, e.x - px, e.y - py, stats.greedMult);
            }
          }
          sound.playMagicCast();
          return;
        }

        if (b === 'scan_laser') {
          const nearest = findNearest(460);
          const startAng = nearest
            ? Math.atan2(nearest.y - py, nearest.x - px) - 0.4
            : Math.atan2(sim.player.facingY, sim.player.facingX);
          if (sim.sweepingLasers.length >= 2) sim.sweepingLasers.shift();
          sim.sweepingLasers.push({
            angle: startAng,
            angularSpeed: (Math.PI * 2) / 1.1,
            length: 280 * stats.areaMult,
            width: 14 * stats.areaMult,
            damage: baseDmg * 1.05,
            color: def.color,
            vfxKey: spellKey,
            trailColors: fusionPalette.colors,
            particleShapes: fusionPalette.shapes,
            trailTimer: 0.04,
            life: 1.15,
            maxLife: 1.15,
            tickCooldowns: {},
          });
          sim.groundFx.push({
            kind: 'shockwave',
            x: px,
            y: py,
            radius: 14,
            maxRadius: 80 * stats.areaMult,
            life: 0.3,
            maxLife: 0.3,
            color: def.color,
          });
          spawnPaletteBurst(sim, px, py, fusionPalette, 14, 165, { radius: 3.3, life: 0.5 });
          sound.playLightning();
          return;
        }

        if (b === 'shadow_blades' || b === 'crimson_wind') {
          const bladeCount = 3;
          const orbitR = (b === 'crimson_wind' ? 105 : 90) * stats.areaMult;
          const spd = b === 'crimson_wind' ? 4.2 : 3.6;
          while (sim.orbitingBlades.length > 6) sim.orbitingBlades.shift();
          for (let i = 0; i < bladeCount; i++) {
            sim.orbitingBlades.push({
              angle: sim.elapsedSeconds * 1.5 + (i * Math.PI * 2) / bladeCount,
              angularSpeed: spd,
              orbitRadius: orbitR,
              radius: 14 * stats.areaMult,
              damage: baseDmg * 0.72,
              color: def.color,
              vfxKey: spellKey,
              trailColors: fusionPalette.colors,
              particleShapes: fusionPalette.shapes,
              trailTimer: 0.05,
              life: 2.5,
              maxLife: 2.5,
              hitCooldowns: {},
            });
          }
          spawnPaletteBurst(sim, px, py, fusionPalette, 12, 145, { radius: 3.2, life: 0.45 });
          sound.playWeaponThrow();
          return;
        }

        if (b === 'blood_spikes') {
          const targets = sim.enemies.filter((e) => e.hp > 0 && Math.hypot(e.x - px, e.y - py) < 440);
          let hits = 0;
          const spikeR = 86 * stats.areaMult;
          for (let s = 0; s < 3; s++) {
            const t =
              targets.length > 0
                ? targets[Math.floor(Math.random() * targets.length)]
                : { x: px + (Math.random() - 0.5) * 200, y: py + (Math.random() - 0.5) * 200 };
            sim.groundFx.push({
              kind: 'explosion',
              x: t.x,
              y: t.y,
              radius: 14,
              maxRadius: spikeR,
              life: 0.38,
              maxLife: 0.38,
              color: def.color,
            });
            spawnPackVfx(sim.packVfx, spellKey, t.x, t.y, { scale: Math.max(1.6, (spikeR * 1.8) / 56) });
            spawnVfx(sim.vfx, 'blood_burst', t.x, t.y, { scale: 1.15 });
            spawnPaletteBurst(sim, t.x, t.y, fusionPalette, 12, 160, { radius: 3.4, life: 0.5 });
            for (const e of sim.enemies) {
              if (e.hp <= 0) continue;
              if (Math.hypot(e.x - t.x, e.y - t.y) <= spikeR + e.radius) {
                hits++;
                damageEnemy(sim, e, baseDmg * 1.05, null, 90, e.x - t.x, e.y - t.y, stats.greedMult);
              }
            }
          }
          const heal = Math.min(6, 1 + Math.floor(hits / 3));
          const healed = applyLeechHeal(sim, heal);
          if (healed > 0) {
            addFloatingText(sim, px, py - 24, `+${healed} HP`, '#FB7185', 0.9);
          }
          sound.playMagicCast();
          return;
        }

        if (
          b === 'firestorm' ||
          b === 'dust_vortex' ||
          b === 'pure_void' ||
          b === 'quicksand' ||
          b === 'magma_eruption' ||
          b === 'hellfire' ||
          b === 'cursed_hands'
        ) {
          const target = findNearest(460);
          const tx = target ? target.x : px + sim.player.facingX * 140;
          const ty = target ? target.y : py + sim.player.facingY * 140;
          const isVortex = b === 'firestorm' || b === 'dust_vortex' || b === 'pure_void';
          const ang = Math.atan2(ty - py, tx - px);
          if (sim.elementalFields.length >= 6) sim.elementalFields.shift();
          const fRad = (isVortex ? 72 : 80) * stats.areaMult;
          sim.elementalFields.push({
            kind: isVortex ? 'vortex' : 'pool',
            vfxKey: spellKey,
            x: tx,
            y: ty,
            vx: isVortex ? Math.cos(ang) * 65 : 0,
            vy: isVortex ? Math.sin(ang) * 65 : 0,
            radius: fRad,
            damage: baseDmg * 0.58,
            color: def.color,
            trailColors: fusionPalette.colors,
            particleShapes: fusionPalette.shapes,
            trailTimer: 0.08,
            life: 2.7,
            maxLife: 2.7,
            tickTimer: 0.08,
            pullStrength: b === 'pure_void' || b === 'firestorm' ? 75 : 0,
            slowTargets: b === 'quicksand' || b === 'cursed_hands' || b === 'dust_vortex',
          });
          if (!PACK_VFX[spellKey].loop) {
            spawnPackVfx(sim.packVfx, spellKey, tx, ty, { scale: Math.max(1.8, (fRad * 2.0) / PACK_VFX[spellKey].w) });
          }
          if (b === 'pure_void' || b === 'dust_vortex') {
            spawnSheetVfx(sim, 'moon_eclipse', tx, ty, {
              size: Math.max(145, fRad * 2.15),
              life: 0.72,
            });
          } else if (b === 'hellfire') {
            spawnVfx(sim.vfx, 'explosion_hellfire', tx, ty, { scale: 0.9 });
          } else if (b === 'cursed_hands') {
            spawnVfx(sim.vfx, 'magic_circle_crimson', tx, ty, {
              scale: fRad / 44,
              lifetime: 2.4,
              squashY: ISO_TILT,
            });
          }
          spawnPaletteBurst(sim, tx, ty, fusionPalette, 12, 150, { radius: 3.3, life: 0.5 });
          sound.playMagicCast();
          return;
        }

        if (
          b === 'healing_spring' ||
          b === 'sanctuary' ||
          b === 'sacred_sacrifice' ||
          b === 'boiling_blood' ||
          b === 'blood_tide' ||
          b === 'pure_deluge'
        ) {
          const ringR = 122 * stats.areaMult;
          sim.groundFx.push({
            kind: 'shockwave',
            x: px,
            y: py,
            radius: 18,
            maxRadius: ringR,
            life: 0.36,
            maxLife: 0.36,
            color: def.color,
          });
          spawnPackVfx(sim.packVfx, spellKey, px, py, {
            groundPlane:
              b === 'healing_spring' ||
              b === 'sanctuary' ||
              b === 'pure_deluge' ||
              b === 'blood_tide',
            scale: Math.max(2.0, (ringR * 2.15) / PACK_VFX[spellKey].w),
          });
          if (b === 'healing_spring' || b === 'sanctuary' || b === 'sacred_sacrifice') {
            spawnSheetVfx(sim, 'holy_sigil', px, py, {
              size: ringR * 2.2,
              life: 1.3,
              upright: false,
            });
            if (sim.healSparkleTimer <= 0) {
              sim.healSparkleTimer = 1.0;
              spawnSheetVfx(sim, 'sanctum_burst', px, py, {
                size: 136,
                life: 0.68,
                zOffset: 12,
              });
            }
          } else if (b === 'boiling_blood' || b === 'blood_tide') {
            spawnVfx(sim.vfx, 'blood_burst', px, py, { scale: 1.3 });
          }
          spawnPaletteBurst(sim, px, py, fusionPalette, 18, 185, { radius: 3.5, life: 0.55 });
          let hitCount = 0;
          for (const e of sim.enemies) {
            if (e.hp <= 0) continue;
            if (Math.hypot(e.x - px, e.y - py) <= ringR + e.radius) {
              hitCount++;
              damageEnemy(sim, e, baseDmg * 0.98, null, 115, e.x - px, e.y - py, stats.greedMult);
            }
          }
          if (b === 'healing_spring' || b === 'sacred_sacrifice' || b === 'sanctuary') {
            for (let bi = sim.enemyBullets.length - 1; bi >= 0; bi--) {
              if (Math.hypot(sim.enemyBullets[bi].x - px, sim.enemyBullets[bi].y - py) <= ringR) {
                sim.enemyBullets.splice(bi, 1);
              }
            }
          }
          const heal = b === 'healing_spring' ? 6 : Math.min(4, 1 + Math.floor(hitCount / 4));
          const healed = applyPlayerHeal(sim, heal);
          if (healed > 0) {
            addFloatingText(sim, px, py - 24, `+${healed} HP`, '#34D399', 0.9);
          }
          if (b === 'healing_spring') {
            sim.mana = Math.min(stats.maxMana, sim.mana + 7);
          }
          sound.playMagicCast();
          return;
        }

        if (b === 'solar_flare' || b === 'holy_prism' || b === 'eclipse_nova') {
          const beams = b === 'solar_flare' ? 4 : b === 'holy_prism' ? 3 : 5;
          const nearest = findNearest(500);
          const baseAng = nearest
            ? Math.atan2(nearest.y - py, nearest.x - px)
            : sim.elapsedSeconds * 1.2;
          const beamLen = 520;
          const halfW = 14 * stats.areaMult;
          spawnPackVfx(sim.packVfx, spellKey, px, py, { scale: 2.5 });
          spawnSheetVfx(sim, 'sanctum_burst', px, py, { size: 175, life: 0.58, zOffset: 12 });
          spawnPaletteBurst(sim, px, py, fusionPalette, 16, 195, { radius: 3.4, life: 0.5 });
          for (let i = 0; i < beams; i++) {
            const ang = baseAng + (i * Math.PI * 2) / beams;
            const bx2 = px + Math.cos(ang) * beamLen;
            const by2 = py + Math.sin(ang) * beamLen;
            sim.groundFx.push({
              kind: 'beam',
              x: px,
              y: py,
              x2: bx2,
              y2: by2,
              radius: halfW * 2,
              maxRadius: halfW * 2,
              life: 0.22,
              maxLife: 0.22,
              color: fusionPalette.colors[i % fusionPalette.colors.length],
            });
            const dxB = bx2 - px;
            const dyB = by2 - py;
            const len2 = dxB * dxB + dyB * dyB;
            for (const e of sim.enemies) {
              if (e.hp <= 0) continue;
              const tProj = Math.max(0, Math.min(1, ((e.x - px) * dxB + (e.y - py) * dyB) / len2));
              const cx = px + tProj * dxB;
              const cy = py + tProj * dyB;
              if (Math.hypot(e.x - cx, e.y - cy) <= halfW + e.radius) {
                damageEnemy(sim, e, baseDmg * 1.1, null, 65, dxB, dyB, stats.greedMult);
              }
            }
          }
          sound.playLightning();
          return;
        }

        if (
          b === 'meteor_storm' ||
          b === 'pure_judgment' ||
          b === 'pure_inferno' ||
          b === 'pure_quake'
        ) {
          const count = b === 'pure_quake' ? 1 : 3;
          const blastR = (b === 'pure_quake' ? 138 : 80) * stats.areaMult;
          const targets = sim.enemies.filter((e) => e.hp > 0 && Math.hypot(e.x - px, e.y - py) < 460);
          let lastX = px;
          let lastY = py;
          for (let m = 0; m < count; m++) {
            const t =
              b === 'pure_quake'
                ? { x: px, y: py }
                : targets.length > 0
                  ? targets[Math.floor(Math.random() * targets.length)]
                  : { x: px + (Math.random() - 0.5) * 240, y: py + (Math.random() - 0.5) * 240 };
            lastX = t.x;
            lastY = t.y;
            sim.groundFx.push({
              kind: b === 'pure_judgment' ? 'lightning' : 'explosion',
              x: t.x,
              y: t.y,
              radius: 16,
              maxRadius: blastR,
              life: 0.34,
              maxLife: 0.34,
              color: def.color,
            });
            spawnPackVfx(sim.packVfx, spellKey, t.x, t.y, {
              groundPlane: b === 'pure_quake',
              scale: Math.max(2.0, (blastR * 2.0) / PACK_VFX[spellKey].w),
            });
            if (b === 'pure_judgment') {
              spawnSheetVfx(sim, 'holy_smite', t.x, t.y, { size: 175, life: 0.45 });
            } else if (b === 'pure_quake') {
              spawnSheetVfx(sim, 'ground_slam', t.x, t.y, {
                size: blastR * 2.05,
                life: 0.48,
                upright: false,
              });
            } else {
              spawnVfx(sim.vfx, 'explosion_fire', t.x, t.y, { scale: blastR / 40 });
            }
            spawnPaletteBurst(sim, t.x, t.y, fusionPalette, 12, 165, { radius: 3.5, life: 0.55 });
            for (const e of sim.enemies) {
              if (e.hp <= 0) continue;
              if (Math.hypot(e.x - t.x, e.y - t.y) <= blastR + e.radius) {
                if (b === 'pure_quake') e.freezeTimer = Math.max(e.freezeTimer || 0, 1.0);
                damageEnemy(sim, e, baseDmg * 1.12, null, 100, e.x - t.x, e.y - t.y, stats.greedMult);
              }
            }
          }
          if (b === 'meteor_storm') {
            if (sim.elementalFields.length >= 5) sim.elementalFields.shift();
            sim.elementalFields.push({
              kind: 'pool',
              vfxKey: spellKey,
              x: lastX,
              y: lastY,
              vx: 0,
              vy: 0,
              radius: 68 * stats.areaMult,
              damage: baseDmg * 0.45,
              color: '#EA580C',
              trailColors: fusionPalette.colors,
              particleShapes: fusionPalette.shapes,
              trailTimer: 0.08,
              life: 2.2,
              maxLife: 2.2,
              tickTimer: 0.12,
              pullStrength: 0,
              slowTargets: false,
            });
          }
          sound.playEnemyKill(false);
          return;
        }

        // Steam blast leaves a pressurized scalding mist pool around the player
        if (b === 'steam_blast') {
          spawnPackVfx(sim.packVfx, spellKey, px, py, { scale: 2.3 });
          if (sim.elementalFields.length >= 5) sim.elementalFields.shift();
          sim.elementalFields.push({
            kind: 'pool',
            vfxKey: spellKey,
            x: px,
            y: py,
            vx: 0,
            vy: 0,
            radius: 90 * stats.areaMult,
            damage: baseDmg * 0.44,
            color: '#67E8F9',
            trailColors: fusionPalette.colors,
            particleShapes: fusionPalette.shapes,
            trailTimer: 0.08,
            life: 2.2,
            maxLife: 2.2,
            tickTimer: 0.12,
            pullStrength: 0,
            slowTargets: true,
          });
        }

        // Projectile & Radial Burst Elemental Spells
        const count =
          b === 'shatter_gale' || b === 'pure_tempest'
            ? 6
            : b === 'vampire_bats' || b === 'glacial_crystal'
              ? 4
              : 3;
        const nearest = findNearest(500);
        const baseAim = nearest
          ? Math.atan2(nearest.y - py, nearest.x - px)
          : Math.atan2(sim.player.facingY, sim.player.facingX);
        const radial =
          b === 'shatter_gale' ||
          b === 'pure_tempest' ||
          b === 'steam_blast' ||
          b === 'obsidian_burst' ||
          b === 'radiant_zephyr';

        if (b === 'radiant_zephyr') {
          for (let bi = sim.enemyBullets.length - 1; bi >= 0; bi--) {
            if (Math.hypot(sim.enemyBullets[bi].x - px, sim.enemyBullets[bi].y - py) <= 125) {
              sim.enemyBullets.splice(bi, 1);
            }
          }
        }

        for (let i = 0; i < count; i++) {
          const ang = radial
            ? (i * Math.PI * 2) / count + sim.elapsedSeconds
            : baseAim + (i - (count - 1) / 2) * 0.24;
          const spd = (b === 'pure_boulder' || b === 'bloodstone' ? 305 : 410) * stats.projSpeedMult;
          sim.projectiles.push({
            weaponId:
              b === 'vampire_bats'
                ? 'bird'
                : b === 'pure_tempest'
                  ? 'katana'
                  : b === 'pure_boulder' || b === 'bloodstone' || b === 'obsidian_burst'
                    ? 'axe'
                    : b === 'glacial_crystal' || b === 'pure_tsunami'
                      ? 'watergun'
                      : 'wand',
            evolved: true,
            fromClassSkill: true,
            vfxKey: spellKey,
            x: px,
            y: py,
            vx: Math.cos(ang) * spd,
            vy: Math.sin(ang) * spd,
            radius: (b === 'pure_boulder' || b === 'pure_tsunami' ? 17 : 12) * stats.areaMult,
            damage: baseDmg * (b === 'pure_boulder' ? 1.2 : 0.8),
            knockback: b === 'pure_tsunami' || b === 'pure_boulder' || b === 'bloodstone' ? 150 : 65,
            pierce: b === 'pure_boulder' || b === 'pure_tsunami' ? 5 : 2,
            life: 1.05,
            maxLife: 1.05,
            hitIds: new Set(),
            rotation: ang,
            homing: b === 'vampire_bats' || b === 'radiant_zephyr',
            soakSlow: b === 'pure_tsunami' || b === 'glacial_crystal' || b === 'abyss_tide',
            explosive: b === 'obsidian_burst' || b === 'steam_blast',
            color: fusionPalette.colors[i % fusionPalette.colors.length],
            trailColors: fusionPalette.colors,
            particleShapes: fusionPalette.shapes,
            trailTimer: 0.02,
          });
        }
        sound.playMagicCast();
      };

      const fireWeapons = (
        sim: SimState,
        dt: number,
        stats: ReturnType<typeof computeStats>
      ) => {
        const px = sim.player.x;
        const py = sim.player.y;
        const race = RACES[raceId];
        const orcKbMult = raceId === 'orc' ? 1.35 : 1;

        const findNearestEnemy = (maxRange = 540): EnemyEntity | null => {
          let best: EnemyEntity | null = null;
          let bestD2 = maxRange * maxRange;
          for (const e of sim.enemies) {
            if (e.hp <= 0) continue;
            const d2 = (e.x - px) ** 2 + (e.y - py) ** 2;
            if (d2 < bestD2) {
              bestD2 = d2;
              best = e;
            }
          }
          return best;
        };

        for (const w of sim.weapons) {
          if (w.id === 'fireorb' || w.id === 'shield' || w.id === 'garlic' || w.id === 'chain') {
            // Handled continuously
            continue;
          }

          w.cooldownTimer -= dt;
          if (w.cooldownTimer > 0) continue;

          const lv = w.level;
          const evo = w.evolved;
          const evoPal = evo ? getEvolvedWeaponPalette(w.id) : null;

          if (w.id === 'banana') {
            const baseCd = evo ? 0.65 : Math.max(0.85, 1.45 - lv * 0.11);
            w.cooldownTimer = baseCd * stats.cooldownMult;
            const count = evo ? 5 : Math.min(4, lv);
            const dmg = (evo ? 40 : 14 + lv * 5) * stats.damageMult;
            const nearest = findNearestEnemy(480);
            const baseAngle = nearest
              ? Math.atan2(nearest.y - py, nearest.x - px)
              : Math.atan2(sim.player.facingY, sim.player.facingX);

            sound.playWeaponThrow();
            for (let i = 0; i < count; i++) {
              const angle =
                count === 1
                  ? baseAngle
                  : baseAngle + (i * Math.PI * 2) / count;
              const spd = (evo ? 390 : 300 + lv * 16) * stats.projSpeedMult;
              sim.projectiles.push({
                weaponId: 'banana',
                evolved: evo,
                x: px,
                y: py,
                vx: Math.cos(angle) * spd,
                vy: Math.sin(angle) * spd,
                radius: (evo ? 18 : 13) * stats.areaMult,
                damage: dmg,
                knockback: 65 * orcKbMult,
                pierce: evo ? 999 : 3 + lv * 2,
                life: evo ? 2.1 : 1.65,
                maxLife: evo ? 2.1 : 1.65,
                hitIds: new Set(),
                rotation: angle,
                boomerang: true,
                returnSpeed: spd * 1.4,
                color: evo ? '#F59E0B' : '#FACC15',
                trailColors: evoPal?.colors,
                particleShapes: evoPal?.shapes,
              });
            }
          } else if (w.id === 'axe') {
            const baseCd = evo ? 0.85 : Math.max(1.15, 1.85 - lv * 0.14);
            w.cooldownTimer = baseCd * stats.cooldownMult;
            const count = evo ? 7 : lv >= 5 ? 4 : lv >= 3 ? 3 : lv >= 2 ? 2 : 1;
            const dmg = (evo ? 54 : 21 + lv * 8) * stats.damageMult;
            sound.playWeaponThrow();
            for (let i = 0; i < count; i++) {
              const angle = (i * Math.PI * 2) / count + sim.elapsedSeconds * 1.3;
              const spd = (evo ? 310 : 250) * stats.projSpeedMult;
              sim.projectiles.push({
                weaponId: 'axe',
                evolved: evo,
                x: px,
                y: py,
                vx: Math.cos(angle) * spd,
                vy: Math.sin(angle) * spd,
                radius: (evo ? 24 : 16 + lv * 1.5) * stats.areaMult,
                damage: dmg,
                knockback: 145 * orcKbMult,
                pierce: evo ? 999 : 3 + lv,
                life: evo ? 1.8 : 1.4,
                maxLife: evo ? 1.8 : 1.4,
                hitIds: new Set(),
                rotation: 0,
                color: evo ? '#E11D48' : '#CBD5E1',
                trailColors: evoPal?.colors,
                particleShapes: evoPal?.shapes,
              });
            }
          } else if (w.id === 'dagger') {
            const baseCd = evo ? 0.42 : Math.max(0.55, 1.0 - lv * 0.08);
            w.cooldownTimer = baseCd * stats.cooldownMult;
            const count = evo ? 4 : Math.min(4, 1 + Math.floor(lv * 0.7));
            const dmg = (evo ? 26 : 10 + lv * 3.8) * stats.damageMult;
            const nearest = findNearestEnemy(450);
            const aim = nearest
              ? Math.atan2(nearest.y - py, nearest.x - px)
              : Math.atan2(sim.player.facingY, sim.player.facingX);
            sound.playWeaponThrow();
            for (let i = 0; i < count; i++) {
              const spread = (i - (count - 1) / 2) * 0.14;
              const angle = aim + spread;
              const spd = 520 * stats.projSpeedMult;
              sim.projectiles.push({
                weaponId: 'dagger',
                evolved: evo,
                x: px,
                y: py,
                vx: Math.cos(angle) * spd,
                vy: Math.sin(angle) * spd,
                radius: 9 * stats.areaMult,
                damage: dmg,
                knockback: 40 * orcKbMult,
                pierce: evo ? 4 : lv >= 3 ? 2 : 1,
                life: 0.95,
                maxLife: 0.95,
                hitIds: new Set(),
                rotation: angle,
                color: evo ? '#F8FAFC' : '#94A3B8',
                trailColors: evoPal?.colors,
                particleShapes: evoPal?.shapes,
              });
            }
          } else if (w.id === 'wand') {
            if (!race.canUseMagic) continue;
            const baseCd = evo ? 0.55 : Math.max(0.78, 1.35 - lv * 0.11);
            w.cooldownTimer = baseCd * stats.cooldownMult;
            const count = evo ? 4 : lv >= 5 ? 3 : lv >= 3 ? 2 : 1;
            const dmg = (evo ? 36 : 15 + lv * 5) * stats.damageMult;
            const nearest = findNearestEnemy(560);
            const baseAngle = nearest
              ? Math.atan2(nearest.y - py, nearest.x - px)
              : Math.random() * Math.PI * 2;
            sound.playMagicCast();
            for (let i = 0; i < count; i++) {
              const a = baseAngle + (i - (count - 1) / 2) * 0.25;
              const spd = 380 * stats.projSpeedMult;
              sim.projectiles.push({
                weaponId: 'wand',
                evolved: evo,
                x: px,
                y: py,
                vx: Math.cos(a) * spd,
                vy: Math.sin(a) * spd,
                radius: (evo ? 12 : 9) * stats.areaMult,
                damage: dmg,
                knockback: 35,
                pierce: evo ? 2 : 1,
                life: 1.5,
                maxLife: 1.5,
                hitIds: new Set(),
                rotation: a,
                homing: true,
                explosive: evo,
                color: evo ? '#7DD3FC' : '#38BDF8',
                trailColors: evoPal?.colors,
                particleShapes: evoPal?.shapes,
              });
            }
          } else if (w.id === 'lightning') {
            if (!race.canUseMagic) continue;
            const baseCd = evo ? 1.35 : Math.max(1.65, 2.5 - lv * 0.17);
            w.cooldownTimer = baseCd * stats.cooldownMult;
            const strikes = evo ? 6 : lv >= 5 ? 5 : lv >= 4 ? 4 : lv >= 2 ? 3 : 2;
            const radius = (evo ? 74 : 48 + lv * 5) * stats.areaMult;
            const dmg = (evo ? 62 : 24 + lv * 8.5) * stats.damageMult;

            const onScreen = sim.enemies.filter(
              (e) =>
                e.hp > 0 &&
                Math.abs(e.x - px) < window.innerWidth * 0.48 &&
                Math.abs(e.y - py) < window.innerHeight * 0.48
            );
            if (onScreen.length > 0) {
              sound.playLightning();
              for (let s = 0; s < strikes; s++) {
                const target = onScreen[Math.floor(Math.random() * onScreen.length)];
                sim.groundFx.push({
                  kind: 'lightning',
                  x: target.x,
                  y: target.y,
                  radius,
                  maxRadius: radius,
                  life: 0.32,
                  maxLife: 0.32,
                  color: evo ? '#C4B5FD' : '#A78BFA',
                });
                spawnPackVfx(sim.packVfx, 'lightning_zap', target.x, target.y, {
                  scale: Math.max(1.8, radius / 22),
                });
                spawnSheetVfx(sim, 'holy_smite', target.x, target.y, {
                  size: Math.max(120, radius * 2.0),
                  life: 0.38,
                });
                if (evoPal) {
                  spawnPaletteBurst(sim, target.x, target.y, evoPal, 9, 155, {
                    radius: 3.3,
                    life: 0.45,
                  });
                }
                for (const e of sim.enemies) {
                  if (e.hp <= 0) continue;
                  const dist = Math.hypot(e.x - target.x, e.y - target.y);
                  if (dist <= radius + e.radius) {
                    damageEnemy(sim, e, dmg, 'lightning', 30, e.x - target.x, e.y - target.y, stats.greedMult);
                    if (e.wetTimer && e.wetTimer > 0) {
                      triggerWetLightningChain(sim, e.x, e.y, dmg, stats, new Set([e.id]));
                    }
                  }
                }
                hitWorldTargetsInCircle(sim, target.x, target.y, radius, dmg, stats);
              }
            }
          } else if (w.id === 'mace') {
            const baseCd = evo ? 0.95 : Math.max(1.2, 1.85 - lv * 0.13);
            w.cooldownTimer = baseCd * stats.cooldownMult;
            const armorBonus = 1 + stats.armor * 0.12;
            const dmg = (evo ? 76 : 28 + lv * 9.5) * stats.damageMult * armorBonus;
            const radius = (evo ? 160 : 96 + lv * 11) * stats.areaMult;
            sound.playEnemyKill(false);
            sim.groundFx.push({
              kind: 'shockwave',
              x: px,
              y: py,
              radius: 18,
              maxRadius: radius,
              life: 0.36,
              maxLife: 0.36,
              color: evo ? '#FBBF24' : '#D97706',
            });
            spawnPackVfx(sim.packVfx, evo ? 'mace_quake_evo' : 'mace_quake', px, py, {
              groundPlane: true,
              scale: Math.max(1.4, (radius * 2.15) / 96),
            });
            spawnSheetVfx(sim, 'ground_slam', px, py, {
              size: Math.max(165, radius * 2.0),
              life: 0.46,
              upright: false,
            });
            if (evoPal) {
              spawnPaletteBurst(sim, px, py, evoPal, 16, 185, {
                radius: 3.8,
                life: 0.5,
              });
            }
            sim.shakeTime = Math.max(sim.shakeTime, 0.1);
            sim.shakeIntensity = Math.max(sim.shakeIntensity, evo ? 4.5 : 2.5);
            for (const e of sim.enemies) {
              if (e.hp <= 0) continue;
              const dist = Math.hypot(e.x - px, e.y - py);
              if (dist <= radius + e.radius) {
                damageEnemy(sim, e, dmg, 'mace', 195 * orcKbMult, e.x - px, e.y - py, stats.greedMult);
              }
            }
            hitWorldTargetsInCircle(sim, px, py, radius, dmg, stats);
          } else if (w.id === 'katana') {
            const baseCd = evo ? 0.65 : Math.max(0.85, 1.45 - lv * 0.12);
            w.cooldownTimer = baseCd * stats.cooldownMult;
            const dirs = evo ? 4 : lv >= 5 ? 3 : lv >= 3 ? 2 : 1;
            const dmg = (evo ? 48 : 19 + lv * 7) * stats.damageMult;
            const baseAngle = Math.atan2(sim.player.facingY, sim.player.facingX);
            sound.playWeaponThrow();
            for (let i = 0; i < dirs; i++) {
              const angle = baseAngle + (i * Math.PI * 2) / dirs;
              const spd = 420 * stats.projSpeedMult;
              sim.projectiles.push({
                weaponId: 'katana',
                evolved: evo,
                x: px + Math.cos(angle) * 20,
                y: py + Math.sin(angle) * 20,
                vx: Math.cos(angle) * spd,
                vy: Math.sin(angle) * spd,
                radius: (evo ? 42 : 28 + lv * 2.5) * stats.areaMult,
                damage: dmg,
                knockback: 85 * orcKbMult,
                pierce: 999,
                life: evo ? 0.42 : 0.32,
                maxLife: evo ? 0.42 : 0.32,
                hitIds: new Set(),
                rotation: angle,
                color: evo ? '#F43F5E' : '#E2E8F0',
                trailColors: evoPal?.colors,
                particleShapes: evoPal?.shapes,
              });
            }
          } else if (w.id === 'spear') {
            const baseCd = evo ? 0.58 : Math.max(0.82, 1.4 - lv * 0.11);
            w.cooldownTimer = baseCd * stats.cooldownMult;
            const count = evo ? 4 : lv >= 5 ? 3 : lv >= 3 ? 2 : 1;
            const dmg = (evo ? 44 : 18 + lv * 6.5) * stats.damageMult;
            const nearest = findNearestEnemy(520);
            const aim = nearest
              ? Math.atan2(nearest.y - py, nearest.x - px)
              : Math.atan2(sim.player.facingY, sim.player.facingX);
            sound.playWeaponThrow();
            for (let i = 0; i < count; i++) {
              const spread = (i - (count - 1) / 2) * 0.16;
              const angle = aim + spread;
              const spd = 620 * stats.projSpeedMult;
              sim.projectiles.push({
                weaponId: 'spear',
                evolved: evo,
                x: px,
                y: py,
                vx: Math.cos(angle) * spd,
                vy: Math.sin(angle) * spd,
                radius: (evo ? 14 : 11) * stats.areaMult,
                damage: dmg,
                knockback: 95 * orcKbMult,
                pierce: evo ? 999 : 4 + lv * 2,
                life: 0.95,
                maxLife: 0.95,
                hitIds: new Set(),
                rotation: angle,
                explosive: evo,
                color: evo ? '#F59E0B' : '#FCD34D',
                trailColors: evoPal?.colors,
                particleShapes: evoPal?.shapes,
              });
            }
          } else if (w.id === 'frostnova') {
            if (!race.canUseMagic) continue;
            const baseCd = evo ? 1.35 : Math.max(1.65, 2.5 - lv * 0.17);
            w.cooldownTimer = baseCd * stats.cooldownMult;
            const pulseR = (evo ? 160 : 100 + lv * 11) * stats.areaMult;
            const dmg = (evo ? 40 : 14 + lv * 5) * stats.damageMult;
            const shardCount = evo ? 8 : lv >= 5 ? 6 : lv >= 3 ? 4 : 0;
            sound.playMagicCast();

            sim.groundFx.push({
              kind: 'shockwave',
              x: px,
              y: py,
              radius: 14,
              maxRadius: pulseR,
              life: 0.35,
              maxLife: 0.35,
              color: evo ? '#22D3EE' : '#67E8F9',
            });
            spawnVfx(sim.vfx, 'ice_nova', px, py, { scale: pulseR / 48 });
            if (evoPal) {
              spawnPaletteBurst(sim, px, py, evoPal, 16, 180, {
                radius: 3.4,
                life: 0.55,
              });
            }

            for (const e of sim.enemies) {
              if (e.hp <= 0) continue;
              if (Math.hypot(e.x - px, e.y - py) <= pulseR + e.radius) {
                e.freezeTimer = evo ? 2.8 : 1.7 + lv * 0.2;
                damageEnemy(sim, e, dmg, 'frostnova', 40, e.x - px, e.y - py, stats.greedMult);
              }
            }
            hitWorldTargetsInCircle(sim, px, py, pulseR, dmg, stats);

            for (let s = 0; s < shardCount; s++) {
              const angle = (s * Math.PI * 2) / shardCount + sim.elapsedSeconds;
              const spd = 360 * stats.projSpeedMult;
              sim.projectiles.push({
                weaponId: 'frostnova',
                evolved: evo,
                x: px,
                y: py,
                vx: Math.cos(angle) * spd,
                vy: Math.sin(angle) * spd,
                radius: 10 * stats.areaMult,
                damage: dmg * 0.7,
                knockback: 25,
                pierce: evo ? 3 : 2,
                life: 0.85,
                maxLife: 0.85,
                hitIds: new Set(),
                rotation: angle,
                color: evo ? '#22D3EE' : '#67E8F9',
                trailColors: evoPal?.colors,
                particleShapes: evoPal?.shapes,
              });
            }
          } else if (w.id === 'meteor') {
            if (!race.canUseMagic) continue;
            const baseCd = evo ? 1.35 : Math.max(1.7, 2.7 - lv * 0.2);
            w.cooldownTimer = baseCd * stats.cooldownMult;
            const count = evo ? 4 : lv >= 5 ? 3 : lv >= 3 ? 2 : 1;
            const blastR = (evo ? 98 : 65 + lv * 6) * stats.areaMult;
            const dmg = (evo ? 78 : 30 + lv * 10.5) * stats.damageMult;
            const onScreen = sim.enemies.filter(
              (e) =>
                e.hp > 0 &&
                Math.abs(e.x - px) < window.innerWidth * 0.45 &&
                Math.abs(e.y - py) < window.innerHeight * 0.45
            );
            if (onScreen.length > 0) {
              sound.playEnemyKill(false);
              sim.shakeTime = Math.max(sim.shakeTime, 0.14);
              sim.shakeIntensity = Math.max(sim.shakeIntensity, 4);
              for (let m = 0; m < count; m++) {
                const target = onScreen[Math.floor(Math.random() * onScreen.length)];
                sim.groundFx.push({
                  kind: 'explosion',
                  x: target.x,
                  y: target.y,
                  radius: 14,
                  maxRadius: blastR,
                  life: 0.38,
                  maxLife: 0.38,
                  color: evo ? '#EF4444' : '#F97316',
                });
                spawnPackVfx(sim.packVfx, evo ? 'meteor_evo' : 'meteor', target.x, target.y, {
                  scale: Math.max(1.5, (blastR * 2.0) / 72),
                  zOffset: 14,
                });
                spawnVfx(sim.vfx, 'explosion_fire', target.x, target.y, { scale: blastR / 40 });
                if (evoPal) {
                  spawnPaletteBurst(sim, target.x, target.y, evoPal, 14, 175, {
                    radius: 3.6,
                    life: 0.55,
                  });
                } else {
                  spawnParticles(sim, target.x, target.y, '#FB923C', 10, 140);
                }
                for (const e of sim.enemies) {
                  if (e.hp <= 0) continue;
                  if (Math.hypot(e.x - target.x, e.y - target.y) <= blastR + e.radius) {
                    damageEnemy(sim, e, dmg, 'meteor', 85, e.x - target.x, e.y - target.y, stats.greedMult);
                  }
                }
                hitWorldTargetsInCircle(sim, target.x, target.y, blastR, dmg, stats);
              }
            }
          } else if (w.id === 'totem') {
            const baseCd = evo ? 2.4 : Math.max(2.6, 3.8 - lv * 0.25);
            w.cooldownTimer = baseCd * stats.cooldownMult;
            const maxTotems = evo ? 4 : lv >= 5 ? 3 : lv >= 3 ? 2 : 1;
            const armorBonus = 1 + stats.armor * 0.08;
            const dmg = (evo ? 42 : 15 + lv * 6) * stats.damageMult * armorBonus;
            const radius = (evo ? 135 : 88 + lv * 9) * stats.areaMult;
            if (sim.totems.length >= maxTotems) sim.totems.shift();
            const tx = px + (Math.random() - 0.5) * 44;
            const ty = py + (Math.random() - 0.5) * 44;
            sim.totems.push({
              x: tx,
              y: ty,
              life: evo ? 10 : 8,
              maxLife: evo ? 10 : 8,
              pulseTimer: 0.2,
              evolved: evo,
              damage: dmg,
              radius,
            });
            if (evoPal) {
              spawnPaletteBurst(sim, tx, ty, evoPal, 10, 120, { radius: 3.1, life: 0.5 });
            }
          } else if (w.id === 'laser') {
            if (!race.canUseMagic) continue;
            const baseCd = evo ? 0.95 : Math.max(1.25, 2.0 - lv * 0.14);
            w.cooldownTimer = baseCd * stats.cooldownMult;
            const beams = evo ? 4 : lv >= 5 ? 3 : lv >= 3 ? 2 : 1;
            const beamHalfW = (evo ? 21 : 12 + lv * 1.8) * stats.areaMult;
            const dmg = (evo ? 52 : 18 + lv * 6.5) * stats.damageMult;
            const nearest = findNearestEnemy(640);
            const baseAng = evo
              ? sim.elapsedSeconds * 1.4
              : nearest
                ? Math.atan2(nearest.y - py, nearest.x - px)
                : Math.atan2(sim.player.facingY, sim.player.facingX);
            const beamLen = 720;
            sound.playLightning();
            if (evoPal) {
              spawnPaletteBurst(sim, px, py, evoPal, 14, 185, { radius: 3.4, life: 0.45 });
            }

            for (let b = 0; b < beams; b++) {
              const ang = baseAng + (b * Math.PI * 2) / beams;
              const bx2 = px + Math.cos(ang) * beamLen;
              const by2 = py + Math.sin(ang) * beamLen;
              const beamColors = ['#EC4899', '#22D3EE', '#A855F7', '#FACC15'];
              const col = evo ? beamColors[b % beamColors.length] : '#EC4899';

              sim.groundFx.push({
                kind: 'beam',
                x: px,
                y: py,
                x2: bx2,
                y2: by2,
                radius: beamHalfW * 2,
                maxRadius: beamHalfW * 2,
                life: 0.22,
                maxLife: 0.22,
                color: col,
                vfxKey: evo ? 'laser_tile_evo' : 'laser_tile',
              });

              const dxB = bx2 - px;
              const dyB = by2 - py;
              const len2 = dxB * dxB + dyB * dyB;
              for (const e of sim.enemies) {
                if (e.hp <= 0) continue;
                const tProj = Math.max(0, Math.min(1, ((e.x - px) * dxB + (e.y - py) * dyB) / len2));
                const cx = px + tProj * dxB;
                const cy = py + tProj * dyB;
                if (Math.hypot(e.x - cx, e.y - cy) <= beamHalfW + e.radius) {
                  damageEnemy(sim, e, dmg, 'laser', 40, dxB, dyB, stats.greedMult);
                }
              }
              hitWorldTargetsOnSegment(sim, px, py, bx2, by2, beamHalfW, dmg, stats);
            }
          } else if (w.id === 'cat') {
            const baseCd = evo ? 0.85 : Math.max(1.1, 1.75 - lv * 0.12);
            w.cooldownTimer = baseCd * stats.cooldownMult;
            const count = evo ? 4 : lv >= 4 ? 3 : lv >= 2 ? 2 : 1;
            const dmg = (evo ? 40 : 15 + lv * 5.2) * stats.damageMult;
            const nearest = findNearestEnemy(520);
            const baseAng = nearest
              ? Math.atan2(nearest.y - py, nearest.x - px)
              : Math.atan2(sim.player.facingY, sim.player.facingX);
            sound.playWeaponThrow();

            for (let i = 0; i < count; i++) {
              const ang = baseAng + (i - (count - 1) / 2) * 0.45 + (Math.random() - 0.5) * 0.2;
              const spd = (evo ? 410 : 310 + lv * 16) * stats.projSpeedMult;
              sim.projectiles.push({
                weaponId: 'cat',
                evolved: evo,
                x: px,
                y: py,
                vx: Math.cos(ang) * spd,
                vy: Math.sin(ang) * spd,
                radius: (evo ? 17 : 12 + lv * 0.5) * stats.areaMult,
                damage: dmg,
                knockback: 70 * orcKbMult,
                pierce: evo ? 5 : 2 + Math.floor(lv / 2),
                life: evo ? 1.85 : 1.45,
                maxLife: evo ? 1.85 : 1.45,
                hitIds: new Set(),
                rotation: 0,
                homing: true,
                explosive: evo,
                color: evo ? '#F59E0B' : '#FB923C',
                trailColors: evoPal?.colors,
                particleShapes: evoPal?.shapes,
              });
            }
          } else if (w.id === 'bird') {
            const baseCd = evo ? 0.65 : Math.max(0.95, 1.55 - lv * 0.11);
            w.cooldownTimer = baseCd * stats.cooldownMult;
            const count = evo ? 4 : lv >= 5 ? 3 : lv >= 3 ? 2 : 1;
            const dmg = (evo ? 32 : 12 + lv * 4) * stats.damageMult;
            sound.playWeaponThrow();

            for (let i = 0; i < count; i++) {
              const ang = (i * Math.PI * 2) / count + sim.elapsedSeconds * 1.1;
              const spd = (evo ? 470 : 375 + lv * 14) * stats.projSpeedMult;
              sim.projectiles.push({
                weaponId: 'bird',
                evolved: evo,
                x: px,
                y: py,
                vx: Math.cos(ang) * spd,
                vy: Math.sin(ang) * spd,
                radius: (evo ? 13 : 10) * stats.areaMult,
                damage: dmg,
                knockback: 38 * orcKbMult,
                pierce: evo ? 4 : lv >= 4 ? 2 : 1,
                life: evo ? 1.65 : 1.25,
                maxLife: evo ? 1.65 : 1.25,
                hitIds: new Set(),
                rotation: ang,
                homing: true,
                color: evo ? '#FACC15' : '#38BDF8',
                trailColors: evoPal?.colors,
                particleShapes: evoPal?.shapes,
              });
            }
          } else if (w.id === 'watergun') {
            const baseCd = evo ? 0.45 : Math.max(0.65, 1.15 - lv * 0.09);
            w.cooldownTimer = baseCd * stats.cooldownMult;
            const count = evo ? 4 : lv >= 5 ? 3 : lv >= 3 ? 2 : 1;
            const armorBonus = 1 + stats.armor * 0.08;
            const dmg = (evo ? 26 : 10 + lv * 3.5) * stats.damageMult * armorBonus;
            const nearest = findNearestEnemy(480);
            const aim = nearest
              ? Math.atan2(nearest.y - py, nearest.x - px)
              : Math.atan2(sim.player.facingY, sim.player.facingX);
            sound.playWeaponThrow();

            for (let i = 0; i < count; i++) {
              const spread = (i - (count - 1) / 2) * 0.14;
              const ang = aim + spread;
              const spd = (evo ? 480 : 400) * stats.projSpeedMult;
              sim.projectiles.push({
                weaponId: 'watergun',
                evolved: evo,
                x: px,
                y: py,
                vx: Math.cos(ang) * spd,
                vy: Math.sin(ang) * spd,
                radius: (evo ? 13 : 9.5 + lv * 0.7) * stats.areaMult,
                damage: dmg,
                knockback: (evo ? 120 : 85) * orcKbMult,
                pierce: evo ? 4 : lv >= 3 ? 3 : 2,
                life: 0.9,
                maxLife: 0.9,
                hitIds: new Set(),
                rotation: ang,
                soakSlow: true,
                color: evo ? '#38BDF8' : '#0EA5E9',
                trailColors: evoPal?.colors,
                particleShapes: evoPal?.shapes,
              });
            }
          }
        }
      };

      const updateSimulation = (frameDt: number) => {
        const sim = simRef.current;
        if (!sim || sim.runEnded) return;

        if (sim.hitstopTimer > 0) {
          sim.hitstopTimer -= frameDt;
          if (sim.knightFullScreenFlashTimer > 0) {
            sim.knightFullScreenFlashTimer = Math.max(0, sim.knightFullScreenFlashTimer - frameDt);
          }
          if (sim.knightBulwarkCrackTimer > 0) {
            sim.knightBulwarkCrackTimer = Math.max(0, sim.knightBulwarkCrackTimer - frameDt);
          }
          if (sim.knightParryOverlayTimer > 0) {
            sim.knightParryOverlayTimer = Math.max(0, sim.knightParryOverlayTimer - frameDt);
            for (const inst of sim.packVfx) {
              if (inst.key === 'knight_parry') {
                inst.elapsed += frameDt;
                inst.life -= frameDt;
              }
            }
            for (const ft of sim.floatingTexts) {
              if (ft.bounceOutline) {
                ft.life -= frameDt;
                ft.y += ft.vy * frameDt;
              }
            }
            if (sim.knightParryOverlayTimer <= 0) {
              const statsNow = computeStats(sim);
              const parryReflectDmg = (85 + Math.min(sim.player.level, 40) * 4) * statsNow.damageMult;
              for (const b of sim.knightParryBulletSnap) {
                const spd = Math.hypot(b.vx, b.vy) || 260;
                const revAng = Math.atan2(-b.vy, -b.vx);
                sim.projectiles.push({
                  weaponId: 'spear',
                  evolved: true,
                  fromClassSkill: true,
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
                  color: '#ffd75e',
                });
              }
              sim.knightParryBulletSnap = [];
              for (const en of sim.enemies) {
                if (en.hp <= 0) continue;
                if (sim.knightParryTargetIds.has(en.id) || Math.hypot(en.x - sim.player.x, en.y - sim.player.y) <= 160 + en.radius) {
                  en.windupTimer = 0;
                  en.parriedStunTimer = 1.5;
                  en.freezeTimer = Math.max(en.freezeTimer || 0, 1.5);
                  en.hardFreezeTimer = Math.max(en.hardFreezeTimer || 0, en.isBoss ? 0.55 : 1.5);
                }
              }
              sim.knightParryTargetIds.clear();
              triggerWeaponHitShake(sim, 0.12, 5.2);
              sound.playParry();
            }
          }
          if (sim.knightParryCounterDelayTimer > 0) {
            sim.knightParryCounterDelayTimer = Math.max(0, sim.knightParryCounterDelayTimer - frameDt);
          }
          return;
        }

        // Trigger Lv.20 Class Evolution modal for Human & Demonkin once per run
        if (sim.player.level >= 20 && !sim.classPrompted && RACES[raceId].canEvolveClass) {
          sim.classPrompted = true;
          sound.playLevelUp();
          presentClassEvolution(sim);
          if (botModeRef.current !== 'full') return;
        }

        // Trigger Seven Sins Contract modal every 5 levels (Lv.25, 30, 35, ...)
        if (sim.raceClass === 'seven_sins' && sim.player.level >= sim.nextSinContractLevel) {
          sim.nextSinContractLevel += 5;
          const sinChoices = generateSinChoices(sim, 2);
          if (sinChoices.length > 0) {
            sound.playLevelUp();
            presentSinContract(sim, sinChoices);
            if (botModeRef.current !== 'full') return;
          }
        }

        // Ultimate Cut-in & Hitstop Slow-Mo (20% time speed for 0.35s)
        if (sim.ultCutinTimer > 0) sim.ultCutinTimer = Math.max(0, sim.ultCutinTimer - frameDt);
        if (sim.ultZoomTimer > 0) sim.ultZoomTimer = Math.max(0, sim.ultZoomTimer - frameDt);
        const inUltSlow = sim.ultSlowTimer > 0;
        if (inUltSlow) sim.ultSlowTimer = Math.max(0, sim.ultSlowTimer - frameDt);
        const dt = inUltSlow ? frameDt * 0.2 : frameDt;

        if ((sim.woundedTimer || 0) > 0) sim.woundedTimer = Math.max(0, (sim.woundedTimer || 0) - dt);
        if (sim.knightParryFlash > 0) sim.knightParryFlash = Math.max(0, sim.knightParryFlash - dt);
        if (sim.parryWindowTimer > 0) sim.parryWindowTimer = Math.max(0, sim.parryWindowTimer - dt);
        if (sim.knightFullScreenFlashTimer > 0) sim.knightFullScreenFlashTimer = Math.max(0, sim.knightFullScreenFlashTimer - frameDt);
        if (sim.knightBulwarkCrackTimer > 0) sim.knightBulwarkCrackTimer = Math.max(0, sim.knightBulwarkCrackTimer - frameDt);
        if (sim.knightAscendFxTimer > 0) sim.knightAscendFxTimer = Math.max(0, sim.knightAscendFxTimer - dt);
        if (sim.knightHitSparkTimer > 0) sim.knightHitSparkTimer = Math.max(0, sim.knightHitSparkTimer - dt);
        if (Math.abs(sim.knightHitKnockbackX) > 0.05) {
          sim.knightHitKnockbackX *= Math.exp(-dt * 28);
        } else {
          sim.knightHitKnockbackX = 0;
        }
        if (sim.vampireLastRiteCd > 0) sim.vampireLastRiteCd = Math.max(0, sim.vampireLastRiteCd - dt);
        if (sim.saintHealExplosionCd > 0) sim.saintHealExplosionCd = Math.max(0, sim.saintHealExplosionCd - dt);

        if (sim.reviveCooldown > 0) {
          sim.reviveCooldown = Math.max(0, sim.reviveCooldown - dt);
        }
        if (sim.snareTimer > 0) {
          sim.snareTimer = Math.max(0, sim.snareTimer - dt);
        }
        if (sim.sandSlowTimer > 0) {
          sim.sandSlowTimer = Math.max(0, sim.sandSlowTimer - dt);
        }
        if (sim.iceSlowTimer > 0) {
          sim.iceSlowTimer = Math.max(0, sim.iceSlowTimer - dt);
        }
        if (sim.weatherLightningFlash > 0) {
          sim.weatherLightningFlash = Math.max(0, sim.weatherLightningFlash - dt);
        }
        if (sim.damageFlash > 0) {
          sim.damageFlash = Math.max(0, sim.damageFlash - dt);
          if (sim.damageFlash === 0) sim.damageFlashAlpha = 0;
        }
        if (sim.abilityFlash > 0) {
          sim.abilityFlash = Math.max(0, sim.abilityFlash - dt);
          if (sim.abilityFlash === 0) sim.abilityFlashAlpha = 0;
        }
        if (sim.weatherTextCooldown > 0) {
          sim.weatherTextCooldown = Math.max(0, sim.weatherTextCooldown - dt);
        }
        if (sim.artifactHealTextCooldown > 0) {
          sim.artifactHealTextCooldown = Math.max(0, sim.artifactHealTextCooldown - dt);
        }
        if (sim.ironRamCooldown > 0) {
          sim.ironRamCooldown = Math.max(0, sim.ironRamCooldown - dt);
        }
        if (sim.castAnimTimer > 0) {
          sim.castAnimTimer = Math.max(0, sim.castAnimTimer - dt);
        }
        if (sim.castAnimCooldown > 0) {
          sim.castAnimCooldown = Math.max(0, sim.castAnimCooldown - dt);
        }
        if (sim.healSparkleTimer > 0) {
          sim.healSparkleTimer = Math.max(0, sim.healSparkleTimer - dt);
        }
        if (sim.rewindLockTimer > 0) {
          sim.rewindLockTimer = Math.max(0, sim.rewindLockTimer - dt);
        }
        if (sim.rewindVisualTimer > 0) {
          sim.rewindVisualTimer = Math.max(0, sim.rewindVisualTimer - dt);
        }
        for (let mi = sim.chronoHudMotes.length - 1; mi >= 0; mi--) {
          const m = sim.chronoHudMotes[mi];
          m.life -= frameDt;
          if (m.life <= 0) {
            sim.chronoHudMotes.splice(mi, 1);
          } else {
            const lerp = Math.min(1, frameDt * 9);
            m.x += (m.targetX - m.x) * lerp;
            m.y += (m.targetY - m.y) * lerp;
          }
        }
        updateVfx(sim.vfx, dt);
        updatePackVfx(sim.packVfx, dt);

        // Clock progression (Paused while inside a Secret Dimension Room!)
        const clockDt = runPaceRef.current === 'blitz' ? dt * 3 : dt;
        if (!sim.inSecretRoom) {
          sim.elapsedSeconds += clockDt;
          // Reaper's Curse (all classes): after minute 30, every 1 min permanently reduces Max HP by 1% of base (floor 10%)
          if (sim.elapsedSeconds > 1800) {
            const nextStacks = Math.floor((sim.elapsedSeconds - 1800) / 60);
            if (nextStacks > sim.reaperCurseStacks) {
              sim.reaperCurseStacks = nextStacks;
              addFloatingText(
                sim,
                sim.player.x,
                sim.player.y - 42,
                `คำสาปยมทูต ชั้น ${sim.reaperCurseStacks} (-${Math.min(90, sim.reaperCurseStacks)}% Max HP)`,
                '#F43F5E',
                1.15
              );
            }
          }
          // Vampire Lord Ult freezes day/night clock at Night
          if (!(sim.raceClass === 'vampire_lord' && sim.ultActiveTimer > 0)) {
            sim.dayNightElapsed += clockDt;
          }
        }
        const realmSeconds = Math.max(0, sim.elapsedSeconds - sim.realmStartSeconds);
        const currentMinute = Math.floor(realmSeconds / 60);

        // Cooldowns for M1-M8 Map Systems & Refresh Nearby Spatial Queries
        for (const key of Object.keys(sim.propHitCooldowns)) {
          sim.propHitCooldowns[key] -= dt;
          if (sim.propHitCooldowns[key] <= 0) delete sim.propHitCooldowns[key];
        }
        for (const key of Object.keys(sim.graveHandCooldowns)) {
          sim.graveHandCooldowns[key] -= dt;
          if (sim.graveHandCooldowns[key] <= 0) delete sim.graveHandCooldowns[key];
        }
        if (sim.graveSlowTimer > 0) sim.graveSlowTimer = Math.max(0, sim.graveSlowTimer - dt);
        if (sim.speedPotionTimer > 0) sim.speedPotionTimer = Math.max(0, sim.speedPotionTimer - dt);
        if (sim.playerWetTimer > 0) sim.playerWetTimer = Math.max(0, sim.playerWetTimer - dt);
        if (sim.merchantCooldown > 0) sim.merchantCooldown = Math.max(0, sim.merchantCooldown - dt);
        if (sim.bloodShrineCooldown > 0) sim.bloodShrineCooldown = Math.max(0, sim.bloodShrineCooldown - dt);
        if (sim.statueEffect) {
          sim.statueEffect.remaining -= dt;
          if (sim.statueEffect.remaining <= 0) sim.statueEffect = null;
        }
        if (sim.mapEventBannerTimer > 0) {
          sim.mapEventBannerTimer -= dt;
          if (sim.mapEventBannerTimer <= 0) {
            sim.mapEventBannerTimer = 0;
            sim.activeMapEventBanner = null;
          }
        }

        const biome = getActiveBiome(stageId, sim.realmTier, sim.biomeShiftCount);
        const waveDef = getWaveForMinute(currentMinute, sim.realmTier, biome.nameTh);
        const px = sim.player.x;
        const py = sim.player.y;

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
                  sim.lastDamageFromReaper = false;
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

        const inSanctuaryZone = sim.sanctuaryZones.some(
          (sz) => Math.hypot(px - sz.x, py - sz.y) <= sz.radius
        );
        if (
          (sim.inFlowerMeadow || inSanctuaryZone) &&
          sim.player.hp < sim.player.maxHp &&
          sim.healSparkleTimer <= 0
        ) {
          sim.healSparkleTimer = 1.0;
          spawnSheetVfx(sim, 'sanctum_burst', px, py, { size: 122, life: 0.65, zOffset: 10 });
        }

        const stats = computeStats(sim);

        // BALANCE debug log: กด F12 → Console เพื่อดูตัวเลขทุกนาที แล้วเอาไปจูนค่าใน BALANCE (data.ts)
        if (sim.balanceLastLoggedMinute === undefined) sim.balanceLastLoggedMinute = currentMinute;
        if (currentMinute !== sim.balanceLastLoggedMinute) {
          if (BALANCE.logBalanceEveryMinute) {
            const scaleMinute = currentMinute + sim.realmTier * BALANCE.realmMinuteCarry;
            const hpScale =
              (1 + scaleMinute * 0.42 + Math.pow(scaleMinute, 1.38) * 0.095) *
              Math.pow(BALANCE.enemyHpGrowthPerMin, Math.max(0, scaleMinute - BALANCE.growthStartMinute)) *
              biome.hpMult;
            const realSecPerMin = runPaceRef.current === 'blitz' ? 20 : 60;
            console.log(
              `[BALANCE] realm ${sim.realmTier} นาที ${currentMinute} | Lv ${sim.player.level}` +
                ` | DPS ผู้เล่น ≈ ${Math.round((sim.balanceDmgAccum || 0) / realSecPerMin)}` +
                ` | damageMult x${stats.damageMult.toFixed(2)} | cooldown x${stats.cooldownMult.toFixed(2)}` +
                ` | HP มอน x${hpScale.toFixed(1)} (สไลม์ ≈ ${Math.round(18 * hpScale)})` +
                ` | HP ผู้เล่น ${Math.round(sim.player.hp)}/${sim.player.maxHp}`
            );
          }
          sim.balanceDmgAccum = 0;
          sim.balanceLastLoggedMinute = currentMinute;
        }

        // Artifact Periodic HP Regeneration (e.g. ชุดเทวทูตแห่งแสง: 0.5% Max HP every 2s)
        if (stats.regenPctPer2Sec > 0) {
          sim.artifactRegenTimer -= dt;
          if (sim.artifactRegenTimer <= 0) {
            sim.artifactRegenTimer = 2.0;
            if (sim.player.hp < sim.player.maxHp) {
              sim.artifactRegenBuffer += sim.player.maxHp * stats.regenPctPer2Sec;
              if (sim.artifactRegenBuffer >= 1) {
                const whole = Math.floor(sim.artifactRegenBuffer);
                sim.artifactRegenBuffer -= whole;
                const healed = applyPlayerHeal(sim, whole);
                if (healed > 0) {
                  addFloatingText(sim, px, py - 28, `+${healed}`, '#FDE047', 0.9);
                }
              }
            }
          }
        }

        // Main Map Systems (Weather, Global Map Events, Traps, Landmarks, Portals, Volcano Eruption)
        if (!sim.inSecretRoom) {
          // Dynamic Weather System (shifts every 5 in-game minutes)
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

          // Global Map Events System (M7 + Original Events)
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
                    sim.lastDamageFromReaper = false;
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
                  const ringGold = sim.elapsedSeconds > 1800 ? 50 : 100;
                  sim.goldEarned += ringGold;
                  sim.goldBreakdown.quests += ringGold;
                  spawnDrop(sim, { kind: 'chest', x: px, y: py - 32, value: 1, magnetized: false });
                  addFloatingText(sim, px, py - 38, `รอดวงเวทย์! +${ringGold} ทอง & หีบ!`, '#FACC15', 1.25);
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

          // M8 Volcano Biome Periodic Eruption (every 2 minutes -> 10s of falling magma rocks)
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
              spawnVfx(sim.vfx, 'explosion_fire', mt.x, mt.y, { scale: mt.radius / 40 });
              spawnParticles(sim, mt.x, mt.y, '#FB923C', 14, 170);
              const mobDmg = (58 + sim.player.level * 5) * stats.damageMult;
              for (const en of sim.enemies) {
                if (en.hp > 0 && Math.hypot(en.x - mt.x, en.y - mt.y) <= mt.radius + en.radius) {
                  damageEnemy(sim, en, mobDmg, null, 95, en.x - mt.x, en.y - mt.y, stats.greedMult);
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
                  sim.lastDamageFromReaper = false;
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
                    sim.lastDamageFromReaper = false;
                    sim.lastDamageSourceTh = 'รอยแยกแมกมา';
                    triggerDamageFlash(sim, taken);
                    addFloatingText(sim, px, py - 22, `-${taken}`, '#F97316', 1.0);
                  }
                }
              }
              if (es.activeTimer <= 0) sim.earthSplits.splice(ei, 1);
            }
          }

          // M3 Trap Runtime Updates (Lightning Pillar 5s shocks + Ritual Fire Lines 4s burn)
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
                        spawnSheetVfx(sim, 'holy_smite', en.x, en.y, { size: 128, life: 0.38 });
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
                  damageEnemy(sim, en, fireDmg, null, 20, en.x - cx, en.y - cy, stats.greedMult);
                }
              }
            }
          }

          // M5 Landmarks Spawner (1 every 5 minutes) & Proximity Logic
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
                  presentMapInteraction(sim, {
                    kind: 'cursed_statue',
                    landmarkId: lm.id,
                  });
                  if (botModeRef.current !== 'full') return;
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
                  if (botModeRef.current !== 'full') return;
                }
              } else if (lm.kind === 'merchant' && sim.merchantCooldown <= 0) {
                sim.merchantCooldown = 1.5;
                presentMapInteraction(sim, {
                  kind: 'merchant',
                  landmarkId: lm.id,
                  gold: sim.goldEarned,
                  hasUpgradeableWeapon: sim.weapons.some((w) => w.level < 6),
                  usesElements: Boolean(RACES[raceId].usesElements),
                });
                if (botModeRef.current !== 'full') return;
              } else if (lm.kind === 'blood_shrine' && sim.bloodShrineCooldown <= 0) {
                sim.bloodShrineCooldown = 1.5;
                presentMapInteraction(sim, {
                  kind: 'blood_shrine',
                  landmarkId: lm.id,
                  hpCost: Math.max(1, Math.round(sim.player.hp * 0.3)),
                  currentHp: Math.round(sim.player.hp),
                  usesElements: Boolean(RACES[raceId].usesElements),
                });
                if (botModeRef.current !== 'full') return;
              }
            } else {
              lm.active = false;
              if (lm.kind === 'abandoned_tower' || lm.kind === 'cursed_statue') {
                lm.progress = Math.max(0, lm.progress - dt * 0.5);
              }
            }
          }

          // M6 Secret Dimension Portal Spawner (every 4-6 min, 600-900px away, lasts 30s)
          if (sim.secretPortal) {
            sim.secretPortal.remaining -= dt;
            if (Math.hypot(px - sim.secretPortal.x, py - sim.secretPortal.y) <= 44) {
              enterSecretRoom(sim);
              return;
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
              spawnSheetVfx(sim, 'holy_sigil', pos.x, pos.y, {
                size: 175,
                life: 30,
                loopFps: 24,
                upright: false,
              });
              sound.playBossWarning();
              sim.announcement = 'ประตูมิติลับเปิดออกแล้ว! เดินเข้าภายใน 30 วินาที!';
              sim.announcementTimer = 4.5;
              addFloatingText(sim, px, py - 42, 'ประตูมิติลับเปิดออก!', '#E879F9', 1.25);
            }
          }
        } else {
          // Inside Secret Dimension Room (max 60s, paused world clock)
          sim.secretRoomTimer -= dt;
          if (sim.secretRoomTimer <= 0) {
            exitSecretRoom(sim);
            return;
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
                return;
              }
            }
          } else if (sim.secretRoomKind === 'secret_shop' && !sim.secretRoomShopOpened) {
            sim.secretRoomShopOpened = true;
            presentMapInteraction(sim, {
              kind: 'secret_shop',
              gold: sim.goldEarned,
              offers: sim.secretRoomShopOffers,
            });
            if (botModeRef.current !== 'full') return;
          } else if (sim.secretRoomKind === 'god_blessing' && !sim.secretRoomShopOpened) {
            sim.secretRoomShopOpened = true;
            presentMapInteraction(sim, {
              kind: 'god_blessing',
            });
            if (botModeRef.current !== 'full') return;
          }

          if (sim.secretRoomCleared && Math.hypot(px, py + 340) <= 46) {
            exitSecretRoom(sim);
            return;
          }
        }

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
                const driftA = Math.atan2(py - (py + Math.sin(a) * d), px - (px + Math.cos(a) * d)) + (Math.random() - 0.5) * 0.9;
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
                // Gentle swirling sand push
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
                  applyKnightHitVisual(sim, hz.x);
                  addFloatingText(sim, px, py - 16, `-${sandDmg}`, '#F59E0B', 0.9);
                }
              }
            }
            if (hz.life <= 0) {
              sim.weatherHazards.splice(i, 1);
            }
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
              spawnSheetVfx(sim, 'holy_smite', hz.x, hz.y, {
                size: Math.max(140, hz.radius * 2.0),
                life: 0.42,
              });
              spawnParticles(sim, hz.x, hz.y, '#7DD3FC', 12, 160);
              const shockDmg = (55 + sim.player.level * 4) * stats.damageMult;
              for (const en of sim.enemies) {
                if (en.hp <= 0) continue;
                if (Math.hypot(en.x - hz.x, en.y - hz.y) <= hz.radius + en.radius) {
                  damageEnemy(sim, en, shockDmg, null, 70, en.x - hz.x, en.y - hz.y, stats.greedMult);
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
                  applyKnightHitVisual(sim, hz.x);
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
            if (hz.life <= 0) {
              sim.weatherHazards.splice(i, 1);
            }
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
                  applyKnightHitVisual(sim, hz.x);
                  addFloatingText(sim, px, py - 20, `กรดกัด! -${acidDmg}`, '#A3E635', 0.95);
                }
              }
            }
            if (hz.life <= 0) {
              sim.weatherHazards.splice(i, 1);
            }
          }
        }

        // Potions, Altar Cooldowns, Hourglass Freeze, Twin Shadow Bombs & Companion Pet Tick
        if (sim.goldDoubleTimer > 0) sim.goldDoubleTimer = Math.max(0, sim.goldDoubleTimer - dt);
        if (sim.xpDoubleTimer > 0) sim.xpDoubleTimer = Math.max(0, sim.xpDoubleTimer - dt);
        if (sim.altarHitShieldCd > 0) sim.altarHitShieldCd = Math.max(0, sim.altarHitShieldCd - dt);
        sim.noDamageTimer += dt;

        // Hourglass Amulet: Freeze all non-boss enemies every 45s
        if (sim.cachedHourglassFreeze) {
          sim.hourglassFreezeTimer -= dt;
          if (sim.hourglassFreezeTimer <= 0) {
            sim.hourglassFreezeTimer = 45;
            sim.groundFx.push({
              kind: 'shockwave',
              x: px,
              y: py,
              radius: 20,
              maxRadius: 340,
              life: 0.45,
              maxLife: 0.45,
              color: '#38BDF8',
            });
            for (const en of sim.enemies) {
              if (en.hp > 0 && !en.isBoss) {
                en.hardFreezeTimer = Math.max(en.hardFreezeTimer || 0, 2.6);
                en.freezeTimer = Math.max(en.freezeTimer || 0, 3.0);
              }
            }
            addFloatingText(sim, px, py - 34, 'นาฬิกาทรายหยุดเวลา!', '#38BDF8', 1.1);
          }
        }

        // Twin Shadow Ring Detonation
        for (let si = sim.shadowBombs.length - 1; si >= 0; si--) {
          const sb = sim.shadowBombs[si];
          sb.timer -= dt;
          if (sb.timer <= 0) {
            sim.shadowBombs.splice(si, 1);
            const bombR = 115 * stats.areaMult;
            sim.groundFx.push({
              kind: 'explosion',
              x: sb.x,
              y: sb.y,
              radius: 12,
              maxRadius: bombR,
              life: 0.28,
              maxLife: 0.28,
              color: '#8B5CF6',
            });
            spawnParticles(sim, sb.x, sb.y, '#A78BFA', 12, 160);
            for (const en of sim.enemies) {
              if (en.hp > 0 && Math.hypot(en.x - sb.x, en.y - sb.y) <= bombR + en.radius) {
                damageEnemy(sim, en, sb.damage, null, 120, en.x - sb.x, en.y - sb.y, stats.greedMult);
              }
            }
          }
        }

        // Companion Pet Update (Hatchery Lv1/2/3 bonus +25%/+50% speed)
        const activePetId = saveRef.current.equippedPet;
        if (activePetId) {
          const hatchLv = saveRef.current.buildings.hatchery || 1;
          const petEfficiency = hatchLv >= 3 ? 1.5 : hatchLv === 2 ? 1.25 : 1.0;
          const orbitAng = sim.elapsedSeconds * 1.45;
          const targetPetX = px + Math.cos(orbitAng) * 44;
          const targetPetY = py + Math.sin(orbitAng) * 32 - 12;
          sim.petX += (targetPetX - sim.petX) * Math.min(1, dt * 6);
          sim.petY += (targetPetY - sim.petY) * Math.min(1, dt * 6);

          if (sim.petShieldCooldown > 0) sim.petShieldCooldown = Math.max(0, sim.petShieldCooldown - dt);
          if (activePetId === 'bat_pet') {
            sim.petActionTimer -= dt * petEfficiency;
            if (sim.petActionTimer <= 0) {
              sim.petActionTimer = 0.55;
              const petMagnetR = stats.magnetRadius * 1.55;
              for (const dr of sim.drops) {
                if (
                  (dr.kind === 'xp' || dr.kind === 'xp_large' || dr.kind === 'gold' || dr.kind === 'gold_pouch') &&
                  Math.hypot(dr.x - px, dr.y - py) <= petMagnetR
                ) {
                  dr.magnetized = true;
                }
              }
            }
          } else if (activePetId === 'fire_hound') {
            sim.petActionTimer -= dt * petEfficiency;
            if (sim.petActionTimer <= 0) {
              sim.petActionTimer = 2.6;
              let nearEn: EnemyEntity | null = null;
              let nearD = 360;
              for (const en of sim.enemies) {
                if (en.hp <= 0) continue;
                const d = Math.hypot(en.x - sim.petX, en.y - sim.petY);
                if (d < nearD) {
                  nearD = d;
                  nearEn = en;
                }
              }
              if (nearEn) {
                const a = Math.atan2(nearEn.y - sim.petY, nearEn.x - sim.petX);
                sim.projectiles.push({
                  weaponId: 'fireorb',
                  evolved: false,
                  fromClassSkill: true,
                  x: sim.petX,
                  y: sim.petY,
                  vx: Math.cos(a) * 380,
                  vy: Math.sin(a) * 380,
                  radius: 10,
                  damage: (26 + sim.player.level * 1.8) * stats.damageMult,
                  knockback: 60,
                  pierce: 1,
                  life: 1.2,
                  maxLife: 1.2,
                  hitIds: new Set(),
                  rotation: a,
                  color: '#F97316',
                });
              }
            }
          } else if (activePetId === 'mini_ghost') {
            if (sim.petShieldCooldown <= 0) {
              for (let bi = sim.enemyBullets.length - 1; bi >= 0; bi--) {
                const bl = sim.enemyBullets[bi];
                if (Math.hypot(bl.x - px, bl.y - py) <= 58) {
                  sim.enemyBullets.splice(bi, 1);
                  sim.petShieldCooldown = 20 / petEfficiency;
                  spawnParticles(sim, bl.x, bl.y, '#93C5FD', 10, 110);
                  addFloatingText(sim, px, py - 30, 'ผีน้อยกันกระสุน!', '#93C5FD', 0.95);
                  break;
                }
              }
            }
          }
        }

        // In-Run Dynamic Quests Evaluation
        for (const iq of sim.inRunQuests) {
          if (iq.completed) continue;
          let prog = iq.progress;
          if (iq.id === 'irq_nodmg_45') prog = Math.floor(sim.noDamageTimer);
          else if (iq.id === 'irq_kills_120' || iq.id === 'irq_kills_350') prog = sim.kills;
          else if (iq.id === 'irq_combo_150') prog = Math.max(prog, sim.combo || 0);
          else if (iq.id === 'irq_elites_2') prog = sim.elitesKilled;
          else if (iq.id === 'irq_boss_1') prog = sim.bossesKilled;
          else if (iq.id === 'irq_lv12') prog = sim.player.level;
          iq.progress = Math.min(iq.target, prog);
          if (iq.progress >= iq.target) {
            iq.completed = true;
            sim.goldEarned += iq.rewardGold;
            sim.goldBreakdown.quests += iq.rewardGold;
            sound.playBossChest();
            addFloatingText(
              sim,
              px,
              py - 44,
              `ภารกิจสำเร็จ! +${iq.rewardGold} ทอง`,
              '#34D399',
              1.18
            );
          }
        }

        // Announcement single-line queue & concise duration (max 2.6s per message, never floods)
        if (sim.announcement && sim.announcement !== sim.lastAnnouncementObserved) {
          if (sim.lastAnnouncementObserved && sim.announcementTimer > 0.6) {
            if (sim.announcementQueue.length < 3 && !sim.announcementQueue.includes(sim.announcement)) {
              sim.announcementQueue.push(sim.announcement);
            }
            sim.announcement = sim.lastAnnouncementObserved;
          } else {
            sim.announcementTimer = Math.min(sim.announcementTimer || 2.6, 2.6);
            sim.lastAnnouncementObserved = sim.announcement;
          }
        }
        if (sim.announcementTimer > 0) {
          sim.announcementTimer -= dt;
          if (sim.announcementTimer <= 0) {
            const nextMsg = sim.announcementQueue.shift() || null;
            sim.announcement = nextMsg;
            sim.lastAnnouncementObserved = nextMsg;
            sim.announcementTimer = nextMsg ? 2.4 : 0;
          }
        }
        if (sim.reaperArrivedBannerTimer > 0) {
          sim.reaperArrivedBannerTimer = Math.max(0, sim.reaperArrivedBannerTimer - dt);
        }

        // Minute Wave Transition Announcement
        if (currentMinute > sim.lastMinuteAnnounced) {
          sim.lastMinuteAnnounced = currentMinute;
          if (!sim.announcement || sim.announcementTimer <= 0.4) {
            sim.announcement = waveDef.titleTh;
            sim.lastAnnouncementObserved = waveDef.titleTh;
            sim.announcementTimer = 2.5;
          }
        }

        // Scheduled Boss Spawns (Paused in Secret Room; Fixed minutes within current Realm)
        const earlyReaper = (saveRef.current.activeCurses.early_reaper || 0) > 0;
        const reaperTargetMinute = earlyReaper ? 25 : 30;
        const reaperAlreadySpawnedInRealm =
          sim.spawnedBossMinutes.has(reaperTargetMinute) ||
          sim.enemies.some((en) => en.isReaper && en.hp > 0);
        const reaperSecondsLeft = reaperTargetMinute * 60 - realmSeconds;
        if (
          !sim.inSecretRoom &&
          !reaperAlreadySpawnedInRealm &&
          reaperSecondsLeft > 0 &&
          reaperSecondsLeft <= 15 &&
          sim.reaperApproachingAnnouncedRealm !== sim.realmTier
        ) {
          sim.reaperApproachingAnnouncedRealm = sim.realmTier;
          sound.playBossWarning();
        }

        if (!sim.inSecretRoom) {
          for (const sb of SCHEDULED_BOSSES) {
            if (earlyReaper && sb.minute === 30 && sim.spawnedBossMinutes.has(25)) {
              sim.spawnedBossMinutes.add(30);
              continue;
            }
            const spawnKind = earlyReaper && sb.minute === 25 ? 'reaper' : sb.kind;
            if (currentMinute >= sb.minute && !sim.spawnedBossMinutes.has(sb.minute)) {
              sim.spawnedBossMinutes.add(sb.minute);
              const baseAngle = Math.random() * Math.PI * 2;
              if (spawnKind === 'boss_cerberus') {
                let firstBuffs: string[] = [];
                for (let c = 0; c < 3; c++) {
                  const ang = baseAngle + (c * Math.PI * 2) / 3;
                  const bx = px + Math.cos(ang) * 380;
                  const by = py + Math.sin(ang) * 380;
                  const sis = createEnemy(
                    sim,
                    'boss_cerberus',
                    bx,
                    by,
                    currentMinute,
                    biome.hpMult,
                    biome.speedMult
                  );
                  sis.nameTh = `เซอร์เบอรัส แฝด ${c + 1}/3`;
                  pushOutOfObstacles(sim, sis, sis.radius);
                  sim.enemies.push(sis);
                  if (c === 0) firstBuffs = sis.buffs.map((b) => BOSS_BUFFS[b].nameTh);
                }
                sound.playBossWarning();
                const buffText = firstBuffs.length > 0 ? ` [บัพ: ${firstBuffs.join(' · ')}]` : '';
                sim.announcement = `มินิบอสแฝดสาม: เซอร์เบอรัส ปรากฏตัวทั้ง 3 ร่าง!${buffText}`;
                sim.announcementTimer = 5.5;
              } else {
                const bx = px + Math.cos(baseAngle) * 440;
                const by = py + Math.sin(baseAngle) * 440;
                const boss = createEnemy(
                  sim,
                  spawnKind,
                  bx,
                  by,
                  currentMinute,
                  biome.hpMult,
                  biome.speedMult
                );
                if (spawnKind === 'reaper') {
                  boss.reaperSweepCooldown = 5.0;
                  sim.reaperArrivedBannerTimer = 4.5;
                  sim.shakeTime = Math.max(sim.shakeTime, 0.35);
                  sim.shakeIntensity = Math.max(sim.shakeIntensity, 8.5);
                  spawnVfx(sim.vfx, 'magic_circle_crimson', boss.x, boss.y, {
                    scale: 2.6,
                    lifetime: 2.2,
                    squashY: ISO_TILT,
                  });
                  sim.groundFx.push({
                    kind: 'warp',
                    x: boss.x,
                    y: boss.y,
                    radius: 18,
                    maxRadius: 210,
                    life: 0.6,
                    maxLife: 0.6,
                    color: '#F43F5E',
                  });
                  sim.groundFx.push({
                    kind: 'shockwave',
                    x: boss.x,
                    y: boss.y,
                    radius: 22,
                    maxRadius: 180,
                    life: 0.5,
                    maxLife: 0.5,
                    color: '#E11D48',
                  });
                }
                pushOutOfObstacles(sim, boss, boss.radius);
                sim.enemies.push(boss);
                sound.playBossWarning();
                const buffText =
                  boss.buffs.length > 0
                    ? ` [บัพ: ${boss.buffs.map((b) => BOSS_BUFFS[b].nameTh).join(' · ')}]`
                    : '';
                sim.announcement = `${boss.nameTh || sb.nameTh} ปรากฏตัว!${buffText}`;
                sim.announcementTimer = 5.5;
              }
            }
          }
        }

        // Player Movement Input (Manual overrides AutoPilot)
        let moveX = 0;
        let moveY = 0;
        const keys = keysRef.current;
        if (keys.has('w') || keys.has('arrowup')) moveY -= 1;
        if (keys.has('s') || keys.has('arrowdown')) moveY += 1;
        if (keys.has('a') || keys.has('arrowleft')) moveX -= 1;
        if (keys.has('d') || keys.has('arrowright')) moveX += 1;

        if (moveX === 0 && moveY === 0 && pointerDragRef.current.active) {
          const dx = pointerDragRef.current.currX - pointerDragRef.current.startX;
          const dy = pointerDragRef.current.currY - pointerDragRef.current.startY;
          const len = Math.hypot(dx, dy);
          if (len > 8) {
            moveX = dx / len;
            moveY = dy / len;
          }
        }

        // Optional Idle AI / Full Bot movement when no manual input is held
        if (moveX === 0 && moveY === 0 && botModeRef.current !== 'off') {
          const isFullBot = botModeRef.current === 'full';
          const isMeleeBot =
            isFullBot &&
            (raceId === 'orc' ||
              sim.raceClass === 'knight' ||
              sim.raceClass === 'saint' ||
              isSpellbladeClass(sim.raceClass) ||
              sim.raceClass === 'vampire_lord' ||
              sim.raceClass === 'demon_lord');
          const hpSafe = sim.player.hp > sim.player.maxHp * 0.45;
          const enemyRepelR = isMeleeBot && hpSafe ? 130 : isFullBot ? 220 : 240;

          let steerX = 0;
          let steerY = 0;

          // Keep inside Shrinking Ring event zone
          if (isFullBot && sim.shrinkingRing) {
            const rdx = sim.shrinkingRing.cx - px;
            const rdy = sim.shrinkingRing.cy - py;
            const rDist = Math.hypot(rdx, rdy);
            if (rDist > sim.shrinkingRing.radius * 0.78 && rDist > 1) {
              steerX += (rdx / rDist) * 4.5;
              steerY += (rdy / rDist) * 4.5;
            }
          }

          // Secret Room exit once cleared
          if (isFullBot && sim.inSecretRoom && sim.secretRoomCleared) {
            const edx = 0 - px;
            const edy = -340 - py;
            const eDist = Math.hypot(edx, edy);
            if (eDist > 1) {
              steerX += (edx / eDist) * 2.2;
              steerY += (edy / eDist) * 2.2;
            }
          } else if (isFullBot && !sim.inSecretRoom && sim.secretPortal) {
            const pdx = sim.secretPortal.x - px;
            const pdy = sim.secretPortal.y - py;
            const pDist = Math.hypot(pdx, pdy);
            if (pDist > 1) {
              steerX += (pdx / pDist) * 1.85;
              steerY += (pdy / pDist) * 1.85;
            }
          }

          // Repel from nearby enemies & bullets
          let nearestEnemy: EnemyEntity | null = null;
          let nearestEnemyDist = Infinity;
          for (const e of sim.enemies) {
            if (e.hp <= 0) continue;
            const dx = px - e.x;
            const dy = py - e.y;
            const d2 = dx * dx + dy * dy;
            const d = Math.sqrt(d2);
            if (d < nearestEnemyDist) {
              nearestEnemyDist = d;
              nearestEnemy = e;
            }
            if (d < enemyRepelR && d > 1) {
              const weight = ((enemyRepelR - d) / enemyRepelR) * (e.isBoss ? 3.2 : 1.55);
              steerX += (dx / d) * weight;
              steerY += (dy / d) * weight;
            }
          }
          for (const b of sim.enemyBullets) {
            const dx = px - b.x;
            const dy = py - b.y;
            const d2 = dx * dx + dy * dy;
            if (d2 < 175 * 175 && d2 > 1) {
              const d = Math.sqrt(d2);
              const weight = ((175 - d) / 175) * 3.1;
              steerX += (dx / d) * weight;
              steerY += (dy / d) * weight;
            }
          }
          for (const hz of sim.weatherHazards) {
            if (hz.kind === 'ice_patch') continue;
            const dx = px - hz.x;
            const dy = py - hz.y;
            const avoidR = hz.radius + 75;
            const d = Math.hypot(dx, dy);
            if (d < avoidR && d > 1) {
              const weight = ((avoidR - d) / avoidR) * 3.2;
              steerX += (dx / d) * weight;
              steerY += (dy / d) * weight;
            }
          }

          // Attract toward high-value drops & resources
          let bestDrop: DropEntity | null = null;
          let bestScore = Infinity;
          for (const d of sim.drops) {
            if ((d.kind === 'element_orb' || d.kind === 'mana_gem') && !RACES[raceId].usesElements) {
              continue;
            }
            if (d.kind === 'element_orb' && sim.fusionCooldown > 0 && sim.heldElements.length >= 2) {
              continue;
            }
            const dist = Math.hypot(d.x - px, d.y - py);
            const maxSeek = isFullBot ? 850 : 520;
            const priority =
              d.kind === 'chest' || d.kind === 'artifact_chest' || d.kind === 'sealed_chest'
                ? dist * 0.14
                : d.kind === 'element_orb'
                  ? dist * 0.22
                  : d.kind === 'mana_gem' && sim.mana < sim.maxMana * 0.75
                    ? dist * 0.28
                    : d.kind === 'meat' && sim.player.hp < sim.player.maxHp * 0.7
                      ? dist * 0.3
                      : isFullBot && (d.kind === 'magnet' || d.kind === 'bomb' || d.kind === 'gold_pouch' || d.kind === 'speed_potion')
                        ? dist * 0.36
                        : dist;
            if (priority < bestScore && dist < maxSeek) {
              bestScore = priority;
              bestDrop = d;
            }
          }
          if (bestDrop) {
            const dx = bestDrop.x - px;
            const dy = bestDrop.y - py;
            const d = Math.hypot(dx, dy) || 1;
            steerX += (dx / d) * (isFullBot ? 1.15 : 0.85);
            steerY += (dy / d) * (isFullBot ? 1.15 : 0.85);
          } else if (isFullBot && !sim.inSecretRoom) {
            // Look for nearby beneficial landmarks if no urgent drops
            let guidedByLandmark = false;
            for (const lm of sim.landmarks) {
              if (lm.used) continue;
              if (lm.kind === 'stone_circle' || lm.kind === 'sealed_chest' || lm.kind === 'cursed_statue' || lm.kind === 'abandoned_tower') {
                const ldx = lm.x - px;
                const ldy = lm.y - py;
                const ldist = Math.hypot(ldx, ldy);
                if (ldist > 12 && ldist < 380) {
                  steerX += (ldx / ldist) * 0.75;
                  steerY += (ldy / ldist) * 0.75;
                  guidedByLandmark = true;
                  break;
                }
              }
            }
            // Otherwise drift toward enemies so combat never stalls
            if (!guidedByLandmark && nearestEnemy && nearestEnemyDist > (isMeleeBot ? 190 : 340)) {
              const edx = nearestEnemy.x - px;
              const edy = nearestEnemy.y - py;
              const ed = nearestEnemyDist || 1;
              steerX += (edx / ed) * 0.7;
              steerY += (edy / ed) * 0.7;
            }
          }

          // Spellblade Full Bot: stand still briefly when safely charging 360° sword storm
          const spellbladeHoldCharge =
            isFullBot &&
            isSpellbladeClass(sim.raceClass) &&
            sim.spellbladeChargeCooldown <= 0 &&
            sim.spellbladeCharge > 0.12 &&
            sim.spellbladeCharge < 1 &&
            hpSafe &&
            nearestEnemyDist > 68 &&
            !sim.enemyBullets.some((b) => Math.hypot(b.x - px, b.y - py) < 95);

          if (!spellbladeHoldCharge) {
            const slen = Math.hypot(steerX, steerY);
            if (slen > 0.05) {
              moveX = steerX / slen;
              moveY = steerY / slen;
            }
          }
        }

        // Cooldowns & Active Skill Activation (Human Dash / Mage Void Infusion / Vampire Bat Swarm / Orc War Cry + Berserk)
        if (sim.dashCooldown > 0) sim.dashCooldown = Math.max(0, sim.dashCooldown - dt);
        if (sim.hunterCritGaugeCd > 0) sim.hunterCritGaugeCd = Math.max(0, sim.hunterCritGaugeCd - dt);
        if (sim.hunterShadowKnifeCd > 0) sim.hunterShadowKnifeCd = Math.max(0, sim.hunterShadowKnifeCd - dt);
        if (sim.hunterRefundCd > 0) sim.hunterRefundCd = Math.max(0, sim.hunterRefundCd - dt);
        if (sim.raceClass === 'hunter') {
          const maxCharges = sim.ultAscended ? 4 : 3;
          sim.hunterDashMaxCharges = maxCharges;
          if (sim.hunterDashCharges < maxCharges) {
            const rechargeNeed = HUNTER_RECHARGE_SEC * stats.dashCooldownFactor;
            const rechargeRate = sim.ultActiveTimer > 0 ? 2 : 1;
            sim.hunterDashRechargeTimer += dt * rechargeRate;
            if (sim.hunterDashRechargeTimer >= rechargeNeed) {
              sim.hunterDashRechargeTimer -= rechargeNeed;
              sim.hunterDashCharges = Math.min(maxCharges, sim.hunterDashCharges + 1);
            }
          } else {
            sim.hunterDashRechargeTimer = 0;
          }
        }
        if (sim.batSwarmCooldown > 0) sim.batSwarmCooldown = Math.max(0, sim.batSwarmCooldown - dt);
        if (sim.warCryCooldown > 0) sim.warCryCooldown = Math.max(0, sim.warCryCooldown - dt);
        if (sim.orcBerserkCooldown > 0) sim.orcBerserkCooldown = Math.max(0, sim.orcBerserkCooldown - dt);
        if (sim.orcRageHitCooldown > 0) sim.orcRageHitCooldown = Math.max(0, sim.orcRageHitCooldown - dt);
        if (sim.activeSkillHintCooldown > 0) {
          sim.activeSkillHintCooldown = Math.max(0, sim.activeSkillHintCooldown - dt);
        }

        // Vampire Bat Swarm ongoing form (1.5s untouchable + phase + AoE bat bites + Vampire Lord Crimson Feast)
        if (sim.batSwarmTimer > 0) {
          sim.batSwarmTimer = Math.max(0, sim.batSwarmTimer - dt);
          sim.batSwarmTickTimer -= dt;
          if (Math.random() < 0.55) {
            spawnParticles(sim, sim.player.x, sim.player.y - 10, '#E11D48', 1, 75);
          }
          if (sim.batSwarmTickTimer <= 0) {
            sim.batSwarmTickTimer = 0.22;
            const swarmR = 86 * stats.areaMult;
            const biteDmg = (24 + Math.min(sim.player.level, 40) * 2.4) * stats.damageMult;
            let bitAny = false;
            let feastStacks = 0;
            for (const en of sim.enemies) {
              if (en.hp <= 0) continue;
              const bdx = en.x - sim.player.x;
              const bdy = en.y - sim.player.y;
              if (Math.hypot(bdx, bdy) <= swarmR + en.radius) {
                bitAny = true;
                if (sim.raceClass === 'vampire_lord' && (en.bleedStacks || 0) > 0) {
                  const stacks = en.bleedStacks || 0;
                  feastStacks += stacks;
                  en.bleedStacks = 0;
                  en.bleedTimer = 0;
                  const burstDmg = stacks * (20 + Math.min(sim.player.level, 40)) * stats.damageMult;
                  sim.groundFx.push({
                    kind: 'explosion',
                    x: en.x,
                    y: en.y,
                    radius: 8,
                    maxRadius: 48,
                    life: 0.22,
                    maxLife: 0.22,
                    color: '#E11D48',
                  });
                  spawnVfx(sim.vfx, 'blood_burst', en.x, en.y, { scale: 1.1 });
                  damageEnemy(sim, en, burstDmg, null, 110, bdx, bdy, stats.greedMult, false, false, true);
                } else {
                  damageEnemy(sim, en, biteDmg, null, 110, bdx, bdy, stats.greedMult);
                }
              }
            }
            if (sim.raceClass === 'vampire_lord') {
              if (feastStacks > 0) {
                const healed = applyLeechHeal(sim, feastStacks * sim.player.maxHp * 0.008);
                if (healed > 0) {
                  addFloatingText(sim, sim.player.x, sim.player.y - 26, `งานเลี้ยงโลหิต +${healed}`, '#FB7185', 1.0);
                }
              }
            } else if (bitAny && sim.player.hp < sim.player.maxHp) {
              applyLeechHeal(sim, 2);
            }
          }
        }

        // Orc Berserk ongoing window (5s guaranteed crits, bypassing 60% crit chance cap; crit damage stays <= 2.5x)
        if (sim.orcBerserkTimer > 0) {
          sim.orcBerserkTimer = Math.max(0, sim.orcBerserkTimer - dt);
          if (Math.random() < 0.45) {
            spawnParticles(sim, sim.player.x, sim.player.y, '#F97316', 1, 90);
          }
        } else if (
          raceId === 'orc' &&
          sim.orcRage >= ORC_RAGE_MAX &&
          sim.orcBerserkCooldown <= 0
        ) {
          sim.orcRage = 0;
          sim.orcBerserkTimer = ORC_BERSERK_DURATION;
          sim.orcBerserkCooldown = ORC_BERSERK_COOLDOWN;
          sim.groundFx.push({
            kind: 'shockwave',
            x: sim.player.x,
            y: sim.player.y,
            radius: 14,
            maxRadius: 155,
            life: 0.4,
            maxLife: 0.4,
            color: '#EF4444',
          });
          triggerWeaponHitShake(sim, 0.16, 4.8);
          triggerAbilityFlash(sim, 0.24, 0.24);
          spawnParticles(sim, sim.player.x, sim.player.y, '#FB923C', 22, 195);
          addFloatingText(
            sim,
            sim.player.x,
            sim.player.y - 34,
            'คลั่ง BERSERK! คริ 100% (5 วิ)',
            '#FB923C',
            1.22
          );
          sound.playBossChest();
        }

        // Helper: Knight Paladin Sword Crescent Slash (+ 3rd thrust lightning beam & Excalibur wave)
        const triggerSacredBladesVisualStrike = (allBlades = false, isHeavy = false) => {
          if (sim.knightSacredBlades.length === 0) return;
          const candidates: Array<{ enemy: EnemyEntity; d2: number }> = [];
          const rangeSq = (sim.ultActiveTimer > 0 ? 420 : 320) ** 2;
          for (const en of sim.enemies) {
            if (en.hp <= 0) continue;
            const d2 = (en.x - sim.player.x) ** 2 + (en.y - sim.player.y) ** 2;
            if (d2 <= rangeSq) candidates.push({ enemy: en, d2 });
          }
          candidates.sort((a, b) => a.d2 - b.d2);
          const fallbackX = sim.player.x + sim.player.facingX * 125;
          const fallbackY = sim.player.y + sim.player.facingY * 125;
          for (let i = 0; i < sim.knightSacredBlades.length; i++) {
            const b = sim.knightSacredBlades[i];
            if (!allBlades && b.state !== 'orbit') continue;
            const tgt = candidates.length > 0 ? candidates[i % candidates.length].enemy : null;
            b.state = 'windup';
            b.stateTimer = 0.12;
            b.whiteFlash = 0.04;
            b.slashProgress = 0;
            b.targetId = tgt ? tgt.id : null;
            b.targetX = tgt ? tgt.x : fallbackX + Math.cos(b.homeAngleOffset) * 35;
            b.targetY = tgt ? tgt.y : fallbackY + Math.sin(b.homeAngleOffset) * 35;
            b.heavyHit = isHeavy;
            b.trail = [];
          }
        };

        const performKnightSlash = (slashMult = 1.0, isParryCounter = false) => {
          const cappedLv = Math.min(sim.player.level, 40);
          const aim = Math.atan2(sim.player.facingY, sim.player.facingX);
          const swordLenBase = sim.ultAscended ? 170 * 1.4 : 170;
          const reach = swordLenBase * (sim.ultActiveTimer > 0 ? 2.5 : 1.0) * stats.areaMult;
          const arcHalf = (Math.PI * 70) / 180; // 140 degrees total
          const slashDmg =
            (55 + cappedLv * 2.2 + stats.armor * 4) * stats.damageMult * slashMult;

          sim.groundFx.push({
            kind: 'paladin_sword',
            x: sim.player.x,
            y: sim.player.y,
            angle: aim,
            isExcalibur: sim.ultActiveTimer > 0 || isParryCounter,
            radius: reach * 0.5,
            maxRadius: reach,
            life: 0.24,
            maxLife: 0.24,
            color: sim.ultActiveTimer > 0 ? '#ffd75e' : '#3b8fd9',
          });
          if (sim.ultActiveTimer > 0 && 10 - sim.ultActiveTimer >= 1.2) {
            sim.groundFx.push({
              kind: 'knight_crescent_wave',
              x: sim.player.x,
              y: sim.player.y,
              angle: aim,
              radius: 60,
              maxRadius: 600,
              life: 0.3,
              maxLife: 0.3,
              color: '#ffd75e',
            });
          }
          spawnPackVfx(
            sim.packVfx,
            'knight_blade_slash',
            sim.player.x + Math.cos(aim) * reach * 0.45,
            sim.player.y + Math.sin(aim) * reach * 0.45,
            {
              angle: aim,
              scale: isParryCounter || sim.ultActiveTimer > 0 ? 2.4 : 1.9,
            }
          );
          triggerWeaponHitShake(sim, 0.12, sim.ultActiveTimer > 0 ? 4.8 : 2.8);
          sound.playWeaponThrow();

          sim.knightLastHitWasCrit = false;
          let hitSlashCount = 0;
          for (const en of sim.enemies) {
            if (en.hp <= 0) continue;
            const edx = en.x - sim.player.x;
            const edy = en.y - sim.player.y;
            const d = Math.hypot(edx, edy);
            if (d <= reach + en.radius) {
              let diff = Math.atan2(edy, edx) - aim;
              while (diff > Math.PI) diff -= Math.PI * 2;
              while (diff < -Math.PI) diff += Math.PI * 2;
              if (Math.abs(diff) <= arcHalf || d <= 42) {
                const preHp = en.hp;
                if (hitSlashCount < 5) {
                  spawnSheetVfx(sim, 'holy_slash', en.x, en.y, {
                    size: sim.ultActiveTimer > 0 ? 150 : 120,
                    life: 0.28,
                    angle: Math.atan2(edy, edx),
                    zOffset: 10,
                  });
                  hitSlashCount += 1;
                }
                damageEnemy(sim, en, slashDmg, null, 280, edx, edy, stats.greedMult);
                if (preHp > 0 && en.hp <= 0 && sim.ultActiveTimer <= 0) {
                  sim.classGauge = Math.min(100, sim.classGauge + 0.5);
                }
              }
            }
          }
          if (hitSlashCount === 0) {
            spawnSheetVfx(
              sim,
              'holy_slash',
              sim.player.x + Math.cos(aim) * reach * 0.55,
              sim.player.y + Math.sin(aim) * reach * 0.55,
              {
                size: sim.ultActiveTimer > 0 ? 155 : 124,
                life: 0.28,
                angle: aim,
                zOffset: 10,
              }
            );
          }
          hitWorldTargetsInCircle(
            sim,
            sim.player.x + Math.cos(aim) * (reach * 0.45),
            sim.player.y + Math.sin(aim) * (reach * 0.45),
            reach * 0.65,
            slashDmg,
            stats
          );

          triggerSacredBladesVisualStrike(isParryCounter, slashMult > 1.2 || sim.knightLastHitWasCrit);

          // Every 3rd swing OR every swing during Excalibur Descent Ult fires piercing light beam!
          sim.knightSwingCount += 1;
          const fireWave = sim.ultActiveTimer > 0 || sim.knightSwingCount % 3 === 0;
          if (fireWave) {
            const beamLen = sim.ultActiveTimer > 0 ? 600 : 520;
            const bx2 = sim.player.x + Math.cos(aim) * beamLen;
            const by2 = sim.player.y + Math.sin(aim) * beamLen;
            const col = sim.ultActiveTimer > 0 ? '#ffd75e' : '#3b8fd9';
            sim.groundFx.push({
              kind: 'beam',
              x: sim.player.x,
              y: sim.player.y,
              x2: bx2,
              y2: by2,
              radius: sim.ultActiveTimer > 0 ? 22 : 14,
              maxRadius: sim.ultActiveTimer > 0 ? 22 : 14,
              life: 0.22,
              maxLife: 0.22,
              color: col,
              vfxKey: 'knight_blade_slash',
            });
            sound.playLightning();
            const dxB = bx2 - sim.player.x;
            const dyB = by2 - sim.player.y;
            const len2 = dxB * dxB + dyB * dyB || 1;
            const waveDmg = slashDmg * 1.15;
            for (const en of sim.enemies) {
              if (en.hp <= 0) continue;
              const tProj = Math.max(0, Math.min(1, ((en.x - sim.player.x) * dxB + (en.y - sim.player.y) * dyB) / len2));
              const cx = sim.player.x + tProj * dxB;
              const cy = sim.player.y + tProj * dyB;
              if (Math.hypot(en.x - cx, en.y - cy) <= (sim.ultActiveTimer > 0 ? 30 : 20) + en.radius) {
                const preHp = en.hp;
                damageEnemy(sim, en, waveDmg, null, 200, dxB, dyB, stats.greedMult);
                if (preHp > 0 && en.hp <= 0 && sim.ultActiveTimer <= 0) {
                  sim.classGauge = Math.min(100, sim.classGauge + 0.5);
                }
              }
            }
            hitWorldTargetsOnSegment(
              sim,
              sim.player.x,
              sim.player.y,
              bx2,
              by2,
              sim.ultActiveTimer > 0 ? 30 : 20,
              waveDmg,
              stats
            );
          }
        };

        // Helper: Knight Perfect Parry execution (0.00s dark-blue freeze -> 0.10s reflect/stun/clang -> 0.15s blade burst)
        const executeKnightParry = () => {
          if (sim.parryWindowTimer <= 0 || sim.raceClass !== 'knight') return;
          sim.parryWindowTimer = 0;
          sim.knightParryFlash = 0.45;
          sim.hitstopTimer = 0.1;
          sim.knightParryOverlayTimer = 0.1;
          sim.knightParryCounterDelayTimer = 0.15;
          sim.player.invulnTimer = Math.max(sim.player.invulnTimer, 0.45);
          sim.knightParryTargetIds.clear();
          sim.knightParryBulletSnap = [];

          spawnPackVfx(sim.packVfx, 'knight_parry', sim.player.x, sim.player.y, { scale: 2.5 });
          spawnSheetVfx(sim, 'parry', sim.player.x, sim.player.y, {
            size: 195,
            life: 0.45,
            zOffset: 16,
          });
          addFloatingText(sim, sim.player.x, sim.player.y - 36, 'PARRY!', '#ffd75e', 1.45, {
            bounceOutline: true,
            life: 0.65,
            vy: -18,
          });

          // Snapshot & remove enemy bullets within 160px so they freeze in place during 0.00-0.10s then turn gold & fly back
          for (let bi = sim.enemyBullets.length - 1; bi >= 0; bi--) {
            const b = sim.enemyBullets[bi];
            if (Math.hypot(b.x - sim.player.x, b.y - sim.player.y) <= 160) {
              sim.knightParryBulletSnap.push({
                x: b.x,
                y: b.y,
                vx: b.vx,
                vy: b.vy,
                radius: b.radius,
                damage: b.damage,
              });
              sim.enemyBullets.splice(bi, 1);
            }
          }

          // Snapshot enemies within 160px for isolation highlight & 0.10s knockdown
          let miniExTarget: EnemyEntity | null = null;
          let bestMiniD2 = Infinity;
          for (const en of sim.enemies) {
            if (en.hp <= 0) continue;
            const d2 = (en.x - sim.player.x) ** 2 + (en.y - sim.player.y) ** 2;
            if (Math.sqrt(d2) <= 160 + en.radius) {
              sim.knightParryTargetIds.add(en.id);
              en.windupTimer = 0;
              if (d2 < bestMiniD2) {
                bestMiniD2 = d2;
                miniExTarget = en;
              }
            }
          }

          sim.knightParryCount += 1;
          if (sim.ultActiveTimer <= 0) {
            sim.classGauge = Math.min(100, sim.classGauge + 15);
          }

          // Grant +1 temporary Sacred Blade spawning overhead with 1 full spin + chime (cap 8 total)
          if (sim.knightSacredBlades.length < 8) {
            sim.knightSacredBlades.push({
              id: sim.knightNextBladeId++,
              x: sim.player.x,
              y: sim.player.y - 36,
              homeAngleOffset: 0,
              state: 'spawning',
              spawnTimer: 0.45,
              targetId: null,
              targetX: sim.player.x,
              targetY: sim.player.y,
              tempLife: 20.0,
              slashProgress: 0,
              trail: [],
            });
            sound.playBladeDraw();
          } else {
            const temp = sim.knightSacredBlades.find((b) => b.tempLife > 0);
            if (temp) temp.tempLife = 20.0;
          }

          // Ascension unlock at 25 Parries: "ราชันใจสิงห์"
          if (!sim.ultAscended && sim.knightParryCount >= 25) {
            sim.ultAscended = true;
            sim.knightAscendFxTimer = 1.0;
            let permCount = sim.knightSacredBlades.filter((b) => b.tempLife < 0).length;
            while (permCount < 5 && sim.knightSacredBlades.length < 8) {
              sim.knightSacredBlades.push({
                id: sim.knightNextBladeId++,
                x: sim.player.x,
                y: sim.player.y - 34,
                homeAngleOffset: 0,
                state: 'spawning',
                spawnTimer: 0.45,
                targetId: null,
                targetX: sim.player.x,
                targetY: sim.player.y,
                tempLife: -1,
                slashProgress: 0,
                trail: [],
              });
              permCount++;
            }
            addFloatingText(sim, sim.player.x, sim.player.y - 54, 'ราชันใจสิงห์ตื่นแล้ว', '#ffd75e', 1.38, {
              bounceOutline: true,
              life: 1.5,
            });
            sim.announcement = 'ราชันใจสิงห์ตื่นแล้ว — ดาบถาวร 5 เล่ม + Parry ปักดาบสวรรค์!';
            sim.announcementTimer = 5.0;
            sound.playHolyBell();
          }
          if (sim.ultAscended) {
            const exX = miniExTarget ? miniExTarget.x : sim.player.x + sim.player.facingX * 65;
            const exY = miniExTarget ? miniExTarget.y : sim.player.y + sim.player.facingY * 65;
            sim.plantedExcalibur = { x: exX, y: exY, life: 0.5, maxLife: 0.5 };
            const miniExDmg = (110 + Math.min(sim.player.level, 40) * 4.5 + stats.armor * 4) * stats.damageMult;
            sim.groundFx.push({
              kind: 'shockwave',
              x: exX,
              y: exY,
              radius: 18,
              maxRadius: 155,
              life: 0.35,
              maxLife: 0.35,
              color: '#ffd75e',
            });
            spawnSheetVfx(sim, 'holy_smite', exX, exY, { size: 190, life: 0.45 });
            spawnSheetVfx(sim, 'ground_slam', exX, exY, {
              size: 220,
              life: 0.48,
              upright: false,
            });
            for (const en of sim.enemies) {
              if (en.hp > 0 && Math.hypot(en.x - exX, en.y - exY) <= 155 + en.radius) {
                damageEnemy(sim, en, miniExDmg, null, 240, en.x - exX, en.y - exY, stats.greedMult);
              }
            }
          }
        };

        // Shared Ultimate Readiness Check & Trigger (for all 6 redesigned classes)
        const canTriggerClassUlt = (s: SimState): boolean => {
          const maxG = getClassGaugeMax(s.raceClass);
          if (maxG <= 0 || s.ultActiveTimer > 0 || s.classGauge < maxG) return false;
          if (s.raceClass === 'vampire_lord' && s.player.hp >= s.player.maxHp * 0.5) return false;
          return true;
        };

        const triggerClassUltimate = (s: SimState, freeRevive = false) => {
          if (!s.raceClass) return;
          if (!freeRevive && !canTriggerClassUlt(s)) return;
          s.classGauge = 0;
          s.ultCount += 1;
          triggerCastAnim(s, s.player.facingX);
          const cappedLv = Math.min(s.player.level, 40);

          if (s.raceClass === 'hunter') {
            if (!s.ultAscended && s.ultCount >= 3 && s.hunterShadowSlashKills >= 150) {
              s.ultAscended = true;
              s.hunterDashMaxCharges = 4;
              s.announcement = 'จุติ! วิญญาณจันทร์ดับ (Moonless Phantom) — 4 ชาร์จ + เงาถาวร + ท่าไม้ตาย 10 วิ!';
              s.announcementTimer = 5.0;
              sound.playBossChest();
            }
            const dur = s.ultAscended ? 10 : 8;
            s.ultActiveTimer = dur;
            s.ultActiveMax = dur;
            s.hunterDashCharges = s.hunterDashMaxCharges;
            s.hunterDashRechargeTimer = 0;
            s.dashCooldown = 0;
            s.hunterUltDashHistory = [];
            for (const en of s.enemies) {
              if (en.hp > 0 && Math.hypot(en.x - s.player.x, en.y - s.player.y) <= 720) {
                en.huntMarks = 5;
              }
            }
            spawnPackVfx(s.packVfx, 'hunter_ult_moon', s.player.x, s.player.y, { scale: 2.2 });
            spawnSheetVfx(s, 'moon_eclipse', s.player.x, s.player.y, {
              size: 210,
              life: 0.72,
              zOffset: 10,
            });
            triggerUltimateCutin(s, 'ราตรีพันเงา', 'NIGHT OF A THOUSAND SHADOWS', '#38BDF8');
          } else if (s.raceClass === 'saint') {
            if (!s.ultAscended && s.ultCount >= 3) {
              s.ultAscended = true;
              s.announcement = 'จุติ! นักบุญผู้ถือดาบสวรรค์ (Saint of the Last Light) — โกเล็มปีกแสงถาวร!';
              s.announcementTimer = 5.0;
              sound.playBossChest();
            }
            s.ultActiveTimer = 12;
            s.ultActiveMax = 12;
            s.saintShieldHits = 3;
            spawnPackVfx(s.packVfx, 'saint_sigil', s.player.x, s.player.y, {
              groundPlane: true,
              scale: 3.2,
              life: 2.2,
            });
            spawnSheetVfx(s, 'holy_sigil', s.player.x, s.player.y, {
              size: 255,
              life: 1.85,
              upright: false,
            });
            spawnSheetVfx(s, 'sanctum_burst', s.player.x, s.player.y, {
              size: 195,
              life: 0.75,
              zOffset: 14,
            });
            const gMax = Math.round(s.player.maxHp * 2.5);
            if (!s.golem || s.golem.respawnTimer > 0) {
              s.golem = {
                x: s.player.x + 48,
                y: s.player.y - 12,
                walkCycle: 0,
                smashCooldown: 0.2,
                smashingTimer: 0.3,
                hp: gMax,
                maxHp: gMax,
                respawnTimer: 0,
                leapCooldown: 0,
                spearTimer: 0.25,
                lostHpTrack: 0,
              };
            } else {
              s.golem.maxHp = gMax;
              s.golem.hp = gMax;
              s.golem.leapCooldown = 0;
              s.golem.spearTimer = 0.25;
            }
            triggerUltimateCutin(s, 'ปฏิญาณแห่งสวรรค์', 'SERAPH OATH', '#FDE047');
          } else if (s.raceClass === 'knight') {
            s.ultActiveTimer = 10;
            s.ultActiveMax = 10;
            s.knightUltIntroX = s.player.x + s.player.facingX * 72;
            s.knightUltIntroY = s.player.y + s.player.facingY * 72;
            s.knightUltIntroPhase = 0;
            s.knightUltBgPillars = [];
            s.knightUltBgPillarCd = 0.25;
            triggerUltimateCutin(s, 'เอ็กซ์แคลิเบอร์ลงทัณฑ์', 'EXCALIBUR DESCENT', '#ffd75e');
          } else if (s.raceClass === 'demon_lord') {
            s.ultActiveTimer = 10;
            s.ultActiveMax = 10;
            s.groundFx.push({
              kind: 'shockwave',
              x: s.player.x,
              y: s.player.y,
              radius: 30,
              maxRadius: 340,
              life: 0.5,
              maxLife: 0.5,
              color: '#F97316',
            });
            spawnVfx(s.vfx, 'magic_circle_crimson', s.player.x, s.player.y, {
              scale: 2.2,
              lifetime: 2.4,
              squashY: ISO_TILT,
            });
            spawnVfx(s.vfx, 'explosion_hellfire', s.player.x, s.player.y, { scale: 2.1 });
            for (const en of s.enemies) {
              if (en.hp > 0 && Math.hypot(en.x - s.player.x, en.y - s.player.y) <= 680) {
                en.hellfireStacks = 5;
                en.hellfireTimer = 4.0;
                if (en.hellfireTickTimer === undefined) en.hellfireTickTimer = 0.25;
              }
            }
            triggerUltimateCutin(s, 'ประตูนรกเปิด', 'GATE OF INFERNO', '#F97316');
          } else if (s.raceClass === 'vampire_lord') {
            s.ultActiveTimer = 12;
            s.ultActiveMax = 12;
            s.vampireUltPulseTimer = 0.2;
            s.vampireUltSpearTimer = 0.45;
            s.batSwarmTimer = Math.max(s.batSwarmTimer, BAT_SWARM_DURATION);
            s.batSwarmTickTimer = 0.04;
            s.player.invulnTimer = Math.max(s.player.invulnTimer, BAT_SWARM_DURATION + 0.12);
            spawnVfx(s.vfx, 'magic_circle_crimson', s.player.x, s.player.y, {
              scale: 2.0,
              lifetime: 2.6,
              squashY: ISO_TILT,
            });
            triggerUltimateCutin(s, 'ราตรีโลหิตนิรันดร์', 'ETERNAL CRIMSON NIGHT', '#FB7185');
          } else if (s.raceClass === 'seven_sins') {
            s.ultActiveTimer = 12;
            s.ultActiveMax = 12;
            spawnSheetVfx(s, 'holy_sigil', s.player.x, s.player.y, {
              size: 255,
              life: 1.85,
              upright: false,
            });
            for (const sid of SIN_ORDER) {
              const ex = s.sins.find((it) => it.sinId === sid);
              if (ex) {
                if (ex.hp <= 0 || ex.respawnTimer > 0) {
                  ex.hp = ex.maxHp;
                  ex.respawnTimer = 0;
                  ex.x = s.player.x + Math.cos(SIN_ORDER.indexOf(sid)) * 84;
                  ex.y = s.player.y + Math.sin(SIN_ORDER.indexOf(sid)) * 84;
                }
              } else {
                s.sins.push(buildSinEntity(s, sid, 1, false));
              }
            }
            triggerUltimateCutin(s, 'พิธีบาปทั้งเจ็ด', 'RITE OF THE SEVEN SINS', '#C084FC');
          } else if (s.raceClass === 'death_god') {
            s.ultActiveTimer = 1.2;
            s.ultActiveMax = 1.2;
            const uStats = computeStats(s);
            castDominionOfEternalFealty(s, uStats, {
              addGroundFx: (fx) => s.groundFx.push(fx),
              spawnParticles: (x, y, color, count, speed) =>
                spawnParticles(s, x, y, color, count, speed),
              addFloatingText: (x, y, text, color, scale) =>
                addFloatingText(s, x, y, text, color, scale),
            });
            spawnPackVfx(s.packVfx, 'death_scythe_nova', s.player.x, s.player.y, { scale: 2.8 });
            spawnVfx(s.vfx, 'magic_circle_crimson', s.player.x, s.player.y, {
              scale: 2.1,
              lifetime: 2.0,
              squashY: ISO_TILT,
            });
            triggerUltimateCutin(
              s,
              'Dominion of Eternal Fealty',
              'อาณาจักรแห่งความภักดีนิรันดร์',
              '#A855F7'
            );
          }
        };

        // Hunter Shadow Slash along 70px-wide dash corridor (slays ALL enemies hit; bonus vs marked & backstab!)
        const runHunterShadowCutSegment = (
          x1: number,
          y1: number,
          x2: number,
          y2: number,
          cutColor: string,
          recordForUlt = true,
          hitSetOverride?: Set<number>
        ) => {
          const hitSet = hitSetOverride ?? sim.dashCutHitIds;
          const cappedLv = Math.min(sim.player.level, 40);
          const dxS = x2 - x1;
          const dyS = y2 - y1;
          const len2 = dxS * dxS + dyS * dyS;
          let hitCount = 0;
          for (const en of sim.enemies) {
            if (en.hp <= 0 || hitSet.has(en.id)) continue;
            const tProj = len2 > 1 ? Math.max(0, Math.min(1, ((en.x - x1) * dxS + (en.y - y1) * dyS) / len2)) : 0;
            const cx = x1 + tProj * dxS;
            const cy = y1 + tProj * dyS;
            // 70px wide corridor (halfWidth 35 + enemy radius)
            if (Math.hypot(en.x - cx, en.y - cy) <= 35 + en.radius) {
              hitSet.add(en.id);
              hitCount += 1;
              const marks = en.huntMarks || 0;
              const backstab = isBackstabAngle(en.vx, en.vy, en.x, en.y, x1, y1);
              const markMult = 1 + marks * 0.12;
              const backstabMult = backstab ? 1.5 : 1.0;
              const cutDmg = (54 + cappedLv * 3.375) * markMult * backstabMult * stats.damageMult;
              const execThreshold = Math.max(0.14, marks * 0.05);
              const shouldExecute = !en.isBoss && marks >= 3 && en.hp / Math.max(1, en.maxHp) < execThreshold;
              const addShadowSlashGauge = (amt: number) => {
                if (sim.ultActiveTimer > 0) return;
                const room = Math.max(0, 5 - sim.hunterDashGaugeEarned);
                if (room <= 0) return;
                const addG = Math.min(room, amt);
                sim.hunterDashGaugeEarned += addG;
                sim.classGauge = Math.min(100, sim.classGauge + addG);
              };

              if (shouldExecute) {
                damageEnemy(
                  sim,
                  en,
                  Math.max(cutDmg, en.hp + 5),
                  null,
                  60,
                  dxS,
                  dyS,
                  stats.greedMult,
                  false,
                  false,
                  true,
                  false,
                  '#34D399',
                  { forceCrit: true, isShadowSlash: true, isBackstab: backstab }
                );
                addFloatingText(sim, en.x, en.y - 28, 'EXECUTE!', '#34D399', 1.3);
                sim.hitstopTimer = Math.max(sim.hitstopTimer, 0.06);
                addShadowSlashGauge(2.5);
                sound.playExecute();
              } else {
                damageEnemy(
                  sim,
                  en,
                  cutDmg,
                  null,
                  95,
                  dxS,
                  dyS,
                  stats.greedMult,
                  false,
                  false,
                  false,
                  false,
                  backstab ? '#E879F9' : undefined,
                  {
                    forceCrit: backstab || marks >= 5 || sim.ultActiveTimer > 0,
                    bonusCritChance: marks * 0.15,
                    isShadowSlash: true,
                    isBackstab: backstab,
                  }
                );
                if (backstab) {
                  addFloatingText(sim, en.x, en.y - 26, 'BACKSTAB!', '#E879F9', 1.12);
                }
                addShadowSlashGauge(en.isBoss ? 4 : backstab ? 2.8 : 1.8);
              }
            }
          }
          if (hitCount > 0) {
            sound.playSlash(hitCount >= 3);
          }
          if (recordForUlt && sim.ultActiveTimer > 0) {
            const last = sim.hunterUltDashHistory[sim.hunterUltDashHistory.length - 1];
            if (!last || Math.hypot(last.x2 - x2, last.y2 - y2) > 12) {
              sim.hunterUltDashHistory.push({ x1, y1, x2, y2 });
            }
          }
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
            color: cutColor,
          });
          hitWorldTargetsOnSegment(sim, x1, y1, x2, y2, 35, (54 + cappedLv * 3.375) * stats.damageMult, stats);
        };

        const triggerRaceActiveSkill = (dirMoveX: number, dirMoveY: number) => {
          if (RACES[raceId].canDash) {
            const isHunter = sim.raceClass === 'hunter';
            if (isHunter) {
              if (sim.hunterDashCharges <= 0) return;
              if (sim.dashCooldown > 0 || sim.dashTimer > 0) return;
            } else {
              if (sim.dashCooldown > 0 || sim.dashTimer > 0) return;
            }
            const dirX = dirMoveX !== 0 || dirMoveY !== 0 ? dirMoveX : sim.player.facingX;
            const dirY = dirMoveX !== 0 || dirMoveY !== 0 ? dirMoveY : sim.player.facingY;
            const dlen = Math.hypot(dirX, dirY) || 1;
            const ndx = dirX / dlen;
            const ndy = dirY / dlen;
            const dashSpeed = isHunter ? DASH_SPEED * HUNTER_DASH_RANGE_MULT : DASH_SPEED;
            sim.dashStartX = sim.player.x;
            sim.dashStartY = sim.player.y;
            sim.dashCutHitIds.clear();
            sim.dashVx = ndx * dashSpeed;
            sim.dashVy = ndy * dashSpeed;
            sim.dashTimer = DASH_DURATION;
            if (isHunter) {
              sim.hunterDashCharges = Math.max(0, sim.hunterDashCharges - 1);
              sim.hunterDashGaugeEarned = 0;
              sim.dashCooldown = sim.ultActiveTimer > 0 ? 0.35 : 0.12;
            } else {
              sim.dashCooldown = DASH_COOLDOWN * stats.dashCooldownFactor;
            }
            sim.snareTimer = 0;
            const dashInvuln = isHunter
              ? sim.ultActiveTimer > 0
                ? 0.18
                : 0.15
              : DASH_DURATION + 0.08;
            sim.player.invulnTimer = Math.max(sim.player.invulnTimer, dashInvuln);
            sound.playWeaponThrow();
            spawnParticles(sim, sim.player.x, sim.player.y, isHunter ? '#34D399' : '#38BDF8', 10, 130);

            if (sim.cachedShadowRing) {
              sim.shadowBombs.push({
                x: sim.dashStartX,
                y: sim.dashStartY,
                timer: 0.75,
                damage: (42 + sim.player.level * 2.5) * stats.damageMult,
              });
            }

            // Knight: 0.25s Perfect Parry window on dash!
            if (sim.raceClass === 'knight') {
              sim.parryWindowTimer = 0.25;
            }

            // Hunter: Shadow Slash +70% dash VFX + Echoes + Twin Ult Clones
            if (isHunter) {
              const dashLen = dashSpeed * DASH_DURATION;
              const baseAng = Math.atan2(ndy, ndx);
              const endX = sim.dashStartX + ndx * dashLen;
              const endY = sim.dashStartY + ndy * dashLen;
              sound.playSlash(false);

              for (let a = 0; a < 4; a++) {
                const frac = (a + 0.5) / 4;
                spawnPackVfx(
                  sim.packVfx,
                  'hunter_afterimage',
                  sim.dashStartX + Math.cos(baseAng) * dashLen * frac,
                  sim.dashStartY + Math.sin(baseAng) * dashLen * frac,
                  {
                    frameOverride: a,
                    life: 0.34 - a * 0.05,
                    alpha: 0.72,
                    flipX: ndx < 0,
                    scale: 1.85,
                  }
                );
              }
              spawnPackVfx(
                sim.packVfx,
                'hunter_shadow_slash',
                sim.dashStartX + Math.cos(baseAng) * (dashLen * 0.5),
                sim.dashStartY + Math.sin(baseAng) * (dashLen * 0.5),
                {
                  angle: baseAng,
                  scaleX: Math.max(1.8, dashLen / 96),
                  scaleY: 2.0,
                }
              );
              spawnSheetVfx(
                sim,
                'shadow_slash',
                sim.dashStartX + Math.cos(baseAng) * (dashLen * 0.5),
                sim.dashStartY + Math.sin(baseAng) * (dashLen * 0.5),
                { size: 170, life: 0.3, angle: baseAng, zOffset: 10 }
              );
              if (sim.ultActiveTimer > 0) {
                sim.hunterEchoes.push({
                  x1: sim.dashStartX,
                  y1: sim.dashStartY,
                  x2: endX,
                  y2: endY,
                  delayTimer: 0.35,
                  activeTimer: 0.22,
                  triggered: false,
                });
                for (const angOff of [-0.52, 0.52]) {
                  const ca = baseAng + angOff;
                  spawnSheetVfx(
                    sim,
                    'shadow_slash',
                    sim.dashStartX + Math.cos(ca) * (dashLen * 0.5),
                    sim.dashStartY + Math.sin(ca) * (dashLen * 0.5),
                    { size: 155, life: 0.3, angle: ca, zOffset: 10 }
                  );
                  runHunterShadowCutSegment(
                    sim.dashStartX,
                    sim.dashStartY,
                    sim.dashStartX + Math.cos(ca) * dashLen,
                    sim.dashStartY + Math.sin(ca) * dashLen,
                    '#38BDF8',
                    true
                  );
                }
              } else if (sim.ultAscended) {
                const perpX = -ndy * 26;
                const perpY = ndx * 26;
                sim.hunterEchoes.push({
                  x1: sim.dashStartX + perpX,
                  y1: sim.dashStartY + perpY,
                  x2: endX + perpX,
                  y2: endY + perpY,
                  delayTimer: 0.16,
                  activeTimer: 0.22,
                  triggered: false,
                });
              }
            }

            // Saint: Holy Leap pulls Holy Golem onto dash origin to slam + stun + clear bullets!
            if (
              sim.raceClass === 'saint' &&
              sim.golem &&
              sim.golem.respawnTimer <= 0 &&
              (sim.ultActiveTimer > 0 || sim.golem.leapCooldown <= 0)
            ) {
              const gm = sim.golem;
              gm.x = sim.dashStartX;
              gm.y = sim.dashStartY;
              gm.smashingTimer = 0.42;
              gm.leapCooldown = sim.ultActiveTimer > 0 ? 0 : 4.0;
              const leapR = 180 * stats.areaMult;
              const leapDmg = (95 + Math.min(sim.player.level, 40) * 4.5) * stats.damageMult * 1.5;
              sim.groundFx.push({
                kind: 'shockwave',
                x: gm.x,
                y: gm.y,
                radius: 26,
                maxRadius: leapR,
                life: 0.38,
                maxLife: 0.38,
                color: '#FDE047',
              });
              spawnPackVfx(sim.packVfx, 'saint_golem_taunt', gm.x, gm.y, {
                groundPlane: true,
                scale: Math.max(1.8, (leapR * 2.0) / 128),
              });
              spawnSheetVfx(sim, 'ground_slam', gm.x, gm.y, {
                size: Math.max(210, leapR * 1.9),
                life: 0.48,
                upright: false,
              });
              spawnParticles(sim, gm.x, gm.y, '#FEF08A', 22, 195);
              triggerWeaponHitShake(sim, 0.14, 4.2);
              sound.playBossChest();
              let hitCnt = 0;
              for (const en of sim.enemies) {
                if (en.hp <= 0) continue;
                if (Math.hypot(en.x - gm.x, en.y - gm.y) <= leapR + en.radius) {
                  hitCnt += 1;
                  en.hardFreezeTimer = Math.max(en.hardFreezeTimer || 0, en.isBoss ? 0.45 : 1.0);
                  en.freezeTimer = Math.max(en.freezeTimer || 0, 1.0);
                  damageEnemy(sim, en, leapDmg, null, 300, en.x - gm.x, en.y - gm.y, stats.greedMult);
                }
              }
              for (let bi = sim.enemyBullets.length - 1; bi >= 0; bi--) {
                const b = sim.enemyBullets[bi];
                if (Math.hypot(b.x - gm.x, b.y - gm.y) <= leapR) {
                  sim.enemyBullets.splice(bi, 1);
                }
              }
              if (hitCnt >= 5 && sim.ultActiveTimer <= 0) {
                sim.classGauge = Math.min(100, sim.classGauge + 5);
              }
              if (sim.ultActiveTimer > 0) {
                sim.sanctuaryZones.push({
                  x: gm.x,
                  y: gm.y,
                  radius: 145 * stats.areaMult,
                  life: 4.0,
                  maxLife: 4.0,
                  tickTimer: 0.5,
                });
                spawnSheetVfx(sim, 'holy_sigil', gm.x, gm.y, {
                  size: 145 * stats.areaMult * 2.1,
                  life: 4.0,
                  loopFps: 24,
                  upright: false,
                });
              }
            }
          } else if (RACES[raceId].usesElements) {
            if (sim.voidInfusionActive) return;
            if (sim.mana >= VOID_INFUSION_COST) {
              sim.mana -= VOID_INFUSION_COST;
              sim.voidInfusionActive = true;
              let castDirDx = sim.player.facingX;
              let bestCastD2 = 520 * 520;
              for (const en of sim.enemies) {
                if (en.hp <= 0) continue;
                const d2 = (en.x - sim.player.x) ** 2 + (en.y - sim.player.y) ** 2;
                if (d2 < bestCastD2) {
                  bestCastD2 = d2;
                  castDirDx = en.x - sim.player.x;
                }
              }
              triggerCastAnim(sim, castDirDx);
              triggerAbilityFlash(sim, 0.18, 0.18);
              sim.groundFx.push({
                kind: 'shockwave',
                x: sim.player.x,
                y: sim.player.y,
                radius: 12,
                maxRadius: 95,
                life: 0.35,
                maxLife: 0.35,
                color: '#A855F7',
              });
              spawnParticles(sim, sim.player.x, sim.player.y, '#C084FC', 14, 150);
              addFloatingText(
                sim,
                sim.player.x,
                sim.player.y - 32,
                'Void Infusion! (+65% ดาเมจ · CD x2)',
                '#C084FC',
                1.1
              );
              sound.playMagicCast();
            } else if (sim.lowManaTimer <= 0) {
              sim.lowManaTimer = 0.7;
              addFloatingText(
                sim,
                sim.player.x,
                sim.player.y - 28,
                `มานาไม่พอ (${VOID_INFUSION_COST} MP)`,
                '#F43F5E',
                0.95
              );
            }
          } else if (raceId === 'vampire') {
            if (sim.batSwarmTimer > 0 || sim.batSwarmCooldown > 0) return;
            let paidWithHp = false;
            if (sim.bloodGauge < VAMPIRE_BLOOD_MAX) {
              if (sim.raceClass === 'vampire_lord' && sim.player.hp > 1) {
                const hpCost = Math.min(sim.player.hp - 1, Math.max(1, Math.round(sim.player.maxHp * 0.08)));
                sim.player.hp -= hpCost;
                paidWithHp = true;
                addFloatingText(sim, sim.player.x, sim.player.y - 36, `ราคาโลหิต -${hpCost} HP`, '#FDA4AF', 0.95);
              } else {
                if (sim.activeSkillHintCooldown <= 0) {
                  sim.activeSkillHintCooldown = 0.75;
                  addFloatingText(
                    sim,
                    sim.player.x,
                    sim.player.y - 28,
                    `เกจโลหิต ${Math.floor(sim.bloodGauge)}/${VAMPIRE_BLOOD_MAX}`,
                    '#FB7185',
                    0.95
                  );
                }
                return;
              }
            }
            if (!paidWithHp) sim.bloodGauge = 0;
            sim.batSwarmTimer = BAT_SWARM_DURATION;
            const nightBatCd = sim.raceClass === 'vampire_lord' && stats.isNight ? BAT_SWARM_COOLDOWN * 0.6 : BAT_SWARM_COOLDOWN;
            sim.batSwarmCooldown = nightBatCd;
            sim.batSwarmTickTimer = 0.04;
            sim.snareTimer = 0;
            sim.player.invulnTimer = Math.max(sim.player.invulnTimer, BAT_SWARM_DURATION + 0.12);
            triggerAbilityFlash(sim, 0.2, 0.2);
            sim.groundFx.push({
              kind: 'shockwave',
              x: sim.player.x,
              y: sim.player.y,
              radius: 14,
              maxRadius: 115,
              life: 0.36,
              maxLife: 0.36,
              color: '#E11D48',
            });
            spawnVfx(sim.vfx, 'blood_burst', sim.player.x, sim.player.y, { scale: 1.4 });
            spawnParticles(sim, sim.player.x, sim.player.y, '#FB7185', 18, 175);
            addFloatingText(
              sim,
              sim.player.x,
              sim.player.y - 32,
              sim.raceClass === 'vampire_lord' ? 'ฝูงค้างคาว! (พร้อมดื่มแผลเลือด)' : 'ฝูงค้างคาวโลหิต! (อมตะ +40% ไว)',
              '#FB7185',
              1.15
            );
            sound.playMagicCast();
          } else if (raceId === 'orc') {
            if (sim.warCryCooldown > 0) return;
            sim.warCryCooldown = ORC_WAR_CRY_COOLDOWN;
            const cryRadius = 175 * stats.areaMult;
            const cryDmg = (38 + stats.armor * 7 + sim.player.level * 2.8) * stats.damageMult;
            sim.groundFx.push({
              kind: 'shockwave',
              x: sim.player.x,
              y: sim.player.y,
              radius: 18,
              maxRadius: cryRadius,
              life: 0.36,
              maxLife: 0.36,
              color: '#F59E0B',
            });
            triggerWeaponHitShake(sim, 0.14, 4.2);
            triggerAbilityFlash(sim, 0.2, 0.2);
            spawnParticles(sim, sim.player.x, sim.player.y, '#FBBF24', 18, 190);
            for (const en of sim.enemies) {
              if (en.hp <= 0) continue;
              const cdx = en.x - sim.player.x;
              const cdy = en.y - sim.player.y;
              if (Math.hypot(cdx, cdy) <= cryRadius + en.radius) {
                damageEnemy(sim, en, cryDmg, null, 340, cdx, cdy, stats.greedMult);
                if (en.hp > 0 && !en.isBoss) {
                  en.freezeTimer = Math.max(en.freezeTimer || 0, 1.1);
                }
              }
            }
            if (sim.orcBerserkTimer <= 0) {
              sim.orcRage = Math.min(ORC_RAGE_MAX, sim.orcRage + 28);
            }
            addFloatingText(
              sim,
              sim.player.x,
              sim.player.y - 30,
              sim.orcBerserkTimer > 0 ? 'คำรามศึก!' : 'คำรามศึก! (+28 โทสะ)',
              '#FBBF24',
              1.12
            );
            sound.playBossChest();
          }
        };

        activeSkillRef.current = () => triggerRaceActiveSkill(moveX, moveY);

        // Unified Tap vs Hold (>= 0.5s) Space / Mobile Skill control
        if (sim.spaceDown && !sim.spaceTriggeredUlt) {
          if (canTriggerClassUlt(sim)) {
            sim.spaceHoldTime += frameDt;
            if (sim.spaceHoldTime >= 0.5) {
              sim.spaceTriggeredUlt = true;
              sim.spaceDown = false;
              sim.spaceHoldTime = 0;
              triggerClassUltimate(sim);
            }
          } else {
            sim.spaceTriggeredUlt = true;
            triggerRaceActiveSkill(moveX, moveY);
          }
        }
        if (sim.mobileHoldActive && !sim.mobileTriggeredUlt) {
          if (canTriggerClassUlt(sim)) {
            sim.mobileHoldTime += frameDt;
            if (sim.mobileHoldTime >= 0.5) {
              sim.mobileTriggeredUlt = true;
              sim.mobileHoldActive = false;
              sim.mobileHoldTime = 0;
              triggerClassUltimate(sim);
            }
          }
        }

        if (keys.has('shift') || (RACES[raceId].usesElements && keys.has('e'))) {
          triggerRaceActiveSkill(moveX, moveY);
        }

        // Full Bot: Auto-trigger Class Ultimates, Race/Class Active Skills (Space), & Emergency Potions
        if (botModeRef.current === 'full') {
          if (sim.activePotion && !sim.potionUsed) {
            const isDefPotion = sim.activePotion === 'blood_flask' || sim.activePotion === 'holy_water';
            if ((isDefPotion && sim.player.hp < sim.player.maxHp * 0.35) || (!isDefPotion && sim.elapsedSeconds >= 60)) {
              activatePotionInSim(sim);
            }
          }

          if (
            canTriggerClassUlt(sim) &&
            sim.enemies.some((en) => en.hp > 0 && Math.hypot(en.x - px, en.y - py) <= 580)
          ) {
            triggerClassUltimate(sim);
          }

          if (RACES[raceId].canDash) {
            if (sim.dashCooldown <= 0 && sim.dashTimer <= 0) {
              const bulletDanger = sim.enemyBullets.some((b) => Math.hypot(b.x - px, b.y - py) < 95);
              const contactDanger = sim.enemies.some(
                (en) => en.hp > 0 && Math.hypot(en.x - px, en.y - py) < en.radius + 26
              );
              let shouldDash = bulletDanger || contactDanger;

              if (!shouldDash && sim.raceClass === 'knight') {
                let nearKnightCount = 0;
                let windupNear = false;
                for (const en of sim.enemies) {
                  if (en.hp <= 0) continue;
                  const d = Math.hypot(en.x - px, en.y - py);
                  if (d < 115) {
                    nearKnightCount += 1;
                    if (en.windupTimer > 0) windupNear = true;
                  }
                }
                shouldDash = windupNear || nearKnightCount >= 3 || sim.enemyBullets.some((b) => Math.hypot(b.x - px, b.y - py) < 110);
              } else if (!shouldDash && sim.raceClass === 'hunter') {
                shouldDash = sim.enemies.some(
                  (en) =>
                    en.hp > 0 &&
                    ((sim.ultActiveTimer > 0 && Math.hypot(en.x - px, en.y - py) < 260) ||
                      ((en.huntMarks || 0) >= 3 && Math.hypot(en.x - px, en.y - py) < 220))
                );
              } else if (!shouldDash && sim.raceClass === 'saint' && sim.golem && sim.golem.respawnTimer <= 0) {
                if (sim.ultActiveTimer > 0 || sim.golem.leapCooldown <= 0) {
                  let nearCnt = 0;
                  let bossNear = false;
                  for (const en of sim.enemies) {
                    if (en.hp <= 0) continue;
                    if (Math.hypot(en.x - px, en.y - py) < 175) {
                      nearCnt += 1;
                      if (en.isBoss) bossNear = true;
                    }
                  }
                  shouldDash = nearCnt >= 3 || bossNear;
                }
              }

              if (shouldDash) {
                triggerRaceActiveSkill(moveX, moveY);
              }
            }
          } else if (RACES[raceId].usesElements) {
            if (
              !sim.voidInfusionActive &&
              sim.mana >= VOID_INFUSION_COST + 18 &&
              sim.enemies.some((en) => en.hp > 0 && Math.hypot(en.x - px, en.y - py) <= 420)
            ) {
              triggerRaceActiveSkill(moveX, moveY);
            }
          } else if (raceId === 'vampire') {
            if (sim.batSwarmTimer <= 0 && sim.batSwarmCooldown <= 0) {
              if (sim.bloodGauge >= VAMPIRE_BLOOD_MAX) {
                if (
                  sim.player.hp < sim.player.maxHp * 0.7 ||
                  sim.enemies.filter((en) => en.hp > 0 && Math.hypot(en.x - px, en.y - py) < 145).length >= 3
                ) {
                  triggerRaceActiveSkill(moveX, moveY);
                }
              } else if (sim.raceClass === 'vampire_lord' && sim.player.hp > sim.player.maxHp * 0.72) {
                const bleedingNear = sim.enemies.filter(
                  (en) => en.hp > 0 && (en.bleedStacks || 0) > 0 && Math.hypot(en.x - px, en.y - py) < 150
                ).length;
                if (bleedingNear >= 4) {
                  triggerRaceActiveSkill(moveX, moveY);
                }
              }
            }
          } else if (raceId === 'orc') {
            if (sim.warCryCooldown <= 0) {
              const cryR = 175 * stats.areaMult;
              let nearOrcCnt = 0;
              let bossNear = false;
              for (const en of sim.enemies) {
                if (en.hp <= 0) continue;
                if (Math.hypot(en.x - px, en.y - py) <= cryR + en.radius) {
                  nearOrcCnt += 1;
                  if (en.isBoss) bossNear = true;
                }
              }
              if (nearOrcCnt >= 2 || bossNear) {
                triggerRaceActiveSkill(moveX, moveY);
              }
            }
          }
        }

        const snareSlow =
          sim.snareTimer > 0 ? Math.max(0.14, 1 - 0.55 * stats.slowDebuffFactor) : 1;
        const weatherSlowRaw =
          sim.sandSlowTimer > 0 ? 0.48 : sim.iceSlowTimer > 0 ? 0.28 : 0;
        const weatherMoveMult =
          weatherSlowRaw > 0 ? Math.max(0.18, 1 - weatherSlowRaw * stats.slowDebuffFactor) : 1;
        const totalMoveMult = snareSlow * weatherMoveMult;
        if (sim.dashTimer > 0) {
          const prevDx = sim.player.x;
          const prevDy = sim.player.y;
          sim.dashTimer -= dt;
          sim.player.x += sim.dashVx * dt;
          sim.player.y += sim.dashVy * dt;
          sim.player.walkCycle += dt * 18;
          sim.player.moveSpeedRatio = 1;
          const dashAng = Math.atan2(sim.player.facingY || 0, sim.player.facingX || 1);
          sim.player.visualFacingAngle = dashAng;
          if (sim.raceClass === 'hunter') {
            runHunterShadowCutSegment(
              prevDx,
              prevDy,
              sim.player.x,
              sim.player.y,
              sim.ultActiveTimer > 0 ? '#38BDF8' : '#34D399'
            );
          }
          if (Math.random() < 0.65) {
            spawnParticles(sim, sim.player.x, sim.player.y, '#7DD3FC', 2, 45);
          }
        } else if (moveX !== 0 || moveY !== 0) {
          sim.standStillTimer = 0;
          const len = Math.hypot(moveX, moveY);
          moveX /= len;
          moveY /= len;
          sim.player.facingX = moveX;
          sim.player.facingY = moveY;
          const targetVx = moveX * stats.moveSpeed * totalMoveMult;
          const targetVy = moveY * stats.moveSpeed * totalMoveMult;
          const accelBlend = 1 - Math.exp(-dt * 20);
          sim.player.vx += (targetVx - sim.player.vx) * accelBlend;
          sim.player.vy += (targetVy - sim.player.vy) * accelBlend;
          sim.player.x += sim.player.vx * dt;
          sim.player.y += sim.player.vy * dt;

          const curSpd = Math.hypot(sim.player.vx, sim.player.vy);
          const spdRatio = Math.min(1, curSpd / Math.max(1, stats.moveSpeed));
          sim.player.moveSpeedRatio = spdRatio;
          sim.player.walkCycle += dt * (4 + 7.5 * spdRatio);

          const targetAng = Math.atan2(moveY, moveX);
          const angDiff = Math.atan2(
            Math.sin(targetAng - sim.player.visualFacingAngle),
            Math.cos(targetAng - sim.player.visualFacingAngle)
          );
          sim.player.visualFacingAngle += angDiff * (1 - Math.exp(-dt * 18));

          if (stats.phaseSmallMonsters && Math.random() < 0.35) {
            spawnParticles(sim, sim.player.x, sim.player.y + 8, '#FACC15', 1, 35);
          }
          if (stats.ramKnockbackOnMove && sim.ironRamCooldown <= 0) {
            let ramHit = false;
            const ramDmg = (18 + sim.player.level * 2.2) * stats.damageMult;
            for (const en of sim.enemies) {
              if (en.hp <= 0 || en.isBoss) continue;
              const rdx = en.x - sim.player.x;
              const rdy = en.y - sim.player.y;
              if (Math.hypot(rdx, rdy) <= sim.player.radius + en.radius + 20) {
                ramHit = true;
                damageEnemy(sim, en, ramDmg, null, 280, rdx, rdy, stats.greedMult);
              }
            }
            if (ramHit) {
              sim.ironRamCooldown = 0.6;
              sim.groundFx.push({
                kind: 'shockwave',
                x: sim.player.x,
                y: sim.player.y,
                radius: 10,
                maxRadius: 52,
                life: 0.24,
                maxLife: 0.24,
                color: '#94A3B8',
              });
            }
          }
        } else {
          sim.standStillTimer += dt;
          const decelBlend = 1 - Math.exp(-dt * 16);
          sim.player.vx *= 1 - decelBlend;
          sim.player.vy *= 1 - decelBlend;
          if (Math.hypot(sim.player.vx, sim.player.vy) < 4) {
            sim.player.vx = 0;
            sim.player.vy = 0;
          }
          sim.player.x += sim.player.vx * dt;
          sim.player.y += sim.player.vy * dt;
          const curSpd = Math.hypot(sim.player.vx, sim.player.vy);
          sim.player.moveSpeedRatio = Math.min(1, curSpd / Math.max(1, stats.moveSpeed));
          if (sim.player.moveSpeedRatio > 0.02) {
            sim.player.walkCycle += dt * (4 + 7.5 * sim.player.moveSpeedRatio);
          }
        }

        // M1 & M6 Player Obstacle Collision / Secret Room Wall Clamp
        if (sim.inSecretRoom) {
          sim.player.x = Math.max(-SECRET_ROOM_HALF_W + 44, Math.min(SECRET_ROOM_HALF_W - 44, sim.player.x));
          sim.player.y = Math.max(-SECRET_ROOM_HALF_H + 44, Math.min(SECRET_ROOM_HALF_H - 44, sim.player.y));
          resolveCircleVsObstacles(sim.player, sim.player.radius, sim.frameObstacles, 0.25);
        } else if (sim.dashTimer <= 0 && sim.batSwarmTimer <= 0) {
          resolveCircleVsObstacles(sim.player, sim.player.radius, sim.frameObstacles, 0.35);
        }

        // Knight Proactive Perfect Parry Check during 0.25s parryWindowTimer
        if (sim.raceClass === 'knight' && sim.parryWindowTimer > 0) {
          const dangerBullet = sim.enemyBullets.some(
            (b) => Math.hypot(b.x - sim.player.x, b.y - sim.player.y) <= 95
          );
          const dangerWindup = sim.enemies.some(
            (e) =>
              e.hp > 0 &&
              e.windupTimer > 0 &&
              Math.hypot(e.x - sim.player.x, e.y - sim.player.y) <= 105 + e.radius
          );
          if (dangerBullet || dangerWindup) {
            executeKnightParry();
          }
        }

        // Vampire Lord Passive Updates: Low-HP Ascension timer + Blood Shield 2%/s decay + Last Rite check
        if (sim.raceClass === 'vampire_lord') {
          if (sim.player.hp < sim.player.maxHp * 0.25) {
            sim.vampireLowHpTime += dt;
            if (!sim.ultAscended && sim.vampireLowHpTime >= 60) {
              sim.ultAscended = true;
              sim.announcement = 'จุติ! เคานต์โลหิตนิรันดร์ (Eternal Count) — กระหายโลหิต +1 ขั้นถาวร!';
              sim.announcementTimer = 5.2;
              sound.playBossChest();
            }
          }
          if (sim.vampireBloodShield > 0) {
            sim.vampireBloodShield = Math.max(0, sim.vampireBloodShield - sim.player.maxHp * 0.02 * dt);
          }
        }

        if (sim.player.invulnTimer > 0) sim.player.invulnTimer -= dt;
        if (sim.player.hitFlash > 0) sim.player.hitFlash -= dt;
        if (sim.shakeTime > 0) {
          sim.shakeTime -= dt;
          if (sim.shakeTime <= 0) {
            sim.shakeTime = 0;
            sim.shakeIntensity = 0;
            sim.shakeMaxTime = 0;
          }
        }
        if (sim.hitShakeCooldown > 0) sim.hitShakeCooldown -= dt;
        if (sim.critVfxCooldown > 0) sim.critVfxCooldown = Math.max(0, sim.critVfxCooldown - dt);

        // Spawn Enemies according to current Minute Wave (Paused inside Secret Dimension Room!)
        const isFrenzy = sim.mapEvent === 'frenzy_horde';
        const mobDensityBonus = 1 + (saveRef.current.activeCurses.spawn_rate || 0) * 0.15;
        const enemyCap = Math.round((isFrenzy ? 175 : 140) * Math.min(1.6, mobDensityBonus));
        if (!sim.inSecretRoom && sim.enemies.length < enemyCap) {
          sim.spawnTimer -= dt * (isFrenzy ? 1.6 : 1) * mobDensityBonus;
          if (sim.spawnTimer <= 0) {
            sim.spawnTimer = waveDef.spawnInterval;
            const spawnBatch = waveDef.batchSize + (isFrenzy ? 2 : 0);

            // Bat Swarm V-formation check!
            if (Math.random() < waveDef.batSwarmChance && sim.enemies.length < enemyCap - 8) {
              const angle = Math.random() * Math.PI * 2;
              const startX = sim.player.x + Math.cos(angle) * 560;
              const startY = sim.player.y + Math.sin(angle) * 560;
              const flyAngle = Math.atan2(sim.player.y - startY, sim.player.x - startX);
              const perpX = -Math.sin(flyAngle);
              const perpY = Math.cos(flyAngle);

              for (let i = -3; i <= 3; i++) {
                const bx = startX + perpX * i * 32 - Math.cos(flyAngle) * Math.abs(i) * 20;
                const by = startY + perpY * i * 32 - Math.sin(flyAngle) * Math.abs(i) * 20;
                const bat = createEnemy(sim, 'bat', bx, by, currentMinute, biome.hpMult, biome.speedMult);
                bat.swoopVx = Math.cos(flyAngle) * bat.speed;
                bat.swoopVy = Math.sin(flyAngle) * bat.speed;
                sim.enemies.push(bat);
              }
            } else {
              for (let i = 0; i < spawnBatch; i++) {
                const kind = waveDef.kinds[Math.floor(Math.random() * waveDef.kinds.length)];
                const angle = Math.random() * Math.PI * 2;
                const dist = 480 + Math.random() * 110;
                const ex = sim.player.x + Math.cos(angle) * dist;
                const ey = sim.player.y + Math.sin(angle) * dist;
                const mob = createEnemy(sim, kind, ex, ey, currentMinute, biome.hpMult, biome.speedMult);
                if (!FLYING_ENEMY_KINDS.has(kind)) pushOutOfObstacles(sim, mob, mob.radius);
                sim.enemies.push(mob);
              }
            }
          }

          // Elite Monster Periodic Spawn
          const eliteFreqMult = 1 + (saveRef.current.activeCurses.elite_freq || 0) * 0.5;
          sim.eliteSpawnTimer -= dt * eliteFreqMult;
          if (sim.eliteSpawnTimer <= 0) {
            sim.eliteSpawnTimer = 52;
            const kind = waveDef.kinds[Math.floor(Math.random() * waveDef.kinds.length)];
            const angle = Math.random() * Math.PI * 2;
            const ex = sim.player.x + Math.cos(angle) * 460;
            const ey = sim.player.y + Math.sin(angle) * 460;
            const elite = createEnemy(sim, kind, ex, ey, currentMinute, biome.hpMult, biome.speedMult, true);
            if (!FLYING_ENEMY_KINDS.has(kind)) pushOutOfObstacles(sim, elite, elite.radius);
            sim.enemies.push(elite);
            addFloatingText(sim, sim.player.x, sim.player.y - 36, 'มอนสเตอร์อีลิทปรากฏตัว!', '#FBBF24', 1.12);
          }

          // Flower Ring Encirclement!
          if (waveDef.flowerRingInterval > 0) {
            sim.flowerRingTimer -= dt;
            if (sim.flowerRingTimer <= 0) {
              sim.flowerRingTimer = waveDef.flowerRingInterval;
              const ringCount = 14;
              const ringRadius = 410;
              for (let i = 0; i < ringCount; i++) {
                const a = (i * Math.PI * 2) / ringCount;
                const fx = sim.player.x + Math.cos(a) * ringRadius;
                const fy = sim.player.y + Math.sin(a) * ringRadius;
                const flower = createEnemy(
                  sim,
                  'flower',
                  fx,
                  fy,
                  currentMinute,
                  biome.hpMult,
                  biome.speedMult
                );
                flower.ringAngle = a;
                flower.ringDist = ringRadius;
                pushOutOfObstacles(sim, flower, flower.radius);
                sim.enemies.push(flower);
              }
            }
          }
        }

        // Fire active cooldown weapons (non-Mage) OR Mage Elemental Magic + Mana System
        if (RACES[raceId].usesElements) {
          if (sim.lowManaTimer > 0) sim.lowManaTimer = Math.max(0, sim.lowManaTimer - dt);
          if (sim.fusionCooldown > 0) sim.fusionCooldown = Math.max(0, sim.fusionCooldown - dt);
          sim.fusionMaxCooldown = stats.fusionMaxCooldown;
          sim.mana = Math.min(stats.maxMana, sim.mana + stats.manaRegen * dt);

          // Mage 3rd-Fusion Wind Barrier active protection & radial pushback pulses
          if (sim.mageBarrierTimer > 0) {
            sim.mageBarrierTimer = Math.max(0, sim.mageBarrierTimer - dt);
            sim.mageBarrierPulseTimer -= dt;
            if (sim.mageBarrierPulseTimer <= 0) {
              sim.mageBarrierPulseTimer = 0.45;
              const bR = 165 * stats.areaMult;
              sim.groundFx.push({
                kind: 'shockwave',
                x: sim.player.x,
                y: sim.player.y,
                radius: 26,
                maxRadius: bR,
                life: 0.28,
                maxLife: 0.28,
                color: '#34D399',
              });
              for (let bi = sim.enemyBullets.length - 1; bi >= 0; bi--) {
                if (
                  Math.hypot(sim.enemyBullets[bi].x - sim.player.x, sim.enemyBullets[bi].y - sim.player.y) <= bR
                ) {
                  sim.enemyBullets.splice(bi, 1);
                }
              }
              for (const en of sim.enemies) {
                if (en.hp <= 0 || en.knockbackResist >= 1) continue;
                const d = Math.hypot(en.x - sim.player.x, en.y - sim.player.y);
                if (d <= bR + en.radius && d > 1) {
                  const effKb = Math.min(0.98, en.knockbackResist + (sim.mapEvent === 'gravity_well' ? 0.35 : 0));
                  const push = (1 - effKb) * 240;
                  en.kbVx += ((en.x - sim.player.x) / d) * push;
                  en.kbVy += ((en.y - sim.player.y) / d) * push;
                }
              }
            }
          }

          if (sim.spellbladeSwingTimer > 0) {
            sim.spellbladeSwingTimer = Math.max(0, sim.spellbladeSwingTimer - dt);
          }

          // Track 2s position history for Chronos Archon Rewind Revive (every 0.1s)
          sim.playerPosSampleTimer += dt;
          if (sim.playerPosSampleTimer >= 0.1) {
            sim.playerPosSampleTimer = 0;
            sim.playerPosHistory.push({ t: sim.elapsedSeconds, x: sim.player.x, y: sim.player.y });
            if (sim.playerPosHistory.length > 35) {
              sim.playerPosHistory.shift();
            }
          }

          // Chronos Archon (time_god): The World + Stasis Dome (โดมหยุดเวลา) + Time Debt
          if (sim.raceClass === 'time_god') {
            sim.lastCooldownMult = stats.cooldownMult;
            const { stopCooldown, stopDuration } = computeTimeGodStopTiming(stats.cooldownMult);
            sim.timeStopMaxCooldown = stopCooldown;
            sim.timeStopDurationMax = stopDuration;

            if (sim.timeStopTimer > 0) {
              const prevRem = sim.timeStopTimer;
              sim.timeStopTimer = Math.max(0, sim.timeStopTimer - dt);
              sim.timeStopTotalSeconds += Math.min(dt, prevRem);
              sound.setTimeStopMuffled(sim.timeStopTimer > 0);
              if (prevRem > 0 && sim.timeStopTimer === 0) {
                spawnPackVfx(sim.packVfx, 'chronos_ripple', sim.player.x, sim.player.y, {
                  groundPlane: true,
                  scale: 3.4,
                });
              }
              sim.timeStopTickTimer -= dt;
              if (sim.timeStopTickTimer <= 0 && sim.timeStopTimer > 0) {
                sim.timeStopTickTimer = 0.5;
                sound.playChronoTick();
              }
            } else {
              sound.setTimeStopMuffled(false);
              sim.timeStopCooldown = Math.min(sim.timeStopMaxCooldown, sim.timeStopCooldown - dt);
              if (sim.timeStopCooldown <= 0) {
                sim.timeStopTimer = stopDuration;
                sim.timeStopCooldown = stopCooldown;
                sim.timeStopCycleReduced = 0;
                sim.timeStopTickTimer = 0.5;
                sim.timeStopCount += 1;
                sound.setTimeStopMuffled(true);
                sound.playChronoTick();
                triggerAbilityFlash(sim, 0.22, 0.24);
                spawnPackVfx(sim.packVfx, 'chronos_ripple', sim.player.x, sim.player.y, {
                  groundPlane: true,
                  scale: 3.4,
                });
                sim.groundFx.push({
                  kind: 'shockwave',
                  x: sim.player.x,
                  y: sim.player.y,
                  radius: 22,
                  maxRadius: 340,
                  life: 0.52,
                  maxLife: 0.52,
                  color: '#22D3EE',
                });
                addFloatingText(
                  sim,
                  sim.player.x,
                  sim.player.y - 34,
                  `THE WORLD! หยุดเวลา (${stopDuration.toFixed(1)} วิ)`,
                  '#22D3EE',
                  1.22
                );
                sound.playMagicCast();
              }
            }

            // Stasis Dome (โดมหยุดเวลา): Auto-cast at densest enemy cluster within 380px (max 2 active)
            // Cooldown pauses during The World so domes don't stack instantly for free
            if (sim.timeStopTimer <= 0) {
              sim.chronoWellCooldown -= dt;
            }
            if (sim.chronoWellCooldown <= 0) {
              if (sim.chronoWells.length >= 2) {
                sim.chronoWellCooldown = 0.25;
              } else {
                const wellCd = Math.max(7.5, 10 * stats.cooldownMult);
                const wellRadius = 115 * Math.min(1.55, stats.areaMult);
                sim.chronoWellCooldown = wellCd;

                const nearbyEnemies: EnemyEntity[] = [];
                for (const en of sim.enemies) {
                  if (en.hp <= 0) continue;
                  if (Math.hypot(en.x - sim.player.x, en.y - sim.player.y) <= 380) {
                    nearbyEnemies.push(en);
                    if (nearbyEnemies.length >= 80) break;
                  }
                }

                let targetX = sim.player.x + (sim.player.facingX || 1) * 140;
                let targetY = sim.player.y + (sim.player.facingY || 0) * 140;
                if (nearbyEnemies.length > 0) {
                  let bestScore = -1;
                  let bestPlayerDist = Infinity;
                  for (const cand of nearbyEnemies) {
                    let count = 0;
                    for (const other of nearbyEnemies) {
                      if (Math.hypot(other.x - cand.x, other.y - cand.y) <= wellRadius) {
                        count += other.isBoss ? 3 : other.isElite ? 2 : 1;
                      }
                    }
                    const pDist = Math.hypot(cand.x - sim.player.x, cand.y - sim.player.y);
                    if (count > bestScore || (count === bestScore && pDist < bestPlayerDist)) {
                      bestScore = count;
                      bestPlayerDist = pDist;
                      targetX = cand.x;
                      targetY = cand.y;
                    }
                  }
                }

                const wellId = sim.chronoWellSeq++;
                sim.chronoWells.push({
                  id: wellId,
                  x: targetX,
                  y: targetY,
                  radius: wellRadius,
                  life: 3.5,
                  maxLife: 3.5,
                  frozenIds: new Set(),
                  stopCdReduced: 0,
                });
                triggerCastAnim(sim, targetX - sim.player.x);
                spawnParticles(sim, targetX, targetY, '#67E8F9', 14, 165);
                sound.playChronoTick();
              }
            }

            // 1-Minute Telemetry Console Log for Chronos Archon
            const currentMinMark = Math.floor(sim.elapsedSeconds / 60);
            if (currentMinMark > sim.chronoLastLogMinute) {
              sim.chronoLastLogMinute = currentMinMark;
              const activeSpan = Math.max(1, sim.elapsedSeconds - sim.timeGodSelectedAt);
              const stopPct = ((sim.timeStopTotalSeconds / activeSpan) * 100).toFixed(1);
              const rewindLabel =
                sim.rewindUsedCount >= 3
                  ? 'ใช้ครบ 3/3'
                  : sim.rewindReady
                    ? 'พร้อมใช้'
                    : sim.rewindLockTimer > 0
                      ? `ล็อก ${Math.ceil(sim.rewindLockTimer)}s`
                      : `${sim.rewindChargeKills}/${sim.rewindChargeTarget}`;
              console.log(
                `[Chronos Minute ${currentMinMark}] หยุดเวลา=${sim.timeStopCount} ครั้ง (${stopPct}%) | ฆ่าในบ่อเวลา=${sim.chronoWellKills} | ดาเมจหนี้เวลา=${Math.round(sim.timeDebtDamageTotal)} | ย้อนกาล=${rewindLabel} (${sim.rewindUsedCount}/3)`
              );
            }
          } else {
            sound.setTimeStopMuffled(false);
          }

          // Update Active Chrono Wells, Freeze/Slow Statuses, and Trigger Time Debt on Exit/Expire
          for (let ci = sim.expiredChronoWellCaps.length - 1; ci >= 0; ci--) {
            if (sim.expiredChronoWellCaps[ci].expireAt < sim.elapsedSeconds) {
              sim.expiredChronoWellCaps.splice(ci, 1);
            }
          }
          if (sim.chronoWells.length > 0 || sim.raceClass === 'time_god') {
            for (const en of sim.enemies) {
              en.chronoFrozenThisFrame = false;
              en.chronoSlowedThisFrame = false;
            }

            const enemyById = new Map<number, EnemyEntity>();
            for (const en of sim.enemies) {
              if (en.hp > 0) enemyById.set(en.id, en);
            }

            for (let wi = sim.chronoWells.length - 1; wi >= 0; wi--) {
              const well = sim.chronoWells[wi];
              // Pause well duration countdown while Global Time Stop is active
              if (sim.timeStopTimer <= 0) {
                well.life -= dt;
              }
              if (well.life <= 0) {
                // Vanish bullets frozen inside this well
                for (let bi = sim.enemyBullets.length - 1; bi >= 0; bi--) {
                  const b = sim.enemyBullets[bi];
                  if (b.frozenByWellId === well.id) {
                    spawnParticles(sim, b.x, b.y, '#67E8F9', 3, 55);
                    sim.enemyBullets.splice(bi, 1);
                  }
                }
                sim.expiredChronoWellCaps.push({
                  id: well.id,
                  stopCdReduced: well.stopCdReduced,
                  expireAt: sim.elapsedSeconds + 0.5,
                });
                sim.chronoWells.splice(wi, 1);
                continue;
              }

              // Prune frozenIds no longer alive or inside well
              for (const fid of Array.from(well.frozenIds)) {
                const fen = enemyById.get(fid);
                if (!fen || Math.hypot(fen.x - well.x, fen.y - well.y) > well.radius + fen.radius) {
                  well.frozenIds.delete(fid);
                }
              }

              // Apply freeze (max 40 per well) / overflow 50% slow / boss 70% slow
              for (const en of sim.enemies) {
                if (en.hp <= 0) continue;
                if (Math.hypot(en.x - well.x, en.y - well.y) <= well.radius + en.radius) {
                  const alreadyCountedThisFrame = Boolean(
                    en.chronoFrozenThisFrame || en.chronoSlowedThisFrame
                  );
                  if (en.isBoss) {
                    en.chronoSlowedThisFrame = true;
                  } else if (well.frozenIds.has(en.id) || en.chronoFrozenThisFrame) {
                    en.chronoFrozenThisFrame = true;
                  } else if (well.frozenIds.size < 28) {
                    well.frozenIds.add(en.id);
                    en.chronoFrozenThisFrame = true;
                  } else {
                    en.chronoSlowedThisFrame = true;
                  }
                  if (!alreadyCountedThisFrame) {
                    en.chronoDebtSeconds = (en.chronoDebtSeconds || 0) + dt;
                    en.chronoWellFrozenTime = (en.chronoWellFrozenTime || 0) + dt;
                  }
                  en.chronoLastWellId = well.id;
                  en.chronoLastWellExitAt = sim.elapsedSeconds;
                }
              }
            }

            // Trigger Time Debt when an enemy leaves all wells or its well expires
            const cappedHeroLvDebt = Math.min(sim.player.level, 40);
            for (const en of sim.enemies) {
              if (en.hp <= 0) continue;
              if (
                (en.chronoDebtSeconds || 0) > 0 &&
                !en.chronoFrozenThisFrame &&
                !en.chronoSlowedThisFrame
              ) {
                const debtSec = en.chronoDebtSeconds || 0;
                en.chronoDebtSeconds = 0;
                if (debtSec > 0.04) {
                  const debtDmg =
                    (30 + cappedHeroLvDebt * 2.5) *
                    debtSec *
                    stats.damageMult *
                    stats.classSkillPower;
                  sim.timeDebtDamageTotal += debtDmg;
                  sim.groundFx.push({
                    kind: 'time_debt_clock',
                    x: en.x,
                    y: en.y,
                    radius: Math.max(14, en.radius * 0.9),
                    maxRadius: Math.max(22, en.radius * 1.4),
                    life: 0.42,
                    maxLife: 0.42,
                    color: '#67E8F9',
                  });
                  spawnParticles(sim, en.x, en.y, '#FDE047', 6, 130);
                  sound.playTimeDebtShatter();
                  damageEnemy(
                    sim,
                    en,
                    debtDmg,
                    null,
                    0,
                    0,
                    0,
                    stats.greedMult,
                    false,
                    false,
                    true,
                    true,
                    '#67E8F9'
                  );
                }
              }
            }
          }

          // Periodically spawn Elemental Orbs nearby (capped cleanly so floor never overflows)
          sim.mageOrbSpawnTimer -= dt;
          if (sim.mageOrbSpawnTimer <= 0) {
            sim.mageOrbSpawnTimer = 6.5;
            const orbCount = countAndPruneElementOrbs(sim);
            if (orbCount < 5) {
              const ang = Math.random() * Math.PI * 2;
              const distOrb = 150 + Math.random() * 140;
              const el = ELEMENT_IDS[Math.floor(Math.random() * ELEMENT_IDS.length)];
              sim.drops.push({
                kind: 'element_orb',
                x: sim.player.x + Math.cos(ang) * distOrb,
                y: sim.player.y + Math.sin(ang) * distOrb,
                value: 1,
                elementId: el,
                magnetized: false,
              });
            }
          }

          // Helper to pick aim direction for Mage/Spellblade
          const findSpellAim = () => {
            let nearest: EnemyEntity | null = null;
            let bestD2 = 460 * 460;
            for (const e of sim.enemies) {
              if (e.hp <= 0) continue;
              const d2 = (e.x - sim.player.x) ** 2 + (e.y - sim.player.y) ** 2;
              if (d2 < bestD2) {
                bestD2 = d2;
                nearest = e;
              }
            }
            return nearest
              ? Math.atan2(nearest.y - sim.player.y, nearest.x - sim.player.x)
              : Math.atan2(sim.player.facingY, sim.player.facingX);
          };

          // Spellblade God / Voidless Archblade Charge Attack (with Cooldown after each 360° unleash!):
          // Stand still for 1.65s -> sword glows -> releasing key or starting to move unleashes 360-degree elemental sword storm!
          if (isSpellbladeClass(sim.raceClass)) {
            if (sim.spellbladeChargeCooldown > 0) {
              sim.spellbladeChargeCooldown = Math.max(0, sim.spellbladeChargeCooldown - dt);
            }
            const isMovingNow = moveX !== 0 || moveY !== 0 || sim.dashTimer > 0;
            const heldColor =
              sim.heldElements.length > 0 ? ELEMENTS[sim.heldElements[0]].color : '#F59E0B';
            const bladeColor =
              sim.voidlessTimer > 0
                ? '#E0F2FE'
                : sim.spellbladeInfusionColor || heldColor || '#F59E0B';

            if (sim.spellbladeChargeCooldown > 0) {
              sim.spellbladeStandTime = 0;
              sim.spellbladeCharge = 0;
              sim.spellbladeChargeNotified = false;
              chargeReleaseQueuedRef.current = false;
            } else if (!isMovingNow) {
              sim.spellbladeStandTime = Math.min(SPELLBLADE_CHARGE_TIME, sim.spellbladeStandTime + dt);
              sim.spellbladeCharge = Math.min(1, sim.spellbladeStandTime / SPELLBLADE_CHARGE_TIME);
              if (sim.spellbladeCharge >= 1 && !sim.spellbladeChargeNotified) {
                sim.spellbladeChargeNotified = true;
                sim.groundFx.push({
                  kind: 'shockwave',
                  x: sim.player.x,
                  y: sim.player.y,
                  radius: 12,
                  maxRadius: 72,
                  life: 0.28,
                  maxLife: 0.28,
                  color: bladeColor,
                });
                spawnParticles(sim, sim.player.x, sim.player.y, bladeColor, 10, 105);
                addFloatingText(
                  sim,
                  sim.player.x,
                  sim.player.y - 34,
                  'ดาบเรืองแสง! ขยับ/ปล่อยปุ่มเพื่อฟัน 360°',
                  bladeColor,
                  1.05
                );
                sound.playGemPickup();
              }
            }

            const shouldUnleash =
              sim.spellbladeChargeCooldown <= 0 &&
              sim.spellbladeCharge >= 1 &&
              (isMovingNow || chargeReleaseQueuedRef.current);

            if (shouldUnleash) {
              sim.spellbladeCharge = 0;
              sim.spellbladeStandTime = 0;
              sim.spellbladeChargeNotified = false;
              chargeReleaseQueuedRef.current = false;
              sim.spellbladeSwingTimer = 0.42;
              // Exact 3.0s Focus Cooldown after discharge before a new charge can begin
              sim.spellbladeChargeCooldown = SPELLBLADE_CHARGE_COOLDOWN;
              sim.spellbladeChargeMaxCooldown = SPELLBLADE_CHARGE_COOLDOWN;

              const waveCost = Math.max(3, Math.round(6 * stats.manaCostMult));
              const empowered = sim.mana >= waveCost;
              if (empowered) {
                sim.mana -= waveCost;
              }
              const cleaveR = (empowered ? 245 : 205) * stats.areaMult;
              const activeEls = stats.spellbladeBuffs.elements;

              // Full 360-degree grand circular slash visual (angle omitted -> full 360°)
              spawnPackVfx(sim.packVfx, 'spellblade_charge_360', sim.player.x, sim.player.y, {
                scale: Math.max(2.2, (cleaveR * 1.45) / 72),
                startElapsed: 4 / 12,
                life: 4 / 12,
                tintColor: bladeColor,
              });
              sim.groundFx.push({
                kind: 'grand_slash',
                x: sim.player.x,
                y: sim.player.y,
                radius: cleaveR * 0.35,
                maxRadius: cleaveR,
                life: 0.4,
                maxLife: 0.4,
                color: bladeColor,
              });
              sim.groundFx.push({
                kind: 'shockwave',
                x: sim.player.x,
                y: sim.player.y,
                radius: 26,
                maxRadius: cleaveR,
                life: 0.32,
                maxLife: 0.32,
                color: empowered ? '#FFFFFF' : bladeColor,
              });
              spawnParticles(sim, sim.player.x, sim.player.y, bladeColor, 24, 240);
              sim.shakeTime = 0.16;
              sim.shakeIntensity = empowered ? 6.0 : 4.2;

              // Only the 360-degree Focus Charge attack slices enemy bullets!
              for (let bi = sim.enemyBullets.length - 1; bi >= 0; bi--) {
                const b = sim.enemyBullets[bi];
                if (Math.hypot(b.x - sim.player.x, b.y - sim.player.y) <= cleaveR) {
                  spawnParticles(sim, b.x, b.y, bladeColor, 3, 105);
                  sim.enemyBullets.splice(bi, 1);
                }
              }

              // Balanced 360-degree Circular Slash + Active Elemental Signature
              const heavyDmg =
                ((empowered ? 56 : 42) + sim.player.level * 2.3) * stats.damageMult;
              const hasFire = activeEls.includes('fire');
              const hasWater = activeEls.includes('water');
              const hasWind = activeEls.includes('wind');
              const hpLeech =
                stats.spellbladeBuffs.hpLeech + (activeEls.includes('dark') || activeEls.includes('light') ? 1 : 0);
              const kbBonus = stats.spellbladeBuffs.kbMult * (hasWind ? 1.5 : 1);

              let hits = 0;
              const flameTargets: Array<{ x: number; y: number }> = [];
              for (const en of sim.enemies) {
                if (en.hp <= 0) continue;
                const edx = en.x - sim.player.x;
                const edy = en.y - sim.player.y;
                const d = Math.hypot(edx, edy);
                if (d <= cleaveR + en.radius) {
                  hits++;
                  if (hasWater) {
                    en.freezeTimer = Math.max(en.freezeTimer || 0, 1.8);
                    en.hardFreezeTimer = Math.max(en.hardFreezeTimer || 0, en.isBoss ? 0.55 : 1.05);
                    spawnVfx(sim.vfx, 'ice_nova', en.x, en.y, { scale: 0.75 });
                  }
                  if (hasFire) {
                    en.burnTimer = Math.max(en.burnTimer || 0, 3.2);
                    en.burnPct = Math.max(en.burnPct || 0, 0.028);
                    en.burnTickTimer = Math.min(en.burnTickTimer ?? 0.35, 0.35);
                    if (flameTargets.length < 3) flameTargets.push({ x: en.x, y: en.y });
                  }
                  if (hasWind) {
                    en.windMarkTimer = Math.max(en.windMarkTimer || 0, 4.0);
                    en.windMarkDamage = Math.max(en.windMarkDamage || 0, heavyDmg * 0.6);
                  }
                  damageEnemy(
                    sim,
                    en,
                    heavyDmg,
                    null,
                    210 * kbBonus,
                    edx,
                    edy,
                    stats.greedMult
                  );
                }
              }
              hitWorldTargetsInCircle(sim, sim.player.x, sim.player.y, cleaveR, heavyDmg, stats);

              if (hits > 0 && hpLeech > 0) {
                const heal = Math.min(5, hpLeech + Math.floor(hits / 4));
                const healed = applyLeechHeal(sim, heal);
                if (healed > 0) {
                  addFloatingText(sim, sim.player.x, sim.player.y - 26, `+${healed} HP`, '#FB7185', 0.95);
                }
              }
              if (hits > 0 && (stats.spellbladeBuffs.manaLeech > 0 || hasWater)) {
                const mpGain = Math.min(8, Math.max(2, stats.spellbladeBuffs.manaLeech * 2));
                sim.mana = Math.min(stats.maxMana, sim.mana + mpGain);
              }
              if (hasFire) {
                const burstTargets =
                  flameTargets.length > 0
                    ? flameTargets
                    : Array.from({ length: 3 }, (_, k) => ({
                        x: sim.player.x + Math.cos((k * Math.PI * 2) / 3) * (cleaveR * 0.55),
                        y: sim.player.y + Math.sin((k * Math.PI * 2) / 3) * (cleaveR * 0.55),
                      }));
                const blastR = 78 * stats.areaMult;
                for (const ft of burstTargets) {
                  sim.groundFx.push({
                    kind: 'explosion',
                    x: ft.x,
                    y: ft.y,
                    radius: 14,
                    maxRadius: blastR,
                    life: 0.26,
                    maxLife: 0.26,
                    color: '#F97316',
                  });
                  for (const en of sim.enemies) {
                    if (en.hp <= 0) continue;
                    if (Math.hypot(en.x - ft.x, en.y - ft.y) <= blastR + en.radius) {
                      damageEnemy(
                        sim,
                        en,
                        heavyDmg * 0.32,
                        null,
                        75,
                        en.x - ft.x,
                        en.y - ft.y,
                        stats.greedMult
                      );
                    }
                  }
                  hitWorldTargetsInCircle(sim, ft.x, ft.y, blastR, heavyDmg * 0.32, stats);
                }
              }

              // Launch 360-degree technique ONLY for currently active element(s)
              const faceAim = Math.atan2(sim.player.facingY, sim.player.facingX);
              triggerElementalSwordTechniques(
                sim,
                stats,
                activeEls,
                faceAim,
                true,
                empowered ? 1.15 : 1.0
              );
              triggerAbilityFlash(sim, empowered ? 0.22 : 0.15, empowered ? 0.22 : 0.16);

              addFloatingText(
                sim,
                sim.player.x,
                sim.player.y - 36,
                sim.voidlessTimer > 0
                  ? 'มหาดาบไร้ธาตุ 360°!'
                  : sim.spellbladeActiveElement
                    ? `ฟัน 360° ดาบ${ELEMENTS[sim.spellbladeActiveElement].nameTh}!`
                    : 'ฟันคลื่นดาบ 360°!',
                bladeColor,
                1.2
              );
              sound.playWeaponThrow();
            } else if (isMovingNow && sim.spellbladeCharge < 1) {
              // Moving before full charge resets the stand-still charge
              sim.spellbladeCharge = 0;
              sim.spellbladeStandTime = 0;
              sim.spellbladeChargeNotified = false;
              chargeReleaseQueuedRef.current = false;
            }
          }

          if (sim.spellbladeHitHealCooldown > 0) {
            sim.spellbladeHitHealCooldown = Math.max(0, sim.spellbladeHitHealCooldown - dt);
          }

          // Innate 0-MP Basic Attack: Distinct Single-Element Sword Slash (Spellblade / Voidless) OR Arcane Spark (Mage)
          sim.mageSparkTimer -= dt;
          if (sim.mageSparkTimer <= 0) {
            const aim = findSpellAim();
            const heldColor =
              sim.heldElements.length > 0 ? ELEMENTS[sim.heldElements[0]].color : '#818CF8';

            if (isSpellbladeClass(sim.raceClass)) {
              sim.spellbladeSlashCounter += 1;
              const effectiveCdMult = Math.max(0.76, stats.cooldownMult);
              const inVoidless = sim.voidlessTimer > 0;
              const voidlessCycle: ElementId[] = ['fire', 'water', 'wind', 'light', 'dark'];
              const swingElement: ElementId | null = inVoidless
                ? voidlessCycle[(sim.spellbladeSlashCounter - 1) % voidlessCycle.length]
                : stats.spellbladeBuffs.elements[0] ?? null;
              const prof = getSpellbladeSwordProfile(swingElement);

              sim.mageSparkTimer =
                (inVoidless ? Math.min(0.78, prof.swingInterval * 0.78) : prof.swingInterval) *
                effectiveCdMult;
              sim.spellbladeSwingTimer = Math.max(sim.spellbladeSwingTimer, 0.18);

              const bladeColor = inVoidless
                ? ELEMENTS[swingElement!].glowColor
                : swingElement
                  ? ELEMENTS[swingElement].color
                  : sim.spellbladeInfusionColor || heldColor || '#F59E0B';
              const sweepR = prof.slashReach * (inVoidless ? 1.12 : 1.0) * stats.areaMult;
              const arcHalf = prof.arcHalfAngle;

              sim.groundFx.push({
                kind: 'slash_arc',
                x: sim.player.x,
                y: sim.player.y,
                angle: aim,
                radius: sweepR * 0.58,
                maxRadius: sweepR,
                life: 0.22,
                maxLife: 0.22,
                color: bladeColor,
              });
              if (inVoidless || sim.lastSpellbladeFusion) {
                const arcPalette = inVoidless
                  ? getCombinedElementPalette(['fire', 'water', 'light', 'dark', 'wind'], '#E0F2FE')
                  : getCombinedElementPalette(
                      [
                        sim.lastSpellbladeFusion!.def.a,
                        sim.lastSpellbladeFusion!.def.b,
                        sim.lastSpellbladeFusion!.catalyst,
                      ],
                      sim.lastSpellbladeFusion!.def.color
                    );
                if (sim.particles.length < 300) {
                  for (let k = 0; k < 5; k++) {
                    const a = aim + (k - 2) * 0.26;
                    const dist = sweepR * (0.65 + Math.random() * 0.32);
                    const col = arcPalette.colors[k % arcPalette.colors.length];
                    const sec = arcPalette.colors[(k + 1) % arcPalette.colors.length];
                    sim.particles.push({
                      x: sim.player.x + Math.cos(a) * dist,
                      y: sim.player.y + Math.sin(a) * dist,
                      vx: Math.cos(a) * 65,
                      vy: Math.sin(a) * 65,
                      radius: 3.1,
                      life: 0.34,
                      maxLife: 0.34,
                      color: col,
                      secondaryColor: sec,
                      shape: arcPalette.shapes[k % arcPalette.shapes.length],
                      angle: a,
                      spin: 4,
                      drag: 2.4,
                      zOffset: 16,
                      glow: true,
                    });
                  }
                }
              }

              const cleaveDmg =
                (15 + sim.player.level * 1.05) * stats.damageMult * prof.damageMult;
              const kbAmt = prof.knockback * (inVoidless ? 1.1 : 1.0);
              let hitAny = false;

              for (const en of sim.enemies) {
                if (en.hp <= 0) continue;
                const edx = en.x - sim.player.x;
                const edy = en.y - sim.player.y;
                const d = Math.hypot(edx, edy);
                if (d <= sweepR + en.radius) {
                  let diff = Math.atan2(edy, edx) - aim;
                  while (diff > Math.PI) diff -= Math.PI * 2;
                  while (diff < -Math.PI) diff += Math.PI * 2;
                  if (Math.abs(diff) <= arcHalf || d <= 34) {
                    hitAny = true;
                    if (swingElement === 'water') {
                      en.freezeTimer = Math.max(en.freezeTimer || 0, 1.45);
                      en.frostStacks = (en.frostStacks || 0) + 1;
                      if (en.frostStacks >= (en.isBoss ? 5 : 3)) {
                        en.frostStacks = 0;
                        en.hardFreezeTimer = Math.max(en.hardFreezeTimer || 0, en.isBoss ? 0.45 : 0.95);
                      }
                    } else if (swingElement === 'fire') {
                      en.burnTimer = Math.max(en.burnTimer || 0, 3.0);
                      en.burnPct = Math.max(en.burnPct || 0, 0.024);
                      en.burnTickTimer = Math.min(en.burnTickTimer ?? 0.4, 0.4);
                    } else if (swingElement === 'wind') {
                      en.windMarkTimer = Math.max(en.windMarkTimer || 0, 3.5);
                      en.windMarkDamage = Math.max(en.windMarkDamage || 0, cleaveDmg * 0.78);
                    }
                    damageEnemy(
                      sim,
                      en,
                      cleaveDmg,
                      null,
                      kbAmt,
                      edx,
                      edy,
                      stats.greedMult
                    );
                  }
                }
              }
              hitWorldTargetsInCircle(
                sim,
                sim.player.x + Math.cos(aim) * (sweepR * 0.45),
                sim.player.y + Math.sin(aim) * (sweepR * 0.45),
                sweepR * 0.65,
                cleaveDmg,
                stats
              );

              // Modest hit-gated healing for Light / Blood (no free AFK regen, no basic-attack bullet deletion!)
              if (
                hitAny &&
                (swingElement === 'light' || swingElement === 'blood') &&
                sim.spellbladeHitHealCooldown <= 0 &&
                sim.player.hp < sim.player.maxHp
              ) {
                sim.spellbladeHitHealCooldown = 2.2;
                const healed = applyLeechHeal(sim, 1);
                if (healed > 0) {
                  addFloatingText(
                    sim,
                    sim.player.x,
                    sim.player.y - 24,
                    `+${healed}`,
                    ELEMENTS[swingElement].glowColor,
                    0.85
                  );
                }
              }

              // Fire ONLY the single active element's wave technique (separated per element!)
              triggerElementalSwordTechniques(
                sim,
                stats,
                swingElement ? [swingElement] : [],
                aim,
                false,
                1.0
              );
              sound.playWeaponThrow();
            } else {
              sim.mageSparkTimer = 0.82 * stats.cooldownMult;
              const spd = 450 * stats.projSpeedMult;
              const sparkCount = sim.player.level >= 6 ? 2 : 1;
              for (let si = 0; si < sparkCount; si++) {
                const ang = aim + (si - (sparkCount - 1) / 2) * 0.16;
                sim.projectiles.push({
                  weaponId: 'wand',
                  evolved: false,
                  fromClassSkill: true,
                  x: sim.player.x,
                  y: sim.player.y,
                  vx: Math.cos(ang) * spd,
                  vy: Math.sin(ang) * spd,
                  radius: 8.5,
                  damage: (14 + sim.player.level * 1.4) * stats.damageMult,
                  knockback: 34,
                  pierce: 2,
                  life: 0.95,
                  maxLife: 0.95,
                  hitIds: new Set(),
                  rotation: ang,
                  homing: true,
                  color: heldColor,
                });
              }
            }
          }

          // Active Fused Elemental Spells:
          // - Spellblade God & Voidless Archblade keep them as elemental sword infusions (no auto-cast storms)
          // - Standard Mage auto-casts active ritual spells while consuming Mana
          for (let fi = sim.activeFusions.length - 1; fi >= 0; fi--) {
            const spell = sim.activeFusions[fi];
            spell.remaining -= dt;
            if (spell.remaining <= 0) {
              sim.activeFusions.splice(fi, 1);
              if (isSpellbladeClass(sim.raceClass)) {
                const latest = sim.activeFusions[sim.activeFusions.length - 1];
                sim.spellbladeInfusionName = latest ? latest.def.nameTh : null;
                sim.spellbladeInfusionColor = latest ? latest.def.color : null;
              }
              continue;
            }
            if (isSpellbladeClass(sim.raceClass)) {
              continue;
            }
            spell.cooldownTimer -= dt;
            if (spell.cooldownTimer <= 0) {
              const cost = Math.max(3, Math.round(spell.def.manaCost * stats.manaCostMult));
              if (sim.mana >= cost) {
                sim.mana -= cost;
                const windFactor = spell.catalyst === 'wind' ? 0.78 : 1;
                spell.cooldownTimer = spell.def.cooldown * stats.cooldownMult * 1.18 * windFactor;
                castElementalFusion(
                  sim,
                  spell.def,
                  stats,
                  spell.catalyst,
                  spell.resonance,
                  spell.voidInfused ? 1.35 : 1.0,
                  spell.voidInfused ? 1.15 : 1.0
                );
              } else {
                sim.lowManaTimer = 0.8;
                spell.cooldownTimer = 0.55;
              }
            }
          }

          // Voidless Archblade Mode Lifecycle (every 100 kills, 10s active duration, 15s cooldown)
          if (sim.raceClass === 'voidless_blade') {
            if (sim.voidlessTimer > 0) {
              sim.voidlessTimer -= dt;
              // Periodic Heavenly Light Pillars ONLY while Voidless Ascension Mode is active!
              sim.voidlessPillarTimer -= dt;
              if (sim.voidlessPillarTimer <= 0) {
                sim.voidlessPillarTimer = 2.4;
                const activePillars = sim.elementalFields.filter((f) => f.kind === 'heaven_pillar').length;
                if (activePillars < 3) {
                  const onScreen = sim.enemies.filter(
                    (e) => e.hp > 0 && Math.hypot(e.x - sim.player.x, e.y - sim.player.y) <= 440
                  );
                  const target =
                    onScreen.length > 0 && Math.random() < 0.8
                      ? onScreen[Math.floor(Math.random() * onScreen.length)]
                      : null;
                  const ang = Math.random() * Math.PI * 2;
                  const d = 90 + Math.random() * 230;
                  const hpX = target ? target.x : sim.player.x + Math.cos(ang) * d;
                  const hpY = target ? target.y : sim.player.y + Math.sin(ang) * d;
                  sim.elementalFields.push({
                    kind: 'heaven_pillar',
                    vfxKey: 'voidless_heaven_pillar',
                    x: hpX,
                    y: hpY,
                    vx: 0,
                    vy: 0,
                    radius: 74 * stats.areaMult,
                    damage: (14 + sim.player.level * 1.0) * stats.damageMult,
                    color: '#FDE047',
                    life: 2.1,
                    maxLife: 2.1,
                    tickTimer: 0.1,
                    pullStrength: 0,
                  });
                  spawnSheetVfx(sim, 'holy_pillar', hpX, hpY, { size: 175, life: 0.58 });
                }
              }
              if (sim.voidlessTimer <= 0) {
                sim.voidlessTimer = 0;
                sim.voidlessCooldown = VOIDLESS_COOLDOWN;
                sim.spiritSwords = [];
                addFloatingText(
                  sim,
                  sim.player.x,
                  sim.player.y - 32,
                  `สิ้นสุดโหมดจุติไร้ธาตุ (CD ${VOIDLESS_COOLDOWN}s)`,
                  '#94A3B8',
                  1.05
                );
              }
            } else {
              if (sim.voidlessCooldown > 0) {
                sim.voidlessCooldown = Math.max(0, sim.voidlessCooldown - dt);
              }
              if (sim.voidlessCooldown <= 0 && sim.voidlessKills >= VOIDLESS_KILLS_REQ) {
                activateVoidlessMode(sim, stats);
              }
            }

            // Autonomous Sentient Spirit Swords AI (5 elemental blades with 60% hero HP each!)
            for (let si = sim.spiritSwords.length - 1; si >= 0; si--) {
              const sw = sim.spiritSwords[si];
              if (sw.swingTimer > 0) sw.swingTimer -= dt;
              if (sw.invulnTimer > 0) sw.invulnTimer -= dt;
              if (sw.slashCooldown > 0) sw.slashCooldown -= dt;
              for (const k of Object.keys(sw.hitCooldowns)) {
                const idNum = Number(k);
                sw.hitCooldowns[idNum] -= dt;
                if (sw.hitCooldowns[idNum] <= 0) delete sw.hitCooldowns[idNum];
              }

              // Pick spread-out target nearby, or orbit around hero if clear
              const candidates = sim.enemies.filter(
                (en) => en.hp > 0 && Math.hypot(en.x - sim.player.x, en.y - sim.player.y) <= 460
              );
              let goalX: number;
              let goalY: number;
              if (candidates.length > 0) {
                candidates.sort(
                  (a, b) =>
                    Math.hypot(a.x - sw.x, a.y - sw.y) - Math.hypot(b.x - sw.x, b.y - sw.y)
                );
                const pick = candidates[si % Math.min(candidates.length, 5)];
                goalX = pick.x;
                goalY = pick.y;
              } else {
                const orbitAng = sim.elapsedSeconds * 2.1 + (si * Math.PI * 2) / 5;
                goalX = sim.player.x + Math.cos(orbitAng) * 76;
                goalY = sim.player.y + Math.sin(orbitAng) * 76;
              }

              const tdx = goalX - sw.x;
              const tdy = goalY - sw.y;
              const td = Math.hypot(tdx, tdy) || 1;
              if (td > 18) {
                const flySpd = 325;
                sw.vx = (tdx / td) * flySpd;
                sw.vy = (tdy / td) * flySpd;
                sw.x += sw.vx * dt;
                sw.y += sw.vy * dt;
                sw.angle = Math.atan2(tdy, tdx);
              } else {
                sw.vx = 0;
                sw.vy = 0;
              }

              // Block nearby enemy bullets for the player!
              for (let bi = sim.enemyBullets.length - 1; bi >= 0; bi--) {
                const b = sim.enemyBullets[bi];
                if (Math.hypot(b.x - sw.x, b.y - sw.y) <= 28 + b.radius) {
                  spawnParticles(sim, b.x, b.y, ELEMENTS[sw.element].glowColor, 3, 70);
                  sim.enemyBullets.splice(bi, 1);
                }
              }

              // Autonomous Elemental Slash every ~0.62s when enemies are in 64px reach
              if (sw.slashCooldown <= 0) {
                let struck = false;
                const swReach = 64;
                for (const en of sim.enemies) {
                  if (en.hp <= 0 || sw.hitCooldowns[en.id]) continue;
                  const edx = en.x - sw.x;
                  const edy = en.y - sw.y;
                  if (Math.hypot(edx, edy) <= swReach + en.radius) {
                    struck = true;
                    sw.hitCooldowns[en.id] = 0.48;
                    let kb = 95;
                    if (sw.element === 'fire') {
                      en.burnTimer = Math.max(en.burnTimer || 0, 2.8);
                      en.burnPct = Math.max(en.burnPct || 0, 0.025);
                      en.burnTickTimer = Math.min(en.burnTickTimer ?? 0.35, 0.35);
                    } else if (sw.element === 'water') {
                      en.freezeTimer = Math.max(en.freezeTimer || 0, 1.5);
                      en.frostStacks = (en.frostStacks || 0) + 1;
                      if (en.frostStacks >= (en.isBoss ? 5 : 3)) {
                        en.frostStacks = 0;
                        en.hardFreezeTimer = Math.max(en.hardFreezeTimer || 0, en.isBoss ? 0.45 : 0.95);
                      }
                    } else if (sw.element === 'light') {
                      if (sim.player.hp < sim.player.maxHp && Math.random() < 0.25) {
                        applyLeechHeal(sim, 1);
                      }
                    } else if (sw.element === 'dark' && !en.isBoss) {
                      en.x += (sw.x - en.x) * 0.18;
                      en.y += (sw.y - en.y) * 0.18;
                      en.freezeTimer = Math.max(en.freezeTimer || 0, 0.85);
                    } else if (sw.element === 'wind') {
                      kb = 200;
                      en.windMarkTimer = Math.max(en.windMarkTimer || 0, 3.6);
                      en.windMarkDamage = Math.max(en.windMarkDamage || 0, sw.damage * 0.72);
                    }
                    damageEnemy(sim, en, sw.damage, null, kb, edx, edy, stats.greedMult);
                  }
                }
                if (struck) {
                  sw.slashCooldown = 0.62;
                  sw.swingTimer = 0.24;
                  sim.groundFx.push({
                    kind: 'slash_arc',
                    x: sw.x,
                    y: sw.y,
                    angle: sw.angle,
                    radius: 36,
                    maxRadius: 68,
                    life: 0.18,
                    maxLife: 0.18,
                    color: ELEMENTS[sw.element].glowColor,
                  });
                  spawnSheetVfx(
                    sim,
                    'holy_slash',
                    sw.x + Math.cos(sw.angle) * 24,
                    sw.y + Math.sin(sw.angle) * 24,
                    { size: 108, life: 0.24, angle: sw.angle, zOffset: 10 }
                  );
                }
              }

              // Spirit Swords take contact damage (60% Hero Max HP) and shatter in an elemental burst if destroyed
              if (sw.invulnTimer <= 0) {
                for (const en of sim.enemies) {
                  if (en.hp <= 0) continue;
                  if (Math.hypot(en.x - sw.x, en.y - sw.y) <= en.radius + 18) {
                    const dmg = Math.max(4, Math.round(en.damage * 0.55));
                    sw.hp -= dmg;
                    sw.invulnTimer = 0.45;
                    break;
                  }
                }
              }
              if (sw.hp <= 0) {
                const shatterR = 96;
                sim.groundFx.push({
                  kind: 'explosion',
                  x: sw.x,
                  y: sw.y,
                  radius: 14,
                  maxRadius: shatterR,
                  life: 0.3,
                  maxLife: 0.3,
                  color: ELEMENTS[sw.element].glowColor,
                });
                spawnParticles(sim, sw.x, sw.y, ELEMENTS[sw.element].glowColor, 14, 175);
                for (const en of sim.enemies) {
                  if (en.hp <= 0) continue;
                  if (Math.hypot(en.x - sw.x, en.y - sw.y) <= shatterR + en.radius) {
                    damageEnemy(
                      sim,
                      en,
                      sw.damage * 1.45,
                      null,
                      220,
                      en.x - sw.x,
                      en.y - sw.y,
                      stats.greedMult
                    );
                  }
                }
                addFloatingText(
                  sim,
                  sw.x,
                  sw.y - 20,
                  `ดาบวิญญาณ${ELEMENTS[sw.element].nameTh}แตกสลาย!`,
                  ELEMENTS[sw.element].glowColor,
                  0.95
                );
                sim.spiritSwords.splice(si, 1);
              }
            }
          }

          // Update 360-degree Sweeping Scan Lasers
          for (let li = sim.sweepingLasers.length - 1; li >= 0; li--) {
            const sl = sim.sweepingLasers[li];
            sl.life -= dt;
            if (sl.life <= 0) {
              sim.sweepingLasers.splice(li, 1);
              continue;
            }
            sl.angle += sl.angularSpeed * dt;
            if (sl.trailColors && sl.trailColors.length > 0) {
              sl.trailTimer = (sl.trailTimer ?? 0) - dt;
              if (sl.trailTimer <= 0 && sim.particles.length < 300) {
                sl.trailTimer = 0.045;
                const dAlong = sl.length * (0.28 + Math.random() * 0.68);
                const idx = Math.floor(Math.random() * sl.trailColors.length);
                const col = sl.trailColors[idx];
                const sec = sl.trailColors[(idx + 1) % sl.trailColors.length];
                sim.particles.push({
                  x: sim.player.x + Math.cos(sl.angle) * dAlong,
                  y: sim.player.y + Math.sin(sl.angle) * dAlong,
                  vx: Math.cos(sl.angle + Math.PI / 2) * 45,
                  vy: Math.sin(sl.angle + Math.PI / 2) * 45,
                  radius: 3.1,
                  life: 0.32,
                  maxLife: 0.32,
                  color: col,
                  secondaryColor: sec,
                  shape: sl.particleShapes?.[idx % sl.particleShapes.length] ?? 'spark',
                  angle: sl.angle + Math.PI / 2,
                  drag: 2.5,
                  zOffset: 14,
                  glow: true,
                });
              }
            }
            for (const key of Object.keys(sl.tickCooldowns)) {
              const idNum = Number(key);
              sl.tickCooldowns[idNum] -= dt;
              if (sl.tickCooldowns[idNum] <= 0) delete sl.tickCooldowns[idNum];
            }
            const lx1 = sim.player.x;
            const ly1 = sim.player.y;
            const dxL = Math.cos(sl.angle) * sl.length;
            const dyL = Math.sin(sl.angle) * sl.length;
            const len2 = dxL * dxL + dyL * dyL;
            const halfW = sl.width * 0.5;
            for (const en of sim.enemies) {
              if (en.hp <= 0 || sl.tickCooldowns[en.id]) continue;
              const tProj = Math.max(0, Math.min(1, ((en.x - lx1) * dxL + (en.y - ly1) * dyL) / len2));
              const cx = lx1 + tProj * dxL;
              const cy = ly1 + tProj * dyL;
              if (Math.hypot(en.x - cx, en.y - cy) <= halfW + en.radius) {
                sl.tickCooldowns[en.id] = 0.22;
                damageEnemy(sim, en, sl.damage, null, 75, dxL, dyL, stats.greedMult);
              }
            }
            hitWorldTargetsOnSegment(sim, lx1, ly1, lx1 + dxL, ly1 + dyL, halfW, sl.damage, stats);
            for (let bi = sim.enemyBullets.length - 1; bi >= 0; bi--) {
              const b = sim.enemyBullets[bi];
              const tProj = Math.max(0, Math.min(1, ((b.x - lx1) * dxL + (b.y - ly1) * dyL) / len2));
              const cx = lx1 + tProj * dxL;
              const cy = ly1 + tProj * dyL;
              if (Math.hypot(b.x - cx, b.y - cy) <= halfW + b.radius) {
                sim.enemyBullets.splice(bi, 1);
              }
            }
          }

          // Update Orbiting Elemental Blades
          for (let oi = sim.orbitingBlades.length - 1; oi >= 0; oi--) {
            const ob = sim.orbitingBlades[oi];
            ob.life -= dt;
            if (ob.life <= 0) {
              sim.orbitingBlades.splice(oi, 1);
              continue;
            }
            ob.angle += ob.angularSpeed * dt;
            for (const key of Object.keys(ob.hitCooldowns)) {
              const idNum = Number(key);
              ob.hitCooldowns[idNum] -= dt;
              if (ob.hitCooldowns[idNum] <= 0) delete ob.hitCooldowns[idNum];
            }
            const bx = sim.player.x + Math.cos(ob.angle) * ob.orbitRadius;
            const by = sim.player.y + Math.sin(ob.angle) * ob.orbitRadius;
            if (ob.trailColors && ob.trailColors.length > 0) {
              ob.trailTimer = (ob.trailTimer ?? 0) - dt;
              if (ob.trailTimer <= 0 && sim.particles.length < 300) {
                ob.trailTimer = 0.055;
                const idx = Math.floor(Math.random() * ob.trailColors.length);
                const col = ob.trailColors[idx];
                const sec = ob.trailColors[(idx + 1) % ob.trailColors.length];
                sim.particles.push({
                  x: bx,
                  y: by,
                  vx: -Math.sin(ob.angle) * 32,
                  vy: Math.cos(ob.angle) * 32,
                  radius: 2.9,
                  life: 0.3,
                  maxLife: 0.3,
                  color: col,
                  secondaryColor: sec,
                  shape: ob.particleShapes?.[idx % ob.particleShapes.length] ?? 'spark',
                  angle: ob.angle + Math.PI / 2,
                  spin: 6,
                  drag: 2.0,
                  zOffset: 14,
                  glow: true,
                });
              }
            }
            for (const en of sim.enemies) {
              if (en.hp <= 0 || ob.hitCooldowns[en.id]) continue;
              if (Math.hypot(en.x - bx, en.y - by) <= ob.radius + en.radius) {
                ob.hitCooldowns[en.id] = 0.28;
                damageEnemy(sim, en, ob.damage, null, 95, en.x - bx, en.y - by, stats.greedMult);
              }
            }
            hitWorldTargetsInCircle(sim, bx, by, ob.radius, ob.damage, stats);
            for (let bi = sim.enemyBullets.length - 1; bi >= 0; bi--) {
              const b = sim.enemyBullets[bi];
              if (Math.hypot(b.x - bx, b.y - by) <= ob.radius + b.radius + 3) {
                sim.enemyBullets.splice(bi, 1);
              }
            }
          }

          // Update Persistent Elemental Storm / Pool / Black Hole / Heaven Pillar Fields
          for (let ei = sim.elementalFields.length - 1; ei >= 0; ei--) {
            const ef = sim.elementalFields[ei];
            ef.life -= dt;
            if (ef.life <= 0) {
              if (ef.exitSlowSec) {
                for (const en of sim.enemies) {
                  if (en.hp <= 0) continue;
                  if (Math.hypot(ef.x - en.x, ef.y - en.y) <= ef.radius * 1.35 + en.radius) {
                    en.freezeTimer = Math.max(en.freezeTimer || 0, ef.exitSlowSec);
                  }
                }
              }
              sim.elementalFields.splice(ei, 1);
              continue;
            }
            ef.x += ef.vx * dt;
            ef.y += ef.vy * dt;
            if (ef.trailColors && ef.trailColors.length > 0) {
              ef.trailTimer = (ef.trailTimer ?? 0) - dt;
              if (ef.trailTimer <= 0 && sim.particles.length < 300) {
                ef.trailTimer = 0.085;
                const a = Math.random() * Math.PI * 2;
                const r = ef.radius * (0.3 + Math.random() * 0.65);
                const idx = Math.floor(Math.random() * ef.trailColors.length);
                const col = ef.trailColors[idx];
                const sec = ef.trailColors[(idx + 1) % ef.trailColors.length];
                sim.particles.push({
                  x: ef.x + Math.cos(a) * r,
                  y: ef.y + Math.sin(a) * r,
                  vx: Math.cos(a + Math.PI / 2) * 24,
                  vy: -22 + Math.sin(a + Math.PI / 2) * 16,
                  radius: 2.9,
                  life: 0.42,
                  maxLife: 0.42,
                  color: col,
                  secondaryColor: sec,
                  shape: ef.particleShapes?.[idx % ef.particleShapes.length] ?? 'circle',
                  angle: a,
                  spin: 4,
                  drag: 1.5,
                  zOffset: 10,
                  glow: true,
                });
              }
            }
            if (ef.pullNonBossAll) {
              // Dark Black Hole: pulls nearby non-boss enemies within 2.1x radius & slows them
              const pullLimit = ef.radius * 2.1;
              for (const en of sim.enemies) {
                if (en.hp <= 0) continue;
                const d = Math.hypot(ef.x - en.x, ef.y - en.y);
                if (!en.isBoss && d <= pullLimit + en.radius && d > 10) {
                  const pullSpd = d <= ef.radius ? ef.pullStrength : ef.pullStrength * 0.65;
                  en.x += ((ef.x - en.x) / d) * pullSpd * dt;
                  en.y += ((ef.y - en.y) / d) * pullSpd * dt;
                }
                if (ef.slowTargets && d <= ef.radius * 1.1 + en.radius) {
                  en.freezeTimer = Math.max(en.freezeTimer || 0, ef.exitSlowSec || 1.2);
                }
              }
            } else if (ef.pullStrength > 0 || ef.slowTargets) {
              for (const en of sim.enemies) {
                if (en.hp <= 0) continue;
                const d = Math.hypot(ef.x - en.x, ef.y - en.y);
                if (d <= ef.radius + en.radius && d > 6) {
                  if (ef.pullStrength > 0 && !en.isBoss) {
                    en.x += ((ef.x - en.x) / d) * ef.pullStrength * dt;
                    en.y += ((ef.y - en.y) / d) * ef.pullStrength * dt;
                  }
                  if (ef.slowTargets) {
                    en.freezeTimer = Math.max(en.freezeTimer || 0, 0.35);
                  }
                }
              }
            }
            ef.tickTimer -= dt;
            if (ef.tickTimer <= 0) {
              ef.tickTimer = ef.kind === 'heaven_pillar' ? 0.34 : 0.4;
              for (const en of sim.enemies) {
                if (en.hp <= 0) continue;
                if (Math.hypot(en.x - ef.x, en.y - ef.y) <= ef.radius + en.radius) {
                  damageEnemy(sim, en, ef.damage, null, 25, en.x - ef.x, en.y - ef.y, stats.greedMult);
                }
              }
              hitWorldTargetsInCircle(sim, ef.x, ef.y, ef.radius, ef.damage, stats);
            }
          }

          // Update Mage's Summoned Frost / Stone Elemental Golem (taunts nearby mobs!)
          if (sim.elementalGolem) {
            const eg = sim.elementalGolem;
            eg.life -= dt;
            if (eg.life <= 0) {
              sim.elementalGolem = null;
            } else {
              let target: EnemyEntity | null = null;
              let bestD2 = 380 * 380;
              for (const en of sim.enemies) {
                if (en.hp <= 0) continue;
                const d2 = (en.x - eg.x) ** 2 + (en.y - eg.y) ** 2;
                if (d2 < bestD2) {
                  bestD2 = d2;
                  target = en;
                }
              }
              const goalX = target ? target.x : sim.player.x + Math.cos(sim.orbitAngle) * 58;
              const goalY = target ? target.y : sim.player.y + Math.sin(sim.orbitAngle) * 58;
              const gdx = goalX - eg.x;
              const gdy = goalY - eg.y;
              const gd = Math.hypot(gdx, gdy);
              if (gd > 26) {
                const spd = target ? 245 : 220;
                eg.x += (gdx / gd) * spd * dt;
                eg.y += (gdy / gd) * spd * dt;
                eg.walkCycle += dt * 9;
              }
              if (eg.smashingTimer > 0) eg.smashingTimer -= dt;
              eg.smashCooldown -= dt;
              if (eg.smashCooldown <= 0 && target && Math.sqrt(bestD2) <= 125 + target.radius) {
                eg.smashCooldown = 0.9;
                eg.smashingTimer = 0.3;
                const smashR = 128 * stats.areaMult;
                const smashDmg = (48 + sim.player.level * 3.1) * stats.damageMult;
                sim.groundFx.push({
                  kind: 'shockwave',
                  x: eg.x,
                  y: eg.y,
                  radius: 16,
                  maxRadius: smashR,
                  life: 0.32,
                  maxLife: 0.32,
                  color: eg.theme === 'frost' ? '#38BDF8' : '#FACC15',
                });
                for (const en of sim.enemies) {
                  if (en.hp <= 0) continue;
                  if (Math.hypot(en.x - eg.x, en.y - eg.y) <= smashR + en.radius) {
                    if (eg.theme === 'frost') en.freezeTimer = Math.max(en.freezeTimer || 0, 1.4);
                    damageEnemy(sim, en, smashDmg, null, 200, en.x - eg.x, en.y - eg.y, stats.greedMult);
                  }
                }
                for (let bi = sim.enemyBullets.length - 1; bi >= 0; bi--) {
                  if (Math.hypot(sim.enemyBullets[bi].x - eg.x, sim.enemyBullets[bi].y - eg.y) <= smashR * 0.78) {
                    sim.enemyBullets.splice(bi, 1);
                  }
                }
              }
            }
          }
        } else {
          fireWeapons(sim, dt, stats);
        }

        // Active Class Ultimate countdown & Finale triggers
        if (sim.plantedExcalibur) {
          sim.plantedExcalibur.life -= dt;
          if (sim.plantedExcalibur.life <= 0) sim.plantedExcalibur = null;
        }
        for (let szi = sim.sanctuaryZones.length - 1; szi >= 0; szi--) {
          const sz = sim.sanctuaryZones[szi];
          sz.life -= dt;
          if (sz.life <= 0) sim.sanctuaryZones.splice(szi, 1);
        }
        if (sim.ultActiveTimer > 0) {
          sim.ultActiveTimer -= dt;
          if (sim.ultActiveTimer <= 0) {
            sim.ultActiveTimer = 0;
            const cappedLv = Math.min(sim.player.level, 40);
            if (sim.raceClass === 'hunter') {
              // Moonless Execution finale: re-cut all Ult dash paths + slash every marked enemy on screen
              const finBase = (75 + cappedLv * 4) * stats.damageMult;
              triggerAbilityFlash(sim, 0.24, 0.22);
              sound.playExecute();
              const ultHitSet = new Set<number>();
              for (const seg of sim.hunterUltDashHistory) {
                runHunterShadowCutSegment(seg.x1, seg.y1, seg.x2, seg.y2, '#E879F9', false, ultHitSet);
                const segAng = Math.atan2(seg.y2 - seg.y1, seg.x2 - seg.x1);
                const segDist = Math.hypot(seg.x2 - seg.x1, seg.y2 - seg.y1);
                spawnPackVfx(
                  sim.packVfx,
                  'hunter_shadow_slash',
                  (seg.x1 + seg.x2) * 0.5,
                  (seg.y1 + seg.y2) * 0.5,
                  { angle: segAng, scaleX: Math.max(1.6, segDist / 96), scaleY: 2.0 }
                );
              }
              sim.hunterUltDashHistory = [];
              for (const en of sim.enemies) {
                if (en.hp > 0 && (en.huntMarks || 0) > 0 && Math.hypot(en.x - sim.player.x, en.y - sim.player.y) <= 720) {
                  sim.groundFx.push({
                    kind: 'shadow_cut',
                    x: en.x - 32,
                    y: en.y - 32,
                    x2: en.x + 32,
                    y2: en.y + 32,
                    radius: 9,
                    maxRadius: 9,
                    life: 0.28,
                    maxLife: 0.28,
                    color: '#38BDF8',
                  });
                  damageEnemy(
                    sim,
                    en,
                    finBase * (0.6 + (en.huntMarks || 1) * 0.35),
                    null,
                    65,
                    en.x - sim.player.x,
                    en.y - sim.player.y,
                    stats.greedMult,
                    true,
                    false,
                    true,
                    false,
                    '#38BDF8',
                    { forceCrit: true, isShadowSlash: true }
                  );
                }
              }
              spawnPackVfx(sim.packVfx, 'hunter_ult_moon', sim.player.x, sim.player.y, { scale: 2.6 });
              spawnSheetVfx(sim, 'moon_eclipse', sim.player.x, sim.player.y, {
                size: 245,
                life: 0.72,
                zOffset: 10,
              });
              addFloatingText(sim, sim.player.x, sim.player.y - 38, 'ปิดฉาก: ประหารจันทร์ดับ!', '#38BDF8', 1.32);
            } else if (sim.raceClass === 'saint') {
              // Judgment Pillar finale on Golem/Player
              const pxG = sim.golem ? sim.golem.x : sim.player.x;
              const pyG = sim.golem ? sim.golem.y : sim.player.y;
              const pRad = 250 * stats.areaMult;
              sim.elementalFields.push({
                kind: 'heaven_pillar',
                vfxKey: 'saint_judgement_pillar',
                x: pxG,
                y: pyG,
                vx: 0,
                vy: 0,
                radius: pRad,
                damage: (45 + cappedLv * 2.5) * stats.damageMult,
                color: '#FDE047',
                life: 1.4,
                maxLife: 1.4,
                tickTimer: 0.15,
                pullStrength: 0,
              });
              spawnPackVfx(sim.packVfx, 'saint_judgement_pillar', pxG, pyG, { scale: 2.8 });
              spawnSheetVfx(sim, 'holy_pillar', pxG, pyG, { size: 225, life: 0.65 });
              spawnSheetVfx(sim, 'sanctum_burst', pxG, pyG, { size: 210, life: 0.7, zOffset: 14 });
              const pBurst = (180 + cappedLv * 7) * stats.damageMult;
              for (const en of sim.enemies) {
                if (en.hp > 0 && Math.hypot(en.x - pxG, en.y - pyG) <= pRad + en.radius) {
                  en.hardFreezeTimer = Math.max(en.hardFreezeTimer || 0, en.isBoss ? 0.5 : 1.2);
                  damageEnemy(sim, en, pBurst, null, 240, en.x - pxG, en.y - pyG, stats.greedMult);
                }
              }
              sound.playBossChest();
              addFloatingText(sim, sim.player.x, sim.player.y - 38, 'ปิดฉาก: เสาพิพากษา!', '#FDE047', 1.3);
            } else if (sim.raceClass === 'knight') {
              // Start 1.0s Finale "สวรรค์พิพากษา" (blades fly up -> 8 circles -> 8 slam + Rift dmg -> octagon burst -> feathers)
              sim.knightUltFinaleTimer = 1.0;
              sim.knightUltFinaleStage = 0;
              sim.knightUltFinaleX = sim.player.x;
              sim.knightUltFinaleY = sim.player.y;
              sim.knightUltBgPillars = [];
              for (const b of sim.knightSacredBlades) {
                b.state = 'finale_up';
              }
            } else if (sim.raceClass === 'demon_lord') {
              // Inferno Meteor finale: 3x sum of active Hellfire stacks across burning enemies
              let sumBurn = 0;
              for (const en of sim.enemies) {
                if (en.hp > 0 && (en.hellfireStacks || 0) > 0) {
                  sumBurn += (en.hellfireStacks || 0) * (4 + cappedLv * 0.4) * 3 * stats.damageMult;
                }
              }
              const meteorDmg = Math.max((160 + cappedLv * 6) * stats.damageMult, Math.min(sumBurn * 3, (1200 + cappedLv * 35) * stats.damageMult));
              sim.groundFx.push({
                kind: 'explosion',
                x: sim.player.x,
                y: sim.player.y,
                radius: 30,
                maxRadius: 340,
                life: 0.55,
                maxLife: 0.55,
                color: '#EF4444',
              });
              spawnVfx(sim.vfx, 'explosion_hellfire', sim.player.x, sim.player.y, { scale: 2.4 });
              triggerWeaponHitShake(sim, 0.28, 8);
              triggerAbilityFlash(sim, 0.26, 0.25);
              sound.playBossChest();
              for (const en of sim.enemies) {
                if (en.hp > 0 && Math.hypot(en.x - sim.player.x, en.y - sim.player.y) <= 340 + en.radius) {
                  damageEnemy(sim, en, meteorDmg, null, 280, en.x - sim.player.x, en.y - sim.player.y, stats.greedMult);
                }
              }
              addFloatingText(sim, sim.player.x, sim.player.y - 38, 'ปิดฉาก: อุกกาบาตอเวจี!', '#F97316', 1.35);
            } else if (sim.raceClass === 'vampire_lord') {
              // Crimson Twilight finale: detonate all Bleeding mobs across the screen
              let totalConsumed = 0;
              const detBase = (35 + cappedLv * 1.6) * stats.damageMult;
              for (const en of sim.enemies) {
                if (en.hp > 0 && (en.bleedStacks || 0) > 0 && Math.hypot(en.x - sim.player.x, en.y - sim.player.y) <= 680) {
                  const st = en.bleedStacks || 0;
                  totalConsumed += st;
                  en.bleedStacks = 0;
                  en.bleedTimer = 0;
                  sim.groundFx.push({
                    kind: 'explosion',
                    x: en.x,
                    y: en.y,
                    radius: 10,
                    maxRadius: 65,
                    life: 0.28,
                    maxLife: 0.28,
                    color: '#FB7185',
                  });
                  spawnVfx(sim.vfx, 'blood_burst', en.x, en.y, { scale: 1.25 });
                  damageEnemy(sim, en, st * detBase, null, 120, en.x - sim.player.x, en.y - sim.player.y, stats.greedMult, false, false, true);
                }
              }
              if (totalConsumed > 0) {
                applyLeechHeal(sim, totalConsumed * sim.player.maxHp * 0.005);
              }
              sound.playBossChest();
              addFloatingText(sim, sim.player.x, sim.player.y - 38, 'ปิดฉาก: สนธยาโลหิต!', '#FB7185', 1.35);
            } else if (sim.raceClass === 'seven_sins') {
              // Judgment Day of Sins finale: 7 beams converging + Rainbow-Black shockwave
              const contracted = sim.sins.filter((it) => it.active).length;
              for (const sinEnt of sim.sins) {
                sim.groundFx.push({
                  kind: 'beam',
                  x: sinEnt.x,
                  y: sinEnt.y,
                  x2: sim.player.x,
                  y2: sim.player.y,
                  radius: 12,
                  maxRadius: 12,
                  life: 0.35,
                  maxLife: 0.35,
                  color: SEVEN_SINS[sinEnt.sinId].color,
                });
              }
              const jDmg = (140 + contracted * 65 + cappedLv * 5) * stats.damageMult;
              sim.groundFx.push({
                kind: 'shockwave',
                x: sim.player.x,
                y: sim.player.y,
                radius: 30,
                maxRadius: 480,
                life: 0.52,
                maxLife: 0.52,
                color: '#E879F9',
              });
              triggerWeaponHitShake(sim, 0.26, 7.5);
              triggerAbilityFlash(sim, 0.25, 0.22);
              sound.playBossChest();
              for (const en of sim.enemies) {
                if (en.hp > 0 && Math.hypot(en.x - sim.player.x, en.y - sim.player.y) <= 480 + en.radius) {
                  damageEnemy(sim, en, jDmg, null, 280, en.x - sim.player.x, en.y - sim.player.y, stats.greedMult);
                }
              }
              addFloatingText(sim, sim.player.x, sim.player.y - 38, 'ปิดฉาก: วันพิพากษาแห่งบาป!', '#E879F9', 1.35);
            }
          }
        }

        // Class Evolution Active Skills & Summons
        if (sim.raceClass === 'saint') {
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
                spawnSheetVfx(sim, 'sanctum_burst', gm.x, gm.y, { size: 165, life: 0.6, zOffset: 12 });
                addFloatingText(sim, gm.x, gm.y - 34, 'โกเล็มคืนชีพ!', '#FDE047', 1.15);
              }
            } else {
              const distFromPlayer = Math.hypot(gm.x - sim.player.x, gm.y - sim.player.y);
              let target: EnemyEntity | null = null;
              let bestD2 = 380 * 380;
              if (distFromPlayer <= 600) {
                for (const en of sim.enemies) {
                  if (en.hp <= 0) continue;
                  const d2 = (en.x - gm.x) ** 2 + (en.y - gm.y) ** 2;
                  if (d2 < bestD2) {
                    bestD2 = d2;
                    target = en;
                  }
                }
              }
              const goalX = distFromPlayer > 600
                ? sim.player.x
                : target
                  ? target.x
                  : sim.player.x + Math.cos(sim.orbitAngle * 0.45) * 68;
              const goalY = distFromPlayer > 600
                ? sim.player.y
                : target
                  ? target.y
                  : sim.player.y + Math.sin(sim.orbitAngle * 0.45) * 68;
              const gdx = goalX - gm.x;
              const gdy = goalY - gm.y;
              const gd = Math.hypot(gdx, gdy);
              if (gd > 30) {
                // Never teleport! If >600px away, visibly runs back at 2x speed
                const gSpd = distFromPlayer > 600 ? 510 : target ? 255 : 225;
                gm.x += (gdx / gd) * gSpd * dt;
                gm.y += (gdy / gd) * gSpd * dt;
                gm.walkCycle += dt * (distFromPlayer > 600 ? 16 : 9);
              }
              if (gm.smashingTimer > 0) gm.smashingTimer -= dt;
              gm.smashCooldown -= dt;
              if (gm.smashCooldown <= 0 && target && Math.sqrt(bestD2) <= 135 + target.radius) {
                gm.smashCooldown = 0.85;
                gm.smashingTimer = 0.32;
                const smashR = 148 * stats.areaMult;
                const smashDmg = (95 + Math.min(sim.player.level, 40) * 4.5) * stats.damageMult;
                sim.groundFx.push({
                  kind: 'shockwave',
                  x: gm.x,
                  y: gm.y,
                  radius: 22,
                  maxRadius: smashR,
                  life: 0.34,
                  maxLife: 0.34,
                  color: '#FDE047',
                });
                spawnPackVfx(sim.packVfx, 'saint_golem_taunt', gm.x, gm.y, {
                  groundPlane: true,
                  scale: Math.max(1.6, (smashR * 2.0) / 128),
                });
                spawnSheetVfx(sim, 'ground_slam', gm.x, gm.y, {
                  size: Math.max(185, smashR * 1.85),
                  life: 0.45,
                  upright: false,
                });
                spawnParticles(sim, gm.x, gm.y, '#FDE047', 16, 170);
                for (const en of sim.enemies) {
                  if (en.hp <= 0) continue;
                  if (Math.hypot(en.x - gm.x, en.y - gm.y) <= smashR + en.radius) {
                    en.freezeTimer = Math.max(en.freezeTimer || 0, 0.55);
                    damageEnemy(sim, en, smashDmg, null, 280, en.x - gm.x, en.y - gm.y, stats.greedMult);
                  }
                }
                for (let bi = sim.enemyBullets.length - 1; bi >= 0; bi--) {
                  const b = sim.enemyBullets[bi];
                  if (Math.hypot(b.x - gm.x, b.y - gm.y) <= smashR * 0.85) {
                    sim.enemyBullets.splice(bi, 1);
                  }
                }
              }

              // Seraph Oath Ult (every 1s) or Ascended Saint (every 3s): 8-way piercing light spears!
              if (sim.ultActiveTimer > 0 || sim.ultAscended) {
                gm.spearTimer -= dt;
                if (gm.spearTimer <= 0) {
                  gm.spearTimer = sim.ultActiveTimer > 0 ? 1.0 : 3.0;
                  const spearDmg = (68 + Math.min(sim.player.level, 40) * 3.0) * stats.damageMult;
                  const spd = 500 * stats.projSpeedMult;
                  for (let k = 0; k < 8; k++) {
                    const a = (k * Math.PI * 2) / 8 + sim.orbitAngle * 0.25;
                    sim.projectiles.push({
                      weaponId: 'spear',
                      evolved: true,
                      fromClassSkill: true,
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
        } else if (sim.raceClass === 'hunter') {
          // Process delayed Shadow Echo re-slashes
          for (let ei = sim.hunterEchoes.length - 1; ei >= 0; ei--) {
            const echo = sim.hunterEchoes[ei];
            if (!echo.triggered) {
              echo.delayTimer -= dt;
              if (echo.delayTimer <= 0) {
                echo.triggered = true;
                const echoHits = new Set<number>();
                runHunterShadowCutSegment(echo.x1, echo.y1, echo.x2, echo.y2, '#818CF8', false, echoHits);
                const eAng = Math.atan2(echo.y2 - echo.y1, echo.x2 - echo.x1);
                const eLen = Math.hypot(echo.x2 - echo.x1, echo.y2 - echo.y1);
                spawnPackVfx(
                  sim.packVfx,
                  'hunter_shadow_slash',
                  (echo.x1 + echo.x2) * 0.5,
                  (echo.y1 + echo.y2) * 0.5,
                  { angle: eAng, scaleX: Math.max(1.6, eLen / 96), scaleY: 1.9 }
                );
                spawnSheetVfx(
                  sim,
                  'shadow_slash',
                  (echo.x1 + echo.x2) * 0.5,
                  (echo.y1 + echo.y2) * 0.5,
                  { size: 160, life: 0.28, angle: eAng, zOffset: 10 }
                );
              }
            } else {
              echo.activeTimer -= dt;
              if (echo.activeTimer <= 0) {
                sim.hunterEchoes.splice(ei, 1);
              }
            }
          }

          sim.classSkillTimer -= dt;
          if (sim.classSkillTimer <= 0) {
            sim.classSkillTimer = 1.55 * Math.max(0.7, stats.cooldownMult);
            let nearest: EnemyEntity | null = null;
            let bestScore = Infinity;
            for (const en of sim.enemies) {
              if (en.hp <= 0) continue;
              const d = Math.hypot(en.x - sim.player.x, en.y - sim.player.y);
              if (d <= 540) {
                // Prioritize lowest Hunt Marks first, breaking ties by closest enemy
                const score = (en.huntMarks || 0) * 1000 + d;
                if (score < bestScore) {
                  bestScore = score;
                  nearest = en;
                }
              }
            }
            const aim = nearest
              ? Math.atan2(nearest.y - sim.player.y, nearest.x - sim.player.x)
              : Math.atan2(sim.player.facingY, sim.player.facingX);
            const arrowDmg = (50 + Math.min(sim.player.level, 40) * 2.2) * stats.damageMult;
            const fireVolley = (ox: number, oy: number, dmgScale = 1) => {
              for (let k = -1; k <= 1; k++) {
                const a = aim + k * 0.14;
                const spd = 620 * stats.projSpeedMult;
                sim.projectiles.push({
                  weaponId: 'dagger',
                  evolved: true,
                  customKind: 'arrow',
                  fromClassSkill: true,
                  homing: true,
                  x: ox,
                  y: oy,
                  vx: Math.cos(a) * spd,
                  vy: Math.sin(a) * spd,
                  radius: 13,
                  damage: arrowDmg * dmgScale,
                  knockback: 70,
                  pierce: 4,
                  life: 1.35,
                  maxLife: 1.35,
                  hitIds: new Set(),
                  rotation: a,
                  color: '#34D399',
                });
              }
            };
            fireVolley(sim.player.x, sim.player.y, 1.0);
            if (sim.ultAscended) {
              fireVolley(sim.player.x - sim.player.facingY * 26, sim.player.y + sim.player.facingX * 26, 0.75);
            }
          }
        } else if (sim.raceClass === 'knight') {
          // 0.15s Parry Counter simultaneous blade strike
          if (sim.knightParryCounterDelayTimer > 0) {
            sim.knightParryCounterDelayTimer = Math.max(0, sim.knightParryCounterDelayTimer - dt);
            if (sim.knightParryCounterDelayTimer <= 0) {
              performKnightSlash(2.5, true);
            }
          }

          // Base Knight idle shoulder light mote (every 0.8s) & foot step dust
          const playerSpeedMag = Math.hypot(sim.player.vx, sim.player.vy);
          if (playerSpeedMag <= 5 && sim.dashTimer <= 0) {
            sim.knightIdleMoteTimer -= dt;
            if (sim.knightIdleMoteTimer <= 0) {
              sim.knightIdleMoteTimer = 0.8;
              const shX = sim.player.x + (sim.player.facingX >= 0 ? -6 : 6);
              spawnKnightParticles(sim, shX, sim.player.y, '#fffbe0', 1, 18, {
                isUpward: true,
                vyBias: -24,
                radius: 1.6,
                life: 0.7,
                zOffset: 24,
                glow: true,
              });
            }
          } else if (sim.dashTimer <= 0) {
            sim.knightStepDustAccum += dt * (4 + 7.5 * sim.player.moveSpeedRatio);
            if (sim.knightStepDustAccum >= Math.PI) {
              sim.knightStepDustAccum -= Math.PI;
              spawnKnightParticles(sim, sim.player.x, sim.player.y + 4, '#cbd5e1', 2, 26, {
                isUpward: true,
                vyBias: -14,
                radius: 1.5,
                life: 0.28,
                zOffset: 2,
              });
            }
          }

          // Aegis Stance: +1 armor per enemy within 100px (max +8)
          let aegisCount = 0;
          for (const en of sim.enemies) {
            if (en.hp > 0 && Math.hypot(en.x - sim.player.x, en.y - sim.player.y) <= 100 + en.radius) {
              aegisCount += 1;
              if (aegisCount >= 8) break;
            }
          }
          sim.knightAegisBonus = aegisCount;

          // Excalibur Descent Intro (1.2s) & Active Phase (8.8s)
          if (sim.ultActiveTimer > 0) {
            const ultElapsed = Math.max(0, (sim.ultActiveMax || 10) - sim.ultActiveTimer);
            const cappedLvU = Math.min(sim.player.level, 40);
            if (ultElapsed >= 0.35 && sim.knightUltIntroPhase < 1) {
              sim.knightUltIntroPhase = 1;
            }
            if (ultElapsed >= 0.55 && sim.knightUltIntroPhase < 2) {
              sim.knightUltIntroPhase = 2;
              sound.playExcaliburDescent();
            }
            if (ultElapsed >= 0.85 && sim.knightUltIntroPhase < 3) {
              sim.knightUltIntroPhase = 3;
              sim.hitstopTimer = Math.max(sim.hitstopTimer, 0.08);
              sim.knightFullScreenFlashTimer = 0.03;
              triggerWeaponHitShake(sim, 0.35, 7.2);
              const exX = sim.knightUltIntroX;
              const exY = sim.knightUltIntroY;
              sim.plantedExcalibur = { x: exX, y: exY, life: 0.2, maxLife: 0.2 };
              sim.groundFx.push({
                kind: 'shockwave',
                x: exX,
                y: exY,
                radius: 26,
                maxRadius: 260,
                life: 0.42,
                maxLife: 0.42,
                color: '#ffd75e',
              });
              spawnSheetVfx(sim, 'holy_smite', exX, exY, { size: 240, life: 0.52 });
              spawnSheetVfx(sim, 'ground_slam', exX, exY, {
                size: 280,
                life: 0.55,
                upright: false,
              });
              spawnKnightParticles(sim, exX, exY, '#94a3b8', 16, 175, {
                isUpward: true,
                shape: 'diamond',
                secondaryColor: '#ffd75e',
                radius: 3.2,
                life: 0.48,
                zOffset: 6,
                vyBias: -85,
              });
              const descentDmg = (180 + cappedLvU * 6 + stats.armor * 5) * stats.damageMult;
              for (const en of sim.enemies) {
                if (en.hp > 0 && Math.hypot(en.x - exX, en.y - exY) <= 260 + en.radius) {
                  damageEnemy(sim, en, descentDmg, null, 320, en.x - exX, en.y - exY, stats.greedMult);
                }
              }
            }
            if (ultElapsed >= 1.2) {
              sim.knightUltBgPillarCd -= dt;
              if (sim.knightUltBgPillarCd <= 0) {
                sim.knightUltBgPillarCd = 0.28 + Math.random() * 0.25;
                if (sim.knightUltBgPillars.length < 7) {
                  const life = 0.65 + Math.random() * 0.35;
                  sim.knightUltBgPillars.push({
                    x: Math.random() * Math.max(800, window.innerWidth),
                    width: 6 + Math.round(Math.random() * 10),
                    alpha: 0.08 + Math.random() * 0.1,
                    life,
                    maxLife: life,
                  });
                }
              }
            }
          }
          for (let pi = sim.knightUltBgPillars.length - 1; pi >= 0; pi--) {
            sim.knightUltBgPillars[pi].life -= dt;
            if (sim.knightUltBgPillars[pi].life <= 0) sim.knightUltBgPillars.splice(pi, 1);
          }

          // Ult Finale Sequence: "สวรรค์พิพากษา" (1.0s)
          if (sim.knightUltFinaleTimer > 0) {
            sim.knightUltFinaleTimer = Math.max(0, sim.knightUltFinaleTimer - dt);
            const prog = 1 - sim.knightUltFinaleTimer;
            const cappedLvF = Math.min(sim.player.level, 40);
            if (prog >= 0.3 && sim.knightUltFinaleStage < 1) {
              sim.knightUltFinaleStage = 1;
            }
            if (prog >= 0.55 && sim.knightUltFinaleStage < 2) {
              sim.knightUltFinaleStage = 2;
              for (const b of sim.knightSacredBlades) {
                b.state = 'finale_planted';
              }
              triggerWeaponHitShake(sim, 0.38, 9.2);
              sound.playHolyBell();
              const fxX = sim.knightUltFinaleX;
              const fxY = sim.knightUltFinaleY;
              const aim = Math.atan2(sim.player.facingY, sim.player.facingX);
              const x1 = fxX - Math.cos(aim) * 200;
              const y1 = fxY - Math.sin(aim) * 200;
              const x2 = fxX + Math.cos(aim) * 900;
              const y2 = fxY + Math.sin(aim) * 900;
              sim.groundFx.push({
                kind: 'judgement_rift',
                x: x1,
                y: y1,
                x2,
                y2,
                radius: 42,
                maxRadius: 42,
                life: 0.45,
                maxLife: 0.45,
                color: '#ffd75e',
              });
              spawnSheetVfx(sim, 'holy_smite', fxX, fxY, { size: 260, life: 0.55 });
              spawnSheetVfx(sim, 'ground_slam', fxX, fxY, {
                size: 290,
                life: 0.58,
                upright: false,
              });
              const dxB = x2 - x1;
              const dyB = y2 - y1;
              const len2 = dxB * dxB + dyB * dyB || 1;
              const riftDmg = (220 + cappedLvF * 8 + stats.armor * 6) * stats.damageMult;
              for (const en of sim.enemies) {
                if (en.hp <= 0) continue;
                const tProj = Math.max(0, Math.min(1, ((en.x - x1) * dxB + (en.y - y1) * dyB) / len2));
                const cx = x1 + tProj * dxB;
                const cy = y1 + tProj * dyB;
                if (Math.hypot(en.x - cx, en.y - cy) <= 75 + en.radius || Math.hypot(en.x - fxX, en.y - fxY) <= 190 + en.radius) {
                  damageEnemy(sim, en, riftDmg, null, 300, dxB, dyB, stats.greedMult);
                }
              }
              addFloatingText(sim, fxX, fxY - 40, 'ปิดฉาก: สวรรค์พิพากษา!', '#ffd75e', 1.38, {
                bounceOutline: true,
              });
            }
            if (prog >= 0.7 && sim.knightUltFinaleStage < 3) {
              sim.knightUltFinaleStage = 3;
              sound.playKnightFinaleChord();
            }
            if ((prog >= 0.95 || sim.knightUltFinaleTimer <= 0) && sim.knightUltFinaleStage < 4) {
              sim.knightUltFinaleStage = 4;
              for (let k = 0; k < 8; k++) {
                const a = (k * Math.PI * 2) / 8;
                spawnKnightParticles(
                  sim,
                  sim.knightUltFinaleX + Math.cos(a) * 135,
                  sim.knightUltFinaleY + Math.sin(a) * 135,
                  '#fffbe0',
                  3,
                  42,
                  { isUpward: true, secondaryColor: '#ffd75e', radius: 2.2, life: 0.65, vyBias: -45, glow: true }
                );
              }
              for (const b of sim.knightSacredBlades) {
                b.state = 'orbit';
              }
            }
          }

          // Periodic Taunt (ยั่วยุ 300px every 10s) with 0.20s windup raising shield
          if (sim.knightTauntWindup > 0) {
            sim.knightTauntWindup = Math.max(0, sim.knightTauntWindup - dt);
            if (sim.knightTauntWindup <= 0) {
              sim.knightTauntTimer = 10.0;
              const tauntRadius = 300;
              sound.playTauntGong();
              triggerWeaponHitShake(sim, 0.16, 4.5);
              spawnPackVfx(sim.packVfx, 'knight_taunt', sim.player.x, sim.player.y, {
                groundPlane: true,
                scale: 3.1,
              });
              spawnSheetVfx(sim, 'ground_slam', sim.player.x, sim.player.y, {
                size: 260,
                life: 0.52,
                upright: false,
              });
              sim.knightTauntCracks.push({
                x: sim.player.x,
                y: sim.player.y,
                life: 0.9,
                maxLife: 0.9,
              });
              let tauntedCount = 0;
              for (const en of sim.enemies) {
                if (en.hp <= 0) continue;
                if (Math.hypot(en.x - sim.player.x, en.y - sim.player.y) <= tauntRadius + en.radius) {
                  en.knightTauntTimer = 3.0;
                  en.judgementTimer = 3.0;
                  en.knightTauntBangTimer = 0.5;
                  tauntedCount++;
                }
              }
              if (tauntedCount > 0) {
                addFloatingText(sim, sim.player.x, sim.player.y - 34, `ยั่วยุ! (${tauntedCount})`, '#ffd75e', 1.15);
              }
            }
          } else {
            sim.knightTauntTimer -= dt;
            if (sim.knightTauntTimer <= 0) {
              sim.knightTauntWindup = 0.2;
            }
          }
          for (let ci = sim.knightTauntCracks.length - 1; ci >= 0; ci--) {
            sim.knightTauntCracks[ci].life -= dt;
            if (sim.knightTauntCracks[ci].life <= 0) sim.knightTauntCracks.splice(ci, 1);
          }

          // Sacred Blades array sync & animation state machine (windup 0.12s -> striking 0.15s -> returning 0.30s -> 100° fan)
          const targetPermBlades = sim.ultAscended ? 5 : 3;
          let permCount = sim.knightSacredBlades.filter((b) => b.tempLife < 0).length;
          while (permCount < targetPermBlades && sim.knightSacredBlades.length < 8) {
            sim.knightSacredBlades.push({
              id: sim.knightNextBladeId++,
              x: sim.player.x,
              y: sim.player.y,
              homeAngleOffset: 0,
              state: 'orbit',
              targetId: null,
              targetX: sim.player.x,
              targetY: sim.player.y,
              tempLife: -1,
              slashProgress: 0,
              trail: [],
            });
            permCount++;
          }
          for (let bi = sim.knightSacredBlades.length - 1; bi >= 0; bi--) {
            const b = sim.knightSacredBlades[bi];
            if (b.tempLife > 0) {
              b.tempLife -= dt;
              if (b.tempLife <= 0) {
                sim.knightSacredBlades.splice(bi, 1);
              }
            }
          }
          const inKnightUltActive = sim.ultActiveTimer > 0 && 10 - sim.ultActiveTimer >= 1.2;
          if (inKnightUltActive && sim.knightSacredBlades.length < 8) {
            while (sim.knightSacredBlades.length < 8) {
              sim.knightSacredBlades.push({
                id: sim.knightNextBladeId++,
                x: sim.player.x,
                y: sim.player.y,
                homeAngleOffset: 0,
                state: 'orbit',
                targetId: null,
                targetX: sim.player.x,
                targetY: sim.player.y,
                tempLife: 0.25,
                slashProgress: 0,
                trail: [],
              });
            }
          }
          if (inKnightUltActive) {
            for (const b of sim.knightSacredBlades) {
              if (b.tempLife > 0 && b.tempLife < 0.2) b.tempLife = 0.25;
            }
          }

          const backAngle = Math.atan2(-sim.player.facingY, -sim.player.facingX);
          const fanSpread = (100 * Math.PI) / 180; // 100 degrees behind hero
          let playedBladeSoundThisTick = false;
          for (let i = 0; i < sim.knightSacredBlades.length; i++) {
            const b = sim.knightSacredBlades[i];
            if ((b.whiteFlash || 0) > 0) b.whiteFlash = Math.max(0, (b.whiteFlash || 0) - dt);
            const t = sim.knightSacredBlades.length <= 1 ? 0.5 : i / (sim.knightSacredBlades.length - 1);
            const homeAngle = inKnightUltActive
              ? sim.orbitAngle * 1.45 + (i * Math.PI * 2) / Math.max(1, sim.knightSacredBlades.length)
              : backAngle + (t - 0.5) * fanSpread;
            const homeDist = inKnightUltActive ? 58 : 34;
            b.homeAngleOffset = homeAngle;
            const homeX = sim.player.x + Math.cos(homeAngle) * homeDist;
            const homeY = sim.player.y + Math.sin(homeAngle) * homeDist;

            if (b.state === 'spawning') {
              b.spawnTimer = Math.max(0, (b.spawnTimer ?? 0.45) - dt);
              b.x += (homeX - b.x) * Math.min(1, dt * 10);
              b.y += (homeY - b.y) * Math.min(1, dt * 10);
              if (b.spawnTimer <= 0) b.state = 'orbit';
            } else if (b.state === 'windup') {
              b.stateTimer = Math.max(0, (b.stateTimer ?? 0.12) - dt);
              b.x += (homeX - b.x) * Math.min(1, dt * 14);
              b.y += (homeY - b.y) * Math.min(1, dt * 14);
              if (b.stateTimer <= 0) {
                b.state = 'striking';
                b.stateTimer = 0.15;
                b.startX = b.x;
                b.startY = b.y;
                b.trail = [];
                if (!playedBladeSoundThisTick) {
                  playedBladeSoundThisTick = true;
                  sound.playKnightBladeSlash();
                }
              }
            } else if (b.state === 'striking') {
              b.stateTimer = Math.max(0, (b.stateTimer ?? 0.15) - dt);
              const prog = Math.max(0, Math.min(1, 1 - b.stateTimer / 0.15));
              const sx = b.startX ?? homeX;
              const sy = b.startY ?? homeY;
              b.x = sx + (b.targetX - sx) * prog;
              b.y = sy + (b.targetY - sy) * prog;
              if (!b.trail) b.trail = [];
              b.trail.push({ x: b.x, y: b.y });
              if (b.trail.length > 6) b.trail.shift();
              if (b.stateTimer <= 0) {
                spawnPackVfx(sim.packVfx, 'knight_blade_slash', b.targetX, b.targetY, {
                  angle: Math.atan2(b.targetY - sy, b.targetX - sx),
                  scale: inKnightUltActive ? 1.5 : 1.1,
                });
                if (b.heavyHit) {
                  sim.hitstopTimer = Math.max(sim.hitstopTimer, 0.03);
                  b.heavyHit = false;
                }
                b.state = 'returning';
                b.stateTimer = 0.3;
                b.startX = b.x;
                b.startY = b.y;
                b.trail = [];
              }
            } else if (b.state === 'returning') {
              b.stateTimer = Math.max(0, (b.stateTimer ?? 0.3) - dt);
              const prog = Math.max(0, Math.min(1, 1 - b.stateTimer / 0.3));
              const sx = b.startX ?? b.targetX;
              const sy = b.startY ?? b.targetY;
              const dxR = homeX - sx;
              const dyR = homeY - sy;
              const lenR = Math.hypot(dxR, dyR) || 1;
              const arcSign = i % 2 === 0 ? 1 : -1;
              const perpOffset = Math.sin(prog * Math.PI) * 28 * arcSign;
              b.x = sx + dxR * prog + (-dyR / lenR) * perpOffset;
              b.y = sy + dyR * prog + (dxR / lenR) * perpOffset;
              if (b.stateTimer <= 0) {
                b.state = 'orbit';
              }
            } else if (b.state === 'orbit') {
              b.x += (homeX - b.x) * Math.min(1, dt * 18);
              b.y += (homeY - b.y) * Math.min(1, dt * 18);
            }
          }

          sim.classSkillTimer -= dt;
          if (sim.classSkillTimer <= 0) {
            sim.classSkillTimer = 1.8 * Math.max(0.75, stats.cooldownMult);
            performKnightSlash(1.0, false);
          }
        } else if (sim.raceClass === 'demon_lord') {
          const cappedLv = Math.min(sim.player.level, 40);
          // 100+ Soul Ledger: Leave glowing hellfire flame puddles while walking!
          if (sim.demonSoulKills >= 100 && Math.hypot(sim.player.vx, sim.player.vy) > 10) {
            sim.demonFlameTrailTimer -= dt;
            if (sim.demonFlameTrailTimer <= 0) {
              sim.demonFlameTrailTimer = sim.ultAscended ? 0.28 : 0.42;
              sim.elementalFields.push({
                kind: 'pool',
                x: sim.player.x,
                y: sim.player.y,
                vx: 0,
                vy: 0,
                radius: (sim.ultAscended ? 68 : 48) * stats.areaMult,
                damage: (22 + cappedLv * 1.4) * stats.damageMult,
                color: '#F97316',
                life: 2.0,
                maxLife: 2.0,
                tickTimer: 0.2,
                pullStrength: 0,
              });
            }
          }
          // 300+ Soul Ledger: Hellfire Rain every 4s on dense enemy cluster!
          if (sim.demonSoulKills >= 300) {
            sim.demonRainTimer -= dt;
            if (sim.demonRainTimer <= 0) {
              sim.demonRainTimer = 4.0;
              let bestCluster: EnemyEntity | null = null;
              let bestNearby = -1;
              for (const en of sim.enemies) {
                if (en.hp <= 0 || Math.hypot(en.x - sim.player.x, en.y - sim.player.y) > 480) continue;
                let count = 0;
                for (const other of sim.enemies) {
                  if (other.hp > 0 && Math.hypot(other.x - en.x, other.y - en.y) <= 130) count++;
                }
                if (count > bestNearby) {
                  bestNearby = count;
                  bestCluster = en;
                }
              }
              if (bestCluster) {
                const rainDmg = (78 + cappedLv * 3.4) * stats.damageMult;
                const rx = bestCluster.x;
                const ry = bestCluster.y;
                sim.groundFx.push({
                  kind: 'explosion',
                  x: rx,
                  y: ry,
                  radius: 18,
                  maxRadius: 125 * stats.areaMult,
                  life: 0.4,
                  maxLife: 0.4,
                  color: '#EA580C',
                });
                spawnVfx(sim.vfx, 'explosion_hellfire', rx, ry, { scale: (125 * stats.areaMult) / 55 });
                spawnParticles(sim, rx, ry, '#F97316', 18, 190);
                for (const en of sim.enemies) {
                  if (en.hp > 0 && Math.hypot(en.x - rx, en.y - ry) <= 125 * stats.areaMult + en.radius) {
                    en.hellfireStacks = Math.min(5, (en.hellfireStacks || 0) + 2);
                    en.hellfireTimer = 3.0;
                    if (en.hellfireTickTimer === undefined) en.hellfireTickTimer = 0.4;
                    damageEnemy(sim, en, rainDmg, null, 110, en.x - rx, en.y - ry, stats.greedMult);
                  }
                }
                hitWorldTargetsInCircle(sim, rx, ry, 125 * stats.areaMult, rainDmg, stats);
              }
            }
          }
          // Update active Demon Imps (homing kamikaze fire bombs!)
          for (let di = sim.demonImps.length - 1; di >= 0; di--) {
            const imp = sim.demonImps[di];
            imp.life -= dt;
            if (imp.life <= 0) {
              sim.demonImps.splice(di, 1);
              continue;
            }
            let target: EnemyEntity | null = null;
            let bestD2 = 420 * 420;
            for (const en of sim.enemies) {
              if (en.hp <= 0) continue;
              const d2 = (en.x - imp.x) ** 2 + (en.y - imp.y) ** 2;
              if (d2 < bestD2) {
                bestD2 = d2;
                target = en;
              }
            }
            if (target) {
              const ang = Math.atan2(target.y - imp.y, target.x - imp.x);
              imp.vx = Math.cos(ang) * 335;
              imp.vy = Math.sin(ang) * 335;
              imp.x += imp.vx * dt;
              imp.y += imp.vy * dt;
              if (Math.hypot(target.x - imp.x, target.y - imp.y) <= target.radius + 16) {
                sim.groundFx.push({
                  kind: 'explosion',
                  x: imp.x,
                  y: imp.y,
                  radius: 10,
                  maxRadius: 72,
                  life: 0.25,
                  maxLife: 0.25,
                  color: '#F97316',
                });
                spawnVfx(sim.vfx, 'explosion_hellfire', imp.x, imp.y, { scale: 0.95 });
                spawnParticles(sim, imp.x, imp.y, '#FACC15', 10, 140);
                for (const en of sim.enemies) {
                  if (en.hp > 0 && Math.hypot(en.x - imp.x, en.y - imp.y) <= 72 + en.radius) {
                    damageEnemy(sim, en, imp.damage, null, 90, en.x - imp.x, en.y - imp.y, stats.greedMult);
                  }
                }
                hitWorldTargetsInCircle(sim, imp.x, imp.y, 72, imp.damage, stats);
                sim.demonImps.splice(di, 1);
              }
            } else {
              const ang = sim.orbitAngle * 1.4 + di;
              imp.x += (sim.player.x + Math.cos(ang) * 65 - imp.x) * 4 * dt;
              imp.y += (sim.player.y + Math.sin(ang) * 65 - imp.y) * 4 * dt;
            }
          }
        } else if (sim.raceClass === 'vampire_lord') {
          if (sim.ultActiveTimer > 0) {
            // Free Bat Swarm every 1.5s + Blood Spear rain on Bleeding enemies
            sim.vampireUltPulseTimer -= dt;
            if (sim.vampireUltPulseTimer <= 0) {
              sim.vampireUltPulseTimer = 1.5;
              sim.batSwarmTimer = Math.max(sim.batSwarmTimer, 1.2);
              sim.batSwarmTickTimer = 0.04;
              sim.groundFx.push({
                kind: 'shockwave',
                x: sim.player.x,
                y: sim.player.y,
                radius: 16,
                maxRadius: 120,
                life: 0.3,
                maxLife: 0.3,
                color: '#E11D48',
              });
            }
            sim.vampireUltSpearTimer -= dt;
            if (sim.vampireUltSpearTimer <= 0) {
              sim.vampireUltSpearTimer = 0.65;
              const bleedingTargets = sim.enemies.filter(
                (en) => en.hp > 0 && (en.bleedStacks || 0) > 0 && Math.hypot(en.x - sim.player.x, en.y - sim.player.y) <= 460
              );
              const cappedLv = Math.min(sim.player.level, 40);
              const spearDmg = (68 + cappedLv * 2.8) * stats.damageMult;
              for (let k = 0; k < Math.min(4, bleedingTargets.length); k++) {
                const target = bleedingTargets[Math.floor(Math.random() * bleedingTargets.length)];
                sim.groundFx.push({
                  kind: 'beam',
                  x: target.x + 12,
                  y: target.y - 180,
                  x2: target.x,
                  y2: target.y,
                  radius: 8,
                  maxRadius: 8,
                  life: 0.24,
                  maxLife: 0.24,
                  color: '#FB7185',
                });
                damageEnemy(sim, target, spearDmg, null, 70, 0, 0, stats.greedMult, false, false, true);
              }
            }
          }
        } else if (sim.raceClass === 'seven_sins') {
          const cappedLv = Math.min(sim.player.level, 40);
          // Sovereign of the Eighth Sin Ascension: every 10s summon random inactive Sin for 5s
          if (sim.ultAscended && sim.ultActiveTimer <= 0) {
            sim.eighthSinTimer -= dt;
            if (sim.eighthSinTimer <= 0) {
              sim.eighthSinTimer = 10.0;
              const inactiveIds = SIN_ORDER.filter((id) => {
                const ex = sim.sins.find((s) => s.sinId === id);
                return !ex || (!ex.active && ex.tempSummonTimer <= 0);
              });
              if (inactiveIds.length > 0) {
                const pick = inactiveIds[Math.floor(Math.random() * inactiveIds.length)];
                const ex = sim.sins.find((s) => s.sinId === pick);
                if (ex) {
                  ex.tempSummonTimer = 5.0;
                  ex.hp = ex.maxHp;
                  ex.respawnTimer = 0;
                } else {
                  const ent = buildSinEntity(sim, pick, 1, false);
                  ent.tempSummonTimer = 5.0;
                  sim.sins.push(ent);
                }
                addFloatingText(sim, sim.player.x, sim.player.y - 34, `บาปที่แปดเรียก: ${SEVEN_SINS[pick].sinNameTh}!`, SEVEN_SINS[pick].color, 1.05);
              }
            }
          }

          const prideEnt = sim.sins.find(
            (s) => s.sinId === 'pride' && (s.active || s.tempSummonTimer > 0 || sim.ultActiveTimer > 0) && s.hp > 0
          );
          const prideMult = prideEnt ? (Math.min(4, prideEnt.level + (sim.ultActiveTimer > 0 && prideEnt.active ? 1 : 0)) >= 3 ? 1.2 : 1.1) : 1.0;

          for (let idx = 0; idx < sim.sins.length; idx++) {
            const s = sim.sins[idx];
            if (s.tempSummonTimer > 0) s.tempSummonTimer = Math.max(0, s.tempSummonTimer - dt);
            const isOut = s.active || s.tempSummonTimer > 0 || sim.ultActiveTimer > 0;
            if (!isOut) continue;

            if (s.respawnTimer > 0) {
              s.respawnTimer -= dt;
              if (s.respawnTimer <= 0) {
                s.respawnTimer = 0;
                s.hp = s.maxHp;
                s.x = sim.player.x + Math.cos(idx) * 76;
                s.y = sim.player.y + Math.sin(idx) * 76;
                sim.groundFx.push({
                  kind: 'warp',
                  x: s.x,
                  y: s.y,
                  radius: 10,
                  maxRadius: 55,
                  life: 0.3,
                  maxLife: 0.3,
                  color: SEVEN_SINS[s.sinId].color,
                });
              }
              continue;
            }

            const effLv = Math.min(4, s.level + (sim.ultActiveTimer > 0 && s.active ? 1 : 0));
            const sinAuraMult = s.sinId === 'pride' ? 1.0 : prideMult;

            // Default follow target around player
            let goalX = sim.player.x + Math.cos(sim.orbitAngle * 0.4 + idx * 0.9) * 84;
            let goalY = sim.player.y + Math.sin(sim.orbitAngle * 0.4 + idx * 0.9) * 84;
            let moveSpd = 235;

            if (s.sinId === 'greed') {
              // Mammon chases nearest coin/XP drop within 450px
              let bestDrop: DropEntity | null = null;
              let bestD = 450;
              for (const d of sim.drops) {
                if (d.kind === 'xp' || d.kind === 'xp_large' || d.kind === 'gold') {
                  const dd = Math.hypot(d.x - s.x, d.y - s.y);
                  if (dd < bestD) {
                    bestD = dd;
                    bestDrop = d;
                  }
                }
              }
              if (bestDrop) {
                goalX = bestDrop.x;
                goalY = bestDrop.y;
                moveSpd = 320;
                if (bestD <= 26) bestDrop.magnetized = true;
              }
            } else if (s.sinId === 'wrath') {
              // Satan dashes to nearest enemy within 380px
              let nearEn: EnemyEntity | null = null;
              let nearD2 = 380 * 380;
              for (const en of sim.enemies) {
                if (en.hp <= 0) continue;
                const d2 = (en.x - s.x) ** 2 + (en.y - s.y) ** 2;
                if (d2 < nearD2) {
                  nearD2 = d2;
                  nearEn = en;
                }
              }
              if (nearEn) {
                goalX = nearEn.x;
                goalY = nearEn.y;
                moveSpd = s.wrathFrenzyTimer > 0 ? 340 : 275;
              }
            }

            const sdx = goalX - s.x;
            const sdy = goalY - s.y;
            const sd = Math.hypot(sdx, sdy);
            if (sd > 18) {
              s.x += (sdx / sd) * moveSpd * dt;
              s.y += (sdy / sd) * moveSpd * dt;
            }
            if (Math.hypot(s.x - sim.player.x, s.y - sim.player.y) > 560) {
              s.x = sim.player.x + Math.cos(idx) * 76;
              s.y = sim.player.y + Math.sin(idx) * 76;
            }

            if (s.wrathFrenzyTimer > 0) s.wrathFrenzyTimer = Math.max(0, s.wrathFrenzyTimer - dt);
            s.aiTimer -= dt;

            if (s.sinId === 'pride') {
              if (s.aiTimer <= 0) {
                s.aiTimer = 2.2 * Math.max(0.75, stats.cooldownMult);
                const featherCount = effLv >= 3 ? 16 : 8;
                const spd = 370 * stats.projSpeedMult;
                for (let k = 0; k < featherCount; k++) {
                  const a = (k * Math.PI * 2) / featherCount + sim.orbitAngle * 0.25;
                  sim.projectiles.push({
                    weaponId: 'wand',
                    evolved: true,
                    customKind: 'feather',
                    fromClassSkill: true,
                    x: s.x,
                    y: s.y,
                    vx: Math.cos(a) * spd,
                    vy: Math.sin(a) * spd,
                    radius: 11 * stats.areaMult,
                    damage: (36 + cappedLv * 1.7) * sinAuraMult * stats.damageMult,
                    knockback: 65,
                    pierce: 2,
                    life: 1.8,
                    maxLife: 1.8,
                    hitIds: new Set(),
                    rotation: a,
                    homing: true,
                    explosive: true,
                    color: '#C084FC',
                  });
                }
                if (sim.ultActiveTimer <= 0 && (sim.combo || 0) >= 20) {
                  sim.classGauge = Math.min(100, sim.classGauge + 3);
                }
              }
            } else if (s.sinId === 'greed') {
              // Check Greed chomp every 1.4s + Lv3 500-gold bomb
              if (s.aiTimer <= 0) {
                s.aiTimer = 1.4;
                for (const en of sim.enemies) {
                  if (en.hp > 0 && Math.hypot(en.x - s.x, en.y - s.y) <= 56 + en.radius) {
                    const preHp = en.hp;
                    damageEnemy(sim, en, (34 + cappedLv * 1.6) * sinAuraMult * stats.damageMult, null, 95, en.x - s.x, en.y - s.y, stats.greedMult);
                    if (preHp > 0 && en.hp <= 0) {
                      const mammonGold = sim.elapsedSeconds > 1800 ? 2 : 4;
                      sim.goldEarned += mammonGold;
                      s.greedGoldBuffer += mammonGold;
                      if (sim.ultActiveTimer <= 0) sim.classGauge = Math.min(100, sim.classGauge + 1);
                    }
                    break;
                  }
                }
                if (effLv >= 3 && s.greedGoldBuffer >= 100) {
                  s.greedGoldBuffer -= 100;
                  const coinDmg = (85 + cappedLv * 3.5) * sinAuraMult * stats.damageMult;
                  sim.groundFx.push({
                    kind: 'shockwave',
                    x: s.x,
                    y: s.y,
                    radius: 18,
                    maxRadius: 240,
                    life: 0.36,
                    maxLife: 0.36,
                    color: '#FBBF24',
                  });
                  for (const en of sim.enemies) {
                    if (en.hp > 0 && Math.hypot(en.x - s.x, en.y - s.y) <= 240 + en.radius) {
                      damageEnemy(sim, en, coinDmg, null, 120, en.x - s.x, en.y - s.y, stats.greedMult);
                    }
                  }
                }
              }
            } else if (s.sinId === 'envy') {
              if (s.aiTimer <= 0) {
                s.aiTimer = 1.8 * Math.max(0.75, stats.cooldownMult);
                let topEn: EnemyEntity | null = null;
                let topHp = 0;
                let hasEliteOrBoss = false;
                for (const en of sim.enemies) {
                  if (en.hp <= 0) continue;
                  if (en.isBoss || en.kind === 'golem' || en.kind === 'shielder' || en.kind === 'charger') hasEliteOrBoss = true;
                  if (Math.hypot(en.x - s.x, en.y - s.y) <= 480 && en.hp > topHp) {
                    topHp = en.hp;
                    topEn = en;
                  }
                }
                if (topEn) {
                  const ratio = effLv >= 3 ? 0.7 : 0.5;
                  const copies = effLv >= 3 ? 2 : 1;
                  const baseAng = Math.atan2(topEn.y - s.y, topEn.x - s.x);
                  const copyDmg = (58 + cappedLv * 2.4) * ratio * sinAuraMult * stats.damageMult;
                  for (let c = 0; c < copies; c++) {
                    const ang = baseAng + (c - (copies - 1) / 2) * 0.16;
                    const spd = 480 * stats.projSpeedMult;
                    sim.projectiles.push({
                      weaponId: sim.weapons[c % Math.max(1, sim.weapons.length)]?.id || 'dagger',
                      evolved: true,
                      fromClassSkill: true,
                      x: s.x,
                      y: s.y,
                      vx: Math.cos(ang) * spd,
                      vy: Math.sin(ang) * spd,
                      radius: 12 * stats.areaMult,
                      damage: copyDmg,
                      knockback: 90,
                      pierce: 4,
                      life: 1.25,
                      maxLife: 1.25,
                      hitIds: new Set(),
                      rotation: ang,
                      color: '#10B981',
                    });
                  }
                }
                if (hasEliteOrBoss && sim.ultActiveTimer <= 0) {
                  sim.classGauge = Math.min(100, sim.classGauge + 3);
                }
              }
            } else if (s.sinId === 'wrath') {
              if (s.aiTimer <= 0) {
                s.aiTimer = s.wrathFrenzyTimer > 0 ? 0.7 : 1.45;
                const wRad = s.wrathFrenzyTimer > 0 ? 155 : 115;
                const wDmg = (46 + cappedLv * 2.2) * (1 + s.wrathStacks * 0.08) * sinAuraMult * stats.damageMult;
                let hitSomething = false;
                for (const en of sim.enemies) {
                  if (en.hp > 0 && Math.hypot(en.x - s.x, en.y - s.y) <= wRad + en.radius) {
                    hitSomething = true;
                    damageEnemy(sim, en, wDmg, null, 240, en.x - s.x, en.y - s.y, stats.greedMult);
                  }
                }
                if (hitSomething) {
                  sim.groundFx.push({
                    kind: 'shockwave',
                    x: s.x,
                    y: s.y,
                    radius: 16,
                    maxRadius: wRad,
                    life: 0.28,
                    maxLife: 0.28,
                    color: '#EF4444',
                  });
                }
              }
            } else if (s.sinId === 'sloth') {
              s.slothAwake = sim.standStillTimer >= 1.0;
              if (s.slothAwake) {
                for (const en of sim.enemies) {
                  if (en.hp > 0 && Math.hypot(en.x - s.x, en.y - s.y) <= 260 + en.radius) {
                    en.freezeTimer = Math.max(en.freezeTimer || 0, 0.35);
                  }
                }
                if (effLv >= 3) {
                  for (let bi = sim.enemyBullets.length - 1; bi >= 0; bi--) {
                    if (Math.hypot(sim.enemyBullets[bi].x - s.x, sim.enemyBullets[bi].y - s.y) <= 260) {
                      sim.enemyBullets.splice(bi, 1);
                    }
                  }
                }
                if (s.aiTimer <= 0) {
                  s.aiTimer = 1.6;
                  if (sim.ultActiveTimer <= 0) sim.classGauge = Math.min(100, sim.classGauge + 4);
                  const slamDmg = (52 + cappedLv * 2.2) * sinAuraMult * stats.damageMult;
                  sim.groundFx.push({
                    kind: 'shockwave',
                    x: s.x,
                    y: s.y,
                    radius: 22,
                    maxRadius: 210,
                    life: 0.36,
                    maxLife: 0.36,
                    color: '#60A5FA',
                  });
                  spawnSheetVfx(sim, 'moon_eclipse', s.x, s.y, { size: 185, life: 0.72 });
                  for (const en of sim.enemies) {
                    if (en.hp > 0 && Math.hypot(en.x - s.x, en.y - s.y) <= 210 + en.radius) {
                      damageEnemy(sim, en, slamDmg, null, 200, en.x - s.x, en.y - s.y, stats.greedMult);
                    }
                  }
                }
              }
            } else if (s.sinId === 'gluttony') {
              if (s.aiTimer <= 0) {
                s.aiTimer = 1.5;
                const devourCap = effLv >= 3 ? 3 : 1;
                let devoured = 0;
                for (const en of sim.enemies) {
                  if (devoured >= devourCap) break;
                  if (
                    en.hp > 0 &&
                    !en.isBoss &&
                    en.kind !== 'golem' &&
                    en.kind !== 'shielder' &&
                    en.kind !== 'charger' &&
                    en.hp / Math.max(1, en.maxHp) <= 0.15 &&
                    Math.hypot(en.x - s.x, en.y - s.y) <= 260
                  ) {
                    devoured += 1;
                    damageEnemy(sim, en, en.hp + 10, null, 0, 0, 0, stats.greedMult, false, false, true);
                    if (sim.ultActiveTimer <= 0) sim.classGauge = Math.min(100, sim.classGauge + 3);
                  }
                }
                if (devoured > 0) {
                  const healed = applyLeechHeal(sim, Math.round(sim.player.maxHp * 0.012 * devoured));
                  if (healed > 0) addFloatingText(sim, sim.player.x, sim.player.y - 24, `ตะกละ +${healed}`, '#84CC16', 0.9);
                  if (effLv >= 3) {
                    sim.groundFx.push({
                      kind: 'explosion',
                      x: s.x,
                      y: s.y,
                      radius: 14,
                      maxRadius: 130,
                      life: 0.32,
                      maxLife: 0.32,
                      color: '#84CC16',
                    });
                    spawnSheetVfx(sim, 'moon_eclipse', s.x, s.y, { size: 170, life: 0.65 });
                    const spitDmg = (54 + cappedLv * 2.3) * sinAuraMult * stats.damageMult;
                    for (const en of sim.enemies) {
                      if (en.hp > 0 && Math.hypot(en.x - s.x, en.y - s.y) <= 130 + en.radius) {
                        damageEnemy(sim, en, spitDmg, null, 110, en.x - s.x, en.y - s.y, stats.greedMult);
                      }
                    }
                  }
                }
              }
            } else if (s.sinId === 'lust') {
              if (s.aiTimer <= 0) {
                s.aiTimer = 4.0;
                const charmCap = effLv >= 3 ? 4 : 2;
                let charmedCnt = 0;
                for (const en of sim.enemies) {
                  if (charmedCnt >= charmCap) break;
                  if (en.hp > 0 && !en.isBoss && (en.charmTimer || 0) <= 0 && Math.hypot(en.x - s.x, en.y - s.y) <= 320) {
                    en.charmTimer = 5.0;
                    en.charmAttackCd = 0.25;
                    charmedCnt += 1;
                  }
                }
                if (charmedCnt > 0) {
                  spawnParticles(sim, s.x, s.y, '#EC4899', 10, 120);
                  if (sim.ultActiveTimer <= 0) sim.classGauge = Math.min(100, sim.classGauge + charmedCnt * 3);
                }
              }
            }
          }
        }

        // Necromancer (death_god): Minion Behavior Manager (lifetimes, death/expiry explosion, soul harvest & flocking perimeter guard)
        updateMinionBehavior(sim, dt, stats, {
          damageEnemy: (enemy, rawDamage, knockback, kbDx, kbDy, greedMult, customDamageColor) =>
            damageEnemy(
              sim,
              enemy,
              rawDamage,
              null,
              knockback,
              kbDx,
              kbDy,
              greedMult,
              false,
              false,
              true,
              false,
              customDamageColor
            ),
          hitWorldTargetsInCircle: (cx, cy, radius, dmg) =>
            hitWorldTargetsInCircle(sim, cx, cy, radius, dmg, stats),
          addGroundFx: (fx) => sim.groundFx.push(fx),
          spawnParticles: (x, y, color, count, speed) =>
            spawnParticles(sim, x, y, color, count, speed),
          addFloatingText: (x, y, text, color, scale) =>
            addFloatingText(sim, x, y, text, color, scale),
          spawnSoulOrb: (orb) => {
            const cap = 64;
            if (sim.necroSoulOrbs.length >= cap) {
              sim.necroSoulOrbs.splice(0, orb.count);
            }
            const baseAngle = Math.random() * Math.PI * 2;
            for (let oi = 0; oi < orb.count; oi++) {
              const scatterAng =
                baseAngle + (oi / Math.max(1, orb.count)) * Math.PI * 2 + (Math.random() - 0.5) * 0.5;
              const ejectSpeed = (orb.isMiniBoss ? 175 : 130) + Math.random() * 65;
              sim.necroSoulOrbs.push({
                x: orb.x,
                y: orb.y,
                vx: Math.cos(scatterAng) * ejectSpeed,
                vy: Math.sin(scatterAng) * ejectSpeed,
                zOffset: 10 + Math.random() * 10,
                life: 1.6,
                maxLife: 1.6,
                age: 0,
                color: orb.color,
                glowColor: orb.glowColor,
                radius: orb.isMiniBoss ? 5.2 : orb.fealty ? 4.5 : 3.8,
                fealty: orb.fealty,
                trail: [],
              });
            }
          },
        });

        // Necromancer Soul Absorption Projectiles: scatter outward briefly then curl & accelerate into player
        for (let oi = sim.necroSoulOrbs.length - 1; oi >= 0; oi--) {
          const orb = sim.necroSoulOrbs[oi];
          orb.trail.push({ x: orb.x, y: orb.y, z: orb.zOffset });
          if (orb.trail.length > 7) {
            orb.trail.shift();
          }
          orb.age += dt;
          orb.life -= dt;

          const dx = sim.player.x - orb.x;
          const dy = sim.player.y - orb.y;
          const dist = Math.hypot(dx, dy) || 1;

          if (orb.age < 0.14) {
            orb.vx *= Math.max(0, 1 - dt * 3.5);
            orb.vy *= Math.max(0, 1 - dt * 3.5);
            orb.zOffset += dt * 38;
          } else {
            const homingAge = orb.age - 0.14;
            const targetSpeed = 330 + homingAge * 560;
            const desiredVx = (dx / dist) * targetSpeed;
            const desiredVy = (dy / dist) * targetSpeed;
            const steer = Math.min(1, dt * (5.5 + homingAge * 15));
            orb.vx += (desiredVx - orb.vx) * steer;
            orb.vy += (desiredVy - orb.vy) * steer;
            orb.zOffset += (16 - orb.zOffset) * Math.min(1, dt * 6);
          }

          orb.x += orb.vx * dt;
          orb.y += orb.vy * dt;

          if (dist <= 18 || orb.life <= 0) {
            if (dist <= 26) {
              spawnParticles(
                sim,
                sim.player.x,
                sim.player.y,
                orb.fealty ? '#C084FC' : '#34D399',
                orb.fealty ? 3 : 2,
                75
              );
            }
            sim.necroSoulOrbs.splice(oi, 1);
          }
        }

        // Continuous Orbiting Weapons (Fire Orb, Shield) & Garlic Aura
        sim.orbitAngle += dt * 3.2;
        sim.garlicTimer -= dt;

        const shieldW = sim.weapons.find((w) => w.id === 'shield');
        const fireOrbW = sim.weapons.find((w) => w.id === 'fireorb');
        const garlicW = sim.weapons.find((w) => w.id === 'garlic');

        // Garlic Aura
        if (garlicW) {
          const evo = garlicW.evolved;
          const radius = (evo ? 132 : 78 + garlicW.level * 11) * stats.areaMult;
          if (sim.garlicTimer <= 0) {
            sim.garlicTimer = evo ? 0.25 : 0.38;
            const dmg = (evo ? 24 : 8 + garlicW.level * 4) * stats.damageMult;
            for (const e of sim.enemies) {
              if (e.hp <= 0) continue;
              const d = Math.hypot(e.x - sim.player.x, e.y - sim.player.y);
              if (d <= radius + e.radius) {
                damageEnemy(
                  sim,
                  e,
                  dmg,
                  'garlic',
                  evo ? 85 : 55,
                  e.x - sim.player.x,
                  e.y - sim.player.y,
                  stats.greedMult
                );
                if (evo) {
                  sim.garlicHealCounter += 1;
                  if (sim.garlicHealCounter >= 7) {
                    sim.garlicHealCounter = 0;
                    applyPlayerHeal(sim, 2);
                  }
                }
              }
            }
            hitWorldTargetsInCircle(sim, sim.player.x, sim.player.y, radius, dmg, stats);
          }
        }

        // Orbiting Shields & Fire Orbs positions
        const shieldPositions: { x: number; y: number; r: number; dmg: number; evo: boolean }[] = [];
        if (shieldW) {
          const evo = shieldW.evolved;
          const count = evo ? 6 : Math.min(5, 1 + shieldW.level);
          const orbitR = (evo ? 86 : 68 + shieldW.level * 4) * stats.areaMult;
          const orbR = (evo ? 18 : 13 + shieldW.level) * stats.areaMult;
          const dmg = (evo ? 32 : 12 + shieldW.level * 5) * stats.damageMult * (1 + stats.armor * 0.08);
          for (let i = 0; i < count; i++) {
            const a = sim.orbitAngle * (evo ? 1.25 : 0.95) + (i * Math.PI * 2) / count;
            shieldPositions.push({
              x: sim.player.x + Math.cos(a) * orbitR,
              y: sim.player.y + Math.sin(a) * orbitR,
              r: orbR,
              dmg,
              evo,
            });
          }
        }

        const fireOrbPositions: { x: number; y: number; r: number; dmg: number; evo: boolean }[] = [];
        if (fireOrbW) {
          const evo = fireOrbW.evolved;
          const count = evo ? 6 : Math.min(5, 1 + fireOrbW.level);
          const orbitR = (evo ? 128 : 96 + fireOrbW.level * 6) * stats.areaMult;
          const orbR = (evo ? 18 : 12 + fireOrbW.level) * stats.areaMult;
          const dmg = (evo ? 44 : 15 + fireOrbW.level * 6) * stats.damageMult;
          for (let i = 0; i < count; i++) {
            const a = -sim.orbitAngle * (evo ? 1.35 : 1.05) + (i * Math.PI * 2) / count;
            fireOrbPositions.push({
              x: sim.player.x + Math.cos(a) * orbitR,
              y: sim.player.y + Math.sin(a) * orbitR,
              r: orbR,
              dmg,
              evo,
            });
          }
        }

        // Orbiting Spiked Chain Flails
        const chainW = sim.weapons.find((w) => w.id === 'chain');
        const chainPositions: { x: number; y: number; r: number; dmg: number; evo: boolean }[] = [];
        if (chainW) {
          const evo = chainW.evolved;
          const count = evo ? 3 : chainW.level >= 5 ? 3 : chainW.level >= 3 ? 2 : 1;
          const orbitR = (evo ? 145 : 95 + chainW.level * 9) * stats.areaMult;
          const orbR = (evo ? 22 : 14 + chainW.level * 1.5) * stats.areaMult;
          const dmg = (evo ? 52 : 18 + chainW.level * 7) * stats.damageMult * (1 + stats.armor * 0.1);
          for (let i = 0; i < count; i++) {
            const a = sim.orbitAngle * (evo ? 1.7 : 1.25) + (i * Math.PI * 2) / count;
            chainPositions.push({
              x: sim.player.x + Math.cos(a) * orbitR,
              y: sim.player.y + Math.sin(a) * orbitR,
              r: orbR,
              dmg,
              evo,
            });
          }
        }

        // Continuous evolved particles for orbiting weapons & garlic aura
        sim.orbitParticleTimer = (sim.orbitParticleTimer ?? 0) - dt;
        if (sim.orbitParticleTimer <= 0) {
          sim.orbitParticleTimer = 0.095;
          if (sim.particles.length < 300) {
            if (garlicW && garlicW.evolved) {
              const gPal = getEvolvedWeaponPalette('garlic');
              const radius = 132 * stats.areaMult;
              for (let gi = 0; gi < 2; gi++) {
                const ga = Math.random() * Math.PI * 2;
                const col = gPal.colors[gi % gPal.colors.length];
                const sec = gPal.colors[(gi + 1) % gPal.colors.length];
                sim.particles.push({
                  x: sim.player.x + Math.cos(ga) * radius * 0.92,
                  y: sim.player.y + Math.sin(ga) * radius * 0.92,
                  vx: Math.cos(ga) * 18,
                  vy: -24 + Math.sin(ga) * 14,
                  radius: 2.8,
                  life: 0.42,
                  maxLife: 0.42,
                  color: col,
                  secondaryColor: sec,
                  shape: gPal.shapes[gi % gPal.shapes.length],
                  angle: ga,
                  spin: 3,
                  drag: 1.8,
                  zOffset: 10,
                  glow: true,
                });
              }
            }
            const emitOrbit = (
              list: { x: number; y: number; evo: boolean }[],
              wId: WeaponId
            ) => {
              if (list.length === 0 || !list[0].evo) return;
              const pal = getEvolvedWeaponPalette(wId);
              const pick = list[Math.floor(Math.random() * list.length)];
              const idx = Math.floor(Math.random() * pal.colors.length);
              const a = Math.random() * Math.PI * 2;
              sim.particles.push({
                x: pick.x,
                y: pick.y,
                vx: Math.cos(a) * 28,
                vy: Math.sin(a) * 28,
                radius: 2.8,
                life: 0.36,
                maxLife: 0.36,
                color: pal.colors[idx],
                secondaryColor: pal.colors[(idx + 1) % pal.colors.length],
                shape: pal.shapes[idx % pal.shapes.length],
                angle: a,
                spin: 5,
                drag: 2.2,
                zOffset: 14,
                glow: true,
              });
            };
            emitOrbit(shieldPositions, 'shield');
            emitOrbit(fireOrbPositions, 'fireorb');
            emitOrbit(chainPositions, 'chain');
          }
        }

        // Update Placed Holy Totems
        for (let i = sim.totems.length - 1; i >= 0; i--) {
          const tm = sim.totems[i];
          tm.life -= dt;
          if (tm.life <= 0) {
            sim.totems.splice(i, 1);
            continue;
          }
          tm.pulseTimer -= dt;
          if (tm.pulseTimer <= 0) {
            tm.pulseTimer = tm.evolved ? 0.65 : 0.95;
            sim.groundFx.push({
              kind: 'shockwave',
              x: tm.x,
              y: tm.y,
              radius: 10,
              maxRadius: tm.radius,
              life: 0.3,
              maxLife: 0.3,
              color: tm.evolved ? '#F59E0B' : '#FDE047',
            });
            if (tm.evolved) {
              spawnPaletteBurst(sim, tm.x, tm.y, getEvolvedWeaponPalette('totem'), 10, 125, {
                radius: 3.1,
                life: 0.45,
              });
            }
            for (const e of sim.enemies) {
              if (e.hp <= 0) continue;
              if (Math.hypot(e.x - tm.x, e.y - tm.y) <= tm.radius + e.radius) {
                damageEnemy(sim, e, tm.damage, 'totem', 70, e.x - tm.x, e.y - tm.y, stats.greedMult);
              }
            }
            hitWorldTargetsInCircle(sim, tm.x, tm.y, tm.radius, tm.damage, stats);
            if (tm.evolved || (sim.weapons.find((w) => w.id === 'totem')?.level || 0) >= 5) {
              applyPlayerHeal(sim, 1);
            }
          }
        }

        // Update Projectiles
        for (let i = sim.projectiles.length - 1; i >= 0; i--) {
          const p = sim.projectiles[i];
          p.life -= dt;
          if (p.life <= 0 || p.pierce <= 0) {
            sim.projectiles.splice(i, 1);
            continue;
          }

          if (p.customKind) {
            p.rotation = Math.atan2(p.vy, p.vx);
          } else if (p.weaponId === 'cat') {
            p.rotation = Math.sin(p.life * 16) * 0.22;
          } else if (p.weaponId === 'bird') {
            p.rotation = Math.atan2(p.vy, p.vx);
          } else {
            p.rotation +=
              p.weaponId === 'katana' ||
              p.weaponId === 'spear' ||
              p.weaponId === 'dagger' ||
              p.weaponId === 'frostnova' ||
              p.weaponId === 'watergun'
                ? 0
                : dt * (p.weaponId === 'banana' || p.weaponId === 'axe' ? 11 : 4);
          }

          if (p.homing) {
            let nearest: EnemyEntity | null = null;
            const isHunterArrow = p.customKind === 'arrow' && sim.raceClass === 'hunter';
            let bestScore = isHunterArrow ? Infinity : 340 * 340;
            for (const e of sim.enemies) {
              if (e.hp <= 0 || p.hitIds.has(e.id)) continue;
              const d2 = (e.x - p.x) ** 2 + (e.y - p.y) ** 2;
              if (isHunterArrow) {
                if (d2 <= 440 * 440) {
                  const score = (e.huntMarks || 0) * 1_000_000 + d2;
                  if (score < bestScore) {
                    bestScore = score;
                    nearest = e;
                  }
                }
              } else if (d2 < bestScore) {
                bestScore = d2;
                nearest = e;
              }
            }
            if (nearest) {
              const desired = Math.atan2(nearest.y - p.y, nearest.x - p.x);
              const speed = Math.hypot(p.vx, p.vy) || 350;
              const turnWeight = isHunterArrow || p.customKind === 'shadow_knife' ? 0.24 : 0.1;
              p.vx = p.vx * (1 - turnWeight) + Math.cos(desired) * speed * turnWeight;
              p.vy = p.vy * (1 - turnWeight) + Math.sin(desired) * speed * turnWeight;
            }
          }

          if (p.boomerang) {
            // Curve back toward player after half life
            const dx = sim.player.x - p.x;
            const dy = sim.player.y - p.y;
            const d = Math.hypot(dx, dy) || 1;
            const pull = p.life < p.maxLife * 0.62 ? 820 : 210;
            p.vx += (dx / d) * pull * dt;
            p.vy += (dy / d) * pull * dt;
            const maxSpd = p.returnSpeed || 460;
            const curSpd = Math.hypot(p.vx, p.vy);
            if (curSpd > maxSpd) {
              p.vx = (p.vx / curSpd) * maxSpd;
              p.vy = (p.vy / curSpd) * maxSpd;
            }
            if (p.life < p.maxLife * 0.4 && d < 22) {
              sim.projectiles.splice(i, 1);
              continue;
            }
          }

          p.x += p.vx * dt;
          p.y += p.vy * dt;

          if (p.trailColors && p.trailColors.length > 0) {
            p.trailTimer = (p.trailTimer ?? 0) - dt;
            if (p.trailTimer <= 0 && sim.particles.length < 300) {
              p.trailTimer = 0.045;
              const idx = Math.floor(Math.random() * p.trailColors.length);
              const col = p.trailColors[idx];
              const sec = p.trailColors[(idx + 1) % p.trailColors.length];
              const shapes = p.particleShapes;
              const shape: ParticleShape = shapes && shapes.length > 0
                ? shapes[idx % shapes.length]
                : 'spark';
              const moveAng = Math.atan2(p.vy, p.vx);
              sim.particles.push({
                x: p.x + (Math.random() - 0.5) * 6,
                y: p.y + (Math.random() - 0.5) * 6,
                vx: -p.vx * 0.12 + (Math.random() - 0.5) * 32,
                vy: -p.vy * 0.12 + (Math.random() - 0.5) * 32,
                radius: Math.max(2.4, Math.min(4.2, p.radius * 0.22)),
                life: 0.28,
                maxLife: 0.28,
                color: col,
                secondaryColor: sec,
                shape,
                angle: moveAng,
                spin: 5,
                drag: 2.8,
                zOffset: 12,
                glow: true,
              });
            }
          }

          hitWorldTargetsInCircle(sim, p.x, p.y, p.radius + 6, p.damage, stats);
          for (const e of sim.enemies) {
            if (e.hp <= 0 || p.hitIds.has(e.id)) continue;
            const dist = Math.hypot(e.x - p.x, e.y - p.y);
            if (dist <= p.radius + e.radius) {
              p.hitIds.add(e.id);
              p.pierce -= 1;
              if (p.fromClassSkill && sim.raceClass === 'hunter' && (p.customKind === 'arrow' || p.customKind === 'shadow_knife')) {
                if (p.customKind === 'arrow') {
                  e.huntMarks = Math.min(5, (e.huntMarks || 0) + 1);
                  spawnParticles(sim, e.x, e.y, '#34D399', 4, 85);
                }
                if (sim.ultActiveTimer <= 0) {
                  sim.classGauge = Math.min(100, sim.classGauge + (p.customKind === 'arrow' ? 0.3 : 0.2));
                }
              }
              if (p.soakSlow) {
                e.freezeTimer = Math.max(e.freezeTimer || 0, 1.85);
                e.wetTimer = Math.max(e.wetTimer || 0, 2.5);
                spawnParticles(sim, e.x, e.y, '#7DD3FC', 4, 80);
              }
              if (p.applyDeepFreeze) {
                e.frostStacks = (e.frostStacks || 0) + 1;
                if (e.frostStacks >= (e.isBoss ? 5 : 3)) {
                  e.frostStacks = 0;
                  e.hardFreezeTimer = Math.max(e.hardFreezeTimer || 0, e.isBoss ? 0.45 : 0.95);
                  spawnVfx(sim.vfx, 'ice_nova', e.x, e.y, { scale: 0.75 });
                  spawnParticles(sim, e.x, e.y, '#BAE6FD', 7, 95);
                }
              }
              if (p.applyBurnPct && p.applyBurnPct > 0) {
                e.burnTimer = Math.max(e.burnTimer || 0, 3.6);
                e.burnPct = Math.max(e.burnPct || 0, p.applyBurnPct);
                e.burnTickTimer = Math.min(e.burnTickTimer ?? 0.35, 0.35);
                spawnParticles(sim, e.x, e.y, '#FB923C', 4, 85);
              }
              if (p.applyWindMark) {
                e.windMarkTimer = Math.max(e.windMarkTimer || 0, 4.2);
                e.windMarkDamage = Math.max(e.windMarkDamage || 0, p.damage * 0.9);
              }
              const dmgWeaponId = p.fromClassSkill ? null : p.weaponId;
              damageEnemy(sim, e, p.damage, dmgWeaponId, p.knockback, p.vx, p.vy, stats.greedMult);

              if (p.trailColors && p.trailColors.length > 0 && sim.particles.length < 320) {
                const shapes = p.particleShapes && p.particleShapes.length > 0
                  ? p.particleShapes
                  : (['spark', 'star'] as ParticleShape[]);
                const burstCount = p.explosive ? 7 : 3;
                for (let bi = 0; bi < burstCount; bi++) {
                  const ba = Math.random() * Math.PI * 2;
                  const bSpd = (p.explosive ? 150 : 95) * (0.6 + Math.random() * 0.6);
                  sim.particles.push({
                    x: p.x,
                    y: p.y,
                    vx: Math.cos(ba) * bSpd,
                    vy: Math.sin(ba) * bSpd,
                    radius: p.explosive ? 3.4 : 2.7,
                    life: 0.35,
                    maxLife: 0.35,
                    color: p.trailColors[bi % p.trailColors.length],
                    secondaryColor: p.trailColors[(bi + 1) % p.trailColors.length],
                    shape: shapes[bi % shapes.length],
                    angle: ba,
                    spin: 6,
                    drag: 2.5,
                    zOffset: 12,
                    glow: true,
                  });
                }
              }

              if (p.explosive) {
                sim.groundFx.push({
                  kind: 'explosion',
                  x: p.x,
                  y: p.y,
                  radius: 10,
                  maxRadius: 68,
                  life: 0.22,
                  maxLife: 0.22,
                  color:
                    p.customKind === 'feather'
                      ? '#C084FC'
                      : p.weaponId === 'cat'
                        ? '#FB923C'
                        : '#38BDF8',
                });
                spawnVfx(sim.vfx, 'explosion_fire', p.x, p.y, { scale: 68 / 40 });
                hitWorldTargetsInCircle(sim, p.x, p.y, 68, p.damage * 0.6, stats);
                for (const splash of sim.enemies) {
                  if (splash.id !== e.id && splash.hp > 0) {
                    if (Math.hypot(splash.x - p.x, splash.y - p.y) <= 68 + splash.radius) {
                      damageEnemy(
                        sim,
                        splash,
                        p.damage * 0.6,
                        dmgWeaponId,
                        30,
                        splash.x - p.x,
                        splash.y - p.y,
                        stats.greedMult
                      );
                    }
                  }
                }
              }

              if (p.pierce <= 0) break;
            }
          }
        }

        // Update Enemies (with Time Stop Freeze, Golem 60% Taunt, Sin 30% Taunt & Hunter Ult 40% Slow!)
        const activeGolemObj = sim.golem && sim.golem.respawnTimer <= 0 && sim.golem.hp > 0 ? sim.golem : null;
        const activeGolemPos = sim.elementalGolem
          ? { x: sim.elementalGolem.x, y: sim.elementalGolem.y, isSaintGolem: false }
          : activeGolemObj
            ? { x: activeGolemObj.x, y: activeGolemObj.y, isSaintGolem: true }
            : null;
        const timeStopped = sim.timeStopTimer > 0;
        const cappedHeroLv = Math.min(sim.player.level, 40);

        for (let i = sim.enemies.length - 1; i >= 0; i--) {
          const e = sim.enemies[i];
          if (e.hp <= 0) {
            sim.enemies.splice(i, 1);
            continue;
          }

          if (e.hitFlash > 0) e.hitFlash -= dt;
          if (e.hitReactTimer && e.hitReactTimer > 0) {
            e.hitReactTimer = Math.max(0, e.hitReactTimer - dt);
          }
          if (e.recoilX || e.recoilY) {
            const recoilDecay = Math.exp(-dt * 16);
            e.recoilX = (e.recoilX || 0) * recoilDecay;
            e.recoilY = (e.recoilY || 0) * recoilDecay;
            if (Math.abs(e.recoilX) < 0.15) e.recoilX = 0;
            if (Math.abs(e.recoilY) < 0.15) e.recoilY = 0;
          }

          // Elemental Sword Status Ticks: % Burn (Fire), Deep Freeze (Ice), Wind Mark (Wind)
          if (e.burnTimer && e.burnTimer > 0) {
            e.burnTimer -= dt;
            e.burnTickTimer = (e.burnTickTimer ?? 0.4) - dt;
            if (e.burnTickTimer <= 0) {
              e.burnTickTimer = 0.5;
              const pct = e.burnPct || 0.03;
              const burnDmg = Math.max(
                8,
                e.isBoss ? Math.min(260, e.maxHp * pct * 0.25) : e.maxHp * pct
              );
              damageEnemy(sim, e, burnDmg, null, 0, 0, 0, stats.greedMult, false, true, true);
              if (e.hp <= 0) {
                sim.enemies.splice(i, 1);
                continue;
              }
            }
          }
          // Demon Lord Hellfire DOT (does not count toward combo!)
          if ((e.hellfireStacks || 0) > 0 && (e.hellfireTimer || 0) > 0) {
            e.hellfireTimer = (e.hellfireTimer || 0) - dt;
            e.hellfireTickTimer = (e.hellfireTickTimer ?? 0.5) - dt;
            if (e.hellfireTickTimer <= 0) {
              e.hellfireTickTimer = 0.5;
              const ultMult = sim.raceClass === 'demon_lord' && sim.ultActiveTimer > 0 ? 2 : 1;
              const hellTickDmg =
                (e.hellfireStacks || 1) * (4 + cappedHeroLv * 0.4) * stats.damageMult * ultMult * 0.5;
              damageEnemy(sim, e, hellTickDmg, null, 0, 0, 0, stats.greedMult, false, true, true);
              if (e.hp <= 0) {
                sim.enemies.splice(i, 1);
                continue;
              }
            }
            if ((e.hellfireTimer || 0) <= 0) e.hellfireStacks = 0;
          }
          // Vampire Lord Bleed DOT (2x damage at Night!)
          if ((e.bleedStacks || 0) > 0 && (e.bleedTimer || 0) > 0) {
            e.bleedTimer = (e.bleedTimer || 0) - dt;
            e.bleedTickTimer = (e.bleedTickTimer ?? 0.5) - dt;
            if (e.bleedTickTimer <= 0) {
              e.bleedTickTimer = 0.5;
              const nightBleedMult = stats.isNight ? 2 : 1;
              const bleedTickDmg =
                (e.bleedStacks || 1) * (5 + cappedHeroLv * 0.45) * stats.damageMult * nightBleedMult * 0.5;
              damageEnemy(sim, e, bleedTickDmg, null, 0, 0, 0, stats.greedMult, false, true, true);
              if (e.hp <= 0) {
                sim.enemies.splice(i, 1);
                continue;
              }
            }
            if ((e.bleedTimer || 0) <= 0) e.bleedStacks = 0;
          }
          if (e.windMarkTimer && e.windMarkTimer > 0) {
            e.windMarkTimer -= dt;
          }
          let hardFrozen = false;
          if (e.hardFreezeTimer && e.hardFreezeTimer > 0) {
            e.hardFreezeTimer -= dt;
            hardFrozen = e.hardFreezeTimer > 0;
          }

          if (e.isBoss) {
            if (e.staggerTimer && e.staggerTimer > 0) {
              e.staggerTimer -= dt;
              if (e.staggerTimer <= 0) {
                e.staggerTimer = 0;
                e.staggerImmuneTimer = 2.8;
              }
            } else if (e.staggerImmuneTimer && e.staggerImmuneTimer > 0) {
              e.staggerImmuneTimer = Math.max(0, e.staggerImmuneTimer - dt);
            }
          }

          if (e.wetTimer && e.wetTimer > 0) e.wetTimer = Math.max(0, e.wetTimer - dt);
          let isRooted = false;
          if (e.rootTimer && e.rootTimer > 0) {
            e.rootTimer = Math.max(0, e.rootTimer - dt);
            isRooted = !e.isBoss && e.rootTimer > 0;
          }

          const isBossStaggered = Boolean(e.staggerTimer && e.staggerTimer > 0);
          const chronoWellFactor = e.chronoFrozenThisFrame
            ? 0
            : e.chronoSlowedThisFrame
              ? e.isBoss
                ? 0.4
                : 0.5
              : 1;
          const baseEdt = isBossStaggered || isRooted
            ? 0
            : timeStopped
              ? e.isBoss
                ? dt * 0.35
                : 0
              : hardFrozen
                ? e.isBoss
                  ? dt * 0.45
                  : 0
                : dt;
          const edt = baseEdt * chronoWellFactor;

          if (e.freezeTimer && e.freezeTimer > 0) e.freezeTimer -= edt;
          let terrainMobSlow = 1;
          e.elevZ = 0;
          const isFlyingMob = FLYING_ENEMY_KINDS.has(e.kind);
          if (!sim.inSecretRoom && !isFlyingMob) {
            const eZone = getTerrainZoneAt(e.x, e.y, sim.frameZones);
            if (eZone) {
              if (eZone.kind === 'high_ground') {
                e.elevZ = 18;
                terrainMobSlow *= 0.7;
              } else if (eZone.kind === 'water_puddle') {
                e.wetTimer = 2.5;
                terrainMobSlow *= 0.9;
              } else if (eZone.kind === 'poison_swamp') {
                terrainMobSlow *= 0.8;
              } else if (eZone.kind === 'lava_pool') {
                e.burnTimer = Math.max(e.burnTimer || 0, 1.2);
                e.burnPct = Math.max(e.burnPct || 0, 0.03);
                if (e.burnTickTimer === undefined) e.burnTickTimer = 0.45;
              }
            }
            if (!e.isBoss && Math.abs(e.x - sim.player.x) < 900 && Math.abs(e.y - sim.player.y) < 900) {
              for (const t of sim.frameTraps) {
                if (t.kind !== 'spike_trap') continue;
                const st = sim.trapStates[t.id];
                if ((st?.cooldown ?? 0) <= 0 && Math.hypot(e.x - t.x, e.y - t.y) <= t.r + e.radius) {
                  sim.trapStates[t.id] = {
                    used: false,
                    cooldown: 3.5,
                    activeTimer: 2.0,
                    shockTickTimer: 0,
                    hitCooldown: 0,
                  };
                  e.rootTimer = 2.0;
                  e.bleedStacks = Math.min(5, (e.bleedStacks || 0) + 2);
                  e.bleedTimer = 3.0;
                  if (e.bleedTickTimer === undefined) e.bleedTickTimer = 0.45;
                  damageEnemy(sim, e, Math.max(20, e.maxHp * 0.2), null, 0, 0, 0, stats.greedMult);
                  break;
                }
              }
            }
          }
          if ((e.isBoss || e.isReaper) && !sim.inSecretRoom) {
            for (let bi = sim.frameBreakables.length - 1; bi >= 0; bi--) {
              const b = sim.frameBreakables[bi];
              if (Math.hypot(e.x - b.x, e.y - b.y) <= e.radius + b.r + 6) {
                breakBreakableProp(sim, b);
              }
            }
          }

          let weatherEnemySpeedMult =
            (sim.weather === 'blizzard' ? 0.88 : sim.weather === 'blood_rain' ? 1.12 : 1) *
            (sim.mapEvent === 'god_blessing' ? 0.7 : sim.mapEvent === 'frenzy_horde' ? 1.28 : 1);
          for (const hz of sim.weatherHazards) {
            if (
              (hz.kind === 'sand_vortex' || hz.kind === 'ice_patch') &&
              Math.hypot(e.x - hz.x, e.y - hz.y) <= hz.radius + e.radius
            ) {
              weatherEnemySpeedMult *= 0.72;
              break;
            }
          }
          const hunterUltSlowMult = sim.raceClass === 'hunter' && sim.ultActiveTimer > 0 ? 0.6 : 1;
          const slowMult =
            (e.freezeTimer && e.freezeTimer > 0 ? 0.42 : 1) *
            weatherEnemySpeedMult *
            terrainMobSlow *
            hunterUltSlowMult;

          // Lust Charmed Enemies fight fellow monsters!
          if ((e.charmTimer || 0) > 0 && !e.isBoss) {
            e.charmTimer = (e.charmTimer || 0) - edt;
            e.charmAttackCd = Math.max(0, (e.charmAttackCd || 0) - edt);
            let allyTarget: EnemyEntity | null = null;
            let bestAllyD2 = 280 * 280;
            for (const other of sim.enemies) {
              if (other === e || other.hp <= 0 || (other.charmTimer || 0) > 0) continue;
              const d2 = (other.x - e.x) ** 2 + (other.y - e.y) ** 2;
              if (d2 < bestAllyD2) {
                bestAllyD2 = d2;
                allyTarget = other;
              }
            }
            if (allyTarget && edt > 0) {
              const ad = Math.sqrt(bestAllyD2) || 1;
              e.x += ((allyTarget.x - e.x) / ad) * e.speed * 1.1 * edt;
              e.y += ((allyTarget.y - e.y) / ad) * e.speed * 1.1 * edt;
              if (ad <= e.radius + allyTarget.radius + 10 && (e.charmAttackCd || 0) <= 0) {
                e.charmAttackCd = 0.55;
                damageEnemy(
                  sim,
                  allyTarget,
                  (e.damage * 1.6 + cappedHeroLv * 1.8) * stats.damageMult,
                  null,
                  90,
                  allyTarget.x - e.x,
                  allyTarget.y - e.y,
                  stats.greedMult,
                  false,
                  true
                );
              }
            }
            continue;
          }

          // Knight Parry knockdown & Taunt/Judgement status timers
          if ((e.parriedStunTimer || 0) > 0) e.parriedStunTimer = Math.max(0, (e.parriedStunTimer || 0) - dt);
          if ((e.knightTauntTimer || 0) > 0) e.knightTauntTimer = Math.max(0, (e.knightTauntTimer || 0) - dt);
          if ((e.judgementTimer || 0) > 0) e.judgementTimer = Math.max(0, (e.judgementTimer || 0) - dt);
          if ((e.knightTauntBangTimer || 0) > 0) e.knightTauntBangTimer = Math.max(0, (e.knightTauntBangTimer || 0) - dt);

          const playerDx = sim.player.x - e.x;
          const playerDy = sim.player.y - e.y;
          const playerDist = Math.hypot(playerDx, playerDy) || 1;

          // Golem (60% in 220px), Spirit Sword, & Seven Sins (30% in 160px) Taunt
          let dx = playerDx;
          let dy = playerDy;
          let dist = playerDist;
          if ((e.knightTauntTimer || 0) > 0 && !e.isBoss) {
            dx = playerDx;
            dy = playerDy;
            dist = playerDist;
          } else if (!e.isBoss) {
            if (activeGolemPos) {
              const gDx = activeGolemPos.x - e.x;
              const gDy = activeGolemPos.y - e.y;
              const gDist = Math.hypot(gDx, gDy) || 1;
              if (!activeGolemPos.isSaintGolem && gDist <= 310) {
                dx = gDx;
                dy = gDy;
                dist = gDist;
              } else if (activeGolemPos.isSaintGolem && gDist <= 220) {
                if (!e.tauntCheckedGolem) {
                  e.tauntCheckedGolem = true;
                  e.tauntTarget = Math.random() < 0.6 ? 'golem' : 'player';
                }
                if (e.tauntTarget === 'golem') {
                  dx = gDx;
                  dy = gDy;
                  dist = gDist;
                  if (gDist <= 42 + e.radius && activeGolemObj && edt > 0 && Math.random() < edt * 1.8) {
                    // Golem takes -60% damage, charges +1 Faith per 2% HP lost
                    const dmgToGolem = Math.max(1, e.damage * 0.4);
                    activeGolemObj.hp = Math.max(0, activeGolemObj.hp - dmgToGolem);
                    activeGolemObj.lostHpTrack += dmgToGolem;
                    const twoPct = Math.max(1, activeGolemObj.maxHp * 0.02);
                    while (activeGolemObj.lostHpTrack >= twoPct) {
                      activeGolemObj.lostHpTrack -= twoPct;
                      if (sim.ultActiveTimer <= 0) sim.classGauge = Math.min(100, sim.classGauge + 1);
                    }
                    if (activeGolemObj.hp <= 0) {
                      activeGolemObj.respawnTimer = 10.0;
                      sim.groundFx.push({
                        kind: 'explosion',
                        x: activeGolemObj.x,
                        y: activeGolemObj.y,
                        radius: 20,
                        maxRadius: 120,
                        life: 0.4,
                        maxLife: 0.4,
                        color: '#FDE047',
                      });
                      spawnParticles(sim, activeGolemObj.x, activeGolemObj.y, '#78716C', 20, 175);
                      addFloatingText(sim, activeGolemObj.x, activeGolemObj.y - 32, 'โกเล็มแตกสลาย! (10s)', '#FB7185', 1.15);
                      if (sim.ultAscended && sim.saintHealExplosionCd <= 0) {
                        sim.saintHealExplosionCd = 60.0;
                        const hAmt = Math.round(sim.player.maxHp * 0.3);
                        const healed = applyPlayerHeal(sim, hAmt);
                        addFloatingText(sim, sim.player.x, sim.player.y - 34, `แสงสุดท้าย +${healed} HP!`, '#FDE047', 1.25);
                      }
                    }
                  }
                }
              } else {
                e.tauntCheckedGolem = false;
              }
            }
            if (sim.raceClass === 'seven_sins') {
              for (const sEnt of sim.sins) {
                if (!(sEnt.active || sEnt.tempSummonTimer > 0 || sim.ultActiveTimer > 0) || sEnt.respawnTimer > 0 || sEnt.hp <= 0) continue;
                const sDx = sEnt.x - e.x;
                const sDy = sEnt.y - e.y;
                const sDist = Math.hypot(sDx, sDy) || 1;
                if (sDist <= 160 && (e.tauntTarget === 'sin' || (!e.tauntCheckedGolem && Math.random() < 0.3))) {
                  e.tauntTarget = 'sin';
                  e.tauntCheckedGolem = true;
                  dx = sDx;
                  dy = sDy;
                  dist = sDist;
                  if (sDist <= 28 + e.radius && edt > 0 && Math.random() < edt * 1.5) {
                    sEnt.hp = Math.max(0, sEnt.hp - Math.max(1, e.damage * 0.65));
                    if (sEnt.hp <= 0) {
                      sEnt.respawnTimer = 12.0;
                      spawnParticles(sim, sEnt.x, sEnt.y, SEVEN_SINS[sEnt.sinId].color, 14, 140);
                    }
                  }
                  break;
                }
              }
            }
            if (sim.spiritSwords.length > 0) {
              let bestSwDist = 185;
              for (const sw of sim.spiritSwords) {
                const sDx = sw.x - e.x;
                const sDy = sw.y - e.y;
                const sDist = Math.hypot(sDx, sDy) || 1;
                if (sDist < bestSwDist && sDist < dist) {
                  bestSwDist = sDist;
                  dx = sDx;
                  dy = sDy;
                  dist = sDist;
                }
              }
            }
            if (sim.necroMinions.length > 0) {
              let bestMinDist = 155;
              let bestMin: NecroMinionEntity | null = null;
              let bestMinDx = 0;
              let bestMinDy = 0;
              for (let mi = 0; mi < sim.necroMinions.length; mi++) {
                const m = sim.necroMinions[mi];
                if (m.hp <= 0) continue;
                const mDx = m.x - e.x;
                const mDy = m.y - e.y;
                const mDist = Math.hypot(mDx, mDy) || 1;
                if (mDist < bestMinDist && mDist < dist) {
                  bestMinDist = mDist;
                  bestMin = m;
                  bestMinDx = mDx;
                  bestMinDy = mDy;
                }
              }
              if (bestMin) {
                dx = bestMinDx;
                dy = bestMinDy;
                dist = bestMinDist;
                if (bestMinDist <= bestMin.radius + e.radius + 10 && edt > 0 && Math.random() < edt * 1.65) {
                  const dmgToMinion = Math.max(1, Math.round(e.damage * 0.55 * (1 - bestMin.armorRatio)));
                  bestMin.hp = Math.max(0, bestMin.hp - dmgToMinion);
                  bestMin.hitFlash = 0.14;
                }
              }
            }
          }

          // Boss Warp-Ahead Mechanic: Bosses NEVER despawn; if player runs far away, warp ahead!
          if (e.isBoss) {
            if (playerDist > 780) {
              const warpAngle =
                sim.player.vx !== 0 || sim.player.vy !== 0
                  ? Math.atan2(sim.player.vy, sim.player.vx) + (Math.random() - 0.5) * 0.6
                  : Math.random() * Math.PI * 2;
              e.x = sim.player.x + Math.cos(warpAngle) * 350;
              e.y = sim.player.y + Math.sin(warpAngle) * 350;
              sim.groundFx.push({
                kind: 'warp',
                x: e.x,
                y: e.y,
                radius: 12,
                maxRadius: 65,
                life: 0.4,
                maxLife: 0.4,
                color: e.isReaper ? '#F43F5E' : '#F59E0B',
              });
            }
          } else if (playerDist > 1050) {
            // Recycle far normal mob closer to player edge
            const a = Math.random() * Math.PI * 2;
            e.x = sim.player.x + Math.cos(a) * 520;
            e.y = sim.player.y + Math.sin(a) * 520;
          }

          // AI Movement (paused if frozen by Time Stop or knocked down by Knight Parry; bosses act at 0.25x speed)
          if (edt > 0 && (e.parriedStunTimer || 0) <= 0) {
            if (sim.weather === 'mist' && !e.isBoss && dist > MIST_DETECT_RANGE) {
              // Mist reduces monster detection range: wander blindly until player approaches
              e.windupTimer = 0;
              const wanderAng = e.phaseAngle + sim.elapsedSeconds * 0.36;
              e.x += Math.cos(wanderAng) * e.speed * 0.32 * slowMult * edt;
              e.y += Math.sin(wanderAng) * e.speed * 0.32 * slowMult * edt;
            } else if (e.behaviorMode === 'swoop' && e.swoopVx !== undefined && e.swoopVy !== undefined) {
              e.x += e.swoopVx * edt;
              e.y += e.swoopVy * edt;
            } else if (e.behaviorMode === 'constrict') {
              const nx = dx / dist;
              const ny = dy / dist;
              e.x += nx * e.speed * edt;
              e.y += ny * e.speed * edt;
            } else if (e.behaviorMode === 'ranged') {
              if (dist > 250) {
                e.x += (dx / dist) * e.speed * edt;
                e.y += (dy / dist) * e.speed * edt;
              } else if (dist < 165) {
                e.x -= (dx / dist) * e.speed * 0.7 * edt;
                e.y -= (dy / dist) * e.speed * 0.7 * edt;
              }
              if (e.windupTimer > 0) {
                e.windupTimer -= edt;
                if (e.windupTimer <= 0) {
                  const aim = Math.atan2(dy, dx);
                  const bullets = waveDef.bulletHellRate >= 1.5 ? 3 : 1;
                  for (let b = 0; b < bullets; b++) {
                    const spread = (b - (bullets - 1) / 2) * 0.22;
                    const spd = 195 + currentMinute * 3;
                    sim.enemyBullets.push({
                      x: e.x,
                      y: e.y,
                      vx: Math.cos(aim + spread) * spd,
                      vy: Math.sin(aim + spread) * spd,
                      radius: 6,
                      damage: e.damage,
                      life: 3.4,
                      color: '#C084FC',
                    });
                  }
                  e.aiTimer = Math.max(1.5, 2.9 - waveDef.bulletHellRate * 0.45);
                }
              } else {
                e.aiTimer -= edt;
                if (e.aiTimer <= 0 && dist < 480) {
                  e.windupTimer = 0.65;
                }
              }
            } else if (e.behaviorMode === 'trapper') {
              if (dist > 145) {
                e.x += (dx / dist) * e.speed * slowMult * edt;
                e.y += (dy / dist) * e.speed * slowMult * edt;
              }
              if (e.windupTimer > 0) {
                e.windupTimer -= edt;
                if (e.windupTimer <= 0) {
                  if (playerDist <= 125 && sim.player.invulnTimer <= 0) {
                    sim.snareTimer = Math.max(sim.snareTimer, 1.45 * stats.slowDebuffFactor);
                    sim.groundFx.push({
                      kind: 'beam',
                      x: e.x,
                      y: e.y,
                      x2: sim.player.x,
                      y2: sim.player.y,
                      radius: 5,
                      maxRadius: 5,
                      life: 0.45,
                      maxLife: 0.45,
                      color: '#2DD4BF',
                    });
                    addFloatingText(sim, sim.player.x, sim.player.y - 26, 'ถูกจับ! เดินช้าลง', '#C084FC', 1.0);
                  } else {
                    const aim = Math.atan2(dy, dx);
                    sim.enemyBullets.push({
                      x: e.x,
                      y: e.y,
                      vx: Math.cos(aim) * 235,
                      vy: Math.sin(aim) * 235,
                      radius: 7.5,
                      damage: e.damage * 0.75,
                      life: 2.8,
                      isSnare: true,
                      color: '#2DD4BF',
                    });
                  }
                  e.aiTimer = 2.8;
                }
              } else {
                e.aiTimer -= edt;
                if (e.aiTimer <= 0 && dist < 310) {
                  e.windupTimer = 0.55;
                }
              }
            } else if (e.behaviorMode === 'shielder') {
              e.x += (dx / dist) * e.speed * slowMult * edt;
              e.y += (dy / dist) * e.speed * slowMult * edt;
            } else if (e.behaviorMode === 'bomber') {
              if (e.windupTimer > 0) {
                e.windupTimer -= edt;
                e.x += (dx / dist) * e.speed * 0.25 * edt;
                e.y += (dy / dist) * e.speed * 0.25 * edt;
                if (e.windupTimer <= 0) {
                  const blastR = 88;
                  sim.groundFx.push({
                    kind: 'explosion',
                    x: e.x,
                    y: e.y,
                    radius: 14,
                    maxRadius: blastR,
                    life: 0.35,
                    maxLife: 0.35,
                    color: '#F97316',
                  });
                  spawnParticles(sim, e.x, e.y, '#FB923C', 14, 160);
                  if (
                    Math.hypot(sim.player.x - e.x, sim.player.y - e.y) <= blastR &&
                    sim.player.invulnTimer <= 0 &&
                    sim.mageBarrierTimer <= 0
                  ) {
                    const voidlessDmgMult = sim.voidlessTimer > 0 ? 0.5 : 1;
                    const eventDmgMult =
                      sim.mapEvent === 'void_corruption'
                        ? 1.3
                        : sim.mapEvent === 'blood_curse'
                          ? 1.25
                          : 1;
                    const statueDmgMult = sim.statueEffect?.kind === 'curse' ? 1.25 : 1;
                    const preShieldBomberDmg = Math.max(
                      1,
                      Math.round(
                        (e.damage * eventDmgMult * statueDmgMult - stats.armor) *
                          voidlessDmgMult *
                          stats.damageTakenMult *
                          stats.bulletDamageTakenMult
                      )
                    );
                    const dmgTaken = absorbPlayerShield(sim, preShieldBomberDmg);
                    if (dmgTaken > 0) {
                      sim.player.hp -= dmgTaken;
                      sim.lastDamageFromReaper = Boolean(e.isReaper);
                      sim.noDamageTimer = 0;
                      sim.lastDamageSourceTh = `ระเบิดของ ${BESTIARY_BY_KIND[e.kind]?.nameTh || e.nameTh || e.kind}`;
                      breakCombo(sim);
                      triggerDamageFlash(sim, dmgTaken);
                      sim.player.invulnTimer = 0.5 + sim.cachedExtraInvulnOnHit;
                      sim.player.hitFlash = 0.16;
                      applyKnightHitVisual(sim, e.x);
                      sim.shakeTime = 0.16;
                      sim.shakeIntensity = 6;
                      sound.playPlayerHit();
                      addFloatingText(sim, sim.player.x, sim.player.y - 18, `-${dmgTaken}`, '#FB7185', 1.2);
                    } else {
                      sim.player.invulnTimer = 0.25;
                    }
                  }
                  e.hp = 0;
                  sim.enemies.splice(i, 1);
                  continue;
                }
              } else {
                e.x += (dx / dist) * e.speed * slowMult * edt;
                e.y += (dy / dist) * e.speed * slowMult * edt;
                if (dist <= 56) {
                  e.windupTimer = 0.55;
                }
              }
            } else if (e.behaviorMode === 'sniper') {
              // Ranged Archer: keeps 210..320px range, telegraphs aim line, fires fast arrows
              if (e.windupTimer > 0) {
                e.windupTimer -= edt;
                if (e.windupTimer <= 0) {
                  const aim = Math.atan2(playerDy, playerDx);
                  const spd = 335 + currentMinute * 3.5;
                  sim.enemyBullets.push({
                    x: e.x,
                    y: e.y,
                    vx: Math.cos(aim) * spd,
                    vy: Math.sin(aim) * spd,
                    radius: 5.5,
                    damage: e.damage,
                    life: 2.8,
                    color: '#4ADE80',
                  });
                  e.aiTimer = Math.max(1.4, 2.5 - waveDef.bulletHellRate * 0.25);
                }
              } else {
                if (dist > 320) {
                  e.x += (dx / dist) * e.speed * slowMult * edt;
                  e.y += (dy / dist) * e.speed * slowMult * edt;
                } else if (dist < 195) {
                  e.x -= (dx / dist) * e.speed * 0.78 * slowMult * edt;
                  e.y -= (dy / dist) * e.speed * 0.78 * slowMult * edt;
                } else {
                  // Strafe tangentially while stalking target
                  const tang = Math.atan2(dy, dx) + Math.PI * 0.5;
                  e.x += Math.cos(tang) * e.speed * 0.45 * slowMult * edt;
                  e.y += Math.sin(tang) * e.speed * 0.45 * slowMult * edt;
                }
                e.aiTimer -= edt;
                if (e.aiTimer <= 0 && playerDist < 540) {
                  e.windupTimer = 0.7;
                }
              }
            } else if (e.behaviorMode === 'zealot') {
              // Unstoppable Suicide Rusher: ignores ALL knockback, charges straight at player & detonates!
              e.kbVx = 0;
              e.kbVy = 0;
              if (e.windupTimer > 0) {
                e.windupTimer -= edt;
                e.x += (playerDx / playerDist) * e.speed * 0.78 * slowMult * edt;
                e.y += (playerDy / playerDist) * e.speed * 0.78 * slowMult * edt;
                if (e.windupTimer <= 0) {
                  const blastR = 84;
                  sim.groundFx.push({
                    kind: 'explosion',
                    x: e.x,
                    y: e.y,
                    radius: 14,
                    maxRadius: blastR,
                    life: 0.34,
                    maxLife: 0.34,
                    color: '#F43F5E',
                  });
                  spawnParticles(sim, e.x, e.y, '#FB7185', 16, 180);
                  if (Math.hypot(sim.player.x - e.x, sim.player.y - e.y) <= blastR) {
                    if (sim.mageBarrierTimer > 0) {
                      addFloatingText(sim, sim.player.x, sim.player.y - 24, 'บาเรียกันระเบิด!', '#6EE7B7', 1.0);
                    } else if (sim.player.invulnTimer <= 0) {
                      const curseMult =
                        sim.mapEvent === 'blood_curse'
                          ? 1.25
                          : sim.mapEvent === 'void_corruption'
                            ? 1.3
                            : 1;
                      const voidlessDmgMult = sim.voidlessTimer > 0 ? 0.5 : 1;
                      const statueDmgMult = sim.statueEffect?.kind === 'curse' ? 1.25 : 1;
                      const preShieldZealotDmg = Math.max(
                        1,
                        Math.round(
                          (e.damage * curseMult * statueDmgMult - stats.armor) *
                            voidlessDmgMult *
                            stats.damageTakenMult *
                            stats.bulletDamageTakenMult
                        )
                      );
                      const dmgTaken = absorbPlayerShield(sim, preShieldZealotDmg);
                      if (dmgTaken > 0) {
                        sim.player.hp -= dmgTaken;
                        sim.lastDamageFromReaper = Boolean(e.isReaper);
                        sim.noDamageTimer = 0;
                        sim.lastDamageSourceTh = `ระเบิดพลีชีพ ${BESTIARY_BY_KIND[e.kind]?.nameTh || e.kind}`;
                        breakCombo(sim);
                        triggerDamageFlash(sim, dmgTaken);
                        sim.player.invulnTimer = 0.5 + sim.cachedExtraInvulnOnHit;
                        sim.player.hitFlash = 0.16;
                        applyKnightHitVisual(sim, e.x);
                        sim.shakeTime = 0.18;
                        sim.shakeIntensity = 6.5;
                        sound.playPlayerHit();
                        addFloatingText(sim, sim.player.x, sim.player.y - 18, `-${dmgTaken}`, '#FB7185', 1.2);
                      } else {
                        sim.player.invulnTimer = 0.25;
                      }
                    }
                  }
                  e.hp = 0;
                  sim.enemies.splice(i, 1);
                  continue;
                }
              } else {
                e.x += (playerDx / playerDist) * e.speed * slowMult * edt;
                e.y += (playerDy / playerDist) * e.speed * slowMult * edt;
                if (playerDist <= 48) {
                  e.windupTimer = 0.42;
                }
              }
            } else if (e.behaviorMode === 'charger') {
              // Armored Bull Charger: telegraphs dash path, then charges rapidly!
              if (e.dashActiveTimer && e.dashActiveTimer > 0) {
                e.dashActiveTimer -= edt;
                const ddx = e.dashDirX ?? dx / dist;
                const ddy = e.dashDirY ?? dy / dist;
                e.x += ddx * 365 * slowMult * edt;
                e.y += ddy * 365 * slowMult * edt;
                if (e.dashActiveTimer <= 0) {
                  e.aiTimer = 2.4;
                }
              } else if (e.windupTimer > 0) {
                e.windupTimer -= edt;
                if (e.windupTimer <= 0) {
                  e.dashActiveTimer = 0.55;
                }
              } else {
                e.x += (dx / dist) * e.speed * slowMult * edt;
                e.y += (dy / dist) * e.speed * slowMult * edt;
                e.aiTimer -= edt;
                if (e.aiTimer <= 0 && dist < 330 && dist > 65) {
                  e.windupTimer = 0.72;
                  e.dashDirX = dx / dist;
                  e.dashDirY = dy / dist;
                }
              }
            } else if (e.behaviorMode === 'boss') {
              if (e.buffs.includes('berserk') && !e.berserkActive && e.hp <= e.maxHp * 0.5) {
                e.berserkActive = true;
                e.speed *= 1.38;
                e.damage *= 1.28;
                spawnParticles(sim, e.x, e.y, '#F97316', 18, 170);
                addFloatingText(sim, e.x, e.y - e.radius - 10, 'บอสเดือดคลั่ง!', '#F97316', 1.25);
              }

              if (e.buffs.length > 0) {
                e.buffTimer -= edt;
                if (e.buffTimer <= 0) {
                  e.buffTimer = 2.0;
                  e.buffCycle += 1;

                  if (e.buffs.includes('vampiric') && e.hp < e.maxHp) {
                    const regen = Math.max(5, Math.round(e.maxHp * 0.006));
                    e.hp = Math.min(e.maxHp, e.hp + regen);
                    addFloatingText(sim, e.x, e.y - e.radius, `+${regen}`, '#FB7185', 0.9);
                  }

                  if (e.buffs.includes('iron_skin') && e.buffCycle % 3 === 0 && playerDist < 500) {
                    sim.groundFx.push({
                      kind: 'shockwave',
                      x: e.x,
                      y: e.y,
                      radius: e.radius,
                      maxRadius: e.radius + 90,
                      life: 0.35,
                      maxLife: 0.35,
                      color: '#94A3B8',
                    });
                    for (let k = 0; k < 6; k++) {
                      const a = e.phaseAngle + (k * Math.PI * 2) / 6;
                      sim.enemyBullets.push({
                        x: e.x,
                        y: e.y,
                        vx: Math.cos(a) * 180,
                        vy: Math.sin(a) * 180,
                        radius: 6,
                        damage: e.damage * 0.7,
                        life: 3.0,
                        color: '#CBD5E1',
                        fromReaper: e.isReaper,
                      });
                    }
                  }

                  if (e.buffs.includes('summoner') && e.buffCycle % 4 === 0 && sim.enemies.length < 130) {
                    const summonKinds: EnemyKind[] = ['stalker', 'cultist', 'bat'];
                    for (let s = 0; s < 3; s++) {
                      const sa = Math.random() * Math.PI * 2;
                      const sx = e.x + Math.cos(sa) * 65;
                      const sy = e.y + Math.sin(sa) * 65;
                      const skind = summonKinds[s % summonKinds.length];
                      sim.enemies.push(
                        createEnemy(sim, skind, sx, sy, currentMinute, biome.hpMult, biome.speedMult)
                      );
                    }
                    sim.groundFx.push({
                      kind: 'warp',
                      x: e.x,
                      y: e.y,
                      radius: 14,
                      maxRadius: 85,
                      life: 0.4,
                      maxLife: 0.4,
                      color: '#A855F7',
                    });
                  }

                  if (e.buffs.includes('blinker') && e.buffCycle % 3 === 0 && playerDist < 680) {
                    const flankAngle = Math.random() * Math.PI * 2;
                    e.x = sim.player.x + Math.cos(flankAngle) * 235;
                    e.y = sim.player.y + Math.sin(flankAngle) * 235;
                    sim.groundFx.push({
                      kind: 'warp',
                      x: e.x,
                      y: e.y,
                      radius: 12,
                      maxRadius: 68,
                      life: 0.35,
                      maxLife: 0.35,
                      color: '#22D3EE',
                    });
                    const aimAmbush = Math.atan2(sim.player.y - e.y, sim.player.x - e.x);
                    for (let k = -2; k <= 2; k++) {
                      const a = aimAmbush + k * 0.24;
                      sim.enemyBullets.push({
                        x: e.x,
                        y: e.y,
                        vx: Math.cos(a) * 225,
                        vy: Math.sin(a) * 225,
                        radius: 6.5,
                        damage: e.damage * 0.78,
                        life: 3.4,
                        color: '#22D3EE',
                      });
                    }
                  }
                }
              }

              const cdMult = (e.buffs.includes('frenzy') ? 0.75 : 1) * (e.berserkActive ? 0.78 : 1);
              if (e.windupTimer > 0) {
                e.windupTimer -= edt;
                e.x += (playerDx / playerDist) * e.speed * 0.25 * edt;
                e.y += (playerDy / playerDist) * e.speed * 0.25 * edt;
                if (e.windupTimer <= 0) {
                  const hasBarrage = e.buffs.includes('barrage');
                  const aim = Math.atan2(playerDy, playerDx);
                  e.phaseAngle += 0.45;
                  if (e.kind === 'boss_cerberus') {
                    // Cerberus Trio: Agile lunge + 3-way crimson claw burst
                    e.kbVx += Math.cos(aim) * 240;
                    e.kbVy += Math.sin(aim) * 240;
                    for (let b = -1; b <= 1; b++) {
                      const a = aim + b * 0.24;
                      sim.enemyBullets.push({
                        x: e.x,
                        y: e.y,
                        vx: Math.cos(a) * 235,
                        vy: Math.sin(a) * 235,
                        radius: 6.5,
                        damage: e.damage * 0.8,
                        life: 3.4,
                        color: '#EF4444',
                      });
                    }
                    e.aiTimer = 1.9 * cdMult;
                  } else if (e.kind === 'boss_judgement') {
                    // Judgement: High-speed crisscrossing Judgment Chains + steel gauntlet slam
                    sim.groundFx.push({
                      kind: 'shockwave',
                      x: e.x,
                      y: e.y,
                      radius: e.radius,
                      maxRadius: e.radius + 115,
                      life: 0.35,
                      maxLife: 0.35,
                      color: '#67E8F9',
                    });
                    for (let b = -2; b <= 2; b++) {
                      const a = aim + b * 0.19;
                      sim.enemyBullets.push({
                        x: e.x,
                        y: e.y,
                        vx: Math.cos(a) * 290,
                        vy: Math.sin(a) * 290,
                        radius: 7,
                        damage: e.damage * 0.9,
                        life: 3.8,
                        color: b % 2 === 0 ? '#67E8F9' : '#FB7185',
                      });
                    }
                    const chainRing = 8 + (hasBarrage ? 6 : 0);
                    for (let b = 0; b < chainRing; b++) {
                      const a = e.phaseAngle + (b * Math.PI * 2) / chainRing;
                      sim.enemyBullets.push({
                        x: e.x,
                        y: e.y,
                        vx: Math.cos(a) * 195,
                        vy: Math.sin(a) * 195,
                        radius: 6.5,
                        damage: e.damage * 0.8,
                        life: 4.0,
                        color: '#CBD5E1',
                      });
                    }
                    e.aiTimer = 2.05 * cdMult;
                  } else if (e.kind === 'boss_beelzebub') {
                    // Beelzebub: Double-helix abyssal fly spiral + swarm summoning
                    const helixCount = 12 + (hasBarrage ? 6 : 0);
                    for (let b = 0; b < helixCount; b++) {
                      const a = e.phaseAngle + (b * Math.PI * 2) / helixCount;
                      const spd = b % 2 === 0 ? 215 : 165;
                      sim.enemyBullets.push({
                        x: e.x,
                        y: e.y,
                        vx: Math.cos(a) * spd,
                        vy: Math.sin(a) * spd,
                        radius: 6.8,
                        damage: e.damage * 0.82,
                        life: 4.4,
                        color: b % 2 === 0 ? '#C084FC' : '#E11D48',
                      });
                    }
                    e.buffCycle += 1;
                    if (e.buffCycle % 2 === 0 && sim.enemies.length < 130) {
                      for (let f = 0; f < 2; f++) {
                        const fa = aim + (f === 0 ? -0.9 : 0.9);
                        sim.enemies.push(
                          createEnemy(
                            sim,
                            'bat',
                            e.x + Math.cos(fa) * 48,
                            e.y + Math.sin(fa) * 48,
                            currentMinute,
                            biome.hpMult,
                            biome.speedMult
                          )
                        );
                      }
                    }
                    e.aiTimer = 1.95 * cdMult;
                  } else if (e.kind === 'boss_lucifer') {
                    // Lucifer: Royal Pentagram Crimson Ring + 5-dagger targeted fan + skeleton guards
                    const ringCount = 15 + (hasBarrage ? 7 : 0);
                    for (let b = 0; b < ringCount; b++) {
                      const a = aim + e.phaseAngle + (b * Math.PI * 2) / ringCount;
                      sim.enemyBullets.push({
                        x: e.x,
                        y: e.y,
                        vx: Math.cos(a) * 225,
                        vy: Math.sin(a) * 225,
                        radius: 7.5,
                        damage: e.damage * 0.88,
                        life: 4.3,
                        color: '#DC2626',
                      });
                    }
                    for (let b = -2; b <= 2; b++) {
                      const a = aim + b * 0.16;
                      sim.enemyBullets.push({
                        x: e.x,
                        y: e.y,
                        vx: Math.cos(a) * 280,
                        vy: Math.sin(a) * 280,
                        radius: 7,
                        damage: e.damage * 0.92,
                        life: 3.6,
                        color: '#FBBF24',
                      });
                    }
                    e.buffCycle += 1;
                    if (e.buffCycle % 3 === 0 && sim.enemies.length < 130) {
                      for (let g = 0; g < 2; g++) {
                        const ga = aim + (g === 0 ? -1.1 : 1.1);
                        sim.enemies.push(
                          createEnemy(
                            sim,
                            'cultist',
                            e.x + Math.cos(ga) * 58,
                            e.y + Math.sin(ga) * 58,
                            currentMinute,
                            biome.hpMult,
                            biome.speedMult
                          )
                        );
                      }
                    }
                    e.aiTimer = 1.85 * cdMult;
                  } else if (e.isReaper) {
                    const ringCount = 18 + (hasBarrage ? 8 : 0);
                    for (let b = 0; b < ringCount; b++) {
                      const a = aim + e.phaseAngle + (b * Math.PI * 2) / ringCount;
                      const spd = 255 * (e.berserkActive ? 1.15 : 1);
                      sim.enemyBullets.push({
                        x: e.x,
                        y: e.y,
                        vx: Math.cos(a) * spd,
                        vy: Math.sin(a) * spd,
                        radius: 9,
                        damage: e.damage * 0.85,
                        life: 4.2,
                        color: '#F43F5E',
                        fromReaper: true,
                      });
                    }
                    e.aiTimer = 1.45 * cdMult;
                  } else {
                    const ringCount = (e.isMajorBoss ? 14 : 9) + (hasBarrage ? 8 : 0);
                    for (let b = 0; b < ringCount; b++) {
                      const a = aim + e.phaseAngle + (b * Math.PI * 2) / ringCount;
                      const spd = 210 * (e.berserkActive ? 1.15 : 1);
                      sim.enemyBullets.push({
                        x: e.x,
                        y: e.y,
                        vx: Math.cos(a) * spd,
                        vy: Math.sin(a) * spd,
                        radius: 7,
                        damage: e.damage * 0.85,
                        life: 4.2,
                        color: hasBarrage ? '#F97316' : '#FB7185',
                        fromReaper: false,
                      });
                    }
                    if (hasBarrage) {
                      for (let b = 0; b < 10; b++) {
                        const a = aim - e.phaseAngle + (b * Math.PI * 2) / 10;
                        sim.enemyBullets.push({
                          x: e.x,
                          y: e.y,
                          vx: Math.cos(a) * 175,
                          vy: Math.sin(a) * 175,
                          radius: 6,
                          damage: e.damage * 0.75,
                          life: 4.5,
                          color: '#C084FC',
                        });
                      }
                    }
                    e.aiTimer = (e.isMajorBoss ? 2.1 : 2.7) * cdMult;
                  }
                }
              } else if (e.isReaper && (e.reaperSweepCastTimer || 0) > 0) {
                // The Reaper is actively channeling Scythe Judgment Sweep!
                e.reaperSweepCastTimer = Math.max(0, (e.reaperSweepCastTimer || 0) - edt);
                e.windupTimer = Math.max(e.windupTimer, 0.45);
                if (e.reaperSweepCastTimer <= 0) {
                  e.windupTimer = 0;
                  e.reaperSweepPostTimer = 0.38;
                  e.reaperSweepCooldown = (e.berserkActive ? 6.2 : 7.8) * cdMult;
                  const sweepAng = e.reaperSweepAngle ?? Math.atan2(playerDy, playerDx);
                  const sweepArc = e.reaperSweepArc ?? Math.PI * 0.98;
                  const sweepRad = e.reaperSweepRadius ?? 360;

                  sound.playSlash(true);
                  sim.shakeTime = Math.max(sim.shakeTime, 0.32);
                  sim.shakeIntensity = Math.max(sim.shakeIntensity, 8);
                  spawnParticles(sim, e.x, e.y, '#F43F5E', 24, 240);

                  // Crescent scythe wave projectiles along the sweep arc
                  for (let k = -3; k <= 3; k++) {
                    const ba = sweepAng + (k / 3) * (sweepArc * 0.46);
                    sim.enemyBullets.push({
                      x: e.x + Math.cos(ba) * 32,
                      y: e.y + Math.sin(ba) * 32,
                      vx: Math.cos(ba) * 310,
                      vy: Math.sin(ba) * 310,
                      radius: 11,
                      damage: e.damage * 0.95,
                      life: 1.4,
                      color: '#FB7185',
                      fromReaper: true,
                    });
                  }

                  // Check if player stands inside sweep sector
                  const pAng = Math.atan2(sim.player.y - e.y, sim.player.x - e.x);
                  const angDiff = Math.abs(Math.atan2(Math.sin(pAng - sweepAng), Math.cos(pAng - sweepAng)));
                  if (
                    playerDist <= sweepRad + sim.player.radius &&
                    angDiff <= sweepArc * 0.5 &&
                    sim.player.invulnTimer <= 0 &&
                    !timeStopped
                  ) {
                    if (sim.raceClass === 'knight' && sim.parryWindowTimer > 0) {
                      executeKnightParry();
                    } else {
                      const curseMult =
                        sim.mapEvent === 'blood_curse'
                          ? 1.25
                          : sim.mapEvent === 'void_corruption'
                            ? 1.3
                            : 1;
                      const voidlessDmgMult = sim.voidlessTimer > 0 ? 0.5 : 1;
                      const statueDmgMult = sim.statueEffect?.kind === 'curse' ? 1.25 : 1;
                      const preShieldSweepDmg = Math.max(
                        1,
                        Math.round(
                          (e.damage * 1.65 * curseMult * statueDmgMult - stats.armor) *
                            voidlessDmgMult *
                            stats.damageTakenMult
                        )
                      );
                      const dmgTaken = absorbPlayerShield(sim, preShieldSweepDmg);
                      if (dmgTaken > 0) {
                        sim.player.hp -= dmgTaken;
                        sim.lastDamageFromReaper = true;
                        sim.noDamageTimer = 0;
                        sim.lastDamageSourceTh = 'เคียวพิพากษากวาดล้าง (The Reaper)';
                        breakCombo(sim);
                        triggerDamageFlash(sim, dmgTaken);
                        sim.player.invulnTimer = 0.65 + sim.cachedExtraInvulnOnHit;
                        sim.player.hitFlash = 0.22;
                        applyKnightHitVisual(sim, e.x);
                        sound.playPlayerHit();
                        addFloatingText(sim, sim.player.x, sim.player.y - 24, `-${dmgTaken} กวาดล้าง!`, '#F43F5E', 1.3);
                      } else {
                        sim.player.invulnTimer = 0.35;
                      }
                      sim.player.x += Math.cos(pAng) * 42;
                      sim.player.y += Math.sin(pAng) * 42;
                    }
                  }

                  // Sweep also cleaves Necromancer Minions inside sector
                  for (let mi = 0; mi < sim.necroMinions.length; mi++) {
                    const m = sim.necroMinions[mi];
                    if (m.hp <= 0) continue;
                    const md = Math.hypot(m.x - e.x, m.y - e.y);
                    const mAng = Math.atan2(m.y - e.y, m.x - e.x);
                    const mDiff = Math.abs(Math.atan2(Math.sin(mAng - sweepAng), Math.cos(mAng - sweepAng)));
                    if (md <= sweepRad + m.radius && mDiff <= sweepArc * 0.5) {
                      m.hp = Math.max(0, m.hp - Math.round(e.damage * 0.85 * (1 - m.armorRatio)));
                      m.hitFlash = 0.16;
                    }
                  }
                }
              } else {
                if (e.isReaper && (e.reaperSweepPostTimer || 0) > 0) {
                  e.reaperSweepPostTimer = Math.max(0, (e.reaperSweepPostTimer || 0) - edt);
                }
                if (e.isReaper) {
                  e.reaperSweepCooldown = Math.max(0, (e.reaperSweepCooldown ?? 5.0) - edt);
                }
                e.x += (playerDx / playerDist) * e.speed * edt;
                e.y += (playerDy / playerDist) * e.speed * edt;
                e.aiTimer -= edt;
                if (e.isReaper && (e.reaperSweepCooldown || 0) <= 0 && playerDist < 410) {
                  const castDur = e.berserkActive ? 1.85 : 2.2;
                  e.reaperSweepCastTimer = castDur;
                  e.reaperSweepCastMax = castDur;
                  e.reaperSweepAngle = Math.atan2(playerDy, playerDx);
                  e.reaperSweepArc = e.berserkActive ? Math.PI * 1.06 : Math.PI * 0.95;
                  e.reaperSweepRadius = e.berserkActive ? 385 : 355;
                  e.windupTimer = castDur;
                  sound.playBossWarning();
                  addFloatingText(sim, e.x, e.y - e.radius - 18, 'ร่าย: เคียวพิพากษากวาดล้าง!', '#FB7185', 1.25);
                } else if (e.aiTimer <= 0 && playerDist < 520) {
                  e.windupTimer = e.buffs.includes('frenzy') ? 0.55 : 0.75;
                }
              }
            } else {
              e.x += (dx / dist) * e.speed * slowMult * edt;
              e.y += (dy / dist) * e.speed * slowMult * edt;
            }
          }

          // Knockback velocity decay (still feels crisp when hitting frozen mobs!)
          if (Math.abs(e.kbVx) > 0.5 || Math.abs(e.kbVy) > 0.5) {
            e.x += e.kbVx * dt;
            e.y += e.kbVy * dt;
            e.kbVx *= Math.pow(0.08, dt);
            e.kbVy *= Math.pow(0.08, dt);
          }

          // Orbiting Shield, FireOrb & Chain Collisions
          for (const sp of shieldPositions) {
            if (Math.hypot(e.x - sp.x, e.y - sp.y) <= e.radius + sp.r) {
              if (e.hitFlash <= 0) {
                damageEnemy(sim, e, sp.dmg, 'shield', 180, e.x - sp.x, e.y - sp.y, stats.greedMult);
              }
            }
          }
          for (const fp of fireOrbPositions) {
            if (Math.hypot(e.x - fp.x, e.y - fp.y) <= e.radius + fp.r) {
              if (e.hitFlash <= 0) {
                damageEnemy(sim, e, fp.dmg, 'fireorb', 70, e.x - fp.x, e.y - fp.y, stats.greedMult);
              }
            }
          }
          for (const cp of chainPositions) {
            if (Math.hypot(e.x - cp.x, e.y - cp.y) <= e.radius + cp.r) {
              if (e.hitFlash <= 0) {
                damageEnemy(sim, e, cp.dmg, 'chain', 220, e.x - cp.x, e.y - cp.y, stats.greedMult);
              }
            }
          }

          // Player Contact Damage (blocked by Global Time Stop, Chrono Well freeze, Mage Wind Barrier, Boss Stagger, OR Phasing!)
          if (
            (!timeStopped || e.isBoss) &&
            !e.chronoFrozenThisFrame &&
            !isBossStaggered &&
            !(stats.phaseSmallMonsters && !e.isBoss) &&
            playerDist < sim.player.radius + e.radius - 2 &&
            sim.player.invulnTimer <= 0
          ) {
            if (sim.raceClass === 'knight' && sim.parryWindowTimer > 0 && e.windupTimer > 0) {
              executeKnightParry();
            } else if (sim.mageBarrierTimer > 0) {
              sim.player.invulnTimer = 0.25;
              addFloatingText(sim, sim.player.x, sim.player.y - 24, 'บาเรียป้องกัน!', '#6EE7B7', 0.95);
            } else {
              const bloodMult =
                (sim.weather === 'blood_rain' ? 1.12 : 1) *
                (sim.mapEvent === 'blood_curse'
                  ? 1.25
                  : sim.mapEvent === 'void_corruption'
                    ? 1.3
                    : 1);
              const voidlessDmgMult = sim.voidlessTimer > 0 ? 0.5 : 1;
              const statueDmgMult = sim.statueEffect?.kind === 'curse' ? 1.25 : 1;
              const preShieldContactDmg = Math.max(
                1,
                Math.round(
                  (e.damage * 0.78 * bloodMult * statueDmgMult - stats.armor) *
                    voidlessDmgMult *
                    stats.damageTakenMult
                )
              );
              const dmgTaken = absorbPlayerShield(sim, preShieldContactDmg);
              if (dmgTaken > 0) {
                sim.player.hp -= dmgTaken;
                sim.lastDamageFromReaper = Boolean(e.isReaper);
                sim.noDamageTimer = 0;
                sim.lastDamageSourceTh = e.nameTh || BESTIARY_BY_KIND[e.kind]?.nameTh || e.kind;
                breakCombo(sim);
                triggerDamageFlash(sim, dmgTaken);
                sim.player.invulnTimer = 0.5 + sim.cachedExtraInvulnOnHit;
                sim.player.hitFlash = 0.16;
                applyKnightHitVisual(sim, e.x);
                sim.shakeTime = 0.15;
                sim.shakeIntensity = 5;
                sound.playPlayerHit();
                addFloatingText(sim, sim.player.x, sim.player.y - 18, `-${dmgTaken}`, '#FB7185', 1.15);
                if (raceId === 'orc' && sim.orcBerserkTimer <= 0) {
                  sim.orcRage = Math.min(ORC_RAGE_MAX, sim.orcRage + 14);
                }
                // Frost Mantle Permanent Gear: freeze attacker on contact
                for (const uid of Object.values(saveRef.current.equippedGear)) {
                  if (!uid) continue;
                  const gIt = saveRef.current.gearInventory.find((it) => it.uid === uid);
                  if (gIt && PERMANENT_GEAR_CATALOG[gIt.defId]?.effectKind === 'frost_mantle') {
                    e.freezeTimer = Math.max(e.freezeTimer || 0, 1.8);
                    break;
                  }
                }
              } else {
                sim.player.invulnTimer = 0.25;
              }

              if (sim.cachedThornBurstOnHit) {
                const thornR = 115 * stats.areaMult;
                const thornDmg = (26 + sim.player.level * 2.5 + stats.armor * 3) * stats.damageMult;
                sim.groundFx.push({
                  kind: 'shockwave',
                  x: sim.player.x,
                  y: sim.player.y,
                  radius: 14,
                  maxRadius: thornR,
                  life: 0.28,
                  maxLife: 0.28,
                  color: '#FB7185',
                });
                for (const other of sim.enemies) {
                  if (other.hp <= 0) continue;
                  const tdx = other.x - sim.player.x;
                  const tdy = other.y - sim.player.y;
                  if (Math.hypot(tdx, tdy) <= thornR + other.radius) {
                    damageEnemy(sim, other, thornDmg, null, 240, tdx, tdy, stats.greedMult);
                  }
                }
              }
            }
          }
        }

        // Soft separation between normal enemies for crisp horde readability
        const len = sim.enemies.length;
        for (let i = 0; i < len; i++) {
          const a = sim.enemies[i];
          if (a.behaviorMode === 'swoop') continue;
          for (let j = i + 1; j < Math.min(len, i + 12); j++) {
            const b = sim.enemies[j];
            if (b.behaviorMode === 'swoop') continue;
            const dx = b.x - a.x;
            const dy = b.y - a.y;
            const minD = a.radius + b.radius;
            const d2 = dx * dx + dy * dy;
            if (d2 > 0.01 && d2 < minD * minD) {
              const d = Math.sqrt(d2);
              const overlap = (minD - d) * 0.28;
              const nx = dx / d;
              const ny = dy / d;
              a.x -= nx * overlap;
              a.y -= ny * overlap;
              b.x += nx * overlap;
              b.y += ny * overlap;
            }
          }
        }

        // M1 Post-Separation Obstacle Collision for Ground Non-Boss Mobs + Secret Room Clamping
        for (let i = 0; i < len; i++) {
          const en = sim.enemies[i];
          if (sim.inSecretRoom) {
            en.x = Math.max(-SECRET_ROOM_HALF_W + 44, Math.min(SECRET_ROOM_HALF_W - 44, en.x));
            en.y = Math.max(-SECRET_ROOM_HALF_H + 44, Math.min(SECRET_ROOM_HALF_H - 44, en.y));
            continue;
          }
          if (en.isBoss || FLYING_ENEMY_KINDS.has(en.kind)) continue;
          if (Math.abs(en.x - sim.player.x) > 900 || Math.abs(en.y - sim.player.y) > 900) continue;
          resolveCircleVsObstacles(en, en.radius, sim.frameObstacles, 0.25);
        }

        // Update Enemy Bullets (Bullet-Hell — paused during Time Stop & Chrono Wells! Modified by Map Events!)
        const bulletEventSpeedMult =
          sim.mapEvent === 'god_blessing' ? 0.75 : sim.mapEvent === 'blood_curse' ? 1.22 : 1;
        const bdt = timeStopped ? 0 : dt * bulletEventSpeedMult;
        for (let i = sim.enemyBullets.length - 1; i >= 0; i--) {
          const b = sim.enemyBullets[i];
          if (sim.chronoWells.length > 0) {
            const insideWell = sim.chronoWells.find(
              (w) => Math.hypot(b.x - w.x, b.y - w.y) <= w.radius
            );
            if (insideWell) {
              b.frozenByWellId = insideWell.id;
            } else if (b.frozenByWellId !== undefined) {
              const wellStillAlive = sim.chronoWells.some((w) => w.id === b.frozenByWellId);
              if (!wellStillAlive) {
                sim.enemyBullets.splice(i, 1);
                continue;
              }
              b.frozenByWellId = undefined;
            }
          } else if (b.frozenByWellId !== undefined) {
            sim.enemyBullets.splice(i, 1);
            continue;
          }

          const bStepDt = b.frozenByWellId !== undefined ? 0 : bdt;
          b.life -= bStepDt;
          if (b.life <= 0) {
            sim.enemyBullets.splice(i, 1);
            continue;
          }
          b.x += b.vx * bStepDt;
          b.y += b.vy * bStepDt;

          if (!sim.inSecretRoom) {
            let hitObs = false;
            for (const o of sim.frameObstacles) {
              if (Math.hypot(b.x - o.x, b.y - o.y) <= o.r + b.radius) {
                hitObs = true;
                spawnParticles(sim, b.x, b.y, '#CBD5E1', 3, 55);
                break;
              }
            }
            if (hitObs) {
              sim.enemyBullets.splice(i, 1);
              continue;
            }
          }

          // Blocked by Aegis Shield weapon or Mage Wind Barrier!
          let blocked = false;
          if (
            sim.mageBarrierTimer > 0 &&
            Math.hypot(b.x - sim.player.x, b.y - sim.player.y) <= sim.player.radius + b.radius + 26
          ) {
            blocked = true;
            spawnParticles(sim, b.x, b.y, '#6EE7B7', 4, 85);
          }
          if (!blocked) {
            for (const sp of shieldPositions) {
              if (Math.hypot(b.x - sp.x, b.y - sp.y) <= b.radius + sp.r + 3) {
                blocked = true;
                sound.playShieldBlock();
                spawnParticles(sim, b.x, b.y, '#34D399', 5, 85);
                break;
              }
            }
          }
          if (blocked) {
            sim.enemyBullets.splice(i, 1);
            continue;
          }

          // Hit player (or Knight Perfect Parry!)
          if (
            !timeStopped &&
            b.frozenByWellId === undefined &&
            Math.hypot(b.x - sim.player.x, b.y - sim.player.y) <= sim.player.radius + b.radius - 2 &&
            sim.player.invulnTimer <= 0
          ) {
            if (sim.raceClass === 'knight' && sim.parryWindowTimer > 0) {
              executeKnightParry();
              continue;
            }
            const curseMult =
              sim.mapEvent === 'blood_curse'
                ? 1.25
                : sim.mapEvent === 'void_corruption'
                  ? 1.3
                  : 1;
            const voidlessDmgMult = sim.voidlessTimer > 0 ? 0.5 : 1;
            const statueDmgMult = sim.statueEffect?.kind === 'curse' ? 1.25 : 1;
            const preShieldBulletDmg = Math.max(
              1,
              Math.round(
                (b.damage * 0.78 * curseMult * statueDmgMult - stats.armor) *
                  voidlessDmgMult *
                  stats.damageTakenMult *
                  stats.bulletDamageTakenMult
              )
            );
            const dmgTaken = absorbPlayerShield(sim, preShieldBulletDmg);
            if (dmgTaken > 0) {
              sim.player.hp -= dmgTaken;
              sim.lastDamageFromReaper = Boolean(b.fromReaper);
              sim.noDamageTimer = 0;
              sim.lastDamageSourceTh = 'กระสุนเวทย์ของอสูร';
              breakCombo(sim);
              triggerDamageFlash(sim, dmgTaken);
              sim.player.invulnTimer = 0.5 + sim.cachedExtraInvulnOnHit;
              sim.player.hitFlash = 0.16;
              applyKnightHitVisual(sim, b.x);
              sim.shakeTime = 0.14;
              sim.shakeIntensity = 5;
              sound.playPlayerHit();
              addFloatingText(sim, sim.player.x, sim.player.y - 18, `-${dmgTaken}`, '#FB7185', 1.15);
              if (raceId === 'orc' && sim.orcBerserkTimer <= 0) {
                sim.orcRage = Math.min(ORC_RAGE_MAX, sim.orcRage + 14);
              }
              if (b.isSnare) {
                sim.snareTimer = Math.max(sim.snareTimer, 1.35 * stats.slowDebuffFactor);
                addFloatingText(sim, sim.player.x, sim.player.y - 34, 'ติดกับดัก!', '#2DD4BF', 0.95);
              }
            } else {
              sim.player.invulnTimer = 0.25;
            }
            if (sim.cachedThornBurstOnHit) {
              const thornR = 115 * stats.areaMult;
              const thornDmg = (26 + sim.player.level * 2.5 + stats.armor * 3) * stats.damageMult;
              sim.groundFx.push({
                kind: 'shockwave',
                x: sim.player.x,
                y: sim.player.y,
                radius: 14,
                maxRadius: thornR,
                life: 0.28,
                maxLife: 0.28,
                color: '#FB7185',
              });
              for (const other of sim.enemies) {
                if (other.hp <= 0) continue;
                const tdx = other.x - sim.player.x;
                const tdy = other.y - sim.player.y;
                if (Math.hypot(tdx, tdy) <= thornR + other.radius) {
                  damageEnemy(sim, other, thornDmg, null, 240, tdx, tdy, stats.greedMult);
                }
              }
            }
            sim.enemyBullets.splice(i, 1);
          }
        }

        // Vampire Lord Last Rite (<15% HP emergency invuln + blood nova) & Demon Lord Ashen Revive!
        if (
          sim.raceClass === 'vampire_lord' &&
          sim.player.hp > 0 &&
          sim.player.hp < sim.player.maxHp * 0.15 &&
          sim.vampireLastRiteCd <= 0
        ) {
          sim.vampireLastRiteCd = sim.ultAscended ? 40 : 60;
          sim.player.invulnTimer = Math.max(sim.player.invulnTimer, 1.5);
          sim.groundFx.push({
            kind: 'explosion',
            x: sim.player.x,
            y: sim.player.y,
            radius: 18,
            maxRadius: 210,
            life: 0.4,
            maxLife: 0.4,
            color: '#E11D48',
          });
          spawnParticles(sim, sim.player.x, sim.player.y, '#FB7185', 22, 200);
          const riteDmg = (95 + Math.min(sim.player.level, 40) * 4) * stats.damageMult;
          for (const en of sim.enemies) {
            if (en.hp > 0 && Math.hypot(en.x - sim.player.x, en.y - sim.player.y) <= 210 + en.radius) {
              damageEnemy(sim, en, riteDmg, null, 340, en.x - sim.player.x, en.y - sim.player.y, stats.greedMult);
            }
          }
          sound.playBossChest();
          addFloatingText(sim, sim.player.x, sim.player.y - 34, 'พิธีสุดท้าย! อมตะ 1.5 วิ', '#FB7185', 1.25);
        }

        // Dark Moon Altar Row 4A: Emergency Invuln (<20% HP, once per run)
        if (
          !sim.altarEmergencyUsed &&
          saveRef.current.talents.row4?.branch === 'A' &&
          saveRef.current.talents.row4.rank > 0 &&
          sim.player.hp > 0 &&
          sim.player.hp < sim.player.maxHp * 0.2
        ) {
          sim.altarEmergencyUsed = true;
          sim.player.invulnTimer = Math.max(sim.player.invulnTimer, 2.0);
          sim.enemyBullets = [];
          sim.groundFx.push({
            kind: 'shockwave',
            x: sim.player.x,
            y: sim.player.y,
            radius: 14,
            maxRadius: 190,
            life: 0.35,
            maxLife: 0.35,
            color: '#FACC15',
          });
          addFloatingText(sim, sim.player.x, sim.player.y - 34, 'นิรันดร์กาลฉุกเฉิน! อมตะ 2 วิ', '#FACC15', 1.2);
          sound.playBossChest();
        }

        // Check Player Death (Chronos Rewind -> Demon Lord Ashen Revive -> Training Grounds Revive -> Game Over)
        if (sim.player.hp <= 0 && !sim.runEnded) {
          if (sim.raceClass === 'time_god' && sim.rewindReady && sim.rewindUsedCount < 3) {
            sim.rewindReady = false;
            sim.rewindUsedCount += 1;
            sim.rewindChargeKills = 0;
            sim.rewindChargeTarget = sim.rewindUsedCount === 1 ? 250 : 600;
            sim.rewindLockTimer = 45;
            sim.rewindVisualTimer = 0.5;

            const healPct = sim.lastDamageFromReaper ? 0.5 : 1.0;
            sim.player.hp = Math.max(1, Math.round(sim.player.maxHp * healPct));
            sim.player.invulnTimer = 2.0;
            sim.player.hitFlash = 0.25;
            sim.shakeTime = 0.3;
            sim.shakeIntensity = 7;

            // Rewind position to ~2 seconds ago (and push out of obstacles)
            const targetTime = sim.elapsedSeconds - 2.0;
            let bestPos = sim.playerPosHistory[0];
            for (const entry of sim.playerPosHistory) {
              if (entry.t <= targetTime) {
                bestPos = entry;
              } else {
                break;
              }
            }
            if (bestPos) {
              sim.player.x = bestPos.x;
              sim.player.y = bestPos.y;
              if (!sim.inSecretRoom) {
                resolveCircleVsObstacles(sim.player, sim.player.radius, sim.frameObstacles, 0.25);
              }
            }

            // Trigger instant Global Time Stop WITHOUT consuming timeStopCooldown
            const { stopDuration } = computeTimeGodStopTiming(stats.cooldownMult);
            sim.timeStopTimer = Math.max(sim.timeStopTimer, stopDuration);
            sim.timeStopTickTimer = 0.5;
            sim.timeStopCount += 1;
            sound.setTimeStopMuffled(true);
            sound.playChronoRewind();
            triggerAbilityFlash(sim, 0.25, 0.25);
            sim.groundFx.push({
              kind: 'shockwave',
              x: sim.player.x,
              y: sim.player.y,
              radius: 24,
              maxRadius: 340,
              life: 0.55,
              maxLife: 0.55,
              color: '#67E8F9',
            });
            spawnParticles(sim, sim.player.x, sim.player.y, '#FDE047', 28, 220);
            addFloatingText(
              sim,
              sim.player.x,
              sim.player.y - 38,
              `ย้อนกาล! คืนชีพ ${Math.round(healPct * 100)}% HP`,
              '#67E8F9',
              1.35
            );
            sim.announcement = `ย้อนกาลทำงาน! ย้อนกลับ 2 วิ + The World ทันที (${sim.rewindUsedCount}/3)`;
            sim.announcementTimer = 4.5;
          } else if (sim.raceClass === 'demon_lord' && sim.reviveCooldown <= 0) {
            sim.reviveCooldown = 120;
            sim.player.hp = Math.max(1, Math.round(sim.player.maxHp * 0.55));
            sim.player.invulnTimer = 3.0;
            sim.player.hitFlash = 0.25;
            sim.shakeTime = 0.35;
            sim.shakeIntensity = 9;
            sim.enemyBullets = [];
            triggerClassUltimate(sim, true);
            sim.groundFx.push({
              kind: 'explosion',
              x: sim.player.x,
              y: sim.player.y,
              radius: 18,
              maxRadius: 260,
              life: 0.48,
              maxLife: 0.48,
              color: '#E11D48',
            });
            spawnParticles(sim, sim.player.x, sim.player.y, '#F43F5E', 32, 240);
            for (const en of sim.enemies) {
              if (en.hp <= 0) continue;
              if (Math.hypot(en.x - sim.player.x, en.y - sim.player.y) <= 260 + en.radius) {
                damageEnemy(
                  sim,
                  en,
                  140 * stats.damageMult,
                  null,
                  340,
                  en.x - sim.player.x,
                  en.y - sim.player.y,
                  stats.greedMult
                );
              }
            }
            addFloatingText(sim, sim.player.x, sim.player.y - 34, 'ฟื้นจากเถ้าถ่าน!', '#FB7185', 1.35);
            sim.announcement =
              'ฟื้นจากเถ้าถ่านทำงาน! ฟื้น HP 55% + เปิดประตูนรกฟรีทันที (CD 2 นาที)';
            sim.announcementTimer = 4.5;
            sound.playLevelUp();
          } else if (sim.metaRevivesLeft > 0) {
            sim.metaRevivesLeft -= 1;
            sim.player.hp = Math.max(1, Math.round(sim.player.maxHp * 0.5));
            sim.player.invulnTimer = 2.6;
            sim.player.hitFlash = 0.22;
            sim.shakeTime = 0.32;
            sim.shakeIntensity = 8;
            sim.enemyBullets = [];
            sim.groundFx.push({
              kind: 'shockwave',
              x: sim.player.x,
              y: sim.player.y,
              radius: 20,
              maxRadius: 240,
              life: 0.45,
              maxLife: 0.45,
              color: '#FDE047',
            });
            for (const en of sim.enemies) {
              if (en.hp <= 0 || en.knockbackResist >= 1) continue;
              const dx = en.x - sim.player.x;
              const dy = en.y - sim.player.y;
              const d = Math.hypot(dx, dy) || 1;
              if (d <= 240) {
                en.kbVx += (dx / d) * 380 * (1 - en.knockbackResist);
                en.kbVy += (dy / d) * 380 * (1 - en.knockbackResist);
              }
            }
            addFloatingText(sim, sim.player.x, sim.player.y - 36, 'ชุบชีวิตสำเร็จ!', '#FDE047', 1.35);
            sim.announcement = `พรแห่งการคืนชีพทำงาน! ฟื้น 50% HP (เหลือ ${sim.metaRevivesLeft} ครั้ง)`;
            sim.announcementTimer = 4.2;
            sound.playLevelUp();
          } else if (sim.phoenixAvailable) {
            sim.phoenixAvailable = false;
            const healPct = Math.max(0.3, Math.min(0.85, sim.phoenixHealPct || 0.3));
            sim.player.hp = Math.max(1, Math.round(sim.player.maxHp * healPct));
            sim.player.invulnTimer = 2.8;
            sim.player.hitFlash = 0.25;
            sim.shakeTime = 0.35;
            sim.shakeIntensity = 9;
            sim.enemyBullets = [];
            sim.groundFx.push({
              kind: 'explosion',
              x: sim.player.x,
              y: sim.player.y,
              radius: 20,
              maxRadius: 270,
              life: 0.48,
              maxLife: 0.48,
              color: '#F97316',
            });
            spawnParticles(sim, sim.player.x, sim.player.y, '#FB923C', 32, 240);
            const phoenixDmg = (130 + sim.player.level * 5) * stats.damageMult;
            for (const en of sim.enemies) {
              if (en.hp <= 0) continue;
              const dx = en.x - sim.player.x;
              const dy = en.y - sim.player.y;
              if (Math.hypot(dx, dy) <= 270 + en.radius) {
                en.burnTimer = Math.max(en.burnTimer || 0, 4.0);
                damageEnemy(sim, en, phoenixDmg, null, 380, dx, dy, stats.greedMult);
              }
            }
            addFloatingText(
              sim,
              sim.player.x,
              sim.player.y - 36,
              `ขนนกฟีนิกซ์! ฟื้น ${Math.round(healPct * 100)}% HP`,
              '#FB923C',
              1.35
            );
            sim.announcement = `ขนนกฟีนิกซ์ทำงาน! คืนชีพ ${Math.round(healPct * 100)}% HP + ระเบิดเพลิงแผดเผา!`;
            sim.announcementTimer = 4.2;
            sound.playLevelUp();
          } else {
            sim.player.hp = 0;
            finalizeAndEmitRunEnd(sim);
            return;
          }
        }

        // Update Drops (Auto-Magnet & Collection; Elemental Orbs & Mana Gems exclusive to Mage)
        for (let i = sim.drops.length - 1; i >= 0; i--) {
          const d = sim.drops[i];
          if ((d.kind === 'element_orb' || d.kind === 'mana_gem') && !RACES[raceId].usesElements) {
            continue;
          }
          const dx = sim.player.x - d.x;
          const dy = sim.player.y - d.y;
          const dist = Math.hypot(dx, dy);

          // Global Ritual Cooldown:
          // Player can still prepare up to 2 orbs while cooling down, but CANNOT combine the 3rd element
          // until the Ritual Cooldown finishes!
          const ritualBlocksCombine =
            d.kind === 'element_orb' && sim.fusionCooldown > 0 && sim.heldElements.length >= 2;
          const pullRadius =
            d.kind === 'element_orb' ? Math.min(95, stats.magnetRadius * 0.55) : stats.magnetRadius;

          const isManualChest = d.kind === 'chest' || d.kind === 'artifact_chest' || d.kind === 'sealed_chest';
          if (!ritualBlocksCombine && !isManualChest && (d.magnetized || dist <= pullRadius)) {
            d.magnetized = true;
            const pullSpd = 420;
            if (dist > 1) {
              d.x += (dx / dist) * pullSpd * dt;
              d.y += (dy / dist) * pullSpd * dt;
            }
          }

          if (!ritualBlocksCombine && dist <= sim.player.radius + (isManualChest ? 24 : 16)) {
            sim.drops.splice(i, 1);
            if (d.kind === 'element_orb' && d.elementId) {
              if (!RACES[raceId].usesElements) continue;
              const elId = d.elementId;
              const elDef = ELEMENTS[elId];
              if (isSpellbladeClass(sim.raceClass)) {
                sim.spellbladeActiveElement = elId;
              }
              sound.playGemPickup();

              if (sim.heldElements.length < 2) {
                sim.mana = Math.min(stats.maxMana, sim.mana + stats.orbManaGain);
                sim.heldElements = [...sim.heldElements, elId];
                if (sim.heldElements.length === 1) {
                  addFloatingText(
                    sim,
                    sim.player.x,
                    sim.player.y - 26,
                    `ธาตุ 1/3: ${elDef.nameTh} (+${stats.orbManaGain} MP)`,
                    elDef.glowColor,
                    0.95
                  );
                } else {
                  const preview = getElementFusion(sim.heldElements[0], elId);
                  const waitMsg =
                    sim.fusionCooldown > 0
                      ? `เตรียมครบ 2/3: ${preview.nameTh} (รอพิธีกรรม ${sim.fusionCooldown.toFixed(1)}s)`
                      : `ธาตุ 2/3: ${preview.nameTh} · รอธาตุที่ 3!`;
                  addFloatingText(sim, sim.player.x, sim.player.y - 28, waitMsg, preview.color, 1.0);
                }
              } else {
                const [firstEl, secondEl] = sim.heldElements;
                const thirdEl = elId;
                sim.heldElements = [];
                const fusion = getElementFusion(firstEl, secondEl);
                const resonance: FusionResonance =
                  firstEl === secondEl && secondEl === thirdEl
                    ? 'triple'
                    : firstEl !== secondEl && secondEl !== thirdEl && firstEl !== thirdEl
                      ? 'harmony'
                      : 'paired';
                const catDef = ELEMENT_CATALYSTS[thirdEl];
                const resLabel =
                  resonance === 'triple'
                    ? 'มหาธาตุบริสุทธิ์'
                    : resonance === 'harmony'
                      ? 'ตรีธาตุประสาน'
                      : 'ธาตุพ้องคู่';

                const sealCost = Math.max(4, Math.round(fusion.manaCost * 0.85 * stats.manaCostMult));
                if (sim.mana < sealCost) {
                  // Mana Backlash penalty: insufficient MP when completing 3rd orb!
                  sim.mana = 0;
                  sim.lowManaTimer = 1.4;
                  sim.fusionCooldown = Math.max(2.6, stats.fusionMaxCooldown * 0.6);
                  castElementalFusion(sim, fusion, stats, thirdEl, resonance, 0.55);
                  addFloatingText(
                    sim,
                    sim.player.x,
                    sim.player.y - 36,
                    `มานาไม่พอ (${sealCost} MP)! เวทย์แตกสลาย!`,
                    '#F43F5E',
                    1.1
                  );
                  sim.announcement = `มานาขาดช่วง! ต้องใช้ ${sealCost} MP เพื่อปิดผนึก ${fusion.nameTh}`;
                  sim.announcementTimer = 3.0;
                  continue;
                }

                sim.mana -= sealCost;
                sim.mageFusionCount += 1;
                const usedVoid = sim.voidInfusionActive;
                if (usedVoid) sim.voidInfusionActive = false;
                const voidDmgMult = usedVoid ? 1.65 : 1.0;
                const voidAreaMult = usedVoid ? 1.2 : 1.0;
                sim.fusionCooldown = stats.fusionMaxCooldown * (usedVoid ? 2 : 1);
                const isThirdFusionBonus = sim.mageFusionCount % 3 === 0;
                callbacksRef.current.onDiscoverFusion(fusion.key);

                if (isSpellbladeClass(sim.raceClass)) {
                  sim.spellbladeFusionCount += 1;
                  const prevSpellblade = sim.lastSpellbladeFusion;
                  const sbPalette = getCombinedElementPalette([firstEl, secondEl, thirdEl], fusion.color);
                  sim.lastSpellbladeFusion = {
                    def: fusion,
                    catalyst: thirdEl,
                    resonance,
                    voidInfused: usedVoid,
                    colors: sbPalette.colors,
                    shapes: sbPalette.shapes,
                  };
                  sim.spellbladeInfusionName = `${fusion.nameTh} · ${catDef.nameTh}`;
                  sim.spellbladeInfusionColor = fusion.color;
                  spawnPackVfx(sim.packVfx, 'mage_fusion_cast', sim.player.x, sim.player.y, { scale: 2.3 });
                  spawnPackVfx(sim.packVfx, `catalyst_${thirdEl}` as PackVfxKey, sim.player.x, sim.player.y, {
                    groundPlane: true,
                    scale: 2.4,
                    life: 1.3,
                  });
                  triggerElementFusionFeedback(
                    sim,
                    [firstEl, secondEl, thirdEl],
                    fusion.color,
                    isThirdFusionBonus || usedVoid
                  );
                  const buffDuration =
                    16 + stats.fusionDurationBonus + (resonance === 'triple' ? 3 : resonance === 'harmony' ? 1.5 : 0);
                  const existingIdx = sim.activeFusions.findIndex((f) => f.def.key === fusion.key);
                  if (existingIdx >= 0) {
                    sim.activeFusions[existingIdx].catalyst = thirdEl;
                    sim.activeFusions[existingIdx].resonance = resonance;
                    sim.activeFusions[existingIdx].voidInfused = usedVoid;
                    sim.activeFusions[existingIdx].remaining = buffDuration;
                    sim.activeFusions[existingIdx].maxDuration = buffDuration;
                  } else {
                    if (sim.activeFusions.length >= 3) {
                      sim.activeFusions.shift();
                    }
                    sim.activeFusions.push({
                      def: fusion,
                      catalyst: thirdEl,
                      resonance,
                      voidInfused: usedVoid,
                      remaining: buffDuration,
                      maxDuration: buffDuration,
                      cooldownTimer: 0,
                    });
                  }

                  const updatedStats = computeStats(sim);
                  if (isThirdFusionBonus) {
                    const repeat = prevSpellblade ?? {
                      def: fusion,
                      catalyst: thirdEl,
                      resonance,
                      voidInfused: usedVoid,
                    };
                    // Spellblade 3rd-Fusion Bonus: Free immediate repeat of previous fused spell + 360° elemental sword wave!
                    castElementalFusion(
                      sim,
                      repeat.def,
                      updatedStats,
                      repeat.catalyst,
                      repeat.resonance,
                      repeat.voidInfused ? 1.65 : 1.1,
                      repeat.voidInfused ? 1.2 : 1.05
                    );
                    triggerAbilityFlash(sim, 0.22, 0.2);
                    const slashR = 250 * updatedStats.areaMult;
                    sim.groundFx.push({
                      kind: 'grand_slash',
                      x: sim.player.x,
                      y: sim.player.y,
                      radius: slashR * 0.35,
                      maxRadius: slashR,
                      life: 0.36,
                      maxLife: 0.36,
                      color: repeat.def.color,
                    });
                    for (let bi = sim.enemyBullets.length - 1; bi >= 0; bi--) {
                      if (
                        Math.hypot(sim.enemyBullets[bi].x - sim.player.x, sim.enemyBullets[bi].y - sim.player.y) <=
                        slashR
                      ) {
                        sim.enemyBullets.splice(bi, 1);
                      }
                    }
                    triggerElementalSwordTechniques(
                      sim,
                      updatedStats,
                      [thirdEl],
                      Math.atan2(sim.player.facingY, sim.player.facingX),
                      true,
                      1.1
                    );
                    addFloatingText(
                      sim,
                      sim.player.x,
                      sim.player.y - 38,
                      `ผสมครบ 3 ครั้ง! ร่ายซ้ำฟรี ${repeat.def.nameTh}!`,
                      repeat.def.color,
                      1.2
                    );
                    sim.announcement = `โบนัสจอมเวทย์ดาบ (ครั้งที่ 3): ปลดปล่อย "${repeat.def.nameTh}" ซ้ำฟรีทันที! (0 MP)`;
                    sim.announcementTimer = 3.6;
                  } else {
                    addFloatingText(
                      sim,
                      sim.player.x,
                      sim.player.y - 34,
                      `${usedVoid ? '[VOID] ' : ''}บัพดาบตรีธาตุ! ${fusion.nameTh}`,
                      fusion.color,
                      1.15
                    );
                    sim.announcement = `ผสานดาบ 3 ธาตุ (${resLabel}): ${ELEMENTS[firstEl].nameTh}+${ELEMENTS[secondEl].nameTh}+${elDef.nameTh} = ${fusion.nameTh}${usedVoid ? ' [Void Infusion x1.65]' : ''}`;
                    sim.announcementTimer = 3.2;
                  }

                  // Forced Awakening onto Spellblade God after 5 elemental fusions -> ดาบไร้ธาตุ (Voidless Archblade)!
                  // Player must collect 100 kills from 0 after class change before entering Voidless Mode!
                  if (sim.raceClass === 'spellblade_god' && sim.spellbladeFusionCount >= SPELLBLADE_VOIDLESS_REQ) {
                    sim.raceClass = 'voidless_blade';
                    sim.voidlessKills = 0;
                    sim.voidlessTimer = 0;
                    sim.voidlessCooldown = 0;
                    sim.voidlessPillarTimer = 0;
                    sim.spiritSwords = [];
                    spawnPackVfx(sim.packVfx, 'voidless_awaken_burst', sim.player.x, sim.player.y, { scale: 2.6 });
                    sim.groundFx.push({
                      kind: 'warp',
                      x: sim.player.x,
                      y: sim.player.y,
                      radius: 16,
                      maxRadius: 140,
                      life: 0.5,
                      maxLife: 0.5,
                      color: '#E0F2FE',
                    });
                    spawnPaletteBurst(
                      sim,
                      sim.player.x,
                      sim.player.y,
                      getCombinedElementPalette(['fire', 'water', 'light', 'dark', 'wind'], '#E0F2FE'),
                      36,
                      255,
                      { radius: 4.3, life: 0.78, force: true, ringRatio: 0.2 }
                    );
                    addFloatingText(
                      sim,
                      sim.player.x,
                      sim.player.y - 46,
                      'ปลุกคลาสใหม่: ดาบไร้ธาตุ! (เก็บ 100 ฆ่าเพื่อจุติ)',
                      '#E0F2FE',
                      1.25
                    );
                    sim.announcement =
                      'ปลุกพลังคลาสใหม่สำเร็จ: ดาบไร้ธาตุ! สังหารมอนสเตอร์สะสมใหม่ 100 ตัว เพื่อเข้าสู่โหมดจุติไร้ธาตุ!';
                    sim.announcementTimer = 5.0;
                    sound.playLevelUp();
                  }
                } else {
                  let castDirDx = sim.player.facingX;
                  let bestCastD2 = 520 * 520;
                  for (const en of sim.enemies) {
                    if (en.hp <= 0) continue;
                    const d2 = (en.x - sim.player.x) ** 2 + (en.y - sim.player.y) ** 2;
                    if (d2 < bestCastD2) {
                      bestCastD2 = d2;
                      castDirDx = en.x - sim.player.x;
                    }
                  }
                  triggerCastAnim(sim, castDirDx);
                  spawnPackVfx(sim.packVfx, 'mage_fusion_cast', sim.player.x, sim.player.y, { scale: 2.4 });
                  spawnPackVfx(sim.packVfx, `catalyst_${thirdEl}` as PackVfxKey, sim.player.x, sim.player.y, {
                    groundPlane: true,
                    scale: 2.5,
                    life: 1.4,
                  });
                  triggerElementFusionFeedback(
                    sim,
                    [firstEl, secondEl, thirdEl],
                    fusion.color,
                    isThirdFusionBonus || usedVoid
                  );
                  castElementalFusion(sim, fusion, stats, thirdEl, resonance, voidDmgMult, voidAreaMult);
                  triggerAbilityFlash(sim, usedVoid ? 0.24 : 0.18, usedVoid ? 0.22 : 0.18);
                  const duration =
                    11.5 +
                    stats.fusionDurationBonus +
                    (resonance === 'triple' ? 2.5 : resonance === 'harmony' ? 1.2 : 0);
                  const windFactor = thirdEl === 'wind' ? 0.78 : 1;
                  const existingIdx = sim.activeFusions.findIndex((f) => f.def.key === fusion.key);
                  if (existingIdx >= 0) {
                    sim.activeFusions[existingIdx].catalyst = thirdEl;
                    sim.activeFusions[existingIdx].resonance = resonance;
                    sim.activeFusions[existingIdx].voidInfused = usedVoid;
                    sim.activeFusions[existingIdx].remaining = duration;
                    sim.activeFusions[existingIdx].maxDuration = duration;
                  } else {
                    if (sim.activeFusions.length >= 2) {
                      sim.activeFusions.shift();
                    }
                    sim.activeFusions.push({
                      def: fusion,
                      catalyst: thirdEl,
                      resonance,
                      voidInfused: usedVoid,
                      remaining: duration,
                      maxDuration: duration,
                      cooldownTimer: fusion.cooldown * stats.cooldownMult * 1.18 * windFactor,
                    });
                  }

                  if (isThirdFusionBonus) {
                    // Standard Mage 3rd-Fusion Bonus: Wind-Arcane Barrier (damage immunity + radial knockback!)
                    sim.mageBarrierTimer = 4.0;
                    sim.mageBarrierPulseTimer = 0.45;
                    triggerAbilityFlash(sim, 0.2, 0.2);
                    const burstR = 215 * stats.areaMult;
                    sim.groundFx.push({
                      kind: 'shockwave',
                      x: sim.player.x,
                      y: sim.player.y,
                      radius: 24,
                      maxRadius: burstR,
                      life: 0.42,
                      maxLife: 0.42,
                      color: '#34D399',
                    });
                    spawnSheetVfx(sim, 'divine_shield', sim.player.x, sim.player.y, {
                      size: 124,
                      life: 0.55,
                      zOffset: 14,
                    });
                    spawnParticles(sim, sim.player.x, sim.player.y, '#6EE7B7', 24, 210);
                    for (let bi = sim.enemyBullets.length - 1; bi >= 0; bi--) {
                      if (
                        Math.hypot(sim.enemyBullets[bi].x - sim.player.x, sim.enemyBullets[bi].y - sim.player.y) <=
                        burstR
                      ) {
                        sim.enemyBullets.splice(bi, 1);
                      }
                    }
                    for (const en of sim.enemies) {
                      if (en.hp <= 0) continue;
                      const d = Math.hypot(en.x - sim.player.x, en.y - sim.player.y);
                      if (d <= burstR + en.radius) {
                        damageEnemy(
                          sim,
                          en,
                          (20 + sim.player.level * 2) * stats.damageMult,
                          null,
                          290,
                          en.x - sim.player.x,
                          en.y - sim.player.y,
                          stats.greedMult
                        );
                      }
                    }
                    addFloatingText(
                      sim,
                      sim.player.x,
                      sim.player.y - 38,
                      'ผสมครบ 3 ครั้ง! บาเรียวายุอมตะ!',
                      '#6EE7B7',
                      1.2
                    );
                    sim.announcement = `โบนัสจอมเวทย์ (ครั้งที่ 3): เสกบาเรียวายุกันดาเมจ 4 วิ + ผลักศัตรูรอบตัว!`;
                    sim.announcementTimer = 3.8;
                  } else {
                    addFloatingText(
                      sim,
                      sim.player.x,
                      sim.player.y - 34,
                      `${usedVoid ? '[VOID] ' : ''}${resLabel}! ${fusion.nameTh} (-${sealCost} MP)`,
                      fusion.color,
                      1.15
                    );
                    sim.announcement = `พิธีกรรมผสาน 3 ธาตุ (${resLabel}): ${ELEMENTS[firstEl].nameTh}+${ELEMENTS[secondEl].nameTh}+${elDef.nameTh} → ${fusion.nameTh} [${catDef.nameTh}]${usedVoid ? ' [Void x1.65 · CD x2]' : ''}`;
                    sim.announcementTimer = 3.6;
                  }
                }
              }
            } else if (d.kind === 'mana_gem') {
              if (!RACES[raceId].usesElements) continue;
              sim.mana = Math.min(stats.maxMana, sim.mana + d.value);
              sound.playGemPickup();
              addFloatingText(sim, sim.player.x, sim.player.y - 22, `+${d.value} มานา`, '#38BDF8', 0.95);
            } else if (d.kind === 'xp' || d.kind === 'xp_large') {
              const xpEventMult =
                sim.mapEvent === 'exp_surge'
                  ? 1.75
                  : sim.mapEvent === 'god_blessing'
                    ? 1.5
                    : sim.mapEvent === 'night_fog'
                      ? 1.3
                      : 1;
              const luckyMult =
                stats.doubleLootLuckChance > 0 && Math.random() < stats.doubleLootLuckChance
                  ? 2
                  : 1;
              const xpVal = Math.max(
                1,
                Math.round(d.value * xpEventMult * stats.xpGainMult * luckyMult)
              );
              sim.player.xp += xpVal;
              if (sim.inSecretRoom && sim.secretRoomKind === 'cursed_horde') {
                sim.secretRoomExpAccum += xpVal;
              }
              sound.playGemPickup();
              if (sim.player.xp >= sim.player.xpToNext) {
                sim.player.xp -= sim.player.xpToNext;
                sim.player.level += 1;
                sim.player.xpToNext = Math.round(
                  22 + sim.player.level * 14 + Math.pow(sim.player.level, 1.55) * 3.8
                );

                // Milestone Artifact Chest Drop every few levels (Lv 3, 7, 12, 17, 23, ...)
                if (sim.player.level >= sim.nextArtifactLevel) {
                  sim.nextArtifactLevel +=
                    sim.player.level < 12 ? 4 : sim.player.level < 22 ? 5 : 6;
                  const ang = Math.random() * Math.PI * 2;
                  const ax = sim.player.x + Math.cos(ang) * 62;
                  const ay = sim.player.y + Math.sin(ang) * 62;
                  sim.drops.push({
                    kind: 'artifact_chest',
                    x: ax,
                    y: ay,
                    value: 1,
                    magnetized: false,
                  });
                  sim.groundFx.push({
                    kind: 'warp',
                    x: ax,
                    y: ay,
                    radius: 10,
                    maxRadius: 65,
                    life: 0.45,
                    maxLife: 0.45,
                    color: '#C084FC',
                  });
                  addFloatingText(sim, sim.player.x, sim.player.y - 40, 'หีบ Artifact ปรากฏ!', '#C084FC', 1.15);
                }

                // Orc trait: gain +15 Max HP & heal +20 HP on every level up!
                if (raceId === 'orc') {
                  sim.orcLevelHpBonus += 15;
                  computeStats(sim);
                  const healed = applyPlayerHeal(sim, 20);
                  addFloatingText(
                    sim,
                    sim.player.x,
                    sim.player.y - 28,
                    `+15 MaxHP · +${healed} HP`,
                    '#34D399',
                    1.05
                  );
                }

                sound.playLevelUp();
                const choices = generateLevelUpDraft(
                  raceId,
                  sim.weapons,
                  sim.relics,
                  sim.magePerks,
                  buildDraftOptions(sim)
                );
                presentLevelUpDraft(sim, choices);
                if (botModeRef.current === 'full') continue;
                return;
              }
            } else if (d.kind === 'gold') {
              const luckyDouble =
                stats.doubleLootLuckChance > 0 && Math.random() < stats.doubleLootLuckChance;
              const comboBonusMult = 1 + Math.min(0.25, Math.floor((sim.combo || 0) / 100) * 0.05);
              const lateGoldMult = sim.elapsedSeconds > 1800 ? 0.5 : 1;
              const rawGold = Math.max(1, Math.round(d.value * comboBonusMult * lateGoldMult));
              const goldVal = luckyDouble ? rawGold * 2 : rawGold;
              sim.goldEarned += goldVal;
              sim.goldBreakdown.drops += goldVal;
              sound.playCoinPickup();
              addFloatingText(
                sim,
                sim.player.x,
                sim.player.y - 22,
                luckyDouble ? `+${goldVal} ทอง (โชค x2!)` : `+${goldVal} ทอง`,
                luckyDouble ? '#FDE047' : '#FBBF24',
                luckyDouble ? 1.08 : 0.9
              );
            } else if (d.kind === 'gold_pouch') {
              const lateGoldMult = sim.elapsedSeconds > 1800 ? 0.5 : 1;
              const pouchGold = Math.max(1, Math.round(d.value * lateGoldMult));
              sim.goldEarned += pouchGold;
              sim.goldBreakdown.pouches += pouchGold;
              sound.playBossChest();
              addFloatingText(sim, sim.player.x, sim.player.y - 26, `ถุงทอง! +${pouchGold}g`, '#FDE047', 1.2);
            } else if (d.kind === 'sealed_chest') {
              if (sim.pendingSealedChests < 5) {
                sim.pendingSealedChests += 1;
              }
              sound.playBossChest();
              addFloatingText(
                sim,
                sim.player.x,
                sim.player.y - 30,
                `เก็บหีบปิดผนึก (${sim.pendingSealedChests}/5)`,
                '#F59E0B',
                1.2
              );
            } else if (d.kind === 'meat') {
              const healed = applyPlayerHeal(sim, d.value);
              sound.playCoinPickup();
              addFloatingText(
                sim,
                sim.player.x,
                sim.player.y - 22,
                healed < d.value ? `ขวดยา +${healed} HP` : `ขวดยา +${healed} HP`,
                healed < d.value ? '#C084FC' : '#34D399',
                1.05
              );
            } else if (d.kind === 'magnet') {
              sound.playLevelUp();
              for (const other of sim.drops) {
                if (
                  other.kind === 'xp' ||
                  other.kind === 'xp_large' ||
                  other.kind === 'gold' ||
                  other.kind === 'gold_pouch' ||
                  other.kind === 'meat' ||
                  (RACES[raceId].usesElements && (other.kind === 'element_orb' || other.kind === 'mana_gem'))
                ) {
                  other.magnetized = true;
                }
              }
              addFloatingText(sim, sim.player.x, sim.player.y - 26, 'แม่เหล็กดูดทรัพยากรทั้งแผนที่!', '#38BDF8', 1.15);
            } else if (d.kind === 'chest') {
              sound.playBossChest();
              const reward = generateBossChestReward(
                raceId,
                sim.weapons,
                sim.relics,
                sim.magePerks,
                buildBossChestOptions(sim, stats.greedMult)
              );
              sim.goldBreakdown.bosses += reward.bonusGold;
              presentBossChest(sim, reward);
              if (botModeRef.current === 'full') continue;
              return;
            } else if (d.kind === 'artifact_chest') {
              sound.playBossChest();
              const choices = generateArtifactDraft(sim.artifacts);
              presentArtifactChest(sim, choices);
              if (botModeRef.current === 'full') continue;
              return;
            } else if (d.kind === 'bomb') {
              sound.playBossWarning();
              sim.shakeTime = Math.max(sim.shakeTime, 0.35);
              sim.shakeIntensity = Math.max(sim.shakeIntensity, 9);
              const clearR = Math.max(window.innerWidth, window.innerHeight) * 0.65;
              sim.groundFx.push({
                kind: 'explosion',
                x: sim.player.x,
                y: sim.player.y,
                radius: 26,
                maxRadius: clearR * 0.55,
                life: 0.45,
                maxLife: 0.45,
                color: '#EF4444',
              });
              spawnParticles(sim, sim.player.x, sim.player.y, '#F97316', 28, 250);
              for (const en of sim.enemies) {
                if (en.hp <= 0 || en.isBoss) continue;
                if (Math.hypot(en.x - sim.player.x, en.y - sim.player.y) <= clearR) {
                  damageEnemy(
                    sim,
                    en,
                    Math.max(999, en.hp + 50),
                    null,
                    120,
                    en.x - sim.player.x,
                    en.y - sim.player.y,
                    stats.greedMult
                  );
                }
              }
              addFloatingText(sim, sim.player.x, sim.player.y - 32, 'ระเบิดล้างจอ!', '#EF4444', 1.3);
            } else if (d.kind === 'speed_potion') {
              sim.speedPotionTimer = 10;
              sound.playLevelUp();
              addFloatingText(
                sim,
                sim.player.x,
                sim.player.y - 28,
                'น้ำยาเร่งความเร็ว +35% (10 วิ)!',
                '#38BDF8',
                1.18
              );
            }
          }
        }

        // Update FX, Particles, Floating Text
        for (let i = sim.groundFx.length - 1; i >= 0; i--) {
          sim.groundFx[i].life -= dt;
          if (sim.groundFx[i].life <= 0) sim.groundFx.splice(i, 1);
        }
        for (let i = sim.particles.length - 1; i >= 0; i--) {
          const pt = sim.particles[i];
          pt.life -= dt;
          if (pt.drag && pt.drag > 0) {
            const damp = Math.exp(-pt.drag * dt);
            pt.vx *= damp;
            pt.vy *= damp;
          }
          if (pt.spin) {
            pt.angle = (pt.angle ?? 0) + pt.spin * dt;
          }
          pt.x += pt.vx * dt;
          pt.y += pt.vy * dt;
          if (pt.life <= 0) sim.particles.splice(i, 1);
        }
        for (let i = sim.floatingTexts.length - 1; i >= 0; i--) {
          const ft = sim.floatingTexts[i];
          ft.life -= dt;
          if (ft.vx) ft.x += ft.vx * dt;
          if (ft.gravity) ft.vy += ft.gravity * dt;
          ft.y += ft.vy * dt;
          if (ft.life <= 0) sim.floatingTexts.splice(i, 1);
        }
      };

      const renderScene = () => {
        const sim = simRef.current;
        if (!sim) return;

        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const w = canvas.width / dpr;
        const h = canvas.height / dpr;

        ctx.save();
        ctx.scale(dpr, dpr);

        const biome = getActiveBiome(stageId, sim.realmTier, sim.biomeShiftCount);
        const stats = computeStats(sim);
        const nowMs = performance.now();

        // Camera offset with tapered screen shake
        let shakeX = 0;
        let shakeY = 0;
        if (sim.shakeTime > 0 && sim.shakeIntensity > 0) {
          const denom = Math.max(0.06, sim.shakeMaxTime || 0.14);
          const falloff = Math.min(1, Math.max(0.18, sim.shakeTime / denom));
          const amp = sim.shakeIntensity * falloff;
          shakeX = (Math.random() - 0.5) * amp * 2;
          shakeY = (Math.random() - 0.5) * amp * 2;
        }
        const camWorldX = sim.player.x - w / 2 + shakeX;
        const camScreenY = sim.player.y * ISO_TILT - h / 2 + shakeY;

        // Smooth camera zoom (1.08x during Ultimate Cut-in zoom)
        const zoomFactor =
          sim.ultZoomTimer > 0 && sim.ultZoomMax > 0
            ? 1 + 0.08 * Math.sin((sim.ultZoomTimer / sim.ultZoomMax) * Math.PI)
            : 1;
        if (zoomFactor > 1.001) {
          ctx.translate(w / 2, h / 2);
          ctx.scale(zoomFactor, zoomFactor);
          ctx.translate(-w / 2, -h / 2);
        }

        // 1. Dynamic 2.5D Isometric Biome Terrain & Beveled Stone Slabs
        drawBiomeBackground(
          ctx,
          w,
          h,
          camWorldX,
          camScreenY,
          biome.themeStyle,
          biome.floorPrimary,
          biome.floorSecondary,
          biome.accentHex,
          nowMs
        );

        // Ultimate Moon Backdrop (Hunter Night Blue Moon / Vampire Crimson Blood Moon)
        if (sim.ultActiveTimer > 0 && (sim.raceClass === 'hunter' || sim.raceClass === 'vampire_lord')) {
          drawUltimateBackdropMoon(
            ctx,
            w,
            h,
            sim.raceClass === 'vampire_lord' ? '#FB7185' : '#7DD3FC',
            sim.raceClass === 'vampire_lord'
          );
        }

        // ============================================================
        // PASS A: 2.5D Tilted Ground-Plane Pass (scale(1, ISO_TILT))
        // Ground AoEs, slash arcs, hazards, telegraphs & ground shadows
        // ============================================================
        ctx.save();
        ctx.translate(-camWorldX, -camScreenY);
        ctx.scale(1, ISO_TILT);

        // Saint Sanctuary Zones
        for (const sz of sim.sanctuaryZones) {
          const pulse = 0.65 + Math.sin(nowMs * 0.008) * 0.15;
          const sg = ctx.createRadialGradient(sz.x, sz.y, sz.radius * 0.2, sz.x, sz.y, sz.radius);
          sg.addColorStop(0, 'rgba(253, 224, 71, 0.06)');
          sg.addColorStop(0.85, 'rgba(250, 204, 21, 0.24)');
          sg.addColorStop(1, 'rgba(250, 204, 21, 0)');
          ctx.fillStyle = sg;
          ctx.beginPath();
          ctx.arc(sz.x, sz.y, sz.radius, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = `rgba(254, 240, 138, ${pulse})`;
          ctx.lineWidth = 2.5;
          ctx.stroke();
          drawPackVfx(ctx, 'saint_sanctum', sz.x, sz.y, nowMs * 0.001, {
            scale: Math.max(1.5, (sz.radius * 2.05) / 128),
            alpha: 0.9,
          });
        }

        // Seven Sins 7-Pointed Ritual Circle during Rite of the Seven Sins Ult
        if (sim.raceClass === 'seven_sins' && sim.ultActiveTimer > 0) {
          const prog = sim.ultActiveMax > 0 ? 1 - sim.ultActiveTimer / sim.ultActiveMax : 0.5;
          drawSevenSinsRitualCircle(ctx, sim.player.x, sim.player.y, 175, prog, nowMs);
        }

        // Mage active Catalyst ring aura beneath feet
        if (raceId === 'mage' && sim.activeFusions.length > 0) {
          const latestFusion = sim.activeFusions[sim.activeFusions.length - 1];
          drawPackVfx(ctx, `catalyst_${latestFusion.catalyst}` as PackVfxKey, sim.player.x, sim.player.y, nowMs * 0.001, {
            scale: 2.15,
            alpha: 0.72,
          });
        }

        // 2. Garlic / Soul Vortex Aura around player
        const garlicW = sim.weapons.find((it) => it.id === 'garlic');
        if (garlicW) {
          const evo = garlicW.evolved;
          const auraR = (evo ? 132 : 78 + garlicW.level * 11) * stats.areaMult;
          const drewGarlicPack = drawPackVfx(
            ctx,
            evo ? 'garlic_aura_evo' : 'garlic_aura',
            sim.player.x,
            sim.player.y,
            nowMs * 0.001,
            {
              scale: Math.max(1.4, (auraR * 2.15) / 96),
              alpha: evo ? 0.92 : 0.82,
            }
          );
          if (!drewGarlicPack) {
            const grad = ctx.createRadialGradient(sim.player.x, sim.player.y, auraR * 0.2, sim.player.x, sim.player.y, auraR);
            grad.addColorStop(0, evo ? 'rgba(244, 63, 94, 0.04)' : 'rgba(226, 232, 240, 0.03)');
            grad.addColorStop(1, evo ? 'rgba(244, 63, 94, 0.22)' : 'rgba(226, 232, 240, 0.14)');
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(sim.player.x, sim.player.y, auraR, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = evo ? 'rgba(244, 63, 94, 0.45)' : 'rgba(226, 232, 240, 0.28)';
            ctx.lineWidth = 1.5;
            ctx.stroke();
          }
        }

        // 3. Ground FX (Beams, Slash Arcs, Paladin Sword, Shadow Cut, Judgement Rift, Shockwaves, Explosions)
        for (const fx of sim.groundFx) {
          if (fx.kind === 'lightning' || fx.upright) continue;
          const t = Math.max(0, Math.min(1, 1 - fx.life / Math.max(0.001, fx.maxLife)));
          if (fx.kind === 'paladin_sword') {
            drawPaladinSwordSlash(
              ctx,
              fx.x,
              fx.y,
              fx.angle || 0,
              fx.maxRadius,
              t,
              Boolean(fx.isExcalibur)
            );
            continue;
          }
          if (fx.kind === 'shadow_cut' && fx.x2 !== undefined && fx.y2 !== undefined) {
            drawShadowCutSlash(ctx, fx.x, fx.y, fx.x2, fx.y2, t, fx.color);
            continue;
          }
          if (fx.kind === 'judgement_rift' && fx.x2 !== undefined && fx.y2 !== undefined) {
            ctx.save();
            ctx.globalAlpha = Math.max(0, 1 - t);
            ctx.lineCap = 'round';
            ctx.strokeStyle = 'rgba(250, 204, 21, 0.45)';
            ctx.lineWidth = 48 * (1 - t * 0.4);
            ctx.beginPath();
            ctx.moveTo(fx.x, fx.y);
            ctx.lineTo(fx.x2, fx.y2);
            ctx.stroke();
            ctx.strokeStyle = '#FFFFFF';
            ctx.lineWidth = 14 * (1 - t * 0.5);
            ctx.stroke();
            ctx.restore();
            continue;
          }
          if (fx.kind === 'knight_crescent_wave') {
            drawKnightSwordCrescentWave(ctx, fx.x, fx.y, fx.angle || 0, fx.maxRadius, t);
            continue;
          }
          if (fx.kind === 'shadow_cut' || fx.kind === 'judgement_rift' || fx.kind === 'time_debt_clock') {
            continue;
          }
          drawGroundFxSprite(
            ctx,
            fx.kind,
            fx.x,
            fx.y,
            fx.radius,
            fx.maxRadius,
            t,
            fx.color,
            fx.x2,
            fx.y2,
            fx.angle,
            fx.vfxId,
            fx.dw,
            fx.dh,
            fx.vfxKey,
            fx.loopFps ?? 0,
            fx.maxLife - fx.life
          );
        }

        // 3.5 Weather World-Space Hazards
        for (const hz of sim.weatherHazards) {
          drawWeatherHazard(ctx, hz, nowMs);
        }

        // 3.6 Ground Elemental Fields (Vortexes, Pools; Black Holes & Heaven Pillars render upright in Pass B)
        for (const ef of sim.elementalFields) {
          if (ef.kind === 'heaven_pillar' || ef.kind === 'black_hole') continue;
          drawElementalField(
            ctx,
            ef.x,
            ef.y,
            ef.radius,
            ef.color,
            ef.kind,
            ef.life / ef.maxLife,
            nowMs,
            ef.vfxKey,
            ef.maxLife - ef.life
          );
        }

        // 3.65 Chronos Archon Chrono Wells (บ่อเวลา) on 2.5D ground plane
        for (const well of sim.chronoWells) {
          drawChronoWell(
            ctx,
            well.x,
            well.y,
            well.radius,
            well.life / Math.max(0.01, well.maxLife),
            nowMs,
            well.frozenIds.size,
            sim.timeStopTimer > 0
          );
        }

        // 3.7 Enemy Tactical Telegraphs (Foreshortened on 2.5D ground plane)
        const cullHalfW = w * 0.72;
        const cullHalfH = (h / ISO_TILT) * 0.75;
        for (const e of sim.enemies) {
          if (!e.isBoss && (Math.abs(e.x - sim.player.x) > cullHalfW || Math.abs(e.y - sim.player.y) > cullHalfH)) {
            continue;
          }
          if (e.windupTimer > 0) {
            if (e.behaviorMode === 'sniper') {
              ctx.save();
              ctx.strokeStyle = 'rgba(74, 222, 128, 0.55)';
              ctx.lineWidth = 1.8;
              ctx.setLineDash([6, 5]);
              ctx.beginPath();
              ctx.moveTo(e.x, e.y);
              ctx.lineTo(sim.player.x, sim.player.y);
              ctx.stroke();
              ctx.setLineDash([]);
              ctx.restore();
            } else if (e.behaviorMode === 'charger' && e.dashDirX !== undefined && e.dashDirY !== undefined) {
              ctx.save();
              ctx.strokeStyle = 'rgba(249, 115, 22, 0.65)';
              ctx.lineWidth = 4.5;
              ctx.setLineDash([8, 6]);
              ctx.beginPath();
              ctx.moveTo(e.x, e.y);
              ctx.lineTo(e.x + e.dashDirX * 210, e.y + e.dashDirY * 210);
              ctx.stroke();
              ctx.setLineDash([]);
              ctx.restore();
            } else if (e.behaviorMode === 'zealot' || e.behaviorMode === 'bomber') {
              ctx.save();
              ctx.fillStyle = 'rgba(244, 63, 94, 0.14)';
              ctx.strokeStyle = 'rgba(251, 113, 133, 0.72)';
              ctx.lineWidth = 2.2;
              ctx.beginPath();
              ctx.arc(e.x, e.y, e.behaviorMode === 'zealot' ? 84 : 88, 0, Math.PI * 2);
              ctx.fill();
              ctx.stroke();
              ctx.restore();
            }
          }

          if (e.isReaper && ((e.reaperSweepCastTimer || 0) > 0 || (e.reaperSweepPostTimer || 0) > 0)) {
            const isExec = (e.reaperSweepCastTimer || 0) <= 0;
            const prog = isExec
              ? 1 - (e.reaperSweepPostTimer || 0) / 0.38
              : 1 - (e.reaperSweepCastTimer || 0) / Math.max(0.01, e.reaperSweepCastMax || 2.2);
            drawReaperSweepTelegraph(
              ctx,
              e.x,
              e.y,
              e.reaperSweepAngle ?? 0,
              e.reaperSweepArc ?? Math.PI * 0.95,
              e.reaperSweepRadius ?? 355,
              prog,
              isExec,
              nowMs
            );
          }

          // Cast 2.5D Ground Shadows for Flying & Boss Units
          const isFlying =
            e.kind === 'bat' ||
            e.kind === 'boss_bat_king' ||
            e.kind === 'boss_lich' ||
            e.kind === 'boss_wyrm' ||
            e.kind === 'reaper';
          ctx.fillStyle = isFlying ? 'rgba(0, 0, 0, 0.34)' : 'rgba(0, 0, 0, 0.24)';
          ctx.beginPath();
          ctx.arc(e.x + 3, e.y + e.radius * 0.45, e.radius * (isFlying ? 0.72 : 0.86), 0, Math.PI * 2);
          ctx.fill();
        }

        // Necromancer Minion Ground Shadows
        for (const m of sim.necroMinions) {
          ctx.fillStyle = 'rgba(0, 0, 0, 0.24)';
          ctx.beginPath();
          ctx.arc(m.x + 2, m.y + m.radius * 0.45, m.radius * 0.85, 0, Math.PI * 2);
          ctx.fill();
        }

        // Cast 2.5D Ground Shadows for Hero, Golems, Orbs, Projectiles & Enemy Bullets
        ctx.fillStyle = 'rgba(0, 0, 0, 0.34)';
        ctx.beginPath();
        ctx.arc(sim.player.x + 3, sim.player.y + 12 - sim.playerElevZ * 0.2, 16, 0, Math.PI * 2);
        ctx.fill();

        if (sim.golem) {
          ctx.beginPath();
          ctx.arc(sim.golem.x + 4, sim.golem.y + 14, 22, 0, Math.PI * 2);
          ctx.fill();
        }
        if (sim.elementalGolem) {
          ctx.beginPath();
          ctx.arc(sim.elementalGolem.x + 4, sim.elementalGolem.y + 14, 22, 0, Math.PI * 2);
          ctx.fill();
        }
        for (const sw of sim.spiritSwords) {
          ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
          ctx.beginPath();
          ctx.arc(sw.x + 2, sw.y + 6, 9, 0, Math.PI * 2);
          ctx.fill();
        }
        for (const d of sim.drops) {
          if (d.kind !== 'element_orb' && d.kind !== 'mana_gem') continue;
          if (Math.abs(d.x - sim.player.x) > cullHalfW || Math.abs(d.y - sim.player.y) > cullHalfH) continue;
          ctx.fillStyle = 'rgba(0, 0, 0, 0.32)';
          ctx.beginPath();
          ctx.arc(d.x + 2, d.y + 4, 8, 0, Math.PI * 2);
          ctx.fill();
        }
        for (const p of sim.projectiles) {
          if (Math.abs(p.x - sim.player.x) > cullHalfW || Math.abs(p.y - sim.player.y) > cullHalfH) continue;
          ctx.fillStyle = 'rgba(0, 0, 0, 0.22)';
          ctx.beginPath();
          ctx.arc(p.x + 2, p.y + 4, Math.max(4, p.radius * 0.55), 0, Math.PI * 2);
          ctx.fill();
        }
        for (const b of sim.enemyBullets) {
          ctx.fillStyle = 'rgba(0, 0, 0, 0.24)';
          ctx.beginPath();
          ctx.arc(b.x + 2, b.y + 4, Math.max(4, b.radius * 0.7), 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore(); // End 2.5D ground-plane pass

        // ============================================================
        // PASS B: Unified Y-Depth Sorted 2.5D Upright Entities & Landmarks
        // ============================================================
        ctx.save();
        ctx.translate(-camWorldX, -camScreenY);

        // B0. M4-M8 World Terrain Zones, Secret Room Floor & Event Telegraphs (Upright Y*ISO_TILT space)
        if (sim.inSecretRoom && sim.secretRoomKind) {
          drawSecretRoomPerimeter(ctx, sim.secretRoomKind, nowMs);
        } else {
          for (const z of sim.frameZones) {
            drawTerrainZoneGround(ctx, z, nowMs);
          }
        }
        for (const fl of sim.ritualFireLines) {
          drawRitualFireLine(ctx, fl.x1, fl.y1, fl.x2, fl.y2, fl.life, nowMs);
        }
        for (const es of sim.earthSplits) {
          drawEarthSplitFissure(ctx, es.x, es.y, es.angle, es.length, es.warnTimer <= 0, nowMs);
        }
        for (const mt of sim.meteorTelegraphs) {
          drawMeteorTelegraph(ctx, mt.x, mt.y, mt.radius, 1 - mt.timer / Math.max(0.01, mt.maxTimer), mt.isLavaRock);
        }
        if (sim.shrinkingRing) {
          drawShrinkingRingOverlay(ctx, sim.shrinkingRing.cx, sim.shrinkingRing.cy, sim.shrinkingRing.radius, nowMs);
        }

        // B0.5 Ground-plane pixel VFX decals (magic circles, heal sparkles) under characters
        for (let vi = 0; vi < sim.vfx.length; vi++) {
          const v = sim.vfx[vi];
          if (!v.id.startsWith('magic_circle_') && v.id !== 'heal_sparkle') continue;
          drawVfx(ctx, { ...v, y: v.y * ISO_TILT, squashY: v.squashY !== 1 ? v.squashY : ISO_TILT });
        }
        drawPackVfxLayer(ctx, sim.packVfx, true, ISO_TILT);
        if (sim.knightTauntCracks.length > 0) {
          drawKnightTauntGroundFx(ctx, sim.knightTauntCracks);
        }

        const depthItems: Array<{ sortY: number; draw: () => void }> = [];

        // B1. 3D Procedural Biome Landmarks + M1-M6 Map Obstacles, Breakables, Traps, Landmarks & Portals
        const visibleProps = getVisible25DProps(
          camWorldX,
          camScreenY,
          w,
          h,
          biome.themeStyle,
          sim.inSecretRoom ? -1 : sim.mapSeed
        );
        for (const prop of visibleProps) {
          depthItems.push({
            sortY: prop.y,
            draw: () => draw25DProp(ctx, prop, sim.player.x, sim.player.y, nowMs),
          });
        }
        for (const o of sim.frameObstacles) {
          const handTrig = Boolean(sim.graveHandCooldowns[o.id] && sim.graveHandCooldowns[o.id] > 4.5);
          depthItems.push({
            sortY: o.y,
            draw: () => drawMapObstacle(ctx, o, biome.themeStyle, sim.player.x, sim.player.y, nowMs, handTrig),
          });
        }
        const renderBreakables = sim.inSecretRoom ? sim.secretRoomBreakables : sim.frameBreakables;
        const fogGlow = sim.mapEvent === 'night_fog';
        for (const b of renderBreakables) {
          depthItems.push({
            sortY: b.y,
            draw: () => drawBreakableProp(ctx, b, sim.breakableHits[b.id] || 0, 3, nowMs, fogGlow),
          });
        }
        if (!sim.inSecretRoom) {
          for (const t of sim.frameTraps) {
            depthItems.push({
              sortY: t.y,
              draw: () => drawMapTrap(ctx, t, sim.trapStates[t.id], nowMs),
            });
          }
          for (const lm of sim.landmarks) {
            depthItems.push({
              sortY: lm.y,
              draw: () => drawLandmark25D(ctx, lm, nowMs),
            });
          }
          if (sim.secretPortal) {
            const sp = sim.secretPortal;
            depthItems.push({
              sortY: sp.y,
              draw: () => drawDimensionPortal25D(ctx, sp.x, sp.y, sp.remaining, nowMs, false),
            });
          }
          if (sim.treasureCart) {
            const tc = sim.treasureCart;
            depthItems.push({
              sortY: tc.y,
              draw: () => drawTreasureCart25D(ctx, tc.x, tc.y, tc.hp, tc.maxHp, tc.facingX, nowMs),
            });
          }
        } else if (sim.secretRoomCleared) {
          depthItems.push({
            sortY: -340,
            draw: () => drawDimensionPortal25D(ctx, 0, -340, sim.secretRoomTimer, nowMs, true),
          });
        }

        // B2. 3D Drops & Floating Elemental Orbs / Mana Gems
        for (const d of sim.drops) {
          if (Math.abs(d.x - sim.player.x) > cullHalfW || Math.abs(d.y - sim.player.y) > cullHalfH) continue;
          if (d.kind === 'element_orb') {
            if (d.elementId) {
              const elId = d.elementId;
              const hoverZ = 8 + Math.sin(nowMs * 0.006 + d.x * 0.04) * 3;
              const dimmed = sim.fusionCooldown > 0 && sim.heldElements.length >= 2;
              depthItems.push({
                sortY: d.y,
                draw: () => {
                  if (dimmed) {
                    ctx.save();
                    ctx.globalAlpha = 0.45;
                    drawElementOrbSprite(ctx, d.x, d.y * ISO_TILT - hoverZ, elId, nowMs);
                    ctx.restore();
                  } else {
                    drawElementOrbSprite(ctx, d.x, d.y * ISO_TILT - hoverZ, elId, nowMs);
                  }
                },
              });
            }
          } else if (d.kind === 'mana_gem') {
            const hoverZ = 8 + Math.sin(nowMs * 0.007 + d.y * 0.05) * 3;
            depthItems.push({
              sortY: d.y,
              draw: () => drawManaGemSprite(ctx, d.x, d.y * ISO_TILT - hoverZ, nowMs),
            });
          } else {
            const dropKind = d.kind;
            depthItems.push({
              sortY: d.y,
              draw: () => draw25DDrop(ctx, dropKind, d.x, d.y, nowMs),
            });
          }
        }

        // B3. 3D Extruded Holy Totems
        for (const tm of sim.totems) {
          depthItems.push({
            sortY: tm.y,
            draw: () => draw25DTotem(ctx, tm.x, tm.y, tm.evolved, nowMs),
          });
        }

        // B4. Vertical Sky Beams & Singularities (Heaven Pillars, Black Holes & Lightning Strikes)
        for (const ef of sim.elementalFields) {
          if (ef.kind !== 'heaven_pillar' && ef.kind !== 'black_hole') continue;
          depthItems.push({
            sortY: ef.y,
            draw: () =>
              drawElementalField(
                ctx,
                ef.x,
                ef.y * ISO_TILT,
                ef.radius,
                ef.color,
                ef.kind,
                ef.life / ef.maxLife,
                nowMs,
                ef.vfxKey,
                ef.maxLife - ef.life
              ),
          });
        }
        for (const fx of sim.groundFx) {
          if (fx.kind === 'lightning') {
            const t = Math.max(0, Math.min(1, 1 - fx.life / Math.max(0.001, fx.maxLife)));
            depthItems.push({
              sortY: fx.y,
              draw: () =>
                drawGroundFxSprite(
                  ctx,
                  'lightning',
                  fx.x,
                  fx.y,
                  fx.radius,
                  fx.maxRadius,
                  t,
                  fx.color
                ),
            });
          } else if (fx.kind === 'time_debt_clock') {
            const t = Math.max(0, Math.min(1, 1 - fx.life / Math.max(0.001, fx.maxLife)));
            depthItems.push({
              sortY: fx.y + 8,
              draw: () => drawTimeDebtClockFx(ctx, fx.x, fx.y, fx.radius, t, nowMs),
            });
          }
        }

        // B5. Enemies & Bosses (with Z-elevation for flying/reaper/wyrm units)
        for (const e of sim.enemies) {
          if (!e.isBoss && (Math.abs(e.x - sim.player.x) > cullHalfW || Math.abs(e.y - sim.player.y) > cullHalfH)) {
            continue;
          }
          const flyZ =
            e.kind === 'bat'
              ? 14 + Math.sin(nowMs * 0.009 + e.id) * 4
              : e.kind === 'boss_bat_king' || e.kind === 'boss_lich' || e.kind === 'boss_wyrm' || e.kind === 'reaper'
                ? 20 + Math.sin(nowMs * 0.005 + e.id) * 5
                : 0;
          const isFlyingRender = FLYING_ENEMY_KINDS.has(e.kind);
          const eZoneRender = !sim.inSecretRoom && !isFlyingRender ? getTerrainZoneAt(e.x, e.y, sim.frameZones) : null;
          const eSinkKind: 'water' | 'lava' | 'poison' | null =
            eZoneRender?.kind === 'water_puddle'
              ? 'water'
              : eZoneRender?.kind === 'lava_pool'
                ? 'lava'
                : eZoneRender?.kind === 'poison_swamp'
                  ? 'poison'
                  : null;
          depthItems.push({
            sortY: e.y,
            draw: () => {
              if (e.isGoldenBat) {
                ctx.save();
                ctx.strokeStyle = 'rgba(250, 204, 21, 0.9)';
                ctx.fillStyle = 'rgba(250, 204, 21, 0.22)';
                ctx.lineWidth = 2.4;
                ctx.beginPath();
                ctx.ellipse(e.x, e.y * ISO_TILT - flyZ, e.radius + 7, (e.radius + 7) * 0.72, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();
                ctx.restore();
              } else if (e.isElite) {
                ctx.save();
                ctx.strokeStyle = 'rgba(245, 158, 11, 0.85)';
                ctx.lineWidth = 2.5;
                ctx.beginPath();
                ctx.ellipse(e.x, e.y * ISO_TILT, e.radius + 6, (e.radius + 6) * 0.65, 0, 0, Math.PI * 2);
                ctx.stroke();
                ctx.restore();
              }
              drawEnemySprite({
                ctx,
                kind: e.kind,
                x: e.x,
                y: e.y * ISO_TILT - flyZ - (e.elevZ || 0),
                radius: e.radius,
                hp: e.hp,
                maxHp: e.maxHp,
                hitFlash: e.hitFlash > 0,
                frozen: Boolean(e.freezeTimer && e.freezeTimer > 0),
                hardFrozen: Boolean(e.hardFreezeTimer && e.hardFreezeTimer > 0),
                chronoFrozen: Boolean(e.chronoFrozenThisFrame),
                burning: Boolean(e.burnTimer && e.burnTimer > 0),
                windMarked: Boolean(e.windMarkTimer && e.windMarkTimer > 0),
                isBoss: e.isBoss,
                isMajorBoss: e.isMajorBoss,
                isReaper: e.isReaper,
                buffs: e.buffs,
                berserkActive: e.berserkActive,
                staggered: Boolean(e.staggerTimer && e.staggerTimer > 0),
                stagger: e.stagger,
                maxStagger: e.maxStagger,
                windupTimer: e.windupTimer,
                phaseAngle: e.phaseAngle,
                nowMs,
                vx: e.vx,
                vy: e.vy,
                id: e.id,
                huntMarks: e.huntMarks,
                hellfireStacks: e.hellfireStacks,
                bleedStacks: e.bleedStacks,
                charmed: Boolean(e.charmTimer && e.charmTimer > 0),
                sinkKind: eSinkKind,
                hitReactProgress:
                  e.hitReactTimer && e.hitReactTimer > 0 && e.hitReactMax
                    ? Math.max(0, Math.min(1, e.hitReactTimer / e.hitReactMax))
                    : 0,
                hitStrength: e.hitStrength ?? 1,
                recoilX: e.recoilX ?? 0,
                recoilY: e.recoilY ?? 0,
                judgementActive: Boolean(e.judgementTimer && e.judgementTimer > 0),
                knightParryHint:
                  sim.raceClass === 'knight' &&
                  e.windupTimer > 0 &&
                  Math.hypot(e.x - sim.player.x, e.y - sim.player.y) <= 130 + e.radius,
                parriedStunTimer: e.parriedStunTimer || 0,
                knightTauntBangTimer: e.knightTauntBangTimer || 0,
              });
            },
          });
        }

        // B6. Summoned Golems, Planted Excalibur, Demon Imps, Seven Sins & Hovering Spirit Swords
        if (sim.golem && sim.golem.respawnTimer <= 0) {
          const g = sim.golem;
          depthItems.push({
            sortY: g.y,
            draw: () =>
              drawHolyGolemSprite(
                ctx,
                g.x,
                g.y * ISO_TILT,
                g.walkCycle,
                g.smashingTimer > 0,
                nowMs,
                g.hp,
                g.maxHp,
                sim.raceClass === 'saint' && sim.ultActiveTimer > 0,
                sim.raceClass === 'saint' && sim.ultAscended
              ),
          });
        }
        if (sim.plantedExcalibur) {
          const ex = sim.plantedExcalibur;
          depthItems.push({
            sortY: ex.y,
            draw: () => drawExcaliburPlanted(ctx, ex.x, ex.y * ISO_TILT, ex.life / Math.max(0.01, ex.maxLife), nowMs),
          });
        }
        for (const imp of sim.demonImps) {
          depthItems.push({
            sortY: imp.y,
            draw: () => drawDemonImpSprite(ctx, imp.x, imp.y * ISO_TILT, imp.vx, nowMs),
          });
        }
        if (sim.raceClass === 'seven_sins') {
          for (const sEnt of sim.sins) {
            if (!(sEnt.active || sEnt.tempSummonTimer > 0 || sim.ultActiveTimer > 0) || sEnt.respawnTimer > 0 || sEnt.hp <= 0) {
              continue;
            }
            depthItems.push({
              sortY: sEnt.y,
              draw: () =>
                drawSinEntitySprite(
                  ctx,
                  sEnt.sinId,
                  sEnt.x,
                  sEnt.y * ISO_TILT,
                  sEnt.hp,
                  sEnt.maxHp,
                  sEnt.level,
                  sEnt.slothAwake,
                  sEnt.wrathStacks,
                  nowMs
                ),
            });
          }
        }
        if (sim.elementalGolem) {
          const eg = sim.elementalGolem;
          depthItems.push({
            sortY: eg.y,
            draw: () =>
              drawElementalGolemSprite(ctx, eg.x, eg.y * ISO_TILT, eg.walkCycle, eg.smashingTimer > 0, eg.theme, nowMs),
          });
        }
        for (const sw of sim.spiritSwords) {
          const hoverZ = 12 + Math.sin(nowMs * 0.007 + sw.angle) * 3;
          depthItems.push({
            sortY: sw.y,
            draw: () =>
              drawSpiritSwordSprite(ctx, sw.x, sw.y * ISO_TILT - hoverZ, sw.angle, sw.swingTimer, sw.hp, sw.maxHp, sw.element, nowMs),
          });
        }
        for (const m of sim.necroMinions) {
          depthItems.push({
            sortY: m.y,
            draw: () =>
              drawNecroMinionSprite(ctx, {
                id: m.id,
                kind: m.kind,
                x: m.x,
                y: m.y,
                vx: m.vx,
                vy: m.vy,
                radius: m.radius,
                hp: m.hp,
                maxHp: m.maxHp,
                life: m.life,
                maxLife: m.maxLife,
                fealtyBuffed: m.fealtyBuffed,
                isMiniBoss: m.isMiniBoss,
                hitFlash: m.hitFlash > 0,
                nowMs,
              }),
          });
        }

        // B6.5 Companion Pet
        const activePetDrawId = saveRef.current.equippedPet;
        if (activePetDrawId) {
          depthItems.push({
            sortY: sim.petY,
            draw: () =>
              draw25DPet(
                ctx,
                activePetDrawId,
                sim.petX,
                sim.petY * ISO_TILT,
                nowMs,
                activePetDrawId === 'mini_ghost' && sim.petShieldCooldown <= 0
              ),
          });
        }

        // B7. Hero Character (+ optional Race Skin aura)
        const skinId = saveRef.current.activeSkinByRace[raceId];
        const skinDef = RACE_SKINS.find((sk) => sk.id === skinId);
        const skinAuraHex = skinDef && skinDef.id !== 'default' ? skinDef.auraHex : undefined;

        depthItems.push({
          sortY: sim.player.y,
          draw: () => {
            if (skinAuraHex) {
              ctx.save();
              ctx.strokeStyle = skinAuraHex;
              ctx.globalAlpha = 0.72;
              ctx.lineWidth = 2.4;
              ctx.beginPath();
              ctx.ellipse(sim.player.x, sim.player.y * ISO_TILT + 2, 20, 12, 0, 0, Math.PI * 2);
              ctx.stroke();
              ctx.restore();
            }
            drawHeroSprite({
              ctx,
              raceId,
              raceClass: sim.raceClass,
              x: sim.player.x,
              y: sim.player.y * ISO_TILT - sim.playerElevZ,
              facingX:
                sim.castAnimTimer > 0 && raceId === 'mage' && (!sim.raceClass || sim.raceClass === 'time_god')
                  ? sim.castFacingX
                  : sim.player.facingX,
              facingY: sim.player.facingY,
              walkCycle: sim.player.walkCycle,
              isMoving: Math.hypot(sim.player.vx, sim.player.vy) > 5,
              visualFacingAngle: sim.player.visualFacingAngle,
              moveSpeedRatio: sim.player.moveSpeedRatio,
              accentColor: (sim.raceClass ? RACE_CLASSES[sim.raceClass]?.color : undefined) || RACES[raceId].accentColor,
              isDashing: sim.dashTimer > 0,
              hitFlash: sim.player.hitFlash > 0,
              isNight: stats.isNight,
              snared: sim.snareTimer > 0,
              heldElements: sim.heldElements,
              fusionCooldown: sim.fusionCooldown,
              fusionMaxCooldown: sim.fusionMaxCooldown,
              voidInfusionActive: sim.voidInfusionActive,
              mageBarrierTimer: sim.mageBarrierTimer,
              spellbladeColor: sim.spellbladeInfusionColor,
              spellbladeFusionColors:
                sim.voidlessTimer > 0
                  ? getCombinedElementPalette(['fire', 'water', 'light', 'dark', 'wind'], '#E0F2FE').colors
                  : sim.lastSpellbladeFusion?.colors,
              spellbladeCharge: sim.spellbladeCharge,
              spellbladeSwinging: sim.spellbladeSwingTimer > 0,
              voidlessActive: sim.voidlessTimer > 0,
              phaseActive: stats.phaseSmallMonsters,
              batSwarmActive: sim.batSwarmTimer > 0,
              orcBerserkActive: sim.orcBerserkTimer > 0,
              ultActive: sim.ultActiveTimer > 0,
              ultAscended: sim.ultAscended,
              knightParryFlash: sim.knightParryFlash,
              knightAegisBonus: sim.knightAegisBonus,
              knightBulwarkStacks: sim.knightBulwarkStacks,
              knightBulwarkCrackTimer: sim.knightBulwarkCrackTimer,
              knightTauntWindup: sim.knightTauntWindup,
              knightUltElapsed:
                sim.raceClass === 'knight' && sim.ultActiveTimer > 0
                  ? Math.max(0, (sim.ultActiveMax || 10) - sim.ultActiveTimer)
                  : 99,
              knightAscendFxTimer: sim.knightAscendFxTimer,
              knightHitKnockbackX: sim.knightHitKnockbackX,
              knightHitSparkTimer: sim.knightHitSparkTimer,
              saintShieldHits: sim.saintShieldHits,
              demonCrownActive: sim.raceClass === 'demon_lord' && sim.demonSoulKills >= 666,
              vampireBloodShieldPct:
                sim.raceClass === 'vampire_lord'
                  ? Math.min(1, sim.vampireBloodShield / Math.max(1, sim.player.maxHp * 0.25))
                  : 0,
              vampireBloodlustRatio:
                sim.raceClass === 'vampire_lord'
                  ? Math.max(0, Math.min(1, (sim.player.maxHp - sim.player.hp) / Math.max(1, sim.player.maxHp)))
                  : 0,
              nowMs,
              sinkKind: sim.playerSinkKind,
              castAnimTimer: sim.castAnimTimer,
              hunterDashCharges: sim.hunterDashCharges,
              hunterDashMaxCharges: sim.hunterDashMaxCharges,
            });
            if (sim.weapons.some((it) => it.id === 'lightning' && it.evolved)) {
              drawPackVfx(
                ctx,
                'lightning_cloud_evo',
                sim.player.x,
                sim.player.y * ISO_TILT - 74 - sim.playerElevZ,
                nowMs * 0.001,
                { scale: 1.45, alpha: 0.94 }
              );
            }
          },
        });

        // B8. 360-Degree Sweeping Lasers
        for (const sl of sim.sweepingLasers) {
          depthItems.push({
            sortY: sim.player.y + 1,
            draw: () =>
              drawSweepingLaser(
                ctx,
                sim.player.x,
                sim.player.y,
                sl.angle,
                sl.length,
                sl.width,
                sl.color,
                sl.life / sl.maxLife,
                sl.vfxKey
              ),
          });
        }

        // B9. Orbiting Weapons in 2.5D Elliptical Perspective (CraftPix weapon/magic sprites)
        for (const ob of sim.orbitingBlades) {
          const bx = sim.player.x + Math.cos(ob.angle) * ob.orbitRadius;
          const by = sim.player.y + Math.sin(ob.angle) * ob.orbitRadius;
          depthItems.push({
            sortY: by,
            draw: () =>
              drawOrbitWeaponSprite(
                ctx,
                'blade',
                bx,
                by * ISO_TILT - 14,
                ob.radius,
                ob.angle + nowMs * 0.012,
                false,
                ob.color,
                Math.min(1, ob.life * 2),
                ob.vfxKey
              ),
          });
        }

        const shieldW = sim.weapons.find((it) => it.id === 'shield');
        if (shieldW) {
          const evo = shieldW.evolved;
          const count = evo ? 6 : Math.min(5, 1 + shieldW.level);
          const orbitR = (evo ? 86 : 68 + shieldW.level * 4) * stats.areaMult;
          const orbR = (evo ? 18 : 13 + shieldW.level) * stats.areaMult;
          for (let i = 0; i < count; i++) {
            const a = sim.orbitAngle * (evo ? 1.25 : 0.95) + (i * Math.PI * 2) / count;
            const sx = sim.player.x + Math.cos(a) * orbitR;
            const sy = sim.player.y + Math.sin(a) * orbitR;
            depthItems.push({
              sortY: sy,
              draw: () =>
                drawOrbitWeaponSprite(
                  ctx,
                  'shield',
                  sx,
                  sy * ISO_TILT - 14,
                  orbR,
                  0,
                  evo,
                  evo ? '#10B981' : '#34D399'
                ),
            });
          }
        }

        const fireOrbW = sim.weapons.find((it) => it.id === 'fireorb');
        if (fireOrbW) {
          const evo = fireOrbW.evolved;
          const count = evo ? 6 : Math.min(5, 1 + fireOrbW.level);
          const orbitR = (evo ? 128 : 96 + fireOrbW.level * 6) * stats.areaMult;
          const orbR = (evo ? 18 : 12 + fireOrbW.level) * stats.areaMult;
          for (let i = 0; i < count; i++) {
            const a = -sim.orbitAngle * (evo ? 1.35 : 1.05) + (i * Math.PI * 2) / count;
            const fx = sim.player.x + Math.cos(a) * orbitR;
            const fy = sim.player.y + Math.sin(a) * orbitR;
            depthItems.push({
              sortY: fy,
              draw: () =>
                drawOrbitWeaponSprite(
                  ctx,
                  'fireorb',
                  fx,
                  fy * ISO_TILT - 14,
                  orbR,
                  a + Math.PI / 2,
                  evo,
                  evo ? '#F97316' : '#FB923C'
                ),
            });
          }
        }

        const chainW = sim.weapons.find((it) => it.id === 'chain');
        if (chainW) {
          const evo = chainW.evolved;
          const count = evo ? 3 : chainW.level >= 5 ? 3 : chainW.level >= 3 ? 2 : 1;
          const orbitR = (evo ? 145 : 95 + chainW.level * 9) * stats.areaMult;
          const orbR = (evo ? 22 : 14 + chainW.level * 1.5) * stats.areaMult;
          for (let i = 0; i < count; i++) {
            const a = sim.orbitAngle * (evo ? 1.7 : 1.25) + (i * Math.PI * 2) / count;
            const cx = sim.player.x + Math.cos(a) * orbitR;
            const cy = sim.player.y + Math.sin(a) * orbitR;
            depthItems.push({
              sortY: cy,
              draw: () => {
                ctx.save();
                ctx.strokeStyle = evo ? '#FB7185' : '#94A3B8';
                ctx.lineWidth = 2.5;
                ctx.setLineDash([5, 4]);
                ctx.beginPath();
                ctx.moveTo(sim.player.x, sim.player.y * ISO_TILT - 12);
                ctx.lineTo(cx, cy * ISO_TILT - 14);
                ctx.stroke();
                ctx.setLineDash([]);
                ctx.restore();
                drawOrbitWeaponSprite(
                  ctx,
                  'chain',
                  cx,
                  cy * ISO_TILT - 14,
                  orbR,
                  a + nowMs * 0.01,
                  evo,
                  evo ? '#E11D48' : '#94A3B8'
                );
              },
            });
          }
        }

        // B10. Z-Elevated Projectiles (Parabolic arcs for axes/bananas & descending meteors)
        for (const p of sim.projectiles) {
          if (Math.abs(p.x - sim.player.x) > cullHalfW || Math.abs(p.y - sim.player.y) > cullHalfH) continue;
          let projZ = 12;
          if (p.weaponId === 'axe' || p.weaponId === 'banana') {
            const arcT = p.maxLife > 0 ? 1 - p.life / p.maxLife : 0.5;
            projZ = 14 + Math.sin(arcT * Math.PI) * 36;
          } else if (p.weaponId === 'meteor') {
            const arcT = p.maxLife > 0 ? 1 - p.life / p.maxLife : 0.5;
            projZ = 16 + (1 - arcT) * 85;
          }
          depthItems.push({
            sortY: p.y + 0.5,
            draw: () =>
              drawProjectileSprite(
                ctx,
                p.weaponId,
                p.x,
                p.y * ISO_TILT - projZ,
                p.radius,
                p.rotation,
                p.evolved,
                p.color,
                p.customKind,
                p.vfxKey,
                p.vfxTint,
                p.maxLife - p.life
              ),
          });
        }

        // B11. Z-Elevated Enemy Bullets (CraftPix magic bolts)
        for (const b of sim.enemyBullets) {
          depthItems.push({
            sortY: b.y + 0.5,
            draw: () =>
              drawEnemyBulletSprite(ctx, b.x, b.y * ISO_TILT - 12, b.radius, b.color, b.isSnare),
          });
        }

        // Sort all upright entities back-to-front by world Y (Painter's Algorithm)
        depthItems.sort((a, b) => a.sortY - b.sortY);
        for (let i = 0; i < depthItems.length; i++) {
          depthItems[i].draw();
        }
        if (sim.raceClass === 'knight' && sim.knightSacredBlades.length > 0 && sim.knightUltFinaleTimer <= 0) {
          drawKnightSacredBladesWorld(
            ctx,
            sim.knightSacredBlades,
            sim.ultActiveTimer > 0 && 10 - sim.ultActiveTimer >= 1.2,
            nowMs
          );
        }

        // B11.5 Translucent 3D Stasis Dome Shells arching over ground clocks
        for (const well of sim.chronoWells) {
          drawChronoDomeShell(
            ctx,
            well.x,
            well.y,
            well.radius,
            well.life / Math.max(0.01, well.maxLife),
            nowMs,
            sim.timeStopTimer > 0
          );
        }

        // B12. Foreground pixel & HD sprite VFX effects (slashes, crits, parry, smites, eclipse, pillars, shields)
        for (const fx of sim.groundFx) {
          if (
            !fx.upright ||
            fx.kind === 'lightning' ||
            fx.kind === 'time_debt_clock' ||
            fx.kind === 'paladin_sword' ||
            fx.kind === 'shadow_cut' ||
            fx.kind === 'judgement_rift' ||
            fx.kind === 'knight_crescent_wave'
          ) {
            continue;
          }
          const t = Math.max(0, Math.min(1, 1 - fx.life / Math.max(0.001, fx.maxLife)));
          drawGroundFxSprite(
            ctx,
            fx.kind,
            fx.x,
            fx.y * ISO_TILT - (fx.zOffset ?? 0),
            fx.radius,
            fx.maxRadius,
            t,
            fx.color,
            fx.x2,
            fx.y2,
            fx.angle,
            fx.vfxId,
            fx.dw,
            fx.dh,
            fx.vfxKey,
            fx.loopFps ?? 0,
            fx.maxLife - fx.life
          );
        }
        for (let vi = 0; vi < sim.vfx.length; vi++) {
          const v = sim.vfx[vi];
          if (v.id.startsWith('magic_circle_') || v.id === 'heal_sparkle') continue;
          drawVfx(ctx, { ...v, y: v.y * ISO_TILT });
        }
        drawPackVfxLayer(ctx, sim.packVfx, false, ISO_TILT);

        // 10. Particles, Soul Absorption Orbs & Floating Damage Numbers in Upright 2.5D Space
        for (const pt of sim.particles) {
          if (pt.shape || pt.secondaryColor || pt.glow) {
            drawStyledParticle(ctx, pt);
          } else {
            ctx.globalAlpha = Math.max(0, pt.life / pt.maxLife);
            ctx.fillStyle = pt.color;
            ctx.beginPath();
            ctx.arc(pt.x, pt.y * ISO_TILT - (pt.zOffset ?? 10), pt.radius, 0, Math.PI * 2);
            ctx.fill();
          }
        }
        ctx.globalAlpha = 1;

        for (const orb of sim.necroSoulOrbs) {
          const sx = orb.x;
          const sy = orb.y * ISO_TILT - orb.zOffset;
          if (orb.trail.length > 1) {
            for (let ti = 0; ti < orb.trail.length; ti++) {
              const tp = orb.trail[ti];
              const ratio = (ti + 1) / orb.trail.length;
              ctx.globalAlpha = ratio * 0.45;
              ctx.fillStyle = orb.color;
              ctx.beginPath();
              ctx.arc(tp.x, tp.y * ISO_TILT - tp.z, orb.radius * ratio * 0.78, 0, Math.PI * 2);
              ctx.fill();
            }
          }
          ctx.globalAlpha = 0.34;
          ctx.fillStyle = orb.glowColor;
          ctx.beginPath();
          ctx.arc(sx, sy, orb.radius * 2.35, 0, Math.PI * 2);
          ctx.fill();

          ctx.globalAlpha = 0.92;
          ctx.fillStyle = orb.color;
          ctx.beginPath();
          ctx.arc(sx, sy, orb.radius, 0, Math.PI * 2);
          ctx.fill();

          ctx.globalAlpha = 0.95;
          ctx.fillStyle = '#F8FAFC';
          ctx.beginPath();
          ctx.arc(sx, sy, orb.radius * 0.44, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalAlpha = 1;

        ctx.textAlign = 'center';
        ctx.lineJoin = 'round';
        for (const ft of sim.floatingTexts) {
          const lifeRatio = Math.max(0, ft.life / ft.maxLife);
          const alpha = ft.isDamage ? Math.min(1, lifeRatio * 1.65) : lifeRatio;
          const ageRatio = 1 - lifeRatio;
          const popScale = ft.bounceOutline
            ? 1 + Math.sin(ageRatio * Math.PI) * 0.45 - ageRatio * 0.12
            : ft.isDamage
              ? ageRatio < 0.18
                ? 1 + (1 - ageRatio / 0.18) * (ft.isCrit ? 0.42 : 0.28)
                : 1
              : 1;
          ctx.globalAlpha = alpha;
          ctx.font = `800 ${Math.round(13 * ft.scale * popScale)}px 'JetBrains Mono', monospace`;
          const fy = ft.y * ISO_TILT - 26;
          ctx.strokeStyle = ft.bounceOutline ? '#fffbe0' : 'rgba(2, 6, 17, 0.92)';
          ctx.lineWidth = ft.bounceOutline ? 3.5 : ft.isCrit ? 3.8 : 3.0;
          ctx.strokeText(ft.text, ft.x, fy);
          ctx.fillStyle = ft.color;
          ctx.fillText(ft.text, ft.x, fy);
        }
        ctx.globalAlpha = 1;

        ctx.restore(); // End upright 2.5D world space

        // 11. Night Fog Vision Overlay & Off-screen Directional Arrows (Chests, Landmarks, Portal, Cart)
        if (sim.mapEvent === 'night_fog' && !sim.inSecretRoom) {
          const beacons: { x: number; y: number; color: string }[] = [];
          for (const d of sim.drops) {
            if (d.kind === 'chest' || d.kind === 'artifact_chest' || d.kind === 'sealed_chest' || d.kind === 'gold_pouch') {
              beacons.push({
                x: d.x - camWorldX,
                y: d.y * ISO_TILT - camScreenY,
                color: d.kind === 'artifact_chest' ? '#C084FC' : '#FBBF24',
              });
            }
          }
          for (const lm of sim.landmarks) {
            if (!lm.used) {
              beacons.push({
                x: lm.x - camWorldX,
                y: lm.y * ISO_TILT - camScreenY,
                color: LANDMARK_META[lm.kind].color,
              });
            }
          }
          if (sim.secretPortal) {
            beacons.push({
              x: sim.secretPortal.x - camWorldX,
              y: sim.secretPortal.y * ISO_TILT - camScreenY,
              color: '#E879F9',
            });
          }
          if (sim.treasureCart) {
            beacons.push({
              x: sim.treasureCart.x - camWorldX,
              y: sim.treasureCart.y * ISO_TILT - camScreenY,
              color: '#FACC15',
            });
          }
          drawNightFogOverlay(
            ctx,
            w,
            h,
            sim.player.x - camWorldX,
            sim.player.y * ISO_TILT - camScreenY - sim.playerElevZ,
            beacons
          );
        }

        for (const d of sim.drops) {
          if (d.kind !== 'chest' && d.kind !== 'artifact_chest' && d.kind !== 'sealed_chest') continue;
          const distM = Math.max(1, Math.round(Math.hypot(d.x - sim.player.x, d.y - sim.player.y) / 30));
          drawOffscreenArrow(
            ctx,
            w,
            h,
            camWorldX,
            camScreenY,
            d.x,
            d.y,
            d.kind === 'artifact_chest' ? 'หีบ Artifact' : d.kind === 'sealed_chest' ? 'หีบปิดผนึก' : 'หีบสมบัติ',
            distM,
            d.kind === 'artifact_chest' ? '#C084FC' : d.kind === 'sealed_chest' ? '#F59E0B' : '#FBBF24',
            nowMs
          );
        }
        if (!sim.inSecretRoom) {
          for (const lm of sim.landmarks) {
            if (lm.used) continue;
            const dRaw = Math.hypot(lm.x - sim.player.x, lm.y - sim.player.y);
            if (!lm.revealed && !sim.landmarkRevealActive && dRaw > 2200) continue;
            const meta = LANDMARK_META[lm.kind];
            drawOffscreenArrow(
              ctx,
              w,
              h,
              camWorldX,
              camScreenY,
              lm.x,
              lm.y,
              meta.shortTh,
              Math.max(1, Math.round(dRaw / 30)),
              meta.color,
              nowMs
            );
          }
          if (sim.secretPortal) {
            const distM = Math.max(
              1,
              Math.round(Math.hypot(sim.secretPortal.x - sim.player.x, sim.secretPortal.y - sim.player.y) / 30)
            );
            drawOffscreenArrow(
              ctx,
              w,
              h,
              camWorldX,
              camScreenY,
              sim.secretPortal.x,
              sim.secretPortal.y,
              'ประตูมิติลับ',
              distM,
              '#E879F9',
              nowMs
            );
          }
          if (sim.treasureCart) {
            const distM = Math.max(
              1,
              Math.round(Math.hypot(sim.treasureCart.x - sim.player.x, sim.treasureCart.y - sim.player.y) / 30)
            );
            drawOffscreenArrow(
              ctx,
              w,
              h,
              camWorldX,
              camScreenY,
              sim.treasureCart.x,
              sim.treasureCart.y,
              'เกวียนสมบัติ',
              distM,
              '#FACC15',
              nowMs
            );
          }
        }

        // 11.5 Subtle 2.5D Top-of-Horizon Atmospheric Depth Haze
        const horizonGrad = ctx.createLinearGradient(0, 0, 0, h * 0.22);
        horizonGrad.addColorStop(0, 'rgba(4, 7, 15, 0.24)');
        horizonGrad.addColorStop(1, 'rgba(4, 7, 15, 0)');
        ctx.fillStyle = horizonGrad;
        ctx.fillRect(0, 0, w, h * 0.22);

        // 12. Temporal Environmental Atmosphere (Smooth Day/Dusk/Night, Changing Fog Intensity, Falling Leaves/Ash)
        drawTemporalAtmosphereOverlay(
          ctx,
          w,
          h,
          biome.themeStyle,
          sim.elapsedSeconds,
          camWorldX,
          camScreenY,
          nowMs
        );

        // 13. Dynamic Weather Atmospheric Overlay (Fog, Sandstorm, Rain, Blizzard, Blood Rain)
        drawWeatherOverlay(
          ctx,
          w,
          h,
          sim.weather,
          sim.weatherLightningFlash,
          camWorldX,
          camScreenY,
          nowMs
        );

        // 13.5 Class Ultimate Screen Tint + Vampire Low-HP Red Vignette + Time God Edge Aura
        if (sim.ultActiveTimer > 0) {
          const knightUltElapsed = sim.raceClass === 'knight' ? Math.max(0, (sim.ultActiveMax || 10) - sim.ultActiveTimer) : 0;
          if (sim.raceClass === 'knight' && knightUltElapsed >= 1.2) {
            drawKnightUltBgPillars(ctx, sim.knightUltBgPillars);
          }
          const ultTint =
            sim.raceClass === 'hunter'
              ? 'rgba(15, 23, 42, 0.24)'
              : sim.raceClass === 'saint'
                ? 'rgba(250, 204, 21, 0.11)'
                : sim.raceClass === 'knight'
                  ? knightUltElapsed >= 1.2
                    ? 'rgba(255, 215, 94, 0.12)'
                    : 'rgba(255, 215, 94, 0.04)'
                  : sim.raceClass === 'demon_lord'
                    ? 'rgba(220, 38, 38, 0.18)'
                    : sim.raceClass === 'vampire_lord'
                      ? 'rgba(136, 19, 55, 0.26)'
                      : 'rgba(88, 28, 135, 0.22)';
          ctx.fillStyle = ultTint;
          ctx.fillRect(0, 0, w, h);
        }
        if (sim.raceClass === 'knight' && sim.ultActiveTimer > 0) {
          drawKnightExcaliburIntroOverlay(
            ctx,
            w,
            h,
            camWorldX,
            camScreenY,
            sim.knightUltIntroX,
            sim.knightUltIntroY,
            Math.max(0, (sim.ultActiveMax || 10) - sim.ultActiveTimer)
          );
        }
        if (sim.raceClass === 'knight' && sim.knightUltFinaleTimer > 0) {
          drawKnightUltFinaleFx(
            ctx,
            w,
            h,
            camWorldX,
            camScreenY,
            sim.knightUltFinaleX,
            sim.knightUltFinaleY,
            Math.max(0, Math.min(1, 1 - sim.knightUltFinaleTimer)),
            nowMs
          );
        }
        if (sim.raceClass === 'knight' && sim.knightParryOverlayTimer > 0) {
          // Section 3 Parry Isolation: 60% dark-blue screen filter except Knight, parried enemies/bullets, parry VFX & PARRY! text
          ctx.save();
          ctx.fillStyle = 'rgba(14, 42, 74, 0.6)';
          ctx.fillRect(0, 0, w, h);
          ctx.translate(-camWorldX, -camScreenY);
          for (const e of sim.enemies) {
            if (!sim.knightParryTargetIds.has(e.id) || e.hp <= 0) continue;
            drawEnemySprite({
              ctx,
              kind: e.kind,
              x: e.x,
              y: e.y * ISO_TILT - (e.elevZ || 0),
              radius: e.radius,
              hp: e.hp,
              maxHp: e.maxHp,
              hitFlash: false,
              frozen: false,
              isBoss: e.isBoss,
              isMajorBoss: e.isMajorBoss,
              isReaper: e.isReaper,
              buffs: e.buffs,
              berserkActive: e.berserkActive,
              windupTimer: e.windupTimer,
              phaseAngle: e.phaseAngle,
              nowMs,
              vx: e.vx,
              vy: e.vy,
              id: e.id,
              knightParryHint: true,
            });
          }
          for (const b of sim.knightParryBulletSnap) {
            drawEnemyBulletSprite(ctx, b.x, b.y * ISO_TILT - 12, b.radius, '#ffd75e', false);
          }
          drawHeroSprite({
            ctx,
            raceId,
            raceClass: sim.raceClass,
            x: sim.player.x,
            y: sim.player.y * ISO_TILT - sim.playerElevZ,
            facingX: sim.player.facingX,
            facingY: sim.player.facingY,
            walkCycle: sim.player.walkCycle,
            isMoving: false,
            visualFacingAngle: sim.player.visualFacingAngle,
            moveSpeedRatio: 0,
            accentColor: RACE_CLASSES.knight.color,
            isDashing: sim.dashTimer > 0,
            hitFlash: false,
            isNight: stats.isNight,
            snared: false,
            heldElements: sim.heldElements,
            fusionCooldown: sim.fusionCooldown,
            fusionMaxCooldown: sim.fusionMaxCooldown,
            voidInfusionActive: sim.voidInfusionActive,
            mageBarrierTimer: sim.mageBarrierTimer,
            ultActive: sim.ultActiveTimer > 0,
            ultAscended: sim.ultAscended,
            knightParryFlash: sim.knightParryFlash,
            knightAegisBonus: sim.knightAegisBonus,
            knightBulwarkStacks: sim.knightBulwarkStacks,
            knightBulwarkCrackTimer: sim.knightBulwarkCrackTimer,
            knightTauntWindup: sim.knightTauntWindup,
            knightUltElapsed: sim.ultActiveTimer > 0 ? Math.max(0, (sim.ultActiveMax || 10) - sim.ultActiveTimer) : 99,
            knightAscendFxTimer: sim.knightAscendFxTimer,
            nowMs,
          });
          if (sim.knightSacredBlades.length > 0) {
            drawKnightSacredBladesWorld(ctx, sim.knightSacredBlades, sim.ultActiveTimer > 0, nowMs);
          }
          for (const inst of sim.packVfx) {
            if (inst.key === 'knight_parry') {
              drawPackVfx(ctx, 'knight_parry', inst.x, inst.y * ISO_TILT, inst.elapsed, {
                scale: inst.scale,
                alpha: 1,
              });
            }
          }
          for (const fx of sim.groundFx) {
            if (fx.kind === 'vfx' && fx.vfxId === 'parry') {
              const t = Math.max(0, Math.min(1, 1 - fx.life / Math.max(0.001, fx.maxLife)));
              drawGroundFxSprite(
                ctx,
                'vfx',
                fx.x,
                fx.y * ISO_TILT - (fx.zOffset ?? 0),
                fx.radius,
                fx.maxRadius,
                t,
                fx.color,
                fx.x2,
                fx.y2,
                fx.angle,
                fx.vfxId,
                fx.dw,
                fx.dh
              );
            }
          }
          ctx.textAlign = 'center';
          ctx.lineJoin = 'round';
          for (const ft of sim.floatingTexts) {
            if (!ft.bounceOutline) continue;
            const ageRatio = Math.max(0, Math.min(1, 1 - ft.life / Math.max(0.01, ft.maxLife)));
            const popScale = 1 + Math.sin(ageRatio * Math.PI) * 0.45 - ageRatio * 0.12;
            ctx.font = `800 ${Math.round(13 * ft.scale * popScale)}px 'JetBrains Mono', monospace`;
            const fy = ft.y * ISO_TILT - 26;
            ctx.strokeStyle = '#fffbe0';
            ctx.lineWidth = 3.5;
            ctx.strokeText(ft.text, ft.x, fy);
            ctx.fillStyle = ft.color;
            ctx.fillText(ft.text, ft.x, fy);
          }
          ctx.restore();
        }
        if (sim.knightFullScreenFlashTimer > 0) {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
          ctx.fillRect(0, 0, w, h);
        }
        if (sim.raceClass === 'vampire_lord' && sim.player.hp < sim.player.maxHp * 0.75) {
          const lowRatio = Math.max(0, Math.min(1, 1 - sim.player.hp / Math.max(1, sim.player.maxHp)));
          const beat = 0.75 + Math.sin(nowMs * (0.008 + lowRatio * 0.012)) * 0.25;
          const vGrad = ctx.createRadialGradient(w * 0.5, h * 0.5, Math.min(w, h) * 0.35, w * 0.5, h * 0.5, Math.hypot(w, h) * 0.55);
          vGrad.addColorStop(0, 'rgba(190, 18, 60, 0)');
          vGrad.addColorStop(1, `rgba(190, 18, 60, ${(lowRatio * 0.34 * beat).toFixed(3)})`);
          ctx.fillStyle = vGrad;
          ctx.fillRect(0, 0, w, h);
        }
        if (sim.timeStopTimer > 0) {
          ctx.save();
          ctx.fillStyle = 'rgba(103, 232, 249, 0.14)';
          ctx.fillRect(0, 0, w, h);
          ctx.globalCompositeOperation = 'saturation';
          ctx.fillStyle = 'rgba(180, 220, 235, 0.45)';
          ctx.fillRect(0, 0, w, h);
          ctx.restore();
          drawPackVfx(ctx, 'chronos_timestop', w * 0.5, h * 0.5, sim.elapsedSeconds, {
            scale: Math.max(2.0, Math.min(w, h) / 260),
            alpha: 0.42,
          });
          ctx.strokeStyle = 'rgba(34, 211, 238, 0.52)';
          ctx.lineWidth = 6;
          ctx.strokeRect(3, 3, w - 6, h - 6);
        }
        if (sim.rewindVisualTimer > 0) {
          const rwNorm = sim.rewindVisualTimer / 0.5;
          ctx.save();
          ctx.globalCompositeOperation = 'saturation';
          ctx.fillStyle = `rgba(140, 140, 140, ${Math.min(0.95, rwNorm * 1.15).toFixed(2)})`;
          ctx.fillRect(0, 0, w, h);
          ctx.restore();

          // Giant reverse-spinning clock at center of screen
          const cx = w * 0.5;
          const cy = h * 0.5;
          const cr = Math.min(w, h) * 0.18 * (0.9 + (1 - rwNorm) * 0.25);
          ctx.save();
          ctx.globalAlpha = Math.min(0.92, rwNorm * 1.25);
          ctx.translate(cx, cy);
          ctx.strokeStyle = '#67E8F9';
          ctx.lineWidth = 5;
          ctx.beginPath();
          ctx.arc(0, 0, cr, 0, Math.PI * 2);
          ctx.stroke();
          ctx.strokeStyle = '#FDE047';
          ctx.lineWidth = 2.5;
          for (let hIdx = 0; hIdx < 12; hIdx++) {
            const ang = (hIdx / 12) * Math.PI * 2;
            ctx.beginPath();
            ctx.moveTo(Math.cos(ang) * cr * 0.84, Math.sin(ang) * cr * 0.84);
            ctx.lineTo(Math.cos(ang) * cr * 0.96, Math.sin(ang) * cr * 0.96);
            ctx.stroke();
          }
          const revAng = -nowMs * 0.022;
          ctx.strokeStyle = '#FDE047';
          ctx.lineWidth = 5;
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(Math.cos(revAng) * cr * 0.68, Math.sin(revAng) * cr * 0.68);
          ctx.moveTo(0, 0);
          ctx.lineTo(Math.cos(revAng * 2.2) * cr * 0.48, Math.sin(revAng * 2.2) * cr * 0.48);
          ctx.stroke();
          ctx.restore();
        }
        if (sim.chronoHudMotes.length > 0) {
          ctx.save();
          for (const m of sim.chronoHudMotes) {
            const alpha = Math.max(0, Math.min(1, m.life / Math.max(0.01, m.maxLife)));
            ctx.globalAlpha = alpha;
            ctx.fillStyle = '#67E8F9';
            ctx.beginPath();
            ctx.arc(m.x, m.y, 4.2, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#FDE047';
            ctx.beginPath();
            ctx.arc(m.x, m.y, 1.8, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.restore();
        }
        if (sim.mapEvent === 'void_corruption') {
          const pulse = 0.35 + Math.sin(nowMs * 0.006) * 0.12;
          ctx.strokeStyle = `rgba(192, 132, 252, ${pulse})`;
          ctx.lineWidth = 8;
          ctx.strokeRect(4, 4, w - 8, h - 8);
        } else if (sim.mapEvent === 'frenzy_horde') {
          const pulse = 0.28 + Math.sin(nowMs * 0.009) * 0.1;
          ctx.strokeStyle = `rgba(249, 115, 22, ${pulse})`;
          ctx.lineWidth = 7;
          ctx.strokeRect(3.5, 3.5, w - 7, h - 7);
        } else if (sim.mapEvent === 'god_blessing') {
          const pulse = 0.24 + Math.sin(nowMs * 0.004) * 0.08;
          ctx.strokeStyle = `rgba(253, 224, 71, ${pulse})`;
          ctx.lineWidth = 6;
          ctx.strokeRect(3, 3, w - 6, h - 6);
        }

        // 13.6 Combat Feedback Screen Flashes (White for powerful abilities, Red vignette for significant damage)
        if (sim.abilityFlash > 0 && sim.abilityFlashAlpha > 0) {
          const norm = Math.min(1, sim.abilityFlash / Math.max(0.01, sim.abilityFlashMax));
          const alpha = sim.abilityFlashAlpha * Math.pow(norm, 1.5);
          ctx.save();
          const cx = w * 0.5;
          const cy = h * 0.5;
          const outerR = Math.hypot(cx, cy);
          const abilityGrad = ctx.createRadialGradient(cx, cy, outerR * 0.12, cx, cy, outerR);
          abilityGrad.addColorStop(0, `rgba(255, 255, 255, ${alpha * 0.72})`);
          abilityGrad.addColorStop(1, `rgba(241, 245, 249, ${alpha})`);
          ctx.fillStyle = abilityGrad;
          ctx.fillRect(0, 0, w, h);
          ctx.restore();
        }
        if (sim.damageFlash > 0 && sim.damageFlashAlpha > 0) {
          const norm = Math.min(1, sim.damageFlash / Math.max(0.01, sim.damageFlashMax));
          const alpha = sim.damageFlashAlpha * Math.pow(norm, 1.35);
          ctx.save();
          const cx = w * 0.5;
          const cy = h * 0.5;
          const outerR = Math.hypot(cx, cy);
          const dmgGrad = ctx.createRadialGradient(cx, cy, outerR * 0.24, cx, cy, outerR);
          dmgGrad.addColorStop(0, `rgba(220, 38, 38, ${alpha * 0.16})`);
          dmgGrad.addColorStop(0.6, `rgba(220, 38, 38, ${alpha * 0.55})`);
          dmgGrad.addColorStop(1, `rgba(185, 28, 28, ${alpha})`);
          ctx.fillStyle = dmgGrad;
          ctx.fillRect(0, 0, w, h);
          ctx.strokeStyle = `rgba(239, 68, 68, ${Math.min(0.75, alpha * 1.35)})`;
          ctx.lineWidth = 10;
          ctx.strokeRect(5, 5, w - 10, h - 10);
          ctx.restore();
        }

        // 13.7 Ultimate Cut-In Slash Banner Overlay
        if (sim.ultCutinTimer > 0 && sim.ultCutinMax > 0) {
          const prog = 1 - sim.ultCutinTimer / sim.ultCutinMax;
          drawUltimateCutinOverlay(
            ctx,
            w,
            h,
            sim.ultCutinTitleTh,
            sim.ultCutinTitleEn,
            sim.ultCutinColor,
            prog
          );
        }

        // Virtual Joystick Feedback on Pointer Drag
        if (pointerDragRef.current.active) {
          const { startX, startY, currX, currY } = pointerDragRef.current;
          ctx.save();
          ctx.strokeStyle = 'rgba(248, 250, 252, 0.3)';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(startX, startY, 38, 0, Math.PI * 2);
          ctx.stroke();
          ctx.fillStyle = 'rgba(245, 158, 11, 0.55)';
          const dx = currX - startX;
          const dy = currY - startY;
          const dist = Math.hypot(dx, dy);
          const clamped = Math.min(34, dist);
          const kx = dist > 0 ? startX + (dx / dist) * clamped : startX;
          const ky = dist > 0 ? startY + (dy / dist) * clamped : startY;
          ctx.beginPath();
          ctx.arc(kx, ky, 14, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }

        ctx.restore();
      };

      const emitHud = () => {
        const sim = simRef.current;
        if (!sim) return;
        const stats = computeStats(sim);
        const biome = getActiveBiome(stageId, sim.realmTier, sim.biomeShiftCount);
        const realmMin = Math.floor(Math.max(0, sim.elapsedSeconds - sim.realmStartSeconds) / 60);
        const boss = sim.enemies.find((e) => e.isBoss && e.hp > 0);
        const cerbsAlive =
          boss?.kind === 'boss_cerberus'
            ? sim.enemies.filter((e) => e.kind === 'boss_cerberus' && e.hp > 0)
            : [];
        const reaperCasting = Boolean(boss && boss.isReaper && (boss.reaperSweepCastTimer || 0) > 0);
        const reaperCastMax = boss?.reaperSweepCastMax || 2.2;
        const reaperCastRem = Math.max(0, boss?.reaperSweepCastTimer || 0);
        const activeBossHud = boss
          ? cerbsAlive.length > 0
            ? {
                nameTh: `มินิบอสแฝดสาม: เซอร์เบอรัส (${cerbsAlive.length}/3 ร่าง)`,
                hp: Math.max(
                  0,
                  Math.round(cerbsAlive.reduce((acc, c) => acc + Math.max(0, c.hp), 0))
                ),
                maxHp: Math.round(cerbsAlive.reduce((acc, c) => acc + c.maxHp, 0)),
                isReaper: false,
                buffs: boss.buffs,
                berserkActive: cerbsAlive.some((c) => c.berserkActive),
                stagger: Math.round(boss.stagger || 0),
                maxStagger: Math.round(boss.maxStagger || 0),
                staggered: Boolean(boss.staggerTimer && boss.staggerTimer > 0),
                staggerRemaining: boss.staggerTimer || 0,
              }
            : {
                nameTh: boss.nameTh || 'บอส',
                hp: Math.max(0, Math.round(boss.hp)),
                maxHp: Math.round(boss.maxHp),
                isReaper: boss.isReaper,
                buffs: boss.buffs,
                berserkActive: boss.berserkActive,
                stagger: Math.round(boss.stagger || 0),
                maxStagger: Math.round(boss.maxStagger || 0),
                staggered: Boolean(boss.staggerTimer && boss.staggerTimer > 0),
                staggerRemaining: boss.staggerTimer || 0,
                ...(reaperCasting
                  ? {
                      castSkillNameTh: 'เคียวพิพากษากวาดล้าง',
                      castProgress: Math.max(0, Math.min(1, 1 - reaperCastRem / Math.max(0.01, reaperCastMax))),
                      castRemaining: reaperCastRem,
                      castMax: reaperCastMax,
                    }
                  : {}),
              }
          : null;
        const realmSecondsHud = Math.max(0, sim.elapsedSeconds - sim.realmStartSeconds);
        const earlyReaperHud = (saveRef.current.activeCurses.early_reaper || 0) > 0;
        const reaperTargetMinHud = earlyReaperHud ? 25 : 30;
        const reaperSpawnedHud =
          sim.spawnedBossMinutes.has(reaperTargetMinHud) ||
          sim.enemies.some((en) => en.isReaper && en.hp > 0);
        const reaperSecLeftHud = reaperTargetMinHud * 60 - realmSecondsHud;
        const reaperWarningHud =
          sim.reaperArrivedBannerTimer > 0
            ? {
                phase: 'arrived' as const,
                remainingSeconds: Math.ceil(sim.reaperArrivedBannerTimer),
                realmTier: sim.realmTier + 1,
              }
            : !sim.inSecretRoom && !reaperSpawnedHud && reaperSecLeftHud > 0 && reaperSecLeftHud <= 15
              ? {
                  phase: 'approaching' as const,
                  remainingSeconds: Math.max(1, Math.ceil(reaperSecLeftHud)),
                  realmTier: sim.realmTier + 1,
                }
              : null;
        const necroHudSummary = getNecroMinionHudSummary(sim);
        callbacksRef.current.onHudUpdate({
          hp: Math.max(0, Math.round(sim.player.hp)),
          maxHp: sim.player.maxHp,
          xp: sim.player.xp,
          xpToNext: sim.player.xpToNext,
          level: sim.player.level,
          elapsedSeconds: sim.elapsedSeconds,
          targetSeconds: TARGET_SECONDS,
          kills: sim.kills,
          goldEarned: sim.goldEarned,
          soulEssenceEarned: sim.soulEssenceEarned,
          pendingSealedChests: sim.pendingSealedChests,
          elitesKilled: sim.elitesKilled,
          curseLevel: sim.cachedCurseLevel,
          rerollsLeft: sim.rerollsLeft,
          banishesLeft: sim.banishesLeft,
          skipsLeft: sim.skipsLeft,
          metaRevivesLeft: sim.metaRevivesLeft,
          phoenixAvailable: sim.phoenixAvailable,
          activePotion: sim.activePotion,
          potionUsed: sim.potionUsed,
          goldDoubleTimer: sim.goldDoubleTimer,
          xpDoubleTimer: sim.xpDoubleTimer,
          fatePowderActive: sim.fatePowderActive,
          activePet: saveRef.current.equippedPet,
          equippedPet: saveRef.current.equippedPet,
          petCooldown: sim.petShieldCooldown,
          inRunQuests: sim.inRunQuests.map((q) => ({ ...q })),
          isNight: stats.isNight,
          dayNightProgress: stats.dayNightProgress,
          currentWaveTitle: getWaveForMinute(realmMin, sim.realmTier, biome.nameTh).titleTh,
          realmTier: sim.realmTier + 1,
          biomeNameTh: biome.nameTh,
          biomeAccentHex: biome.accentHex,
          weather: sim.weather,
          weatherNameTh: WEATHERS[sim.weather].nameTh,
          weatherEffectTh: WEATHERS[sim.weather].effectTh,
          weatherColor: WEATHERS[sim.weather].color,
          weatherRemainingSeconds: Math.max(0, Math.ceil(sim.weatherTimer)),
          weatherSlowed: sim.sandSlowTimer > 0 || sim.iceSlowTimer > 0,
          snared: sim.snareTimer > 0,
          reaperSlainCount: sim.reaperSlainCount,
          reaperCurseStacks: sim.reaperCurseStacks,
          combo: sim.combo || 0,
          comboBest: sim.comboBest || 0,
          comboMilestone: sim.comboMilestone || 0,
          comboMilestoneId: sim.comboMilestoneId || 0,
          comboBreakId: sim.comboBreakId || 0,
          comboBrokenAt: sim.comboBrokenAt || 0,
          weapons: sim.weapons.map((w) => ({ ...w })),
          relics: sim.relics.map((r) => ({ ...r })),
          artifacts: { ...sim.artifacts },
          activeBoss: activeBossHud,
          playerStats: {
            damageMult: stats.damageMult,
            moveSpeed: stats.moveSpeed,
            armor: stats.armor,
            cooldownMult: stats.cooldownMult,
            magnetRadius: stats.magnetRadius,
            critChance: sim.orcBerserkTimer > 0 ? 1 : stats.critChance,
            critDamageMult: stats.critDamageMult,
            lifestealPct: stats.lifestealPct,
          },
          dashCooldown:
            sim.raceClass === 'hunter'
              ? sim.hunterDashCharges > 0
                ? 0
                : Math.max(
                    0,
                    (HUNTER_RECHARGE_SEC * stats.dashCooldownFactor - sim.hunterDashRechargeTimer) /
                      (sim.ultActiveTimer > 0 ? 2 : 1)
                  )
              : sim.dashCooldown,
          dashMaxCooldown:
            sim.raceClass === 'hunter'
              ? (HUNTER_RECHARGE_SEC * stats.dashCooldownFactor) / (sim.ultActiveTimer > 0 ? 2 : 1)
              : DASH_COOLDOWN * stats.dashCooldownFactor,
          canDash: RACES[raceId].canDash,
          vampireBlood: Math.round(sim.bloodGauge),
          vampireBloodMax: VAMPIRE_BLOOD_MAX,
          batSwarmTimer: sim.batSwarmTimer,
          batSwarmCooldown: sim.batSwarmCooldown,
          orcRage: Math.round(sim.orcRage),
          orcRageMax: ORC_RAGE_MAX,
          orcBerserkTimer: sim.orcBerserkTimer,
          orcBerserkCooldown: sim.orcBerserkCooldown,
          warCryCooldown: sim.warCryCooldown,
          usesMana: Boolean(RACES[raceId].usesElements),
          mana: Math.round(sim.mana),
          maxMana: stats.maxMana,
          manaRegen: stats.manaRegen,
          lowManaWarning: sim.lowManaTimer > 0,
          heldElements: [...sim.heldElements],
          activeFusions: sim.activeFusions.map((f) => ({
            key: f.def.key,
            nameTh: f.def.nameTh,
            a: f.def.a,
            b: f.def.b,
            catalyst: f.catalyst,
            catalystNameTh: ELEMENT_CATALYSTS[f.catalyst].nameTh,
            resonance: f.resonance,
            voidInfused: f.voidInfused,
            color: f.def.color,
            manaCost: Math.max(3, Math.round(f.def.manaCost * stats.manaCostMult)),
            remaining: f.remaining,
            maxDuration: f.maxDuration,
          })),
          mageFusionCount: sim.mageFusionCount,
          fusionCooldown: sim.fusionCooldown,
          fusionMaxCooldown: sim.fusionMaxCooldown,
          voidInfusionActive: sim.voidInfusionActive,
          voidInfusionCost: VOID_INFUSION_COST,
          mageBarrierTimer: sim.mageBarrierTimer,
          mageNextBonusIn: 3 - (sim.mageFusionCount % 3),
          mapEvent: sim.mapEvent
            ? {
                id: sim.mapEvent,
                nameTh: MAP_EVENTS[sim.mapEvent].nameTh,
                effectTh: MAP_EVENTS[sim.mapEvent].effectTh,
                kind: MAP_EVENTS[sim.mapEvent].kind,
                color: MAP_EVENTS[sim.mapEvent].color,
                remaining: sim.mapEventTimer,
                duration: MAP_EVENTS[sim.mapEvent].duration,
              }
            : null,
          raceClass: sim.raceClass,
          reviveCooldown: sim.reviveCooldown,
          reviveMaxCooldown: 120,
          timeStopActive: sim.timeStopTimer > 0,
          timeStopCooldown: sim.timeStopCooldown,
          timeStopMaxCooldown: sim.timeStopMaxCooldown,
          timeStopRemaining: sim.timeStopTimer,
          timeStopDurationMax: sim.timeStopDurationMax,
          timeStopCycleReduced: sim.timeStopCycleReduced,
          chronoWellCount: sim.chronoWells.length,
          chronoWellCooldown: Math.max(0, sim.chronoWellCooldown),
          rewindReady: sim.rewindReady,
          rewindUsedCount: sim.rewindUsedCount,
          rewindMaxUses: 3,
          rewindChargeKills: sim.rewindChargeKills,
          rewindChargeTarget: sim.rewindChargeTarget,
          rewindLockTimer: sim.rewindLockTimer,
          deathStacks: necroHudSummary.soulBonusPct,
          reaperWarning: reaperWarningHud,
          necroMinionCount: necroHudSummary.activeCount,
          necroFealtyCount: necroHudSummary.fealtyCount,
          necroFealtyCap: NECRO_FEALTY_CAP,
          necroMiniBossCount: necroHudSummary.miniBossCount,
          necroMinionCap: NECRO_MINION_CAP,
          necroSoulsCount: sim.necroSoulsCount,
          necroSoulBonusPct: necroHudSummary.soulBonusPct,
          necroShield: Math.round(sim.necroShield),
          necroShieldMax: NECRO_SHIELD_MAX,
          necroShieldTimer: sim.necroShieldTimer,
          necroFealtySpeedPct: necroHudSummary.fealtySpeedPct,
          necroSoonestExpireSec: necroHudSummary.soonestExpireSec,
          spellbladeCharge: sim.spellbladeCharge,
          spellbladeChargeCooldown: sim.spellbladeChargeCooldown,
          spellbladeChargeMaxCooldown: sim.spellbladeChargeMaxCooldown,
          spellbladeInfusionName: sim.spellbladeInfusionName,
          spellbladeInfusionColor: sim.spellbladeInfusionColor,
          spellbladeCurrentElement:
            sim.voidlessTimer > 0 ? null : stats.spellbladeBuffs.elements[0] ?? sim.spellbladeActiveElement,
          spellbladeActiveElements: stats.spellbladeBuffs.elements,
          spellbladeFusionCount: sim.spellbladeFusionCount,
          spellbladeVoidlessReq: SPELLBLADE_VOIDLESS_REQ,
          voidlessActive: sim.voidlessTimer > 0,
          voidlessTimer: sim.voidlessTimer,
          voidlessCooldown: sim.voidlessCooldown,
          voidlessKills: sim.voidlessKills,
          voidlessKillsReq: VOIDLESS_KILLS_REQ,
          spiritSwordsCount: sim.spiritSwords.length,
          classGauge: Math.floor(sim.classGauge),
          classGaugeMax: getClassGaugeMax(sim.raceClass),
          classGaugeLabelTh: getClassGaugeMeta(sim.raceClass).labelTh,
          classGaugeColor: getClassGaugeMeta(sim.raceClass).color,
          classSkillPower: stats.classSkillPower,
          ultReady:
            getClassGaugeMax(sim.raceClass) > 0 &&
            sim.ultActiveTimer <= 0 &&
            sim.classGauge >= getClassGaugeMax(sim.raceClass) &&
            (sim.raceClass !== 'vampire_lord' || sim.player.hp < sim.player.maxHp * 0.5),
          ultActiveTimer: sim.ultActiveTimer,
          ultActiveMax: sim.ultActiveMax,
          ultTitleTh: getClassGaugeMeta(sim.raceClass).ultTitleTh,
          ultHoldProgress: Math.min(
            1,
            Math.max(
              sim.spaceDown ? sim.spaceHoldTime / 0.5 : 0,
              sim.mobileHoldActive ? sim.mobileHoldTime / 0.5 : 0
            )
          ),
          ultAscended: sim.ultAscended,
          ultAscendProgress:
            sim.raceClass === 'hunter'
              ? sim.ultCount < 3
                ? sim.ultCount
                : Math.min(150, sim.hunterShadowSlashKills)
              : sim.raceClass === 'saint'
                ? sim.ultCount
                : sim.raceClass === 'knight'
                  ? sim.knightParryCount
                  : sim.raceClass === 'demon_lord'
                    ? sim.demonSoulKills
                    : sim.raceClass === 'vampire_lord'
                      ? Math.floor(sim.vampireLowHpTime)
                      : sim.raceClass === 'seven_sins'
                        ? sim.sins.length
                        : 0,
          ultAscendReq:
            sim.raceClass === 'hunter'
              ? sim.ultCount < 3
                ? 3
                : 150
              : sim.raceClass === 'saint'
                ? 3
                : sim.raceClass === 'knight'
                  ? 25
                  : sim.raceClass === 'demon_lord'
                    ? 2000
                    : sim.raceClass === 'vampire_lord'
                      ? 60
                      : sim.raceClass === 'seven_sins'
                        ? 7
                        : 0,
          ultAscendLabelTh:
            sim.raceClass === 'hunter'
              ? 'วิญญาณจันทร์ดับ'
              : sim.raceClass === 'saint'
                ? 'นักบุญผู้ถือดาบสวรรค์'
                : sim.raceClass === 'knight'
                  ? 'ราชันอัศวินแห่งแสง'
                  : sim.raceClass === 'demon_lord'
                    ? 'มหาจอมมารอเวจีที่เจ็ด'
                    : sim.raceClass === 'vampire_lord'
                      ? 'เคานต์โลหิตนิรันดร์'
                      : sim.raceClass === 'seven_sins'
                        ? 'ราชาแห่งบาปที่แปด'
                        : '',
          ultCount: sim.ultCount,
          woundedTimer: sim.woundedTimer || 0,
          hunterDashCharges: sim.hunterDashCharges,
          hunterDashMaxCharges: sim.hunterDashMaxCharges,
          hunterDashRecharge: sim.hunterDashRechargeTimer,
          hunterKillRefunds: sim.hunterKillRefunds,
          hunterShadowSlashKills: sim.hunterShadowSlashKills,
          knightParryCount: sim.knightParryCount,
          knightAegisBonus: sim.knightAegisBonus,
          saintGolemHp: sim.golem ? Math.max(0, Math.round(sim.golem.hp)) : 0,
          saintGolemMaxHp: sim.golem ? sim.golem.maxHp : 0,
          saintGolemRespawn: sim.golem ? Math.max(0, Number(sim.golem.respawnTimer.toFixed(1))) : 0,
          saintGolemSeraph: sim.raceClass === 'saint' && (sim.ultActiveTimer > 0 || sim.ultAscended),
          demonSoulKills: sim.demonSoulKills,
          demonHellfireTier: sim.demonSoulKills >= 666 ? 3 : sim.demonSoulKills >= 300 ? 2 : sim.demonSoulKills >= 100 ? 1 : 0,
          vampireBloodShield: Math.round(sim.vampireBloodShield),
          vampireBloodShieldMax: Math.round(sim.player.maxHp * 0.25),
          vampireBloodlustDmgPct:
            sim.raceClass === 'vampire_lord'
              ? Math.round(
                  (Math.floor(Math.max(0, sim.player.maxHp - sim.player.hp) / Math.max(1, sim.player.maxHp) / 0.1) +
                    (sim.ultAscended ? 1 : 0)) *
                    5 *
                    (stats.isNight ? 1 : 1.5)
                )
              : 0,
          vampireBloodlustSpdPct:
            sim.raceClass === 'vampire_lord'
              ? Math.round(
                  (Math.floor(Math.max(0, sim.player.maxHp - sim.player.hp) / Math.max(1, sim.player.maxHp) / 0.1) +
                    (sim.ultAscended ? 1 : 0)) *
                    3 *
                    (stats.isNight ? 1 : 1.5)
                )
              : 0,
          vampireLowHpTime: Math.floor(sim.vampireLowHpTime),
          vampireLastRiteCd: Number(sim.vampireLastRiteCd.toFixed(1)),
          sinsActive: sim.sins
            .filter((s) => s.active || s.tempSummonTimer > 0 || (sim.raceClass === 'seven_sins' && sim.ultActiveTimer > 0))
            .map((s) => ({
              sinId: s.sinId,
              level: s.level,
              hp: Math.max(0, Math.round(s.hp)),
              maxHp: s.maxHp,
              respawnTimer: Number(s.respawnTimer.toFixed(1)),
              wrathStacks: s.wrathStacks,
              slothAwake: s.slothAwake,
            })),
          sinsAllContractedCount: sim.sins.length,
          sinsMaxSlots: getSinMaxSlots(sim),
          announcement: sim.announcement,
          reactionCount: sim.reactionCount,
          onHighGround: sim.onHighGround,
          activeTerrainTh: sim.activeTerrainTh,
          activeTerrainColor: sim.activeTerrainColor,
          inSecretRoom: sim.inSecretRoom,
          secretRoomTitleTh: sim.secretRoomKind ? SECRET_ROOM_NAMES_TH[sim.secretRoomKind] : null,
          secretRoomRemaining: Math.max(0, Math.ceil(sim.secretRoomTimer)),
          portalActive: Boolean(sim.secretPortal),
          portalRemaining: sim.secretPortal ? Math.max(0, Math.ceil(sim.secretPortal.remaining)) : 0,
          landmarkRevealActive: sim.landmarkRevealActive,
          mapEventBanner: sim.mapEventBannerTimer > 0 ? sim.activeMapEventBanner : null,
          godBlessings: sim.godBlessings,
          statueBuff: sim.statueEffect
            ? {
                kind: sim.statueEffect.kind,
                labelTh:
                  sim.statueEffect.kind === 'blessing'
                    ? 'พรเทพ +20% DMG'
                    : 'คำสาป ทอง×2 (มอน+25%)',
                remaining: Math.max(0, Math.ceil(sim.statueEffect.remaining)),
              }
            : null,
          speedPotionTimer: Number(sim.speedPotionTimer.toFixed(1)),
          shrinkingRingActive: Boolean(sim.shrinkingRing),
        });
      };

      const loop = (now: number) => {
        const rawDt = (now - lastTime) / 1000;
        lastTime = now;
        const clampedDt = Math.min(rawDt, 0.05);

        if (screenStateRef.current === 'PLAYING') {
          updateSimulation(clampedDt * simSpeedRef.current);
          hudEmitAccum += clampedDt;
          if (hudEmitAccum >= 0.08) {
            hudEmitAccum = 0;
            emitHud();
          }
        }

        musicSyncAccum += clampedDt;
        if (musicSyncAccum >= 0.25) {
          musicSyncAccum = 0;
          const curSim = simRef.current;
          if (curSim) {
            const hasBoss = curSim.enemies.some((en) => en.isBoss && en.hp > 0);
            const isNightNow =
              (curSim.raceClass === 'vampire_lord' && curSim.ultActiveTimer > 0) ||
              curSim.dayNightElapsed % 90 < 45;
            sound.updateMusic({
              screenState: screenStateRef.current,
              elapsedSeconds: curSim.elapsedSeconds,
              hasBoss,
              isNight: isNightNow,
              realmTier: curSim.realmTier,
            });
          }
        }

        renderScene();
        rafId = requestAnimationFrame(loop);
      };

      emitHud();
      rafId = requestAnimationFrame(loop);

      return () => {
        sound.setTimeStopMuffled(false);
        cancelAnimationFrame(rafId);
        window.removeEventListener('resize', resize);
        window.removeEventListener('keydown', onKeyDown);
        window.removeEventListener('keyup', onKeyUp);
        window.removeEventListener('blur', onBlur);
        canvas.removeEventListener('pointerdown', onPointerDown);
        window.removeEventListener('pointermove', onPointerMove);
        window.removeEventListener('pointerup', onPointerUp);
      };
    }, [raceId, stageId]);

    return (
      <div className="fixed inset-0 z-0 overflow-hidden bg-[#0B0F17]">
        <canvas ref={canvasRef} className="block w-full h-full touch-none" />
      </div>
    );
  }
);

GameCanvas.displayName = 'GameCanvas';
