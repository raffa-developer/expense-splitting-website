# Product-film 3D Remake Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current coin/device scenes with a single responsive, premium-realistic product-film experience made from procedural Three.js models.

**Architecture:** `ProductFilmAct` owns a 420vh sticky story section, accessible captions, and fallback routing. One `ProductFilmScene` owns the only active Canvas and composes an animated machined coin, laptop, and phone from procedural components. Pure scroll chapter mappings and constrained orbit math live outside React/R3F so they can be tested without WebGL.

**Tech Stack:** React 19, TypeScript 7, Tailwind v4, Three.js, React Three Fiber, drei, anime.js, Vitest.

**Spec:** `docs/superpowers/specs/2026-09-19-product-film-remake-design.md`

## Global Constraints

- Keep pt-PT and English dictionaries, external-link configuration, and all product copy mechanisms intact.
- Replace imported glTF device use with procedural Three.js laptop, phone, and coin components; do not add rendered assets.
- Mount only one Canvas and dispose its WebGL context after the product-film section leaves the viewport.
- Cap device drag orbit at 10 degrees horizontally and 5 degrees vertically; return to the scroll composition on release.
- Desktop WebGL gets the full film; mobile WebGL renders lighter, shorter chapters; reduced-motion and no-WebGL modes retain captions, CTAs, and screenshots.
- Preserve readable text and functioning navigation without Canvas; canvas content is decorative and `aria-hidden`.
- Use `npm run typecheck`, `npm run build`, and focused Vitest tests as gates. Verify desktop/mobile, reduced-motion, and no-WebGL manually before completion.

---

## File structure

| Path | Responsibility |
| --- | --- |
| `src/lib/product-film-motion.ts` | Pure phase mapping, camera state, screen crossfade values, clamped pointer orbit math. |
| `src/lib/product-film-motion.test.ts` | Unit coverage for chapter transitions and interaction constraints. |
| `src/three/product-film/coin.tsx` | Procedural machined coin shell, grooves, arc segments, and settlement inlay. |
| `src/three/product-film/laptop.tsx` | Procedural hinged laptop, screen-plane materials, and realistic low-cost detail. |
| `src/three/product-film/phone.tsx` | Procedural phone, camera island, controls, and mobile display planes. |
| `src/three/product-film/studio.tsx` | Studio floor, contact shadows, three-light rig, and quiet reflections. |
| `src/three/product-film/scene.tsx` | One Canvas, camera rail, pointer orbit, asset composition, and screen texture handling. |
| `src/components/product-film-act.tsx` | Sticky section, captions, WebGL/reduced-motion routing, and screenshot fallback. |
| `src/components/product-film-fallback.tsx` | Non-WebGL/reduced-motion framed screenshot presentation. |
| `src/App.tsx` | Replace `SplitAct` and `DeviceAct` composition with `ProductFilmAct`. |
| `src/index.css` | Cool studio token system and product-film utilities. |
| `src/lib/i18n.tsx` | Add typed captions for the four product-film chapters. |
| `src/components/static-coin.tsx` | Update static coin fallback to the machined coin visual language. |
| `src/three/coin-scene.tsx`, `src/three/device-scene.tsx`, `src/three/laptop.tsx`, `src/three/phone.tsx` | Remove after the replacement is integrated and verified. |

### Task 1: Establish a test runner and the tested film-motion contract

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Create: `src/lib/product-film-motion.ts`
- Create: `src/lib/product-film-motion.test.ts`

**Interfaces:**
- Produces `ProductFilmState`, `getProductFilmState(progress, compact, reduce)`, `clampOrbit(orbit)`, and `screenCrossfade(position, count, fade)`.
- Consumed by `ProductFilmScene` in Tasks 5 and 6.

- [ ] **Step 1: Add the behavior-level failing tests**

```ts
import { describe, expect, it } from "vitest";
import {
  clampOrbit,
  getProductFilmState,
  screenCrossfade
} from "./product-film-motion";

describe("product-film motion", () => {
  it("opens coin arcs only during the share chapter", () => {
    expect(getProductFilmState(0.05, false, false).coin.open).toBe(0);
    expect(getProductFilmState(0.22, false, false).coin.open).toBeGreaterThan(0);
    expect(getProductFilmState(0.53, false, false).coin.open).toBe(0);
  });

  it("constrains drag orbit to the composed camera limits", () => {
    expect(clampOrbit({ azimuth: 1, elevation: -1 })).toEqual({
      azimuth: 10 * Math.PI / 180,
      elevation: -5 * Math.PI / 180
    });
  });

  it("makes neighboring screenshot opacities complementary", () => {
    const values = screenCrossfade(1.2, 3, 0.35);
    expect(values[1] + values[2]).toBeCloseTo(1, 5);
  });
});
```

- [ ] **Step 2: Configure and run the focused test to verify RED**

Add `"test": "vitest run"` to `package.json`, install `vitest` as a dev dependency, then run:

```bash
npm test -- src/lib/product-film-motion.test.ts
```

Expected: FAIL because `product-film-motion` cannot be resolved.

- [ ] **Step 3: Implement the smallest reusable motion API**

```ts
export type Orbit = { azimuth: number; elevation: number };

export function clampOrbit({ azimuth, elevation }: Orbit): Orbit {
  return {
    azimuth: clamp(azimuth, -10 * Math.PI / 180, 10 * Math.PI / 180),
    elevation: clamp(elevation, -5 * Math.PI / 180, 5 * Math.PI / 180)
  };
}

export function getProductFilmState(
  progress: number,
  compact: boolean,
  reduce: boolean
): ProductFilmState {
  const value = reduce ? 1 : clamp(progress);
  return {
    activeDevice: value < 0.53 ? "laptop" : value < 0.82 ? "phone" : null,
    coin: { open: smoothstep(0.1, 0.26, value) * (1 - smoothstep(0.31, 0.42, value)), settled: smoothstep(0.88, 0.98, value) },
    laptop: { open: smoothstep(0.34, 0.48, value), screen: smoothstep(0.43, 0.61, value) * 2 },
    phone: { rotation: smoothstep(0.62, 0.72, value) * Math.PI * 2, screen: smoothstep(0.69, 0.82, value) * 2 },
    camera: { x: 0, y: compact ? 0.2 : 0.35, z: 6.5 },
  };
}
```

Use `smoothstep` and `clamp` from `src/lib/animation.ts`; set reduced-motion to the settled, non-animated readable state. Do not read R3F state or browser globals in this module.

- [ ] **Step 4: Run focused tests and static checks to verify GREEN**

```bash
npm test -- src/lib/product-film-motion.test.ts
npm run typecheck
```

Expected: PASS, with no TypeScript errors.

- [ ] **Step 5: Commit the contract**

```bash
git add package.json package-lock.json src/lib/product-film-motion.ts src/lib/product-film-motion.test.ts
git commit -m "test: add product film motion contract"
```

### Task 2: Build the procedural machined coin

**Files:**
- Create: `src/three/product-film/coin.tsx`
- Modify: `src/lib/product-film-motion.test.ts`

**Interfaces:**
- Consumes `ProductFilmState["coin"]` from Task 1.
- Produces `MachinedCoin({ state, compact }: { state: CoinState; compact: boolean })`.
- Consumed by `ProductFilmScene` in Task 5.

- [ ] **Step 1: Add a failing geometry-contract test**

```ts
import { coinSegmentAngles } from "@/three/product-film/coin";

it("partitions a complete coin into four non-overlapping arcs", () => {
  const arcs = coinSegmentAngles([0.4, 0.25, 0.2, 0.15]);
  expect(arcs).toHaveLength(4);
  expect(arcs[0].start).toBeCloseTo(0);
  expect(arcs.at(-1)?.end).toBeCloseTo(Math.PI * 2);
});
```

- [ ] **Step 2: Run the focused test to verify RED**

```bash
npm test -- src/lib/product-film-motion.test.ts
```

Expected: FAIL because `coinSegmentAngles` is not exported.

- [ ] **Step 3: Implement coin geometry and transforms**

Create four bevelled `ExtrudeGeometry` wedge segments with a shared alloy `MeshPhysicalMaterial`. Add a low-segment lathed outer shell, instanced radial grooves, a recessed centre disc, and an emissive emerald inlay whose opacity comes from `state.settled`. Export `coinSegmentAngles(shares)` as the pure helper used by the test. Position each wedge outward on its segment bisector by `state.open`; keep segment rotations small and deterministic.

- [ ] **Step 4: Run focused tests and the build to verify GREEN**

```bash
npm test -- src/lib/product-film-motion.test.ts
npm run build
```

Expected: PASS; the build does not import old coin-scene code.

- [ ] **Step 5: Commit the coin model**

```bash
git add src/three/product-film/coin.tsx src/lib/product-film-motion.test.ts
git commit -m "feat(3d): add machined split coin"
```

### Task 3: Build procedural premium laptop and phone models

**Files:**
- Create: `src/three/product-film/laptop.tsx`
- Create: `src/three/product-film/phone.tsx`
- Modify: `src/lib/product-film-motion.test.ts`

**Interfaces:**
- Consumes texture arrays and per-screen `MeshBasicMaterial` refs.
- Produces `StudioLaptop({ state, textures, materialsRef, compact })` and `StudioPhone({ state, textures, materialsRef, compact })`.
- Consumed by `ProductFilmScene` in Task 5.

- [ ] **Step 1: Add failing contracts for display opacity calculation**

```ts
import { applyScreenOpacities } from "@/three/product-film/laptop";

it("writes no opacity outside the zero-to-one range", () => {
  const target = [{ opacity: 0 }, { opacity: 0 }];
  applyScreenOpacities(target, [1.2, -0.2]);
  expect(target).toEqual([{ opacity: 1 }, { opacity: 0 }]);
});
```

- [ ] **Step 2: Run the focused test to verify RED**

```bash
npm test -- src/lib/product-film-motion.test.ts
```

Expected: FAIL because `applyScreenOpacities` is not exported.

- [ ] **Step 3: Implement the laptop**

Use `RoundedBox`, plain `boxGeometry`, and low-poly cylinders to compose base, lid, hinge barrels, keyboard field, trackpad recess, bezel, display glass, and contact shadow. Put the lid in a group whose origin is its hinge and drive its rotation solely from `state.laptop.open`. Create one slightly staggered rounded screen plane per desktop screenshot, then use exported `applyScreenOpacities` to set clamped crossfade opacity.

- [ ] **Step 4: Implement the phone**

Compose a rounded aluminium body, inset glass, side buttons, ceramic camera island, three lens rings, and display planes for mobile screenshots. Keep the authored back on negative Z and rotate the group according to `state.phone.rotation`, so its single story turn shows the camera island. Apply screen opacity only while front-facing according to the state supplied by Task 1.

- [ ] **Step 5: Run tests and build to verify GREEN**

```bash
npm test -- src/lib/product-film-motion.test.ts
npm run build
```

Expected: PASS, no external glTF loader imports in either new model.

- [ ] **Step 6: Commit the device models**

```bash
git add src/three/product-film/laptop.tsx src/three/product-film/phone.tsx src/lib/product-film-motion.test.ts
git commit -m "feat(3d): add procedural studio devices"
```

### Task 4: Build the cool studio environment

**Files:**
- Create: `src/three/product-film/studio.tsx`
- Modify: `src/index.css`

**Interfaces:**
- Produces `StudioEnvironment({ settled }: { settled: number })`.
- Consumed by `ProductFilmScene` in Task 5.

- [ ] **Step 1: Add a failing token assertion to the motion test**

```ts
import { STUDIO_PALETTE } from "@/three/product-film/studio";

it("uses the prescribed studio palette", () => {
  expect(STUDIO_PALETTE.settleGreen).toBe("#72e1b1");
  expect(STUDIO_PALETTE.studioBlack).toBe("#080b10");
});
```

- [ ] **Step 2: Run the focused test to verify RED**

```bash
npm test -- src/lib/product-film-motion.test.ts
```

Expected: FAIL because `studio` is not available.

- [ ] **Step 3: Implement the environment and CSS tokens**

Export the palette constant. Add a large matte floor plane, a blurred contact-shadow plane, a cool-white key light, cobalt rim light, and restrained green fill that increases only with `settled`. Update root CSS tokens from warm brown to the documented studio palette; revise `grid-backdrop`, `stage-vignette`, and `card-surface` so surrounding content feels consistent without copying the hero's lighting effects.

- [ ] **Step 4: Run tests and build to verify GREEN**

```bash
npm test -- src/lib/product-film-motion.test.ts
npm run build
```

Expected: PASS and production CSS compiles.

- [ ] **Step 5: Commit the studio foundation**

```bash
git add src/three/product-film/studio.tsx src/index.css src/lib/product-film-motion.test.ts
git commit -m "style: add cool studio visual system"
```

### Task 5: Compose the one-canvas product film and constrained orbit

**Files:**
- Create: `src/three/product-film/scene.tsx`
- Modify: `src/lib/product-film-motion.test.ts`

**Interfaces:**
- Consumes `ScrollProgress`, `getProductFilmState`, `MachinedCoin`, `StudioLaptop`, `StudioPhone`, and `StudioEnvironment`.
- Produces default `ProductFilmCanvas({ progress, compact, reduce })`.
- Consumed by `ProductFilmAct` in Task 6.

- [ ] **Step 1: Add a failing chapter-state test**

```ts
it("moves focus from laptop to phone after the product handoff", () => {
  const laptop = getProductFilmState(0.45, false, false);
  const phone = getProductFilmState(0.7, false, false);
  expect(laptop.activeDevice).toBe("laptop");
  expect(phone.activeDevice).toBe("phone");
});
```

- [ ] **Step 2: Run the focused test to verify RED**

```bash
npm test -- src/lib/product-film-motion.test.ts
```

Expected: FAIL until `activeDevice` is encoded in the state returned by Task 1.

- [ ] **Step 3: Complete state mapping, then implement scene composition**

Add the missing deterministic state property. In the scene, load existing desktop/mobile screenshots with `useScreenTextures`, update screen material refs inside `useFrame`, and read a single `getProductFilmState(progress.current, compact, reduce)` per frame. Use that state for a fixed camera rail and visibility/transforms of coin/laptop/phone. Set Canvas DPR to `[1, 1.5]` on desktop and `[1, 1.25]` on compact, use `ContextReleaser`, and preserve `PerformanceMonitor` decline handling.

Add pointer handlers on the canvas wrapper: store drag start/ref orbit, calculate angle deltas from width/height, run through `clampOrbit`, and interpolate orbit to zero after release. Ignore interactions for `reduce` and any event whose target is a link/button. Do not use `OrbitControls` because it would compete with the scroll camera.

- [ ] **Step 4: Run tests, typecheck, and build to verify GREEN**

```bash
npm test -- src/lib/product-film-motion.test.ts
npm run typecheck
npm run build
```

Expected: PASS; exactly one Canvas component appears in the product-film scene.

- [ ] **Step 5: Commit the scene**

```bash
git add src/three/product-film/scene.tsx src/lib/product-film-motion.ts src/lib/product-film-motion.test.ts
git commit -m "feat(3d): compose interactive product film"
```

### Task 6: Integrate the responsive section, captions, and fallback

**Files:**
- Create: `src/components/product-film-act.tsx`
- Create: `src/components/product-film-fallback.tsx`
- Modify: `src/lib/i18n.tsx`
- Modify: `src/App.tsx`
- Modify: `src/components/static-coin.tsx`

**Interfaces:**
- Consumes `ProductFilmCanvas` from Task 5 and existing `useScrollProgress`, `useInRange`, `useMediaQuery`, `supportsWebGL`, `useMotion`, and i18n APIs.
- Produces page-level `ProductFilmAct`.

- [ ] **Step 1: Add a failing content-state test**

```ts
import { productFilmCaptionKey } from "@/lib/product-film-motion";

it("selects a caption for every film chapter", () => {
  expect(productFilmCaptionKey(0.1)).toBe("film.share");
  expect(productFilmCaptionKey(0.4)).toBe("film.laptop");
  expect(productFilmCaptionKey(0.7)).toBe("film.phone");
  expect(productFilmCaptionKey(0.95)).toBe("film.settle");
});
```

- [ ] **Step 2: Run the focused test to verify RED**

```bash
npm test -- src/lib/product-film-motion.test.ts
```

Expected: FAIL because `productFilmCaptionKey` does not yet exist.

- [ ] **Step 3: Add typed captions and finish the section**

Add `film.share`, `film.laptop`, `film.phone`, and `film.settle` strings to both language dictionaries. Export `productFilmCaptionKey` from the pure motion module and map its result to four absolutely stacked captions, updating their opacity directly in the existing scroll callback. Set the section to `h-[420vh]` on desktop and `h-[320vh]` on mobile.

Lazy-load `ProductFilmCanvas`. Mount it only while its section is in range and WebGL is supported; otherwise render `ProductFilmFallback`, which cycles no images automatically and shows a labelled desktop or mobile screenshot plus static coin treatment. With reduced motion, set progress to the settlement state and render the readable final caption without scroll-driven transforms. Replace `<SplitAct />` and `<DeviceAct />` in `App.tsx` with one `<ProductFilmAct />`.

- [ ] **Step 4: Run tests and production checks to verify GREEN**

```bash
npm test -- src/lib/product-film-motion.test.ts
npm run typecheck
npm run build
```

Expected: PASS; no WebGL capability still produces headings, captions, and calls-to-action.

- [ ] **Step 5: Commit the integrated act**

```bash
git add src/components/product-film-act.tsx src/components/product-film-fallback.tsx src/lib/i18n.tsx src/App.tsx src/components/static-coin.tsx src/lib/product-film-motion.ts src/lib/product-film-motion.test.ts
git commit -m "feat: replace 3d acts with product film"
```

### Task 7: Retire old scenes and perform visual verification

**Files:**
- Delete: `src/components/split-act.tsx`
- Delete: `src/components/device-act.tsx`
- Delete: `src/three/coin-scene.tsx`
- Delete: `src/three/device-scene.tsx`
- Delete: `src/three/laptop.tsx`
- Delete: `src/three/phone.tsx`
- Modify: `ARCHITECTURE.md`

**Interfaces:**
- Consumes the fully integrated `ProductFilmAct` from Task 6.
- Produces one documented current 3D architecture with no unused imported-model pipeline.

- [ ] **Step 1: Verify no current import depends on the legacy modules**

```bash
rg -n "split-act|device-act|coin-scene|device-scene|three/laptop|three/phone" src
```

Expected: only the legacy files themselves or no matches; resolve every active import before deletion.

- [ ] **Step 2: Delete retired implementations and revise documentation**

Remove the six legacy files only after the import check is clear. Update `ARCHITECTURE.md` to describe `ProductFilmAct`, the one-canvas sequence, procedural models, orbit limits, product-film progress ranges, and static/reduced-motion behavior. Remove glTF model credit documentation because no external device models remain.

- [ ] **Step 3: Run the complete automated gate**

```bash
npm test
npm run typecheck
npm run build
```

Expected: PASS with no obsolete module resolution errors.

- [ ] **Step 4: Run visual and accessibility checks**

Start the app with `npm run dev`, then verify at 1440x900 and 390x844:

1. scroll positions 0%, 25%, 50%, 75%, and 100% keep the intended object/caption readable;
2. laptop hinge, phone back reveal, screen crossfades, and coin settlement do not clip;
3. dragging each device stays within its small orbit and returns on release;
4. reduced-motion shows a stable scene and caption;
5. WebGL-disabled mode shows a labelled fallback with CTA content;
6. browser console is clean and only one WebGL context is active.

- [ ] **Step 5: Commit the finished cleanup**

```bash
git add ARCHITECTURE.md src
git commit -m "refactor(3d): retire legacy product scenes"
```

## Self-review

**Spec coverage:** Tasks 2–5 cover custom premium materials, new coin/laptop/phone models, the guided scroll rail, constrained interaction, one Canvas, and performance limits. Task 6 covers captions, translation, responsive behavior, reduced-motion, and no-WebGL fallback. Task 7 validates and documents the finished system. No spec requirements are omitted.

**Placeholder scan:** No deferred work markers or generic test directions remain; every task supplies a concrete behavior, command, or implementation detail.

**Type consistency:** `ProductFilmState`, `CoinState`, `Orbit`, `getProductFilmState`, `screenCrossfade`, `clampOrbit`, `MachinedCoin`, `StudioLaptop`, `StudioPhone`, `StudioEnvironment`, and `ProductFilmCanvas` are defined before their consuming tasks.
