# Security & Data Retention Policy

> DermaAI Security Documentation

---

## Overview

This document describes data handling, retention policies, and deletion procedures for the DermaAI platform.

> [!IMPORTANT]
> DermaAI handles sensitive medical data. All data operations must comply with applicable privacy regulations.

---

## Patient Data Rights

### Account Deletion

Patients can permanently delete their account via the API:

```http
DELETE /patients/me
Authorization: Bearer <patient_token>
```

**This action is IRREVERSIBLE.** Upon deletion:

| Data Type | Action |
|-----------|--------|
| User account | **Deleted** |
| Uploaded images | **Files deleted** from server |
| Analysis reports | **Anonymized** (stats preserved, patient_id removed) |
| Chat messages | **Anonymized** (patient messages replaced with "[deleted]") |
| Doctor links | **Marked inactive** |

### What is Preserved

For aggregate analytics and doctor audit trails:
- Condition detected (e.g., "Eczema")
- Confidence score
- Recommendation text
- Doctor/AI messages in chat

### What is Removed

All Personally Identifiable Information (PII):
- Email address
- User record
- Patient message content
- Patient ID references

---

## Data Retention Periods

The platform enforces automatic cleanup of **orphaned/anonymized** data after configurable retention periods.

| Data Type | Default Retention | Environment Variable |
|-----------|-------------------|---------------------|
| Media files | 365 days | `MEDIA_RETENTION_DAYS` |
| Chat messages | 365 days | `CHAT_RETENTION_DAYS` |
| Analysis reports | 730 days (2 years) | `ANALYSIS_RETENTION_DAYS` |

### Configuration

Set these in your `.env` file:

```env
# Data Retention (days, 0 = no auto-cleanup)
MEDIA_RETENTION_DAYS=365
CHAT_RETENTION_DAYS=365
ANALYSIS_RETENTION_DAYS=730
```

### Active vs Orphaned Data

- **Active data** (with valid patient_id): Only deleted via `DELETE /patients/me`
- **Orphaned data** (patient_id = NULL): Subject to automatic retention cleanup

---

## Security Measures

### Path Traversal Protection

All file operations validate paths to prevent directory escape attacks:

```python
# Safe path validation before any file operation
if not _is_safe_path(MEDIA_ROOT, target_path):
    # Block the operation
    raise SecurityError("Invalid path")
```

### Authentication

- JWT-based authentication with configurable expiry
- Role-based access control (patient vs doctor)
- Tokens naturally expire after `ACCESS_TOKEN_EXPIRE_MINUTES` (default: 30 min)

### Post-Deletion Token Handling

After account deletion:
1. User record is removed from database
2. Any subsequent API call with the old token fails (user not found)
3. No explicit token blacklist required

---

## Implementation Details

### Files Involved

| File | Purpose |
|------|---------|
| `app/config.py` | Retention environment variables |
| `app/services/data_lifecycle_service.py` | Core deletion/anonymization logic |
| `app/routes/patients.py` | DELETE /patients/me endpoint |
| `tests/test_data_lifecycle.py` | Security and functionality tests |

### Key Functions

```python
# Full account deletion
delete_patient_account(db, patient_id) -> Dict

# Individual anonymization
anonymize_patient_reports(db, patient_id) -> int
anonymize_patient_chat_messages(db, patient_id) -> int

# Safe file operations
safe_delete_file(relative_path) -> bool

# Scheduled cleanup
cleanup_expired_data(db) -> Dict
```

---

## Running the Cleanup Job

The `cleanup_expired_data()` function is callable for scheduled execution:

```python
from app.services.data_lifecycle_service import cleanup_expired_data
from app.db import SessionLocal

db = SessionLocal()
try:
    result = cleanup_expired_data(db)
    print(f"Cleanup complete: {result}")
finally:
    db.close()
```

For production, integrate with your scheduler (cron, Celery, etc.).

---

## Testing

Run security tests:

```bash
cd backend
python -m pytest tests/test_data_lifecycle.py -v
```

Test coverage includes:
- Patient deletion permissions
- Doctor access denied
- Unauthenticated access denied
- Path traversal blocking
- Anonymization data integrity
- Retention window enforcement
