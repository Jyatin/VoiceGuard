export interface AcousticStats {
  centroid: number;
  bandwidth: number;
  rolloff: number;
  zcr: number;
  flatness: number;
}

export interface PredictionResponse {
  label: 'REAL' | 'FAKE';
  confidence: number;
  prob_real: number;
  waveform: number[];
  mel_spectrogram: number[][];
  stats: AcousticStats;
  latency_ms: number;
  is_mock?: boolean;
  model_type?: string;
  audio_duration_sec?: number;
}

export interface StreamPrediction {
  label: 'REAL' | 'FAKE';
  prob_real: number;
  confidence: number;
  latency_ms: number;
  is_mock: boolean;
  timestamp: number;
}

export interface RobustnessItem {
  condition: string;
  tag: string;
  accuracy: number;
  description?: string;
}

export interface ConfusionMatrix {
  matrix: number[][];
  labels: string[];
  true_real: number;
  false_fake: number;
  false_real: number;
  true_fake: number;
}

export interface RocCurve {
  fpr: number[];
  tpr: number[];
}

export interface MetricsData {
  accuracy: number;
  precision: number;
  recall: number;
  f1: number;
  eer?: number;
  auc?: number;
  total_test_samples?: number;
  confusion_matrix: ConfusionMatrix;
  roc_curve: RocCurve;
  robustness: RobustnessItem[];
  is_mock?: boolean;
  ensemble_note?: string;
}

export interface SystemHealth {
  status: string;
  is_mock: boolean;
  operating_threshold: number;
  ensemble_folds: number;
  lightweight_loaded: boolean;
  /** Set when the real trained model (E4 raw-waveform CNN) is loaded; null under the fallback/mock engine. */
  engine?: string | null;
}
