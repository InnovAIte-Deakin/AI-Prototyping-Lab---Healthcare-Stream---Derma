"""
Pydantic schemas for request/response validation.

Sprint 1: Simple header-based authentication
Sprint 2 Upgrade Path:
- Add password hashing (bcrypt/passlib)
- Implement JWT tokens instead of header-based auth
- Add token expiry and refresh token logic
- Add email validation and password strength requirements
"""

from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import Literal, Optional, List
from datetime import datetime


class UserSignup(BaseModel):
    """
    User registration schema.

    Sprint 2 upgrades:
    - Add password strength validation (min length, complexity)
    - Add email verification flow
    - Add optional fields (name, phone)
    """
    email: EmailStr
    password: str = Field(..., min_length=6, description="Sprint 1: min 6 chars. Sprint 2: Add complexity rules")
    role: Literal["patient", "doctor"] = Field(..., description="User role: patient or doctor")

    @field_validator('role')
    @classmethod
    def validate_role(cls, v):
        if v not in ["patient", "doctor"]:
            raise ValueError('Role must be either "patient" or "doctor"')
        return v


class UserLogin(BaseModel):
    """
    User login schema.

    Sprint 2 upgrades:
    - Return JWT token instead of user_id
    - Add refresh token support
    - Add rate limiting for failed attempts
    """
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    """
    User response schema for API responses.

    Sprint 2 upgrades:
    - Add JWT token fields (access_token, refresh_token, token_type)
    - Add expires_at timestamp
    - Remove sensitive data exposure
    """
    id: int
    email: str
    role: str

    class Config:
        from_attributes = True  # Allows conversion from ORM models


class LoginResponse(BaseModel):
    """
    Login response schema.

    Sprint 1: Returns user details for header-based auth
    Sprint 2: Will return JWT tokens instead
    """
    user_id: int
    email: str
    role: str
    # Sprint 2: Add these fields
    # access_token: str
    # refresh_token: str
    # token_type: str = "bearer"
    # expires_in: int


class DoctorResponse(BaseModel):
    """Doctor details with associated profile information."""
    id: int
    email: EmailStr
    full_name: str
    clinic_name: Optional[str] = None
    bio: Optional[str] = None


class PatientDoctorResponse(BaseModel):
    """Response for patient doctor linkage operations."""
    doctor: DoctorResponse
    status: str


class SelectDoctorRequest(BaseModel):
    """Request body for selecting a doctor."""
    doctor_id: int


# ============================================================================
# IMAGE UPLOAD SCHEMAS
# ============================================================================

class ImageUploadResponse(BaseModel):
    """Response after uploading an image."""
    image_id: int
    image_url: str
    doctor_id: Optional[int] = None


# ============================================================================
# CASE/ANALYSIS WORKFLOW SCHEMAS
# ============================================================================

class CaseResponse(BaseModel):
    """Response for a case/analysis report with workflow status."""
    id: int
    image_id: int
    image_url: str
    patient_id: int
    doctor_id: Optional[int] = None
    review_status: str
    doctor_active: bool
    created_at: datetime
    report_json: Optional[str] = None

    class Config:
        from_attributes = True


class CaseListResponse(BaseModel):
    """List of cases for a patient or doctor."""
    cases: List[CaseResponse]


class RequestReviewResponse(BaseModel):
    """Response after requesting doctor review."""
    report_id: int
    review_status: str
    message: str


class AcceptReviewResponse(BaseModel):
    """Response after doctor accepts a review."""
    report_id: int
    review_status: str
    doctor_active: bool
    message: str


# ============================================================================
# CHAT SCHEMAS
# ============================================================================

class ChatMessageCreate(BaseModel):
    """Request body for creating a chat message."""
    message: str = Field(..., min_length=1, max_length=5000)


class ChatMessageResponse(BaseModel):
    """Response for a single chat message."""
    id: int
    sender_id: int
    sender_role: str
    message: str
    created_at: datetime

    class Config:
        from_attributes = True


class ChatHistoryResponse(BaseModel):
    """Response containing chat history for a case."""
    report_id: int
    doctor_active: bool
    review_status: str
    messages: List[ChatMessageResponse]


# Sprint 2: Add these additional schemas
# class Token(BaseModel):
#     access_token: str
#     refresh_token: str
#     token_type: str = "bearer"
#
# class TokenData(BaseModel):
#     user_id: int
#     email: str
#     role: str
#     exp: datetime

