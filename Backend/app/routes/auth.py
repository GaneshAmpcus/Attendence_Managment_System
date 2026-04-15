from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from app.services.face_service import get_embedding
from app.db import get_connection
from app.faiss_index import rebuild_faiss_from_db
from app.config import ADMIN_USER, ADMIN_PASSWORD
from deepface.modules.exceptions import FaceNotDetected
import logging
from pydantic import BaseModel
import cv2
import numpy as np

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/register")
async def register_user(
    name: str = Form(...),
    email: str = Form(...),
    file: UploadFile = File(...)
):
    # 1. Get and validate embedding BEFORE touching the DB
    #    If the face is bad, we fail early and nothing is written.
    try:
        await file.seek(0)
        embedding = get_embedding(file.file)
    except FaceNotDetected:
        raise HTTPException(
            status_code=400,
            detail="No face detected in the uploaded image. Please use a clear, well-lit photo."
        )
    except ValueError as e:
        # get_embedding raises ValueError for blur/darkness checks
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Embedding error during registration: {e}")
        raise HTTPException(
            status_code=400,
            detail="Could not process face from image. Please try a different photo."
        )

    conn = get_connection()
    cur = conn.cursor()

    try:
        # 2. Insert user row
        cur.execute(
            "INSERT INTO users (name, email) VALUES (%s, %s) RETURNING id",
            (name, email)
        )
        user_id = cur.fetchone()[0]

        # 3. Insert embedding — DB is the source of truth
        cur.execute(
            "INSERT INTO face_embeddings (user_id, embedding) VALUES (%s, %s)",
            (user_id, embedding.tolist())
        )

        conn.commit()
        logger.info(f"Registered user_id={user_id}, name={name}")

    except Exception as e:
        conn.rollback()
        logger.error(f"DB error during registration: {e}")
        # Most likely cause: duplicate email (unique constraint)
        raise HTTPException(status_code=409, detail="Email already registered.")
    finally:
        cur.close()
        conn.close()

    # 4. Rebuild FAISS from DB — keeps index and user_map in sync
    try:
        rebuild_faiss_from_db()
    except Exception as e:
        # User is saved in DB — they can still be recovered on next restart.
        # Log but don't fail the request.
        logger.error(f"FAISS rebuild failed after registration: {e}")

    return {"message": "User registered successfully", "user_id": user_id}


# ─── Login ────────────────────────────────────────────────────────────────────

class LoginRequest(BaseModel):
    email: str
    password: str = None


@router.post("/login")
def login(data: LoginRequest):
    # Admin shortcut — replace with proper hashed credential check in production
    if data.email == ADMIN_USER and data.password == ADMIN_PASSWORD:
        return {
            "role": "admin",
            "user_id": 0,
            "message": "Admin login successful"
        }

    conn = get_connection()
    cur = conn.cursor()

    try:
        cur.execute("SELECT id, name FROM users WHERE email = %s", (data.email,))
        user = cur.fetchone()
    finally:
        cur.close()
        conn.close()

    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    return {
        "role": "user",
        "user_id": user[0],
        "name": user[1],
        "message": "Login successful"
    }



@router.post("/face-login")
async def face_login(file: UploadFile = File(...)):
    # 1. Get embedding from uploaded frame
    try:
        await file.seek(0)
        embedding = get_embedding(file.file)
    except FaceNotDetected:
        raise HTTPException(status_code=400, detail="No face detected.")
    except Exception as e:
        logger.error(f"Face login embedding error: {e}")
        raise HTTPException(status_code=400, detail="Could not process image.")

    # 2. Search FAISS
    from app.faiss_index import search_embedding, user_map
    distances, indices = search_embedding(embedding, 1)
    score = distances[0][0]
    idx = indices[0][0]

    if idx == -1 or idx >= len(user_map):
        raise HTTPException(status_code=404, detail="No matching face found.")

    if score < 0.35:
        raise HTTPException(status_code=401, detail="Face not recognized.")

    user_id = user_map[idx]

    # 3. Fetch user details
    conn = get_connection()
    cur = conn.cursor()
    try:
        cur.execute("SELECT id, name FROM users WHERE id = %s", (user_id,))
        user = cur.fetchone()
    finally:
        cur.close()
        conn.close()

    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    return {
        "role": "user",
        "user_id": user[0],
        "name": user[1],
        "message": "Face login successful"
    }