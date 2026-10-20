import os
import psycopg2
from psycopg2.extras import RealDictCursor
from dotenv import load_dotenv

load_dotenv()

url = os.getenv("DATABASE_URL")
print("Connecting with URL:", url[:40] + "...")

conn = psycopg2.connect(url)
cur = conn.cursor(cursor_factory=RealDictCursor)
cur.execute("SELECT id, name, industry FROM public.companies ORDER BY name;")
rows = cur.fetchall()
print(f"Found {len(rows)} companies in Neon Database:")
for r in rows:
    print(f" - {r['name']} ({r['industry']})")

cur.execute("SELECT count(*) as count FROM public.company_requirements;")
req_count = cur.fetchone()
print(f"Found {req_count['count']} company requirements in Neon Database.")

cur.close()
conn.close()
print("Neon verification successful!")
