from fastapi import APIRouter, Depends, HTTPException
from typing import Optional
from pydantic import BaseModel
from ..services.supabase_client import get_supabase
from ..services.ai_service import generate_aptitude_test

router = APIRouter()

class GenerateTestRequest(BaseModel):
    resume_id: Optional[str] = None

@router.post("/generate")
async def generate_test(request: GenerateTestRequest):
    sb = get_supabase()
    
    resume_context = None
    if request.resume_id:
        res = sb.table("resumes").select("extracted_text").eq("id", request.resume_id).execute()
        if res.data and len(res.data) > 0:
            resume_context = res.data[0].get("extracted_text")
            
    try:
        questions = await generate_aptitude_test(resume_context)
        return {"questions": questions}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
