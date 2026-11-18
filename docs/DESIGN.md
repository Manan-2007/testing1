# Parlance design direction (v2)

## Why a redesign

v1 inherited VOX's interface grammar: every surface was a boxed card with an icon + title + actions header, the signer lived in a framed "stage" with a status chip, controls were VOX's segmented toggles and word chips, and both workspaces used VOX's stage-left / panel-right session layout. The landing page repeated one rounded-card grid in every section. It read as VOX recoloured.

## Principles taken from benchmarking Yap & Render (not its execution)

1. One confident typographic gesture per section instead of many small ones.
2. The real product is part of the first impression, not behind a link.
3. The avatar is large enough to be the subject of the page.
4. Few component types, used consistently; variety comes from composition.
5. Sections are separated by rhythm and contrast, not by boxes.

Deliberately not used: serif or italic display type, browser-window mock frames, a floating centre dock, vertical page rules, sticky scroll-story with numbered progress bars, a dark statistics band, a centred closing CTA.

## Identity: the meeting point

The logo is two voices facing each other around a shared point: `( • )`. That shape becomes the visual language.

- **Arcs.** Thin royal-blue arcs frame the signer on every stage. The signer always stands between them.
- **The gold point.** The only recurring use of gold. It marks the sign being performed right now and the active step of a process.
- **Parenthesised indices.** Section labels read `(01) How it works`.
- **Two lanes.** Speech-side content sits on the left, sign-side content on the right, and the signer sits on the line where they meet.

## Typography

Geist Variable, self-hosted. No italic, serif or monospace anywhere.

| Role | Size | Weight | Tracking |
|---|---|---|---|
| Display | clamp(3rem, 6.4vw, 6.25rem), leading 0.94 | 600 | -0.055em |
| Section title | clamp(2.25rem, 4.2vw, 3.75rem), leading 1.0 | 600 | -0.045em |
| Statement | clamp(1.5rem, 2.4vw, 2.25rem), leading 1.2 | 500 | -0.025em |
| Body large | 1.1875rem / 1.6 | 400 | -0.005em |
| Body | 1rem / 1.6 | 400 | 0 |
| Label | 0.75rem uppercase | 600 | 0.09em |

Headlines are navy; one phrase per headline may be royal. Body text is charcoal and grey-blue.

## Colour use

- About 80% ice (#EFF0F2) and white. The signer stage uses pale blue (#E9ECF8 to #F5F6FC).
- Royal (#0D21A1): primary actions, arcs, active states, one highlighted phrase per headline.
- Navy (#011638): headline text, the footer, and the workspace transport bar.
- Gold (#EEC643): the "point" only (current sign, active step, logo).
- Hairlines (#D8DCE6) do the structural work that shadows and boxes did in v1.

## Shape and depth

- Radii: 6px for controls and 10px for panels. The arcs and the point are the only circles. No pills except toggles.
- No resting shadows. Floating controls (transport bar, menus, dialogs) get one soft shadow.
- Structure comes from a 12-column grid, hairline rules and white space.

## Layout rhythm

- 12 columns, 1320px max, 24px gutters, with asymmetric spans (5/7, 4/8, 7/5).
- Section padding: 128px desktop, 80px mobile. Each section opens with a hairline and an index label.
- Compositions vary by section: split hero, typographic ticker, interactive diagram, editorial vignettes, manifesto with credits, link-index footer.

## Motion

- Hero entrance: the headline lines rise in sequence, the arcs draw, then the signer fades in (under 1s).
- Sections reveal with a 12px rise on scroll.
- The gold point travels along the process diagram and the gloss line.
- Mode switches slide a shared indicator.
- Recording shows a ring pulse and live bars.
- No floating blobs, particles or glow. Reduced motion removes autoplay, travel and reveals.

## Workspaces

- **Speech → Sign "studio".** The signer fills the main area between the arcs. A large caption sits under it, with a dark floating transport bar. The right column is a conversation log with a chat-style composer pinned at the bottom. On mobile: stage on top, composer pinned above the tab bar, log in between.
- **Sign → Text "live room".** The camera fills the main area with minimal corner overlays. Accepted signs appear as subtitles on the video, and controls float on the video. The right column holds the recognition state (headline, confidence, reason), the sentence being built, and the transcript with large speak buttons.
