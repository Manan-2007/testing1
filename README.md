# Parlance

Two-way communication between spoken language and Indian Sign Language (ISL).
Healthcare & MedTech track · Team APX_GP · The Builder's Theory 1.0

- **Speech / text → ISL.** English is reordered into ISL grammar and performed by a 3D signer in the browser.
- **ISL → text / speech.** Hands are tracked on the device; a recognition service accepts a sign only when it is confident, and the result is shown as text and spoken aloud.

Parlance supports qualified interpreters. It does not replace them.

## Run it

Requires Node 20+ (tested on Node 26).

The quickest way is the start script. It installs dependencies on the first run, starts the app, and opens it in your default browser:

```bash
./start.sh
```

On Windows, double-click `start.bat` or run it from a terminal. Press Ctrl+C to stop.

To start the recognition service at the same time, point `VOX_DIR` at the VOX project folder:

```bash
VOX_DIR="/path/to/vox" ./start.sh
```

On Windows, run `set VOX_DIR=C:\path\to\vox` first, then `start.bat`. The service opens in its own window.

To run it by hand instead:

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5180. `npm run dev` also copies the MediaPipe WebAssembly runtime into `public/mediapipe/` on first run.

Speech to sign works with nothing else running. Sign to text also needs the recognition service, which is the FastAPI + BiLSTM backend from the VOX project. From the VOX folder:

```bash
source venv/bin/activate
uvicorn backend.main:app --port 8000
```

Parlance connects to `ws://localhost:8000/ws` by default. Change it in **Settings → Camera and microphone**, or set `VITE_PARLANCE_WS` (see `frontend/.env.example`).

Other scripts, from `frontend/`:

```bash
npm run build      # typecheck + production build into dist/
npm run preview    # serve the production build on port 5180
npm run lint       # oxlint
```

For static hosting, configure a fallback to `index.html` so that client-side routes such as `/app/settings` resolve.

## What's inside

```
Parlance/
  docs/ARCHITECTURE.md       audit findings, stack, routes, integration contracts
  docs/DESIGN.md             design direction (v3): palette, welcome scene, fluid sections, type
  frontend/
    public/signs/            239 ISLRTC dictionary signs as landmark motion, plus recognition metrics
    public/models/           MediaPipe hand and pose landmarker models
    src/app/                 router, shells, preferences
    src/components/          design-system primitives, layout, avatar viewport and playback bar
    src/features/            landing, speech-to-sign, sign-to-text, history, settings, help
    src/services/            camera + tracking, recognition client, speech in/out, sign library/queue
    src/stores/              settings and history (Zustand, privacy-aware persistence)
    src/engine/              ISL engine vendored from VOX (avatar, grammar, tracking worker)
```

Stack: React 19, TypeScript, Vite 8, Tailwind CSS 4, React Router 7, Zustand, Motion, Lucide, three.js, MediaPipe Tasks. The font is Geist, self-hosted. The visual system is described in `docs/DESIGN.md`.

## Implementation report

### Working, and checked in the browser

| Area | What works |
|---|---|
| Landing | Every wireframe section, redesigned in v3 around light blues and gold. A welcome scene in which stylised hands sign WELCOME from the real ISLRTC recording, then collapse through a circle into the hero's live signer (skippable, once a day, never under reduced motion; add `?intro` to the URL or use *Replay the welcome* in the footer to see it again). A hero where visitors type a sentence and the live 3D signer performs it (real grammar engine and motion library), section surfaces that flow in with a softened edge as they enter, a two-way Voice → Sign → Understood ticker, an interactive two-direction process diagram with live demonstrations (including real ISLRTC hand motion), Why it matters as editorial vignettes with real engine output and sourced ISLRTC figures, an About manifesto with a team roster reveal, a link-index footer, and the four-item mobile tab bar. |
| Speech → ISL | A studio layout: the signer fills the stage, with a conversation log and a chat-style composer beside it (pinned above the tab bar on phones). Typed input and browser voice input with recording timer, transcript and error states. ISL grammar reordering (`toGloss`), a sign queue loaded from the 239-sign library, and the 3D signer with play/pause, replay, 0.5×/0.75×/1× speed, loop, mirror, whole-signer or hands view, full screen, captions, and a clickable sign timeline. Words with no sign are flagged and captioned, never dropped or invented. Facial-grammar markers are shown. Includes tested clinic and everyday phrases. |
| ISL → text | A live-room layout: a large camera viewport with live subtitles for accepted signs and a floating control bar, plus a recognition, sentence and transcript column. Explicit camera start, with distinct states for permission requested, denied, no camera, camera in use, and error. On-device MediaPipe hand and pose tracking in a Web Worker, landmark overlay, framing guide, live framing hints, and camera selection. A typed WebSocket client with backoff and retry, verified against the live VOX service. Only accepted signs are shown as results: a low-confidence, unverified, unstable or resting candidate is shown as *Not recognised*, with the reason. Sentences are rebuilt into English (`toEnglish`) and can be spoken, with undo, clear, auto-finish after a pause, and a session log. |
| History | Both directions, with timestamp, input source, gloss, search and filter, replay (signs or speech), delete, clear all with confirmation, export to text, and an empty state. Retention: off, this tab only (default), or 1, 7 or 30 days on the device. Text only. |
| Settings | Voice language, auto-translate, signer defaults, speech output (voice, rate, test), camera and microphone permission status, preferred camera, overlay toggles, confidence threshold (80–95%), service address, text size, motion, history retention, delete history, reset settings. Every control has an effect. |
| Help | Getting started, camera tips, a searchable list of all 239 signs (with the 36 the camera recognises marked) linking to the signer, honest limits, privacy, recognition-service setup, keyboard reference. |
| Accessibility | Skip link, landmarks, one `h1` per page, labelled controls, visible focus rings, `aria-live` announcements, status shown by icon and text, native modal dialogs, arrow-key radio groups, 44px targets, reduced motion (system or in-app), text size up to 125%, and no horizontal scroll at 375px. |

**How it was checked:** `tsc -b` passes, oxlint reports 0 errors, and `vite build` succeeds. In the browser it was exercised at 1440, 1280, 768 and 375px widths: navigation, the translation flow, history persistence, the dialog, keyboard operation, and reduced motion. An automated audit on every page found only Geist, no italic or serif text, no monospace, no unnamed controls, and WCAG AA contrast for every colour pair used (4.5:1 for body text; large display text at 3:1 or better). The recognition contract (config ack, buffered, candidate with reason) was confirmed by streaming frames to the running VOX service.

### Not verified here

- **Live camera recognition end to end.** The in-app test browser blocks camera access, so the camera running → sign accepted path was not exercised with a real signer. The tracking worker and socket client come from VOX, and the message contract was verified separately.
- **Microphone input and spoken output.** These need a real microphone, speakers and a supported browser (Chrome, Edge or Safari for voice input).

### Needs the backend, or not built yet

- Sign recognition needs the VOX recognition service running. Without it, Parlance says the service is offline and keeps the camera and tracking working. Nothing is simulated.
- **Not implemented, and labelled as planned in the UI:** continuous signing recognition, reading facial grammar from the signer, fingerspelling, and Hindi or regional-language input.

### Notes

- `src/engine/` is VOX's engine (commit `1c588d4`), used unchanged apart from three cosmetic edits, each marked `Parlance:` in the code: garment colour, ghost colour, and a shadow-map type that three r185 deprecated.
- Yap & Render was used only as a functional reference. No code, styles, layout, copy or assets were taken.
- `npm audit` reports a dev-only ReDoS advisory in `picomatch`, which comes in through Vite's tooling. The available fix is a breaking Vite downgrade, so it was left alone. It does not ship in the built app.
- Statistics on the landing page come from ISLRTC (islrtc.nic.in), as verified for the submission deck.
