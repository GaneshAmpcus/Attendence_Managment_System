import faiss
import numpy as np
from app.config import FAISS_INDEX_PATH
from app.db import get_connection
import logging
import threading

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

DIM = 512
_lock = threading.RLock()

index = faiss.IndexFlatIP(DIM)
user_map = []


def save_index():
    faiss.write_index(index, FAISS_INDEX_PATH)


def search_embedding(query_embedding, k=1):
    query = np.array([query_embedding]).astype("float32")
    with _lock:
        distances, indices = index.search(query, k)
    return distances, indices


def rebuild_faiss_from_db():
    """Single source of truth. Rebuilds both index and user_map from DB."""
    logger.info("Rebuilding FAISS index from DB...")

    conn = get_connection()
    cur = conn.cursor()
    cur.execute("SELECT user_id, embedding FROM face_embeddings ORDER BY id")
    rows = cur.fetchall()
    cur.close()
    conn.close()

    logger.info(f"Total embeddings from DB: {len(rows)}")

    with _lock:
        index.reset()
        user_map.clear()          # ← clear(), never user_map = []
        for user_id, emb in rows:
            vec = np.array([emb]).astype("float32")
            index.add(vec)
            user_map.append(user_id)
        save_index()

    logger.info(f"FAISS rebuilt. Total vectors: {index.ntotal}")


def load_index():
    global index
    try:
        index = faiss.read_index(FAISS_INDEX_PATH)
    except:
        pass



def add_embedding(embedding, user_id):
    vec = np.array([embedding]).astype("float32")
    index.add(vec)
    user_map.append(user_id)
    save_index()



def load_user_map_from_db():
    global user_map

    conn = get_connection()
    cur = conn.cursor()

    cur.execute("""
        SELECT user_id FROM face_embeddings ORDER BY id
    """)

    rows = cur.fetchall()

    # DO NOT REASSIGN
    user_map.clear()
    user_map.extend([row[0] for row in rows])

    cur.close()
    conn.close()

    logger.info(f"user_map loaded: {len(user_map)}")
