"""
BirdNET audio analysis wrapper using birdnetlib.
Model is pre-loaded at import time to eliminate cold-start on first request.
"""
from __future__ import annotations

import base64
import io
import os
from typing import Optional

import librosa
import librosa.display
import matplotlib
import numpy as np
from birdnetlib import Recording
from birdnetlib.analyzer import Analyzer

matplotlib.use("Agg")
import matplotlib.pyplot as plt

_analyzer: Optional[Analyzer] = None


def _get_analyzer() -> Analyzer:
    global _analyzer
    if _analyzer is None:
        print("[BirdNET] Loading model...", flush=True)
        _analyzer = Analyzer()
        print("[BirdNET] Model ready.", flush=True)
    return _analyzer


# Pre-load model at import time so the first request is not penalised
print("[BirdNET] Pre-warming model at startup...", flush=True)
_get_analyzer()


def _generate_spectrogram_data_url(audio_path: str) -> Optional[str]:
    try:
        y, sr = librosa.load(audio_path, sr=None, mono=True)
        if y.size == 0:
            return None

        spectrogram = librosa.feature.melspectrogram(y=y, sr=sr, n_mels=128, fmax=sr / 2)
        spectrogram_db = librosa.power_to_db(spectrogram, ref=np.max)

        fig, ax = plt.subplots(figsize=(12, 2.7), dpi=120)
        librosa.display.specshow(
            spectrogram_db,
            sr=sr,
            x_axis="time",
            y_axis="mel",
            fmax=sr / 2,
            cmap="magma",
            ax=ax,
        )

        ax.set_title("Audio Spectrogram", fontsize=11, pad=8)
        ax.set_xlabel("Time (s)")
        ax.set_ylabel("Frequency (mel)")
        fig.tight_layout()

        buffer = io.BytesIO()
        fig.savefig(buffer, format="png")
        plt.close(fig)
        buffer.seek(0)
        encoded = base64.b64encode(buffer.read()).decode("ascii")
        return f"data:image/png;base64,{encoded}"
    except Exception as exc:
        print(f"[BirdNET] Failed to generate spectrogram: {exc}", flush=True)
        return None


def analyze_audio(
    audio_path: str,
    lat: Optional[float] = None,
    lon: Optional[float] = None,
    week: Optional[int] = None,
    min_conf: float = 0.1,
    sensitivity: float = 1.0,
    overlap: float = 0.0,
) -> dict:
    analyzer = _get_analyzer()

    use_location = lat is not None and lon is not None

    recording = Recording(
        analyzer,
        audio_path,
        lat=lat if use_location else None,
        lon=lon if use_location else None,
        week_48=week if week is not None else -1,
        sensitivity=sensitivity,
        overlap=overlap,
        min_conf=min_conf,
    )

    recording.analyze()
    spectrogram_image = _generate_spectrogram_data_url(audio_path)

    detections = []
    for det in recording.detections:
        detections.append({
            "start_time": det.get("start_time"),
            "end_time": det.get("end_time"),
            "scientific_name": det.get("scientific_name"),
            "common_name": det.get("common_name"),
            "confidence": round(det.get("confidence", 0.0), 4),
        })

    detections.sort(key=lambda d: (d["start_time"], -d["confidence"]))

    return {
        "file": os.path.basename(audio_path),
        "spectrogram_image": spectrogram_image,
        "detections": detections,
        "location": {
            "lat": lat,
            "lon": lon,
            "week": week,
        },
        "settings": {
            "min_conf": min_conf,
            "sensitivity": sensitivity,
            "overlap": overlap,
        },
    }
