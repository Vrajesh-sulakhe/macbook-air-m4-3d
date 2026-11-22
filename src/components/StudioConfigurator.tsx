import { useState } from 'react';
import {
  ArrowUp,
  Check,
  ChevronRight,
  Layers,
  RotateCcw,
  Sparkles,
  Sun,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import {
  CAMERA_PRESETS,
  FINISH_PALETTES,
  MEMORY_PRICE_DELTAS,
  SCREEN_MODES,
  SIZE_SPECS,
  STORAGE_PRICE_DELTAS,
  calculateConfigPrice,
  getGpuOptionAvailability,
  type CameraPresetId,
  type FinishId,
  type GpuTierId,
  type MacBookConfigState,
  type MemoryTierId,
  type ScreenModeId,
  type SizeId,
  type StorageTierId,
} from '../data/macbookSpecs';

export interface StudioConfiguratorProps {
  config: MacBookConfigState;
  studioPreset: CameraPresetId;
  lidAngleDeg: number;
  xrayEnabled: boolean;
  backlightEnabled: boolean;
  screenMode: ScreenModeId;
  zoomStep: number;
  onConfigChange: (patch: Partial<MacBookConfigState>) => void;
  onPresetChange: (preset: CameraPresetId) => void;
  onLidAngleChange: (deg: number) => void;
  onXrayToggle: (enabled: boolean) => void;
  onBacklightToggle: (enabled: boolean) => void;
  onScreenModeChange: (mode: ScreenModeId) => void;
  onZoomChange: (delta: number) => void;
  onResetView: () => void;
  onReviewClick: () => void;
  onBackToStory: () => void;
}

const SIZE_ORDER: readonly SizeId[] = ['13', '15'];
const FINISH_ORDER: readonly FinishId[] = ['sky-blue', 'midnight', 'starlight', 'silver'];
const GPU_ORDER: readonly GpuTierId[] = ['8-core', '10-core'];
const MEMORY_ORDER: readonly MemoryTierId[] = [16, 24, 32];
const STORAGE_ORDER: readonly StorageTierId[] = [256, 512, 1024, 2048];
const PRESET_ORDER: readonly CameraPresetId[] = ['hero', 'profile', 'ports', 'keyboard', 'xray'];
const SCREEN_MODE_ORDER: readonly ScreenModeId[] = ['sequoia', 'intelligence', 'raytrace', 'dual6k'];

function formatUsd(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatStorageLabel(storage: StorageTierId): string {
  return storage >= 1024 ? `${storage / 1024}TB` : `${storage}GB`;
}

/**
 * Interactive 3D hardware studio controls and real-spec MacBook Air M4 configurator panel.
 */
export function StudioConfigurator({
  config,
  studioPreset,
  lidAngleDeg,
  xrayEnabled,
  backlightEnabled,
  screenMode,
  zoomStep,
  onConfigChange,
  onPresetChange,
  onLidAngleChange,
  onXrayToggle,
  onBacklightToggle,
  onScreenModeChange,
  onZoomChange,
  onResetView,
  onReviewClick,
  onBackToStory,
}: StudioConfiguratorProps) {
  const [showMonthly, setShowMonthly] = useState(false);

  const sizeSpec = SIZE_SPECS[config.size];
  const palette = FINISH_PALETTES[config.finish];
  const gpuAvailability = getGpuOptionAvailability(config.size, config.storage);
  const price = calculateConfigPrice(config);
  const monthlyPayment = Math.round(price.total / 12);

  return (
    <div
      data-testid="studio-configurator"
      className="w-full rounded-3xl border border-white/14 bg-[#0B0F17]/92 p-5 text-[#F5F5F7] shadow-[0_28px_80px_rgba(0,0,0,0.65)] backdrop-blur-2xl sm:p-7"
    >
      {/* Studio Header & Quick Exit */}
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-white/10 pb-4">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-[#7BB3E0]">
            Interactive 3D Studio
          </p>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight text-[#F5F5F7]">
            Configure MacBook Air M4
          </h2>
          <p className="mt-1 font-mono text-xs text-[#9BA3B4] tabular-nums">
            {`${sizeSpec.displayInches} · ${sizeSpec.resolution} · ${sizeSpec.thicknessCm} · ${sizeSpec.weightLb}`}
          </p>
        </div>
        <button
          type="button"
          onClick={onBackToStory}
          className="inline-flex min-h-[44px] items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3.5 text-xs font-medium text-[#E2E8F0] transition-colors hover:bg-white/12"
        >
          <ArrowUp className="h-3.5 w-3.5" aria-hidden="true" />
          <span>Back to Story</span>
        </button>
      </div>

      {/* Camera & Hardware Inspection Controls */}
      <div className="mt-5 space-y-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-[#9BA3B4]">
            Camera Presets
          </span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              aria-label="Zoom out"
              disabled={zoomStep <= -2}
              onClick={() => onZoomChange(-1)}
              className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full border border-white/14 bg-white/5 text-[#E2E8F0] transition-colors hover:bg-white/12 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ZoomOut className="h-4 w-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              aria-label="Zoom in"
              disabled={zoomStep >= 2}
              onClick={() => onZoomChange(1)}
              className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full border border-white/14 bg-white/5 text-[#E2E8F0] transition-colors hover:bg-white/12 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ZoomIn className="h-4 w-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              aria-label="Reset view"
              onClick={onResetView}
              className="inline-flex min-h-[44px] items-center gap-1 rounded-full border border-white/14 bg-white/5 px-3 text-xs font-medium text-[#E2E8F0] transition-colors hover:bg-white/12"
            >
              <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Reset</span>
            </button>
          </div>
        </div>

        <div role="group" aria-label="Studio camera angles" className="flex flex-wrap gap-1.5">
          {PRESET_ORDER.map((presetId) => {
            const preset = CAMERA_PRESETS[presetId];
            const active = studioPreset === presetId;
            return (
              <button
                key={presetId}
                type="button"
                aria-pressed={active}
                onClick={() => onPresetChange(presetId)}
                className={
                  active
                    ? 'min-h-[44px] rounded-full bg-[#7BB3E0] px-3.5 text-xs font-semibold text-[#050608] transition-colors'
                    : 'min-h-[44px] rounded-full border border-white/12 bg-white/5 px-3.5 text-xs font-medium text-[#CBD5E1] transition-colors hover:bg-white/10'
                }
              >
                {preset.label}
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-1 gap-3 pt-1 sm:grid-cols-2">
          <button
            type="button"
            aria-pressed={xrayEnabled}
            onClick={() => onXrayToggle(!xrayEnabled)}
            className={
              xrayEnabled
                ? 'inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-[#38BDF8] bg-[#38BDF8]/18 px-3 text-xs font-semibold text-[#E0F2FE] transition-colors'
                : 'inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-white/12 bg-white/5 px-3 text-xs font-medium text-[#CBD5E1] transition-colors hover:bg-white/10'
            }
          >
            <Layers className="h-3.5 w-3.5" aria-hidden="true" />
            <span>X-Ray Mode</span>
          </button>

          <button
            type="button"
            aria-pressed={backlightEnabled}
            onClick={() => onBacklightToggle(!backlightEnabled)}
            className={
              backlightEnabled
                ? 'inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-[#7BB3E0]/70 bg-[#7BB3E0]/15 px-3 text-xs font-semibold text-[#E2E8F0] transition-colors'
                : 'inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-white/12 bg-white/5 px-3 text-xs font-medium text-[#CBD5E1] transition-colors hover:bg-white/10'
            }
          >
            <Sun className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Keyboard Backlight</span>
          </button>
        </div>

        <div>
          <div className="flex items-center justify-between text-xs">
            <label htmlFor="studio-lid-angle" className="font-mono text-[11px] uppercase tracking-[0.14em] text-[#9BA3B4]">
              Lid Angle
            </label>
            <span className="font-mono text-xs text-[#F5F5F7] tabular-nums">{`${Math.round(lidAngleDeg)}°`}</span>
          </div>
          <input
            id="studio-lid-angle"
            type="range"
            min={0}
            max={130}
            step={1}
            value={lidAngleDeg}
            onChange={(e) => onLidAngleChange(Number(e.target.value))}
            className="mt-2 h-8 w-full cursor-pointer accent-[#7BB3E0]"
          />
        </div>

        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-[#9BA3B4]">
            Display Showcase
          </p>
          <div role="group" aria-label="Display screen mode" className="mt-2 grid grid-cols-2 gap-1.5">
            {SCREEN_MODE_ORDER.map((modeId) => {
              const mode = SCREEN_MODES[modeId];
              const active = screenMode === modeId;
              return (
                <button
                  key={modeId}
                  type="button"
                  aria-pressed={active}
                  onClick={() => onScreenModeChange(modeId)}
                  className={
                    active
                      ? 'inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl border border-[#7BB3E0] bg-[#7BB3E0]/16 px-2.5 text-xs font-semibold text-[#F5F5F7]'
                      : 'inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.03] px-2.5 text-xs font-medium text-[#9BA3B4] hover:bg-white/10 hover:text-[#F5F5F7]'
                  }
                >
                  <Sparkles className="h-3 w-3 shrink-0" aria-hidden="true" />
                  <span className="truncate">{mode.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Hardware Spec Configuration */}
      <div className="mt-5 space-y-5">
        {/* Size */}
        <fieldset>
          <legend className="font-mono text-[11px] uppercase tracking-[0.16em] text-[#9BA3B4]">
            Model Size
          </legend>
          <div className="mt-2 grid grid-cols-2 gap-2.5">
            {SIZE_ORDER.map((sizeId) => {
              const spec = SIZE_SPECS[sizeId];
              const selected = config.size === sizeId;
              return (
                <button
                  key={sizeId}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => onConfigChange({ size: sizeId })}
                  className={
                    selected
                      ? 'flex min-h-[54px] flex-col items-start justify-center rounded-2xl border border-[#7BB3E0] bg-[#7BB3E0]/14 px-3.5 py-2 text-left'
                      : 'flex min-h-[54px] flex-col items-start justify-center rounded-2xl border border-white/12 bg-white/[0.03] px-3.5 py-2 text-left hover:bg-white/[0.07]'
                  }
                >
                  <span className="text-sm font-semibold text-[#F5F5F7]">{spec.label}</span>
                  <span className="font-mono text-[11px] text-[#9BA3B4] tabular-nums">
                    {`From ${formatUsd(spec.basePrice)}`}
                  </span>
                </button>
              );
            })}
          </div>
        </fieldset>

        {/* Finish */}
        <fieldset>
          <legend className="font-mono text-[11px] uppercase tracking-[0.16em] text-[#9BA3B4]">
            Finish — <span className="text-[#F5F5F7]">{palette.name}</span>
          </legend>
          <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {FINISH_ORDER.map((finishId) => {
              const item = FINISH_PALETTES[finishId];
              const selected = config.finish === finishId;
              return (
                <button
                  key={finishId}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => onConfigChange({ finish: finishId })}
                  className={
                    selected
                      ? 'flex min-h-[48px] items-center gap-2 rounded-2xl border border-[#7BB3E0] bg-[#7BB3E0]/14 px-2.5 text-xs font-semibold text-[#F5F5F7]'
                      : 'flex min-h-[48px] items-center gap-2 rounded-2xl border border-white/12 bg-white/[0.03] px-2.5 text-xs font-medium text-[#CBD5E1] hover:bg-white/[0.07]'
                  }
                >
                  <span
                    className="h-4 w-4 shrink-0 rounded-full ring-1 ring-white/30"
                    style={{ background: item.swatchGradient }}
                    aria-hidden="true"
                  />
                  <span className="truncate">{item.name}</span>
                </button>
              );
            })}
          </div>
        </fieldset>

        {/* Chip / GPU */}
        <fieldset>
          <legend className="font-mono text-[11px] uppercase tracking-[0.16em] text-[#9BA3B4]">
            Apple M4 Chip (10-Core CPU)
          </legend>
          <div className="mt-2 grid grid-cols-2 gap-2.5">
            {GPU_ORDER.map((gpuId) => {
              const status = gpuAvailability[gpuId];
              const selected = config.gpu === gpuId;
              return (
                <button
                  key={gpuId}
                  type="button"
                  disabled={status.disabled}
                  aria-pressed={selected}
                  onClick={() => onConfigChange({ gpu: gpuId })}
                  className={
                    selected
                      ? 'flex min-h-[54px] flex-col items-start justify-center rounded-2xl border border-[#7BB3E0] bg-[#7BB3E0]/14 px-3.5 py-2 text-left disabled:cursor-not-allowed disabled:opacity-45'
                      : 'flex min-h-[54px] flex-col items-start justify-center rounded-2xl border border-white/12 bg-white/[0.03] px-3.5 py-2 text-left hover:bg-white/[0.07] disabled:cursor-not-allowed disabled:opacity-45'
                  }
                >
                  <span className="text-xs font-semibold text-[#F5F5F7] sm:text-sm">{`${gpuId} GPU`}</span>
                  <span className="font-mono text-[11px] text-[#9BA3B4] tabular-nums">
                    {status.disabled
                      ? status.reason
                      : status.surcharge > 0
                        ? `+${formatUsd(status.surcharge)}`
                        : 'Included'}
                  </span>
                </button>
              );
            })}
          </div>
        </fieldset>

        {/* Unified Memory */}
        <fieldset>
          <legend className="font-mono text-[11px] uppercase tracking-[0.16em] text-[#9BA3B4]">
            Unified Memory
          </legend>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {MEMORY_ORDER.map((memTier) => {
              const delta = MEMORY_PRICE_DELTAS[memTier];
              const selected = config.memory === memTier;
              return (
                <button
                  key={memTier}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => onConfigChange({ memory: memTier })}
                  className={
                    selected
                      ? 'flex min-h-[52px] flex-col items-start justify-center rounded-2xl border border-[#7BB3E0] bg-[#7BB3E0]/14 px-3 py-2 text-left'
                      : 'flex min-h-[52px] flex-col items-start justify-center rounded-2xl border border-white/12 bg-white/[0.03] px-3 py-2 text-left hover:bg-white/[0.07]'
                  }
                >
                  <span className="text-xs font-semibold text-[#F5F5F7] sm:text-sm">{`${memTier}GB`}</span>
                  <span className="font-mono text-[11px] text-[#9BA3B4] tabular-nums">
                    {delta === 0 ? 'Included' : `+${formatUsd(delta)}`}
                  </span>
                </button>
              );
            })}
          </div>
        </fieldset>

        {/* SSD Storage */}
        <fieldset>
          <legend className="font-mono text-[11px] uppercase tracking-[0.16em] text-[#9BA3B4]">
            SSD Storage
          </legend>
          <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {STORAGE_ORDER.map((storageTier) => {
              const delta = STORAGE_PRICE_DELTAS[storageTier];
              const selected = config.storage === storageTier;
              return (
                <button
                  key={storageTier}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => onConfigChange({ storage: storageTier })}
                  className={
                    selected
                      ? 'flex min-h-[52px] flex-col items-start justify-center rounded-2xl border border-[#7BB3E0] bg-[#7BB3E0]/14 px-3 py-2 text-left'
                      : 'flex min-h-[52px] flex-col items-start justify-center rounded-2xl border border-white/12 bg-white/[0.03] px-3 py-2 text-left hover:bg-white/[0.07]'
                  }
                >
                  <span className="text-xs font-semibold text-[#F5F5F7] sm:text-sm">
                    {formatStorageLabel(storageTier)}
                  </span>
                  <span className="font-mono text-[11px] text-[#9BA3B4] tabular-nums">
                    {delta === 0 ? 'Included' : `+${formatUsd(delta)}`}
                  </span>
                </button>
              );
            })}
          </div>
        </fieldset>
      </div>

      {/* Live Price & Review Summary Footer */}
      <div className="mt-6 flex flex-col gap-3 border-t border-white/12 pt-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-baseline gap-2">
            <span
              data-testid="studio-configurator-price"
              className="text-3xl font-semibold tracking-tight text-[#F5F5F7] tabular-nums"
            >
              {formatUsd(price.total)}
            </span>
            <button
              type="button"
              onClick={() => setShowMonthly((prev) => !prev)}
              className="min-h-[32px] font-mono text-[11px] text-[#7BB3E0] underline-offset-4 hover:underline"
            >
              {showMonthly ? 'Show total' : `or ~$${monthlyPayment}/mo`}
            </button>
          </div>
          <p className="mt-0.5 text-xs text-[#9BA3B4] tabular-nums">
            {showMonthly
              ? `Estimated 12-mo split (~$${monthlyPayment}/mo) · Apple M4 MSRP`
              : `${sizeSpec.label} · ${palette.name} · ${config.gpu} GPU · ${config.memory}GB`}
          </p>
        </div>

        <button
          type="button"
          onClick={onReviewClick}
          className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-full bg-[#F5F5F7] px-5 py-3 text-sm font-semibold text-[#050608] shadow-lg transition-colors hover:bg-[#DCEAF7]"
        >
          <Check className="h-4 w-4 text-[#050608]" aria-hidden="true" />
          <span>Review Configuration</span>
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
