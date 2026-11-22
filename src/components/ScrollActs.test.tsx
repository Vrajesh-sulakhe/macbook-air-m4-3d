import { useRef } from 'react';
import { act, cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createInitialTimelineState } from '../three/scrollChoreography';
import type { TimelineState } from '../three/types';

const mockControls = vi.hoisted(() => {
  type TriggerConfig = {
    trigger?: Element | null;
    start?: string;
    end?: string;
    scrub?: boolean | number;
    onUpdate?: (self: { progress: number }) => void;
    onEnter?: () => void;
    onLeaveBack?: () => void;
  };

  const createdTriggers: Array<{ config: TriggerConfig; kill: ReturnType<typeof vi.fn> }> = [];
  const tickerCallbacks = new Set<(time: number) => void>();

  const lenisInstances: Array<{
    on: ReturnType<typeof vi.fn>;
    raf: ReturnType<typeof vi.fn>;
    scrollTo: ReturnType<typeof vi.fn>;
    destroy: ReturnType<typeof vi.fn>;
    unsubscribe: ReturnType<typeof vi.fn>;
  }> = [];

  const scrollTriggerUpdate = vi.fn();
  const scrollTriggerCreate = vi.fn((config: TriggerConfig) => {
    const kill = vi.fn();
    createdTriggers.push({ config, kill });
    return { kill };
  });

  const registerPlugin = vi.fn();
  const tickerAdd = vi.fn((cb: (time: number) => void) => {
    tickerCallbacks.add(cb);
    return cb;
  });
  const tickerRemove = vi.fn((cb: (time: number) => void) => {
    tickerCallbacks.delete(cb);
  });
  const tickerLagSmoothing = vi.fn();

  const LenisMock = vi.fn(function LenisCtor() {
    const unsubscribe = vi.fn();
    const instance = {
      on: vi.fn(() => unsubscribe),
      raf: vi.fn(),
      scrollTo: vi.fn(),
      destroy: vi.fn(),
      unsubscribe,
    };
    lenisInstances.push(instance);
    return instance;
  });

  const reset = () => {
    createdTriggers.length = 0;
    tickerCallbacks.clear();
    lenisInstances.length = 0;
    scrollTriggerUpdate.mockClear();
    scrollTriggerCreate.mockClear();
    registerPlugin.mockClear();
    tickerAdd.mockClear();
    tickerRemove.mockClear();
    tickerLagSmoothing.mockClear();
    LenisMock.mockClear();
  };

  return {
    createdTriggers,
    tickerCallbacks,
    lenisInstances,
    scrollTriggerUpdate,
    scrollTriggerCreate,
    registerPlugin,
    tickerAdd,
    tickerRemove,
    tickerLagSmoothing,
    LenisMock,
    reset,
  };
});

vi.mock('gsap', () => ({
  default: {
    registerPlugin: mockControls.registerPlugin,
    ticker: {
      add: mockControls.tickerAdd,
      remove: mockControls.tickerRemove,
      lagSmoothing: mockControls.tickerLagSmoothing,
    },
  },
}));

vi.mock('gsap/ScrollTrigger', () => ({
  ScrollTrigger: {
    create: mockControls.scrollTriggerCreate,
    update: mockControls.scrollTriggerUpdate,
  },
}));

vi.mock('lenis', () => ({
  default: mockControls.LenisMock,
}));

import { useScrollTimeline } from '../hooks/useScrollTimeline';
import { Navbar } from './Navbar';
import { ScrollActs } from './ScrollActs';

interface TimelineHarnessProps {
  reducedMotion: boolean;
  onStudioEnterChange: (entered: boolean) => void;
  onActiveActChange: (actIndex: number) => void;
  onTimelineRead?: (timeline: TimelineState) => void;
}

function TimelineHarness({
  reducedMotion,
  onStudioEnterChange,
  onActiveActChange,
  onTimelineRead,
}: TimelineHarnessProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const studioRef = useRef<HTMLElement | null>(null);
  const timelineRef = useRef<TimelineState>(createInitialTimelineState());

  const { scrollToSection } = useScrollTimeline({
    containerRef,
    studioRef,
    timelineRef,
    reducedMotion,
    onStudioEnterChange,
    onActiveActChange,
  });

  return (
    <div>
      <div ref={containerRef} id="scroll-story">
        <section id="overview">Overview</section>
        <section id="design">Design</section>
      </div>
      <section ref={studioRef} id="studio">
        Studio
      </section>
      <button type="button" onClick={() => scrollToSection('design')}>
        Jump Design
      </button>
      <button type="button" onClick={() => scrollToSection('studio')}>
        Jump Studio
      </button>
      <button type="button" onClick={() => onTimelineRead?.(timelineRef.current)}>
        Read Timeline
      </button>
    </div>
  );
}

describe('Navbar and ScrollActs editorial sections', () => {
  beforeEach(() => {
    mockControls.reset();
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('renders persistent navigation anchors, active finish dot, chapter state, and Configure CTA', async () => {
    const user = userEvent.setup();
    const onNavigate = vi.fn();
    render(<Navbar activeActIndex={2} finish="midnight" onNavigate={onNavigate} />);

    expect(screen.getByText(/MacBook Air/i)).toBeInTheDocument();
    expect(screen.getByTestId('navbar-finish-dot')).toHaveStyle({ backgroundColor: '#1E2532' });

    const siliconBtn = screen.getByRole('button', { name: 'M4 Silicon' });
    const overviewBtn = screen.getByRole('button', { name: 'Overview' });
    expect(siliconBtn).toHaveAttribute('aria-current', 'location');
    expect(overviewBtn).not.toHaveAttribute('aria-current');

    await user.click(screen.getByRole('button', { name: 'Design' }));
    expect(onNavigate).toHaveBeenCalledWith('design');

    await user.click(screen.getByRole('button', { name: /Configure/i }));
    expect(onNavigate).toHaveBeenCalledWith('studio');
  });

  it('displays accurate M4 specs across Acts 1-5 and triggers preview callbacks cleanly', async () => {
    const user = userEvent.setup();
    const onFinishPreview = vi.fn();
    const onJumpToStudio = vi.fn();
    render(
      <ScrollActs
        finish="sky-blue"
        onFinishPreview={onFinishPreview}
        onJumpToStudio={onJumpToStudio}
      />,
    );

    expect(screen.getByRole('heading', { name: /MacBook Air M4/i })).toBeInTheDocument();
    expect(screen.getByText(/Sky-high speed\. Featherlight Air\./i)).toBeInTheDocument();
    expect(screen.getByText(/\$999/)).toBeInTheDocument();

    expect(screen.getByText(/1\.13 cm/i)).toBeInTheDocument();
    expect(screen.getByText(/2\.7 lb/i)).toBeInTheDocument();
    expect(screen.getByText(/>50%/)).toBeInTheDocument();
    expect(screen.getByText(/Fanless/i)).toBeInTheDocument();

    expect(screen.getByText(/10-Core CPU/i)).toBeInTheDocument();
    expect(screen.getByText(/Up to 10-Core GPU/i)).toBeInTheDocument();
    expect(screen.getByText(/16-Core Neural Engine/i)).toBeInTheDocument();
    expect(screen.getByText(/16GB–32GB/i)).toBeInTheDocument();

    expect(screen.getByText(/2560 × 1664/)).toBeInTheDocument();
    expect(screen.getByText(/500 nits/i)).toBeInTheDocument();
    expect(screen.getByText(/P3 Wide Color/i)).toBeInTheDocument();
    expect(screen.getByText(/12MP Center Stage/i)).toBeInTheDocument();
    expect(screen.getByText(/Dual 6K/i)).toBeInTheDocument();

    expect(screen.getByText(/MagSafe 3/i)).toBeInTheDocument();
    expect(screen.getByText(/2× Thunderbolt 4/i)).toBeInTheDocument();
    expect(screen.getByText(/40Gb\/s/i)).toBeInTheDocument();
    expect(screen.getByText(/3\.5mm/i)).toBeInTheDocument();
    expect(screen.getByText(/18 hrs/i)).toBeInTheDocument();

    const skyBlueBtn = screen.getByRole('button', { name: /Sky Blue/i });
    const midnightBtn = screen.getByRole('button', { name: /Midnight/i });
    expect(skyBlueBtn).toHaveAttribute('aria-pressed', 'true');
    expect(midnightBtn).toHaveAttribute('aria-pressed', 'false');

    await user.click(midnightBtn);
    expect(onFinishPreview).toHaveBeenCalledWith('midnight');

    await user.click(screen.getByRole('button', { name: /Explore in 3D/i }));
    expect(onJumpToStudio).toHaveBeenCalled();
  });
});

describe('useScrollTimeline GSAP and Lenis lifecycle', () => {
  beforeEach(() => {
    mockControls.reset();
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('syncs Lenis with GSAP ticker/ScrollTrigger, guards active act emissions, and cleans up on unmount', async () => {
    const user = userEvent.setup();
    const onStudioEnterChange = vi.fn();
    const onActiveActChange = vi.fn();
    const onTimelineRead = vi.fn();

    const { unmount } = render(
      <TimelineHarness
        reducedMotion={false}
        onStudioEnterChange={onStudioEnterChange}
        onActiveActChange={onActiveActChange}
        onTimelineRead={onTimelineRead}
      />,
    );

    expect(mockControls.registerPlugin).toHaveBeenCalledTimes(1);
    expect(mockControls.LenisMock).toHaveBeenCalledTimes(1);
    expect(mockControls.tickerLagSmoothing).toHaveBeenCalledWith(0);
    expect(mockControls.tickerAdd).toHaveBeenCalledTimes(1);
    expect(mockControls.createdTriggers).toHaveLength(2);

    const lenis = mockControls.lenisInstances[0];
    expect(lenis.on).toHaveBeenCalledWith('scroll', mockControls.scrollTriggerUpdate);

    // GSAP ticker drives lenis.raf(time * 1000)
    const [rafCb] = Array.from(mockControls.tickerCallbacks);
    rafCb(1.5);
    expect(lenis.raf).toHaveBeenCalledWith(1500);

    // Scrub story trigger and verify activeActIndex change guard
    const storyTrigger = mockControls.createdTriggers.find(
      (entry) => (entry.config.trigger as HTMLElement)?.id === 'scroll-story',
    );
    const studioTrigger = mockControls.createdTriggers.find(
      (entry) => (entry.config.trigger as HTMLElement)?.id === 'studio',
    );

    expect(storyTrigger).toBeDefined();
    expect(studioTrigger?.config.start).toBe('top 55%');

    act(() => {
      storyTrigger!.config.onUpdate?.({ progress: 0.25 });
      storyTrigger!.config.onUpdate?.({ progress: 0.31 });
    });

    expect(onActiveActChange).toHaveBeenCalledTimes(1);
    expect(onActiveActChange).toHaveBeenCalledWith(1);

    await user.click(screen.getByRole('button', { name: 'Read Timeline' }));
    expect(onTimelineRead).toHaveBeenCalledWith(
      expect.objectContaining({
        activeActIndex: 1,
        scrollProgress: 0.31,
      }),
    );

    act(() => {
      studioTrigger!.config.onEnter?.();
      studioTrigger!.config.onLeaveBack?.();
    });
    expect(onStudioEnterChange).toHaveBeenNthCalledWith(1, true);
    expect(onStudioEnterChange).toHaveBeenNthCalledWith(2, false);

    await user.click(screen.getByRole('button', { name: 'Jump Design' }));
    expect(lenis.scrollTo).toHaveBeenCalledWith(
      document.getElementById('design'),
      expect.objectContaining({ offset: 0 }),
    );

    unmount();
    expect(storyTrigger!.kill).toHaveBeenCalledTimes(1);
    expect(studioTrigger!.kill).toHaveBeenCalledTimes(1);
    expect(mockControls.tickerRemove).toHaveBeenCalledWith(rafCb);
    expect(lenis.unsubscribe).toHaveBeenCalledTimes(1);
    expect(lenis.destroy).toHaveBeenCalledTimes(1);
  });

  it('skips Lenis when reducedMotion is active and falls back to instant native scrollIntoView', async () => {
    const user = userEvent.setup();
    const scrollIntoViewMock = vi.fn();
    Element.prototype.scrollIntoView = scrollIntoViewMock;

    const { unmount } = render(
      <TimelineHarness
        reducedMotion={true}
        onStudioEnterChange={vi.fn()}
        onActiveActChange={vi.fn()}
      />,
    );

    expect(mockControls.LenisMock).not.toHaveBeenCalled();
    expect(mockControls.tickerAdd).not.toHaveBeenCalled();
    expect(mockControls.createdTriggers).toHaveLength(2);

    await user.click(screen.getByRole('button', { name: 'Jump Studio' }));
    expect(scrollIntoViewMock).toHaveBeenCalledWith(
      expect.objectContaining({ behavior: 'auto' }),
    );

    unmount();
    expect(mockControls.createdTriggers[0].kill).toHaveBeenCalledTimes(1);
    expect(mockControls.createdTriggers[1].kill).toHaveBeenCalledTimes(1);
  });
});
