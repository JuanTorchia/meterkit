---
name: MeterKit
description: A payment is a measurement, and every measurement ships with the certificate that lets a stranger verify it.
colors:
  stock: "#edf1f4"
  stock-sunk: "#e2e8ed"
  stock-raised: "#f7f9fb"
  ink: "#0c1114"
  ink-2: "#3f4d57"
  ink-3: "#67757f"
  intaglio: "#1a2e6e"
  intaglio-deep: "#0f1c47"
  intaglio-tint: "#c3d2de"
  intaglio-wash: "#dbe4ec"
  seal: "#c8321e"
  seal-deep: "#8f2113"
  seal-tint: "#f2d9d3"
  verified: "#1c6b4a"
typography:
  totalizer:
    fontFamily: "Martian Mono, ui-monospace, SFMono-Regular, monospace"
    fontSize: "clamp(4.2rem, 12vw, 7rem)"
    fontWeight: 700
    lineHeight: 0.94
    letterSpacing: "-0.04em"
    fontVariantNumeric: "tabular-nums"
  display:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(2.2rem, 4vw, 3.2rem)"
    fontWeight: 800
    lineHeight: 1.05
    letterSpacing: "-0.03em"
    fontVariation: "wdth 108"
  headline:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(1.5rem, 2.4vw, 1.95rem)"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.02em"
    fontVariation: "wdth 106"
  title:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.22rem"
    fontWeight: 700
    lineHeight: 1.3
    letterSpacing: "-0.008em"
  body:
    fontFamily: "Public Sans, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.02rem"
    fontWeight: 400
    lineHeight: 1.55
    letterSpacing: "normal"
  small:
    fontFamily: "Martian Mono, ui-monospace, SFMono-Regular, monospace"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.55
    letterSpacing: "0.02em"
  label:
    fontFamily: "Martian Mono, ui-monospace, SFMono-Regular, monospace"
    fontSize: "0.72rem"
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: "0.13em"
    textTransform: "uppercase"
rounded:
  none: "0"
spacing:
  s-1: "4px"
  s-2: "8px"
  s-3: "12px"
  s-4: "16px"
  s-5: "24px"
  s-6: "32px"
  s-7: "48px"
  s-8: "64px"
  s-9: "96px"
  gutter: "clamp(20px, 5vw, 72px)"
components:
  button-primary:
    backgroundColor: "{colors.intaglio}"
    textColor: "#ffffff"
    typography: "{typography.small}"
    rounded: "{rounded.none}"
    padding: "15px 24px"
  button-primary-hover:
    backgroundColor: "{colors.intaglio-deep}"
    textColor: "#ffffff"
  button-primary-on-field:
    backgroundColor: "{colors.stock-raised}"
    textColor: "{colors.intaglio}"
    typography: "{typography.small}"
    rounded: "{rounded.none}"
    padding: "15px 24px"
  button-primary-on-field-hover:
    backgroundColor: "#ffffff"
    textColor: "{colors.intaglio}"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "currentColor"
    typography: "{typography.small}"
    rounded: "{rounded.none}"
    padding: "14px 23px"
  button-ink:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.stock-raised}"
    typography: "{typography.small}"
    rounded: "{rounded.none}"
    padding: "10px 16px"
  button-ink-hover:
    backgroundColor: "{colors.intaglio}"
    textColor: "{colors.stock-raised}"
  button-ink-disabled:
    backgroundColor: "{colors.stock-sunk}"
    textColor: "{colors.ink-3}"
  input-field:
    backgroundColor: "{colors.stock-raised}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.none}"
    padding: "10px 12px"
  seal-verified:
    backgroundColor: "transparent"
    textColor: "{colors.verified}"
    typography: "{typography.label}"
    rounded: "{rounded.none}"
    padding: "3px 9px"
  seal-pending:
    textColor: "{colors.ink-3}"
  seal-failed:
    textColor: "{colors.seal-deep}"
  instrument-bar:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.intaglio-tint}"
    typography: "{typography.label}"
    rounded: "{rounded.none}"
    padding: "7px {spacing.gutter}"
  devnet-warning:
    backgroundColor: "{colors.seal}"
    textColor: "#ffffff"
    typography: "{typography.label}"
    rounded: "{rounded.none}"
    padding: "2px 8px"
  error-banner:
    backgroundColor: "{colors.seal-tint}"
    textColor: "{colors.seal-deep}"
    typography: "{typography.small}"
    rounded: "{rounded.none}"
    padding: "12px 16px"
---

# Design System: MeterKit

## Overview

**Creative North Star: "The Certificate of Calibration"**

MeterKit is drawn as a security-printed measurement document, not as a software marketing page. A payment here is a reading taken by an instrument, and the surface's job is to hand the reader the certificate that lets them check the reading themselves. Everything follows from that: the ground is cold certificate stock under lab light, never cream and never a dark hero; the committed field is a deep intaglio blue that behaves like ink pressed into paper; and the page's structure is drawn in hairline rules rather than assembled from boxes.

The density is high and unapologetically numeric. Monospaced figures with tabular numerals and slashed zeroes carry every quantity, uncertainty is printed beside the value as a plus-minus rather than hidden, and states are stamped as seals rather than colored pills. The palette is small and almost entirely two-family — cold neutrals plus intaglio blue — so that the two chromatic exceptions (seal red for out-of-tolerance, verified green for confirmed finality) read as instrument states rather than decoration. The build explicitly refuses the category hero it was drawn against: no dark ground, no mesh gradient, no one-line snippet as the entire proposition, no logo wall.

Three surfaces share one world but not one density. Persuade surfaces (landing, pilots) get the display/body pairing and the fluid clamp scale. Operate surfaces (dashboard, demo) collapse to a single family on a fixed rem scale, because product UI does not get typographic drama. Read surfaces (docs) widen the measure and loosen the leading, because comprehension outranks density there.

**Key Characteristics:**

- Zero radius everywhere; every corner in the system is square.
- Hairline rules, not shadows, are the entire depth system.
- Ruled registers replace cards on every surface.
- Numbers are always monospaced, tabular, with slashed zero.
- Uncertainty is printed, never rounded away.
- Trilingual EN / ES / pt-BR: no composition may depend on English string lengths.

## Colors

A cold two-family palette — certificate stock and intaglio ink — with exactly two instrument-state exceptions.

### Primary

- **Intaglio Blue** (`colors.intaglio`): The committed field. Fills the full-bleed hero and pilots hero, carries every primary action on light surfaces, colors inline code, list markers, flow-diagram strokes, and link underline hovers. This is the ink the certificate is printed in.
- **Intaglio Deep** (`colors.intaglio-deep`): Pressed state only — the hover of a primary action on a light surface.

### Secondary

- **Verification Green** (`colors.verified`): Stamped only when finality is confirmed. Fills the seal diamond in its finalized state, the network dot, completed timeline markers, finalized settlement rows, and the passing check in the pilot checklist. It is a confirmation, never an accent.
- **Seal Red** (`colors.seal`, `colors.seal-deep`, `colors.seal-tint`): Out-of-tolerance. See the Reserved Seal Rule below.

### Neutral

- **Certificate Stock** (`colors.stock`): The page ground. Cold, lightly blue, never warm.
- **Sunk Stock** (`colors.stock-sunk`): The recessed panel tone — the code section band, the evidence banner, inline code chips, the scrollbar track. Recession by tone, never by shadow.
- **Raised Stock** (`colors.stock-raised`): Text on the intaglio field, input and menu grounds, and the inverted primary action on the field.
- **Cold Black** (`colors.ink`): Body text, the instrument bar ground, code blocks, the strong hairline, and the ink-filled utility buttons.
- **Slate Ink** (`colors.ink-2`): Secondary prose and supporting copy.
- **Mist Ink** (`colors.ink-3`): Labels, captions, serials, placeholders, and pending states.
- **Tolerance Tint** (`colors.intaglio-tint`): The hairline rule color, graticule strokes, all text on the intaglio field that is not primary, and the pending seal border.
- **Tolerance Wash** (`colors.intaglio-wash`): The unfilled portion of a tolerance band and the flow rail.

### Named Rules

**The Reserved Seal Rule.** Seal red is never decoration and never a brand accent. As a _fill_ it appears in exactly four places: the instrument bar's devnet warning, the totalizer's offline line, the error-banner marker, and the failed seal state. As a _hairline marker_ it also carries the focus ring (2px outline) and the current-position underline on demo steps and mobile nav (inset 0 -2px 0). Nothing else. A subject that merely happens to be a payment does not earn red — the payment packet in the flow diagram was deliberately recolored off seal red because it encoded a subject, not an alarm.

**The Inversion Rule.** Primary actions use intaglio on light surfaces and invert to raised stock on the intaglio field. A primary action never borrows red to gain contrast on a dark ground.

**The Two-State Rule.** Only two colors report state: verified green for confirmed finality, seal red for out of tolerance. Everything in between is neutral — mist ink for pending, intaglio for in-progress.

## Typography

**Display Font:** Archivo (variable `wdth` axis, with ui-sans-serif fallback)
**Body Font:** Public Sans (with ui-sans-serif fallback)
**Label/Mono Font:** Martian Mono (with ui-monospace fallback)

**Character:** A grotesk that can be optically widened for headline authority, paired with a neutral civic-grade text face and a wide, engineered monospace that does all the measuring. The pairing reads as an official document typeset by an instrument, not by a brand.

### Hierarchy

- **Totalizer** (`typography.totalizer`): The signature reading, at architectural scale. Monospaced so the digit wheels align; negative tracking and sub-1 leading make the number read as a machine register. One per page, maximum.
- **Display** (`typography.display`): The landing `h1` only. Widened to `wdth 108` so it holds the intaglio field without competing with the totalizer — the instrument is the thesis, so the headline yields scale to it.
- **Headline** (`typography.headline`): Section headings on Persuade surfaces and secondary page `h1`s, widened to `wdth 106`.
- **Title** (`typography.title`): Sub-section and card-free register headings. Drops to 1.05rem on Operate surfaces.
- **Body** (`typography.body`): All prose. Capped at 68ch by default; the docs body runs to 72ch at 1.68 leading.
- **Small** (`typography.small`): Monospaced supporting data — table cells, metadata, actions, code.
- **Label** (`typography.label`): Measurement captions in monospaced uppercase with wide tracking. A caption _beside or beneath_ the thing it measures.

### Named Rules

**The No-Eyebrow Rule.** A label set above a heading is banned outright, and the ban is on the rendered pattern, not the markup — folding the label inside an `<h2>` does not satisfy it. Role and sequence markers survive two ways only: folded into the heading sentence (the demo's persona role), or as the left half of a register pair (the pilots command mark, the landing step register).

**The Instrument Reads the Number Rule.** Every quantity — amount, count, price, signature, serial, timestamp — is set in Martian Mono with `tabular-nums` and `"zero" 1`. Prose never carries a figure that a reader might want to compare against another figure.

**The Two-Density Rule.** Persuade surfaces use the display/body pairing on the fluid clamp scale. Operate surfaces (dashboard, demo) use one family on a fixed rem scale; product UI does not get display/body pairing.

## Layout

The page is a stack of full-bleed horizontal bands, each padded by a single fluid gutter (`spacing.gutter`, clamp 20px–72px). There is no centered max-width container: content is bounded by measure (68ch prose, 72ch docs body, 46ch hero lede), not by a wrapper.

The vertical rhythm is an 8px-derived scale (`spacing.s-1` through `s-9`). Section bands take `s-9` vertical padding on Persuade surfaces, `s-7` on Operate, and register rows take `s-4`/`s-5`.

Two persistent chrome layers stack at the top: the instrument bar (sticky at `top: 0`, 30px tall in practice) and the surface nav (sticky at `top: 30px`, 68px tall) so the bar is never occluded. Docs add a sticky sidebar at `top: 90px`.

Grid families in use: register lists (`grid-template-columns` with a fixed left marker column — 11rem role, 13rem command mark, 3.5rem serial — and `minmax(0, 1fr)` content), and bordered matrices built with `repeat(auto-fit, minmax(N, 1fr))` at 140/150/190/280/320px thresholds.

Breakpoints: 960px (hero collapses to one column and the graticule steps out so the instrument stays in the first viewport), 900px (docs sidebar unsticks and moves above main), 850px and 760px (register pairs stack, nav links give way to a wrapping mobile product nav, the instrument bar wraps rather than scrolls so the devnet warning can never truncate).

**The Shrinkable Column Rule.** Every page-level grid declares `grid-template-columns: minmax(0, 1fr)`. An implicit `auto` column lets a long string push the whole document wider than the viewport; all six routes are verified at `scrollWidth === clientWidth` at 390px.

**The Three-Language Rule.** No composition may depend on English string lengths. Spanish and Portuguese run longest; register pairs, nav, and the instrument bar all wrap rather than clip.

## Elevation & Depth

There are no shadows in this system. Depth is drawn, not lit: hairline rules and tonal recession do all the work a shadow would do elsewhere.

Three rule weights carry the entire structural hierarchy. A strong 1px cold-black rule opens a register or section. A 1px tolerance-tint rule separates rows within it. On the intaglio field, rules become 1px `rgba(255,255,255,0.22)` so the field's own rules read as embossing rather than as printed lines. Recession is tonal: sunk stock for pressed-in panels, raised stock for lifted ones.

The only `box-shadow` declarations in the build are inset hairlines used as markers, never as ambient depth: the secondary button's hover doubles its border, the docs sidebar hover draws a 2px intaglio bar at the left edge, and the current step draws a 2px seal-red underline.

**The Drawn-Depth Rule.** If a surface needs to feel separate, rule it or change its tone. Never float it.

## Shapes

Zero radius, system-wide. Every corner — button, input, seal, banner, code block, panel — is square. This is a printed document, and printed rules do not have rounded ends.

The recurring silhouette is the **rule terminus**: every horizontal rule, register row, tolerance band, and graticule axis begins and ends on the same left and right edge as its neighbors. In a world made of rules, a missed terminus reads as a printing slip.

The one repeating glyph is a 7px (occasionally 6px or 8px) **wire-seal diamond**, drawn with `clip-path: polygon(50% 0, 100% 50%, 50% 100%, 0 50%)`. It marks proof lines, seals, network status, timeline steps, checklist items, and error banners, taking its color from the state it reports. Iconography beyond it is 22px line SVG at 1.5 stroke weight with square caps, drawn in intaglio.

Tolerance bands are 6px strips filled from `--band-from` for `--band-width`, tint-on-wash on stock and white-on-translucent on the field.

## Components

### Buttons

- **Shape:** Square (0 radius), everywhere, no exceptions.
- **Primary:** Intaglio ground, white text, `15px 24px`, monospaced small with `0.02em` tracking. On the intaglio field it inverts to raised stock on intaglio text — see the Inversion Rule.
- **Hover / Focus:** Primary darkens to intaglio-deep (0.2s, `cubic-bezier(0.16, 1, 0.3, 1)`). Focus is a 2px seal-red outline at 2px offset, globally, and it is never removed.
- **Secondary:** Transparent with a 1px `currentColor` border, `14px 23px`; hover doubles the border with an inset hairline rather than filling.
- **Ink (utility):** Cold-black ground, raised-stock text, `10px 16px`. Used for wallet connect, form submits, and workspace actions; hovers to intaglio. Disabled goes sunk stock with a tint border.
- **Text button / source link:** No ground, no padding, underlined in tolerance tint; the underline goes to `currentColor` on hover.

### Inputs / Fields

- **Style:** Raised-stock ground, strong 1px cold-black border, square, `10px 12px`, body size. Labels sit _above_ in monospaced uppercase label style — these are field labels, not eyebrows.
- **Focus:** The global 2px seal-red outline; no border shift, no glow.
- **Placeholder:** Mist ink.
- **Error:** Reported by the error banner beside the form, not by recoloring the field.

### Ruled Register (replaces cards)

- **Corner style:** None; a register has no box.
- **Structure:** A strong rule opens it; each row is separated by a hairline and padded `s-5` vertically with no horizontal padding, so rows share the section's gutter terminus.
- **Variants:** Marker-pair registers (fixed left column carrying serial, step, or role; content in `minmax(0, 1fr)`) and bordered matrices (`auto-fit` cells with right and bottom hairlines over a top-and-left strong/hairline frame).
- **Background:** None. Registers sit on the page ground.

### Instrument Bar

Persistent chrome pinned at the very top of every surface: cold-black ground, tolerance-tint monospaced uppercase label text at `7px` gutter padding, carrying network identity and the devnet warning. The warning is the only seal-red fill on the bar. Live state is pinned here, never boxed into a section. Below 760px it wraps instead of scrolling so the warning can never be clipped.

### Navigation

Sticky under the instrument bar, 68px tall, page-ground with a strong bottom rule. Links are body-small with a transparent 1px bottom border that becomes cold black on hover. The brand is Archivo 800 at 1.06rem beside a boxed monospaced mark. Below 760px the link row gives way to a wrapping mobile product nav; the current page is marked with a 2px inset seal-red underline.

### Seals

The state stamp: monospaced uppercase label in a 1px box, `3px 9px`, preceded by a 7px wire-seal diamond. Three states — verified (green box and diamond), pending (mist ink on a tolerance-tint border), failed (deep seal text on a seal border). Never filled, never rounded, never a pill.

### Live Totalizer (signature)

The thesis element. A mechanical register — not a stat tile — reading the live devnet gateway every 15s. It carries, on one instrument: a monospaced head rule with its caption and units; the measured value rendered as odometer wheels that translate `0.94em` per digit over 0.7s (transition disabled under `prefers-reduced-motion`); the plus-minus of real settled-but-not-finalized payments printed immediately beside the value; the primary action on that same baseline; a tolerance band; and a metadata row ending in a click-through explorer signature.

**The No-Invented-Data Rule.** When the gateway is unreachable the totalizer prints its seal-red offline line and shows nothing. It never shows a guess, a last-known value, or a placeholder animation. The plus-minus carries real uncertainty from the same payload — it is never a decorative tolerance.

### Price Graticule (signature)

An authored logarithmic scale, not an ornament: three decades of per-request pricing (0.001–1 USDC) drawn as major and minor graduations on a tint axis, with the public demo's real 0.01 USDC setting marked in raised stock at double stroke weight. End labels anchor inward so no glyph overhangs the terminus. It hides below 960px rather than pushing the instrument out of the first viewport.

## Do's and Don'ts

### Do:

- **Do** replace any card impulse with a ruled register: a strong opening rule, hairline row separators, no box, no background.
- **Do** set every figure in Martian Mono with `tabular-nums` and slashed zero.
- **Do** invert the primary action to raised stock on the intaglio field, and keep it intaglio on stock.
- **Do** print uncertainty as a plus-minus beside the value, sourced from the same payload as the value.
- **Do** land every rule, register row, band, and axis on the same left and right terminus as its neighbors.
- **Do** carry role and sequence markers as the left half of a register pair, or folded into the heading sentence.
- **Do** declare `grid-template-columns: minmax(0, 1fr)` on every page-level grid, and verify `scrollWidth === clientWidth` at 390px.
- **Do** compose for the longest of EN / ES / pt-BR; let chrome wrap rather than clip.
- **Do** show nothing when data is unavailable, and say so in the same monospaced voice.

### Don't:

- **Don't** set a label above a heading. The ban is on the rendered pattern; folding the label into the heading element does not satisfy it.
- **Don't** spend seal red on anything that is not out-of-tolerance, the devnet warning, the focus ring, or the current-position marker. A subject is not an alarm.
- **Don't** add a border radius. Nothing in this system is rounded.
- **Don't** add a drop shadow, a glow, or a blur to create separation. Rule it or retone it.
- **Don't** give Operate surfaces the display/body pairing or the fluid clamp scale.
- **Don't** invent, interpolate, or animate a number the gateway did not return.
- **Don't** use verified green as an accent; it is reserved for confirmed finality.
- **Don't** reach for a dark-ground hero, a mesh gradient, a one-line snippet as the whole proposition, or a logo wall. These are the confirmed anti-references.
