export type GameScreenState =
  | 'TITLE_MENU'
  | 'PLAYING'
  | 'PAUSED'
  | 'LEVEL_UP_CHEST'
  | 'BOSS_CHEST'
  | 'ARTIFACT_CHEST'
  | 'CLASS_EVOLUTION'
  | 'SIN_CONTRACT'
  | 'MAP_INTERACTION'
  | 'GAME_OVER'
  | 'VICTORY';

export type RaceId = 'human' | 'vampire' | 'orc' | 'mage';

export type BotMode = 'off' | 'idle' | 'full';

export type RaceClassId =
  | 'hunter'
  | 'saint'
  | 'knight'
  | 'demon_lord'
  | 'vampire_lord'
  | 'seven_sins'
  | 'time_god'
  | 'death_god'
  | 'spellblade_god'
  | 'voidless_blade';

export type SinId =
  | 'pride'
  | 'greed'
  | 'envy'
  | 'wrath'
  | 'sloth'
  | 'gluttony'
  | 'lust';

export interface SinDef {
  id: SinId;
  sinNameTh: string;
  demonNameTh: string;
  nameEn: string;
  roleTh: string;
  color: string;
  lv1DescTh: string;
  lv3DescTh: string;
  gaugeSourceTh: string;
  drawbackTh: string;
}

export interface SinContractChoice {
  sinId: SinId;
  nextLevel: number;
  isNew: boolean;
}

export interface SinHudItem {
  sinId: SinId;
  level: number;
  hp: number;
  maxHp: number;
  respawnTimer: number;
  wrathStacks?: number;
  wrathFrenzyTimer?: number;
  slothAwake?: boolean;
}

export interface RaceClassDef {
  id: RaceClassId;
  raceId: 'human' | 'vampire' | 'mage';
  nameTh: string;
  nameEn: string;
  roleTh: string;
  passiveTh: string;
  activeSkillTh: string;
  color: string;
  hiddenFromLv20?: boolean;
}

export type BuildCategory = 'physical' | 'magic' | 'tank';

export type DamageType = 'physical' | 'magic' | 'elemental';

export type WeaponId =
  | 'banana'
  | 'axe'
  | 'dagger'
  | 'katana'
  | 'spear'
  | 'wand'
  | 'lightning'
  | 'fireorb'
  | 'frostnova'
  | 'meteor'
  | 'laser'
  | 'cat'
  | 'bird'
  | 'watergun'
  | 'shield'
  | 'garlic'
  | 'mace'
  | 'chain'
  | 'totem';

export type EnemyStatusId = 'burn' | 'wet' | 'frozen' | 'shock' | 'bleed' | 'mark';

export type StatusReactionId =
  | 'short_circuit'
  | 'melt_burst'
  | 'flash_freeze'
  | 'steam_cloud'
  | 'plasma_blast'
  | 'boiling_blood'
  | 'shatter';

export interface EnemyStatusEntry {
  stacks: number;
  timer: number;
  tickTimer?: number;
  bleedMoveAccum?: number;
}

export type RelicId =
  | 'spinach'
  | 'boots'
  | 'armor_plate'
  | 'chronos'
  | 'echo_crystal'
  | 'black_ruby_heart'
  | 'soul_bell'
  | 'lost_compass'
  | 'stride_blades'
  | 'storm_eye'
  | 'cracked_mirror'
  | 'spirit_lantern'
  | 'jester_mask'
  | 'stardust_powder'
  | 'devil_dice'
  | 'cursed_shackles';

export type StageId = 'cursed_forest' | 'bloodmoon_crypt' | 'reaper_citadel';

export type RunPace = 'classic' | 'blitz';

export type MetaUpgradeId =
  | 'might'
  | 'maxHp'
  | 'armor'
  | 'speed'
  | 'cooldown'
  | 'magnet'
  | 'greed'
  | 'revive'
  | 'reroll'
  | 'banish'
  | 'skip'
  | 'luck';

export type CampBuildingId =
  | 'training'
  | 'blacksmith'
  | 'library'
  | 'tavern'
  | 'apothecary'
  | 'altar'
  | 'soul_tower'
  | 'curse_gate'
  | 'hatchery';

export type PotionId =
  | 'blood_flask'
  | 'holy_water'
  | 'greed_elixir'
  | 'wisdom_draught'
  | 'fate_powder';

export type AltarRowId = 'row1' | 'row2' | 'row3' | 'row4' | 'row5' | 'row6';
export type AltarBranch = 'A' | 'B';

export interface AltarTalentState {
  rank: number;
  branch: AltarBranch;
}

export type CurseId =
  | 'spawn_rate'
  | 'enemy_hp'
  | 'enemy_dmg'
  | 'enemy_speed'
  | 'elite_freq'
  | 'frenzy_boss'
  | 'cursed_heal'
  | 'no_draft_tricks'
  | 'early_reaper';

export type GearSlot = 'signature_weapon' | 'armor' | 'ring' | 'amulet';
export type GearRarity = 'common' | 'rare' | 'epic' | 'legendary';

export type GearSetId =
  | 'shadow_king'
  | 'infernal_pact'
  | 'frost_chronicle'
  | 'golden_fortune';

export interface GearSetDef {
  id: GearSetId;
  nameTh: string;
  color: string;
  pieceDefIds: string[];
  bonus2Th: string;
  bonus3Th: string;
}

export type GearEffectKind =
  | 'lightning_crit'
  | 'thorn_reflect'
  | 'shadow_dash_bomb'
  | 'greedy_blade'
  | 'hourglass_freeze'
  | 'vital_plate'
  | 'swift_signet'
  | 'mana_sigil'
  | 'vampiric_edge'
  | 'guardian_ward'
  | 'gold_ring'
  | 'soul_charm'
  | 'fury_fang'
  | 'frost_mantle'
  | 'luck_clover'
  | 'eclipse_crown'
  // Part 5 New Signature Gear Effects
  | 'traveler_staff'
  | 'demon_chef_knife'
  | 'seer_scepter'
  | 'blacksmith_hammer'
  | 'shadow_cloak'
  | 'dragonscale_armor'
  | 'dancer_silk'
  | 'eternal_ice_armor'
  | 'flame_ring'
  | 'leopard_ring'
  | 'collector_ring'
  | 'reaction_ring'
  | 'spirit_calling_bell'
  | 'lucky_cat_eye'
  | 'phoenix_feather';

export interface GearDef {
  id: string;
  slot: GearSlot;
  nameTh: string;
  descTh: string;
  color: string;
  baseEffectVal: number;
  effectUnit: string;
  effectKind: GearEffectKind;
  setId?: GearSetId;
}

export interface OwnedGearItem {
  uid: string;
  defId: string;
  rarity: GearRarity;
  enhanceLevel: number; // 0..5
  acquiredAt: number;
}

export type PetId = 'bat_pet' | 'fire_hound' | 'mini_ghost';

export interface ActiveInRunQuest {
  id: string;
  titleTh: string;
  progress: number;
  target: number;
  rewardGold: number;
  completed: boolean;
}

export interface GoldBreakdown {
  drops: number;
  pouches: number;
  elites: number;
  bosses: number;
  survival: number;
  quests: number;
  curseBonus: number;
}

export interface ExtractedGearPreview {
  defId: string;
  rarity: GearRarity;
  isDuplicate: boolean;
  dismantleGold?: number;
}

export interface RaceConfig {
  id: RaceId;
  nameTh: string;
  nameEn: string;
  subtitleTh: string;
  portraitPath: string;
  accentColor: string;
  baseHp: number;
  baseSpeed: number;
  baseDamageMult: number;
  baseArmor: number;
  baseMagnet: number;
  canUseMagic: boolean;
  canDash: boolean;
  canEvolveClass: boolean;
  dayNightSensitive: boolean;
  usesElements?: boolean;
  defaultWeapon: WeaponId;
  traits: string[];
  weakness?: string;
}

export interface WeaponDef {
  id: WeaponId;
  nameTh: string;
  evolvedNameTh: string;
  category: BuildCategory;
  damageType: DamageType;
  pairedRelic: RelicId;
  descriptionTh: string;
  evolvedDescTh: string;
  levelDescriptions: string[];
  color: string;
  evolvedColor: string;
}

export interface RelicDef {
  id: RelicId;
  nameTh: string;
  descriptionTh: string;
  color: string;
  maxLevel: number;
  effectPerLevel: string;
}

export interface StageDef {
  id: StageId;
  nameTh: string;
  subtitleTh: string;
  unlockCost: number;
  goldMult: number;
  xpMult: number;
  enemyHpMult: number;
  enemyDmgMult: number;
  enemyBulletSpeedMult: number;
  floorPrimary: string;
  floorSecondary: string;
  accentHex: string;
}

export interface MetaUpgradeDef {
  id: MetaUpgradeId;
  nameTh: string;
  descriptionTh: string;
  maxLevel: number;
  baseCost: number;
  costStep: number;
  bonusPerLevelLabel: string;
}

export interface QuestCumulativeStats {
  bananaKills: number;
  fireBurnKills: number;
  knightParries: number;
  orcBestTimeSeconds: number;
  maxComboEver: number;
  evolvedWeaponsEver: string[];
  defeatedBossKinds: string[];
  totalBossKills: number;
  totalEliteKills: number;
  totalRuns: number;
  victories: number;
  stage1Cleared: boolean;
}

export interface DailyQuestState {
  dateStr: string;
  progress: Record<string, number>;
  claimed: string[];
}

export interface AudioVolumeSettings {
  masterVolume: number;
  bgmVolume: number;
  sfxVolume: number;
}

export interface SaveData {
  gold: number;
  soulEssence: number;
  sealMarks: number;
  upgrades: Record<MetaUpgradeId, number>;
  trainingGoldSpent: number;
  unlockedStages: StageId[];
  discoveredFusions: string[];
  bestTimeSeconds: number;
  totalKills: number;
  reaperKills: number;
  muted: boolean;
  masterVolume: number;
  bgmVolume: number;
  sfxVolume: number;
  // Camp & Meta Progression
  buildings: Record<CampBuildingId, number>;
  soulTowerLastClaimAt: number;
  talents: Record<AltarRowId, AltarTalentState>;
  unlockedAltarRows: AltarRowId[];
  activeCurses: Record<CurseId, number>;
  bestCurseByRace: Partial<Record<RaceId, number>>;
  selectedPotion: PotionId | null;
  ownedPotions: Partial<Record<PotionId, number>>;
  activeSkinByRace: Partial<Record<RaceId, string>>;
  questStats: QuestCumulativeStats;
  completedUnlockQuests: string[];
  claimedUnlockQuests: string[];
  dailyQuestState: DailyQuestState;
  dailyChallengeClaimedDate: string | null;
  bestiaryKills: Partial<Record<EnemyKind, number>>;
  gearInventory: OwnedGearItem[];
  equippedGear: Partial<Record<GearSlot, string>>;
  ownedPets: PetId[];
  equippedPet: PetId | null;
  masteryXpByRace: Partial<Record<RaceId, number>>;
}

export interface EquippedWeapon {
  id: WeaponId;
  level: number; // 1..5, 6 = evolved
  evolved: boolean;
  cooldownTimer: number;
  totalDamage: number;
  keystoneCd?: number;
  keystoneMaxCd?: number;
  keystoneTelegraph?: number;
  hitCounter?: number;
}

export interface EquippedRelic {
  id: RelicId;
  level: number; // 1..3
}

export type ElementId =
  | 'earth'
  | 'water'
  | 'wind'
  | 'fire'
  | 'stone'
  | 'dark'
  | 'light'
  | 'blood';

export interface ElementDef {
  id: ElementId;
  nameTh: string;
  shortTh: string;
  color: string;
  glowColor: string;
}

export type FusionBehavior =
  | 'firestorm'
  | 'frost_golem'
  | 'stone_golem'
  | 'quicksand'
  | 'magma_eruption'
  | 'dust_vortex'
  | 'cursed_hands'
  | 'sanctuary'
  | 'blood_spikes'
  | 'steam_blast'
  | 'glacial_crystal'
  | 'abyss_tide'
  | 'healing_spring'
  | 'blood_tide'
  | 'shatter_gale'
  | 'shadow_blades'
  | 'radiant_zephyr'
  | 'crimson_wind'
  | 'meteor_storm'
  | 'hellfire'
  | 'solar_flare'
  | 'boiling_blood'
  | 'obsidian_burst'
  | 'holy_prism'
  | 'bloodstone'
  | 'eclipse_nova'
  | 'vampire_bats'
  | 'sacred_sacrifice'
  | 'scan_laser'
  | 'pure_quake'
  | 'pure_tsunami'
  | 'pure_tempest'
  | 'pure_inferno'
  | 'pure_boulder'
  | 'pure_void'
  | 'pure_judgment'
  | 'pure_deluge';

export interface ElementFusionDef {
  key: string;
  a: ElementId;
  b: ElementId;
  nameTh: string;
  descTh: string;
  manaCost: number;
  cooldown: number;
  color: string;
  behavior: FusionBehavior;
}

export type MagePerkId =
  | 'mana_pool'
  | 'mana_flow'
  | 'element_might'
  | 'spell_area'
  | 'orb_magnet'
  | 'mana_barrier';

export interface MagePerkDef {
  id: MagePerkId;
  nameTh: string;
  descTh: string;
  color: string;
  bonusLabel: string;
}

export type FusionResonance = 'triple' | 'harmony' | 'paired';

export interface ElementCatalystDef {
  id: ElementId;
  nameTh: string;
  effectTh: string;
  color: string;
}

export interface ActiveFusedSpellHud {
  key: string;
  nameTh: string;
  a: ElementId;
  b: ElementId;
  catalyst?: ElementId;
  catalystNameTh?: string;
  resonance?: FusionResonance;
  voidInfused?: boolean;
  color: string;
  manaCost: number;
  remaining: number;
  maxDuration: number;
}

export type DraftChoice =
  | {
      kind: 'weapon';
      weaponId: WeaponId;
      nextLevel: number;
      isNew: boolean;
      isEvolve: boolean;
    }
  | {
      kind: 'relic';
      relicId: RelicId;
      nextLevel: number;
      isNew: boolean;
    }
  | {
      kind: 'mage_perk';
      perkId: MagePerkId;
      nextRank: number;
    }
  | {
      kind: 'consumable';
      rewardType: 'gold_heal';
      goldAmount: number;
      healAmount: number;
    };

export interface BossChestReward {
  items: DraftChoice[];
  bonusGold: number;
}

export type ArtifactSlot = 'helmet' | 'necklace' | 'armor' | 'boots' | 'ring';

export type ArtifactId =
  | 'crown_of_fortune'
  | 'assassin_hood'
  | 'oracle_helm'
  | 'blood_necklace'
  | 'magnet_pendant'
  | 'fang_talisman'
  | 'seraph_robe'
  | 'juggernaut_plate'
  | 'crimson_shroud'
  | 'flash_boots'
  | 'windwalker_boots'
  | 'iron_boots'
  | 'power_stone_ring'
  | 'berserker_band'
  | 'ruby_ring'
  // Part 4 Legendary Artifacts
  | 'tyrant_crown'
  | 'butterfly_pendant'
  | 'sinner_heart'
  | 'dancer_sash'
  | 'greedy_chalice'
  | 'two_faced_tome';

export interface ArtifactSlotMeta {
  slot: ArtifactSlot;
  nameTh: string;
  focusTh: string;
  accentColor: string;
}

export interface ArtifactDef {
  id: ArtifactId;
  slot: ArtifactSlot;
  nameTh: string;
  nameEn: string;
  iconPath?: string;
  color: string;
  isLegendary?: boolean;
  prosTh: string;
  consTh: string;
  critChanceBonus?: number;
  critDamageBonus?: number;
  xpGainBonus?: number;
  goldGainBonus?: number;
  doubleLootLuckChance?: number;
  damageMultBonus?: number;
  damagePerLevelBonus?: number;
  lowHpDamageBonus?: number;
  cooldownMultFactor?: number;
  areaMultBonus?: number;
  projSpeedBonus?: number;
  speedMultBonus?: number;
  dashCooldownFactor?: number;
  maxHpMultFactor?: number;
  armorBonus?: number;
  lifestealPerLevel?: number;
  regenPctPer2Sec?: number;
  healTakenFactor?: number;
  magnetBonusPct?: number;
  manaMaxBonus?: number;
  manaRegenMultBonus?: number;
  damageTakenMult?: number;
  bulletDamageTakenMult?: number;
  slowDebuffFactor?: number;
  phaseSmallMonsters?: boolean;
  thornBurstOnHit?: boolean;
  extraInvulnOnHit?: number;
  ramKnockbackOnMove?: boolean;
  cursorAim?: boolean;
  butterflyRewind?: boolean;
  sinnerStacksBonus?: boolean;
  dancerDashCharges?: boolean;
  greedyChaliceExplode?: boolean;
  twoFacedSwap?: boolean;
}

export type EquippedArtifacts = Partial<Record<ArtifactSlot, ArtifactId>>;

export type EnemyKind =
  | 'slime'
  | 'goblin'
  | 'bat'
  | 'flower'
  | 'golem'
  | 'cultist'
  | 'archer'
  | 'zealot'
  | 'charger'
  | 'stalker'
  | 'trapper'
  | 'shielder'
  | 'bomber'
  | 'miniboss_warden'
  | 'miniboss_blossom'
  | 'boss_bat_king'
  | 'boss_colossus'
  | 'boss_lich'
  | 'boss_wyrm'
  | 'boss_cerberus'
  | 'boss_judgement'
  | 'boss_beelzebub'
  | 'boss_lucifer'
  | 'reaper';

export type BiomeId =
  | 'stage_default'
  | 'verdant_wilds'
  | 'abyssal_sea'
  | 'inferno_caldera'
  | 'blood_sanctum'
  | 'eclipse_void';

export interface BiomeDef {
  id: BiomeId;
  nameTh: string;
  subtitleTh: string;
  floorPrimary: string;
  floorSecondary: string;
  accentHex: string;
  themeStyle: 'forest' | 'sea' | 'volcano' | 'crypt' | 'void';
}

export type BossBuffId =
  | 'frenzy'
  | 'iron_skin'
  | 'barrage'
  | 'vampiric'
  | 'berserk'
  | 'summoner'
  | 'blinker';

export interface BossBuffDef {
  id: BossBuffId;
  nameTh: string;
  descriptionTh: string;
  color: string;
}

export type WeatherId =
  | 'clear'
  | 'acid_rain'
  | 'mist'
  | 'fog'
  | 'sandstorm'
  | 'thunderstorm'
  | 'blizzard'
  | 'blood_rain';

export interface WeatherDef {
  id: WeatherId;
  nameTh: string;
  effectTh: string;
  color: string;
}

export type MapEventId =
  | 'exp_surge'
  | 'god_blessing'
  | 'gold_fever'
  | 'swift_winds'
  | 'frenzy_horde'
  | 'blood_curse'
  | 'void_corruption'
  | 'gravity_well'
  | 'ambush_swarm'
  | 'shrinking_ring'
  | 'treasure_cart'
  | 'meteor_shower'
  | 'night_fog'
  | 'earth_split'
  | 'golden_swarm';

export interface MapEventDef {
  id: MapEventId;
  nameTh: string;
  effectTh: string;
  kind: 'blessing' | 'threat';
  color: string;
  duration: number;
}

export interface MapInteractionArtifactOffer {
  id: ArtifactId;
  nameTh: string;
  descTh: string;
  color: string;
  price: number;
  owned: boolean;
}

export type MapInteractionPrompt =
  | {
      kind: 'cursed_statue';
      landmarkId: string;
    }
  | {
      kind: 'merchant';
      landmarkId: string;
      gold: number;
      hasUpgradeableWeapon: boolean;
      usesElements: boolean;
    }
  | {
      kind: 'blood_shrine';
      landmarkId: string;
      hpCost: number;
      currentHp: number;
      usesElements: boolean;
    }
  | {
      kind: 'secret_shop';
      gold: number;
      offers: MapInteractionArtifactOffer[];
    }
  | {
      kind: 'god_blessing';
    };

export type MapInteractionResult =
  | { kind: 'cursed_statue'; landmarkId: string; choice: 'blessing' | 'curse' | 'cancel' }
  | { kind: 'merchant'; landmarkId: string; action: 'meat' | 'reroll' | 'upgrade_weapon' | 'close' }
  | { kind: 'blood_shrine'; landmarkId: string; accept: boolean }
  | { kind: 'secret_shop'; buyArtifactId?: ArtifactId; close?: boolean }
  | { kind: 'god_blessing'; choice: 'reaction' | 'area' | 'cdr' };

export interface ActiveBossHud {
  nameTh: string;
  hp: number;
  maxHp: number;
  isReaper: boolean;
  buffs: BossBuffId[];
  berserkActive?: boolean;
  stagger?: number;
  maxStagger?: number;
  staggered?: boolean;
  staggerRemaining?: number;
  castSkillNameTh?: string;
  castProgress?: number;
  castRemaining?: number;
  castMax?: number;
}

export interface ReaperWarningHud {
  phase: 'approaching' | 'arrived';
  remainingSeconds: number;
  realmTier: number;
}

export interface HudSnapshot {
  hp: number;
  maxHp: number;
  xp: number;
  xpToNext: number;
  level: number;
  elapsedSeconds: number;
  targetSeconds: number;
  kills: number;
  goldEarned: number;
  soulEssenceEarned: number;
  pendingSealedChests: number;
  isNight: boolean;
  dayNightProgress: number;
  currentWaveTitle: string;
  realmTier: number;
  biomeNameTh: string;
  biomeAccentHex: string;
  weather: WeatherId;
  weatherNameTh: string;
  weatherEffectTh: string;
  weatherColor: string;
  weatherRemainingSeconds: number;
  weatherSlowed: boolean;
  snared: boolean;
  reaperSlainCount: number;
  reaperCurseStacks: number;
  combo: number;
  comboBest: number;
  comboMilestone: number;
  comboMilestoneId: number;
  comboBreakId: number;
  comboBrokenAt: number;
  weapons: EquippedWeapon[];
  relics: EquippedRelic[];
  artifacts: EquippedArtifacts;
  activeBoss: ActiveBossHud | null;
  playerStats: {
    damageMult: number;
    moveSpeed: number;
    armor: number;
    cooldownMult: number;
    magnetRadius: number;
    critChance: number;
    critDamageMult: number;
    lifestealPct: number;
  };
  dashCooldown: number;
  dashMaxCooldown: number;
  canDash: boolean;
  vampireBlood?: number;
  vampireBloodMax?: number;
  batSwarmTimer?: number;
  batSwarmCooldown?: number;
  orcRage?: number;
  orcRageMax?: number;
  orcBerserkTimer?: number;
  orcBerserkCooldown?: number;
  warCryCooldown?: number;
  usesMana: boolean;
  mana: number;
  maxMana: number;
  manaRegen: number;
  lowManaWarning: boolean;
  heldElements: ElementId[];
  activeFusions: ActiveFusedSpellHud[];
  mageFusionCount: number;
  fusionCooldown: number;
  fusionMaxCooldown: number;
  voidInfusionActive: boolean;
  voidInfusionCost: number;
  mageBarrierTimer: number;
  mageNextBonusIn: number;
  mapEvent: {
    id: MapEventId;
    nameTh: string;
    effectTh: string;
    kind: 'blessing' | 'threat';
    color: string;
    remaining: number;
    duration: number;
  } | null;
  raceClass: RaceClassId | null;
  reviveCooldown: number;
  reviveMaxCooldown: number;
  timeStopActive: boolean;
  timeStopCooldown: number;
  timeStopMaxCooldown?: number;
  timeStopRemaining?: number;
  timeStopDurationMax?: number;
  timeStopCycleReduced?: number;
  chronoWellCount?: number;
  chronoWellCooldown?: number;
  rewindReady?: boolean;
  rewindUsedCount?: number;
  rewindMaxUses?: number;
  rewindChargeKills?: number;
  rewindChargeTarget?: number;
  rewindLockTimer?: number;
  deathStacks: number;
  reaperWarning?: ReaperWarningHud | null;
  necroMinionCount?: number;
  necroFealtyCount?: number;
  necroFealtyCap?: number;
  necroMiniBossCount?: number;
  necroMinionCap?: number;
  necroSoulsCount?: number;
  necroSoulBonusPct?: number;
  necroShield?: number;
  necroShieldMax?: number;
  necroShieldTimer?: number;
  necroFealtySpeedPct?: number;
  necroSoonestExpireSec?: number | null;
  spellbladeInfusionName: string | null;
  spellbladeInfusionColor: string | null;
  spellbladeCurrentElement: ElementId | null;
  spellbladeCharge: number;
  spellbladeChargeCooldown: number;
  spellbladeChargeMaxCooldown: number;
  spellbladeActiveElements: ElementId[];
  spellbladeFusionCount: number;
  spellbladeVoidlessReq: number;
  voidlessActive: boolean;
  voidlessTimer: number;
  voidlessCooldown: number;
  voidlessKills: number;
  voidlessKillsReq: number;
  spiritSwordsCount: number;
  classGauge: number;
  classGaugeMax: number;
  classGaugeLabelTh: string;
  classGaugeColor: string;
  classSkillPower: number;
  ultReady: boolean;
  ultActiveTimer: number;
  ultActiveMax: number;
  ultTitleTh: string;
  ultHoldProgress: number;
  ultAscended: boolean;
  ultAscendProgress: number;
  ultAscendReq: number;
  ultAscendLabelTh: string;
  ultCount: number;
  woundedTimer: number;
  hunterDashCharges?: number;
  hunterDashMaxCharges?: number;
  hunterDashRecharge?: number;
  hunterKillRefunds?: number;
  hunterShadowSlashKills?: number;
  knightParryCount: number;
  knightAegisBonus: number;
  knightBladesCount?: number;
  knightBulwarkStacks?: number;
  saintGolemHp: number;
  saintGolemMaxHp: number;
  saintGolemRespawn: number;
  saintGolemSeraph: boolean;
  saintSigilsCount?: number;
  saintSanctumActive?: boolean;
  saintSanctumKills?: number;
  demonSoulKills: number;
  demonHellfireTier: number;
  vampireBloodShield: number;
  vampireBloodShieldMax: number;
  vampireBloodlustDmgPct: number;
  vampireBloodlustSpdPct: number;
  vampireLowHpTime: number;
  vampireLastRiteCd: number;
  sinsActive: SinHudItem[];
  sinsAllContractedCount: number;
  sinsMaxSlots: number;
  announcement: string | null;
  // Meta Progression in-run HUD state
  rerollsLeft: number;
  banishesLeft: number;
  skipsLeft: number;
  activePotion: PotionId | null;
  potionUsed: boolean;
  goldDoubleTimer: number;
  xpDoubleTimer: number;
  inRunQuests: ActiveInRunQuest[];
  curseLevel: number;
  elitesKilled?: number;
  fatePowderActive?: boolean;
  activePet?: PetId | null;
  equippedPet: PetId | null;
  petCooldown: number;
  metaRevivesLeft: number;
  // Rework Parts 1-5 HUD Telemetry
  devilDiceStat?: string | null;
  devilDicePct?: number;
  devilDiceCanReroll?: boolean;
  devilDiceNextRoll?: number;
  shacklesRemaining?: number;
  wingsUnbound?: boolean;
  sinnerStacks?: number;
  butterflyRemaining?: number;
  seerPreview?: DraftChoice[];
  dancerDashCharges?: number;
  dancerMaxCharges?: number;
  activeGearSets?: { id: GearSetId; nameTh: string; count: number; color: string; bonusTh: string }[];
  phoenixAvailable?: boolean;
  tyrantAimActive?: boolean;
  reactionCount?: number;
  twoFacedElementTh?: string | null;
  ghostKnightActive?: boolean;
  // Map System (M4-M8) HUD Telemetry
  onHighGround?: boolean;
  activeTerrainTh?: string | null;
  activeTerrainColor?: string | null;
  inSecretRoom?: boolean;
  secretRoomTitleTh?: string | null;
  secretRoomRemaining?: number;
  portalActive?: boolean;
  portalRemaining?: number;
  landmarkRevealActive?: boolean;
  mapEventBanner?: {
    nameTh: string;
    effectTh: string;
    kind: 'blessing' | 'threat';
    color: string;
  } | null;
  godBlessings?: {
    reactionBonus: number;
    areaBonus: number;
    cdrBonus: number;
  };
  statueBuff?: {
    kind: 'blessing' | 'curse';
    labelTh: string;
    remaining: number;
  } | null;
  speedPotionTimer?: number;
  shrinkingRingActive?: boolean;
}

export interface RunSummary {
  victory: boolean;
  reaperSlain: boolean;
  reaperSlainCount: number;
  realmTier: number;
  biomeNameTh: string;
  raceId: RaceId;
  raceClass: RaceClassId | null;
  stageId: StageId;
  elapsedSeconds: number;
  level: number;
  kills: number;
  bossesKilled: number;
  elitesKilled: number;
  goldEarned: number;
  goldBreakdown: GoldBreakdown;
  soulEssenceEarned: number;
  sealMarksEarned: number;
  mageFusionCount?: number;
  weapons: EquippedWeapon[];
  relics: EquippedRelic[];
  artifacts: EquippedArtifacts;
  completedInRunQuests: ActiveInRunQuest[];
  pendingChestsCount: number;
  extractedGear: ExtractedGearPreview[];
  lostChestsCount: number;
  maxCombo: number;
  deathCauseTh: string;
  curseLevel: number;
  isDailyChallenge?: boolean;
  dailyChallengeWon?: boolean;
  runKillsByKind: Partial<Record<EnemyKind, number>>;
  runBananaKills: number;
  runFireBurnKills: number;
  runKnightParries: number;
  runDefeatedBossKinds: string[];
  // Populated by App after save update for display
  masteryXpGained?: number;
  masteryLevelBefore?: number;
  masteryLevelAfter?: number;
  newUnlockQuestNames?: string[];
  newBestiarySpecies?: string[];
}
