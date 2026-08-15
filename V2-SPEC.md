# Portfolio v2 — Build Specification

A full-WebGL, scroll-driven 3D rebuild of shivrajsinh.in. The design language, palette,
typography, and all content carry over from v1 unchanged. What changes is the medium: the
homepage becomes a single continuous 3D world the visitor flies through.

---

## 1. Core principle — brutalism *is* the material language

The failure mode for this project is a glossy, bloom-heavy WebGL site that could belong to
anyone. Every rendering decision below exists to prevent that.

Brutalism is flat, hard-edged, and high-contrast. So the 3D must be too:

| Do | Don't |
| :--- | :--- |
| Unlit / toon / flat-shaded materials | PBR, metalness, roughness, env maps |
| Solid fills from the fixed palette | Gradients, iridescence, glass |
| Hard-edged extrusions, right angles, chamfer-free | Bevels, rounded corners, organic blobs |
| Hard-offset drop shadows (the `brutal-shadow` idea in 3D) | Soft shadows, contact shadows, AO |
| Dither / halftone / grain post | Bloom, god rays, lens flare |
| Depth from parallax, scale, and camera motion | Depth from realistic lighting |

Emissive neon edges are permitted and encouraged — they are the one "glow" allowance, and
they should read as printed neon, not as light bleed.

## 2. Architecture

**Stack:** Astro v6 (existing) + React Three Fiber islands + drei + postprocessing +
GSAP ScrollTrigger + Lenis + Tailwind v4.

**Route split** — this is the resolution of "full WebGL" vs "Astro is multi-page":

- `/` — **the journey.** One page, one persistent WebGL canvas, all sections are places in
  one continuous 3D space. No page navigations within it.
- `/resume`, `/resume-pdf`, `/contact`, `/gallery`, `/directory`, `/blog/*` — regular Astro
  DOM pages. They keep the existing SEO work, sitemap, JSON-LD breadcrumbs, canonical links,
  and the ATS PDF pipeline untouched.

The canvas mounts with `transition:persist` so moving between the journey and DOM routes
does not tear down and rebuild the WebGL context.

**Text rendering — hybrid.** All headings and copy remain real HTML, absolutely positioned
and synced to 3D space. Everything else — imagery, geometry, materials, transitions, the
world itself — is WebGL. Rationale: Google indexes it, screen readers read it, it is
selectable, and the existing SEO investment survives. Text is styled with the same Bebas
Neue / Space Grotesk / JetBrains Mono stack and sits above the canvas in the z-order.

## 3. Design tokens (carried over verbatim from v1)

```
--color-brutal-black:  #0a0a0a
--color-brutal-cyan:   #00f5ff
--color-brutal-pink:   #e00062
--color-brutal-gray:   #f0f0f0
--color-brutal-orange: #ff5e00
--color-brutal-purple: #9d00ff
--color-brutal-yellow: #ffe900

--font-display: "Bebas Neue"    → h1, h2, h3, section headings, project numbers
--font-sans:    "Space Grotesk" → body copy
--font-mono:    "JetBrains Mono" → labels, terminal, metadata
```

These are the *only* colors that may appear in the 3D scene. No off-palette tints, no
interpolation into unlisted hues.

## 4. The world — infinite brutalist void

Black `#0a0a0a` space. A graph-paper grid — the direct 3D descendant of v1's graph-paper
backdrop — recedes to infinity on the floor plane and optionally the walls, drawn as thin
emissive lines that fade with distance. Monolithic slabs and neon-edged structures float in
this void at authored positions. There is no horizon and no skybox; the void is genuinely
empty, which is what makes the objects read.

The camera travels a single authored spline through this space. Scroll position maps to
distance along the spline. Sections are *locations* on that spline, not separate scenes.

**Camera behavior:** free scroll via Lenis. Nav clicks animate the camera along the spline to
the target section in ~350ms with a sharp ease — effectively instant for a recruiter hunting
for contact info, but continuous enough that the visitor never loses spatial orientation.

## 5. Section-by-section

Content is lifted from `src/pages/index.astro` unchanged — same copy, same numbers, same
project descriptions. Only the presentation changes.

### 5.1 Hero — abstract brutalist sculpture
A mass of hard-edged extruded blocks and slabs in palette colors, floating in the void. It
assembles from scattered pieces on load and deconstructs as the visitor scrolls away. This
sculpture is the site's signature object: it recurs in fragments throughout the journey, and
its pieces are the raw material other sections are built from.

DOM overlay: `SHIVRAJSINH` / `ZALA` in Bebas Neue, role, location, availability badge.
Mouse movement parallaxes the sculpture; it does not follow the cursor literally.

### 5.2 About — `#about`
Camera pushes past the deconstructing sculpture into open void. Fragments drift alongside.
The `HUMAN BRAIN FIRST` statement and the stat blocks (`YEARS EXP`, `WEBSITES BUILT`,
`PLATFORMS`, `CUPS OF CHAI`) render as DOM, anchored to floating slabs.

The v1 profile photo appears here as an emissive plane with a halftone/dither shader —
preserving the layered 3D sticker treatment from the most recent v1 commits.

### 5.3 Experience — `#experience`
Timeline as a receding line of markers in depth. Each role (`WORKING AT`, employer, dates)
is a slab facing the camera. Camera moves *along* the timeline, so chronology maps to
physical distance travelled.

### 5.4 Projects — `#projects` — corridor of monoliths
The centerpiece. The camera flies down a corridor formed by twelve enormous slabs standing
in the void, alternating left and right. Each slab carries:

- the project screenshot as an emissive face
- the project number in oversized Bebas Neue
- title, stack line (e.g. `NEXT.JS / PRISMA / RAZORPAY`), and status (`LIVE` / `PRIVATE`)
- `REPO` / visit links where they exist in v1

Projects, in v1's existing order: craft-design-studio, gardi-chat, loanflow, price-compare,
quotegen, sahil-enterprise, shivam-ro, solar-quartz, somnath, todesktop, venus-pumps,
website-builder.

Twelve monoliths is a long corridor. Scroll distance per project must be tuned so the
section does not become a slog — target roughly 60–80vh of scroll per project, with the
camera moving fast enough that slabs read as passing rather than crawling.

### 5.5 Skills — `#skills`
Skill groups as a lattice of extruded blocks in the void, sized by proficiency. Categories
from v1 (`ASTRO / REACT / GSAP / TAILWIND`, `AI TOOLS`, `DIGITAL MARKETING`, Shopify,
WordPress, Webflow, Squarespace) each own a cluster the camera passes through.

### 5.6 Awards — `#awards`
The `STAR 2025` award and any others as objects on plinths. v1's `skew-scroll` treatment
translates to the camera banking slightly as it passes.

### 5.7 Terminal
The `_TERMINAL` reborn as a physical object floating in the void — a slab with the terminal
rendered to a texture, scanlines, screen glow, typing animation on approach. All existing
commands must work: `about`, `projects`, `skills`, `clear`, `neofetch`, `secrets`, plus the
theme switcher added in v1. Interaction is via a focused DOM overlay so keyboard input,
history, and accessibility behave normally.

### 5.8 Contact — `#contact` — the finale
The sculpture from the hero reassembles from every fragment the visitor has passed. The
Web3Forms contact form overlays it in DOM, with the existing GSAP `TRANSMITTING` / `SUCCESS`
modal states and field-shake validation preserved exactly.

## 6. Post-processing — restrained & sharp

Enabled: ordered-dither or halftone pass, film grain, hard vignette (optional), chromatic
aberration **on section transitions only**, never idle.

Banned: bloom, motion blur, depth of field, SSAO, screen-space reflections, particle storms.

The intent is a rendered-print look, not a game engine demo.

## 7. Performance

One quality path for all devices — no reduced mobile tier. That decision only holds if the
scene is authored to a hard budget, so these are requirements, not targets:

- **Draw calls:** ≤ 150 at any camera position. Instance the grid, the sculpture fragments,
  and repeated slab geometry.
- **Texture memory:** ≤ 96 MB. Project screenshots as compressed textures (KTX2/Basis),
  loaded progressively as the camera approaches — never all twelve at once.
- **DPR:** capped at 2. Never render at native DPR on high-density phones.
- **Geometry:** flat-shaded low-poly throughout; the material language already forbids the
  expensive stuff.
- **Frustum culling and LOD:** aggressive. Nothing behind the camera in an infinite corridor
  should cost anything.
- **Target:** 60fps desktop, ≥ 45fps on a mid-range Android. Measure on a real device, not a
  throttled desktop profile.

## 8. Accessibility & fallbacks (non-negotiable)

- `prefers-reduced-motion`: the camera stops flying. Sections become static compositions,
  transitions become cross-fades, the sculpture does not animate. All content remains
  reachable. This is separate from quality tiering.
- **No WebGL / context loss:** fall back to a flat DOM version of the brutalist design. The
  site must never render a blank black screen.
- **Keyboard:** every section reachable by keyboard; nav, project links, terminal, and form
  fully operable without a mouse. Visible focus states that survive the canvas z-order.
- **Contrast:** WCAG AA maintained for all DOM text over the canvas — verify against the
  actual rendered backdrop, not against `#0a0a0a` in isolation.
- **Screen readers:** the DOM layer is the source of truth; the canvas is `aria-hidden`.

## 9. What carries over from v1 unchanged

- Interactive CLI terminal with all commands and the theme switcher
- Web3Forms contact form with GSAP modal states and shake validation
- `/resume` page and the one-click ATS-friendly PDF (`resume-pdf.astro` print pipeline)
- Blog posts, `/gallery`, `/directory`, sitemap, JSON-LD breadcrumbs, canonical links
- All copy, stats, project descriptions, and imagery

## 10. Open items to resolve during build

- Exact camera spline shape — authored in code or exported from a 3D tool
- Whether the graph-paper grid is floor-only or a full enclosing cage
- Sculpture fragment count (drives the instancing budget)
- Whether project slabs are clickable in 3D or only via DOM overlay links
