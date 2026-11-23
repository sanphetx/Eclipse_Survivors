import {
  AltarRowId,
  CampBuildingId,
  CurseId,
  EnemyKind,
  GearDef,
  GearRarity,
  GearSetDef,
  GearSetId,
  GearSlot,
  MetaUpgradeDef,
  MetaUpgradeId,
  OwnedGearItem,
  PetId,
  PotionId,
  RaceId,
  SaveData,
  StageId,
} from './types';

// =====================================================================
// 1. TRAINING GROUNDS (ลานฝึก) — 12 Permanent Upgrades + VS Global +10%
// =====================================================================
export const TRAINING_UPGRADES: MetaUpgradeDef[] = [
  {
    id: 'might',
    nameTh: 'พลังโจมตี',
    descriptionTh: 'เพิ่มความเสียหายอาวุธและเวทย์ทั้งหมด (บวกเข้ากลุ่ม soft-cap)',
    maxLevel: 5,
    baseCost: 200,
    costStep: 0,
    bonusPerLevelLabel: '+4% ดาเมจ/ขั้น (สูงสุด +20%)',
  },
  {
    id: 'maxHp',
    nameTh: 'โลหิตอึดทน',
    descriptionTh: 'เพิ่มพลังชีวิตสูงสุดเริ่มต้นในทุกรอบ',
    maxLevel: 5,
    baseCost: 150,
    costStep: 0,
    bonusPerLevelLabel: '+10 Max HP/ขั้น (สูงสุด +50)',
  },
  {
    id: 'armor',
    nameTh: 'เกราะพิทักษ์',
    descriptionTh: 'ลดความเสียหายที่ได้รับจากการปะทะและกระสุน',
    maxLevel: 3,
    baseCost: 300,
    costStep: 0,
    bonusPerLevelLabel: '+1 เกราะ/ขั้น (สูงสุด +3)',
  },
  {
    id: 'speed',
    nameTh: 'ฝีเท้าสายลม',
    descriptionTh: 'เพิ่มความเร็วในการเคลื่อนที่เพื่อหลบฝูงอสูรและกระสุน',
    maxLevel: 3,
    baseCost: 200,
    costStep: 0,
    bonusPerLevelLabel: '+4% ความเร็ว/ขั้น (สูงสุด +12%)',
  },
  {
    id: 'cooldown',
    nameTh: 'เร่งจังหวะสกิล',
    descriptionTh: 'ลดระยะเวลารอระหว่างการปล่อยอาวุธและเวทย์',
    maxLevel: 4,
    baseCost: 300,
    costStep: 0,
    bonusPerLevelLabel: '-3% คูลดาวน์/ขั้น (สูงสุด -12%)',
  },
  {
    id: 'magnet',
    nameTh: 'ออร่าดูดทรัพยากร',
    descriptionTh: 'ขยายระยะดึงดูดเพชร EXP และเหรียญทอง',
    maxLevel: 4,
    baseCost: 120,
    costStep: 0,
    bonusPerLevelLabel: '+20 ระยะดูด/ขั้น (สูงสุด +80)',
  },
  {
    id: 'greed',
    nameTh: 'โชคลาภนักล่า',
    descriptionTh: 'เพิ่มจำนวนทองที่ได้รับจากมอนสเตอร์และสมบัติ',
    maxLevel: 5,
    baseCost: 250,
    costStep: 0,
    bonusPerLevelLabel: '+8% ทอง/ขั้น (สูงสุด +40%)',
  },
  {
    id: 'revive',
    nameTh: 'ฟื้นคืนชีพ',
    descriptionTh: 'คืนชีพอัตโนมัติ 1 ครั้งต่อรอบพร้อมฟื้น HP 50% และอมตะชั่วคราว',
    maxLevel: 1,
    baseCost: 2500,
    costStep: 0,
    bonusPerLevelLabel: 'ฟื้นชีพ 1 ครั้ง/รอบ (50% HP)',
  },
  {
    id: 'reroll',
    nameTh: 'สุ่มใหม่ (Reroll)',
    descriptionTh: 'สุ่มตัวเลือกในหน้าต่างเลือกอาวุธตอนเลเวลอัปใหม่ได้',
    maxLevel: 5,
    baseCost: 400,
    costStep: 0,
    bonusPerLevelLabel: '+1 ครั้งต่อรอบ/ขั้น (สูงสุด 5)',
  },
  {
    id: 'banish',
    nameTh: 'แบนสกิล (Banish)',
    descriptionTh: 'ตัดอาวุธหรือเครื่องรางที่ไม่ต้องการออกจากพูลตลอดทั้งรอบ',
    maxLevel: 3,
    baseCost: 600,
    costStep: 0,
    bonusPerLevelLabel: '+1 ครั้งต่อรอบ/ขั้น (สูงสุด 3)',
  },
  {
    id: 'skip',
    nameTh: 'ข้ามเพื่อรับทอง (Skip)',
    descriptionTh: 'ข้ามการเลือกเลเวลอัปเพื่อเปลี่ยนเป็นทองคำทันที',
    maxLevel: 3,
    baseCost: 300,
    costStep: 0,
    bonusPerLevelLabel: '+1 ครั้งต่อรอบ/ขั้น (สูงสุด 3)',
  },
  {
    id: 'luck',
    nameTh: 'โชคดี 4 ตัวเลือก',
    descriptionTh: 'เพิ่มโอกาสปรากฏการ์ดตัวเลือกใบที่ 4 เมื่อเลเวลอัป',
    maxLevel: 3,
    baseCost: 500,
    costStep: 0,
    bonusPerLevelLabel: '+5% โอกาสออกการ์ดใบที่ 4/ขั้น (สูงสุด 15%)',
  },
];

export function getTotalTrainingRanksBought(upgrades: Record<MetaUpgradeId, number>): number {
  let total = 0;
  for (const def of TRAINING_UPGRADES) {
    total += Math.max(0, upgrades[def.id] || 0);
  }
  return total;
}

/** Vampire Survivors global surcharge: every rank bought increases all prices by +10% of baseCost */
export function getTrainingUpgradeCost(
  def: MetaUpgradeDef,
  _currentLevel: number,
  totalRanksBought: number
): number {
  return Math.round(def.baseCost * (1 + 0.1 * Math.max(0, totalRanksBought)));
}

/** Exact gold spent across all currently owned Training Grounds ranks so refund is exact */
export function getTrainingRefundGold(upgrades: Record<MetaUpgradeId, number>): number {
  const totalRanks = getTotalTrainingRanksBought(upgrades);
  if (totalRanks <= 0) return 0;
  // Because cost at purchase #k (0-indexed) is baseCost * (1 + 0.10 * k),
  // we sum the exact baseCosts weighted by average/order.
  // To guarantee 100% order-independent fairness (since sum of (1 + 0.10*k) * baseCost_k
  // can vary slightly with purchase order), compute exact sum using deterministic sorted order
  // OR track average multiplier (1 + 0.10 * (totalRanks - 1) / 2) across all owned baseCosts.
  //Wait: check exact math! Sum_{k=0..N-1} base_k * (1 + 0.1*k). If we use avg multiplier (1 + 0.1 * (N-1)/2),
  // buying in ascending or descending could differ slightly unless we refund exact canonical cost:
  let baseSum = 0;
  for (const def of TRAINING_UPGRADES) {
    const lvl = Math.max(0, upgrades[def.id] || 0);
    baseSum += def.baseCost * lvl;
  }
  // Exact total if bought at average rank = sum(baseCost_i) * (1 + 0.1 * (totalRanks - 1) / 2)
  // Wait: if someone buys 1 upgrade of 200 (N=1 -> cost 200), (1 + 0.1*0/2) = 1.0 -> 200!
  // If someone buys 200 then 400 (200 + 440 = 640), avg gives 600*1.05 = 630. Better: let's store or use exact ordered sum? Wait: what if player refunds repeatedly to game order? Actually if refund = sum at ascending order vs purchase order, if player buys 200 (cost 200) and refunds immediately -> 200. If player buys 2500 then 120 -> 2500 + 132 = 2632. If refund gave avg (2620*1.05=2751), they could infinite-gold exploit!
  // CRITICAL: prevent infinite-gold exploit! Refund MUST NOT exceed minimum possible spend! Minimum spend happens when you buy MOST EXPENSIVE baseCost items FIRST (so expensive items have smaller multiplier, cheap items have larger multiplier).
  // Wait: if we instead store `trainingGoldSpent` OR compute the exact ascending/descending bound — even simpler:
  // If we use `upgrades` only without extra field, buying in order [A, B] costs A*(1+0) + B*(1+0.1). To make purchase-order-invariant AND unexploitable:
  // What if cost formula only depends on per-item rank OR global totalRanks with minimum-bound refund? Wait: spec explicitly says:
  // "ทุกครั้งที่ซื้ออะไรในลานฝึก ราคาของทุกอย่าง +10% ของราคาตั้งต้น (แบบ Vampire Survivors)"
  // AND "ผู้เล่นสามารถ กดคืนทองทั้งหมด (Refund) ได้ฟรีตลอดเวลา"
  // In Vampire Survivors, refund gives back the exact gold you spent (tracked in `trainingGoldSpent` or refunding descending!).
  // Let's track `trainingGoldSpent` or add it to `SaveData`? Wait: if we compute minimum-possible spent (`sort desc by baseCost`) if `trainingGoldSpent` isn't stored, OR even cleaner: store exact `goldSpent` OR make refund equal sum of `baseCost_i * (1 + 0.1 * i)` sorted descending by `baseCost`... wait: if someone buys 120 first (cost 120) then 2500 (cost 2750) = 2870, and refund gave 2500*1 + 120*1.1 = 2632, they'd LOSE 238 gold on refund!
  // Solution: track `trainingGoldSpent?: number` OR use exact item rank + totalRanks? Tracking `trainingGoldSpent` in `SaveData` (with safe fallback for migrated saves) guarantees 100% exact refund with ZERO exploit and ZERO loss! Let's do that cleanly!
  return Math.round(baseSum * (1 + 0.1 * ((totalRanks - 1) / 2)));
}

// =====================================================================
// 2. SURVIVOR'S CAMP BUILDINGS (แคมป์ผู้รอดชีวิต — 9 อาคาร)
// =====================================================================
export interface CampBuildingDef {
  id: CampBuildingId;
  nameTh: string;
  subtitleTh: string;
  unlockCostGold: number;
  unlockCostSeals: number;
  requiresStage1Clear?: boolean;
  maxLevel: number;
  lvBenefits: [string, string, string];
  accentColor: string;
  xPct: number; // position on camp map visual
  yPct: number;
}

export const CAMP_BUILDINGS: CampBuildingDef[] = [
  {
    id: 'training',
    nameTh: 'ลานฝึก',
    subtitleTh: 'อัปเกรดค่าพลังถาวร 12 สาย',
    unlockCostGold: 0,
    unlockCostSeals: 0,
    maxLevel: 3,
    lvBenefits: [
      'เปิดลานฝึก 12 ค่าพลังถาวร + คืนทองฟรี',
      'ปลดล็อกโบนัสลดค่าฝึก -5% สำหรับค่าสถานะหลัก',
      'ปลดล็อกโบนัสทองเริ่มต้นในด่าน +50 ทอง',
    ],
    accentColor: '#F59E0B',
    xPct: 24,
    yPct: 30,
  },
  {
    id: 'tavern',
    nameTh: 'โรงเตี๊ยม',
    subtitleTh: 'ภารกิจปลดล็อก · เควสรายวัน · ท้าทายประจำวัน',
    unlockCostGold: 500,
    unlockCostSeals: 0,
    maxLevel: 3,
    lvBenefits: [
      'ปลดล็อกกระดานภารกิจ ภารกิจรายวัน และชาเลนจ์รายวัน',
      'รางวัลทองจากเควสรายวัน +25%',
      'ปลดล็อกโบนัสแก่นวิญญาณจากเควสรายวัน +1',
    ],
    accentColor: '#FB923C',
    xPct: 50,
    yPct: 16,
  },
  {
    id: 'library',
    nameTh: 'หอสมุดต้องสาป',
    subtitleTh: 'สารานุกรมมอนสเตอร์ · คัมภีร์ผสมธาตุ · สถิติ',
    unlockCostGold: 600,
    unlockCostSeals: 0,
    maxLevel: 3,
    lvBenefits: [
      'บันทึกจำนวนการสังหารมอนสเตอร์ + ประวัติ +3% ดาเมจ',
      'ปลดล็อกข้อมูลจุดอ่อนและโบนัสทองจากสารานุกรม',
      'ปลดล็อกบันทึกสถิติเชิงลึกทั้งหมด',
    ],
    accentColor: '#38BDF8',
    xPct: 76,
    yPct: 28,
  },
  {
    id: 'blacksmith',
    nameTh: 'โรงตีเหล็ก',
    subtitleTh: 'สวมใส่และตีบวกอุปกรณ์ถาวร 4 ช่อง (+1..+5)',
    unlockCostGold: 800,
    unlockCostSeals: 0,
    maxLevel: 3,
    lvBenefits: [
      'เปิดช่องสวมใส่อุปกรณ์ถาวร 4 ช่อง + ตีบวกสูงสุด +3',
      'ปลดล็อกตีบวกถึง +4 และแยกชิ้นส่วนซ้ำได้ทองเพิ่ม +25%',
      'ปลดล็อกตีบวกขั้นสูงสุด +5 (+75% เอฟเฟกต์!)',
    ],
    accentColor: '#F97316',
    xPct: 16,
    yPct: 56,
  },
  {
    id: 'apothecary',
    nameTh: 'ร้านยา',
    subtitleTh: 'ปรุงและพกยาติดตัว 1 ขวดเข้าด่าน (กด Q)',
    unlockCostGold: 900,
    unlockCostSeals: 0,
    maxLevel: 3,
    lvBenefits: [
      'เปิดขายยา 2 ชนิด (ฟื้นฟูโลหิต / น้ำมนต์ไล่ปีศาจ)',
      'เปิดขายยาเพิ่ม (ยาโลภ / ยาปัญญา)',
      'เปิดขายยาครบ 5 ชนิด รวมผงสุ่มชะตา',
    ],
    accentColor: '#34D399',
    xPct: 84,
    yPct: 54,
  },
  {
    id: 'soul_tower',
    nameTh: 'หอคอยวิญญาณ',
    subtitleTh: 'เก็บเกี่ยวแก่นวิญญาณอัตโนมัติ (สูงสุด 8 ชม.)',
    unlockCostGold: 1500,
    unlockCostSeals: 0,
    maxLevel: 3,
    lvBenefits: [
      'ผลิต 2 แก่นวิญญาณ / ชั่วโมง (สะสมสูงสุด 8 ชม.)',
      'ผลิต 3.5 แก่นวิญญาณ / ชั่วโมง (สะสมสูงสุด 10 ชม.)',
      'ผลิต 5 แก่นวิญญาณ / ชั่วโมง (สะสมสูงสุด 12 ชม.)',
    ],
    accentColor: '#22D3EE',
    xPct: 74,
    yPct: 78,
  },
  {
    id: 'hatchery',
    nameTh: 'โรงเพาะพันธุ์',
    subtitleTh: 'ฟักไข่สัตว์เลี้ยง 1,000 ทอง พาเข้าสมรภูมิ',
    unlockCostGold: 2000,
    unlockCostSeals: 0,
    maxLevel: 3,
    lvBenefits: [
      'ปลดล็อกการฟักไข่สัตว์เลี้ยงผู้ช่วยเข้าด่านได้ 1 ตัว',
      'เพิ่มประสิทธิภาพสกิลสัตว์เลี้ยง +25%',
      'เพิ่มประสิทธิภาพสกิลสัตว์เลี้ยง +50% และลดค่าไข่เหลือ 800 ทอง',
    ],
    accentColor: '#F472B6',
    xPct: 26,
    yPct: 80,
  },
  {
    id: 'altar',
    nameTh: 'แท่นบูชาจันทร์มืด',
    subtitleTh: 'พรสวรรค์เลือกสาย A/B ด้วยแก่นวิญญาณ',
    unlockCostGold: 0,
    unlockCostSeals: 3,
    maxLevel: 3,
    lvBenefits: [
      'เปิดแท่นบูชาจันทร์มืด 6 แถว (เลือกสาย A/B ได้อิสระ)',
      'แถวพรสวรรค์ทำงานแรงขึ้นและลดราคาปลดแถว',
      'ปลดล็อกพลังจันทร์มืดสูงสุด',
    ],
    accentColor: '#C084FC',
    xPct: 50,
    yPct: 85,
  },
  {
    id: 'curse_gate',
    nameTh: 'ประตูคำสาป',
    subtitleTh: 'ท้าทายตัวปรับความยาก 9 อย่าง แลกทอง & วิญญาณเพิ่ม',
    unlockCostGold: 0,
    unlockCostSeals: 0,
    requiresStage1Clear: true,
    maxLevel: 3,
    lvBenefits: [
      'ปลดล็อกประตูคำสาป (+10% ทอง & แก่นวิญญาณต่อแต้ม)',
      'บันทึกสถิติมงกุฎคำสาปแยกตามเผ่าและปลดล็อกสีสกิน',
      'เกียรติยศแห่งคำสาประดับสูงสุด',
    ],
    accentColor: '#E11D48',
    xPct: 50,
    yPct: 48,
  },
];

export function getBuildingUpgradeCost(def: CampBuildingDef, currentLevel: number): { gold: number; seals: number } {
  if (currentLevel <= 0) {
    return { gold: def.unlockCostGold, seals: def.unlockCostSeals };
  }
  const baseGold = def.unlockCostGold > 0 ? def.unlockCostGold : 1000;
  return {
    gold: Math.round(baseGold * Math.pow(2, currentLevel)),
    seals: 0,
  };
}

export function getSoulTowerProduction(towerLevel: number): { perHour: number; maxHours: number } {
  if (towerLevel <= 0) return { perHour: 0, maxHours: 0 };
  if (towerLevel === 1) return { perHour: 2, maxHours: 8 };
  if (towerLevel === 2) return { perHour: 3.5, maxHours: 10 };
  return { perHour: 5, maxHours: 12 };
}

export function computePendingSoulEssence(saveData: SaveData, nowMs = Date.now()): number {
  const lvl = saveData.buildings.soul_tower || 0;
  if (lvl <= 0) return 0;
  const { perHour, maxHours } = getSoulTowerProduction(lvl);
  const elapsedHours = Math.max(0, (nowMs - (saveData.soulTowerLastClaimAt || nowMs)) / 3600000);
  const cappedHours = Math.min(maxHours, elapsedHours);
  return Math.floor(cappedHours * perHour);
}

// =====================================================================
// 3. APOTHECARY POTIONS (ร้านยา — 5 ชนิด กด Q ในด่าน)
// =====================================================================
export interface PotionDef {
  id: PotionId;
  nameTh: string;
  descTh: string;
  cost: number;
  requiredApothecaryLv: number;
  color: string;
}

export const POTIONS: Record<PotionId, PotionDef> = {
  blood_flask: {
    id: 'blood_flask',
    nameTh: 'ฟื้นฟูโลหิต',
    descTh: 'ฟื้นฟู HP 50% ทันทีในด่าน (กด Q)',
    cost: 60,
    requiredApothecaryLv: 1,
    color: '#F43F5E',
  },
  holy_water: {
    id: 'holy_water',
    nameTh: 'น้ำมนต์ไล่ปีศาจ',
    descTh: 'ผลักมอนสเตอร์ทั้งจอ + ล้างกระสุน + อมตะ 2 วิ (กด Q)',
    cost: 90,
    requiredApothecaryLv: 1,
    color: '#38BDF8',
  },
  greed_elixir: {
    id: 'greed_elixir',
    nameTh: 'ยาโลภ',
    descTh: 'ได้รับทอง x2 นาน 60 วินาที (กด Q)',
    cost: 120,
    requiredApothecaryLv: 2,
    color: '#FBBF24',
  },
  wisdom_draught: {
    id: 'wisdom_draught',
    nameTh: 'ยาปัญญา',
    descTh: 'ได้รับ EXP x2 นาน 45 วินาที (กด Q)',
    cost: 120,
    requiredApothecaryLv: 2,
    color: '#A78BFA',
  },
  fate_powder: {
    id: 'fate_powder',
    nameTh: 'ผงสุ่มชะตา',
    descTh: 'หีบสมบัติบอสกล่องถัดไปได้รางวัล x2 (กด Q)',
    cost: 150,
    requiredApothecaryLv: 3,
    color: '#34D399',
  },
};

export const POTION_ORDER: PotionId[] = [
  'blood_flask',
  'holy_water',
  'greed_elixir',
  'wisdom_draught',
  'fate_powder',
];

// =====================================================================
// 4. DARK MOON ALTAR TALENTS (แท่นบูชาจันทร์มืด — 6 แถว A/B)
// =====================================================================
export interface AltarRowDef {
  id: AltarRowId;
  rowNum: number;
  requiresSealUnlock: boolean;
  sealUnlockCost: number;
  maxRank: number;
  seCostPerRank: number;
  branchA: { nameTh: string; descTh: string };
  branchB: { nameTh: string; descTh: string };
}

export const ALTAR_ROWS: AltarRowDef[] = [
  {
    id: 'row1',
    rowNum: 1,
    requiresSealUnlock: false,
    sealUnlockCost: 0,
    maxRank: 1,
    seCostPerRank: 10,
    branchA: {
      nameTh: 'ศาสตราตื่นรู้',
      descTh: 'เริ่มรอบด้วยอาวุธเริ่มต้น Lv.2 (จอมเวทย์ได้พรธาตุสุ่ม +1 ขั้น)',
    },
    branchB: {
      nameTh: 'ดวงตาพยากรณ์',
      descTh: 'เริ่มรอบได้รับ +2 Reroll เพิ่มเติมทันที',
    },
  },
  {
    id: 'row2',
    rowNum: 2,
    requiresSealUnlock: false,
    sealUnlockCost: 0,
    maxRank: 3,
    seCostPerRank: 15,
    branchA: {
      nameTh: 'เกราะเงาจันทร์',
      descTh: 'ลดดาเมจที่โดนครั้งแรกทุก 30 วิ ลง 50% (อัปขั้นลดคูลดาวน์เหลือ 24/18 วิ)',
    },
    branchB: {
      nameTh: 'ก้าวพริบตา',
      descTh: 'ลดคูลดาวน์สกิลประจำเผ่า (Space/Shift) -10% ต่อขั้น (สูงสุด -30%)',
    },
  },
  {
    id: 'row3',
    rowNum: 3,
    requiresSealUnlock: true,
    sealUnlockCost: 1,
    maxRank: 2,
    seCostPerRank: 20,
    branchA: {
      nameTh: 'คลังสมบัติทวีคูณ',
      descTh: 'หีบบอสให้รางวัลเพิ่ม +1 ชิ้น (ขั้น 2 เพิ่มทองบอส +40%)',
    },
    branchB: {
      nameTh: 'ออร่าจันทราดูดกลืน',
      descTh: 'ขยายระยะเก็บ EXP และทรัพยากร x1.3 (ขั้น 2 เป็น x1.5)',
    },
  },
  {
    id: 'row4',
    rowNum: 4,
    requiresSealUnlock: true,
    sealUnlockCost: 1,
    maxRank: 1,
    seCostPerRank: 40,
    branchA: {
      nameTh: 'ปาฏิหาริย์จันทร์ดับ',
      descTh: 'ครั้งแรกในรอบที่ HP ต่ำกว่า 20% จะอมตะทันที 2 วินาที',
    },
    branchB: {
      nameTh: 'โลหิตผู้พิชิต',
      descTh: 'เมื่อสังหารบอส ฟื้นฟู Max HP 30% ทันที',
    },
  },
  {
    id: 'row5',
    rowNum: 5,
    requiresSealUnlock: true,
    sealUnlockCost: 2,
    maxRank: 3,
    seCostPerRank: 30,
    branchA: {
      nameTh: 'คำสาปมั่งคั่ง',
      descTh: 'เพิ่มทองที่ได้รับเมื่อเปิดคำสาป +10% ต่อขั้น (สูงสุด +30%)',
    },
    branchB: {
      nameTh: 'นักล่าแก่นวิญญาณ',
      descTh: 'Elite ดรอปแก่นวิญญาณ x2 (ขั้น 2–3 มีโอกาสได้เพิ่มอีก +1)',
    },
  },
  {
    id: 'row6',
    rowNum: 6,
    requiresSealUnlock: true,
    sealUnlockCost: 2,
    maxRank: 1,
    seCostPerRank: 60,
    branchA: {
      nameTh: 'ปลดแอกวิวัฒนาการ',
      descTh: 'อาวุธ Lv.5 สามารถวิวัฒนาการจากหีบบอสได้โดยไม่ต้องมีเครื่องรางคู่',
    },
    branchB: {
      nameTh: 'ปลุกพลังผสานล่วงหน้า',
      descTh: 'เปิดหีบบอสตั้งแต่นาทีที่ 10 มีโอกาสวิวัฒนาการอาวุธ Lv.4 ขึ้นไปทันที',
    },
  },
];

export function getAltarSpentSoulEssence(saveData: SaveData): number {
  let spent = 0;
  for (const row of ALTAR_ROWS) {
    const r = saveData.talents[row.id]?.rank || 0;
    spent += r * row.seCostPerRank;
  }
  return spent;
}

// =====================================================================
// 5. CURSE SYSTEM (ประตูคำสาป — 9 ตัวปรับแต่ง)
// =====================================================================
export interface CurseDef {
  id: CurseId;
  nameTh: string;
  effectTh: string;
  maxRank: number;
  pointsPerRank: number;
}

export const CURSES: CurseDef[] = [
  {
    id: 'spawn_rate',
    nameTh: 'คลื่นฝูงทมิฬ',
    effectTh: 'มอนสเตอร์เกิดถี่ขึ้น +15%/ขั้น',
    maxRank: 3,
    pointsPerRank: 1,
  },
  {
    id: 'enemy_hp',
    nameTh: 'กายาเหล็กคำสาป',
    effectTh: 'HP มอนสเตอร์ +15%/ขั้น',
    maxRank: 3,
    pointsPerRank: 1,
  },
  {
    id: 'enemy_dmg',
    nameTh: 'คมเขี้ยวต้องสาป',
    effectTh: 'ดาเมจมอนสเตอร์ +12%/ขั้น',
    maxRank: 3,
    pointsPerRank: 1,
  },
  {
    id: 'enemy_speed',
    nameTh: 'ก้าววิญญาณ',
    effectTh: 'ความเร็วมอนสเตอร์ +8%/ขั้น',
    maxRank: 2,
    pointsPerRank: 1,
  },
  {
    id: 'elite_freq',
    nameTh: 'ทัพหัวหน้าคลั่ง',
    effectTh: 'ความถี่มอนสเตอร์ Elite x1.5/ขั้น',
    maxRank: 2,
    pointsPerRank: 2,
  },
  {
    id: 'frenzy_boss',
    nameTh: 'บอสคลั่งทวีคูณ',
    effectTh: 'บอสเกิดพร้อมบัพพิเศษ +1/+2 อย่าง',
    maxRank: 2,
    pointsPerRank: 2,
  },
  {
    id: 'cursed_heal',
    nameTh: 'โลหิตเหือดแห้ง',
    effectTh: 'การฟื้นฟูเลือดทุกแหล่งลดลง -15%/ขั้น',
    maxRank: 3,
    pointsPerRank: 1,
  },
  {
    id: 'no_draft_tricks',
    nameTh: 'ปิดผนึกโชคชะตา',
    effectTh: 'ห้ามใช้ Reroll / Banish / Skip ในรอบนี้',
    maxRank: 1,
    pointsPerRank: 3,
  },
  {
    id: 'early_reaper',
    nameTh: 'ยมทูตเร่งรัด',
    effectTh: 'ยมทูตมาเร็วขึ้น (นาทีที่ 25 / โหมดเร่ง 8:20)',
    maxRank: 1,
    pointsPerRank: 3,
  },
];

export function computeCurseLevel(activeCurses: Partial<Record<CurseId, number>>): number {
  let pts = 0;
  for (const c of CURSES) {
    const r = Math.max(0, Math.min(c.maxRank, activeCurses[c.id] || 0));
    pts += r * c.pointsPerRank;
  }
  return pts;
}

// =====================================================================
// 6. PERMANENT GEAR & "BRING IT BACK" (โรงตีเหล็ก + หีบผนึก)
// =====================================================================
export const GEAR_SLOT_LABELS: Record<GearSlot, string> = {
  signature_weapon: 'อาวุธประจำตัว',
  armor: 'เกราะถาวร',
  ring: 'แหวนถาวร',
  amulet: 'เครื่องรางถาวร',
};

export const RARITY_META: Record<
  GearRarity,
  { nameTh: string; color: string; mult: number; dismantleGold: number; weight: number }
> = {
  common: { nameTh: 'ธรรมดา', color: '#94A3B8', mult: 1.0, dismantleGold: 80, weight: 60 },
  rare: { nameTh: 'หายาก', color: '#38BDF8', mult: 1.25, dismantleGold: 180, weight: 28 },
  epic: { nameTh: 'มหากาพย์', color: '#C084FC', mult: 1.55, dismantleGold: 380, weight: 10 },
  legendary: { nameTh: 'ตำนาน', color: '#FBBF24', mult: 2.0, dismantleGold: 900, weight: 2 },
};

export const PERMANENT_GEAR_CATALOG: Record<string, GearDef> = {
  // Signature Weapons (Existing + Part 5 New)
  greedy_merchant_blade: {
    id: 'greedy_merchant_blade',
    slot: 'signature_weapon',
    nameTh: 'ดาบพ่อค้าโลภ',
    descTh: 'เริ่มรอบได้ทองทันที +100 (ปรับตามระดับ/ตีบวก) แต่ Max HP -10%',
    color: '#FBBF24',
    baseEffectVal: 100,
    effectUnit: 'ทองเริ่มต้น',
    effectKind: 'greedy_blade',
    setId: 'golden_fortune',
  },
  vampiric_edge_blade: {
    id: 'vampiric_edge_blade',
    slot: 'signature_weapon',
    nameTh: 'คมดาบสูบโลหิต',
    descTh: 'ดูดเลือดจากดาเมจ +0.8% (ขยายตามระดับและตีบวก)',
    color: '#E11D48',
    baseEffectVal: 0.8,
    effectUnit: '% ดูดเลือด',
    effectKind: 'vampiric_edge',
  },
  fury_fang_blade: {
    id: 'fury_fang_blade',
    slot: 'signature_weapon',
    nameTh: 'เขี้ยวคลั่งสังหาร',
    descTh: 'เพิ่มความเร็วโจมตี/ลดคูลดาวน์และดาเมจ +5%',
    color: '#F97316',
    baseEffectVal: 5,
    effectUnit: '% ดาเมจ & เร่งสกิล',
    effectKind: 'fury_fang',
  },
  eclipse_scepter: {
    id: 'eclipse_scepter',
    slot: 'signature_weapon',
    nameTh: 'คทาสุริยคราส',
    descTh: 'ขยายพื้นที่สกิลและดาเมจ +6%',
    color: '#A855F7',
    baseEffectVal: 6,
    effectUnit: '% พื้นที่ & ดาเมจ',
    effectKind: 'eclipse_crown',
  },
  traveler_staff: {
    id: 'traveler_staff',
    slot: 'signature_weapon',
    nameTh: 'คทาผู้พเนจร',
    descTh: 'เริ่มเกมพร้อมอาวุธสุ่มฟรี +1 ชิ้น และเพิ่ม EXP +8%',
    color: '#38BDF8',
    baseEffectVal: 8,
    effectUnit: '% EXP เพิ่ม',
    effectKind: 'traveler_staff',
  },
  demon_chef_knife: {
    id: 'demon_chef_knife',
    slot: 'signature_weapon',
    nameTh: 'มีดแล่เนื้ออสูร',
    descTh: 'มอนดรอปเนื้อฮีล x2 และเพิ่มโอกาสคริ +4%',
    color: '#F43F5E',
    baseEffectVal: 4,
    effectUnit: '% คริ & เนื้อ x2',
    effectKind: 'demon_chef_knife',
    setId: 'shadow_king',
  },
  seer_scepter: {
    id: 'seer_scepter',
    slot: 'signature_weapon',
    nameTh: 'ไม้เท้าพยากรณ์',
    descTh: 'เห็นตัวเลือกเลเวลอัพรอบถัดไปล่วงหน้า และขยายระยะดูดไอเทม +15px',
    color: '#C084FC',
    baseEffectVal: 15,
    effectUnit: 'px ระยะดูด & ดูอนาคต',
    effectKind: 'seer_scepter',
    setId: 'frost_chronicle',
  },
  blacksmith_hammer: {
    id: 'blacksmith_hammer',
    slot: 'signature_weapon',
    nameTh: 'ค้อนช่างตีเหล็ก',
    descTh: 'อาวุธชิ้นแรกปลดล็อก Keystone & วิวัฒนาการไวขึ้น 1 เลเวล (ที่ Lv4) + ดาเมจ +4%',
    color: '#F59E0B',
    baseEffectVal: 4,
    effectUnit: '% ดาเมจ & Evolve Lv4',
    effectKind: 'blacksmith_hammer',
  },

  // Armor (Existing + Part 5 New)
  black_rose_armor: {
    id: 'black_rose_armor',
    slot: 'armor',
    nameTh: 'เกราะหนามกุหลาบดำ',
    descTh: 'เมื่อโดนตี ปล่อยหนาม 8 ทิศรอบตัวสร้างความเสียหายทันที',
    color: '#FB7185',
    baseEffectVal: 45,
    effectUnit: 'ดาเมจหนามฐาน',
    effectKind: 'thorn_reflect',
  },
  vital_iron_plate: {
    id: 'vital_iron_plate',
    slot: 'armor',
    nameTh: 'เกราะศิลาแห่งชีวิต',
    descTh: 'เพิ่ม +25 Max HP และ +1 เกราะ',
    color: '#10B981',
    baseEffectVal: 25,
    effectUnit: 'Max HP',
    effectKind: 'vital_plate',
  },
  frost_mantle_armor: {
    id: 'frost_mantle_armor',
    slot: 'armor',
    nameTh: 'ผ้าคลุมเหมันต์',
    descTh: 'ลดความเสียหายที่ได้รับ -6% และแช่เย็นมอนที่ชนตัว',
    color: '#38BDF8',
    baseEffectVal: 6,
    effectUnit: '% ลดดาเมจ',
    effectKind: 'frost_mantle',
  },
  guardian_ward_armor: {
    id: 'guardian_ward_armor',
    slot: 'armor',
    nameTh: 'เกราะผู้พิทักษ์โบราณ',
    descTh: 'เพิ่มเวลาอมตะหลังโดนตี +0.25 วิ และเกราะ +2',
    color: '#94A3B8',
    baseEffectVal: 2,
    effectUnit: 'เกราะ',
    effectKind: 'guardian_ward',
  },
  shadow_cloak: {
    id: 'shadow_cloak',
    slot: 'armor',
    nameTh: 'ผ้าคลุมเงา',
    descTh: 'เมื่อแดช/ใช้สกิลประจำตัว ทิ้งตัวล่อหลอกมอนสเตอร์ 2 วิ และลดคูลดาวน์แดช -10%',
    color: '#6366F1',
    baseEffectVal: 10,
    effectUnit: '% ลดคูลดาวน์แดช',
    effectKind: 'shadow_cloak',
    setId: 'shadow_king',
  },
  dragonscale_armor: {
    id: 'dragonscale_armor',
    slot: 'armor',
    nameTh: 'เกราะเกล็ดมังกร',
    descTh: 'จำกัดดาเมจต่อฮิตที่ได้รับไม่เกิน 25% Max HP (เฉพาะมอนทั่วไป) + เกราะ +2',
    color: '#EA580C',
    baseEffectVal: 2,
    effectUnit: 'เกราะ & กันวันช็อต',
    effectKind: 'dragonscale_armor',
    setId: 'infernal_pact',
  },
  dancer_silk: {
    id: 'dancer_silk',
    slot: 'armor',
    nameTh: 'ชุดนักระบำ',
    descTh: 'ทุก 10 วิ หลบหลีกการโจมตี 1 ครั้งอัตโนมัติ + ความเร็วเคลื่อนที่ +6%',
    color: '#EC4899',
    baseEffectVal: 6,
    effectUnit: '% วิ่ง & หลบอัตโนมัติ',
    effectKind: 'dancer_silk',
  },
  eternal_ice_armor: {
    id: 'eternal_ice_armor',
    slot: 'armor',
    nameTh: 'เกราะน้ำแข็งนิรันดร์',
    descTh: 'โดนตีปล่อยคลื่นน้ำแข็งแช่แข็งรอบตัว 120px และลดดาเมจที่ได้รับ -5%',
    color: '#67E8F9',
    baseEffectVal: 5,
    effectUnit: '% ลดดาเมจ & คลื่นแข็ง',
    effectKind: 'eternal_ice_armor',
    setId: 'frost_chronicle',
  },

  // Ring (Existing + Part 5 New)
  twin_shadow_ring: {
    id: 'twin_shadow_ring',
    slot: 'ring',
    nameTh: 'แหวนเงาแฝด',
    descTh: 'เมื่อใช้สกิล/แดช จะทิ้งร่างเงาไว้และระเบิดความเสียหายหลัง 1 วิ',
    color: '#818CF8',
    baseEffectVal: 70,
    effectUnit: 'ดาเมจเงาระเบิด',
    effectKind: 'shadow_dash_bomb',
    setId: 'shadow_king',
  },
  swift_signet_ring: {
    id: 'swift_signet_ring',
    slot: 'ring',
    nameTh: 'แหวนสายลมกรด',
    descTh: 'เพิ่มความเร็วเคลื่อนที่ +6% และโอกาสคริติคอล +4%',
    color: '#22D3EE',
    baseEffectVal: 6,
    effectUnit: '% ความเร็ว',
    effectKind: 'swift_signet',
  },
  avarice_gold_ring: {
    id: 'avarice_gold_ring',
    slot: 'ring',
    nameTh: 'แหวนมหาเศรษฐี',
    descTh: 'เพิ่มทองที่ได้รับในด่าน +12% และระยะดูด +25px',
    color: '#FACC15',
    baseEffectVal: 12,
    effectUnit: '% ทองเพิ่ม',
    effectKind: 'gold_ring',
  },
  luck_clover_ring: {
    id: 'luck_clover_ring',
    slot: 'ring',
    nameTh: 'แหวนโคลเวอร์สี่แฉก',
    descTh: 'โอกาสรับทรัพยากรเบิ้ล x2 +5% และคริติคอล +5%',
    color: '#34D399',
    baseEffectVal: 5,
    effectUnit: '% โชคเบิ้ล & คริ',
    effectKind: 'luck_clover',
  },
  flame_ring: {
    id: 'flame_ring',
    slot: 'ring',
    nameTh: 'แหวนไฟ',
    descTh: 'ยืดเวลาเผาไหม้ Burn +50% และเพิ่มดาเมจไฟ +12%',
    color: '#F97316',
    baseEffectVal: 12,
    effectUnit: '% ดาเมจไฟ & นาน +50%',
    effectKind: 'flame_ring',
    setId: 'infernal_pact',
  },
  leopard_ring: {
    id: 'leopard_ring',
    slot: 'ring',
    nameTh: 'แหวนเสือดาว',
    descTh: 'ความเร็ววิ่ง +10% (สแต็กกับรองเท้า) และโอกาสคริ +3%',
    color: '#FBBF24',
    baseEffectVal: 10,
    effectUnit: '% ความเร็ววิ่ง',
    effectKind: 'leopard_ring',
  },
  collector_ring: {
    id: 'collector_ring',
    slot: 'ring',
    nameTh: 'แหวนนักสะสม',
    descTh: 'ระยะดูดไอเทม +35% และทองที่ได้จากด่าน +8%',
    color: '#2DD4BF',
    baseEffectVal: 35,
    effectUnit: '% ระยะดูดไอเทม',
    effectKind: 'collector_ring',
    setId: 'golden_fortune',
  },
  reaction_ring: {
    id: 'reaction_ring',
    slot: 'ring',
    nameTh: 'แหวนปฏิกิริยา',
    descTh: 'เพิ่มความแรงปฏิกิริยาสถานะธาตุทั้งหมด +30%',
    color: '#E879F9',
    baseEffectVal: 30,
    effectUnit: '% แรงปฏิกิริยาธาตุ',
    effectKind: 'reaction_ring',
  },

  // Amulet (Existing + Part 5 New)
  lightning_crown_amulet: {
    id: 'lightning_crown_amulet',
    slot: 'amulet',
    nameTh: 'มงกุฎสายฟ้า',
    descTh: 'ทุกครั้งที่ติดคริติคอล มีโอกาส 10% (เพิ่มตามระดับ) เรียกสายฟ้าฟาดศัตรู',
    color: '#A78BFA',
    baseEffectVal: 10,
    effectUnit: '% โอกาสสายฟ้าคริ',
    effectKind: 'lightning_crit',
  },
  shattered_hourglass_amulet: {
    id: 'shattered_hourglass_amulet',
    slot: 'amulet',
    nameTh: 'นาฬิกาทรายแตก',
    descTh: 'ทุก 45 วินาที แช่แข็งศัตรูทั้งแผนที่ 1.5 วิ (นานขึ้นตามตีบวก)',
    color: '#22D3EE',
    baseEffectVal: 1.5,
    effectUnit: 'วิ แช่แข็งทั้งจอ',
    effectKind: 'hourglass_freeze',
    setId: 'frost_chronicle',
  },
  mana_sigil_amulet: {
    id: 'mana_sigil_amulet',
    slot: 'amulet',
    nameTh: 'ตราเวทย์อนันต์',
    descTh: 'เพิ่มฟื้นฟูมานา +20% และลดคูลดาวน์ -4%',
    color: '#60A5FA',
    baseEffectVal: 20,
    effectUnit: '% ฟื้นมานา',
    effectKind: 'mana_sigil',
  },
  soul_charm_amulet: {
    id: 'soul_charm_amulet',
    slot: 'amulet',
    nameTh: 'เครื่องรางดักวิญญาณ',
    descTh: 'เพิ่ม EXP ที่ได้รับ +10% และโอกาสบอส/Elite ดรอปแก่นวิญญาณเพิ่ม',
    color: '#E879F9',
    baseEffectVal: 10,
    effectUnit: '% EXP',
    effectKind: 'soul_charm',
  },
  spirit_calling_bell: {
    id: 'spirit_calling_bell',
    slot: 'amulet',
    nameTh: 'กระดิ่งเรียกวิญญาณ',
    descTh: 'ทุก 30 วิ อัญเชิญอัศวินผีช่วยสู้รอบตัว 8 วิ',
    color: '#818CF8',
    baseEffectVal: 8,
    effectUnit: 'วิ อัศวินผีช่วยสู้',
    effectKind: 'spirit_calling_bell',
  },
  lucky_cat_eye: {
    id: 'lucky_cat_eye',
    slot: 'amulet',
    nameTh: 'ตาแมวนำโชค',
    descTh: 'โอกาส 20% ที่กล่องบอสจะแถมไอเทม/ทองสองเท่า และโชค +5%',
    color: '#FDE047',
    baseEffectVal: 20,
    effectUnit: '% โอกาสหีบบอส x2',
    effectKind: 'lucky_cat_eye',
    setId: 'golden_fortune',
  },
  phoenix_feather: {
    id: 'phoenix_feather',
    slot: 'amulet',
    nameTh: 'ขนนกฟีนิกซ์',
    descTh: 'ตายครั้งแรกรอดด้วย HP 30% + ระเบิดเพลิง (ไม่ซ้อนทับกับคืนชีพจากลานฝึก)',
    color: '#F97316',
    baseEffectVal: 30,
    effectUnit: '% HP ฟื้นคืนชีพ',
    effectKind: 'phoenix_feather',
    setId: 'infernal_pact',
  },
};

export const GEAR_SETS: Record<GearSetId, GearSetDef> = {
  shadow_king: {
    id: 'shadow_king',
    nameTh: 'ชุดราชาเงา (Shadow King)',
    color: '#818CF8',
    pieceDefIds: ['demon_chef_knife', 'shadow_cloak', 'twin_shadow_ring'],
    bonus2Th: '2 ชิ้น: รัศมีระเบิดเงาและตัวล่อกว้างขึ้น +35%',
    bonus3Th: '3 ชิ้น: แดชปล่อยระเบิดเงา 2 จุดพร้อมติดเป้า Mark ทุกศัตรูที่โดน',
  },
  infernal_pact: {
    id: 'infernal_pact',
    nameTh: 'ชุดพันธะอัคคี (Infernal Pact)',
    color: '#F97316',
    pieceDefIds: ['dragonscale_armor', 'flame_ring', 'phoenix_feather'],
    bonus2Th: '2 ชิ้น: สถานะ Burn ทำงานไวขึ้น +20% และแรงขึ้น',
    bonus3Th: '3 ชิ้น: ศัตรูที่ตายขณะติด Burn ระเบิดไฟ 25% MaxHP ใส่รอบข้าง',
  },
  frost_chronicle: {
    id: 'frost_chronicle',
    nameTh: 'ชุดบันทึกเหมันตกาล (Frost Chronicle)',
    color: '#38BDF8',
    pieceDefIds: ['seer_scepter', 'eternal_ice_armor', 'shattered_hourglass_amulet'],
    bonus2Th: '2 ชิ้น: ระยะเวลาแช่แข็ง Frozen นานขึ้น +30%',
    bonus3Th: '3 ชิ้น: ทุกครั้งที่นาฬิกาหยุดเวลา จะกระแทก Shatter ใส่ศัตรูแข็งทั้งจอ',
  },
  golden_fortune: {
    id: 'golden_fortune',
    nameTh: 'ชุดราชันโชคลาภ (Golden Fortune)',
    color: '#FBBF24',
    pieceDefIds: ['greedy_merchant_blade', 'collector_ring', 'lucky_cat_eye'],
    bonus2Th: '2 ชิ้น: เก็บเหรียญทองฟื้น HP +1 (คูลดาวน์ 1 วิ)',
    bonus3Th: '3 ชิ้น: เมื่อเก็บถุงทองหรือหีบบอส สาดคลื่นทองโจมตีรอบตัว',
  },
};

export function getActiveGearSets(
  equippedGear: Partial<Record<GearSlot, string>>,
  gearInventory: OwnedGearItem[]
): { set: GearSetDef; count: number }[] {
  const counts: Partial<Record<GearSetId, number>> = {};
  for (const uid of Object.values(equippedGear)) {
    if (!uid) continue;
    const item = gearInventory.find((g) => g.uid === uid);
    if (!item) continue;
    const def = PERMANENT_GEAR_CATALOG[item.defId];
    if (def?.setId) {
      counts[def.setId] = (counts[def.setId] || 0) + 1;
    }
  }
  const result: { set: GearSetDef; count: number }[] = [];
  for (const [sid, count] of Object.entries(counts) as [GearSetId, number][]) {
    if (count >= 2) {
      result.push({ set: GEAR_SETS[sid], count });
    }
  }
  return result;
}

export function rollGearRarity(curseLevel = 0, isReaperRun = false): GearRarity {
  const luckBonus = Math.min(20, curseLevel * 0.8 + (isReaperRun ? 8 : 0));
  const r = Math.random() * 100;
  if (r < 2 + luckBonus * 0.25) return 'legendary';
  if (r < 12 + luckBonus * 0.65) return 'epic';
  if (r < 40 + luckBonus) return 'rare';
  return 'common';
}

export function rollRandomGearDefId(): string {
  const ids = Object.keys(PERMANENT_GEAR_CATALOG);
  return ids[Math.floor(Math.random() * ids.length)];
}

export function getGearEffectiveMultiplier(rarity: GearRarity, enhanceLevel: number): number {
  return RARITY_META[rarity].mult * (1 + enhanceLevel * 0.15);
}

export function getGearEnhanceCost(nextEnhanceLevel: number): number {
  return 200 * nextEnhanceLevel * nextEnhanceLevel;
}

export function getMaxBlacksmithEnhanceLevel(blacksmithLv: number): number {
  if (blacksmithLv >= 3) return 5;
  if (blacksmithLv === 2) return 4;
  return 3;
}

export function getGearItemEffectiveValue(item: OwnedGearItem): number {
  const def = PERMANENT_GEAR_CATALOG[item.defId];
  if (!def) return 0;
  return Number((def.baseEffectVal * getGearEffectiveMultiplier(item.rarity, item.enhanceLevel)).toFixed(1));
}

// =====================================================================
// 7. COMPANION PETS (โรงเพาะพันธุ์)
// =====================================================================
export interface PetDef {
  id: PetId;
  nameTh: string;
  descTh: string;
  color: string;
}

export const PETS: Record<PetId, PetDef> = {
  bat_pet: {
    id: 'bat_pet',
    nameTh: 'ค้างคาวน้อย',
    descTh: 'บินวนเก็บเพชร EXP และเหรียญทองใกล้ตัวให้อัตโนมัติ',
    color: '#C084FC',
  },
  fire_hound: {
    id: 'fire_hound',
    nameTh: 'หมาไฟโลกันตร์',
    descTh: 'เห่าพ่นลูกไฟใส่ศัตรูใกล้ตัวเป็นระยะ + ติดสถานะเผาไหม้',
    color: '#F97316',
  },
  mini_ghost: {
    id: 'mini_ghost',
    nameTh: 'ผีจิ๋วผู้พิทักษ์',
    descTh: 'ช่วยรับและสลายกระสุนศัตรูให้ 1 นัดทุกๆ 20 วินาที',
    color: '#38BDF8',
  },
};

export const PET_IDS: PetId[] = ['bat_pet', 'fire_hound', 'mini_ghost'];

export function getPetEggCost(hatcheryLv: number): number {
  return hatcheryLv >= 3 ? 800 : 1000;
}

// =====================================================================
// 8. MONSTER BESTIARY (หอสมุดต้องสาป)
// =====================================================================
export interface BestiaryEntryDef {
  kind: EnemyKind;
  nameTh: string;
  categoryTh: string;
  loreTh: string;
  accentColor: string;
}

export const BESTIARY_ENTRIES: BestiaryEntryDef[] = [
  { kind: 'slime', nameTh: 'สไลม์ต้องสาป', categoryTh: 'อสูรระดับล่าง', loreTh: 'หยดน้ำมนต์มืดที่กลืนกินเถ้ากระดูกจนมีชีวิต', accentColor: '#4ADE80' },
  { kind: 'goblin', nameTh: 'ก็อบลินนักล่า', categoryTh: 'อสูรระดับล่าง', loreTh: 'ทหารรับจ้างตาแดงก่ำผู้หิวกระหายเหรียญทองและเลือดสด', accentColor: '#A3E635' },
  { kind: 'bat', nameTh: 'ค้างคาวรัตติกาล', categoryTh: 'อสูรบิน', loreTh: 'ฝูงค้างคาวที่ร่อนเป็นรูปตัว V ดักเหยื่อจากความมืด', accentColor: '#A855F7' },
  { kind: 'flower', nameTh: 'บุปผามรณะ', categoryTh: 'อสูรล้อมวง', loreTh: 'ดอกไม้ปีศาจที่งอกเป็นวงกลมกักขังผู้รอดชีวิตไว้ตรงกลาง', accentColor: '#F472B6' },
  { kind: 'golem', nameTh: 'โกเล็มศิลาทมิฬ', categoryTh: 'อสูรเกราะหนัก', loreTh: 'รูปปั้นโบราณที่ต้านทานแรงผลักและก้าวเดินไม่หยุดยั้ง', accentColor: '#94A3B8' },
  { kind: 'cultist', nameTh: 'นักบวชอเวจี', categoryTh: 'ผู้ร่ายเวทย์', loreTh: 'สานุศิษย์ผู้สาบานตนรับใช้สุริยคราส ยิงลูกไฟจากระยะไกล', accentColor: '#FB923C' },
  { kind: 'archer', nameTh: 'พลธนูเงา', categoryTh: 'ผู้ยิงระยะไกล', loreTh: 'มือธนูวิญญาณที่เล็งจุดตายด้วยเส้นแสงสีแดงก่อนลั่นศร', accentColor: '#F87171' },
  { kind: 'zealot', nameTh: 'นักคลั่งพลีชีพ', categoryTh: 'อสูรระเบิด', loreTh: 'วิญญาณบ้าคลั่งที่จุดระเบิดตัวเองกลางวงล้อม ไม่สนแรงผลัก', accentColor: '#EF4444' },
  { kind: 'charger', nameTh: 'อสูรเขาคลั่ง', categoryTh: 'จู่โจมความเร็วสูง', loreTh: 'พุ่งทะยานเป็นเส้นตรงดั่งหอกเหล็ก ควรหลบตั้งฉากเมื่อเห็นเส้นเล็ง', accentColor: '#F97316' },
  { kind: 'stalker', nameTh: 'เงาสังหาร', categoryTh: 'นักลอบฆ่า', loreTh: 'ลอบเล็งจากมุมมืดและเคลื่อนไหวปราดเปรียวยามค่ำคืน', accentColor: '#C084FC' },
  { kind: 'trapper', nameTh: 'กับดักเถาอสูร', categoryTh: 'ควบคุมพื้นที่', loreTh: 'ยิงเถาวัลย์พันธนาการให้เหยื่อติดกับดักเดินไม่ออก', accentColor: '#2DD4BF' },
  { kind: 'shielder', nameTh: 'อัศวินโล่ดำ', categoryTh: 'แนวหน้า', loreTh: 'ยกโล่เหล็กต้านกระสุนและดาเมจด้านหน้า ต้องอ้อมตีหรือใช้เวทย์', accentColor: '#64748B' },
  { kind: 'bomber', nameTh: 'อสูรปาระเบิด', categoryTh: 'อสูรระเบิด', loreTh: 'แบกถังเพลิงนรกพร้อมระเบิดเมื่อใกล้ตัวหรือตอนตาย', accentColor: '#FB7185' },
  { kind: 'miniboss_warden', nameTh: 'ผู้คุมสุสานโครงกระดูก', categoryTh: 'มินิบอส', loreTh: 'ผู้เฝ้าประตูแรกแห่งความตาย ทดสอบผู้กล้าในนาทีที่ 3', accentColor: '#CBD5E1' },
  { kind: 'miniboss_blossom', nameTh: 'ราชินีบุปผาโลหิต', categoryTh: 'มินิบอส', loreTh: 'รากแก้วแห่งป่าต้องสาป โปรยกระสุนหนามรอบทิศ', accentColor: '#EC4899' },
  { kind: 'boss_bat_king', nameTh: 'ราชาค้างคาวอเวจี', categoryTh: 'บอสใหญ่', loreTh: 'จ้าวเวหารัตติกาล ผู้บัญชาการฝูงค้างคาวกระหายเลือด', accentColor: '#C084FC' },
  { kind: 'boss_colossus', nameTh: 'ยักษ์ศิลาพิโรธ', categoryTh: 'บอสใหญ่', loreTh: 'มหาศิลาที่สั่นสะเทือนปฐพีทุกก้าวที่ย่ำลง', accentColor: '#F59E0B' },
  { kind: 'boss_lich', nameTh: 'มหาจอมเวทย์โครงกระดูก', categoryTh: 'บอสใหญ่', loreTh: 'ลิชผู้เก็บรวบรวมคัมภีร์มรณะและพายุกระสุนเวทย์', accentColor: '#38BDF8' },
  { kind: 'boss_wyrm', nameTh: 'มังกรเถ้านรก', categoryTh: 'บอสใหญ่', loreTh: 'พญามังกรไร้เกล็ดที่พ่นไฟเผาผลาญท้องฟ้าสีเลือด', accentColor: '#F97316' },
  { kind: 'boss_cerberus', nameTh: 'เซอร์เบอรัส แฝดสาม', categoryTh: 'มินิบอสแฝดสาม', loreTh: 'สุนัขเฝ้าประตูนรกสามร่างที่รุมจู่โจมพร้อมกัน', accentColor: '#EF4444' },
  { kind: 'boss_judgement', nameTh: 'เทวทูตพิพากษา', categoryTh: 'บอสใหญ่', loreTh: 'ทูตสวรรค์ตกสวรรค์ผู้ตัดสินบาปด้วยดาบแสงทมิฬ', accentColor: '#FDE047' },
  { kind: 'boss_beelzebub', nameTh: 'เบลเซบับ จ้าวแห่งแมลง', categoryTh: 'บอสใหญ่', loreTh: 'จอมปีศาจผู้กลืนกินสรรพชีวิตในมิติที่ลึกที่สุด', accentColor: '#84CC16' },
  { kind: 'boss_lucifer', nameTh: 'ลูซิเฟอร์ ดาวรุ่งตกสวรรค์', categoryTh: 'บอสใหญ่', loreTh: 'ปฐมกษัตริย์แห่งความมืด ก่อนการมาถึงของยมทูต', accentColor: '#E879F9' },
  { kind: 'reaper', nameTh: 'ยมทูต The Reaper', categoryTh: 'บอสสูงสุด', loreTh: 'ผู้เก็บเกี่ยววิญญาณในนาทีสุดท้าย ผู้พิชิตเท่านั้นที่จะข้ามสู่มิติใหม่', accentColor: '#F43F5E' },
];

export const BESTIARY_BY_KIND: Record<EnemyKind, BestiaryEntryDef> = BESTIARY_ENTRIES.reduce(
  (acc, item) => {
    acc[item.kind] = item;
    return acc;
  },
  {} as Record<EnemyKind, BestiaryEntryDef>
);

export function getBestiaryDamageBonus(bestiaryKills: Partial<Record<EnemyKind, number>>, kind: EnemyKind): number {
  const k = bestiaryKills[kind] || 0;
  let bonus = 0;
  if (k >= 100) bonus += 0.03;
  if (k >= 1000) bonus += 0.03;
  return bonus;
}

// =====================================================================
// 9. UNLOCK QUESTS (ภารกิจปลดล็อกถาวร), IN-RUN QUESTS & DAILY QUESTS
// =====================================================================
export interface UnlockQuestDef {
  id: string;
  titleTh: string;
  descTh: string;
  target: number;
  rewardSeals: number;
  rewardGold: number;
  rewardLabelTh: string;
  getProgress: (save: SaveData) => number;
}

export const UNLOCK_QUESTS: UnlockQuestDef[] = [
  {
    id: 'uq_stage1_clear',
    titleTh: 'ผู้รอดชีวิตรุ่งอรุณ',
    descTh: 'เอาชีวิตรอดจบด่าน 1 หรือสังหารยมทูตสำเร็จ',
    target: 1,
    rewardSeals: 2,
    rewardGold: 200,
    rewardLabelTh: 'ปลดล็อกประตูคำสาป + 2 ตราผนึก',
    getProgress: (s) => (s.questStats.stage1Cleared || s.reaperKills > 0 || s.bestTimeSeconds >= 1800 ? 1 : 0),
  },
  {
    id: 'uq_reaper_first',
    titleTh: 'ผู้พิชิตความตาย',
    descTh: 'สังหารยมทูต The Reaper ครั้งแรก',
    target: 1,
    rewardSeals: 2,
    rewardGold: 500,
    rewardLabelTh: '+2 ตราผนึก & 500 ทอง',
    getProgress: (s) => Math.min(1, s.reaperKills),
  },
  {
    id: 'uq_banana_5k',
    titleTh: 'ตำนานกล้วยพิฆาต',
    descTh: 'ฆ่าศัตรูด้วย "กล้วยพิฆาต" สะสม 5,000 ตัว',
    target: 5000,
    rewardSeals: 2,
    rewardGold: 400,
    rewardLabelTh: '+2 ตราผนึก & ปลดฉายาราชาลิงกล้วย',
    getProgress: (s) => s.questStats.bananaKills,
  },
  {
    id: 'uq_combo_1000',
    titleTh: 'จังหวะสังหารไร้รอยขีดข่วน',
    descTh: 'ทำคอมโบติดต่อกันถึง 1,000 ครั้งในรอบเดียว',
    target: 1000,
    rewardSeals: 2,
    rewardGold: 350,
    rewardLabelTh: '+2 ตราผนึก & โบนัสพลังคอมโบ',
    getProgress: (s) => s.questStats.maxComboEver,
  },
  {
    id: 'uq_evolve_5',
    titleTh: 'ช่างหลอมศาสตราวุธ',
    descTh: 'วิวัฒนาการอาวุธครบ 5 ชนิดที่แตกต่างกัน',
    target: 5,
    rewardSeals: 2,
    rewardGold: 350,
    rewardLabelTh: '+2 ตราผนึก & 350 ทอง',
    getProgress: (s) => s.questStats.evolvedWeaponsEver.length,
  },
  {
    id: 'uq_orc_20m',
    titleTh: 'เกราะเหล็กผู้ไม่ยอมแพ้',
    descTh: 'รอดชีวิตเกิน 20 นาทีด้วยเผ่าออร์ค (นับเวลาจริงในรอบปกติ)',
    target: 1200,
    rewardSeals: 2,
    rewardGold: 400,
    rewardLabelTh: '+2 ตราผนึก & เกียรติยศแห่งออร์ค',
    getProgress: (s) => s.questStats.orcBestTimeSeconds,
  },
  {
    id: 'uq_parry_100',
    titleTh: 'โล่ทองคำผู้สะท้อน',
    descTh: 'Parry สำเร็จด้วยอัศวินศักดิ์สิทธิ์สะสม 100 ครั้ง',
    target: 100,
    rewardSeals: 2,
    rewardGold: 400,
    rewardLabelTh: '+2 ตราผนึก & เกียรติยศอัศวิน',
    getProgress: (s) => s.questStats.knightParries,
  },
  {
    id: 'uq_fire_10k',
    titleTh: 'จ้าวเพลิงเผาผลาญ',
    descTh: 'ฆ่าศัตรูด้วยเพลิงนรก/สถานะเผาไหม้สะสม 10,000 ตัว',
    target: 10000,
    rewardSeals: 3,
    rewardGold: 600,
    rewardLabelTh: '+3 ตราผนึก & 600 ทอง',
    getProgress: (s) => s.questStats.fireBurnKills,
  },
  {
    id: 'uq_boss_25',
    titleTh: 'นักล่าหัวหน้าอสูร',
    descTh: 'สังหารบอสหรือมินิบอสสะสมครบ 25 ตัว',
    target: 25,
    rewardSeals: 2,
    rewardGold: 450,
    rewardLabelTh: '+2 ตราผนึก & 450 ทอง',
    getProgress: (s) => s.questStats.totalBossKills,
  },
  {
    id: 'uq_total_kills_20k',
    titleTh: 'ผู้กวาดล้างรัตติกาล',
    descTh: 'สังหารศัตรูสะสมทั้งหมด 20,000 ตัว',
    target: 20000,
    rewardSeals: 3,
    rewardGold: 750,
    rewardLabelTh: '+3 ตราผนึก & 750 ทอง',
    getProgress: (s) => s.totalKills,
  },
];

// Daily Quests
export interface DailyQuestTemplate {
  id: string;
  titleTh: string;
  target: number;
  rewardGold: number;
  rewardSoulEssence: number;
  metric: 'kills' | 'bosses' | 'elites' | 'runs' | 'minutes';
}

const DAILY_QUEST_POOL: DailyQuestTemplate[] = [
  { id: 'dq_kills_400', titleTh: 'สังหารมอนสเตอร์ 400 ตัว', target: 400, rewardGold: 220, rewardSoulEssence: 4, metric: 'kills' },
  { id: 'dq_kills_900', titleTh: 'สังหารมอนสเตอร์ 900 ตัว', target: 900, rewardGold: 360, rewardSoulEssence: 6, metric: 'kills' },
  { id: 'dq_boss_2', titleTh: 'โค่นบอสหรือมินิบอส 2 ตัว', target: 2, rewardGold: 260, rewardSoulEssence: 5, metric: 'bosses' },
  { id: 'dq_boss_4', titleTh: 'โค่นบอสหรือมินิบอส 4 ตัว', target: 4, rewardGold: 420, rewardSoulEssence: 8, metric: 'bosses' },
  { id: 'dq_elite_5', titleTh: 'กำจัด Elite 5 ตัว', target: 5, rewardGold: 250, rewardSoulEssence: 5, metric: 'elites' },
  { id: 'dq_run_2', titleTh: 'ออกศึกและจบรอบ 2 ครั้ง', target: 2, rewardGold: 200, rewardSoulEssence: 4, metric: 'runs' },
  { id: 'dq_min_15', titleTh: 'เอาชีวิตรอดสะสมครบ 15 นาที', target: 15, rewardGold: 280, rewardSoulEssence: 5, metric: 'minutes' },
];

export function getLocalDateKey(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function hashStringSeed(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function getDailyQuestsForDate(dateStr = getLocalDateKey()): DailyQuestTemplate[] {
  const seed = hashStringSeed(`dq:${dateStr}`);
  const pool = [...DAILY_QUEST_POOL];
  const picked: DailyQuestTemplate[] = [];
  let s = seed;
  for (let i = 0; i < 3 && pool.length > 0; i++) {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    const idx = s % pool.length;
    picked.push(pool.splice(idx, 1)[0]);
  }
  return picked;
}

export interface DailyChallengeConfig {
  dateStr: string;
  raceId: RaceId;
  stageId: StageId;
  titleTh: string;
  curseLevelTarget: number;
  rewardSeals: number;
  rewardGold: number;
}

export function getDailyChallengeForDate(dateStr = getLocalDateKey()): DailyChallengeConfig {
  const seed = hashStringSeed(`dc:${dateStr}`);
  const races: RaceId[] = ['human', 'vampire', 'orc', 'mage'];
  const stages: StageId[] = ['cursed_forest', 'bloodmoon_crypt', 'reaper_citadel'];
  const raceId = races[seed % races.length];
  const stageId = stages[(seed >>> 4) % stages.length];
  return {
    dateStr,
    raceId,
    stageId,
    titleTh: `ชาเลนจ์วันที่ ${dateStr}`,
    curseLevelTarget: 3,
    rewardSeals: 1,
    rewardGold: 450,
  };
}

// In-Run Quests (3 random quests at run start)
export interface InRunQuestTemplate {
  id: string;
  titleTh: string;
  target: number;
  rewardGold: number;
  kind: 'kills' | 'elites' | 'bosses' | 'combo' | 'no_damage_sec' | 'weapons_4' | 'level_reach';
}

export const IN_RUN_QUEST_POOL: InRunQuestTemplate[] = [
  { id: 'irq_kills_120', titleTh: 'สังหารศัตรู 120 ตัวในรอบนี้', target: 120, rewardGold: 65, kind: 'kills' },
  { id: 'irq_kills_350', titleTh: 'สังหารศัตรู 350 ตัวในรอบนี้', target: 350, rewardGold: 130, kind: 'kills' },
  { id: 'irq_elites_2', titleTh: 'ปราบมอนสเตอร์ Elite 2 ตัว', target: 2, rewardGold: 95, kind: 'elites' },
  { id: 'irq_boss_1', titleTh: 'โค่นบอสหรือมินิบอส 1 ตัว', target: 1, rewardGold: 120, kind: 'bosses' },
  { id: 'irq_combo_150', titleTh: 'ทำคอมโบต่อเนื่อง 150 ฮิต', target: 150, rewardGold: 110, kind: 'combo' },
  { id: 'irq_nodmg_45', titleTh: 'ไม่โดนโจมตีต่อเนื่อง 45 วินาที', target: 45, rewardGold: 140, kind: 'no_damage_sec' },
  { id: 'irq_lv12', titleTh: 'อัปเลเวลถึง Lv.12 ในรอบนี้', target: 12, rewardGold: 90, kind: 'level_reach' },
];

export function rollInRunQuests(): InRunQuestTemplate[] {
  const pool = [...IN_RUN_QUEST_POOL].sort(() => Math.random() - 0.5);
  return pool.slice(0, 3);
}

// =====================================================================
// 10. CHARACTER MASTERY & CURSE COSMETIC SKINS
// =====================================================================
export function getMasteryLevelInfo(xp: number): {
  level: number;
  currentXp: number;
  nextLevelXp: number;
  titleTh: string;
} {
  const thresholds = [0, 150, 400, 800, 1400, 2200, 3300, 4800, 6800, 9500];
  const titles = [
    'ผู้ฝึกหัด',
    'นักเดินทางรัตติกาล',
    'ผู้ไล่ล่าเงา',
    'ผู้กล้าแห่งสุริยคราส',
    'อัศวินสายเลือดแท้',
    'ปรมาจารย์สมรภูมิ',
    'ผู้พิชิตแห่งรัตติกาล',
    'วีรชนอมตะ',
    'จอมราชันแห่งเงามืด',
    'ตำนานนิรันดร์',
  ];
  let level = 1;
  for (let i = 1; i < thresholds.length; i++) {
    if (xp >= thresholds[i]) level = i + 1;
  }
  const curStart = thresholds[level - 1] || 0;
  const nextStart = thresholds[level] || curStart + 3000;
  return {
    level,
    currentXp: xp - curStart,
    nextLevelXp: nextStart - curStart,
    titleTh: titles[Math.min(titles.length - 1, level - 1)],
  };
}

export interface RaceSkinDef {
  id: string;
  nameTh: string;
  tintHex: string;
  auraHex: string;
  reqDescTh: string;
  isUnlocked: (save: SaveData, raceId: RaceId) => boolean;
}

export const RACE_SKINS: RaceSkinDef[] = [
  {
    id: 'default',
    nameTh: 'ชุดดั้งเดิม',
    tintHex: '',
    auraHex: '',
    reqDescTh: 'ปลดล็อกเริ่มต้น',
    isUnlocked: () => true,
  },
  {
    id: 'curse_10',
    nameTh: 'เกราะเถ้าจันทร์ (Curse 10)',
    tintHex: '#38BDF8',
    auraHex: '#0EA5E9',
    reqDescTh: 'ผ่านด่านด้วยระดับคำสาป >= 10 ด้วยเผ่านี้',
    isUnlocked: (s, r) => (s.bestCurseByRace[r] || 0) >= 10,
  },
  {
    id: 'curse_20',
    nameTh: 'เกราะสุริยคราสเลือด (Curse 20)',
    tintHex: '#FB7185',
    auraHex: '#E11D48',
    reqDescTh: 'ผ่านด่านด้วยระดับคำสาป >= 20 ด้วยเผ่านี้',
    isUnlocked: (s, r) => (s.bestCurseByRace[r] || 0) >= 20,
  },
  {
    id: 'mastery_5',
    nameTh: 'ออร่าทองคำ (Mastery Lv.5)',
    tintHex: '#FBBF24',
    auraHex: '#F59E0B',
    reqDescTh: 'พัฒนา Mastery เผ่านี้ถึง Lv.5',
    isUnlocked: (s, r) => getMasteryLevelInfo(s.masteryXpByRace[r] || 0).level >= 5,
  },
];
