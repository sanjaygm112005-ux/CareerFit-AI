from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel
from typing import Optional
import httpx
import json
from ..services.ai_service import review_github_profile

router = APIRouter()

class GithubReviewRequest(BaseModel):
    username: str

@router.post("/review")
async def review_github(req: GithubReviewRequest, authorization: Optional[str] = Header(None)):
    username = req.username.strip()
    if not username:
        raise HTTPException(status_code=400, detail="Please provide a valid GitHub username.")
        
    try:
        # Fetch basic profile and top repos from GitHub API
        headers = {"User-Agent": "ResumeAnalyzer/1.0"}
        async with httpx.AsyncClient(timeout=10.0, follow_redirects=True) as client:
            user_resp = await client.get(f"https://api.github.com/users/{username}", headers=headers)
            
            if user_resp.status_code == 404:
                raise HTTPException(status_code=404, detail=f"GitHub user '{username}' not found.")
            elif user_resp.status_code != 200:
                raise HTTPException(status_code=502, detail="Failed to fetch data from GitHub API.")
                
            user_data = user_resp.json()
            
            # Fetch repos (up to 10 sorted by updated)
            repos_resp = await client.get(f"https://api.github.com/users/{username}/repos?sort=updated&per_page=10", headers=headers)
            repos_data = repos_resp.json() if repos_resp.status_code == 200 else []
            
        # Simplify data for the prompt
        simplified_profile = {
            "name": user_data.get("name"),
            "bio": user_data.get("bio"),
            "company": user_data.get("company"),
            "blog": user_data.get("blog"),
            "location": user_data.get("location"),
            "public_repos": user_data.get("public_repos"),
            "followers": user_data.get("followers"),
            "created_at": user_data.get("created_at")
        }
        
        simplified_repos = []
        for r in repos_data:
            simplified_repos.append({
                "name": r.get("name"),
                "description": r.get("description"),
                "language": r.get("language"),
                "stargazers_count": r.get("stargazers_count"),
                "forks_count": r.get("forks_count"),
                "updated_at": r.get("updated_at")
            })
            
        full_data = {
            "profile": simplified_profile,
            "top_repositories": simplified_repos
        }
        
        # Call AI
        scorecard = await review_github_profile(json.dumps(full_data))
        return {"scorecard": scorecard}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
