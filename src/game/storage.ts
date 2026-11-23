import {
  getLocalDateKey,
  getTrainingRefundGold,
  TRAINING_UPGRADES,
} from './metaData';
import {
  AltarRowId,
  AltarTalentState,
  CampBuildingId,
  CurseId,
  MetaUpgradeId,
  SaveData,
  StageId,
} from './types';

const STORAGE_KEY = 'eclipse_survivors_save_v1';

const DEFAULT_UPGRADES: Record<MetaUpgradeId, number> = {
  might: 0,
  maxHp: 0,
  armor: 0,
  speed: 0,
  cooldown: 0,
  magnet: 0,
  greed: 0,
  revive: 0,
  reroll: 0,
  banish: 0,
  skip: 0,
  luck: 0,
};

const DEFAULT_BUILDINGS: Record<CampBuildingId, number> = {
  training: 1,
  blacksmith: 0,
  library: 0,
  tavern: 0,
  apothecary: 0,
  altar: 0,
  soul_tower: 0,
  curse_gate: 0,
  hatchery: 0,
};

const DEFAULT_TALENTS: Record<AltarRowId, AltarTalentState> = {
  row1: { rank: 0, branch: 'A' },
  row2: { rank: 0, branch: 'A' },
  row3: { rank: 0, branch: 'A' },
  row4: { rank: 0, branch: 'A' },
  row5: { rank: 0, branch: 'A' },
  row6: { rank: 0, branch: 'A' },
};

const DEFAULT_CURSES: Record<CurseId, number> = {
  spawn_rate: 0,
  enemy_hp: 0,
  enemy_dmg: 0,
  enemy_speed: 0,
  elite_freq: 0,
  frenzy_boss: 0,
  cursed_heal: 0,
  no_draft_tricks: 0,
  early_reaper: 0,
};

export function createDefaultSave(): SaveData {
  return {
    gold: 100,
    soulEssence: 0,
    sealMarks: 0,
    upgrades: { ...DEFAULT_UPGRADES },
    trainingGoldSpent: 0,
    unlockedStages: ['cursed_forest'],
    discoveredFusions: [],
    bestTimeSeconds: 0,
    totalKills: 0,
    reaperKills: 0,
    muted: false,
    masterVolume: 1,
    bgmVolume: 1,
    sfxVolume: 1,
    buildings: { ...DEFAULT_BUILDINGS },
    soulTowerLastClaimAt: Date.now(),
    talents: {
      row1: { ...DEFAULT_TALENTS.row1 },
      row2: { ...DEFAULT_TALENTS.row2 },
      row3: { ...DEFAULT_TALENTS.row3 },
      row4: { ...DEFAULT_TALENTS.row4 },
      row5: { ...DEFAULT_TALENTS.row5 },
      row6: { ...DEFAULT_TALENTS.row6 },
    },
    unlockedAltarRows: ['row1', 'row2'],
    activeCurses: { ...DEFAULT_CURSES },
    bestCurseByRace: {},
    selectedPotion: null,
    ownedPotions: {},
    activeSkinByRace: {},
    questStats: {
      bananaKills: 0,
      fireBurnKills: 0,
      knightParries: 0,
      orcBestTimeSeconds: 0,
      maxComboEver: 0,
      evolvedWeaponsEver: [],
      defeatedBossKinds: [],
      totalBossKills: 0,
      totalEliteKills: 0,
      totalRuns: 0,
      victories: 0,
      stage1Cleared: false,
    },
    completedUnlockQuests: [],
    claimedUnlockQuests: [],
    dailyQuestState: {
      dateStr: getLocalDateKey(),
      progress: {},
      claimed: [],
    },
    dailyChallengeClaimedDate: null,
    bestiaryKills: {},
    gearInventory: [],
    equippedGear: {},
    ownedPets: [],
    equippedPet: null,
    masteryXpByRace: {},
  };
}

export const DEFAULT_SAVE: SaveData = createDefaultSave();

const LEGACY_COSTS: Record<string, { baseCost: number; costStep: number }> = {
  might: { baseCost: 40, costStep: 35 },
  maxHp: { baseCost: 35, costStep: 30 },
  armor: { baseCost: 50, costStep: 50 },
  speed: { baseCost: 40, costStep: 35 },
  cooldown: { baseCost: 60, costStep: 55 },
  magnet: { baseCost: 30, costStep: 25 },
  greed: { baseCost: 45, costStep: 40 },
  idleGold: { baseCost: 50, costStep: 45 },
};

function clampVolume(value: unknown, fallback = 1): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return fallback;
  return Math.max(0, Math.min(1, Math.round(value * 100) / 100));
}

export function loadSaveData(): SaveData {
  const def = createDefaultSave();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return def;
    const parsed = JSON.parse(raw) as Partial<SaveData> & {
      upgrades?: Record<string, number>;
    };

    let gold = typeof parsed.gold === 'number' && parsed.gold >= 0 ? Math.floor(parsed.gold) : def.gold;

    // Migrate old upgrades & refund idleGold + any over-cap legacy levels
    const rawUpgrades = (parsed.upgrades || {}) as Record<string, number>;
    const migratedUpgrades: Record<MetaUpgradeId, number> = { ...DEFAULT_UPGRADES };

    // 1. Refund removed idleGold upgrade if present on an old save
    const legacyIdleLvl = typeof rawUpgrades.idleGold === 'number' ? Math.max(0, Math.floor(rawUpgrades.idleGold)) : 0;
    if (legacyIdleLvl > 0) {
      const lc = LEGACY_COSTS.idleGold;
      for (let i = 0; i < legacyIdleLvl; i++) {
        gold += lc.baseCost + i * lc.costStep;
      }
    }

    // 2. Clamp valid upgrades to new maxLevel and refund any excess legacy levels
    for (const uDef of TRAINING_UPGRADES) {
      const rawVal = typeof rawUpgrades[uDef.id] === 'number' ? Math.max(0, Math.floor(rawUpgrades[uDef.id])) : 0;
      if (rawVal > uDef.maxLevel) {
        const lc = LEGACY_COSTS[uDef.id];
        if (lc) {
          for (let i = uDef.maxLevel; i < rawVal; i++) {
            gold += lc.baseCost + i * lc.costStep;
          }
        }
        migratedUpgrades[uDef.id] = uDef.maxLevel;
      } else {
        migratedUpgrades[uDef.id] = rawVal;
      }
    }

    const bestTimeSeconds = typeof parsed.bestTimeSeconds === 'number' ? parsed.bestTimeSeconds : 0;
    const reaperKills = typeof parsed.reaperKills === 'number' ? parsed.reaperKills : 0;
    const stage1Cleared =
      Boolean(parsed.questStats?.stage1Cleared) || bestTimeSeconds >= 1800 || reaperKills > 0;

    const buildings: Record<CampBuildingId, number> = {
      ...DEFAULT_BUILDINGS,
      ...(parsed.buildings || {}),
      training: Math.max(1, parsed.buildings?.training || 1),
      curse_gate: stage1Cleared ? Math.max(1, parsed.buildings?.curse_gate || 1) : parsed.buildings?.curse_gate || 0,
    };

    const todayKey = getLocalDateKey();
    const parsedDaily = parsed.dailyQuestState;
    const dailyQuestState =
      parsedDaily && parsedDaily.dateStr === todayKey
        ? {
            dateStr: todayKey,
            progress: { ...(parsedDaily.progress || {}) },
            claimed: Array.isArray(parsedDaily.claimed) ? parsedDaily.claimed : [],
          }
        : { dateStr: todayKey, progress: {}, claimed: [] };

    const talents: Record<AltarRowId, AltarTalentState> = {
      row1: parsed.talents?.row1 || { ...DEFAULT_TALENTS.row1 },
      row2: parsed.talents?.row2 || { ...DEFAULT_TALENTS.row2 },
      row3: parsed.talents?.row3 || { ...DEFAULT_TALENTS.row3 },
      row4: parsed.talents?.row4 || { ...DEFAULT_TALENTS.row4 },
      row5: parsed.talents?.row5 || { ...DEFAULT_TALENTS.row5 },
      row6: parsed.talents?.row6 || { ...DEFAULT_TALENTS.row6 },
    };

    const unlockedAltarRows: AltarRowId[] = Array.isArray(parsed.unlockedAltarRows)
      ? Array.from(new Set(['row1', 'row2', ...parsed.unlockedAltarRows])) as AltarRowId[]
      : ['row1', 'row2'];

    const trainingGoldSpent =
      typeof parsed.trainingGoldSpent === 'number' && parsed.trainingGoldSpent >= 0
        ? Math.floor(parsed.trainingGoldSpent)
        : getTrainingRefundGold(migratedUpgrades);

    return {
      gold,
      soulEssence: typeof parsed.soulEssence === 'number' && parsed.soulEssence >= 0 ? Math.floor(parsed.soulEssence) : 0,
      sealMarks: typeof parsed.sealMarks === 'number' && parsed.sealMarks >= 0 ? Math.floor(parsed.sealMarks) : 0,
      upgrades: migratedUpgrades,
      trainingGoldSpent,
      unlockedStages:
        Array.isArray(parsed.unlockedStages) && parsed.unlockedStages.length > 0
          ? (parsed.unlockedStages as StageId[])
          : ['cursed_forest'],
      discoveredFusions: Array.isArray(parsed.discoveredFusions)
        ? parsed.discoveredFusions.filter((k): k is string => typeof k === 'string')
        : [],
      bestTimeSeconds,
      totalKills: typeof parsed.totalKills === 'number' ? parsed.totalKills : 0,
      reaperKills,
      muted: Boolean(parsed.muted),
      masterVolume: clampVolume(parsed.masterVolume, 1),
      bgmVolume: clampVolume(parsed.bgmVolume, 1),
      sfxVolume: clampVolume(parsed.sfxVolume, 1),
      buildings,
      soulTowerLastClaimAt:
        typeof parsed.soulTowerLastClaimAt === 'number' ? parsed.soulTowerLastClaimAt : Date.now(),
      talents,
      unlockedAltarRows,
      activeCurses: { ...DEFAULT_CURSES, ...(parsed.activeCurses || {}) },
      bestCurseByRace: { ...(parsed.bestCurseByRace || {}) },
      selectedPotion: parsed.selectedPotion || null,
      ownedPotions: { ...(parsed.ownedPotions || {}) },
      activeSkinByRace: { ...(parsed.activeSkinByRace || {}) },
      questStats: {
        ...def.questStats,
        ...(parsed.questStats || {}),
        stage1Cleared,
        evolvedWeaponsEver: Array.isArray(parsed.questStats?.evolvedWeaponsEver)
          ? parsed.questStats.evolvedWeaponsEver
          : [],
        defeatedBossKinds: Array.isArray(parsed.questStats?.defeatedBossKinds)
          ? parsed.questStats.defeatedBossKinds
          : [],
      },
      completedUnlockQuests: Array.isArray(parsed.completedUnlockQuests) ? parsed.completedUnlockQuests : [],
      claimedUnlockQuests: Array.isArray(parsed.claimedUnlockQuests) ? parsed.claimedUnlockQuests : [],
      dailyQuestState,
      dailyChallengeClaimedDate: parsed.dailyChallengeClaimedDate || null,
      bestiaryKills: { ...(parsed.bestiaryKills || {}) },
      gearInventory: Array.isArray(parsed.gearInventory) ? parsed.gearInventory : [],
      equippedGear: { ...(parsed.equippedGear || {}) },
      ownedPets: Array.isArray(parsed.ownedPets) ? parsed.ownedPets : [],
      equippedPet: parsed.equippedPet || null,
      masteryXpByRace: { ...(parsed.masteryXpByRace || {}) },
    };
  } catch {
    return def;
  }
}

export function persistSaveData(data: SaveData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Ignore storage quota errors
  }
}
