from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Text, Float, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from sqlalchemy.sql import func
from app.db import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    password = Column(String, nullable=False)
    role = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class DoctorProfile(Base):
    __tablename__ = "doctor_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    full_name = Column(String, nullable=False)
    clinic_name = Column(String)
    bio = Column(Text)

class PatientDoctorLink(Base):
    __tablename__ = "patient_doctor_links"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    doctor_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    status = Column(String, default="active", nullable=False)

class Image(Base):
    __tablename__ = "images"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    doctor_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    image_url = Column(String, nullable=False)
    uploaded_at = Column(DateTime(timezone=True), server_default=func.now())
    
    analysis_reports = relationship("AnalysisReport", back_populates="image")

class AnalysisReport(Base):
    __tablename__ = "analysis_reports"
    
    id = Column(Integer, primary_key=True, index=True)
    image_id = Column(Integer, ForeignKey("images.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Structured fields (new/ensure these exist)
    condition = Column(String, nullable=True)  # Primary detected condition
    confidence = Column(Float, nullable=True)   # Confidence score (0-1)
    recommendation = Column(Text, nullable=True) # Clinical recommendation
    
    # JSON field for complete analysis
    report_json = Column(JSON, nullable=True)  # Full structured output
    
    # Keep raw output if needed
    raw_output = Column(Text, nullable=True)   # Original model response
    
    # Relationships
    image = relationship("Image", back_populates="analysis_reports")
