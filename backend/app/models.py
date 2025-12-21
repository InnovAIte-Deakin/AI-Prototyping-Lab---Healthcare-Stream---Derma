from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Text, Float, JSON, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from sqlalchemy.sql import func
from app.db import Base


def _utc_now():
    """Return an aware UTC datetime."""
    return datetime.now(timezone.utc)


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
    patient_id = Column(Integer, ForeignKey("users.id"), nullable=True) # Check if we want nullable=False. Let's make it True for migration ease, or False if we are resetting. User reset DB recently. Let's make it nullable=True first to avoid immediate constraint errors if rows exist, but ideally False.
    # Actually, the user just reset the DB. So I can make it nullable=False if I want.
    # But wait, the previous code tried to insert it.
    # Let's match the code structure.
    
    created_at = Column(DateTime(timezone=True), default=_utc_now)
    
    # Relationships and tracking (Phase 1 updates)
    doctor_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    review_status = Column(String, default="none", nullable=False) # none, pending, accepted, reviewed
    doctor_active = Column(Boolean, default=False, nullable=False)
    
    # Structured fields 
    condition = Column(String, nullable=True)  # Primary detected condition
    confidence = Column(Float, nullable=True)   # Confidence score (0-1)
    recommendation = Column(Text, nullable=True) # Clinical recommendation
    
    # JSON field for complete analysis
    report_json = Column(JSON, nullable=True)  # Full structured output
    
    # Keep raw output if needed
    raw_output = Column(Text, nullable=True)   # Original model response
    
    # Relationships
    image = relationship("Image", back_populates="analysis_reports")
    chat_messages = relationship("ChatMessage", back_populates="report", cascade="all, delete-orphan")

class ChatMessage(Base):
    __tablename__ = "chat_messages"
    
    id = Column(Integer, primary_key=True, index=True)
    report_id = Column(Integer, ForeignKey("analysis_reports.id"), nullable=False)
    sender_id = Column(Integer, ForeignKey("users.id"), nullable=True) # Null for AI
    sender_role = Column(String, nullable=False) # "patient", "doctor", or "ai"
    message = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), default=_utc_now)

    # Relationships
    report = relationship("AnalysisReport", back_populates="chat_messages")
