from deepface import DeepFace
import numpy as np
import cv2

def get_embedding(image_file):
    # Read bytes from the SpooledTemporaryFile
    file_bytes = image_file.read()
    
    # Decode into a numpy array (BGR image)
    nparr = np.frombuffer(file_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    if img is None:
        raise ValueError("Could not decode image.")

    result = DeepFace.represent(
        img_path=img,           # ← numpy array, not file object
        model_name="ArcFace",
        enforce_detection=True
    )

    embedding = np.array(result[0]["embedding"]).astype("float32")
    norm = np.linalg.norm(embedding)
    embedding = embedding / norm

    return embedding