# MacBook Air M4 — 3D Landing Page & Interactive Hardware Studio Design

**Date:** 2026-11-22  
**Workspace:** `/Users/vrajeshsulakhe/m4 air test site`  
**Status:** Draft (pending user approval)

---

## 1. Intent & Why

Create a flagship, visually striking, animation-rich 3D product landing page for the **Apple MacBook Air (M4)** that serves **both** purposes seamlessly:
1. **A dramatic keynote-style scroll showcase** — choreographed WebGL camera sweeps, hardware reveals, M4 silicon X-ray visualization, and editorial typography transitions inspired by Apple's hardware launches while pushing further with real-time 3D shaders and lighting.
2. **An interactive 3D hardware explorer & spec configurator** — giving visitors hands-on 360° orbit inspection, live anodized finish switching, 13-inch vs. 15-inch scale comparison, animated hardware state toggles, and real-spec pricing configuration.

Because the user explicitly granted full creative freedom on visual style, animations, and technical stack, all architectural, styling, and motion choices below are proposed calls for user sign-off.

---

## 2. Product Facts Grounding (Verified Specs)

All copy, dimensions, hardware visuals, and base pricing on the page must reflect the real **MacBook Air (M4)** lineup (March 2025 release):
- **Models & Starting MSRP (USD):**
  - **13-inch MacBook Air (M4):** starts at **$999** (`10-core CPU / 8-core GPU`, `16GB` Unified Memory, `256GB` SSD) — `0.44 in` (`1.13 cm`) thin, `2.7 lb` (`1.24 kg`), `13.6-inch` Liquid Retina (`2560 × 1664`, `224 ppi`, `500 nits`, P3 Wide Color, True Tone).
  - **15-inch MacBook Air (M4):** starts at **$1,199** (`10-core CPU / 10-core GPU`, `16GB` Unified Memory, `256GB` SSD) — `0.45 in` (`1.15 cm`) thin, `3.3 lb` (`1.51 kg`), `15.3-inch` Liquid Retina (`2880 × 1864`, `224 ppi`, `500 nits`, P3 Wide Color, True Tone).
- **Finishes:** **Sky Blue** (new signature anodized metallic sheen), **Midnight**, **Starlight**, **Silver**.
- **Apple M4 Silicon:** `10-core CPU` (4 performance + 6 efficiency cores), `8-core` or `10-core GPU` with hardware-accelerated ray tracing, `16-core Neural Engine` built for Apple Intelligence, completely **fanless** silent architecture.
- **Memory & Storage:** Unified Memory starts at `16GB` (configurable to `24GB` or `32GB`); SSD starts at `256GB` (configurable to `512GB`, `1TB`, or `2TB`).
- **External Displays:** Native support for **up to two external 6K displays at 60Hz** simultaneously *with the built-in display open*.
- **Camera, Audio, Ports & Battery:** `12MP Center Stage` camera with Desk View; Spatial Audio speaker system; `MagSafe 3` charging port + **two Thunderbolt 4 / USB 4** ports (`40Gb/s`) + `3.5mm` high-impedance headphone jack; `Wi-Fi 6E` + `Bluetooth 5.3`; up to **18 hours** battery life (video streaming) / `15 hours` wireless web; Touch ID Magic Keyboard & Force Touch trackpad; built with over `50%` recycled materials.

---

## 3. Goals, Non-Goals, and Anti-Goals

### Goals
- **First-3-seconds impression:** Instant, non-blocking dark obsidian stage (`#050608`) with soft studio rim light revealing the chamfered Sky Blue silhouette floating and opening cleanly as the user enters or scrolls.
- **Zero external 3D asset failures:** The entire MacBook Air M4 (chassis, beveled edges, lid, hinge, backlit Magic Keyboard, Force Touch trackpad, side ports, MagSafe 3 connector, internal logic board, and M4 silicon package) is built procedurally in Three.js/R3F with procedural textures and GLSL shaders—never relying on external `.glb` CDN links that can fail or break.
- **Smooth scroll + interactive handoff:** Scroll choreography guides Acts 1–5 effortlessly, then hands off seamlessly to an interactive 3D Studio & Configurator in Act 6 (with a quick-jump nav button `"Studio 3D"` / `"Configure"` available at any scroll depth).
- **Authentic material & shader craft:** Realistic anodized aluminum PBR materials with subtle micro-brushed roughness, dynamic `<canvas>`-backed Liquid Retina display content, custom GLSL Apple Intelligence edge-halo / ray-tracing display shader, and a translucent **M4 Silicon X-Ray** shader reveal.
- **Responsive & accessible:** Works cleanly across desktop (`1440px`), tablet (`768px`), and mobile (`375px`) viewports, supports keyboard navigation for every control, respects `prefers-reduced-motion`, and includes an explicit WebGL/ErrorBoundary DOM fallback.

### Non-Goals
- No real backend e-commerce checkout, cart persistence API, or Apple account integration (configurator culminates in an interactive `"Review Summary"` modal showing selected specs and estimated price).
- No multi-route marketing site; this is a cohesive single-page experience.
- No audio autoplay without user interaction.

### Anti-Goals
- **No scroll hijacking traps:** `<OrbitControls>` must never swallow page wheel scrolling when the user is scrolling the document (`enableZoom={false}` inside embedded studio view, with explicit `+`/`-` zoom controls and interactive toggle).
- **No generic "AI landing page" filler:** No identical 3-column icon cards, no random glowing purple blobs, and no fabricated testimonials, user counts, or review stars.
- **No unbounded GPU burn:** No uncapped DPR on high-density displays, no real-time dynamic shadow maps on low-end/mobile viewports, and no React `setState` updates on every animation frame.

---

## 4. Constraints & Approaches Considered

### Constraints
- **Environment:** Empty project directory (`/Users/vrajeshsulakhe/m4 air test site`); Node `v22.23.1`, npm `10.9.8`, pnpm, bun, and git available locally.
- **Self-contained assets:** All fonts (self-hosted `@fontsource` or clean system/web typography with graceful fallback), 3D geometry, procedural PBR roughness/normal maps, and environment lighting (`Lightformer` studio softboxes) live within the project bundle.
- **Performance targets:** Cap canvas pixel ratio (`dpr={[1, 1.75]}` desktop, `[1, 1.25]` compact/mobile), instance repeated geometry (`InstancedMesh` for ~78 keyboard keys and logic-board SMD components), mutate Three.js object transforms/uniforms via refs inside `useFrame`, and pause or skip heavy post-processing passes when offscreen or when `prefers-reduced-motion` is active.

### Approaches Considered
1. **React + Vite + React Three Fiber (Three.js + Drei + Postprocessing) + GSAP ScrollTrigger + Lenis *(Selected)***
   - *How it works:* Declarative R3F 3D hardware assembly with imperative `useFrame` ref animation driven by GSAP ScrollTrigger progress (`0..1`) across Acts 1–5, switching smoothly to user-controlled orbit + stateful hardware variants in Act 6.
   - *Trade-offs:* Higher initial geometry and shader complexity; requires strict ref-based animation and GPU disposal discipline to hold smooth frame times.
   - *Why picked:* Unifies cinematic scroll storytelling and rich interactive variant state (finish, size, memory, storage, camera presets, X-ray, accessibility DOM controls) in one cohesive codebase.
2. **Vanilla Three.js + GSAP + Static DOM**
   - *How it works:* Single imperative Three.js scene driving DOM text overlays.
   - *Trade-offs:* Smaller runtime overhead, but keeping multi-axis configurator UI, camera presets, keyboard accessibility, and live price summaries synced with imperative Three.js state becomes brittle as UI complexity grows.
3. **Scroll-Scrubbed Pre-rendered Frame Sequence or External Spline Embed**
   - *How it works:* Scrubs pre-baked video frames or embeds an external Spline iframe.
   - *Trade-offs:* Prevents real-time arbitrary 360° orbit inspection, live M4 X-Ray cutaway shaders, and dynamic finish/size morphing; depends on external binary assets.

---

## 5. Aesthetic & Experience Design (Proposed Calls)

### Visual Direction: *"Obsidian Keynote × Anodized Studio"*
- **Typography (My Call):**
  - **Display & Body:** `Plus Jakarta Sans` (clean geometric Apple-inspired clarity, tight negative tracking on hero headlines, crisp hierarchy) paired with `JetBrains Mono` for precision hardware callouts (`1.13 CM`, `224 PPI`, `40 GB/S`, `18 HRS`).
  - **Tabular numerals** (`font-variant-numeric: tabular-nums`) on all spec readouts and live pricing so numbers never jitter when toggling variants.
- **Color Story (My Call — alternating editorial contrast across acts):**
  - **Dark Keynote Acts (1, 3, 4):** Obsidian (`#050608`) and Deep Slate (`#080C14`), crisp platinum text (`#F5F5F7`), muted slate secondary (`#9BA3B4`), Sky Blue accent (`#7BB3E0`), M4 neural cyan (`#38BDF8`).
  - **Light Anodized Editorial Acts (2, 5):** Cool Studio Porcelain (`#F4F6F9`) and Silver Mist (`#EAEFF5`), deep ink (`#101319`), refined hairlines (`rgba(16, 19, 25, 0.10)`).
  - **Product Anodized Finishes (Accurate Palette):**
    - **Sky Blue:** `#A3C1DA` (cool ice-blue aluminum sheen)
    - **Midnight:** `#1E2532` (deep ink-navy anodized aluminum)
    - **Starlight:** `#DDD5C7` (warm champagne-silver aluminum)
    - **Silver:** `#D7DBE0` (classic pure machined aluminum)

### Page & Scroll Architecture (6 Acts)

1. **Floating Glass Navigation Bar (Persistent)**
   - Brand mark (`MacBook Air M4`), chapter anchors (`Overview`, `Design`, `M4 Silicon`, `Display`, `Studio 3D`), quick finish dot indicator, and primary `"Configure — From $999"` CTA jumping smoothly to Act 6.
   - Collapses cleanly into a compact mobile bar at `375px`.

2. **Act 1 — Hero Reveal (`100vh–140vh`, Dark Obsidian)**
   - **3D Choreography:** Closed MacBook Air in Sky Blue hovers on a gentle breathing sine curve under sculpted rim lights; as initial entrance completes and user begins scrolling, the precision hinge smoothly opens (`0° → 108°`), waking the Liquid Retina display and softly illuminating the backlit Magic Keyboard.
   - **Copy:** `"MacBook Air M4"` eyebrow · `"Sky-high speed. Featherlight Air."` headline · `"Supercharged by the M4 chip. Now in Sky Blue, starting at $999."` · dual actions: `"Explore in 3D"` (jumps to Studio) and `"Scroll to unveil"`.

3. **Act 2 — Anodized Unibody & Sky Blue Craft (`160vh`, Studio Porcelain Light Contrast)**
   - **3D Choreography:** Camera orbits laterally along the razor-thin `1.13 cm` side profile, rotating to showcase the chamfered unibody seam, engraved rear hinge profile, and subtle color-swatch ambient bounce as the background transitions smoothly to light studio porcelain.
   - **Copy & Micro-pills:** Interactive preview pills let the user preview all 4 finishes mid-scroll or read the dimensional callouts (`1.13 cm` thin · `2.7 lb` weight · `>50%` recycled aluminum · `Fanless` zero-noise chassis).

4. **Act 3 — M4 Silicon X-Ray Cutaway (`180vh`, Deep Slate Blueprint)**
   - **3D Choreography:** Top-down 3/4 view; outer aluminum casing transitions cleanly into a translucent smoked-glass X-ray shell, revealing the internal logic board, dark-graphite fanless thermal spreader, battery cells, and a raised **M4** silicon die glowing with animated neural/ray-tracing circuit pulses (custom GLSL fragment shader).
   - **Copy & Telemetry:** `10-Core CPU` · `Up to 10-Core GPU with Ray Tracing` · `16-Core Neural Engine` · `16GB–32GB Unified Memory` with animated horizontal performance bar indicators (relative capability/architecture visual—no fabricated benchmark percentages without citing real Apple claims, or clearly labeled architectural specs).

5. **Act 4 — Liquid Retina, 12MP Center Stage & Dual 6K Displays (`180vh`, Deep Charcoal)**
   - **3D Choreography:** Camera glides squarely in front of the open Liquid Retina screen while the live `<canvas>` display shader cycles through rich P3 artwork, crisp Apple Intelligence border glow, and a stylized 3D projection of **two flanking virtual 6K monitors** lighting up beside the open laptop to illustrate M4's simultaneous dual-external-display capability with the lid open.
   - **Copy:** `2560 × 1664 / 2880 × 1864` · `500 nits` · `1 Billion Colors (P3)` · `12MP Center Stage Camera` · `2× External 6K Displays (Lid Open)`.

6. **Act 5 — Connectivity, MagSafe 3 & 18-Hour Endurance (`140vh`, Silver Mist)**
   - **3D Choreography:** Macro side-profile sweep zooming into the left and right edges: animated **MagSafe 3** magnetic plug snapping into place with an amber/green status LED glow, `2× Thunderbolt 4 (40Gb/s)` ports highlighted, and `3.5mm` audio jack callout on the opposite flank.
   - **Copy:** Spatial Audio · MagSafe 3 · Dual Thunderbolt 4 · Up to `18 hrs` battery life.

7. **Act 6 — Interactive 3D Studio & Configurator (`min-h-screen`, Split/Stage Layout)**
   - **3D Stage (`~60%` desktop width, `50vh` top stage on mobile):**
     - Full 360° drag-to-orbit (`OrbitControls`, `enableZoom={false}`, dedicated `+` / `−` / `Reset` camera controls + double-click reset).
     - **Camera Presets:** `Hero`, `Profile`, `Ports`, `Keyboard`, `M4 X-Ray`.
     - **Live Hardware Toggles:**
       - `Lid Angle` slider (`0°` closed → `130°` open)
       - `X-Ray Mode` toggle (normal anodized aluminum vs. M4 internal cutaway)
       - `Keyboard Backlight` toggle
       - `Screen Mode` selector (`Sequoia Mist`, `Apple Intelligence`, `Ray Trace`, `Studio Dark`)
   - **Configurator Panel (`~40%` desktop width, clean accessible controls):**
     - **Size:** `13-inch` (`$999` base) vs. `15-inch` (`$1,199` base) — smoothly scales the 3D chassis proportions and updates live dimensions/weight/resolution.
     - **Finish:** `Sky Blue`, `Midnight`, `Starlight`, `Silver` — smoothly interpolates PBR metallic colors and studio rim tint.
     - **Chip / GPU Tier (Exact Deterministic Pricing & Coupling Matrix):**
       - `13-inch` starts with `10-core CPU / 8-core GPU` included (`+$0`).
       - Upgrading to `10-core GPU` on `13-inch` with `256GB` SSD adds `+$100` (`$1,099` base).
       - Selecting `512GB`, `1TB`, or `2TB` SSD on `13-inch` automatically upgrades to and includes the `10-core GPU` at `$0` extra GPU surcharge (so `13-inch · 10-core GPU · 16GB · 512GB` = `$1,199`), and locks out `8-core GPU` with an inline note (`"Included with 512GB+ SSD"`). Switching SSD back to `256GB` unlocks both `8-core` and `10-core GPU` options.
       - `15-inch` always includes `10-core CPU / 10-core GPU` (`+$0`); `8-core GPU` is unavailable with an inline note (`"Standard on 15-inch"`).
     - **Unified Memory:** `16GB` (`+$0` Included) / `24GB` (`+$200`) / `32GB` (`+$400`).
     - **SSD Storage:** `256GB` (`+$0` Included) / `512GB` (`+$200`) / `1TB` (`+$400`) / `2TB` (`+$800`).
     - **Summary Bar & Modal:** Live tabular price readout, monthly estimate toggle (optional), and `"Review Configuration"` CTA opening a clean spec summary modal with copy-spec action.

---

## 6. 3D Hardware & Shader Architecture (What's Left to the Builder)

The builder will design and tune the modular source structure under `src/`:
- **3D Model Assembly (`src/components/three/MacBookAirModel.tsx` + subparts):**
  - Beveled CNC unibody base (`ExtrudeGeometry` with smooth bevel + recessed trackpad well + port recesses + 4 bottom rubber feet).
  - Precision hinge group pivoting along the rear Z/Y axis.
  - Ultra-thin lid assembly with rounded corners, outer metallic emblem inlay, dark glass bezel, display notch + 12MP camera lens dot, and active Liquid Retina screen mesh.
  - Backlit keyboard deck using a single `THREE.InstancedMesh` for keycaps + custom scissor-key glow plane + Touch ID ring accent + Force Touch glass trackpad.
  - Internal M4 X-Ray assembly (logic board plane, battery cell pack silhouettes, graphite fanless shield, central `M4` chip package, and custom GLSL pulsing circuit-trace overlay) revealed cleanly when X-Ray opacity transitions.
  - Animated MagSafe 3 plug assembly (visible and animating smoothly during Act 5 and `Ports` preset).
  - Flanking translucent holographic dual-6K display frames (appearing softly in Act 4 to demonstrate dual external display support).
- **Lighting & Post-processing:**
  - Procedural `<Environment resolution={256}>` using `<Lightformer>` studio softboxes and accent rim strips (tuned dynamically per finish so Midnight retains crisp specular edge highlights and Sky Blue glows cool metallic).
  - `<ContactShadows>` or lightweight baked radial studio ground plane (avoiding expensive per-frame shadow maps on mobile).
  - Lightweight `<EffectComposer>` with selective high-threshold `<Bloom>` and subtle `<Vignette>` (disabled cleanly when `prefers-reduced-motion` or low-power fallback is triggered).
- **Scroll & State Synchronization:**
  - Shared mutable `sceneTimelineRef` (plain object read inside R3F `useFrame`) updated by GSAP ScrollTrigger across Acts 1–5 so scroll animation runs at 60fps without triggering React re-renders.
  - Clean handoff state (`isStudioInteractive`) that lets the user freely orbit and adjust lid/X-Ray in Act 6, plus an accessible floating `"Back to Story"` / `"Skip to Studio"` control.
- **Resilience & Verification:**
  - WebGL detection + React `ErrorBoundary` wrapping `<Canvas>` with a stylized static SVG/CSS hardware fallback and full working configurator UI.
  - Unit tests (Vitest) covering pricing/variant calculations, spec state constraints (e.g., 15-inch enforces 10-core GPU), and WebGL-unavailable fallback UI.
  - End-to-end Playwright verification (with Chromium) checking desktop (`1440px`), tablet (`768px`), and mobile (`375px`), keyboard accessibility, console error freedom, finish/size/X-Ray interactions, and smooth scroll choreography.

---

## 7. Open Decisions / Builder Calls Summary

- **Design & Stack Calls Made by Me:**
  - Stack: Vite + React + TypeScript + `@react-three/fiber` + `@react-three/drei` + `@react-three/postprocessing` + `three` + `gsap` + `lenis` + Tailwind CSS.
  - Visual direction: *Obsidian Keynote × Anodized Studio* alternating dark/light editorial acts with Sky Blue as the hero launch finish.
  - Typography: `Plus Jakarta Sans` + `JetBrains Mono` with tabular numerals.
  - Procedural 3D model + GLSL shaders instead of external `.glb` files for deterministic 100% reliable rendering.
  - Configurator GPU/SSD coupling rule: 13-inch 10-core GPU is `+$100` with 256GB SSD and automatically included (`$0` GPU surcharge) when 512GB+ SSD is chosen, matching Apple's `$999` / `$1,199` / `$1,399` retail tiers.
- **Left to the Builder:**
  - Exact package version pins compatible with React & R3F.
  - Exact 3D mesh coordinates, camera spline waypoints per act, and shader GLSL math.
  - Exact CSS/Tailwind token file structure and test harness wiring.
