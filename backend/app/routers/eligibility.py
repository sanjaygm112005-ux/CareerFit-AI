from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Dict, Any

from app.services.supabase_client import get_supabase

router = APIRouter(tags=["Eligibility Engine"])

class EligibilityRequest(BaseModel):
    cgpa: float
    branch: str
    graduation_year: int
    backlogs: int
    skills: List[str]
    experience_years: float

@router.post("/check")
async def check_eligibility(request: EligibilityRequest):
    """
    Checks user profile against all company requirements in the database
    using a strict Rule-Based Engine.
    """
    supabase = get_supabase()
    
    try:
        # Fetch all companies and their requirements
        reqs_response = supabase.table('company_requirements').select('*, companies(name)').execute()
        requirements = reqs_response.data
        
        results = []
        
        for req in requirements:
            company_obj = req.get('companies')
            company_name = company_obj.get('name', 'Company') if isinstance(company_obj, dict) else 'Company'
            role = req.get('job_role', 'General Role')
            is_eligible = True
            reasons = []
            
            # CGPA Check
            if req.get('minimum_cgpa') is not None:
                if request.cgpa >= req['minimum_cgpa']:
                    reasons.append(f"✓ CGPA ({request.cgpa}) meets minimum ({req['minimum_cgpa']})")
                else:
                    is_eligible = False
                    reasons.append(f"✗ CGPA ({request.cgpa}) below minimum ({req['minimum_cgpa']})")
                    
            # Branch Check
            allowed_branches = req.get('eligible_branches') or req.get('allowed_branches')
            if allowed_branches and len(allowed_branches) > 0:
                if request.branch in allowed_branches:
                    reasons.append(f"✓ Branch ({request.branch}) is allowed")
                else:
                    is_eligible = False
                    reasons.append(f"✗ Branch ({request.branch}) is not in allowed list")
                    
            # Graduation Year Check
            grad_year = req.get('graduation_year')
            if grad_year is not None:
                if request.graduation_year == grad_year:
                    reasons.append(f"✓ Graduation year ({request.graduation_year}) matches")
                else:
                    is_eligible = False
                    reasons.append(f"✗ Graduation year ({request.graduation_year}) does not match ({grad_year})")
                    
            # Backlogs Check
            max_backlogs = req.get('allowed_backlogs') if req.get('allowed_backlogs') is not None else req.get('maximum_backlogs')
            if max_backlogs is not None:
                if request.backlogs <= max_backlogs:
                    reasons.append(f"✓ Active backlogs ({request.backlogs}) within limit (max {max_backlogs})")
                else:
                    is_eligible = False
                    reasons.append(f"✗ Too many backlogs ({request.backlogs} > {max_backlogs})")
                    
            # Skills Check
            missing_skills = []
            if req.get('required_skills') and len(req['required_skills']) > 0:
                user_skills_lower = [s.lower() for s in request.skills]
                for req_skill in req['required_skills']:
                    if req_skill.lower() not in user_skills_lower:
                        missing_skills.append(req_skill)
                
                matched_count = len(req['required_skills']) - len(missing_skills)
                reasons.append(f"{'✓' if len(missing_skills) == 0 else '✗'} Skills matched: {matched_count}/{len(req['required_skills'])}")
                
                if len(missing_skills) > 0:
                    is_eligible = False
                    reasons.append(f"Missing Required Skills: {', '.join(missing_skills)}")

            results.append({
                "company_name": company_name,
                "role": role,
                "is_eligible": is_eligible,
                "reasons": reasons
            })
            
        return {"results": results}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
