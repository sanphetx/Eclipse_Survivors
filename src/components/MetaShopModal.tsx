import React from 'react';
import { Coins, RotateCcw, X } from 'lucide-react';
import { getMetaUpgradeCost, META_UPGRADES } from '../game/data';
import { getTotalTrainingRanksBought } from '../game/metaData';
import { MetaUpgradeId, SaveData } from '../game/types';

interface MetaShopModalProps {
  saveData: SaveData;
  onBuyUpgrade: (id: MetaUpgradeId) => void;
  onRefundAll: () => void;
  onClose: () => void;
}

export const MetaShopModal: React.FC<MetaShopModalProps> = ({
  saveData,
  onBuyUpgrade,
  onRefundAll,
  onClose,
}) => {
  const totalRanksBought = getTotalTrainingRanksBought(saveData.upgrades);
  const hasAnyUpgrades = totalRanksBought > 0;
  const surchargePct = totalRanksBought * 10;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/82 backdrop-blur-xs p-4">
      <div className="gothic-panel w-full max-w-4xl max-h-[90vh] flex flex-col rounded-lg overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-amber-500/25 bg-[#0A090F]/70">
          <div>
            <h2 className="font-display text-xl sm:text-2xl font-bold text-amber-200 tracking-wide">
              ลานฝึกฝน · อัปเกรดค่าพลังถาวร 12 สาย
            </h2>
            <p className="text-xs sm:text-sm text-stone-400 mt-0.5">
              ทุกขั้นที่ซื้อจะเพิ่มราคาของทุกสาย +10% (ปัจจุบัน +{surchargePct}%) — สามารถคืนทองทั้งหมดได้ฟรีตลอดเวลา
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="gothic-hud-box flex items-center gap-1.5 px-3 py-1.5 rounded-md text-amber-300 font-mono-num font-bold">
              <Coins className="w-4 h-4 text-amber-400" />
              <span>{saveData.gold.toLocaleString()}</span>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="ปิด"
              className="gothic-btn-iron p-2 rounded-md text-stone-300 hover:text-amber-200 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Upgrade Grid */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {META_UPGRADES.map((def) => {
            const level = saveData.upgrades[def.id] || 0;
            const isMax = level >= def.maxLevel;
            const cost = getMetaUpgradeCost(def, level, totalRanksBought);
            const canAfford = !isMax && saveData.gold >= cost;

            return (
              <div
                key={def.id}
                className="gothic-card flex flex-col justify-between p-4 rounded-md"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-sm sm:text-base font-bold text-amber-50">
                      {def.nameTh}
                    </h3>
                    <span className="font-mono-num text-xs font-semibold text-amber-300">
                      Lv.{level}/{def.maxLevel}
                    </span>
                  </div>
                  <p className="text-xs text-stone-400 mt-1 leading-relaxed">{def.descriptionTh}</p>
                  <p className="text-xs font-medium text-sky-300 mt-1.5">{def.bonusPerLevelLabel}</p>
                </div>

                <div className="mt-3 pt-3 border-t border-amber-500/15 flex items-center justify-between gap-3">
                  {/* Level pips */}
                  <div className="flex items-center gap-1">
                    {Array.from({ length: def.maxLevel }).map((_, i) => (
                      <span
                        key={i}
                        className={`h-2 w-3 rounded-xs border ${
                          i < level
                            ? 'bg-amber-400 border-amber-200/80 shadow-[0_0_6px_rgba(251,191,36,0.45)]'
                            : 'bg-stone-900 border-stone-700'
                        }`}
                      />
                    ))}
                  </div>

                  <button
                    type="button"
                    disabled={!canAfford}
                    onClick={() => onBuyUpgrade(def.id)}
                    className={`px-3 py-1.5 rounded text-xs font-semibold font-mono-num whitespace-nowrap shrink-0 cursor-pointer transition-colors ${
                      isMax
                        ? 'bg-stone-900 border border-stone-700 text-stone-500 cursor-not-allowed'
                        : canAfford
                          ? 'gothic-btn-gold'
                          : 'bg-stone-900 border border-stone-800 text-stone-500 cursor-not-allowed opacity-75'
                    }`}
                  >
                    {isMax ? 'สูงสุดแล้ว' : `อัปเกรด (${cost.toLocaleString()})`}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3.5 border-t border-amber-500/20 bg-[#0A090F]/85">
          <button
            type="button"
            disabled={!hasAnyUpgrades}
            onClick={onRefundAll}
            className={`flex items-center gap-1.5 px-3 py-2 rounded text-xs font-medium transition-colors cursor-pointer ${
              hasAnyUpgrades
                ? 'text-rose-300 hover:bg-rose-500/10 border border-rose-500/25'
                : 'text-stone-600 cursor-not-allowed'
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>คืนทองทั้งหมด ({saveData.trainingGoldSpent.toLocaleString()} ทอง)</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="gothic-btn-gold px-5 py-2 rounded text-sm font-bold transition-colors cursor-pointer"
          >
            เสร็จสิ้น
          </button>
        </div>
      </div>
    </div>
  );
};
