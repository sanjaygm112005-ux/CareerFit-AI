from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional
from app.services.supabase_client import get_supabase

router = APIRouter(tags=["Admin Module"])

class CompanyRequest(BaseModel):
    name: str
    industry: Optional[str] = None

class RequirementRequest(BaseModel):
    company_id: str
    job_role: str
    minimum_cgpa: Optional[float] = None
    required_skills: Optional[List[str]] = None

@router.get("/companies")
async def get_companies():
    supabase = get_supabase()
    try:
        response = supabase.table('companies').select('*').order('name').execute()
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/companies")
async def create_company(req: CompanyRequest):
    supabase = get_supabase()
    try:
        row = {"name": req.name, "industry": req.industry}
        response = supabase.table('companies').insert(row).execute()
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/requirements")
async def get_requirements():
    supabase = get_supabase()
    try:
        response = supabase.table('company_requirements').select('*, companies(name)').execute()
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/requirements")
async def create_requirement(req: RequirementRequest):
    supabase = get_supabase()
    try:
        row = {
            "company_id": req.company_id,
            "job_role": req.job_role,
            "minimum_cgpa": req.minimum_cgpa,
            "required_skills": req.required_skills or []
        }
        response = supabase.table('company_requirements').insert(row).execute()
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/companies/{company_id}")
async def delete_company(company_id: str):
    supabase = get_supabase()
    try:
        supabase.table('companies').delete().eq('id', company_id).execute()
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/requirements/{req_id}")
async def delete_requirement(req_id: str):
    supabase = get_supabase()
    try:
        supabase.table('company_requirements').delete().eq('id', req_id).execute()
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/seed")
async def seed_demo_companies():
    supabase = get_supabase()
    try:
        existing = supabase.table('companies').select('id').execute()
        if existing.data and len(existing.data) > 0:
            return {"message": "Companies already exist", "count": len(existing.data)}

        # Seed initial companies
        sample_companies = [
            {"name": "Google", "industry": "Technology / Search & Cloud"},
            {"name": "Amazon", "industry": "E-Commerce / Cloud (AWS)"},
            {"name": "Microsoft", "industry": "Enterprise Software & Cloud"},
            {"name": "TCS (Tata Consultancy Services)", "industry": "IT Services & Consulting"},
            {"name": "Infosys", "industry": "IT Services & Consulting"},
        ]
        comp_res = supabase.table('companies').insert(sample_companies).execute()
        created_companies = comp_res.data or []

        # Map to requirements
        reqs = []
        for c in created_companies:
            if c["name"] == "Google":
                reqs.append({
                    "company_id": c["id"],
                    "job_role": "Software Engineer (SWE)",
                    "minimum_cgpa": 8.0,
                    "required_skills": ["Data Structures", "Algorithms", "Python", "C++", "System Design"]
                })
            elif c["name"] == "Amazon":
                reqs.append({
                    "company_id": c["id"],
                    "job_role": "Software Development Engineer (SDE-1)",
                    "minimum_cgpa": 7.5,
                    "required_skills": ["Java", "Python", "Data Structures", "AWS", "Problem Solving"]
                })
            elif c["name"] == "Microsoft":
                reqs.append({
                    "company_id": c["id"],
                    "job_role": "Software Engineer - Azure Core",
                    "minimum_cgpa": 7.5,
                    "required_skills": ["C#", "Python", "React", "Cloud Computing"]
                })
            elif "TCS" in c["name"]:
                reqs.append({
                    "company_id": c["id"],
                    "job_role": "Systems Engineer / Digital Cadre",
                    "minimum_cgpa": 6.5,
                    "required_skills": ["Python", "SQL", "Aptitude", "Java"]
                })
            elif "Infosys" in c["name"]:
                reqs.append({
                    "company_id": c["id"],
                    "job_role": "Specialist Programmer (SP)",
                    "minimum_cgpa": 7.0,
                    "required_skills": ["Python", "Algorithms", "React", "Database Systems"]
                })

        if reqs:
            supabase.table('company_requirements').insert(reqs).execute()

        return {"message": "Sample companies and requirements seeded successfully", "companies_added": len(created_companies)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

