import { authService } from './auth';

const BASE_URL = (
  (import.meta.env.VITE_API_URL as string) ||
  (import.meta.env.DEV ? '/api' : 'https://careerfit-ai-0nsp.onrender.com/api')
).replace(/\/$/, '');

async function getAuthHeader(): Promise<Record<string, string>> {
  const customToken = authService.getToken();
  if (customToken) {
    return { Authorization: `Bearer ${customToken}` };
  }
  return {};
}

export async function uploadResume(file: File): Promise<{
  resume_id: string;
  file_name: string;
  file_size: number;
  file_type: string;
}> {
  const headers = await getAuthHeader();
  const form = new FormData();
  form.append('file', file);

  const res = await fetch(`${BASE_URL}/resume/upload`, {
    method: 'POST',
    headers,
    body: form,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Upload failed' }));
    throw new Error(err.detail || 'Upload failed');
  }
  return res.json();
}

export async function analyzeResume(
  resumeId: string,
  userProfile?: Record<string, unknown>
): Promise<{ analysis_id: string; analysis: ResumeAnalysis }> {
  const headers = await getAuthHeader();
  const form = new FormData();
  form.append('resume_id', resumeId);
  if (userProfile) form.append('user_profile', JSON.stringify(userProfile));

  const res = await fetch(`${BASE_URL}/resume/analyze`, {
    method: 'POST',
    headers,
    body: form,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Analysis failed' }));
    throw new Error(err.detail || 'Analysis failed');
  }
  return res.json();
}

export async function getResumeAnalysis(resumeId: string): Promise<{
  analysis_id: string;
  analysis: ResumeAnalysis;
}> {
  const headers = await getAuthHeader();
  const res = await fetch(`${BASE_URL}/resume/${resumeId}/analysis`, { headers });
  if (!res.ok) throw new Error('Failed to fetch analysis');
  return res.json();
}

export async function analyzeJobMatch(
  resumeId: string,
  jobDescription: string
): Promise<{ match_id: string; result: JobMatchResult }> {
  const headers = await getAuthHeader();
  const res = await fetch(`${BASE_URL}/job/analyze`, {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify({ resume_id: resumeId, job_description: jobDescription }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Job match failed' }));
    throw new Error(err.detail || 'Job match failed');
  }
  return res.json();
}

export async function getCompanyRecommendations(
  resumeId: string
): Promise<{ recommendations: CompanyRecommendation[] }> {
  const headers = await getAuthHeader();
  const res = await fetch(`${BASE_URL}/job/companies/recommendations?resume_id=${resumeId}`, {
    headers,
  });
  if (!res.ok) throw new Error('Failed to fetch recommendations');
  return res.json();
}

export async function getLiveJobs(resumeId: string): Promise<{ jobs: LiveJob[] }> {
  const headers = await getAuthHeader();
  const res = await fetch(`${BASE_URL}/job/live-search?resume_id=${resumeId}`, {
    headers,
  });
  if (!res.ok) throw new Error('Failed to fetch live jobs');
  return res.json();
}

export async function getPlacementEligibility(resumeId: string): Promise<PlacementEligibilityResult> {
  const headers = await getAuthHeader();
  const res = await fetch(`${BASE_URL}/job/placement-eligibility?resume_id=${resumeId}`, {
    headers,
  });
  if (!res.ok) throw new Error('Failed to fetch placement eligibility');
  return res.json();
}

export async function generateFlashcards(resumeId: string): Promise<{ flashcards: Flashcard[] }> {
  const headers = await getAuthHeader();
  const res = await fetch(`${BASE_URL}/premium/flashcards?resume_id=${resumeId}`, {
    headers,
  });
  if (!res.ok) throw new Error('Failed to generate flashcards');
  return res.json();
}

export async function generatePortfolio(resumeId: string): Promise<{ portfolio: PortfolioData }> {
  const headers = await getAuthHeader();
  const res = await fetch(`${BASE_URL}/premium/portfolio?resume_id=${resumeId}`, {
    headers,
  });
  if (!res.ok) throw new Error('Failed to generate portfolio');
  return res.json();
}

export async function chatWithAI(messages: { role: string, content: string }[], resumeId?: string): Promise<{ reply: string }> {
  const headers = await getAuthHeader();
  const res = await fetch(`${BASE_URL}/chat`, {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages, resume_id: resumeId }),
  });
  if (!res.ok) throw new Error('Failed to chat with AI');
  return res.json();
}

export async function generateAptitudeTest(resumeId?: string): Promise<{ questions: any[] }> {
  const headers = await getAuthHeader();
  const res = await fetch(`${BASE_URL}/test/generate`, {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify({ resume_id: resumeId }),
  });
  if (!res.ok) throw new Error('Failed to generate aptitude test');
  return res.json();
}

export async function sendInterviewMessage(messages: { role: string; content: string; image?: string }[], resumeId?: string): Promise<{ reply: string }> {
  const headers = await getAuthHeader();
  const res = await fetch(`${BASE_URL}/interview`, {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages, resume_id: resumeId }),
  });
  if (!res.ok) throw new Error('Failed to send interview message');
  return res.json();
}

export async function scoreInterview(messages: { role: string; content: string; image?: string }[], resumeId?: string): Promise<any> {
  const headers = await getAuthHeader();
  const res = await fetch(`${BASE_URL}/interview/score`, {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages, resume_id: resumeId }),
  });
  if (!res.ok) throw new Error('Failed to generate interview scorecard');
  return res.json();
}

export async function generateCoverLetter(resumeId: string, jobDescription: string, companyName: string): Promise<{ cover_letter: string }> {
  const headers = await getAuthHeader();
  const res = await fetch(`${BASE_URL}/resume/cover-letter`, {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify({ resume_id: resumeId, job_description: jobDescription, company_name: companyName }),
  });
  if (!res.ok) throw new Error('Failed to generate cover letter');
  return res.json();
}

export async function getSkillsGapAnalysis(resumeId: string, targetRole: string): Promise<{ analysis: any }> {
  const headers = await getAuthHeader();
  const res = await fetch(`${BASE_URL}/resume/gap-analysis`, {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify({ resume_id: resumeId, target_role: targetRole }),
  });
  if (!res.ok) throw new Error('Failed to fetch gap analysis');
  return res.json();
}

export async function getAnalysisHistory(): Promise<{ history: HistoryItem[] }> {
  const headers = await getAuthHeader();
  const res = await fetch(`${BASE_URL}/resume/history`, { headers });
  if (!res.ok) throw new Error('Failed to fetch history');
  return res.json();
}

export async function getDashboardAnalytics(): Promise<{ trend: any[], radar: any[] }> {
  const headers = await getAuthHeader();
  const res = await fetch(`${BASE_URL}/resume/analytics`, { headers });
  if (!res.ok) throw new Error('Failed to fetch analytics');
  return res.json();
}

export async function deleteResume(resumeId: string): Promise<void> {
  const headers = await getAuthHeader();
  const res = await fetch(`${BASE_URL}/resume/${resumeId}`, {
    method: 'DELETE',
    headers,
  });
  if (!res.ok) throw new Error('Failed to delete resume');
}

export async function rewriteResume(resumeId: string): Promise<{ rewritten_resume: string }> {
  const headers = await getAuthHeader();
  const res = await fetch(`${BASE_URL}/resume/rewrite`, {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify({ resume_id: resumeId }),
  });
  if (!res.ok) throw new Error('Failed to rewrite resume');
  return res.json();
}

export async function reviewLinkedInProfile(profileText: string, profileUrl?: string): Promise<{ scorecard: LinkedInScorecard }> {
  const headers = await getAuthHeader();
  const res = await fetch(`${BASE_URL}/linkedin/review`, {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify({ profile_text: profileText, profile_url: profileUrl }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to review LinkedIn profile' }));
    throw new Error(err.detail || 'Failed to review LinkedIn profile');
  }
  return res.json();
}

export async function reviewGithubProfile(username: string): Promise<{ scorecard: GithubScorecard }> {
  const headers = await getAuthHeader();
  const res = await fetch(`${BASE_URL}/github/review`, {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify({ username }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to review GitHub profile' }));
    throw new Error(err.detail || 'Failed to review GitHub profile');
  }
  return res.json();
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ResumeAnalysis {
  overall_score: number;
  ats_score: number;
  content_score: number;
  skills_score: number;
  formatting_score: number;
  grammar_score: number;
  strengths: { title: string; description: string }[];
  weaknesses: { title: string; description: string }[];
  ats_analysis: {
    strengths: string[];
    problems: { issue: string; explanation: string }[];
  };
  missing_keywords: string[];
  matching_keywords: string[];
  recommended_keywords: string[];
  grammar_issues: {
    original: string;
    problem: string;
    suggestion: string;
    explanation: string;
  }[];
  suggestions: {
    priority: 'high' | 'medium' | 'low';
    problem: string;
    why_it_matters: string;
    suggested_improvement: string;
  }[];
  skills: {
    name: string;
    category: string;
    relevance: string;
  }[];
  experience_analysis: {
    original: string;
    quality: 'strong' | 'weak';
    suggestion: string;
  }[];
  project_analysis: {
    title: string;
    current_description: string;
    quality: 'strong' | 'weak';
    suggestion: string;
  }[];
  contact_info_detected: boolean;
  education_detected: boolean;
  experience_detected: boolean;
  skills_section_detected: boolean;
}

export interface JobMatchResult {
  match_score: number;
  matching_items: string[];
  missing_items: string[];
  recommendations: string[];
  company_recommendations: CompanyRecommendation[];
}

export interface CompanyRecommendation {
  company_name: string;
  role: string;
  why_match: string;
  matching_skills: string[];
  missing_requirements: string[];
  eligibility_percentage: number;
  experience_required: string;
  location: string;
  work_type: 'remote' | 'hybrid' | 'on-site';
  industry?: string;
  company_size?: string;
}

export interface HistoryItem {
  resume_id: string;
  file_name: string;
  uploaded_at: string;
  analysis: {
    id: string;
    overall_score: number;
    ats_score: number;
    grammar_score: number;
    created_at: string;
  } | null;
}

export interface LinkedInScorecard {
  overall_score: number;
  grade: string;
  headline: {
    score: number;
    current_text: string;
    feedback: string;
    rewritten: string;
  };
  about: {
    score: number;
    feedback: string;
    rewritten: string;
  };
  experience: {
    score: number;
    feedback: string;
    rewritten: string;
  };
  skills: {
    score: number;
    feedback: string;
    missing_keywords: string[];
  };
  quick_wins: {
    priority: number;
    action: string;
    reason: string;
  }[];
}

export interface GithubScorecard {
  overall_score: number;
  grade: string;
  readme: {
    score: number;
    feedback: string;
    action: string;
  };
  repositories: {
    score: number;
    feedback: string;
    action: string;
  };
  languages: {
    score: number;
    feedback: string;
    missing_skills: string[];
  };
  quick_wins: {
    priority: number;
    action: string;
    reason: string;
  }[];
}

export interface LiveJob {
  title: string;
  company: string;
  location: string;
  salary_range: string;
  posted_time: string;
  match_reason: string;
  apply_url: string;
}

export interface Flashcard {
  question: string;
  answer: string;
  category: string;
}

export interface PortfolioData {
  name: string;
  tagline: string;
  about: string;
  email: string;
  github: string;
  linkedin: string;
  skills: string[];
  projects: {
    title: string;
    description: string;
    technologies: string[];
  }[];
  experience: {
    role: string;
    company: string;
    duration: string;
    description: string;
  }[];
}

export interface PlacementEligibilityResult {
  overall_readiness_score: number;
  tiers: {
    tier: string;
    match_percentage: number;
    status: string;
    strong_points: string[];
    missing_requirements: string[];
  }[];
}

export async function generateResumeFromScratch(data: {
  name: string;
  email: string;
  phone: string;
  target_role: string;
  raw_text: string;
}): Promise<{ resume_markdown: string; resume_id?: string }> {
  const headers = await getAuthHeader();
  const res = await fetch(`${BASE_URL}/resume/builder/generate`, {
    method: 'POST',
    headers: {
      ...headers,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to generate resume' }));
    throw new Error(err.detail || 'Failed to generate resume');
  }
  return res.json();
}

// ── Career Tools ─────────────────────────────────────────────────────────────

export async function getCheatSheet(resumeId: string): Promise<{ cheat_sheet: any }> {
  const headers = await getAuthHeader();
  const res = await fetch(`${BASE_URL}/career/cheat-sheet`, {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify({ resume_id: resumeId }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to generate cheat sheet' }));
    throw new Error(err.detail || 'Failed to generate cheat sheet');
  }
  return res.json();
}

export async function getCareerRoadmap(resumeId: string): Promise<{ roadmap: any }> {
  const headers = await getAuthHeader();
  const res = await fetch(`${BASE_URL}/career/career-roadmap`, {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify({ resume_id: resumeId }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to generate roadmap' }));
    throw new Error(err.detail || 'Failed to generate roadmap');
  }
  return res.json();
}

export async function getJobTracker(): Promise<{ jobs: any[] }> {
  const headers = await getAuthHeader();
  const res = await fetch(`${BASE_URL}/career/tracker`, { headers });
  if (!res.ok) throw new Error('Failed to load tracker');
  return res.json();
}

export async function addTrackerJob(job: { title: string; company: string; url?: string; notes?: string; status?: string }): Promise<{ job: any }> {
  const headers = await getAuthHeader();
  const res = await fetch(`${BASE_URL}/career/tracker`, {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify(job),
  });
  if (!res.ok) throw new Error('Failed to add job');
  return res.json();
}

export async function updateTrackerJob(jobId: string, update: { status?: string; notes?: string }): Promise<void> {
  const headers = await getAuthHeader();
  await fetch(`${BASE_URL}/career/tracker/${jobId}`, {
    method: 'PATCH',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify(update),
  });
}

export async function deleteTrackerJob(jobId: string): Promise<void> {
  const headers = await getAuthHeader();
  await fetch(`${BASE_URL}/career/tracker/${jobId}`, { method: 'DELETE', headers });
}

export interface UserProfileData {
  id?: string;
  email?: string;
  full_name?: string;
  location?: string;
  education?: string;
  degree?: string;
  specialization?: string;
  graduation_year?: number;
  experience_level?: string;
  years_of_experience?: number;
  preferred_role?: string;
  preferred_industry?: string;
  preferred_location?: string;
  expected_salary?: string;
  skills?: string[];
  work_type?: string;
}

export async function getUserProfile(): Promise<{ profile: UserProfileData }> {
  const headers = await getAuthHeader();
  const res = await fetch(`${BASE_URL}/auth/profile`, { headers });
  if (!res.ok) throw new Error('Failed to load profile');
  return res.json();
}

export async function updateUserProfile(profile: UserProfileData): Promise<{ profile: UserProfileData; message: string }> {
  const headers = await getAuthHeader();
  const res = await fetch(`${BASE_URL}/auth/profile`, {
    method: 'PUT',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify(profile),
  });
  if (!res.ok) throw new Error('Failed to update profile');
  return res.json();
}

export interface SystemDiagnostics {
  status: string;
  database: string;
  ai_engine: string;
  ml_classifier: string;
  database_provider?: string;
  auth_engine?: string;
  version: string;
}

export async function getSystemDiagnostics(): Promise<SystemDiagnostics> {
  const res = await fetch(`${BASE_URL}/auth/diagnostics`);
  if (!res.ok) throw new Error('Failed to load diagnostics');
  return res.json();
}

