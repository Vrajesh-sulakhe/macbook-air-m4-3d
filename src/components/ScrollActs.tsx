import { FINISH_PALETTES, SIZE_SPECS, type FinishId } from '../data/macbookSpecs';

export interface ScrollActsProps {
  finish: FinishId;
  onFinishPreview: (finish: FinishId) => void;
  onJumpToStudio: () => void;
}

interface SpecItem {
  value: string;
  detail: string;
}

const FINISH_ORDER: readonly FinishId[] = ['sky-blue', 'midnight', 'starlight', 'silver'];

const BASE_SPEC = SIZE_SPECS['13'];

const DESIGN_METRICS: readonly SpecItem[] = [
  { value: BASE_SPEC.thicknessCm, detail: `${BASE_SPEC.thicknessIn} thin unibody` },
  { value: BASE_SPEC.weightLb, detail: `${BASE_SPEC.weightKg} featherweight` },
  { value: '>50%', detail: 'Recycled aluminum enclosure' },
  { value: 'Fanless', detail: 'Zero-noise silent architecture' },
];

const SILICON_METRICS: readonly (SpecItem & { barWidth: string })[] = [
  { value: '10-Core CPU', detail: '4 performance + 6 efficiency cores', barWidth: 'w-11/12' },
  { value: 'Up to 10-Core GPU', detail: 'Hardware-accelerated ray tracing', barWidth: 'w-5/6' },
  { value: '16-Core Neural Engine', detail: 'Built for Apple Intelligence', barWidth: 'w-full' },
  { value: '16GB–32GB', detail: 'Unified Memory architecture', barWidth: 'w-4/5' },
];

const DISPLAY_METRICS: readonly SpecItem[] = [
  { value: BASE_SPEC.resolution, detail: `${BASE_SPEC.displayInches} Liquid Retina · ${BASE_SPEC.ppi} ppi` },
  { value: `${BASE_SPEC.nits} nits`, detail: 'Peak brightness with True Tone' },
  { value: 'P3 Wide Color', detail: 'Support for 1 billion colors' },
  { value: '12MP Center Stage', detail: 'Pro camera with Desk View' },
  { value: 'Dual 6K', detail: 'Two external 6K displays with lid open' },
];

const CONNECTIVITY_METRICS: readonly SpecItem[] = [
  { value: 'MagSafe 3', detail: 'Magnetic quick-release charging' },
  { value: '2× Thunderbolt 4', detail: '40Gb/s data, power & display' },
  { value: '3.5mm audio', detail: 'High-impedance jack & Spatial Audio' },
  { value: '18 hrs battery life', detail: 'Video streaming endurance' },
];

function SpecGrid({
  items,
  theme,
}: {
  items: readonly SpecItem[];
  theme: 'dark' | 'light';
}) {
  const cardCls =
    theme === 'dark'
      ? 'rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3'
      : 'rounded-2xl border border-[#101319]/10 bg-white/70 px-4 py-3';
  const valueCls =
    theme === 'dark'
      ? 'font-mono text-sm font-semibold text-[#F5F5F7] tabular-nums sm:text-base'
      : 'font-mono text-sm font-semibold text-[#101319] tabular-nums sm:text-base';
  const detailCls =
    theme === 'dark'
      ? 'mt-1 text-xs text-[#9BA3B4]'
      : 'mt-1 text-xs text-[#475569]';

  return (
    <dl className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
      {items.map((item) => (
        <div key={item.value} className={cardCls}>
          <dt className={valueCls}>{item.value}</dt>
          <dd className={detailCls}>{item.detail}</dd>
        </div>
      ))}
    </dl>
  );
}

/**
 * Five editorial scroll story sections floating cleanly over the continuous 3D WebGL stage
 * with alternating dark obsidian and frosted light porcelain/silver-mist themes.
 */
export function ScrollActs({ finish, onFinishPreview, onJumpToStudio }: ScrollActsProps) {
  return (
    <div className="pointer-events-none relative z-10">
      {/* Act 1: Hero Reveal — Dark Obsidian */}
      <section
        id="overview"
        aria-labelledby="act-overview-heading"
        className="pointer-events-none relative flex min-h-[120vh] items-end px-4 pt-24 pb-16 sm:items-center sm:px-8 sm:py-28 lg:px-14"
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#050608]/85 via-[#050608]/25 to-transparent sm:bg-gradient-to-r sm:from-[#050608]/80 sm:via-[#050608]/30 sm:to-transparent"
        />
        <div className="pointer-events-auto relative w-full max-w-lg rounded-[2rem] border border-white/10 bg-white/[0.04] p-1.5 shadow-[0_28px_80px_rgba(0,0,0,0.55)]">
          <div className="rounded-[calc(2rem-0.375rem)] bg-[#070A10]/94 p-6 text-[#F5F5F7] shadow-[inset_0_1px_1px_rgba(255,255,255,0.14)] sm:p-8">
            <span className="inline-flex items-center rounded-full border border-[#7BB3E0]/25 bg-[#7BB3E0]/10 px-3 py-1 font-mono text-[10px] font-medium uppercase tracking-[0.2em] text-[#7BB3E0]">
              Apple M4 Silicon
            </span>
            <h1
              id="act-overview-heading"
              className="mt-3 text-4xl font-semibold tracking-tight text-[#F5F5F7] sm:text-5xl lg:text-6xl"
            >
              MacBook Air M4
            </h1>
            <p className="mt-3 text-xl font-medium tracking-tight text-[#E2E8F0] sm:text-2xl">
              Sky-high speed. Featherlight Air.
            </p>
            <p className="mt-3 text-sm text-[#9BA3B4] tabular-nums sm:text-base">
              Supercharged by the M4 chip. Now in Sky Blue, starting at{' '}
              <span className="font-semibold text-[#F5F5F7]">{`$${BASE_SPEC.basePrice}`}</span>.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={onJumpToStudio}
                className="group inline-flex min-h-[44px] items-center justify-center gap-2.5 rounded-full bg-[#7BB3E0] pl-5 pr-2 py-2 text-sm font-semibold text-[#050608] transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-[#99C7EB] active:scale-[0.98]"
              >
                <span>Explore in 3D</span>
                <span
                  aria-hidden="true"
                  className="flex h-7 w-7 items-center justify-center rounded-full bg-[#050608]/12 text-xs transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-0.5 group-hover:-translate-y-[1px] group-hover:scale-105"
                >
                  ↗
                </span>
              </button>
              <a
                href="#design"
                className="inline-flex min-h-[44px] items-center justify-center rounded-full border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-medium text-[#F5F5F7] transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-white/10 active:scale-[0.98]"
              >
                Scroll to unveil
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Act 2: Anodized Unibody & Finish Craft — Light Studio Porcelain */}
      <section
        id="design"
        aria-labelledby="act-design-heading"
        className="pointer-events-none relative flex min-h-[145vh] items-center px-4 py-24 sm:px-8 lg:px-14"
      >
        <div className="pointer-events-auto relative w-full max-w-lg rounded-[2rem] border border-[#101319]/10 bg-[#101319]/[0.03] p-1.5 shadow-[0_24px_64px_rgba(16,19,25,0.12)] lg:ml-auto">
          <div className="rounded-[calc(2rem-0.375rem)] bg-[#F7F9FC]/96 p-6 text-[#101319] shadow-[inset_0_1px_1px_rgba(255,255,255,0.95)] sm:p-8">
            <span className="inline-flex items-center rounded-full border border-[#24537A]/20 bg-[#24537A]/8 px-3 py-1 font-mono text-[10px] font-medium uppercase tracking-[0.2em] text-[#24537A]">
              Anodized Unibody
            </span>
            <h2
              id="act-design-heading"
              className="mt-3 text-3xl font-semibold tracking-tight text-[#101319] sm:text-4xl"
            >
              Razor-thin craft. Four signature finishes.
            </h2>
          <p className="mt-3 text-sm text-[#475569] sm:text-base">
            Precision-milled from recycled aluminum into a whisper-quiet enclosure built to go
            everywhere effortlessly.
          </p>

          <SpecGrid items={DESIGN_METRICS} theme="light" />

          <div className="mt-6">
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-[#475569]">
              Preview Finish
            </p>
            <div
              role="group"
              aria-label="Preview anodized finish"
              className="mt-2.5 flex flex-wrap gap-2"
            >
              {FINISH_ORDER.map((finishId) => {
                const palette = FINISH_PALETTES[finishId];
                const isSelected = finish === finishId;
                return (
                  <button
                    key={finishId}
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => onFinishPreview(finishId)}
                    className={
                      isSelected
                        ? 'inline-flex min-h-[44px] items-center gap-2 rounded-full border border-[#101319] bg-[#101319] px-3.5 text-xs font-semibold text-[#F5F5F7] shadow-sm transition-colors'
                        : 'inline-flex min-h-[44px] items-center gap-2 rounded-full border border-[#101319]/15 bg-white/80 px-3.5 text-xs font-medium text-[#101319] transition-colors hover:bg-white'
                    }
                  >
                    <span
                      className="h-3.5 w-3.5 shrink-0 rounded-full ring-1 ring-black/20"
                      style={{ background: palette.swatchGradient }}
                      aria-hidden="true"
                    />
                    <span>{palette.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
          </div>
        </div>
      </section>

      {/* Act 3: M4 Silicon X-Ray Cutaway */}
      <section
        id="silicon"
        aria-labelledby="act-silicon-heading"
        className="pointer-events-none relative flex min-h-[155vh] items-center px-4 py-24 sm:px-8 lg:px-14"
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#080C14]/70 via-transparent to-transparent"
        />
        <div className="pointer-events-auto relative w-full max-w-lg rounded-[2rem] border border-[#38BDF8]/20 bg-white/[0.03] p-1.5 shadow-[0_28px_80px_rgba(0,0,0,0.6)]">
          <div className="rounded-[calc(2rem-0.375rem)] bg-[#080C14]/94 p-6 text-[#F5F5F7] shadow-[inset_0_1px_1px_rgba(56,189,248,0.16)] sm:p-8">
            <span className="inline-flex items-center rounded-full border border-[#38BDF8]/25 bg-[#38BDF8]/10 px-3 py-1 font-mono text-[10px] font-medium uppercase tracking-[0.2em] text-[#38BDF8]">
              M4 Silicon Architecture
            </span>
            <h2
              id="act-silicon-heading"
              className="mt-3 text-3xl font-semibold tracking-tight text-[#F5F5F7] sm:text-4xl"
            >
              Silent power, re-architected inside.
            </h2>
          <p className="mt-3 text-sm text-[#9BA3B4] sm:text-base">
            Beneath the graphite thermal spreader sits Apple M4, pairing hardware ray tracing with
            a next-generation Neural Engine.
          </p>

          <dl className="mt-6 space-y-3.5">
            {SILICON_METRICS.map((metric) => (
              <div
                key={metric.value}
                className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <dt className="font-mono text-sm font-semibold text-[#F5F5F7] tabular-nums">
                    {metric.value}
                  </dt>
                  <dd className="text-xs text-[#9BA3B4]">{metric.detail}</dd>
                </div>
                <div
                  aria-hidden="true"
                  className="mt-2 h-1 w-full overflow-hidden rounded-full bg-white/10"
                >
                  <div
                    className={`h-full rounded-full bg-gradient-to-r from-[#38BDF8] to-[#7BB3E0] ${metric.barWidth}`}
                  />
                </div>
              </div>
            ))}
          </dl>
          </div>
        </div>
      </section>

      {/* Act 4: Liquid Retina, 12MP Center Stage & Dual 6K — Dark Charcoal */}
      <section
        id="display"
        aria-labelledby="act-display-heading"
        className="pointer-events-none relative flex min-h-[155vh] items-end px-4 py-24 sm:items-center sm:px-8 lg:px-14"
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#050608]/75 via-transparent to-transparent sm:bg-gradient-to-r sm:from-[#090B10]/70 sm:via-transparent sm:to-transparent"
        />
        <div className="pointer-events-auto relative w-full max-w-lg rounded-[2rem] border border-white/10 bg-white/[0.04] p-1.5 shadow-[0_28px_80px_rgba(0,0,0,0.6)]">
          <div className="rounded-[calc(2rem-0.375rem)] bg-[#090B10]/94 p-6 text-[#F5F5F7] shadow-[inset_0_1px_1px_rgba(255,255,255,0.14)] sm:p-8">
            <span className="inline-flex items-center rounded-full border border-[#7BB3E0]/25 bg-[#7BB3E0]/10 px-3 py-1 font-mono text-[10px] font-medium uppercase tracking-[0.2em] text-[#7BB3E0]">
              Liquid Retina Display
            </span>
            <h2
              id="act-display-heading"
              className="mt-3 text-3xl font-semibold tracking-tight text-[#F5F5F7] sm:text-4xl"
            >
              Crisp 1 billion colors. Two external 6K displays.
            </h2>
          <p className="mt-3 text-sm text-[#9BA3B4] sm:text-base">
            Drive two external studio monitors simultaneously with the built-in Liquid Retina screen
            open, framed by a Desk View studio camera.
          </p>

          <SpecGrid items={DISPLAY_METRICS} theme="dark" />
          </div>
        </div>
      </section>

      {/* Act 5: Connectivity, MagSafe 3 & Endurance — Light Silver Mist */}
      <section
        id="connectivity"
        aria-labelledby="act-connectivity-heading"
        className="pointer-events-none relative flex min-h-[135vh] items-center px-4 py-24 sm:px-8 lg:px-14"
      >
        <div className="pointer-events-auto relative w-full max-w-lg rounded-[2rem] border border-[#101319]/10 bg-[#101319]/[0.03] p-1.5 shadow-[0_24px_64px_rgba(16,19,25,0.12)] lg:ml-auto">
          <div className="rounded-[calc(2rem-0.375rem)] bg-[#EEF2F7]/96 p-6 text-[#101319] shadow-[inset_0_1px_1px_rgba(255,255,255,0.95)] sm:p-8">
            <span className="inline-flex items-center rounded-full border border-[#24537A]/20 bg-[#24537A]/8 px-3 py-1 font-mono text-[10px] font-medium uppercase tracking-[0.2em] text-[#24537A]">
              Connectivity &amp; Endurance
            </span>
            <h2
              id="act-connectivity-heading"
              className="mt-3 text-3xl font-semibold tracking-tight text-[#101319] sm:text-4xl"
            >
              Snaps in cleanly. Stays untethered.
            </h2>
          <p className="mt-3 text-sm text-[#475569] sm:text-base">
            Snap-in magnetic charging, dual high-speed ports, Spatial Audio, and all-day battery
            endurance without searching for an outlet.
          </p>

          <SpecGrid items={CONNECTIVITY_METRICS} theme="light" />
          </div>
        </div>
      </section>
    </div>
  );
}
