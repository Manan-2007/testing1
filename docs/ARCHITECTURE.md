# Parlance frontend: architecture

This document was written before implementation and updated as the build landed.

## 1. What was audited

| Source | What it gave us | How it is used |
|---|---|---|
| **VOX** (team's previous ISL project) | ISL grammar engine, 239-sign landmark motion library (ISLRTC dictionary), three.js signer with a built-in procedural avatar, MediaPipe hand + pose tracking in a Web Worker, a gated BiLSTM recogniser behind a FastAPI WebSocket | The engine is vendored into `frontend/src/engine/` with its logic untouched. The UI, layout, styling and app structure are new. |
| **Yap & Render** | Product category reference: speech/text to ISL with a 3D avatar, quick phrases, speed control, honest "AI unavailable" fallback | Functional reference only. No code, CSS, layout, copy, assets or animations were taken. Its tagline ("One conversation. Two ways to be heard.") and its hero-with-embedded-demo / scroll-story layout were deliberately avoided. |
| **Parlance wireframes** | Information architecture: nav, two-column hero, flow strip, How it works (explainer + scrolling demo), three steps, About with team reveal, four-item mobile navigation | Primary structure for the landing page and mobile navigation. |
| **Submission deck** | Team names, verified statistics (ISLRTC), honest feature-status vocabulary | Team section, Why it matters, honesty rules. |

## 2. Stack

- React 19, TypeScript, Vite 8 (same toolchain as VOX, so the engine compiles unchanged)
- Tailwind CSS v4 with design tokens declared in CSS (`src/styles/index.css`)
- React Router 7 with lazily loaded routes, so the landing page never downloads the translator or MediaPipe
- Zustand for the two pieces of cross-page state (settings, history)
- Motion (`motion/react`) for a small number of entrance and state transitions only
- Lucide icons
- Geist Variable, self-hosted through Fontsource. No request goes to a font CDN. (v1 used Manrope; see DESIGN.md.)
- three.js, `@pixiv/three-vrm`, `@mediapipe/tasks-vision` (engine dependencies)

## 3. Folder layout

```
frontend/
  public/
    signs/            239 sign motions + manifest.json + recognition.json (from VOX)
    models/           MediaPipe hand + pose landmarker models
    mediapipe/wasm/   copied from node_modules by scripts/copy-assets.mjs (gitignored)
  src/
    app/              router, shells (site + workspace), providers
    components/
      ui/             design-system primitives (Button, Card, Switch, Segmented, Dialog, ...)
      layout/         headers, footer, mobile tab bars, skip link, logo
      avatar/         AvatarViewport (React wrapper around the engine stage), PlaybackBar
    features/
      landing/        Hero, FlowStrip, HowItWorks, WhyItMatters, About
        intro/        welcome scene: SigningHands (ISLRTC WELCOME as vector hands), IntroScene, introState
      speech-to-sign/ workspace: Composer, GlossPanel, SignerPanel, quick phrases
      sign-to-text/   workspace: CameraPanel, RecognitionReadout, SentencePanel
      history/        HistoryPage
      settings/       SettingsPage
      help/           HelpPage (getting started, vocabulary, limits, privacy, service setup)
    services/
      recognition/    typed WebSocket client for the recognition service
      speech/         Web Speech API: recognition (input) and synthesis (output)
      camera/         camera + MediaPipe worker hook with explicit permission states
      signs/          sign queue (text -> gloss -> motion), manifest + recognition metrics
    stores/           settings + history (Zustand, privacy-aware persistence)
    hooks/            small shared hooks (media query, reduced motion, in-view, document title)
    lib/              utilities (cn, time formatting, ids)
    engine/           vendored VOX engine: avatar, core, isl, tracking, workers
```

## 4. Routes

| Path | Page |
|---|---|
| `/` | Landing (Home, How it works, Why it matters, About) |
| `/app/speech-to-sign` | Speech / text to ISL workspace |
| `/app/sign-to-text` | ISL to text / speech workspace |
| `/app/history` | Translation history |
| `/app/settings` | Settings |
| `/app/help` | Getting started, vocabulary, limits, privacy, service setup |
| `*` | Not found |

## 5. Integration contracts

### Speech / text to ISL: fully client-side, real

`text -> toGloss() (ISL grammar) -> loadSign() per gloss -> SignPlayer -> PoseRetargeter -> AvatarStage`

Words with no sign in the library stay in the queue, are flagged as missing, and are captioned rather than signed. Nothing is invented.

### ISL to text: real tracking on-device, recognition via the service

`camera -> MediaPipe worker (hands + pose, on-device) -> 141-float vectors at 15 fps -> WebSocket -> BiLSTM -> gated word`

- The service URL defaults to `ws://localhost:8000/ws` and is configurable in Settings or with `VITE_PARLANCE_WS`.
- Only landmark numbers are sent. Video never leaves the browser and is never recorded.
- The service emits a word only at confidence >= threshold (default 0.85) **and** three stable predictions, and only for signs verified on held-out recordings. Everything else reaches the UI as a *candidate* with a reason, and is shown as "not recognised". The UI never promotes a candidate to a result.
- When the service is unreachable the page says so and keeps the camera preview and on-device tracking working. There is no simulated recognition.

### Not implemented (and not claimed)

Continuous signing recognition, reading facial grammar from the signer, fingerspelling, Hindi input, and server-side translation. The UI labels these as planned where they are relevant.

## 6. State and privacy

- **Settings** live in `localStorage` (`parlance.settings.v1`).
- **History** retention is user-controlled: *don't save*, *this tab only* (default, `sessionStorage`), or *on this device* for 1, 7 or 30 days (`localStorage`, pruned by age on load and on every write). Clearing is one action with confirmation.
- Webcam frames and audio are never stored.

## 7. Accessibility approach

Semantic landmarks, skip link, visible focus rings, labelled controls, `aria-live` announcements for recognition results and translation progress, status conveyed by icon and text as well as colour, reduced-motion support (system or in-app override), text-size setting, 44px touch targets, and layouts that reflow at 400% zoom.
