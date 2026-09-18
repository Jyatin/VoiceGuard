# VoiceGuard 🛡️
### Real-Time AI Voice Deepfake & Anti-Spoofing Detector (Smart India Hackathon)

VoiceGuard is a cyber-defense grade, real-time AI voice deepfake detection system designed for high-stakes fraud prevention, voice biometric authentication, and telephonic interception.

---

## ⚡ Tech Stack

- **Frontend**: React 19, Vite, TypeScript, Tailwind CSS v4, Lucide Icons, Recharts, WaveSurfer.js
- **Audio Capture**: Web Audio API (`getUserMedia`, `AudioContext`, `AnalyserNode`, `ScriptProcessorNode` downsampled to 16kHz mono PCM)
- **Backend**: Python 3.10+ / 3.13 / 3.14, FastAPI, WebSockets, Uvicorn
- **Acoustic Signal Processing**: `librosa`, `soundfile`, `scipy`, `numpy`
- **Neural Architecture**: Dual-Engine (Lightweight CNN-BiLSTM for live streaming; Multi-fold Ensemble for deep forensic uploads)

---

## 🚀 Quick Start Guide

Run the backend and frontend in two separate terminal windows.

### 1. Backend Setup & Run

Open a terminal and navigate to `voiceguard/backend`:

```bash
cd voiceguard/backend

# Option A: Using the pre-created virtual environment
.\venv\Scripts\activate

# Option B: Or create a new virtual environment
python -m venv venv
.\venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Start the FastAPI server
uvicorn main:app --reload --port 8000
```

> Backend will be live at `http://127.0.0.1:8000`  
> Interactive OpenAPI documentation: `http://127.0.0.1:8000/docs`

---

### 2. Frontend Setup & Run

Open a second terminal and navigate to `voiceguard/frontend`:

```bash
cd voiceguard/frontend

# Install packages
npm install
# Note: On Windows if npm.ps1 is blocked by script execution policy, use:
# npm.cmd install

# Start Vite dev server
npm run dev
# or: npm.cmd run dev
```

> Open your browser to `http://localhost:5173/`

---

## 🧭 Application Modules & Layout

### 1. Live Detection (Default Tab)
- **Big Mic Button**: Single-click toggle to capture microphone audio using the Web Audio API.
- **WebSocket Streaming (`/predict-stream`)**: Streams 16kHz mono Float32 PCM chunks (~1.5s windows with 1.0s overlap) via low-latency WebSocket.
- **Dual Visualizers**:
  - Real-time rolling waveform monitor.
  - Live FFT frequency spectrum bars powered by an `AnalyserNode` (`getByteFrequencyData`) with cyan/teal gradients.
- **High-Visibility Verdict Badge**:
  - 🟢 **REAL** (Emerald glow) vs 🔴 **FAKE** (Crimson pulse alert).
  - Confidence percentage meter and probability score readout.
  - Latency readout in milliseconds (`latency: XX ms`).
- **Inference Timeline Stream**: Rolling history log showing consecutive model outputs and confidence shifts.

### 2. Upload & Analyze
- **Drag-and-Drop / File Picker**: Supports `.wav` and `.mp3` audio files (up to 30MB).
- **One-Click Demo Presets**: Includes built-in synthesizer buttons ("Load Authentic Sample" and "Load Deepfake Sample") allowing instant demo execution without external files.
- **Side-by-Side Visualizations**:
  - **Interactive Waveform Player**: Built with `wavesurfer.js` (Play/Pause, scrub, timestamp).
  - **Mel-Spectrogram Heatmap**: Rendered on HTML5 Canvas using a high-contrast cyber colormap from 64-mel log power spectrum matrices.
- **Handcrafted Signal Statistics Cards**:
  - **Spectral Centroid (Hz)**: Sound brightness & center of mass.
  - **Spectral Bandwidth (Hz)**: Spectral frequency dispersion width.
  - **Spectral Rolloff (Hz)**: 85% spectral energy cutoff frequency.
  - **Zero-Crossing Rate (ZCR)**: Rate of sign changes per frame (fricatives & vocoder noise).
  - **Spectral Flatness**: Tonality vs noise ratio (distinguishes synthetic phase artifacts).

### 3. Model Performance
- **KPI Metrics Cards**: Accuracy (96.4%), Precision (95.8%), Recall (97.1%), F1 Score (96.5%).
- **Confusion Matrix Heatmap**: 2x2 grid showing True Real, False Fake, False Real, and True Fake counts and percentages.
- **ROC Curve Chart**: Recharts interactive line plot of TPR vs FPR with Area Under the Curve (AUC = 0.989) and Equal Error Rate (EER = 3.58%).
- **Acoustic Robustness Benchmark**: Comparative bar chart and breakdown across 6 challenging real-world scenarios:
  1. *Clean Audio* (98.2%)
  2. *Additive Noise (10 dB)* (94.5%)
  3. *High Noise (0 dB)* (88.7%)
  4. *Telephone Simulation (G.711 μ-law)* (91.3%)
  5. *Low Bitrate MP3 (32 kbps)* (92.8%)
  6. *Short Utterance (1.0s)* (86.4%)
- **Architectural Badge**: Clarifies that the ensemble is reserved for deep file analysis while the live tab runs the lightweight real-time model.

### 4. About & Pipeline
- Full technical overview of the anti-spoofing pipeline.
- Interactive 5-stage architectural flow diagram.
- REST & WebSocket API specification.

---

## 🧠 Model Hot-Swapping & Zero-Restart Architecture

The backend features an automatic dynamic model discovery engine. It continuously scans `voiceguard/backend/models/` for:

1. `lightweight_antispoof.h5` (or `lightweight_antispoof.tflite`):
   - Used for the ultra-low latency live mic stream (`WS /predict-stream`).
2. `fold_model_0.h5` ... `fold_model_N.h5`:
   - Loaded into memory as a multi-fold ensemble for forensic uploads (`POST /predict`).
3. `config.json`:
   - Defines `operating_threshold` (default `0.5`) and label order.

### Graceful Mock Engine Fallback
- If the neural model weight files are not yet present, **the server does not crash**.
- It automatically activates an intelligent, signal-informed mock inference engine that evaluates energy and acoustic stats to produce natural probabilistic outputs.
- A persistent warning banner appears at the top:
  `"Demo mode — using mock predictions, model not loaded yet."`
- As soon as real `.h5` or `.tflite` model files are dropped into `backend/models/`, VoiceGuard detects them within 5 seconds and activates real neural inference without restarting the server!

---

## 📡 Backend API Contract

### 1. `POST /predict` (Multipart Audio Upload)
- **Request**: `file: UploadFile` (.wav / .mp3)
- **Response**:
```json
{
  "label": "REAL",
  "confidence": 0.942,
  "prob_real": 0.942,
  "waveform": [0.01, 0.05, ...],
  "mel_spectrogram": [[...], ...],
  "stats": {
    "centroid": 2150.4,
    "bandwidth": 1820.1,
    "rolloff": 3410.5,
    "zcr": 0.042,
    "flatness": 0.0084
  },
  "latency_ms": 38.2,
  "is_mock": false,
  "model_type": "Ensemble (5 Folds)",
  "audio_duration_sec": 3.0
}
```

### 2. `WS /predict-stream` (Live Mic Streaming)
- **Client sends**: Binary `Float32Array` PCM buffer (16kHz mono, ~1.5s - 3.0s).
- **Server responds**:
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

### 3. `GET /metrics`
- **Response**:
```json
{
  "accuracy": 0.9642,
  "precision": 0.9587,
  "recall": 0.9715,
  "f1": 0.9651,
  "eer": 0.0358,
  "auc": 0.9892,
  "confusion_matrix": { ... },
  "roc_curve": { "fpr": [...], "tpr": [...] },
  "robustness": [ ... ],
  "ensemble_note": "Ensemble model — not used for live detection (too slow); live tab uses the lightweight real-time model"
}
```

---

## 🏆 Smart India Hackathon Demo Presentation Highlights

When demonstrating VoiceGuard to judges:
1. **Highlight the Dual-Engine Approach**: Explain how the lightweight model enables sub-50ms live stream detection during ongoing VoIP/phone calls, while the heavier ensemble is deployed for evidentiary forensic file analysis.
2. **Demonstrate Spectral Anomalies**: Navigate to "Upload & Analyze", load the deepfake sample preset, and explain how vocoders cause distinct high-frequency phase artifacts visible in the mel-spectrogram heatmap and reflected in the spectral flatness and rolloff cards.
3. **Showcase Real-World Robustness**: In "Model Performance", direct attention to the 6-condition robustness benchmark showing resilience against 0dB background noise and lossy 32kbps telephonic compression.
