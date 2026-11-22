import * as THREE from 'three';

const FULLSCREEN_UV_VERTEX = /* glsl */ `
varying vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const M4_CIRCUIT_FRAGMENT = /* glsl */ `
uniform float uTime;
uniform float uPulseIntensity;
uniform vec3 uAccentColor;

varying vec2 vUv;

void main() {
  vec2 centered = vUv - 0.5;
  vec2 absPos = abs(centered);
  float boxDist = max(absPos.x, absPos.y);

  // Fade softly before quad edges to prevent hard boundary clipping
  float boardMask = 1.0 - smoothstep(0.36, 0.49, boxDist);

  // Central M4 silicon die package border
  float dieRim = 1.0 - smoothstep(0.002, 0.014, abs(boxDist - 0.11));

  // Orthogonal Manhattan silicon bus grid outside the central die
  vec2 traceGrid = abs(fract(centered * 28.0) - 0.5);
  float orthoLines = 1.0 - smoothstep(0.02, 0.08, min(traceGrid.x, traceGrid.y));
  float outerTraces = orthoLines * smoothstep(0.11, 0.15, boxDist);

  // Diagonal differential bus traces
  vec2 diag = vec2(centered.x + centered.y, centered.x - centered.y);
  vec2 diagGrid = abs(fract(diag * 18.0) - 0.5);
  float diagLines = (1.0 - smoothstep(0.015, 0.06, min(diagGrid.x, diagGrid.y))) * smoothstep(0.14, 0.22, boxDist);

  // Traveling neural pulse waves radiating outward from M4 die
  float radial = length(centered);
  float pulseWave = pow(max(0.0001, 0.5 + 0.5 * sin(radial * 34.0 - uTime * 3.8)), 4.0);
  float axisPacket = pow(max(0.0001, 0.5 + 0.5 * sin((absPos.x + absPos.y) * 26.0 - uTime * 5.2)), 6.0);

  vec3 copperBase = vec3(0.76, 0.48, 0.28);
  vec3 traceColor = mix(copperBase, uAccentColor, 0.55 + 0.45 * pulseWave);

  float pulse = max(0.0, uPulseIntensity);
  float traceEnergy = (outerTraces * 0.55 + diagLines * 0.45) * (0.28 + 0.95 * pulseWave);
  float dieEnergy = dieRim * (0.75 + 0.45 * axisPacket);
  float alpha = clamp((traceEnergy + dieEnergy) * boardMask * pulse, 0.0, 1.0);

  vec3 finalColor = (traceColor * (traceEnergy + dieEnergy * 1.25)) * pulse * boardMask;
  gl_FragColor = vec4(finalColor, alpha);
}
`;

const INTELLIGENCE_HALO_FRAGMENT = /* glsl */ `
uniform float uTime;
uniform float uOpacity;

varying vec2 vUv;

void main() {
  vec2 edge = min(vUv, 1.0 - vUv);
  float edgeDist = min(edge.x, edge.y);

  // Keep interior screen pixels untouched while creating a luminous perimeter ribbon
  float outerFeather = smoothstep(0.0, 0.008, edgeDist);
  float innerGlow = 1.0 - smoothstep(0.008, 0.105, edgeDist);
  float crispRim = 1.0 - smoothstep(0.006, 0.028, edgeDist);

  vec2 centered = vUv - 0.5;
  float angle = dot(centered, centered) > 1e-6 ? atan(centered.y, centered.x) : 0.0;
  float wave = 0.5 + 0.5 * sin(angle * 2.0 - uTime * 1.45);
  float secondary = 0.5 + 0.5 * cos(angle * 3.0 + uTime * 1.1);

  vec3 cyan = vec3(0.22, 0.74, 0.98);
  vec3 violet = vec3(0.66, 0.33, 0.97);
  vec3 magenta = vec3(0.95, 0.29, 0.60);
  vec3 amber = vec3(0.99, 0.58, 0.24);

  vec3 spectrumA = mix(cyan, violet, wave);
  vec3 spectrumB = mix(magenta, amber, secondary);
  vec3 haloColor = mix(spectrumA, spectrumB, 0.5 + 0.5 * sin(uTime * 0.9 + angle));

  float breath = 0.85 + 0.15 * sin(uTime * 2.2);
  float intensity = (innerGlow * 0.52 + crispRim * 0.85) * outerFeather * breath;
  float alpha = clamp(intensity * clamp(uOpacity, 0.0, 1.0), 0.0, 1.0);
  if (alpha <= 0.0001) discard;

  gl_FragColor = vec4(haloColor * alpha * 1.35, alpha);
}
`;

const DUAL_DISPLAY_HOLO_FRAGMENT = /* glsl */ `
uniform float uTime;
uniform float uOpacity;
uniform vec3 uAccentColor;

varying vec2 vUv;

void main() {
  vec2 edge = min(vUv, 1.0 - vUv);
  float edgeDist = min(edge.x, edge.y);

  // Sleek holographic bezel border + subtle inner glass viewport
  float border = (1.0 - smoothstep(0.008, 0.028, edgeDist)) * smoothstep(0.0, 0.004, edgeDist);
  float hairline = 1.0 - smoothstep(0.001, 0.006, abs(edgeDist - 0.036));

  // Subtle diagonal glass specular sweep and micro-scanlines
  float sweep = pow(max(0.0001, sin((vUv.x * 1.5 + vUv.y * 0.9) * 5.0 - uTime * 1.35)), 6.0);
  float scanline = 0.92 + 0.08 * sin(vUv.y * 220.0);

  // Delicate 6K reference grid inside frame
  vec2 grid = abs(fract(vUv * vec2(8.0, 5.0)) - 0.5);
  float gridLine = smoothstep(0.47, 0.49, max(grid.x, grid.y)) * 0.18;

  vec3 glassBody = mix(vec3(0.04, 0.07, 0.13), uAccentColor * 0.35, 0.35 + sweep * 0.35);
  vec3 rimColor = mix(uAccentColor, vec3(0.92, 0.96, 1.0), 0.45);

  vec3 color = (glassBody * (0.65 + gridLine) + rimColor * (border * 0.95 + hairline * 0.6 + sweep * 0.3)) * scanline;
  float baseAlpha = 0.24 + border * 0.68 + hairline * 0.35 + sweep * 0.12 + gridLine * 0.25;
  float alpha = clamp(baseAlpha * clamp(uOpacity, 0.0, 1.0), 0.0, 1.0);

  gl_FragColor = vec4(color, alpha);
}
`;

/**
 * Creates an additive ShaderMaterial animating M4 silicon bus traces and neural pulse waves.
 */
export function createM4CircuitShaderMaterial(): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uPulseIntensity: { value: 1.0 },
      uAccentColor: { value: new THREE.Color('#7BB3E0') },
    },
    vertexShader: FULLSCREEN_UV_VERTEX,
    fragmentShader: M4_CIRCUIT_FRAGMENT,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    premultipliedAlpha: true,
    side: THREE.DoubleSide,
  });
}

/**
 * Creates an additive iridescent Apple Intelligence perimeter halo ShaderMaterial.
 */
export function createIntelligenceHaloMaterial(): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uOpacity: { value: 0.85 },
    },
    vertexShader: FULLSCREEN_UV_VERTEX,
    fragmentShader: INTELLIGENCE_HALO_FRAGMENT,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    premultipliedAlpha: true,
    side: THREE.DoubleSide,
  });
}

/**
 * Creates a translucent holographic glass-bezel ShaderMaterial for Dual-6K flanking displays.
 */
export function createDualDisplayHoloMaterial(): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uOpacity: { value: 0.85 },
      uAccentColor: { value: new THREE.Color('#7BB3E0') },
    },
    vertexShader: FULLSCREEN_UV_VERTEX,
    fragmentShader: DUAL_DISPLAY_HOLO_FRAGMENT,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
}
