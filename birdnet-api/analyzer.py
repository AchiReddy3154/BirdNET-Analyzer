"""
BirdNET audio analysis wrapper using birdnetlib.
"""
from __future__ import annotations

import os
from typing import Optional

from birdnetlib import Recording
from birdnetlib.analyzer import Analyzer


_analyzer: Optional[Analyzer] = None


def _get_analyzer() -> Analyzer:
    global _analyzer
    if _analyzer is None:
        _analyzer = Analyzer()
    return _analyzer


def analyze_audio(
    audio_path: str,
    lat: Optional[float] = None,
    lon: Optional[float] = None,
    week: Optional[int] = None,
    min_conf: float = 0.1,
    sensitivity: float = 1.0,
    overlap: float = 0.0,
) -> dict:
    """
    Analyze an audio file with BirdNET and return structured results.

    Parameters
    ----------
    audio_path : str
        Absolute path to the audio file on disk.
    lat, lon : float, optional
        GPS coordinates for location-based species filtering.
    week : int, optional
        Week of the year (1–48) for seasonal filtering.
    min_conf : float
        Minimum confidence threshold (0–1). Default 0.1.
    sensitivity : float
        Detection sensitivity (0.5–1.5). Default 1.0.
    overlap : float
        Overlap between 3-second segments in seconds (0–2.9). Default 0.0.

    Returns
    -------
    dict
        {
          "file": <original filename>,
          "detections": [
            {
              "start_time": <float>,    # seconds
              "end_time": <float>,      # seconds
              "scientific_name": <str>,
              "common_name": <str>,
              "confidence": <float>,    # 0–1
            },
            ...
          ],
          "location": {"lat": ..., "lon": ..., "week": ...},
          "settings": {"min_conf": ..., "sensitivity": ..., "overlap": ...},
        }
    """
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
