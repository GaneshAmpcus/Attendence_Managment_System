from fastapi import APIRouter, UploadFile, File, HTTPException, Query
from app.services.face_service import get_embedding
from app.faiss_index import search_embedding, user_map
from app.services.attendance_service import mark_attendance
from app.services.attendance_processor import process_attendance_for_date
from app.db import get_connection
from deepface.modules.exceptions import FaceNotDetected
import logging
from datetime import date, datetime

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter()

THRESHOLD = 0.35
COOLDOWN_SECONDS = 1


# ─── cooldown via DB (works across multiple workers) ─────────────────────────

def check_and_set_cooldown(user_id: int) -> bool:
    """Returns True if cooldown is still active (should block). Sets timestamp if not."""
    conn = get_connection()
    cur = conn.cursor()

    cur.execute("""
        SELECT last_seen FROM attendance_cooldown WHERE user_id = %s
    """, (user_id,))
    row = cur.fetchone()

    now = datetime.now()

    if row:
        last_seen = row[0]
        diff = (now - last_seen).total_seconds()
        if diff < COOLDOWN_SECONDS:
            cur.close()
            conn.close()
            return True  # still in cooldown

    # Upsert last_seen
    cur.execute("""
        INSERT INTO attendance_cooldown (user_id, last_seen)
        VALUES (%s, %s)
        ON CONFLICT (user_id) DO UPDATE SET last_seen = EXCLUDED.last_seen
    """, (user_id, now))

    conn.commit()
    cur.close()
    conn.close()
    return False


# ─── mark attendance ──────────────────────────────────────────────────────────

@router.post("/mark-attendance")
async def attendance(file: UploadFile = File(...)):

    # 1. Get face embedding — handle no-face gracefully
    try:
        await file.seek(0)
        embedding = get_embedding(file.file)
    except FaceNotDetected:
        logger.warning("No face detected in uploaded frame")
        return {"error": "No face detected. Please look directly at the camera."}
    except Exception as e:
        logger.error(f"Embedding error: {e}")
        return {"error": "Could not process image. Please try again."}

    logger.info(f"Embedding generated. Shape: {embedding.shape}")

    # 2. FAISS search
    distances, indices = search_embedding(embedding, 1)
    distance = distances[0][0]
    idx = indices[0][0]

    logger.info(f"FAISS → idx: {idx}, distance: {distance}, threshold: {THRESHOLD}")

    if idx == -1 or idx >= len(user_map):
        logger.warning("Invalid FAISS index")
        return {"error": "No matching user found."}

    score = distances[0][0]
    if score < THRESHOLD:
        logger.warning(f"Score {score} exceeds threshold {THRESHOLD}")
        return {"error": "Face not recognized."}
        
       

    user_id = user_map[idx]
    logger.info(f"Matched user_id: {user_id}, distance: {distance:.4f}")

    # 3. Cooldown check (DB-backed)
    if check_and_set_cooldown(user_id):
        logger.info(f"Cooldown active for user {user_id}")
        return {"message": "Please wait before scanning again."}

    # 4. Mark attendance
    try:
        result = mark_attendance(user_id)
    except Exception as e:
        logger.error(f"Attendance marking failed for user {user_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to record attendance.")

    logger.info(f"Attendance result for user {user_id}: {result}")

    if result["status"] == "check_in":
        return {
            "message": "Check-in successful",
            "user_id": user_id,
            "status": "check_in",
            "time": str(result.get("time")),
        }
    elif result["status"] == "check_out":
        return {
            "message": "Check-out successful",
            "user_id": user_id,
            "status": "check_out",
            "time": str(result.get("time")),
        }
    elif result["status"] == "too_fast":
        return {"message": "Please wait before checking out."}

    return {"message": "Attendance already completed for today.", "user_id": user_id}


# ─── process today (admin / cron) ─────────────────────────────────────────────

@router.post("/process-today")
def process_today():
    today = date.today()
    process_attendance_for_date(today)
    return {"message": f"Attendance processed for {today}"}


@router.post("/process-date")
def process_date(target_date: date = Query(...)):
    process_attendance_for_date(target_date)
    return {"message": f"Attendance processed for {target_date}"}


# ─── today ────────────────────────────────────────────────────────────────────

@router.get("/today/{user_id}")
def get_today_attendance(user_id: int):
    conn = get_connection()
    cur = conn.cursor()

    cur.execute("""
        SELECT attendance_date, check_in, check_out,
               status, late_flag, working_hours,
               overtime_hours, shortfall_hours, remarks
        FROM attendance
        WHERE user_id = %s AND attendance_date = CURRENT_DATE
    """, (user_id,))

    row = cur.fetchone()
    cur.close()
    conn.close()

    if not row:
        return {"data": None}

    return {
        "data": {
            "date":            str(row[0]),
            "check_in":        str(row[1]) if row[1] else None,
            "check_out":       str(row[2]) if row[2] else None,
            "status":          row[3],
            "late_flag":       row[4],
            "working_hours":   row[5],
            "overtime_hours":  row[6],
            "shortfall_hours": row[7],
            "remarks":         row[8],
        }
    }


# ─── history with optional date filter ───────────────────────────────────────

@router.get("/history/{user_id}")
def get_history(
    user_id: int,
    from_date: date = Query(default=None),
    to_date: date   = Query(default=None),
):
    conn = get_connection()
    cur = conn.cursor()

    query = """
        SELECT attendance_date, check_in, check_out,
               status, late_flag, working_hours,
               overtime_hours, shortfall_hours, remarks
        FROM attendance
        WHERE user_id = %s
    """
    params = [user_id]

    if from_date:
        query += " AND attendance_date >= %s"
        params.append(from_date)
    if to_date:
        query += " AND attendance_date <= %s"
        params.append(to_date)

    query += " ORDER BY attendance_date DESC"

    cur.execute(query, params)
    rows = cur.fetchall()
    cur.close()
    conn.close()

    return {
        "data": [
            {
                "date":            str(r[0]),
                "check_in":        str(r[1]) if r[1] else None,
                "check_out":       str(r[2]) if r[2] else None,
                "status":          r[3],
                "late_flag":       r[4],
                "working_hours":   r[5],
                "overtime_hours":  r[6],
                "shortfall_hours": r[7],
                "remarks":         r[8],
            }
            for r in rows
        ]
    }


# ─── monthly summary ──────────────────────────────────────────────────────────

@router.get("/summary/{user_id}")
def get_summary(user_id: int, month: str = Query(..., description="Format: YYYY-MM")):
    """
    Returns aggregated monthly summary.
    month param example: 2025-04
    """
    try:
        year, mon = map(int, month.split("-"))
    except ValueError:
        raise HTTPException(status_code=400, detail="month must be in YYYY-MM format")

    conn = get_connection()
    cur = conn.cursor()

    cur.execute("""
        SELECT
            COUNT(*)                                            AS total_records,
            SUM(CASE WHEN status = 'Present'  THEN 1 ELSE 0 END) AS present,
            SUM(CASE WHEN status = 'Absent'   THEN 1 ELSE 0 END) AS absent,
            SUM(CASE WHEN status = 'Half Day' THEN 1 ELSE 0 END) AS half_day,
            SUM(CASE WHEN status = 'Short Leave' THEN 1 ELSE 0 END) AS short_leave,
            SUM(CASE WHEN status = 'Missing Punch' THEN 1 ELSE 0 END) AS missing_punch,
            SUM(CASE WHEN status = 'On Leave' THEN 1 ELSE 0 END) AS on_leave,
            SUM(CASE WHEN status = 'Holiday'  THEN 1 ELSE 0 END) AS holidays,
            SUM(CASE WHEN status = 'Weekly Off' THEN 1 ELSE 0 END) AS weekly_off,
            SUM(CASE WHEN late_flag = TRUE THEN 1 ELSE 0 END)    AS late_count,
            COALESCE(SUM(working_hours), 0)                      AS total_working_hours,
            COALESCE(SUM(overtime_hours), 0)                     AS total_overtime_hours,
            COALESCE(SUM(shortfall_hours), 0)                    AS total_shortfall_hours
        FROM attendance
        WHERE user_id = %s
          AND EXTRACT(YEAR FROM attendance_date) = %s
          AND EXTRACT(MONTH FROM attendance_date) = %s
    """, (user_id, year, mon))

    row = cur.fetchone()
    cur.close()
    conn.close()

    if not row:
        return {"summary": {}}

    return {
        "summary": {
            "total_records":        row[0],
            "present":              row[1],
            "absent":               row[2],
            "half_day":             row[3],
            "short_leave":          row[4],
            "missing_punch":        row[5],
            "on_leave":             row[6],
            "holidays":             row[7],
            "weekly_off":           row[8],
            "late_count":           row[9],
            "total_working_hours":  float(row[10]),
            "total_overtime_hours": float(row[11]),
            "total_shortfall_hours":float(row[12]),
        }
    }



