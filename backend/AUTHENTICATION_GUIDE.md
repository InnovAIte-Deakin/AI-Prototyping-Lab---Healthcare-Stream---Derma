# Authentication System Guide

**Simple explanation of how our authentication works and how to upgrade it later**

---

## Table of Contents
1. [What We Built (Sprint 1)](#what-we-built-sprint-1)
2. [How It Works - Simple Explanation](#how-it-works---simple-explanation)
3. [How to Use It](#how-to-use-it)
4. [Why It's Built This Way](#why-its-built-this-way)
5. [Sprint 2 Upgrade Path](#sprint-2-upgrade-path)
6. [Step-by-Step Upgrade Guide](#step-by-step-upgrade-guide)

---

## What We Built (Sprint 1)

We built a **simple authentication system** for Sprint 1 that:
- Lets users sign up with email and password
- Lets users log in
- Distinguishes between patients and doctors
- Protects certain routes (e.g., only patients can access patient features)

**Important:** This is intentionally simple for Sprint 1. It's designed to be easily upgraded to a more secure system in Sprint 2.

---

## How It Works - Simple Explanation

### 🔐 The Big Picture

Think of our authentication like a library card system:

1. **Sign Up** = Getting a library card
   - You provide your email and password
   - We give you a card number (user ID)

2. **Log In** = Showing your library card
   - You prove it's you with email + password
   - We give you back your card number

3. **Using Protected Features** = Accessing restricted sections
   - You show your card number every time you want to access something
   - We check if you're allowed to be there

### 📝 The Technical Flow

```
┌─────────────────────────────────────────────────────────────┐
│ STEP 1: User Signs Up                                       │
├─────────────────────────────────────────────────────────────┤
│ User → POST /auth/signup                                    │
│ {                                                           │
│   "email": "patient@example.com",                           │
│   "password": "mypassword",                                 │
│   "role": "patient"                                         │
│ }                                                           │
│                                                             │
│ Server →                                                    │
│   1. Checks if email already exists (reject if yes)        │
│   2. Hashes the password (so we never store plain text)    │
│   3. Creates User in database                              │
│   4. If role is "doctor", creates empty DoctorProfile too  │
│   5. Returns: { "id": 1, "email": "...", "role": "..." }   │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ STEP 2: User Logs In                                        │
├─────────────────────────────────────────────────────────────┤
│ User → POST /auth/login                                     │
│ {                                                           │
│   "email": "patient@example.com",                           │
│   "password": "mypassword"                                  │
│ }                                                           │
│                                                             │
│ Server →                                                    │
│   1. Finds user by email                                   │
│   2. Checks if password matches (using hash)               │
│   3. Returns: { "user_id": 1, "email": "...", "role": "..." }│
│                                                             │
│ Client →                                                    │
│   Stores user_id and role for future requests              │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ STEP 3: User Accesses Protected Feature                     │
├─────────────────────────────────────────────────────────────┤
│ User → GET /patient/dashboard                               │
│ Headers:                                                    │
│   X-User-Id: 1                                             │
│                                                             │
│ Server →                                                    │
│   1. Reads X-User-Id header                                │
│   2. Looks up user in database                             │
│   3. Checks if user exists and has correct role            │
│   4. Either returns data OR returns 401/403 error          │
└─────────────────────────────────────────────────────────────┘
```

---

## How to Use It

### For Frontend Developers

#### 1. **User Signs Up**

```javascript
// Frontend code example
const signup = async (email, password, role) => {
  const response = await fetch('http://localhost:8000/auth/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, role })
  });

  const data = await response.json();
  // Store data.id for later use
  localStorage.setItem('userId', data.id);
  localStorage.setItem('userRole', data.role);
};
```

#### 2. **User Logs In**

```javascript
const login = async (email, password) => {
  const response = await fetch('http://localhost:8000/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });

  const data = await response.json();
  // Store user_id for authenticated requests
  localStorage.setItem('userId', data.user_id);
  localStorage.setItem('userRole', data.role);
};
```

#### 3. **Make Authenticated Requests**

```javascript
const fetchPatientDashboard = async () => {
  const userId = localStorage.getItem('userId');

  const response = await fetch('http://localhost:8000/patient/dashboard', {
    headers: {
      'X-User-Id': userId  // ← This is the key part!
    }
  });

  return await response.json();
};
```

### For Backend Developers

#### 1. **Creating Protected Routes**

```python
from fastapi import APIRouter, Depends
from app.auth_helpers import get_current_patient, get_current_doctor
from app.models import User

router = APIRouter()

# Only patients can access this
@router.get("/patient/dashboard")
def patient_dashboard(user: User = Depends(get_current_patient)):
    return {"message": f"Welcome patient {user.email}"}

# Only doctors can access this
@router.get("/doctor/dashboard")
def doctor_dashboard(user: User = Depends(get_current_doctor)):
    return {"message": f"Welcome Dr. {user.email}"}

# Any authenticated user can access this
from app.auth_helpers import get_current_user

@router.get("/profile")
def get_profile(user: User = Depends(get_current_user)):
    return {"id": user.id, "email": user.email, "role": user.role}
```

---

## Why It's Built This Way

### Sprint 1 Goals
- ✅ **Get authentication working quickly** - We need users to sign up and log in NOW
- ✅ **Keep it simple** - Easy to understand and debug
- ✅ **Focus on functionality** - Prove the concept works

### What We Sacrificed (Temporarily)
- ⚠️ **Security** - Header-based auth can be faked (but OK for development)
- ⚠️ **Password Hashing** - Using SHA256 instead of bcrypt (faster but less secure)
- ⚠️ **Token Expiry** - Headers don't expire (user stays logged in forever)

### The Design Philosophy

**Think of it like building a house:**
- Sprint 1 = Building the frame and basic walls (functional but not finished)
- Sprint 2 = Adding locks, security system, and finishing touches

We intentionally built the "frame" with **upgrade points** marked everywhere:
- Every function has comments saying "Sprint 2: do this instead"
- All upgrade code is written but commented out
- You can upgrade piece by piece without rewriting everything

---

## Sprint 2 Upgrade Path

### What Changes in Sprint 2

| Feature | Sprint 1 (Now) | Sprint 2 (Later) |
|---------|----------------|------------------|
| **Authentication Method** | Headers (`X-User-Id`) | JWT Tokens (Bearer) |
| **Password Storage** | SHA256 hash | bcrypt hash |
| **Session Duration** | Forever (no expiry) | 30 min (with refresh) |
| **Security Level** | Basic (development) | Production-ready |

### Visual Comparison

#### Sprint 1 Flow (Current)
```
Login → Get user_id → Send X-User-Id header forever
```

#### Sprint 2 Flow (Upgraded)
```
Login → Get JWT token (expires 30min) → Send Bearer token in header
       → Token expires → Use refresh token to get new token
       → Refresh token expires → User logs in again
```

---

## Step-by-Step Upgrade Guide

### Overview
Upgrading takes about **2-3 hours** and requires changing **4 files**. All the code is already written and commented out—you just need to uncomment and swap it in!

### Prerequisites

```bash
# Install JWT and bcrypt libraries
pip install python-jose[cryptography] passlib[bcrypt]
```

### Step 1: Update Configuration (5 minutes)

**File:** `backend/app/config.py`

Add a secret key for signing JWT tokens:

```python
import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    DATABASE_URL: str = os.getenv("DATABASE_URL", "...")
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")

    # ✨ ADD THIS for Sprint 2
    SECRET_KEY: str = os.getenv("SECRET_KEY", "your-secret-key-change-in-production")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

settings = Settings()
```

**`.env` file:** Add `SECRET_KEY=your-super-secret-key-here`

### Step 2: Update Password Hashing (15 minutes)

**File:** `backend/app/auth_helpers.py`

**Replace this:**
```python
def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return hash_password(plain_password) == hashed_password
```

**With this:**
```python
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)
```

⚠️ **Important:** Existing user passwords will break! You'll need to:
- Option A: Reset all passwords (send reset emails)
- Option B: Migrate passwords on next login (check if SHA256, then rehash with bcrypt)

### Step 3: Uncomment JWT Token Functions (10 minutes)

**File:** `backend/app/auth_helpers.py`

Scroll to the bottom of the file and **uncomment** these functions:

```python
from datetime import datetime, timedelta
from jose import JWTError, jwt
from app.config import settings

SECRET_KEY = settings.SECRET_KEY
ALGORITHM = settings.ALGORITHM
ACCESS_TOKEN_EXPIRE_MINUTES = settings.ACCESS_TOKEN_EXPIRE_MINUTES

# Uncomment all these functions:
def create_access_token(data: dict, expires_delta: timedelta = None):
    # ... (already written, just uncomment)

def create_refresh_token(data: dict):
    # ... (already written, just uncomment)

def verify_token(token: str):
    # ... (already written, just uncomment)
```

### Step 4: Update `get_current_user` Function (20 minutes)

**File:** `backend/app/auth_helpers.py`

**Replace the entire function:**

```python
def get_current_user(request: Request, db: Session = Depends(get_db)) -> User:
    """Sprint 2: JWT token validation"""

    # Get token from Authorization header
    auth_header = request.headers.get("Authorization", "")

    if not auth_header.startswith("Bearer "):
        raise HTTPException(
            status_code=401,
            detail="Missing or invalid Authorization header"
        )

    token = auth_header.replace("Bearer ", "")

    try:
        # Verify and decode token
        payload = verify_token(token)
        user_id = int(payload.get("sub"))

        # Check token type
        if payload.get("type") != "access":
            raise HTTPException(status_code=401, detail="Invalid token type")

    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    # Look up user
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    return user
```

### Step 5: Update Login Endpoint (15 minutes)

**File:** `backend/app/routes/auth.py`

**Replace the return statement in the `login` function:**

```python
@router.post("/login")
def login(credentials: UserLogin, db: Session = Depends(get_db)):
    # ... (existing validation code stays the same)

    # ❌ DELETE THIS (Sprint 1):
    # return LoginResponse(
    #     user_id=user.id,
    #     email=user.email,
    #     role=user.role
    # )

    # ✅ ADD THIS (Sprint 2):
    from app.auth_helpers import create_access_token, create_refresh_token
    from datetime import timedelta

    access_token = create_access_token(
        data={"sub": str(user.id), "role": user.role},
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    refresh_token = create_refresh_token(data={"sub": str(user.id)})

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "expires_in": ACCESS_TOKEN_EXPIRE_MINUTES * 60,  # in seconds
        "user": {
            "id": user.id,
            "email": user.email,
            "role": user.role
        }
    }
```

### Step 6: Update Frontend (30 minutes)

**Change 1: Store tokens instead of user_id**

```javascript
// ❌ Sprint 1
localStorage.setItem('userId', data.user_id);

// ✅ Sprint 2
localStorage.setItem('accessToken', data.access_token);
localStorage.setItem('refreshToken', data.refresh_token);
```

**Change 2: Send Bearer token instead of X-User-Id**

```javascript
// ❌ Sprint 1
headers: {
  'X-User-Id': localStorage.getItem('userId')
}

// ✅ Sprint 2
headers: {
  'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
}
```

**Change 3: Add token refresh logic**

```javascript
const refreshAccessToken = async () => {
  const refreshToken = localStorage.getItem('refreshToken');

  const response = await fetch('http://localhost:8000/auth/refresh', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token: refreshToken })
  });

  const data = await response.json();
  localStorage.setItem('accessToken', data.access_token);
};

// Call this when you get a 401 error
```

### Step 7: Add Refresh Token Endpoint (20 minutes)

**File:** `backend/app/routes/auth.py`

Uncomment and add:

```python
@router.post("/refresh")
def refresh_token(refresh_token: str, db: Session = Depends(get_db)):
    """Generate new access token using refresh token"""
    try:
        payload = verify_token(refresh_token)

        # Check it's a refresh token
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=401, detail="Invalid token type")

        user_id = int(payload.get("sub"))
        user = db.query(User).filter(User.id == user_id).first()

        if not user:
            raise HTTPException(status_code=401, detail="User not found")

        # Create new access token
        access_token = create_access_token(
            data={"sub": str(user.id), "role": user.role}
        )

        return {
            "access_token": access_token,
            "token_type": "bearer"
        }

    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid refresh token")
```

### Step 8: Test Everything (30 minutes)

1. **Update all tests** to use Bearer tokens
2. **Test login flow** - Should return JWT tokens
3. **Test protected routes** - Should accept Bearer tokens
4. **Test token expiry** - Wait 30 minutes and verify token is rejected
5. **Test refresh flow** - Verify you can get new access token

---

## Quick Reference

### Sprint 1 (Current)

**Signup:**
```bash
curl -X POST http://localhost:8000/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","role":"patient"}'
```

**Login:**
```bash
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
# Returns: {"user_id":1,"email":"test@example.com","role":"patient"}
```

**Protected Request:**
```bash
curl -X GET http://localhost:8000/patient/dashboard \
  -H "X-User-Id: 1"
```

### Sprint 2 (After Upgrade)

**Login:**
```bash
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
# Returns: {"access_token":"eyJ...","refresh_token":"eyJ...","token_type":"bearer"}
```

**Protected Request:**
```bash
curl -X GET http://localhost:8000/patient/dashboard \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

## FAQ

### Q: Why did we build it this way?
**A:** Speed over security in Sprint 1. We need to prove the app works before adding complex security.

### Q: Is Sprint 1 secure enough for production?
**A:** No. Use Sprint 2 upgrades before deploying publicly.

### Q: Can I use Sprint 1 for development?
**A:** Yes! It's perfect for development and testing.

### Q: How long does the upgrade take?
**A:** About 2-3 hours if you follow this guide.

### Q: Will upgrading break existing users?
**A:** Yes, passwords will break. You'll need to reset them or migrate on next login.

### Q: Can I upgrade piece by piece?
**A:** Not really. The upgrade is all-or-nothing because headers and tokens are incompatible.

### Q: Do I need to change the database?
**A:** No! The User model stays exactly the same.

---

## Summary

**What we have now (Sprint 1):**
- Simple header-based authentication
- Quick to implement and test
- Perfect for development
- Easy to understand

**What we'll have later (Sprint 2):**
- Industry-standard JWT authentication
- Secure password hashing with bcrypt
- Token expiry and refresh logic
- Production-ready security

**The upgrade path:**
- All upgrade code is already written
- Just uncomment and swap
- Takes 2-3 hours total
- Changes 4 files

**Bottom line:** We built a simple system now that's designed to become secure later. Think of it as a scaffolding that becomes a building.
