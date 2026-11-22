import { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Navbar } from './components/Navbar';
import { ScrollActs } from './components/ScrollActs';
import { StudioConfigurator } from './components/StudioConfigurator';
import { SummaryModal } from './components/SummaryModal';
import {
  DEFAULT_CONFIG,
  FINISH_PALETTES,
  normalizeConfigSelection,
  type CameraPresetId,
  type FinishId,
  type MacBookConfigState,
  type ScreenModeId,
} from './data/macbookSpecs';
import { useScrollTimeline } from './hooks/useScrollTimeline';
import { createInitialTimelineState } from './three/scrollChoreography';
import { StaticMacBookFallback, WebGLErrorBoundary } from './three/WebGLErrorBoundary';
import { detectWebGLSupport, usePrefersReducedMotion } from './utils/webglSupport';

const MacBookScene = lazy(() =>
  import('./three/MacBookScene').then((mod) => ({ default: mod.MacBookScene })),
);

const ACT_BACKGROUNDS: readonly string[] = [
  '#050608', // Act 1: Obsidian Keynote Hero
  '#EAEFF5', // Act 2: Studio Porcelain Unibody
  '#070B14', // Act 3: Deep Slate M4 X-Ray
  '#090B10', // Act 4: Charcoal Display & Dual 6K
  '#E4ECF4', // Act 5: Silver Mist Connectivity
];

/**
 * Root MacBook Air M4 3D landing application uniting the 5-act scroll choreography
 * stage with the interactive 3D hardware studio and spec configurator.
 */
export default function App() {
  const storyRef = useRef<HTMLDivElement | null>(null);
  const studioRef = useRef<HTMLElement | null>(null);
  const timelineRef = useRef(createInitialTimelineState());

  const reducedMotion = usePrefersReducedMotion();
  const webglSupported = useMemo(() => detectWebGLSupport(), []);

  const [viewportWidth, setViewportWidth] = useState<number>(() =>
    typeof window !== 'undefined' ? window.innerWidth : 1440,
  );
  const [activeActIndex, setActiveActIndex] = useState<number>(0);
  const [isStudioInteractive, setIsStudioInteractive] = useState<boolean>(false);

  const [config, setConfig] = useState<MacBookConfigState>(DEFAULT_CONFIG);
  const [studioPreset, setStudioPreset] = useState<CameraPresetId>('hero');
  const [zoomStep, setZoomStep] = useState<number>(0);
  const [manualLidAngleDeg, setManualLidAngleDeg] = useState<number | null>(null);
  const [manualXray, setManualXray] = useState<boolean | null>(null);
  const [manualBacklight, setManualBacklight] = useState<boolean | null>(null);
  const [screenMode, setScreenMode] = useState<ScreenModeId>('sequoia');
  const [isSummaryOpen, setIsSummaryOpen] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }
    const handleResize = () => {
      setViewportWidth(window.innerWidth);
    };
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const handleStudioEnterChange = useCallback((entered: boolean) => {
    setIsStudioInteractive(entered);
    if (entered) {
      setActiveActIndex(5);
      setManualLidAngleDeg((prev) => (prev === null ? 108 : prev));
    } else {
      setManualLidAngleDeg(null);
      setManualXray(null);
      setManualBacklight(null);
      setActiveActIndex(timelineRef.current.activeActIndex);
    }
  }, []);

  const { scrollToSection } = useScrollTimeline({
    containerRef: storyRef,
    studioRef,
    timelineRef,
    reducedMotion,
    onStudioEnterChange: handleStudioEnterChange,
    onActiveActChange: setActiveActIndex,
  });

  const handleNavigate = useCallback(
    (sectionId: string) => {
      scrollToSection(sectionId);
      if (sectionId === 'studio') {
        handleStudioEnterChange(true);
      } else if (sectionId === 'overview') {
        handleStudioEnterChange(false);
      }
    },
    [handleStudioEnterChange, scrollToSection],
  );

  const handleConfigChange = useCallback((patch: Partial<MacBookConfigState>) => {
    setConfig((prev) => normalizeConfigSelection(prev, patch));
  }, []);

  const handleFinishPreview = useCallback((finish: FinishId) => {
    setConfig((prev) => normalizeConfigSelection(prev, { finish }));
  }, []);

  const handlePresetChange = useCallback((preset: CameraPresetId) => {
    setStudioPreset(preset);
    setManualXray(preset === 'xray');
    timelineRef.current.magsafeSnap = preset === 'ports' ? 1 : 0;
  }, []);

  const handleXrayToggle = useCallback((enabled: boolean) => {
    setManualXray(enabled);
    setStudioPreset((prev) => {
      if (enabled) {
        timelineRef.current.magsafeSnap = 0;
        return 'xray';
      }
      return prev === 'xray' ? 'hero' : prev;
    });
  }, []);

  const handleScreenModeChange = useCallback((mode: ScreenModeId) => {
    setScreenMode(mode);
    setManualLidAngleDeg((prev) => (prev !== null && prev < 25 ? 108 : prev));
  }, []);

  const handleZoomChange = useCallback((delta: number) => {
    setZoomStep((prev) => Math.max(-2, Math.min(2, prev + delta)));
  }, []);

  const handleResetView = useCallback(() => {
    setStudioPreset('hero');
    setZoomStep(0);
    setManualLidAngleDeg(108);
    setManualXray(false);
    setManualBacklight(true);
    setScreenMode('sequoia');
    timelineRef.current.magsafeSnap = 0;
  }, []);

  const activePalette = FINISH_PALETTES[config.finish];
  const stageBgColor = isStudioInteractive
    ? '#070A10'
    : (ACT_BACKGROUNDS[activeActIndex] ?? '#050608');
  const isLightBackdrop = !isStudioInteractive && (activeActIndex === 1 || activeActIndex === 4);

  const stageContainerClass = isStudioInteractive
    ? 'fixed inset-x-0 top-0 z-10 h-[46vh] pointer-events-auto lg:inset-y-0 lg:left-0 lg:right-[480px] lg:h-auto xl:right-[520px]'
    : 'fixed inset-0 z-0 pointer-events-none';

  return (
    <div className="relative min-h-screen text-[#F5F5F7]">
      <Navbar activeActIndex={activeActIndex} finish={config.finish} onNavigate={handleNavigate} />

      {/* Continuous 3D Hardware Stage / WebGL Fallback */}
      <div
        data-testid="stage-container"
        aria-hidden={webglSupported && !isStudioInteractive ? true : undefined}
        className={`${stageContainerClass} overflow-hidden transition-colors duration-700`}
        style={{ backgroundColor: stageBgColor }}
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 transition-opacity duration-700"
          style={{
            background: isLightBackdrop
              ? `radial-gradient(circle at 50% 45%, ${activePalette.rimTint}33 0%, rgba(255,255,255,0.45) 48%, rgba(215,225,236,0.92) 100%)`
              : `radial-gradient(circle at 52% 44%, ${activePalette.rimTint}24 0%, rgba(7,10,16,0.2) 55%, rgba(5,6,8,0.88) 100%)`,
          }}
        />

        <div className="relative h-full w-full">
          <WebGLErrorBoundary
            fallback={<StaticMacBookFallback finish={config.finish} size={config.size} />}
          >
            {webglSupported ? (
              <Suspense
                fallback={<StaticMacBookFallback finish={config.finish} size={config.size} />}
              >
                <MacBookScene
                  timelineRef={timelineRef}
                  isStudioInteractive={isStudioInteractive}
                  studioPreset={studioPreset}
                  zoomStep={zoomStep}
                  finish={config.finish}
                  size={config.size}
                  screenMode={screenMode}
                  manualLidAngleDeg={manualLidAngleDeg}
                  manualXray={manualXray}
                  manualBacklight={manualBacklight}
                  reducedMotion={reducedMotion}
                  viewportWidth={viewportWidth}
                />
              </Suspense>
            ) : (
              <StaticMacBookFallback finish={config.finish} size={config.size} />
            )}
          </WebGLErrorBoundary>
        </div>

        {isStudioInteractive && webglSupported && (
          <div className="pointer-events-none absolute inset-x-0 bottom-4 flex justify-center px-4">
            <span className="rounded-full border border-white/15 bg-[#0A0D14]/78 px-3.5 py-1.5 font-mono text-[11px] text-[#CBD5E1] backdrop-blur-md">
              Drag to orbit 360° · Double-click to reset
            </span>
          </div>
        )}
      </div>

      {/* Main Content Foreground */}
      <main className="pointer-events-none relative z-10">
        <div ref={storyRef} id="scroll-story">
          <ScrollActs
            finish={config.finish}
            onFinishPreview={handleFinishPreview}
            onJumpToStudio={() => handleNavigate('studio')}
          />
        </div>

        {/* Act 6: Interactive 3D Studio & Configurator */}
        <section
          ref={studioRef}
          id="studio"
          aria-label="Interactive 3D Studio and Configurator"
          className="pointer-events-none relative z-20 min-h-screen px-4 pt-6 pb-16 sm:px-6 lg:flex lg:items-center lg:px-8 lg:py-24"
        >
          {/* Mobile spacer leaving top 46vh clear for the pinned 3D stage */}
          <div className="h-[44vh] lg:hidden" aria-hidden="true" />

          <div className="pointer-events-auto relative z-20 w-full lg:ml-auto lg:w-[460px] xl:w-[500px]">
            <StudioConfigurator
              config={config}
              studioPreset={studioPreset}
              lidAngleDeg={manualLidAngleDeg ?? 108}
              xrayEnabled={Boolean(manualXray)}
              backlightEnabled={manualBacklight ?? true}
              screenMode={screenMode}
              zoomStep={zoomStep}
              onConfigChange={handleConfigChange}
              onPresetChange={handlePresetChange}
              onLidAngleChange={setManualLidAngleDeg}
              onXrayToggle={handleXrayToggle}
              onBacklightToggle={setManualBacklight}
              onScreenModeChange={handleScreenModeChange}
              onZoomChange={handleZoomChange}
              onResetView={handleResetView}
              onReviewClick={() => setIsSummaryOpen(true)}
              onBackToStory={() => handleNavigate('overview')}
            />
          </div>
        </section>
      </main>

      <SummaryModal
        isOpen={isSummaryOpen}
        config={config}
        onClose={() => setIsSummaryOpen(false)}
      />
    </div>
  );
}
