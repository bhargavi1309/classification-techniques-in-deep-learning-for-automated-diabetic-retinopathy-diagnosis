"""
patient_store.py
In-memory store for patients and classification history.
"""
import uuid
from datetime import datetime

# ── In-memory data stores ──────────────────────────────────────────────────────
patients: list[dict] = [
    {"id": "p1", "name": "Arjun Sharma",   "age": 52, "gender": "Male",   "diabetes_duration": 8,  "created_at": "2024-01-10"},
    {"id": "p2", "name": "Priya Nair",     "age": 45, "gender": "Female", "diabetes_duration": 5,  "created_at": "2024-02-18"},
    {"id": "p3", "name": "Ravi Mehta",     "age": 63, "gender": "Male",   "diabetes_duration": 15, "created_at": "2024-03-05"},
    {"id": "p4", "name": "Sunita Reddy",   "age": 58, "gender": "Female", "diabetes_duration": 10, "created_at": "2024-04-20"},
    {"id": "p5", "name": "Vikram Patel",   "age": 41, "gender": "Male",   "diabetes_duration": 3,  "created_at": "2024-05-12"},
]

history: list[dict] = [
    {
        "id": "h1", "patient_id": "p1", "patient_name": "Arjun Sharma",
        "grade": 2, "label": "Moderate NPDR", "confidence": 0.87,
        "recommendation": "Refer to ophthalmologist within 6 months.",
        "timestamp": "2025-01-15T10:30:00", "eye": "Right"
    },
    {
        "id": "h2", "patient_id": "p2", "patient_name": "Priya Nair",
        "grade": 0, "label": "No DR", "confidence": 0.95,
        "recommendation": "Routine screening in 12 months.",
        "timestamp": "2025-01-20T14:00:00", "eye": "Left"
    },
    {
        "id": "h3", "patient_id": "p3", "patient_name": "Ravi Mehta",
        "grade": 4, "label": "Proliferative DR", "confidence": 0.91,
        "recommendation": "Urgent referral. Risk of severe vision loss.",
        "timestamp": "2025-02-01T09:15:00", "eye": "Both"
    },
    {
        "id": "h4", "patient_id": "p4", "patient_name": "Sunita Reddy",
        "grade": 1, "label": "Mild NPDR", "confidence": 0.89,
        "recommendation": "Routine screening in 12 months with optimized glycaemic control.",
        "timestamp": "2025-02-10T11:45:00", "eye": "Right"
    },
    {
        "id": "h5", "patient_id": "p5", "patient_name": "Vikram Patel",
        "grade": 3, "label": "Severe NPDR", "confidence": 0.83,
        "recommendation": "Refer to ophthalmologist within 1 month.",
        "timestamp": "2025-02-18T16:20:00", "eye": "Left"
    },
]


def get_all_patients() -> list[dict]:
    return patients


def get_patient(pid: str) -> dict | None:
    return next((p for p in patients if p["id"] == pid), None)


def add_patient(data: dict) -> dict:
    patient = {
        "id": f"p{uuid.uuid4().hex[:8]}",
        "name": data.get("name", "Unknown"),
        "age": int(data.get("age", 0)),
        "gender": data.get("gender", "Unknown"),
        "diabetes_duration": int(data.get("diabetes_duration", 0)),
        "created_at": datetime.now().strftime("%Y-%m-%d"),
    }
    patients.append(patient)
    return patient


def get_history(patient_id: str | None = None) -> list[dict]:
    if patient_id:
        return [h for h in history if h["patient_id"] == patient_id]
    return sorted(history, key=lambda x: x["timestamp"], reverse=True)


def add_history_entry(entry: dict) -> dict:
    entry["id"] = f"h{uuid.uuid4().hex[:8]}"
    entry["timestamp"] = datetime.now().isoformat()
    history.append(entry)
    return entry


def delete_history_entry(hid: str) -> bool:
    for i, h in enumerate(history):
        if h["id"] == hid:
            history.pop(i)
            return True
    return False


def get_stats() -> dict:
    total = len(history)
    grade_counts = [0, 0, 0, 0, 0]
    for h in history:
        grade_counts[h["grade"]] += 1

    referral = sum(grade_counts[2:])  # Grade 2+
    referral_rate = round((referral / total * 100) if total else 0, 1)

    # Weekly data (mock)
    weekly = [3, 7, 5, 9, 12, 8, 6]

    return {
        "total_scans": total,
        "total_patients": len(patients),
        "grade_counts": grade_counts,
        "referral_rate": referral_rate,
        "weekly_scans": weekly,
        "grade_labels": ["No DR", "Mild NPDR", "Moderate NPDR", "Severe NPDR", "Proliferative DR"],
    }
