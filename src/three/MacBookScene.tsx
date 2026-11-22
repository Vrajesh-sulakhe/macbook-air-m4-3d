import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ComponentRef,
  type MutableRefObject,
} from 'react';
import { ContactShadows, Environment, Lightformer, OrbitControls } from '@react-three/drei';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Bloom, EffectComposer, ToneMapping, Vignette } from '@react-three/postprocessing';
import { ToneMappingMode } from 'postprocessing';
import * as THREE from 'three';
import {
  CAMERA_PRESETS,
  FINISH_PALETTES,
  type CameraPresetId,
  type FinishId,
  type ScreenModeId,
  type SizeId,
} from '../data/macbookSpecs';
import { computeAdaptiveDpr } from '../utils/webglSupport';
import { MacBookAirAssembly } from './models/MacBookAirAssembly';
import type { TimelineState } from './types';

export interface MacBookSceneProps {
  timelineRef: MutableRefObject<TimelineState>;
  isStudioInteractive: boolean;
  studioPreset: CameraPresetId;
  zoomStep: number;
  finish: FinishId;
  size: SizeId;
  screenMode: ScreenModeId;
  manualLidAngleDeg: number | null;
  manualXray: boolean | null;
  manualBacklight: boolean | null;
  reducedMotion: boolean;
  viewportWidth: number;
}

const COMPACT_SHADOW_BREAKPOINT_PX = 768;
const ZOOM_STEP_SCALE = 0.84;

function computeZoomFactor(zoomStep: number): number {
  const clampedStep = THREE.MathUtils.clamp(zoomStep, -2, 2);
  return Math.pow(ZOOM_STEP_SCALE, clampedStep);
}

/**
 * Procedural studio Lightformer IBL rig tuned dynamically to the active anodized finish.
 */
function StudioEnvironment({ finish }: { finish: FinishId }) {
  const rimTint = FINISH_PALETTES[finish].rimTint;

  const lightformers = useMemo(
    () => (
      <>
        <Lightformer
          form="rect"
          intensity={2.7}
          color="#f8fafc"
          position={[0, 6, 1]}
          rotation={[Math.PI / 2, 0, 0]}
          scale={[10, 6, 1]}
        />
        <Lightformer
          form="rect"
          intensity={2.1}
          color={rimTint}
          position={[-6, 2.2, 2]}
          rotation={[0, Math.PI / 2, 0]}
          scale={[6, 2.2, 1]}
        />
        <Lightformer
          form="rect"
          intensity={1.85}
          color="#eef4fb"
          position={[6, 2.5, 2.5]}
          rotation={[0, -Math.PI / 2, 0]}
          scale={[6, 2.4, 1]}
        />
        <Lightformer
          form="rect"
          intensity={2.4}
          color={rimTint}
          position={[0, 2.8, -6]}
          scale={[9, 1.6, 1]}
        />
        <Lightformer
          form="ring"
          intensity={0.75}
          color={rimTint}
          position={[0, -2.5, 4]}
          rotation={[-Math.PI / 2, 0, 0]}
          scale={5}
        />
      </>
    ),
    [rimTint],
  );

  return (
    <Environment resolution={256} frames={1}>
      {lightformers}
    </Environment>
  );
}

/**
 * Zero-cost shader-based radial ground shadow used on compact mobile and reduced-motion viewports.
 */
function RadialStudioShadowPlane({ size }: { size: SizeId }) {
  const planeGeometry = useMemo(() => new THREE.PlaneGeometry(1, 1), []);
  const shadowMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: /* glsl */ `
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: /* glsl */ `
          varying vec2 vUv;
          void main() {
            float d = length((vUv - 0.5) * vec2(1.0, 1.18));
            float alpha = smoothstep(0.5, 0.04, d) * 0.48;
            if (alpha <= 0.001) discard;
            gl_FragColor = vec4(0.015, 0.02, 0.035, alpha);
          }
        `,
        transparent: true,
        depthWrite: false,
      }),
    [],
  );

  useEffect(() => {
    return () => {
      planeGeometry.dispose();
      shadowMaterial.dispose();
    };
  }, [planeGeometry, shadowMaterial]);

  const planeScale: [number, number, number] = size === '15' ? [4.8, 3.6, 1] : [4.3, 3.2, 1];

  return (
    <mesh
      geometry={planeGeometry}
      material={shadowMaterial}
      position={[0, -0.0045, 0]}
      rotation={[-Math.PI / 2, 0, 0]}
      scale={planeScale}
    />
  );
}

interface StudioCameraRigProps {
  timelineRef: MutableRefObject<TimelineState>;
  isStudioInteractive: boolean;
  studioPreset: CameraPresetId;
  zoomStep: number;
  reducedMotion: boolean;
  viewportWidth: number;
  resetCounter: number;
}

/**
 * Coordinates smooth scroll-act camera tracking (Acts 1–5) and hands off cleanly
 * to non-wheel-trapping OrbitControls in interactive Studio mode (Act 6).
 */
function StudioCameraRig({
  timelineRef,
  isStudioInteractive,
  studioPreset,
  zoomStep,
  reducedMotion,
  viewportWidth,
  resetCounter,
}: StudioCameraRigProps) {
  const camera = useThree((state) => state.camera);
  const controlsRef = useRef<ComponentRef<typeof OrbitControls> | null>(null);

  const lookAtRef = useRef(new THREE.Vector3(0, 0.25, -0.1));
  const desiredPosRef = useRef(new THREE.Vector3(2.65, 1.52, 4.35));
  const desiredTargetRef = useRef(new THREE.Vector3(0, 0.25, -0.1));
  const dirScratch = useMemo(() => new THREE.Vector3(), []);
  const offsetScratch = useMemo(() => new THREE.Vector3(), []);

  const isEasingRef = useRef(false);
  const prevInteractiveRef = useRef(false);
  const prevPresetRef = useRef(studioPreset);
  const prevZoomRef = useRef(zoomStep);
  const prevResetRef = useRef(resetCounter);

  useLayoutEffect(() => {
    const wasInteractive = prevInteractiveRef.current;
    const presetChanged = prevPresetRef.current !== studioPreset;
    const zoomChanged = prevZoomRef.current !== zoomStep;
    const resetChanged = prevResetRef.current !== resetCounter;

    prevInteractiveRef.current = isStudioInteractive;
    prevPresetRef.current = studioPreset;
    prevZoomRef.current = zoomStep;
    prevResetRef.current = resetCounter;

    if (!isStudioInteractive) {
      isEasingRef.current = false;
      return;
    }

    const preset = CAMERA_PRESETS[studioPreset];
    const zoomFactor = computeZoomFactor(zoomStep);

    // Sync OrbitControls target cleanly on entry so frame 1 never snaps to origin
    if (!wasInteractive && controlsRef.current) {
      controlsRef.current.target.copy(lookAtRef.current);
      controlsRef.current.update();
    }

    if (!wasInteractive || presetChanged || resetChanged) {
      desiredTargetRef.current.set(preset.target[0], preset.target[1], preset.target[2]);
      offsetScratch
        .set(preset.position[0], preset.position[1], preset.position[2])
        .sub(desiredTargetRef.current)
        .multiplyScalar(zoomFactor);
      desiredPosRef.current.copy(desiredTargetRef.current).add(offsetScratch);
      isEasingRef.current = true;
    } else if (zoomChanged) {
      const baseDistance = offsetScratch
        .set(preset.position[0], preset.position[1], preset.position[2])
        .sub(
          dirScratch.set(preset.target[0], preset.target[1], preset.target[2]),
        )
        .length();

      if (isEasingRef.current) {
        dirScratch.copy(desiredPosRef.current).sub(desiredTargetRef.current);
      } else {
        const activeTarget = controlsRef.current?.target ?? lookAtRef.current;
        desiredTargetRef.current.copy(activeTarget);
        dirScratch.copy(camera.position).sub(desiredTargetRef.current);
      }

      if (dirScratch.lengthSq() < 1e-5) {
        dirScratch
          .set(preset.position[0], preset.position[1], preset.position[2])
          .sub(desiredTargetRef.current);
      }
      dirScratch.normalize().multiplyScalar(baseDistance * zoomFactor);
      desiredPosRef.current.copy(desiredTargetRef.current).add(dirScratch);
      isEasingRef.current = true;
    }
  }, [
    camera,
    dirScratch,
    isStudioInteractive,
    offsetScratch,
    resetCounter,
    studioPreset,
    zoomStep,
  ]);

  const handleOrbitStart = useCallback(() => {
    // Release programmatic easing immediately when user grabs the viewport
    isEasingRef.current = false;
  }, []);

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05);
    const alpha = reducedMotion ? 1 : 1 - Math.exp(-8 * dt);

    if (!isStudioInteractive) {
      const timeline = timelineRef.current;
      desiredPosRef.current.set(timeline.camPos[0], timeline.camPos[1], timeline.camPos[2]);
      desiredTargetRef.current.set(
        timeline.camTarget[0],
        timeline.camTarget[1],
        timeline.camTarget[2],
      );

      // Subtle idle breathing oscillation on non-reducedMotion desktop near scroll start
      if (
        !reducedMotion &&
        viewportWidth >= COMPACT_SHADOW_BREAKPOINT_PX &&
        timeline.scrollProgress < 0.04
      ) {
        const breathFade = 1 - THREE.MathUtils.smoothstep(timeline.scrollProgress, 0.01, 0.04);
        const elapsed = state.clock.elapsedTime;
        desiredPosRef.current.x += Math.sin(elapsed * 0.65) * 0.06 * breathFade;
        desiredPosRef.current.y += Math.cos(elapsed * 0.85) * 0.035 * breathFade;
      }

      camera.position.lerp(desiredPosRef.current, alpha);
      lookAtRef.current.lerp(desiredTargetRef.current, alpha);
      camera.lookAt(lookAtRef.current);
      return;
    }

    const controls = controlsRef.current;
    if (isEasingRef.current && controls) {
      camera.position.lerp(desiredPosRef.current, alpha);
      controls.target.lerp(desiredTargetRef.current, alpha);
      lookAtRef.current.copy(controls.target);

      const posDist = camera.position.distanceTo(desiredPosRef.current);
      const targetDist = controls.target.distanceTo(desiredTargetRef.current);

      if (posDist < 0.008 && targetDist < 0.008) {
        camera.position.copy(desiredPosRef.current);
        controls.target.copy(desiredTargetRef.current);
        lookAtRef.current.copy(desiredTargetRef.current);
        isEasingRef.current = false;
      }

      controls.update();
    } else if (controls) {
      lookAtRef.current.copy(controls.target);
    }
  });

  if (!isStudioInteractive) {
    return null;
  }

  return (
    <OrbitControls
      ref={controlsRef}
      makeDefault
      enableZoom={false}
      enablePan={false}
      enableDamping={!reducedMotion}
      dampingFactor={0.07}
      minPolarAngle={0.2}
      maxPolarAngle={Math.PI * 0.54}
      minDistance={1.6}
      maxDistance={9.5}
      onStart={handleOrbitStart}
    />
  );
}

/**
 * Continuous React Three Fiber 3D studio stage hosting the procedural MacBook Air (M4),
 * Lightformer IBL environment, adaptive contact shadow, camera rig, and selective bloom.
 */
export function MacBookScene({
  timelineRef,
  isStudioInteractive,
  studioPreset,
  zoomStep,
  finish,
  size,
  screenMode,
  manualLidAngleDeg,
  manualXray,
  manualBacklight,
  reducedMotion,
  viewportWidth,
}: MacBookSceneProps) {
  const [resetCounter, setResetCounter] = useState(0);
  const palette = FINISH_PALETTES[finish];
  const dpr = computeAdaptiveDpr(viewportWidth, reducedMotion);
  const useContactShadows = viewportWidth >= COMPACT_SHADOW_BREAKPOINT_PX && !reducedMotion;

  const handleCanvasDoubleClick = useCallback(() => {
    if (isStudioInteractive) {
      setResetCounter((count) => count + 1);
    }
  }, [isStudioInteractive]);

  return (
    <Canvas
      className="h-full w-full block"
      dpr={dpr}
      camera={{ fov: 36, near: 0.1, far: 50, position: [0, 1.4, 5.2] }}
      gl={{
        antialias: true,
        powerPreference: 'high-performance',
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.06,
      }}
      onDoubleClick={handleCanvasDoubleClick}
    >
      <ambientLight intensity={0.22} color="#dce6f5" />
      <directionalLight position={[4.5, 6.2, 4.0]} intensity={1.15} color="#ffffff" />
      <directionalLight position={[-4.5, 2.4, -3.5]} intensity={0.75} color={palette.rimTint} />
      <pointLight position={[0, 1.4, 3.2]} intensity={0.45} distance={10} decay={2} color="#e2efff" />

      <StudioEnvironment finish={finish} />

      <MacBookAirAssembly
        timelineRef={timelineRef}
        finish={finish}
        size={size}
        screenMode={screenMode}
        manualLidAngleDeg={manualLidAngleDeg}
        manualXray={manualXray}
        manualBacklight={manualBacklight}
        manualMagSafeSnap={isStudioInteractive ? (studioPreset === 'ports' ? 1 : 0) : null}
        reducedMotion={reducedMotion}
        isStudioInteractive={isStudioInteractive}
      />

      {useContactShadows ? (
        <ContactShadows
          position={[0, -0.0045, 0]}
          opacity={0.48}
          scale={7.8}
          blur={2.2}
          far={2.6}
          resolution={256}
          color="#05070b"
        />
      ) : (
        <RadialStudioShadowPlane size={size} />
      )}

      <StudioCameraRig
        timelineRef={timelineRef}
        isStudioInteractive={isStudioInteractive}
        studioPreset={studioPreset}
        zoomStep={zoomStep}
        reducedMotion={reducedMotion}
        viewportWidth={viewportWidth}
        resetCounter={resetCounter}
      />

      {!reducedMotion && (
        <EffectComposer multisampling={0}>
          <Bloom mipmapBlur luminanceThreshold={0.85} intensity={0.42} />
          <Vignette darkness={0.42} offset={0.28} />
          <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
        </EffectComposer>
      )}
    </Canvas>
  );
}
