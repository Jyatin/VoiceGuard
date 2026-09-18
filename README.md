# VoiceGuard 🛡️

### E4 Multi-Scale Raw-Waveform CNN for AI Voice Deepfake Detection

VoiceGuard is an end-to-end audio deepfake detection application that combines a Python/FastAPI inference backend with a React + TypeScript web interface. It is designed to analyze speech recordings, expose model and signal-level evidence, and provide an interactive interface for real-time and forensic-style audio analysis.

> **Current model engine:** E4 Multi-Scale Raw-Waveform CNN  
> **Backend:** FastAPI + Uvicorn  
> **Frontend:** React 19 + TypeScript + Tailwind CSS v4  
> **Audio processing:** NumPy, SciPy, librosa, SoundFile  
> **API:** REST + WebSocket

---

## ✨ What VoiceGuard Does

VoiceGuard is built around a simple workflow:

```text
Audio Input
    │
    ├── Microphone stream ──► WebSocket inference
    │
    └── Audio file ─────────► REST inference
                                  │
                                  ▼
                       Audio preprocessing
                                  │
                                  ▼
                    E4 raw-waveform CNN engine
                                  │
                                  ▼
                    REAL / FAKE + confidence
                                  │
                                  ▼
                Waveform + acoustic evidence + UI
```

The application exposes both **model output** and **supporting acoustic information**, making it useful for demonstrations, experimentation, and research-oriented audio-forensics workflows.

---

## 🚀 Features

### Real-Time Detection

- Microphone capture through the browser Web Audio API.
- Low-latency WebSocket communication with the FastAPI backend.
- Rolling waveform visualization.
- Live frequency-domain visualization.
- REAL / FAKE verdict display.
- Confidence and probability readouts.
- Inference latency display.
- Rolling inference history.

### Forensic Audio Analysis

- Audio file upload and analysis.
- WAV / MP3 workflow support in the frontend.
- Interactive waveform playback with WaveSurfer.js.
- Mel-spectrogram visualization.
- Acoustic signal statistics including:
  - Spectral centroid
  - Spectral bandwidth
  - Spectral rolloff
  - Zero-crossing rate
  - Spectral flatness
- Model result and latency information returned by the API.

### Model & System Monitoring

- Backend health endpoint.
- Model-loaded status.
- Mock-vs-real inference status.
- Operating threshold reporting.
- Configurable metrics endpoint.
- Dedicated technical and architecture sections in the UI.

---

## 🧠 Detection Engine

The current backend is configured around the **E4 Multi-Scale Raw-Waveform CNN**.

Unlike a UI-only demo, the repository contains the Python inference pipeline, model loader, feature extraction utilities, model implementation, configuration, and trained E4 checkpoint.

The backend health response reports the active engine and whether inference is running in mock or real mode.

Example health response:

```json
{
  "status": "healthy",
  "is_mock": false,
  "operating_threshold": 0.5,
  "ensemble_folds": 0,
  "lightweight_loaded": true,
  "engine": "E4 Multi-Scale Raw-Waveform CNN"
}
```

A healthy response with `"is_mock": false` indicates that the backend is not using its fallback mock inference path.

---

## 🏗️ System Architecture

```text
┌────────────────────────────────────────────────────────────┐
│                        VoiceGuard UI                       │
│              React 19 · TypeScript · Tailwind v4          │
│                                                            │
│  Live Detector │ Forensic Analyzer │ Metrics │ Technical   │
└────────────────────────────┬───────────────────────────────┘
                             │
                     HTTP / WebSocket
                             │
                             ▼
┌────────────────────────────────────────────────────────────┐
│                     FastAPI Backend                        │
│                                                            │
│  /health     /metrics     /predict     /predict-stream     │
└────────────────────────────┬───────────────────────────────┘
                             │
                             ▼
┌────────────────────────────────────────────────────────────┐
│                  Audio Processing Layer                    │
│                                                            │
│  Load → Resample → Clip/Pad → Log-Mel / Signal Statistics │
└────────────────────────────┬───────────────────────────────┘
                             │
                             ▼
┌────────────────────────────────────────────────────────────┐
│                  E4 Model Manager                          │
│                                                            │
│       Multi-Scale Raw-Waveform CNN + checkpoint            │
└────────────────────────────┬───────────────────────────────┘
                             │
                             ▼
                   Classification Result
                  REAL / FAKE + confidence
```

---

## 🛠️ Tech Stack

### Frontend

- **React 19**
- **TypeScript**
- **Tailwind CSS v4**
- **Lucide React** for icons
- **Recharts** for data visualization
- **WaveSurfer.js** for waveform playback
- **Web Audio API** for microphone/audio capture
- **Vite configuration** for the frontend toolchain
- **Oxlint** for linting

### Backend

- **Python 3.10+**
- **FastAPI**
- **Uvicorn**
- **WebSockets**
- **NumPy**
- **SciPy**
- **librosa**
- **SoundFile**

### Machine Learning

- **E4 Multi-Scale Raw-Waveform CNN**
- Raw audio waveform inference
- Model checkpoint loading through the backend model manager
- Configurable operating threshold
- Signal preprocessing and feature extraction

---

## 📁 Project Structure

```text
VoiceGuard/
│
├── backend/
│   ├── main.py                    # FastAPI application and API endpoints
│   ├── model_loader.py            # Model discovery/loading and inference manager
│   ├── feature_extraction.py      # Audio loading and signal processing
│   ├── metrics.json               # Model/application metrics
│   ├── requirements.txt            # Python dependencies
│   │
│   └── models/
│       ├── config.json             # Model configuration / threshold
│       └── e4/
│           ├── e4_model.py         # E4 model implementation
│           └── best_e4.pt          # E4 trained checkpoint
│
├── frontend/
│   ├── package.json
│   ├── package-lock.json
│   ├── index.html
│   ├── vite.config.ts
│   ├── tsconfig.json
│   │
│   └── src/
│       ├── App.tsx
│       ├── main.tsx
│       ├── index.css
│       ├── types.ts
│       │
│       ├── components/
│       │   ├── LiveDetector.tsx
│       │   ├── ForensicAnalyzer.tsx
│       │   └── site/
│       │       ├── Hero.tsx
│       │       ├── Navigation.tsx
│       │       ├── AcousticSignals.tsx
│       │       ├── ArchitecturePipeline.tsx
│       │       ├── EngineComparison.tsx
│       │       ├── PerformanceSection.tsx
│       │       ├── ProblemSection.tsx
│       │       ├── SystemStatus.tsx
│       │       ├── TechnicalDetails.tsx
│       │       ├── FinalCTA.tsx
│       │       └── Mark.tsx
│       │
│       ├── hooks/
│       │   ├── useHealth.ts
│       │   └── useInView.ts
│       │
│       └── lib/
│           ├── api.ts
│           └── signal.ts
│
├── START_VOICEGUARD.bat
├── run_app.bat
├── CLAUDE.md
└── README.md
```

---

## 💻 Prerequisites

Install the following before running VoiceGuard locally:

- **Python 3.10+**
- **Node.js + npm**
- A modern Chromium, Firefox, or Edge browser for microphone access
- Git

For real E4 inference, the required model checkpoint must be available under:

```text
backend/models/e4/best_e4.pt
```

---

## ⚡ Quick Start

### 1. Clone the repository

```bash
git clone https://github.com/Jyatin/VoiceGuard.git
cd VoiceGuard
```

### 2. Backend setup

Open a terminal in the repository root:

```powershell
cd backend
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
```

Start the API:

```powershell
uvicorn main:app --reload --port 8000
```

The backend should be available at:

```text
http://127.0.0.1:8000
```

Interactive API documentation:

```text
http://127.0.0.1:8000/docs
```

### 3. Frontend setup

Open a second terminal:

```powershell
cd frontend
npm install
npm run dev
```

If Windows PowerShell blocks `npm.ps1`, use:

```powershell
npm.cmd install
npm.cmd run dev
```

> The repository currently contains Vite frontend configuration. If the local `package.json` development script is changed during development, use the script defined in the current checkout rather than assuming a fixed dev-server port.

---

## 🩺 Verify the Backend

The fastest way to verify the backend is running is:

```powershell
curl http://127.0.0.1:8000/health
```

PowerShell may display an `Invoke-WebRequest` security prompt when `curl` is used as an alias. You can avoid that prompt with:

```powershell
curl.exe http://127.0.0.1:8000/health
```

A real E4 deployment should report values similar to:

```json
{
  "status": "healthy",
  "is_mock": false,
  "operating_threshold": 0.5,
  "lightweight_loaded": true,
  "engine": "E4 Multi-Scale Raw-Waveform CNN"
}
```

---

# 📡 API

## `GET /`

Returns basic service information and the current inference mode.

## `GET /health`

Reports backend and model health.

Important fields:

| Field | Meaning |
|---|---|
| `status` | Backend health status |
| `is_mock` | Whether fallback/mock inference is active |
| `operating_threshold` | Classification threshold |
| `ensemble_folds` | Number of loaded ensemble folds |
| `lightweight_loaded` | Whether the active inference model is loaded |
| `engine` | Active model engine |

## `POST /predict`

Accepts an uploaded audio file and performs forensic-style inference.

Typical response fields include:

```json
{
  "label": "REAL",
  "confidence": 0.942,
  "prob_real": 0.942,
  "latency_ms": 38.2,
  "is_mock": false,
  "audio_duration_sec": 3.0
}
```

The response can also contain visualization data and extracted signal statistics used by the frontend.

## `WS /predict-stream`

Provides real-time inference over a WebSocket connection.

The browser streams audio data and receives model predictions containing fields such as:

```json
{
  "label": "REAL",
  "prob_real": 0.895,
  "confidence": 0.895,
  "latency_ms": 18.5,
  "is_mock": false,
  "timestamp": 1789042063.68
}
```

## `GET /metrics`

Returns the metrics stored by the backend for display in the performance section.

---

# 🔬 Audio Analysis

VoiceGuard's preprocessing and visualization pipeline works with several complementary representations.

### Raw waveform

The E4 engine operates on raw audio waveform information rather than requiring the frontend to construct a model-specific spectrogram representation.

### Log-Mel representation

The backend also exposes log-Mel information for visualization and acoustic analysis.

### Signal statistics

The UI can display statistics such as:

- **Spectral centroid** — frequency-weighted center of spectral energy.
- **Spectral bandwidth** — spread of spectral energy around the centroid.
- **Spectral rolloff** — frequency below which a selected proportion of spectral energy lies.
- **Zero-crossing rate** — rate at which the waveform changes sign.
- **Spectral flatness** — indication of how noise-like or tonal a spectrum is.

These measurements are presented as supporting evidence and should not be interpreted as independent proof of synthetic speech.

---

# 📊 Model Metrics

The repository contains a `backend/metrics.json` file consumed by the API.

The current application exposes metrics such as:

- Accuracy
- Precision
- Recall
- F1 score
- Equal Error Rate (EER)
- Area Under the ROC Curve (AUC)
- Confusion matrix
- ROC curve data
- Robustness benchmark information

**Important:** Reported metrics are dataset/evaluation dependent. They should not be interpreted as universal real-world detection accuracy. When presenting VoiceGuard in a research, academic, or competition setting, always state the evaluation dataset, split, protocol, and conditions associated with the numbers.

---

# 🧪 Mock / Fallback Mode

The backend contains a fallback path for environments where the required neural model is unavailable.

The API exposes this state through:

```json
"is_mock": true
```

When the E4 checkpoint is successfully loaded, the API reports:

```json
"is_mock": false
```

For demonstrations or evaluation, verify the `/health` response before claiming that a prediction was produced by the E4 model.

---

# 🎨 Frontend Modules

The frontend is organized around several application sections.

### Live Detector

The real-time interface provides microphone capture, streaming inference, waveform/frequency visualization, verdict information, confidence, latency, and inference history.

### Forensic Analyzer

The upload workflow provides audio selection, waveform playback, spectrogram visualization, signal statistics, and model results.

### Technical Site Sections

The landing/application experience also contains dedicated sections for:

- Problem definition
- Acoustic signals
- Architecture pipeline
- Engine comparison
- Performance
- System status
- Technical details
- Final call-to-action

This keeps the product interface useful both as an interactive detector and as a technical demonstration of the system architecture.

---

# 🔐 Browser Permissions

Real-time microphone detection requires browser permission to access the microphone.

When prompted, select **Allow**.

For production deployment, serve the frontend over HTTPS because browser media APIs have secure-context requirements in many deployment scenarios.

---

# 🧰 Development Workflow

### Backend

```powershell
cd backend
.\venv\Scripts\activate
uvicorn main:app --reload --port 8000
```

### Frontend

```powershell
cd frontend
npm install
npm run dev
```

### Check backend health

```powershell
curl.exe http://127.0.0.1:8000/health
```

### Check Git state

```powershell
git status
git log --oneline -5
```

---

# 🐛 Troubleshooting

### `curl` shows an Invoke-WebRequest warning on Windows

Use:

```powershell
curl.exe http://127.0.0.1:8000/health
```

instead of the PowerShell `curl` alias.

### Backend cannot find the model

Verify that the E4 checkpoint exists at:

```text
backend/models/e4/best_e4.pt
```

Then restart the backend and check `/health`.

### Microphone does not work

Check:

1. Browser microphone permission.
2. Correct input device.
3. Browser secure-context requirements.
4. Browser console errors.
5. Backend availability on port `8000`.

### Frontend cannot reach the API

Confirm the backend is running:

```powershell
curl.exe http://127.0.0.1:8000/health
```

Then inspect the API configuration in:

```text
frontend/src/lib/api.ts
```

### `npm` is blocked by PowerShell execution policy

Use:

```powershell
npm.cmd install
npm.cmd run dev
```

---

# ⚠️ Limitations & Responsible Use

VoiceGuard is a research/software project and should not be treated as an infallible authenticity oracle.

Detection performance can vary with:

- Recording devices
- Codecs and compression
- Background noise
- Reverberation
- Short utterances
- Unseen voice-generation systems
- Language and speaker characteristics
- Distribution shift between training and deployment data

A model confidence score is not the same thing as certainty.

For high-stakes decisions, VoiceGuard should be treated as one component of a broader forensic investigation rather than as the sole basis for a decision.

---

# 🔭 Future Improvements

Potential development directions include:

- Stronger cross-dataset evaluation.
- More diverse multilingual and speaker-balanced evaluation.
- Additional codec/noise robustness testing.
- Calibration of confidence scores.
- Model explainability and evidence visualization.
- More comprehensive adversarial testing.
- Production authentication and authorization.
- Persistent analysis history.
- Secure cloud deployment.
- Automated model/version management.
- CI/CD and automated evaluation pipelines.
- Expanded benchmark reporting with reproducible experiment configurations.

---

# 📚 Research & Technical Context

VoiceGuard sits at the intersection of:

- Audio deepfake detection
- Automatic speaker/audio anti-spoofing
- Digital forensics
- Raw-waveform deep learning
- Acoustic signal processing
- Real-time inference systems

The project is particularly focused on connecting a research-oriented detection model to a usable software system rather than presenting model inference in isolation.

---

# 🏆 Smart India Hackathon

VoiceGuard was developed as a **Smart India Hackathon** project concept focused on AI-assisted voice deepfake and anti-spoofing detection.

The system demonstrates how a trained audio model can be integrated into a complete application containing:

```text
Machine Learning
      +
Audio Signal Processing
      +
FastAPI Inference
      +
WebSocket Streaming
      +
React Frontend
      +
Interactive Forensic Visualization
```

---

# 🤝 Contributing

Contributions and technical feedback are welcome.

A typical workflow is:

```bash
git checkout -b feature/your-feature
git add .
git commit -m "feat: describe your change"
git push origin feature/your-feature
```

For substantial changes, please document:

- What changed
- Why it changed
- How it was tested
- Any model/data implications
- Any new environment requirements

---

# 📄 License

See the repository for the project's current license information.

If you intend to distribute VoiceGuard publicly, add an explicit `LICENSE` file describing the permitted use of the source code and model weights.

---

## ⭐ VoiceGuard

**Detect the signal. Inspect the evidence. Understand the model.**

Built with React, FastAPI, Python, signal processing, and the E4 Multi-Scale Raw-Waveform CNN.
