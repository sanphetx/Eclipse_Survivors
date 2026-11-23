import React from 'react';
import {
  Coins,
  Crown,
  Flame,
  Heart,
  RefreshCw,
  ShoppingBag,
  Skull,
  Sparkles,
  Swords,
  X,
} from 'lucide-react';
import {
  HudSnapshot,
  MapInteractionPrompt,
  MapInteractionResult,
} from '../game/types';
import { ArtifactIcon } from './GameIcons';

interface MapInteractionModalProps {
  prompt: MapInteractionPrompt;
  hud: HudSnapshot;
  onResolve: (result: MapInteractionResult) => void;
}

export const MapInteractionModal: React.FC<MapInteractionModalProps> = ({
  prompt,
  hud,
  onResolve,
}) => {
  if (prompt.kind === 'cursed_statue') {
    return (
      <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4">
        <div className="gothic-panel w-full max-w-xl rounded-lg overflow-hidden">
          <div className="flex flex-col items-center text-center px-6 pt-5 pb-4 border-b border-purple-500/30 bg-[#0A090F]/80">
            <div className="w-12 h-12 rounded-full bg-purple-950/70 border border-purple-400/70 flex items-center justify-center mb-2">
              <Sparkles className="w-6 h-6 text-purple-300" />
            </div>
            <h2 className="font-display text-2xl font-bold text-purple-200 tracking-wide">
              รูปปั้นเทพต้องสาป
            </h2>
            <p className="text-xs sm:text-sm text-stone-300 mt-1">
              เลือกสวดขอพรแห่งแสง หรือรับคำสาปแห่งความมั่งคั่ง (คงอยู่ 3 นาที)
            </p>
          </div>

          <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() =>
                onResolve({
                  kind: 'cursed_statue',
                  landmarkId: prompt.landmarkId,
                  choice: 'blessing',
                })
              }
              className="gothic-card rounded-md p-4 text-left border border-amber-400/50 hover:border-amber-300 transition-colors cursor-pointer flex flex-col justify-between gap-3"
            >
              <div>
                <div className="flex items-center gap-2 text-amber-300 font-bold text-sm">
                  <Crown className="w-4 h-4 shrink-0" />
                  <span>รับพรแห่งการสังหาร</span>
                </div>
                <p className="text-xs text-stone-300 mt-1.5 leading-relaxed">
                  เพิ่มพลังโจมตีทั้งหมด <span className="font-mono-num text-amber-300 font-bold">+20% DMG</span> นาน 3 นาที โดยไม่มีผลเสีย
                </p>
              </div>
              <span className="text-[11px] font-semibold text-amber-200 whitespace-nowrap">
                เลือกพรนี้
              </span>
            </button>

            <button
              type="button"
              onClick={() =>
                onResolve({
                  kind: 'cursed_statue',
                  landmarkId: prompt.landmarkId,
                  choice: 'curse',
                })
              }
              className="gothic-card rounded-md p-4 text-left border border-rose-500/50 hover:border-rose-400 transition-colors cursor-pointer flex flex-col justify-between gap-3"
            >
              <div>
                <div className="flex items-center gap-2 text-rose-300 font-bold text-sm">
                  <Skull className="w-4 h-4 shrink-0" />
                  <span>รับคำสาปโลหิตทอง</span>
                </div>
                <p className="text-xs text-stone-300 mt-1.5 leading-relaxed">
                  ทองที่ได้รับ <span className="font-mono-num text-amber-300 font-bold">×2</span> นาน 3 นาที แต่ศัตรูโจมตีแรงขึ้น{' '}
                  <span className="font-mono-num text-rose-400 font-bold">+25%</span>
                </p>
              </div>
              <span className="text-[11px] font-semibold text-rose-200 whitespace-nowrap">
                ท้าทายคำสาป
              </span>
            </button>
          </div>

          <div className="px-5 pb-4 flex justify-center">
            <button
              type="button"
              onClick={() =>
                onResolve({
                  kind: 'cursed_statue',
                  landmarkId: prompt.landmarkId,
                  choice: 'cancel',
                })
              }
              className="gothic-btn-iron px-4 py-1.5 rounded text-xs font-semibold whitespace-nowrap cursor-pointer"
            >
              ถอยออกไปก่อน
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (prompt.kind === 'merchant') {
    const gold = hud.goldEarned;
    const canMeat = gold >= 30;
    const canReroll = gold >= 50;
    const canUpgrade = gold >= 120 && (prompt.hasUpgradeableWeapon || prompt.usesElements);

    return (
      <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4">
        <div className="gothic-panel w-full max-w-2xl rounded-lg overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-amber-500/25 bg-[#0A090F]/80">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-md bg-amber-950/70 border border-amber-400/60 flex items-center justify-center">
                <ShoppingBag className="w-5 h-5 text-amber-300" />
              </div>
              <div>
                <h2 className="font-display text-xl font-bold text-amber-300">
                  ร้านค้าเร่ร่อนกลางสมรภูมิ
                </h2>
                <p className="text-xs text-stone-300">
                  ใช้ทองที่เก็บได้ในรอบนี้เพื่อซื้อเสบียงฉุกเฉิน
                </p>
              </div>
            </div>
            <div className="gothic-hud-box flex items-center gap-1.5 px-3 py-1.5 rounded font-mono-num text-sm font-bold text-amber-300">
              <Coins className="w-4 h-4 text-amber-400" />
              <span>{gold.toLocaleString()}</span>
            </div>
          </div>

          <div className="p-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              type="button"
              disabled={!canMeat}
              onClick={() =>
                onResolve({ kind: 'merchant', landmarkId: prompt.landmarkId, action: 'meat' })
              }
              className={`gothic-card rounded-md p-4 text-left flex flex-col justify-between gap-3 transition-colors ${
                canMeat
                  ? 'border border-emerald-500/50 hover:border-emerald-300 cursor-pointer'
                  : 'opacity-50 cursor-not-allowed'
              }`}
            >
              <div>
                <div className="flex items-center gap-2 text-emerald-300 font-bold text-sm">
                  <Heart className="w-4 h-4 shrink-0" />
                  <span>เนื้อย่างฟื้นพลัง</span>
                </div>
                <p className="text-xs text-stone-300 mt-1.5 leading-relaxed">
                  ฟื้นฟูพลังชีวิต <span className="font-mono-num text-emerald-300 font-bold">+50% Max HP</span> ทันที
                </p>
              </div>
              <div className="flex items-center justify-between text-xs font-mono-num font-bold text-amber-300">
                <span>30 ทอง</span>
                <span>{canMeat ? 'ซื้อเลย' : 'ทองไม่พอ'}</span>
              </div>
            </button>

            <button
              type="button"
              disabled={!canReroll}
              onClick={() =>
                onResolve({ kind: 'merchant', landmarkId: prompt.landmarkId, action: 'reroll' })
              }
              className={`gothic-card rounded-md p-4 text-left flex flex-col justify-between gap-3 transition-colors ${
                canReroll
                  ? 'border border-sky-500/50 hover:border-sky-300 cursor-pointer'
                  : 'opacity-50 cursor-not-allowed'
              }`}
            >
              <div>
                <div className="flex items-center gap-2 text-sky-300 font-bold text-sm">
                  <RefreshCw className="w-4 h-4 shrink-0" />
                  <span>ลูกเต๋าโชคชะตา</span>
                </div>
                <p className="text-xs text-stone-300 mt-1.5 leading-relaxed">
                  ได้รับสิทธิ์รีโรลตัวเลือกตอนอัปเลเวล <span className="font-mono-num text-sky-300 font-bold">+2 ครั้ง</span>
                </p>
              </div>
              <div className="flex items-center justify-between text-xs font-mono-num font-bold text-amber-300">
                <span>50 ทอง</span>
                <span>{canReroll ? 'ซื้อเลย' : 'ทองไม่พอ'}</span>
              </div>
            </button>

            <button
              type="button"
              disabled={!canUpgrade}
              onClick={() =>
                onResolve({
                  kind: 'merchant',
                  landmarkId: prompt.landmarkId,
                  action: 'upgrade_weapon',
                })
              }
              className={`gothic-card rounded-md p-4 text-left flex flex-col justify-between gap-3 transition-colors ${
                canUpgrade
                  ? 'border border-amber-500/60 hover:border-amber-300 cursor-pointer'
                  : 'opacity-50 cursor-not-allowed'
              }`}
            >
              <div>
                <div className="flex items-center gap-2 text-amber-300 font-bold text-sm">
                  <Swords className="w-4 h-4 shrink-0" />
                  <span>{prompt.usesElements ? 'ตำราพรจอมเวทย์' : 'ลับคมศัสตรา'}</span>
                </div>
                <p className="text-xs text-stone-300 mt-1.5 leading-relaxed">
                  สุ่มอัปเกรด{prompt.usesElements ? 'พรธาตุ' : 'อาวุธที่ถืออยู่'}ทันที{' '}
                  <span className="font-mono-num text-amber-300 font-bold">+1 เลเวล</span>
                </p>
              </div>
              <div className="flex items-center justify-between text-xs font-mono-num font-bold text-amber-300">
                <span>120 ทอง</span>
                <span>
                  {!prompt.hasUpgradeableWeapon && !prompt.usesElements
                    ? 'ไม่มีอาวุธ'
                    : canUpgrade
                      ? 'อัปเกรด'
                      : 'ทองไม่พอ'}
                </span>
              </div>
            </button>
          </div>

          <div className="px-5 pb-4 flex justify-end">
            <button
              type="button"
              onClick={() =>
                onResolve({ kind: 'merchant', landmarkId: prompt.landmarkId, action: 'close' })
              }
              className="gothic-btn-iron flex items-center gap-1.5 px-4 py-1.5 rounded text-xs font-semibold whitespace-nowrap cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              <span>ออกเดินทางต่อ</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (prompt.kind === 'blood_shrine') {
    return (
      <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4">
        <div className="gothic-panel w-full max-w-md rounded-lg overflow-hidden border-rose-500/50">
          <div className="flex flex-col items-center text-center px-6 pt-5 pb-4 border-b border-rose-500/25 bg-[#0A090F]/80">
            <div className="w-12 h-12 rounded-full bg-rose-950/80 border border-rose-400/70 flex items-center justify-center mb-2">
              <Flame className="w-6 h-6 text-rose-400" />
            </div>
            <h2 className="font-display text-2xl font-bold text-rose-300">
              ศาลเจ้าแลกเลือด
            </h2>
            <p className="text-xs sm:text-sm text-stone-300 mt-1">
              สังเวยพลังชีวิต 30% ปัจจุบัน เพื่อปลุกพลังอาวุธหรือพรแบบสุ่ม +1 ขั้น
            </p>
          </div>

          <div className="p-5 flex flex-col gap-4">
            <div className="gothic-card rounded p-3 flex items-center justify-between text-xs">
              <span className="text-stone-300">HP ที่ต้องสังเวย:</span>
              <span className="font-mono-num font-bold text-rose-300">
                -{prompt.hpCost.toLocaleString()} HP (เหลือ{' '}
                {Math.max(1, prompt.currentHp - prompt.hpCost).toLocaleString()} HP)
              </span>
            </div>

            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() =>
                  onResolve({ kind: 'blood_shrine', landmarkId: prompt.landmarkId, accept: true })
                }
                className="gothic-btn-gold flex-1 py-2 px-4 rounded text-sm font-bold whitespace-nowrap cursor-pointer"
              >
                สังเวยโลหิต (-{prompt.hpCost} HP)
              </button>
              <button
                type="button"
                onClick={() =>
                  onResolve({ kind: 'blood_shrine', landmarkId: prompt.landmarkId, accept: false })
                }
                className="gothic-btn-iron py-2 px-4 rounded text-sm font-semibold whitespace-nowrap cursor-pointer"
              >
                ปฏิเสธ
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (prompt.kind === 'secret_shop') {
    const gold = hud.goldEarned;
    const equippedIds = Object.values(hud.artifacts);

    return (
      <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4">
        <div className="gothic-panel w-full max-w-3xl rounded-lg overflow-hidden border-purple-500/50">
          <div className="flex items-center justify-between px-6 py-4 border-b border-purple-500/25 bg-[#0A090F]/80">
            <div>
              <h2 className="font-display text-xl font-bold text-purple-200">
                ร้านค้าลับแห่งเงามืด
              </h2>
              <p className="text-xs text-stone-300">
                เลือกซื้อ Artifact หายากด้วยทองในรอบ (ใส่แทนสล็อตเดิมของชนิดนั้น)
              </p>
            </div>
            <div className="gothic-hud-box flex items-center gap-1.5 px-3 py-1.5 rounded font-mono-num text-sm font-bold text-amber-300">
              <Coins className="w-4 h-4 text-amber-400" />
              <span>{gold.toLocaleString()}</span>
            </div>
          </div>

          <div className="p-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
            {prompt.offers.map((offer) => {
              const isOwned = offer.owned || equippedIds.includes(offer.id);
              const canBuy = !isOwned && gold >= offer.price;
              return (
                <button
                  key={offer.id}
                  type="button"
                  disabled={!canBuy}
                  onClick={() =>
                    onResolve({ kind: 'secret_shop', buyArtifactId: offer.id })
                  }
                  className={`gothic-card rounded-md p-4 text-left flex flex-col justify-between gap-3 transition-colors ${
                    isOwned
                      ? 'opacity-65 border-emerald-500/40 cursor-default'
                      : canBuy
                        ? 'hover:border-purple-300 cursor-pointer'
                        : 'opacity-55 cursor-not-allowed'
                  }`}
                  style={{ borderColor: isOwned ? undefined : `${offer.color}66` }}
                >
                  <div>
                    <div className="flex items-center gap-2.5 mb-2">
                      <ArtifactIcon id={offer.id} className="w-8 h-8 shrink-0" />
                      <div className="font-bold text-sm leading-tight" style={{ color: offer.color }}>
                        {offer.nameTh}
                      </div>
                    </div>
                    <p className="text-[11px] text-stone-300 leading-relaxed">
                      {offer.descTh}
                    </p>
                  </div>
                  <div className="flex items-center justify-between text-xs font-mono-num font-bold pt-2 border-t border-stone-800">
                    <span className="text-amber-300">{offer.price} ทอง</span>
                    <span className={isOwned ? 'text-emerald-300' : canBuy ? 'text-purple-200' : 'text-stone-400'}>
                      {isOwned ? 'มีอยู่แล้ว' : canBuy ? 'ซื้อเลย' : 'ทองไม่พอ'}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="px-5 pb-4 flex justify-end">
            <button
              type="button"
              onClick={() => onResolve({ kind: 'secret_shop', close: true })}
              className="gothic-btn-gold px-5 py-1.5 rounded text-xs font-bold whitespace-nowrap cursor-pointer"
            >
              ปิดร้านค้า & เปิดทางกลับ
            </button>
          </div>
        </div>
      </div>
    );
  }

  // god_blessing
  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4">
      <div className="gothic-panel w-full max-w-2xl rounded-lg overflow-hidden border-sky-400/50">
        <div className="flex flex-col items-center text-center px-6 pt-5 pb-4 border-b border-sky-500/25 bg-[#0A090F]/80">
          <div className="w-12 h-12 rounded-full bg-sky-950/80 border border-sky-400/70 flex items-center justify-center mb-2">
            <Crown className="w-6 h-6 text-sky-300" />
          </div>
          <h2 className="font-display text-2xl font-bold text-sky-200">
            วิหารพรแห่งทวยเทพ
          </h2>
          <p className="text-xs sm:text-sm text-stone-300 mt-1">
            เลือกพรถาวรตลอดรอบนี้ 1 อย่าง
          </p>
        </div>

        <div className="p-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            type="button"
            onClick={() => onResolve({ kind: 'god_blessing', choice: 'reaction' })}
            className="gothic-card rounded-md p-4 text-left border border-sky-400/50 hover:border-sky-300 cursor-pointer flex flex-col justify-between gap-3"
          >
            <div>
              <div className="font-bold text-sm text-sky-300">พรปฏิกิริยาธาตุ</div>
              <p className="text-xs text-stone-300 mt-1.5 leading-relaxed">
                ดาเมจปฏิกิริยาธาตุและเวทย์ผสมเพิ่มขึ้นถาวร{' '}
                <span className="font-mono-num text-sky-300 font-bold">+25%</span>
              </p>
            </div>
            <span className="text-[11px] font-semibold text-sky-200">รับพรนี้</span>
          </button>

          <button
            type="button"
            onClick={() => onResolve({ kind: 'god_blessing', choice: 'area' })}
            className="gothic-card rounded-md p-4 text-left border border-amber-400/50 hover:border-amber-300 cursor-pointer flex flex-col justify-between gap-3"
          >
            <div>
              <div className="font-bold text-sm text-amber-300">พรขยายอาณาเขต</div>
              <p className="text-xs text-stone-300 mt-1.5 leading-relaxed">
                รัศมีและขนาดการโจมตีทั้งหมดกว้างขึ้น{' '}
                <span className="font-mono-num text-amber-300 font-bold">+18%</span>
              </p>
            </div>
            <span className="text-[11px] font-semibold text-amber-200">รับพรนี้</span>
          </button>

          <button
            type="button"
            onClick={() => onResolve({ kind: 'god_blessing', choice: 'cdr' })}
            className="gothic-card rounded-md p-4 text-left border border-emerald-400/50 hover:border-emerald-300 cursor-pointer flex flex-col justify-between gap-3"
          >
            <div>
              <div className="font-bold text-sm text-emerald-300">พรแห่งกาลเวลา</div>
              <p className="text-xs text-stone-300 mt-1.5 leading-relaxed">
                ลดคูลดาวน์สกิลและอาวุธทุกชนิด{' '}
                <span className="font-mono-num text-emerald-300 font-bold">-12%</span>
              </p>
            </div>
            <span className="text-[11px] font-semibold text-emerald-200">รับพรนี้</span>
          </button>
        </div>
      </div>
    </div>
  );
};
