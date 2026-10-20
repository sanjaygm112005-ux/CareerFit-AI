import re
from typing import List

# A curated dictionary of technical skills, frameworks, and soft skills
SKILLS_DICTIONARY = [
    # Programming Languages
    'python', 'java', 'c++', 'c#', 'javascript', 'typescript', 'ruby', 'php', 'swift', 'go', 'rust', 'kotlin', 'r', 'sql', 'html', 'css',
    
    # Frameworks & Libraries
    'react', 'angular', 'vue', 'django', 'flask', 'fastapi', 'spring boot', 'node.js', 'express', 'ruby on rails', 'asp.net', 'laravel',
    'tensorflow', 'pytorch', 'scikit-learn', 'pandas', 'numpy', 'keras', 'bootstrap', 'tailwind css',
    
    # Databases
    'mysql', 'postgresql', 'mongodb', 'sqlite', 'oracle', 'sql server', 'redis', 'cassandra', 'elasticsearch', 'dynamodb',
    
    # Cloud & DevOps
    'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'jenkins', 'git', 'github', 'gitlab', 'ci/cd', 'terraform', 'ansible', 'linux',
    
    # Domains
    'machine learning', 'artificial intelligence', 'data science', 'cybersecurity', 'cloud computing', 'blockchain', 'iot',
    'web development', 'mobile development', 'full stack', 'backend', 'frontend', 'devops',
    
    # Soft Skills
    'communication', 'leadership', 'teamwork', 'problem solving', 'critical thinking', 'time management', 'adaptability', 'agile', 'scrum'
]

def extract_skills(text: str) -> List[str]:
    """
    Extracts skills from raw text using a predefined dictionary and regex.
    """
    if not text:
        return []
        
    text_lower = text.lower()
    extracted_skills = set()
    
    for skill in SKILLS_DICTIONARY:
        # Use regex boundaries to ensure we match whole words only
        # Escape the skill string to handle special characters like c++
        pattern = r'\b' + re.escape(skill) + r'\b'
        if re.search(pattern, text_lower):
            extracted_skills.add(skill)
            
    return sorted(list(extracted_skills))
