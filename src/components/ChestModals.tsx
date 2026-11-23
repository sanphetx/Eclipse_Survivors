import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  Ban,
  BookOpen,
  Coins,
  Crown,
  FastForward,
  Lock,
  PackageCheck,
  PackageX,
  Play,
  RefreshCw,
  Repeat,
  RotateCcw,
  ScrollText,
  Shield,
  Skull,
  Sparkles,
  Trophy,
} from 'lucide-react';
import {
  ALL_ELEMENT_FUSIONS,
  ARTIFACT_SLOT_ORDER,
  ARTIFACT_SLOTS,
  ARTIFACTS,
  CATEGORY_LABELS_TH,
  DAMAGE_TYPE_LABELS_TH,
  ELEMENTS,
  formatClock,
  getClassesForRace,
  MAGE_PERKS,
  RACE_CLASSES,
  RACES,
  RELICS,
  SEVEN_SINS,
  STAGES,
  WEAPONS,
} from '../game/data';
import {
  getMasteryLevelInfo,
  PERMANENT_GEAR_CATALOG,
  RARITY_META,
  UNLOCK_QUESTS,
} from '../game/metaData';
import {
  ArtifactId,
  AudioVolumeSettings,
  BossChestReward,
  DraftChoice,
  EquippedArtifacts,
  HudSnapshot,
  RaceClassId,
  RaceId,
  RunSummary,
  SaveData,
  SinContractChoice,
  SinId,
} from '../game/types';
import { AudioSettingsPanel } from './AudioSettingsPanel';
import {
  ArtifactIcon,
  ArtifactSlotEmptyIcon,
  RelicIcon,
  TreasureChestSvg,
  WeaponIcon,
} from './GameIcons';

interface LevelUpChestModalProps {
  level: number;
  raceId: RaceId;
  raceClass?: RaceClassId | null;
  choices: DraftChoice[];
  rerollsLeft: number;
  banishesLeft: number;
  skipsLeft: number;
  noDraftTricks?: boolean;
  onSelect: (choice: DraftChoice) => void;
  onReroll: () => void;
  onBanish: (choice: DraftChoice) => void;
  onSkip: () => void;
}

export const LevelUpChestModal: React.FC<LevelUpChestModalProps> = ({
  level,
  raceId,
  raceClass = null,
  choices,
  rerollsLeft,
  banishesLeft,
  skipsLeft,
  noDraftTricks = false,
  onSelect,
  onReroll,
  onBanish,
  onSkip,
}) => {
  const race = RACES[raceId];
  const [banishMode, setBanishMode] = useState(false);

  useEffect(() => {
    setBanishMode(false);
  }, [choices]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (banishMode) {
        if (e.key === 'Escape') setBanishMode(false);
        return;
      }
      if (e.key === '1' && choices[0]) onSelect(choices[0]);
      if (e.key === '2' && choices[1]) onSelect(choices[1]);
      if (e.key === '3' && choices[2]) onSelect(choices[2]);
      if (e.key === '4' && choices[3]) onSelect(choices[3]);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [banishMode, choices, onSelect]);

  const handleCardClick = (choice: DraftChoice) => {
    if (banishMode) {
      if (choice.kind === 'consumable') return;
      setBanishMode(false);
      onBanish(choice);
      return;
    }
    onSelect(choice);
  };

  const hasFourthCard = choices.length >= 4;

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4">
      <div className={`gothic-panel w-full ${hasFourthCard ? 'max-w-5xl' : 'max-w-3xl'} rounded-lg overflow-hidden`}>
        <div className="flex flex-col items-center text-center px-6 pt-5 pb-4 border-b border-amber-500/25 bg-[#0A090F]/70">
          <div className="animate-chest-float mb-2">
            <TreasureChestSvg className="w-12 h-12" />
          </div>
          <h2 className="font-display text-2xl font-bold text-amber-300 tracking-wide">
            หีบสมบัติเลเวล {level}
          </h2>
          <p className="text-xs sm:text-sm text-stone-300 mt-1">
            {banishMode
              ? 'โหมดแบนสกิล: เลือกการ์ดที่ต้องการตัดออกจากพูลตลอดรอบนี้'
              : race.usesElements
                ? `เลือกพรแห่งจอมเวทย์ 1 อย่าง (กด 1-${choices.length})`
                : `เลือกอุปกรณ์หรือเครื่องราง 1 ชิ้น (กด 1-${choices.length})`}
          </p>
          {!race.canUseMagic && (
            <p className="text-xs text-amber-400/90 mt-1">
              {race.nameTh}: อาวุธสายเวทย์ถูกปิดผนึก
            </p>
          )}
          {race.usesElements && (
            <p className="text-xs text-sky-300/90 mt-1">
              {race.nameTh}: ไม่สามารถถืออาวุธทั่วไป — เก็บออร์บ 3 ธาตุผสานเวทย์ (ติดคูลดาวน์พิธีกรรม &amp; ใช้ MP ปิดผนึก)!
            </p>
          )}
          {hasFourthCard && (
            <p className="text-xs text-emerald-300 mt-1 font-medium">
              โชคดีทำงาน! ปรากฏตัวเลือกพิเศษใบที่ 4
            </p>
          )}
        </div>

        <div className={`p-5 grid grid-cols-1 ${hasFourthCard ? 'md:grid-cols-2 lg:grid-cols-4' : 'md:grid-cols-3'} gap-3.5`}>
          {choices.map((choice, idx) => {
            if (choice.kind === 'weapon') {
              const def = WEAPONS[choice.weaponId];
              const pairedRelic = RELICS[def.pairedRelic];
              const isEvo = choice.isEvolve;
              const desc = isEvo
                ? def.evolvedDescTh
                : def.levelDescriptions[Math.min(4, choice.nextLevel - 1)] || def.descriptionTh;

              return (
                <button
                  key={`${choice.weaponId}-${idx}`}
                  type="button"
                  onClick={() => handleCardClick(choice)}
                  className={`group flex flex-col justify-between text-left p-4 rounded-md transition-transform duration-150 hover:-translate-y-0.5 cursor-pointer ${
                    banishMode
                      ? 'gothic-card border-rose-500/70 bg-rose-950/20'
                      : isEvo
                        ? 'gothic-card-active'
                        : 'gothic-card'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="w-11 h-11 rounded bg-[#08090F] border border-amber-500/30 flex items-center justify-center shrink-0">
                        <WeaponIcon id={choice.weaponId} evolved={isEvo} className="w-8 h-8" />
                      </div>
                      <span className="font-mono-num text-xs text-amber-300/80">[{idx + 1}]</span>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5 text-xs text-stone-400 mb-1">
                      <span>{CATEGORY_LABELS_TH[def.category]}</span>
                      <span
                        className="px-1.5 py-0.5 rounded-xs text-[10px] font-semibold border leading-none"
                        style={{
                          borderColor: `${DAMAGE_TYPE_LABELS_TH[def.damageType].color}55`,
                          backgroundColor: `${DAMAGE_TYPE_LABELS_TH[def.damageType].color}15`,
                          color: DAMAGE_TYPE_LABELS_TH[def.damageType].color,
                        }}
                      >
                        {DAMAGE_TYPE_LABELS_TH[def.damageType].badge}
                      </span>
                      <span className={isEvo ? 'text-amber-300 font-semibold' : 'text-sky-300'}>
                        {isEvo
                          ? 'ผสานร่างขั้นสุดยอด'
                          : choice.isNew
                            ? 'อุปกรณ์ใหม่ Lv.1'
                            : `อัปเกรด Lv.${choice.nextLevel}`}
                      </span>
                    </div>

                    <h3
                      className={`text-base font-bold ${
                        isEvo ? 'text-amber-300' : 'text-amber-50'
                      }`}
                    >
                      {isEvo ? def.evolvedNameTh : def.nameTh}
                    </h3>

                    <p className="text-xs text-stone-300 mt-2 leading-relaxed">{desc}</p>
                  </div>

                  {!isEvo && (
                    <div className="mt-4 pt-2.5 border-t border-amber-500/15 text-[11px] text-stone-400">
                      ผสานร่างคู่กับ: <span className="text-amber-200">{pairedRelic.nameTh}</span>
                    </div>
                  )}
                </button>
              );
            }

            if (choice.kind === 'relic') {
              const def = RELICS[choice.relicId];
              const isChronosSynergy = raceClass === 'time_god' && choice.relicId === 'chronos';
              return (
                <button
                  key={`${choice.relicId}-${idx}`}
                  type="button"
                  onClick={() => handleCardClick(choice)}
                  className={`group flex flex-col justify-between text-left p-4 rounded-md transition-transform duration-150 hover:-translate-y-0.5 cursor-pointer ${
                    banishMode
                      ? 'gothic-card border-rose-500/70 bg-rose-950/20'
                      : isChronosSynergy
                        ? 'gothic-card border-cyan-400/70'
                        : 'gothic-card'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="w-11 h-11 rounded bg-[#08090F] border border-amber-500/30 flex items-center justify-center shrink-0">
                        <RelicIcon id={choice.relicId} className="w-7 h-7" />
                      </div>
                      <div className="flex items-center gap-1.5">
                        {isChronosSynergy && (
                          <span className="px-1.5 py-0.5 rounded-xs text-[10px] font-bold border border-cyan-400/60 bg-cyan-950/70 text-cyan-200">
                            เข้ากับเทพเวลา
                          </span>
                        )}
                        <span className="font-mono-num text-xs text-amber-300/80">[{idx + 1}]</span>
                      </div>
                    </div>

                    <div className="text-xs text-stone-400 mb-1">
                      <span>เครื่องรางติดตัว</span>
                      <span aria-hidden="true"> · </span>
                      <span className="text-emerald-300">
                        {choice.isNew ? 'เครื่องรางใหม่ Lv.1' : `อัปเกรด Lv.${choice.nextLevel}`}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-amber-50">{def.nameTh}</h3>
                    <p className="text-xs text-stone-300 mt-2 leading-relaxed">
                      {def.descriptionTh}
                    </p>
                  </div>

                  <div className="mt-4 pt-2.5 border-t border-amber-500/15 text-[11px] text-sky-300">
                    {def.effectPerLevel}
                  </div>
                </button>
              );
            }

            if (choice.kind === 'mage_perk') {
              const def = MAGE_PERKS[choice.perkId];
              const isChronosSynergy = raceClass === 'time_god' && choice.perkId === 'mana_flow';
              return (
                <button
                  key={`${choice.perkId}-${idx}`}
                  type="button"
                  onClick={() => handleCardClick(choice)}
                  className={`group flex flex-col justify-between text-left p-4 rounded-md transition-transform duration-150 hover:-translate-y-0.5 cursor-pointer ${
                    banishMode
                      ? 'gothic-card border-rose-500/70 bg-rose-950/20'
                      : isChronosSynergy
                        ? 'gothic-card border-cyan-400/70'
                        : 'gothic-card'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div
                        className="w-11 h-11 rounded bg-[#08090F] border flex items-center justify-center shrink-0"
                        style={{ borderColor: `${def.color}66`, color: def.color }}
                      >
                        <Sparkles className="w-6 h-6" />
                      </div>
                      <div className="flex items-center gap-1.5">
                        {isChronosSynergy && (
                          <span className="px-1.5 py-0.5 rounded-xs text-[10px] font-bold border border-cyan-400/60 bg-cyan-950/70 text-cyan-200">
                            เข้ากับเทพเวลา
                          </span>
                        )}
                        <span className="font-mono-num text-xs text-amber-300/80">[{idx + 1}]</span>
                      </div>
                    </div>

                    <div className="text-xs text-stone-400 mb-1">
                      <span>พรแห่งจอมเวทย์</span>
                      <span aria-hidden="true"> · </span>
                      <span className="text-sky-300 font-semibold">ขั้น {choice.nextRank}</span>
                    </div>

                    <h3 className="text-base font-bold text-amber-50">{def.nameTh}</h3>
                    <p className="text-xs text-stone-300 mt-2 leading-relaxed">{def.descTh}</p>
                  </div>

                  <div
                    className="mt-4 pt-2.5 border-t border-amber-500/15 text-[11px] font-medium"
                    style={{ color: def.color }}
                  >
                    {def.bonusLabel}
                  </div>
                </button>
              );
            }

            return (
              <button
                key={`consumable-${idx}`}
                type="button"
                disabled={banishMode}
                onClick={() => handleCardClick(choice)}
                className={`gothic-card flex flex-col justify-between text-left p-4 rounded-md transition-transform duration-150 ${
                  banishMode ? 'opacity-40 cursor-not-allowed' : 'hover:-translate-y-0.5 cursor-pointer'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="w-11 h-11 rounded bg-[#08090F] border border-amber-500/35 flex items-center justify-center text-amber-300">
                      <Coins className="w-6 h-6" />
                    </div>
                    <span className="font-mono-num text-xs text-amber-300/80">[{idx + 1}]</span>
                  </div>
                  <div className="text-xs text-amber-300 mb-1">รางวัลฟื้นฟูและทองคำ</div>
                  <h3 className="text-base font-bold text-amber-50">ถุงทองและเนื้อย่าง</h3>
                  <p className="text-xs text-stone-300 mt-2 leading-relaxed">
                    ฟื้นฟูพลังชีวิต +{choice.healAmount} HP และรับเหรียญทอง +{choice.goldAmount} ทันที
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Reroll / Banish / Skip Action Bar */}
        <div className="px-5 py-3.5 border-t border-amber-500/20 bg-[#0A090F]/85 flex flex-wrap items-center justify-between gap-2.5">
          {noDraftTricks ? (
            <div className="text-xs text-rose-300 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5" />
              <span>คำสาปปิดผนึกโชคชะตา: ห้ามใช้ Reroll / Banish / Skip ในรอบนี้</span>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                disabled={rerollsLeft <= 0}
                onClick={onReroll}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold transition-colors ${
                  rerollsLeft > 0
                    ? 'gothic-btn-iron text-sky-300 cursor-pointer'
                    : 'bg-stone-900 border border-stone-800 text-stone-600 cursor-not-allowed'
                }`}
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>สุ่มใหม่ ({rerollsLeft})</span>
              </button>

              <button
                type="button"
                disabled={banishesLeft <= 0}
                onClick={() => setBanishMode((v) => !v)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold transition-colors ${
                  banishesLeft <= 0
                    ? 'bg-stone-900 border border-stone-800 text-stone-600 cursor-not-allowed'
                    : banishMode
                      ? 'bg-rose-600/30 border border-rose-400 text-rose-200 cursor-pointer'
                      : 'gothic-btn-iron text-rose-300 cursor-pointer'
                }`}
              >
                <Ban className="w-3.5 h-3.5" />
                <span>{banishMode ? 'ยกเลิกแบน' : `แบนสกิล (${banishesLeft})`}</span>
              </button>

              <button
                type="button"
                disabled={skipsLeft <= 0}
                onClick={onSkip}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold transition-colors ${
                  skipsLeft > 0
                    ? 'gothic-btn-iron text-amber-300 cursor-pointer'
                    : 'bg-stone-900 border border-stone-800 text-stone-600 cursor-not-allowed'
                }`}
              >
                <FastForward className="w-3.5 h-3.5" />
                <span>ข้ามรับ +35 ทอง ({skipsLeft})</span>
              </button>
            </div>
          )}

          <div className="text-[11px] text-stone-500">
            เลือกการ์ดด้วยคลิก หรือปุ่มตัวเลข 1–{choices.length}
          </div>
        </div>
      </div>
    </div>
  );
};

interface BossChestModalProps {
  reward: BossChestReward;
  onClaim: () => void;
}

export const BossChestModal: React.FC<BossChestModalProps> = ({ reward, onClaim }) => (
  <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/82 backdrop-blur-xs p-4">
    <div className="gothic-panel w-full max-w-lg rounded-lg border-amber-400/70 p-6 text-center">
      <div className="flex justify-center mb-3 animate-chest-float">
        <TreasureChestSvg golden className="w-16 h-16" />
      </div>
      <h2 className="font-display text-2xl font-bold text-amber-300 tracking-wide">
        เปิดหีบสมบัติบอส!
      </h2>
      <p className="text-xs text-stone-300 mt-1">
        ได้รับพลังอัปเกรดฟรีและทองโบนัส +{reward.bonusGold} ทอง
      </p>

      <div className="mt-5 space-y-2.5 text-left">
        {reward.items.map((item, i) => {
          if (item.kind === 'weapon') {
            const def = WEAPONS[item.weaponId];
            return (
              <div
                key={i}
                className={`flex items-center gap-3 p-3 rounded-md ${
                  item.isEvolve ? 'gothic-card-active' : 'gothic-card'
                }`}
              >
                <WeaponIcon id={item.weaponId} evolved={item.isEvolve} className="w-9 h-9 shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-bold text-amber-50 truncate">
                      {item.isEvolve ? def.evolvedNameTh : def.nameTh}
                    </span>
                    <span
                      className="px-1.5 py-0.5 rounded-xs text-[10px] font-semibold border leading-none shrink-0"
                      style={{
                        borderColor: `${DAMAGE_TYPE_LABELS_TH[def.damageType].color}55`,
                        backgroundColor: `${DAMAGE_TYPE_LABELS_TH[def.damageType].color}15`,
                        color: DAMAGE_TYPE_LABELS_TH[def.damageType].color,
                      }}
                    >
                      {DAMAGE_TYPE_LABELS_TH[def.damageType].badge}
                    </span>
                  </div>
                  <div className="text-xs text-amber-300">
                    {item.isEvolve
                      ? 'ผสานร่างขั้นสุดยอดสำเร็จ!'
                      : item.isNew
                        ? 'ปลดล็อกอุปกรณ์ใหม่ Lv.1'
                        : `อัปเกรดเป็น Lv.${item.nextLevel}`}
                  </div>
                </div>
              </div>
            );
          }
          if (item.kind === 'relic') {
            const def = RELICS[item.relicId];
            return (
              <div key={i} className="gothic-card flex items-center gap-3 p-3 rounded-md">
                <RelicIcon id={item.relicId} className="w-8 h-8 shrink-0" />
                <div>
                  <div className="text-sm font-bold text-amber-50">{def.nameTh}</div>
                  <div className="text-xs text-emerald-300">อัปเกรดเป็น Lv.{item.nextLevel}</div>
                </div>
              </div>
            );
          }
          if (item.kind === 'mage_perk') {
            const def = MAGE_PERKS[item.perkId];
            return (
              <div key={i} className="gothic-card flex items-center gap-3 p-3 rounded-md">
                <div
                  className="w-8 h-8 rounded bg-[#08090F] border flex items-center justify-center shrink-0"
                  style={{ borderColor: `${def.color}66`, color: def.color }}
                >
                  <Sparkles className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-bold text-amber-50">{def.nameTh}</div>
                  <div className="text-xs" style={{ color: def.color }}>
                    อัปเกรดขั้น {item.nextRank} · {def.bonusLabel}
                  </div>
                </div>
              </div>
            );
          }
          return (
            <div key={i} className="gothic-card flex items-center gap-3 p-3 rounded-md">
              <Coins className="w-7 h-7 text-amber-300 shrink-0" />
              <div>
                <div className="text-sm font-bold text-amber-50">สมบัติโบนัส</div>
                <div className="text-xs text-amber-300">
                  +{item.goldAmount} ทอง · ฟื้นฟู +{item.healAmount} HP
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <button
        type="button"
        onClick={onClaim}
        className="gothic-btn-gold mt-6 w-full py-2.5 rounded font-bold text-sm transition-colors cursor-pointer"
      >
        รับสมบัติทั้งหมดและลุยต่อ
      </button>
    </div>
  </div>
);

interface ArtifactChestModalProps {
  choices: ArtifactId[];
  equipped: EquippedArtifacts;
  onSelect: (artifactId: ArtifactId | null) => void;
}

export const ArtifactChestModal: React.FC<ArtifactChestModalProps> = ({
  choices,
  equipped,
  onSelect,
}) => {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === '1' && choices[0]) onSelect(choices[0]);
      if (e.key === '2' && choices[1]) onSelect(choices[1]);
      if (e.key === '3' && choices[2]) onSelect(choices[2]);
      if (e.key === '4' || e.key === 'Escape') onSelect(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [choices, onSelect]);

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/82 backdrop-blur-xs p-4">
      <div className="gothic-panel w-full max-w-4xl rounded-lg border-purple-400/55 overflow-hidden max-h-[94vh] flex flex-col">
        <div className="flex flex-col items-center text-center px-6 pt-5 pb-4 border-b border-purple-500/25 bg-[#0A090F]/75 shrink-0">
          <div className="animate-chest-float mb-2">
            <TreasureChestSvg arcane className="w-14 h-14" />
          </div>
          <h2 className="font-display text-2xl font-bold text-purple-200 tracking-wide">
            หีบเครื่องรางต้องสาป (Artifact)
          </h2>
          <p className="text-xs sm:text-sm text-stone-300 mt-1">
            เลือกสวมใส่อุปกรณ์ 5 ช่อง (หมวก · สร้อย · ชุด · รองเท้า · แหวน) — พลังพิเศษแลกข้อเสียเฉพาะตัว (กด 1, 2 หรือ 3)
          </p>
        </div>

        <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-3.5 overflow-y-auto">
          {choices.map((artId, idx) => {
            const def = ARTIFACTS[artId];
            const slotMeta = ARTIFACT_SLOTS[def.slot];
            const currentInSlot = equipped[def.slot];
            const replacingDef = currentInSlot ? ARTIFACTS[currentInSlot] : null;

            return (
              <button
                key={`${artId}-${idx}`}
                type="button"
                onClick={() => onSelect(artId)}
                className="gothic-card group flex flex-col justify-between text-left p-4 rounded-md hover:border-purple-400 transition-transform duration-150 hover:-translate-y-0.5 cursor-pointer"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div
                      className="w-12 h-12 rounded bg-[#08090F] border flex items-center justify-center shrink-0"
                      style={{ borderColor: `${def.color}77` }}
                    >
                      <ArtifactIcon id={artId} className="w-9 h-9" />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span
                        className="px-2 py-0.5 rounded-xs text-[11px] font-bold border"
                        style={{
                          backgroundColor: `${slotMeta.accentColor}1A`,
                          borderColor: `${slotMeta.accentColor}55`,
                          color: slotMeta.accentColor,
                        }}
                      >
                        ช่อง{slotMeta.nameTh}
                      </span>
                      <span className="font-mono-num text-xs text-amber-300/80">[{idx + 1}]</span>
                    </div>
                  </div>

                  <h3 className="text-base font-bold text-amber-50 leading-snug">{def.nameTh}</h3>
                  <div className="text-[11px] text-stone-400 mb-3">{def.nameEn}</div>

                  <div className="space-y-2 text-xs leading-relaxed">
                    <div className="p-2.5 rounded bg-emerald-950/35 border border-emerald-500/35 text-emerald-200">
                      <span className="font-bold text-emerald-300">ผลดี: </span>
                      {def.prosTh}
                    </div>
                    <div className="p-2.5 rounded bg-rose-950/35 border border-rose-500/35 text-rose-200">
                      <span className="font-bold text-rose-300">ข้อเสีย: </span>
                      {def.consTh}
                    </div>
                  </div>
                </div>

                <div className="mt-3.5 pt-2.5 border-t border-amber-500/15 text-[11px]">
                  {replacingDef ? (
                    <div className="flex items-center gap-1.5 text-amber-300 font-medium">
                      <Repeat className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">แทนที่: {replacingDef.nameTh}</span>
                    </div>
                  ) : (
                    <div className="text-purple-300 font-medium">
                      สวมใส่ช่อง{slotMeta.nameTh} (ยังว่าง)
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        <div className="px-5 pb-4 pt-2 border-t border-amber-500/15 bg-[#0A090F]/80 flex flex-col sm:flex-row items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-1.5 text-[11px] text-stone-400">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>แต่ละช่องใส่ได้สูงสุด 1 ชิ้น — เลือกชิ้นใหม่จะสลับแทนชิ้นเดิมในช่องนั้นทันที</span>
          </div>
          <button
            type="button"
            onClick={() => onSelect(null)}
            className="gothic-btn-iron px-3.5 py-2 rounded text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap"
          >
            ข้าม &amp; รับเสบียง (+45 ทอง · +25 HP) [Esc]
          </button>
        </div>
      </div>
    </div>
  );
};

interface PauseModalProps {
  hud: HudSnapshot;
  raceId: RaceId;
  discoveredFusions: string[];
  muted: boolean;
  volumes: AudioVolumeSettings;
  onToggleMute: () => void;
  onChangeVolumes: (patch: Partial<AudioVolumeSettings>) => void;
  onResume: () => void;
  onQuit: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  hud,
  raceId,
  discoveredFusions,
  muted,
  volumes,
  onToggleMute,
  onChangeVolumes,
  onResume,
  onQuit,
}) => {
  const [tab, setTab] = useState<'status' | 'codex'>('status');
  const [codexFilter, setCodexFilter] = useState<'all' | 'discovered' | 'undiscovered'>('all');
  const race = RACES[raceId];
  const cls = hud.raceClass ? RACE_CLASSES[hud.raceClass] : null;
  const discoveredSet = new Set(discoveredFusions);
  const discoveredCount = ALL_ELEMENT_FUSIONS.filter((f) => discoveredSet.has(f.key)).length;
  const totalFusions = ALL_ELEMENT_FUSIONS.length;
  const filteredFusions = ALL_ELEMENT_FUSIONS.filter((f) => {
    const known = discoveredSet.has(f.key);
    if (codexFilter === 'discovered') return known;
    if (codexFilter === 'undiscovered') return !known;
    return true;
  });

  const cooldownReductionPct = Math.round((1 - hud.playerStats.cooldownMult) * 100);

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4">
      <div
        className={`gothic-panel w-full rounded-lg p-5 sm:p-6 transition-[max-width] duration-150 max-h-[92vh] overflow-y-auto ${
          tab === 'codex' ? 'max-w-3xl' : 'max-w-lg'
        }`}
      >
        <div className="flex flex-col items-center text-center">
          <h2 className="font-display text-2xl font-bold text-amber-200 tracking-wide">
            หยุดเกมชั่วคราว
          </h2>
          <p className="text-xs text-stone-400 mt-1">
            {race.nameTh}
            {cls ? ` (${cls.nameTh})` : ''} · ระดับ {hud.realmTier} ({hud.biomeNameTh}) · เวลา{' '}
            {formatClock(hud.elapsedSeconds)} · Lv.{hud.level}
          </p>
        </div>

        {/* Segmented Tabs: Status vs Elemental Codex */}
        <div className="mt-4 grid grid-cols-2 gap-1 p-1 rounded bg-[#08090F] border border-amber-500/25">
          <button
            type="button"
            onClick={() => setTab('status')}
            className={`py-2 px-3 rounded-xs text-xs font-semibold transition-colors cursor-pointer ${
              tab === 'status'
                ? 'bg-amber-500/20 text-amber-200 border border-amber-400/60'
                : 'text-stone-400 hover:text-stone-200 border border-transparent'
            }`}
          >
            สถานะตัวละคร
          </button>
          <button
            type="button"
            onClick={() => setTab('codex')}
            className={`py-2 px-3 rounded-xs text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
              tab === 'codex'
                ? 'bg-indigo-950/80 text-sky-200 border border-sky-500/50'
                : 'text-stone-400 hover:text-stone-200 border border-transparent'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>คัมภีร์ผสมธาตุ</span>
            <span className="font-mono-num text-[11px] text-sky-300">
              ({discoveredCount}/{totalFusions})
            </span>
          </button>
        </div>

        {tab === 'status' ? (
          <div className="mt-4 space-y-3">
            <AudioSettingsPanel
              muted={muted}
              volumes={volumes}
              onToggleMute={onToggleMute}
              onChangeVolumes={onChangeVolumes}
            />

            <div className="p-3.5 rounded-md bg-[#08090F] border border-amber-500/20 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-stone-400">ตัวคูณดาเมจ</span>
                <span className="font-mono-num text-amber-50 font-semibold">
                  {Math.round(hud.playerStats.damageMult * 100)}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-400">ความเร็วเคลื่อนที่</span>
                <span className="font-mono-num text-amber-50 font-semibold">
                  {Math.round(hud.playerStats.moveSpeed)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-400">เกราะป้องกัน</span>
                <span className="font-mono-num text-amber-50 font-semibold">
                  {hud.playerStats.armor}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-400">โอกาสคริติคอล / ความแรงคริ</span>
                <span className="font-mono-num text-amber-300 font-semibold">
                  {Math.round(hud.playerStats.critChance * 100)}% /{' '}
                  {Math.round(hud.playerStats.critDamageMult * 100)}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-400">ดูดเลือดจากดาเมจ</span>
                <span className="font-mono-num text-rose-300 font-semibold">
                  {hud.playerStats.lifestealPct > 0
                    ? `${(hud.playerStats.lifestealPct * 100).toFixed(1)}%`
                    : '0%'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-400">ลดคูลดาวน์สกิล</span>
                <span
                  className={`font-mono-num font-semibold ${
                    cooldownReductionPct < 0 ? 'text-rose-300' : 'text-amber-50'
                  }`}
                >
                  {cooldownReductionPct >= 0
                    ? `${cooldownReductionPct}%`
                    : `ช้าลง ${Math.abs(cooldownReductionPct)}%`}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-400">ระยะดูดทรัพยากร</span>
                <span className="font-mono-num text-amber-50 font-semibold">
                  {Math.round(hud.playerStats.magnetRadius)} px
                </span>
              </div>
            </div>

            {/* 5-Slot Artifact Equipment Status */}
            <div className="p-3.5 rounded-md bg-[#08090F] border border-amber-500/20">
              <div className="text-xs font-semibold text-purple-300 mb-2.5">
                อุปกรณ์สวมใส่ Artifact (5 ช่อง)
              </div>
              <div className="space-y-2">
                {ARTIFACT_SLOT_ORDER.map((slot) => {
                  const slotMeta = ARTIFACT_SLOTS[slot];
                  const artId = hud.artifacts[slot];
                  const art = artId ? ARTIFACTS[artId] : null;
                  return (
                    <div
                      key={slot}
                      className="gothic-card flex items-start gap-2.5 p-2 rounded"
                    >
                      <div
                        className="w-8 h-8 rounded bg-[#08090F] border flex items-center justify-center shrink-0 mt-0.5"
                        style={{
                          borderColor: art ? `${art.color}66` : 'rgba(120, 113, 108, 0.45)',
                          color: art ? art.color : '#78716C',
                        }}
                      >
                        {art ? (
                          <ArtifactIcon id={art.id} className="w-6 h-6" />
                        ) : (
                          <ArtifactSlotEmptyIcon slot={slot} className="w-4 h-4" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1 text-[11px] leading-snug">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold text-amber-50 truncate">
                            {art ? art.nameTh : `${slotMeta.nameTh} (ยังว่าง)`}
                          </span>
                          <span
                            className="text-[10px] font-medium shrink-0"
                            style={{ color: slotMeta.accentColor }}
                          >
                            {slotMeta.nameTh}
                          </span>
                        </div>
                        {art ? (
                          <div className="mt-1 space-y-0.5">
                            <div className="text-emerald-300">+ {art.prosTh}</div>
                            <div className="text-rose-300">- {art.consTh}</div>
                          </div>
                        ) : (
                          <div className="text-stone-500 mt-0.5">{slotMeta.focusTh}</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-4">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <div className="text-xs text-stone-300">
                สูตรแกนเวทย์ 2 ธาตุ (+ตัวเร่งธาตุที่ 3) · ค้นพบแล้ว{' '}
                <span className="font-mono-num font-bold text-sky-300">
                  {discoveredCount} / {totalFusions}
                </span>
              </div>
              <div className="flex items-center gap-1 p-0.5 rounded bg-[#08090F] border border-amber-500/25 text-[11px]">
                {(
                  [
                    { id: 'all', label: `ทั้งหมด (${totalFusions})` },
                    { id: 'discovered', label: `ค้นพบแล้ว (${discoveredCount})` },
                    { id: 'undiscovered', label: `ยังไม่พบ (${totalFusions - discoveredCount})` },
                  ] as const
                ).map((flt) => (
                  <button
                    key={flt.id}
                    type="button"
                    onClick={() => setCodexFilter(flt.id)}
                    className={`px-2 py-1 rounded-xs font-medium transition-colors cursor-pointer ${
                      codexFilter === flt.id
                        ? 'bg-amber-500/20 text-amber-200'
                        : 'text-stone-400 hover:text-stone-200'
                    }`}
                  >
                    {flt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[50vh] overflow-y-auto pr-1">
              {filteredFusions.map((fusion) => {
                const known = discoveredSet.has(fusion.key);
                const elA = ELEMENTS[fusion.a];
                const elB = ELEMENTS[fusion.b];
                return (
                  <div
                    key={fusion.key}
                    className={`p-3 rounded-md border transition-colors ${
                      known
                        ? 'gothic-card'
                        : 'bg-[#08090F]/80 border-stone-800/80 opacity-80'
                    }`}
                    style={known ? { borderColor: `${fusion.color}66` } : undefined}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-1.5 text-[11px] font-semibold">
                        <span
                          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-xs bg-[#08090F] border border-stone-700/80"
                          style={{ color: elA.glowColor }}
                        >
                          <span
                            className="w-2 h-2 rounded-xs rotate-45"
                            style={{ backgroundColor: elA.color }}
                          />
                          {elA.nameTh}
                        </span>
                        <span className="text-stone-500">+</span>
                        <span
                          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-xs bg-[#08090F] border border-stone-700/80"
                          style={{ color: elB.glowColor }}
                        >
                          <span
                            className="w-2 h-2 rounded-xs rotate-45"
                            style={{ backgroundColor: elB.color }}
                          />
                          {elB.nameTh}
                        </span>
                      </div>

                      {known ? (
                        <span className="font-mono-num text-[10px] text-sky-300 shrink-0">
                          {fusion.manaCost} MP · {fusion.cooldown}s
                        </span>
                      ) : (
                        <Lock className="w-3.5 h-3.5 text-stone-500 shrink-0" />
                      )}
                    </div>

                    {known ? (
                      <>
                        <div className="text-sm font-bold" style={{ color: fusion.color }}>
                          {fusion.nameTh}
                        </div>
                        <p className="text-[11px] text-stone-300 mt-1 leading-relaxed">
                          {fusion.descTh}
                        </p>
                      </>
                    ) : (
                      <>
                        <div className="text-sm font-bold text-stone-500">??? (ยังไม่ค้นพบ)</div>
                        <p className="text-[11px] text-stone-500 mt-1 leading-relaxed">
                          เล่นจอมเวทย์และเก็บออร์บธาตุ {elA.nameTh} คู่กับ {elB.nameTh} เพื่อปลดล็อกบันทึก
                        </p>
                      </>
                    )}
                  </div>
                );
              })}

              {filteredFusions.length === 0 && (
                <div className="col-span-full py-8 text-center text-xs text-stone-400">
                  ไม่มีสูตรเวทย์ในหมวดหมู่นี้
                </div>
              )}
            </div>
          </div>
        )}

        <div className="mt-5 flex flex-col sm:flex-row gap-2.5">
          <button
            type="button"
            onClick={onResume}
            className="gothic-btn-gold flex-1 py-2.5 rounded font-bold text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>เล่นต่อ (Esc)</span>
          </button>
          <button
            type="button"
            onClick={onQuit}
            className="gothic-btn-iron sm:w-56 py-2.5 px-4 rounded font-medium text-sm transition-colors cursor-pointer"
          >
            กลับหน้าหลัก (เก็บทองแล้ว)
          </button>
        </div>
      </div>
    </div>
  );
};

interface RunSummaryModalProps {
  summary: RunSummary;
  saveData: SaveData;
  onPlayAgain: () => void;
  onOpenShop: () => void;
  onReturnTitle: () => void;
}

export const RunSummaryModal: React.FC<RunSummaryModalProps> = ({
  summary,
  saveData,
  onPlayAgain,
  onOpenShop,
  onReturnTitle,
}) => {
  const race = RACES[summary.raceId];
  const cls = summary.raceClass ? RACE_CLASSES[summary.raceClass] : null;
  const stage = STAGES[summary.stageId];
  const maxDmg = Math.max(1, ...summary.weapons.map((w) => w.totalDamage));
  const masteryInfo = getMasteryLevelInfo(saveData.masteryXpByRace[summary.raceId] || 0);
  const masteryPct = Math.min(
    100,
    Math.round((masteryInfo.currentXp / Math.max(1, masteryInfo.nextLevelXp)) * 100)
  );

  // Closest 2 incomplete unlock quests
  const closestQuests = UNLOCK_QUESTS.filter(
    (q) => !saveData.claimedUnlockQuests.includes(q.id) && q.getProgress(saveData) < q.target
  )
    .map((q) => ({
      def: q,
      progress: q.getProgress(saveData),
      pct: Math.min(99, Math.floor((q.getProgress(saveData) / q.target) * 100)),
    }))
    .sort((a, b) => b.pct - a.pct)
    .slice(0, 2);

  const gb = summary.goldBreakdown;
  const goldRows = [
    { label: 'เก็บเหรียญ & คอมโบ', val: gb.drops },
    { label: 'ถุงทองพิเศษ', val: gb.pouches },
    { label: 'มอนสเตอร์ Elite', val: gb.elites },
    { label: 'บอส & ยมทูต', val: gb.bosses },
    { label: 'โบนัสเวลาที่รอด', val: gb.survival },
    { label: 'ภารกิจในด่าน & Skip', val: gb.quests },
    { label: 'ตัวคูณคำสาป', val: gb.curseBonus },
  ].filter((r) => r.val > 0);

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/82 backdrop-blur-xs p-4">
      <div className="gothic-panel w-full max-w-2xl rounded-lg p-6 max-h-[92vh] overflow-y-auto">
        <div className="flex flex-col items-center text-center">
          <div
            className={`w-14 h-14 rounded-lg flex items-center justify-center mb-3 border ${
              summary.reaperSlain
                ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                : summary.victory
                  ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300'
                  : 'bg-rose-500/20 border-rose-500 text-rose-400'
            }`}
          >
            {summary.victory ? <Trophy className="w-7 h-7" /> : <Skull className="w-7 h-7" />}
          </div>

          <h2 className="font-display text-2xl sm:text-3xl font-bold text-amber-100">
            {summary.reaperSlainCount > 0
              ? `โค่นยมทูต The Reaper ${summary.reaperSlainCount} ครั้ง!`
              : summary.victory
                ? 'เอาชีวิตรอดสำเร็จ!'
                : 'สิ้นสุดการเอาชีวิตรอด'}
          </h2>
          <p className="text-xs sm:text-sm text-stone-400 mt-1">
            {race.nameTh}
            {cls ? ` · ${cls.nameTh}` : ''} · {stage.nameTh} · ระดับมิติ {summary.realmTier} ({summary.biomeNameTh})
            {summary.curseLevel > 0 ? ` · คำสาป Lv.${summary.curseLevel}` : ''}
          </p>
          {!summary.victory && summary.deathCauseTh && (
            <div className="mt-2.5 px-3 py-1 rounded bg-rose-950/60 border border-rose-500/40 text-xs text-rose-200">
              สาเหตุการพ่ายแพ้: <span className="font-semibold text-rose-100">{summary.deathCauseTh}</span>
            </div>
          )}
          {summary.dailyChallengeWon && (
            <div className="mt-2.5 px-3 py-1 rounded bg-amber-500/20 border border-amber-400/50 text-xs text-amber-200 font-semibold">
              ผ่านชาเลนจ์ประจำวันสำเร็จ! ได้รับ +1 ตราผนึก &amp; โบนัสทอง
            </div>
          )}
        </div>

        {/* Stat Summary Grid */}
        <div className="mt-5 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
          <div className="gothic-card p-2.5 rounded text-center">
            <div className="text-[11px] text-stone-400">เวลาที่รอด</div>
            <div className="font-mono-num text-base font-bold text-amber-50 mt-0.5">
              {formatClock(summary.elapsedSeconds)}
            </div>
          </div>
          <div className="gothic-card p-2.5 rounded text-center">
            <div className="text-[11px] text-stone-400">เลเวลสูงสุด</div>
            <div className="font-mono-num text-base font-bold text-sky-300 mt-0.5">
              Lv.{summary.level}
            </div>
          </div>
          <div className="gothic-card p-2.5 rounded text-center">
            <div className="text-[11px] text-stone-400">ศัตรูที่สังหาร</div>
            <div className="font-mono-num text-base font-bold text-amber-50 mt-0.5">
              {summary.kills.toLocaleString()}
            </div>
          </div>
          <div className="gothic-card p-2.5 rounded text-center">
            <div className="text-[11px] text-stone-400">คอมโบสูงสุด</div>
            <div className="font-mono-num text-base font-bold text-orange-300 mt-0.5">
              {summary.maxCombo.toLocaleString()}
            </div>
          </div>
          <div className="gothic-card-active p-2.5 rounded text-center">
            <div className="text-[11px] text-amber-300">ทองที่ได้รับ</div>
            <div className="font-mono-num text-base font-bold text-amber-300 mt-0.5">
              +{summary.goldEarned.toLocaleString()}
            </div>
          </div>
          <div className="gothic-card p-2.5 rounded text-center border-cyan-500/35">
            <div className="text-[11px] text-cyan-300">แก่นวิญญาณ</div>
            <div className="font-mono-num text-base font-bold text-cyan-200 mt-0.5">
              +{summary.soulEssenceEarned.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Gold Breakdown & Extraction ("Bring It Back") */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="p-3.5 rounded-md bg-[#08090F] border border-amber-500/20">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-300 mb-2">
              <Coins className="w-3.5 h-3.5" />
              <span>แหล่งที่มาของทองคำในรอบนี้</span>
            </div>
            {goldRows.length === 0 ? (
              <p className="text-xs text-stone-500">ยังไม่ได้รับทองในรอบนี้</p>
            ) : (
              <div className="space-y-1 text-xs">
                {goldRows.map((row) => (
                  <div key={row.label} className="flex items-center justify-between">
                    <span className="text-stone-400">{row.label}</span>
                    <span className="font-mono-num font-semibold text-amber-200">
                      +{row.val.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="p-3.5 rounded-md bg-[#08090F] border border-amber-500/20 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-purple-300 mb-2">
                {summary.victory ? (
                  <PackageCheck className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <PackageX className="w-3.5 h-3.5 text-rose-400" />
                )}
                <span>สมบัติหีบผนึก (Bring It Back)</span>
              </div>

              {summary.extractedGear.length > 0 ? (
                <div className="space-y-1.5">
                  {summary.extractedGear.map((eg, i) => {
                    const def = PERMANENT_GEAR_CATALOG[eg.defId];
                    const rMeta = RARITY_META[eg.rarity];
                    return (
                      <div
                        key={i}
                        className="flex items-center justify-between text-xs p-1.5 rounded bg-emerald-950/35 border border-emerald-500/35"
                      >
                        <span className="font-semibold truncate" style={{ color: rMeta.color }}>
                          [{rMeta.nameTh}] {def?.nameTh || eg.defId}
                        </span>
                        <span className="text-[11px] text-emerald-300 shrink-0 ml-2">
                          นำกลับแคมป์แล้ว
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : summary.lostChestsCount > 0 ? (
                <p className="text-xs text-rose-300 leading-relaxed">
                  สูญเสียหีบผนึกที่ถือไว้ <strong className="font-mono-num">{summary.lostChestsCount}</strong> ใบ
                  เพราะพ่ายแพ้ก่อนจบด่าน (ต้องรอดถึงเวลาหรือโค่นยมทูตเพื่อนำกลับ!)
                </p>
              ) : (
                <p className="text-xs text-stone-500 leading-relaxed">
                  ไม่พบหีบผนึกในรอบนี้ — ล่ามอนสเตอร์ Elite หรือยมทูตแล้วรอดให้จบด่านเพื่อนำอุปกรณ์ถาวรกลับแคมป์
                </p>
              )}
            </div>

            {summary.completedInRunQuests.length > 0 && (
              <div className="mt-2.5 pt-2 border-t border-stone-800/80 text-[11px] text-emerald-300">
                ผ่านเควสในด่าน {summary.completedInRunQuests.length}/3 ภารกิจ
              </div>
            )}
          </div>
        </div>

        {/* Character Mastery Progress & Quest Progress */}
        <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="p-3.5 rounded-md bg-[#08090F] border border-amber-500/20">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="font-semibold text-amber-200">
                ความชำนาญ {race.nameTh} · Lv.{masteryInfo.level}
              </span>
              <span className="font-mono-num text-emerald-300">
                +{summary.masteryXpGained || 0} EXP
              </span>
            </div>
            <div className="w-full h-2 bg-stone-900 rounded-xs overflow-hidden">
              <div className="h-full bg-amber-400" style={{ width: `${masteryPct}%` }} />
            </div>
            <div className="flex items-center justify-between text-[11px] text-stone-400 mt-1">
              <span>{masteryInfo.titleTh}</span>
              <span className="font-mono-num">
                {masteryInfo.currentXp}/{masteryInfo.nextLevelXp} EXP
              </span>
            </div>
          </div>

          <div className="p-3.5 rounded-md bg-[#08090F] border border-amber-500/20">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-sky-300 mb-1.5">
              <ScrollText className="w-3.5 h-3.5" />
              <span>ความคืบหน้าภารกิจปลดล็อก</span>
            </div>
            {summary.newUnlockQuestNames && summary.newUnlockQuestNames.length > 0 ? (
              <div className="text-xs text-emerald-300 space-y-0.5">
                {summary.newUnlockQuestNames.map((name) => (
                  <div key={name}>ปลดล็อกสำเร็จ: {name} (รับตราผนึกที่โรงเตี๊ยม!)</div>
                ))}
              </div>
            ) : closestQuests.length > 0 ? (
              <div className="space-y-1.5">
                {closestQuests.map(({ def, progress, pct }) => (
                  <div key={def.id} className="text-[11px]">
                    <div className="flex justify-between text-stone-300">
                      <span className="truncate pr-2">{def.titleTh}</span>
                      <span className="font-mono-num text-amber-300 shrink-0">
                        {Math.min(def.target, progress).toLocaleString()}/{def.target.toLocaleString()} ({pct}%)
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-stone-400">
                สังหารบอส {summary.bossesKilled} · Elite {summary.elitesKilled}
              </div>
            )}
          </div>
        </div>

        {/* Weapon Damage Breakdown OR Mage Fusion Summary */}
        {summary.raceId === 'mage' ? (
          <div className="mt-4 p-4 rounded-md bg-[#08090F] border border-amber-500/20">
            <div className="flex items-center justify-between text-xs font-semibold text-stone-300 mb-2">
              <span>วิถีจอมเวทย์มหาธาตุ (ไร้ศาสตราวุธ)</span>
              <span className="font-mono-num text-stone-400">
                บอสที่โค่น: {summary.bossesKilled}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 rounded bg-[#110F18] border border-indigo-500/35">
              <div className="flex items-center gap-2 text-xs text-stone-200">
                <Sparkles className="w-4 h-4 text-sky-300 shrink-0" />
                <span>จำนวนการผสานธาตุสำเร็จทั้งหมด</span>
              </div>
              <span className="font-mono-num text-base font-bold text-sky-300">
                {(summary.mageFusionCount ?? 0).toLocaleString()} ครั้ง
              </span>
            </div>
          </div>
        ) : (
          <div className="mt-4 p-4 rounded-md bg-[#08090F] border border-amber-500/20">
            <div className="flex items-center justify-between text-xs font-semibold text-stone-300 mb-3">
              <span>สรุปความเสียหายอาวุธทั้ง 4 ช่อง</span>
              <span className="font-mono-num text-stone-400">
                บอสที่โค่น: {summary.bossesKilled}
              </span>
            </div>

            <div className="space-y-2.5">
              {summary.weapons.map((w) => {
                const def = WEAPONS[w.id];
                const pct = Math.round((w.totalDamage / maxDmg) * 100);
                return (
                  <div key={w.id} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <WeaponIcon id={w.id} evolved={w.evolved} className="w-5 h-5" />
                        <span className={w.evolved ? 'text-amber-300 font-semibold' : 'text-stone-200'}>
                          {w.evolved ? def.evolvedNameTh : def.nameTh}
                        </span>
                        <span className="font-mono-num text-[11px] text-stone-400">
                          {w.evolved ? 'EVO' : `Lv.${w.level}`}
                        </span>
                      </div>
                      <span className="font-mono-num text-amber-100 font-semibold">
                        {w.totalDamage.toLocaleString()}
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-stone-900 rounded-xs overflow-hidden">
                      <div
                        className={w.evolved ? 'h-full bg-amber-400' : 'h-full bg-sky-400'}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Equipped Artifacts Summary */}
        <div className="mt-4 p-4 rounded-md bg-[#08090F] border border-amber-500/20">
          <div className="text-xs font-semibold text-purple-300 mb-2.5">
            เครื่องราง Artifact ที่สวมใส่ (5 ช่อง)
          </div>
          <div className="grid grid-cols-5 gap-2">
            {ARTIFACT_SLOT_ORDER.map((slot) => {
              const slotMeta = ARTIFACT_SLOTS[slot];
              const artId = summary.artifacts?.[slot];
              const art = artId ? ARTIFACTS[artId] : null;
              return (
                <div
                  key={slot}
                  className="gothic-card flex flex-col items-center text-center p-2 rounded"
                  title={
                    art
                      ? `${art.nameTh}\nผลดี: ${art.prosTh}\nข้อเสีย: ${art.consTh}`
                      : `${slotMeta.nameTh} (ว่าง)`
                  }
                >
                  <div
                    className="w-8 h-8 rounded bg-[#08090F] border flex items-center justify-center mb-1"
                    style={{
                      borderColor: art ? `${art.color}66` : 'rgba(120, 113, 108, 0.45)',
                      color: art ? art.color : '#57534E',
                    }}
                  >
                    {art ? (
                      <ArtifactIcon id={art.id} className="w-6 h-6" />
                    ) : (
                      <ArtifactSlotEmptyIcon slot={slot} className="w-4 h-4" />
                    )}
                  </div>
                  <div className="text-[10px] font-medium" style={{ color: slotMeta.accentColor }}>
                    {slotMeta.nameTh}
                  </div>
                  <div className="text-[10px] text-stone-200 truncate w-full mt-0.5">
                    {art ? art.nameTh : 'ว่าง'}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          <button
            type="button"
            onClick={onOpenShop}
            className="gothic-btn-iron py-2.5 px-4 rounded text-amber-300 font-semibold text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <Shield className="w-4 h-4" />
            <span>แคมป์ผู้รอดชีวิต</span>
          </button>
          <button
            type="button"
            onClick={onPlayAgain}
            className="gothic-btn-gold py-2.5 px-4 rounded font-bold text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>เล่นอีกครั้ง</span>
          </button>
          <button
            type="button"
            onClick={onReturnTitle}
            className="gothic-btn-iron py-2.5 px-4 rounded font-medium text-sm transition-colors cursor-pointer"
          >
            หน้าหลัก
          </button>
        </div>
      </div>
    </div>
  );
};

interface ClassEvolutionModalProps {
  raceId: RaceId;
  onSelect: (classId: RaceClassId) => void;
}

export const ClassEvolutionModal: React.FC<ClassEvolutionModalProps> = ({
  raceId,
  onSelect,
}) => {
  const race = RACES[raceId];
  const classes = getClassesForRace(raceId);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === '1' && classes[0]) onSelect(classes[0].id);
      if (e.key === '2' && classes[1]) onSelect(classes[1].id);
      if (e.key === '3' && classes[2]) onSelect(classes[2].id);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [classes, onSelect]);

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/82 backdrop-blur-xs p-4">
      <div className="gothic-panel w-full max-w-4xl rounded-lg border-amber-400/70 overflow-hidden">
        <div className="flex flex-col items-center text-center px-6 pt-6 pb-4 border-b border-amber-500/25 bg-[#0A090F]/75">
          <div className="w-12 h-12 rounded-md bg-amber-500/15 border border-amber-400/55 flex items-center justify-center text-amber-300 mb-2">
            <Crown className="w-6 h-6" />
          </div>
          <h2 className="font-display text-2xl font-bold text-amber-300 tracking-wide">
            วิวัฒนาการสายอาชีพ (Lv.20) · {race.nameTh}
          </h2>
          <p className="text-xs sm:text-sm text-stone-300 mt-1">
            เลือกสายอาชีพขั้นสูง 1 สายเพื่อปลดล็อกสกิลเฉพาะตัวและพลังติดตัวถาวรตลอดรอบนี้ (กด 1, 2 หรือ 3)
          </p>
        </div>

        <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-4">
          {classes.map((cls, idx) => (
            <button
              key={cls.id}
              type="button"
              onClick={() => onSelect(cls.id)}
              className="gothic-card group flex flex-col justify-between text-left p-4 rounded-md hover:border-amber-400 transition-transform duration-150 hover:-translate-y-0.5 cursor-pointer"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2.5">
                  <div
                    className="w-10 h-10 rounded border flex items-center justify-center shrink-0"
                    style={{
                      backgroundColor: `${cls.color}18`,
                      borderColor: `${cls.color}66`,
                      color: cls.color,
                    }}
                  >
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <span className="font-mono-num text-xs text-amber-300/80">[{idx + 1}]</span>
                </div>

                <div className="text-xs font-medium" style={{ color: cls.color }}>
                  {cls.roleTh}
                </div>
                <h3 className="text-lg font-bold text-amber-50 mt-0.5">{cls.nameTh}</h3>
                <div className="text-[11px] text-stone-400">{cls.nameEn}</div>

                <div className="mt-3 p-2.5 rounded bg-[#08090F] border border-amber-500/20 text-xs text-stone-200 leading-relaxed">
                  <div className="text-[11px] font-semibold text-amber-300 mb-1">
                    สกิลเอกลักษณ์
                  </div>
                  {cls.activeSkillTh}
                </div>
              </div>

              <div className="mt-3 pt-2.5 border-t border-amber-500/15 text-[11px] text-stone-300 leading-relaxed">
                <span className="text-stone-400">โบนัสสาย: </span>
                {cls.passiveTh}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

interface SinContractModalProps {
  level: number;
  choices: SinContractChoice[];
  activeSins: Array<{ sinId: SinId; level: number }>;
  maxSlots: number;
  onSelect: (sinId: SinId, banishSinId?: SinId) => void;
}

export const SinContractModal: React.FC<SinContractModalProps> = ({
  level,
  choices,
  activeSins,
  maxSlots,
  onSelect,
}) => {
  const [pendingReplaceFor, setPendingReplaceFor] = useState<SinId | null>(null);

  const handlePick = (choice: SinContractChoice) => {
    const isAlreadyActive = activeSins.some((s) => s.sinId === choice.sinId);
    if (!isAlreadyActive && activeSins.length >= maxSlots) {
      setPendingReplaceFor(choice.sinId);
      return;
    }
    onSelect(choice.sinId);
  };

  useEffect(() => {
    if (pendingReplaceFor) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === '1' && choices[0]) handlePick(choices[0]);
      if (e.key === '2' && choices[1]) handlePick(choices[1]);
      if (e.key === '3' && choices[2]) handlePick(choices[2]);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  if (pendingReplaceFor) {
    const incoming = SEVEN_SINS[pendingReplaceFor];
    return (
      <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/84 backdrop-blur-xs p-4">
        <div className="gothic-panel w-full max-w-3xl rounded-lg border-purple-400/70 overflow-hidden">
          <div className="flex flex-col items-center text-center px-6 pt-5 pb-4 border-b border-purple-500/25 bg-[#0A090F]/80">
            <h2 className="font-display text-2xl font-bold text-purple-200 tracking-wide">
              สลับพันธสัญญาบาป (ครบ {activeSins.length}/{maxSlots} ตนแล้ว)
            </h2>
            <p className="text-xs sm:text-sm text-stone-300 mt-1">
              กำลังทำสัญญากับ{' '}
              <span className="font-bold" style={{ color: incoming.color }}>
                {incoming.sinNameTh} · {incoming.demonNameTh}
              </span>{' '}
              — เลือกบาปที่จะส่งกลับ (ยังเก็บเลเวลไว้ใช้ในท่าไม้ตาย &ldquo;พิธีบาปทั้งเจ็ด&rdquo;)
            </p>
          </div>

          <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-3.5">
            {activeSins.map((slot) => {
              const def = SEVEN_SINS[slot.sinId];
              return (
                <button
                  key={slot.sinId}
                  type="button"
                  onClick={() => onSelect(pendingReplaceFor, slot.sinId)}
                  className="gothic-card flex flex-col justify-between text-left p-4 rounded-md hover:border-rose-400 transition-transform duration-150 hover:-translate-y-0.5 cursor-pointer"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold" style={{ color: def.color }}>
                        {def.sinNameTh}
                      </span>
                      <span className="font-mono-num text-xs text-amber-300">Lv.{slot.level}</span>
                    </div>
                    <h3 className="text-base font-bold text-amber-50">{def.demonNameTh}</h3>
                    <p className="text-xs text-stone-400 mt-1">{def.roleTh}</p>
                    <p className="text-[11px] text-stone-300 mt-2 leading-relaxed">
                      {slot.level >= 3 ? def.lv3DescTh : def.lv1DescTh}
                    </p>
                  </div>
                  <div className="mt-3 pt-2 border-t border-rose-500/25 text-xs font-bold text-rose-300">
                    ส่งตนนี้กลับและอัญเชิญ {incoming.demonNameTh}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="px-5 pb-4 flex justify-end">
            <button
              type="button"
              onClick={() => setPendingReplaceFor(null)}
              className="gothic-btn-iron px-4 py-2 rounded text-xs font-semibold cursor-pointer"
            >
              ย้อนกลับไปเลือกใหม่
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/84 backdrop-blur-xs p-4">
      <div
        className={`gothic-panel w-full rounded-lg border-purple-400/70 overflow-hidden ${
          choices.length >= 3 ? 'max-w-4xl' : 'max-w-2xl'
        }`}
      >
        <div className="flex flex-col items-center text-center px-6 pt-6 pb-4 border-b border-purple-500/25 bg-[#0A090F]/80">
          <div className="w-12 h-12 rounded-md bg-purple-500/15 border border-purple-400/60 flex items-center justify-center text-purple-300 mb-2">
            <Sparkles className="w-6 h-6" />
          </div>
          <h2 className="font-display text-2xl font-bold text-purple-200 tracking-wide">
            ทำสัญญาบาปทั้งเจ็ด (Lv.{level})
          </h2>
          <p className="text-xs sm:text-sm text-stone-300 mt-1">
            {activeSins.length === 0
              ? 'เลือกจอมปีศาจแห่งบาปตนแรกเข้าสู่พันธสัญญา (กด 1, 2 หรือ 3)'
              : `เลือกอัญเชิญบาปตนใหม่หรืออัปเกรดบาปเดิม (อัญเชิญพร้อมกันสูงสุด ${maxSlots} ตน · กด 1–${choices.length})`}
          </p>
        </div>

        <div
          className={`p-5 grid grid-cols-1 gap-4 ${
            choices.length >= 3 ? 'md:grid-cols-3' : 'md:grid-cols-2'
          }`}
        >
          {choices.map((choice, idx) => {
            const def = SEVEN_SINS[choice.sinId];
            return (
              <button
                key={choice.sinId}
                type="button"
                onClick={() => handlePick(choice)}
                className="gothic-card group flex flex-col justify-between text-left p-4 rounded-md hover:border-purple-400 transition-transform duration-150 hover:-translate-y-0.5 cursor-pointer"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2.5">
                    <span
                      className="px-2 py-0.5 rounded-xs text-[11px] font-bold border"
                      style={{
                        backgroundColor: `${def.color}20`,
                        borderColor: `${def.color}70`,
                        color: def.color,
                      }}
                    >
                      {choice.isNew
                        ? 'พันธสัญญาใหม่ Lv.1'
                        : `อัปเกรด Lv.${choice.nextLevel - 1} → Lv.${choice.nextLevel}`}
                    </span>
                    <span className="font-mono-num text-xs text-amber-300/80">[{idx + 1}]</span>
                  </div>

                  <div className="text-xs font-semibold" style={{ color: def.color }}>
                    {def.sinNameTh}
                  </div>
                  <h3 className="text-lg font-bold text-amber-50 mt-0.5">{def.demonNameTh}</h3>
                  <div className="text-[11px] text-stone-400 mb-2.5">{def.roleTh}</div>

                  <div className="space-y-2 text-xs leading-relaxed">
                    <div className="p-2.5 rounded bg-[#08090F] border border-amber-500/20 text-stone-200">
                      <span className="font-bold text-amber-300">Lv.1: </span>
                      {def.lv1DescTh}
                    </div>
                    <div className="p-2.5 rounded bg-purple-950/35 border border-purple-500/35 text-purple-100">
                      <span className="font-bold text-purple-300">Lv.3: </span>
                      {def.lv3DescTh}
                    </div>
                  </div>
                </div>

                <div className="mt-3 pt-2.5 border-t border-amber-500/15 space-y-1 text-[11px]">
                  <div className="text-sky-300">
                    <span className="text-stone-400">พลังบาปจาก: </span>
                    {def.gaugeSourceTh}
                  </div>
                  <div className="text-rose-300">
                    <span className="text-stone-400">ราคาของบาป: </span>
                    {def.drawbackTh}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
