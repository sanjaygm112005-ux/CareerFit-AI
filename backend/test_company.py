import asyncio
from app.services.ai_service import get_company_recommendations

async def run():
    resume_text = "Experienced software engineer with 5 years in Python and React. Developed scalable microservices."
    res = await get_company_recommendations(resume_text, {})
    print(res)

if __name__ == "__main__":
    asyncio.run(run())
