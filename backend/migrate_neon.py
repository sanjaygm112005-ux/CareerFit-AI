import os
import sys
import psycopg2
from dotenv import load_dotenv

load_dotenv()

def migrate_neon(database_url: str = None):
    url = database_url or os.getenv("DATABASE_URL") or os.getenv("NEON_DATABASE_URL")
    if not url:
        print("❌ Error: No DATABASE_URL or NEON_DATABASE_URL found.")
        print("Please provide the connection string as an argument or in backend/.env")
        return False

    print("🔗 Connecting to Neon Database...")
    try:
        conn = psycopg2.connect(url)
        conn.autocommit = True
        cur = conn.cursor()
        print("✅ Connection successful!")

        print("📦 Creating extensions and schemas...")
        cur.execute('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";')
        cur.execute('CREATE SCHEMA IF NOT EXISTS auth;')
        cur.execute('''
            CREATE TABLE IF NOT EXISTS auth.users (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                email TEXT UNIQUE,
                created_at TIMESTAMPTZ DEFAULT NOW()
            );
        ''')

        # Insert default user so foreign keys are immediately satisfied
        cur.execute('''
            INSERT INTO auth.users (id, email)
            VALUES ('977a1c66-8ad3-4083-8951-b28bc506d3b7', 'student@careerfit.ai')
            ON CONFLICT (id) DO NOTHING;
        ''')

        print("📦 Provisioning tables...")
        cur.execute('''
            CREATE TABLE IF NOT EXISTS public.profiles (
                id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
                email TEXT,
                full_name TEXT,
                location TEXT,
                education TEXT,
                degree TEXT,
                specialization TEXT,
                graduation_year INT,
                experience_level TEXT,
                years_of_experience FLOAT,
                preferred_role TEXT,
                preferred_industry TEXT,
                preferred_location TEXT,
                expected_salary TEXT,
                skills TEXT[],
                work_type TEXT,
                created_at TIMESTAMPTZ DEFAULT NOW(),
                updated_at TIMESTAMPTZ DEFAULT NOW()
            );
        ''')

        cur.execute('''
            CREATE TABLE IF NOT EXISTS public.resumes (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
                file_name TEXT NOT NULL,
                file_url TEXT,
                file_type TEXT,
                file_size BIGINT,
                extracted_text TEXT,
                uploaded_at TIMESTAMPTZ DEFAULT NOW()
            );
        ''')

        cur.execute('''
            CREATE TABLE IF NOT EXISTS public.resume_analyses (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                resume_id UUID NOT NULL REFERENCES public.resumes(id) ON DELETE CASCADE,
                overall_score INT,
                ats_score INT,
                content_score INT,
                skills_score INT,
                formatting_score INT,
                grammar_score INT,
                analysis_json TEXT,
                created_at TIMESTAMPTZ DEFAULT NOW()
            );
        ''')

        cur.execute('''
            CREATE TABLE IF NOT EXISTS public.job_matches (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                resume_id UUID NOT NULL REFERENCES public.resumes(id) ON DELETE CASCADE,
                job_description TEXT,
                match_score INT,
                matching_items TEXT,
                missing_items TEXT,
                recommendations TEXT,
                created_at TIMESTAMPTZ DEFAULT NOW()
            );
        ''')

        cur.execute('''
            CREATE TABLE IF NOT EXISTS public.job_tracker (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
                title TEXT NOT NULL,
                company TEXT NOT NULL,
                url TEXT,
                notes TEXT,
                status TEXT NOT NULL DEFAULT 'saved',
                created_at TIMESTAMPTZ DEFAULT NOW()
            );
        ''')

        cur.execute('''
            CREATE TABLE IF NOT EXISTS public.companies (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                name TEXT NOT NULL,
                industry TEXT,
                website TEXT,
                created_at TIMESTAMPTZ DEFAULT NOW()
            );
        ''')

        cur.execute('''
            CREATE TABLE IF NOT EXISTS public.company_requirements (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
                job_role TEXT NOT NULL,
                minimum_cgpa FLOAT NOT NULL,
                required_skills TEXT[] NOT NULL,
                eligible_branches TEXT[],
                allowed_backlogs INT DEFAULT 0,
                created_at TIMESTAMPTZ DEFAULT NOW()
            );
        ''')

        cur.execute('''
            CREATE TABLE IF NOT EXISTS public.career_roadmaps (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                resume_id UUID NOT NULL REFERENCES public.resumes(id) ON DELETE CASCADE,
                target_role TEXT,
                roadmap_json TEXT,
                created_at TIMESTAMPTZ DEFAULT NOW()
            );
        ''')

        print("🌱 Seeding initial companies & eligibility requirements...")
        demo_companies = [
            ("Google", "Technology / Search & Cloud", "Software Engineer (SWE)", 8.0, ["Data Structures", "Algorithms", "C++", "System Design", "Python"]),
            ("Amazon", "E-Commerce / Cloud (AWS)", "Software Development Engineer (SDE-1)", 7.5, ["Java", "Data Structures", "AWS", "Problem Solving", "React"]),
            ("Microsoft", "Enterprise Software & Cloud", "Software Engineer - Azure Core", 7.5, ["C#", "Cloud Computing", "Algorithms", "Docker", "Python"]),
            ("TCS (Tata Consultancy Services)", "IT Services & Consulting", "Systems Engineer / Digital Cadre", 6.5, ["SQL", "Aptitude", "Java", "Python"]),
            ("Infosys", "IT Services & Consulting", "Specialist Programmer (SP)", 7.0, ["Algorithms", "Database Systems", "Python", "React"]),
        ]

        for comp_name, industry, role, min_cgpa, req_skills in demo_companies:
            cur.execute("SELECT id FROM public.companies WHERE name = %s;", (comp_name,))
            row = cur.fetchone()
            if row:
                comp_id = row[0]
            else:
                cur.execute(
                    "INSERT INTO public.companies (name, industry) VALUES (%s, %s) RETURNING id;",
                    (comp_name, industry)
                )
                comp_id = cur.fetchone()[0]

            cur.execute("SELECT id FROM public.company_requirements WHERE company_id = %s AND job_role = %s;", (comp_id, role))
            if not cur.fetchone():
                cur.execute(
                    """
                    INSERT INTO public.company_requirements (company_id, job_role, minimum_cgpa, required_skills)
                    VALUES (%s, %s, %s, %s);
                    """,
                    (comp_id, role, min_cgpa, req_skills)
                )

        cur.close()
        conn.close()
        print("🎉 Neon Database migration and seeding completed successfully!")
        return True

    except Exception as e:
        print(f"❌ Error during Neon migration: {e}")
        return False

if __name__ == "__main__":
    db_url = sys.argv[1] if len(sys.argv) > 1 else None
    success = migrate_neon(db_url)
    sys.exit(0 if success else 1)
