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
from app.services.public_session_store import public_session_store
from app.config import MEDIA_ROOT
from app.models import Image, AnalysisReport, ChatMessage
import os
import shutil
from pathlib import Path

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

        if user_data.role == "doctor":
            default_name = f"Dr. {new_user.email.split('@')[0].replace('.', ' ').title()}"
            doctor_profile = DoctorProfile(
                user_id=new_user.id,
                full_name=default_name,
                clinic_name="Clinic pending update",
                bio="Doctor profile to be completed.",
                avatar_url="https://placehold.co/128x128?text=Dr"
            )
            db.add(doctor_profile)
            db.commit()

        # Link Anonymous Session if provided
        if user_data.public_session_id:
            try:
                # 1. Fetch Session (Handle 404 silently)
                try:
                    session = public_session_store.get_session(user_data.public_session_id)
                except HTTPException:
                    session = None
                
                if session and session.get("image_path"):
                    # 2. Migrate Image File
                    src_path = Path(session["image_path"])
                    if not src_path.is_absolute():
                        src_path = MEDIA_ROOT / src_path
                    if src_path.exists():
                        target_dir = MEDIA_ROOT / "uploads"
                        target_dir.mkdir(parents=True, exist_ok=True)
                        target_path = target_dir / src_path.name
                        shutil.move(str(src_path), str(target_path))
                        final_image_path = (Path("uploads") / src_path.name).as_posix()

                        # 3. Create Image Record
                        new_image = Image(
                            patient_id=new_user.id,
                            image_url=final_image_path
                        )
                        db.add(new_image)
                        db.commit()
                        db.refresh(new_image)
                        
                        # 4. Create Analysis Report
                        an = session.get("analysis", {})
                        new_report = AnalysisReport(
                            image_id=new_image.id,
                            patient_id=new_user.id,
                            condition=an.get("condition"),
                            confidence=an.get("confidence"),
                            recommendation=an.get("recommendation"),
                            report_json=an,
                            review_status="none"
                        )
                        db.add(new_report)
                        db.commit()
                        db.refresh(new_report)
                        
                        # 5. Seed Initial AI Message (if not present)
                        an = session.get("analysis", {})
                        msg_text = f"Hello! I've analyzed your image. Based on the scan, I detect signs of {an.get('condition', 'Unknown')}. My confidence is {int(float(an.get('confidence', 0))) or 0}%. {an.get('recommendation', '')}"
                        
                        seed_msg = ChatMessage(
                            report_id=new_report.id,
                            sender_role="ai",
                            message=msg_text
                        )
                        db.add(seed_msg)

                        # 6. Migrate Chat Messages
                        for msg in session.get("messages", []):
                            # msg is SimpleNamespace object
                            role = "patient" if msg.sender_role == "patient" else "ai"
                            sender_id = new_user.id if role == "patient" else None
                            
                            chat_entry = ChatMessage(
                                report_id=new_report.id,
                                sender_id=sender_id,
                                sender_role=role,
                                message=msg.message
                            )
                            db.add(chat_entry)
                        db.commit()

            except Exception as e:
                print(f"Failed to link anonymous session: {e}")
                # Don't fail the signup, just log
                pass

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
