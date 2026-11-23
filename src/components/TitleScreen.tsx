import React, { useEffect, useState } from 'react';
import {
  Award,
  Bot,
  Coins,
  Crown,
  FlaskConical,
  Gem,
  Lock,
  PawPrint,
  Play,
  Shield,
  Skull,
  Sparkles,
  Volume2,
  VolumeX,
} from 'lucide-react';
import {
  CATEGORY_LABELS_TH,
  ELEMENT_IDS,
  ELEMENTS,
  formatClock,
  getClassesForRace,
  getElementFusion,
  RACES,
  STAGES,
  WEAPONS,
} from '../game/data';
import {
  computeCurseLevel,
  computePendingSoulEssence,
  getDailyChallengeForDate,
  getLocalDateKey,
  getMasteryLevelInfo,
  PETS,
  POTIONS,
  RACE_SKINS,
  UNLOCK_QUESTS,
} from '../game/metaData';
import {
  AudioVolumeSettings,
  BotMode,
  CampBuildingId,
  RaceClassId,
  RaceId,
  RunPace,
  SaveData,
  StageId,
  WeaponId,
} from '../game/types';
import { AudioSettingsPopoverButton } from './AudioSettingsPanel';
import { TitleEmblemSvg, WeaponIcon } from './GameIcons';

interface TitleScreenProps {
  saveData: SaveData;
  selectedRace: RaceId;
  selectedStage: StageId;
  selectedWeapon: WeaponId;
  selectedPace: RunPace;
  botMode: BotMode;
  botTargetClass: RaceClassId | 'auto';
  onSelectRace: (race: RaceId) => void;
  onSelectStage: (stage: StageId) => void;
  onSelectWeapon: (weapon: WeaponId) => void;
  onSelectPace: (pace: RunPace) => void;
  onSelectBotMode: (mode: BotMode) => void;
  onSelectBotTargetClass: (target: RaceClassId | 'auto') => void;
  onUnlockStage: (stage: StageId) => void;
  onOpenShop: (initialBuilding?: CampBuildingId | 'map') => void;
  onSelectSkin: (raceId: RaceId, skinId: string) => void;
  onStartRun: () => void;
  onStartDailyChallenge: () => void;
  onToggleMute: () => void;
  onChangeVolumes: (patch: Partial<AudioVolumeSettings>) => void;
}

const STARTER_OPTIONS: WeaponId[] = [
  'banana',
  'katana',
  'spear',
  'axe',
  'dagger',
  'cat',
  'bird',
  'wand',
  'laser',
  'frostnova',
  'meteor',
  'watergun',
  'shield',
  'garlic',
  'chain',
  'totem',
];

const MAGE_CORE_FORMULAS = [
  ['fire', 'wind'],
  ['water', 'wind'],
  ['earth', 'stone'],
  ['dark', 'light'],
] as const;

export const TitleScreen: React.FC<TitleScreenProps> = ({
  saveData,
  selectedRace,
  selectedStage,
  selectedWeapon,
  selectedPace,
  botMode,
  botTargetClass,
  onSelectRace,
  onSelectStage,
  onSelectWeapon,
  onSelectPace,
  onSelectBotMode,
  onSelectBotTargetClass,
  onUnlockStage,
  onOpenShop,
  onSelectSkin,
  onStartRun,
  onStartDailyChallenge,
  onToggleMute,
  onChangeVolumes,
}) => {
  const race = RACES[selectedRace];
  const raceClasses = getClassesForRace(selectedRace);
  const activeWeaponDef = WEAPONS[selectedWeapon];
  const [portraitFailed, setPortraitFailed] = useState<Record<string, boolean>>({});
  const [backdropFailed, setBackdropFailed] = useState(false);

  const pendingSe = computePendingSoulEssence(saveData);
  const claimableUnlockQuests = UNLOCK_QUESTS.filter(
    (q) => !saveData.claimedUnlockQuests.includes(q.id) && q.getProgress(saveData) >= q.target
  ).length;
  const campAlerts = (pendingSe > 0 ? 1 : 0) + claimableUnlockQuests;
  const curseLevel = computeCurseLevel(saveData.activeCurses);
  const equippedGearCount = Object.values(saveData.equippedGear).filter(Boolean).length;
  const equippedPotionQty = saveData.selectedPotion
    ? saveData.ownedPotions[saveData.selectedPotion] || 0
    : 0;
  const activeSkinId = saveData.activeSkinByRace[selectedRace] || 'default';
  const raceMastery = getMasteryLevelInfo(saveData.masteryXpByRace[selectedRace] || 0);
  const todayKey = getLocalDateKey();
  const dailyChallenge = getDailyChallengeForDate(todayKey);
  const dcDoneToday = saveData.dailyChallengeClaimedDate === todayKey;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        const tag = (e.target as HTMLElement)?.tagName;
        if (tag === 'BUTTON' || tag === 'INPUT') return;
        e.preventDefault();
        onStartRun();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onStartRun]);

  return (
    <div className="relative w-screen h-screen overflow-y-auto bg-[#08090E] text-[#EDE6D6]">
      {/* Key Art Backdrop with measured dark medieval vignette */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        {!backdropFailed && (
          <img
            src="/src/assets/images/title_key_art_1795169751208.jpg"
            alt="สมรภูมิพิภพต้องสาป"
            referrerPolicy="no-referrer"
            onError={() => setBackdropFailed(true)}
            className="w-full h-full object-cover object-center opacity-40 saturate-90"
          />
        )}
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse at 50% 35%, rgba(16, 15, 22, 0.55) 0%, rgba(8, 9, 14, 0.92) 72%, rgba(7, 8, 12, 0.98) 100%)',
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#08090E]/85 via-transparent to-[#08090E]" />
      </div>

      {/* Main Centered Sanctuary Container */}
      <div className="relative z-10 max-w-7xl mx-auto min-h-screen flex flex-col justify-between px-4 py-4 sm:px-8 sm:py-6">
        {/* Top Bar — Clean 3-Zone Header */}
        <header className="flex items-center justify-between gap-6 pb-4 border-b border-amber-500/20">
          {/* Zone 1: Brand Lockup */}
          <div className="flex items-center gap-3 min-w-0">
            <TitleEmblemSvg className="w-10 h-10 sm:w-11 sm:h-11 shrink-0" />
            <div className="min-w-0">
              <h1 className="font-display text-lg sm:text-2xl font-bold tracking-[0.08em] text-amber-100 whitespace-nowrap truncate">
                ECLIPSE SURVIVORS
              </h1>
              <p className="text-xs text-stone-400 whitespace-nowrap">พิภพต้องสาป</p>
            </div>
          </div>

          {/* Zone 2: Quiet Unboxed Career Record */}
          <div className="hidden md:flex items-center gap-3 text-xs text-stone-400 font-mono-num whitespace-nowrap">
            <span>
              สถิติดีสุด <strong className="text-stone-200 font-semibold">{formatClock(saveData.bestTimeSeconds)}</strong>
            </span>
            <span aria-hidden="true" className="text-amber-500/40">
              ·
            </span>
            <span>
              ยมทูตที่โค่น <strong className="text-stone-200 font-semibold">{saveData.reaperKills.toLocaleString()}</strong>
            </span>
            <span aria-hidden="true" className="text-amber-500/40">
              ·
            </span>
            <span>
              สังหารสะสม <strong className="text-stone-200 font-semibold">{saveData.totalKills.toLocaleString()}</strong>
            </span>
          </div>

          {/* Zone 3: 3-Currency Treasury & Camp CTA */}
          <div className="flex items-center gap-2.5 sm:gap-3 shrink-0 flex-wrap justify-end">
            <div className="flex items-center gap-1.5 text-sm font-mono-num font-bold text-amber-300 whitespace-nowrap" title="เหรียญทอง">
              <Coins className="w-4 h-4 text-amber-400 shrink-0" />
              <span>{saveData.gold.toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-1 text-sm font-mono-num font-bold text-cyan-300 whitespace-nowrap" title="แก่นวิญญาณ">
              <Gem className="w-4 h-4 text-cyan-400 shrink-0" />
              <span>{saveData.soulEssence.toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-1 text-sm font-mono-num font-bold text-fuchsia-300 whitespace-nowrap" title="ตราผนึก">
              <Award className="w-4 h-4 text-fuchsia-400 shrink-0" />
              <span>{saveData.sealMarks.toLocaleString()}</span>
            </div>

            <button
              type="button"
              onClick={() => onOpenShop('map')}
              className="gothic-btn-iron flex items-center gap-2 px-3.5 py-2 rounded text-xs sm:text-sm font-semibold whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-amber-400"
            >
              <Shield className="w-4 h-4 text-amber-400 shrink-0" />
              <span>แคมป์ผู้รอดชีวิต</span>
              {campAlerts > 0 && (
                <span className="font-mono-num text-[11px] px-1.5 py-0.5 rounded bg-emerald-500/25 border border-emerald-400/50 text-emerald-200">
                  +{campAlerts}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={onToggleMute}
              aria-label={saveData.muted ? 'เปิดเสียง' : 'ปิดเสียง'}
              title={saveData.muted ? 'เปิดเสียง' : 'ปิดเสียง'}
              className="gothic-btn-iron p-2.5 rounded text-amber-200/85 shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-amber-400"
            >
              {saveData.muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>

            <AudioSettingsPopoverButton
              muted={saveData.muted}
              volumes={{
                masterVolume: saveData.masterVolume,
                bgmVolume: saveData.bgmVolume,
                sfxVolume: saveData.sfxVolume,
              }}
              onToggleMute={onToggleMute}
              onChangeVolumes={onChangeVolumes}
              buttonClassName="gothic-btn-iron p-2.5 rounded text-amber-200/85 shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-amber-400"
            />
          </div>
        </header>

        {/* Center Medieval War-Table Grid */}
        <main className="my-5 grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch flex-1">
          {/* Column 1 (3 cols): Lineage Switcher & Weapon/Element Arsenal */}
          <section className="lg:col-span-4 flex flex-col justify-between gap-4">
            {/* Race Selector List */}
            <div>
              <h2 className="font-display text-sm font-bold tracking-wide text-amber-200/90 mb-2.5">
                เลือกสายเลือดนักรบ
              </h2>
              <div className="grid grid-cols-2 lg:grid-cols-1 gap-2">
                {(Object.keys(RACES) as RaceId[]).map((id) => {
                  const r = RACES[id];
                  const active = selectedRace === id;
                  const bestCurse = saveData.bestCurseByRace[id] || 0;
                  const rMast = getMasteryLevelInfo(saveData.masteryXpByRace[id] || 0);
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => onSelectRace(id)}
                      className={`group flex items-center gap-3 p-2.5 rounded text-left cursor-pointer focus-visible:outline-2 focus-visible:outline-amber-400 ${
                        active ? 'gothic-card-active' : 'gothic-card'
                      }`}
                    >
                      <div className="relative w-12 h-12 rounded-sm overflow-hidden bg-[#090A10] border border-amber-500/25 shrink-0">
                        {!portraitFailed[id] ? (
                          <img
                            src={r.portraitPath}
                            alt={r.nameTh}
                            referrerPolicy="no-referrer"
                            onError={() =>
                              setPortraitFailed((prev) => ({ ...prev, [id]: true }))
                            }
                            className="w-full h-full object-cover object-top"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center font-display text-sm text-amber-300">
                            {r.nameEn[0]}
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-display text-sm font-bold text-amber-50 truncate">
                            {r.nameTh}
                          </span>
                          <div className="flex items-center gap-1.5 shrink-0">
                            {bestCurse > 0 && (
                              <span
                                className="inline-flex items-center gap-0.5 font-mono-num text-[10px] text-rose-300"
                                title={`มงกุฎคำสาปสูงสุด: Lv.${bestCurse}`}
                              >
                                <Crown className="w-3 h-3" />
                                {bestCurse}
                              </span>
                            )}
                            <span
                              className="w-2 h-2 rotate-45 transition-opacity"
                              style={{
                                backgroundColor: r.accentColor,
                                opacity: active ? 1 : 0.35,
                              }}
                            />
                          </div>
                        </div>
                        <div className="text-[11px] text-stone-400 truncate mt-0.5">
                          Mastery Lv.{rMast.level} · HP {r.baseHp} · ไว {r.baseSpeed}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-amber-500/15" />

            {/* Arsenal Picker OR Mage Elemental Grimoire */}
            {race.usesElements ? (
              <div className="flex-1 flex flex-col justify-between gap-3">
                <div>
                  <div className="flex items-baseline justify-between gap-2 mb-2">
                    <h2 className="font-display text-sm font-bold tracking-wide text-amber-200/90">
                      ศิลาธาตุทั้ง 8
                    </h2>
                    <span className="text-[11px] text-sky-300/90">ผสาน 36 มหาเวทย์</span>
                  </div>
                  <div className="grid grid-cols-4 gap-1.5">
                    {ELEMENT_IDS.map((elId) => {
                      const el = ELEMENTS[elId];
                      return (
                        <div
                          key={elId}
                          className="flex items-center gap-1.5 px-2 py-1.5 rounded-sm bg-[#0D0E14] border border-stone-800/80"
                        >
                          <span
                            className="w-2 h-2 rotate-45 shrink-0"
                            style={{ backgroundColor: el.color }}
                          />
                          <span className="text-[11px] font-medium text-stone-200 truncate">
                            {el.nameTh}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-1.5 pt-2 border-t border-stone-800/80">
                  <div className="text-[11px] font-semibold text-amber-300/90">
                    ตัวอย่างสูตรตรีธาตุ
                  </div>
                  <div className="space-y-1">
                    {MAGE_CORE_FORMULAS.map(([a, b]) => {
                      const fusion = getElementFusion(a, b);
                      return (
                        <div
                          key={fusion.key}
                          className="flex items-center justify-between gap-2 text-[11px] py-1 border-b border-stone-800/50 last:border-b-0"
                        >
                          <span className="truncate font-medium" style={{ color: fusion.color }}>
                            {ELEMENTS[a].nameTh} + {ELEMENTS[b].nameTh} → {fusion.nameTh}
                          </span>
                          <span className="font-mono-num text-[10px] text-sky-300/90 shrink-0">
                            {fusion.manaCost} MP
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col justify-between gap-2.5">
                <div>
                  <div className="flex items-baseline justify-between gap-2 mb-2">
                    <h2 className="font-display text-sm font-bold tracking-wide text-amber-200/90">
                      ศาสตราเริ่มต้น
                    </h2>
                    {!race.canUseMagic && (
                      <span className="text-[11px] text-amber-300/90">ออร์คปิดผนึกเวทย์</span>
                    )}
                  </div>

                  {/* Clean Compact Sigil Grid */}
                  <div className="grid grid-cols-8 sm:grid-cols-8 lg:grid-cols-4 xl:grid-cols-8 gap-1.5">
                    {STARTER_OPTIONS.map((wId) => {
                      const def = WEAPONS[wId];
                      const lockedByOrc = !race.canUseMagic && def.category === 'magic';
                      const active = selectedWeapon === wId && !lockedByOrc;
                      return (
                        <button
                          key={wId}
                          type="button"
                          disabled={lockedByOrc}
                          onClick={() => onSelectWeapon(wId)}
                          title={`${def.nameTh} (${CATEGORY_LABELS_TH[def.category]})`}
                          aria-label={def.nameTh}
                          className={`aspect-square rounded-sm flex items-center justify-center transition-all cursor-pointer focus-visible:outline-2 focus-visible:outline-amber-400 ${
                            lockedByOrc
                              ? 'bg-[#0A0B10]/75 border border-stone-800/60 opacity-35 cursor-not-allowed'
                              : active
                                ? 'bg-amber-500/20 border border-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.28)]'
                                : 'bg-[#111219] border border-stone-800 hover:border-amber-500/50'
                          }`}
                        >
                          {lockedByOrc ? (
                            <Lock className="w-3.5 h-3.5 text-stone-500" />
                          ) : (
                            <WeaponIcon id={wId} className="w-6 h-6" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Selected Weapon Quiet Readout */}
                <div className="pt-2 border-t border-stone-800/80 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-sm bg-[#0E0F15] border border-amber-500/35 flex items-center justify-center shrink-0">
                    <WeaponIcon id={selectedWeapon} className="w-6 h-6" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 text-xs font-semibold text-amber-100">
                      <span className="truncate">{activeWeaponDef.nameTh}</span>
                      <span className="text-[11px] font-normal text-stone-400 shrink-0">
                        · {CATEGORY_LABELS_TH[activeWeaponDef.category]}
                      </span>
                    </div>
                    <p className="text-[11px] text-stone-400 line-clamp-1 mt-0.5">
                      {activeWeaponDef.descriptionTh}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* Column 2 (4 cols): Hero Sanctuary Focal Centerpiece */}
          <section className="lg:col-span-4 gothic-panel rounded-md overflow-hidden flex flex-col">
            {/* Hero Key Portrait */}
            <div className="relative h-56 sm:h-64 lg:h-64 bg-[#07080D] overflow-hidden shrink-0">
              {!portraitFailed[race.id] ? (
                <img
                  src={race.portraitPath}
                  alt={race.nameTh}
                  referrerPolicy="no-referrer"
                  onError={() =>
                    setPortraitFailed((prev) => ({ ...prev, [race.id]: true }))
                  }
                  className="w-full h-full object-cover object-top"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-b from-[#171622] to-[#0B0B11] font-display text-3xl text-amber-300/70">
                  {race.nameEn}
                </div>
              )}

              {/* Subtle Medieval Corner Brackets */}
              <div className="pointer-events-none absolute inset-3">
                <span className="absolute top-0 left-0 w-3.5 h-3.5 border-t border-l border-amber-400/50" />
                <span className="absolute top-0 right-0 w-3.5 h-3.5 border-t border-r border-amber-400/50" />
              </div>

              <div
                className="absolute inset-0"
                style={{
                  background:
                    'linear-gradient(180deg, rgba(8,9,14,0.12) 0%, rgba(11,11,16,0.28) 55%, rgba(12,12,18,0.98) 100%)',
                }}
              />

              <div className="absolute bottom-3 left-5 right-5">
                <div className="text-[11px] text-amber-300/80 tracking-wider font-medium">
                  {race.nameEn}
                </div>
                <h2 className="font-display text-2xl font-bold text-amber-50 leading-tight mt-0.5">
                  {race.nameTh}
                </h2>
              </div>
            </div>

            {/* Hero Body: Narrative, Clean 4-Stat Strip, Traits & Evolutions */}
            <div className="p-5 pt-3 flex-1 flex flex-col justify-between gap-4">
              <div className="space-y-4">
                <p className="text-xs sm:text-[13px] text-stone-300 leading-relaxed">
                  {race.subtitleTh}
                </p>

                {/* Unboxed 4-Column Tabular Stats Strip */}
                <div className="grid grid-cols-4 gap-2 py-2.5 border-y border-amber-500/20 text-center">
                  <div>
                    <div className="text-[10px] text-stone-400">พลังชีวิต</div>
                    <div className="font-mono-num text-sm font-bold text-amber-100 mt-0.5">
                      {race.baseHp}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-stone-400">ความเร็ว</div>
                    <div className="font-mono-num text-sm font-bold text-amber-100 mt-0.5">
                      {race.baseSpeed}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-stone-400">
                      {race.id === 'orc' ? 'ดาเมจกายภาพ' : 'ดาเมจ'}
                    </div>
                    <div className="font-mono-num text-sm font-bold text-amber-100 mt-0.5">
                      {race.id === 'orc' ? '145%' : `${Math.round(race.baseDamageMult * 100)}%`}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-stone-400">เกราะ</div>
                    <div className="font-mono-num text-sm font-bold text-amber-100 mt-0.5">
                      {race.baseArmor}
                    </div>
                  </div>
                </div>

                {/* Racial Traits & Weakness */}
                <div className="space-y-1.5 text-xs leading-relaxed">
                  {race.traits.map((t, i) => (
                    <p key={i} className="text-stone-300">
                      <span className="text-emerald-400 mr-1.5">+</span>
                      {t}
                    </p>
                  ))}
                  {race.weakness && (
                    <p className="text-rose-300/90">
                      <span className="text-rose-400 mr-1.5">-</span>
                      {race.weakness}
                    </p>
                  )}
                </div>
              </div>

              {/* Cosmetic Skin Selector & Mastery */}
              <div className="pt-3 border-t border-stone-800/80 space-y-2.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-stone-400 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-300" />
                    <span>สกิน &amp; ออร่า ({raceMastery.titleTh} Lv.{raceMastery.level})</span>
                  </span>
                  {(saveData.bestCurseByRace[selectedRace] || 0) > 0 && (
                    <span className="font-mono-num text-rose-300">
                      คำสาปสูงสุด Lv.{saveData.bestCurseByRace[selectedRace]}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-4 gap-1.5">
                  {RACE_SKINS.map((sk) => {
                    const unlocked = sk.isUnlocked(saveData, selectedRace);
                    const equipped = activeSkinId === sk.id;
                    return (
                      <button
                        key={sk.id}
                        type="button"
                        disabled={!unlocked}
                        onClick={() => unlocked && onSelectSkin(selectedRace, sk.id)}
                        title={`${sk.nameTh}\n${sk.reqDescTh}`}
                        className={`px-2 py-1.5 rounded text-[10px] font-semibold truncate border text-center transition-colors ${
                          !unlocked
                            ? 'bg-stone-950 border-stone-800 text-stone-600 cursor-not-allowed'
                            : equipped
                              ? 'gothic-card-active text-amber-200 cursor-pointer'
                              : 'gothic-card text-stone-300 hover:border-amber-500/40 cursor-pointer'
                        }`}
                      >
                        {unlocked ? (
                          <span className="inline-flex items-center gap-1">
                            {sk.tintHex && (
                              <span
                                className="w-2 h-2 rounded-full shrink-0"
                                style={{ backgroundColor: sk.tintHex }}
                              />
                            )}
                            <span className="truncate">{sk.id === 'default' ? 'ดั้งเดิม' : sk.nameTh.split(' ')[0]}</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1">
                            <Lock className="w-2.5 h-2.5 shrink-0" />
                            <span>ล็อก</span>
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {race.canEvolveClass && raceClasses.length > 0 && (
                  <div className="pt-2 border-t border-stone-800/60">
                    <div className="text-[11px] text-stone-400 mb-1">
                      ปลดล็อกสายคลาสที่เลเวล 20
                    </div>
                    <div className="text-xs font-medium text-amber-200/90 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                      {raceClasses.map((cls, idx) => (
                        <React.Fragment key={cls.id}>
                          {idx > 0 && (
                            <span aria-hidden="true" className="text-stone-600">
                              ·
                            </span>
                          )}
                          <span style={{ color: cls.color }}>{cls.nameTh}</span>
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Column 3 (4 cols): Realm Dispatch & Primary Launch CTA */}
          <section className="lg:col-span-4 gothic-panel rounded-md p-5 flex flex-col justify-between gap-4">
            <div className="space-y-4">
              {/* Stage Selector */}
              <div>
                <h2 className="font-display text-sm font-bold tracking-wide text-amber-200/90 mb-2.5">
                  สมรภูมิแห่งรัตติกาล
                </h2>
                <div className="space-y-2">
                  {(Object.keys(STAGES) as StageId[]).map((sId) => {
                    const st = STAGES[sId];
                    const unlocked = saveData.unlockedStages.includes(sId);
                    const active = selectedStage === sId && unlocked;
                    const canUnlock = !unlocked && saveData.gold >= st.unlockCost;

                    return (
                      <div
                        key={sId}
                        className={`flex items-center justify-between gap-3 p-3 rounded transition-colors ${
                          active ? 'gothic-card-active' : 'gothic-card'
                        }`}
                      >
                        <button
                          type="button"
                          disabled={!unlocked}
                          onClick={() => unlocked && onSelectStage(sId)}
                          className={`flex-1 text-left min-w-0 ${
                            unlocked ? 'cursor-pointer' : 'cursor-default opacity-65'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span
                              className="w-1.5 h-1.5 rotate-45 shrink-0"
                              style={{
                                backgroundColor: active ? '#FBBF24' : '#78716C',
                              }}
                            />
                            <span className="text-sm font-bold text-amber-50 truncate">
                              {st.nameTh}
                            </span>
                          </div>
                          <div className="text-[11px] text-stone-400 mt-0.5 pl-3.5 line-clamp-1">
                            {st.subtitleTh}
                          </div>
                        </button>

                        {!unlocked && (
                          <button
                            type="button"
                            disabled={!canUnlock}
                            onClick={() => onUnlockStage(sId)}
                            className={`px-3 py-1.5 rounded-sm text-xs font-mono-num font-bold whitespace-nowrap shrink-0 cursor-pointer ${
                              canUnlock
                                ? 'gothic-btn-gold'
                                : 'bg-stone-900 border border-stone-700 text-stone-500 cursor-not-allowed'
                            }`}
                          >
                            ปลดล็อก {st.unlockCost}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Pace Segmented Switch */}
              <div>
                <div className="text-xs font-medium text-stone-300 mb-2">
                  จังหวะเวลาในด่าน
                </div>
                <div className="grid grid-cols-2 gap-1 p-1 rounded bg-[#0A0B10] border border-amber-500/20">
                  <button
                    type="button"
                    onClick={() => onSelectPace('classic')}
                    className={`py-2 px-3 rounded-sm text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                      selectedPace === 'classic'
                        ? 'bg-amber-500/20 border border-amber-400/60 text-amber-200'
                        : 'text-stone-400 hover:text-stone-200 border border-transparent'
                    }`}
                  >
                    โหมดปกติ · 30 นาที
                  </button>
                  <button
                    type="button"
                    onClick={() => onSelectPace('blitz')}
                    className={`py-2 px-3 rounded-sm text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                      selectedPace === 'blitz'
                        ? 'bg-amber-500/20 border border-amber-400/60 text-amber-200'
                        : 'text-stone-400 hover:text-stone-200 border border-transparent'
                    }`}
                  >
                    โหมดเร่งด่วน · 10 นาที (3x)
                  </button>
                </div>
              </div>

              {/* Bot Test Mode Selector */}
              <div>
                <div className="flex items-center justify-between text-xs font-medium text-stone-300 mb-2">
                  <span className="flex items-center gap-1.5">
                    <Bot className="w-3.5 h-3.5 text-violet-400" />
                    <span>โหมดบอททดสอบคลาส</span>
                  </span>
                  {botMode === 'full' && (
                    <span className="text-[10px] text-violet-300">
                      เลือกหีบ/กดสกิล/อัลติ/คลาสอัตโนมัติ
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-1 p-1 rounded bg-[#0A0B10] border border-violet-500/20">
                  <button
                    type="button"
                    onClick={() => onSelectBotMode('off')}
                    className={`py-1.5 px-2 rounded-sm text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                      botMode === 'off'
                        ? 'bg-stone-800 border border-stone-500/60 text-stone-100'
                        : 'text-stone-400 hover:text-stone-200 border border-transparent'
                    }`}
                  >
                    ปิด (เล่นเอง)
                  </button>
                  <button
                    type="button"
                    onClick={() => onSelectBotMode('idle')}
                    className={`py-1.5 px-2 rounded-sm text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                      botMode === 'idle'
                        ? 'bg-emerald-500/20 border border-emerald-400/60 text-emerald-200'
                        : 'text-stone-400 hover:text-stone-200 border border-transparent'
                    }`}
                  >
                    Idle AI
                  </button>
                  <button
                    type="button"
                    onClick={() => onSelectBotMode('full')}
                    className={`py-1.5 px-2 rounded-sm text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                      botMode === 'full'
                        ? 'bg-violet-500/25 border border-violet-400/70 text-violet-200'
                        : 'text-stone-400 hover:text-stone-200 border border-transparent'
                    }`}
                  >
                    บอท Full
                  </button>
                </div>

                {botMode === 'full' && race.canEvolveClass && (
                  <div className="mt-2 flex flex-wrap items-center gap-1">
                    <span className="text-[11px] text-stone-400 mr-1">คลาสเป้าหมาย Lv.20:</span>
                    <button
                      type="button"
                      onClick={() => onSelectBotTargetClass('auto')}
                      className={`px-2 py-0.5 rounded-sm text-[11px] border cursor-pointer transition-colors ${
                        botTargetClass === 'auto'
                          ? 'bg-violet-500/25 border-violet-400 text-violet-200 font-semibold'
                          : 'bg-[#0A0B10] border-stone-700 text-stone-400 hover:text-stone-200'
                      }`}
                    >
                      สุ่ม
                    </button>
                    {raceClasses.map((cls) => (
                      <button
                        key={cls.id}
                        type="button"
                        onClick={() => onSelectBotTargetClass(cls.id)}
                        className={`px-2 py-0.5 rounded-sm text-[11px] border cursor-pointer transition-colors ${
                          botTargetClass === cls.id
                            ? 'bg-violet-500/25 border-violet-400 text-violet-200 font-semibold'
                            : 'bg-[#0A0B10] border-stone-700 text-stone-400 hover:text-stone-200'
                        }`}
                      >
                        {cls.nameTh}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Pre-Run Camp Loadout Summary */}
              <div className="pt-3 border-t border-stone-800/80 space-y-2">
                <div className="text-[11px] font-semibold text-amber-300/90">
                  เตรียมตัวก่อนลงด่าน
                </div>
                <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                  <button
                    type="button"
                    onClick={() => onOpenShop('blacksmith')}
                    className="gothic-card px-2.5 py-1.5 rounded flex items-center justify-between cursor-pointer hover:border-amber-500/45"
                  >
                    <span className="text-stone-400 flex items-center gap-1">
                      <Shield className="w-3 h-3 text-orange-400" />
                      <span>อุปกรณ์ถาวร</span>
                    </span>
                    <span className="font-mono-num font-bold text-amber-200">{equippedGearCount}/4</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onOpenShop('apothecary')}
                    className="gothic-card px-2.5 py-1.5 rounded flex items-center justify-between cursor-pointer hover:border-amber-500/45"
                  >
                    <span className="text-stone-400 flex items-center gap-1 truncate">
                      <FlaskConical className="w-3 h-3 text-emerald-400 shrink-0" />
                      <span className="truncate">
                        {saveData.selectedPotion ? POTIONS[saveData.selectedPotion].nameTh : 'ไม่พกยา'}
                      </span>
                    </span>
                    {saveData.selectedPotion && (
                      <span className="font-mono-num font-bold text-emerald-300">x{equippedPotionQty}</span>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => onOpenShop('hatchery')}
                    className="gothic-card px-2.5 py-1.5 rounded flex items-center justify-between cursor-pointer hover:border-amber-500/45"
                  >
                    <span className="text-stone-400 flex items-center gap-1 truncate">
                      <PawPrint className="w-3 h-3 text-pink-400 shrink-0" />
                      <span className="truncate">
                        {saveData.equippedPet ? PETS[saveData.equippedPet].nameTh : 'ไม่มีสัตว์เลี้ยง'}
                      </span>
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onOpenShop('curse_gate')}
                    className="gothic-card px-2.5 py-1.5 rounded flex items-center justify-between cursor-pointer hover:border-amber-500/45"
                  >
                    <span className="text-stone-400 flex items-center gap-1">
                      <Skull className="w-3 h-3 text-rose-400" />
                      <span>ประตูคำสาป</span>
                    </span>
                    <span className="font-mono-num font-bold text-rose-300">
                      {saveData.buildings.curse_gate > 0 ? `Lv.${curseLevel}` : 'ล็อก'}
                    </span>
                  </button>
                </div>
              </div>
            </div>

            {/* Primary Launch CTA + Daily Challenge */}
            <div className="pt-2 space-y-2">
              <button
                type="button"
                onClick={onStartRun}
                className="gothic-btn-gold w-full py-3.5 px-6 rounded font-display font-bold text-base tracking-wide flex items-center justify-center gap-2.5 cursor-pointer whitespace-nowrap focus-visible:outline-2 focus-visible:outline-amber-200"
              >
                <Play className="w-5 h-5 fill-current shrink-0" />
                <span>ออกศึกเอาชีวิตรอด</span>
              </button>

              {saveData.buildings.tavern > 0 && (
                <button
                  type="button"
                  onClick={onStartDailyChallenge}
                  className="gothic-btn-iron w-full py-2 px-4 rounded text-xs font-semibold flex items-center justify-between cursor-pointer"
                >
                  <span className="flex items-center gap-1.5 text-amber-200 truncate">
                    <Crown className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span className="truncate">
                      ชาเลนจ์รายวัน: {RACES[dailyChallenge.raceId].nameTh} · {STAGES[dailyChallenge.stageId].nameTh}
                    </span>
                  </span>
                  <span className="font-mono-num text-[11px] shrink-0 ml-2 text-emerald-300">
                    {dcDoneToday ? 'สำเร็จแล้ว' : `+${dailyChallenge.rewardSeals} ตรา`}
                  </span>
                </button>
              )}
            </div>
          </section>
        </main>

        {/* Quiet Footer Control Hint */}
        <footer className="text-center text-xs text-stone-400 pt-2 border-t border-stone-800/50">
          <span>WASD / ลูกศร / ลากเพื่อเดิน</span>
          <span aria-hidden="true" className="mx-2 text-stone-600">
            ·
          </span>
          <span>Space / Shift สกิลประจำเผ่า</span>
          <span aria-hidden="true" className="mx-2 text-stone-600">
            ·
          </span>
          <span>1 / 2 / 3 เลือกสมบัติ</span>
          <span aria-hidden="true" className="mx-2 text-stone-600">
            ·
          </span>
          <span>Esc หยุดเกม</span>
        </footer>
      </div>
    </div>
  );
};
