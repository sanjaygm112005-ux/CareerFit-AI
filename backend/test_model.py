import httpx
import json
import os
from dotenv import load_dotenv

load_dotenv()
api_key = os.getenv("GEMINI_API_KEY")

url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key={api_key}"
payload = {
    "contents": [{"parts": [{"text": "Hello, how are you?"}]}]
}
response = httpx.post(url, json=payload)
print(response.status_code)
print(response.json())
