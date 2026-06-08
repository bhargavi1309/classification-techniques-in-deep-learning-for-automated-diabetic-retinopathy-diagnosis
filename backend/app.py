"""
app.py — Diabetic Retinopathy Diagnosis API
Flask backend exposing REST endpoints for classification, history, patients and stats.
"""
import os
from flask import Flask, request, jsonify
from flask_cors import CORS

from preprocessing import load_image_from_bytes, preprocess_image
from classifier import classify_image
from gradcam import generate_gradcam
import patient_store as store

# ── App setup ─────────────────────────────────────────────────────────────────
app = Flask(__name__)
CORS(app)
app.config["MAX_CONTENT_LENGTH"] = 16 * 1024 * 1024  # 16 MB limit

ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg", "bmp", "tiff", "webp"}


def allowed_file(filename: str) -> bool:
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


# ── Health check ──────────────────────────────────────────────────────────────
@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "service": "DR Diagnosis API"})


# ── Classification ────────────────────────────────────────────────────────────
@app.route("/api/classify", methods=["POST"])
def classify():
    """
    Accepts multipart form:
      - image        (file)   — retinal fundus image
      - patient_id   (str)    — optional existing patient ID
      - patient_name (str)    — optional quick name (if no patient_id)
      - eye          (str)    — "Right" | "Left" | "Both"
    """
    if "image" not in request.files:
        return jsonify({"error": "No image provided"}), 400

    file = request.files["image"]
    if file.filename == "" or not allowed_file(file.filename):
        return jsonify({"error": "Invalid or unsupported image file"}), 400

    try:
        raw_bytes = file.read()
        img = load_image_from_bytes(raw_bytes)

        # Preprocessing
        processed_img, processed_b64 = preprocess_image(img)

        # Classification
        result = classify_image(processed_img)

        # Grad-CAM
        heatmap_b64 = generate_gradcam(processed_img, result["grade"])

        # Patient resolution
        patient_id = request.form.get("patient_id", "").strip()
        patient_name = request.form.get("patient_name", "Unknown").strip()
        eye = request.form.get("eye", "Right").strip()

        if patient_id:
            patient = store.get_patient(patient_id)
            if patient:
                patient_name = patient["name"]
            else:
                patient_id = ""

        # Persist to history
        entry = store.add_history_entry({
            "patient_id": patient_id,
            "patient_name": patient_name,
            "grade": result["grade"],
            "label": result["label"],
            "confidence": result["confidence"],
            "recommendation": result["recommendation"],
            "eye": eye,
        })

        return jsonify({
            "success": True,
            "history_id": entry["id"],
            "patient_name": patient_name,
            "eye": eye,
            "processed_image": processed_b64,
            "heatmap": heatmap_b64,
            **result,
        })

    except Exception as e:
        return jsonify({"error": f"Classification failed: {str(e)}"}), 500


# ── History ───────────────────────────────────────────────────────────────────
@app.route("/api/history", methods=["GET"])
def get_history():
    patient_id = request.args.get("patient_id")
    return jsonify(store.get_history(patient_id))


@app.route("/api/history/<hid>", methods=["DELETE"])
def delete_history(hid: str):
    if store.delete_history_entry(hid):
        return jsonify({"success": True})
    return jsonify({"error": "Record not found"}), 404


# ── Patients ──────────────────────────────────────────────────────────────────
@app.route("/api/patients", methods=["GET"])
def get_patients():
    return jsonify(store.get_all_patients())


@app.route("/api/patients", methods=["POST"])
def add_patient():
    data = request.get_json(force=True)
    if not data or not data.get("name"):
        return jsonify({"error": "Patient name is required"}), 400
    patient = store.add_patient(data)
    return jsonify(patient), 201


# ── Stats / Dashboard ─────────────────────────────────────────────────────────
@app.route("/api/stats", methods=["GET"])
def get_stats():
    return jsonify(store.get_stats())


# ── Entry point ───────────────────────────────────────────────────────────────
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    print(f"\n🩺  DR Diagnosis API running at  http://localhost:{port}\n")
    app.run(debug=True, port=port)
