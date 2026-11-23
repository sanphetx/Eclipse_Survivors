import React from 'react';
import {
  AlertTriangle,
  Bot,
  Clock,
  CloudFog,
  CloudLightning,
  CloudRain,
  Coins,
  Compass,
  Crown,
  Droplets,
  FastForward,
  Flame,
  FlaskConical,
  Heart,
  Hourglass,
  Lock,
  Moon,
  Pause,
  PawPrint,
  ScrollText,
  Shield,
  Skull,
  Snowflake,
  Sparkles,
  Sun,
  Swords,
  Volume2,
  VolumeX,
  Wind,
  Zap,
} from 'lucide-react';
import {
  ARTIFACT_SLOT_ORDER,
  ARTIFACT_SLOTS,
  ARTIFACTS,
  BOSS_BUFFS,
  ELEMENT_CATALYSTS,
  ELEMENTS,
  formatClock,
  getClassesForRace,
  getElementFusion,
  RACE_CLASSES,
  RACES,
  RELICS,
  SEVEN_SINS,
  WEAPONS,
} from '../game/data';
import { PETS, POTIONS } from '../game/metaData';
import { AudioVolumeSettings, BotMode, HudSnapshot, RaceClassId, RaceId } from '../game/types';
import { AudioSettingsPopoverButton } from './AudioSettingsPanel';
import { ArtifactIcon, ArtifactSlotEmptyIcon, RelicIcon, WeaponIcon } from './GameIcons';

interface GameHudProps {
  hud: HudSnapshot;
  raceId: RaceId;
  simSpeed: number;
  botMode: BotMode;
  botTargetClass: RaceClassId | 'auto';
  muted: boolean;
  volumes: AudioVolumeSettings;
  onToggleSpeed: () => void;
  onCycleBotMode: () => void;
  onSelectBotTargetClass: (target: RaceClassId | 'auto') => void;
  onToggleMute: () => void;
  onChangeVolumes: (patch: Partial<AudioVolumeSettings>) => void;
  onPause: () => void;
  onTriggerDash: () => void;
  onTriggerVoidInfusion: () => void;
  onTriggerActiveSkill: () => void;
  onTriggerPotion?: () => void;
  onStartHoldActiveSkill?: () => void;
  onReleaseHoldActiveSkill?: () => void;
}

// ===== Combo Meter =====
const COMBO_TIERS = [
  { min: 0, color: '#CBD5E1', glow: 'rgba(203,213,225,0.25)', label: '' },
  { min: 50, color: '#FBBF24', glow: 'rgba(251,191,36,0.55)', label: 'ดุดัน' },
  { min: 100, color: '#FB923C', glow: 'rgba(251,146,60,0.6)', label: 'คลั่ง' },
  { min: 250, color: '#F43F5E', glow: 'rgba(244,63,94,0.65)', label: 'นองเลือด' },
  { min: 500, color: '#E879F9', glow: 'rgba(232,121,249,0.7)', label: 'ไร้เทียมทาน' },
  { min: 1000, color: '#22D3EE', glow: 'rgba(34,211,238,0.75)', label: 'ตำนาน' },
  { min: 2500, color: '#A3E635', glow: 'rgba(163,230,53,0.75)', label: 'เทพสงคราม' },
  { min: 5000, color: '#FDE047', glow: 'rgba(253,224,71,0.85)', label: 'สุริยคราส' },
  { min: 10000, color: '#FFFFFF', glow: 'rgba(255,255,255,0.9)', label: 'เหนือยมทูต' },
];

const getComboTier = (combo: number) => {
  let tier = COMBO_TIERS[0];
  for (const t of COMBO_TIERS) if (combo >= t.min) tier = t;
  return tier;
};

const ComboMeter: React.FC<{ hud: HudSnapshot }> = ({ hud }) => {
  const showBreak = hud.comboBreakId > 0 && hud.combo === 0;
  if (hud.combo <= 0 && !showBreak) return null;
  const tier = getComboTier(hud.combo);
  const nextMilestone = COMBO_TIERS.find((t) => t.min > hud.combo)?.min;
  const prevMilestone = tier.min;
  const progress = nextMilestone
    ? Math.max(0, Math.min(100, ((hud.combo - prevMilestone) / (nextMilestone - prevMilestone)) * 100))
    : 100;
  const scale = 1 + Math.min(0.45, Math.log10(Math.max(1, hud.combo)) * 0.11);

  return (
    <div className="absolute right-3 sm:right-6 top-[38%] -translate-y-1/2 flex flex-col items-end select-none">
      {hud.combo > 0 ? (
        <>
          <div
            className="text-[10px] sm:text-xs font-bold tracking-[0.25em] uppercase"
            style={{ color: tier.color, textShadow: `0 0 8px ${tier.glow}` }}
          >
            COMBO{tier.label ? ` · ${tier.label}` : ''}
          </div>
          <div
            key={`combo-pulse-${hud.combo >= 50 ? Math.floor(hud.combo / 10) : hud.combo}`}
            className="font-mono-num font-black leading-none combo-pulse"
            style={{
              fontSize: `${2 * scale}rem`,
              color: tier.color,
              textShadow: `0 0 14px ${tier.glow}, 0 2px 0 rgba(0,0,0,0.6)`,
            }}
          >
            {hud.combo.toLocaleString()}
            <span className="text-[0.55em] ml-0.5 opacity-80">x</span>
          </div>
          <div className="mt-1 h-1 w-24 sm:w-28 rounded-full bg-black/50 overflow-hidden">
            <div
              className="h-full rounded-full transition-[width] duration-150"
              style={{ width: `${progress}%`, background: tier.color }}
            />
          </div>
          {nextMilestone && (
            <div className="mt-0.5 text-[10px] text-slate-400 font-mono-num">
              ถัดไป {nextMilestone}x
            </div>
          )}
          {hud.comboMilestone > 0 && (
            <div
              key={`combo-burst-${hud.comboMilestoneId}`}
              className="absolute right-0 -top-10 sm:-top-12 font-black combo-burst whitespace-nowrap"
              style={{
                fontSize: hud.comboMilestone >= 1000 ? '2.4rem' : '1.9rem',
                color: getComboTier(hud.comboMilestone).color,
                textShadow: `0 0 22px ${getComboTier(hud.comboMilestone).glow}, 0 3px 0 rgba(0,0,0,0.7)`,
              }}
            >
              {hud.comboMilestone.toLocaleString()}x!
            </div>
          )}
        </>
      ) : (
        <div key={`combo-break-${hud.comboBreakId}`} className="combo-break text-right">
          <div className="text-xs sm:text-sm font-black tracking-widest text-rose-400">
            COMBO BREAK
          </div>
          <div className="text-[11px] text-slate-400 font-mono-num">
            เสีย {hud.comboBrokenAt.toLocaleString()}x · สูงสุด {hud.comboBest.toLocaleString()}x
          </div>
        </div>
      )}
    </div>
  );
};

export const GameHud: React.FC<GameHudProps> = ({
  hud,
  raceId,
  simSpeed,
  botMode,
  botTargetClass,
  muted,
  volumes,
  onToggleSpeed,
  onCycleBotMode,
  onSelectBotTargetClass,
  onToggleMute,
  onChangeVolumes,
  onPause,
  onTriggerDash,
  onTriggerVoidInfusion,
  onTriggerActiveSkill,
  onTriggerPotion,
  onStartHoldActiveSkill,
  onReleaseHoldActiveSkill,
}) => {
  const xpPct = Math.min(100, Math.round((hud.xp / Math.max(1, hud.xpToNext)) * 100));
  const hpPct = Math.max(0, Math.min(100, (hud.hp / Math.max(1, hud.maxHp)) * 100));
  const manaPct = Math.max(0, Math.min(100, (hud.mana / Math.max(1, hud.maxMana)) * 100));
  const race = RACES[raceId];
  const evolvedClass = hud.raceClass ? RACE_CLASSES[hud.raceClass] : null;
  const isSpellblade = hud.raceClass === 'spellblade_god' || hud.raceClass === 'voidless_blade';

  return (
    <div className="fixed inset-0 z-10 pointer-events-none flex flex-col justify-between">
      <ComboMeter hud={hud} />
      {/* Top EXP Progress Bar */}
      <div className="w-full">
        <div className="relative h-2.5 w-full bg-[#07080D] border-b border-amber-500/35 shadow-[0_2px_10px_rgba(0,0,0,0.8)]">
          <div
            className="h-full bg-gradient-to-r from-sky-500 via-cyan-300 to-amber-300 transition-[width] duration-150"
            style={{ width: `${xpPct}%` }}
          />
        </div>

        {/* Top Bar Perimeter Clusters */}
        <div className="flex items-start justify-between gap-4 px-3 pt-2.5 sm:px-5">
          {/* Top-Left: Mage Elemental Queue & Active Fusions OR 4 Weapon + 4 Relic Slots + 5 Artifact Slots */}
          <div className="flex flex-col gap-1.5 items-start">
            {hud.usesMana ? (
              <div className="flex flex-col gap-1.5 max-w-[265px] sm:max-w-[320px]">
                {/* Elemental Queue (3 slots: 2 Core Prep + 1 Ritual Seal) */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  {[0, 1, 2].map((slotIdx) => {
                    const elId = hud.heldElements[slotIdx];
                    const elDef = elId ? ELEMENTS[elId] : null;
                    const slotLocked = slotIdx === 2 && hud.fusionCooldown > 0.05;
                    return (
                      <div
                        key={slotIdx}
                        className={`gothic-hud-box h-8 px-2.5 rounded flex items-center gap-1.5 transition-opacity ${
                          slotLocked ? 'opacity-55' : ''
                        }`}
                        style={{
                          borderColor: elDef
                            ? elDef.color
                            : slotIdx === 2
                              ? slotLocked
                                ? 'rgba(100, 116, 139, 0.45)'
                                : 'rgba(192, 132, 252, 0.55)'
                              : 'rgba(164, 132, 76, 0.34)',
                        }}
                        title={
                          elDef
                            ? `ธาตุช่อง ${slotIdx + 1}: ${elDef.nameTh}`
                            : slotIdx === 2
                              ? slotLocked
                                ? 'ติดคูลดาวน์พิธีกรรม — ยังผสานธาตุที่ 3 ไม่ได้'
                                : 'ธาตุที่ 3 (ตัวเร่งตรีธาตุและปิดผนึกเวทย์)'
                              : 'เก็บออร์บธาตุจากพื้นเพื่อเตรียมผสานเวทย์'
                        }
                      >
                        {elDef ? (
                          <>
                            <span
                              className="w-2.5 h-2.5 rounded-xs rotate-45 shrink-0"
                              style={{ backgroundColor: elDef.color }}
                            />
                            <span className="text-xs font-bold text-amber-50 whitespace-nowrap">
                              {elDef.nameTh}
                            </span>
                          </>
                        ) : (
                          <span className="text-[11px] text-stone-400 whitespace-nowrap">
                            {slotIdx === 2 ? (slotLocked ? 'ล็อกพิธี' : 'เร่ง 3') : `ธาตุ ${slotIdx + 1}`}
                          </span>
                        )}
                      </div>
                    );
                  })}
                  <span className="gothic-hud-box text-[11px] font-mono-num text-amber-300 px-2 py-0.5 rounded whitespace-nowrap">
                    ผสม {hud.mageFusionCount}
                  </span>
                  <span
                    className={`gothic-hud-box text-[10px] font-medium px-2 py-0.5 rounded whitespace-nowrap ${
                      hud.mageNextBonusIn === 1 ? 'text-emerald-200 border-emerald-400/70' : 'text-stone-300'
                    }`}
                    title={
                      isSpellblade
                        ? 'ทุกการผสมครบ 3 ครั้ง จะใช้เวทย์ก่อนหน้าซ้ำฟรีทันที 1 ครั้ง!'
                        : 'ทุกการผสมครบ 3 ครั้ง จะเสกบาเรียวายุกันดาเมจและผลักศัตรู!'
                    }
                  >
                    {isSpellblade ? 'ร่ายซ้ำฟรี' : 'บาเรีย'}: อีก {hud.mageNextBonusIn}
                  </span>
                </div>

                {/* Global Ritual Cooldown Bar */}
                {hud.fusionCooldown > 0.05 && (
                  <div className="gothic-hud-box px-2.5 py-1 rounded border-indigo-400/45">
                    <div className="flex items-center justify-between text-[11px] gap-2">
                      <span className="text-indigo-300 font-medium truncate">
                        คูลดาวน์พิธีกรรม (ห้ามผสาน)
                      </span>
                      <span className="font-mono-num font-bold text-indigo-200 shrink-0">
                        {hud.fusionCooldown.toFixed(1)}s
                      </span>
                    </div>
                    <div className="mt-1 h-1 w-full bg-stone-950 rounded-xs overflow-hidden">
                      <div
                        className="h-full bg-indigo-400 transition-[width] duration-75"
                        style={{
                          width: `${Math.max(
                            0,
                            Math.min(
                              100,
                              (1 - hud.fusionCooldown / Math.max(0.1, hud.fusionMaxCooldown)) * 100
                            )
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* Live 2/3 Base Spell Preview */}
                {hud.heldElements.length === 2 &&
                  (() => {
                    const preview = getElementFusion(hud.heldElements[0], hud.heldElements[1]);
                    const estCost = Math.max(4, Math.round(preview.manaCost * 0.85));
                    const cooling = hud.fusionCooldown > 0.05;
                    return (
                      <div
                        className="gothic-hud-box px-2.5 py-1 rounded text-[11px] flex items-center justify-between gap-2"
                        style={{ borderColor: `${preview.color}88` }}
                      >
                        <span className="truncate font-semibold" style={{ color: preview.color }}>
                          {cooling ? `เตรียม: ${preview.nameTh}` : `รอธาตุ 3: ${preview.nameTh}`}
                        </span>
                        <span className="font-mono-num text-[10px] text-sky-300 shrink-0">
                          ~{estCost} MP
                        </span>
                      </div>
                    );
                  })()}

                {/* Active Fusions / Spellblade Sword Buffs */}
                <div className="flex flex-col gap-1">
                  {Array.from({ length: isSpellblade ? 3 : 2 }).map((_, idx) => {
                    const spell = hud.activeFusions[idx];
                    if (!spell) {
                      return (
                        <div
                          key={idx}
                          className="gothic-hud-box px-2.5 py-1 rounded text-[11px] text-stone-500 opacity-75"
                        >
                          {isSpellblade
                            ? `บัพดาบตรีธาตุ ${idx + 1} (ว่าง)`
                            : `ช่องเวทย์ตรีธาตุ ${idx + 1} (ว่าง)`}
                        </div>
                      );
                    }
                    const elA = ELEMENTS[spell.a];
                    const elB = ELEMENTS[spell.b];
                    const elC = spell.catalyst ? ELEMENTS[spell.catalyst] : null;
                    const catDef = spell.catalyst ? ELEMENT_CATALYSTS[spell.catalyst] : null;
                    const durPct = Math.max(
                      0,
                      Math.min(100, (spell.remaining / Math.max(1, spell.maxDuration)) * 100)
                    );
                    return (
                      <div
                        key={`${spell.key}-${idx}`}
                        className="gothic-hud-box px-2.5 py-1 rounded"
                        style={{ borderColor: `${spell.color}99` }}
                      >
                        <div className="flex items-center justify-between gap-2 text-[11px]">
                          <div className="flex items-center gap-1 min-w-0">
                            <span
                              className="w-2 h-2 rounded-xs rotate-45 shrink-0"
                              style={{ backgroundColor: elA.color }}
                            />
                            <span
                              className="w-2 h-2 rounded-xs rotate-45 shrink-0"
                              style={{ backgroundColor: elB.color }}
                            />
                            {elC && (
                              <span
                                className="w-2 h-2 rounded-xs rotate-45 shrink-0 ring-1 ring-white/50"
                                style={{ backgroundColor: elC.color }}
                              />
                            )}
                            <span className="font-semibold text-amber-50 truncate">
                              {spell.nameTh}
                            </span>
                            {spell.voidInfused && (
                              <span className="px-1 py-0.2 rounded-xs bg-purple-950/90 border border-purple-400/70 text-[9px] font-bold text-purple-200 shrink-0">
                                VOID
                              </span>
                            )}
                          </div>
                          <span className="font-mono-num text-[10px] text-sky-300 shrink-0">
                            {isSpellblade ? 'บัพดาบ' : `-${spell.manaCost} MP`}
                          </span>
                        </div>
                        {catDef && (
                          <div className="mt-0.5 flex items-center justify-between text-[10px] text-stone-300">
                            <span style={{ color: catDef.color }}>{catDef.nameTh}</span>
                            {spell.resonance && (
                              <span className="text-amber-300/90">
                                {spell.resonance === 'triple'
                                  ? 'มหาธาตุบริสุทธิ์'
                                  : spell.resonance === 'harmony'
                                    ? 'ตรีธาตุประสาน'
                                    : 'ธาตุพ้องคู่'}
                              </span>
                            )}
                          </div>
                        )}
                        <div className="mt-1 h-1 w-full bg-stone-950 rounded-xs overflow-hidden">
                          <div
                            className="h-full transition-[width] duration-150"
                            style={{ width: `${durPct}%`, backgroundColor: spell.color }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-1.5">
                  {Array.from({ length: 4 }).map((_, idx) => {
                    const w = hud.weapons[idx];
                    const def = w ? WEAPONS[w.id] : null;
                    return (
                      <div
                        key={idx}
                        className={`gothic-hud-box relative w-10 h-10 rounded flex items-center justify-center ${
                          w?.evolved
                            ? 'border-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.3)]'
                            : w
                              ? 'border-amber-500/45'
                              : 'opacity-45'
                        }`}
                        title={def ? (w.evolved ? def.evolvedNameTh : def.nameTh) : 'ช่องอุปกรณ์ว่าง'}
                      >
                        {w ? (
                          <>
                            <WeaponIcon id={w.id} evolved={w.evolved} className="w-7 h-7" />
                            <span
                              className={`absolute -bottom-1 -right-1 px-1 rounded-xs text-[9px] font-mono-num font-bold leading-tight ${
                                w.evolved
                                  ? 'bg-amber-400 text-stone-950'
                                  : 'bg-[#0A090F] text-amber-100 border border-amber-500/45'
                              }`}
                            >
                              {w.evolved ? 'EVO' : `L${w.level}`}
                            </span>
                          </>
                        ) : (
                          <span className="text-[10px] font-mono-num text-stone-600">{idx + 1}</span>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="flex items-center gap-1.5">
                  {Array.from({ length: 4 }).map((_, idx) => {
                    const r = hud.relics[idx];
                    const def = r ? RELICS[r.id] : null;
                    return (
                      <div
                        key={idx}
                        className={`gothic-hud-box relative w-8 h-8 rounded flex items-center justify-center ${
                          r ? 'border-amber-500/40' : 'opacity-40'
                        }`}
                        title={def ? def.nameTh : 'ช่องเครื่องรางว่าง'}
                      >
                        {r ? (
                          <>
                            <RelicIcon id={r.id} className="w-5 h-5" />
                            <span className="absolute -bottom-1 -right-1 px-1 rounded-xs bg-[#0A090F] text-[9px] font-mono-num text-amber-100 border border-amber-500/40 leading-tight">
                              {r.level}
                            </span>
                          </>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 5-Slot Artifact Equipment Strip (หมวก · สร้อย · ชุด · รองเท้า · แหวน) */}
            <div className="pointer-events-auto flex items-center gap-1" title="ช่องสวมใส่ Artifact ทั้ง 5 ช่อง">
              {ARTIFACT_SLOT_ORDER.map((slot) => {
                const slotMeta = ARTIFACT_SLOTS[slot];
                const artId = hud.artifacts[slot];
                const art = artId ? ARTIFACTS[artId] : null;
                return (
                  <div
                    key={slot}
                    className={`gothic-hud-box relative w-8 h-8 rounded flex items-center justify-center transition-colors ${
                      art ? '' : 'opacity-60'
                    }`}
                    style={
                      art
                        ? {
                            borderColor: `${art.color}AA`,
                            boxShadow: `0 0 10px ${art.color}2E`,
                          }
                        : undefined
                    }
                    title={
                      art
                        ? `[${slotMeta.nameTh}] ${art.nameTh}\nผลดี: ${art.prosTh}\nข้อเสีย: ${art.consTh}`
                        : `[${slotMeta.nameTh}] ว่าง (${slotMeta.focusTh})`
                    }
                  >
                    {art ? (
                      <ArtifactIcon id={art.id} className="w-6 h-6" />
                    ) : (
                      <ArtifactSlotEmptyIcon slot={slot} className="w-3.5 h-3.5 text-stone-500" />
                    )}
                    <span
                      className="absolute -bottom-1 left-1/2 -translate-x-1/2 px-1 rounded-xs bg-[#07080D] border border-amber-500/30 text-[8px] font-medium leading-tight whitespace-nowrap"
                      style={{ color: art ? art.color : '#78716C' }}
                    >
                      {slotMeta.nameTh}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Top-Center: Clock, Day/Night Phase, Level, Boss HP */}
          <div className="flex flex-col items-center gap-1">
            <div className="gothic-hud-box flex items-center gap-3 px-4 py-1.5 rounded-md">
              <div className="flex items-center gap-1.5">
                {hud.isNight ? (
                  <Moon className="w-4 h-4 text-indigo-300" />
                ) : (
                  <Sun className="w-4 h-4 text-amber-300" />
                )}
                <span className="text-xs font-medium text-amber-100 whitespace-nowrap">
                  {hud.isNight ? 'กลางคืน' : 'กลางวัน'}
                </span>
              </div>

              <span className="text-amber-500/40" aria-hidden="true">·</span>

              <span className="font-mono-num text-lg sm:text-xl font-bold tracking-tight text-amber-50">
                {formatClock(hud.elapsedSeconds)}
              </span>

              <span className="text-amber-500/40" aria-hidden="true">·</span>

              <span className="font-mono-num text-xs font-bold text-amber-300 whitespace-nowrap">
                LV.{hud.level}
              </span>
            </div>

            {/* Active Realm, Biome & Weather Indicator */}
            <div className="gothic-hud-box flex flex-wrap items-center justify-center gap-x-2 gap-y-0.5 px-3 py-0.5 rounded text-[11px] text-stone-200">
              <div className="flex items-center gap-1.5">
                <Compass className="w-3 h-3 shrink-0" style={{ color: hud.biomeAccentHex }} />
                <span className="font-semibold" style={{ color: hud.biomeAccentHex }}>
                  ระดับ {hud.realmTier}
                </span>
                <span className="text-stone-500" aria-hidden="true">·</span>
                <span>{hud.biomeNameTh}</span>
              </div>
              <span className="text-stone-600" aria-hidden="true">/</span>
              <div className="flex items-center gap-1" title={hud.weatherEffectTh}>
                {hud.weather === 'fog' || hud.weather === 'mist' ? (
                  <CloudFog className="w-3.5 h-3.5 shrink-0" style={{ color: hud.weatherColor }} />
                ) : hud.weather === 'sandstorm' ? (
                  <Wind className="w-3.5 h-3.5 shrink-0" style={{ color: hud.weatherColor }} />
                ) : hud.weather === 'thunderstorm' ? (
                  <CloudLightning className="w-3.5 h-3.5 shrink-0" style={{ color: hud.weatherColor }} />
                ) : hud.weather === 'blizzard' ? (
                  <Snowflake className="w-3.5 h-3.5 shrink-0" style={{ color: hud.weatherColor }} />
                ) : hud.weather === 'blood_rain' ? (
                  <CloudRain className="w-3.5 h-3.5 shrink-0" style={{ color: hud.weatherColor }} />
                ) : hud.weather === 'acid_rain' ? (
                  <Droplets className="w-3.5 h-3.5 shrink-0" style={{ color: hud.weatherColor }} />
                ) : (
                  <Sun className="w-3.5 h-3.5 shrink-0" style={{ color: hud.weatherColor }} />
                )}
                <span className="font-medium" style={{ color: hud.weatherColor }}>
                  {hud.weatherNameTh}
                </span>
                <span className="font-mono-num text-[10px] text-stone-400">
                  ({formatClock(hud.weatherRemainingSeconds)})
                </span>
              </div>
              {hud.reaperSlainCount > 0 && (
                <>
                  <span className="text-stone-500" aria-hidden="true">·</span>
                  <span className="font-mono-num text-amber-300">
                    ยมทูต {hud.reaperSlainCount}
                  </span>
                </>
              )}
              {hud.reaperCurseStacks > 0 && (
                <>
                  <span className="text-stone-500" aria-hidden="true">·</span>
                  <span
                    className="flex items-center gap-1 font-mono-num font-bold text-rose-400"
                    title={`คำสาปยมทูต (${hud.reaperCurseStacks} ชั้น): Max HP ลดลงถาวร -${Math.min(90, hud.reaperCurseStacks)}%`}
                  >
                    <Skull className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                    <span>{hud.reaperCurseStacks}</span>
                  </span>
                </>
              )}
            </div>

            {/* Single Priority-Selected Slim Top-Edge Alert Bar (1 message at a time, never covers center arena) */}
            {(() => {
              if (hud.reaperWarning) {
                const isArrived = hud.reaperWarning.phase === 'arrived';
                return (
                  <div
                    className={`gothic-hud-box max-w-[min(92vw,34rem)] flex items-center justify-center gap-2 px-3 py-1 rounded border text-xs font-semibold whitespace-nowrap ${
                      isArrived
                        ? 'border-rose-400 bg-rose-950/90 text-rose-100 shadow-[0_0_16px_rgba(244,63,94,0.35)]'
                        : 'border-rose-500/85 bg-[#190910]/95 text-rose-200'
                    }`}
                  >
                    <Skull className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                    <span className="truncate font-display tracking-wide">
                      {isArrived
                        ? `THE REAPER ปรากฏตัวแล้ว (ระดับ ${hud.reaperWarning.realmTier}) · หลบพื้นที่สีแดงเมื่อเงื้อเคียว`
                        : `บอสพิเศษ The Reaper จุติใน ${hud.reaperWarning.remainingSeconds}s`}
                    </span>
                  </div>
                );
              }

              if (hud.mapEventBanner) {
                return (
                  <div
                    className="gothic-hud-box max-w-[min(92vw,34rem)] flex items-center justify-center gap-2 px-3 py-1 rounded text-xs whitespace-nowrap shadow-[0_0_18px_rgba(251,191,36,0.18)]"
                    style={{ borderColor: hud.mapEventBanner.color }}
                  >
                    {hud.mapEventBanner.kind === 'blessing' ? (
                      <Sparkles className="w-3.5 h-3.5 shrink-0" style={{ color: hud.mapEventBanner.color }} />
                    ) : (
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" style={{ color: hud.mapEventBanner.color }} />
                    )}
                    <span className="font-bold shrink-0" style={{ color: hud.mapEventBanner.color }}>
                      {hud.mapEventBanner.nameTh}
                    </span>
                    <span className="text-stone-500 shrink-0" aria-hidden="true">·</span>
                    <span className="text-stone-200 truncate">{hud.mapEventBanner.effectTh}</span>
                  </div>
                );
              }

              if (hud.mapEvent) {
                const pct = Math.max(
                  0,
                  Math.min(100, (hud.mapEvent.remaining / Math.max(1, hud.mapEvent.duration)) * 100)
                );
                return (
                  <div
                    className="gothic-hud-box relative overflow-hidden max-w-[min(92vw,34rem)] flex items-center justify-center gap-2 px-3 py-1 rounded text-xs whitespace-nowrap"
                    style={{ borderColor: `${hud.mapEvent.color}99` }}
                    title={hud.mapEvent.effectTh}
                  >
                    {hud.mapEvent.kind === 'blessing' ? (
                      <Sparkles className="w-3.5 h-3.5 shrink-0" style={{ color: hud.mapEvent.color }} />
                    ) : (
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" style={{ color: hud.mapEvent.color }} />
                    )}
                    <span className="font-bold shrink-0" style={{ color: hud.mapEvent.color }}>
                      {hud.mapEvent.nameTh}
                    </span>
                    <span className="text-stone-500 shrink-0" aria-hidden="true">·</span>
                    <span className="text-stone-300 truncate">{hud.mapEvent.effectTh}</span>
                    <span className="font-mono-num font-bold text-amber-100 shrink-0 ml-1">
                      {Math.ceil(hud.mapEvent.remaining)}s
                    </span>
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-stone-950/90">
                      <div
                        className="h-full transition-[width] duration-150"
                        style={{ width: `${pct}%`, backgroundColor: hud.mapEvent.color }}
                      />
                    </div>
                  </div>
                );
              }

              if (hud.shrinkingRingActive) {
                return (
                  <div className="gothic-hud-box max-w-[min(92vw,34rem)] flex items-center gap-1.5 px-3 py-0.5 rounded border-rose-500/80 text-[11px] font-bold text-rose-200 whitespace-nowrap">
                    <AlertTriangle className="w-3 h-3 text-rose-400 shrink-0" />
                    <span className="truncate">วงบีบ: อยู่ในวงเพื่อรับรางวัล!</span>
                  </div>
                );
              }

              if (hud.inSecretRoom && hud.secretRoomTitleTh) {
                return (
                  <div className="gothic-hud-box max-w-[min(92vw,34rem)] flex items-center gap-2 px-3 py-0.5 rounded border-purple-400/80 text-[11px] font-bold text-purple-200 whitespace-nowrap">
                    <Sparkles className="w-3 h-3 text-purple-300 shrink-0" />
                    <span className="truncate">{hud.secretRoomTitleTh}</span>
                    <span className="font-mono-num text-amber-300 shrink-0">
                      {Math.max(0, Math.ceil(hud.secretRoomRemaining || 0))}s
                    </span>
                  </div>
                );
              }

              if (hud.portalActive) {
                return (
                  <div className="gothic-hud-box max-w-[min(92vw,34rem)] flex items-center gap-1.5 px-3 py-0.5 rounded border-fuchsia-400/80 text-[11px] font-semibold text-fuchsia-200 whitespace-nowrap">
                    <Sparkles className="w-3 h-3 text-fuchsia-300 shrink-0" />
                    <span className="truncate">ประตูมิติลับเปิดแล้ว</span>
                    <span className="font-mono-num text-amber-300 shrink-0">
                      {Math.max(0, Math.ceil(hud.portalRemaining || 0))}s
                    </span>
                  </div>
                );
              }

              if (hud.landmarkRevealActive) {
                return (
                  <div className="gothic-hud-box max-w-[min(92vw,34rem)] flex items-center gap-1.5 px-3 py-0.5 rounded border-sky-400/75 text-[11px] font-semibold text-sky-200 whitespace-nowrap">
                    <Compass className="w-3 h-3 text-sky-300 shrink-0" />
                    <span className="truncate">เปิดเผยแผนที่จุดสำคัญ (2,000px)</span>
                  </div>
                );
              }

              if (hud.onHighGround) {
                return (
                  <div className="gothic-hud-box max-w-[min(92vw,34rem)] flex items-center gap-1 px-3 py-0.5 rounded border-slate-300/75 text-[11px] font-bold text-slate-100 whitespace-nowrap">
                    <span className="truncate">ยึดที่สูง (+15% Area · +10% DMG)</span>
                  </div>
                );
              }

              if (hud.activeTerrainTh) {
                return (
                  <div
                    className="gothic-hud-box max-w-[min(92vw,34rem)] flex items-center gap-1 px-3 py-0.5 rounded text-[11px] font-semibold whitespace-nowrap"
                    style={{
                      borderColor: `${hud.activeTerrainColor || '#94A3B8'}99`,
                      color: hud.activeTerrainColor || '#E2E8F0',
                    }}
                  >
                    <span className="truncate">{hud.activeTerrainTh}</span>
                  </div>
                );
              }

              if (race.dayNightSensitive) {
                return (
                  <div
                    className={`gothic-hud-box max-w-[min(92vw,34rem)] text-[11px] font-medium px-3 py-0.5 rounded whitespace-nowrap truncate ${
                      hud.isNight ? 'border-rose-500/60 text-rose-300' : 'border-amber-500/60 text-amber-300'
                    }`}
                  >
                    {hud.isNight
                      ? 'พลังรัตติกาล: +45% ดาเมจ · +35% ความเร็ว · ดูดเลือด'
                      : 'แพ้แสงแดด: -30% ดาเมจ · -25% ความเร็ว'}
                  </div>
                );
              }

              return null;
            })()}

            {/* Compact Top-Edge Boss HP Bar */}
            {hud.activeBoss && (
              <div className="gothic-hud-box w-64 sm:w-[22rem] border-rose-500/65 rounded px-2.5 py-1">
                <div className="flex items-center justify-between text-[11px] mb-0.5">
                  <span className="font-display font-bold text-rose-200 truncate">
                    {hud.activeBoss.nameTh}
                  </span>
                  <span className="font-mono-num text-[10px] text-rose-300 ml-2 shrink-0">
                    {hud.activeBoss.hp.toLocaleString()} / {hud.activeBoss.maxHp.toLocaleString()}
                  </span>
                </div>
                <div className="w-full h-1.5 bg-stone-950 rounded-xs overflow-hidden border border-rose-900/50">
                  <div
                    className={`h-full transition-[width] duration-100 ${
                      hud.activeBoss.isReaper
                        ? 'bg-gradient-to-r from-rose-700 to-rose-400'
                        : 'bg-gradient-to-r from-amber-700 to-amber-400'
                    }`}
                    style={{
                      width: `${Math.max(
                        0,
                        Math.min(100, (hud.activeBoss.hp / Math.max(1, hud.activeBoss.maxHp)) * 100)
                      )}%`,
                    }}
                  />
                </div>
                {(hud.activeBoss.maxStagger || 0) > 0 && (
                  <div className="mt-1 flex items-center gap-1.5">
                    <span
                      className={`text-[9px] font-semibold shrink-0 ${
                        hud.activeBoss.staggered ? 'text-yellow-200' : 'text-amber-300/90'
                      }`}
                    >
                      {hud.activeBoss.staggered
                        ? `BREAK x2 (${(hud.activeBoss.staggerRemaining || 0).toFixed(1)}s)`
                        : 'Break'}
                    </span>
                    <div className="flex-1 h-1 bg-stone-950 rounded-xs overflow-hidden border border-amber-500/35">
                      <div
                        className={`h-full transition-[width] duration-75 ${
                          hud.activeBoss.staggered
                            ? 'bg-gradient-to-r from-yellow-400 to-amber-200'
                            : 'bg-gradient-to-r from-amber-600 to-yellow-400'
                        }`}
                        style={{
                          width: `${
                            hud.activeBoss.staggered
                              ? Math.max(0, Math.min(100, ((hud.activeBoss.staggerRemaining || 0) / 3.2) * 100))
                              : Math.max(
                                  0,
                                  Math.min(
                                    100,
                                    ((hud.activeBoss.stagger || 0) / Math.max(1, hud.activeBoss.maxStagger || 1)) * 100
                                  )
                                )
                          }%`,
                        }}
                      />
                    </div>
                  </div>
                )}
                {hud.activeBoss.castSkillNameTh && (
                  <div className="mt-1 rounded bg-rose-950/90 border border-rose-400/80 px-1.5 py-0.5">
                    <div className="flex items-center justify-between text-[10px] font-bold text-rose-100">
                      <span className="flex items-center gap-1 text-rose-200 truncate">
                        <AlertTriangle className="w-3 h-3 text-amber-300 shrink-0" />
                        <span className="truncate">ร่าย: {hud.activeBoss.castSkillNameTh}</span>
                      </span>
                      <span className="font-mono-num text-amber-300 ml-1 shrink-0">
                        {(hud.activeBoss.castRemaining ?? 0).toFixed(1)}s
                      </span>
                    </div>
                    <div className="mt-0.5 w-full h-1 bg-stone-950 rounded-xs overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-rose-600 via-rose-400 to-amber-300 transition-[width] duration-75"
                        style={{
                          width: `${Math.max(0, Math.min(100, (hud.activeBoss.castProgress ?? 0) * 100))}%`,
                        }}
                      />
                    </div>
                  </div>
                )}
                {hud.activeBoss.buffs.length > 0 && (
                  <div className="mt-1 flex flex-wrap items-center gap-1">
                    {hud.activeBoss.buffs.map((bId) => {
                      const bDef = BOSS_BUFFS[bId];
                      return (
                        <span
                          key={bId}
                          className="px-1 py-0.5 rounded-xs bg-[#07080D] border text-[9px] font-medium leading-none"
                          style={{
                            borderColor: `${bDef.color}77`,
                            color: bDef.color,
                          }}
                          title={bDef.descriptionTh}
                        >
                          {bDef.nameTh}
                        </span>
                      );
                    })}
                    {hud.activeBoss.berserkActive && (
                      <span className="px-1 py-0.5 rounded-xs bg-orange-950/85 border border-orange-400 text-[9px] font-bold text-orange-300 leading-none">
                        คลั่ง!
                      </span>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Top-Right: Counters & Interactive Utility Controls */}
          <div className="flex flex-col items-end gap-1.5">
            <div className="gothic-hud-box flex flex-wrap items-center justify-end gap-2.5 px-3 py-1.5 rounded-md text-xs">
              <div className="flex items-center gap-1.5 text-amber-300 font-mono-num font-semibold" title="ทองที่ได้ในรอบนี้">
                <Coins className="w-3.5 h-3.5 text-amber-400" />
                <span>{hud.goldEarned.toLocaleString()}</span>
              </div>
              <span className="text-amber-500/35" aria-hidden="true">·</span>
              <div className="flex items-center gap-1 text-purple-300 font-mono-num font-semibold" title="แก่นวิญญาณ (Soul Essence)">
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                <span>{hud.soulEssenceEarned}</span>
              </div>
              {hud.pendingSealedChests > 0 && (
                <>
                  <span className="text-amber-500/35" aria-hidden="true">·</span>
                  <div
                    className="flex items-center gap-1 text-amber-200 font-mono-num font-semibold"
                    title="หีบปิดผนึก (ต้องรอด/ชนะเพื่อนำกลับค่าย!)"
                  >
                    <Lock className="w-3.5 h-3.5 text-amber-400" />
                    <span>{hud.pendingSealedChests}/5</span>
                  </div>
                </>
              )}
              {hud.curseLevel > 0 && (
                <>
                  <span className="text-amber-500/35" aria-hidden="true">·</span>
                  <div className="flex items-center gap-1 text-rose-300 font-mono-num font-semibold" title={`ระดับคำสาป ${hud.curseLevel}`}>
                    <Flame className="w-3.5 h-3.5 text-rose-400" />
                    <span>C{hud.curseLevel}</span>
                  </div>
                </>
              )}
              <span className="text-amber-500/35" aria-hidden="true">·</span>
              <div className="flex items-center gap-1.5 text-stone-200 font-mono-num font-semibold">
                <Skull className="w-3.5 h-3.5 text-stone-400" />
                <span>{hud.kills.toLocaleString()}</span>
              </div>
            </div>

            <div className="pointer-events-auto flex items-center gap-1.5">
              <button
                type="button"
                onClick={onCycleBotMode}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded text-xs font-medium border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  botMode === 'full'
                    ? 'bg-violet-700/90 text-violet-50 border-violet-300 shadow-[0_0_12px_rgba(139,92,246,0.45)]'
                    : botMode === 'idle'
                      ? 'bg-emerald-700/90 text-emerald-50 border-emerald-400'
                      : 'gothic-btn-iron'
                }`}
                title="สลับโหมดบอท: ปิด -> Idle AI (เดินหลบ/เก็บของ) -> บอท Full (เลือกหีบ/กดสกิล/อัลติ/วิวัฒนาการคลาสอัตโนมัติ)"
              >
                <Bot className="w-3.5 h-3.5" />
                <span>
                  {botMode === 'full' ? 'บอท Full' : botMode === 'idle' ? 'Idle AI' : 'บอท: ปิด'}
                </span>
              </button>

              <button
                type="button"
                onClick={onToggleSpeed}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded text-xs font-mono-num font-semibold border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  simSpeed > 1 ? 'gothic-btn-gold' : 'gothic-btn-iron'
                }`}
                title="สลับความเร็วเกม"
              >
                <FastForward className="w-3.5 h-3.5" />
                <span>{simSpeed}x</span>
              </button>

              <button
                type="button"
                onClick={onToggleMute}
                aria-label={muted ? 'เปิดเสียง' : 'ปิดเสียง'}
                className="gothic-btn-iron p-1.5 rounded transition-colors cursor-pointer"
              >
                {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>

              <AudioSettingsPopoverButton
                muted={muted}
                volumes={volumes}
                onToggleMute={onToggleMute}
                onChangeVolumes={onChangeVolumes}
                buttonClassName="gothic-btn-iron p-1.5 rounded transition-colors cursor-pointer"
              />

              <button
                type="button"
                onClick={onPause}
                aria-label="หยุดชั่วคราว"
                className="gothic-btn-iron p-1.5 rounded transition-colors cursor-pointer"
              >
                <Pause className="w-4 h-4" />
              </button>
            </div>

            {botMode === 'full' && race.canEvolveClass && !hud.raceClass && (
              <div className="pointer-events-auto flex flex-wrap items-center justify-end gap-1 gothic-hud-box px-2 py-1.5 rounded-md text-[10px]">
                <span className="text-violet-300 font-semibold mr-0.5">คลาส Lv.20:</span>
                <button
                  type="button"
                  onClick={() => onSelectBotTargetClass('auto')}
                  className={`px-1.5 py-0.5 rounded border cursor-pointer transition-colors ${
                    botTargetClass === 'auto'
                      ? 'bg-violet-600/80 border-violet-300 text-white'
                      : 'border-stone-700 text-stone-300 hover:border-stone-500'
                  }`}
                >
                  สุ่ม
                </button>
                {getClassesForRace(raceId).map((cls) => (
                  <button
                    key={cls.id}
                    type="button"
                    onClick={() => onSelectBotTargetClass(cls.id)}
                    className={`px-1.5 py-0.5 rounded border cursor-pointer transition-colors ${
                      botTargetClass === cls.id
                        ? 'bg-violet-600/80 border-violet-300 text-white'
                        : 'border-stone-700 text-stone-300 hover:border-stone-500'
                    }`}
                  >
                    {cls.nameTh}
                  </button>
                ))}
              </div>
            )}

            {/* Compact In-Run Dynamic Quests */}
            {hud.inRunQuests.length > 0 && (
              <div className="hidden sm:flex flex-col gap-1 w-56 gothic-hud-box px-2.5 py-2 rounded-md text-[11px]">
                <div className="flex items-center gap-1 text-amber-300/90 font-semibold">
                  <ScrollText className="w-3 h-3 shrink-0" />
                  <span>ภารกิจระหว่างรอบ</span>
                </div>
                {hud.inRunQuests.map((q) => (
                  <div key={q.id} className="flex items-center justify-between gap-2 leading-tight">
                    <span className={`truncate ${q.completed ? 'line-through text-emerald-300/80' : 'text-stone-300'}`}>
                      {q.titleTh}
                    </span>
                    <span className={`font-mono-num shrink-0 ${q.completed ? 'text-emerald-300 font-bold' : 'text-amber-300'}`}>
                      {q.completed ? `+${q.rewardGold}g` : `${q.progress}/${q.target}`}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom-Center: Slim Single-Line Ticker + Controls & Player HP Bar */}
      <div className="pb-4 flex flex-col items-center gap-1.5 px-4">
        {hud.announcement && (
          <div
            className="gothic-hud-box max-w-[min(92vw,34rem)] px-3 py-1 rounded border-amber-400/55 text-xs font-medium text-amber-100 whitespace-nowrap truncate shadow-[0_2px_12px_rgba(0,0,0,0.65)]"
            title={hud.announcement}
          >
            {hud.announcement}
          </div>
        )}
        <div className="flex flex-wrap items-center justify-center gap-2">
          {hud.activePotion && POTIONS[hud.activePotion] && (
            <button
              type="button"
              onClick={onTriggerPotion}
              disabled={hud.potionUsed}
              className={`pointer-events-auto flex items-center gap-1.5 px-2.5 py-1 rounded border text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                !hud.potionUsed
                  ? 'gothic-hud-box border-emerald-400/80 text-emerald-100 hover:border-emerald-300 cursor-pointer'
                  : 'gothic-hud-box opacity-55 text-stone-400 cursor-not-allowed'
              }`}
              title={`กด Q เพื่อดื่ม ${POTIONS[hud.activePotion].nameTh}: ${POTIONS[hud.activePotion].descTh}`}
            >
              <FlaskConical
                className="w-3.5 h-3.5"
                style={{ color: POTIONS[hud.activePotion].color }}
              />
              <span>
                {hud.potionUsed ? 'ใช้ยาแล้ว' : `Q · ${POTIONS[hud.activePotion].nameTh}`}
              </span>
            </button>
          )}
          {hud.goldDoubleTimer > 0 && (
            <div className="gothic-hud-box flex items-center gap-1 px-2 py-1 rounded border-amber-400/70 text-xs font-mono-num text-amber-200">
              <span>ทอง x2 {hud.goldDoubleTimer.toFixed(0)}s</span>
            </div>
          )}
          {hud.xpDoubleTimer > 0 && (
            <div className="gothic-hud-box flex items-center gap-1 px-2 py-1 rounded border-sky-400/70 text-xs font-mono-num text-sky-200">
              <span>EXP x2 {hud.xpDoubleTimer.toFixed(0)}s</span>
            </div>
          )}
          {hud.fatePowderActive && (
            <div className="gothic-hud-box flex items-center gap-1 px-2 py-1 rounded border-purple-400/70 text-xs text-purple-200">
              <span>ผงโชคชะตา (หีบบอส +2)</span>
            </div>
          )}
          {(hud.speedPotionTimer || 0) > 0 && (
            <div className="gothic-hud-box flex items-center gap-1 px-2 py-1 rounded border-sky-400/75 text-xs font-mono-num text-sky-200">
              <Wind className="w-3 h-3 text-sky-300" />
              <span>วิ่งไว +35% {(hud.speedPotionTimer || 0).toFixed(0)}s</span>
            </div>
          )}
          {hud.statueBuff && (
            <div
              className={`gothic-hud-box flex items-center gap-1 px-2 py-1 rounded text-xs font-mono-num ${
                hud.statueBuff.kind === 'blessing'
                  ? 'border-amber-400/75 text-amber-200'
                  : 'border-purple-400/75 text-purple-200'
              }`}
            >
              <Sparkles className="w-3 h-3" />
              <span>
                {hud.statueBuff.labelTh} {Math.ceil(hud.statueBuff.remaining)}s
              </span>
            </div>
          )}
          {hud.godBlessings &&
            (hud.godBlessings.reactionBonus > 0 ||
              hud.godBlessings.areaBonus > 0 ||
              hud.godBlessings.cdrBonus > 0) && (
              <div className="gothic-hud-box flex items-center gap-1.5 px-2 py-1 rounded border-sky-400/70 text-xs font-mono-num text-sky-200">
                <Crown className="w-3 h-3 text-sky-300" />
                <span>
                  พรเทพ
                  {hud.godBlessings.reactionBonus > 0
                    ? ` ปฏิกิริยา+${Math.round(hud.godBlessings.reactionBonus * 100)}%`
                    : ''}
                  {hud.godBlessings.areaBonus > 0
                    ? ` พื้นที่+${Math.round(hud.godBlessings.areaBonus * 100)}%`
                    : ''}
                  {hud.godBlessings.cdrBonus > 0
                    ? ` ลดCD-${Math.round(hud.godBlessings.cdrBonus * 100)}%`
                    : ''}
                </span>
              </div>
            )}
          {hud.activePet && PETS[hud.activePet] && (
            <div
              className="gothic-hud-box flex items-center gap-1 px-2 py-1 rounded text-xs text-stone-200"
              title={PETS[hud.activePet].descTh}
            >
              <PawPrint className="w-3 h-3" style={{ color: PETS[hud.activePet].color }} />
              <span>{PETS[hud.activePet].nameTh}</span>
            </div>
          )}
          {hud.metaRevivesLeft > 0 && (
            <div
              className="gothic-hud-box flex items-center gap-1 px-2 py-1 rounded border-amber-400/50 text-xs font-mono-num text-amber-200"
              title="สิทธิ์คืนชีพจากลานฝึก"
            >
              <Heart className="w-3 h-3 text-rose-400" />
              <span>ชุบชีวิต x{hud.metaRevivesLeft}</span>
            </div>
          )}
          {hud.phoenixAvailable && (
            <div
              className="gothic-hud-box flex items-center gap-1 px-2 py-1 rounded border-orange-400/55 text-xs font-mono-num text-orange-200"
              title="ขนนกฟีนิกซ์จากโรงตีเหล็ก: คืนชีพพร้อมระเบิดเพลิง"
            >
              <Flame className="w-3 h-3 text-orange-400" />
              <span>ฟีนิกซ์ x1</span>
            </div>
          )}
          {hud.canDash && (
            <button
              type="button"
              onClick={onTriggerDash}
              disabled={hud.raceClass === 'hunter' ? (hud.hunterDashCharges ?? 0) <= 0 : hud.dashCooldown > 0.05}
              className={`pointer-events-auto flex items-center gap-1.5 px-3 py-1 rounded border text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                (hud.raceClass === 'hunter' ? (hud.hunterDashCharges ?? 0) > 0 : hud.dashCooldown <= 0.05)
                  ? 'gothic-hud-box border-sky-400/80 text-sky-200 hover:border-sky-300 cursor-pointer'
                  : 'gothic-hud-box opacity-65 text-stone-400 cursor-not-allowed'
              }`}
              title="กด Space หรือ Shift เพื่อแดชหลบอมตะชั่วคราว"
            >
              <Wind className="w-3.5 h-3.5 text-sky-300" />
              <span>
                {hud.raceClass === 'hunter' ? (
                  (hud.hunterDashCharges ?? 0) > 0 ? (
                    <>
                      Space · แดช{' '}
                      <span className="font-mono-num text-emerald-300">
                        {hud.hunterDashCharges}/{hud.hunterDashMaxCharges || 3}
                      </span>
                    </>
                  ) : (
                    <>
                      แดชกำลังชาร์จ{' '}
                      <span className="font-mono-num text-sky-300">
                        {hud.dashCooldown.toFixed(1)}s
                      </span>
                    </>
                  )
                ) : hud.dashCooldown <= 0.05 ? (
                  'Space · แดชพร้อม'
                ) : (
                  <>
                    แดชกำลังชาร์จ{' '}
                    <span className="font-mono-num text-sky-300">
                      {hud.dashCooldown.toFixed(1)}s
                    </span>
                  </>
                )}
              </span>
            </button>
          )}

          {raceId === 'mage' && hud.usesMana && (
            <button
              type="button"
              onClick={onTriggerVoidInfusion}
              disabled={hud.voidInfusionActive || hud.mana < hud.voidInfusionCost}
              className={`pointer-events-auto flex items-center gap-1.5 px-3 py-1 rounded border text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                hud.voidInfusionActive
                  ? 'gothic-hud-box border-purple-400 text-purple-200 cursor-default'
                  : hud.mana >= hud.voidInfusionCost
                    ? 'gothic-hud-box border-purple-400/80 text-purple-200 hover:border-purple-300 cursor-pointer'
                    : 'gothic-hud-box opacity-65 text-stone-400 cursor-not-allowed'
              }`}
              title="กด Space / Shift / E ใช้มานาเพื่อเปิด Void Infusion (+65% ดาเมจเวทย์ผสมถัดไป แต่คูลดาวน์พิธีกรรม x2)"
            >
              <Zap className="w-3.5 h-3.5 text-purple-300" />
              <span>
                {hud.voidInfusionActive
                  ? 'Void Infusion พร้อมเสริมพลัง! (CD x2)'
                  : `Space · Void Infusion (-${hud.voidInfusionCost} MP)`}
              </span>
            </button>
          )}

          {raceId === 'vampire' && (
            <button
              type="button"
              onClick={onTriggerActiveSkill}
              disabled={
                (hud.batSwarmTimer || 0) > 0 ||
                (hud.batSwarmCooldown || 0) > 0.05 ||
                (hud.vampireBlood || 0) < (hud.vampireBloodMax || 100)
              }
              className={`pointer-events-auto flex items-center gap-1.5 px-3 py-1 rounded border text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                (hud.batSwarmTimer || 0) > 0
                  ? 'gothic-hud-box border-rose-400 text-rose-200'
                  : (hud.batSwarmCooldown || 0) <= 0.05 &&
                      (hud.vampireBlood || 0) >= (hud.vampireBloodMax || 100)
                    ? 'gothic-hud-box border-rose-400/90 text-rose-100 hover:border-rose-300 cursor-pointer'
                    : 'gothic-hud-box opacity-80 text-stone-300'
              }`}
              title="กด Space เพื่อแปลงร่างเป็นฝูงค้างคาวอมตะ 1.5 วิ (+40% ความเร็วและดูดเลือด)"
            >
              <Moon className="w-3.5 h-3.5 text-rose-400" />
              <span>
                {(hud.batSwarmTimer || 0) > 0
                  ? `ฝูงค้างคาวอมตะ ${(hud.batSwarmTimer || 0).toFixed(1)}s`
                  : (hud.batSwarmCooldown || 0) > 0.05
                    ? `ค้างคาวพัก ${(hud.batSwarmCooldown || 0).toFixed(1)}s`
                    : (hud.vampireBlood || 0) >= (hud.vampireBloodMax || 100)
                      ? 'Space · ฝูงค้างคาวพร้อม!'
                      : `โลหิต ${hud.vampireBlood || 0}/${hud.vampireBloodMax || 100}`}
              </span>
            </button>
          )}

          {raceId === 'orc' && (
            <>
              <button
                type="button"
                onClick={onTriggerActiveSkill}
                disabled={(hud.warCryCooldown || 0) > 0.05}
                className={`pointer-events-auto flex items-center gap-1.5 px-3 py-1 rounded border text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                  (hud.warCryCooldown || 0) <= 0.05
                    ? 'gothic-hud-box border-amber-400/85 text-amber-100 hover:border-amber-300 cursor-pointer'
                    : 'gothic-hud-box opacity-70 text-stone-400 cursor-not-allowed'
                }`}
                title="กด Space คำรามศึก ผลักศัตรูรอบตัวและเพิ่มเกจโทสะ +28"
              >
                <Flame className="w-3.5 h-3.5 text-amber-400" />
                <span>
                  {(hud.warCryCooldown || 0) <= 0.05
                    ? 'Space · คำรามศึก'
                    : `คำรามศึก ${(hud.warCryCooldown || 0).toFixed(1)}s`}
                </span>
              </button>
              <div
                className={`gothic-hud-box flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-semibold whitespace-nowrap ${
                  (hud.orcBerserkTimer || 0) > 0
                    ? 'border-orange-400 text-orange-200 animate-pulse'
                    : 'border-amber-500/45 text-amber-200'
                }`}
                title="สะสมโทสะครบ 100 จะคลั่ง Berserk 5 วิ (คริ 100% ข้ามเพดานคริ 60% คงเพดานคริแรง x2.5)"
              >
                <Flame className="w-3.5 h-3.5 text-orange-400" />
                {(hud.orcBerserkTimer || 0) > 0 ? (
                  <span>BERSERK คริ 100%! {(hud.orcBerserkTimer || 0).toFixed(1)}s</span>
                ) : (hud.orcBerserkCooldown || 0) > 0.05 ? (
                  <span>
                    โทสะ {hud.orcRage || 0}/{hud.orcRageMax || 100} · พัก {(hud.orcBerserkCooldown || 0).toFixed(0)}s
                  </span>
                ) : (
                  <span>
                    โทสะ {hud.orcRage || 0}/{hud.orcRageMax || 100}
                  </span>
                )}
              </div>
            </>
          )}

          {raceId === 'mage' && hud.mageBarrierTimer > 0 && (
            <div className="gothic-hud-box flex items-center gap-1.5 px-2.5 py-1 rounded border-emerald-400/80 text-xs font-semibold text-emerald-200 whitespace-nowrap">
              <Shield className="w-3.5 h-3.5 text-emerald-300" />
              <span>
                บาเรียวายุอมตะ{' '}
                <span className="font-mono-num text-emerald-300">
                  {hud.mageBarrierTimer.toFixed(1)}s
                </span>
              </span>
            </div>
          )}

          {hud.ultActiveTimer > 0 && hud.ultTitleTh && (
            <div
              className="gothic-hud-box flex items-center gap-2 px-3 py-1 rounded text-xs font-bold whitespace-nowrap animate-pulse"
              style={{
                borderColor: hud.classGaugeColor || '#FBBF24',
                color: hud.classGaugeColor || '#FDE68A',
              }}
            >
              <Crown className="w-3.5 h-3.5 shrink-0" />
              <span>{hud.ultTitleTh}</span>
              <span className="font-mono-num">{hud.ultActiveTimer.toFixed(1)}s</span>
            </div>
          )}

          {hud.woundedTimer > 0 && (
            <div className="gothic-hud-box flex items-center gap-1 px-2.5 py-1 rounded border-rose-500/75 text-xs font-semibold text-rose-200 whitespace-nowrap">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
              <span>บาดเจ็บหนัก (ฮีล x0.5) {hud.woundedTimer.toFixed(1)}s</span>
            </div>
          )}

          {hud.classGaugeMax > 0 && hud.ultAscendLabelTh && (
            <div
              className={`gothic-hud-box flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-semibold whitespace-nowrap ${
                hud.ultAscended
                  ? 'border-amber-300 text-amber-200 shadow-[0_0_12px_rgba(251,191,36,0.28)]'
                  : 'text-stone-300'
              }`}
              title={
                hud.ultAscended
                  ? `ปลุกพลังขั้นสูงสุดสำเร็จ: ${hud.ultAscendLabelTh}`
                  : `ความคืบหน้าปลดล็อก "${hud.ultAscendLabelTh}"`
              }
            >
              <Crown
                className="w-3.5 h-3.5 shrink-0"
                style={{ color: hud.ultAscended ? '#FDE047' : hud.classGaugeColor || '#CBD5E1' }}
              />
              {hud.ultAscended ? (
                <span>{hud.ultAscendLabelTh}</span>
              ) : hud.raceClass === 'hunter' ? (
                <span>
                  ปลุกพลัง{' '}
                  <span className="font-mono-num text-amber-200">
                    อัลติ {Math.min(hud.ultCount ?? 0, 3)}/3 · ฆ่าฟันเงา {Math.min(hud.hunterShadowSlashKills ?? 0, 150)}/150
                  </span>
                </span>
              ) : (
                <span>
                  ปลุกพลัง{' '}
                  <span className="font-mono-num text-amber-200">
                    {Math.min(hud.ultAscendProgress, hud.ultAscendReq)}/{hud.ultAscendReq}
                  </span>
                </span>
              )}
            </div>
          )}

          {hud.raceClass === 'hunter' && (
            <div className="gothic-hud-box flex items-center gap-1.5 px-2.5 py-1 rounded border-emerald-400/60 text-xs font-semibold text-emerald-200 whitespace-nowrap">
              <Swords className="w-3.5 h-3.5 text-emerald-300" />
              <span>
                {hud.ultActiveTimer > 0
                  ? `ราตรีพันเงา: ชาร์จไว x2 (${hud.hunterDashCharges ?? 3}/${hud.hunterDashMaxCharges ?? 3}) + เงาฟันซ้ำ!`
                  : `ฟันเงา · แดช ${hud.hunterDashCharges ?? 3}/${hud.hunterDashMaxCharges ?? 3}${
                      (hud.hunterKillRefunds || 0) > 0 ? ` · คืน ${hud.hunterKillRefunds}` : ''
                    }`}
              </span>
            </div>
          )}

          {hud.raceClass === 'saint' && hud.saintGolemMaxHp > 0 && (
            <div
              className={`gothic-hud-box flex items-center gap-2 px-2.5 py-1 rounded text-xs font-semibold whitespace-nowrap ${
                hud.saintGolemRespawn > 0
                  ? 'border-stone-500/70 text-stone-300'
                  : hud.saintGolemSeraph
                    ? 'border-amber-300 text-amber-100'
                    : 'border-yellow-400/65 text-yellow-100'
              }`}
            >
              <Shield className="w-3.5 h-3.5 text-amber-300 shrink-0" />
              {hud.saintGolemRespawn > 0 ? (
                <span>
                  มหาโกเล็มฟื้นตัว{' '}
                  <span className="font-mono-num text-amber-300">{hud.saintGolemRespawn.toFixed(1)}s</span>
                </span>
              ) : (
                <>
                  <span>{hud.saintGolemSeraph ? 'เซราฟโกเล็ม' : 'มหาโกเล็ม'}</span>
                  <div className="w-16 h-2 bg-stone-950 rounded-xs overflow-hidden border border-amber-500/40">
                    <div
                      className="h-full bg-gradient-to-r from-amber-500 to-yellow-300 transition-[width] duration-100"
                      style={{
                        width: `${Math.max(0, Math.min(100, (hud.saintGolemHp / Math.max(1, hud.saintGolemMaxHp)) * 100))}%`,
                      }}
                    />
                  </div>
                  <span className="font-mono-num text-[11px] text-amber-200">
                    {hud.saintGolemHp.toLocaleString()}
                  </span>
                </>
              )}
            </div>
          )}

          {hud.raceClass === 'knight' && (
            <div className="gothic-hud-box flex items-center gap-2 px-2.5 py-1 rounded border-sky-400/65 text-xs font-semibold text-sky-100 whitespace-nowrap">
              <Shield className="w-3.5 h-3.5 text-sky-300 shrink-0" />
              <span>
                Parry{' '}
                <span className="font-mono-num text-sky-300">{hud.knightParryCount}/25</span>
              </span>
              {hud.knightAegisBonus > 0 && (
                <span className="font-mono-num text-[11px] text-amber-300 border-l border-stone-700 pl-1.5">
                  Aegis +{hud.knightAegisBonus} เกราะ
                </span>
              )}
            </div>
          )}

          {hud.raceClass === 'demon_lord' && (
            <>
              <div className="gothic-hud-box flex items-center gap-1.5 px-2.5 py-1 rounded border-orange-500/70 text-xs font-semibold text-orange-200 whitespace-nowrap">
                <Flame className="w-3.5 h-3.5 text-orange-400 shrink-0" />
                <span>
                  บัญชีวิญญาณ{' '}
                  <span className="font-mono-num text-amber-300">
                    {hud.demonSoulKills.toLocaleString()}
                  </span>
                </span>
                {hud.demonHellfireTier > 0 && (
                  <span className="px-1.5 py-0.5 rounded-xs bg-rose-950/90 border border-rose-400/60 text-[10px] font-bold text-rose-200 leading-none">
                    {hud.demonHellfireTier >= 3
                      ? 'มงกุฎอเวจี'
                      : hud.demonHellfireTier >= 2
                        ? 'ฝนเพลิง'
                        : 'รอยเพลิง'}
                  </span>
                )}
              </div>
              <div
                className={`gothic-hud-box flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-semibold whitespace-nowrap ${
                  hud.reviveCooldown <= 0.05
                    ? 'border-rose-400 text-rose-200'
                    : 'text-stone-400'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-rose-400" />
                {hud.reviveCooldown <= 0.05 ? (
                  <span>คืนชีพจอมมาร + Ult ฟรีพร้อม</span>
                ) : (
                  <span>
                    คืนชีพรอ{' '}
                    <span className="font-mono-num text-rose-300">
                      {formatClock(Math.ceil(hud.reviveCooldown))}
                    </span>
                  </span>
                )}
              </div>
            </>
          )}

          {hud.raceClass === 'vampire_lord' && (
            <>
              {hud.vampireBloodShieldMax > 0 && (
                <div className="gothic-hud-box flex items-center gap-1.5 px-2.5 py-1 rounded border-rose-400/65 text-xs font-semibold text-rose-100 whitespace-nowrap">
                  <Heart className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                  <span>
                    โล่โลหิต{' '}
                    <span className="font-mono-num text-rose-300">
                      {hud.vampireBloodShield}/{hud.vampireBloodShieldMax}
                    </span>
                  </span>
                </div>
              )}
              {hud.vampireBloodlustDmgPct > 0 && (
                <div className="gothic-hud-box flex items-center gap-1 px-2.5 py-1 rounded border-red-500/70 text-xs font-semibold text-red-200 whitespace-nowrap">
                  <Flame className="w-3.5 h-3.5 text-red-400" />
                  <span className="font-mono-num">
                    กระหายโลหิต +{hud.vampireBloodlustDmgPct}% DMG · +{hud.vampireBloodlustSpdPct}% SPD
                  </span>
                </div>
              )}
              <div
                className={`gothic-hud-box flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold whitespace-nowrap ${
                  hud.vampireLastRiteCd <= 0.05
                    ? 'border-rose-400 text-rose-200'
                    : 'text-stone-400'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-rose-400" />
                {hud.vampireLastRiteCd <= 0.05 ? (
                  <span>วาระสุดท้ายพร้อม</span>
                ) : (
                  <span className="font-mono-num">วาระสุดท้าย {hud.vampireLastRiteCd.toFixed(0)}s</span>
                )}
              </div>
            </>
          )}

          {hud.raceClass === 'seven_sins' && (
            <div className="flex flex-wrap items-center justify-center gap-1.5 max-w-2xl">
              <div className="gothic-hud-box flex items-center gap-1 px-2 py-1 rounded border-purple-400/65 text-[11px] font-semibold text-purple-200 whitespace-nowrap">
                <Sparkles className="w-3 h-3 text-purple-300" />
                <span className="font-mono-num">
                  สัญญา {hud.sinsAllContractedCount}/7 (สูงสุด {hud.sinsMaxSlots})
                </span>
              </div>
              {hud.sinsActive.map((sin) => {
                const def = SEVEN_SINS[sin.sinId];
                const hpRatio = Math.max(0, Math.min(100, (sin.hp / Math.max(1, sin.maxHp)) * 100));
                return (
                  <div
                    key={sin.sinId}
                    className="gothic-hud-box flex items-center gap-1.5 px-2 py-1 rounded text-[11px] font-semibold whitespace-nowrap"
                    style={{ borderColor: `${def.color}88` }}
                    title={`${def.sinNameTh} · ${def.demonNameTh} Lv.${sin.level}`}
                  >
                    <span style={{ color: def.color }}>{def.demonNameTh}</span>
                    <span className="font-mono-num text-[10px] text-amber-300">L{sin.level}</span>
                    {sin.respawnTimer > 0 ? (
                      <span className="font-mono-num text-[10px] text-rose-300">
                        {sin.respawnTimer.toFixed(1)}s
                      </span>
                    ) : (
                      <div className="w-10 h-1.5 bg-stone-950 rounded-xs overflow-hidden border border-stone-700">
                        <div
                          className="h-full transition-[width] duration-100"
                          style={{ width: `${hpRatio}%`, backgroundColor: def.color }}
                        />
                      </div>
                    )}
                    {sin.sinId === 'wrath' && (sin.wrathStacks || 0) > 0 && (
                      <span className="font-mono-num text-[10px] text-orange-300">
                        x{sin.wrathStacks}
                      </span>
                    )}
                    {sin.sinId === 'sloth' && sin.slothAwake && (
                      <span className="text-[10px] text-indigo-300 font-bold">ตื่น!</span>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {hud.raceClass === 'time_god' && (
            <div className="flex flex-wrap items-center justify-center gap-1.5">
              {/* Small Clock beside class bar: Global Time Stop Countdown / Active */}
              <div
                className={`gothic-hud-box flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-semibold whitespace-nowrap ${
                  hud.timeStopActive
                    ? 'border-cyan-300 text-cyan-100 bg-cyan-950/60 shadow-[0_0_12px_rgba(34,211,238,0.35)]'
                    : 'border-cyan-500/45 text-stone-200'
                }`}
              >
                <Clock
                  className={`w-3.5 h-3.5 ${
                    hud.timeStopActive ? 'text-cyan-200 animate-spin' : 'text-cyan-300'
                  }`}
                />
                {hud.timeStopActive ? (
                  <span>
                    The World{' '}
                    <span className="font-mono-num text-amber-200">
                      {(hud.timeStopRemaining ?? 0).toFixed(1)}s
                    </span>{' '}
                    (+15% ดาเมจ)
                  </span>
                ) : (
                  <span>
                    The World ใน{' '}
                    <span className="font-mono-num text-cyan-300">
                      {hud.timeStopCooldown.toFixed(1)}s
                    </span>
                  </span>
                )}
              </div>

              {/* Chrono Stasis Dome Status */}
              <div className="gothic-hud-box flex items-center gap-1.5 px-2.5 py-1 rounded border-sky-500/45 text-xs font-semibold text-sky-200 whitespace-nowrap">
                <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
                <span>
                  โดมหยุดเวลา{' '}
                  <span className="font-mono-num text-cyan-300">{hud.chronoWellCount ?? 0}/2</span>
                  <span className="text-stone-400"> · </span>
                  <span className="font-mono-num text-stone-300">
                    {(hud.chronoWellCooldown ?? 0).toFixed(1)}s
                  </span>
                  {(hud.timeStopCycleReduced ?? 0) >= 0.1 && (
                    <span className="font-mono-num text-amber-300 ml-1">
                      · ลด World -{(hud.timeStopCycleReduced ?? 0).toFixed(1)}s
                    </span>
                  )}
                </span>
              </div>

              {/* Rewind Revive Hourglass */}
              {(() => {
                const usedCount = hud.rewindUsedCount ?? 0;
                const maxUses = hud.rewindMaxUses ?? 3;
                const lockTimer = hud.rewindLockTimer ?? 0;
                const exhausted = usedCount >= maxUses;
                const locked = lockTimer > 0 && !hud.rewindReady && !exhausted;
                return (
                  <div
                    className={`gothic-hud-box flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-semibold whitespace-nowrap ${
                      exhausted
                        ? 'border-stone-700 text-stone-500 opacity-75'
                        : hud.rewindReady
                          ? 'border-amber-300/80 text-amber-200 bg-amber-950/30'
                          : locked
                            ? 'border-rose-500/50 text-rose-200'
                            : 'border-cyan-500/50 text-cyan-200'
                    }`}
                  >
                    {locked ? (
                      <Lock className="w-3.5 h-3.5 text-rose-300" />
                    ) : (
                      <Hourglass
                        className={`w-3.5 h-3.5 ${
                          exhausted
                            ? 'text-stone-500'
                            : hud.rewindReady
                              ? 'text-amber-300'
                              : 'text-cyan-300'
                        }`}
                      />
                    )}
                    <span>
                      ย้อนกาล{' '}
                      {exhausted ? (
                        <span className="font-mono-num">
                          ({usedCount}/{maxUses})
                        </span>
                      ) : hud.rewindReady ? (
                        <span className="text-emerald-300">
                          พร้อมใช้ ({maxUses - usedCount}/{maxUses})
                        </span>
                      ) : locked ? (
                        <span className="font-mono-num text-rose-300">
                          ล็อก {Math.ceil(lockTimer)}s
                        </span>
                      ) : (
                        <span className="font-mono-num text-cyan-300">
                          {hud.rewindChargeKills ?? 0}/{hud.rewindChargeTarget ?? 250}
                        </span>
                      )}
                    </span>
                  </div>
                );
              })()}
            </div>
          )}

          {hud.raceClass === 'death_god' && (() => {
            const minionCount = hud.necroMinionCount ?? 0;
            const minionCap = hud.necroMinionCap ?? 28;
            const minionPct = Math.max(0, Math.min(100, (minionCount / Math.max(1, minionCap)) * 100));
            const fealtyCount = hud.necroFealtyCount ?? 0;
            const fealtyCap = hud.necroFealtyCap ?? 10;
            const miniBossCount = hud.necroMiniBossCount ?? 0;
            const soulsCount = hud.necroSoulsCount ?? 0;
            const soulBonusPct = hud.necroSoulBonusPct ?? 0;
            const soulProgressPct = Math.max(0, Math.min(100, (soulBonusPct / 80) * 100));
            const shield = hud.necroShield ?? 0;
            const shieldMax = hud.necroShieldMax ?? 300;
            const shieldTimer = hud.necroShieldTimer ?? 0;
            const shieldActive = shield > 0 && shieldTimer > 0;
            const shieldPct = Math.max(0, Math.min(100, (shield / Math.max(1, shieldMax)) * 100));
            const fealtySpeedPct = hud.necroFealtySpeedPct ?? 0;
            const soonestExpire = hud.necroSoonestExpireSec ?? null;
            const fealtyStateText = hud.ultReady
              ? 'พร้อมร่าย! ค้าง SPACE'
              : fealtyCount > 0 || shieldActive
                ? `เสริมพลัง ${fealtyCount}/${fealtyCap} ตัว`
                : `ชาร์จ ${hud.classGauge}/${hud.classGaugeMax || 100}`;

            return (
              <section
                aria-label="จอมเวทย์ Necromancer — กองทัพ Minion และดวงวิญญาณ"
                className="gothic-hud-box w-full max-w-[36rem] rounded-md px-3 py-2 border-purple-500/55 bg-gradient-to-b from-[#161024]/95 via-[#0E0B17]/95 to-[#09080E]/98 shadow-[0_10px_28px_rgba(88,28,135,0.28)]"
              >
                {/* Header Strip: Necromancer Dominion & Soul Harvest */}
                <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 pb-1.5 border-b border-purple-500/25">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <Skull className="w-3.5 h-3.5 text-purple-300 shrink-0" />
                    <span className="font-display text-[11px] font-bold tracking-wide text-purple-200 truncate">
                      จอมเวทย์ Necromancer
                    </span>
                    <span className="text-purple-500/45" aria-hidden="true">·</span>
                    <span className="text-[11px] font-medium text-emerald-300 whitespace-nowrap">
                      Minion{' '}
                      <span className="font-mono-num font-bold">
                        {minionCount}/{minionCap}
                      </span>
                    </span>
                    {miniBossCount > 0 && (
                      <>
                        <span className="text-purple-500/45" aria-hidden="true">·</span>
                        <span className="font-mono-num text-[11px] font-semibold text-amber-300 whitespace-nowrap">
                          มินิบอส {miniBossCount}
                        </span>
                      </>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 text-[11px] whitespace-nowrap">
                    <Sparkles className="w-3 h-3 text-purple-300 shrink-0" />
                    <span className="text-stone-300">วิญญาณ</span>
                    <span className="font-mono-num font-bold text-purple-200">{soulsCount}</span>
                    <span className="text-purple-500/45" aria-hidden="true">·</span>
                    <span className="font-mono-num font-bold text-amber-300">
                      +{soulBonusPct.toFixed(2)}% / 80% DMG
                    </span>
                  </div>
                </div>

                {/* Progress & Status Grid */}
                <div className="mt-1.5 grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-0 sm:divide-x sm:divide-purple-500/20 text-[11px]">
                  {/* 1. Active Minions & Lifetime */}
                  <div className="flex flex-col justify-between gap-1 sm:pr-2.5">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-emerald-200/90 font-medium truncate">กองทัพ Minion</span>
                      <span className="font-mono-num text-[10px] text-emerald-300 shrink-0">
                        {soonestExpire !== null
                          ? `หมดเวลา ${soonestExpire}s`
                          : minionCount > 0
                            ? 'อมตะ (Fealty)'
                            : 'รอปลุกชีพ'}
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-stone-950 rounded-xs overflow-hidden border border-emerald-500/35">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-600 to-emerald-300 transition-[width] duration-150"
                        style={{ width: `${minionPct}%` }}
                      />
                    </div>
                  </div>

                  {/* 2. Dominion of Eternal Fealty Status */}
                  <div className="flex flex-col justify-between gap-1 sm:px-2.5">
                    <div className="flex items-center justify-between gap-1">
                      <span
                        className={`font-semibold truncate ${
                          hud.ultReady
                            ? 'text-amber-200'
                            : fealtyCount > 0 || shieldActive
                              ? 'text-purple-200'
                              : 'text-stone-300'
                        }`}
                      >
                        Dominion of Eternal Fealty
                      </span>
                      <span
                        className={`font-mono-num text-[10px] font-bold shrink-0 ${
                          hud.ultReady ? 'text-amber-300' : 'text-purple-300'
                        }`}
                      >
                        {fealtyStateText}
                      </span>
                    </div>
                    {shieldActive ? (
                      <div className="flex items-center gap-1.5">
                        <Shield className="w-3 h-3 text-amber-300 shrink-0" />
                        <div className="flex-1 h-1.5 bg-stone-950 rounded-xs overflow-hidden border border-amber-400/40">
                          <div
                            className="h-full bg-gradient-to-r from-purple-500 via-amber-400 to-yellow-200 transition-[width] duration-150"
                            style={{ width: `${shieldPct}%` }}
                          />
                        </div>
                        <span className="font-mono-num text-[10px] text-amber-200 shrink-0">
                          {shield}/{shieldMax} · {formatClock(Math.ceil(shieldTimer))}
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between text-[10px] text-stone-400 font-mono-num">
                        <span>+{fealtySpeedPct.toFixed(1)}% SPD</span>
                        <span aria-hidden="true">·</span>
                        <span>โล่สูงสุด {shieldMax}</span>
                      </div>
                    )}
                  </div>

                  {/* 3. Soul Bonus Gauge */}
                  <div className="flex flex-col justify-between gap-1 sm:pl-2.5">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-purple-200/90 font-medium truncate">โบนัสดวงวิญญาณ</span>
                      <span className="font-mono-num text-[10px] text-amber-200 shrink-0">
                        {soulProgressPct.toFixed(0)}% Cap
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-stone-950 rounded-xs overflow-hidden border border-purple-500/35">
                      <div
                        className="h-full bg-gradient-to-r from-purple-600 via-fuchsia-400 to-amber-300 transition-[width] duration-150"
                        style={{ width: `${soulProgressPct}%` }}
                      />
                    </div>
                  </div>
                </div>
              </section>
            );
          })()}

          {isSpellblade && (
            <div className="flex flex-wrap items-center justify-center gap-2">
              {(() => {
                const curEl = hud.spellbladeCurrentElement;
                const curElDef = curEl ? ELEMENTS[curEl] : null;
                const pillColor = hud.voidlessActive
                  ? '#E0F2FE'
                  : curElDef
                    ? curElDef.color
                    : hud.spellbladeInfusionColor || '#FBBF24';
                const styleLabel = hud.voidlessActive
                  ? 'จุติไร้ธาตุ (รวม 5 ธาตุ)'
                  : curEl === 'fire'
                    ? 'ดาบไฟ (คลื่นยาว·เผา%)'
                    : curEl === 'water'
                      ? 'ดาบน้ำ (กวาดกว้าง·สโลว์)'
                      : curEl === 'wind'
                        ? 'ดาบลม (ฟันไว·ระยะสั้น)'
                        : curEl === 'light'
                          ? 'ดาบแสง (พุ่งตรง·เจาะทะลุ)'
                          : curEl === 'dark'
                            ? 'ดาบมืด (หนัก·หลุมดำ)'
                            : curEl === 'earth'
                              ? 'ดาบดิน (สั้นหนัก·เกราะ)'
                              : curEl === 'stone'
                                ? 'ดาบหิน (หนา·ทะลุสูง)'
                                : curEl === 'blood'
                                  ? 'ดาบเลือด (ไวกลาง·ดูดHP)'
                                  : hud.spellbladeInfusionName || 'พร้อมผสานธาตุ';
                return (
                  <div
                    className="gothic-hud-box flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-semibold whitespace-nowrap"
                    style={{
                      borderColor: `${pillColor}88`,
                      color: pillColor,
                    }}
                  >
                    <Sparkles className="w-3.5 h-3.5 shrink-0" />
                    <span>{styleLabel}</span>
                    {hud.spellbladeActiveElements.length > 0 && (
                      <span className="flex items-center gap-1 ml-1 pl-1.5 border-l border-stone-700">
                        {hud.spellbladeActiveElements.map((elId) => {
                          const elDef = ELEMENTS[elId];
                          return (
                            <span
                              key={elId}
                              className="px-1 py-0.5 rounded-xs text-[10px] leading-none font-bold border"
                              style={{
                                borderColor: `${elDef.color}88`,
                                backgroundColor: `${elDef.color}22`,
                                color: elDef.glowColor,
                              }}
                            >
                              {elDef.shortTh}
                            </span>
                          );
                        })}
                      </span>
                    )}
                  </div>
                );
              })()}

              {hud.raceClass === 'spellblade_god' && (
                <div className="gothic-hud-box flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-semibold text-stone-200 whitespace-nowrap">
                  <Sparkles className="w-3.5 h-3.5 text-sky-300 shrink-0" />
                  <span>
                    ปลุกดาบไร้ธาตุ:{' '}
                    <span className="font-mono-num text-sky-300">
                      {Math.min(hud.spellbladeFusionCount, hud.spellbladeVoidlessReq)}/
                      {hud.spellbladeVoidlessReq}
                    </span>
                  </span>
                </div>
              )}

              {hud.raceClass === 'voidless_blade' && (
                <div
                  className={`gothic-hud-box flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-semibold whitespace-nowrap ${
                    hud.voidlessActive ? 'border-sky-300 text-sky-100' : 'text-stone-200'
                  }`}
                >
                  <Sparkles
                    className={`w-3.5 h-3.5 shrink-0 ${
                      hud.voidlessActive ? 'text-amber-300' : 'text-sky-300'
                    }`}
                  />
                  {hud.voidlessActive ? (
                    <span>
                      โหมดไร้ธาตุ{' '}
                      <span className="font-mono-num text-amber-300">
                        {hud.voidlessTimer.toFixed(1)}s
                      </span>{' '}
                      · ดาเมจ +55% · ลดดาเมจ 50% · ดาบ{' '}
                      <span className="font-mono-num text-sky-200">{hud.spiritSwordsCount}/5</span>
                    </span>
                  ) : (
                    <span>
                      โหมดไร้ธาตุ: ฆ่า{' '}
                      <span className="font-mono-num text-sky-300">
                        {Math.min(hud.voidlessKills, hud.voidlessKillsReq)}/{hud.voidlessKillsReq}
                      </span>
                      {hud.voidlessCooldown > 0.1 && (
                        <span className="font-mono-num text-amber-300">
                          {' '}
                          · CD {hud.voidlessCooldown.toFixed(1)}s
                        </span>
                      )}
                    </span>
                  )}
                </div>
              )}

              <div
                className={`gothic-hud-box flex items-center gap-2 px-2.5 py-1 rounded text-xs font-semibold whitespace-nowrap ${
                  hud.spellbladeChargeCooldown > 0.05
                    ? 'text-stone-300'
                    : hud.spellbladeCharge >= 0.999
                      ? 'border-amber-300 text-amber-100'
                      : 'border-amber-400/60 text-amber-200'
                }`}
                title="คูลดาวน์โฟกัส (Focus Cooldown): หลังปล่อยชาร์จ 360° ต้องรอ 3 วิจึงจะเริ่มชาร์จใหม่ได้"
              >
                {hud.spellbladeChargeCooldown > 0.05 ? (
                  <>
                    <span>โฟกัสพัก (Focus)</span>
                    <div className="w-16 h-2 bg-stone-950 rounded-xs overflow-hidden border border-stone-700">
                      <div
                        className="h-full bg-stone-400 transition-[width] duration-75"
                        style={{
                          width: `${Math.max(
                            0,
                            Math.min(
                              100,
                              (1 -
                                hud.spellbladeChargeCooldown /
                                  Math.max(0.1, hud.spellbladeChargeMaxCooldown)) *
                                100
                            )
                          )}%`,
                        }}
                      />
                    </div>
                    <span className="font-mono-num text-[11px] text-amber-300">
                      {hud.spellbladeChargeCooldown.toFixed(1)}s
                    </span>
                  </>
                ) : (
                  <>
                    <span>
                      {hud.spellbladeCharge >= 0.999
                        ? 'ดาบพร้อมฟัน 360° (ขยับ/ปล่อยปุ่ม)'
                        : 'ยืนนิ่งชาร์จดาบ'}
                    </span>
                    <div className="w-16 h-2 bg-stone-950 rounded-xs overflow-hidden border border-stone-700">
                      <div
                        className="h-full transition-[width] duration-75"
                        style={{
                          width: `${Math.round(hud.spellbladeCharge * 100)}%`,
                          backgroundColor:
                            hud.spellbladeCharge >= 0.999
                              ? '#FFFFFF'
                              : hud.spellbladeInfusionColor || '#FBBF24',
                        }}
                      />
                    </div>
                    <span className="font-mono-num text-[11px] text-amber-300">
                      {Math.round(hud.spellbladeCharge * 100)}%
                    </span>
                  </>
                )}
              </div>
            </div>
          )}

          {hud.weather === 'acid_rain' && (
            <div className="gothic-hud-box flex items-center gap-1 px-2.5 py-1 rounded border-lime-500/65 text-xs font-semibold text-lime-200 whitespace-nowrap">
              <Droplets className="w-3.5 h-3.5 text-lime-300" />
              <span>ฝนกรด: เกราะ -4 · ระวังบ่อกรด</span>
            </div>
          )}

          {hud.weather === 'mist' && (
            <div className="gothic-hud-box flex items-center gap-1 px-2.5 py-1 rounded border-cyan-300/55 text-xs font-semibold text-cyan-100 whitespace-nowrap">
              <CloudFog className="w-3.5 h-3.5 text-cyan-200" />
              <span>ม่านหมอก: ลดระยะตรวจจับมอนสเตอร์</span>
            </div>
          )}

          {hud.weatherSlowed && (
            <div className="gothic-hud-box flex items-center gap-1 px-2.5 py-1 rounded border-amber-500/60 text-xs font-semibold text-amber-200 whitespace-nowrap">
              <Wind className="w-3.5 h-3.5 text-amber-300" />
              <span>{hud.weather === 'blizzard' ? 'พื้นน้ำแข็ง: เดินช้า' : 'โดนพายุทราย: เดินช้า'}</span>
            </div>
          )}

          {hud.snared && (
            <div className="gothic-hud-box flex items-center gap-1 px-2.5 py-1 rounded border-purple-500/60 text-xs font-semibold text-purple-200 whitespace-nowrap">
              <span>ติดกับดัก: เดินช้า</span>
            </div>
          )}

          {raceId === 'mage' && hud.usesMana && hud.lowManaWarning && (
            <div className="gothic-hud-box flex items-center gap-1 px-2.5 py-1 rounded border-blue-400/75 text-xs font-semibold text-blue-200 whitespace-nowrap">
              <Sparkles className="w-3.5 h-3.5 text-blue-300" />
              <span>มานาไม่พอ! เก็บออร์บธาตุ/อัญมณีมานา</span>
            </div>
          )}
        </div>

        <div className="gothic-hud-box w-68 sm:w-84 rounded-md p-2">
          <div className="flex items-center justify-between text-xs px-1 mb-1">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="font-semibold text-amber-50 truncate">{race.nameTh}</span>
              {evolvedClass && (
                <span
                  className="px-1.5 py-0.5 rounded-xs text-[10px] font-bold leading-none border shrink-0"
                  style={{
                    backgroundColor: `${evolvedClass.color}1F`,
                    borderColor: `${evolvedClass.color}66`,
                    color: evolvedClass.color,
                  }}
                >
                  {evolvedClass.nameTh}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5 shrink-0 ml-2">
              {hud.reaperCurseStacks > 0 && (
                <span
                  className="inline-flex items-center gap-0.5 px-1 py-0.5 rounded-xs bg-rose-950/90 border border-rose-500/60 font-mono-num text-[10px] font-bold text-rose-300 leading-none"
                  title={`คำสาปยมทูต ${hud.reaperCurseStacks} ชั้น (Max HP -${Math.min(90, hud.reaperCurseStacks)}%)`}
                >
                  <Skull className="w-2.5 h-2.5 text-rose-400" />
                  <span>{hud.reaperCurseStacks}</span>
                </span>
              )}
              <span className="font-mono-num font-bold text-rose-300">
                HP {hud.hp} / {hud.maxHp}
              </span>
            </div>
          </div>
          <div className="w-full h-2.5 bg-stone-950 border border-rose-900/50 rounded-xs overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-rose-700 via-rose-500 to-rose-400 transition-[width] duration-100"
              style={{ width: `${hpPct}%` }}
            />
          </div>

          {raceId === 'mage' && hud.usesMana && (
            <div className="mt-1.5">
              <div className="flex items-center justify-between text-[11px] px-1 mb-0.5">
                <span className="text-sky-300 font-semibold">
                  มานา (จอมเวทย์){' '}
                  <span className="font-mono-num text-sky-200/80">(+{hud.manaRegen.toFixed(1)}/s)</span>
                </span>
                <span className="font-mono-num font-bold text-sky-300">
                  MP {hud.mana} / {hud.maxMana}
                </span>
              </div>
              <div className="w-full h-2.5 bg-slate-950 border border-sky-500/40 rounded-xs overflow-hidden">
                <div
                  className={`h-full transition-[width] duration-100 ${
                    hud.lowManaWarning
                      ? 'bg-amber-400'
                      : 'bg-gradient-to-r from-blue-600 via-sky-500 to-cyan-300'
                  }`}
                  style={{ width: `${manaPct}%` }}
                />
              </div>
            </div>
          )}

          {raceId === 'vampire' && (
            <div className="mt-1.5">
              <div className="flex items-center justify-between text-[11px] px-1 mb-0.5">
                <span className="text-rose-300 font-semibold">เกจโลหิต (Bat Swarm)</span>
                <span className="font-mono-num font-bold text-rose-300">
                  {hud.vampireBlood || 0} / {hud.vampireBloodMax || 100}
                </span>
              </div>
              <div className="w-full h-2 bg-stone-950 border border-rose-500/40 rounded-xs overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-rose-800 via-rose-500 to-pink-400 transition-[width] duration-100"
                  style={{
                    width: `${Math.max(
                      0,
                      Math.min(100, ((hud.vampireBlood || 0) / Math.max(1, hud.vampireBloodMax || 100)) * 100)
                    )}%`,
                  }}
                />
              </div>
            </div>
          )}

          {raceId === 'orc' && (
            <div className="mt-1.5">
              <div className="flex items-center justify-between text-[11px] px-1 mb-0.5">
                <span className="text-orange-300 font-semibold">
                  {(hud.orcBerserkTimer || 0) > 0 ? 'คลั่ง BERSERK (คริ 100%)' : 'เกจโทสะ (Rage)'}
                </span>
                <span className="font-mono-num font-bold text-orange-300">
                  {(hud.orcBerserkTimer || 0) > 0
                    ? `${(hud.orcBerserkTimer || 0).toFixed(1)}s`
                    : `${hud.orcRage || 0} / ${hud.orcRageMax || 100}`}
                </span>
              </div>
              <div className="w-full h-2 bg-stone-950 border border-orange-500/40 rounded-xs overflow-hidden">
                <div
                  className={`h-full transition-[width] duration-100 ${
                    (hud.orcBerserkTimer || 0) > 0
                      ? 'bg-gradient-to-r from-red-600 via-orange-400 to-yellow-300'
                      : 'bg-gradient-to-r from-amber-700 via-orange-500 to-amber-300'
                  }`}
                  style={{
                    width: `${
                      (hud.orcBerserkTimer || 0) > 0
                        ? Math.max(0, Math.min(100, ((hud.orcBerserkTimer || 0) / 5.0) * 100))
                        : Math.max(
                            0,
                            Math.min(100, ((hud.orcRage || 0) / Math.max(1, hud.orcRageMax || 100)) * 100)
                          )
                    }%`,
                  }}
                />
              </div>
            </div>
          )}
          {hud.classGaugeMax > 0 && (
            <div className="mt-1.5">
              <div className="flex items-center justify-between text-[11px] px-1 mb-0.5 gap-2">
                <span
                  className="font-semibold truncate"
                  style={{ color: hud.classGaugeColor || '#FBBF24' }}
                >
                  {hud.ultActiveTimer > 0
                    ? `${hud.ultTitleTh} (${hud.ultActiveTimer.toFixed(1)}s)`
                    : hud.classGaugeLabelTh}
                </span>
                <span
                  className={`font-mono-num font-bold shrink-0 ${
                    hud.ultReady ? 'text-amber-300 animate-pulse' : 'text-stone-200'
                  }`}
                >
                  {hud.ultReady
                    ? 'ค้าง SPACE ท่าไม้ตาย!'
                    : hud.raceClass === 'vampire_lord' &&
                        hud.classGauge >= hud.classGaugeMax &&
                        hud.ultActiveTimer <= 0
                      ? 'ต้อง HP < 50%'
                      : `${hud.classGauge} / ${hud.classGaugeMax}`}
                </span>
              </div>
              <div className="w-full h-2 bg-stone-950 border border-amber-500/35 rounded-xs overflow-hidden">
                <div
                  className="h-full transition-[width] duration-100"
                  style={{
                    width: `${
                      hud.ultActiveTimer > 0 && hud.ultActiveMax > 0
                        ? Math.max(0, Math.min(100, (hud.ultActiveTimer / hud.ultActiveMax) * 100))
                        : Math.max(
                            0,
                            Math.min(100, (hud.classGauge / Math.max(1, hud.classGaugeMax)) * 100)
                          )
                    }%`,
                    backgroundColor: hud.ultReady ? '#FDE047' : hud.classGaugeColor || '#FBBF24',
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom-Right: Thumb-Friendly Mobile & Clickable Active Skill Button (All Races) */}
      {(() => {
        let label = hud.raceClass === 'hunter' ? 'ฟันเงา' : 'แดช';
        let accent = hud.raceClass === 'hunter' ? '#34D399' : '#38BDF8';
        let ready =
          hud.raceClass === 'hunter'
            ? (hud.hunterDashCharges ?? 0) > 0
            : hud.dashCooldown <= 0.05;
        let pct =
          hud.raceClass === 'hunter'
            ? ((hud.hunterDashCharges ?? 0) > 0
                ? ((hud.hunterDashCharges ?? 0) / Math.max(1, hud.hunterDashMaxCharges || 3)) * 100
                : Math.max(0, Math.min(100, (1 - hud.dashCooldown / Math.max(0.1, hud.dashMaxCooldown)) * 100)))
            : Math.max(
                0,
                Math.min(100, (1 - hud.dashCooldown / Math.max(0.1, hud.dashMaxCooldown)) * 100)
              );
        let subText =
          hud.raceClass === 'hunter'
            ? (hud.hunterDashCharges ?? 0) > 0
              ? `${hud.hunterDashCharges}/${hud.hunterDashMaxCharges || 3}`
              : `${hud.dashCooldown.toFixed(1)}s`
            : ready
              ? 'พร้อม'
              : `${hud.dashCooldown.toFixed(1)}s`;
        let iconEl = <Wind className={`w-6 h-6 ${hud.raceClass === 'hunter' ? 'text-emerald-300' : 'text-sky-300'}`} />;

        if (raceId === 'mage') {
          label = 'วอยด์';
          accent = '#C084FC';
          const enoughMp = hud.mana >= hud.voidInfusionCost;
          ready = !hud.voidInfusionActive && enoughMp;
          pct = hud.voidInfusionActive
            ? 100
            : Math.max(0, Math.min(100, (hud.mana / Math.max(1, hud.voidInfusionCost)) * 100));
          subText = hud.voidInfusionActive
            ? 'เปิดแล้ว'
            : enoughMp
              ? `${hud.voidInfusionCost} MP`
              : `${hud.mana}/${hud.voidInfusionCost}`;
          iconEl = <Zap className="w-6 h-6 text-purple-300" />;
        } else if (raceId === 'vampire') {
          label = 'ค้างคาว';
          accent = '#FB7185';
          const blood = hud.vampireBlood || 0;
          const bloodMax = Math.max(1, hud.vampireBloodMax || 100);
          const active = (hud.batSwarmTimer || 0) > 0;
          const cd = hud.batSwarmCooldown || 0;
          ready = !active && cd <= 0.05 && blood >= bloodMax;
          pct = active
            ? ((hud.batSwarmTimer || 0) / 1.5) * 100
            : cd > 0.05
              ? Math.max(0, Math.min(100, (1 - cd / 6.5) * 100))
              : Math.min(100, (blood / bloodMax) * 100);
          subText = active
            ? `${(hud.batSwarmTimer || 0).toFixed(1)}s`
            : cd > 0.05
              ? `${cd.toFixed(1)}s`
              : ready
                ? 'พร้อม'
                : `${blood}%`;
          iconEl = <Moon className="w-6 h-6 text-rose-300" />;
        } else if (raceId === 'orc') {
          label = 'คำราม';
          accent = '#FBBF24';
          const cd = hud.warCryCooldown || 0;
          ready = cd <= 0.05;
          pct = Math.max(0, Math.min(100, (1 - cd / 8.0) * 100));
          subText = ready ? 'พร้อม' : `${cd.toFixed(1)}s`;
          iconEl = <Flame className="w-6 h-6 text-amber-300" />;
        }

        const r = 29;
        const circ = 2 * Math.PI * r;
        const dashOffset = circ * (1 - Math.max(0, Math.min(100, pct)) / 100);
        const holdRingR = 32;
        const holdCirc = 2 * Math.PI * holdRingR;
        const holdProgress = Math.max(0, Math.min(1, hud.ultHoldProgress || 0));
        const holdOffset = holdCirc * (1 - holdProgress);

        return (
          <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-20 pointer-events-auto flex flex-col items-center gap-1 select-none">
            {hud.ultReady && (
              <span
                className="px-2 py-0.5 rounded bg-[#07080D]/95 border text-[10px] font-bold animate-pulse whitespace-nowrap"
                style={{
                  borderColor: hud.classGaugeColor || '#FDE047',
                  color: hud.classGaugeColor || '#FDE047',
                }}
              >
                ค้างท่าไม้ตาย!
              </span>
            )}
            <button
              type="button"
              onPointerDown={(e) => {
                e.stopPropagation();
                if (onStartHoldActiveSkill) {
                  onStartHoldActiveSkill();
                } else {
                  onTriggerActiveSkill();
                }
              }}
              onPointerUp={(e) => {
                e.stopPropagation();
                onReleaseHoldActiveSkill?.();
              }}
              onPointerLeave={(e) => {
                e.stopPropagation();
                onReleaseHoldActiveSkill?.();
              }}
              onPointerCancel={(e) => {
                e.stopPropagation();
                onReleaseHoldActiveSkill?.();
              }}
              aria-label={`ใช้สกิล ${label}`}
              className={`relative w-16 h-16 sm:w-[70px] sm:h-[70px] rounded-full flex flex-col items-center justify-center bg-[#090B12]/90 border transition-transform active:scale-92 cursor-pointer shadow-[0_6px_24px_rgba(0,0,0,0.75)] ${
                hud.ultReady
                  ? 'border-amber-300'
                  : ready
                    ? 'border-amber-300/80'
                    : 'border-stone-600/70 opacity-85'
              }`}
              style={
                hud.ultReady
                  ? {
                      boxShadow: `0 0 22px ${hud.classGaugeColor || '#FDE047'}88, 0 6px 24px rgba(0,0,0,0.85)`,
                      borderColor: hud.classGaugeColor || '#FDE047',
                    }
                  : ready
                    ? {
                        boxShadow: `0 0 18px ${accent}55, 0 6px 24px rgba(0,0,0,0.8)`,
                        borderColor: accent,
                      }
                    : undefined
              }
            >
              <svg
                className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none"
                viewBox="0 0 68 68"
              >
                <circle
                  cx="34"
                  cy="34"
                  r={r}
                  fill="none"
                  stroke="rgba(255,255,255,0.08)"
                  strokeWidth="3.5"
                />
                <circle
                  cx="34"
                  cy="34"
                  r={r}
                  fill="none"
                  stroke={accent}
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeDasharray={circ}
                  strokeDashoffset={dashOffset}
                />
                {holdProgress > 0.01 && (
                  <circle
                    cx="34"
                    cy="34"
                    r={holdRingR}
                    fill="none"
                    stroke={hud.classGaugeColor || '#FDE047'}
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeDasharray={holdCirc}
                    strokeDashoffset={holdOffset}
                  />
                )}
              </svg>
              <div className="relative flex flex-col items-center leading-none">
                {iconEl}
                <span className="mt-0.5 text-[10px] font-bold text-amber-50">{label}</span>
              </div>
              <span className="absolute -top-1.5 px-1.5 py-0.5 rounded bg-[#07080D] border border-amber-500/45 text-[9px] font-mono-num font-bold text-amber-200 leading-none">
                {hud.ultReady ? 'HOLD' : 'SPACE'}
              </span>
            </button>
            <span
              className="px-2 py-0.5 rounded bg-[#07080D]/90 border border-stone-700/80 font-mono-num text-[10px] font-semibold"
              style={{ color: ready ? accent : '#CBD5E1' }}
            >
              {subText}
            </span>
          </div>
        );
      })()}
    </div>
  );
};
