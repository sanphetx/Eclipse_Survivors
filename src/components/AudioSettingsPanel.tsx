import React, { useEffect, useRef, useState } from 'react';
import { Minus, Music2, Plus, SlidersHorizontal, Sparkles, Volume2, VolumeX } from 'lucide-react';
import { AudioVolumeSettings } from '../game/types';

interface AudioSettingsPanelProps {
  muted: boolean;
  volumes: AudioVolumeSettings;
  onToggleMute: () => void;
  onChangeVolumes: (patch: Partial<AudioVolumeSettings>) => void;
  compact?: boolean;
}

interface ChannelRowProps {
  label: string;
  value: number;
  icon: React.ReactNode;
  disabled?: boolean;
  onChange: (nextValue: number) => void;
}

const ChannelRow: React.FC<ChannelRowProps> = ({ label, value, icon, disabled, onChange }) => {
  const pct = Math.round(value * 100);
  const stepChange = (deltaPct: number) => {
    const next = Math.max(0, Math.min(1, Math.round(pct + deltaPct) / 100));
    onChange(next);
  };

  return (
    <div className={`space-y-1.5 ${disabled ? 'opacity-55' : ''}`}>
      <div className="flex items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-1.5 text-stone-200 font-medium">
          {icon}
          <span>{label}</span>
        </div>
        <span className="font-mono-num text-[11px] font-semibold text-amber-300 w-10 text-right">
          {pct}%
        </span>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => stepChange(-10)}
          aria-label={`ลด${label}`}
          className="gothic-btn-iron w-6 h-6 rounded flex items-center justify-center text-stone-300 hover:text-amber-200 shrink-0 cursor-pointer"
        >
          <Minus className="w-3 h-3" />
        </button>
        <input
          type="range"
          min={0}
          max={100}
          step={5}
          value={pct}
          onChange={(e) => onChange(Number(e.target.value) / 100)}
          aria-label={label}
          className="w-full h-1.5 rounded-full bg-stone-800 accent-amber-400 cursor-pointer"
        />
        <button
          type="button"
          onClick={() => stepChange(10)}
          aria-label={`เพิ่ม${label}`}
          className="gothic-btn-iron w-6 h-6 rounded flex items-center justify-center text-stone-300 hover:text-amber-200 shrink-0 cursor-pointer"
        >
          <Plus className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};

export const AudioSettingsPanel: React.FC<AudioSettingsPanelProps> = ({
  muted,
  volumes,
  onToggleMute,
  onChangeVolumes,
  compact = false,
}) => {
  return (
    <div className={compact ? 'space-y-3' : 'p-3.5 rounded-md bg-[#08090F] border border-amber-500/20 space-y-3'}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-200">
          <Volume2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span>ตั้งค่าเสียง</span>
        </div>
        <button
          type="button"
          onClick={onToggleMute}
          className={`flex items-center gap-1 px-2 py-1 rounded text-[11px] font-semibold border transition-colors cursor-pointer ${
            muted
              ? 'bg-rose-950/60 border-rose-500/50 text-rose-200 hover:border-rose-400'
              : 'gothic-btn-iron text-amber-200'
          }`}
        >
          {muted ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
          <span>{muted ? 'ปิดเสียงอยู่' : 'เปิดเสียง'}</span>
        </button>
      </div>

      <ChannelRow
        label="ความดังรวม"
        value={volumes.masterVolume}
        icon={<Volume2 className="w-3.5 h-3.5 text-amber-300 shrink-0" />}
        disabled={muted}
        onChange={(masterVolume) => onChangeVolumes({ masterVolume })}
      />
      <ChannelRow
        label="เสียงเพลง (BGM)"
        value={volumes.bgmVolume}
        icon={<Music2 className="w-3.5 h-3.5 text-sky-300 shrink-0" />}
        disabled={muted}
        onChange={(bgmVolume) => onChangeVolumes({ bgmVolume })}
      />
      <ChannelRow
        label="เสียงเอฟเฟกต์ (SFX)"
        value={volumes.sfxVolume}
        icon={<Sparkles className="w-3.5 h-3.5 text-emerald-300 shrink-0" />}
        disabled={muted}
        onChange={(sfxVolume) => onChangeVolumes({ sfxVolume })}
      />
    </div>
  );
};

interface AudioSettingsPopoverButtonProps {
  muted: boolean;
  volumes: AudioVolumeSettings;
  onToggleMute: () => void;
  onChangeVolumes: (patch: Partial<AudioVolumeSettings>) => void;
  buttonClassName?: string;
}

export const AudioSettingsPopoverButton: React.FC<AudioSettingsPopoverButtonProps> = ({
  muted,
  volumes,
  onToggleMute,
  onChangeVolumes,
  buttonClassName = 'gothic-btn-iron p-2 rounded text-amber-200/85 shrink-0 cursor-pointer',
}) => {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopImmediatePropagation();
        setOpen(false);
      }
    };
    window.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('keydown', onKeyDown, true);
    return () => {
      window.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('keydown', onKeyDown, true);
    };
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-label="ตั้งค่าระดับเสียง"
        title="ตั้งค่าระดับเสียง"
        aria-expanded={open}
        className={`${buttonClassName} ${open ? 'border-amber-400 text-amber-200' : ''}`}
      >
        <SlidersHorizontal className="w-4 h-4" />
      </button>

      {open && (
        <div className="gothic-panel absolute right-0 top-full mt-2 w-72 rounded-lg p-3.5 z-50">
          <AudioSettingsPanel
            compact
            muted={muted}
            volumes={volumes}
            onToggleMute={onToggleMute}
            onChangeVolumes={onChangeVolumes}
          />
        </div>
      )}
    </div>
  );
};
