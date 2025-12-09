# How to Launch DermaAI on Your Local Machine

This guide will walk you through setting up and running the DermaAI application on your computer. Follow each step carefully, and you'll have the app running in no time!

## 📋 Table of Contents
- [Prerequisites](#prerequisites)
- [Step 1: Clone the Project](#step-1-clone-the-project)
- [Step 2: Get Your Gemini API Key](#step-2-get-your-gemini-api-key)
- [Step 3: Set Up the Backend](#step-3-set-up-the-backend)
- [Step 4: Set Up the Frontend](#step-4-set-up-the-frontend)
- [Step 5: Access the Application](#step-5-access-the-application)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before you start, you need to install these programs on your computer:

### 1. **Python** (Version 3.10 or higher)
- **What it is**: A programming language needed to run the backend server
- **Download from**: https://www.python.org/downloads/
- **Installation tip**: When installing on Windows, **check the box that says "Add Python to PATH"**
- **Verify installation**: Open PowerShell/Terminal and type:
  ```bash
  python --version
  ```
  You should see something like `Python 3.11.x`

### 2. **Node.js** (Version 16 or higher)
- **What it is**: A JavaScript runtime needed to run the frontend
- **Download from**: https://nodejs.org/ (choose the LTS version)
- **Verify installation**: Open PowerShell/Terminal and type:
  ```bash
  node --version
  npm --version
  ```
  You should see version numbers for both

### 3. **Docker Desktop**
- **What it is**: Software that runs the PostgreSQL database in a container
- **Download from**: https://www.docker.com/products/docker-desktop/
- **Installation tip**: After installing, **open Docker Desktop and let it start completely** before proceeding
- **Verify installation**: Open PowerShell/Terminal and type:
  ```bash
  docker --version
  ```
  You should see the Docker version

### 4. **Git**
- **What it is**: Version control system to download the project code
- **Download from**: https://git-scm.com/downloads
- **Verify installation**: Open PowerShell/Terminal and type:
  ```bash
  git --version
  ```
  You should see the Git version

---

## Step 1: Clone the Project

### For Windows (PowerShell):
```powershell
# Navigate to your Desktop (or wherever you want to store the project)
cd ~\Desktop

# Download the project from GitHub
git clone https://github.com/InnovAIte-Deakin/AI-Prototyping-Lab---Healthcare-Stream---Derma.git

# Enter the project folder
cd AI-Prototyping-Lab---Healthcare-Stream---Derma
```

### For Mac/Linux (Terminal):
```bash
# Navigate to your Desktop (or wherever you want to store the project)
cd ~/Desktop

# Download the project from GitHub
git clone https://github.com/InnovAIte-Deakin/AI-Prototyping-Lab---Healthcare-Stream---Derma.git

# Enter the project folder
cd AI-Prototyping-Lab---Healthcare-Stream---Derma
```

---

## Step 2: Get Your Gemini API Key

The app uses Google's Gemini AI to analyze skin lesions. You need a free API key:

1. **Go to**: https://makersuite.google.com/app/apikey
2. **Sign in** with your Google account
3. **Click "Create API Key"**
4. **Copy the key** - you'll need it in the next step

**Important**: Keep this key secret! Don't share it publicly.

---

## Step 3: Set Up the Backend

The backend is the server that handles the database, API, and AI logic.

### 3.1: Navigate to the Backend Folder

**Windows:**
```powershell
cd backend
```

**Mac/Linux:**
```bash
cd backend
```

### 3.2: Create a Virtual Environment

**What this does**: Creates an isolated space for Python packages so they don't conflict with other projects.

**Windows:**
```powershell
python -m venv venv
```

**Mac/Linux:**
```bash
python3 -m venv venv
```

### 3.3: Activate the Virtual Environment

**Windows:**
```powershell
.\venv\Scripts\Activate
```

**Mac/Linux:**
```bash
source venv/bin/activate
```

**You'll know it worked when you see `(venv)` at the beginning of your command line.**

### 3.4: Install Python Dependencies

**What this does**: Installs all the Python packages the backend needs.

```bash
pip install -r requirements.txt
```

**This may take a few minutes.** You'll see lots of packages being downloaded and installed.

### 3.5: Create the Environment File

**What this does**: Creates a configuration file with your database and API settings.

**Windows:**
```powershell
notepad .env
```

**Mac/Linux:**
```bash
nano .env
```

**Paste this into the file** (replace `your_actual_gemini_api_key_here` with the API key you got in Step 2):

```
# Database Configuration
DATABASE_URL=postgresql://dermaai:dermaai@localhost:5434/dermaai

# Google Gemini API Configuration
GOOGLE_API_KEY=your_actual_gemini_api_key_here

# Media Files Configuration (optional)
# MEDIA_ROOT=/path/to/media/files
```

**Save and close the file:**
- **Windows (Notepad)**: Press Ctrl+S, then close
- **Mac/Linux (nano)**: Press Ctrl+X, then Y, then Enter

### 3.6: Start the Database

**What this does**: Starts a PostgreSQL database in a Docker container.

**Make sure Docker Desktop is running first!**

```bash
docker-compose up -d
```

**What you should see**:
```
✔ Container dermaai_db  Started
```

**If you see an error about port already in use**, see the [Troubleshooting](#troubleshooting) section.

### 3.7: Set Up the Database Tables

**What this does**: Creates all the necessary tables in the database.

```bash
alembic upgrade head
```

**What you should see**:
```
INFO  [alembic.runtime.migration] Running upgrade  -> 47033da4ebc7
```

### 3.8: Add Sample Doctor Accounts

**What this does**: Creates 4 dummy doctor accounts you can use to test the app.

```bash
python -m app.seed_doctors
```

**What you should see**:
```
Created doctor user: alice@derma.com
Created doctor user: bob@derma.com
Created doctor user: carol@derma.com
Created doctor user: dan@derma.com
```

### 3.9: Start the Backend Server

```bash
uvicorn app.main:app --reload
```

**What you should see**:
```
INFO:     Uvicorn running on http://127.0.0.1:8000 (Press CTRL+C to quit)
INFO:     Application startup complete.
```

**✅ Your backend is now running!** Keep this terminal window open.

---

## Step 4: Set Up the Frontend

The frontend is the user interface that patients and doctors interact with.

### 4.1: Open a NEW Terminal/PowerShell Window

**Important**: Don't close the backend terminal! Open a new one.

### 4.2: Navigate to the Frontend Folder

**Windows:**
```powershell
cd ~\Desktop\AI-Prototyping-Lab---Healthcare-Stream---Derma\frontend
```

**Mac/Linux:**
```bash
cd ~/Desktop/AI-Prototyping-Lab---Healthcare-Stream---Derma/frontend
```

### 4.3: Install Frontend Dependencies

**What this does**: Installs all the JavaScript packages the frontend needs.

```bash
npm install
```

**This may take several minutes.** You'll see a progress bar and lots of packages being installed.

### 4.4: Start the Frontend Server

```bash
npm run dev
```

**What you should see**:
```
  VITE v... ready in ... ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

**✅ Your frontend is now running!** Keep this terminal window open too.

---

## Step 5: Access the Application

You now have two servers running:

### Backend API
- **URL**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs (interactive API testing)

### Frontend UI
- **URL**: http://localhost:5173
- **This is where you'll interact with the app**

### Test the Application

1. **Open your web browser**
2. **Go to**: http://localhost:5173
3. **You should see the DermaAI home page!**

### Login Credentials

**Patient Account**: Register a new account through the UI

**Doctor Accounts** (created by the seed script):
- Email: `alice@derma.com` / Password: `dermapassword123`
- Email: `bob@derma.com` / Password: `dermapassword123`
- Email: `carol@derma.com` / Password: `dermapassword123`
- Email: `dan@derma.com` / Password: `dermapassword123`

---

## Troubleshooting

### Problem: "Port 5434 is already in use"

**Solution**: Another program is using that port. Try these steps:

1. **Check what's using the port:**

   **Windows:**
   ```powershell
   netstat -ano | findstr :5434
   ```

   **Mac/Linux:**
   ```bash
   lsof -i :5434
   ```

2. **Option A**: Stop the program using that port

3. **Option B**: Change the port in `backend/docker-compose.yml`:
   ```yaml
   ports:
     - "5435:5432"  # Change 5434 to any free port like 5435
   ```
   Then update `backend/.env`:
   ```
   DATABASE_URL=postgresql://dermaai:dermaai@localhost:5435/dermaai
   ```

---

### Problem: "Docker is not running" or "Cannot connect to Docker daemon"

**Solution**:
1. Open Docker Desktop
2. Wait for it to fully start (the whale icon should be steady, not animated)
3. Try the `docker-compose up -d` command again

---

### Problem: "python: command not found" (Mac/Linux)

**Solution**: Use `python3` instead of `python`:
```bash
python3 -m venv venv
python3 -m app.seed_doctors
```

---

### Problem: "npm: command not found"

**Solution**:
1. Node.js is not installed or not in your PATH
2. Download and install Node.js from https://nodejs.org/
3. Restart your terminal
4. Try `npm --version` again

---

### Problem: Frontend shows "Network Error" or "Cannot connect to backend"

**Solution**:
1. Make sure the backend is running (check the terminal, you should see "Uvicorn running")
2. The backend should be at http://localhost:8000
3. Check that port 8000 is not blocked by a firewall

---

### Problem: "GOOGLE_API_KEY not found" error

**Solution**:
1. Make sure you created the `.env` file in the `backend` folder
2. Check that you added your actual Gemini API key (not the placeholder text)
3. Make sure there are no extra spaces before or after the key
4. Restart the backend server (Ctrl+C in the backend terminal, then run `uvicorn app.main:app --reload` again)

---

### Problem: Database connection errors

**Solution**:
1. Make sure Docker is running
2. Check if the database container is running:
   ```bash
   docker ps
   ```
   You should see `dermaai_db` in the list
3. If not, start it:
   ```bash
   docker-compose up -d
   ```

---

## Stopping the Application

When you're done using the app:

1. **Stop the Frontend**: In the frontend terminal, press `Ctrl+C`
2. **Stop the Backend**: In the backend terminal, press `Ctrl+C`
3. **Stop the Database** (optional):
   ```bash
   cd backend
   docker-compose down
   ```

---

## Restarting the Application Later

When you want to use the app again:

### Terminal 1 (Backend):
```bash
cd ~/Desktop/AI-Prototyping-Lab---Healthcare-Stream---Derma/backend

# Windows: .\venv\Scripts\Activate
# Mac/Linux: source venv/bin/activate

docker-compose up -d
uvicorn app.main:app --reload
```

### Terminal 2 (Frontend):
```bash
cd ~/Desktop/AI-Prototyping-Lab---Healthcare-Stream---Derma/frontend
npm run dev
```

---

## Need Help?

If you encounter issues not covered here:

1. Check the error message carefully - it often tells you what's wrong
2. Make sure all prerequisites are installed correctly
3. Ensure Docker Desktop is running
4. Verify your `.env` file has the correct Gemini API key
5. Try restarting your terminal and trying again

---

## Summary Checklist

Before running the app, make sure:

- [ ] Python 3.10+ is installed
- [ ] Node.js is installed
- [ ] Docker Desktop is installed and running
- [ ] Git is installed
- [ ] You have a Gemini API key
- [ ] You've cloned the repository
- [ ] You've created the `.env` file with your API key
- [ ] Database is running (`docker ps` shows `dermaai_db`)
- [ ] Backend server is running (http://localhost:8000)
- [ ] Frontend server is running (http://localhost:5173)

**Happy testing!** 🎉
