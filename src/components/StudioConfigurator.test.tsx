import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_CONFIG } from '../data/macbookSpecs';
import { StudioConfigurator } from './StudioConfigurator';
import { SummaryModal } from './SummaryModal';

afterEach(() => {
  cleanup();
});

describe('StudioConfigurator and SummaryModal', () => {
  it('updates price live, emits config patches, and exposes camera/hardware controls', async () => {
    const user = userEvent.setup();
    const onConfigChange = vi.fn();
    const onPresetChange = vi.fn();
    const onLidAngleChange = vi.fn();
    const onXrayToggle = vi.fn();
    const onBacklightToggle = vi.fn();
    const onScreenModeChange = vi.fn();
    const onZoomChange = vi.fn();
    const onResetView = vi.fn();
    const onReviewClick = vi.fn();
    const onBackToStory = vi.fn();

    render(
      <StudioConfigurator
        config={DEFAULT_CONFIG}
        studioPreset="hero"
        lidAngleDeg={108}
        xrayEnabled={false}
        backlightEnabled={true}
        screenMode="sequoia"
        zoomStep={0}
        onConfigChange={onConfigChange}
        onPresetChange={onPresetChange}
        onLidAngleChange={onLidAngleChange}
        onXrayToggle={onXrayToggle}
        onBacklightToggle={onBacklightToggle}
        onScreenModeChange={onScreenModeChange}
        onZoomChange={onZoomChange}
        onResetView={onResetView}
        onReviewClick={onReviewClick}
        onBackToStory={onBackToStory}
      />,
    );

    expect(screen.getByText('$999')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /512GB/i }));
    expect(onConfigChange).toHaveBeenCalledWith({ storage: 512 });

    await user.click(screen.getByRole('button', { name: /M4 X-Ray/i }));
    expect(onPresetChange).toHaveBeenCalledWith('xray');

    await user.click(screen.getByRole('button', { name: /Zoom in/i }));
    expect(onZoomChange).toHaveBeenCalledWith(1);

    await user.click(screen.getByRole('button', { name: /Reset view/i }));
    expect(onResetView).toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: /X-Ray Mode/i }));
    expect(onXrayToggle).toHaveBeenCalledWith(true);

    await user.click(screen.getByRole('button', { name: /Keyboard Backlight/i }));
    expect(onBacklightToggle).toHaveBeenCalledWith(false);

    await user.click(screen.getByRole('button', { name: /Apple Intelligence/i }));
    expect(onScreenModeChange).toHaveBeenCalledWith('intelligence');

    fireEvent.change(screen.getByLabelText(/Lid Angle/i), { target: { value: '82' } });
    expect(onLidAngleChange).toHaveBeenCalledWith(82);

    await user.click(screen.getByRole('button', { name: /Back to Story/i }));
    expect(onBackToStory).toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: /Review Configuration/i }));
    expect(onReviewClick).toHaveBeenCalled();
  });

  it('displays GPU coupling lock reason on 13-inch 512GB and 15-inch configurations', () => {
    const { rerender } = render(
      <StudioConfigurator
        config={{ ...DEFAULT_CONFIG, storage: 512, gpu: '10-core' }}
        studioPreset="hero"
        lidAngleDeg={108}
        xrayEnabled={false}
        backlightEnabled={true}
        screenMode="sequoia"
        zoomStep={0}
        onConfigChange={vi.fn()}
        onPresetChange={vi.fn()}
        onLidAngleChange={vi.fn()}
        onXrayToggle={vi.fn()}
        onBacklightToggle={vi.fn()}
        onScreenModeChange={vi.fn()}
        onZoomChange={vi.fn()}
        onResetView={vi.fn()}
        onReviewClick={vi.fn()}
        onBackToStory={vi.fn()}
      />,
    );

    expect(screen.getByText('$1,199')).toBeInTheDocument();
    const eightCoreBtn = screen.getByRole('button', { name: /8-core GPU/i });
    expect(eightCoreBtn).toBeDisabled();
    expect(screen.getByText(/Included with 512GB\+ SSD/i)).toBeInTheDocument();

    rerender(
      <StudioConfigurator
        config={{ ...DEFAULT_CONFIG, size: '15', gpu: '10-core', memory: 24, storage: 512 }}
        studioPreset="profile"
        lidAngleDeg={108}
        xrayEnabled={false}
        backlightEnabled={true}
        screenMode="sequoia"
        zoomStep={0}
        onConfigChange={vi.fn()}
        onPresetChange={vi.fn()}
        onLidAngleChange={vi.fn()}
        onXrayToggle={vi.fn()}
        onBacklightToggle={vi.fn()}
        onScreenModeChange={vi.fn()}
        onZoomChange={vi.fn()}
        onResetView={vi.fn()}
        onReviewClick={vi.fn()}
        onBackToStory={vi.fn()}
      />,
    );

    expect(screen.getByText('$1,599')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /8-core GPU/i })).toBeDisabled();
    expect(screen.getByText(/Standard on 15-inch/i)).toBeInTheDocument();
    expect(screen.getByText(/1\.15 cm/i)).toBeInTheDocument();
  });

  it('closes SummaryModal on Escape key, copies formatted specs, and closes on backdrop click', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText },
      configurable: true,
    });

    const { rerender } = render(
      <SummaryModal isOpen={false} config={DEFAULT_CONFIG} onClose={onClose} />,
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    rerender(<SummaryModal isOpen={true} config={DEFAULT_CONFIG} onClose={onClose} />);
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Copy Specs/i }));
    expect(writeText).toHaveBeenCalledWith(expect.stringContaining('$999'));
    expect(screen.getByText(/Copied/i)).toBeInTheDocument();

    await user.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledTimes(1);

    await user.click(screen.getByTestId('summary-modal-backdrop'));
    expect(onClose).toHaveBeenCalledTimes(2);
  });
});
