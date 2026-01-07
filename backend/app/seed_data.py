"""
Unified seeding script for development.
Seeds Doctors only - patients can be created manually or via E2E fixtures.
"""
import sys
import os

# Ensure app module can be found
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db import engine
from app.seed_doctors import seed_doctors as seed_doctors_logic

def seed_data():
    print("--- Starting Unified Seeding ---")
    
    # Seed Doctors (using existing logic)
    print("Seeding Doctors...")
    seed_doctors_logic(bind_engine=engine)
        
    print("--- Seeding Complete ---")

if __name__ == "__main__":
    seed_data()
