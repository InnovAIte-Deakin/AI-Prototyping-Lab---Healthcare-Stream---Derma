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
from typing import Literal, Optional


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
    Login response schema with JWT token.
    """
    access_token: str
    token_type: str = "bearer"
    user_id: int
    email: str
    role: str


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
