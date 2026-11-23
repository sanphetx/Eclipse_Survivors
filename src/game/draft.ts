import { ARTIFACT_SLOT_ORDER, ARTIFACTS, MAGE_PERKS, RACES, RELICS, WEAPONS } from './data';
import {
  ArtifactId,
  BossChestReward,
  DraftChoice,
  EquippedArtifacts,
  EquippedRelic,
  EquippedWeapon,
  MagePerkId,
  RaceClassId,
  RaceId,
  RelicId,
  WeaponId,
} from './types';

export const MAX_WEAPON_SLOTS = 4;
export const MAX_RELIC_SLOTS = 4;
export const MAX_WEAPON_LEVEL = 5;

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function weightedSampleWithoutReplacement<T>(
  entries: { item: T; weight: number }[],
  count: number
): T[] {
  const pool = entries.filter((e) => e.weight > 0);
  const out: T[] = [];
  while (out.length < count && pool.length > 0) {
    const total = pool.reduce((sum, e) => sum + e.weight, 0);
    let r = Math.random() * total;
    let pickedIdx = 0;
    for (let i = 0; i < pool.length; i++) {
      r -= pool[i].weight;
      if (r <= 0) {
        pickedIdx = i;
        break;
      }
    }
    out.push(pool[pickedIdx].item);
    pool.splice(pickedIdx, 1);
  }
  return out;
}

export interface DraftOptions {
  banishedKeys?: Set<string>;
  fourthChoiceChance?: number; // 0..0.15 from Luck meta upgrade
  blacksmithHammerEarly?: boolean; // First weapon at Lv4 can evolve 1 level earlier
  raceClass?: RaceClassId | null;
}

export function getDraftChoiceKey(choice: DraftChoice): string {
  if (choice.kind === 'weapon') return `weapon:${choice.weaponId}`;
  if (choice.kind === 'relic') return `relic:${choice.relicId}`;
  if (choice.kind === 'mage_perk') return `perk:${choice.perkId}`;
  return `consumable:${choice.rewardType}`;
}

export function generateLevelUpDraft(
  raceId: RaceId,
  equippedWeapons: EquippedWeapon[],
  equippedRelics: EquippedRelic[],
  magePerks: Partial<Record<MagePerkId, number>> = {},
  options: DraftOptions = {}
): DraftChoice[] {
  const race = RACES[raceId];
  const banished = options.banishedKeys;
  const rollFourth =
    options.fourthChoiceChance && options.fourthChoiceChance > 0 && Math.random() < options.fourthChoiceChance;
  const maxChoices = rollFourth ? 4 : 3;

  if (race.usesElements) {
    const isTimeGod = options.raceClass === 'time_god';
    const perkChoices: { item: DraftChoice; weight: number }[] = (
      Object.keys(MAGE_PERKS) as MagePerkId[]
    )
      .filter((id) => !banished?.has(`perk:${id}`))
      .map((perkId) => ({
        item: {
          kind: 'mage_perk' as const,
          perkId,
          nextRank: (magePerks[perkId] || 0) + 1,
        },
        weight: isTimeGod && perkId === 'mana_flow' ? 2 : 1,
      }));

    // For Chronos Archon, also offer Chronos Hourglass relic at 2x weight until maxed
    if (isTimeGod && !banished?.has('relic:chronos')) {
      const existingChronos = equippedRelics.find((r) => r.id === 'chronos');
      const curLv = existingChronos ? existingChronos.level : 0;
      if (curLv < RELICS.chronos.maxLevel) {
        perkChoices.push({
          item: {
            kind: 'relic',
            relicId: 'chronos',
            nextLevel: curLv + 1,
            isNew: curLv === 0,
          },
          weight: 2,
        });
      }
    }

    const chosen = weightedSampleWithoutReplacement(perkChoices, maxChoices);
    if (chosen.length === 0) {
      return [
        {
          kind: 'consumable',
          rewardType: 'gold_heal',
          goldAmount: 55,
          healAmount: 35,
        },
      ];
    }
    return chosen;
  }

  const candidates: DraftChoice[] = [];

  const weaponMap = new Map(equippedWeapons.map((w) => [w.id, w]));
  const relicMap = new Map(equippedRelics.map((r) => [r.id, r]));

  // 1. Check for Evolutions first (Lv 5 + paired relic owned; or Lv 4 for first weapon with Blacksmith Hammer)
  const hammerEligibleId = options.blacksmithHammerEarly && equippedWeapons[0] ? equippedWeapons[0].id : null;
  for (const w of equippedWeapons) {
    const reqLv = w.id === hammerEligibleId ? 4 : MAX_WEAPON_LEVEL;
    if (!w.evolved && w.level >= reqLv) {
      const def = WEAPONS[w.id];
      if (relicMap.has(def.pairedRelic)) {
        candidates.push({
          kind: 'weapon',
          weaponId: w.id,
          nextLevel: 6,
          isNew: false,
          isEvolve: true,
        });
      }
    }
  }

  // 2. Existing weapons below Lv 5
  for (const w of equippedWeapons) {
    if (!w.evolved && w.level < MAX_WEAPON_LEVEL) {
      candidates.push({
        kind: 'weapon',
        weaponId: w.id,
        nextLevel: w.level + 1,
        isNew: false,
        isEvolve: false,
      });
    }
  }

  // 3. New weapons if slots < 4 (excluding banished)
  if (equippedWeapons.length < MAX_WEAPON_SLOTS) {
    const allWeaponIds = Object.keys(WEAPONS) as WeaponId[];
    for (const id of allWeaponIds) {
      if (weaponMap.has(id)) continue;
      if (banished?.has(`weapon:${id}`)) continue;
      const def = WEAPONS[id];
      if (!race.canUseMagic && def.category === 'magic') continue;
      candidates.push({
        kind: 'weapon',
        weaponId: id,
        nextLevel: 1,
        isNew: true,
        isEvolve: false,
      });
    }
  }

  // 4. Existing relics below maxLevel
  for (const r of equippedRelics) {
    const def = RELICS[r.id];
    if (r.level < def.maxLevel) {
      candidates.push({
        kind: 'relic',
        relicId: r.id,
        nextLevel: r.level + 1,
        isNew: false,
      });
    }
  }

  // 5. New relics if slots < 4 (excluding banished)
  if (equippedRelics.length < MAX_RELIC_SLOTS) {
    const allRelicIds = Object.keys(RELICS) as RelicId[];
    for (const id of allRelicIds) {
      if (relicMap.has(id)) continue;
      if (banished?.has(`relic:${id}`)) continue;
      candidates.push({
        kind: 'relic',
        relicId: id,
        nextLevel: 1,
        isNew: true,
      });
    }
  }

  // Prioritize putting at least 1 Evolution if available, then shuffle rest
  const evolutions = candidates.filter((c) => c.kind === 'weapon' && c.isEvolve);
  const nonEvolutions = shuffle(candidates.filter((c) => !(c.kind === 'weapon' && c.isEvolve)));

  const picked: DraftChoice[] = [];
  if (evolutions.length > 0) {
    picked.push(evolutions[0]);
  }
  for (const item of nonEvolutions) {
    if (picked.length >= maxChoices) break;
    picked.push(item);
  }

  while (picked.length < 3) {
    picked.push({
      kind: 'consumable',
      rewardType: 'gold_heal',
      goldAmount: 35 + picked.length * 15,
      healAmount: 30,
    });
  }

  return picked;
}

export interface BossChestOptions {
  extraItems?: number; // e.g., +1 from Altar Row 3A or Fate Powder
  bonusGoldMult?: number;
  allowEarlyEvolve?: boolean; // Altar Row 6B after minute 10
  allowNoRelicEvolve?: boolean; // Altar Row 6A
  elapsedMinutes?: number;
  blacksmithHammerEarly?: boolean;
}

export function generateBossChestReward(
  raceId: RaceId,
  equippedWeapons: EquippedWeapon[],
  equippedRelics: EquippedRelic[],
  magePerks: Partial<Record<MagePerkId, number>> = {},
  options: BossChestOptions = {}
): BossChestReward {
  const race = RACES[raceId];
  const itemCount = 2 + Math.max(0, options.extraItems || 0);
  const goldMult = options.bonusGoldMult ?? 1;
  const baseBonusGold = Math.round((80 + Math.floor(Math.random() * 71)) * goldMult);

  if (race.usesElements) {
    const perkIds = shuffle(Object.keys(MAGE_PERKS) as MagePerkId[]);
    const items: DraftChoice[] = [];
    for (let i = 0; i < itemCount; i++) {
      const perkId = perkIds[i % perkIds.length];
      const prevSame = items.filter((it) => it.kind === 'mage_perk' && it.perkId === perkId).length;
      items.push({
        kind: 'mage_perk',
        perkId,
        nextRank: (magePerks[perkId] || 0) + 1 + prevSame,
      });
    }
    return {
      items,
      bonusGold: baseBonusGold,
    };
  }
  const items: DraftChoice[] = [];

  const simWeapons = equippedWeapons.map((w) => ({ ...w }));
  const simRelics = equippedRelics.map((r) => ({ ...r }));
  const relicIds = new Set(simRelics.map((r) => r.id));

  const hammerEligibleId = options.blacksmithHammerEarly && simWeapons[0] ? simWeapons[0].id : null;
  for (let roll = 0; roll < itemCount; roll++) {
    const canEvolveLv4 = Boolean(options.allowEarlyEvolve && (options.elapsedMinutes || 0) >= 10);
    // Check evolvable weapon
    const evolvable = simWeapons.find((w) => {
      const minEvoLv = canEvolveLv4 || w.id === hammerEligibleId ? 4 : MAX_WEAPON_LEVEL;
      if (w.evolved || w.level < minEvoLv) return false;
      if (options.allowNoRelicEvolve || roll === 0) return true;
      return relicIds.has(WEAPONS[w.id].pairedRelic);
    });
    if (evolvable) {
      evolvable.evolved = true;
      evolvable.level = 6;
      items.push({
        kind: 'weapon',
        weaponId: evolvable.id,
        nextLevel: 6,
        isNew: false,
        isEvolve: true,
      });
      continue;
    }

    const upgradableW = shuffle(simWeapons.filter((w) => !w.evolved && w.level < MAX_WEAPON_LEVEL));
    if (upgradableW.length > 0) {
      const target = upgradableW[0];
      target.level += 1;
      items.push({
        kind: 'weapon',
        weaponId: target.id,
        nextLevel: target.level,
        isNew: false,
        isEvolve: false,
      });
      continue;
    }

    const upgradableR = shuffle(simRelics.filter((r) => r.level < RELICS[r.id].maxLevel));
    if (upgradableR.length > 0) {
      const target = upgradableR[0];
      target.level += 1;
      items.push({
        kind: 'relic',
        relicId: target.id,
        nextLevel: target.level,
        isNew: false,
      });
      continue;
    }

    if (simWeapons.length < MAX_WEAPON_SLOTS) {
      const avail = shuffle(
        (Object.keys(WEAPONS) as WeaponId[]).filter(
          (id) => !simWeapons.some((w) => w.id === id) && (race.canUseMagic || WEAPONS[id].category !== 'magic')
        )
      );
      if (avail.length > 0) {
        const id = avail[0];
        simWeapons.push({ id, level: 1, evolved: false, cooldownTimer: 0, totalDamage: 0 });
        items.push({
          kind: 'weapon',
          weaponId: id,
          nextLevel: 1,
          isNew: true,
          isEvolve: false,
        });
        continue;
      }
    }

    items.push({
      kind: 'consumable',
      rewardType: 'gold_heal',
      goldAmount: 65,
      healAmount: 45,
    });
  }

  return {
    items,
    bonusGold: baseBonusGold,
  };
}

export function generateArtifactDraft(equipped: EquippedArtifacts): ArtifactId[] {
  const emptySlots = shuffle(ARTIFACT_SLOT_ORDER.filter((slot) => !equipped[slot]));
  const filledSlots = shuffle(ARTIFACT_SLOT_ORDER.filter((slot) => Boolean(equipped[slot])));
  const orderedSlots = [...emptySlots, ...filledSlots];

  const picked: ArtifactId[] = [];
  const allArtifacts = Object.values(ARTIFACTS);

  for (const slot of orderedSlots) {
    if (picked.length >= 3) break;
    const slotPool = allArtifacts.filter((a) => a.slot === slot && equipped[slot] !== a.id);
    const legPool = shuffle(slotPool.filter((a) => a.isLegendary));
    const regPool = shuffle(slotPool.filter((a) => !a.isLegendary));
    // ~22% weight to feature a Legendary Artifact when unowned in slot
    if (legPool.length > 0 && (regPool.length === 0 || Math.random() < 0.22)) {
      picked.push(legPool[0].id);
    } else if (regPool.length > 0) {
      picked.push(regPool[0].id);
    }
  }

  if (picked.length < 3) {
    const rest = shuffle(
      allArtifacts.filter(
        (a) => !picked.includes(a.id) && equipped[a.slot] !== a.id
      )
    );
    for (const a of rest) {
      if (picked.length >= 3) break;
      picked.push(a.id);
    }
  }

  return picked;
}
