import numpy as np
import librosa
import soundfile as sf
import io

SAMPLE_RATE = 16000
CLIP_DURATION = 3.0
TARGET_SAMPLES = int(SAMPLE_RATE * CLIP_DURATION) # 48000
N_MELS = 64
N_MFCC = 40

def extract_logmel(audio: np.ndarray, sr: int = SAMPLE_RATE) -> np.ndarray:
    """
    Extract normalized log mel-spectrogram.
    audio: 1D float numpy array.
    returns: (n_mels, time_frames, 1) float32 array.
    """
    if len(audio) == 0:
        audio = np.zeros(TARGET_SAMPLES, dtype=np.float32)
    mel = librosa.feature.melspectrogram(y=audio, sr=sr, n_mels=N_MELS)
    mel_db = librosa.power_to_db(mel, ref=np.max)
    mel_db = (mel_db - mel_db.mean()) / (mel_db.std() + 1e-6)
    return mel_db[..., np.newaxis].astype(np.float32)

def extract_handcrafted_stats(audio: np.ndarray, sr: int = SAMPLE_RATE) -> np.ndarray:
    """
    Extract 16-dimensional acoustic feature statistics:
    mean & std for [mfcc, d1, d2, centroid, bandwidth, rolloff, zcr, flatness]
    """
    if len(audio) == 0:
        audio = np.zeros(TARGET_SAMPLES, dtype=np.float32)
    mfcc = librosa.feature.mfcc(y=audio, sr=sr, n_mfcc=N_MFCC)
    d1 = librosa.feature.delta(mfcc)
    d2 = librosa.feature.delta(mfcc, order=2)
    centroid = librosa.feature.spectral_centroid(y=audio, sr=sr)
    bandwidth = librosa.feature.spectral_bandwidth(y=audio, sr=sr)
    rolloff = librosa.feature.spectral_rolloff(y=audio, sr=sr)
    zcr = librosa.feature.zero_crossing_rate(audio)
    flatness = librosa.feature.spectral_flatness(y=audio)
    feats = []
    for f in (mfcc, d1, d2, centroid, bandwidth, rolloff, zcr, flatness):
        feats.extend([float(np.mean(f)), float(np.std(f))])
    return np.array(feats, dtype=np.float32)   # shape (16,)

def get_signal_stats_dict(audio: np.ndarray, sr: int = SAMPLE_RATE) -> dict:
    """
    Helper returning human-readable acoustic stats for frontend cards.
    """
    if len(audio) == 0:
        return {"centroid": 0.0, "bandwidth": 0.0, "rolloff": 0.0, "zcr": 0.0, "flatness": 0.0}
    centroid = float(np.mean(librosa.feature.spectral_centroid(y=audio, sr=sr)))
    bandwidth = float(np.mean(librosa.feature.spectral_bandwidth(y=audio, sr=sr)))
    rolloff = float(np.mean(librosa.feature.spectral_rolloff(y=audio, sr=sr)))
    zcr = float(np.mean(librosa.feature.zero_crossing_rate(audio)))
    flatness = float(np.mean(librosa.feature.spectral_flatness(y=audio)))
    return {
        "centroid": round(centroid, 2),
        "bandwidth": round(bandwidth, 2),
        "rolloff": round(rolloff, 2),
        "zcr": round(zcr, 4),
        "flatness": round(flatness, 5)
    }

def load_audio_from_bytes(file_bytes: bytes) -> tuple[np.ndarray, int]:
    """
    Load audio bytes (.wav, .mp3, etc.), convert to mono and resample to 16kHz.
    """
    bio = io.BytesIO(file_bytes)
    audio, sr = librosa.load(bio, sr=SAMPLE_RATE, mono=True)
    return audio, sr

def fix_clip_length(audio: np.ndarray, target_len: int = TARGET_SAMPLES) -> np.ndarray:
    """Pad with zeros or truncate to exactly target_len samples."""
    if len(audio) < target_len:
        return np.pad(audio, (0, target_len - len(audio)), mode='constant')
    return audio[:target_len]

def downsample_waveform_for_display(audio: np.ndarray, points: int = 150) -> list[float]:
    """Downsample audio waveform array to a lightweight float list for frontend display."""
    if len(audio) == 0:
        return [0.0] * points
    step = max(1, len(audio) // points)
    downsampled = [float(np.mean(np.abs(audio[i:i+step]))) for i in range(0, len(audio), step)]
    return downsampled[:points]
