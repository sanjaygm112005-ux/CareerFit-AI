from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .routers import auth, resume, job, chat, test, interview, github, linkedin, premium, career, ml, admin, eligibility

app = FastAPI(title="AI Resume Analyzer", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(resume.router, prefix="/api/resume", tags=["resume"])
app.include_router(job.router, prefix="/api/job", tags=["job"])
app.include_router(chat.router, prefix="/api/chat", tags=["chat"])
app.include_router(test.router, prefix="/api/test", tags=["test"])
app.include_router(interview.router, prefix="/api/interview", tags=["interview"])
app.include_router(linkedin.router, prefix="/api/linkedin", tags=["LinkedIn"])
app.include_router(github.router, prefix="/api/github", tags=["GitHub"])
app.include_router(premium.router, prefix="/api/premium", tags=["Premium"])
app.include_router(career.router, prefix="/api/career", tags=["Career"])
app.include_router(ml.router, prefix="/api/ml", tags=["ML"])
app.include_router(admin.router, prefix="/api/admin", tags=["Admin"])
app.include_router(eligibility.router, prefix="/api/eligibility", tags=["Eligibility"])


@app.get("/")
async def root():
    return {"message": "CareerFit AI Backend API is running", "status": "ok", "health": "/api/health"}


@app.get("/api/health")
async def health():
    return {"status": "ok", "version": "1.0.0"}

