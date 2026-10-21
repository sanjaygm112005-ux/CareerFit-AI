"""Pydantic schemas for request/response models."""
from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime


# ── Auth ──────────────────────────────────────────────────────────────────────

class SignUpRequest(BaseModel):
    email: EmailStr
    password: str
    name: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    password: str


# ── Profile ───────────────────────────────────────────────────────────────────

class UserProfile(BaseModel):
    full_name: Optional[str] = None
    email: Optional[str] = None
    location: Optional[str] = None
    education: Optional[str] = None
    degree: Optional[str] = None
    specialization: Optional[str] = None
    graduation_year: Optional[int] = None
    experience_level: Optional[str] = None
    years_of_experience: Optional[float] = None
    preferred_role: Optional[str] = None
    preferred_industry: Optional[str] = None
    preferred_location: Optional[str] = None
    expected_salary: Optional[str] = None
    skills: Optional[List[str]] = None
    work_type: Optional[str] = None  # remote | hybrid | on-site


# ── Resume Analysis ───────────────────────────────────────────────────────────

class JobMatchRequest(BaseModel):
    resume_id: Optional[str] = None
    job_description: str


class CoverLetterRequest(BaseModel):
    resume_id: str
    job_description: str
    company_name: str

class CompanyRecoRequest(BaseModel):
    resume_id: str
    user_profile: Optional[UserProfile] = None


# ── Analysis History ──────────────────────────────────────────────────────────

class AnalysisHistoryItem(BaseModel):
    id: str
    resume_id: str
    file_name: str
    overall_score: int
    ats_score: int
    grammar_score: int
    created_at: datetime
