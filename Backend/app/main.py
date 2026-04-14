from fastapi import FastAPI
from app.routes import auth, attendance, admin
from app.faiss_index import rebuild_faiss_from_db  
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup():
    print("Starting system...")
    rebuild_faiss_from_db()

    from app.faiss_index import index, user_map
    print(f"FAISS vectors: {index.ntotal}")
    print(f"user_map size: {len(user_map)}")
    print("System ready")


app.include_router(auth.router, prefix="/auth")
app.include_router(attendance.router, prefix="/attendance")
app.include_router(admin.router, prefix="/admin")