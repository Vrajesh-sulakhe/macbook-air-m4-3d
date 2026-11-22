import { useEffect, useRef, useState } from 'react';
import { Check, Copy, X } from 'lucide-react';
import {
  FINISH_PALETTES,
  SIZE_SPECS,
  calculateConfigPrice,
  formatConfigSummary,
  type MacBookConfigState,
} from '../data/macbookSpecs';

export interface SummaryModalProps {
  isOpen: boolean;
  config: MacBookConfigState;
  onClose: () => void;
}

function formatUsd(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Accessible configuration review dialog displaying itemized M4 MacBook Air pricing,
 * verified hardware specifications, and clipboard copy action.
 */
export function SummaryModal({ isOpen, config, onClose }: SummaryModalProps) {
  const [copied, setCopied] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const copiedTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setCopied(false);
      return;
    }

    previousFocusRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    closeButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (copiedTimerRef.current !== null) {
        window.clearTimeout(copiedTimerRef.current);
        copiedTimerRef.current = null;
      }
      previousFocusRef.current?.focus();
    };
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  const sizeSpec = SIZE_SPECS[config.size];
  const palette = FINISH_PALETTES[config.finish];
  const price = calculateConfigPrice(config);
  const summaryText = formatConfigSummary(config);
  const storageLabel = config.storage >= 1024 ? `${config.storage / 1024}TB` : `${config.storage}GB`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard?.writeText(summaryText);
      setCopied(true);
      if (copiedTimerRef.current !== null) {
        window.clearTimeout(copiedTimerRef.current);
      }
      copiedTimerRef.current = window.setTimeout(() => {
        setCopied(false);
      }, 2200);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div
      data-testid="summary-modal-backdrop"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-md"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="summary-modal-title"
        onClick={(event) => event.stopPropagation()}
        className="w-full max-w-lg rounded-3xl border border-white/15 bg-[#0D121B] p-6 text-[#F5F5F7] shadow-[0_32px_90px_rgba(0,0,0,0.75)] sm:p-8"
      >
        <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-4">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-[#7BB3E0]">
              Configuration Summary
            </p>
            <h3 id="summary-modal-title" className="mt-1 text-2xl font-semibold tracking-tight">
              {`${sizeSpec.label} MacBook Air (M4)`}
            </h3>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            aria-label="Close summary dialog"
            onClick={onClose}
            className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full border border-white/14 bg-white/5 text-[#CBD5E1] transition-colors hover:bg-white/12 hover:text-white"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <div className="mt-5 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
          <span
            className="h-7 w-7 shrink-0 rounded-full ring-1 ring-white/30"
            style={{ background: palette.swatchGradient }}
            aria-hidden="true"
          />
          <div>
            <p className="text-sm font-semibold text-[#F5F5F7]">{`${palette.name} Anodized Aluminum`}</p>
            <p className="font-mono text-xs text-[#9BA3B4] tabular-nums">
              {`${sizeSpec.displayInches} Liquid Retina · ${sizeSpec.resolution} · ${sizeSpec.thicknessCm}`}
            </p>
          </div>
        </div>

        <dl className="mt-5 space-y-2.5 text-sm">
          <div className="flex items-center justify-between border-b border-white/8 pb-2">
            <dt className="text-[#9BA3B4]">Base Model</dt>
            <dd className="font-mono tabular-nums">{formatUsd(price.basePrice)}</dd>
          </div>
          <div className="flex items-center justify-between border-b border-white/8 pb-2">
            <dt className="text-[#9BA3B4]">{`Apple M4 · 10-Core CPU / ${config.gpu} GPU`}</dt>
            <dd className="font-mono tabular-nums">
              {price.gpuDelta === 0 ? 'Included' : `+${formatUsd(price.gpuDelta)}`}
            </dd>
          </div>
          <div className="flex items-center justify-between border-b border-white/8 pb-2">
            <dt className="text-[#9BA3B4]">{`${config.memory}GB Unified Memory`}</dt>
            <dd className="font-mono tabular-nums">
              {price.memoryDelta === 0 ? 'Included' : `+${formatUsd(price.memoryDelta)}`}
            </dd>
          </div>
          <div className="flex items-center justify-between border-b border-white/8 pb-2">
            <dt className="text-[#9BA3B4]">{`${storageLabel} SSD Storage`}</dt>
            <dd className="font-mono tabular-nums">
              {price.storageDelta === 0 ? 'Included' : `+${formatUsd(price.storageDelta)}`}
            </dd>
          </div>
          <div className="flex items-center justify-between pt-2 text-base font-semibold">
            <dt>Estimated Total</dt>
            <dd className="font-mono text-2xl text-[#F5F5F7] tabular-nums">
              {formatUsd(price.total)}
            </dd>
          </div>
        </dl>

        <p className="mt-4 rounded-xl bg-white/[0.03] px-3.5 py-2.5 text-xs text-[#9BA3B4]">
          Includes 12MP Center Stage camera, MagSafe 3, 2× Thunderbolt 4, Dual 6K external display
          support (lid open), and up to 18 hours battery life.
        </p>

        <div className="mt-6 flex flex-wrap items-center justify-end gap-3">
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full border border-white/15 bg-white/6 px-4 text-xs font-semibold text-[#F5F5F7] transition-colors hover:bg-white/12"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-[#34D399]" aria-hidden="true" />
                <span>Copied</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Copy Specs</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onClose}
            className="inline-flex min-h-[44px] items-center justify-center rounded-full bg-[#7BB3E0] px-5 text-xs font-semibold text-[#050608] transition-colors hover:bg-[#99C7EB]"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
