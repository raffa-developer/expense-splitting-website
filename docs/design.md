# Expense Splitting — Marketing Site

Status: approved, in build

## Goal

A one-page immersive marketing site for the expense-splitting app. Warm
"Mesa after dark" treatment: ember canvas, pine and apricot light, the
product's split mechanic told as a 3D scroll story. pt-PT and English with
a toggle. CTAs: GitHub repo, and a demo link that stays hidden until a URL
is configured.

## Stack

Vite + React 19 + TypeScript, Tailwind v4 (CSS-variable tokens, no config),
`three` + `@react-three/fiber` + `@react-three/drei`, `motion`, `lucide-react`,
Fontsource (Gabarito, Karla, DM Mono). No router, no i18n library — the same
dictionary + context pattern as the app.

## Scroll storyboard

1. Hero — a minted brass coin (ridged edge, embossed ring and split line,
   procedural environment reflections) with a floating phone showing the
   mobile app; wordmark top bar; headline and GitHub/demo buttons.
2. The split — scroll dissolves the rim and emboss while the coin opens into
   proportional brass slices like an iris, each labelled with its amount;
   reassembles on scroll up.
3. Mechanics — four split types, fewest-transfers settle-up, exact integer
   balances, as quiet cards.
4. The app — a 3D laptop with a hinge, real screenshots as screen textures
   and a cinematic camera dolly; the lid opens and its screen cycles with
   scroll.
5. Settle up — lit arrows between person orbs, echoing the money-flow graph.
6. Under the hood — largest-remainder allocation, transactional balances,
   test count, as a technical strip.
7. Run it — README commands, GitHub button, footer.

## Tokens

| Token | Value |
|---|---|
| `--canvas` | `#120f0d` |
| `--surface` | `#1b1512` |
| `--ink` | `#f0eae2` |
| `--muted` | `#a79c90` |
| `--pine` | `#6fbfaa` |
| `--apricot` | `#ff9e72` |
| `--teal` | `#4fbfae` |
| `--plum` | `#a78bfa` |
| `--brick` | `#e58270` |
| `--line` | `rgba(240, 234, 226, 0.12)` |

Type: Gabarito (display), Karla (body), DM Mono (numbers, labels).

## 3D implementation

One procedural canvas carries the whole scroll story. The only downloaded
assets are the app screenshots; no model, HDR or environment file is fetched.
`MachinedCoin` is a lathe-turned shell with four extruded wedge segments
weighted 40/25/20/15 plus instanced groove ticks and an emissive settle inlay.
`StudioLaptop` and `StudioPhone` are built from rounded extruded slabs with the
app screenshots as crossfading screen planes, a glass cover and additive
reflections. `StudioEnvironment` adds the studio floor, fog, a key/rim/fill
light rig and a canvas-painted equirectangular environment map. Studio tokens
live in `STUDIO_PALETTE`: studio black `#080b10`, graphite `#151a22`, porcelain
`#f2f5f7`, ice blue `#8dbfff`, settle green `#72e1b1`, alloy `#b9c3cd`, cobalt
`#4f7fd6`, key white `#eef4fb`.

Scroll progress from `anime.js`'s `onScroll` sync is read inside `useFrame`;
captions crossfade at progress 0.34 / 0.62 / 0.9. Dragging orbits the camera and
is clamped to ±10° azimuth and ±5° elevation, easing back to zero at 6/s on
release. One canvas at a time: it mounts via `useInRange` just before the
section enters the viewport, unmounts as the section leaves, and unmounting
disposes the renderer and forces WebGL context loss so the next mount starts
clean. Reduced motion pins progress to 1 and shows the settle caption. Without
WebGL, or whenever the canvas is not mounted, the section shows the labelled
screenshot figure fallback; compact viewports scale the stage down and drop the
devices per chapter.

## Configuration

`src/lib/site.ts`: `GITHUB_URL` and `DEMO_URL`. While `DEMO_URL` is empty the
demo button renders disabled with a "coming soon" label.

## Build order

1. Scaffold + tokens + i18n.
2. Capture app screenshots from the running app (localhost:8080).
3. Nav, hero, footer and section shell.
4. Coin scene and the split choreography.
5. Device scene and settle-up scene.
6. Mechanics, tech and run sections.
7. Verification: typecheck, build, Playwright screenshots at 1440/390,
   reduced-motion pass, WebGL-disabled fallback, console clean.

## Local run

`npm run dev` and open the printed URL. `npm run build` for the production
bundle.
