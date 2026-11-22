import { Component, useId, type ReactNode } from 'react';
import { FINISH_PALETTES, SIZE_SPECS, type FinishId, type SizeId } from '../data/macbookSpecs';

export interface WebGLErrorBoundaryProps {
  children: ReactNode;
  fallback: ReactNode;
  onError?: (error: Error) => void;
}

interface WebGLErrorBoundaryState {
  hasError: boolean;
}

/**
 * Error boundary wrapping the 3D WebGL canvas so runtime context failures degrade cleanly.
 */
export class WebGLErrorBoundary extends Component<
  WebGLErrorBoundaryProps,
  WebGLErrorBoundaryState
> {
  state: WebGLErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): WebGLErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error): void {
    this.props.onError?.(error);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return this.props.fallback;
    }

    return this.props.children;
  }
}

export interface StaticMacBookFallbackProps {
  finish: FinishId;
  size: SizeId;
}

/**
 * Polished dark-studio SVG hardware silhouette rendered when WebGL is unavailable or throws.
 */
export function StaticMacBookFallback({ finish, size }: StaticMacBookFallbackProps) {
  const uid = useId();
  const palette = FINISH_PALETTES[finish];
  const sizeSpec = SIZE_SPECS[size];
  const isFifteen = size === '15';
  const lidWidth = isFifteen ? 332 : 302;
  const lidX = (480 - lidWidth) / 2;
  const baseWidth = lidWidth + 56;
  const baseX = (480 - baseWidth) / 2;
  const chassisGradId = `chassis-${finish}-${uid}`;
  const screenGradId = `screen-${finish}-${uid}`;
  const floorGradId = `floor-${finish}-${uid}`;

  return (
    <div
      data-testid="static-macbook-fallback"
      role="img"
      aria-label={`${sizeSpec.label} MacBook Air in ${palette.name} static studio preview`}
      className="relative flex h-full w-full flex-col items-center justify-center overflow-hidden rounded-3xl border border-white/10 bg-[#050608] px-6 py-8 text-[#f5f5f7] select-none"
      style={{
        backgroundImage: `radial-gradient(65% 55% at 50% 42%, ${palette.rimTint}24 0%, rgba(12, 16, 24, 0.72) 55%, #050608 100%)`,
      }}
    >
      <div className="mb-4 flex items-center gap-2.5 rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 text-xs tracking-wide backdrop-blur-md">
        <span
          className="h-2.5 w-2.5 rounded-full ring-1 ring-white/30"
          style={{ background: palette.swatchGradient }}
          aria-hidden="true"
        />
        <span className="font-medium text-white/90">{palette.name}</span>
        <span className="text-white/30" aria-hidden="true">
          ·
        </span>
        <span className="font-mono text-white/70 tabular-nums">{sizeSpec.label}</span>
      </div>

      <svg
        viewBox="0 0 480 280"
        className="w-full max-w-[440px] drop-shadow-[0_24px_48px_rgba(0,0,0,0.85)]"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id={chassisGradId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={palette.rimTint} stopOpacity="0.95" />
            <stop offset="52%" stopColor={palette.hex} />
            <stop offset="100%" stopColor="#12161E" stopOpacity="0.95" />
          </linearGradient>
          <linearGradient id={screenGradId} x1="15%" y1="0%" x2="85%" y2="100%">
            <stop offset="0%" stopColor="#0C1726" />
            <stop offset="48%" stopColor={palette.rimTint} stopOpacity="0.48" />
            <stop offset="100%" stopColor="#070A10" />
          </linearGradient>
          <radialGradient id={floorGradId} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={palette.rimTint} stopOpacity="0.28" />
            <stop offset="100%" stopColor="#050608" stopOpacity="0" />
          </radialGradient>
        </defs>

        <ellipse cx="240" cy="242" rx="196" ry="20" fill={`url(#${floorGradId})`} />

        {/* Anodized display lid */}
        <rect
          x={lidX}
          y="30"
          width={lidWidth}
          height="172"
          rx="14"
          fill={`url(#${chassisGradId})`}
          stroke={palette.rimTint}
          strokeOpacity="0.55"
          strokeWidth="1.2"
        />
        {/* Display bezel */}
        <rect x={lidX + 6} y="36" width={lidWidth - 12} height="160" rx="10" fill="#07090D" />
        {/* Liquid Retina panel */}
        <rect
          x={lidX + 12}
          y="42"
          width={lidWidth - 24}
          height="148"
          rx="6"
          fill={`url(#${screenGradId})`}
        />
        {/* Camera housing notch */}
        <path
          d={`M ${240 - 18} 42 h 36 v 5 a 4 4 0 0 1 -4 4 h -28 a 4 4 0 0 1 -4 -4 z`}
          fill="#07090D"
        />
        <circle cx="240" cy="46.5" r="1.4" fill="#3B82F6" fillOpacity="0.7" />

        {/* Hinge bridge */}
        <rect x={240 - lidWidth * 0.34} y="198" width={lidWidth * 0.68} height="6" rx="2" fill="#0B0E14" />

        {/* Unibody aluminum base */}
        <path
          d={`M ${lidX + 4} 204 H ${lidX + lidWidth - 4} L ${baseX + baseWidth} 226 Q ${baseX + baseWidth - 4} 236 ${baseX + baseWidth - 18} 236 H ${baseX + 18} Q ${baseX + 4} 236 ${baseX} 226 Z`}
          fill={`url(#${chassisGradId})`}
          stroke={palette.rimTint}
          strokeOpacity="0.45"
          strokeWidth="1"
        />
        {/* Thumb indent */}
        <rect x="216" y="227" width="48" height="4" rx="2" fill="#07090D" fillOpacity="0.6" />
      </svg>

      <div className="mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 font-mono text-[11px] text-white/65 tabular-nums">
        <span>Apple M4</span>
        <span className="text-white/25" aria-hidden="true">
          ·
        </span>
        <span>{sizeSpec.displayInches} Liquid Retina</span>
        <span className="text-white/25" aria-hidden="true">
          ·
        </span>
        <span>{sizeSpec.resolution}</span>
        <span className="text-white/25" aria-hidden="true">
          ·
        </span>
        <span>{sizeSpec.thicknessCm}</span>
        <span className="text-white/25" aria-hidden="true">
          ·
        </span>
        <span>{sizeSpec.weightLb}</span>
      </div>
    </div>
  );
}
