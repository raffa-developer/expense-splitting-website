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

Coin: procedural geometry (cylinder plus extruded pie slices, standard PBR
materials, small custom light rig, no HDR assets). Devices: downloaded glTF
models rendered with `useGLTF`, with the app screenshots drawn onto planes
attached to each model's display mesh:

- `public/models/macbook.glb` — "Laptop / MacBook Pro" by Alex Safayan
  (https://poly.pizza/m/27hcX_w47Jb), CC BY. The lid node is re-parented to a
  hinge pivot and opens with scroll progress; screen planes cover the display.
- `public/models/iphone.glb` — "Apple iPhone 15 Pro Max Black" by polyman
  (https://sketchfab.com/Polyman_3D), CC BY 4.0. Screen planes sit on the front
  glass; the model also flips to show its back during the close-up.

Both models are simplified on load (small parts dropped, textures capped) to
keep the GPU budget for the software renderer. Scroll progress drives the
scenes from `anime.js`'s scroll sync and `useFrame`. One canvas at a time:
the coin canvas releases when its section leaves, then the device canvas
mounts, and unmounting always forces the WebGL context loss so the next canvas
starts clean. Reduced motion renders static; no WebGL falls back to a styled
hero with the app screenshot. Mobile gets a simplified coin and no device
scene. Attribution is shown in the footer.

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
