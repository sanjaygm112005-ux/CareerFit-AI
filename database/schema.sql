-- =============================================================================
-- AI Resume Analyzer – Supabase Database Schema
-- Run this entire script in the Supabase SQL Editor
-- =============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── Profiles ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
  id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email           TEXT,
  full_name       TEXT,
  location        TEXT,
  education       TEXT,
  degree          TEXT,
  specialization  TEXT,
  graduation_year INT,
  experience_level TEXT,
  years_of_experience FLOAT,
  preferred_role       TEXT,
  preferred_industry   TEXT,
  preferred_location   TEXT,
  expected_salary      TEXT,
  skills               TEXT[],
  work_type            TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ── Resumes ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.resumes (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id        UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_name      TEXT NOT NULL,
  file_url       TEXT,
  file_type      TEXT,
  file_size      BIGINT,
  extracted_text TEXT,
  uploaded_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ── Resume Analyses ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.resume_analyses (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  resume_id        UUID NOT NULL REFERENCES public.resumes(id) ON DELETE CASCADE,
  overall_score    INT,
  ats_score        INT,
  content_score    INT,
  skills_score     INT,
  formatting_score INT,
  grammar_score    INT,
  analysis_json    TEXT,   -- Full JSON blob from AI
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ── Skills ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.skills (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  resume_id   UUID NOT NULL REFERENCES public.resumes(id) ON DELETE CASCADE,
  skill_name  TEXT NOT NULL,
  category    TEXT,
  relevance   TEXT
);

-- ── Job Matches ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.job_matches (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  resume_id        UUID NOT NULL REFERENCES public.resumes(id) ON DELETE CASCADE,
  job_description  TEXT,
  match_score      INT,
  matching_items   TEXT,   -- JSON array as text
  missing_items    TEXT,   -- JSON array as text
  recommendations  TEXT,   -- JSON array as text
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ── Job Tracker ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.job_tracker (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title      TEXT NOT NULL,
  company    TEXT NOT NULL,
  url        TEXT,
  notes      TEXT,
  status     TEXT NOT NULL DEFAULT 'saved',  -- saved|applied|interviewing|offer|rejected
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Companies ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.companies (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL,
  industry    TEXT,
  website     TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── Company Requirements (Placement Eligibility) ──────────────────────────────
CREATE TABLE IF NOT EXISTS public.company_requirements (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id          UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  job_role            TEXT NOT NULL,
  minimum_cgpa        FLOAT,
  allowed_branches    TEXT[], -- e.g. ['CSE', 'ISE', 'ECE']
  graduation_year     INT,
  maximum_backlogs    INT,
  required_skills     TEXT[],
  experience_required TEXT,
  location            TEXT,
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ── ML Predictions ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.ml_predictions (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  resume_id        UUID NOT NULL REFERENCES public.resumes(id) ON DELETE CASCADE,
  predicted_role   TEXT,
  confidence_score FLOAT,
  model_version    TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- Row Level Security
-- =============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resumes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resume_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_tracker ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ml_predictions ENABLE ROW LEVEL SECURITY;

-- companies and company_requirements: everyone can read, admins only can edit (will rely on application logic for admin auth)
CREATE POLICY "Public read companies"
  ON public.companies FOR SELECT
  USING (true);

CREATE POLICY "Public read company requirements"
  ON public.company_requirements FOR SELECT
  USING (true);

-- ml_predictions: users can only see their own predictions
CREATE POLICY "Users read own ML predictions"
  ON public.ml_predictions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.resumes r
      WHERE r.id = ml_predictions.resume_id
        AND r.user_id = auth.uid()
    )
  );

-- profiles: users can only see/edit their own
CREATE POLICY "Users manage own profile"
  ON public.profiles FOR ALL
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- resumes: users can only see/edit their own
CREATE POLICY "Users manage own resumes"
  ON public.resumes FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- resume_analyses: users can only see analyses for their own resumes
CREATE POLICY "Users read own analyses"
  ON public.resume_analyses FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.resumes r
      WHERE r.id = resume_analyses.resume_id
        AND r.user_id = auth.uid()
    )
  );

-- skills: same as analyses
CREATE POLICY "Users read own skills"
  ON public.skills FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.resumes r
      WHERE r.id = skills.resume_id
        AND r.user_id = auth.uid()
    )
  );

-- job_matches: same as analyses
CREATE POLICY "Users read own job matches"
  ON public.job_matches FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.resumes r
      WHERE r.id = job_matches.resume_id
        AND r.user_id = auth.uid()
    )
  );

-- job_tracker: users can only manage their own saved jobs
CREATE POLICY "Users manage own job tracker"
  ON public.job_tracker FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- =============================================================================
-- Storage Bucket (run separately or via Supabase Dashboard)
-- =============================================================================
-- In Supabase Dashboard → Storage → Create bucket "resumes" (private)
-- Then add policy: authenticated users can upload to their own folder
-- INSERT policy: (auth.uid())::text = (storage.foldername(name))[1]
