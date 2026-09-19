# Expense Splitting Website

Marketing site for [Expense Splitting Engine](https://github.com/raffa-developer/expense-splitting). A static React SPA with no backend: it explains the four split types and the settlement optimizer, then closes with a scroll-driven product film built from procedural three.js models.

## Stack

| Layer | Choice |
| --- | --- |
| Build | Vite 8, React 19.2, TypeScript 7 |
| Styling | Tailwind v4, CSS-first tokens in `src/index.css` |
| 3D | three 0.186, `@react-three/fiber` 9, `@react-three/drei` 10 |
| Scroll and motion | anime.js 4 for scroll and reveals, Lenis for smooth scroll |
| Copy | pt-PT and en dictionaries in `src/lib/i18n.tsx` |
| Fonts | self-hosted Gabarito, Karla, and DM Mono via fontsource |

## Run it

```bash
npm install
npm run dev        # dev server on http://localhost:5173
npm test           # vitest: the product-film motion math
npm run typecheck  # tsc --noEmit
npm run build      # typecheck, then static build to dist/
npm run preview    # serve the build locally
```

There is no lint step. Tests, typecheck, and build are the gates.

## Page structure

`App.tsx` renders a fixed progress bar, the nav, five sections, and the footer: the film, the four split types, settlement, tech facts, and a `docker compose` quickstart. Only the film runs custom scroll choreography; the other sections use one-shot reveal entrances.

## The product film

The film is a single `<section>`, 420vh tall (320vh below 900px), with a sticky `h-svh` stage: hero copy at the top, canvas behind it, caption band at the bottom.

Scroll progress drives the page and the scene together. `useScrollProgress` wraps anime.js and writes element styles directly, and the r3f scene reads the same progress object inside `useFrame`. Scrolling never re-renders React.

| Progress | Chapter | What moves |
| --- | --- | --- |
| 0.00-0.34 | `film.share` | Laptop rises, lid opens 0.12-0.30 |
| 0.34-0.62 | `film.laptop` | Screens crossfade 0.30-0.50 |
| 0.62-0.90 | `film.phone` | Phone rotates 2π at 0.55-0.68, screens turn on 0.62-0.80 |
| 0.88-1.00 | `film.settle` | Settle ramp 0.88-0.98, green fill lights, devices exit |

The site loads no model or HDR file. The laptop is a rounded box with an extruded keyboard slab and instanced keys, the phone a rounded ring with a ceramic camera island, and the studio a 64-unit floor with fog, key and rim lights, a settle-driven green fill, and a canvas-drawn environment map. Six app screenshots in `src/assets/screens/` texture the displays and crossfade between chapters, cover-cropped from the centre so the aspect mismatch never stretches.

Drag on the stage to orbit the camera. The view holds ±10° azimuth and ±5° elevation, then eases back to the default framing when you let go. The film always animates: the site ignores the OS reduced-motion preference by design and ships no motion toggle.

## One canvas at a time

The page renders a single `<Canvas>`, mounted only while the film section sits near the viewport and the browser supports WebGL. Unmounting releases the context. A labelled screenshot fallback takes the stage whenever the canvas cannot: no WebGL, a canvas error, or the stretch of page where the canvas is parked. Pixel ratio stays capped at 1.5 (1.25 below 900px) and drops to 1 when frame timing declines.

## Languages

pt-PT is the source dictionary. TypeScript types the English dictionary against the pt-PT keys, so a missing string fails `npm run typecheck`. The provider sets `document.documentElement.lang` and persists the choice in `localStorage`; the nav switches languages.

## Verification

`npm test`, `npm run typecheck`, and `npm run build` gate every change. Scene work also gets a structural Playwright pass that steps the page through scroll fractions at 1440x900 and 390x844, asserts zero console errors, and counts canvases; that harness lives outside the repo.

## Docs

- `ARCHITECTURE.md`: file map, scroll model, canvas gating, palette tokens.
- `docs/design.md`: visual design notes for the studio look.
- `docs/superpowers/specs/2026-09-19-product-film-remake-design.md`: the film remake spec.
- `docs/superpowers/plans/2026-09-19-product-film-remake.md`: its implementation plan.

## Related

- App repository: <https://github.com/raffa-developer/expense-splitting>
- `src/lib/site.ts` holds the external links. While `DEMO_URL` is empty, the hero shows a disabled "coming soon" button.
