# Architecture

The marketing site is a single static SPA. No server, no API calls at runtime except
the links in the nav and footer. Its job is to explain the expense-splitting app and
close with a scroll-driven product film built from procedural 3D models.

| Layer | Choice |
| --- | --- |
| Build | Vite 8, TypeScript 7, React 19.2 |
| Styling | Tailwind v4, CSS-first config, no `tailwind.config` |
| 3D | three 0.186, `@react-three/fiber` 9, `@react-three/drei` 10 |
| Motion | anime.js 4.5 for scroll and reveals, `motion/react` is not used here |
| Icons and fonts | lucide-react, self-hosted Gabarito, Karla, DM Mono via fontsource |

```bash
npm run dev        # Vite dev server, proxies nothing, purely static
npm test           # vitest run: the product-film motion math
npm run typecheck  # tsc --noEmit
npm run build      # typecheck then vite build
npm run preview    # serve dist locally
```

There is no lint step. `npm test`, `npm run typecheck`, and `npm run build` are the
gates, and film changes were verified with structural Playwright passes (see
Verification).

## File map

| Path | Role |
| --- | --- |
| `src/App.tsx` | Page composition and the global scroll progress bar |
| `src/components/product-film-act.tsx` | The film act: hero, captions, canvas gating, error boundary |
| `src/components/product-film-fallback.tsx` | Labelled screenshot figure plus `StaticCoin` |
| `src/components/mechanics.tsx` | The split-types section |
| `src/components/*-section.tsx` | The remaining page acts |
| `src/components/nav.tsx`, `footer.tsx` | Chrome, language toggle, GitHub link |
| `src/components/static-coin.tsx` | SVG coin used when WebGL is unavailable |
| `src/lib/animation.ts` | anime.js wrappers: `useScrollProgress`, `useGlobalScrollProgress`, `useReveal`, `clamp`, `smoothstep` |
| `src/lib/motion.tsx` | Motion provider: system preference plus a persisted on/off override |
| `src/lib/product-film-motion.ts` | Pure progress-to-state math: chapters, captions, orbit clamp, screen crossfade |
| `src/lib/product-film-motion.test.ts` | Vitest coverage for that math |
| `src/lib/use-media.ts` | `useInRange`, `useMediaQuery`, `supportsWebGL` |
| `src/lib/i18n.tsx` | pt-PT and en dictionaries, provider, `useI18n` |
| `src/lib/site.ts` | `GITHUB_URL`, `DEMO_URL` |
| `src/three/product-film/scene.tsx` | The one `<Canvas>`: camera rail, drag orbit, model assembly |
| `src/three/product-film/coin.tsx` | `MachinedCoin`, all procedural |
| `src/three/product-film/laptop.tsx` | `StudioLaptop` plus shared rounded-geometry helpers |
| `src/three/product-film/phone.tsx` | `StudioPhone` |
| `src/three/product-film/studio.tsx` | Studio floor, fog, lights, procedural environment map |
| `src/three/textures.ts` | Screenshot loader and procedural gradient textures |
| `src/three/context-releaser.tsx` | Disposes the renderer when the canvas unmounts; R3F releases the WebGL context itself |
| `src/assets/screens/` | App screenshots: desktop dashboard, group and expenses; mobile dashboard, group and expenses |

## Page composition

`App.tsx` renders a fixed 2px progress bar driven by `useGlobalScrollProgress`, then
the nav, five sections, and the footer. Section order and heights:

| Section | Height | Content |
| --- | --- | --- |
| `ProductFilmAct` | 420vh wide, 320vh compact | Hero copy, film canvas, caption band |
| `Mechanics` | auto | How the four split types work |
| `SettleSection` | auto | Settlement explanation, coin slices |
| `TechSection` | auto | Stack and repository facts |
| `RunSection` | auto | `docker compose` copy-paste block |

The film act is tall so its sticky stage stays pinned for the whole timeline; the
remaining sections size to their content.

## The scroll model

The film is a tall `<section>` with a `sticky top-0 h-svh` stage inside. Scrolling
through the tall section pins the stage and moves its internal timeline from 0 to 1.

`useScrollProgress(section, callback)` wraps anime.js:

```ts
animate(progress, {
  current: 1,
  ease: "linear",
  autoplay: onScroll({ target: element, enter: "top top", leave: "bottom bottom", sync: true })
});
```

The hook returns a ref object (`{ current: number }`). The callback writes DOM styles
directly (`element.style.opacity`, `transform`) and the r3f scene reads
`progress.current` inside `useFrame`. Nothing about the scroll touches React state, so
scrolling never re-renders the tree.

`useReveal(ref, delay)` handles one-shot entrances: it sets the element to
`opacity: 0, y: 16`, watches it with an `IntersectionObserver`, and animates it in once.
It returns early when `prefers-reduced-motion: reduce` matches, which leaves the
element at its natural position.

`clamp` and `smoothstep` map scroll values to phases. A typical act uses a handful of
these, for example `const entrance = smoothstep(0.05, 0.26, value)`.

## One WebGL context at a time

The page renders a single `<Canvas>`, gated by `showCanvas = webgl && near`:

- `supportsWebGL()` probes once and the result is cached at module scope; when it is
  false the film renders `ProductFilmFallback` instead of a canvas.
- `useInRange(section, 1.1, 0)` mounts the canvas just before the section enters the
  viewport and unmounts it as soon as the section leaves, so scrolling past the film
  releases its context.
- `ContextReleaser` sits inside the canvas and calls `gl.dispose()` on unmount; R3F's
  own unmount path then forces context loss (`forceContextLoss` on a 500 ms timeout),
  so the next mount starts with a clean driver state. The app does not force loss
  itself, which avoids a duplicate `loseContext` call on an already-lost context.
- `FilmCanvasBoundary` catches render errors, logs them, and swaps in the same
  fallback; `Suspense` covers the lazy canvas chunk with it too.
- `DprGuard` uses drei's `PerformanceMonitor`: pixel ratio drops to 1 on decline and
  is capped at 1.5 (1.25 compact) on incline.

`useMediaQuery("(min-width: 900px)")` decides between the wide layout and the compact
one. The fallback mounts whenever `showCanvas` is false — no WebGL, a canvas error, or
the section simply out of range — as the wide figure at 900px and above, or the
compact figure in the stage area below it.

## The product film

`src/components/product-film-act.tsx` owns the section: a sticky `h-svh` stage with
the hero copy at the top, the canvas behind it, and a caption band at the bottom. The
hero fades and lifts out through `smoothstep(0.1, 0.24, progress)`.

`product-film-motion.ts` is the pure math layer. `getProductFilmState(progress,
compact, reduce)` returns the entire film state and pins the value to 1 when `reduce`
is true.

| Progress | Chapter | What moves |
| --- | --- | --- |
| 0.00–0.34 | `film.share` | Coin wedges open 0.10–0.26, close 0.31–0.42 |
| 0.34–0.62 | `film.laptop` | Lid opens 0.34–0.48, screens crossfade 0.43–0.61 |
| 0.62–0.90 | `film.phone` | 2π rotation 0.62–0.72, screens 0.69–0.82, phone rises |
| 0.88–1.00 | `film.settle` | Coin settles 0.88–0.98, inlay lights, devices exit |

- `activeDevice` is `laptop` below 0.53, `phone` below 0.82, then `null`.
- Caption edges live in `PRODUCT_FILM_CAPTION_EDGES` (`0.34 / 0.62 / 0.9`) with a
  0.05 smoothstep fade. `productFilmCaptionKey` picks the active one; inactive
  captions carry `aria-hidden="true"`.
- Camera focus and push are computed each frame from the state and scaled by
  `railScale` (0.3 compact): `push = share*0.3 + plan*0.5 + screens*0.25 - settle*0.75`;
  focus height is 0.85 wide / 0.42 compact. `camera.z` stays 6.5 and the push moves
  the camera toward the focus.
- `screenCrossfade(position, count, fade)` returns complementary opacities: the two
  neighbouring screens always sum to 1 and the rest are 0, so transitions show no
  black gap and no double exposure.

### Procedural models

Nothing loads a model file. Every mesh is built at runtime:

- `product-film/coin.tsx` — lathe-turned shell with a rim recess, two grooves and a
  central well, four extruded wedges weighted `[0.4, 0.25, 0.2, 0.15]` that tilt and
  slide apart with `coin.open`, 90 instanced ticks (54 compact), a dark ring filling
  the wedge void, and an emissive green torus inlay, core disc, and point light driven
  by `coin.settled`.
- `product-film/laptop.tsx` — RoundedBox base, extruded rounded keyboard slab with
  instanced keys (14×5; 10×4 compact), trackpad, three hinge barrels, and a lid group
  rotating `open * 1.8 rad`; three screen planes crossfade with `SCREEN_FADE = 0.5`,
  covered by glass and an additive reflection; a contact-shadow plane grounds it. The
  file also exports the shared rounded-slab/ring/screen geometry helpers used by the
  phone.
- `product-film/phone.tsx` — rounded-ring body, front and back glass panels, three
  screens crossfading with `SCREEN_FADE = 0.7`, a ceramic camera island with three
  lenses and a flash, and side buttons.
- `product-film/studio.tsx` — 64-unit floor plane, `Fog(studioBlack, 9, 30)`, a
  gradient equirectangular environment canvas (three light blobs), key and cobalt rim
  lights, a green point fill driven by `settled`, and a contact shadow. No HDR files.

`scene.tsx` loads the three desktop screenshots for the laptop and three mobile ones
for the phone through `useScreenTextures`. Because `ShapeGeometry` emits UVs in local
shape units, `mapScreenUvs` folds the screen bounds into each texture's
`repeat`/`offset` before the fit stretches.

Compact builds cut curve segments and instancing counts, scale the stage to 0.46, and
gate devices by chapter, so the same composition fits a phone without a second scene.

### Pointer interaction

Dragging on the canvas wrapper (primary button, not started on a link or button)
orbits the camera around its focus. `clampOrbit` holds the orbit to ±10° azimuth and
±5° elevation; on release the orbit eases back to zero at 6/s with a 0.0001 dead zone,
so the original composure always returns. The wrapper is `touch-pan-y`, and under
reduced motion the handlers return early. Scroll and drag both write refs that
`useFrame` reads, so neither re-renders React.

### Reduced motion and the static fallback

`useMotion` exposes the effective motion flag: the system preference unless the user
overrides it, persisted in `localStorage` under `expense-splitting-motion`.

Under `prefers-reduced-motion: reduce` the scroll hook is disabled, `progress.current`
is pinned to 1, the hero stays in place, and the final `film.settle` caption is set to
`opacity: 1` while the others stay hidden. The canvas still mounts when WebGL and range
allow, rendering the settled film state from `getProductFilmState(..., reduce=true)`.

Without WebGL, `ProductFilmFallback` shows a labelled `figure`: the `figcaption` is
the matching film chapter line (`film.laptop` wide, `film.phone` compact), the app
screenshot sits in a framed card, `StaticCoin` stands beside it, and the hero copy and
CTAs stay visible. The same fallback covers a canvas that throws or fails to load, and
it also mounts on wide viewports whenever the canvas is out of range.

## Copy and language

`lib/i18n.tsx` keeps pt-PT as the source dictionary. The English dictionary is typed
`Record<keyof typeof pt, string>`, so a missing English string fails `npm run
typecheck` instead of rendering a raw key. The provider sets
`document.documentElement.lang`, persists the choice in `localStorage` under
`expense-splitting-locale`, and falls back to `navigator.language` when nothing is
stored. `t("key")` supports `{name}` interpolation.

## Styling

Tailwind v4 reads its configuration from CSS. `src/index.css` declares the palette as
CSS variables on `:root`, exposes them to utilities in `@theme inline` (`--color-pine`
becomes `bg-pine`, `text-pine`, and so on), and defines three custom utilities:
`money` for tabular monospace numerals, `stage-vignette` for the stage edge falloff,
and `card-surface` for glass cards. The hero glow is an inline radial gradient in
`product-film-act.tsx`.

| Token | Value | Use |
| --- | --- | --- |
| `--canvas` | `#080b10` | Page and studio background |
| `--surface`, `--surface-strong` | `#151a22`, `#1e2530` | Cards and code blocks |
| `--ink`, `--muted` | `#f2f5f7`, `#8f9aa8` | Text |
| `--pine` | `#72e1b1` | Primary accent, progress bar, coin inlay |
| `--apricot` | `#8dbfff` | Secondary accent, film reflections |
| `--teal`, `--plum`, `--brick`, `--butter` | `#5fb8c9`, `#9b8cf2`, `#d98f9f`, `#d6c98a` | Reserved accent slots, retained in CSS but unreferenced by current components |
| `--line` | 12% ink | Hairlines and borders |

Display type is Gabarito, body copy is Karla, numerals are DM Mono. All three are
self-hosted, so the page needs no external font requests.

## Verification

`npm test` (Vitest: chapters, orbit clamp, crossfade sums, coin arcs), `npm run
typecheck`, and `npm run build` are the standing gates. For 3D work the process is a
structural Playwright pass against the dev server: step the page through scroll
fractions at 1440x900 and 390x844, assert zero console and page errors, assert exactly
one canvas while the film is in view and zero after scrolling past it, then repeat
with `reduced_motion="reduce"` and with `--disable-webgl --disable-webgl2`. The
scripts live outside the repository, so a fresh clone has the process but not the
harness.

## Configuration and deployment

`src/lib/site.ts` holds the two external links. While `DEMO_URL` is empty, the hero
renders a disabled "coming soon" button instead of a link. `vite.config.ts` maps `@`
to `src`. The build output in `dist` is static and can go on any host. The site is not
wired into the app's Compose stack or CI.
