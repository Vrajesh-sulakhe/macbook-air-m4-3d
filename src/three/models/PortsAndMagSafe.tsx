import { useEffect, useMemo, useRef, type MutableRefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { FINISH_PALETTES, type FinishId } from '../../data/macbookSpecs';
import type { TimelineState } from '../types';

export interface PortsAndMagSafeProps {
  timelineRef: MutableRefObject<TimelineState>;
  finish: FinishId;
  chassisWidth: number;
  baseThickness: number;
  reducedMotion: boolean;
}

const THUNDERBOLT_Z_POSITIONS = [-0.34, -0.15] as const;
const MAGSAFE_Z = -0.58;
const AUDIO_JACK_Z = -0.55;

/**
 * Renders left-flank MagSafe 3 + Dual Thunderbolt 4 ports, animated snap-in braided
 * MagSafe 3 connector with amber→emerald LED, and right-flank 3.5mm audio jack.
 */
export function PortsAndMagSafe({
  timelineRef,
  finish,
  chassisWidth,
  baseThickness,
  reducedMotion,
}: PortsAndMagSafeProps) {
  const plugGroupRef = useRef<THREE.Group | null>(null);
  const plugBodyMatRef = useRef<THREE.MeshStandardMaterial | null>(null);
  const ledMatRef = useRef<THREE.MeshStandardMaterial | null>(null);
  const cableMatRef = useRef<THREE.MeshStandardMaterial | null>(null);
  const snapSmooth = useRef(0);

  const amberColor = useMemo(() => new THREE.Color('#f59e0b'), []);
  const emeraldColor = useMemo(() => new THREE.Color('#10b981'), []);
  const ledScratch = useMemo(() => new THREE.Color(), []);
  const plugColorScratch = useMemo(() => new THREE.Color(), []);

  const geometries = useMemo(() => {
    const magsafeFrame = new THREE.BoxGeometry(0.012, 0.026, 0.138);
    const magsafeSlot = new THREE.BoxGeometry(0.014, 0.018, 0.122);
    const magsafePin = new THREE.CylinderGeometry(0.0028, 0.0028, 0.008, 10);
    magsafePin.rotateZ(Math.PI / 2);

    const tbFrame = new THREE.BoxGeometry(0.01, 0.024, 0.088);
    const tbCavity = new THREE.BoxGeometry(0.012, 0.016, 0.074);
    const tbTongue = new THREE.BoxGeometry(0.01, 0.004, 0.058);

    const plugShell = new THREE.BoxGeometry(0.115, 0.028, 0.13);
    const plugCollar = new THREE.CylinderGeometry(0.012, 0.014, 0.036, 16);
    plugCollar.rotateZ(Math.PI / 2);
    const plugLed = new THREE.BoxGeometry(0.028, 0.005, 0.012);

    const cableCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.088, 0, 0),
      new THREE.Vector3(-0.24, -0.012, 0.02),
      new THREE.Vector3(-0.46, -0.055, 0.07),
      new THREE.Vector3(-0.78, -0.095, 0.15),
    ]);
    const braidedCable = new THREE.TubeGeometry(cableCurve, 28, 0.009, 10, false);

    const jackRing = new THREE.RingGeometry(0.015, 0.022, 24);
    jackRing.rotateY(Math.PI / 2);
    const jackBore = new THREE.CylinderGeometry(0.015, 0.015, 0.014, 24);
    jackBore.rotateZ(Math.PI / 2);

    return {
      magsafeFrame,
      magsafeSlot,
      magsafePin,
      tbFrame,
      tbCavity,
      tbTongue,
      plugShell,
      plugCollar,
      plugLed,
      braidedCable,
      jackRing,
      jackBore,
    };
  }, []);

  useEffect(() => {
    return () => {
      geometries.magsafeFrame.dispose();
      geometries.magsafeSlot.dispose();
      geometries.magsafePin.dispose();
      geometries.tbFrame.dispose();
      geometries.tbCavity.dispose();
      geometries.tbTongue.dispose();
      geometries.plugShell.dispose();
      geometries.plugCollar.dispose();
      geometries.plugLed.dispose();
      geometries.braidedCable.dispose();
      geometries.jackRing.dispose();
      geometries.jackBore.dispose();
    };
  }, [geometries]);

  const leftWallX = -chassisWidth * 0.5;
  const rightWallX = chassisWidth * 0.5;
  const portY = baseThickness * 0.48;
  const palette = FINISH_PALETTES[finish];

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05);
    const lerpAlpha = reducedMotion ? 1 : 1 - Math.exp(-10 * dt);
    const targetSnap = THREE.MathUtils.clamp(timelineRef.current.magsafeSnap, 0, 1);
    snapSmooth.current = THREE.MathUtils.lerp(snapSmooth.current, targetSnap, lerpAlpha);

    const plugGroup = plugGroupRef.current;
    if (!plugGroup) {
      return;
    }

    const snap = snapSmooth.current;
    if (snap <= 0.015) {
      plugGroup.visible = false;
      return;
    }

    plugGroup.visible = true;
    const easedSnap = THREE.MathUtils.smoothstep(snap, 0.02, 1);
    const hoverOffset = THREE.MathUtils.lerp(-0.48, -0.052, easedSnap);
    plugGroup.position.set(leftWallX + hoverOffset, portY, MAGSAFE_Z);

    const plugOpacity = THREE.MathUtils.clamp((snap - 0.015) / 0.16, 0, 1);
    if (plugBodyMatRef.current) {
      plugColorScratch.set(palette.hex);
      plugBodyMatRef.current.color.lerp(plugColorScratch, lerpAlpha);
      plugBodyMatRef.current.opacity = plugOpacity;
    }
    if (cableMatRef.current) cableMatRef.current.opacity = plugOpacity;
    if (ledMatRef.current) {
      const chargePhase = THREE.MathUtils.smoothstep(snap, 0.78, 0.98);
      ledScratch.copy(amberColor).lerp(emeraldColor, chargePhase);
      ledMatRef.current.color.copy(ledScratch);
      ledMatRef.current.emissive.copy(ledScratch);
      const pulse = reducedMotion ? 1 : 0.88 + 0.12 * Math.sin(state.clock.elapsedTime * 4.2);
      ledMatRef.current.emissiveIntensity = (1.15 + chargePhase * 0.65) * pulse * plugOpacity;
      ledMatRef.current.opacity = plugOpacity;
    }
  });

  return (
    <group name="ports-and-magsafe">
      {/* Left Flank: MagSafe 3 Recessed Housing + 5 Gold Pogo Pins */}
      <group position={[leftWallX, portY, MAGSAFE_Z]}>
        <mesh geometry={geometries.magsafeFrame} position={[-0.001, 0, 0]}>
          <meshStandardMaterial color="#1a1f29" roughness={0.35} metalness={0.78} />
        </mesh>
        <mesh geometry={geometries.magsafeSlot} position={[-0.002, 0, 0]}>
          <meshStandardMaterial color="#07090d" roughness={0.65} metalness={0.2} />
        </mesh>
        {[-0.036, -0.018, 0, 0.018, 0.036].map((pinZ, idx) => (
          <mesh key={idx} geometry={geometries.magsafePin} position={[-0.004, 0, pinZ]}>
            <meshStandardMaterial color="#e6be6a" roughness={0.25} metalness={0.95} />
          </mesh>
        ))}
      </group>

      {/* Left Flank: 2× Thunderbolt 4 / USB 4 Ports */}
      {THUNDERBOLT_Z_POSITIONS.map((zPos, idx) => (
        <group key={idx} position={[leftWallX, portY, zPos]}>
          <mesh geometry={geometries.tbFrame} position={[-0.001, 0, 0]}>
            <meshStandardMaterial color="#181d26" roughness={0.38} metalness={0.72} />
          </mesh>
          <mesh geometry={geometries.tbCavity} position={[-0.002, 0, 0]}>
            <meshStandardMaterial color="#06080c" roughness={0.7} metalness={0.15} />
          </mesh>
          <mesh geometry={geometries.tbTongue} position={[-0.0025, 0, 0]}>
            <meshStandardMaterial color="#cbd5e1" roughness={0.26} metalness={0.85} />
          </mesh>
        </group>
      ))}

      {/* Animated Snap-In Braided MagSafe 3 Connector */}
      <group ref={plugGroupRef} position={[leftWallX - 0.48, portY, MAGSAFE_Z]} visible={false}>
        <mesh geometry={geometries.plugShell}>
          <meshStandardMaterial
            ref={plugBodyMatRef}
            color={palette.hex}
            roughness={0.26}
            metalness={0.85}
            transparent
            opacity={0}
          />
        </mesh>
        <mesh geometry={geometries.plugCollar} position={[-0.068, 0, 0]}>
          <meshStandardMaterial color="#cbd5e1" roughness={0.4} metalness={0.35} />
        </mesh>
        <mesh geometry={geometries.plugLed} position={[-0.012, 0.0145, 0]}>
          <meshStandardMaterial
            ref={ledMatRef}
            color="#f59e0b"
            emissive="#f59e0b"
            emissiveIntensity={1.2}
            roughness={0.2}
            transparent
            opacity={0}
          />
        </mesh>
        <mesh geometry={geometries.braidedCable}>
          <meshStandardMaterial
            ref={cableMatRef}
            color="#94a3b8"
            roughness={0.72}
            metalness={0.12}
            transparent
            opacity={0}
          />
        </mesh>
      </group>

      {/* Right Flank: 3.5mm High-Impedance Headphone Jack */}
      <group position={[rightWallX, portY, AUDIO_JACK_Z]}>
        <mesh geometry={geometries.jackRing} position={[0.001, 0, 0]}>
          <meshStandardMaterial color="#94a3b8" roughness={0.28} metalness={0.9} />
        </mesh>
        <mesh geometry={geometries.jackBore} position={[-0.002, 0, 0]}>
          <meshStandardMaterial color="#050608" roughness={0.8} metalness={0.1} />
        </mesh>
      </group>
    </group>
  );
}
