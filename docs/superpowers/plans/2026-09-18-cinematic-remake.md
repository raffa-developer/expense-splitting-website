# Cinematic Remake Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the site's 3D models and scroll animations as premium, cinematic, jank-free motion (Apple-style) with the warm dark palette, full 3D on mobile, and the same section flow.

**Architecture:** Lenis damps the real scroll position; anime.js `onScroll` maps each act's sticky stage to a 0-1 progress ref; R3F scenes read the ref in `useFrame`; DOM captions animate from the same callback. Procedural devices replace the downloaded GLBs. One canvas at a time.

**Tech Stack:** React 19.2, Vite 8, TypeScript 7, Tailwind v4, three 0.186, @react-three/fiber 9, @react-three/drei 10, anime.js 4.5, lenis (new).

**Spec:** `docs/superpowers/specs/2026-09-18-cinematic-remake-design.md`

## Global Constraints

- No async assets: all geometry procedural; the only images are `src/assets/screens/*.png` screenshots.
- One WebGL canvas mounted at a time; keep `ContextReleaser` on every canvas.
- dpr caps `[1, 2]` desktop, `[1, 1.5]` mobile; `PerformanceMonitor` drops to 1 below 45fps sustained 3s.
- Reduced motion: Lenis disabled, every act shows its final static state, reveals show immediately.
- Triangle budgets: coin ~4k, laptop ~5k, phone ~6k.
- No drei `Html` inside canvases; slice amounts are DOM elements.
- Standing gates: `npm run typecheck`, `npm run build` after every task.
- Repo has no git. Skip all commit steps unless the user asks for `git init`.
- Repo root: `C:\Users\Administrator\Desktop\projects\expense-splitting-website`.
- Dev server runs detached on port 5199 (`npm run dev -- --port 5199 --strictPort`); preview build on 5200 (`npx vite preview --port 5200 --strictPort`).
- Playwright harness scripts already exist at `C:\Users\Administrator\AppData\Local\Temp\opencode\`: `site-diag.py` (device fractions, walks scroll to avoid context loss), `site-final.py` (desktop/mobile/reduced/no-WebGL passes), `site-compare.py` (frame-time sampling), `site-hero.py` (hero frames). All take a base URL argument.
- Prose and comments avoid em dashes. No comments in code unless they explain a non-obvious decision.

---

### Task 0: Lenis smooth scroll foundation

**Files:**
- Create: `src/lib/lenis.ts`
- Modify: `src/App.tsx`, `src/lib/animation.ts` (add `enabled` param to `useScrollProgress`), `src/index.css` (Lenis CSS), `package.json` (dependency)
- Test: none (visual, verified by smoke pass)

**Interfaces:**
- Produces: `useLenis(): void` hook; `useScrollProgress(section, callback?, enabled = true)` now accepts `enabled`.
- Consumes: nothing new.

- [ ] **Step 1: Install lenis**

Run: `npm install lenis`

- [ ] **Step 2: Create `src/lib/lenis.ts`**

```ts
import { useEffect } from "react";
import Lenis from "lenis";

export function useLenis(): void {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }
    const lenis = new Lenis({ lerp: 0.1, smoothWheel: true, smoothTouch: false });
    let frame = 0;
    const raf = (time: number) => {
      lenis.raf(time);
      frame = requestAnimationFrame(raf);
    };
    frame = requestAnimationFrame(raf);
    return () => {
      cancelAnimationFrame(frame);
      lenis.destroy();
    };
  }, []);
}
```

- [ ] **Step 3: Mount the hook in `src/App.tsx`**

Add `useLenis();` inside `App()` after `useGlobalScrollProgress(bar);` and import it. `src/main.tsx` needs no change.

- [ ] **Step 4: Add the `enabled` flag to `useScrollProgress`**

In `src/lib/animation.ts`, change the signature to `useScrollProgress(target, onUpdate?, enabled = true)` and guard the effect: after the element check, `if (!enabled) return;`. The ref stays at 0 when disabled; acts set it manually under reduced motion.

- [ ] **Step 5: Add Lenis CSS to `src/index.css`**

Append before the reduced-motion block:

```css
html.lenis,
html.lenis body {
  height: auto;
}

.lenis.lenis-smooth {
  scroll-behavior: auto !important;
}
```

- [ ] **Step 6: Verify**

Run: `npm run typecheck` then `npm run build`.
Expected: both clean.

Run the dev server and scroll by hand in a headed browser or via Playwright: `python C:\Users\Administrator\AppData\Local\Temp\opencode\site-diag.py http://localhost:5199 0.2 smoke`.
Expected: 0 console errors, scrolling still reaches all sections (Lenis moves the real scroll position).

---

### Task 1: Procedural iPhone

**Files:**
- Create: none (rewrite) `src/three/phone.tsx`
- Modify: `src/three/textures.ts` (add `screenOpacity`; keep the masking loader)
- Test: `npm run typecheck` only (rendered visually in Task 3)

**Interfaces:**
- Produces: `PhoneModel({ textures, materialsRef })`, `PHONE_SCREEN_TEXTURE = { radius: 0.055, punchHole: true } as const`. Body 0.82 x 1.68, screen 0.7 x 1.52. `materialsRef` receives `MeshBasicMaterial | null` per texture index.
- Consumes: `useScreenTextures` (existing), `screenOpacity` (new in textures.ts).

- [ ] **Step 1: Move `screenOpacity` into `src/three/textures.ts`**

Append to `textures.ts`:

```ts
export function screenOpacity(delta: number, fade: number): number {
  const value = (1 - Math.abs(delta)) / fade;
  return Math.min(1, Math.max(0, value));
}
```

- [ ] **Step 2: Rewrite `src/three/phone.tsx`**

```tsx
import { useMemo } from "react";
import { RoundedBox } from "@react-three/drei";
import type { RefObject } from "react";
import * as THREE from "three";
import { createLinearTexture } from "@/three/textures";

export const PHONE_SCREEN_TEXTURE = { radius: 0.055, punchHole: true } as const;

const frameMaterial = new THREE.MeshStandardMaterial({
  color: "#2b231d",
  metalness: 0.85,
  roughness: 0.32
});
const glassMaterial = new THREE.MeshStandardMaterial({
  color: "#0a0908",
  metalness: 0.4,
  roughness: 0.18
});
const islandMaterial = new THREE.MeshStandardMaterial({
  color: "#241c16",
  metalness: 0.7,
  roughness: 0.3
});
const lensRingMaterial = new THREE.MeshStandardMaterial({
  color: "#5a4638",
  metalness: 0.95,
  roughness: 0.2
});
const lensMaterial = new THREE.MeshStandardMaterial({
  color: "#0b1622",
  metalness: 0.9,
  roughness: 0.06
});

export function PhoneModel({
  textures,
  materialsRef
}: {
  textures: (THREE.Texture | undefined)[];
  materialsRef?: RefObject<(THREE.MeshBasicMaterial | null)[]>;
}) {
  const sheen = useMemo(
    () => createLinearTexture("rgba(255,255,255,0.22)", "rgba(255,255,255,0)"),
    []
  );

  return (
    <group>
      <RoundedBox args={[0.82, 1.68, 0.09]} radius={0.1} smoothness={6}>
        <meshStandardMaterial
          color="#2b231d"
          metalness={0.85}
          roughness={0.32}
        />
      </RoundedBox>

      <RoundedBox
        args={[0.76, 1.6, 0.02]}
        radius={0.085}
        smoothness={5}
        position={[0, 0, 0.038]}
      >
        <primitive object={glassMaterial} attach="material" />
      </RoundedBox>

      <mesh position={[-0.43, 0.24, 0]}>
        <boxGeometry args={[0.014, 0.16, 0.04]} />
        <primitive object={frameMaterial} attach="material" />
      </mesh>
      <mesh position={[-0.43, 0.02, 0]}>
        <boxGeometry args={[0.014, 0.12, 0.04]} />
        <primitive object={frameMaterial} attach="material" />
      </mesh>
      <mesh position={[0.43, 0.08, 0]}>
        <boxGeometry args={[0.014, 0.24, 0.04]} />
        <primitive object={frameMaterial} attach="material" />
      </mesh>

      <group position={[-0.18, 0.5, -0.055]}>
        <RoundedBox args={[0.36, 0.36, 0.028]} radius={0.09} smoothness={4}>
          <primitive object={islandMaterial} attach="material" />
        </RoundedBox>
        {[-0.075, 0.075].map((offset) => (
          <group key={offset} position={[-0.06, offset, -0.026]}>
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.07, 0.07, 0.028, 24]} />
              <primitive object={lensRingMaterial} attach="material" />
            </mesh>
            <mesh position={[0, 0, -0.016]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.048, 0.048, 0.008, 24]} />
              <primitive object={lensMaterial} attach="material" />
            </mesh>
          </group>
        ))}
        <mesh position={[0.1, 0, -0.02]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.028, 0.028, 0.012, 16]} />
          <meshStandardMaterial
            color="#f2e6cd"
            emissive="#f2e6cd"
            emissiveIntensity={0.3}
          />
        </mesh>
      </group>

      {textures.map((texture, index) => (
        <mesh
          key={index}
          position={[0, 0, 0.052 + index * 0.0004]}
          renderOrder={2 + index}
        >
          <planeGeometry args={[0.7, 1.52]} />
          <meshBasicMaterial
            ref={(material) => {
              if (materialsRef) {
                materialsRef.current[index] = material;
              }
            }}
            map={texture}
            transparent
            opacity={0}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
      ))}

      <mesh position={[0, -0.24, 0.056]} renderOrder={9}>
        <planeGeometry args={[0.7, 1.52]} />
        <meshBasicMaterial
          map={sheen}
          transparent
          opacity={0.35}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  );
}
```

- [ ] **Step 3: Verify**

Run: `npm run typecheck`.
Expected: clean. The old `PhoneModel` is replaced; the scenes still import it with the same props, so no other file changes yet.

---

### Task 2: Procedural MacBook

**Files:**
- Create: `src/three/laptop.tsx`
- Test: `npm run typecheck` (rendered visually in Task 3)

**Interfaces:**
- Produces: `LaptopModel({ textures, materialsRef, lidRef, glowRef })`. Screen 2.3 x 1.44 at lid-local `(0, 0.85, 0.016)`. Lid is a group whose `rotation.x` runs `-1.2` (closed) to `-0.15` (open). `glowRef` receives the keyboard glow `MeshBasicMaterial`.
- Consumes: textures passed in by the scene; `createRadialTexture`, `createLinearTexture`.

- [ ] **Step 1: Create `src/three/laptop.tsx`**

```tsx
import { useMemo } from "react";
import { RoundedBox } from "@react-three/drei";
import type { RefObject } from "react";
import * as THREE from "three";
import { createLinearTexture, createRadialTexture } from "@/three/textures";

const aluminium = new THREE.MeshStandardMaterial({
  color: "#c3c0ba",
  metalness: 0.85,
  roughness: 0.35
});
const aluminiumDark = new THREE.MeshStandardMaterial({
  color: "#8f8c88",
  metalness: 0.8,
  roughness: 0.42
});
const keyboardWell = new THREE.MeshStandardMaterial({
  color: "#151110",
  roughness: 0.7
});
const keyMaterial = new THREE.MeshStandardMaterial({
  color: "#211c19",
  roughness: 0.55
});

export function LaptopModel({
  textures,
  materialsRef,
  lidRef,
  glowRef
}: {
  textures: (THREE.Texture | undefined)[];
  materialsRef?: RefObject<(THREE.MeshBasicMaterial | null)[]>;
  lidRef?: RefObject<THREE.Group | null>;
  glowRef?: RefObject<THREE.MeshBasicMaterial | null>;
}) {
  const keys = useMemo(() => {
    const rows = 4;
    const cols = 13;
    const mesh = new THREE.InstancedMesh(
      new THREE.BoxGeometry(0.15, 0.016, 0.15),
      keyMaterial,
      rows * cols
    );
    const matrix = new THREE.Matrix4();
    let index = 0;
    for (let row = 0; row < rows; row += 1) {
      for (let col = 0; col < cols; col += 1) {
        if (row === 3 && (col === 0 || col === 12)) {
          continue;
        }
        matrix.setPosition(-0.94 + col * 0.157, 0.012, -0.58 + row * 0.27);
        mesh.setMatrixAt(index, matrix);
        index += 1;
      }
    }
    mesh.count = index;
    mesh.instanceMatrix.needsUpdate = true;
    return mesh;
  }, []);

  const glowTexture = useMemo(
    () => createRadialTexture("rgba(255, 214, 178, 0.5)", "rgba(255, 214, 178, 0)"),
    []
  );
  const sheen = useMemo(
    () => createLinearTexture("rgba(255,255,255,0.18)", "rgba(255,255,255,0)"),
    []
  );

  return (
    <group>
      <RoundedBox
        args={[2.62, 0.09, 1.82]}
        radius={0.05}
        smoothness={4}
        position={[0, -1.05, 0.85]}
      >
        <primitive object={aluminium} attach="material" />
      </RoundedBox>

      <mesh position={[0, -1.0, 0.85]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[2.3, 1.5]} />
        <primitive object={keyboardWell} attach="material" />
      </mesh>
      <primitive object={keys} position={[0, -0.985, 0.85]} />
      <mesh position={[0, -0.955, 0.85]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[2.3, 1.5]} />
        <meshBasicMaterial
          ref={glowRef}
          map={glowTexture}
          transparent
          opacity={0}
          depthWrite={false}
        />
      </mesh>
      <RoundedBox
        args={[0.9, 0.02, 0.7]}
        radius={0.01}
        smoothness={2}
        position={[0, -0.985, 1.52]}
      >
        <primitive object={aluminiumDark} attach="material" />
      </RoundedBox>

      <group ref={lidRef} position={[0, -1.0, -0.02]} rotation={[-1.2, 0, 0]}>
        <RoundedBox
          args={[2.62, 1.7, 0.06]}
          radius={0.04}
          smoothness={4}
          position={[0, 0.85, -0.02]}
        >
          <primitive object={aluminium} attach="material" />
        </RoundedBox>
        <mesh position={[0, 0.85, 0.012]}>
          <planeGeometry args={[2.46, 1.56]} />
          <meshStandardMaterial color="#0a0a0c" metalness={0.3} roughness={0.2} />
        </mesh>
        {textures.map((texture, index) => (
          <mesh
            key={index}
            position={[0, 0.85, 0.016 + index * 0.0004]}
            renderOrder={2 + index}
          >
            <planeGeometry args={[2.3, 1.44]} />
            <meshBasicMaterial
              ref={(material) => {
                if (materialsRef) {
                  materialsRef.current[index] = material;
                }
              }}
              map={texture}
              transparent
              opacity={0}
              depthWrite={false}
              toneMapped={false}
            />
          </mesh>
        ))}
        <mesh position={[0, 0.85, 0.02]} renderOrder={9}>
          <planeGeometry args={[2.3, 1.44]} />
          <meshBasicMaterial
            map={sheen}
            transparent
            opacity={0.1}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      </group>
    </group>
  );
}
```

- [ ] **Step 2: Verify**

Run: `npm run typecheck`.
Expected: clean.

---

### Task 3: Device scene rewrite

**Files:**
- Modify: `src/three/device-scene.tsx` (full rewrite)
- Test: Playwright device fractions + frame timing

**Interfaces:**
- Consumes: `LaptopModel`, `PhoneModel`, `PHONE_SCREEN_TEXTURE`, `screenOpacity`, `ContextReleaser`, `ProceduralEnvironment`.
- Produces: default export `DeviceCanvas({ progress }: { progress: ScrollProgress })`.

- [ ] **Step 1: Rewrite `src/three/device-scene.tsx`**

Note on the spec's shader prewarm item: WebGL programs are per-context, so a startup warmup canvas cannot precompile this canvas's shaders. The equivalent guarantee comes from mounting the canvas before the section pins (current `useInRange(section, -0.12, -0.3)` window) and starting the laptop below the viewport (`root.position.y = -1.2` until the enter tween), so the first-frame compile happens while nothing is visible.

```tsx
import { useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { PerformanceMonitor } from "@react-three/drei";
import * as THREE from "three";
import { ProceduralEnvironment } from "@/three/environment";
import { ContextReleaser } from "@/three/context-releaser";
import { LaptopModel } from "@/three/laptop";
import { PhoneModel, PHONE_SCREEN_TEXTURE } from "@/three/phone";
import {
  createRadialTexture,
  screenOpacity,
  useScreenTextures
} from "@/three/textures";
import type { ScrollProgress } from "@/lib/animation";
import desktopDashboard from "@/assets/screens/desktop-dashboard.png";
import desktopGroup from "@/assets/screens/desktop-group.png";
import desktopExpenses from "@/assets/screens/desktop-expenses.png";
import desktopPeople from "@/assets/screens/desktop-people.png";
import mobileDashboard from "@/assets/screens/mobile-dashboard.png";
import mobileGroup from "@/assets/screens/mobile-group.png";
import mobileExpenses from "@/assets/screens/mobile-expenses.png";

const LAPTOP_SCREENS = [
  desktopDashboard,
  desktopGroup,
  desktopExpenses,
  desktopPeople
];
const PHONE_SCREENS = [mobileDashboard, mobileGroup, mobileExpenses];

function clamp(value: number): number {
  return Math.min(1, Math.max(0, value));
}

function smoothstep(edge0: number, edge1: number, value: number): number {
  const t = clamp((value - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
}

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function DprGuard() {
  const gl = useThree((state) => state.gl);
  return (
    <PerformanceMonitor
      onDecline={() => gl.setPixelRatio(1)}
      onIncline={() =>
        gl.setPixelRatio(Math.min(1.5, window.devicePixelRatio || 1))
      }
    >
      <></>
    </PerformanceMonitor>
  );
}

function Devices({ progress }: { progress: ScrollProgress }) {
  const root = useRef<THREE.Group>(null);
  const lid = useRef<THREE.Group | null>(null);
  const glow = useRef<THREE.MeshBasicMaterial | null>(null);
  const phone = useRef<THREE.Group>(null);
  const screenMaterials = useRef<(THREE.MeshBasicMaterial | null)[]>([]);
  const phoneMaterials = useRef<(THREE.MeshBasicMaterial | null)[]>([]);
  const pointerY = useRef(0);
  const shadow = useMemo(
    () => createRadialTexture("rgba(0, 0, 0, 0.6)", "rgba(0, 0, 0, 0)"),
    []
  );
  const laptopTextures = useScreenTextures(LAPTOP_SCREENS);
  const phoneTextures = useScreenTextures(PHONE_SCREENS, PHONE_SCREEN_TEXTURE);

  useFrame((state) => {
    const value = progress.current;
    const time = state.clock.elapsedTime;
    const pointer = state.pointer;

    const enter = smoothstep(0.02, 0.14, value);
    const open = easeInOutCubic(smoothstep(0.14, 0.34, value));
    const dollyIn = smoothstep(0.52, 0.78, value);
    const pullBack = smoothstep(0.78, 0.9, value);
    const phoneIn = smoothstep(0.78, 0.9, value);
    const screen = smoothstep(0.52, 0.78, value) * 3;
    const phoneScreen =
      (((time / 6) % PHONE_SCREENS.length) + PHONE_SCREENS.length) %
      PHONE_SCREENS.length;

    screenMaterials.current.forEach((material, index) => {
      if (material) {
        material.opacity = screenOpacity(screen - index, 0.5);
      }
    });
    phoneMaterials.current.forEach((material, index) => {
      if (material) {
        material.opacity = screenOpacity(phoneScreen - index, 0.15);
      }
    });

    if (root.current) {
      pointerY.current = THREE.MathUtils.lerp(
        pointerY.current,
        pointer.x * 0.08,
        0.05
      );
      root.current.position.y =
        -1.2 * (1 - enter) + Math.sin(time * 0.4) * 0.015;
      root.current.rotation.y = pointerY.current;
    }
    if (lid.current) {
      lid.current.rotation.x = THREE.MathUtils.lerp(-1.2, -0.15, open);
    }
    if (glow.current) {
      glow.current.opacity = open * (0.5 + 0.06 * Math.sin(time * 2.2));
    }
    if (phone.current) {
      phone.current.position.set(
        THREE.MathUtils.lerp(-1.55, 0.02, phoneIn),
        THREE.MathUtils.lerp(-1.05, 0.55, phoneIn),
        THREE.MathUtils.lerp(0.9, 2.2, phoneIn)
      );
      phone.current.rotation.set(
        THREE.MathUtils.lerp(-0.12, -0.1, phoneIn),
        THREE.MathUtils.lerp(0.5, 0.12, phoneIn),
        0.04
      );
      phone.current.scale.setScalar(THREE.MathUtils.lerp(0.55, 0.92, phoneIn));
    }

    const distance = 7.5 - dollyIn * 4.9 + pullBack * 2.0;
    state.camera.position.set(
      Math.sin(pointerY.current) * distance,
      0.35 + dollyIn * 0.55 + pointer.y * 0.05,
      Math.cos(pointerY.current) * distance
    );
    state.camera.lookAt(0, 0.1 + dollyIn * 0.45, 0);
  });

  return (
    <group ref={root}>
      <mesh position={[0, -1.08, 0.85]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[3.9, 2.6]} />
        <meshBasicMaterial
          map={shadow}
          transparent
          opacity={0.5}
          depthWrite={false}
        />
      </mesh>
      <LaptopModel
        textures={laptopTextures}
        materialsRef={screenMaterials}
        lidRef={lid}
        glowRef={glow}
      />
      <group
        ref={phone}
        position={[-1.55, -1.05, 0.9]}
        rotation={[-0.12, 0.5, 0.04]}
        scale={0.55}
      >
        <PhoneModel textures={phoneTextures} materialsRef={phoneMaterials} />
      </group>
    </group>
  );
}

export default function DeviceCanvas({
  progress
}: {
  progress: ScrollProgress;
}) {
  return (
    <Canvas
      dpr={[1, 1.5]}
      gl={{ antialias: true, alpha: true }}
      camera={{ position: [0, 0.4, 7.5], fov: 35 }}
    >
      <ContextReleaser />
      <ProceduralEnvironment />
      <DprGuard />
      <ambientLight intensity={0.4} />
      <directionalLight position={[3, 4, 6]} intensity={1.2} color="#fff4e8" />
      <pointLight position={[-4, -1, 3]} intensity={1.7} color="#6fbfaa" />
      <pointLight position={[4, 1, 2]} intensity={1.3} color="#ff9e72" />
      <Devices progress={progress} />
    </Canvas>
  );
}
```

- [ ] **Step 2: Verify typecheck and build**

Run: `npm run typecheck` then `npm run build`.
Expected: clean.

- [ ] **Step 3: Visual verification**

Run: `python C:\Users\Administrator\AppData\Local\Temp\opencode\site-diag.py http://localhost:5199 "0.06,0.2,0.42,0.6,0.72,0.82,0.9,0.97" task3`
Expected: 0 errors. Check the screenshots: laptop rises with the lid closed at 0.06, opens by 0.2-0.34, dashboard caption over the screen at 0.42, screen dolly and crossfades through 0.6-0.72, phone leaves the desk at 0.82, phone fills the frame at 0.9-0.97. No spins, no double images.

---

### Task 4: Coin scene rewrite

**Files:**
- Modify: `src/three/coin-scene.tsx`
- Test: Playwright hero and split frames

**Interfaces:**
- Consumes: `PhoneModel`, `PHONE_SCREEN_TEXTURE`, `screenOpacity` (import moves from `@/three/models` to `@/three/textures`), `ContextReleaser`, `ProceduralEnvironment`.
- Produces: default export `CoinCanvas({ progress, offsetX, offsetY, scale, compact })` unchanged from today.

- [ ] **Step 1: Polish the coin body**

In `coin-scene.tsx`: raise the cylinder radial segments to 128, keep the ridges and ring. Give the two coin faces a `MeshPhysicalMaterial` with `clearcoat: 0.4`, `clearcoatRoughness: 0.25`, `metalness: 1`, `roughness: 0.3`, color `#b07f4f`; the edge stays `MeshStandardMaterial` brass.

- [ ] **Step 2: Replace the slice choreography**

Replace the current single `open` value with a per-slice stagger:

```ts
const SEGMENTS = [
  { tint: "#4fbfae", share: 0.4, label: "40,00 €" },
  { tint: "#ff9e72", share: 0.25, label: "25,00 €" },
  { tint: "#a78bfa", share: 0.15, label: "15,00 €" },
  { tint: "#e58270", share: 0.1, label: "10,00 €" },
  { tint: "#6fbfaa", share: 0.1, label: "10,00 €" }
];

// inside useFrame, per slice index i:
const sliceOpen = smoothstep(0.42 + i * 0.025, 0.62 + i * 0.025, value);
sliceGroup.rotation.z = -sliceOpen * (0.5 + i * 0.16);
```

Keep the label display inside the scene only as a tint reference; the text legend moves to the DOM in Task 5.

- [ ] **Step 3: Remove drei `Html` labels**

Delete the `Html` amount labels from the slice rendering. The amounts become DOM rows in `split-act.tsx` (Task 5).

- [ ] **Step 4: Idle rotation and exit**

Add to the main coin group's `useFrame`:

```ts
group.rotation.y = time * 0.12 + value * 0.9;
const exitDim = smoothstep(0.82, 1, value);
facesMaterial.opacity = 1 - exitDim * 0.35; // keep opaque; instead dim lights below
```

Simpler: dim the scene by lerping the light intensities:

```ts
const exitDim = 1 - smoothstep(0.82, 1, value) * 0.7;
keyLight.current.intensity = 1.2 * exitDim;
rimLight.current.intensity = 2 * exitDim;
```

- [ ] **Step 5: Hero phone dissolves only**

In `HeroPhone`: delete the `cycleFlip` rotation term and keep the screen opacity with `screenOpacity(deltaFor(index), 0.15)`. The phone keeps its fixed rotation, bob, and screen dissolves.

- [ ] **Step 6: Import `screenOpacity` from `@/three/textures`**

Replace the import in `coin-scene.tsx`.

- [ ] **Step 7: Verify**

Run: `npm run typecheck` then `npm run build`.
Run: `python C:\Users\Administrator\AppData\Local\Temp\opencode\site-hero.py` against 5199 and view `hero-0.25.png`, `hero-0.6.png`.
Expected: 0 errors. Coin idles rotating, slices fan open with stagger, no Html labels inside the canvas, hero phone shows one screen at a time with dissolves.

---

### Task 5: Split act choreography and DOM legend

**Files:**
- Modify: `src/components/split-act.tsx`
- Test: Playwright split frames

**Interfaces:**
- Consumes: `useScrollProgress`, `useReveal`, `useInRange`, `useMediaQuery`, `usePrefersReducedMotion` pattern already in the file.
- Produces: unchanged component signature.

- [ ] **Step 1: Rework the progress callback**

Replace the current callback with the spec timeline:

```ts
const progress = useScrollProgress(section, (value) => {
  if (hero.current) {
    const away = smoothstep(0.12, 0.26, value);
    hero.current.style.opacity = String(1 - away);
    hero.current.style.transform = `translateY(${-away * 48}px)`;
    hero.current.style.pointerEvents = away > 0.5 ? "none" : "auto";
  }
  if (captionOne.current) {
    captionOne.current.style.opacity = String(
      smoothstep(0.26, 0.42, value) * (1 - smoothstep(0.5, 0.6, value))
    );
  }
  if (captionTwo.current) {
    captionTwo.current.style.opacity = String(
      smoothstep(0.44, 0.6, value) * (1 - smoothstep(0.82, 0.92, value))
    );
  }
  sliceRows.current.forEach((row, index) => {
    if (!row) {
      return;
    }
    const show = smoothstep(0.44 + index * 0.025, 0.52 + index * 0.025, value);
    row.style.opacity = String(show * (1 - smoothstep(0.86, 0.95, value)));
    row.style.transform = `translateX(${(1 - show) * 20}px)`;
  });
  if (stageDim.current) {
    stageDim.current.style.opacity = String(smoothstep(0.82, 1, value) * 0.55);
  }
});
```

`captionOne` and `captionTwo` replace the current `split` block (two stacked captions at the left rail, both `opacity: 0` initially).

- [ ] **Step 2: Add the slice legend to the stage**

Next to the second caption, render the five amounts as a left-rail list with a tint dot per row:

```tsx
const SLICES = [
  { tint: "#4fbfae", label: t("split.share1") },
  { tint: "#ff9e72", label: t("split.share2") },
  { tint: "#a78bfa", label: t("split.share3") },
  { tint: "#e58270", label: t("split.share4") },
  { tint: "#6fbfaa", label: t("split.share5") }
];
```

Each row: `<div ref={sliceRows[index]} className="flex items-center gap-3 opacity-0">` with a dot (`style={{ background: tint }}`) and a mono money label. Add the five i18n keys `split.share1` to `split.share5` in both dictionaries (values: "40,00 €", "25,00 €", "15,00 €", "10,00 €", "10,00 €").

- [ ] **Step 3: Stage dim overlay**

Add `<div ref={stageDim} className="pointer-events-none absolute inset-0 bg-black opacity-0" />` as the last element of the sticky stage.

- [ ] **Step 4: Reduced motion**

When `reduce` is true: skip the entrance timeline (already done), pass `enabled={!reduce}` to `useScrollProgress`, set `progress.current = 0.7` once in an effect, and apply the final styles directly: hero hidden, captions and legend visible, dim 0.

- [ ] **Step 5: Verify**

Run: `npm run typecheck` then `npm run build` (this enforces the i18n parity for the new keys).
Run: `python C:\Users\Administrator\AppData\Local\Temp\opencode\site-diag.py http://localhost:5199 "0,0.2,0.35,0.5,0.6,0.75,0.9" task5` after adapting the script's target to `#top` (copy `site-hero.py`'s section lookup).
Expected: 0 errors. Legend rows appear one by one in step with the slices.

---

### Task 6: Device act captions and type

**Files:**
- Modify: `src/components/device-act.tsx`
- Test: Playwright device frames

**Interfaces:**
- Consumes: `useScrollProgress`, `useInRange`, `useMediaQuery`, `supportsWebGL`, five caption refs.
- Produces: unchanged component signature.

- [ ] **Step 1: Update the caption window**

Replace the caption math so the laptop captions follow the scene's screen value and end when the phone takes over:

```ts
const screen = smoothstep(0.52, 0.78, value) * 3;
const laptopOut = 1 - smoothstep(0.78, 0.86, value);
captions.forEach((ref, index) => {
  const element = ref.current;
  if (!element) {
    return;
  }
  const opacity =
    index < 4
      ? screenOpacity(screen - index, 0.5) * laptopOut
      : smoothstep(0.8, 0.88, value) * (1 - smoothstep(0.95, 1, value));
  element.style.opacity = String(opacity);
  element.style.transform = `translateY(${(1 - opacity) * 14}px)`;
});
```

Import `screenOpacity` from `@/three/textures`; the `clamp` import is no longer needed.

- [ ] **Step 2: Type scale**

Change the caption paragraph class to:

```tsx
className="absolute inset-x-0 bottom-0 font-display text-[clamp(2.25rem,5vw,3.75rem)] font-extrabold leading-[1.05] tracking-[-0.02em] text-ink opacity-0 [text-shadow:0_2px_18px_rgba(0,0,0,0.85),0_1px_3px_rgba(0,0,0,0.6)]"
```

Keep the container `bottom-2 left-6 w-[min(21rem,70vw)] sm:bottom-6`, and reduce to `w-[min(18rem,60vw)]` on screens narrower than 640px so the close-up caption clears the phone.

- [ ] **Step 3: Reduced motion**

When reduce: `enabled={!reduce}` on `useScrollProgress`, set `progress.current = 1` once, and show caption index 4 only.

- [ ] **Step 4: Verify**

Run: `npm run typecheck` then `npm run build`.
Run: `python C:\Users\Administrator\AppData\Local\Temp\opencode\site-diag.py http://localhost:5199 "0.42,0.6,0.72,0.9" task6`
Expected: 0 errors. Big left-rail captions dissolve in step with the screens; caption 5 clears the phone.

---

### Task 7: Section reveals and nav chrome

**Files:**
- Modify: `src/components/mechanics.tsx`, `src/components/settle-section.tsx`, `src/components/tech-section.tsx`, `src/components/run-section.tsx`, `src/components/nav.tsx`
- Test: Playwright section pass

**Interfaces:**
- Consumes: `Reveal` component and `useReveal` from `@/lib/animation`.
- Produces: no signature changes.

- [ ] **Step 1: Staggered reveals**

In each of the four section components, wrap every top-level block in `<Reveal delay={index * 90}>` where `index` is the block's order on the page. Where a section already uses `Reveal` with no delay, add the stagger. Verify no block sits outside a `Reveal` (titles, cards, code block).

- [ ] **Step 2: Nav shrink and blur**

In `nav.tsx`, add a rAF-throttled scroll listener effect:

```ts
useEffect(() => {
  let frame = 0;
  const update = () => {
    frame = 0;
    const scrolled = window.scrollY > 80;
    header.current?.classList.toggle("bg-canvas/80", scrolled);
    header.current?.classList.toggle("backdrop-blur-md", scrolled);
    header.current?.classList.toggle("py-4", !scrolled);
    header.current?.classList.toggle("py-2", scrolled);
  };
  const request = () => {
    if (!frame) {
      frame = requestAnimationFrame(update);
    }
  };
  update();
  window.addEventListener("scroll", request, { passive: true });
  return () => {
    window.removeEventListener("scroll", request);
    cancelAnimationFrame(frame);
  };
}, []);
```

Attach `ref={header}` to the nav's top-level element and give it `transition-all` classes. Keep the language and theme toggles unchanged.

- [ ] **Step 3: Verify**

Run: `npm run typecheck` then `npm run build`.
Run: `python C:\Users\Administrator\AppData\Local\Temp\opencode\site-final.py http://localhost:5199`
Expected: 0 errors on all passes; sections reveal once with stagger; nav blurs after the hero.

---

### Task 8: Cinematic CSS pass

**Files:**
- Modify: `src/index.css`
- Test: build + visual pass

- [ ] **Step 1: Grid quieting and vignette**

In `grid-backdrop`, change the line alphas `rgba(240, 234, 226, 0.045)` to `rgba(240, 234, 226, 0.027)`. Add a stage vignette utility:

```css
@utility stage-vignette {
  background: radial-gradient(
    ellipse at 50% 42%,
    transparent 30%,
    rgba(10, 8, 6, 0.55) 100%
  );
}
```

Apply `stage-vignette` to the sticky stages in `split-act.tsx` and `device-act.tsx` (after the grid backdrop element).

- [ ] **Step 2: Type scale utilities**

Add to `@theme inline`:

```css
--text-hero: clamp(3rem, 7vw, 5rem);
--text-caption: clamp(2.25rem, 5vw, 3.75rem);
```

Then use `text-(length:--text-hero)` for the hero title and `text-(length:--text-caption)` in the device captions (replacing the arbitrary value from Task 6).

- [ ] **Step 3: Verify**

Run: `npm run typecheck` then `npm run build`.
Run the visual passes from Tasks 5 and 6 again.
Expected: cleaner, deeper stage backgrounds; the grid is quieter.

---

### Task 9: Cleanup: credits, config, i18n

**Files:**
- Modify: `src/components/footer.tsx`, `src/lib/i18n.tsx`, `vite.config.ts`
- Test: typecheck/build

- [ ] **Step 1: Remove the CC-BY credit**

In `footer.tsx`, delete the `{t("footer.credits")}` span. In `i18n.tsx`, delete `footer.credits` from both dictionaries.

- [ ] **Step 2: Remove the models watch ignore**

In `vite.config.ts`, delete the `server.watch.ignored` block.

- [ ] **Step 3: Verify**

Run: `npm run typecheck` then `npm run build`.
Expected: clean.

---

### Task 10: Delete the model pipeline

**Files:**
- Delete: `src/three/models.tsx`, `public/models/` (both GLB files)

**Interfaces:**
- Consumes: nothing may import `@/three/models` at this point (Tasks 3, 4, 6 switched to `@/three/textures` and the new components).

- [ ] **Step 1: Confirm no remaining imports**

Run: `Select-String -Path "src\**\*.tsx","src\**\*.ts" -Pattern "three/models"` in the repo root.
Expected: no output. If output exists, fix those imports first.

- [ ] **Step 2: Delete the files**

Delete `src/three/models.tsx` and the folder `public/models`.

- [ ] **Step 3: Verify**

Run: `npm run typecheck` then `npm run build`.
Expected: clean, and the bundle drops ~1MB.

---

### Task 11: Full verification against the spec

**Files:**
- None (verification only)

- [ ] **Step 1: Gates**

Run: `npm run typecheck` then `npm run build`.
Expected: clean.

- [ ] **Step 2: Full Playwright passes**

Run: `python C:\Users\Administrator\AppData\Local\Temp\opencode\site-final.py http://localhost:5200`
Expected: `final errors: 0`, `mobile errors: 0`, `reduced errors: 0`, `nowebgl errors: 0`.

- [ ] **Step 3: Frame timing**

Run: `python C:\Users\Administrator\AppData\Local\Temp\opencode\site-compare.py http://localhost:5200 cinematic`
Expected: median at or under 17ms, p95 at or under 34ms on this machine's software GL. Record the numbers.

- [ ] **Step 4: Spec checklist**

Walk the spec section by section: Lenis damped scroll (Task 0), pipeline unchanged shape (Tasks 3-6), canvas handoff kept, procedural budgets met (Tasks 1-4), dpr caps and PerformanceMonitor (Task 3), no Html in canvas (Task 4), motion tables implemented (Tasks 3-6), type and layout (Tasks 6, 8), deletions complete (Tasks 9-10), reduced motion static end states (Tasks 5-6). List any gap and fix it before sign-off.

- [ ] **Step 5: Manual phone check**

Ask the user to scroll the site on a phone and confirm the device act runs smoothly with the close-up intact.
