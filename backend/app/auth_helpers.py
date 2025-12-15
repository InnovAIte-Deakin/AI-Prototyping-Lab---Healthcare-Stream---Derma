"""
Authentication dependencies and helpers.
"""

from fastapi import Request, HTTPException, Depends, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from app.db import get_db
from app.models import User
from app.services.auth import verify_token

# OAuth2 scheme for Swagger UI header support
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> User:
    """
    Retrieve the current authenticated user from JWT token.
    FastAPI's OAuth2PasswordBearer extracts the token from the Authorization header.
    """
    payload = verify_token(token)
    
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user_id_str = payload.get("sub")
    if user_id_str is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token missing user identification",
        )
        
    try:
        user_id = int(user_id_str)
    except ValueError:
        raise HTTPException(status_code=401, detail="Invalid token subject")

    # Query user from database
    user = db.query(User).filter(User.id == user_id).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )

    return user


def get_current_patient(
    current_user: User = Depends(get_current_user)
) -> User:
    """Verify that the current user is a patient."""
    if current_user.role != "patient":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Patient role required."
        )
    return current_user


def get_current_doctor(
    current_user: User = Depends(get_current_user)
) -> User:
    """Verify that the current user is a doctor."""
    if current_user.role != "doctor":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Doctor role required."
        )
    return current_user
