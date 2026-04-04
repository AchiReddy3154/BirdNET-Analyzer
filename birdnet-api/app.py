import os
import tempfile
import traceback
from flask import Flask, request, jsonify
from flask_cors import CORS
from werkzeug.utils import secure_filename
from analyzer import analyze_audio

app = Flask(__name__)
CORS(app)

UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), "uploads")
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

ALLOWED_EXTENSIONS = {"wav", "mp3", "ogg", "flac", "m4a", "aif", "aiff", "mp4"}
MAX_CONTENT_LENGTH = 50 * 1024 * 1024  # 50 MB
app.config["MAX_CONTENT_LENGTH"] = MAX_CONTENT_LENGTH


def allowed_file(filename: str) -> bool:
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


@app.route("/healthz", methods=["GET"])
def health():
    return jsonify({"status": "ok"}), 200


@app.route("/analyze", methods=["POST"])
def analyze():
    if "file" not in request.files:
        return jsonify({"error": "No file provided. Send audio as multipart/form-data with field name 'file'."}), 400

    file = request.files["file"]

    if file.filename == "":
        return jsonify({"error": "No file selected."}), 400

    if not allowed_file(file.filename):
        return jsonify({
            "error": f"Unsupported file type. Allowed types: {', '.join(sorted(ALLOWED_EXTENSIONS))}"
        }), 400

    filename = secure_filename(file.filename)

    lat = request.form.get("lat", type=float)
    lon = request.form.get("lon", type=float)
    week = request.form.get("week", type=int)
    min_conf = request.form.get("min_conf", default=0.1, type=float)
    sensitivity = request.form.get("sensitivity", default=1.0, type=float)
    overlap = request.form.get("overlap", default=0.0, type=float)

    with tempfile.NamedTemporaryFile(
        delete=False,
        suffix=os.path.splitext(filename)[1],
        dir=UPLOAD_FOLDER
    ) as tmp:
        file.save(tmp.name)
        tmp_path = tmp.name

    try:
        results = analyze_audio(
            audio_path=tmp_path,
            lat=lat,
            lon=lon,
            week=week,
            min_conf=min_conf,
            sensitivity=sensitivity,
            overlap=overlap,
        )
        return jsonify(results), 200
    except Exception as exc:
        traceback.print_exc()
        return jsonify({"error": str(exc)}), 500
    finally:
        if os.path.exists(tmp_path):
            os.remove(tmp_path)


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    app.run(host="0.0.0.0", port=port, debug=False)
