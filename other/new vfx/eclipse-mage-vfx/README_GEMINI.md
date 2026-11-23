# Mage VFX sprites — วิธีใช้ (ส่งให้ Gemini)

- `sheets/*.png` สไปรต์ชีตเรียงเฟรมแนวนอน ขนาดเฟรมดูใน `mage_manifest.json` (frameWidth, frameHeight, frames, fps, loop, anchor, blend, rotateToVelocity)
- `spell_<A>_<B>` = เวทย์ผสม 36 แบบ (เช่น spell_fire_wind = พายุเพลิงโหม) · `catalyst_<ธาตุ>` = ออร่าตัวเร่งใต้ตัวผู้ร่าย · `orb_<ธาตุ>` = ออร์บธาตุ · `mana_gem` = ผลึกมานา

คำสั่ง:
> คัดลอกโฟลเดอร์ sheets และ mage_manifest.json ไปไว้ใน public/vfx/mage/ แล้วสร้าง loader ที่โหลดภาพตาม manifest
> ฟังก์ชัน drawVfx(ctx, key, x, y, elapsedSec, angle?, scale?): frame = floor(elapsed*fps) (loop ใช้ % frames, ไม่ loop ให้ค้างเฟรมสุดท้ายแล้วจบ)
> วาดด้วย drawImage(sheet, frame*fw, 0, fw, fh, ...) ปิด imageSmoothingEnabled, ใช้ anchor เป็นจุดอ้างอิง, ถ้า blend='lighter' ให้ตั้ง globalCompositeOperation='lighter' ชั่วคราว, ถ้า rotateToVelocity ให้หมุนตามทิศกระสุน
> แทนเอฟเฟกต์เวทย์ผสมเดิมด้วยสไปรต์ตาม id ของคู่ธาตุ (เรียงชื่อธาตุตาม manifest), ใช้ catalyst_<ธาตุที่3> ตอนร่าย, ใช้ orb_* / mana_gem แทนภาพของดรอปเดิม · สเกลขนาดได้ด้วย scale (แนะนำ ×2–×3 ตามรัศมีสกิล)
