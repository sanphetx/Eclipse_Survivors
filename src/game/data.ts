import {
  ArtifactDef,
  ArtifactId,
  ArtifactSlot,
  ArtifactSlotMeta,
  BiomeDef,
  BossBuffDef,
  BossBuffId,
  DamageType,
  ElementCatalystDef,
  ElementDef,
  ElementFusionDef,
  ElementId,
  EnemyKind,
  MagePerkDef,
  MagePerkId,
  MapEventDef,
  MapEventId,
  MetaUpgradeDef,
  MetaUpgradeId,
  RaceClassDef,
  RaceClassId,
  RaceConfig,
  RaceId,
  RelicDef,
  RelicId,
  SinDef,
  SinId,
  StageDef,
  StageId,
  WeaponDef,
  WeaponId,
  WeatherDef,
  WeatherId,
} from './types';

export const RACES: Record<RaceId, RaceConfig> = {
  human: {
    id: 'human',
    nameTh: 'เผ่ามนุษย์',
    nameEn: 'Human Wanderer',
    subtitleTh: 'สายสมดุลคล่องตัว พุ่งแดชหลบอมตะทะลุกระสุนได้',
    portraitPath: '/src/assets/images/portrait_human_1795169751511.jpg',
    accentColor: '#38BDF8',
    baseHp: 120,
    baseSpeed: 185,
    baseDamageMult: 1.0,
    baseArmor: 1,
    baseMagnet: 155,
    canUseMagic: true,
    canDash: true,
    canEvolveClass: true,
    dayNightSensitive: false,
    defaultWeapon: 'banana',
    traits: [
      'กด Space / Shift แดชหลบอมตะทะลุฝูงศัตรู (คูลดาวน์ 2.4 วิ)',
      'เลเวล 20 เปลี่ยนสายได้: สายนักล่า / สายนักบุญ / สายอัศวิน',
    ],
  },
  vampire: {
    id: 'vampire',
    nameTh: 'เผ่าปีศาจ',
    nameEn: 'Demonkin',
    subtitleTh: 'อสูรแห่งรัตติกาลและขุมนรก กลางวัน-กลางคืนพลิกผันพลัง · แตะ Space ฝูงค้างคาว / ค้าง Space ท่าไม้ตาย',
    portraitPath: '/src/assets/images/portrait_vampire_1795169752292.jpg',
    accentColor: '#E11D48',
    baseHp: 105,
    baseSpeed: 178,
    baseDamageMult: 1.0,
    baseArmor: 0,
    baseMagnet: 165,
    canUseMagic: true,
    canDash: false,
    canEvolveClass: true,
    dayNightSensitive: true,
    defaultWeapon: 'dagger',
    traits: [
      'ดูดเลือดเมื่อสังหารศัตรู (จำกัดโควต้าต่อวิ) + เกจโลหิตเต็มแตะ Space แปลงร่างฝูงค้างคาวอมตะ 1.5 วิ',
      'กลางคืนไวขึ้น +35% แรงขึ้น +45% · เลเวล 20 เปลี่ยนสายได้: จอมมาร / แวมไพร์ / 7 บาป',
    ],
    weakness: 'กลางวัน/เช้า: วิ่งช้าลง -25% และทำดาเมจลดลง -30%',
  },
  orc: {
    id: 'orc',
    nameTh: 'เผ่าออร์ค',
    nameEn: 'Ironhide Orc',
    subtitleTh: 'นักรบคลั่งเกราะหนา เลือดเพิ่มขึ้นทุกครั้งที่เลเวลอัป',
    portraitPath: '/src/assets/images/portrait_orc_1795169751091.jpg',
    accentColor: '#F59E0B',
    baseHp: 175,
    baseSpeed: 162,
    baseDamageMult: 1.0,
    baseArmor: 4,
    baseMagnet: 145,
    canUseMagic: false,
    canDash: false,
    canEvolveClass: false,
    dayNightSensitive: false,
    defaultWeapon: 'axe',
    traits: [
      'กด Space คำรามศึกผลักฝูงมอนและเร่งเกจโทสะ · เมื่อโทสะเต็ม 100 คลั่ง Berserk คริ 100% นาน 5 วิ',
      'ทุกครั้งที่เลเวลอัป ได้รับ +15 Max HP ถาวร · เกราะ +4 และกายภาพ +45%',
    ],
    weakness: 'ใช้เวทย์มนต์ไม่ได้ (แต่มีสกิลคำรามศึกและ Berserk คุ้มกันระยะประชิด)',
  },
  mage: {
    id: 'mage',
    nameTh: 'คลาสจอมเวทย์',
    nameEn: 'Elemental Archmage',
    subtitleTh: 'ไร้ศาสตราวุธ เก็บออร์บ 3 ธาตุผสานมหาเวทย์ พร้อมจังหวะคูลดาวน์พิธีกรรมและมานา',
    portraitPath: '/src/assets/images/portrait_mage_1795173874216.jpg',
    accentColor: '#818CF8',
    baseHp: 88,
    baseSpeed: 180,
    baseDamageMult: 1.04,
    baseArmor: 0,
    baseMagnet: 165,
    canUseMagic: true,
    canDash: false,
    canEvolveClass: true,
    dayNightSensitive: false,
    usesElements: true,
    defaultWeapon: 'wand',
    traits: [
      'สะสมออร์บ 3 ธาตุ (2 แกนหลัก + 1 ตัวเร่ง) ผสานมหาเวทย์ 36 รูปแบบ · กด Space เปิด Void Infusion เร่งดาเมจ (แต่คูลดาวน์พิธี x2)',
      'ทุกๆ การผสมครบ 3 ครั้ง: เสกบาเรียวายุกันดาเมจ & ผลักศัตรู · เลเวล 20 เปลี่ยนสาย (เทพเวลา / จอมเวทย์ Necromancer / จอมเวทย์ดาบ)',
    ],
    weakness: 'HP พื้นฐานน้อย (88) · ติดคูลดาวน์พิธีกรรม (4.8 วิ) หลังผสานทุกครั้ง · ต้องบริหาร MP',
  },
};

export const RACE_CLASSES: Record<RaceClassId, RaceClassDef> = {
  hunter: {
    id: 'hunter',
    raceId: 'human',
    nameTh: 'นักฆ่าเงาจันทร์',
    nameEn: 'Moonshadow Assassin',
    roleTh: 'แดช 3 ชาร์จ ฟันเงา & ลอบกัดคริ 100%',
    passiveTh: 'Max HP -20% · ไว +20% · คริ +20% (เพดาน 75% / คริแรง x2.1) · แดช 3 ชาร์จ (ไกล +70%, 1.6 วิ/ชาร์จ) + ธนูมรกตมาร์กเป้า',
    activeSkillTh:
      'ฟันเงา: ทุกแดชฟันเส้นทาง 70px (+12%/ตราล่า, ฆ่าด้วยฟันเงาคืน 1 ชาร์จ CD 1.5 วิ) + ลอบกัดหลัง >100° คริ 100% +50% แรง · ค้าง Space: "ราตรีพันเงา" (ชาร์จไว x2)',
    color: '#34D399',
  },
  saint: {
    id: 'saint',
    raceId: 'human',
    nameTh: 'นักบุญผู้สร้างแดนศักดิ์สิทธิ์',
    nameEn: 'Sanctum Saint',
    roleTh: 'วาง 3 ตราเชื่อมอาณาเขตแสง + มหาโกเล็มยั่วยุ',
    passiveTh: 'Max HP +45 · พื้นที่ +20% · ฟื้นฟู +2 HP/2วิ · มหาโกเล็ม HP 250% เกราะ 60% ยั่วยุมอน 350px ทุก 8 วิ',
    activeSkillTh:
      'ตราศักดิ์สิทธิ์: แดชวางตราสูงสุด 3 จุดเชื่อมสามเหลี่ยม (ฮีล 1.5%/วิ · ลด CD -20% · ยิงแสง) · ค้าง Space: "ปฏิญาณแห่งสวรรค์"',
    color: '#FDE047',
  },
  knight: {
    id: 'knight',
    raceId: 'human',
    nameTh: 'อัศวินพิทักษ์ศักดิ์สิทธิ์',
    nameEn: 'Holy Bulwark',
    roleTh: 'ดาบลอยพิทักษ์ + แดช Parry สะท้อน & บล็อก 100%',
    passiveTh: 'เกราะ +8 · Max HP +100 · ช้าลง -5% · โดนตี 1 ครั้งไม่เกิน 12% Max HP · ยั่วยุ 300px ทุก 10 วิ',
    activeSkillTh:
      'ดาบลอยศักดิ์สิทธิ์ 3-8 เล่ม + แดช Parry สะท้อนกระสุน & สตั๊น + บล็อกฟรีทุก 5 ฮิต · ค้าง Space: "เอ็กซ์แคลิเบอร์ลงทัณฑ์"',
    color: '#38BDF8',
  },
  demon_lord: {
    id: 'demon_lord',
    raceId: 'vampire',
    nameTh: 'จอมมาร',
    nameEn: 'Immortal Demon Lord',
    roleTh: 'เพลิงนรก 5 ชั้น + บัญชีวิญญาณ',
    passiveTh: 'ดาเมจ +22% · Max HP +35 · ทุกฮิตติดเพลิงนรก 5 ชั้น มอนตายระเบิดวิญญาณแพร่ไฟ (บัญชี 100/300/666 ปลดสกิล)',
    activeSkillTh:
      'ฟื้นจากเถ้าถ่าน: ตายคืนชีพ HP 55% + เปิดท่าไม้ตายฟรี (CD 2 นาที) · ค้าง Space: "ประตูนรกเปิด" เรียกอิมป์เพลิงทั้งจอ',
    color: '#E11D48',
  },
  vampire_lord: {
    id: 'vampire_lord',
    raceId: 'vampire',
    nameTh: 'แวมไพร์',
    nameEn: 'Crimson Vampire Lord',
    roleTh: 'เลือดน้อยตีแรง + ดื่มแผลเลือด',
    passiveTh: 'ไว +15% · โควต้าดูดเลือด x2 · กระหายโลหิต (+5% ดาเมจ / +3% ไว ต่อ 10% HP ที่หายไป) · โล่โลหิตสูงสุด 25% Max HP',
    activeSkillTh:
      'แผลเลือด + งานเลี้ยงโลหิต: ค้างคาวดื่มแผลฮีล + จ่าย 8% HP ใช้ฝูงค้างคาวได้ · ค้าง Space (เลือด <50%): "ราตรีโลหิตนิรันดร์"',
    color: '#F43F5E',
  },
  seven_sins: {
    id: 'seven_sins',
    raceId: 'vampire',
    nameTh: '7 บาป',
    nameEn: 'Seven Deadly Sins',
    roleTh: 'ทำสัญญาอัญเชิญจอมปีศาจทั้งเจ็ด',
    passiveTh: 'Max HP +30 · ดาเมจบาปคูณจากผู้เล่น · อัญเชิญพันธสัญญาสูงสุด 3 ตัวพร้อมหลอดเลือด (ล่อมอน 30%) และทำสัญญาใหม่ทุก 5 เลเวล',
    activeSkillTh:
      'ปีศาจ 7 บาปมีสกิลและราคาของบาปเฉพาะตัว · ค้าง Space: "พิธีบาปทั้งเจ็ด" อัญเชิญครบทั้ง 7 ตนพร้อมกัน + ลำแสงพิพากษา!',
    color: '#C084FC',
  },
  time_god: {
    id: 'time_god',
    raceId: 'mage',
    nameTh: 'เทพเวลา',
    nameEn: 'Chronos Archon',
    roleTh: 'ผู้บิดเบือนห้วงเวลา',
    passiveTh:
      'กาลเวลาเร่ง: ลดคูลดาวน์ -10% · มานา +1.0/วิ · Max HP -10% · ย้อนกาล: ฟื้นคืนชีพย้อนจุด 2 วิ (สูงสุด 3 ครั้ง) · ตัวคูณลดคูลดาวน์ช่วยเพิ่มอัตราเร่งคูลดาวน์ The World เมื่อมอนตายในโดม',
    activeSkillTh:
      'The World: หยุดเวลาทั้งแมพ 3.0 วิ ทุก 32 วิ (บอสช้า 65%, ดาเมจ +15%) · โดมหยุดเวลา: ร่ายอัตโนมัติทุก 10 วิ (ลดคูลดาวน์ต่ำสุด 7.5 วิ, นาน 3.5 วิ, สูงสุด 2 โดม) หยุดมอนในโดม & ระเบิดหนี้เวลาเมื่อหลุด · มอนตายในโดมจะหักลดคูลดาวน์ The World ตามตัวคูณลดคูลดาวน์ & ชาร์จย้อนกาล',
    color: '#22D3EE',
  },
  death_god: {
    id: 'death_god',
    raceId: 'mage',
    nameTh: 'จอมเวทย์ Necromancer',
    nameEn: 'Necromancer',
    roleTh: 'ปลุกชีพกองทัพ Minion & อาณาจักรแห่งความภักดี',
    passiveTh:
      'Max HP -15% · ทุกมอนที่ฆ่า (รวมมินิบอส!) มีโอกาส 10% + (Lv×1.5)% คืนชีพเป็น Minion (HP 33% Max HP ตัวเรา, ตีแรงสเกลตามเลเวล/นาที) นาน 1 นาที · เมื่อตาย/หมดเวลาระเบิดวงเล็ก + มอบดวงวิญญาณ +0.03% ดาเมจ/ดวง (สูงสุด +80%)',
    activeSkillTh:
      'ค้าง Space: "Dominion of Eternal Fealty" มอบชีวิตที่สองให้ Minion สูงสุด 10 ตัว (เลือกมินิบอส/อีลิทก่อน: ไม่ตายตามเวลาจนกว่า HP หมด, HP +20%, ตีแรง +15%, ตีไว +15% ถาวร) · Minion ที่ติดบัพตายให้วิญญาณ 0.09%/ดวง + วิ่งไว +0.2%/ตัว + โล่ 25/ตัว (สะสมสูงสุด 300 นาน 2 นาที)',
    color: '#A855F7',
  },
  spellblade_god: {
    id: 'spellblade_god',
    raceId: 'mage',
    nameTh: 'เทพแห่งจอมเวทย์ดาบ',
    nameEn: 'Arcane Spellblade',
    roleTh: 'ราชันดาบผสานมหาธาตุ',
    passiveTh: 'เกราะ +4 · +30 Max HP · ไว +14% · คลื่นดาบเปลี่ยนรูปแบบ ความยาว และความถี่ตามธาตุที่ถืออยู่ทีละธาตุ (ไฟ: เวฟไกลเผา% / น้ำ: กวาดสโลว์&แข็ง / ลม: ไวสั้นผลัก / แสง: พุ่งตรงทะลุ / มืด: หลุมดำ)',
    activeSkillTh: 'ฟันคลื่นดาบเฉพาะธาตุ + ยืนนิ่งชาร์จฟัน 360° (โฟกัสพัก 3 วิ) · ผสานครบ 5 ครั้งวิวัฒนาการสู่ "ดาบไร้ธาตุ"',
    color: '#F59E0B',
  },
  voidless_blade: {
    id: 'voidless_blade',
    raceId: 'mage',
    nameTh: 'ดาบไร้ธาตุ (ร่างจุติ)',
    nameEn: 'Voidless Archblade',
    roleTh: 'จอมดาบเหนือสรรพธาตุ',
    passiveTh: 'หลังเปลี่ยนคลาสต้องสังหารสะสมใหม่ครบ 50 ตัว (คูลดาวน์ 15 วิ) เพื่อเข้า "โหมดจุติไร้ธาตุ" 10 วิ: ดาเมจ +55% และลดดาเมจที่ได้รับ 50%',
    activeSkillTh: 'เฉพาะในโหมดจุติไร้ธาตุ: เรียกเสาแสงสวรรค์จากฟ้า + ปล่อยท่าดาบทั้ง 5 ธาตุ + อัญเชิญดาบวิญญาณ 5 เล่ม (HP 60% ของตัวเรา)',
    color: '#E0F2FE',
    hiddenFromLv20: true,
  },
};

export const SIN_ORDER: SinId[] = [
  'pride',
  'greed',
  'envy',
  'wrath',
  'sloth',
  'gluttony',
  'lust',
];

export const SEVEN_SINS: Record<SinId, SinDef> = {
  pride: {
    id: 'pride',
    sinNameTh: 'โอหัง (Pride)',
    demonNameTh: 'ลูซิเฟอร์',
    nameEn: 'Lucifer of Pride',
    roleTh: 'หัวหน้า / ยิงขนนกทมิฬนำวิถี',
    color: '#C084FC',
    lv1DescTh: 'ยิงขนนกทมิฬนำวิถี 8 ทิศทุก 2.2 วิ · เพิ่มดาเมจบาปตัวอื่น +10%',
    lv3DescTh: 'ขนนกทมิฬ 16 ทิศทุก 2.2 วิ · เพิ่มดาเมจบาปตัวอื่น +20%',
    gaugeSourceTh: 'ไม่โดนตีต่อเนื่อง (คอมโบ)',
    drawbackTh: 'ผู้เล่นโดนดาเมจแรงขึ้น +10%',
  },
  greed: {
    id: 'greed',
    sinNameTh: 'โลภะ (Greed)',
    demonNameTh: 'มัมมอน',
    nameEn: 'Mammon of Greed',
    roleTh: 'หีบมีฟัน เก็บ EXP/ทองทั้งแมป',
    color: '#FBBF24',
    lv1DescTh: 'วิ่งเก็บ EXP/ทองอัตโนมัติ + กัดศัตรู (มอนที่ฆ่าดรอปทอง x2)',
    lv3DescTh: 'เก็บของไวขึ้น + ทุก 500 ทองที่เก็บได้ระเบิดเหรียญทองทั้งจอ!',
    gaugeSourceTh: 'ทองที่เก็บได้',
    drawbackTh: 'HP น้อย (60% Max HP) · เน้นสนับสนุนเศรษฐกิจ',
  },
  envy: {
    id: 'envy',
    sinNameTh: 'ริษยา (Envy)',
    demonNameTh: 'เลวีอาธาน',
    nameEn: 'Leviathan of Envy',
    roleTh: 'งูทะเลก๊อปอาวุธแรงสุดของผู้เล่น',
    color: '#10B981',
    lv1DescTh: 'ก๊อปอาวุธที่แรงที่สุดของผู้เล่นยิง 50% ดาเมจ เล็งมอนเลือดเยอะสุด',
    lv3DescTh: 'ก๊อป 2 อาวุธที่แรงสุด ยิงที่ 70% ดาเมจ!',
    gaugeSourceTh: 'มีมินิบอสหรือบอสอยู่บนจอ',
    drawbackTh: 'ไม่มีข้อเสีย',
  },
  wrath: {
    id: 'wrath',
    sinNameTh: 'โทสะ (Wrath)',
    demonNameTh: 'ซาตาน',
    nameEn: 'Satan of Wrath',
    roleTh: 'อสูรเขาแดงพุ่งทุบรอบตัว',
    color: '#EF4444',
    lv1DescTh: 'พุ่งทุบรอบตัว · ทุกครั้งที่ผู้เล่นโดนตีได้ "แค้น" (+8% ดาเมจ/ชั้น สูงสุด 10)',
    lv3DescTh: 'เมื่อแค้นเต็ม 10 ชั้นจะคลั่ง 5 วิ ทุบเป็นคลื่นช็อกขนาดใหญ่!',
    gaugeSourceTh: 'ดาเมจที่ผู้เล่นโดน',
    drawbackTh: 'ไม่มีข้อเสีย',
  },
  sloth: {
    id: 'sloth',
    sinNameTh: 'เกียจคร้าน (Sloth)',
    demonNameTh: 'เบลเฟกอร์',
    nameEn: 'Belphegor of Sloth',
    roleTh: 'ยักษ์หลับ เขตเวลาช้า',
    color: '#60A5FA',
    lv1DescTh: 'ตื่นเมื่อผู้เล่นยืนนิ่ง 1 วิ สร้างเขตเวลาช้า 40% รัศมี 260px + ทุบพื้นใหญ่',
    lv3DescTh: 'เขตเวลาช้าหยุดกระสุนศัตรูที่ลอยเข้ามาในวงทันที!',
    gaugeSourceTh: 'เวลาที่ผู้เล่นยืนนิ่ง',
    drawbackTh: 'ผู้เล่นเดินช้าลง -5%',
  },
  gluttony: {
    id: 'gluttony',
    sinNameTh: 'ตะกละ (Gluttony)',
    demonNameTh: 'เบลเซบับ',
    nameEn: 'Beelzebub of Gluttony',
    roleTh: 'ปากยักษ์กลืนมอนเลือดต่ำ',
    color: '#84CC16',
    lv1DescTh: 'กลืนมอนธรรมดาที่ HP <15% ทั้งตัวทุก 1.5 วิ พร้อมฮีลผู้เล่น (ผ่านโควต้า)',
    lv3DescTh: 'กลืนทีละสูงสุด 3 ตัว แล้วคายเป็นระเบิดหนอนพิษ!',
    gaugeSourceTh: 'จำนวนมอนที่ถูกกลืนกิน',
    drawbackTh: 'ฮีลจากแหล่งอื่นลดลง -20%',
  },
  lust: {
    id: 'lust',
    sinNameTh: 'ราคะ (Lust)',
    demonNameTh: 'แอสโมเดียส',
    nameEn: 'Asmodeus of Lust',
    roleTh: 'ปีศาจสาวปีกม่วง สะกดมอนตีกันเอง',
    color: '#EC4899',
    lv1DescTh: 'สะกดศัตรู 2 ตัวทุก 4 วิ ให้หันไปโจมตีพวกเดียวกันนาน 5 วิ',
    lv3DescTh: 'สะกด 4 ตัวพร้อมกัน และมอนที่ถูกสะกดตายจะระเบิดหัวใจ!',
    gaugeSourceTh: 'จำนวนมอนที่ถูกสะกด',
    drawbackTh: 'ไม่มีข้อเสีย',
  },
};

export function getClassesForRace(raceId: RaceId): RaceClassDef[] {
  return (Object.values(RACE_CLASSES) as RaceClassDef[]).filter(
    (c) => c.raceId === raceId && !c.hiddenFromLv20
  );
}

export const WEAPONS: Record<WeaponId, WeaponDef> = {
  banana: {
    id: 'banana',
    nameTh: 'กล้วยพิฆาต',
    evolvedNameTh: 'พายุกล้วยทองคำ',
    category: 'physical',
    damageType: 'physical',
    pairedRelic: 'devil_dice',
    descriptionTh: 'ปากล้วยบูมเมอแรงวนกลับมาฟาดซ้ำ และทิ้งเปลือกกล้วยลื่นพื้น',
    evolvedDescTh: 'กล้วยทองคำ 6 ลูกหมุนรอบตัว + ระเบิดแบ่งตัวเป็นกล้วยจิ๋ว 3 ลูกเมื่อสุดทาง',
    levelDescriptions: [
      'ปากล้วย 1 ลูกพุ่งออกไปและโค้งกลับมา',
      'ปล่อยกล้วย 2 ลูก โจมตีแรงขึ้น',
      'ปล่อยกล้วย 3 ลูก ทะลุศัตรูได้มากขึ้น',
      'ปล่อยกล้วย 4 ลูก หมุนวนวงกว้าง',
      'ปล่อยกล้วย 5 ลูก + ทิ้งเปลือกกล้วยบนพื้น ลื่นสตั๊น 0.8 วิ',
    ],
    color: '#FACC15',
    evolvedColor: '#F59E0B',
  },
  axe: {
    id: 'axe',
    nameTh: 'ขวานเหวี่ยงศึก',
    evolvedNameTh: 'ขวานสังหารหมุนวน',
    category: 'physical',
    damageType: 'physical',
    pairedRelic: 'spinach',
    descriptionTh: 'เหวี่ยงขวานหนักทะลวงฝูงศัตรูพร้อมแรงผลักสูง',
    evolvedDescTh: 'ขวานโลหิตยักษ์ 360° กลับไปวนซ้ำในจุดเดิม +50% ช่วงเวลา',
    levelDescriptions: [
      'ขว้างขวานยักษ์ 1 เล่มทะลุศัตรูเป็นแนวโค้ง',
      'ขว้างขวาน 2 เล่มพร้อมกัน',
      'เพิ่มขนาดขวาน +25% และทะลุศัตรูเพิ่ม',
      'ขว้างขวาน 3 เล่มรอบทิศ',
      'ขว้างขวาน 4 เล่ม + คลั่งโลหิต: ฆ่าด้วยขวานสะสมความไวสูงสุด +25%',
    ],
    color: '#FB7185',
    evolvedColor: '#E11D48',
  },
  dagger: {
    id: 'dagger',
    nameTh: 'มีดสั้นเงา',
    evolvedNameTh: 'พายุมีดพันเล่ม',
    category: 'physical',
    damageType: 'physical',
    pairedRelic: 'lost_compass',
    descriptionTh: 'ซัดมีดความเร็วสูงไปยังศัตรูหรือทิศทางที่เดิน',
    evolvedDescTh: 'ปามีดเงา 5 เล่มเป็นพัด + มีดปักพื้นจะพุ่งกลับพร้อมกันทุก 4 วิ',
    levelDescriptions: [
      'ซัดมีดเร็ว 2 เล่มใส่เป้าหมายใกล้สุด',
      'ซัดมีด 3 เล่ม คูลดาวน์ไวขึ้น',
      'มีดพุ่งทะลุศัตรู +1 ตัว',
      'ซัดมีด 4 เล่มพร้อมกัน',
      'ซัดมีด 5 เล่ม + ปักมีดในพื้น 3 วิ ชนแล้วติดเลือดออก (Bleed)',
    ],
    color: '#94A3B8',
    evolvedColor: '#E2E8F0',
  },
  katana: {
    id: 'katana',
    nameTh: 'ดาบคาตานะสายลม',
    evolvedNameTh: 'เพลงดาบผ่ามิติ',
    category: 'physical',
    damageType: 'physical',
    pairedRelic: 'soul_bell',
    descriptionTh: 'ฟันคลื่นดาบเสี้ยวพระจันทร์ทะลวงฝูงศัตรู',
    evolvedDescTh: 'คลื่นดาบผ่ามิติคู่ + กรีดรอยแยกมิติคงอยู่ 1.5 วิ ตัดดาเมจต่อเนื่อง',
    levelDescriptions: [
      'ฟันคลื่นดาบ 1 ทิศทางตามหน้าตัวละคร',
      'ฟันคลื่นดาบหน้า-หลัง 2 ทิศทาง',
      'ขยายความกว้างคลื่นดาบ +25%',
      'ฟันคลื่นดาบ 3 ทิศทาง ลดคูลดาวน์',
      'ฟันคลื่นดาบ 4 ทิศทาง + ทุกครั้งที่ 4 ผ่าเส้นมิติรุนแรง (+50%) และติดเป้า',
    ],
    color: '#E2E8F0',
    evolvedColor: '#F43F5E',
  },
  spear: {
    id: 'spear',
    nameTh: 'หอกทลายทัพ',
    evolvedNameTh: 'หอกมังกรทะลวงฟ้า',
    category: 'physical',
    damageType: 'physical',
    pairedRelic: 'boots',
    descriptionTh: 'พุ่งหอกความเร็วสูงทะลุศัตรูเป็นเส้นตรงยาว',
    evolvedDescTh: 'หอกมังกรทองคู่ + คลื่นลมดูดศัตรูข้างทางเข้าสู่แนวหอก 25px',
    levelDescriptions: [
      'พุ่งหอก 1 เล่มทะลุศัตรู 4 ตัว',
      'พุ่งหอก 2 เล่มคู่ขนาน',
      'เพิ่มระยะและพลังทะลุทะลวง',
      'พุ่งหอก 3 เล่มเป็นแนวพัด',
      'พุ่งหอก 4 เล่ม + ทะลุเกิน 3 ตัวในนัดเดียว ระเบิดสายฟ้าปลายทาง',
    ],
    color: '#FCD34D',
    evolvedColor: '#F59E0B',
  },
  wand: {
    id: 'wand',
    nameTh: 'คทาเวทย์มิสไซล์',
    evolvedNameTh: 'มหาเวทย์ดารา',
    category: 'magic',
    damageType: 'magic',
    pairedRelic: 'echo_crystal',
    descriptionTh: 'ยิงลูกแก้วเวทย์ติดตามเป้าหมายใกล้ตัวอัตโนมัติ',
    evolvedDescTh: 'ยิงลำแสงดารานำวิถีต่อเนื่อง + ยิงคลื่นพลังช็อกทะลวงศัตรู',
    levelDescriptions: [
      'ยิงกระสุนเวทย์นำวิถี 1 นัด',
      'ยิงกระสุนเวทย์ 2 นัด',
      'คูลดาวน์เร็วขึ้น +20%',
      'ยิงกระสุนเวทย์ 3 นัด ดาเมจแรงขึ้น',
      'ยิงกระสุนเวทย์ 4 นัด + เมื่อฆ่าศัตรู แตกเป็นลูกเล็กติดตาม 2 นัด',
    ],
    color: '#38BDF8',
    evolvedColor: '#7DD3FC',
  },
  lightning: {
    id: 'lightning',
    nameTh: 'วงแหวนสายฟ้า',
    evolvedNameTh: 'ทัณฑ์สายฟ้าสวรรค์',
    category: 'magic',
    damageType: 'elemental',
    pairedRelic: 'storm_eye',
    descriptionTh: 'ฟาดสายฟ้าผ่าลงกลางกลุ่มศัตรูพร้อมสถานะ Shock',
    evolvedDescTh: 'ฟ้าผ่า 8 จุดถี่ยิบ + ทิ้งเขตสนามไฟฟ้า 2 วิ ช็อตและสตั๊นซ้ำ',
    levelDescriptions: [
      'สายฟ้าฟาด 2 จุด รัศมีวงกว้าง',
      'สายฟ้าฟาด 3 จุด',
      'เพิ่มพื้นที่ระเบิดสายฟ้า +25%',
      'สายฟ้าฟาด 4 จุด คูลดาวน์ลดลง',
      'สายฟ้าฟาด 6 จุด + เตือนจุดตก 0.4 วิ ก่อนชิ่งเข้าเป้าใกล้เคียง 2 ตัว (Shock)',
    ],
    color: '#A78BFA',
    evolvedColor: '#C4B5FD',
  },
  fireorb: {
    id: 'fireorb',
    nameTh: 'ลูกแก้วเพลิงหมุน',
    evolvedNameTh: 'สุริยคราสมรณะ',
    category: 'magic',
    damageType: 'elemental',
    pairedRelic: 'spirit_lantern',
    descriptionTh: 'ลูกแก้วไฟหมุนโคจรรอบตัวเผาผลาญและติดไฟ Burn',
    evolvedDescTh: 'ดวงอาทิตย์ 6 ดวงหมุนวน + พ่นหัวกะโหลกเพลิงไล่ล่าศัตรูทุก 1 วิ',
    levelDescriptions: [
      'ลูกแก้วไฟ 2 ดวงโคจรรอบตัว',
      'ลูกแก้วไฟ 3 ดวง หมุนเร็วขึ้น',
      'เพิ่มขนาดและระยะโคจร',
      'ลูกแก้วไฟ 4 ดวง ดาเมจแรงขึ้น',
      'ลูกแก้วไฟ 5 ดวง + พ่นลูกไฟขนาดเล็ก 1 นัดทุก 1.5 วิ (ติด Burn)',
    ],
    color: '#FB923C',
    evolvedColor: '#F97316',
  },
  frostnova: {
    id: 'frostnova',
    nameTh: 'วงแหวนเหมันต์',
    evolvedNameTh: 'พายุหิมะเยือกแข็ง',
    category: 'magic',
    damageType: 'elemental',
    pairedRelic: 'stardust_powder',
    descriptionTh: 'ระเบิดคลื่นน้ำแข็งรอบตัวและสาดเกล็ดหิมะติดสถานะ Frozen',
    evolvedDescTh: 'พายุหิมะศูนย์องศาสัมบูรณ์ + แช่แข็งสมบูรณ์ทันทีในวง 1.2 วิ + เกล็ด 10 ทิศ',
    levelDescriptions: [
      'ปล่อยคลื่นน้ำแข็งแช่แข็งศัตรูรอบตัว',
      'เพิ่มเกล็ดน้ำแข็ง 4 ทิศทาง',
      'ขยายรัศมีแช่แข็งและเวลาสโลว์',
      'ปล่อยเกล็ดน้ำแข็ง 6 ทิศทาง',
      'คลื่นน้ำแข็ง + เกล็ด 8 ทิศ + ศัตรูติดแข็งตายจะแตกระเบิดเกล็ดน้ำแข็งซ้ำ',
    ],
    color: '#67E8F9',
    evolvedColor: '#22D3EE',
  },
  meteor: {
    id: 'meteor',
    nameTh: 'อุกกาบาตเพลิง',
    evolvedNameTh: 'ฝนดาวตกวันสิ้นโลก',
    category: 'magic',
    damageType: 'elemental',
    pairedRelic: 'spirit_lantern',
    descriptionTh: 'เตือนจุดตกก่อนเรียกอุกกาบาตถล่มและเผาไหม้ Burn',
    evolvedDescTh: 'ฝนดาวตกถล่มต่อเนื่อง + เปิดบ่อลาวา 5 วิ ที่ทิ้งไฟ Burn ทุกวินาที',
    levelDescriptions: [
      'เรียกอุกกาบาต 1 ลูกถล่มกลุ่มศัตรู',
      'เรียกอุกกาบาต 2 ลูกพร้อมกัน',
      'ขยายรัศมีระเบิด +30%',
      'เรียกอุกกาบาต 3 ลูก คูลดาวน์ไวขึ้น',
      'เรียกอุกกาบาต 4 ลูก + เตือนจุดตก 0.7 วิ แล้วทิ้งบ่อลาวา 3 วิ',
    ],
    color: '#F97316',
    evolvedColor: '#EF4444',
  },
  laser: {
    id: 'laser',
    nameTh: 'ลำแสงปิ๊งป๊อง',
    evolvedNameTh: 'ลำแสงสายรุ้งดับจักรวาล',
    category: 'magic',
    damageType: 'magic',
    pairedRelic: 'cracked_mirror',
    descriptionTh: 'ยิงลำแสงเลเซอร์ยาวทะลุทั้งหน้าจอ',
    evolvedDescTh: 'เลเซอร์สายรุ้ง 4 ทิศ + กวาดหมุนรอบตัว 180° ช่วง 0.6 วิ ท้ายลำแสง',
    levelDescriptions: [
      'ยิงลำแสงเลเซอร์ 1 เส้นตรงไปยังเป้าหมายใกล้สุด',
      'ยิงลำแสงเลเซอร์ 2 เส้นหน้า-หลัง',
      'เพิ่มความกว้างลำแสง +35%',
      'ยิงลำแสงเลเซอร์ 3 ทิศทาง ลดคูลดาวน์',
      'ยิงลำแสงเลเซอร์ 4 ทิศ + จบด้วยแสงหักเห 3 ทิศทาง 45°',
    ],
    color: '#EC4899',
    evolvedColor: '#22D3EE',
  },
  cat: {
    id: 'cat',
    nameTh: 'ปล่อยแมวข่วนคลั่ง',
    evolvedNameTh: 'จักรพรรดิแมวส้มพิฆาต',
    category: 'physical',
    damageType: 'physical',
    pairedRelic: 'stride_blades',
    descriptionTh: 'ปล่อยฝูงแมวเหมียวพุ่งไล่ข่วนศัตรูติดเลือดออก',
    evolvedDescTh: 'จักรพรรดิแมวส้ม 4 ตัวคลุ้มคลั่ง + ปาปลากระป๋องระเบิดพื้นที่',
    levelDescriptions: [
      'ปล่อยแมวคลั่ง 1 ตัววิ่งพุ่งไล่ข่วนศัตรู',
      'ปล่อยแมวคลั่ง 2 ตัวพร้อมกัน',
      'แมววิ่งไวขึ้นและข่วนทะลุศัตรูเพิ่ม',
      'ปล่อยแมวคลั่ง 3 ตัว ลดคูลดาวน์',
      'ปล่อยแมวคลั่ง 3 ตัว + มีโอกาส 8% ดรอปเนื้อ/เหรียญ (จำกัดทุก 10 วิ)',
    ],
    color: '#FB923C',
    evolvedColor: '#F59E0B',
  },
  bird: {
    id: 'bird',
    nameTh: 'พานกมาจิก',
    evolvedNameTh: 'ฝูงพญานกกระจิบมหากาฬ',
    category: 'physical',
    damageType: 'physical',
    pairedRelic: 'echo_crystal',
    descriptionTh: 'เรียกนกจอมซนบินโฉบจิกศัตรูใกล้ตัวด้วยความเร็วสูง',
    evolvedDescTh: 'พญานกทอง 4 ตัวจิกไว + ดำดิ่งจากฟ้า 1 จุดทุก 3 วิ สร้างช็อกเวฟรอบวง',
    levelDescriptions: [
      'เรียกนก 1 ตัวบินโฉบจิกศัตรูใกล้สุด',
      'เรียกนก 1 ตัวจิกแรงและไวขึ้น',
      'เรียกนก 2 ตัวบินโฉบพร้อมกัน',
      'เรียกนก 2 ตัวทะลุศัตรูเพิ่ม +1',
      'เรียกนก 3 ตัว + แปะเป้า Mark (จิกโดนศัตรูมี Mark ปลดล็อกโบนัสคริ 100%)',
    ],
    color: '#38BDF8',
    evolvedColor: '#FACC15',
  },
  watergun: {
    id: 'watergun',
    nameTh: 'ปืนฉีดน้ำสงกรานต์',
    evolvedNameTh: 'รถดับเพลิงฉีดน้ำแรงดันสูง',
    category: 'tank',
    damageType: 'elemental',
    pairedRelic: 'jester_mask',
    descriptionTh: 'ยิงกระสุนน้ำผลักมอนสเตอร์และติดสถานะ Wet',
    evolvedDescTh: 'กระแสน้ำ 4 สายดันหลังแรงมาก + พื้นเปียกคงอยู่ 5 วิ สะดุดและทำช็อตแรงขึ้น',
    levelDescriptions: [
      'ฉีดกระสุนน้ำ 1 นัด ผลักและทำให้ศัตรูเปียก',
      'ฉีดกระสุนน้ำ 1 นัด ขนาดใหญ่ขึ้น',
      'ฉีดกระสุนน้ำ 2 นัดต่อเนื่อง',
      'ฉีดกระสุนน้ำ 2 นัด ลดคูลดาวน์',
      'ฉีดกระสุนน้ำ 3 นัด + ทิ้งบ่อน้ำ 3 วิ เผยสถานะ Wet ต่อเนื่อง',
    ],
    color: '#0EA5E9',
    evolvedColor: '#38BDF8',
  },
  shield: {
    id: 'shield',
    nameTh: 'โล่หนามสะท้อน',
    evolvedNameTh: 'ปราการเหล็กอมตะ',
    category: 'tank',
    damageType: 'physical',
    pairedRelic: 'armor_plate',
    descriptionTh: 'โล่หมุนรอบตัว กระแทกศัตรูและทำลายกระสุนศัตรูได้',
    evolvedDescTh: 'ปราการโล่ 6 บาน + สะท้อนกระสุนกลับใส่ศัตรูเป็นกระสุนวิญญาณ',
    levelDescriptions: [
      'โล่เหล็ก 2 บานโคจรรอบตัว ป้องกันกระสุน',
      'โล่เหล็ก 3 บาน แรงผลักเพิ่มขึ้น',
      'ขยายขนาดโล่ ป้องกันกระสุนได้กว้างขึ้น',
      'โล่เหล็ก 4 บาน หมุนไวขึ้น',
      'โล่เหล็ก 5 บาน + บล็อกกระสุน 3 นัด ปล่อยช็อกเวฟผลักรอบตัว 130px',
    ],
    color: '#34D399',
    evolvedColor: '#10B981',
  },
  garlic: {
    id: 'garlic',
    nameTh: 'ออร่ากระเทียมศักดิ์สิทธิ์',
    evolvedNameTh: 'อาณาเขตดูดวิญญาณ',
    category: 'tank',
    damageType: 'elemental',
    pairedRelic: 'black_ruby_heart',
    descriptionTh: 'คลื่นพลังรอบตัวตลอดเวลา ลดความเร็วและผลักศัตรูออกไป',
    evolvedDescTh: 'อาณาเขตสีเลือด-ทอง + ระเบิดคลื่นดูด HP ศัตรูทุก 4 วิ ผ่านระบบดูดเลือด',
    levelDescriptions: [
      'สร้างออร่าความเสียหายรอบตัวสม่ำเสมอ',
      'ขยายรัศมีออร่า +20%',
      'ความเสียหายและความถี่การกระแทกเพิ่มขึ้น',
      'ขยายรัศมีออร่า +35% และผลักแรงขึ้น',
      'ออร่าทรงพลัง + ทิ้งรอยเท้าศักดิ์สิทธิ์ 2 วิ ฮีล +1 HP ต่อตัวที่ตายในวง',
    ],
    color: '#E2E8F0',
    evolvedColor: '#F43F5E',
  },
  mace: {
    id: 'mace',
    nameTh: 'ค้อนกระแทกปฐพี',
    evolvedNameTh: 'แผ่นดินไหวพิโรธ',
    category: 'tank',
    damageType: 'physical',
    pairedRelic: 'armor_plate',
    descriptionTh: 'ทุบพื้นปล่อยคลื่นกระแทกวงกว้าง แรงขึ้นตามค่าเกราะ',
    evolvedDescTh: 'แยกแผ่นดินแนวตรง 250px ค้าง 2 วิ สะสมสตั๊นซ้ำทุกวินาที',
    levelDescriptions: [
      'ทุบพื้นปล่อยคลื่นกระแทก 1 ทิศทาง',
      'คลื่นกระแทก 2 ทิศทางหน้า-หลัง',
      'เพิ่มขนาดคลื่นและสตั๊นศัตรูชั่วขณะ',
      'คลื่นกระแทกวงกลมรอบตัว',
      'คลื่นกระแทกมหึมา + สะสมสตั๊น (35% ของ MaxHP ใน 2 วิ แตกสตั๊น 1.2 วิ)',
    ],
    color: '#D97706',
    evolvedColor: '#FBBF24',
  },
  chain: {
    id: 'chain',
    nameTh: 'โซ่เหล็กหนามฟาด',
    evolvedNameTh: 'โซ่ตรวนอเวจี',
    category: 'tank',
    damageType: 'physical',
    pairedRelic: 'cursed_shackles',
    descriptionTh: 'เหวี่ยงลูกตุ้มหนามหมุนฟาดรอบตัว กระแทกและติดเลือดออก',
    evolvedDescTh: 'โซ่เพลิงโลกันตร์ 3 เส้นหมุนแรง + ลากศัตรูมารวมและฟาดเผาไหม้',
    levelDescriptions: [
      'เหวี่ยงลูกตุ้มโซ่ฟาด 1 เส้นรอบตัว',
      'เพิ่มความยาวโซ่และขนาดลูกตุ้ม',
      'เหวี่ยงโซ่ 2 เส้นซ้าย-ขวา',
      'ลดคูลดาวน์และเพิ่มแรงกระแทก',
      'เหวี่ยงโซ่ 3 เส้น + ทุก 5 วิ ฟาดกระชากศัตรูมารวมกันในระยะ 150px',
    ],
    color: '#94A3B8',
    evolvedColor: '#FB7185',
  },
  totem: {
    id: 'totem',
    nameTh: 'เสาโทเท็มศักดิ์สิทธิ์',
    evolvedNameTh: 'มหาปราสาทศิลา',
    category: 'tank',
    damageType: 'magic',
    pairedRelic: 'chronos',
    descriptionTh: 'ปักเสาโทเท็มลงพื้นเพื่อยิงคลื่นแสงและฟื้นฟูเขตคุ้มกัน',
    evolvedDescTh: 'ปัก 3 เสาเชื่อมเป็นสามเหลี่ยมเขตคุ้มกัน ลบกระสุนศัตรู + ฟื้นเลือด 1% HP/วิ',
    levelDescriptions: [
      'ปักเสาโทเท็ม 1 ต้นยิงคลื่นพลังรอบตัว',
      'เพิ่มความถี่การปล่อยคลื่นจากเสา',
      'ปักเสาโทเท็มได้สูงสุด 2 ต้นพร้อมกัน',
      'ขยายรัศมีคลื่นเสา +30%',
      'ปักเสา 3 ต้น + เชื่อมรั้วแสงระหว่างเสา สโลว์ 50% และกันกระสุนศัตรู',
    ],
    color: '#FDE047',
    evolvedColor: '#F59E0B',
  },
};

export const RELICS: Record<RelicId, RelicDef> = {
  spinach: {
    id: 'spinach',
    nameTh: 'ศิลาพลังทำลาย',
    descriptionTh: 'เพิ่มดาเมจทั้งหมด +15% ต่อเลเวล (ผสานกับ ขวานเหวี่ยงศึก)',
    color: '#EF4444',
    maxLevel: 3,
    effectPerLevel: '+15% ดาเมจทั้งหมด',
  },
  boots: {
    id: 'boots',
    nameTh: 'รองเท้าสายลม',
    descriptionTh: 'เพิ่มความเร็ววิ่ง +12% และความเร็วกระสุน (ผสานกับ หอกทลายทัพ)',
    color: '#38BDF8',
    maxLevel: 3,
    effectPerLevel: '+12% ความเร็วเคลื่อนที่',
  },
  armor_plate: {
    id: 'armor_plate',
    nameTh: 'เกราะเหล็กกล้า',
    descriptionTh: 'เพิ่มเกราะ +2 และ Max HP +25 ต่อเลเวล (ผสานกับ โล่หนาม / ค้อนปฐพี)',
    color: '#10B981',
    maxLevel: 3,
    effectPerLevel: '+2 เกราะ · +25 Max HP',
  },
  chronos: {
    id: 'chronos',
    nameTh: 'นาฬิกาทรายนิรันดร์',
    descriptionTh: 'ลดคูลดาวน์อาวุธ -10% และขยายพื้นที่สกิล +12% (ผสานกับ เสาโทเท็ม)',
    color: '#A78BFA',
    maxLevel: 3,
    effectPerLevel: '-10% คูลดาวน์ · +12% พื้นที่',
  },
  echo_crystal: {
    id: 'echo_crystal',
    nameTh: 'คริสตัลสะท้อน',
    descriptionTh: 'อาวุธมีโอกาสยิงซ้ำ 20%/30%/40% ด้วยความแรง 60% (ผสานกับ คทาเวทย์ / พานกมาจิก)',
    color: '#38BDF8',
    maxLevel: 3,
    effectPerLevel: 'โอกาสยิงซ้ำ +20%/30%/40%',
  },
  black_ruby_heart: {
    id: 'black_ruby_heart',
    nameTh: 'หัวใจทับทิมดำ',
    descriptionTh: 'Overheal แปลงเป็นโล่ชั่วคราว (25%/35%/50% Max HP) (ผสานกับ กระเทียม)',
    color: '#E11D48',
    maxLevel: 3,
    effectPerLevel: 'Overheal -> โล่สูงสุด 25%/35%/50%',
  },
  soul_bell: {
    id: 'soul_bell',
    nameTh: 'ระฆังวิญญาณ',
    descriptionTh: 'สังหาร 30/25/20 ตัว ลั่นระฆังกระแทก 140px + รีเจน HP (ผสานกับ คาตานะ)',
    color: '#C084FC',
    maxLevel: 3,
    effectPerLevel: 'ลั่นระฆังทุก 30/25/20 คิล',
  },
  lost_compass: {
    id: 'lost_compass',
    nameTh: 'เข็มทิศหลงทาง',
    descriptionTh: 'กระสุนที่พลาดจะเด้งกลับทิศตรงข้ามได้ 1/1/2 ครั้ง (ผสานกับ มีดสั้นเงา)',
    color: '#FBBF24',
    maxLevel: 3,
    effectPerLevel: 'เด้งกลับ 1/1/2 ครั้ง (Lv2-3 +10% ดาเมจ)',
  },
  stride_blades: {
    id: 'stride_blades',
    nameTh: 'มีดโกนรองเท้า',
    descriptionTh: 'ขณะเคลื่อนที่ สร้างคลื่นใบมีดรอบขาทุก 0.45 วิ (ผสานกับ แมวข่วนคลั่ง)',
    color: '#FB923C',
    maxLevel: 3,
    effectPerLevel: 'รัศมี 65/80/95px + ติดเลือดออก',
  },
  storm_eye: {
    id: 'storm_eye',
    nameTh: 'ตาพายุ',
    descriptionTh: 'เพิ่มโอกาสติดสายฟ้าซ้ำและดาเมจสายฟ้า/Shock +18%/+28%/+40% (ผสานกับ สายฟ้า)',
    color: '#818CF8',
    maxLevel: 3,
    effectPerLevel: '+18%/28%/40% พลังสายฟ้า',
  },
  cracked_mirror: {
    id: 'cracked_mirror',
    nameTh: 'กระจกแตก',
    descriptionTh: 'ทุก 80/60/45 ดาเมจที่ทำได้ ยิงแสงสะท้อนเข้าศัตรูใกล้ตัว (ผสานกับ เลเซอร์)',
    color: '#F472B6',
    maxLevel: 3,
    effectPerLevel: 'ยิงแสงสะท้อนเร็วขึ้นตามเลเวล',
  },
  spirit_lantern: {
    id: 'spirit_lantern',
    nameTh: 'โคมไฟวิญญาณ',
    descriptionTh: 'ความเสียหายธาตุไฟ/Burn แรงขึ้น +20%/+32%/+45% (ผสานกับ ลูกแก้วไฟ / อุกกาบาต)',
    color: '#F97316',
    maxLevel: 3,
    effectPerLevel: '+20%/32%/45% พลัง Burn',
  },
  jester_mask: {
    id: 'jester_mask',
    nameTh: 'หน้ากากตัวตลก',
    descriptionTh: 'โจมตีมีโอกาส 5%/8%/12% ทำให้ศัตรูสับสนไล่ตีพวกเดียวกัน 2 วิ (ผสานกับ ปืนฉีดน้ำ)',
    color: '#A855F7',
    maxLevel: 3,
    effectPerLevel: '5%/8%/12% โอกาสสับสน',
  },
  stardust_powder: {
    id: 'stardust_powder',
    nameTh: 'ผงดาวตก',
    descriptionTh: 'เก็บ XP 30/22/15 เม็ด ตกเศษดาวระเบิด + ดาเมจน้ำแข็งแรงขึ้น (ผสานกับ วงแหวนเหมันต์)',
    color: '#67E8F9',
    maxLevel: 3,
    effectPerLevel: 'ดาวตกทุก 30/22/15 XP',
  },
  devil_dice: {
    id: 'devil_dice',
    nameTh: 'ลูกเต๋าปีศาจ',
    descriptionTh: 'สุ่ม +15%/25%/35% ค่าสถานะ 1 อย่างเมื่อเก็บ (Lv3 กดทอยใหม่ได้ทุก 60 วิ) (ผสานกับ กล้วย)',
    color: '#DC2626',
    maxLevel: 3,
    effectPerLevel: 'บัพสุ่ม +15%/25%/35%',
  },
  cursed_shackles: {
    id: 'cursed_shackles',
    nameTh: 'โซ่ตรวนต้องคำสาป',
    descriptionTh: 'สปีด -8% เป็นเวลา 3 นาที แล้วปลดปีก -20% คูลดาวน์แดช & +25% วิ่ง! (ผสานกับ โซ่เหล็ก)',
    color: '#94A3B8',
    maxLevel: 3,
    effectPerLevel: 'ดีบัพ 180s -> ปีกปลดปล่อย',
  },
};

// =====================================================================
// BALANCE — ค่าปรับสมดุลทั้งหมดรวมไว้ที่เดียว แก้ตัวเลขตรงนี้เพื่อจูนเกม
// =====================================================================
export const BALANCE = {
  // --- พลังผู้เล่น ---
  // โบนัสดาเมจ % (ถาวร, ศิลาพลัง, เพิร์คธาตุ, อาร์ติแฟกต์, สภาพอากาศ ฯลฯ) จะ "บวกกัน" ในกลุ่มเดียว
  // แล้วผ่าน diminishing returns: ค่าจริง = X * K / (X + K)  (ยิ่งสะสมยิ่งได้ผลน้อยลง)
  dmgIncreaseSoftCapK: 8.0, // สะสม +100% -> ได้จริง +89%, สะสม +300% -> ได้จริง +218% (ค่ายิ่งน้อยยิ่งกดแรง)
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
  enemyBulletSpeedMult: 0.85, // ความเร็วกระสุนศัตรูลดลง 15% เพื่อหลบง่ายขึ้น
  realmMinuteCarry: 30, // หลังฆ่ายมทูต มอนนับนาทีต่อจากเดิม (ไม่รีเซ็ตกลับไปอ่อน)
  realmHpMultPerTier: 1.2, // ตัวคูณ HP เพิ่มต่อ realm (เดิม 1.95 แต่ตอนนี้นาทีต่อเนื่องแล้ว)

  // --- บอส ---
  bossMaxHpPctPerSec: 0.03, // บอสรับดาเมจได้ไม่เกิน 3% maxHP ต่อวินาที (อยู่อย่างน้อย ~33 วิ)
  reaperMaxHpPctPerSec: 0.008, // ยมทูตรับได้ไม่เกิน 0.8%/วิ (อยู่อย่างน้อย ~2 นาที)

  // --- Combo ---
  comboMilestones: [50, 100, 250, 500, 1000, 2500, 5000, 10000],

  // --- ฮีล / ดูดเลือด ---
  leechBudgetPctPerSec: 0.025, // ฮีลจากดูดเลือด/การฆ่า รวมทุกแหล่งไม่เกิน 2.5% ของ Max HP ต่อวินาที
  woundedHealMult: 0.5, // หลังโดนตี ฮีลจากดูดเลือดลดลง 50%
  woundedDuration: 2.0, // นาน 2 วินาที

  // --- Debug ---
  logBalanceEveryMinute: true, // พิมพ์ DPS ผู้เล่น / HP มอน ใน console ทุกนาที (F12)
};

export const STAGES: Record<StageId, StageDef> = {
  cursed_forest: {
    id: 'cursed_forest',
    nameTh: 'ป่าต้องสาป',
    subtitleTh: 'ด่านเริ่มต้น · กลางวัน-กลางคืนสลับทุก 45 วินาที',
    unlockCost: 0,
    goldMult: 1.0,
    xpMult: 1.0,
    enemyHpMult: 1.0,
    enemyDmgMult: 1.0,
    enemyBulletSpeedMult: 1.0,
    floorPrimary: '#0D131A',
    floorSecondary: '#141D26',
    accentHex: '#22C55E',
  },
  bloodmoon_crypt: {
    id: 'bloodmoon_crypt',
    nameTh: 'สุสานจันทร์สีเลือด',
    subtitleTh: 'ศัตรูอึด +80% · ตีแรง +40% · ทอง & EXP +60%',
    unlockCost: 600,
    goldMult: 1.6,
    xpMult: 1.6,
    enemyHpMult: 1.8,
    enemyDmgMult: 1.4,
    enemyBulletSpeedMult: 1.08,
    floorPrimary: '#140D14',
    floorSecondary: '#1F131F',
    accentHex: '#E11D48',
  },
  reaper_citadel: {
    id: 'reaper_citadel',
    nameTh: 'หอคอยยมทูต',
    subtitleTh: 'สมรภูมินรก ศัตรูอึด +200% · ตีแรง +100% · ทอง & EXP +140%',
    unlockCost: 1600,
    goldMult: 2.4,
    xpMult: 2.4,
    enemyHpMult: 3.0,
    enemyDmgMult: 2.0,
    enemyBulletSpeedMult: 1.15,
    floorPrimary: '#0E1017',
    floorSecondary: '#181C28',
    accentHex: '#F59E0B',
  },
};

export {
  TRAINING_UPGRADES as META_UPGRADES,
  getTrainingUpgradeCost as getMetaUpgradeCost,
} from './metaData';

export const BOSS_BUFFS: Record<BossBuffId, BossBuffDef> = {
  frenzy: {
    id: 'frenzy',
    nameTh: 'คลั่งความเร็ว',
    descriptionTh: 'เคลื่อนที่ไวขึ้น +30% และร่ายกระสุนถี่ขึ้น',
    color: '#38BDF8',
  },
  iron_skin: {
    id: 'iron_skin',
    nameTh: 'เกราะเหล็กกล้า',
    descriptionTh: 'ลดดาเมจที่ได้รับ +18% และปล่อยคลื่นกระแทกรอบตัว',
    color: '#94A3B8',
  },
  barrage: {
    id: 'barrage',
    nameTh: 'พายุกระสุนนรก',
    descriptionTh: 'ระดมยิงกระสุนเวทย์แบบเกลียวคู่จำนวนมาก',
    color: '#F43F5E',
  },
  vampiric: {
    id: 'vampiric',
    nameTh: 'ดูดวิญญาณ',
    descriptionTh: 'ฟื้นฟู HP ต่อเนื่องทุก 2 วินาทีระหว่างต่อสู้',
    color: '#FB7185',
  },
  berserk: {
    id: 'berserk',
    nameTh: 'เดือดคลั่งเลือดต่ำ',
    descriptionTh: 'เมื่อ HP ต่ำกว่า 50% จะเร่งความเร็วและดาเมจมหาศาล',
    color: '#F97316',
  },
  summoner: {
    id: 'summoner',
    nameTh: 'อัญเชิญบริวาร',
    descriptionTh: 'เรียกกองทัพมอนสเตอร์ชั้นสูงออกมาช่วยรุมล้อม',
    color: '#A855F7',
  },
  blinker: {
    id: 'blinker',
    nameTh: 'วาร์ปจู่โจม',
    descriptionTh: 'เทเลพอร์ตดักหน้าผู้เล่นพร้อมซัดกระสุนดักทาง',
    color: '#22D3EE',
  },
};

const ALL_BOSS_BUFF_IDS: BossBuffId[] = [
  'frenzy',
  'barrage',
  'iron_skin',
  'berserk',
  'vampiric',
  'summoner',
  'blinker',
];

export function pickBossBuffs(
  realmMinute: number,
  realmTier: number,
  isMajor: boolean,
  isReaper: boolean
): BossBuffId[] {
  let count = 0;
  if (isReaper) {
    count = Math.min(ALL_BOSS_BUFF_IDS.length, 3 + realmTier);
  } else if (isMajor) {
    count = Math.min(ALL_BOSS_BUFF_IDS.length, 1 + Math.floor(realmMinute / 10) + realmTier);
  } else {
    count = Math.min(4, (realmMinute >= 6 ? 1 : 0) + realmTier);
  }
  if (count <= 0) return [];
  const shuffled = [...ALL_BOSS_BUFF_IDS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

export const ENDLESS_BIOMES: BiomeDef[] = [
  {
    id: 'verdant_wilds',
    nameTh: 'ป่าพฤกษาโบราณ',
    subtitleTh: 'พนาต้องมนต์ลึก — ศัตรูคลั่งและฝูงบุปผามรณะหนาแน่นขึ้น',
    floorPrimary: '#081812',
    floorSecondary: '#0E261C',
    accentHex: '#10B981',
    themeStyle: 'forest',
  },
  {
    id: 'abyssal_sea',
    nameTh: 'มหาสมุทรคลั่ง',
    subtitleTh: 'ทะเลลึกไร้ก้น — กระแสน้ำวนและอสูรใต้บาดาลบุกกระหน่ำ',
    floorPrimary: '#071426',
    floorSecondary: '#0C213B',
    accentHex: '#0EA5E9',
    themeStyle: 'sea',
  },
  {
    id: 'inferno_caldera',
    nameTh: 'ภูเขาไฟโลกันตร์',
    subtitleTh: 'ปากปล่องลาวา — อสูรศิลาเดือดและฝนกระสุนเพลิง',
    floorPrimary: '#1A0B0A',
    floorSecondary: '#29120F',
    accentHex: '#F97316',
    themeStyle: 'volcano',
  },
  {
    id: 'blood_sanctum',
    nameTh: 'วิหารจันทราเลือด',
    subtitleTh: 'โบราณสถานต้องสาป — แท่นบูชาและเงารัตติกาล',
    floorPrimary: '#160B18',
    floorSecondary: '#241227',
    accentHex: '#E11D48',
    themeStyle: 'crypt',
  },
  {
    id: 'eclipse_void',
    nameTh: 'มิติสุริยคราสอนันต์',
    subtitleTh: 'ขอบจักรวาลมืด — บอสทุกตนวิวัฒนาการเต็มพิกัด',
    floorPrimary: '#0F091F',
    floorSecondary: '#191033',
    accentHex: '#A855F7',
    themeStyle: 'void',
  },
];

export interface ActiveBiomeInfo extends BiomeDef {
  hpMult: number;
  speedMult: number;
  rewardMult: number;
  labelTh: string;
}

export function getActiveBiome(
  stageId: StageId,
  realmTier: number,
  biomeShiftCount = 0
): ActiveBiomeInfo {
  const st = STAGES[stageId];
  if (realmTier <= 0 && biomeShiftCount <= 0) {
    const themeStyle: BiomeDef['themeStyle'] =
      stageId === 'cursed_forest' ? 'forest' : stageId === 'bloodmoon_crypt' ? 'crypt' : 'void';
    return {
      id: 'stage_default',
      nameTh: st.nameTh,
      subtitleTh: st.subtitleTh,
      floorPrimary: st.floorPrimary,
      floorSecondary: st.floorSecondary,
      accentHex: st.accentHex,
      themeStyle,
      hpMult: st.enemyHpMult,
      speedMult: 1,
      rewardMult: 1,
      labelTh: `${st.nameTh} · ระดับ 1`,
    };
  }

  const totalShifts = Math.max(1, realmTier * ENDLESS_BIOMES.length + biomeShiftCount);
  const biome = ENDLESS_BIOMES[(totalShifts - 1) % ENDLESS_BIOMES.length];
  const hpMult = st.enemyHpMult * Math.pow(BALANCE.realmHpMultPerTier, realmTier);
  const speedMult = Math.min(1.45, 1 + realmTier * 0.08);
  const rewardMult = 1 + realmTier * 0.65;
  return {
    ...biome,
    hpMult,
    speedMult,
    rewardMult,
    labelTh: `${biome.nameTh} · ระดับ ${realmTier + 1}`,
  };
}

export interface WaveDefinition {
  titleTh: string;
  spawnInterval: number;
  batchSize: number;
  kinds: EnemyKind[];
  batSwarmChance: number;
  flowerRingInterval: number; // 0 = disabled
  bulletHellRate: number;
}

export function getWaveForMinute(
  minute: number,
  realmTier = 0,
  biomeName?: string
): WaveDefinition {
  const prefix = realmTier > 0 && biomeName ? `[${biomeName}] ` : '';

  if (realmTier > 0 && minute < 5) {
    return {
      titleTh: `${prefix}นาที ${String(minute).padStart(2, '0')}: กองทัพต่างมิติถาโถมต่อเนื่อง`,
      spawnInterval: Math.max(0.28, 0.56 - realmTier * 0.04 - minute * 0.03),
      batchSize: Math.min(9, 4 + realmTier + Math.floor(minute / 2)),
      kinds: ['goblin', 'bat', 'archer', 'zealot', 'charger', 'flower', 'golem', 'shielder', 'trapper', 'bomber', 'cultist', 'stalker'],
      batSwarmChance: 0.35,
      flowerRingInterval: 15,
      bulletHellRate: 1.2 + realmTier * 0.25,
    };
  }

  if (minute <= 0) {
    return {
      titleTh: `${prefix}นาที 00: สไลม์ป่าเริ่มเคลื่อนพล`,
      spawnInterval: 0.95,
      batchSize: 2,
      kinds: ['slime', 'goblin'],
      batSwarmChance: 0,
      flowerRingInterval: 0,
      bulletHellRate: 0,
    };
  }
  if (minute === 1) {
    return {
      titleTh: `${prefix}นาที 01: ฝูงค้างคาวและพลธนูซุ่มยิงระยะไกล`,
      spawnInterval: 0.85,
      batchSize: 3,
      kinds: ['goblin', 'bat', 'archer'],
      batSwarmChance: 0.35,
      flowerRingInterval: 0,
      bulletHellRate: 0,
    };
  }
  if (minute === 2) {
    return {
      titleTh: `${prefix}นาที 02: นักคลั่งพลีชีพ (ไม่สนแรงผลัก!) และดอกไม้ต้องสาป`,
      spawnInterval: 0.82,
      batchSize: 3,
      kinds: ['slime', 'flower', 'goblin', 'archer', 'zealot', 'shielder'],
      batSwarmChance: 0.15,
      flowerRingInterval: 18,
      bulletHellRate: 0,
    };
  }
  if (minute === 3) {
    return {
      titleTh: `${prefix}นาที 03: นักพุ่งชนเกราะหนัก พลธนู & มินิบอสโครงกระดูก`,
      spawnInterval: 0.78,
      batchSize: 3,
      kinds: ['goblin', 'golem', 'archer', 'charger', 'shielder', 'trapper', 'bat'],
      batSwarmChance: 0.25,
      flowerRingInterval: 22,
      bulletHellRate: 0,
    };
  }
  if (minute === 4) {
    return {
      titleTh: `${prefix}นาที 04: นักเวทย์นรก นักคลั่งพลีชีพ และหน่วยพุ่งทะลวง`,
      spawnInterval: 0.72,
      batchSize: 4,
      kinds: ['goblin', 'cultist', 'archer', 'zealot', 'charger', 'trapper', 'shielder', 'bat'],
      batSwarmChance: 0.25,
      flowerRingInterval: 0,
      bulletHellRate: 1,
    };
  }
  if (minute >= 5 && minute < 10) {
    return {
      titleTh: `${prefix}นาที ${String(minute).padStart(2, '0')}: กองทัพผสม พลธนู นักคลั่งพลีชีพ และอสูรพุ่งชน`,
      spawnInterval: Math.max(0.45, 0.72 - (minute - 5) * 0.05),
      batchSize: 4 + Math.floor((minute - 5) / 2),
      kinds: ['goblin', 'bat', 'archer', 'zealot', 'charger', 'flower', 'golem', 'shielder', 'trapper', 'bomber', 'cultist', 'stalker'],
      batSwarmChance: 0.3,
      flowerRingInterval: 16,
      bulletHellRate: 1.15 + realmTier * 0.2,
    };
  }
  if (minute >= 10 && minute < 15) {
    return {
      titleTh: `${prefix}นาที ${String(minute).padStart(2, '0')}: รัตติกาลเดือด — กระสุนนรกหนาแน่น`,
      spawnInterval: Math.max(0.36, 0.5 - (minute - 10) * 0.03),
      batchSize: 5 + Math.floor((minute - 10) / 2),
      kinds: ['bat', 'archer', 'zealot', 'charger', 'golem', 'shielder', 'trapper', 'bomber', 'cultist', 'stalker', 'flower'],
      batSwarmChance: 0.35,
      flowerRingInterval: 14,
      bulletHellRate: 1.4 + realmTier * 0.25,
    };
  }
  if (minute >= 15 && minute < 20) {
    return {
      titleTh: `${prefix}นาที ${String(minute).padStart(2, '0')}: กองพลโล่เหล็กและผู้ร่ายคาถาอเวจี`,
      spawnInterval: Math.max(0.3, 0.42 - (minute - 15) * 0.02),
      batchSize: 6 + Math.floor((minute - 15) / 2),
      kinds: ['golem', 'archer', 'zealot', 'charger', 'shielder', 'trapper', 'bomber', 'cultist', 'stalker', 'flower', 'bat'],
      batSwarmChance: 0.35,
      flowerRingInterval: 13,
      bulletHellRate: 1.6 + realmTier * 0.3,
    };
  }
  if (minute >= 20 && minute < 25) {
    return {
      titleTh: `${prefix}นาที ${String(minute).padStart(2, '0')}: กองทัพเนโครแมนเซอร์และเงาสังหาร`,
      spawnInterval: 0.28,
      batchSize: 7,
      kinds: ['cultist', 'archer', 'zealot', 'charger', 'stalker', 'shielder', 'trapper', 'bomber', 'golem', 'bat', 'flower'],
      batSwarmChance: 0.4,
      flowerRingInterval: 12,
      bulletHellRate: 1.8 + realmTier * 0.35,
    };
  }
  if (minute >= 25 && minute < 30) {
    return {
      titleTh: `${prefix}นาที ${String(minute).padStart(2, '0')}: คลื่นนรกสุดท้ายก่อนยมทูตปรากฏกาย`,
      spawnInterval: 0.24,
      batchSize: 8,
      kinds: ['stalker', 'archer', 'zealot', 'charger', 'cultist', 'shielder', 'trapper', 'bomber', 'golem', 'bat', 'flower'],
      batSwarmChance: 0.45,
      flowerRingInterval: 11,
      bulletHellRate: 2.0 + realmTier * 0.4,
    };
  }
  return {
    titleTh: `${prefix}นาที 30: ยมทูต The Reaper มาเยือน!`,
    spawnInterval: 0.4,
    batchSize: 5,
    kinds: ['stalker', 'archer', 'zealot', 'charger', 'cultist', 'shielder', 'trapper', 'bat'],
    batSwarmChance: 0.35,
    flowerRingInterval: 0,
    bulletHellRate: 2.2 + realmTier * 0.45,
  };
}

export interface ScheduledBoss {
  minute: number;
  kind: EnemyKind;
  nameTh: string;
  isMajor: boolean;
  isReaper?: boolean;
}

export const SCHEDULED_BOSSES: ScheduledBoss[] = [
  { minute: 3, kind: 'miniboss_warden', nameTh: 'มินิบอส: อัศวินโครงกระดูก', isMajor: false },
  { minute: 6, kind: 'miniboss_blossom', nameTh: 'มินิบอส: ดอกไม้นรกยักษ์', isMajor: false },
  { minute: 8, kind: 'boss_cerberus', nameTh: 'มินิบอสแฝดสาม: เซอร์เบอรัส', isMajor: false },
  { minute: 10, kind: 'boss_bat_king', nameTh: 'บอส: ราชาค้างคาวรัตติกาล', isMajor: true },
  { minute: 12, kind: 'boss_judgement', nameTh: 'บอส: ผู้พิพากษาสูงสุด จัสเมนต์', isMajor: true },
  { minute: 15, kind: 'boss_colossus', nameTh: 'บอส: โกเลมศิลาโบราณ', isMajor: true },
  { minute: 18, kind: 'boss_beelzebub', nameTh: 'บอส: ราชินีแมลงวันอเวจี บีลเซบับ', isMajor: true },
  { minute: 20, kind: 'boss_lich', nameTh: 'บอส: จอมเวทย์เนโครแมนเซอร์', isMajor: true },
  { minute: 25, kind: 'boss_wyrm', nameTh: 'บอส: มังกรอเวจี', isMajor: true },
  { minute: 28, kind: 'boss_lucifer', nameTh: 'มหาบอส: ราชินีแห่งนรก ลูซิเฟอร์', isMajor: true },
  { minute: 30, kind: 'reaper', nameTh: 'The Reaper · มัจจุราชยมทูต', isMajor: true, isReaper: true },
];

export const CATEGORY_LABELS_TH: Record<string, string> = {
  physical: 'สายกายภาพ',
  magic: 'สายเวทย์',
  tank: 'สายแทงค์',
};

export const DAMAGE_TYPE_LABELS_TH: Record<DamageType, { label: string; badge: string; color: string }> = {
  physical: { label: 'กายภาพ', badge: '⚔️ กายภาพ', color: '#F8FAFC' },
  magic: { label: 'เวทย์', badge: '✨ เวทย์', color: '#93C5FD' },
  elemental: { label: 'ธาตุ', badge: '🔥 ธาตุ', color: '#FB923C' },
};

export const WEATHERS: Record<WeatherId, WeatherDef> = {
  clear: {
    id: 'clear',
    nameTh: 'ฟ้าปลอดโปร่ง',
    effectTh: 'ทัศนวิสัยปกติ ไม่มีผลกระทบ',
    color: '#94A3B8',
  },
  acid_rain: {
    id: 'acid_rain',
    nameTh: 'ฝนกรดกัดกร่อน',
    effectTh: 'ลดเกราะป้องกันผู้เล่น -4 หน่วย และเกิดบ่อกรดพิษบนพื้น',
    color: '#84CC16',
  },
  mist: {
    id: 'mist',
    nameTh: 'ม่านหมอกลวงตา',
    effectTh: 'ลดระยะตรวจจับของมอนสเตอร์เหลือ 230px (ศัตรูไกลตัวจะเดินลาดตระเวนช้าๆ)',
    color: '#A5F3FC',
  },
  fog: {
    id: 'fog',
    nameTh: 'หมอกทึบต้องสาป',
    effectTh: 'บดบังการมองเห็นรอบนอก เหลือแสงสว่างรอบตัว',
    color: '#CBD5E1',
  },
  sandstorm: {
    id: 'sandstorm',
    nameTh: 'พายุทรายคลั่ง',
    effectTh: 'เกิดวังวนทรายสุ่ม! หากโดนจะเดินช้าลงและถูกพัด',
    color: '#F59E0B',
  },
  thunderstorm: {
    id: 'thunderstorm',
    nameTh: 'พายุฝนฟ้าคะนอง',
    effectTh: 'ฟ้าผ่าสุ่มเป็นวง (โดนทั้งผู้เล่นและมอนสเตอร์)',
    color: '#38BDF8',
  },
  blizzard: {
    id: 'blizzard',
    nameTh: 'พายุหิมะเยือกแข็ง',
    effectTh: 'ลานน้ำแข็งสุ่มทำให้เดินช้า · ศัตรูเคลื่อนที่ช้าลง',
    color: '#67E8F9',
  },
  blood_rain: {
    id: 'blood_rain',
    nameTh: 'ฝนโลหิตสุริยคราส',
    effectTh: 'ดาเมจผู้เล่น +15% · มอนสเตอร์ไวและตีแรงขึ้น +12%',
    color: '#F43F5E',
  },
};

const STORM_WEATHERS: WeatherId[] = [
  'acid_rain',
  'mist',
  'fog',
  'sandstorm',
  'thunderstorm',
  'blizzard',
  'blood_rain',
];

export function pickNextWeather(current: WeatherId): WeatherId {
  const pool = STORM_WEATHERS.filter((w) => w !== current);
  return pool[Math.floor(Math.random() * pool.length)];
}

export const MAP_EVENTS: Record<MapEventId, MapEventDef> = {
  exp_surge: {
    id: 'exp_surge',
    nameTh: 'พรผลึกปัญญา (EXP ทวีคูณ)',
    effectTh: 'ค่า EXP จากอัญมณี +75% และเพิ่มโอกาสดรอป EXP ระดับสูง',
    kind: 'blessing',
    color: '#38BDF8',
    duration: 18,
  },
  god_blessing: {
    id: 'god_blessing',
    nameTh: 'พรแห่งเทพ (Blessing of the Gods)',
    effectTh: 'EXP ดรอปมากขึ้น (+50% EXP & โอกาสดรอปเพิ่ม) · มอนสเตอร์เดินช้าลง -30%',
    kind: 'blessing',
    color: '#FDE047',
    duration: 18,
  },
  gold_fever: {
    id: 'gold_fever',
    nameTh: 'พรฝนทองคำอวยพร',
    effectTh: 'ดรอปทองคำ x2.0 และขยายระยะดูดทรัพยากรทั้งแผนที่ +45%',
    kind: 'blessing',
    color: '#FBBF24',
    duration: 18,
  },
  swift_winds: {
    id: 'swift_winds',
    nameTh: 'พรวายุเกื้อหนุน',
    effectTh: 'ตัวละครทุกเผ่าไวขึ้น +18% และลดคูลดาวน์อาวุธ/เวทย์ -18%',
    kind: 'blessing',
    color: '#34D399',
    duration: 18,
  },
  frenzy_horde: {
    id: 'frenzy_horde',
    nameTh: 'มอนสเตอร์อาละวาด (Monster Rampage)',
    effectTh: 'มอนสเตอร์เกิดถี่และจำนวนมากขึ้น + วิ่งไวขึ้น +28%!',
    kind: 'threat',
    color: '#F97316',
    duration: 16,
  },
  blood_curse: {
    id: 'blood_curse',
    nameTh: 'วิกฤตคำสาปจันทราโลหิต',
    effectTh: 'มอนสเตอร์ตีแรงขึ้น +25% · กระสุนไวขึ้น +22% (โบนัสทอง +30%)',
    kind: 'threat',
    color: '#E11D48',
    duration: 16,
  },
  void_corruption: {
    id: 'void_corruption',
    nameTh: 'การกัดกร่อนความว่างเปล่า (Void Corruption)',
    effectTh: 'ลดการฟื้นฟู HP -55% และรับความเสียหายแรงขึ้น +30% (โบนัสทอง +35%)',
    kind: 'threat',
    color: '#C084FC',
    duration: 16,
  },
  gravity_well: {
    id: 'gravity_well',
    nameTh: 'วิกฤตแรงโน้มถ่วงอเวจี',
    effectTh: 'ผู้เล่นเคลื่อนที่ช้าลง -16% และศัตรูต้านแรงผลักมากขึ้น +35%',
    kind: 'threat',
    color: '#A855F7',
    duration: 16,
  },
  ambush_swarm: {
    id: 'ambush_swarm',
    nameTh: 'วิกฤตกองทัพซุ่มโจมตี',
    effectTh: 'ระดมพลธนูและนักคลั่งพลีชีพรุมล้อม พร้อมระเบิดเตือนบนพื้น!',
    kind: 'threat',
    color: '#F43F5E',
    duration: 16,
  },
  shrinking_ring: {
    id: 'shrinking_ring',
    nameTh: 'วงบีบมรณะ (Shrinking Ring)',
    effectTh: 'ห้ามออกนอกวงแดงที่ค่อยๆ บีบแคบลง 20 วิ! รอดครบรับหีบสมบัติ',
    kind: 'threat',
    color: '#EF4444',
    duration: 20,
  },
  treasure_cart: {
    id: 'treasure_cart',
    nameTh: 'ขบวนรถขนสมบัติก็อบลิน',
    effectTh: 'รถทองคำกำลังหลบหนี! ตีให้แตกก่อน 25 วิ เพื่อรับทอง +200!',
    kind: 'blessing',
    color: '#F59E0B',
    duration: 25,
  },
  meteor_shower: {
    id: 'meteor_shower',
    nameTh: 'ฝนอุกกาบาตถล่มปฐพี',
    effectTh: 'หินเพลิงตกจากฟ้า 15 วิ! ทำลายทั้งมอนและผู้เล่นหากไม่หลบวงแดง',
    kind: 'threat',
    color: '#FB923C',
    duration: 15,
  },
  night_fog: {
    id: 'night_fog',
    nameTh: 'หมอกมืดกลืนรัตติกาล',
    effectTh: 'ทัศนวิสัยลดเหลือ 350px · หีบและของเรืองแสงชัดเจน + EXP x1.3!',
    kind: 'threat',
    color: '#818CF8',
    duration: 20,
  },
  earth_split: {
    id: 'earth_split',
    nameTh: 'ปฐพีแยกฉีกอเวจี',
    effectTh: 'รอยแยกแมกมาผุดใต้สมรภูมิ! ระวังเส้นรอยแยกเดือดจนกว่าบอสจะพ่าย',
    kind: 'threat',
    color: '#DC2626',
    duration: 24,
  },
  golden_swarm: {
    id: 'golden_swarm',
    nameTh: 'ฝูงค้างคาวทองคำคลั่ง',
    effectTh: 'ค้างคาวทองคำ 20 ตัวบินพุ่งเข้ามา — ตัวละ 5 ทอง!',
    kind: 'blessing',
    color: '#FACC15',
    duration: 16,
  },
};

const ALL_MAP_EVENT_IDS: MapEventId[] = [
  'exp_surge',
  'god_blessing',
  'gold_fever',
  'swift_winds',
  'frenzy_horde',
  'blood_curse',
  'void_corruption',
  'gravity_well',
  'ambush_swarm',
  'shrinking_ring',
  'treasure_cart',
  'meteor_shower',
  'night_fog',
  'earth_split',
  'golden_swarm',
];

export function pickNextMapEvent(
  current: MapEventId | null,
  opts?: { isNight?: boolean; hasBoss?: boolean }
): MapEventDef {
  const weighted: MapEventId[] = [];
  for (const id of ALL_MAP_EVENT_IDS) {
    if (id === current) continue;
    if (id === 'earth_split' && !opts?.hasBoss) continue;
    let weight = 1;
    if (id === 'night_fog' && opts?.isNight) weight = 3;
    if (id === 'earth_split' && opts?.hasBoss) weight = 3;
    for (let i = 0; i < weight; i++) weighted.push(id);
  }
  const picked = weighted[Math.floor(Math.random() * weighted.length)] || 'gold_fever';
  return MAP_EVENTS[picked];
}

export const ELEMENTS: Record<ElementId, ElementDef> = {
  earth: { id: 'earth', nameTh: 'ดิน', shortTh: 'ดิน', color: '#CA8A04', glowColor: '#FDE047' },
  water: { id: 'water', nameTh: 'น้ำ', shortTh: 'น้ำ', color: '#0EA5E9', glowColor: '#7DD3FC' },
  wind: { id: 'wind', nameTh: 'ลม', shortTh: 'ลม', color: '#34D399', glowColor: '#A7F3D0' },
  fire: { id: 'fire', nameTh: 'ไฟ', shortTh: 'ไฟ', color: '#F97316', glowColor: '#FDBA74' },
  stone: { id: 'stone', nameTh: 'หิน', shortTh: 'หิน', color: '#94A3B8', glowColor: '#E2E8F0' },
  dark: { id: 'dark', nameTh: 'ความมืด', shortTh: 'มืด', color: '#9333EA', glowColor: '#D8B4FE' },
  light: { id: 'light', nameTh: 'แสง', shortTh: 'แสง', color: '#FACC15', glowColor: '#FEF9C3' },
  blood: { id: 'blood', nameTh: 'โลหิต', shortTh: 'เลือด', color: '#E11D48', glowColor: '#FDA4AF' },
};

export const ELEMENT_IDS: ElementId[] = [
  'earth',
  'water',
  'wind',
  'fire',
  'stone',
  'dark',
  'light',
  'blood',
];

export const ELEMENT_CATALYSTS: Record<ElementId, ElementCatalystDef> = {
  fire: {
    id: 'fire',
    nameTh: 'ตัวเร่งเพลิง',
    effectTh: '+18% ดาเมจ & ปะทุไฟเสริม',
    color: '#F97316',
  },
  water: {
    id: 'water',
    nameTh: 'ตัวเร่งเหมันต์',
    effectTh: 'แช่แข็งสโลว์ + คืน +3 MP/ร่าย',
    color: '#0EA5E9',
  },
  wind: {
    id: 'wind',
    nameTh: 'ตัวเร่งวายุ',
    effectTh: 'เร่งร่ายเวทย์ไว -22% คูลดาวน์',
    color: '#34D399',
  },
  earth: {
    id: 'earth',
    nameTh: 'ตัวเร่งปฐพี',
    effectTh: 'กระแทกผลัก +45% รอบจุดร่าย',
    color: '#CA8A04',
  },
  stone: {
    id: 'stone',
    nameTh: 'ตัวเร่งศิลา',
    effectTh: 'ขยายพื้นที่ +18% & เจาะเกราะ',
    color: '#94A3B8',
  },
  dark: {
    id: 'dark',
    nameTh: 'ตัวเร่งอเวจี',
    effectTh: 'ดูดรวบศัตรู & กัดกร่อน +15% ดาเมจ',
    color: '#9333EA',
  },
  light: {
    id: 'light',
    nameTh: 'ตัวเร่งแสง',
    effectTh: 'ล้างกระสุนศัตรูรอบตัวทุกครั้งที่ร่าย',
    color: '#FACC15',
  },
  blood: {
    id: 'blood',
    nameTh: 'ตัวเร่งโลหิต',
    effectTh: 'ดูดเลือด +1~2 HP เมื่อโดนเป้าหมาย',
    color: '#E11D48',
  },
};

function makeKey(a: ElementId, b: ElementId): string {
  return [a, b].sort().join('+');
}

const RAW_FUSIONS: Omit<ElementFusionDef, 'key'>[] = [
  // Key Showcase Fusions
  { a: 'fire', b: 'wind', nameTh: 'พายุเพลิงโหม', descTh: 'เรียกพายุหมุนเปลวเพลิงไล่เผาและดูดฝูงศัตรู', manaCost: 13, cooldown: 1.5, color: '#FB923C', behavior: 'firestorm' },
  { a: 'water', b: 'wind', nameTh: 'โกเล็มเหมันต์ & พายุน้ำแข็ง', descTh: 'อัญเชิญโกเล็มน้ำแข็งยั่วยุศัตรูและทุบแช่แข็ง', manaCost: 15, cooldown: 1.8, color: '#38BDF8', behavior: 'frost_golem' },
  { a: 'earth', b: 'stone', nameTh: 'มหาโกเล็มปฐพี', descTh: 'อัญเชิญโกเล็มศิลาหินยักษ์ยั่วยุศัตรูและกันกระสุน', manaCost: 15, cooldown: 1.9, color: '#CA8A04', behavior: 'stone_golem' },
  { a: 'earth', b: 'water', nameTh: 'โคลนดูดธรณี', descTh: 'บ่อโคลนดูดสโลว์ศัตรูเป็นวงกว้างและระเบิดหนามดิน', manaCost: 11, cooldown: 1.6, color: '#84CC16', behavior: 'quicksand' },
  { a: 'earth', b: 'fire', nameTh: 'ภูเขาไฟปะทุ', descTh: 'ปะทุลาวาเดือดกลางฝูงศัตรูระเบิดต่อเนื่อง', manaCost: 14, cooldown: 1.7, color: '#EA580C', behavior: 'magma_eruption' },
  { a: 'earth', b: 'wind', nameTh: 'พายุทรายกลืนกิน', descTh: 'พายุทรายหมุนวนรอบตัวผลักและสโลว์มอนสเตอร์', manaCost: 11, cooldown: 1.5, color: '#F59E0B', behavior: 'dust_vortex' },
  { a: 'earth', b: 'dark', nameTh: 'สุสานต้องสาป', descTh: 'กรงเล็บเงาผุดจากดินตรึงและบดขยี้ศัตรู', manaCost: 13, cooldown: 1.7, color: '#7E22CE', behavior: 'cursed_hands' },
  { a: 'earth', b: 'light', nameTh: 'ปราการศิลาศักดิ์สิทธิ์', descTh: 'เสาศิลาแสงฟื้นฟู HP เล็กน้อย ล้างกระสุนและกระแทกศัตรู', manaCost: 14, cooldown: 2.0, color: '#FDE047', behavior: 'sanctuary' },
  { a: 'earth', b: 'blood', nameTh: 'หนามโลหิตผุด', descTh: 'เสาหนามเลือดพุ่งทิ่มแทงใต้กลุ่มศัตรูพร้อมดูดเลือดคืน', manaCost: 13, cooldown: 1.6, color: '#BE123C', behavior: 'blood_spikes' },
  { a: 'water', b: 'fire', nameTh: 'ระเบิดไอน้ำเดือด', descTh: 'คลื่นไอน้ำความดันสูงลวกและผลักศัตรูรอบทิศพร้อมม่านหมอก', manaCost: 12, cooldown: 1.45, color: '#67E8F9', behavior: 'steam_blast' },
  { a: 'water', b: 'stone', nameTh: 'ผลึกธารน้ำแข็ง', descTh: 'ยิงผลึกน้ำแข็งเจาะเกราะทะลวงศัตรูเป็นแนวพัด', manaCost: 11, cooldown: 1.35, color: '#22D3EE', behavior: 'glacial_crystal' },
  { a: 'water', b: 'dark', nameTh: 'ห้วงสมุทรมืดมิด', descTh: 'คลื่นน้ำทมิฬกัดกร่อนเกราะและลากศัตรูถอย', manaCost: 13, cooldown: 1.65, color: '#6366F1', behavior: 'abyss_tide' },
  { a: 'water', b: 'light', nameTh: 'น้ำพุแห่งการฟื้นฟู', descTh: 'คลื่นแสงชำระกระสุนศัตรูพร้อมฟื้นฟู HP และมานา', manaCost: 10, cooldown: 2.1, color: '#BAE6FD', behavior: 'healing_spring' },
  { a: 'water', b: 'blood', nameTh: 'กระแสโลหิตเชี่ยวกราก', descTh: 'คลื่นเลือดซัดกวาดศัตรูและฟื้นฟู HP เมื่อโจมตี', manaCost: 13, cooldown: 1.6, color: '#FB7185', behavior: 'blood_tide' },
  { a: 'wind', b: 'stone', nameTh: 'พายุสะเก็ดศิลา', descTh: 'สาดคมกรวดหินความเร็วสูงรอบตัว 8 ทิศทาง', manaCost: 11, cooldown: 1.35, color: '#CBD5E1', behavior: 'shatter_gale' },
  { a: 'wind', b: 'dark', nameTh: 'วายุเงาสังหาร', descTh: 'ใบมีดลมทมิฬหมุนโคจรรอบตัวแล้วพุ่งเฉือนศัตรู', manaCost: 12, cooldown: 1.35, color: '#A855F7', behavior: 'shadow_blades' },
  { a: 'wind', b: 'light', nameTh: 'สายลมอวยพร', descTh: 'พัดกระสุนศัตรูสลายและยิงคลื่นแสงนำวิถี', manaCost: 11, cooldown: 1.5, color: '#FEF08A', behavior: 'radiant_zephyr' },
  { a: 'wind', b: 'blood', nameTh: 'พายุใบมีดโลหิต', descTh: 'เคียวลมสีเลือดหมุนควงเป็นวงแหวนฉีกกระชากรอบตัว', manaCost: 13, cooldown: 1.45, color: '#F43F5E', behavior: 'crimson_wind' },
  { a: 'fire', b: 'stone', nameTh: 'ฝนอุกกาบาต', descTh: 'เรียกอุกกาบาตหินเพลิงถล่มกลางกลุ่มศัตรูพร้อมบ่อลาวา', manaCost: 15, cooldown: 1.75, color: '#F97316', behavior: 'meteor_storm' },
  { a: 'fire', b: 'dark', nameTh: 'เพลิงอเวจี', descTh: 'ระเบิดไฟม่วงทมิฬเผาทำลายศัตรูต่อเนื่อง', manaCost: 14, cooldown: 1.6, color: '#C084FC', behavior: 'hellfire' },
  { a: 'fire', b: 'light', nameTh: 'สุริยคราสพิพากษา', descTh: 'ลำแสงสุริยะ 4 ทิศยิงทะลวงกวาดล้างทั้งหน้าจอ', manaCost: 16, cooldown: 1.85, color: '#FACC15', behavior: 'solar_flare' },
  { a: 'fire', b: 'blood', nameTh: 'โลหิตเดือดพล่าน', descTh: 'ระเบิดเลือดเพลิงรอบตัว ยิ่งฆ่ายิ่งฟื้นฟูเลือด', manaCost: 13, cooldown: 1.55, color: '#EF4444', behavior: 'boiling_blood' },
  { a: 'stone', b: 'dark', nameTh: 'ออบซิเดียนทลายทัพ', descTh: 'หินออบซิเดียนขนาดยักษ์พุ่งชนแล้วแตกเป็นสะเก็ด', manaCost: 13, cooldown: 1.6, color: '#64748B', behavior: 'obsidian_burst' },
  { a: 'stone', b: 'light', nameTh: 'ผลึกเลเซอร์สแกน 360°', descTh: 'ยิงลำแสงเลเซอร์สแกนปาดเป็นวงกลม 360° รอบตัวตัดผ่านทุกเป้าหมาย', manaCost: 16, cooldown: 2.0, color: '#67E8F9', behavior: 'scan_laser' },
  { a: 'stone', b: 'blood', nameTh: 'ศิลาโลหิตหนาม', descTh: 'เหวี่ยงลูกตุ้มศิลาหนามเลือดกระแทกศัตรูกระเด็นไกล', manaCost: 13, cooldown: 1.55, color: '#9F1239', behavior: 'bloodstone' },
  { a: 'dark', b: 'light', nameTh: 'สมดุลสุริยคราส', descTh: 'มหาเวทย์ทวิลักษณ์ยิงเลเซอร์ 6 แฉกและระเบิดแสงเงา', manaCost: 17, cooldown: 1.9, color: '#F472B6', behavior: 'eclipse_nova' },
  { a: 'dark', b: 'blood', nameTh: 'คัมภีร์แวมไพร์', descTh: 'ปล่อยฝูงค้างคาวโลหิตไล่ดูด HP และมานาคืน', manaCost: 12, cooldown: 1.5, color: '#E11D48', behavior: 'vampire_bats' },
  { a: 'light', b: 'blood', nameTh: 'การชำระบาปสีชาด', descTh: 'คลื่นแสงสีชาดล้างกระสุนศัตรูและฟื้นเลือดอัตโนมัติ', manaCost: 14, cooldown: 1.8, color: '#FDA4AF', behavior: 'sacred_sacrifice' },
  // Pure Double Element Combos
  { a: 'earth', b: 'earth', nameTh: 'ปฐพีกัมปนาท', descTh: 'ทุบแผ่นดินไหวสะเทือนเลื่อนลั่นสตั๊นศัตรูรอบทิศ', manaCost: 11, cooldown: 1.6, color: '#CA8A04', behavior: 'pure_quake' },
  { a: 'water', b: 'water', nameTh: 'คลื่นยักษ์สึนามิ', descTh: 'ซัดคลื่นน้ำยักษ์ผลักกระเด็นและแช่เปียกทั้งแถบ', manaCost: 11, cooldown: 1.5, color: '#0EA5E9', behavior: 'pure_tsunami' },
  { a: 'wind', b: 'wind', nameTh: 'พายุกรรโชก', descTh: 'ปล่อยคมดาบวายุความเร็วสูงรอบตัวต่อเนื่อง', manaCost: 10, cooldown: 1.25, color: '#34D399', behavior: 'pure_tempest' },
  { a: 'fire', b: 'fire', nameTh: 'อัคคีล้างผลาญ', descTh: 'ลูกบอลเพลิงยักษ์ระเบิดวงกว้างเผาทั้งฝูง', manaCost: 12, cooldown: 1.45, color: '#F97316', behavior: 'pure_inferno' },
  { a: 'stone', b: 'stone', nameTh: 'ศิลาถล่มทลาย', descTh: 'ก้อนหินมหึมาพุ่งบดขยี้ทะลุแถวศัตรู', manaCost: 12, cooldown: 1.55, color: '#94A3B8', behavior: 'pure_boulder' },
  { a: 'dark', b: 'dark', nameTh: 'หลุมดำกลืนวิญญาณ', descTh: 'แรงโน้มถ่วงทมิฬดูดศัตรูเข้าศูนย์กลางแล้วระเบิด', manaCost: 14, cooldown: 1.75, color: '#9333EA', behavior: 'pure_void' },
  { a: 'light', b: 'light', nameTh: 'ทัณฑ์แสงสวรรค์', descTh: 'เสาแสงบริสุทธิ์ฟาดลงกลางฝูงมอนสเตอร์หลายจุด', manaCost: 13, cooldown: 1.6, color: '#FDE047', behavior: 'pure_judgment' },
  { a: 'blood', b: 'blood', nameTh: 'มหาสมุทรโลหิต', descTh: 'ระเบิดหนามเลือดรอบตัวดูดพลังชีวิตคืนอย่างมหาศาล', manaCost: 13, cooldown: 1.55, color: '#E11D48', behavior: 'pure_deluge' },
];

export const ELEMENT_FUSIONS: Record<string, ElementFusionDef> = Object.fromEntries(
  RAW_FUSIONS.map((f) => {
    const key = makeKey(f.a, f.b);
    return [key, { ...f, key }];
  })
);

export const ALL_ELEMENT_FUSIONS: ElementFusionDef[] = RAW_FUSIONS.map((f) => ({
  ...f,
  key: makeKey(f.a, f.b),
}));

export function getElementFusion(a: ElementId, b: ElementId): ElementFusionDef {
  return ELEMENT_FUSIONS[makeKey(a, b)];
}

export const MAGE_PERKS: Record<MagePerkId, MagePerkDef> = {
  mana_pool: {
    id: 'mana_pool',
    nameTh: 'บ่อพลังมานาโบราณ',
    descTh: 'ขยายขีดจำกัดมานาสูงสุด +16 MP และฟื้นมานาเร็วขึ้น +0.8/วิ',
    color: '#38BDF8',
    bonusLabel: '+16 Max MP · +0.8 Regen',
  },
  mana_flow: {
    id: 'mana_flow',
    nameTh: 'กระแสเวทย์ไหลลื่น',
    descTh: 'ลดการใช้มานา -8% และลดคูลดาวน์ร่ายเวทย์ & พิธีกรรม -7%',
    color: '#818CF8',
    bonusLabel: '-8% ค่าร่าย MP · -7% คูลดาวน์',
  },
  element_might: {
    id: 'element_might',
    nameTh: 'พลังสั่นพ้องธาตุ',
    descTh: 'เพิ่มความเสียหายเวทย์ธาตุผสมทุกชนิด +14%',
    color: '#F97316',
    bonusLabel: '+14% ดาเมจธาตุ',
  },
  spell_area: {
    id: 'spell_area',
    nameTh: 'ขยายอาณาเขตมนตรา',
    descTh: 'ขยายพื้นที่ระเบิด พายุ เลเซอร์ และโกเล็ม +10% · เพิ่มระยะเวทย์ +1.8 วิ',
    color: '#34D399',
    bonusLabel: '+10% พื้นที่เวทย์ · +1.8วิ',
  },
  orb_magnet: {
    id: 'orb_magnet',
    nameTh: 'แรงดึงดูดออร์บธาตุ',
    descTh: 'เพิ่มระยะดูด EXP และออร์บ +28px และรับมานาเพิ่ม +3 MP ทุกครั้งที่เก็บออร์บ',
    color: '#FACC15',
    bonusLabel: '+28px ดูด · +3 MP/ออร์บ',
  },
  mana_barrier: {
    id: 'mana_barrier',
    nameTh: 'เกราะมานาคุ้มกาย',
    descTh: 'เพิ่มพลังชีวิตสูงสุด +14 HP และเกราะ +1 พร้อมฟื้น +12 HP ทันที',
    color: '#F43F5E',
    bonusLabel: '+14 Max HP · +1 เกราะ',
  },
};

export const ARTIFACT_SLOT_ORDER: ArtifactSlot[] = [
  'helmet',
  'necklace',
  'armor',
  'boots',
  'ring',
];

export const ARTIFACT_SLOTS: Record<ArtifactSlot, ArtifactSlotMeta> = {
  helmet: {
    slot: 'helmet',
    nameTh: 'หมวก',
    focusTh: 'โชคลาภ · คริติคอล · EXP · เหรียญ',
    accentColor: '#FBBF24',
  },
  necklace: {
    slot: 'necklace',
    nameTh: 'สร้อย',
    focusTh: 'อรรถประโยชน์ · พลังพิเศษเฉพาะตัว',
    accentColor: '#C084FC',
  },
  armor: {
    slot: 'armor',
    nameTh: 'ชุด',
    focusTh: 'การเอาชีวิตรอด · ฟื้นฟู · ป้องกัน',
    accentColor: '#34D399',
  },
  boots: {
    slot: 'boots',
    nameTh: 'รองเท้า',
    focusTh: 'การเคลื่อนที่ · ความคล่องตัว',
    accentColor: '#38BDF8',
  },
  ring: {
    slot: 'ring',
    nameTh: 'แหวน',
    focusTh: 'พลังโจมตี · เพิ่มความเสียหายทุกชนิด',
    accentColor: '#FB7185',
  },
};

export const ARTIFACTS: Record<ArtifactId, ArtifactDef> = {
  // ======================== 1. หมวก (Luck / Crit / EXP / Gold) ========================
  crown_of_fortune: {
    id: 'crown_of_fortune',
    slot: 'helmet',
    nameTh: 'มงกุฎแห่งโชคลาภ',
    nameEn: 'Crown of Fortune',
    color: '#FBBF24',
    prosTh: 'ได้รับ EXP +28% และเหรียญทอง +40% พร้อมโอกาส 12% ได้รับ XP/ทอง x2',
    consTh: 'ความเสียหายทั้งหมดลดลง -10%',
    xpGainBonus: 0.28,
    goldGainBonus: 0.4,
    doubleLootLuckChance: 0.12,
    damageMultBonus: -0.1,
  },
  assassin_hood: {
    id: 'assassin_hood',
    slot: 'helmet',
    nameTh: 'หมวกเหล็กเพชฌฆาต',
    nameEn: "Executioner's Helm",
    color: '#F59E0B',
    prosTh: 'โอกาสติดคริติคอล +24% และความแรงคริติคอล +55%',
    consTh: 'เกราะป้องกันลดลง -3 หน่วย',
    critChanceBonus: 0.24,
    critDamageBonus: 0.55,
    armorBonus: -3,
  },
  oracle_helm: {
    id: 'oracle_helm',
    slot: 'helmet',
    nameTh: 'หมวกแสงแห่งโชคชะตา',
    nameEn: 'Radiant Luck Helm',
    color: '#FDE047',
    prosTh: 'โอกาสคริ +16%, EXP ที่ได้ +18% และทองที่ได้รับ +22%',
    consTh: 'พลังชีวิตสูงสุด (Max HP) ลดลง -12%',
    critChanceBonus: 0.16,
    xpGainBonus: 0.18,
    goldGainBonus: 0.22,
    maxHpMultFactor: 0.88,
  },

  // ======================== 2. สร้อย (Utility / Special Playstyles) ========================
  blood_necklace: {
    id: 'blood_necklace',
    slot: 'necklace',
    nameTh: 'สร้อยแห่งเลือด',
    nameEn: 'Blood Necklace',
    color: '#F43F5E',
    prosTh: 'ดูดเลือดจากความเสียหายที่ทำได้เท่ากับ 0.2% × เลเวลตัวละคร',
    consTh: 'โดนความเสียหายจากมอนสเตอร์แรงขึ้น +4%',
    lifestealPerLevel: 0.002,
    damageTakenMult: 1.04,
  },
  magnet_pendant: {
    id: 'magnet_pendant',
    slot: 'necklace',
    nameTh: 'สร้อยดาราดูดทรัพย์',
    nameEn: 'Starlight Pendant',
    color: '#38BDF8',
    prosTh: 'ระยะดูดไอเทม +95%, Max มานา +25 และฟื้นฟูมานาเร็วขึ้น +30%',
    consTh: 'พื้นที่โจมตีของสกิลและอาวุธเล็กลง -10%',
    magnetBonusPct: 0.95,
    manaMaxBonus: 25,
    manaRegenMultBonus: 0.3,
    areaMultBonus: -0.1,
  },
  fang_talisman: {
    id: 'fang_talisman',
    slot: 'necklace',
    nameTh: 'สร้อยเขี้ยวอสูรเร่งพิธี',
    nameEn: 'Beastfang Talisman',
    color: '#A855F7',
    prosTh: 'ลดคูลดาวน์สกิลและอาวุธลง -15% และขยายพื้นที่สกิล +14%',
    consTh: 'ประสิทธิภาพการฮีลจากขวดยา/รีเจนลดลง -25%',
    cooldownMultFactor: 0.85,
    areaMultBonus: 0.14,
    healTakenFactor: 0.75,
  },

  // ======================== 3. ชุด (Survivability / Defense / Sustain) ========================
  seraph_robe: {
    id: 'seraph_robe',
    slot: 'armor',
    nameTh: 'ชุดเทวทูตแห่งแสง',
    nameEn: 'Seraphic Armor of Light',
    color: '#FACC15',
    prosTh: 'รีเจนเลือด 0.5% ของ Max HP ทุกๆ 2 วินาที',
    consTh: 'พลังชีวิตสูงสุด (Max HP) ลดลง -10%',
    regenPctPer2Sec: 0.005,
    maxHpMultFactor: 0.9,
  },
  juggernaut_plate: {
    id: 'juggernaut_plate',
    slot: 'armor',
    nameTh: 'ชุดเกราะศิลานิรันดร์',
    nameEn: 'Stone Titan Plate',
    color: '#34D399',
    prosTh: 'เพิ่มเกราะป้องกัน +6 หน่วย และเพิ่ม Max HP +30%',
    consTh: 'ความเร็วเคลื่อนที่ลดลง -14%',
    armorBonus: 6,
    maxHpMultFactor: 1.3,
    speedMultBonus: -0.14,
  },
  crimson_shroud: {
    id: 'crimson_shroud',
    slot: 'armor',
    nameTh: 'ชุดคลุมหนามโลหิต',
    nameEn: 'Crimson Thorn Mantle',
    color: '#FB7185',
    prosTh: 'เกราะ +3, ยืดเวลาอมตะหลังโดนตี +0.25 วิ และระเบิดหนามรอบตัวเมื่อโดนโจมตี',
    consTh: 'EXP ที่ได้รับลดลง -12%',
    armorBonus: 3,
    extraInvulnOnHit: 0.25,
    thornBurstOnHit: true,
    xpGainBonus: -0.12,
  },

  // ======================== 4. รองเท้า (Movement / Footwork) ========================
  flash_boots: {
    id: 'flash_boots',
    slot: 'boots',
    nameTh: 'รองเท้า The Flash',
    nameEn: 'The Flash Boots',
    color: '#EF4444',
    prosTh: 'เคลื่อนที่ไวขึ้น +25% และเดินทะลุมอนสเตอร์ขนาดเล็กได้ (ยกเว้นบอส)',
    consTh: 'โดนดีบัพสโลว์หนักและนานขึ้นมากกว่าปกติ +40%',
    speedMultBonus: 0.25,
    phaseSmallMonsters: true,
    slowDebuffFactor: 1.4,
  },
  windwalker_boots: {
    id: 'windwalker_boots',
    slot: 'boots',
    nameTh: 'รองเท้าเหยียบวายุ',
    nameEn: 'Windwalker Greaves',
    color: '#38BDF8',
    prosTh: 'เคลื่อนที่ไวขึ้น +18%, ลดคูลดาวน์แดช -30% และโปรเจกไทล์ไวขึ้น +20%',
    consTh: 'โดนดาเมจจากกระสุนศัตรูแรงขึ้น +10%',
    speedMultBonus: 0.18,
    dashCooldownFactor: 0.7,
    projSpeedBonus: 0.2,
    bulletDamageTakenMult: 1.1,
  },
  iron_boots: {
    id: 'iron_boots',
    slot: 'boots',
    nameTh: 'รองเท้าเหล็กปฐพี',
    nameEn: 'Heavy Iron Sabatons',
    color: '#94A3B8',
    prosTh: 'ต้านทานดีบัพสโลว์ 75% และวิ่งกระแทกมอนสเตอร์ใกล้ตัวกระเด็นทุก 0.6 วิ',
    consTh: 'ความเร็วเคลื่อนที่พื้นฐานลดลง -8%',
    slowDebuffFactor: 0.25,
    ramKnockbackOnMove: true,
    speedMultBonus: -0.08,
  },

  // ======================== 5. แหวน (Pure Damage Amplification) ========================
  power_stone_ring: {
    id: 'power_stone_ring',
    slot: 'ring',
    nameTh: 'แหวนพาวเวอร์สโตน',
    nameEn: 'Power Stone Ring',
    color: '#F97316',
    prosTh: 'เพิ่มความเสียหายทุกประเภทให้ผู้สวมใส่ +0.8% × เลเวลตัวละคร',
    consTh: 'สกิลที่ออกและการโจมตีทั้งหมดช้าลง 10%',
    damagePerLevelBonus: 0.008,
    cooldownMultFactor: 1.1,
  },
  berserker_band: {
    id: 'berserker_band',
    slot: 'ring',
    nameTh: 'แหวนนักรบคลั่ง',
    nameEn: 'Berserker Bloodband',
    color: '#E11D48',
    prosTh: 'เพิ่มดาเมจทั้งหมด +26% และเพิ่มอีก +20% เมื่อ HP ต่ำกว่า 50%',
    consTh: 'เกราะลดลง -3 และรับความเสียหายแรงขึ้น +8%',
    damageMultBonus: 0.26,
    lowHpDamageBonus: 0.2,
    armorBonus: -3,
    damageTakenMult: 1.08,
  },
  ruby_ring: {
    id: 'ruby_ring',
    slot: 'ring',
    nameTh: 'แหวนมรณะพิฆาต',
    nameEn: "Executioner's Ring",
    color: '#FB7185',
    prosTh: 'ความแรงคริติคอล +75% และความเร็วกระสุน/อาวุธพุ่งไวขึ้น +22%',
    consTh: 'พลังชีวิตสูงสุด (Max HP) ลดลง -14%',
    critDamageBonus: 0.75,
    projSpeedBonus: 0.22,
    maxHpMultFactor: 0.86,
  },

  // ======================== 6. อาร์ติแฟกต์ระดับตำนาน (Part 4 Legendary) ========================
  tyrant_crown: {
    id: 'tyrant_crown',
    slot: 'helmet',
    nameTh: 'มงกุฎทรราช',
    nameEn: "Tyrant's Crown",
    color: '#FACC15',
    isLegendary: true,
    prosTh: 'ดาเมจทั้งหมด +35% และบังคับเล็งทิศทางการยิงตามตำแหน่งเมาส์/ทิศหันหน้า',
    consTh: 'ไม่มี Auto-Aim ช่วยเล็ง ต้องเล็งทิศทางเอง',
    damageMultBonus: 0.35,
    cursorAim: true,
  },
  butterfly_pendant: {
    id: 'butterfly_pendant',
    slot: 'necklace',
    nameTh: 'นาฬิกาแขวนคอผีเสื้อ',
    nameEn: 'Butterfly Pendulum',
    color: '#A855F7',
    isLegendary: true,
    prosTh: 'ทุก 30 วินาที ย้อนตำแหน่งและ HP ผู้เล่นกลับไปเมื่อ 2 วินาทีก่อนหน้า (มอนที่ตายแล้วยังตายอยู่)',
    consTh: 'หากเผลอเดินเข้าดงมอนเมื่อ 2 วิก่อน อาจโดนย้อนกลับไปได้',
    butterflyRewind: true,
  },
  two_faced_tome: {
    id: 'two_faced_tome',
    slot: 'armor',
    nameTh: 'คัมภีร์สองหน้า',
    nameEn: 'Two-Faced Tome',
    color: '#38BDF8',
    isLegendary: true,
    prosTh: 'ทุก 15 วินาที สลับธาตุแฝงให้อาวุธช่อง 1 & 2 (ไฟ↔น้ำแข็ง↔สายฟ้า/น้ำ) ก่อปฏิกิริยาธาตุถี่รัว',
    consTh: 'ธาตุหมุนเปลี่ยนอัตโนมัติทุก 15 วิ',
    twoFacedSwap: true,
  },
  dancer_sash: {
    id: 'dancer_sash',
    slot: 'boots',
    nameTh: 'เข็มขัดนักเต้นรำ',
    nameEn: "Dancer's Sash",
    color: '#EC4899',
    isLegendary: true,
    prosTh: 'แดชได้ 2 ครั้งซ้อน + แดชผ่านกระสุนศัตรูจะสะท้อนกระสุนกลับใส่ศัตรู',
    consTh: 'พลังชีวิตสูงสุด (Max HP) ลดลง -20%',
    dancerDashCharges: true,
    maxHpMultFactor: 0.8,
  },
  sinner_heart: {
    id: 'sinner_heart',
    slot: 'ring',
    nameTh: 'ดวงใจคนบาป',
    nameEn: "Sinner's Heart",
    color: '#E11D48',
    isLegendary: true,
    prosTh: 'ฆ่าศัตรู 1 ตัวเพิ่มดาเมจ +0.5% สะสมสูงสุด +50% (ที่ 100 คิล)',
    consTh: 'โดนโจมตีเมื่อไหร่ สแต็กดาเมจรีเซ็ตเป็น 0 ทันที!',
    sinnerStacksBonus: true,
  },
  greedy_chalice: {
    id: 'greedy_chalice',
    slot: 'ring',
    nameTh: 'ถ้วยแก้วโลภ',
    nameEn: 'Greedy Chalice',
    color: '#F59E0B',
    isLegendary: true,
    prosTh: 'ทุกครั้งที่เก็บเหรียญทอง จะระเบิดความเสียหาย AoE รอบตัวทันที',
    consTh: 'ดาเมจของอาวุธทั้งหมดลดลง -15%',
    greedyChaliceExplode: true,
    damageMultBonus: -0.15,
  },
};

export function formatClock(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const mins = Math.floor(s / 60);
  const secs = s % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}
