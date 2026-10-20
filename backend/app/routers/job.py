"""Job description matching and company recommendations router."""
import json
from fastapi import APIRouter, HTTPException, Header
from typing import Optional
from ..schemas.schemas import JobMatchRequest, CompanyRecoRequest
from ..services.ai_service import analyze_job_match, get_company_recommendations, search_live_jobs, analyze_placement_eligibility
from ..services.supabase_client import get_supabase
import uuid

router = APIRouter()


from .resume import _get_user_id


@router.post("/analyze")
async def job_match(body: JobMatchRequest, authorization: Optional[str] = Header(None)):
    user_id = _get_user_id(authorization)
    sb = get_supabase()

    resume = sb.table("resumes").select("extracted_text").eq("id", body.resume_id).eq("user_id", user_id).execute()
    if not resume.data:
        raise HTTPException(status_code=404, detail="Resume not found.")

    try:
        from app.ml.job_matcher import calculate_job_match
        ml_result = calculate_job_match(resume.data[0]["extracted_text"], body.job_description)
        
        # Map ML output to the expected format for the frontend
        result = {
            "match_score": ml_result.get("match_percentage", 0),
            "matching_items": ml_result.get("matched_skills", []),
            "missing_items": ml_result.get("missing_skills", []),
            "recommendations": ["Focus on learning the missing skills to improve your TF-IDF cosine similarity score."]
        }
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"ML analysis failed: {str(e)[:200]}")

    # Persist job match
    match_id = str(uuid.uuid4())
    sb.table("job_matches").insert({
        "id": match_id,
        "resume_id": body.resume_id,
        "job_description": body.job_description[:2000],
        "match_score": result.get("match_score", 0),
        "matching_items": json.dumps(result.get("matching_items", [])),
        "missing_items": json.dumps(result.get("missing_items", [])),
        "recommendations": json.dumps(result.get("recommendations", [])),
    }).execute()

    return {"match_id": match_id, "result": result}


@router.get("/companies/recommendations")
async def company_recommendations(
    resume_id: str,
    authorization: Optional[str] = Header(None),
):
    user_id = _get_user_id(authorization)
    sb = get_supabase()

    resume = sb.table("resumes").select("extracted_text").eq("id", resume_id).eq("user_id", user_id).execute()
    if not resume.data:
        raise HTTPException(status_code=404, detail="Resume not found.")

    # Get user profile
    profile_row = sb.table("profiles").select("*").eq("id", user_id).execute()
    profile = profile_row.data[0] if profile_row.data else {}

    try:
        result = await get_company_recommendations(resume.data[0]["extracted_text"], profile)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"AI recommendation failed: {str(e)[:200]}")

    return {"recommendations": result.get("company_recommendations", [])}

@router.get("/live-search")
async def get_live_jobs(
    resume_id: str,
    authorization: Optional[str] = Header(None),
):
    user_id = _get_user_id(authorization)
    sb = get_supabase()

    resume = sb.table("resumes").select("extracted_text").eq("id", resume_id).execute()
    if not resume.data:
        raise HTTPException(status_code=404, detail="Resume not found.")

    try:
        result = await search_live_jobs(resume.data[0]["extracted_text"])
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Live jobs search failed: {str(e)[:200]}")

    return {"jobs": result.get("jobs", [])}


@router.get("/placement-eligibility")
async def get_placement_eligibility(
    resume_id: str,
    authorization: Optional[str] = Header(None),
):
    user_id = _get_user_id(authorization)
    sb = get_supabase()

    resume = sb.table("resumes").select("extracted_text").eq("id", resume_id).execute()
    if not resume.data:
        raise HTTPException(status_code=404, detail="Resume not found.")

    try:
        result = await analyze_placement_eligibility(resume.data[0]["extracted_text"])
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Placement eligibility analysis failed: {str(e)[:200]}")

    return result
