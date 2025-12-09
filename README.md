# DERMA (DermaAI)

### AI-Powered Dermatologist Assistant

**Deakin University Capstone Project**

**⚠️ MEDICAL DISCLAIMER** > This application is a Proof of Concept (POC) designed for educational and informational purposes only. It uses Artificial Intelligence to provide preliminary analysis of skin conditions. **It is NOT a diagnostic tool.** Users must always consult a qualified medical professional for diagnosis and treatment.

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
- **[TASKS.md](TASKS.md):** Active Task Checklist.

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

## 🚀 Getting Started

### Prerequisites

- Node.js & npm
- Python 3.10+
- Docker Desktop (for the Database)

### 1\. Clone the Repository
```bash
git clone https://github.com/InnovAIte-Deakin/AI-Prototyping-Lab---Healthcare-Stream---Derma.git 
cd AI-Prototyping-Lab---Healthcare-Stream---Derma 
```

### 2\. Backend Setup

The backend handles the API, Database, and AI logic.

```bash
# Navigate to backend  
cd backend  

# Create a virtual environment  
python -m venv venv  

# Activate venv  
# Windows:  
venv\\Scripts\\activate  
# Mac/Linux:  
source venv/bin/activate  

# Install dependencies  
pip install -r requirements.txt  

# Create .env file  
# (Copy the content below into a new file named .env inside /backend)  
DATABASE_URL=postgresql://dermaai:dermaai@localhost:5432/dermaai  
GOOGLE_API_KEY=your_api_key_here  

# Start the Database (Docker)  
docker-compose up -d  

# Run Migrations  
alembic upgrade head 

# Seed the Database (Create dummy doctors)  
python -m app.seed_doctors  

# Run the Server  
uvicorn app.main:app --reload  
```

_The Backend will be running at <http://localhost:8000>_

### 3\. Frontend Setup

The frontend handles the UI for Patients and Doctors.

```bash
# Open a new terminal and navigate to frontend  
cd frontend  

# Install dependencies  
npm install  

# Run the development server  
npm run dev  
```

_The Frontend will be running at <http://localhost:5173>_

## 🤝 Development Workflow (Strict)

We follow a strict **"One Task = One Branch"** policy to avoid conflicts.

### The Cycle

- **Pull Latest Main:** Always start fresh.  
    git checkout main  
    git pull origin main  

- **Create Task Branch:** Name it clearly.  
    git checkout -b feat/task-name-here  
    \# Example: git checkout -b feat/patient-upload  

- **Code (The Codex Routine):**
  - Use the **Master Prompts** provided in the project documentation.
  - Feed prompts into ChatGPT/Codex to generate code.
  - Paste code into VS Code.
- **Commit & Push:**  
    git add .  
    git commit -m "feat: implemented patient upload logic"  
    git push origin feat/patient-upload  

- **Pull Request (PR):**
  - Go to GitHub.
  - Open a Pull Request from feat/your-branch to main.
  - Wait for approval/merge.

## 📂 Project Structure

skin-scope/  
├── backend/ # FastAPI Application  
│ ├── app/  
│ │ ├── routes/ # API Endpoints (auth, images, doctors)  
│ │ ├── services/ # AI Integration Logic  
│ │ ├── models.py # Database Schemas  
│ │ └── main.py # App Entry Point  
│ ├── alembic/ # DB Migrations  
│ └── media/ # Local storage for uploaded images  
├── frontend/ # React Application  
│ ├── src/  
│ │ ├── components/ # Reusable UI (Layout, Disclaimer)  
│ │ ├── pages/ # Full Views (Dashboard, Login)  
│ │ └── context/ # Auth State Management  
│ └── tailwind.config.js  
└── README.md  

## 📅 Roadmap & Status

- [x] **B1:** Backend Skeleton
# DERMA (DermaAI)

### AI-Powered Dermatologist Assistant

**Deakin University Capstone Project**

**⚠️ MEDICAL DISCLAIMER** > This application is a Proof of Concept (POC) designed for educational and informational purposes only. It uses Artificial Intelligence to provide preliminary analysis of skin conditions. **It is NOT a diagnostic tool.** Users must always consult a qualified medical professional for diagnosis and treatment.

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
- **[TASKS.md](TASKS.md):** Active Task Checklist.

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

## 🚀 Getting Started

### Prerequisites

- Node.js & npm
- Python 3.10+
- Docker Desktop (for the Database)

### 1\. Clone the Repository
```bash
git clone https://github.com/InnovAIte-Deakin/AI-Prototyping-Lab---Healthcare-Stream---Derma.git 
cd AI-Prototyping-Lab---Healthcare-Stream---Derma 
```

### 2\. Backend Setup

The backend handles the API, Database, and AI logic.

```bash
# Navigate to backend  
cd backend  

# Create a virtual environment  
python -m venv venv  

# Activate venv  
# Windows:  
venv\\Scripts\\activate  
# Mac/Linux:  
source venv/bin/activate  

# Install dependencies  
pip install -r requirements.txt  

# Create .env file  
# (Copy the content below into a new file named .env inside /backend)  
DATABASE_URL=postgresql://dermaai:dermaai@localhost:5432/dermaai  
GOOGLE_API_KEY=your_api_key_here  

# Start the Database (Docker)  
docker-compose up -d  

# Run Migrations  
alembic upgrade head 

# Seed the Database (Create dummy doctors)  
python -m app.seed_doctors  

# Run the Server  
uvicorn app.main:app --reload  
```

_The Backend will be running at <http://localhost:8000>_

### 3\. Frontend Setup

The frontend handles the UI for Patients and Doctors.

```bash
# Open a new terminal and navigate to frontend  
cd frontend  

# Install dependencies  
npm install  

# Run the development server  
npm run dev  
```

_The Frontend will be running at <http://localhost:5173>_

## 🤝 Development Workflow (Strict)

We follow a strict **"One Task = One Branch"** policy to avoid conflicts.

### The Cycle

- **Pull Latest Main:** Always start fresh.  
    git checkout main  
    git pull origin main  

- **Create Task Branch:** Name it clearly.  
    git checkout -b feat/task-name-here  
    \# Example: git checkout -b feat/patient-upload  

- **Code (The Codex Routine):**
  - Use the **Master Prompts** provided in the project documentation.
  - Feed prompts into ChatGPT/Codex to generate code.
  - Paste code into VS Code.
- **Commit & Push:**  
    git add .  
    git commit -m "feat: implemented patient upload logic"  
    git push origin feat/patient-upload  

- **Pull Request (PR):**
  - Go to GitHub.
  - Open a Pull Request from feat/your-branch to main.
  - Wait for approval/merge.

## 📂 Project Structure

skin-scope/  
├── backend/ # FastAPI Application  
│ ├── app/  
│ │ ├── routes/ # API Endpoints (auth, images, doctors)  
│ │ ├── services/ # AI Integration Logic  
│ │ ├── models.py # Database Schemas  
│ │ └── main.py # App Entry Point  
│ ├── alembic/ # DB Migrations  
│ └── media/ # Local storage for uploaded images  
├── frontend/ # React Application  
│ ├── src/  
│ │ ├── components/ # Reusable UI (Layout, Disclaimer)  
│ │ ├── pages/ # Full Views (Dashboard, Login)  
│ │ └── context/ # Auth State Management  
│ └── tailwind.config.js  
└── README.md  

## 📅 Roadmap & Status
    git add .  
    git commit -m "feat: implemented patient upload logic"  
    git push origin feat/patient-upload  

- **Pull Request (PR):**
  - Go to GitHub.
  - Open a Pull Request from feat/your-branch to main.
  - Wait for approval/merge.

## 📂 Project Structure

skin-scope/  
├── backend/ # FastAPI Application  
│ ├── app/  
│ │ ├── routes/ # API Endpoints (auth, images, doctors)  
│ │ ├── services/ # AI Integration Logic  
│ │ ├── models.py # Database Schemas  
│ │ └── main.py # App Entry Point  
│ ├── alembic/ # DB Migrations  
│ └── media/ # Local storage for uploaded images  
├── frontend/ # React Application  
│ ├── src/  
│ │ ├── components/ # Reusable UI (Layout, Disclaimer)  
│ │ ├── pages/ # Full Views (Dashboard, Login)  
│ │ └── context/ # Auth State Management  
│ └── tailwind.config.js  
└── README.md  

## 📅 Roadmap & Status

- [x] **B1:** Backend Skeleton
# DERMA (DermaAI)

### AI-Powered Dermatologist Assistant

**Deakin University Capstone Project**

**⚠️ MEDICAL DISCLAIMER** > This application is a Proof of Concept (POC) designed for educational and informational purposes only. It uses Artificial Intelligence to provide preliminary analysis of skin conditions. **It is NOT a diagnostic tool.** Users must always consult a qualified medical professional for diagnosis and treatment.

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
- **[TASKS.md](TASKS.md):** Active Task Checklist.

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

## 🚀 Getting Started

### Prerequisites

- Node.js & npm
- Python 3.10+
- Docker Desktop (for the Database)

### 1\. Clone the Repository
```bash
git clone https://github.com/InnovAIte-Deakin/AI-Prototyping-Lab---Healthcare-Stream---Derma.git 
cd AI-Prototyping-Lab---Healthcare-Stream---Derma 
```

### 2\. Backend Setup

The backend handles the API, Database, and AI logic.

```bash
# Navigate to backend  
cd backend  

# Create a virtual environment  
python -m venv venv  

# Activate venv  
# Windows:  
venv\\Scripts\\activate  
# Mac/Linux:  
source venv/bin/activate  

# Install dependencies  
pip install -r requirements.txt  

# Create .env file  
# (Copy the content below into a new file named .env inside /backend)  
DATABASE_URL=postgresql://dermaai:dermaai@localhost:5432/dermaai  
GOOGLE_API_KEY=your_api_key_here  

# Start the Database (Docker)  
docker-compose up -d  

# Run Migrations  
alembic upgrade head 

# Seed the Database (Create dummy doctors)  
python -m app.seed_doctors  

# Run the Server  
uvicorn app.main:app --reload  
```

_The Backend will be running at <http://localhost:8000>_

### 3\. Frontend Setup

The frontend handles the UI for Patients and Doctors.

```bash
# Open a new terminal and navigate to frontend  
cd frontend  

# Install dependencies  
npm install  

# Run the development server  
npm run dev  
```

_The Frontend will be running at <http://localhost:5173>_

## 🤝 Development Workflow (Strict)

We follow a strict **"One Task = One Branch"** policy to avoid conflicts.

### The Cycle

- **Pull Latest Main:** Always start fresh.  
    git checkout main  
    git pull origin main  

- **Create Task Branch:** Name it clearly.  
    git checkout -b feat/task-name-here  
    \# Example: git checkout -b feat/patient-upload  

- **Code (The Codex Routine):**
  - Use the **Master Prompts** provided in the project documentation.
  - Feed prompts into ChatGPT/Codex to generate code.
  - Paste code into VS Code.
- **Commit & Push:**  
    git add .  
    git commit -m "feat: implemented patient upload logic"  
    git push origin feat/patient-upload  

- **Pull Request (PR):**
  - Go to GitHub.
  - Open a Pull Request from feat/your-branch to main.
  - Wait for approval/merge.

## 📂 Project Structure

skin-scope/  
├── backend/ # FastAPI Application  
│ ├── app/  
│ │ ├── routes/ # API Endpoints (auth, images, doctors)  
│ │ ├── services/ # AI Integration Logic  
│ │ ├── models.py # Database Schemas  
│ │ └── main.py # App Entry Point  
│ ├── alembic/ # DB Migrations  
│ └── media/ # Local storage for uploaded images  
├── frontend/ # React Application  
│ ├── src/  
│ │ ├── components/ # Reusable UI (Layout, Disclaimer)  
│ │ ├── pages/ # Full Views (Dashboard, Login)  
│ │ └── context/ # Auth State Management  
│ └── tailwind.config.js  
└── README.md  

## 📅 Roadmap & Status
    git add .  
    git commit -m "feat: implemented patient upload logic"  
    git push origin feat/patient-upload  

- **Pull Request (PR):**
  - Go to GitHub.
  - Open a Pull Request from feat/your-branch to main.
  - Wait for approval/merge.

## 📂 Project Structure

skin-scope/  
├── backend/ # FastAPI Application  
│ ├── app/  
│ │ ├── routes/ # API Endpoints (auth, images, doctors)  
│ │ ├── services/ # AI Integration Logic  
│ │ ├── models.py # Database Schemas  
│ │ └── main.py # App Entry Point  
│ ├── alembic/ # DB Migrations  
│ └── media/ # Local storage for uploaded images  
├── frontend/ # React Application  
│ ├── src/  
│ │ ├── components/ # Reusable UI (Layout, Disclaimer)  
│ │ ├── pages/ # Full Views (Dashboard, Login)  
│ │ └── context/ # Auth State Management  
│ └── tailwind.config.js  
└── README.md  

## 📅 Roadmap & Status

- [x] **B1:** Backend Skeleton
# DERMA (DermaAI)

### AI-Powered Dermatologist Assistant

**Deakin University Capstone Project**

**⚠️ MEDICAL DISCLAIMER** > This application is a Proof of Concept (POC) designed for educational and informational purposes only. It uses Artificial Intelligence to provide preliminary analysis of skin conditions. **It is NOT a diagnostic tool.** Users must always consult a qualified medical professional for diagnosis and treatment.

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
- **[TASKS.md](TASKS.md):** Active Task Checklist.

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

## 🚀 Getting Started

### Prerequisites

- Node.js & npm
- Python 3.10+
- Docker Desktop (for the Database)

### 1\. Clone the Repository
```bash
git clone https://github.com/InnovAIte-Deakin/AI-Prototyping-Lab---Healthcare-Stream---Derma.git 
cd AI-Prototyping-Lab---Healthcare-Stream---Derma 
```

### 2\. Backend Setup

The backend handles the API, Database, and AI logic.

```bash
# Navigate to backend  
cd backend  

# Create a virtual environment  
python -m venv venv  

# Activate venv  
# Windows:  
venv\\Scripts\\activate  
# Mac/Linux:  
source venv/bin/activate  

# Install dependencies  
pip install -r requirements.txt  

# Create .env file  
# (Copy the content below into a new file named .env inside /backend)  
DATABASE_URL=postgresql://dermaai:dermaai@localhost:5432/dermaai  
GOOGLE_API_KEY=your_api_key_here  

# Start the Database (Docker)  
docker-compose up -d  

# Run Migrations  
alembic upgrade head 

# Seed the Database (Create dummy doctors)  
python -m app.seed_doctors  

# Run the Server  
uvicorn app.main:app --reload  
```

_The Backend will be running at <http://localhost:8000>_

### 3\. Frontend Setup

The frontend handles the UI for Patients and Doctors.

```bash
# Open a new terminal and navigate to frontend  
cd frontend  

# Install dependencies  
npm install  

# Run the development server  
npm run dev  
```

_The Frontend will be running at <http://localhost:5173>_

## 🤝 Development Workflow (Strict)

We follow a strict **"One Task = One Branch"** policy to avoid conflicts.

### The Cycle

- **Pull Latest Main:** Always start fresh.  
    git checkout main  
    git pull origin main  

- **Create Task Branch:** Name it clearly.  
    git checkout -b feat/task-name-here  
    \# Example: git checkout -b feat/patient-upload  

- **Code (The Codex Routine):**
  - Use the **Master Prompts** provided in the project documentation.
  - Feed prompts into ChatGPT/Codex to generate code.
  - Paste code into VS Code.
- **Commit & Push:**  
    git add .  
    git commit -m "feat: implemented patient upload logic"  
    git push origin feat/patient-upload  

- **Pull Request (PR):**
  - Go to GitHub.
  - Open a Pull Request from feat/your-branch to main.
  - Wait for approval/merge.

## 📂 Project Structure

skin-scope/  
├── backend/ # FastAPI Application  
│ ├── app/  
│ │ ├── routes/ # API Endpoints (auth, images, doctors)  
│ │ ├── services/ # AI Integration Logic  
│ │ ├── models.py # Database Schemas  
│ │ └── main.py # App Entry Point  
│ ├── alembic/ # DB Migrations  
│ └── media/ # Local storage for uploaded images  
├── frontend/ # React Application  
│ ├── src/  
│ │ ├── components/ # Reusable UI (Layout, Disclaimer)  
│ │ ├── pages/ # Full Views (Dashboard, Login)  
│ │ └── context/ # Auth State Management  
│ └── tailwind.config.js  
└── README.md  

## 📅 Roadmap & Status

- [x] **B1:** Backend Skeleton
- [x] **B2:** Database Setup
- [x] **B3:** Authentication System
- [x] **B4:** Doctor Logic & Seeding
- [x] **B5:** Image Uploads Pipeline
- [x] **B6:** AI Analysis Integration
- [x] **F1:** Frontend Setup
- [x] **F2:** Auth Logic
- [x] **F3:** Patient Workflows
- [x] **F4:** Doctor Workflows
- [x] **F5:** UI Polish & Styling