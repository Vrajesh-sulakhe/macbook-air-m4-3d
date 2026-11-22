import { useCallback, useEffect, useRef, type MutableRefObject, type RefObject } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { evaluateScrollTimeline, type TimelineState } from '../three/scrollChoreography';

export interface UseScrollTimelineOptions {
  containerRef: RefObject<HTMLElement | null>;
  studioRef: RefObject<HTMLElement | null>;
  timelineRef: MutableRefObject<TimelineState>;
  reducedMotion: boolean;
  onStudioEnterChange: (entered: boolean) => void;
  onActiveActChange: (actIndex: number) => void;
}

export interface UseScrollTimelineResult {
  scrollToSection: (id: string) => void;
}

/**
 * Synchronizes Lenis smooth scrolling with GSAP ScrollTrigger across the 5-act story
 * container and studio handoff boundary, falling back to native scroll under reduced motion.
 */
export function useScrollTimeline({
  containerRef,
  studioRef,
  timelineRef,
  reducedMotion,
  onStudioEnterChange,
  onActiveActChange,
}: UseScrollTimelineOptions): UseScrollTimelineResult {
  const lenisRef = useRef<Lenis | null>(null);
  const onStudioEnterRef = useRef(onStudioEnterChange);
  const onActiveActRef = useRef(onActiveActChange);
  const lastActIndexRef = useRef<number>(timelineRef.current.activeActIndex);

  useEffect(() => {
    onStudioEnterRef.current = onStudioEnterChange;
    onActiveActRef.current = onActiveActChange;
  }, [onStudioEnterChange, onActiveActChange]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    gsap.registerPlugin(ScrollTrigger);

    let lenis: Lenis | null = null;
    let unsubscribeLenisScroll: (() => void) | null = null;
    let tickerCallback: ((time: number) => void) | null = null;

    if (!reducedMotion) {
      lenis = new Lenis({
        lerp: 0.1,
        smoothWheel: true,
        autoRaf: false,
        autoResize: typeof ResizeObserver !== 'undefined',
        respectReducedMotion: true,
      });
      lenisRef.current = lenis;
      unsubscribeLenisScroll = lenis.on('scroll', ScrollTrigger.update);
      tickerCallback = (time: number) => {
        lenis?.raf(time * 1000);
      };
      gsap.ticker.add(tickerCallback);
      gsap.ticker.lagSmoothing(0);
    } else {
      lenisRef.current = null;
    }

    const containerEl = containerRef.current;
    const studioEl = studioRef.current;

    const storyTrigger = containerEl
      ? ScrollTrigger.create({
          trigger: containerEl,
          start: 'top top',
          end: 'bottom bottom',
          scrub: true,
          onUpdate: (self) => {
            const nextState = evaluateScrollTimeline(self.progress, timelineRef.current);
            if (nextState.activeActIndex !== lastActIndexRef.current) {
              lastActIndexRef.current = nextState.activeActIndex;
              onActiveActRef.current(nextState.activeActIndex);
            }
          },
        })
      : null;

    const studioTrigger = studioEl
      ? ScrollTrigger.create({
          trigger: studioEl,
          start: 'top 55%',
          onEnter: () => {
            onStudioEnterRef.current(true);
          },
          onLeaveBack: () => {
            onStudioEnterRef.current(false);
          },
        })
      : null;

    return () => {
      storyTrigger?.kill();
      studioTrigger?.kill();
      if (tickerCallback) {
        gsap.ticker.remove(tickerCallback);
        gsap.ticker.lagSmoothing(500, 33);
      }
      unsubscribeLenisScroll?.();
      if (lenis) {
        lenis.destroy();
        if (lenisRef.current === lenis) {
          lenisRef.current = null;
        }
      }
    };
  }, [containerRef, studioRef, timelineRef, reducedMotion]);

  const scrollToSection = useCallback(
    (id: string) => {
      if (typeof document === 'undefined') {
        return;
      }

      const target = document.getElementById(id);
      if (!target) {
        return;
      }

      if (reducedMotion || !lenisRef.current) {
        target.scrollIntoView({ behavior: 'auto', block: 'start' });
        return;
      }

      lenisRef.current.scrollTo(target, {
        offset: 0,
        duration: 1.1,
      });
    },
    [reducedMotion],
  );

  return { scrollToSection };
}
