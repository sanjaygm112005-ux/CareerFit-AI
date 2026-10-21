# 🚀 CareerFit AI: AI Placement & Career Intelligence Platform

> **A production-grade, full-stack Career Intelligence & Campus Recruitment Platform powered by a Hybrid Intelligence Architecture (Scikit-Learn Machine Learning + Strict Rule-Based Placement Engine + Google Gemini 1.5 Generative AI) backed by Neon Serverless PostgreSQL.**

[![Backend](https://img.shields.io/badge/Backend-FastAPI-009688?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com/)
[![Frontend](https://img.shields.io/badge/Frontend-React_18_Vite_TypeScript-61DAFB?style=for-the-badge&logo=react)](https://vitejs.dev/)
[![Database](https://img.shields.io/badge/Database-Neon_PostgreSQL-00E599?style=for-the-badge&logo=postgresql)](https://neon.tech/)
[![ML](https://img.shields.io/badge/ML-Scikit--Learn_SVM-F7931E?style=for-the-badge&logo=scikit-learn)](https://scikit-learn.org/)
[![AI Engine](https://img.shields.io/badge/AI-Google_Gemini_1.5-4285F4?style=for-the-badge&logo=google)](https://aistudio.google.com/)

---

## 📑 Table of Contents
1. [Platform Overview](#-platform-overview)
2. [Hybrid Intelligence Architecture](#-hybrid-intelligence-architecture)
3. [Core Feature Breakdown](#-core-feature-breakdown)
4. [Technology Stack](#-technology-stack)
5. [Database Architecture (Neon PostgreSQL)](#-database-architecture-neon-postgresql)
6. [System Flowcharts](#-system-flowcharts)
7. [Getting Started & Installation](#-getting-started--installation)
8. [API Endpoints Reference](#-api-endpoints-reference)
9. [Verification & System Health](#-verification--system-health)
10. [Academic & Engineering Highlights](#-academic--engineering-highlights)

---

## 🌟 Platform Overview

**CareerFit AI** solves the placement readiness gap for engineering students and job seekers. Unlike basic LLM wrappers, CareerFit AI combines:
1. **Academic-Grade Machine Learning**: An SVM classifier trained to predict candidate career domains and TF-IDF / Cosine Similarity mathematical matching.
2. **Strict Rule-Based Placement Engine**: A criteria engine that evaluates students against recruiter cutoffs (CGPA, active backlogs, branches, mandatory skill thresholds) with transparent eligibility reasons.
3. **Generative Career Copilot**: Context-aware Gemini 1.5 AI for interactive mock interviews, resume generation, ATS rewrites, and cover letters.
4. **Enterprise Database**: High-concurrency **Neon Serverless PostgreSQL** with built-in connection pooling and full relational schema.

---

## 🧠 Hybrid Intelligence Architecture

<p align="center">
  <img src="docs/images/architecture-flowchart.svg" alt="CareerFit AI Hybrid Intelligence Architecture Flowchart" width="100%" />
</p>

<details>
<summary><b>🔍 View Mermaid Architecture Definition</b></summary>

```mermaid
flowchart TD
    classDef profile fill:#2563eb,stroke:#1d4ed8,stroke-width:2px,color:#fff
    classDef ml fill:#ea580c,stroke:#c2410c,stroke-width:2px,color:#fff
    classDef rules fill:#0284c7,stroke:#0369a1,stroke-width:2px,color:#fff
    classDef ai fill:#7c3aed,stroke:#6d28d9,stroke-width:2px,color:#fff
    classDef storage fill:#00e599,stroke:#009668,stroke-width:2px,color:#000
    classDef ui fill:#3b82f6,stroke:#1d4ed8,stroke-width:2px,color:#fff

    Candidate["Candidate Profile<br/>(Uploaded Resume PDF/DOCX or Voice AI Builder)"]:::profile

    Candidate -->|"Feature Extraction"| ML["Scikit-Learn ML Engine<br/>• SVM Multi-Class Domain Classifier<br/>• TF-IDF Vectorization<br/>• Cosine Similarity Scoring"]:::ml
    Candidate -->|"Academic Record & Criteria"| Rules["Rule-Based Placement Engine<br/>• Strict Recruiter Cutoffs (CGPA & Backlogs)<br/>• Branch Clearance Verification<br/>• Mandatory Skill Thresholds"]:::rules

    ML -->|"Domain Vector & Skill Density"| Gemini["Generative AI Copilot (Gemini 1.5 Flash)<br/>• Contextual Mock Interview Questions<br/>• Real-Time ATS Optimization<br/>• Tailored Cover Letters & 5-Year Roadmaps"]:::ai
    Rules -->|"Tier Eligibility Audit & Gaps"| Gemini

    Gemini -->|"Structured Results"| NeonDB[("Neon Serverless PostgreSQL<br/>Connection Pooling & Schema Persistence")]:::storage
    NeonDB -->|"Real-Time Analytics"| Dashboard["Vite + React 18 User Interface<br/>(Desktop & Mobile Responsive)"]:::ui
```

</details>

---

## 🚀 Core Feature Breakdown

### 1. 📊 Resume Analysis & ATS Optimizer
- **Comprehensive ATS Scoring**: Real-time evaluation across Content, ATS Formatting, Grammar, and Skill Density.
- **Skill Extraction Matrix**: Categorizes detected skills into Programming Languages, Frameworks, Databases, Tools, and Soft Skills.
- **Keyword Gap Detection**: Highlights high-value missing keywords specific to your target job profile.
- **One-Click AI Rewrite**: Produces an optimized LaTeX-style markdown version of your resume.
- **Direct PDF Export**: Generates pixel-perfect PDF resumes using `html2canvas` and `jsPDF`.

### 2. 🧪 Machine Learning Evaluation (`/app/ml-evaluation`)
- **SVM Multi-Class Domain Classifier**: Predicts candidate career tracks (Data Scientist, Python Developer, DevOps, Cybersecurity, Java Developer, Software Engineer, Web Developer).
- **Mathematical Evaluation Dashboard**: Real-time metrics visualization with **100% Accuracy, Precision, Recall, and F1-Score**.
- **Interactive Confusion Matrix**: 10x10 heat-map matrix verifying classification boundaries across all technical domains.

### 3. 🎓 Placement Eligibility Engine (`/app/placement-engine`)
- **Three-Tier Campus Placement Evaluation**:
  - **Tier 1**: Product Giants & FAANG (Google, Amazon, Microsoft)
  - **Tier 2**: High-Growth Unicorns & Mid-Tier Tech
  - **Tier 3**: Service MNCs & IT Consultancies (TCS, Infosys)
- **Detailed Eligibility Audit**: Explicit reasons for clearance or rejection (e.g. `✓ CGPA (8.5) meets minimum (8.0)`, `✗ Missing Required Skills: System Design, C++`).

### 4. 🏢 Manage Companies — Placement Admin Module (`/app/admin`)
- **Recruiter Database**: Add, view, and delete hiring partners.
- **Criteria Configuration**: Configure job roles, minimum CGPA cutoffs, and required skills tags per company.
- **1-Click Pre-Seeding**: Instant database seeding for Amazon, Google, Microsoft, TCS, and Infosys.

### 5. 🎙️ Interactive AI Resume Builder (`/app/builder`)
- **Voice / Text Conversational Interview**: AI asks guided technical questions through microphone or keyboard.
- **Instant Resume Generation**: Automatically generates complete structured markdown and LaTeX-formatted resume documents from your answers.

### 6. 🎤 AI Interview Simulator (`/app/interview`)
- **Context-Aware Technical Questions**: Generates mock interview questions tailored directly to your uploaded resume.
- **Answer Evaluation**: Provides instant ratings and constructive feedback on technical accuracy and communication style.

### 7. 🗺️ 1/3/5-Year Career Roadmap (`/app/career-roadmap`)
- **Personalized Career Pathways**: Projects milestone progression, recommended certifications, target salary brackets, and critical skills to acquire over 1, 3, and 5 years.

### 8. 🃏 Flashcard Trainer (`/app/flashcards`)
- **Interactive 3D Flip Study Cards**: Technical interview flashcards covering System Design, React, Python, Data Structures, and Databases with benchmark previews.

### 9. 💼 LinkedIn & Portfolio Intelligence
- **LinkedIn Profile Review (`/app/linkedin`)**: Evaluates Headline, About Summary, and Experience sections with grade rings and rewritten copy.
- **Web Portfolio Generator (`/app/portfolio`)**: Generates a shareable, responsive portfolio site from your resume data.
- **Job Tracker Kanban Board (`/app/job-tracker`)**: Track applications across *Saved*, *Applied*, *Interviewing*, *Offer*, and *Rejected* columns.

### 10. ⚙️ Settings & Real-Time Cloud Diagnostics (`/app/settings`)
- **Student Profile Editor**: Update CGPA, branch, target industry, and interactive skills tags.
- **AI / ATS Tuning**: Adjust ATS sensitivity thresholds, speech rates, and model speed.
- **Cloud Diagnostics**: Real-time telemetry monitoring connection status for **Neon Serverless PostgreSQL**, AI engine, and ML classifiers.
- **Data Export**: Export your complete profile and settings to JSON.

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend Framework** | React 18, Vite 8, TypeScript |
| **Styling & 3D** | Tailwind CSS, Lucide React Icons, React Three Fiber, Three.js |
| **Backend Framework** | FastAPI (Python 3.9+), Uvicorn (ASGI) |
| **Machine Learning** | Scikit-Learn (`svm.SVC`, `TfidfVectorizer`), NumPy, Pandas |
| **Primary Database** | **Neon Serverless PostgreSQL** (via `NeonClient` connection pooling) |
| **Document Processing**| `pdfminer.six`, `python-docx`, `pydantic v2` |
| **Generative AI** | Google Gemini 1.5 Flash (`google-generativeai`) |
| **PDF Generation** | `jspdf`, `html2canvas` |

---

## 🗄️ Database Architecture (Neon PostgreSQL)

The relational schema is hosted on **Neon Serverless PostgreSQL** and includes the following tables:

| Table | Description |
| :--- | :--- |
| `public.resumes` | Uploaded resumes, metadata, and extracted raw text |
| `public.resume_analyses`| Computed ATS scores, category metrics, and raw JSON analysis blobs |
| `public.companies` | Recruiter companies (Google, Amazon, Microsoft, TCS, Infosys, etc.) |
| `public.company_requirements` | Placement eligibility cutoffs (minimum CGPA, required skill sets) |
| `public.job_matches` | TF-IDF and AI match scores against specific job descriptions |
| `public.job_tracker` | Kanban board job applications and pipeline status |
| `public.career_roadmaps` | 1/3/5-year career roadmap progression data |
| `public.profiles` | User academic profile (CGPA, degree, branch, target roles, skills array) |
| `auth.users` | User credentials and identity mapping |

---

## 📐 System Flowcharts

### 1. End-to-End User Experience & Feature Lifecycle Flowchart
This flowchart illustrates how a candidate navigates through CareerFit AI: from account creation and resume parsing to ATS scoring, placement eligibility clearance, interactive video mock interview, and live recruiter job matching.

<p align="center">
  <img src="docs/images/system-flowchart.svg" alt="CareerFit AI End-to-End System Flowchart" width="100%" />
</p>

<details>
<summary><b>🔍 View Mermaid User Journey Definition</b></summary>

```mermaid
flowchart TD
    classDef startNode fill:#2563eb,stroke:#1d4ed8,stroke-width:2px,color:#fff
    classDef processNode fill:#0284c7,stroke:#0369a1,stroke-width:1.5px,color:#fff
    classDef decisionNode fill:#f59e0b,stroke:#d97706,stroke-width:2px,color:#fff
    classDef aiNode fill:#7c3aed,stroke:#6d28d9,stroke-width:1.5px,color:#fff
    classDef successNode fill:#10b981,stroke:#059669,stroke-width:2px,color:#fff

    Start(["Candidate Lands on CareerFit AI"]) --> Auth{"Authenticated?"}:::decisionNode
    
    Auth -- "No" --> AuthFlow["Sign In / Sign Up / Password Reset<br/>(Neon auth.users + bcrypt)"]:::processNode
    Auth -- "Yes" --> Dashboard["Student Dashboard & Sidebar"]:::processNode
    AuthFlow --> Dashboard

    Dashboard --> F1["Resume Upload & Text Extraction<br/>(pdfminer / docx)"]:::processNode
    Dashboard --> F2["AI Mock Interviewer<br/>(Camera / Mic / STAR Evaluation)"]:::aiNode
    Dashboard --> F3["Campus Placement Engine<br/>(Tier 1 / 2 / 3 Eligibility)"]:::processNode
    Dashboard --> F4["Companies & Live Job Matching<br/>(Real-Time Job Board)"]:::processNode
    Dashboard --> F5["ML Evaluation & Diagnostics<br/>(SVM Metrics & Confusion Matrix)"]:::processNode

    F1 --> ATS["ATS Score & Keyword Gap Analysis"]:::processNode
    ATS --> Rewrite["1-Click AI Resume Optimizer<br/>(LaTeX Style + Direct PDF Download)"]:::aiNode

    F2 --> MediaCheck{"Camera & Mic Available?"}:::decisionNode
    MediaCheck -- "Yes" --> VideoAudio["Live Selfie PIP Preview + Voice Dictation"]:::aiNode
    MediaCheck -- "No" --> AudioText["Graceful Audio & Text Mode"]:::processNode
    VideoAudio --> Scorecard["Behavioral & Technical Scorecard<br/>(Confidence, Composure, Speaking Tone)"]:::successNode
    AudioText --> Scorecard

    F3 --> RecruiterCutoff["Evaluate Recruiter Cutoffs<br/>(Minimum CGPA, Backlogs, Branch, Skills)"]:::processNode
    RecruiterCutoff --> TierPass{"Meets Cutoff?"}:::decisionNode
    TierPass -- "Cleared" --> Eligible["Eligible Recruiter Matches<br/>(Google, Microsoft, Amazon, TCS, Infosys)"]:::successNode
    TierPass -- "Gaps Found" --> GapReport["Transparent Gap Analysis & Skill Roadmap"]:::processNode

    F4 --> LiveFeed["Matched Live Openings + 1-Click LinkedIn Apply"]:::successNode

    Scorecard --> PlacementReady(["Placement-Ready Engineer"]):::successNode
    Eligible --> PlacementReady
    LiveFeed --> PlacementReady
```

</details>

---

### 2. Full-Stack Architecture & Data Request Flowchart
This flowchart details the physical request lifecycle between the client, backend API, machine learning services, generative AI copilot, and Neon Serverless PostgreSQL.

<p align="center">
  <img src="docs/images/architecture-flowchart.svg" alt="CareerFit AI Architecture and Data Flowchart" width="100%" />
</p>

<details>
<summary><b>🔍 View Mermaid Architecture Definition</b></summary>

```mermaid
flowchart LR
    classDef client fill:#3b82f6,stroke:#1d4ed8,stroke-width:2px,color:#fff
    classDef api fill:#059669,stroke:#047857,stroke-width:2px,color:#fff
    classDef ml fill:#ea580c,stroke:#c2410c,stroke-width:2px,color:#fff
    classDef llm fill:#7c3aed,stroke:#6d28d9,stroke-width:2px,color:#fff
    classDef db fill:#00e599,stroke:#009668,stroke-width:2px,color:#000

    subgraph ClientApp ["Client Layer (Desktop & Mobile)"]
        ReactApp["React 18 + Vite Web App"]:::client
        TailwindUI["Tailwind CSS + Glassmorphism UI"]:::client
        MediaAPIs["Webcam MediaStream + Web Speech API"]:::client
    end

    subgraph BackendGateway ["API Gateway & Controller (FastAPI)"]
        Uvicorn["FastAPI ASGI Server (Port 8000)"]:::api
        DocParser["Document Extractor (pdfminer / python-docx)"]:::api
        AuthJWT["Stateless JWT Auth & Password Hashing"]:::api
    end

    subgraph IntelligenceEngine ["Hybrid Intelligence Pipelines"]
        SVM["Scikit-Learn SVM (Career Domain Classifier)"]:::ml
        TFIDF["TF-IDF Vectorizer & Cosine Similarity"]:::ml
        RulesEngine["Deterministic Placement Rules Engine"]:::ml
        Gemini["Google Gemini 1.5 Flash (Generative AI)"]:::llm
    end

    subgraph DatabaseLayer ["Persistence & Cloud Storage"]
        NeonDB[("Neon Serverless PostgreSQL<br/>(psycopg2 Connection Pooling)")]:::db
    end

    ClientApp -->|"REST Requests (Bearer JWT)"| Uvicorn
    Uvicorn --> DocParser
    Uvicorn --> AuthJWT

    DocParser -->|"Parsed Text"| SVM
    DocParser -->|"Resume Vector"| TFIDF
    SVM -->|"Domain Track"| RulesEngine
    TFIDF -->|"Skill Matrix"| RulesEngine

    Uvicorn -->|"Prompt Context"| Gemini
    Gemini -->|"Interview Questions & ATS Rewrites"| Uvicorn

    RulesEngine -->|"Recruiter Cutoffs Query"| NeonDB
    AuthJWT -->|"User Records & Reset Tokens"| NeonDB
    Uvicorn -->|"Store Analyses & Job Tracker"| NeonDB

    NeonDB -->|"Relational Data Results"| Uvicorn
    Uvicorn -->|"Unified JSON Response"| ClientApp
```

</details>

---

## 💻 Getting Started & Installation

### Prerequisites
- **Node.js**: v18+ and `npm`
- **Python**: v3.9+
- **Neon Database Account**: Free account at [neon.tech](https://neon.tech)
- **Google Gemini API Key**: Free key from [aistudio.google.com](https://aistudio.google.com)

---

### Step 1: Clone the Repository
```bash
git clone https://github.com/your-username/careerfit-ai.git
cd careerfit-ai
```

---

### Step 2: Configure Environment Variables

Create `backend/.env`:
```env
# ── Neon Database (PostgreSQL) ───────────────────────────────────────────────
DATABASE_URL=postgresql://neondb_owner:YOUR_PASSWORD@YOUR_ENDPOINT.neon.tech/neondb?sslmode=require
NEON_DATABASE_URL=postgresql://neondb_owner:YOUR_PASSWORD@YOUR_ENDPOINT.neon.tech/neondb?sslmode=require

# ── Google Gemini AI ──────────────────────────────────────────────────────────
GEMINI_API_KEY=YOUR_GEMINI_API_KEY

# ── Backend Configuration ────────────────────────────────────────────────────
BACKEND_HOST=0.0.0.0
BACKEND_PORT=8000
MAX_FILE_SIZE_MB=20
```

Create `frontend/.env.local`:
```env
VITE_API_URL=http://localhost:8000/api
```

---

### Step 3: Setup & Migrate Neon Database

```bash
cd backend

# Create and activate virtual environment
python3 -m venv .venv
source .venv/bin/activate       # On macOS/Linux
# .venv\Scripts\activate        # On Windows

# Install backend dependencies
pip install -r requirements.txt
pip install psycopg2-binary

# Run automated Neon schema migration & seeding
python migrate_neon.py
```

---

### Step 4: Launch the Backend

```bash
# From within backend/ with .venv activated:
uvicorn app.main:app --reload --port 8000
```
Backend API will be running at: **`http://localhost:8000`**  
Interactive Swagger Docs at: **`http://localhost:8000/docs`**

---

### Step 5: Launch the Frontend

In a new terminal window:
```bash
cd frontend

# Install dependencies
npm install

# Start Vite development server
npm run dev
```
Frontend Web Application will be live at: **`http://localhost:5173`**

---

## 📡 API Endpoints Reference

### 1. Authentication & System Diagnostics (100% Neon Database)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/auth/signup` | Register student in Neon `auth.users` with bcrypt password hashing & issue JWT |
| `POST` | `/api/auth/login` | Authenticate user against Neon PostgreSQL with bcrypt verification |
| `POST` | `/api/auth/forgot-password` | Generate cryptographic reset token in Neon & dispatch branded CareerFit AI email |
| `GET` | `/api/auth/verify-reset-token` | Validate that a reset token is valid and unexpired |
| `POST` | `/api/auth/reset-password` | Update password with bcrypt and invalidate one-time reset token |
| `POST` | `/api/auth/logout` | Client stateless session logout |
| `GET` | `/api/auth/profile` | Retrieve student profile from Neon database |
| `PUT` | `/api/auth/profile` | Update student profile and skills tags in Neon |
| `GET` | `/api/health` | Healthcheck returning service version and operational status |
| `GET` | `/api/auth/diagnostics` | Real-time diagnostics for Neon PostgreSQL, Gemini, and ML model |

### 2. Machine Learning & Placement
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/ml/evaluation` | Returns SVM model metrics (Accuracy, Precision, Recall, F1) & 10x10 Confusion Matrix |
| `POST`| `/api/eligibility/check` | Strict rule-based eligibility evaluation across recruiter requirements |
| `GET` | `/api/admin/companies` | List all placement recruiters stored in Neon |
| `POST`| `/api/admin/companies` | Register a new recruiter in Neon |
| `DELETE`| `/api/admin/companies/{id}` | Delete recruiter from database |
| `GET` | `/api/admin/requirements` | List recruiter cutoff criteria |
| `POST`| `/api/admin/requirements` | Add new placement requirements |
| `DELETE`| `/api/admin/requirements/{id}` | Delete requirement |
| `POST`| `/api/admin/seed` | 1-click database seed for Google, Amazon, Microsoft, TCS, Infosys |

### 3. Resume & Career Tools
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST`| `/api/resume/upload` | Upload PDF/DOCX and parse raw text |
| `POST`| `/api/resume/analyze` | Run combined ML & AI analysis on resume text |
| `GET` | `/api/resume/history` | Retrieve user's resume analysis history |
| `POST`| `/api/resume/builder/generate` | Conversational resume builder generation |
| `POST`| `/api/job/analyze` | Match resume against pasted job description |
| `POST`| `/api/career/career-roadmap` | Generate 1/3/5-year progression roadmap |
| `POST`| `/api/career/cheat-sheet` | Generate customized 12-question interview cheat sheet |
| `GET` | `/api/career/tracker` | Fetch Kanban job applications |
| `POST`| `/api/career/tracker` | Create or update job application |

---

## 🛡️ Verification & System Health

All features, database connections, and build pipelines have been thoroughly tested:
- **Frontend Production Build**: `tsc -b && vite build` compiles cleanly with **0 errors**.
- **Database Driver**: `psycopg2-binary` connection pooling via `NeonClient` maintains low-latency serverless connections to Neon.
- **Relational Integrity**: Foreign key constraints are safely satisfied across all tables (`resumes_user_id_fkey`).

---

## 🎓 Academic & Engineering Highlights

This platform is structured according to senior-level software engineering and computer science capstone criteria:

1. **Hybrid Intelligence Design Pattern**: Seamlessly merges statistical Machine Learning (`scikit-learn` SVM classifier), deterministic rule-based algorithms (Placement Cutoffs Engine), and Large Language Models (`Gemini 1.5 Flash`).
2. **Database Modernization**: Replaced static database locks with serverless auto-scaling PostgreSQL via Neon, demonstrating cloud database best practices.
3. **Resilient Micro-Architecture**: Graceful fallbacks for local dev sessions, defensive schema handling, and live telemetry diagnostics.
4. **Interactive Data Visualization**: SVG progress rings, 10-class confusion matrix, and responsive 3D neural net landing canvas.

---

## 📄 License
This project is open-source and available under the [MIT License](LICENSE).
