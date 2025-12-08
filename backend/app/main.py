from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import auth, doctors, patient_doctor, analysis, doctor_dashboard  # Add doctor_dashboard

app = FastAPI(
    title="DermaAI API",
    description="AI-Powered Dermatologist Assistant",
    version="1.0.0"
)



origins = [
    "http://localhost:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router)
#app.include_router(images.router) 
app.include_router(doctors.router)
app.include_router(patient_doctor.router)
app.include_router(analysis.router)
app.include_router(doctor_dashboard.router)

@app.get("/")
def read_root():
    return {"message": "DermaAI API is running"}
