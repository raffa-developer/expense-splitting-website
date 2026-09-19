# Cinematic remake: 3D models and animations

Date: 2026-09-18
Status: approved in brainstorm, awaiting spec review

## Goal

Rebuild the site's 3D scenes and all scroll animations so the page feels premium
and never janky: Apple-style cinematic motion, warm dark palette kept, full 3D on
mobile, same section flow and narrative.

## Decisions from the brainstorm

- Approach A: R3F renders the 3D, anime.js drives DOM reveals and per-section
  scroll progress, Lenis smooths the scroll.
- Coin stays the hero object. The narrative stays: hero, iris split, mechanics,
  devices, settle, tech, run.
- Warm dark palette kept; shadows deepen, highlights cool slightly.
- Whole page restyled, not just the two 3D acts. Section order and content stay.
- Full 3D experience on mobile as well as desktop.
- Downloaded GLBs dropped; both devices rebuilt procedurally.
- All spins and flips removed. Screen changes are dissolves.

## Non-goals

- No new sections, no copy rewrite beyond caption adjustments.
- No lazy-loading library swap, no build tooling changes.
- No server or deployment work.

## Architecture

### Lenis

Add `lenis` as a dependency. Create `src/lib/lenis.ts` with a `useLenis` hook:
one instance, one rAF loop calling `lenis.raf(time)`, mounted once in `App`.
Desktop wheel gets damping (`lerp: 0.1`, smoothed wheel multiplier 1); touch
keeps native scrolling (`smoothTouch: false`). Lenis moves the real scroll
position, so all existing listeners work unchanged: anime.js `onScroll`, the
rAF-driven `useInRange`, and the global progress bar. They receive the damped
values, which is exactly the eased feel we want.

Reduced motion disables Lenis entirely (`prefers-reduced-motion`).

### Scroll pipeline

Unchanged in shape: each act is a tall section with a sticky stage.
`useScrollProgress` maps the section to 0 to 1 through anime.js
`onScroll({ sync: true })`, calls its DOM callback, and the R3F scenes read the
same progress ref inside `useFrame`. Flow: Lenis -> real scroll -> anime progress
refs -> scenes and DOM. No React state on the scroll path, no re-renders while
scrolling.

### Canvas handoff

Keep one canvas at a time. The coin canvas unmounts when its section leaves the
viewport; the device canvas mounts after its section pins (current
`useInRange` windows stay). `ContextReleaser` keeps forcing context loss on
unmount. The mount stutter disappears because nothing loads asynchronously:
all geometry is procedural, and shaders are prewarmed at startup.

### Shader prewarm

WebGL programs are per-context, so a startup canvas cannot precompile another
canvas's shaders. The equivalent guarantee comes from the device canvas
mounting before its section pins and the laptop starting below the viewport:
the first-frame compile happens while nothing is visible.

## Performance budget

- Procedural geometry only. Coin around 4k triangles, laptop around 5k, phone
  around 6k. Merged geometries, shared materials, two lights plus one baked
  environment per canvas, one radial contact shadow per scene.
- dpr capped `[1, 2]` desktop, `[1, 1.5]` mobile. drei `PerformanceMonitor`
  drops to dpr 1 after 3 seconds below 45fps and recovers automatically.
- No drei `Html` inside canvases. Coin slice amounts become DOM elements in the
  act, animated with the captions.
- DOM: `content-visibility` on copy-heavy sections, `will-change` only on
  elements that move.
- App screenshots remain the only image assets. Screen textures load once per
  act, same as today.

## Motion design

One dominant move per scroll span, quiet holds between moves, wide easing
ranges, nothing linear except the coin's slow idle rotation.

### Coin act (250vh)

| Range | Motion |
| --- | --- |
| 0.00 to 0.12 | Hold. Coin idles on a slow rotation. Title and CTA arrive once at load, then sit still |
| 0.12 to 0.26 | Copy fades and lifts away. Camera eases back; coin settles center-stage |
| 0.26 to 0.42 | Hold. First caption rises |
| 0.42 to 0.62 | The iris split, the one magic moment. Five slices fan open around the centre, 60ms stagger each; amounts appear as a DOM legend beside the coin; second caption rises |
| 0.62 to 0.82 | Hold on the open slices |
| 0.82 to 1.0 | Exit. Stage dims and recedes slightly as the mechanics title rises |

### Device act (220vh)

| Range | Motion |
| --- | --- |
| 0.00 to 0.14 | Laptop rises into frame, lid closed |
| 0.14 to 0.34 | One lid-open motion. Keyboard glow fades in |
| 0.34 to 0.52 | Hold. First caption dissolves over the dashboard screen |
| 0.52 to 0.78 | Slow dolly into the screen. Screen changes are 1s crossfades with holds between; captions dissolve in step |
| 0.78 to 0.90 | Camera pulls back. Phone lifts off the desk beside the laptop |
| 0.90 to 1.0 | Phone takes the frame face-on and holds. Final caption. Laptop recedes and dims |

No turntable, no fall flip, no 360 reveal. Crossfade math keeps the existing
`screenOpacity` helper: `clamp((1 - |delta|) / fade)`, laptop fade 0.35, phone
fade 0.15.

### Sections and chrome

Mechanics, settle, tech, run: one fade-and-rise per block, 90ms stagger per
block, `outCubic`, through the existing `Reveal`/`useReveal`. Nav gets backdrop
blur and shrinks once the hero is left. Reduced motion renders every act at its
final state with no movement at all.

## Type and layout

- Captions become the hero type: Gabarito at `clamp(2.25rem, 5vw, 3.75rem)`,
  leading 1.05, tracking -0.02em, left rail aligned with section titles, soft
  scrim so they read over the app UI.
- Hero title `clamp(3rem, 7vw, 5rem)`, sentence case, no accent-word styling.
- Section titles statement size, same left rail.
- Stage backgrounds: vignette toward `#0a0806`, grid opacity cut to 60% of
  today's value, hero keeps the soft radial glow.
- Tokens stay the warm dark set. Shadows deepen, highlights cool slightly.

## New device models

Rebuild both devices procedurally in `src/three/laptop.tsx` and
`src/three/phone.tsx`:

- Phone: real iPhone proportions, screen aspect 0.46 (0.7 x 1.52), rounded glass
  front, punch-hole camera masked into the screen texture, side buttons,
  camera island with two lenses on the back, dark metal frame, subtle glass
  sheen plane.
- Laptop: real MacBook proportions, aluminium unibody, black keyboard well with
  keycaps, dark glass screen, hinge pivot node so the lid opens correctly,
  keyboard glow that fades with the lid.
- Both expose a `materialsRef` for their screen planes so scenes drive
  crossfades exactly as today.

## Deletions

- `public/models/macbook.glb`, `public/models/iphone.glb`.
- `src/three/models.tsx` glTF pipeline: `useGLTF` loading, cloning,
  normalization, `prepareShared`, `simplifyModel`, `limitTextureSize`,
  `ScreenPlanes` and its bounding-box attachment. The `screenOpacity` helper
  moves to `src/three/textures.ts`.
- Spin and flip code in `device-scene.tsx` and the hero phone.
- drei `Html` labels in `coin-scene.tsx`.
- Footer CC-BY credit and its i18n keys in both dictionaries.
- `public/models` watcher ignore in `vite.config.ts`.

Kept: app screenshots, `ContextReleaser`, the one-canvas handoff, the i18n
parity contract, `useInRange` and `useScrollProgress` shapes.

## Testing and rollout

- Standing gates: `npm run typecheck`, `npm run build`.
- Playwright harness re-run against `vite preview`: scroll-fraction screenshots
  at 1440x900 and 390x844, console-error pass, reduced-motion pass,
  WebGL-disabled pass.
- Frame-time sampling during a scripted scroll. Target: median at or under 17ms,
  p95 at or under 34ms on this machine's software GL. Today's baseline:
  17.5ms median, 112ms p95.
- Manual check on the user's phone before sign-off.
- Harness scripts remain throwaway unless the user wants them committed.

## Files touched

- `src/lib/lenis.ts` (new), `src/lib/animation.ts`, `src/App.tsx`,
  `src/main.tsx`
- `src/three/laptop.tsx` (new), `src/three/phone.tsx` (rewritten),
  `src/three/models.tsx` (deleted), `src/three/coin-scene.tsx`,
  `src/three/device-scene.tsx`, `src/three/textures.ts`,
  `src/three/context-releaser.tsx` (kept)
- `src/components/split-act.tsx`, `src/components/device-act.tsx`,
  `src/components/mechanics.tsx`, `src/components/settle-section.tsx`,
  `src/components/tech-section.tsx`, `src/components/run-section.tsx`,
  `src/components/nav.tsx`, `src/components/footer.tsx`
- `src/index.css`, `src/lib/i18n.tsx`, `vite.config.ts`, `package.json`
