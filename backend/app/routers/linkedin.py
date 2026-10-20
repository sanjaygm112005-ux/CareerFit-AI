from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel
from typing import Optional
from ..services.ai_service import review_linkedin_profile

router = APIRouter()


class LinkedInReviewRequest(BaseModel):
    profile_text: Optional[str] = None
    profile_url: Optional[str] = None


@router.post("/review")
async def review_linkedin(req: LinkedInReviewRequest, authorization: Optional[str] = Header(None)):
    profile_text = req.profile_text or ""

    # If a URL is provided, validate it, then immediately tell the user to paste
    # text instead. LinkedIn always blocks scraping and a real fetch would
    # freeze the server for seconds, degrading other features.
    if req.profile_url and req.profile_url.strip() and not profile_text:
        url = req.profile_url.strip()
        if "linkedin.com/in/" not in url:
            raise HTTPException(
                status_code=400,
                detail="Please provide a valid LinkedIn profile URL (e.g., https://www.linkedin.com/in/yourname/)."
            )
        # LinkedIn blocks all scraping — inform user immediately
        raise HTTPException(
            status_code=422,
            detail="LinkedIn prevents automated access to profiles. Please switch to 'Paste Text' mode: open your LinkedIn profile, press Ctrl+A → Ctrl+C, then paste the text in the app."
        )

    if not profile_text or len(profile_text.strip()) < 50:
        raise HTTPException(
            status_code=400,
            detail="Profile text is too short. Please paste more of your LinkedIn profile text (Headline, About, Experience sections)."
        )

    try:
        scorecard = await review_linkedin_profile(profile_text)
        return {"scorecard": scorecard}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
