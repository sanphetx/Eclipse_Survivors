import React, { useEffect, useState } from 'react';
import {
  Anvil,
  Award,
  Beer,
  BookOpen,
  Check,
  Coins,
  Crown,
  Dices,
  Flame,
  FlaskConical,
  Gem,
  Hammer,
  Heart,
  Lock,
  Map as MapIcon,
  Minus,
  Moon,
  PawPrint,
  Plus,
  RotateCcw,
  ScrollText,
  Shield,
  Skull,
  Sparkles,
  Swords,
  Trash2,
  X,
} from 'lucide-react';
import {
  ALL_ELEMENT_FUSIONS,
  ELEMENTS,
  formatClock,
  getMetaUpgradeCost,
  META_UPGRADES,
  RACES,
  STAGES,
} from '../game/data';
import {
  ALTAR_ROWS,
  BESTIARY_ENTRIES,
  CAMP_BUILDINGS,
  computeCurseLevel,
  computePendingSoulEssence,
  CURSES,
  GEAR_SLOT_LABELS,
  getAltarSpentSoulEssence,
  getBestiaryDamageBonus,
  getBuildingUpgradeCost,
  getDailyChallengeForDate,
  getDailyQuestsForDate,
  getGearEnhanceCost,
  getGearItemEffectiveValue,
  getLocalDateKey,
  getMasteryLevelInfo,
  getMaxBlacksmithEnhanceLevel,
  getPetEggCost,
  getSoulTowerProduction,
  getTotalTrainingRanksBought,
  PERMANENT_GEAR_CATALOG,
  PET_IDS,
  PETS,
  POTION_ORDER,
  POTIONS,
  RARITY_META,
  UNLOCK_QUESTS,
} from '../game/metaData';
import {
  AltarBranch,
  AltarRowId,
  CampBuildingId,
  CurseId,
  GearSlot,
  MetaUpgradeId,
  PetId,
  PotionId,
  RaceId,
  SaveData,
} from '../game/types';

export interface CampModalProps {
  saveData: SaveData;
  initialBuilding?: CampBuildingId | 'map';
  onClose: () => void;
  onUpgradeBuilding: (buildingId: CampBuildingId) => void;
  // Training
  onBuyTraining: (id: MetaUpgradeId) => void;
  onRefundTraining: () => void;
  // Blacksmith
  onEquipGear: (uid: string) => void;
  onUnequipGear: (slot: GearSlot) => void;
  onEnhanceGear: (uid: string) => void;
  onDismantleGear: (uid: string) => void;
  // Tavern
  onClaimUnlockQuest: (questId: string) => void;
  onClaimDailyQuest: (questId: string) => void;
  onStartDailyChallenge: () => void;
  // Apothecary
  onBuyPotion: (potionId: PotionId) => void;
  onSelectPotion: (potionId: PotionId | null) => void;
  // Altar
  onUnlockAltarRow: (rowId: AltarRowId) => void;
  onUpgradeAltarRow: (rowId: AltarRowId, branch: AltarBranch) => void;
  onSelectAltarBranch: (rowId: AltarRowId, branch: AltarBranch) => void;
  onResetAltar: () => void;
  // Soul Tower
  onClaimSoulTower: () => void;
  // Curse Gate
  onSetCurseRank: (curseId: CurseId, rank: number) => void;
  onClearCurses: () => void;
  // Hatchery
  onHatchPetEgg: () => void;
  onEquipPet: (petId: PetId | null) => void;
}

const BUILDING_ICONS: Record<CampBuildingId, React.ReactNode> = {
  training: <Swords className="w-4 h-4" />,
  tavern: <Beer className="w-4 h-4" />,
  library: <BookOpen className="w-4 h-4" />,
  blacksmith: <Anvil className="w-4 h-4" />,
  apothecary: <FlaskConical className="w-4 h-4" />,
  soul_tower: <Gem className="w-4 h-4" />,
  hatchery: <PawPrint className="w-4 h-4" />,
  altar: <Moon className="w-4 h-4" />,
  curse_gate: <Skull className="w-4 h-4" />,
};

export const CampModal: React.FC<CampModalProps> = ({
  saveData,
  initialBuilding = 'map',
  onClose,
  onUpgradeBuilding,
  onBuyTraining,
  onRefundTraining,
  onEquipGear,
  onUnequipGear,
  onEnhanceGear,
  onDismantleGear,
  onClaimUnlockQuest,
  onClaimDailyQuest,
  onStartDailyChallenge,
  onBuyPotion,
  onSelectPotion,
  onUnlockAltarRow,
  onUpgradeAltarRow,
  onSelectAltarBranch,
  onResetAltar,
  onClaimSoulTower,
  onSetCurseRank,
  onClearCurses,
  onHatchPetEgg,
  onEquipPet,
}) => {
  const [activeTab, setActiveTab] = useState<CampBuildingId | 'map'>(initialBuilding);
  const [libraryTab, setLibraryTab] = useState<'bestiary' | 'fusions' | 'stats'>('bestiary');
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setNowMs(Date.now()), 5000);
    return () => window.clearInterval(timer);
  }, []);

  const todayKey = getLocalDateKey();
  const dailyQuests = getDailyQuestsForDate(todayKey);
  const dailyChallenge = getDailyChallengeForDate(todayKey);
  const pendingSe = computePendingSoulEssence(saveData, nowMs);
  const totalCurseLevel = computeCurseLevel(saveData.activeCurses);

  const claimableUnlockCount = UNLOCK_QUESTS.filter(
    (q) => !saveData.claimedUnlockQuests.includes(q.id) && q.getProgress(saveData) >= q.target
  ).length;
  const claimableDailyCount = dailyQuests.filter(
    (dq) =>
      !saveData.dailyQuestState.claimed.includes(dq.id) &&
      (saveData.dailyQuestState.progress[dq.id] || 0) >= dq.target
  ).length;

  const activeBuildingDef =
    activeTab === 'map' ? null : CAMP_BUILDINGS.find((b) => b.id === activeTab) || null;
  const activeBuildingLv = activeBuildingDef ? saveData.buildings[activeBuildingDef.id] || 0 : 0;

  const renderBuildingHeaderCard = () => {
    if (!activeBuildingDef) return null;
    const isMax = activeBuildingLv >= activeBuildingDef.maxLevel;
    const nextCost = getBuildingUpgradeCost(activeBuildingDef, activeBuildingLv);
    const lockedByStage =
      activeBuildingDef.requiresStage1Clear &&
      activeBuildingLv <= 0 &&
      !saveData.questStats.stage1Cleared &&
      saveData.reaperKills <= 0;
    const canAfford =
      !isMax &&
      !lockedByStage &&
      saveData.gold >= nextCost.gold &&
      saveData.sealMarks >= nextCost.seals;

    return (
      <div className="mb-4 p-4 rounded-md bg-[#0B0C14] border border-amber-500/25 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span
              className="w-7 h-7 rounded bg-[#141522] border flex items-center justify-center shrink-0"
              style={{ borderColor: `${activeBuildingDef.accentColor}66`, color: activeBuildingDef.accentColor }}
            >
              {BUILDING_ICONS[activeBuildingDef.id]}
            </span>
            <h3 className="font-display text-lg font-bold text-amber-100">
              {activeBuildingDef.nameTh}
            </h3>
            <span className="font-mono-num text-xs px-2 py-0.5 rounded bg-stone-900 border border-stone-700 text-amber-300">
              {activeBuildingLv > 0 ? `Lv.${activeBuildingLv}/${activeBuildingDef.maxLevel}` : 'ยังไม่สร้าง'}
            </span>
          </div>
          <p className="text-xs text-stone-400 mt-1">{activeBuildingDef.subtitleTh}</p>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px]">
            {activeBuildingDef.lvBenefits.map((b, i) => {
              const unlocked = activeBuildingLv >= i + 1;
              return (
                <span key={i} className={unlocked ? 'text-emerald-300' : 'text-stone-500'}>
                  Lv.{i + 1}: {b}
                </span>
              );
            })}
          </div>
        </div>

        <div className="shrink-0">
          {lockedByStage ? (
            <div className="px-3 py-2 rounded bg-rose-950/50 border border-rose-500/35 text-xs text-rose-200 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5" />
              <span>ปลดล็อกเมื่อผ่านด่าน 1 หรือโค่นยมทูต</span>
            </div>
          ) : isMax ? (
            <div className="px-3.5 py-2 rounded bg-emerald-950/40 border border-emerald-500/35 text-xs font-semibold text-emerald-300">
              สิ่งก่อสร้างระดับสูงสุด
            </div>
          ) : (
            <button
              type="button"
              disabled={!canAfford}
              onClick={() => onUpgradeBuilding(activeBuildingDef.id)}
              className={`px-4 py-2 rounded text-xs font-bold font-mono-num flex items-center gap-2 transition-colors ${
                canAfford
                  ? 'gothic-btn-gold cursor-pointer'
                  : 'bg-stone-900 border border-stone-700 text-stone-500 cursor-not-allowed'
              }`}
            >
              <Hammer className="w-3.5 h-3.5" />
              <span>
                {activeBuildingLv <= 0 ? 'ก่อสร้าง' : `อัปเกรด Lv.${activeBuildingLv + 1}`} (
                {nextCost.gold > 0 ? `${nextCost.gold.toLocaleString()} ทอง` : ''}
                {nextCost.gold > 0 && nextCost.seals > 0 ? ' + ' : ''}
                {nextCost.seals > 0 ? `${nextCost.seals} ตราผนึก` : ''})
              </span>
            </button>
          )}
        </div>
      </div>
    );
  };

  const renderLockedOverlay = (buildingName: string) => (
    <div className="p-8 rounded-md bg-[#0A0B12] border border-stone-800 text-center">
      <Lock className="w-8 h-8 text-stone-500 mx-auto mb-2" />
      <p className="text-sm font-semibold text-stone-200">
        {buildingName} ยังไม่ได้ก่อสร้างในแคมป์
      </p>
      <p className="text-xs text-stone-400 mt-1">
        กดปุ่มก่อสร้างด้านบนเพื่อปลดล็อกฟังก์ชันของอาคารนี้
      </p>
    </div>
  );

  // ===== Sub-Panels =====
  const renderTrainingPanel = () => {
    const totalRanksBought = getTotalTrainingRanksBought(saveData.upgrades);
    const hasAny = totalRanksBought > 0;
    return (
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-stone-300 bg-[#0A0B12] px-4 py-2.5 rounded border border-amber-500/20">
          <span>
            ภาษีลานฝึกสะสม (ทุก 1 ขั้นที่ซื้อราคาทุกอย่าง +10%):{' '}
            <strong className="font-mono-num text-amber-300">+{totalRanksBought * 10}%</strong>
          </span>
          <button
            type="button"
            disabled={!hasAny}
            onClick={onRefundTraining}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors ${
              hasAny
                ? 'text-rose-300 hover:bg-rose-500/10 border border-rose-500/30 cursor-pointer'
                : 'text-stone-600 cursor-not-allowed'
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>คืนทองทั้งหมด ({saveData.trainingGoldSpent.toLocaleString()})</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {META_UPGRADES.map((def) => {
            const level = saveData.upgrades[def.id] || 0;
            const isMax = level >= def.maxLevel;
            const rawCost = getMetaUpgradeCost(def, level, totalRanksBought);
            const cost =
              activeBuildingLv >= 2 && (def.id === 'might' || def.id === 'maxHp' || def.id === 'armor' || def.id === 'speed')
                ? Math.round(rawCost * 0.95)
                : rawCost;
            const canAfford = !isMax && saveData.gold >= cost;

            return (
              <div key={def.id} className="gothic-card p-3.5 rounded-md flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-sm font-bold text-amber-50">{def.nameTh}</h4>
                    <span className="font-mono-num text-xs font-semibold text-amber-300">
                      Lv.{level}/{def.maxLevel}
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-400 mt-1 leading-relaxed">{def.descriptionTh}</p>
                  <p className="text-[11px] font-medium text-sky-300 mt-1.5">{def.bonusPerLevelLabel}</p>
                </div>

                <div className="mt-3 pt-2.5 border-t border-amber-500/15 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1">
                    {Array.from({ length: def.maxLevel }).map((_, i) => (
                      <span
                        key={i}
                        className={`h-2 w-2.5 rounded-xs border ${
                          i < level
                            ? 'bg-amber-400 border-amber-200/80'
                            : 'bg-stone-900 border-stone-700'
                        }`}
                      />
                    ))}
                  </div>
                  <button
                    type="button"
                    disabled={!canAfford}
                    onClick={() => onBuyTraining(def.id)}
                    className={`px-3 py-1 rounded text-xs font-mono-num font-bold ${
                      isMax
                        ? 'bg-stone-900 border border-stone-700 text-stone-500 cursor-not-allowed'
                        : canAfford
                          ? 'gothic-btn-gold cursor-pointer'
                          : 'bg-stone-900 border border-stone-800 text-stone-500 cursor-not-allowed'
                    }`}
                  >
                    {isMax ? 'เต็มแล้ว' : `${cost.toLocaleString()} ทอง`}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderBlacksmithPanel = () => {
    if (activeBuildingLv <= 0) return renderLockedOverlay('โรงตีเหล็ก');
    const maxEnhance = getMaxBlacksmithEnhanceLevel(activeBuildingLv);
    const slots: GearSlot[] = ['signature_weapon', 'armor', 'ring', 'amulet'];
    const equippedUids = new Set(Object.values(saveData.equippedGear).filter(Boolean) as string[]);

    return (
      <div className="space-y-4">
        {/* 4 Equipped Slots */}
        <div>
          <h4 className="text-xs font-semibold text-amber-300 mb-2">
            อุปกรณ์ถาวรที่สวมใส่ (ตีบวกได้สูงสุด +{maxEnhance})
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {slots.map((slot) => {
              const uid = saveData.equippedGear[slot];
              const item = uid ? saveData.gearInventory.find((g) => g.uid === uid) : null;
              const def = item ? PERMANENT_GEAR_CATALOG[item.defId] : null;
              const rMeta = item ? RARITY_META[item.rarity] : null;
              const nextEnhCost = item ? getGearEnhanceCost(item.enhanceLevel + 1) : 0;
              const canEnhance = Boolean(item && item.enhanceLevel < maxEnhance && saveData.gold >= nextEnhCost);

              return (
                <div
                  key={slot}
                  className={`p-3 rounded-md border ${
                    item ? 'gothic-card-active' : 'bg-[#0A0B12] border-stone-800'
                  }`}
                >
                  <div className="text-[11px] text-stone-400">{GEAR_SLOT_LABELS[slot]}</div>
                  {item && def && rMeta ? (
                    <div className="mt-1 space-y-2">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-sm font-bold truncate" style={{ color: rMeta.color }}>
                          {def.nameTh}
                        </span>
                        {item.enhanceLevel > 0 && (
                          <span className="font-mono-num text-xs font-bold text-amber-300">
                            +{item.enhanceLevel}
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-sky-300 font-mono-num">
                        [{rMeta.nameTh}] · พลัง: {getGearItemEffectiveValue(item)} {def.effectUnit}
                      </div>
                      <p className="text-[11px] text-stone-400 leading-snug">{def.descTh}</p>
                      <div className="flex items-center gap-1.5 pt-1">
                        <button
                          type="button"
                          disabled={!canEnhance}
                          onClick={() => onEnhanceGear(item.uid)}
                          className={`flex-1 py-1 px-2 rounded text-[11px] font-mono-num font-bold ${
                            item.enhanceLevel >= maxEnhance
                              ? 'bg-stone-900 border border-stone-700 text-stone-500 cursor-not-allowed'
                              : canEnhance
                                ? 'gothic-btn-gold cursor-pointer'
                                : 'bg-stone-900 border border-stone-800 text-stone-500 cursor-not-allowed'
                          }`}
                        >
                          {item.enhanceLevel >= maxEnhance ? 'ตัน' : `ตีบวก (${nextEnhCost})`}
                        </button>
                        <button
                          type="button"
                          onClick={() => onUnequipGear(slot)}
                          className="gothic-btn-iron py-1 px-2 rounded text-[11px] text-stone-300 cursor-pointer"
                        >
                          ถอด
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-4 text-xs text-stone-500 text-center py-4">
                      ว่าง (หาหีบผนึกจาก Elite / ยมทูต แล้วรอดจบด่าน)
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Inventory */}
        <div>
          <h4 className="text-xs font-semibold text-stone-300 mb-2">
            คลังอุปกรณ์ ({saveData.gearInventory.length} ชิ้น)
          </h4>
          {saveData.gearInventory.length === 0 ? (
            <div className="p-6 rounded-md bg-[#0A0B12] border border-stone-800 text-center text-xs text-stone-500">
              ยังไม่มีอุปกรณ์ถาวร — เก็บ "หีบผนึก" จากมอนสเตอร์ Elite หรือยมทูต แล้วเอาชีวิตรอดให้จบด่านเพื่อนำกลับมาหลอม!
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {saveData.gearInventory.map((item) => {
                const def = PERMANENT_GEAR_CATALOG[item.defId];
                if (!def) return null;
                const rMeta = RARITY_META[item.rarity];
                const isEquipped = equippedUids.has(item.uid);
                const dismantleGold = Math.round(
                  rMeta.dismantleGold * (activeBuildingLv >= 2 ? 1.25 : 1)
                );
                const nextEnhCost = getGearEnhanceCost(item.enhanceLevel + 1);
                const canEnhance = item.enhanceLevel < maxEnhance && saveData.gold >= nextEnhCost;

                return (
                  <div
                    key={item.uid}
                    className={`p-3 rounded border flex flex-col justify-between ${
                      isEquipped ? 'gothic-card-active' : 'gothic-card'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold truncate" style={{ color: rMeta.color }}>
                          [{rMeta.nameTh}] {def.nameTh}
                          {item.enhanceLevel > 0 ? ` +${item.enhanceLevel}` : ''}
                        </span>
                        <span className="text-[10px] text-stone-400 shrink-0">
                          {GEAR_SLOT_LABELS[def.slot]}
                        </span>
                      </div>
                      <div className="text-[11px] text-sky-300 mt-1 font-mono-num">
                        {getGearItemEffectiveValue(item)} {def.effectUnit}
                      </div>
                      <p className="text-[11px] text-stone-400 mt-0.5 leading-snug">{def.descTh}</p>
                    </div>

                    <div className="mt-2.5 pt-2 border-t border-stone-800 flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => (isEquipped ? onUnequipGear(def.slot) : onEquipGear(item.uid))}
                        className={`flex-1 py-1 rounded text-[11px] font-semibold cursor-pointer ${
                          isEquipped ? 'gothic-btn-iron text-amber-300' : 'gothic-btn-gold'
                        }`}
                      >
                        {isEquipped ? 'กำลังสวมใส่ (ถอด)' : 'สวมใส่'}
                      </button>
                      <button
                        type="button"
                        disabled={!canEnhance}
                        onClick={() => onEnhanceGear(item.uid)}
                        className={`py-1 px-2 rounded text-[11px] font-mono-num ${
                          item.enhanceLevel >= maxEnhance
                            ? 'bg-stone-900 border border-stone-700 text-stone-500 cursor-not-allowed'
                            : canEnhance
                              ? 'gothic-btn-iron text-amber-200 cursor-pointer'
                              : 'bg-stone-900 border border-stone-800 text-stone-600 cursor-not-allowed'
                        }`}
                      >
                        {item.enhanceLevel >= maxEnhance ? 'ตัน' : `+1 (${nextEnhCost})`}
                      </button>
                      {!isEquipped && (
                        <button
                          type="button"
                          onClick={() => onDismantleGear(item.uid)}
                          title={`แยกชิ้นส่วนรับ +${dismantleGold} ทอง`}
                          className="p-1.5 rounded bg-rose-950/50 border border-rose-500/35 text-rose-300 hover:bg-rose-900/50 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderLibraryPanel = () => {
    if (activeBuildingLv <= 0) return renderLockedOverlay('หอสมุดต้องสาป');
    return (
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setLibraryTab('bestiary')}
            className={`px-3 py-1.5 rounded text-xs font-semibold cursor-pointer ${
              libraryTab === 'bestiary' ? 'gothic-btn-gold' : 'gothic-btn-iron text-stone-300'
            }`}
          >
            สารานุกรมมอนสเตอร์ ({BESTIARY_ENTRIES.length})
          </button>
          <button
            type="button"
            onClick={() => setLibraryTab('fusions')}
            className={`px-3 py-1.5 rounded text-xs font-semibold cursor-pointer ${
              libraryTab === 'fusions' ? 'gothic-btn-gold' : 'gothic-btn-iron text-stone-300'
            }`}
          >
            คัมภีร์ผสมธาตุ ({saveData.discoveredFusions.length}/{ALL_ELEMENT_FUSIONS.length})
          </button>
          <button
            type="button"
            onClick={() => setLibraryTab('stats')}
            className={`px-3 py-1.5 rounded text-xs font-semibold cursor-pointer ${
              libraryTab === 'stats' ? 'gothic-btn-gold' : 'gothic-btn-iron text-stone-300'
            }`}
          >
            สถิติเชิงลึก &amp; ความชำนาญเผ่า
          </button>
        </div>

        {libraryTab === 'bestiary' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {BESTIARY_ENTRIES.map((entry) => {
              const kills = saveData.bestiaryKills[entry.kind] || 0;
              const bonusPct = Math.round(getBestiaryDamageBonus(saveData.bestiaryKills, entry.kind) * 100);
              return (
                <div key={entry.kind} className="gothic-card p-3 rounded">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-bold" style={{ color: kills > 0 ? entry.accentColor : '#78716C' }}>
                      {kills > 0 ? entry.nameTh : '??? (ยังไม่พบ)'}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-stone-900 text-stone-400">
                      {entry.categoryTh}
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-400 mt-1 leading-relaxed">
                    {kills > 0 || activeBuildingLv >= 2 ? entry.loreTh : 'สังหารมอนสเตอร์ชนิดนี้เพื่อบันทึกข้อมูล'}
                  </p>
                  <div className="mt-2 pt-2 border-t border-stone-800 flex items-center justify-between text-[11px] font-mono-num">
                    <span className="text-stone-300">สังหาร: {kills.toLocaleString()}</span>
                    <span className={bonusPct > 0 ? 'text-emerald-300 font-bold' : 'text-stone-500'}>
                      ดาเมจ +{bonusPct}% {kills < 100 ? '(เป้า 100)' : kills < 1000 ? '(เป้า 1,000)' : '(สูงสุด)'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {libraryTab === 'fusions' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {ALL_ELEMENT_FUSIONS.map((f) => {
              const discovered = saveData.discoveredFusions.includes(f.key);
              return (
                <div
                  key={f.key}
                  className={`p-3 rounded border ${
                    discovered ? 'gothic-card' : 'bg-[#090A10] border-stone-800/70 opacity-65'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold" style={{ color: discovered ? f.color : '#78716C' }}>
                      {discovered ? f.nameTh : 'มหาเวทย์ปริศนา'}
                    </span>
                    <span className="text-[10px] text-stone-400">
                      {ELEMENTS[f.a].shortTh} + {ELEMENTS[f.b].shortTh}
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-400 mt-1">
                    {discovered ? f.descTh : 'เล่นคลาสจอมเวทย์เพื่อเก็บออร์บธาตุทั้งสองปลดล็อกสูตรนี้'}
                  </p>
                </div>
              );
            })}
          </div>
        )}

        {libraryTab === 'stats' && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="gothic-card p-3 rounded">
                <div className="text-[11px] text-stone-400">เวลาดีที่สุด</div>
                <div className="font-mono-num text-base font-bold text-amber-200 mt-0.5">
                  {formatClock(saveData.bestTimeSeconds)}
                </div>
              </div>
              <div className="gothic-card p-3 rounded">
                <div className="text-[11px] text-stone-400">รอบที่เล่น / ชนะ</div>
                <div className="font-mono-num text-base font-bold text-emerald-300 mt-0.5">
                  {saveData.questStats.totalRuns} / {saveData.questStats.victories}
                </div>
              </div>
              <div className="gothic-card p-3 rounded">
                <div className="text-[11px] text-stone-400">สังหารบอส / Elite</div>
                <div className="font-mono-num text-base font-bold text-sky-300 mt-0.5">
                  {saveData.questStats.totalBossKills} / {saveData.questStats.totalEliteKills}
                </div>
              </div>
              <div className="gothic-card p-3 rounded">
                <div className="text-[11px] text-stone-400">คอมโบสูงสุดตลอดกาล</div>
                <div className="font-mono-num text-base font-bold text-orange-300 mt-0.5">
                  {saveData.questStats.maxComboEver.toLocaleString()}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {(Object.keys(RACES) as RaceId[]).map((rId) => {
                const r = RACES[rId];
                const xp = saveData.masteryXpByRace[rId] || 0;
                const info = getMasteryLevelInfo(xp);
                const pct = Math.min(100, Math.round((info.currentXp / Math.max(1, info.nextLevelXp)) * 100));
                return (
                  <div key={rId} className="gothic-card p-3 rounded">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-amber-100">{r.nameTh}</span>
                      <span className="font-mono-num text-amber-300">
                        Lv.{info.level} · {info.titleTh}
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-stone-900 rounded-xs overflow-hidden mt-2">
                      <div className="h-full bg-amber-400" style={{ width: `${pct}%` }} />
                    </div>
                    <div className="text-[10px] text-stone-400 mt-1 flex justify-between font-mono-num">
                      <span>EXP: {info.currentXp}/{info.nextLevelXp}</span>
                      <span>มงกุฎคำสาป: {saveData.bestCurseByRace[rId] || 0}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderTavernPanel = () => {
    if (activeBuildingLv <= 0) return renderLockedOverlay('โรงเตี๊ยม');
    const dcWonToday = saveData.dailyChallengeClaimedDate === todayKey;
    const dcRace = RACES[dailyChallenge.raceId];
    const dcStage = STAGES[dailyChallenge.stageId];

    return (
      <div className="space-y-5">
        {/* Daily Challenge */}
        <div className="p-4 rounded-md bg-gradient-to-r from-[#1A1324] to-[#11131E] border border-amber-400/45 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-amber-300">
              <Crown className="w-4 h-4" />
              <span>ชาเลนจ์ประจำวัน ({dailyChallenge.dateStr})</span>
            </div>
            <div className="text-sm font-bold text-amber-50 mt-1">
              พิชิต "{dcStage.nameTh}" ด้วย "{dcRace.nameTh}" (เปิดคำสาป Lv.{dailyChallenge.curseLevelTarget}+)
            </div>
            <p className="text-xs text-stone-300 mt-0.5">
              รางวัลเมื่อชนะครั้งแรกวันนี้: <span className="text-fuchsia-300 font-semibold">+{dailyChallenge.rewardSeals} ตราผนึก</span> และ{' '}
              <span className="text-amber-300 font-semibold">+{dailyChallenge.rewardGold} ทอง</span>
            </p>
          </div>
          {dcWonToday ? (
            <div className="px-4 py-2 rounded bg-emerald-950/50 border border-emerald-500/40 text-xs font-bold text-emerald-300 flex items-center gap-1.5 shrink-0">
              <Check className="w-4 h-4" />
              <span>สำเร็จแล้ววันนี้</span>
            </div>
          ) : (
            <button
              type="button"
              onClick={onStartDailyChallenge}
              className="gothic-btn-gold px-4 py-2 rounded text-xs font-bold shrink-0 cursor-pointer"
            >
              ออกศึกชาเลนจ์วันนี้
            </button>
          )}
        </div>

        {/* Daily Quests */}
        <div>
          <h4 className="text-xs font-semibold text-sky-300 mb-2">
            ภารกิจรายวัน (รีเซ็ตทุกวัน · วันนี้ {todayKey})
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
            {dailyQuests.map((dq) => {
              const prog = Math.min(dq.target, saveData.dailyQuestState.progress[dq.id] || 0);
              const claimed = saveData.dailyQuestState.claimed.includes(dq.id);
              const done = prog >= dq.target;
              const goldBonus = Math.round(dq.rewardGold * (activeBuildingLv >= 2 ? 1.25 : 1));
              const seBonus = dq.rewardSoulEssence + (activeBuildingLv >= 3 ? 1 : 0);

              return (
                <div key={dq.id} className="gothic-card p-3 rounded flex flex-col justify-between">
                  <div>
                    <div className="text-xs font-bold text-amber-100">{dq.titleTh}</div>
                    <div className="w-full h-1.5 bg-stone-900 rounded-xs overflow-hidden mt-2">
                      <div
                        className={done ? 'h-full bg-emerald-400' : 'h-full bg-sky-400'}
                        style={{ width: `${Math.min(100, Math.round((prog / dq.target) * 100))}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[11px] mt-1 font-mono-num">
                      <span className="text-stone-400">{prog}/{dq.target}</span>
                      <span className="text-amber-300">+{goldBonus} ทอง · +{seBonus} วิญญาณ</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    disabled={!done || claimed}
                    onClick={() => onClaimDailyQuest(dq.id)}
                    className={`mt-2.5 w-full py-1.5 rounded text-xs font-bold ${
                      claimed
                        ? 'bg-stone-900 border border-stone-800 text-emerald-400 cursor-default'
                        : done
                          ? 'gothic-btn-gold cursor-pointer'
                          : 'bg-stone-900 border border-stone-800 text-stone-500 cursor-not-allowed'
                    }`}
                  >
                    {claimed ? 'รับแล้ว' : done ? 'รับรางวัล' : 'กำลังดำเนินการ'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Unlock Quests */}
        <div>
          <h4 className="text-xs font-semibold text-fuchsia-300 mb-2">
            ภารกิจปลดล็อกถาวร ({saveData.claimedUnlockQuests.length}/{UNLOCK_QUESTS.length}) — รับ "ตราผนึก" ปลดแถวแท่นบูชา
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {UNLOCK_QUESTS.map((q) => {
              const prog = Math.min(q.target, q.getProgress(saveData));
              const claimed = saveData.claimedUnlockQuests.includes(q.id);
              const done = prog >= q.target;

              return (
                <div
                  key={q.id}
                  className={`p-3 rounded border flex flex-col justify-between ${
                    done && !claimed ? 'gothic-card-active' : 'gothic-card'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-amber-50">{q.titleTh}</span>
                      <span className="text-[11px] font-mono-num text-fuchsia-300 font-bold shrink-0">
                        +{q.rewardSeals} ตรา · +{q.rewardGold} ทอง
                      </span>
                    </div>
                    <p className="text-[11px] text-stone-400 mt-0.5">{q.descTh}</p>
                    <div className="w-full h-1.5 bg-stone-900 rounded-xs overflow-hidden mt-2">
                      <div
                        className={done ? 'h-full bg-emerald-400' : 'h-full bg-amber-400'}
                        style={{ width: `${Math.min(100, Math.round((prog / q.target) * 100))}%` }}
                      />
                    </div>
                  </div>
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <span className="font-mono-num text-[11px] text-stone-400">
                      {prog.toLocaleString()} / {q.target.toLocaleString()}
                    </span>
                    <button
                      type="button"
                      disabled={!done || claimed}
                      onClick={() => onClaimUnlockQuest(q.id)}
                      className={`px-3 py-1 rounded text-[11px] font-bold ${
                        claimed
                          ? 'bg-stone-900 border border-stone-800 text-emerald-400 cursor-default'
                          : done
                            ? 'gothic-btn-gold cursor-pointer'
                            : 'bg-stone-900 border border-stone-800 text-stone-500 cursor-not-allowed'
                      }`}
                    >
                      {claimed ? 'รับตราแล้ว' : done ? 'รับตราผนึก!' : 'ยังไม่ครบ'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const renderApothecaryPanel = () => {
    if (activeBuildingLv <= 0) return renderLockedOverlay('ร้านยา');
    return (
      <div className="space-y-3">
        <div className="text-xs text-stone-300 bg-[#0A0B12] px-4 py-2.5 rounded border border-emerald-500/20 flex flex-wrap items-center justify-between gap-2">
          <span>เลือกพกยาติดตัวได้ 1 ชนิดก่อนลงด่าน — ใช้ในสมรภูมิด้วยปุ่ม <strong className="text-emerald-300">Q</strong></span>
          {saveData.selectedPotion && (
            <span className="text-emerald-300 font-semibold">
              พกติดตัวอยู่: {POTIONS[saveData.selectedPotion].nameTh} (คงเหลือ {saveData.ownedPotions[saveData.selectedPotion] || 0} ขวด)
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {POTION_ORDER.map((pId) => {
            const def = POTIONS[pId];
            const unlocked = activeBuildingLv >= def.requiredApothecaryLv;
            const qty = saveData.ownedPotions[pId] || 0;
            const equipped = saveData.selectedPotion === pId;
            const canBuy = unlocked && saveData.gold >= def.cost;

            return (
              <div
                key={pId}
                className={`p-3.5 rounded-md border flex flex-col justify-between ${
                  equipped ? 'gothic-card-active' : 'gothic-card'
                } ${!unlocked ? 'opacity-60' : ''}`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-bold" style={{ color: def.color }}>
                      {def.nameTh}
                    </span>
                    <span className="font-mono-num text-xs text-stone-300">มี {qty} ขวด</span>
                  </div>
                  <p className="text-xs text-stone-300 mt-1 leading-relaxed">{def.descTh}</p>
                  {!unlocked && (
                    <p className="text-[11px] text-rose-300 mt-1">
                      ต้องการร้านยา Lv.{def.requiredApothecaryLv}
                    </p>
                  )}
                </div>

                <div className="mt-3 pt-2.5 border-t border-stone-800 flex items-center gap-2">
                  <button
                    type="button"
                    disabled={!canBuy}
                    onClick={() => onBuyPotion(pId)}
                    className={`flex-1 py-1.5 rounded text-xs font-mono-num font-bold ${
                      canBuy
                        ? 'gothic-btn-gold cursor-pointer'
                        : 'bg-stone-900 border border-stone-800 text-stone-500 cursor-not-allowed'
                    }`}
                  >
                    ปรุง ({def.cost} ทอง)
                  </button>
                  <button
                    type="button"
                    disabled={!unlocked || (qty <= 0 && !equipped)}
                    onClick={() => onSelectPotion(equipped ? null : pId)}
                    className={`px-3 py-1.5 rounded text-xs font-semibold ${
                      equipped
                        ? 'gothic-btn-iron text-emerald-300 cursor-pointer'
                        : qty > 0 && unlocked
                          ? 'gothic-btn-iron text-amber-200 cursor-pointer'
                          : 'bg-stone-900 border border-stone-800 text-stone-600 cursor-not-allowed'
                    }`}
                  >
                    {equipped ? 'ถอดออก' : 'พกเข้าด่าน'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderAltarPanel = () => {
    if (activeBuildingLv <= 0) return renderLockedOverlay('แท่นบูชาจันทร์มืด');
    const spentSe = getAltarSpentSoulEssence(saveData);
    const canReset = spentSe > 0 && saveData.sealMarks >= 1;

    return (
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 bg-[#0A0B12] px-4 py-2.5 rounded border border-purple-500/25 text-xs">
          <span className="text-stone-300">
            เลือกสาย <strong className="text-amber-300">A</strong> หรือ{' '}
            <strong className="text-sky-300">B</strong> ในแต่ละแถว — อัปเกรดด้วย{' '}
            <strong className="text-cyan-300">แก่นวิญญาณ</strong> · ปลดแถวลึกด้วย{' '}
            <strong className="text-fuchsia-300">ตราผนึก</strong>
          </span>
          <button
            type="button"
            disabled={!canReset}
            onClick={onResetAltar}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold ${
              canReset
                ? 'gothic-btn-iron text-fuchsia-300 cursor-pointer'
                : 'bg-stone-900 border border-stone-800 text-stone-600 cursor-not-allowed'
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>รีเซ็ตคืน {spentSe} วิญญาณ (ใช้ 1 ตราผนึก)</span>
          </button>
        </div>

        <div className="space-y-2.5">
          {ALTAR_ROWS.map((row) => {
            const isUnlocked =
              !row.requiresSealUnlock || saveData.unlockedAltarRows.includes(row.id);
            const state = saveData.talents[row.id] || { rank: 0, branch: 'A' };
            const canUnlockRow = !isUnlocked && saveData.sealMarks >= row.sealUnlockCost;
            const canUpgrade = state.rank < row.maxRank && saveData.soulEssence >= row.seCostPerRank;

            return (
              <div key={row.id} className="gothic-card p-3.5 rounded-md">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono-num text-xs font-bold px-2 py-0.5 rounded bg-purple-950/60 border border-purple-500/35 text-purple-200">
                      แถวที่ {row.rowNum}
                    </span>
                    <span className="font-mono-num text-xs text-stone-300">
                      ระดับ {state.rank}/{row.maxRank}
                    </span>
                  </div>
                  {!isUnlocked ? (
                    <button
                      type="button"
                      disabled={!canUnlockRow}
                      onClick={() => onUnlockAltarRow(row.id)}
                      className={`px-3 py-1 rounded text-xs font-bold font-mono-num ${
                        canUnlockRow
                          ? 'gothic-btn-gold cursor-pointer'
                          : 'bg-stone-900 border border-stone-800 text-stone-500 cursor-not-allowed'
                      }`}
                    >
                      ปลดล็อกแถว ({row.sealUnlockCost} ตราผนึก)
                    </button>
                  ) : (
                    <span className="text-[11px] font-mono-num text-cyan-300">
                      {state.rank >= row.maxRank ? 'เต็มขั้นแล้ว' : `ค่าอัปเกรด ${row.seCostPerRank} แก่นวิญญาณ`}
                    </span>
                  )}
                </div>

                <div className={`grid grid-cols-1 md:grid-cols-2 gap-2.5 ${!isUnlocked ? 'opacity-45 pointer-events-none' : ''}`}>
                  {(['A', 'B'] as AltarBranch[]).map((branch) => {
                    const info = branch === 'A' ? row.branchA : row.branchB;
                    const isSelected = state.branch === branch && state.rank > 0;
                    const accentBorder =
                      branch === 'A'
                        ? isSelected
                          ? 'border-amber-400 bg-amber-500/10'
                          : 'border-stone-800 bg-[#0A0B12]'
                        : isSelected
                          ? 'border-sky-400 bg-sky-500/10'
                          : 'border-stone-800 bg-[#0A0B12]';

                    return (
                      <div key={branch} className={`p-3 rounded border flex flex-col justify-between ${accentBorder}`}>
                        <div>
                          <div className="flex items-center justify-between gap-2">
                            <span className={`text-xs font-bold ${branch === 'A' ? 'text-amber-300' : 'text-sky-300'}`}>
                              สาย {branch}: {info.nameTh}
                            </span>
                            {isSelected && (
                              <span className="text-[10px] font-bold text-emerald-300">กำลังใช้งาน</span>
                            )}
                          </div>
                          <p className="text-[11px] text-stone-300 mt-1 leading-relaxed">{info.descTh}</p>
                        </div>

                        <div className="mt-2.5 flex items-center gap-2">
                          {state.rank > 0 && state.branch !== branch && (
                            <button
                              type="button"
                              onClick={() => onSelectAltarBranch(row.id, branch)}
                              className="gothic-btn-iron px-2.5 py-1 rounded text-[11px] font-semibold text-amber-200 cursor-pointer"
                            >
                              สลับมาสาย {branch}
                            </button>
                          )}
                          {state.rank < row.maxRank && (
                            <button
                              type="button"
                              disabled={!canUpgrade}
                              onClick={() => onUpgradeAltarRow(row.id, branch)}
                              className={`px-3 py-1 rounded text-[11px] font-mono-num font-bold ${
                                canUpgrade
                                  ? 'gothic-btn-gold cursor-pointer'
                                  : 'bg-stone-900 border border-stone-800 text-stone-500 cursor-not-allowed'
                              }`}
                            >
                              {state.rank === 0 ? `ปลุกพลังสาย ${branch}` : `อัปขั้น ${state.rank + 1}`} ({row.seCostPerRank} วิญญาณ)
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderSoulTowerPanel = () => {
    if (activeBuildingLv <= 0) return renderLockedOverlay('หอคอยวิญญาณ');
    const prod = getSoulTowerProduction(activeBuildingLv);
    const elapsedHrs = Math.min(
      prod.maxHours,
      Math.max(0, (nowMs - (saveData.soulTowerLastClaimAt || nowMs)) / 3600000)
    );
    const maxCapSe = Math.floor(prod.perHour * prod.maxHours);

    return (
      <div className="p-6 rounded-md bg-[#0A0B12] border border-cyan-500/30 flex flex-col items-center text-center">
        <Gem className="w-12 h-12 text-cyan-300 mb-3" />
        <h4 className="font-display text-xl font-bold text-cyan-200">
          แก่นวิญญาณพร้อมเก็บเกี่ยว
        </h4>
        <div className="font-mono-num text-4xl font-bold text-cyan-300 mt-2">
          {pendingSe} <span className="text-base text-stone-400">/ {maxCapSe}</span>
        </div>
        <p className="text-xs text-stone-400 mt-2">
          อัตราผลิตปัจจุบัน: <strong className="text-cyan-200">{prod.perHour} แก่นวิญญาณ/ชั่วโมง</strong> ·
          สะสมต่อเนื่องแล้ว {elapsedHrs.toFixed(1)} / {prod.maxHours} ชั่วโมง
        </p>
        <button
          type="button"
          disabled={pendingSe <= 0}
          onClick={onClaimSoulTower}
          className={`mt-5 px-6 py-2.5 rounded text-sm font-bold ${
            pendingSe > 0
              ? 'gothic-btn-gold cursor-pointer'
              : 'bg-stone-900 border border-stone-800 text-stone-500 cursor-not-allowed'
          }`}
        >
          {pendingSe > 0 ? `เก็บเกี่ยว +${pendingSe} แก่นวิญญาณ` : 'รอหอคอยผลิตแก่นวิญญาณ (อย่างน้อย 1 ชิ้น)'}
        </button>
      </div>
    );
  };

  const renderCurseGatePanel = () => {
    if (activeBuildingLv <= 0) return renderLockedOverlay('ประตูคำสาป');
    const altar5ABonusPct =
      saveData.talents.row5?.branch === 'A' ? (saveData.talents.row5?.rank || 0) * 10 : 0;
    const rewardPct = totalCurseLevel * (10 + altar5ABonusPct);

    return (
      <div className="space-y-4">
        <div className="p-4 rounded-md bg-rose-950/25 border border-rose-500/35 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-sm font-bold text-rose-200">
              ระดับคำสาปรวม: <span className="font-mono-num text-lg text-amber-300">Lv.{totalCurseLevel}</span>
            </div>
            <p className="text-xs text-stone-300 mt-0.5">
              โบนัสรางวัลในด่าน: <strong className="text-amber-300">+{rewardPct}% ทอง &amp; แก่นวิญญาณ</strong>
              {altar5ABonusPct > 0 ? ` (รวมพรแท่นบูชา +${altar5ABonusPct}%/แต้ม)` : ''}
            </p>
          </div>

          <button
            type="button"
            disabled={totalCurseLevel <= 0}
            onClick={onClearCurses}
            className={`px-3 py-1.5 rounded text-xs font-semibold ${
              totalCurseLevel > 0
                ? 'gothic-btn-iron text-rose-300 cursor-pointer'
                : 'bg-stone-900 border border-stone-800 text-stone-600 cursor-not-allowed'
            }`}
          >
            ล้างคำสาปทั้งหมด (Lv.0)
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {CURSES.map((c) => {
            const rank = saveData.activeCurses[c.id] || 0;
            return (
              <div
                key={c.id}
                className={`p-3 rounded border flex flex-col justify-between ${
                  rank > 0 ? 'border-rose-500/55 bg-rose-950/20' : 'gothic-card'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-amber-50">{c.nameTh}</span>
                    <span className="font-mono-num text-[11px] text-rose-300">
                      +{c.pointsPerRank} แต้ม/ขั้น
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-400 mt-1">{c.effectTh}</p>
                </div>

                <div className="mt-2.5 pt-2 border-t border-stone-800 flex items-center justify-between">
                  <span className="font-mono-num text-xs text-stone-300">
                    ขั้น {rank}/{c.maxRank}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      disabled={rank <= 0}
                      onClick={() => onSetCurseRank(c.id, Math.max(0, rank - 1))}
                      className="gothic-btn-iron p-1 rounded disabled:opacity-35 cursor-pointer"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={rank >= c.maxRank}
                      onClick={() => onSetCurseRank(c.id, Math.min(c.maxRank, rank + 1))}
                      className="gothic-btn-iron p-1 rounded disabled:opacity-35 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Race Curse Crowns */}
        <div className="p-3.5 rounded bg-[#0A0B12] border border-amber-500/20">
          <div className="text-xs font-semibold text-amber-300 mb-2">
            มงกุฎเกียรติยศคำสาปแยกตามเผ่า (ผ่านด่านด้วย Curse Lv.10 / Lv.20 เพื่อปลดสกิน)
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {(Object.keys(RACES) as RaceId[]).map((rId) => (
              <div key={rId} className="gothic-card p-2 rounded flex items-center justify-between text-xs">
                <span className="text-stone-300 truncate">{RACES[rId].nameTh}</span>
                <span className="font-mono-num font-bold text-amber-300 flex items-center gap-1">
                  <Crown className="w-3 h-3" />
                  {saveData.bestCurseByRace[rId] || 0}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderHatcheryPanel = () => {
    if (activeBuildingLv <= 0) return renderLockedOverlay('โรงเพาะพันธุ์');
    const eggCost = getPetEggCost(activeBuildingLv);
    const allOwned = PET_IDS.every((p) => saveData.ownedPets.includes(p));
    const canBuyEgg = saveData.gold >= eggCost;

    return (
      <div className="space-y-4">
        <div className="p-4 rounded-md bg-[#0A0B12] border border-pink-500/30 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-sm font-bold text-pink-200">
              ฟักไข่สัตว์เลี้ยงคู่ใจ ({saveData.ownedPets.length}/{PET_IDS.length} สายพันธุ์)
            </div>
            <p className="text-xs text-stone-400 mt-0.5">
              พกสัตว์เลี้ยงเข้าสมรภูมิได้ 1 ตัว
              {activeBuildingLv >= 2
                ? ` · โบนัสโรงเพาะพันธุ์ Lv.${activeBuildingLv}: ประสิทธิภาพสกิล +${activeBuildingLv >= 3 ? '50%' : '25%'}`
                : ''}
            </p>
          </div>
          <button
            type="button"
            disabled={!canBuyEgg}
            onClick={onHatchPetEgg}
            className={`px-4 py-2 rounded text-xs font-bold font-mono-num ${
              canBuyEgg
                ? 'gothic-btn-gold cursor-pointer'
                : 'bg-stone-900 border border-stone-800 text-stone-500 cursor-not-allowed'
            }`}
          >
            {allOwned ? `สุ่มไข่โบนัสวิญญาณ (${eggCost} ทอง)` : `ฟักไข่สัตว์เลี้ยง (${eggCost} ทอง)`}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {PET_IDS.map((petId) => {
            const def = PETS[petId];
            const owned = saveData.ownedPets.includes(petId);
            const equipped = saveData.equippedPet === petId;

            return (
              <div
                key={petId}
                className={`p-4 rounded-md border flex flex-col justify-between ${
                  equipped ? 'gothic-card-active' : 'gothic-card'
                } ${!owned ? 'opacity-55' : ''}`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-bold" style={{ color: def.color }}>
                      {def.nameTh}
                    </span>
                    <span className="text-[11px] text-stone-400">
                      {owned ? 'ครอบครองแล้ว' : 'ยังไม่ฟัก'}
                    </span>
                  </div>
                  <p className="text-xs text-stone-300 mt-1.5 leading-relaxed">{def.descTh}</p>
                </div>

                <div className="mt-3 pt-2.5 border-t border-stone-800">
                  <button
                    type="button"
                    disabled={!owned}
                    onClick={() => onEquipPet(equipped ? null : petId)}
                    className={`w-full py-1.5 rounded text-xs font-bold ${
                      !owned
                        ? 'bg-stone-900 border border-stone-800 text-stone-600 cursor-not-allowed'
                        : equipped
                          ? 'gothic-btn-iron text-pink-300 cursor-pointer'
                          : 'gothic-btn-gold cursor-pointer'
                    }`}
                  >
                    {!owned ? 'รอฟักไข่' : equipped ? 'ถอดสัตว์เลี้ยง' : 'พาเข้าสมรภูมิ'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderMapHub = () => (
    <div className="space-y-4">
      <div className="relative w-full h-[380px] sm:h-[420px] rounded-md overflow-hidden border border-amber-500/25 bg-[#090B12]">
        {/* Atmospheric Campsite Night Ground & Paths */}
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 w-full h-full pointer-events-none">
          <defs>
            <radialGradient id="campTorch" cx="50%" cy="48%" r="45%">
              <stop offset="0%" stopColor="rgba(245, 158, 11, 0.16)" />
              <stop offset="55%" stopColor="rgba(30, 27, 46, 0.25)" />
              <stop offset="100%" stopColor="rgba(8, 9, 14, 0.9)" />
            </radialGradient>
          </defs>
          <rect width="100" height="100" fill="url(#campTorch)" />
          {/* Dirt trails connecting buildings to central campfire/curse gate */}
          {CAMP_BUILDINGS.filter((b) => b.id !== 'curse_gate').map((b) => (
            <line
              key={b.id}
              x1={b.xPct}
              y1={b.yPct}
              x2={50}
              y2={48}
              stroke="rgba(217, 119, 6, 0.22)"
              strokeWidth="0.6"
              strokeDasharray="1.5 1.5"
            />
          ))}
        </svg>

        {CAMP_BUILDINGS.map((b) => {
          const lv = saveData.buildings[b.id] || 0;
          const lockedByStage =
            b.requiresStage1Clear &&
            lv <= 0 &&
            !saveData.questStats.stage1Cleared &&
            saveData.reaperKills <= 0;
          const badge =
            b.id === 'tavern' && claimableUnlockCount + claimableDailyCount > 0
              ? `${claimableUnlockCount + claimableDailyCount}`
              : b.id === 'soul_tower' && pendingSe > 0
                ? `+${pendingSe}`
                : null;

          return (
            <button
              key={b.id}
              type="button"
              onClick={() => setActiveTab(b.id)}
              style={{ left: `${b.xPct}%`, top: `${b.yPct}%` }}
              className={`-translate-x-1/2 -translate-y-1/2 absolute px-3 py-2 rounded-md border text-left transition-transform hover:scale-105 cursor-pointer min-w-[122px] sm:min-w-[144px] ${
                lv > 0
                  ? 'bg-[#121420]/95 border-amber-500/45 shadow-lg'
                  : 'bg-[#0B0C14]/90 border-stone-700/70 opacity-85'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span style={{ color: lv > 0 ? b.accentColor : '#78716C' }}>
                    {lockedByStage ? <Lock className="w-3.5 h-3.5" /> : BUILDING_ICONS[b.id]}
                  </span>
                  <span className="text-xs font-bold text-amber-50 truncate">{b.nameTh}</span>
                </div>
                <span className="font-mono-num text-[10px] font-semibold text-amber-300 shrink-0">
                  {lv > 0 ? `Lv.${lv}` : lockedByStage ? 'ล็อก' : `${b.unlockCostGold > 0 ? b.unlockCostGold : `${b.unlockCostSeals} ตรา`}`}
                </span>
              </div>
              {badge && (
                <div className="mt-1 text-[10px] font-mono-num font-bold text-emerald-300">
                  พร้อมรับ: {badge}
                </div>
              )}
            </button>
          );
        })}
      </div>

      <p className="text-xs text-stone-400 text-center">
        คลิกเลือกอาคารบนแผนผังแคมป์เพื่อก่อสร้าง อัปเกรด หรือใช้งานระบบถาวรทั้งหมด
      </p>
    </div>
  );

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/84 backdrop-blur-xs p-3 sm:p-4">
      <div className="gothic-panel w-full max-w-6xl h-[92vh] flex flex-col rounded-lg overflow-hidden">
        {/* Top Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 border-b border-amber-500/25 bg-[#0A090F]/85">
          <div>
            <h2 className="font-display text-lg sm:text-xl font-bold text-amber-200 tracking-wide">
              แคมป์ผู้รอดชีวิต · SURVIVOR&apos;S CAMP
            </h2>
            <p className="text-[11px] text-stone-400">
              สร้างแคมป์ 9 อาคาร · ตีบวกอุปกรณ์ถาวร · แท่นบูชาจันทร์มืด · ประตูคำสาป
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="gothic-hud-box flex items-center gap-1.5 px-2.5 py-1 rounded text-amber-300 font-mono-num text-xs font-bold">
              <Coins className="w-3.5 h-3.5 text-amber-400" />
              <span>{saveData.gold.toLocaleString()}</span>
            </div>
            <div className="gothic-hud-box flex items-center gap-1.5 px-2.5 py-1 rounded text-cyan-300 font-mono-num text-xs font-bold border-cyan-500/35">
              <Gem className="w-3.5 h-3.5 text-cyan-400" />
              <span>{saveData.soulEssence.toLocaleString()}</span>
            </div>
            <div className="gothic-hud-box flex items-center gap-1.5 px-2.5 py-1 rounded text-fuchsia-300 font-mono-num text-xs font-bold border-fuchsia-500/35">
              <Award className="w-3.5 h-3.5 text-fuchsia-400" />
              <span>{saveData.sealMarks.toLocaleString()} ตรา</span>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="ปิด"
              className="gothic-btn-iron p-2 rounded text-stone-300 hover:text-amber-200 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Navigation Tab Bar */}
        <div className="px-4 py-2 border-b border-amber-500/15 bg-[#0D0E16] flex items-center gap-1.5 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('map')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === 'map' ? 'gothic-btn-gold' : 'gothic-btn-iron text-stone-300'
            }`}
          >
            <MapIcon className="w-3.5 h-3.5" />
            <span>แผนผังแคมป์</span>
          </button>

          {CAMP_BUILDINGS.map((b) => {
            const lv = saveData.buildings[b.id] || 0;
            const active = activeTab === b.id;
            return (
              <button
                key={b.id}
                type="button"
                onClick={() => setActiveTab(b.id)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer ${
                  active
                    ? 'gothic-btn-gold'
                    : lv > 0
                      ? 'gothic-btn-iron text-stone-200'
                      : 'bg-stone-900/70 border border-stone-800 text-stone-500 hover:text-stone-300'
                }`}
              >
                <span style={{ color: active ? '#111827' : lv > 0 ? b.accentColor : '#78716C' }}>
                  {BUILDING_ICONS[b.id]}
                </span>
                <span>{b.nameTh}</span>
                {lv > 0 && (
                  <span className="font-mono-num text-[10px] opacity-80">Lv.{lv}</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5">
          {activeTab !== 'map' && renderBuildingHeaderCard()}
          {activeTab === 'map' && renderMapHub()}
          {activeTab === 'training' && renderTrainingPanel()}
          {activeTab === 'blacksmith' && renderBlacksmithPanel()}
          {activeTab === 'library' && renderLibraryPanel()}
          {activeTab === 'tavern' && renderTavernPanel()}
          {activeTab === 'apothecary' && renderApothecaryPanel()}
          {activeTab === 'altar' && renderAltarPanel()}
          {activeTab === 'soul_tower' && renderSoulTowerPanel()}
          {activeTab === 'curse_gate' && renderCurseGatePanel()}
          {activeTab === 'hatchery' && renderHatcheryPanel()}
        </div>
      </div>
    </div>
  );
};
