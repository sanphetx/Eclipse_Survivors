# Eclipse Survivors (พิภพต้องสาป) — คู่มือแก้โค้ดสำหรับ Gemini

> **วิธีใช้คู่มือนี้**
> - ส่งให้ Gemini **ทีละงาน (Task)** อย่าส่งทั้งไฟล์พร้อมกัน เพราะ `GameCanvas.tsx` ยาวกว่า 8,000 บรรทัด ถ้าแก้หลายอย่างพร้อมกันมีโอกาสพังของเดิม
> - ทำงานเสร็จแต่ละอัน **ลองเล่นก่อน** แล้วค่อยส่งงานถัดไป
> - เลขบรรทัดอาจไม่ตรงกับโค้ดปัจจุบัน ให้ค้นหาจาก **ชื่อฟังก์ชันหรือข้อความในโค้ด** ที่ระบุไว้แทน
> - **ส่วน A** คือโค้ดที่ทดสอบการคอมไพล์แล้ว ให้ Gemini ทำตามได้เลย
> - **ส่วน B** คือฟีเจอร์ที่แนะนำและยังไม่ได้เขียนโค้ด มีสเปกและตัวเลขไว้ให้

---

## สารบัญ

**ส่วน A — แพตช์ที่เขียนเสร็จแล้ว**
- Task A1: ตั้งค่า BALANCE กลาง
- Task A2: แก้ดาเมจผู้เล่นคูณซ้อน และใส่เพดานค่าสถานะ
- Task A3: มอนโตแบบทวีคูณ และแก้บั๊ก realm
- Task A4: เพดานดาเมจต่อวินาทีของบอส
- Task A5: log บาลานซ์ทุกนาที
- Task A6: ระบบคอมโบ + HUD

**ส่วน B — ฟีเจอร์ที่แนะนำ (ยังไม่ได้ทำ)**
- B0: บั๊กและจุดที่ควรแก้ด่วน
- B1: แก้มอนโดนดอกเดียวตาย
- B2: ระบบ Break ของบอส (เฟส 1)
- B3: สกิลกด Space ของแวมไพร์และออร์ค + ปุ่มมือถือ (เฟส 2)
- B4: อัปเกรดคลาสเลเวล 20 (เฟส 3)
- B5: ระบบรวมของ 3 ชั้น + Synergy (เฟส 4)
- B6: แท่นบูชา + Artifact Set (เฟส 5)
- B7: ฟีเจอร์อื่นที่น่าเพิ่ม

**ส่วน C — วิธีจูนตัวเลข**

---

# ส่วน A — แพตช์ที่เขียนเสร็จแล้ว

## สาเหตุของปัญหา "เก่งเร็วเกินไป" (อ่านประกอบ)

1. โบนัสดาเมจทุกตัวใน `computeStats` **คูณกันหมด** ช่วงท้ายเกม damageMult ของเผ่าทั่วไปอยู่ราว ×5.3 และของจอมเวทย์ราว ×11.6 แต่ HP มอนที่นาทีที่ 30 โตแค่ ×24 แบบเกือบเส้นตรง
2. เพิร์ค `element_might` ของจอมเวทย์ไม่มีเพดาน +14% ต่อขั้นคูณทบไปเรื่อยๆ
3. **บั๊ก**: หลังฆ่ายมทูต `currentMinute` รีเซ็ตเป็น 0 HP มอนเลยตกจาก ×24 เหลือ ×1.9
4. ดูดเลือดคิดจากดาเมจที่ทำได้ ยิ่งดาเมจสูงเลือดก็ยิ่งเต็มตลอด
5. คริสูงสุด 95% และคูลดาวน์ลดได้ถึงประมาณ 70%

---

## Task A1: ตั้งค่า BALANCE กลาง

**ไฟล์:** `src/game/data.ts`

**คำสั่งสำหรับ Gemini:**
> เพิ่ม export const BALANCE ไว้ใน src/game/data.ts **ก่อน** `export const STAGES` ตามโค้ดด้านล่าง แล้วในฟังก์ชัน `getActiveBiome` เปลี่ยน `Math.pow(1.95, realmTier)` เป็น `Math.pow(BALANCE.realmHpMultPerTier, realmTier)` และ import `BALANCE` เข้าไปใน `GameCanvas.tsx` จาก `'../game/data'`

```ts
// =====================================================================
// BALANCE — ค่าปรับสมดุลทั้งหมดรวมไว้ที่เดียว แก้ตัวเลขตรงนี้เพื่อจูนเกม
// =====================================================================
export const BALANCE = {
  // --- พลังผู้เล่น ---
  // โบนัสดาเมจ % (ถาวร, ศิลาพลัง, เพิร์คธาตุ, อาร์ติแฟกต์, สภาพอากาศ ฯลฯ) จะ "บวกกัน" ในกลุ่มเดียว
  // แล้วผ่าน diminishing returns: ค่าจริง = X * K / (X + K)  (ยิ่งสะสมยิ่งได้ผลน้อยลง)
  dmgIncreaseSoftCapK: 8.0, // สะสม +100% → ได้จริง +89%, สะสม +300% → ได้จริง +218% (ค่ายิ่งน้อยยิ่งกดแรง)
  critChanceCap: 0.6, // คริสูงสุด 60% (เดิม 95%)
  critDamageCap: 2.5, // คริแรงสุด x2.5
  cooldownFloor: 0.5, // คูลดาวน์ลดได้สูงสุด 50% (รวมทุกแหล่ง)
  lifestealCap: 0.04, // ดูดเลือดสูงสุด 4% ของดาเมจ
  damagePerLevelCap: 0.3, // อาร์ติแฟกต์ดาเมจตามเลเวล สูงสุด +30%
  magePerkMightMaxRanks: 6, // เพิร์คพลังธาตุนับได้สูงสุด 6 ขั้น

  // --- มอนสเตอร์ ---
  growthStartMinute: 8, // เริ่มเร่งความแกร่งมอนแบบทวีคูณหลังนาทีนี้ (ต้นเกมเหมือนเดิม)
  enemyHpGrowthPerMin: 1.04, // HP มอนคูณเพิ่มต่อนาที หลัง growthStartMinute (1.0 = ปิด)
  enemyDmgGrowthPerMin: 1.025, // ดาเมจมอนคูณเพิ่มต่อนาที หลัง growthStartMinute
  realmMinuteCarry: 30, // หลังฆ่ายมทูต มอนนับนาทีต่อจากเดิม (ไม่รีเซ็ตกลับไปอ่อน)
  realmHpMultPerTier: 1.2, // ตัวคูณ HP เพิ่มต่อ realm (เดิม 1.95 แต่ตอนนี้นาทีต่อเนื่องแล้ว)

  // --- บอส ---
  bossMaxHpPctPerSec: 0.03, // บอสรับดาเมจได้ไม่เกิน 3% maxHP ต่อวินาที (อยู่อย่างน้อย ~33 วิ)
  reaperMaxHpPctPerSec: 0.008, // ยมทูตรับได้ไม่เกิน 0.8%/วิ (อยู่อย่างน้อย ~2 นาที)

  // --- Combo ---
  comboMilestones: [50, 100, 250, 500, 1000, 2500, 5000, 10000],

  // --- Debug ---
  logBalanceEveryMinute: true, // พิมพ์ DPS ผู้เล่น / HP มอน ใน console ทุกนาที (F12)
};
```

---

## Task A2: แก้ดาเมจผู้เล่นคูณซ้อน และใส่เพดานค่าสถานะ

**ไฟล์:** `src/components/GameCanvas.tsx` ในฟังก์ชัน `computeStats`

**หลักการ:** ตัวคูณที่เป็นเอกลักษณ์ของเผ่า (เผ่า, คลาส, กลางวัน-กลางคืน, Voidless) ยังคูณเหมือนเดิม แต่โบนัส % ทั่วไปทั้งหมดให้ **บวกรวมกันในตัวแปร `dmgIncrease`** แล้วค่อยผ่าน diminishing returns ตอนท้าย

**คำสั่งสำหรับ Gemini:**
> ในฟังก์ชัน `computeStats` ของ GameCanvas.tsx ให้แก้ตามรายการด้านล่างทุกข้อ ห้ามแก้ส่วนอื่น

**1) ตอนประกาศตัวแปร** เปลี่ยน
```ts
let damageMult = race.baseDamageMult * (1 + upg.might * 0.1);
```
เป็น
```ts
// ตัวคูณแท้ (เผ่า/คลาส/กลางวัน-คืน/Voidless) ยังคูณกันตามเดิม
let damageMult = race.baseDamageMult;
// โบนัส % ทั่วไปทั้งหมด บวกรวมกันในกลุ่มเดียว แล้วค่อยผ่าน diminishing returns ตอนท้าย
let dmgIncrease = upg.might * 0.1;
```

**2) จอมเวทย์ดาบ** เปลี่ยน `damageMult *= 1 + spellbladeBuffs.dmgBonus;` เป็น
```ts
dmgIncrease += spellbladeBuffs.dmgBonus;
```

**3) ฝนเลือด** เปลี่ยน `if (sim.weather === 'blood_rain') { damageMult *= 1.15; }` เป็น
```ts
if (sim.weather === 'blood_rain') {
  dmgIncrease += 0.15;
}
```

**4) เพิร์คธาตุของจอมเวทย์** เปลี่ยน `damageMult *= 1 + mpMight * 0.14;` เป็น
```ts
dmgIncrease += Math.min(mpMight, BALANCE.magePerkMightMaxRanks) * 0.14;
```

**5) ศิลาพลัง (spinach)** เปลี่ยน `if (r.id === 'spinach') damageMult *= 1 + r.level * 0.15;` เป็น
```ts
if (r.id === 'spinach') dmgIncrease += r.level * 0.15;
```

**6) อาร์ติแฟกต์ดาเมจตามเลเวล** เปลี่ยน
```ts
if (art.damagePerLevelBonus) artDamageMult += art.damagePerLevelBonus * sim.player.level;
```
เป็น
```ts
if (art.damagePerLevelBonus)
  artDamageMult += Math.min(
    BALANCE.damagePerLevelCap,
    art.damagePerLevelBonus * sim.player.level
  );
```

**7) เพดานคริและดูดเลือด** เปลี่ยน
```ts
critChance = Math.max(0, Math.min(0.95, critChance));
critDamageMult = Math.max(1.2, critDamageMult);
```
เป็น
```ts
critChance = Math.max(0, Math.min(BALANCE.critChanceCap, critChance));
critDamageMult = Math.max(1.2, Math.min(BALANCE.critDamageCap, critDamageMult));
lifestealPct = Math.min(BALANCE.lifestealCap, lifestealPct);
```

**8) รวมดาเมจตอนท้ายและเพดานคูลดาวน์** เปลี่ยน
```ts
damageMult = Math.max(0.25, damageMult * Math.max(0.25, artDamageMult));
cooldownMult = Math.max(0.35, cooldownMult) * artCooldownFactor;
```
เป็น
```ts
// รวมโบนัสอาร์ติแฟกต์เข้ากลุ่มบวก แล้วใส่ diminishing returns: X*K/(X+K)
const rawDmgIncrease = dmgIncrease + (artDamageMult - 1);
const K = BALANCE.dmgIncreaseSoftCapK;
const effDmgIncrease =
  rawDmgIncrease > 0 ? (rawDmgIncrease * K) / (rawDmgIncrease + K) : rawDmgIncrease;
damageMult = Math.max(0.25, damageMult * Math.max(0.25, 1 + effDmgIncrease));
cooldownMult = Math.max(BALANCE.cooldownFloor, cooldownMult * artCooldownFactor);
```

---

## Task A3: มอนโตแบบทวีคูณ และแก้บั๊ก realm

**ไฟล์:** `src/components/GameCanvas.tsx` ในฟังก์ชัน `createEnemy`

**คำสั่งสำหรับ Gemini:**
> ในฟังก์ชัน `createEnemy` แก้การคำนวณ `scale` และเพิ่มการสเกลดาเมจมอนตามโค้ดด้านล่าง

**1)** เปลี่ยน
```ts
const levelPressure = Math.max(0, sim.player.level - 10) * 0.045;
const scale =
  (1 + realmMinute * 0.42 + Math.pow(realmMinute, 1.38) * 0.095 + levelPressure) *
  biomeHpMult;
```
เป็น
```ts
const levelPressure = Math.max(0, sim.player.level - 10) * 0.045;
// นาทีสำหรับคำนวณความแกร่ง: นับต่อเนื่องข้าม realm (หลังฆ่ายมทูตจะไม่รีเซ็ตกลับไปอ่อน)
const scaleMinute = realmMinute + sim.realmTier * BALANCE.realmMinuteCarry;
const lateMinutes = Math.max(0, scaleMinute - BALANCE.growthStartMinute);
const scale =
  (1 + scaleMinute * 0.42 + Math.pow(scaleMinute, 1.38) * 0.095 + levelPressure) *
  Math.pow(BALANCE.enemyHpGrowthPerMin, lateMinutes) *
  biomeHpMult;
const enemyDmgScale = Math.pow(BALANCE.enemyDmgGrowthPerMin, lateMinutes);
```

**2)** ในฟังก์ชันย่อย `buildEnemy` ตรง `return { ...base, speed, armorRatio, ... }` ให้เพิ่มบรรทัด `damage` ต่อจาก `...base`:
```ts
return {
  ...base,
  damage: base.damage * enemyDmgScale,
  speed,
  armorRatio,
  // ...ที่เหลือเหมือนเดิม
```

**ผลที่คาดไว้ (HP มอนเทียบเดิม)**

| นาที | เดิม | ใหม่ |
|---|---|---|
| 5 | ×4.0 | ×4.0 |
| 10 | ×7.5 | ×8.1 |
| 15 | ×11.3 | ×14.9 |
| 20 | ×15.3 | ×24.5 |
| 30 | ×24.0 | ×56.8 |
| เข้า realm 1 | ×1.9 (บั๊ก) | ×68 |

---

## Task A4: เพดานดาเมจต่อวินาทีของบอส

**ไฟล์:** `src/components/GameCanvas.tsx`

**คำสั่งสำหรับ Gemini:**
> 1. ใน interface ของศัตรู (ที่มี `isReaper: boolean;`) เพิ่ม field สองตัวต่อจาก `isReaper`
> 2. ในฟังก์ชัน `damageEnemy` ตรงที่คำนวณ `const effective = ...` แล้ว `enemy.hp -= effective;` ให้แทนด้วยโค้ดด้านล่าง
> 3. ใน interface `SimState` (ที่มี `realmTier: number;`) เพิ่ม `balanceDmgAccum?: number;` และ `balanceLastLoggedMinute?: number;`

**1) field ของศัตรู**
```ts
isReaper: boolean;
// BALANCE: หน้าต่างจำกัดดาเมจต่อวินาทีของบอส
dpsCapWindowStart?: number;
dpsCapWindowDmg?: number;
```

**2) ใน damageEnemy**
```ts
let effective = Math.max(
  1,
  Math.round(rawDamage * critBonusMult * (1 - enemy.armorRatio) * shieldAuraMult)
);
// BALANCE: บอสรับดาเมจได้ไม่เกิน X% ของ maxHP ต่อวินาที (เวลาจริง) → ตีจบเร็วเกินไม่ได้
if (enemy.isBoss) {
  const nowSec = performance.now() / 1000;
  if (
    enemy.dpsCapWindowStart === undefined ||
    nowSec - enemy.dpsCapWindowStart >= 1
  ) {
    enemy.dpsCapWindowStart = nowSec;
    enemy.dpsCapWindowDmg = 0;
  }
  const capPct = enemy.isReaper ? BALANCE.reaperMaxHpPctPerSec : BALANCE.bossMaxHpPctPerSec;
  const capLeft = Math.max(0, enemy.maxHp * capPct - (enemy.dpsCapWindowDmg || 0));
  effective = Math.min(effective, Math.floor(capLeft));
  enemy.dpsCapWindowDmg = (enemy.dpsCapWindowDmg || 0) + effective;
}
enemy.hp -= effective;
sim.balanceDmgAccum = (sim.balanceDmgAccum || 0) + effective;
```

> ⚠️ **สิ่งที่ควรแก้ต่อ:** ตอนบอสชนเพดาน ตัวเลข "0" จะลอยขึ้น ให้ Gemini เปลี่ยนให้เป็นคำว่า "ต้านทาน" สีเทาแทน (ดูที่ `addFloatingText` ที่อยู่ถัดลงมาใน damageEnemy) หรือไม่แสดงเลยถ้า `effective === 0`

---

## Task A5: log บาลานซ์ทุกนาที

**ไฟล์:** `src/components/GameCanvas.tsx` ในลูปหลัก ต่อจากบรรทัด
`const biome = getActiveBiome(stageId, sim.realmTier, sim.biomeShiftCount);` ตัวแรกที่อยู่หลัง `const stats = computeStats(sim);`

**คำสั่งสำหรับ Gemini:**
> เพิ่มโค้ด log ด้านล่างหลังบรรทัด `const py = sim.player.y;` ในลูปหลักที่คำนวณ `currentMinute`

```ts
// BALANCE debug log: กด F12 → Console เพื่อดูตัวเลขทุกนาที แล้วเอาไปจูนค่าใน BALANCE (data.ts)
if (sim.balanceLastLoggedMinute === undefined) sim.balanceLastLoggedMinute = currentMinute;
if (currentMinute !== sim.balanceLastLoggedMinute) {
  if (BALANCE.logBalanceEveryMinute) {
    const scaleMinute = currentMinute + sim.realmTier * BALANCE.realmMinuteCarry;
    const hpScale =
      (1 + scaleMinute * 0.42 + Math.pow(scaleMinute, 1.38) * 0.095) *
      Math.pow(BALANCE.enemyHpGrowthPerMin, Math.max(0, scaleMinute - BALANCE.growthStartMinute)) *
      biome.hpMult;
    const realSecPerMin = runPaceRef.current === 'blitz' ? 20 : 60;
    console.log(
      `[BALANCE] realm ${sim.realmTier} นาที ${currentMinute} | Lv ${sim.player.level}` +
        ` | DPS ผู้เล่น ≈ ${Math.round((sim.balanceDmgAccum || 0) / realSecPerMin)}` +
        ` | damageMult x${stats.damageMult.toFixed(2)} | cooldown x${stats.cooldownMult.toFixed(2)}` +
        ` | HP มอน x${hpScale.toFixed(1)} (สไลม์ ≈ ${Math.round(18 * hpScale)})` +
        ` | HP ผู้เล่น ${Math.round(sim.player.hp)}/${sim.player.maxHp}`
    );
  }
  sim.balanceDmgAccum = 0;
  sim.balanceLastLoggedMinute = currentMinute;
}
```

---

## Task A6: ระบบคอมโบ + HUD

**สเปก**
- ทุกฮิตที่โดนมอน (ดาเมจ > 0) ให้คอมโบ +1
- ถ้าผู้เล่นโดนตีหรือโดนกระสุน คอมโบกลับเป็น 0 (ยกเว้นดาเมจจิ๊บจ๊อยจากพายุทราย)
- ถึงมายล์สโตนใน `BALANCE.comboMilestones` จะมีตัวเลขเด้ง เช่น "100x!" บน HUD และเหนือหัวตัวละคร พร้อมเสียง
- คอมโบแตกตอนเกิน 50 จะขึ้น "COMBO BREAK" บอกจำนวนที่เสียและสถิติสูงสุด
- **เป็นแค่ภาพบนจอ ไม่ให้โบนัสดาเมจ** (ถ้าจะให้รางวัล แนะนำทอง/EXP +5% ต่อขั้น ไม่ใช่ดาเมจ)

### A6.1 `src/game/types.ts` ใน interface `HudSnapshot` ต่อจาก `reaperSlainCount: number;`
```ts
// Combo: นับฮิตที่ตีโดนติดต่อกันโดยไม่โดนดาเมจ
combo: number;
comboBest: number;
comboMilestone: number; // มายล์สโตนล่าสุดที่ผ่าน (0 = ยังไม่ถึง)
comboMilestoneId: number; // เพิ่มทุกครั้งที่ผ่านมายล์สโตนใหม่ ใช้รีสตาร์ทแอนิเมชัน
comboBreakId: number; // เพิ่มทุกครั้งที่คอมโบแตก (เมื่อคอมโบ >= มายล์สโตนแรก)
comboBrokenAt: number; // คอมโบที่เสียไปครั้งล่าสุด
```

### A6.2 `src/App.tsx` ในค่าเริ่มต้นของ HUD ต่อจาก `reaperSlainCount: 0,`
```ts
combo: 0,
comboBest: 0,
comboMilestone: 0,
comboMilestoneId: 0,
comboBreakId: 0,
comboBrokenAt: 0,
```

### A6.3 `src/game/sound.ts` เพิ่มเมธอดในคลาส SoundEngine (ก่อน `playBossWarning`)
```ts
playComboMilestone(tier: number) {
  const base = 523.25 * Math.pow(1.06, Math.min(12, tier * 2));
  [1, 1.26, 1.5].forEach((m, idx) => {
    this.playTone(base * m, base * m * 1.01, 0.12, 'triangle', 0.07, idx * 0.05);
  });
}

playComboBreak() {
  this.playTone(420, 160, 0.22, 'square', 0.05);
}
```

### A6.4 `src/components/GameCanvas.tsx`

**(ก)** ใน interface `SimState` เพิ่ม
```ts
combo?: number;
comboBest?: number;
comboMilestone?: number;
comboMilestoneId?: number;
comboBreakId?: number;
comboBrokenAt?: number;
```

**(ข)** เพิ่มฟังก์ชันสองตัวนี้ **ก่อน** `const damageEnemy = (`
```ts
// ===== Combo: ตีโดนติดต่อกันโดยไม่โดนดาเมจ =====
const registerComboHit = (sim: SimState) => {
  const combo = (sim.combo || 0) + 1;
  sim.combo = combo;
  if (combo > (sim.comboBest || 0)) sim.comboBest = combo;
  const milestones = BALANCE.comboMilestones;
  let reached = 0;
  let tier = 0;
  for (let i = 0; i < milestones.length; i++) {
    if (combo >= milestones[i]) {
      reached = milestones[i];
      tier = i + 1;
    }
  }
  if (reached > (sim.comboMilestone || 0)) {
    sim.comboMilestone = reached;
    sim.comboMilestoneId = (sim.comboMilestoneId || 0) + 1;
    addFloatingText(
      sim,
      sim.player.x,
      sim.player.y - 46,
      `COMBO ${reached}x!`,
      tier >= 5 ? '#22D3EE' : tier >= 3 ? '#F43F5E' : '#FBBF24',
      1.35 + Math.min(0.6, tier * 0.1)
    );
    sound.playComboMilestone(tier);
  }
};

const breakCombo = (sim: SimState) => {
  const combo = sim.combo || 0;
  if (combo <= 0) return;
  if (combo >= BALANCE.comboMilestones[0]) {
    sim.comboBreakId = (sim.comboBreakId || 0) + 1;
    sim.comboBrokenAt = combo;
    sound.playComboBreak();
  }
  sim.combo = 0;
  sim.comboMilestone = 0;
};
```

**(ค)** ใน `damageEnemy` ต่อจาก `enemy.hp -= effective;`
```ts
if (effective > 0) registerComboHit(sim);
```

**(ง)** ค้นหาทุกจุดที่เป็น `sim.player.hp -= dmgTaken;` (มี 4 จุด) และ `sim.player.hp -= boltDmg;` (1 จุด) แล้วเพิ่มบรรทัดนี้ต่อท้ายทุกจุด
```ts
breakCombo(sim);
```
> **ห้ามใส่** ที่ `sim.player.hp -= sandDmg;` (ดาเมจพายุทรายโดนถี่มาก คอมโบจะขึ้นไม่ได้)

**(จ)** ใน `callbacksRef.current.onHudUpdate({ ... })` ต่อจาก `reaperSlainCount: sim.reaperSlainCount,`
```ts
combo: sim.combo || 0,
comboBest: sim.comboBest || 0,
comboMilestone: sim.comboMilestone || 0,
comboMilestoneId: sim.comboMilestoneId || 0,
comboBreakId: sim.comboBreakId || 0,
comboBrokenAt: sim.comboBrokenAt || 0,
```

### A6.5 `src/components/GameHud.tsx`

**(ก)** เพิ่มคอมโพเนนต์นี้ **ก่อน** `export const GameHud`
```tsx
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
            <div className="mt-0.5 text-[10px] text-slate-400 font-mono-num">ถัดไป {nextMilestone}x</div>
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
          <div className="text-xs sm:text-sm font-black tracking-widest text-rose-400">COMBO BREAK</div>
          <div className="text-[11px] text-slate-400 font-mono-num">
            เสีย {hud.comboBrokenAt.toLocaleString()}x · สูงสุด {hud.comboBest.toLocaleString()}x
          </div>
        </div>
      )}
    </div>
  );
};
```

**(ข)** ใน `GameHud` ใส่ `<ComboMeter hud={hud} />` เป็นลูกตัวแรกของ div นอกสุด
```tsx
<div className="fixed inset-0 z-10 pointer-events-none flex flex-col justify-between">
  <ComboMeter hud={hud} />
  {/* ...ของเดิม... */}
```

### A6.6 `src/index.css` ต่อท้ายไฟล์
```css
/* ===== Combo Meter ===== */
@keyframes comboPulse {
  0% { transform: scale(1.18); }
  100% { transform: scale(1); }
}
.combo-pulse {
  animation: comboPulse 0.18s ease-out;
  transform-origin: right center;
}
@keyframes comboBurst {
  0% { opacity: 0; transform: scale(0.4) translateY(10px); }
  18% { opacity: 1; transform: scale(1.35) translateY(0); }
  35% { transform: scale(1); }
  80% { opacity: 1; transform: scale(1) translateY(-6px); }
  100% { opacity: 0; transform: scale(1.1) translateY(-18px); }
}
.combo-burst {
  animation: comboBurst 1.6s ease-out forwards;
  transform-origin: right bottom;
}
@keyframes comboBreak {
  0% { opacity: 0; transform: translateX(10px); }
  10% { opacity: 1; transform: translateX(-4px); }
  16% { transform: translateX(3px); }
  22% { transform: translateX(0); }
  75% { opacity: 1; }
  100% { opacity: 0; }
}
.combo-break {
  animation: comboBreak 1.8s ease-out forwards;
}
@media (prefers-reduced-motion: reduce) {
  .combo-pulse, .combo-burst, .combo-break { animation-duration: 0.01ms; }
}
```

---

# ส่วน B — ฟีเจอร์ที่แนะนำ (ยังไม่ได้ทำ)

> ทุกฟีเจอร์ด้านล่าง **ห้ามคูณดาเมจเพิ่มตรงๆ** ถ้ามีโบนัสดาเมจ % ให้บวกเข้า `dmgIncrease` ใน `computeStats` (ดู Task A2) ยกเว้นที่ระบุว่าเป็นตัวคูณแท้

## B0: บั๊กและจุดที่ควรแก้ด่วน

1. **ผสานร่างแล้วดาเมจต่อฮิตเท่าเดิมหรือลดลง**: ค้นหารูปแบบ `(evo ? X : A + lv * B)` ในโค้ดอาวุธ ตัวอย่าง
   - `evo ? 40 : 14 + lv * 5` → เลเวล 5 ได้ 39 แต่ผสานร่างได้ 40
   - `evo ? 62 : 24 + lv * 8.5` → เลเวล 5 ได้ 66.5 แต่ผสานร่างได้แค่ 62
   - `evo ? 78 : 30 + lv * 10.5` → เลเวล 5 ได้ 82.5 แต่ผสานร่างได้ 78

   **ให้แก้:** ดาเมจร่างผสาน = (ดาเมจเลเวล 5) × 1.35 ทุกอาวุธ หรือถ้าอาวุธไหนได้กระสุนเพิ่มมากอยู่แล้ว ให้ ×1.15 ก็พอ

2. **สกิลที่โตตามเลเวลผู้เล่นไม่มีเพดาน**: เช่น `(22 + sim.player.level * 2.65)` และ `(17 + sim.player.level * 1.15)` ให้ใช้ `Math.min(sim.player.level, 40)` แทน `sim.player.level` ในสูตรดาเมจทั้งหมด

3. **ตัวเลข "0" ตอนบอสชนเพดาน**: ดูหมายเหตุใน Task A4

4. **เลเวลอัปหลังของตันได้แค่ทองกับเลือด**: อาวุธ 4 ช่องตันที่เลเวล 5 และไอเท็ม 4 ช่องตันที่เลเวล 3 รวมราว 32 ครั้ง หลังจากนั้นเกมจะตัน → แก้ด้วยระบบ "ดาวเกินขีด" ใน B5

## B1: แก้มอนโดนดอกเดียวตาย

ตอนนี้เลือดมอนโตตาม **เวลา** อย่างเดียว ไม่ได้ดูว่าผู้เล่นแรงแค่ไหน

**1) ให้เลือดมอนอิงพลังผู้เล่นบางส่วน (แนะนำทำก่อน)**
- เก็บค่าดาเมจรวมใน 30 วินาทีล่าสุด (ใช้ `sim.balanceDmgAccum` ที่มีแล้ว ทำเป็น moving average) → ได้ `playerDps`
- ตั้งเป้าว่ามอนทั่วไปต้องใช้ 2–3 ฮิต:
  ```
  targetHp = playerDps × 0.12            // ประมาณ 2–3 ฮิตต่อตัว (ปรับได้)
  adaptiveMult = max(1, targetHp / (baseHp × timeScale))
  finalHp = baseHp × timeScale × (1 + (adaptiveMult - 1) × 0.5)   // อิงแค่ 50%
  ```
- เพิ่มใน BALANCE: `adaptiveHpWeight: 0.5`, `adaptiveTargetFraction: 0.12`
- อิงแค่ 50% ผู้เล่นจะยังรู้สึกว่าเก่งขึ้น ไม่ใช่ว่ามอนแรงตามเสมอ
- **ไม่ใช้กับบอส** (บอสมีเพดานดาเมจต่อวินาทีอยู่แล้ว)

**2) เกราะแบบหักลบตรงๆ (flat armor)**
- เพิ่ม `flatArmor` ให้มอนบางชนิด เช่นมอนหัวแข็งลดดาเมจ 15 ต่อฮิต
- สูตร: `effective = max(1, raw - flatArmor) × (1 - armorRatio)`
- อาวุธที่ตีถี่แต่เบาจะไม่ทำลายล้างทุกอย่างอีก ผู้เล่นต้องมีอาวุธหนักไว้ใช้ด้วย

**3) มอนแบบใหม่ที่ต้องจัดการแบบอื่น**

| มอน | พฤติกรรม | วิธีรับมือ |
|---|---|---|
| มอนโล่ | ลดดาเมจด้านหน้า 80% | อ้อมไปตีจากข้างหลัง |
| มอนแตกตัว | ตายแล้วแตกเป็น 3 ตัวเล็ก | ต้องมีดาเมจวงกว้าง |
| หมอผี | ฮีลมอนรอบตัว 5% ต่อวินาที | เลือกฆ่าก่อน |
| มอนพุ่งชน | ง้าง 0.8 วิแล้วพุ่งแรงมาก | หลบให้ทัน |
| มือปืน | ยืนห่างแล้วยิงกระสุน | เริ่มตั้งแต่นาที 8 ทำให้เป็น Bullet Hell จริง |
| มอนระเบิด | วิ่งเข้าหาแล้วระเบิดตอนตาย | ฆ่าจากระยะไกล |

**4) Elite**
- ทุก 30 วินาทีมีมอนตัวใหญ่ เลือด ×15 ขนาด ×1.6 มีออร่าสีและบัพสุ่ม 1–2 อย่าง (ใช้ `pickBossBuffs` ที่มีอยู่แล้ว)
- ฆ่าแล้วดรอปหีบเล็ก (ทอง หรือเลือกอัปเกรด 1 ครั้ง)

## B2: ระบบ Break ของบอส (เฟส 1)

- บอสมี **หลอด Break** ใต้หลอดเลือด ค่าเริ่มต้น = 100
- ดาเมจที่ลดหลอด Break:
  - อาวุธหนัก (ค้อน ขวาน), Perfect Parry และเวทย์ธาตุดิน/หิน: ลด 3 ต่อฮิต
  - อาวุธอื่น: ลด 0.5 ต่อฮิต
- หลอดหมด → บอส **ล้ม (Stagger) 3 วินาที**: หยุดเคลื่อนที่และหยุดยิง รับดาเมจ ×1.5 และ **เพดานดาเมจต่อวินาที ×2**
- หลังลุกขึ้น หลอดเติมเต็ม และค่าเริ่มต้นรอบถัดไป +30% (ทำ Break ยากขึ้นทุกครั้ง)
- HUD: หลอดสีเหลืองใต้หลอดเลือดบอส ตอนล้มขึ้นคำว่า "BREAK!" ตัวใหญ่

## B3: สกิลกด Space ของแวมไพร์และออร์ค + ปุ่มมือถือ (เฟส 2)

**แวมไพร์ — เกจโลหิต + Bat Swarm**
- เกจ 0–100: ฆ่ามอน +1, ดูดเลือด +1 ต่อ 10 HP ที่ฟื้น
- เต็มแล้วกด Space → แปลงเป็นฝูงค้างคาว 1.5 วิ: อมตะ วิ่งเร็ว ×1.6 ทะลุมอน ดูดเลือด 2 HP จากทุกตัวที่บินผ่าน
- ใช้แล้วเกจเป็น 0

**ออร์ค — Rage Bar**
- เกจ 0–100: โดนตี +8, ตีโดนมอนในระยะ 120px +0.5
- เต็มแล้วเข้า Berserk 5 วิ: ตัวใหญ่ ×1.25 ต้านแรงกระแทก 100% ทุกฮิตติดคริ (คริแรงยังตันที่ `critDamageCap`)
- หรือกด Space เพื่อ War Cry: ผลักมอนทั้งจอ + สตั๊น 1 วิ
- **คูลดาวน์ 20 วิ** หลังใช้

**ปุ่มบนจอสำหรับมือถือ (ต้องทำพร้อมกัน)**
- ในโค้ดมีจอยสัมผัสอยู่แล้ว แปลว่ามีคนเล่นบนมือถือ
- ทุกสกิลที่ใช้ Space ต้องมีปุ่มกลมมุมขวาล่าง แสดงวงคูลดาวน์และเกจ
- ใช้ `onTriggerDash` ที่ส่งเข้า GameHud อยู่แล้วเป็นตัวอย่าง

## B4: อัปเกรดคลาสเลเวล 20 (เฟส 3)

| คลาส | ความสามารถ | ตัวเลขที่แนะนำ / ข้อจำกัด |
|---|---|---|
| **นักล่า** | Dash ทิ้งกับดักหนาม: ตรึงมอน 1.5 วิ ลดเกราะ -25% | กับดักอยู่ได้สูงสุด 3 อัน |
| **นักล่า** | Hunter's Mark: มอนที่เลือดเยอะสุดในจอติดตรา ฆ่าได้แล้วรีเซ็ตแดช + คริ +20% นาน 5 วิ | คริยังตันที่ 60% |
| **อัศวิน** | Perfect Parry: แดชชนกระสุนหรือมอนที่กำลังง้าง (`windupTimer > 0`) ในช่วง 0.25 วิ → ล้างกระสุนรัศมี 160px + คลื่นดาบ ×2.5 ตามเกราะ | ตัวคูณนี้ใช้กับคลื่นดาบเท่านั้น |
| **อัศวิน** | Aegis Stance: มอนในระยะ 100px ทุกตัว เกราะ +1 และดาเมจคลื่นดาบ +5% | สูงสุด +50% |
| **นักบุญ** | เรียกโกเล็มวาร์ปมาทุบ + วงเวทย์ 5 วิ (ฮีลไวขึ้น คูลดาวน์อาวุธ -20%) | ⚠️ **ต้องตัดสินใจ**: Space ชนกับแดช → ให้เสียแดช หรือใช้ปุ่ม E/Q (แนะนำ E) |
| **จอมมาร** | Blood Pact: สังเวย HP 15% → ระเบิดโลหิต + ดาเมจ +35% นาน 5 วิ | **บวกเข้า dmgIncrease** ห้ามคูณ · คูลดาวน์ 25 วิ · (เดิมเสนอ +60% ซึ่งคูณกับกลางคืนได้ ×2.3) |
| **หมาป่า** | Feral Pounce: กระโจน + Bleed รอบตัว + ความเร็วตี +40% นาน 4 วิ | คูลดาวน์ 8 วิ |
| **หมาป่า** | Blood Moon Overdrive: ฆ่าต่อเนื่อง 15 ตัว → ลบจุดอ่อนกลางวัน | **อยู่ 8 วิ คูลดาวน์ 30 วิ** (ไม่งั้นช่วงท้ายเกมจุดอ่อนหายถาวร) |
| **ลูซิเฟอร์** | ขนนกปักพื้น 6 วิ กด Space เรียกกลับ เฉือนทุกตัวที่ขวาง | คูลดาวน์ 6 วิ |
| **ออร์ค: Juggernaut** (ใหม่) | ชนมอนแล้วกระเด็น + แปลง Max HP ส่วนเกินเป็นดาเมจกายภาพ | **แปลงได้สูงสุด +40%** (ออร์คได้ +15 HP ทุกเลเวลไม่มีเพดาน) |
| **ออร์ค: Berserker** (ใหม่) | HP ยิ่งน้อยยิ่งตีเร็ว (สูงสุด +80%) + ทุก 100 kill อาวุธใหญ่ +20% | **ซ้อนได้สูงสุด 5 ครั้ง** |

## B5: ระบบรวมของ 3 ชั้น + Synergy (เฟส 4)

> **กติกาสำคัญ:** การรวมของต้องผูกกับ **เวลาในด่าน (หีบบอส)** ไม่ใช่เลเวล ไม่งั้นผู้เล่นจะเก่งเร็วเกินไปอีก

### ชั้นที่ 1: ผสานร่าง (Evolve) — ของเดิม แต่เพิ่มไอเท็มคู่
ตอนนี้อาวุธ 19 ชิ้นใช้ไอเท็มคู่ร่วมกันแค่ 4 ชิ้น (spinach, boots, armor_plate, chronos) ควรเพิ่มเป็น 8–10 ชิ้น แล้วกระจายคู่ใหม่ ตัวอย่างไอเท็มใหม่:

| ไอเท็มใหม่ | ผลต่อเลเวล (สูงสุด 3) |
|---|---|
| ลูกตุ้มกาลเวลา | อาวุธที่ปล่อยเป็นจังหวะยิงถี่ขึ้น -6% คูลดาวน์ |
| เขี้ยวอสูร | ดาเมจ +10% ต่อศัตรูที่เลือดต่ำกว่า 50% |
| ขนนกฟีนิกซ์ | ระยะสกิล +8% และฟื้น 1 HP ทุก 3 วิ |
| หัวใจน้ำแข็ง | สกิลมีโอกาส 8% ทำให้ศัตรูช้าลง 30% |

### ชั้นที่ 2: รวมคู่ (Union)
- อาวุธ **ผสานร่างแล้ว 2 ชิ้น** → รวมเป็น 1 ชิ้น **ได้ช่องอาวุธว่างคืน 1 ช่อง** ผู้เล่นเก็บอาวุธใหม่มาอัปต่อได้
- **ได้จากหีบบอสเท่านั้น** (นาทีที่ 10, 15, 20, 25) หีบละ 1 สูตร
- พลังร่างรวมคู่ ≈ **1.2–1.4 เท่าของสองชิ้นรวมกัน** จุดเด่นคือ **กลไกใหม่** ไม่ใช่ดาเมจเยอะ
- เคารพข้อจำกัดเผ่า (ออร์คไม่เจอสูตรเวทย์)

| ร่างผสาน A | ร่างผสาน B | ร่างรวมคู่ | สิ่งที่ทำ |
|---|---|---|---|
| เพลงดาบผ่ามิติ (katana) | ทัณฑ์สายฟ้าสวรรค์ (lightning) | **ดาบอัสนีไรจิน** | ฟันแล้วทิ้งรอยสายฟ้า ช็อตศัตรูที่เดินผ่าน |
| สุริยคราสมรณะ (fireorb) | พายุหิมะเยือกแข็ง (frostnova) | **สุริยันจันทราคราส** | ลูกแก้วสลับไฟกับน้ำแข็ง ติดไฟแล้วโดนน้ำแข็งจะแตกระเบิด |
| พายุมีดพันเล่ม (dagger) | หอกมังกรทะลวงฟ้า (spear) | **พายุทวนเงา** | หอกเงาพุ่งเป็นพัด แตกเป็นมีดเมื่อชน |
| ฝนดาวตกวันสิ้นโลก (meteor) | ลำแสงสายรุ้งดับจักรวาล (laser) | **ปืนใหญ่ดาราอวสาน** | ลำแสงชี้เป้า 1 วิ แล้วดาวตกถล่มตามแนว |
| shield (ร่างผสาน) | chain (ร่างผสาน) | **ป้อมปราการโซ่ตรวน** | โล่หมุนรอบตัว + โซ่ดึงศัตรูเข้ามา |
| garlic (ร่างผสาน) | totem (ร่างผสาน) | **วิหารศักดิ์สิทธิ์** | เขตที่ศัตรูอ่อนลงและผู้เล่นฟื้นเลือด |
| watergun (ร่างผสาน) | พายุหิมะเยือกแข็ง (frostnova) | **สงกรานต์ไซบีเรีย** | ฉีดน้ำแข็งแช่ศัตรูเป็นแถว |
| พายุกล้วยทองคำ (banana) | จักรพรรดิแมวส้มพิฆาต (cat) | **ราชันแมวกล้วยทอง** | แมวส้มขี่กล้วยหมุนรอบตัว |
| ขวานสังหารหมุนวน (axe) | mace (ร่างผสาน) | **ขวานค้อนไททัน** | เหวี่ยงรอบตัว ทุกรอบที่ 3 ทุบแผ่นดินแยก |
| ฝูงพญานกกระจิบมหากาฬ (bird) | มหาเวทย์ดารา (wand) | **ฝูงหงส์ดารา** | นกดาราไล่ศัตรูแล้วระเบิดเป็นดาว |

### ชั้นที่ 3: ของในตำนาน (Mythic)
- ได้จาก **หีบของยมทูต** เลือกร่างรวมคู่ 1 ชิ้นมาอัป 1 ชิ้นต่อรอบ
- ได้ความสามารถที่เปลี่ยนวิธีเล่น เช่น ดาบอัสนีไรจิน → **เทพอัสนี**: ทุก 20 วิหยุดเวลา 2 วิแล้วฟ้าผ่าทั้งจอ

### Synergy อาวุธคู่ (ไม่ต้องรวม แค่ถือคู่กัน)
- ถือ ปืนฉีดน้ำ + วงแหวนสายฟ้า → **Electro-Shock**: ศัตรูที่เปียกโดนสายฟ้าช็อตชิ่ง 3 ตัว
- ถือ ลูกแก้วเพลิง + วงแหวนเหมันต์ → **Thermal Shock**: โดนทั้งสองธาตุแล้วระเบิดไอน้ำ
- เป็นทั้งโบนัสเล็กๆ และ **คำใบ้** ว่าคู่ไหนรวมคู่ได้

### ส่วนเสริมที่ทำให้ไม่ตัน
- **ดาวเกินขีด (Limit Break)**: หลังของตันหมด เลเวลอัปให้ "ดาว" กับร่างรวมคู่ ชิ้นละไม่เกิน 5 ดาว ดาวละ +8% ดาเมจ (บวกเข้า dmgIncrease) หรือ +1 กระสุน
- **คัมภีร์สูตรลับ** (เมนูหลัก, บันทึกถาวร): สูตรที่ยังไม่เจอแสดง "???" ถ้าถือชิ้นใดชิ้นหนึ่งของสูตรอยู่ ขึ้นคำใบ้ "ดาบนี้สั่นพ้องกับบางสิ่ง…"
- **จอมเวทย์**: ใช้แนวคิดเดียวกันกับระบบรวมธาตุ เช่นรวมธาตุผสม 2 ชนิดเป็นธาตุชั้นสาม

### จังหวะทั้งด่าน (30 นาที)

| ช่วง | สิ่งที่เกิดขึ้น |
|---|---|
| นาที 0–10 | เก็บอาวุธ อัปเลเวล ได้ร่างผสานชิ้นแรก |
| นาที 10–20 | หีบบอสใช้รวมคู่ ได้ช่องว่างคืน เก็บอาวุธใหม่มาไต่เลเวลอีกรอบ |
| นาที 20–30 | ร่างรวมคู่ชิ้นที่ 2–3 และเริ่มสะสมดาวเกินขีด |
| นาที 30 | ฆ่ายมทูต → ของในตำนาน 1 ชิ้น → realm ต่อไป |

## B6: แท่นบูชา + Artifact Set (เฟส 5)

**แท่นบูชาเสี่ยงดวง (Cursed Shrines)**
- สุ่มเกิดบนแมปทุก 2–3 นาที เดินไปยืน 1.5 วิเพื่อใช้
- แท่นแลกเลือด: จ่าย HP ปัจจุบัน 30% → อัปอาวุธสุ่ม +1 ขั้น
- แท่นเร่งคลื่นมอน: เรียกมินิบอสทันที → ฆ่าได้หีบอาร์ติแฟกต์การันตี

**Artifact Set Bonus**
- เก็บอาร์ติแฟกต์ธีมเดียวกันครบ 3 ชิ้น → ปลดล็อก **ความสามารถใหม่** เช่นออร่าพิเศษ
- ⚠️ **ห้ามลบข้อเสียของชุด** (เดิมเสนอแบบนั้น) เพราะอาร์ติแฟกต์ออกแบบมาเป็นของแลกเปลี่ยน ถ้าลบข้อเสียจะเหลือแต่ข้อดี

## B7: ฟีเจอร์อื่นที่น่าเพิ่ม

**ความท้าทาย**
- **ระดับคำสาป 1–10** (แบบ Heat ของ Hades): ชนะแล้วปลดล็อก แต่ละระดับมอน HP +15% หรือดาเมจ +10% หรือ Elite ถี่ขึ้น แลกกับทอง +20%
- **ภารกิจระหว่างด่าน**: เช่น "ฆ่าค้างคาว 300 ตัวใน 2 นาที" หรือ "ไม่โดนตี 60 วิ" ทำสำเร็จได้หีบ
- **วงล้อม (Horde Ring)**: มอนเกิดล้อมเป็นวงรอบตัวแล้วบีบเข้ามา
- **Challenge ประจำวัน**: seed เดียวกันทุกคน ล็อกเผ่าและด่าน แข่งกันว่าใครรอดนานสุด

**ความลึกของบิลด์**
- **รีโรล / แบน / ข้าม** ตอนเลเวลอัป: เริ่มรอบละ 2 ครั้ง ซื้อเพิ่มถาวรได้ในร้าน
- **การ์ดอาร์คานา**: เลือก 1 ใบตอนเริ่มด่าน เปลี่ยนกติกาทั้งรอบ เช่น "กระสุนทุกนัดเด้งได้ แต่ดาเมจ -20%"
- **สัตว์เลี้ยงคู่ใจ**: ช่วยดูดของหรือยิงเบาๆ

**ความอยากกลับมาเล่น**
- **สมุดมอนสเตอร์**: ฆ่าครบจำนวนแล้วปลดล็อกข้อมูลและโบนัสเล็กๆ
- **ความชำนาญตัวละคร**: เล่นบ่อยได้สกินหรือสีอาวุธใหม่ (ของตกแต่ง ไม่ให้พลัง)
- **ความสำเร็จ**: ใช้ปลดล็อกอาวุธ เช่น "คอมโบ 1,000 ครั้งแรก" ได้อาวุธลับ
- **รางวัลคอมโบ** (ต่อจาก Task A6): ทอง/EXP +5% ต่อขั้นคอมโบ ไม่ให้ดาเมจ

**แผนที่และอีเวนต์**
- **สิ่งของบนแมป**: คบเพลิงตีแล้วดรอปของ รถขนสมบัติที่ต้องไล่ตาม ประตูมิติไปห้องลับ
- **โหมด Boss Rush**: บอสมาเรียงกันทีละตัว ไม่มีมอนธรรมดา

**ความสะดวกและการวิเคราะห์**
- **หน้าสรุปหลังจบรอบ**: ดาเมจของแต่ละอาวุธ (มี `totalDamage` ในอาวุธแต่ละชิ้นอยู่แล้ว) คอมโบสูงสุด และสาเหตุที่ตาย
- **ตั้งค่า**: ซ่อนตัวเลขดาเมจ ลดการสั่นจอ

**3 อันดับแรกที่แนะนำ:** หน้าสรุปหลังจบรอบ → รีโรล/แบน/ข้าม → ระดับคำสาป

---

## ลำดับการทำทั้งหมดที่แนะนำ

1. **ส่วน A ทั้งหมด** (A1 → A6) แล้วลองเล่น ดู log ใน Console
2. **B0** แก้บั๊กผสานร่างและเพดานเลเวล
3. **B1 ข้อ 1** เลือดมอนอิงพลังผู้เล่น
4. **B2** ระบบ Break ของบอส
5. **B3** สกิล Space แวมไพร์/ออร์ค + ปุ่มมือถือ
6. **B4** คลาสเลเวล 20 ทีละเผ่า
7. **B1 ข้อ 3–4** มอนแบบใหม่และ Elite
8. **B5** Synergy → รวมคู่ → ดาวเกินขีด → ของในตำนาน
9. **B6** และ **B7** ตามความชอบ

---

# ส่วน C — วิธีจูนตัวเลข

1. เปิดเกมแล้วกด **F12 → Console**
2. ทุกนาทีจะมีบรรทัด `[BALANCE]` แสดง DPS ผู้เล่น, damageMult, cooldown, HP มอน และ HP ผู้เล่น
3. ตั้งเป้า:
   - มอนทั่วไปตายใน **1–3 ฮิต** ตลอดทั้งเกม
   - บอสใช้เวลา **30–60 วินาที**
   - ผู้เล่นเลือดลดบ้างทุกนาทีหลังนาทีที่ 10 (ถ้าเลือดเต็มตลอด แปลว่าง่ายไป)
4. ปรับใน `BALANCE` (data.ts):

| อาการ | ปรับอะไร |
|---|---|
| ช่วงท้ายยากเกินไป | ลด `enemyHpGrowthPerMin` เช่น 1.03 หรือเพิ่ม `dmgIncreaseSoftCapK` เช่น 12 |
| ช่วงท้ายยังง่าย | เพิ่ม `enemyHpGrowthPerMin` เช่น 1.05 หรือลด `dmgIncreaseSoftCapK` เช่น 5 |
| ช่วงต้นเปลี่ยนไปมาก | เพิ่ม `growthStartMinute` |
| มอนไม่น่ากลัว ผู้เล่นไม่ต้องหลบ | เพิ่ม `enemyDmgGrowthPerMin` เช่น 1.035 |
| บอสตายเร็ว / ช้าเกินไป | ปรับ `bossMaxHpPctPerSec` (0.03 = อย่างน้อย ~33 วิ) |
| เข้า realm ใหม่แล้วโหดเกิน | ลด `realmMinuteCarry` เช่น 20 |
| คอมโบขึ้นเร็วเกินไป | ขยับค่าใน `comboMilestones` ขึ้น |
