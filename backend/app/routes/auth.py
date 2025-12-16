"""
Authentication routes (JWT-based).
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db import get_db
from app.models import User, DoctorProfile
from app.schemas import UserSignup, UserLogin, LoginResponse, UserResponse
from app.services.auth import get_password_hash, verify_password, create_access_token
from app.auth_helpers import get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/signup", response_model=LoginResponse, status_code=status.HTTP_201_CREATED)
def signup(user_data: UserSignup, db: Session = Depends(get_db)):
    """
    Register a new user account and auto-login (return JWT).
    """
    # Check if email already exists
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )

    # Hash the password
    hashed_password = get_password_hash(user_data.password)

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
                full_name="", 
                clinic_name=None,
                bio=None
            )
            db.add(doctor_profile)
            db.commit()

        # Auto-login: Generate JWT token
        access_token = create_access_token(data={"sub": str(new_user.id), "role": new_user.role})

        return LoginResponse(
            access_token=access_token,
            token_type="bearer",
            user_id=new_user.id,
            email=new_user.email,
            role=new_user.role
        )

    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create user: {str(e)}"
        )


@router.post("/login", response_model=LoginResponse)
def login(credentials: UserLogin, db: Session = Depends(get_db)):
    """
    Authenticate user and return JWT token.
    """
    # Find user by email
    user = db.query(User).filter(User.email == credentials.email).first()

    # Verify user exists and password is correct
    if not user or not verify_password(credentials.password, user.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Generate JWT token
    access_token = create_access_token(data={"sub": str(user.id), "role": user.role})
    
    return LoginResponse(
        access_token=access_token,
        token_type="bearer",
        user_id=user.id,
        email=user.email,
        role=user.role
    )


@router.post("/logout")
def logout(current_user: User = Depends(get_current_user)):
    """
    Logout the user. 
    Note: For JWT, this is mainly a client-side action (discard token).
    In a full implementation, this could add the token to a blacklist.
    """
    return {"message": "Successfully logged out"}


@router.get("/me", response_model=UserResponse)
def get_current_user_info(current_user: User = Depends(get_current_user)):
    """Get current authenticated user details."""
    return current_user
