# Class skill VFX — วิธีใช้ (ส่งให้ Gemini)
ใช้ระบบเดียวกับ mage_manifest / weapon_manifest: อ่าน class_manifest.json แล้ววาดด้วย drawVfx ตัวเดิม
(frame = floor(elapsed*fps), loop/ไม่ loop, anchor, blend 'lighter', rotateToVelocity, ปิด imageSmoothing)
- group assassin: hunter_* (ฟันเงาวาดตามแนวแดชแล้วยืดยาวตามระยะแดช, hunter_dash_charges ใช้เฟรม=จำนวนชาร์จ, afterimage ใช้เฟรม 0–3 ตามความจาง)
- group knight: knight_* (ดาบลอยหมุนตามทิศพุ่ง, excalibur anchor ล่างตรงจุดปัก)
- group saint: saint_* (saint_sanctum ให้ transform สามเหลี่ยมให้มุมตรงกับตำแหน่ง 3 ตรา หรือสเกลให้ครอบ)
- group archmage/chronos/death/spellblade/voidless: ใช้แทนเอฟเฟกต์เดิมของแต่ละสกิล
  (chronos_timestop วาดกลางจอ alpha ~0.35 ระหว่างหยุดเวลา, spellblade_wave_<ธาตุ> ตามธาตุที่ถือ,
   spellblade_charge_360 เฟรมครึ่งแรกตอนชาร์จ ครึ่งหลังตอนปล่อย, voidless_aura วาดหลังตัวละครระหว่างโหมดจุติ)
สเกล ×2–×3 ตามขนาดสกิลจริง
