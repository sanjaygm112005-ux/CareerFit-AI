import httpx
import json
import os
from dotenv import load_dotenv

load_dotenv()
api_key = os.getenv("GEMINI_API_KEY")

url = f"https://generativelanguage.googleapis.com/v1beta/models?key={api_key}"
response = httpx.get(url)
models = response.json().get('models', [])
for m in models:
    if "flash" in m.get('name', '').lower() and "generateContent" in m.get('supportedGenerationMethods', []):
        print(m['name'])
