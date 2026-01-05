from app.db import Base, engine
from app.seed_doctors import seed_doctors

if __name__ == "__main__":
    print("WARNING: This will wipe the database.")
    print("Dropping all tables...")
    Base.metadata.drop_all(bind=engine)
    print("Creating all tables...")
    Base.metadata.create_all(bind=engine)
    print("Seeding doctors...")
    seed_doctors()
    print("Database reset complete.")
