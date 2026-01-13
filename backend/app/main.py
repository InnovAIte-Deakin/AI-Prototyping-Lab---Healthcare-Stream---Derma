import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.routes import (
    auth,
    doctors,
    patient_doctor,
    analysis,
    images,
    cases,
    doctor_dashboard,
    websocket,
    public_try,
    health,
    media,
)

app = FastAPI(
    title="DermaAI API",
    description="AI-Powered Dermatologist Assistant",
    version="1.0.0"
)



origins = [
    "http://localhost:5173",
    "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files for image uploads
MEDIA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "media")
os.makedirs(MEDIA_DIR, exist_ok=True)
app.mount("/media", StaticFiles(directory=MEDIA_DIR), name="media")

# Include WebSocket router FIRST (before static files)
app.include_router(websocket.router)

# Public/anonymous routes
app.include_router(public_try.router)

# Include routers
app.include_router(auth.router)
app.include_router(doctors.router)
app.include_router(patient_doctor.router)
app.include_router(analysis.router)
app.include_router(images.router)
app.include_router(cases.router)
app.include_router(doctor_dashboard.router)
app.include_router(health.router)
app.include_router(media.router)


@app.get("/")
def read_root():
    return {"message": "DermaAI API is running"}
