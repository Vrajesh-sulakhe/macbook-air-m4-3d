import { FINISH_PALETTES, SIZE_SPECS, type FinishId } from '../data/macbookSpecs';

export interface NavbarProps {
  activeActIndex: number;
  finish: FinishId;
  onNavigate: (sectionId: string) => void;
}

interface NavChapter {
  id: string;
  label: string;
  isActive: (actIndex: number) => boolean;
}

const NAV_CHAPTERS: readonly NavChapter[] = [
  { id: 'overview', label: 'Overview', isActive: (idx) => idx === 0 },
  { id: 'design', label: 'Design', isActive: (idx) => idx === 1 },
  { id: 'silicon', label: 'M4 Silicon', isActive: (idx) => idx === 2 },
  { id: 'display', label: 'Display', isActive: (idx) => idx === 3 },
  { id: 'studio', label: 'Studio 3D', isActive: (idx) => idx >= 5 },
];

/**
 * Persistent floating frosted-glass pill navigation bar with active finish dot,
 * chapter indicators, and responsive Configure CTA.
 */
export function Navbar({ activeActIndex, finish, onNavigate }: NavbarProps) {
  const palette = FINISH_PALETTES[finish];
  const startingPrice = SIZE_SPECS['13'].basePrice;

  return (
    <header className="pointer-events-none fixed inset-x-0 top-3 z-40 flex justify-center px-3 sm:top-4 sm:px-6">
      <nav
        aria-label="Primary navigation"
        className="pointer-events-auto flex w-full max-w-5xl min-w-0 items-center justify-between gap-2 rounded-full border border-white/15 bg-[#0A0D13]/82 px-2.5 py-1 text-[#F5F5F7] shadow-[0_14px_40px_rgba(0,0,0,0.45)] ring-1 ring-black/20 backdrop-blur-xl sm:px-4"
      >
        <button
          type="button"
          onClick={() => onNavigate('overview')}
          className="inline-flex min-h-[44px] shrink-0 items-center gap-2 rounded-full px-2 text-left text-xs font-semibold tracking-tight text-[#F5F5F7] transition-colors hover:text-white sm:text-sm"
        >
          <span
            data-testid="navbar-finish-dot"
            className="h-2.5 w-2.5 shrink-0 rounded-full ring-1 ring-white/40"
            style={{ backgroundColor: palette.hex }}
            title={palette.name}
            aria-hidden="true"
          />
          <span className="whitespace-nowrap">
            MacBook Air <span className="font-mono text-[#7BB3E0]">M4</span>
          </span>
        </button>

        <div className="hidden items-center gap-1 md:flex">
          {NAV_CHAPTERS.map((chapter) => {
            const active = chapter.isActive(activeActIndex);
            return (
              <button
                key={chapter.id}
                type="button"
                onClick={() => onNavigate(chapter.id)}
                aria-current={active ? 'location' : undefined}
                data-active={active ? 'true' : 'false'}
                className={
                  active
                    ? 'inline-flex min-h-[44px] items-center rounded-full bg-white/15 px-3 text-xs font-medium whitespace-nowrap text-[#F5F5F7] ring-1 ring-white/25 transition-colors'
                    : 'inline-flex min-h-[44px] items-center rounded-full px-3 text-xs font-medium whitespace-nowrap text-[#9BA3B4] transition-colors hover:bg-white/10 hover:text-[#F5F5F7]'
                }
              >
                {chapter.label}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => onNavigate('studio')}
          className="group inline-flex min-h-[44px] shrink-0 items-center justify-center gap-2 rounded-full bg-[#F5F5F7] pl-4 pr-2 text-xs font-semibold tracking-tight whitespace-nowrap text-[#050608] tabular-nums transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-[#DCEAF7] active:scale-[0.98] sm:pl-4 sm:pr-2.5"
        >
          <span>{`Configure · From $${startingPrice}`}</span>
          <span
            aria-hidden="true"
            className="flex h-6 w-6 items-center justify-center rounded-full bg-[#050608]/10 text-[11px] transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-0.5 group-hover:-translate-y-[1px]"
          >
            ↗
          </span>
        </button>
      </nav>
    </header>
  );
}
