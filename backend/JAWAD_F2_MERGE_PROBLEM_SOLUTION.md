# PR #21 (F2) Test Failure - Problem & Solution

## Problem Overview

When attempting to merge PR #21 (feat: add login UI and integrate AuthContext with protected routing), the backend tests were failing with the following error:

```
sqlalchemy.exc.ArgumentError: Expected string or URL object, got None
```

### Test Failure Details

- **Error Location**: `backend/tests/conftest.py`
- **Failure Point**: When pytest tried to import the app modules
- **Test Command**: `pytest` in GitHub Actions CI/CD pipeline
- **Result**: 0 tests run, immediate import error

## Root Cause Analysis

The issue was **NOT** caused by the F2 frontend changes. It was a **pre-existing bug** in the main branch that affected test initialization.

### The Import Order Problem

In `backend/tests/conftest.py`, the code structure was:

```python
import os
import pytest
from fastapi.testclient import TestClient
# ... other imports

from app.main import app  # ❌ This import happens FIRST
from app.db import Base, get_db
from app.models import User, Image, DoctorProfile

# Environment variables set AFTER imports
os.environ.setdefault("DATABASE_URL", "sqlite:///./test.db")  # ❌ TOO LATE!
os.environ.setdefault("GOOGLE_API_KEY", "test-api-key")
```

### Why This Failed

1. When `from app.main import app` executes, Python loads the entire app module
2. app.main → app.routes.auth → app.db → app.config
3. In `app/db.py` line 6: `engine = create_engine(DATABASE_URL)`
4. In `app/config.py`: `DATABASE_URL = os.getenv("DATABASE_URL")` returns `None`
5. SQLAlchemy fails: "Expected string or URL object, got None"

**The environment variables were set AFTER the modules were already loaded and tried to use them.**

## Solution

### Fix #1: Reorder Imports in conftest.py

Move environment variable setup **BEFORE** any app imports:

```python
import os
import pytest

# Set environment variables FIRST
os.environ.setdefault("DATABASE_URL", "sqlite:///./test.db")
os.environ.setdefault("GOOGLE_API_KEY", "test-api-key")

# Now import app modules (they will see the env vars)
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.db import Base, get_db
from app.models import User, Image, DoctorProfile
```

**Changed File**: `backend/tests/conftest.py`
- Lines 1-20: Moved environment setup before imports
- Added explanatory comment about import order requirement

### Fix #2: Add Missing Dependency

The `google-generativeai` package requires `cffi` but it wasn't explicitly in requirements.txt:

```
cffi==2.0.0
```

**Changed File**: `backend/requirements.txt`
- Added line 7: `cffi==2.0.0`

## Results

After applying both fixes:

✅ **All 114 backend tests passing**
✅ **97% code coverage**
✅ **10.44s test execution time**
✅ **GitHub Actions CI/CD passing**
✅ **PR #21 ready to merge**

### Test Summary
```
============================= test session starts ==============================
collected 114 items

tests/test_ai_services.py::TestAIService PASSED
tests/test_analysis_routes.py::TestAnalysisRoutes PASSED
tests/test_auth.py::TestPasswordHelpers PASSED
tests/test_auth.py::TestSignup PASSED
tests/test_auth.py::TestLogin PASSED
... (106 more tests)

======================= 114 passed, 3 warnings in 10.44s =======================
```

## Key Learnings

1. **Import order matters**: When modules execute code at import time (like `engine = create_engine()`), dependencies must be set up first

2. **Test environment setup must come first**: Always configure environment variables before importing application modules in test files

3. **Module-level code execution**: Python executes module-level code (outside functions) immediately when the module is imported

4. **Implicit dependencies**: Some packages like `google-generativeai` have dependencies (cffi) that may not be automatically installed

## Prevention

To prevent similar issues in the future:

1. Always set up test environment variables at the TOP of conftest.py
2. Use explicit dependencies in requirements.txt (don't rely on transitive dependencies)
3. Run tests locally before pushing to catch import-order issues early
4. Consider using dependency injection for database connections instead of module-level initialization

## Related Files

- `backend/tests/conftest.py` - Test configuration (fixed)
- `backend/requirements.txt` - Python dependencies (fixed)
- `backend/app/db.py` - Database setup (unchanged, but affected by the bug)
- `backend/app/config.py` - Configuration loading (unchanged)

## Commit Details

**Fix Commit**: `4874ea0` / `aca8362` (merged)
**Commit Message**: "fix: resolve backend test failures by reordering conftest imports"
**Branch**: `feat/frontend-auth-context`
**PR**: #21

---

**Date**: December 3, 2025
**Fixed By**: Claude Code (AI Assistant)
**Verified By**: JawadAlSahab11
