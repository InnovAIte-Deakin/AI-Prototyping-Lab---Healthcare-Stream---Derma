import os
from fastapi import FastAPI, Request, Response
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
from app.services.auth import verify_media_access_token

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

class ProtectedStaticFiles(StaticFiles):
    async def __call__(self, scope, receive, send):
        if scope["type"] == "http":
            # Extract path relative to mount
            path = scope["path"].strip("/")
            if path.startswith("media/"):
                path = path[6:]
            
            # Extract token from query string
            query_string = scope.get("query_string", b"").decode("utf-8")
            token = None
            for param in query_string.split("&"):
                if param.startswith("token="):
                    token = param.split("=", 1)[1]
                    break
            
            verify_result = False
            if token:
                verify_result = verify_media_access_token(token, path)
            
            if not token or not verify_result:
                 response = Response("Forbidden", status_code=403)
                 await response(scope, receive, send)
                 return
                 
        await super().__call__(scope, receive, send)

# Mount static files for image uploads
MEDIA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "media")
os.makedirs(MEDIA_DIR, exist_ok=True)
app.mount("/media", ProtectedStaticFiles(directory=MEDIA_DIR), name="media")

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
# Trigger Reload
