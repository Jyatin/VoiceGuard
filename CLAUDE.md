# CLAUDE.md — VoiceGuard Project Memory

> Persistent source of truth for this repository. Read this **first**, before opening any
> source file. Do not re-audit the repo. Keep this file updated (see §Token Efficiency
> Rules and §Change Log).
>
> Audit date: 2026-09-18 · Audit scope: full frontend + API-surface of backend.

---

## 1. PROJECT OVERVIEW

**VoiceGuard** — Real-Time AI Voice Deepfake & Anti-Spoofing Detector. Smart India
Hackathon 2026 project.

Problem: synthetic/cloned speech can reproduce a person's identity, tone and cadence well
enough to defeat voice-based trust (phone fraud, voice biometric auth, social engineering).
Humans cannot reliably hear the artifacts. VoiceGuard detects them acoustically.

Two usage modes:
- **Live interception** — stream microphone/VoIP audio and get a continuous REAL/FAKE verdict
  with sub-50ms model latency (lightweight model).
- **Forensic analysis** — upload a recording and get a deeper ensemble verdict plus
  waveform, mel-spectrogram and handcrafted acoustic statistics.

---

## 2. CURRENT TECH STACK

**Frontend**
- React 19.2 + TypeScript (~6.0), Vite 8, no router (single page, tab state)
- Tailwind CSS v4 via `@tailwindcss/vite` (no `tailwind.config.js`; theme lives in
  `src/index.css` under `@theme inline` + `:root` CSS vars)
- lucide-react (icons), recharts 3 (charts), wavesurfer.js 7 (waveform player)
- clsx + tailwind-merge available (currently barely used)
- oxlint for linting
- Fonts loaded via Google Fonts `<link>` in `index.html`: **Inter** (body) +
  **Instrument Serif** (display)

**Backend**
- Python 3.10+ , FastAPI + Uvicorn, WebSockets, `python-multipart`
- librosa / soundfile / scipy / numpy for DSP
- CORS: `allow_origins=["*"]`
- Served on port **8000**; frontend dev server on **5173**

**ML**
- `lightweight_antispoof.h5` | `.tflite` → live stream path (low latency)
- `fold_model_0.h5 … fold_model_N.h5` → multi-fold ensemble for uploads (forensic path)
- Architecture per `backend/models/config.json`: `LogMel-CNN-BiLSTM-Attention-Ensemble`,
  16 kHz, 3.0 s clips, 64 mels, 40 MFCC, `operating_threshold: 0.5`,
  `label_order: ["FAKE","REAL"]`
- **Real weights now present**: `backend/models/e4/best_e4.pt` — E4 Multi-Scale Raw-Waveform
  1D-CNN (PyTorch), loaded in-process by `model_loader.py`. Powers BOTH the live engine
  (single ~2 s chunk per WS message) and the forensic engine (full clip sliced into
  consecutive 2 s chunks, averaged). Operating threshold `0.44` on `fake_probability`
  (overrides `config.json`'s `0.5` when the E4 model loads). The old
  `lightweight_antispoof.h5/.tflite` + `fold_model_*.h5` discovery path and mock heuristic
  are kept as an automatic fallback if `torch` or the checkpoint aren't available.

---

## 3. PROJECT STRUCTURE (architecturally significant only)

```text
VoiceGuard-AI-3D-SIH2026/
├── README.md                      # product/feature description, quick start
├── START_VOICEGUARD.bat           # Windows launcher: backend venv + vite dev
├── run_app.bat
├── CLAUDE.md                      # ← this file
├── backend/
│   ├── main.py                    # FastAPI app: /, /health, /metrics, /predict, WS /predict-stream
│   ├── model_loader.py            # ModelManager: discovery, hot-swap, mock engine, inference
│   ├── feature_extraction.py      # log-mel / MFCC / spectral stats (librosa)
│   ├── metrics.json               # static evaluation metrics served by GET /metrics
│   ├── requirements.txt
│   └── models/
│       └── config.json            # thresholds, label order, DSP params (NO .h5/.tflite present)
└── frontend/
    ├── index.html                 # Instrument Sans / Inter Tight / IBM Plex Mono, trace favicon
    ├── vite.config.ts             # react + tailwind plugins, port 5173, host true
    ├── package.json
    └── src/
        ├── main.tsx               # entry → imports index.css, renders <App/>
        ├── App.tsx                # single-page narrative; owns health + last forensic result
        ├── index.css              # DESIGN SYSTEM: tokens + every semantic class
        ├── types.ts               # ALL API response types (unchanged contract)
        ├── lib/
        │   ├── api.ts             # the only place the backend URL is built
        │   └── signal.ts          # reference signal math + canvas helpers
        ├── hooks/
        │   ├── useHealth.ts       # /health poll (also drives backend hot-swap rescan)
        │   └── useInView.ts       # one-shot scroll trigger
        └── components/
            ├── LiveDetector.tsx       # mic + WS + verdict + visualizers (logic ported)
            ├── ForensicAnalyzer.tsx   # upload + WaveSurfer + mel canvas (logic ported)
            └── site/
                ├── Navigation.tsx, Hero.tsx, ProblemSection.tsx,
                ├── EngineComparison.tsx, AcousticSignals.tsx,
                ├── PerformanceSection.tsx, ArchitecturePipeline.tsx,
                ├── TechnicalDetails.tsx, SystemStatus.tsx,
                ├── FinalCTA.tsx (exports FinalCTA + Footer), Mark.tsx
```

---

## 4. COMPONENT MAP

| Component | Purpose | Important dependencies / notes |
| --- | --- | --- |
| `App.tsx` | Single-page narrative shell. Owns `useHealth()` and the last forensic result (passed to `AcousticSignals` so measured descriptors replace placeholders). No router, no tabs. | all sections; `PredictionResponse` |
| `lib/api.ts` | Only place the backend URL exists. `apiBase()` honours `VITE_API_BASE`, else same-host:8000. Exports `getHealth`, `getMetrics`, `postPredict`, `streamUrl`. | `types.ts` |
| `lib/signal.ts` | Reference signal math (`authenticSample`, `syntheticSample`), `envelope`, `spectrum`, `fitCanvas` (DPR-aware), `drawTrace`, `prefersReducedMotion`. Shared by hero, problem section and demo presets so all three agree. | — |
| `hooks/useHealth.ts` | 6 s `/health` poll → `{health, online, isMock}`. The interval also triggers the server-side model rescan, so it is load-bearing. | `lib/api` |
| `hooks/useInView.ts` | One-shot IntersectionObserver for the pipeline and ROC reveals. | — |
| `site/Navigation.tsx` | Sticky minimal nav, hairline appears on scroll, working mobile sheet with `aria-expanded`. | — |
| `site/SystemStatus.tsx` | Always-visible honest state: unreachable / demo mode / weights loaded. Replaces `DemoBanner`. | `SystemHealth` |
| `site/Hero.tsx` | Headline + the dark reference-trace scope (animated, labelled as not a verdict). | `lib/signal` |
| `site/ProblemSection.tsx` | "A convincing voice is no longer proof of identity." Authentic vs synthetic spectrum plots computed in-browser. | `lib/signal` |
| `site/EngineComparison.tsx` | Live vs forensic engine split; reads real `ensemble_folds` / `lightweight_loaded` / threshold from health. | `SystemHealth` |
| `components/LiveDetector.tsx` | **Live engine.** Audio graph + WS contract ported verbatim from `LiveDetection.tsx`; only change is the zero-gain sink. Verdict, confidence bar, latency, level, timeline. | Web Audio API, `WebSocket`, `lib/api`, `lib/signal` |
| `site/AcousticSignals.tsx` | Five descriptors with SVG glyphs; shows measured values once a forensic result exists, `no measurement yet` otherwise. | `AcousticStats` |
| `components/ForensicAnalyzer.tsx` | **Forensic engine.** Upload/drop → `postPredict`; WaveSurfer lifecycle + `<audio>` fallback; mel canvas (new teal→cyan colormap, low bands at bottom); two synthesised presets through the real endpoint. | wavesurfer.js, Canvas 2D, `lib/api`, `lib/signal` |
| `site/PerformanceSection.tsx` | `/metrics` → four figures, AUC/EER/clip count, confusion rows, hand-drawn SVG ROC with draw-in, robustness hairline bars. No recharts. | `lib/api`, `useInView` |
| `site/ArchitecturePipeline.tsx` | Seven-stage pipeline, stages light in sequence on first scroll into view. | `useInView` |
| `site/TechnicalDetails.tsx` | Real-time vs forensic path, `<details>` blocks for interface, implementation and known limits. Shows the live endpoint in use. | `lib/api` |
| `site/FinalCTA.tsx` | Closing CTA and `Footer` (both exported from this file). | `Mark` |
| `site/Mark.tsx` | Wordmark glyph: a signal trace inside a shield outline. | — |

## 5. API CONTRACT

Base URL is built at call time as
`${window.location.protocol}//${window.location.hostname}:8000` (hard-coded port 8000, no
env var, no service layer — each component builds its own URL). WS uses `ws:`/`wss:` per
page protocol.

### `GET /health` — polled by `App.tsx` every 6 s
```json
{ "status": "healthy", "is_mock": true, "operating_threshold": 0.5,
  "ensemble_folds": 0, "lightweight_loaded": false }
```
Also triggers `model_manager.check_for_models()` server-side → this is the hot-swap rescan
hook (also called before each inference). `is_mock` here drives the whole UI's demo state.

### `POST /predict` — multipart, field name **`file`** (.wav/.mp3)
Response (`PredictionResponse` in `types.ts`):
```json
{ "label": "REAL|FAKE", "confidence": 0.942, "prob_real": 0.942,
  "waveform": [ ... ], "mel_spectrogram": [[ ... ]],
  "stats": { "centroid":0, "bandwidth":0, "rolloff":0, "zcr":0, "flatness":0 },
  "latency_ms": 38.2, "is_mock": false,
  "model_type": "Ensemble (5 Folds)", "audio_duration_sec": 3.0 }
```

### `WS /predict-stream` — live path
- Client sends **raw binary `Float32Array` buffer**, 16 kHz mono.
- Current client chunking: buffer 24 000 samples (1.5 s) then send, advancing 16 000
  samples (1.0 s) → ~0.5 s overlap.
- Server replies per chunk (`StreamPrediction`):
```json
{ "label":"REAL", "prob_real":0.895, "confidence":0.895,
  "latency_ms":18.5, "is_mock":false, "timestamp":1789042063.68 }
```

### `GET /metrics` — served from `backend/metrics.json`
Keys: `accuracy, precision, recall, f1, eer, auc, total_test_samples,
confusion_matrix{matrix,labels,true_real,false_fake,false_real,true_fake},
roc_curve{fpr[],tpr[]}, robustness[{condition,tag,accuracy,description}], ensemble_note`.
Current values: acc .9642, prec .9587, rec .9715, f1 .9651, EER .0358, AUC .9892.
Robustness conditions: Clean .982 / Additive Noise 10 dB .945 / High Noise 0 dB .887 /
Telephone .913 / Low-bitrate MP3 .928 / Short Utterance .864.

### Mock / demo behaviour
`ModelManager` scans `backend/models/` for weights on startup, on `/health`, and before
each inference. If none found it never crashes — it runs a signal-informed mock predictor
(energy + acoustic stats → probabilistic output) and sets `is_mock: true` everywhere.
Dropping real `.h5`/`.tflite` files into `backend/models/` activates real inference within
one rescan, no restart.

---

## 6. IMPORTANT EXISTING FUNCTIONALITY (works — do not rediscover, do not rebuild)

**Live path (`LiveDetection.tsx`)**
- `getUserMedia({ channelCount:1, echoCancellation:true, noiseSuppression:false, autoGainControl:true })`
- `new AudioContext({ sampleRate: 16000 })` → `createMediaStreamSource`
- `createAnalyser()` with `fftSize: 128`, `smoothingTimeConstant: 0.8` → FFT bar canvas
- `createScriptProcessor(4096,1,1)` → accumulates Float32 PCM, computes RMS
  (`audioLevel = min(1, rms*5)`), keeps a 200-sample rolling waveform buffer, and ships
  24 000-sample chunks over the WS with 16 000-sample stride
- processor is connected to `audioCtx.destination` (required for it to fire)
- WS lifecycle with `wsStatus: 'disconnected'|'connecting'|'connected'`, reconnect on start
- `stopListening()` cancels both rAF loops, stops tracks, closes AudioContext and WS; also
  wired to unmount cleanup
- state: `isListening`, `prediction`, `history[]`, `wsStatus`, `errorMsg`, `audioLevel`

**Forensic path (`UploadAnalyze.tsx`)**
- drag/drop + file picker → `handleFileUpload(File)` → FormData `file` → `POST /predict`
- WaveSurfer instance created/destroyed on `audioUrl` change, wrapped in try/catch with a
  hidden `<audio>` element as fallback; play/pause, restart, `currentTime`/`duration`
- mel-spectrogram drawn on Canvas 2D from `result.mel_spectrogram` with a custom
  `getCyberColor(norm)` colormap and per-row min/max normalisation
- **two synthesized demo presets** (`generatePresetAudio(isFake)`): builds a 3 s 16 kHz
  AudioBuffer in-browser (145 Hz harmonic+vibrato "authentic" vs 280 Hz square-buzz +
  phase-glitch "deepfake"), converts via hand-rolled `audioBufferToWavBlob()`, and pushes
  it through the *real* `/predict` endpoint. Labelled "Load Authentic Voice" / "Load
  Deepfake Voice". These are synthetic *inputs*, not faked outputs — keep that property.
- acoustic stat cards from `result.stats`; verdict + confidence + latency + model type

**Performance path (`ModelPerformance.tsx`)**
- fetches `/metrics` on mount, loading + error states, maps `roc_curve` → recharts
  `LineChart` (TPR vs FPR, plus diagonal reference line) and `robustness` → vertical-layout
  `BarChart`; KPI values formatted `(x*100).toFixed(1)`

**Global**
- `/health` polling → `isMock` / `isOnline` → DemoBanner + status pills
- demo-mode honesty: mock predictions are always labelled as such

---

## 7. DO NOT BREAK

- **Endpoints**: `GET /health`, `GET /metrics`, `POST /predict` (multipart field `file`),
  `WS /predict-stream`. Do not rename, do not proxy away port 8000 without updating all
  four call sites.
- **WS payload format**: raw binary Float32 16 kHz mono. Do not switch to JSON/base64.
  Keep the 1.5 s window / 1.0 s stride semantics unless explicitly asked.
- **Audio graph**: 16 kHz AudioContext, mono constraint, ScriptProcessor connected to
  destination, analyser `fftSize` 128. Replacing ScriptProcessor with AudioWorklet is a
  *deliberate* change, not a drive-by refactor.
- **Cleanup**: track stop + AudioContext close + WS close on stop and on unmount. Leaking
  these leaves the mic light on.
- **WaveSurfer create/destroy effect** and the `<audio>` fallback.
- **`types.ts`** is the shared contract with the backend — extend, don't rewrite field names.
- **Mock/demo indication** must remain visible whenever `is_mock` is true.
- **Real API values** must be used in the UI. Never substitute hardcoded numbers when the
  API is reachable.
- Backend files are out of scope for the redesign task.

---

## 8. CURRENT UI (post-redesign)

Single page, no router, no tabs. Order: `SystemStatus` strip → `Navigation` → Hero →
Problem → Engines → **Live detector** (dark) → Acoustic descriptors → **Forensic analyzer**
→ Performance (dark) → Architecture (dark) → Technical depth → Final CTA → Footer.
Nav anchors: `#product #detector #signals #performance #method` (+ `#forensics`,
`#architecture`, `#top`).

Visual language: paper `#f1f2ef` narrative bands separated by 1px rules; dark `#0d1113`
scope panels wherever the system measures; Instrument Sans display with tight tracking;
IBM Plex Mono reserved for measured values; one teal accent; verdict colour only on the
verdict itself. No gradients, no glow, no glassmorphism, no card grid, no 3D tilt, no
custom cursor.

The old tab dashboard, hero banner, `DemoBanner`, `Navbar` and `custom-cursor` are gone.

## 9. REDESIGN DIRECTION (implemented 2026-09-18 — kept for intent)

Goal: turn the tab dashboard into a **premium editorial product introduction page** that
progressively reveals the technology, then hands off to the working detector. It must read
as built by a real product/design team — Linear / Vercel / Stripe / research-lab quality —
"serious enough to protect a financial institution", not a student dashboard.

Personality: precise, quiet, technical, trustworthy, research-driven, defensive, premium.

Intended narrative order (from the brief):
`01` minimal nav → `02` hero ("Know when a voice isn't real." + restrained live signal
visual with technical annotations) → `03` problem ("A convincing voice is no longer proof
of identity.") with authentic-vs-synthetic signal comparison → `04` dual-engine split
(Live Engine / Forensic Engine) → `05` live detector module ("Listen. Analyze. Decide.") →
`06` acoustic fingerprints ("The voice leaves fingerprints.") — centroid, bandwidth,
rolloff, ZCR, flatness → `07` forensic analyzer ("Go deeper when the call is over.") with
the mel-spectrogram as a centerpiece → `08` performance as a research instrument, not KPI
cards → `09` animated "From waveform to verdict." pipeline → `10` technical depth →
`11` demo-mode system status (honest, never hidden) → `12` final CTA ("Hear what the human
ear misses.") → footer.

Design system to establish before building:
- **Type**: one premium sans (Geist / Satoshi / Instrument Sans / Inter Tight) + one
  technical mono (Geist Mono / JetBrains Mono / IBM Plex Mono). Explicit scale with
  tight display tracking and 1.5–1.7 body line-height. Type carries the design.
- **Color**: warm off-black / white / soft grays / muted borders + **one** restrained
  accent (muted electric blue-cyan), used sparingly. Restrained green for REAL, restrained
  red for FAKE — status only, never page-wide. WCAG AA contrast.
- **Layout**: editorial grid, asymmetric compositions, 1200–1400px max width, generous
  whitespace, sections that vary in rhythm. Not heading+3 cards, repeated.
- **Motion**: intentional only — fade/vertical reveals, waveform movement, signal flowing
  through the pipeline on scroll-in, chart draw, number counters, button micro-interactions,
  navbar transform on scroll. Respect `prefers-reduced-motion`.
- **Responsive**: mobile-first, verified at 375 / 768 / 1024 / 1440. Detector controls must
  stay usable; ≥44px tap targets; no horizontal scroll.

Hard bans (from the design standards doc): purple/violet/indigo as brand, purple-blue-pink
gradients, gradient-filled headline words, meaningless stat rows, emoji in headings, "Why
Choose us" sections, default glassmorphism, pill-badge clutter, centered-everything layout,
unstyled Inter as the entire type system, drop-shadow-on-everything. Also out: neon glow
borders, giant glowing cards, decorative blobs, generic AI illustrations, icon circles,
excessive rounding, dashboard-everything-at-once.

Planned component decomposition (reusing existing logic, not duplicating it):
`Navigation`, `Hero`, `AudioSignal`, `ProblemSection`, `EngineComparison`, `LiveDetector`,
`AcousticSignals`, `ForensicAnalyzer`, `PerformanceSection`, `ArchitecturePipeline`,
`TechnicalDetails`, `DemoStatus`, `FinalCTA`, `Footer`. Keep UI / state / API / audio
processing / visualization separated; a small `services/api.ts` + audio hooks
(`useMicStream`, `useMetrics`) are the natural place to lift the current inline logic.

---

## 10. DESIGN DECISIONS

_(Append decisions here as they are made — date, decision, rationale.)_

- **2026-09-18 — Paper page, dark instruments.** The narrative surfaces are warm-neutral
  paper (`--paper #f1f2ef`); every surface where the system actually measures something
  (hero trace, live detector, mel spectrogram, ROC, pipeline) is a dark "scope"
  (`--scope #0d1113`). This contrast is the page's signature move and replaces glow,
  gradients and 3D tilt as the source of visual interest. Rationale: the old all-dark +
  cyan-glow treatment is the exact "AI cybersecurity dashboard" read the brief rejects;
  light narrative / dark instrument is grounded in signal-analysis equipment.
- **2026-09-18 — Typography.** Instrument Sans (display + UI, 600/500), Inter Tight (long
  copy), IBM Plex Mono (measured values, machine annotations, eyebrows only). Mono is
  *reserved* for values the system produced — it is a signal, not decoration.
- **2026-09-18 — One accent.** `--accent #0e6c80` on paper, `--accent-bright #2fb6c9` on
  scope surfaces. Verdict colours (`--real #2e6b4f`, `--fake #a33a2b` and their bright
  variants) appear on the verdict word, the confidence bar and status LEDs only.
- **2026-09-18 — Motion budget.** Exactly three non-user-triggered moments: the hero
  reveal, the hero reference trace, and the architecture pipeline + ROC draw-in on first
  scroll into view. Everything else moves only in response to a click or real audio. All
  gated on `prefers-reduced-motion`.
- **2026-09-18 — Semantic CSS, not utility soup.** New components use the semantic classes
  in `index.css` (`.band`, `.scope`, `.specs`, `.sig`, `.figure`, `.readout`…) plus a few
  inline one-offs. Tailwind v4 stays installed and imported but is no longer load-bearing;
  the token system in `index.css` is the source of truth.
- **2026-09-18 — Charts hand-drawn.** The ROC is an inline SVG polyline and robustness is
  hairline bars; recharts is no longer imported. Reason: recharts' default chrome is the
  generic-dashboard look, and the data is simple enough to draw exactly.
- **2026-09-18 — Honesty surfaces.** The hero trace is labelled a reference trace and never
  shows a model verdict; the demo presets are labelled as synthesised test signals (they
  still go through the real `POST /predict`); `SystemStatus` states plainly when the
  fallback engine is answering. No hardcoded metric appears anywhere — `/metrics` drives
  the performance section, and missing data renders as `—`.
- **2026-09-18 — Silent processor sink (behaviour change).** `ScriptProcessorNode` now
  drains into a zero-gain `GainNode` before `destination` instead of straight into the
  speakers. Keeps the processor scheduled (required) while removing the mic-feedback path.
  This is the only intentional change to the audio graph.

---

## 11. IMPLEMENTATION STATUS

```text
[x] Project audit
[x] Memory file (CLAUDE.md)
[x] New visual system (type scale, color tokens, spacing)
[x] Navigation (sticky, working mobile sheet)
[x] Hero (+ reference trace scope)
[x] Product story (problem + dual engine)
[x] Live detector (logic ported, new instrument UI)
[x] Forensic analysis (logic ported, spectrogram centrepiece)
[x] Performance (hand-drawn ROC + robustness)
[x] Architecture pipeline (scroll-triggered)
[x] Technical depth + system status
[x] Final CTA + footer
[x] Responsive design (CSS written mobile-first; NOT yet verified in a browser)
[x] Animation (three moments, reduced-motion gated)
[x] Dead code removal
[ ] Run `npm install && npm run dev` and review in a browser at 375/768/1024/1440
[ ] Final polish after that review
```

---

## 12. KNOWN ISSUES / TECHNICAL DEBT

0. **The redesign has never been run.** It was authored without `node_modules` available,
   so there has been no `tsc -b`, no Vite build and no browser render. A syntax/type pass
   with a standalone `tsc` came back clean apart from missing-module noise, but the first
   local run may still surface small layout or import issues. Review at 375 / 768 / 1024 /
   1440 px before showing anyone.
1. ~~No model weights in repo.~~ **Fixed 2026-09-18** — real E4 weights wired in
   (`backend/models/e4/best_e4.pt`). Verdicts are now live model output, not mock, whenever
   torch + the checkpoint load successfully. `metrics.json` (accuracy/EER/ROC/robustness on
   the Performance section) is still a static file, not computed from this checkpoint —
   replace it with a real eval of `best_e4.pt` before presenting those numbers as fact.
2. ~~No API service layer.~~ **Fixed** — all calls go through `src/lib/api.ts`, which reads
   `VITE_API_BASE` and falls back to same-host:8000.
3. ~~Dead code.~~ **Removed** — `Navbar.tsx`, `App.css`, `src/assets/`, `public/`,
   `gen_cursor.py`, and the four superseded tab components.
4. **`ScriptProcessorNode` is deprecated** — works today; AudioWorklet is the modern path
   and is the next real refactor. The feedback path is now fixed (zero-gain sink).
5. **AudioContext `sampleRate: 16000` is not honoured by all browsers** (notably Safari),
   so PCM sent to the model may not actually be 16 kHz there. No client-side resample guard.
6. **No WS reconnect/backoff** — if the socket drops mid-session, streaming silently stops
   until the user toggles the mic.
7. **No `.gitignore` discipline for the archive**: `package-lock.json` present but
   `node_modules`/`venv` absent — fresh `npm install` + venv setup required.
8. ~~Accessibility gaps.~~ **Largely fixed** — `:focus-visible` outlines, `role="img"` +
   `aria-label` on every canvas, `prefers-reduced-motion` honoured, 44px minimum tap
   targets, real `<button>`/`<input>` semantics. Not yet screen-reader tested.
9. ~~Custom cursor.~~ **Removed.**
10. **`START_VOICEGUARD.bat` assumes** `backend/venv/Scripts/python.exe` exists and Windows.
11. ~~Unsupported benchmark claims in the hero~~ ("ASVspoof 2021", "<25 ms latency") —
    **removed** with the old hero. Do not reintroduce a claim the repo cannot evidence.
12. **Recharts is still a dependency** but no longer imported. Safe to drop from
    `package.json` if you want a smaller install.

---

## TOKEN EFFICIENCY RULES (in force from now on)

1. **Do not rescan the repository.** No broad `find .`, `ls -R`, `tree`, `grep -R` unless
   genuinely necessary. This file is the map.
2. **Do not reread files without a reason.** Ask "do I need new information from this file?"
3. **Targeted inspection**: locate the file in §3/§4 → open only that file → read only the
   relevant section → change → test.
4. **Maintain this memory.** New component, changed API, new dependency, design-system
   decision, important fix or limitation → update the relevant section here.
5. **Change log** at the bottom, concise entries.
6. **Don't duplicate context** already written here; reference it.
7. **Never inspect** `node_modules`, `dist`, build output, caches, lockfiles (unless
   debugging dependencies).
8. **Don't touch the backend** unless the task requires it. Current work is frontend.
9. **Batch work in phases**: inspect → understand → plan → implement → test → update memory.
10. **Keep terminal output focused** — `grep`/`sed` on a specific file beats printing
    directories or whole files.

---

## CHANGE LOG

### 2026-09-18 (model integration)
- Wired the real trained model (`audio-deepfake-e4` project's E4 Multi-Scale Raw-Waveform
  CNN, `best_e4.pt`) into the backend in-process (no second server, no port conflict with
  the standalone ML microservice described in that project's own
  `BACKEND_INTEGRATION_GUIDE.md`).
- Added `backend/models/e4/{e4_model.py,best_e4.pt}`; `model_loader.py` loads it first and
  now exposes `_run_e4_chunk`, `_predict_e4_live`, `_predict_e4_full`. Falls back to the old
  h5/tflite discovery, then the mock heuristic, if torch or the checkpoint are unavailable.
- `predict_lightweight` (live, WS) and `predict_ensemble` (forensic, upload) both route
  through E4 when loaded; response shape (`label`, `confidence`, `prob_real`, `is_mock`,
  `model_type`) is unchanged so the frontend needed no contract changes.
- `main.py` `/predict` now passes the **full** decoded clip into `predict_ensemble` (was
  the 3 s-truncated `fixed_audio`) so forensic analysis covers the whole recording in 2 s
  chunks; waveform/mel/stats for display still use the existing 3 s window, unchanged.
- `/health` gained `engine` (model name when E4 is loaded, else `null`); `lightweight_loaded`
  is now `true` when E4 is loaded too.
- Frontend: `types.ts` SystemHealth gained `engine?`; `SystemStatus.tsx` and
  `EngineComparison.tsx` now describe the actual single E4 model (instead of the
  speculative CNN-BiLSTM / multi-fold-ensemble copy) when `health.engine` is set, and fall
  back to the old copy otherwise. No other frontend files touched.
- `requirements.txt`: added `torch>=2.2.0`.
- Verified: `python -m py_compile` on `main.py`/`model_loader.py`, and a full
  `tsc -b && vite build` of the frontend — both clean. Did **not** install `torch` or run
  the model in this environment; do that locally with `pip install -r requirements.txt` and
  hit `/health` to confirm `"engine": "E4 Multi-Scale Raw-Waveform CNN"`.

### 2026-09-18
- One-time strategic audit of frontend (+ backend API surface only).
- Created `CLAUDE.md`: overview, stack, structure, component map, API contract, existing
  functionality, do-not-break list, current UI, redesign direction, status checklist,
  known issues, token-efficiency rules.
- **Frontend redesign implemented.** New design system in `index.css`; new single-page
  narrative in `App.tsx`; 11 new `site/` components; `LiveDetector` and `ForensicAnalyzer`
  ported from the old tab components with audio/WS/upload behaviour intact.
- Added `lib/api.ts` (single backend URL, `VITE_API_BASE`), `lib/signal.ts`,
  `hooks/useHealth.ts`, `hooks/useInView.ts`.
- Removed: `LiveDetection.tsx`, `UploadAnalyze.tsx`, `ModelPerformance.tsx`, `About.tsx`,
  `DemoBanner.tsx`, `Navbar.tsx`, `ui/responsive-hero-banner.tsx`, `ui/custom-cursor.tsx`,
  `App.css`, `src/assets/`, `public/`, `gen_cursor.py`.
- Replaced `index.html` (new typefaces, new favicon, no dark body classes).
- Backend untouched. API contract untouched. `types.ts` untouched.
- Not yet run in a browser — see Known issues item 0.
