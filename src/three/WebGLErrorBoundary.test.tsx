import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  computeAdaptiveDpr,
  detectWebGLSupport,
  usePrefersReducedMotion,
} from '../utils/webglSupport';
import { StaticMacBookFallback, WebGLErrorBoundary } from './WebGLErrorBoundary';

function ThrowingCanvas(): never {
  throw new Error('WebGL context lost');
}

function ReducedMotionProbe() {
  const reduced = usePrefersReducedMotion();
  return <span data-testid="reduced-motion-value">{reduced ? 'reduced' : 'full'}</span>;
}

describe('WebGL fallback & performance budget', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('caps DPR conservatively for mobile, desktop, and reduced motion', () => {
    expect(computeAdaptiveDpr(375, false)).toEqual([1, 1.25]);
    expect(computeAdaptiveDpr(767, false)).toEqual([1, 1.25]);
    expect(computeAdaptiveDpr(768, false)).toEqual([1, 1.75]);
    expect(computeAdaptiveDpr(1440, false)).toEqual([1, 1.75]);
    expect(computeAdaptiveDpr(1440, true)).toEqual([1, 1.25]);
  });

  it('returns false safely when canvas getContext returns null or throws', () => {
    const nullSpy = vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
    expect(detectWebGLSupport()).toBe(false);
    nullSpy.mockRestore();

    const throwSpy = vi
      .spyOn(HTMLCanvasElement.prototype, 'getContext')
      .mockImplementation(() => {
        throw new Error('WebGL disabled by policy');
      });
    expect(detectWebGLSupport()).toBe(false);
    throwSpy.mockRestore();
  });

  it('returns true when webgl2 or webgl context is available', () => {
    const webglFallbackSpy = vi
      .spyOn(HTMLCanvasElement.prototype, 'getContext')
      .mockImplementation((contextId: string) => {
        if (contextId === 'webgl') {
          return {} as WebGLRenderingContext;
        }
        return null;
      });

    expect(detectWebGLSupport()).toBe(true);
    expect(webglFallbackSpy).toHaveBeenCalledWith('webgl2');
    expect(webglFallbackSpy).toHaveBeenCalledWith('webgl');
  });

  it('subscribes to prefers-reduced-motion media query and reacts to changes', () => {
    let matches = true;
    const listeners = new Set<(event: MediaQueryListEvent) => void>();

    const mockMatchMedia = vi.fn().mockImplementation((query: string) => ({
      get matches() {
        return matches;
      },
      media: query,
      onchange: null,
      addEventListener: (_type: string, listener: (event: MediaQueryListEvent) => void) => {
        listeners.add(listener);
      },
      removeEventListener: (_type: string, listener: (event: MediaQueryListEvent) => void) => {
        listeners.delete(listener);
      },
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: () => false,
    }));

    vi.stubGlobal('matchMedia', mockMatchMedia);

    const { unmount } = render(<ReducedMotionProbe />);
    expect(screen.getByTestId('reduced-motion-value')).toHaveTextContent('reduced');
    expect(mockMatchMedia).toHaveBeenCalledWith('(prefers-reduced-motion: reduce)');

    act(() => {
      matches = false;
      listeners.forEach((listener) =>
        listener({ matches: false, media: '(prefers-reduced-motion: reduce)' } as MediaQueryListEvent),
      );
    });
    expect(screen.getByTestId('reduced-motion-value')).toHaveTextContent('full');

    unmount();
    expect(listeners.size).toBe(0);
    vi.unstubAllGlobals();
  });

  it('supports legacy matchMedia addListener/removeListener', () => {
    let legacyListener: ((event: MediaQueryListEvent) => void) | null = null;
    const addListener = vi.fn((cb: (event: MediaQueryListEvent) => void) => {
      legacyListener = cb;
    });
    const removeListener = vi.fn(() => {
      legacyListener = null;
    });

    vi.stubGlobal(
      'matchMedia',
      vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener,
        removeListener,
        dispatchEvent: () => false,
      })),
    );

    const { unmount } = render(<ReducedMotionProbe />);
    expect(screen.getByTestId('reduced-motion-value')).toHaveTextContent('full');
    expect(addListener).toHaveBeenCalledTimes(1);

    act(() => {
      legacyListener?.({ matches: true } as MediaQueryListEvent);
    });
    expect(screen.getByTestId('reduced-motion-value')).toHaveTextContent('reduced');

    unmount();
    expect(removeListener).toHaveBeenCalledTimes(1);
    vi.unstubAllGlobals();
  });

  it('catches WebGL child errors, invokes onError, and renders StaticMacBookFallback cleanly', () => {
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const onError = vi.fn();

    render(
      <WebGLErrorBoundary
        onError={onError}
        fallback={<StaticMacBookFallback finish="sky-blue" size="13" />}
      >
        <ThrowingCanvas />
      </WebGLErrorBoundary>,
    );

    expect(screen.getByTestId('static-macbook-fallback')).toBeInTheDocument();
    expect(screen.getByText(/Sky Blue/i)).toBeInTheDocument();
    expect(screen.getByText(/13-inch/i)).toBeInTheDocument();
    expect(screen.getByText(/2560 × 1664/)).toBeInTheDocument();
    expect(onError).toHaveBeenCalledWith(expect.objectContaining({ message: 'WebGL context lost' }));
    errSpy.mockRestore();
  });

  it('renders children normally when no error occurs and updates fallback metadata by finish/size', () => {
    const { rerender } = render(
      <WebGLErrorBoundary fallback={<StaticMacBookFallback finish="midnight" size="15" />}>
        <div data-testid="healthy-canvas">Live WebGL Scene</div>
      </WebGLErrorBoundary>,
    );

    expect(screen.getByTestId('healthy-canvas')).toBeInTheDocument();
    expect(screen.queryByTestId('static-macbook-fallback')).not.toBeInTheDocument();

    rerender(<StaticMacBookFallback finish="midnight" size="15" />);
    expect(screen.getByText(/Midnight/i)).toBeInTheDocument();
    expect(screen.getByText(/15-inch/i)).toBeInTheDocument();
    expect(screen.getByText(/2880 × 1864/)).toBeInTheDocument();
  });
});
