import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import App from './App';

vi.mock('gsap', () => {
  const ticker = {
    add: vi.fn(),
    remove: vi.fn(),
    lagSmoothing: vi.fn(),
  };
  return {
    default: {
      registerPlugin: vi.fn(),
      ticker,
    },
    ticker,
  };
});

vi.mock('gsap/ScrollTrigger', () => ({
  ScrollTrigger: {
    create: vi.fn(() => ({ kill: vi.fn() })),
    update: vi.fn(),
  },
}));

vi.mock('lenis', () => ({
  default: class MockLenis {
    on() {
      return () => {};
    }
    raf() {}
    scrollTo() {}
    destroy() {}
  },
}));

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('App integration and WebGL fallback workflow', () => {
  it('renders fallback hardware preview when WebGL is unavailable and supports full configurator & modal flows', async () => {
    const user = userEvent.setup();
    const getContextSpy = vi
      .spyOn(HTMLCanvasElement.prototype, 'getContext')
      .mockReturnValue(null);

    render(<App />);

    expect(screen.getByRole('heading', { name: /^MacBook Air M4$/i })).toBeInTheDocument();
    expect(screen.getByTestId('static-macbook-fallback')).toBeInTheDocument();
    expect(screen.getByTestId('studio-configurator-price')).toHaveTextContent('$999');

    const studioPanel = screen.getByTestId('studio-configurator');
    await user.click(within(studioPanel).getByRole('button', { name: /^15-inch/i }));
    await user.click(within(studioPanel).getByRole('button', { name: /Midnight/i }));
    await user.click(within(studioPanel).getByRole('button', { name: /^24GB/i }));
    await user.click(within(studioPanel).getByRole('button', { name: /^512GB/i }));

    expect(screen.getByTestId('studio-configurator-price')).toHaveTextContent('$1,599');
    expect(screen.getByTestId('static-macbook-fallback')).toHaveTextContent(/Midnight/i);
    expect(screen.getByTestId('static-macbook-fallback')).toHaveTextContent(/15-inch/i);

    const reviewBtn = within(studioPanel).getByRole('button', { name: /Review Configuration/i });
    await user.click(reviewBtn);

    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();
    expect(dialog).toHaveTextContent(/15-inch MacBook Air \(M4\)/i);
    expect(dialog).toHaveTextContent('$1,599');

    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    getContextSpy.mockRestore();
  });

  it('activates Studio interactive container when navigating via Configure CTA and restores on Back to Story', async () => {
    const user = userEvent.setup();
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
    Element.prototype.scrollIntoView = vi.fn();

    render(<App />);
    expect(screen.getByTestId('stage-container')).toHaveClass('pointer-events-none');

    await user.click(screen.getByRole('button', { name: /Configure/i }));
    expect(screen.getByTestId('stage-container')).toHaveClass('pointer-events-auto');

    await user.click(screen.getByRole('button', { name: /Back to Story/i }));
    expect(screen.getByTestId('stage-container')).toHaveClass('pointer-events-none');
  });
});
