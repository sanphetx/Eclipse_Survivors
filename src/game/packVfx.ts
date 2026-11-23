import type { ElementId } from './types';

export interface PackVfxMeta {
  src: string;
  w: number;
  h: number;
  frames: number;
  fps: number;
  loop: boolean;
  anchor: readonly [number, number];
  blend: 'source-over' | 'lighter';
  rotateToVelocity: boolean;
}

export const PACK_VFX = {
  // ============================
  // CLASS SKILLS PACK (35 sheets)
  // ============================
  hunter_shadow_slash: {
    src: '/vfx/class/sheets/hunter_shadow_slash.png',
    w: 96,
    h: 24,
    frames: 6,
    fps: 20,
    loop: false,
    anchor: [0.5, 0.5],
    blend: 'lighter',
    rotateToVelocity: true,
  },
  hunter_afterimage: {
    src: '/vfx/class/sheets/hunter_afterimage.png',
    w: 24,
    h: 32,
    frames: 4,
    fps: 12,
    loop: false,
    anchor: [0.5, 0.5],
    blend: 'source-over',
    rotateToVelocity: false,
  },
  hunter_crit_spark: {
    src: '/vfx/class/sheets/hunter_crit_spark.png',
    w: 40,
    h: 40,
    frames: 5,
    fps: 20,
    loop: false,
    anchor: [0.5, 0.5],
    blend: 'lighter',
    rotateToVelocity: false,
  },
  hunter_dash_charges: {
    src: '/vfx/class/sheets/hunter_dash_charges.png',
    w: 24,
    h: 8,
    frames: 4,
    fps: 1,
    loop: false,
    anchor: [0.5, 0.5],
    blend: 'source-over',
    rotateToVelocity: false,
  },
  hunter_shadow_dagger: {
    src: '/vfx/class/sheets/hunter_shadow_dagger.png',
    w: 16,
    h: 8,
    frames: 4,
    fps: 12,
    loop: true,
    anchor: [0.5, 0.5],
    blend: 'lighter',
    rotateToVelocity: true,
  },
  hunter_ult_moon: {
    src: '/vfx/class/sheets/hunter_ult_moon.png',
    w: 96,
    h: 96,
    frames: 6,
    fps: 6,
    loop: true,
    anchor: [0.5, 0.5],
    blend: 'lighter',
    rotateToVelocity: false,
  },
  knight_sacred_blade: {
    src: '/vfx/class/sheets/knight_sacred_blade.png',
    w: 12,
    h: 36,
    frames: 4,
    fps: 6,
    loop: true,
    anchor: [0.5, 0.5],
    blend: 'source-over',
    rotateToVelocity: true,
  },
  knight_blade_slash: {
    src: '/vfx/class/sheets/knight_blade_slash.png',
    w: 40,
    h: 40,
    frames: 5,
    fps: 18,
    loop: false,
    anchor: [0.5, 0.5],
    blend: 'lighter',
    rotateToVelocity: false,
  },
  knight_parry: {
    src: '/vfx/class/sheets/knight_parry.png',
    w: 56,
    h: 56,
    frames: 5,
    fps: 18,
    loop: false,
    anchor: [0.5, 0.5],
    blend: 'lighter',
    rotateToVelocity: false,
  },
  knight_bulwark_spin: {
    src: '/vfx/class/sheets/knight_bulwark_spin.png',
    w: 80,
    h: 80,
    frames: 8,
    fps: 16,
    loop: false,
    anchor: [0.5, 0.5],
    blend: 'lighter',
    rotateToVelocity: false,
  },
  knight_taunt: {
    src: '/vfx/class/sheets/knight_taunt.png',
    w: 96,
    h: 48,
    frames: 6,
    fps: 12,
    loop: false,
    anchor: [0.5, 0.5],
    blend: 'lighter',
    rotateToVelocity: false,
  },
  knight_excalibur: {
    src: '/vfx/class/sheets/knight_excalibur.png',
    w: 48,
    h: 128,
    frames: 8,
    fps: 14,
    loop: false,
    anchor: [0.5, 1.0],
    blend: 'source-over',
    rotateToVelocity: false,
  },
  saint_sigil: {
    src: '/vfx/class/sheets/saint_sigil.png',
    w: 48,
    h: 48,
    frames: 8,
    fps: 10,
    loop: true,
    anchor: [0.5, 0.5],
    blend: 'lighter',
    rotateToVelocity: false,
  },
  saint_sanctum: {
    src: '/vfx/class/sheets/saint_sanctum.png',
    w: 128,
    h: 96,
    frames: 6,
    fps: 8,
    loop: true,
    anchor: [0.5, 0.5],
    blend: 'lighter',
    rotateToVelocity: false,
  },
  saint_sigil_beam: {
    src: '/vfx/class/sheets/saint_sigil_beam.png',
    w: 64,
    h: 10,
    frames: 6,
    fps: 14,
    loop: true,
    anchor: [0.5, 0.5],
    blend: 'lighter',
    rotateToVelocity: true,
  },
  saint_golem: {
    src: '/vfx/class/sheets/saint_golem.png',
    w: 40,
    h: 48,
    frames: 4,
    fps: 6,
    loop: true,
    anchor: [0.5, 1.0],
    blend: 'source-over',
    rotateToVelocity: false,
  },
  saint_golem_taunt: {
    src: '/vfx/class/sheets/saint_golem_taunt.png',
    w: 128,
    h: 64,
    frames: 6,
    fps: 12,
    loop: false,
    anchor: [0.5, 0.5],
    blend: 'lighter',
    rotateToVelocity: false,
  },
  saint_judgement_pillar: {
    src: '/vfx/class/sheets/saint_judgement_pillar.png',
    w: 44,
    h: 128,
    frames: 8,
    fps: 16,
    loop: false,
    anchor: [0.5, 1.0],
    blend: 'lighter',
    rotateToVelocity: false,
  },
  mage_void_infusion: {
    src: '/vfx/class/sheets/mage_void_infusion.png',
    w: 64,
    h: 64,
    frames: 8,
    fps: 14,
    loop: true,
    anchor: [0.5, 0.5],
    blend: 'lighter',
    rotateToVelocity: false,
  },
  mage_wind_barrier: {
    src: '/vfx/class/sheets/mage_wind_barrier.png',
    w: 72,
    h: 72,
    frames: 8,
    fps: 14,
    loop: true,
    anchor: [0.5, 0.5],
    blend: 'lighter',
    rotateToVelocity: false,
  },
  mage_fusion_cast: {
    src: '/vfx/class/sheets/mage_fusion_cast.png',
    w: 48,
    h: 48,
    frames: 8,
    fps: 18,
    loop: false,
    anchor: [0.5, 0.5],
    blend: 'lighter',
    rotateToVelocity: false,
  },
  chronos_timestop: {
    src: '/vfx/class/sheets/chronos_timestop.png',
    w: 96,
    h: 96,
    frames: 8,
    fps: 8,
    loop: true,
    anchor: [0.5, 0.5],
    blend: 'lighter',
    rotateToVelocity: false,
  },
  chronos_ripple: {
    src: '/vfx/class/sheets/chronos_ripple.png',
    w: 128,
    h: 64,
    frames: 6,
    fps: 14,
    loop: false,
    anchor: [0.5, 0.5],
    blend: 'lighter',
    rotateToVelocity: false,
  },
  death_scythe_nova: {
    src: '/vfx/class/sheets/death_scythe_nova.png',
    w: 96,
    h: 96,
    frames: 7,
    fps: 16,
    loop: false,
    anchor: [0.5, 0.5],
    blend: 'lighter',
    rotateToVelocity: false,
  },
  death_soul_wisp: {
    src: '/vfx/class/sheets/death_soul_wisp.png',
    w: 16,
    h: 24,
    frames: 6,
    fps: 10,
    loop: true,
    anchor: [0.5, 0.5],
    blend: 'lighter',
    rotateToVelocity: false,
  },
  spellblade_wave_fire: {
    src: '/vfx/class/sheets/spellblade_wave_fire.png',
    w: 64,
    h: 48,
    frames: 6,
    fps: 16,
    loop: false,
    anchor: [0.5, 0.5],
    blend: 'lighter',
    rotateToVelocity: true,
  },
  spellblade_wave_water: {
    src: '/vfx/class/sheets/spellblade_wave_water.png',
    w: 64,
    h: 48,
    frames: 6,
    fps: 16,
    loop: false,
    anchor: [0.5, 0.5],
    blend: 'lighter',
    rotateToVelocity: true,
  },
  spellblade_wave_wind: {
    src: '/vfx/class/sheets/spellblade_wave_wind.png',
    w: 64,
    h: 48,
    frames: 6,
    fps: 16,
    loop: false,
    anchor: [0.5, 0.5],
    blend: 'lighter',
    rotateToVelocity: true,
  },
  spellblade_wave_light: {
    src: '/vfx/class/sheets/spellblade_wave_light.png',
    w: 64,
    h: 48,
    frames: 6,
    fps: 16,
    loop: false,
    anchor: [0.5, 0.5],
    blend: 'lighter',
    rotateToVelocity: true,
  },
  spellblade_wave_dark: {
    src: '/vfx/class/sheets/spellblade_wave_dark.png',
    w: 64,
    h: 48,
    frames: 6,
    fps: 16,
    loop: false,
    anchor: [0.5, 0.5],
    blend: 'lighter',
    rotateToVelocity: true,
  },
  spellblade_charge_360: {
    src: '/vfx/class/sheets/spellblade_charge_360.png',
    w: 96,
    h: 96,
    frames: 8,
    fps: 12,
    loop: false,
    anchor: [0.5, 0.5],
    blend: 'lighter',
    rotateToVelocity: false,
  },
  voidless_aura: {
    src: '/vfx/class/sheets/voidless_aura.png',
    w: 48,
    h: 72,
    frames: 8,
    fps: 12,
    loop: true,
    anchor: [0.5, 0.5],
    blend: 'lighter',
    rotateToVelocity: false,
  },
  voidless_heaven_pillar: {
    src: '/vfx/class/sheets/voidless_heaven_pillar.png',
    w: 40,
    h: 128,
    frames: 8,
    fps: 16,
    loop: false,
    anchor: [0.5, 1.0],
    blend: 'lighter',
    rotateToVelocity: false,
  },
  voidless_spirit_sword: {
    src: '/vfx/class/sheets/voidless_spirit_sword.png',
    w: 12,
    h: 36,
    frames: 4,
    fps: 6,
    loop: true,
    anchor: [0.5, 0.5],
    blend: 'lighter',
    rotateToVelocity: true,
  },
  voidless_awaken_burst: {
    src: '/vfx/class/sheets/voidless_awaken_burst.png',
    w: 96,
    h: 96,
    frames: 8,
    fps: 16,
    loop: false,
    anchor: [0.5, 0.5],
    blend: 'lighter',
    rotateToVelocity: false,
  },

  // ============================
  // WEAPONS PACK (38 sheets)
  // ============================
  banana: {
    src: '/vfx/weapons/sheets/banana.png',
    w: 24,
    h: 24,
    frames: 4,
    fps: 14,
    loop: true,
    anchor: [0.5, 0.5],
    blend: 'source-over',
    rotateToVelocity: false,
  },
  banana_evo: {
    src: '/vfx/weapons/sheets/banana_evo.png',
    w: 24,
    h: 24,
    frames: 4,
    fps: 14,
    loop: true,
    anchor: [0.5, 0.5],
    blend: 'source-over',
    rotateToVelocity: false,
  },
  axe: {
    src: '/vfx/weapons/sheets/axe.png',
    w: 32,
    h: 32,
    frames: 4,
    fps: 14,
    loop: true,
    anchor: [0.5, 0.5],
    blend: 'source-over',
    rotateToVelocity: false,
  },
  axe_evo: {
    src: '/vfx/weapons/sheets/axe_evo.png',
    w: 40,
    h: 40,
    frames: 4,
    fps: 14,
    loop: true,
    anchor: [0.5, 0.5],
    blend: 'source-over',
    rotateToVelocity: false,
  },
  dagger: {
    src: '/vfx/weapons/sheets/dagger.png',
    w: 24,
    h: 12,
    frames: 2,
    fps: 8,
    loop: true,
    anchor: [0.65, 0.5],
    blend: 'source-over',
    rotateToVelocity: true,
  },
  dagger_evo: {
    src: '/vfx/weapons/sheets/dagger_evo.png',
    w: 34,
    h: 14,
    frames: 2,
    fps: 8,
    loop: true,
    anchor: [0.65, 0.5],
    blend: 'source-over',
    rotateToVelocity: true,
  },
  katana: {
    src: '/vfx/weapons/sheets/katana.png',
    w: 64,
    h: 64,
    frames: 5,
    fps: 20,
    loop: false,
    anchor: [0.5, 0.5],
    blend: 'lighter',
    rotateToVelocity: true,
  },
  katana_evo: {
    src: '/vfx/weapons/sheets/katana_evo.png',
    w: 64,
    h: 64,
    frames: 5,
    fps: 20,
    loop: false,
    anchor: [0.5, 0.5],
    blend: 'lighter',
    rotateToVelocity: true,
  },
  spear: {
    src: '/vfx/weapons/sheets/spear.png',
    w: 48,
    h: 12,
    frames: 2,
    fps: 10,
    loop: true,
    anchor: [0.7, 0.5],
    blend: 'source-over',
    rotateToVelocity: true,
  },
  spear_evo: {
    src: '/vfx/weapons/sheets/spear_evo.png',
    w: 64,
    h: 18,
    frames: 4,
    fps: 10,
    loop: true,
    anchor: [0.7, 0.5],
    blend: 'source-over',
    rotateToVelocity: true,
  },
  cat: {
    src: '/vfx/weapons/sheets/cat.png',
    w: 24,
    h: 24,
    frames: 4,
    fps: 12,
    loop: true,
    anchor: [0.5, 0.75],
    blend: 'source-over',
    rotateToVelocity: false,
  },
  cat_evo: {
    src: '/vfx/weapons/sheets/cat_evo.png',
    w: 24,
    h: 24,
    frames: 4,
    fps: 12,
    loop: true,
    anchor: [0.5, 0.75],
    blend: 'source-over',
    rotateToVelocity: false,
  },
  bird: {
    src: '/vfx/weapons/sheets/bird.png',
    w: 24,
    h: 24,
    frames: 4,
    fps: 12,
    loop: true,
    anchor: [0.5, 0.55],
    blend: 'source-over',
    rotateToVelocity: true,
  },
  bird_evo: {
    src: '/vfx/weapons/sheets/bird_evo.png',
    w: 24,
    h: 24,
    frames: 4,
    fps: 12,
    loop: true,
    anchor: [0.5, 0.55],
    blend: 'source-over',
    rotateToVelocity: true,
  },
  wand_missile: {
    src: '/vfx/weapons/sheets/wand_missile.png',
    w: 24,
    h: 24,
    frames: 4,
    fps: 14,
    loop: true,
    anchor: [0.62, 0.5],
    blend: 'lighter',
    rotateToVelocity: true,
  },
  wand_missile_evo: {
    src: '/vfx/weapons/sheets/wand_missile_evo.png',
    w: 32,
    h: 32,
    frames: 4,
    fps: 14,
    loop: true,
    anchor: [0.62, 0.5],
    blend: 'lighter',
    rotateToVelocity: true,
  },
  lightning_zap: {
    src: '/vfx/weapons/sheets/lightning_zap.png',
    w: 32,
    h: 32,
    frames: 4,
    fps: 18,
    loop: true,
    anchor: [0.5, 0.5],
    blend: 'lighter',
    rotateToVelocity: false,
  },
  lightning_cloud_evo: {
    src: '/vfx/weapons/sheets/lightning_cloud_evo.png',
    w: 64,
    h: 32,
    frames: 4,
    fps: 8,
    loop: true,
    anchor: [0.5, 0.5],
    blend: 'source-over',
    rotateToVelocity: false,
  },
  fireorb: {
    src: '/vfx/weapons/sheets/fireorb.png',
    w: 24,
    h: 24,
    frames: 4,
    fps: 12,
    loop: true,
    anchor: [0.5, 0.5],
    blend: 'lighter',
    rotateToVelocity: false,
  },
  fireorb_evo: {
    src: '/vfx/weapons/sheets/fireorb_evo.png',
    w: 36,
    h: 36,
    frames: 4,
    fps: 12,
    loop: true,
    anchor: [0.5, 0.5],
    blend: 'lighter',
    rotateToVelocity: false,
  },
  frost_flake: {
    src: '/vfx/weapons/sheets/frost_flake.png',
    w: 16,
    h: 16,
    frames: 4,
    fps: 10,
    loop: true,
    anchor: [0.5, 0.5],
    blend: 'lighter',
    rotateToVelocity: false,
  },
  frost_flake_evo: {
    src: '/vfx/weapons/sheets/frost_flake_evo.png',
    w: 24,
    h: 24,
    frames: 4,
    fps: 10,
    loop: true,
    anchor: [0.5, 0.5],
    blend: 'lighter',
    rotateToVelocity: false,
  },
  meteor: {
    src: '/vfx/weapons/sheets/meteor.png',
    w: 32,
    h: 32,
    frames: 4,
    fps: 12,
    loop: true,
    anchor: [0.34, 0.66],
    blend: 'source-over',
    rotateToVelocity: false,
  },
  meteor_evo: {
    src: '/vfx/weapons/sheets/meteor_evo.png',
    w: 48,
    h: 48,
    frames: 4,
    fps: 12,
    loop: true,
    anchor: [0.34, 0.66],
    blend: 'source-over',
    rotateToVelocity: false,
  },
  laser_tile: {
    src: '/vfx/weapons/sheets/laser_tile.png',
    w: 32,
    h: 12,
    frames: 4,
    fps: 14,
    loop: true,
    anchor: [0.0, 0.5],
    blend: 'lighter',
    rotateToVelocity: true,
  },
  laser_tile_evo: {
    src: '/vfx/weapons/sheets/laser_tile_evo.png',
    w: 32,
    h: 12,
    frames: 4,
    fps: 14,
    loop: true,
    anchor: [0.0, 0.5],
    blend: 'lighter',
    rotateToVelocity: true,
  },
  water_bolt: {
    src: '/vfx/weapons/sheets/water_bolt.png',
    w: 16,
    h: 12,
    frames: 4,
    fps: 14,
    loop: true,
    anchor: [0.8, 0.5],
    blend: 'source-over',
    rotateToVelocity: true,
  },
  water_bolt_evo: {
    src: '/vfx/weapons/sheets/water_bolt_evo.png',
    w: 28,
    h: 14,
    frames: 4,
    fps: 14,
    loop: true,
    anchor: [0.8, 0.5],
    blend: 'source-over',
    rotateToVelocity: true,
  },
  shield: {
    src: '/vfx/weapons/sheets/shield.png',
    w: 24,
    h: 24,
    frames: 4,
    fps: 10,
    loop: true,
    anchor: [0.5, 0.5],
    blend: 'source-over',
    rotateToVelocity: false,
  },
  shield_evo: {
    src: '/vfx/weapons/sheets/shield_evo.png',
    w: 24,
    h: 24,
    frames: 4,
    fps: 10,
    loop: true,
    anchor: [0.5, 0.5],
    blend: 'source-over',
    rotateToVelocity: false,
  },
  garlic_aura: {
    src: '/vfx/weapons/sheets/garlic_aura.png',
    w: 96,
    h: 96,
    frames: 6,
    fps: 10,
    loop: true,
    anchor: [0.5, 0.5],
    blend: 'lighter',
    rotateToVelocity: false,
  },
  garlic_aura_evo: {
    src: '/vfx/weapons/sheets/garlic_aura_evo.png',
    w: 96,
    h: 96,
    frames: 6,
    fps: 10,
    loop: true,
    anchor: [0.5, 0.5],
    blend: 'lighter',
    rotateToVelocity: false,
  },
  mace_quake: {
    src: '/vfx/weapons/sheets/mace_quake.png',
    w: 96,
    h: 96,
    frames: 6,
    fps: 14,
    loop: false,
    anchor: [0.5, 0.5],
    blend: 'source-over',
    rotateToVelocity: false,
  },
  mace_quake_evo: {
    src: '/vfx/weapons/sheets/mace_quake_evo.png',
    w: 96,
    h: 96,
    frames: 6,
    fps: 14,
    loop: false,
    anchor: [0.5, 0.5],
    blend: 'source-over',
    rotateToVelocity: false,
  },
  chain_ball: {
    src: '/vfx/weapons/sheets/chain_ball.png',
    w: 24,
    h: 24,
    frames: 4,
    fps: 16,
    loop: true,
    anchor: [0.5, 0.5],
    blend: 'source-over',
    rotateToVelocity: false,
  },
  chain_ball_evo: {
    src: '/vfx/weapons/sheets/chain_ball_evo.png',
    w: 24,
    h: 24,
    frames: 4,
    fps: 16,
    loop: true,
    anchor: [0.5, 0.5],
    blend: 'source-over',
    rotateToVelocity: false,
  },
  totem: {
    src: '/vfx/weapons/sheets/totem.png',
    w: 24,
    h: 56,
    frames: 4,
    fps: 6,
    loop: true,
    anchor: [0.5, 0.96],
    blend: 'source-over',
    rotateToVelocity: false,
  },
  totem_evo: {
    src: '/vfx/weapons/sheets/totem_evo.png',
    w: 24,
    h: 56,
    frames: 4,
    fps: 6,
    loop: true,
    anchor: [0.5, 0.96],
    blend: 'source-over',
    rotateToVelocity: false,
  },

  // ============================
  // MAGE PACK (53 sheets)
  // ============================
  spell_fire_wind: {
    src: '/vfx/mage/sheets/spell_fire_wind.png',
    w: 56,
    h: 72,
    frames: 8,
    fps: 12,
    loop: true,
    anchor: [0.5, 0.5],
    blend: 'lighter',
    rotateToVelocity: false,
  },
  spell_fire_water: {
    src: '/vfx/mage/sheets/spell_fire_water.png',
    w: 64,
    h: 64,
    frames: 8,
    fps: 16,
    loop: false,
    anchor: [0.5, 0.5],
    blend: 'lighter',
    rotateToVelocity: false,
  },
  spell_fire_earth: {
    src: '/vfx/mage/sheets/spell_fire_earth.png',
    w: 56,
    h: 48,
    frames: 7,
    fps: 14,
    loop: false,
    anchor: [0.5, 1.0],
    blend: 'source-over',
    rotateToVelocity: false,
  },
  spell_fire_stone: {
    src: '/vfx/mage/sheets/spell_fire_stone.png',
    w: 48,
    h: 64,
    frames: 6,
    fps: 14,
    loop: true,
    anchor: [0.5, 0.5],
    blend: 'source-over',
    rotateToVelocity: true,
  },
  spell_fire_dark: {
    src: '/vfx/mage/sheets/spell_fire_dark.png',
    w: 64,
    h: 64,
    frames: 8,
    fps: 16,
    loop: false,
    anchor: [0.5, 0.5],
    blend: 'lighter',
    rotateToVelocity: false,
  },
  spell_fire_light: {
    src: '/vfx/mage/sheets/spell_fire_light.png',
    w: 72,
    h: 72,
    frames: 6,
    fps: 12,
    loop: false,
    anchor: [0.5, 0.5],
    blend: 'lighter',
    rotateToVelocity: false,
  },
  spell_fire_blood: {
    src: '/vfx/mage/sheets/spell_fire_blood.png',
    w: 64,
    h: 64,
    frames: 8,
    fps: 16,
    loop: false,
    anchor: [0.5, 0.5],
    blend: 'lighter',
    rotateToVelocity: false,
  },
  spell_water_wind: {
    src: '/vfx/mage/sheets/spell_water_wind.png',
    w: 40,
    h: 48,
    frames: 4,
    fps: 6,
    loop: true,
    anchor: [0.5, 1.0],
    blend: 'source-over',
    rotateToVelocity: false,
  },
  spell_water_earth: {
    src: '/vfx/mage/sheets/spell_water_earth.png',
    w: 72,
    h: 40,
    frames: 6,
    fps: 8,
    loop: true,
    anchor: [0.5, 0.5],
    blend: 'source-over',
    rotateToVelocity: false,
  },
  spell_water_stone: {
    src: '/vfx/mage/sheets/spell_water_stone.png',
    w: 24,
    h: 12,
    frames: 4,
    fps: 12,
    loop: true,
    anchor: [0.5, 0.5],
    blend: 'lighter',
    rotateToVelocity: true,
  },
  spell_water_dark: {
    src: '/vfx/mage/sheets/spell_water_dark.png',
    w: 64,
    h: 48,
    frames: 6,
    fps: 12,
    loop: true,
    anchor: [0.5, 0.5],
    blend: 'source-over',
    rotateToVelocity: true,
  },
  spell_water_light: {
    src: '/vfx/mage/sheets/spell_water_light.png',
    w: 48,
    h: 64,
    frames: 8,
    fps: 10,
    loop: true,
    anchor: [0.5, 0.5],
    blend: 'lighter',
    rotateToVelocity: false,
  },
  spell_water_blood: {
    src: '/vfx/mage/sheets/spell_water_blood.png',
    w: 80,
    h: 80,
    frames: 6,
    fps: 14,
    loop: false,
    anchor: [0.5, 0.5],
    blend: 'source-over',
    rotateToVelocity: false,
  },
  spell_wind_earth: {
    src: '/vfx/mage/sheets/spell_wind_earth.png',
    w: 56,
    h: 72,
    frames: 8,
    fps: 12,
    loop: true,
    anchor: [0.5, 0.5],
    blend: 'source-over',
    rotateToVelocity: false,
  },
  spell_wind_stone: {
    src: '/vfx/mage/sheets/spell_wind_stone.png',
    w: 16,
    h: 10,
    frames: 4,
    fps: 12,
    loop: true,
    anchor: [0.5, 0.5],
    blend: 'source-over',
    rotateToVelocity: true,
  },
  spell_wind_dark: {
    src: '/vfx/mage/sheets/spell_wind_dark.png',
    w: 64,
    h: 64,
    frames: 8,
    fps: 14,
    loop: true,
    anchor: [0.5, 0.5],
    blend: 'lighter',
    rotateToVelocity: false,
  },
  spell_wind_light: {
    src: '/vfx/mage/sheets/spell_wind_light.png',
    w: 64,
    h: 48,
    frames: 6,
    fps: 10,
    loop: true,
    anchor: [0.5, 0.5],
    blend: 'lighter',
    rotateToVelocity: true,
  },
  spell_wind_blood: {
    src: '/vfx/mage/sheets/spell_wind_blood.png',
    w: 64,
    h: 64,
    frames: 8,
    fps: 14,
    loop: true,
    anchor: [0.5, 0.5],
    blend: 'lighter',
    rotateToVelocity: false,
  },
  spell_earth_stone: {
    src: '/vfx/mage/sheets/spell_earth_stone.png',
    w: 40,
    h: 48,
    frames: 4,
    fps: 6,
    loop: true,
    anchor: [0.5, 1.0],
    blend: 'source-over',
    rotateToVelocity: false,
  },
  spell_earth_dark: {
    src: '/vfx/mage/sheets/spell_earth_dark.png',
    w: 56,
    h: 48,
    frames: 7,
    fps: 14,
    loop: false,
    anchor: [0.5, 1.0],
    blend: 'source-over',
    rotateToVelocity: false,
  },
  spell_earth_light: {
    src: '/vfx/mage/sheets/spell_earth_light.png',
    w: 36,
    h: 96,
    frames: 8,
    fps: 16,
    loop: false,
    anchor: [0.5, 1.0],
    blend: 'lighter',
    rotateToVelocity: false,
  },
  spell_earth_blood: {
    src: '/vfx/mage/sheets/spell_earth_blood.png',
    w: 56,
    h: 48,
    frames: 7,
    fps: 14,
    loop: false,
    anchor: [0.5, 1.0],
    blend: 'source-over',
    rotateToVelocity: false,
  },
  spell_stone_dark: {
    src: '/vfx/mage/sheets/spell_stone_dark.png',
    w: 44,
    h: 44,
    frames: 4,
    fps: 10,
    loop: true,
    anchor: [0.5, 0.5],
    blend: 'source-over',
    rotateToVelocity: false,
  },
  spell_stone_light: {
    src: '/vfx/mage/sheets/spell_stone_light.png',
    w: 96,
    h: 24,
    frames: 6,
    fps: 14,
    loop: true,
    anchor: [0.5, 0.5],
    blend: 'lighter',
    rotateToVelocity: true,
  },
  spell_stone_blood: {
    src: '/vfx/mage/sheets/spell_stone_blood.png',
    w: 40,
    h: 40,
    frames: 4,
    fps: 10,
    loop: true,
    anchor: [0.5, 0.5],
    blend: 'source-over',
    rotateToVelocity: false,
  },
  spell_dark_light: {
    src: '/vfx/mage/sheets/spell_dark_light.png',
    w: 72,
    h: 72,
    frames: 6,
    fps: 12,
    loop: false,
    anchor: [0.5, 0.5],
    blend: 'lighter',
    rotateToVelocity: false,
  },
  spell_dark_blood: {
    src: '/vfx/mage/sheets/spell_dark_blood.png',
    w: 48,
    h: 32,
    frames: 4,
    fps: 10,
    loop: true,
    anchor: [0.5, 0.5],
    blend: 'source-over',
    rotateToVelocity: false,
  },
  spell_light_blood: {
    src: '/vfx/mage/sheets/spell_light_blood.png',
    w: 80,
    h: 40,
    frames: 6,
    fps: 14,
    loop: false,
    anchor: [0.5, 0.5],
    blend: 'lighter',
    rotateToVelocity: false,
  },
  spell_earth_earth: {
    src: '/vfx/mage/sheets/spell_earth_earth.png',
    w: 96,
    h: 48,
    frames: 6,
    fps: 14,
    loop: false,
    anchor: [0.5, 0.5],
    blend: 'source-over',
    rotateToVelocity: false,
  },
  spell_water_water: {
    src: '/vfx/mage/sheets/spell_water_water.png',
    w: 72,
    h: 56,
    frames: 6,
    fps: 12,
    loop: true,
    anchor: [0.5, 0.5],
    blend: 'source-over',
    rotateToVelocity: true,
  },
  spell_wind_wind: {
    src: '/vfx/mage/sheets/spell_wind_wind.png',
    w: 48,
    h: 48,
    frames: 5,
    fps: 18,
    loop: false,
    anchor: [0.5, 0.5],
    blend: 'lighter',
    rotateToVelocity: false,
  },
  spell_fire_fire: {
    src: '/vfx/mage/sheets/spell_fire_fire.png',
    w: 80,
    h: 80,
    frames: 8,
    fps: 16,
    loop: false,
    anchor: [0.5, 0.5],
    blend: 'lighter',
    rotateToVelocity: false,
  },
  spell_stone_stone: {
    src: '/vfx/mage/sheets/spell_stone_stone.png',
    w: 48,
    h: 48,
    frames: 4,
    fps: 10,
    loop: true,
    anchor: [0.5, 0.5],
    blend: 'source-over',
    rotateToVelocity: false,
  },
  spell_dark_dark: {
    src: '/vfx/mage/sheets/spell_dark_dark.png',
    w: 64,
    h: 64,
    frames: 8,
    fps: 12,
    loop: true,
    anchor: [0.5, 0.5],
    blend: 'source-over',
    rotateToVelocity: false,
  },
  spell_light_light: {
    src: '/vfx/mage/sheets/spell_light_light.png',
    w: 40,
    h: 96,
    frames: 8,
    fps: 16,
    loop: false,
    anchor: [0.5, 1.0],
    blend: 'lighter',
    rotateToVelocity: false,
  },
  spell_blood_blood: {
    src: '/vfx/mage/sheets/spell_blood_blood.png',
    w: 72,
    h: 48,
    frames: 7,
    fps: 14,
    loop: false,
    anchor: [0.5, 1.0],
    blend: 'source-over',
    rotateToVelocity: false,
  },
  catalyst_fire: {
    src: '/vfx/mage/sheets/catalyst_fire.png',
    w: 48,
    h: 48,
    frames: 8,
    fps: 12,
    loop: true,
    anchor: [0.5, 0.5],
    blend: 'lighter',
    rotateToVelocity: false,
  },
  catalyst_water: {
    src: '/vfx/mage/sheets/catalyst_water.png',
    w: 48,
    h: 48,
    frames: 8,
    fps: 12,
    loop: true,
    anchor: [0.5, 0.5],
    blend: 'lighter',
    rotateToVelocity: false,
  },
  catalyst_wind: {
    src: '/vfx/mage/sheets/catalyst_wind.png',
    w: 48,
    h: 48,
    frames: 8,
    fps: 12,
    loop: true,
    anchor: [0.5, 0.5],
    blend: 'lighter',
    rotateToVelocity: false,
  },
  catalyst_earth: {
    src: '/vfx/mage/sheets/catalyst_earth.png',
    w: 48,
    h: 48,
    frames: 8,
    fps: 12,
    loop: true,
    anchor: [0.5, 0.5],
    blend: 'lighter',
    rotateToVelocity: false,
  },
  catalyst_stone: {
    src: '/vfx/mage/sheets/catalyst_stone.png',
    w: 48,
    h: 48,
    frames: 8,
    fps: 12,
    loop: true,
    anchor: [0.5, 0.5],
    blend: 'lighter',
    rotateToVelocity: false,
  },
  catalyst_dark: {
    src: '/vfx/mage/sheets/catalyst_dark.png',
    w: 48,
    h: 48,
    frames: 8,
    fps: 12,
    loop: true,
    anchor: [0.5, 0.5],
    blend: 'lighter',
    rotateToVelocity: false,
  },
  catalyst_light: {
    src: '/vfx/mage/sheets/catalyst_light.png',
    w: 48,
    h: 48,
    frames: 8,
    fps: 12,
    loop: true,
    anchor: [0.5, 0.5],
    blend: 'lighter',
    rotateToVelocity: false,
  },
  catalyst_blood: {
    src: '/vfx/mage/sheets/catalyst_blood.png',
    w: 48,
    h: 48,
    frames: 8,
    fps: 12,
    loop: true,
    anchor: [0.5, 0.5],
    blend: 'lighter',
    rotateToVelocity: false,
  },
  orb_fire: {
    src: '/vfx/mage/sheets/orb_fire.png',
    w: 16,
    h: 16,
    frames: 6,
    fps: 10,
    loop: true,
    anchor: [0.5, 0.5],
    blend: 'source-over',
    rotateToVelocity: false,
  },
  orb_water: {
    src: '/vfx/mage/sheets/orb_water.png',
    w: 16,
    h: 16,
    frames: 6,
    fps: 10,
    loop: true,
    anchor: [0.5, 0.5],
    blend: 'source-over',
    rotateToVelocity: false,
  },
  orb_wind: {
    src: '/vfx/mage/sheets/orb_wind.png',
    w: 16,
    h: 16,
    frames: 6,
    fps: 10,
    loop: true,
    anchor: [0.5, 0.5],
    blend: 'source-over',
    rotateToVelocity: false,
  },
  orb_earth: {
    src: '/vfx/mage/sheets/orb_earth.png',
    w: 16,
    h: 16,
    frames: 6,
    fps: 10,
    loop: true,
    anchor: [0.5, 0.5],
    blend: 'source-over',
    rotateToVelocity: false,
  },
  orb_stone: {
    src: '/vfx/mage/sheets/orb_stone.png',
    w: 16,
    h: 16,
    frames: 6,
    fps: 10,
    loop: true,
    anchor: [0.5, 0.5],
    blend: 'source-over',
    rotateToVelocity: false,
  },
  orb_dark: {
    src: '/vfx/mage/sheets/orb_dark.png',
    w: 16,
    h: 16,
    frames: 6,
    fps: 10,
    loop: true,
    anchor: [0.5, 0.5],
    blend: 'source-over',
    rotateToVelocity: false,
  },
  orb_light: {
    src: '/vfx/mage/sheets/orb_light.png',
    w: 16,
    h: 16,
    frames: 6,
    fps: 10,
    loop: true,
    anchor: [0.5, 0.5],
    blend: 'source-over',
    rotateToVelocity: false,
  },
  orb_blood: {
    src: '/vfx/mage/sheets/orb_blood.png',
    w: 16,
    h: 16,
    frames: 6,
    fps: 10,
    loop: true,
    anchor: [0.5, 0.5],
    blend: 'source-over',
    rotateToVelocity: false,
  },
  mana_gem: {
    src: '/vfx/mage/sheets/mana_gem.png',
    w: 12,
    h: 16,
    frames: 6,
    fps: 8,
    loop: true,
    anchor: [0.5, 0.5],
    blend: 'source-over',
    rotateToVelocity: false,
  },
} as const satisfies Record<string, PackVfxMeta>;

export type PackVfxKey = keyof typeof PACK_VFX;

const imageCache = new Map<string, HTMLImageElement>();
const tintCache = new Map<string, HTMLCanvasElement>();
let preloadedAll = false;

function getOrLoadImage(src: string): HTMLImageElement {
  let img = imageCache.get(src);
  if (!img && typeof Image !== 'undefined') {
    img = new Image();
    img.src = src;
    imageCache.set(src, img);
  }
  return img!;
}

export function preloadPackVfx(): void {
  if (preloadedAll || typeof Image === 'undefined') return;
  preloadedAll = true;
  for (const key of Object.keys(PACK_VFX) as PackVfxKey[]) {
    getOrLoadImage(PACK_VFX[key].src);
  }
}

export function isPackVfxReady(key: PackVfxKey): boolean {
  const meta = PACK_VFX[key];
  if (!meta) return false;
  const img = getOrLoadImage(meta.src);
  return Boolean(img && img.complete && img.naturalWidth > 0);
}

function getTintedFrameCanvas(
  key: PackVfxKey,
  img: HTMLImageElement,
  frame: number,
  tintColor: string,
  tintAlpha = 0.55
): HTMLCanvasElement | null {
  if (typeof document === 'undefined') return null;
  const meta = PACK_VFX[key];
  const cacheKey = `${key}:${frame}:${tintColor}:${tintAlpha}`;
  const existing = tintCache.get(cacheKey);
  if (existing) return existing;

  const off = document.createElement('canvas');
  off.width = meta.w;
  off.height = meta.h;
  const octx = off.getContext('2d');
  if (!octx) return null;
  octx.imageSmoothingEnabled = false;
  octx.drawImage(img, frame * meta.w, 0, meta.w, meta.h, 0, 0, meta.w, meta.h);
  octx.globalCompositeOperation = 'source-atop';
  octx.globalAlpha = tintAlpha;
  octx.fillStyle = tintColor;
  octx.fillRect(0, 0, meta.w, meta.h);
  octx.globalCompositeOperation = 'source-over';
  octx.globalAlpha = 1;
  if (tintCache.size > 400) tintCache.clear();
  tintCache.set(cacheKey, off);
  return off;
}

export interface DrawPackVfxOpts {
  scale?: number;
  scaleX?: number;
  scaleY?: number;
  targetW?: number;
  targetH?: number;
  angle?: number;
  squashY?: number;
  alpha?: number;
  flipX?: boolean;
  frameOverride?: number;
  tintColor?: string;
  tintAlpha?: number;
  blendOverride?: 'source-over' | 'lighter';
  zOffset?: number;
}

export function drawPackVfx(
  ctx: CanvasRenderingContext2D,
  key: PackVfxKey,
  x: number,
  y: number,
  elapsedSec: number,
  opts?: DrawPackVfxOpts
): boolean {
  const meta = PACK_VFX[key];
  if (!meta) return false;
  const img = getOrLoadImage(meta.src);
  if (!img || !img.complete || img.naturalWidth <= 0) return false;

  const rawFrame =
    opts?.frameOverride !== undefined
      ? Math.max(0, Math.min(meta.frames - 1, Math.floor(opts.frameOverride)))
      : meta.loop
        ? Math.floor(Math.max(0, elapsedSec) * meta.fps) % meta.frames
        : Math.min(meta.frames - 1, Math.floor(Math.max(0, elapsedSec) * meta.fps));

  const dw = opts?.targetW ?? meta.w * (opts?.scaleX ?? opts?.scale ?? 1);
  const dh = opts?.targetH ?? meta.h * (opts?.scaleY ?? opts?.scale ?? 1);
  const rot = opts?.angle ?? 0;

  ctx.save();
  ctx.translate(x, y - (opts?.zOffset ?? 0));
  if (opts?.squashY !== undefined && opts.squashY !== 1) {
    ctx.scale(1, opts.squashY);
  }
  if (rot !== 0) {
    ctx.rotate(rot);
  }
  if (opts?.flipX) {
    ctx.scale(-1, 1);
  }
  ctx.imageSmoothingEnabled = false;
  const blend = opts?.blendOverride ?? meta.blend;
  if (blend === 'lighter') {
    ctx.globalCompositeOperation = 'lighter';
  }
  if (opts?.alpha !== undefined) {
    ctx.globalAlpha *= Math.max(0, Math.min(1, opts.alpha));
  }

  const drawX = -dw * meta.anchor[0];
  const drawY = -dh * meta.anchor[1];
  if (opts?.tintColor) {
    const tinted = getTintedFrameCanvas(key, img, rawFrame, opts.tintColor, opts.tintAlpha ?? 0.55);
    if (tinted) {
      ctx.drawImage(tinted, 0, 0, meta.w, meta.h, drawX, drawY, dw, dh);
      ctx.restore();
      return true;
    }
  }

  ctx.drawImage(
    img,
    rawFrame * meta.w,
    0,
    meta.w,
    meta.h,
    drawX,
    drawY,
    dw,
    dh
  );
  ctx.restore();
  return true;
}

export function drawPackVfxTiledBeam(
  ctx: CanvasRenderingContext2D,
  key: PackVfxKey,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  elapsedSec: number,
  thickness: number,
  alpha = 1
): boolean {
  const meta = PACK_VFX[key];
  if (!meta) return false;
  const img = getOrLoadImage(meta.src);
  if (!img || !img.complete || img.naturalWidth <= 0) return false;

  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.hypot(dx, dy);
  if (len <= 2) return true;

  const angle = Math.atan2(dy, dx);
  const frame = meta.loop
    ? Math.floor(Math.max(0, elapsedSec) * meta.fps) % meta.frames
    : Math.min(meta.frames - 1, Math.floor(Math.max(0, elapsedSec) * meta.fps));
  const segLen = Math.max(16, meta.w * (thickness / meta.h));

  ctx.save();
  ctx.translate(x1, y1);
  ctx.rotate(angle);
  ctx.imageSmoothingEnabled = false;
  if (meta.blend === 'lighter') ctx.globalCompositeOperation = 'lighter';
  ctx.globalAlpha *= Math.max(0, Math.min(1, alpha));

  let curX = 0;
  while (curX < len) {
    const rem = len - curX;
    const drawLen = Math.min(segLen, rem);
    const srcW = (drawLen / segLen) * meta.w;
    ctx.drawImage(
      img,
      frame * meta.w,
      0,
      srcW,
      meta.h,
      curX,
      -thickness * 0.5,
      drawLen,
      thickness
    );
    curX += drawLen;
  }

  ctx.restore();
  return true;
}

export function getMageSpellVfxKey(a: ElementId, b: ElementId): PackVfxKey {
  const ab = `spell_${a}_${b}` as PackVfxKey;
  if (ab in PACK_VFX) return ab;
  const ba = `spell_${b}_${a}` as PackVfxKey;
  if (ba in PACK_VFX) return ba;
  return 'mage_fusion_cast';
}

export function getSpellbladeWaveKey(el: ElementId | null): { key: PackVfxKey; tint?: string } {
  switch (el) {
    case 'fire':
      return { key: 'spellblade_wave_fire' };
    case 'water':
      return { key: 'spellblade_wave_water' };
    case 'wind':
      return { key: 'spellblade_wave_wind' };
    case 'light':
      return { key: 'spellblade_wave_light' };
    case 'dark':
      return { key: 'spellblade_wave_dark' };
    case 'earth':
      return { key: 'spellblade_wave_fire', tint: '#B45309' };
    case 'stone':
      return { key: 'spellblade_wave_light', tint: '#94A3B8' };
    case 'blood':
      return { key: 'spellblade_wave_dark', tint: '#E11D48' };
    default:
      return { key: 'spellblade_wave_light', tint: '#F59E0B' };
  }
}

export interface PackVfxInstance {
  key: PackVfxKey;
  x: number;
  y: number;
  elapsed: number;
  life: number;
  maxLife: number;
  scale: number;
  scaleX?: number;
  scaleY?: number;
  angle: number;
  alpha: number;
  flipX?: boolean;
  groundPlane?: boolean;
  frameOverride?: number;
  tintColor?: string;
  zOffset?: number;
}

export function spawnPackVfx(
  list: PackVfxInstance[],
  key: PackVfxKey,
  x: number,
  y: number,
  opts?: {
    scale?: number;
    scaleX?: number;
    scaleY?: number;
    angle?: number;
    life?: number;
    alpha?: number;
    flipX?: boolean;
    groundPlane?: boolean;
    frameOverride?: number;
    tintColor?: string;
    zOffset?: number;
    startElapsed?: number;
  }
): void {
  const meta = PACK_VFX[key];
  if (!meta) return;
  if (list.length >= 160) list.shift();
  const defaultLife = meta.loop ? 0.85 : meta.frames / Math.max(1, meta.fps);
  const life = opts?.life ?? defaultLife;
  list.push({
    key,
    x,
    y,
    elapsed: opts?.startElapsed ?? 0,
    life,
    maxLife: life,
    scale: opts?.scale ?? 1.8,
    scaleX: opts?.scaleX,
    scaleY: opts?.scaleY,
    angle: opts?.angle ?? 0,
    alpha: opts?.alpha ?? 1,
    flipX: opts?.flipX,
    groundPlane: opts?.groundPlane,
    frameOverride: opts?.frameOverride,
    tintColor: opts?.tintColor,
    zOffset: opts?.zOffset,
  });
}

export function updatePackVfx(list: PackVfxInstance[], dt: number): void {
  for (let i = list.length - 1; i >= 0; i--) {
    const inst = list[i];
    inst.elapsed += dt;
    inst.life -= dt;
    if (inst.life <= 0) {
      list.splice(i, 1);
    }
  }
}

export function drawPackVfxLayer(
  ctx: CanvasRenderingContext2D,
  list: PackVfxInstance[],
  groundOnly: boolean,
  isoTilt: number
): void {
  for (let i = 0; i < list.length; i++) {
    const inst = list[i];
    if (Boolean(inst.groundPlane) !== groundOnly) continue;
    const fadeRatio = inst.life / Math.max(0.01, inst.maxLife);
    const alpha = inst.alpha * (fadeRatio < 0.25 ? fadeRatio / 0.25 : 1);
    drawPackVfx(ctx, inst.key, inst.x, inst.y * isoTilt, inst.elapsed, {
      scale: inst.scale,
      scaleX: inst.scaleX,
      scaleY: inst.scaleY,
      angle: inst.angle,
      alpha,
      flipX: inst.flipX,
      squashY: groundOnly ? isoTilt : 1,
      frameOverride: inst.frameOverride,
      tintColor: inst.tintColor,
      zOffset: inst.zOffset,
    });
  }
}
