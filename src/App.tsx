import { useCallback, useEffect, useRef, useState } from 'react';
import { CampModal } from './components/CampModal';
import {
  ArtifactChestModal,
  BossChestModal,
  ClassEvolutionModal,
  LevelUpChestModal,
  PauseModal,
  RunSummaryModal,
  SinContractModal,
} from './components/ChestModals';
import { GameCanvas, GameCanvasHandle } from './components/GameCanvas';
import { GameHud } from './components/GameHud';
import { MapInteractionModal } from './components/MapInteractionModal';
import { TitleScreen } from './components/TitleScreen';
import {
  getClassesForRace,
  getMetaUpgradeCost,
  META_UPGRADES,
  RACES,
  STAGES,
  WEAPONS,
} from './game/data';
import {
  ALTAR_ROWS,
  CAMP_BUILDINGS,
  computeCurseLevel,
  computePendingSoulEssence,
  CURSES,
  getAltarSpentSoulEssence,
  getBuildingUpgradeCost,
  getDailyChallengeForDate,
  getDailyQuestsForDate,
  getGearEnhanceCost,
  getLocalDateKey,
  getMasteryLevelInfo,
  getMaxBlacksmithEnhanceLevel,
  getPetEggCost,
  getTotalTrainingRanksBought,
  PERMANENT_GEAR_CATALOG,
  PET_IDS,
  POTIONS,
  RARITY_META,
  UNLOCK_QUESTS,
} from './game/metaData';
import { sound } from './game/sound';
import { loadSaveData, persistSaveData } from './game/storage';
import {
  AltarBranch,
  AltarRowId,
  AudioVolumeSettings,
  ArtifactId,
  BossChestReward,
  BotMode,
  CampBuildingId,
  CurseId,
  DraftChoice,
  EnemyKind,
  GameScreenState,
  GearSlot,
  HudSnapshot,
  MapInteractionPrompt,
  MapInteractionResult,
  MetaUpgradeId,
  OwnedGearItem,
  PotionId,
  PetId,
  RaceClassId,
  RaceId,
  RunPace,
  RunSummary,
  SaveData,
  SinContractChoice,
  SinId,
  StageId,
  WeaponId,
} from './game/types';

const INITIAL_HUD: HudSnapshot = {
  hp: 115,
  maxHp: 115,
  xp: 0,
  xpToNext: 12,
  level: 1,
  elapsedSeconds: 0,
  targetSeconds: 1800,
  kills: 0,
  goldEarned: 0,
  soulEssenceEarned: 0,
  pendingSealedChests: 0,
  isNight: true,
  dayNightProgress: 0,
  currentWaveTitle: '',
  realmTier: 1,
  biomeNameTh: 'ป่าต้องสาป',
  biomeAccentHex: '#22C55E',
  weather: 'clear',
  weatherNameTh: 'ฟ้าปลอดโปร่ง',
  weatherEffectTh: 'ทัศนวิสัยปกติ ไม่มีผลกระทบ',
  weatherColor: '#94A3B8',
  weatherRemainingSeconds: 300,
  weatherSlowed: false,
  snared: false,
  reaperSlainCount: 0,
  reaperCurseStacks: 0,
  combo: 0,
  comboBest: 0,
  comboMilestone: 0,
  comboMilestoneId: 0,
  comboBreakId: 0,
  comboBrokenAt: 0,
  weapons: [],
  relics: [],
  artifacts: {},
  activeBoss: null,
  playerStats: {
    damageMult: 1,
    moveSpeed: 180,
    armor: 1,
    cooldownMult: 1,
    magnetRadius: 155,
    critChance: 0.05,
    critDamageMult: 1.6,
    lifestealPct: 0,
  },
  dashCooldown: 0,
  dashMaxCooldown: 2.4,
  canDash: true,
  vampireBlood: 50,
  vampireBloodMax: 100,
  batSwarmTimer: 0,
  batSwarmCooldown: 0,
  orcRage: 0,
  orcRageMax: 100,
  orcBerserkTimer: 0,
  orcBerserkCooldown: 0,
  warCryCooldown: 0,
  usesMana: false,
  mana: 100,
  maxMana: 100,
  manaRegen: 3.8,
  lowManaWarning: false,
  heldElements: [],
  activeFusions: [],
  mageFusionCount: 0,
  fusionCooldown: 0,
  fusionMaxCooldown: 4.8,
  voidInfusionActive: false,
  voidInfusionCost: 24,
  mageBarrierTimer: 0,
  mageNextBonusIn: 3,
  mapEvent: null,
  raceClass: null,
  reviveCooldown: 0,
  reviveMaxCooldown: 120,
  timeStopActive: false,
  timeStopCooldown: 32,
  deathStacks: 0,
  reaperWarning: null,
  necroMinionCount: 0,
  necroFealtyCount: 0,
  necroFealtyCap: 10,
  necroMiniBossCount: 0,
  necroMinionCap: 28,
  necroSoulsCount: 0,
  necroSoulBonusPct: 0,
  necroShield: 0,
  necroShieldMax: 300,
  necroShieldTimer: 0,
  necroFealtySpeedPct: 0,
  necroSoonestExpireSec: null,
  spellbladeCharge: 0,
  spellbladeChargeCooldown: 0,
  spellbladeChargeMaxCooldown: 3.0,
  spellbladeInfusionName: null,
  spellbladeInfusionColor: null,
  spellbladeCurrentElement: null,
  spellbladeActiveElements: [],
  spellbladeFusionCount: 0,
  spellbladeVoidlessReq: 5,
  voidlessActive: false,
  voidlessTimer: 0,
  voidlessCooldown: 0,
  voidlessKills: 0,
  voidlessKillsReq: 50,
  spiritSwordsCount: 0,
  classGauge: 0,
  classGaugeMax: 0,
  classGaugeLabelTh: '',
  classGaugeColor: '#FBBF24',
  classSkillPower: 1,
  ultReady: false,
  ultActiveTimer: 0,
  ultActiveMax: 0,
  ultTitleTh: '',
  ultHoldProgress: 0,
  ultAscended: false,
  ultAscendProgress: 0,
  ultAscendReq: 0,
  ultAscendLabelTh: '',
  ultCount: 0,
  woundedTimer: 0,
  knightParryCount: 0,
  knightAegisBonus: 0,
  saintGolemHp: 0,
  saintGolemMaxHp: 0,
  saintGolemRespawn: 0,
  saintGolemSeraph: false,
  demonSoulKills: 0,
  demonHellfireTier: 0,
  vampireBloodShield: 0,
  vampireBloodShieldMax: 0,
  vampireBloodlustDmgPct: 0,
  vampireBloodlustSpdPct: 0,
  vampireLowHpTime: 0,
  vampireLastRiteCd: 0,
  sinsActive: [],
  sinsAllContractedCount: 0,
  sinsMaxSlots: 3,
  announcement: null,
  rerollsLeft: 0,
  banishesLeft: 0,
  skipsLeft: 0,
  activePotion: null,
  potionUsed: false,
  goldDoubleTimer: 0,
  xpDoubleTimer: 0,
  inRunQuests: [],
  curseLevel: 0,
  equippedPet: null,
  petCooldown: 0,
  metaRevivesLeft: 0,
  onHighGround: false,
  activeTerrainTh: null,
  activeTerrainColor: null,
  inSecretRoom: false,
  secretRoomTitleTh: null,
  secretRoomRemaining: 0,
  portalActive: false,
  portalRemaining: 0,
  landmarkRevealActive: false,
  mapEventBanner: null,
  godBlessings: { reactionBonus: 0, areaBonus: 0, cdrBonus: 0 },
  statueBuff: null,
  speedPotionTimer: 0,
  shrinkingRingActive: false,
};

export default function App() {
  const [saveData, setSaveData] = useState<SaveData>(() => {
    const loaded = loadSaveData();
    sound.setMuted(loaded.muted);
    sound.setVolumes({
      masterVolume: loaded.masterVolume,
      bgmVolume: loaded.bgmVolume,
      sfxVolume: loaded.sfxVolume,
    });
    return loaded;
  });

  const [screenState, setScreenState] = useState<GameScreenState>('TITLE_MENU');
  const [campOpen, setCampOpen] = useState(false);
  const [campInitialTab, setCampInitialTab] = useState<CampBuildingId | 'map'>('map');

  const [selectedRace, setSelectedRace] = useState<RaceId>('human');
  const [selectedStage, setSelectedStage] = useState<StageId>('cursed_forest');
  const [selectedWeapon, setSelectedWeapon] = useState<WeaponId>('banana');
  const [selectedPace, setSelectedPace] = useState<RunPace>('classic');
  const [isDailyChallengeRun, setIsDailyChallengeRun] = useState(false);

  const [runId, setRunId] = useState(1);
  const [simSpeed, setSimSpeed] = useState<number>(1);
  const [botMode, setBotMode] = useState<BotMode>('off');
  const [botTargetClass, setBotTargetClass] = useState<RaceClassId | 'auto'>('auto');

  const [hud, setHud] = useState<HudSnapshot>(INITIAL_HUD);
  const [draftChoices, setDraftChoices] = useState<DraftChoice[]>([]);
  const [bossChestReward, setBossChestReward] = useState<BossChestReward | null>(null);
  const [artifactChoices, setArtifactChoices] = useState<ArtifactId[]>([]);
  const [sinChoices, setSinChoices] = useState<SinContractChoice[]>([]);
  const [mapInteractionPrompt, setMapInteractionPrompt] = useState<MapInteractionPrompt | null>(null);
  const [runSummary, setRunSummary] = useState<RunSummary | null>(null);

  const canvasRef = useRef<GameCanvasHandle | null>(null);

  useEffect(() => {
    sound.updateMusic({
      screenState,
      elapsedSeconds: screenState === 'TITLE_MENU' ? 0 : hud.elapsedSeconds,
      hasBoss: Boolean(hud.activeBoss),
      isNight: hud.isNight,
      realmTier: Math.max(0, hud.realmTier - 1),
    });
  }, [screenState, hud.elapsedSeconds, hud.activeBoss, hud.isNight, hud.realmTier]);

  const updateSave = useCallback((updater: (prev: SaveData) => SaveData) => {
    setSaveData((prev) => {
      const next = updater(prev);
      persistSaveData(next);
      return next;
    });
  }, []);

  const handleOpenCamp = useCallback((tab: CampBuildingId | 'map' = 'map') => {
    setCampInitialTab(tab);
    setCampOpen(true);
  }, []);

  const handleSelectRace = useCallback(
    (race: RaceId) => {
      setSelectedRace(race);
      const cfg = RACES[race];
      if (!cfg.canUseMagic && WEAPONS[selectedWeapon].category === 'magic') {
        setSelectedWeapon(cfg.defaultWeapon);
      }
      setBotTargetClass((prev) => {
        if (prev === 'auto') return 'auto';
        const valid = getClassesForRace(race).some((c) => c.id === prev);
        return valid ? prev : 'auto';
      });
    },
    [selectedWeapon]
  );

  const handleToggleMute = useCallback(() => {
    updateSave((prev) => {
      const nextMuted = !prev.muted;
      sound.setMuted(nextMuted);
      return { ...prev, muted: nextMuted };
    });
  }, [updateSave]);

  const handleChangeVolumes = useCallback(
    (patch: Partial<AudioVolumeSettings>) => {
      updateSave((prev) => {
        const clamp = (v: number) => Math.max(0, Math.min(1, Math.round(v * 100) / 100));
        const nextVolumes: AudioVolumeSettings = {
          masterVolume:
            typeof patch.masterVolume === 'number' ? clamp(patch.masterVolume) : prev.masterVolume,
          bgmVolume:
            typeof patch.bgmVolume === 'number' ? clamp(patch.bgmVolume) : prev.bgmVolume,
          sfxVolume:
            typeof patch.sfxVolume === 'number' ? clamp(patch.sfxVolume) : prev.sfxVolume,
        };
        sound.setVolumes(nextVolumes);
        return { ...prev, ...nextVolumes };
      });
    },
    [updateSave]
  );

  // ===== Camp: Building Upgrade =====
  const handleUpgradeBuilding = useCallback(
    (buildingId: CampBuildingId) => {
      const def = CAMP_BUILDINGS.find((b) => b.id === buildingId);
      if (!def) return;
      updateSave((prev) => {
        const curLv = prev.buildings[buildingId] || 0;
        if (curLv >= def.maxLevel) return prev;
        if (
          def.requiresStage1Clear &&
          curLv <= 0 &&
          !prev.questStats.stage1Cleared &&
          prev.reaperKills <= 0
        ) {
          return prev;
        }
        const cost = getBuildingUpgradeCost(def, curLv);
        if (prev.gold < cost.gold || prev.sealMarks < cost.seals) return prev;
        sound.playLevelUp();
        return {
          ...prev,
          gold: prev.gold - cost.gold,
          sealMarks: prev.sealMarks - cost.seals,
          buildings: {
            ...prev.buildings,
            [buildingId]: curLv + 1,
          },
          soulTowerLastClaimAt:
            buildingId === 'soul_tower' && curLv === 0
              ? Date.now()
              : prev.soulTowerLastClaimAt,
        };
      });
    },
    [updateSave]
  );

  // ===== Camp: Training Grounds (12 Upgrades + VS +10% surcharge) =====
  const handleBuyUpgrade = useCallback(
    (id: MetaUpgradeId) => {
      const def = META_UPGRADES.find((u) => u.id === id);
      if (!def) return;
      updateSave((prev) => {
        const curLvl = prev.upgrades[id] || 0;
        if (curLvl >= def.maxLevel) return prev;
        const totalRanksBought = getTotalTrainingRanksBought(prev.upgrades);
        const rawCost = getMetaUpgradeCost(def, curLvl, totalRanksBought);
        const trainingLv = prev.buildings.training || 1;
        const cost =
          trainingLv >= 2 && (id === 'might' || id === 'maxHp' || id === 'armor' || id === 'speed')
            ? Math.round(rawCost * 0.95)
            : rawCost;
        if (prev.gold < cost) return prev;
        sound.playCoinPickup();
        return {
          ...prev,
          gold: prev.gold - cost,
          trainingGoldSpent: prev.trainingGoldSpent + cost,
          upgrades: {
            ...prev.upgrades,
            [id]: curLvl + 1,
          },
        };
      });
    },
    [updateSave]
  );

  const handleRefundAll = useCallback(() => {
    updateSave((prev) => {
      const refunded = prev.trainingGoldSpent;
      const resetUpgrades = { ...prev.upgrades };
      for (const def of META_UPGRADES) {
        resetUpgrades[def.id] = 0;
      }
      return {
        ...prev,
        gold: prev.gold + refunded,
        trainingGoldSpent: 0,
        upgrades: resetUpgrades,
      };
    });
  }, [updateSave]);

  // ===== Camp: Blacksmith =====
  const handleEquipGear = useCallback(
    (uid: string) => {
      updateSave((prev) => {
        const item = prev.gearInventory.find((g) => g.uid === uid);
        if (!item) return prev;
        const def = PERMANENT_GEAR_CATALOG[item.defId];
        if (!def) return prev;
        sound.playCoinPickup();
        return {
          ...prev,
          equippedGear: {
            ...prev.equippedGear,
            [def.slot]: uid,
          },
        };
      });
    },
    [updateSave]
  );

  const handleUnequipGear = useCallback(
    (slot: GearSlot) => {
      updateSave((prev) => {
        const nextEquipped = { ...prev.equippedGear };
        delete nextEquipped[slot];
        return { ...prev, equippedGear: nextEquipped };
      });
    },
    [updateSave]
  );

  const handleEnhanceGear = useCallback(
    (uid: string) => {
      updateSave((prev) => {
        const bLv = prev.buildings.blacksmith || 0;
        if (bLv <= 0) return prev;
        const maxEnh = getMaxBlacksmithEnhanceLevel(bLv);
        const idx = prev.gearInventory.findIndex((g) => g.uid === uid);
        if (idx === -1) return prev;
        const item = prev.gearInventory[idx];
        if (item.enhanceLevel >= maxEnh) return prev;
        const cost = getGearEnhanceCost(item.enhanceLevel + 1);
        if (prev.gold < cost) return prev;
        sound.playLevelUp();
        const nextInv = [...prev.gearInventory];
        nextInv[idx] = { ...item, enhanceLevel: item.enhanceLevel + 1 };
        return {
          ...prev,
          gold: prev.gold - cost,
          gearInventory: nextInv,
        };
      });
    },
    [updateSave]
  );

  const handleDismantleGear = useCallback(
    (uid: string) => {
      updateSave((prev) => {
        const item = prev.gearInventory.find((g) => g.uid === uid);
        if (!item) return prev;
        const isEquipped = Object.values(prev.equippedGear).includes(uid);
        if (isEquipped) return prev;
        const bLv = prev.buildings.blacksmith || 0;
        const dismantleGold = Math.round(
          RARITY_META[item.rarity].dismantleGold * (bLv >= 2 ? 1.25 : 1)
        );
        sound.playCoinPickup();
        return {
          ...prev,
          gold: prev.gold + dismantleGold,
          gearInventory: prev.gearInventory.filter((g) => g.uid !== uid),
        };
      });
    },
    [updateSave]
  );

  // ===== Camp: Tavern (Quests) =====
  const handleClaimUnlockQuest = useCallback(
    (questId: string) => {
      const def = UNLOCK_QUESTS.find((q) => q.id === questId);
      if (!def) return;
      updateSave((prev) => {
        if (prev.claimedUnlockQuests.includes(questId)) return prev;
        if (def.getProgress(prev) < def.target) return prev;
        sound.playLevelUp();
        return {
          ...prev,
          gold: prev.gold + def.rewardGold,
          sealMarks: prev.sealMarks + def.rewardSeals,
          claimedUnlockQuests: [...prev.claimedUnlockQuests, questId],
          completedUnlockQuests: prev.completedUnlockQuests.includes(questId)
            ? prev.completedUnlockQuests
            : [...prev.completedUnlockQuests, questId],
        };
      });
    },
    [updateSave]
  );

  const handleClaimDailyQuest = useCallback(
    (questId: string) => {
      const todayKey = getLocalDateKey();
      const dailyQuests = getDailyQuestsForDate(todayKey);
      const def = dailyQuests.find((q) => q.id === questId);
      if (!def) return;
      updateSave((prev) => {
        if (prev.dailyQuestState.dateStr !== todayKey) return prev;
        if (prev.dailyQuestState.claimed.includes(questId)) return prev;
        if ((prev.dailyQuestState.progress[questId] || 0) < def.target) return prev;
        const tavernLv = prev.buildings.tavern || 1;
        const goldReward = Math.round(def.rewardGold * (tavernLv >= 2 ? 1.25 : 1));
        const seReward = def.rewardSoulEssence + (tavernLv >= 3 ? 1 : 0);
        sound.playLevelUp();
        return {
          ...prev,
          gold: prev.gold + goldReward,
          soulEssence: prev.soulEssence + seReward,
          dailyQuestState: {
            ...prev.dailyQuestState,
            claimed: [...prev.dailyQuestState.claimed, questId],
          },
        };
      });
    },
    [updateSave]
  );

  // ===== Camp: Apothecary =====
  const handleBuyPotion = useCallback(
    (potionId: PotionId) => {
      const def = POTIONS[potionId];
      if (!def) return;
      updateSave((prev) => {
        if ((prev.buildings.apothecary || 0) < def.requiredApothecaryLv) return prev;
        if (prev.gold < def.cost) return prev;
        sound.playCoinPickup();
        return {
          ...prev,
          gold: prev.gold - def.cost,
          ownedPotions: {
            ...prev.ownedPotions,
            [potionId]: (prev.ownedPotions[potionId] || 0) + 1,
          },
          selectedPotion: prev.selectedPotion || potionId,
        };
      });
    },
    [updateSave]
  );

  const handleSelectPotion = useCallback(
    (potionId: PotionId | null) => {
      updateSave((prev) => ({ ...prev, selectedPotion: potionId }));
    },
    [updateSave]
  );

  const handleConsumePotion = useCallback(
    (potionId: PotionId) => {
      updateSave((prev) => {
        const cur = prev.ownedPotions[potionId] || 0;
        const nextQty = Math.max(0, cur - 1);
        return {
          ...prev,
          ownedPotions: {
            ...prev.ownedPotions,
            [potionId]: nextQty,
          },
          selectedPotion: nextQty <= 0 && prev.selectedPotion === potionId ? null : prev.selectedPotion,
        };
      });
    },
    [updateSave]
  );

  // ===== Camp: Dark Moon Altar =====
  const handleUnlockAltarRow = useCallback(
    (rowId: AltarRowId) => {
      const row = ALTAR_ROWS.find((r) => r.id === rowId);
      if (!row) return;
      updateSave((prev) => {
        if (prev.unlockedAltarRows.includes(rowId)) return prev;
        if (prev.sealMarks < row.sealUnlockCost) return prev;
        sound.playLevelUp();
        return {
          ...prev,
          sealMarks: prev.sealMarks - row.sealUnlockCost,
          unlockedAltarRows: [...prev.unlockedAltarRows, rowId],
        };
      });
    },
    [updateSave]
  );

  const handleUpgradeAltarRow = useCallback(
    (rowId: AltarRowId, branch: AltarBranch) => {
      const row = ALTAR_ROWS.find((r) => r.id === rowId);
      if (!row) return;
      updateSave((prev) => {
        if ((prev.buildings.altar || 0) <= 0) return prev;
        if (row.requiresSealUnlock && !prev.unlockedAltarRows.includes(rowId)) return prev;
        const cur = prev.talents[rowId] || { rank: 0, branch: 'A' };
        if (cur.rank >= row.maxRank || prev.soulEssence < row.seCostPerRank) return prev;
        sound.playLevelUp();
        return {
          ...prev,
          soulEssence: prev.soulEssence - row.seCostPerRank,
          talents: {
            ...prev.talents,
            [rowId]: { rank: cur.rank + 1, branch },
          },
        };
      });
    },
    [updateSave]
  );

  const handleSelectAltarBranch = useCallback(
    (rowId: AltarRowId, branch: AltarBranch) => {
      updateSave((prev) => {
        const cur = prev.talents[rowId];
        if (!cur || cur.rank <= 0) return prev;
        return {
          ...prev,
          talents: {
            ...prev.talents,
            [rowId]: { ...cur, branch },
          },
        };
      });
    },
    [updateSave]
  );

  const handleResetAltar = useCallback(() => {
    updateSave((prev) => {
      const spent = getAltarSpentSoulEssence(prev);
      if (spent <= 0 || prev.sealMarks < 1) return prev;
      sound.playLevelUp();
      return {
        ...prev,
        sealMarks: prev.sealMarks - 1,
        soulEssence: prev.soulEssence + spent,
        talents: {
          row1: { rank: 0, branch: 'A' },
          row2: { rank: 0, branch: 'A' },
          row3: { rank: 0, branch: 'A' },
          row4: { rank: 0, branch: 'A' },
          row5: { rank: 0, branch: 'A' },
          row6: { rank: 0, branch: 'A' },
        },
      };
    });
  }, [updateSave]);

  // ===== Camp: Soul Tower =====
  const handleClaimSoulTower = useCallback(() => {
    const now = Date.now();
    updateSave((prev) => {
      const pending = computePendingSoulEssence(prev, now);
      if (pending <= 0) return prev;
      sound.playLevelUp();
      return {
        ...prev,
        soulEssence: prev.soulEssence + pending,
        soulTowerLastClaimAt: now,
      };
    });
  }, [updateSave]);

  // ===== Camp: Curse Gate =====
  const handleSetCurseRank = useCallback(
    (curseId: CurseId, rank: number) => {
      const def = CURSES.find((c) => c.id === curseId);
      if (!def) return;
      updateSave((prev) => ({
        ...prev,
        activeCurses: {
          ...prev.activeCurses,
          [curseId]: Math.max(0, Math.min(def.maxRank, rank)),
        },
      }));
    },
    [updateSave]
  );

  const handleClearCurses = useCallback(() => {
    updateSave((prev) => ({
      ...prev,
      activeCurses: {
        spawn_rate: 0,
        enemy_hp: 0,
        enemy_dmg: 0,
        enemy_speed: 0,
        elite_freq: 0,
        frenzy_boss: 0,
        cursed_heal: 0,
        no_draft_tricks: 0,
        early_reaper: 0,
      },
    }));
  }, [updateSave]);

  // ===== Camp: Hatchery =====
  const handleHatchPetEgg = useCallback(() => {
    updateSave((prev) => {
      const hLv = prev.buildings.hatchery || 0;
      if (hLv <= 0) return prev;
      const cost = getPetEggCost(hLv);
      if (prev.gold < cost) return prev;
      const unowned = PET_IDS.filter((p) => !prev.ownedPets.includes(p));
      sound.playLevelUp();
      if (unowned.length > 0) {
        const picked = unowned[Math.floor(Math.random() * unowned.length)];
        return {
          ...prev,
          gold: prev.gold - cost,
          ownedPets: [...prev.ownedPets, picked],
          equippedPet: prev.equippedPet || picked,
        };
      }
      // Duplicate egg when all pets owned grants Soul Essence bonus
      return {
        ...prev,
        gold: prev.gold - cost,
        soulEssence: prev.soulEssence + 5,
      };
    });
  }, [updateSave]);

  const handleEquipPet = useCallback(
    (petId: PetId | null) => {
      updateSave((prev) => ({ ...prev, equippedPet: petId }));
    },
    [updateSave]
  );

  // ===== Skins & Stage Unlock =====
  const handleSelectSkin = useCallback(
    (raceId: RaceId, skinId: string) => {
      updateSave((prev) => ({
        ...prev,
        activeSkinByRace: {
          ...prev.activeSkinByRace,
          [raceId]: skinId,
        },
      }));
    },
    [updateSave]
  );

  const handleUnlockStage = useCallback(
    (stageId: StageId) => {
      const st = STAGES[stageId];
      updateSave((prev) => {
        if (prev.unlockedStages.includes(stageId) || prev.gold < st.unlockCost) {
          return prev;
        }
        sound.playLevelUp();
        return {
          ...prev,
          gold: prev.gold - st.unlockCost,
          unlockedStages: [...prev.unlockedStages, stageId],
        };
      });
      setSelectedStage(stageId);
    },
    [updateSave]
  );

  // ===== Run Lifecycle =====
  const handleStartRun = useCallback(() => {
    setIsDailyChallengeRun(false);
    setRunSummary(null);
    setDraftChoices([]);
    setBossChestReward(null);
    setArtifactChoices([]);
    setSinChoices([]);
    setMapInteractionPrompt(null);
    setRunId((n) => n + 1);
    setScreenState('PLAYING');
  }, []);

  const handleStartDailyChallenge = useCallback(() => {
    const dc = getDailyChallengeForDate();
    setSelectedRace(dc.raceId);
    setSelectedStage(dc.stageId);
    setSelectedWeapon(RACES[dc.raceId].defaultWeapon);
    setIsDailyChallengeRun(true);
    setCampOpen(false);
    setRunSummary(null);
    setDraftChoices([]);
    setBossChestReward(null);
    setArtifactChoices([]);
    setSinChoices([]);
    setMapInteractionPrompt(null);
    setRunId((n) => n + 1);
    setScreenState('PLAYING');
  }, []);

  const handleLevelUpDraft = useCallback((choices: DraftChoice[]) => {
    setDraftChoices(choices);
    setScreenState('LEVEL_UP_CHEST');
  }, []);

  const handleSelectDraft = useCallback((choice: DraftChoice) => {
    canvasRef.current?.applyDraftChoice(choice);
    setDraftChoices([]);
    setScreenState('PLAYING');
  }, []);

  const handleRerollDraft = useCallback(() => {
    canvasRef.current?.rerollDraft();
  }, []);

  const handleBanishDraft = useCallback((choice: DraftChoice) => {
    canvasRef.current?.banishDraft(choice);
  }, []);

  const handleSkipDraft = useCallback(() => {
    canvasRef.current?.skipDraft();
    setDraftChoices([]);
    setScreenState('PLAYING');
  }, []);

  const handleBossChestOpen = useCallback((reward: BossChestReward) => {
    setBossChestReward(reward);
    setScreenState('BOSS_CHEST');
  }, []);

  const handleClaimBossChest = useCallback(() => {
    if (bossChestReward) {
      canvasRef.current?.applyBossChest(bossChestReward);
    }
    setBossChestReward(null);
    setScreenState('PLAYING');
  }, [bossChestReward]);

  const handleArtifactChestOpen = useCallback((choices: ArtifactId[]) => {
    setArtifactChoices(choices);
    setScreenState('ARTIFACT_CHEST');
  }, []);

  const handleSelectArtifact = useCallback((artifactId: ArtifactId | null) => {
    canvasRef.current?.applyArtifactChoice(artifactId);
    setArtifactChoices([]);
    setScreenState('PLAYING');
  }, []);

  const handleClassEvolutionPrompt = useCallback(() => {
    setScreenState('CLASS_EVOLUTION');
  }, []);

  const handleSelectRaceClass = useCallback((classId: RaceClassId) => {
    canvasRef.current?.applyRaceClass(classId);
    setScreenState('PLAYING');
  }, []);

  const handleSinContractOpen = useCallback((choices: SinContractChoice[]) => {
    setSinChoices(choices);
    setScreenState('SIN_CONTRACT');
  }, []);

  const handleSelectSin = useCallback((sinId: SinId, banishSinId?: SinId) => {
    canvasRef.current?.applySinContract(sinId, banishSinId);
    setSinChoices([]);
    setScreenState('PLAYING');
  }, []);

  const handleMapInteractionPrompt = useCallback((prompt: MapInteractionPrompt) => {
    setMapInteractionPrompt(prompt);
    setScreenState('MAP_INTERACTION');
  }, []);

  const handleResolveMapInteraction = useCallback((result: MapInteractionResult) => {
    canvasRef.current?.resolveMapInteraction(result);
    if (result.kind === 'secret_shop' && result.buyArtifactId && !result.close) {
      setMapInteractionPrompt((prev) =>
        prev && prev.kind === 'secret_shop'
          ? {
              ...prev,
              offers: prev.offers.map((o) =>
                o.id === result.buyArtifactId ? { ...o, owned: true } : o
              ),
            }
          : prev
      );
      return;
    }
    setMapInteractionPrompt(null);
    setScreenState('PLAYING');
  }, []);

  const handleDiscoverFusion = useCallback(
    (fusionKey: string) => {
      updateSave((prev) => {
        if (prev.discoveredFusions.includes(fusionKey)) return prev;
        return {
          ...prev,
          discoveredFusions: [...prev.discoveredFusions, fusionKey],
        };
      });
    },
    [updateSave]
  );

  const handleRunEnd = useCallback(
    (summary: RunSummary) => {
      const todayKey = getLocalDateKey();
      const dailyQuests = getDailyQuestsForDate(todayKey);
      const dailyChallenge = getDailyChallengeForDate(todayKey);
      const masteryXpGained = Math.max(
        10,
        Math.round(
          summary.elapsedSeconds / 4 +
            summary.kills * 0.12 +
            summary.bossesKilled * 25 +
            (summary.victory ? 150 : 0)
        )
      );

      let newlyUnlockedQuestNames: string[] = [];

      setSaveData((prev) => {
        const nextBestiary = { ...prev.bestiaryKills };
        for (const [k, v] of Object.entries(summary.runKillsByKind || {})) {
          const kind = k as EnemyKind;
          nextBestiary[kind] = (nextBestiary[kind] || 0) + (v || 0);
        }

        const evolvedSet = new Set(prev.questStats.evolvedWeaponsEver);
        for (const w of summary.weapons) {
          if (w.evolved) evolvedSet.add(w.id);
        }
        const bossKindSet = new Set(prev.questStats.defeatedBossKinds);
        for (const bk of summary.runDefeatedBossKinds || []) {
          bossKindSet.add(bk);
        }

        const nextStage1Cleared =
          prev.questStats.stage1Cleared || summary.victory || summary.reaperSlain;
        const nextQuestStats = {
          ...prev.questStats,
          bananaKills: prev.questStats.bananaKills + (summary.runBananaKills || 0),
          fireBurnKills: prev.questStats.fireBurnKills + (summary.runFireBurnKills || 0),
          knightParries: prev.questStats.knightParries + (summary.runKnightParries || 0),
          orcBestTimeSeconds:
            summary.raceId === 'orc'
              ? Math.max(prev.questStats.orcBestTimeSeconds, summary.elapsedSeconds)
              : prev.questStats.orcBestTimeSeconds,
          maxComboEver: Math.max(prev.questStats.maxComboEver, summary.maxCombo),
          evolvedWeaponsEver: Array.from(evolvedSet),
          defeatedBossKinds: Array.from(bossKindSet),
          totalBossKills: prev.questStats.totalBossKills + summary.bossesKilled,
          totalEliteKills: prev.questStats.totalEliteKills + summary.elitesKilled,
          totalRuns: prev.questStats.totalRuns + 1,
          victories: prev.questStats.victories + (summary.victory ? 1 : 0),
          stage1Cleared: nextStage1Cleared,
        };

        // Update daily quests for today
        const baseDaily =
          prev.dailyQuestState.dateStr === todayKey
            ? prev.dailyQuestState
            : { dateStr: todayKey, progress: {}, claimed: [] };
        const nextDailyProgress = { ...baseDaily.progress };
        for (const dq of dailyQuests) {
          const add =
            dq.metric === 'kills'
              ? summary.kills
              : dq.metric === 'bosses'
                ? summary.bossesKilled
                : dq.metric === 'elites'
                  ? summary.elitesKilled
                  : dq.metric === 'runs'
                    ? 1
                    : Math.floor(summary.elapsedSeconds / 60);
          nextDailyProgress[dq.id] = (nextDailyProgress[dq.id] || 0) + add;
        }

        // Daily Challenge victory bonus
        let bonusDcSeals = 0;
        let bonusDcGold = 0;
        let nextDcClaimedDate = prev.dailyChallengeClaimedDate;
        if (summary.dailyChallengeWon && prev.dailyChallengeClaimedDate !== todayKey) {
          bonusDcSeals = dailyChallenge.rewardSeals;
          bonusDcGold = dailyChallenge.rewardGold;
          nextDcClaimedDate = todayKey;
        }

        // Extracted gear items (Bring It Back on victory)
        const now = Date.now();
        const newGearItems: OwnedGearItem[] = summary.extractedGear.map((eg, i) => ({
          uid: `gear_${now}_${i}_${Math.random().toString(36).slice(2, 7)}`,
          defId: eg.defId,
          rarity: eg.rarity,
          enhanceLevel: 0,
          acquiredAt: now,
        }));

        const nextBestCurse = { ...prev.bestCurseByRace };
        if (summary.victory && summary.curseLevel > (nextBestCurse[summary.raceId] || 0)) {
          nextBestCurse[summary.raceId] = summary.curseLevel;
        }

        const prevRaceXp = prev.masteryXpByRace[summary.raceId] || 0;
        const nextRaceXp = prevRaceXp + masteryXpGained;

        const nextBuildings = {
          ...prev.buildings,
          curse_gate: nextStage1Cleared
            ? Math.max(1, prev.buildings.curse_gate || 0)
            : prev.buildings.curse_gate || 0,
        };

        const provisionalNext: SaveData = {
          ...prev,
          gold: prev.gold + summary.goldEarned + bonusDcGold,
          soulEssence: prev.soulEssence + summary.soulEssenceEarned,
          sealMarks: prev.sealMarks + summary.sealMarksEarned + bonusDcSeals,
          bestTimeSeconds: Math.max(prev.bestTimeSeconds, summary.elapsedSeconds),
          totalKills: prev.totalKills + summary.kills,
          reaperKills: prev.reaperKills + summary.reaperSlainCount,
          buildings: nextBuildings,
          bestCurseByRace: nextBestCurse,
          questStats: nextQuestStats,
          dailyQuestState: {
            dateStr: todayKey,
            progress: nextDailyProgress,
            claimed: baseDaily.claimed,
          },
          dailyChallengeClaimedDate: nextDcClaimedDate,
          bestiaryKills: nextBestiary,
          gearInventory: [...prev.gearInventory, ...newGearItems],
          masteryXpByRace: {
            ...prev.masteryXpByRace,
            [summary.raceId]: nextRaceXp,
          },
        };

        // Check newly completed Unlock Quests
        const newlyDoneIds: string[] = [];
        const newNames: string[] = [];
        for (const uq of UNLOCK_QUESTS) {
          if (
            !prev.completedUnlockQuests.includes(uq.id) &&
            uq.getProgress(provisionalNext) >= uq.target
          ) {
            newlyDoneIds.push(uq.id);
            newNames.push(uq.titleTh);
          }
        }
        newlyUnlockedQuestNames = newNames;

        const finalSave: SaveData = {
          ...provisionalNext,
          completedUnlockQuests: [...prev.completedUnlockQuests, ...newlyDoneIds],
        };
        persistSaveData(finalSave);

        const lvBefore = getMasteryLevelInfo(prevRaceXp).level;
        const lvAfter = getMasteryLevelInfo(nextRaceXp).level;
        setRunSummary({
          ...summary,
          masteryXpGained,
          masteryLevelBefore: lvBefore,
          masteryLevelAfter: lvAfter,
          newUnlockQuestNames: newlyUnlockedQuestNames,
        });

        return finalSave;
      });

      setScreenState(summary.victory ? 'VICTORY' : 'GAME_OVER');
    },
    []
  );

  const handleQuitFromPause = useCallback(() => {
    if (canvasRef.current) {
      canvasRef.current.finishRunAsQuit();
    } else {
      setScreenState('TITLE_MENU');
    }
  }, []);

  // Esc / P pause toggle during active run
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key.toLowerCase() === 'p') {
        if (screenState === 'PLAYING') {
          setScreenState('PAUSED');
        } else if (screenState === 'PAUSED') {
          setScreenState('PLAYING');
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [screenState]);

  const isInRun = screenState !== 'TITLE_MENU';

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#0B0F17]">
      {!isInRun && (
        <TitleScreen
          saveData={saveData}
          selectedRace={selectedRace}
          selectedStage={selectedStage}
          selectedWeapon={selectedWeapon}
          selectedPace={selectedPace}
          botMode={botMode}
          botTargetClass={botTargetClass}
          onSelectRace={handleSelectRace}
          onSelectStage={setSelectedStage}
          onSelectWeapon={setSelectedWeapon}
          onSelectPace={setSelectedPace}
          onSelectBotMode={setBotMode}
          onSelectBotTargetClass={setBotTargetClass}
          onUnlockStage={handleUnlockStage}
          onOpenShop={handleOpenCamp}
          onSelectSkin={handleSelectSkin}
          onStartRun={handleStartRun}
          onStartDailyChallenge={handleStartDailyChallenge}
          onToggleMute={handleToggleMute}
          onChangeVolumes={handleChangeVolumes}
        />
      )}

      {isInRun && (
        <>
          <GameCanvas
            ref={canvasRef}
            runId={runId}
            screenState={screenState}
            raceId={selectedRace}
            stageId={selectedStage}
            starterWeapon={selectedWeapon}
            runPace={selectedPace}
            simSpeed={simSpeed}
            botMode={botMode}
            botTargetClass={botTargetClass}
            isDailyChallenge={isDailyChallengeRun}
            saveData={saveData}
            onHudUpdate={setHud}
            onLevelUpDraft={handleLevelUpDraft}
            onBossChestOpen={handleBossChestOpen}
            onArtifactChestOpen={handleArtifactChestOpen}
            onClassEvolutionPrompt={handleClassEvolutionPrompt}
            onSinContractOpen={handleSinContractOpen}
            onMapInteractionPrompt={handleMapInteractionPrompt}
            onDiscoverFusion={handleDiscoverFusion}
            onConsumePotion={handleConsumePotion}
            onRunEnd={handleRunEnd}
          />

          <GameHud
            hud={hud}
            raceId={selectedRace}
            simSpeed={simSpeed}
            botMode={botMode}
            botTargetClass={botTargetClass}
            muted={saveData.muted}
            volumes={{
              masterVolume: saveData.masterVolume,
              bgmVolume: saveData.bgmVolume,
              sfxVolume: saveData.sfxVolume,
            }}
            onToggleSpeed={() => setSimSpeed((s) => (s === 1 ? 2 : s === 2 ? 3 : 1))}
            onCycleBotMode={() =>
              setBotMode((m) => (m === 'off' ? 'idle' : m === 'idle' ? 'full' : 'off'))
            }
            onSelectBotTargetClass={setBotTargetClass}
            onToggleMute={handleToggleMute}
            onChangeVolumes={handleChangeVolumes}
            onPause={() => setScreenState('PAUSED')}
            onTriggerDash={() => canvasRef.current?.triggerDash()}
            onTriggerVoidInfusion={() => canvasRef.current?.triggerVoidInfusion()}
            onTriggerActiveSkill={() => canvasRef.current?.triggerActiveSkill()}
            onTriggerPotion={() => canvasRef.current?.triggerPotion()}
            onStartHoldActiveSkill={() => canvasRef.current?.startHoldActiveSkill()}
            onReleaseHoldActiveSkill={() => canvasRef.current?.releaseHoldActiveSkill()}
          />
        </>
      )}

      {screenState === 'LEVEL_UP_CHEST' && draftChoices.length > 0 && (
        <LevelUpChestModal
          level={hud.level}
          raceId={selectedRace}
          raceClass={hud.raceClass}
          choices={draftChoices}
          rerollsLeft={hud.rerollsLeft}
          banishesLeft={hud.banishesLeft}
          skipsLeft={hud.skipsLeft}
          noDraftTricks={(saveData.activeCurses.no_draft_tricks || 0) > 0}
          onSelect={handleSelectDraft}
          onReroll={handleRerollDraft}
          onBanish={handleBanishDraft}
          onSkip={handleSkipDraft}
        />
      )}

      {screenState === 'BOSS_CHEST' && bossChestReward && (
        <BossChestModal reward={bossChestReward} onClaim={handleClaimBossChest} />
      )}

      {screenState === 'ARTIFACT_CHEST' && artifactChoices.length > 0 && (
        <ArtifactChestModal
          choices={artifactChoices}
          equipped={hud.artifacts}
          onSelect={handleSelectArtifact}
        />
      )}

      {screenState === 'CLASS_EVOLUTION' && (
        <ClassEvolutionModal raceId={selectedRace} onSelect={handleSelectRaceClass} />
      )}

      {screenState === 'SIN_CONTRACT' && sinChoices.length > 0 && (
        <SinContractModal
          level={hud.level}
          choices={sinChoices}
          activeSins={hud.sinsActive}
          maxSlots={hud.sinsMaxSlots}
          onSelect={handleSelectSin}
        />
      )}

      {screenState === 'MAP_INTERACTION' && mapInteractionPrompt && (
        <MapInteractionModal
          prompt={mapInteractionPrompt}
          hud={hud}
          onResolve={handleResolveMapInteraction}
        />
      )}

      {screenState === 'PAUSED' && (
        <PauseModal
          hud={hud}
          raceId={selectedRace}
          discoveredFusions={saveData.discoveredFusions}
          muted={saveData.muted}
          volumes={{
            masterVolume: saveData.masterVolume,
            bgmVolume: saveData.bgmVolume,
            sfxVolume: saveData.sfxVolume,
          }}
          onToggleMute={handleToggleMute}
          onChangeVolumes={handleChangeVolumes}
          onResume={() => setScreenState('PLAYING')}
          onQuit={handleQuitFromPause}
        />
      )}

      {(screenState === 'GAME_OVER' || screenState === 'VICTORY') && runSummary && (
        <RunSummaryModal
          summary={runSummary}
          saveData={saveData}
          onPlayAgain={handleStartRun}
          onOpenShop={() => handleOpenCamp('map')}
          onReturnTitle={() => setScreenState('TITLE_MENU')}
        />
      )}

      {campOpen && (
        <CampModal
          saveData={saveData}
          initialBuilding={campInitialTab}
          onClose={() => setCampOpen(false)}
          onUpgradeBuilding={handleUpgradeBuilding}
          onBuyTraining={handleBuyUpgrade}
          onRefundTraining={handleRefundAll}
          onEquipGear={handleEquipGear}
          onUnequipGear={handleUnequipGear}
          onEnhanceGear={handleEnhanceGear}
          onDismantleGear={handleDismantleGear}
          onClaimUnlockQuest={handleClaimUnlockQuest}
          onClaimDailyQuest={handleClaimDailyQuest}
          onStartDailyChallenge={handleStartDailyChallenge}
          onBuyPotion={handleBuyPotion}
          onSelectPotion={handleSelectPotion}
          onUnlockAltarRow={handleUnlockAltarRow}
          onUpgradeAltarRow={handleUpgradeAltarRow}
          onSelectAltarBranch={handleSelectAltarBranch}
          onResetAltar={handleResetAltar}
          onClaimSoulTower={handleClaimSoulTower}
          onSetCurseRank={handleSetCurseRank}
          onClearCurses={handleClearCurses}
          onHatchPetEgg={handleHatchPetEgg}
          onEquipPet={handleEquipPet}
        />
      )}
    </div>
  );
}
