import { useEffect, useMemo, useRef, type MutableRefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { FINISH_PALETTES, type FinishId } from '../../data/macbookSpecs';
import type { TimelineState } from '../types';
import {
  KEYBOARD_WELL_METRICS,
  TRACKPAD_METRICS,
  createRoundedRectShape,
  generateKeycapLayout,
} from './dimensions';

export interface KeyboardDeckProps {
  timelineRef: MutableRefObject<TimelineState>;
  manualBacklight: boolean | null;
  manualXray: boolean | null;
  deckY: number;
  finish: FinishId;
  reducedMotion: boolean;
}

function createSculptedUnitKeycapGeometry(): THREE.BufferGeometry {
  const shape = createRoundedRectShape(0.88, 0.88, 0.12);
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: 0.76,
    bevelEnabled: true,
    bevelThickness: 0.12,
    bevelSize: 0.06,
    bevelSegments: 2,
    curveSegments: 6,
  });
  geo.rotateX(-Math.PI / 2);
  geo.translate(0, 0.12, 0);
  geo.computeVertexNormals();
  return geo;
}

/**
 * Renders the MacBook Air Magic Keyboard via a single InstancedMesh, Touch ID ring,
 * dynamic under-key backlight glow plane, and Force Touch glass trackpad.
 */
export function KeyboardDeck({
  timelineRef,
  manualBacklight,
  manualXray,
  deckY,
  finish,
  reducedMotion,
}: KeyboardDeckProps) {
  const instancedRef = useRef<THREE.InstancedMesh | null>(null);
  const backlightMatRef = useRef<THREE.MeshBasicMaterial | null>(null);
  const keycapMatRef = useRef<THREE.MeshStandardMaterial | null>(null);
  const wellMatRef = useRef<THREE.MeshStandardMaterial | null>(null);
  const trackpadMatRef = useRef<THREE.MeshStandardMaterial | null>(null);
  const trackpadRimMatRef = useRef<THREE.MeshBasicMaterial | null>(null);
  const touchIdRingMatRef = useRef<THREE.MeshStandardMaterial | null>(null);
  const touchIdCenterMatRef = useRef<THREE.MeshStandardMaterial | null>(null);

  const backlightSmooth = useRef(0.6);
  const xraySmooth = useRef(0);
  const isTransparentMode = useRef(false);
  const targetHexColor = useMemo(() => new THREE.Color(), []);
  const targetRimColor = useMemo(() => new THREE.Color(), []);

  const keycaps = useMemo(() => generateKeycapLayout(), []);
  const touchIdKey = useMemo(() => keycaps.find((k) => k.isTouchId) ?? keycaps[13], [keycaps]);

  const geometries = useMemo(() => {
    const keycap = createSculptedUnitKeycapGeometry();
    const well = new THREE.ShapeGeometry(
      createRoundedRectShape(
        KEYBOARD_WELL_METRICS.width,
        KEYBOARD_WELL_METRICS.depth,
        KEYBOARD_WELL_METRICS.cornerRadius,
      ),
      12,
    );
    well.rotateX(-Math.PI / 2);

    const backlightPlane = new THREE.PlaneGeometry(
      KEYBOARD_WELL_METRICS.width - 0.04,
      KEYBOARD_WELL_METRICS.depth - 0.04,
    );
    backlightPlane.rotateX(-Math.PI / 2);

    const trackpad = new THREE.ShapeGeometry(
      createRoundedRectShape(
        TRACKPAD_METRICS.width,
        TRACKPAD_METRICS.depth,
        TRACKPAD_METRICS.cornerRadius,
      ),
      12,
    );
    trackpad.rotateX(-Math.PI / 2);

    const trackpadRim = new THREE.ShapeGeometry(
      createRoundedRectShape(
        TRACKPAD_METRICS.width + 0.014,
        TRACKPAD_METRICS.depth + 0.014,
        TRACKPAD_METRICS.cornerRadius + 0.005,
      ),
      12,
    );
    trackpadRim.rotateX(-Math.PI / 2);

    const touchIdRing = new THREE.RingGeometry(0.038, 0.05, 32);
    touchIdRing.rotateX(-Math.PI / 2);

    const touchIdCenter = new THREE.CircleGeometry(0.036, 28);
    touchIdCenter.rotateX(-Math.PI / 2);

    return {
      keycap,
      well,
      backlightPlane,
      trackpad,
      trackpadRim,
      touchIdRing,
      touchIdCenter,
    };
  }, []);

  useEffect(() => {
    return () => {
      geometries.keycap.dispose();
      geometries.well.dispose();
      geometries.backlightPlane.dispose();
      geometries.trackpad.dispose();
      geometries.trackpadRim.dispose();
      geometries.touchIdRing.dispose();
      geometries.touchIdCenter.dispose();
    };
  }, [geometries]);

  useEffect(() => {
    const mesh = instancedRef.current;
    if (!mesh) {
      return;
    }

    const dummy = new THREE.Object3D();
    const standardColor = new THREE.Color('#14171f');
    const touchIdColor = new THREE.Color('#0f1218');

    keycaps.forEach((key, index) => {
      dummy.position.set(key.x, deckY + 0.0008, key.z);
      dummy.scale.set(key.width, key.height, key.depth);
      dummy.updateMatrix();
      mesh.setMatrixAt(index, dummy.matrix);
      mesh.setColorAt(index, key.isTouchId ? touchIdColor : standardColor);
    });

    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) {
      mesh.instanceColor.needsUpdate = true;
    }
    mesh.computeBoundingSphere();
  }, [deckY, keycaps]);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    const lerpAlpha = reducedMotion ? 1 : 1 - Math.exp(-10 * dt);

    const targetBacklight =
      manualBacklight !== null ? (manualBacklight ? 1 : 0) : timelineRef.current.backlight;
    const targetXray = manualXray !== null ? (manualXray ? 1 : 0) : timelineRef.current.xrayAmount;

    backlightSmooth.current = THREE.MathUtils.lerp(
      backlightSmooth.current,
      THREE.MathUtils.clamp(targetBacklight, 0, 1),
      lerpAlpha,
    );
    xraySmooth.current = THREE.MathUtils.lerp(
      xraySmooth.current,
      THREE.MathUtils.clamp(targetXray, 0, 1),
      lerpAlpha,
    );

    const xray = xraySmooth.current;
    const deckOpacity = Math.max(0.12, 1 - xray * 0.88);
    const shouldBeTransparent = xray > 0.02;

    if (backlightMatRef.current) {
      backlightMatRef.current.opacity = backlightSmooth.current * 0.34 * (1 - xray * 0.85);
    }

    const fadeMaterials = [
      keycapMatRef.current,
      wellMatRef.current,
      trackpadMatRef.current,
      touchIdRingMatRef.current,
      touchIdCenterMatRef.current,
    ];

    const finishPalette = FINISH_PALETTES[finish];
    targetHexColor.set(finishPalette.hex);
    targetRimColor.set(finishPalette.rimTint);
    if (trackpadMatRef.current) {
      trackpadMatRef.current.color.lerp(targetHexColor, lerpAlpha);
    }
    if (touchIdRingMatRef.current) {
      touchIdRingMatRef.current.color.lerp(targetRimColor, lerpAlpha);
    }

    for (const mat of fadeMaterials) {
      if (!mat) {
        continue;
      }
      if (isTransparentMode.current !== shouldBeTransparent) {
        mat.transparent = shouldBeTransparent;
        mat.depthWrite = !shouldBeTransparent;
        mat.needsUpdate = true;
      }
      mat.opacity = deckOpacity;
    }

    if (trackpadRimMatRef.current) {
      trackpadRimMatRef.current.opacity = 0.65 * deckOpacity;
    }

    isTransparentMode.current = shouldBeTransparent;
  });

  const palette = FINISH_PALETTES[finish];

  return (
    <group name="keyboard-deck">
      {/* Recessed keyboard well liner */}
      <mesh
        geometry={geometries.well}
        position={[0, deckY + 0.0008, KEYBOARD_WELL_METRICS.centerZ]}
      >
        <meshStandardMaterial
          ref={wellMatRef}
          color="#0b0d12"
          roughness={0.78}
          metalness={0.18}
        />
      </mesh>

      {/* Emissive under-key backlight glow plane */}
      <mesh
        geometry={geometries.backlightPlane}
        position={[0, deckY + 0.0014, KEYBOARD_WELL_METRICS.centerZ]}
      >
        <meshBasicMaterial
          ref={backlightMatRef}
          color="#dceeff"
          transparent
          opacity={0.2}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Single InstancedMesh rendering all 78 sculpted Magic Keyboard keycaps */}
      <instancedMesh
        ref={instancedRef}
        args={[geometries.keycap, undefined, keycaps.length]}
        frustumCulled={false}
        castShadow={false}
        receiveShadow
      >
        <meshStandardMaterial
          ref={keycapMatRef}
          color="#ffffff"
          roughness={0.62}
          metalness={0.08}
        />
      </instancedMesh>

      {/* Capacitive Touch ID metallic ring & sapphire center */}
      {touchIdKey && (
        <group position={[touchIdKey.x, deckY + touchIdKey.height + 0.0011, touchIdKey.z]}>
          <mesh geometry={geometries.touchIdRing}>
            <meshStandardMaterial
              ref={touchIdRingMatRef}
              color={palette.rimTint}
              metalness={0.92}
              roughness={0.2}
            />
          </mesh>
          <mesh geometry={geometries.touchIdCenter} position={[0, -0.0002, 0]}>
            <meshStandardMaterial
              ref={touchIdCenterMatRef}
              color="#0b0e14"
              roughness={0.28}
              metalness={0.25}
            />
          </mesh>
        </group>
      )}

      {/* Force Touch glass trackpad recess & chamfered border */}
      <mesh
        geometry={geometries.trackpadRim}
        position={[0, deckY + 0.0005, TRACKPAD_METRICS.centerZ]}
      >
        <meshBasicMaterial
          ref={trackpadRimMatRef}
          color="#090c12"
          transparent
          opacity={0.65}
          depthWrite={false}
        />
      </mesh>
      <mesh
        geometry={geometries.trackpad}
        position={[0, deckY + 0.0011, TRACKPAD_METRICS.centerZ]}
      >
        <meshStandardMaterial
          ref={trackpadMatRef}
          color={palette.hex}
          roughness={0.18}
          metalness={0.58}
        />
      </mesh>
    </group>
  );
}
