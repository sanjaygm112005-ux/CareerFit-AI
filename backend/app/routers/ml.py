from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Dict, Any

from app.ml.resume_classifier import predict_category
from app.ml.skill_extractor import extract_skills
from app.ml.job_matcher import calculate_job_match
from app.ml.evaluate import get_ml_metrics

router = APIRouter(tags=["Machine Learning"])

class TextRequest(BaseModel):
    text: str

class JobMatchRequest(BaseModel):
    resume_text: str
    job_description: str

@router.post("/classify-resume")
async def classify_resume(request: TextRequest):
    """Predicts career category using SVM and TF-IDF."""
    try:
        category, confidence = predict_category(request.text)
        return {
            "predicted_category": category,
            "confidence_score": confidence,
            "model": "SVM with Linear Kernel"
        }
    except FileNotFoundError:
        raise HTTPException(status_code=503, detail="ML Models not found. Please run training script.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/extract-skills")
async def extract_skills_endpoint(request: TextRequest):
    """Extracts skills using NLP and dictionary approach."""
    try:
        skills = extract_skills(request.text)
        return {"extracted_skills": skills}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/job-match")
async def job_match_endpoint(request: JobMatchRequest):
    """Calculates Cosine Similarity + TF-IDF match for resume and job description."""
    try:
        match_data = calculate_job_match(request.resume_text, request.job_description)
        return match_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/evaluation")
async def get_evaluation_metrics():
    """Returns actual evaluation metrics for the ML model."""
    try:
        data = get_ml_metrics()
        if "error" in data:
            raise HTTPException(status_code=503, detail=data["error"])
        return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
