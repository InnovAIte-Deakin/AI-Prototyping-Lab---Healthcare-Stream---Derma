# DERMA (DermaAI)

### AI-Powered Dermatologist Assistant

**Deakin University Capstone Project**

> **⚠️ MEDICAL DISCLAIMER**
> This application is a Proof of Concept (POC) designed for educational and informational purposes only. It uses Artificial Intelligence to provide preliminary analysis of skin conditions. **It is NOT a diagnostic tool.** Users must always consult a qualified medical professional for diagnosis and treatment.

## 📖 Overview

DERMA (internally referred to as **DermaAI**) is a containerized web application designed to bridge the gap between patients and dermatologists. It allows users to upload images of skin lesions for instant, AI-driven preliminary analysis and facilitates connection with doctors for professional review.

### Key Features

- **Patient Portal:** Image upload, AI analysis (Google AI Studio/Gemini), chat interface, and "Find a Doctor" locator.
- **Doctor Portal:** Secure dashboard for triage, reviewing high-res patient images, and managing appointment requests.
- **AI Engine:** Modular AI architecture (currently wrapping Google AI Studio/Gemini) with future-proofing for custom fine-tuned models.

## 📚 Documentation

- **[AGENTS.md](AGENTS.md):** Master context for AI Agents (Mission, Rules, Tech Stack).
- **[docs/SRS.md](docs/SRS.md):** Software Requirements Specification.
- **[docs/TESTING.md](docs/TESTING.md):** Testing Strategy and Commands.
- **[docs/OPERATIONS.md](docs/OPERATIONS.md):** Operations runbook (health checks, logs, migrations).
- **[docs/WEEK_6_STATUS_REPORT.md](docs/WEEK_6_STATUS_REPORT.md):** Week 6 Project Status Report.
- **[TASKS.md](TASKS.md):** Active Task Checklist.
- **[docs/USER_GUIDE.md](docs/USER_GUIDE.md):** Detailed Patient & Doctor usage guide.

## 🛠 Tech Stack

### Frontend
- **Framework:** React (Vite)
- **Styling:** Tailwind CSS
- **Routing:** React Router DOM

### Backend
- **Framework:** FastAPI (Python 3.10+)
- **Database:** PostgreSQL (via Docker)
- **ORM:** SQLAlchemy + Alembic (Migrations)
- **Auth:** RBAC (Patient vs. Doctor) via LocalStorage & Custom Headers (POC Level)

### Infrastructure
- **Containerization:** Docker & Docker Compose
- **Version Control:** GitHub

---

## 🚀 Getting Started (Local Launch)

Follow these steps to set up and run the DermaAI application locally.

### Prerequisites
- **Python** (3.10+)
- **Node.js** (v16+)
- **Docker Desktop** (Running)
- **Google Gemini API Key** (Get one [here](https://makersuite.google.com/app/apikey))

### 1. Clone the Repository
```bash
git clone https://github.com/InnovAIte-Deakin/AI-Prototyping-Lab---Healthcare-Stream---Derma.git 
cd AI-Prototyping-Lab---Healthcare-Stream---Derma 
```

### 2. Backend Setup
The backend handles the API, Database, and AI logic.

```bash
# 1. Navigate to backend
cd backend

# 2. Create and Activate Virtual Environment
# Windows:
python -m venv venv
.\venv\Scripts\Activate
# Mac/Linux:
python3 -m venv venv
source venv/bin/activate

# 3. Install Dependencies
pip install -r requirements.txt

# 4. Configure Environment
# Create a .env file in the /backend folder with the following:
# DATABASE_URL=postgresql://dermaai:dermaai@localhost:5432/dermaai
# GOOGLE_API_KEY=your_actual_api_key_here

# 5. Start Database (Docker)
docker-compose up -d

# 6. Setup Database
alembic upgrade head
python -m app.seed_doctors

# 7. Run Server
uvicorn app.main:app --reload
```
_Backend running at: http://localhost:8000_
_Health check: http://localhost:8000/health_

### 3. Frontend Setup
Open a **new terminal** (keep backend running).

```bash
# 1. Navigate to frontend
cd frontend

# 2. Install Dependencies
npm install

# 3. Run Development Server
npm run dev
```
_Frontend running at: http://localhost:5173_

### 4. Access the App
Open your browser to **http://localhost:5173**.

**Test Credentials:**
- **Patient:** Register a new account.
- **Doctors:** `alice@derma.com` / `password123` (See `seed_doctors.py` for more).

---

## 🤝 Development Workflow

We follow a strict **"One Task = One Branch"** policy.

1.  **Pull Latest Main:** `git checkout main && git pull origin main`
2.  **Create Task Branch:** `git checkout -b feat/task-name`
3.  **Code & Commit:** `git add . && git commit -m "feat: description"`
4.  **Push:** `git push origin feat/task-name`
5.  **Pull Request:** Open PR on GitHub.

## 📂 Project Structure

```
skin-scope/  
├── backend/            # FastAPI Application  
│   ├── app/            # Source Code
│   │   ├── routes/     # API Endpoints
│   │   ├── services/   # Business Logic
│   │   └── models.py   # DB Models
│   └── media/          # Uploaded Images
├── frontend/           # React Application  
│   ├── src/            # Source Code
│   │   ├── pages/      # Views
│   │   └── components/ # UI Components
└── docs/               # Documentation
```
