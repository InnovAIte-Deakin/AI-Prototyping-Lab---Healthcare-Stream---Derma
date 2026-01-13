"""
Pydantic schemas for request/response validation.

Sprint 1: Simple header-based authentication
Sprint 2 Upgrade Path:
- Add password hashing (bcrypt/passlib)
- Implement JWT tokens instead of header-based auth
- Add token expiry and refresh token logic
- Add email validation and password strength requirements
"""

from pydantic import BaseModel, EmailStr, Field, field_validator, ConfigDict
from typing import Literal, Optional, List, Dict, Any
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
    public_session_id: Optional[str] = Field(None, description="Link anonymous session on signup")

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
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: str
    role: str


class LoginResponse(BaseModel):
    """
    Login response schema with JWT token.
    """
    access_token: str
    token_type: str = "bearer"
    user_id: int
    email: str
    role: str


class DoctorResponse(BaseModel):
    """Doctor details with associated profile information."""
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: EmailStr
    full_name: str
    clinic_name: str
    bio: str
    avatar_url: str


class PatientDoctorResponse(BaseModel):
    """Response for patient doctor linkage operations."""
    doctor: DoctorResponse
    status: str


class SelectDoctorRequest(BaseModel):
    """Request body for selecting a doctor."""
    doctor_id: int


class ChangeDoctorRequest(BaseModel):
    """Request body for changing doctor (Task 7)."""
    doctor_id: int
    reason: Optional[str] = Field(None, max_length=500)


class ChangeDoctorResponse(BaseModel):
    """Response after changing doctor (Task 7)."""
    doctor: DoctorResponse
    status: str
    previous_doctor_id: Optional[int] = None


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


class ChatRequest(BaseModel):
    """Request body for AI chat about a lesion."""
    message: str = Field(..., min_length=1, max_length=5000)


class ChatResponse(BaseModel):
    """Response from AI chat about a lesion."""
    image_id: int
    user_message: str
    ai_response: str
    context_used: bool = True


# ============================================================================
# ANALYSIS SCHEMAS
# ============================================================================

class AnalysisResult(BaseModel):
    """
    Structured analysis result from Gemini.
    """
    condition: str = Field(..., description="Predicted skin condition")
    confidence: float = Field(..., description="Confidence score 0-100")
    severity: Literal["Low", "Moderate", "High"] = Field(..., description="Severity level")
    characteristics: List[str] = Field(..., description="List of visible features")
    recommendation: str = Field(..., description="Actionable recommendation")
    disclaimer: str


class AnalysisReportResponse(BaseModel):
    """Response schema for analysis reports"""
    model_config = ConfigDict(from_attributes=True)

    id: int
    image_id: int
    condition: str
    confidence: float
    recommendation: str
    report_json: Dict[str, Any]
    raw_output: Optional[str] = None
    created_at: datetime


class ChatMessage(BaseModel):
    """Schema for chat messages"""
    role: str = Field(..., description="Role: 'user' or 'Doctor'")
    content: str = Field(..., description="Message content")


# ============================================================================
# PUBLIC/ANONYMOUS SCHEMAS
# ============================================================================

class PublicChatRequest(BaseModel):
    """Request body for anonymous chat preview."""
    session_id: str = Field(..., description="Anonymous session identifier")
    message: str = Field(..., min_length=1, max_length=1000)


class PublicChatResponse(BaseModel):
    """Response for anonymous chat preview."""
    session_id: str
    reply: str
    analysis: Dict[str, Any]
