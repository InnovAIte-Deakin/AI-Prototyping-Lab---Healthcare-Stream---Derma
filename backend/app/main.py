from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.observability import configure_logging, request_id_middleware
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
    patients,
    admin,
)  # Registered routers

app = FastAPI(
    title="DermaAI API",
    description="AI-Powered Dermatologist Assistant",
    version="1.0.0"
)

configure_logging()



origins = [
    "http://localhost:5173",
    "http://localhost:3000",
    "http://127.0.0.1:5173",  # CI uses 127.0.0.1 instead of localhost
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["X-Request-ID"],
)

app.middleware("http")(request_id_middleware)

# Include WebSocket router FIRST (before static files)
app.include_router(websocket.router)

# Public/anonymous routes
app.include_router(public_try.router)

# Include routers
app.include_router(auth.router)
app.include_router(images.router)
app.include_router(doctors.router)
app.include_router(patient_doctor.router)
app.include_router(analysis.router)
app.include_router(cases.router)
app.include_router(doctor_dashboard.router)
app.include_router(health.router)
app.include_router(media.router)
app.include_router(patients.router)
app.include_router(admin.router)

@app.get("/")
def read_root():
    return {"message": "DermaAI API is running"}
# Trigger Reload
