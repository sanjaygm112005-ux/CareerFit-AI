from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from typing import Dict, List
import re

def calculate_job_match(resume_text: str, job_description: str) -> Dict:
    """
    Calculates the match percentage between a resume and a job description
    using TF-IDF and Cosine Similarity.
    """
    try:
        from app.ml.preprocessing import clean_text
        from app.ml.skill_extractor import extract_skills
    except ImportError:
        from preprocessing import clean_text
        from skill_extractor import extract_skills

    clean_resume = clean_text(resume_text)
    clean_job = clean_text(job_description)
    
    if not clean_resume or not clean_job:
        return {
            "match_percentage": 0.0,
            "matched_skills": [],
            "missing_skills": []
        }
        
    # Extract skills for explicit comparison
    resume_skills = set(extract_skills(clean_resume))
    job_skills = set(extract_skills(clean_job))
    
    matched_skills = list(resume_skills.intersection(job_skills))
    missing_skills = list(job_skills.difference(resume_skills))
    
    # TF-IDF Cosine Similarity for overall text match
    vectorizer = TfidfVectorizer()
    
    try:
        tfidf_matrix = vectorizer.fit_transform([clean_resume, clean_job])
        # Compute cosine similarity between the two documents
        similarity = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:2])[0][0]
    except ValueError:
        # Fails if vocabulary is empty
        similarity = 0.0
        
    # Combine TF-IDF similarity with Skill Match ratio for a robust score
    skill_match_ratio = len(matched_skills) / len(job_skills) if job_skills else 1.0
    
    # Weight: 60% TF-IDF text similarity, 40% explicit skill match
    final_score = (similarity * 0.6) + (skill_match_ratio * 0.4)
    
    # Cap at 100% and convert to percentage
    match_percentage = min(round(final_score * 100, 2), 100.0)
    
    return {
        "match_percentage": match_percentage,
        "matched_skills": sorted(matched_skills),
        "missing_skills": sorted(missing_skills)
    }
