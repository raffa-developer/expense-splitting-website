# Product-film 3D remake — design

## Intent

Replace the site's current coin and imported-device 3D acts with a single,
product-first scroll film. The page must communicate the expense-splitting app
through premium, physically plausible objects: a laptop for shared planning, a
phone for expenses in the moment, and a machined coin that connects the two
states of money. The existing content, two languages, links, and accessible
fallbacks stay in place; the visual system and every animation/model in the
3D narrative are replaced.

## Creative direction

The look is a restrained, high-end product launch filmed in a dark studio. It
is not a literal office or a generic neon future. Devices are the only large
objects. Light reveals their material: cool-white key light, dim cobalt
reflection, and a small emerald signal for confirmed/settled money.

### Tokens

| Role | Value | Use |
| --- | --- | --- |
| studio black | `#080b10` | scene and page backdrop |
| graphite | `#151a22` | device aluminium and quiet surfaces |
| porcelain | `#f2f5f7` | primary type and key-light highlights |
| ice blue | `#8dbfff` | reflected edge light and depth |
| settle green | `#72e1b1` | confirmation, progress, and coin core |
| coin alloy | `#b9c3cd` | machined coin body |

Typography remains Gabarito/Karla/DM Mono, but surrounding sections inherit the
cool studio palette. Copy remains simple and product-focused.

## Narrative and layout

The hero-to-product journey is one 420vh scroll section with four pinned
chapters. Each chapter has a fixed stage, a canvas, and one small HTML caption
layer. The normal content sections follow it, using fewer competing decorative
effects.

```text
[ coin: a bill becomes shareable ]
              |
[ laptop: plan together ]
              |
[ phone: capture it anywhere ]
              |
[ coin: balances settle ]
              |
      mechanics / proof / run / footer
```

1. **Share:** a single, machined alloy coin floats over a black studio floor.
   Its engraved centre line opens into four precisely spaced arcs, each briefly
   exposing a real split amount. The arcs do not fly away; they re-seat as a
   complete coin, establishing order rather than chaos.
2. **Plan:** the coin recedes and becomes a small desk puck. A custom laptop
   rises from the floor, its hinge opens, and the app dashboard lights the
   scene. Scroll changes the screen between dashboard, group, and expense
   views by an occluded crossfade.
3. **Capture:** the camera passes the laptop edge. A custom phone emerges from
   the reflected shadow in front of it, rotates once to reveal its sculpted
   back, then settles face-forward with mobile screens cycling at deliberate
   scroll beats.
4. **Settle:** laptop and phone ease into the background. The coin returns,
   now with its grooves aligned and a quiet emerald core. A single settlement
   line resolves rather than exploding into particles.

The page uses this one orchestrated sequence; standard sections do not add
automatic entrances merely for decoration.

## New 3D assets

All three hero assets are procedural Three.js models, replacing imported glTF
assets and the existing coin geometry.

### Machined split coin

- A bevelled lathed disc with concentric machining grooves, a recessed rim,
  engraved radial split lines, and a shallow centre well.
- Four independently transformable arc segments sit inside a shared disc shell.
  They separate only enough to reveal values and must always retain the visual
  weight of one coin.
- A thin emissive emerald inlay appears only in the final settlement chapter.

### Laptop

- A custom rounded-rectangle aluminium base, thin lid, black glass display,
  hinge barrels, trackpad recess, keyboard field, and a softly chamfered edge.
- The lid rotates from a real hinge pivot. The app screen is a rounded display
  plane recessed just behind glass, with a controlled reflection plane and no
  embedded textures or external model credits.
- Detail is conveyed by shape, lighting, and normal-friendly bevels rather
  than high polygon counts or texture maps.

### Phone

- A custom glass-and-aluminium handset with a rounded metal frame, ceramic
  camera island, three lens rings, side button, and inset rounded display.
- The phone front and back are both authored and visible during its one
  narrative rotation. Mobile screenshots crossfade while the front faces the
  camera; never during a visible turn.

## Motion and interaction

Scroll remains the director. Animation reads the existing non-React scroll
progress ref from `useScrollProgress`, so camera and object transforms do not
rerender React.

Each chapter has an explicit progress range with eased camera rails, object
positions, material intensity, and crossfade states. Adjacent states overlap
only where a deliberate dissolve is desired. There are no autoplaying model
turntables or unprompted floating loops.

Pointer/touch drag is secondary: while a device is presented, it can orbit by
at most 10 degrees horizontally and 5 degrees vertically. Releasing it eases
back to the composed scroll camera. Drag is disabled while a touch begins on a
button or link; keyboard users retain all page navigation.

## Responsive and performance behavior

| Capability | Presentation |
| --- | --- |
| Desktop, WebGL | Full pinned 3D film, laptop and phone in their chapters, limited drag orbit. |
| Mobile, WebGL | Four shorter pinned scenes, simplified geometry/lighting, coin plus one device visible at a time, touch orbit. |
| Reduced motion | Static composition per chapter; screens remain visible and text/calls-to-action appear normally. |
| No WebGL | High-quality framed product screenshots with the same captions and no dead canvas space. |

Only one Canvas is mounted. The single new scene owns the whole film and
releases its context after it leaves the viewport. Pixel ratio is capped,
post-processing is avoided, shadows use inexpensive contact forms, and all
generated geometry is memoized. The page must remain readable when the canvas
is unavailable.

## Component boundaries

| Unit | Responsibility |
| --- | --- |
| `ProductFilmAct` | Section height, sticky stage, captions, responsive and fallback routing. |
| `ProductFilmScene` | Camera rail, scroll chapter state, pointer orbit, lighting, and scene composition. |
| `MachinedCoin` | Coin shell, grooves, arc segments, settlement inlay. |
| `StudioLaptop` | Procedural laptop geometry, hinge, and desktop screen planes. |
| `StudioPhone` | Procedural phone geometry, camera island, and mobile screen planes. |
| `product-film-motion` | Pure progress-to-transform mappings, kept separately so they can be unit tested. |

Existing device/coin scene files and their glTF dependency paths will be removed
only after the replacement builds and the static fallback is verified.

## Error handling and accessibility

Canvas rendering failure falls through to the screenshot treatment. Text never
depends on WebGL. The canvas is `aria-hidden`; controls have visible labels,
keyboard focus, and do not capture document scrolling. Reduced-motion checks
apply at scene initialization and honour the site's existing override.

## Verification

- Unit tests first for pure chapter ranges and clamped orbit math.
- `npm run typecheck` and `npm run build` must pass.
- Visual checks at 1440x900 and 390x844 at chapter start/end positions.
- Confirm reduced-motion and WebGL-disabled fallbacks retain content and CTAs.
- Confirm device rotation, screen crossfades, and pointer/touch orbit do not
  create console errors, visual clipping, or more than one active WebGL context.

## Scope boundaries

This remake does not change the app's backend, its marketing copy structure,
the translation mechanism, external links, or add heavyweight rendered assets.
It deliberately replaces the site 3D storytelling, models, materials, and
scroll choreography.
