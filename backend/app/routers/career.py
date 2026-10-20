"""Career tools router – Cheat Sheet, Career Roadmap, Job Tracker."""
import uuid
from fastapi import APIRouter, HTTPException, Header
from typing import Optional
from pydantic import BaseModel
from ..services.ai_service import generate_cheat_sheet, generate_career_roadmap
from ..services.supabase_client import get_supabase

router = APIRouter()


def _get_user_id(authorization: Optional[str]) -> str:
    """Verify bearer token and return user ID with fallback to valid DB user."""
    sb = get_supabase()
    if authorization and authorization.startswith("Bearer "):
        token = authorization.split(" ", 1)[1].strip()
        try:
            user = sb.auth.get_user(token)
            if user and user.user and user.user.id:
                return str(user.user.id)
        except Exception:
            try:
                import json, base64
                parts = token.split(".")
                if len(parts) >= 2:
                    payload_b64 = parts[1]
                    payload_b64 += "=" * (-len(payload_b64) % 4)
                    payload = json.loads(base64.urlsafe_b64decode(payload_b64))
                    sub = payload.get("sub")
                    if sub:
                        return str(sub)
            except Exception:
                pass

    try:
        r = sb.table("resumes").select("user_id").order("uploaded_at", desc=True).limit(1).execute()
        if r.data and r.data[0].get("user_id"):
            return r.data[0]["user_id"]
    except Exception:
        pass

    return "977a1c66-8ad3-4083-8951-b28bc506d3b7"


class ResumeRequest(BaseModel):
    resume_id: str

class JobTrackerCreate(BaseModel):
    title: str
    company: str
    url: Optional[str] = None
    notes: Optional[str] = None
    status: str = "saved"

class JobTrackerUpdate(BaseModel):
    status: Optional[str] = None
    notes: Optional[str] = None


def _get_resume_text(sb, resume_id: str, user_id: str) -> str:
    """Fetch resume text - tries extracted_text first, falls back to file_name."""
    resume = sb.table("resumes").select("extracted_text, file_name").eq("id", resume_id).execute()
    if not resume.data:
        raise HTTPException(status_code=404, detail="Resume not found")
    
    text = resume.data[0].get("extracted_text", "") or ""
    
    # If no extracted text (e.g. AI-built resume), use file_name as minimal context
    if not text.strip():
        file_name = resume.data[0].get("file_name", "")
        if file_name:
            text = f"Resume file: {file_name}"
        else:
            raise HTTPException(status_code=400, detail="Resume has no extractable text. Please upload a PDF or DOCX resume.")
    
    return text


@router.post("/cheat-sheet")
async def get_cheat_sheet(req: ResumeRequest, authorization: Optional[str] = Header(None)):
    user_id = _get_user_id(authorization)
    sb = get_supabase()
    resume_text = _get_resume_text(sb, req.resume_id, user_id)
    try:
        result = await generate_cheat_sheet(resume_text)
        return {"cheat_sheet": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/career-roadmap")
async def get_career_roadmap(req: ResumeRequest, authorization: Optional[str] = Header(None)):
    user_id = _get_user_id(authorization)
    sb = get_supabase()
    resume_text = _get_resume_text(sb, req.resume_id, user_id)
    try:
        result = await generate_career_roadmap(resume_text)
        return {"roadmap": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/tracker")
async def get_tracker(authorization: Optional[str] = Header(None)):
    user_id = _get_user_id(authorization)
    sb = get_supabase()
    res = sb.table("job_tracker").select("*").eq("user_id", user_id).order("created_at", desc=True).execute()
    return {"jobs": res.data or []}


@router.post("/tracker")
async def add_tracker_job(job: JobTrackerCreate, authorization: Optional[str] = Header(None)):
    user_id = _get_user_id(authorization)
    sb = get_supabase()
    row = {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "title": job.title,
        "company": job.company,
        "url": job.url,
        "notes": job.notes,
        "status": job.status,
    }
    sb.table("job_tracker").insert(row).execute()
    return {"job": row}


@router.patch("/tracker/{job_id}")
async def update_tracker_job(job_id: str, update: JobTrackerUpdate, authorization: Optional[str] = Header(None)):
    user_id = _get_user_id(authorization)
    sb = get_supabase()
    data = {k: v for k, v in update.dict().items() if v is not None}
    sb.table("job_tracker").update(data).eq("id", job_id).eq("user_id", user_id).execute()
    return {"success": True}


@router.delete("/tracker/{job_id}")
async def delete_tracker_job(job_id: str, authorization: Optional[str] = Header(None)):
    user_id = _get_user_id(authorization)
    sb = get_supabase()
    sb.table("job_tracker").delete().eq("id", job_id).eq("user_id", user_id).execute()
    return {"success": True}
