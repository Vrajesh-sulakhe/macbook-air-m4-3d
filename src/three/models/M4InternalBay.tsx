import { useEffect, useMemo, useRef, type MutableRefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { FINISH_PALETTES, type FinishId } from '../../data/macbookSpecs';
import { createM4CircuitShaderMaterial } from '../shaders/anodizedMaterials';
import { createLogicBoardTexture } from '../textures/proceduralMaps';
import type { TimelineState } from '../types';

export interface M4InternalBayProps {
  timelineRef: MutableRefObject<TimelineState>;
  manualXray: boolean | null;
  finish: FinishId;
  baseThickness: number;
}

const BATTERY_PACK_X_POSITIONS = [-0.94, -0.34, 0.34, 0.94] as const;

function createM4DieBadgeTexture(): THREE.CanvasTexture | null {
  if (typeof document === 'undefined') {
    return null;
  }
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 320;
  let ctx: CanvasRenderingContext2D | null = null;
  try {
    ctx = canvas.getContext('2d');
  } catch {
    ctx = null;
  }

  if (ctx) {
    const grad = ctx.createLinearGradient(0, 0, 256, 320);
    grad.addColorStop(0, '#3a4558');
    grad.addColorStop(0.5, '#64748b');
    grad.addColorStop(1, '#27303f');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 256, 320);

    ctx.strokeStyle = 'rgba(226, 232, 240, 0.45)';
    ctx.lineWidth = 6;
    ctx.strokeRect(8, 8, 240, 304);

    ctx.fillStyle = '#f8fafc';
    ctx.font = '700 38px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('APPLE', 128, 118);

    ctx.fillStyle = '#93c5fd';
    ctx.font = '800 68px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.fillText('M4', 128, 182);

    ctx.fillStyle = 'rgba(203, 213, 225, 0.72)';
    ctx.font = '600 18px ui-monospace, SFMono-Regular, Menlo, monospace';
    ctx.fillText('10-CORE · 3NM', 128, 244);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}

/**
 * Renders the fanless M4 internal assembly (logic board PCB, 4 battery cell packs,
 * graphite spreader shield, raised brushed M4 silicon die, and pulsing GLSL circuit layer).
 */
export function M4InternalBay({
  timelineRef,
  manualXray,
  finish,
  baseThickness,
}: M4InternalBayProps) {
  const bayGroupRef = useRef<THREE.Group | null>(null);
  const pcbMatRef = useRef<THREE.MeshStandardMaterial | null>(null);
  const spreaderMatRef = useRef<THREE.MeshStandardMaterial | null>(null);
  const dieMatRef = useRef<THREE.MeshStandardMaterial | null>(null);
  const dieBadgeMatRef = useRef<THREE.MeshStandardMaterial | null>(null);
  const substrateMatRef = useRef<THREE.MeshStandardMaterial | null>(null);
  const accentColorScratch = useMemo(() => new THREE.Color(), []);
  const xraySmooth = useRef(0);

  const batteryMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#12161e',
        roughness: 0.48,
        metalness: 0.35,
        transparent: true,
        opacity: 0,
      }),
    [],
  );

  const dramMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#181e29',
        roughness: 0.35,
        metalness: 0.55,
        transparent: true,
        opacity: 0,
      }),
    [],
  );

  const geometries = useMemo(() => {
    const pcb = new THREE.PlaneGeometry(2.74, 1.88);
    pcb.rotateX(-Math.PI / 2);

    const batteryCell = new THREE.BoxGeometry(0.54, 0.022, 0.62);
    const spreader = new THREE.BoxGeometry(2.14, 0.011, 0.88);
    const substrate = new THREE.BoxGeometry(0.4, 0.008, 0.4);
    const dramChip = new THREE.BoxGeometry(0.09, 0.009, 0.14);
    const m4Die = new THREE.BoxGeometry(0.18, 0.014, 0.24);
    const m4BadgePlane = new THREE.PlaneGeometry(0.175, 0.235);
    m4BadgePlane.rotateX(-Math.PI / 2);

    const circuitPlane = new THREE.PlaneGeometry(2.56, 1.72);
    circuitPlane.rotateX(-Math.PI / 2);

    return {
      pcb,
      batteryCell,
      spreader,
      substrate,
      dramChip,
      m4Die,
      m4BadgePlane,
      circuitPlane,
    };
  }, []);

  const circuitMaterial = useMemo(() => createM4CircuitShaderMaterial(), []);

  useEffect(() => {
    const logicTexture = createLogicBoardTexture();
    const dieBadgeTexture = createM4DieBadgeTexture();

    if (pcbMatRef.current) {
      pcbMatRef.current.map = logicTexture;
      pcbMatRef.current.needsUpdate = true;
    }
    if (dieBadgeMatRef.current && dieBadgeTexture) {
      dieBadgeMatRef.current.map = dieBadgeTexture;
      dieBadgeMatRef.current.needsUpdate = true;
    }

    return () => {
      logicTexture.dispose();
      dieBadgeTexture?.dispose();
    };
  }, []);

  useEffect(() => {
    return () => {
      geometries.pcb.dispose();
      geometries.batteryCell.dispose();
      geometries.spreader.dispose();
      geometries.substrate.dispose();
      geometries.dramChip.dispose();
      geometries.m4Die.dispose();
      geometries.m4BadgePlane.dispose();
      geometries.circuitPlane.dispose();
      batteryMaterial.dispose();
      dramMaterial.dispose();
      circuitMaterial.dispose();
    };
  }, [geometries, batteryMaterial, dramMaterial, circuitMaterial]);

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05);
    const lerpAlpha = 1 - Math.exp(-10 * dt);
    const targetXray = manualXray !== null ? (manualXray ? 1 : 0) : timelineRef.current.xrayAmount;

    xraySmooth.current = THREE.MathUtils.lerp(
      xraySmooth.current,
      THREE.MathUtils.clamp(targetXray, 0, 1),
      lerpAlpha,
    );

    const xray = xraySmooth.current;
    const group = bayGroupRef.current;
    if (!group) {
      return;
    }

    if (xray <= 0.02) {
      group.visible = false;
      return;
    }

    group.visible = true;
    const fadeOpacity = THREE.MathUtils.clamp(xray * 1.25, 0, 1);

    if (pcbMatRef.current) pcbMatRef.current.opacity = fadeOpacity;
    batteryMaterial.opacity = fadeOpacity;
    dramMaterial.opacity = fadeOpacity;
    if (spreaderMatRef.current) spreaderMatRef.current.opacity = fadeOpacity * 0.92;
    if (dieMatRef.current) dieMatRef.current.opacity = fadeOpacity;
    if (dieBadgeMatRef.current) dieBadgeMatRef.current.opacity = fadeOpacity;
    if (substrateMatRef.current) substrateMatRef.current.opacity = fadeOpacity;

    accentColorScratch.set(FINISH_PALETTES[finish].rimTint);
    circuitMaterial.uniforms.uTime.value = state.clock.elapsedTime;
    circuitMaterial.uniforms.uPulseIntensity.value = xray * 1.25;
    (circuitMaterial.uniforms.uAccentColor.value as THREE.Color).copy(accentColorScratch);
  });

  const floorY = Math.min(0.018, baseThickness * 0.25);

  return (
    <group ref={bayGroupRef} name="m4-internal-bay" visible={false}>
      {/* Logic board & battery bay silkscreen PCB */}
      <mesh geometry={geometries.pcb} position={[0, floorY, 0]}>
        <meshStandardMaterial
          ref={pcbMatRef}
          color="#ffffff"
          roughness={0.55}
          metalness={0.28}
          transparent
          opacity={0}
        />
      </mesh>

      {/* 4 sculpted Li-ion battery cell packs in front half */}
      {BATTERY_PACK_X_POSITIONS.map((xPos, idx) => (
        <mesh
          key={idx}
          geometry={geometries.batteryCell}
          material={batteryMaterial}
          position={[xPos, floorY + 0.014, 0.5]}
        />
      ))}

      {/* Fanless dark-graphite thermal spreader shield */}
      <mesh geometry={geometries.spreader} position={[0, floorY + 0.012, -0.32]}>
        <meshStandardMaterial
          ref={spreaderMatRef}
          color="#1e2532"
          roughness={0.32}
          metalness={0.78}
          transparent
          opacity={0}
        />
      </mesh>

      {/* Raised M4 silicon SoC package + dual Unified Memory dies */}
      <group position={[0, floorY + 0.022, -0.32]}>
        <mesh geometry={geometries.substrate}>
          <meshStandardMaterial
            ref={substrateMatRef}
            color="#102024"
            roughness={0.42}
            metalness={0.3}
            transparent
            opacity={0}
          />
        </mesh>
        <mesh
          geometry={geometries.dramChip}
          material={dramMaterial}
          position={[-0.105, 0.006, -0.095]}
        />
        <mesh
          geometry={geometries.dramChip}
          material={dramMaterial}
          position={[-0.105, 0.006, 0.095]}
        />
        <mesh geometry={geometries.m4Die} position={[0.055, 0.009, 0]}>
          <meshStandardMaterial
            ref={dieMatRef}
            color="#d8e0ec"
            roughness={0.18}
            metalness={0.92}
            transparent
            opacity={0}
          />
        </mesh>
        <mesh geometry={geometries.m4BadgePlane} position={[0.055, 0.0165, 0]}>
          <meshStandardMaterial
            ref={dieBadgeMatRef}
            color="#ffffff"
            roughness={0.22}
            metalness={0.78}
            transparent
            opacity={0}
          />
        </mesh>
      </group>

      {/* Custom GLSL animated M4 neural & ray-tracing bus overlay */}
      <mesh
        geometry={geometries.circuitPlane}
        material={circuitMaterial}
        position={[0, floorY + 0.036, 0]}
      />
    </group>
  );
}
