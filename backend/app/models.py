from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Text, Boolean
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


class AnalysisReport(Base):
    __tablename__ = "analysis_reports"
    
    id = Column(Integer, primary_key=True, index=True)
    image_id = Column(Integer, ForeignKey("images.id"), nullable=False)
    patient_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    doctor_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    report_json = Column(Text, nullable=False)
    # Structured analysis fields (used by tests and endpoints)
    condition = Column(String, nullable=True)
    confidence = Column(String, nullable=True)
    recommendation = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    # Workflow status: none | pending | accepted | reviewed
    review_status = Column(String, default="none", nullable=False)
    # When True, AI replies are paused (doctor is actively responding)
    doctor_active = Column(Boolean, default=False, nullable=False)


class ChatMessage(Base):
    """Messages in the doctor-patient chat for a case/report."""
    __tablename__ = "chat_messages"

    id = Column(Integer, primary_key=True, index=True)
    report_id = Column(Integer, ForeignKey("analysis_reports.id"), nullable=False)
    sender_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    sender_role = Column(String, nullable=False)  # patient | doctor | ai
    message = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
