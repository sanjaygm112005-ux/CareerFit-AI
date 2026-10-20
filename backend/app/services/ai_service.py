"""AI analysis service using Google Gemini 1.5 Flash."""
import json
import httpx
from typing import Optional
from ..config import settings

GEMINI_ENDPOINT = (
    "https://generativelanguage.googleapis.com/v1beta/models/"
    "gemini-3.5-flash-lite:generateContent"
)

BUILDER_PROMPT = """
You are an expert resume writer. The user has provided unstructured 'brain dump' text about their experience, along with their basic info. 
Your task is to generate a beautiful, highly professional, ATS-optimized resume in standard Markdown format.

USER INFO:
Name: {name}
Email: {email}
Phone: {phone}
Target Role: {target_role}

RAW EXPERIENCE TEXT:
{raw_text}

OUTPUT FORMAT REQUIREMENTS:
- Output ONLY valid markdown. Do not wrap in JSON. Do not include ```markdown or ``` wrappers, just raw markdown.
- Structure the resume EXACTLY with these sections, in this order:
  1. A header with their Name, Contact Info (Phone | Email), and Links (LinkedIn | GitHub).
  2. **Career Objective**: A short paragraph about their goals.
  3. **Summary**: A short paragraph summarizing their profile.
  4. **Education**: Format with Degree, Year, Institution, and Grades.
  5. **Technical Skills**: Categorize into Programming, Web Technologies, Database, Core Concepts, and Development Interests. Use bolding for categories.
  6. **Projects**: Name of the project in bold, followed by a description paragraph.
  7. **Academic Interests**: A bulleted list.
  8. **Certifications**: A bulleted list.
  9. **Achievements & Activities**: A bulleted list.
  10. **Soft Skills**: A comma or pipe-separated list.
  11. **Languages**: A comma or pipe-separated list.
- If the user did not provide info for a section (e.g. Certifications), omit that section or invent realistic placeholders based on their profile.
- Use standard markdown formatting (#, ##, bullet points, bolding).
"""

ANALYSIS_PROMPT = """
You are an expert resume reviewer and career coach. Analyze the following resume text 
and return a detailed JSON analysis. Be accurate and base all scores on actual content.

RESUME TEXT:
{resume_text}

USER PROFILE (optional context):
{user_profile}

CRITICAL PERFORMANCE INSTRUCTION: 
To ensure fast processing, keep your text extremely concise. For ALL arrays (strengths, weaknesses, grammar_issues, suggestions, experience_analysis, project_analysis, etc.), return a MAXIMUM of 3 items per array. Do not write long paragraphs; use short 1-2 sentence descriptions.

Return ONLY valid JSON (no markdown, no explanation) in this exact structure:
{{
  "overall_score": <integer 0-100>,
  "ats_score": <integer 0-100>,
  "content_score": <integer 0-100>,
  "skills_score": <integer 0-100>,
  "formatting_score": <integer 0-100>,
  "grammar_score": <integer 0-100>,

  "strengths": [
    {{"title": "string", "description": "string"}}
  ],
  "weaknesses": [
    {{"title": "string", "description": "string"}}
  ],

  "ats_analysis": {{
    "strengths": ["string"],
    "problems": [{{"issue": "string", "explanation": "string"}}]
  }},

  "missing_keywords": ["string"],
  "matching_keywords": ["string"],
  "recommended_keywords": ["string"],

  "grammar_issues": [
    {{
      "original": "string",
      "problem": "string",
      "suggestion": "string",
      "explanation": "string"
    }}
  ],

  "suggestions": [
    {{
      "priority": "high|medium|low",
      "problem": "string",
      "why_it_matters": "string",
      "suggested_improvement": "string"
    }}
  ],

  "skills": [
    {{
      "name": "string",
      "category": "programming_language|framework|database|tool|soft_skill|other",
      "relevance": "high|medium|low"
    }}
  ],

  "experience_analysis": [
    {{
      "original": "string",
      "quality": "strong|weak",
      "suggestion": "string"
    }}
  ],

  "project_analysis": [
    {{
      "title": "string",
      "current_description": "string",
      "quality": "strong|weak",
      "suggestion": "string"
    }}
  ],

  "contact_info_detected": true,
  "education_detected": true,
  "experience_detected": true,
  "skills_section_detected": true
}}
"""

JOB_MATCH_PROMPT = """
You are an expert career advisor. Compare this resume to the job description and return JSON.

RESUME TEXT:
{resume_text}

JOB DESCRIPTION:
{job_description}

Return ONLY valid JSON:
{{
  "match_score": <integer 0-100>,
  "matching_items": ["string"],
  "missing_items": ["string"],
  "recommendations": ["string"],
  "company_recommendations": [
    {{
      "company_name": "string",
      "role": "string",
      "why_match": "string",
      "matching_skills": ["string"],
      "missing_requirements": ["string"],
      "eligibility_percentage": <integer 0-100>,
      "experience_required": "string",
      "location": "string",
      "work_type": "remote|hybrid|on-site"
    }}
  ]
}}
"""

COMPANY_RECOMMENDATION_PROMPT = """
You are a career advisor. Based on the user's resume and preferences, suggest 8-12 
suitable companies and roles they may be a potential match for. Use realistic, 
well-known companies relevant to their skillset and industry.

RESUME TEXT:
{resume_text}

USER PROFILE:
{user_profile}

Return ONLY valid JSON:
{{
  "company_recommendations": [
    {{
      "company_name": "string",
      "role": "string",
      "why_match": "string",
      "matching_skills": ["string"],
      "missing_requirements": ["string"],
      "eligibility_percentage": <integer 0-100>,
      "experience_required": "string",
      "location": "string",
      "work_type": "remote|hybrid|on-site",
      "industry": "string",
      "company_size": "startup|mid-size|large|enterprise"
    }}
  ]
}}
"""


from typing import Union

async def _call_gemini(prompt: str, return_json: bool = True) -> Union[dict, str]:
    """Call Gemini API and return parsed JSON response or raw string."""
    gen_config = {
        "temperature": 0.3,
        "topP": 0.8,
        "maxOutputTokens": 8192,
    }
    if return_json:
        gen_config["responseMimeType"] = "application/json"

    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": gen_config,
    }
    
    import asyncio
    max_retries = 3
    base_delay = 2.0
    for attempt in range(max_retries):
        try:
            async with httpx.AsyncClient(timeout=120.0) as client:
                resp = await client.post(
                    GEMINI_ENDPOINT,
                    params={"key": settings.gemini_api_key},
                    json=payload,
                )
                resp.raise_for_status()
                break # Success, exit retry loop
        except httpx.HTTPStatusError as e:
            if e.response.status_code in [429, 503, 500] and attempt < max_retries - 1:
                print(f"Gemini API error {e.response.status_code}. Retrying in {base_delay}s...")
                await asyncio.sleep(base_delay)
                base_delay *= 2
            else:
                raise

    data = resp.json()
    parts = data.get("candidates", [{}])[0].get("content", {}).get("parts", [])
    text = "".join(p.get("text", "") for p in parts).strip()

    if not return_json:
        return text

    # 1. Direct parse attempt (always works with responseMimeType: application/json)
    try:
        return json.loads(text)
    except Exception:
        pass

    # 2. Strip markdown fences if present
    import re
    cleaned = re.sub(r"^```(?:json)?\s*", "", text.strip())
    cleaned = re.sub(r"\s*```$", "", cleaned).strip()
    try:
        return json.loads(cleaned)
    except Exception:
        pass

    # 3. Determine whether the root is an Array or Object based on first delimiter
    first_bracket = cleaned.find("[")
    first_brace = cleaned.find("{")

    if first_bracket != -1 and (first_brace == -1 or first_bracket < first_brace):
        # Root is a JSON Array
        last_bracket = cleaned.rfind("]")
        if last_bracket != -1:
            try:
                return json.loads(cleaned[first_bracket:last_bracket + 1])
            except Exception:
                pass
    elif first_brace != -1:
        # Root is a JSON Object
        last_brace = cleaned.rfind("}")
        if last_brace != -1:
            try:
                return json.loads(cleaned[first_brace:last_brace + 1])
            except Exception:
                pass

    raise ValueError(f"Failed to parse Gemini response as JSON. Response snippet: {text[:200]}")


async def analyze_resume(resume_text: str, user_profile: Optional[dict] = None) -> dict:
    """Run full resume analysis via Gemini."""
    profile_str = json.dumps(user_profile or {}, indent=2)
    prompt = ANALYSIS_PROMPT.format(
        resume_text=resume_text[:12000],  # Cap to avoid token overflow
        user_profile=profile_str,
    )
    return await _call_gemini(prompt)


async def analyze_job_match(resume_text: str, job_description: str) -> dict:
    """Compare resume to a job description."""
    prompt = JOB_MATCH_PROMPT.format(
        resume_text=resume_text[:8000],
        job_description=job_description[:4000],
    )
    return await _call_gemini(prompt)


async def get_company_recommendations(resume_text: str, user_profile: Optional[dict] = None) -> dict:
    """Generate company recommendations based on resume and profile."""
    profile_str = json.dumps(user_profile or {}, indent=2)
    prompt = COMPANY_RECOMMENDATION_PROMPT.format(
        resume_text=resume_text[:8000],
        user_profile=profile_str,
    )
    return await _call_gemini(prompt)

async def chat_with_ai(messages: list[dict], resume_context: Optional[str] = None) -> str:
    """Send a conversation history to Gemini and get a response."""
    contents = []
    
    if resume_context:
        contents.append({
            "role": "user",
            "parts": [{"text": f"System context: The user uploaded a resume. Here is their resume text for reference:\n{resume_context}\n\nPlease keep this context in mind for our following conversation. Answer questions about their career, resume, and skills. Say 'Acknowledged' if you understand."}]
        })
        contents.append({
            "role": "model",
            "parts": [{"text": "Acknowledged. I will keep your resume context in mind for our conversation."}]
        })
        
    for msg in messages:
        role = "model" if msg["role"] == "assistant" else "user"
        contents.append({
            "role": role,
            "parts": [{"text": msg["content"]}]
        })
        
    payload = {
        "contents": contents,
        "generationConfig": {
            "temperature": 0.7,
            "topK": 40,
            "topP": 0.95,
            "maxOutputTokens": 2048,
        }
    }
    
    async with httpx.AsyncClient(timeout=45) as client:
        response = await client.post(
            GEMINI_ENDPOINT,
            params={"key": settings.gemini_api_key},
            json=payload
        )
        if response.status_code != 200:
            raise Exception(f"Gemini API Error: {response.text}")
            
        data = response.json()
        try:
            return data["candidates"][0]["content"]["parts"][0]["text"]
        except (KeyError, IndexError) as e:
            raise Exception(f"Failed to parse Gemini response: {data}") from e


async def generate_aptitude_test(resume_text: Optional[str] = None) -> list[dict]:
    """Generate multiple choice questions based on resume or general aptitude."""
    prompt = "Generate a professional technical aptitude test with 6 multiple-choice questions. "
    if resume_text:
        prompt += f"Tailor the questions to test skills relevant to this candidate:\n{resume_text[:3000]}\n\n"
    else:
        prompt += "Focus on logic, algorithms, and core software engineering concepts.\n\n"

    prompt += """
Return strictly a JSON array of 6 objects.
EACH object MUST have:
"question": string
"options": array of 4 strings
"correct_answer": string (exact match to one of the options)
"explanation": string (concise 1-sentence explanation)
"""
    
    res = await _call_gemini(prompt)
    if isinstance(res, list):
        return res
    if isinstance(res, dict) and "questions" in res:
        return res["questions"]
    return res

async def conduct_mock_interview(messages: list[dict], resume_context: Optional[str] = None) -> str:
    """Send a conversation history to Gemini as an interviewer."""
    contents = []
    
    system_prompt = (
        "System context: You are a strict but fair senior hiring manager conducting a mock interview. "
        "The user is the candidate. "
    )
    if resume_context:
        system_prompt += f"\nHere is the candidate's resume:\n{resume_context}\n\n"
        system_prompt += "Ask questions directly related to their listed skills and experience. "
    else:
        system_prompt += "Ask standard behavioral and technical interview questions. "
        
    system_prompt += (
        "RULES: \n"
        "1. Ask EXACTLY ONE question at a time.\n"
        "2. Wait for the user's answer.\n"
        "3. Provide brief, constructive feedback on their answer (what they did well, what they could improve).\n"
        "4. Immediately ask the NEXT question.\n"
        "Say 'Acknowledged. Let's begin the interview.' to start."
    )

    contents.append({
        "role": "user",
        "parts": [{"text": system_prompt}]
    })
    contents.append({
        "role": "model",
        "parts": [{"text": "Acknowledged. Let's begin the interview."}]
    })
        
    for msg in messages:
        role = "model" if msg["role"] == "assistant" else "user"
        parts = [{"text": msg["content"]}]
        
        if msg.get("image"):
            b64_data = msg["image"]
            if "," in b64_data:
                b64_data = b64_data.split(",")[1]
            parts.append({
                "inline_data": {
                    "mime_type": "image/jpeg",
                    "data": b64_data
                }
            })
            
        contents.append({
            "role": role,
            "parts": parts
        })
        
    if not messages:
        contents.append({
            "role": "user",
            "parts": [{"text": "Hello, I am ready. Please ask the first question."}]
        })
        
    payload = {
        "contents": contents,
        "generationConfig": {
            "temperature": 0.7,
            "topK": 40,
            "topP": 0.95,
            "maxOutputTokens": 2048,
        }
    }
    
    async with httpx.AsyncClient(timeout=45) as client:
        response = await client.post(
            GEMINI_ENDPOINT,
            params={"key": settings.gemini_api_key},
            json=payload
        )
        if response.status_code != 200:
            raise Exception(f"Gemini API Error: {response.text}")
            
        data = response.json()
        try:
            return data["candidates"][0]["content"]["parts"][0]["text"]
        except (KeyError, IndexError) as e:
            raise Exception(f"Failed to parse Gemini response: {data}") from e

async def generate_cover_letter(resume_text: str, job_description: str, company_name: str) -> str:
    """Generate a highly tailored cover letter."""
    prompt = f"""
    You are an expert career coach and executive assistant. Write a professional, confident, and modern cover letter for the following user.
    
    Target Company: {company_name}
    Job Description:
    {job_description[:3000]}
    
    User's Resume:
    {resume_text[:4000]}
    
    Instructions:
    - Do NOT include generic placeholder headers like [Your Name] or [Date]. Start directly with the greeting (e.g. "Dear Hiring Manager," or "Dear {company_name} Team,").
    - Use a confident, modern, and enthusiastic tone.
    - Write exactly 3-4 concise paragraphs.
    - Write exactly 3-4 concise paragraphs.
    - Specifically reference the company's needs from the job description and match them to achievements from the resume.
    - Do NOT output Markdown formatting (like **bolding**). Just output standard plain text with line breaks, so it's easy to copy and paste.
    """
    
    res = await _call_gemini(prompt, return_json=False)
    if isinstance(res, dict) and "text" in res:
        return res["text"]
    elif isinstance(res, str):
        return res
    return str(res)

async def analyze_skills_gap(resume_text: str, target_role: str) -> dict:
    """Analyze the gap between current skills and target role requirements."""
    prompt = f"""
    You are an expert career coach. Analyze the user's resume against their desired target role.
    
    Target Role: {target_role}
    
    User's Resume:
    {resume_text[:4000]}
    
    Instructions:
    Return a JSON object with the following structure:
    {{
      "current_relevant_skills": ["Skill 1", "Skill 2"],
      "missing_skills": ["Missing Skill 1", "Missing Skill 2"],
      "action_plan": [
        "Step 1 to bridge the gap",
        "Step 2 to bridge the gap"
      ],
      "recommended_courses": [
        {{
          "title": "string (Course Name)",
          "platform": "string (e.g. Coursera, Udemy, edX)",
          "reason": "string (Why this course helps)",
          "url": "string (A placeholder search URL like https://www.coursera.org/search?query=...)"
        }}
      ]
    }}
    Ensure the JSON is valid and contains no markdown formatting like ```json.
    """
    
    res = await _call_gemini(prompt)
    if isinstance(res, str):
        import json
        try:
            return json.loads(res.strip('`').strip('json').strip())
        except:
            pass
    if isinstance(res, dict):
        return res
    return {}

async def generate_interview_scorecard(messages: list[dict], resume_context: Optional[str] = None) -> dict:
    contents = []
    
    system_prompt = (
        "System context: You are an expert behavioral analyst and hiring manager. "
        "Review the following interview transcript and the user's webcam snapshots (if provided). "
        "Analyze their body language (nervousness, confidence, eye contact) based on the images, and their communication skills based on their text answers. "
        "Output ONLY valid JSON with this exact structure:\n"
        "{\n"
        "  \"confidence\": 85,\n"
        "  \"speaking_quality\": 90,\n"
        "  \"communication\": 88,\n"
        "  \"nervousness\": 20,\n"
        "  \"feedback\": \"Detailed feedback on what they did well and what to improve.\"\n"
        "}"
    )
    contents.append({"role": "user", "parts": [{"text": system_prompt}]})
    contents.append({"role": "model", "parts": [{"text": "Acknowledged."}]})
    
    for msg in messages:
        role = "model" if msg["role"] == "assistant" else "user"
        parts = [{"text": msg["content"]}]
        
        if msg.get("image"):
            b64_data = msg["image"]
            if "," in b64_data:
                b64_data = b64_data.split(",")[1]
            parts.append({
                "inline_data": {
                    "mime_type": "image/jpeg",
                    "data": b64_data
                }
            })
            
        contents.append({
            "role": role,
            "parts": parts
        })
        
    contents.append({
        "role": "user",
        "parts": [{"text": "The interview is over. Generate the final JSON scorecard now."}]
    })
    
    payload = {
        "contents": contents,
        "generationConfig": {
            "temperature": 0.3,
            "maxOutputTokens": 1024,
        }
    }
    
    async with httpx.AsyncClient(timeout=45) as client:
        response = await client.post(
            GEMINI_ENDPOINT,
            params={"key": settings.gemini_api_key},
            json=payload
        )
        if response.status_code != 200:
            raise Exception(f"Gemini API Error: {response.text}")
            
        data = response.json()
        try:
            text = data["candidates"][0]["content"]["parts"][0]["text"]
            text = text.strip()
            if text.startswith("```"):
                text = text.split("```")[1]
                if text.startswith("json"):
                    text = text[4:]
            text = text.strip().rstrip("```").strip()
            return json.loads(text)
        except Exception as e:
            print("Failed to parse scorecard JSON:", e)
            print("Response:", data)
            return {
                "confidence": 0,
                "speaking_quality": 0,
                "communication": 0,
                "nervousness": 0,
                "feedback": "Failed to analyze interview."
            }

async def rewrite_resume_content(resume_text: str) -> str:
    """Rewrite the resume bullet points into XYZ format and return optimized Markdown."""
    prompt = f"""
    You are an expert executive resume writer. Your task is to rewrite and optimize the provided resume.
    
    INSTRUCTIONS:
    1. Transform all experience bullet points into the industry-standard XYZ format (Accomplished [X] as measured by [Y], by doing [Z]).
    2. Fix any grammatical errors and improve weak action verbs.
    3. Format the output cleanly in raw Markdown. Do NOT include generic conversational filler (like "Here is your rewritten resume").
    4. Structure the resume EXACTLY with these sections, in this order:
       - A header with Name, Contact Info (Phone | Email), and Links (LinkedIn | GitHub).
       - **Career Objective**: A short paragraph about their goals.
       - **Summary**: A short paragraph summarizing their profile.
       - **Education**: Format with Degree, Year, Institution, and Grades.
       - **Technical Skills**: Categorize into Programming, Web Technologies, Database, Core Concepts. Use bolding.
       - **Projects**: Name of the project in bold, followed by a description paragraph.
       - **Work Experience**: Name of role, company, dates, and XYZ bullet points.
       - **Academic Interests**: A bulleted list.
       - **Certifications**: A bulleted list.
       - **Achievements & Activities**: A bulleted list.
       - **Soft Skills / Languages**: A comma or pipe-separated list.
    
    ORIGINAL RESUME:
    {resume_text[:8000]}
    """
    res = await _call_gemini(prompt, return_json=False)
    if isinstance(res, dict) and "text" in res:
        return res["text"]
    return str(res)


import base64

async def extract_text_from_document(file_bytes: bytes, mime_type: str = "application/pdf") -> str:
    """Fallback OCR using Gemini 1.5 Flash directly on the PDF/Image."""
    b64_data = base64.b64encode(file_bytes).decode('utf-8')
    
    payload = {
        "contents": [
            {
                "parts": [
                    {"text": "Extract all text from this document accurately, maintaining the logical structure and flow. Do not summarize. Output the raw text."},
                    {
                        "inline_data": {
                            "mime_type": mime_type,
                            "data": b64_data
                        }
                    }
                ]
            }
        ],
        "generationConfig": {
            "temperature": 0.1,
            "maxOutputTokens": 8192,
        }
    }
    
    async with httpx.AsyncClient(timeout=60) as client:
        response = await client.post(
            GEMINI_ENDPOINT,
            params={"key": settings.gemini_api_key},
            json=payload
        )
        if response.status_code != 200:
            print("Gemini OCR fallback error:", response.text)
            return ""
            
        data = response.json()
        try:
            return data["candidates"][0]["content"]["parts"][0]["text"].strip()
        except:
            return ""


async def review_linkedin_profile(profile_text: str) -> dict:
    """Analyze a pasted LinkedIn profile and return a rich optimization scorecard."""
    prompt = f"""
    You are a world-class LinkedIn career coach and recruiter with 15 years of experience.
    Review the following LinkedIn profile text and provide a deeply actionable analysis.
    
    LINKEDIN PROFILE TEXT:
    {profile_text[:7000]}
    
    INSTRUCTIONS:
    Return ONLY valid JSON (no markdown fences) in this EXACT structure:
    {{
      "overall_score": <integer 0-100>,
      "grade": "<string: A, B, C, D, or F>",
      "headline": {{
        "score": <integer 0-100>,
        "current_text": "<string: the user's current headline if found, else 'Not detected'>",
        "feedback": "<string: specific critique of the headline>",
        "rewritten": "<string: a powerful, recruiter-optimized rewrite>"
      }},
      "about": {{
        "score": <integer 0-100>,
        "feedback": "<string: specific critique of the About/Summary section>",
        "rewritten": "<string: a compelling, first-person rewrite of the About section>"
      }},
      "experience": {{
        "score": <integer 0-100>,
        "feedback": "<string: critique of how experiences are described>",
        "rewritten": "<string: example of one bullet point rewritten in XYZ format (Accomplished X, as measured by Y, by doing Z)>"
      }},
      "skills": {{
        "score": <integer 0-100>,
        "feedback": "<string: critique of the skills section>",
        "missing_keywords": ["<3-5 high-value keywords that are missing>"]
      }},
      "quick_wins": [
        {{"priority": 1, "action": "<string: the single most impactful thing to do first>", "reason": "<string: why this matters>"}},
        {{"priority": 2, "action": "<string: second most impactful action>", "reason": "<string: why this matters>"}},
        {{"priority": 3, "action": "<string: third most impactful action>", "reason": "<string: why this matters>"}}
      ]
    }}
    """
    res = await _call_gemini(prompt)
    if isinstance(res, str):
        import json
        try:
            return json.loads(res.strip('`').strip('json').strip())
        except:
            pass
    if isinstance(res, dict):
        return res
    return {}


async def review_github_profile(github_data_json: str) -> dict:
    """Analyze a GitHub profile and its repositories, returning a scorecard."""
    prompt = f"""
    You are a Senior Engineering Manager and Tech Recruiter.
    Review the following GitHub profile data (including top repositories) and provide a deeply actionable analysis of their open-source presence.
    
    GITHUB DATA (JSON format):
    {github_data_json[:8000]}
    
    INSTRUCTIONS:
    Return ONLY valid JSON (no markdown fences) in this EXACT structure:
    {{
      "overall_score": <integer 0-100>,
      "grade": "<string: A, B, C, D, or F>",
      "readme": {{
        "score": <integer 0-100>,
        "feedback": "<string: critique of their profile README (if they have one) or lack thereof>",
        "action": "<string: what they should write in their profile README>"
      }},
      "repositories": {{
        "score": <integer 0-100>,
        "feedback": "<string: critique of their pinned/top repos, commit history, and project quality>",
        "action": "<string: how to improve their repo descriptions, tags, and structure>"
      }},
      "languages": {{
        "score": <integer 0-100>,
        "feedback": "<string: analysis of the languages and tech stack they use>",
        "missing_skills": ["<3-5 modern tech skills they should consider learning or showcasing>"]
      }},
      "quick_wins": [
        {{"priority": 1, "action": "<string: single most impactful thing to do first>", "reason": "<string: why this matters>"}},
        {{"priority": 2, "action": "<string: second most impactful action>", "reason": "<string: why this matters>"}},
        {{"priority": 3, "action": "<string: third most impactful action>", "reason": "<string: why this matters>"}}
      ]
    }}
    """
    res = await _call_gemini(prompt)
    if isinstance(res, str):
        import json
        try:
            return json.loads(res.strip('`').strip('json').strip())
        except:
            pass
    if isinstance(res, dict):
        return res
    return {}


async def analyze_placement_eligibility(resume_text: str) -> dict:
    """Analyze a resume to determine placement eligibility across three tiers of companies."""
    prompt = f"""
    You are an expert University Placement Coordinator and Tech Recruiter.
    Evaluate the following student/candidate resume against three distinct tiers of campus recruitment companies:
    Tier 1: Product-based & FAANG (e.g. Google, Microsoft, Amazon)
    Tier 2: Unicorns & High Growth Startups (e.g. Swiggy, Uber, Cred)
    Tier 3: Service-based MNCs (e.g. TCS, Infosys, Wipro, Cognizant)
    
    RESUME TEXT:
    {resume_text[:6000]}
    
    INSTRUCTIONS:
    Return ONLY valid JSON (no markdown fences) in this EXACT structure:
    {{
      "overall_readiness_score": <integer 0-100>,
      "tiers": [
        {{
          "tier": "Tier 1: Product/FAANG",
          "match_percentage": <integer 0-100>,
          "status": "<Ready, Almost There, or Needs Work>",
          "strong_points": ["<1-2 short bullet points>"],
          "missing_requirements": ["<2-3 critical missing skills or projects>"]
        }},
        {{
          "tier": "Tier 2: Unicorns/Startups",
          "match_percentage": <integer 0-100>,
          "status": "<Ready, Almost There, or Needs Work>",
          "strong_points": ["<1-2 short bullet points>"],
          "missing_requirements": ["<2-3 critical missing skills or projects>"]
        }},
        {{
          "tier": "Tier 3: Service MNCs",
          "match_percentage": <integer 0-100>,
          "status": "<Ready, Almost There, or Needs Work>",
          "strong_points": ["<1-2 short bullet points>"],
          "missing_requirements": ["<2-3 critical missing skills or projects>"]
        }}
      ]
    }}
    """
    res = await _call_gemini(prompt)
    if isinstance(res, str):
        import json
        try:
            return json.loads(res.strip('`').strip('json').strip())
        except:
            pass
    if isinstance(res, dict):
        return res
    return {}


async def search_live_jobs(resume_text: str) -> dict:
    """Simulate searching live jobs based on resume skills."""
    prompt = f"""
    You are a career AI. Based on the user's resume, generate 6 highly realistic, CURRENT open job postings they are a strong fit for. 
    Act as if you scraped these from live job boards today. Make them sound like real postings from top-tier tech companies or dynamic startups.
    
    RESUME TEXT:
    {resume_text[:5000]}
    
    INSTRUCTIONS:
    Return ONLY valid JSON in this exact structure:
    {{
      "jobs": [
        {{
          "title": "string",
          "company": "string",
          "location": "string",
          "salary_range": "string (e.g. $120k - $150k)",
          "posted_time": "string (e.g. '2 hours ago')",
          "match_reason": "string (why their resume fits)",
          "apply_url": "string (just put 'https://linkedin.com/jobs' or similar placeholder)"
        }}
      ]
    }}
    """
    res = await _call_gemini(prompt)
    import urllib.parse
    if isinstance(res, dict) and "jobs" in res:
        for job in res.get("jobs", []):
            query = f"{job.get('title', '')} {job.get('company', '')}".strip()
            job["apply_url"] = f"https://www.linkedin.com/jobs/search/?keywords={urllib.parse.quote(query)}"
        return res
    return {"jobs": []}


async def generate_flashcards(resume_text: str) -> list:
    """Generate interview flashcards based on the user's resume."""
    prompt = f"""
    You are an expert technical interviewer. Based on the following resume text, generate 8-10 high-yield technical and behavioral interview flashcards to help the candidate prepare.
    
    RESUME TEXT:
    {resume_text[:6000]}
    
    INSTRUCTIONS:
    Return ONLY a valid JSON array of objects (no markdown fences, no wrapping object) with this structure:
    [
      {{
        "question": "string",
        "answer": "string (clear, high-impact answer)",
        "category": "string (e.g. System Design, React, Python, Core CS, Behavioral)"
      }}
    ]
    """
    res = await _call_gemini(prompt)
    if isinstance(res, str):
        import json
        try:
            parsed = json.loads(res.strip('`').strip('json').strip())
            if isinstance(parsed, list):
                return parsed
        except:
            pass
    if isinstance(res, list):
        return res
    if isinstance(res, dict) and "flashcards" in res and isinstance(res["flashcards"], list):
        return res["flashcards"]
    return [
      {
        "question": "Tell me about yourself and your technical background.",
        "answer": "Focus on your core strengths, recent high-impact projects, and alignment with the role.",
        "category": "Behavioral"
      }
    ]


async def generate_portfolio_data(resume_text: str) -> dict:
    """Generate structured personal portfolio website data from the user's resume."""
    prompt = f"""
    You are an expert web designer. Extract and synthesize data from the candidate's resume to populate a sleek personal portfolio website.
    
    RESUME TEXT:
    {resume_text[:6000]}
    
    INSTRUCTIONS:
    Return ONLY valid JSON in this exact structure:
    {{
      "name": "string (Candidate full name)",
      "tagline": "string (Punchy 1-line professional title)",
      "about": "string (Engaging 2-3 sentence bio)",
      "email": "string (Email or placeholder)",
      "github": "string (GitHub handle or placeholder)",
      "linkedin": "string (LinkedIn handle or placeholder)",
      "skills": ["string (top 6-10 skills)"],
      "projects": [
        {{
          "title": "string",
          "description": "string (1-2 sentences)",
          "technologies": ["string"]
        }}
      ],
      "experience": [
        {{
          "role": "string",
          "company": "string",
          "duration": "string",
          "description": "string"
        }}
      ]
    }}
    """
    res = await _call_gemini(prompt)
    if isinstance(res, str):
        import json
        try:
            return json.loads(res.strip('`').strip('json').strip())
        except:
            pass
    if isinstance(res, dict):
        return res
    return {
      "name": "Alex Morgan",
      "tagline": "Software Engineer & Builder",
      "about": "Passionate developer building high-performance modern web applications.",
      "email": "developer@example.com",
      "github": "github.com",
      "linkedin": "linkedin.com",
      "skills": ["React", "TypeScript", "Python", "FastAPI"],
      "projects": [],
      "experience": []
    }

async def generate_resume_from_scratch(data: dict) -> str:
    """Generate a fully formatted markdown resume from raw text."""
    prompt = BUILDER_PROMPT.format(
        name=data.get("name", ""),
        email=data.get("email", ""),
        phone=data.get("phone", ""),
        target_role=data.get("target_role", ""),
        raw_text=data.get("raw_text", "")
    )
    return await _call_gemini(prompt, return_json=False)



async def generate_cheat_sheet(resume_text: str) -> dict:
    """Generate a personalized interview cheat sheet from resume."""
    prompt = f"""
You are a professional career coach and technical interviewer. Based on the resume below,
generate a highly personalized interview cheat sheet.

RESUME:
{resume_text}

Generate exactly 12 interview questions with model answers tailored to this person's specific experience, skills, and projects.
Mix these types: 2 behavioural, 4 technical (based on their actual tech stack), 3 project-specific, 2 situational, 1 "tell me about yourself".

Return ONLY a valid JSON object exactly like this (no markdown, no code blocks):
{{
  "candidate_name": "<extracted name or 'Candidate'>",
  "target_role": "<extracted or inferred target role>",
  "key_strengths": ["<strength 1>", "<strength 2>", "<strength 3>"],
  "questions": [
    {{
      "type": "technical|behavioural|project|situational|intro",
      "question": "<the interview question>",
      "ideal_answer": "<a strong, detailed model answer using their actual experience>",
      "tip": "<a short 1-line coaching tip>"
    }}
  ]
}}
"""
    res = await _call_gemini(prompt)
    if isinstance(res, dict):
        return res
    if isinstance(res, str):
        try:
            cleaned = res.strip().strip('`').replace('json\n', '').replace('```', '')
            return json.loads(cleaned)
        except Exception:
            pass
    return {
        "candidate_name": "Candidate",
        "target_role": "Software Engineer",
        "key_strengths": ["Problem Solving", "Communication", "Technical Skills"],
        "questions": [
            {
                "type": "intro",
                "question": "Tell me about yourself.",
                "ideal_answer": "I am a dedicated professional with experience in software development, passionate about building impactful products.",
                "tip": "Keep it to 90 seconds. End with why you want THIS role."
            }
        ]
    }


async def generate_career_roadmap(resume_text: str) -> dict:
    """Generate a 1/3/5-year career roadmap based on the resume."""
    prompt = f"""
You are an elite career strategist. Analyze the resume below and generate a highly personalized,
actionable career roadmap for the next 1, 3, and 5 years.

RESUME:
{resume_text}

Return ONLY valid JSON (no markdown, no code blocks) in this exact format:
{{
  "current_level": "<e.g. Junior Developer, Mid-level Engineer>",
  "current_role": "<their current or target role>",
  "industry": "<their industry>",
  "summary": "<2-sentence personalized career trajectory summary>",
  "year_1": {{
    "title": "<Target job title in 1 year>",
    "focus": "<main skill/area to focus on>",
    "milestones": ["<milestone 1>", "<milestone 2>", "<milestone 3>"],
    "skills_to_learn": ["<skill 1>", "<skill 2>", "<skill 3>"],
    "certifications": ["<cert 1>", "<cert 2>"],
    "salary_range": "<expected salary range>"
  }},
  "year_3": {{
    "title": "<Target job title in 3 years>",
    "focus": "<main area>",
    "milestones": ["<milestone 1>", "<milestone 2>", "<milestone 3>"],
    "skills_to_learn": ["<skill 1>", "<skill 2>", "<skill 3>"],
    "certifications": ["<cert 1>"],
    "salary_range": "<expected salary range>"
  }},
  "year_5": {{
    "title": "<Target job title in 5 years>",
    "focus": "<main area>",
    "milestones": ["<milestone 1>", "<milestone 2>", "<milestone 3>"],
    "skills_to_learn": ["<skill 1>", "<skill 2>"],
    "certifications": ["<cert 1>"],
    "salary_range": "<expected salary range>"
  }},
  "action_items": ["<immediate action 1>", "<immediate action 2>", "<immediate action 3>"]
}}
"""
    res = await _call_gemini(prompt)
    if isinstance(res, dict):
        return res
    if isinstance(res, str):
        try:
            cleaned = res.strip().strip('`').replace('json\n', '').replace('```', '')
            return json.loads(cleaned)
        except Exception:
            pass
    return {
        "current_level": "Mid-level Professional",
        "current_role": "Software Engineer",
        "industry": "Technology",
        "summary": "You have a strong foundation. With focused effort, you can reach senior leadership within 5 years.",
        "year_1": {
            "title": "Senior Software Engineer",
            "focus": "Deep technical expertise",
            "milestones": ["Lead a major project", "Mentor a junior", "Contribute to open source"],
            "skills_to_learn": ["System Design", "Cloud Architecture", "Leadership"],
            "certifications": ["AWS Solutions Architect", "Google Cloud Professional"],
            "salary_range": "$90,000 - $120,000"
        },
        "year_3": {
            "title": "Staff Engineer / Tech Lead",
            "focus": "Technical leadership",
            "milestones": ["Lead a team of 5+", "Drive architecture decisions", "Build a product"],
            "skills_to_learn": ["People Management", "Product Strategy", "Executive Communication"],
            "certifications": ["PMP Certification"],
            "salary_range": "$130,000 - $160,000"
        },
        "year_5": {
            "title": "Engineering Manager / Principal Engineer",
            "focus": "Organizational impact",
            "milestones": ["Manage multiple teams", "Own product roadmap", "Build engineering culture"],
            "skills_to_learn": ["Executive Leadership", "Business Strategy"],
            "certifications": ["CTO Certification"],
            "salary_range": "$170,000 - $220,000"
        },
        "action_items": ["Update your LinkedIn today", "Apply to 3 senior roles this week", "Start a side project"]
    }

