from fastapi import APIRouter, Depends, HTTPException, Body
from typing import Optional, List
from pydantic import BaseModel
from ..services.supabase_client import get_supabase
from ..services.ai_service import chat_with_ai

router = APIRouter()

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    messages: List[ChatMessage]
    resume_id: Optional[str] = None

@router.post("")
async def chat_endpoint(request: ChatRequest, token: Optional[str] = None):
    # In a real app we'd verify the token via a dependency
    sb = get_supabase()
    
    resume_context = None
    if request.resume_id:
        res = sb.table("resumes").select("extracted_text").eq("id", request.resume_id).execute()
        if res.data and len(res.data) > 0:
            resume_context = res.data[0].get("extracted_text")
            
    try:
        messages_dict = [{"role": m.role, "content": m.content} for m in request.messages]
        reply = await chat_with_ai(messages_dict, resume_context)
        return {"reply": reply}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
