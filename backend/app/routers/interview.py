from fastapi import APIRouter, HTTPException
from typing import Optional, List
from pydantic import BaseModel
from typing import List, Optional
from ..services.supabase_client import get_supabase
from ..services.ai_service import conduct_mock_interview, generate_interview_scorecard

router = APIRouter()

class InterviewMessage(BaseModel):
    role: str
    content: str
    image: Optional[str] = None

class InterviewRequest(BaseModel):
    messages: List[InterviewMessage]
    resume_id: Optional[str] = None

@router.post("")
async def interview_endpoint(request: InterviewRequest, token: Optional[str] = None):
    sb = get_supabase()
    
    resume_context = None
    if request.resume_id:
        res = sb.table("resumes").select("extracted_text").eq("id", request.resume_id).execute()
        if res.data:
            resume_context = res.data[0].get("extracted_text", "")
            
    try:
        messages_dict = [{"role": m.role, "content": m.content, "image": m.image} for m in request.messages]
        reply = await conduct_mock_interview(messages_dict, resume_context)
        return {"reply": reply}
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/score")
async def score_interview(request: InterviewRequest):
    sb = get_supabase()
    
    resume_context = None
    if request.resume_id:
        res = sb.table("resumes").select("extracted_text").eq("id", request.resume_id).execute()
        if res.data and len(res.data) > 0:
            resume_context = res.data[0].get("extracted_text")
            
    try:
        messages_dict = [{"role": m.role, "content": m.content, "image": m.image} for m in request.messages]
        scorecard = await generate_interview_scorecard(messages_dict, resume_context)
        return scorecard
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
