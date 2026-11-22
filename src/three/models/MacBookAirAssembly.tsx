import { useEffect, useMemo, useRef, type MutableRefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import {
  FINISH_PALETTES,
  type FinishId,
  type ScreenModeId,
  type SizeId,
} from '../../data/macbookSpecs';
import {
  createDualDisplayHoloMaterial,
  createIntelligenceHaloMaterial,
} from '../shaders/anodizedMaterials';
import {
  ScreenCanvasRenderer,
  createBrushedMetalRoughnessMap,
} from '../textures/proceduralMaps';
import type { TimelineState } from '../types';
import {
  computeHingeRotationX,
  createBeveledPlateGeometry,
  createRoundedRectShape,
  getChassisMetrics,
} from './dimensions';
import { KeyboardDeck } from './KeyboardDeck';
import { M4InternalBay } from './M4InternalBay';
import { PortsAndMagSafe } from './PortsAndMagSafe';

export interface MacBookAirAssemblyProps {
  timelineRef: MutableRefObject<TimelineState>;
  finish: FinishId;
  size: SizeId;
  screenMode: ScreenModeId;
  manualLidAngleDeg: number | null;
  manualXray: boolean | null;
  manualBacklight: boolean | null;
  reducedMotion: boolean;
  isStudioInteractive: boolean;
}

/**
 * Complete procedural 3D MacBook Air (M4) hardware assembly including CNC unibody shell,
 * Magic Keyboard, Force Touch trackpad, internal M4 bay, MagSafe 3 / Thunderbolt 4 ports,
 * Liquid Retina display with notch & Apple Intelligence halo, and Dual-6K holographic monitors.
 */
export function MacBookAirAssembly({
  timelineRef,
  finish,
  size,
  screenMode,
  manualLidAngleDeg,
  manualXray,
  manualBacklight,
  reducedMotion,
  isStudioInteractive,
}: MacBookAirAssemblyProps) {
  const rootGroupRef = useRef<THREE.Group | null>(null);
  const chassisScaleGroupRef = useRef<THREE.Group | null>(null);
  const lidPivotRef = useRef<THREE.Group | null>(null);
  const dualDisplaysGroupRef = useRef<THREE.Group | null>(null);
  const leftMonitorRef = useRef<THREE.Mesh | null>(null);
  const rightMonitorRef = useRef<THREE.Mesh | null>(null);
  const haloMeshRef = useRef<THREE.Mesh | null>(null);
  const privacyDotRef = useRef<THREE.Mesh | null>(null);

  const baseMaterialRef = useRef<THREE.MeshStandardMaterial | null>(null);
  const lidMaterialRef = useRef<THREE.MeshStandardMaterial | null>(null);
  const baseWireMatRef = useRef<THREE.MeshBasicMaterial | null>(null);
  const screenMatRef = useRef<THREE.MeshStandardMaterial | null>(null);
  const screenRendererRef = useRef<ScreenCanvasRenderer | null>(null);

  const targetColorScratch = useMemo(() => new THREE.Color(), []);
  const targetRimScratch = useMemo(() => new THREE.Color(), []);
  const scaleTargetVec = useMemo(() => new THREE.Vector3(1, 1, 1), []);
  const xraySmooth = useRef(0);
  const dualSmooth = useRef(0);
  const haloSmooth = useRef(0);

  const baseMetrics = useMemo(() => getChassisMetrics('13'), []);
  const targetMetrics = useMemo(() => getChassisMetrics(size), [size]);

  const lidHeight = baseMetrics.depth - 0.02;
  const screenWidth = baseMetrics.width - 0.131; // 2.910
  const screenHeight = 1.89; // exact 1024x665 aspect ratio
  const screenCenterZ = lidHeight * 0.5 + 0.032;

  const geometries = useMemo(() => {
    const baseBody = createBeveledPlateGeometry(
      baseMetrics.width,
      baseMetrics.depth,
      baseMetrics.baseThickness,
      baseMetrics.cornerRadius,
      0.0085,
    );

    // Lid extends forward along +Z from rear hinge (0..lidHeight) with y in [0..lidThickness]:
    // outer shell faces +Y and inner glass faces -Y when closed (rotX = 0)
    const lidBody = createBeveledPlateGeometry(
      baseMetrics.width,
      lidHeight,
      baseMetrics.lidThickness,
      baseMetrics.cornerRadius,
      0.007,
    );
    lidBody.translate(0, 0, lidHeight * 0.5);
    lidBody.computeVertexNormals();

    const hingeBarrel = new THREE.CylinderGeometry(0.021, 0.021, 1.94, 24);
    hingeBarrel.rotateZ(Math.PI / 2);

    const rubberFoot = new THREE.CylinderGeometry(0.052, 0.055, 0.004, 20);

    const thumbNotch = new THREE.BoxGeometry(0.54, 0.006, 0.048);

    const bezelPlane = new THREE.ShapeGeometry(
      createRoundedRectShape(baseMetrics.width - 0.052, lidHeight - 0.052, 0.085),
      14,
    );

    const screenPlane = new THREE.PlaneGeometry(screenWidth, screenHeight);
    const haloPlane = new THREE.PlaneGeometry(screenWidth + 0.018, screenHeight + 0.018);

    const cameraNotch = new THREE.ShapeGeometry(
      createRoundedRectShape(0.32, 0.058, 0.018),
      8,
    );
    const cameraLens = new THREE.CircleGeometry(0.011, 20);
    const privacyDot = new THREE.CircleGeometry(0.0045, 16);

    const emblemCircle = new THREE.CircleGeometry(0.115, 36);
    const emblemLeaf = new THREE.CircleGeometry(0.034, 18);
    emblemLeaf.scale(0.65, 1.25, 1);

    const dualMonitorPlane = new THREE.PlaneGeometry(1.86, 1.046);

    return {
      baseBody,
      lidBody,
      hingeBarrel,
      rubberFoot,
      thumbNotch,
      bezelPlane,
      screenPlane,
      haloPlane,
      cameraNotch,
      cameraLens,
      privacyDot,
      emblemCircle,
      emblemLeaf,
      dualMonitorPlane,
    };
  }, [baseMetrics, lidHeight, screenHeight, screenWidth]);

  const haloMaterial = useMemo(() => createIntelligenceHaloMaterial(), []);
  const dualHoloMaterial = useMemo(() => createDualDisplayHoloMaterial(), []);

  useEffect(() => {
    const brushedMap = createBrushedMetalRoughnessMap(256);
    brushedMap.repeat.set(2, 2);
    const screenRenderer = new ScreenCanvasRenderer();
    screenRendererRef.current = screenRenderer;

    if (baseMaterialRef.current) {
      baseMaterialRef.current.roughnessMap = brushedMap;
      baseMaterialRef.current.needsUpdate = true;
    }
    if (lidMaterialRef.current) {
      lidMaterialRef.current.roughnessMap = brushedMap;
      lidMaterialRef.current.needsUpdate = true;
    }
    if (screenMatRef.current) {
      screenMatRef.current.map = screenRenderer.texture;
      screenMatRef.current.emissiveMap = screenRenderer.texture;
      screenMatRef.current.needsUpdate = true;
    }

    return () => {
      screenRendererRef.current = null;
      brushedMap.dispose();
      screenRenderer.dispose();
    };
  }, []);

  useEffect(() => {
    return () => {
      geometries.baseBody.dispose();
      geometries.lidBody.dispose();
      geometries.hingeBarrel.dispose();
      geometries.rubberFoot.dispose();
      geometries.thumbNotch.dispose();
      geometries.bezelPlane.dispose();
      geometries.screenPlane.dispose();
      geometries.haloPlane.dispose();
      geometries.cameraNotch.dispose();
      geometries.cameraLens.dispose();
      geometries.privacyDot.dispose();
      geometries.emblemCircle.dispose();
      geometries.emblemLeaf.dispose();
      geometries.dualMonitorPlane.dispose();
      haloMaterial.dispose();
      dualHoloMaterial.dispose();
    };
  }, [geometries, haloMaterial, dualHoloMaterial]);

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05);
    const lerpAlpha = reducedMotion ? 1 : 1 - Math.exp(-9 * dt);
    const timeline = timelineRef.current;
    const palette = FINISH_PALETTES[finish];
    const elapsed = reducedMotion ? 0 : state.clock.elapsedTime;

    // 1. Root orientation (scroll choreography vs centered interactive Studio)
    if (rootGroupRef.current) {
      const targetRotX = isStudioInteractive ? 0 : timeline.modelRot[0];
      const targetRotY = isStudioInteractive ? 0 : timeline.modelRot[1];
      const targetRotZ = isStudioInteractive ? 0 : timeline.modelRot[2];
      rootGroupRef.current.rotation.x = THREE.MathUtils.lerp(
        rootGroupRef.current.rotation.x,
        targetRotX,
        lerpAlpha,
      );
      rootGroupRef.current.rotation.y = THREE.MathUtils.lerp(
        rootGroupRef.current.rotation.y,
        targetRotY,
        lerpAlpha,
      );
      rootGroupRef.current.rotation.z = THREE.MathUtils.lerp(
        rootGroupRef.current.rotation.z,
        targetRotZ,
        lerpAlpha,
      );
    }

    // 2. Smooth 13" <-> 15" chassis scale interpolation
    if (chassisScaleGroupRef.current) {
      scaleTargetVec.set(
        targetMetrics.scaleFactor[0],
        targetMetrics.scaleFactor[1],
        targetMetrics.scaleFactor[2],
      );
      chassisScaleGroupRef.current.scale.lerp(scaleTargetVec, lerpAlpha);
    }

    // 3. Lid angle hinge articulation (0° closed -> 130° open)
    const rawLidDeg = manualLidAngleDeg !== null ? manualLidAngleDeg : timeline.lidDeg;
    const clampedLidDeg = THREE.MathUtils.clamp(rawLidDeg, 0, 130);
    if (lidPivotRef.current) {
      const targetLidRotX = computeHingeRotationX(clampedLidDeg);
      lidPivotRef.current.rotation.x = THREE.MathUtils.lerp(
        lidPivotRef.current.rotation.x,
        targetLidRotX,
        lerpAlpha,
      );
    }
    if (privacyDotRef.current) {
      privacyDotRef.current.visible = clampedLidDeg > 20;
    }

    // 4. Anodized finish PBR color/roughness/metalness + X-ray chassis fade
    const targetXray = manualXray !== null ? (manualXray ? 1 : 0) : timeline.xrayAmount;
    xraySmooth.current = THREE.MathUtils.lerp(
      xraySmooth.current,
      THREE.MathUtils.clamp(targetXray, 0, 1),
      lerpAlpha,
    );
    const xray = xraySmooth.current;
    const shouldBaseBeTransparent = xray > 0.015;

    targetColorScratch.set(palette.hex);
    targetRimScratch.set(palette.rimTint);

    const updateAnodizedMaterial = (mat: THREE.MeshStandardMaterial | null, opacity: number) => {
      if (!mat) {
        return;
      }
      mat.color.lerp(targetColorScratch, lerpAlpha);
      mat.roughness = THREE.MathUtils.lerp(mat.roughness, palette.roughness, lerpAlpha);
      mat.metalness = THREE.MathUtils.lerp(mat.metalness, palette.metalness, lerpAlpha);
      if (mat.transparent !== shouldBaseBeTransparent) {
        mat.transparent = shouldBaseBeTransparent;
        mat.depthWrite = !shouldBaseBeTransparent;
        mat.needsUpdate = true;
      }
      mat.opacity = THREE.MathUtils.clamp(opacity, 0.04, 1);
    };

    updateAnodizedMaterial(baseMaterialRef.current, 1 - xray * 0.84);
    updateAnodizedMaterial(lidMaterialRef.current, 1 - xray * 0.28);

    if (baseWireMatRef.current) {
      baseWireMatRef.current.visible = xray > 0.02;
      baseWireMatRef.current.opacity = xray * 0.28;
      baseWireMatRef.current.color.lerp(targetRimScratch, lerpAlpha);
    }

    // 5. Dynamic Liquid Retina ScreenCanvasRenderer update
    const activeMode = isStudioInteractive ? screenMode : timeline.activeScreenMode;
    screenRendererRef.current?.update(elapsed, activeMode, palette.hex);

    // 6. Apple Intelligence perimeter halo glow (active in 'intelligence' mode or Act 4)
    const isIntelligenceActive =
      activeMode === 'intelligence' || (!isStudioInteractive && timeline.activeActIndex === 3);
    const lidVisibility = THREE.MathUtils.clamp((clampedLidDeg - 15) / 35, 0, 1);
    const targetHalo = isIntelligenceActive ? 0.92 * lidVisibility : 0;
    haloSmooth.current = THREE.MathUtils.lerp(haloSmooth.current, targetHalo, lerpAlpha);

    if (haloMeshRef.current) {
      haloMeshRef.current.visible = haloSmooth.current > 0.01;
      haloMaterial.uniforms.uTime.value = elapsed;
      haloMaterial.uniforms.uOpacity.value = haloSmooth.current;
    }

    // 7. Flanking Dual-6K holographic displays
    const targetDual = isStudioInteractive
      ? screenMode === 'dual6k'
        ? 1
        : 0
      : timeline.dualDisplayProgress;
    dualSmooth.current = THREE.MathUtils.lerp(
      dualSmooth.current,
      THREE.MathUtils.clamp(targetDual, 0, 1),
      lerpAlpha,
    );

    const dual = dualSmooth.current;
    if (dualDisplaysGroupRef.current) {
      if (dual <= 0.015) {
        dualDisplaysGroupRef.current.visible = false;
      } else {
        dualDisplaysGroupRef.current.visible = true;
        const monitorScale = 0.86 + 0.14 * dual;
        leftMonitorRef.current?.scale.setScalar(monitorScale);
        rightMonitorRef.current?.scale.setScalar(monitorScale);
        dualHoloMaterial.uniforms.uTime.value = elapsed;
        dualHoloMaterial.uniforms.uOpacity.value = dual * 0.9;
        (dualHoloMaterial.uniforms.uAccentColor.value as THREE.Color).copy(targetRimScratch);
      }
    }
  });

  const initialPalette = FINISH_PALETTES[finish];
  const footX = baseMetrics.width * 0.5 - 0.22;
  const footZ = baseMetrics.depth * 0.5 - 0.22;

  return (
    <group ref={rootGroupRef} name="macbook-air-assembly">
      <group ref={chassisScaleGroupRef}>
        {/* CNC-beveled aluminum unibody base */}
        <mesh geometry={geometries.baseBody} castShadow receiveShadow>
          <meshStandardMaterial
            ref={baseMaterialRef}
            color={initialPalette.hex}
            roughness={initialPalette.roughness}
            metalness={initialPalette.metalness}
          />
        </mesh>

        {/* Subtle anodized wireframe envelope during X-ray */}
        <mesh geometry={geometries.baseBody}>
          <meshBasicMaterial
            ref={baseWireMatRef}
            color={initialPalette.rimTint}
            wireframe
            transparent
            opacity={0}
            depthWrite={false}
            visible={false}
          />
        </mesh>

        {/* Underside rubber feet */}
        {[
          [-footX, -0.002, -footZ],
          [footX, -0.002, -footZ],
          [-footX, -0.002, footZ],
          [footX, -0.002, footZ],
        ].map(([x, y, z], idx) => (
          <mesh key={idx} geometry={geometries.rubberFoot} position={[x, y, z]}>
            <meshStandardMaterial color="#0b0d12" roughness={0.85} metalness={0.05} />
          </mesh>
        ))}

        {/* Front palm-rest thumb scoop indent */}
        <mesh
          geometry={geometries.thumbNotch}
          position={[0, baseMetrics.baseThickness - 0.0032, baseMetrics.depth * 0.5 - 0.028]}
        >
          <meshStandardMaterial color="#0d1118" roughness={0.45} metalness={0.45} />
        </mesh>

        {/* Precision clutch hinge barrel */}
        <mesh
          geometry={geometries.hingeBarrel}
          position={[0, baseMetrics.baseThickness - 0.005, -baseMetrics.depth * 0.5 + 0.024]}
        >
          <meshStandardMaterial color="#10131a" roughness={0.38} metalness={0.55} />
        </mesh>

        {/* Magic Keyboard + Force Touch trackpad */}
        <KeyboardDeck
          timelineRef={timelineRef}
          manualBacklight={manualBacklight}
          manualXray={manualXray}
          deckY={baseMetrics.baseThickness}
          finish={finish}
          reducedMotion={reducedMotion}
        />

        {/* Fanless M4 Silicon + Logic Board Internal Bay */}
        <M4InternalBay
          timelineRef={timelineRef}
          manualXray={manualXray}
          finish={finish}
          baseThickness={baseMetrics.baseThickness}
          reducedMotion={reducedMotion}
        />

        {/* MagSafe 3 + Dual Thunderbolt 4 + 3.5mm Audio Jack */}
        <PortsAndMagSafe
          timelineRef={timelineRef}
          finish={finish}
          chassisWidth={baseMetrics.width}
          baseThickness={baseMetrics.baseThickness}
          reducedMotion={reducedMotion}
        />

        {/*
          Articulated Display Lid Pivot at rear hinge (-Z):
          Local lid extends forward along +Z (0..lidHeight) with outer shell facing +Y and
          inner screen facing -Y when closed (rotation.x = 0). Negative X-rotation swings
          +Z upward into +Y and aims the inner -Y screen face forward toward +Z.
        */}
        <group
          ref={lidPivotRef}
          position={[0, baseMetrics.baseThickness + 0.0085, -baseMetrics.depth * 0.5 + 0.02]}
          rotation={[0, 0, 0]}
        >
          {/* Anodized aluminum lid shell */}
          <mesh geometry={geometries.lidBody} castShadow receiveShadow>
            <meshStandardMaterial
              ref={lidMaterialRef}
              color={initialPalette.hex}
              roughness={initialPalette.roughness}
              metalness={initialPalette.metalness}
            />
          </mesh>

          {/* Outer lid sleek mirror-metallic minimal emblem inlay (faces +Y closed / -Z open) */}
          <group
            position={[0, baseMetrics.lidThickness + 0.0008, lidHeight * 0.5]}
            rotation={[-Math.PI / 2, 0, Math.PI]}
          >
            <mesh geometry={geometries.emblemCircle}>
              <meshStandardMaterial color="#e2e8f0" metalness={0.98} roughness={0.06} />
            </mesh>
            <mesh
              geometry={geometries.emblemLeaf}
              position={[0.028, 0.145, 0.0004]}
              rotation={[0, 0, -0.42]}
            >
              <meshStandardMaterial color="#e2e8f0" metalness={0.98} roughness={0.06} />
            </mesh>
          </group>

          {/* Inner glossy black display glass bezel (faces -Y closed / +Z open) */}
          <mesh
            geometry={geometries.bezelPlane}
            position={[0, -0.0006, lidHeight * 0.5]}
            rotation={[Math.PI / 2, 0, 0]}
          >
            <meshStandardMaterial color="#050608" roughness={0.08} metalness={0.18} />
          </mesh>

          {/* Dynamic 1024x665 Liquid Retina display */}
          <mesh
            geometry={geometries.screenPlane}
            position={[0, -0.0014, screenCenterZ]}
            rotation={[Math.PI / 2, 0, 0]}
          >
            <meshStandardMaterial
              ref={screenMatRef}
              color="#141418"
              emissive="#ffffff"
              emissiveIntensity={0.85}
              roughness={0.14}
              metalness={0.05}
            />
          </mesh>

          {/* Apple Intelligence iridescent edge halo shader */}
          <mesh
            ref={haloMeshRef}
            geometry={geometries.haloPlane}
            material={haloMaterial}
            position={[0, -0.0024, screenCenterZ]}
            rotation={[Math.PI / 2, 0, 0]}
            visible={false}
          />

          {/* macOS top notch + 12MP Center Stage lens + green privacy LED */}
          <group
            position={[0, -0.0028, screenCenterZ + screenHeight * 0.5 - 0.026]}
            rotation={[Math.PI / 2, 0, 0]}
          >
            <mesh geometry={geometries.cameraNotch}>
              <meshBasicMaterial color="#050608" />
            </mesh>
            <mesh geometry={geometries.cameraLens} position={[0, 0, 0.0005]}>
              <meshStandardMaterial color="#0f1e36" roughness={0.08} metalness={0.65} />
            </mesh>
            <mesh ref={privacyDotRef} geometry={geometries.privacyDot} position={[0.036, 0, 0.0006]}>
              <meshBasicMaterial color="#22c55e" />
            </mesh>
          </group>
        </group>
      </group>

      {/* Flanking translucent Dual 6K virtual monitors (outside chassis scale group) */}
      <group ref={dualDisplaysGroupRef} name="dual-6k-virtual-displays" visible={false}>
        <mesh
          ref={leftMonitorRef}
          geometry={geometries.dualMonitorPlane}
          material={dualHoloMaterial}
          position={[-2.52, 1.16, -0.38]}
          rotation={[0, 0.32, 0]}
        />
        <mesh
          ref={rightMonitorRef}
          geometry={geometries.dualMonitorPlane}
          material={dualHoloMaterial}
          position={[2.52, 1.16, -0.38]}
          rotation={[0, -0.32, 0]}
        />
      </group>
    </group>
  );
}
