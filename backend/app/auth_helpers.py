"""
Authentication helper functions.

Sprint 1: Header-based authentication (X-User-Id, X-User-Role)
Sprint 2 Upgrade Path:
- Replace header auth with JWT token validation
- Add proper password hashing (bcrypt)
- Add token expiry validation
- Add refresh token logic
"""

from fastapi import Request, HTTPException, Depends
from sqlalchemy.orm import Session
from app.db import get_db
from app.models import User
import hashlib


# ============================================================================
# PASSWORD UTILITIES
# Sprint 1: Simple hashing (NOT SECURE - for development only)
# Sprint 2: Replace with bcrypt or passlib
# ============================================================================

def hash_password(password: str) -> str:
    """
    Hash a password for storage.

    Sprint 1: Using SHA256 (NOT SECURE - for development only)
    Sprint 2: Replace with bcrypt.hashpw() or passlib.hash()

    Example Sprint 2 implementation:
        from passlib.context import CryptContext
        pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
        return pwd_context.hash(password)
    """
    # WARNING: SHA256 is NOT secure for password storage!
    # This is only for Sprint 1 development
    return hashlib.sha256(password.encode()).hexdigest()


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify a password against a hash.

    Sprint 1: Simple hash comparison
    Sprint 2: Replace with bcrypt.checkpw() or passlib.verify()

    Example Sprint 2 implementation:
        return pwd_context.verify(plain_password, hashed_password)
    """
    return hash_password(plain_password) == hashed_password


# ============================================================================
# AUTHENTICATION DEPENDENCIES
# Sprint 1: Header-based (X-User-Id)
# Sprint 2: JWT token validation
# ============================================================================

def get_current_user(
    request: Request,
    db: Session = Depends(get_db)
) -> User:
    """
    Retrieve the current authenticated user from request headers.

    Sprint 1: Reads X-User-Id header and validates user exists
    Sprint 2: Will validate JWT token from Authorization header

    Args:
        request: FastAPI request object
        db: Database session

    Returns:
        User: The authenticated user object

    Raises:
        HTTPException: 401 if authentication fails

    Sprint 2 upgrade example:
        from jose import JWTError, jwt

        token = request.headers.get("Authorization", "").replace("Bearer ", "")
        if not token:
            raise HTTPException(status_code=401, detail="Missing token")

        try:
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            user_id = payload.get("sub")
        except JWTError:
            raise HTTPException(status_code=401, detail="Invalid token")
    """
    # Sprint 1: Read X-User-Id header
    user_id_header = request.headers.get("X-User-Id")

    if not user_id_header:
        raise HTTPException(
            status_code=401,
            detail="Missing X-User-Id header. Sprint 2: Will require JWT token"
        )

    try:
        user_id = int(user_id_header)
    except ValueError:
        raise HTTPException(
            status_code=401,
            detail="Invalid X-User-Id header format"
        )

    # Query user from database
    user = db.query(User).filter(User.id == user_id).first()

    if not user:
        raise HTTPException(
            status_code=401,
            detail="User not found"
        )

    return user


def get_current_patient(
    current_user: User = Depends(get_current_user)
) -> User:
    """
    Verify that the current user is a patient.

    This dependency can be chained after get_current_user to enforce
    role-based access control.

    Args:
        current_user: The authenticated user (from get_current_user)

    Returns:
        User: The authenticated patient user

    Raises:
        HTTPException: 403 if user is not a patient

    Usage:
        @router.get("/patient/dashboard")
        def patient_dashboard(user: User = Depends(get_current_patient)):
            return {"message": f"Welcome patient {user.email}"}
    """
    if current_user.role != "patient":
        raise HTTPException(
            status_code=403,
            detail="Access denied. Patient role required."
        )
    return current_user


def get_current_doctor(
    current_user: User = Depends(get_current_user)
) -> User:
    """
    Verify that the current user is a doctor.

    This dependency can be chained after get_current_user to enforce
    role-based access control.

    Args:
        current_user: The authenticated user (from get_current_user)

    Returns:
        User: The authenticated doctor user

    Raises:
        HTTPException: 403 if user is not a doctor

    Usage:
        @router.get("/doctor/dashboard")
        def doctor_dashboard(user: User = Depends(get_current_doctor)):
            return {"message": f"Welcome Dr. {user.email}"}
    """
    if current_user.role != "doctor":
        raise HTTPException(
            status_code=403,
            detail="Access denied. Doctor role required."
        )
    return current_user


# ============================================================================
# JWT TOKEN UTILITIES (Sprint 2)
# Commented out for Sprint 1, uncomment and implement in Sprint 2
# ============================================================================

# from datetime import datetime, timedelta
# from jose import JWTError, jwt
# from app.config import settings
#
# SECRET_KEY = settings.SECRET_KEY  # Add to config in Sprint 2
# ALGORITHM = "HS256"
# ACCESS_TOKEN_EXPIRE_MINUTES = 30
# REFRESH_TOKEN_EXPIRE_DAYS = 7
#
#
# def create_access_token(data: dict, expires_delta: timedelta = None):
#     """Create JWT access token"""
#     to_encode = data.copy()
#     if expires_delta:
#         expire = datetime.utcnow() + expires_delta
#     else:
#         expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
#     to_encode.update({"exp": expire, "type": "access"})
#     encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
#     return encoded_jwt
#
#
# def create_refresh_token(data: dict):
#     """Create JWT refresh token"""
#     to_encode = data.copy()
#     expire = datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
#     to_encode.update({"exp": expire, "type": "refresh"})
#     encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
#     return encoded_jwt
#
#
# def verify_token(token: str):
#     """Verify and decode JWT token"""
#     try:
#         payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
#         return payload
#     except JWTError:
#         raise HTTPException(status_code=401, detail="Invalid token")
