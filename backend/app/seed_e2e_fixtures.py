"""
E2E Test Fixtures - Creates predictable test data for isolated E2E tests.
Run with: python -m app.seed_e2e_fixtures
"""
import sys
import os

# Ensure app module can be found
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db import SessionLocal, engine
from app.models import User, Image, AnalysisReport, PatientDoctorLink, DoctorProfile
from app.services.auth import get_password_hash

print("SEED FIXTURES ENGINE:", engine.url)

E2E_PASSWORD = "password123"

# Test fixtures with cases in specific states for isolated E2E tests
FIXTURES = [
    {"patient_email": "e2e_patient_aichat@test.com", "case_state": "none"},      # AI chat test (not escalated)
    {"patient_email": "e2e_patient_pending@test.com", "case_state": "pending"},  # Doctor-review test
    {"patient_email": "e2e_patient_accepted@test.com", "case_state": "accepted"}, # Patient-doctor chat test
    {"patient_email": "e2e_patient_reviewed@test.com", "case_state": "reviewed"}, # Patient rating test
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
            sys.exit(1)
        doctor_id = doctor_profile.user_id

        for fixture in FIXTURES:
            email = fixture["patient_email"]
            
            # CLEANUP: Delete existing user and their data to ensure fresh state
            existing_user = db.query(User).filter(User.email == email).first()
            if existing_user:
                print(f"  - Cleaning up old data for {email}...")
                
                # Manual cleanup of dependencies to avoid FK errors (sqlite/postgres differences)
                # 1. Links
                db.query(PatientDoctorLink).filter(PatientDoctorLink.patient_id == existing_user.id).delete()
                
                # 2. Chat messages (linked to reports) - need to find reports first
                # This is getting complex to do via pure SQL if we don't assume cascade.
                # Let's iterate.
                reports = db.query(AnalysisReport).filter(AnalysisReport.patient_id == existing_user.id).all()
                for r in reports:
                    from app.models import ChatMessage # delayed import to prompt checking
                    db.query(ChatMessage).filter(ChatMessage.report_id == r.id).delete()
                    db.delete(r)
                
                # 3. Images
                db.query(Image).filter(Image.patient_id == existing_user.id).delete()
                
                # 4. The user
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
            print(f"  - {fixture['patient_email']} case state: '{fixture['case_state']}'")
        
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
        patient_rating=None, # Explicitly ensure no rating
        patient_feedback=None,
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
