# Architecture

The marketing site is a single static SPA. No server, no API calls at runtime except
the links in the nav and footer. Its job is to explain the expense-splitting app and
show it running on real hardware, with scroll as the timeline.

| Layer | Choice |
| --- | --- |
| Build | Vite 8, TypeScript 7, React 19.2 |
| Styling | Tailwind v4, CSS-first config, no `tailwind.config` |
| 3D | three 0.186, `@react-three/fiber` 9, `@react-three/drei` 10 |
| Motion | anime.js 4.5 for scroll and reveals, `motion/react` is not used here |
| Icons and fonts | lucide-react, self-hosted Gabarito, Karla, DM Mono via fontsource |

```bash
npm run dev        # Vite dev server, proxies nothing, purely static
npm run typecheck  # tsc --noEmit
npm run build      # typecheck then vite build
npm run preview    # serve dist locally
```

There is no test runner and no lint step. Typecheck and build are the gates, and 3D
changes were verified with Playwright screenshot passes (see Verification).

## File map

| Path | Role |
| --- | --- |
| `src/App.tsx` | Page composition and the global scroll progress bar |
| `src/components/*-act.tsx`, `*-section.tsx` | One component per page act |
| `src/components/nav.tsx`, `footer.tsx` | Chrome, language toggle, GitHub link |
| `src/components/static-coin.tsx` | SVG coin used when WebGL is unavailable |
| `src/lib/animation.ts` | anime.js wrappers: `useScrollProgress`, `useGlobalScrollProgress`, `useReveal`, `clamp`, `smoothstep` |
| `src/lib/use-media.ts` | `useInRange`, `useMediaQuery`, `supportsWebGL` |
| `src/lib/i18n.tsx` | pt-PT and en dictionaries, provider, `useI18n` |
| `src/lib/site.ts` | `GITHUB_URL`, `DEMO_URL` |
| `src/three/coin-scene.tsx` | The coin act canvas |
| `src/three/device-scene.tsx` | The device act canvas |
| `src/three/models.tsx` | glTF loading, normalization, screen planes, crossfade helper |
| `src/three/phone.tsx` | `PhoneModel` wrapper and the phone screen texture options |
| `src/three/textures.ts` | Screenshot loader, crop fitting, procedural gradient textures |
| `src/three/environment.tsx` | Procedural environment map, no HDR files |
| `src/three/context-releaser.tsx` | Forces WebGL context loss when a canvas unmounts |
| `src/assets/screens/` | App screenshots: four desktop, three mobile |
| `public/models/` | `macbook.glb`, `iphone.glb` |

## Page composition

`App.tsx` renders a fixed 2px progress bar driven by `useGlobalScrollProgress`, then
the nav, six sections, and the footer. Section order and heights:

| Section | Height | Content |
| --- | --- | --- |
| `SplitAct` | 250vh | Hero copy, coin canvas, iris split stage |
| `Mechanics` | auto | How the four split types work |
| `DeviceAct` | 220vh | MacBook and iPhone canvas, captions |
| `SettleSection` | auto | Settlement explanation, coin slices |
| `TechSection` | auto | Stack and repository facts |
| `RunSection` | auto | `docker compose` copy-paste block |

Scroll-driven acts use 220vh to 250vh so the sticky stage stays pinned long enough for
the timeline; the remaining sections size to their content.

## The scroll model

Every act is a tall `<section>` with a `sticky top-0 h-svh` stage inside. Scrolling
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
directly (`element.style.opacity`, `transform`) and the r3f scenes read
`progress.current` inside `useFrame`. Nothing about the scroll touches React state, so
scrolling never re-renders the tree.

`useReveal(ref, delay)` handles one-shot entrances: it sets the element to
`opacity: 0, y: 16`, watches it with an `IntersectionObserver`, and animates it in once.
It returns early when `prefers-reduced-motion: reduce` matches, which leaves the
element at its natural position.

`clamp` and `smoothstep` map scroll values to phases. A typical act uses a handful of
these, for example `const entrance = smoothstep(0.05, 0.26, value)`.

## One WebGL context at a time

Two canvases on the page would double GPU memory and, on weak hardware, lose the
context. The site keeps at most one alive:

- `useInRange(ref, before, after)` measures the section against the viewport on every
  scroll frame (rAF-throttled) and flips a boolean. `before` is a multiplier of the
  viewport height for `rect.top`, `after` for `rect.bottom`.
- The coin canvas mounts with `useInRange(section, 1.1, 0)`. It stays until its
  section leaves the viewport, so the coin never vanishes while its sticky frame is
  visible.
- The device canvas mounts with `useInRange(section, -0.12, -0.3)`, which is 12% of a
  viewport after the section pins. The coin canvas has already unmounted by then, so
  the two contexts never coexist.
- `ContextReleaser` sits inside each canvas and calls `gl.dispose()` plus
  `forceContextLoss()` on unmount, so the next context starts with a clean driver
  state instead of waiting on garbage collection.

Gating: `supportsWebGL()` is checked once per act, and `useMediaQuery("(min-width:
900px)")` decides between the wide layout and the compact one. Narrow viewports get a
smaller coin, no device canvas, and no scroll hint. Without WebGL, `SplitAct` renders
`StaticCoin` and `DeviceAct` renders a framed screenshot of the desktop app.

## The coin act

`src/three/coin-scene.tsx` builds the coin without any model file: a cylinder body
with 156 instanced ridges, an embossed ring, and five iris slices that rotate open as
the section scrolls. Each slice carries a tint and an amount label drawn through
drei's `Html`. The hero phone sits to the left on wide screens, positioned by
`offsetX`, `offsetY`, and `scale` props. The camera, slice angles, and label opacities
are all functions of `progress.current`.

## The device act

`src/three/device-scene.tsx` renders the MacBook and the iPhone, both from glTF files
in `public/models`.

### Models and screen planes

`models.tsx` loads a model with `useGLTF`, clones it, and normalizes it: the screen
mesh's bounding box drives a scale so the display is 2.3 units wide, and the model is
offset so the screen centre sits at the group origin. `prepareShared` runs once per
URL: it drops meshes smaller than 18% of the model's longest dimension and caps
textures at 256px, which keeps the iPhone's 34 embedded maps and 64k triangles inside
a software renderer's budget.

`ScreenPlanes` then attaches the app screenshots to the model:

1. Read the display mesh's geometry bounding box.
2. Find the thin axis (the display's normal).
3. Create one plane per screenshot at the surface, with a 0.002 unit stagger and
   `renderOrder` so draw order is deterministic.
4. Register each plane's material in the caller's `materialsRef` so the scene can
   drive opacity per frame.
5. Optionally add a sheen plane with additive blending for glass.

Opacity uses `screenOpacity(delta, fade) = clamp((1 - |delta|) / fade)`. Neighbouring
screens use complementary deltas, so their opacities sum to 1: a crossfade with no
black gap and no double exposure. The MacBook uses `fade = 0.35` across its four
screenshots; the phone uses `fade = 0.15` across three.

### MacBook

The lid node is re-parented into a hinge `Group` at the model's hinge line, and the
scene rotates that group with `(1 - open) * (Math.PI / 2)`, so the lid opens around
the hinge instead of the model origin. The frame materials are tinted aluminium and
the environment is dimmed on those materials to keep the low-poly body reading as
metal rather than champagne.

### iPhone

`PhoneModel` wraps `IphoneModel`, whose front faces `-Z` in model space, so the
wrapper rotates it 180 degrees and normalizes the screen to 0.7 units. The scene
drives three kinds of motion:

- A full 360 degree flip while the phone falls, and another when the scroll reaches
  the close-up, so the camera island on the back is visible on the way in.
- A slow turntable flip each 5.5s cycle, phase-shifted so the screen swap happens
  while the phone faces away. During the close-up the turntable is suppressed.
- The close-up itself: the phone travels from the desk toward the camera until it
  fills about 80% of the viewport height, then returns.

The camera is set directly each frame from `progress.current`: distance eases from 6.5
to 2.1 for the laptop zoom and back out to 5.3, with a small orbit at the start and
pointer parallax throughout.

### Textures and environment

`textures.ts` loads the screenshots with `TextureLoader`, optionally draws them onto a
canvas to mask rounded corners and punch a camera hole (used for the phone), and
provides `createRadialTexture` and `createLinearTexture` for shadows and sheen.
`environment.tsx` paints a 128x64 gradient canvas with three light blobs and assigns
it as `scene.environment` with equirectangular mapping, so the models get reflections
without shipping an HDR file. Section screenshots in `src/assets/screens/` were
captured from the running app at `localhost:8080`.

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
becomes `bg-pine`, `text-pine`, and so on), and defines two custom utilities:
`grid-backdrop` for the hero grid, `money` for tabular monospace numerals.

| Token | Value | Use |
| --- | --- | --- |
| `--canvas` | `#120f0d` | Page background |
| `--surface`, `--surface-strong` | `#1b1512`, `#241c16` | Cards and code blocks |
| `--ink`, `--muted` | `#f0eae2`, `#a79c90` | Text |
| `--pine` | `#6fbfaa` | Primary accent, progress bar |
| `--apricot` | `#ff9e72` | Secondary accent |
| `--teal`, `--plum`, `--brick`, `--butter` | `#4fbfae`, `#a78bfa`, `#e58270`, `#e9c46a` | Coin slice tints |
| `--line` | 12% ink | Hairlines and borders |

Display type is Gabarito, body copy is Karla, numerals are DM Mono. All three are
self-hosted, so the page needs no external font requests.

## Verification

`npm run typecheck` and `npm run build` are the standing checks. For 3D work the
process was: build, run `vite preview`, drive the page with Playwright at fixed scroll
fractions, and read the screenshots. Every pass also recorded console errors at
1440x900, 390x844, with `prefers-reduced-motion: reduce`, and with WebGL disabled. The
Playwright scripts live outside the repository, so a fresh clone has the manual
process but not the harness.

## Configuration and deployment

`src/lib/site.ts` holds the two external links. While `DEMO_URL` is empty, the hero
renders a disabled "coming soon" button instead of a link. `vite.config.ts` maps `@`
to `src` and excludes `public/models` from the file watcher, because Vite's watcher
crashes on Windows when a large binary is locked mid-write. The build output in `dist`
is static and can go on any host. The site is not wired into the app's Compose stack
or CI.

## Model credits

Both device models require attribution under CC BY, and the footer carries the credit:

- MacBook: "Laptop / MacBook Pro" by Alex Safayan, via poly.pizza, CC BY.
- iPhone: "Apple iPhone 15 Pro Max Black" by polyman, via Sketchfab, CC BY 4.0.
