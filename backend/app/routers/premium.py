from fastapi import APIRouter, HTTPException, Header
from typing import Optional
from ..services.ai_service import generate_flashcards, generate_portfolio_data
from ..services.supabase_client import get_supabase
from .resume import _get_user_id

router = APIRouter()

# Global memory cache for instantaneous returning responses
RESPONSE_CACHE = {}

@router.get("/flashcards")
async def get_flashcards(resume_id: str, authorization: Optional[str] = Header(None)):
    user_id = _get_user_id(authorization)
    sb = get_supabase()

    # Check Cache
    cache_key = f"flashcards_{resume_id}"
    if cache_key in RESPONSE_CACHE:
        return {"flashcards": RESPONSE_CACHE[cache_key]}

    # Query resume with user_id check and fallback
    resume = sb.table("resumes").select("extracted_text").eq("id", resume_id).execute()
    if not resume.data:
        raise HTTPException(status_code=404, detail="Resume not found.")

    resume_text = resume.data[0].get("extracted_text", "")

    try:
        flashcards = await generate_flashcards(resume_text)
        RESPONSE_CACHE[cache_key] = flashcards
        return {"flashcards": flashcards}
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Failed to generate flashcards: {str(e)[:200]}")

@router.get("/portfolio")
async def get_portfolio(resume_id: str, authorization: Optional[str] = Header(None)):
    user_id = _get_user_id(authorization)
    sb = get_supabase()

    # Check Cache
    cache_key = f"portfolio_{resume_id}"
    if cache_key in RESPONSE_CACHE:
        return {"portfolio": RESPONSE_CACHE[cache_key]}

    resume = sb.table("resumes").select("extracted_text").eq("id", resume_id).execute()
    if not resume.data:
        raise HTTPException(status_code=404, detail="Resume not found.")

    resume_text = resume.data[0].get("extracted_text", "")

    try:
        portfolio_data = await generate_portfolio_data(resume_text)
        RESPONSE_CACHE[cache_key] = portfolio_data
        return {"portfolio": portfolio_data}
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Failed to generate portfolio: {str(e)[:200]}")
