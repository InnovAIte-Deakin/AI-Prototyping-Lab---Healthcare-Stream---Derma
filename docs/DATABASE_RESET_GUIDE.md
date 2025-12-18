# Database Reset Guide (Fixing Authentication)

## 🚨 The Issue
If you find that **old login credentials no longer work** after switching to the latest branch, it is because we have upgraded our authentication security.

*   **Old System:** Passwords were plain text or simple hashes.
*   **New System:** Passwords use **Bcrypt**, a strong cryptographic hash.

Old user data in the database is incompatible with the new system, causing login failures.

## 🛠️ The Fix
You must wipe the old database volume and let the system re-create users with the correct encryption.

### 1. Stop the Backend
In your terminal where the backend is running, press `Ctrl+C` to stop the server.

### 2. Reset Docker
Navigate to the `backend/` folder and run the following commands:

```bash
# 1. Destroy containers and DELETE the data volume (-v)
docker-compose down -v

# 2. Start a fresh, empty database connection
docker-compose up -d
```

### 3. Re-Create Schema & Seed Users
Now that the database is empty, run the setup scripts to rebuild it:

```bash
# 1. Create Tables
alembic upgrade head

# 2. Populate Test Doctors (Alice, Bob, etc.)
python -m app.seed_doctors
# (Windows: venv\Scripts\python -m app.seed_doctors)
```

### 4. Restart Server
```bash
python -m uvicorn app.main:app --reload
# (Windows: venv\Scripts\python -m uvicorn app.main:app --reload)
```

## ✅ Credentials
Once reset, the default test accounts will be valid again:
*   **Username:** `alice@derma.com`
*   **Password:** `password123`
