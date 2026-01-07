"""
E2E Test Fixtures - Creates predictable test data for isolated E2E tests.
Run with: python -m app.seed_e2e_fixtures
"""
import sys
import os

# Ensure app module can be found
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db import SessionLocal
from app.models import User, Image, AnalysisReport, PatientDoctorLink, DoctorProfile
from app.services.auth import get_password_hash

E2E_PASSWORD = "password123"

# Test fixtures with cases in specific states for isolated E2E tests
FIXTURES = [
    {"patient_email": "e2e_patient_aichat@test.com", "case_state": "none"},      # AI chat test (not escalated)
    {"patient_email": "e2e_patient_pending@test.com", "case_state": "pending"},  # Doctor-review test
    {"patient_email": "e2e_patient_accepted@test.com", "case_state": "accepted"}, # Patient-doctor chat test
]

def seed_e2e_fixtures():
    """Seed test accounts and cases for E2E tests."""
    print("--- Seeding E2E Fixtures ---")
    db = SessionLocal()
    try:
        # Get first seeded doctor (alice@derma.com from seed_doctors)
        doctor_profile = db.query(DoctorProfile).first()
        if not doctor_profile:
            print("ERROR: No doctors found. Run 'python -m app.seed_data' first.")
            return
        doctor_id = doctor_profile.user_id

        for fixture in FIXTURES:
            email = fixture["patient_email"]
            
            # CLEANUP: Delete existing user and their data to ensure fresh state
            existing_user = db.query(User).filter(User.email == email).first()
            if existing_user:
                print(f"  - Cleaning up old data for {email}...")
                # Cascade delete should handle related records if configured, 
                # but we'll manually be safe or rely on the ORM if configured well.
                # For safety/simplicity in this script, we just delete the user 
                # and let the DB constraints/ORM handle cascade or we re-create.
                # Actually, deleting the user IS the best way if generic cascade works. 
                # If not, we might error. Let's try deleting the User.
                db.delete(existing_user)
                db.flush() # Enforce deletion
            
            # Create fresh patient
            patient = User(
                email=email,
                password=get_password_hash(E2E_PASSWORD),
                role="patient"
            )
            db.add(patient)
            db.flush() # Get ID
            
            _create_case_in_state(db, patient.id, doctor_id, fixture["case_state"])
            _link_patient_to_doctor(db, patient.id, doctor_id)
            print(f"  ✓ {fixture['patient_email']} → case state: '{fixture['case_state']}'")
        
        db.commit()
        print("--- E2E Fixtures Complete ---")
    except Exception as e:
        print(f"ERROR seeding fixtures: {e}")
        db.rollback()
    finally:
        db.close()

def _create_case_in_state(db, patient_id, doctor_id, state):
    """Create a case (image + report) in the specified review_status."""
    # (No longer need to check for existing since we deleted the user)
    
    # Create placeholder image
    image = Image(
        patient_id=patient_id,
        doctor_id=doctor_id,
        image_url="e2e_fixture_placeholder.png"
    )
    db.add(image)
    db.flush()
    
    # Create analysis report in target state
    report = AnalysisReport(
        image_id=image.id,
        patient_id=patient_id,
        doctor_id=doctor_id,
        review_status=state,
        condition="E2E Test Condition",
        confidence=85.0,
        recommendation="Monitor for changes (E2E fixture)",
        report_json={
            "status": "success",
            "condition": "E2E Test Condition",
            "confidence": 85.0,
            "severity": "Low",
            "characteristics": ["symmetric", "uniform color"],
            "recommendation": "Monitor for changes",
            "disclaimer": "This is a test fixture."
        }
    )
    db.add(report)

def _link_patient_to_doctor(db, patient_id, doctor_id):
    """Link patient to doctor."""
    db.add(PatientDoctorLink(patient_id=patient_id, doctor_id=doctor_id))

if __name__ == "__main__":
    seed_e2e_fixtures()
