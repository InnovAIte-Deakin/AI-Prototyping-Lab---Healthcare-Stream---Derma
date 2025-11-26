"""
Authentication routes.

Sprint 1: Simple signup/login with header-based auth
Sprint 2 Upgrades:
- Return JWT tokens instead of user_id
- Add email verification
- Add password reset flow
- Add rate limiting
- Add OAuth2 integration (Google, etc.)
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db import get_db
from app.models import User, DoctorProfile
from app.schemas import UserSignup, UserLogin, LoginResponse, UserResponse
from app.auth_helpers import hash_password, verify_password

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/signup", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def signup(user_data: UserSignup, db: Session = Depends(get_db)):
    """
    Register a new user account.

    Sprint 1: Creates user with hashed password
    - If role is "doctor", also creates an empty DoctorProfile
    - Returns user details (id, email, role)

    Sprint 2 upgrades:
    - Add email verification (send confirmation email)
    - Add stronger password validation
    - Return JWT tokens for immediate login
    - Add rate limiting to prevent abuse

    Args:
        user_data: UserSignup schema (email, password, role)
        db: Database session

    Returns:
        UserResponse: Created user details (id, email, role)

    Raises:
        HTTPException 400: If email already exists
        HTTPException 500: If database operation fails
    """
    # Check if email already exists
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )

    # Hash the password (Sprint 1: simple hash, Sprint 2: bcrypt)
    hashed_password = hash_password(user_data.password)

    # Create user
    new_user = User(
        email=user_data.email,
        password=hashed_password,
        role=user_data.role
    )

    try:
        db.add(new_user)
        db.commit()
        db.refresh(new_user)

        # If role is doctor, create an empty DoctorProfile
        if user_data.role == "doctor":
            doctor_profile = DoctorProfile(
                user_id=new_user.id,
                full_name="",  # Will be filled later in B4
                clinic_name=None,
                bio=None
            )
            db.add(doctor_profile)
            db.commit()

        return new_user

    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create user: {str(e)}"
        )


@router.post("/login", response_model=LoginResponse)
def login(credentials: UserLogin, db: Session = Depends(get_db)):
    """
    Authenticate user and return login details.

    Sprint 1: Returns user_id, email, role for header-based auth
    - Client should store user_id and send it in X-User-Id header
    - Client should store role and send it in X-User-Role header

    Sprint 2 upgrades:
    - Return JWT access_token and refresh_token
    - Add token expiry timestamps
    - Add rate limiting for failed attempts
    - Add login audit logging

    Args:
        credentials: UserLogin schema (email, password)
        db: Database session

    Returns:
        LoginResponse: user_id, email, role (Sprint 2: will include JWT tokens)

    Raises:
        HTTPException 401: If credentials are invalid

    Example Sprint 2 response:
        {
            "access_token": "eyJhbGc...",
            "refresh_token": "eyJhbGc...",
            "token_type": "bearer",
            "expires_in": 1800,
            "user": {
                "id": 1,
                "email": "user@example.com",
                "role": "patient"
            }
        }
    """
    # Find user by email
    user = db.query(User).filter(User.email == credentials.email).first()

    # Verify user exists and password is correct
    if not user or not verify_password(credentials.password, user.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    # Sprint 1: Return user details for header-based auth
    return LoginResponse(
        user_id=user.id,
        email=user.email,
        role=user.role
    )

    # Sprint 2: Replace above with JWT token generation:
    # from app.auth_helpers import create_access_token, create_refresh_token
    # access_token = create_access_token(data={"sub": str(user.id), "role": user.role})
    # refresh_token = create_refresh_token(data={"sub": str(user.id)})
    # return {
    #     "access_token": access_token,
    #     "refresh_token": refresh_token,
    #     "token_type": "bearer",
    #     "expires_in": 1800,
    #     "user": {"id": user.id, "email": user.email, "role": user.role}
    # }


# ============================================================================
# SPRINT 2: Additional endpoints to implement
# ============================================================================

# @router.post("/refresh")
# def refresh_token(refresh_token: str, db: Session = Depends(get_db)):
#     """Generate new access token using refresh token"""
#     pass
#
# @router.post("/logout")
# def logout(current_user: User = Depends(get_current_user)):
#     """Invalidate tokens (add to blacklist)"""
#     pass
#
# @router.post("/forgot-password")
# def forgot_password(email: str, db: Session = Depends(get_db)):
#     """Send password reset email"""
#     pass
#
# @router.post("/reset-password")
# def reset_password(token: str, new_password: str, db: Session = Depends(get_db)):
#     """Reset password using token from email"""
#     pass
#
# @router.post("/verify-email")
# def verify_email(token: str, db: Session = Depends(get_db)):
#     """Verify email address using token"""
#     pass
#
# @router.get("/me")
# def get_current_user_info(current_user: User = Depends(get_current_user)):
#     """Get current authenticated user details"""
#     return current_user
