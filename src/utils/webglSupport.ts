import { useEffect, useState } from 'react';

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';
const MOBILE_BREAKPOINT_PX = 768;

interface LegacyMediaQueryList {
  matches: boolean;
  addEventListener?: (type: 'change', listener: (event: MediaQueryListEvent) => void) => void;
  removeEventListener?: (type: 'change', listener: (event: MediaQueryListEvent) => void) => void;
  addListener?: (listener: (event: MediaQueryListEvent) => void) => void;
  removeListener?: (listener: (event: MediaQueryListEvent) => void) => void;
}

/**
 * Safely detects whether the current browser environment can create a WebGL2 or WebGL context.
 */
export function detectWebGLSupport(): boolean {
  if (typeof document === 'undefined') {
    return false;
  }

  try {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('webgl2') || canvas.getContext('webgl');
    return Boolean(context);
  } catch {
    return false;
  }
}

/**
 * Computes a conservative [min, max] device pixel ratio tuple for R3F Canvas rendering.
 */
export function computeAdaptiveDpr(
  viewportWidth: number,
  reducedMotion: boolean,
): [number, number] {
  if (reducedMotion || viewportWidth < MOBILE_BREAKPOINT_PX) {
    return [1, 1.25];
  }

  return [1, 1.75];
}

function readReducedMotionPreference(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false;
  }

  return window.matchMedia(REDUCED_MOTION_QUERY).matches;
}

/**
 * React hook subscribing to the user's `prefers-reduced-motion: reduce` media preference.
 */
export function usePrefersReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState<boolean>(
    readReducedMotionPreference,
  );

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return undefined;
    }

    const mediaQuery = window.matchMedia(REDUCED_MOTION_QUERY) as LegacyMediaQueryList;
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };

    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', handleChange);
      return () => {
        mediaQuery.removeEventListener?.('change', handleChange);
      };
    }

    if (typeof mediaQuery.addListener === 'function') {
      mediaQuery.addListener(handleChange);
      return () => {
        mediaQuery.removeListener?.(handleChange);
      };
    }

    return undefined;
  }, []);

  return prefersReducedMotion;
}
